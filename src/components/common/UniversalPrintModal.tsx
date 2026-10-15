import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Download,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  subscribePrintModal,
  closePrintModal,
  printViaIsolatedIframe,
  PrintModalData,
} from "../../utils/printEngine";
import { exportElementToPDFWithPrintStyling } from "../../utils/pdfService";

export const UniversalPrintModal: React.FC = () => {
  const [modalData, setModalData] = useState<PrintModalData | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentOrientation, setCurrentOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribePrintModal((data) => {
      setModalData(data);
      if (data) {
        setCurrentOrientation(data.orientation || "portrait");
        setZoomLevel(100);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!modalData || !modalData.isOpen) return null;

  const handleClose = () => {
    closePrintModal();
  };

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    try {
      if (previewContainerRef.current) {
        await printViaIsolatedIframe(
          previewContainerRef.current,
          modalData.title || "Belge_Yazdir",
          currentOrientation
        );
      } else {
        window.print();
      }
    } catch (err) {
      console.warn("Direct print attempt failed:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const fileName = `${(modalData.title || "Belge").trim().replace(/[\s/\\:]+/g, "_")}.pdf`;
      const targetId = modalData.sourceElementId || "universal-print-preview-paper";

      // If source element still exists in DOM, use it; otherwise use the preview element
      const elToExport = document.getElementById(targetId) ? targetId : "universal-print-preview-paper";

      const res = await exportElementToPDFWithPrintStyling(elToExport, fileName, {
        orientation: currentOrientation === "landscape" ? "l" : "p",
        margin: currentOrientation === "landscape" ? 6 : 8,
        scale: 1.6,
        fitToSinglePage: true,
      });

      if (res) {
        res.pdf.save(res.fileName);
      }
    } catch (err) {
      console.error("Universal Print PDF export error:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      {/* 1. Top Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
              {modalData.title || "Belge Yazdırma & Önizleme"}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>Evrensel Yazdırma Motoru</span>
              <span>•</span>
              <span className="font-semibold text-purple-300 uppercase">
                {currentOrientation === "landscape" ? "A4 Yan (Yatay)" : "A4 Dikey"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Orientation Toggle */}
          <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
            <button
              type="button"
              onClick={() => setCurrentOrientation("portrait")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentOrientation === "portrait"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="A4 Dikey Sayfa Yönü"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dikey</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentOrientation("landscape")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentOrientation === "landscape"
                  ? "bg-amber-500 text-purple-950 shadow-xs font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="A4 Yan / Yatay Sayfa Yönü (Geniş Çizelgeler & Bordro)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">A4 Yan</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden md:flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 text-xs text-slate-300">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1.5 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              title="Uzaklaştır"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold min-w-[42px] text-center">
              %{zoomLevel}
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              title="Yakınlaştır"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Yazdırılabilir yüksek çözünürlüklü PDF indir"
          >
            <Download className="w-3.5 h-3.5 text-purple-200" />
            <span className="hidden sm:inline">
              {isExportingPDF ? "PDF Hazırlanıyor..." : "PDF İndir"}
            </span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Main Print Button */}
          <button
            type="button"
            onClick={handleDirectPrint}
            disabled={isPrinting}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Belgeyi yazıcıya gönder"
          >
            <Printer className="w-4 h-4" />
            <span>{isPrinting ? "Yazdırılıyor..." : "Yazdır"}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Kapat (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Helpful Info Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-[11px] text-slate-400 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Belgeniz hazırlandı. Doğrudan <strong>"Yazdır"</strong> butonuna basabilir veya yedek olarak <strong>"PDF İndir"</strong> ile kaydedebilirsiniz.
          </span>
        </div>
        <div className="text-[10px] text-slate-500 hidden sm:block">
          Standart A4 ({currentOrientation === "landscape" ? "297mm × 210mm" : "210mm × 297mm"})
        </div>
      </div>

      {/* 3. Document Preview Sheet Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 custom-scrollbar flex items-start justify-center">
        <div
          id="universal-print-preview-paper"
          ref={previewContainerRef}
          style={{
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className={`bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 transition-all ${
            currentOrientation === "landscape"
              ? "w-full max-w-5xl min-h-[600px] landscape-mode"
              : "w-full max-w-3xl min-h-[850px]"
          }`}
          dangerouslySetInnerHTML={{ __html: modalData.elementHtml }}
        />
      </div>
    </div>
  );
};
