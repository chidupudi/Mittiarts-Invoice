import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '../../services/productService';

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (filters, { getState }) => {
    const { token } = getState().auth;
    return await productService.getAllProducts(filters, token);
  }
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (productData, { getState }) => {
    const { token } = getState().auth;
    return await productService.createProduct(productData, token);
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, productData }, { getState }) => {
    const { token } = getState().auth;
    return await productService.updateProduct(id, productData, token);
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { getState }) => {
    const { token } = getState().auth;
    return await productService.deleteProduct(id, token);
  }
);

export const updateStock = createAsyncThunk(
  'products/updateStock',
  async ({ id, stockData }, { getState }) => {
    const { token } = getState().auth;
    return await productService.updateStock(id, stockData, token);
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    filters: {
      category: '',
      search: '',
      lowStock: false
    }
  },
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
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload._id);
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const { setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;