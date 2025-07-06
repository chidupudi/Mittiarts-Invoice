import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Typography,
  Tag,
  Timeline,
  Space,
  Button,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Input,
  Alert,
  Tooltip,
  Progress
} from 'antd';
import {
  HistoryOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import {
  getAdvancePaymentRecords,
  getAdvanceCompletions,
  calculateAdvanceAnalytics
} from '../../features/order/orderSlice';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdvancePaymentHistory = ({ orderId = null, showFilters = true }) => {
  const dispatch = useDispatch();
  const { paymentRecords = [], advanceCompletions = [], advanceAnalytics = {}, loading } = useSelector(state => state.orders);

  const [filters, setFilters] = useState({
    dateRange: [],
    businessType: '',
    search: '',
    paymentMethod: ''
  });
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [analyticsModal, setAnalyticsModal] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadPaymentHistory();
    loadAdvanceCompletions();
    calculateAnalytics();
  }, [dispatch, orderId, filters]);

  const loadPaymentHistory = () => {
    const filterParams = {
      ...(orderId && { orderId }),
      ...(filters.dateRange.length === 2 && {
        startDate: filters.dateRange[0].toDate(),
        endDate: filters.dateRange[1].toDate()
      }),
      ...(filters.businessType && { businessType: filters.businessType }),
      ...(filters.search && { search: filters.search })
    };

    dispatch(getAdvancePaymentRecords(filterParams));
  };

  const loadAdvanceCompletions = () => {
    const filterParams = {
      ...(filters.dateRange.length === 2 && {
        startDate: filters.dateRange[0].toDate(),
        endDate: filters.dateRange[1].toDate()
      })
    };

    dispatch(getAdvanceCompletions(filterParams));
  };

  const calculateAnalytics = () => {
    const dateRange = filters.dateRange.length === 2 ? {
      startDate: filters.dateRange[0].toDate(),
      endDate: filters.dateRange[1].toDate()
    } : {};

    dispatch(calculateAdvanceAnalytics(dateRange));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openDetailsModal = (record) => {
    setSelectedRecord(record);
    setDetailsModal(true);
  };

  const exportData = () => {
    try {
      const csvData = paymentRecords.map(record => ({
        'Payment Date': moment(record.paymentDate).format('YYYY-MM-DD HH:mm'),
        'Order Number': record.orderNumber,
        'Customer': record.customerName || 'Walk-in Customer',
        'Payment Amount': record.paymentAmount,
        'Payment Method': record.paymentMethod,
        'Business Type': record.businessType,
        'Previous Balance': record.previousBalance,
        'New Balance': record.newBalance,
        'Is Full Payment': record.isFullPayment ? 'Yes' : 'No',
        'Branch': record.branchInfo?.name || 'Unknown',
        'Notes': record.notes || ''
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `advance-payments-history-${moment().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Payment history table columns
  const paymentColumns = [
    {
      title: 'Payment Details',
      key: 'paymentDetails',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong style={{ color: '#8b4513' }}>{record.orderNumber}</Text>
            <Tag color={record.isFullPayment ? 'green' : 'orange'} size="small">
              {record.isFullPayment ? 'Final Payment' : 'Partial Payment'}
            </Tag>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><UserOutlined /> {record.customerName || 'Walk-in Customer'}</div>
            <div><CalendarOutlined /> {moment(record.paymentDate).format('DD MMM YYYY, HH:mm')}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Info',
      key: 'paymentInfo',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Statistic
              title="Payment Amount"
              value={record.paymentAmount}
              prefix="₹"
              valueStyle={{ fontSize: '16px', color: '#52c41a' }}
              precision={2}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>Method: {record.paymentMethod}</div>
            {record.bankDetails && (
              <div>Bank: {record.bankDetails}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Balance Changes',
      key: 'balanceChanges',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>
            <Text type="secondary">Previous: </Text>
            <Text>₹{record.previousBalance?.toFixed(2) || '0.00'}</Text>
          </div>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>
            <Text type="secondary">Payment: </Text>
            <Text style={{ color: '#52c41a' }}>-₹{record.paymentAmount?.toFixed(2) || '0.00'}</Text>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
            <Text type="secondary">New Balance: </Text>
            <Text style={{ color: record.newBalance > 0 ? '#fa541c' : '#52c41a' }}>
              ₹{record.newBalance?.toFixed(2) || '0.00'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Business Type',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 100,
      render: (businessType) => (
        <Tag color={businessType === 'wholesale' ? 'orange' : 'blue'}>
          {businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
        </Tag>
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
          {record.isFullPayment && (
            <Tooltip title="View Final Invoice">
              <Button
                icon={<PrinterOutlined />}
                size="small"
                type="primary"
                onClick={() => window.open(`/invoices/${record.orderId}`, '_blank')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Completion timeline data
  const completionTimelineData = advanceCompletions.map(completion => ({
    dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    children: (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>{completion.originalOrderNumber}</Text>
          <Tag color="green">₹{completion.finalPaymentAmount?.toFixed(2)}</Tag>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
          <div>{completion.customerName} • {completion.businessType}</div>
          <div>{moment(completion.completionDate).format('DD MMM YYYY, HH:mm')}</div>
        </div>
      </div>
    )
  }));

  return (
    <div style={{ padding: orderId ? 0 : 24 }}>
      {!orderId && (
        <div style={{ marginBottom: 24 }}>
          <Title level={3}>
            <HistoryOutlined /> Advance Payment History
          </Title>
          <Text type="secondary">
            Track all advance payment transactions and completions
          </Text>
        </div>
      )}

      {/* Analytics Summary */}
      {advanceAnalytics.summary && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Payments"
                value={paymentRecords.length}
                prefix={<PayCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Amount Collected"
                value={paymentRecords.reduce((sum, record) => sum + (record.paymentAmount || 0), 0)}
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
                value={advanceCompletions.length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setAnalyticsModal(true)}
                block
                style={{ height: '100%', minHeight: '60px' }}
              >
                View Analytics
              </Button>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      {showFilters && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search orders, customers..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates || [])}
                style={{ width: '100%' }}
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                value={filters.businessType}
                onChange={(value) => handleFilterChange('businessType', value)}
                placeholder="Business Type"
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="">All Types</Option>
                <Option value="retail">Retail</Option>
                <Option value="wholesale">Wholesale</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Button
                icon={<ExportOutlined />}
                onClick={exportData}
                disabled={paymentRecords.length === 0}
                block
              >
                Export
              </Button>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {paymentRecords.length} payment{paymentRecords.length !== 1 ? 's' : ''}
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Payment History Table */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Payment Transactions">
            {paymentRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <PayCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <Text type="secondary">No payment records found</Text>
              </div>
            ) : (
              <Table
                columns={paymentColumns}
                dataSource={paymentRecords}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} payments`
                }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Recent Completions">
            {completionTimelineData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <Text type="secondary">No completions yet</Text>
              </div>
            ) : (
              <Timeline
                items={completionTimelineData.slice(0, 10)}
                style={{ maxHeight: 400, overflowY: 'auto' }}
              />
            )}
            {completionTimelineData.length > 10 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">
                  Showing latest 10 of {completionTimelineData.length} completions
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Payment Details Modal */}
      <Modal
        title="Payment Transaction Details"
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModal(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Order Number">
                {selectedRecord.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {selectedRecord.customerName || 'Walk-in Customer'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Date">
                {moment(selectedRecord.paymentDate).format('DD MMMM YYYY, HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                <Tag color="blue">{selectedRecord.paymentMethod}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                <Tag color={selectedRecord.businessType === 'wholesale' ? 'orange' : 'blue'}>
                  {selectedRecord.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Type">
                <Tag color={selectedRecord.isFullPayment ? 'green' : 'orange'}>
                  {selectedRecord.isFullPayment ? 'Final Payment' : 'Partial Payment'}
                </Tag>
              </Descriptions.Item>
              {selectedRecord.bankDetails && (
                <Descriptions.Item label="Bank Details" span={2}>
                  {selectedRecord.bankDetails}
                </Descriptions.Item>
              )}
              {selectedRecord.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedRecord.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="Payment Breakdown" size="small" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Previous Balance"
                    value={selectedRecord.previousBalance}
                    prefix="₹"
                    precision={2}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Payment Amount"
                    value={selectedRecord.paymentAmount}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="New Balance"
                    value={selectedRecord.newBalance}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: selectedRecord.newBalance > 0 ? '#fa541c' : '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>

            {selectedRecord.isFullPayment && (
              <Alert
                message="Order Completed"
                description="This was the final payment for this order. A completion invoice has been generated."
                type="success"
                showIcon
                style={{ marginTop: 16 }}
                action={
                  <Button size="small" onClick={() => window.open(`/invoices/${selectedRecord.orderId}`, '_blank')}>
                    View Invoice
                  </Button>
                }
              />
            )}
          </div>
        )}
      </Modal>

      {/* Analytics Modal */}
      <Modal
        title="Advance Payment Analytics"
        open={analyticsModal}
        onCancel={() => setAnalyticsModal(false)}
        footer={[
          <Button key="close" onClick={() => setAnalyticsModal(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {advanceAnalytics.summary && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Orders"
                    value={advanceAnalytics.summary.totalAdvanceOrders}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Completed"
                    value={advanceAnalytics.summary.completedAdvances}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Pending"
                    value={advanceAnalytics.summary.pendingAdvances}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Advance %"
                    value={advanceAnalytics.summary.advancePercentage}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Business Type Analytics */}
            {advanceAnalytics.businessTypeAnalytics && (
              <Card title="Business Type Breakdown" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" title="Retail">
                      <Statistic
                        title="Orders"
                        value={advanceAnalytics.businessTypeAnalytics.retail.totalOrders}
                        suffix={`/ ₹${advanceAnalytics.businessTypeAnalytics.retail.totalAdvance.toFixed(0)}`}
                      />
                      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        Avg: ₹{advanceAnalytics.businessTypeAnalytics.retail.averageAdvance.toFixed(0)}
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="Wholesale">
                      <Statistic
                        title="Orders"
                        value={advanceAnalytics.businessTypeAnalytics.wholesale.totalOrders}
                        suffix={`/ ₹${advanceAnalytics.businessTypeAnalytics.wholesale.totalAdvance.toFixed(0)}`}
                      />
                      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        Avg: ₹{advanceAnalytics.businessTypeAnalytics.wholesale.averageAdvance.toFixed(0)}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Branch Analytics */}
            {advanceAnalytics.branchAnalytics && Object.keys(advanceAnalytics.branchAnalytics).length > 0 && (
              <Card title="Branch Performance" size="small">
                {Object.entries(advanceAnalytics.branchAnalytics).map(([branchName, data]) => (
                  <div key={branchName} style={{ marginBottom: 16, padding: 12, border: '1px solid #f0f0f0', borderRadius: 6 }}>
                    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>{branchName}</Title>
                    <Row gutter={8}>
                      <Col span={6}>
                        <Text type="secondary">Total Orders:</Text>
                        <div style={{ fontWeight: 'bold' }}>{data.totalOrders}</div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary">Pending:</Text>
                        <div style={{ fontWeight: 'bold', color: '#fa8c16' }}>{data.pendingOrders}</div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary">Completed:</Text>
                        <div style={{ fontWeight: 'bold', color: '#52c41a' }}>{data.completedOrders}</div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary">Advance:</Text>
                        <div style={{ fontWeight: 'bold' }}>₹{(data.totalAdvanceAmount / 1000).toFixed(1)}k</div>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdvancePaymentHistory;