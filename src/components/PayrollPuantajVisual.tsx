import React from "react";
import { PuantajCode, DayPuantajDetail, Employee } from "../types";
import {
  PUANTAJ_CODE_CONFIG,
  getTurkishOfficialHoliday,
} from "../utils/puantajUtils";
import { Calendar, Clock } from "lucide-react";

export interface PayrollPuantajVisualProps {
  puantajDays?: Record<number, DayPuantajDetail | PuantajCode>;
  monthStr: string; // "YYYY-MM", e.g. "2026-07"
  employee: Employee;
  puantajStats?: any;
  overtimeInfo?: any;
  isLandscape?: boolean;
  hideKpiBadges?: boolean;
}

const DAY_NAMES_SHORT_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTH_NAMES_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const PayrollPuantajVisual: React.FC<PayrollPuantajVisualProps> = ({
  puantajDays,
  monthStr,
  employee,
  puantajStats,
  overtimeInfo,
  isLandscape = true,
  hideKpiBadges = false,
}) => {
  const [yearStr, monthNumStr] = (monthStr || "2026-07").split("-");
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthNumStr, 10) || 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = MONTH_NAMES_TR[month - 1] || "Bordro Ayı";

  // Build day array
  const daysList = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(year, month - 1, dayNum);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayName = DAY_NAMES_SHORT_TR[dayOfWeek];

    const raw = puantajDays ? puantajDays[dayNum] : undefined;
    const code: PuantajCode =
      typeof raw === "string"
        ? raw
        : raw
        ? raw.code
        : isWeekend
        ? "HT"
        : "N";

    const otHours =
      typeof raw === "object" && raw ? (raw.overtimeHours || 0) : 0;
    const isHolOt =
      typeof raw === "object" && raw ? Boolean(raw.isHolidayOvertime) : false;
    const holiday = getTurkishOfficialHoliday(year, month, dayNum);
    const cfg = PUANTAJ_CODE_CONFIG[code] || PUANTAJ_CODE_CONFIG["N"];

    return {
      dayNum,
      dayName,
      isWeekend,
      code,
      otHours,
      isHolOt,
      holiday,
      cfg,
    };
  });

  const totalOtHours =
    (overtimeInfo?.totalHours ?? puantajStats?.totalOvertimeHours) || 0;
  const sgkDays = puantajStats?.sgkDays ?? 30;
  const countN = puantajStats?.countN ?? 22;
  const countHT = puantajStats?.countHT ?? 8;
  const countRT = puantajStats?.countRT ?? 0;
  const paidLeaveDays =
    (puantajStats?.countYI || 0) +
    (puantajStats?.countUI || 0) +
    (puantajStats?.countDI || 0);
  const countR = puantajStats?.countR ?? 0;
  const unpaidDays = puantajStats?.unpaidDays ?? 0;

  return (
    <div className="puantaj-visual-container border border-slate-300 rounded-xl overflow-hidden bg-white mb-3 print:mb-2 print:border-slate-400">
      {/* 1. Header Bar: Title & Stats Chips */}
      <div className="bg-slate-800 text-white px-2.5 py-1 flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-700 print:bg-slate-900 print:py-0.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="font-extrabold text-[11px] uppercase tracking-wide">
            RESMİ PUANTAJ VE FİİLİ ÇALIŞMA ÇİZELGESİ
          </span>
          <span className="text-[9.5px] text-slate-300 font-normal ml-1">
            ({monthName} {year} · {daysInMonth} Gün)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[9.5px] font-semibold">
          <span className="bg-purple-950 text-purple-200 border border-purple-500/40 px-1.5 py-0.5 rounded font-bold">
            SGK Prim Günü: {sgkDays} / 30 Gün
          </span>
          {unpaidDays > 0 && (
            <span className="bg-rose-900 text-rose-200 border border-rose-500/50 px-1.5 py-0.5 rounded font-bold">
              Eksik Gün: {unpaidDays} Gün
            </span>
          )}
          {totalOtHours > 0 && (
            <span className="bg-amber-900 text-amber-200 border border-amber-500/50 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Fazla Mesai: {totalOtHours} Sa
            </span>
          )}
        </div>
      </div>

      {/* 2. Puantaj İcmal KPI Rozetleri (Normal Çalışma, Tatil, İzin, Mesai) */}
      {!hideKpiBadges && (
        <div className="grid grid-cols-4 md:grid-cols-8 divide-x divide-y md:divide-y-0 divide-slate-200 bg-slate-50 border-b border-slate-200 text-center text-[10px] print:grid-cols-8 print:divide-y-0 print:divide-slate-300">
          <div className="p-1 sm:p-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase">Fiili Çalışma</span>
            <span className="font-extrabold text-emerald-950 text-xs sm:text-[11px] block">
              {countN} Gün
            </span>
            <span className="text-[8px] text-slate-600 block">{(countN * 7.5).toFixed(1)} Saat</span>
          </div>

          <div className="p-1 sm:p-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase">Hafta Tatili</span>
            <span className="font-extrabold text-purple-950 text-xs sm:text-[11px] block">
              {countHT} Gün
            </span>
            <span className="text-[8px] text-purple-700 block">Kanuni İzin</span>
          </div>

          <div className="p-1 sm:p-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase">Resmi Tatil</span>
            <span className="font-extrabold text-red-950 text-xs sm:text-[11px] block">
              {countRT} Gün
            </span>
            <span className="text-[8px] text-red-700 block">UBGT</span>
          </div>

          <div className="p-1 sm:p-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase">Ücretli İzin</span>
            <span className="font-extrabold text-teal-950 text-xs sm:text-[11px] block">
              {paidLeaveDays} Gün
            </span>
            <span className="text-[8px] text-teal-700 block">Yıllık / Mazeret</span>
          </div>

          <div className="p-1 sm:p-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase">Sıhhi Rapor</span>
            <span className="font-extrabold text-amber-950 text-xs sm:text-[11px] block">
              {countR} Gün
            </span>
            <span className="text-[8px] text-amber-700 block">
              {countR <= 2 ? "Ücretli" : `${countR - 2}g Kesinti`}
            </span>
          </div>

          <div className="p-1 sm:p-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase">Eksik Gün</span>
            <span className={`font-black text-xs sm:text-[11px] block ${unpaidDays > 0 ? "text-rose-700" : "text-slate-700"}`}>
              {unpaidDays} Gün
            </span>
            <span className="text-[8px] text-slate-600 block">Ücretsiz İzin</span>
          </div>

          <div className="p-1 sm:p-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase">Fazla Mesai</span>
            <span className="font-black text-indigo-950 text-xs sm:text-[11px] block">
              {totalOtHours} Saat
            </span>
            <span className="text-[8px] text-indigo-700 block">%50-%100 Zamlı</span>
          </div>

          <div className="p-1 sm:p-1.5 bg-purple-50/80">
            <span className="block text-[9px] font-bold text-purple-900 uppercase">SGK Prim</span>
            <span className="font-black text-purple-950 text-xs sm:text-[11px] block">
              {sgkDays} Gün
            </span>
            <span className="text-[8px] text-purple-700 font-bold block">SPEK Esas</span>
          </div>
        </div>
      )}

      {/* 3. Puantaj Günlük Tablosu (Landscape: 31 Sütunlu Tek Şerit; Portrait: 2 Sıralı) */}
      <div className="p-1 sm:p-2 bg-white overflow-x-auto print:p-0 print:overflow-hidden">
        {isLandscape ? (
          /* Landscape A4: Tek parça 31 sütunlu genişletilmiş, ferah ve okunur puantaj cetveli */
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-center border-collapse border border-slate-300 print:w-full">
              <colgroup>
                <col className="w-[54px] print:w-[46px]" />
                {daysList.map((d) => (
                  <col key={`col-${d.dayNum}`} />
                ))}
              </colgroup>
              <thead>
                {/* 1. Başlık Satırı: Gün Numaraları */}
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <th className="py-1 sm:py-1.5 px-1 border-r border-slate-300 text-left pl-1.5 text-[8px] sm:text-[9px] print:text-[7.5px] uppercase font-black tracking-tight align-middle whitespace-nowrap bg-slate-200/70">
                    GÜN NO
                  </th>
                  {daysList.map((d) => (
                    <th
                      key={`h-day-${d.dayNum}`}
                      className={`py-1 sm:py-1.5 px-0.5 border-r border-slate-200 text-center font-black text-[9px] sm:text-[10px] print:text-[8px] align-middle leading-tight ${
                        d.isWeekend ? "bg-purple-100 text-purple-950 font-black" : "text-slate-900"
                      }`}
                    >
                      {d.dayNum}
                    </th>
                  ))}
                </tr>

                {/* 2. Başlık Satırı: Gün Adları (Pzt, Sal, Çar...) */}
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-300">
                  <th className="py-1 px-1 border-r border-slate-300 text-left pl-1.5 text-[7.5px] sm:text-[8.5px] print:text-[7px] uppercase font-bold tracking-tight align-middle whitespace-nowrap bg-slate-100">
                    GÜN ADI
                  </th>
                  {daysList.map((d) => (
                    <th
                      key={`h-name-${d.dayNum}`}
                      className={`py-1 px-0.5 border-r border-slate-200 text-center text-[7.5px] sm:text-[8.5px] print:text-[7px] font-semibold align-middle leading-tight ${
                        d.isWeekend ? "bg-purple-50 text-purple-900 font-bold" : "text-slate-600"
                      }`}
                    >
                      {d.dayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 3. Gövde Satırı: Puantaj Kodu Rozeti (DURUM) */}
                <tr className="border-b border-slate-300 bg-white">
                  <td className="py-1.5 px-1 border-r border-slate-300 text-left pl-1.5 font-bold text-slate-800 text-[8px] sm:text-[9px] print:text-[7.5px] bg-slate-50 uppercase whitespace-nowrap align-middle">
                    DURUM
                  </td>
                  {daysList.map((d) => {
                    return (
                      <td
                        key={`b-code-${d.dayNum}`}
                        className={`py-1 sm:py-1.5 px-0.5 border-r border-slate-200 font-black text-center align-middle ${d.cfg.bgClass}`}
                        title={`${d.dayNum} ${monthName} (${d.dayName}): ${d.cfg.label}${d.holiday ? ` - ${d.holiday}` : ""}`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] print:w-[14px] print:h-[14px] text-[7.5px] sm:text-[8.5px] print:text-[7px] font-black text-white rounded-xs leading-none shadow-2xs mx-auto ${
                            d.code === "N"
                              ? "bg-emerald-600"
                              : d.code === "HT"
                              ? "bg-purple-600"
                              : d.code === "RT"
                              ? "bg-red-600"
                              : d.code === "Yİ"
                              ? "bg-teal-600"
                              : d.code === "Üİ"
                              ? "bg-blue-600"
                              : d.code === "Dİ"
                              ? "bg-sky-600"
                              : d.code === "R"
                              ? "bg-amber-600"
                              : "bg-rose-600"
                          }`}
                        >
                          {d.code}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Gövde Satırı: Mesai & Çalışma Saati veya Tatil Bilgisi (MESAİ) */}
                <tr className="bg-slate-50/70 border-b border-slate-300">
                  <td className="py-1 px-1 border-r border-slate-300 text-left pl-1.5 font-bold text-slate-800 bg-slate-100 text-[8px] sm:text-[9px] print:text-[7.5px] uppercase whitespace-nowrap align-middle">
                    MESAİ
                  </td>
                  {daysList.map((d) => {
                    if (d.otHours > 0) {
                      return (
                        <td
                          key={`b-ot-${d.dayNum}`}
                          className="py-1 px-0.5 border-r border-slate-200 font-black text-purple-950 bg-purple-50 text-center align-middle text-[8px] sm:text-[9px] print:text-[7.5px] leading-tight"
                          title={`+${d.otHours} saat fazla mesai`}
                        >
                          <span className="inline-block bg-purple-200/80 text-purple-950 font-black px-0.5 rounded-xs">
                            +{d.otHours}
                          </span>
                        </td>
                      );
                    }
                    if (d.isHolOt) {
                      return (
                        <td
                          key={`b-ot-${d.dayNum}`}
                          className="py-1 px-0.5 border-r border-slate-200 font-black text-red-950 bg-red-50 text-center align-middle text-[7.5px] sm:text-[8px] print:text-[7px] leading-tight"
                          title="Resmi tatil tam gün fiili mesai"
                        >
                          <span className="inline-block bg-red-200/80 text-red-950 font-black px-0.5 rounded-xs">
                            UBGT
                          </span>
                        </td>
                      );
                    }
                    if (d.holiday) {
                      return (
                        <td
                          key={`b-ot-${d.dayNum}`}
                          className="py-1 px-0.5 border-r border-slate-200 font-black text-red-700 bg-red-50/40 text-center align-middle text-[9px] print:text-[8px] leading-tight"
                          title={d.holiday}
                        >
                          ★
                        </td>
                      );
                    }
                    if (d.code === "N") {
                      return (
                        <td
                          key={`b-ot-${d.dayNum}`}
                          className="py-1 px-0.5 border-r border-slate-200 text-slate-700 font-semibold text-center align-middle text-[8px] sm:text-[8.5px] print:text-[7.5px] leading-tight"
                        >
                          7.5
                        </td>
                      );
                    }
                    return (
                      <td
                        key={`b-ot-${d.dayNum}`}
                        className="py-1 px-0.5 border-r border-slate-200 text-slate-400 font-bold text-center align-middle text-[8.5px] leading-tight"
                      >
                        ·
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* Portrait A4: 2 dengeli sıraya bölünmüş kompakt puantaj cetveli */
          <div className="space-y-1.5">
            {/* 1. Sıra: 1 - 16. günler */}
            <table className="w-full text-center border-collapse text-[9px] border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-0.5 border-r border-slate-300 w-12 text-left pl-1 text-[8px] uppercase">Gün</th>
                  {daysList.slice(0, 16).map((d) => (
                    <th
                      key={`p1-day-${d.dayNum}`}
                      className={`p-0.5 border-r border-slate-200 font-black text-[9px] ${
                        d.isWeekend ? "bg-purple-100 text-purple-950" : "text-slate-800"
                      }`}
                    >
                      {d.dayNum}
                      <span className="block text-[7.5px] font-normal text-slate-500">{d.dayName}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 h-6">
                  <td className="p-0.5 border-r border-slate-300 text-left pl-1 font-bold text-slate-700 text-[8px] bg-slate-50">
                    Kod
                  </td>
                  {daysList.slice(0, 16).map((d) => (
                    <td key={`p1-code-${d.dayNum}`} className={`p-0.5 border-r border-slate-200 font-black ${d.cfg.bgClass}`}>
                      <span
                        className={`inline-block w-4 h-4 leading-4 text-center rounded text-[8px] font-black text-white ${
                          d.code === "N"
                            ? "bg-emerald-600"
                            : d.code === "HT"
                            ? "bg-purple-600"
                            : d.code === "RT"
                            ? "bg-red-600"
                            : d.code === "Yİ"
                            ? "bg-teal-600"
                            : d.code === "Üİ"
                            ? "bg-blue-600"
                            : d.code === "Dİ"
                            ? "bg-sky-600"
                            : d.code === "R"
                            ? "bg-amber-600"
                            : "bg-rose-600"
                        }`}
                      >
                        {d.code}
                      </span>
                      {d.otHours > 0 && <span className="block text-[7px] text-purple-950 font-bold">+{d.otHours}s</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* 2. Sıra: 17 - Son gün */}
            <table className="w-full text-center border-collapse text-[9px] border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-0.5 border-r border-slate-300 w-12 text-left pl-1 text-[8px] uppercase">Gün</th>
                  {daysList.slice(16).map((d) => (
                    <th
                      key={`p2-day-${d.dayNum}`}
                      className={`p-0.5 border-r border-slate-200 font-black text-[9px] ${
                        d.isWeekend ? "bg-purple-100 text-purple-950" : "text-slate-800"
                      }`}
                    >
                      {d.dayNum}
                      <span className="block text-[7.5px] font-normal text-slate-500">{d.dayName}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 h-6">
                  <td className="p-0.5 border-r border-slate-300 text-left pl-1 font-bold text-slate-700 text-[8px] bg-slate-50">
                    Kod
                  </td>
                  {daysList.slice(16).map((d) => (
                    <td key={`p2-code-${d.dayNum}`} className={`p-0.5 border-r border-slate-200 font-black ${d.cfg.bgClass}`}>
                      <span
                        className={`inline-block w-4 h-4 leading-4 text-center rounded text-[8px] font-black text-white ${
                          d.code === "N"
                            ? "bg-emerald-600"
                            : d.code === "HT"
                            ? "bg-purple-600"
                            : d.code === "RT"
                            ? "bg-red-600"
                            : d.code === "Yİ"
                            ? "bg-teal-600"
                            : d.code === "Üİ"
                            ? "bg-blue-600"
                            : d.code === "Dİ"
                            ? "bg-sky-600"
                            : d.code === "R"
                            ? "bg-amber-600"
                            : "bg-rose-600"
                        }`}
                      >
                        {d.code}
                      </span>
                      {d.otHours > 0 && <span className="block text-[7px] text-purple-950 font-bold">+{d.otHours}s</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Legend / Gösterge Şeridi */}
      <div className="bg-slate-50 border-t border-slate-200 px-2.5 py-1 flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 text-[8px] sm:text-[8.5px] text-slate-700 print:text-[7px] print:py-0.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-medium">
          <span className="font-bold text-slate-800 uppercase tracking-tight">KODLAR:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block shadow-2xs"></span>
            <strong>N:</strong> Normal (7.5s)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-purple-600 inline-block shadow-2xs"></span>
            <strong>HT:</strong> Hafta Tatili
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block shadow-2xs"></span>
            <strong>RT:</strong> Resmi Tatil (UBGT)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 inline-block shadow-2xs"></span>
            <strong>Yİ:</strong> Yıllık İzin
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block shadow-2xs"></span>
            <strong>Üİ:</strong> Ücretli İzin
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block shadow-2xs"></span>
            <strong>Dİ:</strong> Mazeret/Diğer
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block shadow-2xs"></span>
            <strong>R:</strong> Sıhhi Rapor
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block shadow-2xs"></span>
            <strong>M:</strong> Eksik/Ücretsiz
          </span>
        </div>

        <div className="italic text-slate-500 font-normal text-[7.5px] print:text-[6.5px]">
          * 4857 S.K. Md. 63 & 67 gereğince puantaj kayıtları bordroya esastır.
        </div>
      </div>
    </div>
  );
};
