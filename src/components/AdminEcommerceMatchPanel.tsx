import React, { useState, useEffect, useMemo } from "react";
import { CompanyItem } from "../types";
import {
  MarketplaceId,
  MarketplaceStoreConfig,
} from "./ECommerceModule";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  syncCompanyEcommerceToCloud,
  pullLatestCompanyDataFromCloud,
} from "../services/systemSyncService";
import { formatCurrency } from "../utils/exportUtils";
import {
  Globe,
  Building2,
  Search,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Store,
  Sliders,
  X,
  Save,
} from "lucide-react";

interface AdminEcommerceMatchPanelProps {
  companies: CompanyItem[];
  activeCompanyId: string;
  initialSelectedCompanyId?: string | null;
  onSwitchCompany?: (companyId: string) => void;
  onNotifySuccess?: (msg: string) => void;
}

const MARKETPLACE_TEMPLATES: Record<
  MarketplaceId,
  {
    name: string;
    shortCode: string;
    badgeColor: string;
    accentBg: string;
    defaultCommission: number;
    defaultCargo: number;
    defaultWithholding: number;
    storeUrl: string;
  }
> = {
  trendyol: {
    name: "Trendyol Pazaryeri",
    shortCode: "TY",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
    accentBg: "#f27a1a",
    defaultCommission: 18.5,
    defaultCargo: 64.9,
    defaultWithholding: 1,
    storeUrl: "https://partner.trendyol.com",
  },
  trendyol_go: {
    name: "Trendyol Go (TGO Yemek)",
    shortCode: "TGO",
    badgeColor: "bg-orange-100 text-orange-900 border-orange-400",
    accentBg: "#ff5500",
    defaultCommission: 12.0,
    defaultCargo: 29.9,
    defaultWithholding: 1,
    storeUrl: "https://partner.tgoyemek.com",
  },
  ubereats: {
    name: "Uber Eats",
    shortCode: "UE",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    accentBg: "#06C167",
    defaultCommission: 15.0,
    defaultCargo: 24.9,
    defaultWithholding: 1,
    storeUrl: "https://merchants.ubereats.com",
  },
  hepsiburada: {
    name: "Hepsiburada Merchant",
    shortCode: "HB",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accentBg: "#ff6000",
    defaultCommission: 17.0,
    defaultCargo: 59.9,
    defaultWithholding: 1,
    storeUrl: "https://merchant.hepsiburada.com",
  },
  amazon: {
    name: "Amazon Türkiye (SP-API)",
    shortCode: "AMZ",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    accentBg: "#232f3e",
    defaultCommission: 12.5,
    defaultCargo: 52.0,
    defaultWithholding: 1,
    storeUrl: "https://sellercentral.amazon.com.tr",
  },
  n11: {
    name: "N11 Mağaza Paneli",
    shortCode: "N11",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
    accentBg: "#e20a17",
    defaultCommission: 15.0,
    defaultCargo: 58.0,
    defaultWithholding: 1,
    storeUrl: "https://so.n11.com",
  },
  ciceksepeti: {
    name: "Çiçeksepeti / Mizu",
    shortCode: "ÇS",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    accentBg: "#0059b3",
    defaultCommission: 19.0,
    defaultCargo: 62.0,
    defaultWithholding: 1,
    storeUrl: "https://satis.ciceksepeti.com",
  },
  shopify: {
    name: "Shopify Global Store",
    shortCode: "SHP",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    accentBg: "#008060",
    defaultCommission: 2.0,
    defaultCargo: 45.0,
    defaultWithholding: 0,
    storeUrl: "https://admin.shopify.com",
  },
  webstore: {
    name: "B2C Web Mağaza (WooCommerce / İkas)",
    shortCode: "WEB",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    accentBg: "#059669",
    defaultCommission: 2.49,
    defaultCargo: 49.0,
    defaultWithholding: 0,
    storeUrl: "https://magaza.sirketim.com.tr",
  },
};

