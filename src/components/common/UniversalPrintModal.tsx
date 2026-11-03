import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  Layers,
  FileText,
  Sparkles,
  QrCode,
  Upload,
  Building2,
  Stamp,
  Save,
  Check,
} from "lucide-react";
import {
  subscribePrintModal,
  closePrintModal,
  printViaIsolatedIframe,
  PrintModalData,
} from "../../utils/printEngine";
import { exportElementToPDFWithPrintStyling } from "../../utils/pdfService";
import { InvoiceColorTheme, InvoiceDesignSettings, InvoiceTemplateStyle } from "../../types";
import { readAndOptimizeLogoFile } from "../../utils/logoUpload";
import { saveCloudLogo } from "../../services/cloudBrandingService";
import { getActiveCompanyId, getCompaniesList, updateCompanyItem } from "../../utils/storage";
import {
  OfficialGIBInvoicePaper,
  INVOICE_COLOR_THEMES,
  resolveInvoiceDesignSettings,
  resolveOfficialEDocumentKind,
  getIndependentInvoiceCssConfig,
  saveCompanyInvoiceCssToFirestore,
} from "../OfficialGIBInvoicePaper";

export const UniversalPrintModal: React.FC = () => {
  const [modalData, setModalData] = useState<PrintModalData | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentOrientation, setCurrentOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Invoice Design Customization States
  const [previewDocType, setPreviewDocType] = useState<"auto" | "e_fatura" | "e_arsiv">("auto");
  const [design, setDesign] = useState<InvoiceDesignSettings>(() =>
    resolveInvoiceDesignSettings(undefined)
  );
  const [customLogoOverride, setCustomLogoOverride] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribePrintModal((data) => {
      setModalData(data);
      if (data) {
        setCurrentOrientation(data.orientation || "portrait");
        setZoomLevel(100);
        setCustomLogoOverride(null);
        setPreviewDocType("auto");
        setDesign(resolveInvoiceDesignSettings(data.invoiceData?.companySettings));
      }
    });
    return () => unsubscribe();
  }, []);

  const isInvoiceMode = Boolean(
    modalData?.isOpen &&
      modalData?.documentType === "invoice" &&
      modalData?.invoiceData?.invoice
  );

  if (!modalData || !modalData.isOpen) return null;

  const handleClose = () => {
    closePrintModal();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimizedDataUrl = await readAndOptimizeLogoFile(file);
      setCustomLogoOverride(optimizedDataUrl);
      setDesign((prev) => ({ ...prev, showCompanyLogo: true }));
      if (modalData.invoiceData?.companySettings) {
        const updatedSettings = {
          ...modalData.invoiceData.companySettings,
          logoUrl: optimizedDataUrl,
          invoiceDesign: { ...design, showCompanyLogo: true },
        };
        modalData.invoiceData.onSaveCompanySettings?.(updatedSettings);
        void saveCloudLogo(
          optimizedDataUrl,
          {
            brandName: updatedSettings.companyName || "E-MUAVİN",
            description: "Fatura PDF şablonu üzerinden güncellenen şirket logosu",
          },
          getActiveCompanyId()
        );
      }
    } catch (err) {
      console.error("Logo yükleme hatası:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleSaveDesignToCompany = async () => {
    const baseSettings = modalData.invoiceData?.companySettings;
    const currentCss = getIndependentInvoiceCssConfig(baseSettings);
    const mergedDesign: InvoiceDesignSettings = {
      ...design,
      cssConfig: currentCss,
    };
    if (baseSettings) {
      const updatedSettings = {
        ...baseSettings,
        ...(customLogoOverride ? { logoUrl: customLogoOverride } : {}),
        invoiceDesign: mergedDesign,
      };
      modalData.invoiceData?.onSaveCompanySettings?.(updatedSettings);
    }
    await saveCompanyInvoiceCssToFirestore(baseSettings, currentCss, mergedDesign);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
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
      const elToExport = isInvoiceMode
        ? "universal-print-preview-paper"
        : modalData.sourceElementId && document.getElementById(modalData.sourceElementId)
        ? modalData.sourceElementId
        : "universal-print-preview-paper";

      const res = await exportElementToPDFWithPrintStyling(elToExport, fileName, {
        orientation: currentOrientation === "landscape" ? "l" : "p",
        margin: currentOrientation === "landscape" ? 6 : 8,
        scale: 1.8,
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

  const activeDocMeta =
    isInvoiceMode && modalData.invoiceData
      ? resolveOfficialEDocumentKind(
          modalData.invoiceData.invoice,
          modalData.invoiceData.companySettings,
          modalData.invoiceData.contact,
          previewDocType
        )
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />

      {/* 1. Top Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-300 shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
              {modalData.title || "Belge Yazdırma & PDF Önizleme"}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>
                {isInvoiceMode
                  ? `Resmi GİB ${activeDocMeta?.docTitle || "e-Belge"} XSLT Şablonu`
                  : "Evrensel Yazdırma Motoru"}
              </span>
              <span>•</span>
              <span className="font-semibold text-amber-300 uppercase">
                {currentOrientation === "landscape" ? "A4 Yan (Yatay)" : "A4 Dikey"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isInvoiceMode && (
            <div className="flex flex-wrap items-center gap-1.5 mr-1">
              {/* Document Type Mode Switcher (Otomatik / e-Fatura / e-Arşiv) */}
              <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
                {(
                  [
                    { id: "auto", label: "Oto" },
                    { id: "e_fatura", label: "e-Fatura" },
                    { id: "e_arsiv", label: "e-Arşiv" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreviewDocType(m.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      previewDocType === m.id
                        ? "bg-red-700 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Template Style Selector */}
              <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 hidden lg:flex items-center">
                {(
                  [
                    { id: "gib_standard", label: "GİB XSLT" },
                    { id: "gib_modern", label: "Modern" },
                    { id: "gib_compact", label: "Kompakt" },
                  ] as { id: InvoiceTemplateStyle; label: string }[]
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDesign((prev) => ({ ...prev, templateStyle: st.id }))}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      (design.templateStyle || "gib_standard") === st.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Color Theme Selector */}
              <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex flex-wrap items-center">
                {(
                  [
                    { id: "gib_red", label: "GİB Kırmızı" },
                    { id: "blue", label: "Mavi" },
                    { id: "sky", label: "Açık Mavi" },
                    { id: "royal", label: "Koyu Mavi" },
                    { id: "navy", label: "Lacivert" },
                    { id: "emerald", label: "Yeşil" },
                    { id: "classic", label: "Klasik Açık" },
                  ] as { id: InvoiceColorTheme; label: string }[]
                ).map((tKey) => (
                  <button
                    key={tKey.id}
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        colorTheme: tKey.id,
                        customAccentColor: undefined,
                      }))
                    }
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      !design.customAccentColor && (design.colorTheme || "gib_red") === tKey.id
                        ? "bg-slate-700 text-white shadow-xs border border-slate-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title={INVOICE_COLOR_THEMES[tKey.id].label}
                  >
                    <span
                      style={{ backgroundColor: INVOICE_COLOR_THEMES[tKey.id].headerBg }}
                      className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                    />
                    <span>{tKey.label}</span>
                  </button>
                ))}
              </div>

              {/* Company Logo Toggle & Upload */}
              <button
                type="button"
                onClick={() =>
                  setDesign((prev) => ({ ...prev, showCompanyLogo: prev.showCompanyLogo === false }))
                }
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  design.showCompanyLogo !== false
                    ? "bg-slate-800 border-emerald-500/50 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="Şirket logosunu göster / gizle"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Logo</span>
              </button>

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-1"
                title="Şirket logosu yükle veya değiştir"
              >
                <Upload className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden 2xl:inline">Logo Yükle</span>
              </button>

              {/* Stamp / Kaşe Toggle */}
              <button
                type="button"
                onClick={() =>
                  setDesign((prev) => ({
                    ...prev,
                    showSignatureStamp: prev.showSignatureStamp === false,
                  }))
                }
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  design.showSignatureStamp !== false
                    ? "bg-slate-800 border-amber-500/50 text-amber-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="Düzenleyen Kaşe / İmza alanını göster / gizle"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Kaşe</span>
              </button>

              {/* QR Code Toggle */}
              <button
                type="button"
                onClick={() =>
                  setDesign((prev) => ({ ...prev, showQrCode: prev.showQrCode === false }))
                }
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  design.showQrCode !== false
                    ? "bg-slate-800 border-purple-500/50 text-purple-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="GİB e-Belge QR kodunu göster / gizle"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">QR</span>
              </button>

              {/* Save Design to Company (Firestore) Button */}
              <button
                type="button"
                onClick={handleSaveDesignToCompany}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600/90 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center gap-1"
                title="Özelleştirilen fatura CSS ve tasarım yapılandırmasını şirket bazlı olarak Firestore'a kaydet"
              >
                {savedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span className="hidden xl:inline">
                  {savedNotice ? "Firestore'a Kaydedildi!" : "Tasarımı Kaydet"}
                </span>
              </button>
            </div>
          )}

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
              title="A4 Yan / Yatay Sayfa Yönü"
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
            {isInvoiceMode ? (
              <>
                GİB UBL-TR 1.2 standartlarına uygun resmi <strong>e-Fatura</strong> ve{" "}
                <strong>e-Arşiv Fatura</strong> XSLT şablonu hazır. Üst bardan belge türünü, şablon
                düzenini, kaşe/logoyu seçip <strong>"Şablonu Kaydet"</strong> veya{" "}
                <strong>"PDF İndir / Yazdır"</strong> diyebilirsiniz.
              </>
            ) : (
              <>
                Belgeniz hazırlandı. Doğrudan <strong>"Yazdır"</strong> butonuna basabilir veya{" "}
                <strong>"PDF İndir"</strong> ile kaydedebilirsiniz.
              </>
            )}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 hidden sm:block">
          Standart A4 ({currentOrientation === "landscape" ? "297mm × 210mm" : "210mm × 297mm"})
        </div>
      </div>

      {/* 3. Document Preview Sheet Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 custom-scrollbar flex items-start justify-center">
        {isInvoiceMode && modalData.invoiceData ? (
          <div
            ref={previewContainerRef}
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className={
              currentOrientation === "landscape"
                ? "w-full max-w-5xl landscape-mode"
                : "w-full max-w-[860px]"
            }
          >
            <OfficialGIBInvoicePaper
              invoice={modalData.invoiceData.invoice}
              companySettings={{
                ...modalData.invoiceData.companySettings,
                ...(customLogoOverride ? { logoUrl: customLogoOverride } : {}),
              }}
              contact={modalData.invoiceData.contact}
              isDraft={modalData.invoiceData.isDraft}
              designOverride={design}
              previewDocTypeOverride={previewDocType}
              paperId="universal-print-preview-paper"
            />
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
