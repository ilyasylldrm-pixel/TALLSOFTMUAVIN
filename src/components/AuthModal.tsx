import React, { useState } from "react";
import {
  X,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  FileCheck2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  BadgePercent,
  Layers,
  Hexagon,
  Award,
  CircleDot,
  Compass,
  Cpu
} from "lucide-react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  taxNumber: string;
  selectedLogoId: number;
  selectedLogoName: string;
  selectedLogoUrl: string;
  role: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: "login" | "register";
  canClose?: boolean;
}

export interface LogoOption {
  id: number;
  title: string;
  category: string;
  description: string;
  colorClass: string;
  borderClass: string;
  bgGradient: string;
  icon: React.ElementType;
  imageUrl: string;
}

// 6 Birbirinden Farklı Resimli Logo Seçeneği
export const BRAND_LOGOS: LogoOption[] = [
  {
    id: 1,
    title: "Modern Gradient Hexagon",
    category: "Kurumsal & İnovatif",
    description: "Mor ve lila gradyanlı, dinamik veri akışını simgeleyen altıgen muavin amblemi.",
    colorClass: "text-purple-600",
    borderClass: "border-purple-300",
    bgGradient: "from-purple-600 via-indigo-600 to-fuchsia-600",
    icon: Hexagon,
    imageUrl: "https://picsum.photos/seed/muavin-logo-hexagon/300/300",
  },
  {
    id: 2,
    title: "Minimal Tech Shield",
    category: "Teknoloji & Güvenlik",
    description: "Güvenli finansal altyapıyı temsil eden modern kalkan ve siber ağ amblemi.",
    colorClass: "text-indigo-600",
    borderClass: "border-indigo-300",
    bgGradient: "from-indigo-600 via-blue-600 to-cyan-600",
    icon: ShieldCheck,
    imageUrl: "https://picsum.photos/seed/muavin-logo-shield/300/300",
  },
  {
    id: 3,
    title: "Golden Infinity Loop",
    category: "Finans & Yatırım",
    description: "Sonsuz döngü ve kesintisiz sermaye akışını simgeleyen premium altın ikon.",
    colorClass: "text-amber-600",
    borderClass: "border-amber-300",
    bgGradient: "from-amber-500 via-orange-600 to-yellow-500",
    icon: CircleDot,
    imageUrl: "https://picsum.photos/seed/muavin-logo-infinity/300/300",
  },
  {
    id: 4,
    title: "Royal Diamond Crest",
    category: "Lüks & Prestij",
    description: "Üst düzey holdingler ve prestijli ticari işletmeler için elmas kesim logo.",
    colorClass: "text-emerald-600",
    borderClass: "border-emerald-300",
    bgGradient: "from-emerald-600 via-teal-600 to-cyan-700",
    icon: Award,
    imageUrl: "https://picsum.photos/seed/muavin-logo-diamond/300/300",
  },
  {
    id: 5,
    title: "Cyber Prism Grid",
    category: "Büyük Veri & Analitik",
    description: "Yapay zeka entegrasyonlu muhasebe analizlerini temsil eden prizmatik grid amblem.",
    colorClass: "text-blue-600",
    borderClass: "border-blue-300",
    bgGradient: "from-blue-600 via-sky-600 to-indigo-700",
    icon: Cpu,
    imageUrl: "https://picsum.photos/seed/muavin-logo-prism/300/300",
  },
  {
    id: 6,
    title: "Vibrant Compass Wave",
    category: "Büyüme & Strateji",
    description: "Ticari büyümeyi ve stratejik finans rotasını gösteren dinamik pusula ikonu.",
    colorClass: "text-fuchsia-600",
    borderClass: "border-fuchsia-300",
    bgGradient: "from-fuchsia-600 via-pink-600 to-rose-600",
    icon: Compass,
    imageUrl: "https://picsum.photos/seed/muavin-logo-compass/300/300",
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = "login",
  canClose = true,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [selectedLogoId, setSelectedLogoId] = useState<number>(1);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset inputs when modal mode changes
  React.useEffect(() => {
    setErrorMessage("");
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const selectedLogo = BRAND_LOGOS.find((l) => l.id === selectedLogoId) || BRAND_LOGOS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Lütfen e-posta adresinizi ve şifrenizi giriniz.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Şifre en az 4 karakter olmalıdır.");
      return;
    }

    const isSystemAdmin = email.toLowerCase().includes("admin");

    const user: UserProfile = {
      id: isSystemAdmin ? "usr_admin_001" : `usr_${Date.now()}`,
      name: mode === "register" ? (fullName.trim() || "Kullanıcı") : isSystemAdmin ? "Sistem Yöneticisi (Admin)" : (email.split("@")[0] || "Müşteri / Yönetici"),
      email: email.trim(),
      companyName: mode === "register" ? (companyName.trim() || "Muavin ERP Müşterisi") : isSystemAdmin ? "Muavin Finans & ERP Genel Merkez" : "Muavin Bilişim A.Ş.",
      phone: phone.trim() || "+90 (212) 555 0100",
      taxNumber: taxNumber.trim() || "1234567890",
      selectedLogoId: selectedLogo.id,
      selectedLogoName: selectedLogo.title,
      selectedLogoUrl: selectedLogo.imageUrl,
      role: isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Firma Yöneticisi",
    };

    if (rememberMe) {
      localStorage.setItem("muavin_active_user", JSON.stringify(user));
    } else {
      sessionStorage.setItem("muavin_active_user", JSON.stringify(user));
    }

    // Clear password field after successful auth
    setPassword("");
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-purple-200/80 overflow-hidden my-8">
        
        {/* Top Decorative Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-6 sm:p-8 overflow-hidden">
          {/* Lila Bal Peteği Desen Kaplaması */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%23a855f7' stroke-width='1' stroke-opacity='0.6'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23c084fc' stroke-width='0.7' stroke-opacity='0.4' stroke-dasharray='2,2'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "20px 35px",
            }}
          />

          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer z-20"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Muavin ERP Giriş & Kayıt Portalı</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {mode === "login" ? "Kullanıcı Girişi Yapın" : "Yeni Şirket / Üyelik Oluşturun"}
              </h2>
              <p className="text-xs text-purple-200/80 font-medium">
                Ön muhasebe, cari takip, e-fatura ve finansal yönetim portalına güvenle erişin.
              </p>
            </div>

            {/* Mode Toggle Pills */}
            <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === "login"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Giriş Yap</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === "register"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Üye Ol</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* SECTION: 6 BIRBIRINDEN FARKLIDIR LOGO RESIMLERI GALERISI */}
          <div className="space-y-3 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-purple-50/80 p-5 rounded-2xl border border-purple-200/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Şirketiniz İçin Kurumsal Logo Resmini Seçin (6 Farklı Tasarım)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Aşağıda firmasını temsil edecek 6 farklı amblem/logo resminden dilediğinizi seçebilirsiniz:
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs">
                Seçili: <strong className="text-purple-950">{selectedLogo.title}</strong>
              </span>
            </div>

            {/* 6 Grid Logo Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {BRAND_LOGOS.map((logo) => {
                const Icon = logo.icon;
                const isSelected = selectedLogoId === logo.id;

                return (
                  <div
                    key={logo.id}
                    onClick={() => setSelectedLogoId(logo.id)}
                    className={`relative rounded-2xl p-3 border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-2 group ${
                      isSelected
                        ? "bg-white border-purple-600 ring-2 ring-purple-500/40 shadow-md scale-[1.03]"
                        : "bg-white/80 border-slate-200 hover:border-purple-300 hover:bg-white hover:shadow-xs"
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-white p-1 rounded-full shadow-md z-10">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {/* Logo Image & Icon Composite */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                      <img
                        src={logo.imageUrl}
                        alt={logo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient Badge Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-tr ${logo.bgGradient} opacity-25 mix-blend-overlay`} />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-[1px]">
                        <Icon className="w-7 h-7 text-white drop-shadow-md" />
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-black text-slate-900 line-clamp-1 leading-tight">
                        {logo.title}
                      </div>
                      <div className="text-[9px] font-semibold text-purple-700 bg-purple-50 rounded px-1 mt-0.5 inline-block">
                        {logo.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AUTH FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                <span>⚠️ {errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="text-rose-600 hover:text-rose-900 font-black cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {mode === "register" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block font-bold text-xs text-slate-700 mb-1">
                    Adınız Soyadınız *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Yılmaz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 mb-1">
                    Şirket / Firma Unvanı *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Muavin Teknoloji Sanayi A.Ş."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 mb-1">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="0212 555 0100"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-xs text-slate-700 mb-1">
                    Vergi Kimlik No (VKN / TCKN)
                  </label>
                  <div className="relative">
                    <FileCheck2 className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="8470291038"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-xs text-slate-700 mb-1">
                  E-Posta Adresi *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="finans@firma.com.tr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-xs text-slate-700 mb-1">
                  Şifre *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-10 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Beni Hatırla</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Sistem yöneticisine şifre sıfırlama bağlantısı gönderildi.");
                  }}
                  className="font-bold text-purple-700 hover:underline"
                >
                  Şifremi Unuttum?
                </a>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-slate-500 font-medium">
                🔒 256-Bit SSL Şifreleme ve KVKK Onaylı Güvenli Altyapı
              </p>

              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm px-8 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>{mode === "login" ? "Sisteme Giriş Yap" : "Üyeliği Tamamla & Giriş Yap"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
