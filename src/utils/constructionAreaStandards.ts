import { CommonAreaItem, ApartmentRoomItem, ApartmentUnitConfig } from "../types";

/**
 * Planlı Alanlar İmar Yönetmeliği Madde 29 Standartları
 * Konutlarda bulunması zorunlu piyesler ve asgari ölçüleri
 */
export const ZONING_REGULATION_M29 = {
  SALON: { minM2: 12.0, minWidth: 2.8, name: "Oturma Odası (Salon)" },
  YATAK_ODASI_1: { minM2: 9.0, minWidth: 2.52, name: "Ebeveyn Yatak Odası" },
  YATAK_ODASI_ILAVE: { minM2: 8.0, minWidth: 2.1, name: "İlave Yatak Odası" },
  MUTFAK_BAGIMSIZ: { minM2: 5.0, minWidth: 1.5, name: "Bağımsız Mutfak" },
  MUTFAK_ACIK: { minM2: 3.3, minWidth: 1.5, name: "Açık / Niş Mutfak" },
  BANYO: { minM2: 3.0, minWidth: 1.5, name: "Genel Banyo" },
  EBEVEYN_BANYO: { minM2: 2.5, minWidth: 1.2, name: "Ebeveyn Banyosu" },
  WC: { minM2: 1.2, minWidth: 1.0, name: "Tuvalet (WC / Lavabo)" },
  ANTRE_HOL: { minM2: 1.2, minWidth: 1.2, name: "Antre & Kat Holü" },
  BALKON: { minM2: 1.5, minWidth: 1.0, name: "Balkon" },
};

/**
 * Verilen net m² ve daire tipine göre yönetmeliğe uygun oda (piyes) dağılımını hesaplar.
 * Hiçbir piyes yasal asgari sınırın altına düşemez.
 */
