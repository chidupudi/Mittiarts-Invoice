// api/send-advance-sms.js - Pertinax SMS API for Advance Payment with DLT Template
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST method.'
    });
  }

  try {
    console.log('📱 Pertinax Advance Payment SMS Request:', {
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    const {
      phoneNumber,
      customerName,
      advanceAmount,
      invoiceLink,
      smsText
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !advanceAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, advanceAmount'
      });
    }

    // Clean and validate phone number
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');

    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.'
      });
    }

    // Pertinax API Configuration
    const PERTINAX_API_KEY = '2ogC0TMtJkioQY1eLYAt4w';
    const PERTINAX_SENDER_ID = 'MTARTS';
    const DLT_TEMPLATE_ID = '1207176268898361869';
    const PERTINAX_API_URL = 'http://pertinaxsolution.com/api/mt/SendSMS';

    // Prepare SMS text (use provided text or build from template)
    let finalSmsText;
    if (smsText) {
      finalSmsText = smsText;
    } else {
      // Build SMS text from template with variables replaced
      finalSmsText = `Dear ${customerName.trim()}, advance payment of Rs.${advanceAmount} received. View invoice: ${invoiceLink || 'N/A'} Thank you! - Mitti Arts`;
    }

    console.log('📝 SMS Text Preview:', finalSmsText.substring(0, 80) + '...');

    // Build Pertinax API URL with query parameters
    const apiUrl = new URL(PERTINAX_API_URL);
    apiUrl.searchParams.append('APIKey', PERTINAX_API_KEY);
    apiUrl.searchParams.append('senderid', PERTINAX_SENDER_ID);
    apiUrl.searchParams.append('channel', 'Trans'); // Transactional SMS
    apiUrl.searchParams.append('DCS', '0'); // Normal message
    apiUrl.searchParams.append('flashsms', '0'); // Not flash SMS
    apiUrl.searchParams.append('number', `91${cleanNumber}`); // With country code
    apiUrl.searchParams.append('text', finalSmsText); // Complete SMS text
    apiUrl.searchParams.append('DLTTemplateId', DLT_TEMPLATE_ID); // DLT Template ID

    console.log('📡 Calling Pertinax SMS API...');
    console.log('🔧 Full API URL:', apiUrl.toString());
    console.log('📱 Recipient:', `91${cleanNumber}`);
    console.log('📋 Template ID:', DLT_TEMPLATE_ID);
    console.log('🏷️ Sender ID:', PERTINAX_SENDER_ID);
    console.log('📝 SMS Text:', finalSmsText);

    // Call Pertinax API
    const pertinaxResponse = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('📊 Pertinax Response Status:', pertinaxResponse.status);

    // Parse response
    let pertinaxData;
    const responseText = await pertinaxResponse.text();
    console.log('📊 Pertinax Raw Response:', responseText);

    try {
      pertinaxData = JSON.parse(responseText);
      console.log('📊 Pertinax Parsed Data:', pertinaxData);
    } catch (parseError) {
      console.error('❌ Failed to parse Pertinax response:', parseError.message);
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response from SMS gateway',
        rawResponse: responseText,
        httpStatus: pertinaxResponse.status
      });
    }

    // Check for success
    // Pertinax success response: {"ErrorCode":"000","ErrorMessage":"Done","JobId":"20047","MessageData":[...]}
    const isSuccess = pertinaxData.ErrorCode === '000' || pertinaxData.ErrorCode === 0;

    if (isSuccess) {
      console.log('✅ SUCCESS with Pertinax SMS API');

      // Extract message ID from response
      const messageId = pertinaxData.MessageData && pertinaxData.MessageData.length > 0
        ? pertinaxData.MessageData[0].MessageId
        : null;

      return res.status(200).json({
        success: true,
        messageId: messageId,
        jobId: pertinaxData.JobId,
        message: 'Advance payment SMS sent successfully via Pertinax',
        provider: 'Pertinax SMS',
        channel: 'SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        smsText: finalSmsText,
        cost: 'Per message pricing',

        // Template specific data
        templateInfo: {
          templateId: DLT_TEMPLATE_ID,
          templateName: 'advance--payments',
          senderId: PERTINAX_SENDER_ID,
          customerName: customerName.trim(),
          advanceAmount: advanceAmount,
          invoiceLink: invoiceLink || 'N/A'
        },

        // Pertinax response
        pertinaxResponse: {
          errorCode: pertinaxData.ErrorCode,
          errorMessage: pertinaxData.ErrorMessage,
          jobId: pertinaxData.JobId,
          messageId: messageId
        }
      });
    } else {
      // SMS sending failed
      console.log('❌ Pertinax SMS API failed:', pertinaxData.ErrorMessage);

      return res.status(400).json({
        success: false,
        error: pertinaxData.ErrorMessage || 'Failed to send SMS',
        errorCode: pertinaxData.ErrorCode,
        provider: 'Pertinax SMS',
        timestamp: new Date().toISOString(),

        troubleshooting: {
          possibleIssues: [
            'Template not approved or incorrect template ID',
            'Sender ID (MTARTS) not registered',
            'API Key invalid or expired',
            'Phone number format incorrect',
            'SMS text does not match DLT template exactly',
            'Insufficient balance in Pertinax account'
          ],
          recommendations: [
            'Verify DLT template ID: 1207176268898361869',
            'Check if sender ID MTARTS is approved',
            'Verify API key: 2ogC0TMt...',
            'Ensure SMS text matches template exactly',
            'Check Pertinax account balance'
          ]
        },

        requestDetails: {
          phoneNumber: `+91${cleanNumber}`,
          senderId: PERTINAX_SENDER_ID,
          templateId: DLT_TEMPLATE_ID,
          smsTextLength: finalSmsText.length
        }
      });
    }

  } catch (error) {
    console.error('❌ Handler error:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        errorType: error.name,
        possibleCauses: [
          'Network connection issue with Pertinax API',
          'API endpoint unreachable',
          'Timeout during API call',
          'Invalid request format'
        ],
        recommendations: [
          'Check internet connectivity',
          'Verify Pertinax API is online',
          'Check API endpoint: http://pertinaxsolution.com/api/mt/SendSMS',
          'Contact Pertinax support if issue persists'
        ]
      }
    });
  }
}
