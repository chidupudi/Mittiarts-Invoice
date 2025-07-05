// src/components/expense/ExpenseList.js - Fixed version
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Typography,
  Popconfirm,
  Row,
  Col,
  message,
  Alert,
  Spin,
  Statistic,
  Tag
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';

import {
  fetchExpenses,
  deleteExpense,
  setSelectedExpense,
  getExpenseSummary
} from '../../features/expense/expenseSlice';
import ExpenseForm from './ExpenseForm';
import ExpenseSummary from './ExpenseSummary';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ExpenseList = () => {
  const dispatch = useDispatch();
  const { items: expenses, total, loading, error, summary } = useSelector(state => state.expenses);

  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  });
  const [openForm, setOpenForm] = useState(false);

  const categories = [
    'Utilities',
    'Rent',
    'Salaries',
    'Maintenance',
    'Supplies',
    'Transportation',
    'Marketing',
    'Insurance',
    'Others'
  ];

  const fetchExpensesData = useCallback(() => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
      ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      ...(filters.category && { category: filters.category }),
      ...(filters.search && { search: filters.search })
    };
    
    console.log('Fetching expenses with params:', params);
    dispatch(fetchExpenses(params));
    dispatch(getExpenseSummary(params));
  }, [dispatch, pagination, filters]);

  useEffect(() => {
    fetchExpensesData();
  }, [fetchExpensesData]);

  const handleEdit = (expense) => {
    console.log('Editing expense:', expense);
    dispatch(setSelectedExpense(expense));
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await dispatch(deleteExpense(id));
      if (deleteExpense.fulfilled.match(result)) {
        message.success('Expense deleted successfully');
        fetchExpensesData();
      } else {
        message.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Error deleting expense');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const handleFiltersChange = (changedFilters) => {
    setFilters(prev => ({
      ...prev,
      ...changedFilters
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      handleFiltersChange({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate()
      });
    } else {
      handleFiltersChange({ startDate: null, endDate: null });
    }
  };

  const clearFilters = () => {
    setFilters({ startDate: null, endDate: null, category: '', search: '' });
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const handleRefresh = () => {
    fetchExpensesData();
    message.success('Expenses refreshed');
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    dispatch(setSelectedExpense(null));
    fetchExpensesData();
    message.success('Expense saved successfully');
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => {
        if (!date) return '-';
        const expenseDate = date?.toDate ? date.toDate() : new Date(date);
        return moment(expenseDate).format('DD/MM/YYYY');
      },
      sorter: (a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      }
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{title}</div>
          {record.receiptNumber && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Receipt: {record.receiptNumber}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => (
        <Tag color="blue">{category}</Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 'bold', color: '#f5222d' }}>
          ₹{(amount || 0).toLocaleString()}
        </span>
      ),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0)
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method) => (
        <Tag color="purple">{method || 'Cash'}</Tag>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (description) => (
        <div style={{ 
          maxWidth: '200px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {description || '-'}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="primary"
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this expense?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small" 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calculate totals for current view
  const calculateTotals = () => {
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;
    
    return { totalAmount, avgAmount };
  };

  const { totalAmount, avgAmount } = calculateTotals();

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Expenses"
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
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Expenses</Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                dispatch(setSelectedExpense(null));
                setOpenForm(true);
              }}
            >
              Add Expense
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Expenses (Current View)"
              value={totalAmount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Expense"
              value={avgAmount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Records"
              value={expenses.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Expense Summary Chart */}
      <ExpenseSummary />

      {/* Filters and Table */}
      <Card style={{ marginTop: 24 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => handleFiltersChange({ search: e.target.value })}
              onSearch={(value) => handleFiltersChange({ search: value })}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={
                filters.startDate && filters.endDate
                  ? [moment(filters.startDate), moment(filters.endDate)]
                  : []
              }
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              value={filters.category}
              onChange={(value) => handleFiltersChange({ category: value })}
              style={{ width: '100%' }}
              allowClear
              placeholder="Category"
            >
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={3}>
            <Button onClick={clearFilters} block>
              Clear Filters
            </Button>
          </Col>

          <Col xs={24} sm={24} md={3}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </span>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total || expenses.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['5', '10', '25', '50'],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} expenses`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
        />
      </Card>

      {/* Expense Form Modal */}
      <ExpenseForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          dispatch(setSelectedExpense(null));
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default ExpenseList;