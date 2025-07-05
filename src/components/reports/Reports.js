// src/components/reports/Reports.js - Mitti Arts pottery business reports
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Button, 
  DatePicker, 
  Space, 
  Statistic, 
  Divider, 
  Alert, 
  Spin,
  message
} from 'antd';
import {
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  WarningOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons';
import { 
  generateSalesReport,
  generateInventoryReport,
  generateCustomerReport,
  generateExpenseReport,
  generateProfitLossReport,
  clearReport
} from '../../features/reports/reportSlice';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  return (
    <Card style={{ border: '1px solid #8b4513' }}>
      <Statistic
        title={title}
        value={value}
        prefix={<Icon style={{ color }} />}
        suffix={change && (
          <span style={{ color, fontSize: 14 }}>
            {changeType === 'increase' ? <RiseOutlined /> : <FallOutlined />}
            {change}
          </span>
        )}
      />
    </Card>
  );
};

const Reports = () => {
  const dispatch = useDispatch();
  const { reportData, loading, error, reportType } = useSelector(state => state.reports);

  const [dates, setDates] = useState([
    new Date(new Date().setMonth(new Date().getMonth() - 1)),
    new Date()
  ]);
  const [activeReport, setActiveReport] = useState('sales');

  const loadReport = useCallback(() => {
    const [startDate, endDate] = dates;
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    dispatch(clearReport());

    switch (activeReport) {
      case 'sales':
        dispatch(generateSalesReport(params));
        break;
      case 'inventory':
        dispatch(generateInventoryReport());
        break;
      case 'customers':
        dispatch(generateCustomerReport(params));
        break;
      case 'expenses':
        dispatch(generateExpenseReport(params));
        break;
      case 'profit-loss':
        dispatch(generateProfitLossReport(params));
        break;
      default:
        break;
    }
  }, [dispatch, activeReport, dates]);

  useEffect(() => {
    loadReport();
  }, [activeReport, loadReport]);

  const onDateChange = (datesValue) => {
    if (!datesValue || datesValue.length !== 2) return;
    setDates([datesValue[0].toDate(), datesValue[1].toDate()]);
  };

  useEffect(() => {
    loadReport();
  }, [dates, loadReport]);

  const reportButtons = [
    { key: 'sales', label: 'Pottery Sales', icon: RiseOutlined, color: '#8b4513' },
    { key: 'inventory', label: 'Inventory Report', icon: AppstoreOutlined, color: '#cd853f' },
    { key: 'customers', label: 'Customer Report', icon: UserOutlined, color: '#daa520' },
    { key: 'expenses', label: 'Clay & Materials', icon: BankOutlined, color: '#b8860b' },
    { key: 'profit-loss', label: 'Profit & Loss', icon: BarChartOutlined, color: '#228b22' }
  ];

  const POTTERY_COLORS = ['#8b4513', '#cd853f', '#daa520', '#b8860b', '#228b22', '#ff6347', '#9932cc'];

  // --- Sales Report ---
  const renderSalesReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No pottery sales data available for the selected period</Text>;
    }

    const totalSales = reportData.reduce((sum, item) => sum + item.totalSales, 0);
    const totalOrders = reportData.reduce((sum, item) => sum + item.orderCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Total Pottery Sales"
              value={`₹${totalSales.toLocaleString()}`}
              change="+12.5%"
              changeType="increase"
              icon={DollarOutlined}
              color="#8b4513"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Total Orders"
              value={totalOrders.toLocaleString()}
              change="+8.3%"
              changeType="increase"
              icon={ShoppingOutlined}
              color="#cd853f"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Avg Order Value"
              value={`₹${avgOrderValue.toLocaleString()}`}
              change="+4.1%"
              changeType="increase"
              icon={RiseOutlined}
              color="#daa520"
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Pottery Sales Trend Over Time</Title>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={reportData}>
              <defs>
                <linearGradient id="colorPotterySales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b4513" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b4513" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="totalSales" stroke="#8b4513" fillOpacity={1} fill="url(#colorPotterySales)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  // --- Inventory Report ---
  const renderInventoryReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No pottery inventory data available</Text>;
    }

    const totalValue = reportData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalItems = reportData.reduce((sum, item) => sum + item.itemCount, 0);
    const lowStockItems = reportData.reduce((sum, item) => sum + item.lowStockItems, 0);

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Total Pottery Value"
              value={`₹${totalValue.toLocaleString()}`}
              icon={DollarOutlined}
              color="#8b4513"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Total Pottery Items"
              value={totalItems.toLocaleString()}
              icon={ShoppingCartOutlined}
              color="#cd853f"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Low Stock Items"
              value={lowStockItems.toString()}
              change={lowStockItems > 0 ? "Restock Required" : "All Good"}
              changeType={lowStockItems > 0 ? "decrease" : "increase"}
              icon={WarningOutlined}
              color={lowStockItems > 0 ? "#fa541c" : "#52c41a"}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Card>
              <Title level={4}>Pottery Inventory by Category</Title>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="itemCount" fill="#8b4513" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Title level={4}>Pottery Distribution</Title>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={reportData}
                    dataKey="totalValue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={POTTERY_COLORS[index % POTTERY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  // --- Customer Report ---
  const renderCustomerReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No customer data available for the selected period</Text>;
    }

    const totalCustomers = reportData.totalCustomers || 0;
    const newCustomers = reportData.newCustomers || 0;
    const returningCustomers = reportData.returningCustomers || 0;

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Total Pottery Customers"
              value={totalCustomers}
              icon={TeamOutlined}
              color="#8b4513"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="New Customers"
              value={newCustomers}
              icon={UserOutlined}
              color="#cd853f"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Returning Customers"
              value={returningCustomers}
              icon={UserOutlined}
              color="#daa520"
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Pottery Customer Growth Over Time</Title>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.customerGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newCustomers" stroke="#8b4513" name="New Customers" />
              <Line type="monotone" dataKey="returningCustomers" stroke="#cd853f" name="Returning Customers" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  // --- Expense Report ---
  const renderExpenseReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No clay & materials expense data available for the selected period</Text>;
    }

    const totalExpenses = reportData.reduce((sum, item) => sum + item.amount, 0);
    const expenseByCategory = reportData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

    const expenseDataForPie = Object.entries(expenseByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <StatCard
              title="Total Clay & Materials Expenses"
              value={`₹${totalExpenses.toLocaleString()}`}
              icon={MoneyCollectOutlined}
              color="#8b4513"
            />
          </Col>
          <Col span={12}>
            <StatCard
              title="Expense Categories"
              value={Object.keys(expenseByCategory).length}
              icon={BankOutlined}
              color="#cd853f"
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Clay & Materials Expenses by Category</Title>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={expenseDataForPie}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label
              >
                {expenseDataForPie.map((entry, index) => (
                  <Cell key={`cell-expense-${index}`} fill={POTTERY_COLORS[index % POTTERY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  // --- Profit & Loss Report ---
  const renderProfitLossReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No pottery business profit & loss data available</Text>;
    }

    const totalRevenue = reportData.totalRevenue || 0;
    const totalCost = reportData.totalCost || 0;
    const profitLoss = totalRevenue - totalCost;

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Pottery Revenue"
              value={`₹${totalRevenue.toLocaleString()}`}
              icon={DollarOutlined}
              color="#228b22"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Clay & Materials Cost"
              value={`₹${totalCost.toLocaleString()}`}
              icon={MoneyCollectOutlined}
              color="#8b4513"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Net Profit / Loss"
              value={`₹${profitLoss.toLocaleString()}`}
              icon={profitLoss >= 0 ? RiseOutlined : FallOutlined}
              color={profitLoss >= 0 ? '#228b22' : '#fa541c'}
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Pottery Business: Revenue vs Cost Over Time</Title>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.overTime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalRevenue" stroke="#228b22" name="Pottery Revenue" />
              <Line type="monotone" dataKey="totalCost" stroke="#8b4513" name="Clay & Materials Cost" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" tip="Loading pottery business report..." />
        </div>
      );
    }
    if (error) {
      message.error(error);
      return <Alert message="Error loading pottery report" type="error" showIcon />;
    }
    switch (activeReport) {
      case 'sales': return renderSalesReport();
      case 'inventory': return renderInventoryReport();
      case 'customers': return renderCustomerReport();
      case 'expenses': return renderExpenseReport();
      case 'profit-loss': return renderProfitLossReport();
      default: return null;
    }
  };

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
              Mitti Arts Reports
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Pottery Business Analytics & Insights
            </Text>
          </div>
        </div>
        <div style={{ fontSize: '32px', opacity: 0.3 }}>📊</div>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        {reportButtons.map(({ key, label, icon: Icon, color }) => (
          <Button
            key={key}
            type={activeReport === key ? 'primary' : 'default'}
            icon={<Icon />}
            onClick={() => setActiveReport(key)}
            style={{
              backgroundColor: activeReport === key ? color : undefined,
              borderColor: activeReport === key ? color : undefined,
              color: activeReport === key ? 'white' : color
            }}
          >
            {label}
          </Button>
        ))}
      </Space>

      {(activeReport === 'sales' || activeReport === 'customers' || activeReport === 'expenses') && (
        <div style={{ marginBottom: 24 }}>
          <Card size="small">
            <Space align="center">
              <Text strong>📅 Select Date Range:</Text>
              <RangePicker
                defaultValue={[dates[0], dates[1]]}
                onChange={onDateChange}
                allowClear={false}
              />
              <Text type="secondary">
                Analyze your pottery business performance over time
              </Text>
            </Space>
          </Card>
        </div>
      )}

      {/* Report Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px' }}>
        {renderReport()}
      </div>

      {/* Pottery Business Insights */}
      {reportData && !loading && (
        <Card 
          title={
            <Space>
              <span>🎯</span>
              <Text strong>Pottery Business Insights</Text>
            </Space>
          } 
          style={{ marginTop: 16 }}
          bodyStyle={{ backgroundColor: '#f9f9f9' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '24px', marginBottom: 8 }}>🏺</div>
                <Text strong>Handcrafted Excellence</Text>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  Focus on unique, artisanal pottery pieces
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '24px', marginBottom: 8 }}>🌱</div>
                <Text strong>Sustainable Clay</Text>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  Eco-friendly materials and processes
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '24px', marginBottom: 8 }}>🎨</div>
                <Text strong>Custom Artistry</Text>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  Personalized pottery for every customer
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default Reports;