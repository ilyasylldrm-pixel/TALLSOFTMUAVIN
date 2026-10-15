import React, { useState } from "react";
import { Mail, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  generatePDFFromExportData,
  ExportData,
  exportToExcel,
  exportToPDF,
} from "../utils/exportUtils";
import { EmailExportModal } from "./EmailExportModal";
import { Contact } from "../types";

export interface ExportButtonsProps {
  getExportData?: () => ExportData;
  size?: "sm" | "md";
  className?: string;
  variant?: "default" | "compact";
  recipientEmail?: string;
  recipientName?: string;
  defaultSubject?: string;
  contacts?: Contact[];
  hideEmail?: boolean;
  hideExcel?: boolean;
  hidePdf?: boolean;
  excelLabel?: string;
  pdfLabel?: string;
  emailLabel?: string;
  companyName?: string;
  onExcelClick?: () => void;
  onPdfClick?: () => void;
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
  hideExcel = false,
  hidePdf = false,
  excelLabel = "Excel İndir",
  pdfLabel = "PDF İndir",
  emailLabel = "E-Posta",
  companyName = "",
  onExcelClick,
  onPdfClick,
}) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const handleOpenEmail = () => {
    setIsEmailModalOpen(true);
  };

  const handleExcelExport = () => {
    if (onExcelClick) {
      onExcelClick();
      return;
    }
    if (!getExportData) return;
    try {
      const data = getExportData();
      exportToExcel(data);
    } catch (err) {
      console.error("Excel dışa aktarma hatası:", err);
    }
  };

  const handlePdfExport = async () => {
    if (onPdfClick) {
      onPdfClick();
      return;
    }
    if (!getExportData) return;
    try {
      setIsPdfGenerating(true);
      const data = getExportData();
      await exportToPDF(data);
    } catch (err) {
      console.error("PDF dışa aktarma hatası:", err);
    } finally {
      setIsPdfGenerating(false);
    }
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

  if (!getExportData && !onExcelClick && !onPdfClick) {
    return null;
  }

  const py = size === "sm" ? "py-1.5 px-3" : "py-2 px-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  // Compute active export data summary for the modal
  const activeExportData = isEmailModalOpen && getExportData ? getExportData() : null;

  return (
    <>
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {/* Excel İndir Button */}
        {!hideExcel && (
          <button
            type="button"
            onClick={handleExcelExport}
            title="Excel (.xlsx) olarak indir"
            className={`inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 ${
              variant === "compact"
                ? "p-1.5 rounded-lg text-xs"
                : `${py} rounded-xl ${textSize}`
            } font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className={variant === "compact" ? "hidden sm:inline" : ""}>
              {excelLabel}
            </span>
          </button>
        )}

        {/* PDF İndir Button */}
        {!hidePdf && (
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={isPdfGenerating}
            title="Aynı formatta PDF (.pdf) olarak indir"
            className={`inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 ${
              variant === "compact"
                ? "p-1.5 rounded-lg text-xs"
                : `${py} rounded-xl ${textSize}`
            } font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 disabled:opacity-60`}
          >
            {isPdfGenerating ? (
              <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span className={variant === "compact" ? "hidden sm:inline" : ""}>
              {isPdfGenerating ? "PDF..." : pdfLabel}
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
              variant === "compact"
                ? "p-1.5 rounded-lg text-xs"
                : `${py} rounded-xl ${textSize}`
            } font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className={variant === "compact" ? "hidden sm:inline" : ""}>
              {emailLabel}
            </span>
          </button>
        )}
      </div>

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
            `${activeExportData.title} (${
              activeExportData.subtitle || new Date().toLocaleDateString("tr-TR")
            })`
          }
          getPdfBlob={handleGetPdfBlobForEmail}
          contacts={contacts}
          companyName={companyName}
          documentSummary={[
            { label: "Rapor Başlığı", value: activeExportData.title },
            {
              label: "Toplam Kayıt",
              value: `${activeExportData.rows.length} Adet`,
            },
          ]}
        />
      )}
    </>
  );
};
