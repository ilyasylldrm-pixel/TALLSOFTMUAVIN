import React, { useState, useRef, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { Account, Contact, Transaction } from "../types";
import {
  X,
  Upload,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  Check,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  RefreshCw,
  HelpCircle,
  FileText,
  CheckSquare,
  Square,
  ArrowRightLeft,
  FileUp
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";

export interface BankStatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  contacts: Contact[];
  transactions: Transaction[];
  selectedBankAccountId?: string | null;
  onImportTransactions?: (importedTxs: Omit<Transaction, "id">[]) => void;
  onAddTransaction?: (tx: Transaction) => void;
}

export interface ParsedStatementRow {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  documentNo: string;
  amount: number;
  type: "income" | "expense";
  matchedContactId: string | null;
  matchedContactName: string | null;
  matchStatus: "exact" | "partial" | "none";
  matchScore: number;
  isDuplicate: boolean;
  selected: boolean;
}

export const BankStatementImportModal: React.FC<BankStatementImportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  contacts,
  transactions,
  selectedBankAccountId,
  onImportTransactions,
  onAddTransaction,
}) => {
  const bankAccounts = useMemo(
    () => accounts.filter((a) => a.type === "bank" || a.type === "credit_card"),
    [accounts]
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Raw workbook data
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [headerRowIdx, setHeaderRowIdx] = useState<number>(0);
  
  // Column Mappings
  const [dateCol, setDateCol] = useState<number>(-1);
  const [descCol, setDescCol] = useState<number>(-1);
  const [amountCol, setAmountCol] = useState<number>(-1);
  const [debitCol, setDebitCol] = useState<number>(-1);
  const [creditCol, setCreditCol] = useState<number>(-1);
  const [docNoCol, setDocNoCol] = useState<number>(-1);
  const [typeCol, setTypeCol] = useState<number>(-1);

  const [isMappingExpanded, setIsMappingExpanded] = useState<boolean>(false);

  // Parsed and matched rows
  const [parsedRows, setParsedRows] = useState<ParsedStatementRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "matched" | "unmatched" | "duplicate">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-select account when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      if (selectedBankAccountId) {
        setSelectedAccountId(selectedBankAccountId);
      } else if (bankAccounts.length > 0) {
        setSelectedAccountId(bankAccounts[0].id);
      }
    }
  }, [isOpen, selectedBankAccountId, bankAccounts]);

  const targetAccount = accounts.find((a) => a.id === selectedAccountId);

  // Helper function to clean number strings
  const parseNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    let str = String(val).trim();
    if (!str) return 0;
    // Handle Turkish formats: 1.250,50 -> 1250.50
    // If contains comma and dot, replace dot with nothing and comma with dot
    if (str.includes(".") && str.includes(",")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else if (str.includes(",") && !str.includes(".")) {
      str = str.replace(",", ".");
    }
    // Remove non-numeric chars except minus and dot
    str = str.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to convert dates
  const parseFormattedDate = (val: any): string => {
    if (!val) return new Date().toISOString().split("T")[0];
    
    // Check if Excel Serial Date (e.g. 45514)
    if (typeof val === "number" && val > 30000 && val < 60000) {
      const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      return dateObj.toISOString().split("T")[0];
    }

    const str = String(val).trim();
    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.substring(0, 10);
    }
    // Check DD.MM.YYYY or DD/MM/YYYY
    const parts = str.split(/[./-]/);
    if (parts.length >= 3) {
      let d = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (d > 31 && y <= 31) {
        // Swapped format YYYY.MM.DD
        const temp = d;
        d = y;
        y = temp;
      }
      if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const mm = m < 10 ? `0${m}` : `${m}`;
        const dd = d < 10 ? `0${d}` : `${d}`;
        return `${y}-${mm}-${dd}`;
      }
    }
    return new Date().toISOString().split("T")[0];
  };

  // Smart Contact Matcher
  const findBestContactMatch = (desc: string): { contact: Contact | null; status: "exact" | "partial" | "none"; score: number } => {
    if (!desc || !contacts.length) return { contact: null, status: "none", score: 0 };

    const normDesc = desc.toLocaleLowerCase("tr-TR");

    let bestMatch: Contact | null = null;
    let highestScore = 0;

    for (const c of contacts) {
      let score = 0;
      const cName = c.name.toLocaleLowerCase("tr-TR").trim();
      const cComp = (c.companyName || "").toLocaleLowerCase("tr-TR").trim();
      const cTax = (c.taxNumber || "").trim();

      // Check tax number exact match
      if (cTax && cTax.length >= 5 && normDesc.includes(cTax)) {
        return { contact: c, status: "exact", score: 100 };
      }

      // Exact name match in description
      if (cName.length >= 3 && normDesc.includes(cName)) {
        score = 95;
      } else if (cComp && cComp.length >= 3 && normDesc.includes(cComp)) {
        score = 90;
      } else {
        // Word token overlap
        const words = cName.split(/\s+/).filter((w) => w.length >= 3);
        if (words.length > 0) {
          let matchedWords = 0;
          for (const w of words) {
            if (normDesc.includes(w)) matchedWords++;
          }
          if (matchedWords === words.length) {
            score = 85;
          } else if (matchedWords > 0) {
            score = 40 + (matchedWords / words.length) * 30;
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = c;
      }
    }

    if (highestScore >= 80) {
      return { contact: bestMatch, status: "exact", score: highestScore };
    } else if (highestScore >= 40) {
      return { contact: bestMatch, status: "partial", score: highestScore };
    }

    return { contact: null, status: "none", score: 0 };
  };

  // Auto-detect columns from raw excel json
  const autoDetectAndParse = (data: any[][], hIdx: number, customCols?: {
    dateCol?: number;
    descCol?: number;
    amountCol?: number;
    debitCol?: number;
    creditCol?: number;
    docNoCol?: number;
    typeCol?: number;
  }) => {
    if (!data || data.length === 0) return;

    const headers = (data[hIdx] || []).map((cell: any) => String(cell || "").toLowerCase().trim());

    let dCol = customCols?.dateCol ?? headers.findIndex((h) => h.includes("tarih") || h.includes("date") || h.includes("valör"));
    let dsCol = customCols?.descCol ?? headers.findIndex((h) => h.includes("açıklama") || h.includes("aciklama") || h.includes("detay") || h.includes("cari") || h.includes("tanım"));
    let aCol = customCols?.amountCol ?? headers.findIndex((h) => h === "tutar" || h.includes("işlem tutarı") || h === "amount");
    let debCol = customCols?.debitCol ?? headers.findIndex((h) => h.includes("borç") || h.includes("borc") || h.includes("gider") || h.includes("çıkan") || h.includes("cikan") || h.includes("çekilen"));
    let credCol = customCols?.creditCol ?? headers.findIndex((h) => h.includes("alacak") || h.includes("gelir") || h.includes("giren") || h.includes("yatan"));
    let docCol = customCols?.docNoCol ?? headers.findIndex((h) => h.includes("dekont") || h.includes("evrak") || h.includes("referans") || h.includes("fiş") || h.includes("işlem no"));
    let tCol = customCols?.typeCol ?? headers.findIndex((h) => h.includes("tip") || h.includes("tür") || h.includes("yön"));

    // Fallbacks if not detected
    if (dCol < 0) dCol = 0;
    if (dsCol < 0) dsCol = headers.length > 1 ? 1 : 0;
    if (aCol < 0 && debCol < 0 && credCol < 0) {
      aCol = headers.length > 2 ? 2 : headers.length - 1;
    }

    setDateCol(dCol);
    setDescCol(dsCol);
    setAmountCol(aCol);
    setDebitCol(debCol);
    setCreditCol(credCol);
    setDocNoCol(docCol);
    setTypeCol(tCol);

    // Build parsed row objects
    const rows: ParsedStatementRow[] = [];

    for (let i = hIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const rawDesc = String(row[dsCol] || "").trim();
      const rawDateCell = row[dCol];
      if (!rawDesc && !rawDateCell) continue; // skip blank rows

      const formattedDate = parseFormattedDate(rawDateCell);
      const docNo = docCol >= 0 ? String(row[docCol] || "").trim() : "";

      let type: "income" | "expense" = "income";
      let amount = 0;

      if (debCol >= 0 && credCol >= 0) {
        const debitVal = parseNum(row[debCol]);
        const creditVal = parseNum(row[credCol]);
        if (creditVal > 0) {
          type = "income";
          amount = Math.abs(creditVal);
        } else if (debitVal > 0) {
          type = "expense";
          amount = Math.abs(debitVal);
        }
      } else if (aCol >= 0) {
        const rawVal = row[aCol];
        const val = parseNum(rawVal);
        const strVal = String(rawVal || "").toLowerCase();
        
        if (val < 0 || strVal.includes("borç") || strVal.includes("gider") || strVal.includes("eft") || strVal.includes("çıkış")) {
          type = "expense";
          amount = Math.abs(val);
        } else {
          type = "income";
          amount = Math.abs(val);
        }
      }

      if (amount <= 0) continue; // skip zero amount rows

      // Match Contact
      const matchRes = findBestContactMatch(rawDesc);

      // Check Duplicate with existing transactions
      const isDup = transactions.some(
        (t) =>
          t.accountId === selectedAccountId &&
          t.date === formattedDate &&
          Math.abs(t.amount - amount) < 0.01
      );

      rows.push({
        id: `st-row-${i}-${Date.now()}`,
        date: formattedDate,
        description: rawDesc || "Banka Ekstre Hareketi",
        documentNo: docNo,
        amount,
        type,
        matchedContactId: matchRes.contact?.id || null,
        matchedContactName: matchRes.contact?.name || null,
        matchStatus: matchRes.status,
        matchScore: matchRes.score,
        isDuplicate: isDup,
        selected: !isDup, // Unselect duplicates by default
      });
    }

    setParsedRows(rows);
  };

  // File Upload Handler
  const handleFileUpload = (fileObj: File) => {
    if (!fileObj) return;
    setFile(fileObj);
    setFileName(fileObj.name);
    setIsLoading(true);
    setErrorMsg(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Excel / CSV dosyasında sayfa bulunamadı.");
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (!data || data.length === 0) {
          throw new Error("Yüklenen dosyada okunabilir veri bulunamadı.");
        }

        setRawRows(data);

        // Find Header Row
        let bestHeaderIdx = 0;
        for (let r = 0; r < Math.min(data.length, 15); r++) {
          const rowStr = (data[r] || []).map((c: any) => String(c).toLowerCase()).join(" ");
          if (
            (rowStr.includes("tarih") || rowStr.includes("date")) &&
            (rowStr.includes("açıklama") || rowStr.includes("aciklama") || rowStr.includes("tutar") || rowStr.includes("borç") || rowStr.includes("alacak"))
          ) {
            bestHeaderIdx = r;
            break;
          }
        }

        setHeaderRowIdx(bestHeaderIdx);
        autoDetectAndParse(data, bestHeaderIdx);
      } catch (err: any) {
        console.error("Ekstre okuma hatası:", err);
        setErrorMsg(err.message || "Dosya ayrıştırılırken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg("Dosya okunamadı.");
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(fileObj);
  };

  // Re-run column mapping when changed by user
  const handleApplyCustomMapping = (
    dCol: number,
    dsCol: number,
    aCol: number,
    debCol: number,
    credCol: number,
    docCol: number
  ) => {
    autoDetectAndParse(rawRows, headerRowIdx, {
      dateCol: dCol,
      descCol: dsCol,
      amountCol: aCol,
      debitCol: debCol,
      creditCol: credCol,
      docNoCol: docCol,
    });
  };

  // Row Controls
  const handleToggleRowSelect = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const handleUpdateRowContact = (rowId: string, contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    setParsedRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              matchedContactId: contact ? contact.id : null,
              matchedContactName: contact ? contact.name : null,
              matchStatus: contact ? "exact" : "none",
            }
          : r
      )
    );
  };

  const handleToggleRowType = (rowId: string) => {
    setParsedRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, type: r.type === "income" ? "expense" : "income" }
          : r
      )
    );
  };

  // Sample Template Downloader (Excel .xlsx or CSV)
  const handleDownloadSampleTemplate = (format: "xlsx" | "csv" = "xlsx") => {
    const data = [
      ["Tarih", "Dekont No", "Açıklama", "Borç (Çıkan / Gider)", "Alacak (Giren / Gelir)"],
      ["11.08.2026", "EFT123456", "AHMET YILMAZ HAVALE TAHSİLATI", 0, 15000.00],
      ["10.08.2026", "POS987654", "TEKNO MARKET OFİS MALZEMESİ", 3450.50, 0],
      ["09.08.2026", "VIR001122", "A KARSILIĞI GELEN MÜŞTERİ ÖDEMESİ", 0, 8200.00],
      ["08.08.2026", "EFT889900", "MEHMET ÖZTÜRK DANIŞMANLIK HİZMETİ", 2500.00, 0],
      ["05.08.2026", "DEC334455", "SİGORTA POLİÇE ÖDEMESİ", 1250.00, 0],
    ];

    if (format === "csv") {
      const csvContent = data.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Ornek_Banka_Ekstresi.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      worksheet["!cols"] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 42 },
        { wch: 22 },
        { wch: 22 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Banka Ekstresi");
      XLSX.writeFile(workbook, "Ornek_Banka_Ekstresi.xlsx");
    }
  };

  // Filtering parsed rows
  const filteredRows = useMemo(() => {
    return parsedRows.filter((r) => {
      // Filter by status tab
      if (filterStatus === "matched" && !r.matchedContactId) return false;
      if (filterStatus === "unmatched" && r.matchedContactId) return false;
      if (filterStatus === "duplicate" && !r.isDuplicate) return false;

      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLocaleLowerCase("tr-TR");
        const match =
          r.description.toLocaleLowerCase("tr-TR").includes(q) ||
          (r.matchedContactName && r.matchedContactName.toLocaleLowerCase("tr-TR").includes(q)) ||
          r.documentNo.toLocaleLowerCase("tr-TR").includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [parsedRows, filterStatus, searchQuery]);

  // Selected Row Stats
  const selectedRows = useMemo(() => parsedRows.filter((r) => r.selected), [parsedRows]);
  const totalIncome = useMemo(
    () => selectedRows.filter((r) => r.type === "income").reduce((acc, r) => acc + r.amount, 0),
    [selectedRows]
  );
  const totalExpense = useMemo(
    () => selectedRows.filter((r) => r.type === "expense").reduce((acc, r) => acc + r.amount, 0),
    [selectedRows]
  );
  const matchedCount = useMemo(() => parsedRows.filter((r) => r.matchedContactId).length, [parsedRows]);
  const duplicateCount = useMemo(() => parsedRows.filter((r) => r.isDuplicate).length, [parsedRows]);

  // Perform Final Import
  const handleExecuteImport = () => {
    if (!selectedAccountId) {
      alert("Lütfen ekstrenin yükleneceği banka hesabını seçiniz.");
      return;
    }
    if (selectedRows.length === 0) {
      alert("İçe aktarmak için en az bir hareket seçmelisiniz.");
      return;
    }

    const acc = accounts.find((a) => a.id === selectedAccountId);
    const accName = acc?.name || "Banka Hesabı";

    const newTransactions: Omit<Transaction, "id">[] = selectedRows.map((r) => ({
      accountId: selectedAccountId,
      accountName: accName,
      type: r.type,
      amount: r.amount,
      currency: acc?.currency || "TRY",
      date: r.date,
      description: r.description,
      category: "Banka Ekstresi",
      contactId: r.matchedContactId || undefined,
      contactName: r.matchedContactName || undefined,
      documentNo: r.documentNo || undefined,
      createdAt: new Date().toISOString(),
    }));

    if (onImportTransactions) {
      onImportTransactions(newTransactions);
    } else if (onAddTransaction) {
      newTransactions.forEach((tx) => {
        onAddTransaction({
          ...tx,
          id: `tx-bankimport-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        });
      });
    }

    alert(`🎉 ${selectedRows.length} adet banka ekstresi hareketi başarıyla ${accName} hesabına işlendi.`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <DetailPageLayout
      title="Banka Ekstresi Yükle ve Otomatik Eşleştir"
      subtitle="Excel veya CSV ekstrenizi yükleyin, cari hesaplar ile otomatik eşleştirip doğrudan bakiyelere işleyin"
      breadcrumbs={[
        { label: "Kasa & Banka", onClick: onClose },
        { label: "Banka Ekstresi İçe Aktarım", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-extrabold uppercase">
          AKILLI CARİ EŞLEME
        </span>
      }
      headerIcon={<FileSpreadsheet className="w-5 h-5 text-blue-600" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={selectedRows.length === 0 || !selectedAccountId}
            onClick={handleExecuteImport}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {selectedRows.length > 0
                ? `Seçilen ${selectedRows.length} Hareketi Hesaba Aktar`
                : "Hareketleri Aktar"}
            </span>
          </button>
        </div>
      }
    >
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-5xl mx-auto shadow-sm p-6 space-y-6">
          
          {/* TOP STEP 1: TARGET ACCOUNT & FILE SELECTION BAR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            
            {/* Target Account Selector */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                <span>İçe Aktarılacak Banka Hesabı *</span>
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-extrabold text-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Banka Hesabı Seçiniz --</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName || "Banka"}) - Bakiye: ₺
                    {acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            </div>

            {/* File Dropzone or Selected File */}
            <div className="md:col-span-7 flex flex-col justify-end space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Banka Ekstre Dosyası (.CSV / .XLSX)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadSampleTemplate("xlsx")}
                    className="text-[11px] font-extrabold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Örnek Excel (.xlsx) Şablonu İndir"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Örnek Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSampleTemplate("csv")}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    title="Örnek CSV Şablonu İndir"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>.CSV</span>
                  </button>
                </div>
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/80 scale-[1.01]"
                    : fileName
                    ? "border-emerald-400 bg-emerald-50/50"
                    : "border-slate-300 hover:border-blue-400 bg-white"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      fileName ? "bg-emerald-500 text-white" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    {fileName ? (
                      <p className="text-xs font-extrabold text-slate-900 truncate">{fileName}</p>
                    ) : (
                      <p className="text-xs font-bold text-slate-600 truncate">
                        Sürükleyip bırakın veya <span className="text-blue-600 underline">dosya seçin</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {fileName ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setFileName("");
                        setParsedRows([]);
                        setRawRows([]);
                      }}
                      className="text-xs font-bold text-rose-600 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors"
                    >
                      Değiştir
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      CSV / Excel
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LOADING STATE */}
          {isLoading && (
            <div className="py-12 text-center space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-extrabold text-blue-900">
                Ekstre ayrıştırılıyor ve cariler ile eşleştiriliyor...
              </p>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PARSED ROWS VIEW */}
          {!isLoading && parsedRows.length > 0 && (
            <div className="space-y-4">
              
              {/* STATS & QUICK FILTER BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-inner">
                
                {/* Stats items */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase font-bold block">Toplam Hareket</span>
                    <span className="text-base font-black font-mono text-white">{parsedRows.length} Adet</span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-emerald-300 uppercase font-bold block">Cari Eşleşen 🎯</span>
                    <span className="text-base font-black font-mono text-emerald-400">{matchedCount} Adet</span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-sky-300 uppercase font-bold block">Seçilen Gelir (+)</span>
                    <span className="text-base font-black font-mono text-sky-300">
                      ₺{totalIncome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-rose-300 uppercase font-bold block">Seçilen Gider (-)</span>
                    <span className="text-base font-black font-mono text-rose-300">
                      ₺{totalExpense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Column Mapping Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMappingExpanded(!isMappingExpanded)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-300" />
                  <span>Sütun Ayarları</span>
                </button>
              </div>

              {/* COLUMN MAPPING PANEL (COLLAPSIBLE) */}
              {isMappingExpanded && rawRows.length > 0 && (
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-3 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                    <h4 className="font-extrabold text-indigo-950 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-700" />
                      <span>Sütun Eşleştirme Yapılandırması</span>
                    </h4>
                    <span className="text-[11px] text-indigo-700 font-bold">
                      Başlık Satırı Index: {headerRowIdx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tarih Sütunu</label>
                      <select
                        value={dateCol}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setDateCol(val);
                          handleApplyCustomMapping(val, descCol, amountCol, debitCol, creditCol, docNoCol);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900"
                      >
                        {(rawRows[headerRowIdx] || []).map((h: any, idx: number) => (
                          <option key={idx} value={idx}>
                            Sütun {idx + 1}: {String(h || "Boş").substring(0, 15)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Açıklama Sütunu</label>
                      <select
                        value={descCol}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setDescCol(val);
                          handleApplyCustomMapping(dateCol, val, amountCol, debitCol, creditCol, docNoCol);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900"
                      >
                        {(rawRows[headerRowIdx] || []).map((h: any, idx: number) => (
                          <option key={idx} value={idx}>
                            Sütun {idx + 1}: {String(h || "Boş").substring(0, 15)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tek Tutar Sütunu</label>
                      <select
                        value={amountCol}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setAmountCol(val);
                          handleApplyCustomMapping(dateCol, descCol, val, debitCol, creditCol, docNoCol);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900"
                      >
                        <option value={-1}>-- Kullanma --</option>
                        {(rawRows[headerRowIdx] || []).map((h: any, idx: number) => (
                          <option key={idx} value={idx}>
                            Sütun {idx + 1}: {String(h || "Boş").substring(0, 15)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Borç (Gider) Sütunu</label>
                      <select
                        value={debitCol}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setDebitCol(val);
                          handleApplyCustomMapping(dateCol, descCol, amountCol, val, creditCol, docNoCol);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900"
                      >
                        <option value={-1}>-- Kullanma --</option>
                        {(rawRows[headerRowIdx] || []).map((h: any, idx: number) => (
                          <option key={idx} value={idx}>
                            Sütun {idx + 1}: {String(h || "Boş").substring(0, 15)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alacak (Gelir) Sütunu</label>
                      <select
                        value={creditCol}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCreditCol(val);
                          handleApplyCustomMapping(dateCol, descCol, amountCol, debitCol, val, docNoCol);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900"
                      >
                        <option value={-1}>-- Kullanma --</option>
                        {(rawRows[headerRowIdx] || []).map((h: any, idx: number) => (
                          <option key={idx} value={idx}>
                            Sütun {idx + 1}: {String(h || "Boş").substring(0, 15)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Dekont / Evrak No</label>
                      <select
                        value={docNoCol}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setDocNoCol(val);
                          handleApplyCustomMapping(dateCol, descCol, amountCol, debitCol, creditCol, val);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900"
                      >
                        <option value={-1}>-- Yok --</option>
                        {(rawRows[headerRowIdx] || []).map((h: any, idx: number) => (
                          <option key={idx} value={idx}>
                            Sütun {idx + 1}: {String(h || "Boş").substring(0, 15)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTROLS & FILTER TABS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3 text-xs">
                
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFilterStatus("all")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      filterStatus === "all"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tümü ({parsedRows.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus("matched")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      filterStatus === "matched"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <span>Cari Eşleşen 🎯</span>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                      {matchedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus("unmatched")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      filterStatus === "unmatched"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "text-amber-800 hover:bg-amber-50"
                    }`}
                  >
                    Serbest İşlem ({parsedRows.length - matchedCount})
                  </button>

                  {duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus("duplicate")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        filterStatus === "duplicate"
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <span>Tekrar Kayıt ⚠️</span>
                      <span className="bg-rose-100 text-rose-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {duplicateCount}
                      </span>
                    </button>
                  )}
                </div>

                {/* Search Input & Select All */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Açıklama / Cari Ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="text-xs font-bold text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLE OF PARSED MOVEMENTS */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={parsedRows.length > 0 && parsedRows.every((r) => r.selected)}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3 w-28">Tarih</th>
                        <th className="py-2.5 px-4">Ekstre Açıklaması / Dekont No</th>
                        <th className="py-2.5 px-3 w-36 text-right">Tutar & Yön</th>
                        <th className="py-2.5 px-3 w-64">Eşleşen Cari Hesap</th>
                        <th className="py-2.5 px-3 w-32 text-center">Eşleşme Durumu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                            Filtrenize uygun hareket bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors hover:bg-slate-50/80 ${
                              row.selected ? "bg-blue-50/30" : "opacity-75 bg-slate-50/20"
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() => handleToggleRowSelect(row.id)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {row.date}
                            </td>

                            {/* Description & DocNo */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 line-clamp-2">{row.description}</div>
                              {row.documentNo && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Dekont No: <span className="font-bold text-slate-700">{row.documentNo}</span>
                                </div>
                              )}
                              {row.isDuplicate && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded mt-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>⚠️ Zaten Kayıtlı Olabilir</span>
                                </span>
                              )}
                            </td>

                            {/* Amount & Direction Toggle */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span
                                  className={`font-mono font-black text-sm ${
                                    row.type === "income" ? "text-emerald-700" : "text-rose-700"
                                  }`}
                                >
                                  {row.type === "income" ? "+" : "-"}₺
                                  {row.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRowType(row.id)}
                                  className={`p-1 rounded-md text-[10px] font-extrabold border transition-colors cursor-pointer shrink-0 ${
                                    row.type === "income"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                                  }`}
                                  title="Giriş / Çıkış Yönünü Değiştir"
                                >
                                  {row.type === "income" ? "Gelir" : "Gider"}
                                </button>
                              </div>
                            </td>

                            {/* Contact Match Dropdown */}
                            <td className="py-3 px-3">
                              <select
                                value={row.matchedContactId || ""}
                                onChange={(e) => handleUpdateRowContact(row.id, e.target.value)}
                                className={`w-full text-xs font-bold rounded-xl p-2 border transition-all cursor-pointer ${
                                  row.matchedContactId
                                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-extrabold"
                                    : "bg-slate-50 border-slate-300 text-slate-700"
                                }`}
                              >
                                <option value="">-- Cari Seçilmedi (Serbest İşlem) --</option>
                                {contacts.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.type === "customer" ? "Müşteri" : "Tedarikçi"})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Match Status Badge */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {row.matchedContactId ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-full shadow-2xs">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Eşleşti 🎯</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                                  <span>Serbest Kayıt</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* EMPTY STATE BEFORE UPLOAD */}
          {!isLoading && parsedRows.length === 0 && (
            <div className="py-10 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
                <FileUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Banka Ekstre Dosyanızı Yükleyin
                </h4>
                <p className="text-xs text-slate-500">
                  Türkiye'deki tüm bankaların (Garanti, İş Bankası, Akbank, Yapı Kredi, Ziraat vb.) CSV veya Excel formatındaki ekstre dosyalarını doğrudan içe aktarabilirsiniz.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Ekstre Dosyası Seç (.CSV / .XLSX)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-bold">
            {selectedRows.length > 0 ? (
              <span className="text-blue-900">
                Seçilen: <strong>{selectedRows.length} Adet Hareket</strong> (Net Bakiye Etkisi:{" "}
                <span className={totalIncome - totalExpense >= 0 ? "text-emerald-700 font-black" : "text-rose-700 font-black"}>
                  ₺{(totalIncome - totalExpense).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
                )
              </span>
            ) : (
              <span>Lütfen yüklenecek banka hesabını ve hareketleri seçiniz.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              İptal
            </button>

            <button
              type="button"
              disabled={selectedRows.length === 0 || !selectedAccountId}
              onClick={handleExecuteImport}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {selectedRows.length > 0
                  ? `Seçilen ${selectedRows.length} Hareketi Hesaba Aktar`
                  : "Hareketleri Aktar"}
              </span>
            </button>
          </div>
        </div>
    </DetailPageLayout>
  );
};
