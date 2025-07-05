// src/components/billing/OrderList.js - Updated version with working summary
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Button,
  Tag,
  Spin,
  Row,
  Col,
  Typography,
  Space,
  Popconfirm,
  message,
  Input,
  Alert,
} from 'antd';
import { 
  EyeOutlined, 
  CloseCircleOutlined, 
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { fetchOrders, cancelOrder } from '../../features/order/orderSlice';
import OrderSummary from './OrderSummary';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: orders = [], total = 0, loading: isLoading, error } = useSelector(state => state.orders);

  const [filters, setFilters] = useState({
    dates: [],
    status: '',
    search: '',
    page: 1,
    pageSize: 10
  });

  // Fetch orders when component mounts or filters change
  const fetchOrdersData = useCallback(() => {
    const [startDate, endDate] = filters.dates;
    const params = {
      page: filters.page,
      limit: filters.pageSize,
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
    };
    
    console.log('Fetching orders with params:', params);
    dispatch(fetchOrders(params));
  }, [dispatch, filters]);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  const handleView = (id) => {
    navigate(`/invoices/${id}`);
  };

  const handleCancel = async (id) => {
    try {
      const result = await dispatch(cancelOrder(id));
      if (cancelOrder.fulfilled.match(result)) {
        message.success('Order cancelled successfully');
        fetchOrdersData(); // Refresh the list
      } else {
        message.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      message.error('Error cancelling order');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleTableChange = (pagination) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize
    }));
  };

  const handleRefresh = () => {
    fetchOrdersData();
    message.success('Orders refreshed');
  };

  const handleExport = () => {
    try {
      // Simple CSV export
      const csvData = orders.map(order => ({
        'Order Number': order.orderNumber,
        'Date': moment(order.createdAt?.toDate?.() || order.createdAt).format('YYYY-MM-DD'),
        'Customer': order.customer?.name || 'Walk-in Customer',
        'Total Amount': order.total || 0,
        'Status': order.status,
        'Payment Method': order.paymentMethod || 'Cash'
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
      a.download = `orders-${moment().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      message.success('Orders exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export failed');
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'completed': { color: 'green', text: 'Completed' },
      'pending': { color: 'orange', text: 'Pending' },
      'cancelled': { color: 'red', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => {
        if (!date) return 'N/A';
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
      sorter: (a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateA - dateB;
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>
            {record.customer?.name || 'Walk-in Customer'}
          </div>
          {record.customer?.phone && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.customer.phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      align: 'center',
      render: (items) => (
        <Tag color="blue">{items?.length || 0}</Tag>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (value) => (
        <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
          ₹{(value || 0).toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
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
      width: 100,
      render: getStatusTag,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
            type="primary"
            size="small"
            title="View Invoice"
          />
          {record.status === 'pending' && (
            <Popconfirm
              title="Cancel Order"
              description="Are you sure you want to cancel this order? This action cannot be undone."
              onConfirm={() => handleCancel(record.id)}
              okText="Yes, Cancel"
              cancelText="No"
              okType="danger"
              placement="topRight"
            >
              <Button
                icon={<CloseCircleOutlined />}
                danger
                size="small"
                title="Cancel Order"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Orders"
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
    <div style={{ padding: 24 }}>
      {/* Sales Summary Component */}
      <OrderSummary />

      {/* Orders Table */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Orders ({orders.length})
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoading}
              >
                Refresh
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                disabled={orders.length === 0}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dates}
              onChange={(dates) => handleFilterChange('dates', dates || [])}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={8} md={4}>
            <Text type="secondary">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </Text>
          </Col>
        </Row>

        {/* Orders Table */}
        {orders.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}>📋</div>
            <Title level={4} type="secondary">No orders found</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {filters.search || filters.status || filters.dates.length > 0
                ? 'Try adjusting your filters'
                : 'Orders will appear here once customers start placing them'}
            </Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total: total || orders.length,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['5', '10', '25', '50'],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} orders`,
              onChange: handleTableChange,
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
            bordered
          />
        )}
      </Card>
    </div>
  );
};

export default OrderList;