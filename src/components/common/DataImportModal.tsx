import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Search,
  CheckSquare,
  Square,
  FileUp,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Users,
  Package
} from "lucide-react";
import { Contact, Product, ContactType, getContactAccountCode } from "../../types";
import {
  ImportColumnDef,
  CONTACT_IMPORT_COLUMNS,
  PRODUCT_IMPORT_COLUMNS,
  autoDetectColumnMapping,
  parseFlexibleNumber,
  parseVatRate,
  parseContactType,
  downloadSampleImportTemplate
} from "../../utils/excelImportUtils";
import { triggerFormErrorNotification } from "../../context/FormErrorContext";

export interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "contacts" | "products";
  existingContacts?: Contact[];
  existingProducts?: Product[];
  onImportContacts?: (contacts: Contact[], updateExisting: boolean) => void;
  onImportProducts?: (products: Product[], updateExisting: boolean) => void;
}

interface ParsedPreviewRow {
  index: number;
  raw: any[];
  isValid: boolean;
  validationError?: string;
  isExistingMatch: boolean;
  matchKey?: string;
  data: Partial<Contact> | Partial<Product>;
  selected: boolean;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  mode,
  existingContacts = [],
  existingProducts = [],
  onImportContacts,
  onImportProducts,
}) => {
  // Wizard Steps: 1 = File Upload, 2 = Column Mapping, 3 = Preview & Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // File & Sheet State
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Raw Rows & Headers
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);

  // Column Mappings: fieldKey -> columnIndex (-1 = unmapped)
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});

  // Options
  const [updateExisting, setUpdateExisting] = useState<boolean>(true);
  const [defaultContactType, setDefaultContactType] = useState<ContactType>("customer");
  const [defaultUnit, setDefaultUnit] = useState<string>("Adet");
  const [defaultVatRate, setDefaultVatRate] = useState<number>(20);

  // Preview & Selection State
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [previewSearch, setPreviewSearch] = useState<string>("");
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "matching" | "invalid">("all");
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetColumns: ImportColumnDef[] = useMemo(() => {
    return mode === "contacts" ? CONTACT_IMPORT_COLUMNS : PRODUCT_IMPORT_COLUMNS;
  }, [mode]);

  // Filter preview rows
  const filteredPreviewRows = useMemo(() => {
    return previewRows.filter((r) => {
      if (previewFilter === "valid" && !r.isValid) return false;
      if (previewFilter === "matching" && !r.isExistingMatch) return false;
      if (previewFilter === "invalid" && r.isValid) return false;

      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase().trim();
        if (mode === "contacts") {
          const c = r.data as Partial<Contact>;
          const matchName = String(c.name || "").toLowerCase().includes(q);
          const matchTax = String(c.taxNumber || "").includes(q);
          const matchCity = String(c.city || "").toLowerCase().includes(q);
          return matchName || matchTax || matchCity;
        } else {
          const p = r.data as Partial<Product>;
          const matchName = String(p.name || "").toLowerCase().includes(q);
          const matchCode = String(p.code || "").toLowerCase().includes(q);
          const matchBarcode = String(p.barcode || "").includes(q);
          return matchName || matchCode || matchBarcode;
        }
      }
      return true;
    });
  }, [previewRows, previewFilter, previewSearch, mode]);

  // Statistics
  const stats = useMemo(() => {
    const total = previewRows.length;
    const valid = previewRows.filter((r) => r.isValid).length;
    const matching = previewRows.filter((r) => r.isExistingMatch).length;
    const invalid = total - valid;
    const selected = previewRows.filter((r) => r.selected && r.isValid).length;
    return { total, valid, matching, invalid, selected };
  }, [previewRows]);

  // Reset state when closing
  const handleClose = () => {
    setStep(1);
    setFile(null);
    setFileName("");
    setSheetNames([]);
    setSelectedSheet("");
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setPreviewRows([]);
    setFileError(null);
    onClose();
  };

  // 1. Process Loaded File with SheetJS (xlsx)
  const processFile = async (selectedFile: File) => {
    setFileError(null);
    setIsParsing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Excel dosyasında okunabilir çalışma sayfası bulunamadı.");
      }

      setSheetNames(workbook.SheetNames);
      const firstSheet = workbook.SheetNames[0];
      setSelectedSheet(firstSheet);

      // Load sheet data
      loadSheetData(workbook, firstSheet);
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setStep(2);
    } catch (err: any) {
      console.error("Excel okuma hatası:", err);
      setFileError(err?.message || "Dosya formatı desteklenmiyor veya dosya bozuk.");
    } finally {
      setIsParsing(false);
    }
  };

  const loadSheetData = (workbookOrFile: any, sheetName: string) => {
    let wb = workbookOrFile;
    if (!(wb && wb.Sheets)) {
      // Need to re-read if called later
      return;
    }
    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) return;

    // Convert sheet to array of arrays
    const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (!jsonRows || jsonRows.length === 0) {
      setFileError("Seçilen çalışma sayfası boş görünüyor.");
      return;
    }

    // Find the header row (first non-empty row)
    let headerIdx = 0;
    for (let i = 0; i < Math.min(jsonRows.length, 10); i++) {
      const nonEmpties = jsonRows[i].filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "");
      if (nonEmpties.length >= 2) {
        headerIdx = i;
        break;
      }
    }

    const headers = jsonRows[headerIdx].map((h, i) => String(h || "").trim() || `Sütun ${i + 1}`);
    const dataRows = jsonRows.slice(headerIdx + 1).filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
    );

    setRawHeaders(headers);
    setRawRows(dataRows);

    // Run auto-mapping
    const detected = autoDetectColumnMapping(headers, targetColumns);
    setColumnMapping(detected);
  };

  const handleSheetChange = async (newSheet: string) => {
    if (!file) return;
    setSelectedSheet(newSheet);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      loadSheetData(wb, newSheet);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // 2. Build Preview Rows from Column Mapping
  const generatePreview = () => {
    const nameColIdx = columnMapping["name"];
    if (nameColIdx === undefined || nameColIdx === -1) {
      setFileError("Lütfen 'Ünvan / Ad' sütununu eşleyin. Bu sütun zorunludur.");
      return;
    }

    const rows: ParsedPreviewRow[] = [];

    // Pre-build index for fast matching
    const contactTaxMap = new Set(
      existingContacts
        .map((c) => String(c.taxNumber || "").trim())
        .filter(Boolean)
    );
    const contactNameMap = new Set(
      existingContacts.map((c) => String(c.name || "").trim().toLowerCase()).filter(Boolean)
    );

    const productCodeMap = new Set(
      existingProducts
        .map((p) => String(p.code || "").trim().toLowerCase())
        .filter(Boolean)
    );
    const productBarcodeMap = new Set(
      existingProducts
        .map((p) => String(p.barcode || "").trim())
        .filter(Boolean)
    );
    const productNameMap = new Set(
      existingProducts.map((p) => String(p.name || "").trim().toLowerCase()).filter(Boolean)
    );

    rawRows.forEach((row, idx) => {
      const getVal = (key: string): any => {
        const colIdx = columnMapping[key];
        if (colIdx === undefined || colIdx === -1) return undefined;
        return row[colIdx];
      };

      if (mode === "contacts") {
        const rawName = String(getVal("name") || "").trim();
        const rawTax = String(getVal("taxNumber") || "").trim();
        const rawType = getVal("contactType");
        const rawBalance = getVal("balance");

        const isValid = Boolean(rawName);
        const validationError = !isValid ? "Cari adı / Firma ünvanı eksik" : undefined;

        let isExistingMatch = false;
        let matchKey: string | undefined = undefined;

        if (rawTax && contactTaxMap.has(rawTax)) {
          isExistingMatch = true;
          matchKey = `VKN: ${rawTax}`;
        } else if (rawName && contactNameMap.has(rawName.toLowerCase())) {
          isExistingMatch = true;
          matchKey = `Ünvan Eşleşmesi`;
        }

        const parsedBalance = parseFlexibleNumber(rawBalance, 0);

        const contactData: Partial<Contact> = {
          name: rawName,
          companyTitle: rawName,
          contactType: rawType ? parseContactType(rawType, defaultContactType) : defaultContactType,
          taxNumber: rawTax || undefined,
          taxOffice: String(getVal("taxOffice") || "").trim() || undefined,
          accountCode: String(getVal("accountCode") || "").trim() || undefined,
          phone: String(getVal("phone") || "").trim() || undefined,
          email: String(getVal("email") || "").trim() || undefined,
          city: String(getVal("city") || "").trim() || undefined,
          district: String(getVal("district") || "").trim() || undefined,
          address: String(getVal("address") || "").trim() || undefined,
          contactPerson: String(getVal("contactPerson") || "").trim() || undefined,
          balance: parsedBalance,
          balanceType: parsedBalance > 0 ? "receivable" : parsedBalance < 0 ? "payable" : "balanced",
          notes: String(getVal("notes") || "").trim() || undefined,
        };

        rows.push({
          index: idx,
          raw: row,
          isValid,
          validationError,
          isExistingMatch,
          matchKey,
          data: contactData,
          selected: isValid,
        });
      } else {
        // Products Mode
        const rawName = String(getVal("name") || "").trim();
        const rawCode = String(getVal("code") || "").trim();
        const rawBarcode = String(getVal("barcode") || "").trim();

        const isValid = Boolean(rawName);
        const validationError = !isValid ? "Ürün / Hizmet adı eksik" : undefined;

        let isExistingMatch = false;
        let matchKey: string | undefined = undefined;

        if (rawCode && productCodeMap.has(rawCode.toLowerCase())) {
          isExistingMatch = true;
          matchKey = `Kod: ${rawCode}`;
        } else if (rawBarcode && productBarcodeMap.has(rawBarcode)) {
          isExistingMatch = true;
          matchKey = `Barkod: ${rawBarcode}`;
        } else if (rawName && productNameMap.has(rawName.toLowerCase())) {
          isExistingMatch = true;
          matchKey = `Ad Eşleşmesi`;
        }

        const buyPrice = parseFlexibleNumber(getVal("buyPrice"), 0);
        const sellPrice = parseFlexibleNumber(getVal("sellPrice"), 0);
        const vatRate = parseVatRate(getVal("vatRate"), defaultVatRate);
        const stockQuantity = parseFlexibleNumber(getVal("stockQuantity"), 0);
        const minStockAlert = getVal("minStockAlert") ? parseFlexibleNumber(getVal("minStockAlert"), 0) : undefined;
        const unit = String(getVal("unit") || "").trim() || defaultUnit;
        const stockType = String(getVal("stockType") || "").trim() || "Ticari Mal";
        const category = String(getVal("category") || "").trim() || undefined;

        const productData: Partial<Product> = {
          name: rawName,
          code: rawCode || `STK-${1000 + idx + 1}`,
          unit,
          buyPrice,
          sellPrice,
          vatRate,
          stockQuantity,
          minStockAlert,
          barcode: rawBarcode || undefined,
          category,
          stockType,
          isService: stockType.toLowerCase().includes("hizmet"),
        };

        rows.push({
          index: idx,
          raw: row,
          isValid,
          validationError,
          isExistingMatch,
          matchKey,
          data: productData,
          selected: isValid,
        });
      }
    });

    setPreviewRows(rows);
    setStep(3);
  };

  // Selection helpers
  const handleToggleRow = (idx: number) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.index === idx ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAllFiltered = (selected: boolean) => {
    const filteredIndices = new Set(filteredPreviewRows.map((r) => r.index));
    setPreviewRows((prev) =>
      prev.map((r) => (filteredIndices.has(r.index) && r.isValid ? { ...r, selected } : r))
    );
  };



  // 3. Execute Bulk Import
  const handleExecuteImport = () => {
    const selectedItems = previewRows.filter((r) => r.selected && r.isValid);
    if (selectedItems.length === 0) {
      triggerFormErrorNotification("İçe aktarılacak seçili geçerli satır bulunamadı.", "İçe Aktarım Hatası");
      return;
    }

    setIsImporting(true);
    try {
      if (mode === "contacts") {
        const fullContacts: Contact[] = selectedItems.map((r, i) => {
          const c = r.data as Partial<Contact>;
          const fallbackCode = getContactAccountCode(c);
          return {
            id: `c_imp_${Date.now()}_${i}`,
            name: c.name!,
            companyTitle: c.companyTitle || c.name!,
            contactType: c.contactType || defaultContactType,
            taxNumber: c.taxNumber,
            taxOffice: c.taxOffice,
            accountCode: c.accountCode || fallbackCode,
            phone: c.phone,
            email: c.email,
            city: c.city,
            district: c.district,
            address: c.address,
            contactPerson: c.contactPerson,
            balance: c.balance || 0,
            balanceType: (c.balance || 0) > 0 ? "receivable" : (c.balance || 0) < 0 ? "payable" : "balanced",
            notes: c.notes,
            createdAt: new Date().toISOString(),
          };
        });

        if (onImportContacts) {
          onImportContacts(fullContacts, updateExisting);
        }
        triggerFormErrorNotification(
          `${fullContacts.length} adet cari hesap başarıyla içeri aktarıldı.`,
          "Toplu İçe Aktarım Başarılı"
        );
      } else {
        const fullProducts: Product[] = selectedItems.map((r, i) => {
          const p = r.data as Partial<Product>;
          return {
            id: `p_imp_${Date.now()}_${i}`,
            code: p.code || `STK-${1000 + i + 1}`,
            name: p.name!,
            unit: p.unit || defaultUnit,
            buyPrice: p.buyPrice || 0,
            sellPrice: p.sellPrice || 0,
            vatRate: p.vatRate ?? defaultVatRate,
            stockQuantity: p.stockQuantity || 0,
            minStockAlert: p.minStockAlert,
            barcode: p.barcode,
            category: p.category,
            stockType: p.stockType || "Ticari Mal",
            isService: p.isService,
          };
        });

        if (onImportProducts) {
          onImportProducts(fullProducts, updateExisting);
        }
        triggerFormErrorNotification(
          `${fullProducts.length} adet stok kartı başarıyla içeri aktarıldı.`,
          "Toplu İçe Aktarım Başarılı"
        );
      }

      handleClose();
    } catch (err: any) {
      console.error("İçe aktarım tamamlama hatası:", err);
      triggerFormErrorNotification(err?.message || "İçe aktarım sırasında bir hata oluştu.", "Hata");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f6bae]/20 border border-[#0f6bae]/40 flex items-center justify-center text-cyan-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {mode === "contacts" ? "Cari Hesapları İçe Aktar" : "Stok & Ürünleri İçe Aktar"}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Excel / CSV
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {mode === "contacts"
                  ? "Müşteri ve tedarikçi listelerinizi sütun eşleme ile sisteme toplu aktarın."
                  : "Mevcut ürün, stok ve fiyat kataloğunuzu Excel veya CSV üzerinden toplu aktarın."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadSampleImportTemplate(mode)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:text-white"
              title="Hazır Excel şablonunu bilgisayarınıza indirin"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Örnek Şablon (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              disabled={step === 1}
              className={`flex items-center gap-2 font-bold transition-colors ${
                step === 1 ? "text-[#0f6bae]" : "text-slate-500 hover:text-slate-800 cursor-pointer"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? "bg-[#0f6bae] text-white" : "bg-slate-200 text-slate-600"}`}>
                1
              </span>
              <span>1. Dosya Yükle</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <button
              type="button"
              onClick={() => step > 2 && setStep(2)}
              disabled={rawHeaders.length === 0}
              className={`flex items-center gap-2 font-bold transition-colors ${
                step === 2 ? "text-[#0f6bae]" : step > 2 ? "text-slate-600 hover:text-slate-800 cursor-pointer" : "text-slate-300"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? "bg-[#0f6bae] text-white" : step > 2 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"}`}>
                2
              </span>
              <span>2. Sütunları Eşle</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <div className={`flex items-center gap-2 font-bold ${step === 3 ? "text-[#0f6bae]" : "text-slate-300"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "bg-[#0f6bae] text-white" : "bg-slate-200 text-slate-400"}`}>
                3
              </span>
              <span>3. Önizle & Onayla</span>
            </div>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold truncate max-w-[200px]">{fileName}</span>
              <span className="text-slate-400">({rawRows.length} satır)</span>
            </div>
          )}
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {fileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <div className="flex-1 font-medium">{fileError}</div>
              <button
                type="button"
                onClick={() => setFileError(null)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
              >
                Kapat
              </button>
            </div>
          )}

          {/* STEP 1: FILE UPLOAD */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-[#0f6bae] bg-cyan-50/50 scale-[1.01]"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-[#0f6bae]/10 text-[#0f6bae] flex items-center justify-center mb-4 shadow-xs">
                  {isParsing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <FileUp className="w-8 h-8" />
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Excel (.xlsx, .xls) veya CSV Dosyanızı Buraya Sürükleyin
                </h3>
                <p className="text-xs text-slate-500 max-w-md mb-4">
                  veya bilgisayarınızdan dosya seçmek için tıklayın. Sütun isimleri otomatik algılanacaktır.
                </p>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Microsoft Excel (.xlsx, .xls)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Virgülle Ayrılmış CSV (.csv)
                  </span>
                </div>
              </div>

              {/* Template Download Prompt */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-950">
                      Doğru formatta veri hazırlamak için örnek şablonu kullanın
                    </h4>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Hazır başlıklar ve örnek satırları içeren Excel dosyasını doldurarak doğrudan yükleyebilirsiniz.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSampleImportTemplate(mode)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Örnek Şablonu İndir</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & CONFIGURATION */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Sheet Selector (if multiple) */}
              {sheetNames.length > 1 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">Aktif Çalışma Sayfası:</span>
                  </div>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 cursor-pointer"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conflict & Defaults Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                {/* 1. Conflict Strategy */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Çakışma / Eşleşme Stratejisi
                  </label>
                  <select
                    value={updateExisting ? "update" : "append"}
                    onChange={(e) => setUpdateExisting(e.target.value === "update")}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
                  >
                    <option value="update">
                      {mode === "contacts"
                        ? "Mevcut VKN/Ada göre varsa GÜNCELLE"
                        : "Mevcut Kod/Barkoda göre varsa GÜNCELLE"}
                    </option>
                    <option value="append">Mevcut kayıtlara bakılmaksızın YENİ EKLE</option>
                  </select>
                </div>

                {/* 2. Mode Specific Defaults */}
                {mode === "contacts" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Varsayılan Cari Tipi (Belirtilmemişse)
                    </label>
                    <select
                      value={defaultContactType}
                      onChange={(e) => setDefaultContactType(e.target.value as ContactType)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
                    >
                      <option value="customer">Müşteri (Alıcı)</option>
                      <option value="supplier">Tedarikçi (Satıcı)</option>
                      <option value="both">Hem Müşteri Hem Tedarikçi</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Varsayılan Ölçü Birimi (Belirtilmemişse)
                    </label>
                    <input
                      type="text"
                      value={defaultUnit}
                      onChange={(e) => setDefaultUnit(e.target.value)}
                      placeholder="Adet"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
                    />
                  </div>
                )}

                {mode === "products" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Varsayılan KDV Oranı (%)
                    </label>
                    <select
                      value={defaultVatRate}
                      onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
                    >
                      <option value={20}>%20</option>
                      <option value={10}>%10</option>
                      <option value={1}>%1</option>
                      <option value={0}>%0 (İstisna)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Column Mapping Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Sütun Eşleştirme Tablosu
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sistem dosyanızdaki sütunları otomatik eşleştirdi. Gerekirse açılır listeden değiştirebilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setColumnMapping(autoDetectColumnMapping(rawHeaders, targetColumns))}
                    className="text-xs font-semibold text-[#0f6bae] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Otomatik Eşlemeyi Yenile</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-200">
                  <div className="bg-slate-100/80 px-4 py-2.5 grid grid-cols-12 gap-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <div className="col-span-5">Hedef Sistem Alanı</div>
                    <div className="col-span-4">Dosyadaki Eşleşen Sütun</div>
                    <div className="col-span-3">1. Satır Örnek Veri</div>
                  </div>

                  {targetColumns.map((col) => {
                    const mappedIdx = columnMapping[col.key] ?? -1;
                    const sampleVal =
                      mappedIdx !== -1 && rawRows.length > 0 && rawRows[0][mappedIdx] !== undefined
                        ? String(rawRows[0][mappedIdx])
                        : "-";

                    return (
                      <div
                        key={col.key}
                        className={`px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs transition-colors ${
                          col.required && mappedIdx === -1
                            ? "bg-rose-50/50"
                            : mappedIdx !== -1
                            ? "bg-white hover:bg-slate-50/50"
                            : "bg-slate-50/40 text-slate-400"
                        }`}
                      >
                        {/* 1. Target Column Name & Info */}
                        <div className="col-span-5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{col.label}</span>
                            {col.required && (
                              <span className="text-rose-600 font-black text-xs" title="Zorunlu alan">*</span>
                            )}
                          </div>
                          {col.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {col.description}
                            </p>
                          )}
                        </div>

                        {/* 2. Dropdown Selector */}
                        <div className="col-span-4">
                          <select
                            value={mappedIdx}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setColumnMapping((prev) => ({ ...prev, [col.key]: val }));
                            }}
                            className={`w-full text-xs rounded-lg px-2.5 py-1.5 font-medium border transition-all cursor-pointer ${
                              mappedIdx !== -1
                                ? "border-emerald-500 bg-emerald-50/30 text-slate-900 font-semibold"
                                : col.required
                                ? "border-rose-300 bg-rose-50 text-rose-800"
                                : "border-slate-300 bg-white text-slate-600"
                            }`}
                          >
                            <option value={-1}>-- (Eşleme Yapma / Atla) --</option>
                            {rawHeaders.map((header, hIdx) => (
                              <option key={hIdx} value={hIdx}>
                                {header} (Sütun {hIdx + 1})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Sample Preview Value */}
                        <div className="col-span-3">
                          <div
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono truncate border ${
                              mappedIdx !== -1
                                ? "bg-slate-100 text-slate-800 border-slate-200"
                                : "bg-slate-50 text-slate-400 border-dashed border-slate-200"
                            }`}
                            title={sampleVal}
                          >
                            {sampleVal}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & CONFIRM */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">Toplam Satır</span>
                  <div className="text-xl font-bold font-mono text-slate-800">{stats.total}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 block uppercase">İçe Aktarılacak</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">{stats.selected}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-700 block uppercase">
                    {updateExisting ? "Güncellenecek" : "Mevcutla Eşleşen"}
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-700">{stats.matching}</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-700 block uppercase">Hatalı / Atlanan</span>
                  <div className="text-xl font-bold font-mono text-rose-700">{stats.invalid}</div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Önizleme içinde ara..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <select
                    value={previewFilter}
                    onChange={(e) => setPreviewFilter(e.target.value as any)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer shrink-0"
                  >
                    <option value="all">Tüm Satırlar ({stats.total})</option>
                    <option value="valid">Geçerli Olanlar ({stats.valid})</option>
                    <option value="matching">Eşleşenler ({stats.matching})</option>
                    <option value="invalid">Hatalı Olanlar ({stats.invalid})</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectAllFiltered(true)}
                    className="hover:text-slate-800 font-bold cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllFiltered(false)}
                    className="hover:text-slate-800 font-bold cursor-pointer"
                  >
                    Seçimi Temizle
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <span className="sr-only">Seç</span>
                      </th>
                      <th className="p-2.5 font-bold text-slate-700">Durum</th>
                      {mode === "contacts" ? (
                        <>
                          <th className="p-2.5 font-bold text-slate-700">Cari Adı / Ünvan</th>
                          <th className="p-2.5 font-bold text-slate-700">Tür</th>
                          <th className="p-2.5 font-bold text-slate-700">VKN / TCKN</th>
                          <th className="p-2.5 font-bold text-slate-700">İl / İlçe</th>
                          <th className="p-2.5 font-bold text-slate-700 text-right">Bakiye</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2.5 font-bold text-slate-700">Stok Kodu</th>
                          <th className="p-2.5 font-bold text-slate-700">Ürün Adı</th>
                          <th className="p-2.5 font-bold text-slate-700">Birim</th>
                          <th className="p-2.5 font-bold text-slate-700 text-right">Alış</th>
                          <th className="p-2.5 font-bold text-slate-700 text-right">Satış</th>
                          <th className="p-2.5 font-bold text-slate-700 text-right">KDV</th>
                          <th className="p-2.5 font-bold text-slate-700 text-right">Mevcut Stok</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPreviewRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Seçilen kriterlere uygun satır bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredPreviewRows.map((r) => {
                        return (
                          <tr
                            key={r.index}
                            className={`transition-colors ${
                              !r.isValid
                                ? "bg-rose-50/40 hover:bg-rose-50/60"
                                : r.selected
                                ? "bg-white hover:bg-slate-50"
                                : "bg-slate-50/50 opacity-60"
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={r.selected}
                                disabled={!r.isValid}
                                onChange={() => handleToggleRow(r.index)}
                                className="rounded border-slate-300 text-[#0f6bae] focus:ring-[#0f6bae] cursor-pointer"
                              />
                            </td>

                            <td className="p-2.5">
                              {r.isValid ? (
                                r.isExistingMatch ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                                    title={r.matchKey}
                                  >
                                    {updateExisting ? "Güncelle" : "Eşleşti"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Yeni
                                  </span>
                                )
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
                                  title={r.validationError}
                                >
                                  Hatalı
                                </span>
                              )}
                            </td>

                            {mode === "contacts" ? (
                              <>
                                <td className="p-2.5 font-bold text-slate-900">
                                  {(r.data as Partial<Contact>).name || (
                                    <span className="text-rose-500 italic">Eksik Unvan</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {(r.data as Partial<Contact>).contactType === "customer"
                                    ? "Müşteri"
                                    : (r.data as Partial<Contact>).contactType === "supplier"
                                    ? "Tedarikçi"
                                    : "Hem Müşteri Hem Ted."}
                                </td>
                                <td className="p-2.5 font-mono text-slate-600">
                                  {(r.data as Partial<Contact>).taxNumber || "-"}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {[(r.data as Partial<Contact>).city, (r.data as Partial<Contact>).district]
                                    .filter(Boolean)
                                    .join(" / ") || "-"}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                  ₺{Number((r.data as Partial<Contact>).balance || 0).toLocaleString("tr-TR")}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-2.5 font-mono text-slate-700 font-semibold">
                                  {(r.data as Partial<Product>).code || "-"}
                                </td>
                                <td className="p-2.5 font-bold text-slate-900">
                                  {(r.data as Partial<Product>).name || (
                                    <span className="text-rose-500 italic">Eksik Ad</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {(r.data as Partial<Product>).unit || "-"}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-700">
                                  ₺{Number((r.data as Partial<Product>).buyPrice || 0).toLocaleString("tr-TR")}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                  ₺{Number((r.data as Partial<Product>).sellPrice || 0).toLocaleString("tr-TR")}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-600">
                                  %{(r.data as Partial<Product>).vatRate ?? 20}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                                  {Number((r.data as Partial<Product>).stockQuantity || 0).toLocaleString("tr-TR")}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={generatePreview}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0f6bae] hover:bg-[#0c578f] shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Önizlemeye Geç</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isImporting || stats.selected === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>İçe Aktarılıyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{stats.selected} Kaydı İçe Aktar</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
