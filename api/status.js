// api/status.js - Fast2SMS API Health Check and Status Monitor for Mitti Arts
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
    console.log('🔍 Fast2SMS API Status Check Requested:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    // Fast2SMS API Configuration
    const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    const FAST2SMS_ROUTE = 'q'; // Quick route (non-DLT)
    const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

    // Basic health check data
    const healthCheck = {
      service: 'Mitti Arts SMS API (Powered by Fast2SMS)',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? `${Math.floor(process.uptime())} seconds` : 'unknown',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      provider: 'Fast2SMS',
      region: 'India',
      businessType: 'Pottery & Handicrafts'
    };

    // API Configuration Status
    const configuration = {
      fast2smsConfigured: !!FAST2SMS_API_KEY,
      apiKey: FAST2SMS_API_KEY ? 
        `${FAST2SMS_API_KEY.substring(0, 8)}...${FAST2SMS_API_KEY.substring(FAST2SMS_API_KEY.length - 4)}` : 
        'Not configured',
      route: FAST2SMS_ROUTE,
      routeType: 'Quick Route (Non-DLT)',
      apiUrl: FAST2SMS_URL,
      supportedCountries: ['India'],
      phoneNumberFormat: 'Indian 10-digit mobile numbers (6-9 starting)',
      
      // Available SMS endpoints
      endpoints: {
        'send-sms': {
          path: '/api/send-sms',
          method: 'POST',
          description: 'Send regular invoice/bill SMS via Fast2SMS',
          status: 'active'
        },
        'send-advance-sms': {
          path: '/api/send-advance-sms', 
          method: 'POST',
          description: 'Send advance payment notification SMS via Fast2SMS',
          status: 'active'
        },
        'send-completion-sms': {
          path: '/api/send-completion-sms',
          method: 'POST', 
          description: 'Send payment completion SMS via Fast2SMS',
          status: 'active'
        },
        'status': {
          path: '/api/status',
          method: 'GET',
          description: 'API health check and Fast2SMS status monitoring',
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

    // Fast2SMS Service Status Check (optional connectivity test)
    let fast2smsStatus = {
      reachable: 'unknown',
      message: 'Service status not tested in basic health check'
    };

    // If query parameter ?testConnection=true is provided, test Fast2SMS connectivity
    if (req.query?.testConnection === 'true') {
      try {
        console.log('🧪 Testing Fast2SMS connectivity...');
        
        // Test with a dummy number that won't actually send SMS
        const testParams = new URLSearchParams({
          authorization: FAST2SMS_API_KEY,
          message: 'Test connectivity - ignore',
          route: FAST2SMS_ROUTE,
          numbers: '9999999999', // Test number
          flash: '0'
        });

        const testResponse = await fetch(`${FAST2SMS_URL}?${testParams.toString()}`, {
          method: 'GET',
          headers: {
            'cache-control': 'no-cache',
            'User-Agent': 'Mitti-Arts-POS-Health-Check/1.0'
          }
        });

        if (testResponse.ok) {
          const testData = await testResponse.json();
          fast2smsStatus = {
            reachable: true,
            status: testData.return ? 'api_responding' : 'api_error',
            message: testData.return ? 'Fast2SMS API is responding' : 'Fast2SMS API returned error',
            responseTime: `${Date.now() - startTime}ms`,
            testData: testData
          };
        } else {
          fast2smsStatus = {
            reachable: false,
            status: 'connection_failed',
            message: `Fast2SMS API returned HTTP ${testResponse.status}`,
            httpStatus: testResponse.status
          };
        }
      } catch (testError) {
        fast2smsStatus = {
          reachable: false,
          status: 'connection_error',
          message: `Failed to connect to Fast2SMS: ${testError.message}`,
          error: testError.message
        };
      }
    }

    // Determine overall health status
    let overallStatus = 'healthy';
    let statusCode = 200;
    let healthMessage = 'All systems operational';

    if (!FAST2SMS_API_KEY) {
      overallStatus = 'degraded';
      healthMessage = 'Fast2SMS API key not configured';
      statusCode = 200; // Still return 200 but indicate degraded status
    }

    if (fast2smsStatus.reachable === false) {
      overallStatus = 'degraded';
      healthMessage = 'Fast2SMS API connectivity issues detected';
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
      fast2smsStatus,
      
      // Usage instructions and documentation
      usage: {
        message: 'Mitti Arts SMS API powered by Fast2SMS is operational',
        documentation: 'Send POST requests to SMS endpoints with required parameters',
        support: 'Contact: info@mittiarts.com',
        testConnection: 'Add ?testConnection=true to test Fast2SMS connectivity'
      },

      // Fast2SMS specific information
      fast2smsInfo: {
        provider: 'Fast2SMS',
        website: 'https://www.fast2sms.com',
        apiEndpoint: FAST2SMS_URL,
        route: `${FAST2SMS_ROUTE} (Quick Route)`,
        dltRequired: false,
        supportedCountries: ['India'],
        features: ['SMS', 'OTP', 'Voice OTP', 'Email'],
        estimatedCost: '₹0.25 - ₹0.50 per SMS',
        documentation: 'https://www.fast2sms.com/docs',
        dashboard: 'https://www.fast2sms.com/dashboard',
        support: 'https://www.fast2sms.com/support'
      },

      // Mitti Arts business specific information
      mittiArtsInfo: {
        businessName: 'Mitti Arts',
        businessType: 'Handcrafted Pottery & Terracotta Art',
        location: 'Hyderabad, Telangana, India',
        contact: '9441550927 / 7382150250',
        smsTypes: [
          'Invoice/Bill SMS',
          'Advance Payment SMS', 
          'Payment Completion SMS',
          'Order Reminder SMS'
        ],
        targetMarket: 'Indian pottery and handicraft customers',
        phoneFormat: 'Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)',
        invoiceSystem: 'Digital invoices with SMS notifications for pottery orders'
      },

      // API metrics and monitoring
      metrics: {
        totalEndpoints: Object.keys(configuration.endpoints).length,
        activeEndpoints: Object.values(configuration.endpoints).filter(e => e.status === 'active').length,
        healthCheckTime: performance.responseTime,
        apiVersion: healthCheck.version,
        lastHealthCheck: healthCheck.timestamp
      }
    };

    console.log(`✅ Fast2SMS status check completed in ${performance.responseTime} - Status: ${overallStatus}`);

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    const errorResponse = {
      success: false,
      status: 'error',
      message: 'Internal server error during health check',
      error: 'Health check system failure',
      timestamp: new Date().toISOString(),
      provider: 'Fast2SMS',
      service: 'Mitti Arts SMS API',
      
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
          'Fast2SMS API issues'
        ],
        recommendations: [
          'Check server resources',
          'Verify Fast2SMS API status',
          'Review error logs',
          'Contact system administrator'
        ],
        support: 'info@mittiarts.com'
      }
    };
    
    return res.status(500).json(errorResponse);
  }
}