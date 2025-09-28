// src/components/billing/CustomerSelection.js
import React from 'react';
import { Row, Col, Select, Button, Card, Tag } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

const { Option } = Select;

const CustomerSelection = ({
  selectedCustomer,
  customers,
  onSelectCustomer,
  onShowCustomerModal
}) => {
  return (
    <Row gutter={8}>
      <Col span={18}>
        <Select
          showSearch
          style={{
            width: '100%',
            height: '40px'
          }}
          placeholder="👤 Search and select customer..."
          value={selectedCustomer?.id}
          onChange={(value) => {
            const customer = customers.find(c => c.id === value);
            onSelectCustomer(customer || null);
          }}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
          size="large"
        >
          {customers.map(customer => (
            <Option key={customer.id} value={customer.id}>
              {`${customer.name}${customer.phone ? ` (${customer.phone})` : ''}`}
              {customer.businessType && (
                <Tag color={customer.businessType === 'wholesale' ? 'orange' : 'blue'} size="small" style={{ marginLeft: 4 }}>
                  {customer.businessType}
                </Tag>
              )}
            </Option>
          ))}
        </Select>
      </Col>
      <Col span={6}>
        <Button
          icon={<UserAddOutlined />}
          onClick={onShowCustomerModal}
          block
          size="large"
          type="primary"
          style={{
            height: '40px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 69, 19, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.3)';
          }}
        >
          New Customer
        </Button>
      </Col>
    </Row>
  );
};

export default CustomerSelection;