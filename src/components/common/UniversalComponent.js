// Universal Component Wrapper for consistent behavior across all Mitti Arts POS components
import React, { memo, forwardRef, useEffect } from 'react';
import { Spin, Alert, Empty } from 'antd';
import usePerformance from '../../hooks/usePerformance';

/**
 * Universal Component wrapper that provides:
 * - Consistent mobile responsiveness
 * - Error boundaries
 * - Loading states
 * - Performance optimizations
 * - Analytics tracking
 * - Accessibility features
 */
const UniversalComponent = memo(forwardRef(({
  children,
  componentName = 'Component',
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  className = '',
  style = {},
  trackEvents = true,
  enableA11y = true,
  showLoadingSpinner = true,
  loadingMessage = 'Loading...',
  minHeight = '200px',
  ...props
}, ref) => {
  // Use performance hook for consistent behavior
  const {
    isMobile,
    isTablet,
    screenSize,
    breakpoints,
    optimizedClassName,
    getComponentStyles,
    getA11yProps,
    trackComponentEvent,
    handleError,
    log,
    hasError,
    errorMessage,
    resetError
  } = usePerformance(componentName);

  // Track component mount/unmount
  useEffect(() => {
    if (trackEvents) {
      trackComponentEvent('component_mounted', {
        screenSize,
        isMobile,
        isTablet
      });
    }

    return () => {
      if (trackEvents) {
        trackComponentEvent('component_unmounted', {
          screenSize
        });
      }
    };
  }, [trackEvents, screenSize, isMobile, isTablet, trackComponentEvent]);

  // Handle prop errors
  useEffect(() => {
    if (error) {
      handleError(error instanceof Error ? error : new Error(error));
    }
  }, [error, handleError]);

  // Get responsive styles
  const responsiveStyles = getComponentStyles({
    minHeight: loading || empty ? minHeight : 'auto',
    position: 'relative',
    ...style
  });

  // Combine class names
  const combinedClassName = [
    'universal-component',
    optimizedClassName,
    className,
    isMobile && 'mobile-component',
    isTablet && 'tablet-component',
    loading && 'loading-component',
    error && 'error-component',
    empty && 'empty-component'
  ].filter(Boolean).join(' ');

  // Get accessibility properties
  const a11yProps = enableA11y ? getA11yProps('region', componentName) : {};

  // Error state
  if (hasError || error) {
    const displayError = errorMessage || error?.message || 'Something went wrong';
    
    return (
      <div 
        className={`${combinedClassName} component-error`}
        style={responsiveStyles}
        {...a11yProps}
        ref={ref}
        {...props}
      >
        <Alert
          message="Error"
          description={displayError}
          type="error"
          showIcon
          action={
            <button 
              className="mitti-button"
              onClick={resetError}
              style={{ fontSize: isMobile ? '14px' : '16px' }}
            >
              Try Again
            </button>
          }
          style={{
            margin: isMobile ? '8px' : '16px',
            borderRadius: '8px'
          }}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div 
        className={`${combinedClassName} component-loading`}
        style={responsiveStyles}
        {...a11yProps}
        ref={ref}
        {...props}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: isMobile ? '20px' : '40px'
        }}>
          {showLoadingSpinner && (
            <div style={{
              fontSize: isMobile ? '32px' : '48px',
              marginBottom: isMobile ? '12px' : '20px'
            }}>
              🏺
            </div>
          )}
          
          <Spin 
            size={isMobile ? 'default' : 'large'} 
            style={{ marginBottom: isMobile ? '12px' : '16px' }}
          />
          
          {loadingMessage && (
            <div style={{
              color: '#8b4513',
              fontWeight: '500',
              fontSize: isMobile ? '14px' : '16px',
              textAlign: 'center'
            }}>
              {loadingMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (empty) {
    return (
      <div 
        className={`${combinedClassName} component-empty`}
        style={responsiveStyles}
        {...a11yProps}
        ref={ref}
        {...props}
      >
        <Empty
          image={<div style={{ fontSize: isMobile ? '48px' : '64px' }}>🏺</div>}
          description={
            <div style={{
              color: '#8b4513',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '500'
            }}>
              {emptyMessage}
            </div>
          }
          style={{
            padding: isMobile ? '20px' : '40px',
            color: '#8b4513'
          }}
        />
      </div>
    );
  }

  // Normal render
  return (
    <div 
      className={combinedClassName}
      style={responsiveStyles}
      {...a11yProps}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
}));

UniversalComponent.displayName = 'UniversalComponent';

// Higher-order component for wrapping existing components
export const withUniversalComponent = (WrappedComponent, defaultProps = {}) => {
  const UniversalWrappedComponent = memo(forwardRef((props, ref) => {
    const combinedProps = { ...defaultProps, ...props };
    
    return (
      <UniversalComponent
        componentName={WrappedComponent.displayName || WrappedComponent.name || 'Component'}
        ref={ref}
        {...combinedProps}
      >
        <WrappedComponent {...props} />
      </UniversalComponent>
    );
  }));

  UniversalWrappedComponent.displayName = `Universal(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return UniversalWrappedComponent;
};

// Hook for component-level responsive utilities
export const useUniversalComponent = (componentName) => {
  const performance = usePerformance(componentName);
  
  return {
    ...performance,
    // Additional utilities specific to universal components
    getResponsiveProps: (baseProps = {}) => ({
      ...baseProps,
      className: `${baseProps.className || ''} ${performance.optimizedClassName}`.trim(),
      style: performance.getComponentStyles(baseProps.style)
    }),
    
    // Responsive grid columns
    getResponsiveColumns: () => {
      if (performance.isMobile) {
        return { xs: 24, sm: 24, md: 24, lg: 24, xl: 24 };
      }
      if (performance.isTablet) {
        return { xs: 24, sm: 12, md: 12, lg: 12, xl: 12 };
      }
      return { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 };
    },
    
    // Responsive card props
    getResponsiveCardProps: () => ({
      size: performance.isMobile ? 'small' : 'default',
      bordered: true,
      hoverable: !performance.isMobile, // Disable hover on mobile
      style: {
        marginBottom: performance.isMobile ? '8px' : '16px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(139,69,19,0.1)'
      }
    }),
    
    // Responsive button props
    getResponsiveButtonProps: (type = 'default') => ({
      size: performance.isMobile ? 'middle' : 'large',
      type,
      style: {
        borderRadius: '8px',
        fontWeight: '500',
        height: performance.isMobile ? '40px' : '44px'
      }
    }),
    
    // Responsive table props
    getResponsiveTableProps: () => ({
      scroll: { x: performance.isMobile ? 800 : 'max-content' },
      pagination: {
        pageSize: performance.isMobile ? 5 : 10,
        showSizeChanger: !performance.isMobile,
        showQuickJumper: !performance.isMobile,
        size: performance.isMobile ? 'small' : 'default'
      },
      size: performance.isMobile ? 'small' : 'middle'
    }),
    
    // Responsive form props
    getResponsiveFormProps: () => ({
      layout: performance.isMobile ? 'vertical' : 'horizontal',
      labelCol: performance.isMobile ? undefined : { span: 6 },
      wrapperCol: performance.isMobile ? undefined : { span: 18 },
      size: performance.isMobile ? 'middle' : 'large'
    }),
    
    // Responsive modal props
    getResponsiveModalProps: () => ({
      width: performance.isMobile ? '95%' : performance.isTablet ? '80%' : '60%',
      centered: true,
      destroyOnClose: true,
      maskClosable: true,
      keyboard: true
    })
  };
};

// Responsive Layout Component
export const ResponsiveLayout = memo(({ 
  children, 
  gutter = 16, 
  className = '',
  ...props 
}) => {
  const { isMobile, isTablet } = useUniversalComponent('ResponsiveLayout');
  
  const responsiveGutter = isMobile ? 8 : isTablet ? 12 : gutter;
  
  return (
    <div 
      className={`responsive-layout ${className}`} 
      style={{
        padding: isMobile ? '8px' : '16px',
        gap: `${responsiveGutter}px`
      }}
      {...props}
    >
      {children}
    </div>
  );
});

ResponsiveLayout.displayName = 'ResponsiveLayout';

// Responsive Card Component
export const ResponsiveCard = memo(({ 
  children, 
  title,
  extra,
  loading = false,
  className = '',
  ...props 
}) => {
  const { getResponsiveCardProps } = useUniversalComponent('ResponsiveCard');
  
  return (
    <UniversalComponent
      componentName="ResponsiveCard"
      loading={loading}
      className={className}
      {...getResponsiveCardProps()}
      {...props}
    >
      {title && (
        <div style={{ 
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600',
          color: '#8b4513'
        }}>
          {title}
        </div>
      )}
      {extra && (
        <div style={{ float: 'right', marginTop: '-40px' }}>
          {extra}
        </div>
      )}
      <div style={{ clear: 'both' }}>
        {children}
      </div>
    </UniversalComponent>
  );
});

ResponsiveCard.displayName = 'ResponsiveCard';

// Export the main component and utilities
export default UniversalComponent;