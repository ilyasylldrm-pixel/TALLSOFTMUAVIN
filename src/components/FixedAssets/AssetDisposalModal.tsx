import React, { useState } from "react";
import {
  Trash2,
  DollarSign,
  AlertTriangle,
  FileText,
  Calculator,
  X,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { FixedAsset, AssetDisposalRecord } from "../../types";
import { formatTRY } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";

interface AssetDisposalModalProps {
  asset: FixedAsset;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDisposal: (disposal: Omit<AssetDisposalRecord, "id" | "createdAt">) => void;
}

export const AssetDisposalModal: React.FC<AssetDisposalModalProps> = ({
  asset,
  isOpen,
  onClose,
  onConfirmDisposal,
}) => {
  const { theme } = useTheme();
  const [disposalType, setDisposalType] = useState<"sale" | "scrap" | "loss" | "donation">("sale");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [salePrice, setSalePrice] = useState<number>(0);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [buyerTaxId, setBuyerTaxId] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const cost = asset.purchaseCost || 0;
  const accumulated = asset.accumulatedDepreciation || 0;
  const netBookValue = Math.max(0, cost - accumulated);

  // Profit / Loss calculation:
  // If sale: Profit/Loss = salePrice - netBookValue
  // If scrap: loss = netBookValue (if salePrice=0) or salePrice - netBookValue
  const effectiveSale = disposalType === "sale" ? salePrice : disposalType === "scrap" ? salePrice : 0;
  const gainOrLoss = effectiveSale - netBookValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onConfirmDisposal({
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      disposalType,
      date,
      originalCost: cost,
      accumulatedDepreciation: accumulated,
      netBookValue,
      salePrice: effectiveSale,
      gainOrLoss,
      invoiceNo: invoiceNo.trim() || undefined,
      customerName: customerName.trim() || undefined,
      buyerTaxId: buyerTaxId.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        className="rounded-2xl shadow-2xl max-w-xl w-full border overflow-hidden animate-in fade-in zoom-in-95 transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/50 rounded-xl text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Demirbaş Aktiften Çıkış / Hurda & Satış
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{asset.code} • {asset.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Book Value Breakdown Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Alış Değeri</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono tabular-nums">{formatTRY(cost)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Birikmiş Amortisman</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs font-mono tabular-nums">{formatTRY(accumulated)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Net Defter Değeri</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono tabular-nums">{formatTRY(netBookValue)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Çıkış Türü *</label>
              <select
                value={disposalType}
                onChange={(e) => setDisposalType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                <option value="sale">Satış / Devir (Fatura Karşılığı)</option>
                <option value="scrap">Hurdaya Ayırma (Kullanım Dışı)</option>
                <option value="loss">Zayiat / Çalınma / Hasar</option>
                <option value="donation">Bağış / Bedelsiz Çıkış</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Çıkış Tarihi *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>
          </div>

          {(disposalType === "sale" || disposalType === "scrap") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {disposalType === "sale" ? "Satış Bedeli (KDV Hariç ₺) *" : "Hurda Satış Bedeli (₺)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice || ""}
                  onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-bold font-mono focus:ring-2 focus:ring-indigo-500 tabular-nums"
                  required={disposalType === "sale"}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fatura Numarası</label>
                <input
                  type="text"
                  placeholder="GIB2024000..."
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {disposalType === "sale" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Alıcı Firma / Kişi</label>
                <input
                  type="text"
                  placeholder="Alıcı Ünvanı"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Alıcı VKN / TCKN</label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="10 veya 11 Haneli"
                  value={buyerTaxId}
                  onChange={(e) => setBuyerTaxId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Real-time Profit / Loss Indicator */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              gainOrLoss >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
            }`}
          >
            <div>
              <span className="font-bold block">
                {gainOrLoss >= 0
                  ? "679 Diğer Olağandışı Gelir ve Kârlar"
                  : "689 Diğer Olağandışı Gider ve Zararlar"}
              </span>
              <span className="text-[11px] opacity-80">
                (Satış Bedeli {formatTRY(effectiveSale)} - Net Defter Değeri {formatTRY(netBookValue)})
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold block opacity-75">
                {gainOrLoss >= 0 ? "Net Kâr" : "Net Zarar / KKEG"}
              </span>
              <span className="text-sm font-extrabold font-mono tabular-nums">{formatTRY(Math.abs(gainOrLoss))}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Açıklama / Hurda Raporu</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Çıkış gerekçesi, yönetim kurulu kararı veya hurda tutanağı referansı..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              Bu işlem onaylandığında demirbaş aktif kullanım listesinden çıkarılacak ve defter kaydı
              kapatılacaktır.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
            >
              Çıkış İşlemini Onayla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

