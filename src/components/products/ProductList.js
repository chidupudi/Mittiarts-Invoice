// src/components/products/ProductList.js - Enhanced Mitti Arts Product Management
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  Button,
  Input,
  Switch,
  Select,
  Modal,
  Typography,
  Space,
  Row,
  Col,
  Spin,
  Tag,
  Card,
  Grid,
  Badge,
  Tooltip,
  Statistic,
  Progress,
  Alert,
  Tabs,
  Divider,
  Radio,
  InputNumber
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  TableOutlined,
  ShopOutlined,
  BankOutlined,
  DollarOutlined,
  PercentageOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { fetchProducts, deleteProduct, setFilters } from '../../features/products/productSlice';
import ProductForm from './ProductForm';
import BulkUpload from './BulkUpload';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { useBreakpoint } = Grid;
const { TabPane } = Tabs;

// Mitti Arts pottery categories with enhanced details
const POTTERY_CATEGORIES = [
  { 
    id: 'pottery_vases', 
    name: 'Pottery Vases', 
    icon: '🏺', 
    color: '#8b4513',
    description: 'Traditional and decorative pottery vases'
  },
  { 
    id: 'terracotta_items', 
    name: 'Terracotta Items', 
    icon: '🟫', 
    color: '#cd853f',
    description: 'Natural terracotta pottery and crafts'
  },
  { 
    id: 'clay_art', 
    name: 'Clay Art & Sculptures', 
    icon: '🎨', 
    color: '#daa520',
    description: 'Artistic clay sculptures and decorative pieces'
  },
  { 
    id: 'decorative_items', 
    name: 'Decorative Items', 
    icon: '✨', 
    color: '#b8860b',
    description: 'Home décor and ornamental pottery'
  },
  { 
    id: 'garden_pottery', 
    name: 'Garden Pottery', 
    icon: '🌱', 
    color: '#228b22',
    description: 'Planters, pots, and garden accessories'
  },
  { 
    id: 'kitchen_pottery', 
    name: 'Kitchen Pottery', 
    icon: '🍽️', 
    color: '#ff6347',
    description: 'Functional kitchen pottery and utensils'
  },
  { 
    id: 'gifts_souvenirs', 
    name: 'Gifts & Souvenirs', 
    icon: '🎁', 
    color: '#9932cc',
    description: 'Gift items and cultural souvenirs'
  },
  { 
    id: 'custom_orders', 
    name: 'Custom Orders', 
    icon: '🛠️', 
    color: '#2f4f4f',
    description: 'Bespoke and made-to-order pottery'
  }
];

