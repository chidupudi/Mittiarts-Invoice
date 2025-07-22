// api/test-zoko.js - Test Zoko endpoints to find working one
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const ZOKO_API_KEY = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
    
    // Test different Zoko endpoints
    const endpoints = [
      {
        name: 'Zoko App Endpoint',
        url: 'https://app.zoko.io/v2/account/profile',
        type: 'account'
      },
      {
        name: 'Zoko Main API',
        url: 'https://zoko.io/api/v2/account/profile', 
        type: 'account'
      },
      {
        name: 'Zoko API Subdomain',
        url: 'https://api.zoko.io/v2/account/profile',
        type: 'account'
      },
      {
        name: 'Alternative Zoko Domain',
        url: 'https://platform.zoko.io/v2/account/profile',
        type: 'account'
      }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`🧪 Testing ${endpoint.name}: ${endpoint.url}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ZOKO_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mitti-Arts-Test/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const result = {
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          working: response.ok
        };

        if (response.ok) {
          try {
            const data = await response.json();
            result.hasData = true;
            result.accountInfo = {
              id: data.id || 'present',
              business_name: data.business_name || 'available'
            };
          } catch (jsonError) {
            result.hasData = false;
            result.note = 'Response not JSON';
          }
        } else {
          result.error = await response.text();
        }

        results.push(result);
        console.log(`✅ ${endpoint.name}: ${response.status}`);

      } catch (error) {
        const result = {
          name: endpoint.name,
          url: endpoint.url,
          working: false,
          error: error.message,
          errorType: error.name
        };
        
        if (error.message.includes('certificate') || error.message.includes('TLS')) {
          result.tlsError = true;
        }
        
        results.push(result);
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }

    // Find working endpoints
    const workingEndpoints = results.filter(r => r.working);
    const tlsErrors = results.filter(r => r.tlsError);

    // Test message sending endpoint if we found working account endpoints
    let messagingResults = [];
    if (workingEndpoints.length > 0) {
      const messagingEndpoints = workingEndpoints.map(e => ({
        name: e.name + ' (Messaging)',
        url: e.url.replace('/account/profile', '/message/send')
      }));

      for (const msgEndpoint of messagingEndpoints) {
        try {
          // Test with a dry-run payload (won't actually send)
          const testPayload = {
            channel: 'whatsapp',
            recipient: '919999999999', // Test number
            type: 'text',
            message: {
              text: 'Test message - do not send'
            },
            dry_run: true // If Zoko supports this
          };

          const response = await fetch(msgEndpoint.url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ZOKO_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
          });

          messagingResults.push({
            name: msgEndpoint.name,
            url: msgEndpoint.url,
            status: response.status,
            working: response.status < 500, // Even 400 errors mean the endpoint exists
            note: response.status === 400 ? 'Endpoint exists (validation error expected)' : 'Unknown'
          });

        } catch (error) {
          messagingResults.push({
            name: msgEndpoint.name,
            url: msgEndpoint.url,
            working: false,
            error: error.message
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Zoko endpoint testing completed',
      timestamp: new Date().toISOString(),
      
      summary: {
        totalTested: results.length,
        workingEndpoints: workingEndpoints.length,
        tlsErrors: tlsErrors.length,
        recommendedEndpoint: workingEndpoints[0]?.url || 'None found'
      },
      
      accountEndpoints: results,
      messagingEndpoints: messagingResults,
      
      recommendations: workingEndpoints.length > 0 ? [
        `Use ${workingEndpoints[0].url.replace('/account/profile', '/message/send')} for messaging`,
        'Update your API endpoints in the main files',
        'Test with a real message to confirm functionality'
      ] : [
        'No working Zoko endpoints found',
        'Contact Zoko support about API access',
        'Verify your API key is valid',
        'Check if your Zoko account is active'
      ],
      
      troubleshooting: {
        tlsIssue: tlsErrors.length > 0,
        possibleCauses: tlsErrors.length > 0 ? [
          'Zoko API certificate configuration issue',
          'Temporary server problems at Zoko',
          'DNS or routing issues'
        ] : [
          'API key may be invalid',
          'Account may be suspended',
          'Service may be down'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
