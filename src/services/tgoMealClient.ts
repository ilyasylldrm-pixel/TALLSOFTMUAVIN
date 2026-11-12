import type { ECommerceOrder, MarketplaceStoreConfig } from "../components/ECommerceModule.tsx";

export interface TgoPackage {
  id: string;
  orderNumber?: string;
  orderId?: string;
  packageStatus?: string;
  packageCreationDate?: number;
  totalPrice?: number;
  totalDeliveryPrice?: number | null;
  customer?: { firstName?: string; lastName?: string; email?: string };
  address?: { firstName?: string; lastName?: string; address1?: string; city?: string; district?: string; phone?: string };
  deliveryType?: string;
  lines?: Array<{ productId?: number; name?: string; price?: number; unitSellingPrice?: number; items?: Array<{ lineItemId?: number; isCancelled?: boolean }> }>;
}

export async function requestTgoPackages(credentials: Pick<MarketplaceStoreConfig, "supplierId" | "apiKey" | "apiSecret" | "executorEmail">, mode: "test" | "sync"): Promise<TgoPackage[]> {
  const response = await fetch("/api/marketplace/tgo-meal/packages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials, mode }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `TGO isteği başarısız (${response.status}).`);
  if (mode === "test") return [];
  if (!Array.isArray(data.packages)) throw new Error("TGO sipariş yanıtı okunamadı.");
  return data.packages;
}

export function mapTgoPackage(pkg: TgoPackage, store: MarketplaceStoreConfig): ECommerceOrder {
  if (!pkg.id || !Array.isArray(pkg.lines)) throw new Error("TGO paketinde kimlik veya ürün satırları eksik.");
  const address = pkg.address || {};
  const customer = pkg.customer || {};
  const grossTotal = Number(pkg.totalPrice);
  if (!Number.isFinite(grossTotal) || grossTotal < 0) throw new Error(`TGO paket tutarı geçersiz: ${pkg.id}`);
  const status = pkg.packageStatus === "Cancelled" || pkg.packageStatus === "UnSupplied" ? "cancelled" : pkg.packageStatus === "Delivered" ? "delivered" : pkg.packageStatus === "Shipped" ? "shipped" : pkg.packageStatus === "Picking" ? "preparing" : "new";
  const items = pkg.lines.map((line, index) => {
    const quantity = Math.max(1, line.items?.filter((item) => !item.isCancelled).length || 1);
    const unitPrice = Number(line.unitSellingPrice ?? line.price ?? 0);
    return {
      id: `${pkg.id}_${index}`,
      sku: String(line.productId || ""),
      barcode: "",
      productName: line.name || "TGO ürün",
      quantity,
      unitPrice,
      vatRate: 0,
      totalWithVat: Number((unitPrice * quantity).toFixed(2)),
    };
  });
  // TGO package response has no commission or VAT rate. Do not invent accounting amounts.
  const commissionAmount = 0;
  const date = pkg.packageCreationDate ? new Date(pkg.packageCreationDate) : new Date();
  return {
    id: `tgo_${store.supplierId}_${pkg.id}`,
    marketplaceOrderNo: String(pkg.orderNumber || pkg.orderId || pkg.id),
    marketplace: "trendyol_go",
    customerName: [customer.firstName || address.firstName, customer.lastName || address.lastName].filter(Boolean).join(" ") || "TGO müşterisi",
    customerPhone: address.phone || "",
    customerEmail: customer.email || "",
    customerCity: address.city === "TGO Yemek" ? "" : address.city || "",
    customerDistrict: address.district === "TGO Yemek" ? "" : address.district || "",
    shippingAddress: address.address1 === "TGO Yemek" ? "" : address.address1 || "",
    orderDate: date.toISOString().slice(0, 10),
    shippingDeadline: date.toISOString().slice(0, 10),
    cargoCompany: pkg.deliveryType === "GO" ? "TGO kurye" : "Restoran kurye",
    cargoTrackingCode: "",
    cargoCampaignCode: "",
    status,
    items,
    grossTotal,
    commissionRate: 0,
    commissionAmount,
    cargoDeduction: 0,
    withholdingTax: 0,
    netPayout: Number((grossTotal - commissionAmount).toFixed(2)),
    payoutStatus: "pending",
    payoutDueDate: date.toISOString().slice(0, 10),
    invoiced: pkg.packageStatus === "Invoiced",
    syncedToOrders: false,
  };
}
