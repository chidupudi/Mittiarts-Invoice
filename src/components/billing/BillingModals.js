// src/components/billing/BillingModals.js
import React from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Card,
  Select,
  Alert,
  Statistic,
  Descriptions,
  Tag,
  Divider,
  Typography
} from 'antd';
import {
  CheckOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  PayCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export const ProductModal = ({ 
  visible, 
  onCancel, 
  onAddProduct, 
  form, 
  businessType 
}) => {
  return (
    <Modal
      title="Add Custom Pottery Product"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={onAddProduct}>
        <Form.Item
          name="name"
          label="Product Name"
          rules={[{ required: true, message: 'Enter product name' }]}
        >
          <Input placeholder="e.g., Decorative Terracotta Vase" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="retailPrice"
              label="Retail Price"
              rules={[{ required: true, message: 'Enter retail price' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                placeholder="Retail price"
                prefix="₹"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="wholesalePrice"
              label="Wholesale Price"
              rules={[{ required: true, message: 'Enter wholesale price' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                placeholder="Wholesale price"
                prefix="₹"
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: 'Enter quantity' }]}
          initialValue={1}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            placeholder="Enter quantity"
          />
        </Form.Item>
        
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Add to Cart
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const CustomerModal = ({
  visible,
  onCancel,
  onAddCustomer,
  form,
  phoneNumber
}) => {
  // Pre-fill phone number when modal opens
  React.useEffect(() => {
    if (visible && phoneNumber) {
      form.setFieldsValue({ phone: phoneNumber });
    }
  }, [visible, phoneNumber, form]);

  return (
    <Modal
      title="Add New Customer"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={onAddCustomer}>
        <Form.Item
          name="name"
          label="Customer Name"
          rules={[{ required: true, message: 'Enter customer name' }]}
        >
          <Input placeholder="Enter customer name" autoFocus />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[
            { pattern: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit phone number' }
          ]}
          initialValue={phoneNumber}
        >
          <Input
            placeholder="Enter phone number"
            maxLength={10}
            disabled={!!phoneNumber}
            style={{
              backgroundColor: phoneNumber ? '#f5f5f5' : 'white',
              color: phoneNumber ? '#000' : undefined
            }}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { type: 'email', message: 'Enter valid email address' }
          ]}
        >
          <Input placeholder="Enter email address (optional)" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Add Customer
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const PriceEditModal = ({ 
  visible, 
  onCancel, 
  onApply, 
  editingItem, 
  newPrice, 
  onNewPriceChange 
}) => {
  return (
    <Modal
      title="Edit Price"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={onApply}>
          Apply Price
        </Button>
      ]}
      width={400}
    >
      {editingItem && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>{editingItem.product.name}</Text>
            <br />
            <Text type="secondary">Original Price: ₹{editingItem.originalPrice}</Text>
          </div>
          
          <InputNumber
            value={newPrice}
            onChange={onNewPriceChange}
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            prefix="₹"
            size="large"
            placeholder="Enter new price"
          />
          
          {newPrice < editingItem.originalPrice && (
            <Alert
              message={`Discount: ₹${(editingItem.originalPrice - newPrice).toFixed(2)} (${((editingItem.originalPrice - newPrice) / editingItem.originalPrice * 100).toFixed(1)}%)`}
              type="success"
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export const PaymentModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  totals, 
  selectedCustomer, 
  paymentMethod, 
  onPaymentMethodChange,
  businessType,
  currentLocation,
  banks,
  selectedBank,
  onBankChange,
}) => {
  const showBankSelection = paymentMethod && paymentMethod !== 'Cash';

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>Confirm Payment</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={onConfirm}
          icon={<CheckOutlined />}
          style={{
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            border: 'none'
          }}
        >
          Confirm & Generate Invoice
        </Button>
      ]}
      width={showBankSelection ? 600 : 500}
    >
      <div style={{ padding: '20px 0' }}>
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Row gutter={16} align="middle">
            <Col span={showBankSelection ? 8 : 12}>
              <Statistic
                title="Total Amount"
                value={totals.finalTotal}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </Col>
            <Col span={showBankSelection ? 8 : 12}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Payment Method:
                </Text>
                <Select
                  value={paymentMethod}
                  onChange={onPaymentMethodChange}
                  style={{ width: '100%' }}
                  size="large"
                >
                  {['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'].map(method => (
                    <Option key={method} value={method}>{method}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            {showBankSelection && (
              <Col span={8}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Bank:
                  </Text>
                  <Select
                    value={selectedBank}
                    onChange={onBankChange}
                    style={{ width: '100%' }}
                    size="large"
                    placeholder="Select Bank"
                  >
                    {banks.map(bank => (
                      <Option key={bank} value={bank}>{bank}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
            )}
          </Row>
        </Card>

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
            Order Summary:
          </Text>
          <Card size="small">
            <Row justify="space-between" style={{ marginBottom: 4 }}>
              <Text>Items:</Text>
              <Text>{totals.itemCount} ({totals.totalQuantity} qty)</Text>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 4 }}>
              <Text>Subtotal:</Text>
              <Text>₹{totals.subtotal.toFixed(2)}</Text>
            </Row>
            {totals.totalDiscount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Text>Discount:</Text>
                <Text style={{ color: '#fa8c16' }}>-₹{totals.totalDiscount.toFixed(2)}</Text>
              </Row>
            )}
            {totals.wholesaleDiscount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Text>Wholesale Discount:</Text>
                <Text style={{ color: '#722ed1' }}>-₹{totals.wholesaleDiscount.toFixed(2)}</Text>
              </Row>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <Row justify="space-between">
              <Text strong>Final Total:</Text>
              <Text strong style={{ color: '#52c41a' }}>₹{totals.finalTotal.toFixed(2)}</Text>
            </Row>
          </Card>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
            Customer Details:
          </Text>
          <Card size="small">
            <Row>
              <Col span={8}>
                <Text type="secondary">Name:</Text>
              </Col>
              <Col span={16}>
                <Text strong>{selectedCustomer?.name || 'Walk-in Customer'}</Text>
              </Col>
            </Row>
            {selectedCustomer?.phone && (
              <Row style={{ marginTop: 4 }}>
                <Col span={8}>
                  <Text type="secondary">Phone:</Text>
                </Col>
                <Col span={16}>
                  <Text>{selectedCustomer.phone}</Text>
                </Col>
              </Row>
            )}
            <Row style={{ marginTop: 4 }}>
              <Col span={8}>
                <Text type="secondary">Type:</Text>
              </Col>
              <Col span={16}>
                <Tag color={businessType === 'wholesale' ? 'orange' : 'blue'}>
                  {businessType === 'wholesale' ? '🏪 Wholesale' : '🛍️ Retail'}
                </Tag>
              </Col>
            </Row>
            <Row style={{ marginTop: 4 }}>
              <Col span={8}>
                <Text type="secondary">Location:</Text>
              </Col>
              <Col span={16}>
                <Tag color="#8b4513">
                  {currentLocation?.displayName || 'No location'}
                </Tag>
              </Col>
            </Row>
          </Card>
        </div>

        <Alert
          message="Please confirm the payment details before generating the invoice."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </div>
    </Modal>
  );
};

export const AdvancePaymentModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  totals, 
  selectedCustomer, 
  paymentMethod, 
  onPaymentMethodChange, 
  advanceAmount, 
  onAdvanceAmountChange, 
  remainingAmount, 
  businessType,
  banks,
  selectedBank,
  onBankChange
}) => {
  const showBankSelection = paymentMethod && paymentMethod !== 'Cash';
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PayCircleOutlined style={{ color: '#faad14' }} />
          <span>Confirm Advance Payment</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={onConfirm}
          icon={<CheckOutlined />}
          style={{
            background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
            border: 'none'
          }}
        >
          Confirm & Generate Advance Invoice
        </Button>
      ]}
      width={600}
    >
      <div style={{ padding: '20px 0' }}>
        <Alert
          message="Advance Billing"
          description="This will generate an advance payment invoice. The customer is making a partial payment now and will pay the remaining amount later."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}>
              <Statistic
                title="Total Amount"
                value={totals.finalTotal}
                prefix="₹"
                precision={2}
                valueStyle={{ fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Statistic
                title="Advance Payment"
                value={advanceAmount || 0}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
              <Statistic
                title="Remaining"
                value={remainingAmount || 0}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#fa541c', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>

        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={showBankSelection ? 8 : 12}>
              <Text strong>Advance Amount:</Text>
              <InputNumber
                value={advanceAmount}
                onChange={onAdvanceAmountChange}
                min={0}
                max={totals.finalTotal - 1}
                style={{ width: '100%', marginTop: 8 }}
                prefix="₹"
                size="large"
              />
            </Col>
            <Col span={showBankSelection ? 8 : 12}>
              <Text strong>Payment Method:</Text>
              <Select
                value={paymentMethod}
                onChange={onPaymentMethodChange}
                style={{ width: '100%', marginTop: 8 }}
                size="large"
              >
                {['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'].map(method => (
                  <Option key={method} value={method}>{method}</Option>
                ))}
              </Select>
            </Col>
            {showBankSelection && (
              <Col span={8}>
                <Text strong>Bank:</Text>
                <Select
                  value={selectedBank}
                  onChange={onBankChange}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                  placeholder="Select Bank"
                >
                  {banks.map(bank => (
                    <Option key={bank} value={bank}>{bank}</Option>
                  ))}
                </Select>
              </Col>
            )}
          </Row>
        </Card>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
            Customer Details:
          </Text>
          <Card size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                {selectedCustomer?.name || 'Walk-in Customer'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedCustomer?.phone || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={businessType === 'wholesale' ? 'orange' : 'blue'}>
                  {businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <Alert
          message="Important"
          description={`The customer will pay ₹${(advanceAmount || 0).toFixed(2)} now and ₹${(remainingAmount || 0).toFixed(2)} later. An advance invoice will be generated.`}
          type="info"
          showIcon
        />
      </div>
    </Modal>
  );
};

function BillingModals({
  showProductModal,
  productForm,
  handleAddDynamicProduct,
  handleCloseProductModal,
  showCustomerModal,
  customerForm,
  handleAddDynamicCustomer,
  handleCloseCustomerModal,
  showPriceModal,
  editingItem,
  newPrice,
  setNewPrice,
  applyNewPrice,
  handleClosePriceModal,
  showPaymentModal,
  totals,
  selectedCustomer,
  finalPaymentMethod,
  setFinalPaymentMethod,
  businessType,
  currentLocation,
  confirmAndGenerateInvoice,
  handleClosePaymentModal,
  showAdvanceModal,
  advanceAmount,
  setAdvanceAmount,
  remainingAmount,
  handleCloseAdvanceModal,
  banks,
  selectedBank,
  onBankChange
}) {
  return (
    <>
      <ProductModal
        visible={showProductModal}
        onCancel={handleCloseProductModal}
        onAddProduct={handleAddDynamicProduct}
        form={productForm}
        businessType={businessType}
      />

      <CustomerModal
        visible={showCustomerModal}
        onCancel={handleCloseCustomerModal}
        onAddCustomer={handleAddDynamicCustomer}
        form={customerForm}
      />

      <PriceEditModal
        visible={showPriceModal}
        onCancel={handleClosePriceModal}
        onApply={applyNewPrice}
        editingItem={editingItem}
        newPrice={newPrice}
        onNewPriceChange={setNewPrice}
      />

      <PaymentModal
        visible={showPaymentModal}
        onCancel={handleClosePaymentModal}
        onConfirm={confirmAndGenerateInvoice}
        totals={totals}
        selectedCustomer={selectedCustomer}
        paymentMethod={finalPaymentMethod}
        onPaymentMethodChange={setFinalPaymentMethod}
        businessType={businessType}
        currentLocation={currentLocation}
        banks={banks}
        selectedBank={selectedBank}
        onBankChange={onBankChange}
      />

      <AdvancePaymentModal
        visible={showAdvanceModal}
        onCancel={handleCloseAdvanceModal}
        onConfirm={confirmAndGenerateInvoice}
        totals={totals}
        selectedCustomer={selectedCustomer}
        paymentMethod={finalPaymentMethod}
        onPaymentMethodChange={setFinalPaymentMethod}
        advanceAmount={advanceAmount}
        onAdvanceAmountChange={setAdvanceAmount}
        remainingAmount={remainingAmount}
        businessType={businessType}
        banks={banks}
        selectedBank={selectedBank}
        onBankChange={onBankChange}
      />
    </>
  );
}

export default BillingModals;