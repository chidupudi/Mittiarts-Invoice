// api/send-sms.js - Zoko WhatsApp Template Message + Fast2SMS Fallback (FIXED)
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
    console.log('📱 Zoko Template + Fast2SMS Invoice Message Request:', {
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    const { 
      phoneNumber, 
      customerName, 
      orderNumber, 
      billToken,
      totalAmount 
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber'
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

    // Generate invoice link
    let origin = req.headers.origin || req.headers.referer;
    if (!origin) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || req.headers['x-forwarded-host'] || 'invoice.mittiarts.com';
      origin = `${protocol}://${host}`;
    }
    origin = origin.replace(/\/$/, '');
    
    const billLink = billToken && billToken !== 'none' 
      ? `${origin}/public/invoice/${billToken}` 
      : `${origin}`;

    console.log('📱 Attempting Zoko WhatsApp Template Message...');

    // Zoko configuration (declared outside try block for error handling)
    const ZOKO_API_KEY = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
    const ZOKO_API_URL = 'https://chat.zoko.io/v2/message';
    const TEMPLATE_ID = 'order_inovice'; // Fixed: Your template ID
    const whatsappNumber = `91${cleanNumber}`;

    // Try Zoko WhatsApp Template Message first
    try {

      // Prepare template arguments in correct order
      // Template: {{1}} = Customer Name, {{2}} = Order Number, {{3}} = Amount, {{4}} = Invoice Link
      const templateArgs = [
        customerName.trim(),                    // {{1}} - Customer Name
        orderNumber.trim(),                     // {{2}} - Order Number  
        String((totalAmount || 0).toFixed(2)),  // {{3}} - Amount (ensure string)
        billLink                                // {{4}} - Invoice Link
      ];

      // Zoko Template Message Payload (based on documentation)
      const zokoPayload = {
        channel: 'whatsapp',
        recipient: whatsappNumber,
        type: 'template',              // Template message type
        templateId: TEMPLATE_ID,       // Your template ID
        templateArgs: templateArgs     // Array of values for {{1}}, {{2}}, {{3}}, {{4}}
      };

      console.log('📡 Calling Zoko WhatsApp Template API...');
      console.log('🔧 Template ID:', TEMPLATE_ID);
      console.log('📱 Recipient:', whatsappNumber);
      console.log('📋 Template Args:', templateArgs);

      const zokoResponse = await fetch(ZOKO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'apikey': ZOKO_API_KEY
        },
        body: JSON.stringify(zokoPayload)
      });

      console.log('📊 Zoko Template Response Status:', zokoResponse.status);

      if (zokoResponse.ok) {
        const zokoData = await zokoResponse.json();
        console.log('📊 Zoko Template Response Data:', zokoData);

        // Check for success in Zoko response
        if (zokoData && (zokoData.success !== false)) {
          console.log('✅ SUCCESS with Zoko WhatsApp Template Message');
          
          return res.status(200).json({
            success: true,
            messageId: zokoData.id || zokoData.messageId || Date.now().toString(),
            message: 'WhatsApp template message sent successfully via Zoko',
            provider: 'Zoko WhatsApp Template',
            channel: 'WhatsApp',
            sentAt: new Date().toISOString(),
            phoneNumber: `+91${cleanNumber}`,
            whatsappNumber: whatsappNumber,
            billLink: billLink,
            cost: 'Per message pricing',
            
            // Template specific data
            templateInfo: {
              templateId: TEMPLATE_ID,
              templateArgs: templateArgs,
              customerName: customerName.trim(),
              orderNumber: orderNumber.trim(),
              amount: (totalAmount || 0).toFixed(2),
              invoiceLink: billLink
            },
            
            zokoResponse: zokoData
          });
        }
      }

      // If Zoko fails, get response text for debugging
      const errorText = await zokoResponse.text();
      console.log('❌ Zoko Template API failed:', zokoResponse.status, errorText);
      throw new Error(`Zoko Template API returned status ${zokoResponse.status}: ${errorText}`);

    } catch (zokoError) {
      console.log('❌ Zoko WhatsApp Template failed:', zokoError.message);
      console.log('🔄 Falling back to Fast2SMS...');
      
      // Fallback to Fast2SMS
      try {
        const smsMessage = `Mitti Arts Invoice
Dear ${customerName.trim()},
Order: ${orderNumber.trim()}
Amount: Rs.${(totalAmount || 0).toFixed(2)}
Invoice: ${billLink}
Contact: 9441550927
- Mitti Arts Team`;

        const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: smsMessage,
            route: 'q',
            numbers: cleanNumber,
            flash: '0'
          })
        });

        const fast2smsData = await fast2smsResponse.json();
        console.log('📊 Fast2SMS Response:', fast2smsData);

        if (fast2smsResponse.ok && fast2smsData.return === true) {
          console.log('✅ Success with Fast2SMS fallback');
          
          return res.status(200).json({
            success: true,
            messageId: fast2smsData.request_id,
            message: 'SMS sent successfully via Fast2SMS (fallback after Zoko template attempt)',
            provider: 'Fast2SMS (Fallback)',
            channel: 'SMS',
            sentAt: new Date().toISOString(),
            phoneNumber: `+91${cleanNumber}`,
            billLink: billLink,
            cost: 'SMS pricing',
            fallbackReason: 'Zoko WhatsApp template failed',
            templateAttempted: 'order_inovice'
          });
        }

        throw new Error(`Fast2SMS error: ${JSON.stringify(fast2smsData)}`);

      } catch (fast2smsError) {
        console.log('❌ Fast2SMS also failed:', fast2smsError.message);
        
        // Both providers failed
        return res.status(503).json({
          success: false,
          error: 'All messaging providers are currently unavailable',
          attempts: [
            {
              provider: 'Zoko WhatsApp Template',
              templateId: 'order_inovice',
              endpoint: ZOKO_API_URL,
              error: zokoError.message,
              timestamp: new Date().toISOString()
            },
            {
              provider: 'Fast2SMS',
              error: fast2smsError.message,
              timestamp: new Date().toISOString()
            }
          ],
          troubleshooting: {
            zokoTemplate: {
              templateId: 'order_inovice',
              templateArgs: [
                customerName.trim(),
                orderNumber.trim(),
                String((totalAmount || 0).toFixed(2)),
                billLink
              ],
              note: 'Template message attempted but failed'
            },
            possibleIssues: [
              'Template not approved by WhatsApp yet',
              'Template ID mismatch - check spelling: order_inovice',
              'Template arguments count mismatch (needs exactly 4)',
              'Zoko account or API key issues'
            ],
            recommendations: [
              'Check if template is approved in Zoko dashboard',
              'Verify template ID spelling: order_inovice',
              'Ensure template has 4 variables {{1}}, {{2}}, {{3}}, {{4}}',
              'Contact Zoko support if template is approved but still failing'
            ]
          },
          fallbackOptions: {
            manual: {
              whatsappLink: `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(`Mitti Arts Invoice - Order: ${orderNumber.trim()}, Amount: ₹${(totalAmount || 0).toFixed(2)}, Invoice: ${billLink}`)}`,
              customerPhone: `+91${cleanNumber}`
            }
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Handler error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}