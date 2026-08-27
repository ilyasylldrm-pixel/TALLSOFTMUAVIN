import React, { useState, useMemo } from "react";
import {
  Wrench,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Calendar,
  DollarSign,
  Printer,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  User,
  ShieldCheck,
  Send,
  Copy,
  ExternalLink,
  Flame,
  Wind,
  Refrigerator,
  Coffee,
  Zap,
  MapPin,
  Truck,
  Check,
  Building,
  Shield,
  Gauge,
  ThermometerSnowflake,
  RotateCcw,
  CalendarDays,
  LayoutList,
  Receipt,
  FileCheck,
  MessageCircle,
  Package,
  AlertTriangle,
} from "lucide-react";
import {
  ApplianceServiceRecord,
  ApplianceCategory,
  ApplianceDeviceType,
  ApplianceServiceStatus,
  ApplianceServiceLocation,
  AppliancePartItem,
  ApplianceLaborItem,
  Contact,
  Invoice,
  CompanySettings,
} from "../../types";
import { ApplianceCalendarView } from "./ApplianceCalendarView";
import { ServiceInvoicingModal } from "../ServiceInvoicingModal";
import { ServiceWhatsAppModal } from "../ServiceWhatsAppModal";
import { ServiceDeliveryModal } from "../ServiceDeliveryModal";

interface ApplianceServiceModuleProps {
  applianceServices: ApplianceServiceRecord[];
  onUpdateApplianceServices: (services: ApplianceServiceRecord[]) => void;
  contacts?: Contact[];
  companySettings?: CompanySettings;
  onAddInvoice?: (invoice: Invoice) => void;
  onAddContact?: (contact: Contact) => void;
}

