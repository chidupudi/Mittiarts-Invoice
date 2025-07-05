// src/App.js - Updated with StoreFront routing
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ConfigProvider, Spin } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { onAuthStateChanged } from 'firebase/auth';

import { store } from './app/store';
import { auth } from './firebase/config';
import { setUser, setLoading } from './features/auth/authSlice';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import ProductList from './components/products/ProductList';
import CustomerList from './components/customer/CustomerList';
import OrderList from './components/billing/OrderList';
import Billing from './components/billing/Billing';
import Invoice from './components/billing/Invoice';
import InvoiceList from './components/billing/InvoiceList';
import StoreFront from './components/storefront/StoreFront';

const antdTheme = {
  token: {
    colorPrimary: '#8b4513', // Updated to Mitti Arts pottery brown
    borderRadius: 8,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    Card: {
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    Button: {
      borderRadius: 8,
    },
    Layout: {
      siderBg: '#8b4513', // Pottery brown sidebar
    },
    Menu: {
      darkItemBg: '#8b4513',
      darkItemSelectedBg: 'rgba(255,255,255,0.2)',
    },
  },
};

// Auth listener component
function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('Setting up auth listener...');
    dispatch(setLoading(true));
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, isLoading } = useSelector(state => state.auth);
  
  console.log('ProtectedRoute - User:', user, 'Loading:', isLoading);
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🏺
          </div>
          <Spin size="large" />
          <p style={{ 
            marginTop: 16, 
            color: '#8b4513',
            fontWeight: 'bold',
            fontSize: '16px' 
          }}>
            Loading Mitti Arts...
          </p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Main app content
function AppContent() {
  return (
    <Router>
      <AuthListener />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  {/* Dashboard */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Product Management */}
                  <Route path="/products" element={<ProductList />} />
                  
                  {/* Customer Management */}
                  <Route path="/customers" element={<CustomerList />} />
                  
                  {/* Order & Billing Management */}
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/orders" element={<OrderList />} />
                  
                  {/* Invoice Management */}
                  <Route path="/invoices" element={<InvoiceList />} />
                  <Route path="/invoices/:id" element={<Invoice />} />
                  
                  {/* Store Front Management - NEW */}
                  <Route path="/storefront" element={<StoreFront />} />
                  <Route path="/storefront/*" element={<StoreFront />} />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

// Root component
export default function AppWrapper() {
  return (
    <Provider store={store}>
      <ConfigProvider theme={antdTheme}>
        <AppContent />
      </ConfigProvider>
    </Provider>
  );
}