import React, { useState, useMemo } from "react";
import {
  X,
  Printer,
  FileSpreadsheet,
  Users,
  Search,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { Employee, CompanySettings, Branch, Warehouse } from "../types";
import { exportToExcel, formatCurrency, formatDate } from "../utils/exportUtils";
import { Logo } from "./Logo";

interface EmployeeListPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  companySettings: CompanySettings;
  branches?: Branch[];
  warehouses?: Warehouse[];
}

export const EmployeeListPrintModal: React.FC<EmployeeListPrintModalProps> = ({
  isOpen,
  onClose,
  employees,
  companySettings,
  branches = [],
  warehouses = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const departments = useMemo(() => {
    const deps = new Set<string>();
    employees.forEach((e) => {
      if (e.department) deps.add(e.department);
    });
    return Array.from(deps);
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        !searchTerm.trim() ||
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.tckn && e.tckn.includes(searchTerm)) ||
        (e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDep =
        filterDepartment === "all" || e.department === filterDepartment;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && (!e.status || e.status === "active")) ||
        (filterStatus === "on_leave" && e.status === "on_leave") ||
        (filterStatus === "terminated" && e.status === "terminated");

      return matchesSearch && matchesDep && matchesStatus;
    });
  }, [employees, searchTerm, filterDepartment, filterStatus]);

  const totalMonthlyNet = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + (curr.salaryAmount || curr.salary || 0), 0);
  }, [filtered]);

  const handleExportExcel = () => {
    const today = new Date().toISOString().split("T")[0];
    exportToExcel({
      filename: `Personel_Listesi_${today}`,
      sheetName: "Personel Listesi",
      title: `${companySettings.name || "ŞİRKET"} - PERSONEL VE KADRO LİSTESİ`,
      subtitle: `Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")} • Toplam: ${filtered.length} Çalışan`,
      headers: [
        "Sıra",
        "Ad Soyad",
        "T.C. Kimlik No",
        "Departman",
        "Unvan / Görev",
        "SGK Meslek Kodu",
        "İşe Giriş Tarihi",
        "Maaş Türü",
        "Maaş Tutarı (₺)",
        "Durum",
        "Telefon",
        "E-posta",
      ],
      rows: filtered.map((e, idx) => [
        idx + 1,
        e.fullName,
        e.tckn || "-",
        e.department || "-",
        e.title || "-",
        e.sgkOccupationCode || "-",
        e.startDate ? formatDate(e.startDate) : "-",
        e.salaryType === "gross" ? "Brüt" : "Net",
        e.salaryAmount || e.salary || 0,
        e.status === "terminated"
          ? "Ayrıldı"
          : e.status === "on_leave"
          ? "İzinli"
          : "Aktif",
        e.phone || "-",
        e.email || "-",
      ]),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Modal Top Header (Screen Only) */}
        <div className="print:hidden p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Personel ve Kadro Listesi</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700/60">
                  {filtered.length} Kişi
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Resmi personel dökümü, SGK meslek kodları ve kadro özeti
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Excel (.xlsx) olarak indir"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel İndir</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Yazdır veya PDF olarak kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter controls (Screen Only) */}
        <div className="print:hidden p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Personel ara (Ad, TCKN, Unvan)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <option value="all">Tüm Departmanlar</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="on_leave">İzinli</option>
              <option value="terminated">Ayrılanlar</option>
            </select>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          <div className="max-w-4xl mx-auto space-y-5 print:max-w-none print:space-y-4">
            {/* Document Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Logo size="sm" />
                  <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                    {companySettings.name || "ŞİRKET PERSONEL VE KADRO LİSTESİ"}
                  </h1>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p>
                    <span className="font-bold">Vergi No:</span> {companySettings.taxNumber || "—"} |{" "}
                    <span className="font-bold">Vergi Dairesi:</span> {companySettings.taxOffice || "—"}
                  </p>
                  <p>
                    <span className="font-bold">SGK İşyeri Sicil No:</span>{" "}
                    {companySettings.sgkCredentials?.workplaceRegistrationNo || "—"}
                  </p>
                  <p>
                    <span className="font-bold">Adres:</span> {companySettings.address || "—"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 bg-purple-50 text-purple-900 font-extrabold text-xs rounded-lg border border-purple-200">
                  RESMİ KADRO CETVELİ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Düzenleme: {new Date().toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Listelenen Personel</span>
                <span className="text-lg font-black text-slate-900">{filtered.length} Çalışan</span>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">Aktif Kadro</span>
                <span className="text-lg font-black text-emerald-800">
                  {filtered.filter((e) => !e.status || e.status === "active").length} Kişi
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60">
                <span className="text-[10px] font-bold text-blue-700 block uppercase">İzinli / Raporlu</span>
                <span className="text-lg font-black text-blue-800">
                  {filtered.filter((e) => e.status === "on_leave").length} Kişi
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60">
                <span className="text-[10px] font-bold text-purple-700 block uppercase">Toplam Net Hakediş</span>
                <span className="text-lg font-black text-purple-900 font-mono">
                  {formatCurrency(totalMonthlyNet, "TRY")}
                </span>
              </div>
            </div>

            {/* Official Table */}
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2 px-2.5 w-8 text-center">#</th>
                    <th className="py-2 px-3">Adı Soyadı</th>
                    <th className="py-2 px-3">T.C. Kimlik No</th>
                    <th className="py-2 px-3">Departman</th>
                    <th className="py-2 px-3">Görevi / Unvanı</th>
                    <th className="py-2 px-2.5">SGK Meslek Kodu</th>
                    <th className="py-2 px-2.5">İşe Giriş</th>
                    <th className="py-2 px-3 text-right">Maaş</th>
                    <th className="py-2 px-2.5 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filtered.map((emp, idx) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {emp.fullName}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {emp.tckn || "—"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">{emp.department || "—"}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{emp.title || "—"}</td>
                      <td className="py-2 px-2.5 font-mono text-slate-600 whitespace-nowrap">
                        {emp.sgkOccupationCode || "—"}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {emp.startDate ? formatDate(emp.startDate) : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold whitespace-nowrap">
                        {formatCurrency(emp.salaryAmount || emp.salary || 0, "TRY")}
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({emp.salaryType === "gross" ? "Brüt" : "Net"})
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.status === "terminated"
                              ? "bg-rose-100 text-rose-800"
                              : emp.status === "on_leave"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {emp.status === "terminated"
                            ? "Ayrıldı"
                            : emp.status === "on_leave"
                            ? "İzinli"
                            : "Aktif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Kriterlere uygun personel bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signature Footer */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-700 border-t border-slate-200 mt-6 print:pt-10">
              <div className="text-center space-y-12">
                <div>
                  <p className="font-bold text-slate-900">Düzenleyen</p>
                  <p className="text-[11px] text-slate-500">İnsan Kaynakları / Personel Sorumlusu</p>
                </div>
                <div className="border-t border-dashed border-slate-400 w-48 mx-auto pt-1 text-[10px] text-slate-400">
                  İmza
                </div>
              </div>

              <div className="text-center space-y-12">
                <div>
                  <p className="font-bold text-slate-900">Onaylayan</p>
                  <p className="text-[11px] text-slate-500">Şirket Müdürü / Yetkili</p>
                </div>
                <div className="border-t border-dashed border-slate-400 w-48 mx-auto pt-1 text-[10px] text-slate-400">
                  Kaşe / İmza
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Screen Only) */}
        <div className="print:hidden p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">
            Toplam <span className="font-bold text-slate-800">{filtered.length}</span> personel listelendi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
