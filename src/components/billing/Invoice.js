// src/components/billing/Invoice.js - Optimized Space-Efficient Invoice
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Button,
  Row,
  Col,
  Card,
  Spin,
  Space,
  Tag,
  Alert,
  Statistic,
  Grid
} from 'antd';
import { 
  DownloadOutlined, 
  PrinterOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PayCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { getOrder } from '../../features/order/orderSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Main store configuration - ONLY this appears on invoices
const MAIN_STORE_INFO = {
  name: 'Mitti Arts',
  tagline: 'Handcrafted Pottery & Terracotta Art',
  address: 'Plot No. 123, Banjara Hills, Road No. 12, Hyderabad - 500034, Telangana, India',
  phone: '+91 98765 43210',
  email: 'info@mittiarts.com',
  website: 'www.mittiarts.com',
  gst: '36ABCDE1234F1Z5'
};

const Invoice = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, isLoading } = useSelector(state => state.orders);
  const invoiceRef = useRef();
  const screens = useBreakpoint();

  useEffect(() => {
    dispatch(getOrder(id));
  }, [dispatch, id]);

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    const WinPrint = window.open('', '', 'width=800,height=600');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Mitti Arts Invoice - ${currentOrder?.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #8b4513;
            }
            .header {
              background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
              color: white;
              padding: 15px 20px;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              top: 0; right: 0; bottom: 0; left: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="40" opacity="0.1">🏺</text></svg>') repeat;
              opacity: 0.1;
            }
            .header-content { position: relative; z-index: 2; }
            .company-section { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
            .logo { 
              width: 50px; height: 50px; 
              background: white; 
              border-radius: 8px;
              display: flex; align-items: center; justify-content: center;
              font-size: 20px; color: #8b4513; font-weight: bold;
            }
            .company-info h1 { 
              font-size: 24px; margin: 0; 
              text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .company-info .tagline { 
              font-size: 11px; opacity: 0.9; font-style: italic;
            }
            .invoice-meta {
              display: flex; justify-content: space-between; align-items: center;
              margin-top: 10px; padding-top: 10px;
              border-top: 1px solid rgba(255,255,255,0.2);
            }
            .invoice-title { font-size: 16px; font-weight: bold; }
            .business-badge {
              background: rgba(255,255,255,0.2);
              padding: 4px 12px; border-radius: 12px;
              font-size: 10px; font-weight: bold;
              border: 1px solid rgba(255,255,255,0.3);
            }
            .details-section {
              display: grid; grid-template-columns: 1fr 1fr;
              gap: 20px; padding: 15px 20px;
              background: #f8f9fa; border-bottom: 1px solid #e9ecef;
            }
            .detail-block h4 {
              font-size: 11px; text-transform: uppercase;
              color: #8b4513; margin-bottom: 8px;
              border-bottom: 1px solid #8b4513; padding-bottom: 2px;
            }
            .detail-item { 
              display: flex; gap: 8px; margin-bottom: 4px;
              font-size: 11px; align-items: flex-start;
            }
            .detail-label { min-width: 60px; color: #666; }
            .detail-value { flex: 1; font-weight: 500; }
            .advance-alert {
              background: linear-gradient(135deg, #fff3cd, #ffeaa7);
              border: 1px solid #ffc107; padding: 12px 20px;
              text-align: center; font-size: 11px;
            }
            .advance-stats {
              display: grid; grid-template-columns: 1fr 1fr 1fr;
              gap: 10px; margin-top: 8px;
            }
            .advance-stat {
              background: white; padding: 6px;
              border-radius: 4px; text-align: center;
            }
            .advance-stat-label { font-size: 9px; color: #666; }
            .advance-stat-value { font-size: 11px; font-weight: bold; color: #e67e22; }
            .items-section { padding: 0; }
            .items-header {
              background: linear-gradient(90deg, #8b4513, #a0522d);
              color: white; padding: 8px 20px;
              display: grid; grid-template-columns: 30px 1fr 50px 70px 80px;
              gap: 10px; font-size: 10px; font-weight: bold;
              text-transform: uppercase; letter-spacing: 0.5px;
            }
            .item-row {
              display: grid; grid-template-columns: 30px 1fr 50px 70px 80px;
              gap: 10px; padding: 10px 20px; border-bottom: 1px solid #f0f0f0;
              align-items: center; font-size: 11px;
            }
            .item-row:nth-child(even) { background: #fafafa; }
            .item-number { 
              text-align: center; font-weight: bold; 
              color: #8b4513; font-size: 10px;
            }
            .item-details .item-name { 
              font-weight: bold; margin-bottom: 2px; 
              color: #2c3e50; font-size: 11px;
            }
            .item-details .item-meta { 
              font-size: 9px; color: #666; 
              display: flex; gap: 8px; flex-wrap: wrap;
            }
            .item-tag {
              background: #8b4513; color: white;
              padding: 1px 6px; border-radius: 8px;
              font-size: 8px; font-weight: 500;
            }
            .business-tag {
              background: #e74c3c; color: white;
            }
            .custom-tag {
              background: #9b59b6; color: white;
            }
            .item-qty { text-align: center; font-weight: 600; }
            .item-price { text-align: right; }
            .price-original {
              text-decoration: line-through;
              color: #95a5a6; font-size: 9px; display: block;
            }
            .price-final { font-weight: bold; color: #27ae60; }
            .item-total { text-align: right; font-weight: bold; }
            .totals-section {
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              padding: 15px 20px; border-top: 2px solid #8b4513;
            }
            .totals-row {
              display: flex; justify-content: space-between;
              margin-bottom: 6px; font-size: 11px; align-items: center;
            }
            .totals-label { color: #666; }
            .totals-value { font-weight: 600; }
            .discount-row { color: #e67e22; font-weight: bold; }
            .wholesale-row { color: #8e44ad; font-weight: bold; }
            .final-total {
              border-top: 2px solid #8b4513; padding-top: 10px;
              margin-top: 10px; background: white;
              padding: 12px; border-radius: 6px;
              border: 1px solid #8b4513;
            }
            .final-total .totals-row {
              font-size: 16px; font-weight: bold; margin: 0;
            }
            .final-total .totals-value { color: #8b4513; font-size: 18px; }
            .payment-section {
              background: linear-gradient(135deg, #27ae60, #2ecc71);
              color: white; padding: 12px 20px; text-align: center;
              font-weight: bold; font-size: 12px;
            }
            .footer-section {
              text-align: center; padding: 15px 20px;
              background: #f8f9fa; border-top: 1px solid #e9ecef;
              font-size: 10px; color: #666;
            }
            .thank-you { 
              font-size: 14px; font-weight: bold; 
              color: #8b4513; margin-bottom: 6px;
            }
            .store-info { margin-top: 8px; }
            .store-info div { margin-bottom: 2px; }
            @media print {
              body { margin: 0; font-size: 10px; }
              .no-print { display: none !important; }
              .invoice-container { box-shadow: none; max-width: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
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
      pdf.save(`mitti-arts-invoice-${currentOrder?.orderNumber || 'invoice'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading Mitti Arts invoice..." />
      </div>
    );
  }

  // Calculate totals
  const originalSubtotal = currentOrder.subtotal || 
    currentOrder.items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
  
  const totalDiscount = currentOrder.discount || 0;
  const wholesaleDiscount = currentOrder.wholesaleDiscount || 0;
  const finalTotal = currentOrder.total || (originalSubtotal - totalDiscount - wholesaleDiscount);

  // Check if this is an advance billing
  const isAdvanceBilling = currentOrder.isAdvanceBilling;
  const advanceAmount = currentOrder.advanceAmount || 0;
  const remainingAmount = currentOrder.remainingAmount || 0;

  return (
    <div style={{ 
      padding: screens.xs ? 8 : 24, 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh' 
    }}>
      {/* Action Buttons */}
      <Row justify="space-between" style={{ marginBottom: 16 }} className="no-print">
        <Col xs={24} sm={12}>
          <Space direction={screens.xs ? 'horizontal' : 'horizontal'} wrap>
            <div>
              <Title level={screens.xs ? 4 : 3} style={{ margin: 0, color: '#8b4513' }}>
                🏺 Invoice Preview
              </Title>
              <Text type="secondary">
                {isAdvanceBilling ? 'Advance Payment' : 'Full Payment'} • 
                {currentOrder.businessType === 'wholesale' ? ' Wholesale' : ' Retail'}
              </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: screens.xs ? 'left' : 'right', marginTop: screens.xs ? 8 : 0 }}>
          <Space wrap>
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint} 
              size={screens.xs ? 'middle' : 'large'}
            >
              {screens.xs ? 'Print' : 'Print Invoice'}
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownload} 
              type="primary" 
              size={screens.xs ? 'middle' : 'large'}
              style={{
                background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                border: 'none'
              }}
            >
              {screens.xs ? 'PDF' : 'Download PDF'}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Status Alerts */}
      {isAdvanceBilling && (
        <Alert
          message="Advance Payment Invoice"
          description={`Customer paid ₹${advanceAmount.toFixed(2)} in advance. Remaining: ₹${remainingAmount.toFixed(2)}`}
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {currentOrder.businessType === 'wholesale' && (
        <Alert
          message="Wholesale Transaction"
          description="Special wholesale pricing and discounts applied."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Optimized Invoice Content */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div 
          ref={invoiceRef}
          className="invoice-container"
          style={{ 
            maxWidth: '800px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            border: '2px solid #8b4513'
          }}
        >
          {/* Compact Header */}
          <div className="header">
            <div className="header-content">
              <div className="company-section">
                <div className="logo">🏺</div>
                <div className="company-info">
                  <h1>{MAIN_STORE_INFO.name}</h1>
                  <div className="tagline">{MAIN_STORE_INFO.tagline}</div>
                </div>
              </div>
              
              <div className="invoice-meta">
                <div>
                  <div className="invoice-title">
                    {isAdvanceBilling ? 'ADVANCE INVOICE' : 'INVOICE'}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>
                    #{currentOrder.orderNumber}
                  </div>
                </div>
                <div className="business-badge">
                  {currentOrder.businessType === 'wholesale' ? '🏪 WHOLESALE' : '🛍️ RETAIL'}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Details Section */}
          <div className="details-section">
            <div className="detail-block">
              <h4>Invoice Details</h4>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {moment(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).format('DD MMM YYYY, hh:mm A')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">
                  {currentOrder.businessType === 'wholesale' ? 'Wholesale Order' : 'Retail Purchase'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment:</span>
                <span className="detail-value">{currentOrder.paymentMethod || 'Cash'}</span>
              </div>
            </div>
            
            <div className="detail-block">
              <h4>Bill To</h4>
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{currentOrder.customer?.name || 'Walk-in Customer'}</span>
              </div>
              {currentOrder.customer?.phone && (
                <div className="detail-item">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{currentOrder.customer.phone}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">Hyderabad, Telangana</span>
              </div>
            </div>
          </div>

          {/* Advance Payment Alert */}
          {isAdvanceBilling && (
            <div className="advance-alert">
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                🏦 ADVANCE PAYMENT INVOICE
              </div>
              <div style={{ fontSize: '10px', marginBottom: '8px' }}>
                Partial payment received. Customer will pay remaining balance later.
              </div>
              <div className="advance-stats">
                <div className="advance-stat">
                  <div className="advance-stat-label">Total Amount</div>
                  <div className="advance-stat-value">₹{finalTotal.toFixed(2)}</div>
                </div>
                <div className="advance-stat">
                  <div className="advance-stat-label">Paid Now</div>
                  <div className="advance-stat-value">₹{advanceAmount.toFixed(2)}</div>
                </div>
                <div className="advance-stat">
                  <div className="advance-stat-label">Remaining</div>
                  <div className="advance-stat-value">₹{remainingAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Compact Items Section */}
          <div className="items-section">
            <div className="items-header">
              <div>#</div>
              <div>Pottery Product Details</div>
              <div style={{ textAlign: 'center' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Unit Price</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
            </div>
            
            {currentOrder.items.map((item, index) => {
              const hasDiscount = item.originalPrice && item.originalPrice !== item.price;
              const originalAmount = item.originalPrice ? item.originalPrice * item.quantity : item.price * item.quantity;
              const finalAmount = item.price * item.quantity;
              
              return (
                <div key={`${item.product?.id || item.productId}-${index}`} className="item-row">
                  <div className="item-number">{index + 1}</div>
                  
                  <div className="item-details">
                    <div className="item-name">
                      🏺 {item.product?.name || 'Pottery Product'}
                    </div>
                    <div className="item-meta">
                      {item.product?.category && (
                        <span>{item.product.category}</span>
                      )}
                      {item.product?.isDynamic && (
                        <span className="item-tag custom-tag">Custom</span>
                      )}
                      <span className={`item-tag ${currentOrder.businessType === 'wholesale' ? 'business-tag' : ''}`}>
                        {currentOrder.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="item-qty">{item.quantity}</div>
                  
                  <div className="item-price">
                    {hasDiscount && (
                      <span className="price-original">₹{item.originalPrice}</span>
                    )}
                    <span className={hasDiscount ? 'price-final' : ''}>₹{item.price}</span>
                  </div>
                  
                  <div className="item-total">
                    {hasDiscount && (
                      <span className="price-original">₹{originalAmount.toFixed(2)}</span>
                    )}
                    <div style={{ fontWeight: 'bold' }}>₹{finalAmount.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Totals Section */}
          <div className="totals-section">
            <div className="totals-row">
              <span className="totals-label">
                Subtotal ({currentOrder.items.length} items):
              </span>
              <span className="totals-value">₹{originalSubtotal.toFixed(2)}</span>
            </div>
            
            {totalDiscount > 0 && (
              <div className="totals-row discount-row">
                <span>💰 Negotiated Discount:</span>
                <span>-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}

            {wholesaleDiscount > 0 && (
              <div className="totals-row wholesale-row">
                <span>🏪 Wholesale Discount (5%):</span>
                <span>-₹{wholesaleDiscount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="final-total">
              <div className="totals-row">
                <span>Total Amount:</span>
                <span className="totals-value">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {isAdvanceBilling && (
              <div style={{ marginTop: '10px', fontSize: '11px' }}>
                <div className="totals-row" style={{ color: '#27ae60', fontWeight: 'bold' }}>
                  <span>Advance Paid:</span>
                  <span>₹{advanceAmount.toFixed(2)}</span>
                </div>
                <div className="totals-row" style={{ 
                  color: '#e74c3c', 
                  fontWeight: 'bold',
                  background: '#fff5f5',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #fecaca'
                }}>
                  <span>Remaining Balance:</span>
                  <span>₹{remainingAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="payment-section">
            💳 Payment Method: {currentOrder.paymentMethod || 'Cash'} • 
            <CheckCircleOutlined style={{ marginLeft: '8px' }} />
            {isAdvanceBilling ? ` ADVANCE PAID (₹${advanceAmount.toFixed(2)})` : ' PAYMENT COMPLETED'}
          </div>

          {/* Compact Footer */}
          <div className="footer-section">
            <div className="thank-you">Thank you for choosing Mitti Arts! 🙏</div>
            <div style={{ marginBottom: '8px' }}>
              We appreciate your business and look forward to serving you again.
            </div>
            
            <div className="store-info">
              <div><strong>{MAIN_STORE_INFO.name}</strong></div>
              <div>📍 {MAIN_STORE_INFO.address}</div>
              <div>📞 {MAIN_STORE_INFO.phone} | ✉️ {MAIN_STORE_INFO.email}</div>
              <div>🌐 {MAIN_STORE_INFO.website} | GST: {MAIN_STORE_INFO.gst}</div>
            </div>
            
            {isAdvanceBilling && (
              <div style={{ 
                marginTop: '8px', 
                padding: '6px', 
                background: '#fff3cd', 
                borderRadius: '4px',
                color: '#856404',
                fontWeight: 'bold',
                border: '1px solid #ffeaa7'
              }}>
                ⚠️ Advance Invoice - Balance of ₹{remainingAmount.toFixed(2)} pending
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;