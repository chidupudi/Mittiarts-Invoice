// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/products/productSlice';
import customerReducer from '../features/customer/customerSlice';
import orderReducer from '../features/order/orderSlice';



export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    customers: customerReducer,
    orders: orderReducer,
   
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'auth/setUser',
          'products/fetchProducts/fulfilled',
          'customers/fetchCustomers/fulfilled',
          'orders/fetchOrders/fulfilled'
          
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