const ProductList = () => {
  const dispatch = useDispatch();
  const { items, loading, filters } = useSelector((state) => state.products);
  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [pricingView, setPricingView] = useState('both'); // 'retail', 'wholesale', 'both'
  const [productStatsModal, setProductStatsModal] = useState(false);
  const screens = useBreakpoint();

  // Auto switch to card view on tablet/mobile
  useEffect(() => {
    if (screens.md && !screens.lg) {
      setViewMode('cards');
    } else if (screens.lg) {
      setViewMode('table');
    }
  }, [screens]);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setOpenForm(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Are you sure you want to delete this pottery product?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone and will remove the product from your inventory.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteProduct(id));
          dispatch(fetchProducts(filters));
        } catch (error) {
          console.error('Error deleting product:', error);
        }
      },
    });
  };

  const handleFilterChange = (name, value) => {
    dispatch(setFilters({ [name]: value }));
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedProduct(null);
    dispatch(fetchProducts(filters));
  };

  const handleCloseBulkUpload = () => {
    setOpenBulkUpload(false);
    dispatch(fetchProducts(filters));
  };

  // Get category details by name
  const getCategoryDetails = (categoryName) => {
    return POTTERY_CATEGORIES.find(cat => 
      cat.name === categoryName || cat.id === categoryName
    ) || POTTERY_CATEGORIES[0];
  };

  // Calculate profit margins
  const calculateProfitMargin = (product) => {
    const retailMargin = product.retailPrice && product.costPrice ? 
      ((product.retailPrice - product.costPrice) / product.retailPrice) * 100 : 0;
    const wholesaleMargin = product.wholesalePrice && product.costPrice ? 
      ((product.wholesalePrice - product.costPrice) / product.wholesalePrice) * 100 : 0;
    
    return { retailMargin, wholesaleMargin };
  };

  // Get stock status
  const getStockStatus = (stock) => {
    if (stock <= 0) return { status: 'out', color: '#ff4d4f', text: 'Out of Stock' };
    if (stock <= 5) return { status: 'low', color: '#faad14', text: 'Low Stock' };
    if (stock <= 20) return { status: 'medium', color: '#1890ff', text: 'Medium Stock' };
    return { status: 'good', color: '#52c41a', text: 'Good Stock' };
  };

  // Calculate product analytics
  const calculateProductAnalytics = () => {
    const totalProducts = items.length;
    const totalValue = items.reduce((sum, product) => sum + (product.retailPrice * product.stock), 0);
    const lowStockItems = items.filter(product => product.stock <= 5).length;
    const outOfStockItems = items.filter(product => product.stock <= 0).length;
    
    const categoryStats = POTTERY_CATEGORIES.map(category => {
      const categoryProducts = items.filter(product => {
        const productCategory = getCategoryDetails(product.category);
        return productCategory.id === category.id;
      });
      
      return {
        ...category,
        count: categoryProducts.length,
        value: categoryProducts.reduce((sum, product) => sum + (product.retailPrice * product.stock), 0),
        avgPrice: categoryProducts.length > 0 ? 
          categoryProducts.reduce((sum, product) => sum + product.retailPrice, 0) / categoryProducts.length : 0
      };
    });

    const profitAnalysis = items.reduce((acc, product) => {
      const margins = calculateProfitMargin(product);
      if (margins.retailMargin > 0) {
        acc.retailMarginTotal += margins.retailMargin;
        acc.retailCount++;
      }
      if (margins.wholesaleMargin > 0) {
        acc.wholesaleMarginTotal += margins.wholesaleMargin;
        acc.wholesaleCount++;
      }
      return acc;
    }, { retailMarginTotal: 0, wholesaleMarginTotal: 0, retailCount: 0, wholesaleCount: 0 });

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categoryStats,
      avgRetailMargin: profitAnalysis.retailCount > 0 ? profitAnalysis.retailMarginTotal / profitAnalysis.retailCount : 0,
      avgWholesaleMargin: profitAnalysis.wholesaleCount > 0 ? profitAnalysis.wholesaleMarginTotal / profitAnalysis.wholesaleCount : 0
    };
  };

  // Table columns for desktop
  const columns = [
    {
      title: 'Pottery Product',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => {
        const category = getCategoryDetails(record.category);
        const stockStatus = getStockStatus(record.stock);
        
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '16px' }}>{category.icon}</span>
              <Text strong style={{ fontSize: '13px' }}>{text}</Text>
            </div>
            <div style={{ marginBottom: 4 }}>
              <Tag color={category.color} size="small" style={{ fontSize: '9px' }}>
                {category.name}
              </Tag>
              <Tag color={stockStatus.color} size="small" style={{ fontSize: '9px' }}>
                {stockStatus.text}
              </Tag>
            </div>
            {record.isDynamic && (
              <Tag color="purple" size="small" style={{ fontSize: '9px' }}>
                Custom Product
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Pricing Strategy',
      key: 'pricing',
      width: 180,
      render: (_, record) => {
        const margins = calculateProfitMargin(record);
        
        return (
          <div>
            {(pricingView === 'retail' || pricingView === 'both') && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '11px', color: '#666' }}>
                    <ShopOutlined /> Retail:
                  </Text>
                  <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>
                    ₹{record.retailPrice || record.price || 0}
                  </Text>
                </div>
                {margins.retailMargin > 0 && (
                  <div style={{ fontSize: '9px', color: '#52c41a' }}>
                    Margin: {margins.retailMargin.toFixed(1)}%
                  </div>
                )}
              </div>
            )}
            
            {(pricingView === 'wholesale' || pricingView === 'both') && record.wholesalePrice && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '11px', color: '#666' }}>
                    <BankOutlined /> Wholesale:
                  </Text>
                  <Text strong style={{ fontSize: '12px', color: '#fa8c16' }}>
                    ₹{record.wholesalePrice}
                  </Text>
                </div>
                {margins.wholesaleMargin > 0 && (
                  <div style={{ fontSize: '9px', color: '#52c41a' }}>
                    Margin: {margins.wholesaleMargin.toFixed(1)}%
                  </div>
                )}
              </div>
            )}
            
            {record.costPrice && (
              <div style={{ fontSize: '10px', color: '#999', borderTop: '1px solid #f0f0f0', paddingTop: 2 }}>
                Cost: ₹{record.costPrice}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Inventory',
      key: 'inventory',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const stockStatus = getStockStatus(record.stock);
        
        return (
          <div style={{ textAlign: 'center' }}>
            <Badge
              count={record.stock}
              style={{
                backgroundColor: stockStatus.color,
                fontSize: '11px',
                minWidth: '20px',
                height: '20px',
                lineHeight: '20px'
              }}
            />
            <div style={{ fontSize: '9px', color: '#666', marginTop: 2 }}>
              {record.weight ? `${record.weight}kg` : 'No weight'}
            </div>
            {record.sku && (
              <div style={{ fontSize: '8px', color: '#999', marginTop: 1 }}>
                SKU: {record.sku}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 120,
      render: (_, record) => {
        const margins = calculateProfitMargin(record);
        const stockStatus = getStockStatus(record.stock);
        const avgMargin = (margins.retailMargin + margins.wholesaleMargin) / 2;
        
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: '10px', color: '#666' }}>Avg Margin:</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Progress
                  percent={avgMargin}
                  size="small"
                  strokeColor={avgMargin >= 40 ? '#52c41a' : avgMargin >= 20 ? '#faad14' : '#ff4d4f'}
                  showInfo={false}
                  style={{ flex: 1 }}
                />
                <Text style={{ fontSize: '9px', fontWeight: 'bold' }}>
                  {avgMargin.toFixed(0)}%
                </Text>
              </div>
            </div>
            
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: '10px', color: '#666' }}>Stock Health:</Text>
              <Progress
                percent={Math.min((record.stock / 50) * 100, 100)}
                size="small"
                strokeColor={stockStatus.color}
                showInfo={false}
              />
            </div>
            
            <div style={{ fontSize: '9px', textAlign: 'center' }}>
              <Tag color={avgMargin >= 30 ? 'success' : avgMargin >= 15 ? 'warning' : 'error'} size="small">
                {avgMargin >= 30 ? '🏆 High' : avgMargin >= 15 ? '📈 Medium' : '📉 Low'} Profit
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Product">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="primary"
              size="small"
              style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
            />
          </Tooltip>
          <Tooltip title="Delete Product">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Card view for tablets/mobile
  const ProductCard = ({ product }) => {
    const category = getCategoryDetails(product.category);
    const stockStatus = getStockStatus(product.stock);
    const margins = calculateProfitMargin(product);
    const avgMargin = (margins.retailMargin + margins.wholesaleMargin) / 2;

    return (
      <Card
        size="small"
        style={{ 
          marginBottom: 12,
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <Row gutter={[8, 8]} align="middle">
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '18px' }}>{category.icon}</span>
              <Text strong style={{ fontSize: '14px' }}>{product.name}</Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color={category.color} size="small">{category.name}</Tag>
              <Tag color={stockStatus.color} size="small">{stockStatus.text}</Tag>
              {product.isDynamic && (
                <Tag color="purple" size="small">Custom</Tag>
              )}
            </div>
            
            <Row gutter={8}>
              <Col span={12}>
                <div style={{ fontSize: '11px', color: '#666' }}>Retail:</div>
                <Text strong style={{ color: '#1890ff' }}>₹{product.retailPrice || product.price}</Text>
              </Col>
              {product.wholesalePrice && (
                <Col span={12}>
                  <div style={{ fontSize: '11px', color: '#666' }}>Wholesale:</div>
                  <Text strong style={{ color: '#fa8c16' }}>₹{product.wholesalePrice}</Text>
                </Col>
              )}
            </Row>
          </Col>
          
          <Col>
            <div style={{ textAlign: 'right' }}>
              <Badge
                count={product.stock}
                style={{
                  backgroundColor: stockStatus.color,
                  fontSize: '10px'
                }}
              />
              <div style={{ fontSize: '10px', color: '#666', marginTop: 4 }}>
                Margin: {avgMargin.toFixed(0)}%
              </div>
              <Progress
                percent={avgMargin}
                size="small"
                strokeColor={avgMargin >= 40 ? '#52c41a' : avgMargin >= 20 ? '#faad14' : '#ff4d4f'}
                showInfo={false}
                style={{ width: '60px', marginTop: 4 }}
              />
            </div>
          </Col>
          
          <Col>
            <Space direction="vertical" size="small">
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(product)}
                type="primary"
                block
                style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
              />
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={() => handleDelete(product.id)}
                block
              />
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const analytics = calculateProductAnalytics();

  return (
    <div style={{ padding: screens.xs ? 12 : 24, backgroundColor: '#fafafa' }}>
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
              Mitti Arts Inventory
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Handcrafted Pottery & Terracotta Collection
            </Text>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Statistic
            title="Total Products"
            value={analytics.totalProducts}
            valueStyle={{ color: 'white', fontSize: '24px' }}
          />
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
            Inventory Value: ₹{(analytics.totalValue / 1000).toFixed(1)}k
          </Text>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ border: '1px solid #8b4513' }}>
            <Statistic
              title="Total Products"
              value={analytics.totalProducts}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#8b4513' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ border: '1px solid #52c41a' }}>
            <Statistic
              title="Inventory Value"
              value={analytics.totalValue}
              prefix="₹"
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ border: '1px solid #faad14' }}>
            <Statistic
              title="Low Stock Items"
              value={analytics.lowStockItems}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ border: '1px solid #1890ff' }}>
            <Statistic
              title="Avg Retail Margin"
              value={analytics.avgRetailMargin}
              suffix="%"
              prefix={<PercentageOutlined />}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls Header */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: screens.xs ? 12 : 16 }}>
        <Row justify="space-between" align="middle" gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <Title level={4} style={{ margin: 0, color: '#8b4513' }}>
              Pottery Collection ({items.length})
            </Title>
            <Text type="secondary">Manage your handcrafted pottery inventory</Text>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: screens.xs ? 'left' : 'right' }}>
            <Space wrap>
              {/* Pricing View Toggle */}
              <Radio.Group 
                value={pricingView} 
                onChange={(e) => setPricingView(e.target.value)}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="retail">
                  <ShopOutlined /> Retail
                </Radio.Button>
                <Radio.Button value="wholesale">
                  <BankOutlined /> Wholesale
                </Radio.Button>
                <Radio.Button value="both">
                  Both
                </Radio.Button>
              </Radio.Group>

              {screens.md && (
                <Button.Group>
                  <Button
                    icon={<TableOutlined />}
                    type={viewMode === 'table' ? 'primary' : 'default'}
                    onClick={() => setViewMode('table')}
                  />
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'cards' ? 'primary' : 'default'}
                    onClick={() => setViewMode('cards')}
                  />
                </Button.Group>
              )}
              
              <Button
                icon={<TrophyOutlined />}
                onClick={() => setProductStatsModal(true)}
                size={screens.xs ? 'small' : 'middle'}
              >
                {screens.xs ? 'Stats' : 'Analytics'}
              </Button>
              
              <Button
                icon={<UploadOutlined />}
                onClick={() => setOpenBulkUpload(true)}
                size={screens.xs ? 'small' : 'middle'}
              >
                {screens.xs ? 'Bulk' : 'Bulk Upload'}
              </Button>
              
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedProduct(null);
                  setOpenForm(true);
                }}
                size={screens.xs ? 'small' : 'middle'}
                style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
              >
                {screens.xs ? 'Add' : 'Add Product'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: screens.xs ? 12 : 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search pottery products..."
              prefix={<SearchOutlined />}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Category"
              value={filters.category || ''}
              onChange={(val) => handleFilterChange('category', val)}
              allowClear
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="">All Categories</Option>
              {POTTERY_CATEGORIES.map(category => (
                <Option key={category.id} value={category.name}>
                  {category.icon} {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Switch
                checked={filters.lowStock || false}
                onChange={(checked) => handleFilterChange('lowStock', checked)}
                size={screens.xs ? 'small' : 'default'}
              />
              <Text>Low Stock Only</Text>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Text type="secondary">
              {items.length} product{items.length !== 1 ? 's' : ''}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Inventory Alerts */}
      {analytics.outOfStockItems > 0 && (
        <Alert
          message={`${analytics.outOfStockItems} pottery items are out of stock`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => handleFilterChange('lowStock', true)}>
              View Items
            </Button>
          }
        />
      )}

      {analytics.lowStockItems > 0 && analytics.outOfStockItems === 0 && (
        <Alert
          message={`${analytics.lowStockItems} pottery items have low stock`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => handleFilterChange('lowStock', true)}>
              View Items
            </Button>
          }
        />
      )}

      {/* Content */}
      <Card bodyStyle={{ padding: screens.xs ? 8 : 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <Text style={{ display: 'block', marginTop: 16 }}>
              Loading pottery collection...
            </Text>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>🏺</div>
            <Text type="secondary" style={{ fontSize: 16, display: 'block' }}>
              No pottery products found
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {filters.search || filters.category || filters.lowStock
                ? 'Try adjusting your filters or add a new product'
                : 'Get started by adding your first pottery product'}
            </Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                setSelectedProduct(null);
                setOpenForm(true);
              }}
              style={{ 
                marginTop: 16,
                backgroundColor: '#8b4513', 
                borderColor: '#8b4513' 
              }}
            >
              Add Your First Product
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'table' && screens.lg ? (
              <Table
                dataSource={items}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} pottery products`
                }}
                bordered
                size="middle"
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <div>
                {items.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Product Form Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏺</span>
            <span>{selectedProduct ? 'Edit Product' : 'Add New Product'}</span>
          </div>
        }
        open={openForm}
        onCancel={() => setOpenForm(false)}
        footer={null}
        width={screens.xs ? '95%' : 800}
        destroyOnClose
      >
        <ProductForm product={selectedProduct} onClose={handleCloseForm} />
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📁</span>
            <span>Bulk Upload Products</span>
          </div>
        }
        open={openBulkUpload}
        onCancel={() => setOpenBulkUpload(false)}
        footer={[
          <Button key="close" onClick={() => setOpenBulkUpload(false)}>
            Close
          </Button>,
        ]}
        width={screens.xs ? '95%' : 600}
        destroyOnClose
      >
        <BulkUpload onSuccess={handleCloseBulkUpload} />
      </Modal>

      {/* Product Analytics Modal */}
      <Modal
        title="Pottery Collection Analytics"
        open={productStatsModal}
        onCancel={() => setProductStatsModal(false)}
        footer={null}
        width={800}
      >
        <Tabs defaultActiveKey="overview">
          <TabPane tab="Overview" key="overview">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Inventory Health">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Good Stock"
                        value={items.filter(p => p.stock > 20).length}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Low Stock"
                        value={analytics.lowStockItems}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Profit Margins">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Retail Margin"
                        value={analytics.avgRetailMargin}
                        suffix="%"
                        precision={1}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Wholesale Margin"
                        value={analytics.avgWholesaleMargin}
                        suffix="%"
                        precision={1}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab="Categories" key="categories">
            <div>
              {analytics.categoryStats.map(category => (
                <Card key={category.id} size="small" style={{ marginBottom: 8 }}>
                  <Row align="middle">
                    <Col span={6}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '20px' }}>{category.icon}</span>
                        <Text strong>{category.name}</Text>
                      </div>
                    </Col>
                    <Col span={4}>
                      <Statistic value={category.count} suffix="items" />
                    </Col>
                    <Col span={6}>
                      <Statistic value={category.value} prefix="₹" precision={0} />
                    </Col>
                    <Col span={6}>
                      <Statistic value={category.avgPrice} prefix="₹" suffix="avg" precision={0} />
                    </Col>
                    <Col span={2}>
                      <Progress 
                        type="circle" 
                        size={40} 
                        percent={Math.min((category.count / analytics.totalProducts) * 100, 100)} 
                        strokeColor={category.color}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default ProductList;