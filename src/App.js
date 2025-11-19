// src/App.js - Updated Routes for Estimation Feature
import React, { useEffect, Suspense, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ConfigProvider, Spin } from 'antd';
import 'antd/dist/reset.css';
import './styles/responsive.css';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { onAuthStateChanged } from 'firebase/auth';

import { store } from './app/store';
import { auth } from './firebase/config';
import { setUser, setLoading } from './features/auth/authSlice';

// Lazy loaded components for better performance
const Login = lazy(() => import('./components/auth/Login'));
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ProductList = lazy(() => import('./components/products/ProductList'));
const CustomerList = lazy(() => import('./components/customer/CustomerList'));
const OrderList = lazy(() => import('./components/billing/OrderList'));
const Billing = lazy(() => import('./components/billing/Billing'));
const Invoice = lazy(() => import('./components/billing/Invoice'));
const InvoiceList = lazy(() => import('./components/billing/InvoiceList'));
const StoreFront = lazy(() => import('./components/storefront/StoreFront'));
const AdvancePayments = lazy(() => import('./components/advance-payments/AdvancePayments'));

// 🆕 LAZY LOADED ESTIMATION COMPONENTS
const EstimationMain = lazy(() => import('./components/estimation/EstimationMain'));
const CreateEstimation = lazy(() => import('./components/estimation/CreateEstimation'));
const EstimationList = lazy(() => import('./components/estimation/EstimationList'));
const EstimateView = lazy(() => import('./components/estimation/EstimateView'));

// Public Components (no login required) - these should load fast
const PublicInvoice = lazy(() => import('./components/public/PublicInvoice'));
const PublicEstimate = lazy(() => import('./components/public/PublicEstimate'));
const ShortUrlRedirect = lazy(() => import('./components/public/ShortUrlRedirect'));

const antdTheme = {
  token: {
    colorPrimary: '#8b4513', // Mitti Arts pottery brown
    borderRadius: 8,
    fontFamily: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica", "Arial", sans-serif',
    // Mobile-first sizing
    controlHeight: 44, // Touch-friendly height
    fontSize: 16, // Prevents zoom on iOS
    lineHeight: 1.5,
  },
  components: {
    Card: {
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(139,69,19,0.1)',
    },
    Button: {
      borderRadius: 8,
      fontWeight: 500,
    },
    Layout: {
      siderBg: '#8b4513',
    },
    Menu: {
      darkItemBg: '#8b4513',
      darkItemSelectedBg: 'rgba(255,255,255,0.2)',
      darkItemHoverBg: 'rgba(255,255,255,0.1)',
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 16,
    },
    Drawer: {
      borderRadius: 12,
    },
  },
};

