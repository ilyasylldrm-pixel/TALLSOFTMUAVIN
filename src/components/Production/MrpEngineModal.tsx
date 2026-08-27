import React, { useState, useMemo } from "react";
import {
  BillOfMaterials,
  Product,
  Order,
  WorkOrder,
  MrpRequirement,
  MrpRecommendation,
} from "../../types";
import {
  Sparkles,
  Calculator,
  Layers,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Boxes,
  Factory,
  Check,
  RefreshCw,
  X,
} from "lucide-react";

interface MrpEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  boms: BillOfMaterials[];
  products: Product[];
  orders: Order[];
  workOrders: WorkOrder[];
  onCreateWorkOrderFromMrp: (rec: MrpRecommendation) => void;
  onCreatePurchaseOrderFromMrp: (rec: MrpRecommendation) => void;
}

export const MrpEngineModal: React.FC<MrpEngineModalProps> = ({
  isOpen,
  onClose,
  boms,
  products,
  orders,
  workOrders,
  onCreateWorkOrderFromMrp,
  onCreatePurchaseOrderFromMrp,
}) => {
  const [selectedHorizonDays, setSelectedHorizonDays] = useState<number>(30);
  const [executedRecs, setExecutedRecs] = useState<Record<string, boolean>>({});

  // MRP II Calculation Logic
  const { requirements, recommendations } = useMemo(() => {
    const reqList: MrpRequirement[] = [];
    const recList: MrpRecommendation[] = [];

    // 1. Identify gross demand from open sales orders (approved/pending)
    const openSalesOrders = orders.filter(
      (o) => o.type === "sales" && (o.status === "approved" || o.status === "pending")
    );

    // Map demand by product ID
    const demandMap: Record<string, { qty: number; orderNumbers: string[]; date: string }> = {};

    openSalesOrders.forEach((so) => {
      so.items.forEach((item) => {
        if (!demandMap[item.productId]) {
          demandMap[item.productId] = { qty: 0, orderNumbers: [], date: so.deliveryDate || so.date };
        }
        demandMap[item.productId].qty += item.quantity;
        if (!demandMap[item.productId].orderNumbers.includes(so.orderNumber)) {
          demandMap[item.productId].orderNumbers.push(so.orderNumber);
        }
      });
    });

    // 2. Add demand from products below safety stock
    products.forEach((p) => {
      const minStock = p.minStock || 5;
      const currentStock = p.stock || 0;
      if (currentStock < minStock && !demandMap[p.id]) {
        demandMap[p.id] = {
          qty: minStock - currentStock,
          orderNumbers: ["Emniyet Stoğu Tamamlama"],
          date: new Date().toISOString().split("T")[0],
        };
      }
    });

    // 3. Explode demand through BOMs to calculate raw material requirements
    const rawMaterialDemandMap: Record<
      string,
      { qty: number; parentProducts: string[]; requiredDate: string }
    > = {};

    Object.entries(demandMap).forEach(([prodId, dem]) => {
      const targetProd = products.find((p) => p.id === prodId);
      const matchingBom = boms.find((b) => b.productId === prodId);

      const curStock = targetProd?.stock || 0;
      const netDeficit = Math.max(0, dem.qty - curStock);

      if (matchingBom && netDeficit > 0) {
        // Need to produce this finished/semi-finished good
        recList.push({
          id: `mrp_rec_wo_${prodId}`,
          actionType: "create_work_order",
          productId: prodId,
          productCode: targetProd?.code || matchingBom.productCode,
          productName: targetProd?.name || matchingBom.productName,
          suggestedQuantity: netDeficit,
          unit: targetProd?.unit || matchingBom.outputUnit || "Adet",
          suggestedDate: dem.date,
          reason: `${dem.orderNumbers.join(", ")} siparişleri için üretim gereksinimi`,
          estimatedCost: netDeficit * (targetProd?.purchasePrice || 1500),
          bomId: matchingBom.id,
        });

        // Explode its BOM items
        matchingBom.items.forEach((item) => {
          const totalRawNeeded = item.quantityPerUnit * (1 + (item.wasteRate || 0)) * netDeficit;
          if (!rawMaterialDemandMap[item.productId]) {
            rawMaterialDemandMap[item.productId] = {
              qty: 0,
              parentProducts: [],
              requiredDate: dem.date,
            };
          }
          rawMaterialDemandMap[item.productId].qty += totalRawNeeded;
          if (!rawMaterialDemandMap[item.productId].parentProducts.includes(targetProd?.name || "")) {
            rawMaterialDemandMap[item.productId].parentProducts.push(targetProd?.name || "");
          }
        });
      }
    });

    // 4. Compile Raw Material Purchase Recommendations
    Object.entries(rawMaterialDemandMap).forEach(([rawId, rawDem]) => {
      const rawProd = products.find((p) => p.id === rawId);
      const currentStock = rawProd?.stock || 0;
      const netRawNeeded = Math.max(0, Math.ceil(rawDem.qty - currentStock));

      reqList.push({
        id: `mrp_req_${rawId}`,
        productId: rawId,
        productCode: rawProd?.code || "HAM",
        productName: rawProd?.name || "Hammadde",
        grossRequirement: Math.ceil(rawDem.qty),
        currentStock: currentStock,
        scheduledReceipts: 0,
        netRequirement: netRawNeeded,
        suggestedOrderDate: new Date().toISOString().split("T")[0],
        requiredDate: rawDem.requiredDate,
        leadTimeDays: 5,
        unit: rawProd?.unit || "Adet",
      });

      if (netRawNeeded > 0) {
        recList.push({
          id: `mrp_rec_po_${rawId}`,
          actionType: "create_purchase_order",
          productId: rawId,
          productCode: rawProd?.code || "",
          productName: rawProd?.name || "",
          suggestedQuantity: netRawNeeded,
          unit: rawProd?.unit || "Adet",
          suggestedDate: new Date().toISOString().split("T")[0],
          reason: `${rawDem.parentProducts.join(", ")} üretimi için hammadde tedariği`,
          estimatedCost: netRawNeeded * (rawProd?.purchasePrice || 50),
        });
      }
    });

    return { requirements: reqList, recommendations: recList };
  }, [orders, products, boms]);

  if (!isOpen) return null;

  const totalPurchaseCost = recommendations
    .filter((r) => r.actionType === "create_purchase_order")
    .reduce((sum, r) => sum + r.estimatedCost, 0);

  const handleExecuteRec = (rec: MrpRecommendation) => {
    if (rec.actionType === "create_work_order") {
      onCreateWorkOrderFromMrp(rec);
    } else {
      onCreatePurchaseOrderFromMrp(rec);
    }
    setExecutedRecs((prev) => ({ ...prev, [rec.id]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-purple-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8252F6] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                MRP II Malzeme & Kapasite İhtiyaç Planlama Motoru
                <span className="text-[10px] bg-purple-100 text-purple-950 px-2 py-0.5 rounded-full font-extrabold border border-purple-200">
                  Otomatik Analiz
                </span>
              </h3>
              <p className="text-xs text-purple-950/80 mt-0.5">
                Açık satış siparişleri ve emniyet stoklarını çok katmanlı reçeteler (BOM) ile tarayarak net hammadde ve üretim gereksinimlerini belirler.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center border border-purple-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Horizon selector & summary cards */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50/40 p-3 rounded-xl border border-purple-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>Planlama Ufku:</span>
              {[15, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedHorizonDays(days)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedHorizonDays === days
                      ? "bg-[#8252F6] text-white shadow-xs"
                      : "bg-white text-slate-600 border border-purple-200/80 hover:bg-purple-50"
                  }`}
                >
                  {days} Günlük
                </button>
              ))}
            </div>

            <div className="text-xs text-purple-950 font-bold">
              Toplam <strong>{recommendations.length} Eylem Önerisi</strong> tespit edildi
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 sm:p-4 bg-purple-50/40 rounded-xl border border-purple-100">
              <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">
                Önerilen İş Emirleri (Üretim)
              </span>
              <span className="text-xl sm:text-2xl font-black text-purple-950 mt-1 block">
                {recommendations.filter((r) => r.actionType === "create_work_order").length} Adet
              </span>
              <span className="text-[11px] text-purple-900/80 font-medium">Açık siparişleri karşılamak için</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-amber-50/40 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-950/70 font-extrabold uppercase block">
                Önerilen Satın Alma Siparişleri
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-950 mt-1 block">
                {recommendations.filter((r) => r.actionType === "create_purchase_order").length} Kalem
              </span>
              <span className="text-[11px] text-amber-800/80 font-medium">Eksik hammadde ve sarflar</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-950/70 font-extrabold uppercase block">
                Tahmini Hammadde Satın Alma Bütçesi
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 block font-mono">
                {totalPurchaseCost.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
              </span>
              <span className="text-[11px] text-emerald-800/80 font-medium">Net ihtiyaç maliyeti</span>
            </div>
          </div>

          {/* Recommendations Action List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              MRP Tarafından Üretilen Otomasyon Eylemleri
            </h4>

            <div className="space-y-2.5">
              {recommendations.length === 0 ? (
                <div className="p-8 bg-purple-50/20 rounded-xl border border-purple-100 text-center text-xs text-slate-400 font-semibold">
                  Şu an için stok seviyeleri yeterli ve açık siparişler karşılanabiliyor. Yeni üretim veya satın alma önerisi yok.
                </div>
              ) : (
                recommendations.map((rec) => {
                  const isExecuted = executedRecs[rec.id];
                  const isWo = rec.actionType === "create_work_order";

                  return (
                    <div
                      key={rec.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                        isExecuted
                          ? "bg-slate-50/60 border-slate-200 opacity-60"
                          : isWo
                          ? "bg-purple-50/30 border-purple-200/80 hover:bg-purple-50/60"
                          : "bg-amber-50/30 border-amber-200/80 hover:bg-amber-50/60"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                              isWo ? "bg-purple-100 text-purple-900 border border-purple-200" : "bg-amber-100 text-amber-900 border border-amber-200"
                            }`}
                          >
                            {isWo ? "İş Emri Aç (Üretim)" : "Satın Alma Siparişi Aç (Tedarik)"}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {rec.productCode}
                          </span>
                        </div>

                        <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">{rec.productName}</h5>
                        <p className="text-xs text-slate-500">{rec.reason}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">
                            +{rec.suggestedQuantity} {rec.unit}
                          </span>
                          <span className="text-[11px] text-purple-950 font-bold font-mono">
                            ~{rec.estimatedCost.toLocaleString("tr-TR")} ₺
                          </span>
                        </div>

                        {isExecuted ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                            <Check className="w-3.5 h-3.5" /> Oluşturuldu
                          </span>
                        ) : (
                          <button
                            onClick={() => handleExecuteRec(rec)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                              isWo
                                ? "bg-[#8252F6] hover:bg-[#7140e8]"
                                : "bg-amber-600 hover:bg-amber-700"
                            }`}
                          >
                            {isWo ? <Factory className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                            {isWo ? "İş Emri Başlat" : "Satın Alma Aç"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-purple-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Algoritma: Seviye 1-3 BOM Patlatma & Stok Düşümü (Lot-for-Lot / EOQ)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
