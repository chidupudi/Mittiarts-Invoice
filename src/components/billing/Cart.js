// src/components/billing/Cart.js - No GST version
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Typography, InputNumber, Popconfirm, Space, Input, Button, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { removeFromCart, updateCartItemQuantity, updateCartItemPrice } from '../../features/order/orderSlice';

const { Title, Text } = Typography;

const Cart = ({ allowPriceEdit = false }) => {
  const dispatch = useDispatch();
  const { cart } = useSelector(state => state.orders);
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState(0);

  const handleQuantityChange = (productId, quantity) => {
    if (quantity > 0) {
      dispatch(updateCartItemQuantity({ productId, quantity }));
    }
  };

  const handlePriceEdit = (item) => {
    setEditingPrice(item.product.id);
    setTempPrice(item.currentPrice);
  };

  const handlePriceUpdate = (productId) => {
    if (tempPrice > 0) {
      dispatch(updateCartItemPrice({ productId, newPrice: tempPrice }));
    }
    setEditingPrice(null);
    setTempPrice(0);
  };

  const handlePriceCancel = () => {
    setEditingPrice(null);
    setTempPrice(0);
  };

  const calculateItemSubtotal = (item) => {
    return item.originalPrice * item.quantity;
  };

  const calculateItemDiscount = (item) => {
    return (item.originalPrice - item.currentPrice) * item.quantity;
  };

  const calculateItemTotal = (item) => {
    return item.currentPrice * item.quantity;
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + calculateItemSubtotal(item), 0);
  };

  const calculateTotalDiscount = () => {
    return cart.reduce((total, item) => total + calculateItemDiscount(item), 0);
  };

  const calculateCurrentTotal = () => {
    return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'productName',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          {record.product.isDynamic && (
            <div>
              <Tag color="blue" size="small">Custom</Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Original Price',
      key: 'originalPrice',
      align: 'right',
      render: (_, record) => `₹${record.originalPrice}`,
    },
    {
      title: 'Current Price',
      key: 'currentPrice',
      align: 'right',
      render: (_, record) => {
        if (!allowPriceEdit) {
          return `₹${record.currentPrice}`;
        }

        if (editingPrice === record.product.id) {
          return (
            <Space>
              <InputNumber
                size="small"
                value={tempPrice}
                onChange={setTempPrice}
                min={0}
                step={0.01}
                style={{ width: 80 }}
              />
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handlePriceUpdate(record.product.id)}
                style={{ color: '#52c41a' }}
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={handlePriceCancel}
                style={{ color: '#ff4d4f' }}
              />
            </Space>
          );
        }

        return (
          <Space>
            <Text>₹{record.currentPrice}</Text>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handlePriceEdit(record)}
            />
          </Space>
        );
      },
    },
    {
      title: 'Discount',
      key: 'discount',
      align: 'right',
      render: (_, record) => {
        const discount = record.originalPrice - record.currentPrice;
        const discountPercent = record.originalPrice > 0 ? ((discount / record.originalPrice) * 100) : 0;
        
        if (discount > 0) {
          return (
            <div>
              <Text style={{ color: '#52c41a' }}>₹{discount.toFixed(2)}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ({discountPercent.toFixed(1)}%)
              </Text>
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (quantity, record) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => handleQuantityChange(record.product.id, value)}
          size="small"
          style={{ width: 70 }}
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      align: 'right',
      render: (_, record) => {
        const subtotal = calculateItemSubtotal(record);
        const discount = calculateItemDiscount(record);
        const total = calculateItemTotal(record);
        
        return (
          <div>
            {discount > 0 ? (
              <>
                <Text delete>₹{subtotal.toFixed(2)}</Text>
                <br />
                <Text strong>₹{total.toFixed(2)}</Text>
              </>
            ) : (
              <Text strong>₹{total.toFixed(2)}</Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Popconfirm
          title="Remove this item?"
          onConfirm={() => dispatch(removeFromCart(record.product.id))}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
          />
        </Popconfirm>
      ),
    },
  ];

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Text type="secondary">No items in cart</Text>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const totalDiscount = calculateTotalDiscount();
  const currentTotal = calculateCurrentTotal();

  return (
    <div>
      <Table
        columns={columns}
        dataSource={cart}
        rowKey={(item) => item.product.id}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
      
      <div style={{ marginTop: 16, padding: 16, backgroundColor: '#fafafa', borderRadius: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Original Subtotal:</Text>
          <Text>₹{subtotal.toFixed(2)}</Text>
        </div>
        
        {totalDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Total Discount:</Text>
            <Text style={{ color: '#52c41a' }}>-₹{totalDiscount.toFixed(2)}</Text>
          </div>
        )}
        
        <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: 8, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0 }}>Final Total:</Title>
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>₹{currentTotal.toFixed(2)}</Title>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;