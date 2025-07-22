// api/status.js - Zoko WhatsApp API Health Check and Status Monitor for Mitti Arts
export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET method for status checks
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.',
      allowedMethods: ['GET'],
      timestamp: new Date().toISOString()
    });
  }

  const startTime = Date.now();

  try {
    console.log('🔍 Zoko WhatsApp API Status Check Requested:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    // Zoko WhatsApp API Configuration
    const ZOKO_API_KEY = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
    const ZOKO_API_URL = 'https://api.zoko.io/v2/message/send';

    // Basic health check data
    const healthCheck = {
      service: 'Mitti Arts WhatsApp Messaging (Powered by Zoko)',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? `${Math.floor(process.uptime())} seconds` : 'unknown',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      provider: 'Zoko WhatsApp API',
      region: 'India',
      businessType: 'Pottery & Handicrafts',
      channel: 'WhatsApp Business'
    };

    // API Configuration Status
    const configuration = {
      zokoConfigured: !!ZOKO_API_KEY,
      apiKey: ZOKO_API_KEY ? 
        `${ZOKO_API_KEY.substring(0, 8)}...${ZOKO_API_KEY.substring(ZOKO_API_KEY.length - 4)}` : 
        'Not configured',
      apiUrl: ZOKO_API_URL,
      channel: 'WhatsApp Business',
      supportedCountries: ['India', 'Global'],
      phoneNumberFormat: 'International format (91XXXXXXXXXX for India)',
      
      // Available WhatsApp endpoints
      endpoints: {
        'send-sms': {
          path: '/api/send-sms',
          method: 'POST',
          description: 'Send regular invoice/bill WhatsApp messages via Zoko',
          status: 'active',
          messageType: 'text'
        },
        'send-advance-sms': {
          path: '/api/send-advance-sms', 
          method: 'POST',
          description: 'Send advance payment notification WhatsApp messages via Zoko',
          status: 'active',
          messageType: 'text'
        },
        'send-completion-sms': {
          path: '/api/send-completion-sms',
          method: 'POST', 
          description: 'Send payment completion WhatsApp messages via Zoko',
          status: 'active',
          messageType: 'text'
        },
        'status': {
          path: '/api/status',
          method: 'GET',
          description: 'API health check and Zoko WhatsApp status monitoring',
          status: 'active'
        }
      }
    };

    // Performance metrics
    const responseTime = Date.now() - startTime;
    const performance = {
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      serverTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      performanceStatus: responseTime < 1000 ? 'excellent' : responseTime < 3000 ? 'good' : 'slow'
    };

    // System information
    const systemInfo = {
      nodeVersion: process.version || 'unknown',
      platform: process.platform || 'unknown',
      architecture: process.arch || 'unknown',
      memory: process.memoryUsage ? {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(process.memoryUsage().external / 1024 / 1024)} MB`
      } : 'unknown'
    };

    // Request information
    const requestInfo = {
      userAgent: req.headers['user-agent'] || 'unknown',
      origin: req.headers.origin || req.headers.referer || 'unknown',
      ip: req.headers['x-forwarded-for'] || 
          req.headers['x-real-ip'] || 
          req.connection?.remoteAddress || 
          'unknown',
      method: req.method,
      url: req.url,
      host: req.headers.host || 'unknown',
      protocol: req.headers['x-forwarded-proto'] || 'unknown'
    };

    // Zoko Service Status Check
    let zokoStatus = {
      reachable: 'unknown',
      message: 'Service status not tested in basic health check'
    };

    // If query parameter ?testConnection=true is provided, test Zoko connectivity
    if (req.query?.testConnection === 'true') {
      try {
        console.log('🧪 Testing Zoko WhatsApp API connectivity...');
        
        // Test with a simple API call to check if Zoko is responding
        const testResponse = await fetch('https://api.zoko.io/v2/account/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ZOKO_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mitti-Arts-POS-Health-Check/1.0'
          }
        });

        const testTime = Date.now() - startTime;

        if (testResponse.ok) {
          try {
            const testData = await testResponse.json();
            zokoStatus = {
              reachable: true,
              status: 'api_responding',
              message: 'Zoko WhatsApp API is responding correctly',
              responseTime: `${testTime}ms`,
              httpStatus: testResponse.status,
              accountInfo: {
                accountConnected: true,
                businessName: testData.business_name || 'Mitti Arts',
                whatsappStatus: testData.whatsapp_status || 'connected',
                accountId: testData.id ? 'available' : 'unknown'
              }
            };
          } catch (jsonError) {
            zokoStatus = {
              reachable: true,
              status: 'api_responding_no_json',
              message: 'Zoko API responding but response format unexpected',
              responseTime: `${testTime}ms`,
              httpStatus: testResponse.status
            };
          }
        } else {
          zokoStatus = {
            reachable: false,
            status: 'connection_failed',
            message: `Zoko WhatsApp API returned HTTP ${testResponse.status}`,
            httpStatus: testResponse.status,
            responseTime: `${testTime}ms`
          };
        }
      } catch (testError) {
        zokoStatus = {
          reachable: false,
          status: 'connection_error',
          message: `Failed to connect to Zoko WhatsApp API: ${testError.message}`,
          error: testError.message,
          errorType: testError.name
        };
      }
    }

    // Determine overall health status
    let overallStatus = 'healthy';
    let statusCode = 200;
    let healthMessage = 'All systems operational for Mitti Arts WhatsApp messaging';

    if (!ZOKO_API_KEY) {
      overallStatus = 'degraded';
      healthMessage = 'Zoko WhatsApp API key not configured';
      statusCode = 200; // Still return 200 but indicate degraded status
    }

    if (zokoStatus.reachable === false) {
      overallStatus = 'degraded';
      healthMessage = 'Zoko WhatsApp API connectivity issues detected';
    }

    if (responseTime > 5000) {
      overallStatus = 'slow';
      healthMessage = 'API response time is slower than expected';
    }

    // Build comprehensive response
    const response = {
      success: true,
      status: overallStatus,
      message: healthMessage,
      ...healthCheck,
      
      // Core configuration and status
      configuration,
      system: systemInfo,
      request: requestInfo,
      performance,
      zokoStatus,
      
      // Usage instructions and documentation
      usage: {
        message: 'Mitti Arts WhatsApp Messaging API powered by Zoko is operational',
        documentation: 'Send POST requests to WhatsApp endpoints with required parameters',
        support: 'Contact: info@mittiarts.com or 9441550927',
        testConnection: 'Add ?testConnection=true to test Zoko WhatsApp connectivity'
      },

      // Zoko specific information
      zokoInfo: {
        provider: 'Zoko',
        website: 'https://zoko.io',
        apiEndpoint: ZOKO_API_URL,
        channel: 'WhatsApp Business API',
        messageTypes: ['text', 'template', 'media', 'interactive'],
        supportedCountries: ['Global'],
        features: ['WhatsApp Messages', 'Broadcast', 'Chatbot', 'Analytics'],
        estimatedCost: 'Pay per message - varies by country',
        documentation: 'https://docs.zoko.io',
        dashboard: 'https://app.zoko.io',
        support: 'https://zoko.io/support'
      },

      // Mitti Arts business specific information
      mittiArtsInfo: {
        businessName: 'Mitti Arts',
        businessType: 'Handcrafted Pottery & Terracotta Art',
        location: 'Hyderabad, Telangana, India',
        contact: '9441550927 / 7382150250',
        email: 'info@mittiarts.com',
        address: 'Opp. Romoji Film City, Main Gate, Near Maisamma Temple, Hyderabad',
        whatsappTypes: [
          'Invoice/Bill WhatsApp Messages',
          'Advance Payment WhatsApp Messages', 
          'Payment Completion WhatsApp Messages',
          'Order Status WhatsApp Messages'
        ],
        targetMarket: 'Indian pottery and handicraft customers',
        phoneFormat: 'Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)',
        messagingSystem: 'WhatsApp Business messages for pottery orders with invoice links',
        specialFeatures: [
          'Pottery-themed messaging with emojis',
          'Advance payment tracking',
          'Order completion notifications',
          'Store pickup instructions',
          'Care instructions for pottery items'
        ]
      },

      // API metrics and monitoring
      metrics: {
        totalEndpoints: Object.keys(configuration.endpoints).length,
        activeEndpoints: Object.values(configuration.endpoints).filter(e => e.status === 'active').length,
        healthCheckTime: performance.responseTime,
        apiVersion: healthCheck.version,
        lastHealthCheck: healthCheck.timestamp,
        whatsappChannel: 'Enabled',
        messagingProvider: 'Zoko',
        testConnectionAvailable: true,
        supportedMessageTypes: ['Invoice', 'Advance Payment', 'Payment Completion', 'Custom']
      }
    };

    console.log(`✅ Zoko WhatsApp status check completed in ${performance.responseTime} - Status: ${overallStatus}`);

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    const errorResponse = {
      success: false,
      status: 'error',
      message: 'Internal server error during health check',
      error: 'Health check system failure',
      timestamp: new Date().toISOString(),
      provider: 'Zoko WhatsApp API',
      service: 'Mitti Arts WhatsApp Messaging',
      
      performance: {
        responseTime: `${Date.now() - startTime}ms`,
        failed: true,
        errorTime: new Date().toISOString()
      },
      
      // Include debug information in development
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        }
      }),
      
      // Basic troubleshooting information
      troubleshooting: {
        possibleCauses: [
          'Server overload',
          'Memory issues',
          'Network connectivity problems',
          'Zoko WhatsApp API issues',
          'Invalid API configuration'
        ],
        recommendations: [
          'Check server resources',
          'Verify Zoko WhatsApp API status at zoko.io',
          'Review error logs',
          'Test with ?testConnection=true parameter',
          'Contact system administrator'
        ],
        support: {
          mittiArts: 'info@mittiarts.com',
          phone: '9441550927',
          zoko: 'https://zoko.io/support'
        }
      }
    };
    
    return res.status(500).json(errorResponse);
  }
}