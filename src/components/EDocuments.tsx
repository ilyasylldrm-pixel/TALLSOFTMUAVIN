import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowUpFromLine,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  ExternalLink,
  FileCode2,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import type {
  CompanySettings,
  EDocumentDirection,
  ManagedCompany,
  MysoftEDocument,
} from "../types";
import {
  getMysoftEDocument,
  getMysoftConnectionStatus,
  getMysoftTenant,
  listMysoftEDocuments,
  listMysoftTenants,
  downloadMysoftEDocument,
  syncMysoftEDocuments,
  acceptMysoftEDocument,
  acknowledgeMysoftEDocument,
  denyMysoftEDocument,
  cancelMysoftEDocument,
  sendMysoftDraftEDocument,
  normalizeMysoftTenantIdentifier,
  type MysoftTenant,
} from "../services/mysoftEDocumentService";

export interface EDocumentsProps {
  /** The navigation item controls the API direction without exposing credentials to the browser. */
  direction?: EDocumentDirection;
  globalSearchTerm?: string;
  companySettings?: CompanySettings;
  /** Active accountant-managed taxpayer. Used for tenant routing and cache
   * isolation; the server still owns OAuth secrets. */
  activeCompany?: ManagedCompany;
  companyId?: string;
  tenantIdentifierNumber?: string;
  /** Optional local import hook. The default view keeps Mysoft records separate from local invoices. */
  onImportInvoice?: (document: MysoftEDocument) => void;
}

type SyncPeriod = "this_month" | "three_months" | "all";
type DownloadFormat = "pdf" | "xml";

const formatMoney = (value: unknown, currency = "TRY") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency === "₺" ? "TRY" : currency || "TRY",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
};

const asRecord = (document: MysoftEDocument): Record<string, any> =>
  document as Record<string, any>;

const documentDirection = (document: MysoftEDocument): EDocumentDirection => {
  const raw = String(
    asRecord(document).direction || asRecord(document).documentDirection || "",
  ).toLowerCase();
  return raw === "outbox" || raw === "outgoing" || raw === "outgoing_documents"
    ? "outbox"
    : "inbox";
};

const documentDate = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return (
    data.issueDate || data.documentDate || data.date || data.createdAt || ""
  );
};

const documentNumber = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return (
    data.documentNumber ||
    data.invoiceNumber ||
    data.documentNo ||
    data.number ||
    data.id ||
    "-"
  );
};

/**
 * Mysoft state/detail/file endpoints are keyed by invoiceETTN.  Older local
 * snapshots may only expose `uuid` or `id`, so keep those as compatibility
 * fallbacks but never prefer an internal id over an upstream ETTN.
 */
const documentIdentity = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return String(
    data.ettn || data.uuid || data.id || documentNumber(document) || "",
  );
};

const documentType = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return data.documentType || data.typeLabel || data.type || "e-Fatura";
};

const isArchiveDocument = (document: MysoftEDocument) =>
  String(documentType(document))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[ _-]/g, "")
    .includes("earsiv");

const documentStatus = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return String(data.statusLabel || data.status || data.state || "unknown");
};

const documentParty = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return (
    data.contactName ||
    data.partyName ||
    data.counterpartyName ||
    (documentDirection(document) === "inbox"
      ? data.senderName
      : data.receiverName) ||
    data.senderTitle ||
    data.receiverTitle ||
    "Belirtilmemiş cari"
  );
};

const documentTaxNumber = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return (
    data.taxNumber ||
    data.senderTaxNumber ||
    data.receiverTaxNumber ||
    data.vknTckn ||
    "-"
  );
};

const documentAmount = (document: MysoftEDocument) => {
  const data = asRecord(document);
  return (
    data.grandTotal ??
    data.totalAmount ??
    data.amount ??
    data.payableAmount ??
    data.total ??
    0
  );
};

const documentCurrency = (document: MysoftEDocument) => {
  const value =
    asRecord(document).currency || asRecord(document).currencyCode || "TRY";
  return value === "₺" ? "TRY" : String(value);
};

