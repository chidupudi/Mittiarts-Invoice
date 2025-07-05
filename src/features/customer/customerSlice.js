// src/features/customers/customerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';

// Fetch all customers
export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        orderBy: { field: 'createdAt', direction: 'desc' }
      };

      let customers = await firebaseService.getAll('customers', options);

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        customers = customers.filter(customer => 
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.phone.includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm)
        );
      }

      return customers;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create customer
export const createCustomer = createAsyncThunk(
  'customers/create',
  async (customerData, { rejectWithValue }) => {
    try {
      const customer = await firebaseService.create('customers', {
        ...customerData,
        totalPurchases: 0,
        totalSpent: 0
      });
      return customer;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update customer
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const customer = await firebaseService.update('customers', id, customerData);
      return customer;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await firebaseService.delete('customers', id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update customer stats (called when order is created)
export const updateCustomerStats = createAsyncThunk(
  'customers/updateStats',
  async ({ customerId, orderAmount }, { rejectWithValue, getState }) => {
    try {
      const customer = getState().customers.items.find(c => c.id === customerId);
      if (!customer) return;

      const updatedCustomer = await firebaseService.update('customers', customerId, {
        totalPurchases: (customer.totalPurchases || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + orderAmount,
        lastPurchase: new Date().toISOString()
      });
      return updatedCustomer;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  total: 0
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create customer
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update customer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update customer stats
      .addCase(updateCustomerStats.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const { setSelectedCustomer, clearSelectedCustomer, clearError } = customerSlice.actions;
export default customerSlice.reducer;