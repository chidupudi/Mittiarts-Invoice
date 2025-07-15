// api/status.js - Complete Twilio SMS API status check for Mitti Arts
// Enhanced API status check endpoint with Twilio diagnostics

// Your Twilio credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}`;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle preflight request
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
    console.log('🔍 API Status check requested for Twilio');

    // Basic health check data
    const healthCheck = {
      service: 'Mitti Arts SMS API (Powered by Twilio)',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? `${Math.floor(process.uptime())} seconds` : 'unknown',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      provider: 'Twilio'
    };

    // Check API configuration
    const configuration = {
      twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
      accountSID: TWILIO_ACCOUNT_SID ? `${TWILIO_ACCOUNT_SID.substring(0, 8)}...${TWILIO_ACCOUNT_SID.substring(TWILIO_ACCOUNT_SID.length - 4)}` : 'Not configured',
      authTokenConfigured: !!TWILIO_AUTH_TOKEN,
      phoneNumber: TWILIO_PHONE_NUMBER,
      apiUrl: TWILIO_API_URL,
      endpoints: {
        'send-sms': {
          path: '/api/send-sms',
          method: 'POST',
          description: 'Send regular bill SMS via Twilio'
        },
        'send-advance-sms': {
          path: '/api/send-advance-sms', 
          method: 'POST',
          description: 'Send advance payment SMS via Twilio'
        },
        'send-completion-sms': {
          path: '/api/send-completion-sms',
          method: 'POST', 
          description: 'Send payment completion SMS via Twilio'
        },
        'status': {
          path: '/api/status',
          method: 'GET',
          description: 'API health and Twilio status check'
        }
      }
    };

    // Test Twilio connectivity (optional - only if query param is present)
    let twilioProviderStatus = {
      available: 'unknown',
      message: 'Connectivity test not performed',
      testPerformed: false
    };

    if (req.query.testTwilio === 'true') {
      try {
        console.log('🧪 Testing Twilio connectivity...');
        
        // Create Basic Auth header for Twilio
        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        // Test Twilio by fetching account info
        const testResponse = await fetch(`${TWILIO_API_URL}.json`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        });

        const testData = await testResponse.json();

        if (testResponse.status === 200 && testData.sid) {
          twilioProviderStatus = {
            available: true,
            message: 'Twilio API is reachable and authenticated',
            testPerformed: true,
            responseTime: `${Date.now() - startTime}ms`,
            accountInfo: {
              friendlyName: testData.friendly_name,
              status: testData.status,
              type: testData.type,
              dateCreated: testData.date_created
            }
          };
        } else {
          twilioProviderStatus = {
            available: false,
            message: `Twilio returned status: ${testResponse.status}`,
            testPerformed: true,
            error: testData.message || testData.error_message || 'Unknown error'
          };
        }
      } catch (testError) {
        console.warn('⚠️ Twilio connectivity test failed:', testError.message);
        twilioProviderStatus = {
          available: false,
          message: `Twilio connectivity test failed: ${testError.message}`,
          testPerformed: true,
          error: testError.code || testError.name || 'UNKNOWN'
        };
      }
    }

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
      url: req.url,
      headers: {
        host: req.headers.host,
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'] ? `${req.headers['user-agent'].substring(0, 50)}...` : undefined
      }
    };

    // Performance metrics
    const performance = {
      responseTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Determine overall health status
    let overallStatus = 'healthy';
    let statusCode = 200;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      overallStatus = 'degraded';
      statusCode = 200; // Still return 200 but indicate degraded service
    }

    if (twilioProviderStatus.available === false && twilioProviderStatus.testPerformed) {
      overallStatus = 'degraded';
    }

    const response = {
      success: true,
      status: overallStatus,
      ...healthCheck,
      configuration,
      twilioProvider: twilioProviderStatus,
      system: systemInfo,
      request: requestInfo,
      performance,
      
      // Usage instructions
      usage: {
        message: 'Mitti Arts SMS API powered by Twilio is running',
        documentation: 'Send POST requests to the endpoint URLs with required parameters',
        testTwilio: 'Add ?testTwilio=true to test Twilio connectivity',
        support: 'Contact: info@mittiarts.com',
        twilioConsole: 'https://console.twilio.com',
        pricing: 'SMS charges apply per message sent via Twilio'
      },

      // Twilio specific information
      twilioInfo: {
        apiEndpoint: TWILIO_API_URL,
        phoneNumber: TWILIO_PHONE_NUMBER,
        messagingService: 'Standard SMS via Twilio',
        supportedCountries: ['India (+91)', 'US (+1)', 'Global reach'],
        features: ['SMS', 'MMS', 'WhatsApp Business API', 'Voice', 'Video'],
        reliability: '99.95% uptime SLA',
        documentation: 'https://www.twilio.com/docs/sms',
        pricing: 'https://www.twilio.com/sms/pricing'
      },

      // Pottery business specific info
      mittiArtsInfo: {
        businessType: 'Handcrafted Pottery & Terracotta Art',
        smsTypes: ['Bill SMS', 'Advance Payment SMS', 'Completion SMS', 'Reminder SMS'],
        targetMarket: 'Indian pottery customers',
        phoneFormat: 'Indian mobile numbers (+91 format)',
        invoiceSystem: 'Digital invoices with SMS notifications'
      }
    };

    console.log(`✅ Twilio status check completed in ${performance.responseTime}`);

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    const errorResponse = {
      success: false,
      status: 'error',
      error: 'Internal server error during status check',
      timestamp: new Date().toISOString(),
      provider: 'Twilio',
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