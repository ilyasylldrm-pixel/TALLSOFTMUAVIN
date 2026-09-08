import React from "react";
import { Employee, CompanySettings, PayrollRecord, DayPuantajDetail } from "../types";
import { formatCurrency, formatDate } from "../utils/exportUtils";

interface MissingDayFormProps {
  companySettings: CompanySettings;
  employee: Employee;
  record: PayrollRecord;
  monthStr: string;
  puantajDays?: Record<number, DayPuantajDetail>;
  showSignatures?: boolean;
}

interface DeductionFormProps {
  companySettings: CompanySettings;
  employee: Employee;
  record: PayrollRecord;
  monthStr: string;
  showSignatures?: boolean;
}

const MONTH_NAMES_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const MISSING_DAY_CODE_DESCRIPTIONS: Record<string, string> = {
  "01": "01 - İstirahat / Geçici İş Göremezlik Raporu",
  "03": "03 - Disiplin Cezası",
  "04": "04 - Gözaltına Alınma / Tutukluluk",
  "05": "05 - Kısmi Süreli Çalışma (Part-Time)",
  "06": "06 - Fesih Tarihinde Çalışmamış",
  "07": "07 - Puantaj Kayıtları",
  "08": "08 - Grev",
  "09": "09 - Lokavt",
  "10": "10 - Genel Hayatı Etkileyen Olaylar",
  "11": "11 - Doğal Afet",
  "12": "12 - Yarım Çalışma Ödeneği",
  "13": "13 - Diğer Nedenler",
  "15": "15 - Devamsızlık",
  "16": "16 - Fesih / Sözleşme Askısı",
  "17": "17 - Ev Hizmetlerinde 30 Günden Az Çalışma",
  "18": "18 - Kısa Çalışma Ödeneği",
  "19": "19 - Ücretsiz Doğum İzni",
  "20": "20 - Ücretsiz Yol İzni",
  "21": "21 - Diğer Ücretsiz İzin",
  "22": "22 - 5434 Sayılı Kanun Ek 76",
  "25": "25 - Diğer Ücretsiz İzin (Toplu İş Sözleşmesi)",
};

/**
 * 1. T.C. SOSYAL GÜVENLİK KURUMU EKSİK GÜN BİLDİRİM VE TESPİT FORMU
 * 5510 Sayılı Kanun Md. 86 ve Sosyal Sigorta İşlemleri Yönetmeliği uyarınca resmi ek belge
 */
