import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  Wallet,
  BarChart3,
  TrendingUp,
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
  CookingPot,
  Layers,
  HardHat,
  ExternalLink,
} from "lucide-react";
import { CompanySettings, ConstructionProject } from "../types";
import { Logo } from "./Logo";
import { FinanceSubModule } from "./Accounts";
import { UserProfile } from "./AuthModal";
import { useTheme } from "../context/ThemeContext";

export type NavItem =
  | "dashboard"
  | "production"
  | "sectors"
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
  | "fixed_assets"
  | "orders"
  | "orders_module"
  | "auto_service"
  | "it_service"
  | "appliance_service"
  | "construction_costing"
  | "hr"
  | "files"
  | "reports"
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
  onSaveSettings?: (settings: CompanySettings) => void;
  constructionProjects?: ConstructionProject[];
  selectedConstructionProjectId?: string | null;
  onSelectConstructionProject?: (projectId: string) => void;
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
  onSaveSettings,
  constructionProjects = [],
  selectedConstructionProjectId,
  onSelectConstructionProject,
}) => {
  const { theme } = useTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;
  const handleToggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  const [isFinanceExpanded, setIsFinanceExpanded] = useState(true);
  const [isInvoicesExpanded, setIsInvoicesExpanded] = useState(true);
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(true);
  const [isConstructionExpanded, setIsConstructionExpanded] = useState(true);

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
    { id: "production" as NavItem, label: "Üretim", icon: CookingPot, badge: "Yemek" },
    { id: "sectors" as NavItem, label: "Sektörler", icon: Layers },
    { id: "auto_service" as NavItem, label: "Oto Servis & Araç Bakım", icon: Wrench, badge: "Oto" },
    { id: "it_service" as NavItem, label: "Bilişim & BT Teknik Servis", icon: Laptop, badge: "BT" },
    { id: "appliance_service" as NavItem, label: "Ev Aletleri ve Klima", icon: ThermometerSnowflake, badge: "Klima" },
    { id: "construction_costing" as NavItem, label: "İnşaat Maliyetlendirme", icon: HardHat, badge: "İnşaat" },
    { id: "contacts" as NavItem, label: "Cari Hesaplar", icon: Users },
    { id: "accounts" as NavItem, label: "Finans Yönetimi", icon: Wallet, hasSubItems: true },
    { id: "products" as NavItem, label: "Stoklar", icon: PackageIcon },
    { id: "fixed_assets" as NavItem, label: "Demirbaşlar", icon: Boxes, badge: "VUK" },
    { id: "hr" as NavItem, label: "İnsan Kaynakları", icon: UserCheck },
    { id: "files" as NavItem, label: "Bulut Dosya Deposu", icon: HardDrive },
    { id: "reports" as NavItem, label: "Vergilendirme", icon: BarChart3 },
    { id: "whatsapp" as NavItem, label: "WhatsApp Merkezi", icon: MessageSquare, badge: "Canlı" },
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
    { id: "company_settings", label: "Sistem Ayarları", icon: Settings },
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
      <div
        className="px-4 py-3.5 border-b flex items-center justify-between gap-2 min-h-[72px] md:h-[72px]"
        style={{ borderColor: theme.sidebarBorder }}
      >
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <Logo
            size="lg"
            src={settings.logoUrl || "/logo.svg"}
            variant={theme.sidebarBg !== "#ffffff" ? "light" : "default"}
            className="w-[200px] h-[50px] object-contain"
            imageClassName="ml-[11px] mt-[11px]"
            imageStyle={{ marginLeft: "11px", marginTop: "11px" }}
          />
          {settings.companyName && (
            <p className="text-[11px] font-medium truncate mt-1 opacity-75 ml-[21px]" style={{ color: theme.sidebarText, marginLeft: "21px" }}>
              {settings.companyName}
            </p>
          )}
        </div>
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

      {/* Quick Add Button */}
      <div className="p-4">
        <button
          onClick={() => {
            onOpenQuickAdd();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full active:scale-[0.98] text-white font-medium text-sm py-2.5 px-4 rounded-md flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer hover:opacity-90"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Plus className="w-4 h-4 text-white" />
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
          const isConstructionItem = item.id === "construction_costing";

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
            ? ["company", "company_profile", "company_branches", "company_warehouses", "company_settings", "settings", "company_e_services"].includes(currentTab)
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
                    if (!["company", "company_profile", "company_branches", "company_warehouses", "company_settings", "settings"].includes(currentTab)) {
                      handleSelectTabWithMobileClose("company_profile");
                    }
                  } else if (isConstructionItem) {
                    setIsConstructionExpanded((prev) => !prev);
                    handleSelectTabWithMobileClose("construction_costing");
                  } else {
                    handleSelectTabWithMobileClose(item.id as NavItem);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-sm font-medium cursor-pointer sidebar-nav-item ${
                  isActive
                    ? "active shadow-2xs font-semibold"
                    : ""
                }`}
                style={
                  isActive
                    ? { backgroundColor: theme.sidebarActiveBg, color: theme.sidebarActiveText }
                    : { color: theme.sidebarText }
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="w-4 h-4 shrink-0 transition-transform"
                    style={{ color: isActive ? theme.sidebarActiveText : undefined }}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] font-medium bg-[#eaedff] text-[#0f6bae] px-1.5 py-0.5 rounded border border-[#c6cdff]">
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
                ) : isConstructionItem ? (
                  isConstructionExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                )}
              </button>

              {/* Sub-modules for Sipariş & Proforma */}
              {isOrderItem && isOrdersExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 ml-5" style={{ borderColor: theme.sidebarBorder }}>
                  {orderSubModules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = currentTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer sidebar-subnav-item ${
                          isSubActive
                            ? "active shadow-2xs font-semibold"
                            : ""
                        }`}
                        style={
                          isSubActive
                            ? { backgroundColor: theme.sidebarActiveBg, color: theme.sidebarActiveText }
                            : { color: theme.sidebarText }
                        }
                      >
                        <SubIcon
                          className="w-3.5 h-3.5 transition-transform"
                          style={{ color: isSubActive ? theme.sidebarActiveText : undefined, opacity: isSubActive ? 1 : 0.7 }}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-modules for Faturalar & İrsaliyeler */}
              {isInvoiceItem && isInvoicesExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 ml-5" style={{ borderColor: theme.sidebarBorder }}>
                  {invoiceSubModules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = currentTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer sidebar-subnav-item ${
                          isSubActive
                            ? "active shadow-2xs font-semibold"
                            : ""
                        }`}
                        style={
                          isSubActive
                            ? { backgroundColor: theme.sidebarActiveBg, color: theme.sidebarActiveText }
                            : { color: theme.sidebarText }
                        }
                      >
                        <SubIcon
                          className="w-3.5 h-3.5 transition-transform"
                          style={{ color: isSubActive ? theme.sidebarActiveText : undefined, opacity: isSubActive ? 1 : 0.7 }}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-modules for Finans Yönetimi */}
              {isFinanceItem && isFinanceExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 ml-5" style={{ borderColor: theme.sidebarBorder }}>
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
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer sidebar-subnav-item ${
                          isSubActive
                            ? "active shadow-2xs font-semibold"
                            : ""
                        }`}
                        style={
                          isSubActive
                            ? { backgroundColor: theme.sidebarActiveBg, color: theme.sidebarActiveText }
                            : { color: theme.sidebarText }
                        }
                      >
                        <SubIcon
                          className="w-3.5 h-3.5 transition-transform"
                          style={{ color: isSubActive ? theme.sidebarActiveText : undefined, opacity: isSubActive ? 1 : 0.7 }}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-modules for Firma Bilgileri */}
              {isCompanyItem && isCompanyExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 ml-5" style={{ borderColor: theme.sidebarBorder }}>
                  {companySubModules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = currentTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer sidebar-subnav-item ${
                          isSubActive
                            ? "active shadow-2xs font-semibold"
                            : ""
                        }`}
                        style={
                          isSubActive
                            ? { backgroundColor: theme.sidebarActiveBg, color: theme.sidebarActiveText }
                            : { color: theme.sidebarText }
                        }
                      >
                        <SubIcon
                          className="w-3.5 h-3.5 transition-transform"
                          style={{ color: isSubActive ? theme.sidebarActiveText : undefined, opacity: isSubActive ? 1 : 0.7 }}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-modules for İnşaat Maliyetlendirme (Şantiyeler Alt Modülleri) */}
              {isConstructionItem && isConstructionExpanded && (
                <div className="pl-6 space-y-1 my-1 border-l-2 ml-5" style={{ borderColor: theme.sidebarBorder }}>
                  {constructionProjects && constructionProjects.length > 0 ? (
                    constructionProjects.map((proj) => {
                      const isProjActive =
                        currentTab === "construction_costing" &&
                        selectedConstructionProjectId === proj.id;

                      return (
                        <button
                          key={proj.id}
                          onClick={() => {
                            if (currentTab !== "construction_costing") {
                              onSelectTab("construction_costing");
                            }
                            if (onSelectConstructionProject) {
                              onSelectConstructionProject(proj.id);
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer sidebar-subnav-item transition-all text-left ${
                            isProjActive
                              ? "active shadow-2xs font-semibold"
                              : ""
                          }`}
                          style={
                            isProjActive
                              ? { backgroundColor: theme.sidebarActiveBg, color: theme.sidebarActiveText }
                              : { color: theme.sidebarText }
                          }
                          title={`${proj.projectName} (${proj.projectCode})`}
                        >
                          <span
                            className="w-4 h-4 rounded text-3xs font-bold flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: isProjActive ? theme.primaryColor : "rgba(245, 158, 11, 0.2)",
                              color: isProjActive ? "#fff" : "#d97706",
                            }}
                          >
                            {proj.projectType === "residential" ? "K" : proj.projectType === "commercial" ? "T" : "P"}
                          </span>
                          <span className="truncate flex-1">{proj.projectName}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-1.5 text-2xs text-slate-400 italic">
                      Henüz şantiye eklenmedi
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </nav>

      {/* Company Info Footer */}
      <div
        className="p-4 border-t text-xs"
        style={{ borderColor: theme.sidebarBorder, color: theme.sidebarText }}
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          <Building2 className="w-4 h-4 shrink-0" style={{ color: theme.primaryColor }} />
          <span className="font-medium truncate" style={{ color: theme.sidebarText }}>
            {settings.companyName}
          </span>
        </div>
        <div className="text-[11px] flex justify-between opacity-80">
          <span>VKN: {settings.taxNumber}</span>
          <span className="text-emerald-500 font-medium">Bakiye Aktif</span>
        </div>
      </div>
    </>
  );

  const renderCollapsedContent = () => (
    <>
      {/* Brand Header (Collapsed) */}
      <div
        className="px-2 py-3.5 border-b flex flex-col items-center justify-center gap-1.5 min-h-[72px] md:h-[72px]"
        style={{ borderColor: theme.sidebarBorder }}
      >
        <button
          type="button"
          onClick={() => onSelectTab("dashboard")}
          className="cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center p-1"
          title={`Ana Sayfa - ${settings.companyName}`}
        >
          <Logo
            size="md"
            showText={false}
            src={settings.logoUrl || "/favicon.svg"}
            variant={theme.sidebarBg !== "#ffffff" ? "light" : "default"}
          />
        </button>
        {handleToggleCollapse && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="p-1.5 rounded-lg transition-colors cursor-pointer border shadow-2xs hover:opacity-80"
            style={{
              color: theme.primaryColor,
              borderColor: `${theme.primaryColor}30`,
              backgroundColor: `${theme.primaryColor}10`,
            }}
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
          className="w-11 h-11 active:scale-95 text-white rounded-xl flex items-center justify-center shadow-xs transition-all cursor-pointer relative group"
          style={{ backgroundColor: theme.primaryColor }}
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
          const isConstructionItem = item.id === "construction_costing";

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
                "company_settings",
                "settings",
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
            : isConstructionItem && constructionProjects && constructionProjects.length > 0
            ? constructionProjects.map((proj) => ({
                id: proj.id as any,
                label: proj.projectName,
                icon: HardHat,
                isProject: true,
              }))
            : null;

          return (
            <div key={item.id} className="relative group flex justify-center">
              <button
                type="button"
                onClick={handleCollapsedClick}
                className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer relative sidebar-nav-item ${
                  isActive
                    ? "active shadow-2xs font-semibold"
                    : ""
                }`}
                style={
                  isActive
                    ? { backgroundColor: theme.sidebarActiveBg, color: theme.sidebarActiveText }
                    : { color: theme.sidebarText }
                }
                title={item.label}
                aria-label={item.label}
              >
                <Icon
                  className="w-5 h-5 transition-transform"
                  style={{ color: isActive ? theme.sidebarActiveText : undefined }}
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
                    {subList.map((sub: any) => {
                      const SubIcon = sub.icon;
                      const isSubActive =
                        isFinanceItem
                          ? isActive && activeFinanceSubTab === sub.id
                          : isConstructionItem
                          ? currentTab === "construction_costing" && selectedConstructionProjectId === sub.id
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
                            } else if (isConstructionItem) {
                              onSelectTab("construction_costing");
                              if (onSelectConstructionProject) onSelectConstructionProject(sub.id);
                            } else {
                              onSelectTab(sub.id);
                            }
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left hover:bg-slate-800"
                          style={
                            isSubActive
                              ? { backgroundColor: theme.primaryColor, color: "#ffffff", fontWeight: 700 }
                              : { color: "#cbd5e1" }
                          }
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
      <div
        className="p-3 border-t flex flex-col items-center justify-center relative group"
        style={{ borderColor: theme.sidebarBorder }}
      >
        <button
          type="button"
          onClick={() => onSelectTab("company_profile")}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
          style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
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
      {/* Desktop Sidebar - Sabit Genişlik (Kayma ve daralma kaldırıldı) */}
      <aside
        className="hidden md:flex flex-col shrink-0 w-64 h-screen sticky top-0 shadow-2xs z-20"
        style={{
          backgroundColor: theme.sidebarBg,
          color: theme.sidebarText,
          borderColor: theme.sidebarBorder,
          borderRightWidth: "1px",
        }}
      >
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
        className={`fixed inset-y-0 left-0 w-72 flex flex-col z-50 shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: theme.sidebarBg,
          color: theme.sidebarText,
          borderColor: theme.sidebarBorder,
          borderRightWidth: "1px",
        }}
      >
        {renderNavContent()}
      </aside>
    </>
  );
};
