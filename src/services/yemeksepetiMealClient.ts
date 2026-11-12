import type { ECommerceOrder, MarketplaceStoreConfig } from "../components/ECommerceModule.tsx";

interface PosOrder {
  token: string;
  code: string;
  status: "accepted" | "cancelled";
  createdAt: string;
  customer?: { firstName?: string; lastName?: string; mobilePhone?: string };
  delivery?: { address?: { city?: string; district?: string; street?: string; number?: string; line1?: string } };
  price: { grandTotal: string };
  products: Array<{ id?: string; sku?: string; remoteCode?: string; name?: string; quantity: string; unitPrice?: string; paidPrice?: string; vatPercentage?: string }>;
}

export async function requestYemeksepetiOrders(store: Pick<MarketplaceStoreConfig, "supplierId" | "integrationRefCode" | "apiKey" | "apiSecret">, mode: "test" | "sync"): Promise<PosOrder[]> {
  const response = await fetch("/api/marketplace/yemeksepeti-meal/orders", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chainCode: store.supplierId, vendorId: store.integrationRefCode, username: store.apiKey, password: store.apiSecret, mode }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Yemeksepeti isteği başarısız (${response.status}).`);
  if (mode === "test") return [];
  if (!Array.isArray(data.orders)) throw new Error("Yemeksepeti sipariş yanıtı okunamadı.");
  return data.orders;
}

export function mapYemeksepetiOrder(order: PosOrder, store: MarketplaceStoreConfig): ECommerceOrder {
  if (!order.token || !order.code || !Array.isArray(order.products) || !["accepted", "cancelled"].includes(order.status)) throw new Error("Yemeksepeti sipariş alanları eksik.");
  const grossTotal = Number(order.price?.grandTotal);
  const date = new Date(order.createdAt);
  if (!Number.isFinite(grossTotal) || grossTotal < 0 || Number.isNaN(date.getTime())) throw new Error(`Yemeksepeti sipariş tutarı veya tarihi geçersiz: ${order.code}`);
  const items = order.products.map((product, index) => {
    const quantity = Number(product.quantity);
    const paidPrice = Number(product.paidPrice);
    const unitPrice = Number(product.unitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || (!Number.isFinite(paidPrice) && !Number.isFinite(unitPrice))) throw new Error(`Yemeksepeti ürün tutarı geçersiz: ${order.code}`);
    const itemTotal = Number.isFinite(paidPrice) ? paidPrice : unitPrice * quantity;
    return { id: `${order.token}_${index}`, sku: product.sku || product.remoteCode || product.id || "", barcode: "", productName: product.name || "Yemeksepeti ürünü", quantity, unitPrice: Number((itemTotal / quantity).toFixed(2)), vatRate: Number(product.vatPercentage) || 0, totalWithVat: Number(itemTotal.toFixed(2)) };
  });
  const address = order.delivery?.address;
  const day = date.toISOString().slice(0, 10);
  return {
    id: `ys_${store.supplierId}_${store.integrationRefCode}_${order.token}`,
    marketplaceOrderNo: order.code, marketplace: "yemeksepeti",
    customerName: [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || "Yemeksepeti müşterisi",
    customerPhone: order.customer?.mobilePhone || "", customerEmail: "", customerCity: address?.city || "", customerDistrict: address?.district || "",
    shippingAddress: address?.line1 || [address?.street, address?.number].filter(Boolean).join(" "),
    orderDate: day, shippingDeadline: day, cargoCompany: "Yemeksepeti", cargoTrackingCode: "", cargoCampaignCode: "",
    status: order.status === "cancelled" ? "cancelled" : "new", items, grossTotal,
    commissionRate: 0, commissionAmount: 0, cargoDeduction: 0, withholdingTax: 0,
    netPayout: grossTotal, payoutStatus: "pending", payoutDueDate: day, invoiced: false, syncedToOrders: false,
  };
}
