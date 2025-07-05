// src/components/expense/ExpenseSummary.js - Fixed version
import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Row, Col, Space, Empty } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const { Title, Text } = Typography;

const ExpenseSummary = () => {
  const { summary = [], items: expenses = [] } = useSelector(state => state.expenses);

  // Calculate totals
  const totalExpense = summary.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Prepare data for charts
  const pieData = summary.map(item => ({
    name: item._id || item.category || 'Unknown',
    value: item.total || 0,
    count: item.count || 0
  }));

  const barData = summary.map(item => ({
    category: item._id || item.category || 'Unknown',
    amount: item.total || 0,
    count: item.count || 0,
    average: item.count > 0 ? (item.total / item.count) : 0
  }));

  // Colors for the charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
    '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c',
    '#87d068', '#d084d0'
  ];

  const pieConfig = {
    data: pieData,
    cx: '50%',
    cy: '50%',
    labelLine: false,
    label: ({ name, percent }) => percent > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : '',
    outerRadius: 80,
    fill: '#8884d8',
    dataKey: 'value',
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name || data.category}</p>
          <p style={{ margin: 0, color: '#1890ff' }}>
            Amount: ₹{(data.value || data.amount || 0).toLocaleString()}
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            Expenses: {data.count || 0}
          </p>
          {data.average && (
            <p style={{ margin: 0, color: '#52c41a' }}>
              Avg: ₹{data.average.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!summary || summary.length === 0) {
    return (
      <Card>
        <Title level={4}>Expense Summary</Title>
        <Empty 
          description="No expense data available" 
          style={{ padding: '40px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>Expense Summary</Title>

      <Row gutter={[24, 24]}>
        {/* Summary Statistics */}
        <Col xs={24} md={8}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card size="small" style={{ backgroundColor: '#fff2f0', border: '1px solid #ffccc7' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#f5222d' }}>
                  ₹{totalExpense.toLocaleString()}
                </Title>
                <Text type="secondary">Total Expenses</Text>
              </div>
            </Card>

            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {summary.length}
                </Title>
                <Text type="secondary">Categories</Text>
              </div>
            </Card>

            {/* Category breakdown */}
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {summary.map((item, index) => (
                <Row
                  justify="space-between"
                  key={item._id || index}
                  style={{ 
                    padding: '8px 0', 
                    borderBottom: index < summary.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <Col>
                    <Space>
                      <div 
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          backgroundColor: COLORS[index % COLORS.length],
                          borderRadius: '2px'
                        }}
                      />
                      <Text>{item._id || 'Unknown'}</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space direction="vertical" size="small" style={{ textAlign: 'right' }}>
                      <Text strong>
                        ₹{(item.total || 0).toLocaleString()}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : 0}% 
                        ({item.count || 0} items)
                      </Text>
                    </Space>
                  </Col>
                </Row>
              ))}
            </div>
          </Space>
        </Col>

        {/* Pie Chart */}
        <Col xs={24} md={8}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Title level={5}>Expense Distribution</Title>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie {...pieConfig}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={customTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No data for chart" />
          )}
        </Col>

        {/* Bar Chart */}
        <Col xs={24} md={8}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Title level={5}>Category Comparison</Title>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip content={customTooltip} />
                <Bar dataKey="amount" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No data for chart" />
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default ExpenseSummary;