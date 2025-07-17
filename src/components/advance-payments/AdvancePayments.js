// src/components/advance-payments/AdvancePayments.js - Enhanced Mitti Arts Advance Payments with SMS Integration
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  DatePicker,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  message,
  Tooltip,
  Spin,
  Divider,
  Badge,
  Popconfirm
} from 'antd';
import {
  PayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DollarOutlined,
  SendOutlined,
  PhoneOutlined,
  ReloadOutlined,
  FilterOutlined,
  MessageOutlined,
  BellOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  fetchOrders,
  completeAdvancePayment,
  calculateAdvanceAnalytics,
  getAdvancePaymentHistory
} from '../../features/order/orderSlice';
import smsService from '../../services/smsService';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const AdvancePayments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { 
    items: orders = [], 
    loading, 
    error,
    advanceAnalytics = {}
  } = useSelector(state => state.orders);

  // Local state
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentForm] = Form.useForm();
  const [reminderForm] = Form.useForm();
  const [smsLoading, setSmsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    overdue: false,
    dateRange: null,
    search: ''
  });

  // Bank options for Mitti Arts
  const bankOptions = [
    'Art of Indian pottery',
    'Swadeshi pottery', 
    'Telangana Shilpakala',
    'Clay Ganesha shoba'
  ];

  // Load data on component mount
  useEffect(() => {
    loadAdvanceOrders();
    dispatch(calculateAdvanceAnalytics());
  }, [dispatch]);

  // Filter orders when data or filters change
  useEffect(() => {
    filterOrders();
  }, [orders, filters]);

  const loadAdvanceOrders = async () => {
    try {
      await dispatch(fetchOrders({ 
        isAdvanceBilling: true,
        limit: 200 
      })).unwrap();
    } catch (error) {
      console.error('Failed to load advance orders:', error);
      message.error('Failed to load advance payments');
    }
  };

  const filterOrders = () => {
    let filtered = orders.filter(order => order.isAdvanceBilling);

    // Status filter
    if (filters.status === 'pending') {
      filtered = filtered.filter(order => order.remainingAmount > 0);
    } else if (filters.status === 'completed') {
      filtered = filtered.filter(order => order.remainingAmount <= 0);
    }

    // Overdue filter
    if (filters.overdue) {
      filtered = filtered.filter(order => {
        if (order.remainingAmount <= 0) return false;
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        const dueDate = orderDate.clone().add(order.businessType === 'wholesale' ? 30 : 7, 'days');
        return moment().isAfter(dueDate);
      });
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        return orderDate.isBetween(start, end, 'day', '[]');
      });
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.customer?.name?.toLowerCase().includes(searchTerm) ||
        order.customer?.phone?.includes(searchTerm)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt);
      const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt);
      return dateB - dateA;
    });

    setFilteredOrders(filtered);
  };

  const handleCompletePayment = async (values) => {
    try {
      console.log('Completing advance payment:', values);
      
      const result = await dispatch(completeAdvancePayment({
        orderId: selectedOrder.id,
        paymentAmount: values.paymentAmount,
        paymentMethod: values.paymentMethod,
        bankDetails: values.paymentMethod !== 'Cash' ? values.bank : null,
        notes: values.notes || ''
      })).unwrap();

      message.success('Payment completed successfully!');
      
      // Send completion SMS if customer has valid phone
      if (selectedOrder.customer?.phone && smsService.isValidPhoneNumber(selectedOrder.customer.phone)) {
        setSmsLoading(true);
        try {
          const smsResult = await smsService.sendPaymentCompletionSMS(
            selectedOrder.customer.phone,
            selectedOrder.customer.name,
            selectedOrder.orderNumber,
            values.paymentAmount,
            result.billToken || selectedOrder.billToken
          );

          if (smsResult.success) {
            message.success('Payment completion SMS sent successfully!');
          } else {
            message.warning('Payment completed but SMS failed to send');
          }
        } catch (smsError) {
          console.error('SMS Error:', smsError);
          message.warning('Payment completed but SMS failed to send');
        } finally {
          setSmsLoading(false);
        }
      }

      setShowPaymentModal(false);
      setSelectedOrder(null);
      paymentForm.resetFields();
      loadAdvanceOrders();
      dispatch(calculateAdvanceAnalytics());
      
    } catch (error) {
      console.error('Payment completion error:', error);
      message.error(error || 'Failed to complete payment');
    }
  };

  const handleSendReminder = async (values) => {
    try {
      setSmsLoading(true);
      
      const orderDate = moment(selectedOrder.createdAt?.toDate?.() || selectedOrder.createdAt);
      const dueDate = orderDate.clone().add(selectedOrder.businessType === 'wholesale' ? 30 : 7, 'days');
      const daysOverdue = moment().diff(dueDate, 'days');
      
      const smsResult = await smsService.sendAdvanceReminderSMS(
        selectedOrder.customer.phone,
        selectedOrder.customer.name,
        selectedOrder.orderNumber,
        selectedOrder.remainingAmount,
        Math.max(0, daysOverdue)
      );

      if (smsResult.success) {
        message.success('Reminder SMS sent successfully!');
        setShowReminderModal(false);
        setSelectedOrder(null);
        reminderForm.resetFields();
      } else {
        message.error(`Failed to send reminder: ${smsResult.error}`);
      }
    } catch (error) {
      console.error('Reminder SMS error:', error);
      message.error('Failed to send reminder SMS');
    } finally {
      setSmsLoading(false);
    }
  };

  const getDaysOverdue = (order) => {
    const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
    const dueDate = orderDate.clone().add(order.businessType === 'wholesale' ? 30 : 7, 'days');
    return Math.max(0, moment().diff(dueDate, 'days'));
  };

  const getStatusTag = (order) => {
    if (order.remainingAmount <= 0) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Completed</Tag>;
    }
    
    const daysOverdue = getDaysOverdue(order);
    if (daysOverdue > 0) {
      return <Tag color="red" icon={<ExclamationCircleOutlined />}>Overdue ({daysOverdue}d)</Tag>;
    }
    
    return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
  };

  const columns = [
    {
      title: 'Order Details',
      key: 'orderDetails',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#8b4513' }}>
            {record.orderNumber}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(record.createdAt?.toDate?.() || record.createdAt).format('DD/MM/YY HH:mm')}
          </Text>
          <br />
          <Tag color={record.businessType === 'wholesale' ? 'orange' : 'blue'} size="small">
            {record.businessType === 'wholesale' ? '🏪 Wholesale' : '🛍️ Retail'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div>
          <Text strong>{record.customer?.name || 'Walk-in Customer'}</Text>
          {record.customer?.phone && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <PhoneOutlined /> {record.customer.phone}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Payment Summary',
      key: 'paymentSummary',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Total: </Text>
            <Text strong>₹{record.total?.toFixed(2)}</Text>
          </div>
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Advance: </Text>
            <Text style={{ color: '#52c41a' }}>₹{(record.advanceAmount || 0).toFixed(2)}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>Remaining: </Text>
            <Text strong style={{ color: record.remainingAmount > 0 ? '#fa541c' : '#52c41a' }}>
              ₹{(record.remainingAmount || 0).toFixed(2)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      width: 100,
      render: (_, record) => {
        const orderDate = moment(record.createdAt?.toDate?.() || record.createdAt);
        const dueDate = orderDate.clone().add(record.businessType === 'wholesale' ? 30 : 7, 'days');
        const daysOverdue = getDaysOverdue(record);
        
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px' }}>
              {dueDate.format('DD/MM/YY')}
            </div>
            {daysOverdue > 0 && (
              <Text type="danger" style={{ fontSize: '11px' }}>
                {daysOverdue}d overdue
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <Tooltip title="View Invoice">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => navigate(`/invoices/${record.id}`)}
                style={{ backgroundColor: '#8b4513', borderColor: '#8b4513', color: 'white' }}
              />
            </Tooltip>
            {record.remainingAmount > 0 && (
              <Tooltip title="Complete Payment">
                <Button
                  icon={<DollarOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => {
                    setSelectedOrder(record);
                    setShowPaymentModal(true);
                    paymentForm.setFieldsValue({
                      paymentAmount: record.remainingAmount,
                      paymentMethod: 'Cash'
                    });
                  }}
                />
              </Tooltip>
            )}
          </Space>
          {record.remainingAmount > 0 && record.customer?.phone && smsService.isValidPhoneNumber(record.customer.phone) && (
            <Button
              icon={<MessageOutlined />}
              size="small"
              onClick={() => {
                setSelectedOrder(record);
                setShowReminderModal(true);
              }}
              style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: 'white' }}
            >
              Remind
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Calculate summary stats
  const pendingOrders = filteredOrders.filter(order => order.remainingAmount > 0);
  const completedOrders = filteredOrders.filter(order => order.remainingAmount <= 0);
  const totalPendingAmount = pendingOrders.reduce((sum, order) => sum + (order.remainingAmount || 0), 0);
  const totalAdvanceCollected = filteredOrders.reduce((sum, order) => sum + (order.advanceAmount || 0), 0);
  const overdueOrders = pendingOrders.filter(order => getDaysOverdue(order) > 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading advance payments..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#fafafa' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #fa8c16 0%, #fa541c 100%)', 
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
            color: '#fa8c16',
            fontWeight: 'bold',
            fontSize: '24px'
          }}>
            💰
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Advance Payments
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Mitti Arts Pottery - Partial Payment Management
            </Text>
          </div>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadAdvanceOrders}
          loading={loading}
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'white'
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Payments"
              value={pendingOrders.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Amount Pending"
              value={totalPendingAmount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Advance Collected"
              value={totalAdvanceCollected}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Overdue Orders"
              value={overdueOrders.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {overdueOrders.length > 0 && (
        <Alert
          message={`⚠️ ${overdueOrders.length} overdue payments requiring attention`}
          description="Consider sending payment reminders to customers with overdue payments."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button 
              size="small" 
              onClick={() => setFilters(prev => ({ ...prev, overdue: true }))}
            >
              View Overdue
            </Button>
          }
        />
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={4}>
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Input.Search
              placeholder="Search orders, customers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Button
              type={filters.overdue ? 'primary' : 'default'}
              danger={filters.overdue}
              icon={<WarningOutlined />}
              onClick={() => setFilters(prev => ({ ...prev, overdue: !prev.overdue }))}
            >
              {filters.overdue ? 'Show All' : 'Overdue Only'}
            </Button>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Text type="secondary">
              {filteredOrders.length} orders
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} advance payments`,
          }}
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => {
            if (record.remainingAmount <= 0) return 'completed-row';
            if (getDaysOverdue(record) > 0) return 'overdue-row';
            return '';
          }}
          summary={(pageData) => {
            const pagePending = pageData.reduce((sum, record) => sum + (record.remainingAmount || 0), 0);
            const pageAdvance = pageData.reduce((sum, record) => sum + (record.advanceAmount || 0), 0);
            
            return (
              <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>Page Total:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <div>
                    <div>Advance: ₹{pageAdvance.toFixed(2)}</div>
                    <div style={{ color: '#fa541c' }}>Pending: ₹{pagePending.toFixed(2)}</div>
                  </div>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={3} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* Payment Completion Modal */}
      <Modal
        title={
          <Space>
            <PayCircleOutlined style={{ color: '#52c41a' }} />
            <span>Complete Advance Payment</span>
          </Space>
        }
        open={showPaymentModal}
        onCancel={() => {
          setShowPaymentModal(false);
          setSelectedOrder(null);
          paymentForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Alert
              message="Payment Completion"
              description={`Complete the remaining payment for order ${selectedOrder.orderNumber}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f5ff', borderRadius: 6 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Total Order"
                    value={selectedOrder.total}
                    prefix="₹"
                    precision={2}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Already Paid"
                    value={selectedOrder.advanceAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Remaining"
                    value={selectedOrder.remainingAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#fa541c' }}
                  />
                </Col>
              </Row>
            </div>

            <Form
              form={paymentForm}
              layout="vertical"
              onFinish={handleCompletePayment}
            >
              <Form.Item
                name="paymentAmount"
                label="Payment Amount"
                rules={[
                  { required: true, message: 'Please enter payment amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
                  { 
                    type: 'number', 
                    max: selectedOrder.remainingAmount, 
                    message: 'Amount cannot exceed remaining balance' 
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="₹"
                  min={0.01}
                  max={selectedOrder.remainingAmount}
                  step={0.01}
                  placeholder="Enter payment amount"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="paymentMethod"
                    label="Payment Method"
                    rules={[{ required: true, message: 'Please select payment method' }]}
                  >
                    <Select placeholder="Select payment method">
                      <Option value="Cash">Cash</Option>
                      <Option value="Card">Card</Option>
                      <Option value="UPI">UPI</Option>
                      <Option value="Bank Transfer">Bank Transfer</Option>
                      <Option value="Cheque">Cheque</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="bank"
                    label="Bank (if not Cash)"
                  >
                    <Select placeholder="Select bank" allowClear>
                      {bankOptions.map(bank => (
                        <Option key={bank} value={bank}>{bank}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Notes (Optional)"
              >
                <TextArea
                  rows={3}
                  placeholder="Any additional notes about the payment..."
                />
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOrder(null);
                    paymentForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading || smsLoading}
                    icon={<CheckCircleOutlined />}
                  >
                    Complete Payment
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* SMS Reminder Modal */}
      <Modal
        title={
          <Space>
            <MessageOutlined style={{ color: '#fa8c16' }} />
            <span>Send Payment Reminder</span>
          </Space>
        }
        open={showReminderModal}
        onCancel={() => {
          setShowReminderModal(false);
          setSelectedOrder(null);
          reminderForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        {selectedOrder && (
          <div>
            <Alert
              message="SMS Reminder"
              description={`Send payment reminder to ${selectedOrder.customer?.name} (${selectedOrder.customer?.phone})`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 6 }}>
              <Text strong>Order: </Text>{selectedOrder.orderNumber}<br />
              <Text strong>Remaining: </Text>₹{selectedOrder.remainingAmount?.toFixed(2)}<br />
              <Text strong>Days Overdue: </Text>{getDaysOverdue(selectedOrder)} days
            </div>

            <Form
              form={reminderForm}
              layout="vertical"
              onFinish={handleSendReminder}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">
                  A polite reminder SMS will be sent to the customer about their pending payment.
                </Text>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => {
                    setShowReminderModal(false);
                    setSelectedOrder(null);
                    reminderForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={smsLoading}
                    icon={<SendOutlined />}
                    style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                  >
                    Send Reminder
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .completed-row {
          background-color: #f6ffed !important;
        }
        .overdue-row {
          background-color: #fff2f0 !important;
        }
        .completed-row:hover {
          background-color: #d9f7be !important;
        }
        .overdue-row:hover {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};

export default AdvancePayments;