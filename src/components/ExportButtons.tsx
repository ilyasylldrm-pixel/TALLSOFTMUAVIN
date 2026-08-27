import React, { useState } from "react";
import { Mail } from "lucide-react";
import { generatePDFFromExportData, ExportData } from "../utils/exportUtils";
import { EmailExportModal } from "./EmailExportModal";
import { Contact } from "../types";

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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

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

  if (hideEmail || !getExportData) {
    return null;
  }

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
            onClick={handleOpenEmail}
            title="E-Posta ile Gönder"
            className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">E-Posta</span>
          </button>
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
          onClick={handleOpenEmail}
          title="Belgeyi Kayıtlı E-Posta Adresine Gönder"
          className={`inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 ${py} rounded-xl font-bold ${textSize} transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95`}
        >
          <Mail className="w-4 h-4 text-indigo-600" />
          <span>E-Posta ile Gönder</span>
        </button>
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

