// src/components/billing/BillingHelpers.js
// Helper functions for the Billing component

/**
 * Get product price based on business type
 * @param {Object} product - The product object
 * @param {String} businessType - 'retail' or 'wholesale'
 * @returns {Number} - The price
 */
export const getProductPrice = (product, businessType) => {
  if (businessType === 'wholesale' && product.wholesalePrice) {
    return product.wholesalePrice;
  }
  return product.price;
};

/**
 * Calculate totals for the cart
 * @param {Array} cart - The cart items
 * @param {String} businessType - 'retail' or 'wholesale'
 * @returns {Object} - Calculated totals
 */
export const calculateTotals = (cart, businessType) => {
  const subtotal = cart.reduce((total, item) => total + (item.originalPrice * item.quantity), 0);
  const currentTotal = cart.reduce((total, item) => total + (item.currentPrice * item.quantity), 0);
  const totalDiscount = subtotal - currentTotal;
  const discountPercentage = subtotal > 0 ? ((totalDiscount / subtotal) * 100) : 0;

  // Wholesale discount (additional 5% for wholesale orders above ₹10,000)
  let wholesaleDiscount = 0;
  if (businessType === 'wholesale' && currentTotal > 10000) {
    wholesaleDiscount = currentTotal * 0.05;
  }

  const finalTotal = currentTotal - wholesaleDiscount;

  return {
    subtotal,
    currentTotal,
    totalDiscount,
    discountPercentage,
    wholesaleDiscount,
    finalTotal,
    itemCount: cart.length,
    totalQuantity: cart.reduce((total, item) => total + item.quantity, 0)
  };
};

/**
 * Update advance calculation based on cart and settings
 * @param {Array} cart - The cart items
 * @param {Boolean} isAdvanceBilling - Whether advance billing is enabled
 * @param {Number} advanceAmount - Amount of advance payment
 * @returns {Number} - Remaining amount to be paid
 */
export const calculateRemainingAmount = (cart, isAdvanceBilling, advanceAmount, businessType) => {
  const totals = calculateTotals(cart, businessType);
  if (isAdvanceBilling && advanceAmount > 0) {
    return Math.max(0, totals.finalTotal - advanceAmount);
  } else {
    return 0;
  }
};

/**
 * Clean location information for order data
 * @param {Object} location - The location object
 * @returns {Object} - Cleaned location info
 */
export const cleanLocationInfo = (location) => {
  if (!location) return {};
  
  return {
    id: location.id,
    name: location.name,
    type: location.type, // 'branch' or 'stall'
    displayName: location.displayName,
    locationInfo: location.locationInfo,
    address: location.address || {},
    contact: location.contact || {},
    manager: location.manager || location.setup?.inPersonMaintainedBy || '',
    // Additional stall-specific fields
    ...(location.type === 'stall' && {
      eventName: location.eventName,
      location: location.location,
      startDate: location.startDate,
      endDate: location.endDate,
      status: location.status
    })
  };
};

/**
 * Deep clean object by removing undefined fields
 * @param {Object} obj - The object to clean
 * @returns {Object} - Object without undefined fields
 */
export const removeUndefinedDeep = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedDeep);
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefinedDeep(obj[key]);
      }
    });
    return cleaned;
  }
  return obj;
};

/**
 * Prepare order data for submission
 * @param {Object} params - Order parameters
 * @returns {Object} - Cleaned order data
 */
export const prepareOrderData = ({
  cart,
  selectedCustomer,
  businessType,
  selectedBranch,
  currentLocation,
  isAdvanceBilling,
  advanceAmount,
  remainingAmount,
  finalPaymentMethod,
  selectedBank
}) => {
  const totals = calculateTotals(cart, businessType);
  
  const cleanedLocationInfo = cleanLocationInfo(currentLocation);
  
  const cleanItems = cart.map(item => {
    const cleanProduct = {};
    if (item.product) {
      Object.keys(item.product).forEach(key => {
        if (item.product[key] !== undefined) {
          cleanProduct[key] = item.product[key];
        }
      });
    }
    return {
      product: cleanProduct,
      quantity: item.quantity,
      originalPrice: item.originalPrice,
      currentPrice: item.currentPrice,
      price: item.currentPrice,
      discount: item.originalPrice > 0 ? ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100 : 0,
      businessType: item.businessType || businessType
    };
  });

  const rawOrderData = {
    customerId: selectedCustomer.id,
    businessType,
    branch: selectedBranch,
    branchInfo: cleanedLocationInfo,
    isAdvanceBilling,
    advanceAmount: isAdvanceBilling ? advanceAmount : 0,
    remainingAmount: isAdvanceBilling ? remainingAmount : 0,
    items: cleanItems,
    paymentMethod: finalPaymentMethod,
    bank: finalPaymentMethod !== 'Cash' ? selectedBank : undefined,
    subtotal: totals.subtotal,
    discount: totals.totalDiscount,
    discountPercentage: totals.discountPercentage,
    wholesaleDiscount: totals.wholesaleDiscount,
    afterDiscount: totals.currentTotal,
    total: totals.finalTotal,
  };
  
  return removeUndefinedDeep(rawOrderData);
};