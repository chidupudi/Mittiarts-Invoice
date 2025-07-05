// src/components/billing/Invoice.js - Enhanced Beautiful Invoice
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
  Grid,
  Divider
} from 'antd';
import { 
  DownloadOutlined, 
  PrinterOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PayCircleOutlined,
  InfoCircleOutlined,
  ShopOutlined,
  UserOutlined,
  CalendarOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  TrophyOutlined
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
              font-family: 'Inter', 'Segoe UI', sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #2d3748;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 3px solid #8b4513;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(139, 69, 19, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%);
              color: white;
              padding: 24px 28px;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%; right: -50%; width: 200%; height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
              background-size: 20px 20px;
              animation: float 20s linear infinite;
            }
            @keyframes float {
              from { transform: translate(-50px, -50px) rotate(0deg); }
              to { transform: translate(-50px, -50px) rotate(360deg); }
            }
            .header-content { position: relative; z-index: 2; }
            .company-section { 
              display: flex; align-items: center; gap: 20px; 
              margin-bottom: 16px;
            }
            .logo { 
              width: 70px; height: 70px; 
              background: linear-gradient(135deg, #fff, #f7fafc); 
              border-radius: 16px;
              display: flex; align-items: center; justify-content: center;
              font-size: 28px; color: #8b4513; font-weight: bold;
              box-shadow: 0 8px 25px rgba(0,0,0,0.15);
              border: 3px solid rgba(255,255,255,0.3);
            }
            .company-info h1 { 
              font-size: 32px; margin: 0; font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              background: linear-gradient(45deg, #fff, #f7fafc);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .company-info .tagline { 
              font-size: 14px; opacity: 0.95; font-style: italic;
              margin-top: 4px; font-weight: 300;
            }
            .invoice-meta {
              display: flex; justify-content: space-between; align-items: center;
              margin-top: 16px; padding-top: 16px;
              border-top: 2px solid rgba(255,255,255,0.2);
            }
            .invoice-title { 
              font-size: 20px; font-weight: 700; 
              text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .invoice-number {
              font-size: 13px; opacity: 0.9; margin-top: 4px;
              font-family: 'Monaco', monospace;
              background: rgba(255,255,255,0.1);
              padding: 4px 8px; border-radius: 6px;
              display: inline-block;
            }
            .business-badge {
              background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1));
              padding: 8px 16px; border-radius: 20px;
              font-size: 12px; font-weight: 600;
              border: 2px solid rgba(255,255,255,0.3);
              backdrop-filter: blur(10px);
              text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            .details-section {
              display: grid; grid-template-columns: 1fr 1fr;
              gap: 0; background: linear-gradient(135deg, #f8fafc, #edf2f7);
            }
            .detail-block {
              padding: 24px 28px; position: relative;
            }
            .detail-block:first-child {
              border-right: 1px solid #e2e8f0;
            }
            .detail-block::before {
              content: '';
              position: absolute; top: 0; left: 0; right: 0;
              height: 4px; background: linear-gradient(90deg, #8b4513, transparent);
            }
            .detail-block h4 {
              font-size: 14px; text-transform: uppercase; font-weight: 700;
              color: #8b4513; margin-bottom: 16px; letter-spacing: 1px;
              display: flex; align-items: center; gap: 8px;
            }
            .detail-item { 
              display: flex; gap: 12px; margin-bottom: 10px;
              font-size: 13px; align-items: center;
              padding: 8px 0; border-bottom: 1px solid rgba(139, 69, 19, 0.1);
            }
            .detail-item:last-child { border-bottom: none; }
            .detail-label { 
              min-width: 80px; color: #4a5568; font-weight: 500;
              display: flex; align-items: center; gap: 6px;
            }
            .detail-value { 
              flex: 1; font-weight: 600; color: #2d3748;
            }
            .advance-alert {
              background: linear-gradient(135deg, #fef5e7, #fed7aa);
              border: 2px solid #f59e0b; 
              padding: 20px 28px; position: relative; overflow: hidden;
            }
            .advance-alert::before {
              content: '💰';
              position: absolute; top: 10px; right: 20px;
              font-size: 40px; opacity: 0.2;
            }
            .advance-alert-title {
              font-weight: 700; font-size: 14px; margin-bottom: 8px;
              color: #92400e; display: flex; align-items: center; gap: 8px;
            }
            .advance-alert-desc {
              font-size: 12px; margin-bottom: 16px; color: #b45309;
            }
            .advance-stats {
              display: grid; grid-template-columns: 1fr 1fr 1fr;
              gap: 12px;
            }
            .advance-stat {
              background: linear-gradient(135deg, #fff, #fefcf9); 
              padding: 12px; border-radius: 12px; text-align: center;
              border: 1px solid #fed7aa;
              box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
            }
            .advance-stat-label { 
              font-size: 10px; color: #92400e; font-weight: 500;
              text-transform: uppercase; letter-spacing: 0.5px;
            }
            .advance-stat-value { 
              font-size: 14px; font-weight: 700; color: #b45309; 
              margin-top: 4px;
            }
            .items-section { background: white; }
            .items-header {
              background: linear-gradient(135deg, #8b4513, #a0522d, #cd853f);
              color: white; padding: 16px 28px;
              display: grid; grid-template-columns: 50px 1fr 80px 100px 120px;
              gap: 16px; font-size: 12px; font-weight: 700;
              text-transform: uppercase; letter-spacing: 1px;
              border-top: 3px solid #8b4513;
            }
            .item-row {
              display: grid; grid-template-columns: 50px 1fr 80px 100px 120px;
              gap: 16px; padding: 20px 28px; 
              border-bottom: 1px solid #f1f5f9;
              align-items: center; font-size: 13px;
              transition: all 0.2s ease;
            }
            .item-row:hover {
              background: linear-gradient(135deg, #fef5e7, #fefcf9);
              transform: translateX(4px);
            }
            .item-row:nth-child(even) { background: #fafafa; }
            .item-number { 
              text-align: center; font-weight: 700; 
              color: #8b4513; font-size: 14px;
              background: linear-gradient(135deg, #fed7aa, #fde68a);
              border-radius: 50%; width: 32px; height: 32px;
              display: flex; align-items: center; justify-content: center;
              margin: 0 auto;
            }
            .item-details .item-name { 
              font-weight: 700; margin-bottom: 6px; 
              color: #1a202c; font-size: 14px;
              display: flex; align-items: center; gap: 8px;
            }
            .item-details .item-meta { 
              font-size: 11px; color: #718096; 
              display: flex; gap: 8px; flex-wrap: wrap;
              margin-top: 4px;
            }
            .item-tag {
              background: linear-gradient(135deg, #8b4513, #a0522d);
              color: white; padding: 2px 8px; border-radius: 12px;
              font-size: 9px; font-weight: 600;
              text-transform: uppercase; letter-spacing: 0.5px;
            }
            .business-tag {
              background: linear-gradient(135deg, #e53e3e, #c53030);
            }
            .custom-tag {
              background: linear-gradient(135deg, #805ad5, #6b46c1);
            }
            .item-qty { 
              text-align: center; font-weight: 700; font-size: 16px;
              color: #2d3748;
            }
            .item-price { text-align: right; }
            .price-original {
              text-decoration: line-through;
              color: #a0aec0; font-size: 10px; display: block;
              margin-bottom: 2px;
            }
            .price-final { 
              font-weight: 700; color: #38a169; font-size: 13px;
            }
            .item-total { 
              text-align: right; font-weight: 700; font-size: 14px;
              color: #2d3748;
            }
            .totals-section {
              background: linear-gradient(135deg, #f7fafc, #edf2f7);
              padding: 24px 28px; border-top: 3px solid #8b4513;
              position: relative;
            }
            .totals-section::before {
              content: '';
              position: absolute; top: 0; left: 0; right: 0;
              height: 2px; background: linear-gradient(90deg, #8b4513, #a0522d, #cd853f);
            }
            .totals-row {
              display: flex; justify-content: space-between;
              margin-bottom: 12px; font-size: 13px; align-items: center;
              padding: 8px 0; border-bottom: 1px solid rgba(139, 69, 19, 0.1);
            }
            .totals-row:last-child { border-bottom: none; }
            .totals-label { color: #4a5568; font-weight: 500; }
            .totals-value { font-weight: 700; font-size: 14px; }
            .discount-row { 
              color: #e67e22; font-weight: 700;
              background: linear-gradient(135deg, #fef5e7, transparent);
              padding: 8px 12px; border-radius: 8px; margin: 4px 0;
            }
            .wholesale-row { 
              color: #8e44ad; font-weight: 700;
              background: linear-gradient(135deg, #f3f0ff, transparent);
              padding: 8px 12px; border-radius: 8px; margin: 4px 0;
            }
            .final-total {
              background: linear-gradient(135deg, #fff, #f7fafc);
              border: 3px solid #8b4513; padding: 20px; 
              border-radius: 16px; margin-top: 16px;
              box-shadow: 0 8px 25px rgba(139, 69, 19, 0.15);
              position: relative; overflow: hidden;
            }
            .final-total::before {
              content: '🏆';
              position: absolute; top: 15px; right: 20px;
              font-size: 24px; opacity: 0.3;
            }
            .final-total .totals-row {
              font-size: 18px; font-weight: 700; margin: 0;
              border-bottom: none; padding: 0;
            }
            .final-total .totals-value { 
              color: #8b4513; font-size: 24px; font-weight: 800;
            }
            .payment-section {
              background: linear-gradient(135deg, #38a169, #48bb78, #68d391);
              color: white; padding: 20px 28px; text-align: center;
              font-weight: 700; font-size: 14px; position: relative;
              overflow: hidden;
            }
            .payment-section::before {
              content: '';
              position: absolute; top: 0; left: 0; right: 0; bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
            }
            .payment-content { position: relative; z-index: 2; }
            .footer-section {
              text-align: center; padding: 28px;
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              color: #4a5568; position: relative;
            }
            .thank-you { 
              font-size: 18px; font-weight: 700; 
              color: #8b4513; margin-bottom: 12px;
              display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .footer-message {
              margin-bottom: 16px; font-size: 13px; color: #718096;
              font-style: italic;
            }
            .store-info { 
              margin-top: 16px; padding: 16px;
              background: linear-gradient(135deg, #fff, #f7fafc);
              border-radius: 12px; border: 1px solid #e2e8f0;
            }
            .store-info div { 
              margin-bottom: 6px; font-size: 12px;
              display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .store-info div:last-child { margin-bottom: 0; }
            .store-name { 
              font-weight: 700; font-size: 14px; color: #8b4513;
              margin-bottom: 8px !important;
            }
            .remaining-balance {
              background: linear-gradient(135deg, #fed7d7, #feb2b2);
              border: 2px solid #f56565; padding: 12px; 
              border-radius: 12px; color: #c53030;
              font-weight: 700; margin-top: 12px;
              display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            @media print {
              body { margin: 0; font-size: 10px; }
              .no-print { display: none !important; }
              .invoice-container { box-shadow: none; max-width: none; }
              .item-row:hover { transform: none; }
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" tip="Loading Mitti Arts invoice..." />
          <div style={{ marginTop: 16, color: '#8b4513', fontWeight: 600 }}>
            🏺 Preparing your beautiful invoice...
          </div>
        </div>
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
      padding: screens.xs ? 12 : 32, 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cd853f' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        zIndex: 0
      }} />

      {/* Action Header */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Card 
          style={{ 
            marginBottom: 24,
            borderRadius: 20,
            border: '2px solid #8b4513',
            background: 'linear-gradient(135deg, #fff, #f7fafc)',
            boxShadow: '0 10px 30px rgba(139, 69, 19, 0.1)'
          }}
          className="no-print"
        >
          <Row justify="space-between" align="middle">
            <Col xs={24} sm={14}>
              <Space direction="vertical" size={4}>
                <Title 
                  level={screens.xs ? 4 : 2} 
                  style={{ 
                    margin: 0, 
                    background: 'linear-gradient(135deg, #8b4513, #cd853f)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 800
                  }}
                >
                  🏺 Invoice Preview
                </Title>
                <Space size={16} wrap>
                  <Tag 
                    color={isAdvanceBilling ? 'orange' : 'green'} 
                    style={{ 
                      borderRadius: 20, 
                      padding: '4px 12px',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    {isAdvanceBilling ? (
                      <>
                        <ClockCircleOutlined /> Advance Payment
                      </>
                    ) : (
                      <>
                        <CheckCircleOutlined /> Full Payment
                      </>
                    )}
                  </Tag>
                  <Tag 
                    color={currentOrder.businessType === 'wholesale' ? 'purple' : 'blue'}
                    style={{ 
                      borderRadius: 20, 
                      padding: '4px 12px',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    {currentOrder.businessType === 'wholesale' ? (
                      <>
                        <ShopOutlined /> Wholesale
                      </>
                    ) : (
                      <>
                        <UserOutlined /> Retail
                      </>
                    )}
                  </Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} sm={10} style={{ textAlign: screens.xs ? 'left' : 'right', marginTop: screens.xs ? 16 : 0 }}>
              <Space wrap size={12}>
                <Button 
                  icon={<PrinterOutlined />} 
                  onClick={handlePrint} 
                  size="large"
                  style={{
                    borderRadius: 12,
                    height: 44,
                    fontWeight: 600,
                    border: '2px solid #8b4513',
                    color: '#8b4513'
                  }}
                  className="hover-lift"
                >
                  {screens.xs ? 'Print' : 'Print Invoice'}
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleDownload} 
                  type="primary" 
                  size="large"
                  style={{
                    background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%)',
                    border: 'none',
                    borderRadius: 12,
                    height: 44,
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
                  }}
                  className="hover-lift"
                >
                  {screens.xs ? 'PDF' : 'Download PDF'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Status Alerts */}
        {isAdvanceBilling && (
          <Alert
            message={
              <span style={{ fontWeight: 600, fontSize: '14px' }}>
                <PayCircleOutlined style={{ marginRight: 8 }} />
                Advance Payment Invoice
              </span>
            }
            description={
              <div style={{ fontSize: '13px' }}>
                Customer paid <strong>₹{advanceAmount.toFixed(2)}</strong> in advance. 
                Remaining balance: <strong style={{ color: '#e74c3c' }}>₹{remainingAmount.toFixed(2)}</strong>
              </div>
            }
            type="warning"
            showIcon={false}
            style={{ 
              marginBottom: 20,
              borderRadius: 12,
              border: '2px solid #f59e0b',
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)'
            }}
          />
        )}

        {currentOrder.businessType === 'wholesale' && (
          <Alert
            message={
              <span style={{ fontWeight: 600, fontSize: '14px' }}>
                <TrophyOutlined style={{ marginRight: 8 }} />
                Wholesale Transaction
              </span>
            }
            description="Special wholesale pricing and discounts applied for business customers."
            type="info"
            showIcon={false}
            style={{ 
              marginBottom: 20,
              borderRadius: 12,
              border: '2px solid #3b82f6',
              background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
            }}
          />
        )}

        {/* Enhanced Invoice Content */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div 
            ref={invoiceRef}
            className="invoice-container"
            style={{ 
              maxWidth: '800px',
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(139, 69, 19, 0.15)',
              overflow: 'hidden',
              border: '3px solid #8b4513'
            }}
          >
            {/* Enhanced Header */}
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
                    <div className="invoice-number">
                      #{currentOrder.orderNumber}
                    </div>
                  </div>
                  <div className="business-badge">
                    {currentOrder.businessType === 'wholesale' ? '🏪 WHOLESALE' : '🛍️ RETAIL'}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Details Section */}
            <div className="details-section">
              <div className="detail-block">
                <h4>
                  <InfoCircleOutlined />
                  Invoice Details
                </h4>
                <div className="detail-item">
                  <span className="detail-label">
                    <CalendarOutlined />
                    Date:
                  </span>
                  <span className="detail-value">
                    {moment(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).format('DD MMM YYYY, hh:mm A')}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <ShopOutlined />
                    Type:
                  </span>
                  <span className="detail-value">
                    {currentOrder.businessType === 'wholesale' ? 'Wholesale Order' : 'Retail Purchase'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <PayCircleOutlined />
                    Payment:
                  </span>
                  <span className="detail-value">{currentOrder.paymentMethod || 'Cash'}</span>
                </div>
              </div>
              
              <div className="detail-block">
                <h4>
                  <UserOutlined />
                  Bill To
                </h4>
                <div className="detail-item">
                  <span className="detail-label">
                    <UserOutlined />
                    Name:
                  </span>
                  <span className="detail-value">{currentOrder.customer?.name || 'Walk-in Customer'}</span>
                </div>
                {currentOrder.customer?.phone && (
                  <div className="detail-item">
                    <span className="detail-label">
                      <PhoneOutlined />
                      Phone:
                    </span>
                    <span className="detail-value">{currentOrder.customer.phone}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">
                    <EnvironmentOutlined />
                    Location:
                  </span>
                  <span className="detail-value">Hyderabad, Telangana</span>
                </div>
              </div>
            </div>

            {/* Enhanced Advance Payment Alert */}
            {isAdvanceBilling && (
              <div className="advance-alert">
                <div className="advance-alert-title">
                  <PayCircleOutlined />
                  ADVANCE PAYMENT INVOICE
                </div>
                <div className="advance-alert-desc">
                  Partial payment received. Customer will pay remaining balance upon completion/delivery.
                </div>
                <div className="advance-stats">
                  <div className="advance-stat">
                    <div className="advance-stat-label">Total Amount</div>
                    <div className="advance-stat-value">₹{finalTotal.toFixed(2)}</div>
                  </div>
                  <div className="advance-stat">
                    <div className="advance-stat-label">Paid Today</div>
                    <div className="advance-stat-value">₹{advanceAmount.toFixed(2)}</div>
                  </div>
                  <div className="advance-stat">
                    <div className="advance-stat-label">Remaining</div>
                    <div className="advance-stat-value">₹{remainingAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Items Section */}
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
                          <span style={{ 
                            background: '#f0f9ff', 
                            color: '#0c4a6e', 
                            padding: '2px 6px', 
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 500
                          }}>
                            {item.product.category}
                          </span>
                        )}
                        {item.product?.isDynamic && (
                          <span className="item-tag custom-tag">Custom Made</span>
                        )}
                        <span className={`item-tag ${currentOrder.businessType === 'wholesale' ? 'business-tag' : ''}`}>
                          {currentOrder.businessType === 'wholesale' ? 'Wholesale Price' : 'Retail Price'}
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

            {/* Enhanced Totals Section */}
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
                <div style={{ marginTop: '16px' }}>
                  <div className="totals-row" style={{ 
                    color: '#38a169', 
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #f0fff4, #c6f6d5)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #9ae6b4'
                  }}>
                    <span>✅ Advance Paid:</span>
                    <span>₹{advanceAmount.toFixed(2)}</span>
                  </div>
                  <div className="remaining-balance">
                    <span>⏳ Remaining Balance:</span>
                    <span>₹{remainingAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Payment Status */}
            <div className="payment-section">
              <div className="payment-content">
                <CheckCircleOutlined style={{ fontSize: '18px', marginRight: '12px' }} />
                Payment Method: {currentOrder.paymentMethod || 'Cash'} • 
                {isAdvanceBilling ? ` ADVANCE PAID (₹${advanceAmount.toFixed(2)})` : ' PAYMENT COMPLETED'}
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="footer-section">
              <div className="thank-you">
                <span>Thank you for choosing Mitti Arts!</span>
                <span>🙏</span>
              </div>
              <div className="footer-message">
                We appreciate your business and look forward to serving you again with our handcrafted pottery.
              </div>
              
              <div className="store-info">
                <div className="store-name">{MAIN_STORE_INFO.name}</div>
                <div>
                  <EnvironmentOutlined />
                  {MAIN_STORE_INFO.address}
                </div>
                <div>
                  <PhoneOutlined />
                  {MAIN_STORE_INFO.phone}
                  <span style={{ margin: '0 8px' }}>•</span>
                  ✉️ {MAIN_STORE_INFO.email}
                </div>
                <div>
                  🌐 {MAIN_STORE_INFO.website}
                  <span style={{ margin: '0 8px' }}>•</span>
                  GST: {MAIN_STORE_INFO.gst}
                </div>
              </div>
              
              {isAdvanceBilling && (
                <div className="remaining-balance" style={{ marginTop: 16 }}>
                  <span>⚠️ Advance Invoice - Balance of ₹{remainingAmount.toFixed(2)} pending</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 69, 19, 0.25) !important;
        }
      `}</style>
    </div>
  );
};

export default Invoice;