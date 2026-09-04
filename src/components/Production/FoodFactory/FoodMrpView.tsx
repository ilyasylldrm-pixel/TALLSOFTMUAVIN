import React, { useState } from "react";
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Package,
  ArrowRight,
  TrendingDown,
  Warehouse,
} from "lucide-react";
import { FoodProductionOrder, Product } from "../../../types";
import { formatCurrency } from "../../../utils/exportUtils";

interface FoodMrpViewProps {
  orders: FoodProductionOrder[];
  products: Product[];
  onIssueWarehouseVoucher?: (rawMaterials: any[]) => void;
}

export const FoodMrpView: React.FC<FoodMrpViewProps> = ({
  orders,
  products,
  onIssueWarehouseVoucher,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isVoucherIssued, setIsVoucherIssued] = useState(false);

  // Filter orders
  const activeOrders = orders.filter((o) => o.status !== "completed");
  const ordersToCalculate =
    selectedOrderId === "all"
      ? activeOrders
      : orders.filter((o) => o.id === selectedOrderId);

  // Aggregate required raw materials
  const aggregatedMaterialsMap: Record<
    string,
    {
      name: string;
      unit: string;
      requiredQty: number;
      unitCost: number;
      currentStock: number;
    }
  > = {};

  ordersToCalculate.forEach((order) => {
    order.ingredientsRequired?.forEach((ing) => {
      const key = ing.productName.toLowerCase();
      if (!aggregatedMaterialsMap[key]) {
        // Look up in products if possible
        const matchingProduct = products.find(
          (p) => p.name.toLowerCase().includes(ing.productName.toLowerCase()) || ing.productName.toLowerCase().includes(p.name.toLowerCase())
        );
        const stock = matchingProduct ? matchingProduct.stock : ing.currentStock || 100;

        aggregatedMaterialsMap[key] = {
          name: ing.productName,
          unit: ing.unit,
          requiredQty: 0,
          unitCost: ing.unitCost,
          currentStock: stock,
        };
      }
      aggregatedMaterialsMap[key].requiredQty += ing.totalAmount;
    });
  });

  const materialList = Object.values(aggregatedMaterialsMap).filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCost = materialList.reduce((sum, m) => sum + m.requiredQty * m.unitCost, 0);

  const handleCreateVoucher = () => {
    setIsVoucherIssued(true);
    if (onIssueWarehouseVoucher) {
      onIssueWarehouseVoucher(materialList);
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Buton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            <span>Hammadde İhtiyaç Planlaması (MRP) & Depo Çıkışı</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Üretilecek toplam porsiyonlara göre depodan çıkması gereken et, bakliyat, yağ, sebze miktarları ve anlık stok kontrolü.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCreateVoucher}
            disabled={isVoucherIssued || materialList.length === 0}
            className={`font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
              isVoucherIssued
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-amber-600 hover:bg-amber-700 text-white active:scale-95"
            }`}
          >
            {isVoucherIssued ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mutfak Sarf Fişi Kesildi</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>Depodan Mutfak Sarf Fişi Kes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filtre ve Arama */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Hammadde adı ara (örn: dana, mercimek, pirinç)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Tüm Aktif İş Emirleri ({activeOrders.length})</option>
            {activeOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo} - {o.totalPortions} Porsiyon ({o.mealType === "lunch" ? "Öğle" : "Akşam"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MRP Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-2xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Hammadde & Malzeme</th>
                <th className="py-3 px-4 text-center">Birim</th>
                <th className="py-3 px-4 text-right">Gereken Miktar (Üretim)</th>
                <th className="py-3 px-4 text-right">Depodaki Mevcut</th>
                <th className="py-3 px-4 text-center">Stok Durumu</th>
                <th className="py-3 px-4 text-right">Birim Fiyat</th>
                <th className="py-3 px-4 text-right">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materialList.map((item, idx) => {
                const isShortage = item.currentStock < item.requiredQty;
                const balanceAfter = item.currentStock - item.requiredQty;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 uppercase font-mono text-xs">
                      {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-900 text-sm">
                      {item.requiredQty.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">
                      {item.currentStock.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isShortage ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Eksik (-{Math.abs(balanceAfter).toFixed(1)})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Yeterli (Kalan: {balanceAfter.toFixed(1)})</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono text-xs">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(item.requiredQty * item.unitCost)}
                    </td>
                  </tr>
                );
              })}

              {materialList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Hesaplanacak hammadde verisi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
            {materialList.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs sm:text-sm">
                  <td colSpan={6} className="py-3.5 px-4 text-right">
                    Toplam Hammadde Sarf Maliyeti:
                  </td>
                  <td className="py-3.5 px-4 text-right text-amber-400 font-mono text-base">
                    {formatCurrency(totalCost)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
