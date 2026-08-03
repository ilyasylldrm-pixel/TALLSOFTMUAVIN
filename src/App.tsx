import React, { useState, useEffect, lazy, Suspense } from "react";
import { Sidebar, NavItem } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { AuthModal, UserProfile, BRAND_LOGOS } from "./components/AuthModal";

// Lazy-loaded heavy tab modules for fast initial page load and automatic code splitting
const Contacts = lazy(() => import("./components/Contacts").then((m) => ({ default: m.Contacts })));
const Invoices = lazy(() => import("./components/Invoices").then((m) => ({ default: m.Invoices })));
const Quotes = lazy(() => import("./components/Quotes").then((m) => ({ default: m.Quotes })));
const Orders = lazy(() => import("./components/Orders").then((m) => ({ default: m.Orders })));
const Waybills = lazy(() => import("./components/Waybills").then((m) => ({ default: m.Waybills })));
const Accounts = lazy(() => import("./components/Accounts").then((m) => ({ default: m.Accounts })));
const Transactions = lazy(() => import("./components/Transactions").then((m) => ({ default: m.Transactions })));
const Products = lazy(() => import("./components/Products").then((m) => ({ default: m.Products })));
const Reports = lazy(() => import("./components/Reports").then((m) => ({ default: m.Reports })));
const AiAssistant = lazy(() => import("./components/AiAssistant").then((m) => ({ default: m.AiAssistant })));
const Settings = lazy(() => import("./components/Settings").then((m) => ({ default: m.Settings })));
const CompanyManagement = lazy(() => import("./components/CompanyManagement").then((m) => ({ default: m.CompanyManagement })));
const HRManagement = lazy(() => import("./components/HRManagement").then((m) => ({ default: m.HRManagement })));
const FileManager = lazy(() => import("./components/FileManager").then((m) => ({ default: m.FileManager })));
const AdminDashboard = lazy(() => import("./components/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));

import {
  getStoredData,
  saveStoredData,
  resetToDemoData,
  exportBackupJSON,
  importBackupJSON,
} from "./utils/storage";

import {
  Contact,
  Invoice,
  Account,
  Transaction,
  Product,
  Quote,
  Order,
  Waybill,
  CompanySettings,
  Cheque,
  ChequeStatus,
  PromissoryNote,
  PromissoryNoteStatus,
  Branch,
  Warehouse,
  Employee,
  LeaveRequest,
  AdvanceRequest,
  LegalDeduction,
} from "./types";

import { Plus, FileText, Users, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";

import { FinanceSubModule } from "./components/Accounts";

const TabLoadingSkeleton = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-7 bg-slate-200 rounded-lg w-48"></div>
      <div className="h-9 bg-slate-200 rounded-xl w-32"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
    </div>
    <div className="h-80 bg-slate-200 rounded-2xl border border-slate-200"></div>
  </div>
);

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>("dashboard");
  const [financeSubTab, setFinanceSubTab] = useState<FinanceSubModule>("kasa");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Storage State
  const [data, setData] = useState(() => getStoredData());

  // Quick Action Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [initialContactIdForInvoice, setInitialContactIdForInvoice] = useState<string | null>(null);

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem("muavin_active_user") || sessionStorage.getItem("muavin_active_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(() => currentUser === null);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Auto switch admin to admin tab on login
  useEffect(() => {
    if (currentUser && (currentUser.id === "nuT309AyQxQKddnAp1ZJjlSgBXt2" || currentUser.id === "usr_admin_001" || currentUser.role?.includes("Admin"))) {
      setCurrentTab("admin");
    }
  }, [currentUser]);

  const handleOpenAuthModal = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("muavin_active_user");
    sessionStorage.removeItem("muavin_active_user");
    setCurrentUser(null);
    setAuthModalMode("login");
    setAuthModalOpen(true);
  };

  // Sync state changes with localStorage
  useEffect(() => {
    saveStoredData("SETTINGS", data.settings);
    saveStoredData("CONTACTS", data.contacts);
    saveStoredData("ACCOUNTS", data.accounts);
    saveStoredData("INVOICES", data.invoices);
    saveStoredData("TRANSACTIONS", data.transactions);
    saveStoredData("PRODUCTS", data.products);
    saveStoredData("QUOTES", data.quotes);
    if (data.orders) saveStoredData("ORDERS", data.orders);
    if (data.waybills) saveStoredData("WAYBILLS", data.waybills);
    if (data.cheques) saveStoredData("CHEQUES", data.cheques);
    if (data.promissoryNotes) saveStoredData("PROMISSORY_NOTES", data.promissoryNotes);
    if (data.branches) saveStoredData("BRANCHES", data.branches);
    if (data.warehouses) saveStoredData("WAREHOUSES", data.warehouses);
    if (data.employees) saveStoredData("EMPLOYEES", data.employees);
    if (data.leaveRequests) saveStoredData("LEAVE_REQUESTS", data.leaveRequests);
    if (data.advanceRequests) saveStoredData("ADVANCE_REQUESTS", data.advanceRequests);
    if (data.legalDeductions) saveStoredData("LEGAL_DEDUCTIONS", data.legalDeductions);
  }, [data]);

  // Handlers for Waybills (İrsaliyeler)
  const handleAddWaybill = (newWaybill: Waybill) => {
    setData((prev) => ({
      ...prev,
      waybills: [newWaybill, ...(prev.waybills || [])],
    }));
  };

  const handleUpdateWaybill = (updatedWaybill: Waybill) => {
    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).map((w) => (w.id === updatedWaybill.id ? updatedWaybill : w)),
    }));
  };

  const handleDeleteWaybill = (waybillId: string) => {
    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).filter((w) => w.id !== waybillId),
    }));
  };

  const handleConvertWaybillToInvoice = (waybill: Waybill) => {
    const prefix = waybill.type === "dispatch" ? "FAT-SEVK-" : "FAT-AL-";
    const nextSeq = String((data.invoices || []).length + 1).padStart(6, "0");

    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: `${prefix}${nextSeq}`,
      type: waybill.type === "dispatch" ? "sales" : "purchase",
      contactId: waybill.contactId,
      contactName: waybill.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: waybill.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate || 0,
        totalWithoutVat: item.totalWithoutVat,
        vatAmount: item.vatAmount,
        totalWithVat: item.totalWithVat,
      })),
      subtotal: waybill.subtotal,
      totalVat: waybill.totalVat,
      grandTotal: waybill.grandTotal,
      currency: waybill.currency || "₺",
      paidAmount: 0,
      remainingAmount: waybill.grandTotal,
      status: "sent",
      notes: `İrsaliye No: ${waybill.waybillNumber} faturalandırıldı. (Plaka: ${waybill.vehiclePlate || "-"}, Sürücü: ${waybill.driverName || "-"})`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedWaybill: Waybill = {
      ...waybill,
      status: "invoiced",
      invoicedInvoiceId: newInvoice.id,
      invoicedInvoiceNumber: newInvoice.invoiceNumber,
    };

    setData((prev) => {
      const updatedWaybills = (prev.waybills || []).map((w) => (w.id === waybill.id ? updatedWaybill : w));
      const updatedInvoices = [newInvoice, ...prev.invoices];

      const updatedProducts = prev.products.map((p) => {
        const item = waybill.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const qty = item.quantity;
        const newStock = waybill.type === "dispatch" ? p.stockQuantity - qty : p.stockQuantity + qty;
        return { ...p, stockQuantity: newStock < 0 ? 0 : newStock };
      });

      const updatedContacts = prev.contacts.map((c) => {
        if (c.id !== waybill.contactId) return c;
        const currentBal = c.balance || 0;
        const change = waybill.type === "dispatch" ? waybill.grandTotal : -waybill.grandTotal;
        const newBal = currentBal + change;
        return {
          ...c,
          balance: newBal,
          balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        waybills: updatedWaybills,
        products: updatedProducts,
        contacts: updatedContacts,
      };
    });
  };

  // Handlers for Orders
  const handleAddOrder = (newOrder: Order) => {
    setData((prev) => ({
      ...prev,
      orders: [newOrder, ...(prev.orders || [])],
    }));
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    }));
  };

  const handleDeleteOrder = (orderId: string) => {
    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).filter((o) => o.id !== orderId),
    }));
  };

  const handleConvertOrderToInvoice = (order: Order) => {
    // 1. Create a new Invoice from Order
    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber:
        order.type === "sales"
          ? "FAT-SAT-" + Date.now().toString().slice(-6)
          : "FAT-AL-" + Date.now().toString().slice(-6),
      type: order.type === "sales" ? "sales" : "purchase",
      contactId: order.contactId,
      contactName: order.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: order.deliveryDate || new Date().toISOString().split("T")[0],
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate || 0,
        totalWithoutVat: item.totalWithoutVat,
        vatAmount: item.vatAmount,
        totalWithVat: item.totalWithVat,
      })),
      subtotal: order.subtotal,
      totalVat: order.totalVat,
      grandTotal: order.grandTotal,
      currency: order.currency || "₺",
      paidAmount: 0,
      remainingAmount: order.grandTotal,
      status: "sent",
      notes: `Sipariş No: ${order.orderNumber} faturaya dönüştürüldü. ${order.notes || ""}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // 2. Update Order status to 'converted'
    const updatedOrder: Order = {
      ...order,
      status: "converted",
    };

    // 3. Update products stock and contacts balance
    setData((prev) => {
      const updatedInvoices = [newInvoice, ...prev.invoices];
      const updatedOrders = (prev.orders || []).map((o) => (o.id === order.id ? updatedOrder : o));

      const updatedProducts = prev.products.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const qty = item.quantity;
        const newStock = order.type === "sales" ? p.stockQuantity - qty : p.stockQuantity + qty;
        return { ...p, stockQuantity: newStock < 0 ? 0 : newStock };
      });

      const updatedContacts = prev.contacts.map((c) => {
        if (c.id !== order.contactId) return c;
        const currentBal = c.balance || 0;
        const change = order.type === "sales" ? order.grandTotal : -order.grandTotal;
        return { ...c, balance: currentBal + change };
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        orders: updatedOrders,
        products: updatedProducts,
        contacts: updatedContacts,
      };
    });
  };

  // Handlers for Branches
  const handleAddBranch = (branch: Branch) => {
    setData((prev) => ({
      ...prev,
      branches: [branch, ...(prev.branches || [])],
    }));
  };

  const handleUpdateBranch = (branch: Branch) => {
    setData((prev) => ({
      ...prev,
      branches: (prev.branches || []).map((b) => (b.id === branch.id ? branch : b)),
    }));
  };

  const handleDeleteBranch = (id: string) => {
    setData((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((b) => b.id !== id),
    }));
  };

  // Handlers for Warehouses
  const handleAddWarehouse = (wh: Warehouse) => {
    setData((prev) => ({
      ...prev,
      warehouses: [wh, ...(prev.warehouses || [])],
    }));
  };

  const handleUpdateWarehouse = (wh: Warehouse) => {
    setData((prev) => ({
      ...prev,
      warehouses: (prev.warehouses || []).map((w) => (w.id === wh.id ? wh : w)),
    }));
  };

  const handleDeleteWarehouse = (id: string) => {
    setData((prev) => ({
      ...prev,
      warehouses: (prev.warehouses || []).filter((w) => w.id !== id),
    }));
  };

  // Handlers
  const handleAddContact = (contact: Contact) => {
    setData((prev) => ({
      ...prev,
      contacts: [contact, ...prev.contacts],
    }));
  };

  const handleUpdateContact = (contact: Contact) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === contact.id ? contact : c)),
    }));
  };

  const handleDeleteContact = (id: string) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  };

  const handleAddInvoice = (invoice: Invoice) => {
    setData((prev) => {
      // Update contact balance
      const updatedContacts = prev.contacts.map((c) => {
        if (c.id === invoice.contactId) {
          const delta = invoice.type === "sales" ? invoice.grandTotal : -invoice.grandTotal;
          const newBal = c.balance + delta;
          return {
            ...c,
            balance: newBal,
            balanceType: newBal > 0 ? "receivable" : newBal < 0 ? "payable" : "balanced",
          };
        }
        return c;
      });

      return {
        ...prev,
        invoices: [invoice, ...prev.invoices],
        contacts: updatedContacts as Contact[],
      };
    });
  };

  const handleDeleteInvoice = (id: string) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
    }));
  };

  const handleAddTransaction = (tx: Transaction) => {
    setData((prev) => {
      // Update account balance
      const updatedAccounts = prev.accounts.map((a) => {
        if (a.id === tx.accountId) {
          const isInc = tx.type === "income" || tx.type === "collection";
          return {
            ...a,
            balance: isInc ? a.balance + tx.amount : a.balance - tx.amount,
          };
        }
        return a;
      });

      // If contact linked, update contact balance
      let updatedContacts = prev.contacts;
      if (tx.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === tx.contactId) {
            const isInc = tx.type === "income" || tx.type === "collection";
            // Collection reduces receivable balance
            const delta = isInc ? -tx.amount : tx.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }

      return {
        ...prev,
        transactions: [tx, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleAddTransactionFromInvoice = (
    invoice: Invoice,
    accountId: string,
    paidAmount: number
  ) => {
    const isSales = invoice.type === "sales";
    const acc = data.accounts.find((a) => a.id === accountId);

    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      type: isSales ? "collection" : "payment",
      amount: paidAmount,
      currency: "TRY",
      accountId,
      accountName: acc?.name || "Kasa/Banka",
      contactId: invoice.contactId,
      contactName: invoice.contactName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      category: isSales ? "Fatura Tahsilatı" : "Fatura Ödemesi",
      description: `${invoice.invoiceNumber} nolu fatura ${isSales ? "tahsilatı" : "ödemesi"}`,
    };

    // Update invoice status & remaining
    const newPaid = invoice.paidAmount + paidAmount;
    const newRemaining = invoice.grandTotal - newPaid;
    const newStatus = newRemaining <= 0 ? "paid" : "partial";

    const updatedInvoice: Invoice = {
      ...invoice,
      paidAmount: newPaid,
      remainingAmount: Math.max(0, newRemaining),
      status: newStatus as any,
    };

    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i)),
    }));

    handleAddTransaction(newTx);
  };

  const handleCollectAllInvoices = (targetAccountId?: string) => {
    setData((prev) => {
      const defaultAcc = prev.accounts.find((a) => a.id === targetAccountId) || prev.accounts[0];
      const accountId = defaultAcc?.id || "acc_1";
      const accountName = defaultAcc?.name || "Merkez TL Kasası";

      const newTransactions: Transaction[] = [];
      let updatedAccounts = [...prev.accounts];
      let updatedContacts = [...prev.contacts];

      const nowStr = new Date().toISOString().split("T")[0];
      let collectCount = 0;

      const updatedInvoices = prev.invoices.map((inv) => {
        if (inv.status !== "cancelled" && inv.remainingAmount > 0) {
          collectCount++;
          const remainingToPay = inv.remainingAmount;
          const isSales = inv.type === "sales";

          const tx: Transaction = {
            id: `tx_all_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            date: nowStr,
            type: isSales ? "collection" : "payment",
            amount: remainingToPay,
            currency: inv.currency || "TRY",
            accountId,
            accountName,
            contactId: inv.contactId,
            contactName: inv.contactName,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            category: isSales ? "Fatura Tahsilatı" : "Fatura Ödemesi",
            description: `${inv.invoiceNumber} nolu fatura ${isSales ? "toplu tahsilatı" : "toplu ödemesi"}`,
          };
          newTransactions.push(tx);

          // Update Account Balance
          updatedAccounts = updatedAccounts.map((a) => {
            if (a.id === accountId) {
              const delta = isSales ? remainingToPay : -remainingToPay;
              return { ...a, balance: a.balance + delta };
            }
            return a;
          });

          // Update Contact Balance
          if (inv.contactId) {
            updatedContacts = updatedContacts.map((c) => {
              if (c.id === inv.contactId) {
                const delta = isSales ? -remainingToPay : remainingToPay;
                const newBal = c.balance + delta;
                return {
                  ...c,
                  balance: newBal,
                  balanceType:
                    newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
                };
              }
              return c;
            });
          }

          return {
            ...inv,
            paidAmount: inv.grandTotal,
            remainingAmount: 0,
            status: "paid" as const,
          };
        }
        return inv;
      });

      if (collectCount === 0) return prev;

      return {
        ...prev,
        invoices: updatedInvoices,
        transactions: [...newTransactions, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  // Auto collect all invoices on mount if any are uncollected
  useEffect(() => {
    const uncollectedCount = data.invoices.filter((i) => i.status !== "cancelled" && i.remainingAmount > 0).length;
    if (uncollectedCount > 0) {
      handleCollectAllInvoices();
    }
  }, []);

  const handleTransferBetweenAccounts = (
    fromId: string,
    toId: string,
    amount: number,
    desc: string
  ) => {
    const fromAcc = data.accounts.find((a) => a.id === fromId);
    const fromContact = data.contacts.find((c) => c.id === fromId);

    const toAcc = data.accounts.find((a) => a.id === toId);
    const toContact = data.contacts.find((c) => c.id === toId);

    if ((!fromAcc && !fromContact) || (!toAcc && !toContact)) return;

    const fromName = fromAcc?.name || fromContact?.name || "Borçlu Hesap";
    const toName = toAcc?.name || toContact?.name || "Alacaklı Hesap";

    const defaultAccId = data.accounts[0]?.id || "";

    const txOut: Transaction = {
      id: "tx_out_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      amount,
      currency: "TRY",
      accountId: fromAcc ? fromAcc.id : defaultAccId,
      accountName: fromAcc ? fromAcc.name : (fromContact ? `Cari Virman (${fromContact.name})` : "Virman Hesabı"),
      contactId: fromContact ? fromContact.id : undefined,
      contactName: fromContact ? fromContact.name : undefined,
      category: "Virman / Transfer",
      description: `Virman (Borçlu): ${fromName} -> ${toName} (${desc || "Virman Transferi"})`,
    };

    const txIn: Transaction = {
      id: "tx_in_" + (Date.now() + 1),
      date: new Date().toISOString().split("T")[0],
      type: "income",
      amount,
      currency: "TRY",
      accountId: toAcc ? toAcc.id : defaultAccId,
      accountName: toAcc ? toAcc.name : (toContact ? `Cari Virman (${toContact.name})` : "Virman Hesabı"),
      contactId: toContact ? toContact.id : undefined,
      contactName: toContact ? toContact.name : undefined,
      category: "Virman / Transfer",
      description: `Virman (Alacaklı): ${toName} <- ${fromName} (${desc || "Virman Transferi"})`,
    };

    handleAddTransaction(txOut);
    handleAddTransaction(txIn);
  };

  const handleAddCheque = (cheque: Cheque) => {
    setData((prev) => {
      let updatedContacts = prev.contacts;
      if (cheque.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === cheque.contactId) {
            const delta = cheque.type === "received" ? -cheque.amount : cheque.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }
      return {
        ...prev,
        cheques: [cheque, ...(prev.cheques || [])],
        contacts: updatedContacts,
      };
    });
  };

  const handleUpdateChequeStatus = (id: string, status: ChequeStatus) => {
    setData((prev) => {
      const cheque = (prev.cheques || []).find((c) => c.id === id);
      const updatedCheques = (prev.cheques || []).map((c) => (c.id === id ? { ...c, status } : c));

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;

      if (cheque && (status === "collected" || status === "paid")) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = cheque.type === "received";
          const newTx: Transaction = {
            id: "tx_chq_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: cheque.amount,
            currency: cheque.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: cheque.contactId,
            contactName: cheque.contactName,
            category: isIncome ? "Çek Tahsilatı" : "Çek Ödemesi",
            description: `${cheque.bankName || "Banka"} (${cheque.chequeNumber || "Çek"}) ${isIncome ? "Çek Tahsilatı" : "Çek Ödemesi"}`,
          };
          updatedAccounts = prev.accounts.map((acc) =>
            acc.id === defaultAcc.id
              ? { ...acc, balance: isIncome ? acc.balance + cheque.amount : acc.balance - cheque.amount }
              : acc
          );
          updatedTransactions = [newTx, ...prev.transactions];
        }
      }

      return {
        ...prev,
        cheques: updatedCheques,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleEndorseCheque = (
    chequeId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).map((c) =>
        c.id === chequeId
          ? {
              ...c,
              status: "endorsed",
              endorsedToContactId: targetContactId,
              endorsedToContactName: targetContactName,
              endorsedDate: endorseDate,
            }
          : c
      ),
    }));
  };

  const handleDeleteCheque = (id: string) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).filter((c) => c.id !== id),
    }));
  };

  const handleAddPromissoryNote = (note: PromissoryNote) => {
    setData((prev) => {
      let updatedContacts = prev.contacts;
      if (note.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === note.contactId) {
            const delta = note.type === "received" ? -note.amount : note.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }
      return {
        ...prev,
        promissoryNotes: [note, ...(prev.promissoryNotes || [])],
        contacts: updatedContacts,
      };
    });
  };

  const handleUpdateNoteStatus = (id: string, status: PromissoryNoteStatus) => {
    setData((prev) => {
      const note = (prev.promissoryNotes || []).find((n) => n.id === id);
      const updatedNotes = (prev.promissoryNotes || []).map((n) => (n.id === id ? { ...n, status } : n));

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;

      if (note && (status === "collected" || status === "paid")) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = note.type === "received";
          const newTx: Transaction = {
            id: "tx_note_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: note.amount,
            currency: note.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: note.contactId,
            contactName: note.contactName,
            category: isIncome ? "Senet Tahsilatı" : "Senet Ödemesi",
            description: `Senet No: ${note.noteNumber || "Senet"} ${isIncome ? "Senet Tahsilatı" : "Senet Ödemesi"}`,
          };
          updatedAccounts = prev.accounts.map((acc) =>
            acc.id === defaultAcc.id
              ? { ...acc, balance: isIncome ? acc.balance + note.amount : acc.balance - note.amount }
              : acc
          );
          updatedTransactions = [newTx, ...prev.transactions];
        }
      }

      return {
        ...prev,
        promissoryNotes: updatedNotes,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleEndorsePromissoryNote = (
    noteId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).map((n) =>
        n.id === noteId
          ? {
              ...n,
              status: "endorsed",
              endorsedToContactId: targetContactId,
              endorsedToContactName: targetContactName,
              endorsedDate: endorseDate,
            }
          : n
      ),
    }));
  };

  const handleDeletePromissoryNote = (id: string) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).filter((n) => n.id !== id),
    }));
  };

  const handleAddProduct = (product: Product) => {
    setData((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
  };

  const handleUpdateProduct = (product: Product) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === product.id ? product : p)),
    }));
  };

  const handleDeleteProduct = (id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const handleAddQuote = (quote: Quote) => {
    setData((prev) => ({
      ...prev,
      quotes: [quote, ...prev.quotes],
    }));
  };

  const handleConvertQuoteToInvoice = (quote: Quote) => {
    const prefix = "MUV2026";
    const nextSeq = String(data.invoices.length + 1).padStart(7, "0");

    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: `${prefix}${nextSeq}`,
      type: "sales",
      contactId: quote.contactId,
      contactName: quote.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: quote.items,
      subtotal: quote.items.reduce((s, i) => s + i.totalWithoutVat, 0),
      totalVat: quote.items.reduce((s, i) => s + i.vatAmount, 0),
      grandTotal: quote.grandTotal,
      paidAmount: 0,
      remainingAmount: quote.grandTotal,
      status: "sent",
      currency: "TRY",
      notes: quote.notes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    handleAddInvoice(newInvoice);

    // Update quote status
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, status: "converted" as const } : q
      ),
    }));
  };

  const handleConvertQuoteToOrder = (quote: Quote) => {
    const prefix = "SIP2026";
    const nextSeq = String((data.orders || []).length + 1).padStart(6, "0");
    const contact = data.contacts.find((c) => c.id === quote.contactId);

    const newOrder: Order = {
      id: "ord_" + Date.now(),
      orderNumber: `${prefix}${nextSeq}`,
      type: "sales",
      contactId: quote.contactId,
      contactName: quote.contactName,
      contactPhone: contact?.phone,
      contactEmail: contact?.email,
      taxNumber: contact?.taxNumber,
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: quote.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: quote.items.map((item) => {
        const prod = data.products.find((p) => p.id === item.productId);
        return {
          id: item.id || "item_" + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productCode: prod?.code,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discountRate: 0,
          totalWithoutVat: item.totalWithoutVat,
          vatAmount: item.vatAmount,
          totalWithVat: item.totalWithVat,
        };
      }),
      subtotal: quote.items.reduce((s, i) => s + i.totalWithoutVat, 0),
      totalVat: quote.items.reduce((s, i) => s + i.vatAmount, 0),
      grandTotal: quote.grandTotal,
      currency: quote.currency || "TRY",
      status: "approved",
      notes: `Proforma (Belge No: ${quote.quoteNumber}) siparişe dönüştürüldü. ${quote.notes || ""}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    handleAddOrder(newOrder);

    // Update quote status to converted
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, status: "converted" as const } : q
      ),
    }));
  };

  const handleDeleteQuote = (id: string) => {
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== id),
    }));
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    setData((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleResetDemoData = () => {
    resetToDemoData();
    setData(getStoredData());
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Muavin_Yedek_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleImportBackup = (jsonStr: string) => {
    const ok = importBackupJSON(jsonStr);
    if (ok) {
      setData(getStoredData());
    }
    return ok;
  };

  // HR Handlers
  const handleAddEmployee = (emp: Employee) => {
    setData((p) => {
      const next = { ...p, employees: [emp, ...(p.employees || [])] };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setData((p) => {
      const next = {
        ...p,
        employees: (p.employees || []).map((e) => (e.id === emp.id ? emp : e)),
      };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleDeleteEmployee = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        employees: (p.employees || []).filter((e) => e.id !== id),
      };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleAddLeaveRequest = (req: LeaveRequest) => {
    setData((p) => {
      const next = { ...p, leaveRequests: [req, ...(p.leaveRequests || [])] };
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests);
      return next;
    });
  };

  const handleUpdateLeaveStatus = (id: string, status: "approved" | "rejected") => {
    setData((p) => {
      const next = {
        ...p,
        leaveRequests: (p.leaveRequests || []).map((r) =>
          r.id === id ? { ...r, status } : r
        ),
      };
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests);
      return next;
    });
  };

  const handleAddAdvanceRequest = (req: AdvanceRequest) => {
    setData((p) => {
      const next = { ...p, advanceRequests: [req, ...(p.advanceRequests || [])] };
      saveStoredData("ADVANCE_REQUESTS", next.advanceRequests);
      return next;
    });
  };

  const handleUpdateAdvanceStatus = (id: string, status: "paid" | "approved" | "rejected") => {
    setData((p) => {
      const targetReq = (p.advanceRequests || []).find((r) => r.id === id);
      const updatedAdvanceRequests = (p.advanceRequests || []).map((r) =>
        r.id === id ? { ...r, status } : r
      );
      saveStoredData("ADVANCE_REQUESTS", updatedAdvanceRequests);

      let updatedAccounts = p.accounts;
      let updatedTransactions = p.transactions;

      if (status === "paid" && targetReq && targetReq.status !== "paid") {
        const defaultAcc = p.accounts[0];
        if (defaultAcc) {
          const emp = (p.employees || []).find((e) => e.id === targetReq.employeeId);
          const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Personel";
          const newTx: Transaction = {
            id: "tx_adv_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: "expense",
            amount: targetReq.amount,
            currency: "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            category: "Personel / Avans",
            description: `Personel Avans Ödemesi: ${empName} (${targetReq.reason || "Avans Ödemesi"})`,
          };
          updatedAccounts = p.accounts.map((acc) =>
            acc.id === defaultAcc.id ? { ...acc, balance: acc.balance - targetReq.amount } : acc
          );
          updatedTransactions = [newTx, ...p.transactions];
        }
      }

      return {
        ...p,
        advanceRequests: updatedAdvanceRequests,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleAddLegalDeduction = (deduction: LegalDeduction) => {
    setData((p) => {
      const next = { ...p, legalDeductions: [deduction, ...(p.legalDeductions || [])] };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  const handleUpdateLegalDeduction = (deduction: LegalDeduction) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).map((d) => (d.id === deduction.id ? deduction : d)),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  const handleDeleteLegalDeduction = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).filter((d) => d.id !== id),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  const getPageTitle = (tab: NavItem) => {
    switch (tab) {
      case "dashboard":
        return "Ana Sayfa";
      case "contacts":
        return "Cari Hesaplar";
      case "invoices":
        return "E-Belgeler";
      case "invoices_sales":
        return "Gelir Faturası";
      case "invoices_purchase":
        return "Gider Faturası";
      case "quotes":
        return "Proforma Faturalar";
      case "quotes_and_slips":
        return "Gelir & Gider Fişleri";
      case "orders":
        return "Siparişler & Sipariş Oluştur";
      case "orders_module":
        return "Sipariş & Proforma";
      case "waybills":
        return "İrsaliye Yönetimi & İrsaliye Oluştur";
      case "waybills_dispatch":
        return "Giden İrsaliyeler (Sevk İrsaliyeleri)";
      case "waybills_receipt":
        return "Gelen İrsaliyeler (Alış İrsaliyeleri)";
      case "accounts":
        return "Finans Yönetimi";
      case "transactions":
        return "Gelir & Giderler";
      case "income_slips":
        return "Gelir Fişi";
      case "expenses":
        return "Gider Fişi";
      case "products":
        return "Stok & Hizmetler";
      case "hr":
        return "İnsan Kaynakları";
      case "reports":
        return "Vergilendirme";
      case "ai":
        return "AI Muavin Asistanı";
      case "company":
      case "company_profile":
        return "Firma Profili & Adres";
      case "company_branches":
        return "Firma Şubeleri";
      case "company_warehouses":
        return "Firma Depoları";
      case "settings":
        return "Sistem Ayarları";
      case "admin":
        return "Admin Yönetici Paneli";
      default:
        return "Ana Sayfa";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeFinanceSubTab={financeSubTab}
        onSelectFinanceSubTab={setFinanceSubTab}
        settings={data.settings}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          title={getPageTitle(currentTab)}
          subtitle="Muavin Ön Muhasebe & Finansal Takip Programı"
          accounts={data.accounts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenAiModal={() => setCurrentTab("ai")}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main className="flex-1 pb-12 bg-slate-100">
          <Suspense fallback={<TabLoadingSkeleton />}>
            {currentTab === "dashboard" && (
            <Dashboard
              contacts={data.contacts}
              invoices={data.invoices}
              accounts={data.accounts}
              transactions={data.transactions}
              settings={data.settings}
              globalSearchTerm={searchTerm}
              onSelectTab={setCurrentTab}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onOpenAiModal={() => setCurrentTab("ai")}
            />
          )}

          {currentTab === "contacts" && (
            <Contacts
              currentUser={currentUser}
              contacts={data.contacts}
              invoices={data.invoices}
              transactions={data.transactions}
              accounts={data.accounts}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onAddTransaction={handleAddTransaction}
              onAddCheque={handleAddCheque}
              onAddPromissoryNote={handleAddPromissoryNote}
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onOpenNewInvoiceForContact={(cid) => {
                setInitialContactIdForInvoice(cid);
                setCurrentTab("invoices");
              }}
              onOpenPaymentModal={() => setCurrentTab("transactions")}
            />
          )}

          {(currentTab === "invoices" ||
            currentTab === "invoices_sales" ||
            currentTab === "invoices_purchase") && (
            <Invoices
              invoices={data.invoices}
              contacts={data.contacts}
              products={data.products}
              accounts={data.accounts}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              forcedType={
                currentTab === "invoices_sales"
                  ? "sales"
                  : currentTab === "invoices_purchase"
                  ? "purchase"
                  : undefined
              }
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={() => {}}
              onDeleteInvoice={handleDeleteInvoice}
              onAddTransactionFromInvoice={handleAddTransactionFromInvoice}
              onCollectAllInvoices={handleCollectAllInvoices}
              initialContactIdForNewInvoice={initialContactIdForInvoice}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === "quotes" && (
            <Quotes
              quotes={data.quotes}
              contacts={data.contacts}
              products={data.products}
              companySettings={data.companySettings}
              globalSearchTerm={searchTerm}
              onAddQuote={handleAddQuote}
              onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
              onConvertQuoteToOrder={handleConvertQuoteToOrder}
              onDeleteQuote={handleDeleteQuote}
            />
          )}

          {currentTab === "accounts" && (
            <Accounts
              accounts={data.accounts}
              transactions={data.transactions}
              contacts={data.contacts}
              cheques={data.cheques || []}
              promissoryNotes={data.promissoryNotes || []}
              activeFinanceSubTab={financeSubTab}
              globalSearchTerm={searchTerm}
              onSelectFinanceSubTab={setFinanceSubTab}
              onAddAccount={(acc) =>
                setData((p) => ({ ...p, accounts: [...p.accounts, acc] }))
              }
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onAddTransaction={handleAddTransaction}
              onAddCheque={handleAddCheque}
              onUpdateChequeStatus={handleUpdateChequeStatus}
              onDeleteCheque={handleDeleteCheque}
              onEndorseCheque={handleEndorseCheque}
              onAddPromissoryNote={handleAddPromissoryNote}
              onUpdateNoteStatus={handleUpdateNoteStatus}
              onEndorsePromissoryNote={handleEndorsePromissoryNote}
              onDeletePromissoryNote={handleDeletePromissoryNote}
            />
          )}

          {(currentTab === "transactions" ||
            currentTab === "income_slips" ||
            currentTab === "expenses") && (
            <Transactions
              transactions={data.transactions}
              accounts={data.accounts}
              contacts={data.contacts}
              products={data.products || []}
              globalSearchTerm={searchTerm}
              forcedType={
                currentTab === "income_slips"
                  ? "income"
                  : currentTab === "expenses"
                  ? "expense"
                  : undefined
              }
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {(currentTab === "products" || currentTab === "products_list") && (
            <Products
              products={data.products}
              invoices={data.invoices}
              contacts={data.contacts}
              warehouses={data.warehouses || []}
              globalSearchTerm={searchTerm}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {currentTab === "orders" && (
            <Orders
              orders={data.orders || []}
              contacts={data.contacts}
              products={data.products}
              warehouses={data.warehouses || []}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onConvertOrderToInvoice={handleConvertOrderToInvoice}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {(currentTab === "waybills" || currentTab === "waybills_dispatch" || currentTab === "waybills_receipt") && (
            <Waybills
              waybills={data.waybills || []}
              contacts={data.contacts}
              products={data.products}
              warehouses={data.warehouses || []}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              forcedType={
                currentTab === "waybills_dispatch"
                  ? "dispatch"
                  : currentTab === "waybills_receipt"
                  ? "receipt"
                  : undefined
              }
              onAddWaybill={handleAddWaybill}
              onUpdateWaybill={handleUpdateWaybill}
              onConvertWaybillToInvoice={handleConvertWaybillToInvoice}
              onDeleteWaybill={handleDeleteWaybill}
            />
          )}

          {currentTab === "hr" && (
            <HRManagement
              employees={data.employees || []}
              leaveRequests={data.leaveRequests || []}
              advanceRequests={data.advanceRequests || []}
              legalDeductions={data.legalDeductions || []}
              companySettings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddLeaveRequest={handleAddLeaveRequest}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onAddAdvanceRequest={handleAddAdvanceRequest}
              onUpdateAdvanceStatus={handleUpdateAdvanceStatus}
              onAddLegalDeduction={handleAddLegalDeduction}
              onUpdateLegalDeduction={handleUpdateLegalDeduction}
              onDeleteLegalDeduction={handleDeleteLegalDeduction}
            />
          )}

          {currentTab === "files" && currentUser && (
            <FileManager currentUser={currentUser} />
          )}

          {currentTab === "admin" && currentUser && (
            <AdminDashboard currentUser={currentUser} />
          )}

          {currentTab === "reports" && (
            <Reports
              contacts={data.contacts}
              invoices={data.invoices}
              transactions={data.transactions}
              companySettings={data.settings}
              products={data.products}
              quotes={data.quotes}
              orders={data.orders}
              waybills={data.waybills}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              employees={data.employees}
            />
          )}

          {currentTab === "ai" && (
            <AiAssistant
              contacts={data.contacts}
              invoices={data.invoices}
              accounts={data.accounts}
              transactions={data.transactions}
              products={data.products}
              quotes={data.quotes}
              orders={data.orders}
              waybills={data.waybills}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              employees={data.employees}
              onAddInvoice={handleAddInvoice}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {["company", "company_profile", "company_branches", "company_warehouses"].includes(currentTab) && (
            <CompanyManagement
              settings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              onSaveSettings={handleSaveSettings}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
              onDeleteBranch={handleDeleteBranch}
              onAddWarehouse={handleAddWarehouse}
              onUpdateWarehouse={handleUpdateWarehouse}
              onDeleteWarehouse={handleDeleteWarehouse}
              activeSubTab={
                currentTab === "company_branches"
                  ? "branches"
                  : currentTab === "company_warehouses"
                  ? "warehouses"
                  : "profile"
              }
              onSelectSubTab={(tab) => {
                if (tab === "branches") setCurrentTab("company_branches");
                else if (tab === "warehouses") setCurrentTab("company_warehouses");
                else setCurrentTab("company_profile");
              }}
            />
          )}

          {currentTab === "settings" && (
            <Settings
              settings={data.settings}
              onSaveSettings={handleSaveSettings}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDemoData={handleResetDemoData}
            />
          )}
          </Suspense>
        </main>
      </div>

      {/* QUICK ADD ACTION MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Hızlı İşlem Seçin
              </h3>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("invoices");
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 hover:border-indigo-500/50 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Yeni Fatura Kes / Kaydet
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Satış veya Alış e-Faturası hazırlayın
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("contacts");
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 hover:border-blue-500/50 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Yeni Cari Kart Ekle
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Müşteri veya Tedarikçi tanımı yapın
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("transactions");
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500/50 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Hızlı Gelir / Gider Kaydı
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Kira, Maaş, Fiş veya Fatura dışı ödemeler
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth & Registration Modal with 6 Brand Logo Gallery */}
      <AuthModal
        isOpen={authModalOpen || currentUser === null}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
        }}
        initialMode={authModalMode}
        canClose={!!currentUser}
      />
    </div>
  );
}
