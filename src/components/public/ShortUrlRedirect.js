// src/components/public/ShortUrlRedirect.js
// Redirects short URLs (/i/XXXX) to full invoice URLs

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { isValidShortToken } from '../../utils/shortUrl';

const ShortUrlRedirect = () => {
  const { shortToken } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveShortUrl = async () => {
      try {
        console.log('🔗 Resolving short URL token:', shortToken);

        // Validate token format
        if (!isValidShortToken(shortToken)) {
          console.warn('❌ Invalid short token format:', shortToken);
          setError('Invalid invoice link');
          setLoading(false);
          return;
        }

        // Query orders collection for shortToken
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('shortToken', '==', shortToken),
          limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn('❌ No order found for short token:', shortToken);
          setError('Invoice not found or link has expired');
          setLoading(false);
          return;
        }

        // Get the order data
        let orderData = null;
        querySnapshot.forEach((doc) => {
          orderData = { id: doc.id, ...doc.data() };
        });

        if (!orderData || !orderData.shareToken) {
          console.warn('❌ Order found but no shareToken:', shortToken);
          setError('Invoice link is incomplete');
          setLoading(false);
          return;
        }

        // Redirect to full invoice URL
        console.log('✅ Redirecting to full invoice:', orderData.shareToken.slice(0, 10) + '...');
        navigate(`/public/invoice/${orderData.shareToken}`, { replace: true });

      } catch (err) {
        console.error('❌ Error resolving short URL:', err);
        setError('Unable to load invoice. Please try again.');
        setLoading(false);
      }
    };

    resolveShortUrl();
  }, [shortToken, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏺</div>
          <Spin size="large" />
          <p style={{
            marginTop: 16,
            color: '#8b4513',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            Loading Invoice...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
        padding: '20px'
      }}>
        <Result
          status="404"
          title="Invoice Not Found"
          subTitle={error}
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            maxWidth: '500px'
          }}
          extra={
            <Button
              type="primary"
              onClick={() => window.location.href = 'https://invoice.mittiarts.com'}
              style={{ background: '#8b4513', borderColor: '#8b4513' }}
            >
              Go to Home
            </Button>
          }
        />
      </div>
    );
  }

  return null;
};

export default ShortUrlRedirect;