export const ApplianceServiceModule: React.FC<ApplianceServiceModuleProps> = ({
  applianceServices,
  onUpdateApplianceServices,
  contacts = [],
  companySettings,
  onAddInvoice,
  onAddContact,
}) => {
  // Main Tab (List vs Calendar)
  const [activeMainTab, setActiveMainTab] = useState<"records" | "calendar">("records");

  // Delivery Modal State
  const [deliveryRecord, setDeliveryRecord] = useState<ApplianceServiceRecord | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // WhatsApp State
  const [whatsAppRecord, setWhatsAppRecord] = useState<ApplianceServiceRecord | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTemplateType, setWhatsAppTemplateType] = useState<"completed" | "invoiced" | "diagnosis_approval" | "reception">("completed");

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ApplianceCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ApplianceServiceStatus | "all">("all");
  const [selectedLocation, setSelectedLocation] = useState<ApplianceServiceLocation | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handlePresetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  };

  const handlePresetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  };

  const handlePresetLast30Days = () => {
    const now = new Date();
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    setStartDate(past.toISOString().split("T")[0]);
    setEndDate(now.toISOString().split("T")[0]);
  };

  const handlePresetThisYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ApplianceServiceRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<ApplianceServiceRecord | null>(null);
  const [aiAssistantRecord, setAiAssistantRecord] = useState<ApplianceServiceRecord | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Invoicing & Status Dropdown States
  const [invoicingRecord, setInvoicingRecord] = useState<ApplianceServiceRecord | null>(null);
  const [isInvoicingModalOpen, setIsInvoicingModalOpen] = useState(false);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  // AI Assistant Specific State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCustomIssue, setAiCustomIssue] = useState("");
  const [aiCustomDevice, setAiCustomDevice] = useState("");
  const [aiActiveTab, setAiActiveTab] = useState<"checklist" | "approval" | "completion">("checklist");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState<Partial<ApplianceServiceRecord>>({
    category: "hvac_climate",
    deviceType: "boiler_combi",
    brand: "",
    model: "",
    serialNumber: "",
    serviceLocation: "on_site",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    serviceAddress: "",
    city: "İstanbul",
    district: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTimeSlot: "10:00 - 12:00",
    entryDate: new Date().toISOString().split("T")[0],
    status: "reception",
    customerProblemDescription: "",
    technicianReport: "",
    assignedTechnician: "",
    accessoriesReceived: "",
    damagePhysicalCondition: "",
    gasType: "none",
    pressureBar: undefined,
    voltageTested: 220,
    isWarrantyActive: false,
    parts: [],
    labors: [],
    partsTotal: 0,
    laborTotal: 0,
    totalVat: 0,
    grandTotal: 0,
    discountAmount: 0,
    isApprovedByCustomer: false,
    notes: "",
  });

  // Modal Part/Labor inputs
  const [newPartName, setNewPartName] = useState("");
  const [newPartCategory, setNewPartCategory] = useState<AppliancePartItem["category"]>("thermostat_sensor");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [newPartVat, setNewPartVat] = useState(20);
  const [newPartWarranty, setNewPartWarranty] = useState(12);

  const [newLaborName, setNewLaborName] = useState("");
  const [newLaborTech, setNewLaborTech] = useState("");
  const [newLaborHours, setNewLaborHours] = useState(1);
  const [newLaborRate, setNewLaborRate] = useState(500);
  const [newLaborVat, setNewLaborVat] = useState(20);

  // Category Labels & Icons
  const categoryConfig: Record<
    ApplianceCategory,
    { label: string; icon: React.ElementType; color: string; bg: string; border: string }
  > = {
    hvac_climate: {
      label: "İklimlendirme (Klima / Kombi)",
      icon: ThermometerSnowflake,
      color: "text-sky-700",
      bg: "bg-sky-50 text-sky-700",
      border: "border-sky-200",
    },
    major_appliance: {
      label: "Beyaz Eşya",
      icon: Refrigerator,
      color: "text-emerald-700",
      bg: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-200",
    },
    small_appliance: {
      label: "Küçük Ev Aletleri",
      icon: Coffee,
      color: "text-amber-700",
      bg: "bg-amber-50 text-amber-700",
      border: "border-amber-200",
    },
    other_appliance: {
      label: "Diğer Cihazlar",
      icon: Zap,
      color: "text-purple-700",
      bg: "bg-purple-50 text-purple-700",
      border: "border-purple-200",
    },
  };

  // Device Type dictionary
  const deviceTypeLabels: Record<ApplianceDeviceType, string> = {
    refrigerator: "Buzdolabı",
    freezer: "Derin Dondurucu",
    washing_machine: "Çamaşır Makinesi",
    dryer: "Kurutma Makinesi",
    dishwasher: "Bulaşık Makinesi",
    oven: "Fırın / Ankastre",
    cooktop_hob: "Ocak / Set Üstü",
    range_hood: "Davlumbaz / Aspiratör",
    air_conditioner_split: "Split Klima",
    air_conditioner_vrf: "VRF / Ticari Klima",
    boiler_combi: "Kombi (Doğalgaz)",
    water_heater: "Şofben / Termosifon",
    heat_pump: "Isı Pompası",
    coffee_machine: "Kahve / Espresso Makinesi",
    vacuum_cleaner: "Elektrikli / Dikey Süpürge",
    robot_vacuum: "Robot Süpürge",
    blender_food_processor: "Blender / Mutfak Robotu",
    toaster_grill: "Tost Makinesi / Izgara",
    microwave_oven: "Mikrodalga Fırın",
    steam_iron: "Buhar Kazanlı Ütü",
    airfryer_fryer: "Airfryer / Fritöz",
    kettle_tea_maker: "Çaycı / Su Isıtıcı",
    other: "Diğer Cihaz",
  };

  // Status mapping & options
  const applianceStatusOptions: { value: ApplianceServiceStatus; label: string; desc: string; bg: string; color: string; dot: string }[] = [
    { value: "reception", label: "Randevu / Kayıt", desc: "Müşteri servis talebi ve randevusu açıldı", bg: "bg-amber-100/90 border-amber-300", color: "text-amber-900", dot: "bg-amber-500" },
    { value: "assigned", label: "Teknisyene Atandı", desc: "Servis iş emri saha teknisyenine atandı", bg: "bg-blue-100/90 border-blue-300", color: "text-blue-900", dot: "bg-blue-500" },
    { value: "on_the_way", label: "Sahada / Yolda", desc: "Teknisyen müşteri adresine seyir halinde", bg: "bg-indigo-100/90 border-indigo-300", color: "text-indigo-900", dot: "bg-indigo-500" },
    { value: "diagnosing", label: "Arıza Teşhisinde", desc: "Cihaz inceleniyor, gaz/motor arızası tespiti yapılıyor", bg: "bg-cyan-100/90 border-cyan-300", color: "text-cyan-900", dot: "bg-cyan-500" },
    { value: "quote_pending", label: "Müşteri Onayı Bekliyor", desc: "Maliyet/parça fiyat teklifi müşteriye sunuldu", bg: "bg-purple-100/90 border-purple-300", color: "text-purple-900", dot: "bg-purple-500" },
    { value: "parts_ordered", label: "Yedek Parça Bekleniyor", desc: "Kompresör/kart/yedek parça tedariği bekleniyor", bg: "bg-orange-100/90 border-orange-300", color: "text-orange-900", dot: "bg-orange-500" },
    { value: "repairing", label: "Onarımda / Montajda", desc: "Mekanik bakım, kart tamiri ve gaz şarjı yapılıyor", bg: "bg-blue-200/90 border-blue-400", color: "text-blue-900", dot: "bg-blue-600" },
    { value: "testing_qc", label: "Test & Gaz Kontrolünde", desc: "Vakum, gaz kaçağı ve çalışma sıcaklık testleri", bg: "bg-emerald-100/90 border-emerald-300", color: "text-emerald-900", dot: "bg-emerald-500" },
    { value: "ready_delivered", label: "Tamamlandı / Faturalandı", desc: "Onarım tamamlandı, teslim edildi ve fatura kesildi", bg: "bg-emerald-200/90 border-emerald-400", color: "text-emerald-950", dot: "bg-emerald-700" },
    { value: "cancelled", label: "İptal / İade", desc: "Servis işlemi iptal edildi", bg: "bg-rose-100/90 border-rose-300", color: "text-rose-900", dot: "bg-rose-500" },
  ];

  // Status mapping
  const statusLabels: Record<ApplianceServiceStatus, { label: string; color: string; bg: string }> = {
    reception: { label: "Randevu / Kayıt", color: "text-amber-800", bg: "bg-amber-100/90 border-amber-300" },
    assigned: { label: "Teknisyene Atandı", color: "text-blue-800", bg: "bg-blue-100/90 border-blue-300" },
    on_the_way: { label: "Sahada / Yolda", color: "text-indigo-800", bg: "bg-indigo-100/90 border-indigo-300" },
    diagnosing: { label: "Arıza Teşhisinde", color: "text-cyan-800", bg: "bg-cyan-100/90 border-cyan-300" },
    quote_pending: { label: "Müşteri Onayı Bekliyor", color: "text-purple-800", bg: "bg-purple-100/90 border-purple-300" },
    parts_ordered: { label: "Yedek Parça Bekleniyor", color: "text-orange-800", bg: "bg-orange-100/90 border-orange-300" },
    repairing: { label: "Onarımda / Montajda", color: "text-blue-900", bg: "bg-blue-200/90 border-blue-400" },
    testing_qc: { label: "Test & Gaz Kontrolünde", color: "text-emerald-800", bg: "bg-emerald-100/90 border-emerald-300" },
    ready_delivered: { label: "Tamamlandı / Teslim Edildi", color: "text-emerald-900", bg: "bg-emerald-200/90 border-emerald-400" },
    cancelled: { label: "İptal / İade", color: "text-rose-800", bg: "bg-rose-100/90 border-rose-300" },
  };

  const handleQuickStatusChange = (recordId: string, newStatus: ApplianceServiceStatus) => {
    const updated = applianceServices.map((s) => {
      if (s.id === recordId) {
        return {
          ...s,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateApplianceServices(updated);
    setOpenStatusDropdownId(null);
  };

  const handleOpenInvoicing = (record: ApplianceServiceRecord) => {
    setInvoicingRecord(record);
    setIsInvoicingModalOpen(true);
  };

  const handleOpenWhatsApp = (
    record: ApplianceServiceRecord,
    preferredType?: "completed" | "invoiced" | "diagnosis_approval" | "reception"
  ) => {
    setWhatsAppRecord(record);
    if (preferredType) {
      setWhatsAppTemplateType(preferredType);
    } else if (record.invoiceNumber || record.invoiceId) {
      setWhatsAppTemplateType("invoiced");
    } else if (
      record.status === "ready_delivered" ||
      record.status === "testing_qc" ||
      record.status === "repairing"
    ) {
      setWhatsAppTemplateType("completed");
    } else if (record.status === "quote_pending") {
      setWhatsAppTemplateType("diagnosis_approval");
    } else {
      setWhatsAppTemplateType("completed");
    }
    setIsWhatsAppModalOpen(true);
  };

  const handleOpenDeliveryModal = (record: ApplianceServiceRecord) => {
    setDeliveryRecord(record);
    setIsDeliveryModalOpen(true);
  };

  const handleMarkDelivered = (serviceId: string) => {
    const updated = applianceServices.map((s) => {
      if (s.id === serviceId) {
        return {
          ...s,
          status: "ready_delivered" as ApplianceServiceStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateApplianceServices(updated);
  };

  const handleServiceInvoiced = (serviceId: string, invoiceId: string, invoiceNumber: string) => {
    const updated = applianceServices.map((s) => {
      if (s.id === serviceId) {
        const invoicedRec = {
          ...s,
          status: "ready_delivered" as ApplianceServiceStatus,
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
    onUpdateApplianceServices(updated);
  };

  // Filtered List
  const filteredServices = useMemo(() => {
    return applianceServices.filter((srv) => {
      const matchesSearch =
        srv.serviceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        srv.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        srv.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        srv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        srv.contactPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (srv.serialNumber && srv.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        srv.customerProblemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (srv.serviceAddress && srv.serviceAddress.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || srv.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || srv.status === selectedStatus;
      const matchesLocation = selectedLocation === "all" || srv.serviceLocation === selectedLocation;

      let matchesDate = true;
      if (startDate) {
        const d = srv.appointmentDate || srv.entryDate;
        if (d && d < startDate) matchesDate = false;
      }
      if (endDate && matchesDate) {
        const d = srv.appointmentDate || srv.entryDate;
        if (d && d > endDate) matchesDate = false;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesDate;
    });
  }, [applianceServices, searchTerm, selectedCategory, selectedStatus, selectedLocation, startDate, endDate]);

  // Statistics
  const stats = useMemo(() => {
    const total = applianceServices.length;
    const onTheWay = applianceServices.filter((s) => s.status === "on_the_way" || s.status === "assigned").length;
    const partsPending = applianceServices.filter((s) => s.status === "parts_ordered" || s.status === "quote_pending").length;
    const completed = applianceServices.filter((s) => s.status === "ready_delivered").length;
    const activeRepair = applianceServices.filter((s) => s.status === "repairing" || s.status === "diagnosing" || s.status === "testing_qc").length;
    const totalRevenue = applianceServices.reduce((acc, s) => acc + (s.grandTotal || 0), 0);

    return { total, onTheWay, partsPending, completed, activeRepair, totalRevenue };
  }, [applianceServices]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const newNo = `SRV-${new Date().getFullYear()}-${String(applianceServices.length + 101).padStart(4, "0")}`;
    setFormData({
      serviceNo: newNo,
      category: "hvac_climate",
      deviceType: "boiler_combi",
      brand: "",
      model: "",
      serialNumber: "",
      serviceLocation: "on_site",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      serviceAddress: "",
      city: "İstanbul",
      district: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTimeSlot: "10:00 - 12:00",
      entryDate: new Date().toISOString().split("T")[0],
      status: "reception",
      customerProblemDescription: "",
      technicianReport: "",
      assignedTechnician: "",
      accessoriesReceived: "Uzaktan Kumanda ve Güç Kablosu",
      damagePhysicalCondition: "",
      gasType: "none",
      pressureBar: undefined,
      voltageTested: 220,
      isWarrantyActive: false,
      parts: [],
      labors: [],
      partsTotal: 0,
      laborTotal: 0,
      totalVat: 0,
      grandTotal: 0,
      discountAmount: 0,
      isApprovedByCustomer: false,
      notes: "",
    });
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  // Open Create Modal with specific Date pre-filled (e.g. from calendar cell click)
  const handleOpenCreateModalWithDate = (dateStr: string) => {
    const newNo = `SRV-${new Date().getFullYear()}-${String(applianceServices.length + 101).padStart(4, "0")}`;
    setFormData({
      serviceNo: newNo,
      category: "hvac_climate",
      deviceType: "boiler_combi",
      brand: "",
      model: "",
      serialNumber: "",
      serviceLocation: "on_site",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      serviceAddress: "",
      city: "İstanbul",
      district: "",
      appointmentDate: dateStr,
      appointmentTimeSlot: "10:00 - 12:00",
      entryDate: new Date().toISOString().split("T")[0],
      status: "reception",
      customerProblemDescription: "",
      technicianReport: "",
      assignedTechnician: "",
      accessoriesReceived: "Uzaktan Kumanda ve Güç Kablosu",
      damagePhysicalCondition: "",
      gasType: "none",
      pressureBar: undefined,
      voltageTested: 220,
      isWarrantyActive: false,
      parts: [],
      labors: [],
      partsTotal: 0,
      laborTotal: 0,
      totalVat: 0,
      grandTotal: 0,
      discountAmount: 0,
      isApprovedByCustomer: false,
      notes: "",
    });
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (record: ApplianceServiceRecord) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setIsModalOpen(true);
  };

  // Open Print Modal
  const handleOpenPrintModal = (record: ApplianceServiceRecord) => {
    setPrintRecord(record);
  };

  // Recalculate Totals
  const recalculateTotals = (parts: AppliancePartItem[], labors: ApplianceLaborItem[], discount = 0) => {
    const partsSum = parts.reduce((sum, p) => sum + p.total, 0);
    const laborSum = labors.reduce((sum, l) => sum + l.total, 0);
    const subtotal = partsSum + laborSum;
    const partsVat = parts.reduce((sum, p) => sum + (p.total * p.vatRate) / 100, 0);
    const laborVat = labors.reduce((sum, l) => sum + (l.total * l.vatRate) / 100, 0);
    const totalVat = partsVat + laborVat;
    const grand = Math.max(0, subtotal + totalVat - (discount || 0));

    return { partsTotal: partsSum, laborTotal: laborSum, totalVat, grandTotal: grand };
  };

  // Add Part in Modal
  const handleAddPart = () => {
    if (!newPartName.trim() || newPartPrice <= 0) return;
    const total = newPartQty * newPartPrice;
    const newPart: AppliancePartItem = {
      id: "part_" + Date.now(),
      partName: newPartName.trim(),
      category: newPartCategory,
      quantity: newPartQty,
      unitPrice: newPartPrice,
      vatRate: newPartVat,
      total,
      warrantyMonths: newPartWarranty,
    };
    const updatedParts = [...(formData.parts || []), newPart];
    const calc = recalculateTotals(updatedParts, formData.labors || [], formData.discountAmount || 0);

    setFormData((prev) => ({
      ...prev,
      parts: updatedParts,
      ...calc,
    }));

    setNewPartName("");
    setNewPartPrice(0);
    setNewPartQty(1);
  };

  // Remove Part
  const handleRemovePart = (id: string) => {
    const updatedParts = (formData.parts || []).filter((p) => p.id !== id);
    const calc = recalculateTotals(updatedParts, formData.labors || [], formData.discountAmount || 0);
    setFormData((prev) => ({ ...prev, parts: updatedParts, ...calc }));
  };

  // Add Labor in Modal
  const handleAddLabor = () => {
    if (!newLaborName.trim() || newLaborRate <= 0) return;
    const total = newLaborHours * newLaborRate;
    const newLabor: ApplianceLaborItem = {
      id: "labor_" + Date.now(),
      operationName: newLaborName.trim(),
      technicianName: newLaborTech.trim() || formData.assignedTechnician,
      hours: newLaborHours,
      hourlyRate: newLaborRate,
      vatRate: newLaborVat,
      total,
    };
    const updatedLabors = [...(formData.labors || []), newLabor];
    const calc = recalculateTotals(formData.parts || [], updatedLabors, formData.discountAmount || 0);

    setFormData((prev) => ({
      ...prev,
      labors: updatedLabors,
      ...calc,
    }));

    setNewLaborName("");
    setNewLaborHours(1);
  };

  // Remove Labor
  const handleRemoveLabor = (id: string) => {
    const updatedLabors = (formData.labors || []).filter((l) => l.id !== id);
    const calc = recalculateTotals(formData.parts || [], updatedLabors, formData.discountAmount || 0);
    setFormData((prev) => ({ ...prev, labors: updatedLabors, ...calc }));
  };

  // Save Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand?.trim() || !formData.contactName?.trim() || !formData.customerProblemDescription?.trim()) {
      alert("Lütfen Marka/Model, Müşteri Adı ve Arıza Tanımını eksiksiz doldurunuz.");
      return;
    }

    const calc = recalculateTotals(formData.parts || [], formData.labors || [], formData.discountAmount || 0);

    if (editingRecord) {
      // Update
      const updatedList = applianceServices.map((item) =>
        item.id === editingRecord.id
          ? ({
              ...item,
              ...formData,
              ...calc,
              updatedAt: new Date().toISOString(),
            } as ApplianceServiceRecord)
          : item
      );
      onUpdateApplianceServices(updatedList);
    } else {
      // Create
      const newRec: ApplianceServiceRecord = {
        id: "app_srv_" + Date.now(),
        serviceNo: formData.serviceNo || `SRV-${Date.now().toString().slice(-6)}`,
        category: formData.category || "hvac_climate",
        deviceType: formData.deviceType || "boiler_combi",
        brand: formData.brand || "",
        model: formData.model || "",
        serialNumber: formData.serialNumber || "",
        serviceLocation: formData.serviceLocation || "on_site",
        contactName: formData.contactName || "",
        contactPhone: formData.contactPhone || "",
        contactEmail: formData.contactEmail || "",
        serviceAddress: formData.serviceAddress || "",
        city: formData.city || "İstanbul",
        district: formData.district || "",
        appointmentDate: formData.appointmentDate,
        appointmentTimeSlot: formData.appointmentTimeSlot,
        entryDate: formData.entryDate || new Date().toISOString().split("T")[0],
        status: formData.status || "reception",
        customerProblemDescription: formData.customerProblemDescription || "",
        technicianReport: formData.technicianReport || "",
        assignedTechnician: formData.assignedTechnician || "",
        gasType: formData.gasType || "none",
        pressureBar: formData.pressureBar,
        voltageTested: formData.voltageTested || 220,
        isWarrantyActive: !!formData.isWarrantyActive,
        parts: formData.parts || [],
        labors: formData.labors || [],
        ...calc,
        discountAmount: formData.discountAmount || 0,
        isApprovedByCustomer: !!formData.isApprovedByCustomer,
        notes: formData.notes || "",
        createdAt: new Date().toISOString().split("T")[0],
      };
      onUpdateApplianceServices([newRec, ...applianceServices]);
    }

    setIsModalOpen(false);
  };

  // Open AI Assistant modal
  const handleOpenAiAssistant = (record: ApplianceServiceRecord) => {
    setAiAssistantRecord(record);
    setAiCustomIssue(record.customerProblemDescription);
    setAiCustomDevice(`${deviceTypeLabels[record.deviceType] || record.deviceType} (${record.brand} ${record.model})`);
    setAiActiveTab("checklist");
  };

  // Run AI Request
  const handleRunAiPrompt = async (action: "field_checklist" | "quote_approval_message" | "completion_report") => {
    if (!aiAssistantRecord) return;
    setAiLoading(true);

    try {
      const partsAndLaborDesc = [
        ...(aiAssistantRecord.parts || []).map((p) => `${p.partName} (${p.quantity} adet)`),
        ...(aiAssistantRecord.labors || []).map((l) => `${l.operationName}`),
      ].join(", ");

      const response = await fetch("/api/gemini/appliance-service-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          deviceType: deviceTypeLabels[aiAssistantRecord.deviceType] || aiAssistantRecord.deviceType,
          brandModel: `${aiAssistantRecord.brand} ${aiAssistantRecord.model}`,
          issueDescription: aiCustomIssue || aiAssistantRecord.customerProblemDescription,
          operationsAndCost: partsAndLaborDesc || "Arıza onarımı ve periyodik bakım",
          totalCost: `${aiAssistantRecord.grandTotal?.toLocaleString("tr-TR")} ₺`,
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        const aiData = resData.data;
        const updatedAiOutputs = { ...(aiAssistantRecord.aiOutputs || {}) };

        if (action === "field_checklist") {
          updatedAiOutputs.fieldChecklist = {
            faultAnalysis: aiData.faultAnalysis || "",
            requiredPartsAndSupplies: aiData.requiredPartsAndSupplies || "",
            requiredToolsAndEquipment: aiData.requiredToolsAndEquipment || "",
            safetyAndHygieneRules: aiData.safetyAndHygieneRules || "",
            formattedText: aiData.formattedText || "",
            generatedAt: new Date().toISOString(),
          };
        } else if (action === "quote_approval_message") {
          updatedAiOutputs.costApprovalMessage = {
            messageText: aiData.messageText || "",
            generatedAt: new Date().toISOString(),
          };
        } else if (action === "completion_report") {
          updatedAiOutputs.completionReport = {
            subject: aiData.subject || "Servis Raporu",
            summary: aiData.summary || "",
            maintenanceTips: aiData.maintenanceTips || [],
            generatedAt: new Date().toISOString(),
          };
        }

        const updatedRecord = { ...aiAssistantRecord, aiOutputs: updatedAiOutputs };
        setAiAssistantRecord(updatedRecord);

        // Update in global list
        const updatedList = applianceServices.map((s) => (s.id === aiAssistantRecord.id ? updatedRecord : s));
        onUpdateApplianceServices(updatedList);
      }
    } catch (err) {
      console.error("AI Hatası:", err);
      alert("AI servisiyle iletişim kurulurken bir sorun oluştu.");
    } finally {
      setAiLoading(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 🟣 FINANS YÖNETİMİ UYUMLU LİLA & BAL PETEĞİ BAŞLIK BANNERI */}
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
                <ThermometerSnowflake className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  Ev Aletleri ve Klima Teknik Servis Yönetimi
                </h2>
                <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
                  Beyaz Eşya, İklimlendirme (Klima/Kombi), Küçük Ev Aletleri Saha ve Atölye İş Emirleri, Gaz & Basınç Testleri, Takvim ve AI Destekli Operasyon.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Görünüm Değiştirme Sekmeleri */}
            <div className="inline-flex p-1 rounded-xl bg-purple-100/70 border border-purple-200/80 backdrop-blur-md">
              <button
                onClick={() => setActiveMainTab("records")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMainTab === "records"
                    ? "bg-white text-purple-950 shadow-xs border border-purple-200/60"
                    : "text-purple-900/80 hover:text-purple-950"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>İş Emirleri ({applianceServices.length})</span>
              </button>
              <button
                onClick={() => setActiveMainTab("calendar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMainTab === "calendar"
                    ? "bg-white text-purple-950 shadow-xs border border-purple-200/60"
                    : "text-purple-900/80 hover:text-purple-950"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Takvim & Randevu Planı</span>
              </button>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 text-purple-100 font-bold" />
              <span>Yeni Servis Kaydı Aç</span>
            </button>
          </div>
        </div>

        {/* 📊 FINANS UYUMLU 5'Lİ KPI İSTATİSTİK KARTLARI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 relative z-10">
          {/* Toplam İş Emri (Amber / Nakit Kasa Stili) */}
          <button
            type="button"
            onClick={() => { setSelectedCategory("all"); setSelectedStatus("all"); }}
            className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              selectedStatus === "all" && selectedCategory === "all"
                ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-100/80 border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                : "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/70 border-amber-300/70 hover:border-amber-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <span>Toplam İş Emri</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Wrench className="w-5 h-5 text-amber-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                {stats.total}
              </div>
              <p className="text-xs font-semibold text-amber-900/80 mt-1 flex items-center gap-1">
                <span className="text-amber-950 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300/80">
                  {stats.total} Kayıt
                </span>{" "}
                toplam servis
              </p>
            </div>
          </button>

          {/* Sahada & Yolda (Blue / Banka Stili) */}
          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === "on_the_way" ? "all" : "on_the_way")}
            className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              selectedStatus === "on_the_way"
                ? "bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-100/80 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                : "bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 border-blue-300/70 hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                <span>Sahada & Yolda</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Truck className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                {stats.onTheWay}
              </div>
              <p className="text-xs font-semibold text-blue-900/80 mt-1 flex items-center gap-1">
                <span className="text-blue-950 font-bold bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300/80">
                  {stats.onTheWay} Randevu
                </span>{" "}
                saha ekibi
              </p>
            </div>
          </button>

          {/* Onarımda & Teşhiste (Indigo / Çek Stili) */}
          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === "repairing" ? "all" : "repairing")}
            className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              selectedStatus === "repairing"
                ? "bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-indigo-100/80 border-2 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md"
                : "bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-indigo-50/70 border-indigo-300/70 hover:border-indigo-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                <span>Onarım & Teşhis</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Zap className="w-5 h-5 text-indigo-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-indigo-950 font-mono tracking-tight">
                {stats.activeRepair}
              </div>
              <p className="text-xs font-semibold text-indigo-900/80 mt-1 flex items-center gap-1">
                <span className="text-indigo-950 font-bold bg-indigo-200/80 px-1.5 py-0.5 rounded border border-indigo-300/80">
                  {stats.activeRepair} Cihaz
                </span>{" "}
                atölye/onarım
              </p>
            </div>
          </button>

          {/* Parça / Onay Bekleyen (Fuchsia / Senet Stili) */}
          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === "quote_pending" ? "all" : "quote_pending")}
            className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              selectedStatus === "quote_pending"
                ? "bg-gradient-to-br from-fuchsia-500/20 via-pink-500/10 to-fuchsia-100/80 border-2 border-fuchsia-500 ring-2 ring-fuchsia-500/30 shadow-md"
                : "bg-gradient-to-br from-fuchsia-500/10 via-pink-500/5 to-fuchsia-50/70 border-fuchsia-300/70 hover:border-fuchsia-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-fuchsia-950 tracking-wider flex items-center gap-1.5">
                <span>Parça / Onay</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Clock className="w-5 h-5 text-fuchsia-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-fuchsia-950 font-mono tracking-tight">
                {stats.partsPending}
              </div>
              <p className="text-xs font-semibold text-fuchsia-900/80 mt-1 flex items-center gap-1">
                <span className="text-fuchsia-950 font-bold bg-fuchsia-200/80 px-1.5 py-0.5 rounded border border-fuchsia-300/80">
                  {stats.partsPending} İşlem
                </span>{" "}
                onay bekleyen
              </p>
            </div>
          </button>

          {/* Servis Cirosu / Hacim (Emerald / Virman Stili) */}
          <button
            type="button"
            onClick={() => setSelectedStatus(selectedStatus === "ready_delivered" ? "all" : "ready_delivered")}
            className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              selectedStatus === "ready_delivered"
                ? "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-100/80 border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                : "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-50/70 border-emerald-300/70 hover:border-emerald-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                <span>Servis Hacmi</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <DollarSign className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
                ₺{stats.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-semibold text-emerald-900/80 mt-1 flex items-center gap-1">
                <span className="text-emerald-950 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded border border-emerald-300/80">
                  {stats.completed} Tamamlandı
                </span>{" "}
                kdv dahil
              </p>
            </div>
          </button>
        </div>
      </div>

      {activeMainTab === "calendar" ? (
        <ApplianceCalendarView
          applianceServices={applianceServices}
          onUpdateApplianceServices={onUpdateApplianceServices}
          onEditRecord={handleOpenEditModal}
          onPrintRecord={handleOpenPrintModal}
          onOpenAiAssistant={handleOpenAiAssistant}
          onOpenCreateModalWithDate={handleOpenCreateModalWithDate}
        />
      ) : (
        <>
          {/* 📅 TARİH ARALIĞI FİLTRESİ (FINANS MODÜLÜ BİREBİR TASARIMI) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-purple-200/60 shadow-2xs">
            {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
            <div
              className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "20px 35px",
              }}
            />

            {/* Dekoratif Vektör Şekli */}
            <svg
              className="absolute -right-4 -bottom-6 w-32 h-32 pointer-events-none text-purple-400/10"
              viewBox="0 0 200 200"
              fill="none"
            >
              <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="1" />
            </svg>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-purple-100/60 border border-purple-200/60 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-2xs">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-tight">
                    Tarih Aralığı Filtresi (Servis Kayıtları)
                  </span>
                  {(startDate || endDate) && (
                    <span className="text-[10px] font-extrabold bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                      Filtreli
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-purple-950/80">
                  Randevu ve servis kayıtlarını belirli tarih aralığına göre listele
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
              <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-xl border border-purple-200/60 shadow-2xs backdrop-blur-2xs">
                <div className="flex items-center gap-1.5 px-2">
                  <span className="text-[11px] font-bold text-slate-500">Başlangıç:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  />
                </div>
                <span className="text-slate-300 font-bold">|</span>
                <div className="flex items-center gap-1.5 px-2">
                  <span className="text-[11px] font-bold text-slate-500">Bitiş:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Hazır Aralık Butonları */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handlePresetThisMonth}
                  type="button"
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
                >
                  Bu Ay
                </button>
                <button
                  onClick={handlePresetLastMonth}
                  type="button"
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
                >
                  Geçen Ay
                </button>
                <button
                  onClick={handlePresetLast30Days}
                  type="button"
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
                >
                  Son 30 Gün
                </button>
                <button
                  onClick={handlePresetThisYear}
                  type="button"
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
                >
                  Bu Yıl
                </button>
                {(startDate || endDate) && (
                  <button
                    onClick={handleClearDates}
                    type="button"
                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Temizle</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 🔍 ARAMA & KATEGORİ SEÇİM BARLARI */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-purple-200/60 shadow-2xs space-y-3">
            {/* Kategori Seçim Butonları */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-purple-50/70 text-purple-900 hover:bg-purple-100/70 border border-purple-200/50"
                }`}
              >
                Tüm Cihazlar ({applianceServices.length})
              </button>
              <button
                onClick={() => setSelectedCategory("hvac_climate")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === "hvac_climate"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                }`}
              >
                <ThermometerSnowflake className="w-3.5 h-3.5" />
                <span>İklimlendirme (Klima / Kombi)</span>
              </button>
              <button
                onClick={() => setSelectedCategory("major_appliance")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === "major_appliance"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <Refrigerator className="w-3.5 h-3.5" />
                <span>Beyaz Eşya</span>
              </button>
              <button
                onClick={() => setSelectedCategory("small_appliance")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === "small_appliance"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Küçük Ev Aletleri (Kahve / Robot / Süpürge)</span>
              </button>
            </div>

            {/* Filtreleme ve Arama */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-purple-100/60">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cihaz, arıza, müşteri adı, telefon, servis no veya adres ara..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-purple-200/70 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-purple-200/70 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Tüm Durumlar ({applianceServices.length})</option>
                  <option value="reception">Randevu / Kayıt Alındı</option>
                  <option value="assigned">Teknisyene Atandı</option>
                  <option value="on_the_way">Sahada / Yolda</option>
                  <option value="diagnosing">Arıza Teşhisinde</option>
                  <option value="quote_pending">Müşteri Onayı Bekliyor</option>
                  <option value="parts_ordered">Yedek Parça Bekleniyor</option>
                  <option value="repairing">Onarımda / Montajda</option>
                  <option value="testing_qc">Test & Gaz Kontrolünde</option>
                  <option value="ready_delivered">Tamamlandı / Teslim Edildi</option>
                  <option value="cancelled">İptal / İade</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-purple-200/70 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Tüm Hizmet Yerleri</option>
                  <option value="on_site">🏠 Sahada / Müşteri Adresinde</option>
                  <option value="workshop">🏢 Atölyede / Servis Merkezinde</option>
                </select>
              </div>
            </div>
          </div>

      {/* 📋 İŞ EMİRLERİ LİSTESİ */}
      <div className="space-y-4">
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-50 text-[#8252F6] flex items-center justify-center mx-auto">
              <Wrench className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-800">Kayıtlı Servis İş Emri Bulunamadı</h3>
              <p className="text-xs text-slate-500">
                Arama kriterlerinize uygun kayıt yok veya henüz servis kaydı eklenmedi. Yeni bir servis kaydı açarak başlayabilirsiniz.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8252F6] text-white font-bold text-xs shadow hover:bg-[#703EE5] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Servis Kaydı Aç</span>
            </button>
          </div>
        ) : (
          filteredServices.map((record) => {
            const isExpanded = expandedRecordId === record.id;
            const categoryMeta = categoryConfig[record.category] || categoryConfig.other_appliance;
            const CategoryIcon = categoryMeta.icon;
            const statusMeta = statusLabels[record.status] || statusLabels.reception;

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Ana Kart Başlık Satırı */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Sol Cihaz ve Müşteri Bilgisi */}
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-2xl ${categoryMeta.bg} border ${categoryMeta.border} shrink-0 mt-0.5`}>
                      <CategoryIcon className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {record.serviceNo}
                        </span>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenStatusDropdownId(openStatusDropdownId === record.id ? null : record.id);
                            }}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer hover:shadow-xs ${statusMeta.bg} ${statusMeta.color}`}
                            title="Durumu Değiştirmek İçin Tıklayın"
                          >
                            <span className={`w-2 h-2 rounded-full ${applianceStatusOptions.find(o => o.value === record.status)?.dot || 'bg-slate-400'}`} />
                            <span>{statusMeta.label}</span>
                            <ChevronDown className="w-3 h-3 opacity-70" />
                          </button>

                          {/* Açılır Durum Menüsü Popover */}
                          {openStatusDropdownId === record.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenStatusDropdownId(null)}
                              />
                              <div className="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-purple-200/80 py-2 z-50 animate-fadeIn text-left">
                                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                  <span>Servis Durumu Değiştir</span>
                                  <span className="text-purple-700 font-mono font-bold text-[10px]">{record.serviceNo}</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto py-1">
                                  {applianceStatusOptions.map((opt) => {
                                    const isSelected = record.status === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickStatusChange(record.id, opt.value);
                                        }}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenStatusDropdownId(null);
                                      handleOpenDeliveryModal(record);
                                    }}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-purple-50 hover:text-purple-950 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-purple-700" />
                                    <span>Ürün Teslim Tutanağı</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                          {record.serviceLocation === "on_site" ? (
                            <>
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>Sahada / Adreste</span>
                            </>
                          ) : (
                            <>
                              <Building className="w-3 h-3 text-indigo-500" />
                              <span>Atölyede</span>
                            </>
                          )}
                        </span>
                        {record.isWarrantyActive && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            🛡️ Garanti Kapsamında
                          </span>
                        )}
                        {record.gasType && record.gasType !== "none" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 border border-cyan-300">
                            ❄️ Gaz: {record.gasType}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{record.brand} {record.model}</span>
                        <span className="text-xs font-normal text-slate-400">
                          ({deviceTypeLabels[record.deviceType] || record.deviceType})
                        </span>
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {record.contactName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {record.contactPhone}
                        </span>
                        {record.serviceAddress && (
                          <span className="text-slate-500 flex items-center gap-1 truncate max-w-xs" title={record.serviceAddress}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {record.serviceAddress}
                          </span>
                        )}
                      </div>

                      {/* Arıza Bildirimi Özeti */}
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200 mt-2 font-medium">
                        <strong className="text-slate-900">Arıza / Şikayet:</strong> {record.customerProblemDescription}
                      </p>
                    </div>
                  </div>

                  {/* Sağ Tutar & Aksiyon Butonları */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <div className="text-xs text-slate-500 font-medium">Toplam Tutar (KDV Dahil)</div>
                      <div className="text-xl font-black text-slate-900">
                        {record.grandTotal.toLocaleString("tr-TR")} ₺
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Parça: {record.partsTotal.toLocaleString("tr-TR")} ₺ | İşçilik: {record.laborTotal.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* WhatsApp Bilgilendirme Butonu */}
                      <button
                        onClick={() => handleOpenWhatsApp(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-300 transition-all cursor-pointer"
                        title="Cari Hesaba WhatsApp Bilgilendirme Mesajı Gönder"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Ürün Teslim Tutanağı Butonu */}
                      <button
                        onClick={() => handleOpenDeliveryModal(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold text-xs border border-purple-200 transition-all cursor-pointer"
                        title="Ürün / Cihaz Teslim Tutanağını Görüntüle ve Yazdır"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-700" />
                        <span>Teslim Tutanağı</span>
                      </button>

                      {/* AI Saha Kontrol Listesi Butonu */}
                      <button
                        onClick={() => handleOpenAiAssistant(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-[#8252F6] hover:bg-purple-100 font-bold text-xs border border-purple-200 transition-all cursor-pointer"
                        title="AI Saha & Operasyon Rehberi"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#8252F6]" />
                        <span>AI Rehber</span>
                      </button>

                      {/* Yazdır Fiş */}
                      <button
                        onClick={() => setPrintRecord(record)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                        title="Servis & Teslim Fişi Yazdır"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Düzenle */}
                      <button
                        onClick={() => handleOpenEditModal(record)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        Düzenle
                      </button>

                      {/* Genişlet / Detay */}
                      <button
                        onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                        className="p-2 rounded-xl bg-purple-50 text-[#8252F6] hover:bg-purple-100 transition-all cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Genişletilmiş Detay Alanı */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-4 sm:p-6 border-t border-slate-200 space-y-6">
                    {/* Hızlı Durum İlerleme Barı */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Hızlı Durum Güncelle</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          Teknisyen / Saha Adımı Seçin
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            "reception",
                            "assigned",
                            "on_the_way",
                            "diagnosing",
                            "quote_pending",
                            "parts_ordered",
                            "repairing",
                            "testing_qc",
                            "ready_delivered",
                          ] as ApplianceServiceStatus[]
                        ).map((st) => {
                          const stMeta = statusLabels[st];
                          const isCurrent = record.status === st;
                          return (
                            <button
                              key={st}
                              onClick={() => handleQuickStatusChange(record.id, st)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isCurrent
                                  ? `${stMeta.bg} ${stMeta.color} shadow-xs ring-1 ring-purple-400`
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {stMeta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* İki Kolonlu Detay Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sol: Değişen Parçalar ve İşçilik */}
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Wrench className="w-4 h-4 text-purple-600" />
                            <span>Kullanılan Yedek Parçalar ({record.parts?.length || 0})</span>
                          </h4>
                          {record.parts && record.parts.length > 0 ? (
                            <div className="divide-y divide-slate-100 text-xs">
                              {record.parts.map((part) => (
                                <div key={part.id} className="py-2 flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-800">{part.partName}</p>
                                    <p className="text-[11px] text-slate-400">
                                      {part.quantity} Adet × {part.unitPrice.toLocaleString("tr-TR")} ₺ | KDV: %{part.vatRate} | Garanti: {part.warrantyMonths || 12} Ay
                                    </p>
                                  </div>
                                  <span className="font-bold text-slate-900">
                                    {part.total.toLocaleString("tr-TR")} ₺
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Henüz parça eklenmemiş.</p>
                          )}
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-4 h-4 text-blue-600" />
                            <span>Teknik Servis İşçilikleri ({record.labors?.length || 0})</span>
                          </h4>
                          {record.labors && record.labors.length > 0 ? (
                            <div className="divide-y divide-slate-100 text-xs">
                              {record.labors.map((labor) => (
                                <div key={labor.id} className="py-2 flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-800">{labor.operationName}</p>
                                    <p className="text-[11px] text-slate-400">
                                      {labor.hours} Saat × {labor.hourlyRate.toLocaleString("tr-TR")} ₺ {labor.technicianName && `(${labor.technicianName})`}
                                    </p>
                                  </div>
                                  <span className="font-bold text-slate-900">
                                    {labor.total.toLocaleString("tr-TR")} ₺
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Henüz işçilik kalemi eklenmemiş.</p>
                          )}
                        </div>
                      </div>

                      {/* Sağ: AI Saha Çıktısı veya Teknisyen Raporu */}
                      <div className="space-y-4">
                        {record.aiOutputs?.fieldChecklist ? (
                          <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[#8252F6]" />
                                <span>AI Saha & Servis Operasyon Kontrol Listesi</span>
                              </h4>
                              <button
                                onClick={() => handleCopyToClipboard(record.aiOutputs?.fieldChecklist?.formattedText || "")}
                                className="text-[11px] font-bold text-[#8252F6] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Kopyala</span>
                              </button>
                            </div>

                            <div className="space-y-2 text-xs text-purple-950">
                              <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100">
                                <strong className="text-purple-900 block mb-0.5">1. Arıza Analizi ve Olası Nedenler:</strong>
                                <p className="text-slate-700">{record.aiOutputs.fieldChecklist.faultAnalysis}</p>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100">
                                <strong className="text-purple-900 block mb-0.5">2. Yanında Bulundurulması Gereken Parçalar & Sarf:</strong>
                                <p className="text-slate-700">{record.aiOutputs.fieldChecklist.requiredPartsAndSupplies}</p>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100">
                                <strong className="text-purple-900 block mb-0.5">3. Gerekli El Aletleri ve Test Ekipmanları:</strong>
                                <p className="text-slate-700">{record.aiOutputs.fieldChecklist.requiredToolsAndEquipment}</p>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100">
                                <strong className="text-rose-900 block mb-0.5">4. Güvenlik ve Hijyen Kuralları:</strong>
                                <p className="text-slate-700">{record.aiOutputs.fieldChecklist.safetyAndHygieneRules}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-2">
                            <Sparkles className="w-6 h-6 text-purple-500 mx-auto" />
                            <p className="text-xs font-bold text-slate-700">AI Saha Operasyon Listesi Hazırlanmadı</p>
                            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                              Gemini AI asistanı ile bu arıza için tek tıkla arıza analizi, yedek parça ve test ekipmanı listesi oluşturabilirsiniz.
                            </p>
                            <button
                              onClick={() => handleOpenAiAssistant(record)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8252F6] text-white font-bold text-xs shadow hover:bg-[#703EE5] transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Kontrol Listesi Üret</span>
                            </button>
                          </div>
                        )}

                        {/* Teknisyen Arıza Analiz Raporu */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span>Teknisyen Müdahale & Teşhis Raporu</span>
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {record.technicianReport || "Henüz teknisyen raporu girilmedi."}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Görevli Teknisyen: <strong className="text-slate-800">{record.assignedTechnician || "Atanmadı"}</strong></span>
                            {record.voltageTested && <span>Ölçülen Voltaj: <strong>{record.voltageTested}V</strong></span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
        </>
      )}

      {/* 🔮 AI SAHA & OPERASYON ASİSTANI MODALI */}
      {aiAssistantRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#6938EF] to-[#8252F6] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-cyan-200 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    Ev Aletleri ve Klima AI Operasyon Asistanı
                  </h3>
                  <p className="text-xs text-purple-100">
                    {aiAssistantRecord.serviceNo} - {aiAssistantRecord.brand} {aiAssistantRecord.model}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiAssistantRecord(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sekmeleri */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
              <button
                onClick={() => setAiActiveTab("checklist")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  aiActiveTab === "checklist"
                    ? "border-[#8252F6] text-[#8252F6]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                📋 Saha & Servis Kontrol Listesi
              </button>
              <button
                onClick={() => setAiActiveTab("approval")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  aiActiveTab === "approval"
                    ? "border-[#8252F6] text-[#8252F6]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                💬 Müşteri Fiyat Onay Mesajı
              </button>
              <button
                onClick={() => setAiActiveTab("completion")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  aiActiveTab === "completion"
                    ? "border-[#8252F6] text-[#8252F6]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                📄 Teslimat & Bakım Raporu
              </button>
            </div>

            {/* Modal Gövdesi */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Giriş Parametreleri */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">Analiz Parametreleri:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Cihaz:</span>
                    <input
                      type="text"
                      value={aiCustomDevice}
                      onChange={(e) => setAiCustomDevice(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">Müşterinin Bildirdiği Sorun / Arıza:</span>
                    <input
                      type="text"
                      value={aiCustomIssue}
                      onChange={(e) => setAiCustomIssue(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Sekme 1: Saha ve Servis Kontrol Listesi */}
              {aiActiveTab === "checklist" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Özel AI teknik servis uzmanı; arıza analizi, yanına alınacak parçalar, el aletleri ve hijyen kurallarını üretir.
                    </p>
                    <button
                      onClick={() => handleRunAiPrompt("field_checklist")}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6938EF] to-[#8252F6] text-white font-bold text-xs shadow hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiLoading ? "Analiz Ediliyor..." : "Kontrol Listesi Üret"}</span>
                    </button>
                  </div>

                  {aiAssistantRecord.aiOutputs?.fieldChecklist && (
                    <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-900 uppercase">
                          Saha ve Servis Kontrol Raporu
                        </span>
                        <button
                          onClick={() => handleCopyToClipboard(aiAssistantRecord.aiOutputs?.fieldChecklist?.formattedText || "")}
                          className="text-xs font-bold text-[#8252F6] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedNotification ? "Kopyalandı!" : "Metni Kopyala"}</span>
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                          <h5 className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                            <span>🔍 Arıza Analizi ve Olası Nedenler</span>
                          </h5>
                          <p className="text-slate-700 leading-relaxed">
                            {aiAssistantRecord.aiOutputs.fieldChecklist.faultAnalysis}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                          <h5 className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                            <span>📦 Yanında Bulundurulması Gereken Yedek Parça ve Sarf Malzemeleri</span>
                          </h5>
                          <p className="text-slate-700 leading-relaxed">
                            {aiAssistantRecord.aiOutputs.fieldChecklist.requiredPartsAndSupplies}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                          <h5 className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                            <span>🛠️ Gerekli El Aletleri ve Test Ekipmanları</span>
                          </h5>
                          <p className="text-slate-700 leading-relaxed">
                            {aiAssistantRecord.aiOutputs.fieldChecklist.requiredToolsAndEquipment}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs">
                          <h5 className="font-bold text-rose-900 mb-1 flex items-center gap-1">
                            <span>⚠️ Güvenlik ve Hijyen Kuralları</span>
                          </h5>
                          <p className="text-slate-700 leading-relaxed">
                            {aiAssistantRecord.aiOutputs.fieldChecklist.safetyAndHygieneRules}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sekme 2: Fiyat Onay Mesajı */}
              {aiActiveTab === "approval" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Müşteriye WhatsApp / SMS ile iletilecek nazik ve garantili teklif onay metni.
                    </p>
                    <button
                      onClick={() => handleRunAiPrompt("quote_approval_message")}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiLoading ? "Hazırlanıyor..." : "Mesajı Oluştur"}</span>
                    </button>
                  </div>

                  {aiAssistantRecord.aiOutputs?.costApprovalMessage && (
                    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-900 uppercase">
                          WhatsApp / SMS Teklif Mesajı
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyToClipboard(aiAssistantRecord.aiOutputs?.costApprovalMessage?.messageText || "")}
                            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedNotification ? "Kopyalandı!" : "Kopyala"}</span>
                          </button>
                          <a
                            href={`https://wa.me/${aiAssistantRecord.contactPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              aiAssistantRecord.aiOutputs.costApprovalMessage.messageText
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-emerald-700"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp'a Gönder</span>
                          </a>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {aiAssistantRecord.aiOutputs.costApprovalMessage.messageText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sekme 3: Tamamlama ve Bakım Raporu */}
              {aiActiveTab === "completion" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Onarımı biten cihazın teslimat notu ve müşteri için 3 kritik kullanım tavsiyesi.
                    </p>
                    <button
                      onClick={() => handleRunAiPrompt("completion_report")}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiLoading ? "Hazırlanıyor..." : "Raporu Oluştur"}</span>
                    </button>
                  </div>

                  {aiAssistantRecord.aiOutputs?.completionReport && (
                    <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-900 uppercase">
                          {aiAssistantRecord.aiOutputs.completionReport.subject}
                        </span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-blue-100 text-xs text-slate-800 space-y-2">
                        <p>{aiAssistantRecord.aiOutputs.completionReport.summary}</p>
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <strong className="text-blue-900 block font-bold">Kullanım ve Bakım Tavsiyeleri:</strong>
                          {aiAssistantRecord.aiOutputs.completionReport.maintenanceTips?.map((tip, idx) => (
                            <p key={idx} className="text-slate-600 pl-2 border-l-2 border-blue-400">
                              • {tip}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Gemini 3.7 Flash modeliyle anında üretilir ve iş emrine kaydedilir.
              </span>
              <button
                onClick={() => setAiAssistantRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ A4 / TERMAL YAZICI UYUMLU SERVİS & TESLİM FİŞİ MODALI */}
      {printRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-sm">Teknik Servis & Teslim Tutanağı Yazdır</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#8252F6] hover:bg-[#703EE5] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
                <button
                  onClick={() => setPrintRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Yazdırma Belge Alanı */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white font-sans text-xs" id="printable-service-slip">
              {/* Başlık ve Firma */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">MUAVİN TEKNİK SERVİS</h2>
                  <p className="text-[11px] text-slate-600">Beyaz Eşya, İklimlendirme ve Küçük Ev Aletleri Servisi</p>
                  <p className="text-[10px] text-slate-500 mt-1">Tel: +90 (212) 444 0 999 | E-posta: servis@muavin.com.tr</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-purple-900 bg-purple-100 px-3 py-1 rounded-md inline-block">
                    {printRecord.serviceNo}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Tarih: {printRecord.entryDate}</p>
                  <p className="text-[10px] text-slate-500">Konum: {printRecord.serviceLocation === "on_site" ? "Saha / Adreste" : "Servis Atölyesi"}</p>
                </div>
              </div>

              {/* Müşteri ve Cihaz Bilgisi Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <strong className="text-slate-900 block font-bold">MÜŞTERİ BİLGİLERİ</strong>
                  <p>Ad Soyad / Firma: <strong>{printRecord.contactName}</strong></p>
                  <p>Telefon: {printRecord.contactPhone}</p>
                  <p>Adres: {printRecord.serviceAddress || "Servis Merkezine Getirildi"}</p>
                </div>
                <div className="space-y-1">
                  <strong className="text-slate-900 block font-bold">CİHAZ BİLGİLERİ</strong>
                  <p>Kategori: {categoryConfig[printRecord.category]?.label}</p>
                  <p>Cihaz / Tür: {deviceTypeLabels[printRecord.deviceType] || printRecord.deviceType}</p>
                  <p>Marka / Model: <strong>{printRecord.brand} {printRecord.model}</strong></p>
                  <p>Seri No: {printRecord.serialNumber || "-"}</p>
                  {printRecord.gasType && printRecord.gasType !== "none" && <p>Gaz Türü: {printRecord.gasType}</p>}
                </div>
              </div>

              {/* Arıza ve Yapılan İşlem */}
              <div className="space-y-2">
                {/* Teslim Alınan Aksesuarlar & Fiziksel Durum */}
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-200">
                    <strong className="block text-purple-950 mb-0.5 font-bold uppercase text-[10px]">Teslim Alınan Aksesuar & Donanımlar:</strong>
                    <p className="text-slate-800 font-medium">
                      {printRecord.accessoriesReceived || "Harici aksesuar teslim alınmadı (Yalnız Cihaz)."}
                    </p>
                  </div>
                  <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                    <strong className="block text-amber-950 mb-0.5 font-bold uppercase text-[10px]">Cihaz Fiziksel Durumu & Deformasyon:</strong>
                    <p className="text-slate-800 font-medium">
                      {printRecord.damagePhysicalCondition ? (
                        <span className="text-amber-950 font-bold">{printRecord.damagePhysicalCondition}</span>
                      ) : (
                        <span className="text-emerald-800 font-bold">Belirgin çizik, kırık veya kusur bulunmamaktadır.</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 mb-0.5">Bildirilen Şikayet / Arıza:</strong>
                  <p className="text-slate-700">{printRecord.customerProblemDescription}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 mb-0.5">Teknik Servis Teşhis ve Yapılan İşlemler:</strong>
                  <p className="text-slate-700">{printRecord.technicianReport || "Bakım ve onarım işlemleri gerçekleştirildi."}</p>
                </div>
              </div>

              {/* Parça ve İşçilik Tablosu */}
              <div className="space-y-1">
                <strong className="block text-slate-900 font-bold">KULLANILAN YEDEK PARÇALAR & İŞÇİLİK</strong>
                <table className="w-full border-collapse text-left border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                      <th className="p-1.5 border-r border-slate-300">İşlem / Parça Tanımı</th>
                      <th className="p-1.5 border-r border-slate-300 text-center">Adet/Saat</th>
                      <th className="p-1.5 border-r border-slate-300 text-right">Birim Fiyat</th>
                      <th className="p-1.5 border-r border-slate-300 text-center">KDV</th>
                      <th className="p-1.5 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printRecord.parts?.map((p) => (
                      <tr key={p.id} className="border-b border-slate-200">
                        <td className="p-1.5 border-r border-slate-300 font-medium">{p.partName} (Yedek Parça)</td>
                        <td className="p-1.5 border-r border-slate-300 text-center">{p.quantity}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right">{p.unitPrice.toLocaleString("tr-TR")} ₺</td>
                        <td className="p-1.5 border-r border-slate-300 text-center">%{p.vatRate}</td>
                        <td className="p-1.5 text-right font-bold">{p.total.toLocaleString("tr-TR")} ₺</td>
                      </tr>
                    ))}
                    {printRecord.labors?.map((l) => (
                      <tr key={l.id} className="border-b border-slate-200">
                        <td className="p-1.5 border-r border-slate-300 font-medium">{l.operationName} (İşçilik)</td>
                        <td className="p-1.5 border-r border-slate-300 text-center">{l.hours}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right">{l.hourlyRate.toLocaleString("tr-TR")} ₺</td>
                        <td className="p-1.5 border-r border-slate-300 text-center">%{l.vatRate}</td>
                        <td className="p-1.5 text-right font-bold">{l.total.toLocaleString("tr-TR")} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alt Toplamlar */}
              <div className="flex justify-end">
                <div className="w-56 space-y-1 text-right text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Parça Tutarı:</span>
                    <span>{printRecord.partsTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>İşçilik Tutarı:</span>
                    <span>{printRecord.laborTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Toplam KDV:</span>
                    <span>{printRecord.totalVat.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-400">
                    <span>GENEL TOPLAM:</span>
                    <span>{printRecord.grandTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                </div>
              </div>

              {/* Garanti & Güvenlik Şartları */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                <p>• Değişen orijinal yedek parçalar montaj tarihinden itibaren 1 yıl garanti kapsamındadır.</p>
                <p>• Kullanıcı hatası, elektrik voltaj dalgalanmaları veya yetkisiz müdahaleler garanti dışıdır.</p>
              </div>

              {/* İmza Alanları */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-center">
                <div className="space-y-8">
                  <p className="font-bold text-slate-900">Teknisyen / Servis Yetkilisi</p>
                  <p className="text-[10px] text-slate-400">İmza & Kaşe</p>
                </div>
                <div className="space-y-8">
                  <p className="font-bold text-slate-900">Müşteri / Teslim Alan</p>
                  <p className="text-[10px] text-slate-400">İmza</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📝 SERVİS KAYDI EKLEME / DÜZENLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-purple-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#6938EF] to-[#8252F6] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">
                  {editingRecord ? "Servis İş Emrini Düzenle" : "Yeni Servis & Saha İş Emri Aç"}
                </h3>
                <p className="text-xs text-purple-100">
                  Beyaz Eşya, İklimlendirme (Klima/Kombi) ve Küçük Ev Aletleri
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecord} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* 1. Bölüm: Cihaz ve Kategori Bilgileri */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Refrigerator className="w-4 h-4 text-[#8252F6]" />
                  <span>1. Cihaz ve Hizmet Türü Bilgileri</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cihaz Kategorisi *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#8252F6]"
                    >
                      <option value="hvac_climate">❄️ İklimlendirme (Klima / Kombi)</option>
                      <option value="major_appliance">🧺 Beyaz Eşya</option>
                      <option value="small_appliance">☕ Küçük Ev & Mutfak Aletleri</option>
                      <option value="other_appliance">⚡ Diğer Cihaz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cihaz Tipi *</label>
                    <select
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#8252F6]"
                    >
                      <optgroup label="İklimlendirme & Isıtma">
                        <option value="boiler_combi">Kombi (Yoğuşmalı/Konvansiyonel)</option>
                        <option value="air_conditioner_split">Split Duvar Tipi Klima</option>
                        <option value="air_conditioner_vrf">VRF / Ticari / Kaset Klima</option>
                        <option value="water_heater">Şofben / Termosifon</option>
                        <option value="heat_pump">Isı Pompası</option>
                      </optgroup>
                      <optgroup label="Beyaz Eşya">
                        <option value="refrigerator">Buzdolabı</option>
                        <option value="washing_machine">Çamaşır Makinesi</option>
                        <option value="dishwasher">Bulaşık Makinesi</option>
                        <option value="dryer">Kurutma Makinesi</option>
                        <option value="oven">Fırın / Ankastre</option>
                        <option value="cooktop_hob">Ocak / Set Üstü</option>
                        <option value="freezer">Derin Dondurucu</option>
                        <option value="range_hood">Davlumbaz / Aspiratör</option>
                      </optgroup>
                      <optgroup label="Küçük Ev & Mutfak Aletleri">
                        <option value="coffee_machine">Kahve / Espresso Makinesi</option>
                        <option value="vacuum_cleaner">Elektrikli / Dikey Süpürge</option>
                        <option value="robot_vacuum">Robot Süpürge</option>
                        <option value="blender_food_processor">Blender / Mutfak Robotu</option>
                        <option value="airfryer_fryer">Airfryer / Fritöz</option>
                        <option value="microwave_oven">Mikrodalga Fırın</option>
                        <option value="toaster_grill">Tost Makinesi / Izgara</option>
                        <option value="steam_iron">Buhar Kazanlı Ütü</option>
                        <option value="kettle_tea_maker">Çaycı / Su Isıtıcı</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hizmet Konumu *</label>
                    <select
                      value={formData.serviceLocation}
                      onChange={(e) => setFormData({ ...formData, serviceLocation: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#8252F6]"
                    >
                      <option value="on_site">🏠 Sahada / Müşteri Adresinde</option>
                      <option value="workshop">🏢 Atölyede / Servis Merkezinde</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Marka *</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Örn: Bosch, Daikin, DeLonghi, DemirDöküm"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Örn: Nitromix P28, Sensira 12k, Magnifica S"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seri No / Barkod</label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="Seri numarası"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Bölüm: Müşteri ve Randevu Bilgileri */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#8252F6]" />
                  <span>2. Müşteri & Adres / Randevu Bilgileri</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Müşteri Ad Soyad / Ünvan *</label>
                    <input
                      type="text"
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Müşteri adı"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Telefon Numarası *</label>
                    <input
                      type="text"
                      required
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Randevu Tarihi & Saat Dilimi</label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                        className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={formData.appointmentTimeSlot}
                        onChange={(e) => setFormData({ ...formData, appointmentTimeSlot: e.target.value })}
                        placeholder="10:00 - 12:00"
                        className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Montaj / Hizmet Adresi</label>
                    <input
                      type="text"
                      value={formData.serviceAddress}
                      onChange={(e) => setFormData({ ...formData, serviceAddress: e.target.value })}
                      placeholder="Açık adres, bina, daire vb."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Atanan Teknisyen</label>
                    <input
                      type="text"
                      value={formData.assignedTechnician}
                      onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                      placeholder="Teknisyen adı"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Bölüm: Arıza ve Teşhis Raporu */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#8252F6]" />
                  <span>3. Şikayet, Arıza Tespiti & Teknik Ölçümler</span>
                </h4>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Müşterinin Bildirdiği Sorun *</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.customerProblemDescription}
                    onChange={(e) => setFormData({ ...formData, customerProblemDescription: e.target.value })}
                    placeholder="Müşteri şikayeti, hata kodu, su/gaz kaçağı, ses veya ısıtma/soğutmama durumu..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gaz Türü (İklimlendirme)</label>
                    <select
                      value={formData.gasType || "none"}
                      onChange={(e) => setFormData({ ...formData, gasType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="none">Gazsız / Gerekmiyor</option>
                      <option value="R32">R32 (Ekolojik Yeni Nesil)</option>
                      <option value="R410A">R410A (Split Klima)</option>
                      <option value="R134a">R134a (Buzdolabı / Soğutucu)</option>
                      <option value="R600a">R600a (İzobütan No-Frost)</option>
                      <option value="R290">R290 (Propan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Basınç Değeri (Bar)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.pressureBar || ""}
                      onChange={(e) => setFormData({ ...formData, pressureBar: parseFloat(e.target.value) || undefined })}
                      placeholder="Örn: 1.5 bar (Kombi), 8.5 bar (Klima)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="warrantyCheckbox"
                      checked={formData.isWarrantyActive}
                      onChange={(e) => setFormData({ ...formData, isWarrantyActive: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="warrantyCheckbox" className="font-bold text-slate-700 cursor-pointer">
                      Garanti Kapsamında Onarım
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teknisyen Teşhis & Müdahale Raporu</label>
                  <textarea
                    rows={2}
                    value={formData.technicianReport}
                    onChange={(e) => setFormData({ ...formData, technicianReport: e.target.value })}
                    placeholder="Uygulanan testler, parça değişimi, kaçak kontrolü veya gaz dolum detayları..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#8252F6]"
                  />
                </div>

                {/* Teslim Alınan Aksesuarlar / Malzemeler & Cihaz Fiziksel Deformasyon Durumu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/80">
                    <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-700" />
                      <span>Beraberinde Teslim Alınan Parça & Aksesuarlar</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accessoriesReceived || ""}
                      onChange={(e) => setFormData({ ...formData, accessoriesReceived: e.target.value })}
                      placeholder="Örn: Uzaktan Kumanda, Şarj Adaptörü, Güç Kablosu, Filtre, Boru..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Teslim alma tutanağında eksiksiz belirtilir.
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80">
                    <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Cihaz / Ürün Çizik, Kırık & Deformasyon Durumu</span>
                    </label>
                    <input
                      type="text"
                      value={formData.damagePhysicalCondition || ""}
                      onChange={(e) => setFormData({ ...formData, damagePhysicalCondition: e.target.value })}
                      placeholder="Örn: Ön panelde kılcal çizikler, kapakta hafif sararma, sağ köşede sürtme..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Kayıt anındaki fiziksel kusurlar teslim alma tutanağına yazılır.
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Bölüm: Parça ve İşçilik Yönetimi */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#8252F6]" />
                  <span>4. Yedek Parça ve İşçilik Kalemleri</span>
                </h4>

                {/* Parça Ekleme Satırı */}
                <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 space-y-2">
                  <span className="font-bold text-purple-900 block">Yedek Parça Ekle:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <input
                      type="text"
                      value={newPartName}
                      onChange={(e) => setNewPartName(e.target.value)}
                      placeholder="Parça Adı (Örn: NTC Sensör, Pompa, Conta)"
                      className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-purple-200 bg-white"
                    />
                    <select
                      value={newPartCategory}
                      onChange={(e) => setNewPartCategory(e.target.value as any)}
                      className="px-2 py-1.5 rounded-xl border border-purple-200 bg-white font-semibold text-xs"
                    >
                      <option value="thermostat_sensor">Termostat / Sensör</option>
                      <option value="resistance_heating">Rezistans / Isıtıcı</option>
                      <option value="pump_motor">Pompa / Motor</option>
                      <option value="gasket_seal">Conta / Keçe / O-Ring</option>
                      <option value="compressor_gas">Kompresör / Gaz / Vana</option>
                      <option value="electronic_board">Elektronik Kart / Ekran</option>
                      <option value="filter_boiler">Filtre / Eşanjör / Kazan</option>
                      <option value="gear_mechanical">Mekanik / Dişli / Bıçak</option>
                      <option value="other">Diğer</option>
                    </select>
                    <input
                      type="number"
                      value={newPartQty}
                      onChange={(e) => setNewPartQty(parseInt(e.target.value) || 1)}
                      placeholder="Adet"
                      className="px-2 py-1.5 rounded-xl border border-purple-200 bg-white"
                    />
                    <input
                      type="number"
                      value={newPartPrice || ""}
                      onChange={(e) => setNewPartPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Birim Fiyat (₺)"
                      className="px-2 py-1.5 rounded-xl border border-purple-200 bg-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddPart}
                      className="px-3 py-1.5 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 transition-all cursor-pointer"
                    >
                      + Parça Ekle
                    </button>
                  </div>

                  {/* Eklenen Parçalar Tablosu */}
                  {formData.parts && formData.parts.length > 0 && (
                    <div className="mt-2 space-y-1 divide-y divide-purple-100 bg-white p-2 rounded-xl border border-purple-100">
                      {formData.parts.map((p) => (
                        <div key={p.id} className="pt-1 flex items-center justify-between text-xs">
                          <span>{p.partName} ({p.quantity} Adet × {p.unitPrice} ₺)</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{p.total} ₺</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePart(p.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* İşçilik Ekleme Satırı */}
                <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 space-y-2">
                  <span className="font-bold text-blue-900 block">Teknik İşçilik Ekle:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <input
                      type="text"
                      value={newLaborName}
                      onChange={(e) => setNewLaborName(e.target.value)}
                      placeholder="İşlem Adı (Örn: Gaz Kaçak Tespiti & Şarjı)"
                      className="sm:col-span-3 px-3 py-1.5 rounded-xl border border-blue-200 bg-white"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={newLaborHours}
                      onChange={(e) => setNewLaborHours(parseFloat(e.target.value) || 1)}
                      placeholder="Saat"
                      className="px-2 py-1.5 rounded-xl border border-blue-200 bg-white"
                    />
                    <input
                      type="number"
                      value={newLaborRate || ""}
                      onChange={(e) => setNewLaborRate(parseFloat(e.target.value) || 0)}
                      placeholder="Saat Ücreti (₺)"
                      className="px-2 py-1.5 rounded-xl border border-blue-200 bg-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddLabor}
                      className="px-3 py-1.5 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition-all cursor-pointer"
                    >
                      + İşçilik Ekle
                    </button>
                  </div>

                  {/* Eklenen İşçilikler Tablosu */}
                  {formData.labors && formData.labors.length > 0 && (
                    <div className="mt-2 space-y-1 divide-y divide-blue-100 bg-white p-2 rounded-xl border border-blue-100">
                      {formData.labors.map((l) => (
                        <div key={l.id} className="pt-1 flex items-center justify-between text-xs">
                          <span>{l.operationName} ({l.hours} Saat × {l.hourlyRate} ₺)</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{l.total} ₺</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLabor(l.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toplam Özeti */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-400 block text-[10px]">PARÇA TOPLAMI</span>
                      <span className="font-bold text-sm">{(formData.partsTotal || 0).toLocaleString("tr-TR")} ₺</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">İŞÇİLİK TOPLAMI</span>
                      <span className="font-bold text-sm">{(formData.laborTotal || 0).toLocaleString("tr-TR")} ₺</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">HESAPLANAN KDV</span>
                      <span className="font-bold text-sm">{(formData.totalVat || 0).toLocaleString("tr-TR")} ₺</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-purple-300 block text-[10px] font-bold">GENEL TOPLAM (KDV DAHİL)</span>
                    <span className="text-xl font-black text-white">
                      {(formData.grandTotal || 0).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Aksiyon Butonları */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8252F6] hover:bg-[#703EE5] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  {editingRecord ? "Değişiklikleri Kaydet" : "Servis Kaydını Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EV ALETLERİ & KLİMA SERVİS FATURALANDIRMA MODALI */}
      {isInvoicingModalOpen && invoicingRecord && (
        <ServiceInvoicingModal
          isOpen={isInvoicingModalOpen}
          onClose={() => {
            setIsInvoicingModalOpen(false);
            setInvoicingRecord(null);
          }}
          serviceType="appliance"
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
            handleOpenDeliveryModal(record as ApplianceServiceRecord);
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
          serviceType="appliance"
          serviceRecord={whatsAppRecord}
          defaultTemplateType={whatsAppTemplateType}
          companySettings={companySettings}
        />
      )}

      {/* ÜRÜN & CİHAZ TESLİM TUTANAĞI MODALI */}
      {isDeliveryModalOpen && deliveryRecord && (
        <ServiceDeliveryModal
          isOpen={isDeliveryModalOpen}
          onClose={() => {
            setIsDeliveryModalOpen(false);
            setDeliveryRecord(null);
          }}
          serviceType="appliance"
          serviceRecord={deliveryRecord}
          companySettings={companySettings}
          onOpenInvoicing={(rec) => {
            setIsDeliveryModalOpen(false);
            handleOpenInvoicing(rec as ApplianceServiceRecord);
          }}
          onOpenWhatsApp={(rec) => {
            setIsDeliveryModalOpen(false);
            handleOpenWhatsApp(rec as ApplianceServiceRecord, "completed");
          }}
          onMarkDelivered={handleMarkDelivered}
        />
      )}
    </div>
  );
};
