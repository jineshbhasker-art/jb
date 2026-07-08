/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CURRENCY } from '../constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: CURRENCY,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `AQM-${year}${month}-${random}`;
}

export function generateBarcode(): string {
  const prefix = '629'; // UAE Prefix example
  const random = Math.floor(Math.random() * 900000000) + 100000000;
  return `${prefix}${random}`;
}
