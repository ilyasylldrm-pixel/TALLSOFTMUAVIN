import React from "react";
import {
  Search,
  Sparkles,
  Wallet,
  Plus,
  LogIn,
  UserPlus,
  LogOut,
  X,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { Account } from "../types";
import { UserProfile } from "./AuthModal";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  accounts: Account[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onOpenAiModal: () => void;
  onOpenQuickAdd: () => void;
  onSelectTab: (tab: any) => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: (mode: "login" | "register") => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  accounts,
  searchTerm,
  onSearchChange,
  onOpenAiModal,
  onOpenQuickAdd,
  onSelectTab,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onToggleMobileMenu,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}) => {
  const { theme } = useTheme();

  const totalTlBalance = accounts
    .filter((a) => a.currency === "TRY")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <header
      className="relative px-4 sm:px-6 py-2.5 sticky top-0 z-30 transition-colors border-b shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 backdrop-blur-md"
      style={{
        backgroundColor: theme.headerBg,
        borderColor: theme.headerBorder,
        color: theme.headerText,
      }}
    >
      {/* Title, Breadcrumb & Mobile Hamburger / Desktop Sidebar Toggle */}
      <div className="relative z-10 flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border shadow-2xs cursor-pointer transition-all active:scale-95"
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
        {onToggleSidebarCollapse && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className="hidden md:flex p-2 rounded-xl border shadow-2xs cursor-pointer transition-all active:scale-95 items-center justify-center hover:opacity-80"
            style={{
              borderColor: theme.cardBorder,
              backgroundColor: theme.cardBg,
              color: theme.headerText,
            }}
            title={isSidebarCollapsed ? "Kenar Çubuğunu Genişlet" : "Kenar Çubuğunu Daralt"}
            aria-label="Kenar Çubuğunu Aç / Kapat"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Title and Clean Breadcrumb */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-60">
            <span>Caris</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold opacity-90">{title}</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5" style={{ color: theme.headerText }}>
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
            className="w-full text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-7 py-2 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            style={{
              backgroundColor: theme.pageBg,
              borderColor: theme.cardBorder,
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded-md transition-all"
              title="Aramayı Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Total Cash Balance Pill */}
        <div
          onClick={() => onSelectTab("accounts")}
          className="rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all border shadow-2xs hover:opacity-90"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
          title="Toplam Kasa ve Banka Bakiyesi"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-500 leading-none tracking-wider">
              Nakit Bakiye
            </div>
            <div className="text-xs font-black text-emerald-600 mt-0.5 font-mono">
              ₺{totalTlBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* AI Assistant Trigger Button */}
        <button
          onClick={onOpenAiModal}
          className="font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all border hover:opacity-90"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
            color: theme.primaryColor,
          }}
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: theme.primaryColor }} />
          <span>AI Muavin</span>
        </button>

        {/* New Transaction Button */}
        <button
          onClick={onOpenQuickAdd}
          className="text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98] hover:opacity-90"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Plus className="w-3.5 h-3.5 font-bold" />
          <span>İşlem Ekle</span>
        </button>

        {/* USER AUTHENTICATION BUTTONS / PROFILE STATE */}
        <div className="pl-2 border-l flex items-center gap-2" style={{ borderColor: theme.cardBorder }}>
          {currentUser ? (
            <div
              className="flex items-center gap-2 p-1 rounded-xl border shadow-2xs"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden border shrink-0 bg-slate-100" style={{ borderColor: theme.cardBorder }}>
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
                <div className="text-xs font-black truncate leading-tight" style={{ color: theme.textPrimary }}>
                  {currentUser.name}
                </div>
                <div className="text-[9px] font-semibold truncate" style={{ color: theme.primaryColor }}>
                  {currentUser.companyName}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
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
                className="border font-extrabold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                  color: theme.headerText,
                }}
              >
                <LogIn className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
                <span>Giriş Yap</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal("register")}
                className="text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>Üye Ol</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
