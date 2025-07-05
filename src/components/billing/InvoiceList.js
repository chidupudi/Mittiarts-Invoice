// src/components/billing/InvoiceList.js - Mitti Arts pottery business invoice list
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  DatePicker,
  Select,
  Tooltip,
  message,
  Modal,
  Statistic,
  Spin,
  Alert
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  PrinterOutlined,
  CalendarOutlined,
  ReloadOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { fetchOrders } from '../../features/order/orderSlice';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const InvoiceList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get orders from Redux store (these are our invoices)
  const { items: orders, loading, error } = useSelector(state => state.orders);
  
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    paymentMethod: ''
  });

  // Load orders on component mount
  useEffect(() => {
    console.log('InvoiceList: Loading pottery orders...');
    dispatch(fetchOrders({ limit: 100 }));
  }, [dispatch]);

  // Filter orders and calculate summary when orders or filters change
  useEffect(() => {
    if (orders && orders.length > 0) {
      console.log('InvoiceList: Processing pottery orders:', orders.length);
      filterAndProcessOrders();
    } else {
      setFilteredInvoices([]);
      setSummary(null);
    }
  }, [orders, filters]);

  const filterAndProcessOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.customer?.name?.toLowerCase().includes(searchTerm) ||
        order.customer?.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Apply payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate >= filters.startDate && orderDate <= filters.endDate;
      });
    }

    // Calculate summary for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= thirtyDaysAgo && order.status !== 'cancelled';
    });

    // Business perspective calculations for pottery
    const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalGiven = recentOrders.reduce((sum, order) => sum + (order.discount || 0), 0);
    const totalOrders = recentOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const summaryData = {
      totalInvoices: totalOrders,
      totalRevenue,
      totalDiscountGiven: totalGiven,
      averageOrderValue,
      savingsProvided: totalGiven // From business perspective, this is what we gave to customers
    };

    setFilteredInvoices(filtered);
    setSummary(summaryData);
    console.log('InvoiceList: Filtered pottery invoices:', filtered.length);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDateFilter = (dates) => {
    setFilters(prev => ({
      ...prev,
      startDate: dates ? dates[0].toDate() : null,
      endDate: dates ? dates[1].toDate() : null
    }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handlePaymentMethodFilter = (paymentMethod) => {
    setFilters(prev => ({ ...prev, paymentMethod }));
  };

  const handleViewInvoice = (order) => {
    navigate(`/invoices/${order.id}`);
  };

  const handlePrintInvoice = (order) => {
    // Open invoice in new window for printing
    const printWindow = window.open(`/invoices/${order.id}`, '_blank');
    setTimeout(() => {
      printWindow?.print();
    }, 1000);
  };

  const handleRefresh = () => {
    dispatch(fetchOrders({ limit: 100 }));
    message.success('Pottery invoices refreshed');
  };

  const handleExport = () => {
    try {
      // Simple CSV export with pottery business perspective
      const csvData = filteredInvoices.map(order => ({
        'Invoice Number': order.orderNumber,
        'Date': moment(order.createdAt?.toDate?.() || order.createdAt).format('YYYY-MM-DD'),
        'Customer': order.customer?.name || 'Walk-in Customer',
        'Phone': order.customer?.phone || '',
        'Items': order.items?.length || 0,
        'Subtotal': order.subtotal || 0,
        'Discount Given': order.discount || 0,
        'Final Amount': order.total || 0,
        'Payment Method': order.paymentMethod || '',
        'Status': order.status || ''
      }));

      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mitti-arts-invoices-${moment().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      message.success('Pottery invoice data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (text) => (
        <Text strong style={{ color: '#8b4513' }}>{text || 'N/A'}</Text>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => {
        const orderDate = date?.toDate ? date.toDate() : new Date(date);
        return (
          <div>
            <div>{moment(orderDate).format('DD/MM/YYYY')}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {moment(orderDate).format('HH:mm A')}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.customer?.name || 'Walk-in Customer'}</div>
          {record.customer?.phone && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.customer.phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Pottery Items',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      align: 'center',
      render: (items) => (
        <Tag color="#8b4513" style={{ color: 'white' }}>
          {items?.length || 0} items
        </Tag>
      ),
    },
    {
      title: 'Business Summary',
      key: 'businessSummary',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            List: ₹{(record.subtotal || 0).toFixed(2)}
          </div>
          {record.discount > 0 && (
            <div style={{ fontSize: '12px', color: '#fa8c16' }}>
              Given: ₹{(record.discount || 0).toFixed(2)}
            </div>
          )}
          <div style={{ fontWeight: 'bold', color: '#8b4513' }}>
            Sold: ₹{(record.total || 0).toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
      render: (method) => (
        <Tag color="purple">{method || 'Cash'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {(status || 'completed').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Invoice">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewInvoice(record)}
              type="primary"
              style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
            />
          </Tooltip>
          <Tooltip title="Print">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => handlePrintInvoice(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading pottery invoices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Pottery Invoices"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
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
            🏺
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Mitti Arts Invoices
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Pottery Sales & Customer Transactions
            </Text>
          </div>
        </div>
        <div style={{ fontSize: '32px', opacity: 0.3 }}>📄</div>
      </div>

      {/* Summary Cards - Business Perspective */}
      {summary && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Pottery Invoices (30 days)"
                value={summary.totalInvoices}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#8b4513' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Pottery Revenue"
                value={summary.totalRevenue}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#228b22' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Customer Discounts"
                value={summary.totalDiscountGiven}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Value provided to pottery customers
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Avg Pottery Order"
                value={summary.averageOrderValue}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#cd853f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#8b4513' }}>
              Pottery Sales Invoices ({filteredInvoices.length})
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                style={{ borderColor: '#8b4513', color: '#8b4513' }}
              >
                Refresh
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                disabled={filteredInvoices.length === 0}
                style={{ borderColor: '#8b4513', color: '#8b4513' }}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Search pottery invoices..."
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleSearch('');
                }
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <RangePicker
              onChange={handleDateFilter}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              onChange={handleStatusFilter}
              value={filters.status}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">All Status</Option>
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Payment"
              onChange={handlePaymentMethodFilter}
              value={filters.paymentMethod}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">All Methods</Option>
              <Option value="Cash">Cash</Option>
              <Option value="Card">Card</Option>
              <Option value="UPI">UPI</Option>
              <Option value="Bank Transfer">Bank Transfer</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Text type="secondary">
              Showing {filteredInvoices.length} of {orders.length} pottery invoices
            </Text>
          </Col>
        </Row>

        {/* Table */}
        {filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>🏺</div>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {orders.length === 0 ? 'No pottery invoices found' : 'No pottery invoices match your filters'}
            </Text>
            <br />
            <Text type="secondary">
              {orders.length === 0 ? 'Create your first pottery invoice by going to Billing' : 'Try adjusting your search criteria'}
            </Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredInvoices}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} pottery invoices`,
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
            summary={(pageData) => {
              const pageTotal = pageData.reduce((sum, record) => sum + (record.total || 0), 0);
              const pageDiscount = pageData.reduce((sum, record) => sum + (record.discount || 0), 0);
              
              return (
                <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Page Total:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#fa8c16' }}>
                        Discount: ₹{pageDiscount.toFixed(2)}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#8b4513' }}>
                        Revenue: ₹{pageTotal.toFixed(2)}
                      </div>
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={3} />
                </Table.Summary.Row>
              );
            }}
          />
        )}
      </Card>

      {/* Pottery Business Tips */}
      <Card 
        title={
          <Space>
            <span>💡</span>
            <Text strong>Pottery Business Tips</Text>
          </Space>
        } 
        style={{ marginTop: 16 }}
        bodyStyle={{ backgroundColor: '#f9f9f9' }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '20px', marginBottom: 8 }}>🏺</div>
              <Text strong>Quality Craftsmanship</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Focus on unique, handcrafted pottery pieces
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '20px', marginBottom: 8 }}>📱</div>
              <Text strong>Digital Invoicing</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Modern billing for traditional pottery art
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '20px', marginBottom: 8 }}>🎨</div>
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

export default InvoiceList;