// src/features/order/orderSlice.js - Enhanced Mitti Arts Order Management
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';
import invoiceService from '../../services/invoiceService';
import { updateStock } from '../products/productSlice';
import { updateCustomerStats } from '../customer/customerSlice';

// Mitti Arts branch configuration
const MITTI_ARTS_BRANCHES = {
  'main_showroom': {
    id: 'main_showroom',
    name: 'Main Showroom',
    address: 'Plot No. 123, Banjara Hills, Road No. 12, Hyderabad - 500034',
    phone: '+91 98765 43210',
    email: 'sales@mittiarts.com',
    gst: '36ABCDE1234F1Z5',
    icon: '🏪'
  },
  'pottery_workshop': {
    id: 'pottery_workshop',
    name: 'Pottery Workshop',
    address: 'Survey No. 45, Madhapur, HITEC City, Hyderabad - 500081',
    phone: '+91 98765 43211',
    email: 'workshop@mittiarts.com',
    gst: '36ABCDE1234F1Z6',
    icon: '🏺'
  },
  'export_unit': {
    id: 'export_unit',
    name: 'Export Unit',
    address: 'Plot No. 67, Gachibowli, Export Promotion Industrial Park, Hyderabad - 500032',
    phone: '+91 98765 43212',
    email: 'export@mittiarts.com',
    gst: '36ABCDE1234F1Z7',
    icon: '📦'
  }
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
          branchInfo: MITTI_ARTS_BRANCHES[order.branch] || MITTI_ARTS_BRANCHES['main_showroom']
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

// Create order with enhanced Mitti Arts business logic
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

      // Get branch information
      const branchInfo = MITTI_ARTS_BRANCHES[orderData.branch];
      if (!branchInfo) {
        throw new Error('Invalid branch selected');
      }

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

      // Generate order number with branch prefix
      const branchPrefix = {
        'main_showroom': 'MS',
        'pottery_workshop': 'PW',
        'export_unit': 'EU'
      }[orderData.branch] || 'MA';
      
      const orderNumber = `${branchPrefix}-${Date.now().toString().slice(-8)}`;

      // Create comprehensive order object
      const enhancedOrderData = {
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

      // Create the order in Firebase
      const order = await firebaseService.create('orders', enhancedOrderData);
      console.log('Mitti Arts order created successfully:', order.id);

      // Create enhanced invoice with all business context
      try {
        await invoiceService.createInvoice({
          ...order,
          customer: orderData.customerId ? 
            await firebaseService.getById('customers', orderData.customerId) : null
        });
        console.log('Invoice created for order:', order.id);
      } catch (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
        // Don't fail the order creation if invoice creation fails
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
        order.branchInfo = MITTI_ARTS_BRANCHES[order.branch] || MITTI_ARTS_BRANCHES['main_showroom'];
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

// Complete advance payment
export const completeAdvancePayment = createAsyncThunk(
  'orders/completeAdvance',
  async ({ orderId, paymentAmount, paymentMethod }, { rejectWithValue, dispatch }) => {
    try {
      const order = await firebaseService.getById('orders', orderId);
      
      if (!order.isAdvanceBilling) {
        throw new Error('This is not an advance billing order');
      }

      if (order.remainingAmount <= 0) {
        throw new Error('This order is already fully paid');
      }

      if (paymentAmount > order.remainingAmount) {
        throw new Error('Payment amount exceeds remaining balance');
      }

      const newAdvanceAmount = order.advanceAmount + paymentAmount;
      const newRemainingAmount = order.total - newAdvanceAmount;
      const isFullyPaid = newRemainingAmount <= 0;

      const updatedOrder = await firebaseService.update('orders', orderId, {
        advanceAmount: newAdvanceAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: isFullyPaid ? 'complete' : 'partial',
        ...(isFullyPaid && { 
          isAdvanceBilling: false, 
          completedAt: new Date(),
          finalPaymentMethod: paymentMethod
        }),
        updatedAt: new Date()
      });

      // Update advance payment record
      try {
        await updateAdvancePaymentRecord(orderId, {
          paidAmount: newAdvanceAmount,
          remainingAmount: newRemainingAmount,
          status: isFullyPaid ? 'completed' : 'partial',
          lastPaymentDate: new Date(),
          lastPaymentMethod: paymentMethod
        });
      } catch (error) {
        console.warn('Failed to update advance payment record:', error);
      }

      return updatedOrder;
    } catch (error) {
      console.error('Error completing advance payment:', error);
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
  selectedBranch: 'main_showroom', // Default branch
  cartBusiness: {
    type: 'retail',
    branch: 'main_showroom'
  },
  
  // Advance billing state
  advanceOrders: [],
  pendingPayments: [],
  
  // Analytics state
  analytics: {
    dailySales: {},
    branchPerformance: {},
    businessTypeStats: {},
    customerSegments: {}
  }
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
      
      // Complete advance payment
      .addCase(completeAdvancePayment.fulfilled, (state, action) => {
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
        state.error = action.payload;
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
  clearError
} = orderSlice.actions;

export default orderSlice.reducer;