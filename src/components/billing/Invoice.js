// src/components/billing/Invoice.js - Updated with Share Button
import React, { useEffect, useRef, useState } from 'react';
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
  Grid,
  message
} from 'antd';
import { 
  DownloadOutlined, 
  PrinterOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { getOrder } from '../../features/order/orderSlice';
import firebaseService from '../../services/firebaseService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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

const Invoice = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, isLoading } = useSelector(state => state.orders);
  const invoiceRef = useRef();
  const screens = useBreakpoint();
  
  // 🆕 ADD STATE FOR SHARE LOADING
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    dispatch(getOrder(id));
  }, [dispatch, id]);

  const handlePrint = () => {
    window.print();
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
      pdf.save(`invoice-${currentOrder?.orderNumber || 'invoice'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // 🆕 UPDATED SHARE FUNCTION - Now uses short URLs for easy sharing
  const handleShare = async () => {
    if (!currentOrder) {
      message.error('Order not found');
      return;
    }

    setShareLoading(true);
    try {
      let shareToken = currentOrder.shareToken;
      let shortToken = currentOrder.shortToken;
      let needsUpdate = false;

      // 🆕 If order doesn't have shareToken, generate one
      if (!shareToken) {
        console.log('🔧 Generating share token for existing order...');

        // Generate new share token
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 8);
        shareToken = `${timestamp}${random}`;
        needsUpdate = true;

        console.log('✅ Share token generated:', shareToken);
      }

      // 🆕 If order doesn't have shortToken, generate one for short URL
      if (!shortToken) {
        console.log('🔧 Generating short token for existing order...');

        // Generate 4-char short token
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let newShortToken = '';
        const array = new Uint8Array(4);
        if (window.crypto) {
          window.crypto.getRandomValues(array);
        } else {
          for (let i = 0; i < 4; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
        }
        for (let i = 0; i < 4; i++) {
          newShortToken += chars[array[i] % chars.length];
        }
        shortToken = newShortToken;
        needsUpdate = true;

        console.log('✅ Short token generated:', shortToken);
      }

      // Save both tokens to Firebase if either was newly generated
      if (needsUpdate) {
        await firebaseService.update('orders', currentOrder.id, {
          shareToken: shareToken,
          shortToken: shortToken,
          shareTokenGeneratedAt: new Date()
        });
        console.log('✅ Tokens saved to Firebase');
      }

      // Generate the short shareable URL (28 chars)
      const shortUrl = `invoice.mittiarts.com/i/${shortToken}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shortUrl);

      message.success('🎉 Short link copied to clipboard!');

      // Log the share action
      console.log('📤 Invoice shared:', {
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        shortToken: shortToken,
        shortUrl,
        sharedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Share error:', error);

      // Fallback for older browsers
      try {
        let shareToken = currentOrder.shareToken;
        let shortToken = currentOrder.shortToken;

        if (!shareToken) {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 8);
          shareToken = `${timestamp}${random}`;
        }

        if (!shortToken) {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
          let newShortToken = '';
          for (let i = 0; i < 4; i++) {
            newShortToken += chars[Math.floor(Math.random() * chars.length)];
          }
          shortToken = newShortToken;
        }

        await firebaseService.update('orders', currentOrder.id, {
          shareToken: shareToken,
          shortToken: shortToken,
          shareTokenGeneratedAt: new Date()
        });

        const shortUrl = `invoice.mittiarts.com/i/${shortToken}`;
        const textArea = document.createElement('textarea');
        textArea.value = shortUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        message.success('Short link copied to clipboard!');
      } catch (fallbackError) {
        message.error('Failed to generate share link. Please try again.');
      }
    } finally {
      setShareLoading(false);
    }
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
    
    let integerPart = Math.floor(amount);
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

  if (isLoading || !currentOrder) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading Invoice..." />
      </div>
    );
  }

  const finalTotal = currentOrder.total || 0;

  return (
    <div style={{ padding: screens.xs ? 12 : 32, background: '#f0f2f5' }}>
      <style>{invoiceStyles}</style>
      
      {/* Print/Download Controls */}
      <div className="no-print">
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>Invoice #{currentOrder.orderNumber}</Title>
              <Text type="secondary">Clean Invoice Format</Text>
            </Col>
            <Col>
              <Space>
                {/* 🆕 ADD SHARE BUTTON */}
                <Button 
                  icon={<ShareAltOutlined />} 
                  onClick={handleShare}
                  loading={shareLoading}
                  style={{ 
                    backgroundColor: '#52c41a', 
                    borderColor: '#52c41a', 
                    color: 'white' 
                  }}
                  size="large"
                >
                  Share Invoice
                </Button>
                <Button 
                  icon={<PrinterOutlined />} 
                  onClick={handlePrint} 
                  size="large"
                >
                  Print Invoice
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleDownload} 
                  type="primary" 
                  size="large"
                >
                  Download PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Invoice Content */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div ref={invoiceRef} className="invoice-container">
          
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
              <div style={{ marginTop: '15px' }}><strong>Date:</strong> {moment(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).format('DD/MM/YYYY')}</div>
            </div>
            <div style={{ flex: 1, borderRight: '1px solid #000', borderLeft: '1px solid #000', paddingLeft: '10px', paddingRight: '10px' }}>
              <div><strong>DC No.</strong></div>
              <div style={{ marginTop: '15px' }}><strong>Date:</strong></div>
            </div>
            <div className="customer-details">
              <div><strong>Invoice No.</strong> {currentOrder.orderNumber}</div>
              <div style={{ marginTop: '15px' }}><strong>Date:</strong> {moment(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).format('DD/MM/YYYY')}</div>
            </div>
          </div>

          {/* Database IDs for Reference */}
          <div style={{ padding: '5px 10px', borderBottom: '1px solid #000', backgroundColor: '#f9f9f9', fontSize: '9px', color: '#666' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>Order ID:</strong> {currentOrder.id}</span>
              <span><strong>Invoice ID:</strong> {currentOrder.invoiceId || currentOrder.id}</span>
              <span><strong>System Ref:</strong> {currentOrder.orderNumber}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="customer-section">
            <div><strong>M/s. {currentOrder.customer?.name || 'Walk-in Customer'}</strong></div>
            {currentOrder.customer?.phone && (
              <div style={{ marginTop: '5px' }}>Ph: {currentOrder.customer.phone}</div>
            )}
            {currentOrder.customer?.email && (
              <div style={{ marginTop: '5px' }}>Email: {currentOrder.customer.email}</div>
            )}
            <div style={{ marginTop: '10px' }}>
              <strong>GSTIN: ________________________________</strong>
            </div>
          </div>

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
              {currentOrder.items.map((item, index) => (
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
              {Array.from({ length: Math.max(0, 10 - currentOrder.items.length) }).map((_, index) => (
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
              {currentOrder.isAdvanceBilling && (
                <div style={{ marginTop: '20px', fontSize: '11px', lineHeight: '1.3' }}>
                  <div><strong>Payment Summary:</strong></div>
                  <div>Total Amount: ₹{finalTotal.toFixed(2)}</div>
                  <div style={{ color: '#52c41a' }}>Advance Paid: ₹{(currentOrder.advanceAmount || 0).toFixed(2)}</div>
                  {currentOrder.remainingAmount > 0 && (
                    <div style={{ color: '#fa541c' }}>
                      <strong>Balance Due: ₹{currentOrder.remainingAmount.toFixed(2)}</strong>
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
    </div>
  );
};

export default Invoice;