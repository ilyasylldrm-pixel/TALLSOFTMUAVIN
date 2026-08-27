import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Car,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  Headphones,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  Hash,
} from "lucide-react";
import {
  AssetCustody,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  Employee,
  Branch,
  Warehouse,
} from "../types";

interface AssetCustodyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: AssetCustody) => void;
  editingAsset?: AssetCustody | null;
  employees: Employee[];
  branches?: Branch[];
  warehouses?: Warehouse[];
}

export const AssetCustodyModal: React.FC<AssetCustodyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAsset,
  employees,
  branches = [],
  warehouses = [],
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  // Employee sorting
  const sortedEmployees = [...employees].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "tr")
  );

  // Form States
  const [employeeId, setEmployeeId] = useState<string>(
    editingAsset?.employeeId || (sortedEmployees.length > 0 ? sortedEmployees[0].id : "")
  );
  const [category, setCategory] = useState<AssetCategory>(
    editingAsset?.category || "vehicle"
  );
  const [assetName, setAssetName] = useState(editingAsset?.assetName || "");
  const [brand, setBrand] = useState(editingAsset?.brand || "");
  const [model, setModel] = useState(editingAsset?.model || "");
  const [serialNumber, setSerialNumber] = useState(editingAsset?.serialNumber || "");
  const [barcodeNumber, setBarcodeNumber] = useState(
    editingAsset?.barcodeNumber || `ZIM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [inventoryNumber, setInventoryNumber] = useState(editingAsset?.inventoryNumber || "");
  const [assignedDate, setAssignedDate] = useState(editingAsset?.assignedDate || todayStr);
  const [returnDate, setReturnDate] = useState(editingAsset?.returnDate || "");
  const [status, setStatus] = useState<AssetStatus>(editingAsset?.status || "active");
  const [conditionOnDelivery, setConditionOnDelivery] = useState<AssetCondition>(
    editingAsset?.conditionOnDelivery || "new"
  );
  const [approximateValue, setApproximateValue] = useState<number | "">(
    editingAsset?.approximateValue !== undefined ? editingAsset.approximateValue : ""
  );
  const [branchId, setBranchId] = useState(editingAsset?.branchId || "");
  const [warehouseId, setWarehouseId] = useState(editingAsset?.warehouseId || "");
  const [notes, setNotes] = useState(editingAsset?.notes || "");

  // Category-Specific: Vehicle Details
  const [plateNumber, setPlateNumber] = useState(editingAsset?.vehicleDetails?.plateNumber || "");
  const [chassisNumber, setChassisNumber] = useState(editingAsset?.vehicleDetails?.chassisNumber || "");
  const [engineNumber, setEngineNumber] = useState(editingAsset?.vehicleDetails?.engineNumber || "");
  const [fuelType, setFuelType] = useState(editingAsset?.vehicleDetails?.fuelType || "Benzin");
  const [currentKm, setCurrentKm] = useState<number | "">(
    editingAsset?.vehicleDetails?.currentKm !== undefined ? editingAsset.vehicleDetails.currentKm : 0
  );
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(
    editingAsset?.vehicleDetails?.insuranceExpiryDate || ""
  );
  const [kaskoExpiryDate, setKaskoExpiryDate] = useState(
    editingAsset?.vehicleDetails?.kaskoExpiryDate || ""
  );
  const [inspectionExpiryDate, setInspectionExpiryDate] = useState(
    editingAsset?.vehicleDetails?.inspectionExpiryDate || ""
  );
  const [fuelCardNumber, setFuelCardNumber] = useState(
    editingAsset?.vehicleDetails?.fuelCardNumber || ""
  );
  const [hgsNumber, setHgsNumber] = useState(editingAsset?.vehicleDetails?.hgsNumber || "");
  const [hasSpareKey, setHasSpareKey] = useState(
    editingAsset?.vehicleDetails?.hasSpareKey !== undefined ? editingAsset.vehicleDetails.hasSpareKey : true
  );
  const [hasLicenseCard, setHasLicenseCard] = useState(
    editingAsset?.vehicleDetails?.hasLicenseCard !== undefined ? editingAsset.vehicleDetails.hasLicenseCard : true
  );
  const [hasTrafficSet, setHasTrafficSet] = useState(
    editingAsset?.vehicleDetails?.hasTrafficSet !== undefined ? editingAsset.vehicleDetails.hasTrafficSet : true
  );

  // Category-Specific: Computer Details
  const [computerType, setComputerType] = useState<"laptop" | "desktop" | "workstation" | "all_in_one" | "server">(
    editingAsset?.computerDetails?.computerType || "laptop"
  );
  const [processor, setProcessor] = useState(editingAsset?.computerDetails?.processor || "");
  const [ram, setRam] = useState(editingAsset?.computerDetails?.ram || "16 GB");
  const [storage, setStorage] = useState(editingAsset?.computerDetails?.storage || "512 GB SSD");
  const [operatingSystem, setOperatingSystem] = useState(
    editingAsset?.computerDetails?.operatingSystem || "Windows 11 Pro"
  );
  const [macAddress, setMacAddress] = useState(editingAsset?.computerDetails?.macAddress || "");
  const [screenSize, setScreenSize] = useState(editingAsset?.computerDetails?.screenSize || "");
  const [includesCharger, setIncludesCharger] = useState(
    editingAsset?.computerDetails?.includesCharger !== undefined ? editingAsset.computerDetails.includesCharger : true
  );
  const [includesBag, setIncludesBag] = useState(
    editingAsset?.computerDetails?.includesBag !== undefined ? editingAsset.computerDetails.includesBag : true
  );
  const [includesMouse, setIncludesMouse] = useState(
    editingAsset?.computerDetails?.includesMouse !== undefined ? editingAsset.computerDetails.includesMouse : true
  );
  const [includesLock, setIncludesLock] = useState(
    editingAsset?.computerDetails?.includesLock !== undefined ? editingAsset.computerDetails.includesLock : false
  );

  // Category-Specific: Phone Details
  const [imei1, setImei1] = useState(editingAsset?.phoneDetails?.imei1 || "");
  const [imei2, setImei2] = useState(editingAsset?.phoneDetails?.imei2 || "");
  const [phoneNumber, setPhoneNumber] = useState(editingAsset?.phoneDetails?.phoneNumber || "");
  const [simCardNumber, setSimCardNumber] = useState(editingAsset?.phoneDetails?.simCardNumber || "");
  const [storageCapacity, setStorageCapacity] = useState(editingAsset?.phoneDetails?.storageCapacity || "256 GB");
  const [color, setColor] = useState(editingAsset?.phoneDetails?.color || "");
  const [phoneIncludesCharger, setPhoneIncludesCharger] = useState(
    editingAsset?.phoneDetails?.includesCharger !== undefined ? editingAsset.phoneDetails.includesCharger : true
  );
  const [phoneIncludesHeadphones, setPhoneIncludesHeadphones] = useState(
    editingAsset?.phoneDetails?.includesHeadphones !== undefined ? editingAsset.phoneDetails.includesHeadphones : false
  );
  const [phoneIncludesCaseScreenProtector, setPhoneIncludesCaseScreenProtector] = useState(
    editingAsset?.phoneDetails?.includesCaseScreenProtector !== undefined ? editingAsset.phoneDetails.includesCaseScreenProtector : true
  );

  // Category-Specific: Tablet Details
  const [tabletType, setTabletType] = useState(editingAsset?.tabletDetails?.tabletType || "");
  const [tabletScreenSize, setTabletScreenSize] = useState(editingAsset?.tabletDetails?.screenSize || '11"');
  const [tabletImei, setTabletImei] = useState(editingAsset?.tabletDetails?.imei || "");
  const [hasCellular, setHasCellular] = useState(
    editingAsset?.tabletDetails?.hasCellular !== undefined ? editingAsset.tabletDetails.hasCellular : false
  );
  const [tabletStorage, setTabletStorage] = useState(editingAsset?.tabletDetails?.storageCapacity || "128 GB");
  const [includesStylus, setIncludesStylus] = useState(
    editingAsset?.tabletDetails?.includesStylus !== undefined ? editingAsset.tabletDetails.includesStylus : true
  );
  const [includesKeyboardCase, setIncludesKeyboardCase] = useState(
    editingAsset?.tabletDetails?.includesKeyboardCase !== undefined ? editingAsset.tabletDetails.includesKeyboardCase : false
  );
  const [tabletIncludesCharger, setTabletIncludesCharger] = useState(
    editingAsset?.tabletDetails?.includesCharger !== undefined ? editingAsset.tabletDetails.includesCharger : true
  );

  // Accessories List
  const [accessoriesList, setAccessoriesList] = useState<string[]>(
    editingAsset?.accessoriesList || []
  );
  const [newAccessoryText, setNewAccessoryText] = useState("");

  const handleAddAccessory = () => {
    if (newAccessoryText.trim()) {
      setAccessoriesList([...accessoriesList, newAccessoryText.trim()]);
      setNewAccessoryText("");
    }
  };

  const handleRemoveAccessory = (index: number) => {
    setAccessoriesList(accessoriesList.filter((_, idx) => idx !== index));
  };

  // Quick Preset Helper for Fast Fill
  const handleQuickPreset = (presetType: string) => {
    if (presetType === "vehicle_megane") {
      setCategory("vehicle");
      setAssetName("2024 Renault Megane Touch 1.3 TCe EDC");
      setBrand("Renault");
      setModel("Megane IV Touch");
      setPlateNumber("34 MAV 789");
      setFuelType("Benzin");
      setCurrentKm(15000);
      setApproximateValue(1350000);
      setAccessoriesList(["Yedek Anahtar", "Trafik Seti & Yangın Tüpü", "Ruhsat Belgesi", "Yakıt Kartı"]);
    } else if (presetType === "macbook_m3") {
      setCategory("computer");
      setAssetName("Apple MacBook Pro 16\" M3 Max");
      setBrand("Apple");
      setModel("MacBook Pro 16\" Space Black");
      setComputerType("laptop");
      setProcessor("Apple M3 Max 14-Core");
      setRam("36 GB");
      setStorage("1 TB SSD");
      setOperatingSystem("macOS Sonoma");
      setApproximateValue(145000);
      setAccessoriesList(["140W Güç Adaptörü", "MagSafe Şarj Kablosu", "Tucano Sırt Çantası", "Magic Mouse"]);
    } else if (presetType === "iphone15") {
      setCategory("phone");
      setAssetName("Apple iPhone 15 Pro 256GB");
      setBrand("Apple");
      setModel("iPhone 15 Pro");
      setStorageCapacity("256 GB");
      setColor("Natürel Titanyum");
      setApproximateValue(75000);
      setAccessoriesList(["20W Hızlı Şarj Adaptörü", "Örgülü Type-C Kablo", "Kılıf & Ekran Koruyucu"]);
    } else if (presetType === "ipad_pro") {
      setCategory("tablet");
      setAssetName("Apple iPad Pro 11\" M4 + Apple Pencil Pro");
      setBrand("Apple");
      setModel("iPad Pro 11\" M4");
      setTabletType("iPad Pro 11 inç");
      setTabletStorage("256 GB");
      setIncludesStylus(true);
      setIncludesKeyboardCase(true);
      setApproximateValue(54000);
      setAccessoriesList(["Apple Pencil Pro", "Magic Keyboard", "20W Şarj Adaptörü"]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEmp = employees.find((emp) => emp.id === employeeId);
    const selectedBranch = branches.find((b) => b.id === branchId);
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

    const newAsset: AssetCustody = {
      id: editingAsset?.id || `zim_${Date.now()}`,
      employeeId,
      employeeName: selectedEmp ? selectedEmp.fullName : "Bilinmeyen Personel",
      employeeDepartment: selectedEmp?.department,
      employeeTitle: selectedEmp?.title,
      category,
      assetName: assetName || `${brand} ${model}`,
      brand,
      model,
      serialNumber: serialNumber || undefined,
      barcodeNumber: barcodeNumber || undefined,
      inventoryNumber: inventoryNumber || undefined,
      assignedDate,
      returnDate: returnDate || undefined,
      status,
      conditionOnDelivery,
      approximateValue: typeof approximateValue === "number" ? approximateValue : undefined,
      currency: "₺",
      notes: notes || undefined,
      branchId: branchId || selectedEmp?.branchId,
      branchName: selectedBranch?.name || selectedEmp?.branchName,
      warehouseId: warehouseId || undefined,
      warehouseName: selectedWarehouse?.name || undefined,
      accessoriesList: accessoriesList.length > 0 ? accessoriesList : undefined,
      createdAt: editingAsset?.createdAt || todayStr,

      // Vehicle
      vehicleDetails:
        category === "vehicle"
          ? {
              plateNumber,
              chassisNumber: chassisNumber || undefined,
              engineNumber: engineNumber || undefined,
              fuelType,
              currentKm: typeof currentKm === "number" ? currentKm : 0,
              insuranceExpiryDate: insuranceExpiryDate || undefined,
              kaskoExpiryDate: kaskoExpiryDate || undefined,
              inspectionExpiryDate: inspectionExpiryDate || undefined,
              fuelCardNumber: fuelCardNumber || undefined,
              hgsNumber: hgsNumber || undefined,
              hasSpareKey,
              hasLicenseCard,
              hasTrafficSet,
            }
          : undefined,

      // Computer
      computerDetails:
        category === "computer"
          ? {
              computerType,
              processor: processor || "Standart İşlemci",
              ram: ram || "16 GB",
              storage: storage || "512 GB SSD",
              operatingSystem: operatingSystem || "Windows 11 Pro",
              macAddress: macAddress || undefined,
              screenSize: screenSize || undefined,
              includesCharger,
              includesBag,
              includesMouse,
              includesLock,
            }
          : undefined,

      // Phone
      phoneDetails:
        category === "phone"
          ? {
              imei1: imei1 || "000000000000000",
              imei2: imei2 || undefined,
              phoneNumber: phoneNumber || undefined,
              simCardNumber: simCardNumber || undefined,
              storageCapacity: storageCapacity || undefined,
              color: color || undefined,
              includesCharger: phoneIncludesCharger,
              includesHeadphones: phoneIncludesHeadphones,
              includesCaseScreenProtector: phoneIncludesCaseScreenProtector,
            }
          : undefined,

      // Tablet
      tabletDetails:
        category === "tablet"
          ? {
              tabletType: tabletType || model,
              screenSize: tabletScreenSize || undefined,
              imei: tabletImei || undefined,
              hasCellular,
              storageCapacity: tabletStorage || undefined,
              includesStylus,
              includesKeyboardCase,
              includesCharger: tabletIncludesCharger,
            }
          : undefined,
    };

    onSave(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
              {category === "vehicle" ? (
                <Car className="w-5 h-5 text-blue-200" />
              ) : category === "computer" ? (
                <Laptop className="w-5 h-5 text-indigo-200" />
              ) : category === "phone" ? (
                <Smartphone className="w-5 h-5 text-emerald-200" />
              ) : category === "tablet" ? (
                <Tablet className="w-5 h-5 text-amber-200" />
              ) : (
                <Package className="w-5 h-5 text-purple-200" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingAsset ? "Zimmet Kaydını Düzenle" : "Yeni Zimmet / Demirbaş Tahsisi"}
              </h2>
              <p className="text-xs text-blue-200">
                Personel üzerine araç, bilgisayar, cep telefonu, tablet ve donanım zimmetleme formu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets for New Assets */}
        {!editingAsset && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs overflow-x-auto shrink-0">
            <div className="flex items-center space-x-2 text-slate-500 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hızlı Şablonlar:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleQuickPreset("vehicle_megane")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
              >
                🚗 Şirket Aracı (Megane)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("macbook_m3")}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
              >
                💻 MacBook Pro M3
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("iphone15")}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
              >
                📱 iPhone 15 Pro
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("ipad_pro")}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
              >
                📟 iPad Pro + Pencil
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Temel Atama ve Kategori Seçimi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Personel Seçimi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Zimmetlenecek Personel *
              </label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {sortedEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.department || "Personel"} - {emp.title || "-"})
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori Seçimi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Demirbaş Kategorisi *
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-bold text-blue-900"
              >
                <option value="vehicle">🚗 Şirket Aracı (Binek / Panelvan)</option>
                <option value="computer">💻 Bilgisayar & Laptop</option>
                <option value="phone">📱 Cep Telefonu & GSM Hattı</option>
                <option value="tablet">📟 Tablet & iPad</option>
                <option value="peripheral">🎧 Donanım & Çevre Birimi</option>
                <option value="office">🏢 Ofis Demirbaşı</option>
                <option value="tool">🔧 İş Ekipmanı / El Aleti</option>
                <option value="other">📦 Diğer Eşya</option>
              </select>
            </div>

            {/* Zimmet Barkod / Demirbaş No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Zimmet / Demirbaş Kodu *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={barcodeNumber}
                  onChange={(e) => setBarcodeNumber(e.target.value)}
                  placeholder="Örn: ZIM-2026-0042"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Genel Eşya Bilgileri */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Package className="w-4 h-4 mr-1.5 text-slate-600" />
              Genel Demirbaş Bilgileri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Eşya / Demirbaş Tanımı *
                </label>
                <input
                  type="text"
                  required
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Örn: 2024 Renault Megane Touch"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Marka *
                </label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Örn: Renault, Apple, Dell"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Model / Sürüm *
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Örn: Megane IV, MacBook Pro 16"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Seri Numarası
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Cihaz seri no / S/N"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Teslim Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Teslim Anındaki Durumu *
                </label>
                <select
                  value={conditionOnDelivery}
                  onChange={(e) => setConditionOnDelivery(e.target.value as AssetCondition)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="new">Sıfır / Ambalajında</option>
                  <option value="excellent">Çok İyi / Kusursuz</option>
                  <option value="good">İyi / Çalışır Vaziyette</option>
                  <option value="fair">Orta / Kullanım İzi Var</option>
                  <option value="damaged">Hasarlı / Arızalı</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Rayiç Bedeli (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  value={approximateValue}
                  onChange={(e) => setApproximateValue(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Yaklaşık piyasa değeri ₺"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kategoriye Özel Dinamik Detaylar */}

          {/* --- ARAÇ FORMU --- */}
          {category === "vehicle" && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center">
                  <Car className="w-4 h-4 mr-1.5 text-blue-600" />
                  Şirket Aracı & Ruhsat Bilgileri
                </h3>
                <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                  Trafik & Kasko Takibi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plaka Numarası *
                  </label>
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="Örn: 34 ABC 789"
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teslim Kilometresi (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currentKm}
                    onChange={(e) => setCurrentKm(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Örn: 15400"
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yakıt Türü
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="Benzin">Benzin</option>
                    <option value="Dizel">Dizel</option>
                    <option value="Hibrit">Hibrit (HEV / PHEV)</option>
                    <option value="Elektrik">Tam Elektrikli (EV)</option>
                    <option value="LPG">Benzin & LPG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Şasi Numarası (VIN)
                  </label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                    placeholder="17 haneli şasi no"
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taşıt Tanıma / Yakıt Kartı
                  </label>
                  <input
                    type="text"
                    value={fuelCardNumber}
                    onChange={(e) => setFuelCardNumber(e.target.value)}
                    placeholder="Örn: OPET-OTOBIL-8492"
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HGS / OGS Etiket No
                  </label>
                  <input
                    type="text"
                    value={hgsNumber}
                    onChange={(e) => setHgsNumber(e.target.value)}
                    placeholder="HGS etiket numarası"
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zorunlu Trafik Sigortası Bitiş
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiryDate}
                    onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kasko Poliçesi Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={kaskoExpiryDate}
                    onChange={(e) => setKaskoExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    TÜVTÜRK Muayene Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={inspectionExpiryDate}
                    onChange={(e) => setInspectionExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Araç Teslim Kontrol Onayları */}
              <div className="pt-2 border-t border-blue-200/80 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSpareKey}
                    onChange={(e) => setHasSpareKey(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>🔑 Yedek Anahtar Teslim Edildi</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLicenseCard}
                    onChange={(e) => setHasLicenseCard(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>📄 Araç Ruhsatı Teslim Edildi</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTrafficSet}
                    onChange={(e) => setHasTrafficSet(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>🧯 Trafik Seti & Yangın Tüpü Mevcut</span>
                </label>
              </div>
            </div>
          )}

          {/* --- BİLGİSAYAR FORMU --- */}
          {category === "computer" && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                  <Laptop className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Bilgisayar & Donanım Teknik Özellikleri
                </h3>
                <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold">
                  IT Envanteri
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bilgisayar Türü *
                  </label>
                  <select
                    value={computerType}
                    onChange={(e) => setComputerType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value="laptop">Dizüstü (Laptop)</option>
                    <option value="desktop">Masaüstü (Desktop PC)</option>
                    <option value="workstation">İş İstasyonu (Workstation)</option>
                    <option value="all_in_one">All-in-One PC</option>
                    <option value="server">Sunucu / Server</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İşlemci (CPU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={processor}
                    onChange={(e) => setProcessor(e.target.value)}
                    placeholder="Örn: Apple M3 Max, Intel i7-13700H"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bellek (RAM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    placeholder="Örn: 16 GB, 32 GB, 64 GB"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Depolama (SSD / Disk) *
                  </label>
                  <input
                    type="text"
                    required
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    placeholder="Örn: 512 GB NVMe, 1 TB SSD"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İşletim Sistemi
                  </label>
                  <input
                    type="text"
                    value={operatingSystem}
                    onChange={(e) => setOperatingSystem(e.target.value)}
                    placeholder="Örn: Windows 11 Pro, macOS Sonoma"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MAC Adresi / Ekran Boyutu
                  </label>
                  <input
                    type="text"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="Örn: 3C:22:FB:4A:8C:91"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Bilgisayar Aksesuar Onayları */}
              <div className="pt-2 border-t border-indigo-200/80 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesCharger}
                    onChange={(e) => setIncludesCharger(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span>🔌 Orijinal Şarj Adaptörü</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesBag}
                    onChange={(e) => setIncludesBag(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span>💼 Laptop Taşıma Çantası</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesMouse}
                    onChange={(e) => setIncludesMouse(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span>🖱️ Kablosuz Mouse & Klavye</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesLock}
                    onChange={(e) => setIncludesLock(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span>🔒 Güvenlik Kilidi</span>
                </label>
              </div>
            </div>
          )}

          {/* --- CEP TELEFONU FORMU --- */}
          {category === "phone" && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                  <Smartphone className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Cep Telefonu & Kurumsal GSM Hattı Detayları
                </h3>
                <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                  GSM & IMEI Kaydı
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IMEI 1 Numarası (15 Haneli) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={imei1}
                    onChange={(e) => setImei1(e.target.value.replace(/\D/g, ""))}
                    placeholder="358492019482019"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IMEI 2 (Çift SIM / e-SIM)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={imei2}
                    onChange={(e) => setImei2(e.target.value.replace(/\D/g, ""))}
                    placeholder="İkinci IMEI (opsiyonel)"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahsis Edilen GSM Hat Numarası
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Örn: +90 532 123 45 67"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dahili Depolama
                  </label>
                  <input
                    type="text"
                    value={storageCapacity}
                    onChange={(e) => setStorageCapacity(e.target.value)}
                    placeholder="Örn: 128 GB, 256 GB, 512 GB"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cihaz Rengi
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Örn: Siyah, Titanyum Mavi"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SIM Kart Seri No (ICCID)
                  </label>
                  <input
                    type="text"
                    value={simCardNumber}
                    onChange={(e) => setSimCardNumber(e.target.value)}
                    placeholder="SIM kart barkod / ICCID"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Telefon Aksesuar Onayları */}
              <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneIncludesCharger}
                    onChange={(e) => setPhoneIncludesCharger(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>🔌 Şarj Adaptörü ve Kablosu</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneIncludesCaseScreenProtector}
                    onChange={(e) => setPhoneIncludesCaseScreenProtector(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>🛡️ Koruyucu Kılıf ve Kırılmaz Cam</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneIncludesHeadphones}
                    onChange={(e) => setPhoneIncludesHeadphones(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>🎧 Kulaklık</span>
                </label>
              </div>
            </div>
          )}

          {/* --- TABLET FORMU --- */}
          {category === "tablet" && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center">
                  <Tablet className="w-4 h-4 mr-1.5 text-amber-600" />
                  Tablet & iPad Donanım Detayları
                </h3>
                <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                  Mobil Saha Donanımı
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tablet Modeli & Ekran Boyutu *
                  </label>
                  <input
                    type="text"
                    required
                    value={tabletType}
                    onChange={(e) => setTabletType(e.target.value)}
                    placeholder="Örn: iPad Pro 11 inç M4"
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Depolama Kapasitesi
                  </label>
                  <input
                    type="text"
                    value={tabletStorage}
                    onChange={(e) => setTabletStorage(e.target.value)}
                    placeholder="Örn: 128 GB, 256 GB"
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hücresel Bağlantı (SIM / Cellular)
                  </label>
                  <select
                    value={hasCellular ? "yes" : "no"}
                    onChange={(e) => setHasCellular(e.target.value === "yes")}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                  >
                    <option value="no">Yalnızca Wi-Fi</option>
                    <option value="yes">Wi-Fi + Cellular (SIM Kartlı)</option>
                  </select>
                </div>
              </div>

              {/* Tablet Aksesuar Onayları */}
              <div className="pt-2 border-t border-amber-200/80 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesStylus}
                    onChange={(e) => setIncludesStylus(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span>✏️ Apple Pencil / Stylus Kalem</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesKeyboardCase}
                    onChange={(e) => setIncludesKeyboardCase(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span>⌨️ Magic Keyboard / Klavyeli Kılıf</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tabletIncludesCharger}
                    onChange={(e) => setTabletIncludesCharger(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span>🔌 Orijinal Şarj Başlığı ve Kablo</span>
                </label>
              </div>
            </div>
          )}

          {/* Section 4: Teslim Edilen Ek Aksesuarlar ve Parçalar Listesi */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Teslim Edilen Ek Malzeme & Aksesuarlar Listesi
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newAccessoryText}
                onChange={(e) => setNewAccessoryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAccessory();
                  }
                }}
                placeholder="Örn: HDMI Kablo, Taşıma Çantası, Yedek Anahtar, Monitör Ayağı..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddAccessory}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ekle
              </button>
            </div>

            {accessoriesList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {accessoriesList.map((acc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 shadow-sm"
                  >
                    ✓ {acc}
                    <button
                      type="button"
                      onClick={() => handleRemoveAccessory(idx)}
                      className="ml-2 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Notlar ve Şube/Depo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Bağlı Şube
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Merkez Genel Müdürlük</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                İlişkili Depo (Varsa)
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Depo Yok / Ofis Kullanımı</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Zimmet Durumu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="active">Zimmetli (Kullanımda)</option>
                <option value="returned">İade Edildi (Boşta / Depoda)</option>
                <option value="maintenance">Bakım & Serviste</option>
                <option value="damaged">Hasarlı / Arızalı</option>
                <option value="scrapped">Hurdaya Ayrıldı</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Özel Notlar ve Teslim Açıklaması
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zimmet şartları, özel kullanım talimatları veya cihaz geçmişi..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors cursor-pointer flex items-center"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {editingAsset ? "Değişiklikleri Kaydet" : "Zimmeti Onayla ve Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
