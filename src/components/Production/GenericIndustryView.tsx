import React from "react";
import {
  Factory,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Boxes,
  Cpu,
  Settings,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { IndustrySector } from "../../types";

interface GenericIndustryViewProps {
  sector: IndustrySector;
  onSwitchToCatering: () => void;
  onNavigateToSectors: () => void;
}

export const GenericIndustryView: React.FC<GenericIndustryViewProps> = ({
  sector,
  onSwitchToCatering,
  onNavigateToSectors,
}) => {
  return (
    <div className="space-y-6">
      {/* Sektör Bilgi Bandı */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{sector.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {sector.shortCode} Sektörü
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{sector.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToCatering}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Yemek Fabrikası Modülüne Geç</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavigateToSectors}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Sektör Ayarları
            </button>
          </div>
        </div>
      </div>

      {/* Sektöre Özel İş Akış Adımları */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Sektörel İmalat ve İstasyon Akışı</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(sector.workflowStages || []).map((stage, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold text-2xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-800 text-xs">{stage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sektör Özellikleri ve Örnek Mamuller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modül Yetenekleri */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sektörel Yetenekler ve Fonksiyonlar</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {(sector.features || []).map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Örnek Mamuller */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-600" />
            <span>Örnek Mamul ve Ürün Tipleri</span>
          </h3>
          <div className="space-y-2">
            {(sector.sampleItems || []).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between"
              >
                <span>{item}</span>
                <span className="text-2xs font-mono text-slate-400">Standart BOM</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
