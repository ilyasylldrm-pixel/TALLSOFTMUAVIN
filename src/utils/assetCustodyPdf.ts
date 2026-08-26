import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AssetCustody, CompanySettings, Employee } from "../types";
import { sanitizeOklchForHtml2Canvas } from "./exportUtils";

interface ExportCustodyPdfOptions {
  isReturnProtocol?: boolean;
  customSignerName?: string;
  customSignerTitle?: string;
}

/**
 * Türkçe Tarih Formatlayıcı (YYYY-MM-DD -> DD.MM.YYYY)
 */
export function formatTRDate(dStr?: string | null): string {
  if (!dStr) return "-";
  const trimmed = dStr.trim();
  if (/^\d{2}\.\d{2}\.\d{4}/.test(trimmed)) return trimmed;
  const parts = trimmed.split("-");
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return trimmed;
}

/**
 * Para Birimi Formatlayıcı (₺12.500,00)
 */
export function formatTRY(val?: number | null): string {
  if (typeof val !== "number" || isNaN(val)) return "-";
  return (
    val.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}

/**
 * Kondisyon Metni
 */
export function getConditionLabel(condition?: string): string {
  switch (condition) {
    case "new":
      return "Sıfır / Fabrika Ambalajında";
    case "excellent":
      return "Kusursuz / Çok İyi Durumda";
    case "good":
      return "İyi / Tam Çalışır Vaziyette";
    case "fair":
      return "Orta / Kullanım İzi Mevcut";
    case "damaged":
      return "Hasarlı / Onarım Gerektiriyor";
    default:
      return condition || "Standart";
  }
}

/**
 * Kategori Etiketi
 */
export function getCategoryLabelTR(cat: string): string {
  switch (cat) {
    case "vehicle":
      return "Şirket Hizmet / Binek Taşıtı";
    case "computer":
      return "Bilgisayar & Taşınabilir Donanım";
    case "phone":
      return "Kurumsal GSM Hattı & Akıllı Telefon";
    case "tablet":
      return "Saha Tableti & iPad Donanımı";
    case "peripheral":
      return "Çevre Birimi / Monitör / Ekipman";
    case "office":
      return "Ofis Demirbaşı & Çalışma Ekipmanı";
    case "tool":
      return "Teknik İş Ekipmanı / El Aleti";
    default:
      return "Şirket Demirbaş Eşyası";
  }
}

/**
 * Generates an HTML string for the signed Asset Custody Handover / Return Protocol
 */
export function generateAssetCustodyHTML(
  asset: AssetCustody,
  employee?: Employee,
  companySettings?: CompanySettings,
  options: ExportCustodyPdfOptions = {}
): string {
  const isReturn = !!options.isReturnProtocol;
  const todayStr = new Date().toISOString().split("T")[0];
  const formattedToday = formatTRDate(todayStr);

  const company = companySettings || {
    companyName: "Şirket Unvanı",
    companyTitle: "Şirket Resmi Unvanı A.Ş.",
    address: "Şirket Genel Merkez Adresi",
    taxOffice: "-",
    taxNumber: "-",
  };

  const protocolNo = asset.barcodeNumber || `ZIM-${asset.id.slice(0, 8).toUpperCase()}`;

  // Vehicle section HTML
  let categoryDetailsHtml = "";
  if (asset.category === "vehicle" && asset.vehicleDetails) {
    const vd = asset.vehicleDetails;
    categoryDetailsHtml = `
      <div style="background-color: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px; margin-top: 8px;">
        <div style="font-weight: 700; color: #1e3a8a; font-size: 11px; margin-bottom: 6px; border-bottom: 1px solid #dbeafe; padding-bottom: 4px;">
          🚗 TAŞIT, RUHSAT VE TRAFİK BİLGİLERİ
        </div>
        <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Plaka Numarası:</strong> <span style="font-family: monospace; font-weight: 800; color: #0f172a; font-size: 11px; background: #ffffff; padding: 2px 6px; border: 1px solid #94a3b8; border-radius: 4px;">${vd.plateNumber}</span></td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Şasi Numarası:</strong> <span style="font-family: monospace;">${vd.chassisNumber || "-"}</span></td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Motor Numarası:</strong> <span style="font-family: monospace;">${vd.engineNumber || "-"}</span></td>
          </tr>
          <tr>
            <td style="padding: 3px 0;"><strong style="color: #475569;">Teslim Kilometresi:</strong> <strong>${vd.currentKm ? vd.currentKm.toLocaleString("tr-TR") : "0"} KM</strong></td>
            ${isReturn ? `<td style="padding: 3px 0;"><strong style="color: #475569;">İade Kilometresi:</strong> <strong>${vd.returnKm ? vd.returnKm.toLocaleString("tr-TR") : "-"} KM</strong></td>` : `<td style="padding: 3px 0;"><strong style="color: #475569;">Yakıt Türü:</strong> ${vd.fuelType || "-"}</td>`}
            <td style="padding: 3px 0;"><strong style="color: #475569;">Taşıt Tanıma / Yakıt Kartı:</strong> ${vd.fuelCardNumber || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;"><strong style="color: #475569;">HGS / OGS No:</strong> ${vd.hgsNumber || "-"}</td>
            <td style="padding: 3px 0;"><strong style="color: #475569;">Kasko Geçerlilik:</strong> ${formatTRDate(vd.kaskoExpiryDate)}</td>
            <td style="padding: 3px 0;"><strong style="color: #475569;">Muayene (TÜVTÜRK):</strong> ${formatTRDate(vd.inspectionExpiryDate)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 4px 0 0 0; color: #334155;">
              <strong>Ek Donanım Durumu:</strong> 
              ${vd.hasLicenseCard ? "✓ Araç Ruhsatı" : "✗ Ruhsat Yok"} • 
              ${vd.hasSpareKey ? "✓ Yedek Anahtar" : "✗ Yedek Anahtar Yok"} • 
              ${vd.hasTrafficSet ? "✓ Trafik Seti & Yangın Tüpü & Stepne" : "✗ Trafik Seti Yok"}
            </td>
          </tr>
        </table>
      </div>
    `;
  } else if (asset.category === "computer" && asset.computerDetails) {
    const cd = asset.computerDetails;
    categoryDetailsHtml = `
      <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 10px; margin-top: 8px;">
        <div style="font-weight: 700; color: #4c1d95; font-size: 11px; margin-bottom: 6px; border-bottom: 1px solid #ede9fe; padding-bottom: 4px;">
          💻 BİLGİSAYAR VE DONANIM TEKNİK ÖZELLİKLERİ
        </div>
        <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Cihaz Türü:</strong> ${cd.computerType === "laptop" ? "Dizüstü (Laptop)" : cd.computerType === "workstation" ? "İş İstasyonu (Workstation)" : "Masaüstü (Desktop)"}</td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">İşlemci (CPU):</strong> <strong>${cd.processor || "-"}</strong></td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Bellek (RAM):</strong> <strong>${cd.ram || "-"}</strong></td>
          </tr>
          <tr>
            <td style="padding: 3px 0;"><strong style="color: #475569;">Depolama (SSD/Disk):</strong> <strong>${cd.storage || "-"}</strong></td>
            <td style="padding: 3px 0;"><strong style="color: #475569;">İşletim Sistemi:</strong> ${cd.operatingSystem || "-"}</td>
            <td style="padding: 3px 0;"><strong style="color: #475569;">MAC / Ağ Adresi:</strong> <span style="font-family: monospace;">${cd.macAddress || "-"}</span></td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 4px 0 0 0; color: #334155;">
              <strong>Birlikte Verilen Parçalar:</strong> 
              ${cd.includesCharger ? "✓ Orijinal Şarj Adaptörü" : "✗ Şarj Cihazı Yok"} • 
              ${cd.includesBag ? "✓ Koruyucu Taşıma Çantası" : "✗ Çanta Yok"} • 
              ${cd.includesMouse ? "✓ Mouse / Klavye" : "✗ Mouse Yok"} • 
              ${cd.includesLock ? "✓ Güvenlik Kilidi" : ""}
            </td>
          </tr>
        </table>
      </div>
    `;
  } else if (asset.category === "phone" && asset.phoneDetails) {
    const pd = asset.phoneDetails;
    categoryDetailsHtml = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px; margin-top: 8px;">
        <div style="font-weight: 700; color: #065f46; font-size: 11px; margin-bottom: 6px; border-bottom: 1px solid #d1fae5; padding-bottom: 4px;">
          📱 TELEFON VE KURUMSAL GSM HATTI DETAYLARI
        </div>
        <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">IMEI 1 Numarası:</strong> <strong style="font-family: monospace; color: #0f172a;">${pd.imei1 || "-"}</strong></td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">IMEI 2 Numarası:</strong> <span style="font-family: monospace;">${pd.imei2 || "-"}</span></td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Tahsis Edilen GSM:</strong> <strong style="color: #047857;">${pd.phoneNumber || "-"}</strong></td>
          </tr>
          <tr>
            <td style="padding: 3px 0;"><strong style="color: #475569;">SIM Kart Seri No:</strong> <span style="font-family: monospace;">${pd.simCardNumber || "-"}</span></td>
            <td style="padding: 3px 0;"><strong style="color: #475569;">Dahili Hafıza:</strong> ${pd.storageCapacity || "-"}</td>
            <td style="padding: 3px 0;"><strong style="color: #475569;">Cihaz Rengi:</strong> ${pd.color || "-"}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 4px 0 0 0; color: #334155;">
              <strong>Birlikte Verilen Aksesuarlar:</strong> 
              ${pd.includesCharger ? "✓ Şarj Başlığı ve Kablo" : "✗ Şarj Cihazı Yok"} • 
              ${pd.includesCaseScreenProtector ? "✓ Koruyucu Kılıf & Ekran Koruyucu" : "✗ Kılıf Yok"} • 
              ${pd.includesHeadphones ? "✓ Kulaklık" : "✗ Kulaklık Yok"}
            </td>
          </tr>
        </table>
      </div>
    `;
  } else if (asset.category === "tablet" && asset.tabletDetails) {
    const td = asset.tabletDetails;
    categoryDetailsHtml = `
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-top: 8px;">
        <div style="font-weight: 700; color: #92400e; font-size: 11px; margin-bottom: 6px; border-bottom: 1px solid #fef3c7; padding-bottom: 4px;">
          📋 TABLET VE SAHA DONANIMI ÖZELLİKLERİ
        </div>
        <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Model / Tip:</strong> ${td.tabletType || asset.model} (${td.screenSize || "-"})</td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Bağlantı Türü:</strong> ${td.hasCellular ? "Wi-Fi + Cellular (SIM Destekli)" : "Sadece Wi-Fi"}</td>
            <td style="padding: 3px 0; width: 33%;"><strong style="color: #475569;">Hücresel IMEI:</strong> <span style="font-family: monospace;">${td.imei || "-"}</span></td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 4px 0 0 0; color: #334155;">
              <strong>Ek Donanımlar:</strong> 
              ${td.includesStylus ? "✓ Stylus / Çizim Kalemi" : ""} • 
              ${td.includesKeyboardCase ? "✓ Klavyeli Kılıf / Stand" : ""} • 
              ${td.includesCharger ? "✓ Şarj Adaptörü" : ""}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  // Extra accessories list tags
  let accessoriesHtml = "";
  if (asset.accessoriesList && asset.accessoriesList.length > 0) {
    const tags = asset.accessoriesList
      .map(
        (acc) =>
          `<span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px; font-size: 9.5px; margin-right: 4px; margin-top: 2px; color: #334155;">✓ ${acc}</span>`
      )
      .join("");
    accessoriesHtml = `
      <div style="margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
        <span style="font-size: 10px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">
          Birlikte Teslim Edilen Ek Malzeme ve Aksesuarlar:
        </span>
        <div>${tags}</div>
      </div>
    `;
  }

  // Employee merged data
  const empName = asset.employeeName || employee?.fullName || "İlgili Personel";
  const empTckn = employee?.tckn || "-";
  const empTitle = asset.employeeTitle || employee?.title || "-";
  const empDept = asset.employeeDepartment || employee?.department || "-";
  const empPhone = employee?.phone || "-";
  const empEmail = employee?.email || "-";
  const empStartDate = employee?.startDate ? formatTRDate(employee.startDate) : "-";
  const empBranch = asset.branchName || employee?.branchName || "Genel Merkez";

  // Employer / Signer Details
  const signerName =
    options.customSignerName ||
    (isReturn && asset.returnReceivedBy ? asset.returnReceivedBy : null) ||
    companySettings?.eDevletCredentials?.managerName ||
    "Şirket Yetkilisi / İK Yöneticisi";
  const signerTitle = options.customSignerTitle || "İnsan Kaynakları & İdari İşler Yetkilisi";

  return `
    <div style="width: 800px; padding: 36px 40px; background-color: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; line-height: 1.4;">
      
      <!-- Antet ve Başlık -->
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; width: 65%;">
              <div style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.01em;">
                ${company.companyTitle || company.companyName}
              </div>
              <div style="font-size: 9.5px; color: #475569; margin-top: 3px;">
                ${company.address || ""}
              </div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
                Vergi Dairesi: <strong>${company.taxOffice || "-"}</strong> | VKN/TCKN: <strong>${company.taxNumber || "-"}</strong> ${companySettings?.mersisNo ? `| Mersis: <strong>${companySettings.mersisNo}</strong>` : ""}
              </div>
              ${companySettings?.sgkCredentials?.workplaceRegistrationNo ? `<div style="font-size: 9px; color: #64748b;">SGK İşyeri Sicil No: <strong>${companySettings.sgkCredentials.workplaceRegistrationNo}</strong></div>` : ""}
            </td>
            <td style="vertical-align: top; text-align: right; width: 35%;">
              <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; font-family: monospace; font-size: 11px; font-weight: 800; color: #1e293b;">
                ${protocolNo}
              </div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 4px;">
                Düzenleme Tarihi: <strong style="color: #0f172a;">${formattedToday}</strong>
              </div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                Zimmet No: #${asset.id.slice(0, 6).toUpperCase()}
              </div>
            </td>
          </tr>
        </table>

        <!-- Belge Başlığı -->
        <div style="margin-top: 14px; text-align: center;">
          <h2 style="margin: 0; font-size: 15px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: #0f172a; text-decoration: underline; text-underline-offset: 3px;">
            ${isReturn ? "DEMİRBAŞ / EŞYA İADE VE TESLİM ALMA PROTOKOLÜ" : "DEMİRBAŞ / EŞYA ZİMMET TESLİM VE TESELLÜM TUTANAĞI"}
          </h2>
          <p style="margin: 3px 0 0 0; font-size: 9px; color: #64748b; font-weight: 600;">
            (4857 Sayılı İş Kanunu ve 6098 Sayılı Türk Borçlar Kanunu Hükümlerine Göre Karşılıklı Tanzim Edilmiştir)
          </p>
        </div>
      </div>

      <!-- Taraflar Bilgisi (İşveren ve Personel Birleştirilmiş Tablo) -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px 0; margin-bottom: 12px;">
        <tr>
          <!-- Teslim Eden / Alan İşveren -->
          <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 5px; text-transform: uppercase;">
              ${isReturn ? "🏢 TESLİM ALAN (İŞVEREN / YETKİLİ)" : "🏢 TESLİM EDEN (İŞVEREN / YETKİLİ)"}
            </div>
            <table style="width: 100%; font-size: 9.5px; border-collapse: collapse; color: #334155;">
              <tr>
                <td style="padding: 2px 0; width: 38%; font-weight: 700; color: #64748b;">Kurum / Şirket:</td>
                <td style="padding: 2px 0; font-weight: 700; color: #0f172a;">${company.companyTitle || company.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; font-weight: 700; color: #64748b;">Şube / Lokasyon:</td>
                <td style="padding: 2px 0;">${empBranch}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; font-weight: 700; color: #64748b;">Yetkili / Görevli:</td>
                <td style="padding: 2px 0;">${signerName}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; font-weight: 700; color: #64748b;">Yetkili Ünvanı:</td>
                <td style="padding: 2px 0;">${signerTitle}</td>
              </tr>
            </table>
          </td>

          <!-- Teslim Alan / Eden Personel -->
          <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 5px; text-transform: uppercase;">
              ${isReturn ? "👤 TESLİM EDEN (PERSONEL)" : "👤 TESLİM ALAN (ZİMMETLİ PERSONEL)"}
            </div>
            <table style="width: 100%; font-size: 9.5px; border-collapse: collapse; color: #334155;">
              <tr>
                <td style="padding: 2px 0; width: 38%; font-weight: 700; color: #64748b;">Adı Soyadı:</td>
                <td style="padding: 2px 0; font-weight: 800; color: #0f172a;">${empName}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; font-weight: 700; color: #64748b;">T.C. Kimlik No:</td>
                <td style="padding: 2px 0; font-family: monospace; font-weight: 700;">${empTckn}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; font-weight: 700; color: #64748b;">Görevi / Ünvanı:</td>
                <td style="padding: 2px 0;">${empTitle}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; font-weight: 700; color: #64748b;">Departman:</td>
                <td style="padding: 2px 0;">${empDept} ${empStartDate !== "-" ? `(Giriş: ${empStartDate})` : ""}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; font-weight: 700; color: #64748b;">Telefon / E-posta:</td>
                <td style="padding: 2px 0;">${empPhone} ${empEmail !== "-" ? `• ${empEmail}` : ""}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Zimmet Konusu Demirbaş Bilgileri -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
        <div style="background-color: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
          <span>📦 ZİMMET KONUSU DEMİRBAŞ & EKİPMAN DETAYLARI</span>
          <span style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">${getCategoryLabelTR(asset.category)}</span>
        </div>
        
        <div style="padding: 10px; background-color: #ffffff;">
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 0; width: 33%;"><strong style="color: #64748b;">Demirbaş Tanımı:</strong> <strong style="color: #0f172a; font-size: 11px;">${asset.assetName}</strong></td>
              <td style="padding: 3px 0; width: 33%;"><strong style="color: #64748b;">Marka & Model:</strong> <strong>${asset.brand} - ${asset.model}</strong></td>
              <td style="padding: 3px 0; width: 33%;"><strong style="color: #64748b;">Seri Numarası:</strong> <span style="font-family: monospace; font-weight: 700;">${asset.serialNumber || asset.inventoryNumber || "-"}</span></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;"><strong style="color: #64748b;">Barkod / Envanter No:</strong> <span style="font-family: monospace;">${asset.barcodeNumber || "-"}</span></td>
              <td style="padding: 3px 0;"><strong style="color: #64748b;">Teslim Tarihi:</strong> <strong>${formatTRDate(asset.assignedDate)}</strong></td>
              <td style="padding: 3px 0;"><strong style="color: #64748b;">Teslim Kondisyonu:</strong> <strong>${getConditionLabel(asset.conditionOnDelivery)}</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;"><strong style="color: #64748b;">Piyasa / Rayiç Değer:</strong> <strong style="color: #0f172a;">${formatTRY(asset.approximateValue)}</strong></td>
              ${isReturn ? `<td style="padding: 3px 0;"><strong style="color: #64748b;">İade Tarihi & Kondisyonu:</strong> <strong>${formatTRDate(asset.returnDate)} (${asset.conditionOnReturn || "-"})</strong></td>` : `<td style="padding: 3px 0;"><strong style="color: #64748b;">Zimmet Durumu:</strong> <span style="color: #059669; font-weight: 700;">Aktif Zimmetli</span></td>`}
              <td style="padding: 3px 0;"><strong style="color: #64748b;">Bağlı Depo / Şube:</strong> ${asset.warehouseName || asset.branchName || "Ana Merkez"}</td>
            </tr>
          </table>

          <!-- Kategori Detayları Bölümü -->
          ${categoryDetailsHtml}

          <!-- Ek Aksesuarlar -->
          ${accessoriesHtml}

          <!-- Notlar & İade Açıklamaları -->
          ${
            isReturn && asset.returnNotes
              ? `<div style="margin-top: 8px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 6px 8px; font-size: 9.5px; color: #92400e;">
                  <strong>İade ve Ekspertiz Teslim Alma Notu:</strong> <em>${asset.returnNotes}</em>
                  ${asset.returnReceivedBy ? `<span style="display: block; margin-top: 3px; font-size: 9px; color: #78350f;">Teslim Alan Yetkili: <strong>${asset.returnReceivedBy}</strong></span>` : ""}
                </div>`
              : ""
          }
          ${
            asset.notes
              ? `<div style="margin-top: 6px; font-size: 9.5px; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 4px;"><strong>Zimmet Özel Notları:</strong> <em>${asset.notes}</em></div>`
              : ""
          }
        </div>
      </div>

      <!-- Yasal Taahhütname ve Şartlar (4857 Sayılı Kanun & TBK) -->
      <div style="border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 6px; padding: 8px 10px; margin-bottom: 14px; font-size: 8.5px; color: #334155; line-height: 1.35;">
        <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; font-size: 9px;">
          ⚖️ ZİMMET ŞARTLARI, KULLANIM KURALLARI VE YASAL TAAHHÜTNAME
        </div>
        <ol style="margin: 0; padding-left: 14px;">
          <li style="margin-bottom: 2px;">
            Yukarıda marka, model, seri numarası, teknik özellikleri ve aksesuarları belirtilen şirket demirbaşı, tarafıma eksiksiz, sağlam, temiz ve çalışır vaziyette teslim edilmiştir.
          </li>
          <li style="margin-bottom: 2px;">
            Demirbaş konusu eşyayı yalnızca şirket işleri ve görev tanımlarım doğrultusunda özenle kullanacağımı; hiçbir suretle üçüncü şahıslara devretmeyeceğimi, ödünç vermeyeceğimi, kiralamayacağımı veya satmayacağımı kabul ve taahhüt ederim.
          </li>
          <li style="margin-bottom: 2px;">
            Eşyanın korunması, periyodik bakımı ve güvenliği için gerekli tüm tedbirleri alacağımı; kullanıcı kusuru, ihmal, kaybolma veya hasar durumunda derhal İnsan Kaynakları / İdari İşler birimine yazılı bildirimde bulunacağımı beyan ederim.
          </li>
          <li style="margin-bottom: 2px;">
            İş akdimin herhangi bir nedenle sona ermesi, işverenin yazılı talebi veya görevin değişmesi durumunda, zimmetli eşyayı ve tüm aksesuarlarını eksiksiz ve çalışır vaziyette işverene derhal teslim edeceğimi, aksi takdirde doğacak maddi zararları ve demirbaş rayiç bedelini tazmin edeceğimi peşinen kabul ve taahhüt ederim.
          </li>
        </ol>
      </div>

      <!-- Islak İmza ve Kaşe Alanları -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0;">
        <tr>
          <!-- Teslim Eden İmza Alanı -->
          <td style="width: 50%; vertical-align: top; border: 1px solid #94a3b8; border-radius: 6px; padding: 10px; text-align: center; background-color: #ffffff;">
            <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
              ${isReturn ? "TESLİM ALAN (İŞVEREN / İK TEMSİLCİSİ)" : "TESLİM EDEN (İŞVEREN / İK TEMSİLCİSİ)"}
            </div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
              Kaşe ve Yetkili İmza
            </div>
            
            <div style="height: 60px; margin: 8px 0; border-bottom: 1px dashed #cbd5e1; display: flex; align-items: flex-end; justify-content: center;">
              <!-- İmza Alanı Boşluğu -->
            </div>

            <div style="font-size: 10px; font-weight: 700; color: #0f172a;">
              ${signerName}
            </div>
            <div style="font-size: 8.5px; color: #64748b;">
              ${signerTitle}
            </div>
            <div style="font-size: 8.5px; color: #475569; margin-top: 2px;">
              Tarih: <strong>${formattedToday}</strong>
            </div>
          </td>

          <!-- Teslim Alan İmza Alanı -->
          <td style="width: 50%; vertical-align: top; border: 1px solid #94a3b8; border-radius: 6px; padding: 10px; text-align: center; background-color: #ffffff;">
            <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
              ${isReturn ? "TESLİM EDEN (PERSONEL)" : "TESLİM ALAN (ZİMMETLİ PERSONEL)"}
            </div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
              Okudum, Eksiksiz Teslim Aldım (Islak İmza)
            </div>
            
            <div style="height: 60px; margin: 8px 0; border-bottom: 1px dashed #cbd5e1; display: flex; align-items: flex-end; justify-content: center;">
              <!-- İmza Alanı Boşluğu -->
            </div>

            <div style="font-size: 10px; font-weight: 700; color: #0f172a;">
              ${empName}
            </div>
            <div style="font-size: 8.5px; color: #64748b;">
              T.C. No: ${empTckn} • ${empTitle}
            </div>
            <div style="font-size: 8.5px; color: #475569; margin-top: 2px;">
              Tarih: <strong>${formattedToday}</strong>
            </div>
          </td>
        </tr>
      </table>

      <!-- Alt Bilgi ve Nüsha Notu -->
      <div style="margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; text-align: center; font-size: 8px; color: #94a3b8;">
        İşbu tutanak iki (2) asıl nüsha olarak tanzim edilmiş olup, bir nüshası personele verilmiş, diğer nüshası çalışanın özlük dosyasında saklanmaktadır. • Muavin ERP & İK Sistemi
      </div>

    </div>
  `;
}

/**
 * Direct PDF Export Function that takes asset + employee + company info and downloads signed PDF
 */
export async function exportAssetCustodyToPDF(
  asset: AssetCustody,
  employee?: Employee,
  companySettings?: CompanySettings,
  options: ExportCustodyPdfOptions = {}
): Promise<void> {
  const isReturn = !!options.isReturnProtocol;
  const protocolName = isReturn ? "Zimmet_Iade_Tutanagi" : "Zimmet_Teslim_Tutanagi";
  const empSlug = (asset.employeeName || "Personel").replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]/g, "_");
  const assetSlug = (asset.assetName || "Demirbas").replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]/g, "_");
  const filename = `${protocolName}_${empSlug}_${assetSlug}.pdf`;

  // Create temporary container for rendering
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "800px";
  container.style.backgroundColor = "#ffffff";
  container.style.boxSizing = "border-box";

  container.innerHTML = generateAssetCustodyHTML(asset, employee, companySettings, options);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        sanitizeOklchForHtml2Canvas(clonedDoc);
      },
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 8;
    const imgWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pdfHeight - margin * 2) {
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, imgWidth, imgHeight);
    } else {
      // Multi-page splitting if content exceeds A4 height
      let heightLeft = imgHeight;
      let position = margin;
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(filename);
  } catch (err) {
    console.error("Zimmet Tutanağı PDF Oluşturma Hatası:", err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
