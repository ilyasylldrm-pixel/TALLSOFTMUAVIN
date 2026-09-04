import React, { useState } from "react";
import {
  Layers,
  Factory,
  UtensilsCrossed,
  Scissors,
  Armchair,
  Wrench,
  Boxes,
  FlaskConical,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  Settings,
  X,
} from "lucide-react";
import { IndustrySector } from "../../types";
import { saveStoredData } from "../../utils/storage";

interface SectorsModuleProps {
  sectors: IndustrySector[];
  activeSectorId: string;
  onSelectActiveSector: (sectorId: string) => void;
  onNavigateToProduction: () => void;
  onUpdateSectors: (sectors: IndustrySector[], activeId: string) => void;
}

export const SectorsModule: React.FC<SectorsModuleProps> = ({
  sectors: initialSectors,
  activeSectorId: initialActiveId,
  onSelectActiveSector,
  onNavigateToProduction,
  onUpdateSectors,
}) => {
  const [sectors, setSectors] = useState<IndustrySector[]>(initialSectors);
  const [activeSectorId, setActiveSectorId] = useState<string>(initialActiveId || "catering");
  const [isNewSectorModalOpen, setIsNewSectorModalOpen] = useState(false);

  // New Sector Form
  const [newSectorName, setNewSectorName] = useState("");
  const [newSectorCode, setNewSectorCode] = useState("");
  const [newSectorDesc, setNewSectorDesc] = useState("");
  const [newSectorStages, setNewSectorStages] = useState("Tasarım & Planlama, Hammadde Tedarik, İmalat / İşleme, Kalite Kontrol, Paketleme, Sevkiyat");

  const getSectorIcon = (iconName: string) => {
    switch (iconName) {
      case "UtensilsCrossed":
        return UtensilsCrossed;
      case "Scissors":
        return Scissors;
      case "Armchair":
        return Armchair;
      case "Wrench":
        return Wrench;
      case "Boxes":
        return Boxes;
      case "FlaskConical":
        return FlaskConical;
      default:
        return Factory;
    }
  };

  const handleActivate = (sectorId: string) => {
    setActiveSectorId(sectorId);
    saveStoredData("ACTIVE_SECTOR", sectorId);
    onSelectActiveSector(sectorId);
    onUpdateSectors(sectors, sectorId);
  };

  const handleCreateSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;

    const stages = newSectorStages.split(",").map((s) => s.trim()).filter(Boolean);

    const newSec: IndustrySector = {
      id: `sec_${Date.now()}`,
      name: newSectorName,
      shortCode: newSectorCode || "ÖZL",
      icon: "Factory",
      badgeColor: "emerald",
      description: newSectorDesc || "Özel üretim ve imalat iş akışı.",
      isActive: false,
      features: [
        "Sektörel reçete ve ürün ağacı",
        "İstasyon ve makine iş emirleri",
        "Hammadde sarfiyat ve fire takibi",
      ],
      workflowStages: stages.length > 0 ? stages : ["Hammadde", "İşleme", "Montaj", "Kalite", "Sevk"],
      sampleItems: ["Özel İmalat Ürünü A", "Özel İmalat Ürünü B"],
    };

    const updated = [...sectors, newSec];
    setSectors(updated);
    saveStoredData("SECTORS", updated);
    onUpdateSectors(updated, activeSectorId);
    setIsNewSectorModalOpen(false);
    setNewSectorName("");
    setNewSectorCode("");
    setNewSectorDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Üst Karşılama ve Açıklama */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Sektörel Üretim Mimarisi</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Sektör Yönetimi & Özelleştirme
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Her sektörün kendine has reçete yapısı, istasyonları, hammadde birimleri ve sevkiyat şekilleri vardır. Aktif sektörü seçerek Üretim modülünü firmanıza özel hale getirin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsNewSectorModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Sektör Tanımla</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToProduction}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Üretim Modülüne Git</span>
              <ArrowRight className="w-4 h-4 text-indigo-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Sektör Kartları Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sectors.map((sec) => {
          const isCurrentActive = sec.id === activeSectorId;
          const IconComp = getSectorIcon(sec.icon);

          return (
            <div
              key={sec.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                isCurrentActive
                  ? "border-amber-400 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/20 to-white"
                  : "border-slate-200"
              }`}
            >
              <div>
                {/* Üst İkon ve Rozet */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                        isCurrentActive
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{sec.name}</h3>
                      </div>
                      <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border">
                        Kod: {sec.shortCode}
                      </span>
                    </div>
                  </div>

                  {isCurrentActive && (
                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-amber-700" />
                      <span>Aktif Sektör</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">{sec.description}</p>

                {/* İş Akış Aşamaları */}
                <div className="mt-4 space-y-2">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    İş Akış & İstasyon Süreçleri ({sec.workflowStages.length} Aşama)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sec.workflowStages.map((st, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-2xs font-medium"
                      >
                        {idx + 1}. {st}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Yetenekler */}
                <div className="mt-3.5 space-y-1.5">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Öne Çıkan Özellikler
                  </span>
                  <ul className="space-y-1 text-2xs text-slate-600">
                    {sec.features.slice(0, 3).map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 truncate">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Alt Eylem Butonu */}
              <div className="pt-3 border-t border-slate-100">
                {isCurrentActive ? (
                  <button
                    type="button"
                    onClick={onNavigateToProduction}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Üretim Modülünü Aç</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleActivate(sec.id)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Bu Sektörü Aktif Yap</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Yeni Sektör Ekleme Modalı */}
      {isNewSectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Yeni Üretim Sektörü Tanımla</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSectorModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSector} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sektör Adı</label>
                <input
                  type="text"
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  placeholder="Örn: Ayakkabı & Deri İmalatı, Cam & Seramik..."
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kısa Kod (3 Harf)</label>
                <input
                  type="text"
                  value={newSectorCode}
                  onChange={(e) => setNewSectorCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="Örn: AYK"
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sektör Açıklaması & Kapsam</label>
                <textarea
                  value={newSectorDesc}
                  onChange={(e) => setNewSectorDesc(e.target.value)}
                  rows={2}
                  placeholder="Üretim yöntemi ve süreçleri..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  İş Akış İstasyonları (Virgülle ayırın)
                </label>
                <textarea
                  value={newSectorStages}
                  onChange={(e) => setNewSectorStages(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewSectorModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Sektörü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
