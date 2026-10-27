import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Eraser,
  PenTool,
  RotateCcw,
  Save,
  Sparkles,
  Stamp,
  Trash2,
  Upload,
  UserCheck,
  Wand2,
  X,
} from "lucide-react";
import type {
  CompanySettings,
  InvoiceDesignSettings,
  IssuerSignatureCssZone,
} from "../types";
import { readAndOptimizeLogoFile } from "../utils/logoUpload";

export interface EArsivSignatureResult {
  signatureImageUrl?: string;
  stampImageUrl?: string;
  signerName?: string;
  signerTitle?: string;
  eArsivSignatureMode: "stamp_and_signature" | "signature_only" | "stamp_only" | "auto_digital";
  eArsivSignatureColor: string;
  showSigningTimestamp: boolean;
  showSignatureStamp: boolean;
  autoDigitalStamp: boolean;
  signatureZone?: IssuerSignatureCssZone;
  signatureScale?: number;
}

interface EArsivSignatureStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  currentDesign?: InvoiceDesignSettings;
  initialSignatureUrl?: string;
  initialStampUrl?: string;
  initialSignerName?: string;
  initialSignerTitle?: string;
  onApply?: (result: EArsivSignatureResult, saveAsCompanyDefault: boolean) => void;
  onSaveCompanySettings?: (updatedSettings: CompanySettings) => void;
}

const PEN_COLORS = [
  { id: "#1d4ed8", label: "Islak İmza Mavisi", bg: "bg-blue-700" },
  { id: "#1e3a8a", label: "Kurumsal Lacivert", bg: "bg-blue-950" },
  { id: "#0f172a", label: "Koyu Antrasit", bg: "bg-slate-900" },
  { id: "#000000", label: "Siyah Mürekkep", bg: "bg-black" },
  { id: "#b91c1c", label: "Resmi Kırmızı", bg: "bg-red-700" },
];

/**
 * Removes white / light-gray paper background from an uploaded signature or stamp image
 * and enhances ink contrast, returning a transparent PNG data URL.
 */
export async function removeWhiteBackgroundFromImage(
  sourceDataUrl: string,
  threshold: number = 222
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 600;
        let w = img.width || 400;
        let h = img.height || 200;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(sourceDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a === 0) continue;

          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luminance >= threshold) {
            data[i + 3] = 0; // Make white background transparent
          } else if (luminance >= threshold - 35) {
            // Smooth anti-aliased edge transition
            const alphaFactor = (threshold - luminance) / 35;
            data[i + 3] = Math.round(a * Math.max(0, Math.min(1, alphaFactor)));
          } else {
            // Slightly deepen ink contrast
            data[i] = Math.max(0, Math.round(r * 0.88));
            data[i + 1] = Math.max(0, Math.round(g * 0.88));
            data[i + 2] = Math.max(0, Math.round(b * 0.92));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = sourceDataUrl;
  });
}

/**
 * Generates a realistic stylized handwritten signature PNG data URL from a person's name or company title.
 */