const statusTone = (status: string) => {
  const value = status.toLowerCase();
  if (
    ["accepted", "approved", "delivered", "sent", "completed", "success"].some(
      (item) => value.includes(item),
    )
  ) {
    return {
      label: status || "Başarılı",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    };
  }
  if (
    ["rejected", "cancelled", "canceled", "error", "failed"].some((item) =>
      value.includes(item),
    )
  ) {
    return {
      label: status || "Hatalı",
      className: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
    };
  }
  if (
    ["draft", "queued", "pending", "processing", "waiting"].some((item) =>
      value.includes(item),
    )
  ) {
    return {
      label: status || "Bekliyor",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock3,
    };
  }
  return {
    label: status || "Bilinmiyor",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: AlertCircle,
  };
};

const formatLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSyncRange = (period: SyncPeriod) => {
  const to = new Date();
  const from = new Date(to);
  if (period === "this_month") {
    from.setDate(1);
  } else if (period === "three_months") {
    from.setMonth(from.getMonth() - 2, 1);
  } else {
    // Mysoft period endpoints reject empty dates; "all" means last 12 months.
    from.setFullYear(from.getFullYear() - 1);
    from.setDate(1);
  }
  return {
    // Local calendar dates — toISOString() shifts the day in UTC+3.
    startDate: formatLocalIsoDate(from),
    endDate: formatLocalIsoDate(to),
  };
};

const normalizeDirection = (value?: EDocumentDirection): "inbox" | "outbox" =>
  value === "outbox" || value === "outgoing" ? "outbox" : "inbox";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (/tarih.*boş|boş.*tarih|startDate|endDate/i.test(error.message)) {
      return "Mysoft tarih aralığı istiyor. Dönem seçili olsa bile istekte startDate/endDate gitmeli; sayfayı yenileyip tekrar deneyin.";
    }
    if (/00164|firma kaydı bulunamadı/i.test(error.message)) {
      return "Mysoft 00164: bu VKN/TCKN erişim anahtarına tanımlı değil.";
    }
    return error.message;
  }
  return "Mysoft e-Belge servisine bağlanılamadı. Sunucu bağlantısını kontrol edip tekrar deneyin.";
};

/**
 * Mysoft e-Belge inbox/outbox. The component only talks to the local service
 * abstraction; credentials and the Mysoft API URL remain on the server.
 */
