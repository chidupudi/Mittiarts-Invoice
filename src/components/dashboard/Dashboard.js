// src/components/dashboard/Dashboard.js - Fixed Mitti Arts pottery business dashboard
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Spin, 
  Table,
  Tag,
  Space,
  Divider,
  Button,
  Tooltip,
  Alert,
  Select,
  DatePicker
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ProductOutlined,
  MoneyCollectOutlined,
  ExclamationOutlined,
  LineChartOutlined,
  PieChartOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { fetchOrders } from '../../features/order/orderSlice';
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customer/customerSlice';

import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const StatCard = ({ title, value, icon, color, trend, trendValue, prefix, suffix, warning }) => {
  const trendColor = trend === 'up' ? '#3f8600' : '#cf1322';
  
  return (
    <Card hoverable style={{ border: '1px solid #8b4513', borderRadius: '8px' }}>
      <Space direction="horizontal" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Statistic
            title={
              <Space>
                {title}
                {warning && (
                  <Tooltip title={warning}>
                    <InfoCircleOutlined style={{ color: '#faad14' }} />
                  </Tooltip>
                )}
              </Space>
            }
            value={value}
            prefix={prefix || icon}
            suffix={suffix}
            valueStyle={{ color }}
          />
        </div>
        {trend && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {trend === 'up' ? (
              <ArrowUpOutlined style={{ color: trendColor, fontSize: '16px' }} />
            ) : (
              <ArrowDownOutlined style={{ color: trendColor, fontSize: '16px' }} />
            )}
            <Text style={{ color: trendColor, fontSize: '12px', fontWeight: 'bold' }}>
              {trendValue}
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  
  const { items: orders = [], loading: ordersLoading } = useSelector(state => state.orders);
  const { items: products = [], loading: productsLoading } = useSelector(state => state.products);
  const { items: customers = [], loading: customersLoading } = useSelector(state => state.customers);

  const [dateFilter, setDateFilter] = useState('week'); // week, 2weeks, month
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalProfit: 0,
    profitMargin: 0,
    costAnalysis: { withCost: 0, withoutCost: 0 },
    salesData: [],
    topProducts: [],
    recentOrders: [],
    profitData: [],
    categoryBreakdown: [],
    branchPerformance: []
  });

  useEffect(() => {
    // Load all data
    dispatch(fetchOrders({}));
    dispatch(fetchProducts({}));
    dispatch(fetchCustomers({}));
  }, [dispatch]);

  useEffect(() => {
    // Calculate dashboard metrics when data changes
    if (orders.length || products.length || customers.length) {
      calculateDashboardData();
    }
  }, [orders, products, customers, dateFilter]);

  const getDateRange = () => {
    const now = moment();
    let startDate;
    
    switch (dateFilter) {
      case 'week':
        startDate = now.clone().subtract(7, 'days');
        break;
      case '2weeks':
        startDate = now.clone().subtract(14, 'days');
        break;
      case 'month':
        startDate = now.clone().subtract(30, 'days');
        break;
      default:
        startDate = now.clone().subtract(7, 'days');
    }
    
    return { startDate, endDate: now };
  };

  const calculateDashboardData = () => {
    const { startDate, endDate } = getDateRange();
    
    // Filter orders for the selected period
    const filteredOrders = orders.filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
      return orderDate.isBetween(startDate, endDate, null, '[]');
    });

    // Calculate total sales and orders
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    
    // Calculate cost analysis
    const costAnalysis = analyzeCostPrices();
    
    // Calculate total cost of goods sold and profit
    const totalCostOfGoods = calculateCostOfGoods(filteredOrders);
    const grossProfit = totalSales - totalCostOfGoods;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    // Low stock products (stock <= 5 for pottery)
    const lowStockProducts = products.filter(product => product.stock <= 5).length;

    // Sales data for chart
    const salesData = generateSalesData(filteredOrders, startDate, endDate);
    
    // Profit data for chart
    const profitData = generateProfitData(filteredOrders, startDate, endDate);
    
    // Top products by sales
    const topProducts = getTopProducts(filteredOrders);

    // Recent orders (last 5)
    const recentOrders = [...filteredOrders]
      .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt))
      .slice(0, 5);

    // Category breakdown for pottery business
    const categoryBreakdown = getCategoryBreakdown();

    // Branch performance analysis
    const branchPerformance = getBranchPerformance(filteredOrders);

    setDashboardData({
      totalSales,
      totalOrders,
      totalCustomers: customers.length,
      totalProducts: products.length,
      lowStockProducts,
      totalProfit: grossProfit,
      profitMargin,
      costAnalysis,
      salesData,
      topProducts,
      recentOrders,
      profitData,
      categoryBreakdown,
      branchPerformance
    });
  };

  const analyzeCostPrices = () => {
    const withCost = products.filter(product => product.costPrice && product.costPrice > 0).length;
    const withoutCost = products.filter(product => !product.costPrice || product.costPrice <= 0).length;
    
    return { withCost, withoutCost, total: products.length };
  };

  const calculateCostOfGoods = (ordersList) => {
    let totalCost = 0;
    
    ordersList.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.product?.id || p.id === item.productId);
          if (product && product.costPrice) {
            totalCost += product.costPrice * item.quantity;
          } else if (product) {
            // If no cost price, estimate at 60% of selling price for pottery
            totalCost += (item.price * 0.6) * item.quantity;
          }
        });
      }
    });
    
    return totalCost;
  };

  const generateSalesData = (ordersList, start, end) => {
    const days = [];
    const current = start.clone();
    
    while (current.isSameOrBefore(end, 'day')) {
      const dayOrders = ordersList.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        return orderDate.isSame(current, 'day');
      });
      
      const dayTotal = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const dayCount = dayOrders.length;
      
      days.push({
        date: current.format('MMM DD'),
        sales: dayTotal,
        orders: dayCount,
        fullDate: current.format('YYYY-MM-DD')
      });
      
      current.add(1, 'day');
    }
    
    return days;
  };

  const generateProfitData = (ordersList, start, end) => {
    const days = [];
    const current = start.clone();
    
    while (current.isSameOrBefore(end, 'day')) {
      const dayOrders = ordersList.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        return orderDate.isSame(current, 'day');
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const dayCost = calculateCostOfGoods(dayOrders);
      const dayProfit = dayRevenue - dayCost;
      
      days.push({
        date: current.format('MMM DD'),
        revenue: dayRevenue,
        cost: dayCost,
        profit: dayProfit,
        fullDate: current.format('YYYY-MM-DD')
      });
      
      current.add(1, 'day');
    }
    
    return days;
  };

  const getTopProducts = (ordersList) => {
    const productSales = {};
    
    ordersList.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const productId = item.product?.id || item.productId;
          const productName = item.product?.name || 'Unknown Product';
          
          if (!productSales[productId]) {
            productSales[productId] = {
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          
          productSales[productId].quantity += item.quantity || 0;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getCategoryBreakdown = () => {
    const categoryData = {};
    
    products.forEach(product => {
      const category = product.category || 'Other';
      if (!categoryData[category]) {
        categoryData[category] = {
          name: category,
          count: 0,
          value: 0,
          emoji: getCategoryEmoji(category)
        };
      }
      categoryData[category].count += 1;
      categoryData[category].value += product.stock || 0;
    });

    return Object.values(categoryData);
  };

  const getBranchPerformance = (ordersList) => {
    const branchData = {};
    
    ordersList.forEach(order => {
      const branch = order.branch || 'main_showroom';
      const branchName = getBranchName(branch);
      
      if (!branchData[branch]) {
        branchData[branch] = {
          name: branchName,
          orders: 0,
          revenue: 0,
          branch: branch
        };
      }
      
      branchData[branch].orders += 1;
      branchData[branch].revenue += order.total || 0;
    });

    return Object.values(branchData);
  };

  const getBranchName = (branchId) => {
    const branchNames = {
      'main_showroom': 'Main Showroom',
      'pottery_workshop': 'Pottery Workshop',
      'export_unit': 'Export Unit'
    };
    return branchNames[branchId] || 'Unknown Branch';
  };

  const getCategoryEmoji = (category) => {
    const categoryMap = {
      'Pottery': '🏺',
      'Terracotta': '🟫',
      'Clay Art': '🎨',
      'Decorative Items': '✨',
      'Garden Pottery': '🌱',
      'Kitchen Pottery': '🍽️',
      'Gifts & Souvenirs': '🎁',
      'Custom Orders': '🛠️'
    };
    return categoryMap[category] || '🏺';
  };

  const isLoading = ordersLoading || productsLoading || customersLoading;

  const recentOrdersColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `#${id.slice(-6)}`
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (text) => text || 'Walk-in Customer'
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      render: (branch) => (
        <Tag color="#8b4513">
          {getBranchName(branch)}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => moment(date?.toDate?.() || date).format('DD/MM/YY')
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'amount',
      render: (amount) => `₹${amount?.toLocaleString() || 0}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'blue'}>
          {status?.toUpperCase()}
        </Tag>
      )
    }
  ];

  const COLORS = ['#8b4513', '#cd853f', '#daa520', '#b8860b', '#228b22', '#ff6347', '#9932cc', '#2f4f4f'];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading Mitti Arts dashboard..." />
      </div>
    );
  }

  const costWarning = dashboardData.costAnalysis.withoutCost > 0 
    ? `${dashboardData.costAnalysis.withoutCost} pottery items missing cost price. Profit calculations may be estimated.`
    : null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#fafafa' }}>
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
              Mitti Arts Dashboard
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Handcrafted Pottery & Terracotta Business Overview
            </Text>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Time Period:</Text>
          <br />
          <Select value={dateFilter} onChange={setDateFilter} style={{ width: 120 }}>
            <Option value="week">1 Week</Option>
            <Option value="2weeks">2 Weeks</Option>
            <Option value="month">1 Month</Option>
          </Select>
        </div>
      </div>

      {/* Cost Price Warning */}
      {costWarning && (
        <Alert
          message="Cost Price Information"
          description={costWarning}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="link">
              Manage Products
            </Button>
          }
        />
      )}
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Pottery Sales"
            value={dashboardData.totalSales.toFixed(2)}
            prefix="₹"
            icon={<MoneyCollectOutlined />}
            color="#8b4513"
            trend="up"
            trendValue="12%"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Net Profit"
            value={dashboardData.totalProfit.toFixed(2)}
            prefix="₹"
            icon={<TrophyOutlined />}
            color={dashboardData.totalProfit >= 0 ? "#3f8600" : "#cf1322"}
            trend={dashboardData.totalProfit >= 0 ? "up" : "down"}
            trendValue={`${dashboardData.profitMargin.toFixed(1)}%`}
            warning={costWarning}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Orders"
            value={dashboardData.totalOrders}
            icon={<ShoppingCartOutlined />}
            color="#cd853f"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Customers"
            value={dashboardData.totalCustomers}
            icon={<UserOutlined />}
            color="#daa520"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Pottery Items"
            value={dashboardData.totalProducts}
            icon={<ProductOutlined />}
            color="#b8860b"
            warning={costWarning}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Low Stock"
            value={dashboardData.lowStockProducts}
            icon={<ExclamationOutlined />}
            color="#faad14"
            trend="down"
            trendValue="5%"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Profit Margin"
            value={dashboardData.profitMargin.toFixed(1)}
            suffix="%"
            icon={<DollarOutlined />}
            color={dashboardData.profitMargin >= 20 ? "#3f8600" : dashboardData.profitMargin >= 10 ? "#faad14" : "#f5222d"}
            warning={costWarning}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Active Branches"
            value={dashboardData.branchPerformance.length}
            icon={<LineChartOutlined />}
            color="#228b22"
          />
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Large Sales Chart */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <LineChartOutlined />
                <Text strong>Sales & Profit Trend ({dateFilter === 'week' ? 'Last 7 Days' : dateFilter === '2weeks' ? 'Last 14 Days' : 'Last 30 Days'})</Text>
              </Space>
            }
            style={{ height: '420px' }}
          >
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.profitData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b4513" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b4513" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#228b22" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#228b22" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b4513"
                    fillOpacity={1} 
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#228b22"
                    fillOpacity={1} 
                    fill="url(#colorProfit)"
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <PieChartOutlined />
                <Text strong>Branch Performance</Text>
              </Space>
            }
            style={{ height: '420px' }}
          >
            <div style={{ height: '320px' }}>
              {dashboardData.branchPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.branchPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {dashboardData.branchPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value, name) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%' 
                }}>
                  <Text type="secondary">No branch data available</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Cost Analysis and Recent Orders */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                <Text strong>Clay Material Cost Analysis</Text>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="With Cost Price"
                  value={dashboardData.costAnalysis.withCost}
                  valueStyle={{ color: '#228b22' }}
                  suffix={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      pottery items
                    </div>
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Missing Cost Price"
                  value={dashboardData.costAnalysis.withoutCost}
                  valueStyle={{ color: '#faad14' }}
                  suffix={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      pottery items
                    </div>
                  }
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                Pottery items with cost price enable accurate profit calculations. 
                Missing cost prices are estimated at 60% of selling price.
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <HistoryOutlined />
                <Text strong>Recent Pottery Orders</Text>
              </Space>
            }
          >
            <Table
              columns={recentOrdersColumns}
              dataSource={dashboardData.recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No recent pottery orders'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Category Breakdown */}
      {dashboardData.categoryBreakdown.length > 0 && (
        <Card title="Pottery Collection Overview" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            {dashboardData.categoryBreakdown.map((category, index) => (
              <Col xs={12} sm={8} md={6} lg={4} xl={3} key={category.name}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: 8 }}>{category.emoji}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: 4 }}>
                    {category.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {category.count} items
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {category.value} in stock
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Branch Performance Details */}
      {dashboardData.branchPerformance.length > 0 && (
        <Card title="Branch Performance Details" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            {dashboardData.branchPerformance.map((branch, index) => (
              <Col xs={24} sm={8} key={branch.branch}>
                <Card size="small" style={{ textAlign: 'center', border: `2px solid ${COLORS[index % COLORS.length]}` }}>
                  <Title level={5} style={{ margin: 0, color: COLORS[index % COLORS.length] }}>
                    {branch.name}
                  </Title>
                  <Row gutter={8} style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <Statistic
                        title="Orders"
                        value={branch.orders}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Revenue"
                        value={branch.revenue}
                        prefix="₹"
                        formatter={(value) => `${(value / 1000).toFixed(1)}k`}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Quick Insights */}
      {dashboardData.totalOrders > 0 && (
        <Card title="Business Insights" size="small" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Text type="secondary">Order Success Rate:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#228b22' }}>
                {((dashboardData.totalOrders / (dashboardData.totalOrders + 0)) * 100).toFixed(1)}%
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Avg Order Value:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                ₹{dashboardData.totalOrders > 0 ? (dashboardData.totalSales / dashboardData.totalOrders).toFixed(2) : '0.00'}
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Revenue per Day:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b4513' }}>
                ₹{(dashboardData.totalSales / 7).toFixed(2)}
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Top Performing Branch:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                {dashboardData.branchPerformance.length > 0 ? 
                  dashboardData.branchPerformance.sort((a, b) => b.revenue - a.revenue)[0].name : 'N/A'}
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;