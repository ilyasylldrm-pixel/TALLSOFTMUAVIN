import React, { useState, useEffect } from "react";
import { fetchTCMBExchangeRates, ExchangeRatesData } from "../services/exchangeRateService";
import { RefreshCw, TrendingUp, TrendingDown, Globe, CheckCircle2, Table, LayoutGrid } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { GeometricHoneycombBackground } from "./common/GeometricHoneycombBackground";

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
        className={`relative overflow-hidden rounded-xl p-4 sm:p-5 shadow-2xs border transition-all haze-module-entrance-bg ${className}`}
        style={{ borderColor: theme.cardBorder }}
      >
        <GeometricHoneycombBackground id="exchange-compact-geom" />
        <div className="relative z-10">
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs border"
              style={{ backgroundColor: "#eaedff", color: "#0f6bae", borderColor: "#c6cdff" }}
            >
              <Globe className="w-3.5 h-3.5 text-[#0f6bae]" />
              TCMB Günlük Döviz Kurları
            </span>
            {rateData?.isLive && (
              <span className="bg-emerald-50 text-[#0d7f56] border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#0d7f56]" />
                Merkez Bankası Canlı Akış
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-md border font-mono"
              style={{ backgroundColor: theme.pageBg, color: theme.pageTextMuted, borderColor: theme.cardBorder }}
            >
              {rateData?.lastUpdated ? `Güncelleme: ${rateData.lastUpdated}` : "Yükleniyor..."}
            </span>

            {allowToggle && (
              <button
                type="button"
                onClick={() => setIsCompact(false)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md border shadow-2xs transition-all cursor-pointer flex items-center gap-1 hover:bg-[#eaedff] text-[#131b2e]"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                title="Detaylı Tablo Görünümüne Geç"
              >
                <Table className="w-3.5 h-3.5 text-[#0f6bae]" />
                <span className="hidden sm:inline">Detaylı Tablo</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadRates}
              disabled={loading}
              className="p-1.5 rounded-md transition-all cursor-pointer border shadow-2xs disabled:opacity-50 hover:bg-[#eaedff]"
              style={{ backgroundColor: theme.cardBg, color: theme.pageText, borderColor: theme.cardBorder }}
              title="Kurları Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0f6bae] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rateData?.rates.map((rate) => (
            <div
              key={rate.code}
              className="border rounded-lg p-3.5 shadow-2xs transition-all group"
              style={{ backgroundColor: theme.pageBg, borderColor: theme.cardBorder }}
            >
              <div
                className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b"
                style={{ borderColor: theme.cardBorder }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[#eaedff] border border-[#c6cdff] text-[#0f6bae] font-bold text-sm flex items-center justify-center shrink-0">
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
                    <span className="text-[#0d7f56] font-bold text-[10px] inline-flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <TrendingUp className="w-3 h-3 text-[#0d7f56]" /> +%{rate.change.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#b91c1c] font-bold text-[10px] inline-flex items-center gap-0.5 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <TrendingDown className="w-3 h-3 text-[#b91c1c]" /> %{rate.change.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Both ALIŞ and SATIŞ prominently side by side */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div
                  className="border rounded-md p-2 transition-all"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.pageTextMuted }}>
                    DÖVİZ ALIŞ
                  </span>
                  <span className="font-mono font-bold text-xs" style={{ color: theme.pageText }}>
                    ₺{rate.buying.toFixed(4)}
                  </span>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 rounded-md p-2 transition-all">
                  <span className="block text-[10px] font-bold text-[#0d7f56] uppercase tracking-wider mb-0.5">
                    DÖVİZ SATIŞ
                  </span>
                  <span className="font-mono font-bold text-xs text-[#0d7f56]">
                    ₺{rate.selling.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  // Full detail view for Settings page & Homepage
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 border shadow-2xs space-y-4 haze-module-entrance-bg ${className}`}
      style={{ borderColor: theme.cardBorder }}
    >
      <GeometricHoneycombBackground id="exchange-detail-geom" />
      <div className="relative z-10 space-y-4">
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4"
        style={{ borderColor: theme.cardBorder }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#eaedff] text-[#0f6bae] border border-[#c6cdff] text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              TCMB Resmi Gösterge
            </span>
            {rateData?.isLive && (
              <span className="bg-emerald-50 text-[#0d7f56] border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#0d7f56]" />
                Merkez Bankası Güncel
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-editorial font-medium mt-1.5 flex items-center gap-2" style={{ color: theme.pageText }}>
            <Globe className="w-5 h-5 text-[#0f6bae]" />
            Merkez Bankası Günlük Döviz Kurları (USD, EUR, GBP)
          </h3>
          <p className="text-xs mt-0.5" style={{ color: theme.pageTextMuted }}>
            TCMB tarafından yayınlanan günlük döviz alış ve satış kurları sistem parametrelerine otomatize edilmiştir.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-md border font-mono"
            style={{ backgroundColor: theme.pageBg, color: theme.pageTextMuted, borderColor: theme.cardBorder }}
          >
            {rateData?.lastUpdated ? `Güncelleme: ${rateData.lastUpdated}` : "Yükleniyor..."}
          </span>

          {allowToggle && (
            <button
              type="button"
              onClick={() => setIsCompact(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 hover:bg-[#eaedff] text-[#131b2e]"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              title="Kompakt Görünüme Geç"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#0f6bae]" />
              <span className="hidden sm:inline">Kompakt Görünüm</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadRates}
            disabled={loading}
            className="bg-[#0f6bae] hover:bg-[#0a5287] text-white font-semibold text-xs px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Kurları Yenile</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[550px]">
          <thead>
            <tr
              className="border-b uppercase tracking-wider text-[11px] font-semibold"
              style={{ backgroundColor: "#f8fafc", borderColor: theme.cardBorder, color: "#414750" }}
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
              <tr key={rate.code} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-semibold flex items-center gap-2 font-mono tabular-nums" style={{ color: theme.pageText }}>
                  <span className="w-7 h-7 rounded-md bg-[#eaedff] border border-[#c6cdff] text-[#0f6bae] flex items-center justify-center font-bold font-mono tabular-nums">
                    {rate.symbol}
                  </span>
                  <span className="font-mono tabular-nums">{rate.code}</span>
                </td>
                <td className="p-3 font-medium font-mono tabular-nums" style={{ color: theme.pageText }}>{rate.name}</td>
                <td className="p-3 text-right font-mono tabular-nums font-semibold" style={{ color: theme.pageText }}>
                  ₺{rate.buying.toFixed(4)}
                </td>
                <td className="p-3 text-right font-mono tabular-nums font-semibold text-[#0d7f56]">
                  ₺{rate.selling.toFixed(4)}
                </td>
                <td className="p-3 text-right font-semibold font-mono tabular-nums">
                  {rate.change >= 0 ? (
                    <span className="text-[#0d7f56] inline-flex items-center gap-1 font-mono tabular-nums text-xs">
                      <TrendingUp className="w-3.5 h-3.5" /> +%{rate.change.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#b91c1c] inline-flex items-center gap-1 font-mono tabular-nums text-xs">
                      <TrendingDown className="w-3.5 h-3.5" /> %{rate.change.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center font-mono tabular-nums">
                  <span className="bg-emerald-50 text-[#0d7f56] border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                    Aktif Gösterge
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};
