import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  Copy,
  Check,
  Building2,
  Users,
  Package,
  Wallet,
  FileCheck2,
  HardHat,
  Wrench,
  HelpCircle,
  FileText,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import {
  ensureGoogleToken,
  isGoogleAuthenticated,
  disconnectGoogleSheets,
  listGoogleSpreadsheets,
  getSpreadsheetDetails,
  readSpreadsheetValues,
  exportToGoogleSheets,
  GoogleSpreadsheetItem,
  ExportResult,
  SheetMetadata
} from "../services/googleSheetsService";
import {
  Invoice,
  Contact,
  Account,
  Transaction,
  Product,
  Cheque,
  PromissoryNote,
  ConstructionProject,
  AutoServiceRecord,
  ItServiceRecord,
  ApplianceServiceRecord
} from "../types";
import { formatCurrency, formatDate } from "../utils/exportUtils";

interface GoogleSheetsIntegrationProps {
  invoices: Invoice[];
  contacts: Contact[];
  accounts: Account[];
  transactions: Transaction[];
  products: Product[];
  cheques?: Cheque[];
  promissoryNotes?: PromissoryNote[];
  constructionProjects?: ConstructionProject[];
  autoServiceRecords?: AutoServiceRecord[];
  itServiceRecords?: ItServiceRecord[];
  applianceServiceRecords?: ApplianceServiceRecord[];
  onImportContacts?: (contacts: Contact[]) => void;
  onImportProducts?: (products: Product[]) => void;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  invoices,
  contacts,
  accounts,
  transactions,
  products,
  cheques = [],
  promissoryNotes = [],
  constructionProjects = [],
  autoServiceRecords = [],
  itServiceRecords = [],
  applianceServiceRecords = [],
  onImportContacts,
  onImportProducts
}) => {
  const { theme } = useTheme();

  // Auth & Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"quick_export" | "drive_files" | "import_data">("quick_export");

  // Drive Spreadsheets List State
  const [driveSheets, setDriveSheets] = useState<GoogleSpreadsheetItem[]>([]);
  const [loadingSheets, setLoadingSheets] = useState<boolean>(false);
  const [sheetsSearch, setSheetsSearch] = useState<string>("");

  // Export State
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Preview Modal State
  const [previewSheet, setPreviewSheet] = useState<GoogleSpreadsheetItem | null>(null);
  const [previewMetadata, setPreviewMetadata] = useState<SheetMetadata | null>(null);
  const [previewTabName, setPreviewTabName] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<(string | number | boolean)[][]>([]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // Import State
  const [selectedSheetForImport, setSelectedSheetForImport] = useState<string>("");
  const [manualSheetInput, setManualSheetInput] = useState<string>("");
  const [importTargetType, setImportTargetType] = useState<"contacts" | "products">("contacts");
  const [importPreviewData, setImportPreviewData] = useState<(string | number | boolean)[][]>([]);
  const [loadingImportData, setLoadingImportData] = useState<boolean>(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Destructive / Action Confirmation Dialog State (Mandatory as per skill)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Onayla",
    action: async () => {}
  });

  // Check initial authentication
  useEffect(() => {
    isGoogleAuthenticated().then((authenticated) => {
      setIsConnected(authenticated);
      if (authenticated) {
        fetchDriveSpreadsheets();
      }
    });
  }, []);

  const handleConnect = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await ensureGoogleToken();
      setIsConnected(true);
      await fetchDriveSpreadsheets();
    } catch (err: any) {
      console.error("Google Sheets bağlantı hatası:", err);
      setAuthError(err?.message || "Google Workspace bağlantısı sağlanamadı.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleSheets();
    setIsConnected(false);
    setDriveSheets([]);
    setLastExportResult(null);
  };

  const fetchDriveSpreadsheets = async () => {
    setLoadingSheets(true);
    try {
      const items = await listGoogleSpreadsheets();
      setDriveSheets(items);
    } catch (err: any) {
      console.warn("Drive e-tabloları listelenirken hata:", err);
      if (err?.message?.includes("oturum") || err?.message?.includes("401")) {
        setIsConnected(false);
      }
    } finally {
      setLoadingSheets(false);
    }
  };

  const copyExportUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // 1. Export Handlers with User Confirmation (Mandatory Workspace requirement)
  const executeExport = async (
    exportId: string,
    title: string,
    sheetName: string,
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][]
  ) => {
    setConfirmDialog({
      isOpen: true,
      title: "Google E-Tablo Oluşturulsun mu?",
      description: `"${title}" başlıklı yeni bir Google E-Tablosu Google Drive hesabınızda oluşturulacak ve ${rows.length} kayıt aktarılacaktır.`,
      confirmText: "E-Tabloyu Oluştur ve Aktar",
      action: async () => {
        setExportingType(exportId);
        setAuthError(null);
        try {
          const result = await exportToGoogleSheets({
            title,
            sheetName,
            headers,
            rows
          });
          setLastExportResult(result);
          // Refresh list of spreadsheets
          fetchDriveSpreadsheets();
        } catch (err: any) {
          console.error("Export error:", err);
          setAuthError(err?.message || "Google E-Tablo aktarımı sırasında bir hata oluştu.");
        } finally {
          setExportingType(null);
        }
      }
    });
  };

  const handleExportInvoices = () => {
    const headers = [
      "Fatura No",
      "Fatura Tipi",
      "Düzenleme Tarihi",
      "Vade Tarihi",
      "Cari Unvan / İsim",
      "VKN / TCKN",
      "Vergi Dairesi",
      "KDV Hariç Matrah",
      "KDV Tutarı",
      "Genel Toplam (TL)",
      "Ödeme Durumu",
      "Açıklama"
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber || "-",
      inv.type === "sales" ? "Satış Faturası" : "Alış Faturası",
      inv.issueDate ? formatDate(inv.issueDate) : "-",
      inv.dueDate ? formatDate(inv.dueDate) : "-",
      inv.contactTitle || inv.contactName || "-",
      inv.taxNumber || "-",
      inv.taxOffice || "-",
      inv.subtotal || 0,
      inv.totalVat || 0,
      inv.grandTotal || 0,
      inv.paymentStatus === "paid" ? "Ödendi" : inv.paymentStatus === "partial" ? "Kısmi Ödendi" : "Ödenmedi",
      inv.notes || ""
    ]);

    const title = `Muavin ERP - Faturalar Listesi (${new Date().toLocaleDateString("tr-TR")})`;
    executeExport("invoices", title, "Faturalar", headers, rows);
  };

  const handleExportContacts = () => {
    const headers = [
      "Cari Kodu",
      "Ticari Unvan / İsim",
      "Cari Tipi",
      "VKN / TCKN",
      "Vergi Dairesi",
      "Yetkili Kişi",
      "Telefon",
      "E-Posta",
      "Şehir / İlçe",
      "Adres",
      "Bakiye Tutarı",
      "Bakiye Yönü",
      "Oluşturulma Tarihi"
    ];

    const rows = contacts.map((c) => [
      c.accountCode || "-",
      c.companyTitle || c.name || "-",
      c.contactType === "customer"
        ? "Müşteri"
        : c.contactType === "vendor" || c.contactType === "supplier"
        ? "Tedarikçi"
        : "Müşteri / Tedarikçi",
      c.taxNumber || "-",
      c.taxOffice || "-",
      c.contactPerson || "-",
      c.phone || c.mobile || "-",
      c.email || "-",
      `${c.city || "-"} / ${c.district || "-"}`,
      c.address || "-",
      c.balance || 0,
      c.balanceType === "receivable" ? "Alacaklıyız" : c.balanceType === "payable" ? "Borçluyuz" : "Sıfır",
      c.createdAt ? formatDate(c.createdAt) : "-"
    ]);

    const title = `Muavin ERP - Cari Hesaplar & Bakiyeler (${new Date().toLocaleDateString("tr-TR")})`;
    executeExport("contacts", title, "Cari Hesaplar", headers, rows);
  };

  const handleExportProducts = () => {
    const headers = [
      "Ürün / Stok Kodu",
      "Barkod",
      "Ürün Adı",
      "Kategori",
      "Birim",
      "Mevcut Stok",
      "Kritik Stok",
      "Alış Fiyatı",
      "Satış Fiyatı",
      "KDV Oranı (%)",
      "Para Birimi",
      "Açıklama"
    ];

    const rows = products.map((p) => [
      p.code || "-",
      p.barcode || "-",
      p.name || "-",
      p.category || "-",
      p.unit || "Adet",
      p.stock || 0,
      p.minStock || 0,
      p.buyPrice || 0,
      p.sellPrice || 0,
      p.vatRate || 20,
      p.currency || "TL",
      p.description || ""
    ]);

    const title = `Muavin ERP - Ürün & Stok Envanteri (${new Date().toLocaleDateString("tr-TR")})`;
    executeExport("products", title, "Stok Envanteri", headers, rows);
  };

  const handleExportFinance = () => {
    const headers = [
      "İşlem Tarihi",
      "Hesap / Kasa / Banka",
      "İşlem Tipi",
      "Kategori",
      "Cari Unvan",
      "Tutar (TL)",
      "Açıklama",
      "Evrak / Dekont No"
    ];

    const rows = transactions.map((t) => [
      t.date ? formatDate(t.date) : "-",
      t.accountName || "-",
      t.type === "income" ? "Gelir / Tahsilat" : t.type === "expense" ? "Gider / Tediye" : "Virman / Transfer",
      t.category || "-",
      t.contactName || "-",
      t.amount || 0,
      t.description || "-",
      t.documentNumber || "-"
    ]);

    const title = `Muavin ERP - Kasa & Banka Finans Hareketleri (${new Date().toLocaleDateString("tr-TR")})`;
    executeExport("finance", title, "Finans Hareketleri", headers, rows);
  };

  const handleExportCheques = () => {
    const headers = [
      "Portföy No",
      "Belge Türü",
      "Keşideci / Veren",
      "Banka Adı",
      "Şube",
      "Hesap No",
      "Çek/Senet No",
      "Vade Tarihi",
      "Tutar (TL)",
      "Tahsilat Durumu"
    ];

    const chequeRows = cheques.map((c) => [
      c.id,
      "Çek",
      c.drawer || "-",
      c.bankName || "-",
      c.branchName || "-",
      c.accountNumber || "-",
      c.chequeNumber || "-",
      c.dueDate ? formatDate(c.dueDate) : "-",
      c.amount || 0,
      c.status === "collected" ? "Tahsil Edildi" : c.status === "endorsed" ? "Ciro Edildi" : "Portföyde"
    ]);

    const noteRows = promissoryNotes.map((n) => [
      n.id,
      "Senet",
      n.debtor || "-",
      "-",
      "-",
      "-",
      n.noteNumber || "-",
      n.dueDate ? formatDate(n.dueDate) : "-",
      n.amount || 0,
      n.status === "collected" ? "Tahsil Edildi" : "Portföyde"
    ]);

    const title = `Muavin ERP - Çek & Senet Portföyü (${new Date().toLocaleDateString("tr-TR")})`;
    executeExport("cheques", title, "Çek ve Senetler", headers, [...chequeRows, ...noteRows]);
  };

  const handleExportConstruction = () => {
    const headers = [
      "Proje Kodu",
      "Şantiye / Proje Adı",
      "Şehir / Konum",
      "Arsa Alanı (m²)",
      "Toplam İnşaat Alanı (m²)",
      "Toplam Daire / Bağımsız Bölüm",
      "Tahmini Maliyet (TL)",
      "Gerçekleşen Harcama (TL)",
      "Maliyet Sapması (%)",
      "Proje Durumu"
    ];

    const rows = constructionProjects.map((p) => {
      const estimated = p.totalEstimatedCost || 0;
      const actual = p.totalActualCost || 0;
      const diffPct = estimated > 0 ? (((actual - estimated) / estimated) * 100).toFixed(1) : "0.0";
      return [
        p.code || "-",
        p.name || "-",
        p.location || "-",
        p.landArea || 0,
        p.totalConstructionArea || 0,
        p.apartmentConfigs?.reduce((sum, a) => sum + (a.count || 0), 0) || 0,
        estimated,
        actual,
        `%${diffPct}`,
        p.status || "Planlama"
      ];
    });

    const title = `Muavin ERP - İnşaat Şantiye & Maliyet Analizi (${new Date().toLocaleDateString("tr-TR")})`;
    executeExport("construction", title, "Şantiyeler", headers, rows);
  };

  const handleExportServices = () => {
    const headers = [
      "Servis Tipi",
      "İş Emri No",
      "Müşteri Unvanı",
      "Cihaz / Araç",
      "Plaka / Seri No",
      "Geliş Tarihi",
      "Arıza / Şikayet",
      "Yapılan İşlemler",
      "Toplam Tutar (TL)",
      "Durum"
    ];

    const autoRows = autoServiceRecords.map((r) => [
      "Oto Servis",
      r.id,
      r.customerName || "-",
      `${r.vehicleBrand || ""} ${r.vehicleModel || ""}`.trim() || "-",
      r.plateNumber || "-",
      r.entryDate ? formatDate(r.entryDate) : "-",
      r.complaint || "-",
      r.actionsPerformed || "-",
      r.totalAmount || 0,
      r.status || "Kayıt Alındı"
    ]);

    const itRows = itServiceRecords.map((r) => [
      "Bilişim / BT",
      r.id,
      r.customerName || "-",
      `${r.deviceBrand || ""} ${r.deviceModel || ""}`.trim() || "-",
      r.serialNumber || "-",
      r.entryDate ? formatDate(r.entryDate) : "-",
      r.faultDescription || "-",
      r.actionsPerformed || "-",
      r.totalCost || 0,
      r.status || "İşlemde"
    ]);

    const applianceRows = applianceServiceRecords.map((r) => [
      "Ev Aletleri / Klima",
      r.id,
      r.customerName || "-",
      `${r.applianceType || ""} ${r.brand || ""}`.trim() || "-",
      r.modelNumber || "-",
      r.entryDate ? formatDate(r.entryDate) : "-",
      r.reportedDefect || "-",
      r.repairDetails || "-",
      r.totalServiceFee || 0,
      r.status || "Açık"
    ]);

    const title = `Muavin ERP - Teknik Servis İş Emirleri (${new Date().toLocaleDateString("tr-TR")})`;
    executeExport("services", title, "Teknik Servis", headers, [...autoRows, ...itRows, ...applianceRows]);
  };

  // 2. Drive Preview Handler
  const handleOpenPreview = async (item: GoogleSpreadsheetItem) => {
    setPreviewSheet(item);
    setLoadingPreview(true);
    setPreviewRows([]);
    try {
      const meta = await getSpreadsheetDetails(item.id);
      setPreviewMetadata(meta);
      const firstTab = meta.sheets[0]?.title || "Sayfa1";
      setPreviewTabName(firstTab);

      const rows = await readSpreadsheetValues(item.id, `${firstTab}!A1:Z100`);
      setPreviewRows(rows);
    } catch (err: any) {
      console.error("Preview error:", err);
      setAuthError(err?.message || "E-tablo önizleme verileri alınamadı.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleTabChangeInPreview = async (tabTitle: string) => {
    if (!previewSheet) return;
    setPreviewTabName(tabTitle);
    setLoadingPreview(true);
    try {
      const rows = await readSpreadsheetValues(previewSheet.id, `${tabTitle}!A1:Z100`);
      setPreviewRows(rows);
    } catch (err) {
      console.error("Tab read error:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // 3. Import from Sheet Handler
  const handleLoadImportPreview = async () => {
    setImportSuccessMessage(null);
    setAuthError(null);
    let targetSpreadsheetId = selectedSheetForImport;

    if (manualSheetInput.trim()) {
      // Parse ID from URL if full URL was pasted
      const match = manualSheetInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      targetSpreadsheetId = match ? match[1] : manualSheetInput.trim();
    }

    if (!targetSpreadsheetId) {
      setAuthError("Lütfen Drive'dan bir e-tablo seçin veya geçerli bir Google E-Tablo bağlantısı/kimliği girin.");
      return;
    }

    setLoadingImportData(true);
    try {
      const meta = await getSpreadsheetDetails(targetSpreadsheetId);
      const firstTab = meta.sheets[0]?.title || "Sayfa1";
      const rows = await readSpreadsheetValues(targetSpreadsheetId, `${firstTab}!A1:Z200`);
      if (rows.length === 0) {
        setAuthError("Seçilen e-tabloda veri bulunamadı.");
      } else {
        setImportPreviewData(rows);
      }
    } catch (err: any) {
      console.error("Import preview error:", err);
      setAuthError(err?.message || "E-tablo verileri okunamadı. Lütfen erişim izinlerini kontrol edin.");
    } finally {
      setLoadingImportData(false);
    }
  };

  const executeDataImport = () => {
    if (importPreviewData.length <= 1) {
      setAuthError("İçe aktarılacak satır verisi bulunamadı (Yalnızca başlık satırı var veya boş).");
      return;
    }

    const dataRows = importPreviewData.slice(1);

    if (importTargetType === "contacts") {
      setConfirmDialog({
        isOpen: true,
        title: "Cari Hesaplar İçe Aktarılsın mı?",
        description: `E-tablodan okunan ${dataRows.length} adet cari hesap kaydı sisteminize eklenecektir. Devam etmek istiyor musunuz?`,
        confirmText: `${dataRows.length} Cariyi İçe Aktar`,
        action: async () => {
          const newContacts: Contact[] = dataRows.map((row, idx) => {
            const code = String(row[0] || `120.GOOGLE.${Date.now()}_${idx}`);
            const title = String(row[1] || row[0] || `Yeni Cari ${idx + 1}`);
            const typeStr = String(row[2] || "").toLowerCase();
            const contactType =
              typeStr.includes("tedarik") || typeStr.includes("satıcı")
                ? "vendor"
                : typeStr.includes("müşteri")
                ? "customer"
                : "both";
            const taxNum = String(row[3] || "");
            const taxOffice = String(row[4] || "");
            const phone = String(row[6] || "");
            const email = String(row[7] || "");
            const balanceNum = parseFloat(String(row[10] || 0)) || 0;

            return {
              id: `imported_sheet_${Date.now()}_${idx}`,
              accountCode: code,
              name: title,
              companyTitle: title,
              contactType,
              taxNumber: taxNum,
              taxOffice: taxOffice,
              phone,
              email,
              balance: balanceNum,
              balanceType: balanceNum > 0 ? "receivable" : balanceNum < 0 ? "payable" : "balanced",
              createdAt: new Date().toISOString()
            };
          });

          if (onImportContacts) {
            onImportContacts(newContacts);
          }
          setImportSuccessMessage(`${newContacts.length} adet cari hesap başarıyla içeri aktarıldı!`);
          setImportPreviewData([]);
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: "Ürün ve Stoklar İçe Aktarılsın mı?",
        description: `E-tablodan okunan ${dataRows.length} adet ürün envanter kaydı sisteminize eklenecektir. Devam etmek istiyor musunuz?`,
        confirmText: `${dataRows.length} Ürünü İçe Aktar`,
        action: async () => {
          const newProducts: Product[] = dataRows.map((row, idx) => {
            const code = String(row[0] || `PRD-GS-${Date.now()}-${idx}`);
            const barcode = String(row[1] || "");
            const name = String(row[2] || row[0] || `Yeni Ürün ${idx + 1}`);
            const category = String(row[3] || "Genel");
            const unit = String(row[4] || "Adet");
            const stock = parseFloat(String(row[5] || 0)) || 0;
            const minStock = parseFloat(String(row[6] || 0)) || 0;
            const buyPrice = parseFloat(String(row[7] || 0)) || 0;
            const sellPrice = parseFloat(String(row[8] || 0)) || 0;
            const vatRate = parseFloat(String(row[9] || 20)) || 20;

            return {
              id: `imported_product_${Date.now()}_${idx}`,
              code,
              barcode,
              name,
              category,
              unit,
              stock,
              minStock,
              buyPrice,
              sellPrice,
              vatRate,
              currency: "TL",
              createdAt: new Date().toISOString()
            };
          });

          if (onImportProducts) {
            onImportProducts(newProducts);
          }
          setImportSuccessMessage(`${newProducts.length} adet ürün başarıyla içeri aktarıldı!`);
          setImportPreviewData([]);
        }
      });
    }
  };

  const filteredDriveSheets = useMemo(() => {
    if (!sheetsSearch.trim()) return driveSheets;
    const q = sheetsSearch.toLowerCase();
    return driveSheets.filter(
      (s) => s.name.toLowerCase().includes(q) || s.owners?.some((o) => o.emailAddress.toLowerCase().includes(q))
    );
  }, [driveSheets, sheetsSearch]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary
        }}
        className="rounded-2xl border p-6 shadow-xs relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-emerald-500/20">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight">Google E-Tablolar (Google Sheets) Entegrasyonu</h1>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Google Bağlantısı Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Bağlantı Bekleniyor
                  </span>
                )}
              </div>
              <p className="text-sm mt-1 text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                Ön muhasebe, cari hesaplar, faturalar, kasa/banka hareketleri, ürün envanteri ve sektörel verilerinizi
                Google Drive ve Google E-Tablolar ile tek tıkla senkronize edin veya mevcut e-tablolarınızdan veri çekin.
              </p>
            </div>
          </div>

          {/* Connection Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchDriveSpreadsheets}
                  disabled={loadingSheets}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSheets ? "animate-spin" : ""}`} />
                  E-Tabloları Yenile
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  Bağlantıyı Kes
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isAuthenticating}
                className="gsi-material-button inline-flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer"
              >
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span>{isAuthenticating ? "Google ile Bağlanılıyor..." : "Google Hesabı ile Bağlan"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error notification */}
        {authError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Success Alert for Recent Export */}
        {lastExportResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block">Google E-Tablosu Başarıyla Oluşturuldu!</span>
                <span className="text-emerald-700 dark:text-emerald-300">
                  "{lastExportResult.title}" ({lastExportResult.rowCount} satır aktarıldı)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyExportUrl(lastExportResult.spreadsheetUrl)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? "Kopyalandı" : "Bağlantıyı Kopyala"}</span>
              </button>
              <a
                href={lastExportResult.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Google Sheets'te Aç</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("quick_export")}
          style={activeTab === "quick_export" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
          className={`font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === "quick_export"
              ? "shadow-xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
          }`}
        >
          <Download className="w-4 h-4" />
          <span>E-Tablolara Canlı Aktar (Export)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("drive_files");
            if (isConnected && driveSheets.length === 0) {
              fetchDriveSpreadsheets();
            }
          }}
          style={activeTab === "drive_files" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
          className={`font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === "drive_files"
              ? "shadow-xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Drive E-Tablolarım</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
              activeTab === "drive_files"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {driveSheets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("import_data")}
          style={activeTab === "import_data" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
          className={`font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === "import_data"
              ? "shadow-xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>E-Tablodan Veri İçe Aktar (Import)</span>
        </button>
      </div>

      {/* TAB 1: QUICK EXPORT (E-Tablolara Canlı Aktar) */}
      {activeTab === "quick_export" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>Hızlı Aktarım Modülleri</span>
              <span className="text-xs font-normal text-slate-500">
                (İlgili modüldeki kayıtlar biçimlendirilmiş başlık ve dondurulmuş satır düzeni ile yeni Google E-Tablosuna
                yazılır)
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Faturalar */}
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {invoices.length} Fatura
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Faturalar Listesi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Satış ve alış faturaları, KDV matrahları, tevkifatlar, ödeme durumları ve cari bilgileri.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-2xs text-slate-400">Google E-Tablo formatı</span>
                <button
                  type="button"
                  onClick={handleExportInvoices}
                  disabled={exportingType === "invoices"}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {exportingType === "invoices" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{exportingType === "invoices" ? "Aktarılıyor..." : "E-Tabloya Aktar"}</span>
                </button>
              </div>
            </div>

            {/* 2. Cari Hesaplar */}
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {contacts.length} Cari
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Cari Hesaplar & Bakiyeler</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Müşteri ve tedarikçi unvanları, vergi numaraları, iletişim kanalları, güncel borç/alacak bakiyeleri.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-2xs text-slate-400">Google E-Tablo formatı</span>
                <button
                  type="button"
                  onClick={handleExportContacts}
                  disabled={exportingType === "contacts"}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {exportingType === "contacts" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{exportingType === "contacts" ? "Aktarılıyor..." : "E-Tabloya Aktar"}</span>
                </button>
              </div>
            </div>

            {/* 3. Ürün & Stok */}
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {products.length} Ürün
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Ürün & Stok Envanteri</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Stok kodları, barkodlar, birim fiyatlar, kritik stok seviyeleri ve mevcut depo miktarları.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-2xs text-slate-400">Google E-Tablo formatı</span>
                <button
                  type="button"
                  onClick={handleExportProducts}
                  disabled={exportingType === "products"}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {exportingType === "products" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{exportingType === "products" ? "Aktarılıyor..." : "E-Tabloya Aktar"}</span>
                </button>
              </div>
            </div>

            {/* 4. Kasa & Banka Finans Hareketleri */}
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {transactions.length} Hareket
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Kasa & Banka Hareketleri</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gelir/gider akışı, banka havaleleri, nakit tahsilatlar ve tediye kayıtları dökümü.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-2xs text-slate-400">Google E-Tablo formatı</span>
                <button
                  type="button"
                  onClick={handleExportFinance}
                  disabled={exportingType === "finance"}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {exportingType === "finance" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{exportingType === "finance" ? "Aktarılıyor..." : "E-Tabloya Aktar"}</span>
                </button>
              </div>
            </div>

            {/* 5. Çek & Senet Portföyü */}
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {cheques.length + promissoryNotes.length} Belge
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Çek & Senet Portföyü</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Vadesi yaklaşan ve portföydeki alınan/verilen çek ve senetler, banka detayları ve durumları.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-2xs text-slate-400">Google E-Tablo formatı</span>
                <button
                  type="button"
                  onClick={handleExportCheques}
                  disabled={exportingType === "cheques"}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {exportingType === "cheques" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{exportingType === "cheques" ? "Aktarılıyor..." : "E-Tabloya Aktar"}</span>
                </button>
              </div>
            </div>

            {/* 6. İnşaat Maliyetlendirme & Şantiyeler */}
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {constructionProjects.length} Proje
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">İnşaat Şantiye Maliyetleri</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Şantiyeler, metrajlar, keşif bütçeleri, gerçekleşen taşeron hakedişleri ve sapma oranları.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-2xs text-slate-400">Google E-Tablo formatı</span>
                <button
                  type="button"
                  onClick={handleExportConstruction}
                  disabled={exportingType === "construction"}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {exportingType === "construction" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{exportingType === "construction" ? "Aktarılıyor..." : "E-Tabloya Aktar"}</span>
                </button>
              </div>
            </div>

            {/* 7. Teknik Servis İş Emirleri */}
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {autoServiceRecords.length + itServiceRecords.length + applianceServiceRecords.length} Kayıt
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Teknik Servis İş Emirleri</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Oto servis, bilişim ve ev aletleri servis fişleri, arıza kayıtları ve tahsilat durumları.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-2xs text-slate-400">Google E-Tablo formatı</span>
                <button
                  type="button"
                  onClick={handleExportServices}
                  disabled={exportingType === "services"}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {exportingType === "services" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{exportingType === "services" ? "Aktarılıyor..." : "E-Tabloya Aktar"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVE FILES EXPLORER */}
      {activeTab === "drive_files" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sheetsSearch}
                onChange={(e) => setSheetsSearch(e.target.value)}
                placeholder="Google Drive e-tablolarında ara..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={fetchDriveSpreadsheets}
              disabled={loadingSheets}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 self-end sm:self-auto transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSheets ? "animate-spin" : ""}`} />
              <span>Yenile</span>
            </button>
          </div>

          {loadingSheets ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Google Drive e-tablolarınız taranıyor...</span>
            </div>
          ) : filteredDriveSheets.length === 0 ? (
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl p-12 text-center text-slate-500"
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                {isConnected
                  ? "Google Drive hesabınızda henüz e-tablo bulunamadı veya aramayla eşleşen sonuç yok."
                  : "Google Drive e-tablolarınızı listelemek için lütfen yukarıdan Google hesabınız ile bağlanın."}
              </p>
              {!isConnected && (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  Google ile Bağlan
                </button>
              )}
            </div>
          ) : (
            <div
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              className="border rounded-2xl overflow-hidden shadow-xs"
            >
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">E-Tablo Adı</th>
                    <th className="py-3 px-4">Son Değişiklik</th>
                    <th className="py-3 px-4">Sahibi</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredDriveSheets.map((sheet) => (
                    <tr key={sheet.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">{sheet.name}</span>
                            <span className="text-2xs text-slate-400">ID: {sheet.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(sheet.modifiedTime).toLocaleString("tr-TR")}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {sheet.owners?.[0]?.displayName || sheet.owners?.[0]?.emailAddress || "Ben"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(sheet)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Önizle</span>
                          </button>
                          {sheet.webViewLink && (
                            <a
                              href={sheet.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                            >
                              <span>Aç</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMPORT FROM GOOGLE SHEETS */}
      {activeTab === "import_data" && (
        <div className="space-y-6">
          <div
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            className="border rounded-2xl p-6 shadow-xs space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Google E-Tablosundan Muhasebeye Veri Aktarma
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Google Drive hesabınızdaki bir e-tablodan cari hesapları veya ürün listelerini tek hamlede içe aktarın.
                </p>
              </div>
            </div>

            {importSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{importSuccessMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. İçe Aktarılacak Modül
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportTargetType("contacts")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      importTargetType === "contacts"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Cari Hesaplar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTargetType("products")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      importTargetType === "products"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Ürünler & Stok</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Drive'dan E-Tablo Seçin veya Bağlantı Girin
                </label>
                <div className="flex gap-2">
                  {driveSheets.length > 0 ? (
                    <select
                      value={selectedSheetForImport}
                      onChange={(e) => {
                        setSelectedSheetForImport(e.target.value);
                        setManualSheetInput("");
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- Drive'dan E-Tablo Seçin --</option>
                      {driveSheets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualSheetInput}
                      onChange={(e) => {
                        setManualSheetInput(e.target.value);
                        setSelectedSheetForImport("");
                      }}
                      placeholder="Google E-Tablo Bağlantısı veya Spreadsheet ID yapıştırın..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleLoadImportPreview}
                    disabled={loadingImportData || (!selectedSheetForImport && !manualSheetInput.trim())}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    {loadingImportData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>Verileri Getir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Grid for Import */}
            {importPreviewData.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Önizleme ({importPreviewData.length - 1} Satır Veri Bulundu)
                  </span>
                  <button
                    type="button"
                    onClick={executeDataImport}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Seçilen Verileri Sisteme Aktar</span>
                  </button>
                </div>

                <div className="max-h-72 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                      <tr>
                        {importPreviewData[0]?.map((head, idx) => (
                          <th key={idx} className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {String(head || `Sütun ${idx + 1}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {importPreviewData.slice(1, 20).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                              {String(cell || "-")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreviewData.length > 21 && (
                  <p className="text-2xs text-slate-400 text-center">
                    (İlk 20 satır gösterilmektedir, tamamı içe aktarılacaktır)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL FOR DRIVE SPREADSHEET */}
      {previewSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            className="border rounded-2xl w-full max-w-5xl p-6 shadow-xl relative max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{previewSheet.name}</h3>
                  <span className="text-2xs text-slate-400">Google Drive E-Tablo Önizlemesi</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewSheet.webViewLink && (
                  <a
                    href={previewSheet.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Google Sheets'te Aç</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewSheet(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>

            {/* Sheet Tabs */}
            {previewMetadata && previewMetadata.sheets.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                {previewMetadata.sheets.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleTabChangeInPreview(s.title)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      previewTabName === s.title
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}

            {/* Modal Body: Table Grid */}
            <div className="flex-1 overflow-auto mt-4 border border-slate-200 dark:border-slate-800 rounded-xl">
              {loadingPreview ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs">E-tablo hücreleri yükleniyor...</span>
                </div>
              ) : previewRows.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">Bu e-tabloda veri bulunamadı.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center border-r border-slate-800 text-slate-400 font-mono text-2xs">
                        #
                      </th>
                      {previewRows[0]?.map((head, idx) => (
                        <th key={idx} className="py-2.5 px-3 border-r border-slate-800 whitespace-nowrap">
                          {String(head || `Sütun ${idx + 1}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-2xs">
                    {previewRows.slice(1).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-center border-r border-slate-100 dark:border-slate-800 text-slate-400">
                          {rIdx + 2}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                            {String(cell || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION MODAL FOR DESTRUCTIVE / WORKSPACE OPERATIONS */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            className="border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{confirmDialog.description}</p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  await confirmDialog.action();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
