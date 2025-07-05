// src/features/products/productSlice.js - Fixed version
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';

// Fetch all products with real-time updates
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {};
      
      // Build query options carefully to avoid index issues
      const whereConditions = [];
      
      if (filters.category) {
        whereConditions.push({ field: 'category', operator: '==', value: filters.category });
      }
      
      if (filters.lowStock) {
        whereConditions.push({ field: 'stock', operator: '<=', value: 10 });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      options.orderBy = { field: 'createdAt', direction: 'desc' };

      let products = await firebaseService.getAll('products', options);

      // Apply search filter on client side (Firestore doesn't support case-insensitive search)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        products = products.filter(product => 
          product.name?.toLowerCase().includes(searchTerm) ||
          product.category?.toLowerCase().includes(searchTerm) ||
          product.sku?.toLowerCase().includes(searchTerm)
        );
      }

      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Create product
export const createProduct = createAsyncThunk(
  'products/create',
  async (productData, { rejectWithValue, dispatch }) => {
    try {
      const product = await firebaseService.create('products', {
        ...productData,
        stock: productData.stock || 0,
        sku: productData.sku || `PRD-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Immediately fetch updated products list to ensure UI is in sync
      dispatch(fetchProducts({}));
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, productData }, { rejectWithValue, dispatch }) => {
    try {
      const product = await firebaseService.update('products', id, {
        ...productData,
        updatedAt: new Date()
      });
      
      // Immediately fetch updated products list
      dispatch(fetchProducts({}));
      
      return product;
    } catch (error) {
      console.error('Error updating product:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Delete product
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await firebaseService.delete('products', id);
      
      // Immediately fetch updated products list
      dispatch(fetchProducts({}));
      
      return id;
    } catch (error) {
      console.error('Error deleting product:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update stock
export const updateStock = createAsyncThunk(
  'products/updateStock',
  async ({ id, stockChange }, { rejectWithValue, getState, dispatch }) => {
    try {
      const currentProduct = getState().products.items.find(p => p.id === id);
      if (!currentProduct) {
        throw new Error('Product not found');
      }
      
      const newStock = Math.max(0, currentProduct.stock + stockChange);
      
      const product = await firebaseService.update('products', id, { 
        stock: newStock,
        updatedAt: new Date()
      });
      
      // Immediately fetch updated products list
      dispatch(fetchProducts({}));
      
      return product;
    } catch (error) {
      console.error('Error updating stock:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    search: '',
    lowStock: false
  },
  lastFetch: null
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        search: '',
        lowStock: false
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add product to local state immediately for optimistic updates
    addProductOptimistic: (state, action) => {
      state.items.unshift(action.payload);
    },
    // Update product in local state immediately
    updateProductOptimistic: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    // Remove product from local state immediately
    removeProductOptimistic: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetch = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        // Product is already added via fetchProducts call
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        // Product is already updated via fetchProducts call
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        // Product is already removed via fetchProducts call
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update stock
      .addCase(updateStock.fulfilled, (state, action) => {
        // Stock is already updated via fetchProducts call
        state.error = null;
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  setFilters, 
  clearFilters, 
  clearError,
  addProductOptimistic,
  updateProductOptimistic,
  removeProductOptimistic
} = productSlice.actions;

export default productSlice.reducer;