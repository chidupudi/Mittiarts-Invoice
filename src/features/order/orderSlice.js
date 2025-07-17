// src/features/order/orderSlice.js - Enhanced Mitti Arts Order Management with Dynamic Branches and SMS Integration
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import moment from 'moment'; // Imported for date calculations in analytics
import firebaseService from '../../services/firebaseService';
import invoiceService from '../../services/invoiceService';
import smsService from '../../services/smsService'; // Added for SMS integration
import { updateStock } from '../products/productSlice';
import { updateCustomerStats } from '../customer/customerSlice';

// Helper function to safely handle SMS operations without affecting order creation
const handleSMSDelivery = async (orderId, operation, context = '') => {
  try {
    await operation();
  } catch (error) {
    console.error(`SMS operation failed (${context}):`, error);
    // SMS failures should not affect core business operations
    // Log the error but continue processing
  }
};

// Default branch info for fallback
const DEFAULT_BRANCH_INFO = {
  id: 'default',
  name: 'Mitti Arts Main Store',
  address: 'Hyderabad, Telangana',
  phone: '+91 98765 43210',
  email: 'info@mittiarts.com',
  gst: '36ABCDE1234F1Z5',
  icon: '🏪'
};

// Fetch all orders with enhanced filtering for Mitti Arts
export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        limit: filters.limit || 100,
        orderBy: { field: 'createdAt', direction: 'desc' }
      };

      // Build where conditions for complex filtering
      const whereConditions = [];
      
      if (filters.status) {
        whereConditions.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.businessType) {
        whereConditions.push({ field: 'businessType', operator: '==', value: filters.businessType });
      }
      
      if (filters.branch) {
        whereConditions.push({ field: 'branch', operator: '==', value: filters.branch });
      }
      
      if (filters.isAdvanceBilling !== undefined) {
        whereConditions.push({ field: 'isAdvanceBilling', operator: '==', value: filters.isAdvanceBilling });
      }
      
      if (filters.startDate) {
        whereConditions.push({ field: 'createdAt', operator: '>=', value: new Date(filters.startDate) });
      }
      
      if (filters.endDate) {
        whereConditions.push({ field: 'createdAt', operator: '<=', value: new Date(filters.endDate) });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      let orders = await firebaseService.getAll('orders', options);

      // Client-side filtering for complex queries
      if (filters.customerId) {
        orders = orders.filter(order => order.customerId === filters.customerId);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        orders = orders.filter(order => 
          order.orderNumber?.toLowerCase().includes(searchTerm) ||
          order.customer?.name?.toLowerCase().includes(searchTerm) ||
          order.customer?.phone?.includes(searchTerm)
        );
      }

      // Filter by payment status for advance billing
      if (filters.paymentStatus) {
        orders = orders.filter(order => {
          if (filters.paymentStatus === 'partial') {
            return order.isAdvanceBilling && order.remainingAmount > 0;
          }
          if (filters.paymentStatus === 'complete') {
            return !order.isAdvanceBilling || order.remainingAmount <= 0;
          }
          return true;
        });
      }

      // Enrich orders with customer data
      const customerIds = [...new Set(orders.filter(o => o.customerId).map(o => o.customerId))];
      const customers = {};
      
      if (customerIds.length > 0) {
        for (const customerId of customerIds) {
          try {
            const customer = await firebaseService.getById('customers', customerId);
            customers[customerId] = customer;
          } catch (error) {
            console.warn(`Customer ${customerId} not found:`, error);
          }
        }
      }

      // Enrich orders with branch info and calculations
      orders = orders.map(order => {
        const enrichedOrder = {
          ...order,
          customer: order.customerId ? customers[order.customerId] : null,
          branchInfo: order.branchInfo || DEFAULT_BRANCH_INFO
        };

        // Calculate payment status for advance billing
        if (enrichedOrder.isAdvanceBilling) {
          enrichedOrder.paymentStatus = enrichedOrder.remainingAmount > 0 ? 'partial' : 'complete';
          enrichedOrder.paymentProgress = enrichedOrder.total > 0 
            ? ((enrichedOrder.advanceAmount || 0) / enrichedOrder.total) * 100 
            : 0;
        } else {
          enrichedOrder.paymentStatus = 'complete';
          enrichedOrder.paymentProgress = 100;
        }

        return enrichedOrder;
      });

      return orders;
    } catch (error) {
      console.error('Error fetching Mitti Arts orders:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Create order with enhanced Mitti Arts business logic and SMS integration
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue, dispatch }) => {
    try {
      console.log('Creating Mitti Arts order:', orderData);

      // Validate required Mitti Arts fields
      if (!orderData.businessType) {
        throw new Error('Business type (retail/wholesale) is required');
      }
      
      if (!orderData.branch) {
        throw new Error('Branch selection is required');
      }

      // Use provided branch info or create default
      const branchInfo = orderData.branchInfo || {
        ...DEFAULT_BRANCH_INFO,
        id: orderData.branch,
        name: `Branch ${orderData.branch}`
      };

      // Calculate enhanced totals for Mitti Arts
      const subtotal = orderData.subtotal || orderData.items.reduce((sum, item) => 
        sum + ((item.originalPrice || item.price) * item.quantity), 0);
      
      const negotiatedDiscount = orderData.discount || (subtotal - orderData.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0));
      
      const afterNegotiation = subtotal - negotiatedDiscount;

      // Calculate wholesale discount (5% for orders above ₹10,000)
      let wholesaleDiscount = 0;
      if (orderData.businessType === 'wholesale' && afterNegotiation > 10000) {
        wholesaleDiscount = afterNegotiation * 0.05;
      }

      const finalTotal = afterNegotiation - wholesaleDiscount;

      // Validate advance billing amounts
      let advanceAmount = 0;
      let remainingAmount = 0;
      
      if (orderData.isAdvanceBilling) {
        advanceAmount = orderData.advanceAmount || 0;
        if (advanceAmount <= 0 || advanceAmount > finalTotal) {
          throw new Error('Invalid advance amount');
        }
        remainingAmount = finalTotal - advanceAmount;
      }

      // Generate order number with dynamic branch prefix
      const branchPrefix = branchInfo.name ? 
        branchInfo.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) : 'MA';
      
      const orderNumber = `${branchPrefix}-${Date.now().toString().slice(-8)}`;

      // Helper to deeply remove undefined fields
      function removeUndefinedDeep(obj) {
        if (Array.isArray(obj)) {
          return obj.map(removeUndefinedDeep);
        } else if (obj && typeof obj === 'object') {
          const cleaned = {};
          Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
              cleaned[key] = removeUndefinedDeep(obj[key]);
            }
          });
          return cleaned;
        }
        return obj;
      }

      // Create comprehensive order object
      const enhancedOrderDataRaw = {
        // Basic order info
        orderNumber,
        customerId: orderData.customerId,
        
        // Mitti Arts business fields
        businessType: orderData.businessType,
        branch: orderData.branch,
        branchInfo,
        
        // Advanced billing fields
        isAdvanceBilling: orderData.isAdvanceBilling || false,
        advanceAmount,
        remainingAmount,
        paymentStatus: orderData.isAdvanceBilling ? 'partial' : 'complete',
        
        // Enhanced items with business context
        items: orderData.items.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category || 'Pottery',
            isDynamic: item.product.isDynamic
          },
          quantity: item.quantity,
          originalPrice: item.originalPrice || item.price,
          currentPrice: item.currentPrice || item.price,
          price: item.price,
          businessType: item.businessType || orderData.businessType,
          discount: item.originalPrice > 0 ? 
            ((item.originalPrice - item.price) / item.originalPrice) * 100 : 0,
          lineTotal: item.price * item.quantity
        })),
        
        // Financial calculations
        subtotal,
        negotiatedDiscount,
        discountPercentage: subtotal > 0 ? (negotiatedDiscount / subtotal) * 100 : 0,
        wholesaleDiscount,
        wholesaleDiscountPercentage: afterNegotiation > 0 ? (wholesaleDiscount / afterNegotiation) * 100 : 0,
        afterDiscount: afterNegotiation,
        total: finalTotal,
        
        // Payment details
        paymentMethod: orderData.paymentMethod || 'Cash',
        paymentDate: new Date(),
        
        // Order status and tracking
        status: 'completed', // Orders are completed upon creation in Mitti Arts
        orderType: orderData.isAdvanceBilling ? 'advance' : 'full',
        
        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Analytics fields for reporting
        analytics: {
          itemCount: orderData.items.length,
          totalQuantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
          averageItemPrice: orderData.items.length > 0 ? 
            orderData.items.reduce((sum, item) => sum + item.price, 0) / orderData.items.length : 0,
          profitMargin: calculateProfitMargin(orderData.items, finalTotal),
          customerType: orderData.businessType,
          seasonality: getSeasonality(),
          branchRevenue: finalTotal
        }
      };
      const enhancedOrderData = removeUndefinedDeep(enhancedOrderDataRaw);

      // Create the order in Firebase
      const order = await firebaseService.create('orders', enhancedOrderData);
      console.log('Mitti Arts order created successfully:', order.id);

      // Get customer data for SMS and invoice
      let customer = null;
      if (orderData.customerId) {
        try {
          customer = await firebaseService.getById('customers', orderData.customerId);
        } catch (error) {
          console.warn('Could not fetch customer for SMS/invoice:', error);
        }
      }

      // Create enhanced invoice with all business context
      try {
        await invoiceService.createInvoice({
          ...order,
          customer: customer
        });
        console.log('Invoice created for order:', order.id);
      } catch (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
        // Don't fail the order creation if invoice creation fails
      }

      // 🆕 SIMPLIFIED SMS INTEGRATION
      try {
        const customerPhone = customer?.phone;
        const customerName = customer?.name || 'Valued Customer';

        if (customerPhone && smsService.isValidPhoneNumber(customerPhone)) {
          console.log('📱 Sending SMS to customer...');

          // Generate bill token for secure sharing
          const billToken = smsService.generateBillToken();

          // Store bill token in order
          await firebaseService.update('orders', order.id, {
            billToken: billToken,
            billTokenCreatedAt: new Date()
          });

          let smsResult;

          if (orderData.isAdvanceBilling) {
            // Send advance payment SMS
            smsResult = await smsService.sendAdvancePaymentSMS(
              customerPhone,
              customerName,
              orderNumber,
              advanceAmount,
              remainingAmount,
              billToken
            );
          } else {
            // Send regular bill SMS
            smsResult = await smsService.sendBillSMS(
              customerPhone,
              customerName,
              orderNumber,
              billToken,
              finalTotal
            );
          }

          // Update order with SMS status
          if (smsResult && smsResult.success) {
            console.log('✅ SMS sent successfully:', smsResult.messageId);
            await firebaseService.update('orders', order.id, {
              smsDelivery: {
                status: 'sent',
                messageId: smsResult.messageId,
                sentAt: new Date(),
                phoneNumber: smsService.cleanPhoneNumber(customerPhone),
                provider: smsResult.provider || 'Fast2SMS',
                billToken: billToken
              }
            });
          } else {
            console.warn('⚠️ SMS sending failed:', smsResult?.error);
            await firebaseService.update('orders', order.id, {
              smsDelivery: {
                status: 'failed',
                error: smsResult?.error || 'SMS sending failed',
                failedAt: new Date(),
                phoneNumber: smsService.cleanPhoneNumber(customerPhone),
                billToken: billToken
              }
            });
          }
        } else {
          console.log('📝 No valid phone number for SMS:', customerPhone);
          await firebaseService.update('orders', order.id, {
            smsDelivery: {
              status: 'skipped',
              reason: customerPhone ? 'Invalid phone number format' : 'No phone number provided',
              attemptedAt: new Date()
            }
          });
        }
      } catch (smsError) {
        console.error('❌ SMS service error (non-critical):', smsError);
        // Don't fail order creation if SMS fails
        try {
          await firebaseService.update('orders', order.id, {
            smsDelivery: {
              status: 'error',
              error: smsError.message || 'SMS service unavailable',
              errorAt: new Date()
            }
          });
        } catch (updateError) {
          console.error('Failed to update SMS error status:', updateError);
        }
      }

      // Update product stock for non-dynamic products
      for (const item of orderData.items) {
        if (!item.product.isDynamic && item.product.id && !item.product.id.startsWith('temp_')) {
          try {
            await dispatch(updateStock({ 
              id: item.product.id, 
              stockChange: -item.quantity 
            }));
          } catch (stockError) {
            console.warn(`Failed to update stock for product ${item.product.id}:`, stockError);
          }
        }
      }

      // Update customer stats and preferences
      if (orderData.customerId) {
        try {
          await dispatch(updateCustomerStats({ 
            customerId: orderData.customerId, 
            orderAmount: finalTotal,
            businessType: orderData.businessType,
            branch: orderData.branch,
            isAdvanceBilling: orderData.isAdvanceBilling
          }));
        } catch (customerError) {
          console.warn(`Failed to update customer stats:`, customerError);
        }
      }

      // Create advance payment tracking if applicable
      if (orderData.isAdvanceBilling) {
        try {
          await createAdvancePaymentRecord(order.id, {
            orderId: order.id,
            orderNumber,
            customerId: orderData.customerId,
            totalAmount: finalTotal,
            advanceAmount,
            remainingAmount,
            paymentMethod: orderData.paymentMethod,
            branchInfo,
            dueDate: calculateDueDate(orderData.businessType),
            status: 'pending'
          });
        } catch (advanceError) {
          console.warn('Failed to create advance payment record:', advanceError);
        }
      }

      return order;
    } catch (error) {
      console.error('Error creating Mitti Arts order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get single order with enhanced details
export const getOrder = createAsyncThunk(
  'orders/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const order = await firebaseService.getById('orders', id);
      
      // Enrich with customer data
      if (order.customerId) {
        try {
          const customer = await firebaseService.getById('customers', order.customerId);
          order.customer = customer;
        } catch (error) {
          console.warn(`Customer ${order.customerId} not found:`, error);
        }
      }

      // Enrich with branch info if missing
      if (!order.branchInfo && order.branch) {
        order.branchInfo = DEFAULT_BRANCH_INFO;
      }

      // Calculate payment status for advance orders
      if (order.isAdvanceBilling) {
        order.paymentStatus = order.remainingAmount > 0 ? 'partial' : 'complete';
        order.paymentProgress = order.total > 0 ? 
          ((order.advanceAmount || 0) / order.total) * 100 : 0;
      }

      return order;
    } catch (error) {
      console.error('Error fetching Mitti Arts order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// [NEW & ENHANCED] Complete advance payment with new invoice generation and SMS
export const completeAdvancePayment = createAsyncThunk(
  'orders/completeAdvance',
  async ({ orderId, paymentAmount, paymentMethod, bankDetails, notes }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Processing advance payment completion:', { orderId, paymentAmount, paymentMethod });

      // Get the current order
      const order = await firebaseService.getById('orders', orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.isAdvanceBilling) {
        throw new Error('This is not an advance billing order');
      }

      if (order.remainingAmount <= 0) {
        throw new Error('This order is already fully paid');
      }

      if (paymentAmount > order.remainingAmount) {
        throw new Error('Payment amount exceeds remaining balance');
      }
      
      if (paymentAmount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // Calculate new amounts
      const newAdvanceAmount = (order.advanceAmount || 0) + paymentAmount;
      const newRemainingAmount = order.total - newAdvanceAmount;
      const isFullyPaid = newRemainingAmount <= 0;

      // Create payment record for tracking
      const paymentRecord = {
        orderId: orderId,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod,
        bankDetails: bankDetails || null,
        notes: notes || '',
        paymentDate: new Date(),
        previousBalance: order.remainingAmount,
        newBalance: newRemainingAmount,
        isFullPayment: isFullyPaid,
        paymentType: 'advance_completion',
        branchInfo: order.branchInfo,
        businessType: order.businessType
      };

      // Store payment record
      await firebaseService.create('advance_payment_records', paymentRecord);

      // Update the order with new payment information
      const orderUpdate = {
        advanceAmount: newAdvanceAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: isFullyPaid ? 'complete' : 'partial',
        lastPaymentDate: new Date(),
        lastPaymentMethod: paymentMethod,
        lastPaymentAmount: paymentAmount,
        updatedAt: new Date()
      };

      // If fully paid, mark as completed and generate final invoice
      if (isFullyPaid) {
        orderUpdate.isAdvanceBilling = false; // No longer advance billing
        orderUpdate.status = 'completed';
        orderUpdate.completedAt = new Date();
        orderUpdate.finalPaymentMethod = paymentMethod;
        orderUpdate.finalPaymentDate = new Date();

        // Generate completion invoice data
        const completionInvoiceData = {
          ...order,
          ...orderUpdate,
          invoiceType: 'completion',
          originalAdvanceInvoiceId: order.id,
          finalPaymentAmount: paymentAmount,
          finalPaymentMethod: paymentMethod,
          finalPaymentDate: new Date(),
          
          // New invoice number for the completion
          invoiceNumber: `${order.orderNumber}-FINAL`,
          orderNumber: `${order.orderNumber}-FINAL`,
          
          // Payment breakdown for the completion invoice
          paymentBreakdown: {
            totalOrderAmount: order.total,
            previousAdvanceAmount: order.advanceAmount,
            finalPaymentAmount: paymentAmount,
            paymentMethod: paymentMethod,
            bankDetails: bankDetails
          }
        };

        // Create the completion invoice
        try {
          await invoiceService.createInvoice(completionInvoiceData);
          console.log('Completion invoice generated successfully');
        } catch (invoiceError) {
          console.error('Failed to create completion invoice:', invoiceError);
        }

        // Create advance payment completion record
        const completionRecord = {
          originalOrderId: orderId,
          originalOrderNumber: order.orderNumber,
          completionDate: new Date(),
          finalPaymentAmount: paymentAmount,
          finalPaymentMethod: paymentMethod,
          totalAdvanceAmount: newAdvanceAmount,
          totalOrderAmount: order.total,
          customerId: order.customerId,
          customerName: order.customer?.name || 'Walk-in Customer',
          branchInfo: order.branchInfo,
          businessType: order.businessType,
          items: order.items,
          completionInvoiceGenerated: true,
          status: 'completed'
        };

        await firebaseService.create('advance_completions', completionRecord);
      }

      // Update the original order
      const updatedOrder = await firebaseService.update('orders', orderId, orderUpdate);
      
      // 🆕 SEND COMPLETION SMS IF FULLY PAID
      if (isFullyPaid) {
        try {
          // Get customer data
          let customer = null;
          if (order.customerId) {
            try {
              customer = await firebaseService.getById('customers', order.customerId);
            } catch (error) {
              console.warn('Could not fetch customer for completion SMS:', error);
            }
          }

          const customerPhone = customer?.phone;
          const customerName = customer?.name || 'Valued Customer';

          if (customerPhone && smsService.isValidPhoneNumber(customerPhone)) {
            console.log('📱 Sending payment completion SMS...');

            const smsResult = await smsService.sendPaymentCompletionSMS(
              customerPhone,
              customerName,
              order.orderNumber,
              paymentAmount,
              order.billToken 
            );

            if (smsResult && smsResult.success) {
              console.log('✅ Completion SMS sent successfully:', smsResult.messageId);
            } else {
              console.warn('⚠️ Completion SMS failed:', smsResult?.error);
            }
          }
        } catch (smsError) {
          console.error('❌ Completion SMS error (non-critical):', smsError);
        }
      }

      // Enrich the order with customer data for return
      if (order.customerId) {
        try {
          const customer = await firebaseService.getById('customers', order.customerId);
          updatedOrder.customer = customer;
        } catch (error) {
          console.warn('Could not fetch customer data:', error);
          updatedOrder.customer = order.customer; // Use existing customer data
        }
      }

      // Add payment completion flag for UI feedback
      updatedOrder.paymentJustCompleted = isFullyPaid;
      updatedOrder.latestPaymentAmount = paymentAmount;

      console.log('Advance payment processed successfully:', {
        orderId,
        isFullyPaid,
        newAdvanceAmount,
        newRemainingAmount
      });

      return updatedOrder;
    } catch (error) {
      console.error('Error completing advance payment:', error);
      return rejectWithValue(error.message);
    }
  }
);

// [NEW] Get advance payment history for an order
export const getAdvancePaymentHistory = createAsyncThunk(
  'orders/getAdvanceHistory',
  async (orderId, { rejectWithValue }) => {
    try {
      const paymentRecords = await firebaseService.getAll('advance_payment_records', {
        where: [{ field: 'orderId', operator: '==', value: orderId }],
        orderBy: { field: 'paymentDate', direction: 'desc' }
      });

      return paymentRecords;
    } catch (error) {
      console.error('Error fetching advance payment history:', error);
      return rejectWithValue(error.message);
    }
  }
);

// [NEW] Get all advance payment records for reporting
export const getAdvancePaymentRecords = createAsyncThunk(
  'orders/getAdvanceRecords',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        orderBy: { field: 'paymentDate', direction: 'desc' }
      };

      const whereConditions = [];

      if (filters.startDate) {
        whereConditions.push({ 
          field: 'paymentDate', 
          operator: '>=', 
          value: new Date(filters.startDate) 
        });
      }

      if (filters.endDate) {
        whereConditions.push({ 
          field: 'paymentDate', 
          operator: '<=', 
          value: new Date(filters.endDate) 
        });
      }

      if (filters.customerId) {
        whereConditions.push({ 
          field: 'customerId', 
          operator: '==', 
          value: filters.customerId 
        });
      }

      if (filters.businessType) {
        whereConditions.push({ 
          field: 'businessType', 
          operator: '==', 
          value: filters.businessType 
        });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      const records = await firebaseService.getAll('advance_payment_records', options);
      
      // Apply client-side search if needed
      let filteredRecords = records;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredRecords = records.filter(record => 
          record.orderNumber?.toLowerCase().includes(searchTerm) ||
          record.customerName?.toLowerCase().includes(searchTerm)
        );
      }

      return filteredRecords;
    } catch (error) {
      console.error('Error fetching advance payment records:', error);
      return rejectWithValue(error.message);
    }
  }
);

// [NEW] Get advance completion records
export const getAdvanceCompletions = createAsyncThunk(
  'orders/getAdvanceCompletions',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        orderBy: { field: 'completionDate', direction: 'desc' }
      };

      const whereConditions = [];

      if (filters.startDate) {
        whereConditions.push({ 
          field: 'completionDate', 
          operator: '>=', 
          value: new Date(filters.startDate) 
        });
      }

      if (filters.endDate) {
        whereConditions.push({ 
          field: 'completionDate', 
          operator: '<=', 
          value: new Date(filters.endDate) 
        });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      return await firebaseService.getAll('advance_completions', options);
    } catch (error) {
      console.error('Error fetching advance completions:', error);
      return rejectWithValue(error.message);
    }
  }
);

