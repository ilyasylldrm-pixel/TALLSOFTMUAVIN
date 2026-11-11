export interface TrendyolFoodSettings {
  supplierId: string;
  apiKey: string;
  apiSecret: string;
  restaurantName: string;
  environment: "production" | "stage";
  autoInvoiceOnDelivery: boolean;
  autoSendToGib: boolean;
  defaultVatRate: number; // 10 (food standard), 1, 20
  defaultPaymentMethod: "kredi_karti" | "yemek_karti" | "nakit" | "cari";
  invoiceSeries: string; // e.g. "TYM"
  fallbackTckn: string; // "11111111111"
  includeDeliveryFee: boolean;
  autoSyncIntervalMinutes: number; // 1, 3, 5, 10
  webhookUrl: string;
  isConnected: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: "success" | "error" | "never";
  lastSyncMessage?: string;
}

export interface TrendyolFoodOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  note?: string;
}

export type TrendyolFoodOrderStatus =
  | "Created"
  | "Picking"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export interface TrendyolFoodOrder {
  id: string;
  orderNumber: string;
  packageId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  district: string;
  city: string;
  orderDate: string;
  deliveryDate?: string;
  status: TrendyolFoodOrderStatus;
  statusLabel: string;
  courierName?: string;
  courierPhone?: string;
  items: TrendyolFoodOrderItem[];
  grossTotal: number;
  deliveryFee: number;
  discount: number;
  payableAmount: number;
  paymentMethod: string;
  invoiced: boolean;
  invoiceNumber?: string;
  invoiceEttn?: string;
  invoicedAt?: string;
  invoiceStatus?: "draft" | "sent" | "error";
  invoiceError?: string;
}

export interface TrendyolFoodLog {
  id: string;
  timestamp: string;
  type: "sync" | "invoice_auto" | "invoice_manual" | "webhook" | "test";
  title: string;
  detail: string;
  orderNumber?: string;
  invoiceNumber?: string;
  status: "success" | "error" | "warning" | "info";
}

export const DEFAULT_TRENDYOL_FOOD_SETTINGS: TrendyolFoodSettings = {
  supplierId: "",
  apiKey: "",
  apiSecret: "",
  restaurantName: "Trendyol GO Restoranım",
  environment: "production",
  autoInvoiceOnDelivery: true,
  autoSendToGib: true,
  defaultVatRate: 10,
  defaultPaymentMethod: "kredi_karti",
  invoiceSeries: "TYM",
  fallbackTckn: "11111111111",
  includeDeliveryFee: true,
  autoSyncIntervalMinutes: 3,
  webhookUrl: "https://tallsoft.org/api/trendyol-food/webhook",
  isConnected: false,
  lastSyncStatus: "never",
};
