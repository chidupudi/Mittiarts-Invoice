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
  BankOutlined,
  UserOutlined
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

  // Store phone number for new customer
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Customer handling
  const handleAddDynamicCustomer = async () => {
    try {
      const values = await customerForm.validateFields();

      const result = await dispatch(createCustomer({
        name: values.name,
        phone: values.phone || newCustomerPhone || '',
        email: values.email || '',
        businessType: businessType,
        preferredBranch: selectedBranch,
        address: { street: '', city: '', state: '', pincode: '' }
      }));

      if (createCustomer.fulfilled.match(result)) {
        setSelectedCustomer(result.payload);
        customerForm.resetFields();
        setShowCustomerModal(false);
        setNewCustomerPhone('');
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

      {/* Billing Flow */}
      <div style={{ height: 'calc(100% - 80px)' }}>

        {/* Main Content Row */}
        <Row gutter={16}>
          {/* Left Column - Customer, Business Type & Products */}
          <Col xs={24} lg={16}>
            {/* Customer & Business Type - Compact Combined Card */}
            <Card
              size="small"
              style={{
                borderColor: selectedCustomer ? '#52c41a' : '#8b4513',
                borderWidth: '2px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                marginBottom: '16px'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <Row gutter={12}>
                {/* Customer Selection */}
                <Col xs={24} lg={14}>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong style={{ fontSize: '13px', color: '#8b4513' }}>
                      <UserOutlined /> Customer Phone
                    </Text>
                  </div>
                  <CustomerSelection
                    selectedCustomer={selectedCustomer}
                    customers={customers}
                    onSelectCustomer={setSelectedCustomer}
                    onShowCustomerModal={() => setShowCustomerModal(true)}
                    onPhoneNumberChange={setNewCustomerPhone}
                  />
                  {selectedCustomer && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      border: '1px solid #b7eb8f'
                    }}>
                      <strong>{selectedCustomer.name}</strong>
                      {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                    </div>
                  )}
                </Col>

                {/* Business Type & Branch */}
                <Col xs={24} lg={10}>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong style={{ fontSize: '13px', color: '#8b4513' }}>
                      <ShopOutlined /> Type & Branch
                    </Text>
                  </div>
                  <Radio.Group
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    buttonStyle="solid"
                    disabled={!selectedCustomer}
                    style={{ width: '100%', marginBottom: '8px', display: 'flex' }}
                    size="small"
                  >
                    <Radio.Button
                      value="retail"
                      style={{
                        width: '50%',
                        textAlign: 'center',
                        fontSize: '12px',
                        height: '28px',
                        lineHeight: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 8px'
                      }}
                    >
                      <ShopOutlined style={{ fontSize: '12px', marginRight: '4px' }} /> Retail
                    </Radio.Button>
                    <Radio.Button
                      value="wholesale"
                      style={{
                        width: '50%',
                        textAlign: 'center',
                        fontSize: '12px',
                        height: '28px',
                        lineHeight: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 8px'
                      }}
                    >
                      <BankOutlined style={{ fontSize: '12px', marginRight: '4px' }} /> Wholesale
                    </Radio.Button>
                  </Radio.Group>
                  <Select
                    value={selectedBranch}
                    onChange={setSelectedBranch}
                    style={{
                      width: '100%',
                      fontSize: '13px'
                    }}
                    disabled={!selectedCustomer}
                    loading={!locations.length}
                    placeholder="Branch/Stall"
                    size="small"
                  >
                    {locations.length > 0 ? (
                      locations.map(location => (
                        <Option key={location.id} value={location.id}>
                          {location.displayName}
                        </Option>
                      ))
                    ) : (
                      <Option disabled>No locations</Option>
                    )}
                  </Select>
                </Col>
              </Row>
            </Card>

            {/* Product Selection */}
            <Card
                title={
                  <Space>
                    <ShoppingCartOutlined style={{ fontSize: '18px', color: '#8b4513' }} />
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>
                      Select Products
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
                  borderRadius: '8px',
                  boxShadow: selectedCustomer ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  background: selectedCustomer ? '#fff' : '#fafafa',
                  opacity: selectedCustomer ? 1 : 0.6,
                  height: 'calc(100vh - 300px)',
                  minHeight: '550px'
                }}
                bodyStyle={{ padding: '16px', height: 'calc(100% - 48px)', overflow: 'auto' }}
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
          </Col>

          {/* Right Column - Payment & Summary */}
          <Col xs={24} lg={8}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Advance Payment Options */}
              <Card
                title={
                  <Space>
                    <PayCircleOutlined style={{ fontSize: '15px', color: '#8b4513' }} />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      Payment Options
                    </span>
                  </Space>
                }
                size="small"
                style={{
                  borderColor: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#d9d9d9',
                  borderWidth: '2px',
                  borderRadius: '8px',
                  boxShadow: (selectedCustomer && cart.length > 0) ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  background: (selectedCustomer && cart.length > 0) ? '#fff' : '#fafafa',
                  opacity: (selectedCustomer && cart.length > 0) ? 1 : 0.6
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <Space>
                    <Switch
                      checked={isAdvanceBilling}
                      onChange={setIsAdvanceBilling}
                      size="small"
                      disabled={!(selectedCustomer && cart.length > 0)}
                    />
                    <Text style={{ fontSize: '13px', fontWeight: '600' }}>
                      Enable Advance Payment
                    </Text>
                  </Space>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '3px', marginLeft: '24px' }}>
                    Pay partially now, remaining later
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
        phoneNumber={newCustomerPhone}
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