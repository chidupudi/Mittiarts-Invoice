export const SMS_TEMPLATES = {
  BILL: {
    template: `🏺 Dear {customerName},

Thank you for your purchase at Mitti Arts!

Order: {orderNumber}
Amount: ₹{totalAmount}

View your bill: {billLink}

We appreciate your business!
- Mitti Arts Team`,
    variables: ['customerName', 'orderNumber', 'totalAmount', 'billLink']
  },
  
  ADVANCE: {
    template: `🏺 Dear {customerName},

Advance payment received for Mitti Arts!

Order: {orderNumber}
Advance Paid: ₹{advanceAmount}
Balance Due: ₹{remainingAmount}

View bill: {billLink}

Thank you for choosing Mitti Arts!`,
    variables: ['customerName', 'orderNumber', 'advanceAmount', 'remainingAmount', 'billLink']
  },
  
  COMPLETION: {
    template: `🏺 Dear {customerName},

Payment completed for Mitti Arts order!

Order: {orderNumber}
Final Payment: ₹{finalAmount}
Status: PAID IN FULL ✅

Final bill: {billLink}

Thank you for your business!
- Mitti Arts Team`,
    variables: ['customerName', 'orderNumber', 'finalAmount', 'billLink']
  }
};

export const BANK_OPTIONS = [
  'Art of Indian pottery',
  'Swadeshi pottery', 
  'Telangana Shilpakala',
  'Clay Ganesha shoba'
];

export const MITTI_ARTS_INFO = {
  name: 'Mitti Arts',
  website: 'https://mittiarts.com',
  phone: '+91 9441550927',
  email: 'info@mittiarts.com'
};