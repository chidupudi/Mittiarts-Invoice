// src/utils/shortUrl.js - Short URL Token Generation Utility
// Generates compact 4-character tokens for short URLs like: invoice.mittiarts.com/i/K7mX

/**
 * Character set for short tokens
 * Excludes confusing characters: 0, O, l, 1, I
 * 58 characters = 11.3 million combinations for 4-char tokens
 */
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/**
 * Generate a cryptographically secure random short token
 * @param {number} length - Token length (default 4)
 * @returns {string} Random short token
 */
export const generateShortToken = (length = 4) => {
  const array = new Uint8Array(length);

  // Use crypto.getRandomValues for cryptographic security
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto (less secure)
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  let token = '';
  for (let i = 0; i < length; i++) {
    token += TOKEN_CHARS[array[i] % TOKEN_CHARS.length];
  }

  return token;
};

/**
 * Generate short URL for invoice
 * @param {string} shortToken - The 4-character short token
 * @returns {string} Complete short URL (28 characters)
 */
export const generateShortUrl = (shortToken) => {
  // Production URL format: invoice.mittiarts.com/i/XXXX (28 chars)
  const baseUrl = process.env.REACT_APP_SHORT_URL_BASE || 'invoice.mittiarts.com';
  return `${baseUrl}/i/${shortToken}`;
};

/**
 * Generate full invoice URL from share token
 * @param {string} shareToken - The full share token (used for database lookup)
 * @returns {string} Full public invoice URL
 */
export const generateFullInvoiceUrl = (shareToken) => {
  const baseUrl = process.env.REACT_APP_BASE_URL || 'https://invoice.mittiarts.com';
  return `${baseUrl}/public/invoice/${shareToken}`;
};

/**
 * Validate short token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid format
 */
export const isValidShortToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token.length !== 4) return false;

  // Check all characters are in allowed set
  return token.split('').every(char => TOKEN_CHARS.includes(char));
};

/**
 * Extract short token from short URL
 * @param {string} url - Short URL to parse
 * @returns {string|null} Extracted token or null
 */
export const extractShortToken = (url) => {
  if (!url) return null;

  // Match pattern: /i/XXXX
  const match = url.match(/\/i\/([A-Za-z0-9]{4})(?:$|\/|\?)/);
  return match ? match[1] : null;
};

export default {
  generateShortToken,
  generateShortUrl,
  generateFullInvoiceUrl,
  isValidShortToken,
  extractShortToken
};
