import React, { useState } from "react";
import {
  Laptop,
  Cpu,
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
  HardDrive,
  Info,
  DollarSign,
  RefreshCw,
  Check,
  ChevronDown,
  X,
  Server,
  Mail,
  ListOrdered,
  KeyRound,
  ShieldAlert,
  FileCheck,
  Receipt,
  CheckCircle2,
  MessageCircle,
  Package,
} from "lucide-react";
import {
  ItServiceRecord,
  ItPartItem,
  ItLaborItem,
  Contact,
  ItServiceStatus,
  ItDeviceType,
  Invoice,
  CompanySettings,
} from "../../types";
import { ServiceInvoicingModal } from "../ServiceInvoicingModal";
import { ServiceWhatsAppModal } from "../ServiceWhatsAppModal";
import { ServiceDeliveryModal } from "../ServiceDeliveryModal";

interface ITServiceModuleProps {
  itServices: ItServiceRecord[];
  onUpdateItServices: (services: ItServiceRecord[]) => void;
  contacts: Contact[];
  companySettings?: CompanySettings;
  onAddInvoice?: (invoice: Invoice) => void;
  onAddContact?: (contact: Contact) => void;
}

export const ITServiceModule: React.FC<ITServiceModuleProps> = ({
  itServices,
  onUpdateItServices,
  contacts,
  companySettings,
  onAddInvoice,
  onAddContact,
}) => {
  const [activeTab, setActiveTab] = useState<"records" | "ai_assistants" | "print_preview">("records");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<ItServiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [printDocType, setPrintDocType] = useState<"reception" | "work_order" | "quote" | "delivery">("reception");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Delivery Modal State
  const [deliveryRecord, setDeliveryRecord] = useState<ItServiceRecord | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // WhatsApp State
  const [whatsAppRecord, setWhatsAppRecord] = useState<ItServiceRecord | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTemplateType, setWhatsAppTemplateType] = useState<"completed" | "invoiced" | "diagnosis_approval" | "reception">("completed");

  // Invoicing & Status Dropdown States
  const [invoicingRecord, setInvoicingRecord] = useState<ItServiceRecord | null>(null);
  const [isInvoicingModalOpen, setIsInvoicingModalOpen] = useState(false);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  // AI Assistant States
  const [aiAssistantTab, setAiAssistantTab] = useState<"triage" | "troubleshoot" | "quote_message" | "email">("triage");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI 1: Triage Assessment
  const [ai1Device, setAi1Device] = useState("Lenovo ThinkPad E14 Gen 4 (i7-1255U / 16GB RAM / 512GB NVMe SSD)");
  const [ai1Problem, setAi1Problem] = useState(
    "Cihaz prize takılıyken şarj ışığı yanıyor fakat güç tuşuna basıldığında fanlar 2 saniye dönüp kapanıyor, ekrana hiç görüntü gelmiyor. Klavye ışıkları bir kez yanıp sönüyor."
  );
  const [ai1Result, setAi1Result] = useState<any>(null);

  // AI 2: Step-by-Step Troubleshooting
  const [ai2Device, setAi2Device] = useState("Dell PowerEdge T340 Tower Server (Windows Server 2022 / RAID 5)");
  const [ai2Symptoms, setAi2Symptoms] = useState(
    "Sunucu açılışta 'RAID Controller Configuration Error' veriyor. 2 numaralı SAS HDD yuvasında sarı LED sürekli yanıp sönüyor ve işletim sistemi boot olmuyor."
  );
  const [ai2Result, setAi2Result] = useState<any>(null);

  // AI 3: IT Quote & Approval Message
  const [ai3Device, setAi3Device] = useState("Apple MacBook Pro 14 M1 Pro (2021)");
  const [ai3PartsText, setAi3PartsText] = useState(
    "- Orijinal Apple 14 inç Liquid Retina XDR Ekran Paneli: 14.800 TL\n- Ekran Flex Kablo Takımı & Sensör Montajı: 1.200 TL\n- Laboratuvar Hassas Montaj & Kalibrasyon İşçiliği: 2.200 TL\nToplam: 18.200 TL (KDV Dahil / 24 Ay Parça Garantisi)"
  );
  const [ai3Total, setAi3Total] = useState("18.200 TL");
  const [ai3BackupNote, setAi3BackupNote] = useState("Kullanıcı SSD verileri korundu, format atılmayacaktır.");
  const [ai3Channel, setAi3Channel] = useState<"whatsapp" | "sms">("whatsapp");
  const [ai3Result, setAi3Result] = useState<any>(null);

  // AI 4: Non-technical Client Email
  const [ai4Device, setAi4Device] = useState("Asus ROG Strix G15 (Ryzen 7 6800H / RTX 3060)");
  const [ai4Repairs, setAi4Repairs] = useState(
    "Cihaz aşırı ısınma ve aniden kapanma şikayetiyle geldi. İç fan yatakları toz tıkanıklığından kilitlenmişti. Sıvı metal termal macun kurumuştu. Fanlar ultrasonik temizlendi, Noctua NT-H2 termal macun uygulandı ve BIOS güncellemesi yapıldı. Stres testinde sıcaklık 98C'den 74C'ye düştü."
  );
  const [ai4Result, setAi4Result] = useState<any>(null);

  // Record Form Modal State
  const [formData, setFormData] = useState<Partial<ItServiceRecord>>({
    serviceNo: "",
    deviceType: "laptop",
    brand: "",
    model: "",
    serialNumber: "",
    devicePasswordPin: "",
    hasChargerIncluded: true,
    accessoriesIncluded: "Şarj Cihazı ve Güç Kablosu",
    accessoriesReceived: "Şarj Adaptörü, Güç Kablosu ve Koruma Kılıfı",
    damagePhysicalCondition: "",
    dataBackupStatus: "backup_taken",
    dataBackupNotes: "Veriler müşteri tarafından yedeklendi.",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    entryDate: new Date().toISOString().split("T")[0],
    status: "reception",
    customerProblemDescription: "",
    technicianReport: "",
    assignedTechnician: "Oğuz Yılmaz (BT Uzmanı)",
    parts: [],
    labors: [],
    partsTotal: 0,
    laborTotal: 0,
    totalVat: 0,
    grandTotal: 0,
    isApprovedByCustomer: false,
    notes: "",
  });

  // Modal Part/Labor inputs
  const [newPartName, setNewPartName] = useState("");
  const [newPartCategory, setNewPartCategory] = useState<ItPartItem["category"]>("ssd_hdd");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [newPartVat, setNewPartVat] = useState(20);

  const [newLaborName, setNewLaborName] = useState("");
  const [newLaborHours, setNewLaborHours] = useState(1);
  const [newLaborRate, setNewLaborRate] = useState(850);
  const [newLaborVat, setNewLaborVat] = useState(20);

  // Status mapping & options
  const itStatusOptions: { value: ItServiceStatus; label: string; desc: string; bg: string; color: string; dot: string }[] = [
    { value: "reception", label: "Cihaz Kabulü", desc: "Cihaz teslim alındı, giriş kaydı açıldı", bg: "bg-amber-100/90 border-amber-300", color: "text-amber-900", dot: "bg-amber-500" },
    { value: "diagnosing", label: "Ön Teşhis / İnceleme", desc: "Donanım/yazılım analizi ve arıza tespiti", bg: "bg-blue-100/90 border-blue-300", color: "text-blue-900", dot: "bg-blue-500" },
    { value: "quote_pending", label: "Müşteri Onayı Bekliyor", desc: "Müşteriye teklif iletildi, onay bekleniyor", bg: "bg-purple-100/90 border-purple-300", color: "text-purple-900", dot: "bg-purple-500" },
    { value: "parts_ordered", label: "Parça Bekleniyor", desc: "Çip/ekran/donanım siparişte tedarik ediliyor", bg: "bg-orange-100/90 border-orange-300", color: "text-orange-900", dot: "bg-orange-500" },
    { value: "repairing", label: "Laboratuvarda Onarımda", desc: "BGA/Lehim/Bileşen değişimi yapılıyor", bg: "bg-indigo-100/90 border-indigo-300", color: "text-indigo-900", dot: "bg-indigo-500" },
    { value: "testing", label: "Stres Testi & Kararlılık", desc: "MemTest, FurMark ve kararlılık testleri", bg: "bg-cyan-100/90 border-cyan-300", color: "text-cyan-900", dot: "bg-cyan-500" },
    { value: "ready", label: "Teslime Hazır (Onarım Bitti)", desc: "Onarım ve testler tamamlandı, teslime hazır", bg: "bg-emerald-100/90 border-emerald-300", color: "text-emerald-900", dot: "bg-emerald-500" },
    { value: "delivered", label: "Teslim Edildi & Faturalandı", desc: "Müşteriye teslim edildi, fatura kesildi", bg: "bg-slate-200 border-slate-300", color: "text-slate-900", dot: "bg-blue-600" },
    { value: "cancelled", label: "İptal / İade", desc: "Servis iptal edildi veya iade edildi", bg: "bg-rose-100/90 border-rose-300", color: "text-rose-900", dot: "bg-rose-500" },
  ];

  const statusLabels: Record<ItServiceStatus, { label: string; color: string; bg: string }> = {
    reception: { label: "Cihaz Kabulü", color: "text-amber-800", bg: "bg-amber-100/90 border-amber-300" },
    diagnosing: { label: "Ön Teşhis / İnceleme", color: "text-blue-800", bg: "bg-blue-100/90 border-blue-300" },
    quote_pending: { label: "Müşteri Onayı Bekliyor", color: "text-purple-800", bg: "bg-purple-100/90 border-purple-300" },
    parts_ordered: { label: "Parça Bekleniyor", color: "text-orange-800", bg: "bg-orange-100/90 border-orange-300" },
    repairing: { label: "Laboratuvarda Onarımda", color: "text-indigo-800", bg: "bg-indigo-100/90 border-indigo-300" },
    testing: { label: "Stres Testi & Kararlılık", color: "text-cyan-800", bg: "bg-cyan-100/90 border-cyan-300" },
    ready: { label: "Teslime Hazır", color: "text-emerald-800", bg: "bg-emerald-100/90 border-emerald-300" },
    delivered: { label: "Teslim Edildi", color: "text-slate-800", bg: "bg-slate-200 border-slate-300" },
    cancelled: { label: "İptal / İade", color: "text-rose-800", bg: "bg-rose-100/90 border-rose-300" },
  };

  const handleQuickStatusChange = (recordId: string, newStatus: ItServiceStatus) => {
    const updated = itServices.map((s) => {
      if (s.id === recordId) {
        return {
          ...s,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateItServices(updated);
    setOpenStatusDropdownId(null);
  };

  const handleOpenInvoicing = (record: ItServiceRecord) => {
    setInvoicingRecord(record);
    setIsInvoicingModalOpen(true);
  };

  const handleOpenWhatsApp = (
    record: ItServiceRecord,
    preferredType?: "completed" | "invoiced" | "diagnosis_approval" | "reception"
  ) => {
    setWhatsAppRecord(record);
    if (preferredType) {
      setWhatsAppTemplateType(preferredType);
    } else if (record.invoiceNumber || record.invoiceId) {
      setWhatsAppTemplateType("invoiced");
    } else if (record.status === "ready" || record.status === "delivered" || record.status === "testing") {
      setWhatsAppTemplateType("completed");
    } else if (record.status === "quote_pending") {
      setWhatsAppTemplateType("diagnosis_approval");
    } else {
      setWhatsAppTemplateType("completed");
    }
    setIsWhatsAppModalOpen(true);
  };

  const handleOpenDeliveryModal = (record: ItServiceRecord) => {
    setDeliveryRecord(record);
    setIsDeliveryModalOpen(true);
  };

  const handleMarkDelivered = (serviceId: string) => {
    const updated = itServices.map((s) => {
      if (s.id === serviceId) {
        return {
          ...s,
          status: "delivered" as ItServiceStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateItServices(updated);
  };

  const handleServiceInvoiced = (serviceId: string, invoiceId: string, invoiceNumber: string) => {
    const updated = itServices.map((s) => {
      if (s.id === serviceId) {
        const invoicedRec = {
          ...s,
          status: "delivered" as ItServiceStatus,
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
    onUpdateItServices(updated);
  };

  const deviceTypeLabels: Record<ItDeviceType, string> = {
    laptop: "Dizüstü Bilgisayar (Laptop)",
    desktop: "Masaüstü PC (Kasa)",
    macbook: "Apple MacBook",
    imac: "Apple iMac / Mac Mini",
    server: "Sunucu (Server)",
    workstation: "İş İstasyonu (Workstation)",
    tablet: "Tablet Bilgisayar",
    smartphone: "Akıllı Telefon",
    printer: "Yazıcı / Tarayıcı",
    network_device: "Router / Switch / Firewall",
    storage_nas: "NAS / Harici Depolama",
    other: "Diğer Bilişim Cihazı",
  };

  // KPIs
  const totalServices = itServices.length;
  const activeServices = itServices.filter((s) => s.status !== "delivered" && s.status !== "cancelled").length;
  const quotePendingCount = itServices.filter((s) => s.status === "quote_pending").length;
  const inRepairCount = itServices.filter((s) => s.status === "repairing" || s.status === "testing").length;
  const readyCount = itServices.filter((s) => s.status === "ready" || s.status === "delivered").length;
  const totalRevenue = itServices
    .filter((s) => s.status === "delivered" || s.isApprovedByCustomer)
    .reduce((acc, s) => acc + s.grandTotal, 0);

  // Filtered List
  const filteredServices = itServices.filter((s) => {
    const matchesQuery =
      s.serviceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.serialNumber && s.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormData({
      id: "it_srv_" + Date.now(),
      serviceNo: `BT-${new Date().getFullYear()}-${String(itServices.length + 101).padStart(4, "0")}`,
      deviceType: "laptop",
      brand: "",
      model: "",
      serialNumber: "",
      devicePasswordPin: "",
      hasChargerIncluded: true,
      accessoriesIncluded: "Şarj Cihazı ve Güç Kablosu",
      accessoriesReceived: "Şarj Adaptörü, Orijinal Güç Kablosu",
      damagePhysicalCondition: "",
      dataBackupStatus: "backup_taken",
      dataBackupNotes: "Veriler müşteri tarafından yedeklendi veya yedek talep edildi.",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      entryDate: new Date().toISOString().split("T")[0],
      status: "reception",
      customerProblemDescription: "",
      technicianReport: "",
      assignedTechnician: "Oğuz Yılmaz (Kıdemli BT Teknisyeni)",
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

  const handleOpenEditModal = (rec: ItServiceRecord) => {
    setModalMode("edit");
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const total = newPartQty * newPartPrice;
    const newPart: ItPartItem = {
      id: "it_part_" + Date.now(),
      partName: newPartName.trim(),
      category: newPartCategory,
      quantity: newPartQty,
      unitPrice: newPartPrice,
      vatRate: newPartVat,
      total,
      warrantyMonths: 24,
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
    const newLabor: ItLaborItem = {
      id: "it_labor_" + Date.now(),
      operationName: newLaborName.trim(),
      technicianName: formData.assignedTechnician || "BT Uzmanı",
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
    if (!formData.brand || !formData.model) {
      alert("Lütfen cihaz marka ve model bilgilerini giriniz.");
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

    const recordToSave: ItServiceRecord = {
      ...(formData as ItServiceRecord),
      partsTotal: partsTot,
      laborTotal: laborTot,
      totalVat: vatTot,
      grandTotal: grandTot,
      updatedAt: new Date().toISOString(),
    };

    if (modalMode === "create") {
      onUpdateItServices([recordToSave, ...itServices]);
    } else {
      onUpdateItServices(itServices.map((s) => (s.id === recordToSave.id ? recordToSave : s)));
    }

    setIsModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Bu bilişim teknik servis kaydını silmek istediğinize emin misiniz?")) {
      onUpdateItServices(itServices.filter((s) => s.id !== id));
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

  // Call Server-Side Gemini API for IT Service AI
  const runItAi = async (action: string, payload: any, setResultState: (val: any) => void) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/gemini/it-service-ai", {
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
      setAiError(err.message || "BT AI servisine bağlanılamadı.");
    } finally {
      setAiLoading(false);
    }
  };

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
                <Laptop className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
                  <span>Bilişim & BT Teknik Servis Yönetimi</span>
                  <span className="text-[10px] font-extrabold bg-purple-200/80 text-purple-950 border border-purple-300/80 px-2 py-0.5 rounded-full">
                    AI Laboratuvar
                  </span>
                </h2>
                <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
                  Cihaz Kabulü, Donanım & Çip Onarımı, Veri Güvenliği, Yedek Parça Takibi ve 4 BT AI Aracı.
                </p>
              </div>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("records")}
              className={`font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                activeTab === "records"
                  ? "bg-purple-700 text-white shadow-md shadow-purple-600/30"
                  : "bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Cihaz Kabul & Kayıtlar</span>
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
              <span>AI BT Danışmanı</span>
            </button>

            <button
              onClick={() => {
                if (itServices.length > 0 && !selectedRecord) {
                  setSelectedRecord(itServices[0]);
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
          {/* Card 1: Cihaz Kabulü (Amber) */}
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
                <span>Cihaz Kabulü</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Laptop className="w-5 h-5 text-amber-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                {activeServices} Cihaz
              </div>
              <p className="text-xs font-semibold text-amber-900/80 mt-1 flex items-center gap-1">
                <span className="text-amber-950 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300/80">
                  {itServices.filter((s) => s.status === "reception").length} Yeni Giriş
                </span>{" "}
                kaydı yapıldı
              </p>
            </div>
          </button>

          {/* Card 2: Teşhis & Laboratuvar (Blue) */}
          <button
            onClick={() => {
              setActiveTab("records");
              setStatusFilter("repairing");
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              statusFilter === "repairing" && activeTab === "records"
                ? "bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-100/80 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                : "bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 border-blue-300/70 hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                <span>Laboratuvarda Onarım</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Cpu className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                {inRepairCount} Cihaz
              </div>
              <p className="text-xs font-semibold text-blue-900/80 mt-1 flex items-center gap-1">
                <span className="text-blue-950 font-bold bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300/80">
                  Onarım & Test
                </span>{" "}
                aşamasında
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
                <span>Maliyet Onayı</span>
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
                  Parça / Onay
                </span>{" "}
                bekleniyor
              </p>
            </div>
          </button>

          {/* Card 4: Teslime Hazır & Garantili (Fuchsia) */}
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
                {readyCount} Cihaz
              </div>
              <p className="text-xs font-semibold text-fuchsia-900/80 mt-1 flex items-center gap-1">
                <span className="text-fuchsia-950 font-bold bg-fuchsia-200/80 px-1.5 py-0.5 rounded border border-fuchsia-300/80">
                  {itServices.filter((s) => s.status === "delivered").length} Teslim
                </span>{" "}
                edildi
              </p>
            </div>
          </button>

          {/* Card 5: Toplam BT Servis Cirosu (Emerald) */}
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
                <span>Toplam BT Cirosu</span>
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
                  {totalServices} Servis
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
                  placeholder="Seri no, cihaz marka, model, müşteri veya servis no ara..."
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
                <option value="all">Tüm Durumlar ({itServices.length})</option>
                <option value="reception">Cihaz Kabulü</option>
                <option value="diagnosing">Ön Teşhis / İnceleme</option>
                <option value="quote_pending">Müşteri Onayı Bekliyor</option>
                <option value="parts_ordered">Parça Bekleniyor</option>
                <option value="repairing">Laboratuvarda Onarımda</option>
                <option value="testing">Stres Testi</option>
                <option value="ready">Teslime Hazır</option>
                <option value="delivered">Teslim Edildi</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Cihaz Kabulü & Servis</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-50/70 border-b border-purple-200/70 text-xs font-extrabold text-purple-950 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Servis No / Cihaz</th>
                    <th className="py-3.5 px-4">Seri No / Güvenlik</th>
                    <th className="py-3.5 px-4">Müşteri & İletişim</th>
                    <th className="py-3.5 px-4">Giriş / Yedekleme</th>
                    <th className="py-3.5 px-4">Arıza / Şikayet</th>
                    <th className="py-3.5 px-4">Tutar & Onay</th>
                    <th className="py-3.5 px-4">Durum</th>
                    <th className="py-3.5 px-4 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/80 text-sm text-slate-700">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Laptop className="w-10 h-10 mx-auto mb-2 text-purple-300 opacity-60" />
                        <span className="font-semibold text-slate-600">Arama kriterlerine uygun bilişim cihaz kaydı bulunamadı.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((record) => {
                      const st = statusLabels[record.status] || statusLabels.reception;
                      return (
                        <tr key={record.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-purple-950">{record.serviceNo}</div>
                            <div className="font-bold text-slate-900 mt-0.5">
                              {record.brand} {record.model}
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {deviceTypeLabels[record.deviceType] || record.deviceType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs font-bold text-slate-800">
                              SN: {record.serialNumber || "Yok / Okunmadı"}
                            </div>
                            {record.devicePasswordPin && (
                              <div className="text-[11px] text-amber-700 font-mono flex items-center gap-1 mt-0.5">
                                <KeyRound className="w-3 h-3" /> PIN: {record.devicePasswordPin}
                              </div>
                            )}
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
                            <div className="text-[11px] font-bold mt-0.5">
                              {record.dataBackupStatus === "backup_taken" ? (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Yedek Alındı
                                </span>
                              ) : (
                                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Yedeksiz
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-xs text-slate-600 line-clamp-2" title={record.customerProblemDescription}>
                              <strong className="text-slate-900">Arıza:</strong> {record.customerProblemDescription}
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
                                <span className={`w-2 h-2 rounded-full ${itStatusOptions.find(o => o.value === record.status)?.dot || 'bg-slate-400'}`} />
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
                                      <span>BT Durumu Değiştir</span>
                                      <span className="text-purple-700 font-mono font-bold text-[10px]">{record.serviceNo}</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-1">
                                      {itStatusOptions.map((opt) => {
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
                                        <span>Cihaz Teslim Tutanağı</span>
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
                                title="Cihaz Teslim Tutanağını Görüntüle ve Yazdır"
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

      {/* TAB 2: AI ASSISTANTS (4 ÖZEL BT ARACI) */}
      {activeTab === "ai_assistants" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-tabs for the 4 AI BT Assistants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setAiAssistantTab("triage")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
                aiAssistantTab === "triage"
                  ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-100/80 border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                  : "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/70 border-amber-300/70 hover:border-amber-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-600 text-white">1. Asistan</span>
                <Sparkles className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-extrabold text-amber-950 text-sm">Arıza Ön Değerlendirme Raporu</h3>
              <p className="text-xs text-amber-900/80 font-medium mt-1 line-clamp-2">
                Müşteri bildiriminden teknik tanım, risk ve çözüm tahmini raporu üretir.
              </p>
            </button>

            <button
              onClick={() => setAiAssistantTab("troubleshoot")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
                aiAssistantTab === "troubleshoot"
                  ? "bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-100/80 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                  : "bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 border-blue-300/70 hover:border-blue-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-600 text-white">2. Asistan</span>
                <ListOrdered className="w-4 h-4 text-blue-700" />
              </div>
              <h3 className="font-extrabold text-blue-950 text-sm">Adım Adım Sorun Giderme</h3>
              <p className="text-xs text-blue-900/80 font-medium mt-1 line-clamp-2">
                Teknisyen için en basitten donanıma doğru mantıksal sıralı rehber hazırlar.
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
              <h3 className="font-extrabold text-indigo-950 text-sm">Onarım Maliyet Onay Metni</h3>
              <p className="text-xs text-indigo-900/80 font-medium mt-1 line-clamp-2">
                Parça ve işçilik garantisini belirten güvenilir WhatsApp / SMS metni.
              </p>
            </button>

            <button
              onClick={() => setAiAssistantTab("email")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
                aiAssistantTab === "email"
                  ? "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-100/80 border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                  : "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-50/70 border-emerald-300/70 hover:border-emerald-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-600 text-white">4. Asistan</span>
                <Mail className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="font-extrabold text-emerald-950 text-sm">Müşteri Bilgilendirme E-postası</h3>
              <p className="text-xs text-emerald-900/80 font-medium mt-1 line-clamp-2">
                Teknik terimlerden arındırılmış, yapılanları ve tavsiyeleri anlatan e-posta.
              </p>
            </button>
          </div>

          {/* AI 1: Arıza Ön Değerlendirme */}
          {aiAssistantTab === "triage" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-purple-100 text-purple-900">1. BT AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">BT / Donanım Arıza Ön Değerlendirme Raporu</h3>
                  </div>
                  <p className="text-xs text-purple-900/80 font-medium">
                    Müşteri bildirimini analiz ederek teknik tanım, donanımsal/yazılımsal kaynaklar, veri güvenliği riski ve çözüm adımlarını çıkarır.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Cihaz Bilgisi</label>
                  <input
                    type="text"
                    value={ai1Device}
                    onChange={(e) => setAi1Device(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Müşterinin İlettiği Arıza [BELİRTİLEN SORUNU YAZIN]
                  </label>
                  <textarea
                    rows={5}
                    value={ai1Problem}
                    onChange={(e) => setAi1Problem(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="Ekrana görüntü gelmeme, mavi ekran, kapanma veya ses sorunları..."
                  />
                </div>

                <button
                  onClick={() =>
                    runItAi(
                      "triage_assessment",
                      { deviceInfo: ai1Device, customerProblem: ai1Problem },
                      setAi1Result
                    )
                  }
                  disabled={aiLoading || !ai1Problem.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  {aiLoading ? "Arıza Analiz Ediliyor..." : "Ön Değerlendirme Raporu Oluştur (AI)"}
                </button>

                {aiError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{aiError}</div>}
              </div>

              {/* Result Area */}
              <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-purple-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-700" />
                      Laboratuvar Ön Değerlendirme Raporu
                    </h4>
                    {ai1Result && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Arıza Özeti: ${ai1Result.technicalSummary}\nOlası Nedenler: ${ai1Result.possibleCauses}\nVeri Güvenliği Riski: ${ai1Result.dataRisk}\nTahmini Çözüm & Süre: ${ai1Result.estimatedSolution}`,
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
                          Arıza Özeti (Teknik Tanım)
                        </span>
                        <p className="text-sm font-bold text-slate-950 mt-1">{ai1Result.technicalSummary}</p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-purple-200/80 shadow-2xs">
                        <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                          Olası Nedenler (Donanımsal / Yazılımsal)
                        </span>
                        <p className="text-xs font-semibold text-purple-900 mt-1">{ai1Result.possibleCauses}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs">
                          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                            Veri Güvenliği Riski
                          </span>
                          <div className="mt-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                                ai1Result.dataRisk?.includes("Kritik") || ai1Result.dataRisk?.includes("Yüksek")
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : ai1Result.dataRisk?.includes("Orta")
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                            >
                              {ai1Result.dataRisk || "Düşük"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs">
                          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                            Tahmini Çözüm Süresi
                          </span>
                          <p className="text-xs font-bold text-slate-900 mt-1">{ai1Result.estimatedSolution || "2-4 İş Günü"}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <Laptop className="w-10 h-10 mx-auto mb-2 text-purple-300 opacity-50" />
                      Arıza açıklamasını yazarak yapay zeka ön inceleme raporunu oluşturun.
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
                          brand: ai1Device.split(" ")[0] || "Lenovo",
                          model: ai1Device.split(" ")[1] || "ThinkPad",
                          customerProblemDescription: ai1Problem,
                          technicianReport: `${ai1Result.technicalSummary} - Olası Neden: ${ai1Result.possibleCauses} (Veri Riski: ${ai1Result.dataRisk})`,
                        }));
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yeni BT Servis Kaydına Aktar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI 2: Troubleshooting Rehberi */}
          {aiAssistantTab === "troubleshoot" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-blue-100 text-blue-900">2. BT AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">Adım Adım Sorun Giderme Rehberi</h3>
                  </div>
                  <p className="text-xs text-blue-900/80 font-medium">
                    Teknisyen için en basitten karmaşık donanım müdahalesine mantıksal sıralı arıza tespit adımları hazırlar.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Cihaz & İşletim Sistemi</label>
                  <input
                    type="text"
                    value={ai2Device}
                    onChange={(e) => setAi2Device(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Gözlenen Belirtiler / Hata Kodları [BELİRTİLERİ GİRİN]
                  </label>
                  <textarea
                    rows={6}
                    value={ai2Symptoms}
                    onChange={(e) => setAi2Symptoms(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Hata mesajları, LED durumları veya sesli uyarılar..."
                  />
                </div>

                <button
                  onClick={() =>
                    runItAi(
                      "troubleshooting_guide",
                      { deviceInfo: ai2Device, symptoms: ai2Symptoms },
                      setAi2Result
                    )
                  }
                  disabled={aiLoading || !ai2Symptoms.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ListOrdered className="w-4 h-4" />}
                  {aiLoading ? "Rehber Hazırlanıyor..." : "Troubleshooting Rehberini Oluştur (AI)"}
                </button>
              </div>

              {/* Result */}
              <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-blue-700" />
                      Teknisyen Sıralı Müdahale Rehberi
                    </h4>
                    {ai2Result && (
                      <button
                        onClick={() => copyToClipboard(ai2Result.stepsGuide, "ai2")}
                        className="text-xs text-blue-700 hover:text-blue-950 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copySuccess === "ai2" ? "Kopyalandı!" : "Kopyala"}
                      </button>
                    )}
                  </div>

                  {ai2Result ? (
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
                        <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {ai2Result.stepsGuide}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <Cpu className="w-10 h-10 mx-auto mb-2 text-blue-300 opacity-50" />
                      Hata kodlarını girerek teknisyen için sıralı test rehberi oluşturun.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI 3: Onarım Maliyet Onay Metni */}
          {aiAssistantTab === "quote_message" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-indigo-100 text-indigo-900">3. BT AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">Donanım/Yazılım Onarım Maliyet Onay Metni</h3>
                  </div>
                  <p className="text-xs text-indigo-900/80 font-medium">
                    Değişecek parça, işçilik tutarı ve veri yedekleme durumunu belirten, profesyonel WhatsApp/SMS onay mesajı hazırlar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Cihaz Bilgisi</label>
                    <input
                      type="text"
                      value={ai3Device}
                      onChange={(e) => setAi3Device(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Toplam Maliyet</label>
                    <input
                      type="text"
                      value={ai3Total}
                      onChange={(e) => setAi3Total(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Değişecek Parça ve İşçilik Kalemleri
                  </label>
                  <textarea
                    rows={4}
                    value={ai3PartsText}
                    onChange={(e) => setAi3PartsText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Veri Güvenliği Durumu</label>
                  <input
                    type="text"
                    value={ai3BackupNote}
                    onChange={(e) => setAi3BackupNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={() =>
                    runItAi(
                      "quote_approval_message",
                      {
                        deviceInfo: ai3Device,
                        partsLaborsText: ai3PartsText,
                        totalAmount: ai3Total,
                        backupNote: ai3BackupNote,
                        channel: ai3Channel,
                      },
                      setAi3Result
                    )
                  }
                  disabled={aiLoading || !ai3PartsText.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  {aiLoading ? "Mesaj Hazırlanıyor..." : "Onay Metni Oluştur (AI)"}
                </button>
              </div>

              {/* Result */}
              <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-700" />
                      Müşteri Onay Mesajı
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
                      <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs">
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
                      Parça ve maliyetleri girerek müşteriye özel onay mesajı oluşturun.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI 4: Müşteri Bilgilendirme E-postası */}
          {aiAssistantTab === "email" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-200/60 shadow-2xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-900">4. BT AI Aracı</span>
                    <h3 className="text-lg font-extrabold text-slate-950">Teknik Terimsiz Müşteri Bilgilendirme E-postası</h3>
                  </div>
                  <p className="text-xs text-emerald-900/80 font-medium">
                    Cihazın neden arızalandığını, yapılan onarımları sade bir dille anlatan ve 2 koruyucu tavsiye içeren profesyonel e-posta taslağı.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Cihaz Bilgisi</label>
                  <input
                    type="text"
                    value={ai4Device}
                    onChange={(e) => setAi4Device(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Yapılan Teknik İşlemler [ONARIM DETAYLARI]
                  </label>
                  <textarea
                    rows={6}
                    value={ai4Repairs}
                    onChange={(e) => setAi4Repairs(e.target.value)}
                    className="w-full p-3 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Fan temizliği, BGA çip değişimi, macun yenileme vb..."
                  />
                </div>

                <button
                  onClick={() =>
                    runItAi(
                      "customer_update_email",
                      { deviceInfo: ai4Device, repairsPerformed: ai4Repairs },
                      setAi4Result
                    )
                  }
                  disabled={aiLoading || !ai4Repairs.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {aiLoading ? "E-Posta Yazılıyor..." : "Müşteri Bilgilendirme E-postası Hazırla (AI)"}
                </button>
              </div>

              {/* Result */}
              <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 mb-4">
                    <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-700" />
                      E-Posta Taslağı
                    </h4>
                    {ai4Result && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Konu: ${ai4Result.subject}\n\n${ai4Result.body}`,
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
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-3">
                        <div className="pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
                          <span className="text-slate-500">Konu:</span> {ai4Result.subject}
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                          {ai4Result.body}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <Mail className="w-10 h-10 mx-auto mb-2 text-emerald-300 opacity-50" />
                      Yapılan işlemleri girerek müşteri için sade dille hazırlanmış e-posta taslağını oluşturun.
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
                  Cihaz Kabul Fişi
                </button>
                <button
                  onClick={() => setPrintDocType("work_order")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    printDocType === "work_order"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  Laboratuvar İş Emri
                </button>
                <button
                  onClick={() => setPrintDocType("quote")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    printDocType === "quote"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  Onarım & Garanti Tutanağı
                </button>
                <button
                  onClick={() => setPrintDocType("delivery")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    printDocType === "delivery"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  BT Cihaz Teslim Tutanağı
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                value={selectedRecord?.id || ""}
                onChange={(e) => {
                  const rec = itServices.find((s) => s.id === e.target.value);
                  if (rec) setSelectedRecord(rec);
                }}
                className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-bold text-purple-950 bg-white"
              >
                {itServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.brand} {s.model} ({s.serviceNo}) - {s.contactName}
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
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">BİLİŞİM & BT TEKNİK SERVİS LABORATUVARI</h2>
                  <p className="text-xs font-bold text-slate-600 mt-1">
                    Donanım Onarım, Çip Revizyonu ve Veri Kurtarma • Tel: 0850 400 00 00 • E-posta: bt@muavinteknik.com
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-black text-purple-900">{selectedRecord.serviceNo}</div>
                  <div className="text-xs font-bold text-slate-500">Tarih: {selectedRecord.entryDate}</div>
                </div>
              </div>

              {/* Title */}
              <div className="bg-slate-100 py-2 px-4 rounded-xl font-extrabold text-slate-900 text-center uppercase tracking-wider text-sm mb-6 border border-slate-200">
                {printDocType === "reception" && "CİHAZ KABUL VE TESLİM ALMA FORMU (BARKODLU)"}
                {printDocType === "work_order" && "LABORATUVAR İŞ EMRİ VE TEST PROTOKOLÜ"}
                {printDocType === "quote" && "DONANIM ONARIM, PARÇA VE GARANTİ TESLİM BELGESİ"}
                {printDocType === "delivery" && "BİLİŞİM CİHAZ VE DONANIM TESLİM TUTANAĞI"}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-extrabold text-purple-900 uppercase border-b pb-1">Cihaz & Donanım Bilgileri</h4>
                  <div className="text-xs grid grid-cols-2 gap-y-1.5 font-medium">
                    <span className="text-slate-500">Cihaz Türü:</span>
                    <span className="font-bold text-slate-900">{deviceTypeLabels[selectedRecord.deviceType] || selectedRecord.deviceType}</span>
                    <span className="text-slate-500">Marka & Model:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.brand} {selectedRecord.model}</span>
                    <span className="text-slate-500">Seri Numarası (S/N):</span>
                    <span className="font-mono font-bold text-purple-950">{selectedRecord.serialNumber || "Yok"}</span>
                    <span className="text-slate-500">Aksesuarlar:</span>
                    <span className="text-slate-800">{selectedRecord.accessoriesIncluded || "Yalnız Cihaz"}</span>
                    <span className="text-slate-500">Veri Yedekleme:</span>
                    <span className="font-bold text-emerald-800">{selectedRecord.dataBackupStatus === "backup_taken" ? "Yedek Alındı" : "Yedeksiz"}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-extrabold text-purple-900 uppercase border-b pb-1">Müşteri & Teknisyen Bilgileri</h4>
                  <div className="text-xs grid grid-cols-2 gap-y-1.5 font-medium">
                    <span className="text-slate-500">Müşteri / Kurum:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.contactName}</span>
                    <span className="text-slate-500">Telefon:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.contactPhone}</span>
                    <span className="text-slate-500">E-Posta:</span>
                    <span className="text-slate-800">{selectedRecord.contactEmail || "-"}</span>
                    <span className="text-slate-500">Sorumlu BT Uzmanı:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.assignedTechnician}</span>
                  </div>
                </div>
              </div>

              {/* Beraberinde Teslim Alınan Aksesuarlar & Fiziksel Durum / Deformasyon */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-black text-purple-950 uppercase block">
                    Beraberinde Teslim Alınan Aksesuar & Donanımlar:
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedRecord.accessoriesReceived || selectedRecord.accessoriesIncluded || "Harici aksesuar teslim alınmadı (Yalnız Cihaz)."}
                  </p>
                </div>
                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-black text-amber-950 uppercase block">
                    Cihaz Kasa/Ekran Fiziksel Durumu & Deformasyon:
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedRecord.damagePhysicalCondition ? (
                      <span className="text-amber-950 font-bold">{selectedRecord.damagePhysicalCondition}</span>
                    ) : (
                      <span className="text-emerald-800 font-bold">Kayıt anında tespit edilen çizik, kırık veya deformasyon bulunmamaktadır.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Problem description */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-6">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Müşteri Arıza Bildirimi:</span>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5">{selectedRecord.customerProblemDescription || "Genel bakım ve kontrol"}</p>
                </div>
                {selectedRecord.technicianReport && (
                  <div>
                    <span className="text-[11px] font-extrabold text-purple-900 uppercase">Laboratuvar Teşhisi & Yapılan İşlemler:</span>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">{selectedRecord.technicianReport}</p>
                  </div>
                )}
              </div>

              {/* Parts & Labors Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold">
                      <th className="py-2.5 px-3">Donanım Parçası / Yapılan İşlem</th>
                      <th className="py-2.5 px-3">Kategori</th>
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
                        <td className="py-2 px-3 text-slate-500">{p.category}</td>
                        <td className="py-2 px-3 text-right font-mono">{p.quantity} Adet</td>
                        <td className="py-2 px-3 text-right font-mono">₺{p.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">%{p.vatRate}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">₺{p.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {selectedRecord.labors.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 font-semibold text-purple-900">İşçilik: {l.operationName}</td>
                        <td className="py-2 px-3 text-slate-500">Laboratuvar İşçilik</td>
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
                    <span>Donanım Parça Toplamı:</span>
                    <span className="font-mono">₺{selectedRecord.partsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Laboratuvar İşçilik:</span>
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
                  <p className="font-bold text-slate-700">Cihaz Sahibi (Müşteri)</p>
                  <p className="text-slate-500 mt-1">{selectedRecord.contactName}</p>
                  <div className="mt-12 border-b border-slate-300 w-48 mx-auto" />
                  <span className="text-[10px] text-slate-400">İmza</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700">Teknik Servis Sorumlusu (BT Uzmanı)</p>
                  <p className="text-slate-500 mt-1">{selectedRecord.assignedTechnician}</p>
                  <div className="mt-12 border-b border-slate-300 w-48 mx-auto" />
                  <span className="text-[10px] text-slate-400">İmza & Kaşe</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-purple-200 text-center text-slate-400">
              Görüntülenecek bir BT servis kaydı bulunmamaktadır.
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT IT SERVICE RECORD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-purple-200/80 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    {modalMode === "create" ? "Yeni BT Cihaz Kabulü & Servis Kaydı" : `BT Servis Düzenle (${formData.serviceNo})`}
                  </h3>
                  <p className="text-xs font-semibold text-purple-950/80">
                    Cihaz seri no, şifre/PIN, donanım parçaları ve laboratuvar onarımları
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Row 1: Device Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Cihaz Türü</label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as ItDeviceType })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="laptop">Dizüstü Bilgisayar (Laptop)</option>
                    <option value="desktop">Masaüstü PC (Kasa)</option>
                    <option value="macbook">Apple MacBook</option>
                    <option value="imac">Apple iMac / Mac Mini</option>
                    <option value="server">Sunucu (Server)</option>
                    <option value="workstation">İş İstasyonu (Workstation)</option>
                    <option value="tablet">Tablet Bilgisayar</option>
                    <option value="network_device">Router / Switch / Firewall</option>
                    <option value="storage_nas">NAS / Harici Depolama</option>
                    <option value="other">Diğer Bilişim Cihazı</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Cihaz Marka & Model *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Lenovo"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="ThinkPad E14"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Seri No & PIN / Şifre</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="S/N: PF12345"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-xs focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={formData.devicePasswordPin}
                      onChange={(e) => setFormData({ ...formData, devicePasswordPin: e.target.value })}
                      placeholder="Şifre / PIN"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Customer Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Müşteri / Kurum Adı *</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Müşteri Adı veya Şirket Ünvanı"
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
                      <span>BT Servis Durum Yönetimi & İş Akışı Adımı</span>
                    </label>
                    <span className="text-[11px] text-purple-700 font-semibold">Tıklayarak durumu anında değiştirin</span>
                  </div>

                  {/* Görsel Hızlı Durum Butonları */}
                  <div className="flex flex-wrap gap-1.5">
                    {itStatusOptions.map((opt) => {
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

              {/* Row 3: Problems & Diagnostic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Müşteri Arıza Şikayeti</label>
                  <textarea
                    rows={3}
                    value={formData.customerProblemDescription}
                    onChange={(e) => setFormData({ ...formData, customerProblemDescription: e.target.value })}
                    placeholder="Cihazın kapanma, görüntü vermeme veya yavaşlık şikayeti..."
                    className="w-full p-2.5 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Teknisyen Ön Raporu & Yapılacaklar</label>
                  <textarea
                    rows={3}
                    value={formData.technicianReport}
                    onChange={(e) => setFormData({ ...formData, technicianReport: e.target.value })}
                    placeholder="Laboratuvar teşhisi ve uygulanacak onarım adımları..."
                    className="w-full p-2.5 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Row 3.5: Teslim Alınan Aksesuarlar & Fiziksel Deformasyon/Kusur Durumu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-purple-50/40 rounded-2xl border border-purple-200/70">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-purple-700" />
                    <span>Cihazla Beraberinde Teslim Alınan Aksesuarlar</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accessoriesReceived || ""}
                    onChange={(e) => setFormData({ ...formData, accessoriesReceived: e.target.value })}
                    placeholder="Örn: Orijinal Şarj Adaptörü, Güç Kablosu, Taşıma Çantası, Mouse, Dönüştürücü..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Teslim alma tutanağında listelenir ve müşteriye ibraz edilir.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kasa / Ekran Çizik, Kırık & Deformasyon Durumu</span>
                  </label>
                  <input
                    type="text"
                    value={formData.damagePhysicalCondition || ""}
                    onChange={(e) => setFormData({ ...formData, damagePhysicalCondition: e.target.value })}
                    placeholder="Örn: Üst kapakta kılcal çizikler, sağ menteşede gevşeme, ekranda leke..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Cihaz girişi anındaki fiziksel kusurlar teslim tutanağında kayıt altına alınır.
                  </span>
                </div>
              </div>

              {/* Row 4: Parts Management */}
              <div className="border border-purple-200/80 rounded-2xl p-4 bg-purple-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-purple-950 text-xs uppercase flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-700" />
                    Kullanılacak Donanım / Yedek Parçalar
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
                    placeholder="Parça Adı (Örn: 1TB NVMe M.2 SSD)"
                    className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-purple-200 bg-white"
                  />
                  <select
                    value={newPartCategory}
                    onChange={(e) => setNewPartCategory(e.target.value as any)}
                    className="px-2 py-1.5 rounded-xl border border-purple-200 bg-white font-semibold text-xs"
                  >
                    <option value="ssd_hdd">SSD / HDD</option>
                    <option value="ram">RAM Bellek</option>
                    <option value="motherboard">Anakart / Çip</option>
                    <option value="screen">Ekran Paneli</option>
                    <option value="battery">Batarya / Pil</option>
                    <option value="cooling_fan">Fan / Soğutma</option>
                    <option value="gpu">Ekran Kartı</option>
                    <option value="power_supply">Güç Kaynağı / Adaptör</option>
                    <option value="software_license">Yazılım Lisansı</option>
                    <option value="other">Diğer</option>
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
                          <th className="p-2">Donanım</th>
                          <th className="p-2">Kategori</th>
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
                            <td className="p-2 text-slate-500">{p.category}</td>
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
                    <Cpu className="w-4 h-4 text-purple-700" />
                    Laboratuvar İşçilik Kalemleri
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
                    placeholder="İşlem Adı (Örn: BGA Çip Onarımı ve Termal Bakım)"
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
                  id="itCustApproval"
                  checked={formData.isApprovedByCustomer || false}
                  onChange={(e) => setFormData({ ...formData, isApprovedByCustomer: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="itCustApproval" className="font-bold text-purple-950 cursor-pointer">
                  Müşteriden WhatsApp / SMS veya E-posta Yoluyla Onarım & Veri Onayı Alındı
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-purple-200/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {modalMode === "create" ? "BT Servis Kaydını Oluştur" : "Değişiklikleri Güncelle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BT SERVİS FATURALANDIRMA MODALI */}
      {isInvoicingModalOpen && invoicingRecord && (
        <ServiceInvoicingModal
          isOpen={isInvoicingModalOpen}
          onClose={() => {
            setIsInvoicingModalOpen(false);
            setInvoicingRecord(null);
          }}
          serviceType="it"
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
            handleOpenDeliveryModal(record as ItServiceRecord);
          }}
        />
      )}

      {/* WHATSAPP BİLGİLENDİRME MODALI */}
      {isWhatsAppModalOpen && whatsAppRecord && (
        <ServiceWhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setWhatsAppRecord(null);
          }}
          serviceType="it"
          serviceRecord={whatsAppRecord}
          defaultTemplateType={whatsAppTemplateType}
          companySettings={companySettings}
        />
      )}

      {/* ÜRÜN & BT CİHAZ TESLİM TUTANAĞI MODALI */}
      {isDeliveryModalOpen && deliveryRecord && (
        <ServiceDeliveryModal
          isOpen={isDeliveryModalOpen}
          onClose={() => {
            setIsDeliveryModalOpen(false);
            setDeliveryRecord(null);
          }}
          serviceType="it"
          serviceRecord={deliveryRecord}
          companySettings={companySettings}
          onOpenInvoicing={(rec) => {
            setIsDeliveryModalOpen(false);
            handleOpenInvoicing(rec as ItServiceRecord);
          }}
          onOpenWhatsApp={(rec) => {
            setIsDeliveryModalOpen(false);
            handleOpenWhatsApp(rec as ItServiceRecord, "completed");
          }}
          onMarkDelivered={handleMarkDelivered}
        />
      )}
    </div>
  );
};
