// src/components/public/PublicInvoice.js - Complete Public Invoice View
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Button,
  Row,
  Col,
  Card,
  Spin,
  Alert,
  Space,
  Tag,
  Descriptions,
  Table,
  Divider,
  message
} from 'antd';
import { 
  DownloadOutlined, 
  CheckCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MailOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';
import firebaseService from '../../services/firebaseService';

const { Title, Text } = Typography;

// Main store information for public view
const MAIN_STORE_INFO = {
  name: 'ART OF INDIAN POTTERY (Mitti arts)',
  address: 'Outlet: Opp. Romoji Film City, Main Gate, Near Maisamma Temple, Hyderabad.',
  phone: '9441550927 / 7382150250',
  gst: '36AMMPG0091P1ZN',
  email: 'info@mittiarts.com',
  website: 'www.mittiarts.com'
};

const PublicInvoice = () => {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchInvoiceByToken();
  }, [token]);

  const fetchInvoiceByToken = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching invoice with token:', token);

      // Use the new public access method
      const orderData = await firebaseService.getOrderByBillToken(token);

      // Get customer data if available
      if (orderData.customerId) {
        try {
          const customer = await firebaseService.getById('customers', orderData.customerId);
          orderData.customer = customer;
          console.log('✅ Customer data loaded');
        } catch (customerError) {
          console.warn('⚠️ Could not fetch customer data:', customerError);
          // Continue without customer data
        }
      }

      setOrder(orderData);
      console.log('✅ Invoice loaded successfully');
    } catch (err) {
      console.error('❌ Error fetching invoice:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!order) return;
    
    setDownloading(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) {
        throw new Error('Invoice content not found');
      }

      // Show loading message
      message.loading('Generating PDF...', 2);

      // Create canvas from the invoice content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Download the PDF
      const fileName = `Mitti-Arts-Invoice-${order.orderNumber}-${moment().format('YYYY-MM-DD')}.pdf`;
      pdf.save(fileName);
      
      message.destroy();
      message.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.destroy();
      message.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const itemColumns = [
    {
      title: '#',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
    },
    {
      title: 'Unit Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (price) => `₹${price.toFixed(2)}`,
    },
    {
      title: 'Total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (_, record) => `₹${(record.price * record.quantity).toFixed(2)}`,
    },
  ];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Card style={{ padding: '40px', textAlign: 'center', borderRadius: '12px', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>🏺</div>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 16, color: '#8b4513' }}>
            Loading your Mitti Arts invoice...
          </Title>
          <Text type="secondary">
            Please wait while we fetch your pottery invoice details
          </Text>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 500, textAlign: 'center', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>🏺</div>
          <Title level={3} style={{ color: '#8b4513' }}>Mitti Arts</Title>
          <Alert
            message="Invoice Not Found"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Text type="secondary">
            If you believe this is an error, please contact us at {MAIN_STORE_INFO.phone}
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button 
              type="primary" 
              style={{ 
                background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                border: 'none'
              }}
              onClick={() => window.location.href = 'tel:' + MAIN_STORE_INFO.phone.split(' / ')[0]}
            >
              Call Us Now
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      {/* Header with download button */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        marginBottom: '20px'
      }}>
        <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  🏺
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#8b4513' }}>
                    Your Mitti Arts Invoice
                  </Title>
                  <Text type="secondary">Thank you for choosing handcrafted pottery!</Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  style={{
                    borderColor: '#8b4513',
                    color: '#8b4513'
                  }}
                >
                  Print
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  size="large"
                  onClick={handleDownloadPDF}
                  loading={downloading}
                  style={{
                    background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  Download PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Invoice Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <Card 
          id="invoice-content"
          style={{
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(139, 69, 19, 0.1)'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
            color: 'white',
            padding: '30px',
            margin: '-24px -24px 24px -24px',
            borderRadius: '12px 12px 0 0'
          }}>
            <Row justify="space-between" align="middle">
              <Col>
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
                    fontSize: '28px'
                  }}>
                    🏺
                  </div>
                  <div>
                    <Title level={2} style={{ margin: 0, color: 'white' }}>
                      {MAIN_STORE_INFO.name}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                      Handcrafted Pottery & Terracotta Art
                    </Text>
                  </div>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: 'right' }}>
                  <Title level={2} style={{ margin: 0, color: 'white' }}>INVOICE</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                    #{order.orderNumber}
                  </Text>
                </div>
              </Col>
            </Row>
          </div>

          {/* Store & Customer Info */}
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card size="small" title="From" style={{ height: '100%' }}>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#8b4513' }}>
                    {MAIN_STORE_INFO.name}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <EnvironmentOutlined style={{ marginRight: 6, color: '#8b4513' }} />
                    {MAIN_STORE_INFO.address}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <PhoneOutlined style={{ marginRight: 6, color: '#8b4513' }} />
                    {MAIN_STORE_INFO.phone}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <MailOutlined style={{ marginRight: 6, color: '#8b4513' }} />
                    {MAIN_STORE_INFO.email}
                  </div>
                  <div>
                    <strong>GST:</strong> {MAIN_STORE_INFO.gst}
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="To" style={{ height: '100%' }}>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#8b4513' }}>
                    {order.customer?.name || 'Valued Customer'}
                  </div>
                  {order.customer?.phone && (
                    <div style={{ marginBottom: 6 }}>
                      <PhoneOutlined style={{ marginRight: 6, color: '#8b4513' }} />
                      {order.customer.phone}
                    </div>
                  )}
                  {order.customer?.email && (
                    <div style={{ marginBottom: 6 }}>
                      <MailOutlined style={{ marginRight: 6, color: '#8b4513' }} />
                      {order.customer.email}
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Tag color={order.businessType === 'wholesale' ? 'orange' : 'blue'}>
                      {order.businessType === 'wholesale' ? 'Wholesale Customer' : 'Retail Customer'}
                    </Tag>
                  </div>
                  {order.branchInfo?.name && (
                    <div style={{ marginTop: 8 }}>
                      <HomeOutlined style={{ marginRight: 6, color: '#8b4513' }} />
                      <Text type="secondary">{order.branchInfo.name}</Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Order Details */}
          <Descriptions
            bordered
            column={3}
            size="small"
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="Invoice Date">
              {moment(order.createdAt?.toDate?.() || order.createdAt).format('DD MMMM YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              <Tag color="green">{order.paymentMethod || 'Cash'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag 
                color={order.remainingAmount > 0 ? 'orange' : 'green'} 
                icon={order.remainingAmount > 0 ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
              >
                {order.isAdvanceBilling && order.remainingAmount > 0 ? 'Partial Payment' : 'Paid'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {/* Advance Payment Info */}
          {order.isAdvanceBilling && (
            <Alert
              message={
                order.remainingAmount > 0 
                  ? "Advance Payment Received" 
                  : "Payment Completed"
              }
              description={
                order.remainingAmount > 0 
                  ? `This is an advance payment invoice. Advance paid: ₹${order.advanceAmount?.toFixed(2)}. Remaining balance: ₹${order.remainingAmount?.toFixed(2)}`
                  : `All payments have been completed for this order. Thank you!`
              }
              type={order.remainingAmount > 0 ? "warning" : "success"}
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Items Table */}
          <Card title="Order Items" size="small" style={{ marginBottom: 24 }}>
            <Table
              columns={itemColumns}
              dataSource={order.items || []}
              pagination={false}
              rowKey={(item, index) => `${item.product?.id || index}`}
              size="small"
              footer={() => (
                <div style={{ textAlign: 'right' }}>
                  <Row justify="end">
                    <Col span={8}>
                      <div style={{ padding: '16px 0' }}>
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Subtotal:</span>
                          <span>₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        {(order.discount > 0 || order.wholesaleDiscount > 0) && (
                          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', color: '#fa8c16' }}>
                            <span>Discount:</span>
                            <span>-₹{((order.discount || 0) + (order.wholesaleDiscount || 0)).toFixed(2)}</span>
                          </div>
                        )}
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '18px', 
                          fontWeight: 'bold',
                          color: '#8b4513'
                        }}>
                          <span>Total Amount:</span>
                          <span>₹{order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                        {order.isAdvanceBilling && order.remainingAmount > 0 && (
                          <>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', color: '#52c41a' }}>
                              <span>Advance Paid:</span>
                              <span>₹{order.advanceAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              fontSize: '16px', 
                              fontWeight: 'bold',
                              color: '#fa541c'
                            }}>
                              <span>Balance Due:</span>
                              <span>₹{order.remainingAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            />
          </Card>

          {/* Footer */}
          <div style={{
            background: '#f9f9f9',
            padding: '20px',
            margin: '24px -24px -24px -24px',
            borderRadius: '0 0 12px 12px',
            textAlign: 'center'
          }}>
            <Title level={4} style={{ marginBottom: 8, color: '#8b4513' }}>
              Thank you for choosing Mitti Arts! 🏺
            </Title>
            <Text type="secondary">
              For any queries, contact us at {MAIN_STORE_INFO.phone}
            </Text>
            <br />
            <Text type="secondary">
              Visit us at: {MAIN_STORE_INFO.website}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              This is a computer-generated invoice and requires no signature.
            </Text>
          </div>
        </Card>
      </div>

      {/* Footer Message */}
      <div style={{
        maxWidth: '800px',
        margin: '20px auto 0',
        textAlign: 'center'
      }}>
        <Card style={{ borderRadius: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Space direction="vertical" size="small">
            <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
              🎉 Thank you for supporting traditional Indian pottery craftsmanship!
            </Title>
            <Text type="secondary">
              Follow us on social media for pottery tips and new collection updates
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="#8b4513">Handcrafted with Love</Tag>
              <Tag color="#cd853f">Eco-Friendly</Tag>
              <Tag color="#daa520">Traditional Art</Tag>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default PublicInvoice;