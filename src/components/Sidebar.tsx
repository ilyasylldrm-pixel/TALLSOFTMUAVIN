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
  ChevronDown,
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
  X,
  Factory,
  Cpu,
  Layers,
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
  | "production"
  | "production_boms"
  | "production_routings"
  | "production_workstations"
  | "production_work_orders"
  | "production_subcontract"
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
}) => {
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  const [isProductionExpanded, setIsProductionExpanded] = useState(true);
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
    { id: "production" as NavItem, label: "Üretim & MRP", icon: Factory, hasSubItems: true, badge: "MES" },
    { id: "contacts" as NavItem, label: "Cari Hesaplar", icon: Users },
    { id: "accounts" as NavItem, label: "Finans Yönetimi", icon: Wallet, hasSubItems: true },
    { id: "products" as NavItem, label: "Stoklar", icon: PackageIcon },
    { id: "products_costs" as NavItem, label: "Maliyetler", icon: TrendingUp },
    { id: "hr" as NavItem, label: "İnsan Kaynakları", icon: UserCheck },
    { id: "files" as NavItem, label: "Bulut Dosya Deposu", icon: HardDrive },
    { id: "reports" as NavItem, label: "Vergilendirme", icon: BarChart3 },
    { id: "ai" as NavItem, label: "AI Muavin Asistanı", icon: Sparkles, badge: "Canlı" },
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
    { id: "invoices_sales", label: "Gelir Faturası & Fişleri", icon: FileText },
    { id: "invoices_purchase", label: "Gider Faturası & Fişleri", icon: FileText },
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

  const productionSubModules: { id: NavItem; label: string; icon: React.ElementType }[] = [
    { id: "production", label: "Üretim Özeti & KPI", icon: LayoutDashboard },
    { id: "production_boms", label: "Ürün Reçeteleri (BOM)", icon: Boxes },
    { id: "production_routings", label: "Operasyon & Rota", icon: TrendingUp },
    { id: "production_workstations", label: "İş İstasyonları / CNC", icon: Cpu },
    { id: "production_work_orders", label: "İş Emirleri & Takip", icon: Layers },
    { id: "production_subcontract", label: "Fason Takibi", icon: Truck },
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
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <Logo size="md" />
          <p className="text-xs text-slate-500 font-medium truncate mt-1">
            {settings.companyName}
          </p>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
          const isProductionItem = item.id === "production";
          const isInvoiceItem = item.id === "invoices";
          const isFinanceItem = item.id === "accounts";
          const isCompanyItem = item.id === "company";
          const isProductItem = item.id === "products";

          const isActive = isOrderItem
            ? ["orders", "orders_module", "quotes"].includes(currentTab)
            : isProductionItem
            ? [
                "production",
                "production_boms",
                "production_routings",
                "production_workstations",
                "production_work_orders",
                "production_subcontract",
              ].includes(currentTab)
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
                  } else if (isProductionItem) {
                    setIsProductionExpanded((prev) => !prev);
                    if (
                      ![
                        "production",
                        "production_boms",
                        "production_routings",
                        "production_workstations",
                        "production_work_orders",
                        "production_subcontract",
                      ].includes(currentTab)
                    ) {
                      handleSelectTabWithMobileClose("production");
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
                ) : isProductionItem ? (
                  isProductionExpanded ? (
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

              {/* Sub-modules for Üretim & MRP */}
              {isProductionItem && isProductionExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 border-slate-100 ml-5">
                  {productionSubModules.map((sub) => {
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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white text-slate-800 flex-col shrink-0 h-screen sticky top-0 border-r border-slate-200 shadow-sm z-20">
        {renderNavContent()}
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
