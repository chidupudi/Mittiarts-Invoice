// src/services/firebaseService.js - Updated with Estimation Support
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

class FirebaseService {
  constructor() {
    // Rate limiting for public access
    this.publicAccessAttempts = new Map();
    this.maxAttemptsPerMinute = 10;

    // Admin users who can access all data
    this.adminEmails = [
      'admin@mittiarts.com',
      'mittiarts@gmail.com',
      'niteeshklv20004@gmail.com'
    ];
  }

  // Check if current user is admin
  isAdmin() {
    return auth.currentUser && this.adminEmails.includes(auth.currentUser.email);
  }

  // Rate limiting for public access
  checkRateLimit(ip = 'unknown') {
    const now = Date.now();
    const attempts = this.publicAccessAttempts.get(ip) || [];
    
    // Remove attempts older than 1 minute
    const recentAttempts = attempts.filter(time => now - time < 60000);
    
    if (recentAttempts.length >= this.maxAttemptsPerMinute) {
      throw new Error('Too many requests. Please try again later.');
    }
    
    recentAttempts.push(now);
    this.publicAccessAttempts.set(ip, recentAttempts);
  }

  // Helper to convert Firestore document to plain object
  convertDocToPlainObject(docData) {
    const plainObject = { ...docData };
    
    Object.keys(plainObject).forEach(key => {
      const value = plainObject[key];
      
      if (value instanceof Timestamp) {
        plainObject[key] = value.toDate().toISOString();
      } else if (value?.toDate && typeof value.toDate === 'function') {
        plainObject[key] = value.toDate().toISOString();
      } else if (value instanceof Date) {
        plainObject[key] = value.toISOString();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        plainObject[key] = this.convertDocToPlainObject(value);
      } else if (Array.isArray(value)) {
        plainObject[key] = value.map(item => 
          (item && typeof item === 'object') ? this.convertDocToPlainObject(item) : item
        );
      }
    });
    
    return plainObject;
  }

  // 🆕 NEW: Public access method for estimates by share token
  async getEstimateByShareToken(shareToken, clientIp = 'unknown') {
    try {
      console.log('🔍 Public estimate access attempt for token:', shareToken?.slice(0, 10) + '...');
      console.log('📍 Access from IP:', clientIp);

      if (!shareToken) {
        throw new Error('Invalid estimate link');
      }

      // Rate limiting for public access
      this.checkRateLimit(clientIp);

      // Query estimates by shareToken
      const estimatesRef = collection(db, 'estimates');
      const q = query(
        estimatesRef, 
        where('shareToken', '==', shareToken),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn('🚫 Estimate not found for token:', shareToken?.slice(0, 10) + '...');
        throw new Error('Estimate not found or link may have expired');
      }

      let estimateData = null;
      querySnapshot.forEach((doc) => {
        const data = this.convertDocToPlainObject(doc.data());
        estimateData = { id: doc.id, ...data };
      });

      if (!estimateData) {
        throw new Error('Estimate not found');
      }

      // Check and update validity status
      const createdAt = estimateData.createdAt ? new Date(estimateData.createdAt) : new Date();
      const expiryDate = new Date(createdAt);
      expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months validity

      const now = new Date();
      const isExpired = now > expiryDate;
      const daysToExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      // Add calculated fields
      estimateData.isExpired = isExpired;
      estimateData.expiryDate = expiryDate;
      estimateData.daysToExpiry = Math.max(0, daysToExpiry);

      // Update status if expired (but don't fail if update fails)
      if (isExpired && estimateData.status === 'active') {
        try {
          const docRef = doc(db, 'estimates', estimateData.id);
          await updateDoc(docRef, { 
            status: 'expired',
            expiredAt: Timestamp.now()
          });
          estimateData.status = 'expired';
          console.log('📅 Estimate status updated to expired');
        } catch (updateError) {
          console.warn('Failed to update expired status:', updateError);
        }
      }

      // Log access for security/analytics
      try {
        await this.logEstimateAccess(estimateData.id, shareToken, clientIp);
      } catch (logError) {
        console.warn('Failed to log estimate access:', logError);
        // Don't fail the request if logging fails
      }

      // Enrich with customer data if available
      if (estimateData.customerId) {
        try {
          const customer = await this.getCustomerForPublicAccess(estimateData.customerId);
          estimateData.customer = customer;
          console.log('👤 Customer data enriched for public access');
        } catch (customerError) {
          console.warn('Customer not found for estimate:', customerError);
          // Don't fail if customer not found
        }
      }

      // Remove sensitive data for public access
      const publicEstimateData = this.sanitizeEstimateForPublic(estimateData);

      console.log('✅ Public estimate access granted:', estimateData.id);
      return publicEstimateData;

    } catch (error) {
      console.error('❌ Error fetching estimate by share token:', error);
      throw error;
    }
  }

