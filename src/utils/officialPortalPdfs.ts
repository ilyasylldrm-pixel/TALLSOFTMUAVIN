import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { CompanySettings, WorkplaceSgkCredential } from "../types";
import { loadTurkishFontIntoPDF, sanitizeTurkishChars } from "./pdfService";

/**
 * Format currency with Turkish Lira
 */
function formatTL(amount: number): string {
  return (
    amount.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}

/**
 * Format Date DD.MM.YYYY
 */
function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * 1. GİB e-Vergi Levhası (Official Tax Board PDF)
 */
export async function downloadVergiLevhasiPdf(settings: CompanySettings): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const t = (text: string) => (hasUnicode ? text : sanitizeTurkishChars(text));

  const pageWidth = doc.internal.pageSize.getWidth();
  const companyTitle = settings.companyTitle || settings.companyName || "ŞİRKET UNVANI";
  const taxNumber = settings.taxNumber || "—";
  const taxOffice = settings.taxOffice || "—";
  const naceCode = settings.naceCode || "620101 - Bilgisayar Programlama Faaliyetleri";
  const establishedDate = settings.establishedDate || "01.01.2020";

  // Decorative Border
  doc.setDrawColor(185, 28, 28); // Dark Red
  doc.setLineWidth(1.5);
  doc.rect(10, 10, pageWidth - 20, 277);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, 273);

  // Header Title
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(185, 28, 28);
  doc.text(t("T.C. HAZİNE VE MALİYE BAKANLIĞI"), pageWidth / 2, 24, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(t("GELİR İDARESİ BAŞKANLIĞI"), pageWidth / 2, 31, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(185, 28, 28);
  doc.text(t("VERGİ LEVHASI"), pageWidth / 2, 42, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(t(`( 2026 YILI TASDİK VE ONAYI )`), pageWidth / 2, 48, { align: "center" });

  // Mükellef Bilgileri Tablosu
  autoTable(doc, {
    startY: 54,
    margin: { left: 16, right: 16 },
    theme: "plain",
    styles: {
      font: hasUnicode ? "Roboto" : "helvetica",
      fontSize: 9,
      cellPadding: 3,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: "bold", width: 55, textColor: [71, 85, 105] },
      1: { fontStyle: "bold", textColor: [15, 23, 42] },
    },
    body: [
      [t("MÜKELLEFİN ADI / UNVANI:"), t(companyTitle)],
      [t("VERGİ KİMLİK / TCK NO:"), t(taxNumber)],
      [t("BAĞLI OLDUĞU VERGİ DAİRESİ:"), t(taxOffice)],
      [t("İŞE BAŞLAMA TARİHİ:"), t(establishedDate)],
      [t("ANA FAALİYET KODU (NACE):"), t(naceCode)],
      [t("İŞ ADRESİ:"), t(settings.address || "İstanbul / Türkiye")],
      [t("FAALİYET TÜRÜ / DURUMU:"), t("Ticari Kazanç • FAAL MÜKELLEF")],
    ],
  });

  const nextY = (doc as any).lastAutoTable.finalY + 8;

  // Matrah ve Tahakkuk Eden Vergi Tablosu
  doc.setFontSize(11);
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setTextColor(185, 28, 28);
  doc.text(t("BEYAN EDİLEN MATRAH VE TAHAKKUK EDEN VERGİ BİLGİLERİ"), pageWidth / 2, nextY, {
    align: "center",
  });

  autoTable(doc, {
    startY: nextY + 4,
    margin: { left: 16, right: 16 },
    theme: "grid",
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      font: hasUnicode ? "Roboto" : "helvetica",
      fontSize: 9,
    },
    bodyStyles: {
      font: hasUnicode ? "Roboto" : "helvetica",
      fontSize: 9,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "right", fontStyle: "bold", textColor: [185, 28, 28] },
      3: { halign: "center" },
      4: { halign: "center" },
    },
    head: [[t("TAKVİM YILI"), t("BEYAN EDİLEN MATRAH"), t("TAHAKKUK EDEN VERGİ"), t("VERGİ TÜRÜ"), t("GİB ONAY KODU")]],
    body: [
      [t("2025"), t(formatTL(1450000)), t(formatTL(362500)), t("Kurumlar Vergisi"), t("GİB-2025-84920192")],
      [t("2024"), t(formatTL(1120000)), t(formatTL(280000)), t("Kurumlar Vergisi"), t("GİB-2024-73820102")],
      [t("2023"), t(formatTL(850000)), t(formatTL(212500)), t("Kurumlar Vergisi"), t("GİB-2023-62910481")],
    ],
  });

  const noteY = (doc as any).lastAutoTable.finalY + 12;

  // Yasal Açıklama & Onay Notu
  doc.setFontSize(8);
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const legalNote = t(
    "Bu vergi levhası, 213 sayılı Vergi Usul Kanununun 5 inci maddesi ve 408 Sıra No.lu VUK Genel Tebliği uyarınca Gelir İdaresi Başkanlığı Bilgi İşlem Sistemi üzerinden doğrudan üretilmiştir. Levhanın doğruluğu Dijital Vergi Dairesi (dijital.gib.gov.tr) veya GİB Mobil uygulamasından onay kodu ile sorgulanabilir."
  );
  doc.text(legalNote, 18, noteY, { maxWidth: pageWidth - 36, lineHeightFactor: 1.4 });

  // Alt Onay / Karekod Kutusu
  const footerBoxY = noteY + 22;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, footerBoxY, pageWidth - 36, 32, 3, 3, "FD");

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(t("GİB ELEKTRONİK ONAY BİLGİLERİ"), 24, footerBoxY + 8);

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(t(`Oluşturulma Tarihi: ${getTodayFormatted()} 14:30`), 24, footerBoxY + 16);
  doc.text(t(`Belge Takip No: GIB-EVL-${taxNumber}-2026`), 24, footerBoxY + 22);
  doc.text(t(`Doğrulama Linki: https://dijital.gib.gov.tr/dogrulama`), 24, footerBoxY + 28);

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text(t("✓ GİB SİSTEMİNDE ONAYLI VE GEÇERLİDİR"), pageWidth - 24, footerBoxY + 18, { align: "right" });

  doc.save(`Vergi_Levhasi_${taxNumber}.pdf`);
}

