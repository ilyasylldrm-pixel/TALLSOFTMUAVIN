// Lightweight helper for deriving 2-digit plate code in accounting codes (e.g. 120.34.VKN)
// Selectable province, district, and neighborhood lists have been removed.

const PLATE_CODE_MAP: Record<string, string> = {
  adana: "01",
  adiyaman: "02",
  afyonkarahisar: "03",
  afyon: "03",
  agri: "04",
  amasya: "05",
  ankara: "06",
  antalya: "07",
  artvin: "08",
  aydin: "09",
  balikesir: "10",
  bilecik: "11",
  bingol: "12",
  bitlis: "13",
  bolu: "14",
  burdur: "15",
  bursa: "16",
  canakkale: "17",
  cankiri: "18",
  corum: "19",
  denizli: "20",
  diyarbakir: "21",
  edirne: "22",
  elazig: "23",
  erzincan: "24",
  erzurum: "25",
  eskisehir: "26",
  gaziantep: "27",
  giresun: "28",
  gumushane: "29",
  hakkari: "30",
  hatay: "31",
  isparta: "32",
  mersin: "33",
  icel: "33",
  istanbul: "34",
  izmir: "35",
  kars: "36",
  kastamonu: "37",
  kayseri: "38",
  kirklareli: "39",
  kirsehir: "40",
  kocaeli: "41",
  konya: "42",
  kutahya: "43",
  malatya: "44",
  manisa: "45",
  kahramanmaras: "46",
  mardin: "47",
  mugla: "48",
  mus: "49",
  nevsehir: "50",
  nigde: "51",
  ordu: "52",
  rize: "53",
  sakarya: "54",
  samsun: "55",
  siirt: "56",
  sinop: "57",
  sivas: "58",
  tekirdag: "59",
  tokat: "60",
  trabzon: "61",
  tunceli: "62",
  sanliurfa: "63",
  urfa: "63",
  usak: "64",
  van: "65",
  yozgat: "66",
  zonguldak: "67",
  aksaray: "68",
  bayburt: "69",
  karaman: "70",
  kirikkale: "71",
  batman: "72",
  sirnak: "73",
  bartin: "74",
  ardahan: "75",
  igdir: "76",
  yalova: "77",
  karabuk: "78",
  kilis: "79",
  osmaniye: "80",
  duzce: "81",
};

function normalizeAscii(val?: string): string {
  return String(val || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function getProvincePlateCode(cityName?: string): string {
  const clean = normalizeAscii(cityName);
  if (!clean) return "34";
  if (PLATE_CODE_MAP[clean]) return PLATE_CODE_MAP[clean];
  const match = clean.match(/^\d{2}/);
  if (match) return match[0];
  return "34";
}
