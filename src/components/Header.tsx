import React from "react";
import {
  Menu,
  ArrowLeft,
  ChevronRight,
  Rocket,
  Bell,
  LogOut,
} from "lucide-react";
import { Account } from "../types";
import { UserProfile } from "./AuthModal";
import tallsoftHeaderLogo from "../assets/auth/tallsoft-logo-header.png";

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
  breadcrumbCategory?: string;
  breadcrumbPage?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onSelectTab,
  currentUser,
  onLogout,
  onToggleMobileMenu,
  onToggleSidebarCollapse,
  breadcrumbCategory = "Cari takip",
  breadcrumbPage = "Alacaklar ve borçlar",
}) => {
  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      if (onToggleMobileMenu) onToggleMobileMenu();
    } else {
      if (onToggleSidebarCollapse) onToggleSidebarCollapse();
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-100/90 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 select-none font-sans">
      {/* ========================================================= */}
      {/* LEFT SECTION: HAMBURGER, LOGO, BACK BUTTON, BREADCRUMB   */}
      {/* ========================================================= */}
      <div className="flex items-center">
        {/* Brand Group (Aligned with Sidebar width) */}
        <div className="flex items-center w-48 sm:w-56 lg:w-60 shrink-0">
          {/* Hamburger Menu Circular Button */}
          <button
            type="button"
            onClick={handleToggle}
            className="w-9 h-9 rounded-full bg-[#F0EBFA] hover:bg-[#E5DEF8] text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Menüyü Aç / Kapat"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* TALL SOFT BRAND LOGO */}
          <div
            onClick={() => onSelectTab("dashboard")}
            className="cursor-pointer flex items-center shrink-0 ml-3 sm:ml-4"
          >
            <img
              src={tallsoftHeaderLogo}
              alt="TALL SOFT"
              className="h-8 sm:h-8.5 w-auto object-contain"
            />
          </div>
        </div>

        {/* Back Button & Breadcrumbs (Shifted to the Right, aligning with main canvas) */}
        <div className="flex items-center ml-2 sm:ml-6 lg:ml-8">
          {/* Back Button (←) with #F0EBFA */}
          <button
            type="button"
            onClick={() => onSelectTab("dashboard")}
            className="w-8 h-8 rounded-xl bg-[#F0EBFA] hover:bg-[#E5DEF8] text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Vertical Separator Line */}
          <div className="hidden sm:block h-4 w-[1px] bg-slate-200 mx-3.5" />

          {/* Clean Breadcrumb Navigation */}
          <div className="hidden sm:flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500">
            <span
              onClick={() => onSelectTab("contacts")}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              {breadcrumbCategory}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">
              {breadcrumbPage || title}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SECTION: UPGRADE PLAN, BELL, DIVIDER, AVATAR RING   */}
      {/* ========================================================= */}
      <div className="flex items-center gap-3">
        {/* "Upgrade plan" Button (#351F62 with Rocket Icon) */}
        <button
          type="button"
          onClick={() =>
            alert(
              "Tall Soft Pro Plan yükseltme talebiniz alındı. Müşteri temsilcimiz sizinle iletişime geçecektir."
            )
          }
          style={{ backgroundColor: "#351F62" }}
          className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm py-2 px-4 sm:px-4.5 rounded-xl hover:opacity-95 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
        >
          <Rocket className="w-4 h-4 text-purple-200" />
          <span>Upgrade plan</span>
        </button>

        {/* Notification Bell with Purple Badge Dot */}
        <button
          type="button"
          className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer ml-0.5"
          title="Bildirimler"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8252FC] ring-2 ring-white" />
        </button>

        {/* Vertical Separator before Avatar */}
        <div className="hidden sm:block h-5 w-[1px] bg-slate-200 mx-1" />

        {/* User Profile Avatar with Colorful Gradient Ring (Figma Spec) */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center cursor-pointer focus:outline-none"
            title={currentUser?.name || "Profil"}
          >
            {/* Colorful Gradient Border Ring */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 shadow-2xs hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden bg-white border border-white flex items-center justify-center">
                {currentUser?.selectedLogoUrl ? (
                  <img
                    src={currentUser.selectedLogoUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </button>

          {/* User Quick Dropdown */}
          <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 hidden group-hover:block z-50 animate-in fade-in zoom-in-95 text-xs text-slate-700">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 truncate">
                {currentUser?.name || "Kullanıcı"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser?.email || "demo@tallsoft.com.tr"}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 font-semibold mt-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
