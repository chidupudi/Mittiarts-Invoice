// src/components/customer/CustomerForm.js - Updated with 2 phone numbers
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Row, 
  Col, 
  message, 
  Card,
  Divider,
  Typography 
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  HomeOutlined,
  NumberOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { createCustomer, updateCustomer } from '../../features/customer/customerSlice';

const { Title, Text } = Typography;

const CustomerForm = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { selectedCustomer, loading } = useSelector(state => state.customers);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && selectedCustomer) {
      // Editing existing customer
      form.setFieldsValue({
        name: selectedCustomer.name || '',
        email: selectedCustomer.email || '',
        phone1: selectedCustomer.phone1 || selectedCustomer.phone || '', // Support old single phone field
        phone2: selectedCustomer.phone2 || '',
        street: selectedCustomer.address?.street || '',
        city: selectedCustomer.address?.city || '',
        state: selectedCustomer.address?.state || '',
        pincode: selectedCustomer.address?.pincode || '',
        gstNumber: selectedCustomer.gstNumber || ''
      });
    } else if (open) {
      // Adding new customer
      form.resetFields();
    }
  }, [open, selectedCustomer, form]);

  const handleSubmit = async (values) => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      console.log('Submitting customer:', values);
      
      // Validate required fields
      if (!values.name || values.name.trim() === '') {
        message.error('Customer name is required');
        setSubmitting(false);
        return;
      }

      // Validate at least one phone number
      if (!values.phone1 || values.phone1.trim() === '') {
        message.error('At least one phone number is required');
        setSubmitting(false);
        return;
      }

      const customerData = {
        name: values.name.trim(),
        email: values.email?.trim() || '',
        phone1: values.phone1?.trim() || '',
        phone2: values.phone2?.trim() || '',
        // Keep phone field for backward compatibility
        phone: values.phone1?.trim() || '',
        address: {
          street: values.street?.trim() || '',
          city: values.city?.trim() || '',
          state: values.state?.trim() || '',
          pincode: values.pincode?.trim() || ''
        },
        gstNumber: values.gstNumber?.trim() || ''
      };

      let result;
      if (selectedCustomer) {
        result = await dispatch(updateCustomer({ 
          id: selectedCustomer.id, 
          customerData 
        }));
        
        if (updateCustomer.fulfilled.match(result)) {
          message.success('Customer updated successfully!');
          onSuccess();
        } else {
          throw new Error(result.payload || 'Failed to update customer');
        }
      } else {
        result = await dispatch(createCustomer(customerData));
        
        if (createCustomer.fulfilled.match(result)) {
          message.success('Customer created successfully!');
          onSuccess();
        } else {
          throw new Error(result.payload || 'Failed to create customer');
        }
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      message.error('Error saving customer: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting && !loading) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <span>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={700}
      destroyOnClose
      maskClosable={false}
      styles={{
        header: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0'
        }
      }}
    >
      <div style={{ padding: '16px 0' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          {/* Basic Information */}
          <Card 
            size="small" 
            title={
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Basic Information
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Customer Name"
                  name="name"
                  rules={[
                    { required: true, message: 'Customer name is required' },
                    { min: 2, message: 'Name must be at least 2 characters' },
                    { max: 100, message: 'Name cannot exceed 100 characters' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                    placeholder="Enter customer name"
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  label="Primary Phone Number"
                  name="phone1"
                  rules={[
                    { required: true, message: 'Primary phone number is required' },
                    { pattern: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit phone number' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#52c41a' }} />}
                    placeholder="Enter primary phone number"
                    size="large"
                    maxLength={10}
                  />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  label="Secondary Phone Number"
                  name="phone2"
                  rules={[
                    { pattern: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit phone number' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#52c41a' }} />}
                    placeholder="Enter secondary phone number (optional)"
                    size="large"
                    maxLength={10}
                  />
                </Form.Item>
              </Col>
              
              <Col span={24}>
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { type: 'email', message: 'Enter valid email address' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#fa8c16' }} />}
                    placeholder="Enter email address (optional)"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Address Information */}
          <Card 
            size="small" 
            title={
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Address Information
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Street Address"
                  name="street"
                >
                  <Input
                    prefix={<HomeOutlined style={{ color: '#722ed1' }} />}
                    placeholder="Enter street address (optional)"
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  label="City"
                  name="city"
                >
                  <Input
                    placeholder="Enter city"
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  label="State"
                  name="state"
                >
                  <Input
                    placeholder="Enter state"
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  label="PIN Code"
                  name="pincode"
                  rules={[
                    { pattern: /^\d{6}$/, message: 'PIN code must be 6 digits' }
                  ]}
                >
                  <Input
                    placeholder="Enter PIN code"
                    size="large"
                    maxLength={6}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Business Information */}
          <Card 
            size="small" 
            title={
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Business Information
              </span>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="GST Number"
                  name="gstNumber"
                  rules={[
                    { 
                      pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
                      message: 'Enter valid GST number (15 characters)' 
                    }
                  ]}
                >
                  <Input
                    prefix={<NumberOutlined style={{ color: '#13c2c2' }} />}
                    placeholder="Enter GST number (optional)"
                    size="large"
                    maxLength={15}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      form.setFieldsValue({ gstNumber: value });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button 
              onClick={handleClose} 
              disabled={submitting || loading}
              size="large"
              icon={<CloseOutlined />}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting || loading}
              size="large"
              icon={<SaveOutlined />}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                minWidth: 140
              }}
            >
              {selectedCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CustomerForm;