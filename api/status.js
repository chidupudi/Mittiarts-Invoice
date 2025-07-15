// api/status.js - Enhanced API status check endpoint with diagnostics
import axios from 'axios';

const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

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
    console.log('🔍 API Status check requested');

    // Basic health check data
    const healthCheck = {
      service: 'Mitti Arts SMS API',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? `${Math.floor(process.uptime())} seconds` : 'unknown',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    };

    // Check API configuration
    const configuration = {
      apiConfigured: !!FAST2SMS_API_KEY,
      apiKeyLength: FAST2SMS_API_KEY ? FAST2SMS_API_KEY.length : 0,
      apiKeyMasked: FAST2SMS_API_KEY ? `${FAST2SMS_API_KEY.substring(0, 8)}...${FAST2SMS_API_KEY.substring(FAST2SMS_API_KEY.length - 4)}` : 'Not configured',
      smsProviderUrl: FAST2SMS_URL,
      endpoints: {
        'send-sms': {
          path: '/api/send-sms',
          method: 'POST',
          description: 'Send regular bill SMS'
        },
        'send-advance-sms': {
          path: '/api/send-advance-sms', 
          method: 'POST',
          description: 'Send advance payment SMS'
        },
        'send-completion-sms': {
          path: '/api/send-completion-sms',
          method: 'POST', 
          description: 'Send payment completion SMS'
        },
        'status': {
          path: '/api/status',
          method: 'GET',
          description: 'API health and status check'
        }
      }
    };

    // Test Fast2SMS connectivity (optional - only if query param is present)
    let smsProviderStatus = {
      available: 'unknown',
      message: 'Connectivity test not performed',
      testPerformed: false
    };

    if (req.query.testSMS === 'true') {
      try {
        console.log('🧪 Testing Fast2SMS connectivity...');
        
        const testResponse = await axios.get('https://www.fast2sms.com', {
          timeout: 5000,
          validateStatus: function (status) {
            return status < 500;
          }
        });

        if (testResponse.status === 200) {
          smsProviderStatus = {
            available: true,
            message: 'Fast2SMS is reachable',
            testPerformed: true,
            responseTime: `${Date.now() - startTime}ms`
          };
        } else {
          smsProviderStatus = {
            available: false,
            message: `Fast2SMS returned status: ${testResponse.status}`,
            testPerformed: true
          };
        }
      } catch (testError) {
        console.warn('⚠️ SMS provider connectivity test failed:', testError.message);
        smsProviderStatus = {
          available: false,
          message: `Fast2SMS connectivity test failed: ${testError.message}`,
          testPerformed: true,
          error: testError.code || 'UNKNOWN'
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

    if (!FAST2SMS_API_KEY) {
      overallStatus = 'degraded';
      statusCode = 200; // Still return 200 but indicate degraded service
    }

    if (smsProviderStatus.available === false && smsProviderStatus.testPerformed) {
      overallStatus = 'degraded';
    }

    const response = {
      success: true,
      status: overallStatus,
      ...healthCheck,
      configuration,
      smsProvider: smsProviderStatus,
      system: systemInfo,
      request: requestInfo,
      performance,
      
      // Usage instructions
      usage: {
        message: 'Mitti Arts SMS API is running',
        documentation: 'Send POST requests to the endpoint URLs with required parameters',
        testSMS: 'Add ?testSMS=true to test SMS provider connectivity',
        support: 'Contact: info@mittiarts.com'
      }
    };

    console.log(`✅ Status check completed in ${performance.responseTime}`);

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    const errorResponse = {
      success: false,
      status: 'error',
      error: 'Internal server error during status check',
      timestamp: new Date().toISOString(),
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