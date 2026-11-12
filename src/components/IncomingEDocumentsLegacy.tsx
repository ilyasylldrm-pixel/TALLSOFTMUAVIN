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
  type ManagedCompany,
  type MysoftDocumentFamily,
  type MysoftEDocument,
} from "../types";
import {
  getMysoftEDocument,
  getMysoftEDocumentStatus,
  listMysoftEDocuments,
  downloadMysoftEDocument,
  syncMysoftEDocuments,
  acceptMysoftEDocument,
  acknowledgeMysoftEDocument,
  denyMysoftEDocument,
  cancelMysoftEDocument,
  sendMysoftDraftEDocument,
  normalizeMysoftTenantIdentifier,
  resolveMysoftDocumentStatus,
  readPersistedEDocuments,
} from "../services/mysoftEDocumentService";
import { useMysoftTenants } from "../hooks/useMysoftTenants";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { ExportButtons } from "./ExportButtons";
import { ExportData } from "../utils/exportUtils";

export interface IncomingEDocumentsLegacyProps {
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
  invoices?: Invoice[];
  currentUser?: { id?: string; email?: string; role?: string; username?: string } | null;
  /** Optional local import hook. The default view keeps Mysoft records separate from local invoices. */
  onImportInvoice?: (document: MysoftEDocument) => void;
}

type SyncPeriod =
  | "this_month"
  | "three_months"
  | "all"
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
type DownloadFormat = "pdf" | "xml";

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
  const trMatch = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(str);
  if (trMatch) {
    return { year: parseInt(trMatch[3], 10), month: parseInt(trMatch[2], 10) };
  }
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return { year: null, month: null };
};

const formatMoney = (value: unknown, currency = "TRY") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency === "₺" ? "TRY" : currency || "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const str = String(value).trim();
  const trMatch = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(.*))?$/.exec(str);
  const normalized = trMatch ? `${trMatch[3]}-${trMatch[2]}-${trMatch[1]}` : str;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return str;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
};

const asRecord = (document: unknown): Record<string, any> =>
  document && typeof document === "object" ? (document as Record<string, any>) : {};

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
  const profile = String(data.profile || asRecord(data.raw).profileId || data.eDespatchType || "");
  if (
    data.family === "despatch" ||
    raw.includes("irsaliye") ||
    raw.includes("e_irsaliye")
  ) {
    return profile ? `e-İrsaliye (${profile})` : "e-İrsaliye";
  }
  if (!raw || raw === "unknown" || raw === "e_fatura") {
    return profile ? `e-Fatura (${profile})` : "e-Fatura";
  }
  if (raw === "e_arsiv") {
    return profile ? `e-Arşiv (${profile})` : "e-Arşiv";
  }
  return raw;
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