// [NEW] Calculate advance payment analytics
export const calculateAdvanceAnalytics = createAsyncThunk(
  'orders/calculateAdvanceAnalytics',
  async (dateRange = {}, { rejectWithValue, getState }) => {
    try {
      const { orders } = getState();
      const allOrders = orders.items;

      // Filter advance orders
      const advanceOrders = allOrders.filter(order => order.isAdvanceBilling);
      const pendingAdvances = advanceOrders.filter(order => order.remainingAmount > 0);
      const completedAdvances = advanceOrders.filter(order => order.remainingAmount <= 0);

      // Calculate totals
      const totalPendingAmount = pendingAdvances.reduce((sum, order) => sum + (order.remainingAmount || 0), 0);
      const totalAdvanceCollected = advanceOrders.reduce((sum, order) => sum + (order.advanceAmount || 0), 0);
      const totalOrderValue = advanceOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Calculate overdue payments
      const overduePayments = pendingAdvances.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        const dueDate = orderDate.clone().add(order.businessType === 'wholesale' ? 30 : 7, 'days');
        return moment().isAfter(dueDate);
      });

      // Branch-wise analytics
      const branchAnalytics = {};
      advanceOrders.forEach(order => {
        const branchName = order.branchInfo?.name || 'Unknown';
        if (!branchAnalytics[branchName]) {
          branchAnalytics[branchName] = {
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalAdvanceAmount: 0,
            totalPendingAmount: 0,
            totalOrderValue: 0
          };
        }

        const branch = branchAnalytics[branchName];
        branch.totalOrders += 1;
        branch.totalAdvanceAmount += order.advanceAmount || 0;
        branch.totalOrderValue += order.total || 0;

        if (order.remainingAmount > 0) {
          branch.pendingOrders += 1;
          branch.totalPendingAmount += order.remainingAmount;
        } else {
          branch.completedOrders += 1;
        }
      });

      // Business type analytics
      const businessTypeAnalytics = {
        retail: {
          totalOrders: advanceOrders.filter(o => o.businessType === 'retail').length,
          totalAdvance: advanceOrders.filter(o => o.businessType === 'retail').reduce((sum, o) => sum + (o.advanceAmount || 0), 0),
          averageAdvance: 0
        },
        wholesale: {
          totalOrders: advanceOrders.filter(o => o.businessType === 'wholesale').length,
          totalAdvance: advanceOrders.filter(o => o.businessType === 'wholesale').reduce((sum, o) => sum + (o.advanceAmount || 0), 0),
          averageAdvance: 0
        }
      };

      // Calculate averages
      if (businessTypeAnalytics.retail.totalOrders > 0) {
        businessTypeAnalytics.retail.averageAdvance = businessTypeAnalytics.retail.totalAdvance / businessTypeAnalytics.retail.totalOrders;
      }
      if (businessTypeAnalytics.wholesale.totalOrders > 0) {
        businessTypeAnalytics.wholesale.averageAdvance = businessTypeAnalytics.wholesale.totalAdvance / businessTypeAnalytics.wholesale.totalOrders;
      }

      return {
        summary: {
          totalAdvanceOrders: advanceOrders.length,
          pendingAdvances: pendingAdvances.length,
          completedAdvances: completedAdvances.length,
          totalPendingAmount,
          totalAdvanceCollected,
          totalOrderValue,
          overduePayments: overduePayments.length,
          advancePercentage: totalOrderValue > 0 ? (totalAdvanceCollected / totalOrderValue) * 100 : 0
        },
        branchAnalytics,
        businessTypeAnalytics,
        overduePayments,
        recentCompletions: completedAdvances.slice(0, 5)
      };
    } catch (error) {
      console.error('Error calculating advance analytics:', error);
      return rejectWithValue(error.message);
    }
  }
);