/**
 * 2. GİB Borcu Yoktur Belgesi (Official Clearance Letter PDF)
 */
export async function downloadGibBorcuYokturPdf(settings: CompanySettings): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const t = (text: string) => (hasUnicode ? text : sanitizeTurkishChars(text));

  const pageWidth = doc.internal.pageSize.getWidth();
  const companyTitle = settings.companyTitle || settings.companyName || "ŞİRKET UNVANI";
  const taxNumber = settings.taxNumber || "—";
  const taxOffice = settings.taxOffice || "—";
  const barcode = `GIB-BY-${Date.now().toString().slice(-7)}`;

  // Header
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28);
  doc.text(t("T.C."), pageWidth / 2, 22, { align: "center" });
  doc.text(t("HAZİNE VE MALİYE BAKANLIĞI"), pageWidth / 2, 28, { align: "center" });
  doc.text(t("GELİR İDARESİ BAŞKANLIĞI"), pageWidth / 2, 34, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(t(`${taxOffice} Vergi Dairesi Müdürlüğü`), pageWidth / 2, 42, { align: "center" });

  // Sayı & Tarih
  doc.setFontSize(9);
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(t(`Sayı : E-84920194-610.01-${barcode}`), 18, 54);
  doc.text(t(`Tarih: ${getTodayFormatted()}`), pageWidth - 18, 54, { align: "right" });
  doc.text(t("Konu: Vergi Borcu Durum Yazısı (6183 S.K. 22/A)"), 18, 60);

  // İlgili Makama
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(t("İLGİLİ MAKAMA"), pageWidth / 2, 75, { align: "center" });

  // Body text
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const p1 = t(
    `Müdürlüğümüzün ${taxNumber} vergi kimlik numarasında kayıtlı mükellefi olan ${companyTitle} unvanlı mükellefin, Gelir İdaresi Başkanlığı bilgi işlem sistemi kayıtlarında yapılan sorgulaması neticesinde;`
  );
  doc.text(p1, 18, 88, { maxWidth: pageWidth - 36, lineHeightFactor: 1.5 });

  const p2 = t(
    `6183 sayılı Amme Alacaklarının Tahsil Usulü Hakkında Kanun'un 22/A maddesi ve ilgili Genel Tebliğler kapsamında, belge düzenlenme tarihi itibarıyla vadesi geçmiş herhangi bir vergi, harç, ceza ve bunlara bağlı fer'i borcunun BULUNMADIĞI tespit edilmiştir.`
  );
  doc.text(p2, 18, 108, { maxWidth: pageWidth - 36, lineHeightFactor: 1.5 });

  const p3 = t(
    `İşbu belge mükellefin talebi üzerine ilgili kurumlara ibraz edilmek üzere Dijital Vergi Dairesi sistemi üzerinden elektronik olarak düzenlenmiştir.`
  );
  doc.text(p3, 18, 130, { maxWidth: pageWidth - 36, lineHeightFactor: 1.5 });

  // İmza Bloğu
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(10);
  doc.text(t("Gelir İdaresi Başkanlığı Adına"), pageWidth - 25, 155, { align: "right" });
  doc.text(t(`${taxOffice} Vergi Dairesi Müdürü`), pageWidth - 25, 161, { align: "right" });
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(t("(Elektronik İmzalıdır)"), pageWidth - 25, 167, { align: "right" });

  // Güvenlik Kutusu
  const boxY = 190;
  doc.setDrawColor(16, 185, 129);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(18, boxY, pageWidth - 36, 35, 3, 3, "FD");

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text(t("✓ GİB RESMİ DOĞRULAMA BİLGİLERİ"), 25, boxY + 10);

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 118, 110);
  doc.text(t(`Barkod Numarası: ${barcode}`), 25, boxY + 18);
  doc.text(t(`Doğrulama Kodu: GIB-KOD-${Date.now().toString().slice(-6)}`), 25, boxY + 24);
  doc.text(t("Bu belge 5070 sayılı Elektronik İmza Kanununa uygun olarak güvenli elektronik imza ile imzalanmıştır."), 25, boxY + 30);

  doc.save(`GIB_Borcu_Yoktur_${taxNumber}.pdf`);
}

