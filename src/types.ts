/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export enum ProductType {
  NEW = 'new',
  USED = 'used',
  REPAIR = 'repair',
  ACCESSORY = 'accessory'
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string; // Auto-generated if not provided
  type: ProductType;
  category: string;
  brand: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  imeiRequired: boolean;
  imeiList?: string[];
  supplierId?: string;
  supplierName?: string;
  description?: string;
  image?: string;
  vatRate: number; // Usually 5% for UAE
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Scent Profiling
  scentFamily?: string;
  concentration?: string;
  topNotes?: string;
  middleNotes?: string;
  baseNotes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  emirate?: string;
  trn?: string;
  categories: string[];
  bankDetails?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  emirate?: string;
  trn?: string; // Tax Registration Number for business customers
  totalSpent: number;
  lastPurchaseDate?: string;
  createdAt: string;
  customFormulas?: {
    id: string;
    name: string;
    topNotes: string[];
    middleNotes: string[];
    baseNotes: string[];
    concentration: string;
    selectedMl: number;
    price: number;
    createdAt: string;
  }[];
}

export interface SaleItem {
  productId: string;
  name: string;
  type: ProductType;
  quantity: number;
  unitPrice: number;
  unitCost: number; // Cost at time of sale for profit calculation
  totalBeforeVat: number;
  vatAmount: number;
  totalWithVat: number;
  imeiRequired?: boolean;
  imei?: string[];
  selectedMl?: number;
  scentFamily?: string;
  concentration?: string;
  repairDetails?: {
    issue: string;
    technician: string;
    expectedDate: string;
    status: 'received' | 'in-progress' | 'ready' | 'delivered';
  };
}

export enum SaleStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque'
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string; // For guest checkout
  items: SaleItem[];
  subtotal: number;
  vatTotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  receivedAmount: number;
  changeAmount: number;
  cashierId: string;
  cashierName: string;
  createdAt: string;
  promoCode?: string;
  notes?: string;
}

export enum AccountingType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum VoucherType {
  RECEIPT = 'receipt',
  PAYMENT = 'payment',
  JOURNAL = 'journal'
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: VoucherType;
  date: string;
  items: {
    account: string; // Ledger name
    description: string;
    debit: number;
    credit: number;
  }[];
  totalAmount: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitCost: number;
    vatAmount: number;
    total: number;
  }[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  date: string;
  paymentMethod: PaymentMethod;
  status: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: AccountingType;
  category: string;
  amount: number;
  description: string;
  saleId?: string; // Linked sale if type is income
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string; // Receipt no, Voucher no
  attachment?: string;
}

export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  todayProfit: number;
  totalInventoryValue: number;
  lowStockItems: number;
  customerCount: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  vatAmount?: number; // VAT collected on this expense (Input VAT)
  description: string;
  date: string;
  paymentMethod: string;
  reference?: string;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  companyName: string;
  trn: string;
  phone: string;
  email: string;
  address: string;
  logoBase64?: string;
  website?: string;
  termsAndConditions?: string;
  footerNote?: string;
  promoPrefix?: string;
  updatedAt: string;
  // Print Customization
  selectedA4Template?: string; // 'corporate' | 'swiss' | 'tech' | 'serif' | 'brutalist' | 'emerald' | 'sidebar' | 'split' | 'compact' | 'elite'
  selectedThermalTemplate?: string; // 'standard' | 'compact' | 'premium'
  primaryColor?: string; // Hex color code
  accentColor?: string; // Hex color code
  showLogo?: boolean;
  showSignatureLine?: boolean;
  showVatSummary?: boolean;
  thermalWidth?: number; // 80 or 58
  fontFamily?: string; // 'sans' | 'serif' | 'mono'
  // Auto Save Settings
  autoSaveBackup?: boolean;
  autoSaveIntervalMinutes?: number;
}

export enum RepairStatus {
  RECEIVED = 'received',
  DIAGNOSING = 'diagnosing',
  WAITING_PARTS = 'waiting_parts',
  REPAIRING = 'repairing',
  TESTING = 'testing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface Repair {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  imei?: string;
  issue: string;
  assignedTechnician?: string;
  estimatedCost: number;
  advancePayment: number;
  balanceDue: number;
  status: RepairStatus;
  receivedDate: string;
  expectedDate?: string;
  completedDate?: string;
  deliveredDate?: string;
  notes?: string;
  partsUsed?: {
    name: string;
    cost: number;
    price: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export enum PromoType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export interface PromoVoucher {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  minPurchase: number;
  expiryDate: string;
  isActive: boolean;
  usageCount?: number;
  usageLimit?: number;
  createdAt: string;
}

export interface ConcentrationAlertRule {
  id: string;
  concentration: string;
  minStockThreshold: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConcentrationAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  concentration: string;
  stockQuantity: number;
  threshold: number;
  isActiveRule: boolean;
  createdAt: string;
}

export interface PerfumeBatch {
  id?: string;
  batchNumber: string;
  productId: string; // References existing Product id
  productName: string; // Cache the name
  sku?: string;
  carrierType: 'oil_base' | 'alcohol_base' | 'mixed_fragrance' | 'other';
  manufactureDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  initialQuantityMl: number;
  remainingQuantityMl: number;
  costPerMl: number;
  supplierId?: string;
  supplierName?: string;
  locationSlot?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSchedule {
  id?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipientEmails: string[];
  reportTypes: ('sales_analytics' | 'low_stock')[];
  lastRunAt?: string;
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportLog {
  id?: string;
  scheduleId?: string;
  scheduleName?: string;
  reportType: string;
  generatedAt: string;
  salesCount: number;
  lowStockCount: number;
  csvContent: string;
  fileName: string;
  recipientEmails?: string[];
  triggeredBy: 'automatic' | 'manual';
  createdAt: string;
}

export interface Shift {
  id?: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  role: string; // e.g. 'Head Perfumer', 'Consultant', 'Cashier'
  status: 'scheduled' | 'present' | 'absent' | 'late';
  checkInTime?: string; // ISO String
  checkOutTime?: string; // ISO String
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id?: string;
  perfumerId: string; // References AppUser ID
  perfumerName: string;
  customerId: string; // References Customer ID
  customerName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  fee: number; // in AED
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionPayout {
  id?: string;
  userId: string;
  userName: string;
  amount: number;
  dateRangeStart: string; // YYYY-MM-DD
  dateRangeEnd: string; // YYYY-MM-DD
  salesTotal: number;
  consultationsTotal: number;
  payoutDate: string; // YYYY-MM-DD
  status: 'paid' | 'pending';
  notes?: string;
  createdAt: string;
}


