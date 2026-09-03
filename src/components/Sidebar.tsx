import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  Wallet,
  BarChart3,
  TrendingUp,
  Sparkles,
  Settings,
  Plus,
  Building2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Banknote,
  Building,
  FileCheck2,
  Stamp,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Package as PackageIcon,
  Boxes,
  Store,
  Warehouse as WarehouseIcon,
  MapPin,
  Sliders,
  UserCheck,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Truck,
  MessageSquare,
  X,
  Wrench,
  Laptop,
  ThermometerSnowflake,
} from "lucide-react";
import { CompanySettings } from "../types";
import { Logo } from "./Logo";
import { FinanceSubModule } from "./Accounts";
import { UserProfile } from "./AuthModal";

export type NavItem =
  | "dashboard"
  | "contacts"
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
  | "ai"
  | "company"
  | "company_profile"
  | "company_branches"
  | "company_warehouses"
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeFinanceSubTab = "kasa",
  onSelectFinanceSubTab,
  settings,
  onOpenQuickAdd,
  currentUser,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;
  const handleToggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  const [isFinanceExpanded, setIsFinanceExpanded] = useState(true);
  const [isInvoicesExpanded, setIsInvoicesExpanded] = useState(true);
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(true);

  const userEmail = currentUser?.email?.toLowerCase().trim() || "";
  const isAdmin =
    currentUser?.id === "nuT309AyQxQKddnAp1ZJjlSgBXt2" ||
    currentUser?.id === "usr_admin_001" ||
    currentUser?.role?.includes("Admin") ||
    userEmail === "ilyasyildirim@outlook.com.tr" ||
    userEmail === "ilyasylldrm@gmail.com" ||
    userEmail.includes("admin");

  const allNavItems = [
    ...(isAdmin
      ? [{ id: "admin" as NavItem, label: "Admin Yönetici Paneli", icon: ShieldAlert, badge: "Admin" }]
      : []),
    { id: "dashboard" as NavItem, label: "Ana Sayfa", icon: LayoutDashboard },
    { id: "company" as NavItem, label: "Firma Bilgileri", icon: Building2, hasSubItems: true },
    { id: "e_services" as NavItem, label: "E-İşlemler", icon: ShieldCheck, badge: "Resmi" },
    { id: "invoices" as NavItem, label: "E-Belgeler", icon: FileText, hasSubItems: true },
    { id: "orders_module" as NavItem, label: "Sipariş & Proforma", icon: ShoppingCart, hasSubItems: true },
    { id: "auto_service" as NavItem, label: "Oto Servis & Araç Bakım", icon: Wrench, badge: "Oto" },
    { id: "it_service" as NavItem, label: "Bilişim & BT Teknik Servis", icon: Laptop, badge: "BT" },
    { id: "appliance_service" as NavItem, label: "Ev Aletleri ve Klima", icon: ThermometerSnowflake, badge: "Klima" },
    { id: "contacts" as NavItem, label: "Cari Hesaplar", icon: Users },
    { id: "accounts" as NavItem, label: "Finans Yönetimi", icon: Wallet, hasSubItems: true },
    { id: "products" as NavItem, label: "Stoklar", icon: PackageIcon },
    { id: "products_costs" as NavItem, label: "Maliyetler", icon: TrendingUp },
    { id: "hr" as NavItem, label: "İnsan Kaynakları", icon: UserCheck },
    { id: "files" as NavItem, label: "Bulut Dosya Deposu", icon: HardDrive },
    { id: "reports" as NavItem, label: "Vergilendirme", icon: BarChart3 },
    { id: "ai" as NavItem, label: "AI Muavin Asistanı", icon: Sparkles, badge: "Canlı" },
    { id: "whatsapp" as NavItem, label: "WhatsApp Merkezi", icon: MessageSquare, badge: "Canlı" },
    { id: "settings" as NavItem, label: "Sistem Ayarları", icon: Settings },
  ];

  // Modül Kısıtlaması Kontrolü (Admin her zaman tüm modüllere erişebilir, normal kullanıcılara modül kısıtlaması uygulanır)
  const navItems = allNavItems.filter((item) => {
    if (item.id === "admin") return isAdmin;
    if (isAdmin) return true;
    if (!currentUser?.allowedModules || currentUser.allowedModules.length === 0) {
      return true; // Kısıtlama belirtilmemişse varsayılan olarak serbest
    }
    return currentUser.allowedModules.includes(item.id as any);
  });

  const companySubModules: { id: NavItem; label: string; icon: React.ElementType }[] = [
    { id: "company_profile", label: "Firma Profili & Adres", icon: Building },
    { id: "company_branches", label: "Şubeler", icon: Store },
    { id: "company_warehouses", label: "Depolar", icon: WarehouseIcon },
  ];

  const invoiceSubModules: { id: NavItem; label: string; icon: React.ElementType }[] = [
    { id: "invoices_sales", label: "Gelir Faturaları", icon: FileText },
    { id: "invoices_purchase", label: "Gider Faturaları", icon: FileText },
    { id: "e_documents_incoming", label: "Gelen e-Faturalar", icon: ArrowDownLeft },
    { id: "e_documents_outgoing", label: "Giden e-Faturalar", icon: ArrowUpRight },
    { id: "waybills_receipt", label: "Gelen e-İrsaliyeler", icon: ArrowDownLeft },
    { id: "waybills_dispatch", label: "Giden e-İrsaliyeler", icon: ArrowUpRight },
    { id: "waybills", label: "İrsaliye Oluştur", icon: FileText },
  ];

  const orderSubModules: { id: NavItem; label: string; icon: React.ElementType }[] = [
    { id: "orders", label: "Siparişler & Sipariş Oluştur", icon: ShoppingCart },
    { id: "quotes", label: "Proforma Faturalar", icon: FileSpreadsheet },
  ];

  const financeSubModules: { id: FinanceSubModule; label: string; icon: React.ElementType }[] = [
    { id: "kasa", label: "Kasa (Nakit)", icon: Banknote },
    { id: "banka", label: "Banka Hesapları", icon: Building },
    { id: "cek", label: "Çek Yönetimi", icon: FileCheck2 },
    { id: "senet", label: "Senet Yönetimi", icon: Stamp },
    { id: "virman", label: "Hesaplar Arası Virman", icon: ArrowRightLeft },
  ];

  const handleSelectTabWithMobileClose = (tab: NavItem) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = () => (
    <>
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between gap-2 min-h-[64px]">
        <div className="min-w-0 flex-1">
          <Logo size="md" />
          <p className="text-xs text-slate-500 font-medium truncate mt-1">
            {settings.companyName}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {handleToggleCollapse && (
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
              title="Menüyü Daralt (Yana Kapat)"
              aria-label="Menüyü Daralt"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="p-4">
        <button
          onClick={() => {
            onOpenQuickAdd();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full bg-[#8252F6] hover:bg-[#703EE5] active:scale-[0.98] text-white font-medium text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#EF7D2C]" />
          <span>Hızlı İşlem Ekle</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isOrderItem = item.id === "orders_module" || item.id === "orders";
          const isInvoiceItem = item.id === "invoices";
          const isFinanceItem = item.id === "accounts";
          const isCompanyItem = item.id === "company";
          const isProductItem = item.id === "products";

          const isActive = isOrderItem
            ? ["orders", "orders_module", "quotes"].includes(currentTab)
            : isInvoiceItem
            ? [
                "invoices",
                "invoices_sales",
                "invoices_purchase",
                "e_documents_incoming",
                "e_documents_outgoing",
                "waybills",
                "waybills_dispatch",
                "waybills_receipt",
              ].includes(currentTab)
            : isFinanceItem
            ? currentTab === "accounts"
            : isCompanyItem
            ? ["company", "company_profile", "company_branches", "company_warehouses", "company_e_services"].includes(currentTab)
            : isProductItem
            ? ["products", "products_list"].includes(currentTab)
            : currentTab === item.id;

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (isOrderItem) {
                    setIsOrdersExpanded((prev) => !prev);
                    if (!["orders", "orders_module", "quotes"].includes(currentTab)) {
                      handleSelectTabWithMobileClose("orders");
                    }
                  } else if (isInvoiceItem) {
                    setIsInvoicesExpanded((prev) => !prev);
                    if (
                      ![
                        "invoices",
                        "invoices_sales",
                        "invoices_purchase",
                        "e_documents_incoming",
                        "e_documents_outgoing",
                        "waybills",
                        "waybills_dispatch",
                        "waybills_receipt",
                      ].includes(currentTab)
                    ) {
                      handleSelectTabWithMobileClose("invoices_sales");
                    }
                  } else if (isFinanceItem) {
                    setIsFinanceExpanded((prev) => !prev);
                    if (currentTab !== "accounts") {
                      handleSelectTabWithMobileClose("accounts");
                    }
                  } else if (isCompanyItem) {
                    setIsCompanyExpanded((prev) => !prev);
                    if (!["company", "company_profile", "company_branches", "company_warehouses"].includes(currentTab)) {
                      handleSelectTabWithMobileClose("company_profile");
                    }
                  } else {
                    handleSelectTabWithMobileClose(item.id as NavItem);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#F3EFFF] text-[#8252F6] border border-[#E4D7FF] shadow-2xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#8252F6]" : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] font-medium bg-[#fff6ef] text-[#EF7D2C] px-1.5 py-0.5 rounded-full border border-[#fcdac2] animate-pulse">
                    {item.badge}
                  </span>
                ) : isOrderItem ? (
                  isOrdersExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                ) : isInvoiceItem ? (
                  isInvoicesExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                ) : isFinanceItem ? (
                  isFinanceExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                ) : isCompanyItem ? (
                  isCompanyExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-[#EF7D2C]" />
                )}
              </button>

              {/* Sub-modules for Sipariş & Proforma */}
              {isOrderItem && isOrdersExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 border-slate-100 ml-5">
                  {orderSubModules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = currentTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSubActive
                            ? "bg-[#8252F6] text-white shadow-2xs font-semibold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 ${
                            isSubActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-modules for Faturalar & İrsaliyeler */}
              {isInvoiceItem && isInvoicesExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 border-slate-100 ml-5">
                  {invoiceSubModules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = currentTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSubActive
                            ? "bg-[#8252F6] text-white shadow-2xs font-semibold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 ${
                            isSubActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-modules for Finans Yönetimi */}
              {isFinanceItem && isFinanceExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 border-slate-100 ml-5">
                  {financeSubModules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = isActive && activeFinanceSubTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onSelectTab("accounts");
                          if (onSelectFinanceSubTab) {
                            onSelectFinanceSubTab(sub.id);
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSubActive
                            ? "bg-[#8252F6] text-white shadow-2xs font-semibold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 ${
                            isSubActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-modules for Firma Bilgileri */}
              {isCompanyItem && isCompanyExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 border-purple-100 ml-5">
                  {companySubModules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = currentTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSubActive
                            ? "bg-[#8252F6] text-white shadow-2xs font-semibold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 ${
                            isSubActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Company Info Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Building2 className="w-4 h-4 text-[#8252F6] shrink-0" />
          <span className="font-medium text-slate-800 truncate">
            {settings.companyName}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex justify-between">
          <span>VKN: {settings.taxNumber}</span>
          <span className="text-emerald-600 font-medium">Bakiye Aktif</span>
        </div>
      </div>
    </>
  );

  const renderCollapsedContent = () => (
    <>
      {/* Brand Header (Collapsed) */}
      <div className="p-3 border-b border-slate-200 flex flex-col items-center justify-center gap-2 min-h-[64px] bg-slate-50/60">
        <button
          type="button"
          onClick={() => onSelectTab("dashboard")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          title={`Ana Sayfa - ${settings.companyName}`}
        >
          <Logo size="sm" showText={false} />
        </button>
        {handleToggleCollapse && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="p-1.5 rounded-lg text-purple-700 hover:text-purple-950 hover:bg-purple-100 transition-colors cursor-pointer border border-purple-200 shadow-2xs"
            title="Kenar Çubuğunu Genişlet (Yana Aç)"
            aria-label="Kenar Çubuğunu Genişlet"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Add Button (Collapsed) */}
      <div className="p-2.5 flex justify-center">
        <button
          type="button"
          onClick={() => onOpenQuickAdd()}
          className="w-11 h-11 bg-[#8252F6] hover:bg-[#703EE5] active:scale-95 text-white rounded-xl flex items-center justify-center shadow-xs transition-all cursor-pointer relative group"
          title="Hızlı İşlem Ekle"
          aria-label="Hızlı İşlem Ekle"
        >
          <Plus className="w-5 h-5 text-white" />
          {/* Floating Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
            Hızlı İşlem Ekle
          </div>
        </button>
      </div>

      {/* Navigation Links (Collapsed) */}
      <nav className="flex-1 px-2 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isOrderItem = item.id === "orders_module" || item.id === "orders";
          const isInvoiceItem = item.id === "invoices";
          const isFinanceItem = item.id === "accounts";
          const isCompanyItem = item.id === "company";
          const isProductItem = item.id === "products";

          const isActive = isOrderItem
            ? ["orders", "orders_module", "quotes"].includes(currentTab)
            : isInvoiceItem
            ? [
                "invoices",
                "invoices_sales",
                "invoices_purchase",
                "e_documents_incoming",
                "e_documents_outgoing",
                "waybills",
                "waybills_dispatch",
                "waybills_receipt",
              ].includes(currentTab)
            : isFinanceItem
            ? currentTab === "accounts"
            : isCompanyItem
            ? [
                "company",
                "company_profile",
                "company_branches",
                "company_warehouses",
                "company_e_services",
              ].includes(currentTab)
            : isProductItem
            ? ["products", "products_list"].includes(currentTab)
            : currentTab === item.id;

          const handleCollapsedClick = () => {
            if (isOrderItem) {
              onSelectTab("orders");
            } else if (isInvoiceItem) {
              onSelectTab("invoices_sales");
            } else if (isFinanceItem) {
              onSelectTab("accounts");
            } else if (isCompanyItem) {
              onSelectTab("company_profile");
            } else {
              onSelectTab(item.id as NavItem);
            }
          };

          const subList = isOrderItem
            ? orderSubModules
            : isInvoiceItem
            ? invoiceSubModules
            : isFinanceItem
            ? financeSubModules
            : isCompanyItem
            ? companySubModules
            : null;

          return (
            <div key={item.id} className="relative group flex justify-center">
              <button
                type="button"
                onClick={handleCollapsedClick}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-[#F3EFFF] text-[#8252F6] border border-[#E4D7FF] shadow-2xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[#8252F6]" : "text-slate-500 group-hover:text-slate-900"
                  }`}
                />
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF7D2C] ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Floating Sub-menu / Flyout on Hover */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col bg-slate-900 text-white rounded-xl shadow-2xl p-2 min-w-[200px] border border-slate-800 z-50 text-left">
                <div className="px-2.5 py-1 text-xs font-bold text-purple-300 border-b border-slate-800 flex items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-[#EF7D2C] text-white px-1.5 py-0.2 rounded font-semibold">
                      {item.badge}
                    </span>
                  )}
                </div>

                {subList ? (
                  <div className="mt-1 space-y-0.5">
                    {subList.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive =
                        isFinanceItem
                          ? isActive && activeFinanceSubTab === sub.id
                          : currentTab === sub.id;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isFinanceItem) {
                              onSelectTab("accounts");
                              if (onSelectFinanceSubTab) onSelectFinanceSubTab(sub.id);
                            } else {
                              onSelectTab(sub.id);
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isSubActive
                              ? "bg-[#8252F6] text-white font-bold"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-2 pt-1 text-[11px] text-slate-400 font-medium">
                    Modüle gitmek için tıklayın
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Company Info Footer (Collapsed) */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative group">
        <button
          type="button"
          onClick={() => onSelectTab("company_profile")}
          className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center text-[#8252F6] cursor-pointer transition-colors shadow-2xs"
          title={`${settings.companyName} (VKN: ${settings.taxNumber})`}
        >
          <Building2 className="w-5 h-5" />
        </button>
        {/* Floating Tooltip */}
        <div className="absolute left-full ml-3 bottom-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-2xl whitespace-nowrap z-50 border border-slate-800">
          <p className="font-bold text-slate-100">{settings.companyName}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">VKN: {settings.taxNumber}</p>
          <p className="text-[10px] text-emerald-400 font-semibold mt-1">● Bakiye Aktif</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex bg-white text-slate-800 flex-col shrink-0 h-screen sticky top-0 border-r border-slate-200 shadow-sm z-20 transition-all duration-300 ease-in-out relative ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Border edge toggle handle */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="hidden md:flex absolute -right-3 top-7 w-6 h-6 rounded-full bg-white border border-slate-300 hover:border-purple-400 shadow-md text-slate-600 hover:text-purple-700 items-center justify-center cursor-pointer transition-all z-30 hover:scale-110"
          title={collapsed ? "Kenar Çubuğunu Genişlet (Yana Aç)" : "Kenar Çubuğunu Daralt (Yana Kapat)"}
          aria-label={collapsed ? "Kenar Çubuğunu Genişlet" : "Kenar Çubuğunu Daralt"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {collapsed ? renderCollapsedContent() : renderNavContent()}
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sidebar Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white text-slate-800 flex flex-col z-50 shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderNavContent()}
      </aside>
    </>
  );
};