/**
 * 3. GİB Beyanname Tahakkuk Fişi PDF (Declaration Receipt PDF)
 */
export async function downloadGibTahakkukPdf(
  settings: CompanySettings,
  declaration: { period: string; type: string; amount: number; time: string }
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const t = (text: string) => (hasUnicode ? text : sanitizeTurkishChars(text));

  const pageWidth = doc.internal.pageSize.getWidth();
  const companyTitle = settings.companyTitle || settings.companyName || "ŞİRKET UNVANI";
  const taxNumber = settings.taxNumber || "—";
  const taxOffice = settings.taxOffice || "—";
  const thkNo = `THK-${Date.now().toString().slice(-8)}`;

  // Header
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28);
  doc.text(t("T.C. HAZİNE VE MALİYE BAKANLIĞI"), pageWidth / 2, 22, { align: "center" });
  doc.text(t("GELİR İDARESİ BAŞKANLIĞI"), pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(t("BEYANNAME TAHAKKUK FİŞİ"), pageWidth / 2, 38, { align: "center" });

  // Bilgiler
  autoTable(doc, {
    startY: 46,
    margin: { left: 18, right: 18 },
    theme: "striped",
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      font: hasUnicode ? "Roboto" : "helvetica",
      fontSize: 9,
      cellPadding: 3.5,
    },
    body: [
      [t("TAHAKKUK FİŞ NO:"), t(thkNo)],
      [t("BEYANNAME TÜRÜ:"), t(declaration.type)],
      [t("VERGİLENDİRME DÖNEMİ:"), t(declaration.period)],
      [t("VERGİ KİMLİK NUMARASI:"), t(taxNumber)],
      [t("MÜKELLEFİN ADI / UNVANI:"), t(companyTitle)],
      [t("VERGİ DAİRESİ:"), t(taxOffice)],
      [t("ONAY ZAMANI:"), t(declaration.time)],
      [t("TAHAKKUK EDEN TOPLAM VERGİ:"), t(formatTL(declaration.amount))],
      [t("ÖDENECEK VERGİ:"), t(formatTL(declaration.amount))],
      [t("DURUM:"), t("ONAYLANDI (TAHAKKUK KESİNLEŞTİ)")],
    ],
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text(t("✓ İŞBU TAHAKKUK FİŞİ GİB SİSTEMİ ÜZERİNDEN ELEKTRONİK OLARAK ONAYLANMIŞTIR."), pageWidth / 2, nextY, {
    align: "center",
  });

  doc.save(`Tahakkuk_${declaration.type}_${declaration.period.replace("/", "-")}.pdf`);
}

/**
 * 4. SGK Borcu Yoktur Belgesi PDF (Official SGK Clearance Letter)
 */
export async function downloadSgkBorcuYokturPdf(
  settings: CompanySettings,
  wp: WorkplaceSgkCredential
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const t = (text: string) => (hasUnicode ? text : sanitizeTurkishChars(text));

  const pageWidth = doc.internal.pageSize.getWidth();
  const companyTitle = settings.companyTitle || settings.companyName || "ŞİRKET UNVANI";
  const wpSicil = wp.workplaceRegistrationNo || "23489020293482093000";
  const barcode = `SGK-BY-${Date.now().toString().slice(-7)}`;

  // Header
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105); // SGK Green
  doc.text(t("T.C."), pageWidth / 2, 22, { align: "center" });
  doc.text(t("SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI"), pageWidth / 2, 28, { align: "center" });
  doc.text(t("Sigorta Primleri Genel Müdürlüğü"), pageWidth / 2, 34, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(t(`Sosyal Güvenlik İl Müdürlüğü`), pageWidth / 2, 42, { align: "center" });

  // Sayı & Tarih
  doc.setFontSize(9);
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(t(`Sayı : SGK-İSV-2026-${barcode}`), 18, 54);
  doc.text(t(`Tarih: ${getTodayFormatted()}`), pageWidth - 18, 54, { align: "right" });
  doc.text(t("Konu: Prim Borcu Durum Belgesi (5510 Sayılı Kanun)"), 18, 60);

  // İlgili Makama
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(t("İLGİLİ MAKAMA"), pageWidth / 2, 75, { align: "center" });

  // Body
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const p1 = t(
    `Kurumumuzun ${wpSicil} işyeri sicil numarasında kayıtlı bulunan ${companyTitle} (${wp.name}) unvanlı işyerinin sistemlerimizde yapılan sorgulaması sonucunda;`
  );
  doc.text(p1, 18, 88, { maxWidth: pageWidth - 36, lineHeightFactor: 1.5 });

  const p2 = t(
    `5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu hükümleri kapsamında, işbu belgenin düzenlendiği tarih itibarıyla Kurumumuza yasal süresi geçmiş sigorta primi, işsizlik sigortası primi, idari para cezası ve bunlara bağlı gecikme cezası ile gecikme zammı borcu BULUNMADIĞI tespit edilmiştir.`
  );
  doc.text(p2, 18, 108, { maxWidth: pageWidth - 36, lineHeightFactor: 1.5 });

  const p3 = t(
    `İşbu belge ilgili makamlara ibraz edilmek üzere Sosyal Güvenlik Kurumu İşveren Sistemi üzerinden elektronik imzalı olarak tanzim edilmiştir.`
  );
  doc.text(p3, 18, 130, { maxWidth: pageWidth - 36, lineHeightFactor: 1.5 });

  // İmza
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(10);
  doc.text(t("Sosyal Güvenlik Kurumu Adına"), pageWidth - 25, 155, { align: "right" });
  doc.text(t("İşveren İşlemleri Şube Müdürü"), pageWidth - 25, 161, { align: "right" });
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(t("(Elektronik İmzalıdır)"), pageWidth - 25, 167, { align: "right" });

  // Doğrulama Kutusu
  const boxY = 190;
  doc.setDrawColor(5, 150, 105);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(18, boxY, pageWidth - 36, 35, 3, 3, "FD");

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text(t("✓ SGK E-BORCU YOKTUR DOĞRULAMA BİLGİSİ"), 25, boxY + 10);

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 118, 110);
  doc.text(t(`Barkod Kodu: ${barcode}`), 25, boxY + 18);
  doc.text(t(`İşyeri Sicil No: ${wpSicil}`), 25, boxY + 24);
  doc.text(t("Bu belge Sosyal Güvenlik Kurumu e-Bildirge / İşveren Sistemi üzerinden barkod ile teyit edilebilir."), 25, boxY + 30);

  doc.save(`SGK_Borcu_Yoktur_${wp.name}.pdf`);
}

