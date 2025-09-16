// src/features/estimation/estimationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import moment from 'moment';
import firebaseService from '../../services/firebaseService';

// Helper function to generate share token
const generateShareToken = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `${timestamp}${random}`;
};

// Generate estimate number
const generateEstimateNumber = async () => {
  try {
    // Get the latest estimate to determine next number
    const estimates = await firebaseService.getAll('estimates', {
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 1
    });
    
    let nextNumber = 1;
    if (estimates.length > 0) {
      const lastEstimate = estimates[0];
      const lastNumber = parseInt(lastEstimate.estimateNumber?.split('-')[1] || '0');
      nextNumber = lastNumber + 1;
    }
    
    // Format: EST-001-DDMMYY (optional date)
    const dateStr = moment().format('DDMMYY');
    return `EST-${String(nextNumber).padStart(3, '0')}-${dateStr}`;
  } catch (error) {
    // Fallback if error
    const dateStr = moment().format('DDMMYY');
    const randomNum = Math.floor(Math.random() * 1000);
    return `EST-${String(randomNum).padStart(3, '0')}-${dateStr}`;
  }
};

// Fetch all estimates
export const fetchEstimates = createAsyncThunk(
  'estimations/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        limit: filters.limit || 100,
        orderBy: { field: 'createdAt', direction: 'desc' }
      };

      const whereConditions = [];
      
      if (filters.status) {
        whereConditions.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.businessType) {
        whereConditions.push({ field: 'businessType', operator: '==', value: filters.businessType });
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

      let estimates = await firebaseService.getAll('estimates', options);

      // Client-side filtering
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        estimates = estimates.filter(estimate => 
          estimate.estimateNumber?.toLowerCase().includes(searchTerm) ||
          estimate.customer?.name?.toLowerCase().includes(searchTerm) ||
          estimate.customer?.phone?.includes(searchTerm)
        );
      }

      // 🔧 IMPROVED: Enrich with customer data using safer method
      const customerIds = [...new Set(estimates.filter(e => e.customerId).map(e => e.customerId))];
      const customers = await firebaseService.getCustomersByIds(customerIds);

      // Enrich estimates and check validity
      estimates = estimates.map(estimate => {
        const enrichedEstimate = {
          ...estimate,
          // Use the safely fetched customer data
          customer: estimate.customerId ? customers[estimate.customerId] : null
        };

        // Check if estimate is expired (3 months)
        const expiryDate = moment(estimate.createdAt?.toDate ? estimate.createdAt.toDate() : estimate.createdAt).add(3, 'months');
        enrichedEstimate.isExpired = moment().isAfter(expiryDate);
        enrichedEstimate.expiryDate = expiryDate.toDate();
        enrichedEstimate.daysToExpiry = expiryDate.diff(moment(), 'days');

        return enrichedEstimate;
      });

      return estimates;
    } catch (error) {
      console.error('Error fetching estimates:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Create estimate
export const createEstimate = createAsyncThunk(
  'estimations/create',
  async (estimateData, { rejectWithValue }) => {
    try {
      console.log('Creating estimate:', estimateData);

      // Validate required fields
      if (!estimateData.businessType) {
        throw new Error('Business type is required');
      }
      
      if (!estimateData.items || estimateData.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Limit items to 8
      if (estimateData.items.length > 8) {
        throw new Error('Maximum 8 items allowed in estimate');
      }

      // Generate estimate number and share token
      const estimateNumber = await generateEstimateNumber();
      const shareToken = generateShareToken();

      // Calculate totals (same logic as orders)
      const subtotal = estimateData.subtotal || estimateData.items.reduce((sum, item) => 
        sum + ((item.originalPrice || item.price) * item.quantity), 0);
      
      const negotiatedDiscount = estimateData.discount || (subtotal - estimateData.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0));
      
      const afterNegotiation = subtotal - negotiatedDiscount;

      // Calculate wholesale discount (5% for orders above ₹10,000)
      let wholesaleDiscount = 0;
      if (estimateData.businessType === 'wholesale' && afterNegotiation > 10000) {
        wholesaleDiscount = afterNegotiation * 0.05;
      }

      const finalTotal = afterNegotiation - wholesaleDiscount;

      // Helper function to remove undefined values recursively
      const removeUndefined = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined);
        } else if (obj !== null && typeof obj === 'object') {
          const cleaned = {};
          Object.keys(obj).forEach(key => {
            const value = removeUndefined(obj[key]);
            if (value !== undefined) {
              cleaned[key] = value;
            }
          });
          return cleaned;
        }
        return obj;
      };

      // Create estimate object with proper data cleaning
      const rawEstimate = {
        estimateNumber,
        shareToken,
        customerId: estimateData.customerId || null,
        businessType: estimateData.businessType || 'retail',
        branch: estimateData.branch || 'main',
        branchInfo: estimateData.branchInfo || null,
        
        // Items (limited to 8) - carefully clean each item
        items: estimateData.items.slice(0, 8).map(item => {
          const cleanItem = {
            product: {
              id: item.product?.id || `temp_${Date.now()}`,
              name: item.product?.name || 'Unknown Product',
              category: item.product?.category || 'Pottery',
              isDynamic: Boolean(item.product?.isDynamic)
            },
            quantity: Number(item.quantity) || 1,
            originalPrice: Number(item.originalPrice || item.price) || 0,
            currentPrice: Number(item.currentPrice || item.price) || 0,
            price: Number(item.price) || 0,
            businessType: item.businessType || estimateData.businessType || 'retail',
            discount: 0,
            lineTotal: 0
          };
          
          // Calculate discount and line total
          if (cleanItem.originalPrice > 0) {
            cleanItem.discount = ((cleanItem.originalPrice - cleanItem.price) / cleanItem.originalPrice) * 100;
          }
          cleanItem.lineTotal = cleanItem.price * cleanItem.quantity;
          
          return cleanItem;
        }),
        
        // Financial calculations - ensure all numbers
        subtotal: Number(subtotal) || 0,
        negotiatedDiscount: Number(negotiatedDiscount) || 0,
        discountPercentage: subtotal > 0 ? (negotiatedDiscount / subtotal) * 100 : 0,
        wholesaleDiscount: Number(wholesaleDiscount) || 0,
        wholesaleDiscountPercentage: afterNegotiation > 0 ? (wholesaleDiscount / afterNegotiation) * 100 : 0,
        afterDiscount: Number(afterNegotiation) || 0,
        total: Number(finalTotal) || 0,
        
        // Notes from user
        notes: String(estimateData.notes || ''),
        
        // Validity (3 months)
        validityDays: 90,
        expiryDate: moment().add(3, 'months').toDate(),
        
        // Status
        status: 'active',
        
        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Analytics - ensure all numbers
        analytics: {
          itemCount: Number(estimateData.items.length) || 0,
          totalQuantity: estimateData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
          averageItemPrice: estimateData.items.length > 0 ? 
            estimateData.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0) / estimateData.items.length : 0
        }
      };

      // Clean the estimate object to remove any undefined values
      const estimate = removeUndefined(rawEstimate);

      // Create in Firebase
      const createdEstimate = await firebaseService.create('estimates', estimate);
      console.log('Estimate created successfully:', createdEstimate.id);
      console.log('Share token generated:', shareToken);

      return createdEstimate;
    } catch (error) {
      console.error('Error creating estimate:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get single estimate
export const getEstimate = createAsyncThunk(
  'estimations/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const estimate = await firebaseService.getById('estimates', id);
      
      // 🔧 IMPROVED: Enrich with customer data using safer method
      if (estimate.customerId) {
        const customer = await firebaseService.getCustomerById(estimate.customerId);
        if (customer) {
          estimate.customer = customer;
        } else {
          console.warn(`Customer ${estimate.customerId} not found for estimate ${id}`);
          // Set a placeholder customer instead of failing
          estimate.customer = {
            name: 'Customer Not Found',
            phone: 'N/A'
          };
        }
      }

      // Check validity
      const expiryDate = moment(estimate.createdAt?.toDate ? estimate.createdAt.toDate() : estimate.createdAt).add(3, 'months');
      estimate.isExpired = moment().isAfter(expiryDate);
      estimate.expiryDate = expiryDate.toDate();
      estimate.daysToExpiry = expiryDate.diff(moment(), 'days');

      return estimate;
    } catch (error) {
      console.error('Error fetching estimate:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Convert estimate to invoice
export const convertEstimateToInvoice = createAsyncThunk(
  'estimations/convertToInvoice',
  async ({ estimateId, orderData }, { rejectWithValue, dispatch }) => {
    try {
      const estimate = await firebaseService.getById('estimates', estimateId);
      
      if (!estimate) {
        throw new Error('Estimate not found');
      }

      if (estimate.status === 'converted') {
        throw new Error('Estimate already converted to invoice');
      }

      if (estimate.isExpired) {
        throw new Error('Cannot convert expired estimate');
      }

      // Prepare order data from estimate
      const convertedOrderData = {
        ...orderData,
        items: estimate.items,
        businessType: estimate.businessType,
        branch: estimate.branch,
        branchInfo: estimate.branchInfo,
        customerId: estimate.customerId,
        subtotal: estimate.subtotal,
        discount: estimate.negotiatedDiscount,
        total: estimate.total,
        
        // Reference to original estimate
        convertedFromEstimate: {
          estimateId: estimate.id,
          estimateNumber: estimate.estimateNumber,
          convertedAt: new Date()
        }
      };

      // Create order using existing order slice (we'll import this)
      // For now, just mark estimate as converted
      await firebaseService.update('estimates', estimateId, {
        status: 'converted',
        convertedAt: new Date(),
        updatedAt: new Date()
      });

      return { estimate, orderData: convertedOrderData };
    } catch (error) {
      console.error('Error converting estimate to invoice:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update estimate status
export const updateEstimateStatus = createAsyncThunk(
  'estimations/updateStatus',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const updatedEstimate = await firebaseService.update('estimates', id, {
        status,
        statusNotes: notes || '',
        updatedAt: new Date()
      });

      return updatedEstimate;
    } catch (error) {
      console.error('Error updating estimate status:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  currentEstimate: null,
  loading: false,
  error: null,
  total: 0,
  
  // Cart for estimate creation (similar to orders)
  estimateCart: [],
  cartBusiness: {
    type: 'retail',
    branch: null
  }
};

const estimationSlice = createSlice({
  name: 'estimations',
  initialState,
  reducers: {
    // Cart management for estimates
    addToEstimateCart: (state, action) => {
      const { product, quantity = 1, originalPrice, currentPrice, businessType, branch } = action.payload;
      
      // Check if cart is already at 8 items limit
      if (state.estimateCart.length >= 8) {
        state.error = 'Maximum 8 items allowed in estimate';
        return;
      }
      
      const existingItem = state.estimateCart.find(item => 
        item.product.id === product.id && 
        item.businessType === businessType
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.estimateCart.push({ 
          product, 
          quantity,
          originalPrice: originalPrice || product.price,
          currentPrice: currentPrice || product.price,
          businessType: businessType,
          branch: branch,
          addedAt: new Date().toISOString()
        });
      }
      
      state.cartBusiness = {
        type: businessType,
        branch: branch
      };
    },
    
    removeFromEstimateCart: (state, action) => {
      state.estimateCart = state.estimateCart.filter(item => item.product.id !== action.payload);
    },
    
    updateEstimateCartItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.estimateCart.find(item => item.product.id === productId);
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
    },
    
    updateEstimateCartItemPrice: (state, action) => {
      const { productId, newPrice } = action.payload;
      const item = state.estimateCart.find(item => item.product.id === productId);
      if (item && newPrice > 0) {
        item.currentPrice = newPrice;
      }
    },
    
    clearEstimateCart: (state) => {
      state.estimateCart = [];
      state.error = null;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch estimates
      .addCase(fetchEstimates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstimates.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.total = action.payload.length;
        state.error = null;
      })
      .addCase(fetchEstimates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create estimate
      .addCase(createEstimate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEstimate.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.estimateCart = [];
        state.currentEstimate = action.payload;
        state.total = state.items.length;
        state.error = null;
      })
      .addCase(createEstimate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get estimate
      .addCase(getEstimate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEstimate.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEstimate = action.payload;
        state.error = null;
      })
      .addCase(getEstimate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Convert to invoice
      .addCase(convertEstimateToInvoice.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.estimate.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], status: 'converted' };
        }
        if (state.currentEstimate?.id === action.payload.estimate.id) {
          state.currentEstimate = { ...state.currentEstimate, status: 'converted' };
        }
      })
      
      // Update status
      .addCase(updateEstimateStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentEstimate?.id === action.payload.id) {
          state.currentEstimate = action.payload;
        }
      });
  }
});

export const { 
  addToEstimateCart, 
  removeFromEstimateCart, 
  updateEstimateCartItemQuantity,
  updateEstimateCartItemPrice,
  clearEstimateCart,
  clearError
} = estimationSlice.actions;

export default estimationSlice.reducer;