import React, { useState, useMemo } from "react";
import { BillOfMaterials, BillOfMaterialItem, Product, Routing } from "../../types";
import {
  Boxes,
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Calculator,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  Wrench,
  Percent,
  X,
} from "lucide-react";

interface BomManagementProps {
  boms: BillOfMaterials[];
  products: Product[];
  routings: Routing[];
  onSaveBom: (bom: BillOfMaterials) => void;
  onDeleteBom: (bomId: string) => void;
}

export const BomManagement: React.FC<BomManagementProps> = ({
  boms,
  products,
  routings,
  onSaveBom,
  onDeleteBom,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBom, setSelectedBom] = useState<BillOfMaterials | null>(boms[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Form State
  const [editingBom, setEditingBom] = useState<Partial<BillOfMaterials>>({
    bomCode: "",
    revision: 1,
    name: "",
    productId: "",
    productCode: "",
    productName: "",
    outputQuantity: 1,
    outputUnit: "Adet",
    yieldRate: 0.98,
    laborHoursPerUnit: 0.5,
    laborHourlyRate: 250,
    overheadCostPerUnit: 80,
    isActive: true,
    isDefault: true,
    items: [],
  });

  const filteredBoms = useMemo(() => {
    return boms.filter(
      (b) =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [boms, searchTerm]);

  // Total BOM Item Raw Material Cost
  const calculateTotalBomRawCost = (bom: BillOfMaterials) => {
    return bom.items.reduce((sum, item) => {
      const quantityWithWaste = item.quantityPerUnit * (1 + (item.wasteRate || 0));
      return sum + quantityWithWaste * item.unitCost;
    }, 0);
  };

  const calculateTotalUnitCost = (bom: BillOfMaterials) => {
    const rawCost = calculateTotalBomRawCost(bom);
    const laborCost = (bom.laborHoursPerUnit || 0) * (bom.laborHourlyRate || 0);
    const overhead = bom.overheadCostPerUnit || 0;
    return rawCost + laborCost + overhead;
  };

  const handleOpenCreateModal = () => {
    const code = `BOM-${new Date().getFullYear()}-${String(boms.length + 1).padStart(3, "0")}`;
    setEditingBom({
      id: "bom_" + Date.now(),
      bomCode: code,
      revision: 1,
      name: "",
      productId: products[0]?.id || "",
      productCode: products[0]?.code || "",
      productName: products[0]?.name || "",
      outputQuantity: 1,
      outputUnit: "Adet",
      yieldRate: 0.98,
      laborHoursPerUnit: 0.5,
      laborHourlyRate: 250,
      overheadCostPerUnit: 80,
      isActive: true,
      isDefault: true,
      createdAt: new Date().toISOString().split("T")[0],
      items: [],
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bom: BillOfMaterials) => {
    setEditingBom(JSON.parse(JSON.stringify(bom)));
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleAddItemToEditing = () => {
    const newItem: BillOfMaterialItem = {
      id: "bomi_" + Date.now(),
      type: "raw_material",
      productId: products[0]?.id || "",
      productCode: products[0]?.code || "HAM-001",
      productName: products[0]?.name || "Hammadde",
      quantityPerUnit: 1,
      unit: "Adet",
      wasteRate: 0.05,
      unitCost: products[0]?.purchasePrice || 50,
    };
    setEditingBom((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setEditingBom((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof BillOfMaterialItem, val: any) => {
    setEditingBom((prev) => {
      const updated = [...(prev.items || [])];
      updated[index] = { ...updated[index], [field]: val };

      // If productId changed, auto-fill name, code, cost
      if (field === "productId") {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          updated[index].productName = prod.name;
          updated[index].productCode = prod.code;
          updated[index].unitCost = prod.purchasePrice || updated[index].unitCost || 0;
          updated[index].unit = prod.unit || "Adet";
        }
      }
      return { ...prev, items: updated };
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBom.bomCode || !editingBom.name || !editingBom.productId) return;

    const finalBom = editingBom as BillOfMaterials;
    onSaveBom(finalBom);
    setSelectedBom(finalBom);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Reçete kodu, adı veya mamul ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-white font-bold" />
          <span>Yeni Reçete Tanımla</span>
        </button>
      </div>

      {/* Main Content Layout: BOM List on Left, Detailed Explosion & Cost Tree on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Side: BOM Catalog List (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-2xl border border-purple-200/60 p-1.5 sm:p-3 shadow-2xs flex flex-col">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900">Kayıtlı Reçeteler ({filteredBoms.length})</span>
            <span className="text-[10px] text-purple-900/70 font-semibold">Aktif Sürümler</span>
          </div>

          <div className="space-y-2 p-1 overflow-y-auto max-h-[640px] custom-scrollbar">
            {filteredBoms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-purple-100 text-xs">
                Reçete bulunamadı.
              </div>
            ) : (
              filteredBoms.map((bom) => {
                const isSelected = selectedBom?.id === bom.id;
                const totalCost = calculateTotalUnitCost(bom);

                return (
                  <div
                    key={bom.id}
                    onClick={() => setSelectedBom(bom)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-white border-purple-400 shadow-md ring-2 ring-purple-500/20"
                        : "bg-white hover:bg-purple-50/40 border-purple-100/80 shadow-2xs hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                            {bom.bomCode}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                            v{bom.revision || 1}
                          </span>
                          {bom.isDefault && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                              Varsayılan
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1.5 line-clamp-1">
                          {bom.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {bom.productName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-purple-100/60">
                      <span className="text-[11px] font-medium">{bom.items.length} Kalem Bileşen</span>
                      <span className="font-extrabold text-purple-950">
                        {totalCost.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺ / {bom.outputUnit}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected BOM Detailed Tree & Cost Breakdown (8 Cols) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {selectedBom ? (
            <>
              {/* Selected BOM Header & Action Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                        {selectedBom.bomCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Revizyon: {selectedBom.revision || 1}</span>
                      <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                        Aktif Üretim Reçetesi
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">{selectedBom.name}</h3>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                      <span><strong>Çıktı Mamul:</strong> {selectedBom.productName} ({selectedBom.productCode})</span>
                      <span><strong>Parti Boyutu:</strong> {selectedBom.outputQuantity} {selectedBom.outputUnit}</span>
                      <span><strong>Genel Verim Oranı:</strong> %{Math.round((selectedBom.yieldRate || 1) * 100)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(selectedBom)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${selectedBom.name}" reçetesini silmek istediğinize emin misiniz?`)) {
                          onDeleteBom(selectedBom.id);
                          setSelectedBom(boms.find((b) => b.id !== selectedBom.id) || null);
                        }
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sil</span>
                    </button>
                  </div>
                </div>

                {/* Cost Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-purple-100">
                  <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Hammadde & Malzeme</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {calculateTotalBomRawCost(selectedBom).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Direkt İşçilik</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {((selectedBom.laborHoursPerUnit || 0) * (selectedBom.laborHourlyRate || 0)).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{selectedBom.laborHoursPerUnit} sa × {selectedBom.laborHourlyRate} ₺</span>
                  </div>
                  <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Genel İmalat Gideri</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {(selectedBom.overheadCostPerUnit || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                  <div className="p-3 bg-purple-100/70 border border-purple-300/80 rounded-xl">
                    <span className="text-[10px] text-purple-900 font-extrabold uppercase block">Toplam Birim Maliyet</span>
                    <span className="text-sm sm:text-base font-black text-purple-950">
                      {calculateTotalUnitCost(selectedBom).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                    </span>
                    <span className="text-[9px] text-purple-800 font-bold block">/ 1 {selectedBom.outputUnit}</span>
                  </div>
                </div>
              </div>

              {/* Multi-level BOM Items Table */}
              <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-1.5 sm:p-3 shadow-2xs overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      Reçete Kalemleri & Sarfiyat Ağacı ({selectedBom.items.length} Bileşen)
                    </h4>
                  </div>
                  <span className="text-[11px] text-purple-900/70 font-semibold">Fire Oranları Dahil Net İhtiyaç</span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">
                        <th className="pb-2 px-3">Tip</th>
                        <th className="pb-2 px-3">Bileşen Kodu & Adı</th>
                        <th className="pb-2 px-3 text-right">Net Miktar</th>
                        <th className="pb-2 px-3 text-center">Fire (%)</th>
                        <th className="pb-2 px-3 text-right">Brüt Sarfiyat</th>
                        <th className="pb-2 px-3 text-right">Birim Fiyat</th>
                        <th className="pb-2 px-3 text-right">Toplam Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBom.items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100">
                            Reçetede kayıtlı bileşen bulunmuyor.
                          </td>
                        </tr>
                      ) : (
                        selectedBom.items.map((item, idx) => {
                          const wasteRate = item.wasteRate || 0;
                          const grossQty = item.quantityPerUnit * (1 + wasteRate);
                          const itemTotal = grossQty * item.unitCost;

                          return (
                            <tr
                              key={item.id || idx}
                              className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-xs transition-all group rounded-xl"
                            >
                              <td className="py-2.5 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                    item.type === "raw_material"
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : item.type === "semi_finished"
                                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                                      : item.type === "packaging"
                                      ? "bg-purple-50 text-purple-800 border border-purple-200"
                                      : "bg-slate-100 text-slate-800 border border-slate-200"
                                  }`}
                                >
                                  {item.type === "raw_material"
                                    ? "Hammadde"
                                    : item.type === "semi_finished"
                                    ? "Yarı Mamul"
                                    : item.type === "packaging"
                                    ? "Ambalaj"
                                    : "Sarf"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 border-y border-purple-200/50 group-hover:border-purple-300">
                                <div className="font-extrabold text-slate-900 group-hover:text-purple-950 transition-colors">
                                  {item.productName}
                                </div>
                                <div className="text-[10px] text-purple-900/70 font-mono font-bold">{item.productCode}</div>
                                {item.notes && <div className="text-[10px] text-slate-400 italic">{item.notes}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300">
                                {item.quantityPerUnit} {item.unit}
                              </td>
                              <td className="py-2.5 px-3 text-center border-y border-purple-200/50 group-hover:border-purple-300">
                                <span className="text-rose-600 font-bold">
                                  %{Math.round(wasteRate * 100)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 border-y border-purple-200/50 group-hover:border-purple-300">
                                {grossQty.toFixed(2)} {item.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 font-mono border-y border-purple-200/50 group-hover:border-purple-300">
                                {item.unitCost.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-purple-950 font-mono rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300">
                                {itemTotal.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-purple-200/60 p-12 text-center text-slate-400 text-xs font-semibold">
              Detayları görüntülemek için soldaki listeden bir reçete seçin.
            </div>
          )}
        </div>
      </div>

      {/* Reçete Ekleme / Düzenleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-purple-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {modalMode === "create" ? "Yeni Ürün Reçetesi (BOM) Tanımla" : "Reçeteyi Düzenle"}
                </h3>
                <p className="text-xs text-purple-950/80 mt-0.5">
                  Ürünün bileşenleri, fire oranları ve standart işçilik parametreleri.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center border border-purple-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Top Meta Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reçete Kodu *</label>
                  <input
                    type="text"
                    required
                    value={editingBom.bomCode || ""}
                    onChange={(e) => setEditingBom({ ...editingBom, bomCode: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reçete Başlığı / Tanımı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Standart İmalat Reçetesi"
                    value={editingBom.name || ""}
                    onChange={(e) => setEditingBom({ ...editingBom, name: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hedef Ürün (Mamul)</label>
                  <select
                    value={editingBom.productId || ""}
                    onChange={(e) => {
                      const prod = products.find((p) => p.id === e.target.value);
                      setEditingBom({
                        ...editingBom,
                        productId: e.target.value,
                        productName: prod?.name || "",
                        productCode: prod?.code || "",
                      });
                    }}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İşçilik Süresi (Saat/Birim)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingBom.laborHoursPerUnit || 0}
                    onChange={(e) => setEditingBom({ ...editingBom, laborHoursPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İşçilik Saat Ücreti (₺)</label>
                  <input
                    type="number"
                    value={editingBom.laborHourlyRate || 0}
                    onChange={(e) => setEditingBom({ ...editingBom, laborHourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-900">
                    Reçete Bileşenleri (Hammadde, Yarı Mamul, Sarf)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemToEditing}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-700" />
                    <span>Kalem Ekle</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-purple-200/60 custom-scrollbar">
                  {(editingBom.items || []).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs bg-white rounded-lg border border-purple-100">
                      Henüz bileşen eklenmedi. "Kalem Ekle" butonuna tıklayın.
                    </div>
                  ) : (
                    editingBom.items?.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-white p-2.5 sm:p-3 rounded-xl border border-purple-100 grid grid-cols-12 gap-2 items-center text-xs shadow-2xs"
                      >
                        <div className="col-span-3">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Stok Kartı</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-purple-200 bg-white"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Tip</label>
                          <select
                            value={item.type}
                            onChange={(e) => handleItemChange(idx, "type", e.target.value)}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-purple-200 bg-white font-medium"
                          >
                            <option value="raw_material">Hammadde</option>
                            <option value="semi_finished">Yarı Mamul</option>
                            <option value="consumable">Sarf Malzeme</option>
                            <option value="packaging">Ambalaj</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Miktar</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantityPerUnit}
                              onChange={(e) => handleItemChange(idx, "quantityPerUnit", parseFloat(e.target.value) || 0)}
                              className="w-full text-[11px] p-1.5 rounded-lg border border-purple-200 font-semibold"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Fire (%)</label>
                          <input
                            type="number"
                            step="1"
                            value={Math.round((item.wasteRate || 0) * 100)}
                            onChange={(e) => handleItemChange(idx, "wasteRate", (parseFloat(e.target.value) || 0) / 100)}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-purple-200 text-rose-600 font-bold"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Birim Maliyet (₺)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => handleItemChange(idx, "unitCost", parseFloat(e.target.value) || 0)}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-purple-200 font-mono font-bold"
                          />
                        </div>

                        <div className="col-span-1 text-center pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2 px-5 rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
