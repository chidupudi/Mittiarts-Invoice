// src/services/firebaseService.js - Simplified version to avoid index issues
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
  // Generic CRUD operations
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: auth.currentUser?.uid
      });
      
      // Return the created document with ID
      const newDoc = { id: docRef.id, ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
      return newDoc;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  async update(collectionName, id, data) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      return { id, ...data, updatedAt: Timestamp.now() };
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
        return { id: docSnap.id, ...docSnap.data() };
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
        // Single where clause + orderBy (this combination usually has default indexes)
        q = query(q, 
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Just orderBy for public data
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Add limit if specified
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      let docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
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
        docs.push({ id: doc.id, ...doc.data() });
      });

      // Filter by user on client side
      if (auth.currentUser) {
        docs = docs.filter(doc => doc.userId === auth.currentUser.uid);
      }

      // Apply all filters on client side
      docs = this.applyClientSideFilters(docs, options);

      // Sort on client side
      docs.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
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
        const targetValue = condition.value;
        
        // Handle Firestore Timestamp objects
        if (fieldValue?.toDate) {
          fieldValue = fieldValue.toDate();
        }
        if (targetValue?.toDate) {
          targetValue = targetValue.toDate();
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
          docs.push({ id: doc.id, ...doc.data() });
        });
        
        // Apply filters and sorting on client side
        const filteredDocs = this.applyClientSideFilters(docs, options);
        
        // Sort by createdAt
        filteredDocs.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
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