import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  MapPin,
  Wrench,
  Sparkles,
  Printer,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Truck,
  Zap,
  Building,
  ThermometerSnowflake,
  Refrigerator,
  Coffee,
  Check,
  ChevronDown,
  Info,
  Layers,
  CalendarDays,
  LayoutGrid,
  ListOrdered,
  Flame,
} from "lucide-react";
import {
  ApplianceServiceRecord,
  ApplianceCategory,
  ApplianceServiceStatus,
  ApplianceServiceLocation,
} from "../../types";

interface ApplianceCalendarViewProps {
  applianceServices: ApplianceServiceRecord[];
  onUpdateApplianceServices: (services: ApplianceServiceRecord[]) => void;
  onEditRecord: (record: ApplianceServiceRecord) => void;
  onPrintRecord: (record: ApplianceServiceRecord) => void;
  onOpenAiAssistant: (record: ApplianceServiceRecord) => void;
  onOpenCreateModalWithDate: (dateStr: string) => void;
}

type CalendarViewMode = "month" | "week" | "day";

export const ApplianceCalendarView: React.FC<ApplianceCalendarViewProps> = ({
  applianceServices,
  onUpdateApplianceServices,
  onEditRecord,
  onPrintRecord,
  onOpenAiAssistant,
  onOpenCreateModalWithDate,
}) => {
  // Current view date state (Default to August 2026 to match mockData base, or current local date)
  const todayStr = useMemo(() => {
    // Check if there are 2026 records
    const has2026 = applianceServices.some((s) => (s.appointmentDate || s.entryDate || "").startsWith("2026-08"));
    if (has2026) return "2026-08-27";
    return new Date().toISOString().split("T")[0];
  }, [applianceServices]);

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date(todayStr);
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");

  // Filters
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<ApplianceCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ApplianceServiceStatus | "all">("all");

  // Category Configuration
  const categoryConfig: Record<
    ApplianceCategory,
    { label: string; icon: React.ElementType; color: string; bg: string; border: string }
  > = {
    hvac_climate: {
      label: "İklimlendirme (Klima/Kombi)",
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

  // Status Labels & Colors
  const statusLabels: Record<
    ApplianceServiceStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    reception: { label: "Randevu Alındı", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", dot: "bg-slate-500" },
    assigned: { label: "Teknisyene Atandı", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
    on_the_way: { label: "Sahada / Yolda", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
    diagnosing: { label: "Arıza Teşhisinde", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    quote_pending: { label: "Müşteri Onayı Bekliyor", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    parts_ordered: { label: "Parça Bekleniyor", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
    repairing: { label: "Onarımda / Montajda", bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200", dot: "bg-cyan-600" },
    testing_qc: { label: "Test & Gaz Kontrolü", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
    ready_delivered: { label: "Tamamlandı / Teslim", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    cancelled: { label: "İptal / İade", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  };

  // Extract unique technicians
  const technicianList = useMemo(() => {
    const set = new Set<string>();
    applianceServices.forEach((s) => {
      if (s.assignedTechnician && s.assignedTechnician.trim()) {
        set.add(s.assignedTechnician.trim());
      }
    });
    return Array.from(set).sort();
  }, [applianceServices]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return applianceServices.filter((s) => {
      if (selectedTechnician !== "all" && s.assignedTechnician !== selectedTechnician) {
        return false;
      }
      if (selectedCategory !== "all" && s.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== "all" && s.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [applianceServices, selectedTechnician, selectedCategory, selectedStatus]);

  // Map of date string (YYYY-MM-DD) -> Array of ApplianceServiceRecord
  const servicesByDate = useMemo(() => {
    const map: Record<string, ApplianceServiceRecord[]> = {};
    filteredServices.forEach((s) => {
      const dateKey = s.appointmentDate || s.entryDate || s.createdAt;
      if (dateKey) {
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(s);
      }
    });

    // Sort jobs within each day by time slot or creation
    Object.keys(map).forEach((date) => {
      map[date].sort((a, b) => {
        const slotA = a.appointmentTimeSlot || "12:00";
        const slotB = b.appointmentTimeSlot || "12:00";
        return slotA.localeCompare(slotB);
      });
    });

    return map;
  }, [filteredServices]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNamesTr = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const weekDayNamesTr = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const weekDayShortTr = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date(todayStr);
    setCurrentDate(today);
    setSelectedDateStr(todayStr);
  };

  // Generate Calendar Days (Month Grid)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // In JS, getDay() 0 = Sunday, 1 = Monday, ... 6 = Saturday
    // We want Monday = 0, Tuesday = 1, ... Sunday = 6
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6; // Sunday becomes 6

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isWeekend: boolean;
      services: ApplianceServiceRecord[];
    }[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pDate = new Date(year, month - 1, pDay);
      const pDateStr = pDate.toISOString().split("T")[0];
      const pDayOfWeek = pDate.getDay();
      days.push({
        dateStr: pDateStr,
        dayNumber: pDay,
        isCurrentMonth: false,
        isToday: pDateStr === todayStr,
        isSelected: pDateStr === selectedDateStr,
        isWeekend: pDayOfWeek === 0 || pDayOfWeek === 6,
        services: servicesByDate[pDateStr] || [],
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const cDate = new Date(year, month, d);
      // Format YYYY-MM-DD manually to avoid timezone shift
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const cDateStr = `${year}-${mm}-${dd}`;
      const cDayOfWeek = cDate.getDay();

      days.push({
        dateStr: cDateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: cDateStr === todayStr,
        isSelected: cDateStr === selectedDateStr,
        isWeekend: cDayOfWeek === 0 || cDayOfWeek === 6,
        services: servicesByDate[cDateStr] || [],
      });
    }

    // Next month padding days to complete 35 or 42 grid slots
    const remainingSlots = 42 - days.length;
    if (remainingSlots > 0 && remainingSlots < 7) {
      for (let n = 1; n <= remainingSlots; n++) {
        const nDate = new Date(year, month + 1, n);
        const nDateStr = nDate.toISOString().split("T")[0];
        const nDayOfWeek = nDate.getDay();
        days.push({
          dateStr: nDateStr,
          dayNumber: n,
          isCurrentMonth: false,
          isToday: nDateStr === todayStr,
          isSelected: nDateStr === selectedDateStr,
          isWeekend: nDayOfWeek === 0 || nDayOfWeek === 6,
          services: servicesByDate[nDateStr] || [],
        });
      }
    } else if (days.length === 35 && remainingSlots >= 7) {
      // 35 is already 5 complete weeks, leave it as is if tidy, or pad to 35
    }

    return days;
  }, [year, month, todayStr, selectedDateStr, servicesByDate]);

  // Selected date services list
  const selectedDateServices = useMemo(() => {
    return servicesByDate[selectedDateStr] || [];
  }, [servicesByDate, selectedDateStr]);

  // Quick Status change inline
  const handleQuickStatusChange = (recordId: string, newStatus: ApplianceServiceStatus) => {
    const updated = applianceServices.map((s) => {
      if (s.id === recordId) {
        return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    onUpdateApplianceServices(updated);
  };

  // Format date readable in Turkish
  const formatReadableDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        return `${d} ${monthNamesTr[m]} ${y}, ${weekDayNamesTr[dt.getDay() === 0 ? 6 : dt.getDay() - 1]}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Technician Workload Summary for Current Month
  const technicianWorkload = useMemo(() => {
    const stats: Record<
      string,
      {
        total: number;
        onSite: number;
        workshop: number;
        active: number;
        completed: number;
      }
    > = {};

    filteredServices.forEach((s) => {
      const tech = s.assignedTechnician?.trim() || "Atanmamış / Havuz";
      if (!stats[tech]) {
        stats[tech] = { total: 0, onSite: 0, workshop: 0, active: 0, completed: 0 };
      }
      stats[tech].total += 1;
      if (s.serviceLocation === "on_site") stats[tech].onSite += 1;
      else stats[tech].workshop += 1;

      if (s.status === "ready_delivered") stats[tech].completed += 1;
      else if (s.status !== "cancelled") stats[tech].active += 1;
    });

    return stats;
  }, [filteredServices]);

  // Generate Week Days for Week View Mode
  const weekDays = useMemo(() => {
    const sel = new Date(selectedDateStr);
    let dayOfWeek = sel.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6; // Monday is 0

    // Find monday of this week
    const monday = new Date(sel);
    monday.setDate(sel.getDate() - dayOfWeek);

    const weekArr: {
      dateStr: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
      isSelected: boolean;
      services: ApplianceServiceRecord[];
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayN = String(d.getDate()).padStart(2, "0");
      const dStr = `${y}-${m}-${dayN}`;

      weekArr.push({
        dateStr: dStr,
        dayName: weekDayNamesTr[i],
        dayNumber: d.getDate(),
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDateStr,
        services: servicesByDate[dStr] || [],
      });
    }

    return weekArr;
  }, [selectedDateStr, todayStr, servicesByDate]);

  return (
    <div className="space-y-6">
      {/* 📅 TAKVİM KONTROL & FİLTRELEME BAŞLIĞI */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs space-y-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Geometrik Vektör Şekli */}
        <svg
          className="absolute -right-4 -bottom-6 w-32 h-32 pointer-events-none text-purple-400/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Sol: Ay / Yıl Başlığı ve Navigasyon */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100/80 border border-purple-200/80 text-purple-700 flex items-center justify-center font-bold shrink-0 shadow-2xs backdrop-blur-2xs">
              <CalendarDays className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {monthNamesTr[month]} {year}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100/90 text-purple-800 border border-purple-200">
                  {filteredServices.length} Randevu
                </span>
              </div>
              <p className="text-xs text-purple-950/80 font-medium">
                Teknisyen saha rotaları ve servis randevu çizelgesi
              </p>
            </div>

            {/* Ay Değiştirme Butonları */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={handlePrevMonth}
                title="Önceki Ay"
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToday}
                title="Bugüne Git"
                className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 text-xs font-bold border border-purple-200/60 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                Bugün
              </button>
              <button
                onClick={handleNextMonth}
                title="Sonraki Ay"
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sağ: Görünüm Modu ve Hızlı Randevu Ekle Butonu */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-purple-100/70 border border-purple-200/80 backdrop-blur-md text-xs font-bold">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "month"
                    ? "bg-white text-purple-950 shadow-xs border border-purple-200/60"
                    : "text-purple-900/80 hover:text-purple-950"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Aylık Takvim</span>
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "week"
                    ? "bg-white text-purple-950 shadow-xs border border-purple-200/60"
                    : "text-purple-900/80 hover:text-purple-950"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Haftalık Plan</span>
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "day"
                    ? "bg-white text-purple-950 shadow-xs border border-purple-200/60"
                    : "text-purple-900/80 hover:text-purple-950"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Günlük Zaman</span>
              </button>
            </div>

            {/* Yeni Servis Randevusu Aç */}
            <button
              onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-100" />
              <span>Seçili Güne Randevu Ekle</span>
            </button>
          </div>
        </div>

        {/* Filtreleme Çubuğu */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-purple-200/60 relative z-10">
          {/* Teknisyen Filtresi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Teknisyen / Saha Uzmanı
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8252F6]"
              >
                <option value="all">👨‍🔧 Tüm Teknisyenler ({technicianList.length})</option>
                {technicianList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cihaz Kategorisi Filtresi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cihaz Kategorisi
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8252F6]"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="hvac_climate">❄️ İklimlendirme (Klima / Kombi)</option>
              <option value="major_appliance">🧺 Beyaz Eşya</option>
              <option value="small_appliance">☕ Küçük Ev Aletleri</option>
              <option value="other_appliance">⚡ Diğer</option>
            </select>
          </div>

          {/* Servis Durumu Filtresi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Servis Durumu
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8252F6]"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="reception">Randevu Alındı</option>
              <option value="assigned">Teknisyene Atandı</option>
              <option value="on_the_way">Sahada / Yolda</option>
              <option value="diagnosing">Arıza Teşhisinde</option>
              <option value="quote_pending">Müşteri Onayı Bekliyor</option>
              <option value="parts_ordered">Parça Bekleniyor</option>
              <option value="repairing">Onarımda / Montajda</option>
              <option value="testing_qc">Test & Gaz Kontrolü</option>
              <option value="ready_delivered">Tamamlandı / Teslim</option>
            </select>
          </div>
        </div>
      </div>

      {/* 👨‍🔧 TEKNİSYEN İŞ YÜKÜ DAĞILIMI (WORKLOAD BAR) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#6938EF]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Teknisyen İş Yükü ve Saha Kapasite Dağılımı ({monthNamesTr[month]} {year})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Toplam {filteredServices.length} iş emri dağıtıldı
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.entries(technicianWorkload) as [string, { total: number; onSite: number; workshop: number; active: number; completed: number }][]).map(([techName, stats]) => {
            const isSelected = selectedTechnician === techName;
            return (
              <div
                key={techName}
                onClick={() => setSelectedTechnician(isSelected ? "all" : techName)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-50/80 border-[#6938EF] shadow-sm ring-1 ring-[#6938EF]"
                    : "bg-slate-50/70 border-slate-200 hover:border-purple-200 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#6938EF] flex items-center justify-center font-bold text-xs shrink-0">
                      {techName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{techName}</p>
                      <p className="text-[10px] text-slate-500">
                        {stats.onSite} Saha • {stats.workshop} Atölye
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-[#6938EF] shrink-0">
                    {stats.total} İş
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>{stats.active} Aktif Devam Eden</span>
                    <span className="font-bold text-emerald-600">{stats.completed} Tamam</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#6938EF] h-full"
                      style={{ width: `${(stats.active / Math.max(stats.total, 1)) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(stats.completed / Math.max(stats.total, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🗓️ AYLIK TAKVİM GRID GÖRÜNÜMÜ */}
      {viewMode === "month" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Haftanın Günleri Başlığı */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center">
            {weekDayNamesTr.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2.5 text-xs font-extrabold uppercase tracking-wider ${
                  idx >= 5 ? "text-rose-600 bg-rose-50/30" : "text-slate-600"
                }`}
              >
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{weekDayShortTr[idx]}</span>
              </div>
            ))}
          </div>

          {/* Gün Hücreleri Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((dayItem) => {
              const hasServices = dayItem.services.length > 0;

              return (
                <div
                  key={dayItem.dateStr}
                  onClick={() => setSelectedDateStr(dayItem.dateStr)}
                  className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 flex flex-col transition-all cursor-pointer relative group ${
                    !dayItem.isCurrentMonth
                      ? "bg-slate-50/50 text-slate-300"
                      : dayItem.isSelected
                      ? "bg-purple-50/60 ring-2 ring-inset ring-[#6938EF] z-10"
                      : dayItem.isToday
                      ? "bg-amber-50/40"
                      : dayItem.isWeekend
                      ? "bg-slate-50/30"
                      : "bg-white hover:bg-slate-50/80"
                  }`}
                >
                  {/* Gün Başlığı */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          dayItem.isToday
                            ? "bg-[#6938EF] text-white shadow-sm font-extrabold"
                            : dayItem.isSelected
                            ? "bg-purple-200 text-[#6938EF]"
                            : !dayItem.isCurrentMonth
                            ? "text-slate-400"
                            : "text-slate-700"
                        }`}
                      >
                        {dayItem.dayNumber}
                      </span>
                      {dayItem.isToday && (
                        <span className="hidden sm:inline-block text-[9px] font-extrabold text-[#6938EF] uppercase tracking-wide">
                          Bugün
                        </span>
                      )}
                    </div>

                    {hasServices && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-[#6938EF]">
                        {dayItem.services.length}
                      </span>
                    )}

                    {/* Hover Hızlı Randevu Ekle Butonu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCreateModalWithDate(dayItem.dateStr);
                      }}
                      title="Bu güne yeni randevu ekle"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-purple-100 hover:bg-[#6938EF] text-[#6938EF] hover:text-white transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Servis Kartları (Günün İşleri) */}
                  <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                    {dayItem.services.slice(0, 3).map((job) => {
                      const statusMeta = statusLabels[job.status] || statusLabels.reception;
                      const categoryMeta = categoryConfig[job.category] || categoryConfig.other_appliance;
                      const CategoryIcon = categoryMeta.icon;

                      return (
                        <div
                          key={job.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(dayItem.dateStr);
                            onEditRecord(job);
                          }}
                          className={`p-1 sm:p-1.5 rounded-lg border text-[10px] sm:text-[11px] leading-tight font-medium transition-all hover:shadow-sm cursor-pointer ${statusMeta.bg} ${statusMeta.border}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold truncate text-slate-800 flex items-center gap-1">
                              <CategoryIcon className="w-2.5 h-2.5 shrink-0 text-[#6938EF]" />
                              <span className="truncate">{job.contactName.split(" ")[0]}</span>
                            </span>
                            {job.appointmentTimeSlot && (
                              <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
                                {job.appointmentTimeSlot.split(" - ")[0]}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-600 truncate mt-0.5">
                            {job.brand} {job.model}
                          </p>
                        </div>
                      );
                    })}

                    {dayItem.services.length > 3 && (
                      <div className="text-[10px] text-center font-bold text-[#6938EF] py-0.5 bg-purple-50/80 rounded">
                        +{dayItem.services.length - 3} daha fazla
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📅 HAFTALIK PLAN GÖRÜNÜMÜ */}
      {viewMode === "week" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6938EF]" />
              <span>Haftalık Servis ve Saha Rota Planı</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Seçili Hafta: {weekDays[0]?.dayNumber} {monthNamesTr[month]} - {weekDays[6]?.dayNumber} {monthNamesTr[month]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((wDay) => (
              <div
                key={wDay.dateStr}
                onClick={() => setSelectedDateStr(wDay.dateStr)}
                className={`rounded-xl border p-3 flex flex-col min-h-[300px] transition-all cursor-pointer ${
                  wDay.isSelected
                    ? "bg-purple-50/70 border-[#6938EF] ring-1 ring-[#6938EF]"
                    : wDay.isToday
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-slate-50/50 border-slate-200 hover:bg-white hover:border-purple-200"
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">{wDay.dayName}</span>
                    <p className="text-base font-black text-slate-800">{wDay.dayNumber}</p>
                  </div>
                  {wDay.services.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#6938EF] text-white">
                      {wDay.services.length}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Boş</span>
                  )}
                </div>

                {/* Services list */}
                <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                  {wDay.services.map((job) => {
                    const statusMeta = statusLabels[job.status] || statusLabels.reception;
                    const categoryMeta = categoryConfig[job.category] || categoryConfig.other_appliance;
                    const CategoryIcon = categoryMeta.icon;

                    return (
                      <div
                        key={job.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(wDay.dateStr);
                          onEditRecord(job);
                        }}
                        className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all hover:shadow-md cursor-pointer ${statusMeta.bg} ${statusMeta.border}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/80 text-slate-700 border border-slate-200">
                            {job.appointmentTimeSlot || "Saat Belirtilmedi"}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                        </div>
                        <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                          <CategoryIcon className="w-3.5 h-3.5 text-[#6938EF] shrink-0" />
                          <span className="truncate">{job.contactName}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {job.brand} {job.model}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="truncate">{job.assignedTechnician?.split(" ")[0] || "Atanmadı"}</span>
                          <span className="font-bold text-slate-700">{job.grandTotal.toLocaleString("tr-TR")} ₺</span>
                        </div>
                      </div>
                    );
                  })}

                  {wDay.services.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400 space-y-1">
                      <Clock className="w-5 h-5 opacity-40" />
                      <p className="text-[11px]">Randevu Yok</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateModalWithDate(wDay.dateStr);
                        }}
                        className="text-[10px] text-[#6938EF] font-bold hover:underline"
                      >
                        + Ekle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⏰ GÜNLÜK ZAMAN ÇİZELGESİ MODU */}
      {viewMode === "day" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Günlük Zaman Çizelgesi</span>
              <h3 className="text-lg font-black text-slate-800">{formatReadableDate(selectedDateStr)}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(selectedDateStr);
                  d.setDate(d.getDate() - 1);
                  setSelectedDateStr(d.toISOString().split("T")[0]);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const d = new Date(selectedDateStr);
                  d.setDate(d.getDate() + 1);
                  setSelectedDateStr(d.toISOString().split("T")[0]);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {selectedDateServices.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Bu tarihte planlanmış servis işi bulunamadı.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Teknisyenlerinize bu gün için yeni bir servis veya saha bakım randevusu oluşturabilirsiniz.
                </p>
                <button
                  onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6938EF] text-white text-xs font-bold shadow hover:bg-[#5928DF] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Randevu Oluştur</span>
                </button>
              </div>
            ) : (
              selectedDateServices.map((service) => {
                const statusMeta = statusLabels[service.status] || statusLabels.reception;
                const categoryMeta = categoryConfig[service.category] || categoryConfig.other_appliance;
                const CategoryIcon = categoryMeta.icon;

                return (
                  <div
                    key={service.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-2xl bg-purple-100 text-[#6938EF] shrink-0 mt-0.5">
                        <CategoryIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-[#6938EF] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {service.serviceNo}
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{service.appointmentTimeSlot || "09:00 - 18:00"}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                            {statusMeta.label}
                          </span>
                          {service.serviceLocation === "on_site" ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Sahada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Building className="w-3 h-3" /> Atölyede
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900">
                          {service.contactName} • <span className="font-semibold text-slate-600">{service.brand} {service.model}</span>
                        </h4>

                        <p className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{service.serviceAddress || `${service.district} / ${service.city}`}</span>
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <User className="w-3.5 h-3.5 text-purple-600" />
                            <span>Teknisyen: {service.assignedTechnician || "Atanmamış"}</span>
                          </span>
                        </p>

                        {service.customerProblemDescription && (
                          <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200/80 text-slate-700 mt-2">
                            <strong className="text-purple-900 font-bold">Müşteri Şikayeti: </strong>
                            <span>{service.customerProblemDescription}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sağ Taraf: Tutar & Butonlar */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tutar</span>
                        <span className="text-lg font-black text-slate-800">{service.grandTotal.toLocaleString("tr-TR")} ₺</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onOpenAiAssistant(service)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#6938EF] hover:bg-purple-100 font-bold text-xs border border-purple-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Saha</span>
                        </button>
                        <button
                          onClick={() => onPrintRecord(service)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Fiş</span>
                        </button>
                        <button
                          onClick={() => onEditRecord(service)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#6938EF] text-white hover:bg-[#5928DF] font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>İş Emrini Aç</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 📋 SEÇİLİ GÜNÜN DETAYLI RANDEVU VE İŞ LİSTESİ PANELİ (Aylık & Haftalık Görünüm Altında) */}
      {viewMode !== "day" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6938EF] flex items-center justify-center font-black text-sm">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {formatReadableDate(selectedDateStr)} Servis Programı
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedDateServices.length > 0
                    ? `Bu tarihte planlanmış ${selectedDateServices.length} adet servis randevusu bulunuyor.`
                    : "Bu seçili gün için henüz servis randevusu kaydedilmemiş."}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenCreateModalWithDate(selectedDateStr)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6938EF] font-bold text-xs border border-purple-200 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Bu Güne Randevu Ekle</span>
            </button>
          </div>

          {/* Günlük Randevular Kartları */}
          {selectedDateServices.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Seçili güne ait kayıtlı randevu bulunmuyor</p>
              <p className="text-[11px] text-slate-400">
                Takvimdeki gün hücrelerine tıklayarak o güne ait işleri görüntüleyebilir veya yeni randevu oluşturabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateServices.map((service) => {
                const statusMeta = statusLabels[service.status] || statusLabels.reception;
                const categoryMeta = categoryConfig[service.category] || categoryConfig.other_appliance;
                const CategoryIcon = categoryMeta.icon;

                return (
                  <div
                    key={service.id}
                    className="p-4 rounded-2xl border border-purple-100 bg-white hover:border-purple-300 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    {/* Üst Bilgiler */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#6938EF] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {service.serviceNo}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{service.appointmentTimeSlot || "Saat Belirtilmedi"}</span>
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Müşteri ve Cihaz */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <User className="w-3.5 h-3.5 text-[#6938EF]" />
                        <span>{service.contactName}</span>
                        {service.contactPhone && (
                          <a
                            href={`tel:${service.contactPhone}`}
                            className="text-[11px] text-purple-600 hover:underline flex items-center gap-0.5 ml-1 font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{service.contactPhone}</span>
                          </a>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <CategoryIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {service.brand} {service.model} ({service.serialNumber || "Seri No Yok"})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{service.serviceAddress || `${service.district} / ${service.city}`}</span>
                      </div>
                    </div>

                    {/* Arıza Açıklaması */}
                    {service.customerProblemDescription && (
                      <div className="text-[11px] bg-slate-50 p-2 rounded-xl text-slate-600 border border-slate-100 line-clamp-2">
                        <span className="font-bold text-slate-700">Şikayet: </span>
                        {service.customerProblemDescription}
                      </div>
                    )}

                    {/* Alt Çubuk: Teknisyen, Tutar ve Hızlı Aksiyonlar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Teknisyen</span>
                        <span className="text-xs font-bold text-slate-800">
                          {service.assignedTechnician || "Atanmadı"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Hızlı Durum Değiştirme Seçicisi */}
                        <select
                          value={service.status}
                          onChange={(e) => handleQuickStatusChange(service.id, e.target.value as ApplianceServiceStatus)}
                          className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#8252F6]"
                        >
                          <option value="reception">Randevu Alındı</option>
                          <option value="assigned">Teknisyene Atandı</option>
                          <option value="on_the_way">Sahada / Yolda</option>
                          <option value="diagnosing">Teşhiste</option>
                          <option value="quote_pending">Onay Bekliyor</option>
                          <option value="parts_ordered">Parça Bekleniyor</option>
                          <option value="repairing">Onarımda</option>
                          <option value="testing_qc">Test / Gaz Kontrolü</option>
                          <option value="ready_delivered">Tamamlandı</option>
                        </select>

                        <button
                          onClick={() => onOpenAiAssistant(service)}
                          title="AI Saha Asistanı & Kontrol Listesi"
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#6938EF] transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onPrintRecord(service)}
                          title="Servis Fişi Yazdır"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditRecord(service)}
                          title="İş Emrini Düzenle"
                          className="px-2.5 py-1 rounded-lg bg-[#6938EF] hover:bg-[#5928DF] text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Aç
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