export const IncomingEDocumentsLegacy: React.FC<IncomingEDocumentsLegacyProps> = ({
  direction,
  family = "invoice",
  globalSearchTerm = "",
  companySettings,
  activeCompany,
  companyId,
  tenantIdentifierNumber,
  currentUser,
  onImportInvoice,
}) => {
  const { theme } = useTheme();
  const isDespatch = family === "despatch";
  const isMatched = isCompanyMysoftMatched(activeCompany, companySettings);

  const hintedTaxNumber = normalizeMysoftTenantIdentifier(
    tenantIdentifierNumber ||
      activeCompany?.tenantIdentifierNumber ||
      activeCompany?.taxNumber ||
      (activeCompany as any)?.vkn ||
      (activeCompany as any)?.tckn ||
      companySettings?.tenantIdentifierNumber ||
      companySettings?.mysoftCredentials?.tenantIdentifierNumber ||
      companySettings?.taxNumber ||
      (companySettings as any)?.vkn ||
      (companySettings as any)?.tckn,
  );
  const activeManagedCompanyId = companyId || activeCompany?.id;
  const {
    tenants,
    loading: tenantsLoading,
    selectedVkn: activeTenantIdentifierNumber,
  } = useMysoftTenants({
    hintVkn: hintedTaxNumber,
    lockedVkn: hintedTaxNumber,
    hidePartners: true,
  });

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
  const [period, setPeriod] = useState<SyncPeriod>("all");
  const [selectedYear, setSelectedYear] = useState<string>(() =>
    String(new Date().getFullYear()),
  );
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<MysoftEDocument | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{
    loading: boolean;
    html?: string;
    pdfUrl?: string;
    error?: string;
  }>({ loading: false });
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
  const previewPdfUrlRef = useRef<string | null>(null);

  const cleanupPreviewUrl = useCallback(() => {
    if (previewPdfUrlRef.current) {
      URL.revokeObjectURL(previewPdfUrlRef.current);
      previewPdfUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupPreviewUrl();
  }, [cleanupPreviewUrl]);

  const closeDetailModal = useCallback(() => {
    cleanupPreviewUrl();
    setSelectedDocument(null);
    setDetailError(null);
    setActionError(null);
    setPreviewState({ loading: false });
  }, [cleanupPreviewUrl]);

  const resolveDocumentTenant = useCallback(
    (document?: MysoftEDocument | null): string | undefined => {
      if (document) {
        const rec = asRecord(document);
        const rawRec = asRecord(rec.raw);
        const custInfo = asRecord(rawRec.customerInfo);
        const suppInfo = asRecord(rawRec.supplierInfo);
        const dir = documentDirection(document);
        const fromDoc = normalizeMysoftTenantIdentifier(
          rec.tenantIdentifierNumber ||
            (dir === "inbox"
              ? custInfo.identifierNumber || custInfo.vknTckn || rec.receiverTaxNumber
              : suppInfo.identifierNumber || suppInfo.vknTckn || rec.senderTaxNumber),
        );
        if (fromDoc) return fromDoc;
      }
      return activeTenantIdentifierNumber || hintedTaxNumber;
    },
    [activeTenantIdentifierNumber, hintedTaxNumber],
  );

  useEffect(() => {
    setSearchTerm(globalSearchTerm);
  }, [globalSearchTerm]);

  useEffect(() => {
    if (direction) {
      setActiveDirection(normalizeDirection(direction));
    }
  }, [direction]);

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
        const range = getSyncRange(period, selectedYear);
        const result = await listMysoftEDocuments(requestedDirection, {
          signal: controller.signal,
          tenantIdentifierNumber: activeTenantIdentifierNumber,
          companyId: activeManagedCompanyId,
          family,
          startDate: range.startDate,
          endDate: range.endDate,
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
      selectedYear,
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
        ...getSyncRange(period, selectedYear),
        tenantIdentifierNumber: activeTenantIdentifierNumber,
        companyId: activeManagedCompanyId,
        family,
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

  const mergeDetailedDocument = (
    base: MysoftEDocument,
    detailed?: MysoftEDocument | null,
    statusPayload?: unknown,
  ): MysoftEDocument => {
    const baseRec = asRecord(base);
    const detRec = asRecord(detailed);
    const mergedRaw = {
      ...asRecord(baseRec.raw),
      ...asRecord(detRec.raw),
    };

    const statusData = asRecord(asRecord(statusPayload).data || statusPayload);
    const liveStatusText =
      statusData.invoiceStatusText ||
      statusData.despatchStatusText ||
      statusData.statusText ||
      statusData.status;
    const resolvedLiveStatus = liveStatusText
      ? resolveMysoftDocumentStatus(liveStatusText, statusData.invoiceStatusCode)
      : null;

    const validDetailStatus =
      detRec.status && detRec.status !== "unknown" ? detRec.status : undefined;
    const validDetailStatusLabel =
      detRec.statusLabel && detRec.statusLabel !== "Bilinmiyor"
        ? detRec.statusLabel
        : undefined;

    const finalStatus =
      resolvedLiveStatus?.status && resolvedLiveStatus.status !== "unknown"
        ? resolvedLiveStatus.status
        : validDetailStatus || base.status;
    const finalStatusLabel =
      resolvedLiveStatus?.label && resolvedLiveStatus.label !== "Bilinmiyor"
        ? resolvedLiveStatus.label
        : validDetailStatusLabel || base.statusLabel || base.statusText;

    const validDetailType =
      detRec.documentType && detRec.documentType !== "unknown"
        ? detRec.documentType
        : undefined;

    const items =
      (Array.isArray(detRec.items) && detRec.items.length > 0
        ? detRec.items
        : undefined) ||
      (Array.isArray(mergedRaw.detailList) && mergedRaw.detailList.length > 0
        ? mergedRaw.detailList
        : undefined) ||
      base.items;

    return {
      ...base,
      ...(detailed || {}),
      id: base.id || detRec.id,
      ettn: detRec.ettn || base.ettn,
      documentNo: detRec.documentNo || base.documentNo,
      documentNumber: detRec.documentNumber || base.documentNumber || base.documentNo,
      number: detRec.number || base.number || base.documentNo,
      documentType: validDetailType || base.documentType || "e_fatura",
      issueDate: base.issueDate || detRec.issueDate,
      date: base.date || base.issueDate || detRec.date,
      dueDate: detRec.dueDate || base.dueDate,
      status: finalStatus,
      statusLabel: finalStatusLabel,
      statusText: finalStatusLabel,
      envelopeStatusText:
        detRec.envelopeStatusText ||
        statusData.envelopeStatusDesc ||
        statusData.envelopeStatusText ||
        base.envelopeStatusText,
      envelopeStatusCode:
        detRec.envelopeStatusCode ||
        statusData.envelopeStatusCode ||
        base.envelopeStatusCode,
      senderName: detRec.senderName || base.senderName,
      senderTaxNumber: detRec.senderTaxNumber || base.senderTaxNumber,
      receiverName: detRec.receiverName || base.receiverName,
      receiverTaxNumber: detRec.receiverTaxNumber || base.receiverTaxNumber,
      accountName: detRec.accountName || base.accountName,
      taxNumber: detRec.taxNumber || base.taxNumber,
      partyName: detRec.partyName || base.partyName,
      partyTaxNumber: detRec.partyTaxNumber || base.partyTaxNumber,
      subtotal: detRec.subtotal ?? base.subtotal,
      vatTotal: detRec.vatTotal ?? base.vatTotal,
      grandTotal: detRec.grandTotal ?? base.grandTotal,
      amount: detRec.amount ?? detRec.grandTotal ?? base.amount ?? base.grandTotal,
      currency: detRec.currency || base.currency || "TRY",
      profile: detRec.profile || mergedRaw.profileId || base.profile,
      createdAt: base.createdAt || detRec.createdAt,
      updatedAt: detRec.updatedAt || base.updatedAt,
      tenantIdentifierNumber:
        detRec.tenantIdentifierNumber ||
        baseRec.tenantIdentifierNumber ||
        activeTenantIdentifierNumber,
      items,
      lines: items,
      raw: mergedRaw,
    } as MysoftEDocument;
  };

  const loadDocumentPreview = useCallback(
    async (document: MysoftEDocument, docTenant?: string) => {
      const id = documentIdentity(document);
      if (!id) return;
      cleanupPreviewUrl();
      setPreviewState({ loading: true });
      const opOptions = {
        direction: documentDirection(document),
        tenantIdentifierNumber: docTenant || resolveDocumentTenant(document),
        companyId: activeManagedCompanyId,
        family,
      };

      try {
        const [htmlSettled, pdfSettled] = await Promise.allSettled([
          downloadMysoftEDocument(id, "html", opOptions),
          downloadMysoftEDocument(id, "pdf", opOptions),
        ]);

        let htmlContent: string | undefined;
        let pdfObjectUrl: string | undefined;

        if (htmlSettled.status === "fulfilled" && htmlSettled.value) {
          const hRes = htmlSettled.value;
          if (hRes.blob instanceof Blob) {
            const text = await hRes.blob.text();
            if (
              text &&
              (text.includes("<html") ||
                text.includes("<!DOCTYPE") ||
                text.includes("<table") ||
                text.includes("<body"))
            ) {
              htmlContent = text;
            }
          } else if (
            typeof hRes.data === "string" &&
            (hRes.data.includes("<html") || hRes.data.includes("<!DOCTYPE"))
          ) {
            htmlContent = hRes.data;
          }
        }

        if (pdfSettled.status === "fulfilled" && pdfSettled.value) {
          const pRes = pdfSettled.value;
          if (pRes.blob instanceof Blob && pRes.blob.size > 0) {
            const pdfBlob =
              pRes.blob.type === "application/pdf"
                ? pRes.blob
                : new Blob([pRes.blob], { type: "application/pdf" });
            pdfObjectUrl = URL.createObjectURL(pdfBlob);
            previewPdfUrlRef.current = pdfObjectUrl;
          }
        }

        if (htmlContent || pdfObjectUrl) {
          setPreviewState({
            loading: false,
            html: htmlContent,
            pdfUrl: pdfObjectUrl,
          });
        } else {
          const errReason =
            (pdfSettled.status === "rejected" && pdfSettled.reason) ||
            (htmlSettled.status === "rejected" && htmlSettled.reason);
          setPreviewState({
            loading: false,
            error: errReason
              ? getErrorMessage(errReason)
              : "Belge önizlemesi alınamadı.",
          });
        }
      } catch (previewErr) {
        setPreviewState({
          loading: false,
          error: getErrorMessage(previewErr),
        });
      }
    },
    [activeManagedCompanyId, cleanupPreviewUrl, family, resolveDocumentTenant],
  );

  const openDetails = async (document: MysoftEDocument) => {
    const docTenant = resolveDocumentTenant(document);
    setSelectedDocument(document);
    setDetailError(null);
    setActionError(null);
    setIsRejecting(false);
    setRejectReason("");
    setIsDetailLoading(true);
    void loadDocumentPreview(document, docTenant);
    try {
      const id = documentIdentity(document);
      const opOptions = {
        direction: documentDirection(document),
        tenantIdentifierNumber: docTenant,
        companyId: activeManagedCompanyId,
        family,
      };
      const [detailSettled, statusSettled] = await Promise.allSettled([
        getMysoftEDocument(id, opOptions),
        getMysoftEDocumentStatus(id, opOptions),
      ]);

      const detailed =
        detailSettled.status === "fulfilled" ? detailSettled.value : null;
      const statusPayload =
        statusSettled.status === "fulfilled" ? statusSettled.value : undefined;

      if (detailed || statusPayload) {
        const merged = mergeDetailedDocument(document, detailed, statusPayload);
        setSelectedDocument(merged);
        setDocuments((current) =>
          current.map((item) =>
            documentIdentity(item) === id ? merged : item,
          ),
        );
      } else if (detailSettled.status === "rejected") {
        setDetailError(getErrorMessage(detailSettled.reason));
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
    const docTenant = resolveDocumentTenant(document);
    setDownloading({ id, format });
    setNotice(null);
    setError(null);
    setActionError(null);
    try {
      const result: any = await downloadMysoftEDocument(id, format as any, {
        direction: documentDirection(document),
        tenantIdentifierNumber: docTenant,
        companyId: activeManagedCompanyId,
        family,
      });

      const docNo = documentNumber(document);
      const safeBaseName =
        docNo && docNo !== "-"
          ? docNo.replace(/[^a-zA-Z0-9_-]/g, "_")
          : id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const ext = format === "xml" ? "xml" : "pdf";
      const downloadFilename = `${safeBaseName}.${ext}`;

      let blob: Blob | undefined =
        result instanceof Blob
          ? result
          : result?.blob instanceof Blob
            ? result.blob
            : undefined;

      if (!blob && result?.data) {
        const mimeType =
          result?.mimeType ||
          (format === "xml"
            ? "application/xml;charset=utf-8"
            : "application/pdf");
        blob = new Blob([String(result.data)], { type: mimeType });
      }

      if (blob && blob.size > 0) {
        const expectedMime =
          format === "xml"
            ? "application/xml;charset=utf-8"
            : "application/pdf";
        const finalBlob =
          format === "pdf" &&
          blob.type !== "application/pdf" &&
          !blob.type.includes("html")
            ? new Blob([blob], { type: expectedMime })
            : blob;

        const objectUrl = URL.createObjectURL(finalBlob);
        const anchor = window.document.createElement("a");
        anchor.style.display = "none";
        anchor.href = objectUrl;
        anchor.download = downloadFilename;
        window.document.body.appendChild(anchor);
        anchor.click();
        window.document.body.removeChild(anchor);
        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 60_000);
        setNotice(`${downloadFilename} indirildi.`);
        return;
      }

      const fallbackUrl =
        asRecord(document).downloadUrl || asRecord(document)[`${format}Url`];
      const resultUrl =
        typeof result === "string"
          ? result
          : result?.url || result?.downloadUrl;

      if (resultUrl || fallbackUrl) {
        const anchor = window.document.createElement("a");
        anchor.style.display = "none";
        anchor.href = String(resultUrl || fallbackUrl);
        anchor.download = downloadFilename;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        window.document.body.appendChild(anchor);
        anchor.click();
        window.document.body.removeChild(anchor);
        setNotice(`${downloadFilename} indirildi.`);
        return;
      }

      throw new Error("Mysoft servisinden indirilecek dosya verisi alınamadı.");
    } catch (downloadError) {
      const msg = getErrorMessage(downloadError);
      if (selectedDocument && documentIdentity(selectedDocument) === id) {
        setActionError(msg);
      } else {
        setError(msg);
      }
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
      tenantIdentifierNumber: resolveDocumentTenant(selectedDocument),
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

  // Merge remote Mysoft documents with persisted local e-documents so month counts remain accurate across the year
  const allDocuments = useMemo(() => {
    const mergedMap = new Map<string, MysoftEDocument>();
    const makeDedupeKey = (doc: MysoftEDocument): string => {
      const idOrEttn = String(asRecord(doc).ettn || asRecord(doc).uuid || doc.id || "").trim().toUpperCase();
      if (idOrEttn) return `ID:${idOrEttn}`;
      const cleanNo = String(documentNumber(doc) || "").trim().toUpperCase();
      return `NO:${cleanNo}`;
    };

    try {
      const persisted = readPersistedEDocuments();
      for (const doc of persisted) {
        if (documentDirection(doc) !== activeDirection) continue;
        const docFam = doc.family || "invoice";
        if (docFam !== family) continue;
        if (activeManagedCompanyId && doc.companyId && doc.companyId !== activeManagedCompanyId) {
          continue;
        }
        const docTenant = asRecord(doc).tenantIdentifierNumber || asRecord(doc).receiverTaxNumber;
        if (
          activeTenantIdentifierNumber &&
          docTenant &&
          String(docTenant).trim() !== String(activeTenantIdentifierNumber).trim()
        ) {
          continue;
        }
        mergedMap.set(makeDedupeKey(doc), doc);
      }
    } catch {
      // Ignore storage read errors
    }

    for (const doc of documents) {
      mergedMap.set(makeDedupeKey(doc), doc);
    }

    return Array.from(mergedMap.values()).sort((a, b) => {
      const da = String(documentDate(a) || "");
      const db = String(documentDate(b) || "");
      if (da !== db) return db.localeCompare(da);
      return String(documentNumber(b) || "").localeCompare(String(documentNumber(a) || ""));
    });
  }, [documents, activeDirection, family, activeManagedCompanyId, activeTenantIdentifierNumber]);

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

  // Filter by selected year & monthly period option
  const periodFilteredDocuments = useMemo(() => {
    const now = new Date();
    const targetYear =
      selectedYear !== "all" && /^\d{4}$/.test(selectedYear)
        ? parseInt(selectedYear, 10)
        : null;

    return allDocuments.filter((doc) => {
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
        const docIso = String(documentDate(doc)).slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(docIso)) {
          return docIso >= range.startDate && docIso <= range.endDate;
        }
        return true;
      }

      if (targetYear !== null) {
        return year === targetYear;
      }
      return true;
    });
  }, [allDocuments, period, selectedYear]);

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
      return (
        (!query || haystack.includes(query)) &&
        (statusFilter === "all" || documentStatus(document) === statusFilter) &&
        (typeFilter === "all" || String(documentType(document)) === typeFilter)
      );
    });
  }, [periodFilteredDocuments, searchTerm, statusFilter, typeFilter]);

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
    return { total: periodFilteredDocuments.length, accepted, waiting, failed, amount: total };
  }, [periodFilteredDocuments]);

  const getEDocumentsExportData = useCallback((): ExportData => {
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
  }, [isDespatch, activeDirection, filteredDocuments]);

  const directionLabel = isDespatch
    ? activeDirection === "inbox"
      ? "Gelen e-İrsaliyeler"
      : "Giden e-İrsaliyeler"
    : activeDirection === "inbox"
      ? "Gelen e-Faturalar"
      : "Giden e-Faturalar";
  const DirectionIcon =
    activeDirection === "inbox" ? ArrowDownLeft : ArrowUpRight;

  return (
    <section className="p-4 sm:p-6 max-w-[1500px] mx-auto space-y-6 sm:space-y-7">
      {/* EDITORIAL MODULE ENTRANCE HEADER */}
      <ModuleEntranceHeader
        badge="Mysoft Entegrasyonu"
        badgeIcon={<DirectionIcon className="w-2.5 h-2.5 text-[#0f6bae]" />}
        title={directionLabel}
        description={
          isDespatch
            ? "Mysoft gelen ve giden e-irsaliye listesi. Belgeler seçilen müşterinin VKN’si ile çekilir."
            : "Mysoft Gelen e-Fatura ekranı. Aylık dönem seçip senkronize edin; kabul, red, PDF/XML ve belge önizleme işlemleri buradan yapılır."
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
              <optgroup label="Aylık Seçenekler">
                {TURKISH_MONTHS.map((m) => (
                  <option key={m.id} value={`month_${m.id}`}>
                    {m.name} {selectedYear !== "all" ? selectedYear : ""}
                  </option>
                ))}
              </optgroup>
            </select>
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

      {!isMatched && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bu şirket için Mysoft e-Belge VKN/TCKN eşleştirmesi henüz tamamlanmadı. Mysoft iş ortakları listesi ve kullanıcı adı / şifre yönetimi <strong>Firma Bilgileri &gt; Mysoft Eşleştirme Masası</strong>&apos;na taşınmıştır.
            </span>
          </div>
        </div>
      )}

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
        {[
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

      {/* Aylık Dönem Seçenekleri Barı (Her Ay İçin Ayrı Filtreleme) */}
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
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Belge no, cari, VKN veya ETTN ara..."
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
          <div className="px-4 py-2 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-100">
            Son senkronizasyon: {formatDate(lastSyncedAt)}{" "}
            {new Date(lastSyncedAt).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
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
            {period !== "all" ? (
              <button
                type="button"
                onClick={() => setPeriod("all")}
                className="mt-4 px-3.5 py-2 rounded-lg bg-[#eaedff] text-[#0f6bae] text-xs font-semibold hover:bg-[#dae2fd] cursor-pointer"
              >
                Tüm Ayları Göster
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
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="w-10 px-3 py-3 font-semibold text-center"></th>
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
                  const isExpanded = expandedDocId === id;
                  return (
                    <React.Fragment key={id}>
                      <tr
                        className={`transition-colors ${isExpanded ? "bg-[#eaedff]/30" : "hover:bg-blue-50/80"}`}
                      >
                        <td className="w-10 px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedDocId(isExpanded ? null : id)}
                            className="p-1 rounded-md text-slate-400 hover:text-[#0f6bae] hover:bg-[#eaedff] transition-colors cursor-pointer"
                            title={isExpanded ? "Detayı Gizle" : "Hızlı Detayları Göster"}
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
                            className="group text-left"
                          >
                            <span className="font-mono text-xs font-semibold text-slate-800 group-hover:text-[#0f6bae]">
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
                        <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800 whitespace-nowrap font-mono tabular-nums font-tabular-num-md">
                          {formatMoney(
                            documentAmount(document),
                            documentCurrency(document),
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-semibold ${tone.className}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {tone.label}
                          </span>
                          {(data.envelopeStatusText || data.envelopeStatusCode) && (
                            <span className="block text-[11px] text-slate-400 mt-1 max-w-[180px] truncate" title={String(data.envelopeStatusText || data.envelopeStatusCode)}>
                              Zarf: {data.envelopeStatusText || data.envelopeStatusCode}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => void openDetails(document)}
                              title="Detayı görüntüle"
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0f6bae]"
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
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0f6bae] disabled:opacity-50"
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
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0f6bae] disabled:opacity-50"
                            >
                              <FileCode2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#f8fafc] border-b border-slate-200">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">
                                    Hızlı Belge Özeti:
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[#0f6bae]">
                                    {documentNumber(document)}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    (ETTN: {data.ettn || data.uuid || "-"})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void openDetails(document)}
                                    className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Belge Görünümü (Mysoft) Aç
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="text-[11px] text-slate-400 block">Muhatap Firma</span>
                                  <span className="font-semibold text-slate-800">{documentParty(document)}</span>
                                </div>
                                <div>
                                  <span className="text-[11px] text-slate-400 block">Vergi No (VKN/TCKN)</span>
                                  <span className="font-mono font-semibold text-slate-800">{documentTaxNumber(document)}</span>
                                </div>
                                <div>
                                  <span className="text-[11px] text-slate-400 block">Belge Tarihi & Türü</span>
                                  <span className="font-semibold text-slate-800">{formatDate(documentDate(document))} • {documentType(document)}</span>
                                </div>
                                <div>
                                  <span className="text-[11px] text-slate-400 block">Net Tutar</span>
                                  <span className="font-mono font-bold text-[#0f6bae] text-sm">{formatMoney(documentAmount(document), documentCurrency(document))}</span>
                                </div>
                              </div>
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

      {selectedDocument && (() => {
        const selRec = asRecord(selectedDocument);
        const rawRec = asRecord(selRec.raw);
        const modalId = documentIdentity(selectedDocument);
        const isModalDownloading = downloading?.id === modalId;

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="E-Belge detayı"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDetailModal();
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DirectionIcon
                      className={`w-4 h-4 ${activeDirection === "inbox" ? "text-sky-600" : "text-[#0f6bae]"}`}
                    />
                    <h2 className="font-semibold text-slate-900">
                      {documentNumber(selectedDocument)}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${statusTone(documentStatus(selectedDocument)).className}`}
                    >
                      {statusTone(documentStatus(selectedDocument)).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {documentType(selectedDocument)}
                    {rawRec.invoiceTypeCode || rawRec.invoiceType
                      ? ` · ${rawRec.invoiceTypeCode || rawRec.invoiceType}`
                      : ""}{" "}
                    · {formatDate(documentDate(selectedDocument))}
                    {rawRec.docTime ? ` ${rawRec.docTime}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-[#eaedff] text-[#0f6bae] text-xs font-semibold">
                    Belge Görünümü (Mysoft)
                  </span>
                  <button
                    type="button"
                    onClick={closeDetailModal}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                    aria-label="Detayı kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                {detailError && (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Detay servisi yanıt vermedi ({detailError}); listede bulunan
                    bilgiler gösteriliyor.
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

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                    <span className="text-xs font-medium text-slate-600">
                      Mysoft Orijinal e-Belge Önizlemesi (
                      {documentNumber(selectedDocument)})
                    </span>
                    <div className="flex items-center gap-2">
                      {previewState.html && (
                        <button
                          type="button"
                          onClick={() => {
                            const iframe = window.document.getElementById(
                              "mysoft-legacy-preview-frame",
                            ) as HTMLIFrameElement | null;
                            iframe?.contentWindow?.focus();
                            iframe?.contentWindow?.print();
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Yazdır
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          void triggerDownload(selectedDocument, "pdf")
                        }
                        disabled={isModalDownloading}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0f6bae] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isModalDownloading &&
                        downloading?.format === "pdf" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        PDF İndir
                      </button>
                    </div>
                  </div>

                  {previewState.loading ? (
                    <div className="h-[520px] rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0f6bae]" />
                      <p className="text-xs">
                        Mysoft belge görüntüsü yükleniyor...
                      </p>
                    </div>
                  ) : previewState.html ? (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <iframe
                        id="mysoft-legacy-preview-frame"
                        title={`E-Belge Önizleme ${documentNumber(selectedDocument)}`}
                        srcDoc={previewState.html}
                        className="w-full h-[560px] border-0 bg-white"
                      />
                    </div>
                  ) : previewState.pdfUrl ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                      <iframe
                        id="mysoft-legacy-preview-frame"
                        title={`E-Belge PDF ${documentNumber(selectedDocument)}`}
                        src={previewState.pdfUrl}
                        className="w-full h-[560px] border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
                      <p className="text-xs text-slate-600">
                        {previewState.error ||
                          "Mysoft belge görüntüsü şu anda yüklenemedi."}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void loadDocumentPreview(selectedDocument)
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#eaedff] text-[#0f6bae] text-xs font-semibold hover:bg-[#dae2fd]"
                      >
                        Tekrar Dene
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
                  {activeDirection === "inbox" ? (
                    <div className="w-full flex flex-wrap items-center justify-end gap-2 pb-2 mb-1 border-b border-slate-100">
                      {!isRejecting ? (
                        <>
                          {!isDespatch && (
                            <button
                              type="button"
                              onClick={() => void runDocumentAction("accept")}
                              disabled={Boolean(actionLoading)}
                              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {actionLoading === "accept" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              Kabul et
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              void runDocumentAction("acknowledge")
                            }
                            disabled={Boolean(actionLoading)}
                            className="px-3 py-2 rounded-lg border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50 disabled:opacity-50 flex items-center gap-2"
                            title="Belgeyi Mysoft'ta alındı olarak kaydet"
                          >
                            {actionLoading === "acknowledge" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ArrowDownToLine className="w-4 h-4" />
                            )}
                            Alındı
                          </button>
                          {!isDespatch && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsRejecting(true);
                                setActionError(null);
                              }}
                              disabled={Boolean(actionLoading)}
                              className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reddet
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="w-full rounded-xl border border-rose-200 bg-rose-50/60 p-3 space-y-2">
                          <label
                            htmlFor="mysoft-reject-reason"
                            className="block text-xs font-semibold text-rose-800"
                          >
                            Ret gerekçesi
                          </label>
                          <textarea
                            id="mysoft-reject-reason"
                            value={rejectReason}
                            onChange={(event) =>
                              setRejectReason(event.target.value)
                            }
                            rows={2}
                            placeholder="Mysoft'a iletilecek ret gerekçesini yazın"
                            className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs outline-none focus:border-rose-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsRejecting(false);
                                setRejectReason("");
                              }}
                              disabled={Boolean(actionLoading)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Vazgeç
                            </button>
                            <button
                              type="button"
                              onClick={() => void runDocumentAction("deny")}
                              disabled={
                                Boolean(actionLoading) || !rejectReason.trim()
                              }
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {actionLoading === "deny" && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              )}
                              Ret gönder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : !isDespatch ? (
                    <div className="w-full flex flex-wrap items-center justify-end gap-2 pb-2 mb-1 border-b border-slate-100">
                      {isArchiveDocument(selectedDocument) && (
                        <button
                          type="button"
                          onClick={() => void runDocumentAction("cancel")}
                          disabled={Boolean(actionLoading)}
                          className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === "cancel" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          İptal et
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void runDocumentAction("send-draft")}
                        disabled={Boolean(actionLoading)}
                        className="px-3 py-2 rounded-lg bg-[#0f6bae] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === "send-draft" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowUpFromLine className="w-4 h-4" />
                        )}
                        Taslağı GİB'e gönder
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      void triggerDownload(selectedDocument, "xml")
                    }
                    disabled={isModalDownloading}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isModalDownloading && downloading?.format === "xml" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCode2 className="w-4 h-4" />
                    )}
                    XML indir
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void triggerDownload(selectedDocument, "pdf")
                    }
                    disabled={isModalDownloading}
                    className="px-3 py-2 rounded-lg bg-[#0f6bae] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isModalDownloading && downloading?.format === "pdf" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    PDF indir
                  </button>
                  {selRec.downloadUrl && (
                    <a
                      href={selRec.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Mysoft'ta aç
                    </a>
                  )}
                  {activeDirection === "inbox" &&
                    onImportInvoice &&
                    !isDespatch && (
                      <button
                        type="button"
                        onClick={() => {
                          onImportInvoice(selectedDocument);
                          setNotice("Belge yerel fatura taslağına aktarıldı.");
                          closeDetailModal();
                        }}
                        className="px-3 py-2 rounded-lg border border-[#fcdac2] bg-[#fff6ef] text-[#c25a13] text-xs font-semibold hover:bg-[#ffeddc] flex items-center gap-2"
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                        Faturaya aktar
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

export default IncomingEDocumentsLegacy;
