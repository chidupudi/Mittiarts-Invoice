import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import billService from '../../services/billService';

export const createBill = createAsyncThunk(
  'bills/create',
  async (billData, thunkAPI) => {
    try {
      return await billService.createBill(billData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const getBills = createAsyncThunk(
  'bills/getAll',
  async (params, thunkAPI) => {
    try {
      return await billService.getBills(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const getBill = createAsyncThunk(
  'bills/getOne',
  async (id, thunkAPI) => {
    try {
      return await billService.getBill(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

const billSlice = createSlice({
  name: 'bills',
  initialState: {
    bills: [],
    currentBill: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: ''
  },
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBill.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.bills.push(action.payload);
      })
      .addCase(createBill.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getBills.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.bills = action.payload;
      })
      .addCase(getBills.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getBill.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBill.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentBill = action.payload;
      })
      .addCase(getBill.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset } = billSlice.actions;
export default billSlice.reducer;