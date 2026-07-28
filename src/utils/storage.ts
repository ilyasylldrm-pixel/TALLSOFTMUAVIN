import { Contact, Invoice, Account, Transaction, Product, Quote, Order, Waybill, CompanySettings, Cheque, PromissoryNote, Branch, Warehouse, Employee, LeaveRequest, AdvanceRequest, LegalDeduction } from "../types";
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

  // If local storage contains old dataset (< 170 invoices or < 700 products), reset to new full monthly integrated data
  if (storedInvoices.length < 170 || storedProducts.length < 700) {
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

  return {
    settings: get<CompanySettings>(STORAGE_KEYS.SETTINGS, initialCompanySettings),
    contacts: get<Contact[]>(STORAGE_KEYS.CONTACTS, initialContacts),
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
    console.error(`Error saving ${key} to storage`, e);
  }
}

export function resetToDemoData() {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialCompanySettings));
  localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(initialContacts));
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(initialAccounts));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
  localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(initialQuotes));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
  localStorage.setItem(STORAGE_KEYS.WAYBILLS, JSON.stringify(initialWaybills));
  localStorage.setItem(STORAGE_KEYS.CHEQUES, JSON.stringify(initialCheques));
  localStorage.setItem(STORAGE_KEYS.PROMISSORY_NOTES, JSON.stringify(initialPromissoryNotes));
  localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(initialBranches));
  localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(initialWarehouses));
  localStorage.setItem(STORAGE_KEYS.LEGAL_DEDUCTIONS, JSON.stringify(initialLegalDeductions));
}


export function exportBackupJSON(): string {
  const data = getStoredData();
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.contacts && parsed.invoices) {
      if (parsed.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
      if (parsed.contacts) localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(parsed.contacts));
      if (parsed.accounts) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(parsed.accounts));
      if (parsed.invoices) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(parsed.invoices));
      if (parsed.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed.transactions));
      if (parsed.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
      if (parsed.quotes) localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(parsed.quotes));
      if (parsed.branches) localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(parsed.branches));
      if (parsed.warehouses) localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(parsed.warehouses));
      return true;
    }
  } catch (e) {
    console.error("Failed to import JSON", e);
  }
  return false;
}
