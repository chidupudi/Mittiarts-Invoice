// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/products/productSlice';
import customerReducer from '../features/customer/customerSlice';
import orderReducer from '../features/order/orderSlice';
import storefrontReducer from '../features/storefront/storefrontSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    customers: customerReducer,
    orders: orderReducer,
    storefront: storefrontReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'auth/setUser',
          'products/fetchProducts/fulfilled',
          'customers/fetchCustomers/fulfilled',
          'orders/fetchOrders/fulfilled',
          'storefront/fetchBranches/fulfilled',
          'storefront/fetchStalls/fulfilled',
          'storefront/fetchMainStore/fulfilled',
        ],
        ignoredPaths: [
          'products.items',
          'customers.items',
          'orders.items',
          'storefront.branches',
          'storefront.stalls',
          'storefront.mainStore'
        ]
      }
    })
});