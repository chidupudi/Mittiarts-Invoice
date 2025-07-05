// src/components/billing/Billing.js - Enhanced Mitti Arts with Retail/Wholesale & Branches
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Select,
  Typography,
  Alert,
  message,
  Input,
  Form,
  Modal,
  Space,
  Tabs,
  Badge,
  Divider,
  Table,
  Tag,
  Popconfirm,
  Statistic,
  Radio,
  Switch,
  Tooltip,
  Descriptions
} from 'antd';
import { 
  PlusOutlined, 
  UserAddOutlined, 
  ShoppingCartOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  CalculatorOutlined,
  PrinterOutlined,
  DollarOutlined,
  GiftOutlined,
  ShopOutlined,
  BankOutlined,
  HomeOutlined,
  PayCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
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

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mitti Arts branch configuration
const MITTI_ARTS_BRANCHES = [
  {
    id: 'main_showroom',
    name: 'Main Showroom',
    address: 'Banjara Hills, Hyderabad',
    phone: '+91 98765 43210',
    icon: '🏪'
  },
  {
    id: 'pottery_workshop',
    name: 'Pottery Workshop',
    address: 'Madhapur, Hyderabad', 
    phone: '+91 98765 43211',
    icon: '🏺'
  },
  {
    id: 'export_unit',
    name: 'Export Unit',
    address: 'Gachibowli, Hyderabad',
    phone: '+91 98765 43212', 
    icon: '📦'
  }
];

const Billing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector(state => state.orders);
  const { items: customers } = useSelector(state => state.customers);
  const { items: products } = useSelector(state => state.products);

  // Core billing states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  // Business type and branch states
  const [businessType, setBusinessType] = useState('retail'); // retail, wholesale
  const [selectedBranch, setSelectedBranch] = useState('main_showroom');
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

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'];

  useEffect(() => {
    dispatch(fetchCustomers({}));
    dispatch(fetchProducts({}));
  }, [dispatch]);

  // Get current branch info
  const currentBranch = MITTI_ARTS_BRANCHES.find(b => b.id === selectedBranch);

  // Product handling with business type pricing
  const getProductPrice = (product) => {
    if (businessType === 'wholesale' && product.wholesalePrice) {
      return product.wholesalePrice;
    }
    return product.price;
  };

  const handleAddProduct = () => {
    if (selectedProduct && quantity > 0) {
      const price = getProductPrice(selectedProduct);
      dispatch(addToCart({ 
        product: selectedProduct, 
        quantity,
        originalPrice: price,
        currentPrice: price,
        businessType,
        branch: selectedBranch
      }));
      setSelectedProduct(null);
      setQuantity(1);
      message.success(`${selectedProduct.name} added to cart (${businessType})`);
    } else {
      message.warning('Please select a product and enter quantity');
    }
  };

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

      const price = getProductPrice(tempProduct);
      dispatch(addToCart({ 
        product: tempProduct, 
        quantity: values.quantity,
        originalPrice: price,
        currentPrice: price,
        businessType,
        branch: selectedBranch
      }));

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
        businessType: businessType, // Track if they're retail or wholesale customer
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
      updateAdvanceCalculation();
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
    updateAdvanceCalculation();
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
      message.success('Price updated!');
    }
    
    setShowPriceModal(false);
    setEditingItem(null);
    updateAdvanceCalculation();
  };

  // Advance payment calculation
  const updateAdvanceCalculation = () => {
    const totals = calculateTotals();
    if (isAdvanceBilling && advanceAmount > 0) {
      setRemainingAmount(Math.max(0, totals.finalTotal - advanceAmount));
    } else {
      setRemainingAmount(0);
    }
  };

  useEffect(() => {
    updateAdvanceCalculation();
  }, [cart, advanceAmount, isAdvanceBilling]);

  // Calculations
  const calculateTotals = () => {
    const subtotal = cart.reduce((total, item) => total + (item.originalPrice * item.quantity), 0);
    const currentTotal = cart.reduce((total, item) => total + (item.currentPrice * item.quantity), 0);
    const totalDiscount = subtotal - currentTotal;
    const discountPercentage = subtotal > 0 ? ((totalDiscount / subtotal) * 100) : 0;

    // Wholesale discount (additional 5% for wholesale orders above ₹10,000)
    let wholesaleDiscount = 0;
    if (businessType === 'wholesale' && currentTotal > 10000) {
      wholesaleDiscount = currentTotal * 0.05;
    }

    const finalTotal = currentTotal - wholesaleDiscount;

    return {
      subtotal,
      currentTotal,
      totalDiscount,
      discountPercentage,
      wholesaleDiscount,
      finalTotal,
      itemCount: cart.length,
      totalQuantity: cart.reduce((total, item) => total + item.quantity, 0)
    };
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
    
    if (isAdvanceBilling) {
      setShowAdvanceModal(true);
    } else {
      setShowPaymentModal(true);
    }
  };

  const confirmAndGenerateInvoice = async () => {
    const totals = calculateTotals();

    // Remove undefined fields from branchInfo
    const cleanBranchInfo = {};
    if (currentBranch) {
      Object.keys(currentBranch).forEach(key => {
        if (currentBranch[key] !== undefined) {
          cleanBranchInfo[key] = currentBranch[key];
        }
      });
    }

    // Remove undefined fields from items
    const cleanItems = cart.map(item => {
      const cleanProduct = {};
      if (item.product) {
        Object.keys(item.product).forEach(key => {
          if (item.product[key] !== undefined) {
            cleanProduct[key] = item.product[key];
          }
        });
      }
      return {
        product: cleanProduct,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        currentPrice: item.currentPrice,
        price: item.currentPrice,
        discount: item.originalPrice > 0 ? ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100 : 0,
        businessType: item.businessType || businessType
      };
    });

    // Remove undefined fields from orderData (deep clean)
    function removeUndefinedDeep(obj) {
      if (Array.isArray(obj)) {
        return obj.map(removeUndefinedDeep);
      } else if (obj && typeof obj === 'object') {
        const cleaned = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined) {
            cleaned[key] = removeUndefinedDeep(obj[key]);
          }
        });
        return cleaned;
      }
      return obj;
    }

    const rawOrderData = {
      customerId: selectedCustomer.id,
      businessType,
      branch: selectedBranch,
      branchInfo: cleanBranchInfo,
      isAdvanceBilling,
      advanceAmount: isAdvanceBilling ? advanceAmount : 0,
      remainingAmount: isAdvanceBilling ? remainingAmount : 0,
      items: cleanItems,
      paymentMethod: finalPaymentMethod,
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      discountPercentage: totals.discountPercentage,
      wholesaleDiscount: totals.wholesaleDiscount,
      afterDiscount: totals.currentTotal,
      total: totals.finalTotal,
    };
    const orderData = removeUndefinedDeep(rawOrderData);

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

  const totals = calculateTotals();

  // Cart table columns
  const cartColumns = [
    {
      title: 'Item',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: 120,
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>{name}</Text>
          {record.product.isDynamic && (
            <Tag color="blue" size="small" style={{ marginLeft: 4, fontSize: '9px' }}>Custom</Tag>
          )}
          <div style={{ fontSize: '10px', color: '#666' }}>
            {record.product.category}
          </div>
          <div style={{ fontSize: '9px', color: '#8b4513' }}>
            {businessType === 'wholesale' ? '🏪 Wholesale' : '🛍️ Retail'}
          </div>
        </div>
      ),
    },
    {
      title: 'Qty',
      key: 'quantity',
      width: 50,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => handleQuantityChange(record.product.id, val)}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 85,
      render: (_, record) => {
        const hasDiscount = record.originalPrice !== record.currentPrice;
        
        return (
          <div>
            {hasDiscount && (
              <div style={{ 
                fontSize: '10px', 
                textDecoration: 'line-through', 
                color: '#999' 
              }}>
                ₹{record.originalPrice}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text strong style={{ color: hasDiscount ? '#52c41a' : 'inherit' }}>
                ₹{record.currentPrice}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openPriceEdit(record)}
                style={{ padding: 0, minWidth: 'auto' }}
                title="Negotiate Price"
              />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Total',
      key: 'total',
      width: 70,
      render: (_, record) => {
        const itemTotal = record.currentPrice * record.quantity;
        const originalTotal = record.originalPrice * record.quantity;
        const hasDiscount = originalTotal !== itemTotal;
        
        return (
          <div>
            {hasDiscount && (
              <div style={{ 
                fontSize: '10px', 
                textDecoration: 'line-through', 
                color: '#999' 
              }}>
                ₹{originalTotal.toFixed(2)}
              </div>
            )}
            <Text strong style={{ color: hasDiscount ? '#52c41a' : 'inherit' }}>
              ₹{itemTotal.toFixed(2)}
            </Text>
            {hasDiscount && (
              <div style={{ fontSize: '9px', color: '#52c41a' }}>
                <GiftOutlined /> ₹{Math.abs(originalTotal - itemTotal).toFixed(2)} off
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 30,
      render: (_, record) => (
        <Popconfirm
          title="Remove item?"
          onConfirm={() => handleRemoveItem(record.product.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ padding: 0 }}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      {/* Header with Mitti Arts branding and business controls */}
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
                  🏺 Handcrafted Pottery & Terracotta Art • {currentBranch.name}
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" size="small" style={{ alignItems: 'flex-end' }}>
              {/* Branch Selection */}
              <Select
                value={selectedBranch}
                onChange={setSelectedBranch}
                style={{ width: 200 }}
                size="small"
              >
                {MITTI_ARTS_BRANCHES.map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    {branch.icon} {branch.name}
                  </Option>
                ))}
              </Select>
              
              {/* Business Type Selection */}
              <Radio.Group 
                value={businessType} 
                onChange={(e) => setBusinessType(e.target.value)}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="retail">
                  <ShopOutlined /> Retail
                </Radio.Button>
                <Radio.Button value="wholesale">
                  <BankOutlined /> Wholesale
                </Radio.Button>
              </Radio.Group>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={12} style={{ height: 'calc(100% - 80px)' }}>
        {/* Left Panel - Product Selection & Cart */}
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
                {/* Advance Billing Toggle */}
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
            <Tabs defaultActiveKey="1" size="small">
              <TabPane tab="Existing Products" key="1">
                <Row gutter={8} style={{ marginBottom: 12 }}>
                  <Col span={12}>
                    <Select
                      showSearch
                      style={{ width: '100%' }}
                      placeholder="Select Product"
                      value={selectedProduct?.id}
                      onChange={(value) => {
                        const product = products.find(p => p.id === value);
                        setSelectedProduct(product || null);
                      }}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      size="small"
                    >
                      {products.map(product => {
                        const price = getProductPrice(product);
                        return (
                          <Option key={product.id} value={product.id}>
                            {`${product.name} - ₹${price}`}
                            {businessType === 'wholesale' && product.wholesalePrice && (
                              <Tag color="orange" size="small" style={{ marginLeft: 4 }}>WS</Tag>
                            )}
                          </Option>
                        );
                      })}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      min={1}
                      value={quantity}
                      onChange={(val) => setQuantity(val)}
                      style={{ width: '100%' }}
                      placeholder="Qty"
                      size="small"
                    />
                  </Col>
                  <Col span={6}>
                    <Button 
                      type="primary" 
                      onClick={handleAddProduct} 
                      block 
                      size="small"
                      icon={<PlusOutlined />}
                    >
                      Add
                    </Button>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Custom Product" key="2">
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={() => setShowProductModal(true)}
                  block
                  size="small"
                >
                  Add Custom Product
                </Button>
              </TabPane>
            </Tabs>

            <Divider style={{ margin: '12px 0' }} />

            {/* Cart Table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Shopping Cart ({totals.itemCount} items, {totals.totalQuantity} qty)
              </Title>
              
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>No items in cart</div>
                  <div style={{ fontSize: '12px' }}>Add pottery products to get started</div>
                </div>
              ) : (
                <Table
                  columns={cartColumns}
                  dataSource={cart}
                  rowKey={(item) => item.product.id}
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                  style={{ fontSize: '12px' }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Right Panel - Customer & Checkout */}
        <Col xs={24} lg={10} style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
            
            {/* Customer Selection */}
            <Card 
              title="Customer Selection" 
              size="small"
              bodyStyle={{ padding: '12px' }}
            >
              <Row gutter={8}>
                <Col span={18}>
                  <Select
                    showSearch
                    style={{ width: '100%' }}
                    placeholder="Select Customer"
                    value={selectedCustomer?.id}
                    onChange={(value) => {
                      const customer = customers.find(c => c.id === value);
                      setSelectedCustomer(customer || null);
                    }}
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                    size="small"
                  >
                    {customers.map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {`${customer.name}${customer.phone ? ` (${customer.phone})` : ''}`}
                        {customer.businessType && (
                          <Tag color={customer.businessType === 'wholesale' ? 'orange' : 'blue'} size="small" style={{ marginLeft: 4 }}>
                            {customer.businessType}
                          </Tag>
                        )}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Button 
                    icon={<UserAddOutlined />} 
                    onClick={() => setShowCustomerModal(true)}
                    block
                    size="small"
                  >
                    Add
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Advance Payment Section */}
            {isAdvanceBilling && (
              <Card 
                title={
                  <Space>
                    <PayCircleOutlined />
                    <span>Advance Payment</span>
                  </Space>
                }
                size="small"
                style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591' }}
                bodyStyle={{ padding: '12px' }}
              >
                <Row gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Text style={{ fontSize: '12px' }}>Advance Amount:</Text>
                    <InputNumber
                      value={advanceAmount}
                      onChange={setAdvanceAmount}
                      min={0}
                      max={totals.finalTotal}
                      style={{ width: '100%' }}
                      prefix="₹"
                      size="small"
                    />
                  </Col>
                  <Col span={12}>
                    <Text style={{ fontSize: '12px' }}>Remaining:</Text>
                    <div style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      color: remainingAmount > 0 ? '#fa541c' : '#52c41a'
                    }}>
                      ₹{remainingAmount.toFixed(2)}
                    </div>
                  </Col>
                </Row>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  Customer will pay ₹{advanceAmount} now and ₹{remainingAmount.toFixed(2)} later
                </div>
              </Card>
            )}

            {/* Order Summary */}
            <Card 
              title={
                <Space>
                  <CalculatorOutlined />
                  <span>Order Summary - {businessType.charAt(0).toUpperCase() + businessType.slice(1)}</span>
                </Space>
              }
              size="small"
              style={{ flex: 1 }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ marginBottom: 16 }}>
                <Row gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Statistic 
                      title="Items" 
                      value={totals.itemCount} 
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Quantity" 
                      value={totals.totalQuantity} 
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                </Row>

                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Text>List Price:</Text>
                  <Text>₹{totals.subtotal.toFixed(2)}</Text>
                </Row>
                
                {totals.totalDiscount !== 0 && (
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text>
                      {totals.totalDiscount > 0 ? (
                        <span style={{ color: '#fa8c16' }}>💝 Negotiated Discount:</span>
                      ) : (
                        <span style={{ color: '#52c41a' }}>📈 Premium Added:</span>
                      )}
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
                    <Text style={{ color: '#722ed1' }}>🏪 Wholesale Discount (5%):</Text>
                    <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>
                      -₹{totals.wholesaleDiscount.toFixed(2)}
                    </Text>
                  </Row>
                )}
                
                <Divider style={{ margin: '8px 0' }} />
                
                <Row justify="space-between" style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Total Amount:</Text>
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
                      🏪 Wholesale order above ₹10,000 - Additional 5% discount applied!
                    </Text>
                  </div>
                )}

                {(totals.totalDiscount > 0 || totals.wholesaleDiscount > 0) && (
                  <div style={{ 
                    backgroundColor: '#fff7e6', 
                    border: '1px solid #ffd591', 
                    borderRadius: 4, 
                    padding: 8, 
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                      🎁 Total savings: ₹{(totals.totalDiscount + totals.wholesaleDiscount).toFixed(2)}
                    </Text>
                  </div>
                )}
              </div>

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
                  <div><strong>Branch:</strong> {currentBranch.icon} {currentBranch.name}</div>
                  <div><strong>Type:</strong> {businessType === 'retail' ? '🛍️ Retail' : '🏪 Wholesale'}</div>
                </div>
              )}
              
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                block
                disabled={cart.length === 0 || !selectedCustomer}
                icon={<PrinterOutlined />}
                style={{ height: 48, fontSize: 16 }}
              >
                {isAdvanceBilling ? 'Generate Advance Invoice' : 'Generate Invoice'}
              </Button>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Payment Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <span>Confirm Payment</span>
          </div>
        }
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={confirmAndGenerateInvoice}
            icon={<CheckOutlined />}
            style={{
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              border: 'none'
            }}
          >
            Confirm & Generate Invoice
          </Button>
        ]}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Statistic
                  title="Total Amount"
                  value={totals.finalTotal}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Payment Method:
                  </Text>
                  <Select
                    value={finalPaymentMethod}
                    onChange={setFinalPaymentMethod}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    {paymentMethods.map(method => (
                      <Option key={method} value={method}>{method}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
          </Card>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
              Order Summary:
            </Text>
            <Card size="small">
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Text>Items:</Text>
                <Text>{totals.itemCount} ({totals.totalQuantity} qty)</Text>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Text>Subtotal:</Text>
                <Text>₹{totals.subtotal.toFixed(2)}</Text>
              </Row>
              {totals.totalDiscount > 0 && (
                <Row justify="space-between" style={{ marginBottom: 4 }}>
                  <Text>Discount:</Text>
                  <Text style={{ color: '#fa8c16' }}>-₹{totals.totalDiscount.toFixed(2)}</Text>
                </Row>
              )}
              {totals.wholesaleDiscount > 0 && (
                <Row justify="space-between" style={{ marginBottom: 4 }}>
                  <Text>Wholesale Discount:</Text>
                  <Text style={{ color: '#722ed1' }}>-₹{totals.wholesaleDiscount.toFixed(2)}</Text>
                </Row>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text strong>Final Total:</Text>
                <Text strong style={{ color: '#52c41a' }}>₹{totals.finalTotal.toFixed(2)}</Text>
              </Row>
            </Card>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
              Customer Details:
            </Text>
            <Card size="small">
              <Row>
                <Col span={8}>
                  <Text type="secondary">Name:</Text>
                </Col>
                <Col span={16}>
                  <Text strong>{selectedCustomer?.name || 'Walk-in Customer'}</Text>
                </Col>
              </Row>
              {selectedCustomer?.phone && (
                <Row style={{ marginTop: 4 }}>
                  <Col span={8}>
                    <Text type="secondary">Phone:</Text>
                  </Col>
                  <Col span={16}>
                    <Text>{selectedCustomer.phone}</Text>
                  </Col>
                </Row>
              )}
              <Row style={{ marginTop: 4 }}>
                <Col span={8}>
                  <Text type="secondary">Type:</Text>
                </Col>
                <Col span={16}>
                  <Tag color={businessType === 'wholesale' ? 'orange' : 'blue'}>
                    {businessType === 'wholesale' ? '🏪 Wholesale' : '🛍️ Retail'}
                  </Tag>
                </Col>
              </Row>
              <Row style={{ marginTop: 4 }}>
                <Col span={8}>
                  <Text type="secondary">Branch:</Text>
                </Col>
                <Col span={16}>
                  <Tag color={currentBranch.color || '#8b4513'}>
                    {currentBranch.icon} {currentBranch.name}
                  </Tag>
                </Col>
              </Row>
            </Card>
          </div>

          <Alert
            message="Please confirm the payment details before generating the invoice."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </div>
      </Modal>

      {/* Advance Payment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PayCircleOutlined style={{ color: '#faad14' }} />
            <span>Confirm Advance Payment</span>
          </div>
        }
        open={showAdvanceModal}
        onCancel={() => setShowAdvanceModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAdvanceModal(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={confirmAndGenerateInvoice}
            icon={<CheckOutlined />}
            style={{
              background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
              border: 'none'
            }}
          >
            Confirm & Generate Advance Invoice
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <Alert
            message="Advance Billing"
            description="This will generate an advance payment invoice. The customer is making a partial payment now and will pay the remaining amount later."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small" style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}>
                <Statistic
                  title="Total Amount"
                  value={totals.finalTotal}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Card>
            </Col>
            <Col span={8}>
          <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Statistic
              title="Advance Payment"
              value={advanceAmount || 0}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
                <Statistic
                  title="Remaining"
                  value={remainingAmount || 0}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: '#fa541c', fontSize: '20px' }}
                />
              </Card>
            </Col>
          </Row>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Text strong>Advance Amount:</Text>
                <InputNumber
                  value={advanceAmount}
                  onChange={setAdvanceAmount}
                  min={0}
                  max={totals.finalTotal - 1}
                  style={{ width: '100%', marginTop: 8 }}
                  prefix="₹"
                  size="large"
                />
              </Col>
              <Col span={12}>
                <Text strong>Payment Method:</Text>
                <Select
                  value={finalPaymentMethod}
                  onChange={setFinalPaymentMethod}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                >
                  {paymentMethods.map(method => (
                    <Option key={method} value={method}>{method}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
              Customer Details:
            </Text>
            <Card size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">
                  {selectedCustomer?.name || 'Walk-in Customer'}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selectedCustomer?.phone || 'Not provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color={businessType === 'wholesale' ? 'orange' : 'blue'}>
                    {businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>

            <Alert
              message="Important"
              description={`The customer will pay ₹${(advanceAmount || 0).toFixed(2)} now and ₹${(remainingAmount || 0).toFixed(2)} later. An advance invoice will be generated.`}
              type="info"
              showIcon
            />
        </div>
      </Modal>

      {/* Custom Product Modal */}
      <Modal
        title="Add Custom Pottery Product"
        open={showProductModal}
        onCancel={() => setShowProductModal(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form form={productForm} layout="vertical" onFinish={handleAddDynamicProduct}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Enter product name' }]}
          >
            <Input placeholder="e.g., Decorative Terracotta Vase" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="retailPrice"
                label="Retail Price"
                rules={[{ required: true, message: 'Enter retail price' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  placeholder="Retail price"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="wholesalePrice"
                label="Wholesale Price"
                rules={[{ required: true, message: 'Enter wholesale price' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  placeholder="Wholesale price"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Enter quantity' }]}
            initialValue={1}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Enter quantity"
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowProductModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add to Cart
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        title="Add New Customer"
        open={showCustomerModal}
        onCancel={() => setShowCustomerModal(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form form={customerForm} layout="vertical" onFinish={handleAddDynamicCustomer}>
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: 'Enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { pattern: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit phone number' }
            ]}
          >
            <Input placeholder="Enter phone number (optional)" maxLength={10} />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { type: 'email', message: 'Enter valid email address' }
            ]}
          >
            <Input placeholder="Enter email address (optional)" />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCustomerModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add Customer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Price Edit Modal */}
      <Modal
        title="Edit Price"
        open={showPriceModal}
        onCancel={() => setShowPriceModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowPriceModal(false)}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" onClick={applyNewPrice}>
            Apply Price
          </Button>
        ]}
        width={400}
      >
        {editingItem && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{editingItem.product.name}</Text>
              <br />
              <Text type="secondary">Original Price: ₹{editingItem.originalPrice}</Text>
            </div>
            
            <InputNumber
              value={newPrice}
              onChange={setNewPrice}
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              prefix="₹"
              size="large"
              placeholder="Enter new price"
            />
            
            {newPrice < editingItem.originalPrice && (
              <Alert
                message={`Discount: ₹${(editingItem.originalPrice - newPrice).toFixed(2)} (${((editingItem.originalPrice - newPrice) / editingItem.originalPrice * 100).toFixed(1)}%)`}
                type="success"
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;