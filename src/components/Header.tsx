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
} from "lucide-react";
import { Account } from "../types";
import { UserProfile } from "./AuthModal";

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
}) => {
  const totalTlBalance = accounts
    .filter((a) => a.currency === "TRY")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-purple-50/90 via-white/95 to-fuchsia-50/80 backdrop-blur-md border-b border-purple-200/70 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
      {/* Lila Bal Peteği Desen Kaplaması */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.55'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.4' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.3'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.7' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.7' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "20px 35px",
        }}
      />

      {/* Title & Mobile Hamburger Button */}
      <div className="relative z-10 flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-white/90 hover:bg-white text-purple-900 border border-purple-300 shadow-2xs cursor-pointer transition-all active:scale-95"
            title="Ana Menüyü Aç / Kapat"
          >
            <Menu className="w-5 h-5 text-purple-800" />
          </button>
        )}
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs font-semibold text-purple-900/80 mt-0.5 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Global Search & Action Bar */}
      <div className="flex flex-wrap items-center gap-3 relative z-10">
        {/* Search Bar */}
        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari, Fatura, Ürün ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/80 hover:bg-white focus:bg-white text-slate-900 placeholder-purple-400 text-xs rounded-xl pl-9 pr-7 py-2 border border-purple-200/80 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 cursor-pointer p-0.5 rounded-md hover:bg-purple-100/50 transition-all"
              title="Aramayı Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Total Cash Balance Pill */}
        <div
          onClick={() => onSelectTab("accounts")}
          className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-300/60 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all shadow-2xs backdrop-blur-xs"
          title="Toplam Kasa ve Banka Bakiyesi"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold">
            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-emerald-900/80 leading-none tracking-wider">
              Nakit Bakiye
            </div>
            <div className="text-xs font-black text-emerald-950 mt-0.5 font-mono">
              ₺{totalTlBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* AI Assistant Trigger Button */}
        <button
          onClick={onOpenAiModal}
          className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-700 font-bold animate-pulse" />
          <span>AI Muavin</span>
        </button>

        {/* New Transaction Button */}
        <button
          onClick={onOpenQuickAdd}
          className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 font-bold" />
          <span>İşlem Ekle</span>
        </button>

        {/* USER AUTHENTICATION BUTTONS / PROFILE STATE */}
        <div className="pl-2 border-l border-purple-200/80 flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-white/90 border border-purple-200/80 p-1 rounded-xl shadow-2xs">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-purple-300 shrink-0 bg-purple-50">
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
                <div className="text-xs font-black text-slate-900 truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[9px] text-purple-700 font-semibold truncate">
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
                className="bg-white hover:bg-purple-50 text-purple-900 border border-purple-300 font-extrabold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-purple-700" />
                <span>Giriş Yap</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal("register")}
                className="bg-purple-900 hover:bg-purple-950 text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-purple-300" />
                <span>Üye Ol</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
