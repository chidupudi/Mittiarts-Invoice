// src/components/dashboard/DashboardLayout.js
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Layout,
  Menu,
  Avatar,
  Typography,
  Button,
  Dropdown,
  Badge,
  Divider,
  Tooltip,
} from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UserOutlined,
  ShopOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  NotificationOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';

import { logoutUser } from '../../features/auth/authSlice';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const menuItems = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined />, color: '#1976d2' },
  { key: 'products', path: '/products', label: 'Products', icon: <AppstoreOutlined />, color: '#9c27b0' },
  { key: 'customers', path: '/customers', label: 'Customers', icon: <UserOutlined />, color: '#2e7d32' },
  { key: 'billing', path: '/billing', label: 'Billing', icon: <ShoppingCartOutlined />, color: '#ed6c02' },
  { key: 'orders', path: '/orders', label: 'Orders', icon: <FileTextOutlined />, color: '#0288d1' },
  { key: 'invoices', path: '/invoices', label: 'Invoices', icon: <FilePdfOutlined />, color: '#7b1fa2' },
  { key: 'expenses', path: '/expenses', label: 'Expenses', icon: <WalletOutlined />, color: '#d32f2f' },
  { key: 'reports', path: '/reports', label: 'Reports', icon: <BarChartOutlined />, color: '#388e3c' },
];

const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const [collapsed, setCollapsed] = useState(false);

  console.log('DashboardLayout rendering - User:', user);
  console.log('Current location:', location.pathname);
  console.log('Children:', children);

  const selectedKey = (() => {
    for (const item of menuItems) {
      if (location.pathname === item.path) return item.key;
      if (item.key === 'reports' && location.pathname.startsWith('/reports')) return 'reports';
      if (item.key === 'invoices' && location.pathname.startsWith('/invoices')) return 'invoices';
    }
    return 'dashboard';
  })();

  const onMenuClick = ({ key }) => {
    console.log('Menu clicked:', key);
    const item = menuItems.find(i => i.key === key);
    if (item) {
      console.log('Navigating to:', item.path);
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    try {
      await dispatch(logoutUser());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const profileItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings')
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: 'red' }} />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  const notificationItems = [
    {
      key: 'no-notifications',
      disabled: true,
      label: 'No notifications yet'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        width={280}
        theme="light"
        style={{
          boxShadow: '2px 0 6px rgba(0,21,41,.35)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            height: 80,
            margin: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontWeight: 'bold',
            fontSize: 20,
            color: '#1890ff'
          }}
        >
          <ShopOutlined style={{ fontSize: 32 }} />
          {!collapsed && (
            <div>
              <Title level={5} style={{ margin: 0 }}>
                Mitti Arts
              </Title>
              <Text type="secondary">POS System</Text>
            </div>
          )}
        </div>

        <Divider />

        <div style={{ padding: '0 16px', marginBottom: 12, backgroundColor: '#f0f5ff', borderRadius: 4 }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff', fontSize: 20 }}>
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </Avatar>
          {!collapsed && (
            <div style={{ marginLeft: 12, display: 'inline-block', verticalAlign: 'middle', maxWidth: 180 }}>
              <Text strong ellipsis>
                {user?.displayName || 'User'}
              </Text>
              <br />
              <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                {user?.email}
              </Text>
            </div>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ flex: 1, borderRight: 0 }}
          onClick={onMenuClick}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            style: { color: selectedKey === item.key ? item.color : undefined }
          }))}
        />

        <Divider />

        <div style={{ padding: 16, textAlign: 'center', marginTop: 'auto' }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
            Version 1.0.0
          </Text>
          <Text type="secondary" style={{ fontSize: 10 }}>
            &copy; 2023 Mitti Arts POS
          </Text>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}
        >
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            style={{ fontSize: 20 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Dropdown menu={{ items: notificationItems }} trigger={['click']}>
              <Badge count={0} offset={[0, 0]}>
                <Tooltip title="Notifications">
                  <Button shape="circle" icon={<NotificationOutlined />} />
                </Tooltip>
              </Badge>
            </Dropdown>

            <Dropdown menu={{ items: profileItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size={32} src={user?.photoURL}>
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;