export function generateStylizedSignatureDataUrl(
  fullName: string,
  inkColor: string = "#1d4ed8",
  styleVariant: number = 0
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 140;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cleanName = (fullName || "Yetkili İmza").trim();
  const parts = cleanName.split(/\s+/);
  const initials = parts.map((p) => p.charAt(0).toUpperCase()).join(". ");
  const lastWord = parts[parts.length - 1] || cleanName;
  const displaySig = parts.length > 1 ? `${parts[0].charAt(0)}. ${lastWord}` : cleanName;

  ctx.save();
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Slight natural slant
  const angle = styleVariant % 2 === 0 ? -0.09 : -0.13;
  ctx.translate(45, 78);
  ctx.rotate(angle);

  // Stylized cursive text + flourish strokes
  ctx.font = "italic 700 34px Georgia, 'Times New Roman', serif";
  ctx.fillText(displaySig, 18, 0);

  // Add expressive pen flourish Paraf loop
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (styleVariant % 3 === 0) {
    ctx.moveTo(6, 12);
    ctx.bezierCurveTo(65, -22, 165, 24, 280, -8);
    ctx.bezierCurveTo(315, -16, 240, 28, 120, 18);
    ctx.bezierCurveTo(75, 14, 155, -36, 210, -28);
  } else if (styleVariant % 3 === 1) {
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(40, -45, 95, 32, 155, -15);
    ctx.bezierCurveTo(210, -48, 255, 16, 310, -6);
    ctx.moveTo(25, 18);
    ctx.quadraticCurveTo(160, 4, 295, 12);
  } else {
    ctx.moveTo(10, -18);
    ctx.bezierCurveTo(-15, 28, 85, 30, 265, 6);
    ctx.bezierCurveTo(310, 0, 290, -24, 245, -12);
    ctx.quadraticCurveTo(150, 14, 55, 22);
  }
  ctx.stroke();

  // Subtle second underline stroke
  ctx.lineWidth = 1.3;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.moveTo(35, 22);
  ctx.quadraticCurveTo(155, 12, 275, 17);
  ctx.stroke();

  // Add tiny initials dot
  if (initials) {
    ctx.beginPath();
    ctx.arc(282, 14, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  return canvas.toDataURL("image/png");
}

export const EArsivSignatureStudioModal: React.FC<EArsivSignatureStudioModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  currentDesign,
  initialSignatureUrl,
  initialStampUrl,
  initialSignerName,
  initialSignerTitle,
  onApply,
  onSaveCompanySettings,
}) => {
  const safeDesign: Partial<InvoiceDesignSettings> =
    currentDesign || companySettings?.invoiceDesign || {};

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigUploadRef = useRef<HTMLInputElement | null>(null);
  const stampUploadRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<"draw" | "upload" | "auto">("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);
  const [penColor, setPenColor] = useState<string>(
    safeDesign.eArsivSignatureColor || "#1d4ed8"
  );
  const [penWidth, setPenWidth] = useState<number>(2.6);
  const [autoVariant, setAutoVariant] = useState<number>(0);

  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(
    initialSignatureUrl ?? safeDesign.signatureImageUrl
  );
  const [stampDataUrl, setStampDataUrl] = useState<string | undefined>(
    initialStampUrl ?? safeDesign.stampImageUrl
  );
  const [signerName, setSignerName] = useState<string>(
    initialSignerName ??
      safeDesign.signerName ??
      companySettings?.eDevletCredentials?.managerName ??
      ""
  );
  const [signerTitle, setSignerTitle] = useState<string>(
    initialSignerTitle ?? safeDesign.signerTitle ?? "Şirket Yetkilisi"
  );
  const [signatureMode, setSignatureMode] = useState<
    "stamp_and_signature" | "signature_only" | "stamp_only" | "auto_digital"
  >(safeDesign.eArsivSignatureMode || "stamp_and_signature");
  const [showSigningTimestamp, setShowSigningTimestamp] = useState<boolean>(
    safeDesign.showSigningTimestamp !== false
  );
  const [signatureZone, setSignatureZone] = useState<IssuerSignatureCssZone>(
    safeDesign.cssConfig?.signatureZone || "under_gib"
  );
  const [signatureScale, setSignatureScale] = useState<number>(
    safeDesign.cssConfig?.signatureScale || 1
  );
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(true);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);

  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSignatureDataUrl(initialSignatureUrl ?? safeDesign.signatureImageUrl);
    setStampDataUrl(initialStampUrl ?? safeDesign.stampImageUrl);
    setSignerName(
      initialSignerName ??
        safeDesign.signerName ??
        companySettings?.eDevletCredentials?.managerName ??
        ""
    );
    setSignerTitle(initialSignerTitle ?? safeDesign.signerTitle ?? "Şirket Yetkilisi");
    setSignatureMode(safeDesign.eArsivSignatureMode || "stamp_and_signature");
    setPenColor(safeDesign.eArsivSignatureColor || "#1d4ed8");
    setShowSigningTimestamp(safeDesign.showSigningTimestamp !== false);
    setSignatureZone(safeDesign.cssConfig?.signatureZone || "under_gib");
    setSignatureScale(safeDesign.cssConfig?.signatureScale || 1);
    setHasDrawnOnCanvas(false);
  }, [
    isOpen,
    initialSignatureUrl,
    initialStampUrl,
    initialSignerName,
    initialSignerTitle,
    currentDesign,
    companySettings?.invoiceDesign,
    companySettings?.eDevletCredentials?.managerName,
  ]);

  // Initialize drawing canvas
  useEffect(() => {
    if (!isOpen || activeTab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleStartDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    lastPointRef.current = pt;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = penColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, penWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handleMoveDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getCanvasPoint(e);
    const prev = lastPointRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!pt || !prev || !ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    const midX = (prev.x + pt.x) / 2;
    const midY = (prev.y + pt.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    lastPointRef.current = pt;
    setHasDrawnOnCanvas(true);
  };

  const handleEndDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasDrawnOnCanvas) {
      setSignatureDataUrl(canvas.toDataURL("image/png"));
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawnOnCanvas(false);
    setSignatureDataUrl(undefined);
  };

  const handleSaveCanvasToSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const handleUploadSignatureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawUrl = await readAndOptimizeLogoFile(file);
      const cleanedUrl = await removeWhiteBackgroundFromImage(rawUrl, 224);
      setSignatureDataUrl(cleanedUrl);
      if (signatureMode === "auto_digital" || signatureMode === "stamp_only") {
        setSignatureMode("stamp_and_signature");
      }
    } catch (err) {
      console.error("İmza görseli yükleme hatası:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleUploadStampFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawUrl = await readAndOptimizeLogoFile(file);
      const cleanedUrl = await removeWhiteBackgroundFromImage(rawUrl, 228);
      setStampDataUrl(cleanedUrl);
      if (signatureMode === "signature_only") {
        setSignatureMode("stamp_and_signature");
      }
    } catch (err) {
      console.error("Kaşe görseli yükleme hatası:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleCleanExistingBackground = async (target: "signature" | "stamp") => {
    setIsProcessingBg(true);
    try {
      if (target === "signature" && signatureDataUrl) {
        const cleaned = await removeWhiteBackgroundFromImage(signatureDataUrl, 218);
        setSignatureDataUrl(cleaned);
      } else if (target === "stamp" && stampDataUrl) {
        const cleaned = await removeWhiteBackgroundFromImage(stampDataUrl, 220);
        setStampDataUrl(cleaned);
      }
    } finally {
      setIsProcessingBg(false);
    }
  };

  const handleGenerateStylizedSignature = () => {
    const nextVar = autoVariant + 1;
    setAutoVariant(nextVar);
    const targetName =
      signerName.trim() ||
      companySettings?.eDevletCredentials?.managerName ||
      companySettings?.companyName ||
      "Yetkili İmza";
    const generated = generateStylizedSignatureDataUrl(targetName, penColor, nextVar);
    if (generated) {
      setSignatureDataUrl(generated);
      if (signatureMode === "auto_digital" || signatureMode === "stamp_only") {
        setSignatureMode("stamp_and_signature");
      }
    }
  };

  const handleConfirmApply = () => {
    let finalSigUrl = signatureDataUrl;
    if (activeTab === "draw" && hasDrawnOnCanvas && canvasRef.current) {
      finalSigUrl = canvasRef.current.toDataURL("image/png");
    }

    const resultPayload: EArsivSignatureResult = {
      signatureImageUrl: finalSigUrl,
      stampImageUrl: stampDataUrl,
      signerName: signerName.trim() || undefined,
      signerTitle: signerTitle.trim() || undefined,
      eArsivSignatureMode: signatureMode,
      eArsivSignatureColor: penColor,
      showSigningTimestamp,
      showSignatureStamp: true,
      autoDigitalStamp: signatureMode !== "signature_only",
      signatureZone,
      signatureScale,
    };

    if (onApply) {
      onApply(resultPayload, saveAsDefault);
    } else if (onSaveCompanySettings && companySettings) {
      const baseDesign = (companySettings.invoiceDesign || {}) as InvoiceDesignSettings;
      const nextDesign: InvoiceDesignSettings = {
        ...baseDesign,
        signatureImageUrl: resultPayload.signatureImageUrl,
        stampImageUrl: resultPayload.stampImageUrl,
        signerName: resultPayload.signerName,
        signerTitle: resultPayload.signerTitle,
        eArsivSignatureMode: resultPayload.eArsivSignatureMode,
        eArsivSignatureColor: resultPayload.eArsivSignatureColor,
        showSigningTimestamp: resultPayload.showSigningTimestamp,
        showSignatureStamp: resultPayload.showSignatureStamp,
        autoDigitalStamp: resultPayload.autoDigitalStamp,
        cssConfig: {
          ...(baseDesign.cssConfig || ({} as any)),
          ...(resultPayload.signatureZone ? { signatureZone: resultPayload.signatureZone } : {}),
          ...(resultPayload.signatureScale !== undefined
            ? { signatureScale: resultPayload.signatureScale }
            : {}),
        },
      };
      onSaveCompanySettings({
        ...companySettings,
        invoiceDesign: nextDesign,
      });
    }
    onClose();
  };

  const sellerTitle =
    companySettings?.companyTitle || companySettings?.companyName || "KURUMSAL FİRMA ÜNVANI";
  const sellerTaxOffice = companySettings?.taxOffice || "Merkez";
  const sellerTaxNo =
    companySettings?.vkn ||
    companySettings?.tckn ||
    companySettings?.taxNumber ||
    companySettings?.tenantIdentifierNumber ||
    "1111111111";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-red-950 text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-300 shrink-0">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/30">
                  VUK 509 Tebliği • e-Arşiv Fatura İmza &amp; Kaşe Stüdyosu
                </span>
              </div>
              <h3 className="text-base font-extrabold mt-0.5">
                e-Arşiv Faturalara Islak İmza &amp; Kurumsal Kaşe Ekleme
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={sigUploadRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
          className="hidden"
          onChange={handleUploadSignatureFile}
        />
        <input
          ref={stampUploadRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
          className="hidden"
          onChange={handleUploadStampFile}
        />

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* LEFT 7 COLS: SIGNATURE CREATION & UPLOAD TOOLS */}
          <div className="lg:col-span-7 space-y-4">
            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("draw")}
                className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === "draw"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>1. Ekranda İmza Çiz</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === "upload"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>2. İmza / Kaşe Yükle</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("auto")}
                className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === "auto"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>3. Kaligrafik Hazır İmza</span>
              </button>
            </div>

            {/* TAB 1: DRAW SIGNATURE ON CANVAS */}
            {activeTab === "draw" && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">Mürekkep Rengi:</span>
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setPenColor(c.id)}
                        title={c.label}
                        className={`w-6 h-6 rounded-full ${c.bg} border-2 cursor-pointer transition-all ${
                          penColor === c.id
                            ? "ring-2 ring-offset-1 ring-indigo-600 border-white scale-110"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">Kalem Kalınlığı:</span>
                    <input
                      type="range"
                      min={1.4}
                      max={4.5}
                      step={0.4}
                      value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))}
                      className="w-20 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Interactive Canvas */}
                <div className="relative bg-white rounded-2xl border-2 border-dashed border-indigo-300 overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={170}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleMoveDraw}
                    onMouseUp={handleEndDraw}
                    onMouseLeave={handleEndDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleMoveDraw}
                    onTouchEnd={handleEndDraw}
                    className="w-full h-[165px] cursor-crosshair touch-none block"
                  />
                  {/* Baseline guide */}
                  <div className="pointer-events-none absolute inset-x-8 bottom-8 border-b border-slate-200 flex justify-between items-end pb-1">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Fare veya dokunmatik ekranla buraya ıslak imzanızı atın
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">× İmza Çizgisi</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Tahtayı Temizle</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateStylizedSignature}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>İsme Göre Otomatik İmza Üret</span>
                    </button>
                  </div>

                  {hasDrawnOnCanvas && (
                    <button
                      type="button"
                      onClick={handleSaveCanvasToSignature}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Çizimi Önizlemeye Aktar</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD SIGNATURE OR STAMP IMAGE + WHITE BG REMOVER */}
            {activeTab === "upload" && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload Wet Signature */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Islak İmza Görseli (PNG / JPG)</span>
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Beyaz kağıda atılmış imza fotoğrafı yüklediğinizde arka plan otomatik şeffaflaştırılır.
                      </p>
                    </div>

                    {signatureDataUrl ? (
                      <div className="h-20 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-2">
                        <img
                          src={signatureDataUrl}
                          alt="Yüklenen İmza"
                          className="max-h-16 w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-20 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                        Henüz imza görseli seçilmedi
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => sigUploadRef.current?.click()}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>İmza Yükle</span>
                      </button>
                      {signatureDataUrl && (
                        <>
                          <button
                            type="button"
                            disabled={isProcessingBg}
                            onClick={() => void handleCleanExistingBackground("signature")}
                            className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10px] cursor-pointer"
                            title="Beyaz arka planı şeffaf yap"
                          >
                            Netleştir
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatureDataUrl(undefined)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                            title="İmza görselini kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Upload Company Stamp */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-purple-600" />
                        <span>Şirket Kaşesi Görseli (PNG / JPG)</span>
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Fiziki şirket kaşenizi taratıp veya fotoğrafını çekip yükleyebilirsiniz.
                      </p>
                    </div>

                    {stampDataUrl ? (
                      <div className="h-20 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-2">
                        <img
                          src={stampDataUrl}
                          alt="Yüklenen Kaşe"
                          className="max-h-16 w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-20 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                        Otomatik dijital kaşe aktif
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => stampUploadRef.current?.click()}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Kaşe Yükle</span>
                      </button>
                      {stampDataUrl && (
                        <>
                          <button
                            type="button"
                            disabled={isProcessingBg}
                            onClick={() => void handleCleanExistingBackground("stamp")}
                            className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10px] cursor-pointer"
                            title="Beyaz arka planı şeffaf yap"
                          >
                            Netleştir
                          </button>
                          <button
                            type="button"
                            onClick={() => setStampDataUrl(undefined)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                            title="Kaşe görselini kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CALLIGRAPHIC AUTO SIGNATURE GENERATOR */}
            {activeTab === "auto" && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-slate-600 text-[11px]">
                  İmza yetkilisi adına göre tek tıkla kurumsal ıslak imza oluşturabilir, farklı paraf stillerini deneyebilirsiniz.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">İmza Rengi:</span>
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setPenColor(c.id);
                          const targetName =
                            signerName.trim() ||
                            companySettings?.companyName ||
                            "Yetkili İmza";
                          setSignatureDataUrl(
                            generateStylizedSignatureDataUrl(targetName, c.id, autoVariant)
                          );
                        }}
                        className={`w-6 h-6 rounded-full ${c.bg} border-2 cursor-pointer ${
                          penColor === c.id ? "ring-2 ring-indigo-600 border-white" : "opacity-75"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateStylizedSignature}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Yeni Kaligrafik İmza Stili Üret (Stil #{(autoVariant % 3) + 1})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Signer Details & Display Mode */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>İmza Yetkilisi Bilgileri &amp; Görünüm Modu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    İmza Yetkilisi Adı Soyadı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Yetkili Unvanı / Görevi
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Şirket Müdürü / Finans Yetkilisi"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    e-Arşiv İmza Kutusu Görünüm Modu
                  </label>
                  <select
                    value={signatureMode}
                    onChange={(e) =>
                      setSignatureMode(
                        e.target.value as
                          | "stamp_and_signature"
                          | "signature_only"
                          | "stamp_only"
                          | "auto_digital"
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="stamp_and_signature">
                      Şirket Kaşesi + Islak İmza Birlikte (Önerilen)
                    </option>
                    <option value="signature_only">Sadece Islak İmza &amp; Yetkili Adı</option>
                    <option value="stamp_only">Sadece Yüklenen Kaşe Görseli</option>
                    <option value="auto_digital">Otomatik Dijital Şirket Kaşesi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fatura Üzerindeki İmza Konumu
                  </label>
                  <select
                    value={signatureZone}
                    onChange={(e) => setSignatureZone(e.target.value as IssuerSignatureCssZone)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="under_gib">GİB Logosu Altında (Üst Orta - Standart)</option>
                    <option value="under_seller">Düzenleyen Bilgisi Altında (Üst Sol)</option>
                    <option value="bottom_right">Toplamlar Tablosu Altında (Alt Sağ)</option>
                    <option value="bottom_left">Açıklamalar / Notlar Altında (Alt Sol)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showSigningTimestamp}
                    onChange={(e) => setShowSigningTimestamp(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>İmza kutusunda elektronik imza tarih/saat damgasını göster</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    İmza Ölçeği: %{Math.round(signatureScale * 100)}
                  </span>
                  <input
                    type="range"
                    min={0.7}
                    max={1.35}
                    step={0.05}
                    value={signatureScale}
                    onChange={(e) => setSignatureScale(Number(e.target.value))}
                    className="w-24 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: REAL-TIME e-ARŞİV SIGNATURE BOX PREVIEW */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Canlı e-Arşiv Fatura İmza Kutusu Önizlemesi
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  VUK 509 Uyumlu
                </span>
              </div>

              {/* Simulated e-Arşiv Signature Box */}
              <div className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-sm flex flex-col items-center text-center min-h-[235px] justify-center">
                {/* Stamp part */}
                {(signatureMode === "stamp_and_signature" ||
                  signatureMode === "stamp_only" ||
                  signatureMode === "auto_digital") && (
                  <div className="w-full flex flex-col items-center">
                    {stampDataUrl ? (
                      <img
                        src={stampDataUrl}
                        alt="Şirket Kaşesi"
                        className="max-h-16 w-auto object-contain"
                      />
                    ) : (
                      <div
                        style={{ borderColor: penColor, color: penColor }}
                        className="border-2 rounded-lg px-3 py-1.5 bg-white/95 max-w-[235px] w-full space-y-0.5"
                      >
                        <div className="text-[9px] font-black uppercase leading-tight">
                          {sellerTitle}
                        </div>
                        <div className="border-t border-current/30 my-0.5" />
                        {companySettings?.address && (
                          <div className="text-[7px] font-medium leading-tight">
                            {companySettings.address}
                          </div>
                        )}
                        <div className="text-[7.5px] font-bold leading-tight">
                          {sellerTaxOffice ? `${sellerTaxOffice} V.D. • ` : ""}
                          {String(sellerTaxNo).replace(/\D/g, "").length === 11
                            ? "T.C. Kimlik No"
                            : "Vergi Kimlik No"}
                          : <span className="font-mono font-black">{sellerTaxNo}</span>
                        </div>
                        {(companySettings?.phone || companySettings?.email) && (
                          <div className="text-[6.8px] font-semibold leading-tight">
                            {companySettings.phone ? `Tel: ${companySettings.phone}` : ""}
                            {companySettings.phone && companySettings.email ? " • " : ""}
                            {companySettings.email ? `E-Posta: ${companySettings.email}` : ""}
                          </div>
                        )}
                        {(companySettings?.tradeRegisterNo || companySettings?.esnafSicilNo) && (
                          <div className="text-[6.8px] font-semibold leading-tight">
                            {companySettings.tradeRegisterNo
                              ? `Ticaret Sicil No: ${companySettings.tradeRegisterNo}`
                              : ""}
                            {companySettings.tradeRegisterNo && companySettings.esnafSicilNo
                              ? " • "
                              : ""}
                            {companySettings.esnafSicilNo
                              ? `Esnaf Sicil No: ${companySettings.esnafSicilNo}`
                              : ""}
                          </div>
                        )}
                        {companySettings?.mersisNo && (
                          <div className="text-[6.8px] font-mono font-semibold leading-tight">
                            MERSİS No: {companySettings.mersisNo}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Wet Signature part (38px spacing below stamp) */}
                {(signatureMode === "stamp_and_signature" ||
                  signatureMode === "signature_only") && (
                  <div
                    style={{
                      marginTop: signatureMode === "stamp_and_signature" ? "38px" : "0px",
                    }}
                    className="w-full flex flex-col items-center"
                  >
                    {signatureDataUrl ? (
                      <img
                        src={signatureDataUrl}
                        alt="Islak İmza"
                        className="max-h-16 w-auto object-contain"
                      />
                    ) : (
                      <svg
                        width="135"
                        height="34"
                        viewBox="0 0 135 34"
                        fill="none"
                        className="overflow-visible"
                      >
                        <path
                          d="M12 24 C 30 6, 46 28, 62 12 C 74 3, 82 26, 98 10 C 108 4, 116 17, 126 9"
                          stroke={penColor}
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 28 Q 68 19, 120 23"
                          stroke={penColor}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          opacity="0.75"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Options & Confirm Button */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="flex items-start gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <div>
                  <span className="font-extrabold text-slate-900 block text-[11px]">
                    Tüm e-Arşiv Faturalar İçin Varsayılan İmza Olarak Kaydet
                  </span>
                  <span className="text-[10px] text-slate-500">
                    İşaretlendiğinde yeni kesilecek tüm e-Arşiv faturalara ve XSLT şablonuna bu imza otomatik eklenir.
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>e-Arşiv İmzayı Uygula &amp; Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
