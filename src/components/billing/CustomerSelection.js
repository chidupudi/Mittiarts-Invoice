// src/components/billing/CustomerSelection.js
import { useState } from 'react';
import { Button, Input, message } from 'antd';
import { UserAddOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';

const CustomerSelection = ({
  selectedCustomer,
  customers,
  onSelectCustomer,
  onShowCustomerModal,
  onPhoneNumberChange
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setPhoneNumber(value);

    // Pass phone number to parent
    if (onPhoneNumberChange) {
      onPhoneNumberChange(value);
    }

    // Auto-search when 10 digits entered
    if (value.length === 10) {
      searchCustomerByPhone(value);
    } else if (value.length < 10) {
      onSelectCustomer(null);
    }
  };

  const searchCustomerByPhone = (phone) => {
    // Search for customer by phone number
    const customer = customers.find(c => c.phone === phone);

    if (customer) {
      // Customer found - auto-select
      onSelectCustomer(customer);
      message.success(`Customer found: ${customer.name}`);
    } else {
      // Customer not found - show "New Customer" button
      onSelectCustomer(null);
      message.info('New customer - please add details');
    }
  };

  return (
    <div>
      {/* Phone Input - Full Width */}
      <Input
        prefix={<PhoneOutlined style={{ color: '#8b4513', fontSize: '14px' }} />}
        suffix={
          selectedCustomer ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
          ) : null
        }
        placeholder="Enter mobile number"
        value={phoneNumber}
        onChange={handlePhoneChange}
        maxLength={10}
        style={{
          height: '32px',
          borderRadius: '4px',
          borderColor: selectedCustomer ? '#52c41a' : '#d9d9d9',
          borderWidth: selectedCustomer ? '2px' : '1px',
          fontSize: '13px',
          lineHeight: '32px',
          display: 'flex',
          alignItems: 'center'
        }}
        disabled={!!selectedCustomer}
      />

      {/* Action Button Row - Below Phone Input */}
      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        {selectedCustomer ? (
          <>
            <Button
              onClick={() => {
                onSelectCustomer(null);
                setPhoneNumber('');
              }}
              size="small"
              style={{
                flex: 1,
                height: '28px',
                borderRadius: '4px',
                fontWeight: '500',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1'
              }}
            >
              Change Customer
            </Button>
            <Button
              icon={<UserAddOutlined style={{ fontSize: '12px' }} />}
              onClick={() => {
                onSelectCustomer(null);
                setPhoneNumber('');
                onShowCustomerModal();
              }}
              size="small"
              type="primary"
              style={{
                flex: 1,
                height: '28px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                border: 'none',
                boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)',
                fontWeight: '500',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 69, 19, 0.3)';
              }}
            >
              Add New
            </Button>
          </>
        ) : phoneNumber.length === 10 ? (
          <Button
            icon={<UserAddOutlined style={{ fontSize: '12px' }} />}
            onClick={onShowCustomerModal}
            block
            size="small"
            type="primary"
            style={{
              height: '28px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)',
              fontWeight: '500',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 69, 19, 0.3)';
            }}
          >
            Add New Customer
          </Button>
        ) : phoneNumber.length > 0 ? (
          <div style={{
            fontSize: '11px',
            color: '#8c8c8c',
            textAlign: 'center',
            padding: '4px 0',
            width: '100%'
          }}>
            Enter {10 - phoneNumber.length} more digit{10 - phoneNumber.length > 1 ? 's' : ''}
          </div>
        ) : (
          <Button
            icon={<UserAddOutlined style={{ fontSize: '12px' }} />}
            onClick={onShowCustomerModal}
            block
            size="small"
            type="dashed"
            style={{
              height: '28px',
              borderRadius: '4px',
              borderColor: '#8b4513',
              color: '#8b4513',
              fontWeight: '500',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#a0522d';
              e.currentTarget.style.color = '#a0522d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#8b4513';
              e.currentTarget.style.color = '#8b4513';
            }}
          >
            Add New Customer
          </Button>
        )}
      </div>
    </div>
  );
};

export default CustomerSelection;