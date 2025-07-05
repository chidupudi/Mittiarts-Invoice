// src/components/storefront/StoreFront.js - Updated with Firebase CRUD operations
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Input,
  Modal,
  Typography,
  Space,
  Tag,
  Divider,
  Alert,
  Tabs,
  DatePicker,
  Select,
  Switch,
  Popconfirm,
  Tooltip,
  Badge,
  Statistic,
  Timeline,
  Progress,
  message,
  Avatar,
  Descriptions,
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  UserOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  BankOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import {
  fetchMainStore,
  updateMainStore,
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  fetchStalls,
  createStall,
  updateStall,
  deleteStall,
  updateStallStatus,
  updateStallRevenue,
  clearError,
  setBranchFilters,
  setStallFilters,
  updateAnalytics
} from '../../features/storefront/storefrontSlice';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;



const StoreFront = () => {
  // FIXED: Use Redux state instead of local state
  const dispatch = useDispatch();
  const {
    mainStore,
    branches,
    stalls,
    branchFilters,
    stallFilters,
    loading,
    error,
    analytics
  } = useSelector(state => state.storefront);

  // Component state for UI only
  const [activeTab, setActiveTab] = useState('branches');
  
  // Modal states
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [stallModalOpen, setStallModalOpen] = useState(false);
  const [storeDetailsModalOpen, setStoreDetailsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);

  // Form instances
  const [branchForm] = Form.useForm();
  const [stallForm] = Form.useForm();
  const [storeForm] = Form.useForm();

  // Loading states for operations
  const [operationLoading, setOperationLoading] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    loadStoreFrontData();
  }, []);

  // Update analytics when data changes
  useEffect(() => {
    if (branches.length > 0 || stalls.length > 0) {
      dispatch(updateAnalytics());
    }
  }, [branches, stalls, dispatch]);

  const loadStoreFrontData = async () => {
    try {
      // Use Redux actions to load data
      await Promise.all([
        dispatch(fetchMainStore()).unwrap(),
        dispatch(fetchBranches(branchFilters)).unwrap(),
        dispatch(fetchStalls(stallFilters)).unwrap()
      ]);
    } catch (error) {
      message.error('Failed to load store front data');
      console.error('Error loading store front data:', error);
    }
  };

  const handleRefresh = () => {
    loadStoreFrontData();
    message.success('Data refreshed successfully');
  };

  // Error handling
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Branch management functions
  const handleAddBranch = () => {
    setSelectedBranch(null);
    branchForm.resetFields();
    setBranchModalOpen(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    branchForm.setFieldsValue({
      name: branch.name,
      type: branch.type,
      street: branch.address?.street,
      city: branch.address?.city,
      state: branch.address?.state,
      pincode: branch.address?.pincode,
      phone: branch.contact?.phone,
      email: branch.contact?.email,
      manager: branch.manager,
      establishedDate: branch.establishedDate ? moment(branch.establishedDate) : null,
      monthlyRevenue: branch.monthlyRevenue,
      employeeCount: branch.employeeCount
    });
    setBranchModalOpen(true);
  };

  const handleSaveBranch = async () => {
    setOperationLoading(true);
    try {
      const values = await branchForm.validateFields();
      
      const branchData = {
        name: values.name,
        type: values.type || 'permanent',
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          pincode: values.pincode
        },
        contact: {
          phone: values.phone,
          email: values.email
        },
        manager: values.manager,
        establishedDate: values.establishedDate ? values.establishedDate.format('YYYY-MM-DD') : null,
        monthlyRevenue: values.monthlyRevenue || 0,
        employeeCount: values.employeeCount || 1,
        isMainBranch: false
      };

      if (selectedBranch) {
        await dispatch(updateBranch({ id: selectedBranch.id, branchData }));
        message.success('Branch updated successfully');
      } else {
        await dispatch(createBranch(branchData));
        message.success('Branch added successfully');
      }

      setBranchModalOpen(false);
      branchForm.resetFields();
      setSelectedBranch(null);
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill all required fields');
      } else {
        message.error('Error saving branch');
      }
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    setOperationLoading(true);
    try {
      await dispatch(deleteBranch(branchId));
      message.success('Branch deleted successfully');
    } catch (error) {
      message.error('Failed to delete branch');
    } finally {
      setOperationLoading(false);
    }
  };

  // Stall management functions
  const handleAddStall = () => {
    setSelectedStall(null);
    stallForm.resetFields();
    setStallModalOpen(true);
  };

  const handleEditStall = (stall) => {
    setSelectedStall(stall);
    stallForm.setFieldsValue({
      name: stall.name,
      type: stall.type,
      location: stall.location,
      eventName: stall.eventName,
      dateRange: [moment(stall.startDate), moment(stall.endDate)],
      setupDate: stall.setup?.date ? moment(stall.setup.date) : null,
      setupTime: stall.setup?.time,
      coordinator: stall.setup?.inPersonMaintainedBy || stall.contact?.coordinator,
      phone: stall.contact?.phone,
      stallSize: stall.stallSize,
      stallCost: stall.stallCost,
      expectedRevenue: stall.expectedRevenue
    });
    setStallModalOpen(true);
  };

  // Updated handleSaveStall function with proper error handling
  const handleSaveStall = async () => {
    setOperationLoading(true);
    try {
      const values = await stallForm.validateFields();
      const stallData = {
        id: selectedStall?.id || `stall_${Date.now()}`,
        name: values.name || '',
        type: values.type || 'fair_stall',
        location: values.location || '',
        eventName: values.eventName || '',
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        setup: {
          date: values.setupDate.format('YYYY-MM-DD'),
          time: values.setupTime || '09:00',
          inPersonMaintainedBy: values.coordinator || ''
        },
        status: 'planned',
        expectedRevenue: values.expectedRevenue || 0,
        stallSize: values.stallSize || '10x10 feet',
        stallCost: values.stallCost || 0,
        contact: {
          phone: values.phone || '',
          coordinator: values.coordinator || ''
        },
        totalRevenue: selectedStall?.totalRevenue || 0,
        dailyRevenue: selectedStall?.dailyRevenue || 0
      };

      if (selectedStall) {
        // Update existing stall using Redux
        await dispatch(updateStall({ id: selectedStall.id, stallData })).unwrap();
        message.success('Stall updated successfully');
      } else {
        // Add new stall using Redux
        await dispatch(createStall(stallData)).unwrap();
        message.success('Stall added successfully');
      }

      setStallModalOpen(false);
      stallForm.resetFields();
      setSelectedStall(null);
    } catch (error) {
      console.error('Error saving stall:', error);
      message.error('Please fill all required fields');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteStall = async (stallId) => {
    setOperationLoading(true);
    try {
      await dispatch(deleteStall(stallId));
      message.success('Stall deleted successfully');
    } catch (error) {
      message.error('Failed to delete stall');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleStallStatusChange = async (stallId, newStatus) => {
    try {
      await dispatch(updateStallStatus({ id: stallId, status: newStatus }));
      message.success(`Stall status updated to ${newStatus}`);
    } catch (error) {
      message.error('Failed to update stall status');
    }
  };

  // Store details management
  const handleEditStoreDetails = () => {
    if (mainStore) {
      storeForm.setFieldsValue({
        name: mainStore.name,
        street: mainStore.address?.street,
        city: mainStore.address?.city,
        state: mainStore.address?.state,
        pincode: mainStore.address?.pincode,
        phone: mainStore.contact?.phone,
        email: mainStore.contact?.email,
        website: mainStore.contact?.website,
        gst: mainStore.gst,
        owner: mainStore.owner,
        established: mainStore.established ? moment(mainStore.established) : null
      });
      setStoreDetailsModalOpen(true);
    }
  };

  const handleSaveStoreDetails = async () => {
    setOperationLoading(true);
    try {
      const values = await storeForm.validateFields();
      
      const storeData = {
        name: values.name,
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          country: 'India'
        },
        contact: {
          phone: values.phone,
          email: values.email,
          website: values.website
        },
        gst: values.gst,
        owner: values.owner,
        established: values.established ? values.established.format('YYYY-MM-DD') : null
      };

      await dispatch(updateMainStore(storeData));
      setStoreDetailsModalOpen(false);
      storeForm.resetFields();
      message.success('Store details updated successfully');
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill all required fields');
      } else {
        message.error('Error updating store details');
      }
    } finally {
      setOperationLoading(false);
    }
  };

  // Helper functions
  const getStallColor = (type) => {
    switch (type) {
      case 'fair_stall': return '#fa8c16';
      case 'seasonal_stall': return '#1890ff';
      case 'exhibition': return '#722ed1';
      default: return '#8c8c8c';
    }
  };

  const getStallTagColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'planned': return 'blue';
      case 'completed': return 'purple';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  // Table columns
  const branchColumns = [
    {
      title: 'Branch Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Avatar 
              style={{ backgroundColor: record.isMainBranch ? '#8b4513' : '#cd853f' }}
              icon={<ShopOutlined />}
              size="small"
            />
            <Text strong style={{ fontSize: '14px' }}>{record.name}</Text>
            {record.isMainBranch && (
              <Tag color="gold" size="small">MAIN BRANCH</Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><EnvironmentOutlined /> {record.address?.street}, {record.address?.city}</div>
            <div><PhoneOutlined /> {record.contact?.phone}</div>
            <div><UserOutlined /> Manager: {record.manager}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 150,
      render: (_, record) => (
        <div>
          <Statistic
            title="Monthly Revenue"
            value={record.monthlyRevenue}
            prefix="₹"
            valueStyle={{ fontSize: '14px', color: '#52c41a' }}
            formatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <div style={{ marginTop: 8, fontSize: '12px' }}>
            <div><TeamOutlined /> {record.employeeCount} employees</div>
            <div>Since: {record.establishedDate ? moment(record.establishedDate).format('MMM YYYY') : 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {(status || 'active').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Branch">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditBranch(record)}
            />
          </Tooltip>
          {!record.isMainBranch && (
            <Popconfirm
              title="Delete Branch"
              description="Are you sure you want to delete this branch?"
              onConfirm={() => handleDeleteBranch(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete Branch">
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const stallColumns = [
    {
      title: 'Stall Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Avatar 
              style={{ backgroundColor: getStallColor(record.type) }}
              icon={<TrophyOutlined />}
              size="small"
            />
            <Text strong style={{ fontSize: '14px' }}>{record.name}</Text>
            <Tag color={getStallTagColor(record.status)} size="small">
              {(record.status || 'planned').toUpperCase()}
            </Tag>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><EnvironmentOutlined /> {record.location}</div>
            <div><CalendarOutlined /> {record.eventName}</div>
            <div><UserOutlined /> {record.setup?.inPersonMaintainedBy || record.contact?.coordinator}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>
            <div><strong>Duration:</strong></div>
            <div>{moment(record.startDate).format('DD MMM')} - {moment(record.endDate).format('DD MMM')}</div>
          </div>
          {record.setup?.date && (
            <div style={{ fontSize: '12px' }}>
              <div><strong>Setup:</strong></div>
              <div>{moment(record.setup.date).format('DD MMM')} at {record.setup.time}</div>
            </div>
          )}
          {record.checkout && (
            <div style={{ fontSize: '12px', marginTop: 4 }}>
              <div><strong>Checkout:</strong></div>
              <div>{moment(record.checkout.date).format('DD MMM')} at {record.checkout.time}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Financial',
      key: 'financial',
      width: 130,
      render: (_, record) => (
        <div>
          <Statistic
            title="Revenue"
            value={record.totalRevenue || record.expectedRevenue}
            prefix="₹"
            valueStyle={{ fontSize: '13px', color: record.totalRevenue ? '#52c41a' : '#1890ff' }}
            formatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: 4 }}>
            <div>Cost: ₹{((record.stallCost || 0) / 1000).toFixed(0)}k</div>
            <div>Size: {record.stallSize}</div>
            {record.status === 'active' && record.dailyRevenue && (
              <div>Daily: ₹{(record.dailyRevenue / 1000).toFixed(0)}k</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Tooltip title="Edit Stall">
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditStall(record)}
              />
            </Tooltip>
            <Tooltip title="View Details">
              <Button
                icon={<EyeOutlined />}
                size="small"
              />
            </Tooltip>
            <Popconfirm
              title="Delete Stall"
              description="Are you sure you want to delete this stall?"
              onConfirm={() => handleDeleteStall(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete Stall">
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                />
              </Tooltip>
            </Popconfirm>
          </Space>
          {record.status === 'planned' && (
            <Button
              icon={<PlayCircleOutlined />}
              size="small"
              type="primary"
              onClick={() => handleStallStatusChange(record.id, 'active')}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Start
            </Button>
          )}
          {record.status === 'active' && (
            <Button
              icon={<PauseCircleOutlined />}
              size="small"
              onClick={() => handleStallStatusChange(record.id, 'completed')}
            >
              Complete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading && (!mainStore && branches.length === 0 && stalls.length === 0)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading Mitti Arts store front data..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#fafafa' }}>
      {/* Header */}
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
            🏪
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Store Front Management
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Manage Branches, Stalls & Store Details
            </Text>
          </div>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            size="large"
            style={{ 
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white'
            }}
          >
            Refresh
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={handleEditStoreDetails}
            size="large"
            style={{ 
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white'
            }}
          >
            Store Settings
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Branches"
              value={analytics.totalBranches}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#8b4513' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={analytics.totalRevenue}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${(value / 100000).toFixed(1)}L`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Stalls"
              value={analytics.activeStalls}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Stall Revenue"
              value={analytics.stallRevenue}
              prefix="₹"
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane 
            tab={
              <span>
                <ShopOutlined />
                Permanent Branches ({branches.length})
              </span>
            } 
            key="branches"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddBranch}
                size="large"
                style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
                loading={operationLoading}
              >
                Add New Branch
              </Button>
            </div>
            <Table
              columns={branchColumns}
              dataSource={branches}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <TrophyOutlined />
                Fair Stalls & Events ({stalls.length})
              </span>
            } 
            key="stalls"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddStall}
                size="large"
                style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                loading={operationLoading}
              >
                Setup New Stall
              </Button>
            </div>
            <Table
              columns={stallColumns}
              dataSource={stalls}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Branch Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShopOutlined style={{ color: '#8b4513' }} />
            <span>{selectedBranch ? 'Edit Branch' : 'Add New Branch'}</span>
          </div>
        }
        open={branchModalOpen}
        onCancel={() => setBranchModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setBranchModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={operationLoading}
            onClick={handleSaveBranch}
            style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
          >
            {selectedBranch ? 'Update Branch' : 'Add Branch'}
          </Button>
        ]}
        width={700}
        destroyOnClose
      >
        <Form form={branchForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Branch Name"
                name="name"
                rules={[{ required: true, message: 'Please enter branch name' }]}
              >
                <Input placeholder="e.g., Downtown Showroom" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Branch Type"
                name="type"
                rules={[{ required: true, message: 'Please select branch type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="permanent">Permanent Branch</Option>
                  <Option value="seasonal">Seasonal Branch</Option>
                  <Option value="popup">Pop-up Store</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Address Details</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Street Address"
                name="street"
                rules={[{ required: true, message: 'Please enter street address' }]}
              >
                <Input placeholder="Plot No., Street, Area" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="State"
                name="state"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input placeholder="State" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="PIN Code"
                name="pincode"
                rules={[{ required: true, message: 'Please enter PIN code' }]}
              >
                <Input placeholder="PIN Code" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Contact & Management</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="+91 XXXXX XXXXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, message: 'Please enter email' }]}
              >
                <Input placeholder="branch@mittiarts.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Branch Manager"
                name="manager"
                rules={[{ required: true, message: 'Please enter manager name' }]}
              >
                <Input placeholder="Manager Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Established Date"
                name="establishedDate"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Performance Metrics</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Monthly Revenue (₹)" name="monthlyRevenue">
                <Input type="number" placeholder="Monthly revenue in rupees" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Employee Count" name="employeeCount">
                <Input type="number" placeholder="Number of employees" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Stall Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: '#fa8c16' }} />
            <span>{selectedStall ? 'Edit Stall' : 'Setup New Stall'}</span>
          </div>
        }
        open={stallModalOpen}
        onCancel={() => setStallModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setStallModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={operationLoading}
            onClick={handleSaveStall}
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
          >
            {selectedStall ? 'Update Stall' : 'Setup Stall'}
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        <Form form={stallForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Stall Name"
                name="name"
                rules={[{ required: true, message: 'Please enter stall name' }]}
              >
                <Input placeholder="e.g., Diwali Pottery Fair" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Stall Type"
                name="type"
                rules={[{ required: true, message: 'Please select stall type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="fair_stall">Fair Stall</Option>
                  <Option value="seasonal_stall">Seasonal Stall</Option>
                  <Option value="exhibition">Exhibition</Option>
                  <Option value="festival">Festival Stall</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Location"
                name="location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Venue/Mall/Exhibition Center" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Event Name"
                name="eventName"
                rules={[{ required: true, message: 'Please enter event name' }]}
              >
                <Input placeholder="Festival/Fair Name" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Timeline</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Event Duration"
                name="dateRange"
                rules={[{ required: true, message: 'Please select event dates' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Setup Date"
                name="setupDate"
                rules={[{ required: true, message: 'Please select setup date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Setup Time"
                name="setupTime"
                rules={[{ required: true, message: 'Please enter setup time' }]}
              >
                <Input placeholder="09:00" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Management</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="In-Person Maintained By"
                name="coordinator"
                rules={[{ required: true, message: 'Please enter coordinator name' }]}
              >
                <Input placeholder="Person responsible for the stall" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Contact Phone"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="+91 XXXXX XXXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Stall Details</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Stall Size" name="stallSize">
                <Input placeholder="10x10 feet" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Stall Cost (₹)" name="stallCost">
                <Input type="number" placeholder="Cost to rent the stall" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Expected Revenue (₹)" name="expectedRevenue">
                <Input type="number" placeholder="Expected total revenue" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Store Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ color: '#8b4513' }} />
            <span>Store Details</span>
          </div>
        }
        open={storeDetailsModalOpen}
        onCancel={() => setStoreDetailsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setStoreDetailsModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={operationLoading}
            onClick={handleSaveStoreDetails}
            style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
          >
            Update Store Details
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        <Form form={storeForm} layout="vertical">
          <Form.Item
            label="Store Name"
            name="name"
            rules={[{ required: true, message: 'Please enter store name' }]}
          >
            <Input placeholder="Store Name" />
          </Form.Item>

          <Divider orientation="left">Address</Divider>
          <Form.Item
            label="Street Address"
            name="street"
            rules={[{ required: true, message: 'Please enter street address' }]}
          >
            <Input placeholder="Complete street address" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="State"
                name="state"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input placeholder="State" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="PIN Code"
                name="pincode"
                rules={[{ required: true, message: 'Please enter PIN code' }]}
              >
                <Input placeholder="PIN Code" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Contact Information</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="+91 XXXXX XXXXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, message: 'Please enter email' }]}
              >
                <Input placeholder="info@mittiarts.com" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Website" name="website">
            <Input placeholder="www.mittiarts.com" />
          </Form.Item>

          <Divider orientation="left">Business Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="GST Number"
                name="gst"
                rules={[{ required: true, message: 'Please enter GST number' }]}
              >
                <Input placeholder="GST Number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Owner Name"
                name="owner"
                rules={[{ required: true, message: 'Please enter owner name' }]}
              >
                <Input placeholder="Owner Name" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Established Date"
            name="established"
            rules={[{ required: true, message: 'Please select established date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoreFront;