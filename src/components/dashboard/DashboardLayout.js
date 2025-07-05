// src/components/dashboard/DashboardLayout.js - Mobile Optimized with Store Front
import React, { useState, useEffect } from 'react';
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
  Drawer,
  Grid,
} from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UserOutlined,
  ShopOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  MenuOutlined,
  LogoutOutlined,
  SettingOutlined,
  NotificationOutlined,
  FilePdfOutlined,
  CloseOutlined,
  HomeOutlined,
} from '@ant-design/icons';

import { logoutUser } from '../../features/auth/authSlice';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const menuItems = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined />, color: '#1976d2' },
  { key: 'products', path: '/products', label: 'Products', icon: <AppstoreOutlined />, color: '#9c27b0' },
  { key: 'customers', path: '/customers', label: 'Customers', icon: <UserOutlined />, color: '#2e7d32' },
  { key: 'billing', path: '/billing', label: 'Billing', icon: <ShoppingCartOutlined />, color: '#ed6c02' },
  { key: 'orders', path: '/orders', label: 'Orders', icon: <FileTextOutlined />, color: '#0288d1' },
  { key: 'invoices', path: '/invoices', label: 'Invoices', icon: <FilePdfOutlined />, color: '#7b1fa2' },
  { key: 'storefront', path: '/storefront', label: 'Store Front', icon: <HomeOutlined />, color: '#8b4513' },
];

const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const screens = useBreakpoint();

  // State for sidebar management
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and auto-collapse sidebar
  useEffect(() => {
    const mobile = !screens.lg;
    setIsMobile(mobile);
    
    if (mobile) {
      setCollapsed(true);
      setMobileDrawerOpen(false);
    } else {
      setCollapsed(false);
    }
  }, [screens]);

  console.log('DashboardLayout rendering - User:', user);
  console.log('Current location:', location.pathname);
  console.log('Is Mobile:', isMobile);

  const selectedKey = (() => {
    for (const item of menuItems) {
      if (location.pathname === item.path) return item.key;
      if (item.key === 'invoices' && location.pathname.startsWith('/invoices')) return 'invoices';
      if (item.key === 'storefront' && location.pathname.startsWith('/storefront')) return 'storefront';
    }
    return 'dashboard';
  })();

  const onMenuClick = ({ key }) => {
    console.log('Menu clicked:', key);
    const item = menuItems.find(i => i.key === key);
    if (item) {
      console.log('Navigating to:', item.path);
      navigate(item.path);
      
      // Close mobile drawer after navigation
      if (isMobile) {
        setMobileDrawerOpen(false);
      }
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

  // Render sidebar content
  const renderSidebarContent = () => (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #8b4513 0%, #a0522d 100%)'
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed && !isMobile ? '16px 12px' : '16px',
        display: 'flex',
        alignItems: 'center',
        gap: collapsed && !isMobile ? 0 : 12,
        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        background: 'rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        color: 'white'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8b4513',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          🏺
        </div>
        {(!collapsed || isMobile) && (
          <div>
            <Title level={5} style={{ margin: 0, color: 'white' }}>
              Mitti Arts
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
              POS System
            </Text>
          </div>
        )}
      </div>

      {/* User Info */}
      {(!collapsed || isMobile) && (
        <div style={{ 
          padding: '12px 16px', 
          background: 'rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar 
              size={32} 
              style={{ backgroundColor: 'white', color: '#8b4513', fontSize: '14px' }}
            >
              {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text strong style={{ color: 'white', fontSize: '13px', display: 'block' }}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '11px',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.email}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div style={{ flex: 1, padding: '8px 0' }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={onMenuClick}
          style={{ 
            background: 'transparent',
            border: 'none',
            color: 'white'
          }}
          theme="dark"
          inlineCollapsed={collapsed && !isMobile}
          items={menuItems.map(item => ({
            key: item.key,
            icon: <span style={{ fontSize: '16px' }}>{item.icon}</span>,
            label: item.label,
            style: { 
              color: selectedKey === item.key ? '#fff' : 'rgba(255,255,255,0.8)',
              backgroundColor: selectedKey === item.key ? 'rgba(255,255,255,0.2)' : 'transparent',
              borderRadius: '6px',
              margin: '4px 8px',
              height: '42px',
              lineHeight: '42px'
            }
          }))}
        />
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '12px', 
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.1)'
      }}>
        {(!collapsed || isMobile) && (
          <>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', display: 'block' }}>
              Version 1.0.0
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>
              &copy; 2024 Mitti Arts
            </Text>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={260}
          collapsedWidth={60}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
          }}
          theme="light"
        >
          {renderSidebarContent()}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={260}
          style={{ padding: 0 }}
          bodyStyle={{ padding: 0 }}
          headerStyle={{ display: 'none' }}
          closeIcon={<CloseOutlined style={{ color: 'white' }} />}
        >
          {renderSidebarContent()}
        </Drawer>
      )}

      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 60 : 260),
        transition: 'margin-left 0.2s'
      }}>
        {/* Header */}
        <Header style={{
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          {/* Left side - Menu button for mobile or collapse button for desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: '18px' }} />}
                onClick={() => setMobileDrawerOpen(true)}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#8b4513',
                  color: 'white'
                }}
              />
            ) : (
              <Button
                type="text"
                onClick={() => setCollapsed(!collapsed)}
                icon={<MenuOutlined />}
                style={{ fontSize: '16px' }}
              />
            )}

            {/* Page Title for mobile */}
            {isMobile && (
              <div>
                <Title level={5} style={{ margin: 0, color: '#8b4513' }}>
                  {menuItems.find(item => item.key === selectedKey)?.label || 'Dashboard'}
                </Title>
              </div>
            )}
          </div>

          {/* Right side - Notifications and Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown menu={{ items: notificationItems }} trigger={['click']}>
              <Badge count={0} offset={[0, 0]}>
                <Tooltip title="Notifications">
                  <Button 
                    shape="circle" 
                    icon={<NotificationOutlined />}
                    style={{ border: 'none', boxShadow: 'none' }}
                  />
                </Tooltip>
              </Badge>
            </Dropdown>

            <Dropdown menu={{ items: profileItems }} placement="bottomRight">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}>
                <Avatar size={32} src={user?.photoURL}>
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
                {!isMobile && (
                  <div style={{ minWidth: 0 }}>
                    <Text strong style={{ fontSize: '13px', display: 'block' }}>
                      {user?.displayName || 'User'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {user?.email}
                    </Text>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content style={{ 
          margin: isMobile ? '8px' : '16px',
          padding: isMobile ? '12px' : '24px',
          minHeight: 'calc(100vh - 64px)',
          background: '#f5f5f5',
          borderRadius: isMobile ? '8px' : '12px'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;