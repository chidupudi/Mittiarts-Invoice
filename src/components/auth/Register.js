// src/components/auth/Register.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Card,
} from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { registerUser, clearError } from '../../features/auth/authSlice';

const { Title, Text } = Typography;

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleChange = (changedValues) => {
    setFormData({ ...formData, ...changedValues });
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async () => {
    const { username, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      form.setFields([
        {
          name: 'confirmPassword',
          errors: ['Passwords do not match'],
        },
      ]);
      return;
    }

    if (password.length < 6) {
      form.setFields([
        {
          name: 'password',
          errors: ['Password must be at least 6 characters'],
        },
      ]);
      return;
    }

    try {
      const result = await dispatch(
        registerUser({ username, email, password })
      );
      if (result.type === 'auth/register/fulfilled') {
        navigate('/');
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0', minHeight: '100vh' }}>
      <Card style={{ width: 400 }} bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 0 }}>Mitti Arts</Title>
          <Text type="secondary">Create Account</Text>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, allValues) => handleChange(allValues)}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email Address" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            rules={[{ required: true, message: 'Please confirm your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text>
            Already have an account?{' '}
            <RouterLink to="/login">Sign in here</RouterLink>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;