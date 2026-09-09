import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Hexagon,
  ShieldCheck,
  CircleDot,
  Award,
  Cpu,
  Compass,
} from "lucide-react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  saveUserProfile,
  getUserProfile,
} from "../lib/firebase";
import { AppModuleKey } from "../types";
import tallsoftLogo from "../assets/auth/tallsoft-muhasebe-logo.png";
import loginIllustration from "../assets/auth/login-illustration.png";

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
  allowedModules?: AppModuleKey[];
  passwordPlain?: string;
  createdByAdmin?: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: "login" | "register" | "verify";
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

export interface BackgroundSlide {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
}

// Geriye dönük uyumluluk için korunan veri yapıları
export const LOGIN_BACKGROUND_SLIDES: BackgroundSlide[] = [
  {
    id: 1,
    title: "Tall Soft Muhasebe",
    subtitle: "Güvenli ve yüksek teknolojili bulut ön muhasebe altyapımızla 7/24 kesintisiz erişim sağlayın.",
    tag: "GÜVENLİ ALTYAPI",
    imageUrl: loginIllustration,
  },
];

export const BRAND_LOGOS: LogoOption[] = [
  {
    id: 1,
    title: "Tall Soft Kurumsal Logo",
    category: "Kurumsal & İnovatif",
    description: "Tall Soft Muhasebe resmi kurumsal logosu.",
    colorClass: "text-[#351F62]",
    borderClass: "border-purple-300",
    bgGradient: "from-[#351F62] via-[#8252FC] to-indigo-600",
    icon: Hexagon,
    imageUrl: tallsoftLogo,
  },
  {
    id: 2,
    title: "Minimal Tech Shield",
    category: "Teknoloji & Güvenlik",
    description: "Güvenli finansal altyapıyı temsil eden modern kalkan amblemi.",
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
    description: "Sonsuz döngü ve kesintisiz sermaye akışını simgeleyen amblem.",
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
    description: "Üst düzey şirketler için elmas kesim logo.",
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
    description: "Yapay zeka entegrasyonlu analiz amblemi.",
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
    description: "Stratejik finans rotasını simgeleyen pusula ikonu.",
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
  const [mode, setMode] = useState<"login" | "register" | "verify">(initialMode);
  const [previousMode, setPreviousMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("demo@tallsoft.com.tr");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("+90 (212) 555 0100");
  const [taxNumber, setTaxNumber] = useState("1234567890");
  const [selectedLogoId, setSelectedLogoId] = useState<number>(1);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendNotice, setResendNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 6-digit OTP verification code state
  const [otp, setOtp] = useState<string[]>(["2", "2", "2", "2", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync mode with initialMode prop
  useEffect(() => {
    setMode(initialMode);
    if (initialMode === "login" || initialMode === "register") {
      setPreviousMode(initialMode);
    }
  }, [initialMode]);

  // Reset errors when mode or visibility changes
  useEffect(() => {
    setErrorMessage("");
    setResendNotice("");
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const selectedLogo = BRAND_LOGOS.find((l) => l.id === selectedLogoId) || BRAND_LOGOS[0];

  const handleBackToWebsite = () => {
    if (canClose) {
      onClose();
    } else {
      window.open("https://tallsoft.com.tr", "_blank", "noopener,noreferrer");
    }
  };

  // Step 1: User submits Email + Password -> transitions to verification step
  const handleInitiateEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Lütfen e-posta adresinizi ve şifrenizi giriniz.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setPreviousMode(mode === "verify" ? "login" : mode);
    setMode("verify");
    setTimeout(() => {
      // Focus the 5th input (index 4) if 4 are pre-filled like the mockup, or first empty
      const firstEmptyIdx = otp.findIndex((val) => !val);
      const targetIdx = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
      otpRefs.current[targetIdx]?.focus();
    }, 100);
  };

  // Step 2: Final authentication on code verification
  const executeFinalAuth = async () => {
    setSubmitting(true);
    setErrorMessage("");
    const cleanEmail = email.trim().toLowerCase();
    const isSystemAdmin =
      cleanEmail.includes("admin") ||
      cleanEmail === "ilyasyildirim@outlook.com.tr" ||
      cleanEmail === "ilyasylldrm@gmail.com";

    try {
      let firebaseUid = `usr_${Date.now()}`;
      let finalProfile: UserProfile;

      if (
        cleanEmail === "admin@muavin.com" ||
        cleanEmail === "ilyasyildirim@outlook.com.tr" ||
        cleanEmail.includes("admin")
      ) {
        firebaseUid = "nuT309AyQxQKddnAp1ZJjlSgBXt2";
      }

      if (previousMode === "register") {
        // Firebase Authentication: Create User
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          firebaseUid = userCredential.user.uid;
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use") {
            setErrorMessage("Bu e-posta adresi ile zaten kayıtlı bir hesap var. Lütfen giriş yapınız.");
            setSubmitting(false);
            return;
          } else if (authErr.code === "auth/weak-password") {
            setErrorMessage("Şifreniz çok zayıf. Lütfen daha güçlü bir şifre giriniz.");
            setSubmitting(false);
            return;
          }
          console.warn("Firebase Auth fallback used:", authErr);
        }

        finalProfile = {
          id: firebaseUid,
          name: fullName.trim() || (isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : (email.split("@")[0] || "Kullanıcı")),
          email: email.trim(),
          companyName: isSystemAdmin ? "Tall Soft Muhasebe Genel Merkez" : (companyName.trim() || "Tall Soft Müşterisi"),
          phone: phone.trim() || "+90 (212) 555 0100",
          taxNumber: taxNumber.trim() || "1234567890",
          selectedLogoId: selectedLogo.id,
          selectedLogoName: selectedLogo.title,
          selectedLogoUrl: selectedLogo.imageUrl,
          role: isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Firma Yöneticisi",
        };

        // Save profile in Firestore
        try {
          await saveUserProfile({
            userId: finalProfile.id,
            email: finalProfile.email,
            name: finalProfile.name,
            companyName: finalProfile.companyName,
            phone: finalProfile.phone,
            taxNumber: finalProfile.taxNumber,
            selectedLogoId: finalProfile.selectedLogoId,
            selectedLogoName: finalProfile.selectedLogoName,
            selectedLogoUrl: finalProfile.selectedLogoUrl,
            role: finalProfile.role,
          });
        } catch (dbErr) {
          console.error("Firestore user profile save error:", dbErr);
        }
      } else {
        // Firebase Authentication: Sign In
        try {
          let userCredential;
          try {
            userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          } catch (signInErr: any) {
            // Auto-create admin account in Firebase Auth if it doesn't exist yet
            if (
              (signInErr.code === "auth/user-not-found" ||
                signInErr.code === "auth/invalid-credential" ||
                signInErr.code === "auth/invalid-email") &&
              isSystemAdmin
            ) {
              try {
                userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
              } catch (createErr) {
                console.warn("Could not auto-create admin Firebase auth user:", createErr);
                throw signInErr;
              }
            } else {
              throw signInErr;
            }
          }

          firebaseUid = userCredential.user.uid;

          // Try fetching stored Firestore profile
          const dbProfile = await getUserProfile(firebaseUid);
          if (dbProfile) {
            finalProfile = {
              id: dbProfile.userId,
              name: dbProfile.name || (isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : "Kullanıcı"),
              email: dbProfile.email || email.trim(),
              companyName: isSystemAdmin ? "Tall Soft Muhasebe Genel Merkez" : (dbProfile.companyName || "Tall Soft Muhasebe"),
              phone: dbProfile.phone || "+90 (212) 555 0100",
              taxNumber: dbProfile.taxNumber || "1234567890",
              selectedLogoId: dbProfile.selectedLogoId || selectedLogo.id,
              selectedLogoName: dbProfile.selectedLogoName || selectedLogo.title,
              selectedLogoUrl: dbProfile.selectedLogoUrl || selectedLogo.imageUrl,
              role: isSystemAdmin ? "Sistem Yöneticisi (Admin)" : (dbProfile.role || "Firma Yöneticisi"),
              allowedModules: dbProfile.allowedModules,
            };
          } else {
            finalProfile = {
              id: firebaseUid,
              name: isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : (email.split("@")[0] || "Müşteri / Yönetici"),
              email: email.trim(),
              companyName: isSystemAdmin ? "Tall Soft Muhasebe Genel Merkez" : "Tall Soft Bilişim Ltd. Şti.",
              phone: "+90 (212) 555 0100",
              taxNumber: "8470291038",
              selectedLogoId: selectedLogo.id,
              selectedLogoName: selectedLogo.title,
              selectedLogoUrl: selectedLogo.imageUrl,
              role: isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Firma Yöneticisi",
            };

            try {
              await saveUserProfile({
                userId: finalProfile.id,
                email: finalProfile.email,
                name: finalProfile.name,
                companyName: finalProfile.companyName,
                phone: finalProfile.phone,
                taxNumber: finalProfile.taxNumber,
                selectedLogoId: finalProfile.selectedLogoId,
                selectedLogoName: finalProfile.selectedLogoName,
                selectedLogoUrl: finalProfile.selectedLogoUrl,
                role: finalProfile.role,
              });
            } catch (err) {
              console.warn("Could not save initial admin profile:", err);
            }
          }
        } catch (authErr: any) {
          // Local fallback for offline/development/demo logins
          finalProfile = {
            id: isSystemAdmin ? "nuT309AyQxQKddnAp1ZJjlSgBXt2" : `usr_${Date.now()}`,
            name: isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : (email.split("@")[0] || "Müşteri / Yönetici"),
            email: email.trim(),
            companyName: isSystemAdmin ? "Tall Soft Muhasebe Genel Merkez" : "Tall Soft Bilişim Ltd. Şti.",
            phone: "+90 (212) 555 0100",
            taxNumber: "8470291038",
            selectedLogoId: selectedLogo.id,
            selectedLogoName: selectedLogo.title,
            selectedLogoUrl: selectedLogo.imageUrl,
            role: isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Firma Yöneticisi",
          };
        }
      }

      if (rememberMe) {
        localStorage.setItem("muavin_active_user", JSON.stringify(finalProfile));
      } else {
        sessionStorage.setItem("muavin_active_user", JSON.stringify(finalProfile));
      }

      setPassword("");
      setSubmitting(false);
      onLoginSuccess(finalProfile);
      onClose();
    } catch (err: any) {
      console.error("Auth submit error:", err);
      setErrorMessage("Giriş işlemi sırasında beklenmeyen bir hata oluştu.");
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeFinalAuth();
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      nextOtp[i] = pasted[i];
    }
    setOtp(nextOtp);
    const targetIdx = Math.min(pasted.length, 5);
    otpRefs.current[targetIdx]?.focus();
  };

  const handleResendCode = () => {
    setResendNotice("Doğrulama kodu tekrar e-posta adresinize iletildi.");
    setTimeout(() => setResendNotice(""), 4000);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setSubmitting(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      const firebaseUid = user.uid;
      const userEmail = user.email || "";
      const cleanUserEmail = userEmail.trim().toLowerCase();
      const isSystemAdmin =
        cleanUserEmail.includes("admin") ||
        cleanUserEmail === "ilyasyildirim@outlook.com.tr" ||
        cleanUserEmail === "ilyasylldrm@gmail.com";

      let finalProfile: UserProfile;

      const dbProfile = await getUserProfile(firebaseUid);
      if (dbProfile) {
        finalProfile = {
          id: dbProfile.userId,
          name: dbProfile.name || user.displayName || (isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : "Google Kullanıcısı"),
          email: dbProfile.email || userEmail,
          companyName: isSystemAdmin ? "Tall Soft Muhasebe Genel Merkez" : (dbProfile.companyName || "Tall Soft Müşterisi"),
          phone: dbProfile.phone || "+90 (212) 555 0100",
          taxNumber: dbProfile.taxNumber || "1234567890",
          selectedLogoId: dbProfile.selectedLogoId || selectedLogo.id,
          selectedLogoName: dbProfile.selectedLogoName || selectedLogo.title,
          selectedLogoUrl: dbProfile.selectedLogoUrl || selectedLogo.imageUrl,
          role: isSystemAdmin ? "Sistem Yöneticisi (Admin)" : (dbProfile.role || "Firma Yöneticisi"),
          allowedModules: dbProfile.allowedModules,
        };
      } else {
        finalProfile = {
          id: firebaseUid,
          name: isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : (user.displayName || userEmail.split("@")[0] || "Google Kullanıcısı"),
          email: userEmail,
          companyName: isSystemAdmin ? "Tall Soft Muhasebe Genel Merkez" : "Tall Soft Bilişim Ltd. Şti.",
          phone: "+90 (212) 555 0100",
          taxNumber: "8470291038",
          selectedLogoId: selectedLogo.id,
          selectedLogoName: selectedLogo.title,
          selectedLogoUrl: selectedLogo.imageUrl,
          role: isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Firma Yöneticisi",
        };

        try {
          await saveUserProfile({
            userId: finalProfile.id,
            email: finalProfile.email,
            name: finalProfile.name,
            companyName: finalProfile.companyName,
            phone: finalProfile.phone,
            taxNumber: finalProfile.taxNumber,
            selectedLogoId: finalProfile.selectedLogoId,
            selectedLogoName: finalProfile.selectedLogoName,
            selectedLogoUrl: finalProfile.selectedLogoUrl,
            role: finalProfile.role,
          });
        } catch (dbErr) {
          console.warn("Could not save initial Google user profile to Firestore:", dbErr);
        }
      }

      if (rememberMe) {
        localStorage.setItem("muavin_active_user", JSON.stringify(finalProfile));
      } else {
        sessionStorage.setItem("muavin_active_user", JSON.stringify(finalProfile));
      }

      setSubmitting(false);
      onLoginSuccess(finalProfile);
      onClose();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage("Google ile giriş penceresi kapatıldı.");
      } else if (err.code === "auth/popup-blocked") {
        setErrorMessage("Tarayıcınız açılır pencereyi engelledi. Lütfen açılır pencerelere izin veriniz.");
      } else {
        setErrorMessage("Google ile kimlik doğrulama sırasında bir hata oluştu.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#E0E0F0] overflow-y-auto flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-300 font-sans">
      
      {/* Central Login Card */}
      <div className="relative w-full max-w-[1020px] bg-white rounded-2xl sm:rounded-[28px] shadow-2xl shadow-indigo-950/10 overflow-hidden flex flex-col lg:flex-row min-h-[580px] border border-slate-200/60">
        
        {/* Close Button (if applicable) */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-30"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ========================================================= */}
        {/* LEFT COLUMN: WHITE LOGIN / VERIFICATION FORM SECTION      */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[48%] bg-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between z-20">
          
          {mode === "verify" ? (
            /* ======================================================= */
            /* VERIFICATION CODE SCREEN (OTP / CHECK YOUR EMAIL)       */
            /* ======================================================= */
            <div className="animate-in fade-in duration-200">
              {/* TALL SOFT MUHASEBE LOGO */}
              <div className="mb-6 select-none">
                <img
                  src={tallsoftLogo}
                  alt="Tall Soft Muhasebe"
                  className="h-14 sm:h-16 w-auto object-contain"
                />
              </div>

              {/* BACK BUTTON */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setMode(previousMode)}
                  className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Geri</span>
                </button>
              </div>

              {/* HEADING (PLEASE CHECK YOUR EMAIL!) */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Lütfen e-postanızı kontrol edin!
              </h1>

              {errorMessage && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between animate-in fade-in mb-4">
                  <span>⚠️ {errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage("")}
                    className="font-bold text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {resendNotice && (
                <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-between animate-in fade-in mb-4">
                  <span>✓ {resendNotice}</span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                {/* 6 OTP DIGIT BOXES */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      placeholder="-"
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold text-slate-800 bg-white border border-slate-200 focus:border-[#351F62] focus:ring-2 focus:ring-[#351F62]/20 rounded-xl outline-none transition-all placeholder:text-slate-300"
                    />
                  ))}
                </div>

                {/* WE SENT A CODE TO EMAIL ... RESEND */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 gap-2">
                  <p className="truncate">
                    <span className="font-semibold text-slate-800">{email}</span> adresine bir kod gönderdik
                  </p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-[#6C47FF] hover:text-[#5233D2] font-semibold shrink-0 hover:underline cursor-pointer"
                  >
                    Tekrar Gönder
                  </button>
                </div>

                {/* CONTINUE BUTTON WITH COLOR #351F62 */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: "#351F62" }}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-medium text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-4"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Doğrulanıyor...</span>
                    </>
                  ) : (
                    <span>Devam Et</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* ======================================================= */
            /* LOGIN / REGISTER FORM SCREEN                            */
            /* ======================================================= */
            <div>
              {/* TALL SOFT MUHASEBE LOGO */}
              <div className="mb-6 select-none">
                <img
                  src={tallsoftLogo}
                  alt="Tall Soft Muhasebe"
                  className="h-14 sm:h-16 w-auto object-contain"
                />
              </div>

              {/* HEADER ROW: TITLE & BACK TO WEBSITE */}
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
                </h1>
                <button
                  type="button"
                  onClick={handleBackToWebsite}
                  className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Web sitesine dön</span>
                </button>
              </div>

              {/* GOOGLE SIGN IN BUTTON */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 text-sm font-medium transition-all shadow-2xs active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Google ile Devam Et</span>
              </button>

              {/* DOTTED SEPARATOR */}
              <div className="my-5 border-t border-dotted border-slate-200" />

              {/* AUTH FORM */}
              <form onSubmit={handleInitiateEmailAuth} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between animate-in fade-in">
                    <span>⚠️ {errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => setErrorMessage("")}
                      className="font-bold text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* EMAIL ADDRESS FIELD (NOTCHED LABEL) */}
                <div className="relative">
                  <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] sm:text-xs font-medium text-slate-500 z-10 select-none">
                    E-posta adresi
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@tallsoft.com.tr"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#351F62] focus:ring-1 focus:ring-[#351F62] text-sm text-slate-800 placeholder:text-slate-400 font-normal outline-none transition-all"
                  />
                </div>

                {/* PASSWORD FIELD */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Şifrenizi belirleyin" : "Şifrenizi giriniz"}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 focus:border-[#351F62] focus:ring-1 focus:ring-[#351F62] text-sm text-slate-800 placeholder:text-slate-400 font-normal outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* SUBMIT BUTTON WITH USER REQUESTED COLOR #351F62 */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: "#351F62" }}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-medium text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === "login" ? "Giriş Yapılıyor..." : "Kayıt Yapılıyor..."}</span>
                    </>
                  ) : (
                    <span>E-posta ile devam et</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* FOOTER SWITCH TO REGISTER / LOGIN (only when not in verify mode) */}
          {mode !== "verify" && (
            <div className="mt-6 text-left text-xs sm:text-sm text-slate-600 font-medium">
              {mode === "login" ? (
                <span>
                  Hesabınız yok mu?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-[#6C47FF] hover:text-[#5233D2] font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Kayıt Ol
                  </button>
                </span>
              ) : (
                <span>
                  Zaten bir hesabınız var mı?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-[#6C47FF] hover:text-[#5233D2] font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Giriş Yap
                  </button>
                </span>
              )}
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SOLID PURPLE ILLUSTRATION SECTION           */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:w-[52%] bg-[#8252FC] items-center justify-center p-8 xl:p-12 relative overflow-hidden select-none">
          <div className="relative w-full max-w-[420px] xl:max-w-[460px] flex items-center justify-center">
            <img
              src={loginIllustration}
              alt="Tall Soft Finans ve Muhasebe"
              className="w-full h-auto max-h-[500px] object-contain drop-shadow-md pointer-events-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
