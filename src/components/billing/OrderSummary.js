// src/components/billing/OrderSummary.js
import React from 'react';
import { Card, Row, Col, Typography, Space, Divider, Statistic, Button, Tag } from 'antd';
import { PrinterOutlined, CalculatorOutlined } from '@ant-design/icons';
import { calculateTotals } from './BillingHelpers';

const { Text } = Typography;


const OrderSummary = ({ 
  cart = [], 
  businessType = 'retail',
  selectedCustomer,
  currentLocation,
  isAdvanceBilling,
  advanceAmount,
  remainingAmount,
  onSubmit,
  disabled
}) => {
  // Defensive: fallback to 'retail' if businessType is null/undefined/empty string
  const safeBusinessType = businessType || 'retail';
  const totals = calculateTotals(cart, safeBusinessType);

  return (
    <Card
      title={
        <Space>
          <span style={{
            background: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#d9d9d9',
            color: (selectedCustomer && cart.length > 0) ? 'white' : '#8c8c8c',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            5
          </span>
          <span style={{ color: (selectedCustomer && cart.length > 0) ? 'inherit' : '#8c8c8c' }}>
            STEP 5: Final Review & Generate Invoice
          </span>
        </Space>
      }
      size="small"
      style={{
        flex: 1,
        borderColor: (selectedCustomer && cart.length > 0) ? '#8b4513' : '#d9d9d9',
        borderWidth: '2px',
        opacity: (selectedCustomer && cart.length > 0) ? 1 : 0.6
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={8} style={{ marginBottom: 8 }}>
          <Col span={12}>
            <Statistic 
              title="Items" 
              value={totals.itemCount} 
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic 
              title="Quantity" 
              value={totals.totalQuantity} 
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
        </Row>

        <Row justify="space-between" style={{ marginBottom: 8 }}>
          <Text>List Price:</Text>
          <Text>₹{totals.subtotal.toFixed(2)}</Text>
        </Row>
        
        {totals.totalDiscount !== 0 && (
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <Text>
              {totals.totalDiscount > 0 ? (
                <span style={{ color: '#fa8c16' }}>💝 Negotiated Discount:</span>
              ) : (
                <span style={{ color: '#52c41a' }}>📈 Premium Added:</span>
              )}
            </Text>
            <Text style={{ 
              color: totals.totalDiscount > 0 ? '#fa8c16' : '#52c41a', 
              fontWeight: 'bold' 
            }}>
              {totals.totalDiscount > 0 ? '-' : '+'}₹{Math.abs(totals.totalDiscount).toFixed(2)}
            </Text>
          </Row>
        )}

        {totals.wholesaleDiscount > 0 && (
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <Text style={{ color: '#722ed1' }}>🏪 Wholesale Discount (5%):</Text>
            <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>
              -₹{totals.wholesaleDiscount.toFixed(2)}
            </Text>
          </Row>
        )}
        
        <Divider style={{ margin: '8px 0' }} />
        
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 16 }}>Total Amount:</Text>
          <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
            ₹{totals.finalTotal.toFixed(2)}
          </Text>
        </Row>

        {safeBusinessType === 'wholesale' && totals.currentTotal > 10000 && (
          <div style={{ 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: 4, 
            padding: 8, 
            marginBottom: 12,
            textAlign: 'center'
          }}>
            <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
              🏪 Wholesale order above ₹10,000 - Additional 5% discount applied!
            </Text>
          </div>
        )}

        {(totals.totalDiscount > 0 || totals.wholesaleDiscount > 0) && (
          <div style={{ 
            backgroundColor: '#fff7e6', 
            border: '1px solid #ffd591', 
            borderRadius: 4, 
            padding: 8, 
            marginBottom: 12,
            textAlign: 'center'
          }}>
            <Text style={{ color: '#fa8c16', fontWeight: 'bold' }}>
              🎁 Total savings: ₹{(totals.totalDiscount + totals.wholesaleDiscount).toFixed(2)}
            </Text>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div style={{ 
          backgroundColor: '#f0f5ff', 
          border: '1px solid #adc6ff', 
          borderRadius: 4, 
          padding: 8, 
          marginBottom: 16,
          fontSize: '12px'
        }}>
          <div><strong>Customer:</strong> {selectedCustomer.name}</div>
          {selectedCustomer.phone && (
            <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
          )}
          <div><strong>Location:</strong> {currentLocation?.displayName || 'No location selected'}</div>
          <div><strong>Details:</strong> {currentLocation?.locationInfo || ''}</div>
          <div><strong>Type:</strong> {safeBusinessType === 'retail' ? '🛍️ Retail' : '🏪 Wholesale'}</div>
        </div>
      )}

      <Button
        type="primary"
        size="large"
        onClick={onSubmit}
        block
        disabled={disabled}
        icon={<PrinterOutlined />}
        style={{
          height: 56,
          fontSize: 16,
          fontWeight: '600',
          borderRadius: '8px',
          background: disabled
            ? '#d9d9d9'
            : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          border: 'none',
          boxShadow: disabled
            ? 'none'
            : '0 6px 20px rgba(82, 196, 26, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(82, 196, 26, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(82, 196, 26, 0.3)';
          }
        }}
      >
        {isAdvanceBilling ? '🧾 Generate Advance Invoice' : '🧾 Generate Invoice'}
      </Button>
    </Card>
  );
};

export default OrderSummary;