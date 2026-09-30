/**
 * Helper utility for static ERP assets and 3D avatars
 */

export const AVATAR_LIST = [
  "/assets/avatars/02_JAPANESE FEMALE TEMPLATE 3 2.webp",
  "/assets/avatars/JAPANESE FEMALE 4 2.webp",
  "/assets/avatars/JAPANESE FEMALE 5 2.webp",
  "/assets/avatars/JAPANESE FEMALE 6 2.webp",
  "/assets/avatars/JAPANESE FEMALE 7 2.webp",
  "/assets/avatars/JAPANESE MALE 4 2.webp",
  "/assets/avatars/JAPANESE MALE 6 2.webp",
  "/assets/avatars/JAPANESE MALE 9 2.webp",
  "/assets/avatars/Kawaii Avatar 13 2.webp",
  "/assets/avatars/Kawaii Avatar 21 2.webp",
  "/assets/avatars/Kawaii Avatar 22 2.webp",
  "/assets/avatars/Kawaii Avatar 4 2.webp",
  "/assets/avatars/Kawaii Avatar 5 2.webp",
  "/assets/avatars/Kawaii Avatar 8 2.webp",
];

/**
 * Returns a consistent avatar URL for a given contact ID, code, or index
 */
export function getContactAvatar(seed: string | number | undefined): string {
  if (!seed) return AVATAR_LIST[0];
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_LIST.length;
  return AVATAR_LIST[idx];
}

/**
 * High-quality SVG icons from the reference design
 */
export const ASSET_ICONS = {
  // Dashboard Top Cards
  ciro: "/assets/target/ad performance, analytics, metrics, optimization, chart.svg",
  tahsilat: "/assets/money/money, transfer, payment, transaction, finance.svg",
  alacak: "/assets/invoice/receipt, bill, slip, payment, paper.svg",
  nakit: "/assets/bank/bank, finance, banking, money, institution.svg",
  
  // Contacts Top Cards
  toplamAlacak: "/assets/money/money, transfer, payment, transaction, finance.svg",
  toplamBorc: "/assets/money/debt, money, loan, finance, repaymentz.svg",
  vadesiGecenAlacak: "/assets/invoice/unpaid, pending invoice, due bill, reminder, payment required.svg",
  riskLimitiniAsan: "/assets/target/conversion, funnel, leads, performance, campaign metrics.svg",

  // Section Headers
  nakitAkisi: "/assets/cashflow/cash flow-money movement-financial flow-income and expenses-business.svg",
  alacakYaslandirma: "/assets/invoice/payment receipt, proof of payment, confirmation, slip, transaction.svg",
  sonBelgeler: "/assets/invoice/pos receipt, point of sale, cash register, print slip, checkout.svg",
  riskliCariler: "/assets/target/targeting, audience, focus, ads, precision.svg",

  // Actions & Filters
  filter: "/assets/search filter/filter, funnel, sorting, refine, filter.svg",
  search: "/assets/search filter/search, magnifier, find, lookup, explore.svg",
  columns: "/assets/search filter/advanced filters, sliders, customization, filter settings, refine options.svg",
  export: "/assets/invoice/download invoice, export, pdf receipt, document download, file.svg",
};
