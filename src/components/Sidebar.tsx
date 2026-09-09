import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Banknote,
  Handshake,
  Gavel,
  Contact,
  Receipt,
  Landmark,
  Store,
  PieChart,
  LifeBuoy,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  CookingPot,
  Wrench,
  UserCheck,
  HardDrive,
  Building2,
  X,
  Phone,
  Mail,
  CheckCircle2,
  Send,
  Building,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Truck,
  FileText,
  FileSpreadsheet,
  FileCheck2,
  Stamp,
  TrendingUp,
  CreditCard,
  Laptop,
  ThermometerSnowflake,
  Settings,
  Warehouse,
} from "lucide-react";
import { CompanySettings } from "../types";
import { FinanceSubModule } from "./Accounts";
import { UserProfile } from "./AuthModal";
import tallsoftLogo from "../assets/auth/tallsoft-muhasebe-logo.png";

export type NavItem =
  | "dashboard"
  | "production"
  | "sectors"
  | "contacts"
  | "contacts_debtors"
  | "contacts_reconciliation"
  | "contacts_risky"
  | "invoices"
  | "invoices_sales"
  | "invoices_purchase"
  | "e_documents_incoming"
  | "e_documents_outgoing"
  | "quotes"
  | "waybills"
  | "waybills_dispatch"
  | "waybills_receipt"
  | "quotes_and_slips"
  | "accounts"
  | "transactions"
  | "income_slips"
  | "expenses"
  | "products"
  | "products_list"
  | "products_costs"
  | "orders"
  | "orders_module"
  | "auto_service"
  | "it_service"
  | "appliance_service"
  | "hr"
  | "files"
  | "reports"
  | "reports_ledger"
  | "ai"
  | "company"
  | "company_profile"
  | "company_branches"
  | "company_warehouses"
  | "company_settings"
  | "company_e_services"
  | "e_services"
  | "whatsapp"
  | "settings"
  | "admin";

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  activeFinanceSubTab?: FinanceSubModule;
  onSelectFinanceSubTab?: (subTab: FinanceSubModule) => void;
  settings: CompanySettings;
  onOpenQuickAdd: () => void;
  currentUser?: UserProfile | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSupportModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeFinanceSubTab,
  onSelectFinanceSubTab,
  settings,
  currentUser,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onOpenSupportModal,
}) => {
  // Accordion open/close states
  const [isCariExpanded, setIsCariExpanded] = useState(true);
  const [isInvoicesExpanded, setIsInvoicesExpanded] = useState(false);
  const [isFinanceExpanded, setIsFinanceExpanded] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isSectorsExpanded, setIsSectorsExpanded] = useState(false);
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(false);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);

  // Local support modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  const userEmail = currentUser?.email?.toLowerCase().trim() || "";
  const isAdmin =
    currentUser?.id === "nuT309AyQxQKddnAp1ZJjlSgBXt2" ||
    currentUser?.id === "usr_admin_001" ||
    currentUser?.role?.includes("Admin") ||
    userEmail === "ilyasyildirim@outlook.com.tr" ||
    userEmail === "ilyasylldrm@gmail.com" ||
    userEmail.includes("admin");

  // Auto-expand the active section when currentTab changes
  useEffect(() => {
    if (
      [
        "contacts",
        "contacts_debtors",
        "contacts_reconciliation",
        "contacts_risky",
      ].includes(currentTab)
    ) {
      setIsCariExpanded(true);
    } else if (
      [
        "invoices",
        "invoices_sales",
        "invoices_purchase",
        "e_documents_incoming",
        "e_documents_outgoing",
        "waybills",
        "quotes",
      ].includes(currentTab)
    ) {
      setIsInvoicesExpanded(true);
    } else if (
      ["accounts", "transactions", "expenses", "income_slips"].includes(
        currentTab
      )
    ) {
      setIsFinanceExpanded(true);
    } else if (
      ["products", "products_list", "products_costs", "orders"].includes(
        currentTab
      )
    ) {
      setIsProductsExpanded(true);
    } else if (
      [
        "production",
        "sectors",
        "auto_service",
        "it_service",
        "appliance_service",
      ].includes(currentTab)
    ) {
      setIsSectorsExpanded(true);
    } else if (
      [
        "company",
        "company_profile",
        "company_branches",
        "company_warehouses",
        "company_settings",
        "settings",
      ].includes(currentTab)
    ) {
      setIsCompanyExpanded(true);
    } else if (["reports", "reports_ledger"].includes(currentTab)) {
      setIsReportsExpanded(true);
    }
  }, [currentTab]);

  const handleSupportClick = () => {
    if (onOpenSupportModal) {
      onOpenSupportModal();
    } else {
      setSupportModalOpen(true);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleNavClick = (tab: NavItem) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleFinanceNavClick = (
    tab: NavItem,
    subTab?: FinanceSubModule
  ) => {
    onSelectTab(tab);
    if (subTab && onSelectFinanceSubTab) {
      onSelectFinanceSubTab(subTab);
    }
    if (onCloseMobile) onCloseMobile();
  };

  // Active state detectors
  const isDashboardActive = currentTab === "dashboard";
  const isContactsSectionActive = [
    "contacts",
    "contacts_debtors",
    "contacts_reconciliation",
    "contacts_risky",
  ].includes(currentTab);
  const isInvoicesSectionActive = [
    "invoices",
    "invoices_sales",
    "invoices_purchase",
    "e_documents_incoming",
    "e_documents_outgoing",
    "waybills",
    "quotes",
  ].includes(currentTab);
  const isFinanceSectionActive = [
    "accounts",
    "transactions",
    "expenses",
    "income_slips",
  ].includes(currentTab);
  const isProductsSectionActive = [
    "products",
    "products_list",
    "products_costs",
    "orders",
  ].includes(currentTab);
  const isReportsSectionActive = [
    "reports",
    "reports_ledger",
  ].includes(currentTab);
  const isSectorsSectionActive = [
    "production",
    "sectors",
    "auto_service",
    "it_service",
    "appliance_service",
  ].includes(currentTab);
  const isCompanySectionActive = [
    "company",
    "company_profile",
    "company_branches",
    "company_warehouses",
    "company_settings",
    "settings",
  ].includes(currentTab);

  const renderNavContent = () => (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar px-3 py-2 text-[13px] font-sans">
      <div className="space-y-4">
        {/* ========================================================= */}
        {/* SECTION 1: GENEL (GENERAL)                                */}
        {/* ========================================================= */}
        <div>
          <button
            type="button"
            onClick={() => handleNavClick("dashboard")}
            className="w-full text-left px-3 pb-2 text-[10px] font-bold text-slate-400 hover:text-[#351F62] tracking-wider uppercase select-none transition-colors cursor-pointer flex items-center justify-between group"
            title="Genel Bakışa Git"
          >
            <span>GENEL</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-1">
            {/* 1. Dashboard (Ana Sayfa) */}
            <button
              type="button"
              onClick={() => handleNavClick("dashboard")}
              className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                (isDashboardActive
                  ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid
                  className={"w-4 h-4 shrink-0 " +
                    (isDashboardActive ? "text-[#351F62]" : "text-slate-500")}
                />
                <span>Dashboard</span>
              </div>
            </button>

            {/* 2. Cari takip (Accordion) */}
            <div className="space-y-1">
              <div
                onClick={() => {
                  setIsCariExpanded(true);
                  handleNavClick("contacts");
                }}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (isContactsSectionActive
                    ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
              >
                <div className="flex items-center gap-3">
                  <Banknote className={"w-4 h-4 shrink-0 " + (isContactsSectionActive ? "text-[#351F62]" : "text-slate-500")} />
                  <span>Cari takip</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCariExpanded((prev) => !prev);
                  }}
                  className="p-1 hover:bg-slate-300/40 rounded-lg transition-colors cursor-pointer"
                  title={isCariExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
                >
                  {isCariExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Sub-items under Cari takip */}
              {isCariExpanded && (
                <div className="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 my-1">
                  {/* Alacaklar ve Borçlar */}
                  <button
                    type="button"
                    onClick={() => handleNavClick("contacts_debtors")}
                    className={"w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer " +
                      (currentTab === "contacts_debtors"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span className="truncate">Alacaklar ve Borçlar</span>
                  </button>

                  {/* Mutabakatlar */}
                  <button
                    type="button"
                    onClick={() => handleNavClick("contacts_reconciliation")}
                    className={"w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer " +
                      (currentTab === "contacts_reconciliation"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Handshake className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span className="truncate">Mutabakatlar</span>
                  </button>

                  {/* Takibe Düşenler */}
                  <button
                    type="button"
                    onClick={() => handleNavClick("contacts_risky")}
                    className={"w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer " +
                      (currentTab === "contacts_risky"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Gavel className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span className="truncate">Takibe Düşenler</span>
                  </button>

                  {/* Tüm Cariler */}
                  <button
                    type="button"
                    onClick={() => handleNavClick("contacts")}
                    className={"w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer " +
                      (currentTab === "contacts"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Contact className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">Tüm Cariler</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Fatura Yönetimi (Accordion) */}
            <div className="space-y-1">
              <div
                onClick={() => {
                  setIsInvoicesExpanded(true);
                  handleNavClick("invoices");
                }}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (isInvoicesSectionActive
                    ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
              >
                <div className="flex items-center gap-3">
                  <Receipt className={"w-4 h-4 shrink-0 " + (isInvoicesSectionActive ? "text-[#351F62]" : "text-slate-500")} />
                  <span>Fatura Yönetimi</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInvoicesExpanded((prev) => !prev);
                  }}
                  className="p-1 hover:bg-slate-300/40 rounded-lg transition-colors cursor-pointer"
                  title={isInvoicesExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
                >
                  {isInvoicesExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {isInvoicesExpanded && (
                <div className="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 my-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick("invoices")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "invoices"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Receipt className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Tüm Faturalar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("invoices_sales")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "invoices_sales"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Satış (Gelir) Faturaları</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("invoices_purchase")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "invoices_purchase"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Alış (Gider) Faturaları</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("e_documents_incoming")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "e_documents_incoming"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>Gelen e-Faturalar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("e_documents_outgoing")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "e_documents_outgoing"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                    <span>Giden e-Faturalar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("waybills")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "waybills"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Truck className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>İrsaliyeler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("quotes")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "quotes"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Teklifler & Proforma</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Finans Yönetimi Accordion */}
            <div className="space-y-1">
              <div
                onClick={() => {
                  setIsFinanceExpanded(true);
                  handleFinanceNavClick("accounts", "kasa");
                }}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (isFinanceSectionActive
                    ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
              >
                <div className="flex items-center gap-3">
                  <Landmark className={"w-4 h-4 shrink-0 " + (isFinanceSectionActive ? "text-[#351F62]" : "text-slate-500")} />
                  <span>Finans Yönetimi</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFinanceExpanded((prev) => !prev);
                  }}
                  className="p-1 hover:bg-slate-300/40 rounded-lg transition-colors cursor-pointer"
                  title={isFinanceExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
                >
                  {isFinanceExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {isFinanceExpanded && (
                <div className="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 my-1">
                  <button
                    type="button"
                    onClick={() => handleFinanceNavClick("accounts", "kasa")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "accounts" && activeFinanceSubTab === "kasa"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Banknote className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Kasa (Nakit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinanceNavClick("accounts", "banka")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "accounts" && activeFinanceSubTab === "banka"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Building className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>Banka Hesapları</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinanceNavClick("accounts", "cek")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "accounts" && activeFinanceSubTab === "cek"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                    <span>Çek Yönetimi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinanceNavClick("accounts", "senet")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "accounts" && activeFinanceSubTab === "senet"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Stamp className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Senet Yönetimi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("transactions")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "transactions"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Kasa/Banka Hareketleri</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("expenses")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "expenses"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Giderler & Harcamalar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("income_slips")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "income_slips"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Gelir Fişleri</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Stok & Envanter (Accordion) */}
            <div className="space-y-1">
              <div
                onClick={() => {
                  setIsProductsExpanded(true);
                  handleNavClick("products");
                }}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (isProductsSectionActive
                    ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
              >
                <div className="flex items-center gap-3">
                  <Store className={"w-4 h-4 shrink-0 " + (isProductsSectionActive ? "text-[#351F62]" : "text-slate-500")} />
                  <span>Stok & Envanter</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProductsExpanded((prev) => !prev);
                  }}
                  className="p-1 hover:bg-slate-300/40 rounded-lg transition-colors cursor-pointer"
                  title={isProductsExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
                >
                  {isProductsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {isProductsExpanded && (
                <div className="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 my-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick("products")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "products" || currentTab === "products_list"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Boxes className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Ürünler & Hizmetler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("products_costs")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "products_costs"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <TrendingUp className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>Stok Maliyet Analizi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("orders")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "orders"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Siparişler & Takip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("company_warehouses")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "company_warehouses"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Warehouse className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                    <span>Depo Yönetimi</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Vergilendirmeler & Raporlar (Accordion) */}
            <div className="space-y-1">
              <div
                onClick={() => {
                  setIsReportsExpanded(true);
                  handleNavClick("reports");
                }}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (isReportsSectionActive
                    ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
              >
                <div className="flex items-center gap-3">
                  <PieChart className={"w-4 h-4 shrink-0 " + (isReportsSectionActive ? "text-[#351F62]" : "text-slate-500")} />
                  <span>Vergilendirmeler & Raporlar</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReportsExpanded((prev) => !prev);
                  }}
                  className="p-1 hover:bg-slate-300/40 rounded-lg transition-colors cursor-pointer"
                  title={isReportsExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
                >
                  {isReportsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {isReportsExpanded && (
                <div className="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 my-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick("reports")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "reports"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <PieChart className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                    <span>Mali Raporlar & Analizler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("reports_ledger")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "reports_ledger"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>KDV Beyannamesi & Mizan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: OPERASYON & SEKTÖREL ÇÖZÜMLER                  */}
        {/* ========================================================= */}
        <div>
          <button
            type="button"
            onClick={() => handleNavClick("production")}
            className="w-full text-left px-3 pb-2 text-[10px] font-bold text-slate-400 hover:text-[#351F62] tracking-wider uppercase select-none transition-colors cursor-pointer flex items-center justify-between group"
            title="Operasyon & Sektörel Sayfalara Git"
          >
            <span>OPERASYON & SEKTÖREL</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-1">
            {/* Üretim Modülü */}
            <button
              type="button"
              onClick={() => handleNavClick("production")}
              className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                (currentTab === "production"
                  ? "bg-[#F0EBFA] text-[#351F62] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
            >
              <div className="flex items-center gap-3">
                <CookingPot className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Üretim (Reçeteler)</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                Yemek
              </span>
            </button>

            {/* Sektörel Servisler Accordion */}
            <div className="space-y-1">
              <div
                onClick={() => {
                  setIsSectorsExpanded(true);
                  handleNavClick("sectors");
                }}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (isSectorsSectionActive
                    ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
              >
                <div className="flex items-center gap-3">
                  <Wrench className={"w-4 h-4 shrink-0 " + (isSectorsSectionActive ? "text-[#351F62]" : "text-slate-500")} />
                  <span>Sektörel Servisler</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSectorsExpanded((prev) => !prev);
                  }}
                  className="p-1 hover:bg-slate-300/40 rounded-lg transition-colors cursor-pointer"
                  title={isSectorsExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
                >
                  {isSectorsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {isSectorsExpanded && (
                <div className="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 my-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick("auto_service")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "auto_service"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Wrench className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>Oto Servis & Bakım</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("it_service")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "it_service"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Laptop className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span>Bilişim & BT Servisi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("appliance_service")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "appliance_service"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <ThermometerSnowflake className="w-3.5 h-3.5 shrink-0 text-cyan-600" />
                    <span>Ev Aletleri & Klima</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("sectors")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "sectors"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Tüm Sektörler</span>
                  </button>
                </div>
              )}
            </div>

            {/* İnsan Kaynakları */}
            <button
              type="button"
              onClick={() => handleNavClick("hr")}
              className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                (currentTab === "hr"
                  ? "bg-[#F0EBFA] text-[#351F62] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 shrink-0 text-slate-500" />
                <span>İnsan Kaynakları & Bordro</span>
              </div>
            </button>

            {/* Bulut Dosya Deposu */}
            <button
              type="button"
              onClick={() => handleNavClick("files")}
              className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                (currentTab === "files"
                  ? "bg-[#F0EBFA] text-[#351F62] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 shrink-0 text-slate-500" />
                <span>Bulut Dosya Deposu</span>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: ENTEGRASYON & ZEKA                             */}
        {/* ========================================================= */}
        <div>
          <button
            type="button"
            onClick={() => handleNavClick("ai")}
            className="w-full text-left px-3 pb-2 text-[10px] font-bold text-slate-400 hover:text-[#351F62] tracking-wider uppercase select-none transition-colors cursor-pointer flex items-center justify-between group"
            title="Entegrasyon & AI Sayfalarına Git"
          >
            <span>ENTEGRASYON & ZEKA</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-1">
            {/* AI Muavin */}
            <button
              type="button"
              onClick={() => handleNavClick("ai")}
              className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                (currentTab === "ai"
                  ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 shrink-0 text-purple-600" />
                <span>AI Mali Muavin Asistanı</span>
              </div>
              <span className="text-[10px] bg-purple-100 text-[#351F62] px-2 py-0.5 rounded-full font-bold">
                AI
              </span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handleNavClick("whatsapp")}
              className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                (currentTab === "whatsapp"
                  ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>WhatsApp Merkezi</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Canlı
              </span>
            </button>

            {/* E-İşlemler */}
            <button
              type="button"
              onClick={() => handleNavClick("e_services")}
              className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                (currentTab === "e_services"
                  ? "bg-[#F0EBFA] text-[#351F62] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
                <span>E-İşlemler & Kontör</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                Resmi
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: SİSTEM & YÖNETİM                               */}
        {/* ========================================================= */}
        <div>
          <button
            type="button"
            onClick={() => handleNavClick("company_profile")}
            className="w-full text-left px-3 pb-2 text-[10px] font-bold text-slate-400 hover:text-[#351F62] tracking-wider uppercase select-none transition-colors cursor-pointer flex items-center justify-between group"
            title="Sistem & Firma Ayarlarına Git"
          >
            <span>SİSTEM & YÖNETİM</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-1">
            {/* Firma Yönetimi Accordion */}
            <div className="space-y-1">
              <div
                onClick={() => {
                  setIsCompanyExpanded(true);
                  handleNavClick("company_profile");
                }}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (isCompanySectionActive
                    ? "bg-[#F0EBFA] text-[#351F62] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
              >
                <div className="flex items-center gap-3">
                  <Building2 className={"w-4 h-4 shrink-0 " + (isCompanySectionActive ? "text-[#351F62]" : "text-slate-500")} />
                  <span>Firma & Ayarlar</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCompanyExpanded((prev) => !prev);
                  }}
                  className="p-1 hover:bg-slate-300/40 rounded-lg transition-colors cursor-pointer"
                  title={isCompanyExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
                >
                  {isCompanyExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {isCompanyExpanded && (
                <div className="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 my-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick("company_profile")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "company_profile" || currentTab === "company"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Building className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Firma Profili & Adres</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("company_branches")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "company_branches"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Store className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Şubeler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("company_warehouses")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "company_warehouses"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Warehouse className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Depolar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("settings")}
                    className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer " +
                      (currentTab === "settings" || currentTab === "company_settings"
                        ? "bg-[#F0EBFA] text-[#351F62] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium")}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Sistem Ayarları</span>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Dashboard */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick("admin")}
                className={"w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all cursor-pointer " +
                  (currentTab === "admin"
                    ? "bg-rose-50 text-rose-700 font-bold border border-rose-200"
                    : "text-rose-600 hover:bg-rose-50/70")}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Admin Paneli</span>
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                  Yetkili
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 5: SUPPORT                                        */}
        {/* ========================================================= */}
        <div>
          <button
            type="button"
            onClick={handleSupportClick}
            className="w-full text-left px-3 pb-2 text-[10px] font-bold text-slate-400 hover:text-[#351F62] tracking-wider uppercase select-none transition-colors cursor-pointer flex items-center justify-between group"
            title="Destek Talebi Aç"
          >
            <span>SUPPORT</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-1">
            <button
              type="button"
              onClick={handleSupportClick}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LifeBuoy className="w-4 h-4 shrink-0 text-slate-500" />
                <span>Destek talebi</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Company Info Card (Clickable!) */}
      <div className="pt-3 border-t border-slate-200/70">
        <button
          type="button"
          onClick={() => handleNavClick("company_profile")}
          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer group"
          title="Firma Bilgilerini Görüntüle"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="sidebar-company-name font-semibold text-slate-800 text-xs truncate group-hover:text-[#351F62]">
              {settings.companyName || "Tall Soft Muhasebe"}
            </p>
            <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#351F62] shrink-0" />
          </div>
          <p className="sidebar-company-sub text-[11px] text-slate-400 font-mono tracking-wide mt-0.5">VKN: {settings.taxNumber || "-"}</p>
        </button>
      </div>
    </div>
  );

  const renderCollapsedContent = () => (
    <div className="flex-1 flex flex-col justify-between items-center py-4 text-slate-600">
      <div className="space-y-2.5 w-full flex flex-col items-center">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-purple-50 text-[#351F62] transition-all cursor-pointer mb-1"
            title="Menüyü Genişlet"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectTab("dashboard")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isDashboardActive
              ? "bg-[#F0EBFA] text-[#351F62]"
              : "hover:bg-slate-200/50 text-slate-500")}
          title="Dashboard"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("contacts")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isContactsSectionActive
              ? "bg-[#F0EBFA] text-[#351F62]"
              : "hover:bg-slate-200/50 text-slate-500")}
          title="Cari Takip"
        >
          <Banknote className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("invoices")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isInvoicesSectionActive
              ? "bg-[#F0EBFA] text-[#351F62]"
              : "hover:bg-slate-200/50 text-slate-500")}
          title="Fatura Yönetimi"
        >
          <Receipt className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectTab("accounts");
            if (onSelectFinanceSubTab) onSelectFinanceSubTab("kasa");
          }}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isFinanceSectionActive
              ? "bg-[#F0EBFA] text-[#351F62]"
              : "hover:bg-slate-200/50 text-slate-500")}
          title="Finans Yönetimi"
        >
          <Landmark className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("products")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isProductsSectionActive
              ? "bg-[#F0EBFA] text-[#351F62]"
              : "hover:bg-slate-200/50 text-slate-500")}
          title="Stok & Envanter"
        >
          <Store className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("reports")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isReportsSectionActive
              ? "bg-[#F0EBFA] text-[#351F62]"
              : "hover:bg-slate-200/50 text-slate-500")}
          title="Vergilendirmeler & Raporlar"
        >
          <PieChart className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("production")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (currentTab === "production" ? "bg-[#F0EBFA] text-[#351F62]" : "hover:bg-slate-200/50 text-amber-600")}
          title="Üretim (Reçeteler)"
        >
          <CookingPot className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("sectors")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isSectorsSectionActive ? "bg-[#F0EBFA] text-[#351F62]" : "hover:bg-slate-200/50 text-blue-600")}
          title="Sektörel Servisler"
        >
          <Wrench className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("hr")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (currentTab === "hr" ? "bg-[#F0EBFA] text-[#351F62]" : "hover:bg-slate-200/50 text-slate-500")}
          title="İnsan Kaynakları & Bordro"
        >
          <UserCheck className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("files")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (currentTab === "files" ? "bg-[#F0EBFA] text-[#351F62]" : "hover:bg-slate-200/50 text-slate-500")}
          title="Bulut Dosya Deposu"
        >
          <HardDrive className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("ai")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (currentTab === "ai" ? "bg-purple-100 text-[#351F62]" : "hover:bg-purple-50 text-purple-600")}
          title="AI Mali Muavin"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("whatsapp")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (currentTab === "whatsapp" ? "bg-emerald-100 text-emerald-800" : "hover:bg-emerald-50 text-emerald-600")}
          title="WhatsApp Merkezi"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("e_services")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (currentTab === "e_services" ? "bg-blue-100 text-blue-800" : "hover:bg-blue-50 text-blue-600")}
          title="E-İşlemler & Kontör"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("company_profile")}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
            (isCompanySectionActive ? "bg-[#F0EBFA] text-[#351F62]" : "hover:bg-slate-200/50 text-slate-500")}
          title="Firma & Ayarlar"
        >
          <Building2 className="w-5 h-5" />
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => onSelectTab("admin")}
            className={"w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer " +
              (currentTab === "admin" ? "bg-rose-100 text-rose-800" : "hover:bg-rose-50 text-rose-600")}
            title="Admin Paneli"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-full flex flex-col items-center pt-2 border-t border-slate-200/60">
        <button
          type="button"
          onClick={handleSupportClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-200/50 text-slate-500 transition-all cursor-pointer"
          title="Destek Talebi"
        >
          <LifeBuoy className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={"hidden md:flex flex-col shrink-0 bg-[#F4F5F9] transition-all duration-300 relative select-none " +
          (isCollapsed ? "w-16" : "w-56 lg:w-60")}
        style={{ height: "calc(100vh - 65px)" }}
      >
        {isCollapsed ? renderCollapsedContent() : renderNavContent()}
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={"fixed inset-y-0 left-0 w-72 bg-[#F4F5F9] z-50 shadow-2xl md:hidden transition-transform duration-300 ease-in-out flex flex-col " +
          (isMobileOpen ? "translate-x-0" : "-translate-x-full")}
      >
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <img
            src={tallsoftLogo}
            alt="Tall Soft"
            className="h-8 w-auto object-contain"
          />
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavContent()}
      </aside>

      {/* SUPPORT MODAL (Destek talebi) */}
      {supportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#351F62] flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Tall Soft Destek Talebi
                  </h3>
                  <p className="text-xs text-slate-500">
                    7/24 Teknik & Muhasebe Danışma Hattı
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSupportModalOpen(false);
                  setTicketSent(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ticketSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">
                  Talebiniz Alındı!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Talebiniz{" "}
                  <span className="font-bold text-slate-800">
                    #TS-{Math.floor(10000 + Math.random() * 90000)}
                  </span>{" "}
                  numarasıyla kaydedilmiştir. Destek ekibimiz en kısa sürede
                  sizinle iletişime geçecektir.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSupportModalOpen(false);
                    setTicketSent(false);
                  }}
                  style={{ backgroundColor: "#351F62" }}
                  className="mt-4 px-6 py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="tel:08508400000"
                    className="p-3 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-200 rounded-2xl flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#351F62] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400">
                        Telefon Destek
                      </p>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#351F62] truncate">
                        0850 840 00 00
                      </p>
                    </div>
                  </a>

                  <a
                    href="mailto:destek@tallsoft.com.tr"
                    className="p-3 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-200 rounded-2xl flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#351F62] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400">
                        E-Posta
                      </p>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#351F62] truncate">
                        destek@tallsoft.com.tr
                      </p>
                    </div>
                  </a>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Konu Başlığı
                    </label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Örn: Fatura gönderimi hakkında bilgi"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mesajınız / Talep Açıklaması
                    </label>
                    <textarea
                      rows={3}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Sorunuzu veya talebinizi detaylıca belirtin..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!ticketSubject && !ticketMessage) return;
                      setTicketSent(true);
                    }}
                    style={{ backgroundColor: "#351F62" }}
                    className="w-full py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4 text-purple-200" />
                    <span>Destek Talebini İlet</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
