// src/components/billing/AdvancePayment.js
import React from 'react';
import { Card, Row, Col, Typography, Space, InputNumber } from 'antd';
import { PayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AdvancePayment = ({ 
  advanceAmount, 
  remainingAmount, 
  totalAmount,
  onAdvanceAmountChange 
}) => {
  return (
    <Card 
      title={
        <Space>
          <PayCircleOutlined />
          <span>Advance Payment</span>
        </Space>
      }
      size="small"
      style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591' }}
      bodyStyle={{ padding: '12px' }}
    >
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col span={12}>
          <Text style={{ fontSize: '12px' }}>Advance Amount:</Text>
          <InputNumber
            value={advanceAmount}
            onChange={onAdvanceAmountChange}
            min={0}
            max={totalAmount}
            style={{ width: '100%' }}
            prefix="₹"
            size="small"
          />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '12px' }}>Remaining:</Text>
          <div style={{ 
            padding: '4px 8px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px',
            fontWeight: 'bold',
            color: remainingAmount > 0 ? '#fa541c' : '#52c41a'
          }}>
            ₹{remainingAmount.toFixed(2)}
          </div>
        </Col>
      </Row>
      <div style={{ fontSize: '11px', color: '#666' }}>
        Customer will pay ₹{advanceAmount} now and ₹{remainingAmount.toFixed(2)} later
      </div>
    </Card>
  );
};

export default AdvancePayment;