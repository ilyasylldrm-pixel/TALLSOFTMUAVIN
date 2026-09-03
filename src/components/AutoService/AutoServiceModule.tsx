import React, { useState } from "react";
import {
  Car,
  Wrench,
  Sparkles,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Copy,
  Printer,
  Trash2,
  Edit3,
  Phone,
  MessageSquare,
  ShieldCheck,
  Fuel,
  Info,
  DollarSign,
  RefreshCw,
  Check,
  ChevronDown,
  X,
  Gauge,
  FileSpreadsheet,
  Share2,
  FileCheck,
  Receipt,
  CheckCircle2,
  MessageCircle,
  Package,
} from "lucide-react";
import { AutoServiceRecord, AutoPartItem, AutoLaborItem, Contact, AutoServiceStatus, Invoice, CompanySettings } from "../../types";
import { ServiceInvoicingModal } from "../ServiceInvoicingModal";
import { ServiceWhatsAppModal } from "../ServiceWhatsAppModal";
import { ServiceDeliveryModal } from "../ServiceDeliveryModal";
import { DetailPageLayout } from "../common/DetailPageLayout";
import { useDetailNavigation } from "../../hooks/useDetailNavigation";

interface AutoServiceModuleProps {
  autoServices: AutoServiceRecord[];
  onUpdateAutoServices: (services: AutoServiceRecord[]) => void;
  contacts: Contact[];
  companySettings?: CompanySettings;
  onAddInvoice?: (invoice: Invoice) => void;
  onAddContact?: (contact: Contact) => void;
}

