import React, { useState } from "react";
import {
  X,
  Printer,
  FileCheck2,
  Building2,
  UserCheck,
  Calendar,
  ShieldCheck,
  Car,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  Clock,
  KeyRound,
  FileText,
  Fuel,
  Info,
  Download,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  Briefcase,
} from "lucide-react";
import { AssetCustody, CompanySettings, Employee } from "../types";
import { exportAssetCustodyToPDF } from "../utils/assetCustodyPdf";

interface AssetCustodyPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetCustody | null;
  employee?: Employee;
  companySettings: CompanySettings;
  isReturnProtocol?: boolean;
}

export const AssetCustodyPrintModal: React.FC<AssetCustodyPrintModalProps> = ({
  isOpen,
  onClose,
  asset,
  employee,
  companySettings,
  isReturnProtocol = false,
}) => {
  const [docType, setDocType] = useState<"delivery" | "return">(
    isReturnProtocol ? "return" : "delivery"
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sync docType when isReturnProtocol prop changes
  React.useEffect(() => {
    setDocType(isReturnProtocol ? "return" : "delivery");
  }, [isReturnProtocol, isOpen]);

  if (!isOpen || !asset) return null;

  const isReturn = docType === "return";
  const todayStr = new Date().toISOString().split("T")[0];

  const formatTRDate = (dStr?: string) => {
    if (!dStr) return "-";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  const formatTRY = (val?: number) => {
    if (typeof val !== "number" || isNaN(val)) return "-";
    return (
      val.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " ₺"
    );
  };

  const getConditionText = (condition?: string) => {
    switch (condition) {
      case "new":
        return "Sıfır / Ambalajında";
      case "excellent":
        return "Çok İyi / Kusursuz";
      case "good":
        return "İyi / Çalışır Durumda";
      case "fair":
        return "Orta / Kullanım İzleri Mevcut";
      case "damaged":
        return "Hasarlı / Arızalı";
      default:
        return condition || "Standart";
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "vehicle":
        return "Şirket Hizmet / Binek Aracı";
      case "computer":
        return "Bilgisayar / Taşınabilir Donanım";
      case "phone":
        return "Kurumsal Cep Telefonu & GSM Hattı";
      case "tablet":
        return "Tablet & Saha Donanımı";
      case "peripheral":
        return "Çevre Birimi / Monitör / Aksesuar";
      case "office":
        return "Ofis Demirbaşı & Çalışma Ekipmanı";
      case "tool":
        return "Teknik İş Ekipmanı / El Aleti";
      default:
        return "Demirbaş Eşya";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await exportAssetCustodyToPDF(asset, employee, companySettings, {
        isReturnProtocol: isReturn,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("PDF Export hatası:", err);
      alert("PDF belgesi oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const empName = asset.employeeName || employee?.fullName || "İlgili Personel";
  const empTckn = employee?.tckn || "Belirtilmemiş";
  const empTitle = asset.employeeTitle || employee?.title || "-";
  const empDept = asset.employeeDepartment || employee?.department || "-";
  const empPhone = employee?.phone || "-";
  const empEmail = employee?.email || "-";
  const empStartDate = employee?.startDate ? formatTRDate(employee.startDate) : "-";
  const empBranch = asset.branchName || employee?.branchName || "Genel Merkez";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0 overflow-y-auto">
      <div
        id="zimmet-print-container"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col border border-slate-200 print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Modal Header (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {isReturn ? "Zimmet İade ve Teslim Alma Tutanağı" : "Zimmet Teslim ve Tesellüm Tutanağı"}
              </h2>
              <p className="text-xs text-slate-500">
                4857 Sayılı İş Kanunu ve TBK standartlarında resmi imzalı tutanak
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Toggle Protocol Type */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setDocType("delivery")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  !isReturn ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Teslim Tutanağı
              </button>
              <button
                onClick={() => setDocType("return")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isReturn ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                İade Tutanağı
              </button>
            </div>

            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className={`inline-flex items-center px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
                downloadSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } ${isGeneratingPdf ? "opacity-75 cursor-not-allowed" : ""}`}
              title="İmzalı formatta resmi PDF belgesi indir"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  PDF Hazırlanıyor...
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  İndirildi!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" />
                  İmzalı PDF İndir
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-600" />
              Yazdır
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 sm:p-10 overflow-y-auto print:p-4 print:overflow-visible text-slate-900 bg-white font-sans">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3">
                  {companySettings.logoUrl ? (
                    <img
                      src={companySettings.logoUrl}
                      alt="Logo"
                      className="h-12 max-w-[160px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                      {companySettings.companyName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                      {companySettings.companyTitle || companySettings.companyName}
                    </h1>
                    <p className="text-xs text-slate-600">
                      {companySettings.address}
                    </p>
                    <p className="text-xs text-slate-600">
                      Vergi Dairesi: {companySettings.taxOffice || "-"} | VKN/TCKN: {companySettings.taxNumber || "-"} {companySettings.mersisNo ? `| Mersis: ${companySettings.mersisNo}` : ""}
                    </p>
                    {companySettings.sgkCredentials?.workplaceRegistrationNo && (
                      <p className="text-[11px] text-slate-500">
                        SGK İşyeri Sicil No: <strong>{companySettings.sgkCredentials.workplaceRegistrationNo}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">
                  {asset.barcodeNumber || `ZIM-${asset.id.slice(0, 8).toUpperCase()}`}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Düzenleme Tarihi: <strong>{formatTRDate(todayStr)}</strong>
                </p>
              </div>
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-slate-900 underline decoration-slate-400 underline-offset-4">
                {isReturn
                  ? "DEMİRBAŞ / EŞYA İADE VE TESLİM ALMA PROTOKOLÜ"
                  : "DEMİRBAŞ / EŞYA ZİMMET TESLİM VE TESELLÜM TUTANAĞI"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                (4857 Sayılı İş Kanunu ve Türk Borçlar Kanunu Uyarınca İşveren ve Personel Arasında Tanzim Edilmiştir)
              </p>
            </div>
          </div>

          {/* Taraflar Bilgisi - Personel Bilgileriyle Birleştirilmiş */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
            {/* İşveren Tarafı */}
            <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/70">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-blue-700" />
                {isReturn ? "TESLİM ALAN (İŞVEREN / YETKİLİ)" : "TESLİM EDEN (İŞVEREN / YETKİLİ)"}
              </div>
              <div className="space-y-1 text-slate-700">
                <p><span className="font-semibold text-slate-500">Kurum / Şirket:</span> <strong className="text-slate-900">{companySettings.companyTitle || companySettings.companyName}</strong></p>
                <p><span className="font-semibold text-slate-500">Şube / Lokasyon:</span> {empBranch}</p>
                <p><span className="font-semibold text-slate-500">İşyeri Sicil No:</span> {companySettings.sgkCredentials?.workplaceRegistrationNo || "-"}</p>
                <p><span className="font-semibold text-slate-500">Yetkili / Temsilci:</span> {companySettings.eDevletCredentials?.managerName || "Şirket Yetkilisi"}</p>
              </div>
            </div>

            {/* Personel Tarafı (Birleştirilmiş Detaylar) */}
            <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/70">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-2 flex items-center">
                <UserCheck className="w-4 h-4 mr-1.5 text-blue-700" />
                {isReturn ? "TESLİM EDEN (PERSONEL)" : "TESLİM ALAN (ZİMMETLİ PERSONEL)"}
              </div>
              <div className="space-y-1 text-slate-700">
                <p><span className="font-semibold text-slate-500">Adı Soyadı:</span> <strong className="text-slate-900">{empName}</strong></p>
                <p><span className="font-semibold text-slate-500">T.C. Kimlik No:</span> <span className="font-mono font-bold text-slate-900">{empTckn}</span></p>
                <p><span className="font-semibold text-slate-500">Görevi / Ünvanı:</span> {empTitle}</p>
                <p><span className="font-semibold text-slate-500">Departmanı:</span> {empDept} {empStartDate !== "-" ? `(İşe Giriş: ${empStartDate})` : ""}</p>
                {empPhone !== "-" && (
                  <p><span className="font-semibold text-slate-500">İletişim:</span> {empPhone} {empEmail !== "-" ? `• ${empEmail}` : ""}</p>
                )}
              </div>
            </div>
          </div>

          {/* Zimmetlenen Malzeme / Donanım Detayları */}
          <div className="mb-5">
            <div className="bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-t-md flex items-center justify-between">
              <span>ZİMMET KONUSU DEMİRBAŞ & EKİPMAN BİLGİLERİ</span>
              <span className="uppercase text-[10px] tracking-wider text-slate-300">
                {getCategoryLabel(asset.category)}
              </span>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b-md p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Demirbaş Tanımı:</span>
                  <span className="font-bold text-slate-900 text-sm">{asset.assetName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Marka / Model:</span>
                  <span className="font-semibold text-slate-800">{asset.brand} - {asset.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Seri No / Envanter No:</span>
                  <span className="font-mono font-semibold text-slate-800">{asset.serialNumber || asset.inventoryNumber || "-"}</span>
                </div>
              </div>

              {/* Kategoriye Özel Zengin Detaylar Tablosu */}
              {asset.category === "vehicle" && asset.vehicleDetails && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                  <div className="font-bold text-blue-900 mb-2 flex items-center text-xs">
                    <Car className="w-4 h-4 mr-1 text-blue-700" />
                    Araç, Ruhsat ve Trafik Detayları
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-slate-700 text-[11px]">
                    <p><span className="font-semibold">Plaka No:</span> <strong className="text-slate-950 font-mono text-xs">{asset.vehicleDetails.plateNumber}</strong></p>
                    <p><span className="font-semibold">Şasi No:</span> <span className="font-mono">{asset.vehicleDetails.chassisNumber || "-"}</span></p>
                    <p><span className="font-semibold">Motor No:</span> <span className="font-mono">{asset.vehicleDetails.engineNumber || "-"}</span></p>
                    <p><span className="font-semibold">Teslim Kilometresi:</span> <strong>{asset.vehicleDetails.currentKm?.toLocaleString("tr-TR")} KM</strong></p>
                    {isReturn && (
                      <p><span className="font-semibold">İade Kilometresi:</span> <strong>{asset.vehicleDetails.returnKm?.toLocaleString("tr-TR") || "-"} KM</strong></p>
                    )}
                    <p><span className="font-semibold">Yakıt Türü:</span> {asset.vehicleDetails.fuelType || "-"}</p>
                    <p><span className="font-semibold">Taşıt Tanıma / Yakıt Kartı:</span> {asset.vehicleDetails.fuelCardNumber || "-"}</p>
                    <p><span className="font-semibold">HGS / OGS No:</span> {asset.vehicleDetails.hgsNumber || "-"}</p>
                    <p><span className="font-semibold">Kasko / Muayene:</span> {formatTRDate(asset.vehicleDetails.kaskoExpiryDate)} / {formatTRDate(asset.vehicleDetails.inspectionExpiryDate)}</p>
                  </div>
                  <div className="border-t border-blue-200/60 mt-2 pt-1.5 text-[10.5px] text-blue-950">
                    <strong>Ek Donanım Durumu:</strong> {asset.vehicleDetails.hasLicenseCard ? "✓ Araç Ruhsatı" : "✗ Ruhsat Yok"} • {asset.vehicleDetails.hasSpareKey ? "✓ Yedek Anahtar" : "✗ Yedek Anahtar Yok"} • {asset.vehicleDetails.hasTrafficSet ? "✓ Trafik Seti & Yangın Tüpü & Stepne" : "✗ Trafik Seti Yok"}
                  </div>
                </div>
              )}

              {asset.category === "computer" && asset.computerDetails && (
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-3">
                  <div className="font-bold text-indigo-900 mb-2 flex items-center text-xs">
                    <Laptop className="w-4 h-4 mr-1 text-indigo-700" />
                    Bilgisayar & Donanım Teknik Özellikleri
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-slate-700 text-[11px]">
                    <p><span className="font-semibold">Cihaz Türü:</span> {asset.computerDetails.computerType === "laptop" ? "Dizüstü (Laptop)" : "Masaüstü / İş İstasyonu"}</p>
                    <p><span className="font-semibold">İşlemci (CPU):</span> <strong>{asset.computerDetails.processor}</strong></p>
                    <p><span className="font-semibold">Bellek (RAM):</span> <strong>{asset.computerDetails.ram}</strong></p>
                    <p><span className="font-semibold">Depolama (SSD/Disk):</span> <strong>{asset.computerDetails.storage}</strong></p>
                    <p><span className="font-semibold">İşletim Sistemi:</span> {asset.computerDetails.operatingSystem}</p>
                    <p><span className="font-semibold">MAC Adresi:</span> <span className="font-mono">{asset.computerDetails.macAddress || "-"}</span></p>
                  </div>
                </div>
              )}

              {asset.category === "phone" && asset.phoneDetails && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3">
                  <div className="font-bold text-emerald-900 mb-2 flex items-center text-xs">
                    <Smartphone className="w-4 h-4 mr-1 text-emerald-700" />
                    Telefon & Kurumsal GSM Hattı Detayları
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-slate-700 text-[11px]">
                    <p><span className="font-semibold">IMEI 1 Numarası:</span> <strong className="font-mono">{asset.phoneDetails.imei1}</strong></p>
                    <p><span className="font-semibold">IMEI 2 Numarası:</span> <span className="font-mono">{asset.phoneDetails.imei2 || "-"}</span></p>
                    <p><span className="font-semibold">Tahsis Edilen GSM No:</span> <strong className="text-emerald-800">{asset.phoneDetails.phoneNumber || "-"}</strong></p>
                    <p><span className="font-semibold">SIM Kart Seri No:</span> <span className="font-mono">{asset.phoneDetails.simCardNumber || "-"}</span></p>
                    <p><span className="font-semibold">Dahili Hafıza & Renk:</span> {asset.phoneDetails.storageCapacity || "-"} / {asset.phoneDetails.color || "-"}</p>
                  </div>
                </div>
              )}

              {asset.category === "tablet" && asset.tabletDetails && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3">
                  <div className="font-bold text-amber-900 mb-2 flex items-center text-xs">
                    <Tablet className="w-4 h-4 mr-1 text-amber-700" />
                    Tablet Donanım Özellikleri
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-slate-700 text-[11px]">
                    <p><span className="font-semibold">Model / Ekran:</span> {asset.tabletDetails.tabletType || asset.model} ({asset.tabletDetails.screenSize || "-"})</p>
                    <p><span className="font-semibold">Hafıza & Bağlantı:</span> {asset.tabletDetails.storageCapacity || "-"} - {asset.tabletDetails.hasCellular ? "Wi-Fi + Cellular (SIM)" : "Sadece Wi-Fi"}</p>
                    <p><span className="font-semibold">IMEI No:</span> <span className="font-mono">{asset.tabletDetails.imei || "-"}</span></p>
                  </div>
                </div>
              )}

              {/* Teslim Edilen Aksesuarlar ve Parçalar */}
              {asset.accessoriesList && asset.accessoriesList.length > 0 && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Birlikte Teslim Edilen Ek Malzeme ve Aksesuarlar:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {asset.accessoriesList.map((acc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] text-slate-800"
                      >
                        ✓ {acc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-2 text-slate-700">
                <div>
                  <span className="text-slate-500 block text-[11px]">Teslim Tarihi:</span>
                  <span className="font-semibold">{formatTRDate(asset.assignedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isReturn ? "İade Anındaki Kondisyon:" : "Teslim Anındaki Kondisyon:"}</span>
                  <span className="font-semibold">{getConditionText(isReturn ? asset.conditionOnReturn : asset.conditionOnDelivery)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isReturn ? "İade Tarihi:" : "Rayiç Değer:"}</span>
                  <span className="font-semibold text-slate-900">{isReturn ? formatTRDate(asset.returnDate || todayStr) : formatTRY(asset.approximateValue)}</span>
                </div>
              </div>

              {isReturn && asset.returnNotes && (
                <div className="border-t border-amber-200 bg-amber-50/50 p-2.5 rounded mt-2">
                  <span className="text-amber-900 font-bold block text-[11px]">İade ve Ekspertiz Teslim Alma Notu:</span>
                  <p className="text-slate-700 italic text-[11.5px] mt-0.5">{asset.returnNotes}</p>
                </div>
              )}

              {asset.notes && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-500 block text-[11px]">Özel Notlar & Açıklamalar:</span>
                  <p className="text-slate-700 italic">{asset.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Yasal Taahhütname ve Şartlar (4857 Sayılı Kanun & TBK Uyarınca) */}
          <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50 text-[10.5px] leading-relaxed text-slate-700 mb-5">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
              ZİMMET ŞARTLARI, KULLANIM KURALLARI VE YASAL TAAHHÜTNAME
            </h4>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>
                Yukarıda nitelikleri, seri numarası, teknik özellikleri ve aksesuarları belirtilen şirket demirbaşı, tarafıma işler, eksiksiz ve sağlam vaziyette teslim edilmiştir.
              </li>
              <li>
                Zimmet konusu donanımı yalnızca şirket işleri ve görev tanımlarım kapsamında özenle kullanacağımı, hiçbir surette üçüncü kişilere devretmeyeceğimi, kiralamayacağımı veya satmayacağımı kabul ve taahhüt ederim.
              </li>
              <li>
                Eşyanın korunması için gerekli tüm güvenlik ve bakım tedbirlerini alacağımı; kaybolma, çalınma veya kullanıcı kusurundan kaynaklanan hasar hallerinde durumu derhal İnsan Kaynakları ve İdari İşler birimine yazılı olarak bildireceğimi beyan ederim.
              </li>
              <li>
                Şirket ile olan iş sözleşmemin herhangi bir sebeple sona ermesi, görevin değişmesi veya işverenin talebi halinde, zimmetli eşyayı ve tüm aksesuarlarını eksiksiz ve çalışır vaziyette iade edeceğimi, aksi halde doğacak maddi zararları ve rayiç bedeli tazmin edeceğimi peşinen kabul ederim.
              </li>
            </ol>
          </div>

          {/* İmza Alanı */}
          <div className="grid grid-cols-2 gap-8 pt-2">
            <div className="border border-slate-300 rounded-lg p-4 text-center bg-white">
              <p className="font-bold text-xs text-slate-900 uppercase">
                {isReturn ? "TESLİM ALAN (İŞVEREN / İK YETKİLİSİ)" : "TESLİM EDEN (İŞVEREN / İK YETKİLİSİ)"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Kaşe / Yetkili İmza</p>
              <div className="h-16 border-b border-dashed border-slate-300 mt-2 mb-2 flex items-end justify-center">
                {/* İmza Alanı */}
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {companySettings.eDevletCredentials?.managerName || "Şirket Yetkilisi"}
              </p>
              <p className="text-[10px] text-slate-500">Tarih: {formatTRDate(todayStr)}</p>
            </div>

            <div className="border border-slate-300 rounded-lg p-4 text-center bg-white">
              <p className="font-bold text-xs text-slate-900 uppercase">
                {isReturn ? "TESLİM EDEN (PERSONEL)" : "TESLİM ALAN (ZİMMETLİ PERSONEL)"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Okudum, Teslim Aldım (Islak İmza)</p>
              <div className="h-16 border-b border-dashed border-slate-300 mt-2 mb-2 flex items-end justify-center">
                {/* İmza Alanı */}
              </div>
              <p className="text-xs font-semibold text-slate-800">{empName}</p>
              <p className="text-[10px] text-slate-500">T.C. No: {empTckn} • Tarih: {formatTRDate(todayStr)}</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
            İşbu tutanak iki (2) nüsha olarak tanzim edilmiş olup, bir nüshası personele teslim edilmiş, diğeri personelin özlük dosyasında muhafaza edilmektedir. • Muavin ERP & İK Sistemi
          </div>
        </div>
      </div>
    </div>
  );
};
