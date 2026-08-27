import React, { useState } from "react";
import { SubcontractOrder, Contact, WorkOrder, Product } from "../../types";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Package,
  Calendar,
  Building2,
  DollarSign,
  X,
} from "lucide-react";

interface SubcontractManagementProps {
  subcontractOrders: SubcontractOrder[];
  contacts: Contact[];
  workOrders: WorkOrder[];
  products: Product[];
  onSaveSubcontractOrder: (order: SubcontractOrder) => void;
  onReceiveSubcontract: (orderId: string, receivedQty: number, scrapQty: number) => void;
}

export const SubcontractManagement: React.FC<SubcontractManagementProps> = ({
  subcontractOrders,
  contacts,
  workOrders,
  products,
  onSaveSubcontractOrder,
  onReceiveSubcontract,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubcontractOrder | null>(null);

  const [receiveForm, setReceiveForm] = useState({
    receivedQty: 0,
    scrapQty: 0,
  });

  const [editingOrder, setEditingOrder] = useState<Partial<SubcontractOrder>>({
    dispatchNo: "",
    workOrderId: "",
    workOrderNumber: "",
    operationName: "",
    subcontractorContactId: "",
    subcontractorContactName: "",
    productName: "",
    quantity: 10,
    unit: "Adet",
    unitPrice: 100,
    totalPrice: 1000,
    dispatchDate: new Date().toISOString().split("T")[0],
    expectedReturnDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    status: "dispatched",
    notes: "",
  });

  const suppliers = contacts.filter((c) => c.type === "supplier" || c.type === "both");

  const filteredOrders = subcontractOrders.filter((s) => {
    return (
      s.dispatchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subcontractorContactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.operationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenCreateModal = () => {
    const defaultWo = workOrders[0];
    const defaultSupp = suppliers[0];

    setEditingOrder({
      id: "sub_" + Date.now(),
      dispatchNo: `FAS-IRS-${new Date().getFullYear()}-${String(subcontractOrders.length + 101).padStart(4, "0")}`,
      workOrderId: defaultWo?.id || "",
      workOrderNumber: defaultWo?.orderNumber || "",
      operationName: "Fason Elektrostatik Toz Boya / Kaplama",
      subcontractorContactId: defaultSupp?.id || "",
      subcontractorContactName: defaultSupp?.name || "",
      productId: defaultWo?.productId || "",
      productName: defaultWo?.productName || "Yarı Mamul",
      quantity: 50,
      unit: "Adet",
      unitPrice: 120,
      totalPrice: 6000,
      dispatchDate: new Date().toISOString().split("T")[0],
      expectedReturnDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      status: "dispatched",
      receivedQuantity: 0,
      scrapQuantity: 0,
      createdAt: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder.dispatchNo || !editingOrder.subcontractorContactId) return;

    const finalOrder = {
      ...(editingOrder as SubcontractOrder),
      totalPrice: (editingOrder.quantity || 0) * (editingOrder.unitPrice || 0),
    };
    onSaveSubcontractOrder(finalOrder);
    setIsModalOpen(false);
  };

  const handleOpenReceiveModal = (order: SubcontractOrder) => {
    setSelectedSubOrder(order);
    setReceiveForm({
      receivedQty: order.quantity - (order.receivedQuantity || 0),
      scrapQty: 0,
    });
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubOrder) return;

    onReceiveSubcontract(selectedSubOrder.id, receiveForm.receivedQty, receiveForm.scrapQty);
    setIsReceiveModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İrsaliye no, tedarikçi veya operasyon ara..."
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
          <span>Yeni Fason Sevk İrsaliyesi</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-separate border-spacing-y-1 p-2 sm:p-3">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Sevk İrsaliye No</th>
                <th className="py-2.5 px-3">Fason Tedarikçi</th>
                <th className="py-2.5 px-3">Operasyon / İşlem</th>
                <th className="py-2.5 px-3">Bağlı İş Emri</th>
                <th className="py-2.5 px-3 text-right">Sevk Edilen</th>
                <th className="py-2.5 px-3 text-right">Teslim Alınan</th>
                <th className="py-2.5 px-3 text-right">Fason Maliyet</th>
                <th className="py-2.5 px-3 text-center">Durum</th>
                <th className="py-2.5 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                    Fason sevk kaydı bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCompleted = order.status === "completed";

                  return (
                    <tr
                      key={order.id}
                      className="bg-purple-50/20 hover:bg-purple-50/60 transition-colors group rounded-xl"
                    >
                      <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-100/80 font-mono font-bold text-purple-950">
                        <span className="bg-purple-100/80 text-purple-950 px-2 py-0.5 rounded-md border border-purple-300/60 shadow-2xs">
                          {order.dispatchNo}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-y border-purple-100/80">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                          {order.subcontractorContactName}
                        </div>
                        <div className="text-[10px] text-purple-900/70 mt-0.5 font-medium">Sevk: {order.dispatchDate}</div>
                      </td>
                      <td className="py-3 px-3 border-y border-purple-100/80">
                        <span className="font-bold text-slate-900">{order.operationName}</span>
                        <span className="text-[11px] text-slate-500 block">{order.productName}</span>
                      </td>
                      <td className="py-3 px-3 border-y border-purple-100/80">
                        <span className="font-mono text-xs bg-white text-slate-700 px-2 py-0.5 rounded border border-purple-100 font-bold">
                          {order.workOrderNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700 border-y border-purple-100/80">
                        {order.quantity} {order.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 border-y border-purple-100/80">
                        {order.receivedQuantity || 0} {order.unit}
                        {(order.scrapQuantity || 0) > 0 && (
                          <span className="text-[10px] text-rose-600 block font-bold">
                            ({order.scrapQuantity} Fire)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black font-mono text-purple-950 border-y border-purple-100/80">
                        {order.totalPrice.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                        <span className="text-[10px] text-slate-400 font-normal block">
                          ({order.unitPrice} ₺/ad)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center border-y border-purple-100/80">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1 shadow-2xs ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isCompleted ? "Geri Geldi" : "Fasonda"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right rounded-r-xl border-y border-r border-purple-100/80">
                        {!isCompleted ? (
                          <button
                            onClick={() => handleOpenReceiveModal(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            Depo Kabul
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">İşlem Tamam</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Subcontract Dispatch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-purple-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Yeni Fason Çıkış İrsaliyesi</h3>
                <p className="text-xs text-purple-950/80 mt-0.5">
                  Dış tedarikçilere gönderilen operasyon ve parçaların takibi.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fason İrsaliye No *</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.dispatchNo || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, dispatchNo: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bağlı İş Emri *</label>
                  <select
                    value={editingOrder.workOrderId}
                    onChange={(e) => {
                      const wo = workOrders.find((w) => w.id === e.target.value);
                      if (wo) {
                        setEditingOrder({
                          ...editingOrder,
                          workOrderId: wo.id,
                          workOrderNumber: wo.orderNumber,
                          productId: wo.productId,
                          productName: wo.productName,
                          unit: wo.unit,
                        });
                      }
                    }}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  >
                    {workOrders.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.orderNumber} - {w.productName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fasoncu / Tedarikçi *</label>
                  <select
                    value={editingOrder.subcontractorContactId}
                    onChange={(e) => {
                      const sup = suppliers.find((s) => s.id === e.target.value);
                      setEditingOrder({
                        ...editingOrder,
                        subcontractorContactId: e.target.value,
                        subcontractorContactName: sup?.name || "",
                      });
                    }}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Yapılacak Operasyon *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Elektrostatik Toz Boya"
                    value={editingOrder.operationName || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, operationName: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sevk Miktarı *</label>
                  <input
                    type="number"
                    required
                    value={editingOrder.quantity || 1}
                    onChange={(e) => setEditingOrder({ ...editingOrder, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Birim Fason Fiyatı (₺)</label>
                  <input
                    type="number"
                    value={editingOrder.unitPrice || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Beklenen Dönüş Tarihi</label>
                  <input
                    type="date"
                    value={editingOrder.expectedReturnDate || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, expectedReturnDate: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

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
                  Fason İrsaliyesini Onayla & Sevk Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Depo Kabul Modalı */}
      {isReceiveModalOpen && selectedSubOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Fason Dönüşü Depo Kabulü</h3>
                <p className="text-xs text-purple-950/80 mt-0.5">
                  {selectedSubOrder.subcontractorContactName} firmasından gelen ürünleri teslim alın.
                </p>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center border border-purple-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sağlam Teslim Alınan Miktar ({selectedSubOrder.unit})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={receiveForm.receivedQty}
                  onChange={(e) => setReceiveForm({ ...receiveForm, receivedQty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tedarikçi Fire / Hurda Miktarı ({selectedSubOrder.unit})
                </label>
                <input
                  type="number"
                  min={0}
                  value={receiveForm.scrapQty}
                  onChange={(e) => setReceiveForm({ ...receiveForm, scrapQty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-rose-200/70 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-5 py-2 shadow-xs transition-colors cursor-pointer"
                >
                  Kabulü Tamamla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
