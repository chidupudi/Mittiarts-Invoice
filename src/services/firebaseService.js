// src/services/firebaseService.js - Updated with Share Token Access
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

  // 🆕 NEW: Public access method for orders by share token
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

  // 🔐 SECURE: Public access method for orders by bill token (keeping for SMS compatibility)
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

  // Validate bill token format
  isValidBillTokenFormat(token) {
    return /^MITTI_[A-Z0-9_]+$/.test(token);
  }

  // Check if bill token is expired (tokens expire after 90 days)
  isBillTokenExpired(order) {
    if (!order.createdAt) return true;
    
    const createdDate = order.createdAt instanceof Timestamp 
      ? order.createdAt.toDate() 
      : new Date(order.createdAt);
    
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + 90); // 90 days expiry
    
    return new Date() > expiryDate;
  }

  // Remove sensitive data for public access
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

  // 🔐 SECURE: Authenticated access - user can only see their own orders
  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = this.convertDocToPlainObject(docSnap.data());
        const document = { id: docSnap.id, ...data };
        
        // 🔒 SECURITY CHECK: Ensure user can only access their own documents
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

  // 🔐 SECURE: Get all documents with user filtering
  async getAll(collectionName, options = {}) {
    try {
      let q = collection(db, collectionName);

      // 🔒 SECURITY: Always filter by current user for authenticated requests
      if (auth.currentUser) {
        q = query(q, where('userId', '==', auth.currentUser.uid));
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

  // 🔐 SECURE: Create with user ID
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

  // 🔐 SECURE: Update with user verification
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

  // 🔐 SECURE: Delete with user verification
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

  // Helper to get nested field values
  getNestedFieldValue(obj, fieldPath) {
    return fieldPath.split('.').reduce((current, field) => {
      return current && current[field] !== undefined ? current[field] : undefined;
    }, obj);
  }

  // Apply filters on client side
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

  // 🔐 SECURE: Real-time listener with user filtering
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