export function calculateRoomsForApartment(
  type: string,
  targetNetM2: number
): ApartmentRoomItem[] {
  const cleanType = type.trim();
  const rooms: ApartmentRoomItem[] = [];

  let allocatedTotal = 0;

  if (cleanType === "1+1") {
    // 1+1: Salon+Açık Mutfak veya Salon, 1 Yatak Odası, Banyo, Antre, Balkon
    const isBig = targetNetM2 >= 55;
    const salonM2 = Math.max(12.0, Math.round(targetNetM2 * 0.42 * 10) / 10);
    const yatakM2 = Math.max(9.0, Math.round(targetNetM2 * 0.26 * 10) / 10);
    const mutfakM2 = isBig
      ? Math.max(5.0, Math.round(targetNetM2 * 0.12 * 10) / 10)
      : Math.max(3.5, Math.round(targetNetM2 * 0.1 * 10) / 10);
    const banyoM2 = Math.max(3.0, Math.round(targetNetM2 * 0.09 * 10) / 10);
    const antreM2 = Math.max(1.5, Math.round(targetNetM2 * 0.08 * 10) / 10);
    const remaining = Math.max(1.5, targetNetM2 - (salonM2 + yatakM2 + mutfakM2 + banyoM2 + antreM2));

    rooms.push(
      { id: "r_sal", name: "Oturma Odası (Salon)", minM2: 12.0, minWidthMeter: 2.8, calculatedM2: salonM2, isCompliant: salonM2 >= 12.0 },
      { id: "r_yat1", name: "Yatak Odası", minM2: 9.0, minWidthMeter: 2.52, calculatedM2: yatakM2, isCompliant: yatakM2 >= 9.0 },
      { id: "r_mut", name: isBig ? "Mutfak" : "Açık Mutfak / Niş", minM2: isBig ? 5.0 : 3.3, minWidthMeter: 1.5, calculatedM2: mutfakM2, isCompliant: mutfakM2 >= (isBig ? 5.0 : 3.3) },
      { id: "r_ban", name: "Genel Banyo", minM2: 3.0, minWidthMeter: 1.5, calculatedM2: banyoM2, isCompliant: banyoM2 >= 3.0 },
      { id: "r_ant", name: "Giriş Antresi & Hol", minM2: 1.2, minWidthMeter: 1.2, calculatedM2: antreM2, isCompliant: antreM2 >= 1.2 },
      { id: "r_bal", name: "Balkon", minM2: 1.5, minWidthMeter: 1.0, calculatedM2: Math.round(remaining * 10) / 10, isCompliant: remaining >= 1.5 }
    );
  } else if (cleanType === "2+1") {
    // 2+1: Salon, Ebeveyn Yatak Odası, Çocuk Odası, Mutfak, Banyo, WC, Antre, Balkon
    const salonM2 = Math.max(14.0, Math.round(targetNetM2 * 0.32 * 10) / 10);
    const ebeveynM2 = Math.max(11.0, Math.round(targetNetM2 * 0.18 * 10) / 10);
    const cocukM2 = Math.max(8.5, Math.round(targetNetM2 * 0.14 * 10) / 10);
    const mutfakM2 = Math.max(7.0, Math.round(targetNetM2 * 0.12 * 10) / 10);
    const banyoM2 = Math.max(4.2, Math.round(targetNetM2 * 0.06 * 10) / 10);
    const wcM2 = Math.max(1.5, Math.round(targetNetM2 * 0.03 * 10) / 10);
    const antreM2 = Math.max(5.0, Math.round(targetNetM2 * 0.08 * 10) / 10);
    const remaining = Math.max(2.5, targetNetM2 - (salonM2 + ebeveynM2 + cocukM2 + mutfakM2 + banyoM2 + wcM2 + antreM2));

    rooms.push(
      { id: "r_sal", name: "Oturma Odası (Salon)", minM2: 12.0, minWidthMeter: 2.8, calculatedM2: salonM2, isCompliant: salonM2 >= 12.0 },
      { id: "r_ebv", name: "Ebeveyn Yatak Odası", minM2: 9.0, minWidthMeter: 2.52, calculatedM2: ebeveynM2, isCompliant: ebeveynM2 >= 9.0 },
      { id: "r_coc", name: "Çocuk / İlave Yatak Odası", minM2: 8.0, minWidthMeter: 2.1, calculatedM2: cocukM2, isCompliant: cocukM2 >= 8.0 },
      { id: "r_mut", name: "Bağımsız Mutfak", minM2: 5.0, minWidthMeter: 1.5, calculatedM2: mutfakM2, isCompliant: mutfakM2 >= 5.0 },
      { id: "r_ban", name: "Genel Banyo", minM2: 3.0, minWidthMeter: 1.5, calculatedM2: banyoM2, isCompliant: banyoM2 >= 3.0 },
      { id: "r_wc", name: "Misafir Tuvaleti (WC)", minM2: 1.2, minWidthMeter: 1.0, calculatedM2: wcM2, isCompliant: wcM2 >= 1.2 },
      { id: "r_ant", name: "Antre & Koridor", minM2: 1.2, minWidthMeter: 1.2, calculatedM2: antreM2, isCompliant: antreM2 >= 1.2 },
      { id: "r_bal", name: "Balkon", minM2: 1.5, minWidthMeter: 1.0, calculatedM2: Math.round(remaining * 10) / 10, isCompliant: remaining >= 1.5 }
    );
  } else if (cleanType === "3+1") {
    // 3+1: Salon, Ebeveyn Yatak Odası + Ebeveyn Banyosu, 2 İlave Yatak Odası, Mutfak, Banyo, WC, Antre, 2 Balkon
    const salonM2 = Math.max(22.0, Math.round(targetNetM2 * 0.28 * 10) / 10);
    const ebeveynM2 = Math.max(14.0, Math.round(targetNetM2 * 0.15 * 10) / 10);
    const ebvBanyoM2 = Math.max(3.0, Math.round(targetNetM2 * 0.03 * 10) / 10);
    const oda2M2 = Math.max(10.0, Math.round(targetNetM2 * 0.11 * 10) / 10);
    const oda3M2 = Math.max(9.5, Math.round(targetNetM2 * 0.1 * 10) / 10);
    const mutfakM2 = Math.max(10.0, Math.round(targetNetM2 * 0.11 * 10) / 10);
    const banyoM2 = Math.max(5.0, Math.round(targetNetM2 * 0.05 * 10) / 10);
    const wcM2 = Math.max(2.0, Math.round(targetNetM2 * 0.025 * 10) / 10);
    const antreM2 = Math.max(8.0, Math.round(targetNetM2 * 0.09 * 10) / 10);
    const remaining = Math.max(4.0, targetNetM2 - (salonM2 + ebeveynM2 + ebvBanyoM2 + oda2M2 + oda3M2 + mutfakM2 + banyoM2 + wcM2 + antreM2));

    rooms.push(
      { id: "r_sal", name: "Oturma Odası (Salon)", minM2: 12.0, minWidthMeter: 2.8, calculatedM2: salonM2, isCompliant: salonM2 >= 12.0 },
      { id: "r_ebv", name: "Ebeveyn Yatak Odası", minM2: 9.0, minWidthMeter: 2.52, calculatedM2: ebeveynM2, isCompliant: ebeveynM2 >= 9.0 },
      { id: "r_eban", name: "Ebeveyn Banyosu", minM2: 2.5, minWidthMeter: 1.2, calculatedM2: ebvBanyoM2, isCompliant: ebvBanyoM2 >= 2.5 },
      { id: "r_od2", name: "Çocuk Odası (1)", minM2: 8.0, minWidthMeter: 2.1, calculatedM2: oda2M2, isCompliant: oda2M2 >= 8.0 },
      { id: "r_od3", name: "Çocuk / Çalışma Odası (2)", minM2: 8.0, minWidthMeter: 2.1, calculatedM2: oda3M2, isCompliant: oda3M2 >= 8.0 },
      { id: "r_mut", name: "Geniş Mutfak & Yemek Alanı", minM2: 5.0, minWidthMeter: 1.5, calculatedM2: mutfakM2, isCompliant: mutfakM2 >= 5.0 },
      { id: "r_ban", name: "Ana Banyo", minM2: 3.0, minWidthMeter: 1.5, calculatedM2: banyoM2, isCompliant: banyoM2 >= 3.0 },
      { id: "r_wc", name: "Misafir Tuvaleti", minM2: 1.2, minWidthMeter: 1.0, calculatedM2: wcM2, isCompliant: wcM2 >= 1.2 },
      { id: "r_ant", name: "Giriş Holü & Gece Koridoru", minM2: 1.2, minWidthMeter: 1.2, calculatedM2: antreM2, isCompliant: antreM2 >= 1.2 },
      { id: "r_bal", name: "Ana Balkon + Mutfak Balkonu", minM2: 2.0, minWidthMeter: 1.0, calculatedM2: Math.round(remaining * 10) / 10, isCompliant: remaining >= 2.0 }
    );
  } else if (cleanType === "4+1" || cleanType.includes("4+1")) {
    // 4+1: Salon, Ebeveyn Süiti, 3 İlave Yatak Odası, Çamaşır Odası, Mutfak, 2 Banyo, WC, Balkonlar
    const salonM2 = Math.max(30.0, Math.round(targetNetM2 * 0.26 * 10) / 10);
    const ebeveynM2 = Math.max(16.0, Math.round(targetNetM2 * 0.14 * 10) / 10);
    const ebvBanyoM2 = Math.max(4.0, Math.round(targetNetM2 * 0.03 * 10) / 10);
    const oda2M2 = Math.max(12.0, Math.round(targetNetM2 * 0.09 * 10) / 10);
    const oda3M2 = Math.max(11.0, Math.round(targetNetM2 * 0.085 * 10) / 10);
    const oda4M2 = Math.max(10.0, Math.round(targetNetM2 * 0.08 * 10) / 10);
    const mutfakM2 = Math.max(13.0, Math.round(targetNetM2 * 0.1 * 10) / 10);
    const banyoM2 = Math.max(5.5, Math.round(targetNetM2 * 0.045 * 10) / 10);
    const camasirM2 = Math.max(2.5, Math.round(targetNetM2 * 0.02 * 10) / 10);
    const wcM2 = Math.max(2.2, Math.round(targetNetM2 * 0.02 * 10) / 10);
    const antreM2 = Math.max(12.0, Math.round(targetNetM2 * 0.08 * 10) / 10);
    const remaining = Math.max(6.0, targetNetM2 - (salonM2 + ebeveynM2 + ebvBanyoM2 + oda2M2 + oda3M2 + oda4M2 + mutfakM2 + banyoM2 + camasirM2 + wcM2 + antreM2));

    rooms.push(
      { id: "r_sal", name: "Geniş Salon", minM2: 12.0, minWidthMeter: 2.8, calculatedM2: salonM2, isCompliant: true },
      { id: "r_ebv", name: "Ebeveyn Yatak Odası & Giyinme", minM2: 9.0, minWidthMeter: 2.52, calculatedM2: ebeveynM2, isCompliant: true },
      { id: "r_eban", name: "Ebeveyn Banyosu", minM2: 2.5, minWidthMeter: 1.2, calculatedM2: ebvBanyoM2, isCompliant: true },
      { id: "r_od2", name: "Yatak Odası (2)", minM2: 8.0, minWidthMeter: 2.1, calculatedM2: oda2M2, isCompliant: true },
      { id: "r_od3", name: "Yatak Odası (3)", minM2: 8.0, minWidthMeter: 2.1, calculatedM2: oda3M2, isCompliant: true },
      { id: "r_od4", name: "Misafir / Çalışma Odası (4)", minM2: 8.0, minWidthMeter: 2.1, calculatedM2: oda4M2, isCompliant: true },
      { id: "r_mut", name: "Mutfak & Kiler / Ada Mutfak", minM2: 5.0, minWidthMeter: 1.5, calculatedM2: mutfakM2, isCompliant: true },
      { id: "r_ban", name: "Genel Aile Banyosu", minM2: 3.0, minWidthMeter: 1.5, calculatedM2: banyoM2, isCompliant: true },
      { id: "r_cam", name: "Çamaşır & Ütü Odası", minM2: 2.0, minWidthMeter: 1.0, calculatedM2: camasirM2, isCompliant: true },
      { id: "r_wc", name: "Misafir WC & Lavabo", minM2: 1.2, minWidthMeter: 1.0, calculatedM2: wcM2, isCompliant: true },
      { id: "r_ant", name: "Giriş Holü & Koridorlar", minM2: 1.2, minWidthMeter: 1.2, calculatedM2: antreM2, isCompliant: true },
      { id: "r_bal", name: "Geniş Teras / Balkonlar", minM2: 2.0, minWidthMeter: 1.0, calculatedM2: Math.round(remaining * 10) / 10, isCompliant: true }
    );
  } else {
    // Genel daire tipi
    const salonM2 = Math.max(16.0, Math.round(targetNetM2 * 0.35 * 10) / 10);
    const odaM2 = Math.max(11.0, Math.round(targetNetM2 * 0.22 * 10) / 10);
    const mutM2 = Math.max(7.0, Math.round(targetNetM2 * 0.15 * 10) / 10);
    const banM2 = Math.max(4.0, Math.round(targetNetM2 * 0.08 * 10) / 10);
    const antM2 = Math.max(4.0, Math.round(targetNetM2 * 0.08 * 10) / 10);
    const remaining = Math.max(3.0, targetNetM2 - (salonM2 + odaM2 + mutM2 + banM2 + antM2));

    rooms.push(
      { id: "r_sal", name: "Oturma Odası (Salon)", minM2: 12.0, minWidthMeter: 2.8, calculatedM2: salonM2, isCompliant: true },
      { id: "r_od1", name: "Yatak Odası", minM2: 9.0, minWidthMeter: 2.52, calculatedM2: odaM2, isCompliant: true },
      { id: "r_mut", name: "Mutfak", minM2: 5.0, minWidthMeter: 1.5, calculatedM2: mutM2, isCompliant: true },
      { id: "r_ban", name: "Banyo", minM2: 3.0, minWidthMeter: 1.5, calculatedM2: banM2, isCompliant: true },
      { id: "r_ant", name: "Antre & Hol", minM2: 1.2, minWidthMeter: 1.2, calculatedM2: antM2, isCompliant: true },
      { id: "r_bal", name: "Balkon", minM2: 1.5, minWidthMeter: 1.0, calculatedM2: Math.round(remaining * 10) / 10, isCompliant: true }
    );
  }

  return rooms;
}