// Optimized Auth listener component with error handling
const AuthListener = memo(() => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('🔐 Setting up auth listener...');
    dispatch(setLoading(true));
    
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        console.log('🔐 Auth state changed:', user ? 'User logged in' : 'User logged out');
        try {
          if (user) {
            dispatch(setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            }));

            // Initialize default branch only once when user is authenticated
            import('./features/storefront/storefrontSlice').then(({ initializeDefaultBranch }) => {
              dispatch(initializeDefaultBranch()).catch(error => {
                console.warn('Branch initialization skipped:', error.message);
              });
            });
          } else {
            dispatch(setUser(null));
          }
        } catch (error) {
          console.error('❌ Auth state update error:', error);
        } finally {
          dispatch(setLoading(false));
        }
      },
      (error) => {
        console.error('❌ Auth listener error:', error);
        dispatch(setLoading(false));
      }
    );

    return () => {
      console.log('🔐 Cleaning up auth listener...');
      unsubscribe();
    };
  }, [dispatch]);

  return null;
});

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, isLoading } = useSelector(state => state.auth);
  
  console.log('ProtectedRoute - User:', user, 'Loading:', isLoading);
  
  if (isLoading) {
    return (
      <div className="component-loading hw-accelerated" style={{ 
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

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Component Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="component-error hw-accelerated" style={{
          padding: '40px',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏺</div>
          <h2>Oops! Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button 
            className="mitti-button"
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px' }}
          >
            Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details (Development)</summary>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Suspense fallback component
const SuspenseFallback = memo(({ componentName = 'Component' }) => (
  <div className="component-loading hw-accelerated" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
    borderRadius: '12px',
    color: 'white',
    margin: '16px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏺</div>
      <Spin size="large" />
      <p style={{ 
        marginTop: 16, 
        color: 'white',
        fontWeight: '500',
        fontSize: '16px' 
      }}>
        Loading {componentName}...
      </p>
    </div>
  </div>
));

// 🆕 OPTIMIZED ESTIMATION MAIN COMPONENT
const EstimationMainComponent = memo(() => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SuspenseFallback componentName="Estimations" />}>
        <EstimationMain />
      </Suspense>
    </ErrorBoundary>
  );
});

// Main app content with performance optimizations
const AppContent = memo(() => {
  return (
    <Router>
      <AuthListener />
      <Routes>
        {/* PUBLIC ROUTES - No authentication required */}
        <Route path="/login" element={
          <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback componentName="Login" />}>
              <Login />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/public/invoice/:token" element={
          <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback componentName="Invoice" />}>
              <PublicInvoice />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/public/estimate/:token" element={
          <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback componentName="Estimate" />}>
              <PublicEstimate />
            </Suspense>
          </ErrorBoundary>
        } />
        {/* Short URL redirect route - /i/XXXX -> /public/invoice/:token */}
        <Route path="/i/:shortToken" element={
          <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback componentName="Invoice" />}>
              <ShortUrlRedirect />
            </Suspense>
          </ErrorBoundary>
        } />

        {/* PROTECTED ROUTES - Authentication required */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense fallback={<SuspenseFallback componentName="Dashboard" />}>
                  <DashboardLayout>
                <Routes>
                  {/* Dashboard */}
                  <Route path="/" element={
                    <Suspense fallback={<SuspenseFallback componentName="Dashboard" />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  <Route path="/dashboard" element={
                    <Suspense fallback={<SuspenseFallback componentName="Dashboard" />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  
                  {/* Product Management */}
                  <Route path="/products" element={
                    <Suspense fallback={<SuspenseFallback componentName="Products" />}>
                      <ProductList />
                    </Suspense>
                  } />
                  
                  {/* Customer Management */}
                  <Route path="/customers" element={
                    <Suspense fallback={<SuspenseFallback componentName="Customers" />}>
                      <CustomerList />
                    </Suspense>
                  } />
                  
                  {/* Order & Billing Management */}
                  <Route path="/billing" element={
                    <Suspense fallback={<SuspenseFallback componentName="Billing" />}>
                      <Billing />
                    </Suspense>
                  } />
                  <Route path="/orders" element={
                    <Suspense fallback={<SuspenseFallback componentName="Orders" />}>
                      <OrderList />
                    </Suspense>
                  } />
                  
                  {/* Invoice Management */}
                  <Route path="/invoices" element={
                    <Suspense fallback={<SuspenseFallback componentName="Invoices" />}>
                      <InvoiceList />
                    </Suspense>
                  } />
                  <Route path="/invoices/:id" element={
                    <Suspense fallback={<SuspenseFallback componentName="Invoice" />}>
                      <Invoice />
                    </Suspense>
                  } />
                  
                  {/* 🆕 ESTIMATION ROUTES */}
                  <Route path="/estimations" element={<EstimationMainComponent />} />
                  <Route path="/estimations/create" element={
                    <Suspense fallback={<SuspenseFallback componentName="Create Estimation" />}>
                      <CreateEstimation />
                    </Suspense>
                  } />
                  <Route path="/estimations/list" element={
                    <Suspense fallback={<SuspenseFallback componentName="Estimations List" />}>
                      <EstimationList />
                    </Suspense>
                  } />
                  <Route path="/estimations/:id" element={
                    <Suspense fallback={<SuspenseFallback componentName="Estimate View" />}>
                      <EstimateView />
                    </Suspense>
                  } />
                  
                  {/* Advance Payments Management */}
                  <Route path="/advance-payments" element={
                    <Suspense fallback={<SuspenseFallback componentName="Advance Payments" />}>
                      <AdvancePayments />
                    </Suspense>
                  } />
                  <Route path="/advance-payments/*" element={
                    <Suspense fallback={<SuspenseFallback componentName="Advance Payments" />}>
                      <AdvancePayments />
                    </Suspense>
                  } />
                  
                  {/* Store Front Management */}
                  <Route path="/storefront" element={
                    <Suspense fallback={<SuspenseFallback componentName="Store Front" />}>
                      <StoreFront />
                    </Suspense>
                  } />
                  <Route path="/storefront/*" element={
                    <Suspense fallback={<SuspenseFallback componentName="Store Front" />}>
                      <StoreFront />
                    </Suspense>
                  } />
                  
                  {/* Catch all route for protected area */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                  </DashboardLayout>
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route for public area */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
});

// Root component with performance optimization
const AppWrapper = memo(() => {
  // Add performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏺 Mitti Arts POS App Starting...');
      
      // Log performance metrics
      if ('performance' in window) {
        window.addEventListener('load', () => {
          const perfData = performance.getEntriesByType('navigation')[0];
          console.log('🚀 App Load Performance:', {
            DOMContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            LoadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            TotalTime: perfData.loadEventEnd - perfData.fetchStart
          });
        });
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ConfigProvider theme={antdTheme}>
          <AppContent />
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
});

AppWrapper.displayName = 'MittiArtsApp';
export default AppWrapper;