export function getCompanyMatchedEcommerceStores(companyId: string): MarketplaceStoreConfig[] {
  try {
    const raw = localStorage.getItem(`muavin_ecommerce_v2_${companyId}_stores`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompanyMatchedEcommerceStores(
  companyId: string,
  stores: MarketplaceStoreConfig[],
  syncCloud: boolean = true
): void {
  try {
    localStorage.setItem(
      `muavin_ecommerce_v2_${companyId}_stores`,
      JSON.stringify(stores)
    );
    window.dispatchEvent(
      new CustomEvent("muavin:ecommerce-stores-updated", {
        detail: { companyId, stores },
      })
    );
    if (syncCloud) {
      void syncCompanyEcommerceToCloud(companyId, stores);
    }
  } catch {
    // ignore storage errors
  }
}

export const AdminEcommerceMatchPanel: React.FC<AdminEcommerceMatchPanelProps> = ({
  companies,
  activeCompanyId,
  initialSelectedCompanyId,
  onSwitchCompany,
  onNotifySuccess,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    initialSelectedCompanyId || activeCompanyId || companies[0]?.id || "comp_default"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);

  const handleRefreshCloudUpdates = async () => {
    setIsRefreshingCloud(true);
    try {
      await pullLatestCompanyDataFromCloud(undefined, true);
      if (selectedCompanyId) {
        const snap = await getDoc(doc(db, "system_settings", `company_data_${selectedCompanyId}`));
        if (snap.exists() && Array.isArray(snap.data().ecommerceStores)) {
          saveCompanyMatchedEcommerceStores(selectedCompanyId, snap.data().ecommerceStores, false);
          setCompanyStoresMap((prev) => ({
            ...prev,
            [selectedCompanyId]: snap.data().ecommerceStores,
          }));
        }
      }
      if (onNotifySuccess) {
        onNotifySuccess("Tüm cihazlardaki güncellemeler ve mağaza eşleştirmeleri buluttan başarıyla çekildi.");
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  // Map of companyId -> matched stores
  const [companyStoresMap, setCompanyStoresMap] = useState<
    Record<string, MarketplaceStoreConfig[]>
  >(() => {
    const map: Record<string, MarketplaceStoreConfig[]> = {};
    companies.forEach((c) => {
      map[c.id] = getCompanyMatchedEcommerceStores(c.id);
    });
    return map;
  });

  useEffect(() => {
    if (initialSelectedCompanyId) {
      setSelectedCompanyId(initialSelectedCompanyId);
    }
  }, [initialSelectedCompanyId]);

  useEffect(() => {
    const map: Record<string, MarketplaceStoreConfig[]> = {};
    companies.forEach((c) => {
      map[c.id] = getCompanyMatchedEcommerceStores(c.id);
    });
    setCompanyStoresMap(map);
  }, [companies]);

  // Diğer cihazlarda yapılan mağaza güncellemelerini hem sunucudan hem Firestore'dan anında çek
  useEffect(() => {
    let isMounted = true;
    const loadRemoteStores = async () => {
      if (!selectedCompanyId) return;
      let remoteStores: MarketplaceStoreConfig[] | null = null;
      try {
        const resp = await fetch(`/api/ecommerce/stores?companyId=${encodeURIComponent(selectedCompanyId)}`);
        if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json.stores) && json.stores.length > 0) {
            remoteStores = json.stores;
          }
        }
      } catch {}

      if (!remoteStores) {
        try {
          const snap = await getDoc(doc(db, "system_settings", `company_data_${selectedCompanyId}`));
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.ecommerceStores) && data.ecommerceStores.length > 0) {
              remoteStores = data.ecommerceStores;
            }
          }
        } catch {}
      }

      if (isMounted && remoteStores && Array.isArray(remoteStores)) {
        saveCompanyMatchedEcommerceStores(selectedCompanyId, remoteStores, false);
        setCompanyStoresMap((prev) => ({
          ...prev,
          [selectedCompanyId]: remoteStores!,
        }));
      }
    };

    void loadRemoteStores();

    const handleStoresUpdated = (e: any) => {
      const detail = e.detail;
      if (detail?.companyId && Array.isArray(detail?.stores)) {
        setCompanyStoresMap((prev) => ({
          ...prev,
          [detail.companyId]: detail.stores,
        }));
      }
    };
    window.addEventListener("muavin:ecommerce-stores-updated", handleStoresUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener("muavin:ecommerce-stores-updated", handleStoresUpdated);
    };
  }, [selectedCompanyId]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) || companies[0] || null,
    [companies, selectedCompanyId]
  );

  const selectedCompanyStores = useMemo(
    () => (selectedCompany ? companyStoresMap[selectedCompany.id] || [] : []),
    [companyStoresMap, selectedCompany]
  );

  // Add / Edit Store Match Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<{
    id: MarketplaceId;
    supplierId: string;
    integrationRefCode: string;
    apiKey: string;
    apiSecret: string;
    trendyolSecretKey: string;
    apiToken: string;
    commissionRate: number;
    shippingDeductionAvg: number;
    withholdingRate: number;
    autoInvoice: boolean;
    autoStockSync: boolean;
    storeUrl: string;
  }>({
    id: "trendyol",
    supplierId: "",
    integrationRefCode: "",
    apiKey: "",
    apiSecret: "",
    trendyolSecretKey: "",
    apiToken: "",
    commissionRate: 18.5,
    shippingDeductionAvg: 64.9,
    withholdingRate: 1,
    autoInvoice: true,
    autoStockSync: true,
    storeUrl: "https://partner.trendyol.com",
  });

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenAddStoreModal = (companyId: string, presetMp?: MarketplaceId) => {
    setSelectedCompanyId(companyId);
    const mpId = presetMp || "trendyol";
    const existing = (companyStoresMap[companyId] || []).find((s) => s.id === mpId);
    const tpl = MARKETPLACE_TEMPLATES[mpId];

    if (existing) {
      setFormState({
        id: existing.id,
        supplierId: existing.supplierId,
        integrationRefCode: existing.integrationRefCode || "",
        apiKey: existing.apiKey,
        apiSecret: existing.apiSecret,
        trendyolSecretKey: existing.trendyolSecretKey || "",
        apiToken: existing.apiToken || "",
        commissionRate: existing.commissionRate,
        shippingDeductionAvg: existing.shippingDeductionAvg,
        withholdingRate: existing.withholdingRate,
        autoInvoice: existing.autoInvoice,
        autoStockSync: existing.autoStockSync,
        storeUrl: existing.storeUrl || tpl.storeUrl,
      });
    } else {
      setFormState({
        id: mpId,
        supplierId: "",
        integrationRefCode: "",
        apiKey: "",
        apiSecret: "",
        trendyolSecretKey: "",
        apiToken: "",
        commissionRate: tpl.defaultCommission,
        shippingDeductionAvg: tpl.defaultCargo,
        withholdingRate: tpl.defaultWithholding,
        autoInvoice: true,
        autoStockSync: true,
        storeUrl: tpl.storeUrl,
      });
    }
    setIsModalOpen(true);
  };

  const syncTrendyolBackend = async (company: CompanyItem, config: MarketplaceStoreConfig) => {
    if (config.id !== "trendyol" && config.id !== "trendyol_go") return;
    if (!config.supplierId || !config.apiKey || !config.apiSecret) return;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-company-id": company.id,
      };
      if (auth.currentUser) {
        headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
      } else {
        const raw =
          window.localStorage.getItem("muavin_active_user") ||
          window.sessionStorage.getItem("muavin_active_user");
        const parsed = raw ? JSON.parse(raw) : null;
        const uid = String(parsed?.id || parsed?.userId || company.id).trim();
        headers.Authorization = `Bearer ${uid}`;
        headers["x-user-id"] = uid;
      }
      await fetch(
        `/api/marketplace/trendyol/connection?companyId=${encodeURIComponent(company.id)}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            companyId: company.id,
            sellerId: config.supplierId,
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
            trendyolSecretKey: config.trendyolSecretKey || undefined,
            autoInvoice: config.autoInvoice,
            tenantIdentifierNumber: company.vkn || company.tckn || company.taxNumber || "",
            skipValidation: true,
          }),
        }
      );
    } catch {
      /* çevrimdışı modda yerel eşleşme korunur */
    }
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    const tpl = MARKETPLACE_TEMPLATES[formState.id];
    const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");

    const newConfig: MarketplaceStoreConfig = {
      id: formState.id,
      name: tpl.name,
      shortCode: tpl.shortCode,
      badgeColor: tpl.badgeColor,
      accentBg: tpl.accentBg,
      supplierId: formState.supplierId.trim(),
      integrationRefCode: formState.integrationRefCode.trim() || undefined,
      apiKey: formState.apiKey.trim(),
      apiSecret: formState.apiSecret.trim(),
      trendyolSecretKey:
        formState.id === "trendyol" || formState.id === "trendyol_go"
          ? formState.trendyolSecretKey.trim() || undefined
          : undefined,
      apiToken: formState.apiToken.trim() || undefined,
      commissionRate: Number(formState.commissionRate),
      shippingDeductionAvg: Number(formState.shippingDeductionAvg),
      withholdingRate: Number(formState.withholdingRate),
      autoInvoice: formState.autoInvoice,
      autoStockSync: formState.autoStockSync,
      isConnected: Boolean(formState.supplierId.trim() && formState.apiKey.trim()),
      lastSyncAt: nowStr,
      storeUrl: formState.storeUrl.trim() || tpl.storeUrl,
    };

    const currentList = companyStoresMap[selectedCompany.id] || [];
    const existsIdx = currentList.findIndex((s) => s.id === newConfig.id);
    const updatedList =
      existsIdx >= 0
        ? currentList.map((s, idx) => (idx === existsIdx ? newConfig : s))
        : [...currentList, newConfig];

    saveCompanyMatchedEcommerceStores(selectedCompany.id, updatedList);
    void syncTrendyolBackend(selectedCompany, newConfig);
    setCompanyStoresMap((prev) => ({
      ...prev,
      [selectedCompany.id]: updatedList,
    }));
    setIsModalOpen(false);
    if (onNotifySuccess) {
      onNotifySuccess(
        `"${selectedCompany.companyName}" şirketi için ${tpl.name} E-Ticaret eşleştirmesi kaydedildi.`
      );
    }
  };

  const handleRemoveMatch = (companyId: string, mpId: MarketplaceId) => {
    const currentList = companyStoresMap[companyId] || [];
    const updatedList = currentList.filter((s) => s.id !== mpId);
    saveCompanyMatchedEcommerceStores(companyId, updatedList);
    setCompanyStoresMap((prev) => ({
      ...prev,
      [companyId]: updatedList,
    }));
    const comp = companies.find((c) => c.id === companyId);
    const tpl = MARKETPLACE_TEMPLATES[mpId];
    if (onNotifySuccess) {
      onNotifySuccess(
        `"${comp?.companyName || "Şirket"}" bünyesindeki ${tpl.name} eşleştirmesi kaldırıldı.`
      );
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const q = searchTerm.toLowerCase();
    return companies.filter(
      (c) =>
        c.companyName?.toLowerCase().includes(q) ||
        c.companyTitle?.toLowerCase().includes(q) ||
        c.vkn?.includes(q) ||
        c.tckn?.includes(q) ||
        c.taxNumber?.includes(q) ||
        c.loginUsername?.toLowerCase().includes(q)
    );
  }, [companies, searchTerm]);

  const totalMatchedStoresCount = useMemo(
    () =>
      (Object.values(companyStoresMap) as MarketplaceStoreConfig[][]).reduce(
        (sum, list) => sum + list.length,
        0
      ),
    [companyStoresMap]
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0f6bae] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">
                Şirket Bazlı E-Ticaret & Pazaryeri API Eşleştirme Masası
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#0f6bae] border border-sky-200">
                Toplam {totalMatchedStoresCount} Aktif Mağaza Eşleşmesi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Sistemdeki şirketlerin VKN/TCKN kayıtlarını Trendyol, Hepsiburada, Amazon Türkiye, N11, Çiçeksepeti ve B2C Web Mağaza API bilgileriyle eşleştirin. Eşleştirilen mağazalar ilgili şirketin <strong>E-Ticaret Modülü &gt; Mağaza Entegrasyonları</strong> ekranına otomatik olarak yansır.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefreshCloudUpdates}
            disabled={isRefreshingCloud}
            className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-[#0f6bae] font-bold text-xs rounded-xl border border-sky-200 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title="Diğer cihazlarda yapılan tüm güncellemeleri ve mağazaları buluttan anında çek"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingCloud ? "animate-spin text-[#0f6bae]" : "text-[#0f6bae]"}`} />
            <span>{isRefreshingCloud ? "Buluttan Alınıyor..." : "Buluttan Güncellemeleri Al"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSecrets((prev) => !prev)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {showSecrets ? (
              <>
                <EyeOff className="w-4 h-4 text-slate-600" />
                <span>API Anahtarlarını Gizle</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-[#0f6bae]" />
                <span>API Anahtarlarını Göster</span>
              </>
            )}
          </button>

          {selectedCompany && (
            <button
              type="button"
              onClick={() => handleOpenAddStoreModal(selectedCompany.id)}
              className="px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ {selectedCompany.companyName} İçin Mağaza Eşleştir</span>
            </button>
          )}
        </div>
      </div>

      {/* Company Overview & Marketplace Matching Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Şirket adı, VKN, TCKN veya kullanıcı adı ile filtrele..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#0f6bae] outline-none"
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Kayıtlı Şirket: {filteredCompanies.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Şirket / İşletme</th>
                <th className="py-3.5 px-4 font-mono">Mükellef VKN / TCKN</th>
                <th className="py-3.5 px-4">Eşleşen Pazaryeri Mağazaları</th>
                <th className="py-3.5 px-4 text-center">Mağaza Sayısı</th>
                <th className="py-3.5 px-4 text-right">Eşleştirme İşlemleri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.map((comp) => {
                const matchedStores = companyStoresMap[comp.id] || [];
                const isSelected = selectedCompany?.id === comp.id;
                const isActive = comp.id === activeCompanyId;

                return (
                  <tr
                    key={comp.id}
                    onClick={() => setSelectedCompanyId(comp.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-sky-50/70" : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            isSelected
                              ? "bg-[#0f6bae] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{comp.companyName}</span>
                            {isActive && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Aktif Oturum
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {comp.companyTitle || comp.companyName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {comp.vkn
                        ? `VKN: ${comp.vkn}`
                        : comp.tckn
                        ? `TCKN: ${comp.tckn}`
                        : comp.taxNumber || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      {matchedStores.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Henüz pazaryeri mağazası eşleştirilmedi
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {matchedStores.map((st) => (
                            <span
                              key={st.id}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${st.badgeColor}`}
                            >
                              {st.shortCode} · ID: {st.supplierId || "—"}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] ${
                          matchedStores.length > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {matchedStores.length} Mağaza
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenAddStoreModal(comp.id)}
                          className="px-3 py-1.5 bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Mağaza Eşleştir</span>
                        </button>
                        {onSwitchCompany && !isActive && (
                          <button
                            type="button"
                            onClick={() => onSwitchCompany(comp.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Şirkete Geç
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Company Detailed Marketplace Cards */}
      {selectedCompany && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {selectedCompany.companyName} — Eşleştirilmiş Pazaryeri Mağazaları ({selectedCompanyStores.length})
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Mükellef VKN/TCKN:{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {selectedCompany.vkn || selectedCompany.tckn || selectedCompany.taxNumber || "—"}
                </span>{" "}
                · Aşağıdaki hızlı platform butonlarıyla yeni pazaryeri eşleştirmesi ekleyebilirsiniz.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(MARKETPLACE_TEMPLATES) as MarketplaceId[]).map((mpId) => {
                const tpl = MARKETPLACE_TEMPLATES[mpId];
                const isAlreadyMatched = selectedCompanyStores.some((s) => s.id === mpId);
                return (
                  <button
                    key={mpId}
                    type="button"
                    onClick={() => handleOpenAddStoreModal(selectedCompany.id, mpId)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-all flex items-center gap-1 ${
                      isAlreadyMatched
                        ? tpl.badgeColor
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{isAlreadyMatched ? "✓" : "+"}</span>
                    <span>{tpl.shortCode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCompanyStores.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Store className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs text-slate-500 font-medium">
                <strong>{selectedCompany.companyName}</strong> şirketi için henüz eşleştirilmiş bir e-ticaret mağazası bulunmuyor.
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddStoreModal(selectedCompany.id, "trendyol")}
                className="px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Pazaryeri Mağazasını Eşleştir</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCompanyStores.map((st) => (
                <div
                  key={st.id}
                  className="rounded-xl border border-slate-200 p-4 flex flex-col justify-between bg-slate-50/40"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: st.accentBg }}
                        >
                          {st.shortCode}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">{st.name}</h5>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Satıcı ID: {st.supplierId || "—"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Eşleşti
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5 text-xs">
                      {(st.integrationRefCode || st.id === "trendyol_go") && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Entegrasyon Ref:</span>
                          <span className="font-mono text-[11px] font-semibold text-slate-700">
                            {st.integrationRefCode || "—"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">API Key:</span>
                        <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700">
                          <span>
                            {showSecrets
                              ? st.apiKey || "—"
                              : st.apiKey
                              ? `${st.apiKey.slice(0, 4)}••••••`
                              : "—"}
                          </span>
                          {st.apiKey && (
                            <button
                              type="button"
                              onClick={() => handleCopy(st.apiKey, `api_${selectedCompany.id}_${st.id}`)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {copiedKey === `api_${selectedCompany.id}_${st.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {(st.id === "trendyol" || st.id === "trendyol_go") && st.trendyolSecretKey && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">TRENDYOL_SECRET_KEY:</span>
                          <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700">
                            <span>
                              {showSecrets
                                ? st.trendyolSecretKey
                                : `${st.trendyolSecretKey.slice(0, 4)}••••${st.trendyolSecretKey.slice(-4)}`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(st.trendyolSecretKey!, `tsec_${selectedCompany.id}_${st.id}`)
                              }
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {copiedKey === `tsec_${selectedCompany.id}_${st.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {(st.apiToken || st.id === "trendyol_go" || st.id === "ubereats") && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Token:</span>
                          <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700">
                            <span>
                              {showSecrets
                                ? st.apiToken || "—"
                                : st.apiToken
                                ? `${st.apiToken.slice(0, 4)}••••••`
                                : "—"}
                            </span>
                            {st.apiToken && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(st.apiToken!, `tok_${selectedCompany.id}_${st.id}`)
                                }
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {copiedKey === `tok_${selectedCompany.id}_${st.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Komisyon / Kargo:</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          %{st.commissionRate} · {formatCurrency(st.shippingDeductionAvg)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Otomatik e-Fatura / Stok:</span>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {st.autoInvoice ? "e-Fatura Açık" : "Manuel"} ·{" "}
                          {st.autoStockSync ? "Stok Eşitleniyor" : "Stok Pasif"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddStoreModal(selectedCompany.id, st.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMatch(selectedCompany.id, st.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Kaldır</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT MARKETPLACE MATCH FOR COMPANY */}
      {isModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  E-Ticaret Pazaryeri Eşleştirmesi ({selectedCompany.companyName})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  VKN / TCKN:{" "}
                  <span className="font-mono font-bold">
                    {selectedCompany.vkn || selectedCompany.tckn || selectedCompany.taxNumber || "—"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatch} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pazaryeri Platformu *
                </label>
                <select
                  value={formState.id}
                  onChange={(e) => {
                    const mpId = e.target.value as MarketplaceId;
                    const tpl = MARKETPLACE_TEMPLATES[mpId];
                    const existing = selectedCompanyStores.find((s) => s.id === mpId);
                    setFormState({
                      id: mpId,
                      supplierId: existing?.supplierId || "",
                      integrationRefCode: existing?.integrationRefCode || "",
                      apiKey: existing?.apiKey || "",
                      apiSecret: existing?.apiSecret || "",
                      trendyolSecretKey: existing?.trendyolSecretKey || "",
                      apiToken: existing?.apiToken || "",
                      commissionRate: existing?.commissionRate ?? tpl.defaultCommission,
                      shippingDeductionAvg: existing?.shippingDeductionAvg ?? tpl.defaultCargo,
                      withholdingRate: existing?.withholdingRate ?? tpl.defaultWithholding,
                      autoInvoice: existing?.autoInvoice ?? true,
                      autoStockSync: existing?.autoStockSync ?? true,
                      storeUrl: existing?.storeUrl || tpl.storeUrl,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800"
                >
                  {(Object.keys(MARKETPLACE_TEMPLATES) as MarketplaceId[]).map((mpId) => (
                    <option key={mpId} value={mpId}>
                      {MARKETPLACE_TEMPLATES[mpId].name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {formState.id === "trendyol_go"
                      ? "Satıcı ID (Cari ID) *"
                      : "Satıcı ID (Supplier / Merchant ID) *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 849201"
                    value={formState.supplierId}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, supplierId: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mağaza / Panel Adresi
                  </label>
                  <input
                    type="text"
                    value={formState.storeUrl}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, storeUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {(formState.id === "trendyol_go" || formState.id === "ubereats") && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Entegrasyon Referans Kodu {formState.id === "trendyol_go" ? "*" : ""}
                  </label>
                  <input
                    type="text"
                    required={formState.id === "trendyol_go"}
                    placeholder="Örn: TGO-REF-948201"
                    value={formState.integrationRefCode}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, integrationRefCode: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    API Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="API Key girin..."
                    value={formState.apiKey}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, apiKey: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    API Secret {formState.id === "trendyol_go" ? "*" : ""}
                  </label>
                  <input
                    type="text"
                    required={formState.id === "trendyol_go"}
                    placeholder="API Secret girin..."
                    value={formState.apiSecret}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, apiSecret: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {(formState.id === "trendyol" || formState.id === "trendyol_go") && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0f6bae]" />
                      <span>TRENDYOL_SECRET_KEY (AES-256 Şifreleme Anahtarı)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const bytes = new Uint8Array(24);
                        window.crypto.getRandomValues(bytes);
                        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
                        setFormState((prev) => ({ ...prev, trendyolSecretKey: hex }));
                      }}
                      className="text-[11px] font-bold text-[#0f6bae] hover:underline cursor-pointer"
                    >
                      Otomatik Üret
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="En az 32 karakter rastgele anahtar (veya Otomatik Üret'e tıklayın)..."
                    value={formState.trendyolSecretKey}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, trendyolSecretKey: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              )}

              {(formState.id === "trendyol_go" || formState.id === "ubereats") && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Token {formState.id === "trendyol_go" ? "(TGO Yemek Eşleştirme Token) *" : "(OAuth / Access Token)"}
                  </label>
                  <input
                    type="text"
                    required={formState.id === "trendyol_go"}
                    placeholder="Token değerini girin..."
                    value={formState.apiToken}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, apiToken: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formState.autoInvoice}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, autoInvoice: e.target.checked }))
                    }
                    className="rounded border-slate-300"
                  />
                  <span>Otomatik e-Fatura / e-Arşiv Kesimi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formState.autoStockSync}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, autoStockSync: e.target.checked }))
                    }
                    className="rounded border-slate-300"
                  />
                  <span>Canlı Stok Senkronizasyonu</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f6bae] hover:bg-[#005289] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Eşleştirmeyi Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