export const AutoServiceModule: React.FC<AutoServiceModuleProps> = ({
  autoServices,
  onUpdateAutoServices,
  contacts,
  companySettings,
  onAddInvoice,
  onAddContact,
}) => {
  const [activeTab, setActiveTab] = useState<"records" | "ai_assistants" | "print_preview">("records");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<AutoServiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [printDocType, setPrintDocType] = useState<"reception" | "work_order" | "quote" | "delivery">("reception");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const nav = useDetailNavigation<AutoServiceRecord>({ moduleKey: "auto-service" });

  const handleBackToList = React.useCallback(() => {
    setIsModalOpen(false);
    nav.backToList();
  }, [nav]);

  React.useEffect(() => {
    if (nav.mode === "list") {
      setIsModalOpen(false);
    }
  }, [nav.mode]);

  // Delivery Modal State
  const [deliveryRecord, setDeliveryRecord] = useState<AutoServiceRecord | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // WhatsApp Notification State
  const [whatsAppRecord, setWhatsAppRecord] = useState<AutoServiceRecord | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTemplateType, setWhatsAppTemplateType] = useState<"completed" | "invoiced" | "diagnosis_approval" | "reception">("completed");

  // Invoicing & Status Dropdown States
  const [invoicingRecord, setInvoicingRecord] = useState<AutoServiceRecord | null>(null);
  const [isInvoicingModalOpen, setIsInvoicingModalOpen] = useState(false);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  // AI Assistant States
  const [aiAssistantTab, setAiAssistantTab] = useState<"complaint" | "tech_to_customer" | "quote_message" | "reminder">("complaint");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form states for AI 1: Complaint to Work Order
  const [ai1Vehicle, setAi1Vehicle] = useState("2021 Renault Megane 1.5 dCi");
  const [ai1Complaint, setAi1Complaint] = useState(
    "Sabahları araba çalışırken vik vik ötüyor, direksiyonu tam kırınca da sürtme sesi geliyor. Ayrıca 70-80 km hızdan sonra frene dokununca pedala titreme vuruyor."
  );
  const [ai1Result, setAi1Result] = useState<any>(null);

  // Form states for AI 2: Tech Report to Customer
  const [ai2Vehicle, setAi2Vehicle] = useState("2020 BMW 320i Sedan");
  const [ai2TechReport, setAi2TechReport] = useState(
    "Ön fren disklerinde 0.22mm salgı ve kılcal çatlaklar mevcut. Ön balata aşınma sensörü tetiklenmiş, balata et kalınlığı 1.8mm (limit 3.0mm). Fren hidrolik nem oranı %4 (riskli). Disk ve balata seti revizyonu zorunludur."
  );
  const [ai2Result, setAi2Result] = useState<any>(null);

  // Form states for AI 3: Quote Message
  const [ai3Vehicle, setAi3Vehicle] = useState("2022 Volkswagen Golf 1.0 eTSI");
  const [ai3ItemsText, setAi3ItemsText] = useState(
    "- Orijinal VAG 0W-20 Motor Yağı (4L): 2.400 TL\n- Mann Filtre Periyodik Bakım Seti (4'lü): 2.100 TL\n- Orijinal Ön Silecek Takımı: 750 TL\n- Periyodik Bakım & 32 Nokta Güvenlik Kontrolü İşçiliği: 1.400 TL\nToplam: 6.650 TL (KDV Dahil)"
  );
  const [ai3Total, setAi3Total] = useState("6.650 TL");
  const [ai3Channel, setAi3Channel] = useState<"whatsapp" | "sms">("whatsapp");
  const [ai3Result, setAi3Result] = useState<any>(null);

  // Form states for AI 4: Extra Maintenance Reminder
  const [ai4Vehicle, setAi4Vehicle] = useState("2021 Ford Focus 1.5 EcoBlue");
  const [ai4ExtraIssues, setAi4ExtraIssues] = useState(
    "Periyodik bakım esnasında ön amortisör körüklerinin yırtıldığı, sağ rot başının boşluk yaptığı ve akü sağlığının %42'ye (zayıf) düştüğü tespit edildi."
  );
  const [ai4Result, setAi4Result] = useState<any>(null);

  // Modal Record Form State
  const [formData, setFormData] = useState<Partial<AutoServiceRecord>>({
    plateNumber: "",
    brand: "",
    model: "",
    modelYear: new Date().getFullYear(),
    fuelType: "Benzin",
    engineCapacity: "",
    chassisNumber: "",
    currentKm: 50000,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    serviceType: "periodic_maintenance",
    entryDate: new Date().toISOString().split("T")[0],
    entryTime: "09:00",
    status: "reception",
    customerComplaint: "",
    workshopDiagnosis: "",
    assignedTechnician: "Baş Teknisyen",
    fuelLevel: "1/2",
    valuableItemsInCar: "Yok",
    accessoriesReceived: "Ruhsat, Yedek Anahtar, Stepne & Kriko",
    damagePhysicalCondition: "",
    parts: [],
    labors: [],
    isApprovedByCustomer: false,
    notes: "",
  });

  // Modal New Part/Labor states
  const [newPartName, setNewPartName] = useState("");
  const [newPartType, setNewPartType] = useState<"original" | "oem" | "aftermarket" | "refurbished">("original");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [newPartVat, setNewPartVat] = useState(20);

  const [newLaborName, setNewLaborName] = useState("");
  const [newLaborHours, setNewLaborHours] = useState(1);
  const [newLaborRate, setNewLaborRate] = useState(750);
  const [newLaborVat, setNewLaborVat] = useState(20);

  // Status mapping & options
  const autoStatusOptions: { value: AutoServiceStatus; label: string; desc: string; bg: string; color: string; dot: string }[] = [
    { value: "reception", label: "Servis Kabul", desc: "Araç girişi yapıldı, kayıt açıldı", bg: "bg-amber-100/90 border-amber-300", color: "text-amber-900", dot: "bg-amber-500" },
    { value: "diagnosis", label: "Teşhis / Ekspertiz", desc: "Arıza tespiti ve lifte alma yapılıyor", bg: "bg-blue-100/90 border-blue-300", color: "text-blue-900", dot: "bg-blue-500" },
    { value: "quote_pending", label: "Fiyat Onayı Bekliyor", desc: "Müşteriye teklif iletildi, onay bekleniyor", bg: "bg-purple-100/90 border-purple-300", color: "text-purple-900", dot: "bg-purple-500" },
    { value: "parts_pending", label: "Parça Bekleniyor", desc: "Yedek parça siparişi bekleniyor", bg: "bg-orange-100/90 border-orange-300", color: "text-orange-900", dot: "bg-orange-500" },
    { value: "in_progress", label: "Onarımda / Liftte", desc: "Mekanik/elektrik bakım uygulanıyor", bg: "bg-indigo-100/90 border-indigo-300", color: "text-indigo-900", dot: "bg-indigo-500" },
    { value: "testing", label: "Test Sürüşü & Kontrol", desc: "Yol testi, kalite kontrol ve yıkama", bg: "bg-cyan-100/90 border-cyan-300", color: "text-cyan-900", dot: "bg-cyan-500" },
    { value: "ready", label: "Teslime Hazır (Onarım Bitti)", desc: "Onarım tamamlandı, fatura/teslimata hazır", bg: "bg-emerald-100/90 border-emerald-300", color: "text-emerald-900", dot: "bg-emerald-500" },
    { value: "completed", label: "Teslim Edildi & Faturalandı", desc: "Müşteriye teslim edildi ve fatura kesildi", bg: "bg-slate-200 border-slate-300", color: "text-slate-900", dot: "bg-blue-600" },
    { value: "cancelled", label: "İptal Edildi", desc: "Servis işlemi iptal edildi", bg: "bg-rose-100/90 border-rose-300", color: "text-rose-900", dot: "bg-rose-500" },
  ];

  const statusLabels: Record<AutoServiceStatus, { label: string; color: string; bg: string }> = {
    reception: { label: "Servis Kabul", color: "text-amber-800", bg: "bg-amber-100/90 border-amber-300" },
    diagnosis: { label: "Teşhis / Ekspertiz", color: "text-blue-800", bg: "bg-blue-100/90 border-blue-300" },
    quote_pending: { label: "Fiyat Onayı Bekliyor", color: "text-purple-800", bg: "bg-purple-100/90 border-purple-300" },
    parts_pending: { label: "Parça Bekleniyor", color: "text-orange-800", bg: "bg-orange-100/90 border-orange-300" },
    in_progress: { label: "Onarımda / Liftte", color: "text-indigo-800", bg: "bg-indigo-100/90 border-indigo-300" },
    testing: { label: "Test Sürüşü & Kontrol", color: "text-cyan-800", bg: "bg-cyan-100/90 border-cyan-300" },
    ready: { label: "Teslime Hazır", color: "text-emerald-800", bg: "bg-emerald-100/90 border-emerald-300" },
    completed: { label: "Teslim Edildi", color: "text-slate-800", bg: "bg-slate-200 border-slate-300" },
    cancelled: { label: "İptal Edildi", color: "text-rose-800", bg: "bg-rose-100/90 border-rose-300" },
  };

  const handleQuickStatusChange = (recordId: string, newStatus: AutoServiceStatus) => {
    const updated = autoServices.map((s) => {
      if (s.id === recordId) {
        return {
          ...s,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateAutoServices(updated);
    setOpenStatusDropdownId(null);
  };

  const handleOpenInvoicing = (record: AutoServiceRecord) => {
    setInvoicingRecord(record);
    setIsInvoicingModalOpen(true);
  };

  const handleOpenWhatsApp = (
    record: AutoServiceRecord,
    preferredType?: "completed" | "invoiced" | "diagnosis_approval" | "reception"
  ) => {
    setWhatsAppRecord(record);
    if (preferredType) {
      setWhatsAppTemplateType(preferredType);
    } else if (record.invoiceNumber || record.invoiceId) {
      setWhatsAppTemplateType("invoiced");
    } else if (record.status === "ready" || record.status === "completed" || record.status === "testing") {
      setWhatsAppTemplateType("completed");
    } else if (record.status === "quote_pending") {
      setWhatsAppTemplateType("diagnosis_approval");
    } else {
      setWhatsAppTemplateType("completed");
    }
    setIsWhatsAppModalOpen(true);
  };

  const handleOpenDeliveryModal = (record: AutoServiceRecord) => {
    setDeliveryRecord(record);
    setIsDeliveryModalOpen(true);
  };

  const handleMarkDelivered = (serviceId: string) => {
    const updated = autoServices.map((s) => {
      if (s.id === serviceId) {
        return {
          ...s,
          status: "completed" as AutoServiceStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateAutoServices(updated);
  };

  const handleServiceInvoiced = (serviceId: string, invoiceId: string, invoiceNumber: string) => {
    const updated = autoServices.map((s) => {
      if (s.id === serviceId) {
        const invoicedRec = {
          ...s,
          status: "completed" as AutoServiceStatus,
          invoiceId,
          invoiceNumber,
          updatedAt: new Date().toISOString(),
        };
        // Fatura kesildikten sonra WhatsApp bilgilendirme penceresini hazırla
        setTimeout(() => {
          handleOpenWhatsApp(invoicedRec, "invoiced");
        }, 400);
        return invoicedRec;
      }
      return s;
    });
    onUpdateAutoServices(updated);
  };

  // KPIs
  const totalServices = autoServices.length;
  const activeServices = autoServices.filter((s) => s.status !== "completed" && s.status !== "cancelled").length;
  const quotePendingCount = autoServices.filter((s) => s.status === "quote_pending").length;
  const inProgressCount = autoServices.filter((s) => s.status === "in_progress" || s.status === "diagnosis").length;
  const readyCount = autoServices.filter((s) => s.status === "ready" || s.status === "completed").length;
  const totalRevenue = autoServices
    .filter((s) => s.status === "completed" || s.isApprovedByCustomer)
    .reduce((acc, s) => acc + s.grandTotal, 0);

  // Filtered List
  const filteredServices = autoServices.filter((s) => {
    const matchesQuery =
      s.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.serviceNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormData({
      id: "srv_" + Date.now(),
      serviceNo: `OTO-${new Date().getFullYear()}-${String(autoServices.length + 101).padStart(4, "0")}`,
      plateNumber: "",
      brand: "",
      model: "",
      modelYear: new Date().getFullYear(),
      fuelType: "Benzin",
      engineCapacity: "1.6",
      chassisNumber: "",
      currentKm: 65000,
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      serviceType: "periodic_maintenance",
      entryDate: new Date().toISOString().split("T")[0],
      entryTime: "09:30",
      status: "reception",
      customerComplaint: "",
      workshopDiagnosis: "",
      assignedTechnician: "Oto Baş Teknisyen",
      fuelLevel: "1/2",
      valuableItemsInCar: "Ruhsat ve Stepne mevcut",
      accessoriesReceived: "Ruhsat, Yedek Anahtar, Stepne & Kriko Seti",
      damagePhysicalCondition: "",
      parts: [],
      labors: [],
      partsTotal: 0,
      laborTotal: 0,
      totalVat: 0,
      grandTotal: 0,
      isApprovedByCustomer: false,
      notes: "",
      createdAt: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: AutoServiceRecord) => {
    setModalMode("edit");
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const total = newPartQty * newPartPrice;
    const newPart: AutoPartItem = {
      id: "part_" + Date.now(),
      partName: newPartName.trim(),
      partType: newPartType,
      quantity: newPartQty,
      unit: "Adet",
      unitPrice: newPartPrice,
      vatRate: newPartVat,
      total,
      warrantyMonths: 12,
    };
    setFormData((prev) => ({
      ...prev,
      parts: [...(prev.parts || []), newPart],
    }));
    setNewPartName("");
    setNewPartPrice(0);
  };

  const handleRemovePart = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      parts: (prev.parts || []).filter((p) => p.id !== id),
    }));
  };

  const handleAddLabor = () => {
    if (!newLaborName.trim()) return;
    const total = newLaborHours * newLaborRate;
    const newLabor: AutoLaborItem = {
      id: "labor_" + Date.now(),
      operationName: newLaborName.trim(),
      technicianName: formData.assignedTechnician || "Usta",
      hours: newLaborHours,
      hourlyRate: newLaborRate,
      vatRate: newLaborVat,
      total,
    };
    setFormData((prev) => ({
      ...prev,
      labors: [...(prev.labors || []), newLabor],
    }));
    setNewLaborName("");
  };

  const handleRemoveLabor = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      labors: (prev.labors || []).filter((l) => l.id !== id),
    }));
  };

  const handleSaveRecord = () => {
    if (!formData.plateNumber || !formData.brand) {
      alert("Lütfen araç plaka ve marka bilgilerini giriniz.");
      return;
    }

    const parts = formData.parts || [];
    const labors = formData.labors || [];
    const partsTot = parts.reduce((acc, p) => acc + p.total, 0);
    const laborTot = labors.reduce((acc, l) => acc + l.total, 0);
    const vatTot =
      parts.reduce((acc, p) => acc + (p.total * p.vatRate) / 100, 0) +
      labors.reduce((acc, l) => acc + (l.total * l.vatRate) / 100, 0);
    const grandTot = partsTot + laborTot + vatTot;

    const recordToSave: AutoServiceRecord = {
      ...(formData as AutoServiceRecord),
      partsTotal: partsTot,
      laborTotal: laborTot,
      totalVat: vatTot,
      grandTotal: grandTot,
      updatedAt: new Date().toISOString(),
    };

    if (modalMode === "create") {
      onUpdateAutoServices([recordToSave, ...autoServices]);
    } else {
      onUpdateAutoServices(autoServices.map((s) => (s.id === recordToSave.id ? recordToSave : s)));
    }

    setIsModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Bu servis kaydını silmek istediğinize emin misiniz?")) {
      onUpdateAutoServices(autoServices.filter((s) => s.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 3000);
  };

  // Call Server-Side Gemini API for Automotive Service AI
  const runAutoAi = async (action: string, payload: any, setResultState: (val: any) => void) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/gemini/auto-service-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        setResultState(data.data);
      } else {
        setAiError(data.error || "Yapay zeka yanıt üretemedi.");
      }
    } catch (err: any) {
      setAiError(err.message || "AI servisine bağlanılamadı.");
    } finally {
      setAiLoading(false);
    }
  };

  if (isModalOpen) {
    return (
        <DetailPageLayout
          title={modalMode === "create" ? "Yeni Araç Servis Kabulü & İş Emri" : `İş Emrini Düzenle (${formData.serviceNo})`}
          subtitle="Araç plakası, müşteri şikayeti, yedek parçalar ve ustalık işçilikleri"
          breadcrumbs={[
            { label: "Oto Servis Yönetimi", onClick: handleBackToList },
            { label: modalMode === "create" ? "Yeni Servis Kabulü" : `${formData.plate} - ${formData.serviceNo}`, active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              {formData.plate || "Yeni Araç"}
            </span>
          }
          headerIcon={<Car className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>{modalMode === "create" ? "İş Emrini Kaydet" : "Değişiklikleri Güncelle"}</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200/80 shadow-sm max-w-4xl mx-auto space-y-6">

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Row 1: Vehicle & Customer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Araç Plakası *</label>
                  <input
                    type="text"
                    required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    placeholder="34 ABC 123"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Araç Marka & Model *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Renault"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Megane 1.5 dCi"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Model Yılı & KM</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.modelYear}
                      onChange={(e) => setFormData({ ...formData, modelYear: Number(e.target.value) })}
                      placeholder="2021"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      value={formData.currentKm}
                      onChange={(e) => setFormData({ ...formData, currentKm: Number(e.target.value) })}
                      placeholder="65000"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono font-bold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Customer Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Müşteri / Cari Adı *</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Müşteri Ad Soyad veya Firma"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">İletişim Telefonu *</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="0532 000 00 00"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="md:col-span-3 bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-purple-950 flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-purple-700" />
                      <span>Servis Durum Yönetimi & İş Akışı Adımı</span>
                    </label>
                    <span className="text-[11px] text-purple-700 font-semibold">Tıklayarak durumu anında değiştirin</span>
                  </div>

                  {/* Görsel Hızlı Durum Butonları */}
                  <div className="flex flex-wrap gap-1.5">
                    {autoStatusOptions.map((opt) => {
                      const isSelected = formData.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: opt.value })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? `${opt.bg} ${opt.color} ring-2 ring-purple-600 shadow-xs scale-105`
                              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Complaints & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Müşteri Şikayeti</label>
                  <textarea
                    rows={3}
                    value={formData.customerComplaint}
                    onChange={(e) => setFormData({ ...formData, customerComplaint: e.target.value })}
                    placeholder="Müşterinin belirttiği şikayetler..."
                    className="w-full p-2.5 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Atölye Teşhisi & Yapılacaklar</label>
                  <textarea
                    rows={3}
                    value={formData.workshopDiagnosis}
                    onChange={(e) => setFormData({ ...formData, workshopDiagnosis: e.target.value })}
                    placeholder="Usta teşhisi ve kontrol notları..."
                    className="w-full p-2.5 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Row 3.5: Teslim Alınan Eşyalar/Aksesuarlar & Çizik/Deformasyon Durumu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-purple-50/40 rounded-2xl border border-purple-200/70">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-purple-700" />
                    <span>Araçla Beraberinde Getirilen / Teslim Alınanlar</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accessoriesReceived || ""}
                    onChange={(e) => setFormData({ ...formData, accessoriesReceived: e.target.value })}
                    placeholder="Örn: Ruhsat, Yedek Anahtar, Şarj Kablosu, Stepne, Kriko, Yangın Tüpü..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Teslim alma tutanağında eksiksiz olarak müşteriye ve servise ibraz edilir.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Araç Kaporta / Boya Çizik, Göçük & Deformasyon Durumu</span>
                  </label>
                  <input
                    type="text"
                    value={formData.damagePhysicalCondition || ""}
                    onChange={(e) => setFormData({ ...formData, damagePhysicalCondition: e.target.value })}
                    placeholder="Örn: Sağ ön çamurlukta çizik, arka tamponda sürtme izi, sol kapıda hafif göçük..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Teslim alırken mevcut olan fiziksel kusurlar tutanakta kayıt altına alınır.
                  </span>
                </div>
              </div>

              {/* Row 4: Parts Management */}
              <div className="border border-purple-200/80 rounded-2xl p-4 bg-purple-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-purple-950 text-xs uppercase flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-purple-700" />
                    Kullanılacak Yedek Parçalar
                  </h4>
                  <span className="font-mono font-bold text-purple-900">
                    Parça Toplamı: ₺{(formData.parts || []).reduce((acc, p) => acc + p.total, 0).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Parça Adı (Örn: Ön Fren Balatası)"
                    className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-purple-200 bg-white"
                  />
                  <select
                    value={newPartType}
                    onChange={(e) => setNewPartType(e.target.value as any)}
                    className="px-2 py-1.5 rounded-xl border border-purple-200 bg-white font-semibold"
                  >
                    <option value="original">Orijinal</option>
                    <option value="oem">OEM</option>
                    <option value="aftermarket">Yan Sanayi</option>
                  </select>
                  <input
                    type="number"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(Number(e.target.value))}
                    placeholder="Adet"
                    className="px-2 py-1.5 rounded-xl border border-purple-200 bg-white text-center font-bold"
                  />
                  <input
                    type="number"
                    value={newPartPrice || ""}
                    onChange={(e) => setNewPartPrice(Number(e.target.value))}
                    placeholder="Birim Fiyat ₺"
                    className="px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    + Parça Ekle
                  </button>
                </div>

                {formData.parts && formData.parts.length > 0 && (
                  <div className="border border-purple-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-purple-50 text-[11px] font-bold text-purple-950">
                        <tr>
                          <th className="p-2">Parça</th>
                          <th className="p-2">Tür</th>
                          <th className="p-2 text-center">Adet</th>
                          <th className="p-2 text-right">Birim Fiyat</th>
                          <th className="p-2 text-right">Tutar</th>
                          <th className="p-2 text-center">Sil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {formData.parts.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 font-semibold text-slate-900">{p.partName}</td>
                            <td className="p-2 text-slate-500 capitalize">{p.partType}</td>
                            <td className="p-2 text-center font-mono">{p.quantity}</td>
                            <td className="p-2 text-right font-mono">₺{p.unitPrice.toFixed(2)}</td>
                            <td className="p-2 text-right font-bold font-mono">₺{p.total.toFixed(2)}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePart(p.id)}
                                className="text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Row 5: Labor Management */}
              <div className="border border-purple-200/80 rounded-2xl p-4 bg-purple-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-purple-950 text-xs uppercase flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-purple-700" />
                    Ustalık & İşçilik Kalemleri
                  </h4>
                  <span className="font-mono font-bold text-purple-900">
                    İşçilik Toplamı: ₺{(formData.labors || []).reduce((acc, l) => acc + l.total, 0).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={newLaborName}
                    onChange={(e) => setNewLaborName(e.target.value)}
                    placeholder="İşlem Adı (Örn: Fren Disk ve Balata Değişimi)"
                    className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-purple-200 bg-white"
                  />
                  <input
                    type="number"
                    value={newLaborHours}
                    onChange={(e) => setNewLaborHours(Number(e.target.value))}
                    placeholder="Saat"
                    className="px-2 py-1.5 rounded-xl border border-purple-200 bg-white text-center font-bold"
                  />
                  <input
                    type="number"
                    value={newLaborRate || ""}
                    onChange={(e) => setNewLaborRate(Number(e.target.value))}
                    placeholder="Saat Ücreti ₺"
                    className="px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddLabor}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    + İşçilik Ekle
                  </button>
                </div>

                {formData.labors && formData.labors.length > 0 && (
                  <div className="border border-purple-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-purple-50 text-[11px] font-bold text-purple-950">
                        <tr>
                          <th className="p-2">İşlem</th>
                          <th className="p-2 text-center">Saat</th>
                          <th className="p-2 text-right">Saat Ücreti</th>
                          <th className="p-2 text-right">Tutar</th>
                          <th className="p-2 text-center">Sil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {formData.labors.map((l) => (
                          <tr key={l.id}>
                            <td className="p-2 font-semibold text-slate-900">{l.operationName}</td>
                            <td className="p-2 text-center font-mono">{l.hours} Saat</td>
                            <td className="p-2 text-right font-mono">₺{l.hourlyRate.toFixed(2)}</td>
                            <td className="p-2 text-right font-bold font-mono">₺{l.total.toFixed(2)}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLabor(l.id)}
                                className="text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Customer Approval Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-purple-50/40 rounded-xl border border-purple-200">
                <input
                  type="checkbox"
                  id="custApproval"
                  checked={formData.isApprovedByCustomer || false}
                  onChange={(e) => setFormData({ ...formData, isApprovedByCustomer: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="custApproval" className="font-bold text-purple-950 cursor-pointer">
                  Müşteriden WhatsApp / SMS veya Şifahi Maliyet Onayı Alındı
                </label>
              </div>
            </div>

            {/* Form Footer */}
            <div className="p-4 bg-slate-50 border-t border-purple-200/60 rounded-2xl flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {modalMode === "create" ? "İş Emrini Kaydet" : "Değişiklikleri Güncelle"}
              </button>
            </div>
          </div>
        </DetailPageLayout>
    );
  }

      {/* SERVİS FATURALANDIRMA MODALI */}
      {isInvoicingModalOpen && invoicingRecord && (
        <ServiceInvoicingModal
          isOpen={isInvoicingModalOpen}
          onClose={() => {
            setIsInvoicingModalOpen(false);
            setInvoicingRecord(null);
          }}
          serviceType="auto"
          serviceRecord={invoicingRecord}
          contacts={contacts}
          onAddInvoice={(invoice) => {
            if (onAddInvoice) {
              onAddInvoice(invoice);
            }
          }}
          onAddContact={(contact) => {
            if (onAddContact) {
              onAddContact(contact);
            }
          }}
          onServiceInvoiced={handleServiceInvoiced}
          onOpenDeliveryModal={(record) => {
            handleOpenDeliveryModal(record as AutoServiceRecord);
          }}
        />
    );
  }

  if (isWhatsAppModalOpen && whatsAppRecord) {
    return (
        <ServiceWhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setWhatsAppRecord(null);
          }}
          serviceType="auto"
          serviceRecord={whatsAppRecord}
          defaultTemplateType={whatsAppTemplateType}
          companySettings={companySettings}
        />
    );
  }

  if (isDeliveryModalOpen && deliveryRecord) {
    return (
        <ServiceDeliveryModal
          isOpen={isDeliveryModalOpen}
          onClose={() => {
            setIsDeliveryModalOpen(false);
            setDeliveryRecord(null);
          }}
          serviceType="auto"
          serviceRecord={deliveryRecord}
          companySettings={companySettings}
          onOpenInvoicing={(rec) => {
            setIsDeliveryModalOpen(false);
            handleOpenInvoicing(rec as AutoServiceRecord);
          }}
          onOpenWhatsApp={(rec) => {
            setIsDeliveryModalOpen(false);
            handleOpenWhatsApp(rec as AutoServiceRecord, "completed");
          }}
          onMarkDelivered={handleMarkDelivered}
        />
    );
  }


  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* MODULE HEADER & TOP SUMMARY (Lila Bal Peteği & Geometrik Desen - Finans Yönetimi Teması) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-6 border border-purple-200/60 shadow-2xs space-y-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Geometrik Vektör Şekiller */}
        <svg
          className="absolute -right-6 -bottom-10 w-48 h-48 pointer-events-none text-purple-400/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="100,35 155,67 155,133 100,165 45,133 45,67" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="55" x2="180" y2="145" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="145" x2="180" y2="55" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        </svg>

        <svg
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-400/10"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-100/90 border border-purple-200/90 flex items-center justify-center text-purple-700 shadow-2xs backdrop-blur-2xs font-bold shrink-0">
                <Car className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
                  <span>Oto Servis & Araç Bakım Yönetimi</span>
                  <span className="text-[10px] font-extrabold bg-purple-200/80 text-purple-950 border border-purple-300/80 px-2 py-0.5 rounded-full">
                    AI Destekli Atölye
                  </span>
                </h2>
                <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
                  Araç Kabul, Lift/İş Emri Takibi, Yedek Parça & İşçilik Maliyeti, Müşteri Onayları ve 4 AI Danışmanı.
                </p>
              </div>
            </div>
          </div>

          {/* Action Tabs in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("records")}
              className={`font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                activeTab === "records"
                  ? "bg-purple-700 text-white shadow-md shadow-purple-600/30"
                  : "bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>İş Emirleri & Kabul</span>
            </button>

            <button
              onClick={() => setActiveTab("ai_assistants")}
              className={`font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                activeTab === "ai_assistants"
                  ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-600/30"
                  : "bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>AI Servis Danışmanı</span>
            </button>

            <button
              onClick={() => {
                if (autoServices.length > 0 && !selectedRecord) {
                  setSelectedRecord(autoServices[0]);
                }
                setActiveTab("print_preview");
              }}
              className={`font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                activeTab === "print_preview"
                  ? "bg-purple-700 text-white shadow-md shadow-purple-600/30"
                  : "bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Formlar & Yazdır</span>
            </button>
          </div>
        </div>

        {/* 5 FINANCIAL / OPERATIONAL SUMMARY CARDS (Tam Finans Yönetimi Teması) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 relative z-10">
          {/* Card 1: Servis Kabul & Bekleyenler (Amber) */}
          <button
            onClick={() => {
              setActiveTab("records");
              setStatusFilter("reception");
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              statusFilter === "reception" && activeTab === "records"
                ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-100/80 border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                : "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/70 border-amber-300/70 hover:border-amber-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <span>Servis Kabulü</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Car className="w-5 h-5 text-amber-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                {activeServices} Araç
              </div>
              <p className="text-xs font-semibold text-amber-900/80 mt-1 flex items-center gap-1">
                <span className="text-amber-950 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300/80">
                  {autoServices.filter((s) => s.status === "reception").length} Yeni Giriş
                </span>{" "}
                kaydedildi
              </p>
            </div>
          </button>

          {/* Card 2: Teşhis & Onarımda (Blue) */}
          <button
            onClick={() => {
              setActiveTab("records");
              setStatusFilter("in_progress");
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              statusFilter === "in_progress" && activeTab === "records"
                ? "bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-100/80 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                : "bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 border-blue-300/70 hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                <span>Liftte & Onarımda</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Wrench className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                {inProgressCount} Araç
              </div>
              <p className="text-xs font-semibold text-blue-900/80 mt-1 flex items-center gap-1">
                <span className="text-blue-950 font-bold bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300/80">
                  Usta İşlemde
                </span>{" "}
                ve testte
              </p>
            </div>
          </button>

          {/* Card 3: Müşteri Onayı Bekleyen (Indigo) */}
          <button
            onClick={() => {
              setActiveTab("records");
              setStatusFilter("quote_pending");
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              statusFilter === "quote_pending" && activeTab === "records"
                ? "bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-indigo-100/80 border-2 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md"
                : "bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-indigo-50/70 border-indigo-300/70 hover:border-indigo-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                <span>Müşteri Onayı</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Clock className="w-5 h-5 text-indigo-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-indigo-950 font-mono tracking-tight">
                {quotePendingCount} Teklif
              </div>
              <p className="text-xs font-semibold text-indigo-900/80 mt-1 flex items-center gap-1">
                <span className="text-indigo-950 font-bold bg-indigo-200/80 px-1.5 py-0.5 rounded border border-indigo-300/80">
                  WhatsApp/SMS
                </span>{" "}
                onayı bekleniyor
              </p>
            </div>
          </button>

          {/* Card 4: Hazır & Teslim Edilen (Fuchsia) */}
          <button
            onClick={() => {
              setActiveTab("records");
              setStatusFilter("ready");
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              statusFilter === "ready" && activeTab === "records"
                ? "bg-gradient-to-br from-fuchsia-500/20 via-pink-500/10 to-fuchsia-100/80 border-2 border-fuchsia-500 ring-2 ring-fuchsia-500/30 shadow-md"
                : "bg-gradient-to-br from-fuchsia-500/10 via-pink-500/5 to-fuchsia-50/70 border-fuchsia-300/70 hover:border-fuchsia-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-fuchsia-950 tracking-wider flex items-center gap-1.5">
                <span>Teslime Hazır</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <CheckCircle className="w-5 h-5 text-fuchsia-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-fuchsia-950 font-mono tracking-tight">
                {readyCount} Araç
              </div>
              <p className="text-xs font-semibold text-fuchsia-900/80 mt-1 flex items-center gap-1">
                <span className="text-fuchsia-950 font-bold bg-fuchsia-200/80 px-1.5 py-0.5 rounded border border-fuchsia-300/80">
                  {autoServices.filter((s) => s.status === "completed").length} Teslim
                </span>{" "}
                edildi
              </p>
            </div>
          </button>

          {/* Card 5: Toplam Servis & Parça Cirosu (Emerald) */}
          <button
            onClick={() => {
              setActiveTab("records");
              setStatusFilter("all");
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              statusFilter === "all" && activeTab === "records"
                ? "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-100/80 border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                : "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-50/70 border-emerald-300/70 hover:border-emerald-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                <span>Toplam Servis Cirosu</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <DollarSign className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
                ₺{totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-semibold text-emerald-900/80 mt-1 flex items-center gap-1">
                <span className="text-emerald-950 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded border border-emerald-300/80">
                  {totalServices} Kayıt
                </span>{" "}
                parça & işçilik
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* TAB 1: RECORDS & WORK ORDERS */}
      {activeTab === "records" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-600/60" />
                <input
                  type="text"
                  placeholder="Plaka, marka, model, müşteri veya servis no ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 bg-white/90"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-purple-200 text-sm font-semibold text-purple-950 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              >
                <option value="all">Tüm Durumlar ({autoServices.length})</option>
                <option value="reception">Servis Kabul</option>
                <option value="diagnosis">Teşhis / Ekspertiz</option>
                <option value="quote_pending">Müşteri Onayı Bekliyor</option>
                <option value="parts_pending">Parça Bekleniyor</option>
                <option value="in_progress">Onarımda / Liftte</option>
                <option value="testing">Test Sürüşü</option>
                <option value="ready">Teslime Hazır</option>
                <option value="completed">Teslim Edildi</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Araç Kabulü & İş Emri</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-50/70 border-b border-purple-200/70 text-xs font-extrabold text-purple-950 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Servis No / Plaka</th>
                    <th className="py-3.5 px-4">Araç Bilgisi</th>
                    <th className="py-3.5 px-4">Müşteri & İletişim</th>
                    <th className="py-3.5 px-4">Giriş / KM</th>
                    <th className="py-3.5 px-4">Şikayet / Teşhis</th>
                    <th className="py-3.5 px-4">Tutar & Onay</th>
                    <th className="py-3.5 px-4">Durum</th>
                    <th className="py-3.5 px-4 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/80 text-sm text-slate-700">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Car className="w-10 h-10 mx-auto mb-2 text-purple-300 opacity-60" />
                        <span className="font-semibold text-slate-600">Arama kriterlerine uygun araç servis kaydı bulunamadı.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((record) => {
                      const st = statusLabels[record.status] || statusLabels.reception;
                      return (
                        <tr key={record.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-purple-950">{record.serviceNo}</div>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-black bg-slate-900 text-amber-300 border border-slate-700 mt-0.5">
                              {record.plateNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {record.brand} {record.model}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {record.modelYear} • {record.fuelType || "Benzin"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{record.contactName}</div>
                            <div className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {record.contactPhone}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold text-slate-700">{record.entryDate}</div>
                            <div className="text-xs font-mono font-bold text-purple-700">
                              {record.currentKm.toLocaleString("tr-TR")} KM
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-xs text-slate-600 line-clamp-2" title={record.customerComplaint}>
                              <strong className="text-slate-900">Şikayet:</strong> {record.customerComplaint}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-950 font-mono">
                              ₺{record.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs mt-0.5">
                              {record.isApprovedByCustomer ? (
                                <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <Check className="w-3 h-3 mr-0.5" /> Müşteri Onaylı
                                </span>
                              ) : (
                                <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Onay Bekliyor
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 relative">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setOpenStatusDropdownId(openStatusDropdownId === record.id ? null : record.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer hover:shadow-xs ${st.bg} ${st.color}`}
                                title="Durumu Değiştirmek İçin Tıklayın"
                              >
                                <span className={`w-2 h-2 rounded-full ${autoStatusOptions.find(o => o.value === record.status)?.dot || 'bg-slate-400'}`} />
                                <span>{st.label}</span>
                                <ChevronDown className="w-3 h-3 opacity-70" />
                              </button>

                              {/* Açılır Durum Menüsü Popover */}
                              {openStatusDropdownId === record.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenStatusDropdownId(null)}
                                  />
                                  <div className="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-purple-200/80 py-2 z-50 animate-fadeIn">
                                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                      <span>Durum Değiştir</span>
                                      <span className="text-purple-700 font-mono font-bold text-[10px]">{record.serviceNo}</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-1">
                                      {autoStatusOptions.map((opt) => {
                                        const isSelected = record.status === opt.value;
                                        return (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleQuickStatusChange(record.id, opt.value)}
                                            className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors cursor-pointer ${
                                              isSelected ? "bg-purple-50 text-purple-950 font-bold" : "hover:bg-slate-50 text-slate-700"
                                            }`}
                                          >
                                            <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${opt.dot}`} />
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-bold flex items-center justify-between">
                                                <span>{opt.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-purple-700" />}
                                              </div>
                                              <p className="text-[10px] text-slate-500 font-normal truncate">{opt.desc}</p>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Hızlı Seçenekler / İşlem Yönlendirmeleri */}
                                    <div className="pt-1.5 mt-1 border-t border-slate-100 px-2 space-y-0.5">
                                      <div className="px-2 py-0.5 text-[10px] font-black uppercase text-slate-400">Hızlı Belge & İşlem</div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenStatusDropdownId(null);
                                          handleOpenDeliveryModal(record);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-purple-50 hover:text-purple-950 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-purple-700" />
                                        <span>Araç Teslim Tutanağı</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenStatusDropdownId(null);
                                          handleOpenInvoicing(record);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>Faturaya Gönder / Kes</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenStatusDropdownId(null);
                                          handleOpenWhatsApp(record);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>WhatsApp Gönder</span>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Teslim Tutanağı Butonu */}
                              <button
                                onClick={() => handleOpenDeliveryModal(record)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-purple-950 bg-slate-100 hover:bg-purple-100 border border-slate-200 hover:border-purple-300 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                title="Araç Teslim Tutanağını Görüntüle ve Yazdır"
                              >
                                <FileText className="w-3.5 h-3.5 text-purple-700" />
                                <span>Tutanak</span>
                              </button>

                              {/* WhatsApp Bilgilendirme Butonu */}
                              <button
                                onClick={() => handleOpenWhatsApp(record)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                title="Cari Hesaba WhatsApp Bilgilendirme Mesajı Gönder"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </button>

                              {/* Düzenle Butonu */}
                              <button
                                onClick={() => handleOpenEditModal(record)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-purple-800 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                title="Düzenle / Parça & İşçilik Ekle"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                                <span>Düzenle</span>
                              </button>

                              {/* Yazdır Butonu */}
                              <button
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setActiveTab("print_preview");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                title="Yazdır / İncele"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" />
                                <span>Yazdır</span>
                              </button>

                              {/* Sil Butonu */}
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Sil</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI ASSISTANTS (4 ÖZEL ARAÇ) */}
      {activeTab === "ai_assistants" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-tabs for the 4 AI Assistants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setAiAssistantTab("complaint")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
                aiAssistantTab === "complaint"
                  ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-100/80 border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                  : "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/70 border-amber-300/70 hover:border-amber-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-600 text-white">1. Asistan</span>
                <Sparkles className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-extrabold text-amber-950 text-sm">Şikayeti İş Emrine Dönüştür</h3>
              <p className="text-xs text-amber-900/80 font-medium mt-1 line-clamp-2">
                Müşterinin teknik olmayan ifadesini profesyonel arıza analizine çevirir.
              </p>
            </button>

            <button
              onClick={() => setAiAssistantTab("tech_to_customer")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
                aiAssistantTab === "tech_to_customer"
                  ? "bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-100/80 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                  : "bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 border-blue-300/70 hover:border-blue-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-600 text-white">2. Asistan</span>
                <ShieldCheck className="w-4 h-4 text-blue-700" />
              </div>
              <h3 className="font-extrabold text-blue-950 text-sm">Raporu Müşteri Diline Çevir</h3>
              <p className="text-xs text-blue-900/80 font-medium mt-1 line-clamp-2">
                Karmaşık usta raporunu şeffaf, güven veren ve riskleri açıklayan dile çevirir.
              </p>
            </button>

            <button
              onClick={() => setAiAssistantTab("quote_message")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
                aiAssistantTab === "quote_message"
                  ? "bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-indigo-100/80 border-2 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md"
                  : "bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-indigo-50/70 border-indigo-300/70 hover:border-indigo-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-indigo-600 text-white">3. Asistan</span>
                <MessageSquare className="w-4 h-4 text-indigo-700" />
              </div>
              <h3 className="font-extrabold text-indigo-950 text-sm">Fiyat Teklifi & Onay Mesajı</h3>
              <p className="text-xs text-indigo-900/80 font-medium mt-1 line-clamp-2">
                WhatsApp ve SMS için parça garantili, ikna edici onay metinleri üretir.
              </p>
            </button>

            <button
              onClick={() => setAiAssistantTab("reminder")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
                aiAssistantTab === "reminder"
                  ? "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-100/80 border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                  : "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-50/70 border-emerald-300/70 hover:border-emerald-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-600 text-white">4. Asistan</span>
                <Phone className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="font-extrabold text-emerald-950 text-sm">Ekstra İhtiyaç Hatırlatma</h3>
              <p className="text-xs text-emerald-900/80 font-medium mt-1 line-clamp-2">
                Bakımda çıkan ek masrafları baskısız, güvenlik odaklı aktaran konuşma akışı.
              </p>
            </button>
          </div>

          {/* AI 1: Şikayeti İş Emrine Dönüştürme */}
          {aiAssistantTab === "complaint" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-purple-100 text-purple-900">1. AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">Müşteri Şikayetini İş Emrine Dönüştürme</h3>
                  </div>
                  <p className="text-xs text-purple-900/80 font-medium">
                    Müşterinin karmaşık veya teknik olmayan ifadesini atölye ekibinin net olarak anlayabileceği profesyonel formata çevirir.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Araç Bilgisi</label>
                  <input
                    type="text"
                    value={ai1Vehicle}
                    onChange={(e) => setAi1Vehicle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="Örn: 2021 Renault Megane 1.5 dCi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Müşteri Açıklaması [MÜŞTERİNİN SÖYLEDİKLERİNİ BURAYA YAZIN]
                  </label>
                  <textarea
                    rows={5}
                    value={ai1Complaint}
                    onChange={(e) => setAi1Complaint(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="Müşterinin ses, titreme veya performans ile ilgili şikayetini girin..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      runAutoAi(
                        "complaint_to_work_order",
                        { vehicleInfo: ai1Vehicle, customerComplaint: ai1Complaint },
                        setAi1Result
                      )
                    }
                    disabled={aiLoading || !ai1Complaint.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    )}
                    {aiLoading ? "Analiz Ediliyor..." : "İş Emrine Dönüştür (AI)"}
                  </button>

                  <button
                    onClick={() => {
                      setAi1Complaint(
                        "Araba yokuş yukarı çıkarken devir yükseliyor ama araç hızlanmıyor, sanki kaydırıyor gibi. Bir de egzozdan hafif yanık kokusu geliyor."
                      );
                    }}
                    className="px-3 py-2.5 border border-purple-200 text-purple-900 hover:bg-purple-50 rounded-xl text-xs font-bold cursor-pointer"
                    title="Örnek Şikayet Yükle"
                  >
                    Örnek 2
                  </button>
                </div>

                {aiError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{aiError}</div>}
              </div>

              {/* Result Area */}
              <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-purple-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-700" />
                      Atölye İş Emri Analiz Çıktısı
                    </h4>
                    {ai1Result && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Ana Şikayet Özeti: ${ai1Result.mainSummary}\nOlası Kaynak / Sistem: ${ai1Result.possibleSource}\nSürüş Güvenliği Riski: ${ai1Result.safetyRisk}\nTeknisyen İçin İlk Kontrol Önerisi: ${ai1Result.technicianFirstCheck}`,
                            "ai1"
                          )
                        }
                        className="text-xs text-purple-700 hover:text-purple-950 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copySuccess === "ai1" ? "Kopyalandı!" : "Kopyala"}
                      </button>
                    )}
                  </div>

                  {ai1Result ? (
                    <div className="space-y-3.5">
                      <div className="bg-white p-3.5 rounded-xl border border-purple-200/80 shadow-2xs">
                        <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                          Ana Şikayet Özeti (Net ve Teknik Tanım)
                        </span>
                        <p className="text-sm font-bold text-slate-950 mt-1">{ai1Result.mainSummary}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs">
                          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                            Olası Kaynak / Sistem
                          </span>
                          <p className="text-sm font-bold text-purple-900 mt-1">{ai1Result.possibleSource}</p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs">
                          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                            Sürüş Güvenliği Riski
                          </span>
                          <div className="mt-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                                ai1Result.safetyRisk?.includes("Kritik")
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : ai1Result.safetyRisk?.includes("Orta")
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                            >
                              {ai1Result.safetyRisk || "Orta"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-100/60 p-3.5 rounded-xl border border-purple-200">
                        <span className="text-[11px] font-extrabold text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          Teknisyen İçin İlk Kontrol Önerisi
                        </span>
                        <p className="text-xs font-semibold text-purple-950 mt-1">{ai1Result.technicianFirstCheck}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <Car className="w-10 h-10 mx-auto mb-2 text-purple-300 opacity-50" />
                      Müşteri açıklamasını girip "İş Emrine Dönüştür" butonuna tıklayınız.
                    </div>
                  )}
                </div>

                {ai1Result && (
                  <div className="pt-4 mt-4 border-t border-purple-200/60 flex justify-end">
                    <button
                      onClick={() => {
                        handleOpenCreateModal();
                        setFormData((prev) => ({
                          ...prev,
                          brand: ai1Vehicle.split(" ")[1] || "Renault",
                          model: ai1Vehicle.split(" ")[2] || "Megane",
                          customerComplaint: ai1Complaint,
                          workshopDiagnosis: `${ai1Result.mainSummary} - Sistem: ${ai1Result.possibleSource} (İlk Kontrol: ${ai1Result.technicianFirstCheck})`,
                        }));
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yeni İş Emrine Aktar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI 2: Teknik Arıza Raporunu Müşteri Diline Çevirme */}
          {aiAssistantTab === "tech_to_customer" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-blue-100 text-blue-900">2. AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">Teknik Arıza Raporunu Müşteri Diline Çevirme</h3>
                  </div>
                  <p className="text-xs text-blue-900/80 font-medium">
                    Ustaların yazdığı teknik raporu şeffaf, kibar ve güven veren bir dille anlaşılır kılar; riskleri açıklar.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Araç Bilgisi</label>
                  <input
                    type="text"
                    value={ai2Vehicle}
                    onChange={(e) => setAi2Vehicle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Teknik Rapor / Arıza Kodları [BURAYA TEKNİK RAPORU YAPIŞTIRIN]
                  </label>
                  <textarea
                    rows={6}
                    value={ai2TechReport}
                    onChange={(e) => setAi2TechReport(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Usta notunu veya arıza kodlarını buraya yapıştırın..."
                  />
                </div>

                <button
                  onClick={() =>
                    runAutoAi(
                      "tech_report_to_customer",
                      { vehicleInfo: ai2Vehicle, techReport: ai2TechReport },
                      setAi2Result
                    )
                  }
                  disabled={aiLoading || !ai2TechReport.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {aiLoading ? "Müşteri Diline Çevriliyor..." : "Güven Veren Müşteri Açıklaması Üret (AI)"}
                </button>
              </div>

              {/* Result */}
              <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      Müşteriye Sunulacak Şeffaf Rapor
                    </h4>
                    {ai2Result && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${ai2Result.explanation}\n\nNeden Değişmeli?: ${ai2Result.whyChange}\n\nDeğiştirilmezse Riskler: ${ai2Result.risksIfNotChanged}`,
                            "ai2"
                          )
                        }
                        className="text-xs text-blue-700 hover:text-blue-950 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copySuccess === "ai2" ? "Kopyalandı!" : "Kopyala"}
                      </button>
                    )}
                  </div>

                  {ai2Result ? (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
                        <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wide block mb-1">
                          Açıklama Metni (Şeffaf & Kibar Dil)
                        </span>
                        <p className="text-sm font-semibold text-slate-900 leading-relaxed">{ai2Result.explanation}</p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs">
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block mb-1">
                          Parçanın Neden Değişmesi Gerekiyor?
                        </span>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">{ai2Result.whyChange}</p>
                      </div>

                      <div className="bg-rose-50/90 p-3.5 rounded-xl border border-rose-300">
                        <span className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wide flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                          Değiştirilmezse Doğabilecek Güvenlik ve Ek Masraf Riskleri
                        </span>
                        <p className="text-xs font-bold text-rose-950 leading-relaxed">{ai2Result.risksIfNotChanged}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-blue-300 opacity-50" />
                      Teknik raporu yapıştırıp butona tıklayarak güven odaklı müşteri metni oluşturun.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI 3: Fiyat Teklifi ve Onay Mesajı */}
          {aiAssistantTab === "quote_message" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-indigo-100 text-indigo-900">3. AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">Fiyat Teklifi ve Onay Mesajı (WhatsApp / SMS)</h3>
                  </div>
                  <p className="text-xs text-indigo-900/80 font-medium">
                    Orijinal/muadil ve işçilik garantisini belirten, güven veren ikna edici onay mesajı hazırlar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Araç Bilgisi</label>
                    <input
                      type="text"
                      value={ai3Vehicle}
                      onChange={(e) => setAi3Vehicle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Kanal / Format</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAi3Channel("whatsapp")}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          ai3Channel === "whatsapp"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setAi3Channel("sms")}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          ai3Channel === "sms"
                            ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        Kısa SMS
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Yapılacak İşlemler ve Fiyatlar [Parça ve işçilik kalemleri]
                  </label>
                  <textarea
                    rows={5}
                    value={ai3ItemsText}
                    onChange={(e) => setAi3ItemsText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="Kalemleri ve fiyatları giriniz..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Toplam Tutar</label>
                  <input
                    type="text"
                    value={ai3Total}
                    onChange={(e) => setAi3Total(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={() =>
                    runAutoAi(
                      "quote_approval_message",
                      {
                        vehicleInfo: ai3Vehicle,
                        partsLaborsText: ai3ItemsText,
                        totalAmount: ai3Total,
                        channel: ai3Channel,
                      },
                      setAi3Result
                    )
                  }
                  disabled={aiLoading || !ai3ItemsText.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  {aiLoading ? "Mesaj Hazırlanıyor..." : "Onay Mesaj Taslağı Oluştur (AI)"}
                </button>
              </div>

              {/* Result */}
              <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-700" />
                      Gönderilmeye Hazır Onay Mesajı
                    </h4>
                    {ai3Result && (
                      <button
                        onClick={() => copyToClipboard(ai3Result.messageText, "ai3")}
                        className="text-xs text-indigo-700 hover:text-indigo-950 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copySuccess === "ai3" ? "Kopyalandı!" : "Kopyala"}
                      </button>
                    )}
                  </div>

                  {ai3Result ? (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs relative">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 text-xs font-bold text-emerald-800">
                          <span>{ai3Channel === "whatsapp" ? "🟢 WhatsApp Mesajı" : "🔵 SMS Formatı"}</span>
                        </div>
                        <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {ai3Result.messageText}
                        </pre>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(ai3Result.messageText)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                        >
                          <MessageSquare className="w-4 h-4" />
                          WhatsApp ile Gönder
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-indigo-300 opacity-50" />
                      Kalem ve tutarları girerek müşteriye özel onay mesajı oluşturun.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI 4: Ekstra İhtiyaç Hatırlatma */}
          {aiAssistantTab === "reminder" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-900">4. AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">Ek Bakım & Önleyici Onarım Hatırlatması</h3>
                  </div>
                  <p className="text-xs text-emerald-900/80 font-medium">
                    Servis kontrolünde fark edilen ek ihtiyaçları baskı kurmadan, güvenlik odaklı aktaran konuşma ve mesaj akışı üretir.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Araç Bilgisi</label>
                  <input
                    type="text"
                    value={ai4Vehicle}
                    onChange={(e) => setAi4Vehicle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tespit Edilen Ek İhtiyaçlar [Gözlenen riskler ve parçalar]
                  </label>
                  <textarea
                    rows={6}
                    value={ai4ExtraIssues}
                    onChange={(e) => setAi4ExtraIssues(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Örn: Akü sağlığı %40, ön rot başı boşluklu..."
                  />
                </div>

                <button
                  onClick={() =>
                    runAutoAi(
                      "maintenance_recommendation",
                      { vehicleInfo: ai4Vehicle, extraIssues: ai4ExtraIssues },
                      setAi4Result
                    )
                  }
                  disabled={aiLoading || !ai4ExtraIssues.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  {aiLoading ? "Öneri Hazırlanıyor..." : "Önleyici Hatırlatma Metni Oluştur (AI)"}
                </button>
              </div>

              {/* Result */}
              <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-700" />
                      Telefon Konuşması & WhatsApp Metni
                    </h4>
                    {ai4Result && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${ai4Result.phoneScript}\n\nWhatsApp Özeti:\n${ai4Result.whatsappSummary}`,
                            "ai4"
                          )
                        }
                        className="text-xs text-emerald-700 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copySuccess === "ai4" ? "Kopyalandı!" : "Kopyala"}
                      </button>
                    )}
                  </div>

                  {ai4Result ? (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
                        <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide block mb-1">
                          Danışman Telefon Konuşma Akışı
                        </span>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {ai4Result.phoneScript}
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                        <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide block mb-1">
                          WhatsApp Takip Mesajı
                        </span>
                        <pre className="text-xs font-sans font-medium text-slate-800 whitespace-pre-wrap">
                          {ai4Result.whatsappSummary}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <Phone className="w-10 h-10 mx-auto mb-2 text-emerald-300 opacity-50" />
                      Ek ihtiyaçları yazıp hatırlatma ve konuşma akışını oluşturun.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRINT PREVIEW & OFFICIAL DOCUMENTS */}
      {activeTab === "print_preview" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-extrabold text-purple-950">Belge Türü:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPrintDocType("reception")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    printDocType === "reception"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  Araç Kabul Fişi
                </button>
                <button
                  onClick={() => setPrintDocType("work_order")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    printDocType === "work_order"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  İş Emri / Atölye Kartı
                </button>
                <button
                  onClick={() => setPrintDocType("quote")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    printDocType === "quote"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  Fiyat & Parça Teklifi
                </button>
                <button
                  onClick={() => setPrintDocType("delivery")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    printDocType === "delivery"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  Araç Teslim Tutanağı
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                value={selectedRecord?.id || ""}
                onChange={(e) => {
                  const rec = autoServices.find((s) => s.id === e.target.value);
                  if (rec) setSelectedRecord(rec);
                }}
                className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-bold text-purple-950 bg-white"
              >
                {autoServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.plateNumber} - {s.brand} {s.model} ({s.serviceNo})
                  </option>
                ))}
              </select>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Yazdır / PDF
              </button>
            </div>
          </div>

          {/* Printable Document Box */}
          {selectedRecord ? (
            <div className="bg-white p-8 rounded-3xl border border-purple-200 shadow-lg max-w-4xl mx-auto printable-content">
              {/* Top Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">OTO TEKNİK SERVİS & BAKIM HİZMETLERİ</h2>
                  <p className="text-xs font-bold text-slate-600 mt-1">
                    Yetkili Seviye Özel Servis Hizmetleri • Tel: 0850 300 00 00 • E-posta: servis@muavinservis.com
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-black text-purple-900">{selectedRecord.serviceNo}</div>
                  <div className="text-xs font-bold text-slate-500">Tarih: {selectedRecord.entryDate} {selectedRecord.entryTime}</div>
                </div>
              </div>

              {/* Title */}
              <div className="bg-slate-100 py-2 px-4 rounded-xl font-extrabold text-slate-900 text-center uppercase tracking-wider text-sm mb-6 border border-slate-200">
                {printDocType === "reception" && "ARAÇ KABUL VE TESLİM ALMA TUTANAĞI"}
                {printDocType === "work_order" && "ATÖLYE İŞ EMRİ VE PARÇA DEĞİŞİM FORMU"}
                {printDocType === "quote" && "PARÇA, İŞÇİLİK VE FİYAT TEKLİFİ"}
                {printDocType === "delivery" && "ARAÇ VE HİZMET TESLİM / İŞ BİTİM TUTANAĞI"}
              </div>

              {/* Vehicle & Customer Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-extrabold text-purple-900 uppercase border-b pb-1">Araç Bilgileri</h4>
                  <div className="text-xs grid grid-cols-2 gap-y-1.5 font-medium">
                    <span className="text-slate-500">Plaka:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{selectedRecord.plateNumber}</span>
                    <span className="text-slate-500">Marka / Model:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.brand} {selectedRecord.model} ({selectedRecord.modelYear})</span>
                    <span className="text-slate-500">Şasi No (VIN):</span>
                    <span className="font-mono text-slate-800">{selectedRecord.chassisNumber || "Belirtilmedi"}</span>
                    <span className="text-slate-500">Giriş Kilometresi:</span>
                    <span className="font-bold text-purple-900">{selectedRecord.currentKm.toLocaleString("tr-TR")} KM</span>
                    <span className="text-slate-500">Yakıt / Seviye:</span>
                    <span className="text-slate-800">{selectedRecord.fuelType} / {selectedRecord.fuelLevel}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-extrabold text-purple-900 uppercase border-b pb-1">Müşteri & Danışman Bilgileri</h4>
                  <div className="text-xs grid grid-cols-2 gap-y-1.5 font-medium">
                    <span className="text-slate-500">Müşteri / Cari:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.contactName}</span>
                    <span className="text-slate-500">Telefon:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.contactPhone}</span>
                    <span className="text-slate-500">E-Posta:</span>
                    <span className="text-slate-800">{selectedRecord.contactEmail || "-"}</span>
                    <span className="text-slate-500">Sorumlu Teknisyen:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.assignedTechnician}</span>
                    <span className="text-slate-500">Araçtaki Eşyalar:</span>
                    <span className="text-slate-800">{selectedRecord.valuableItemsInCar || "Yok"}</span>
                  </div>
                </div>
              </div>

              {/* Beraberinde Getirilen Eşyalar ve Fiziksel Kusur / Deformasyon Durumu */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-black text-purple-950 uppercase block">
                    Beraberinde Teslim Alınanlar (Aksesuarlar / Donanımlar):
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedRecord.accessoriesReceived || selectedRecord.valuableItemsInCar || "Harici parça / aksesuar teslim alınmadı."}
                  </p>
                </div>
                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-black text-amber-950 uppercase block">
                    Araç Fiziksel Durumu (Çizik, Göçük & Deformasyon):
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedRecord.damagePhysicalCondition ? (
                      <span className="text-amber-950 font-bold">{selectedRecord.damagePhysicalCondition}</span>
                    ) : (
                      <span className="text-emerald-800 font-bold">Kayıt anında tespit edilen çizik/deformasyon bulunmamaktadır.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Complaint & Diagnosis */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-6">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Müşteri Şikayeti & Giriş Sebebi:</span>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5">{selectedRecord.customerComplaint || "Periyodik bakım ve kontrol"}</p>
                </div>
                {selectedRecord.workshopDiagnosis && (
                  <div>
                    <span className="text-[11px] font-extrabold text-purple-900 uppercase">Atölye Ön Teşhis & Tespit Raporu:</span>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">{selectedRecord.workshopDiagnosis}</p>
                  </div>
                )}
              </div>

              {/* Parts & Labors Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold">
                      <th className="py-2.5 px-3">Kalem Açıklaması / Parça</th>
                      <th className="py-2.5 px-3">Tür</th>
                      <th className="py-2.5 px-3 text-right">Miktar/Saat</th>
                      <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                      <th className="py-2.5 px-3 text-right">KDV %</th>
                      <th className="py-2.5 px-3 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.parts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{p.partName}</td>
                        <td className="py-2 px-3 text-slate-500 capitalize">{p.partType}</td>
                        <td className="py-2 px-3 text-right font-mono">{p.quantity} {p.unit}</td>
                        <td className="py-2 px-3 text-right font-mono">₺{p.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">%{p.vatRate}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">₺{p.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {selectedRecord.labors.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 font-semibold text-purple-900">İşçilik: {l.operationName}</td>
                        <td className="py-2 px-3 text-slate-500">Usta İşçilik</td>
                        <td className="py-2 px-3 text-right font-mono">{l.hours} Saat</td>
                        <td className="py-2 px-3 text-right font-mono">₺{l.hourlyRate.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">%{l.vatRate}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">₺{l.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Yedek Parça Toplamı:</span>
                    <span className="font-mono">₺{selectedRecord.partsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>İşçilik Toplamı:</span>
                    <span className="font-mono">₺{selectedRecord.laborTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Hesaplanan KDV (%20):</span>
                    <span className="font-mono">₺{selectedRecord.totalVat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-purple-950 pt-2 border-t border-slate-300">
                    <span>GENEL TOPLAM:</span>
                    <span className="font-mono">₺{selectedRecord.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 text-xs">
                <div className="text-center">
                  <p className="font-bold text-slate-700">Teslim Eden (Müşteri)</p>
                  <p className="text-slate-500 mt-1">{selectedRecord.contactName}</p>
                  <div className="mt-12 border-b border-slate-300 w-48 mx-auto" />
                  <span className="text-[10px] text-slate-400">İmza</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700">Teslim Alan (Servis Danışmanı / Usta)</p>
                  <p className="text-slate-500 mt-1">{selectedRecord.assignedTechnician}</p>
                  <div className="mt-12 border-b border-slate-300 w-48 mx-auto" />
                  <span className="text-[10px] text-slate-400">İmza & Kaşe</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-purple-200 text-center text-slate-400">
              Görüntülenecek bir servis kaydı bulunmamaktadır.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
