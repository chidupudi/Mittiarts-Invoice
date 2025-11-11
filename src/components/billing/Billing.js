// src/components/billing/Billing.js - Enhanced Mitti Arts with Retail/Wholesale & Branches
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
  Alert,
  Radio,
  Select
} from 'antd';
import {
  ShoppingCartOutlined,
  InfoCircleOutlined,
  PayCircleOutlined,
  FileTextOutlined,
  ShopOutlined,
  BankOutlined
} from '@ant-design/icons';
import { fetchBranches, fetchStalls } from '../../features/storefront/storefrontSlice';
import { 
  createOrder, 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity, 
  updateCartItemPrice,
  clearCart 
} from '../../features/order/orderSlice';
import { fetchCustomers, createCustomer } from '../../features/customer/customerSlice';
import { fetchProducts, createProduct } from '../../features/products/productSlice';
import { useNavigate, useLocation } from 'react-router-dom';

// Import components
import ProductSelection from './ProductSelection';
import CustomerSelection from './CustomerSelection';
import CartDisplay from './CartDispaly';
import OrderSummary from './OrderSummary';
import AdvancePayment from './AdvancePayment';
import LocationSelector from './LocationSelector';
import { 
  ProductModal, 
  CustomerModal, 
  PriceEditModal, 
  PaymentModal, 
  AdvancePaymentModal 
} from './BillingModals';

// Import helper functions
import { 
  getProductPrice, 
  calculateTotals, 
  prepareOrderData 
} from './BillingHelpers';

const { Title, Text } = Typography;
const { Option } = Select;

