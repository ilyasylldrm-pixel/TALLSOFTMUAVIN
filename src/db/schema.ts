import { pgTable, serial, text, integer, doublePrecision, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Firebase Auth Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Accounts (Kasa / Banka)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  name: text('name').notNull(),
  type: text('type').notNull(), // cash, bank, credit_card
  currency: text('currency').default('TRY'),
  balance: doublePrecision('balance').default(0),
  accountNumber: text('account_number'),
  iban: text('iban'),
  bankName: text('bank_name'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Contacts (Cariler - Müşteri & Tedarikçi)
export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  name: text('name').notNull(),
  companyTitle: text('company_title'),
  contactType: text('contact_type').notNull(), // customer, vendor, both
  taxOffice: text('tax_office'),
  taxNumber: text('tax_number'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  district: text('district'),
  neighborhood: text('neighborhood'),
  street: text('street'),
  balance: doublePrecision('balance').default(0),
  balanceType: text('balance_type').default('balanced'),
  notes: text('notes'),
  createdAt: text('created_at'),
});

// Products & Services (Stok & Hizmet Kartları)
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  code: text('code').notNull(),
  name: text('name').notNull(),
  unit: text('unit').default('Adet'),
  buyPrice: doublePrecision('buy_price').default(0),
  sellPrice: doublePrecision('sell_price').default(0),
  vatRate: integer('vat_rate').default(20),
  stockQuantity: doublePrecision('stock_quantity').default(0),
  minStockAlert: doublePrecision('min_stock_alert'),
  category: text('category'),
  stockType: text('stock_type'),
  barcode: text('barcode'),
  imeiOrSerialNo: text('imei_or_serial_no'),
  warehouseId: text('warehouse_id'),
  warehouseName: text('warehouse_name'),
  warehouseQuantities: jsonb('warehouse_quantities'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices (Gelir & Gider Faturaları)
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  invoiceNumber: text('invoice_number').notNull(),
  type: text('type').notNull(), // sales, purchase
  contactId: text('contact_id').notNull(),
  contactName: text('contact_name').notNull(),
  taxNumber: text('tax_number'),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  items: jsonb('items').notNull(),
  subtotal: doublePrecision('subtotal').default(0),
  totalVat: doublePrecision('total_vat').default(0),
  totalWithholding: doublePrecision('total_withholding').default(0),
  grandTotal: doublePrecision('grand_total').default(0),
  paidAmount: doublePrecision('paid_amount').default(0),
  remainingAmount: doublePrecision('remaining_amount').default(0),
  status: text('status').default('draft'),
  currency: text('currency').default('TRY'),
  notes: text('notes'),
  terms: text('terms'),
  createdAt: text('created_at'),
});

// Transactions (Kasa & Banka Hareketleri)
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  date: text('date').notNull(),
  type: text('type').notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').default('TRY'),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  contactId: text('contact_id'),
  contactName: text('contact_name'),
  invoiceId: text('invoice_id'),
  invoiceNumber: text('invoice_number'),
  category: text('category'),
  description: text('description'),
  documentNo: text('document_no'),
  receiptImage: text('receipt_image'),
  items: jsonb('items'),
  subtotal: doublePrecision('subtotal'),
  totalVat: doublePrecision('total_vat'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orders (Siparişler)
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  orderNumber: text('order_number').notNull(),
  type: text('type').notNull(),
  contactId: text('contact_id').notNull(),
  contactName: text('contact_name').notNull(),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  taxNumber: text('tax_number'),
  orderDate: text('order_date').notNull(),
  deliveryDate: text('delivery_date'),
  items: jsonb('items').notNull(),
  subtotal: doublePrecision('subtotal').default(0),
  totalVat: doublePrecision('total_vat').default(0),
  grandTotal: doublePrecision('grand_total').default(0),
  currency: text('currency').default('TRY'),
  status: text('status').default('pending'),
  warehouseId: text('warehouse_id'),
  warehouseName: text('warehouse_name'),
  notes: text('notes'),
  convertedToInvoiceId: text('converted_to_invoice_id'),
  convertedToInvoiceNumber: text('converted_to_invoice_number'),
  createdAt: text('created_at'),
});

// Cheques & Promissory Notes (Çek & Senet)
export const cheques = pgTable('cheques', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  type: text('type').notNull(),
  chequeNumber: text('cheque_number').notNull(),
  bankName: text('bank_name'),
  branchName: text('branch_name'),
  drawerName: text('drawer_name'),
  contactId: text('contact_id'),
  contactName: text('contact_name'),
  issueDate: text('issue_date'),
  dueDate: text('due_date'),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').default('TRY'),
  status: text('status').default('portfolio'),
  notes: text('notes'),
  endorsedToContactId: text('endorsed_to_contact_id'),
  endorsedToContactName: text('endorsed_to_contact_name'),
  endorsedDate: text('endorsed_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const promissoryNotes = pgTable('promissory_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  type: text('type').notNull(),
  noteNumber: text('note_number').notNull(),
  debtorName: text('debtor_name'),
  contactId: text('contact_id'),
  contactName: text('contact_name'),
  issueDate: text('issue_date'),
  dueDate: text('due_date'),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').default('TRY'),
  status: text('status').default('portfolio'),
  notes: text('notes'),
  endorsedToContactId: text('endorsed_to_contact_id'),
  endorsedToContactName: text('endorsed_to_contact_name'),
  endorsedDate: text('endorsed_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employees (Personel)
export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  tckn: text('tckn').notNull(),
  fullName: text('full_name').notNull(),
  title: text('title').notNull(),
  department: text('department').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  terminationCode: text('termination_code'),
  terminationReason: text('termination_reason'),
  birthDate: text('birth_date'),
  homeAddress: text('home_address'),
  photoUrl: text('photo_url'),
  phone: text('phone'),
  email: text('email'),
  salaryType: text('salary_type').default('net'),
  salaryAmount: doublePrecision('salary_amount').default(0),
  foodAllowance: doublePrecision('food_allowance').default(0),
  roadAllowance: doublePrecision('road_allowance').default(0),
  hasBes: boolean('has_bes').default(false),
  sgkOccupationCode: text('sgk_occupation_code'),
  iban: text('iban'),
  bankName: text('bank_name'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  status: text('status').default('active'),
  annualLeaveAllowance: integer('annual_leave_allowance').default(14),
  usedAnnualLeave: integer('used_annual_leave').default(0),
  notes: text('notes'),
  createdAt: text('created_at'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  contacts: many(contacts),
  products: many(products),
  invoices: many(invoices),
  transactions: many(transactions),
}));
