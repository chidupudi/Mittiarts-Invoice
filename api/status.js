// api/status.js - Fast2SMS API status check for Mitti Arts
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.',
      timestamp: new Date().toISOString()
    });
  }

  const startTime = Date.now();

  try {
    console.log('🔍 API Status check requested for Fast2SMS');

    // Your Fast2SMS API key
    const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';

    // Basic health check data
    const healthCheck = {
      service: 'Mitti Arts SMS API (Powered by Fast2SMS)',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? `${Math.floor(process.uptime())} seconds` : 'unknown',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      provider: 'Fast2SMS'
    };

    // Check API configuration
    const configuration = {
      fast2smsConfigured: !!FAST2SMS_API_KEY,
      apiKey: FAST2SMS_API_KEY ? `${FAST2SMS_API_KEY.substring(0, 8)}...${FAST2SMS_API_KEY.substring(FAST2SMS_API_KEY.length - 4)}` : 'Not configured',
      route: 'q (Quick Route - Non-DLT)',
      apiUrl: 'https://www.fast2sms.com/dev/bulkV2',
      endpoints: {
        'send-sms': {
          path: '/api/send-sms',
          method: 'POST',
          description: 'Send regular bill SMS via Fast2SMS'
        },
        'send-advance-sms': {
          path: '/api/send-advance-sms', 
          method: 'POST',
          description: 'Send advance payment SMS via Fast2SMS'
        },
        'send-completion-sms': {
          path: '/api/send-completion-sms',
          method: 'POST', 
          description: 'Send payment completion SMS via Fast2SMS'
        },
        'status': {
          path: '/api/status',
          method: 'GET',
          description: 'API health and Fast2SMS status check'
        }
      }
    };

    // Performance metrics
    const performance = {
      responseTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // System information
    const systemInfo = {
      nodeVersion: process.version || 'unknown',
      platform: process.platform || 'unknown',
      memory: process.memoryUsage ? {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
      } : 'unknown'
    };

    // Request information
    const requestInfo = {
      userAgent: req.headers['user-agent'] || 'unknown',
      origin: req.headers.origin || req.headers.referer || 'unknown',
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown',
      method: req.method,
      url: req.url
    };

    // Determine overall health status
    let overallStatus = 'healthy';
    let statusCode = 200;

    if (!FAST2SMS_API_KEY) {
      overallStatus = 'degraded';
      statusCode = 200;
    }

    const response = {
      success: true,
      status: overallStatus,
      ...healthCheck,
      configuration,
      system: systemInfo,
      request: requestInfo,
      performance,
      
      // Usage instructions
      usage: {
        message: 'Mitti Arts SMS API powered by Fast2SMS is running',
        documentation: 'Send POST requests to the endpoint URLs with required parameters',
        support: 'Contact: info@mittiarts.com',
        fast2smsPortal: 'https://www.fast2sms.com',
        pricing: 'SMS charges apply per message sent via Fast2SMS'
      },

      // Fast2SMS specific information
      fast2smsInfo: {
        apiEndpoint: 'https://www.fast2sms.com/dev/bulkV2',
        route: 'q (Quick Route)',
        dltRequired: false,
        supportedCountries: ['India'],
        features: ['SMS', 'OTP', 'Voice OTP', 'Email'],
        costPerSMS: '₹0.25 - ₹0.50 per SMS',
        documentation: 'https://www.fast2sms.com/docs',
        dashboard: 'https://www.fast2sms.com/dashboard'
      },

      // Pottery business specific info
      mittiArtsInfo: {
        businessType: 'Handcrafted Pottery & Terracotta Art',
        smsTypes: ['Bill SMS', 'Advance Payment SMS', 'Completion SMS', 'Reminder SMS'],
        targetMarket: 'Indian pottery customers',
        phoneFormat: 'Indian mobile numbers (10 digits)',
        invoiceSystem: 'Digital invoices with SMS notifications'
      }
    };

    console.log(`✅ Fast2SMS status check completed in ${performance.responseTime}`);

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    const errorResponse = {
      success: false,
      status: 'error',
      error: 'Internal server error during status check',
      timestamp: new Date().toISOString(),
      provider: 'Fast2SMS',
      performance: {
        responseTime: `${Date.now() - startTime}ms`,
        failed: true
      },
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          stack: error.stack
        }
      })
    };
    
    return res.status(500).json(errorResponse);
  }
}