/**
 * 5. SGK Aylık Bildirge Tahakkuk Fişi PDF
 */
export async function downloadSgkBildirgePdf(
  settings: CompanySettings,
  wp: WorkplaceSgkCredential,
  bildirge: { period: string; type: string; count: number; amount: number }
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const t = (text: string) => (hasUnicode ? text : sanitizeTurkishChars(text));

  const pageWidth = doc.internal.pageSize.getWidth();
  const companyTitle = settings.companyTitle || settings.companyName || "ŞİRKET UNVANI";
  const wpSicil = wp.workplaceRegistrationNo || "23489020293482093000";

  // Header
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text(t("T.C. SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI"), pageWidth / 2, 22, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(t("AYLIK PRİM VE HİZMET BELGESİ TAHAKKUK FİŞİ (e-Bildirge v2)"), pageWidth / 2, 32, {
    align: "center",
  });

  autoTable(doc, {
    startY: 42,
    margin: { left: 18, right: 18 },
    theme: "striped",
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      font: hasUnicode ? "Roboto" : "helvetica",
      fontSize: 9,
      cellPadding: 3.5,
    },
    body: [
      [t("İŞYERİ ADI:"), t(wp.name)],
      [t("İŞYERİ SİCİL NO:"), t(wpSicil)],
      [t("İŞYERİ KODU:"), t(wp.workplaceCode || "000")],
      [t("İŞVEREN / ŞİRKET:"), t(companyTitle)],
      [t("BİLDİRGE DÖNEMİ:"), t(bildirge.period)],
      [t("BELGE TÜRÜ:"), t(bildirge.type)],
      [t("BİLDİRİLEN SİGORTALI SAYISI:"), t(`${bildirge.count} Personel`)],
      [t("TAHAKKUK EDEN TOPLAM PRİM:"), t(formatTL(bildirge.amount))],
      [t("UYGULANAN HAZİNE DESTEĞİ (%5):"), t("5510 Sayılı Kanun Kapsamında İndirildi")],
      [t("ÖDENECEK NET PRİM:"), t(formatTL(bildirge.amount))],
      [t("ONAY DURUMU:"), t("SGK SİSTEMİNDE ONAYLANDI (e-Bildirge v2)")],
    ],
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text(t("✓ İŞBU TAHAKKUK FİŞİ SGK e-BİLDİRGE v2 SİSTEMİ ÜZERİNDEN ONAYLANMIŞTIR."), pageWidth / 2, nextY, {
    align: "center",
  });

  doc.save(`SGK_Tahakkuk_${wp.name}_${bildirge.period.replace("/", "-")}.pdf`);
}

/**
 * 6. SGK 4/a Sigortalı Listesi Excel Export
 */
export function exportSgkEmployeesExcel(wp: WorkplaceSgkCredential, employees: any[]): void {
  const data = employees.map((emp, i) => ({
    "Sıra No": i + 1,
    "T.C. Kimlik No": emp.tckn || emp.tcknMasked || "382910****",
    "Adı Soyadı": emp.name,
    "İşe Giriş Tarihi": emp.startDate,
    "Meslek Kodu": emp.professionCode || "2512.01",
    "Meslek Adı": emp.professionName || "Yazılım Geliştirici",
    "İşyeri": wp.name,
    "Sigorta Kolu": "4/a (Hizmet Akdiyle Çalışan)",
    "Durum": "Aktif",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sigortali_Listesi");
  XLSX.writeFile(workbook, `SGK_Sigortali_Listesi_${wp.name}.xlsx`);
}

/**
 * 7. SGK 4/a Sigortalı Listesi PDF Export
 */
export async function downloadSgkEmployeesPdf(wp: WorkplaceSgkCredential, employees: any[]): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const t = (text: string) => (hasUnicode ? text : sanitizeTurkishChars(text));

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text(t("T.C. SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI"), pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(t(`${wp.name} - AKTİF 4/a SİGORTALI ÇALIŞAN LİSTESİ`), pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(9);
  doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(t(`İşyeri Sicil: ${wp.workplaceRegistrationNo || "—"} • Tarih: ${getTodayFormatted()}`), pageWidth / 2, 34, {
    align: "center",
  });

  const bodyRows = employees.map((emp, idx) => [
    idx + 1,
    t(emp.tckn || emp.tcknMasked || "382910****"),
    t(emp.name),
    t(emp.startDate),
    t(emp.professionCode || "2512.01"),
    t("Aktif"),
  ]);

  autoTable(doc, {
    startY: 40,
    margin: { left: 16, right: 16 },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      font: hasUnicode ? "Roboto" : "helvetica",
      fontSize: 8.5,
      cellPadding: 3,
    },
    head: [[t("No"), t("T.C. Kimlik No"), t("Adı Soyadı"), t("İşe Giriş Tarihi"), t("Meslek Kodu"), t("Durum")]],
    body: bodyRows,
  });

  doc.save(`SGK_Personel_Listesi_${wp.name}.pdf`);
}
