// src/components/estimation/EstimationMain.js - Main container with tabs
import React, { useState } from 'react';
import { Card, Tabs, Typography, Space } from 'antd';
import { 
  PlusOutlined, 
  UnorderedListOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import CreateEstimation from './CreateEstimation';
import EstimationList from './EstimationList';

const { Title, Text } = Typography;

const EstimationMain = () => {
  const [activeTab, setActiveTab] = useState('list');

  const tabItems = [
    {
      key: 'list',
      label: (
        <Space>
          <UnorderedListOutlined />
          <span>View Estimates</span>
        </Space>
      ),
      children: <EstimationList />
    },
    {
      key: 'create',
      label: (
        <Space>
          <PlusOutlined />
          <span>Create Estimate</span>
        </Space>
      ),
      children: <CreateEstimation />
    }
  ];

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)', 
        color: 'white', 
        padding: '20px 24px', 
        marginBottom: 0
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
            📋
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              Mitti Arts Estimations
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Create and manage pottery estimates for customers
            </Text>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div style={{ padding: '0' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{
            backgroundColor: 'white',
            minHeight: 'calc(100vh - 200px)'
          }}
          tabBarStyle={{
            background: 'white',
            margin: 0,
            paddingLeft: 24,
            paddingRight: 24,
            borderBottom: '1px solid #f0f0f0'
          }}
        />
      </div>
    </div>
  );
};

export default EstimationMain;