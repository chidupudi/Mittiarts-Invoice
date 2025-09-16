// src/components/estimation/CreateEstimation.js
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Row,
  Col,
  Card,
  Switch,
  Tooltip,
  Typography,
  Space,
  Divider,
  Popconfirm,
  message,
  Form,
  Badge,
  Button,
  Input,
  Alert
} from 'antd';
import {
  ShoppingCartOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import existing components from billing (reuse)
import ProductSelection from '../billing/ProductSelection';
import CustomerSelection from '../billing/CustomerSelection';
import LocationSelector from '../billing/LocationSelector';
import { 
  ProductModal, 
  CustomerModal, 
  PriceEditModal 
} from '../billing/BillingModals';

// Import existing helpers
import { 
  getProductPrice, 
  calculateTotals, 
  cleanLocationInfo,
  removeUndefinedDeep
} from '../billing/BillingHelpers';

// Import estimation actions
import { 
  createEstimate,
  addToEstimateCart,
  removeFromEstimateCart,
  updateEstimateCartItemQuantity,
  updateEstimateCartItemPrice,
  clearEstimateCart,
  clearError
} from '../../features/estimation/estimationSlice';

// Reuse other slices
import { fetchBranches, fetchStalls } from '../../features/storefront/storefrontSlice';
import { fetchCustomers, createCustomer } from '../../features/customer/customerSlice';
import { fetchProducts, createProduct } from '../../features/products/productSlice';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Estimate Cart Display Component
const EstimateCartDisplay = ({ 
  cart, 
  businessType, 
  onQuantityChange, 
  onRemoveItem, 
  onOpenPriceEdit 
}) => {
  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
        <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <div>No items in estimate</div>
        <div style={{ fontSize: '12px' }}>Add pottery products to create estimate</div>
        <div style={{ fontSize: '11px', color: '#fa8c16', marginTop: 8 }}>
          Maximum 8 items allowed
        </div>
      </div>
    );
  }

  return (
    <div>
      {cart.map((item, index) => (
        <Card 
          key={item.product.id} 
          size="small" 
          style={{ 
            marginBottom: 8,
            border: '1px solid #d9d9d9',
            borderRadius: '6px'
          }}
        >
          <Row align="middle" gutter={8}>
            <Col span={1}>
              <Text strong style={{ color: '#8b4513' }}>{index + 1}</Text>
            </Col>
            <Col span={10}>
              <div>
                <Text strong style={{ fontSize: '13px' }}>{item.product.name}</Text>
                {item.product.isDynamic && (
                  <div><Badge count="Custom" style={{ backgroundColor: '#52c41a', fontSize: '9px' }} /></div>
                )}
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {item.product.category} • {businessType === 'wholesale' ? '🏪 Wholesale' : '🛍️ Retail'}
                </div>
              </div>
            </Col>
            <Col span={3}>
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => onQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                size="small"
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <div>
                {item.originalPrice !== item.currentPrice && (
                  <div style={{ 
                    fontSize: '10px', 
                    textDecoration: 'line-through', 
                    color: '#999' 
                  }}>
                    ₹{item.originalPrice}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Text strong style={{ color: item.originalPrice !== item.currentPrice ? '#52c41a' : 'inherit' }}>
                    ₹{item.currentPrice}
                  </Text>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => onOpenPriceEdit(item)}
                    style={{ padding: 0, minWidth: 'auto', fontSize: '10px' }}
                    title="Edit Price"
                  >
                    ✏️
                  </Button>
                </div>
              </div>
            </Col>
            <Col span={4}>
              <Text strong style={{ color: '#8b4513' }}>
                ₹{(item.currentPrice * item.quantity).toFixed(2)}
              </Text>
            </Col>
            <Col span={2}>
              <Popconfirm
                title="Remove item?"
                onConfirm={() => onRemoveItem(item.product.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  style={{ padding: 0 }}
                >
                  🗑️
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        </Card>
      ))}
      
      {cart.length >= 8 && (
        <Alert
          message="Maximum items reached"
          description="Estimates can contain maximum 8 items. Remove items to add new ones."
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
};

// Estimate Summary Component
const EstimateSummary = ({ 
  cart, 
  businessType,
  selectedCustomer,
  currentLocation,
  notes,
  onNotesChange,
  onSubmit,
  disabled
}) => {
  const totals = calculateTotals(cart, businessType || 'retail');

  return (
    <Card 
      title={
        <Space>
          <FileTextOutlined />
          <span>Estimate Summary</span>
        </Space>
      }
      size="small"
      style={{ flex: 1 }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={8} style={{ marginBottom: 8 }}>
          <Col span={12}>
            <Text strong>Items: {totals.itemCount}/8</Text>
          </Col>
          <Col span={12}>
            <Text strong>Qty: {totals.totalQuantity}</Text>
          </Col>
        </Row>

        <Row justify="space-between" style={{ marginBottom: 8 }}>
          <Text>List Price:</Text>
          <Text>₹{totals.subtotal.toFixed(2)}</Text>
        </Row>
        
        {totals.totalDiscount !== 0 && (
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <Text style={{ color: totals.totalDiscount > 0 ? '#fa8c16' : '#52c41a' }}>
              {totals.totalDiscount > 0 ? '💝 Discount:' : '📈 Premium:'}
            </Text>
            <Text style={{ 
              color: totals.totalDiscount > 0 ? '#fa8c16' : '#52c41a', 
              fontWeight: 'bold' 
            }}>
              {totals.totalDiscount > 0 ? '-' : '+'}₹{Math.abs(totals.totalDiscount).toFixed(2)}
            </Text>
          </Row>
        )}

        {totals.wholesaleDiscount > 0 && (
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <Text style={{ color: '#722ed1' }}>🏪 Wholesale Discount:</Text>
            <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>
              -₹{totals.wholesaleDiscount.toFixed(2)}
            </Text>
          </Row>
        )}
        
        <Divider style={{ margin: '8px 0' }} />
        
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 16 }}>Estimated Total:</Text>
          <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
            ₹{totals.finalTotal.toFixed(2)}
          </Text>
        </Row>

        {businessType === 'wholesale' && totals.currentTotal > 10000 && (
          <div style={{ 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: 4, 
            padding: 8, 
            marginBottom: 12,
            textAlign: 'center'
          }}>
            <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
              🏪 Wholesale estimate above ₹10,000 - Additional 5% discount applied!
            </Text>
          </div>
        )}
      </div>

      {/* Customer Info */}
      {selectedCustomer && (
        <div style={{ 
          backgroundColor: '#f0f5ff', 
          border: '1px solid #adc6ff', 
          borderRadius: 4, 
          padding: 8, 
          marginBottom: 16,
          fontSize: '12px'
        }}>
          <div><strong>Customer:</strong> {selectedCustomer.name}</div>
          {selectedCustomer.phone && (
            <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
          )}
          <div><strong>Location:</strong> {currentLocation?.displayName || 'No location'}</div>
          <div><strong>Type:</strong> {businessType === 'retail' ? '🛍️ Retail' : '🏪 Wholesale'}</div>
        </div>
      )}

      {/* Notes Section */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Estimate Notes:
        </Text>
        <TextArea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes for customer (terms, conditions, special instructions...)"
          rows={4}
          maxLength={500}
          showCount
          style={{ fontSize: '12px' }}
        />
      </div>

      {/* Validity Info */}
      <div style={{ 
        backgroundColor: '#fff7e6', 
        border: '1px solid #ffd591', 
        borderRadius: 4, 
        padding: 8, 
        marginBottom: 16,
        textAlign: 'center'
      }}>
        <Text style={{ color: '#fa8c16', fontSize: '12px' }}>
          ⏱️ This estimate is valid for 3 months from creation date
        </Text>
      </div>

      <Button
        type="primary"
        size="large"
        onClick={onSubmit}
        block
        disabled={disabled}
        icon={<CheckOutlined />}
        style={{ height: 48, fontSize: 16 }}
      >
        Generate Estimate
      </Button>
    </Card>
  );
};

const CreateEstimation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { estimateCart, loading, error } = useSelector(state => state.estimations);
  const { items: customers } = useSelector(state => state.customers);
  const { items: products } = useSelector(state => state.products);
  const { branches, stalls } = useSelector(state => state.storefront);

  // Core estimation states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [businessType, setBusinessType] = useState('retail');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [notes, setNotes] = useState('');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [productForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  
  // Price editing states
  const [editingItem, setEditingItem] = useState(null);
  const [newPrice, setNewPrice] = useState(0);

  // Memoize locations
  const locations = useMemo(() => [
    ...branches.map(branch => ({
      ...branch,
      type: 'branch',
      displayName: `🏪 ${branch.name}`,
      locationInfo: `${branch.address?.city || 'Branch Location'}`
    })),
    ...stalls.map(stall => ({
      ...stall,
      type: 'stall',
      displayName: `🎪 ${stall.name}`,
      locationInfo: `${stall.location || 'Event Location'} - ${stall.eventName || 'Fair/Event'}`
    }))
  ], [branches, stalls]);

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchCustomers({}));
    dispatch(fetchProducts({}));
    dispatch(fetchBranches({}));
    dispatch(fetchStalls({}));
  }, [dispatch]);

  // Set default branch when locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !selectedBranch) {
      const mainBranch = locations.find(loc => 
        loc.type === 'branch' && (
          loc.isMainBranch || 
          loc.name.toLowerCase().includes('main') ||
          loc.name.toLowerCase().includes('showroom')
        )
      );
      const anyBranch = locations.find(loc => loc.type === 'branch');
      const defaultLocation = mainBranch || anyBranch || locations[0];
      setSelectedBranch(defaultLocation.id);
    }
  }, [locations, selectedBranch]);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Get current location
  const currentLocation = locations.find(l => l.id === selectedBranch) || locations[0];

  // Handle adding product to estimate cart
  const handleAddProduct = (productData) => {
    dispatch(addToEstimateCart(productData));
    message.success(`${productData.product.name} added to estimate`);
  };

  // Handle adding custom product
  const handleAddDynamicProduct = async () => {
    try {
      const values = await productForm.validateFields();
      
      const tempProduct = {
        id: `temp_${Date.now()}`,
        name: values.name,
        price: businessType === 'retail' ? values.retailPrice : values.wholesalePrice,
        retailPrice: values.retailPrice,
        wholesalePrice: values.wholesalePrice,
        category: 'Custom',
        stock: 999,
        isDynamic: true
      };

      const price = getProductPrice(tempProduct, businessType);
      handleAddProduct({
        product: tempProduct, 
        quantity: values.quantity,
        originalPrice: price,
        currentPrice: price,
        businessType,
        branch: selectedBranch
      });

      productForm.resetFields();
      setShowProductModal(false);
      message.success('Custom pottery product added to estimate!');
    } catch (error) {
      message.error('Please fill all required fields');
    }
  };

  // Customer handling
  const handleAddDynamicCustomer = async () => {
    try {
      const values = await customerForm.validateFields();
      
      const result = await dispatch(createCustomer({
        name: values.name,
        phone: values.phone || '',
        email: values.email || '',
        businessType: businessType,
        preferredBranch: selectedBranch,
        address: { street: '', city: '', state: '', pincode: '' }
      }));

      if (createCustomer.fulfilled.match(result)) {
        setSelectedCustomer(result.payload);
        customerForm.resetFields();
        setShowCustomerModal(false);
        message.success('Customer added successfully!');
        dispatch(fetchCustomers({}));
      }
    } catch (error) {
      message.error('Error adding customer');
    }
  };

  // Cart item management
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity > 0) {
      dispatch(updateEstimateCartItemQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromEstimateCart(productId));
    message.success('Item removed from estimate');
  };

  // Price negotiation
  const openPriceEdit = (item) => {
    setEditingItem(item);
    setNewPrice(item.currentPrice);
    setShowPriceModal(true);
  };

  const applyNewPrice = () => {
    if (!editingItem || newPrice <= 0) {
      message.error('Please enter a valid price');
      return;
    }

    dispatch(updateEstimateCartItemPrice({ 
      productId: editingItem.product.id, 
      newPrice: newPrice 
    }));
    
    const difference = editingItem.originalPrice - newPrice;
    if (difference > 0) {
      message.success(`Price reduced! Giving ₹${difference.toFixed(2)} discount to customer`);
    } else if (difference < 0) {
      message.success(`Price increased by ₹${Math.abs(difference).toFixed(2)}`);
    } else {
      message.info('Price updated!');
    }
    
    setShowPriceModal(false);
    setEditingItem(null);
  };

  // Estimate submission
  const handleSubmit = async () => {
    if (estimateCart.length === 0) {
      message.warning('Please add items to estimate');
      return;
    }
    
    if (!selectedCustomer) {
      message.warning("Please select a customer");
      return;
    }

    if (!notes.trim()) {
      message.warning('Please add notes for the estimate');
      return;
    }

    try {
      // Clean and prepare estimate data
      const cleanItems = estimateCart.map(item => ({
        product: {
          id: item.product?.id || `temp_${Date.now()}`,
          name: item.product?.name || 'Unknown Product',
          category: item.product?.category || 'Pottery',
          isDynamic: Boolean(item.product?.isDynamic)
        },
        quantity: Number(item.quantity) || 1,
        originalPrice: Number(item.originalPrice) || Number(item.currentPrice) || 0,
        currentPrice: Number(item.currentPrice) || 0,
        price: Number(item.currentPrice) || 0,
        businessType: businessType || 'retail'
      }));

      // Calculate totals safely
      const subtotal = cleanItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
      const currentTotal = cleanItems.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
      const discount = subtotal - currentTotal;

      const estimateData = {
        items: cleanItems,
        customerId: selectedCustomer?.id || null,
        businessType: businessType || 'retail',
        branch: selectedBranch || 'main',
        branchInfo: currentLocation ? {
          id: currentLocation.id || 'main',
          name: currentLocation.name || 'Main Branch',
          type: currentLocation.type || 'branch',
          displayName: currentLocation.displayName || 'Main Branch',
          locationInfo: currentLocation.locationInfo || ''
        } : null,
        notes: notes.trim(),
        
        // Financial calculations
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        total: Number(currentTotal) || 0
      };

      console.log('Submitting estimate data:', estimateData);

      const result = await dispatch(createEstimate(estimateData));
      if (createEstimate.fulfilled.match(result)) {
        message.success('Estimate generated successfully!');
        navigate(`/estimations/${result.payload.id}`);
      } else if (result.error) {
        throw new Error(result.error.message || 'Failed to create estimate');
      }
    } catch (error) {
      console.error('Error creating estimate:', error);
      message.error(`Failed to create estimate: ${error.message}`);
    }
  };

  // Modal handlers
  const handleCloseProductModal = () => setShowProductModal(false);
  const handleCloseCustomerModal = () => setShowCustomerModal(false);
  const handleClosePriceModal = () => setShowPriceModal(false);

  return (
    <div style={{ padding: 16, height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)', 
        color: 'white', 
        padding: '12px 20px', 
        borderRadius: '8px 8px 0 0',
        marginBottom: 16,
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'white',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b4513',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                📋
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: 'white' }}>Mitti Arts - Create Estimate</Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                  🏺 Handcrafted Pottery Estimates • {currentLocation?.displayName || 'Loading...'}
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <LocationSelector 
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              businessType={businessType}
              setBusinessType={setBusinessType}
              locations={locations}
            />
          </Col>
        </Row>
      </div>

      {/* Error Display */}
      {error && (
        <Alert
          message="Estimate Creation Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => dispatch(clearError())}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={12} style={{ height: 'calc(100% - 80px)' }}>
        {/* Left Side - Product Selection & Cart */}
        <Col xs={24} lg={14} style={{ height: '100%' }}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Product Selection - {businessType === 'retail' ? 'Retail Prices' : 'Wholesale Prices'}</span>
                <Badge 
                  count={`${estimateCart.length}/8`} 
                  style={{ backgroundColor: estimateCart.length >= 8 ? '#ff4d4f' : '#52c41a' }} 
                />
              </Space>
            }
            size="small"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'hidden', padding: '12px' }}
            extra={
              <Space>
                <Tooltip title="Estimates can contain maximum 8 items">
                  <InfoCircleOutlined style={{ color: '#faad14' }} />
                </Tooltip>
                
                {estimateCart.length > 0 && (
                  <Popconfirm
                    title="Clear all items from estimate?"
                    onConfirm={() => dispatch(clearEstimateCart())}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button size="small" danger>Clear Cart</Button>
                  </Popconfirm>
                )}
              </Space>
            }
          >
            <ProductSelection 
              products={products}
              businessType={businessType}
              selectedBranch={selectedBranch}
              onAddProduct={handleAddProduct}
              onShowProductModal={() => setShowProductModal(true)}
            />

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ flex: 1, overflow: 'auto' }}>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Estimate Items ({estimateCart.length}/8)
              </Title>
              
              <EstimateCartDisplay 
                cart={estimateCart}
                businessType={businessType}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                onOpenPriceEdit={openPriceEdit}
              />
            </div>
          </Card>
        </Col>

        {/* Right Side - Customer & Summary */}
        <Col xs={24} lg={10} style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
            <CustomerSelection 
              selectedCustomer={selectedCustomer}
              customers={customers}
              onSelectCustomer={setSelectedCustomer}
              onShowCustomerModal={() => setShowCustomerModal(true)}
            />

            <EstimateSummary 
              cart={estimateCart}
              businessType={businessType}
              selectedCustomer={selectedCustomer}
              currentLocation={currentLocation}
              notes={notes}
              onNotesChange={setNotes}
              onSubmit={handleSubmit}
              disabled={loading || estimateCart.length === 0 || !selectedCustomer || !notes.trim()}
            />
          </div>
        </Col>
      </Row>

      {/* Modals */}
      <ProductModal 
        visible={showProductModal}
        onCancel={handleCloseProductModal}
        onAddProduct={handleAddDynamicProduct}
        form={productForm}
        businessType={businessType}
      />
      
      <CustomerModal 
        visible={showCustomerModal}
        onCancel={handleCloseCustomerModal}
        onAddCustomer={handleAddDynamicCustomer}
        form={customerForm}
      />
      
      <PriceEditModal 
        visible={showPriceModal}
        onCancel={handleClosePriceModal}
        onApply={applyNewPrice}
        editingItem={editingItem}
        newPrice={newPrice}
        onNewPriceChange={setNewPrice}
      />
    </div>
  );
};

export default CreateEstimation;