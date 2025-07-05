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
    <Card 
      title="Customer Selection" 
      size="small"
      bodyStyle={{ padding: '12px' }}
    >
      <Row gutter={8}>
        <Col span={18}>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Select Customer"
            value={selectedCustomer?.id}
            onChange={(value) => {
              const customer = customers.find(c => c.id === value);
              onSelectCustomer(customer || null);
            }}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            size="small"
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
            size="small"
          >
            Add
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default CustomerSelection;