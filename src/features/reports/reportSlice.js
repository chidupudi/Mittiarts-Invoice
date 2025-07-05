// src/features/reports/reportSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';

// Generate sales report
export const generateSalesReport = createAsyncThunk(
  'reports/generateSales',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const options = {
        where: [
          { field: 'createdAt', operator: '>=', value: new Date(startDate) },
          { field: 'createdAt', operator: '<=', value: new Date(endDate) },
          { field: 'status', operator: '!=', value: 'cancelled' }
        ],
        orderBy: { field: 'createdAt', direction: 'asc' }
      };

      const orders = await firebaseService.getAll('orders', options);
      
      // Group by date
      const salesByDate = orders.reduce((acc, order) => {
        const date = new Date(order.createdAt.toDate()).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { _id: date, totalSales: 0, orderCount: 0 };
        }
        acc[date].totalSales += order.total;
        acc[date].orderCount += 1;
        return acc;
      }, {});

      return Object.values(salesByDate);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Generate inventory report
export const generateInventoryReport = createAsyncThunk(
  'reports/generateInventory',
  async (_, { rejectWithValue }) => {
    try {
      const products = await firebaseService.getAll('products');
      
      // Group by category
      const inventoryByCategory = products.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = { 
            _id: category, 
            totalStock: 0, 
            lowStockItems: 0,
            totalValue: 0,
            itemCount: 0
          };
        }
        acc[category].totalStock += product.stock;
        acc[category].totalValue += product.stock * product.price;
        acc[category].itemCount += 1;
        if (product.stock <= 10) {
          acc[category].lowStockItems += 1;
        }
        return acc;
      }, {});

      return Object.values(inventoryByCategory);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Generate customer report
export const generateCustomerReport = createAsyncThunk(
  'reports/generateCustomer',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const customers = await firebaseService.getAll('customers');
      
      // Get orders for the period
      const options = {
        where: [
          { field: 'createdAt', operator: '>=', value: new Date(startDate) },
          { field: 'createdAt', operator: '<=', value: new Date(endDate) },
          { field: 'status', operator: '!=', value: 'cancelled' }
        ]
      };
      
      const orders = await firebaseService.getAll('orders', options);
      
      // Calculate customer spending
      const customerSpending = orders.reduce((acc, order) => {
        if (order.customerId) {
          if (!acc[order.customerId]) {
            acc[order.customerId] = 0;
          }
          acc[order.customerId] += order.total;
        }
        return acc;
      }, {});
      
      // Combine with customer data
      const topCustomers = customers
        .map(customer => ({
          ...customer,
          totalSpent: customerSpending[customer.id] || 0
        }))
        .filter(customer => customer.totalSpent > 0)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      return topCustomers;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Generate expense report
export const generateExpenseReport = createAsyncThunk(
  'reports/generateExpense',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const options = {
        where: [
          { field: 'date', operator: '>=', value: new Date(startDate) },
          { field: 'date', operator: '<=', value: new Date(endDate) }
        ]
      };

      const expenses = await firebaseService.getAll('expenses', options);
      
      // Group by category
      const expensesByCategory = expenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { 
            _id: category, 
            totalExpenses: 0, 
            count: 0,
            averageExpense: 0
          };
        }
        acc[category].totalExpenses += expense.amount;
        acc[category].count += 1;
        return acc;
      }, {});

      // Calculate averages
      Object.values(expensesByCategory).forEach(category => {
        category.averageExpense = category.totalExpenses / category.count;
      });

      return Object.values(expensesByCategory);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Generate profit & loss report
export const generateProfitLossReport = createAsyncThunk(
  'reports/generateProfitLoss',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      // Get sales data
      const salesOptions = {
        where: [
          { field: 'createdAt', operator: '>=', value: new Date(startDate) },
          { field: 'createdAt', operator: '<=', value: new Date(endDate) },
          { field: 'status', operator: '!=', value: 'cancelled' }
        ]
      };
      
      const orders = await firebaseService.getAll('orders', salesOptions);
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;

      // Get expense data
      const expenseOptions = {
        where: [
          { field: 'date', operator: '>=', value: new Date(startDate) },
          { field: 'date', operator: '<=', value: new Date(endDate) }
        ]
      };
      
      const expenses = await firebaseService.getAll('expenses', expenseOptions);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Calculate cost of goods sold (simplified - using 60% of sales as COGS)
      const costOfGoodsSold = totalSales * 0.6;
      const grossProfit = totalSales - costOfGoodsSold;
      const netProfit = grossProfit - totalExpenses;

      return {
        totalSales,
        totalOrders,
        costOfGoodsSold,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin: totalSales > 0 ? (netProfit / totalSales) * 100 : 0
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  reportData: null,
  reportType: null,
  loading: false,
  error: null
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReport: (state) => {
      state.reportData = null;
      state.reportType = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Sales report
      .addCase(generateSalesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reportType = 'sales';
      })
      .addCase(generateSalesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload;
      })
      .addCase(generateSalesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Inventory report
      .addCase(generateInventoryReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reportType = 'inventory';
      })
      .addCase(generateInventoryReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload;
      })
      .addCase(generateInventoryReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Customer report
      .addCase(generateCustomerReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reportType = 'customers';
      })
      .addCase(generateCustomerReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload;
      })
      .addCase(generateCustomerReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Expense report
      .addCase(generateExpenseReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reportType = 'expenses';
      })
      .addCase(generateExpenseReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload;
      })
      .addCase(generateExpenseReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Profit & Loss report
      .addCase(generateProfitLossReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reportType = 'profit-loss';
      })
      .addCase(generateProfitLossReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload;
      })
      .addCase(generateProfitLossReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearReport, clearError } = reportSlice.actions;
export default reportSlice.reducer;