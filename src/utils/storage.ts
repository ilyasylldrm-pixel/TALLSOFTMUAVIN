import { Contact, Invoice, Account, Transaction, Product, Quote, Order, Waybill, CompanySettings, Cheque, PromissoryNote, Branch, Warehouse, Employee, LeaveRequest, AdvanceRequest, LegalDeduction, getContactAccountCode } from "../types";
import {
  initialCompanySettings,
  initialContacts,
  initialAccounts,
  initialInvoices,
  initialTransactions,
  initialProducts,
  initialQuotes,
  initialOrders,
  initialWaybills,
  initialCheques,
  initialPromissoryNotes,
  initialBranches,
  initialWarehouses,
  initialEmployees,
  initialLeaveRequests,
  initialAdvanceRequests,
  initialLegalDeductions,
} from "../mockData";

const STORAGE_KEYS = {
  SETTINGS: "muavin_company_settings",
  CONTACTS: "muavin_contacts",
  ACCOUNTS: "muavin_accounts",
  INVOICES: "muavin_invoices",
  TRANSACTIONS: "muavin_transactions",
  PRODUCTS: "muavin_products",
  QUOTES: "muavin_quotes",
  ORDERS: "muavin_orders",
  WAYBILLS: "muavin_waybills",
  CHEQUES: "muavin_cheques",
  PROMISSORY_NOTES: "muavin_promissory_notes",
  BRANCHES: "muavin_branches",
  WAREHOUSES: "muavin_warehouses",
  EMPLOYEES: "muavin_employees",
  LEAVE_REQUESTS: "muavin_leave_requests",
  ADVANCE_REQUESTS: "muavin_advance_requests",
  LEGAL_DEDUCTIONS: "muavin_legal_deductions",
};

export function getStoredData() {
  const get = <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error loading ${key} from storage`, e);
      return fallback;
    }
  };

  const storedInvoices = get<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
  const storedProducts = get<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
  const storedCheques = get<Cheque[]>(STORAGE_KEYS.CHEQUES, initialCheques);
  const storedNotes = get<PromissoryNote[]>(STORAGE_KEYS.PROMISSORY_NOTES, initialPromissoryNotes);

  // If local storage contains old dataset (< 2100 invoices, < 1200 products, < 200 cheques, or < 250 notes), reset to new dataset
  if (
    storedInvoices.length < 2100 ||
    storedProducts.length < 1200 ||
    storedCheques.length < 200 ||
    storedNotes.length < 250
  ) {
    resetToDemoData();
    return {
      settings: initialCompanySettings,
      contacts: initialContacts,
      accounts: initialAccounts,
      invoices: initialInvoices,
      transactions: initialTransactions,
      products: initialProducts,
      quotes: initialQuotes,
      orders: initialOrders,
      waybills: initialWaybills,
      cheques: initialCheques,
      promissoryNotes: initialPromissoryNotes,
      branches: initialBranches,
      warehouses: initialWarehouses,
      employees: initialEmployees,
      leaveRequests: initialLeaveRequests,
      advanceRequests: initialAdvanceRequests,
      legalDeductions: initialLegalDeductions,
    };
  }

  const loadedContacts = get<Contact[]>(STORAGE_KEYS.CONTACTS, initialContacts);
  const normalizedContacts = loadedContacts.map((c) => ({
    ...c,
    accountCode: getContactAccountCode(c),
  }));

  return {
    settings: get<CompanySettings>(STORAGE_KEYS.SETTINGS, initialCompanySettings),
    contacts: normalizedContacts,
    accounts: get<Account[]>(STORAGE_KEYS.ACCOUNTS, initialAccounts),
    invoices: storedInvoices,
    transactions: get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions),
    products: get<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts),
    quotes: get<Quote[]>(STORAGE_KEYS.QUOTES, initialQuotes),
    orders: get<Order[]>(STORAGE_KEYS.ORDERS, initialOrders),
    waybills: get<Waybill[]>(STORAGE_KEYS.WAYBILLS, initialWaybills),
    cheques: get<Cheque[]>(STORAGE_KEYS.CHEQUES, initialCheques),
    promissoryNotes: get<PromissoryNote[]>(STORAGE_KEYS.PROMISSORY_NOTES, initialPromissoryNotes),
    branches: get<Branch[]>(STORAGE_KEYS.BRANCHES, initialBranches),
    warehouses: get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, initialWarehouses),
    employees: get<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees),
    leaveRequests: get<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests),
    advanceRequests: get<AdvanceRequest[]>(STORAGE_KEYS.ADVANCE_REQUESTS, initialAdvanceRequests),
    legalDeductions: get<LegalDeduction[]>(STORAGE_KEYS.LEGAL_DEDUCTIONS, initialLegalDeductions),
  };
}

export function saveStoredData(key: keyof typeof STORAGE_KEYS, data: any) {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (e) {
    console.warn(`Storage quota exceeded or error saving ${key} to localStorage:`, e);
  }
}

export function resetToDemoData() {
  const safeSet = (key: string, val: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn(`Storage quota exceeded or error setting ${key}:`, e);
    }
  };

  safeSet(STORAGE_KEYS.SETTINGS, initialCompanySettings);
  safeSet(STORAGE_KEYS.CONTACTS, initialContacts);
  safeSet(STORAGE_KEYS.ACCOUNTS, initialAccounts);
  safeSet(STORAGE_KEYS.INVOICES, initialInvoices);
  safeSet(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
  safeSet(STORAGE_KEYS.PRODUCTS, initialProducts);
  safeSet(STORAGE_KEYS.QUOTES, initialQuotes);
  safeSet(STORAGE_KEYS.ORDERS, initialOrders);
  safeSet(STORAGE_KEYS.WAYBILLS, initialWaybills);
  safeSet(STORAGE_KEYS.CHEQUES, initialCheques);
  safeSet(STORAGE_KEYS.PROMISSORY_NOTES, initialPromissoryNotes);
  safeSet(STORAGE_KEYS.BRANCHES, initialBranches);
  safeSet(STORAGE_KEYS.WAREHOUSES, initialWarehouses);
  safeSet(STORAGE_KEYS.LEGAL_DEDUCTIONS, initialLegalDeductions);
}


export function exportBackupJSON(): string {
  const data = getStoredData();
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.contacts && parsed.invoices) {
      if (parsed.settings) saveStoredData("SETTINGS", parsed.settings);
      if (parsed.contacts) saveStoredData("CONTACTS", parsed.contacts);
      if (parsed.accounts) saveStoredData("ACCOUNTS", parsed.accounts);
      if (parsed.invoices) saveStoredData("INVOICES", parsed.invoices);
      if (parsed.transactions) saveStoredData("TRANSACTIONS", parsed.transactions);
      if (parsed.products) saveStoredData("PRODUCTS", parsed.products);
      if (parsed.quotes) saveStoredData("QUOTES", parsed.quotes);
      if (parsed.branches) saveStoredData("BRANCHES", parsed.branches);
      if (parsed.warehouses) saveStoredData("WAREHOUSES", parsed.warehouses);
      return true;
    }
  } catch (e) {
    console.error("Failed to import JSON", e);
  }
  return false;
}