  // 🆕 Log estimate access for analytics and security
  async logEstimateAccess(estimateId, shareToken, clientIp) {
    try {
      const accessLog = {
        estimateId,
        shareToken,
        clientIp: clientIp || 'unknown',
        accessedAt: Timestamp.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        source: 'public_estimate_view'
      };

      await addDoc(collection(db, 'estimate_access_logs'), accessLog);
      console.log('📊 Estimate access logged');
    } catch (error) {
      console.error('Failed to log estimate access:', error);
      // Don't throw error - logging is optional
    }
  }

  // 🆕 Get customer data for public estimate access (sanitized)
  async getCustomerForPublicAccess(customerId) {
    try {
      const docRef = doc(db, 'customers', customerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const customerData = this.convertDocToPlainObject(docSnap.data());
        // Return only public fields
        return {
          name: customerData.name,
          phone: customerData.phone
        };
      }
      return null;
    } catch (error) {
      console.warn('Error getting customer for public access:', error);
      return null;
    }
  }

  // 🆕 Remove sensitive data from estimate for public access
  sanitizeEstimateForPublic(estimateData) {
    const sanitized = { ...estimateData };
    
    // Remove sensitive business data
    delete sanitized.userId;
    delete sanitized.internalNotes;
    delete sanitized.costPrice;
    delete sanitized.profit;
    delete sanitized.margin;
    delete sanitized.analytics;
    
    // Sanitize customer data (keep only name and phone)
    if (sanitized.customer) {
      sanitized.customer = {
        name: sanitized.customer.name,
        phone: sanitized.customer.phone
      };
    }

    // Sanitize items (remove sensitive data)
    if (sanitized.items) {
      sanitized.items = sanitized.items.map(item => ({
        product: {
          id: item.product?.id,
          name: item.product?.name,
          category: item.product?.category
        },
        quantity: item.quantity,
        price: item.price
      }));
    }

    // Keep only essential branch info
    if (sanitized.branchInfo) {
      sanitized.branchInfo = {
        name: sanitized.branchInfo.name,
        address: sanitized.branchInfo.address
      };
    }

    return sanitized;
  }

