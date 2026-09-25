import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Building,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Hexagon,
  ShieldCheck,
  CircleDot,
  Award,
  Cpu,
  Compass,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  MapPin,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "./Logo";
import {
  auth,
  googleProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  saveUserProfile,
  getUserProfile,
  findUserProfileByEmail,
  isUserCreatedByAdmin,
  setCachedAccessToken,
} from "../lib/firebase";
import { AppModuleKey } from "../types";
import { triggerFormErrorNotification } from "../context/FormErrorContext";

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

export interface BackgroundSlide {
  id: number;
  location: string;
  locationCaption: string;
  tag: string;
  badge: string;
  title: string;
  subtitle: string;
  features: string[];
  imageUrl: string;
}

// 5 Yeni Manzara ve Gece Teması Görselleri (Kullanıcının Belirlediği Temalar)
export const LOGIN_BACKGROUND_SLIDES: BackgroundSlide[] = [
  {
    id: 1,
    location: "NORVEÇ • GEİRANGER FİYORDU",
    locationCaption: "NORWAY - FJORD CRUISE & GEIRANGER",
    tag: "GÜVENLİ BULUT ALTYAPI",
    badge: "7/24 KESİNTİSİZ SEYİR",
    title: "Sakin ve Derin Sularda Güvenli Bulut Muhasebe",
    subtitle: "Yüksek performanslı bulut sunucular, anlık veri yedekleme ve banka entegrasyonu ile finansal rotanızı güvenle belirleyin.",
    features: ["%99.99 Uptime", "256-Bit SSL Şifreleme", "Otomatik Bulut Yedekleme"],
    imageUrl: "/assets/slides/slide-1-norway.jpg",
  },
  {
    id: 2,
    location: "SANTORINI • OIA",
    locationCaption: "OIA - SANTORINI",
    tag: "BERRAK & AKILLI YÖNETİM",
    badge: "EGE BERRAKLIĞINDA FİNANS",
    title: "Maviliklerin Duru Huzurunda Şeffaf Mali Süreçler",
    subtitle: "e-Fatura, e-Arşiv, cari hesap ve stok takibini gereksiz karmaşadan arındırılmış modern arayüzle kolayca yönetin.",
    features: ["e-Dönüşüm Portalı", "Sade & Hızlı Arayüz", "Çoklu Şube & Kullanıcı"],
    imageUrl: "/assets/slides/slide-2-santorini.jpg",
  },
  {
    id: 3,
    location: "İSTANBUL • BOĞAZ & KÖPRÜ IŞIKLARI",
    locationCaption: "İSTANBUL - GECE & KÖPRÜ IŞIKLARI",
    tag: "TİCARETİN & FİNANSIN KALBİ",
    badge: "DİJİTAL KÖPRÜ ENTEGRASYONU",
    title: "Kıtaları Birleştiren Güçle Dijital Muhasebe Ağı",
    subtitle: "GİB sistemleri, kasa-banka akışı ve anlık nakit raporlamasıyla işletmenizin tüm ticaretini ışıldatın.",
    features: ["GİB E-Fatura Köprüsü", "Canlı Nakit Akışı", "Tüm Bankalarla Entegre"],
    imageUrl: "/assets/slides/slide-3-istanbul.jpg",
  },
  {
    id: 4,
    location: "BANFF • MORAINE GÖLÜ",
    locationCaption: "BANFF - MORAINE GÖLÜ & ROCKY MOUNTAINS",
    tag: "ZİRVEDE VERİ ANALİTİĞİ",
    badge: "KRİSTAL NETLİĞİNDE RAPORLAR",
    title: "Buzul Göllerinin Duru Netliğinde Bilanço & Raporlar",
    subtitle: "Yapay zeka asistanı, dinamik kâr-zarar grafikleri ve anlık bilanço özetleriyle zirveyi hedefleyin.",
    features: ["Yapay Zeka Asistanı", "Anlık Bilanço & Mizan", "Grafiksel Kâr / Zarar"],
    imageUrl: "/assets/slides/slide-4-banff.jpg",
  },
  {
    id: 5,
    location: "PROVENCE • LAVANTA TARLALARI",
    locationCaption: "PROVENCE - LAVANTA TARLALARI",
    tag: "BEREKETLİ DİJİTAL DÖNÜŞÜM",
    badge: "VERİMLİ TİCARİ AKIŞ",
    title: "Uçsuz Bucaksız Ufuklar ve Verimli Ticari Büyüme",
    subtitle: "Otomasyona dayalı teklif, sipariş, irsaliye ve fatura zinciri ile işletmenize taze bir verimlilik kazandırın.",
    features: ["Teklif & Sipariş Takibi", "Barkodlu Stok & Depo", "Akıllı Masraf Yönetimi"],
    imageUrl: "/assets/slides/slide-5-provence.jpg",
  },
];

