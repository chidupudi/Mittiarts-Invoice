
// =============================================================================
// 3. api/utils/validation.js
// =============================================================================

export function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;
  
  // Remove any country code and non-digits
  const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
  
  // Check if it's a valid 10-digit Indian mobile number
  return /^[6-9]\d{9}$/.test(cleanNumber);
}

export function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
}

export function validateRequiredFields(data, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  return missing;
}

export function generateBillToken() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 15);
  const extraRandom = Math.random().toString(36).substr(2, 10);
  return `mitti_${timestamp}_${randomPart}_${extraRandom}`.toUpperCase();
}
