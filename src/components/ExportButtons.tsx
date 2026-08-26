import React, { useState } from "react";
import { FileSpreadsheet, FileText, Mail } from "lucide-react";
import { exportToExcel, exportToPDF, generatePDFFromExportData, ExportData } from "../utils/exportUtils";
import { EmailExportModal } from "./EmailExportModal";
import { Contact } from "../types";

interface ExportButtonsProps {
  getExportData: () => ExportData;
  size?: "sm" | "md";
  className?: string;
  variant?: "default" | "compact";
  recipientEmail?: string;
  recipientName?: string;
  defaultSubject?: string;
  contacts?: Contact[];
  hideEmail?: boolean;
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
  companyName = "",
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleExcel = () => {
    try {
      const data = getExportData();
      exportToExcel(data);
    } catch (err) {
      console.error("Excel dışa aktarma hatası:", err);
      alert("Excel dosyası oluşturulurken bir hata oluştu.");
    }
  };

  const handlePDF = async () => {
    setIsExportingPDF(true);
    try {
      const data = getExportData();
      await exportToPDF(data);
    } catch (err) {
      console.error("PDF dışa aktarma hatası:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleOpenEmail = () => {
    setIsEmailModalOpen(true);
  };

  const handleGetPdfBlobForEmail = async () => {
    try {
      const data = getExportData();
      return await generatePDFFromExportData(data);
    } catch (err) {
      console.error("PDF blob oluşturma hatası:", err);
      return null;
    }
  };

  const py = size === "sm" ? "py-1.5 px-3" : "py-2 px-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  // Compute active export data summary for the modal
  const activeExportData = isEmailModalOpen ? getExportData() : null;

  if (variant === "compact") {
    return (
      <>
        <div className={`flex items-center gap-1.5 ${className}`}>
          <button
            type="button"
            onClick={handleExcel}
            title="Excel (.xlsx) İndir"
            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePDF}
            disabled={isExportingPDF}
            title="PDF İndir"
            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">{isExportingPDF ? "..." : "PDF"}</span>
          </button>

          {!hideEmail && (
            <button
              type="button"
              onClick={handleOpenEmail}
              title="E-Posta ile Gönder"
              className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">E-Posta</span>
            </button>
          )}
        </div>

        {isEmailModalOpen && activeExportData && (
          <EmailExportModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            title={activeExportData.title}
            filename={activeExportData.filename}
            defaultEmail={recipientEmail}
            defaultRecipientName={recipientName}
            defaultSubject={defaultSubject || `${activeExportData.title} (${activeExportData.subtitle || new Date().toLocaleDateString("tr-TR")})`}
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
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleExcel}
          title="Excel (.xlsx) olarak indir - Türkçe karakter destekli"
          className={`inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 ${py} rounded-xl font-bold ${textSize} transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Excel'e Aktar</span>
        </button>

        <button
          type="button"
          onClick={handlePDF}
          disabled={isExportingPDF}
          title="PDF olarak indir - Türkçe karakter destekli"
          className={`inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 ${py} rounded-xl font-bold ${textSize} transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-wait`}
        >
          <FileText className="w-4 h-4 text-rose-600" />
          <span>{isExportingPDF ? "PDF Hazırlanıyor..." : "PDF'e Aktar"}</span>
        </button>

        {!hideEmail && (
          <button
            type="button"
            onClick={handleOpenEmail}
            title="PDF Belgesini Kayıtlı E-Posta Adresine Gönder"
            className={`inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 ${py} rounded-xl font-bold ${textSize} transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95`}
          >
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>E-Posta ile Gönder</span>
          </button>
        )}
      </div>

      {isEmailModalOpen && activeExportData && (
        <EmailExportModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          title={activeExportData.title}
          filename={activeExportData.filename}
          defaultEmail={recipientEmail}
          defaultRecipientName={recipientName}
          defaultSubject={defaultSubject || `${activeExportData.title} (${activeExportData.subtitle || new Date().toLocaleDateString("tr-TR")})`}
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

