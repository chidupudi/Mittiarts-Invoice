# 🏺 Mitti Arts POS - Component Development Guide

## How to Create Mobile-First, Professional Components

This guide ensures all new components work consistently across all devices and maintain professional-level performance.

## 🚀 Quick Start Template

```javascript
// components/example/ExampleComponent.js
import React, { useState, useCallback, memo } from 'react';
import { Card, Button, Row, Col } from 'antd';
import UniversalComponent, { useUniversalComponent } from '../common/UniversalComponent';
import usePerformance from '../../hooks/usePerformance';

const ExampleComponent = memo(() => {
  // 1. Use performance hook for consistent behavior
  const {
    isMobile,
    isTablet,
    screenSize,
    getResponsiveCardProps,
    getResponsiveButtonProps,
    trackComponentEvent,
    log
  } = useUniversalComponent('ExampleComponent');

  // 2. State management
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // 3. Optimized event handlers
  const handleAction = useCallback(async () => {
    setLoading(true);
    trackComponentEvent('action_clicked', { screenSize });
    
    try {
      // Your logic here
      log('Action performed successfully');
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  }, [screenSize, trackComponentEvent, log]);

  // 4. Return with UniversalComponent wrapper
  return (
    <UniversalComponent
      componentName="ExampleComponent"
      loading={loading}
      empty={data.length === 0}
      emptyMessage="No data available"
    >
      <Card {...getResponsiveCardProps()}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Button 
              {...getResponsiveButtonProps('primary')}
              onClick={handleAction}
              loading={loading}
            >
              {isMobile ? 'Action' : 'Perform Action'}
            </Button>
          </Col>
        </Row>
      </Card>
    </UniversalComponent>
  );
});

ExampleComponent.displayName = 'ExampleComponent';
export default ExampleComponent;
```

## 📱 Mobile-First CSS Classes

Use these pre-built CSS classes for instant mobile optimization:

```css
/* Responsive Visibility */
.show-mobile      /* Show only on mobile */
.show-tablet      /* Show only on tablet */
.show-desktop     /* Show only on desktop */
.hide-mobile      /* Hide on mobile */
.hide-tablet      /* Hide on tablet */
.hide-desktop     /* Hide on desktop */

/* Performance Classes */
.hw-accelerated   /* GPU acceleration */
.will-change-transform
.will-change-opacity

/* Loading States */
.component-loading
.loading-skeleton
.mitti-loading

/* Brand Styling */
.mitti-card       /* Professional card styling */
.mitti-button     /* Branded button styling */
.mitti-gradient   /* Brand gradient background */
.mitti-shadow     /* Consistent shadow */

/* Responsive Utilities */
.mobile-full-width     /* Full width on mobile */
.mobile-sticky-actions /* Sticky actions bar on mobile */
.responsive-card-grid  /* Auto-responsive card grid */
```

## 🎯 Component Patterns

### 1. Data List Component
```javascript
import React, { useEffect, useState, memo } from 'react';
import { Table, Card, Input, Space } from 'antd';
import UniversalComponent, { useUniversalComponent } from '../common/UniversalComponent';

const DataListComponent = memo(({ dataSource = [], onSearch, onEdit, onDelete }) => {
  const {
    isMobile,
    getResponsiveTableProps,
    getResponsiveCardProps,
    trackComponentEvent
  } = useUniversalComponent('DataListComponent');

  const [filteredData, setFilteredData] = useState(dataSource);

  const handleSearch = useCallback((value) => {
    const filtered = dataSource.filter(item => 
      item.name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
    trackComponentEvent('search_performed', { query: value, resultCount: filtered.length });
  }, [dataSource, trackComponentEvent]);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', responsive: ['sm'] },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => onEdit(record)}>Edit</Button>
          <Button size="small" danger onClick={() => onDelete(record)}>Delete</Button>
        </Space>
      )
    }
  ];

  return (
    <UniversalComponent
      componentName="DataListComponent"
      empty={filteredData.length === 0}
      emptyMessage="No items found"
    >
      <Card {...getResponsiveCardProps()} title="Data List">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Search
            placeholder="Search items..."
            onSearch={handleSearch}
            style={{ marginBottom: 16 }}
            size={isMobile ? 'middle' : 'large'}
          />
          
          {isMobile ? (
            // Mobile: Card view
            <div className="responsive-card-grid">
              {filteredData.map(item => (
                <Card key={item.id} size="small" className="fade-in">
                  <h4>{item.name}</h4>
                  <p>Status: {item.status}</p>
                  <Space>
                    <Button size="small" onClick={() => onEdit(item)}>Edit</Button>
                    <Button size="small" danger onClick={() => onDelete(item)}>Delete</Button>
                  </Space>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop: Table view
            <Table
              {...getResponsiveTableProps()}
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
            />
          )}
        </Space>
      </Card>
    </UniversalComponent>
  );
});
```