export const EDocuments: React.FC<EDocumentsProps> = ({
  direction,
  globalSearchTerm = "",
  companySettings,
  activeCompany,
  companyId,
  tenantIdentifierNumber,
  onImportInvoice,
}) => {
  const hintedTaxNumber = normalizeMysoftTenantIdentifier(
    tenantIdentifierNumber ||
      activeCompany?.tenantIdentifierNumber ||
      companySettings?.tenantIdentifierNumber ||
      companySettings?.mysoftCredentials?.tenantIdentifierNumber,
  );
  const activeManagedCompanyId = companyId || activeCompany?.id;
  const [tenants, setTenants] = useState<MysoftTenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [selectedTaxNumber, setSelectedTaxNumber] = useState<string | undefined>();
  const [manualVkn, setManualVkn] = useState("");
  const [isLookingUpVkn, setIsLookingUpVkn] = useState(false);
  const [partnerHint, setPartnerHint] = useState<string | null>(null);
  const activeTenantIdentifierNumber = selectedTaxNumber;
  const [activeDirection, setActiveDirection] = useState<"inbox" | "outbox">(
    () => normalizeDirection(direction),
  );
  const [documents, setDocuments] = useState<MysoftEDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(globalSearchTerm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [period, setPeriod] = useState<SyncPeriod>("this_month");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<MysoftEDocument | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<{
    id: string;
    format: DownloadFormat;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<
    "accept" | "acknowledge" | "deny" | "cancel" | "send-draft" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const pickTenant = useCallback((rows: MysoftTenant[]) => {
    setSelectedTaxNumber((current) => {
      const match = hintedTaxNumber
        ? rows.find((tenant) => tenant.taxNumber === hintedTaxNumber)
        : undefined;
      if (match) return match.taxNumber;
      if (rows.length === 1) return rows[0].taxNumber;
      if (current && rows.some((tenant) => tenant.taxNumber === current)) return current;
      return undefined;
    });
  }, [hintedTaxNumber]);

  const loadTenants = useCallback(async () => {
    setTenantsLoading(true);
    setTenantError(null);
    const status = await getMysoftConnectionStatus().catch(() => null);
    const identity = status?.identity;
    if (identity?.businessPartnerId) {
      setPartnerHint(
        `İş ortağı ${identity.businessPartnerId}: belge çekmeden önce listeden müşteri seçin (VKN/TCKN).`,
      );
    } else {
      setPartnerHint(null);
    }
    try {
      const rows = await listMysoftTenants();
      setTenants(rows);
      pickTenant(rows);
      if (rows.length === 0) {
        setTenantError(
          "Müşteri listesi boş döndü. Erişim anahtarı yetkisini ve sunucu .env kaydını kontrol edin.",
        );
      }
    } catch (loadError) {
      setTenants([]);
      setSelectedTaxNumber(undefined);
      setTenantError(getErrorMessage(loadError));
    } finally {
      setTenantsLoading(false);
    }
  }, [pickTenant]);

  const handleLookupVkn = async () => {
    const vkn = normalizeMysoftTenantIdentifier(manualVkn);
    if (!vkn) {
      setTenantError("10 haneli VKN veya 11 haneli TCKN girin.");
      return;
    }
    setIsLookingUpVkn(true);
    setTenantError(null);
    try {
      const tenant = await getMysoftTenant(vkn);
      if (!tenant) {
        setTenantError("Bu VKN erişim anahtarına tanımlı değil.");
        return;
      }
      setTenants((current) => {
        const next = current.filter((item) => item.taxNumber !== tenant.taxNumber);
        return [tenant, ...next];
      });
      setSelectedTaxNumber(tenant.taxNumber);
      setManualVkn("");
      setNotice(`${tenant.name} (${tenant.taxNumber}) seçildi. Şimdi belgeleri senkronize edin.`);
    } catch (lookupError) {
      setTenantError(getErrorMessage(lookupError));
    } finally {
      setIsLookingUpVkn(false);
    }
  };

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    setSearchTerm(globalSearchTerm);
  }, [globalSearchTerm]);

  useEffect(() => {
    if (direction) {
      setActiveDirection(normalizeDirection(direction));
    }
  }, [direction]);

  // Never leave a detail modal from the previous taxpayer visible while the
  // new tenant's inbox/outbox is loading.
  useEffect(() => {
    setSelectedDocument(null);
    setDetailError(null);
    setActionError(null);
    setNotice(null);
  }, [activeManagedCompanyId]);

  const loadDocuments = useCallback(
    async (requestedDirection: EDocumentDirection = activeDirection) => {
      if (tenantsLoading) return;
      if (!activeTenantIdentifierNumber && tenants.length !== 1) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setError(null);
      try {
        const range = getSyncRange(period);
        const result = await listMysoftEDocuments(requestedDirection, {
          signal: controller.signal,
          tenantIdentifierNumber: activeTenantIdentifierNumber,
          companyId: activeManagedCompanyId,
          startDate: range.startDate,
          endDate: range.endDate,
          // Numbered paging accepts multi-day ranges; day-chunked legacy list does not.
          ...(normalizeDirection(requestedDirection) === "inbox"
            ? { pageSize: 100, pageNumber: 1 }
            : {}),
        });
        if (!controller.signal.aborted) {
          const rows = Array.isArray(result) ? result : [];
          const hasCompanyTags = rows.some((document) => Boolean(document.companyId));
          setDocuments(
            rows.filter(
              (document) =>
                !activeManagedCompanyId ||
                !hasCompanyTags ||
                document.companyId === activeManagedCompanyId,
            ),
          );
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setDocuments([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [
      activeDirection,
      activeManagedCompanyId,
      activeTenantIdentifierNumber,
      period,
      tenants.length,
      tenantsLoading,
    ],
  );

  useEffect(() => {
    if (tenantsLoading) return;
    void loadDocuments(activeDirection);
    return () => abortRef.current?.abort();
  }, [activeDirection, loadDocuments, tenantsLoading]);

  const handleDirectionChange = (nextDirection: EDocumentDirection) => {
    if (direction) return;
    setActiveDirection(nextDirection);
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const handleSync = async () => {
    if (!activeTenantIdentifierNumber) {
      setError("Önce Mysoft iş ortakları listesinden bir firma seçin veya VKN ile getirin.");
      return;
    }
    setIsSyncing(true);
    setNotice(null);
    setError(null);
    try {
      const result = await syncMysoftEDocuments({
        direction: activeDirection,
        ...getSyncRange(period),
        tenantIdentifierNumber: activeTenantIdentifierNumber,
        companyId: activeManagedCompanyId,
        // Prefer paging so "Bu ay" is one multi-day range, not day-by-day calls.
        ...(activeDirection === "inbox" || activeDirection === "incoming"
          ? { pageSize: 100, pageNumber: 1 }
          : {}),
      });
      // Sync already returns the authoritative merged snapshot.  Use it
      // directly so the UI does not immediately issue a second, first-page
      // request (which used to hide records fetched by pagination).
      const syncedRows = Array.isArray(result?.documents) ? result.documents : [];
      const hasCompanyTags = syncedRows.some((document) => Boolean(document.companyId));
      const syncedDocuments = syncedRows.filter(
        (document) =>
          documentDirection(document) === activeDirection &&
          (!activeManagedCompanyId || !hasCompanyTags || document.companyId === activeManagedCompanyId),
      );
      setDocuments(syncedDocuments);
      setLastSyncedAt(result?.syncedAt || new Date().toISOString());
      const pulled = syncedDocuments.length;
      setNotice(
        pulled > 0
          ? `Mysoft’tan ${pulled} belge çekildi.`
          : "Mysoft bağlantısı tamam; seçilen firma ve dönemde belge yok.",
      );
    } catch (syncError) {
      setError(getErrorMessage(syncError));
    } finally {
      setIsSyncing(false);
    }
  };

  const openDetails = async (document: MysoftEDocument) => {
    setSelectedDocument(document);
    setDetailError(null);
    setActionError(null);
    setIsRejecting(false);
    setRejectReason("");
    setIsDetailLoading(true);
    try {
      const detailed = await getMysoftEDocument(documentIdentity(document), {
        direction: documentDirection(document),
        tenantIdentifierNumber: activeTenantIdentifierNumber,
        companyId: activeManagedCompanyId,
      });
      if (detailed) setSelectedDocument(detailed);
    } catch (detailLoadError) {
      setDetailError(getErrorMessage(detailLoadError));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const triggerDownload = async (
    document: MysoftEDocument,
    format: DownloadFormat,
  ) => {
    const id = documentIdentity(document);
    setDownloading({ id, format });
    setNotice(null);
    try {
      const result: any = await downloadMysoftEDocument(id, format as any, {
        direction: documentDirection(document),
        tenantIdentifierNumber: activeTenantIdentifierNumber,
        companyId: activeManagedCompanyId,
      });
      const fallbackUrl =
        asRecord(document).downloadUrl || asRecord(document)[`${format}Url`];
      const resultUrl =
        typeof result === "string"
          ? result
          : result?.url || result?.downloadUrl;
      if (resultUrl || fallbackUrl) {
        window.open(resultUrl || fallbackUrl, "_blank", "noopener,noreferrer");
      } else if (
        result?.blob instanceof Blob ||
        result instanceof Blob ||
        result?.data
      ) {
        const blob =
          result instanceof Blob
            ? result
            : result?.blob instanceof Blob
              ? result.blob
              : new Blob([String(result?.data || "")], {
                  type:
                    result?.mimeType ||
                    (format === "xml" ? "application/xml" : "application/pdf"),
                });
        const url = URL.createObjectURL(blob);
        const anchor = window.document.createElement("a");
        anchor.href = url;
        anchor.download =
          result?.filename || `${documentNumber(document)}.${format}`;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error("İndirilecek dosya bulunamadı.");
      }
    } catch (downloadError) {
      setNotice(getErrorMessage(downloadError));
    } finally {
      setDownloading(null);
    }
  };

  const patchDocumentStatus = (
    document: MysoftEDocument,
    status: string,
    statusLabel?: string,
  ): MysoftEDocument => ({
    ...document,
    status,
    statusLabel: statusLabel || status,
    statusText: statusLabel || status,
    updatedAt: new Date().toISOString(),
  });

  const applyActionResult = (
    action: "accept" | "acknowledge" | "deny" | "cancel" | "send-draft",
    document: MysoftEDocument,
  ) => {
    const nextStatus =
      action === "accept" || action === "acknowledge"
        ? "accepted"
        : action === "deny"
          ? "rejected"
          : action === "cancel"
            ? "cancelled"
            : "sent";
    const nextLabel =
      action === "accept"
        ? "Kabul edildi"
        : action === "acknowledge"
          ? "Alındı olarak işaretlendi"
        : action === "deny"
          ? "Reddedildi"
          : action === "cancel"
            ? "İptal edildi"
            : "Gönderildi";
    const updated = patchDocumentStatus(document, nextStatus, nextLabel);
    setSelectedDocument(updated);
    setDocuments((current) =>
      current.map((item) => {
        const itemId = documentIdentity(item);
        const selectedId = documentIdentity(document);
        return itemId === selectedId ? updated : item;
      }),
    );
  };

  const runDocumentAction = async (
    action: "accept" | "acknowledge" | "deny" | "cancel" | "send-draft",
  ) => {
    if (!selectedDocument || actionLoading) return;
    if (activeCompany?.isPassive) {
      setActionError("Pasif mükellef için e-Belge işlemi yapılamaz.");
      return;
    }
    if (action === "cancel" && !isArchiveDocument(selectedDocument)) {
      setActionError("Mysoft iptal işlemi yalnızca e-Arşiv belgeleri için kullanılabilir.");
      return;
    }
    const id = documentIdentity(selectedDocument);
    const operationOptions = {
      direction: documentDirection(selectedDocument),
      tenantIdentifierNumber: activeTenantIdentifierNumber,
      companyId: activeManagedCompanyId,
    };
    setActionLoading(action);
    setActionError(null);
    setNotice(null);
    try {
      if (action === "accept") {
        await acceptMysoftEDocument(id, operationOptions);
      } else if (action === "acknowledge") {
        await acknowledgeMysoftEDocument(id, operationOptions);
      } else if (action === "deny") {
        await denyMysoftEDocument(id, rejectReason, operationOptions);
      } else if (action === "cancel") {
        await cancelMysoftEDocument(id, {
          cancelDate: new Date().toISOString().slice(0, 10),
          cancelType: "GIB",
          cancelNote: "Muavin üzerinden iptal edildi",
        }, operationOptions);
      } else {
        await sendMysoftDraftEDocument(id, {}, operationOptions);
      }
      applyActionResult(action, selectedDocument);
      setIsRejecting(false);
      setRejectReason("");
      setNotice(
        action === "accept"
          ? "Belge Mysoft'ta kabul edildi."
          : action === "acknowledge"
            ? "Belge Mysoft'ta alındı olarak işaretlendi."
          : action === "deny"
            ? "Belge Mysoft'ta reddedildi."
            : action === "cancel"
              ? "Belge Mysoft'ta iptal edildi."
              : "Taslak Mysoft'a gönderildi.",
      );
    } catch (actionLoadError) {
      const message = getErrorMessage(actionLoadError);
      setActionError(message);
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const availableTypes = useMemo(
    () =>
      Array.from(
        new Set(documents.map((document) => String(documentType(document)))),
      ).sort(),
    [documents],
  );
  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(documents.map((document) => documentStatus(document))),
      ).sort(),
    [documents],
  );
  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("tr-TR");
    return documents.filter((document) => {
      const data = asRecord(document);
      const haystack = [
        documentNumber(document),
        documentParty(document),
        documentTaxNumber(document),
        data.ettn,
        data.uuid,
        documentType(document),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return (
        (!query || haystack.includes(query)) &&
        (statusFilter === "all" || documentStatus(document) === statusFilter) &&
        (typeFilter === "all" || String(documentType(document)) === typeFilter)
      );
    });
  }, [documents, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const accepted = documents.filter((document) => {
      const status = documentStatus(document).toLowerCase();
      return ["accepted", "approved", "delivered", "sent", "success"].some(
        (token) => status.includes(token),
      );
    }).length;
    const waiting = documents.filter((document) => {
      const status = documentStatus(document).toLowerCase();
      return ["draft", "queued", "pending", "processing", "waiting"].some(
        (token) => status.includes(token),
      );
    }).length;
    const total = documents.reduce(
      (sum, document) => sum + Number(documentAmount(document) || 0),
      0,
    );
    return { total: documents.length, accepted, waiting, amount: total };
  }, [documents]);

  const directionLabel =
    activeDirection === "inbox" ? "Gelen e-Belgeler" : "Giden e-Belgeler";
  const DirectionIcon =
    activeDirection === "inbox" ? ArrowDownLeft : ArrowUpRight;

  return (
    <section className="p-4 sm:p-6 max-w-[1500px] mx-auto space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8252F6] font-semibold">
            <span className="w-7 h-px bg-[#8252F6]" /> Mysoft entegrasyonu
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-2">
            {directionLabel}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Önce iş ortağına bağlı e-belge müşterileri çekilir. Mali müşavir
            mükellefi değil; belgeler seçilen müşterinin VKN’si ile alınır.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!direction && (
            <div className="p-1 bg-white border border-slate-200 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => handleDirectionChange("inbox")}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${activeDirection === "inbox" ? "bg-[#F3EFFF] text-[#8252F6]" : "text-slate-500 hover:text-slate-800"}`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Gelen
              </button>
              <button
                type="button"
                onClick={() => handleDirectionChange("outbox")}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${activeDirection === "outbox" ? "bg-[#F3EFFF] text-[#8252F6]" : "text-slate-500 hover:text-slate-800"}`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Giden
              </button>
            </div>
          )}
          <select
            aria-label="Senkronizasyon dönemi"
            value={period}
            onChange={(event) => setPeriod(event.target.value as SyncPeriod)}
            className="h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-600 outline-none focus:border-[#8252F6]"
          >
            <option value="this_month">Bu ayı getir</option>
            <option value="three_months">Son 3 ayı getir</option>
            <option value="all">Son 12 ayı getir</option>
          </select>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || tenantsLoading || !activeTenantIdentifierNumber}
            className="h-10 px-4 rounded-xl bg-[#8252F6] hover:bg-[#703EE5] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isSyncing ? "Senkronize ediliyor" : "Mysoft'tan senkronize et"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-[180px]">
            <Building2 className="w-4 h-4 text-[#8252F6]" />
            Mysoft iş ortakları
          </div>
          <select
            aria-label="Mysoft iş ortağı"
            value={selectedTaxNumber || ""}
            onChange={(event) => setSelectedTaxNumber(event.target.value || undefined)}
            disabled={tenantsLoading || tenants.length === 0}
            className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:border-[#8252F6]"
          >
            <option value="">
              {tenantsLoading
                ? "İş ortakları yükleniyor..."
                : tenants.length === 0
                  ? "Listede iş ortağı yok"
                  : "İş ortağı seçin"}
            </option>
            {tenants.map((tenant) => (
              <option key={`${tenant.taxNumber}:${tenant.id || ""}`} value={tenant.taxNumber}>
                {tenant.name} — {tenant.taxNumber}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadTenants()}
            disabled={tenantsLoading}
            className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 flex items-center gap-2"
          >
            {tenantsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            İş ortaklarını yenile
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={manualVkn}
            onChange={(event) => setManualVkn(event.target.value)}
            placeholder="VKN / TCKN ile firma getir"
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#8252F6]"
          />
          <button
            type="button"
            onClick={() => void handleLookupVkn()}
            disabled={isLookingUpVkn}
            className="h-10 px-3 rounded-xl bg-[#F3EFFF] text-[#8252F6] text-xs font-semibold hover:bg-[#E4D7FF] disabled:opacity-60"
          >
            {isLookingUpVkn ? "Sorgulanıyor..." : "VKN ile getir"}
          </button>
        </div>
        {partnerHint && <p className="text-xs text-amber-700">{partnerHint}</p>}
        {tenantError && <p className="text-xs text-rose-600">{tenantError}</p>}
        {selectedTaxNumber && (
          <p className="text-xs text-slate-500">
            Belge çekimi seçilen VKN ile yapılacak: {selectedTaxNumber}
          </p>
        )}
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Bildirimi kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Mysoft bağlantısı kurulamadı</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
              <p className="mt-1 text-xs text-rose-600">
                Bağlantı bilgileri tarayıcıya gönderilmez; sunucu ortam
                değişkenlerini ve API erişimini kontrol edin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadDocuments(activeDirection)}
            className="shrink-0 text-xs font-semibold underline"
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: "Toplam belge",
            value: stats.total.toLocaleString("tr-TR"),
            icon: FileText,
            accent: "text-[#8252F6] bg-[#F3EFFF]",
          },
          {
            label: "Başarılı durum",
            value: stats.accepted.toLocaleString("tr-TR"),
            icon: CheckCircle2,
            accent: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Bekleyen",
            value: stats.waiting.toLocaleString("tr-TR"),
            icon: Clock3,
            accent: "text-amber-600 bg-amber-50",
          },
          {
            label: "Belge toplamı",
            value: formatMoney(stats.amount),
            icon: DirectionIcon,
            accent: "text-sky-600 bg-sky-50",
          },
        ].map((card) => {
          const CardIcon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 shadow-sm"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.accent}`}
              >
                <CardIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500">{card.label}</p>
                <p className="text-base font-semibold text-slate-900 mt-0.5">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Belge no, cari, VKN veya ETTN ara..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#8252F6] focus:ring-2 focus:ring-[#8252F6]/10"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" /> Filtrele
            </div>
            <select
              aria-label="Durum filtresi"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs text-slate-600"
            >
              <option value="all">Tüm durumlar</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              aria-label="Belge türü filtresi"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs text-slate-600"
            >
              <option value="all">Tüm türler</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        {lastSyncedAt && (
          <div className="px-4 py-2 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-100">
            Son senkronizasyon: {formatDate(lastSyncedAt)}{" "}
            {new Date(lastSyncedAt).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#8252F6]" />
            <p className="text-sm">Mysoft belgeleri yükleniyor...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {documents.length === 0
                ? "Henüz belge bulunamadı"
                : "Filtreyle eşleşen belge yok"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {documents.length === 0
                ? "Önce iş ortaklarını çekin, birini seçin, sonra senkronize edin."
                : "Arama veya filtreleri değiştirerek tekrar deneyin."}
            </p>
            {documents.length === 0 && (
              <button
                type="button"
                onClick={handleSync}
                className="mt-4 px-3.5 py-2 rounded-lg bg-[#F3EFFF] text-[#8252F6] text-xs font-semibold hover:bg-[#E4D7FF]"
              >
                İlk senkronizasyonu başlat
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Belge</th>
                  <th className="px-4 py-3 font-semibold">Cari</th>
                  <th className="px-4 py-3 font-semibold">Tarih</th>
                  <th className="px-4 py-3 font-semibold">Tür</th>
                  <th className="px-4 py-3 font-semibold text-right">Tutar</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((document) => {
                  const data = asRecord(document);
                  const tone = statusTone(documentStatus(document));
                  const StatusIcon = tone.icon;
                  const id = documentIdentity(document);
                  const isDownloading = downloading?.id === id;
                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetails(document)}
                          className="group text-left"
                        >
                          <span className="font-mono text-xs font-semibold text-slate-800 group-hover:text-[#8252F6]">
                            {documentNumber(document)}
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            ETTN: {data.ettn || data.uuid || "-"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-800 max-w-[220px] truncate">
                          {documentParty(document)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {documentTaxNumber(document)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(documentDate(document))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                          {documentType(document)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800 whitespace-nowrap">
                        {formatMoney(
                          documentAmount(document),
                          documentCurrency(document),
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-semibold ${tone.className}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {tone.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void openDetails(document)}
                            title="Detayı görüntüle"
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#8252F6]"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void triggerDownload(document, "pdf")
                            }
                            disabled={isDownloading}
                            title="PDF indir"
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#8252F6] disabled:opacity-50"
                          >
                            {isDownloading && downloading?.format === "pdf" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void triggerDownload(document, "xml")
                            }
                            disabled={isDownloading}
                            title="XML indir"
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#8252F6] disabled:opacity-50"
                          >
                            <FileCode2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="E-Belge detayı"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedDocument(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <DirectionIcon
                    className={`w-4 h-4 ${activeDirection === "inbox" ? "text-sky-600" : "text-[#8252F6]"}`}
                  />
                  <h2 className="font-semibold text-slate-900">
                    {documentNumber(selectedDocument)}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {documentType(selectedDocument)} ·{" "}
                  {formatDate(documentDate(selectedDocument))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Detayı kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isDetailLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#8252F6]" />
              </div>
            ) : (
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-76px)]">
                {detailError && (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Detay servisi yanıt vermedi; listede bulunan bilgiler
                    gösteriliyor.
                  </div>
                )}
                {actionError && (
                  <div
                    className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800"
                    role="alert"
                  >
                    <span>{actionError}</span>
                    <button
                      type="button"
                      onClick={() => setActionError(null)}
                      className="font-semibold underline shrink-0"
                    >
                      Kapat
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    [
                      "Yön",
                      documentDirection(selectedDocument) === "inbox"
                        ? "Gelen"
                        : "Giden",
                    ],
                    ["Cari", documentParty(selectedDocument)],
                    ["VKN / TCKN", documentTaxNumber(selectedDocument)],
                    [
                      "Tutar",
                      formatMoney(
                        documentAmount(selectedDocument),
                        documentCurrency(selectedDocument),
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 border border-slate-100 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                      <p className="text-xs font-semibold text-slate-800 mt-1 break-words">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">ETTN / UUID</span>
                    <p className="font-mono text-xs text-slate-700 mt-1 break-all">
                      {asRecord(selectedDocument).ettn ||
                        asRecord(selectedDocument).uuid ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Durum</span>
                    <p className="text-xs text-slate-700 mt-1">
                      {documentStatus(selectedDocument)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Oluşturulma</span>
                    <p className="text-xs text-slate-700 mt-1">
                      {formatDate(asRecord(selectedDocument).createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Güncellenme</span>
                    <p className="text-xs text-slate-700 mt-1">
                      {formatDate(asRecord(selectedDocument).updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
                  {activeDirection === "inbox" ? (
                    <div className="w-full flex flex-wrap items-center justify-end gap-2 pb-2 mb-1 border-b border-slate-100">
                      {!isRejecting ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void runDocumentAction("accept")}
                            disabled={Boolean(actionLoading)}
                            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {actionLoading === "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Kabul et
                          </button>
                          <button
                            type="button"
                            onClick={() => void runDocumentAction("acknowledge")}
                            disabled={Boolean(actionLoading)}
                            className="px-3 py-2 rounded-lg border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50 disabled:opacity-50 flex items-center gap-2"
                            title="Belgeyi Mysoft'ta alındı olarak kaydet"
                          >
                            {actionLoading === "acknowledge" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                            Alındı
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsRejecting(true); setActionError(null); }}
                            disabled={Boolean(actionLoading)}
                            className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50 flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reddet
                          </button>
                        </>
                      ) : (
                        <div className="w-full rounded-xl border border-rose-200 bg-rose-50/60 p-3 space-y-2">
                          <label htmlFor="mysoft-reject-reason" className="block text-xs font-semibold text-rose-800">
                            Ret gerekçesi
                          </label>
                          <textarea
                            id="mysoft-reject-reason"
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            rows={2}
                            placeholder="Mysoft'a iletilecek ret gerekçesini yazın"
                            className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs outline-none focus:border-rose-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setIsRejecting(false); setRejectReason(""); }}
                              disabled={Boolean(actionLoading)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Vazgeç
                            </button>
                            <button
                              type="button"
                              onClick={() => void runDocumentAction("deny")}
                              disabled={Boolean(actionLoading) || !rejectReason.trim()}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {actionLoading === "deny" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Ret gönder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full flex flex-wrap items-center justify-end gap-2 pb-2 mb-1 border-b border-slate-100">
                      {isArchiveDocument(selectedDocument) && (
                        <button
                          type="button"
                          onClick={() => void runDocumentAction("cancel")}
                          disabled={Boolean(actionLoading)}
                          className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          İptal et
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void runDocumentAction("send-draft")}
                        disabled={Boolean(actionLoading)}
                        className="px-3 py-2 rounded-lg bg-[#8252F6] text-white text-xs font-semibold hover:bg-[#703EE5] disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === "send-draft" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
                        Taslağı GİB'e gönder
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      void triggerDownload(selectedDocument, "xml")
                    }
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileCode2 className="w-4 h-4" />
                    XML indir
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void triggerDownload(selectedDocument, "pdf")
                    }
                    className="px-3 py-2 rounded-lg bg-[#8252F6] text-white text-xs font-semibold hover:bg-[#703EE5] flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF indir
                  </button>
                  {asRecord(selectedDocument).downloadUrl && (
                    <a
                      href={asRecord(selectedDocument).downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Mysoft'ta aç
                    </a>
                  )}
                  {activeDirection === "inbox" && onImportInvoice && (
                    <button
                      type="button"
                      onClick={() => {
                        onImportInvoice(selectedDocument);
                        setNotice("Belge yerel fatura taslağına aktarıldı.");
                        setSelectedDocument(null);
                      }}
                      className="px-3 py-2 rounded-lg border border-[#fcdac2] bg-[#fff6ef] text-[#c25a13] text-xs font-semibold hover:bg-[#ffeddc] flex items-center gap-2"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      Faturaya aktar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default EDocuments;
