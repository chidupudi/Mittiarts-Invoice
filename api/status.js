// api/status.js - Pertinax SMS API Health Check and Status Monitor for Mitti Arts
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
    console.log('🔍 Pertinax SMS API Status Check Requested:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    // Pertinax SMS API Configuration
    const PERTINAX_API_KEY = '2ogC0TMtJkioQY1eLYAt4w';
    const PERTINAX_API_URL = 'http://pertinaxsolution.com/api/mt/SendSMS';
    const PERTINAX_SENDER_ID = 'MTARTS';

    // Basic health check data
    const healthCheck = {
      service: 'Mitti Arts SMS Messaging (Powered by Pertinax)',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? `${Math.floor(process.uptime())} seconds` : 'unknown',
      version: '3.0.0',
      environment: process.env.NODE_ENV || 'production',
      provider: 'Pertinax SMS Gateway',
      region: 'India',
      businessType: 'Pottery & Handicrafts',
      channel: 'SMS (DLT Compliant)'
    };

    // API Configuration Status
    const configuration = {
      pertinaxConfigured: !!PERTINAX_API_KEY,
      apiKey: PERTINAX_API_KEY ?
        `${PERTINAX_API_KEY.substring(0, 8)}...${PERTINAX_API_KEY.substring(PERTINAX_API_KEY.length - 4)}` :
        'Not configured',
      apiUrl: PERTINAX_API_URL,
      senderId: PERTINAX_SENDER_ID,
      channel: 'Trans (Transactional)',
      dltCompliant: true,
      supportedCountries: ['India'],
      phoneNumberFormat: 'Indian mobile numbers (91XXXXXXXXXX)',

      // DLT Templates
      dltTemplates: {
        registered: [
          {
            name: 'advance--payments',
            id: '1207176268898361869',
            type: 'Service Implicit',
            category: 'Consumer goods and automobiles',
            status: 'approved',
            endpoint: '/api/send-advance-sms'
          },
          {
            name: 'invoice',
            id: '1207176364615544587',
            type: 'Service Implicit',
            category: 'Consumer goods and automobiles',
            status: 'approved',
            endpoint: '/api/send-full-invoice-sms'
          }
        ],
        pending: [
          {
            name: 'invoice_payment_complete',
            id: 'pending',
            type: 'Service Implicit',
            status: 'not_registered'
          }
        ]
      },

      // Available SMS endpoints
      endpoints: {
        'send-advance-sms': {
          path: '/api/send-advance-sms',
          method: 'POST',
          description: 'Send advance payment SMS via Pertinax (DLT Template)',
          status: 'active',
          messageType: 'text',
          dltTemplateId: '1207176268898361869',
          senderId: 'MTARTS'
        },
        'send-full-invoice-sms': {
          path: '/api/send-full-invoice-sms',
          method: 'POST',
          description: 'Send full invoice SMS via Pertinax (DLT Template)',
          status: 'active',
          messageType: 'text',
          dltTemplateId: '1207176364615544587',
          senderId: 'MTARTS'
        },
        'status': {
          path: '/api/status',
          method: 'GET',
          description: 'API health check and Pertinax SMS status monitoring',
          status: 'active'
        }
      },

      // Deprecated endpoints
      deprecatedEndpoints: {
        'send-sms': {
          path: '/api/send-sms',
          status: 'deprecated',
          reason: 'Migrated to Pertinax DLT-compliant SMS',
          replacement: 'Use /api/send-advance-sms or /api/send-full-invoice-sms'
        },
        'send-completion-sms': {
          path: '/api/send-completion-sms',
          status: 'deprecated',
          reason: 'DLT template not registered yet',
          replacement: 'Will be activated after DLT approval'
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

    // Pertinax Service Status Check
    let pertinaxStatus = {
      reachable: 'unknown',
      message: 'Service status not tested in basic health check'
    };

    // If query parameter ?testConnection=true is provided, test Pertinax connectivity
    if (req.query?.testConnection === 'true') {
      try {
        console.log('🧪 Testing Pertinax SMS API connectivity...');

        // Test with balance check API
        const balanceCheckUrl = `http://pertinaxsolution.com/api/mt/GetBalance?APIKey=${PERTINAX_API_KEY}`;

        const testResponse = await fetch(balanceCheckUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mitti-Arts-POS-Health-Check/1.0'
          }
        });

        const testTime = Date.now() - startTime;

        if (testResponse.ok) {
          try {
            const testData = await testResponse.json();
            // Response format: {"ErrorCode":"0","ErrorMessage":"Done","Balance":"Promo:9988|Trans:0"}

            const isSuccess = testData.ErrorCode === '0' || testData.ErrorCode === 0;

            pertinaxStatus = {
              reachable: isSuccess,
              status: isSuccess ? 'api_responding' : 'api_error',
              message: isSuccess ? 'Pertinax SMS API is responding correctly' : `API Error: ${testData.ErrorMessage}`,
              responseTime: `${testTime}ms`,
              httpStatus: testResponse.status,
              accountInfo: {
                balance: testData.Balance || 'unknown',
                errorCode: testData.ErrorCode,
                errorMessage: testData.ErrorMessage
              }
            };
          } catch (jsonError) {
            pertinaxStatus = {
              reachable: true,
              status: 'api_responding_no_json',
              message: 'Pertinax API responding but response format unexpected',
              responseTime: `${testTime}ms`,
              httpStatus: testResponse.status
            };
          }
        } else {
          pertinaxStatus = {
            reachable: false,
            status: 'connection_failed',
            message: `Pertinax SMS API returned HTTP ${testResponse.status}`,
            httpStatus: testResponse.status,
            responseTime: `${testTime}ms`
          };
        }
      } catch (testError) {
        pertinaxStatus = {
          reachable: false,
          status: 'connection_error',
          message: `Failed to connect to Pertinax SMS API: ${testError.message}`,
          error: testError.message,
          errorType: testError.name
        };
      }
    }

    // Determine overall health status
    let overallStatus = 'healthy';
    let statusCode = 200;
    let healthMessage = 'All systems operational for Mitti Arts SMS messaging';

    if (!PERTINAX_API_KEY) {
      overallStatus = 'degraded';
      healthMessage = 'Pertinax SMS API key not configured';
      statusCode = 200; // Still return 200 but indicate degraded status
    }

    if (pertinaxStatus.reachable === false) {
      overallStatus = 'degraded';
      healthMessage = 'Pertinax SMS API connectivity issues detected';
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
      pertinaxStatus,

      // Usage instructions and documentation
      usage: {
        message: 'Mitti Arts SMS Messaging API powered by Pertinax is operational',
        documentation: 'Send POST requests to SMS endpoints with required parameters',
        support: 'Contact: info@mittiarts.com or 9441550927',
        testConnection: 'Add ?testConnection=true to test Pertinax SMS connectivity',
        dltCompliance: 'All SMS templates are TRAI DLT compliant'
      },

      // Pertinax specific information
      pertinaxInfo: {
        provider: 'Pertinax Solution',
        website: 'http://pertinaxsolution.com',
        apiEndpoint: PERTINAX_API_URL,
        channel: 'SMS Gateway',
        senderId: PERTINAX_SENDER_ID,
        messageTypes: ['text'],
        supportedCountries: ['India'],
        features: ['DLT Compliant Templates', 'Transactional SMS', 'Delivery Reports', 'Balance Check'],
        estimatedCost: 'Pay per message - Rs. 0.15-0.25 per SMS',
        documentation: 'http://pertinaxsolution.com/Web/WebAPI/',
        dltRegistration: 'JIO TrueConnect DLT Portal',
        traiCompliant: true
      },

      // Mitti Arts business specific information
      mittiArtsInfo: {
        businessName: 'Mitti Arts',
        businessType: 'Handcrafted Pottery & Terracotta Art',
        location: 'Hyderabad, Telangana, India',
        contact: '9441550927 / 7382150250',
        email: 'info@mittiarts.com',
        address: 'Opp. Romoji Film City, Main Gate, Near Maisamma Temple, Hyderabad',
        smsTypes: [
          'Advance Payment SMS (Active)',
          'Full Payment Invoice SMS (Pending DLT)',
          'Payment Completion SMS (Pending DLT)'
        ],
        targetMarket: 'Indian pottery and handicraft customers',
        phoneFormat: 'Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)',
        messagingSystem: 'DLT-compliant SMS for pottery orders with invoice links',
        specialFeatures: [
          'TRAI DLT Compliant',
          'Advance payment tracking',
          'Order completion notifications',
          'Invoice link sharing',
          'Template-based messaging'
        ]
      },

      // API metrics and monitoring
      metrics: {
        totalEndpoints: Object.keys(configuration.endpoints).length,
        activeEndpoints: Object.values(configuration.endpoints).filter(e => e.status === 'active').length,
        healthCheckTime: performance.responseTime,
        apiVersion: healthCheck.version,
        lastHealthCheck: healthCheck.timestamp,
        smsChannel: 'Enabled',
        messagingProvider: 'Pertinax',
        testConnectionAvailable: true,
        supportedMessageTypes: ['Advance Payment', 'Full Invoice', 'Completion (Pending)'],
        dltTemplatesRegistered: 2,
        dltTemplatesPending: 1
      }
    };

    console.log(`✅ Pertinax SMS status check completed in ${performance.responseTime} - Status: ${overallStatus}`);

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Status check error:', error);

    const errorResponse = {
      success: false,
      status: 'error',
      message: 'Internal server error during health check',
      error: 'Health check system failure',
      timestamp: new Date().toISOString(),
      provider: 'Pertinax SMS API',
      service: 'Mitti Arts SMS Messaging',

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
          'Pertinax SMS API issues',
          'Invalid API configuration'
        ],
        recommendations: [
          'Check server resources',
          'Verify Pertinax SMS API status',
          'Review error logs',
          'Test with ?testConnection=true parameter',
          'Contact system administrator'
        ],
        support: {
          mittiArts: 'info@mittiarts.com',
          phone: '9441550927',
          pertinax: 'http://pertinaxsolution.com'
        }
      }
    };

    return res.status(500).json(errorResponse);
  }
}
