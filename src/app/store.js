// src/app/store.js - Updated to include estimation slice
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import orderReducer from '../features/order/orderSlice';
import customerReducer from '../features/customer/customerSlice';
import productReducer from '../features/products/productSlice';
import storefrontReducer from '../features/storefront/storefrontSlice';
// 🆕 ADD ESTIMATION REDUCER
import estimationReducer from '../features/estimation/estimationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    customers: customerReducer,
    products: productReducer,
    storefront: storefrontReducer,
    // 🆕 ADD ESTIMATIONS TO STORE
    estimations: estimationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;