/**
 * Toplam inşaat alanına ve birim sayısına göre standart ortak kullanım alanları listesi üretir
 */
export function generateDefaultCommonAreas(
  grossAreaM2: number,
  unitCount: number = 24
): CommonAreaItem[] {
  const gross = Math.max(100, grossAreaM2 || 3000);
  const units = Math.max(1, unitCount || 24);

  // Otopark: Otopark Yönetmeliği min. 1 araç / bağımsız bölüm (her araç için sirkülasyon dahil ~25-30 m²)
  const parkingM2 = Math.round(Math.min(gross * 0.14, Math.max(units * 24, gross * 0.1)));

  // Sığınak: Sığınak Yönetmeliği Madde 7 (Kişi başı min 1 m² sığınak; konutta kişi sayısı bağımsız bölüm x 3-4)
  const shelterM2 = Math.round(Math.max(units * 4.5, gross * 0.035));

  // Yangın Merdiveni & Yangın Güvenlik Holü (Yangın Yönetmeliği)
  const fireEscapeM2 = Math.round(gross * 0.025);

  // Ana Merdiven Kovası & Kat Holleri (Dikey sirkülasyon & kat sahanlıkları)
  const mainStairsM2 = Math.round(gross * 0.04);

  // Asansör Kuyuları & Makine / Motor Dairesi (Yolcu + Sedye asansörü)
  const elevatorsM2 = Math.round(gross * 0.018);

  // Su Deposu, Yangın Rezervi & Hidrofor Odası (İtfaiye yangın rezervi ve kullanım suyu)
  const waterTankM2 = Math.round(gross * 0.012);

  // Kazan Dairesi / Isı Merkezi / Trafo / Jeneratör Odası
  const mechanicalM2 = Math.round(gross * 0.014);

  // Bina Giriş Holü, Rüzgarlık & Görevli/Danışma Odası
  const entranceM2 = Math.round(gross * 0.012);

  return [
    {
      id: "ca_parking",
      name: "Kapalı Otopark & Manevra Rampası",
      category: "parking",
      regulationNotice: "Otopark Yönetmeliği (Min. 1 Araç / Bağımsız Bölüm)",
      m2: parkingM2,
      percentageOfGross: Math.round((parkingM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "Araç başına manevra dahil ~25 m² hesaplanmıştır.",
    },
    {
      id: "ca_shelter",
      name: "Sığınak Alanı (Serpinti ve Basınç Korunmalı)",
      category: "shelter",
      regulationNotice: "Sığınak Yönetmeliği Madde 7 (Kişi başı koruma hacmi)",
      m2: shelterM2,
      percentageOfGross: Math.round((shelterM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "Havalandırma filtresi, rezerv wc ve acil çıkış kapağı zorunludur.",
    },
    {
      id: "ca_fire",
      name: "Yangın Merdiveni & Yangın Güvenlik Holü",
      category: "stairs_circulation",
      regulationNotice: "Binaların Yangından Korunması Hakkında Yönetmelik",
      m2: fireEscapeM2,
      percentageOfGross: Math.round((fireEscapeM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "Basınçlandırma kanallı yangın güvenlik holü dahil.",
    },
    {
      id: "ca_stairs",
      name: "Ana Merdiven Kovası & Kat Sahanlıkları",
      category: "stairs_circulation",
      regulationNotice: "Planlı Alanlar İmar Yönetmeliği Madde 35",
      m2: mainStairsM2,
      percentageOfGross: Math.round((mainStairsM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "Kat holleri ve daire giriş koridorları.",
    },
    {
      id: "ca_elevator",
      name: "Asansör Şaftları & Makine Dairesi",
      category: "elevator",
      regulationNotice: "Asansör Yönetmeliği (Yolcu ve Sedye Asansörü)",
      m2: elevatorsM2,
      percentageOfGross: Math.round((elevatorsM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "10 ve üzeri katlarda sedye asansörü zorunludur.",
    },
    {
      id: "ca_water",
      name: "Su Deposu, Yangın Rezervi & Hidrofor Odası",
      category: "mechanical",
      regulationNotice: "İtfaiye Yangın Yönetmeliği Su Rezerv Standartları",
      m2: waterTankM2,
      percentageOfGross: Math.round((waterTankM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "En az 24 saatlik bina su ihtiyacı + yangın rezervi.",
    },
    {
      id: "ca_mechanical",
      name: "Kazan Dairesi, Isı Merkezi & Jeneratör Odası",
      category: "mechanical",
      regulationNotice: "TMMOB Mekanik & Elektrik Tesisat Standartları",
      m2: mechanicalM2,
      percentageOfGross: Math.round((mechanicalM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "Akustik izolasyonlu jeneratör ve ana pano odası.",
    },
    {
      id: "ca_entrance",
      name: "Bina Giriş Holü, Rüzgarlık & Görevli/Danışma",
      category: "entrance_common",
      regulationNotice: "Planlı Alanlar İmar Yönetmeliği Madde 31",
      m2: entranceM2,
      percentageOfGross: Math.round((entranceM2 / gross) * 1000) / 10,
      isMandatory: true,
      notes: "Engelli erişim rampası ve posta kutusu holü.",
    },
  ];
}

/**
 * Varsayılan daire dağılımı (örnek başlangıç)
 */
export function generateDefaultApartmentConfigs(remainingNetM2: number): ApartmentUnitConfig[] {
  const net = Math.max(100, remainingNetM2 || 2200);

  // Örneğin %60 2+1 (85 m²), %40 3+1 (120 m²)
  const target2Plus1Area = net * 0.55;
  const target3Plus1Area = net * 0.45;

  const count2Plus1 = Math.max(1, Math.round(target2Plus1Area / 85));
  const count3Plus1 = Math.max(1, Math.round(target3Plus1Area / 120));

  return [
    {
      id: "apt_2_plus_1",
      type: "2+1",
      title: "2+1 Standart Aile Dairesi",
      count: count2Plus1,
      targetNetM2: 85,
      grossMultiplier: 1.25,
      totalNetM2: count2Plus1 * 85,
      rooms: calculateRoomsForApartment("2+1", 85),
      estimatedSalePricePerUnit: 4850000,
    },
    {
      id: "apt_3_plus_1",
      type: "3+1",
      title: "3+1 Geniş Ebeveyn Süitli Konut",
      count: count3Plus1,
      targetNetM2: 120,
      grossMultiplier: 1.25,
      totalNetM2: count3Plus1 * 120,
      rooms: calculateRoomsForApartment("3+1", 120),
      estimatedSalePricePerUnit: 6950000,
    },
  ];
}

export interface OptimizationPresetOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  unitConfigs: ApartmentUnitConfig[];
  totalAllocatedNetM2: number;
  remainingWasteM2: number;
  efficiencyPercentage: number;
  totalUnits: number;
}

/**
 * 🚀 AKILLI DAİRE SAYISI VE 2+1 & 3+1 OPTİMİZASYON MOTORU
 * Kalan net metrekareyi en verimli şekilde kullanmak için atıl metrekareyi (waste) minimize eder.
 */
export function optimizeApartmentDistribution(
  remainingNetM2: number,
  options?: {
    custom2Plus1NetM2?: number;
    custom3Plus1NetM2?: number;
    targetRatio2Plus1?: number; // 0.6 = %60 2+1
  }
): OptimizationPresetOption[] {
  const netArea = Math.max(150, Math.round(remainingNetM2));
  const size2 = Math.max(65, options?.custom2Plus1NetM2 || 85);
  const size3 = Math.max(95, options?.custom3Plus1NetM2 || 120);

  // SENARYO 1: Dengeli Aile Karması (2+1 ve 3+1 Optimize Dağılım)
  // Kalan net alanı neredeyse 0 atıkla dolduran en iyi (n2, n3) kombinasyonunu bulur.
  let best2Plus1Count = 0;
  let best3Plus1Count = 0;
  let minWaste = Infinity;
  let bestScore = -Infinity;

  const max3 = Math.floor(netArea / size3);
  for (let n3 = 0; n3 <= max3; n3++) {
    const remainingFor2 = netArea - n3 * size3;
    const n2 = Math.floor(remainingFor2 / size2);
    const allocated = n2 * size2 + n3 * size3;
    const waste = netArea - allocated;

    if (n2 >= 1 && n3 >= 1 && waste >= 0) {
      // Dengeli oran skorlaması: 2+1 oranı %45 ile %75 arasında olanları ve minimum atık bırakanları ödüllendir
      const totalUnits = n2 + n3;
      const ratio2 = n2 / totalUnits;
      // İdeal oran ~0.60
      const balancePenalty = Math.abs(ratio2 - 0.6) * 15;
      const score = (allocated / netArea) * 100 - balancePenalty - waste * 0.1;

      if (score > bestScore) {
        bestScore = score;
        minWaste = waste;
        best2Plus1Count = n2;
        best3Plus1Count = n3;
      }
    }
  }

  // Fallback if no clean combo
  if (best2Plus1Count === 0 && best3Plus1Count === 0) {
    best2Plus1Count = Math.max(1, Math.floor((netArea * 0.6) / size2));
    const rem = netArea - best2Plus1Count * size2;
    best3Plus1Count = Math.max(1, Math.floor(rem / size3));
    minWaste = Math.max(0, netArea - (best2Plus1Count * size2 + best3Plus1Count * size3));
  }

  const allocatedBalanced = best2Plus1Count * size2 + best3Plus1Count * size3;
  const wasteBalanced = Math.max(0, netArea - allocatedBalanced);

  const presetBalanced: OptimizationPresetOption = {
    id: "preset_balanced_2_and_3",
    name: "Dengeli Aile Karması (2+1 & 3+1 Optimum)",
    badge: "En Popüler / Yüksek Talep",
    description: `Net ${size2} m² 2+1 ve ${size3} m² 3+1 dairelerle %99+ alan verimliliği sağlar.`,
    iconName: "Scale",
    unitConfigs: [
      {
        id: "opt_2p1",
        type: "2+1",
        title: `2+1 Standart Aile Dairesi (${size2} m²)`,
        count: best2Plus1Count,
        targetNetM2: size2,
        grossMultiplier: 1.25,
        totalNetM2: best2Plus1Count * size2,
        rooms: calculateRoomsForApartment("2+1", size2),
        estimatedSalePricePerUnit: Math.round(size2 * 58000),
      },
      {
        id: "opt_3p1",
        type: "3+1",
        title: `3+1 Ebeveyn Süitli Konut (${size3} m²)`,
        count: best3Plus1Count,
        targetNetM2: size3,
        grossMultiplier: 1.25,
        totalNetM2: best3Plus1Count * size3,
        rooms: calculateRoomsForApartment("3+1", size3),
        estimatedSalePricePerUnit: Math.round(size3 * 62000),
      },
    ],
    totalAllocatedNetM2: allocatedBalanced,
    remainingWasteM2: wasteBalanced,
    efficiencyPercentage: Math.round((allocatedBalanced / netArea) * 1000) / 10,
    totalUnits: best2Plus1Count + best3Plus1Count,
  };

  // SENARYO 2: Yüksek Daire Sayısı & Hızlı Satış (1+1 ve 2+1 Ağırlıklı)
  const size1 = 52;
  const size2Small = 76;
  let best1p = 0;
  let best2pSmall = 0;
  let scoreDensity = -Infinity;

  const max2s = Math.floor(netArea / size2Small);
  for (let n2 = 1; n2 <= max2s; n2++) {
    const rem = netArea - n2 * size2Small;
    const n1 = Math.floor(rem / size1);
    const alloc = n2 * size2Small + n1 * size1;
    const waste = netArea - alloc;
    if (n1 >= 1 && waste >= 0) {
      const score = (alloc / netArea) * 100 - waste * 0.1;
      if (score > scoreDensity) {
        scoreDensity = score;
        best1p = n1;
        best2pSmall = n2;
      }
    }
  }

  const allocDensity = best1p * size1 + best2pSmall * size2Small;
  const presetDensity: OptimizationPresetOption = {
    id: "preset_high_density",
    name: "Maksimum Daire Sayısı (1+1 & 2+1 Yatırımlık)",
    badge: "Yüksek Kira Getirisi / Hızlı Nakit",
    description: `Net ${size1} m² 1+1 ve ${size2Small} m² 2+1 ile azami bağımsız bölüm adedine ulaşır.`,
    iconName: "TrendingUp",
    unitConfigs: [
      {
        id: "opt_dense_1p1",
        type: "1+1",
        title: `1+1 Kompakt Yatırım Dairesi (${size1} m²)`,
        count: best1p,
        targetNetM2: size1,
        grossMultiplier: 1.25,
        totalNetM2: best1p * size1,
        rooms: calculateRoomsForApartment("1+1", size1),
        estimatedSalePricePerUnit: Math.round(size1 * 62000),
      },
      {
        id: "opt_dense_2p1",
        type: "2+1",
        title: `2+1 Kompakt Daire (${size2Small} m²)`,
        count: best2pSmall,
        targetNetM2: size2Small,
        grossMultiplier: 1.25,
        totalNetM2: best2pSmall * size2Small,
        rooms: calculateRoomsForApartment("2+1", size2Small),
        estimatedSalePricePerUnit: Math.round(size2Small * 60000),
      },
    ],
    totalAllocatedNetM2: allocDensity,
    remainingWasteM2: Math.max(0, netArea - allocDensity),
    efficiencyPercentage: Math.round((allocDensity / netArea) * 1000) / 10,
    totalUnits: best1p + best2pSmall,
  };

  // SENARYO 3: Geniş & Lüks Segment (3+1 ve 4+1 Prestij Konutları)
  const size3Lux = 125;
  const size4Lux = 160;
  let best3Lux = 0;
  let best4Lux = 0;
  let scoreLux = -Infinity;

  const max4 = Math.floor(netArea / size4Lux);
  for (let n4 = 0; n4 <= max4; n4++) {
    const rem = netArea - n4 * size4Lux;
    const n3 = Math.floor(rem / size3Lux);
    const alloc = n4 * size4Lux + n3 * size3Lux;
    const waste = netArea - alloc;
    if (n3 >= 1 && waste >= 0) {
      const score = (alloc / netArea) * 100 - waste * 0.1;
      if (score > scoreLux) {
        scoreLux = score;
        best3Lux = n3;
        best4Lux = n4;
      }
    }
  }

  const allocLux = best3Lux * size3Lux + best4Lux * size4Lux;
  const presetLuxury: OptimizationPresetOption = {
    id: "preset_luxury_family",
    name: "Geniş & Lüks Segment (3+1 & 4+1 Prestij)",
    badge: "Yüksek Prim / Üst Segment",
    description: `Net ${size3Lux} m² 3+1 ve ${size4Lux} m² 4+1 geniş aile rezidansları.`,
    iconName: "ShieldCheck",
    unitConfigs: [
      {
        id: "opt_lux_3p1",
        type: "3+1",
        title: `3+1 Lüks Aile Dairesi (${size3Lux} m²)`,
        count: best3Lux,
        targetNetM2: size3Lux,
        grossMultiplier: 1.25,
        totalNetM2: best3Lux * size3Lux,
        rooms: calculateRoomsForApartment("3+1", size3Lux),
        estimatedSalePricePerUnit: Math.round(size3Lux * 70000),
      },
      ...(best4Lux > 0
        ? [
            {
              id: "opt_lux_4p1",
              type: "4+1",
              title: `4+1 Prestij Konutu (${size4Lux} m²)`,
              count: best4Lux,
              targetNetM2: size4Lux,
              grossMultiplier: 1.25,
              totalNetM2: best4Lux * size4Lux,
              rooms: calculateRoomsForApartment("4+1", size4Lux),
              estimatedSalePricePerUnit: Math.round(size4Lux * 75000),
            },
          ]
        : []),
    ],
    totalAllocatedNetM2: allocLux,
    remainingWasteM2: Math.max(0, netArea - allocLux),
    efficiencyPercentage: Math.round((allocLux / netArea) * 1000) / 10,
    totalUnits: best3Lux + best4Lux,
  };

  return [presetBalanced, presetDensity, presetLuxury];
}
