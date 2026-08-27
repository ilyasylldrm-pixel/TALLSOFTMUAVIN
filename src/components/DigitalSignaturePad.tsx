import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  PenTool,
  RotateCcw,
  Trash2,
  Check,
  X,
  Smartphone,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Clock,
  Sparkles,
  User,
} from "lucide-react";

interface DigitalSignaturePadProps {
  title?: string;
  signerName?: string;
  signerRole?: string;
  initialSignature?: string | null;
  onSave: (signatureDataUrl: string, signerInfo?: { name: string; timestamp: string }) => void;
  onClear?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  title = "Dijital İmza Alanı",
  signerName = "",
  signerRole = "Müşteri / Teslim Alan",
  initialSignature = null,
  onSave,
  onClear,
  onClose,
  isModal = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialSignature));
  const [strokeColor, setStrokeColor] = useState<string>("#1e3a8a"); // Classic ink blue
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [includeTimestamp, setIncludeTimestamp] = useState<boolean>(true);
  const [customSignerName, setCustomSignerName] = useState<string>(signerName);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Initialize and resize canvas with high DPI support
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    const rect = container ? container.getBoundingClientRect() : { width: 500, height: 200 };
    const width = Math.max(rect.width, 320);
    const height = Math.max(rect.height, 180);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;

      // If initial signature exists, draw it
      if (initialSignature) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          setHasDrawn(true);
        };
        img.src = initialSignature;
      }
    }
  }, [initialSignature, strokeColor, strokeWidth]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => {
      // Debounced resize
      setupCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas]);

  // Track points for smooth bezier curves
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const saveStrokeHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-15), imageData]);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    saveStrokeHistory();
    setIsDrawing(true);
    setHasDrawn(true);

    const coords = getCanvasCoordinates(e);
    pointsRef.current = [coords];

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    pointsRef.current.push(coords);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    if (pointsRef.current.length > 2) {
      const p1 = pointsRef.current[pointsRef.current.length - 2];
      const p2 = pointsRef.current[pointsRef.current.length - 1];
      const midPoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      ctx.stroke();
    } else {
      const p1 = pointsRef.current[0];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas && e.pointerId) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch if pointer is already released
      }
    }
    setIsDrawing(false);
    pointsRef.current = [];
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setStrokeHistory([]);
    if (onClear) onClear();
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) {
      handleClear();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));

    if (strokeHistory.length <= 1) {
      setHasDrawn(false);
    }
  };

  const handleConfirmSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const timestampStr = new Date().toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Create a trimmed export canvas with optional timestamp watermark
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext("2d");

    if (expCtx) {
      // Draw signature
      expCtx.drawImage(canvas, 0, 0);

      // Add watermark text if enabled
      if (includeTimestamp) {
        const dpr = window.devicePixelRatio || 1;
        expCtx.font = `600 ${10 * dpr}px sans-serif`;
        expCtx.fillStyle = "rgba(71, 85, 105, 0.7)";
        expCtx.textAlign = "right";
        expCtx.fillText(
          `E-İmza: ${customSignerName || signerName} • ${timestampStr}`,
          exportCanvas.width - 12 * dpr,
          exportCanvas.height - 10 * dpr
        );
      }
    }

    const dataUrl = exportCanvas.toDataURL("image/png");
    onSave(dataUrl, {
      name: customSignerName || signerName,
      timestamp: timestampStr,
    });
  };

  const content = (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
      {/* PAD HEADER */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <PenTool className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{title}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Dokunmatik / Kalem
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 font-medium">
              {signerRole}: {customSignerName || signerName || "Belirtilmedi"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Küçült" : "Tam Ekran Yap"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CONTROLS TOOLBAR */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
        {/* Ink Colors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Mürekkep:</span>
          {[
            { id: "navy", color: "#1e3a8a", label: "Klasik Lacivert" },
            { id: "black", color: "#0f172a", label: "Siyah" },
            { id: "purple", color: "#581c87", label: "Mürdüm / Mor" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setStrokeColor(c.color)}
              className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                strokeColor === c.color ? "border-purple-600 scale-110 shadow-xs ring-2 ring-purple-200" : "border-white hover:scale-105"
              }`}
              style={{ backgroundColor: c.color }}
              title={c.label}
            >
              {strokeColor === c.color && <Check className="w-3 h-3 text-white" />}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Stroke Widths */}
          <span className="text-[11px] font-bold text-slate-500 mr-1">Kalınlık:</span>
          {[
            { width: 2, label: "İnce" },
            { width: 3.5, label: "Normal" },
            { width: 5, label: "Kalın" },
          ].map((w) => (
            <button
              key={w.width}
              type="button"
              onClick={() => setStrokeWidth(w.width)}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors cursor-pointer ${
                strokeWidth === w.width
                  ? "bg-purple-700 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokeHistory.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            title="Son Çizgiyi Geri Al"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Geri Al</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:pointer-events-none text-rose-700 font-bold text-xs transition-colors cursor-pointer"
            title="İmza Alanını Temizle"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Temizle</span>
          </button>
        </div>
      </div>

      {/* CANVAS DRAWING AREA */}
      <div
        ref={containerRef}
        className={`relative flex-1 bg-slate-50/60 p-2 overflow-hidden flex flex-col justify-center items-center ${
          isFullscreen ? "min-h-[380px]" : "min-h-[220px]"
        }`}
      >
        <div className="w-full h-full relative rounded-2xl bg-white border-2 border-dashed border-purple-200 shadow-inner overflow-hidden cursor-crosshair">
          {/* Subtle guide line */}
          <div className="absolute left-8 right-8 bottom-12 border-b border-slate-300 pointer-events-none flex items-center justify-between text-[11px] font-semibold text-slate-400 select-none">
            <span>✗ Lütfen bu çizginin üzerine imzanızı atınız</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Parmak veya Dokunmatik Kalem
            </span>
          </div>

          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mb-2 shadow-xs">
                <PenTool className="w-6 h-6 animate-bounce" />
              </div>
              <p className="text-sm font-bold text-slate-600">Dokunmatik Ekranda veya Fare ile İmzalayın</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Tablet, telefon veya bilgisayarınızdan doğrudan imza atabilirsiniz
              </p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block touch-none"
            style={{ touchAction: "none" }}
          />
        </div>
      </div>

      {/* FOOTER & CONFIRMATION */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Signer Name Input */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-700 shrink-0" />
            <input
              type="text"
              value={customSignerName}
              onChange={(e) => setCustomSignerName(e.target.value)}
              placeholder="İmzalayan Ad Soyad"
              className="px-3 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 bg-white"
            />
          </div>

          {/* Timestamp Watermark Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeTimestamp}
              onChange={(e) => setIncludeTimestamp(e.target.checked)}
              className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Tarih & Saat Damgası Ekle</span>
          </label>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs shadow-md shadow-purple-700/20 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>İmzayı Onayla & Tutanağa Ekle</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
        <div
          className={`w-full transition-all ${
            isFullscreen ? "max-w-5xl h-[92vh]" : "max-w-2xl max-h-[90vh]"
          } my-auto`}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
};
