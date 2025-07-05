// src/components/billing/OrderSummary.js - Fixed version with working stats
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, Typography, Spin, Statistic, Alert } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  CalendarOutlined,
  RiseOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

const OrderSummary = () => {
  const { items: orders, loading: isLoading, error } = useSelector(state => state.orders);

  // Memoized calculations for better performance
  const summaryData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        totalDiscount: 0,
        dailySales: [],
        ordersByStatus: [],
        topCustomers: [],
        monthlyTrend: []
      };
    }

    // Filter valid orders (exclude cancelled)
    const validOrders = orders.filter(order => order.status !== 'cancelled');
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // Calculate basic metrics
    const totalSales = validOrders.reduce((total, order) => total + (order.total || 0), 0);
    const totalOrders = validOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalDiscount = validOrders.reduce((total, order) => total + (order.discount || 0), 0);

    // Order counts by status
    const orderCounts = {
      completed: orders.filter(order => order.status === 'completed').length,
      pending: orders.filter(order => order.status === 'pending').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };

    // Daily sales data (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const dayOrders = validOrders.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        return orderDate.isSame(date, 'day');
      });
      
      const dayTotal = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      last7Days.push({
        date: date.format('MMM DD'),
        fullDate: date.format('YYYY-MM-DD'),
        sales: dayTotal,
        orders: dayOrders.length
      });
    }

    // Orders by status for pie chart
    const ordersByStatus = [
      { name: 'Completed', value: orderCounts.completed, color: '#52c41a' },
      { name: 'Pending', value: orderCounts.pending, color: '#faad14' },
      { name: 'Cancelled', value: orderCounts.cancelled, color: '#f5222d' }
    ].filter(item => item.value > 0);

    // Top customers (if customer data available)
    const customerSales = {};
    validOrders.forEach(order => {
      if (order.customer?.name) {
        const customerName = order.customer.name;
        if (!customerSales[customerName]) {
          customerSales[customerName] = { name: customerName, sales: 0, orders: 0 };
        }
        customerSales[customerName].sales += order.total || 0;
        customerSales[customerName].orders += 1;
      }
    });

    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = moment().subtract(i, 'months');
      const monthOrders = validOrders.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        return orderDate.isSame(month, 'month');
      });
      
      const monthTotal = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      monthlyTrend.push({
        month: month.format('MMM YY'),
        sales: monthTotal,
        orders: monthOrders.length
      });
    }

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      completedOrders: orderCounts.completed,
      pendingOrders: orderCounts.pending,
      cancelledOrders: orderCounts.cancelled,
      totalDiscount,
      dailySales: last7Days,
      ordersByStatus,
      topCustomers,
      monthlyTrend
    };
  }, [orders]);

  if (error) {
    return (
      <Alert
        message="Error Loading Sales Summary"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: 24 }}
      />
    );
  }

  if (isLoading) {
    return (
      <Card title="Sales Summary" style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" tip="Loading sales summary..." />
        </div>
      </Card>
    );
  }

  const COLORS = ['#52c41a', '#faad14', '#f5222d', '#1890ff', '#722ed1'];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={summaryData.totalSales}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Revenue generated
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={summaryData.totalOrders}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              {summaryData.completedOrders} completed, {summaryData.pendingOrders} pending
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Order Value"
              value={summaryData.averageOrderValue}
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              suffix="₹"
              precision={2}
              valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Per order average
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Discounts"
              value={summaryData.totalDiscount}
              prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
              suffix="₹"
              precision={2}
              valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Customer savings
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        {/* Daily Sales Trend */}
        <Col xs={24} lg={16}>
          <Card title="Daily Sales Trend (Last 7 Days)" size="small">
            {summaryData.dailySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summaryData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'sales' ? `₹${value.toLocaleString()}` : value,
                      name === 'sales' ? 'Sales' : 'Orders'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#52c41a" 
                    strokeWidth={3}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                    name="Sales (₹)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    dot={{ fill: '#1890ff', strokeWidth: 2, r: 3 }}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <CalendarOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>No sales data available</div>
              </div>
            )}
          </Card>
        </Col>

        {/* Orders by Status */}
        <Col xs={24} lg={8}>
          <Card title="Orders by Status" size="small">
            {summaryData.ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={summaryData.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {summaryData.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <ShoppingCartOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>No order data available</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Additional Analytics */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Monthly Trend */}
        <Col xs={24} lg={12}>
          <Card title="Monthly Sales Trend (Last 6 Months)" size="small">
            {summaryData.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={summaryData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'sales' ? `₹${value.toLocaleString()}` : value,
                      name === 'sales' ? 'Sales' : 'Orders'
                    ]}
                  />
                  <Bar dataKey="sales" fill="#52c41a" name="Sales (₹)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <CalendarOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>No monthly data available</div>
              </div>
            )}
          </Card>
        </Col>

        {/* Top Customers */}
        <Col xs={24} lg={12}>
          <Card title="Top Customers" size="small">
            {summaryData.topCustomers.length > 0 ? (
              <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                {summaryData.topCustomers.map((customer, index) => (
                  <div 
                    key={customer.name}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: index < summaryData.topCustomers.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        {customer.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {customer.orders} order{customer.orders !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
                        ₹{customer.sales.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <ShoppingCartOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>No customer data available</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Insights */}
      {summaryData.totalOrders > 0 && (
        <Card title="Quick Insights" size="small" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Text type="secondary">Success Rate:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                {((summaryData.completedOrders / summaryData.totalOrders) * 100).toFixed(1)}%
              </div>
            </Col>
            <Col span={8}>
              <Text type="secondary">Avg Discount per Order:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                ₹{(summaryData.totalDiscount / summaryData.totalOrders).toFixed(2)}
              </div>
            </Col>
            <Col span={8}>
              <Text type="secondary">Revenue per Day:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                ₹{(summaryData.totalSales / 7).toFixed(2)}
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default OrderSummary;