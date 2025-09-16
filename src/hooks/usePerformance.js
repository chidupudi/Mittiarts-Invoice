// Custom hook for consistent performance optimization across all components
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Performance optimization hook that provides consistent behavior across all components
 * Automatically handles mobile detection, loading states, error boundaries, and optimization
 */
export const usePerformance = (componentName = 'Component') => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  // Performance monitoring
  const [renderCount, setRenderCount] = useState(0);
  const [loadTime, setLoadTime] = useState(null);

  // Error handling
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Loading states from Redux
  const { loading: ordersLoading } = useSelector(state => state.orders || {});
  const { loading: customersLoading } = useSelector(state => state.customers || {});
  const { loading: productsLoading } = useSelector(state => state.products || {});

  // Combined loading state
  const isAnyLoading = useMemo(() => {
    return ordersLoading || customersLoading || productsLoading;
  }, [ordersLoading, customersLoading, productsLoading]);

  // Screen size detection with debouncing
  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const mobile = width <= 767;
        const tablet = width >= 768 && width <= 1023;
        
        setIsMobile(mobile);
        setIsTablet(tablet);
        setScreenSize(mobile ? 'mobile' : tablet ? 'tablet' : 'desktop');
        
        // Log performance info in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`📱 Screen size changed: ${width}px (${mobile ? 'mobile' : tablet ? 'tablet' : 'desktop'})`);
        }
      }, 150);
    };

    // Initial detection
    handleResize();

    // Add listener with passive flag for better performance
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Component load time tracking
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLoadTime(duration);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${componentName} mount/unmount time: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  // Render count tracking for performance monitoring
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    
    if (process.env.NODE_ENV === 'development' && renderCount > 10) {
      console.warn(`🔄 ${componentName} has re-rendered ${renderCount} times. Consider optimization.`);
    }
  });

  // Error boundary functionality
  const handleError = useCallback((error, errorInfo = {}) => {
    setHasError(true);
    setErrorMessage(error.message || 'An unexpected error occurred');
    
    console.error(`❌ Error in ${componentName}:`, error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorReportingService.captureException(error, { component: componentName });
    }
  }, [componentName]);

  // Reset error state
  const resetError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
  }, []);

  // Performance optimization helpers
  const optimizedClassName = useMemo(() => {
    const classes = ['hw-accelerated'];
    
    if (isMobile) classes.push('mobile-optimized');
    if (isTablet) classes.push('tablet-optimized');
    if (isAnyLoading) classes.push('loading-state');
    
    return classes.join(' ');
  }, [isMobile, isTablet, isAnyLoading]);

  // Responsive breakpoint utilities
  const breakpoints = useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    isSmallMobile: window.innerWidth <= 480,
    isLargeMobile: isMobile && window.innerWidth > 480,
    isSmallTablet: isTablet && window.innerWidth <= 900,
    isLargeTablet: isTablet && window.innerWidth > 900
  }), [isMobile, isTablet, screenSize]);

  // Touch/click handlers for better mobile experience
  const createTouchHandler = useCallback((callback, options = {}) => {
    const { preventDefault = true, stopPropagation = false } = options;
    
    return (event) => {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      
      // Add haptic feedback on supported devices
      if ('vibrate' in navigator && isMobile) {
        navigator.vibrate(10);
      }
      
      callback(event);
    };
  }, [isMobile]);

  // Debounced callback creator
  const createDebouncedCallback = useCallback((callback, delay = 300) => {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    };
  }, []);

  // Throttled callback creator
  const createThrottledCallback = useCallback((callback, limit = 100) => {
    let inThrottle;
    
    return (...args) => {
      if (!inThrottle) {
        callback(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // Intersection Observer for lazy loading
  const createIntersectionObserver = useCallback((callback, options = {}) => {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  }, []);

  // Memory usage monitoring (development only)
  const getMemoryUsage = useCallback(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }, []);

  // Component analytics helper
  const trackComponentEvent = useCallback((eventName, properties = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${componentName} Event: ${eventName}`, {
        component: componentName,
        screenSize,
        isMobile,
        renderCount,
        loadTime,
        ...properties
      });
    }
    
    // In production, send to analytics service
    // Example: analytics.track(eventName, { component: componentName, ...properties });
  }, [componentName, screenSize, isMobile, renderCount, loadTime]);

  // Component styles based on performance state
  const getComponentStyles = useCallback((baseStyles = {}) => {
    const performanceStyles = {
      ...baseStyles,
      transition: 'all 0.3s ease',
      ...(isAnyLoading && {
        opacity: 0.7,
        pointerEvents: 'none'
      }),
      ...(isMobile && {
        padding: '8px',
        margin: '4px'
      }),
      ...(isTablet && {
        padding: '16px',
        margin: '8px'
      })
    };

    return performanceStyles;
  }, [isAnyLoading, isMobile, isTablet]);

  // Accessibility helpers
  const getA11yProps = useCallback((role = 'region', label = componentName) => {
    return {
      role,
      'aria-label': label,
      'aria-live': isAnyLoading ? 'polite' : 'off',
      'aria-busy': isAnyLoading,
      ...(hasError && {
        'aria-invalid': true,
        'aria-describedby': `${componentName}-error`
      })
    };
  }, [componentName, isAnyLoading, hasError]);

  return {
    // Device detection
    isMobile,
    isTablet,
    screenSize,
    breakpoints,
    
    // Performance monitoring
    renderCount,
    loadTime,
    isAnyLoading,
    optimizedClassName,
    getMemoryUsage,
    
    // Error handling
    hasError,
    errorMessage,
    handleError,
    resetError,
    
    // Event handlers
    createTouchHandler,
    createDebouncedCallback,
    createThrottledCallback,
    createIntersectionObserver,
    
    // Analytics
    trackComponentEvent,
    
    // Styling and accessibility
    getComponentStyles,
    getA11yProps,
    
    // Utility functions
    log: (message, data = {}) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏺 [${componentName}] ${message}`, data);
      }
    },
    
    warn: (message, data = {}) => {
      console.warn(`⚠️ [${componentName}] ${message}`, data);
    },
    
    error: (message, error = null) => {
      console.error(`❌ [${componentName}] ${message}`, error);
      handleError(error || new Error(message));
    }
  };
};

/**
 * Hook for optimizing expensive calculations
 */
export const useOptimizedMemo = (calculation, dependencies, debugName = 'calculation') => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = calculation();
    const duration = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development' && duration > 50) {
      console.warn(`⏱️ Expensive ${debugName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }, dependencies);
};

/**
 * Hook for tracking component visibility (useful for analytics)
 */
export const useVisibility = (ref, threshold = 0.5) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, threshold, hasBeenVisible]);

  return { isVisible, hasBeenVisible };
};

export default usePerformance;