import React, { useState, useEffect } from "react";
import { WorkOrder, Workstation, WorkOrderOperation } from "../../types";
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Barcode,
  Cpu,
  User,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  X,
} from "lucide-react";

interface MesOperatorTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrders: WorkOrder[];
  workstations: Workstation[];
  initialWorkOrderId?: string;
  onUpdateWorkOrder: (wo: WorkOrder) => void;
  onUpdateWorkstation: (ws: Workstation) => void;
}

export const MesOperatorTerminal: React.FC<MesOperatorTerminalProps> = ({
  isOpen,
  onClose,
  workOrders,
  workstations,
  initialWorkOrderId,
  onUpdateWorkOrder,
  onUpdateWorkstation,
}) => {
  const [selectedWoId, setSelectedWoId] = useState<string>(
    initialWorkOrderId || workOrders[0]?.id || ""
  );
  const [selectedOpId, setSelectedOpId] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("Murat Usta (Hat Sorumlusu)");

  // Live Timer State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Produced & Scrap Counts
  const [goodCount, setGoodCount] = useState<number>(0);
  const [scrapCount, setScrapCount] = useState<number>(0);
  const [scrapReason, setScrapReason] = useState<string>("Ölçü Hatası");
  const [qualityPassed, setQualityPassed] = useState<boolean>(false);

  const selectedWo = workOrders.find((w) => w.id === selectedWoId) || workOrders[0];

  useEffect(() => {
    if (selectedWo && selectedWo.operations && selectedWo.operations.length > 0) {
      const activeOp =
        selectedWo.operations.find((o) => o.status === "in_progress") ||
        selectedWo.operations.find((o) => o.status === "pending") ||
        selectedWo.operations[0];
      setSelectedOpId(activeOp?.id || "");
      setGoodCount(activeOp?.producedQuantity || 0);
      setScrapCount(activeOp?.scrappedQuantity || 0);
      setIsRunning(activeOp?.status === "in_progress");
    }
  }, [selectedWoId]);

  // Live Stopwatch ticker
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  if (!isOpen) return null;

  const currentOp = selectedWo?.operations?.find((o) => o.id === selectedOpId);
  const currentWs = workstations.find((w) => w.id === currentOp?.workstationId);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartOperation = () => {
    setIsRunning(true);
    if (!selectedWo || !currentOp) return;

    const updatedOps = selectedWo.operations?.map((op) => {
      if (op.id === currentOp.id) {
        return {
          ...op,
          status: "in_progress" as const,
          operatorName,
          actualStartTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      }
      return op;
    });

    const updatedWo: WorkOrder = {
      ...selectedWo,
      status: "in_progress",
      operations: updatedOps,
      actualStartDate: selectedWo.actualStartDate || new Date().toISOString(),
    };

    onUpdateWorkOrder(updatedWo);

    if (currentWs) {
      onUpdateWorkstation({
        ...currentWs,
        status: "running",
        currentWorkOrderId: selectedWo.id,
        currentWorkOrderNumber: selectedWo.orderNumber,
        assignedOperatorName: operatorName,
      });
    }
  };

  const handlePauseOperation = () => {
    setIsRunning(false);
  };

  const handleCompleteOperation = () => {
    setIsRunning(false);
    if (!selectedWo || !currentOp) return;

    const updatedOps = selectedWo.operations?.map((op) => {
      if (op.id === currentOp.id) {
        return {
          ...op,
          status: "completed" as const,
          producedQuantity: goodCount,
          scrappedQuantity: scrapCount,
          actualEndTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          qualityApproval: qualityPassed
            ? {
                approvedBy: operatorName,
                approvedAt: new Date().toISOString(),
                status: "approved" as const,
              }
            : undefined,
        };
      }
      return op;
    });

    const allCompleted = updatedOps?.every((o) => o.status === "completed");

    const updatedWo: WorkOrder = {
      ...selectedWo,
      producedQuantity: goodCount,
      scrappedQuantity: (selectedWo.scrappedQuantity || 0) + scrapCount,
      status: allCompleted ? "completed" : "in_progress",
      operations: updatedOps,
      actualEndDate: allCompleted ? new Date().toISOString() : undefined,
    };

    onUpdateWorkOrder(updatedWo);

    if (currentWs) {
      onUpdateWorkstation({
        ...currentWs,
        status: "idle",
        currentWorkOrderId: undefined,
        currentWorkOrderNumber: undefined,
      });
    }

    alert(`Operasyon #${currentOp.sequence} (${currentOp.operationName}) başarıyla tamamlandı!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-purple-500/30 max-h-[96vh] flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8252F6] flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 font-mono font-extrabold rounded border border-purple-500/30">
                  MES SAHA TERMİNALİ
                </span>
                <span className="text-xs text-slate-400">Üretim Operatör Ekranı</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                {currentWs?.name || "İş İstasyonu"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-semibold">{operatorName}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Work Order Picker & Active Operation Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 my-4 sm:my-6 overflow-y-auto flex-1 custom-scrollbar pr-1">
          {/* Left: Work Order & Step Selection (4 cols) */}
          <div className="lg:col-span-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wider block mb-1">
                İş Emri Seçimi
              </label>
              <select
                value={selectedWoId}
                onChange={(e) => setSelectedWoId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-purple-500"
              >
                {workOrders.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.orderNumber} - {w.productName} ({w.plannedQuantity} {w.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedWo && (
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Parti / Lot:</span>
                  <span className="font-mono font-bold text-purple-300">{selectedWo.lotNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hedef Adet:</span>
                  <span className="font-extrabold text-white">
                    {selectedWo.plannedQuantity} {selectedWo.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Müşteri / Proje:</span>
                  <span className="text-white font-medium">{selectedWo.customerName || "Stok Üretimi"}</span>
                </div>
              </div>
            )}

            {/* Operations List */}
            <div>
              <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wider block mb-2">
                Operasyon Adımları
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {selectedWo?.operations?.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => {
                      setSelectedOpId(op.id);
                      setGoodCount(op.producedQuantity || 0);
                      setScrapCount(op.scrappedQuantity || 0);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${
                      selectedOpId === op.id
                        ? "bg-[#8252F6]/30 border-purple-500 text-white font-bold ring-1 ring-purple-500"
                        : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-purple-400 font-bold">#{op.sequence}</span>
                        <span className="font-bold">{op.operationName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{op.workstationName}</span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        op.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : op.status === "in_progress"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {op.status === "completed" ? "Tamam" : op.status === "in_progress" ? "Üretimde" : "Bekliyor"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Interactive Workstation Controls (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950/60 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 sm:space-y-6">
            {/* Big Stopwatch Timer */}
            <div className="text-center p-5 sm:p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                İşlem Süresi Kronometresi
              </span>
              <div className="font-mono text-4xl sm:text-6xl font-black tracking-wider text-emerald-400 drop-shadow-md">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Planlanan Standart Çevrim: {currentOp?.plannedDurationMinutes || 30} Dakika
              </div>
            </div>

            {/* Big Touch Controls for Counters (Good / Scrap) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Sağlam Parça Sayacı */}
              <div className="p-4 sm:p-5 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl text-center space-y-3">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block">
                  Sağlam Üretilen Adet
                </span>
                <div className="font-mono text-3xl sm:text-4xl font-black text-white">{goodCount}</div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setGoodCount((c) => Math.max(0, c - 1))}
                    className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-lg font-bold transition cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setGoodCount((c) => c + 1)}
                    className="flex-1 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
                  >
                    +1 Adet Basıldı
                  </button>
                  <button
                    onClick={() => setGoodCount((c) => c + 10)}
                    className="px-3 py-2.5 sm:py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Fire / Hurda Sayacı */}
              <div className="p-4 sm:p-5 bg-rose-950/30 border border-rose-800/50 rounded-2xl text-center space-y-3">
                <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider block">
                  Fire / Hurda Adedi
                </span>
                <div className="font-mono text-3xl sm:text-4xl font-black text-white">{scrapCount}</div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setScrapCount((c) => Math.max(0, c - 1))}
                    className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-lg font-bold transition cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setScrapCount((c) => c + 1)}
                    className="flex-1 py-2.5 sm:py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
                  >
                    +1 Fire Kaydet
                  </button>
                </div>
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="p-3.5 sm:p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={qualityPassed}
                  onChange={(e) => setQualityPassed(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-extrabold text-white block">
                    Kalite Kontrol & Tolerans Ölçümleri Yapıldı
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Teknik resim ve spesifikasyon onaylandı
                  </span>
                </div>
              </label>

              <ShieldCheck
                className={`w-5 h-5 ${qualityPassed ? "text-emerald-400" : "text-slate-600"}`}
              />
            </div>

            {/* Action Bar (Start, Pause, Finish) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStartOperation}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Operasyonu Başlat
                </button>
              ) : (
                <button
                  onClick={handlePauseOperation}
                  className="py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                >
                  <Pause className="w-4 h-4 fill-slate-950" />
                  Mola / Duraklat
                </button>
              )}

              <button
                onClick={handleCompleteOperation}
                className="sm:col-span-2 py-3.5 bg-[#8252F6] hover:bg-[#7140e8] text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                Operasyonu Tamamla & Onayla
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
