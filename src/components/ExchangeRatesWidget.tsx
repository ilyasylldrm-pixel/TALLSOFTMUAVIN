import React, { useState, useEffect } from "react";
import { fetchTCMBExchangeRates, ExchangeRatesData } from "../services/exchangeRateService";
import { RefreshCw, TrendingUp, TrendingDown, Globe, CheckCircle2, Table, LayoutGrid } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ExchangeRatesWidgetProps {
  compact?: boolean; // Default display mode
  className?: string;
  allowToggle?: boolean;
}

export const ExchangeRatesWidget: React.FC<ExchangeRatesWidgetProps> = ({
  compact = true,
  className = "",
  allowToggle = true,
}) => {
  const { theme } = useTheme();
  const [rateData, setRateData] = useState<ExchangeRatesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCompact, setIsCompact] = useState<boolean>(compact);

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await fetchTCMBExchangeRates();
      setRateData(data);
    } catch (e) {
      console.error("Error loading rates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  if (isCompact) {
    return (
      <div
        className={`rounded-2xl p-4.5 shadow-2xs border transition-all ${className}`}
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-2xs border"
              style={{ backgroundColor: theme.cardBgHover, color: theme.pageText, borderColor: theme.cardBorder }}
            >
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              TCMB Günlük Döviz Kurları
            </span>
            {rateData?.isLive && (
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Merkez Bankası Canlı Akış
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg border"
              style={{ backgroundColor: theme.pageBg, color: theme.pageTextMuted, borderColor: theme.cardBorder }}
            >
              {rateData?.lastUpdated ? `Güncelleme: ${rateData.lastUpdated}` : "Yükleniyor..."}
            </span>

            {allowToggle && (
              <button
                type="button"
                onClick={() => setIsCompact(false)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-xl border shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                style={{ backgroundColor: theme.cardBgHover, color: theme.pageText, borderColor: theme.cardBorder }}
                title="Detaylı Tablo Görünümüne Geç"
              >
                <Table className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Detaylı Tablo</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadRates}
              disabled={loading}
              className="p-1.5 rounded-xl transition-all cursor-pointer border shadow-2xs disabled:opacity-50"
              style={{ backgroundColor: theme.cardBgHover, color: theme.pageText, borderColor: theme.cardBorder }}
              title="Kurları Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rateData?.rates.map((rate) => (
            <div
              key={rate.code}
              className="border rounded-2xl p-3.5 shadow-2xs transition-all group"
              style={{ backgroundColor: theme.pageBg, borderColor: theme.cardBorder }}
            >
              <div
                className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b"
                style={{ borderColor: theme.cardBorder }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 font-bold text-sm flex items-center justify-center shrink-0">
                    {rate.symbol}
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-tight flex items-center gap-1" style={{ color: theme.pageText }}>
                      <span>{rate.code}</span>
                      <span className="text-[10px] font-medium" style={{ color: theme.pageTextMuted }}>/ TRY</span>
                    </div>
                    <div className="text-[10px] font-medium line-clamp-1" style={{ color: theme.pageTextMuted }}>{rate.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  {rate.change >= 0 ? (
                    <span className="text-emerald-600 font-bold text-[10px] inline-flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3 text-emerald-600" /> +%{rate.change.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold text-[10px] inline-flex items-center gap-0.5 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <TrendingDown className="w-3 h-3 text-rose-600" /> %{rate.change.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Both ALIŞ and SATIŞ prominently side by side */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div
                  className="border rounded-xl p-2 transition-all"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.pageTextMuted }}>
                    DÖVİZ ALIŞ
                  </span>
                  <span className="font-mono font-bold text-xs" style={{ color: theme.pageText }}>
                    ₺{rate.buying.toFixed(4)}
                  </span>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2 transition-all">
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                    DÖVİZ SATIŞ
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-600">
                    ₺{rate.selling.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full detail view for Settings page
  return (
    <div
      className={`rounded-2xl p-6 border shadow-xs space-y-4 ${className}`}
      style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
    >
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4"
        style={{ borderColor: theme.cardBorder }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-600 border border-purple-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              TCMB Resmi Gösterge
            </span>
            {rateData?.isLive && (
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Merkez Bankası Güncel
              </span>
            )}
          </div>
          <h3 className="text-base font-bold mt-1 flex items-center gap-2" style={{ color: theme.pageText }}>
            <Globe className="w-5 h-5 text-purple-600" />
            Merkez Bankası Günlük Döviz Kurları (USD, EUR, GBP)
          </h3>
          <p className="text-xs mt-0.5" style={{ color: theme.pageTextMuted }}>
            TCMB tarafından yayınlanan günlük döviz alış ve satış kurları sistem parametrelerine otomatize edilmiştir.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-xl border"
            style={{ backgroundColor: theme.pageBg, color: theme.pageTextMuted, borderColor: theme.cardBorder }}
          >
            {rateData?.lastUpdated ? `Güncelleme: ${rateData.lastUpdated}` : "Yükleniyor..."}
          </span>

          {allowToggle && (
            <button
              type="button"
              onClick={() => setIsCompact(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: theme.cardBgHover, color: theme.pageText, borderColor: theme.cardBorder }}
              title="Kompakt Görünüme Geç"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Kompakt Görünüm</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadRates}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Kurları Yenile</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className="border-b uppercase tracking-wider"
              style={{ backgroundColor: theme.cardBgHover, borderColor: theme.cardBorder, color: theme.pageTextMuted }}
            >
              <th className="p-3">Para Birimi kodu</th>
              <th className="p-3">Döviz Cinsi</th>
              <th className="p-3 text-right">Döviz Alış (₺)</th>
              <th className="p-3 text-right">Döviz Satış (₺)</th>
              <th className="p-3 text-right">Günlük Değişim</th>
              <th className="p-3 text-center">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium" style={{ borderColor: theme.cardBorder, color: theme.pageText }}>
            {rateData?.rates.map((rate) => (
              <tr key={rate.code} className="hover:bg-slate-500/5 transition-colors">
                <td className="p-3 font-bold flex items-center gap-2" style={{ color: theme.pageText }}>
                  <span className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
                    {rate.symbol}
                  </span>
                  <span>{rate.code}</span>
                </td>
                <td className="p-3 font-medium" style={{ color: theme.pageText }}>{rate.name}</td>
                <td className="p-3 text-right font-mono font-bold" style={{ color: theme.pageText }}>
                  ₺{rate.buying.toFixed(4)}
                </td>
                <td className="p-3 text-right font-mono font-bold text-emerald-600">
                  ₺{rate.selling.toFixed(4)}
                </td>
                <td className="p-3 text-right font-bold">
                  {rate.change >= 0 ? (
                    <span className="text-emerald-600 inline-flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> +%{rate.change.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-rose-600 inline-flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> %{rate.change.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Aktif Gösterge
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
