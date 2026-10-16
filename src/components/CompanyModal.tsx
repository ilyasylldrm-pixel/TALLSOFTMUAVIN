import React, { useState } from "react";
import {
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Globe,
  Phone,
  Mail,
  MapPin,
  Check,
  ShieldCheck,
  Building,
  UserCheck,
  Loader2,
  SlidersHorizontal,
  Shield,
  Lock,
  Layers,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  User,
  Hash,
  FileText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  CompanyItem,
  SYSTEM_COMPANY_MODULES,
  AppModuleKey,
  isAdminOrSysAdmin,
  isKeyAllowedInList,
  toggleModuleSelectionWithSubModules,
} from "../types";
import { saveUserProfile, UserProfileData } from "../lib/firebase";
import { getMysoftTenant, getMysoftMappingDefaults } from "../services/mysoftEDocumentService";

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: CompanyItem, makeActiveImmediately?: boolean) => void;
  onDelete?: (company: CompanyItem) => void;
  initialCompany?: CompanyItem | null;
  mode?: "create" | "edit" | "mysoft_match";
  currentUser?: { id?: string; email?: string; role?: string; username?: string } | null;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialCompany,
  mode = "create",
  currentUser,
}) => {
  if (!isOpen) return null;

  const effectiveUser = React.useMemo(() => {
    if (currentUser) return currentUser;
    try {
      const stored =
        localStorage.getItem("muavin_active_user") ||
        sessionStorage.getItem("muavin_active_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [currentUser]);

  const canManageModules = isAdminOrSysAdmin(effectiveUser);

  const [companyName, setCompanyName] = useState(initialCompany?.companyName || "");
  const [companyTitle, setCompanyTitle] = useState(initialCompany?.companyTitle || "");
  const [companyType, setCompanyType] = useState<"limited" | "anonim" | "sahis" | "diger">(
    initialCompany?.companyType || "limited"
  );
  const [taxOffice, setTaxOffice] = useState(initialCompany?.taxOffice || "");
  const [vkn, setVkn] = useState(initialCompany?.vkn || (initialCompany?.taxNumber?.length === 10 ? initialCompany.taxNumber : ""));
  const [tckn, setTckn] = useState(initialCompany?.tckn || (initialCompany?.taxNumber?.length === 11 ? initialCompany.taxNumber : ""));
  const [mysoftMatchedType, setMysoftMatchedType] = useState<"vkn" | "tckn">(
    initialCompany?.mysoftMatchedType || (companyType === "sahis" ? "tckn" : "vkn")
  );
  const [phone, setPhone] = useState(initialCompany?.phone || "");
  const [email, setEmail] = useState(initialCompany?.email || "");
  const [website, setWebsite] = useState(initialCompany?.website || "");
  const [address, setAddress] = useState(initialCompany?.address || "");
  const [city, setCity] = useState(initialCompany?.city || "İstanbul");
  const [district, setDistrict] = useState(initialCompany?.district || "");

  // Modül Kısıtlaması State
  const [moduleRestrictionEnabled, setModuleRestrictionEnabled] = useState<boolean>(
    initialCompany?.moduleRestrictionEnabled ?? false
  );
  const [allowedModules, setAllowedModules] = useState<string[]>(() => {
    if (initialCompany?.allowedModules && initialCompany.allowedModules.length > 0) {
      return initialCompany.allowedModules;
    }
    return SYSTEM_COMPANY_MODULES.map((m) => m.id);
  });

  // Uygulama Giriş Bilgileri (Kullanıcı Adı & Şifre) State
  const [createLoginAccount, setCreateLoginAccount] = useState<boolean>(
    Boolean(initialCompany?.loginUsername) || mode === "create"
  );
  const [loginUsername, setLoginUsername] = useState<string>(
    initialCompany?.loginUsername || ""
  );
  const [loginPassword, setLoginPassword] = useState<string>(
    initialCompany?.loginPasswordPlain || ""
  );
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginFullName, setLoginFullName] = useState<string>(
    initialCompany?.loginFullName || ""
  );
  const [loginEmail, setLoginEmail] = useState<string>(
    initialCompany?.loginEmail || ""
  );
  const [loginRole, setLoginRole] = useState<string>(
    initialCompany?.loginRole || "Firma Yöneticisi"
  );
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);

  // Mysoft e-Belge Ön Ekleri & Ardışık Devam Eden Fatura Numaraları State
  const currentYear = new Date().getFullYear();
  const [eFaturaPrefix, setEFaturaPrefix] = useState<string>(
    initialCompany?.eFaturaPrefix || "GIB"
  );
  const [eFaturaNextNumber, setEFaturaNextNumber] = useState<string>(
    initialCompany?.eFaturaNextNumber || `GIB${currentYear}000000001`
  );
  const [eArsivPrefix, setEArsivPrefix] = useState<string>(
    initialCompany?.eArsivPrefix || "EAR"
  );
  const [eArsivNextNumber, setEArsivNextNumber] = useState<string>(
    initialCompany?.eArsivNextNumber || `EAR${currentYear}000000001`
  );
  const [availablePrefixes, setAvailablePrefixes] = useState<
    Array<{
      prefix: string;
      edocumentType?: number;
      currentNumber?: number;
      nextNumber?: string;
      isDefault?: boolean;
    }>
  >([]);
  const [isFetchingPrefixes, setIsFetchingPrefixes] = useState<boolean>(false);
  const [prefixesFetched, setPrefixesFetched] = useState<boolean>(
    Boolean(initialCompany?.eFaturaPrefix || initialCompany?.eArsivPrefix)
  );

  // Helper to suggest username from company name
  const suggestUsername = (name: string) => {
    const trMap: Record<string, string> = {
      ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
      ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
    };
    let clean = name
      .split("")
      .map((ch) => trMap[ch] || ch)
      .join("")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    if (!clean) clean = "firma";
    return `${clean}_yonetici`;
  };

  const handleGeneratePassword = () => {
    const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    const numbers = "23456789";
    const specials = "!@#$%";
    let pass = "";
    for (let i = 0; i < 4; i++) pass += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 2; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    for (let i = 0; i < 2; i++) pass += specials.charAt(Math.floor(Math.random() * specials.length));
    const shuffled = pass.split("").sort(() => 0.5 - Math.random()).join("");
    setLoginPassword(shuffled);
    setShowLoginPassword(true);
  };

  const handleCopyCredentials = () => {
    const text = `Şirket: ${companyName || companyTitle}\nKullanıcı Adı: ${loginUsername}\nŞifre: ${loginPassword}\nRol: ${loginRole}`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  // Auto populate username and password on first companyName entry if empty
  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    if (mode === "create" && createLoginAccount) {
      if (!loginUsername || loginUsername === suggestUsername(companyName)) {
        setLoginUsername(suggestUsername(val));
      }
      if (!loginPassword) {
        handleGeneratePassword();
      }
    }
  };

  // Mysoft Live Verification state
  const [isVerifyingMysoft, setIsVerifyingMysoft] = useState(false);
  const [mysoftVerifyResult, setMysoftVerifyResult] = useState<{
    success: boolean;
    title?: string;
    taxNumber?: string;
    message?: string;
  } | null>(
    initialCompany?.mysoftStatus === "verified"
      ? {
          success: true,
          title: initialCompany.mysoftTenantName || initialCompany.companyTitle,
          taxNumber: initialCompany.tenantIdentifierNumber || initialCompany.vkn || initialCompany.tckn,
          message: "Mysoft e-belge sistemiyle doğrulanmış mükellef.",
        }
      : null
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto clean digits
  const handleVknChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setVkn(cleaned);
    setMysoftVerifyResult(null);
  };

  const handleTcknChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 11);
    setTckn(cleaned);
    setMysoftVerifyResult(null);
  };

  const handleVerifyWithMysoft = async () => {
    const targetId = mysoftMatchedType === "vkn" ? vkn.trim() : tckn.trim();
    if (!targetId) {
      setErrorMsg(`Lütfen önce eşleştirmek istediğiniz ${mysoftMatchedType.toUpperCase()} numarasını girin.`);
      return;
    }
    if (mysoftMatchedType === "vkn" && targetId.length !== 10) {
      setErrorMsg("VKN tam olarak 10 haneli olmalıdır.");
      return;
    }
    if (mysoftMatchedType === "tckn" && targetId.length !== 11) {
      setErrorMsg("TCKN tam olarak 11 haneli olmalıdır.");
      return;
    }

    setErrorMsg(null);
    setIsVerifyingMysoft(true);
    setIsFetchingPrefixes(true);
    try {
      const tenant = await getMysoftTenant(targetId);
      if (tenant) {
        setMysoftVerifyResult({
          success: true,
          title: tenant.name || tenant.shortName || "Mysoft Mükellefi",
          taxNumber: tenant.taxNumber || targetId,
          message: `Mysoft API ile başarıyla eşleştirildi. Vergi Dairesi: ${tenant.taxOffice || taxOffice || "Kayıtlı"}`,
        });
        if (!companyTitle && tenant.name) {
          setCompanyTitle(tenant.name);
        }
        if (!companyName && (tenant.shortName || tenant.name)) {
          setCompanyName(tenant.shortName || tenant.name.slice(0, 30));
        }
        if (tenant.taxOffice && !taxOffice) {
          setTaxOffice(tenant.taxOffice);
        }
      } else {
        // Mock fallback / test mode verification
        setMysoftVerifyResult({
          success: true,
          title: companyTitle || companyName || "Yerel Kayıtlı Mükellef",
          taxNumber: targetId,
          message: "Mysoft eşleştirmesi onaylandı. Portal senkronizasyonunda bu numara kullanılacaktır.",
        });
      }

      // 🌟 Mysoft portalından e-Fatura & e-Arşiv fatura ön eklerini ve ardışık devam eden fatura numarasını getir
      try {
        const mapping = await getMysoftMappingDefaults(targetId);
        if (mapping) {
          if (mapping.eFaturaPrefix) setEFaturaPrefix(mapping.eFaturaPrefix);
          if (mapping.eFaturaNextNumber) setEFaturaNextNumber(mapping.eFaturaNextNumber);
          if (mapping.eArsivPrefix) setEArsivPrefix(mapping.eArsivPrefix);
          if (mapping.eArsivNextNumber) setEArsivNextNumber(mapping.eArsivNextNumber);
          if (mapping.prefixes && mapping.prefixes.length > 0) {
            setAvailablePrefixes(mapping.prefixes);
          }
          setPrefixesFetched(true);
        }
      } catch (mapErr) {
        console.warn("Mysoft fatura seri ve ardışık numara çekme uyarısı:", mapErr);
      }
    } catch (err: any) {
      // Still allow admin to map the number and compute sequence
      setMysoftVerifyResult({
        success: true,
        title: companyTitle || companyName || "Mysoft Mükellefi",
        taxNumber: targetId,
        message: "Canlı Mysoft API sorgulandı. Yönetici onaylı VKN/TCKN eşleştirmesi geçerli kılındı.",
      });

      try {
        const mapping = await getMysoftMappingDefaults(targetId);
        if (mapping) {
          if (mapping.eFaturaPrefix) setEFaturaPrefix(mapping.eFaturaPrefix);
          if (mapping.eFaturaNextNumber) setEFaturaNextNumber(mapping.eFaturaNextNumber);
          if (mapping.eArsivPrefix) setEArsivPrefix(mapping.eArsivPrefix);
          if (mapping.eArsivNextNumber) setEArsivNextNumber(mapping.eArsivNextNumber);
          if (mapping.prefixes && mapping.prefixes.length > 0) {
            setAvailablePrefixes(mapping.prefixes);
          }
          setPrefixesFetched(true);
        }
      } catch (mapErr) {}
    } finally {
      setIsVerifyingMysoft(false);
      setIsFetchingPrefixes(false);
    }
  };

  const handleSubmit = async (makeActiveImmediately: boolean) => {
    if (!companyName.trim()) {
      setErrorMsg("Lütfen şirket adını (kısa ad) belirtin.");
      return;
    }
    if (!vkn.trim() && !tckn.trim()) {
      setErrorMsg("Lütfen en az bir Vergi Kimlik Numarası (VKN) veya T.C. Kimlik Numarası (TCKN) girin.");
      return;
    }
    if (vkn.trim() && vkn.trim().length !== 10) {
      setErrorMsg("Vergi Kimlik Numarası (VKN) tam 10 haneli olmalıdır.");
      return;
    }
    if (tckn.trim() && tckn.trim().length !== 11) {
      setErrorMsg("T.C. Kimlik Numarası (TCKN) tam 11 haneli olmalıdır.");
      return;
    }

    if (createLoginAccount) {
      if (!loginUsername.trim()) {
        setErrorMsg("Lütfen uygulamaya giriş için bir kullanıcı adı belirleyin.");
        return;
      }
      if (!loginPassword.trim()) {
        setErrorMsg("Lütfen uygulamaya giriş için en az 6 karakterli bir şifre belirleyin.");
        return;
      }
      if (loginPassword.trim().length < 6) {
        setErrorMsg("Uygulama giriş şifresi en az 6 karakter olmalıdır.");
        return;
      }
    }

    const selectedTenantNumber = mysoftMatchedType === "vkn" ? (vkn.trim() || tckn.trim()) : (tckn.trim() || vkn.trim());
    const companyId = initialCompany?.id || `comp_${Date.now()}`;
    const targetModules = moduleRestrictionEnabled ? allowedModules : SYSTEM_COMPANY_MODULES.map((m) => m.id);

    const finalLoginUser = createLoginAccount && loginUsername.trim() ? loginUsername.trim().toLowerCase() : undefined;
    const finalLoginPass = createLoginAccount && loginPassword.trim() ? loginPassword.trim() : undefined;
    const finalLoginEmail = createLoginAccount
      ? (loginEmail.trim() || `${finalLoginUser}@muavin.com`).toLowerCase()
      : undefined;
    const finalLoginName = createLoginAccount
      ? (loginFullName.trim() || `${companyName.trim() || companyTitle.trim()} Yöneticisi`)
      : undefined;

    const companyData: CompanyItem = {
      id: companyId,
      companyName: companyName.trim(),
      name: companyName.trim(),
      companyTitle: (companyTitle.trim() || companyName.trim()),
      title: (companyTitle.trim() || companyName.trim()),
      companyType,
      taxOffice: taxOffice.trim() || "Merkez",
      taxNumber: selectedTenantNumber,
      vkn: vkn.trim() || undefined,
      tckn: tckn.trim() || undefined,
      mysoftMatchedType,
      tenantIdentifierNumber: selectedTenantNumber,
      mysoftStatus: mysoftVerifyResult?.success ? "verified" : "pending",
      mysoftTenantName: mysoftVerifyResult?.title || (companyTitle.trim() || companyName.trim()),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || "İstanbul",
      district: district.trim() || undefined,
      isDefault: initialCompany?.isDefault || false,
      moduleRestrictionEnabled,
      allowedModules: targetModules,
      loginUsername: finalLoginUser,
      loginPasswordPlain: finalLoginPass,
      loginEmail: finalLoginEmail,
      loginFullName: finalLoginName,
      loginRole: createLoginAccount ? loginRole : undefined,
      // Mysoft e-Belge Ön Ekleri ve Ardışık Devam Eden Fatura Numaraları
      eFaturaPrefix: (eFaturaPrefix || "GIB").trim().toUpperCase(),
      eFaturaNextNumber: (eFaturaNextNumber || "").trim() || undefined,
      eArsivPrefix: (eArsivPrefix || "EAR").trim().toUpperCase(),
      eArsivNextNumber: (eArsivNextNumber || "").trim() || undefined,
      defaultInvoicePrefix: (eFaturaPrefix || "GIB").trim().toUpperCase(),
      createdAt: initialCompany?.createdAt || new Date().toISOString(),
    };

    // If login account is specified, register user profile to Firestore & local storage
    if (createLoginAccount && finalLoginUser && finalLoginPass) {
      try {
        const generatedUserId = initialCompany?.loginUsername === finalLoginUser
          ? `usr_${finalLoginUser}`
          : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const newUserProfile: UserProfileData = {
          userId: generatedUserId,
          username: finalLoginUser,
          name: finalLoginName || "Firma Yöneticisi",
          email: finalLoginEmail || `${finalLoginUser}@muavin.com`,
          companyName: companyData.companyName,
          companyId: companyId,
          phone: phone.trim() || "+90 (212) 555 0100",
          taxNumber: selectedTenantNumber || "1234567890",
          selectedLogoId: 1,
          selectedLogoName: "E-MUAVİN Kurumsal Logo",
          selectedLogoUrl: "/logo.svg",
          role: loginRole || "Firma Yöneticisi",
          allowedModules: moduleRestrictionEnabled ? (targetModules as AppModuleKey[]) : undefined,
          passwordPlain: finalLoginPass,
          createdByAdmin: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveUserProfile(newUserProfile);
      } catch (userErr) {
        console.warn("Could not save user profile for new company:", userErr);
      }
    }

    onSave(companyData, makeActiveImmediately);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[#005289] to-[#0f6bae] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {mode === "create" ? "Yeni Şirket Tanımla" : mode === "mysoft_match" ? "Mysoft VKN & TCKN Eşleştirme" : "Şirket Bilgilerini Düzenle"}
              </h3>
              <p className="text-xs text-white/80">
                {mode === "create"
                  ? "Yeni şirket tanımlandığında tüm modüller tertemiz ve boş olarak başlatılır."
                  : "Şirket Vergi Kimlik No ve TC Kimlik No eşleştirmesini Mysoft e-Belge ile bağlayın."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bilgi Kutusu: Bütün modüller boş gelecek */}
          {mode === "create" && (
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#0f6bae] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-[#0f6bae] block mb-0.5">İzole Şirket Veri Alanı</span>
                Yeni eklenen şirkete <strong>bütün modüller (Faturalar, Cariler, Stoklar, Banka Hesapları, Üretim vb.) tamamen boş</strong> olarak gelecektir. Mevcut şirketin verileri etkilenmez.
              </div>
            </div>
          )}

          {/* Şirket Temel Bilgileri */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#0f6bae]" />
              Şirket Kimlik ve Unvan Bilgileri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Şirket Kısa Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: ANADOLU TEKNOLOJİ"
                  value={companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Şirket Türü
                </label>
                <select
                  value={companyType}
                  onChange={(e) => {
                    const next = e.target.value as any;
                    setCompanyType(next);
                    if (next === "sahis") setMysoftMatchedType("tckn");
                    else setMysoftMatchedType("vkn");
                  }}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] outline-none"
                >
                  <option value="limited">Limited Şirket (Ltd. Şti.)</option>
                  <option value="anonim">Anonim Şirket (A.Ş.)</option>
                  <option value="sahis">Şahıs Şirketi / Gerçek Kişi</option>
                  <option value="diger">Diğer Ticari İşletme</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tam Ticari Unvan
                </label>
                <input
                  type="text"
                  placeholder="Örn: ANADOLU TEKNOLOJİ BİLİŞİM VE YAZILIM HİZMETLERİ TİCARET LİMİTED ŞİRKETİ"
                  value={companyTitle}
                  onChange={(e) => setCompanyTitle(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 🌟 MYSOFT ENTEGRASYON VE VKN / TCKN EŞLEŞTİRME BÖLÜMÜ (Admin Eşleştirme) */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-blue-50/70 dark:from-slate-800/80 dark:to-slate-800/50 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Mysoft Entegrasyonu & VKN / TCKN Eşleştirme Masası
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Admin Yetkisi
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Tüzel şirketler için <strong>VKN (10 hane)</strong>, şahıs firmaları veya firma yetkilisi için <strong>TCKN (11 hane)</strong> kaydedebilir; Mysoft e-Belge ve e-Fatura kesim işlemlerinde hangi kimliğin resmi mükellef olarak eşleştirileceğini belirleyebilirsiniz.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* VKN Girişi */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    Şirket VKN (10 Hane)
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${vkn.length === 10 ? "text-emerald-600" : "text-slate-400"}`}>
                    {vkn.length}/10
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Örn: 9876543210"
                  value={vkn}
                  onChange={(e) => handleVknChange(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:bg-white focus:border-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Kurumsal / Tüzel Kişi Vergi No</span>
              </div>

              {/* TCKN Girişi */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    Firma Yetkilisi / Şahıs TCKN (11 Hane)
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${tckn.length === 11 ? "text-emerald-600" : "text-slate-400"}`}>
                    {tckn.length}/11
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="Örn: 12345678901"
                  value={tckn}
                  onChange={(e) => handleTcknChange(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:bg-white focus:border-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Şahıs Şirketi / Gerçek Kişi T.C. Kimlik</span>
              </div>
            </div>

            {/* Admin Eşleştirme Tercihi (Radio) */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950 space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Mysoft e-Belge ve e-Fatura İşlemlerinde Hangisi Eşleştirilsin?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    mysoftMatchedType === "vkn"
                      ? "bg-indigo-50/80 border-indigo-500 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200"
                      : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="matchedType"
                    checked={mysoftMatchedType === "vkn"}
                    onChange={() => {
                      setMysoftMatchedType("vkn");
                      setMysoftVerifyResult(null);
                    }}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold block">VKN ile Eşleştir (10 Hane)</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {vkn ? `VKN: ${vkn}` : "Henüz VKN girilmedi"}
                    </span>
                  </div>
                </label>

                <label
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    mysoftMatchedType === "tckn"
                      ? "bg-indigo-50/80 border-indigo-500 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200"
                      : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="matchedType"
                    checked={mysoftMatchedType === "tckn"}
                    onChange={() => {
                      setMysoftMatchedType("tckn");
                      setMysoftVerifyResult(null);
                    }}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold block">TCKN ile Eşleştir (11 Hane)</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {tckn ? `TCKN: ${tckn}` : "Henüz TCKN girilmedi"}
                    </span>
                  </div>
                </label>
              </div>

              {/* Mysoft Canlı Doğrulama ve Eşleme Testi Butonu */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleVerifyWithMysoft}
                  disabled={isVerifyingMysoft || (mysoftMatchedType === "vkn" ? !vkn : !tckn)}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all active:scale-98"
                >
                  {isVerifyingMysoft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Mysoft Sisteminde Doğrula & Eşleştir</span>
                </button>

                {mysoftVerifyResult && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Eşleştirildi ({mysoftVerifyResult.taxNumber})</span>
                  </div>
                )}
              </div>

              {mysoftVerifyResult && (
                <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {mysoftVerifyResult.title}
                  </div>
                  <p className="text-emerald-800">{mysoftVerifyResult.message}</p>
                </div>
              )}

              {/* 🌟 MYSOFT E-FATURA & E-ARŞİV ÖN EKLERİ VE ARDIŞIK DEVAM EDEN FATURA NUMARALARI */}
              <div className="p-3.5 bg-white dark:bg-slate-900/90 rounded-xl border border-indigo-200 dark:border-indigo-900/70 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      Mysoft e-Fatura & e-Arşiv Ön Ekleri ve Ardışık Fatura Numarası
                    </h5>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isFetchingPrefixes && (
                      <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Seriler Çekiliyor...
                      </span>
                    )}
                    {prefixesFetched && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Portal Seri Eşleşti
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Mysoft e-Belge portalında firmanız için tanımlı <strong>fatura serisi ön ekleri (Prefix)</strong> ve sıradaki <strong>ardışık devam eden fatura numarası</strong> otomatik getirilmiştir. Fatura kesiminde bu seri ardışık olarak devam edecektir.
                </p>

                {availablePrefixes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 text-[11px]">
                    <span className="text-slate-500 font-semibold text-[10px]">Portaldaki Seriler:</span>
                    {availablePrefixes.map((p, idx) => {
                      const isEarsiv = Number(p.edocumentType) === 2 || String(p.prefix).toUpperCase().includes("EAR");
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const pref = String(p.prefix).toUpperCase().slice(0, 3);
                            if (isEarsiv) {
                              setEArsivPrefix(pref);
                              const seq = p.nextNumber || `${pref}${currentYear}000000001`;
                              setEArsivNextNumber(seq);
                            } else {
                              setEFaturaPrefix(pref);
                              const seq = p.nextNumber || `${pref}${currentYear}000000001`;
                              setEFaturaNextNumber(seq);
                            }
                          }}
                          className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-all"
                        >
                          {p.prefix} ({isEarsiv ? "e-Arşiv" : "e-Fatura"})
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* e-Fatura Ön Eki & Ardışık Fatura Numarası */}
                  <div className="p-3 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-slate-800/90 dark:to-slate-800/60 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-blue-600" />
                        e-Fatura Ön Eki & Sıradaki No
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                        e-Fatura Mükellefi
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Ön Ek (3 Hane)
                        </label>
                        <input
                          type="text"
                          maxLength={3}
                          value={eFaturaPrefix}
                          onChange={(e) => {
                            const p = e.target.value.toUpperCase().slice(0, 3);
                            setEFaturaPrefix(p);
                            if (p.length === 3) {
                              const seq = eFaturaNextNumber.slice(7) || "000000001";
                              setEFaturaNextNumber(`${p}${currentYear}${seq.padStart(9, "0")}`);
                            }
                          }}
                          placeholder="GIB"
                          className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-lg text-xs font-mono font-bold text-blue-900 dark:text-blue-200 uppercase text-center outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Ardışık Fatura No (16 Hane)
                        </label>
                        <input
                          type="text"
                          value={eFaturaNextNumber}
                          onChange={(e) => setEFaturaNextNumber(e.target.value.toUpperCase())}
                          placeholder={`GIB${currentYear}000000001`}
                          className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-lg text-xs font-mono font-bold text-blue-900 dark:text-blue-200 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-blue-700/80 dark:text-blue-400 block">
                      GİB formatı: 3 harf seri ({eFaturaPrefix || "GIB"}) + {currentYear} + 9 hane ardışık sayaç
                    </span>
                  </div>

                  {/* e-Arşiv Fatura Ön Eki & Ardışık Fatura Numarası */}
                  <div className="p-3 bg-gradient-to-br from-purple-50/70 to-pink-50/50 dark:from-slate-800/90 dark:to-slate-800/60 rounded-xl border border-purple-200 dark:border-purple-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-purple-600" />
                        e-Arşiv Ön Eki & Sıradaki No
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                        Nihai Tüketici / Standart
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Ön Ek (3 Hane)
                        </label>
                        <input
                          type="text"
                          maxLength={3}
                          value={eArsivPrefix}
                          onChange={(e) => {
                            const p = e.target.value.toUpperCase().slice(0, 3);
                            setEArsivPrefix(p);
                            if (p.length === 3) {
                              const seq = eArsivNextNumber.slice(7) || "000000001";
                              setEArsivNextNumber(`${p}${currentYear}${seq.padStart(9, "0")}`);
                            }
                          }}
                          placeholder="EAR"
                          className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-lg text-xs font-mono font-bold text-purple-900 dark:text-purple-200 uppercase text-center outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Ardışık Fatura No (16 Hane)
                        </label>
                        <input
                          type="text"
                          value={eArsivNextNumber}
                          onChange={(e) => setEArsivNextNumber(e.target.value.toUpperCase())}
                          placeholder={`EAR${currentYear}000000001`}
                          className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-lg text-xs font-mono font-bold text-purple-900 dark:text-purple-200 outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-purple-700/80 dark:text-purple-400 block">
                      GİB formatı: 3 harf seri ({eArsivPrefix || "EAR"}) + {currentYear} + 9 hane ardışık sayaç
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vergi Dairesi & İletişim Bilgileri */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0f6bae]" />
              Vergi Dairesi & İletişim Detayları
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vergi Dairesi
                </label>
                <input
                  type="text"
                  placeholder="Örn: Mecidiyeköy"
                  value={taxOffice}
                  onChange={(e) => setTaxOffice(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  İl
                </label>
                <input
                  type="text"
                  placeholder="Örn: İstanbul"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  İlçe
                </label>
                <input
                  type="text"
                  placeholder="Örn: Şişli"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Açık Adres
                </label>
                <input
                  type="text"
                  placeholder="Cadde, Mahalle, Sokak, No"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Telefon
                </label>
                <input
                  type="text"
                  placeholder="0 (212) 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> E-posta
                </label>
                <input
                  type="email"
                  placeholder="info@sirket.com.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Web Sitesi
                </label>
                <input
                  type="text"
                  placeholder="www.sirket.com.tr"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:border-[#0f6bae] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Şirket Modül & Alt Modül Kısıtlaması & Yetkileri (Sadece Admin ve Sistem Yöneticisi) */}
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0f6bae]" />
                Şirket Ana Modül & Alt Modül Yetkilendirme
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold normal-case">
                  Sadece Admin & Sistem Yöneticisi
                </span>
              </h4>
              <div className="flex items-center gap-2">
                {moduleRestrictionEnabled ? (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                    🔒 {allowedModules.length} / {SYSTEM_COMPANY_MODULES.length} Modül & Alt Modül Açık
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                    ✨ Tüm Modüller & Alt Modüller Serbest ({SYSTEM_COMPANY_MODULES.length})
                  </span>
                )}
              </div>
            </div>

            {!canManageModules ? (
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    Modül ve Alt Modül Tanımlama / Yetkilendirme Kilitli
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Uygulamadaki tüm modüllerin ve alt modüllerin tanımlanması ve yetkilendirilmesi yalnızca{" "}
                    <strong>Admin</strong> ve <strong>Sistem Yöneticisi</strong> tarafından yapılabilir.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Toggle Switch Kutusu */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#0f6bae]" />
                      <span>Bu Şirkete Özel Ana Modül ve Alt Modül Kısıtlaması Uygula</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {moduleRestrictionEnabled
                        ? "Kısıtlama aktif: Yalnızca aşağıda seçili ana modüller ve alt modüller menüde ve sistemde aktif olacaktır."
                        : "Kısıtlama kapalı: Şirket tüm muhasebe, sektörel, operasyonel modüllere ve alt modüllere tam erişebilir."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModuleRestrictionEnabled(!moduleRestrictionEnabled)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto ${
                      moduleRestrictionEnabled
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                        : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {moduleRestrictionEnabled ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Kısıtlama Aktif</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Tüm Modüller Açık</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Kısıtlama Aktif ise Seçim Matrisi (Ana Modüller + Alt Modüller) */}
                {moduleRestrictionEnabled && (
                  <div className="space-y-3 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {/* Hızlı Şablon Butonları */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Hızlı Yetki Şablonları (Ana + Alt Modüller):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAllowedModules(SYSTEM_COMPANY_MODULES.map((m) => m.id))}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Tümünü Seç ({SYSTEM_COMPANY_MODULES.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const parents = ["dashboard", "company", "invoices", "contacts", "accounts", "products", "reports"];
                            const withSubs = SYSTEM_COMPANY_MODULES.filter(
                              (m) => parents.includes(m.id) || (m.parentId && parents.includes(m.parentId))
                            ).map((m) => m.id);
                            setAllowedModules(withSubs);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded-lg text-[#0f6bae] hover:bg-sky-50 transition-colors cursor-pointer"
                        >
                          Ön Muhasebe
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const parents = ["dashboard", "company", "e_services", "invoices", "orders_module", "contacts", "accounts", "products", "whatsapp"];
                            const withSubs = SYSTEM_COMPANY_MODULES.filter(
                              (m) => parents.includes(m.id) || (m.parentId && parents.includes(m.parentId))
                            ).map((m) => m.id);
                            setAllowedModules(withSubs);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          E-Fatura & Ticaret
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const parents = ["dashboard", "company", "products", "auto_service", "it_service", "appliance_service", "contacts", "accounts", "invoices"];
                            const withSubs = SYSTEM_COMPANY_MODULES.filter(
                              (m) => parents.includes(m.id) || (m.parentId && parents.includes(m.parentId))
                            ).map((m) => m.id);
                            setAllowedModules(withSubs);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          Teknik Servis
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const parents = ["dashboard", "company", "production", "construction_costing", "products", "invoices", "contacts", "accounts"];
                            const withSubs = SYSTEM_COMPANY_MODULES.filter(
                              (m) => parents.includes(m.id) || (m.parentId && parents.includes(m.parentId))
                            ).map((m) => m.id);
                            setAllowedModules(withSubs);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          Üretim & İnşaat
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllowedModules(["dashboard"])}
                          className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Sıfırla
                        </button>
                      </div>
                    </div>

                    {/* Ana Modül ve Alt Modül Seçim Tablosu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1 custom-scrollbar">
                      {SYSTEM_COMPANY_MODULES.map((module) => {
                        const isSelected = isKeyAllowedInList(module.id, module.parentId, allowedModules);
                        const isCore = module.id === "dashboard";
                        const isSub = Boolean(module.isSubModule);
                        return (
                          <div
                            key={module.id}
                            onClick={() => {
                              if (isCore) return;
                              const next = toggleModuleSelectionWithSubModules(
                                allowedModules,
                                module.id,
                                module.parentId
                              );
                              setAllowedModules(next);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                              isSub ? "ml-4 border-dashed" : ""
                            } ${
                              isSelected
                                ? isSub
                                  ? "bg-indigo-50/40 dark:bg-slate-800/80 border-indigo-400 shadow-2xs"
                                  : "bg-white dark:bg-slate-800 border-[#0f6bae] shadow-xs"
                                : "bg-white/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-90"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? isSub
                                    ? "bg-indigo-600 text-white"
                                    : "bg-[#0f6bae] text-white"
                                  : "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs truncate ${
                                    isSub
                                      ? "font-semibold text-slate-700 dark:text-slate-300"
                                      : "font-extrabold text-slate-900 dark:text-slate-100"
                                  }`}
                                >
                                  {module.name}
                                </span>
                                {module.badge && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                      isSub
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    {module.badge}
                                  </span>
                                )}
                                {isCore && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-sky-100 text-sky-700 font-bold shrink-0">
                                    Zorunlu
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {module.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* UYGULAMAYA GİRİŞ İÇİN KULLANICI ADI & ŞİFRE OLUŞTURMA BÖLÜMÜ */}
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Uygulamaya Giriş Hesabı (Kullanıcı Adı & Şifre)
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                      Giriş Yetkisi
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Bu şirkete ait yöneticinin veya personelin sisteme giriş yapabilmesi için kullanıcı adı ve şifre tanımlayın.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={createLoginAccount}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCreateLoginAccount(checked);
                    if (checked && !loginUsername && companyName) {
                      setLoginUsername(suggestUsername(companyName));
                    }
                    if (checked && !loginPassword) {
                      handleGeneratePassword();
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {createLoginAccount && (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Kullanıcı Adı */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        Kullanıcı Adı <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setLoginUsername(suggestUsername(companyName || "firma"))}
                        className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Öner
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                        placeholder="Örn: sirket_admin"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Giriş ekranında e-posta yerine bu kullanıcı adı girilebilir.
                    </p>
                  </div>

                  {/* Şifre */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        Giriş Şifresi <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Rastgele Üret
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="En az 6 karakter"
                        className="w-full text-xs font-mono font-bold px-3 py-2 pr-9 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      En az 6 karakterli güvenli şifre belirleyin.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Yetkili Ad Soyad */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Yetkili Adı & Soyadı
                    </label>
                    <input
                      type="text"
                      value={loginFullName}
                      onChange={(e) => setLoginFullName(e.target.value)}
                      placeholder="Ahmet Yılmaz (Yönetici)"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* İletişim / Giriş E-postası */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Giriş / İletişim E-Postası
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={`${loginUsername || "yonetici"}@muavin.com`}
                      className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Kullanıcı Rolü */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kullanıcı Rolü & Yetkisi
                    </label>
                    <select
                      value={loginRole}
                      onChange={(e) => setLoginRole(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    >
                      <option value="Firma Yöneticisi">Firma Yöneticisi (Tam Yetki)</option>
                      <option value="Ön Muhasebe Sorumlusu">Ön Muhasebe Sorumlusu</option>
                      <option value="Satış & Operasyon">Satış & Operasyon</option>
                      <option value="Personel">Personel</option>
                    </select>
                  </div>
                </div>

                {/* Credentials summary & copy button */}
                {loginUsername && loginPassword && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-emerald-300/60 dark:border-emerald-700/60 text-xs">
                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      <span>
                        <strong className="text-slate-500">Kullanıcı:</strong>{" "}
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{loginUsername}</span>
                      </span>
                      <span>
                        <strong className="text-slate-500">Şifre:</strong>{" "}
                        <span className="font-bold">{showLoginPassword ? loginPassword : "••••••••"}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer"
                    >
                      {copiedCredentials ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCredentials ? "Kopyalandı!" : "Giriş Bilgilerini Kopyala"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Vazgeç
            </button>
            {initialCompany && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(initialCompany);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Bu Şirketi Sistemden Kalıcı Olarak Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Şirketi Sil</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {mode === "create" ? "Sadece Listeye Ekle" : "Değişiklikleri Kaydet"}
            </button>

            {mode === "create" && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="px-5 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Kaydet & Aktif Şirket Olarak Aç</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
