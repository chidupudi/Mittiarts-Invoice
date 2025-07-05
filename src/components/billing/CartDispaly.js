// src/components/billing/CartDisplay.js
import React from 'react';
import { Table, InputNumber, Button, Tag, Typography, Popconfirm, Space } from 'antd';
import { DeleteOutlined, EditOutlined, ShoppingCartOutlined, GiftOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CartDisplay = ({ 
  cart, 
  businessType, 
  onQuantityChange, 
  onRemoveItem, 
  onOpenPriceEdit 
}) => {
  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
        <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <div>No items in cart</div>
        <div style={{ fontSize: '12px' }}>Add pottery products to get started</div>
      </div>
    );
  }

  const columns = [
    {
      title: 'Item',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: 120,
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>{name}</Text>
          {record.product.isDynamic && (
            <Tag color="blue" size="small" style={{ marginLeft: 4, fontSize: '9px' }}>Custom</Tag>
          )}
          <div style={{ fontSize: '10px', color: '#666' }}>
            {record.product.category}
          </div>
          <div style={{ fontSize: '9px', color: '#8b4513' }}>
            {businessType === 'wholesale' ? '🏪 Wholesale' : '🛍️ Retail'}
          </div>
        </div>
      ),
    },
    {
      title: 'Qty',
      key: 'quantity',
      width: 50,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => onQuantityChange(record.product.id, val)}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 85,
      render: (_, record) => {
        const hasDiscount = record.originalPrice !== record.currentPrice;
        
        return (
          <div>
            {hasDiscount && (
              <div style={{ 
                fontSize: '10px', 
                textDecoration: 'line-through', 
                color: '#999' 
              }}>
                ₹{record.originalPrice}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text strong style={{ color: hasDiscount ? '#52c41a' : 'inherit' }}>
                ₹{record.currentPrice}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onOpenPriceEdit(record)}
                style={{ padding: 0, minWidth: 'auto' }}
                title="Negotiate Price"
              />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Total',
      key: 'total',
      width: 70,
      render: (_, record) => {
        const itemTotal = record.currentPrice * record.quantity;
        const originalTotal = record.originalPrice * record.quantity;
        const hasDiscount = originalTotal !== itemTotal;
        
        return (
          <div>
            {hasDiscount && (
              <div style={{ 
                fontSize: '10px', 
                textDecoration: 'line-through', 
                color: '#999' 
              }}>
                ₹{originalTotal.toFixed(2)}
              </div>
            )}
            <Text strong style={{ color: hasDiscount ? '#52c41a' : 'inherit' }}>
              ₹{itemTotal.toFixed(2)}
            </Text>
            {hasDiscount && (
              <div style={{ fontSize: '9px', color: '#52c41a' }}>
                <GiftOutlined /> ₹{Math.abs(originalTotal - itemTotal).toFixed(2)} off
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 30,
      render: (_, record) => (
        <Popconfirm
          title="Remove item?"
          onConfirm={() => onRemoveItem(record.product.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ padding: 0 }}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={cart}
      rowKey={(item) => item.product.id}
      pagination={false}
      size="small"
      scroll={{ y: 200 }}
      style={{ fontSize: '12px' }}
    />
  );
};

export default CartDisplay;