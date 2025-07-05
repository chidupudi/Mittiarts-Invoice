// src/components/auth/Login.js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Card,
  Space,
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser, clearError } from '../../features/auth/authSlice';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector(state => state.auth);

  const handleSubmit = async (values) => {
    try {
      const result = await dispatch(loginUser(values));
      if (result.type === 'auth/login/fulfilled') {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleChange = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Card
        style={{ width: 400 }}
        title={
          <Space direction="vertical" style={{ width: '100%' }} align="center">
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Mitti Arts</Title>
            <Title level={4}>Sign In</Title>
          </Space>
        }
      >
        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onChange={handleChange}
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[{ required: true, message: 'Please enter your email!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email Address" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              visibilityToggle
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;