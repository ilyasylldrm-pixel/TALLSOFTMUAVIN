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
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  ExternalLink,
  FileCode2,
  FileText,
  Filter,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import {
  isAdminOrSysAdmin,
  isCompanyMysoftMatched,
  type CompanySettings,
  type EDocumentDirection,
  type Invoice,
  type InvoiceDesignSettings,
  type InvoiceItem,
  type ManagedCompany,
  type MysoftDocumentFamily,
  type MysoftEDocument,
} from "../types";
import {
  getMysoftEDocument,
  listMysoftEDocuments,
  listNewMysoftIncomingEDocuments,
  downloadMysoftEDocument,
  syncMysoftEDocuments,
  acceptMysoftEDocument,
  acknowledgeMysoftEDocument,
  denyMysoftEDocument,
  cancelMysoftEDocument,
  sendMysoftDraftEDocument,
  normalizeMysoftTenantIdentifier,
  resolveMysoftDocumentStatus,
  invoiceToMysoftOutgoingEDocument,
  readPersistedEDocuments,
  getMysoftConnectionStatus,
  enrichIncomingEDocumentWithXml,
  type MysoftConnectionStatus,
} from "../services/mysoftEDocumentService";
import { useMysoftTenants } from "../hooks/useMysoftTenants";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { triggerFormErrorNotification } from "../context/FormErrorContext";
import { ExportButtons } from "./ExportButtons";
import { ExportData } from "../utils/exportUtils";
import { openInvoicePrintModal, printHtmlElement } from "../utils/printEngine";
import {
  OfficialGIBInvoicePaper,
  InvoiceDesignCustomizerBar,
  resolveInvoiceDesignSettings,
} from "./OfficialGIBInvoicePaper";
import { IncomingGIBInvoiceView } from "./IncomingGIBInvoiceView";

export interface EDocumentsProps {
  /** The navigation item controls the API direction without exposing credentials to the browser. */
  direction?: EDocumentDirection;
  /** invoice = gelen/giden e-Fatura, despatch = gelen/giden e-İrsaliye */
  family?: MysoftDocumentFamily;
  globalSearchTerm?: string;
  companySettings?: CompanySettings;
  /** Active accountant-managed taxpayer. Used for tenant routing and cache
   * isolation; the server still owns OAuth secrets. */
  activeCompany?: ManagedCompany;
  companyId?: string;
  tenantIdentifierNumber?: string;
  /** Local invoices so Gelir Faturaları appear immediately in Giden e-Faturalar */
  invoices?: Invoice[];
  currentUser?: { id?: string; email?: string; role?: string; username?: string } | null;
  /** Optional local import hook. */
  onImportInvoice?: (document: MysoftEDocument) => void;
}

type SyncPeriod =
  | "this_month"
  | "three_months"
  | "all"
  | "custom"
  | "month_1"
  | "month_2"
  | "month_3"
  | "month_4"
  | "month_5"
  | "month_6"
  | "month_7"
  | "month_8"
  | "month_9"
  | "month_10"
  | "month_11"
  | "month_12";
type DownloadFormat = "pdf" | "xml" | "html";
type InboxQuickTab =
  | "all"
  | "waiting_response"
  | "unaccounted"
  | "accounted"
  | "accepted"
  | "rejected";

const TURKISH_MONTHS = [
  { id: 1, name: "Ocak", shortName: "Oca" },
  { id: 2, name: "Şubat", shortName: "Şub" },
  { id: 3, name: "Mart", shortName: "Mar" },
  { id: 4, name: "Nisan", shortName: "Nis" },
  { id: 5, name: "Mayıs", shortName: "May" },
  { id: 6, name: "Haziran", shortName: "Haz" },
  { id: 7, name: "Temmuz", shortName: "Tem" },
  { id: 8, name: "Ağustos", shortName: "Ağu" },
  { id: 9, name: "Eylül", shortName: "Eyl" },
  { id: 10, name: "Ekim", shortName: "Eki" },
  { id: 11, name: "Kasım", shortName: "Kas" },
  { id: 12, name: "Aralık", shortName: "Ara" },
] as const;

const parseDocYearMonth = (rawDate: unknown): { year: number | null; month: number | null } => {
  if (!rawDate) return { year: null, month: null };
  const str = String(rawDate).trim();
  const isoMatch = /^(\d{4})-(\d{1,2})/.exec(str);
  if (isoMatch) {
    return { year: parseInt(isoMatch[1], 10), month: parseInt(isoMatch[2], 10) };
  }
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return { year: null, month: null };
};

const sanitizeCurrency = (curr?: unknown): string => {
  const raw = String(curr || "").trim().toUpperCase();
  if (!raw || raw === "TL" || raw === "₺" || raw === "?" || raw === "NULL" || raw.length !== 3) {
    return "TRY";
  }
  return raw;
};

