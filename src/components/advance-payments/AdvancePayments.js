// src/components/advance-payments/AdvancePayments.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Alert,
  Tooltip,
  Badge,
  Timeline,
  Descriptions,
  Divider,
  DatePicker,
  Tabs
} from 'antd';
import {
  PayCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  PrinterOutlined,
  CalendarOutlined,
  UserOutlined,
  ShopOutlined,
  HistoryOutlined,
  MoneyCollectOutlined,
  CreditCardOutlined,
  BankOutlined
} from '@ant-design/icons';
import { 
  fetchOrders, 
  completeAdvancePayment 
} from '../../features/order/orderSlice';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AdvancePayments = () => {
  const dispatch = useDispatch();
  const { items: orders, loading } = useSelector(state => state.orders);
  
  // Component state
  const [activeTab, setActiveTab] = useState('pending');
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [paymentForm] = Form.useForm();
  
  // Payment processing state
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load orders on component mount
  useEffect(() => {
    dispatch(fetchOrders({ 
      isAdvanceBilling: true,
      limit: 200 
    }));
  }, [dispatch]);

  // Filter advance orders
  const advanceOrders = orders.filter(order => order.isAdvanceBilling);
  const pendingAdvances = advanceOrders.filter(order => order.remainingAmount > 0);
  const completedAdvances = advanceOrders.filter(order => order.remainingAmount <= 0);

  // Bank options for Mitti Arts
  const bankOptions = [
    'Art of Indian pottery',
    'Swadeshi pottery', 
    'Telangana Shilpakala',
    'Clay Ganesha shoba'
  ];

  // Handle payment completion
  const handleCompletePayment = async () => {
    if (!selectedAdvance) return;
    
    setProcessingPayment(true);
    try {
      const values = await paymentForm.validateFields();
      
      // Validate payment amount
      if (values.paymentAmount > selectedAdvance.remainingAmount) {
        message.error('Payment amount cannot exceed remaining balance');
        return;
      }

      if (values.paymentAmount <= 0) {
        message.error('Payment amount must be greater than 0');
        return;
      }

      // Complete the advance payment
      const result = await dispatch(completeAdvancePayment({
        orderId: selectedAdvance.id,
        paymentAmount: values.paymentAmount,
        paymentMethod: values.paymentMethod,
        bankDetails: values.paymentMethod !== 'Cash' ? values.bankDetails : undefined,
        notes: values.notes
      }));

      if (completeAdvancePayment.fulfilled.match(result)) {
        const isFullyPaid = values.paymentAmount === selectedAdvance.remainingAmount;
        
        message.success(
          isFullyPaid 
            ? 'Payment completed! New invoice generated successfully.' 
            : 'Partial payment recorded successfully.'
        );
        
        // Close modal and refresh data
        setPaymentModal(false);
        setSelectedAdvance(null);
        paymentForm.resetFields();
        
        // Refresh orders data
        dispatch(fetchOrders({ 
          isAdvanceBilling: true,
          limit: 200 
        }));
        
        if (isFullyPaid) {
          // Show success message about new invoice
          Modal.success({
            title: 'Payment Completed!',
            content: `Order ${selectedAdvance.orderNumber} is now fully paid. A new invoice has been generated and the order has been moved to completed orders.`,
            onOk: () => {
              // Optionally navigate to the new invoice
              // navigate(`/invoices/${result.payload.id}`);
            }
          });
        }
      }
    } catch (error) {
      message.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Open payment modal
  const openPaymentModal = (advance) => {
    setSelectedAdvance(advance);
    paymentForm.setFieldsValue({
      paymentAmount: advance.remainingAmount,
      paymentMethod: 'Cash',
      bankDetails: '',
      notes: ''
    });
    setPaymentModal(true);
  };

  // Open details modal
  const openDetailsModal = (advance) => {
    setSelectedAdvance(advance);
    setDetailsModal(true);
  };

  // Calculate analytics
  const analytics = {
    totalPending: pendingAdvances.length,
    totalPendingAmount: pendingAdvances.reduce((sum, order) => sum + order.remainingAmount, 0),
    totalAdvanceCollected: advanceOrders.reduce((sum, order) => sum + (order.advanceAmount || 0), 0),
    totalCompleted: completedAdvances.length
  };

  // Table columns for pending advances
  const pendingColumns = [
    {
      title: 'Order Details',
      key: 'orderDetails',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong style={{ color: '#8b4513' }}>{record.orderNumber}</Text>
            <Tag color={record.businessType === 'wholesale' ? 'orange' : 'blue'} size="small">
              {record.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
            </Tag>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><UserOutlined /> {record.customer?.name || 'Walk-in Customer'}</div>
            <div><CalendarOutlined /> {moment(record.createdAt?.toDate?.() || record.createdAt).format('DD MMM YYYY')}</div>
            <div><ShopOutlined /> {record.branchInfo?.name || 'Unknown Branch'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Status',
      key: 'paymentStatus',
      width: 200,
      render: (_, record) => {
        const progress = ((record.advanceAmount || 0) / record.total) * 100;
        
        return (
          <div>
            <Row gutter={8} style={{ marginBottom: 8 }}>
              <Col span={12}>
                <Statistic
                  title="Total Amount"
                  value={record.total}
                  prefix="₹"
                  valueStyle={{ fontSize: '14px' }}
                  formatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Advance Paid"
                  value={record.advanceAmount || 0}
                  prefix="₹"
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                  formatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
              </Col>
            </Row>
            <div style={{ marginBottom: 4 }}>
              <Text strong style={{ color: '#fa541c' }}>
                Remaining: ₹{record.remainingAmount?.toFixed(2) || '0.00'}
              </Text>
            </div>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: progress >= 100 ? '#52c41a' : '#fa8c16',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <Text style={{ fontSize: '11px', color: '#666' }}>
              {progress.toFixed(1)}% paid
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      width: 120,
      render: (_, record) => {
        // Calculate due date (30 days from order for wholesale, 7 for retail)
        const orderDate = moment(record.createdAt?.toDate?.() || record.createdAt);
        const dueDate = orderDate.clone().add(record.businessType === 'wholesale' ? 30 : 7, 'days');
        const isOverdue = moment().isAfter(dueDate);
        
        return (
          <div>
            <div style={{ color: isOverdue ? '#ff4d4f' : '#666' }}>
              {dueDate.format('DD MMM')}
            </div>
            {isOverdue && (
              <Tag color="red" size="small">
                <ClockCircleOutlined /> Overdue
              </Tag>
            )}
            {!isOverdue && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                {dueDate.fromNow()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Tooltip title="View Details">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => openDetailsModal(record)}
              />
            </Tooltip>
            <Tooltip title="Print Current Invoice">
              <Button
                icon={<PrinterOutlined />}
                size="small"
                onClick={() => window.open(`/invoices/${record.id}`, '_blank')}
              />
            </Tooltip>
          </Space>
          <Button
            type="primary"
            size="small"
            icon={<PayCircleOutlined />}
            onClick={() => openPaymentModal(record)}
            block
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
          >
            Accept Payment
          </Button>
        </Space>
      ),
    },
  ];

  // Table columns for completed advances
  const completedColumns = [
    {
      title: 'Order Details',
      key: 'orderDetails',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong style={{ color: '#8b4513' }}>{record.orderNumber}</Text>
            <Tag color="green" size="small">
              <CheckCircleOutlined /> Completed
            </Tag>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><UserOutlined /> {record.customer?.name || 'Walk-in Customer'}</div>
            <div><CalendarOutlined /> Completed: {moment(record.completedAt).format('DD MMM YYYY')}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Summary',
      key: 'paymentSummary',
      render: (_, record) => (
        <div>
          <Row gutter={8}>
            <Col span={8}>
              <Statistic
                title="Total"
                value={record.total}
                prefix="₹"
                valueStyle={{ fontSize: '13px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Advance"
                value={record.advanceAmount}
                prefix="₹"
                valueStyle={{ fontSize: '13px', color: '#fa8c16' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Final"
                value={record.total - record.advanceAmount}
                prefix="₹"
                valueStyle={{ fontSize: '13px', color: '#52c41a' }}
              />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => openDetailsModal(record)}
            />
          </Tooltip>
          <Tooltip title="View Final Invoice">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              type="primary"
              onClick={() => window.open(`/invoices/${record.id}`, '_blank')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#fafafa' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)', 
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
              Advance Payments Management
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Track and manage pottery advance payments & partial orders
            </Text>
          </div>
        </div>
        <div style={{ fontSize: '32px', opacity: 0.3 }}>🏺</div>
      </div>

      {/* Analytics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Advances"
              value={analytics.totalPending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Amount"
              value={analytics.totalPendingAmount}
              prefix="₹"
              precision={0}
              valueStyle={{ color: '#ff4d4f' }}
              formatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Advance Collected"
              value={analytics.totalAdvanceCollected}
              prefix="₹"
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed Orders"
              value={analytics.totalCompleted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane 
            tab={
              <Badge count={analytics.totalPending} offset={[10, 0]}>
                <span>
                  <ClockCircleOutlined /> Pending Payments ({analytics.totalPending})
                </span>
              </Badge>
            } 
            key="pending"
          >
            {pendingAdvances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: '48px', marginBottom: 16 }}>💰</div>
                <Title level={4} type="secondary">No Pending Advance Payments</Title>
                <Text type="secondary">
                  All advance payments have been completed or no advance orders exist.
                </Text>
              </div>
            ) : (
              <Table
                columns={pendingColumns}
                dataSource={pendingAdvances}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} pending advance payments`
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined /> Completed ({analytics.totalCompleted})
              </span>
            } 
            key="completed"
          >
            <Table
              columns={completedColumns}
              dataSource={completedAdvances}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} completed advance payments`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Payment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PayCircleOutlined style={{ color: '#fa8c16' }} />
            <span>Complete Advance Payment</span>
          </div>
        }
        open={paymentModal}
        onCancel={() => setPaymentModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setPaymentModal(false)}>
            Cancel
          </Button>,
          <Button
            key="process"
            type="primary"
            loading={processingPayment}
            onClick={handleCompletePayment}
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
          >
            Process Payment
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        {selectedAdvance && (
          <>
            <Alert
              message="Advance Payment Completion"
              description={`Processing payment for order ${selectedAdvance.orderNumber}. Once payment is completed, a new invoice will be generated.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Total Order Amount"
                    value={selectedAdvance.total}
                    prefix="₹"
                    precision={2}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Already Paid"
                    value={selectedAdvance.advanceAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Remaining Balance"
                    value={selectedAdvance.remainingAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#fa541c' }}
                  />
                </Col>
              </Row>
            </Card>

            <Form form={paymentForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Payment Amount"
                    name="paymentAmount"
                    rules={[
                      { required: true, message: 'Please enter payment amount' },
                      { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      prefix="₹"
                      max={selectedAdvance.remainingAmount}
                      precision={2}
                      placeholder="Enter payment amount"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Payment Method"
                    name="paymentMethod"
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
              </Row>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.paymentMethod !== currentValues.paymentMethod
                }
              >
                {({ getFieldValue }) => {
                  const paymentMethod = getFieldValue('paymentMethod');
                  return paymentMethod && paymentMethod !== 'Cash' ? (
                    <Form.Item
                      label="Bank/Payment Details"
                      name="bankDetails"
                      rules={[{ required: true, message: 'Please select bank details' }]}
                    >
                      <Select placeholder="Select bank/payment details">
                        {bankOptions.map(bank => (
                          <Option key={bank} value={bank}>{bank}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item
                label="Notes (Optional)"
                name="notes"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Any additional notes about this payment..."
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Advance Payment Details"
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModal(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedAdvance && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Order Number">
                {selectedAdvance.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {selectedAdvance.customer?.name || 'Walk-in Customer'}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {moment(selectedAdvance.createdAt?.toDate?.() || selectedAdvance.createdAt).format('DD MMMM YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                <Tag color={selectedAdvance.businessType === 'wholesale' ? 'orange' : 'blue'}>
                  {selectedAdvance.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Branch">
                {selectedAdvance.branchInfo?.name || 'Unknown Branch'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={selectedAdvance.remainingAmount > 0 ? 'orange' : 'green'}>
                  {selectedAdvance.remainingAmount > 0 ? 'Partial Payment' : 'Fully Paid'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Payment Breakdown</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Total Order Amount"
                    value={selectedAdvance.total}
                    prefix="₹"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderColor: '#52c41a' }}>
                  <Statistic
                    title="Advance Paid"
                    value={selectedAdvance.advanceAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderColor: '#fa541c' }}>
                  <Statistic
                    title="Remaining Balance"
                    value={selectedAdvance.remainingAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#fa541c' }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">Order Items</Divider>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {selectedAdvance.items?.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span>{item.product?.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdvancePayments;// src/components/advance-payments/AdvancePayments.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Alert,
  Tooltip,
  Badge,
  Timeline,
  Descriptions,
  Divider,
  DatePicker,
  Tabs
} from 'antd';
import {
  PayCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  PrinterOutlined,
  CalendarOutlined,
  UserOutlined,
  ShopOutlined,
  HistoryOutlined,
  MoneyCollectOutlined,
  CreditCardOutlined,
  BankOutlined
} from '@ant-design/icons';
import { 
  fetchOrders, 
  completeAdvancePayment 
} from '../../features/order/orderSlice';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AdvancePayments = () => {
  const dispatch = useDispatch();
  const { items: orders, loading } = useSelector(state => state.orders);
  
  // Component state
  const [activeTab, setActiveTab] = useState('pending');
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [paymentForm] = Form.useForm();
  
  // Payment processing state
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load orders on component mount
  useEffect(() => {
    dispatch(fetchOrders({ 
      isAdvanceBilling: true,
      limit: 200 
    }));
  }, [dispatch]);

  // Filter advance orders
  const advanceOrders = orders.filter(order => order.isAdvanceBilling);
  const pendingAdvances = advanceOrders.filter(order => order.remainingAmount > 0);
  const completedAdvances = advanceOrders.filter(order => order.remainingAmount <= 0);

  // Bank options for Mitti Arts
  const bankOptions = [
    'Art of Indian pottery',
    'Swadeshi pottery', 
    'Telangana Shilpakala',
    'Clay Ganesha shoba'
  ];

  // Handle payment completion
  const handleCompletePayment = async () => {
    if (!selectedAdvance) return;
    
    setProcessingPayment(true);
    try {
      const values = await paymentForm.validateFields();
      
      // Validate payment amount
      if (values.paymentAmount > selectedAdvance.remainingAmount) {
        message.error('Payment amount cannot exceed remaining balance');
        return;
      }

      if (values.paymentAmount <= 0) {
        message.error('Payment amount must be greater than 0');
        return;
      }

      // Complete the advance payment
      const result = await dispatch(completeAdvancePayment({
        orderId: selectedAdvance.id,
        paymentAmount: values.paymentAmount,
        paymentMethod: values.paymentMethod,
        bankDetails: values.paymentMethod !== 'Cash' ? values.bankDetails : undefined,
        notes: values.notes
      }));

      if (completeAdvancePayment.fulfilled.match(result)) {
        const isFullyPaid = values.paymentAmount === selectedAdvance.remainingAmount;
        
        message.success(
          isFullyPaid 
            ? 'Payment completed! New invoice generated successfully.' 
            : 'Partial payment recorded successfully.'
        );
        
        // Close modal and refresh data
        setPaymentModal(false);
        setSelectedAdvance(null);
        paymentForm.resetFields();
        
        // Refresh orders data
        dispatch(fetchOrders({ 
          isAdvanceBilling: true,
          limit: 200 
        }));
        
        if (isFullyPaid) {
          // Show success message about new invoice
          Modal.success({
            title: 'Payment Completed!',
            content: `Order ${selectedAdvance.orderNumber} is now fully paid. A new invoice has been generated and the order has been moved to completed orders.`,
            onOk: () => {
              // Optionally navigate to the new invoice
              // navigate(`/invoices/${result.payload.id}`);
            }
          });
        }
      }
    } catch (error) {
      message.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Open payment modal
  const openPaymentModal = (advance) => {
    setSelectedAdvance(advance);
    paymentForm.setFieldsValue({
      paymentAmount: advance.remainingAmount,
      paymentMethod: 'Cash',
      bankDetails: '',
      notes: ''
    });
    setPaymentModal(true);
  };

  // Open details modal
  const openDetailsModal = (advance) => {
    setSelectedAdvance(advance);
    setDetailsModal(true);
  };

  // Calculate analytics
  const analytics = {
    totalPending: pendingAdvances.length,
    totalPendingAmount: pendingAdvances.reduce((sum, order) => sum + order.remainingAmount, 0),
    totalAdvanceCollected: advanceOrders.reduce((sum, order) => sum + (order.advanceAmount || 0), 0),
    totalCompleted: completedAdvances.length
  };

  // Table columns for pending advances
  const pendingColumns = [
    {
      title: 'Order Details',
      key: 'orderDetails',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong style={{ color: '#8b4513' }}>{record.orderNumber}</Text>
            <Tag color={record.businessType === 'wholesale' ? 'orange' : 'blue'} size="small">
              {record.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
            </Tag>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><UserOutlined /> {record.customer?.name || 'Walk-in Customer'}</div>
            <div><CalendarOutlined /> {moment(record.createdAt?.toDate?.() || record.createdAt).format('DD MMM YYYY')}</div>
            <div><ShopOutlined /> {record.branchInfo?.name || 'Unknown Branch'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Status',
      key: 'paymentStatus',
      width: 200,
      render: (_, record) => {
        const progress = ((record.advanceAmount || 0) / record.total) * 100;
        
        return (
          <div>
            <Row gutter={8} style={{ marginBottom: 8 }}>
              <Col span={12}>
                <Statistic
                  title="Total Amount"
                  value={record.total}
                  prefix="₹"
                  valueStyle={{ fontSize: '14px' }}
                  formatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Advance Paid"
                  value={record.advanceAmount || 0}
                  prefix="₹"
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                  formatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
              </Col>
            </Row>
            <div style={{ marginBottom: 4 }}>
              <Text strong style={{ color: '#fa541c' }}>
                Remaining: ₹{record.remainingAmount?.toFixed(2) || '0.00'}
              </Text>
            </div>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: progress >= 100 ? '#52c41a' : '#fa8c16',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <Text style={{ fontSize: '11px', color: '#666' }}>
              {progress.toFixed(1)}% paid
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      width: 120,
      render: (_, record) => {
        // Calculate due date (30 days from order for wholesale, 7 for retail)
        const orderDate = moment(record.createdAt?.toDate?.() || record.createdAt);
        const dueDate = orderDate.clone().add(record.businessType === 'wholesale' ? 30 : 7, 'days');
        const isOverdue = moment().isAfter(dueDate);
        
        return (
          <div>
            <div style={{ color: isOverdue ? '#ff4d4f' : '#666' }}>
              {dueDate.format('DD MMM')}
            </div>
            {isOverdue && (
              <Tag color="red" size="small">
                <ClockCircleOutlined /> Overdue
              </Tag>
            )}
            {!isOverdue && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                {dueDate.fromNow()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Tooltip title="View Details">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => openDetailsModal(record)}
              />
            </Tooltip>
            <Tooltip title="Print Current Invoice">
              <Button
                icon={<PrinterOutlined />}
                size="small"
                onClick={() => window.open(`/invoices/${record.id}`, '_blank')}
              />
            </Tooltip>
          </Space>
          <Button
            type="primary"
            size="small"
            icon={<PayCircleOutlined />}
            onClick={() => openPaymentModal(record)}
            block
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
          >
            Accept Payment
          </Button>
        </Space>
      ),
    },
  ];

  // Table columns for completed advances
  const completedColumns = [
    {
      title: 'Order Details',
      key: 'orderDetails',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong style={{ color: '#8b4513' }}>{record.orderNumber}</Text>
            <Tag color="green" size="small">
              <CheckCircleOutlined /> Completed
            </Tag>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><UserOutlined /> {record.customer?.name || 'Walk-in Customer'}</div>
            <div><CalendarOutlined /> Completed: {moment(record.completedAt).format('DD MMM YYYY')}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Summary',
      key: 'paymentSummary',
      render: (_, record) => (
        <div>
          <Row gutter={8}>
            <Col span={8}>
              <Statistic
                title="Total"
                value={record.total}
                prefix="₹"
                valueStyle={{ fontSize: '13px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Advance"
                value={record.advanceAmount}
                prefix="₹"
                valueStyle={{ fontSize: '13px', color: '#fa8c16' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Final"
                value={record.total - record.advanceAmount}
                prefix="₹"
                valueStyle={{ fontSize: '13px', color: '#52c41a' }}
              />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => openDetailsModal(record)}
            />
          </Tooltip>
          <Tooltip title="View Final Invoice">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              type="primary"
              onClick={() => window.open(`/invoices/${record.id}`, '_blank')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#fafafa' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)', 
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
              Advance Payments Management
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Track and manage pottery advance payments & partial orders
            </Text>
          </div>
        </div>
        <div style={{ fontSize: '32px', opacity: 0.3 }}>🏺</div>
      </div>

      {/* Analytics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Advances"
              value={analytics.totalPending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Amount"
              value={analytics.totalPendingAmount}
              prefix="₹"
              precision={0}
              valueStyle={{ color: '#ff4d4f' }}
              formatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Advance Collected"
              value={analytics.totalAdvanceCollected}
              prefix="₹"
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed Orders"
              value={analytics.totalCompleted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane 
            tab={
              <Badge count={analytics.totalPending} offset={[10, 0]}>
                <span>
                  <ClockCircleOutlined /> Pending Payments ({analytics.totalPending})
                </span>
              </Badge>
            } 
            key="pending"
          >
            {pendingAdvances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: '48px', marginBottom: 16 }}>💰</div>
                <Title level={4} type="secondary">No Pending Advance Payments</Title>
                <Text type="secondary">
                  All advance payments have been completed or no advance orders exist.
                </Text>
              </div>
            ) : (
              <Table
                columns={pendingColumns}
                dataSource={pendingAdvances}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} pending advance payments`
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined /> Completed ({analytics.totalCompleted})
              </span>
            } 
            key="completed"
          >
            <Table
              columns={completedColumns}
              dataSource={completedAdvances}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} completed advance payments`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Payment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PayCircleOutlined style={{ color: '#fa8c16' }} />
            <span>Complete Advance Payment</span>
          </div>
        }
        open={paymentModal}
        onCancel={() => setPaymentModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setPaymentModal(false)}>
            Cancel
          </Button>,
          <Button
            key="process"
            type="primary"
            loading={processingPayment}
            onClick={handleCompletePayment}
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
          >
            Process Payment
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        {selectedAdvance && (
          <>
            <Alert
              message="Advance Payment Completion"
              description={`Processing payment for order ${selectedAdvance.orderNumber}. Once payment is completed, a new invoice will be generated.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Total Order Amount"
                    value={selectedAdvance.total}
                    prefix="₹"
                    precision={2}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Already Paid"
                    value={selectedAdvance.advanceAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Remaining Balance"
                    value={selectedAdvance.remainingAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#fa541c' }}
                  />
                </Col>
              </Row>
            </Card>

            <Form form={paymentForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Payment Amount"
                    name="paymentAmount"
                    rules={[
                      { required: true, message: 'Please enter payment amount' },
                      { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      prefix="₹"
                      max={selectedAdvance.remainingAmount}
                      precision={2}
                      placeholder="Enter payment amount"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Payment Method"
                    name="paymentMethod"
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
              </Row>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.paymentMethod !== currentValues.paymentMethod
                }
              >
                {({ getFieldValue }) => {
                  const paymentMethod = getFieldValue('paymentMethod');
                  return paymentMethod && paymentMethod !== 'Cash' ? (
                    <Form.Item
                      label="Bank/Payment Details"
                      name="bankDetails"
                      rules={[{ required: true, message: 'Please select bank details' }]}
                    >
                      <Select placeholder="Select bank/payment details">
                        {bankOptions.map(bank => (
                          <Option key={bank} value={bank}>{bank}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item
                label="Notes (Optional)"
                name="notes"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Any additional notes about this payment..."
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Advance Payment Details"
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModal(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedAdvance && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Order Number">
                {selectedAdvance.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {selectedAdvance.customer?.name || 'Walk-in Customer'}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {moment(selectedAdvance.createdAt?.toDate?.() || selectedAdvance.createdAt).format('DD MMMM YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                <Tag color={selectedAdvance.businessType === 'wholesale' ? 'orange' : 'blue'}>
                  {selectedAdvance.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Branch">
                {selectedAdvance.branchInfo?.name || 'Unknown Branch'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={selectedAdvance.remainingAmount > 0 ? 'orange' : 'green'}>
                  {selectedAdvance.remainingAmount > 0 ? 'Partial Payment' : 'Fully Paid'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Payment Breakdown</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Total Order Amount"
                    value={selectedAdvance.total}
                    prefix="₹"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderColor: '#52c41a' }}>
                  <Statistic
                    title="Advance Paid"
                    value={selectedAdvance.advanceAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderColor: '#fa541c' }}>
                  <Statistic
                    title="Remaining Balance"
                    value={selectedAdvance.remainingAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#fa541c' }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">Order Items</Divider>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {selectedAdvance.items?.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span>{item.product?.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdvancePayments;