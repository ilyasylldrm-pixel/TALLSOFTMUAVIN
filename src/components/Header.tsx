import React from "react";
import {
  Search,
  Wallet,
  Plus,
  LogIn,
  UserPlus,
  LogOut,
  X,
  Menu,
  ChevronRight,
  UploadCloud,
} from "lucide-react";
import { Account } from "../types";
import { UserProfile } from "./AuthModal";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "./Logo";

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
}) => {
  const { theme } = useTheme();

  const totalTlBalance = accounts
    .filter((a) => a.currency === "TRY")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <header
      className="relative px-4 sm:px-6 sticky top-0 z-30 transition-colors border-b shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 backdrop-blur-md min-h-[72px] md:h-[72px] haze-header-bg overflow-hidden"
      style={{
        backgroundColor: theme.headerBg,
        borderColor: theme.headerBorder,
        color: theme.headerText,
      }}
    >
      {/* Editorial Decorative Background Layers - Gradyan Ortada (Yumuşatılmış İnce Gradyan) */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 w-[30rem] sm:w-[38rem] h-full opacity-16 dark:opacity-10"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.08) 0%, rgba(15, 107, 174, 0.05) 35%, rgba(218, 226, 253, 0.1) 65%, transparent 85%)",
        }}
        aria-hidden="true"
      />
      {/* Top Editorial Hairline Accent - Ortada yumuşatılmış ince gradyan */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-45"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${theme.primaryColor || "#005289"} 30%, #38bdf8 50%, #0f6bae 70%, transparent 100%)`,
        }}
      />

      {/* Title, Breadcrumb & Mobile Hamburger / Desktop Sidebar Toggle */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-3.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded border shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0"
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
          className={`${isSidebarCollapsed ? "flex" : "md:hidden flex"} items-center shrink-0 pr-3 border-r cursor-pointer hover:opacity-85 transition-opacity`}
          style={{ borderColor: theme.headerBorder }}
          onClick={() => onSelectTab("dashboard")}
          title="E-MUAVİN Ana Sayfa"
        >
          <Logo
            size="sm"
            src={logoUrl || "/logo.svg"}
            variant={theme.headerBg !== "#ffffff" && theme.headerBg !== "#faf8ff" ? "light" : "default"}
            className="max-h-8"
          />
        </div>

        {/* Title and Clean Breadcrumb */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium opacity-75">
            <span className="font-semibold" style={{ color: theme.primaryColor }}>E-MUAVİN</span>
            <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
            <span className="font-semibold opacity-90 truncate">{title}</span>
          </div>
          <h2
            className="text-xl sm:text-2xl font-editorial font-semibold tracking-tight mt-0.5 leading-tight truncate"
            style={{ color: theme.headerText }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Global Search & Action Bar */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 relative z-10">
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
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

        {/* Total Cash Balance Pill */}
        <div
          onClick={() => onSelectTab("accounts")}
          className="rounded px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all border shadow-2xs hover:opacity-90"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
          title="Toplam Kasa ve Banka Bakiyesi"
        >
          <div className="w-6 h-6 rounded bg-[#ecfdf5] text-[#0d7f56] flex items-center justify-center font-bold">
            <Wallet className="w-3.5 h-3.5 text-[#0d7f56]" />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-500 leading-none tracking-wider label-caps">
              Nakit Bakiye
            </div>
            <div className="text-xs font-semibold text-[#0d7f56] mt-0.5 font-mono tabular-nums">
              ₺{totalTlBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* GitHub & Yayınla Button */}
        {onOpenGitHubPublish && (
          <button
            type="button"
            onClick={onOpenGitHubPublish}
            className="text-slate-700 dark:text-slate-200 hover:text-slate-900 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs py-2 px-3 rounded flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98] border border-slate-300 dark:border-slate-700"
            title="Projeyi GitHub'a Gönder ve Canlıya Yayınla"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline">Yayınla & Senkronize Et</span>
            <span className="lg:hidden">Yayınla</span>
          </button>
        )}

        {/* New Transaction Button */}
        <button
          onClick={onOpenQuickAdd}
          className="text-white font-semibold text-xs py-2 px-3.5 rounded flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98] hover:opacity-90"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Plus className="w-3.5 h-3.5 font-bold" />
          <span>İşlem Ekle</span>
        </button>

        {/* USER AUTHENTICATION BUTTONS / PROFILE STATE */}
        <div className="pl-2 border-l flex items-center gap-2" style={{ borderColor: theme.cardBorder }}>
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