  // 🆕 Get estimate analytics (admin sees all, users see their own)
  async getEstimateAnalytics(filters = {}) {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      const { startDate, endDate } = filters;

      let q = collection(db, 'estimates');

      // Admin can see all estimates, regular users only their own
      if (!this.isAdmin()) {
        q = query(q, where('userId', '==', auth.currentUser.uid));
      }

      if (startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))));
      }
      if (endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(new Date(endDate))));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const estimates = [];
      
      querySnapshot.forEach((doc) => {
        const data = this.convertDocToPlainObject(doc.data());
        estimates.push({ id: doc.id, ...data });
      });
      
      // Calculate analytics
      const analytics = {
        total: estimates.length,
        active: estimates.filter(e => e.status === 'active' && !this.isEstimateExpired(e)).length,
        expired: estimates.filter(e => e.status === 'expired' || this.isEstimateExpired(e)).length,
        converted: estimates.filter(e => e.status === 'converted').length,
        cancelled: estimates.filter(e => e.status === 'cancelled').length,
        totalValue: estimates.reduce((sum, e) => sum + (e.total || 0), 0),
        averageValue: estimates.length > 0 ? estimates.reduce((sum, e) => sum + (e.total || 0), 0) / estimates.length : 0,
        conversionRate: estimates.length > 0 ? (estimates.filter(e => e.status === 'converted').length / estimates.length) * 100 : 0,
        businessTypeBreakdown: {
          retail: estimates.filter(e => e.businessType === 'retail').length,
          wholesale: estimates.filter(e => e.businessType === 'wholesale').length
        }
      };

      return analytics;
    } catch (error) {
      console.error('Error calculating estimate analytics:', error);
      throw error;
    }
  }

  // 🆕 Helper method to check if estimate is expired
  isEstimateExpired(estimate) {
    const createdAt = estimate.createdAt ? new Date(estimate.createdAt) : new Date();
    const expiryDate = new Date(createdAt);
    expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months validity
    return new Date() > expiryDate;
  }

  // 🆕 ADMIN: Get comprehensive business analytics
  async getBusinessAnalytics() {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      // Get all collections
      const [orders, estimates, customers, products, branches] = await Promise.all([
        this.getAll('orders', {}),
        this.getAll('estimates', {}),
        this.getAll('customers', {}),
        this.getAll('products', {}),
        this.getAll('branches', {})
      ]);

      // Calculate comprehensive analytics
      const analytics = {
        overview: {
          totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
          totalOrders: orders.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalEstimates: estimates.length,
          activeBranches: branches.filter(b => b.status === 'active').length
        },
        revenue: {
          thisMonth: this.getMonthlyRevenue(orders, 0),
          lastMonth: this.getMonthlyRevenue(orders, 1),
          growth: this.calculateGrowthRate(orders)
        },
        customers: {
          new: customers.filter(c => this.isThisMonth(c.createdAt)).length,
          returning: customers.filter(c => c.orderCount > 1).length,
          topCustomers: this.getTopCustomers(customers, orders)
        },
        products: {
          bestsellers: this.getBestsellingProducts(products, orders),
          lowStock: products.filter(p => p.stock <= p.minStock).length
        },
        estimates: {
          converted: estimates.filter(e => e.status === 'converted').length,
          pending: estimates.filter(e => e.status === 'active').length,
          conversionRate: estimates.length > 0 ?
            (estimates.filter(e => e.status === 'converted').length / estimates.length * 100) : 0
        },
        branches: {
          performance: this.getBranchPerformance(branches, orders),
          revenue: branches.reduce((sum, b) => sum + (b.monthlyRevenue || 0), 0)
        }
      };

      return analytics;
    } catch (error) {
      console.error('Error in getBusinessAnalytics:', error);
      throw error;
    }
  }

  // Helper methods for analytics
  getMonthlyRevenue(orders, monthsAgo = 0) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthsAgo);

    return orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === targetDate.getMonth() &&
               orderDate.getFullYear() === targetDate.getFullYear();
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }

  calculateGrowthRate(orders) {
    const thisMonth = this.getMonthlyRevenue(orders, 0);
    const lastMonth = this.getMonthlyRevenue(orders, 1);
    return lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;
  }

  isThisMonth(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  getTopCustomers(customers, orders) {
    return customers
      .map(customer => ({
        ...customer,
        totalSpent: orders
          .filter(o => o.customerId === customer.id)
          .reduce((sum, o) => sum + (o.total || 0), 0)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }

  getBestsellingProducts(products, orders) {
    const productSales = {};

    orders.forEach(order => {
      order.items?.forEach(item => {
        const productId = item.productId || item.product?.id;
        if (productId) {
          productSales[productId] = (productSales[productId] || 0) + item.quantity;
        }
      });
    });

    return products
      .map(product => ({
        ...product,
        totalSold: productSales[product.id] || 0
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);
  }

  getBranchPerformance(branches, orders) {
    return branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      orders: orders.filter(o => o.branchInfo?.name === branch.name).length,
      revenue: orders
        .filter(o => o.branchInfo?.name === branch.name)
        .reduce((sum, o) => sum + (o.total || 0), 0),
      monthlyRevenue: branch.monthlyRevenue || 0
    }));
  }

  // EXISTING: Public access method for orders by share token
  async getOrderByShareToken(shareToken, clientIp = 'unknown') {
    try {
      console.log('🔍 Public access attempt for token:', shareToken?.slice(0, 10) + '...');
      console.log('📍 Access from IP:', clientIp);

      if (!shareToken) {
        throw new Error('Invalid invoice link');
      }

      // Query orders by shareToken
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('shareToken', '==', shareToken),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn('🚫 Invoice not found for token:', shareToken?.slice(0, 10) + '...');
        throw new Error('Invoice not found');
      }

      let orderData = null;
      querySnapshot.forEach((doc) => {
        const data = this.convertDocToPlainObject(doc.data());
        orderData = { id: doc.id, ...data };
      });

      if (!orderData) {
        throw new Error('Invoice not found');
      }

      // Log access for security
      console.log('✅ Public invoice access:', {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        customerName: orderData.customer?.name || 'Walk-in',
        accessIP: clientIp,
        accessTime: new Date().toISOString()
      });

      // Remove sensitive data for public access
      const publicOrderData = this.sanitizeOrderForPublic(orderData);
      return publicOrderData;
    } catch (error) {
      console.error('❌ Public invoice access error:', error.message);
      throw new Error(`Unable to access invoice: ${error.message}`);
    }
  }

  // EXISTING: Public access method for orders by bill token (keeping for SMS compatibility)
  async getOrderByBillToken(billToken, clientIp = 'unknown') {
    try {
      // Rate limiting
      this.checkRateLimit(clientIp);
      
      console.log('🔍 Public access attempt for token:', billToken?.slice(0, 10) + '...');
      
      // Validate token format first
      if (!billToken || !this.isValidBillTokenFormat(billToken)) {
        throw new Error('Invalid invoice link format');
      }

      // Query orders by billToken
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('billToken', '==', billToken),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn('🚫 Invoice not found for token:', billToken?.slice(0, 10) + '...');
        throw new Error('Invoice not found or link has expired');
      }

      let orderData = null;
      querySnapshot.forEach((doc) => {
        const data = this.convertDocToPlainObject(doc.data());
        orderData = { id: doc.id, ...data };
      });

      if (!orderData) {
        throw new Error('Invoice not found');
      }

      // Check if token is expired
      if (this.isBillTokenExpired(orderData)) {
        console.warn('⏰ Expired token access attempt:', billToken?.slice(0, 10) + '...');
        throw new Error('Invoice link has expired. Please contact us for a new link.');
      }

      // Remove sensitive data from public response
      const publicOrderData = this.sanitizeOrderForPublic(orderData);

      console.log('✅ Public invoice access granted:', orderData.id);
      return publicOrderData;
    } catch (error) {
      console.error('❌ Public invoice access error:', error.message);
      throw new Error(`Unable to access invoice: ${error.message}`);
    }
  }

  // EXISTING: Validate bill token format
  isValidBillTokenFormat(token) {
    return /^MITTI_[A-Z0-9_]+$/.test(token);
  }

  // EXISTING: Check if bill token is expired (tokens expire after 90 days)
  isBillTokenExpired(order) {
    if (!order.createdAt) return true;
    
    const createdDate = order.createdAt instanceof Timestamp 
      ? order.createdAt.toDate() 
      : new Date(order.createdAt);
    
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + 90); // 90 days expiry
    
    return new Date() > expiryDate;
  }

  // EXISTING: Remove sensitive data for public access
  sanitizeOrderForPublic(orderData) {
    const sanitized = { ...orderData };
    
    // Remove sensitive business data
    delete sanitized.userId;
    delete sanitized.internalNotes;
    delete sanitized.costPrice;
    delete sanitized.profit;
    delete sanitized.margin;
    
    // Sanitize customer data (keep only name and phone)
    if (sanitized.customer) {
      sanitized.customer = {
        name: sanitized.customer.name,
        phone: sanitized.customer.phone
      };
    }

    // Sanitize items (remove cost and profit data)
    if (sanitized.items) {
      sanitized.items = sanitized.items.map(item => ({
        product: {
          id: item.product?.id,
          name: item.product?.name,
          category: item.product?.category
        },
        quantity: item.quantity,
        price: item.price
      }));
    }

    return sanitized;
  }

  // UPDATED: Authenticated access - user can only see their own documents
  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = this.convertDocToPlainObject(docSnap.data());
        const document = { id: docSnap.id, ...data };
        
        // 🔒 SECURITY CHECK: Ensure user can only access their own documents
        // BUT allow access to documents without userId (legacy data) if user is authenticated
        if (auth.currentUser && document.userId && document.userId !== auth.currentUser.uid) {
          throw new Error('Access denied: You can only view your own records');
        }
        
        return document;
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw new Error(`Error getting document: ${error.message}`);
    }
  }

  // 🆕 NEW: Safe method to get customer by ID (handles missing customers gracefully)
  async getCustomerById(customerId) {
    try {
      if (!customerId) {
        return null;
      }

      const docRef = doc(db, 'customers', customerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = this.convertDocToPlainObject(docSnap.data());
        const customer = { id: docSnap.id, ...data };
        
        // Security check for customers - allow if no userId or matches current user
        if (auth.currentUser && customer.userId && customer.userId !== auth.currentUser.uid) {
          console.warn(`Customer ${customerId} belongs to different user`);
          return null;
        }
        
        return customer;
      } else {
        console.warn(`Customer ${customerId} not found in database`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting customer ${customerId}:`, error);
      return null; // Return null instead of throwing error
    }
  }

  // 🆕 NEW: Batch get customers for orders (more efficient)
  async getCustomersByIds(customerIds) {
    try {
      if (!customerIds || customerIds.length === 0) {
        return {};
      }

      // Remove duplicates
      const uniqueIds = [...new Set(customerIds.filter(id => id))];
      const customers = {};

      // Get all customers in parallel
      const customerPromises = uniqueIds.map(async (customerId) => {
        const customer = await this.getCustomerById(customerId);
        if (customer) {
          customers[customerId] = customer;
        }
        return customer;
      });

      await Promise.all(customerPromises);
      return customers;
    } catch (error) {
      console.error('Error batch getting customers:', error);
      return {};
    }
  }

  // UPDATED: Get all documents with user filtering (admin can see all)
  async getAll(collectionName, options = {}) {
    try {
      let q = collection(db, collectionName);

      // 🔒 SECURITY: Filter by user unless admin
      if (auth.currentUser) {
        // Admin users can see all data, regular users only see their own
        if (!this.isAdmin()) {
          q = query(q, where('userId', '==', auth.currentUser.uid));
        }
      } else {
        // If no user is authenticated, return empty array
        return [];
      }

      // Handle additional WHERE conditions
      if (options.where && Array.isArray(options.where)) {
        options.where.forEach(condition => {
          let value = condition.value;
          if (value instanceof Date) {
            value = Timestamp.fromDate(value);
          }
          q = query(q, where(condition.field, condition.operator, value));
        });
      }

      // Add orderBy if specified
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'desc'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Add limit if specified
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      let docs = [];
      querySnapshot.forEach((doc) => {
        const data = this.convertDocToPlainObject(doc.data());
        docs.push({ id: doc.id, ...data });
      });

      return docs;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      return [];
    }
  }

  // EXISTING: Create with user ID
  async create(collectionName, data) {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        userId: auth.currentUser.uid, // 🔒 Always set user ID
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return await this.getById(collectionName, docRef.id);
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  // EXISTING: Update with user verification
  async update(collectionName, id, data) {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      // First verify the user owns this document
      const existingDoc = await this.getById(collectionName, id);
      if (existingDoc.userId !== auth.currentUser.uid) {
        throw new Error('Access denied: You can only update your own records');
      }

      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      
      return await this.getById(collectionName, id);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw new Error(`Error updating document: ${error.message}`);
    }
  }

  // EXISTING: Delete with user verification
  async delete(collectionName, id) {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      // First verify the user owns this document
      const existingDoc = await this.getById(collectionName, id);
      if (existingDoc.userId !== auth.currentUser.uid) {
        throw new Error('Access denied: You can only delete your own records');
      }

      await deleteDoc(doc(db, collectionName, id));
      return id;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }

  // EXISTING: Helper to get nested field values
  getNestedFieldValue(obj, fieldPath) {
    return fieldPath.split('.').reduce((current, field) => {
      return current && current[field] !== undefined ? current[field] : undefined;
    }, obj);
  }

  // EXISTING: Apply filters on client side
  applyClientSideFilters(docs, options) {
    if (!options.where) return docs;

    return docs.filter(doc => {
      return options.where.every(condition => {
        let fieldValue = this.getNestedFieldValue(doc, condition.field);
        let targetValue = condition.value;
        
        if (typeof fieldValue === 'string' && !isNaN(Date.parse(fieldValue))) {
          fieldValue = new Date(fieldValue);
        }
        if (targetValue instanceof Date || (typeof targetValue === 'string' && !isNaN(Date.parse(targetValue)))) {
          targetValue = new Date(targetValue);
        }
        
        switch (condition.operator) {
          case '==': return fieldValue === targetValue;
          case '!=': return fieldValue !== targetValue;
          case '>': return fieldValue > targetValue;
          case '>=': return fieldValue >= targetValue;
          case '<': return fieldValue < targetValue;
          case '<=': return fieldValue <= targetValue;
          case 'in': return Array.isArray(targetValue) && targetValue.includes(fieldValue);
          case 'array-contains': return Array.isArray(fieldValue) && fieldValue.includes(targetValue);
          default: return true;
        }
      });
    });
  }

  // EXISTING: Real-time listener with user filtering
  onSnapshot(collectionName, callback, options = {}) {
    try {
      if (!auth.currentUser) {
        callback([]);
        return () => {};
      }

      let q = collection(db, collectionName);
      
      // Always filter by current user
      q = query(q, where('userId', '==', auth.currentUser.uid));

      return onSnapshot(q, (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          const data = this.convertDocToPlainObject(doc.data());
          docs.push({ id: doc.id, ...data });
        });
        
        const filteredDocs = this.applyClientSideFilters(docs, options);
        
        filteredDocs.sort((a, b) => {
          const aDate = new Date(a.createdAt);
          const bDate = new Date(b.createdAt);
          return bDate - aDate;
        });
        
        callback(filteredDocs);
      }, (error) => {
        console.error(`Error in snapshot listener for ${collectionName}:`, error);
        callback([]);
      });
    } catch (error) {
      console.error(`Error setting up snapshot listener for ${collectionName}:`, error);
      return () => {};
    }
  }
}

export default new FirebaseService();