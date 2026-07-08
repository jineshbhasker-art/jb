/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  Product, 
  Customer, 
  Supplier, 
  Sale, 
  Voucher, 
  PromoVoucher,
  PurchaseInvoice,
  Transaction,
  BusinessProfile,
  Expense,
  Repair,
  ExpenseCategory,
  ConcentrationAlertRule,
  PerfumeBatch,
  ReportSchedule,
  ReportLog,
  Shift,
  Consultation,
  CommissionPayout
} from '../types';

// Generic CRUD helper
const createCRUD = <T extends { id?: string }>(collectionPath: string) => {
  return {
    getAll: async () => {
      try {
        const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    },
    
    getById: async (id: string) => {
      try {
        const docRef = doc(db, collectionPath, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    },

    add: async (data: Omit<T, 'id'>) => {
      try {
        const docRef = await addDoc(collection(db, collectionPath), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, collectionPath);
      }
    },

    update: async (id: string, data: Partial<T>) => {
      try {
        const docRef = doc(db, collectionPath, id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, collectionPath);
      }
    },

    delete: async (id: string) => {
      try {
        const docRef = doc(db, collectionPath, id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, collectionPath);
      }
    },
    
    subscribe: (callback: (data: T[]) => void) => {
      const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
         const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
         callback(items);
      }, (error) => {
         handleFirestoreError(error, OperationType.LIST, collectionPath);
      });
    }
  };
};

export const productsService = createCRUD<Product>('products');
export const customersService = createCRUD<Customer>('customers');
export const suppliersService = createCRUD<Supplier>('suppliers');
export const salesService = createCRUD<Sale>('sales');
export const vouchersService = createCRUD<Voucher>('vouchers');
export const promoVouchersService = createCRUD<PromoVoucher>('promo_vouchers');
export const purchasesService = createCRUD<PurchaseInvoice>('purchases');
export const transactionsService = createCRUD<Transaction>('transactions');
export const expensesService = createCRUD<Expense>('expenses');
export const expenseCategoriesService = createCRUD<ExpenseCategory>('expense_categories');
export const repairsService = createCRUD<Repair>('repairs');
export const batchesService = createCRUD<PerfumeBatch>('batches');
export const reportSchedulesService = createCRUD<ReportSchedule>('report_schedules');
export const reportLogsService = createCRUD<ReportLog>('report_logs');

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  commissionRateSales?: number; // percentage (e.g., 5 for 5%)
  commissionRateConsultations?: number; // percentage (e.g., 10 for 10%)
}

export const usersService = createCRUD<AppUser>('users');
export const shiftsService = createCRUD<Shift>('shifts');
export const consultationsService = createCRUD<Consultation>('consultations');
export const commissionPayoutsService = createCRUD<CommissionPayout>('commission_payouts');

export const businessProfileService = {
  get: async () => {
    try {
      const docRef = doc(db, 'settings', 'businessProfile');
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? (snapshot.data() as BusinessProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/businessProfile');
      return null;
    }
  },
  save: async (data: Partial<BusinessProfile>) => {
    try {
      const docRef = doc(db, 'settings', 'businessProfile');
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/businessProfile');
    }
  },
  subscribe: (callback: (data: BusinessProfile | null) => void) => {
    const docRef = doc(db, 'settings', 'businessProfile');
    return onSnapshot(docRef, (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as BusinessProfile) : null);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/businessProfile');
    });
  }
};

export const concentrationAlertRulesService = {
  get: async () => {
    try {
      const docRef = doc(db, 'settings', 'concentrationAlertRules');
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? (snapshot.data().rules as ConcentrationAlertRule[]) : [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/concentrationAlertRules');
      return [];
    }
  },
  save: async (rules: ConcentrationAlertRule[]) => {
    try {
      const docRef = doc(db, 'settings', 'concentrationAlertRules');
      await setDoc(docRef, {
        rules,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/concentrationAlertRules');
    }
  },
  subscribe: (callback: (rules: ConcentrationAlertRule[]) => void) => {
    const docRef = doc(db, 'settings', 'concentrationAlertRules');
    return onSnapshot(docRef, (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data().rules as ConcentrationAlertRule[] || []) : []);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/concentrationAlertRules');
    });
  }
};

// Special helpers
export const getActiveProducts = async () => {
  try {
    const q = query(collection(db, 'products'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
};

const DB_COLLECTIONS = [
  'products',
  'customers',
  'suppliers',
  'sales',
  'vouchers',
  'promo_vouchers',
  'purchases',
  'transactions',
  'expenses',
  'expense_categories',
  'repairs',
  'batches',
  'report_schedules',
  'report_logs',
  'users',
  'shifts',
  'consultations',
  'commission_payouts'
];

// Completely clears all documents across all transaction, master, and log collections in Firestore
export const purgeAllDatabase = async (keepProducts: boolean = true) => {
  try {
    for (const colName of DB_COLLECTIONS) {
      if (keepProducts && colName === 'products') {
        console.log('Skipping products collection as requested.');
        continue;
      }
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }
    console.log('Database purge complete.');
  } catch (error) {
    console.error('Error during database purge:', error);
    throw error;
  }
};

// Exports all collections into a structured JSON backup object
export const exportDatabaseJSON = async () => {
  try {
    const backup: Record<string, any[]> = {};
    for (const colName of DB_COLLECTIONS) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      backup[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return backup;
  } catch (error) {
    console.error('Error during database export:', error);
    throw error;
  }
};

// Restores database from a backup JSON object (wipes current collections first to avoid duplication)
export const restoreDatabaseJSON = async (backupData: Record<string, any[]>) => {
  try {
    // 1. Wipe database first (including products since backup will restore it)
    await purgeAllDatabase(false);

    // 2. Insert records collection by collection
    for (const colName of DB_COLLECTIONS) {
      const items = backupData[colName];
      if (!items || !Array.isArray(items)) continue;

      for (const item of items) {
        const { id, ...data } = item;
        if (id) {
          // Restore with the exact same ID so relationships/lookups are preserved perfectly
          const docRef = doc(db, colName, id);
          await setDoc(docRef, data);
        } else {
          const colRef = collection(db, colName);
          await addDoc(colRef, data);
        }
      }
    }
    console.log('Database restore complete.');
  } catch (error) {
    console.error('Error during database restore:', error);
    throw error;
  }
};
