// src/components/estimation/EstimateView.js
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  message,
  Tag,
  Divider
} from 'antd';
import { 
  DownloadOutlined, 
  PrinterOutlined,
  ShareAltOutlined,
  FileAddOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { getEstimate } from '../../features/estimation/estimationSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Store Information (same as invoice)
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

const estimateStyles = `
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
  }
  
  .estimate-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border: 2px solid #000;
    font-family: Arial, sans-serif;
    font-size: 12px;
  }
  
  .estimate-header {
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
  
  .estimate-title {
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
  
  .estimate-info {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #000;
  }
  
  .estimate-details {
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
  
  .validity-alert {
    padding: 10px;
    background-color: #fff7e6;
    border-bottom: 1px solid #000;
    text-align: center;
    border-left: 4px solid #fa8c16;
    font-weight: bold;
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
    min-height: 120px;
  }
  
  .notes-section {
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

const EstimateView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentEstimate, loading } = useSelector(state => state.estimations);
  const estimateRef = useRef();
  const screens = useBreakpoint();
  
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    dispatch(getEstimate(id));
  }, [dispatch, id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!estimateRef.current) return;
    
    try {
      const canvas = await html2canvas(estimateRef.current, {
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
      pdf.save(`estimate-${currentEstimate?.estimateNumber || 'estimate'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  const handleShare = async () => {
    if (!currentEstimate) {
      message.error('Estimate not found');
      return;
    }

    setShareLoading(true);
    try {
      const shareUrl = `${window.location.origin}/public/estimate/${currentEstimate.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      message.success('🎉 Estimate share link copied to clipboard!');
    } catch (error) {
      console.error('Share error:', error);
      
      // Fallback for older browsers
      try {
        const shareUrl = `${window.location.origin}/public/estimate/${currentEstimate.shareToken}`;
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        message.success('Estimate share link copied to clipboard!');
      } catch (fallbackError) {
        message.error('Failed to generate share link. Please try again.');
      }
    } finally {
      setShareLoading(false);
    }
  };

  const handleConvertToInvoice = () => {
    navigate('/billing', { 
      state: { 
        convertFromEstimate: currentEstimate,
        prefilledItems: currentEstimate.items,
        prefilledCustomer: currentEstimate.customer,
        prefilledBusinessType: currentEstimate.businessType,
        prefilledBranch: currentEstimate.branch,
        prefilledNotes: currentEstimate.notes
      } 
    });
  };

  if (loading || !currentEstimate) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading Estimate..." />
      </div>
    );
  }

  const finalTotal = currentEstimate.total || 0;
  const isExpired = currentEstimate.isExpired;
  const daysToExpiry = currentEstimate.daysToExpiry;

  return (
    <div style={{ padding: screens.xs ? 12 : 32, background: '#f0f2f5' }}>
      <style>{estimateStyles}</style>
      
      {/* Controls */}
      <div className="no-print">
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/estimations')}
                >
                  Back to Estimates
                </Button>
                <Divider type="vertical" />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    Estimate {currentEstimate.estimateNumber}
                  </Title>
                  <Space>
                    <Text type="secondary">Created: {moment(currentEstimate.createdAt?.toDate?.() || currentEstimate.createdAt).format('DD/MM/YYYY')}</Text>
                    
                    {isExpired ? (
                      <Tag color="red">EXPIRED</Tag>
                    ) : daysToExpiry <= 7 ? (
                      <Tag color="orange">Expires in {daysToExpiry} days</Tag>
                    ) : (
                      <Tag color="green">Valid for {daysToExpiry} days</Tag>
                    )}
                    
                    <Tag color={currentEstimate.businessType === 'wholesale' ? 'orange' : 'blue'}>
                      {currentEstimate.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}
                    </Tag>
                    
                    <Tag color={currentEstimate.status === 'converted' ? 'purple' : 'green'}>
                      {(currentEstimate.status || 'active').toUpperCase()}
                    </Tag>
                  </Space>
                </div>
              </Space>
            </Col>
            <Col>
              <Space>
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
                  Share Estimate
                </Button>
                
                {currentEstimate.status === 'active' && !isExpired && (
                  <Button 
                    icon={<FileAddOutlined />} 
                    onClick={handleConvertToInvoice}
                    type="primary"
                    style={{
                      backgroundColor: '#1890ff',
                      borderColor: '#1890ff'
                    }}
                    size="large"
                  >
                    Convert to Invoice
                  </Button>
                )}
                
                <Button 
                  icon={<PrinterOutlined />} 
                  onClick={handlePrint} 
                  size="large"
                >
                  Print
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleDownload} 
                  type="primary" 
                  size="large"
                  style={{
                    background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                    border: 'none'
                  }}
                >
                  Download PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Estimate Content */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div ref={estimateRef} className="estimate-container">
          
          {/* Header */}
          <div className="estimate-header">
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

          {/* ESTIMATE Title */}
          <div className="estimate-title">
            ESTIMATE
          </div>

          {/* GSTIN */}
          <div className="gstin-section">
            GSTIN: {MAIN_STORE_INFO.gstin}
          </div>

          {/* Estimate Details Section */}
          <div className="estimate-info">
            <div className="estimate-details">
              <div><strong>Estimate No.</strong> {currentEstimate.estimateNumber}</div>
              <div style={{ marginTop: '15px' }}><strong>Date:</strong> {moment(currentEstimate.createdAt?.toDate?.() || currentEstimate.createdAt).format('DD/MM/YYYY')}</div>
            </div>
            <div style={{ flex: 1, borderRight: '1px solid #000', borderLeft: '1px solid #000', paddingLeft: '10px', paddingRight: '10px' }}>
              <div><strong>Valid Until:</strong></div>
              <div style={{ marginTop: '15px' }}><strong>{moment(currentEstimate.expiryDate).format('DD/MM/YYYY')}</strong></div>
            </div>
            <div className="customer-details">
              <div><strong>Business Type:</strong> {currentEstimate.businessType === 'wholesale' ? 'Wholesale' : 'Retail'}</div>
              <div style={{ marginTop: '15px' }}><strong>Branch:</strong> {currentEstimate.branchInfo?.name || 'Main Branch'}</div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="customer-section">
            <div><strong>M/s. {currentEstimate.customer?.name || 'Walk-in Customer'}</strong></div>
            {currentEstimate.customer?.phone && (
              <div style={{ marginTop: '5px' }}>Ph: {currentEstimate.customer.phone}</div>
            )}
            {currentEstimate.customer?.email && (
              <div style={{ marginTop: '5px' }}>Email: {currentEstimate.customer.email}</div>
            )}
            <div style={{ marginTop: '10px' }}>
              <strong>GSTIN: ________________________________</strong>
            </div>
          </div>

          {/* Validity Alert */}
          <div className="validity-alert">
            This estimate is valid for 3 months from the date of issue • Expires: {moment(currentEstimate.expiryDate).format('DD/MM/YYYY')}
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
              {currentEstimate.items.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-center">-</td>
                  <td>{item.product?.name || 'Product'}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{item.price.toFixed(2)}</td>
                  <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              {/* Empty rows to complete 8 rows */}
              {Array.from({ length: Math.max(0, 8 - currentEstimate.items.length) }).map((_, index) => (
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

          {/* Totals Section with Notes */}
          <div className="totals-section">
            <div className="notes-section">
              <strong>Notes & Terms:</strong>
              <div style={{ marginTop: '10px', lineHeight: '1.4', minHeight: '60px' }}>
                {currentEstimate.notes || 'No additional notes provided.'}
              </div>
              <div style={{ marginTop: '15px', fontSize: '10px', color: '#666' }}>
                <div><strong>Terms & Conditions:</strong></div>
                <div>• This estimate is valid for 3 months from issue date</div>
                <div>• Prices may vary based on final specifications</div>
                <div>• All pottery items are handcrafted and may have natural variations</div>
                <div>• Final invoice will be generated upon order confirmation</div>
              </div>
            </div>
            <div className="totals-column">
              <div>
                <div style={{ fontSize: '14px', marginBottom: '5px' }}>ESTIMATED TOTAL</div>
                <div style={{ fontSize: '20px', color: '#8b4513' }}>₹{finalTotal.toFixed(2)}</div>
                <div style={{ fontSize: '10px', marginTop: '8px', color: '#666' }}>
                  ({currentEstimate.businessType === 'wholesale' ? 'Wholesale' : 'Retail'} Pricing)
                </div>
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
                <strong>HANDCRAFTED POTTERY • ECO-FRIENDLY • TRADITIONAL ART</strong>
              </div>
              <div style={{ fontSize: '10px' }}>
                Visit: {MAIN_STORE_INFO.website} • This is an estimate, not a tax invoice
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateView;