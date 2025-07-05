// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/products/productSlice';
import customerReducer from '../features/customer/customerSlice';
import orderReducer from '../features/order/orderSlice';
import expenseReducer from '../features/expense/expenseSlice';
import reportReducer from '../features/reports/reportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    customers: customerReducer,
    orders: orderReducer,
    expenses: expenseReducer,
    reports: reportReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'auth/setUser',
          'products/fetchProducts/fulfilled',
          'customers/fetchCustomers/fulfilled',
          'orders/fetchOrders/fulfilled',
          'expenses/fetchExpenses/fulfilled'
        ],
        ignoredPaths: [
          'products.items',
          'customers.items',
          'orders.items',
          'expenses.items'
        ]
      }
    })
});