const formatMoney = (value: unknown, currency = "TRY") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  const validCurr = sanitizeCurrency(currency);
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: validCurr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${validCurr}`;
  }
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
  const raw = String(
    data.documentType || data.typeLabel || data.type || "",
  );
  const profile = String(data.profile || data.eDespatchType || "");
  if (
    data.family === "despatch" ||
    raw.includes("irsaliye") ||
    raw.includes("e_irsaliye")
  ) {
    return profile ? `e-İrsaliye (${profile})` : "e-İrsaliye";
  }
  return raw || "e-Fatura";
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
  return sanitizeCurrency(value);
};

const statusTone = (status: string) => {
  const resolved = resolveMysoftDocumentStatus(status);
  const className =
    resolved.tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : resolved.tone === "info"
        ? "bg-sky-50 text-sky-700 border-sky-200"
        : resolved.tone === "warning"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : resolved.tone === "danger"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-slate-100 text-slate-600 border-slate-200";
  const icon =
    resolved.tone === "success"
      ? CheckCircle2
      : resolved.tone === "danger"
        ? XCircle
        : resolved.tone === "warning"
          ? Clock3
          : AlertCircle;
  return { label: resolved.label, className, icon, status: resolved.status };
};

const formatLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSyncRange = (period: SyncPeriod, selectedYear: string = "all") => {
  const now = new Date();
  const targetYear =
    selectedYear !== "all" && /^\d{4}$/.test(selectedYear)
      ? parseInt(selectedYear, 10)
      : now.getFullYear();

  if (period.startsWith("month_")) {
    const monthNum = parseInt(period.replace("month_", ""), 10);
    if (monthNum >= 1 && monthNum <= 12) {
      const from = new Date(targetYear, monthNum - 1, 1);
      const to = new Date(targetYear, monthNum, 0);
      return {
        startDate: formatLocalIsoDate(from),
        endDate: formatLocalIsoDate(to),
      };
    }
  }

  const to = new Date();
  const from = new Date(to);
  if (period === "this_month") {
    const mFrom = new Date(targetYear, now.getMonth(), 1);
    const mTo = new Date(targetYear, now.getMonth() + 1, 0);
    return {
      startDate: formatLocalIsoDate(mFrom),
      endDate: formatLocalIsoDate(mTo),
    };
  } else if (period === "three_months") {
    if (selectedYear !== "all" && /^\d{4}$/.test(selectedYear) && targetYear !== now.getFullYear()) {
      const yFrom = new Date(targetYear, 9, 1);
      const yTo = new Date(targetYear, 12, 0);
      return {
        startDate: formatLocalIsoDate(yFrom),
        endDate: formatLocalIsoDate(yTo),
      };
    }
    from.setMonth(from.getMonth() - 2, 1);
  } else {
    if (selectedYear !== "all" && /^\d{4}$/.test(selectedYear)) {
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    }
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
  family = "invoice",
  globalSearchTerm = "",
  companySettings,
  activeCompany,
  companyId,
  tenantIdentifierNumber,
  invoices = [],
  currentUser,
  onImportInvoice,
}) => {
  const { theme } = useTheme();
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const isDespatch = family === "despatch";
  const effectiveUser = useMemo(() => {
    if (currentUser !== undefined) return currentUser;
    try {
      const raw =
        localStorage.getItem("muavin_active_user") ||
        sessionStorage.getItem("muavin_active_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [currentUser]);
  const isAdmin = isAdminOrSysAdmin(effectiveUser);
  const isMysoftMatched = isCompanyMysoftMatched(
    activeCompany as any,
    companySettings,
  );
  const hintedTaxNumber = normalizeMysoftTenantIdentifier(
    activeCompany?.tenantIdentifierNumber ||
      companySettings?.tenantIdentifierNumber ||
      companySettings?.mysoftCredentials?.tenantIdentifierNumber ||
      activeCompany?.taxNumber ||
      companySettings?.taxNumber ||
      companySettings?.vkn ||
      companySettings?.tckn ||
      tenantIdentifierNumber,
  );
  // Şirket eşleşmesi Admin tarafından yapıldıktan sonra veya şirket kullanıcısı oturumunda Mysoft iş ortakları gizlenir
  const shouldHideMysoftPartners = !isAdmin || isMysoftMatched;
  const activeManagedCompanyId = companyId || activeCompany?.id;
  const {
    tenants,
    loading: tenantsLoading,
    error: tenantError,
    partnerHint,
    selectedVkn: activeTenantIdentifierNumber,
    setSelectedVkn: setSelectedTaxNumber,
    manualVkn,
    setManualVkn,
    lookupLoading: isLookingUpVkn,
    lookupByVkn,
    reload: loadTenants,
  } = useMysoftTenants({
    hintVkn: hintedTaxNumber,
    lockedVkn: shouldHideMysoftPartners ? hintedTaxNumber : undefined,
    hidePartners: shouldHideMysoftPartners,
  });
  const [activeDirection, setActiveDirection] = useState<"inbox" | "outbox">(
    () => normalizeDirection(direction),
  );
  const [documents, setDocuments] = useState<MysoftEDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const setError = (msg: string | null) => {
    setErrorState(msg);
    if (msg) {
      triggerFormErrorNotification(msg, "e-Belge / Mysoft Hatası");
    }
  };
  const [searchTerm, setSearchTerm] = useState(globalSearchTerm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState<string>(() =>
    String(new Date().getFullYear()),
  );
  const [period, setPeriod] = useState<SyncPeriod>("all");
  const [isUseDocDate, setIsUseDocDate] = useState<boolean>(true);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return formatLocalIsoDate(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() =>
    formatLocalIsoDate(new Date()),
  );
  const [inboxQuickTab, setInboxQuickTab] = useState<InboxQuickTab>("all");
  const [connectionStatus, setConnectionStatus] =
    useState<MysoftConnectionStatus | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [rowActionLoading, setRowActionLoading] = useState<{
    id: string;
    action: string;
  } | null>(null);
  const [inlineRejectDocId, setInlineRejectDocId] = useState<string | null>(null);
  const [inlineRejectReason, setInlineRejectReason] = useState<string>("");
  const [enrichingDocId, setEnrichingDocId] = useState<string | null>(null);

  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<MysoftEDocument | null>(null);
  const docNav = useDetailNavigation({
    moduleKey: "e-documents",
  });

  const handleCloseDetail = () => {
    docNav.backToList();
    setSelectedDocument(null);
    setActionError(null);
    setIsRejecting(false);
  };
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

  const resolveEffectiveSyncRange = useCallback(
    (targetDirection: EDocumentDirection = activeDirection) => {
      if (period === "custom" && customStartDate && customEndDate) {
        return {
          startDate:
            customStartDate <= customEndDate ? customStartDate : customEndDate,
          endDate:
            customStartDate <= customEndDate ? customEndDate : customStartDate,
        };
      }
      if (normalizeDirection(targetDirection) === "inbox" && period === "all") {
        return getSyncRange("three_months", selectedYear);
      }
      return getSyncRange(period, selectedYear);
    },
    [activeDirection, customEndDate, customStartDate, period, selectedYear],
  );

  // Load Mysoft connection status
  useEffect(() => {
    let active = true;
    void getMysoftConnectionStatus()
      .then((st) => {
        if (active) setConnectionStatus(st);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeTenantIdentifierNumber, activeManagedCompanyId]);

  const handleLookupVkn = async () => {
    const tenant = await lookupByVkn();
    if (tenant) {
      setNotice(`${tenant.name} (${tenant.taxNumber}) seçildi. Şimdi belgeleri senkronize edin.`);
    }
  };

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
    setSelectedDocIds([]);
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
        const range = resolveEffectiveSyncRange(requestedDirection);
        const result = await listMysoftEDocuments(requestedDirection, {
          signal: controller.signal,
          tenantIdentifierNumber: activeTenantIdentifierNumber,
          companyId: activeManagedCompanyId,
          family,
          startDate: range.startDate,
          endDate: range.endDate,
          isUseDocDate,
          fallback: true,
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
      resolveEffectiveSyncRange,
      isUseDocDate,
      tenants.length,
      tenantsLoading,
      family,
    ],
  );

  useEffect(() => {
    if (tenantsLoading) return;
    void loadDocuments(activeDirection);
    return () => abortRef.current?.abort();
  }, [activeDirection, loadDocuments, tenantsLoading]);

  const handleDirectionChange = (nextDirection: EDocumentDirection) => {
    if (direction) return;
    setActiveDirection(normalizeDirection(nextDirection));
    setStatusFilter("all");
    setTypeFilter("all");
    setInboxQuickTab("all");
    setSelectedDocIds([]);
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
      const range = resolveEffectiveSyncRange(activeDirection);
      const result = await syncMysoftEDocuments({
        direction: activeDirection,
        startDate: range.startDate,
        endDate: range.endDate,
        isUseDocDate,
        tenantIdentifierNumber: activeTenantIdentifierNumber,
        companyId: activeManagedCompanyId,
        family,
        fallback: true,
        // Prefer paging so "Bu ay" is one multi-day range, not day-by-day calls.
        ...(activeDirection === "inbox"
          ? { pageSize: 100, pageNumber: 1 }
          : {}),
      });
      const syncedRows = Array.isArray(result?.documents) ? result.documents : [];
      const hasCompanyTags = syncedRows.some((document) => Boolean(document.companyId));
      const syncedDocuments = syncedRows.filter(
        (document) =>
          documentDirection(document) === activeDirection &&
          (!activeManagedCompanyId || !hasCompanyTags || document.companyId === activeManagedCompanyId),
      );

      // For incoming e-invoices, also query newly arrived envelopes so invoices with older document dates are captured
      let mergedDocs = syncedDocuments;
      if (activeDirection === "inbox") {
        try {
          const newIncoming = await listNewMysoftIncomingEDocuments({
            startDate: range.startDate,
            endDate: range.endDate,
            isUseDocDate: false,
            tenantIdentifierNumber: activeTenantIdentifierNumber,
            companyId: activeManagedCompanyId,
            family,
            fallback: true,
          });
          if (newIncoming.length > 0) {
            const byId = new Map(mergedDocs.map((d) => [documentIdentity(d), d]));
            for (const nd of newIncoming) {
              if (!byId.has(documentIdentity(nd))) {
                byId.set(documentIdentity(nd), nd);
              }
            }
            mergedDocs = Array.from(byId.values());
          }
        } catch {
          // Ignore secondary new-incoming probe failure
        }
      }

      setDocuments(mergedDocs);
      setLastSyncedAt(result?.syncedAt || new Date().toISOString());
      const pulled = mergedDocs.length;
      setNotice(
        pulled > 0
          ? `Mysoft’tan ${pulled} ${activeDirection === "inbox" ? "gelen" : "giden"} belge senkronize edildi (${isUseDocDate ? "Belge Tarihine Göre" : "Geliş/Zarf Tarihine Göre"}).`
          : "Mysoft bağlantısı tamam; seçilen firma ve dönemde belge yok.",
      );
    } catch (syncError) {
      setError(getErrorMessage(syncError));
    } finally {
      setIsSyncing(false);
    }
  };

  const isDocumentImported = useCallback(
    (doc: MysoftEDocument): boolean => {
      if (!Array.isArray(invoices) || invoices.length === 0) return false;
      const data = asRecord(doc);
      const ettn = String(data.ettn || data.uuid || "").trim();
      const docNo = String(documentNumber(doc) || "").trim().toUpperCase();
      return invoices.some(
        (inv) =>
          (ettn && inv.eDocumentEttn === ettn) ||
          (docNo && docNo !== "-" && String(inv.invoiceNumber || "").trim().toUpperCase() === docNo),
      );
    },
    [invoices],
  );

  const isCommercialDocument = useCallback((doc: MysoftEDocument): boolean => {
    const data = asRecord(doc);
    const prof = String(
      data.profile || data.profileId || data.scenario || data.raw?.profileId || data.raw?.profile || "",
    ).toUpperCase();
    const tLabel = String(documentType(doc)).toUpperCase();
    return prof.includes("TICARI") || tLabel.includes("TİCARİ") || tLabel.includes("TICARI");
  }, []);

  const isWaitingCommercialApproval = useCallback(
    (doc: MysoftEDocument): boolean => {
      if (documentDirection(doc) !== "inbox") return false;
      const resolved = resolveMysoftDocumentStatus(documentStatus(doc));
      if (resolved.status === "accepted" || resolved.status === "rejected" || resolved.status === "cancelled") {
        return false;
      }
      return isCommercialDocument(doc) || resolved.tone === "warning";
    },
    [isCommercialDocument],
  );

  const [importingDocId, setImportingDocId] = useState<string | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const ensureDocumentEnriched = useCallback(
    async (document: MysoftEDocument): Promise<MysoftEDocument> => {
      let targetDoc = document;
      const id = documentIdentity(document);
      const docRec = asRecord(document);
      const hasLines =
        (Array.isArray(docRec.items) && docRec.items.length > 0) ||
        (Array.isArray(docRec.lines) && docRec.lines.length > 0) ||
        (Array.isArray(docRec.raw?.invoiceDetail) && docRec.raw.invoiceDetail.length > 0);
      if (!hasLines && document.source !== "local") {
        try {
          const detailed = await getMysoftEDocument(id, {
            direction: documentDirection(document),
            tenantIdentifierNumber: activeTenantIdentifierNumber,
            companyId: activeManagedCompanyId,
            family,
            fallback: true,
          });
          if (detailed) {
            targetDoc = { ...document, ...detailed };
          }
        } catch {
          // Proceed to XML enrichment fallback
        }
      }
      if (documentDirection(targetDoc) === "inbox" && family !== "despatch") {
        try {
          targetDoc = await enrichIncomingEDocumentWithXml(targetDoc, {
            direction: "inbox",
            tenantIdentifierNumber: activeTenantIdentifierNumber,
            companyId: activeManagedCompanyId,
            family,
          });
        } catch {
          // Ignore enrichment error
        }
      }
      setDocuments((prev) =>
        prev.map((d) => (documentIdentity(d) === id ? { ...d, ...targetDoc } : d)),
      );
      return targetDoc;
    },
    [activeManagedCompanyId, activeTenantIdentifierNumber, family],
  );

  const handleToggleExpandRow = async (doc: MysoftEDocument) => {
    const id = documentIdentity(doc);
    if (expandedDocId === id) {
      setExpandedDocId(null);
      return;
    }
    setExpandedDocId(id);
    const rec = asRecord(doc);
    const hasLines =
      (Array.isArray(rec.items) && rec.items.length > 0) ||
      (Array.isArray(rec.lines) && rec.lines.length > 0) ||
      (Array.isArray(rec.raw?.invoiceDetail) && rec.raw.invoiceDetail.length > 0);
    if (!hasLines && documentDirection(doc) === "inbox" && !isDespatch) {
      setEnrichingDocId(id);
      try {
        await ensureDocumentEnriched(doc);
      } finally {
        setEnrichingDocId(null);
      }
    }
  };

  const handleImportToPurchaseInvoice = async (document: MysoftEDocument) => {
    if (!onImportInvoice) return;
    if (isDocumentImported(document)) {
      setNotice(`${documentNumber(document)} nolu belge zaten Alış Faturaları listesinde kayıtlı.`);
      return;
    }
    const id = documentIdentity(document);
    setImportingDocId(id);
    try {
      const targetDoc = await ensureDocumentEnriched(document);
      onImportInvoice(targetDoc);
      setNotice(
        `${documentNumber(targetDoc)} (${documentParty(targetDoc)}) faturası UBL kalemleriyle birlikte Alış Faturaları ve Cari Hesaplara başarıyla aktarıldı.`,
      );
    } catch (importErr) {
      setError(getErrorMessage(importErr));
    } finally {
      setImportingDocId(null);
    }
  };

  const handleFetchNewIncoming = async () => {
    if (!activeTenantIdentifierNumber) {
      setError("Önce Mysoft iş ortakları listesinden bir firma seçin veya VKN ile getirin.");
      return;
    }
    setIsSyncing(true);
    setNotice(null);
    setError(null);
    try {
      const range = resolveEffectiveSyncRange("inbox");
      const newDocs = await listNewMysoftIncomingEDocuments({
        startDate: range.startDate,
        endDate: range.endDate,
        isUseDocDate,
        tenantIdentifierNumber: activeTenantIdentifierNumber,
        companyId: activeManagedCompanyId,
        family,
        fallback: true,
      });
      if (newDocs.length > 0) {
        setDocuments((prev) => {
          const byId = new Map(prev.map((d) => [documentIdentity(d), d]));
          for (const nd of newDocs) {
            byId.set(documentIdentity(nd), nd);
          }
          return Array.from(byId.values());
        });
      }
      setLastSyncedAt(new Date().toISOString());
      setNotice(
        newDocs.length > 0
          ? `Mysoft’tan ${newDocs.length} yeni gelen e-Fatura sorgulandı ve listeye eklendi.`
          : "Mysoft gelen kutusunda bekleyen yeni e-Fatura bulunamadı.",
      );
    } catch (fetchErr) {
      setError(getErrorMessage(fetchErr));
    } finally {
      setIsSyncing(false);
    }
  };

  const openDetails = async (document: MysoftEDocument) => {
    setSelectedDocument(document);
    docNav.openDetail(document, documentNumber(document));
    setDetailError(null);
    setActionError(null);
    setIsRejecting(false);
    setRejectReason("");
    if (document.source === "local" || asRecord(document).raw?.isLocalSalesInvoice) {
      setIsDetailLoading(false);
      return;
    }
    setIsDetailLoading(true);
    try {
      const detailed = await getMysoftEDocument(documentIdentity(document), {
        direction: documentDirection(document),
        tenantIdentifierNumber: activeTenantIdentifierNumber,
        companyId: activeManagedCompanyId,
        family,
        fallback: true,
      });
      if (detailed) {
        setSelectedDocument((prev) => {
          if (!prev) return detailed;
          const prevRec = asRecord(prev);
          const detRec = asRecord(detailed);
          return {
            ...prev,
            ...detailed,
            senderName: detailed.senderName || prev.senderName,
            receiverName: detailed.receiverName || prev.receiverName,
            accountName: detailed.accountName || prev.accountName,
            partyName: detailed.partyName || prev.partyName,
            subtotal: detailed.subtotal ?? prev.subtotal,
            vatTotal: detailed.vatTotal ?? prev.vatTotal,
            grandTotal: detailed.grandTotal ?? prev.grandTotal,
            amount: detailed.amount ?? prev.amount,
            items: (Array.isArray(detRec.items) && detRec.items.length > 0 ? detRec.items : prevRec.items) as any,
            lines: (Array.isArray(detRec.lines) && detRec.lines.length > 0 ? detRec.lines : prevRec.lines) as any,
          };
        });
      }
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
        family,
        fallback: true,
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
                    (format === "xml"
                      ? "application/xml"
                      : format === "html"
                        ? "text/html"
                        : "application/pdf"),
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
    setSelectedDocument((prev) =>
      prev && documentIdentity(prev) === documentIdentity(document) ? updated : prev,
    );
    setDocuments((current) =>
      current.map((item) => {
        const itemId = documentIdentity(item);
        const selectedId = documentIdentity(document);
        return itemId === selectedId ? updated : item;
      }),
    );
  };

  const runRowDocumentAction = async (
    document: MysoftEDocument,
    action: "accept" | "acknowledge" | "deny",
    customReason?: string,
  ) => {
    if (activeCompany?.isPassive) {
      setError("Pasif mükellef için e-Belge işlemi yapılamaz.");
      return;
    }
    const id = documentIdentity(document);
    const operationOptions = {
      direction: documentDirection(document),
      tenantIdentifierNumber: activeTenantIdentifierNumber,
      companyId: activeManagedCompanyId,
      family,
    };
    setRowActionLoading({ id, action });
    setNotice(null);
    try {
      if (action === "accept") {
        await acceptMysoftEDocument(id, operationOptions);
      } else if (action === "acknowledge") {
        await acknowledgeMysoftEDocument(id, operationOptions);
      } else if (action === "deny") {
        await denyMysoftEDocument(
          id,
          customReason || inlineRejectReason || "Muavin üzerinden reddedildi",
          operationOptions,
        );
      }
      applyActionResult(action, document);
      setInlineRejectDocId(null);
      setInlineRejectReason("");
      setNotice(
        action === "accept"
          ? `${documentNumber(document)} nolu ticari fatura Mysoft'ta kabul edildi.`
          : action === "acknowledge"
            ? `${documentNumber(document)} nolu belge Mysoft'ta alındı olarak işaretlendi.`
            : `${documentNumber(document)} nolu ticari fatura Mysoft'ta reddedildi.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRowActionLoading(null);
    }
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
      family,
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

  // Merge remote Mysoft documents with local Gelir Faturaları (when viewing Giden e-Faturalar) and persisted e-documents
  const allDocuments = useMemo(() => {
    const mergedMap = new Map<string, MysoftEDocument>();
    const makeDedupeKey = (doc: MysoftEDocument): string => {
      const rec = asRecord(doc);
      const ettn = String(rec.ettn || "").trim().toUpperCase();
      if (activeDirection === "inbox" && ettn && ettn !== "-" && ettn !== "UNDEFINED") {
        return `ETTN:${ettn}`;
      }
      const cleanNo = String(documentNumber(doc) || "")
        .replace(/\s*\(TASLAK\)\s*$/i, "")
        .trim()
        .toUpperCase();
      if (cleanNo && cleanNo !== "-" && cleanNo !== "TASLAK" && cleanNo !== "BELGE") {
        return `NO:${cleanNo}`;
      }
      if (ettn && ettn !== "-" && ettn !== "UNDEFINED") {
        return `ETTN:${ettn}`;
      }
      const id = String(doc.id || rec.id || "").trim().toUpperCase();
      if (id && id !== "-" && id !== "UNDEFINED") {
        return `ID:${id}`;
      }
      return `KEY:${Math.random()}`;
    };

    // 1. Add persisted e-documents matching direction & family
    try {
      const persisted = readPersistedEDocuments();
      for (const doc of persisted) {
        if (documentDirection(doc) !== activeDirection) continue;
        const docFam = doc.family || "invoice";
        if (docFam !== family) continue;
        if (activeManagedCompanyId && doc.companyId && doc.companyId !== activeManagedCompanyId) {
          continue;
        }
        mergedMap.set(makeDedupeKey(doc), doc);
      }
    } catch {}

    // 2. Immediately include all Gelir Faturaları (sales invoices) in Giden e-Faturalar
    if (activeDirection === "outbox" && !isDespatch && Array.isArray(invoices)) {
      for (const inv of invoices) {
        if (inv.type === "sales" && inv.docKind !== "receipt") {
          const converted = invoiceToMysoftOutgoingEDocument(
            inv,
            companySettings,
            activeManagedCompanyId,
          );
          mergedMap.set(makeDedupeKey(converted), converted);
        }
      }
    }

    // 3. Overlay remote Mysoft documents (authoritative ETTN & envelope status)
    for (const doc of documents) {
      mergedMap.set(makeDedupeKey(doc), doc);
    }

    return Array.from(mergedMap.values()).sort((a, b) => {
      const da = String(documentDate(a) || "");
      const db = String(documentDate(b) || "");
      if (da !== db) return db.localeCompare(da);
      return String(documentNumber(b) || "").localeCompare(String(documentNumber(a) || ""));
    });
  }, [documents, invoices, activeDirection, isDespatch, family, companySettings, activeManagedCompanyId]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([
      new Date().getFullYear(),
      new Date().getFullYear() - 1,
      new Date().getFullYear() - 2,
    ]);
    for (const doc of allDocuments) {
      const { year } = parseDocYearMonth(documentDate(doc));
      if (year) years.add(year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [allDocuments]);

  // Counts per month (1..12) for the selected year
  const monthCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    const targetYear =
      selectedYear !== "all" && /^\d{4}$/.test(selectedYear)
        ? parseInt(selectedYear, 10)
        : null;
    for (const doc of allDocuments) {
      const { year, month } = parseDocYearMonth(documentDate(doc));
      if (!month) continue;
      if (targetYear !== null && year !== targetYear) continue;
      counts[month] = (counts[month] || 0) + 1;
    }
    return counts;
  }, [allDocuments, selectedYear]);

  // Filter by selected year & monthly/custom period option
  const periodFilteredDocuments = useMemo(() => {
    const now = new Date();
    const targetYear =
      selectedYear !== "all" && /^\d{4}$/.test(selectedYear)
        ? parseInt(selectedYear, 10)
        : null;

    return allDocuments.filter((doc) => {
      const docIso = String(documentDate(doc)).slice(0, 10);
      if (period === "custom" && customStartDate && customEndDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(docIso)) {
          const from = customStartDate <= customEndDate ? customStartDate : customEndDate;
          const to = customStartDate <= customEndDate ? customEndDate : customStartDate;
          return docIso >= from && docIso <= to;
        }
        return true;
      }

      const { year, month } = parseDocYearMonth(documentDate(doc));
      if (!year || !month) return true;

      if (period.startsWith("month_")) {
        const wantedMonth = parseInt(period.replace("month_", ""), 10);
        if (targetYear !== null && year !== targetYear) return false;
        return month === wantedMonth;
      }

      if (period === "this_month") {
        const wantedYear = targetYear ?? now.getFullYear();
        return year === wantedYear && month === now.getMonth() + 1;
      }

      if (period === "three_months") {
        const range = getSyncRange("three_months", selectedYear);
        if (/^\d{4}-\d{2}-\d{2}$/.test(docIso)) {
          return docIso >= range.startDate && docIso <= range.endDate;
        }
        return true;
      }

      // period === "all"
      if (targetYear !== null) {
        return year === targetYear;
      }
      return true;
    });
  }, [allDocuments, period, selectedYear, customStartDate, customEndDate]);

  // Quick tab counts for Incoming e-Invoices
  const inboxQuickTabCounts = useMemo(() => {
    const allCount = periodFilteredDocuments.length;
    let waitingCount = 0;
    let unaccountedCount = 0;
    let accountedCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    for (const doc of periodFilteredDocuments) {
      const st = resolveMysoftDocumentStatus(documentStatus(doc));
      const imported = isDocumentImported(doc);
      if (imported) accountedCount++;
      else unaccountedCount++;

      if (isWaitingCommercialApproval(doc)) waitingCount++;
      if (st.tone === "success" || st.tone === "info") acceptedCount++;
      if (st.tone === "danger") rejectedCount++;
    }
    return {
      all: allCount,
      waiting_response: waitingCount,
      unaccounted: unaccountedCount,
      accounted: accountedCount,
      accepted: acceptedCount,
      rejected: rejectedCount,
    };
  }, [periodFilteredDocuments, isDocumentImported, isWaitingCommercialApproval]);

  const availableTypes = useMemo(
    () =>
      Array.from(
        new Set(periodFilteredDocuments.map((document) => String(documentType(document)))),
      ).sort(),
    [periodFilteredDocuments],
  );
  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(periodFilteredDocuments.map((document) => documentStatus(document))),
      ).sort(),
    [periodFilteredDocuments],
  );
  const filteredDocuments = useMemo(() => {
    const query = String(searchTerm || "").trim().toLocaleLowerCase("tr-TR");
    return periodFilteredDocuments.filter((document) => {
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

      if (query && !haystack.includes(query)) return false;
      if (statusFilter !== "all" && documentStatus(document) !== statusFilter) return false;
      if (typeFilter !== "all" && String(documentType(document)) !== typeFilter) return false;

      if (activeDirection === "inbox" && inboxQuickTab !== "all") {
        const st = resolveMysoftDocumentStatus(documentStatus(document));
        if (inboxQuickTab === "waiting_response" && !isWaitingCommercialApproval(document)) {
          return false;
        }
        if (inboxQuickTab === "unaccounted" && isDocumentImported(document)) {
          return false;
        }
        if (inboxQuickTab === "accounted" && !isDocumentImported(document)) {
          return false;
        }
        if (inboxQuickTab === "accepted" && st.tone !== "success" && st.tone !== "info") {
          return false;
        }
        if (inboxQuickTab === "rejected" && st.tone !== "danger") {
          return false;
        }
      }

      return true;
    });
  }, [
    periodFilteredDocuments,
    searchTerm,
    statusFilter,
    typeFilter,
    activeDirection,
    inboxQuickTab,
    isWaitingCommercialApproval,
    isDocumentImported,
  ]);

  const stats = useMemo(() => {
    const accepted = periodFilteredDocuments.filter((document) => {
      const tone = resolveMysoftDocumentStatus(documentStatus(document)).tone;
      return tone === "success" || tone === "info";
    }).length;
    const waiting = periodFilteredDocuments.filter((document) => {
      return resolveMysoftDocumentStatus(documentStatus(document)).tone === "warning";
    }).length;
    const failed = periodFilteredDocuments.filter((document) => {
      return resolveMysoftDocumentStatus(documentStatus(document)).tone === "danger";
    }).length;
    const total = periodFilteredDocuments.reduce(
      (sum, document) => sum + Number(documentAmount(document) || 0),
      0,
    );
    return {
      total: periodFilteredDocuments.length,
      accepted,
      waiting,
      failed,
      amount: total,
      unaccounted: inboxQuickTabCounts.unaccounted,
      accounted: inboxQuickTabCounts.accounted,
      waitingCommercial: inboxQuickTabCounts.waiting_response,
    };
  }, [periodFilteredDocuments, inboxQuickTabCounts]);

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    const allFilteredIds = filteredDocuments.map((d) => documentIdentity(d));
    const allSelected =
      allFilteredIds.length > 0 &&
      allFilteredIds.every((id) => selectedDocIds.includes(id));
    if (allSelected) {
      setSelectedDocIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedDocIds(Array.from(new Set([...selectedDocIds, ...allFilteredIds])));
    }
  };

  const handleBatchImportSelected = async () => {
    if (!onImportInvoice) return;
    const targetDocs = filteredDocuments.filter(
      (d) =>
        (selectedDocIds.length === 0 || selectedDocIds.includes(documentIdentity(d))) &&
        !isDocumentImported(d),
    );
    if (targetDocs.length === 0) {
      setNotice("Aktarılacak muhasebeleşmemiş gelen e-Fatura bulunamadı.");
      return;
    }
    setIsBulkImporting(true);
    try {
      let importedCount = 0;
      for (const doc of targetDocs) {
        const enriched = await ensureDocumentEnriched(doc);
        onImportInvoice(enriched);
        importedCount++;
      }
      setSelectedDocIds([]);
      setNotice(
        `${importedCount} adet gelen e-Fatura UBL kalemleriyle birlikte Alış Faturaları ve Cari Hesaplara başarıyla aktarıldı.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleBatchActionSelected = async (action: "accept" | "acknowledge") => {
    const targets = filteredDocuments.filter((d) =>
      selectedDocIds.includes(documentIdentity(d)),
    );
    if (targets.length === 0) return;
    setIsBulkImporting(true);
    try {
      let done = 0;
      for (const doc of targets) {
        const id = documentIdentity(doc);
        const opts = {
          direction: documentDirection(doc),
          tenantIdentifierNumber: activeTenantIdentifierNumber,
          companyId: activeManagedCompanyId,
          family,
        };
        if (action === "accept") {
          await acceptMysoftEDocument(id, opts);
        } else {
          await acknowledgeMysoftEDocument(id, opts);
        }
        applyActionResult(action, doc);
        done++;
      }
      setSelectedDocIds([]);
      setNotice(
        action === "accept"
          ? `${done} adet gelen fatura Mysoft'ta toplu olarak kabul edildi.`
          : `${done} adet gelen fatura Mysoft'ta alındı olarak işaretlendi.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBulkImporting(false);
    }
  };

  const getEDocumentsExportData = useCallback((): ExportData => {
    const isDespatch = family === "despatch";
    const dirText = activeDirection === "inbox" ? "Gelen" : "Giden";
    const dateStr = new Date().toLocaleDateString("tr-TR");
    const headers = [
      "Belge No",
      "Yön",
      "Belge Türü",
      "Cari Unvanı / Taraf",
      "VKN / TCKN",
      "Tarih",
      "Tutar",
      "Para Birimi",
      "Durum",
      "Muhasebe Durumu",
      "ETTN / UUID",
    ];
    const rows = filteredDocuments.map((doc) => {
      const data = asRecord(doc);
      return [
        documentNumber(doc) || "-",
        dirText,
        documentType(doc) || "-",
        documentParty(doc) || "-",
        documentTaxNumber(doc) || "-",
        documentDate(doc) ? formatDate(documentDate(doc)) : "-",
        documentAmount(doc) !== undefined ? formatMoney(documentAmount(doc)) : "-",
        documentCurrency(doc) || "TRY",
        resolveMysoftDocumentStatus(documentStatus(doc)).label,
        activeDirection === "inbox"
          ? isDocumentImported(doc)
            ? "Alış Faturasına Aktarıldı"
            : "Bekliyor"
          : "Satış Faturası",
        String(data.ettn || data.uuid || "-"),
      ];
    });

    return {
      filename: `Mysoft_${dirText}_${isDespatch ? "eIrsaliyeler" : "eFaturalar"}_${new Date().toISOString().split("T")[0]}`,
      sheetName: isDespatch ? "e-İrsaliye" : "e-Fatura",
      title: `MYSOFT ${dirText.toUpperCase()} ${isDespatch ? "E-İRSALİYELER" : "E-FATURALAR"} LİSTESİ`,
      subtitle: `Toplam ${filteredDocuments.length} Belge | Rapor Tarihi: ${dateStr}`,
      headers,
      rows,
    };
  }, [family, activeDirection, filteredDocuments, isDocumentImported]);

  const directionLabel = isDespatch
    ? activeDirection === "inbox"
      ? "Gelen e-İrsaliyeler"
      : "Giden e-İrsaliyeler"
    : activeDirection === "inbox"
      ? "Gelen e-Faturalar"
      : "Giden e-Faturalar";
  const DirectionIcon =
    activeDirection === "inbox" ? ArrowDownLeft : ArrowUpRight;

  const [previewDocType, setPreviewDocType] = useState<"auto" | "e_fatura" | "e_arsiv">("auto");
  const [localDesign, setLocalDesign] = useState<InvoiceDesignSettings>(() =>
    resolveInvoiceDesignSettings(companySettings)
  );

  useEffect(() => {
    setLocalDesign(resolveInvoiceDesignSettings(companySettings));
  }, [companySettings]);

  if (selectedDocument) {
    const docData = asRecord(selectedDocument);
    const docNo = String(documentNumber(selectedDocument) || "TASLAK");
    const cleanDocNo = docNo.replace(/\s*\(TASLAK\)\s*$/i, "").trim();
    const matchedLocalInvoice = (invoices || []).find(
      (inv) =>
        inv.invoiceNumber === docNo ||
        inv.invoiceNumber === cleanDocNo ||
        (docData.ettn && inv.eDocumentEttn === docData.ettn)
    );

    const rawPayloadObj = asRecord(docData.raw);
    const rawLines = Array.isArray(docData.items) && docData.items.length > 0
      ? docData.items
      : Array.isArray(docData.lines) && docData.lines.length > 0
      ? docData.lines
      : Array.isArray(docData.invoiceDetail) && docData.invoiceDetail.length > 0
      ? docData.invoiceDetail
      : Array.isArray(rawPayloadObj.invoiceDetail) && rawPayloadObj.invoiceDetail.length > 0
      ? rawPayloadObj.invoiceDetail
      : Array.isArray(rawPayloadObj.items) && rawPayloadObj.items.length > 0
      ? rawPayloadObj.items
      : Array.isArray(docData.invoiceLine)
      ? docData.invoiceLine
      : [];

    const mappedItems: InvoiceItem[] =
      matchedLocalInvoice && matchedLocalInvoice.items?.length > 0
        ? matchedLocalInvoice.items
        : rawLines.length > 0
        ? rawLines.map((ln: any, idx: number) => {
            const qty = Number(ln.quantity ?? ln.qty ?? 1) || 1;
            const price = Number(ln.unitPrice ?? ln.unitPriceTra ?? ln.price ?? ln.amount ?? 0) || 0;
            const vatRate = Number(ln.vatRate ?? ln.taxRate ?? ln.taxPercent ?? ln.kdvPercent ?? 20);
            const totalWithoutVat = Number(ln.totalWithoutVat ?? ln.amtTra ?? ln.lineExtensionAmount ?? qty * price);
            const vatAmount = Number(ln.vatAmount ?? ln.amtVatTra ?? ln.taxAmount ?? (totalWithoutVat * vatRate) / 100);
            return {
              id: String(ln.id || `line_${idx}`),
              productCode: ln.productCode || ln.itemCode || undefined,
              description: String(ln.description || ln.productName || ln.itemName || ln.note || "Mal / Hizmet Kalemi"),
              quantity: qty,
              unit: String(ln.unit || ln.unitName || ln.unitCode || "Adet"),
              unitPrice: price,
              vatRate,
              totalWithoutVat,
              vatAmount,
              totalWithVat: totalWithoutVat + vatAmount,
            };
          })
        : [
            {
              id: "line_1",
              description: `${documentType(selectedDocument)} - ${documentParty(selectedDocument)}`,
              quantity: 1,
              unit: "Adet",
              unitPrice: Number(docData.subtotal ?? documentAmount(selectedDocument) ?? 0),
              vatRate: 20,
              totalWithoutVat: Number(docData.subtotal ?? documentAmount(selectedDocument) ?? 0),
              vatAmount: Number(docData.vatTotal ?? 0),
              totalWithVat: Number(documentAmount(selectedDocument) ?? 0),
            },
          ];

    const isArchive = isArchiveDocument(selectedDocument);
    const previewInvoice: Partial<Invoice> = matchedLocalInvoice || {
      id: documentIdentity(selectedDocument),
      invoiceNumber: docNo,
      type: documentDirection(selectedDocument) === "inbox" ? "purchase" : "sales",
      invoiceScenario: isArchive
        ? "EARSIVFATURA"
        : (docData.profile as any) || "TICARIFATURA",
      invoiceProfileType: "SATIS",
      eDocumentType: isArchive ? "e_arsiv" : "e_fatura",
      eDocumentEttn: String(docData.ettn || docData.uuid || ""),
      contactId: "edoc_party",
      contactName: String(documentParty(selectedDocument)),
      taxNumber: String(documentTaxNumber(selectedDocument)),
      taxOffice: String(docData.taxOffice || docData.receiverTaxOffice || docData.senderTaxOffice || "-"),
      customerAddress: String(docData.address || docData.receiverAddress || docData.senderAddress || ""),
      issueDate: String(documentDate(selectedDocument) || new Date().toISOString().slice(0, 10)).slice(0, 10),
      dueDate: String(docData.dueDate || documentDate(selectedDocument) || new Date().toISOString().slice(0, 10)).slice(0, 10),
      items: mappedItems,
      subtotal: Number(docData.subtotal ?? documentAmount(selectedDocument) ?? 0),
      totalVat: Number(docData.vatTotal ?? 0),
      grandTotal: Number(documentAmount(selectedDocument) ?? 0),
      payableAmount: Number(documentAmount(selectedDocument) ?? 0),
      paidAmount: 0,
      remainingAmount: Number(documentAmount(selectedDocument) ?? 0),
      currency: documentCurrency(selectedDocument),
      status: "sent",
    };

    const effectiveCompanySettings: CompanySettings =
      documentDirection(selectedDocument) === "inbox"
        ? {
            ...(companySettings || ({} as CompanySettings)),
            companyName: String(documentParty(selectedDocument)),
            companyTitle: String(documentParty(selectedDocument)),
            taxNumber: String(documentTaxNumber(selectedDocument)),
            taxOffice: String(docData.senderTaxOffice || "-"),
            address: String(docData.senderAddress || "Merkez Adres"),
            city: String(docData.senderCity || ""),
            phone: String(docData.senderPhone || "-"),
            email: String(docData.senderEmail || "-"),
            website: "",
            currency: documentCurrency(selectedDocument),
          }
        : companySettings || {
            companyName: activeCompany?.name || "FİRMA ÜNVANI",
            companyTitle: activeCompany?.name || "FİRMA ÜNVANI",
            taxOffice: "-",
            taxNumber: activeCompany?.taxNumber || activeTenantIdentifierNumber || "-",
            address: "Merkez",
            city: "İstanbul",
            phone: "-",
            email: "-",
            website: "",
            currency: "TRY",
          };

    const effectiveBuyerContact =
      documentDirection(selectedDocument) === "inbox"
        ? {
            id: "self_buyer",
            name: companySettings?.companyTitle || companySettings?.companyName || activeCompany?.name || "Alıcı Firma",
            taxNumber: companySettings?.taxNumber || activeCompany?.taxNumber || activeTenantIdentifierNumber || "-",
            taxOffice: companySettings?.taxOffice || "-",
            address: companySettings?.address || "",
            city: companySettings?.city || "",
            contactType: "customer" as const,
            balance: 0,
            balanceType: "balanced" as const,
            createdAt: "",
          }
        : undefined;

    const tone = statusTone(documentStatus(selectedDocument));
    const docId = documentIdentity(selectedDocument);
    const isIncomingDoc = documentDirection(selectedDocument) === "inbox";

    return (
      <DetailPageLayout
        title={`${docNo} — ${documentParty(selectedDocument)}`}
        subtitle={
          isIncomingDoc
            ? `Gelen Orijinal ${isDespatch ? "e-İrsaliye" : isArchive ? "e-Arşiv Fatura" : "e-Fatura"} Belgesi • ETTN: ${docData.ettn || docData.uuid || "-"}`
            : `Resmi GİB ${isArchive ? "e-Arşiv Fatura" : "e-Fatura"} Görünümü • ETTN: ${docData.ettn || docData.uuid || "-"}`
        }
        breadcrumbs={[
          { label: directionLabel, onClick: handleCloseDetail },
          { label: docNo, active: true },
        ]}
        onBack={handleCloseDetail}
        statusBadge={
          <span className={`px-3 py-1 rounded-xl border text-xs font-bold ${tone.className}`}>
            {tone.label}
          </span>
        }
        headerIcon={<FileText className="w-5 h-5 text-red-700" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isIncomingDoc && (
              <>
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={() => void runDocumentAction("accept")}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kabul Et</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={() => setIsRejecting((v) => !v)}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reddet</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={() => void runDocumentAction("acknowledge")}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Alındı İşaretle</span>
                </button>
                {!isDespatch && onImportInvoice && (
                  isDocumentImported(selectedDocument) ? (
                    <span className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Alış Faturalarında Kayıtlı</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={importingDocId === docId}
                      onClick={() => void handleImportToPurchaseInvoice(selectedDocument)}
                      className="px-3 py-2 rounded-xl bg-[#0f6bae] hover:bg-[#0c568c] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {importingDocId === docId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                      )}
                      <span>Alış Faturasına Aktar (Muhasebeleştir)</span>
                    </button>
                  )
                )}
              </>
            )}

            {!isIncomingDoc && isArchive && (
              <button
                type="button"
                disabled={Boolean(actionLoading)}
                onClick={() => void runDocumentAction("cancel")}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>e-Arşiv İptal Et</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void triggerDownload(selectedDocument, "pdf")}
              disabled={downloading?.id === docId}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Resmi PDF İndir</span>
            </button>

            <button
              type="button"
              onClick={() => void triggerDownload(selectedDocument, "xml")}
              disabled={downloading?.id === docId}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>UBL XML İndir</span>
            </button>

            {isIncomingDoc && (
              <button
                type="button"
                onClick={() => void triggerDownload(selectedDocument, "html")}
                disabled={downloading?.id === docId}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>GİB HTML İndir</span>
              </button>
            )}

            {isIncomingDoc ? (
              <button
                type="button"
                onClick={() => void printHtmlElement("invoice-preview-paper", `${docNo}_Gelen_eBelge`)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-sky-300" />
                <span>Faturayı Yazdır</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  openInvoicePrintModal(
                    {
                      invoice: previewInvoice,
                      companySettings: { ...effectiveCompanySettings, invoiceDesign: localDesign },
                      contact: effectiveBuyerContact,
                    },
                    { title: `${docNo}_eBelge` }
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-purple-300" />
                <span>Yazdır / Şablon</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCloseDetail}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
            >
              Listeye Dön
            </button>
          </div>
        }
      >
        <div className="max-w-5xl mx-auto space-y-4">
          {isDetailLoading && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mysoft üzerinden belge kalemleri ve zarf detayları güncelleniyor...</span>
            </div>
          )}

          {(detailError || actionError) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {actionError || detailError}
            </div>
          )}

          {isRejecting && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <label className="block text-xs font-bold text-rose-900">
                Ticari e-Fatura Red Gerekçesi:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Red sebebini yazınız..."
                  className="flex-1 bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => void runDocumentAction("deny")}
                  disabled={!rejectReason.trim() || Boolean(actionLoading)}
                  className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Reddi Gönder
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-200/60 p-3 sm:p-6 md:p-8 rounded-3xl border border-slate-300/70 shadow-inner flex justify-center">
            {isIncomingDoc ? (
              <IncomingGIBInvoiceView
                invoice={previewInvoice}
                buyerCompanySettings={companySettings}
                rawEDocument={selectedDocument}
                tenantIdentifierNumber={activeTenantIdentifierNumber}
                companyId={activeManagedCompanyId}
                family={family}
                paperId="invoice-preview-paper"
              />
            ) : (
              <OfficialGIBInvoicePaper
                invoice={previewInvoice}
                companySettings={effectiveCompanySettings}
                contact={effectiveBuyerContact}
                designOverride={localDesign}
                previewDocTypeOverride={previewDocType}
                paperId="invoice-preview-paper"
              />
            )}
          </div>
        </div>
      </DetailPageLayout>
    );
  }

  const pkAlias =
    companySettings?.mysoftPkAlias ||
    companySettings?.eInvoiceAlias ||
    (activeTenantIdentifierNumber
      ? `urn:mail:defaultpk@${activeTenantIdentifierNumber}.gov.tr`
      : "urn:mail:defaultpk@muavin.tr");

  return (
    <section className="p-4 sm:p-6 max-w-[1500px] mx-auto space-y-5 sm:space-y-6">
      {/* EDITORIAL MODULE ENTRANCE HEADER */}
      <ModuleEntranceHeader
        badge="Mysoft e-Belge Entegrasyonu"
        badgeIcon={<DirectionIcon className="w-2.5 h-2.5 text-[#0f6bae]" />}
        title={directionLabel}
        description={
          isDespatch
            ? "Mysoft gelen ve giden e-irsaliye listesi. Belgeler seçilen müşterinin VKN’si ile çekilir."
            : activeDirection === "outbox"
              ? "Kesilen tüm gelir faturaları (e-Fatura, e-Arşiv ve GYR) bu ekrana otomatik aktarılır; aylık olarak filtreleyebilir ve Mysoft ile senkronize edebilirsiniz."
              : "Mysoft Gelen e-Fatura Entegrasyon Merkezi. Gelen faturaları belge veya geliş tarihine göre sorgulayın, orijinal GİB görünümünde inceleyin, UBL kalemleriyle alış faturalarına ve cari hesaplara tek tıkla aktarın."
        }
        actions={
          <>
            {!direction && (
              <div className="p-1 bg-white border border-slate-200 rounded-xl flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleDirectionChange("inbox")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${activeDirection === "inbox" ? "bg-[#eaedff] text-[#0f6bae]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Gelen
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectionChange("outbox")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${activeDirection === "outbox" ? "bg-[#eaedff] text-[#0f6bae]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Giden
                </button>
              </div>
            )}
            <select
              aria-label="Yıl seçimi"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0f6bae] shrink-0 cursor-pointer"
            >
              <option value="all">Tüm Yıllar</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr} Yılı
                </option>
              ))}
            </select>
            <select
              aria-label="Aylık dönem seçimi"
              value={period}
              onChange={(event) => setPeriod(event.target.value as SyncPeriod)}
              className="h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0f6bae] shrink-0 cursor-pointer"
            >
              <option value="all">Tüm Aylar (Yıllık)</option>
              <option value="this_month">
                Bu Ay ({TURKISH_MONTHS[new Date().getMonth()]?.name})
              </option>
              <option value="three_months">Son 3 Ay</option>
              <option value="custom">Özel Tarih Aralığı</option>
              <optgroup label="Aylık Seçenekler">
                {TURKISH_MONTHS.map((m) => (
                  <option key={m.id} value={`month_${m.id}`}>
                    {m.name} {selectedYear !== "all" ? selectedYear : ""}
                  </option>
                ))}
              </optgroup>
            </select>
            {activeDirection === "inbox" && !isDespatch && (
              <button
                type="button"
                onClick={() => void handleFetchNewIncoming()}
                disabled={isSyncing || tenantsLoading || !activeTenantIdentifierNumber}
                className="h-10 px-3.5 rounded-xl bg-[#eaedff] hover:bg-[#dae2fd] text-[#0f6bae] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
                title="Mysoft gelen kutusundaki yeni faturaları sorgula"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Yeni Gelenleri Sorgula</span>
              </button>
            )}
            {activeDirection === "inbox" && !isDespatch && onImportInvoice && filteredDocuments.some((d) => !isDocumentImported(d)) && (
              <button
                type="button"
                disabled={isBulkImporting}
                onClick={() => void handleBatchImportSelected()}
                className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60 cursor-pointer shrink-0"
              >
                {isBulkImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {selectedDocIds.length > 0
                    ? `Seçilenleri Alışa Aktar (${selectedDocIds.length})`
                    : `Gelenleri Alışa Aktar (${filteredDocuments.filter((d) => !isDocumentImported(d)).length})`}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || tenantsLoading || !activeTenantIdentifierNumber}
              className="h-10 px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors hover:brightness-110 disabled:opacity-60 cursor-pointer shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isSyncing ? "Senkronize ediliyor" : "Mysoft'tan senkronize et"}
            </button>
          </>
        }
      />

      {/* MYSOFT GELEN E-FATURA ENTEGRASYON MERKEZİ PANELİ */}
      {activeDirection === "inbox" && (
        <div className="bg-gradient-to-r from-[#0b2341] via-[#10335c] to-[#13467c] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-sky-900/40">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {connectionStatus?.mockMode
                    ? "Mysoft Entegrasyon Aktif (Simülasyon / Canlı UBL Motoru)"
                    : "Mysoft Canlı GİB Entegrasyonu Aktif"}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/10 text-sky-100 border border-white/15">
                  Mükellef VKN/TCKN: <strong className="text-white">{activeTenantIdentifierNumber || "-"}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/10 text-sky-200 border border-white/15 hidden sm:inline-block">
                  PK Etiketi: {pkAlias}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Mysoft Gelen {isDespatch ? "e-İrsaliye" : "e-Fatura"} Entegrasyon ve Otomatik Muhasebeleştirme Merkezi
              </h3>
              <p className="text-xs text-sky-100/85 max-w-3xl">
                Mysoft gelen kutusundaki belgeler UBL-TR 1.2 XML ve orijinal GİB XSLT görünümü ile çekilir. Faturaları{" "}
                <strong>Belge Tarihine</strong> veya <strong>GİB Zarf Geliş Tarihine</strong> göre sorgulayabilir, ticari faturalara kabul/red yanıtı verebilir ve alış faturalarına kalem bazında aktarabilirsiniz.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              {/* Sorgulama Kriteri: Fatura Tarihi vs Geliş/Zarf Tarihi */}
              <div className="bg-white/10 border border-white/15 rounded-xl p-1 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setIsUseDocDate(true)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    isUseDocDate
                      ? "bg-white text-[#0b2341] shadow-xs"
                      : "text-sky-100 hover:text-white"
                  }`}
                  title="Fatura üzerindeki düzenleme tarihine göre sorgula (isUseDocDate: true)"
                >
                  Fatura Tarihine Göre
                </button>
                <button
                  type="button"
                  onClick={() => setIsUseDocDate(false)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    !isUseDocDate
                      ? "bg-white text-[#0b2341] shadow-xs"
                      : "text-sky-100 hover:text-white"
                  }`}
                  title="Zarfın Mysoft gelen kutusuna düştüğü tarihe göre sorgula (isUseDocDate: false)"
                >
                  Geliş / Zarf Tarihine Göre
                </button>
              </div>
            </div>
          </div>

          {/* Özel Tarih Aralığı & Entegrasyon Durum Çubuğu */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sky-200 font-semibold">Sorgu Tarih Aralığı:</span>
              <input
                type="date"
                value={
                  period === "custom"
                    ? customStartDate
                    : resolveEffectiveSyncRange("inbox").startDate
                }
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setPeriod("custom");
                }}
                className="h-8 px-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-mono outline-none focus:border-sky-300"
              />
              <span className="text-sky-200">—</span>
              <input
                type="date"
                value={
                  period === "custom"
                    ? customEndDate
                    : resolveEffectiveSyncRange("inbox").endDate
                }
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setPeriod("custom");
                }}
                className="h-8 px-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-mono outline-none focus:border-sky-300"
              />
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={isSyncing || !activeTenantIdentifierNumber}
                className="h-8 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Bu Aralığı Çek</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-sky-200">
              <span>
                Aktif Firma: <strong className="text-white">{activeCompany?.name || companySettings?.companyTitle || "Seçili Mükellef"}</strong>
              </span>
              {lastSyncedAt && (
                <span>
                  • Son Senkronizasyon:{" "}
                  <strong className="text-emerald-300">
                    {formatDate(lastSyncedAt)}{" "}
                    {new Date(lastSyncedAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {!shouldHideMysoftPartners && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-[180px]">
              <Building2 className="w-4 h-4 text-[#0f6bae]" />
              Mysoft iş ortakları
            </div>
            <select
              aria-label="Mysoft iş ortağı"
              value={activeTenantIdentifierNumber || ""}
              onChange={(event) => setSelectedTaxNumber(event.target.value || undefined)}
              disabled={tenantsLoading || tenants.length === 0}
              className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:border-[#0f6bae]"
            >
              <option value="">
                {tenantsLoading
                  ? "İş ortakları yükleniyor..."
                  : tenants.length === 0
                    ? "Listede iş ortağı yok"
                    : "İş ortağı seçin"}
              </option>
              {tenants.map((tenant, idx) => (
                <option key={`${tenant.taxNumber}_${tenant.id || idx}`} value={tenant.taxNumber}>
                  {tenant.name} — {tenant.taxNumber}
                  {tenant.id ? ` (#${tenant.id})` : ""}
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
              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0f6bae]"
            />
            <button
              type="button"
              onClick={() => void handleLookupVkn()}
              disabled={isLookingUpVkn}
              className="h-10 px-3 rounded-xl bg-[#eaedff] text-[#0f6bae] text-xs font-semibold hover:bg-[#dae2fd] disabled:opacity-60"
            >
              {isLookingUpVkn ? "Sorgulanıyor..." : "VKN ile getir"}
            </button>
          </div>
          {partnerHint && <p className="text-xs text-amber-700">{partnerHint}</p>}
          {tenantError && <p className="text-xs text-rose-600">{tenantError}</p>}
          {activeTenantIdentifierNumber && (
            <p className="text-xs text-slate-500">
              Belge çekimi seçilen VKN ile yapılacak: {activeTenantIdentifierNumber}
            </p>
          )}
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
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
        <div className="haze-form-error-toast flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-[#fecdd3] text-[#7f1d1d] text-sm font-medium">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#b91c1c]" />
            <div>
              <p className="font-bold text-[#7f1d1d]">Mysoft bağlantısı kurulamadı</p>
              <p className="mt-0.5 text-[#7f1d1d]/90">{error}</p>
              <p className="mt-1 text-xs text-[#991b1b]">
                Bağlantı bilgileri tarayıcıya gönderilmez; sunucu ortam
                değişkenlerini ve API erişimini kontrol edin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadDocuments(activeDirection)}
            className="shrink-0 text-xs font-bold text-[#991b1b] underline hover:text-[#7f1d1d] cursor-pointer"
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {(activeDirection === "inbox" && !isDespatch
          ? [
              {
                label: "Toplam Gelen Fatura",
                value: stats.total.toLocaleString("tr-TR"),
                icon: FileText,
                accent: "text-[#0f6bae] bg-[#eaedff]",
              },
              {
                label: "Muhasebeleşmeyen (Bekleyen)",
                value: stats.unaccounted.toLocaleString("tr-TR"),
                icon: ArrowDownToLine,
                accent: "text-amber-600 bg-amber-50",
              },
              {
                label: "Alışa Aktarılan (Muhasebeleşen)",
                value: stats.accounted.toLocaleString("tr-TR"),
                icon: CheckCircle2,
                accent: "text-emerald-600 bg-emerald-50",
              },
              {
                label: "Yanıt Bekleyen Ticari",
                value: stats.waitingCommercial.toLocaleString("tr-TR"),
                icon: Clock3,
                accent: "text-purple-600 bg-purple-50",
              },
              {
                label: "Gelen Fatura Toplamı",
                value: formatMoney(stats.amount),
                icon: DirectionIcon,
                accent: "text-sky-600 bg-sky-50",
              },
            ]
          : [
              {
                label: "Toplam belge",
                value: stats.total.toLocaleString("tr-TR"),
                icon: FileText,
                accent: "text-[#0f6bae] bg-[#eaedff]",
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
                label: "Hata / red / iptal",
                value: stats.failed.toLocaleString("tr-TR"),
                icon: XCircle,
                accent: "text-rose-600 bg-rose-50",
              },
              {
                label: "Belge toplamı",
                value: formatMoney(stats.amount),
                icon: DirectionIcon,
                accent: "text-sky-600 bg-sky-50",
              },
            ]
        ).map((card) => {
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

      {/* Aylık Dönem Seçenekleri Barı (Gelen & Giden Faturalar İçin Aylık Filtre) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Aylık Fatura Dönemi:
            </span>
            <select
              aria-label="Aylık filtre yılı"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0f6bae] cursor-pointer"
            >
              <option value="all">Tüm Yıllar</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === "all"
                  ? "bg-[#0f6bae] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tüm Aylar
            </button>
            <button
              type="button"
              onClick={() => setPeriod("this_month")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === "this_month"
                  ? "bg-[#0f6bae] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bu Ay ({TURKISH_MONTHS[new Date().getMonth()]?.name})
            </button>
            <button
              type="button"
              onClick={() => setPeriod("three_months")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === "three_months"
                  ? "bg-[#0f6bae] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Son 3 Ay
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {TURKISH_MONTHS.map((m) => {
            const monthKey = `month_${m.id}` as SyncPeriod;
            const isSelected = period === monthKey;
            const count = monthCounts[m.id] || 0;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPeriod(monthKey)}
                className={`px-2 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#eaedff] border-[#0f6bae] text-[#0f6bae] font-bold shadow-2xs"
                    : count > 0
                      ? "bg-white border-slate-200 text-slate-800 hover:border-[#0f6bae]/40 hover:bg-slate-50"
                      : "bg-slate-50/70 border-slate-100 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{m.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected
                        ? "bg-[#0f6bae] text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* GELEN E-FATURA HIZLI SEKME FİLTRELERİ */}
        {activeDirection === "inbox" && !isDespatch && (
          <div className="px-4 pt-3 pb-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: "Tümü", count: inboxQuickTabCounts.all },
                  {
                    id: "unaccounted",
                    label: "Muhasebeleşmeyenler",
                    count: inboxQuickTabCounts.unaccounted,
                  },
                  {
                    id: "accounted",
                    label: "Alışa Aktarılanlar",
                    count: inboxQuickTabCounts.accounted,
                  },
                  {
                    id: "waiting_response",
                    label: "Yanıt Bekleyen Ticari",
                    count: inboxQuickTabCounts.waiting_response,
                  },
                  {
                    id: "accepted",
                    label: "Kabul / Temel Fatura",
                    count: inboxQuickTabCounts.accepted,
                  },
                  {
                    id: "rejected",
                    label: "Reddedilenler",
                    count: inboxQuickTabCounts.rejected,
                  },
                ] as { id: InboxQuickTab; label: string; count: number }[]
              ).map((tab) => {
                const active = inboxQuickTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInboxQuickTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? "bg-[#0f6bae] text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedDocIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 bg-[#eaedff] border border-[#0f6bae]/30 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-[#0f6bae]">
                  {selectedDocIds.length} belge seçili
                </span>
                {onImportInvoice && (
                  <button
                    type="button"
                    disabled={isBulkImporting}
                    onClick={() => void handleBatchImportSelected()}
                    className="px-2.5 py-1 rounded-lg bg-[#0f6bae] hover:bg-[#0c568c] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                    <span>Seçilenleri Alışa Aktar</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={isBulkImporting}
                  onClick={() => void handleBatchActionSelected("accept")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Toplu Kabul Et</span>
                </button>
                <button
                  type="button"
                  disabled={isBulkImporting}
                  onClick={() => void handleBatchActionSelected("acknowledge")}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span>Alındı İşaretle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDocIds([])}
                  className="text-[11px] text-slate-600 hover:text-slate-900 underline ml-1 cursor-pointer"
                >
                  Temizle
                </button>
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Belge no, cari unvan, VKN veya ETTN ara..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0f6bae] focus:ring-2 focus:ring-[#0f6bae]/10"
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
                  {resolveMysoftDocumentStatus(status).label}
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
            <ExportButtons getExportData={getEDocumentsExportData} size="sm" />
          </div>
        </div>
        {lastSyncedAt && (
          <div className="px-4 py-2 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span>
              Son senkronizasyon: {formatDate(lastSyncedAt)}{" "}
              {new Date(lastSyncedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {activeDirection === "inbox" && (
              <span className="text-[#0f6bae] font-semibold">
                Gelen faturalar orijinal GİB XSLT / UBL-TR 1.2 görünümüyle açılır
              </span>
            )}
          </div>
        )}
        {isLoading && allDocuments.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#0f6bae]" />
            <p className="text-sm">Mysoft belgeleri yükleniyor...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {allDocuments.length === 0
                ? "Henüz belge bulunamadı"
                : "Seçilen ay veya filtreyle eşleşen belge yok"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {allDocuments.length === 0
                ? "Önce iş ortaklarını çekin, birini seçin, sonra senkronize edin."
                : "Yukarıdan farklı bir ay (" +
                  (period !== "all" ? "veya Tüm Aylar" : "veya yıl") +
                  ") seçerek tekrar deneyin."}
            </p>
            {period !== "all" || inboxQuickTab !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setPeriod("all");
                  setInboxQuickTab("all");
                }}
                className="mt-4 px-3.5 py-2 rounded-lg bg-[#eaedff] text-[#0f6bae] text-xs font-semibold hover:bg-[#dae2fd] cursor-pointer"
              >
                Tüm Belgeleri Göster
              </button>
            ) : (
              allDocuments.length === 0 && (
                <button
                  type="button"
                  onClick={handleSync}
                  className="mt-4 px-3.5 py-2 rounded-lg bg-[#eaedff] text-[#0f6bae] text-xs font-semibold hover:bg-[#dae2fd] cursor-pointer"
                >
                  İlk senkronizasyonu başlat
                </button>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  {activeDirection === "inbox" && !isDespatch && (
                    <th className="w-9 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label="Tümünü seç"
                        checked={
                          filteredDocuments.length > 0 &&
                          filteredDocuments.every((d) =>
                            selectedDocIds.includes(documentIdentity(d)),
                          )
                        }
                        onChange={toggleSelectAllFiltered}
                        className="rounded border-slate-300 text-[#0f6bae] focus:ring-[#0f6bae] cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="w-10 px-2 py-3 font-semibold text-center"></th>
                  <th className="px-4 py-3 font-semibold">Belge</th>
                  <th className="px-4 py-3 font-semibold">
                    {activeDirection === "inbox" ? "Gönderici Cari (Tedarikçi)" : "Alıcı Cari"}
                  </th>
                  <th className="px-4 py-3 font-semibold">Tarih</th>
                  <th className="px-4 py-3 font-semibold">Senaryo / Tür</th>
                  <th className="px-4 py-3 font-semibold text-right">Tutar</th>
                  <th className="px-4 py-3 font-semibold">Zarf & Muhasebe Durumu</th>
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
                  const isExpanded = expandedDocId === id;
                  const isSelected = selectedDocIds.includes(id);
                  const isWaitingResp = isWaitingCommercialApproval(document);
                  const isRowBusy = rowActionLoading?.id === id;
                  const profileBadge = String(
                    data.profile || data.profileId || data.raw?.profileId || "",
                  ).toUpperCase();

                  return (
                    <React.Fragment key={id}>
                      <tr
                        className={`transition-colors ${
                          isExpanded
                            ? "bg-[#eaedff]/30"
                            : isSelected
                              ? "bg-sky-50/70"
                              : "hover:bg-blue-50/80"
                        }`}
                      >
                        {activeDirection === "inbox" && !isDespatch && (
                          <td className="w-9 px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${documentNumber(document)} seç`}
                              checked={isSelected}
                              onChange={() => toggleSelectDoc(id)}
                              className="rounded border-slate-300 text-[#0f6bae] focus:ring-[#0f6bae] cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="w-10 px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => void handleToggleExpandRow(document)}
                            className="p-1 rounded-md text-slate-400 hover:text-[#0f6bae] hover:bg-[#eaedff] transition-colors cursor-pointer"
                            title={isExpanded ? "Detayı Gizle" : "Hızlı Kalem Özeti Göster"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#0f6bae]" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void openDetails(document)}
                            className="group text-left cursor-pointer"
                          >
                            <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-[#0f6bae] underline-offset-2 group-hover:underline">
                              {documentNumber(document)}
                            </span>
                            <span className="block text-[11px] text-slate-400 mt-0.5 font-mono">
                              ETTN: {String(data.ettn || data.uuid || "-").slice(0, 18)}
                              {String(data.ettn || data.uuid || "").length > 18 ? "…" : ""}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-slate-800 max-w-[230px] truncate">
                            {documentParty(document)}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            VKN/TCKN: {documentTaxNumber(document)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {formatDate(documentDate(document))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <FileCode2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {documentType(document)}
                            </span>
                            {profileBadge && (
                              <span
                                className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  profileBadge.includes("TICARI")
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {profileBadge}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800 whitespace-nowrap font-mono tabular-nums font-tabular-num-md">
                          {formatMoney(
                            documentAmount(document),
                            documentCurrency(document),
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-semibold ${tone.className}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {tone.label}
                            </span>
                            {activeDirection === "inbox" && !isDespatch && (
                              isDocumentImported(document) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Muhasebeleşti
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
                                  Alışa Aktarılmadı
                                </span>
                              )
                            )}
                          </div>
                          {(data.envelopeStatusText || data.envelopeStatusCode) && (
                            <span className="block text-[11px] text-slate-400 mt-1 max-w-[190px] truncate" title={String(data.envelopeStatusText || data.envelopeStatusCode)}>
                              Zarf: {data.envelopeStatusText || data.envelopeStatusCode}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {activeDirection === "inbox" && isWaitingResp && (
                              <>
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() => void runRowDocumentAction(document, "accept")}
                                  title="Ticari Faturayı Kabul Et"
                                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Kabul</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() => {
                                    setInlineRejectDocId(inlineRejectDocId === id ? null : id);
                                    setInlineRejectReason("");
                                  }}
                                  title="Ticari Faturayı Reddet"
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Red</span>
                                </button>
                              </>
                            )}
                            {activeDirection === "inbox" && !isDespatch && onImportInvoice && !isDocumentImported(document) && (
                              <button
                                type="button"
                                onClick={() => void handleImportToPurchaseInvoice(document)}
                                disabled={importingDocId === id}
                                title="Alış Faturasına Aktar (Muhasebeleştir)"
                                className="px-2 py-1.5 rounded-lg bg-[#eaedff] hover:bg-[#dae2fd] text-[#0f6bae] text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {importingDocId === id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ArrowDownToLine className="w-3.5 h-3.5" />
                                )}
                                <span>Alışa Aktar</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void openDetails(document)}
                              title="Orijinal Faturayı Görüntüle"
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0f6bae] cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void triggerDownload(document, "pdf")
                              }
                              disabled={isDownloading}
                              title="Resmi PDF indir"
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0f6bae] disabled:opacity-50 cursor-pointer"
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
                              title="UBL XML indir"
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0f6bae] disabled:opacity-50 cursor-pointer"
                            >
                              <FileCode2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Satır İçi Ticari Fatura Red Gerekçesi Kutusu */}
                      {inlineRejectDocId === id && (
                        <tr className="bg-rose-50/70 border-b border-rose-200">
                          <td colSpan={activeDirection === "inbox" && !isDespatch ? 9 : 8} className="px-6 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-rose-900">
                                {documentNumber(document)} Red Gerekçesi:
                              </span>
                              <input
                                type="text"
                                value={inlineRejectReason}
                                onChange={(e) => setInlineRejectReason(e.target.value)}
                                placeholder="Ticari fatura red sebebini yazınız..."
                                className="flex-1 min-w-[220px] h-8 px-3 rounded-lg bg-white border border-rose-300 text-xs outline-none"
                              />
                              <button
                                type="button"
                                disabled={!inlineRejectReason.trim() || isRowBusy}
                                onClick={() =>
                                  void runRowDocumentAction(document, "deny", inlineRejectReason)
                                }
                                className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                              >
                                {isRowBusy ? "Gönderiliyor..." : "Reddi Mysoft'a Gönder"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineRejectDocId(null)}
                                className="h-8 px-2.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold cursor-pointer"
                              >
                                Vazgeç
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Hidden Details Master-Detail Section */}
                      {isExpanded && (
                        <tr className="bg-[#f8fafc] border-b border-slate-200">
                          <td colSpan={activeDirection === "inbox" && !isDespatch ? 9 : 8} className="p-4 pl-12">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">
                                    Hızlı Belge & UBL Kalem Özeti:
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[#0f6bae]">
                                    {documentNumber(document)}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    (ETTN: {data.ettn || data.uuid || "-"})
                                  </span>
                                  {data.profile && (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                      {String(data.profile)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {activeDirection === "inbox" && (
                                    <button
                                      type="button"
                                      onClick={() => void runRowDocumentAction(document, "acknowledge")}
                                      disabled={isRowBusy}
                                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                      <span>Alındı İşaretle</span>
                                    </button>
                                  )}
                                  {activeDirection === "inbox" && !isDespatch && onImportInvoice && !isDocumentImported(document) && (
                                    <button
                                      type="button"
                                      onClick={() => void handleImportToPurchaseInvoice(document)}
                                      disabled={importingDocId === id}
                                      className="px-2.5 py-1 rounded-lg bg-[#0f6bae] hover:bg-[#0c568c] text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                      <ArrowDownToLine className="w-3.5 h-3.5" />
                                      <span>Alış Faturasına Aktar</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => void openDetails(document)}
                                    className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Orijinal GİB Belgesini Aç
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="text-[11px] text-slate-400 block">Muhatap Firma</span>
                                  <span className="font-semibold text-slate-800">{documentParty(document)}</span>
                                </div>
                                <div>
                                  <span className="text-[11px] text-slate-400 block">Vergi No (VKN/TCKN) & Vergi Dairesi</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {documentTaxNumber(document)}
                                    {data.senderTaxOffice ? ` • ${data.senderTaxOffice}` : ""}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[11px] text-slate-400 block">Belge Tarihi & Türü</span>
                                  <span className="font-semibold text-slate-800">{formatDate(documentDate(document))} • {documentType(document)}</span>
                                </div>
                                <div>
                                  <span className="text-[11px] text-slate-400 block">KDV Dahil Toplam Tutar</span>
                                  <span className="font-mono font-bold text-[#0f6bae] text-sm">{formatMoney(documentAmount(document), documentCurrency(document))}</span>
                                </div>
                              </div>
                              {enrichingDocId === id && (
                                <div className="py-2 text-xs text-[#0f6bae] flex items-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>UBL-TR XML içerisinden fatura satırları çözümleniyor...</span>
                                </div>
                              )}
                              {Array.isArray(data.items || data.lines || data.raw?.invoiceDetail) &&
                                (data.items || data.lines || data.raw?.invoiceDetail).length > 0 && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                                      Fatura Kalemleri ({(data.items || data.lines || data.raw?.invoiceDetail).length} Kalem)
                                    </p>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                      <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200">
                                          <tr>
                                            <th className="px-3 py-1.5 text-left">Kod / Açıklama</th>
                                            <th className="px-3 py-1.5 text-right">Miktar</th>
                                            <th className="px-3 py-1.5 text-right">Birim Fiyat</th>
                                            <th className="px-3 py-1.5 text-right">KDV %</th>
                                            <th className="px-3 py-1.5 text-right">Net Tutar</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {(data.items || data.lines || data.raw?.invoiceDetail).map((ln: any, idx: number) => {
                                            const qty = Number(ln.quantity ?? ln.qty ?? 1) || 1;
                                            const price = Number(ln.unitPrice ?? ln.unitPriceTra ?? ln.price ?? 0) || 0;
                                            const vatRate = Number(ln.vatRate ?? ln.taxRate ?? ln.taxPercent ?? 20);
                                            const lineNet = Number(ln.totalWithoutVat ?? ln.amtTra ?? ln.lineExtensionAmount ?? qty * price);
                                            return (
                                              <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-3 py-1.5 font-medium text-slate-800">
                                                  {ln.productCode ? `${ln.productCode} — ` : ""}
                                                  {ln.description || ln.productName || ln.itemName || "Kalem"}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                                                  {qty} {ln.unitName || ln.unit || ln.unitCode || "Adet"}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                                                  {formatMoney(price, documentCurrency(document))}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                                                  %{vatRate}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-800">
                                                  {formatMoney(lineNet, documentCurrency(document))}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </section>
  );
};

export default EDocuments;

