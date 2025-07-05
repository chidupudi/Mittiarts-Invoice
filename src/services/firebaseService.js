// src/services/firebaseService.js - Updated timestamp handling

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
  convertDocToPlainObject(docData) {
    const plainObject = { ...docData };
    
    // Convert all Timestamp fields to ISO strings
    Object.keys(plainObject).forEach(key => {
      if (plainObject[key] instanceof Timestamp) {
        plainObject[key] = plainObject[key].toDate().toISOString();
      } else if (plainObject[key]?.toDate && typeof plainObject[key].toDate === 'function') {
        plainObject[key] = plainObject[key].toDate().toISOString();
      } else if (plainObject[key] instanceof Date) {
        plainObject[key] = plainObject[key].toISOString();
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

  // Simplified getAll method that avoids complex indexes
  async getAll(collectionName, options = {}) {
    try {
      let q = collection(db, collectionName);

      // Only use simple queries to avoid index requirements
      if (auth.currentUser) {
        // The security rules will ensure only authorized users can query the data.
        // We no longer filter by userId here to allow all authorized users to see all data.
        q = query(q, orderBy('createdAt', 'desc'));
      } else {
        // Just orderBy for public data (though your rules will block this)
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

      // Apply client-side filtering for complex conditions
      docs = this.applyClientSideFilters(docs, options);

      return docs;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);

      // If still getting index errors, fall back to getting all documents
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        console.warn('Index error detected, falling back to simple query...');
        return this.getAllWithoutFilters(collectionName, options);
      }

      throw new Error(`Error getting documents: ${error.message}`);
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

      // Filter by user on client side
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