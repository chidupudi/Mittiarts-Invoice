// src/services/firebaseService.js - Updated with public access support

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
  // Helper to convert Firestore document to plain object
// Replace your existing convertDocToPlainObject method with this:

convertDocToPlainObject(docData) {
  const plainObject = { ...docData };
  
  // Convert ALL Timestamp fields to ISO strings (including nested ones)
  Object.keys(plainObject).forEach(key => {
    const value = plainObject[key];
    
    if (value instanceof Timestamp) {
      plainObject[key] = value.toDate().toISOString();
    } else if (value?.toDate && typeof value.toDate === 'function') {
      plainObject[key] = value.toDate().toISOString();
    } else if (value instanceof Date) {
      plainObject[key] = value.toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // 🔥 THIS IS THE KEY FIX: Recursively convert nested objects
      plainObject[key] = this.convertDocToPlainObject(value);
    } else if (Array.isArray(value)) {
      // Convert arrays that might contain Timestamps
      plainObject[key] = value.map(item => 
        (item && typeof item === 'object') ? this.convertDocToPlainObject(item) : item
      );
    }
  });
  
  return plainObject;
}

  // Generic CRUD operations
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: auth.currentUser?.uid
      });
      
      // Get the created document to return with proper ID
      const newDoc = await this.getById(collectionName, docRef.id);
      return newDoc;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  async update(collectionName, id, data) {
    try {
      const docRef = doc(db, collectionName, id);
      
      // Convert dates to Timestamps for Firestore
      const updateData = { ...data };
      Object.keys(updateData).forEach(key => {
        if (updateData[key] instanceof Date) {
          updateData[key] = Timestamp.fromDate(updateData[key]);
        } else if (typeof updateData[key] === 'string' && !isNaN(Date.parse(updateData[key]))) {
          // Check if it's a valid date string
          const date = new Date(updateData[key]);
          if (key.includes('Date') || key.includes('At')) {
            updateData[key] = Timestamp.fromDate(date);
          }
        }
      });
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
      
      // Return updated document
      return await this.getById(collectionName, id);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw new Error(`Error updating document: ${error.message}`);
    }
  }

  async delete(collectionName, id) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return id;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }

  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = this.convertDocToPlainObject(docSnap.data());
        return { id: docSnap.id, ...data };
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw new Error(`Error getting document: ${error.message}`);
    }
  }

  // Enhanced getAll method that supports both authenticated and public access
  async getAll(collectionName, options = {}) {
    try {
      let q = collection(db, collectionName);

      // Handle WHERE conditions first
      if (options.where && Array.isArray(options.where)) {
        options.where.forEach(condition => {
          // Convert date values to Timestamps if needed
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
      } else if (!options.where || options.where.length === 0) {
        // Only add default ordering if no where conditions (to avoid index issues)
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

      // Apply additional client-side filtering if needed
      docs = this.applyClientSideFilters(docs, options);

      return docs;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);

      // If getting index errors, fall back to simple query
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        console.warn('Index error detected, falling back to simple query...');
        return this.getAllWithoutFilters(collectionName, options);
      }

      throw new Error(`Error getting documents: ${error.message}`);
    }
  }

  // 🆕 NEW: Public access method for orders by bill token (no auth required)
  async getOrderByBillToken(billToken) {
    try {
      console.log('🔍 Searching for order with bill token:', billToken);
      
      // Query orders by billToken - this works without authentication
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('billToken', '==', billToken),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
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

      console.log('✅ Order found for public access:', orderData.id);
      return orderData;
    } catch (error) {
      console.error('❌ Error getting order by bill token:', error);
      throw new Error(`Error accessing invoice: ${error.message}`);
    }
  }

  // Fallback method - gets all documents without any Firestore filtering
  async getAllWithoutFilters(collectionName, options = {}) {
    try {
      const q = collection(db, collectionName);
      const querySnapshot = await getDocs(q);
      
      let docs = [];
      querySnapshot.forEach((doc) => {
        const data = this.convertDocToPlainObject(doc.data());
        docs.push({ id: doc.id, ...data });
      });

      // Filter by user on client side (only for authenticated requests)
      if (auth.currentUser) {
        docs = docs.filter(doc => doc.userId === auth.currentUser.uid);
      }

      // Apply all filters on client side
      docs = this.applyClientSideFilters(docs, options);

      // Sort on client side
      docs.sort((a, b) => {
        const aDate = new Date(a.createdAt);
        const bDate = new Date(b.createdAt);
        return bDate - aDate; // Descending order
      });

      // Apply limit on client side
      if (options.limit) {
        docs = docs.slice(0, options.limit);
      }

      return docs;
    } catch (error) {
      console.error(`Error in fallback query for ${collectionName}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  // Apply filters on client side to avoid index requirements
  applyClientSideFilters(docs, options) {
    if (!options.where) return docs;

    return docs.filter(doc => {
      return options.where.every(condition => {
        let fieldValue = this.getNestedFieldValue(doc, condition.field);
        let targetValue = condition.value;
        
        // Convert date strings to Date objects for comparison
        if (typeof fieldValue === 'string' && !isNaN(Date.parse(fieldValue))) {
          fieldValue = new Date(fieldValue);
        }
        if (targetValue instanceof Date || (typeof targetValue === 'string' && !isNaN(Date.parse(targetValue)))) {
          targetValue = new Date(targetValue);
        }
        
        switch (condition.operator) {
          case '==':
            return fieldValue === targetValue;
          case '!=':
            return fieldValue !== targetValue;
          case '>':
            return fieldValue > targetValue;
          case '>=':
            return fieldValue >= targetValue;
          case '<':
            return fieldValue < targetValue;
          case '<=':
            return fieldValue <= targetValue;
          case 'in':
            return Array.isArray(targetValue) && targetValue.includes(fieldValue);
          case 'array-contains':
            return Array.isArray(fieldValue) && fieldValue.includes(targetValue);
          default:
            return true;
        }
      });
    });
  }

  // Helper to get nested field values (e.g., "address.city")
  getNestedFieldValue(obj, fieldPath) {
    return fieldPath.split('.').reduce((current, field) => {
      return current && current[field] !== undefined ? current[field] : undefined;
    }, obj);
  }

  // Simplified real-time listener
  onSnapshot(collectionName, callback, options = {}) {
    try {
      let q = collection(db, collectionName);
      
      // Simple query to avoid index issues
      if (auth.currentUser) {
        q = query(q, where('userId', '==', auth.currentUser.uid));
      }

      return onSnapshot(q, (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          const data = this.convertDocToPlainObject(doc.data());
          docs.push({ id: doc.id, ...data });
        });
        
        // Apply filters and sorting on client side
        const filteredDocs = this.applyClientSideFilters(docs, options);
        
        // Sort by createdAt
        filteredDocs.sort((a, b) => {
          const aDate = new Date(a.createdAt);
          const bDate = new Date(b.createdAt);
          return bDate - aDate;
        });
        
        callback(filteredDocs);
      }, (error) => {
        console.error(`Error in snapshot listener for ${collectionName}:`, error);
        callback([]); // Return empty array on error
      });
    } catch (error) {
      console.error(`Error setting up snapshot listener for ${collectionName}:`, error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Generate unique ID for orders/bills
  generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  }
}

export default new FirebaseService();