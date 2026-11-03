import React, { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { MysoftEDocument } from "../../types";

export interface PreviewModalProps {
  isOpen: boolean;
  document: MysoftEDocument | null;
  documentNumber: string;
  partyName: string;
  taxNumber: string;
  issueDate: string;
  documentType: string;
  totalAmountFormatted: string;
  statusLabel: string;
  statusClassName: string;
  ettn: string;
  basicHtmlContent: string;
  htmlContent?: string | null;
  pdfUrl?: string | null;
  isLoading?: boolean;
  isDownloadingPdf?: boolean;
  isDownloadingXml?: boolean;
  onClose: () => void;
  onDownloadPdf: (document: MysoftEDocument) => void;
  onDownloadXml: (document: MysoftEDocument) => void;
  onOpenInNewTab: (document: MysoftEDocument) => void;
  onOpenFullDetails: (document: MysoftEDocument) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  document,
  documentNumber,
  partyName,
  taxNumber,
  issueDate,
  documentType,
  totalAmountFormatted,
  statusLabel,
  statusClassName,
  ettn,
  basicHtmlContent,
  htmlContent,
  pdfUrl,
  isLoading = false,
  isDownloadingPdf = false,
  isDownloadingXml = false,
  onClose,
  onDownloadPdf,
  onDownloadXml,
  onOpenInNewTab,
  onOpenFullDetails,
}) => {
  const [viewMode, setViewMode] = useState<"auto" | "basic" | "pdf">("auto");

  useEffect(() => {
    if (isOpen) {
      setViewMode("auto");
    }
  }, [isOpen, documentNumber]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const showPdfFrame =
    Boolean(pdfUrl) && (viewMode === "pdf" || (viewMode === "auto" && !htmlContent));
  const activeHtmlDoc =
    viewMode === "basic"
      ? basicHtmlContent
      : htmlContent || basicHtmlContent;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#eaedff] text-[#0f6bae] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="preview-modal-title"
                  className="text-sm font-bold text-slate-900 font-mono truncate"
                >
                  {documentNumber}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${statusClassName}`}
                >
                  {statusLabel}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {documentType} • {issueDate}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                <span className="font-semibold text-slate-800">{partyName}</span>
                {taxNumber && taxNumber !== "-" ? (
                  <span className="font-mono text-slate-500"> • VKN/TCKN: {taxNumber}</span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-right pr-2 border-r border-slate-200 hidden sm:block">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                Ödenecek Tutar
              </span>
              <span className="font-mono text-sm font-bold text-[#0f6bae] tabular-nums">
                {totalAmountFormatted}
              </span>
            </div>

            {/* View mode selector */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("auto")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewMode === "auto"
                    ? "bg-[#eaedff] text-[#0f6bae]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Belge Önizleme
              </button>
              <button
                type="button"
                onClick={() => setViewMode("basic")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewMode === "basic"
                    ? "bg-[#eaedff] text-[#0f6bae]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Temel Tablo
              </button>
              {pdfUrl && (
                <button
                  type="button"
                  onClick={() => setViewMode("pdf")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    viewMode === "pdf"
                      ? "bg-[#eaedff] text-[#0f6bae]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  PDF
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Önizlemeyi kapat"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status / Loading sub-banner when enriching from Mysoft */}
        {isLoading && (
          <div className="px-5 py-2 bg-sky-50 border-b border-sky-200/80 text-sky-800 text-xs font-medium flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f6bae]" />
              Mysoft belge içeriği ve kalem detayları senkronize ediliyor...
            </span>
            <span className="text-[11px] text-sky-600">Temel fatura görünümü aktif</span>
          </div>
        )}

        {/* Modal Body: Iframe Document Preview */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          {showPdfFrame && pdfUrl ? (
            <iframe
              title={`Fatura PDF Önizleme - ${documentNumber}`}
              src={pdfUrl}
              className="w-full h-full border-0 bg-slate-100"
            />
          ) : (
            <iframe
              title={`Fatura İçerik Önizleme - ${documentNumber}`}
              srcDoc={activeHtmlDoc}
              sandbox="allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullDetails(document);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#0f6bae]" />
              <span>Tam Detay Görünümü</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenInNewTab(document)}
              disabled={isDownloadingPdf}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Yeni Sekmede Aç</span>
            </button>

            <button
              type="button"
              onClick={() => onDownloadXml(document)}
              disabled={isDownloadingXml}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDownloadingXml ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>XML İndir</span>
            </button>

            <span className="hidden lg:inline-block text-[11px] text-slate-400 font-mono pl-2">
              ETTN: {ettn}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Kapat
            </button>

            <button
              type="button"
              onClick={() => onDownloadPdf(document)}
              disabled={isDownloadingPdf}
              className="px-4 py-2 rounded-xl bg-[#0f6bae] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>PDF İndir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