### 2. Form Component
```javascript
import React, { useState, memo } from 'react';
import { Form, Input, Button, Card, Row, Col, message } from 'antd';
import UniversalComponent, { useUniversalComponent } from '../common/UniversalComponent';

const FormComponent = memo(({ onSubmit, initialValues = {} }) => {
  const {
    isMobile,
    getResponsiveFormProps,
    getResponsiveCardProps,
    getResponsiveButtonProps
  } = useUniversalComponent('FormComponent');

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await onSubmit(values);
      message.success('Form submitted successfully!');
      form.resetFields();
    } catch (error) {
      message.error('Form submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalComponent
      componentName="FormComponent"
      loading={loading}
    >
      <Card {...getResponsiveCardProps()} title="Form">
        <Form
          {...getResponsiveFormProps()}
          form={form}
          initialValues={initialValues}
          onFinish={handleSubmit}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            
            <Col xs={24}>
              <Form.Item>
                <Button
                  {...getResponsiveButtonProps('primary')}
                  htmlType="submit"
                  loading={loading}
                  className={isMobile ? 'mobile-full-width' : ''}
                >
                  Submit
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </UniversalComponent>
  );
});
```

## 📊 Performance Best Practices

### 1. Always Use Memoization
```javascript
// ✅ Good
const MyComponent = memo(({ data, onUpdate }) => {
  const expensiveValue = useMemo(() => 
    data.reduce((sum, item) => sum + item.value, 0)
  , [data]);

  const handleClick = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);

  return <div>{expensiveValue}</div>;
});

// ❌ Bad
const MyComponent = ({ data, onUpdate }) => {
  const expensiveValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div onClick={() => onUpdate(data.id)}>
      {expensiveValue}
    </div>
  );
};
```

### 2. Use Performance Hook
```javascript
const MyComponent = memo(() => {
  const { 
    trackComponentEvent,
    createDebouncedCallback,
    log,
    warn
  } = usePerformance('MyComponent');

  // Debounce expensive operations
  const debouncedSearch = useMemo(
    () => createDebouncedCallback((query) => {
      // Search logic
      trackComponentEvent('search_performed', { query });
    }, 300),
    [createDebouncedCallback, trackComponentEvent]
  );

  return <div>{/* Component content */}</div>;
});
```

### 3. Handle Loading and Error States
```javascript
const MyComponent = memo(() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  return (
    <UniversalComponent
      componentName="MyComponent"
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyMessage="No data available"
    >
      {/* Your component content */}
    </UniversalComponent>
  );
});
```

## 🎨 Styling Guidelines

### 1. Use CSS Variables
```css
.my-component {
  background: var(--mitti-primary);
  color: var(--mitti-text-dark);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  box-shadow: var(--mitti-shadow);
}

@media (max-width: 767px) {
  .my-component {
    padding: var(--space-sm);
  }
}
```

### 2. Responsive Design Patterns
```css
/* Mobile-first approach */
.my-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-sm);
}

@media (min-width: 768px) {
  .my-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
}

@media (min-width: 1024px) {
  .my-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-lg);
  }
}
```

## 🔄 State Management

### 1. Redux Integration
```javascript
const MyComponent = memo(() => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(state => state.mySlice);
  
  const { trackComponentEvent } = useUniversalComponent('MyComponent');

  const handleCreate = useCallback(async (data) => {
    try {
      const result = await dispatch(createItem(data));
      if (createItem.fulfilled.match(result)) {
        trackComponentEvent('item_created', { itemId: result.payload.id });
        message.success('Item created successfully!');
      }
    } catch (error) {
      message.error('Failed to create item');
    }
  }, [dispatch, trackComponentEvent]);

  return (
    <UniversalComponent loading={loading}>
      {/* Component content */}
    </UniversalComponent>
  );
});
```

## 🧪 Testing Pattern
```javascript
// __tests__/MyComponent.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import MyComponent from '../MyComponent';
import { store } from '../../app/store';

const renderWithProvider = (component) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('MyComponent', () => {
  test('renders correctly on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithProvider(<MyComponent />);
    
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  test('handles loading state', () => {
    renderWithProvider(<MyComponent loading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

## 📋 Checklist for New Components

### ✅ Performance
- [ ] Component wrapped with `memo()`
- [ ] Event handlers use `useCallback()`
- [ ] Expensive calculations use `useMemo()`
- [ ] Uses `usePerformance` hook
- [ ] Includes loading/error states

### ✅ Mobile Responsiveness  
- [ ] Uses `UniversalComponent` wrapper
- [ ] Responsive breakpoints implemented
- [ ] Touch-friendly button sizes (44px minimum)
- [ ] Prevents zoom on iOS inputs (16px font-size)
- [ ] Works in landscape and portrait modes

### ✅ Accessibility
- [ ] Proper ARIA labels and roles
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Color contrast compliance
- [ ] Screen reader friendly

### ✅ Code Quality
- [ ] TypeScript or PropTypes validation
- [ ] Error boundaries implemented
- [ ] Clean up effects on unmount
- [ ] Consistent naming conventions
- [ ] Unit tests written

### ✅ User Experience
- [ ] Loading indicators
- [ ] Empty states with helpful messages
- [ ] Error states with recovery options
- [ ] Smooth animations and transitions
- [ ] Intuitive interactions

## 🚀 Deployment

Run these commands to ensure everything works:

```bash
# Check mobile responsiveness
npm run build
npm run start

# Test on different screen sizes
# Chrome DevTools > Toggle Device Toolbar

# Performance audit
npm run build
# Use Chrome DevTools Lighthouse

# Accessibility check
# Use axe-core browser extension
```

## 📞 Need Help?

- Check existing components in `/src/components/` for examples
- Use browser DevTools to debug responsive issues  
- Test on real devices when possible
- Follow the console logs for performance insights

---

**Remember: Every component should work perfectly on mobile, tablet, and desktop from day one! 📱💻🖥️**