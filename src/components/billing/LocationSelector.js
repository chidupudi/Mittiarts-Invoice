// src/components/billing/LocationSelector.js
import React from 'react';
import { Select, Radio, Space } from 'antd';
import { ShopOutlined, BankOutlined } from '@ant-design/icons';

const { Option, OptGroup } = Select;

const LocationSelector = ({ 
  selectedBranch, 
  setSelectedBranch, 
  businessType, 
  setBusinessType, 
  locations 
}) => {
  return (
    <Space direction="vertical" size="small" style={{ alignItems: 'flex-end' }}>
      {/* Branch Selection */}
      <Select
        value={selectedBranch}
        onChange={setSelectedBranch}
        style={{ width: 220 }}
        size="small"
        loading={!locations.length}
        placeholder="Select Location"
      >
        {locations.length > 0 ? (
          <>
            {/* Group by type */}
            {locations.filter(loc => loc.type === 'branch').length > 0 && (
              <OptGroup label="🏪 Permanent Branches">
                {locations.filter(loc => loc.type === 'branch').map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    🏪 {branch.name}
                  </Option>
                ))}
              </OptGroup>
            )}
            {locations.filter(loc => loc.type === 'stall').length > 0 && (
              <OptGroup label="🎪 Fair Stalls & Events">
                {locations.filter(loc => loc.type === 'stall').map(stall => (
                  <Option key={stall.id} value={stall.id}>
                    🎪 {stall.name} - {stall.eventName}
                  </Option>
                ))}
              </OptGroup>
            )}
          </>
        ) : (
          <Option disabled>No locations available</Option>
        )}
      </Select>
      
      {/* Business Type Selection */}
      <Radio.Group 
        value={businessType} 
        onChange={(e) => setBusinessType(e.target.value)}
        buttonStyle="solid"
        size="small"
      >
        <Radio.Button value="retail">
          <ShopOutlined /> Retail
        </Radio.Button>
        <Radio.Button value="wholesale">
          <BankOutlined /> Wholesale
        </Radio.Button>
      </Radio.Group>
    </Space>
  );
};

export default LocationSelector;