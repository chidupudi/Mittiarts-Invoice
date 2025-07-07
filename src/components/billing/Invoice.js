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
  Grid
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

// Updated Main Store Information
const MAIN_STORE_INFO = {
  name: 'ART OF INDIAN POTTERY (Mitti arts)',
  address: 'Outlet: Opp. Romoji Film City, Main Gate, Near Maisamma Temple, Hyderabad.',
  phone: '9441550927 / 7382150250',
  gst: '36AMMPG0091P1ZN',
  products: 'Pottery Articulture, Eco-Ganesha, Eco-Filters, Eco-Refrigerators, Live-it Pots, Combos, Cooking Pots, Diyas, Terracota, Sculptures, and all types of art works'
};

const invoiceStyles = `
  body { 
    font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    line-height: 1.6;
    color: #333;
    background: #f7f7f7;
  }
  .invoice-container {
    max-width: 800px;
    margin: 20px auto;
    background: white;
    border: 1px solid #ddd;
    box-shadow: 0 0 15px rgba(0,0,0,0.05);
  }
  .header {
    background: #8b4513;
    color: white;
    padding: 20px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .company-details { text-align: left; }
  .company-name { font-size: 28px; font-weight: bold; margin: 0; }
  .company-info { font-size: 11px; opacity: 0.9; }
  .invoice-title-section { text-align: right; }
  .invoice-title { font-size: 32px; margin: 0; font-weight: 300; letter-spacing: 1px; }
  .invoice-number { font-size: 14px; }

  .details-section {
    display: flex;
    justify-content: space-between;
    padding: 20px 30px;
    border-bottom: 2px solid #8b4513;
  }
  .detail-block { width: 48%; }
  .detail-block h4 {
    font-size: 14px;
    color: #8b4513;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  .detail-item { 
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 13px;
  }
  .detail-label { color: #555; }
  .detail-value { font-weight: bold; }
  .items-section { padding: 30px; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th, .items-table td {
    padding: 12px;
    border-bottom: 1px solid #eee;
    text-align: left;
  }
  .items-table th {
    background-color: #f7f7f7;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 11px;
    color: #555;
  }
  .items-table .item-total, .items-table .item-price, .items-table .item-qty { text-align: right; }
  .totals-section {
    padding: 20px 30px;
    background: #fdfaf7;
    border-top: 2px solid #8b4513;
  }
  .totals-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  .totals-label { width: 150px; text-align: right; color: #555; }
  .totals-value { width: 100px; text-align: right; font-weight: bold; }
  .final-total {
    font-size: 20px;
    color: #8b4513;
  }
  .footer-section {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    background: #333;
    color: white;
  }
  .footer-section p { margin: 0; }
  .no-print { display: none; }
`;

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
          <title>Invoice - ${currentOrder?.orderNumber}</title>
          <style>${invoiceStyles}</style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 250);
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

  if (isLoading || !currentOrder) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading Invoice..." />
      </div>
    );
  }

  const {
    subtotal,
    discount,
    wholesaleDiscount,
    total,
    isAdvanceBilling,
    advanceAmount,
    remainingAmount
  } = currentOrder;
  
  const finalTotal = total || 0;

  return (
    <div style={{ padding: screens.xs ? 12 : 32, background: '#f0f2f5' }}>
      <style>{invoiceStyles}</style>
      <div className="no-print">
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>Invoice Preview</Title>
              <Text type="secondary">Invoice #{currentOrder.orderNumber}</Text>
            </Col>
            <Col>
              <Space>
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

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div ref={invoiceRef} className="invoice-container">
          <div className="header">
            <div className="company-details">
              <h1 className="company-name">{MAIN_STORE_INFO.name}</h1>
              <p className="company-info">
                {MAIN_STORE_INFO.address}<br />
                Contact: {MAIN_STORE_INFO.phone} | GSTIN: {MAIN_STORE_INFO.gst}
              </p>
            </div>
            <div className="invoice-title-section">
              <h2 className="invoice-title">INVOICE</h2>
              <p className="invoice-number">#{currentOrder.orderNumber}</p>
            </div>
          </div>
          
          <div className="details-section">
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
            </div>
            <div className="detail-block">
              <h4>Details</h4>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{moment(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).format('DD MMMM YYYY')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment:</span>
                <span className="detail-value">{currentOrder.paymentMethod || 'Cash'}</span>
              </div>
            </div>
          </div>

          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="item-details">Product</th>
                  <th className="item-qty">Qty</th>
                  <th className="item-price">Unit Price</th>
                  <th className="item-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {currentOrder.items.map((item, index) => (
                  <tr key={`${item.product?.id || item.productId}-${index}`}>
                    <td>{index + 1}</td>
                    <td className="item-details">{item.product?.name || 'Product'}</td>
                    <td className="item-qty">{item.quantity}</td>
                    <td className="item-price">₹{item.price.toFixed(2)}</td>
                    <td className="item-total">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals-section">
            <div className="totals-row">
              <span className="totals-label">Subtotal:</span>
              <span className="totals-value">₹{subtotal.toFixed(2)}</span>
            </div>
            {(discount > 0 || wholesaleDiscount > 0) && (
              <div className="totals-row">
                <span className="totals-label">Discount:</span>
                <span className="totals-value">-₹{(discount + wholesaleDiscount).toFixed(2)}</span>
              </div>
            )}
            <div className="totals-row">
              <span className="totals-label final-total">Total:</span>
              <span className="totals-value final-total">₹{finalTotal.toFixed(2)}</span>
            </div>
            {isAdvanceBilling && (
              <>
                <div className="totals-row" style={{ marginTop: '10px' }}>
                  <span className="totals-label">Advance Paid:</span>
                  <span className="totals-value">₹{advanceAmount.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span className="totals-label" style={{ color: '#d9534f', fontWeight: 'bold' }}>Amount Due:</span>
                  <span className="totals-value" style={{ color: '#d9534f', fontWeight: 'bold' }}>₹{remainingAmount.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="footer-section">
            <p><strong>Products:</strong> {MAIN_STORE_INFO.products}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;