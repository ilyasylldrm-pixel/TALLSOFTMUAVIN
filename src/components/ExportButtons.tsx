import React, { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF, ExportData } from "../utils/exportUtils";

interface ExportButtonsProps {
  getExportData: () => ExportData;
  size?: "sm" | "md";
  className?: string;
  variant?: "default" | "compact";
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  getExportData,
  size = "sm",
  className = "",
  variant = "default",
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

  const py = size === "sm" ? "py-1.5 px-3" : "py-2 px-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (variant === "compact") {
    return (
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
      </div>
    );
  }

  return (
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
    </div>
  );
};
