import React, { useState } from "react";
import {
  CookingPot,
  Plus,
  Search,
  Filter,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  Building2,
  Truck,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  Sparkles,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import { FoodProductionOrder, FoodOrderStatus } from "../../../types";
import { formatCurrency } from "../../../utils/exportUtils";

interface FoodOrdersViewProps {
  orders: FoodProductionOrder[];
  onOpenNewOrderModal: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: FoodOrderStatus) => void;
  onPrintOrderSheet: (order: FoodProductionOrder) => void;
  onOpenTriggerModal?: () => void;
  onDeductOrderStock?: (order: FoodProductionOrder) => void;
}

export const FoodOrdersView: React.FC<FoodOrdersViewProps> = ({
  orders,
  onOpenNewOrderModal,
  onUpdateOrderStatus,
  onPrintOrderSheet,
  onOpenTriggerModal,
  onDeductOrderStock,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<FoodProductionOrder | null>(orders[0] || null);

  const statusOptions: { id: string; label: string }[] = [
    { id: "all", label: "Tüm İş Emirleri" },
    { id: "cooking", label: "Kazanlarda Pişirilenler" },
    { id: "ingredients_issued", label: "Hazırlık Aşamasında" },
    { id: "portioning", label: "Porsiyonlananlar" },
    { id: "ready_for_dispatch", label: "Sevkiyata Hazır" },
    { id: "completed", label: "Tamamlananlar" },
  ];

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "all") return true;
    return o.status === filterStatus;
  });

  const getStatusBadge = (status: FoodOrderStatus) => {
    switch (status) {
      case "planned":
        return { label: "Planlandı", class: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock };
      case "ingredients_issued":
        return { label: "Hammadde Çıktı / Hazırlık", class: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock };
      case "cooking":
        return { label: "Kazanlarda Pişiriliyor", class: "bg-orange-50 text-orange-700 border-orange-200", icon: Flame };
      case "portioning":
        return { label: "Porsiyonlanıyor (Termobox)", class: "bg-purple-50 text-purple-700 border-purple-200", icon: UtensilsCrossed };
      case "ready_for_dispatch":
        return { label: "Sevkiyata Hazır", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Truck };
      case "completed":
        return { label: "Tamamlandı", class: "bg-slate-100 text-slate-500 border-slate-200", icon: CheckCircle2 };
    }
  };

  const getNextStatus = (current: FoodOrderStatus): FoodOrderStatus | null => {
    switch (current) {
      case "planned":
        return "ingredients_issued";
      case "ingredients_issued":
        return "cooking";
      case "cooking":
        return "portioning";
      case "portioning":
        return "ready_for_dispatch";
      case "ready_for_dispatch":
        return "completed";
      case "completed":
        return null;
    }
  };

  const getNextStatusLabel = (next: FoodOrderStatus | null): string => {
    switch (next) {
      case "ingredients_issued":
        return "Hazırlığa Al (Hammadde Çıkar)";
      case "cooking":
        return "Kazanlarda Pişirmeye Başla";
      case "portioning":
        return "Termoboxlara Porsiyonla";
      case "ready_for_dispatch":
        return "Sevkiyata Teslim Et";
      case "completed":
        return "İş Emrini Tamamla";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Buton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-editorial font-medium text-slate-900 flex items-center gap-2">
            <CookingPot className="w-5 h-5 text-amber-600" />
            <span>Mutfak Üretim ve İş Emirleri</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kazanlarda pişen yemekler, şantiye/firma porsiyonlama kotaları, aşçıbaşı yönetimi ve sevk saatleri.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenTriggerModal && (
            <button
              type="button"
              onClick={onOpenTriggerModal}
              className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-slate-800"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>⚡ Menüden İş Emri Tetikle</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewOrderModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Mutfak İş Emri Aç</span>
          </button>
        </div>
      </div>

      {/* Durum Filtreleri */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilterStatus(opt.id)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === opt.id
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ana Çalışma Alanı: Sol Liste, Sağ Detay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Panel: İş Emirleri Listesi (5 Kolon) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredOrders.map((order) => {
            const isSelected = selectedOrder?.id === order.id;
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? "bg-amber-50/40 border-amber-400 ring-2 ring-amber-400/20 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{order.orderNo}</span>
                    <span className="text-2xs font-semibold text-slate-500">
                      {order.mealType === "lunch" ? "Öğle" : order.mealType === "dinner" ? "Akşam" : "Gece"}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold border flex items-center gap-1 ${badge.class}`}>
                    <BadgeIcon className="w-2.5 h-2.5" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700 line-clamp-1">{order.menuTitle}</p>

                <div className="flex items-center justify-between text-2xs pt-1">
                  {order.isStockDeducted ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <PackageCheck className="w-3 h-3 text-emerald-600" />
                      Hammadde Stoktan Düşüldü
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Stok Düşüşü Bekliyor
                    </span>
                  )}
                  <span className="text-slate-400 font-mono text-2xs">{order.date}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                    {order.totalPortions} Porsiyon
                  </span>
                  <span>Şef: <strong className="text-slate-800">{order.headChefName}</strong></span>
                  <span>Sevk: <strong className="text-slate-800">{order.scheduledDispatchTime}</strong></span>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Bu filtreye uygun mutfak iş emri bulunamadı.
            </div>
          )}
        </div>

        {/* Sağ Panel: Seçili İş Emri Detayı (7 Kolon) */}
        {selectedOrder ? (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            {/* Detay Üst Başlığı */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedOrder.orderNo}</h3>
                  {(() => {
                    const badge = getStatusBadge(selectedOrder.status);
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.class}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Tarih: {selectedOrder.date} • Bölüm: {selectedOrder.kitchenSection}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPrintOrderSheet(selectedOrder)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Kazan Fişi Yazdır</span>
                </button>

                {(() => {
                  const next = getNextStatus(selectedOrder.status);
                  if (!next) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, next)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <span>{getNextStatusLabel(next)}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Stok Düşüş Durumu & Sarfiyat Fişi Paneli */}
            {selectedOrder.isStockDeducted ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="font-bold text-emerald-900 block">
                      Hammaddeler Stoktan Düşüldü (Sarfiyat Fişi Kesildi)
                    </strong>
                    <span className="text-2xs text-emerald-700">
                      {selectedOrder.stockDeductionSummary || "Tüm reçete hammaddeleri depo mevcudundan otomatik düşürülmüştür."}
                      {selectedOrder.stockDeductionDate && ` • ${new Date(selectedOrder.stockDeductionDate).toLocaleString("tr-TR")}`}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-2xs shrink-0">
                  Depo Çıkışı Tamam
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="font-bold text-amber-900 block">
                      Hammadde Stok Çıkışı Bekliyor
                    </strong>
                    <span className="text-2xs text-amber-800">
                      Bu iş emrinin ihtiyaç duyduğu hammaddeler henüz depodan rezerve edilmedi veya düşülmedi.
                    </span>
                  </div>
                </div>

                {onDeductOrderStock && (
                  <button
                    type="button"
                    onClick={() => onDeductOrderStock(selectedOrder)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>⚡ Hammaddeleri Stoktan Düş</span>
                  </button>
                )}
              </div>
            )}

            {/* Bilgi Kutuları */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-2xs">Toplam Porsiyon</span>
                <strong className="text-slate-900 text-sm">{selectedOrder.totalPortions} Adet</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-2xs">Aşçıbaşı / Sorumlu</span>
                <strong className="text-slate-900 text-sm">{selectedOrder.headChefName}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-2xs">Başlama Saati</span>
                <strong className="text-slate-900 text-sm">{selectedOrder.scheduledStartTime}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-2xs">Hedef Sevk Saati</span>
                <strong className="text-amber-700 text-sm">{selectedOrder.scheduledDispatchTime}</strong>
              </div>
            </div>

            {/* Mutfak Yemekleri & Porsiyonlar */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pişirilecek Yemekler (Reçeteler)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedOrder.recipes.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CookingPot className="w-4 h-4 text-amber-700" />
                      <span className="font-semibold text-slate-800">{r.recipeName}</span>
                    </div>
                    <span className="font-bold text-amber-900">{r.portionCount} Por.</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Müşteri / Şantiye Porsiyon Dağıtım Çizelgesi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Şantiye ve Müşteri Porsiyonlama Çizelgesi ({selectedOrder.customerPortions.length} Nokta)
                </h4>
                <span className="text-2xs text-slate-500">Termobox ve Sefer Tası</span>
              </div>

              <div className="space-y-2">
                {selectedOrder.customerPortions.map((cp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-slate-900 text-sm">{cp.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          {cp.portionCount} Porsiyon
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          {cp.termoboxCount || 0} Termobox
                        </span>
                      </div>
                    </div>

                    <div className="text-2xs text-slate-500">
                      <span>Adres: {cp.deliveryAddress}</span>
                      {cp.contactPerson && <span> • Yetkili: {cp.contactPerson} ({cp.phone})</span>}
                    </div>

                    {cp.specialInstructions && (
                      <div className="text-2xs bg-amber-100/50 text-amber-900 p-1.5 rounded font-medium">
                        ⚠️ Not: {cp.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mutfak Hammadde Sarfiyat Listesi */}
            {selectedOrder.ingredientsRequired && selectedOrder.ingredientsRequired.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Depodan Çıkması Gereken Hammadde Listesi
                  </h4>
                  <span className="text-2xs text-emerald-700 font-semibold">Tüm Stoklar Yeterli</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedOrder.ingredientsRequired.map((ing, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        ing.isDeducted
                          ? "bg-emerald-50/40 border-emerald-200/80"
                          : ing.isStockSufficient
                          ? "bg-slate-50 border-slate-200"
                          : "bg-rose-50/50 border-rose-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-800">{ing.productName}</p>
                          {ing.isDeducted && (
                            <span className="text-3xs font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                              Düşüldü
                            </span>
                          )}
                        </div>
                        <span className="text-2xs text-slate-400">
                          Depo: {ing.currentStock} {ing.unit}
                          {ing.remainingStockAfter !== undefined && ` (Kalan: ${ing.remainingStockAfter} ${ing.unit})`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-800 block font-mono">
                          {ing.totalAmount} {ing.unit}
                        </span>
                        <span className="text-2xs text-slate-500 font-mono">{formatCurrency(ing.totalCost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Detayını görmek için soldan bir iş emri seçin.
          </div>
        )}
      </div>
    </div>
  );
};