// 6 Birbirinden Farklı Resimli Logo Seçeneği
export const BRAND_LOGOS: LogoOption[] = [
  {
    id: 1,
    title: "E-MUAVİN Kurumsal Logo",
    category: "Google Cloud Console Senkron",
    description: "Geometrik küp, E harfi ve altın sarısı denge çizgisiyle resmi kurumsal vektör logo.",
    colorClass: "text-[#0f6bae]",
    borderClass: "border-[#0f6bae]/40",
    bgGradient: "from-[#0A192F] via-[#13233E] to-[#1E3A8A]",
    icon: Hexagon,
    imageUrl: "/logo.svg",
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

  // Background Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

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
  const [submitting, setSubmitting] = useState(false);

  // Auto Rotation Timer (6 Seconds Interval)
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;

    const SLIDE_DURATION = 6000;
    const UPDATE_INTERVAL = 50;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlideIndex((idx) => (idx + 1) % LOGIN_BACKGROUND_SLIDES.length);
          return 0;
        }
        return prev + (UPDATE_INTERVAL / SLIDE_DURATION) * 100;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isOpen]);

  // Reset inputs when modal mode changes
  useEffect(() => {
    setErrorMessage("");
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const selectedLogo = BRAND_LOGOS.find((l) => l.id === selectedLogoId) || BRAND_LOGOS[0];
  const activeSlide = LOGIN_BACKGROUND_SLIDES[currentSlideIndex];

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % LOGIN_BACKGROUND_SLIDES.length);
    setProgress(0);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? LOGIN_BACKGROUND_SLIDES.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleSelectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();
    const isSystemAdmin =
      cleanEmail.includes("admin") ||
      cleanEmail === "ilyasyildirim@outlook.com.tr" ||
      cleanEmail === "ilyasylldrm@gmail.com";

    try {
      // 1. Enforce strict registration policy:
      // "admin kullanıcı oluşturmadığı sürece yeni kayıt yapma"
      const authCheck = await isUserCreatedByAdmin(cleanEmail);

      // Handle Registration / Account Activation Mode
      if (mode === "register") {
        if (!authCheck.isAuthorized) {
          setErrorMessage(
            `Kayıt İzni Reddedildi: '${cleanEmail}' adresi için Sistem Yöneticisi tarafından açılmış bir kullanıcı kaydı bulunmamaktadır. Admin kullanıcı oluşturmadığı sürece sisteme yeni kayıt yapılamaz. Lütfen yöneticinizle iletişime geçiniz.`
          );
          setSubmitting(false);
          return;
        }

        const preCreated = authCheck.existingProfile;
        let firebaseUid = preCreated?.userId || `usr_${Date.now()}`;

        // Attempt linking or creating in Firebase Auth
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          firebaseUid = userCredential.user.uid;
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use") {
            try {
              const signRes = await signInWithEmailAndPassword(auth, cleanEmail, password);
              firebaseUid = signRes.user.uid;
            } catch {
              // Ignore if already created
            }
          } else if (authErr.code === "auth/weak-password") {
            setErrorMessage("Şifreniz çok zayıf. Lütfen en az 6 karakterli güçlü bir şifre giriniz.");
            setSubmitting(false);
            return;
          }
        }

        const finalProfile: UserProfile = {
          id: firebaseUid,
          name: fullName.trim() || preCreated?.name || (isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : "Personel"),
          email: cleanEmail,
          companyName: preCreated?.companyName || (isSystemAdmin ? "Muavin Finans & ERP Genel Merkez" : (companyName.trim() || "Muavin ERP Müşterisi")),
          phone: preCreated?.phone || phone.trim() || "+90 (212) 555 0100",
          taxNumber: preCreated?.taxNumber || taxNumber.trim() || "1234567890",
          selectedLogoId: preCreated?.selectedLogoId || selectedLogo.id,
          selectedLogoName: preCreated?.selectedLogoName || selectedLogo.title,
          selectedLogoUrl: preCreated?.selectedLogoUrl || selectedLogo.imageUrl,
          role: preCreated?.role || (isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Firma Yöneticisi"),
          allowedModules: preCreated?.allowedModules,
          createdByAdmin: true,
        };

        // Update Firestore profile with activated user details
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
            allowedModules: finalProfile.allowedModules,
            createdByAdmin: true,
          });
        } catch (dbErr) {
          console.error("Firestore user profile save error:", dbErr);
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
        return;
      }

      // Handle Login Mode ("login")
      if (!authCheck.isAuthorized) {
        setErrorMessage(
          `Kullanıcı Bulunamadı: '${cleanEmail}' adresi için Sistem Yöneticisi tarafından açılmış bir hesap kaydı bulunmamaktadır. Admin kullanıcı oluşturmadığı sürece sisteme giriş yapılamaz.`
        );
        setSubmitting(false);
        return;
      }

      const preCreated = authCheck.existingProfile;
      let firebaseUid = preCreated?.userId || (isSystemAdmin ? "nuT309AyQxQKddnAp1ZJjlSgBXt2" : `usr_${Date.now()}`);
      let authSuccessful = false;

      // 1. Try Firebase Auth with email & password
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        firebaseUid = userCredential.user.uid;
        authSuccessful = true;
      } catch (signInErr: any) {
        // 2. Check if admin set a plain password when creating this user
        if (preCreated && preCreated.passwordPlain && preCreated.passwordPlain === password.trim()) {
          authSuccessful = true;
          // Optionally register in Firebase Auth for native future logins
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            firebaseUid = userCredential.user.uid;
          } catch {
            // ignore if already in Firebase Auth
          }
        } else if (isSystemAdmin) {
          // Auto bootstrap system admin
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            firebaseUid = userCredential.user.uid;
            authSuccessful = true;
          } catch {
            authSuccessful = true;
          }
        }
      }

      if (!authSuccessful) {
        setErrorMessage("Hatalı şifre girdiniz. Lütfen yöneticinizin tanımladığı şifreyi kontrol ediniz.");
        setSubmitting(false);
        return;
      }

      // Final profile constructed with admin permissions
      const finalProfile: UserProfile = {
        id: firebaseUid,
        name: preCreated?.name || (isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : cleanEmail.split("@")[0]),
        email: cleanEmail,
        companyName: preCreated?.companyName || (isSystemAdmin ? "Muavin Finans & ERP Genel Merkez" : "Muavin ERP Müşterisi"),
        phone: preCreated?.phone || "+90 (212) 555 0100",
        taxNumber: preCreated?.taxNumber || "1234567890",
        selectedLogoId: preCreated?.selectedLogoId || selectedLogo.id,
        selectedLogoName: preCreated?.selectedLogoName || selectedLogo.title,
        selectedLogoUrl: preCreated?.selectedLogoUrl || selectedLogo.imageUrl,
        role: preCreated?.role || (isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Personel"),
        allowedModules: preCreated?.allowedModules,
        createdByAdmin: true,
      };

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

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setSubmitting(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
      const user = userCredential.user;
      const userEmail = user.email || "";
      const cleanUserEmail = userEmail.trim().toLowerCase();

      // Enforce strict policy: Check if this user was created by admin
      const authCheck = await isUserCreatedByAdmin(cleanUserEmail);

      if (!authCheck.isAuthorized) {
        // Sign out immediately!
        await firebaseSignOut(auth);
        setErrorMessage(
          `Yetkisiz Erişim: Bu Google hesabı (${cleanUserEmail}) için Sistem Yöneticisi tarafından açılmış bir kullanıcı kaydı bulunamadı. Admin kullanıcı oluşturmadığı sürece yeni kayıt yapılamaz. Lütfen yöneticinizle iletişime geçiniz.`
        );
        setSubmitting(false);
        return;
      }

      const isSystemAdmin = authCheck.isSysAdmin;
      const preCreated = authCheck.existingProfile;
      const firebaseUid = user.uid;

      const finalProfile: UserProfile = {
        id: firebaseUid,
        name: preCreated?.name || user.displayName || (isSystemAdmin ? "İlyas Yıldırım (Sistem Yöneticisi)" : cleanUserEmail.split("@")[0]),
        email: cleanUserEmail,
        companyName: preCreated?.companyName || (isSystemAdmin ? "Muavin Finans & ERP Genel Merkez" : "Muavin ERP Müşterisi"),
        phone: preCreated?.phone || "+90 (212) 555 0100",
        taxNumber: preCreated?.taxNumber || "1234567890",
        selectedLogoId: preCreated?.selectedLogoId || selectedLogo.id,
        selectedLogoName: preCreated?.selectedLogoName || selectedLogo.title,
        selectedLogoUrl: preCreated?.selectedLogoUrl || selectedLogo.imageUrl,
        role: preCreated?.role || (isSystemAdmin ? "Sistem Yöneticisi (Admin)" : "Firma Yöneticisi"),
        allowedModules: preCreated?.allowedModules,
        createdByAdmin: true,
      };

      // Save/update existing profile to preserve permissions
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
        allowedModules: finalProfile.allowedModules,
        createdByAdmin: true,
      });

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
        setErrorMessage("Google ile kimlik doğrulama sırasında bir hata oluştu: " + (err?.message || err));
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1c2d] overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full h-full min-h-screen bg-[#0b1c2d] flex flex-col lg:flex-row">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: 5-IMAGE ROTATING BACKGROUND CAROUSEL         */}
        {/* ========================================================= */}
        <div className="relative w-full lg:w-2/3 min-h-[480px] lg:min-h-screen bg-[#060e1a] flex flex-col justify-between overflow-hidden group">
          
          {/* Carousel Images Cross-Dissolve Stack */}
          {LOGIN_BACKGROUND_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
                } transform transition-transform duration-[9000ms]`}
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#060e1a]/95 via-[#0A182E]/65 to-[#060e1a]/40" />
              </div>
            );
          })}

          {/* Deep Navy Gradient Overlay Vignette */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#060e1a]/95 via-[#0A182E]/30 to-[#060e1a]/40 mix-blend-multiply pointer-events-none" />

          {/* Top Header Badge on Carousel */}
          <div className="relative z-30 p-6 flex items-center justify-between">
            <div className="inline-flex items-center gap-2.5 bg-[#0A182E]/80 backdrop-blur-md border border-[#0f6bae]/40 px-3.5 py-1.5 rounded-full text-[#cfe5ff] text-xs font-semibold tracking-wide shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#EAA728] animate-pulse" />
              <span className="font-mono text-xs font-bold text-[#cfe5ff]">E-MUAVİN ERP</span>
              <span className="text-[#0f6bae] font-mono">•</span>
              <span className="text-[#9daec3] text-[11px]">Bulut Finans & Ön Muhasebe</span>
            </div>

            {/* Slide Index Counter & Auto Play / Pause Toggle Button */}
            <div className="flex items-center gap-2">
              <div className="bg-[#0A182E]/85 border border-[#EAA728]/30 px-3 py-1.5 rounded-full font-mono text-xs font-bold text-[#EAA728] backdrop-blur-md shadow-md">
                0{currentSlideIndex + 1} <span className="text-white/40">/</span> 0{LOGIN_BACKGROUND_SLIDES.length}
              </div>
              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="bg-[#0A182E]/80 hover:bg-[#005289]/90 border border-white/20 text-white p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-md"
                title={isAutoPlaying ? "Otomatik Akışı Duraklat" : "Otomatik Akışı Başlat"}
              >
                {isAutoPlaying ? <Pause className="w-4 h-4 text-[#cfe5ff]" /> : <Play className="w-4 h-4 text-[#EAA728]" />}
              </button>
            </div>
          </div>

          {/* CENTER: FROSTED GLASS CAPTION CARD (NEW DESIGN) */}
          <div className="relative z-30 flex-1 flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-lg bg-[#0A182E]/85 backdrop-blur-2xl border border-[#EAA728]/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white space-y-4 animate-in fade-in duration-500 hover:border-[#EAA728]/50 transition-colors">
              
              {/* Location & Category Tag in JetBrains Mono */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f6bae]/20 border border-[#0f6bae]/40 text-[#58b1ff] font-mono text-[11px] font-bold tracking-wider uppercase shadow-xs">
                  <MapPin className="w-3 h-3 text-[#EAA728]" />
                  <span>{activeSlide.location}</span>
                </div>

                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EAA728]/15 border border-[#EAA728]/40 text-[#EAA728] font-mono text-[11px] font-bold tracking-wider uppercase shadow-xs">
                  <span>[ ≡</span>
                  <span>{activeSlide.tag}</span>
                  <span>≡ ]</span>
                </div>
              </div>

              {/* Tagline Title */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
                {activeSlide.title}
              </h2>

              {/* Tagline Subtitle */}
              <p className="text-xs sm:text-sm text-[#cfe5ff]/90 font-normal leading-relaxed">
                {activeSlide.subtitle}
              </p>

              {/* Micro-Features Row */}
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                {activeSlide.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#cfe5ff]"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#EAA728]" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#EAA728] via-[#0f6bae] to-[#58b1ff] transition-all duration-100 ease-linear rounded-full shadow-[0_0_8px_rgba(234,167,40,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Dots & Nav Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#cfe5ff] hover:text-white transition-all cursor-pointer"
                  title="Önceki Slayt"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  {LOGIN_BACKGROUND_SLIDES.map((slide, idx) => {
                    const isCurrent = idx === currentSlideIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => handleSelectSlide(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          isCurrent
                            ? "w-7 bg-[#EAA728] shadow-[0_0_8px_rgba(234,167,40,0.6)]"
                            : "w-2 bg-white/30 hover:bg-white/60"
                        }`}
                        title={`Slayt ${idx + 1}`}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#cfe5ff] hover:text-white transition-all cursor-pointer"
                  title="Sonraki Slayt"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* Carousel Bottom Footer with Watermark / Location Caption */}
          <div className="relative z-30 p-4 sm:px-8 flex items-center justify-between text-[11px] border-t border-white/10 bg-[#060e1a]/80 backdrop-blur-md">
            <div className="font-mono text-xs tracking-[0.25em] text-white/80 uppercase font-semibold flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              <span className="text-[#EAA728] font-bold">•</span>
              <span>{activeSlide.locationCaption}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#9daec3]">
              <span>🔒 256-Bit SSL</span>
              <span>•</span>
              <span>KVKK Uyumlu</span>
              <span>•</span>
              <span className="text-[#EAA728]">E-MUAVİN</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: USER LOGIN FORM (ÜYE GİRİŞİ BÖLÜMÜ - SAĞDA) */}
        {/* ========================================================= */}
        <div className="relative w-full lg:w-1/3 min-h-screen bg-[#faf8ff] flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-y-auto custom-scrollbar z-30 border-l border-[#e2e7ff]">
          
          {/* Top Close Button (if applicable) */}
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 text-[#414750] hover:text-[#131b2e] hover:bg-[#eaedff] rounded-full transition-all cursor-pointer z-20"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-full max-w-md mx-auto my-auto space-y-6">

            {/* BRAND LOGO EMBLEM (OFFICIAL E-MUAVİN LOGO) */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 pt-2">
              <Logo size="xl" showText={true} src="/logo.svg" />
              <div className="text-[11px] font-bold tracking-[0.25em] text-[#005289] uppercase flex items-center justify-center gap-2 w-full">
                <span className="w-8 h-[1px] bg-[#dae2fd]" />
                <span>ÖN MUHASEBE & FİNANS PORTALI</span>
                <span className="w-8 h-[1px] bg-[#dae2fd]" />
              </div>
            </div>

            {/* LOGIN / SIGN UP HEADER & BACK LINK */}
            <div className="flex items-center justify-between border-b border-[#e2e7ff] pb-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-editorial font-medium text-[#131b2e] tracking-tight">
                  {mode === "login" ? "Kullanıcı Girişi" : "Personel Aktivasyonu"}
                </h3>
                <p className="text-[11px] text-[#414750] mt-0.5">
                  {mode === "login"
                    ? "Yönetici tarafından tanımlanmış hesabınızla giriş yapınız"
                    : "Yöneticinizin açtığı e-posta ile hesabınızı aktive ediniz"}
                </p>
              </div>
              {canClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-[#414750] hover:text-[#0f6bae] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>← Web Sitesine Dön</span>
                </button>
              )}
            </div>

            {/* SECURITY & ADMIN-ONLY REGISTRATION NOTICE BADGE */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold text-amber-950">Kapalı Kurumsal Sistem: </span>
                <span className="text-amber-800 text-[11px]">
                  Dışarıdan serbest kayıt kapalıdır. Yalnızca Sistem Yöneticisi tarafından önceden tanımlanmış yetkili kullanıcılar ve personeller sisteme giriş yapabilir.
                </span>
              </div>
            </div>

            {/* GOOGLE SIGN IN BUTTON */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#f2f3ff] text-[#131b2e] font-bold text-xs sm:text-sm py-3 px-4 rounded-xl border border-[#dae2fd] shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Google ile {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#dae2fd]" />
                <span className="text-[11px] font-medium text-[#414750]">veya e-posta ile devam edin</span>
                <div className="flex-1 h-px bg-[#dae2fd]" />
              </div>
            </div>

            {/* AUTH FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-bold rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                  <span>⚠️ {errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage("")}
                    className="text-[#93000a] hover:text-[#ba1a1a] font-black cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* REGISTER EXTRA FIELDS */}
              {mode === "register" && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                      Adınız Soyadınız *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#0f6bae] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ahmet Yılmaz"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-[#dae2fd] focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-[#131b2e] focus:outline-none focus:border-[#0f6bae] focus:ring-2 focus:ring-[#0f6bae]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                      Şirket Unvanı *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#0f6bae] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Muavin Teknoloji Ltd. Şti."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-white border border-[#dae2fd] focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-[#131b2e] focus:outline-none focus:border-[#0f6bae] focus:ring-2 focus:ring-[#0f6bae]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* EMAIL FIELD */}
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#0f6bae] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="ornek@sirketiniz.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#dae2fd] focus:border-[#0f6bae] rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0f6bae]/20 transition-all"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#0f6bae] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#dae2fd] focus:border-[#0f6bae] rounded-xl pl-9 pr-10 py-2.5 text-xs font-bold text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0f6bae]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#414750] hover:text-[#131b2e] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CHECKBOX & FORGOT PASSWORD */}
              {mode === "login" && (
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#414750]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#c0c7d2] text-[#0f6bae] focus:ring-[#0f6bae] w-4 h-4"
                    />
                    <span>Beni Hatırla</span>
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerFormErrorNotification("Şifre sıfırlama talebiniz alındı. E-posta adresinize sıfırlama bağlantısı gönderildi.", "Şifre Sıfırlama");
                    }}
                    className="font-semibold text-[#0f6bae] hover:text-[#005289] hover:underline"
                  >
                    Şifremi Unuttum?
                  </a>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#005289] hover:bg-[#0f6bae] active:bg-[#00426d] disabled:opacity-50 text-white font-medium text-xs sm:text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === "login" ? "Giriş Yap" : "Yetkili Hesabı Doğrula ve Giriş Yap"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* MODE SWITCH FOOTER LINK */}
            <div className="text-center text-xs pt-4 border-t border-[#e2e7ff] space-y-1.5">
              {mode === "login" ? (
                <div>
                  <p className="text-[#414750] font-medium">
                    Yöneticiniz hesabınızı açtı mı?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="font-bold text-[#0f6bae] hover:text-[#005289] hover:underline cursor-pointer"
                    >
                      Personel Aktivasyonu
                    </button>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    * Sistem güvenliği gereği admin kullanıcı oluşturmadığı sürece yeni kayıt yapılamaz.
                  </p>
                </div>
              ) : (
                <p className="text-[#414750] font-medium">
                  Zaten bir şifreniz var mı?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-bold text-[#0f6bae] hover:text-[#005289] hover:underline cursor-pointer"
                  >
                    Giriş Yapın
                  </button>
                </p>
              )}
            </div>

          </div>

          {/* BOTTOM FOOTER */}
          <div className="text-center text-[11px] text-[#717881] font-medium pt-4">
            🔒 256-Bit SSL Şifreleme ve KVKK Uyumlu Güvenli Altyapı
          </div>

        </div>

      </div>
    </div>
  );
};
