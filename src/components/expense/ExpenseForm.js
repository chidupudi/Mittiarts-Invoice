// src/components/expense/ExpenseForm.js - Fixed infinite loop version
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Input, Select, DatePicker, Button, Row, Col, InputNumber, message } from 'antd';
import moment from 'moment';
import { createExpense, updateExpense } from '../../features/expense/expenseSlice';

const { Option } = Select;
const { TextArea } = Input;

const ExpenseForm = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { selectedExpense, loading } = useSelector(state => state.expenses);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Utilities',
    'Rent',
    'Salaries',
    'Maintenance',
    'Supplies',
    'Transportation',
    'Marketing',
    'Insurance',
    'Others'
  ];

  const paymentMethods = [
    'Cash',
    'Bank Transfer',
    'UPI',
    'Credit Card',
    'Debit Card',
    'Cheque'
  ];

  // Initialize form when modal opens or selectedExpense changes
  useEffect(() => {
    if (open) {
      if (selectedExpense) {
        // Editing existing expense
        const formValues = {
          title: selectedExpense.title || '',
          amount: selectedExpense.amount || 0,
          category: selectedExpense.category || '',
          date: selectedExpense.date ? moment(selectedExpense.date?.toDate?.() || selectedExpense.date) : moment(),
          paymentMethod: selectedExpense.paymentMethod || 'Cash',
          description: selectedExpense.description || '',
          receiptNumber: selectedExpense.receiptNumber || ''
        };
        
        form.setFieldsValue(formValues);
      } else {
        // Adding new expense
        const defaultValues = {
          title: '',
          amount: 0,
          category: '',
          date: moment(),
          paymentMethod: 'Cash',
          description: '',
          receiptNumber: ''
        };
        
        form.setFieldsValue(defaultValues);
      }
    }
  }, [open, selectedExpense, form]);

  const handleSubmit = async (values) => {
    if (submitting) return; // Prevent double submission
    
    setSubmitting(true);
    
    try {
      console.log('Submitting expense:', values);
      
      // Validate required fields
      if (!values.title || !values.amount || !values.category || !values.date || !values.paymentMethod) {
        message.error('Please fill all required fields');
        setSubmitting(false);
        return;
      }

      if (values.amount <= 0) {
        message.error('Amount must be greater than 0');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: values.title,
        amount: parseFloat(values.amount),
        category: values.category,
        date: values.date?.toDate ? values.date.toDate() : values.date.toDate(),
        paymentMethod: values.paymentMethod,
        description: values.description || '',
        receiptNumber: values.receiptNumber || `EXP-${Date.now()}`
      };

      let result;
      if (selectedExpense) {
        result = await dispatch(updateExpense({ 
          id: selectedExpense.id, 
          expenseData: payload 
        }));
        
        if (updateExpense.fulfilled.match(result)) {
          message.success('Expense updated successfully!');
          onSuccess();
        } else {
          throw new Error(result.payload || 'Failed to update expense');
        }
      } else {
        result = await dispatch(createExpense(payload));
        
        if (createExpense.fulfilled.match(result)) {
          message.success('Expense created successfully!');
          onSuccess();
        } else {
          throw new Error(result.payload || 'Failed to create expense');
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      message.error('Error saving expense: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSubmitting(false);
    onClose();
  };

  const handleFormChange = (changedFields, allFields) => {
    // Handle form changes if needed
    // This is where the infinite loop was happening before
    // Now we're not calling any state updates here
  };

  return (
    <Modal
      title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={700}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFieldsChange={handleFormChange}
        preserve={false}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Title"
              name="title"
              rules={[
                { required: true, message: 'Please enter expense title' },
                { min: 2, message: 'Title must be at least 2 characters' }
              ]}
            >
              <Input
                placeholder="Enter expense title"
                maxLength={100}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Amount (₹)"
              name="amount"
              rules={[
                { required: true, message: 'Please enter amount' },
                { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0.01}
                step={0.01}
                placeholder="Enter amount"
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\₹\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select placeholder="Select category">
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Select date"
                disabledDate={(current) => current && current > moment().endOf('day')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Payment Method"
              name="paymentMethod"
              rules={[{ required: true, message: 'Please select payment method' }]}
            >
              <Select placeholder="Select payment method">
                {paymentMethods.map(method => (
                  <Option key={method} value={method}>{method}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Receipt Number (Optional)"
              name="receiptNumber"
            >
              <Input
                placeholder="Enter receipt number (optional)"
                maxLength={50}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Description (Optional)"
              name="description"
            >
              <TextArea
                rows={4}
                placeholder="Enter description (optional)"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button 
              onClick={handleClose} 
              disabled={submitting || loading}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting || loading}
            >
              {selectedExpense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpenseForm;