import React, { useState } from "react";
import { Mail, FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { generatePDFFromExportData, ExportData } from "../utils/exportUtils";
import { EmailExportModal } from "./EmailExportModal";
import { Contact } from "../types";
import { exportToGoogleSheets, ExportResult } from "../services/googleSheetsService";

interface ExportButtonsProps {
  getExportData?: () => ExportData;
  size?: "sm" | "md";
  className?: string;
  variant?: "default" | "compact";
  recipientEmail?: string;
  recipientName?: string;
  defaultSubject?: string;
  contacts?: Contact[];
  hideEmail?: boolean;
  hideGoogleSheets?: boolean;
  companyName?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  getExportData,
  size = "sm",
  className = "",
  variant = "default",
  recipientEmail = "",
  recipientName = "",
  defaultSubject = "",
  contacts = [],
  hideEmail = false,
  hideGoogleSheets = false,
  companyName = "",
}) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [sheetsResult, setSheetsResult] = useState<ExportResult | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // User Confirmation Dialog before triggering Google Workspace creation
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleOpenEmail = () => {
    setIsEmailModalOpen(true);
  };

  const handleGetPdfBlobForEmail = async () => {
    if (!getExportData) return null;
    try {
      const data = getExportData();
      return await generatePDFFromExportData(data);
    } catch (err) {
      console.error("PDF blob oluşturma hatası:", err);
      return null;
    }
  };

  const triggerGoogleSheetsExport = async () => {
    if (!getExportData) return;
    setIsConfirmOpen(false);
    setIsExportingSheets(true);
    setSheetsError(null);
    setSheetsResult(null);

    try {
      const data = getExportData();
      const result = await exportToGoogleSheets({
        title: `${data.title} (${new Date().toLocaleDateString("tr-TR")})`,
        sheetName: data.title.substring(0, 30),
        headers: data.headers,
        rows: data.rows,
      });
      setSheetsResult(result);
    } catch (err: any) {
      console.error("Google Sheets aktarım hatası:", err);
      setSheetsError(err?.message || "Google E-Tablo aktarımı başarısız oldu.");
    } finally {
      setIsExportingSheets(false);
    }
  };

  if (!getExportData) {
    return null;
  }

  const py = size === "sm" ? "py-1.5 px-3" : "py-2 px-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  // Compute active export data summary for the modal
  const activeExportData = isEmailModalOpen ? getExportData() : null;

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Google Sheets Export Button */}
        {!hideGoogleSheets && (
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isExportingSheets}
            title="Google E-Tablolara (Drive) Aktar"
            className={`inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 ${
              variant === "compact" ? "p-1.5 rounded-lg text-xs" : `${py} rounded-xl ${textSize}`
            } font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50`}
          >
            {isExportingSheets ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className={variant === "compact" ? "hidden sm:inline" : ""}>
              {isExportingSheets ? "Aktarılıyor..." : "Google Sheets"}
            </span>
          </button>
        )}

        {/* E-Mail Button */}
        {!hideEmail && (
          <button
            type="button"
            onClick={handleOpenEmail}
            title="E-Posta ile Gönder"
            className={`inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 ${
              variant === "compact" ? "p-1.5 rounded-lg text-xs" : `${py} rounded-xl ${textSize}`
            } font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span className={variant === "compact" ? "hidden sm:inline" : ""}>E-Posta</span>
          </button>
        )}
      </div>

      {/* Confirmation Dialog before Google Sheets creation (Required by Workspace guidelines) */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Google E-Tablosu Oluşturulsun mu?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bu listedeki veriler biçimlendirilmiş başlık satırı ve dondurulmuş panellerle Google Drive hesabınızda yeni
              bir Google E-Tablo olarak kaydedilecektir.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={triggerGoogleSheetsExport}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Oluştur ve Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Notification / Modal for Google Sheets Export */}
      {sheetsResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Google E-Tablosu Hazır!
                </h3>
                <span className="text-2xs text-slate-400">{sheetsResult.rowCount} satır aktarıldı</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>"{sheetsResult.title}"</strong> başlıklı e-tablonuz Google Drive hesabınızda başarıyla oluşturuldu.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSheetsResult(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
              <a
                href={sheetsResult.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setSheetsResult(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Google Sheets'te Aç</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sheets Error Notification */}
      {sheetsError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Google E-Tablo Aktarım Hatası
              </h3>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              {sheetsError}
            </p>
            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSheetsError(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Export Modal */}
      {isEmailModalOpen && activeExportData && (
        <EmailExportModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          title={activeExportData.title}
          filename={activeExportData.filename}
          defaultEmail={recipientEmail}
          defaultRecipientName={recipientName}
          defaultSubject={
            defaultSubject ||
            `${activeExportData.title} (${activeExportData.subtitle || new Date().toLocaleDateString("tr-TR")})`
          }
          getPdfBlob={handleGetPdfBlobForEmail}
          contacts={contacts}
          companyName={companyName}
          documentSummary={[
            { label: "Rapor Başlığı", value: activeExportData.title },
            { label: "Toplam Kayıt", value: `${activeExportData.rows.length} Adet` },
          ]}
        />
      )}
    </>
  );
};
