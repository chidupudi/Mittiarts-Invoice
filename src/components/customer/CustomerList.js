// src/components/customer/CustomerList.js - Updated to show both phone numbers
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Popconfirm, 
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Avatar,
  message,
  Tooltip,
  Badge,
  Select,
  Tabs,
  Statistic,
  Progress,
  Alert,
  Modal,
  Descriptions,
  Timeline,
  Divider
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ShoppingOutlined,
  SearchOutlined,
  BankOutlined,
  ShopOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined,
  PayCircleOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { 
  fetchCustomers, 
  deleteCustomer, 
  setSelectedCustomer 
} from '../../features/customer/customerSlice';
import { fetchOrders } from '../../features/order/orderSlice';
import CustomerForm from './CustomerForm';
import moment from 'moment';

const { Search } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mitti Arts branch configuration
const MITTI_ARTS_BRANCHES = {
  'main_showroom': { name: 'Main Showroom', icon: '🏪', color: '#1890ff' },
  'pottery_workshop': { name: 'Pottery Workshop', icon: '🏺', color: '#52c41a' },
  'export_unit': { name: 'Export Unit', icon: '📦', color: '#fa8c16' }
};

const CustomerList = () => {
  const dispatch = useDispatch();
  const { items: customers, loading, error } = useSelector(state => state.customers);
  const { items: orders } = useSelector(state => state.orders);

  const [search, setSearch] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openForm, setOpenForm] = useState(false);
  const [customerDetailsModal, setCustomerDetailsModal] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState(null);
  const [advancePaymentsModal, setAdvancePaymentsModal] = useState(false);

  useEffect(() => {
    console.log('CustomerList: Loading Mitti Arts customers...');
    dispatch(fetchCustomers({ search, page, pageSize }));
    dispatch(fetchOrders({})); // Load orders for customer analytics
  }, [dispatch, search, page, pageSize]);

  const handleEdit = (customer) => {
    console.log('Editing customer:', customer);
    dispatch(setSelectedCustomer(customer));
    setOpenForm(true);
  };

  const handleAdd = () => {
    console.log('Adding new customer');
    dispatch(setSelectedCustomer(null));
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await dispatch(deleteCustomer(id));
      if (deleteCustomer.fulfilled.match(result)) {
        message.success('Customer deleted successfully');
        dispatch(fetchCustomers({ search, page, pageSize }));
      } else {
        message.error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Error deleting customer');
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    dispatch(setSelectedCustomer(null));
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    dispatch(setSelectedCustomer(null));
    dispatch(fetchCustomers({ search, page, pageSize }));
    message.success('Customer saved successfully');
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomerForDetails(customer);
    setCustomerDetailsModal(true);
  };

  // Get customer analytics
  const getCustomerAnalytics = (customer) => {
    const customerOrders = orders.filter(order => order.customerId === customer.id);
    
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    const retailOrders = customerOrders.filter(order => order.businessType === 'retail');
    const wholesaleOrders = customerOrders.filter(order => order.businessType === 'wholesale');
    
    const advanceOrders = customerOrders.filter(order => order.isAdvanceBilling);
    const pendingAdvances = advanceOrders.filter(order => order.remainingAmount > 0);
    const totalAdvanceAmount = pendingAdvances.reduce((sum, order) => sum + (order.remainingAmount || 0), 0);
    
    const lastOrder = customerOrders.length > 0 ? 
      customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
    
    const branchPreference = getBranchPreference(customerOrders);
    const businessTypePreference = getBusinessTypePreference(customerOrders);
    
    return {
      totalOrders,
      totalSpent,
      avgOrderValue,
      retailOrders: retailOrders.length,
      wholesaleOrders: wholesaleOrders.length,
      advanceOrders: advanceOrders.length,
      pendingAdvances: pendingAdvances.length,
      totalAdvanceAmount,
      lastOrder,
      branchPreference,
      businessTypePreference,
      customerSince: customer.createdAt,
      loyalty: calculateLoyaltyScore(customerOrders, totalSpent)
    };
  };

  const getBranchPreference = (customerOrders) => {
    const branchCounts = {};
    customerOrders.forEach(order => {
      const branch = order.branch || 'main_showroom';
      branchCounts[branch] = (branchCounts[branch] || 0) + 1;
    });
    
    const preferred = Object.keys(branchCounts).reduce((a, b) => 
      branchCounts[a] > branchCounts[b] ? a : b, 'main_showroom');
    
    return MITTI_ARTS_BRANCHES[preferred] || MITTI_ARTS_BRANCHES['main_showroom'];
  };

  const getBusinessTypePreference = (customerOrders) => {
    const retailCount = customerOrders.filter(order => order.businessType === 'retail').length;
    const wholesaleCount = customerOrders.filter(order => order.businessType === 'wholesale').length;
    
    if (wholesaleCount > retailCount) return 'wholesale';
    if (retailCount > wholesaleCount) return 'retail';
    return 'mixed';
  };

  const calculateLoyaltyScore = (customerOrders, totalSpent) => {
    const orderCount = customerOrders.length;
    const avgSpent = orderCount > 0 ? totalSpent / orderCount : 0;
    
    let score = 0;
    if (orderCount >= 10) score += 30;
    else if (orderCount >= 5) score += 20;
    else if (orderCount >= 2) score += 10;
    
    if (totalSpent >= 50000) score += 30;
    else if (totalSpent >= 20000) score += 20;
    else if (totalSpent >= 5000) score += 10;
    
    if (avgSpent >= 5000) score += 20;
    else if (avgSpent >= 2000) score += 10;
    
    const recentOrders = customerOrders.filter(order => 
      moment().diff(moment(order.createdAt), 'months') <= 3
    );
    if (recentOrders.length >= 2) score += 20;
    
    return Math.min(score, 100);
  };

  const getLoyaltyLevel = (score) => {
    if (score >= 80) return { level: 'Platinum', color: '#722ed1', icon: '👑' };
    if (score >= 60) return { level: 'Gold', color: '#faad14', icon: '🏆' };
    if (score >= 40) return { level: 'Silver', color: '#52c41a', icon: '🥈' };
    if (score >= 20) return { level: 'Bronze', color: '#fa8c16', icon: '🥉' };
    return { level: 'New', color: '#8c8c8c', icon: '🌟' };
  };

  // Filter customers based on current filters
  const filteredCustomers = customers.filter(customer => {
    const analytics = getCustomerAnalytics(customer);
    
    if (businessTypeFilter && analytics.businessTypePreference !== businessTypeFilter) {
      return false;
    }
    
    if (branchFilter && analytics.branchPreference.name !== MITTI_ARTS_BRANCHES[branchFilter]?.name) {
      return false;
    }
    
    return true;
  });

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      width: 280,
      render: (_, record) => {
        const analytics = getCustomerAnalytics(record);
        const loyalty = getLoyaltyLevel(analytics.loyalty);
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar 
              size={50} 
              icon={<UserOutlined />} 
              style={{ 
                backgroundColor: loyalty.color,
                border: `2px solid ${loyalty.color}`,
                position: 'relative'
              }}
            >
              {record.name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text strong style={{ fontSize: '14px' }}>
                  {record.name}
                </Text>
                <Tooltip title={`${loyalty.level} Customer (${analytics.loyalty}% loyalty score)`}>
                  <span style={{ fontSize: '12px' }}>
                    {loyalty.icon}
                  </span>
                </Tooltip>
              </div>
              
              <div style={{ marginBottom: 4 }}>
                {/* Display both phone numbers */}
                {record.phone1 && (
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                    <PhoneOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                    <Text style={{ fontWeight: 'bold' }}>Primary:</Text> {record.phone1}
                  </div>
                )}
                {record.phone2 && (
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                    <PhoneOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                    <Text style={{ fontWeight: 'bold' }}>Secondary:</Text> {record.phone2}
                  </div>
                )}
                {/* Fallback for old customers with single phone field */}
                {!record.phone1 && !record.phone2 && record.phone && (
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                    <PhoneOutlined style={{ marginRight: 4 }} />
                    {record.phone}
                  </div>
                )}
                {record.email && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <MailOutlined style={{ marginRight: 4 }} />
                    {record.email}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag 
                  color={analytics.businessTypePreference === 'wholesale' ? 'orange' : 
                         analytics.businessTypePreference === 'retail' ? 'blue' : 'purple'} 
                  size="small"
                >
                  {analytics.businessTypePreference === 'wholesale' ? (
                    <><BankOutlined /> Wholesale</>
                  ) : analytics.businessTypePreference === 'retail' ? (
                    <><ShopOutlined /> Retail</>
                  ) : (
                    <>🔄 Mixed</>
                  )}
                </Tag>
                
                <Tag color={analytics.branchPreference.color} size="small">
                  {analytics.branchPreference.icon} {analytics.branchPreference.name}
                </Tag>
                
                {analytics.pendingAdvances > 0 && (
                  <Tooltip title={`${analytics.pendingAdvances} pending advance payments`}>
                    <Tag color="warning" size="small">
                      <PayCircleOutlined /> Advance
                    </Tag>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Purchase Analytics',
      key: 'analytics',
      width: 200,
      render: (_, record) => {
        const analytics = getCustomerAnalytics(record);
        const loyalty = getLoyaltyLevel(analytics.loyalty);
        
        return (
          <div>
            <Row gutter={[8, 4]}>
              <Col span={12}>
                <Statistic
                  title="Orders"
                  value={analytics.totalOrders}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Spent"
                  value={analytics.totalSpent}
                  prefix="₹"
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                  formatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
              </Col>
            </Row>
            
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: '11px', color: '#666' }}>Avg Order: </Text>
              <Text strong style={{ fontSize: '11px' }}>₹{analytics.avgOrderValue.toFixed(0)}</Text>
            </div>
            
            <div style={{ marginTop: 6 }}>
              <Text style={{ fontSize: '10px', color: '#666' }}>Loyalty Score: </Text>
              <Progress 
                percent={analytics.loyalty} 
                size="small" 
                strokeColor={loyalty.color}
                showInfo={false}
              />
              <Text style={{ fontSize: '10px', color: loyalty.color, fontWeight: 'bold' }}>
                {loyalty.level}
              </Text>
            </div>
            
            {analytics.lastOrder && (
              <div style={{ marginTop: 4, fontSize: '10px', color: '#999' }}>
                Last order: {moment(analytics.lastOrder.createdAt?.toDate?.() || analytics.lastOrder.createdAt).fromNow()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Business Profile',
      key: 'business',
      width: 150,
      render: (_, record) => {
        const analytics = getCustomerAnalytics(record);
        
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: '11px', color: '#666' }}>Retail Orders: </Text>
              <Text strong style={{ fontSize: '11px', color: '#1890ff' }}>
                {analytics.retailOrders}
              </Text>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: '11px', color: '#666' }}>Wholesale Orders: </Text>
              <Text strong style={{ fontSize: '11px', color: '#fa8c16' }}>
                {analytics.wholesaleOrders}
              </Text>
            </div>
            
            {analytics.advanceOrders > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: '11px', color: '#666' }}>Advance Orders: </Text>
                <Text strong style={{ fontSize: '11px', color: '#722ed1' }}>
                  {analytics.advanceOrders}
                </Text>
              </div>
            )}
            
            {analytics.totalAdvanceAmount > 0 && (
              <Alert
                message={`₹${analytics.totalAdvanceAmount.toFixed(0)} pending`}
                type="warning"
                size="small"
                showIcon
                style={{ fontSize: '10px' }}
              />
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const analytics = getCustomerAnalytics(record);
        
        return (
          <Space direction="vertical" size="small">
            <Space size="small">
              <Tooltip title="View Details">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetails(record)}
                  type="primary"
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Edit Customer">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  size="small"
                />
              </Tooltip>
              <Popconfirm
                title="Delete Customer"
                description="Are you sure you want to delete this customer? This action cannot be undone."
                onConfirm={() => handleDelete(record.id)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okType="danger"
                placement="topRight"
              >
                <Tooltip title="Delete Customer">
                  <Button 
                    icon={<DeleteOutlined />} 
                    danger 
                    size="small"
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
            
            {analytics.pendingAdvances > 0 && (
              <Button
                icon={<PayCircleOutlined />}
                size="small"
                type="dashed"
                onClick={() => {
                  setSelectedCustomerForDetails(record);
                  setAdvancePaymentsModal(true);
                }}
                style={{ fontSize: '10px' }}
              >
                Advances ({analytics.pendingAdvances})
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const renderCustomerDetails = () => {
    if (!selectedCustomerForDetails) return null;
    
    const analytics = getCustomerAnalytics(selectedCustomerForDetails);
    const loyalty = getLoyaltyLevel(analytics.loyalty);
    const customerOrders = orders.filter(order => order.customerId === selectedCustomerForDetails.id);
    
    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar 
              size={40} 
              style={{ backgroundColor: loyalty.color }}
            >
              {selectedCustomerForDetails.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: '16px' }}>
                {selectedCustomerForDetails.name}
              </Text>
              <div>
                <Tag color={loyalty.color} style={{ marginTop: 4 }}>
                  {loyalty.icon} {loyalty.level} Customer
                </Tag>
              </div>
            </div>
          </div>
        }
        open={customerDetailsModal}
        onCancel={() => setCustomerDetailsModal(false)}
        footer={null}
        width={800}
      >
        <Tabs defaultActiveKey="overview">
          <TabPane tab="Overview" key="overview">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Contact Information">
                  <Descriptions column={1} size="small">
                    {/* Display both phone numbers */}
                    <Descriptions.Item label="Primary Phone">
                      {selectedCustomerForDetails.phone1 || selectedCustomerForDetails.phone || 'Not provided'}
                    </Descriptions.Item>
                    {selectedCustomerForDetails.phone2 && (
                      <Descriptions.Item label="Secondary Phone">
                        {selectedCustomerForDetails.phone2}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Email">
                      {selectedCustomerForDetails.email || 'Not provided'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer Since">
                      {moment(selectedCustomerForDetails.createdAt?.toDate?.() || selectedCustomerForDetails.createdAt).format('DD MMM YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Preferred Branch">
                      <Tag color={analytics.branchPreference.color}>
                        {analytics.branchPreference.icon} {analytics.branchPreference.name}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Business Type">
                      <Tag color={analytics.businessTypePreference === 'wholesale' ? 'orange' : 'blue'}>
                        {analytics.businessTypePreference === 'wholesale' ? 'Wholesale' : 
                         analytics.businessTypePreference === 'retail' ? 'Retail' : 'Mixed'}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card size="small" title="Purchase Statistics">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Total Orders"
                        value={analytics.totalOrders}
                        prefix={<ShoppingOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Total Spent"
                        value={analytics.totalSpent}
                        prefix="₹"
                        precision={2}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Avg Order Value"
                        value={analytics.avgOrderValue}
                        prefix="₹"
                        precision={0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Loyalty Score"
                        value={analytics.loyalty}
                        suffix="%"
                        valueStyle={{ color: loyalty.color }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
            
            <Card size="small" title="Business Breakdown" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Retail Orders"
                    value={analytics.retailOrders}
                    prefix={<ShopOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Wholesale Orders"
                    value={analytics.wholesaleOrders}
                    prefix={<BankOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Advance Orders"
                    value={analytics.advanceOrders}
                    prefix={<PayCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
              
              {analytics.totalAdvanceAmount > 0 && (
                <Alert
                  message={`Pending Advance Payments: ₹${analytics.totalAdvanceAmount.toFixed(2)}`}
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </TabPane>
          
          <TabPane tab="Order History" key="orders">
            <Timeline mode="left">
              {customerOrders.slice(0, 10).map((order, index) => (
                <Timeline.Item
                  key={order.id}
                  color={order.businessType === 'wholesale' ? '#fa8c16' : '#1890ff'}
                  dot={order.isAdvanceBilling ? <PayCircleOutlined /> : <ShoppingOutlined />}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{order.orderNumber}</Text>
                      <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        ₹{order.total?.toFixed(2)}
                      </Text>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      {moment(order.createdAt?.toDate?.() || order.createdAt).format('DD MMM YYYY, hh:mm A')}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Tag size="small" color={order.businessType === 'wholesale' ? 'orange' : 'blue'}>
                        {order.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                      </Tag>
                      <Tag size="small" color={MITTI_ARTS_BRANCHES[order.branch]?.color || '#1890ff'}>
                        {MITTI_ARTS_BRANCHES[order.branch]?.icon} {MITTI_ARTS_BRANCHES[order.branch]?.name}
                      </Tag>
                      {order.isAdvanceBilling && (
                        <Tag size="small" color={order.remainingAmount > 0 ? 'warning' : 'success'}>
                          {order.remainingAmount > 0 ? 'Advance Pending' : 'Advance Complete'}
                        </Tag>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                      {order.items?.length || 0} items • {order.paymentMethod}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
            
            {customerOrders.length > 10 && (
              <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                Showing latest 10 orders of {customerOrders.length} total
              </Text>
            )}
          </TabPane>
        </Tabs>
      </Modal>
    );
  };

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Customers"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => dispatch(fetchCustomers({}))}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#fafafa' }}>
      {/* Header with Mitti Arts branding */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b4513',
            fontWeight: 'bold',
            fontSize: '24px'
          }}>
            👥
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Mitti Arts Customers
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Pottery Customer Relationship Management
            </Text>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Statistic
            title="Total Customers"
            value={filteredCustomers.length}
            valueStyle={{ color: 'white', fontSize: '24px' }}
          />
        </div>
      </div>

      {/* Action Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#8b4513' }}>
            Customer Database ({filteredCustomers.length})
          </Title>
          <Text type="secondary">Manage your pottery customer relationships</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
            style={{ 
              background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)'
            }}
          >
            Add Customer
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search customers by name, phone, or email..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={handleSearch}
              allowClear
              size="large"
            />
          </Col>
          
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="Business Type"
              value={businessTypeFilter}
              onChange={setBusinessTypeFilter}
              allowClear
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="">All Types</Option>
              <Option value="retail">🛍️ Retail</Option>
              <Option value="wholesale">🏪 Wholesale</Option>
              <Option value="mixed">🔄 Mixed</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="Branch"
              value={branchFilter}
              onChange={setBranchFilter}
              allowClear
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="">All Branches</Option>
              {Object.entries(MITTI_ARTS_BRANCHES).map(([key, branch]) => (
                <Option key={key} value={key}>
                  {branch.icon} {branch.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Text type="secondary">
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Customer Table */}
      <Card>
        {filteredCustomers.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>👥</div>
            <Title level={4} type="secondary">No customers found</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {customers.length === 0 ? 'Start by adding your first pottery customer' : 'Try adjusting your search criteria'}
            </Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                border: 'none'
              }}
            >
              Add First Customer
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            loading={loading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: filteredCustomers.length,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['5', '10', '25', '50'],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} customers`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}
      </Card>

      {/* Customer Form Modal */}
      <CustomerForm
        open={openForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      {/* Customer Details Modal */}
      {renderCustomerDetails()}

      {/* Business Insights */}
      <Card 
        title={
          <Space>
            <span>📊</span>
            <Text strong>Customer Insights</Text>
          </Space>
        } 
        style={{ marginTop: 16 }}
        bodyStyle={{ backgroundColor: '#f9f9f9' }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>🏺</div>
              <Text strong>Handcrafted Quality</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Build lasting relationships through quality pottery
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>🤝</div>
              <Text strong>Personal Service</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Track preferences and purchase history
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>🎨</div>
              <Text strong>Custom Orders</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Personalized pottery for every customer
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CustomerList;