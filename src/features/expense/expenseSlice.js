// src/features/expense/expenseSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';

// Fetch all expenses
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        orderBy: { field: 'date', direction: 'desc' }
      };

      // Add filters
      if (filters.category) {
        options.where = [{ field: 'category', operator: '==', value: filters.category }];
      }

      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        options.where = [
          ...(options.where || []),
          { field: 'date', operator: '>=', value: startDate },
          { field: 'date', operator: '<=', value: endDate }
        ];
      }

      const expenses = await firebaseService.getAll('expenses', options);
      return expenses;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create expense
export const createExpense = createAsyncThunk(
  'expenses/create',
  async (expenseData, { rejectWithValue }) => {
    try {
      const expense = await firebaseService.create('expenses', {
        ...expenseData,
        date: new Date(expenseData.date),
        receiptNumber: expenseData.receiptNumber || `EXP-${Date.now()}`
      });
      return expense;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update expense
export const updateExpense = createAsyncThunk(
  'expenses/update',
  async ({ id, expenseData }, { rejectWithValue }) => {
    try {
      const expense = await firebaseService.update('expenses', id, {
        ...expenseData,
        date: new Date(expenseData.date)
      });
      return expense;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete expense
export const deleteExpense = createAsyncThunk(
  'expenses/delete',
  async (id, { rejectWithValue }) => {
    try {
      await firebaseService.delete('expenses', id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Get expense summary
export const getExpenseSummary = createAsyncThunk(
  'expenses/getSummary',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {};
      
      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        options.where = [
          { field: 'date', operator: '>=', value: startDate },
          { field: 'date', operator: '<=', value: endDate }
        ];
      }

      const expenses = await firebaseService.getAll('expenses', options);
      
      // Group by category
      const summary = expenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { _id: category, total: 0, count: 0 };
        }
        acc[category].total += expense.amount;
        acc[category].count += 1;
        return acc;
      }, {});

      return Object.values(summary);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  summary: [],
  selectedExpense: null,
  loading: false,
  error: null,
  total: 0
};

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setSelectedExpense: (state, action) => {
      state.selectedExpense = action.payload;
    },
    clearSelectedExpense: (state) => {
      state.selectedExpense = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create expense
      .addCase(createExpense.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update expense
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete expense
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Get summary
      .addCase(getExpenseSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  }
});

export const { setSelectedExpense, clearSelectedExpense, clearError } = expenseSlice.actions;
export default expenseSlice.reducer;