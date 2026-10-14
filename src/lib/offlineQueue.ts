/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale, SaleItem, PaymentMethod, AccountingType } from '../types';
import { salesService, promoVouchersService, customersService, transactionsService, productsService } from './dbService';

export interface OfflineSaleJob {
  id: string; // generated client-side ID
  sale: Omit<Sale, 'id'>;
  appliedVoucherId?: string;
  selectedCustomerId?: string;
  cart: SaleItem[];
  grandTotal: number;
  paymentMethod: PaymentMethod;
  invoiceNumber: string;
  createdAt: string;
}

const DB_NAME = 'pos_offline_db';
const STORE_NAME = 'transaction_queue';

/**
 * Dispatches a custom window event so that components can listen and react
 * in real-time to offline queue changes.
 */
export function dispatchQueueChangedEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-queue-changed'));
  }
}

/**
 * Opens (or initializes) the IndexedDB instance.
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Adds an offline transaction job to the IndexedDB queue.
 */
export async function addToQueue(job: OfflineSaleJob): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(job);

    request.onsuccess = () => {
      dispatchQueueChangedEvent();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all offline transaction jobs from the IndexedDB queue.
 */
export async function getQueue(): Promise<OfflineSaleJob[]> {
  try {
    const db = await openDB();
    return new Promise<OfflineSaleJob[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error opening offline queue IndexedDB:', err);
    return [];
  }
}

/**
 * Removes a transaction job from the IndexedDB queue by ID.
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      dispatchQueueChangedEvent();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clears the offline transaction queue completely.
 */
export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      dispatchQueueChangedEvent();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Attempts to synchronize all queued offline transactions with Firestore.
 * Successfully synchronized records are automatically deleted from the local IndexedDB.
 */
export async function syncQueue(): Promise<{ successCount: number; failedCount: number }> {
  const queue = await getQueue();
  let successCount = 0;
  let failedCount = 0;

  for (const job of queue) {
    try {
      console.log(`[Offline Sync] Starting sync for invoice: ${job.invoiceNumber}`);

      // 1. Add Sale to Firestore
      const saleId = await salesService.add(job.sale);
      if (!saleId) {
        throw new Error(`Failed to create sale in Firestore for invoice ${job.invoiceNumber}`);
      }

      // 2. Update Promo Voucher Usage in Firestore
      if (job.appliedVoucherId) {
        try {
          const currentVoucher = await promoVouchersService.getById(job.appliedVoucherId);
          await promoVouchersService.update(job.appliedVoucherId, {
            usageCount: (currentVoucher?.usageCount || 0) + 1
          });
        } catch (voucherErr) {
          console.warn(`[Offline Sync] Failed to update voucher usage count for ID: ${job.appliedVoucherId}`, voucherErr);
        }
      }

      // 3. Update Customer LTV in Firestore
      if (job.selectedCustomerId) {
        try {
          const currentCustomer = await customersService.getById(job.selectedCustomerId);
          await customersService.update(job.selectedCustomerId, {
            totalSpent: (currentCustomer?.totalSpent || 0) + job.grandTotal,
            lastPurchaseDate: new Date().toISOString()
          });
        } catch (custErr) {
          console.warn(`[Offline Sync] Failed to update customer spent LTV for ID: ${job.selectedCustomerId}`, custErr);
        }
      }

      // 4. Create Accounting Transaction in Firestore
      try {
        await transactionsService.add({
          type: AccountingType.INCOME,
          category: 'Sales',
          amount: job.grandTotal,
          description: `Sale - ${job.invoiceNumber} (Offline Sync)`,
          saleId,
          date: job.createdAt || new Date().toISOString(),
          paymentMethod: job.paymentMethod,
          reference: job.invoiceNumber
        });
      } catch (txErr) {
        console.warn(`[Offline Sync] Failed to record accounting transaction entry for invoice ${job.invoiceNumber}`, txErr);
      }

      // 5. Update Product Stock Quantities in Firestore
      for (const item of job.cart) {
        try {
          const baseId = item.productId.split('-')[0];
          const product = await productsService.getById(baseId);
          if (product) {
            await productsService.update(product.id, {
              stockQuantity: Math.max(0, product.stockQuantity - item.quantity)
            });
          }
        } catch (stockErr) {
          console.warn(`[Offline Sync] Failed to decrement stock for item ${item.name} (${item.productId})`, stockErr);
        }
      }

      // Successfully synced! Delete from IndexedDB queue
      await removeFromQueue(job.id);
      successCount++;
      console.log(`[Offline Sync] Successfully synced and cleared invoice: ${job.invoiceNumber}`);
    } catch (error) {
      console.error(`[Offline Sync] Failed to sync offline transaction job ID: ${job.id}`, error);
      failedCount++;
    }
  }

  return { successCount, failedCount };
}

// Automatically bind window 'online' event handler if running in a browser environment.
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('[Offline Queue] Network connection restored. Auto-sync started...');
    const result = await syncQueue();
    if (result.successCount > 0) {
      console.log(`[Offline Queue] Auto-synced ${result.successCount} offline sales successfully.`);
    }
    if (result.failedCount > 0) {
      console.warn(`[Offline Queue] ${result.failedCount} offline sales failed to sync.`);
    }
  });
}