// Cancel order with enhanced logic
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async ({ id, reason = '', refundAdvance = false }, { rejectWithValue, dispatch, getState }) => {
    try {
      const order = getState().orders.items.find(o => o.id === id);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      const updatedOrder = await firebaseService.update('orders', id, { 
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date(),
        refundAdvance,
        updatedAt: new Date()
      });

      // Update invoice status
      try {
        await invoiceService.updateInvoiceStatus(id, 'cancelled');
      } catch (error) {
        console.warn('Failed to update invoice status:', error);
      }

      // Restore product stock for non-dynamic products
      if (order.items) {
        for (const item of order.items) {
          if (!item.product.isDynamic && item.product.id && !item.product.id.startsWith('temp_')) {
            try {
              await dispatch(updateStock({ 
                id: item.product.id, 
                stockChange: item.quantity 
              }));
            } catch (error) {
              console.warn(`Failed to restore stock for product ${item.product.id}:`, error);
            }
          }
        }
      }

      // Handle advance payment cancellation
      if (order.isAdvanceBilling && refundAdvance) {
        try {
          await updateAdvancePaymentRecord(id, {
            status: 'refunded',
            refundDate: new Date(),
            refundReason: reason
          });
        } catch (error) {
          console.warn('Failed to update advance payment record for cancellation:', error);
        }
      }

      return updatedOrder;
    } catch (error) {
      console.error('Error cancelling Mitti Arts order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Helper functions
const calculateProfitMargin = (items, total) => {
  try {
    const totalCost = items.reduce((sum, item) => {
      // Estimate cost as 60% of selling price for pottery if no cost price
      const estimatedCost = item.product.costPrice || (item.price * 0.6);
      return sum + (estimatedCost * item.quantity);
    }, 0);
    
    return total > 0 ? ((total - totalCost) / total) * 100 : 0;
  } catch (error) {
    return 0;
  }
};

const getSeasonality = () => {
  const month = new Date().getMonth() + 1;
  if ([10, 11, 12, 1, 2].includes(month)) return 'festival'; // Diwali, Christmas, New Year
  if ([3, 4, 5].includes(month)) return 'summer';
  if ([6, 7, 8, 9].includes(month)) return 'monsoon';
  return 'regular';
};

const calculateDueDate = (businessType) => {
  const days = businessType === 'wholesale' ? 30 : 7; // 30 days for wholesale, 7 for retail
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
};

const createAdvancePaymentRecord = async (orderId, data) => {
  return await firebaseService.create('advance_payments', data);
};

const updateAdvancePaymentRecord = async (orderId, data) => {
  const records = await firebaseService.getAll('advance_payments', {
    where: [{ field: 'orderId', operator: '==', value: orderId }]
  });
  
  if (records.length > 0) {
    return await firebaseService.update('advance_payments', records[0].id, data);
  }
};

const initialState = {
  items: [],
  currentOrder: null,
  cart: [],
  loading: false,
  error: null,
  total: 0,
  
  // Enhanced state for Mitti Arts
  businessType: 'retail', // Default to retail
  selectedBranch: null, // Will be set dynamically
  cartBusiness: {
    type: 'retail',
    branch: null
  },
  
  // Advance billing and payment history state
  advanceOrders: [],
  pendingPayments: [],
  paymentHistory: [],
  paymentRecords: [],
  advanceCompletions: [],

  // Analytics state
  analytics: {
    dailySales: {},
    branchPerformance: {},
    businessTypeStats: {},
    customerSegments: {}
  },
  advanceAnalytics: {} // New state for advance payment analytics
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Enhanced cart management with business context
    addToCart: (state, action) => {
      const { product, quantity = 1, originalPrice, currentPrice, businessType, branch } = action.payload;
      const existingItem = state.cart.find(item => 
        item.product.id === product.id && 
        item.businessType === businessType
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.cart.push({ 
          product, 
          quantity,
          originalPrice: originalPrice || product.price,
          currentPrice: currentPrice || product.price,
          businessType: businessType || state.businessType,
          branch: branch || state.selectedBranch,
          addedAt: new Date().toISOString()
        });
      }
      
      // Update cart business context
      state.cartBusiness = {
        type: businessType || state.businessType,
        branch: branch || state.selectedBranch
      };
    },
    
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter(item => item.product.id !== action.payload);
    },
    
    updateCartItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.cart.find(item => item.product.id === productId);
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
    },
    
    updateCartItemPrice: (state, action) => {
      const { productId, newPrice } = action.payload;
      const item = state.cart.find(item => item.product.id === productId);
      if (item && newPrice > 0) {
        item.currentPrice = newPrice;
      }
    },
    
    clearCart: (state) => {
      state.cart = [];
      state.cartBusiness = {
        type: state.businessType,
        branch: state.selectedBranch
      };
    },
    
    // Business type and branch management
    setBusinessType: (state, action) => {
      state.businessType = action.payload;
      state.cartBusiness.type = action.payload;
      
      // Update cart prices if switching business types
      state.cart.forEach(item => {
        item.businessType = action.payload;
        // Recalculate prices based on business type if needed
      });
    },
    
    setSelectedBranch: (state, action) => {
      state.selectedBranch = action.payload;
      state.cartBusiness.branch = action.payload;
      
      // Update cart branch context
      state.cart.forEach(item => {
        item.branch = action.payload;
      });
    },
    
    // Advance billing management
    updateAdvanceOrders: (state, action) => {
      state.advanceOrders = action.payload;
    },
    
    updatePendingPayments: (state, action) => {
      state.pendingPayments = action.payload;
    },
    
    // Analytics updates
    updateAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload };
    },
    
    // [NEW] Advance Analytics reducers
    setAdvanceAnalytics: (state, action) => {
      state.advanceAnalytics = action.payload;
    },
    
    clearAdvanceState: (state) => {
      state.advanceOrders = [];
      state.pendingPayments = [];
      state.advanceAnalytics = {};
    },

    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.total = action.payload.length;
        state.error = null;
        
        // Update advance orders list
        state.advanceOrders = action.payload.filter(order => 
          order.isAdvanceBilling && order.remainingAmount > 0
        );
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.cart = [];
        state.currentOrder = action.payload;
        state.total = state.items.length;
        state.error = null;
        
        // Update analytics
        const order = action.payload;
        if (order.analytics) {
          const branch = order.branch;
          const businessType = order.businessType;
          
          // Update branch performance
          if (!state.analytics.branchPerformance[branch]) {
            state.analytics.branchPerformance[branch] = { orders: 0, revenue: 0 };
          }
          state.analytics.branchPerformance[branch].orders += 1;
          state.analytics.branchPerformance[branch].revenue += order.total;
          
          // Update business type stats
          if (!state.analytics.businessTypeStats[businessType]) {
            state.analytics.businessTypeStats[businessType] = { orders: 0, revenue: 0 };
          }
          state.analytics.businessTypeStats[businessType].orders += 1;
          state.analytics.businessTypeStats[businessType].revenue += order.total;
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get order
      .addCase(getOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(getOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // [NEW] Complete advance payment extra reducers
      .addCase(completeAdvancePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeAdvancePayment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }

        // Update advance orders list
        state.advanceOrders = state.items.filter(order => 
          order.isAdvanceBilling && order.remainingAmount > 0
        );

        state.error = null;
      })
      .addCase(completeAdvancePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // [NEW] Get advance payment history
      .addCase(getAdvancePaymentHistory.fulfilled, (state, action) => {
        state.paymentHistory = action.payload;
      })

      // [NEW] Get advance payment records
      .addCase(getAdvancePaymentRecords.fulfilled, (state, action) => {
        state.paymentRecords = action.payload;
      })

      // [NEW] Get advance completions
      .addCase(getAdvanceCompletions.fulfilled, (state, action) => {
        state.advanceCompletions = action.payload;
      })

      // [NEW] Calculate advance analytics
      .addCase(calculateAdvanceAnalytics.fulfilled, (state, action) => {
        state.advanceAnalytics = action.payload;
      })
      
      // Cancel order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity,
  updateCartItemPrice,
  clearCart,
  setBusinessType,
  setSelectedBranch,
  updateAdvanceOrders,
  updatePendingPayments,
  updateAnalytics,
  setAdvanceAnalytics, // New export
  clearAdvanceState,   // New export
  clearError
} = orderSlice.actions;

export default orderSlice.reducer;