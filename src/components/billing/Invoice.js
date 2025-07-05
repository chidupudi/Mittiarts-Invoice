// src/components/billing/Invoice.js - Enhanced Mitti Arts Invoice with Retail/Wholesale & Advance Support
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
  Divider,
  Alert,
  Statistic
} from 'antd';
import { 
  DownloadOutlined, 
  PrinterOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  BankOutlined,
  ShopOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { getOrder } from '../../features/order/orderSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;

// Mitti Arts branch configuration
const MITTI_ARTS_BRANCHES = {
  'main_showroom': {
    name: 'Main Showroom',
    address: 'Plot No. 123, Banjara Hills, Road No. 12, Hyderabad - 500034',
    phone: '+91 98765 43210',
    email: 'sales@mittiarts.com',
    gst: '36ABCDE1234F1Z5',
    icon: '🏪'
  },
  'pottery_workshop': {
    name: 'Pottery Workshop',
    address: 'Survey No. 45, Madhapur, HITEC City, Hyderabad - 500081',
    phone: '+91 98765 43211',
    email: 'workshop@mittiarts.com',
    gst: '36ABCDE1234F1Z6',
    icon: '🏺'
  },
  'export_unit': {
    name: 'Export Unit',
    address: 'Plot No. 67, Gachibowli, Export Promotion Industrial Park, Hyderabad - 500032',
    phone: '+91 98765 43212',
    email: 'export@mittiarts.com',
    gst: '36ABCDE1234F1Z7',
    icon: '📦'
  }
};

const Invoice = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, isLoading } = useSelector(state => state.orders);
  const invoiceRef = useRef();

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
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0; 
              padding: 15px;
              font-size: 11px;
              line-height: 1.4;
              background: white;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #8b4513;
              border-radius: 8px;
              overflow: hidden;
            }
            .header-section {
              background: linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%);
              color: white;
              padding: 20px;
              position: relative;
              overflow: hidden;
            }
            .header-section::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 100%;
              height: 200%;
              background: rgba(255,255,255,0.1);
              transform: rotate(45deg);
            }
            .logo-section {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              position: relative;
              z-index: 2;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: white;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              border: 3px solid #cd853f;
            }
            .company-name {
              font-size: 28px;
              font-weight: 800;
              margin: 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              letter-spacing: 1px;
            }
            .company-tagline {
              font-size: 12px;
              opacity: 0.95;
              margin-top: 3px;
              font-style: italic;
              letter-spacing: 2px;
            }
            .business-type-badge {
              position: absolute;
              top: 20px;
              right: 20px;
              background: rgba(255,255,255,0.2);
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 12px;
              border: 2px solid rgba(255,255,255,0.3);
              z-index: 3;
            }
            .invoice-title {
              font-size: 18px;
              font-weight: 700;
              margin: 15px 0 5px 0;
              position: relative;
              z-index: 2;
              letter-spacing: 2px;
            }
            .branch-info {
              background: rgba(255,255,255,0.15);
              padding: 10px 15px;
              border-radius: 8px;
              margin-top: 15px;
              position: relative;
              z-index: 2;
            }
            .branch-info h4 {
              margin: 0 0 5px 0;
              font-size: 13px;
              font-weight: 600;
            }
            .branch-info div {
              font-size: 10px;
              margin-bottom: 2px;
            }
            .invoice-details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              padding: 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
              border-left: 4px solid #8b4513;
              border-right: 4px solid #8b4513;
            }
            .detail-section h4 {
              margin: 0 0 10px 0;
              color: #8b4513;
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 2px solid #cd853f;
              padding-bottom: 5px;
            }
            .detail-value {
              color: #2d3748;
              margin-bottom: 6px;
              font-size: 11px;
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .detail-value strong {
              color: #8b4513;
              min-width: 60px;
            }
            .advance-alert {
              background: linear-gradient(135deg, #fff7e6 0%, #fef3e6 100%);
              border: 2px solid #faad14;
              padding: 15px;
              margin: 10px 0;
              border-radius: 8px;
              text-align: center;
            }
            .advance-alert h3 {
              color: #fa8c16;
              margin: 0 0 8px 0;
              font-size: 14px;
              font-weight: 700;
            }
            .advance-details {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              margin-top: 10px;
            }
            .advance-stat {
              text-align: center;
              padding: 8px;
              background: white;
              border-radius: 6px;
              border: 1px solid #ffd591;
            }
            .advance-stat-label {
              font-size: 9px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .advance-stat-value {
              font-size: 12px;
              font-weight: 700;
              color: #fa8c16;
            }
            .items-header {
              background: linear-gradient(90deg, #8b4513 0%, #a0522d 100%);
              color: white;
              padding: 12px;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: grid;
              grid-template-columns: 40px 1fr 60px 80px 90px;
              gap: 10px;
              border-top: 2px solid #cd853f;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-left: 4px solid #8b4513;
              border-right: 4px solid #8b4513;
            }
            .item-row {
              border-bottom: 1px solid #e2e8f0;
              transition: background-color 0.2s;
            }
            .item-row:nth-child(even) {
              background-color: #fafafa;
            }
            .item-cell {
              padding: 10px 12px;
              font-size: 10px;
              vertical-align: middle;
            }
            .item-name {
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 3px;
            }
            .item-category {
              font-size: 9px;
              color: #666;
              font-style: italic;
            }
            .item-custom-tag {
              background: linear-gradient(135deg, #8b4513, #a0522d);
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 8px;
              font-weight: 500;
              display: inline-block;
              margin-top: 3px;
            }
            .business-type-tag {
              background: linear-gradient(135deg, #1890ff, #40a9ff);
              color: white;
              padding: 1px 6px;
              border-radius: 8px;
              font-size: 8px;
              font-weight: 500;
              display: inline-block;
              margin-left: 5px;
            }
            .wholesale-tag {
              background: linear-gradient(135deg, #fa8c16, #ffa940);
            }
            .price-original {
              text-decoration: line-through;
              color: #a0aec0;
              font-size: 9px;
              display: block;
            }
            .price-discounted {
              color: #38a169;
              font-weight: 600;
            }
            .totals-section {
              background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
              padding: 20px;
              border-radius: 0 0 8px 8px;
              position: relative;
              border-left: 4px solid #8b4513;
              border-right: 4px solid #8b4513;
              border-bottom: 4px solid #8b4513;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 11px;
              align-items: center;
            }
            .totals-label {
              color: #4a5568;
              font-weight: 500;
            }
            .totals-value {
              font-weight: 600;
              color: #2d3748;
            }
            .discount-row {
              color: #38a169;
              font-weight: 600;
            }
            .wholesale-discount-row {
              color: #fa8c16;
              font-weight: 600;
            }
            .total-final {
              border-top: 3px solid #8b4513;
              padding-top: 15px;
              margin-top: 15px;
              font-size: 16px;
              font-weight: 800;
              background: linear-gradient(135deg, #fff 0%, #f9f9f9 100%);
              padding: 15px;
              border-radius: 8px;
              border: 2px solid #cd853f;
            }
            .total-final .totals-value {
              color: #8b4513;
              font-size: 20px;
            }
            .payment-info {
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white;
              padding: 15px 20px;
              margin: 15px 0;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border: 2px solid #2f855a;
            }
            .payment-method {
              font-weight: 600;
              font-size: 12px;
            }
            .payment-status {
              display: flex;
              align-items: center;
              gap: 8px;
              font-weight: 700;
              font-size: 12px;
            }
            .footer-section {
              text-align: center;
              padding: 25px;
              border-top: 2px solid #e2e8f0;
              background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
              color: #718096;
              font-size: 10px;
            }
            .thank-you {
              font-size: 14px;
              font-weight: 700;
              color: #8b4513;
              margin-bottom: 8px;
            }
            .contact-info {
              margin-top: 10px;
              font-size: 9px;
              color: #666;
            }
            .pottery-motif {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-15deg);
              font-size: 100px;
              color: rgba(139, 69, 19, 0.03);
              pointer-events: none;
              z-index: 1;
            }
            @media print {
              body { margin: 0; font-size: 10px; }
              .no-print { display: none !important; }
              .invoice-container { max-width: none; box-shadow: none; }
              .page-break { page-break-before: always; }
            }
            @page {
              margin: 0.5in;
              size: A4;
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

  // Get branch information
  const branchInfo = currentOrder.branchInfo || MITTI_ARTS_BRANCHES[currentOrder.branch] || MITTI_ARTS_BRANCHES['main_showroom'];

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

  const renderInvoiceHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%)',
      color: 'white',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Business Type Badge */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(255,255,255,0.2)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: '600',
        fontSize: '12px',
        border: '2px solid rgba(255,255,255,0.3)',
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        {currentOrder.businessType === 'wholesale' ? (
          <>
            <BankOutlined /> WHOLESALE
          </>
        ) : (
          <>
            <ShopOutlined /> RETAIL
          </>
        )}
      </div>

      {/* Decorative pattern */}
      <div style={{
        content: '',
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '100%',
        height: '200%',
        background: 'rgba(255,255,255,0.1)',
        transform: 'rotate(45deg)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '15px',
        position: 'relative', 
        zIndex: 2 
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '3px solid #cd853f'
          }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b4513' }}>🏺</span>
          </div>
          <div>
            <div style={{
              fontSize: '28px',
              fontWeight: '800',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '1px'
            }}>
              Mitti Arts
            </div>
            <div style={{ 
              fontSize: '12px', 
              opacity: '0.95', 
              marginTop: '3px',
              fontStyle: 'italic',
              letterSpacing: '2px'
            }}>
              ✨ Handcrafted Pottery • Terracotta • Art & Lifestyle ✨
            </div>
          </div>
        </div>
        
        <div style={{
          fontSize: '40px',
          opacity: '0.2',
          transform: 'rotate(15deg)'
        }}>
          🏺
        </div>
      </div>
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: '15px 0 5px 0',
          letterSpacing: '2px'
        }}>
          {isAdvanceBilling ? 'ADVANCE INVOICE' : 'INVOICE'}
        </div>
        <div style={{ fontSize: '12px', opacity: '0.9' }}>
          #{currentOrder.orderNumber}
        </div>
      </div>

      {/* Branch Information */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        padding: '10px 15px',
        borderRadius: '8px',
        marginTop: '15px',
        position: 'relative',
        zIndex: 2
      }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: '600' }}>
          {branchInfo.icon} {branchInfo.name}
        </h4>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>
          📍 {branchInfo.address}
        </div>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>
          📞 {branchInfo.phone} | ✉️ {branchInfo.email}
        </div>
        <div style={{ fontSize: '10px' }}>
          GST: {branchInfo.gst}
        </div>
      </div>
    </div>
  );

  const renderInvoiceDetails = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      padding: '20px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
      borderLeft: '4px solid #8b4513',
      borderRight: '4px solid #8b4513'
    }}>
      <div>
        <h4 style={{
          margin: '0 0 10px 0',
          color: '#8b4513',
          fontSize: '13px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          borderBottom: '2px solid #cd853f',
          paddingBottom: '5px'
        }}>
          Invoice Details
        </h4>
        <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <strong style={{ color: '#8b4513', minWidth: '60px' }}>Invoice #:</strong> {currentOrder.orderNumber}
        </div>
        <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CalendarOutlined style={{ color: '#8b4513' }} />
          <strong style={{ color: '#8b4513', minWidth: '60px' }}>Date:</strong> 
          {new Date(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ClockCircleOutlined style={{ color: '#8b4513' }} />
          <strong style={{ color: '#8b4513', minWidth: '60px' }}>Time:</strong> 
          {new Date(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).toLocaleTimeString('en-IN', { 
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <strong style={{ color: '#8b4513', minWidth: '60px' }}>Type:</strong>
          <Tag color={currentOrder.businessType === 'wholesale' ? 'orange' : 'blue'} size="small">
            {currentOrder.businessType === 'wholesale' ? '🏪 Wholesale' : '🛍️ Retail'}
          </Tag>
        </div>
      </div>
      
      <div>
        <h4 style={{
          margin: '0 0 10px 0',
          color: '#8b4513',
          fontSize: '13px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          borderBottom: '2px solid #cd853f',
          paddingBottom: '5px'
        }}>
          Bill To
        </h4>
        <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <strong style={{ color: '#8b4513' }}>{currentOrder.customer?.name || 'Walk-in Customer'}</strong>
        </div>
        {currentOrder.customer?.phone && (
          <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <PhoneOutlined style={{ color: '#8b4513' }} />
            {currentOrder.customer.phone}
          </div>
        )}
        {currentOrder.customer?.email && (
          <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MailOutlined style={{ color: '#8b4513' }} />
            {currentOrder.customer.email}
          </div>
        )}
        <div style={{ color: '#2d3748', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <HomeOutlined style={{ color: '#8b4513' }} />
          Hyderabad, Telangana, India
        </div>
      </div>
    </div>
  );

  const renderAdvanceAlert = () => {
    if (!isAdvanceBilling) return null;
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #fff7e6 0%, #fef3e6 100%)',
        border: '2px solid #faad14',
        padding: '15px',
        margin: '10px 0',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{
          color: '#fa8c16',
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: '700'
        }}>
          🏦 ADVANCE PAYMENT INVOICE
        </h3>
        <div style={{ fontSize: '11px', color: '#8b4513', marginBottom: '10px' }}>
          This is a partial payment invoice. Customer has made an advance payment.
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          marginTop: '10px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '8px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #ffd591'
          }}>
            <div style={{
              fontSize: '9px',
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>Total Amount</div>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#fa8c16'
            }}>₹{finalTotal.toFixed(2)}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '8px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #ffd591'
          }}>
            <div style={{
              fontSize: '9px',
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>Paid Now</div>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#52c41a'
            }}>₹{advanceAmount.toFixed(2)}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '8px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #ffd591'
          }}>
            <div style={{
              fontSize: '9px',
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>Remaining</div>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#fa541c'
            }}>₹{remainingAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderItemsTable = () => (
    <div style={{ margin: 0 }}>
      <div style={{
        background: 'linear-gradient(90deg, #8b4513 0%, #a0522d 100%)',
        color: 'white',
        padding: '12px',
        fontWeight: '600',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'grid',
        gridTemplateColumns: '40px 1fr 60px 80px 90px',
        gap: '10px',
        borderTop: '2px solid #cd853f'
      }}>
        <div>#</div>
        <div>Pottery Product Details</div>
        <div style={{ textAlign: 'center' }}>Qty</div>
        <div style={{ textAlign: 'right' }}>Unit Price</div>
        <div style={{ textAlign: 'right' }}>Amount</div>
      </div>
      
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        background: 'white',
        borderLeft: '4px solid #8b4513',
        borderRight: '4px solid #8b4513'
      }}>
        <tbody>
          {currentOrder.items.map((item, index) => {
            const hasDiscount = item.originalPrice && item.originalPrice !== item.price;
            const originalAmount = item.originalPrice ? item.originalPrice * item.quantity : item.price * item.quantity;
            const finalAmount = item.price * item.quantity;
            
            return (
              <tr 
                key={`${item.product?.id || item.productId}-${index}`}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                }}
              >
                <td style={{
                  padding: '10px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '40px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#8b4513'
                }}>
                  {index + 1}
                </td>
                <td style={{
                  padding: '10px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '40%'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '3px'
                  }}>
                    🏺 {item.product?.name || 'Pottery Product'}
                  </div>
                  {item.product?.category && (
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      {item.product.category}
                    </div>
                  )}
                  <div style={{ marginTop: '3px' }}>
                    {item.product?.isDynamic && (
                      <span style={{
                        background: 'linear-gradient(135deg, #8b4513, #a0522d)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '8px',
                        fontWeight: '500',
                        display: 'inline-block',
                        marginRight: '5px'
                      }}>
                        Custom
                      </span>
                    )}
                    <span style={{
                      background: currentOrder.businessType === 'wholesale' 
                        ? 'linear-gradient(135deg, #fa8c16, #ffa940)'
                        : 'linear-gradient(135deg, #1890ff, #40a9ff)',
                      color: 'white',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      fontSize: '8px',
                      fontWeight: '500',
                      display: 'inline-block'
                    }}>
                      {currentOrder.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                    </span>
                  </div>
                </td>
                <td style={{
                  padding: '10px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '60px',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {item.quantity}
                </td>
                <td style={{
                  padding: '10px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '80px',
                  textAlign: 'right'
                }}>
                  {hasDiscount ? (
                    <div>
                      <span style={{
                        textDecoration: 'line-through',
                        color: '#a0aec0',
                        fontSize: '9px',
                        display: 'block'
                      }}>
                        ₹{item.originalPrice}
                      </span>
                      <span style={{ color: '#38a169', fontWeight: '600' }}>
                        ₹{item.price}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontWeight: '500' }}>₹{item.price}</div>
                  )}
                </td>
                <td style={{
                  padding: '10px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '90px',
                  textAlign: 'right'
                }}>
                  {hasDiscount ? (
                    <div>
                      <span style={{
                        textDecoration: 'line-through',
                        color: '#a0aec0',
                        fontSize: '9px',
                        display: 'block'
                      }}>
                        ₹{originalAmount.toFixed(2)}
                      </span>
                      <span style={{ color: '#38a169', fontWeight: '600' }}>
                        ₹{finalAmount.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontWeight: '600', color: '#2d3748' }}>
                      ₹{finalAmount.toFixed(2)}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTotalsSection = () => (
    <div style={{
      background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
      padding: '20px',
      borderRadius: '0 0 8px 8px',
      position: 'relative',
      borderLeft: '4px solid #8b4513',
      borderRight: '4px solid #8b4513',
      borderBottom: '4px solid #8b4513'
    }}>
      {/* Pottery watermark */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-15deg)',
        fontSize: '100px',
        color: 'rgba(139, 69, 19, 0.03)',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        🏺
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '11px',
        alignItems: 'center'
      }}>
        <span style={{ color: '#4a5568', fontWeight: '500' }}>
          Subtotal ({currentOrder.items.length} items):
        </span>
        <span style={{ fontWeight: '600', color: '#2d3748' }}>
          ₹{originalSubtotal.toFixed(2)}
        </span>
      </div>
      
      {totalDiscount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '11px',
          color: '#38a169',
          fontWeight: '600',
          alignItems: 'center'
        }}>
          <span>💰 Negotiated Discount:</span>
          <span>-₹{totalDiscount.toFixed(2)}</span>
        </div>
      )}

      {wholesaleDiscount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '11px',
          color: '#fa8c16',
          fontWeight: '600',
          alignItems: 'center'
        }}>
          <span>🏪 Wholesale Discount (5%):</span>
          <span>-₹{wholesaleDiscount.toFixed(2)}</span>
        </div>
      )}
      
      <div style={{
        borderTop: '3px solid #8b4513',
        paddingTop: '15px',
        marginTop: '15px',
        fontSize: '16px',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #fff 0%, #f9f9f9 100%)',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #cd853f',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span style={{ color: '#4a5568' }}>
          {isAdvanceBilling ? 'Total Amount:' : 'Total Amount:'}
        </span>
        <span style={{ color: '#8b4513', fontSize: '20px' }}>
          ₹{finalTotal.toFixed(2)}
        </span>
      </div>

      {isAdvanceBilling && (
        <div style={{ marginTop: '15px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <span style={{ color: '#52c41a' }}>Advance Paid:</span>
            <span style={{ color: '#52c41a' }}>₹{advanceAmount.toFixed(2)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: '600',
            padding: '10px',
            background: '#fff7e6',
            borderRadius: '6px',
            border: '1px solid #ffd591'
          }}>
            <span style={{ color: '#fa541c' }}>Remaining Balance:</span>
            <span style={{ color: '#fa541c' }}>₹{remainingAmount.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaymentInfo = () => (
    <div style={{
      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      color: 'white',
      padding: '15px 20px',
      margin: '15px 0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      border: '2px solid #2f855a'
    }}>
      <div style={{ fontWeight: '600', fontSize: '12px' }}>
        💳 Payment Method: {currentOrder.paymentMethod || 'Cash'}
        {isAdvanceBilling && (
          <div style={{ fontSize: '10px', marginTop: '3px', opacity: '0.9' }}>
            (Advance payment of ₹{advanceAmount.toFixed(2)})
          </div>
        )}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '700',
        fontSize: '12px'
      }}>
        <CheckCircleOutlined style={{ fontSize: '14px' }} />
        {isAdvanceBilling ? 'ADVANCE PAID' : 'PAID'}
      </div>
    </div>
  );

  const renderFooter = () => (
    <div style={{
      textAlign: 'center',
      padding: '25px',
      borderTop: '2px solid #e2e8f0',
      background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
      color: '#718096',
      fontSize: '10px'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '700',
        color: '#8b4513',
        marginBottom: '8px'
      }}>
        Thank you for choosing Mitti Arts! 🙏
      </div>
      <div>We appreciate your business and look forward to serving you again with our handcrafted pottery.</div>
      <div style={{ marginTop: '10px', fontSize: '9px', color: '#666' }}>
        For any queries: 📞 +91 98765 43210 | ✉️ info@mittiarts.com | 🌐 www.mittiarts.com
      </div>
      <div style={{ marginTop: '8px', fontSize: '9px', color: '#8b4513', fontWeight: '600' }}>
        🏺 Experience the Art of Clay • Crafted with Love in Hyderabad 🏺
      </div>
      {isAdvanceBilling && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: '#fff7e6', 
          borderRadius: '6px',
          color: '#fa8c16',
          fontWeight: '600',
          fontSize: '10px',
          border: '1px solid #ffd591'
        }}>
          ⚠️ This is an advance payment invoice. Balance of ₹{remainingAmount.toFixed(2)} is pending.
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Action Buttons */}
      <Row justify="space-between" style={{ marginBottom: 16 }} className="no-print">
        <Col>
          <Space direction="vertical">
            <Title level={3} style={{ margin: 0, color: '#8b4513' }}>
              🏺 Mitti Arts Invoice Preview
            </Title>
            <Text type="secondary">
              {isAdvanceBilling ? 'Advance Payment Invoice' : 'Full Payment Invoice'} • 
              {currentOrder.businessType === 'wholesale' ? ' Wholesale' : ' Retail'} • 
              {branchInfo.name}
            </Text>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button icon={<PrinterOutlined />} onClick={handlePrint} size="large">
              Print Invoice
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload} type="primary" size="large" style={{
              background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
              border: 'none'
            }}>
              Download PDF
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Status Alerts */}
      {isAdvanceBilling && (
        <Alert
          message="Advance Payment Invoice"
          description={`This customer has paid ₹${advanceAmount.toFixed(2)} in advance. Remaining balance: ₹${remainingAmount.toFixed(2)}`}
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {currentOrder.businessType === 'wholesale' && (
        <Alert
          message="Wholesale Transaction"
          description="This is a wholesale invoice with special pricing and discounts applied."
          type="info"
          showIcon
          icon={<BankOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Invoice Content */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div 
          ref={invoiceRef}
          style={{ 
            maxWidth: '800px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            border: '2px solid #8b4513'
          }}
        >
          {renderInvoiceHeader()}
          {renderInvoiceDetails()}
          {renderAdvanceAlert()}
          {renderItemsTable()}
          {renderTotalsSection()}
          {renderPaymentInfo()}
          {renderFooter()}
        </div>
      </div>
    </div>
  );
};

export default Invoice;