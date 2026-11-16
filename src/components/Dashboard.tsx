import React, { useMemo, useState } from "react";
import { ExchangeRatesWidget } from "./ExchangeRatesWidget";
import {
  Contact,
  Invoice,
  Account,
  Transaction,
  CompanySettings,
  Cheque,
  PromissoryNote,
  Product,
  Quote,
  Order,
  Waybill,
} from "../types";
import {
  Search,
  Users,
  FileText,
  Receipt,
  ArrowUpRight,
  LayoutDashboard,
  Plus,
  Wallet,
  ArrowDownLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Building2,
  Layers,
  ArrowRight,
  Package,
  ShoppingCart,
  Activity,
} from "lucide-react";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { GeometricHoneycombBackground } from "./common/GeometricHoneycombBackground";
import { ChequeNoteSummaryReport } from "./common/ChequeNoteSummaryReport";
import { useTheme } from "../context/ThemeContext";
import { formatCurrency, formatDate } from "../utils/exportUtils";

interface DashboardProps {
  contacts: Contact[];
  invoices: Invoice[];
  accounts: Account[];
  transactions: Transaction[];
  cheques?: Cheque[];
  promissoryNotes?: PromissoryNote[];
  products?: Product[];
  quotes?: Quote[];
  orders?: Order[];
  waybills?: Waybill[];
  settings: CompanySettings;
  globalSearchTerm?: string;
  onSelectTab: (tab: any) => void;
  onOpenQuickAdd: () => void;
  canAccessTab?: (tab: string) => boolean;
  canUseQuickAdd?: boolean;
  authorizedShortcuts?: Array<{ id: string; label: string; description: string }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  contacts,
  invoices,
  accounts,
  transactions,
  cheques = [],
  promissoryNotes = [],
  products = [],
  quotes: _quotes = [],
  orders = [],
  waybills: _waybills = [],
  settings: _settings,
  globalSearchTerm = "",
  onSelectTab,
  onOpenQuickAdd,
  canAccessTab,
  canUseQuickAdd = false,
  authorizedShortcuts = [],
}) => {
  const { theme } = useTheme();
  const [chartPeriod, setChartPeriod] = useState<"6m" | "12m">("6m");
  const [activeAccountType, setActiveAccountType] = useState<"all" | "cash" | "bank">("all");

  // Varsayılan olarak güvenli (kapalı) yetki kontrolü
  const checkTab = (tab: string): boolean =>
    canAccessTab ? Boolean(canAccessTab(tab)) : false;

  const canViewAccounts = checkTab("accounts");
  const canViewCash = canViewAccounts && checkTab("finance_kasa");
  const canViewBank = canViewAccounts && checkTab("finance_banka");
  const canViewCheques = canViewAccounts && checkTab("finance_cek");
  const canViewNotes = canViewAccounts && checkTab("finance_senet");
  const canViewTransactions = checkTab("transactions");
  const canViewContacts = checkTab("contacts");
  const canViewSalesInvoices = checkTab("invoices_sales");
  const canViewPurchaseInvoices = checkTab("invoices_purchase");
  const canViewAnyInvoices = canViewSalesInvoices || canViewPurchaseInvoices;
  const canViewProducts = checkTab("products") && checkTab("products_list");
  const canViewOrders = checkTab("orders");
  const canViewQuotes = checkTab("quotes");
  const canViewEcommerce = checkTab("ecommerce");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Yetkisiz kasa veya banka hesaplarına bağlı finansal hareketleri filtrele
  const authorizedTransactions = useMemo(() => {
    if (!canViewTransactions) return [];
    const typeById = new Map<string, Account["type"]>();
    const typeByName = new Map<string, Account["type"]>();
    accounts.forEach((acc) => {
      if (acc.id) typeById.set(acc.id, acc.type);
      if (acc.name) typeByName.set(acc.name.trim().toLowerCase(), acc.type);
    });

    return transactions.filter((tx) => {
      const accType =
        (tx.accountId && typeById.get(tx.accountId)) ||
        (tx.accountName && typeByName.get(tx.accountName.trim().toLowerCase()));
      if (accType === "cash" && !canViewCash && canViewBank) return false;
      if (
        (accType === "bank" || accType === "credit_card" || accType === "pos") &&
        !canViewBank &&
        canViewCash
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, accounts, canViewTransactions, canViewCash, canViewBank]);

  // 1. KPI Hesaplamaları (Sadece yetkili modül verileri hesaplanır, çapraz modül sızıntısı engellenir)
  const metrics = useMemo(() => {
    const cashTotal = canViewCash
      ? accounts
          .filter((a) => a.type === "cash")
          .reduce((acc, a) => acc + (a.balance || 0), 0)
      : 0;
    const bankTotal = canViewBank
      ? accounts
          .filter((a) => a.type === "bank" || a.type === "credit_card" || a.type === "pos")
          .reduce((acc, a) => acc + (a.balance || 0), 0)
      : 0;

    let totalReceivables = 0;
    let totalPayables = 0;
    let debtorContactsCount = 0;
    let creditorContactsCount = 0;
    if (canViewContacts) {
      contacts.forEach((c) => {
        if (c.balance > 0) {
          totalReceivables += c.balance;
          debtorContactsCount += 1;
        } else if (c.balance < 0) {
          totalPayables += Math.abs(c.balance);
          creditorContactsCount += 1;
        }
      });
    }

    const unpaidSalesInvoices = canViewSalesInvoices
      ? invoices.filter(
          (inv) => inv.type === "sales" && inv.status !== "paid" && inv.status !== "cancelled"
        )
      : [];
    const unpaidPurchaseInvoices = canViewPurchaseInvoices
      ? invoices.filter(
          (inv) => inv.type === "purchase" && inv.status !== "paid" && inv.status !== "cancelled"
        )
      : [];

    const unpaidSalesTotal = unpaidSalesInvoices.reduce(
      (acc, inv) => acc + (inv.remainingAmount ?? inv.grandTotal - (inv.paidAmount || 0)),
      0
    );
    const unpaidPurchaseTotal = unpaidPurchaseInvoices.reduce(
      (acc, inv) => acc + (inv.remainingAmount ?? inv.grandTotal - (inv.paidAmount || 0)),
      0
    );

    const overdueReceivables = unpaidSalesInvoices
      .filter((inv) => inv.dueDate && inv.dueDate < todayStr)
      .reduce(
        (acc, inv) => acc + (inv.remainingAmount ?? inv.grandTotal - (inv.paidAmount || 0)),
        0
      );

    const overduePayables = unpaidPurchaseInvoices
      .filter((inv) => inv.dueDate && inv.dueDate < todayStr)
      .reduce(
        (acc, inv) => acc + (inv.remainingAmount ?? inv.grandTotal - (inv.paidAmount || 0)),
        0
      );

    const portfolioChequesAmount = canViewCheques
      ? cheques
          .filter((c) => c.status === "portfolio" && c.type === "received")
          .reduce((acc, c) => acc + (c.amount || 0), 0)
      : 0;
    const issuedChequesPending = canViewCheques
      ? cheques
          .filter((c) => c.status === "portfolio" && c.type === "issued")
          .reduce((acc, c) => acc + (c.amount || 0), 0)
      : 0;

    const portfolioNotesAmount = canViewNotes
      ? promissoryNotes
          .filter((n) => n.status === "portfolio" && n.type === "received")
          .reduce((acc, n) => acc + (n.amount || 0), 0)
      : 0;
    const issuedNotesPending = canViewNotes
      ? promissoryNotes
          .filter((n) => n.status === "portfolio" && n.type === "issued")
          .reduce((acc, n) => acc + (n.amount || 0), 0)
      : 0;

    const lowStockCount = canViewProducts
      ? products.filter((p) => {
          const min = p.minStockAlert ?? p.minStock ?? 5;
          return (p.stockQuantity ?? p.stock ?? 0) <= min && !p.isService;
        }).length
      : 0;

    const pendingOrdersCount = canViewOrders
      ? orders.filter((o) => o.status === "pending" || o.status === "confirmed").length
      : 0;

    return {
      cashTotal,
      bankTotal,
      totalReceivables,
      totalPayables,
      debtorContactsCount,
      creditorContactsCount,
      unpaidSalesTotal,
      unpaidPurchaseTotal,
      overdueReceivables,
      overduePayables,
      portfolioChequesAmount,
      issuedChequesPending,
      portfolioNotesAmount,
      issuedNotesPending,
      lowStockCount,
      pendingOrdersCount,
      unpaidSalesCount: unpaidSalesInvoices.length,
      unpaidPurchaseCount: unpaidPurchaseInvoices.length,
    };
  }, [
    accounts,
    contacts,
    invoices,
    cheques,
    promissoryNotes,
    products,
    orders,
    todayStr,
    canViewCash,
    canViewBank,
    canViewContacts,
    canViewSalesInvoices,
    canViewPurchaseInvoices,
    canViewCheques,
    canViewNotes,
    canViewProducts,
    canViewOrders,
  ]);

  // 2. Trend & Nakit Akışı Aylık Grafiği (Sadece Gelir & Gider Fişleri yetkisi varsa)
  const cashFlowChartData = useMemo(() => {
    if (!canViewTransactions) return [];
    const monthCount = chartPeriod === "6m" ? 6 : 12;
    const result: Array<{
      monthKey: string;
      label: string;
      gelir: number;
      gider: number;
      net: number;
    }> = [];

    const now = new Date();
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}`;
      const label = d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });

      const monthIncome = authorizedTransactions
        .filter(
          (t) =>
            t.date &&
            t.date.startsWith(monthKey) &&
            (t.type === "income" || t.type === "collection")
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthExpense = authorizedTransactions
        .filter(
          (t) =>
            t.date &&
            t.date.startsWith(monthKey) &&
            (t.type === "expense" || t.type === "payment")
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      result.push({
        monthKey,
        label,
        gelir: Math.round(monthIncome),
        gider: Math.round(monthExpense),
        net: Math.round(monthIncome - monthExpense),
      });
    }

    return result;
  }, [authorizedTransactions, chartPeriod, canViewTransactions]);

  // 3. Fatura Dağılımı (Sadece yetkili olunan Satış / Alış faturaları)
  const invoiceBreakdown = useMemo(() => {
    let salesTotal = 0;
    let purchaseTotal = 0;

    invoices.forEach((inv) => {
      if (inv.status === "cancelled") return;
      if (inv.type === "sales" && canViewSalesInvoices) salesTotal += inv.grandTotal || 0;
      else if (inv.type === "purchase" && canViewPurchaseInvoices) purchaseTotal += inv.grandTotal || 0;
    });

    return [
      { name: "Satış Faturaları", value: Math.round(salesTotal), color: "#0ea5e9" },
      { name: "Alış & Masraflar", value: Math.round(purchaseTotal), color: "#f43f5e" },
    ];
  }, [invoices, canViewSalesInvoices, canViewPurchaseInvoices]);

  // 4. Yaklaşan / Vadesi Geçen Kritik Hareketler
  const upcomingActionItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      dueDate: string;
      amount: number;
      type:
        | "sales_invoice"
        | "purchase_invoice"
        | "cheque_rcv"
        | "cheque_iss"
        | "note_rcv"
        | "note_iss";
      isOverdue: boolean;
      daysDiff: number;
    }> = [];

    invoices.forEach((inv) => {
      if (inv.status === "paid" || inv.status === "cancelled" || !inv.dueDate) return;
      if (inv.type === "sales" && !canViewSalesInvoices) return;
      if (inv.type === "purchase" && !canViewPurchaseInvoices) return;
      const rem = inv.remainingAmount ?? inv.grandTotal - (inv.paidAmount || 0);
      if (rem <= 0) return;

      const due = new Date(inv.dueDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 30 && diffDays >= -60) {
        items.push({
          id: `inv-${inv.id}`,
          title: canViewContacts
            ? inv.contactName || inv.invoiceNumber || "Fatura"
            : inv.invoiceNumber || "Fatura",
          subtitle: canViewContacts
            ? `${inv.invoiceNumber} • ${inv.type === "sales" ? "Tahsil Edilecek Fatura" : "Ödenecek Fatura"}`
            : inv.type === "sales"
            ? "Tahsil Edilecek Satış Faturası"
            : "Ödenecek Gider Faturası",
          dueDate: inv.dueDate,
          amount: rem,
          type: inv.type === "sales" ? "sales_invoice" : "purchase_invoice",
          isOverdue: diffDays < 0,
          daysDiff: diffDays,
        });
      }
    });

    if (canViewCheques) {
      cheques.forEach((chq) => {
        if (chq.status !== "portfolio" || !chq.dueDate) return;
        const due = new Date(chq.dueDate);
        const today = new Date(todayStr);
        const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (diffDays <= 30 && diffDays >= -60) {
          items.push({
            id: `chq-${chq.id}`,
            title: canViewContacts
              ? chq.contactName || chq.drawerName || `Çek #${chq.chequeNumber || "-"}`
              : `Çek #${chq.chequeNumber || "-"}`,
            subtitle: `${chq.bankName || "Banka"} • ${
              chq.type === "received" ? "Alınan Portföy Çeki" : "Verilen Borç Çeki"
            }`,
            dueDate: chq.dueDate,
            amount: chq.amount,
            type: chq.type === "received" ? "cheque_rcv" : "cheque_iss",
            isOverdue: diffDays < 0,
            daysDiff: diffDays,
          });
        }
      });
    }

    if (canViewNotes) {
      promissoryNotes.forEach((note) => {
        if (note.status !== "portfolio" || !note.dueDate) return;
        const due = new Date(note.dueDate);
        const today = new Date(todayStr);
        const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (diffDays <= 30 && diffDays >= -60) {
          items.push({
            id: `note-${note.id}`,
            title: canViewContacts
              ? note.contactName || note.debtorName || `Senet #${note.noteNumber || "-"}`
              : `Senet #${note.noteNumber || "-"}`,
            subtitle:
              note.type === "received" ? "Alınan Portföy Senedi" : "Verilen Borç Senedi",
            dueDate: note.dueDate,
            amount: note.amount,
            type: note.type === "received" ? "note_rcv" : "note_iss",
            isOverdue: diffDays < 0,
            daysDiff: diffDays,
          });
        }
      });
    }

    return items
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysDiff - b.daysDiff;
      })
      .slice(0, 6);
  }, [
    invoices,
    cheques,
    promissoryNotes,
    todayStr,
    canViewSalesInvoices,
    canViewPurchaseInvoices,
    canViewCheques,
    canViewNotes,
    canViewContacts,
  ]);

  // 5. Son Yapılan Finansal İşlemler
  const recentTransactions = useMemo(() => {
    if (!canViewTransactions) return [];
    return [...authorizedTransactions]
      .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
      .slice(0, 6);
  }, [authorizedTransactions, canViewTransactions]);

  // 5.1 Son 10 İşlem / Etkinlik Günlüğü (Sadece yetkili modüllerden beslenir)
  const recentActivities = useMemo(() => {
    interface ActivityItem {
      id: string;
      title: string;
      description: string;
      timeLabel: string;
      timestamp: number;
      type: "invoice" | "payment" | "collection" | "contact" | "order";
      badgeText: string;
      amount?: number;
      currency?: string;
      targetTab: string;
    }

    const list: ActivityItem[] = [];

    if (canViewSalesInvoices || canViewPurchaseInvoices) {
      invoices.forEach((inv) => {
        const isSales = inv.type === "sales";
        if (isSales && !canViewSalesInvoices) return;
        if (!isSales && !canViewPurchaseInvoices) return;
        const rawDate = inv.createdAt || inv.issueDate;
        const ts = rawDate ? new Date(rawDate).getTime() : 0;
        list.push({
          id: `inv-${inv.id}`,
          title: isSales ? "Satış Faturası Düzenlendi" : "Alış / Gider Faturası Kaydedildi",
          description: canViewContacts
            ? `${inv.invoiceNumber} • ${inv.contactName || "Cari"}`
            : `${inv.invoiceNumber}`,
          timeLabel: formatDate(rawDate),
          timestamp: isNaN(ts) ? 0 : ts,
          type: "invoice",
          badgeText: isSales ? "Satış Faturası" : "Alış Faturası",
          amount: inv.payableAmount ?? inv.grandTotal,
          currency: inv.currency || "TRY",
          targetTab: isSales ? "invoices_sales" : "invoices_purchase",
        });
      });
    }

    if (canViewTransactions) {
      authorizedTransactions.forEach((tx) => {
        const rawDate = tx.date;
        const ts = rawDate ? new Date(rawDate).getTime() : 0;
        const isIncome = tx.type === "income" || tx.type === "collection";
        let actionTitle = "Finansal İşlem Gerçekleşti";
        if (tx.type === "collection") actionTitle = "Tahsilat Alındı";
        else if (tx.type === "payment") actionTitle = "Ödeme Yapıldı";
        else if (tx.type === "income") actionTitle = "Gelir Girişi Yapıldı";
        else if (tx.type === "expense") actionTitle = "Gider Çıkışı Yapıldı";
        else if (tx.type === "transfer") actionTitle = "Hesaplar Arası Virman";

        const txDetail =
          tx.description || (canViewContacts ? tx.contactName : undefined) || "İşlem";
        const accountPrefix =
          (canViewCash || canViewBank) && tx.accountName ? `${tx.accountName} • ` : "";

        list.push({
          id: `tx-${tx.id}`,
          title: actionTitle,
          description: `${accountPrefix}${txDetail}`,
          timeLabel: formatDate(rawDate),
          timestamp: isNaN(ts) ? 0 : ts,
          type: isIncome ? "collection" : "payment",
          badgeText: isIncome ? "Tahsilat / Gelir" : "Ödeme / Gider",
          amount: tx.amount,
          currency: tx.currency || "TRY",
          targetTab: "transactions",
        });
      });
    }

    if (canViewContacts) {
      contacts.forEach((c) => {
        const rawDate = c.createdAt;
        const ts = rawDate ? new Date(rawDate).getTime() : 0;
        const typeLabel =
          c.contactType === "customer"
            ? "Müşteri"
            : c.contactType === "vendor" || c.contactType === "supplier"
            ? "Tedarikçi"
            : "Cari";
        list.push({
          id: `cnt-${c.id}`,
          title: "Yeni Cari Hesap Eklendi",
          description: `${c.name}${c.companyTitle ? ` (${c.companyTitle})` : ""}`,
          timeLabel: formatDate(rawDate),
          timestamp: isNaN(ts) ? 0 : ts,
          type: "contact",
          badgeText: typeLabel,
          targetTab: "contacts",
        });
      });
    }

    if (canViewOrders) {
      orders.forEach((ord) => {
        const rawDate = ord.createdAt || ord.orderDate || ord.date;
        const ts = rawDate ? new Date(rawDate).getTime() : 0;
        list.push({
          id: `ord-${ord.id}`,
          title: ord.type === "sales" ? "Yeni Sipariş Alındı" : "Satın Alma Siparişi Verildi",
          description: canViewContacts
            ? `${ord.orderNumber} • ${ord.contactName || "Cari"}`
            : `${ord.orderNumber}`,
          timeLabel: formatDate(rawDate),
          timestamp: isNaN(ts) ? 0 : ts,
          type: "order",
          badgeText: "Sipariş",
          amount: ord.grandTotal,
          currency: ord.currency || "TRY",
          targetTab: "orders",
        });
      });
    }

    return list
      .filter((act) => checkTab(act.targetTab))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [
    invoices,
    authorizedTransactions,
    contacts,
    orders,
    canViewSalesInvoices,
    canViewPurchaseInvoices,
    canViewTransactions,
    canViewContacts,
    canViewOrders,
    canViewCash,
    canViewBank,
    canAccessTab,
  ]);

  // 6. Kasa ve Banka Hesapları
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (a.type === "cash") {
        if (!canViewCash) return false;
        if (activeAccountType === "bank") return false;
        return true;
      }
      if (!canViewBank) return false;
      if (activeAccountType === "cash") return false;
      return true;
    });
  }, [accounts, activeAccountType, canViewCash, canViewBank]);

  const authorizedLiquidTotal = metrics.cashTotal + metrics.bankTotal;
  const authorizedPortfolioTotal =
    metrics.portfolioChequesAmount + metrics.portfolioNotesAmount;
  const authorizedIssuedPortfolioTotal =
    metrics.issuedChequesPending + metrics.issuedNotesPending;

  const showCardLiquid = canViewCash || canViewBank;
  const showCardReceivables = canViewContacts || canViewSalesInvoices;
  const showCardPayables = canViewContacts || canViewPurchaseInvoices;
  const showCardPortfolio = canViewCheques || canViewNotes;

  const visibleKpiCount = [
    showCardLiquid,
    showCardReceivables,
    showCardPayables,
    showCardPortfolio,
  ].filter(Boolean).length;
  const hasAnyKpiCard = visibleKpiCount > 0;

  const kpiGridColsClass =
    visibleKpiCount === 1
      ? "grid-cols-1"
      : visibleKpiCount === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : visibleKpiCount === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  const liquidTitle =
    canViewCash && canViewBank
      ? "Kasa & Banka Varlığı"
      : canViewCash
      ? "Kasa Varlığı"
      : "Banka Varlığı";

  const accountsPanelTitle =
    canViewCash && canViewBank
      ? "Kasa & Banka Bakiyeleri"
      : canViewCash
      ? "Kasa Bakiyeleri"
      : "Banka Bakiyeleri";

  const portfolioTitle =
    canViewCheques && canViewNotes
      ? "Portföydeki Çek / Senet"
      : canViewCheques
      ? "Portföydeki Çekler"
      : "Portföydeki Senetler";

  const issuedPortfolioLabel =
    canViewCheques && canViewNotes
      ? "Verilen Borç Çek/Senet:"
      : canViewCheques
      ? "Verilen Borç Çeki:"
      : "Verilen Borç Senedi:";

  const headerStats = [
    ...(showCardLiquid
      ? [
          {
            label:
              canViewCash && canViewBank
                ? "Toplam Varlık"
                : canViewCash
                ? "Kasa Varlığı"
                : "Banka Varlığı",
            value: formatCurrency(authorizedLiquidTotal),
            tone: "success" as const,
          },
        ]
      : []),
    ...(canViewContacts
      ? [
          {
            label: "Bekleyen Alacak",
            value: formatCurrency(metrics.totalReceivables),
            tone: "info" as const,
          },
        ]
      : canViewSalesInvoices
      ? [
          {
            label: "Açık Satış Faturası",
            value: formatCurrency(metrics.unpaidSalesTotal),
            tone: "info" as const,
          },
        ]
      : []),
    ...(canViewContacts
      ? [
          {
            label: "Toplam Borç",
            value: formatCurrency(metrics.totalPayables),
            tone: (metrics.totalPayables > 0 ? "warning" : "default") as
              | "warning"
              | "default",
          },
        ]
      : canViewPurchaseInvoices
      ? [
          {
            label: "Açık Gider Faturası",
            value: formatCurrency(metrics.unpaidPurchaseTotal),
            tone: (metrics.unpaidPurchaseTotal > 0 ? "warning" : "default") as
              | "warning"
              | "default",
          },
        ]
      : []),
  ];

  const searchResultCards = useMemo(() => {
    const q = (globalSearchTerm || "").trim().toLowerCase();
    if (!q) return [];
    const cards: Array<{
      id: string;
      label: string;
      countText: string;
      icon: React.ElementType;
      targetTab: string;
    }> = [];
    if (canViewContacts) {
      const cnt = contacts.filter((c) => c.name.toLowerCase().includes(q)).length;
      cards.push({
        id: "contacts",
        label: "Cari / Müşteriler",
        countText: `${cnt} Eşleşen Cari`,
        icon: Users,
        targetTab: "contacts",
      });
    }
    if (canViewAnyInvoices) {
      const cnt = invoices.filter((i) => {
        if (i.type === "sales" && !canViewSalesInvoices) return false;
        if (i.type === "purchase" && !canViewPurchaseInvoices) return false;
        return (
          i.invoiceNumber.toLowerCase().includes(q) ||
          (canViewContacts && i.contactName.toLowerCase().includes(q))
        );
      }).length;
      cards.push({
        id: "invoices",
        label:
          canViewSalesInvoices && canViewPurchaseInvoices
            ? "Faturalar"
            : canViewSalesInvoices
            ? "Satış Faturaları"
            : "Gider Faturaları",
        countText: `${cnt} Eşleşen Fatura`,
        icon: FileText,
        targetTab: canViewSalesInvoices ? "invoices_sales" : "invoices_purchase",
      });
    }
    if (canViewTransactions) {
      const cnt = authorizedTransactions.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (canViewContacts && t.contactName && t.contactName.toLowerCase().includes(q))
      ).length;
      cards.push({
        id: "transactions",
        label: "Finansal İşlemler",
        countText: `${cnt} Eşleşen İşlem`,
        icon: Receipt,
        targetTab: "transactions",
      });
    }
    if (canViewProducts) {
      const cnt = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code && p.code.toLowerCase().includes(q))
      ).length;
      cards.push({
        id: "products",
        label: "Stok & Ürünler",
        countText: `${cnt} Eşleşen Ürün`,
        icon: Package,
        targetTab: "products_list",
      });
    }
    return cards;
  }, [
    globalSearchTerm,
    contacts,
    invoices,
    authorizedTransactions,
    products,
    canViewContacts,
    canViewAnyInvoices,
    canViewSalesInvoices,
    canViewPurchaseInvoices,
    canViewTransactions,
    canViewProducts,
  ]);

  const showCashFlowChart = canViewTransactions;
  const showOperationsSummary = canViewAnyInvoices || canViewProducts || canViewOrders;
  const showUpcomingDues =
    canViewSalesInvoices || canViewPurchaseInvoices || canViewCheques || canViewNotes;
  const showRecentTransactions = canViewTransactions;
  const showAccountsPanel = showCardLiquid;
  const showExchangeRates =
    showCardLiquid ||
    canViewTransactions ||
    canViewCheques ||
    canViewNotes ||
    canViewAnyInvoices ||
    canViewOrders ||
    canViewQuotes ||
    canViewContacts ||
    canViewEcommerce;
  const showRecentActivityPanel =
    canViewAnyInvoices || canViewTransactions || canViewContacts || canViewOrders;

  const isDashboardRestricted =
    !canViewCash ||
    !canViewBank ||
    !canViewCheques ||
    !canViewNotes ||
    !canViewTransactions ||
    !canViewContacts ||
    !canViewSalesInvoices ||
    !canViewPurchaseInvoices ||
    !canViewProducts ||
    !canViewOrders;

  const upcomingDuesHeading =
    canViewSalesInvoices && !canViewPurchaseInvoices && !canViewCheques && !canViewNotes
      ? "Vadesi Yaklaşan & Geciken Tahsilatlar"
      : !canViewSalesInvoices && canViewPurchaseInvoices && !canViewCheques && !canViewNotes
      ? "Vadesi Yaklaşan & Geciken Ödemeler"
      : "Vadesi Yaklaşan & Geciken Vadeler";

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* 1. ÜST KARŞILAMA VE ANA AKSİYONLAR */}
      <ModuleEntranceHeader
        id="dashboard-header"
        badge="İşletme & Çalışma Alanı"
        badgeIcon={<LayoutDashboard className="w-3 h-3 text-[#0f6bae]" />}
        title="Genel Bakış"
        description={
          hasAnyKpiCard
            ? "Yetkili olduğunuz modüllere ait göstergeler, vadeler ve çalışma özeti tek ekranda."
            : "Hesabınıza tanımlanmış çalışma modüllerine aşağıdan doğrudan erişebilirsiniz."
        }
        stats={headerStats}
        actions={
          canUseQuickAdd ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenQuickAdd}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-2xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Hızlı İşlem Ekle</span>
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Global Search Results Banner */}
      {Boolean(globalSearchTerm && globalSearchTerm.trim()) && searchResultCards.length > 0 && (
        <div className="bg-[#0b1c2d] text-white p-5 rounded-2xl shadow-md border border-[#1a2b3e] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#83b8ff]" />
              <h3 className="font-editorial text-base text-[#faf8ff]">
                "{globalSearchTerm}" için Arama Sonuçları Özet Görünümü
              </h3>
            </div>
            <span className="text-xs text-[#d9e8ff] bg-[#0f6bae]/40 px-2.5 py-1 rounded-lg border border-[#0f6bae]">
              Yetkili modüller filtrelendi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {searchResultCards.map((card) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => onSelectTab(card.targetTab)}
                  className="bg-[#131b2e]/90 hover:bg-[#0f6bae]/30 p-3.5 rounded-xl border border-[#283044] cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CardIcon className="w-5 h-5 text-[#83b8ff]" />
                    <div>
                      <div className="text-xs text-[#9daec3]">{card.label}</div>
                      <div className="text-sm font-semibold text-white font-mono tabular-nums">
                        {card.countText}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#83b8ff]" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ANA FİNANSAL KPI KARTLARI (Yalnızca Yetkili Olunan Modüller Gösterilir) */}
      {hasAnyKpiCard && (
        <div className={`grid ${kpiGridColsClass} gap-4`}>
          {/* KART 1: Nakit & Banka Varlığı */}
          {showCardLiquid && (
            <div
              onClick={() => onSelectTab("accounts")}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
              style={{ borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {liquidTitle}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center module-icon-container transition-transform">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                {formatCurrency(authorizedLiquidTotal)}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                {canViewCash && (
                  <span>
                    Kasa:{" "}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                      {formatCurrency(metrics.cashTotal)}
                    </strong>
                  </span>
                )}
                {canViewBank && (
                  <span>
                    Banka:{" "}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                      {formatCurrency(metrics.bankTotal)}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* KART 2: Alacaklar / Tahsil Bekleyen Satış Faturaları */}
          {showCardReceivables && (
            <div
              onClick={() =>
                onSelectTab(canViewContacts ? "contacts_debtors" : "invoices_sales")
              }
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
              style={{ borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {canViewContacts && canViewSalesInvoices
                    ? "Bekleyen Alacaklar"
                    : canViewContacts
                    ? "Cari Alacaklar"
                    : "Tahsil Bekleyen Faturalar"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center module-icon-container transition-transform">
                  <ArrowDownLeft className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
                {formatCurrency(
                  canViewContacts ? metrics.totalReceivables : metrics.unpaidSalesTotal
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {canViewSalesInvoices ? (
                  <>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {metrics.unpaidSalesCount} açık satış faturası
                    </span>
                    {metrics.overdueReceivables > 0 ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1 font-mono tabular-nums">
                        <AlertTriangle className="w-3 h-3" />
                        {formatCurrency(metrics.overdueReceivables)} gecikmede
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Vadesi geçen yok
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {metrics.debtorContactsCount} borçlu cari hesap
                    </span>
                    <span className="text-slate-500">Cari bakiye özeti</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* KART 3: Tedarikçi Borçları / Ödenecek Gider Faturaları */}
          {showCardPayables && (
            <div
              onClick={() =>
                onSelectTab(canViewPurchaseInvoices ? "invoices_purchase" : "contacts")
              }
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
              style={{ borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {canViewContacts && canViewPurchaseInvoices
                    ? "Tedarikçi Borçları"
                    : canViewContacts
                    ? "Tedarikçi Cari Borçları"
                    : "Ödenecek Gider Faturaları"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center module-icon-container transition-transform">
                  <ArrowUpRight className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums tracking-tight">
                {formatCurrency(
                  canViewContacts ? metrics.totalPayables : metrics.unpaidPurchaseTotal
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {canViewPurchaseInvoices ? (
                  <>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {metrics.unpaidPurchaseCount} açık gider faturası
                    </span>
                    {metrics.overduePayables > 0 ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3 h-3" />
                        {formatCurrency(metrics.overduePayables)} vadesi geçmiş
                      </span>
                    ) : (
                      <span className="text-slate-500">Planlanan vadede</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {metrics.creditorContactsCount} alacaklı cari hesap
                    </span>
                    <span className="text-slate-500">Cari bakiye özeti</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* KART 4: Portföydeki Çek / Senet */}
          {showCardPortfolio && (
            <div
              onClick={() => onSelectTab("accounts")}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
              style={{ borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {portfolioTitle}
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center module-icon-container transition-transform">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums tracking-tight">
                {formatCurrency(authorizedPortfolioTotal)}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{issuedPortfolioLabel}</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                  {formatCurrency(authorizedIssuedPortfolioTotal)}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kısıtlı Modül Tanımlı Kullanıcılar İçin Yetkili Modül Kısayolları */}
      {isDashboardRestricted && authorizedShortcuts.length > 0 && (
        <div
          className="rounded-2xl p-5 border shadow-2xs space-y-4 bg-white dark:bg-slate-900"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Yetkili Modülleriniz
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hesabınıza tanımlanmış aktif çalışma alanlarına doğrudan geçiş yapabilirsiniz.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {authorizedShortcuts.length} Modül
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {authorizedShortcuts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#0f6bae]/50 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-left transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0f6bae] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sadece Ana Sayfa Açık ve Hiçbir Alt Modül Tanımlanmamışsa Bilgi Kartı */}
      {authorizedShortcuts.length === 0 &&
        !hasAnyKpiCard &&
        !showCashFlowChart &&
        !showOperationsSummary && (
          <div
            className="rounded-2xl p-6 border shadow-2xs bg-white dark:bg-slate-900 text-center space-y-2"
            style={{ borderColor: theme.cardBorder }}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hesabınız İçin Henüz Ek Modül Tanımlanmamış
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Kullanıcı hesabınıza yalnızca Genel Bakış ekranı tanımlıdır. Ek çalışma modüllerine erişim yetkisi Admin veya Sistem Yöneticisi tarafından verilebilir.
            </p>
          </div>
        )}

      {/* 3. İKİNCİ KATMAN: GRAFİKLER & OPERASYON ÖZETİ */}
      {(showCashFlowChart || showOperationsSummary) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SOL: 6-12 Aylık Gelir vs Gider Trendi */}
          {showCashFlowChart && (
            <div
              className={`${
                showOperationsSummary ? "lg:col-span-2" : "lg:col-span-3"
              } relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs flex flex-col justify-between haze-module-entrance-bg`}
              style={{ borderColor: theme.cardBorder }}
            >
              <GeometricHoneycombBackground id="cashflow-trend-geom" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Nakit Akışı & Trend Analizi
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Aylık fiili gelir, tahsilat, masraf ve net operasyonel kâr seyri
                    </p>
                  </div>
                  <div className="inline-flex items-center bg-white/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setChartPeriod("6m")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        chartPeriod === "6m"
                          ? "bg-slate-900 text-white dark:bg-slate-700 shadow-2xs"
                          : "text-slate-500"
                      }`}
                    >
                      Son 6 Ay
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartPeriod("12m")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        chartPeriod === "12m"
                          ? "bg-slate-900 text-white dark:bg-slate-700 shadow-2xs"
                          : "text-slate-500"
                      }`}
                    >
                      Son 12 Ay
                    </button>
                  </div>
                </div>

                {/* Native High-Performance SVG Area Chart */}
                <div className="h-56 sm:h-72 w-full flex flex-col justify-between select-none">
                  {(() => {
                    const maxVal = Math.max(
                      1,
                      ...cashFlowChartData.map((d) => Math.max(d.gelir, d.gider))
                    );
                    const svgW = 600;
                    const svgH = 200;
                    const padX = 40;
                    const padY = 20;
                    const chartW = svgW - padX * 2;
                    const chartH = svgH - padY * 2;
                    const stepX =
                      cashFlowChartData.length > 1
                        ? chartW / (cashFlowChartData.length - 1)
                        : chartW;

                    const pointsIncome = cashFlowChartData.map((d, i) => {
                      const x = padX + i * stepX;
                      const y = padY + chartH - (d.gelir / maxVal) * chartH;
                      return { x, y, val: d.gelir, label: d.label };
                    });

                    const pointsExpense = cashFlowChartData.map((d, i) => {
                      const x = padX + i * stepX;
                      const y = padY + chartH - (d.gider / maxVal) * chartH;
                      return { x, y, val: d.gider, label: d.label };
                    });

                    const pathIncome = pointsIncome.reduce(
                      (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                      ""
                    );
                    const areaIncome = `${pathIncome} L ${
                      pointsIncome[pointsIncome.length - 1]?.x || 0
                    } ${padY + chartH} L ${pointsIncome[0]?.x || 0} ${padY + chartH} Z`;

                    const pathExpense = pointsExpense.reduce(
                      (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                      ""
                    );
                    const areaExpense = `${pathExpense} L ${
                      pointsExpense[pointsExpense.length - 1]?.x || 0
                    } ${padY + chartH} L ${pointsExpense[0]?.x || 0} ${padY + chartH} Z`;

                    return (
                      <div className="relative w-full h-full">
                        <svg
                          viewBox={`0 0 ${svgW} ${svgH}`}
                          className="w-full h-full overflow-visible"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="svgIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="svgExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                            const y = padY + chartH * (1 - r);
                            return (
                              <g key={idx}>
                                <line
                                  x1={padX}
                                  y1={y}
                                  x2={svgW - padX}
                                  y2={y}
                                  stroke="#e2e8f0"
                                  strokeDasharray="3 3"
                                  opacity="0.6"
                                />
                                <text
                                  x={padX - 8}
                                  y={y + 3}
                                  textAnchor="end"
                                  fontSize="9"
                                  fill="#94a3b8"
                                  className="font-mono"
                                >
                                  {r === 0
                                    ? "0"
                                    : maxVal * r >= 1000
                                    ? `${((maxVal * r) / 1000).toFixed(0)}k`
                                    : Math.round(maxVal * r)}
                                </text>
                              </g>
                            );
                          })}

                          <path d={areaIncome} fill="url(#svgIncomeGrad)" />
                          <path
                            d={pathIncome}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          <path d={areaExpense} fill="url(#svgExpenseGrad)" />
                          <path
                            d={pathExpense}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {pointsIncome.map((p, i) => (
                            <circle
                              key={`inc-${i}`}
                              cx={p.x}
                              cy={p.y}
                              r="3.5"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          ))}
                          {pointsExpense.map((p, i) => (
                            <circle
                              key={`exp-${i}`}
                              cx={p.x}
                              cy={p.y}
                              r="3"
                              fill="#f43f5e"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          ))}
                        </svg>

                        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-6 text-[11px] font-medium text-slate-500 pointer-events-none">
                          {cashFlowChartData.map((d, i) => (
                            <span key={i} className="text-center">
                              {d.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                      Toplam Gelir / Tahsilat
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-rose-500 inline-block"></span>
                      Toplam Gider / Masraf
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAĞ: İşletme Operasyon Özeti */}
          {showOperationsSummary && (
            <div
              className={`${
                showCashFlowChart ? "lg:col-span-1" : "lg:col-span-3"
              } relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs flex flex-col justify-between space-y-4 haze-module-entrance-bg`}
              style={{ borderColor: theme.cardBorder }}
            >
              <GeometricHoneycombBackground id="operations-summary-geom" />
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0f6bae]" />
                      İşletme Operasyon Özeti
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Yetkili operasyonel modüllere ait özet göstergeler
                  </p>
                </div>

                {canViewAnyInvoices && (
                  <>
                    <div className="h-44 w-full flex items-center justify-center relative">
                      {(() => {
                        const salesVal = canViewSalesInvoices ? invoiceBreakdown[0]?.value || 0 : 0;
                        const purchaseVal = canViewPurchaseInvoices
                          ? invoiceBreakdown[1]?.value || 0
                          : 0;
                        const totalInv = salesVal + purchaseVal;
                        const circumference = 2 * Math.PI * 46;

                        let trackStroke = "#e2e8f0";
                        let activeStroke = "#0ea5e9";
                        let activePct = 0;

                        if (canViewSalesInvoices && canViewPurchaseInvoices) {
                          if (totalInv > 0) {
                            trackStroke = "#f43f5e";
                            activeStroke = "#0ea5e9";
                            activePct = Math.round((salesVal / totalInv) * 100);
                          }
                        } else if (canViewSalesInvoices) {
                          activeStroke = "#0ea5e9";
                          activePct = salesVal > 0 ? 100 : 0;
                        } else if (canViewPurchaseInvoices) {
                          activeStroke = "#f43f5e";
                          activePct = purchaseVal > 0 ? 100 : 0;
                        }

                        const strokeDashoffset =
                          circumference - (activePct / 100) * circumference;

                        return (
                          <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
                              <circle
                                cx="55"
                                cy="55"
                                r="46"
                                stroke={trackStroke}
                                strokeWidth="12"
                                fill="transparent"
                                className="opacity-90"
                              />
                              {activePct > 0 && (
                                <circle
                                  cx="55"
                                  cy="55"
                                  r="46"
                                  stroke={activeStroke}
                                  strokeWidth="12"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                  fill="transparent"
                                  className="transition-all duration-700 ease-out"
                                />
                              )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Toplam
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                {formatCurrency(totalInv)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {canViewSalesInvoices && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span>
                          <span>
                            Satış:{" "}
                            <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
                              {formatCurrency(invoiceBreakdown[0]?.value || 0)}
                            </strong>
                          </span>
                        </div>
                      )}
                      {canViewPurchaseInvoices && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>
                          <span>
                            Alış:{" "}
                            <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
                              {formatCurrency(invoiceBreakdown[1]?.value || 0)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(canViewProducts || canViewOrders) && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                    {canViewProducts && (
                      <div
                        onClick={() => onSelectTab("products_list")}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/75 dark:bg-slate-800/75 border border-slate-200/60 dark:border-slate-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all backdrop-blur-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Kritik Stok Uyarısı
                            </span>
                            <p className="text-[11px] text-slate-400">
                              Tükenmek üzere olan ürünler
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          {metrics.lowStockCount} Ürün
                        </span>
                      </div>
                    )}

                    {canViewOrders && (
                      <div
                        onClick={() => onSelectTab("orders")}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/75 dark:bg-slate-800/75 border border-slate-200/60 dark:border-slate-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all backdrop-blur-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Açık Siparişler
                            </span>
                            <p className="text-[11px] text-slate-400">
                              Bekleyen & onaylanan sipariş
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                          {metrics.pendingOrdersCount} Sipariş
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ÜÇÜNCÜ KATMAN: VADESİ YAKLAŞANLAR / GEÇENLER & SON İŞLEMLER */}
      {(showUpcomingDues || showRecentTransactions) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showUpcomingDues && (
            <div
              className={`${
                showRecentTransactions ? "" : "lg:col-span-2"
              } relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs haze-module-entrance-bg`}
              style={{ borderColor: theme.cardBorder }}
            >
              <GeometricHoneycombBackground id="upcoming-dues-geom" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {upcomingDuesHeading}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Yetkili olduğunuz modüllere ait yaklaşan ve geciken vadeli evraklar
                    </p>
                  </div>
                  {canViewAnyInvoices && (
                    <button
                      onClick={() =>
                        onSelectTab(
                          canViewSalesInvoices ? "invoices_sales" : "invoices_purchase"
                        )
                      }
                      className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      Tüm Vadeler <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {upcomingActionItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                      <p className="text-xs font-medium">
                        Yakın tarihte vadesi geçen veya bekleyen evrak bulunmuyor.
                      </p>
                    </div>
                  ) : (
                    upcomingActionItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.type.includes("cheque") || item.type.includes("note")) {
                            onSelectTab("accounts");
                          } else if (item.type === "sales_invoice") {
                            onSelectTab("invoices_sales");
                          } else {
                            onSelectTab("invoices_purchase");
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 backdrop-blur-xs shadow-2xs ${
                          item.isOverdue
                            ? "border-rose-200/80 bg-rose-50/70 hover:bg-rose-50/90 dark:bg-rose-950/30"
                            : "border-slate-200/60 bg-white/80 hover:bg-slate-50 dark:bg-slate-800/75 dark:border-slate-700/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                              item.type === "sales_invoice"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.type === "purchase_invoice"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {item.type === "sales_invoice" ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : item.type === "purchase_invoice" ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800/50">
                          <div className="text-xs font-black font-mono tabular-nums text-slate-900 dark:text-white">
                            {formatCurrency(item.amount)}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {item.isOverdue ? (
                              <span className="font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-200 px-1.5 py-0.5 rounded font-mono tabular-nums">
                                {Math.abs(item.daysDiff)} gün gecikti
                              </span>
                            ) : item.daysDiff === 0 ? (
                              <span className="font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-200 px-1.5 py-0.5 rounded">
                                Bugün vadesi
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium font-mono tabular-nums">
                                {item.daysDiff} gün sonra ({formatDate(item.dueDate)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {showRecentTransactions && (
            <div
              className={`${
                showUpcomingDues ? "" : "lg:col-span-2"
              } relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs haze-module-entrance-bg`}
              style={{ borderColor: theme.cardBorder }}
            >
              <GeometricHoneycombBackground id="recent-transactions-geom" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#0f6bae]" />
                      Son Finansal Hareketler
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Yetkili olduğunuz hesaplara işlenen son gelir ve gider kayıtları
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectTab("transactions")}
                    className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    Tüm Fişler <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {recentTransactions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-medium">
                        Henüz kayıtlı bir finansal işlem bulunmuyor.
                      </p>
                    </div>
                  ) : (
                    recentTransactions.map((tx) => {
                      const isIncome = tx.type === "income" || tx.type === "collection";
                      const txTitle =
                        tx.description ||
                        (canViewContacts ? tx.contactName : undefined) ||
                        "İşlem";
                      return (
                        <div
                          key={tx.id}
                          onClick={() => onSelectTab("transactions")}
                          className="p-3 rounded-xl border border-slate-200/60 bg-white/80 hover:bg-slate-50 dark:bg-slate-800/75 dark:border-slate-700/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 backdrop-blur-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                                isIncome
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {txTitle}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                                {(canViewCash || canViewBank) && tx.accountName && (
                                  <>
                                    <span>{tx.accountName}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span className="font-mono tabular-nums">
                                  {formatDate(tx.date)}
                                </span>
                                {tx.category && (
                                  <>
                                    <span>•</span>
                                    <span className="bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                                      {tx.category}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800/50">
                            <div
                              className={`text-xs font-black font-mono tabular-nums ${
                                isIncome
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isIncome ? "+" : "-"}
                              {formatCurrency(tx.amount, tx.currency)}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {isIncome ? "Tahsilat / Giriş" : "Tediye / Çıkış"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4.5. ÇEK / SENET DURUM ÖZET RAPORU */}
      {(canViewCheques || canViewNotes) && (
        <ChequeNoteSummaryReport
          cheques={canViewCheques ? cheques : []}
          promissoryNotes={canViewNotes ? promissoryNotes : []}
          contacts={canViewContacts ? contacts : []}
          allowCheques={canViewCheques}
          allowNotes={canViewNotes}
          allowContacts={canViewContacts}
          onNavigateToPortfolio={() => onSelectTab("accounts")}
        />
      )}

      {/* 5. DÖRDÜNCÜ KATMAN: KASA/BANKA HESAPLARI & TCMB DÖVİZ KURLARI */}
      {(showAccountsPanel || showExchangeRates) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {showAccountsPanel && (
            <div
              className={`${
                showExchangeRates ? "lg:col-span-1" : "lg:col-span-3"
              } relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs flex flex-col justify-between haze-module-entrance-bg`}
              style={{ borderColor: theme.cardBorder }}
            >
              <GeometricHoneycombBackground id="accounts-balances-geom" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#0f6bae]" />
                      {accountsPanelTitle}
                    </h3>
                    {canViewCash && canViewBank && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold bg-white/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xs shrink-0 self-start sm:self-auto shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setActiveAccountType("all")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            activeAccountType === "all"
                              ? "bg-white dark:bg-slate-700 font-bold shadow-2xs text-slate-900 dark:text-white"
                              : "text-slate-500"
                          }`}
                        >
                          Tümü
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAccountType("cash")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            activeAccountType === "cash"
                              ? "bg-white dark:bg-slate-700 font-bold shadow-2xs text-slate-900 dark:text-white"
                              : "text-slate-500"
                          }`}
                        >
                          Kasa
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAccountType("bank")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            activeAccountType === "bank"
                              ? "bg-white dark:bg-slate-700 font-bold shadow-2xs text-slate-900 dark:text-white"
                              : "text-slate-500"
                          }`}
                        >
                          Banka
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Yetkili olduğunuz aktif hesapların güncel bakiyeleri
                  </p>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {filteredAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => onSelectTab("accounts")}
                        className="p-3 rounded-xl border border-slate-200/60 hover:border-blue-200 bg-white/80 hover:bg-blue-50/50 dark:bg-slate-800/75 dark:border-slate-700/60 backdrop-blur-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                            {acc.type === "cash" ? (
                              <Wallet className="w-4 h-4" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {acc.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {acc.bankName ? `${acc.bankName} • ` : ""}
                              {acc.currency || "TRY"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums text-xs font-black text-slate-900 dark:text-white shrink-0">
                          {formatCurrency(acc.balance, acc.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
                  <button
                    onClick={() => onSelectTab("accounts")}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-[#0f6bae] bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Hesapları Yönet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {showExchangeRates && (
            <div className={showAccountsPanel ? "lg:col-span-2" : "lg:col-span-3"}>
              <ExchangeRatesWidget compact={false} allowToggle={true} />
            </div>
          )}
        </div>
      )}

      {/* 6. BEŞİNCİ KATMAN: SON ETKİNLİKLER & İŞLEM GÜNLÜĞÜ */}
      {showRecentActivityPanel && (
        <div
          className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border shadow-2xs haze-module-entrance-bg"
          style={{ borderColor: theme.cardBorder }}
        >
          <GeometricHoneycombBackground id="recent-activity-panel-geom" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0f6bae]/10 text-[#0f6bae] dark:bg-[#0f6bae]/20 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Son Etkinlikler & İşlem Geçmişi
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Yetkili olduğunuz modüllerde gerçekleştirilen son işlemlerin kronolojik akışı
                    </p>
                  </div>
                </div>
              </div>
              {canViewTransactions && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onSelectTab("transactions")}
                    className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Tüm Finansal Hareketler <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">
                  Yetkili olduğunuz modüllerde henüz kayıtlı bir etkinlik bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentActivities.map((act) => {
                  let iconEl = <FileText className="w-4 h-4 text-blue-600" />;
                  let iconBg =
                    "bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
                  let badgeStyle =
                    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";

                  if (act.type === "collection") {
                    iconEl = <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
                    iconBg =
                      "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
                    badgeStyle =
                      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
                  } else if (act.type === "payment") {
                    iconEl = <ArrowUpRight className="w-4 h-4 text-rose-600" />;
                    iconBg =
                      "bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300";
                    badgeStyle =
                      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
                  } else if (act.type === "contact") {
                    iconEl = <Users className="w-4 h-4 text-indigo-600" />;
                    iconBg =
                      "bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300";
                    badgeStyle =
                      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800";
                  } else if (act.type === "order") {
                    iconEl = <ShoppingCart className="w-4 h-4 text-amber-600" />;
                    iconBg =
                      "bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
                    badgeStyle =
                      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
                  }

                  return (
                    <div
                      key={act.id}
                      onClick={() => onSelectTab(act.targetTab)}
                      className="p-3.5 rounded-xl border border-slate-200/60 bg-white/80 hover:bg-slate-50 dark:bg-slate-800/75 dark:border-slate-700/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs backdrop-blur-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconBg} transition-transform group-hover:scale-105`}
                        >
                          {iconEl}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {act.title}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyle}`}
                            >
                              {act.badgeText}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                            <span className="truncate">{act.description}</span>
                            <span>•</span>
                            <span className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400 font-mono tabular-nums">
                              <Clock className="w-3 h-3" />
                              {act.timeLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {act.amount !== undefined && (
                        <div className="text-right shrink-0">
                          <div
                            className={`text-xs font-black font-mono tabular-nums ${
                              act.type === "collection"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : act.type === "payment"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {act.type === "collection"
                              ? "+"
                              : act.type === "payment"
                              ? "-"
                              : ""}
                            {formatCurrency(act.amount, act.currency)}
                          </div>
                          <span className="text-[10px] text-slate-400 block">Tutar</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
