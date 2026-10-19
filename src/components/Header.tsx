import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  LogIn,
  UserPlus,
  LogOut,
  X,
  Menu,
  ChevronRight,
  Building2,
  ChevronDown,
  Check,
  UploadCloud,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Account, CompanyItem, isAdminOrSysAdmin } from "../types";
import { UserProfile } from "./AuthModal";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "./Logo";
import {
  subscribeBrowserNav,
  navigateBrowserBack,
  navigateBrowserForward,
} from "../utils/browserNavigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
  accounts: Account[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onOpenQuickAdd: () => void;
  onSelectTab: (tab: any) => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: (mode: "login" | "register") => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  logoUrl?: string;
  onOpenGitHubPublish?: () => void;
  companies?: CompanyItem[];
  activeCompanyId?: string;
  onSelectCompany?: (id: string) => void;
  onOpenNewCompanyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  accounts,
  searchTerm,
  onSearchChange,
  onOpenQuickAdd,
  onSelectTab,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onToggleMobileMenu,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  logoUrl,
  onOpenGitHubPublish,
  companies = [],
  activeCompanyId,
  onSelectCompany,
  onOpenNewCompanyModal,
}) => {
  const { theme } = useTheme();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [navState, setNavState] = useState({ canGoBack: false, canGoForward: false });
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeBrowserNav((snap) => {
      setNavState({ canGoBack: snap.canGoBack, canGoForward: snap.canGoForward });
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  return (
    <header
      className="relative w-full box-border sticky top-0 z-30 transition-colors border-b shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 backdrop-blur-md haze-header-bg"
      style={{
        backgroundColor: theme.headerBg,
        borderColor: theme.headerBorder,
        color: theme.headerText,
        height: "123px",
        marginBottom: "0px",
        paddingLeft: "21px",
        paddingRight: "20px",
        marginRight: "0px",
      }}
    >
      {/* Background Decorator Container - clipped to header bounds */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Editorial Decorative Background Layers - Gradyan Ortada (Yumuşatılmış İnce Gradyan) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[30rem] sm:w-[38rem] h-full opacity-16 dark:opacity-10"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.08) 0%, rgba(15, 107, 174, 0.05) 35%, rgba(218, 226, 253, 0.1) 65%, transparent 85%)",
          }}
        />
        {/* Top Editorial Hairline Accent - Ortada yumuşatılmış ince gradyan */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] opacity-45"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.primaryColor || "#005289"} 30%, #38bdf8 50%, #0f6bae 70%, transparent 100%)`,
          }}
        />
      </div>

      {/* Title, Breadcrumb, Subtitle & Mobile Hamburger / Desktop Sidebar Toggle */}
      <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1 max-w-full">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 sm:p-2 rounded border shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0"
            style={{
              borderColor: theme.cardBorder,
              backgroundColor: theme.cardBg,
              color: theme.headerText,
            }}
            title="Ana Menüyü Aç / Kapat"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Logo in Header adhering to Haze Layout & Spacing */}
        <div
          className={`${isSidebarCollapsed ? "flex" : "md:hidden flex"} items-center shrink-0 pr-2.5 sm:pr-3 border-r cursor-pointer hover:opacity-85 transition-opacity`}
          style={{ borderColor: theme.headerBorder }}
          onClick={() => onSelectTab("dashboard")}
          title="E-MUAVİN Ana Sayfa"
        >
          <Logo
            size="sm"
            src={activeCompany?.logoUrl || logoUrl || "/logo.svg"}
            scale={activeCompany?.logoScale}
            variant={theme.headerBg !== "#ffffff" && theme.headerBg !== "#faf8ff" ? "light" : "default"}
            className="max-h-7 sm:max-h-8"
          />
        </div>

        {/* Browser History Back / Forward Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => navigateBrowserBack()}
            disabled={!navState.canGoBack}
            className="p-1.5 rounded-lg border shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              borderColor: theme.cardBorder,
              backgroundColor: theme.cardBg,
              color: theme.headerText,
            }}
            title="Geri Git (Tarayıcı Geri / Alt+Sol Ok)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateBrowserForward()}
            disabled={!navState.canGoForward}
            className="p-1.5 rounded-lg border shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              borderColor: theme.cardBorder,
              backgroundColor: theme.cardBg,
              color: theme.headerText,
            }}
            title="İleri Git (Tarayıcı İleri / Alt+Sağ Ok)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Title, Breadcrumb & Subtitle - No overlap */}
        <div className="flex flex-col justify-center min-w-0 flex-1 py-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium opacity-75 leading-none">
            <span className="font-semibold shrink-0" style={{ color: theme.primaryColor }}>E-MUAVİN</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
            <span className="font-semibold opacity-90 truncate">{title}</span>
          </div>
          <h1
            className="text-lg sm:text-xl lg:text-2xl font-editorial font-bold tracking-tight mt-1 leading-snug truncate"
            style={{ color: theme.headerText }}
            title={title}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Global Search & Action Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5 relative z-10 flex-wrap md:flex-nowrap shrink-0 max-w-full">
        {/* Search Bar */}
        <div className="relative w-full sm:w-44 md:w-52 lg:w-60 xl:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari, Fatura, Ürün ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-slate-900 placeholder-slate-400 text-xs rounded pl-9 pr-7 py-2 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0f6bae]/20"
            style={{
              backgroundColor: theme.pageBg,
              borderColor: theme.cardBorder,
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded transition-all"
              title="Aramayı Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>



        {/* Company Switcher Pill & Dropdown */}
        {companies.length > 0 && (
          <div className="relative" ref={companyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCompanyDropdownOpen((prev) => !prev)}
              className="rounded px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-all border shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
              title="Aktif Şirket / Şirket Değiştir"
            >
              <div className="w-6 h-6 rounded bg-[#eaedff] dark:bg-sky-950/60 text-[#0f6bae] flex items-center justify-center font-bold">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left max-w-[120px] sm:max-w-[160px]">
                <div className="text-[9px] uppercase font-bold text-slate-500 leading-none tracking-wider label-caps flex items-center gap-1">
                  <span>Aktif Şirket</span>
                  <span className="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 py-0.2 rounded font-mono">
                    {companies.length}
                  </span>
                </div>
                <div className="text-xs font-bold truncate mt-0.5" style={{ color: theme.primaryColor }}>
                  {activeCompany?.companyName || "Şirket"}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCompanyDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isCompanyDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0f6bae]" />
                    Kayıtlı Şirketler
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {companies.length} Şirket
                  </span>
                </div>

                <div className="py-1 max-h-56 overflow-y-auto space-y-1">
                  {companies.map((comp) => {
                    const isSelected = comp.id === (activeCompanyId || activeCompany?.id);
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          onSelectCompany?.(comp.id);
                          setIsCompanyDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-[#eaedff] dark:bg-sky-950/60 border border-[#c6cdff] dark:border-sky-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                            <span>{comp.companyName}</span>
                            {comp.isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                                Ana
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {comp.vkn ? `VKN: ${comp.vkn}` : comp.tckn ? `TCKN: ${comp.tckn}` : comp.taxNumber}
                          </div>
                          {comp.id !== "comp_default" && (
                            <span className="text-[9px] text-[#0f6bae] font-semibold block mt-0.5">
                              ✓ Boş & İzole Modüller
                            </span>
                          )}
                          {comp.loginUsername && (
                            <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1 mt-0.5">
                              🔑 Giriş: <strong>{comp.loginUsername}</strong>
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#0f6bae] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {onOpenNewCompanyModal && isAdminOrSysAdmin(currentUser) && (
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCompanyDropdownOpen(false);
                        onOpenNewCompanyModal();
                      }}
                      className="w-full py-2 px-3 bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yeni Şirket Ekle</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}



        {/* GitHub & Yayınla Button */}
        {onOpenGitHubPublish && isAdminOrSysAdmin(currentUser) && (
          <button
            type="button"
            onClick={onOpenGitHubPublish}
            className="text-slate-700 dark:text-slate-200 hover:text-slate-900 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs py-2 px-3 rounded flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98] border border-slate-300 dark:border-slate-700"
            title="GitHub Üzerinden Değişiklikleri Al, Gönder ve Yayınla"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline">Al, Gönder & Yayınla</span>
            <span className="lg:hidden">Yayınla</span>
          </button>
        )}

        {/* USER AUTHENTICATION BUTTONS / PROFILE STATE */}
        <div className="pl-1.5 sm:pl-2 border-l flex items-center gap-2 shrink-0" style={{ borderColor: theme.cardBorder }}>
          {currentUser ? (
            <div
              className="flex items-center gap-2 p-1 rounded border shadow-2xs"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="w-7 h-7 rounded overflow-hidden border shrink-0 bg-slate-100" style={{ borderColor: theme.cardBorder }}>
                <img
                  src={currentUser.selectedLogoUrl}
                  alt={currentUser.selectedLogoName}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left max-w-[120px] hidden sm:block">
                <div className="text-xs font-semibold truncate leading-tight" style={{ color: theme.textPrimary }}>
                  {currentUser.name}
                </div>
                <div className="text-[9px] font-semibold truncate" style={{ color: theme.primaryColor }}>
                  {currentUser.companyName}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                title="Sistemden Çıkış Yap"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuthModal("login")}
                className="text-white font-semibold text-xs py-2 px-3.5 rounded flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                <span>Kullanıcı Girişi</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