export const MissingDayNotificationForm: React.FC<MissingDayFormProps> = ({
  companySettings,
  employee,
  record,
  monthStr,
  puantajDays,
  showSignatures = true,
}) => {
  const [yearStr, mStr] = (monthStr || record.monthYear || "2026-07").split("-");
  const year = parseInt(yearStr, 10) || 2026;
  const monthNum = parseInt(mStr, 10) || 7;
  const monthName = MONTH_NAMES_TR[monthNum - 1] || "Temmuz";

  const missingDaysCount = record.unpaidLeaveDays || 0;
  const missingDayCode = record.missingDayCode || "21";
  const missingDayCodeLabel =
    MISSING_DAY_CODE_DESCRIPTIONS[missingDayCode] ||
    `${missingDayCode} - Eksik Gün Nedeni`;

  const reasonDetail =
    record.missingDayReason ||
    "Personelin yazılı ücretsiz izin / mazeret talebi doğrultusunda onaylanan devamsızlık günleri.";

  // Extract specific missing day dates from puantaj
  const missingDayDates: string[] = [];
  if (puantajDays) {
    Object.entries(puantajDays).forEach(([dayNumStr, detail]: [string, any]) => {
      if (detail && (detail.code === "M" || detail.code === "Üİ")) {
        const dNum = parseInt(dayNumStr, 10);
        const padDay = dNum < 10 ? `0${dNum}` : `${dNum}`;
        const padMonth = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
        missingDayDates.push(`${padDay}.${padMonth}.${year}`);
      }
    });
  }

  return (
    <div
      id={`missing-day-form-${employee.id}`}
      className="page-break-always print:page-break-before bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-300 text-slate-900 print:shadow-none print:border-0 print:p-0 mt-8"
    >
      {/* Üst Resmi SGK Anteti */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="inline-block bg-rose-900 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider mb-1">
            SGK RESMİ EKLERİ · 5510 S.K. MD. 86
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
            T.C. SOSYAL GÜVENLİK KURUMU EKSİK GÜN BİLDİRİM VE TESPİT FORMU
          </h1>
          <p className="text-xs text-slate-600">
            Aylık Prim ve Hizmet Beyannamesi / Muhtasar ve Prim Hizmet Beyannamesi Tevsik Edici Eki
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="text-xs font-black text-slate-900">
            DÖNEM: {monthName.toUpperCase()} {year}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
            Form Düzenleme Tarihi: {formatDate(new Date())}
          </div>
          <div className="text-[10px] text-rose-700 font-extrabold mt-1">
            Toplam Eksik Gün: {missingDaysCount} GÜN
          </div>
        </div>
      </div>

      {/* 1. Bölüm: İşyeri & İşveren Bilgileri */}
      <div className="mb-4">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mb-2">
          1. İŞYERİ VE İŞVEREN BİLGİLERİ
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <div>
            <span className="text-[10px] text-slate-500 block">İşyeri Sicil No:</span>
            <span className="font-mono font-bold text-slate-900">
              {companySettings.sgkCredentials?.workplaceRegistrationNo || "SGK-SİCİL-GİRİLMEMİŞ"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">İşveren / Şirket Ünvanı:</span>
            <span className="font-bold text-slate-900 truncate block">
              {companySettings.companyTitle || companySettings.companyName || "ŞİRKET ÜNVANI"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Vergi Dairesi / VKN:</span>
            <span className="font-bold text-slate-900">
              {companySettings.taxOffice || "—"} / {companySettings.taxNumber || "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">İşyeri Adresi & İl:</span>
            <span className="font-medium text-slate-800 truncate block">
              {companySettings.address} {companySettings.city}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Bölüm: Sigortalı Çalışan Bilgileri */}
      <div className="mb-4">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mb-2">
          2. SİGORTALI ÇALIŞAN BİLGİLERİ
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <div>
            <span className="text-[10px] text-slate-500 block">T.C. Kimlik No:</span>
            <span className="font-mono font-black text-slate-950 text-sm">
              {employee.tckn}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Sigortalı Adı Soyadı:</span>
            <span className="font-bold text-slate-900 text-sm">{employee.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">SGK Sicil No:</span>
            <span className="font-mono font-medium text-slate-800">
              {employee.sgkNo || employee.tckn}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Departman & Görev:</span>
            <span className="font-medium text-slate-800 truncate block">
              {employee.department} · {employee.title}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">İşe Giriş Tarihi:</span>
            <span className="font-medium text-slate-800">{formatDate(employee.startDate)}</span>
          </div>
        </div>
      </div>

      {/* 3. Bölüm: Eksik Gün Tespit ve Gerekçe Ayrıntıları */}
      <div className="mb-4">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mb-2">
          3. EKSİK GÜN TESPİTİ VE YASAL NEDEN DETAYLARI
        </h2>
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-rose-50/40">
                <td className="p-2.5 font-bold text-slate-700 w-1/3 border-r border-slate-200">
                  Eksik Gün Sayısı:
                </td>
                <td className="p-2.5 font-black text-rose-900 text-sm">
                  {missingDaysCount} GÜN (İlgili Ay İçinde Çalışılmayan Gün Sayısı)
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">
                  SGK Eksik Gün Kodu & Tanımı:
                </td>
                <td className="p-2.5 font-bold text-slate-900">
                  <span className="inline-block bg-slate-900 text-white font-mono px-2 py-0.5 rounded text-[11px] mr-2">
                    Kod: {missingDayCode}
                  </span>
                  <span>{missingDayCodeLabel}</span>
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">
                  Eksik Gün Gerekçesi / Açıklaması:
                </td>
                <td className="p-2.5 text-slate-900 font-medium italic">
                  "{reasonDetail}"
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">
                  Tespit Edilen Tarihler:
                </td>
                <td className="p-2.5 text-slate-800">
                  {missingDayDates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {missingDayDates.map((dt, idx) => (
                        <span
                          key={idx}
                          className="bg-rose-100 text-rose-900 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-rose-200"
                        >
                          {dt}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      {monthName} {year} dönemi puantaj kayıtları uyarınca toplam {missingDaysCount} gün.
                    </span>
                  )}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">
                  Ücretten Yapılan Kesinti Tutarı:
                </td>
                <td className="p-2.5 font-black text-slate-900">
                  {formatCurrency(record.unpaidLeaveDeduction || 0, "TRY")}
                  <span className="text-[11px] text-slate-500 font-normal ml-2">
                    (Brüt yevmiye x {missingDaysCount} gün esas alınarak bordroya yansıtılmıştır)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">
                  Tevsik Edici Kanıtlayıcı Belgeler:
                </td>
                <td className="p-2.5 text-slate-700 text-[11px]">
                  ✓ İmzalı Personel İzin / Mazeret Talep Formu · ✓ Aylık Puantaj Çizelgesi · ✓ Şirket İK İzin Onayı
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Yasal Uyarı Metni */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1 mb-6">
        <p className="font-bold text-slate-800">YASAL DAYANAK VE BEYAN:</p>
        <p>
          5510 Sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu'nun 86. maddesi ile Sosyal Sigorta
          İşlemleri Yönetmeliği uyarınca; yukarıda kimlik bilgileri yazılı sigortalının {monthName} {year}
          döneminde çalışmadığı günlerin işbu bildirim formu ve ekindeki tevsik edici yasal belgelerle
          sabit olduğu tasdik olunur.
        </p>
      </div>

      {/* İmzalar */}
      {showSignatures && (
        <div className="border-t border-slate-300 pt-3">
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">İŞVEREN / VEKİLİ ONAYI</span>
                <span className="text-[10px] text-slate-500">
                  {companySettings.companyTitle || companySettings.companyName}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-6">Şirket Kaşesi / Yetkili Islak İmza</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">SİGORTALI ÇALIŞAN TEBELLÜĞ BEYANI</span>
                <span className="text-[10px] text-slate-600 font-bold">{employee.fullName} (T.C.: {employee.tckn})</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Eksik gün nedenini ve kesintiyi tebellüğ ettim.
              </div>
              <div className="text-[10px] text-slate-400 mt-2">İmza / Tarih: ..... / ..... / {year}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 2. PERSONEL ÜCRET KESİNTİ VE AVANS MAHSUP BİLDİRİM FORMU (MUVAFAKATNAME)
 * 4857 Sayılı İş Kanunu Md. 38, 59 ve 62 uyarınca resmi muvafakat ve tevsik belgesi
 */
export const DeductionAuthorizationForm: React.FC<DeductionFormProps> = ({
  companySettings,
  employee,
  record,
  monthStr,
  showSignatures = true,
}) => {
  const [yearStr, mStr] = (monthStr || record.monthYear || "2026-07").split("-");
  const year = parseInt(yearStr, 10) || 2026;
  const monthNum = parseInt(mStr, 10) || 7;
  const monthName = MONTH_NAMES_TR[monthNum - 1] || "Temmuz";

  const advanceDed = record.advanceDeduction || 0;
  const executionDed = record.executionDeduction || 0;
  const alimonyDed = record.alimonyDeduction || 0;
  const otherDed = record.otherDeductions || 0;
  const besDed = record.besDeduction || 0;
  const totalDeductions = advanceDed + executionDed + alimonyDed + otherDed + besDed;

  return (
    <div
      id={`deduction-form-${employee.id}`}
      className="page-break-always print:page-break-before bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-300 text-slate-900 print:shadow-none print:border-0 print:p-0 mt-8"
    >
      {/* Üst Başlık */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="inline-block bg-amber-800 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider mb-1">
            4857 S.K. MD. 38 & MD. 62 · YASAL MUVAFAKATNAME
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
            PERSONEL ÜCRET KESİNTİ VE AVANS MAHSUP BİLDİRİM FORMU
          </h1>
          <p className="text-xs text-slate-600">
            Maaş Hakedişinden Yapılan Yasal ve Özel Mahsupların Döküm ve Muvafakat Belgesi
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="text-xs font-black text-slate-900">
            BORDRO DÖNEMİ: {monthName.toUpperCase()} {year}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
            Tanzim Tarihi: {formatDate(new Date())}
          </div>
          <div className="text-xs font-black text-amber-900 mt-1">
            Toplam Kesinti: {formatCurrency(totalDeductions, "TRY")}
          </div>
        </div>
      </div>

      {/* 1. Bölüm: Taraflar (İşveren ve Personel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">İŞVEREN BİLGİLERİ</span>
          <div className="font-bold text-slate-900 text-sm">
            {companySettings.companyTitle || companySettings.companyName || "ŞİRKET ÜNVANI"}
          </div>
          <div className="text-slate-600 mt-1">
            VKN: {companySettings.taxNumber} · SGK İşyeri No: {companySettings.sgkCredentials?.workplaceRegistrationNo || "—"}
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">
            {companySettings.address} {companySettings.city}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">ÇALIŞAN / PERSONEL BİLGİLERİ</span>
          <div className="font-black text-slate-900 text-sm">
            {employee.fullName}
          </div>
          <div className="text-slate-700 mt-1 font-mono">
            T.C. Kimlik No: <strong>{employee.tckn}</strong>
          </div>
          <div className="text-slate-600 text-[11px] mt-0.5">
            Görev: {employee.department} · {employee.title} | Giriş: {formatDate(employee.startDate)}
          </div>
        </div>
      </div>

      {/* 2. Bölüm: Kesinti ve Avans Mahsup Kalemleri Tablosu */}
      <div className="mb-4">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mb-2">
          KESİNTİ VE AVANS MAHSUP DÖKÜM TABLOSU
        </h2>
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase">
                <th className="p-2 border-r border-slate-700 w-12 text-center">S.No</th>
                <th className="p-2 border-r border-slate-700">Kesinti Türü</th>
                <th className="p-2 border-r border-slate-700">Kesinti Gerekçesi / Açıklaması / Belge No</th>
                <th className="p-2 border-r border-slate-700">Yasal Dayanak</th>
                <th className="p-2 text-right">Kesinti Tutarı (₺)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {advanceDed > 0 && (
                <tr className="bg-amber-50/50">
                  <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">1</td>
                  <td className="p-2 font-bold text-amber-950 border-r border-slate-200">
                    Nakit Avans Mahsubu
                  </td>
                  <td className="p-2 text-slate-800 border-r border-slate-200">
                    {record.advanceReason || "Personelin yazılı avans talebi doğrultusunda bankadan ödenen nakit avansın mahsubu."}
                  </td>
                  <td className="p-2 text-slate-600 border-r border-slate-200 text-[11px]">
                    4857 S.K. Md. 32 (Ücret Avansı)
                  </td>
                  <td className="p-2 text-right font-black text-amber-900">
                    {formatCurrency(advanceDed, "TRY")}
                  </td>
                </tr>
              )}

              {executionDed > 0 && (
                <tr className="bg-rose-50/40">
                  <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">2</td>
                  <td className="p-2 font-bold text-rose-950 border-r border-slate-200">
                    İcra Kesintisi (Haciz)
                  </td>
                  <td className="p-2 text-slate-800 border-r border-slate-200">
                    {record.executionReason || record.deductionReason || "İcra Müdürlüğü Haciz Müzekkeresi uyarınca maaşın 1/4 yasal kesintisi."}
                  </td>
                  <td className="p-2 text-slate-600 border-r border-slate-200 text-[11px]">
                    İİK Md. 83 (1/4 Yasal Sınır)
                  </td>
                  <td className="p-2 text-right font-black text-rose-900">
                    {formatCurrency(executionDed, "TRY")}
                  </td>
                </tr>
              )}

              {alimonyDed > 0 && (
                <tr className="bg-purple-50/40">
                  <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">3</td>
                  <td className="p-2 font-bold text-purple-950 border-r border-slate-200">
                    Nafaka Kesintisi
                  </td>
                  <td className="p-2 text-slate-800 border-r border-slate-200">
                    {record.alimonyReason || record.deductionReason || "Aile Mahkemesi Tedbir / İştirak / Yoksulluk Nafakası İlamı gereği kesinti."}
                  </td>
                  <td className="p-2 text-slate-600 border-r border-slate-200 text-[11px]">
                    TMK Md. 175-182 (Öncelikli Alacak)
                  </td>
                  <td className="p-2 text-right font-black text-purple-900">
                    {formatCurrency(alimonyDed, "TRY")}
                  </td>
                </tr>
              )}

              {otherDed > 0 && (
                <tr className="bg-slate-50/70">
                  <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">4</td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                    Diğer Özel Kesintiler
                  </td>
                  <td className="p-2 text-slate-800 border-r border-slate-200">
                    {record.otherReason || record.deductionReason || "Çalışan yazılı mutabakatı veya şirket iç yönetmeliği kapsamındaki kesinti."}
                  </td>
                  <td className="p-2 text-slate-600 border-r border-slate-200 text-[11px]">
                    4857 S.K. Md. 38
                  </td>
                  <td className="p-2 text-right font-black text-slate-900">
                    {formatCurrency(otherDed, "TRY")}
                  </td>
                </tr>
              )}

              {besDed > 0 && (
                <tr>
                  <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">5</td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                    BES (%3) Kesintisi
                  </td>
                  <td className="p-2 text-slate-800 border-r border-slate-200">
                    {record.besReason || "Otomatik Katılımlı Bireysel Emeklilik Sistemi yasal katkı payı."}
                  </td>
                  <td className="p-2 text-slate-600 border-r border-slate-200 text-[11px]">
                    4632 S.K. Ek Md. 2
                  </td>
                  <td className="p-2 text-right font-bold text-slate-900">
                    {formatCurrency(besDed, "TRY")}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-xs">
                <td colSpan={4} className="p-2.5 text-right border-r border-slate-700">
                  TOPLAM KESİNTİ VE MAHSUP TUTARI:
                </td>
                <td className="p-2.5 text-right text-amber-300 text-sm">
                  {formatCurrency(totalDeductions, "TRY")}
                </td>
              </tr>
              <tr className="bg-emerald-950 text-white font-black text-xs">
                <td colSpan={4} className="p-2.5 text-right border-r border-emerald-800">
                  KESİNTİLER SONRASI NET ÖDENECEK MAAŞ TUTARI:
                </td>
                <td className="p-2.5 text-right text-emerald-300 text-base">
                  {formatCurrency(record.payableNetSalary || record.netSalary, "TRY")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Muvafakat ve Tebellüğ Metni */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1 mb-6">
        <p className="font-bold text-slate-800">ÇALIŞAN MUVAFAKAT VE KABUL BEYANI:</p>
        <p>
          4857 Sayılı İş Kanunu ve 6098 Sayılı Türk Borçlar Kanunu hükümleri dairesinde; yukarıda ayrıntılı dökümü,
          hukuki gerekçesi ve tutarları gösterilen nakit avans mahsubu ile sair kesintilerin {monthName} {year}
          dönemine ait ücretimden tenzil edilmesini, kesintiler sonrasında tahakkuk eden net maaş tutarının
          banka hesabıma yatırılmasını serbest irademle kabul, beyan ve muvafakat ederim.
        </p>
      </div>

      {/* İmzalar */}
      {showSignatures && (
        <div className="border-t border-slate-300 pt-3">
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">İŞVEREN / BORDRO YETKİLİSİ</span>
                <span className="text-[10px] text-slate-500">
                  {companySettings.companyTitle || companySettings.companyName}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-6">Kaşe / Yetkili İmza</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">ÇALIŞAN KABUL VE MUVAFAKAT İMZASI</span>
                <span className="text-[10px] text-slate-700 font-bold">{employee.fullName}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Muvafakatnameyi okudum, bir suretini elden teslim aldım.
              </div>
              <div className="text-[10px] text-slate-400 mt-2">İmza / Tarih: ..... / ..... / {year}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 3. PERSONEL MAAŞ AVANSI TALEP VE MAHSUP MAKBUZU
 * 4857 Sayılı İş Kanunu Md. 32 uyarınca resmi avans talep, tahakkuk ve mahsup formu
 */
export interface AdvanceRequestFormProps {
  companySettings: CompanySettings;
  employee: Employee;
  record: PayrollRecord;
  monthStr: string;
  showSignatures?: boolean;
}

export const AdvanceRequestPrintForm: React.FC<AdvanceRequestFormProps> = ({
  companySettings,
  employee,
  record,
  monthStr,
  showSignatures = true,
}) => {
  const [yearStr, mStr] = (monthStr || record.monthYear || "2026-07").split("-");
  const year = parseInt(yearStr, 10) || 2026;
  const monthNum = parseInt(mStr, 10) || 7;
  const monthName = MONTH_NAMES_TR[monthNum - 1] || "Temmuz";
  const advanceAmount = record.advanceDeduction || 0;
  const advanceReason = record.advanceReason || "Personelin yazılı avans talebi doğrultusunda bankadan ödenen nakit maaş avansı";

  return (
    <div
      id={`advance-request-form-${employee.id}`}
      className="page-break-always print:page-break-before bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-300 text-slate-900 print:shadow-none print:border-0 print:p-0 mt-8"
    >
      {/* Üst Antet */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="inline-block bg-amber-800 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider mb-1">
            4857 S.K. MD. 32 · RESMİ EVRAK EKLERİ
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
            PERSONEL MAAŞ AVANSI TALEP VE MAHSUP MAKBUZU
          </h1>
          <p className="text-xs text-slate-600">
            Maaş Hakedişinden Mahsup Edilmek Üzere Ödenen Avans Dilekçesi ve Muvafakat Belgesi
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="text-xs font-black text-slate-900">
            MAHSUP AYI: {monthName.toUpperCase()} {year}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
            Tanzim Tarihi: {formatDate(new Date())}
          </div>
          <div className="text-xs font-black text-amber-900 mt-1">
            Avans Tutarı: {formatCurrency(advanceAmount, "TRY")}
          </div>
        </div>
      </div>

      {/* İşveren & Personel Tablosu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">İŞVEREN ŞİRKET BİLGİLERİ</span>
          <div className="font-bold text-slate-900 text-sm">
            {companySettings.companyTitle || companySettings.companyName || "ŞİRKET ÜNVANI"}
          </div>
          <div className="text-slate-600 mt-1">
            VKN: {companySettings.taxNumber} · SGK No: {companySettings.sgkCredentials?.workplaceRegistrationNo || "—"}
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">
            {companySettings.address} {companySettings.city}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">TALEPTE BULUNAN ÇALIŞAN</span>
          <div className="font-black text-slate-900 text-sm">
            {employee.fullName}
          </div>
          <div className="text-slate-700 mt-1 font-mono">
            T.C. Kimlik: <strong>{employee.tckn}</strong> · SGK Sicil: {employee.sgkNo || employee.tckn}
          </div>
          <div className="text-slate-600 text-[11px] mt-0.5">
            Bölüm: {employee.department} · Görev: {employee.title} | IBAN: {employee.iban || "Kayıtlı Banka Hesabı"}
          </div>
        </div>
      </div>

      {/* Avans Talep Ayrıntıları */}
      <div className="mb-4">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mb-2">
          AVANS TALEP VE MAHSUP DETAYLARI
        </h2>
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 font-bold text-slate-700 w-1/3 bg-slate-50 border-r border-slate-200">
                  Talep Edilen Avans Türü:
                </td>
                <td className="p-2.5 font-bold text-slate-900">
                  Maaş / Ücret Avansı (4857 S.K. Md. 32)
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                  Avans Tutarı:
                </td>
                <td className="p-2.5 font-black text-amber-900 text-sm">
                  {formatCurrency(advanceAmount, "TRY")}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                  Mahsup Edileceği Bordro Dönemi:
                </td>
                <td className="p-2.5 font-bold text-slate-900">
                  {monthName} {year} Dönemi Maaş Hakedişi
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                  Avans Talep Nedeni / Gerekçesi:
                </td>
                <td className="p-2.5 text-slate-800 font-medium">
                  {advanceReason}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                  Ödeme Yöntemi:
                </td>
                <td className="p-2.5 text-slate-800">
                  Banka Havalesi / EFT ({employee.bankName || "Maaş Bankası"} · {employee.iban || "Personel Maaş Hesabı"})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Avans Mahsup Taahhütnamesi */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-amber-950 space-y-1.5 mb-6">
        <p className="font-black text-amber-900 uppercase">AVANS TAAHHÜT VE MAHSUP MUVAFAKATNAMESİ:</p>
        <p>
          Şirketinizden yukarıda belirtilen gerekçe ile talep ettiğim <strong>{formatCurrency(advanceAmount, "TRY")}</strong> tutarındaki
          avans bedelini eksiksiz teslim aldığımı / banka hesabıma aktarılacağını; söz konusu tutarın <strong>{monthName} {year}</strong> ayı
          maaş hesabımdan (ücret bordromdan) defaten kesilerek mahsup edilmesini, herhangi bir nedenle iş akdimin sona ermesi halinde
          ise kıdem, ihbar, yıllık izin veya son hakedişimden tenzil edilmesini peşinen gayrikabili rücu kabul, beyan ve taahhüt ederim.
        </p>
      </div>

      {/* İmzalar */}
      {showSignatures && (
        <div className="border-t border-slate-300 pt-3">
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">ŞİRKET YETKİLİSİ / ONAYLAYAN</span>
                <span className="text-[10px] text-slate-500">
                  {companySettings.companyTitle || companySettings.companyName}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-6">İmza / Kaşe</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">AVANSI TALEP EDEN ÇALIŞAN</span>
                <span className="text-[10px] text-slate-700 font-bold">{employee.fullName}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Okudum, anladım, avansı teslim aldım.
              </div>
              <div className="text-[10px] text-slate-400 mt-2">İmza / Tarih: ..... / ..... / {year}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

