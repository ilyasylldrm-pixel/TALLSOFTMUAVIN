import React, { useState, useEffect } from "react";
import { fetchTCMBExchangeRates, ExchangeRatesData } from "../services/exchangeRateService";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Globe, CheckCircle2 } from "lucide-react";

interface ExchangeRatesWidgetProps {
  compact?: boolean; // If true, shows a horizontal ticker style; if false, shows full cards
  className?: string;
}

export const ExchangeRatesWidget: React.FC<ExchangeRatesWidgetProps> = ({
  compact = false,
  className = "",
}) => {
  const [rateData, setRateData] = useState<ExchangeRatesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  if (compact) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-purple-50/90 via-white/95 to-fuchsia-50/80 backdrop-blur-md rounded-2xl p-4.5 shadow-2xs border border-purple-200/70 ${className}`}>
        {/* Lila Bal Peteği Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.55'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.4' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.3'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.7' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.7' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-purple-200/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-purple-100/90 text-purple-900 border border-purple-200/80 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
              TCMB Günlük Döviz Kurları
            </span>
            {rateData?.isLive && (
              <span className="bg-emerald-100/90 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Merkez Bankası Canlı Akış
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-purple-900/80 bg-white/60 px-2.5 py-1 rounded-lg border border-purple-200/50">
              {rateData?.lastUpdated ? `Güncelleme: ${rateData.lastUpdated}` : "Yükleniyor..."}
            </span>
            <button
              type="button"
              onClick={loadRates}
              disabled={loading}
              className="p-1.5 hover:bg-purple-100/80 rounded-xl text-purple-700 hover:text-purple-950 transition-all cursor-pointer border border-purple-200/60 bg-white/80 shadow-2xs disabled:opacity-50"
              title="Kurları Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
            </button>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rateData?.rates.map((rate) => (
            <div
              key={rate.code}
              className="bg-white/95 hover:bg-white border border-purple-200/80 hover:border-purple-400/90 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all group cursor-default"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-purple-100/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100/90 border border-purple-300/80 text-purple-900 font-black text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    {rate.symbol}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1">
                      <span>{rate.code}</span>
                      <span className="text-[10px] font-bold text-slate-500">/ TRY</span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 line-clamp-1">{rate.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  {rate.change >= 0 ? (
                    <span className="text-emerald-700 font-extrabold text-[10px] inline-flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs">
                      <TrendingUp className="w-3 h-3 text-emerald-600" /> +%{rate.change.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-rose-700 font-extrabold text-[10px] inline-flex items-center gap-0.5 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/80 shadow-2xs">
                      <TrendingDown className="w-3 h-3 text-rose-600" /> %{rate.change.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Both ALIŞ and SATIŞ prominently side by side */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 transition-all">
                  <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                    DÖVİZ ALIŞ
                  </span>
                  <span className="font-mono font-black text-xs text-slate-900">
                    ₺{rate.buying.toFixed(4)}
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2 transition-all">
                  <span className="block text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider mb-0.5">
                    DÖVİZ SATIŞ
                  </span>
                  <span className="font-mono font-black text-xs text-emerald-800">
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
    <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              TCMB Resmi Gösterge
            </span>
            {rateData?.isLive && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Merkez Bankası Güncel
              </span>
            )}
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            Merkez Bankası Günlük Döviz Kurları (USD, EUR, GBP)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            TCMB tarafından yayınlanan günlük döviz alış ve satış kurları sistem parametrelerine otomatize edilmiştir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {rateData?.lastUpdated ? `Güncelleme: ${rateData.lastUpdated}` : "Yükleniyor..."}
          </span>
          <button
            type="button"
            onClick={loadRates}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Kurları Yenile</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3">Para Birimi kodu</th>
              <th className="p-3">Döviz Cinsi</th>
              <th className="p-3 text-right">Döviz Alış (₺)</th>
              <th className="p-3 text-right">Döviz Satış (₺)</th>
              <th className="p-3 text-right">Günlük Değişim</th>
              <th className="p-3 text-center">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
            {rateData?.rates.map((rate) => (
              <tr key={rate.code} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                    {rate.symbol}
                  </span>
                  <span>{rate.code}</span>
                </td>
                <td className="p-3 font-bold text-slate-700">{rate.name}</td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">
                  ₺{rate.buying.toFixed(4)}
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-emerald-700">
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
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
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