const Billing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { cart, loading } = useSelector(state => state.orders);
  const { items: customers } = useSelector(state => state.customers);
  const { items: products } = useSelector(state => state.products);
  const { branches, stalls } = useSelector(state => state.storefront);

  // Core billing states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [businessType, setBusinessType] = useState('retail'); // retail, wholesale
  const [selectedBranch, setSelectedBranch] = useState('');

  // Advance billing states
  const [isAdvanceBilling, setIsAdvanceBilling] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [productForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  
  // Price editing states
  const [editingItem, setEditingItem] = useState(null);
  const [newPrice, setNewPrice] = useState(0);

  // Payment confirmation states
  const [finalPaymentMethod, setFinalPaymentMethod] = useState('Cash');
  const [selectedBank, setSelectedBank] = useState(undefined);

  // Estimate conversion states
  const [convertFromEstimate, setConvertFromEstimate] = useState(null);
  const [isConvertingEstimate, setIsConvertingEstimate] = useState(false);

  const bankDetails = [
    'Art of Indian pottery',
    'Swadeshi pottery',
    'Telangana Shilpakala',
    'Clay Ganesha shoba',
  ];

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchCustomers({}));
    dispatch(fetchProducts({}));
    dispatch(fetchBranches({}));
    dispatch(fetchStalls({}));
  }, [dispatch]);

  // Memoize locations to avoid use-before-init and dependency issues
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

  // Handle estimate conversion
  useEffect(() => {
    if (location.state?.convertFromEstimate) {
      const estimate = location.state.convertFromEstimate;
      console.log('Converting estimate to invoice:', estimate);
      
      setConvertFromEstimate(estimate);
      setIsConvertingEstimate(true);
      
      if (location.state.prefilledCustomer) {
        setSelectedCustomer(location.state.prefilledCustomer);
      }
      
      if (location.state.prefilledBusinessType) {
        setBusinessType(location.state.prefilledBusinessType);
      }
      
      if (location.state.prefilledBranch) {
        setSelectedBranch(location.state.prefilledBranch);
      }
      
      if (location.state.prefilledItems) {
        dispatch(clearCart());
        
        setTimeout(() => {
          location.state.prefilledItems.forEach(item => {
            dispatch(addToCart({
              product: item.product,
              quantity: item.quantity,
              originalPrice: item.originalPrice || item.price,
              currentPrice: item.currentPrice || item.price,
              businessType: location.state.prefilledBusinessType,
              branch: location.state.prefilledBranch
            }));
          });
          
          message.success(`Estimate ${estimate.estimateNumber} loaded! Review and generate invoice.`);
        }, 100);
      }
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state, dispatch, setSelectedCustomer, setBusinessType, setSelectedBranch]);

  // Update advance calculation when cart or advance amount changes
  useEffect(() => {
    updateAdvanceCalculation();
  }, [cart, advanceAmount, isAdvanceBilling, businessType]);

  // Get current location (branch or stall)
  const currentLocation = locations.find(l => l.id === selectedBranch) || locations[0];

  // Handle adding product to cart
  const handleAddProduct = (productData) => {
    dispatch(addToCart(productData));
    message.success(`${productData.product.name} added to cart (${businessType})`);
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

      dispatch(createProduct({
        name: values.name,
        retailPrice: values.retailPrice,
        wholesalePrice: values.wholesalePrice,
        price: values.retailPrice, // Default to retail
        category: 'Custom',
        stock: 999,
        description: 'Custom pottery product'
      }));

      productForm.resetFields();
      setShowProductModal(false);
      message.success('Custom pottery product added!');
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
      dispatch(updateCartItemQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
    message.success('Item removed from cart');
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

    dispatch(updateCartItemPrice({ 
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

  // Advance payment calculation
  const updateAdvanceCalculation = () => {
    const totals = calculateTotals(cart, businessType);
    if (isAdvanceBilling && advanceAmount > 0) {
      setRemainingAmount(Math.max(0, totals.finalTotal - advanceAmount));
    } else {
      setRemainingAmount(0);
    }
  };

  // Order submission with advance handling
  const handleSubmit = () => {
    if (cart.length === 0) {
      message.warning('Please add items to cart');
      return;
    }
    
    if (!selectedCustomer) {
      message.warning("Please select a customer");
      return;
    }

    setFinalPaymentMethod('Cash');
    setSelectedBank(undefined);
    
    if (isAdvanceBilling) {
      setShowAdvanceModal(true);
    } else {
      setShowPaymentModal(true);
    }
  };

  const confirmAndGenerateInvoice = async () => {
    if (finalPaymentMethod !== 'Cash' && !selectedBank) {
      message.error('Please select a bank for the transaction.');
      return;
    }

    const orderData = prepareOrderData({
      cart,
      selectedCustomer,
      businessType,
      selectedBranch,
      currentLocation,
      isAdvanceBilling,
      advanceAmount,
      remainingAmount,
      finalPaymentMethod,
      selectedBank,
      convertedFromEstimate: convertFromEstimate ? {
        estimateId: convertFromEstimate.id,
        estimateNumber: convertFromEstimate.estimateNumber,
        convertedAt: new Date()
      } : null
    });

    const result = await dispatch(createOrder(orderData));
    if (result.type === 'orders/create/fulfilled') {
      message.success(`${isAdvanceBilling ? 'Advance invoice' : 'Invoice'} generated successfully!`);
      
      if (convertFromEstimate) {
        try {
          message.success(`Estimate ${convertFromEstimate.estimateNumber} converted to invoice successfully!`);
        } catch (error) {
          console.warn('Failed to update estimate status:', error);
        }
      }
      
      dispatch(clearCart());
      setShowPaymentModal(false);
      setShowAdvanceModal(false);
      setIsAdvanceBilling(false);
      setAdvanceAmount(0);
      setRemainingAmount(0);
      setIsConvertingEstimate(false);
      setConvertFromEstimate(null);
      
      navigate(`/invoices/${result.payload.id}`);
    }
  };

  // Calculate totals for display
  const totals = calculateTotals(cart, businessType);

  // Modal handlers
  const handleCloseProductModal = () => setShowProductModal(false);
  const handleCloseCustomerModal = () => setShowCustomerModal(false);
  const handleClosePriceModal = () => setShowPriceModal(false);
  const handleClosePaymentModal = () => setShowPaymentModal(false);
  const handleCloseAdvanceModal = () => setShowAdvanceModal(false);

  return (
    <div style={{
      padding: '20px',
      height: 'calc(100vh - 120px)',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #faf5f0 0%, #e8ddd4 100%)',
      minHeight: '800px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}>
                🏺
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: 'white' }}>
                  Mitti Arts - {isConvertingEstimate ? 'Convert Estimate to Invoice' : 'Point of Sale'}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                  {isConvertingEstimate ? 
                    `🔄 Converting Estimate ${convertFromEstimate?.estimateNumber} • ${currentLocation?.displayName || 'Loading...'}` :
                    `🏺 Handcrafted Pottery & Terracotta Art • ${currentLocation?.displayName || 'Loading...'}`
                  }
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

      {isConvertingEstimate && convertFromEstimate && (
        <Alert
          message={
            <Space>
              <FileTextOutlined />
              <span><strong>Converting Estimate to Invoice</strong></span>
            </Space>
          }
          description={
            <div>
              <div>Estimate Number: <strong>{convertFromEstimate.estimateNumber}</strong></div>
              <div>Created: <strong>{new Date(convertFromEstimate.createdAt?.toDate?.() || convertFromEstimate.createdAt).toLocaleDateString()}</strong></div>
              <div>Customer: <strong>{convertFromEstimate.customer?.name || 'Walk-in Customer'}</strong></div>
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                Review the items and pricing below, make any necessary adjustments, then generate the official invoice.
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Space>
              <Button 
                size="small" 
                onClick={() => {
                  setIsConvertingEstimate(false);
                  setConvertFromEstimate(null);
                  dispatch(clearCart());
                  message.info('Estimate conversion cancelled');
                }}
              >
                Cancel Conversion
              </Button>
              <Button 
                size="small" 
                type="primary"
                onClick={() => navigate(`/estimations/${convertFromEstimate.id}`)}
              >
                View Original Estimate
              </Button>
            </Space>
          }
        />
      )}

      {/* Systematic Billing Flow */}
      <div style={{ height: 'calc(100% - 80px)' }}>
        {/* Step Progress Indicator */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(10px)'
        }}>
          <Row gutter={8} align="middle">
            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '14px', fontWeight: '500' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: selectedCustomer ? '#52c41a' : '#8b4513',
                  fontWeight: 'bold',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: selectedCustomer ? 'rgba(82, 196, 26, 0.1)' : 'rgba(139, 69, 19, 0.1)',
                  border: `1px solid ${selectedCustomer ? '#52c41a' : '#8b4513'}20`
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectedCustomer ? '#52c41a' : '#8b4513',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {selectedCustomer ? '✓' : '1'}
                  </span>
                  Customer Details
                </div>
                <span style={{ color: '#d0d7de', fontSize: '16px' }}>→</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: selectedCustomer ? '#8b4513' : '#8c8c8c',
                  fontWeight: selectedCustomer ? 'bold' : 'normal',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: selectedCustomer ? 'rgba(139, 69, 19, 0.1)' : 'rgba(140, 140, 140, 0.1)',
                  border: `1px solid ${selectedCustomer ? '#8b4513' : '#8c8c8c'}20`,
                  opacity: selectedCustomer ? 1 : 0.6
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectedCustomer ? '#8b4513' : '#8c8c8c',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    2
                  </span>
                  Business Type
                </div>
                <span style={{ color: '#d0d7de', fontSize: '16px' }}>→</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: (selectedCustomer && cart.length > 0) ? '#52c41a' : (selectedCustomer ? '#8b4513' : '#8c8c8c'),
                  fontWeight: (selectedCustomer && cart.length > 0) ? 'bold' : (selectedCustomer ? 'bold' : 'normal'),
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: (selectedCustomer && cart.length > 0) ? 'rgba(82, 196, 26, 0.1)' : (selectedCustomer ? 'rgba(139, 69, 19, 0.1)' : 'rgba(140, 140, 140, 0.1)'),
                  border: `1px solid ${(selectedCustomer && cart.length > 0) ? '#52c41a' : (selectedCustomer ? '#8b4513' : '#8c8c8c')}20`,
                  opacity: selectedCustomer ? 1 : 0.6
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: (selectedCustomer && cart.length > 0) ? '#52c41a' : (selectedCustomer ? '#8b4513' : '#8c8c8c'),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {(selectedCustomer && cart.length > 0) ? '✓' : '3'}
                  </span>
                  Product Selection
                </div>
                <span style={{ color: '#d0d7de', fontSize: '16px' }}>→</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#8c8c8c',
                  fontWeight: (selectedCustomer && cart.length > 0) ? 'bold' : 'normal',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: (selectedCustomer && cart.length > 0) ? 'rgba(139, 69, 19, 0.1)' : 'rgba(140, 140, 140, 0.1)',
                  border: `1px solid ${(selectedCustomer && cart.length > 0) ? '#8b4513' : '#8c8c8c'}20`,
                  opacity: (selectedCustomer && cart.length > 0) ? 1 : 0.6
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#8c8c8c',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    4
                  </span>
                  Payment Options
                </div>
                <span style={{ color: '#d0d7de', fontSize: '16px' }}>→</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#8c8c8c',
                  fontWeight: (selectedCustomer && cart.length > 0) ? 'bold' : 'normal',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: (selectedCustomer && cart.length > 0) ? 'rgba(139, 69, 19, 0.1)' : 'rgba(140, 140, 140, 0.1)',
                  border: `1px solid ${(selectedCustomer && cart.length > 0) ? '#8b4513' : '#8c8c8c'}20`,
                  opacity: (selectedCustomer && cart.length > 0) ? 1 : 0.6
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#8c8c8c',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    5
                  </span>
                  Final Review
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Row gutter={24}>
          {/* Left Column - Step by Step Flow */}
          <Col xs={24} lg={14}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* STEP 1: Customer Details */}
              <Card
                title={
                  <Space>
                    <span style={{
                      background: selectedCustomer
                        ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                        : 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                      {selectedCustomer ? '✓' : '1'}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>STEP 1: Customer Details</span>
                  </Space>
                }
                size="small"
                style={{
                  borderColor: selectedCustomer ? '#52c41a' : '#8b4513',
                  borderWidth: '2px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: selectedCustomer ? 'default' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <CustomerSelection
                  selectedCustomer={selectedCustomer}
                  customers={customers}
                  onSelectCustomer={setSelectedCustomer}
                  onShowCustomerModal={() => setShowCustomerModal(true)}
                />
                {selectedCustomer && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    border: '1px solid #b7eb8f'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#52c41a',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>✓</span>
                      <span>
                        Customer selected: <strong>{selectedCustomer.name}</strong>
                        {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* STEP 2: Business Type Selection */}
              <Card
                title={
                  <Space>
                    <span style={{
                      background: selectedCustomer
                        ? 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)'
                        : 'linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%)',
                      color: selectedCustomer ? 'white' : '#8c8c8c',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: selectedCustomer ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}>
                      2
                    </span>
                    <span style={{
                      color: selectedCustomer ? 'inherit' : '#8c8c8c',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      STEP 2: Business Type & Location
                    </span>
                  </Space>
                }
                size="small"
                style={{
                  borderColor: selectedCustomer ? '#8b4513' : '#d9d9d9',
                  borderWidth: '2px',
                  borderRadius: '12px',
                  boxShadow: selectedCustomer ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
                  background: selectedCustomer ? 'rgba(255,255,255,0.95)' : 'rgba(249,249,249,0.95)',
                  backdropFilter: 'blur(10px)',
                  opacity: selectedCustomer ? 1 : 0.7,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedCustomer) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCustomer) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                  }
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Row gutter={16} align="middle">
                  <Col span={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                        🏪 Business Type:
                      </Text>
                      <Radio.Group
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        buttonStyle="solid"
                        size="large"
                        disabled={!selectedCustomer}
                        style={{ width: '100%' }}
                      >
                        <Radio.Button value="retail" style={{
                          width: '50%',
                          textAlign: 'center',
                          height: '40px',
                          borderRadius: '6px 0 0 6px',
                          fontWeight: '500',
                          boxShadow: businessType === 'retail' ? '0 2px 8px rgba(24, 144, 255, 0.3)' : 'none'
                        }}>
                          <ShopOutlined /> Retail
                        </Radio.Button>
                        <Radio.Button value="wholesale" style={{
                          width: '50%',
                          textAlign: 'center',
                          height: '40px',
                          borderRadius: '0 6px 6px 0',
                          fontWeight: '500',
                          boxShadow: businessType === 'wholesale' ? '0 2px 8px rgba(250, 140, 22, 0.3)' : 'none'
                        }}>
                          <BankOutlined /> Wholesale
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                        📍 Location:
                      </Text>
                      <Select
                        value={selectedBranch}
                        onChange={setSelectedBranch}
                        style={{
                          width: '100%',
                          height: '40px'
                        }}
                        size="large"
                        disabled={!selectedCustomer}
                        loading={!locations.length}
                        placeholder="📍 Select Location"
                      >
                        {locations.length > 0 ? (
                          locations.map(location => (
                            <Option key={location.id} value={location.id}>
                              {location.displayName}
                            </Option>
                          ))
                        ) : (
                          <Option disabled>No locations available</Option>
                        )}
                      </Select>
                    </div>
                  </Col>
                </Row>
                {selectedCustomer && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: businessType === 'wholesale'
                      ? 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)'
                      : 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    border: businessType === 'wholesale' ? '1px solid #ffd591' : '1px solid #adc6ff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: businessType === 'wholesale' ? '#fa8c16' : '#1890ff',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>📊</span>
                      <span>
                        Selected: <strong>{businessType === 'retail' ? '🛍️ Retail Pricing' : '🏪 Wholesale Pricing'}</strong>
                        {businessType === 'wholesale' && (
                          <div style={{ fontSize: '12px', color: '#fa8c16', marginTop: '4px' }}>
                            💡 5% additional discount on orders above ₹10,000
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* STEP 3: Product Selection */}
              <Card
                title={
                  <Space>
                    <span style={{
                      background: (selectedCustomer && cart.length > 0)
                        ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                        : selectedCustomer
                        ? 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)'
                        : 'linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%)',
                      color: selectedCustomer ? 'white' : '#8c8c8c',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: selectedCustomer ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}>
                      {(selectedCustomer && cart.length > 0) ? '✓' : '3'}
                    </span>
                    <span style={{
                      color: selectedCustomer ? 'inherit' : '#8c8c8c',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      STEP 3: Product Selection
                    </span>
                    {cart.length > 0 && (
                      <Badge
                        count={totals.totalQuantity}
                        style={{
                          backgroundColor: '#52c41a',
                          boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
                        }}
                      />
                    )}
                  </Space>
                }
                size="small"
                style={{
                  borderColor: (selectedCustomer && cart.length > 0) ? '#52c41a' : (selectedCustomer ? '#8b4513' : '#d9d9d9'),
                  borderWidth: '2px',
                  borderRadius: '12px',
                  boxShadow: selectedCustomer ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
                  background: selectedCustomer ? 'rgba(255,255,255,0.95)' : 'rgba(249,249,249,0.95)',
                  backdropFilter: 'blur(10px)',
                  opacity: selectedCustomer ? 1 : 0.7,
                  flex: 1
                }}
                bodyStyle={{ padding: '20px', height: 'calc(100% - 56px)', overflow: 'auto' }}
                extra={
                  selectedCustomer && cart.length > 0 && (
                    <Popconfirm
                      title="Clear all items from cart?"
                      onConfirm={() => dispatch(clearCart())}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        size="small"
                        danger
                        style={{
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(255, 77, 79, 0.2)'
                        }}
                      >
                        Clear Cart
                      </Button>
                    </Popconfirm>
                  )
                }
              >
                <ProductSelection
                  products={products}
                  businessType={businessType}
                  selectedBranch={selectedBranch}
                  onAddProduct={handleAddProduct}
                  onShowProductModal={() => setShowProductModal(true)}
                />

                {cart.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                      <Title level={5} style={{ margin: '0 0 8px 0' }}>
                        🛒 Shopping Cart ({totals.itemCount} items, {totals.totalQuantity} qty)
                      </Title>

                      <CartDisplay
                        cart={cart}
                        businessType={businessType}
                        onQuantityChange={handleQuantityChange}
                        onRemoveItem={handleRemoveItem}
                        onOpenPriceEdit={openPriceEdit}
                      />
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Col>

          {/* Right Column - Advanced Options & Summary */}
          <Col xs={24} lg={10}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* STEP 4: Advance Payment Options */}
              <Card
                title={
                  <Space>
                    <span style={{
                      background: (selectedCustomer && cart.length > 0)
                        ? 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)'
                        : 'linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%)',
                      color: (selectedCustomer && cart.length > 0) ? 'white' : '#8c8c8c',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: (selectedCustomer && cart.length > 0) ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}>
                      4
                    </span>
                    <span style={{
                      color: (selectedCustomer && cart.length > 0) ? 'inherit' : '#8c8c8c',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      STEP 4: Payment Options
                    </span>
                  </Space>
                }
                size="small"
                style={{
                  borderColor: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#d9d9d9',
                  borderWidth: '2px',
                  borderRadius: '12px',
                  boxShadow: (selectedCustomer && cart.length > 0) ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
                  background: (selectedCustomer && cart.length > 0) ? 'rgba(255,255,255,0.95)' : 'rgba(249,249,249,0.95)',
                  backdropFilter: 'blur(10px)',
                  opacity: (selectedCustomer && cart.length > 0) ? 1 : 0.7
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Space>
                    <Switch
                      checked={isAdvanceBilling}
                      onChange={setIsAdvanceBilling}
                      size="small"
                      disabled={!(selectedCustomer && cart.length > 0)}
                    />
                    <Text style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      <PayCircleOutlined /> Enable Advance Payment
                    </Text>
                  </Space>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Allow customer to pay partially now and remaining later
                  </div>
                </div>

                {isAdvanceBilling && (selectedCustomer && cart.length > 0) && (
                  <AdvancePayment
                    advanceAmount={advanceAmount}
                    remainingAmount={remainingAmount}
                    totalAmount={totals.finalTotal}
                    onAdvanceAmountChange={setAdvanceAmount}
                  />
                )}
              </Card>

              {/* STEP 5: Final Summary & Generate Invoice */}
              <OrderSummary
                cart={cart}
                businessType={businessType}
                selectedCustomer={selectedCustomer}
                currentLocation={currentLocation}
                isAdvanceBilling={isAdvanceBilling}
                advanceAmount={advanceAmount}
                remainingAmount={remainingAmount}
                onSubmit={handleSubmit}
                disabled={loading || cart.length === 0 || !selectedCustomer}
              />
            </div>
          </Col>
        </Row>
      </div>
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
      
      <PaymentModal 
        visible={showPaymentModal}
        onCancel={handleClosePaymentModal}
        onConfirm={confirmAndGenerateInvoice}
        totals={totals}
        selectedCustomer={selectedCustomer}
        paymentMethod={finalPaymentMethod}
        onPaymentMethodChange={setFinalPaymentMethod}
        businessType={businessType}
        currentLocation={currentLocation}
        banks={bankDetails}
        selectedBank={selectedBank}
        onBankChange={setSelectedBank}
      />
      
      <AdvancePaymentModal 
        visible={showAdvanceModal}
        onCancel={handleCloseAdvanceModal}
        onConfirm={confirmAndGenerateInvoice}
        totals={totals}
        selectedCustomer={selectedCustomer}
        paymentMethod={finalPaymentMethod}
        onPaymentMethodChange={setFinalPaymentMethod}
        advanceAmount={advanceAmount}
        onAdvanceAmountChange={setAdvanceAmount}
        remainingAmount={remainingAmount}
        businessType={businessType}
        banks={bankDetails}
        selectedBank={selectedBank}
        onBankChange={setSelectedBank}
      />
    </div>
  );
};

export default Billing;