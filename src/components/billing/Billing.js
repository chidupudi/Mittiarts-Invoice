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
  Button
} from 'antd';
import {
  ShoppingCartOutlined,
  InfoCircleOutlined,
  PayCircleOutlined
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
import { useNavigate } from 'react-router-dom';

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

const Billing = () => {
  const navigate = useNavigate();
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
      selectedBank
    });

    const result = await dispatch(createOrder(orderData));
    if (result.type === 'orders/create/fulfilled') {
      message.success(`${isAdvanceBilling ? 'Advance invoice' : 'Invoice'} generated successfully!`);
      dispatch(clearCart());
      setShowPaymentModal(false);
      setShowAdvanceModal(false);
      setIsAdvanceBilling(false);
      setAdvanceAmount(0);
      setRemainingAmount(0);
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
    <div style={{ padding: 16, height: 'calc(100vh - 120px)', overflow: 'auto' }}>
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
                🏺
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: 'white' }}>Mitti Arts - Point of Sale</Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                  🏺 Handcrafted Pottery & Terracotta Art • {currentLocation?.displayName || 'Loading...'}
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

      <Row gutter={12} style={{ height: 'calc(100% - 80px)' }}>
        <Col xs={24} lg={14} style={{ height: '100%' }}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Product Selection - {businessType === 'retail' ? 'Retail Prices' : 'Wholesale Prices'}</span>
                <Badge count={totals.totalQuantity} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            size="small"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'hidden', padding: '12px' }}
            extra={
              <Space>
                <Tooltip title="Enable advance billing for partial payments">
                  <Space>
                    <Switch 
                      checked={isAdvanceBilling}
                      onChange={setIsAdvanceBilling}
                      size="small"
                    />
                    <Text style={{ fontSize: '12px' }}>
                      <PayCircleOutlined /> Advance
                    </Text>
                  </Space>
                </Tooltip>
                
                {cart.length > 0 && (
                  <Popconfirm
                    title="Clear all items from cart?"
                    onConfirm={() => dispatch(clearCart())}
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
                Shopping Cart ({totals.itemCount} items, {totals.totalQuantity} qty)
              </Title>
              
              <CartDisplay 
                cart={cart}
                businessType={businessType}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                onOpenPriceEdit={openPriceEdit}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10} style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
            <CustomerSelection 
              selectedCustomer={selectedCustomer}
              customers={customers}
              onSelectCustomer={setSelectedCustomer}
              onShowCustomerModal={() => setShowCustomerModal(true)}
            />

            {isAdvanceBilling && (
              <AdvancePayment 
                advanceAmount={advanceAmount}
                remainingAmount={remainingAmount}
                totalAmount={totals.finalTotal}
                onAdvanceAmountChange={setAdvanceAmount}
              />
            )}

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