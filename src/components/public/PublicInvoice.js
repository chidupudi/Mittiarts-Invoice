// src/components/public/PublicInvoice.js - Clean Mitti Arts Style
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
  Result,
  message
} from 'antd';
import { 
  DownloadOutlined, 
  CheckCircleOutlined,
  PhoneOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';
import firebaseService from '../../services/firebaseService';

const { Title, Text } = Typography;

// Store Information
const MAIN_STORE_INFO = {
  name: 'ART OF INDIAN POTTERY',
  subtitle: 'Mfr: Pottery Articulture, Eco-Ganesha, Eco-Filters, Cooking Pots, Diyas, Terracotta, Sculptures, and all types of art works',
  address: 'Studio: Opp. Ramoji Film City Main Gate, Near Maisamma Temple, Abdullapurmet (Vill. & Mdl.), Ranga Reddy Dist. - 501 505, Telangana.',
  email: 'mittiarts@gmail.com',
  website: 'www.mittiarts.com',
  phone: '8885515554, 9441550927, 7382150250',
  gstin: '36AMMPG0091P1ZN',
  logo: 'https://ik.imagekit.io/mittiarts/Logo%20final%20jpg.jpg?updatedAt=1753566864506'
};

const invoiceStyles = `
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
  }
  
  .invoice-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border: 2px solid #000;
    font-family: Arial, sans-serif;
    font-size: 12px;
  }
  
  .invoice-header {
    text-align: center;
    padding: 15px;
    border-bottom: 1px solid #000;
  }
  
  .logo-container {
    width: 60px;
    height: 60px;
    border: 1px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .company-name {
    font-size: 20px;
    font-weight: bold;
    margin: 5px 0;
    color: #8b4513;
  }
  
  .company-details {
    font-size: 10px;
    margin: 2px 0;
    line-height: 1.3;
  }
  
  .invoice-title {
    text-align: center;
    padding: 8px;
    border-bottom: 1px solid #000;
    font-weight: bold;
    background-color: #f0f0f0;
    font-size: 16px;
  }
  
  .gstin-section {
    text-align: center;
    padding: 5px;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
  
  .invoice-info {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #000;
  }
  
  .invoice-details {
    flex: 1;
    border-right: 1px solid #000;
    padding-right: 10px;
  }
  
  .customer-details {
    flex: 1;
    padding-left: 10px;
  }
  
  .customer-section {
    padding: 10px;
    border-bottom: 1px solid #000;
    text-align: right;
  }
  
  .advance-alert {
    padding: 10px;
    background-color: #fff7e6;
    border-bottom: 1px solid #000;
    text-align: center;
    border-left: 4px solid #fa8c16;
  }
  
  .items-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .items-table th,
  .items-table td {
    border: 1px solid #000;
    padding: 8px 5px;
    text-align: left;
    font-size: 11px;
  }
  
  .items-table th {
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
  }
  
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  
  .totals-section {
    display: flex;
    min-height: 100px;
  }
  
  .amount-words {
    flex: 1;
    border-right: 1px solid #000;
    padding: 15px;
  }
  
  .totals-column {
    width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
    font-size: 18px;
    font-weight: bold;
  }
  
  .signature-section {
    text-align: right;
    padding: 25px;
    border-top: 1px solid #000;
  }
  
  .footer {
    text-align: center;
    padding: 15px;
    border-top: 1px solid #000;
    background-color: #333;
    color: white;
    font-size: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }
  
  .qr-container {
    width: 80px;
    height: 80px;
    background: white;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .qr-image {
    width: 70px;
    height: 70px;
  }
`;

const PublicInvoice = () => {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvoiceByToken();
    } else {
      setError('Invalid invoice link - no token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchInvoiceByToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientIp = getClientIP();
      const orderData = await firebaseService.getOrderByBillToken(token, clientIp);
      setOrder(orderData);
    } catch (err) {
      console.error('Error accessing public invoice:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = () => {
    return 'unknown';
  };

  // Convert number to words
  const numberToWords = (amount) => {
    if (amount === 0) return "Zero Rupees Only";
    
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const convertHundreds = (num) => {
      let result = "";
      if (num > 99) {
        result += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
      }
      if (num > 19) {
        result += tens[Math.floor(num / 10)] + " ";
        num %= 10;
      } else if (num > 9) {
        result += teens[num - 10] + " ";
        return result;
      }
      if (num > 0) {
        result += ones[num] + " ";
      }
      return result;
    };
    
    const integerPart = Math.floor(amount);
    let words = "";
    
    if (integerPart > 99999) {
      words += convertHundreds(Math.floor(integerPart / 100000)) + "Lakh ";
      integerPart %= 100000;
    }
    
    if (integerPart > 999) {
      words += convertHundreds(Math.floor(integerPart / 1000)) + "Thousand ";
      integerPart %= 1000;
    }
    
    words += convertHundreds(integerPart);
    words += "Rupees Only";
    
    return words;
  };

  const handleDownloadPDF = async () => {
    if (!order) return;
    
    setDownloading(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) {
        throw new Error('Invoice content not found');
      }

      message.loading('Generating your Mitti Arts invoice PDF...', 2);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
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
      
      const fileName = `Mitti-Arts-Invoice-${order.orderNumber}-${moment().format('YYYY-MM-DD')}.pdf`;
      pdf.save(fileName);
      
      message.destroy();
      message.success('Invoice downloaded successfully! 🎉');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.destroy();
      message.error('Failed to download invoice. Please try again or contact us.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleContactUs = () => {
    window.location.href = `tel:${MAIN_STORE_INFO.phone.split(', ')[0]}`;
  };

  // Loading state
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
            Loading Your Mitti Arts Invoice
          </Title>
          <Text type="secondary">
            Fetching your handcrafted pottery invoice details...
          </Text>
          <div style={{ marginTop: 16 }}>
            <Text style={{ fontSize: '12px', color: '#666' }}>
              🔒 Secure access • Token: {token?.slice(0, 10)}...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
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
        <Card style={{ maxWidth: 600, textAlign: 'center', borderRadius: '12px' }}>
          <Result
            icon={<div style={{ fontSize: '72px' }}>🏺</div>}
            title={<Title level={3} style={{ color: '#8b4513' }}>Mitti Arts</Title>}
            status="error"
            subTitle={
              <div>
                <Alert
                  message={
                    error.includes('expired') ? 'Invoice Link Expired' :
                    error.includes('Too many requests') ? 'Too Many Requests' :
                    error.includes('Invalid invoice link format') ? 'Invalid Link Format' :
                    'Invoice Not Found'
                  }
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16, textAlign: 'left' }}
                />
                
                <div style={{ marginTop: 16, fontSize: '14px', color: '#666', textAlign: 'left' }}>
                  <Title level={5}>What you can do:</Title>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>Contact us for a new invoice link</li>
                    <li>Check if you copied the complete link from SMS</li>
                    <li>Try again after a few minutes if rate limited</li>
                  </ul>
                </div>
              </div>
            }
            extra={[
              <Button 
                key="contact"
                type="primary" 
                size="large"
                style={{ 
                  background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                  border: 'none',
                  marginRight: 8
                }}
                onClick={handleContactUs}
                icon={<PhoneOutlined />}
              >
                Call Us
              </Button>,
              <Button 
                key="retry"
                size="large"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            ]}
          />
          
          <div style={{ marginTop: 24, fontSize: '12px', color: '#666' }}>
            <Text type="secondary">
              For assistance, call us at {MAIN_STORE_INFO.phone} or email {MAIN_STORE_INFO.email}
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const finalTotal = order.total || 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <style>{invoiceStyles}</style>
      
      {/* Header with download button */}
      <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '20px' }}>
        <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)' }} className="no-print">
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
                  <div style={{ marginTop: 4 }}>
                    <Tag color="green" size="small">
                      <SafetyCertificateOutlined /> Secure Access
                    </Tag>
                    <Tag color="#8b4513" size="small">
                      Order: {order.orderNumber}
                    </Tag>
                  </div>
                </div>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  style={{ borderColor: '#8b4513', color: '#8b4513' }}
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div id="invoice-content" className="invoice-container">
          
          {/* Header */}
          <div className="invoice-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              <div className="logo-container">
                <img 
                  src={MAIN_STORE_INFO.logo} 
                  alt="Mitti Arts Logo" 
                  className="logo-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none', fontSize: '24px', color: '#8b4513' }}>🏺</div>
              </div>
              <div>
                <div className="company-name">{MAIN_STORE_INFO.name}</div>
                <div className="company-details">{MAIN_STORE_INFO.subtitle}</div>
              </div>
            </div>
            <div className="company-details" style={{ marginTop: '10px' }}>
              {MAIN_STORE_INFO.address}
            </div>
            <div className="company-details" style={{ marginTop: '5px' }}>
              E-mail: {MAIN_STORE_INFO.email}, {MAIN_STORE_INFO.website}
            </div>
            <div className="company-details">
              Cell: {MAIN_STORE_INFO.phone}
            </div>
          </div>

          {/* TAX INVOICE Title */}
          <div className="invoice-title">
            TAX INVOICE
          </div>

          {/* GSTIN */}
          <div className="gstin-section">
            GSTIN: {MAIN_STORE_INFO.gstin}
          </div>

          {/* Invoice Details Section */}
          <div className="invoice-info">
            <div className="invoice-details">
              <div><strong>P.O. No.</strong></div>
              <div style={{ marginTop: '15px' }}><strong>Date:</strong> {moment(order.createdAt?.toDate?.() || order.createdAt).format('DD/MM/YYYY')}</div>
            </div>
            <div style={{ flex: 1, borderRight: '1px solid #000', borderLeft: '1px solid #000', paddingLeft: '10px', paddingRight: '10px' }}>
              <div><strong>DC No.</strong></div>
              <div style={{ marginTop: '15px' }}><strong>Date:</strong></div>
            </div>
            <div className="customer-details">
              <div><strong>Invoice No.</strong> {order.orderNumber}</div>
              <div style={{ marginTop: '15px' }}><strong>Date:</strong> {moment(order.createdAt?.toDate?.() || order.createdAt).format('DD/MM/YYYY')}</div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="customer-section">
            <div><strong>M/s. {order.customer?.name || 'Walk-in Customer'}</strong></div>
            {order.customer?.phone && (
              <div style={{ marginTop: '5px' }}>Ph: {order.customer.phone}</div>
            )}
            <div style={{ marginTop: '10px' }}>
              <strong>GSTIN: ________________________________</strong>
            </div>
          </div>

          {/* Advance Payment Alert */}
          {order.isAdvanceBilling && order.remainingAmount > 0 && (
            <div className="advance-alert">
              <strong style={{ color: '#fa8c16' }}>
                ⚠️ ADVANCE PAYMENT INVOICE - Balance Due: ₹{order.remainingAmount?.toFixed(2)}
              </strong>
            </div>
          )}

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>S.No</th>
                <th style={{ width: '80px' }}>HSN Code</th>
                <th>DESCRIPTION</th>
                <th style={{ width: '80px' }}>QTY.</th>
                <th style={{ width: '100px' }}>RATE</th>
                <th style={{ width: '120px' }}>AMOUNT Rs.</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-center">-</td>
                  <td>{item.product?.name || 'Product'}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{item.price.toFixed(2)}</td>
                  <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              {/* Empty rows for padding */}
              {Array.from({ length: Math.max(0, 10 - order.items.length) }).map((_, index) => (
                <tr key={`empty-${index}`} style={{ height: '30px' }}>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="totals-section">
            <div className="amount-words">
              <strong>Amount in Words:</strong>
              <div style={{ marginTop: '10px', lineHeight: '1.4' }}>
                {numberToWords(finalTotal)}
              </div>
              {/* Advance payment info */}
              {order.isAdvanceBilling && (
                <div style={{ marginTop: '20px', fontSize: '11px', lineHeight: '1.3' }}>
                  <div><strong>Payment Summary:</strong></div>
                  <div>Total Amount: ₹{finalTotal.toFixed(2)}</div>
                  <div style={{ color: '#52c41a' }}>Advance Paid: ₹{(order.advanceAmount || 0).toFixed(2)}</div>
                  {order.remainingAmount > 0 && (
                    <div style={{ color: '#fa541c' }}>
                      <strong>Balance Due: ₹{order.remainingAmount.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="totals-column">
              <div>
                <div style={{ fontSize: '14px', marginBottom: '5px' }}>TOTAL</div>
                <div style={{ fontSize: '20px', color: '#8b4513' }}>₹{finalTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="signature-section">
            <div style={{ marginBottom: '50px' }}>
              <strong>For {MAIN_STORE_INFO.name}</strong>
            </div>
            <div>
              <strong>Authorised Signatory</strong>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="qr-container">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(MAIN_STORE_INFO.website)}`}
                alt="Website QR"
                className="qr-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', fontSize: '10px', color: '#333' }}>QR Code</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '5px' }}>
                <strong>USE ECO-FRIENDLY SAVE HEALTH & EARTH</strong>
              </div>
              <div style={{ fontSize: '10px' }}>
                Visit: {MAIN_STORE_INFO.website}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status for Public Invoice */}
      {order.isAdvanceBilling && order.remainingAmount > 0 && (
        <div style={{ maxWidth: '800px', margin: '20px auto 0', textAlign: 'center' }}>
          <Card style={{ borderRadius: '12px', backgroundColor: '#fff7e6', border: '1px solid #ffd591' }} className="no-print">
            <Space direction="vertical" size="small">
              <Title level={5} style={{ margin: 0, color: '#fa8c16' }}>
                <ClockCircleOutlined /> Partial Payment - Balance Pending
              </Title>
              <Text>
                You have paid ₹{(order.advanceAmount || 0).toFixed(2)} as advance payment.
              </Text>
              <Text strong style={{ color: '#fa541c' }}>
                Remaining balance: ₹{order.remainingAmount.toFixed(2)}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  icon={<PhoneOutlined />}
                  onClick={handleContactUs}
                  style={{
                    background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                    border: 'none'
                  }}
                >
                  Contact Us for Final Payment
                </Button>
              </div>
            </Space>
          </Card>
        </div>
      )}

      {/* Thank you message */}
      <div style={{ maxWidth: '800px', margin: '20px auto 0', textAlign: 'center' }}>
        <Card style={{ borderRadius: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }} className="no-print">
          <Space direction="vertical" size="small">
            <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
              🎉 Thank you for supporting traditional Indian pottery craftsmanship!
            </Title>
            <Text type="secondary">
              For any queries, call us at {MAIN_STORE_INFO.phone}
            </Text>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default PublicInvoice;