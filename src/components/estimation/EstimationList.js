// src/components/estimation/EstimationList.js
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
  Alert,
  Popconfirm
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  PlusOutlined,
  ShareAltOutlined,
  FileAddOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { fetchEstimates, updateEstimateStatus } from '../../features/estimation/estimationSlice';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const EstimationList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { items: estimates, loading, error } = useSelector(state => state.estimations);
  
  const [filteredEstimates, setFilteredEstimates] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    businessType: ''
  });

  // Load estimates on component mount
  useEffect(() => {
    console.log('EstimationList: Loading estimates...');
    dispatch(fetchEstimates({ limit: 100 }));
  }, [dispatch]);

  // Filter estimates and calculate summary when estimates or filters change
  useEffect(() => {
    if (estimates && estimates.length > 0) {
      console.log('EstimationList: Processing estimates:', estimates.length);
      filterAndProcessEstimates();
    } else {
      setFilteredEstimates([]);
      setSummary(null);
    }
  }, [estimates, filters]);

  const filterAndProcessEstimates = () => {
    let filtered = [...estimates];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(estimate => 
        estimate.estimateNumber?.toLowerCase().includes(searchTerm) ||
        estimate.customer?.name?.toLowerCase().includes(searchTerm) ||
        estimate.customer?.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(estimate => estimate.status === filters.status);
    }

    // Apply business type filter
    if (filters.businessType) {
      filtered = filtered.filter(estimate => estimate.businessType === filters.businessType);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(estimate => {
        const estimateDate = estimate.createdAt?.toDate ? estimate.createdAt.toDate() : new Date(estimate.createdAt);
        return estimateDate >= filters.startDate && estimateDate <= filters.endDate;
      });
    }

    // Calculate summary for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEstimates = estimates.filter(estimate => {
      const estimateDate = estimate.createdAt?.toDate ? estimate.createdAt.toDate() : new Date(estimate.createdAt);
      return estimateDate >= thirtyDaysAgo;
    });

    // Calculate statistics
    const totalValue = recentEstimates.reduce((sum, estimate) => sum + (estimate.total || 0), 0);
    const activeEstimates = recentEstimates.filter(e => e.status === 'active').length;
    const convertedEstimates = recentEstimates.filter(e => e.status === 'converted').length;
    const expiredEstimates = recentEstimates.filter(e => e.isExpired || e.status === 'expired').length;
    const conversionRate = recentEstimates.length > 0 ? (convertedEstimates / recentEstimates.length) * 100 : 0;

    const summaryData = {
      totalEstimates: recentEstimates.length,
      totalValue,
      activeEstimates,
      convertedEstimates,
      expiredEstimates,
      conversionRate,
      averageValue: recentEstimates.length > 0 ? totalValue / recentEstimates.length : 0
    };

    setFilteredEstimates(filtered);
    setSummary(summaryData);
    console.log('EstimationList: Filtered estimates:', filtered.length);
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

  const handleBusinessTypeFilter = (businessType) => {
    setFilters(prev => ({ ...prev, businessType }));
  };

  const handleViewEstimate = (estimate) => {
    navigate(`/estimations/${estimate.id}`);
  };

  const handleShareEstimate = async (estimate) => {
    try {
      const shareUrl = `${window.location.origin}/public/estimate/${estimate.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      message.success('🎉 Estimate share link copied to clipboard!');
    } catch (error) {
      console.error('Share error:', error);
      
      // Fallback for older browsers
      try {
        const shareUrl = `${window.location.origin}/public/estimate/${estimate.shareToken}`;
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        message.success('Estimate share link copied to clipboard!');
      } catch (fallbackError) {
        message.error('Failed to copy share link. Please try again.');
      }
    }
  };

  const handleConvertToInvoice = (estimate) => {
    // Navigate to billing with pre-filled data from estimate
    navigate('/billing', { 
      state: { 
        convertFromEstimate: estimate,
        prefilledItems: estimate.items,
        prefilledCustomer: estimate.customer,
        prefilledBusinessType: estimate.businessType,
        prefilledBranch: estimate.branch
      } 
    });
  };

  const handleUpdateStatus = async (estimateId, newStatus, notes = '') => {
    try {
      await dispatch(updateEstimateStatus({ id: estimateId, status: newStatus, notes }));
      message.success('Estimate status updated successfully');
      dispatch(fetchEstimates({ limit: 100 })); // Refresh list
    } catch (error) {
      message.error('Failed to update estimate status');
    }
  };

  const handleRefresh = () => {
    dispatch(fetchEstimates({ limit: 100 }));
    message.success('Estimates refreshed');
  };

  const handleExport = () => {
    try {
      const csvData = filteredEstimates.map(estimate => ({
        'Estimate Number': estimate.estimateNumber,
        'Date': moment(estimate.createdAt?.toDate?.() || estimate.createdAt).format('YYYY-MM-DD'),
        'Customer': estimate.customer?.name || 'Walk-in Customer',
        'Phone': estimate.customer?.phone || '',
        'Items': estimate.items?.length || 0,
        'Total Amount': estimate.total || 0,
        'Business Type': estimate.businessType || '',
        'Status': estimate.status || '',
        'Valid Until': moment(estimate.expiryDate).format('YYYY-MM-DD'),
        'Days to Expiry': estimate.daysToExpiry || 0,
        'Notes': estimate.notes || ''
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
      a.download = `mitti-arts-estimates-${moment().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      message.success('Estimates data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export failed');
    }
  };

  const getStatusColor = (status, isExpired) => {
    if (isExpired) return 'red';
    switch (status) {
      case 'active': return 'green';
      case 'converted': return 'blue';
      case 'cancelled': return 'red';
      case 'expired': return 'orange';
      default: return 'default';
    }
  };

  const getStatusIcon = (status, isExpired) => {
    if (isExpired) return <ClockCircleOutlined />;
    switch (status) {
      case 'active': return <CheckCircleOutlined />;
      case 'converted': return <FileAddOutlined />;
      case 'cancelled': return <CloseCircleOutlined />;
      case 'expired': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: 'Estimate #',
      dataIndex: 'estimateNumber',
      key: 'estimateNumber',
      width: 150,
      render: (text) => (
        <Text strong style={{ color: '#8b4513' }}>{text || 'N/A'}</Text>
      ),
    },
    {
      title: 'Date & Validity',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date, record) => {
        const estimateDate = date?.toDate ? date.toDate() : new Date(date);
        const expiryDate = moment(record.expiryDate);
        const isExpiringSoon = record.daysToExpiry <= 7 && record.daysToExpiry > 0;
        
        return (
          <div>
            <div>{moment(estimateDate).format('DD/MM/YYYY')}</div>
            <Text 
              type={record.isExpired ? "danger" : isExpiringSoon ? "warning" : "secondary"} 
              style={{ fontSize: '12px' }}
            >
              {record.isExpired ? 'Expired' : `${record.daysToExpiry}d left`}
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
      title: 'Items & Type',
      key: 'items',
      width: 120,
      render: (_, record) => (
        <div>
          <Tag color="#8b4513" style={{ color: 'white', marginBottom: 4 }}>
            {record.items?.length || 0}/8 items
          </Tag>
          <div>
            <Tag color={record.businessType === 'wholesale' ? 'orange' : 'blue'} size="small">
              {record.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#8b4513' }}>
          ₹{(amount || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = record.isExpired ? 'expired' : record.status;
        return (
          <Tag 
            color={getStatusColor(status, record.isExpired)} 
            icon={getStatusIcon(status, record.isExpired)}
          >
            {status === 'expired' ? 'EXPIRED' : (status || 'active').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Estimate">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewEstimate(record)}
              type="primary"
              style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
            />
          </Tooltip>
          
          <Tooltip title="Share Estimate">
            <Button
              icon={<ShareAltOutlined />}
              size="small"
              onClick={() => handleShareEstimate(record)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
            />
          </Tooltip>
          
          {record.status === 'active' && !record.isExpired && (
            <Tooltip title="Convert to Invoice">
              <Button
                icon={<FileAddOutlined />}
                size="small"
                onClick={() => handleConvertToInvoice(record)}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
              />
            </Tooltip>
          )}
          
          {record.status === 'active' && (
            <Popconfirm
              title="Cancel this estimate?"
              onConfirm={() => handleUpdateStatus(record.id, 'cancelled')}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Cancel Estimate">
                <Button
                  icon={<CloseCircleOutlined />}
                  size="small"
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading pottery estimates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Estimates"
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
      {/* Summary Cards */}
      {summary && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Total Estimates (30 days)"
                value={summary.totalEstimates}
                prefix={<FileAddOutlined />}
                valueStyle={{ color: '#8b4513' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Total Value"
                value={summary.totalValue}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#228b22' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Active Estimates"
                value={summary.activeEstimates}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                {summary.expiredEstimates} expired
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ border: '1px solid #8b4513' }}>
              <Statistic
                title="Conversion Rate"
                value={summary.conversionRate}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                {summary.convertedEstimates} converted to invoices
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#8b4513' }}>
              Pottery Estimates ({filteredEstimates.length})
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => navigate('/estimations/create')}
                style={{
                  background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                  border: 'none'
                }}
              >
                Create Estimate
              </Button>
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
                disabled={filteredEstimates.length === 0}
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
              placeholder="Search estimates..."
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
              <Option value="active">Active</Option>
              <Option value="converted">Converted</Option>
              <Option value="expired">Expired</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Business Type"
              onChange={handleBusinessTypeFilter}
              value={filters.businessType}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">All Types</Option>
              <Option value="retail">Retail</Option>
              <Option value="wholesale">Wholesale</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Text type="secondary">
              Showing {filteredEstimates.length} of {estimates.length} estimates
            </Text>
          </Col>
        </Row>

        {/* Table */}
        {filteredEstimates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>📋</div>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {estimates.length === 0 ? 'No pottery estimates found' : 'No estimates match your filters'}
            </Text>
            <br />
            <Text type="secondary">
              {estimates.length === 0 ? 'Create your first pottery estimate' : 'Try adjusting your search criteria'}
            </Text>
            <br />
            {estimates.length === 0 && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => navigate('/estimations/create')}
                style={{ 
                  marginTop: 16,
                  background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                  border: 'none'
                }}
              >
                Create Your First Estimate
              </Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredEstimates}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} estimates`,
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
            summary={(pageData) => {
              const pageTotal = pageData.reduce((sum, record) => sum + (record.total || 0), 0);
              const activeCount = pageData.filter(record => record.status === 'active' && !record.isExpired).length;
              
              return (
                <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Page Summary:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#8b4513' }}>
                        ₹{pageTotal.toLocaleString()}
                      </div>
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ color: '#52c41a' }}>
                        {activeCount} Active
                      </Text>
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} />
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
            <Text strong>Pottery Estimate Tips</Text>
          </Space>
        } 
        style={{ marginTop: 16 }}
        bodyStyle={{ backgroundColor: '#f9f9f9' }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '20px', marginBottom: 8 }}>📋</div>
              <Text strong>Quick Estimates</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Generate professional pottery estimates in minutes
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '20px', marginBottom: 8 }}>🔄</div>
              <Text strong>Easy Conversion</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Convert estimates to invoices with one click
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '20px', marginBottom: 8 }}>📱</div>
              <Text strong>Share Instantly</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Share estimates via secure links with customers
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default EstimationList;