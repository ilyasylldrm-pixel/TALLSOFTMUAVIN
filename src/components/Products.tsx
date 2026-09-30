import React, { useState, useMemo, useDeferredValue } from "react";
import { Product, Invoice, Contact, Warehouse, Employee, Transaction, CompanySettings } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency, formatDate, exportElementToPDF, exportToExcel, exportToPDF } from "../utils/exportUtils";
import { formatProductWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import { TableColumnFilterInput } from "./common/TableColumnFilterInput";
import { ColumnManagementDropdown } from "./common/ColumnManagementDropdown";
import { useColumnVisibility, ColumnDef } from "../hooks/useColumnVisibility";
import { TableCheckbox } from "./common/TableCheckbox";
import { BulkActionBar } from "./common/BulkActionBar";
import { useTableSelection } from "../hooks/useTableSelection";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { Pagination } from "./common/Pagination";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { DataImportModal } from "./common/DataImportModal";
import { useTheme } from "../context/ThemeContext";
import { triggerFormErrorNotification } from "../context/FormErrorContext";
import { ASSET_ICONS } from "../utils/assetIcons";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Zap,
  MessageCircle,
  Trash2,
  X,
  Barcode,
  Layers,
  Sparkles,
  Check,
  Tag,
  Cpu,
  FileText,
  FileSpreadsheet,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Building,
  Users,
  DollarSign,
  Filter,
  Clock,
  Receipt,
  ArrowRightLeft,
  Warehouse as WarehouseIcon,
  MapPin,
  Building2,
  Boxes,
  Send,
  CheckCircle2,
  BarChart3,
  Wallet,
  Calculator,
  Percent,
  Printer,
  FileCheck2,
  Stamp,
  Landmark,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface ProductsProps {
  products: Product[];
  invoices?: Invoice[];
  contacts?: Contact[];
  warehouses?: Warehouse[];
  employees?: Employee[];
  transactions?: Transaction[];
  companySettings?: CompanySettings;
  globalSearchTerm?: string;
  onAddProduct: (product: Product) => void;
  onBulkAddProducts?: (products: Product[], updateExisting?: boolean) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBulkDeleteProducts?: (ids: string[]) => void;
}

export interface ProductMovement {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  type: "purchase" | "sales" | "expense" | "income" | string;
  issueDate: string;
  contactId: string;
  contactName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalWithVat: number;
  vatRate: number;
  itemDescription: string;
  runningBalance?: number;
}

export const PRODUCT_TABLE_COLUMNS: ColumnDef[] = [
  { id: "code", label: "Stok Kodu & Barkod", defaultVisible: true, alwaysVisible: true },
  { id: "name", label: "Ürün / Hizmet Adı", defaultVisible: true, alwaysVisible: true },
  { id: "warehouse", label: "Bulunduğu Depo", defaultVisible: true },
  { id: "stockType", label: "Stok Cinsi", defaultVisible: true },
  { id: "price", label: "Alış / Satış Fiyatı", defaultVisible: true },
  { id: "profitMargin", label: "Ort. Kar & Marj", defaultVisible: true },
  { id: "stock", label: "Stok Miktarı", defaultVisible: true },
  { id: "actions", label: "İşlemler", defaultVisible: true, alwaysVisible: true },
];

const defaultWarehouses: Warehouse[] = [
  {
    id: "wh_1",
    code: "DEP-001",
    name: "Gebze Lojistik & Ana Depo",
    type: "main",
    capacityM2: 2500,
    managerName: "Hasan Öztürk",
    phone: "+90 (262) 644 11 22",
    status: "active",
    address: {
      city: "Kocaeli",
      district: "Gebze",
      fullAddress: "OSB 2. Cad. No:15 Blok A, Gebze / Kocaeli",
    },
    createdAt: "2026-01-05",
  },
  {
    id: "wh_2",
    code: "DEP-002",
    name: "İkitelli Yedek Parça Deposu",
    type: "regional",
    capacityM2: 1200,
    managerName: "Ali Can",
    phone: "+90 (212) 549 00 11",
    status: "active",
    address: {
      city: "İstanbul",
      district: "Başakşehir",
      fullAddress: "İkitelli OSB Teknopark Sk. No:8/12, Başakşehir / İstanbul",
    },
    createdAt: "2026-02-01",
  },
  {
    id: "wh_3",
    code: "DEP-003",
    name: "Ankara Lojistik Transit Depo",
    type: "transit",
    capacityM2: 800,
    managerName: "Selin Şahin",
    phone: "+90 (312) 395 77 88",
    status: "active",
    address: {
      city: "Ankara",
      district: "Yenimahalle",
      fullAddress: "GİMAT Sanayi Sitesi 12. Blok No:44, Yenimahalle / Ankara",
    },
    createdAt: "2026-02-15",
  },
];

export function getProductStockInWarehouse(
  product: Product,
  whId: string,
  allWarehouses: Warehouse[]
): number {
  if (whId === "all") {
    return product.stockQuantity || 0;
  }
  if (product.warehouseQuantities && product.warehouseQuantities[whId] !== undefined) {
    return product.warehouseQuantities[whId];
  }
  if (product.warehouseId === whId) {
    return product.stockQuantity || 0;
  }
  if (allWarehouses.length > 0) {
    const index = allWarehouses.findIndex((w) => w.id === whId);
    const total = product.stockQuantity || 0;
    if (index === 0) return Math.floor(total * 0.5);
    if (index === 1) return Math.floor(total * 0.3);
    if (index === 2) return Math.max(0, total - Math.floor(total * 0.5) - Math.floor(total * 0.3));
  }
  return 0;
}

function getProductMovements(product: Product, invoices: Invoice[] = []): ProductMovement[] {
  const movements: ProductMovement[] = [];

  invoices.forEach((inv) => {
    inv.items.forEach((item, idx) => {
      const matchesById = item.productId === product.id;
      const matchesByName =
        !item.productId &&
        (item.description.toLowerCase().includes(product.name.toLowerCase()) ||
          (product.code && item.description.toLowerCase().includes(product.code.toLowerCase())));

      if (matchesById || matchesByName) {
        movements.push({
          id: `${inv.id}_item_${idx}`,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          type: inv.type,
          issueDate: inv.issueDate,
          contactId: inv.contactId,
          contactName: inv.contactName || "Belirtilmedi",
          quantity: item.quantity,
          unit: item.unit || product.unit,
          unitPrice: item.unitPrice,
          totalWithVat: item.totalWithVat,
          vatRate: item.vatRate,
          itemDescription: item.description,
        });
      }
    });
  });

  // Eskiden yeniye sırala (Oldest to Newest)
  movements.sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
  return movements;
}

function getProductAnalytics(product: Product, invoices: Invoice[] = []) {
  const rawMovements = getProductMovements(product, invoices);

  const rawPurchaseMovements = rawMovements.filter((m) => m.type === "purchase");
  const salesMovements = rawMovements.filter((m) => m.type === "sales");

  const rawBuyQty = rawPurchaseMovements.reduce((acc, m) => acc + m.quantity, 0);
  const totalSellQty = salesMovements.reduce((acc, m) => acc + m.quantity, 0);

  const currentStock = product.stockQuantity || 0;
  const targetBuyQty = Math.max(rawBuyQty, currentStock + totalSellQty);
  const openingDevirQty = targetBuyQty - rawBuyQty;

  const movements = [...rawMovements];

  if (openingDevirQty > 0) {
    const openingVat = product.vatRate || 20;
    const openingPrice = product.buyPrice || 0;
    const openingTotalWithVat = openingDevirQty * openingPrice * (1 + openingVat / 100);

    movements.push({
      id: `devir_${product.id}`,
      invoiceId: `devir_${product.id}`,
      invoiceNumber: "DEVİR-2026",
      type: "purchase",
      issueDate: "2026-01-01",
      contactId: "system_devir",
      contactName: "Açılış / Devir Stoğu (Stok Kabul)",
      quantity: openingDevirQty,
      unit: product.unit || "Adet",
      unitPrice: openingPrice,
      totalWithVat: openingTotalWithVat,
      vatRate: openingVat,
      itemDescription: `${product.name} - Mevcut Stok Devir Bakiye Kaydı`,
    });
  }

  // Eskiden yeniye sırala (Oldest to Newest, opening devir on top)
  movements.sort((a, b) => {
    const timeA = new Date(a.issueDate).getTime();
    const timeB = new Date(b.issueDate).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id.startsWith("devir_") ? -1 : 1;
  });

  // Calculate Yürüyen Stok Bakiye (Running Stock Balance)
  let accumulatedStock = 0;
  movements.forEach((m) => {
    if (m.type === "purchase") {
      accumulatedStock += m.quantity;
    } else {
      accumulatedStock -= m.quantity;
    }
    m.runningBalance = accumulatedStock;
  });

  const purchaseMovements = movements.filter((m) => m.type === "purchase");

  const totalBuyQty = purchaseMovements.reduce((acc, m) => acc + m.quantity, 0);
  const totalBuySpent = purchaseMovements.reduce((acc, m) => acc + m.quantity * m.unitPrice, 0);
  const avgBuyPrice = totalBuyQty > 0 ? totalBuySpent / totalBuyQty : product.buyPrice;

  const totalSellRevenue = salesMovements.reduce((acc, m) => acc + m.quantity * m.unitPrice, 0);
  const avgSellPrice = totalSellQty > 0 ? totalSellRevenue / totalSellQty : product.sellPrice;

  const unitProfit = avgSellPrice - avgBuyPrice;
  const marginPercent = avgBuyPrice > 0 ? (unitProfit / avgBuyPrice) * 100 : 0;

  const totalRealizedProfit = salesMovements.reduce((acc, m) => {
    const profit = (m.unitPrice - avgBuyPrice) * m.quantity;
    return acc + profit;
  }, 0);

  const currentStockValuation = currentStock * avgBuyPrice;

  return {
    movements,
    purchaseMovements,
    salesMovements,
    totalBuyQty,
    totalBuySpent,
    avgBuyPrice,
    totalSellQty,
    totalSellRevenue,
    avgSellPrice,
    unitProfit,
    marginPercent,
    totalRealizedProfit,
    currentStockValuation,
    openingDevirQty,
    rawBuyQty,
  };
}

export const Products: React.FC<ProductsProps> = ({
  products,
  invoices = [],
  contacts = [],
  warehouses = [],
  employees = [],
  transactions = [],
  companySettings,
  globalSearchTerm = "",
  onAddProduct,
  onBulkAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
}: ProductsProps) => {
  const selection = useTableSelection();
  const activeWarehouses = warehouses && warehouses.length > 0 ? warehouses : defaultWarehouses;

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportProducts = (importedProducts: Product[], updateExisting: boolean) => {
    if (onBulkAddProducts) {
      onBulkAddProducts(importedProducts, updateExisting);
    } else {
      importedProducts.forEach((p) => onAddProduct(p));
    }
  };

  // PDF Generation State
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Maliyetler tab state
  const [costMethod, setCostMethod] = useState<"card" | "weighted_avg">("weighted_avg");
  const [costStockTypeFilter, setCostStockTypeFilter] = useState<string>("all");
  const [costMarginFilter, setCostMarginFilter] = useState<"all" | "low" | "high" | "negative">("all");
  const [costSearch, setCostSearch] = useState("");
  const [simulatedInflation, setSimulatedInflation] = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(25);

  const { theme } = useTheme();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Master-Detail Expanded Rows State (set of expanded product IDs)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleProductExpand = (id: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, showOnlyCritical, selectedWarehouseId, globalSearchTerm]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Selected product for Ekstre Modal
  const [selectedEkstreProduct, setSelectedEkstreProduct] = useState<Product | null>(null);
  const [whatsAppProduct, setWhatsAppProduct] = useState<Product | null>(null);
  const [isCatalogWhatsAppOpen, setIsCatalogWhatsAppOpen] = useState<boolean>(false);
  const [ekstreTab, setEkstreTab] = useState<"all" | "purchase" | "sales">("all");
  const [ekstreSearch, setEkstreSearch] = useState("");
  const [ekstreWarehouseId, setEkstreWarehouseId] = useState<string>("all");

  const criticalStockCount = useMemo(() => {
    return (products || []).filter((p) => {
      if (!p) return false;
      const q = p.stockQuantity || 0;
      const minAlert = p.minStockAlert !== undefined ? p.minStockAlert : 5;
      return q <= minAlert;
    }).length;
  }, [products]);

  const nav = useDetailNavigation<Product>({ moduleKey: "products" });

  const handleBackToList = React.useCallback(() => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setSelectedEkstreProduct(null);
    setIsTransferModalOpen(false);
    nav.backToList();
  }, [nav]);

  React.useEffect(() => {
    if (nav.mode === "list") {
      setIsModalOpen(false);
      setEditingProduct(null);
      setSelectedEkstreProduct(null);
      setIsTransferModalOpen(false);
    }
  }, [nav.mode]);

  // PDF Export Handler for Ekstre
  const handleExportEkstrePDF = async () => {
    if (!selectedEkstreProduct) return;
    const element = document.getElementById("printable-stock-ekstre");
    if (!element) {
      triggerFormErrorNotification("Yazdırılacak stok ekstre belgesi bulunamadı.", "Yazdırma Hatası");
      return;
    }
    try {
      setIsPdfGenerating(true);
      const safeCode = (selectedEkstreProduct.code || "Stok").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `Stok_Ekstresi_${safeCode}_${new Date().toISOString().split("T")[0]}.pdf`;
      await exportElementToPDF("printable-stock-ekstre", fileName, { orientation: "p", margin: 8, scale: 2 });
    } catch (err) {
      console.error("Stok Ekstresi PDF oluşturulurken hata:", err);
      triggerFormErrorNotification("PDF belgesi oluşturulurken bir hata oluştu.", "PDF Hatası");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Precompute analytics map for all products once
  const analyticsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getProductAnalytics>>();
    (products || []).forEach((p) => {
      if (p && p.id) {
        map.set(p.id, getProductAnalytics(p, invoices || []));
      }
    });
    return map;
  }, [products, invoices]);

  // Calculations for Maliyetler module
  const costProductsData = useMemo(() => {
    return (products || []).filter(Boolean).map((p) => {
      const analytics = analyticsMap.get(p.id);
      const cardBuy = p.buyPrice || 0;
      const cardSell = p.sellPrice || 0;
      const avgBuy = analytics?.avgBuyPrice && analytics.avgBuyPrice > 0 ? analytics.avgBuyPrice : cardBuy;
      const avgSell = analytics?.avgSellPrice && analytics.avgSellPrice > 0 ? analytics.avgSellPrice : cardSell;

      const baseBuy = costMethod === "weighted_avg" ? avgBuy : cardBuy;
      const simBuy = baseBuy * (1 + simulatedInflation / 100);
      const effectiveSell = cardSell;

      const unitProfit = effectiveSell - simBuy;
      const marginPercent = simBuy > 0 ? (unitProfit / simBuy) * 100 : 0;
      const suggestedSellPrice = simBuy * (1 + targetMargin / 100);

      const qty = p.stockQuantity || 0;
      const totalCost = qty * simBuy;
      const totalRevenue = qty * effectiveSell;
      const totalProfit = totalRevenue - totalCost;

      return {
        product: p,
        qty,
        cardBuy,
        cardSell,
        avgBuy,
        avgSell,
        effectiveBuy: simBuy,
        effectiveSell,
        unitProfit,
        marginPercent,
        totalCost,
        totalRevenue,
        totalProfit,
        suggestedSellPrice,
      };
    });
  }, [products, analyticsMap, costMethod, simulatedInflation, targetMargin]);

  const filteredCostProducts = useMemo(() => {
    return costProductsData.filter((item) => {
      const p = item.product;
      if (!p) return false;
      const q = (globalSearchTerm || costSearch || "").toLowerCase().trim();
      const pName = (p.name || "").toLowerCase();
      const pCode = (p.code || "").toLowerCase();
      const pCategory = (p.category || "").toLowerCase();
      const matchesSearch =
        !q ||
        pName.includes(q) ||
        pCode.includes(q) ||
        pCategory.includes(q);

      if (!matchesSearch) return false;

      if (costStockTypeFilter !== "all") {
        if ((p.stockType || "Ticari Mal") !== costStockTypeFilter) return false;
      }

      if (costMarginFilter === "low" && item.marginPercent >= 15) return false;
      if (costMarginFilter === "high" && item.marginPercent < 30) return false;
      if (costMarginFilter === "negative" && item.marginPercent > 0) return false;

      return true;
    });
  }, [costProductsData, globalSearchTerm, costSearch, costStockTypeFilter, costMarginFilter]);

  const costTotals = useMemo(() => {
    let totalValuation = 0;
    let totalPotentialRevenue = 0;
    let totalPotentialProfit = 0;
    let totalItems = 0;

    filteredCostProducts.forEach((item) => {
      totalValuation += item.totalCost;
      totalPotentialRevenue += item.totalRevenue;
      totalPotentialProfit += item.totalProfit;
      totalItems += item.qty;
    });

    const overallMargin = totalValuation > 0 ? (totalPotentialProfit / totalValuation) * 100 : 0;

    return { totalValuation, totalPotentialRevenue, totalPotentialProfit, totalItems, overallMargin };
  }, [filteredCostProducts]);

  // Warehouse Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferProductId, setTransferProductId] = useState<string>("");
  const [transferFromWhId, setTransferFromWhId] = useState<string>(activeWarehouses[0]?.id || "wh_1");
  const [transferToWhId, setTransferToWhId] = useState<string>(activeWarehouses[1]?.id || "wh_2");
  const [transferQuantity, setTransferQuantity] = useState<number>(10);
  const [transferNotes, setTransferNotes] = useState<string>("");
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string>("");

  // Add/Edit Product Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("Adet");
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [vatRate, setVatRate] = useState(20);
  const [stockQuantity, setStockQuantity] = useState(100);
  const [category, setCategory] = useState("Genel");
  const [stockType, setStockType] = useState("Ticari Mal");
  const [barcode, setBarcode] = useState("");
  const [imeiOrSerialNo, setImeiOrSerialNo] = useState("");
  const [enableImei, setEnableImei] = useState(false);
  const [primaryWarehouseId, setPrimaryWarehouseId] = useState<string>(activeWarehouses[0]?.id || "wh_1");

  const handleGenerateBarcode = () => {
    const randomBarcode = "8690" + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcode(randomBarcode);
  };

  const handleOpenAddModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setCode(p.code);
      setName(p.name);
      setUnit(p.unit || "Adet");
      setBuyPrice(p.buyPrice);
      setSellPrice(p.sellPrice);
      setVatRate(p.vatRate);
      setStockQuantity(p.stockQuantity);
      setCategory(p.category || "Genel");
      setStockType(p.stockType || "Ticari Mal");
      setBarcode(p.barcode || "");
      setImeiOrSerialNo(p.imeiOrSerialNo || "");
      setEnableImei(!!p.imeiOrSerialNo);
      setPrimaryWarehouseId(p.warehouseId || activeWarehouses[0]?.id || "wh_1");
    } else {
      setEditingProduct(null);
      setCode(`URN-${Date.now().toString().slice(-5)}`);
      setName("");
      setUnit("Adet");
      setBuyPrice(0);
      setSellPrice(0);
      setVatRate(20);
      setStockQuantity(100);
      setCategory("Genel");
      setStockType("Ticari Mal");
      setBarcode("8690" + Math.floor(100000000 + Math.random() * 900000000).toString());
      setImeiOrSerialNo("");
      setEnableImei(false);
      setPrimaryWarehouseId(activeWarehouses[0]?.id || "wh_1");
    }
    setIsModalOpen(true);
  };

  const handleOpenTransferModal = (prodId?: string, fromWh?: string) => {
    const initialProd = prodId ? products.find((p) => p.id === prodId) : products[0];
    const pId = initialProd ? initialProd.id : "";
    setTransferProductId(pId);
    setTransferFromWhId(fromWh || activeWarehouses[0]?.id || "wh_1");
    setTransferToWhId(fromWh === activeWarehouses[1]?.id ? activeWarehouses[0]?.id : activeWarehouses[1]?.id || "wh_2");
    setTransferQuantity(10);
    setTransferNotes("");
    setTransferSuccessMsg("");
    setIsTransferModalOpen(true);
  };

  const handleExecuteStockTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferFromWhId || !transferToWhId) return;
    if (transferFromWhId === transferToWhId) {
      triggerFormErrorNotification("Çıkış deposu ile hedef depo aynı olamaz.", "Stok Transfer Hatası", "Hedef Depo");
      return;
    }

    const targetProd = products.find((p) => p.id === transferProductId);
    if (!targetProd) return;

    const sourceQty = getProductStockInWarehouse(targetProd, transferFromWhId, activeWarehouses);
    if (transferQuantity <= 0) {
      triggerFormErrorNotification("Lütfen geçerli bir transfer miktarı girin.", "Stok Transfer Hatası", "Miktar");
      return;
    }
    if (transferQuantity > sourceQty) {
      triggerFormErrorNotification(`Transfer miktarı çıkış deposundaki stoktan (${sourceQty} ${targetProd.unit}) fazla olamaz.`, "Stok Yetersiz", "Miktar");
      return;
    }

    const fromWhObj = activeWarehouses.find((w) => w.id === transferFromWhId);
    const toWhObj = activeWarehouses.find((w) => w.id === transferToWhId);

    // Update warehouseQuantities
    const existingQuantities: Record<string, number> = {};
    activeWarehouses.forEach((w) => {
      existingQuantities[w.id] = getProductStockInWarehouse(targetProd, w.id, activeWarehouses);
    });

    existingQuantities[transferFromWhId] = Math.max(0, existingQuantities[transferFromWhId] - transferQuantity);
    existingQuantities[transferToWhId] = (existingQuantities[transferToWhId] || 0) + transferQuantity;

    const updatedProduct: Product = {
      ...targetProd,
      warehouseQuantities: existingQuantities,
    };

    if (onUpdateProduct) {
      onUpdateProduct(updatedProduct);
    } else {
      onAddProduct(updatedProduct);
    }

    setTransferSuccessMsg(
      `${transferQuantity} ${targetProd.unit} '${targetProd.name}', ${fromWhObj?.name || "Çıkış Deposu"}'ndan ${toWhObj?.name || "Hedef Depo"}'na başarıyla sevk edildi.`
    );

    setTimeout(() => {
      setIsTransferModalOpen(false);
      setTransferSuccessMsg("");
    }, 1800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const safeName = (name || "").trim();
    if (!safeName) return;

    const safeBarcode = (barcode || "").trim();
    const safeImei = (imeiOrSerialNo || "").trim();
    const selectedWh = activeWarehouses.find((w) => w.id === primaryWarehouseId);
    const isImeiApplicable = stockType === "Ticari Mal" || enableImei || safeName.length > 0;

    if (editingProduct) {
      const updatedProd: Product = {
        ...editingProduct,
        code: code || editingProduct.code,
        name: safeName,
        unit,
        buyPrice,
        sellPrice,
        vatRate,
        stockQuantity,
        category,
        stockType,
        barcode: safeBarcode || undefined,
        imeiOrSerialNo: isImeiApplicable && safeImei ? safeImei : undefined,
        warehouseId: primaryWarehouseId,
        warehouseName: selectedWh?.name,
      };
      if (onUpdateProduct) {
        onUpdateProduct(updatedProd);
      } else {
        onAddProduct(updatedProd);
      }
    } else {
      const gebzeQty = Math.floor(stockQuantity * 0.5);
      const ikitelliQty = Math.floor(stockQuantity * 0.3);
      const ankaraQty = Math.max(0, stockQuantity - gebzeQty - ikitelliQty);

      const newProd: Product = {
        id: "p_" + Date.now(),
        code: code || `URN-${Date.now().toString().slice(-4)}`,
        name: safeName,
        unit,
        buyPrice,
        sellPrice,
        vatRate,
        stockQuantity,
        category,
        stockType,
        barcode: safeBarcode || undefined,
        imeiOrSerialNo: isImeiApplicable && safeImei ? safeImei : undefined,
        warehouseId: primaryWarehouseId,
        warehouseName: selectedWh?.name,
        warehouseQuantities: {
          [primaryWarehouseId]: stockQuantity,
          wh_1: primaryWarehouseId === "wh_1" ? stockQuantity : gebzeQty,
          wh_2: primaryWarehouseId === "wh_2" ? stockQuantity : ikitelliQty,
          wh_3: primaryWarehouseId === "wh_3" ? stockQuantity : ankaraQty,
        },
      };
      onAddProduct(newProd);
    }

    setIsModalOpen(false);
  };

  // Sütun Bazlı Filtreleme Durumu
  const [colFilters, setColFilters] = useState<{
    code: string;
    name: string;
    warehouse: string;
    stockType: string;
    price: string;
    stock: string;
  }>({
    code: "",
    name: "",
    warehouse: "",
    stockType: "",
    price: "",
    stock: "",
  });
  const [showColFilters, setShowColFilters] = useState(true);

  const activeColFilterCount = useMemo(() => {
    return (Object.values(colFilters || {}) as string[]).filter((v) => Boolean(v && typeof v === "string" && v.trim() !== "")).length;
  }, [colFilters]);

  const clearAllColFilters = () => {
    setColFilters({
      code: "",
      name: "",
      warehouse: "",
      stockType: "",
      price: "",
      stock: "",
    });
  };

  // Kolon Yönetimi (Sütun Göster / Gizle)
  const {
    columns: productColumns,
    columnVisibility: productColVisibility,
    toggleColumn: toggleProductCol,
    setAllColumns: setAllProductCols,
    resetToDefaults: resetProductCols,
    isVisible: isProductColVisible,
    hiddenCount: hiddenProductColCount,
  } = useColumnVisibility("products", PRODUCT_TABLE_COLUMNS);

  const visibleProductColCount = useMemo(() => {
    return 1 + PRODUCT_TABLE_COLUMNS.filter((c) => isProductColVisible(c.id)).length;
  }, [isProductColVisible]);

  // Filter products by search and selected warehouse
  const deferredSearch = useDeferredValue(search);
  const deferredGlobalSearch = useDeferredValue(globalSearchTerm);
  const activeSearchQuery = (deferredGlobalSearch || deferredSearch || "").toLowerCase().trim();

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (!p) return false;
      const pName = (p.name || "").toLowerCase();
      const pCode = (p.code || "").toLowerCase();
      const pBarcode = (p.barcode || "").toLowerCase();
      const pImei = (p.imeiOrSerialNo || "").toLowerCase();
      const pStockType = (p.stockType || "").toLowerCase();

      const matchesSearch =
        !activeSearchQuery ||
        pName.includes(activeSearchQuery) ||
        pCode.includes(activeSearchQuery) ||
        pBarcode.includes(activeSearchQuery) ||
        pImei.includes(activeSearchQuery) ||
        pStockType.includes(activeSearchQuery);

      if (!matchesSearch) return false;

      // Sütun Bazlı Filtreler (Header Inputs)
      if (colFilters?.code) {
        const q = (colFilters.code || "").toLowerCase().trim();
        if (!pCode.includes(q) && !pBarcode.includes(q) && !pImei.includes(q)) return false;
      }

      if (colFilters?.name) {
        const q = (colFilters.name || "").toLowerCase().trim();
        if (!pName.includes(q)) return false;
      }

      if (colFilters?.warehouse) {
        const q = (colFilters.warehouse || "").toLowerCase().trim();
        const catStr = (p.category || "").toLowerCase();
        const whNames = (p.warehouseName || activeWarehouses.find((w) => w.id === p.warehouseId)?.name || "").toLowerCase();
        if (!catStr.includes(q) && !whNames.includes(q)) return false;
      }

      if (colFilters?.stockType) {
        const q = (colFilters.stockType || "").toLowerCase().trim();
        const stStr = (p.stockType || "").toLowerCase();
        const unitStr = (p.unit || "").toLowerCase();
        if (!stStr.includes(q) && !unitStr.includes(q)) return false;
      }

      if (colFilters?.price) {
        const q = (colFilters.price || "").toLowerCase().trim();
        const buyStr = String(p.purchasePrice || p.buyPrice || "");
        const sellStr = String(p.sellingPrice || p.sellPrice || "");
        if (!buyStr.includes(q) && !sellStr.includes(q)) return false;
      }

      if (colFilters?.stock) {
        const q = (colFilters.stock || "").toLowerCase().trim();
        const stockInWh = getProductStockInWarehouse(p, selectedWarehouseId, activeWarehouses);
        if (!String(stockInWh).includes(q)) return false;
      }

      if (selectedWarehouseId !== "all") {
        const stockInWh = getProductStockInWarehouse(p, selectedWarehouseId, activeWarehouses);
        if (stockInWh < 0) return false;
      }

      if (showOnlyCritical) {
        const stockInWh = getProductStockInWarehouse(p, selectedWarehouseId, activeWarehouses);
        const minAlert = p.minStockAlert !== undefined ? p.minStockAlert : 5;
        if (stockInWh > minAlert) return false;
      }

      return true;
    });
  }, [products, activeSearchQuery, selectedWarehouseId, activeWarehouses, showOnlyCritical, colFilters]);

  const displayedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const displayedProductIds = useMemo(() => {
    return displayedProducts.map((p) => p.id);
  }, [displayedProducts]);

  const getStockTypeBadgeClass = (st?: string) => {
    switch (st) {
      case "İlk Madde Malzeme":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Yarı Mamul":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Ham Madde":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Ticari Mal":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Hizmet":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Warehouse Analytics
  const selectedWhObj = activeWarehouses.find((w) => w.id === selectedWarehouseId);

  const getWhAnalytics = (whId: string) => {
    let totalItems = 0;
    let totalQty = 0;
    let totalValue = 0;

    products.forEach((p) => {
      const qty = getProductStockInWarehouse(p, whId, activeWarehouses);
      if (qty > 0) {
        totalItems += 1;
        totalQty += qty;
        totalValue += qty * (p.buyPrice || 0);
      }
    });

    return { totalItems, totalQty, totalValue };
  };

  const totalConsolidatedQty = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const totalConsolidatedValue = products.reduce((acc, p) => acc + (p.stockQuantity || 0) * (p.buyPrice || 0), 0);

  // Analytics for selected Ekstre Product
  const ekstreAnalytics = selectedEkstreProduct
    ? getProductAnalytics(selectedEkstreProduct, invoices)
    : null;

  const filteredEkstreMovements = ekstreAnalytics
    ? ekstreAnalytics.movements.filter((m) => {
        const matchesTab =
          ekstreTab === "all" ? true : ekstreTab === "purchase" ? m.type === "purchase" : m.type === "sales";
        const matchesSearch =
          !ekstreSearch ||
          m.contactName.toLowerCase().includes(ekstreSearch.toLowerCase()) ||
          m.invoiceNumber.toLowerCase().includes(ekstreSearch.toLowerCase());
        return matchesTab && matchesSearch;
      })
    : [];

  // Export Data Builder for Main Product List
  const getProductsExportData = (targetProducts: Product[] = filteredProducts): ExportData => {
    const headers = [
      "Stok Kodu",
      "Barkod",
      "Ürün / Hizmet Adı",
      "Seri/IMEI Noları",
      "Bulunduğu Depo",
      "Birim",
      "Alış Fiyatı",
      "Satış Fiyatı",
      "Para Birimi",
      "Mevcut Stok Qty",
      "KDV Oranı (%)",
      "Kritik Stok Sınırı",
      "Stok Türü",
    ];
    const rows = targetProducts.map((p) => [
      p.code || "",
      p.barcode || "",
      p.name || "",
      p.serials && p.serials.length > 0 ? p.serials.join(", ") : "",
      p.warehouseName || activeWarehouses[0]?.name || "",
      p.unit || "Adet",
      formatCurrency(p.purchasePrice || 0, p.currency || "TRY"),
      formatCurrency(p.sellingPrice || 0, p.currency || "TRY"),
      p.currency || "TRY",
      p.stockQuantity || 0,
      p.vatRate || 0,
      p.minStockAlert || 0,
      p.isService ? "Hizmet / Servis" : "Fiziksel Stok",
    ]);

    return {
      filename: `Stok_Listesi_${new Date().toISOString().split("T")[0]}`,
      title: "ÜRÜN VE HİZMET STOK LİSTESİ",
      subtitle: selectedWarehouseId === "all" ? `Tüm Depolar Genel Toplamı (${targetProducts.length} Ürün)` : `${selectedWhObj?.name || "Seçili Depo"} Stok Durumu (${targetProducts.length} Ürün)`,
      headers,
      rows,
    };
  };

  const handleBulkDelete = async () => {
    const ids = selection.selectedIdArray;
    if (onBulkDeleteProducts) {
      onBulkDeleteProducts(ids);
    } else {
      ids.forEach((id) => onDeleteProduct(id));
    }
    selection.clearSelection();
  };

  const handleBulkExportExcel = () => {
    const selectedProds = filteredProducts.filter((p) => selection.isSelected(p.id));
    exportToExcel(getProductsExportData(selectedProds));
  };

  const handleBulkExportPdf = () => {
    const selectedProds = filteredProducts.filter((p) => selection.isSelected(p.id));
    exportToPDF(getProductsExportData(selectedProds));
  };

  // Export Data Builder for Ekstre Modal Movements
  const getEkstreExportData = (): ExportData => {
    if (!selectedEkstreProduct) return { filename: "Ekstre", title: "", headers: [], rows: [] };
    const pCurrency = selectedEkstreProduct.currency || "TRY";
    const headers = [
      "Tarih",
      "İşlem Tipi",
      "Evrak / Fatura No",
      "Cari Unvanı / Müşteri / Tedarikçi",
      "Miktar",
      "Birim",
      "Birim Fiyat",
      "KDV Dahil Toplam",
      "Yürüyen Stok Bakiye",
      "Açıklama",
    ];
    const rows = filteredEkstreMovements.map((m) => [
      formatDate(m.issueDate),
      m.type === "purchase" ? "Mal Alımı (Giriş)" : "Mal Satışı (Çıkış)",
      m.invoiceNumber,
      m.contactName,
      m.type === "purchase" ? `+${m.quantity}` : `-${m.quantity}`,
      m.unit,
      formatCurrency(m.unitPrice || 0, pCurrency),
      formatCurrency(m.totalWithVat || 0, pCurrency),
      m.runningBalance !== undefined ? `${m.runningBalance} ${m.unit}` : "-",
      m.itemDescription || "",
    ]);
    const whName =
      ekstreWarehouseId === "all"
        ? "Tüm Depolar (Konsolide)"
        : activeWarehouses.find((w) => w.id === ekstreWarehouseId)?.name || "Seçili Depo";
    const safeCode = (selectedEkstreProduct.code || "Stok").replace(/[^a-zA-Z0-9_-]/g, "_");
    return {
      filename: `Stok_Ekstresi_${safeCode}_${new Date().toISOString().split("T")[0]}`,
      title: `RESMİ STOK VE DEPO HAREKET EKSTRESİ: ${selectedEkstreProduct.name}`,
      subtitle: `Stok Kodu: ${selectedEkstreProduct.code} | Kapsam: ${whName} | Toplam Stok: ${selectedEkstreProduct.stockQuantity} ${selectedEkstreProduct.unit} | Barkod: ${selectedEkstreProduct.barcode || "-"}`,
      headers,
      rows,
    };
  };

  const getCostsExportData = (): ExportData => {
    const headers = [
      "Stok Kodu",
      "Ürün / Hizmet Adı",
      "Stok Türü",
      "Kategori",
      "Mevcut Miktar",
      "Birim",
      "Birim Alış Maliyeti",
      "AOF (Ortalama Alış)",
      "Birim Satış Fiyatı",
      "Birim Kar",
      "Kar Marjı (%)",
      "Toplam Envanter Maliyeti",
      "Tahmini Toplam Ciro",
      "Potansiyel Toplam Kar",
    ];
    const rows = filteredCostProducts.map((item) => [
      item.product.code || "",
      item.product.name || "",
      item.product.stockType || "Ticari Mal",
      item.product.category || "Genel",
      item.qty,
      item.product.unit || "Adet",
      formatCurrency(item.effectiveBuy, item.product.currency || "TRY"),
      formatCurrency(item.avgBuy, item.product.currency || "TRY"),
      formatCurrency(item.effectiveSell, item.product.currency || "TRY"),
      formatCurrency(item.unitProfit, item.product.currency || "TRY"),
      `%${item.marginPercent.toFixed(1)}`,
      formatCurrency(item.totalCost, item.product.currency || "TRY"),
      formatCurrency(item.totalRevenue, item.product.currency || "TRY"),
      formatCurrency(item.totalProfit, item.product.currency || "TRY"),
    ]);
    return {
      filename: `Stok_Maliyet_ve_Kar_Analizi_${new Date().toISOString().split("T")[0]}`,
      title: "STOK MALİYET VE KAR MARJI ANALİZ RAPORU",
      subtitle: `Yöntem: ${costMethod === "weighted_avg" ? "Ağırlıklı Ortalama Maliyet (AOF)" : "Kart Tanımlı Maliyet"} | Ürün Sayısı: ${filteredCostProducts.length}`,
      headers,
      rows,
    };
  };

  if (isTransferModalOpen) {
    return (
        <DetailPageLayout
          title="Depolar Arası Stok Transferi"
          subtitle="Seçili stoğu depolar arasında sevk edin ve depo bakiyelerini güncelleyin"
          breadcrumbs={[
            { label: "Stoklar & Depolar", onClick: handleBackToList },
            { label: "Depolar Arası Transfer", active: true },
          ]}
          onBack={handleBackToList}
          headerIcon={<ArrowRightLeft className="w-5 h-5 text-amber-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">

            {transferSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-950 font-bold">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>{transferSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleExecuteStockTransfer} className="space-y-4 text-xs">
                {/* 1. PRODUCT SELECTOR */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Transfer Edilecek Ürün / Malzeme *</label>
                  <select
                    value={transferProductId}
                    onChange={(e) => setTransferProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-extrabold rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} (Toplam: {p.stockQuantity} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. FROM & TO WAREHOUSES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/80">
                  <div>
                    <label className="block font-bold text-amber-950 mb-1">Çıkış Yapılacak Depo (Kaynak) *</label>
                    <select
                      value={transferFromWhId}
                      onChange={(e) => setTransferFromWhId(e.target.value)}
                      className="w-full bg-white border border-amber-200 text-slate-900 font-bold rounded-xl p-2 focus:ring-2 focus:ring-amber-500/20"
                    >
                      {activeWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>

                    {transferProductId && (
                      <div className="text-[10px] text-amber-800 font-mono font-bold mt-1">
                        Mevcut Stok:{" "}
                        {(() => {
                          const p = products.find((x) => x.id === transferProductId);
                          return p ? getProductStockInWarehouse(p, transferFromWhId, activeWarehouses) : 0;
                        })()}{" "}
                        Miktar
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-amber-950 mb-1">Giriş Yapılacak Depo (Hedef) *</label>
                    <select
                      value={transferToWhId}
                      onChange={(e) => setTransferToWhId(e.target.value)}
                      className="w-full bg-white border border-amber-200 text-slate-900 font-bold rounded-xl p-2 focus:ring-2 focus:ring-amber-500/20"
                    >
                      {activeWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>

                    {transferProductId && (
                      <div className="text-[10px] text-amber-800 font-mono font-bold mt-1">
                        Mevcut Stok:{" "}
                        {(() => {
                          const p = products.find((x) => x.id === transferProductId);
                          return p ? getProductStockInWarehouse(p, transferToWhId, activeWarehouses) : 0;
                        })()}{" "}
                        Miktar
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. QUANTITY & NOTES */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Transfer Miktarı *</label>
                    <input
                      type="number"
                      min={1}
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 text-slate-900 font-mono font-extrabold rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Sevk Açıklaması / Belge No</label>
                    <input
                      type="text"
                      placeholder="ör: Şubeler Arası İhtiyaç İrsaliyesi No: TRF-2026-088"
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-extrabold bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Transferi Onayla</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </DetailPageLayout>
    );
  }

  if (selectedEkstreProduct && ekstreAnalytics) {
    return (
        <DetailPageLayout
          title={`${selectedEkstreProduct.name} - Stok Hareket Ekstresi & Depo Raporu`}
          subtitle={`Stok Kodu: ${selectedEkstreProduct.code} • Toplam Stok: ${selectedEkstreProduct.stockQuantity} ${selectedEkstreProduct.unit}`}
          breadcrumbs={[
            { label: "Stoklar & Depolar", onClick: handleBackToList },
            { label: selectedEkstreProduct.name, active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              {selectedEkstreProduct.stockQuantity > 0 ? "Stokta Var" : "Tükendi"}
            </span>
          }
          headerIcon={<Package className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWhatsAppProduct(selectedEkstreProduct)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Stok Ekstresini WhatsApp ile Paylaş"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200" />
                <span>WhatsApp ile Paylaş</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Yazdır"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span className="hidden sm:inline">Yazdır</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200/80 shadow-sm max-w-6xl mx-auto space-y-6">
            {/* 2. Interactive Control Bar (no-print) */}
            <div className="bg-purple-50/80 border-b border-purple-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
              {/* Warehouse selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-purple-950 font-bold">
                  <WarehouseIcon className="w-4 h-4 text-purple-700" />
                  <span>Depo Kapsamı:</span>
                </div>
                <select
                  value={ekstreWarehouseId}
                  onChange={(e) => setEkstreWarehouseId(e.target.value)}
                  className="bg-white border border-purple-300 text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">🏢 Tüm Depolar (Konsolide Toplam)</option>
                  {activeWarehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      🏬 {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleOpenTransferModal(selectedEkstreProduct.id)}
                  className="text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="Depolar Arası Transfer"
                >
                  <ArrowRightLeft className="w-3 h-3 text-amber-700" />
                  <span className="hidden sm:inline">Depolar Arası Transfer</span>
                </button>
              </div>

              {/* Movement Filter Tabs & Search */}
              <div className="flex items-center gap-2 flex-wrap ml-auto">
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-purple-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setEkstreTab("all")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                      ekstreTab === "all" ? "bg-purple-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tümü ({ekstreAnalytics.movements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEkstreTab("purchase")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                      ekstreTab === "purchase" ? "bg-blue-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Alış / Giriş ({ekstreAnalytics.purchaseMovements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEkstreTab("sales")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                      ekstreTab === "sales" ? "bg-indigo-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Satış / Çıkış ({ekstreAnalytics.salesMovements.length})
                  </button>
                </div>

                <div className="relative w-40 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Fatura No veya Müşteri Ara..."
                    value={ekstreSearch}
                    onChange={(e) => setEkstreSearch(e.target.value)}
                    className="w-full bg-white border border-purple-200 text-slate-900 text-xs rounded-lg pl-8 pr-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            </div>

            {/* 3. Printable Statement Canvas Container */}
            <div className="p-3 sm:p-6 bg-slate-200/60 overflow-y-auto custom-scrollbar flex-1 flex justify-center">
              <div
                id="printable-stock-ekstre"
                className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-purple-200 w-full max-w-4xl mx-auto space-y-5 font-sans text-xs sm:text-sm"
              >
                {/* 3.1 Corporate Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-purple-900">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-purple-950 uppercase">
                          {companySettings?.companyTitle || companySettings?.companyName || "MUAVİN KURUMSAL STOK VE DEPO YÖNETİMİ"}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                          Envanter Kayıt, Ambar Stok Takip ve Tevsik Sistemi
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 pl-11 space-y-0.5">
                      {companySettings?.address && <p>{companySettings.address}</p>}
                      <p>
                        {companySettings?.taxOffice && `${companySettings.taxOffice} V.D.`}
                        {companySettings?.taxNumber && ` • VKN/TCKN: ${companySettings.taxNumber}`}
                        {companySettings?.phone && ` • Tel: ${companySettings.phone}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-purple-50/80 p-3 rounded-xl border border-purple-200 space-y-1 shrink-0 w-full sm:w-auto">
                    <div className="inline-block bg-purple-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider">
                      RESMİ STOK VE DEPO EKSTRESİ
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      Stok Kodu: <span className="font-mono text-purple-950 font-black">{selectedEkstreProduct.code}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Tarih: <span className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString("tr-TR")}</span>
                    </div>
                    <div className="text-[10px] text-purple-900 font-extrabold">
                      Kapsam:{" "}
                      <span>
                        {ekstreWarehouseId === "all"
                          ? "Konsolide (Tüm Depolar)"
                          : activeWarehouses.find((w) => w.id === ekstreWarehouseId)?.name || "Seçili Depo"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3.2 Product Title Banner */}
                <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white p-3.5 rounded-xl text-center shadow-md">
                  <h1 className="text-sm sm:text-base font-black tracking-wide uppercase">
                    ÜRÜN HAREKET EKSTRESİ VE DEPO ENVANTER BELGESİ
                  </h1>
                  <p className="text-[11px] text-purple-200 mt-0.5 font-medium">
                    {selectedEkstreProduct.name} • Barkod: {selectedEkstreProduct.barcode || "Tanımsız"} • Stok Türü: {selectedEkstreProduct.stockType || "Ticari Mal"}
                  </p>
                </div>

                {/* 3.3 Two-Column Details Card: Product Info & Warehouse Distribution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Product Card Details */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-700" />
                        Ürün & Kart Bilgileri
                      </span>
                      <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        Stok Kartı
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Ürün Adı:</span>
                        <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{selectedEkstreProduct.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Stok Kodu:</span>
                        <span className="font-mono font-bold text-purple-950">{selectedEkstreProduct.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Kategori & Cins:</span>
                        <span className="font-semibold text-slate-800">{selectedEkstreProduct.category || "Genel"} / {selectedEkstreProduct.stockType || "Ticari Mal"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Barkod / Seri:</span>
                        <span className="font-mono font-medium text-slate-700">{selectedEkstreProduct.barcode || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">KDV Oranı & Birim:</span>
                        <span className="font-bold text-slate-900">%{selectedEkstreProduct.vatRate || 20} • {selectedEkstreProduct.unit || "Adet"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Kritik Stok Uyarısı:</span>
                        <span className="font-bold text-amber-700">{selectedEkstreProduct.minStockAlert || 0} {selectedEkstreProduct.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Warehouse & Inventory Distribution */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <WarehouseIcon className="w-3.5 h-3.5 text-purple-700" />
                        Depo Bazlı Stok Dağılımı
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        Fiili Envanter
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center bg-purple-100/70 px-2.5 py-1 rounded-lg font-bold">
                        <span className="text-purple-950">İncelenen Kapsam Bakiye:</span>
                        <span className="font-mono text-purple-950 text-sm font-black">
                          {getProductStockInWarehouse(selectedEkstreProduct, ekstreWarehouseId, activeWarehouses)}{" "}
                          <span className="text-xs">{selectedEkstreProduct.unit}</span>
                        </span>
                      </div>
                      <div className="space-y-1 pt-0.5">
                        {activeWarehouses.map((wh) => {
                          const qty = getProductStockInWarehouse(selectedEkstreProduct, wh.id, activeWarehouses);
                          const isCurrent = ekstreWarehouseId === wh.id;
                          return (
                            <div
                              key={wh.id}
                              className={`flex justify-between items-center px-2 py-0.5 rounded text-[11px] ${
                                isCurrent ? "bg-purple-200/60 font-bold text-purple-950" : "text-slate-700"
                              }`}
                            >
                              <span>{wh.name} ({wh.code}):</span>
                              <span className="font-mono font-bold">{qty} {selectedEkstreProduct.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.4 Summary Analytics 4-Box Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Box 1: Mal Alımları / Giriş */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 space-y-1 text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                      TOPLAM GİRİŞ / ALIŞ
                    </div>
                    <div className="text-xs text-blue-800 font-bold">
                      {ekstreAnalytics.totalBuyQty} {selectedEkstreProduct.unit}
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-blue-950">
                      ₺{ekstreAnalytics.totalBuySpent.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-blue-700 font-semibold border-t border-blue-200/60 pt-1">
                      AOF: ₺{ekstreAnalytics.avgBuyPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Box 2: Mal Satışları / Çıkış */}
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 space-y-1 text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                      TOPLAM ÇIKIŞ / SATIŞ
                    </div>
                    <div className="text-xs text-indigo-800 font-bold">
                      {ekstreAnalytics.totalSellQty} {selectedEkstreProduct.unit}
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-indigo-950">
                      ₺{ekstreAnalytics.totalSellRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-indigo-700 font-semibold border-t border-indigo-200/60 pt-1">
                      Ort. Satış: ₺{ekstreAnalytics.avgSellPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Box 3: Brüt Kar & Marj */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 space-y-1 text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                      BRÜT KAR & PERFORMANS
                    </div>
                    <div className="text-xs text-emerald-800 font-bold">
                      %{ekstreAnalytics.marginPercent.toFixed(1)} Kar Marjı
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-emerald-800">
                      ₺{ekstreAnalytics.totalRealizedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold border-t border-emerald-200/60 pt-1">
                      Birim Kar: +₺{ekstreAnalytics.unitProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Box 4: Mevcut Stok Değerleme */}
                  <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 space-y-1 text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-900">
                      MEVCUT STOK DEĞERİ
                    </div>
                    <div className="text-xs text-purple-800 font-bold">
                      {selectedEkstreProduct.stockQuantity} {selectedEkstreProduct.unit} Bakiye
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-purple-950">
                      ₺{ekstreAnalytics.currentStockValuation.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-purple-700 font-semibold border-t border-purple-200/60 pt-1">
                      Maliyet Bazlı Değerleme
                    </div>
                  </div>
                </div>

                {/* 3.5 Movement Details Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-950 border-b border-purple-200 pb-1">
                    <span>RESMİ STOK HAREKETLERİ VE EVRAK DÖKÜMÜ</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Listelenen İşlem Sayısı: <strong className="text-slate-800">{filteredEkstreMovements.length}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto w-full rounded-xl border border-purple-200">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead className="bg-purple-900 text-white font-extrabold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Tarih</th>
                          <th className="py-2.5 px-3">İşlem Türü</th>
                          <th className="py-2.5 px-3">Evrak / Fatura No</th>
                          <th className="py-2.5 px-3">Cari / Müşteri / Tedarikçi</th>
                          <th className="py-2.5 px-3 text-right">Miktar</th>
                          <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                          <th className="py-2.5 px-3 text-right">KDV Dahil Tutar</th>
                          <th className="py-2.5 px-3 text-right bg-purple-950 text-purple-100">Yürüyen Bakiye</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100 text-slate-800">
                        {filteredEkstreMovements.map((m, idx) => {
                          const isPurchase = m.type === "purchase";
                          return (
                            <tr key={m.id} className={idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"}>
                              <td className="py-2 px-3 font-mono font-medium text-slate-700">{formatDate(m.issueDate)}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                                    isPurchase
                                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                                      : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  }`}
                                >
                                  {isPurchase ? "Alış / Giriş" : "Satış / Çıkış"}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.invoiceNumber}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[180px]">
                                {m.contactName}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-tabular-num-md font-extrabold text-slate-900">
                                {isPurchase ? "+" : "-"}{m.quantity} {m.unit}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-tabular-num-md text-slate-700">
                                ₺{m.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-tabular-num-md font-bold text-slate-900">
                                ₺{m.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-tabular-num-md font-black text-purple-950 bg-purple-100/50">
                                {m.runningBalance !== undefined ? m.runningBalance : "-"} {m.unit}
                              </td>
                            </tr>
                          );
                        })}

                        {filteredEkstreMovements.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                              Bu kriterlere ve filtreye uygun stok hareketi bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3.6 Legal Provisions / Statutory Note */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-[10px] text-slate-600 leading-relaxed">
                  <div className="font-extrabold text-slate-800 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    YASAL HÜKÜMLER, ENVANTER TEVSİK VE TEYİT ŞARTLARI
                  </div>
                  <p>
                    <strong>1.</strong> İşbu stok ekstresi, 213 Sayılı Vergi Usul Kanunu (VUK M.182-196) envanter ve ambar kayıtları ile 6102 Sayılı Türk Ticaret Kanunu hükümleri uyarınca işletme fiili ve kaydi stok hareketlerinin tevsiki amacıyla düzenlenmiştir.
                  </p>
                  <p>
                    <strong>2.</strong> Depo giriş-çıkışları irsaliye, e-fatura ve ambar kabul/sevk belgeleri ile tevsik edilmiş olup kaydi bakiye ile fiili sayım sonuçları mutabık kabul edilir.
                  </p>
                  <p>
                    <strong>3.</strong> Konsolide veya depo bazlı hareket kayıtları denetim ve resmi incelemelerde tevsik edici belge niteliği taşır.
                  </p>
                </div>

                {/* 3.7 Official Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-purple-200">
                  <div className="text-center space-y-12">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs uppercase">DÜZENLEYEN / DEPO SORUMLUSU</div>
                      <div className="text-[10px] text-slate-500">Ambar Kayıt & Stok Teslim Sorumlusu</div>
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                    <div className="text-[10px] text-slate-400 italic">İmza / Kaşe</div>
                  </div>

                  <div className="text-center space-y-12">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs uppercase">ŞİRKET YETKİLİSİ / MUHASEBE ONAYI</div>
                      <div className="text-[10px] text-slate-500">Mali İşler & Envanter Yetkilisi</div>
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                    <div className="text-[10px] text-slate-400 italic">İmza / Mühür</div>
                  </div>
                </div>

                {/* 3.8 Footer text */}
                <div className="text-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  Bu stok ekstresi elektronik ortamda oluşturulmuş olup resmi envanter ve muhasebe kayıtlarının tevsik edici belgesidir. • Muavin Stok & Depo Yönetim Sistemi
                </div>
              </div>
            </div>

            {/* 4. Modal Footer (no-print) */}
            <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between z-20 no-print">
              <span className="text-xs text-slate-600 font-semibold">
                Toplam Kayıt: <strong className="text-purple-950">{filteredEkstreMovements.length}</strong> hareket listeleniyor
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportEkstrePDF}
                  disabled={isPdfGenerating}
                  className="px-4 py-2 font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{isPdfGenerating ? "PDF Oluşturuluyor..." : "PDF Olarak İndir"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-5 py-2 font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        </DetailPageLayout>
    );
  }

      {/* FULL-PAGE DETAIL VIEW: STOK KART EKLE / DÜZENLE */}
      {isModalOpen && (
        <DetailPageLayout
          title={editingProduct ? `${editingProduct.name} - Stok Kartını Düzenle` : "Yeni Stok / Ürün Kartı Tanımla"}
          subtitle="Stok cinsi, depo seçimi, barkod ve fiyat bilgileri ile ürün tanımlayın"
          breadcrumbs={[
            { label: "Stoklar & Depolar", onClick: handleBackToList },
            { label: editingProduct ? editingProduct.name : "Yeni Stok Kartı", active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200">
              {editingProduct ? "Düzenleme Modu" : "Yeni Kart"}
            </span>
          }
          headerIcon={<Package className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="product-form"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{editingProduct ? "Güncelle" : "Stok Kartını Kaydet"}</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
            <form id="product-form" onSubmit={handleSave} className="space-y-4 text-xs">
              {/* 1. STOK CİNSİ & DEPO SEÇİMİ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Stok Cinsi *</label>
                  <select
                    value={stockType}
                    onChange={(e) => setStockType(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="İlk Madde Malzeme">İlk Madde Malzeme</option>
                    <option value="Yarı Mamul">Yarı Mamul</option>
                    <option value="Ticari Mal">Ticari Mal</option>
                    <option value="Ham Madde">Ham Madde</option>
                    <option value="Hizmet">Hizmet (Servis/Danışmanlık)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Giriş / Ana Depo *</label>
                  <select
                    value={primaryWarehouseId}
                    onChange={(e) => setPrimaryWarehouseId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    {activeWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BARKOD & STOK KODU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-800">Barkod Numarası</label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Otomatik Üret
                    </button>
                  </div>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ör: 8690000123456"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 font-mono placeholder-slate-400 rounded-xl pl-8 pr-2 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Kodu</label>
                  <input
                    type="text"
                    placeholder="ör: YAZ-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* ÜRÜN ADI & KATEGORİ */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Ürün / Hizmet Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="ör: iPhone 15 Pro 256GB veya Web Tasarım Hizmeti"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-extrabold text-xs placeholder-slate-400 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    placeholder="ör: Elektronik, Yazılım, Yedek Parça..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* IMEI / SERİ NO */}
              {(stockType === "Ticari Mal" || ((name || "").trim().length > 0) || enableImei) && (
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>IMEI / Seri Numarası</span>
                    </label>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {stockType === "Ticari Mal" ? "Ticari Mal IMEI Alanı" : "Özel Ürün Alanı"}
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="ör: 358921098471923 (15 haneli IMEI) veya SN-2026-X881 (Seri No)"
                    value={imeiOrSerialNo}
                    onChange={(e) => setImeiOrSerialNo(e.target.value)}
                    className="w-full bg-white border border-indigo-200 text-slate-900 font-mono text-xs placeholder-slate-400 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* BİRİM, KDV, FİYATLAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Birim</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl p-2 text-center focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Adet">Adet</option>
                    <option value="Kg">Kg</option>
                    <option value="Gram">Gram</option>
                    <option value="Metre">Metre</option>
                    <option value="Litre">Litre</option>
                    <option value="Paket">Paket</option>
                    <option value="Kutu">Kutu</option>
                    <option value="Saat">Saat</option>
                    <option value="Ay">Ay</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">KDV Oranı</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl p-2 text-center focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={20}>%20</option>
                    <option value={10}>%10</option>
                    <option value={1}>%1</option>
                    <option value={0}>%0</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alış Fiyatı (₺)</label>
                  <input
                    type="number"
                    step="any"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    step="any"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 text-indigo-600 rounded-xl p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Açılış / Mevcut Stok Miktarı</label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2 font-mono font-bold"
                />
              </div>

              {/* FOOTER */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? "Güncelle" : "Stok Kartını Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* CATALOG WHATSAPP MODAL */}
      {isCatalogWhatsAppOpen && (
        <UniversalWhatsAppModal
          isOpen={isCatalogWhatsAppOpen}
          onClose={() => setIsCatalogWhatsAppOpen(false)}
          title="WhatsApp ile Ürün & Fiyat Listesi Paylaş"
          documentTypeLabel="Fiyat Kataloğu"
          recipientName="Sayın Müşterimiz"
          recipientPhone=""
          defaultMessage={`Sayın Müşterimiz,\n\n*${companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz"}* güncel Ürün & Fiyat Listesi Kataloğumuz ekte bilgilerinize sunulmuştur.\n\n📦 *Toplam Ürün Sayısı:* ${filteredProducts.length} Kalem\n📅 *Tarih:* ${formatDate(new Date())}\n\nSipariş ve detaylı bilgi için lütfen bizimle iletişime geçiniz.`}
          documentFileName={`Fiyat_Listesi_${new Date().toISOString().split("T")[0]}.pdf`}
          companySettings={companySettings}
          onGeneratePdf={async () => {
            const { generateAutoTableFromExportData } = await import("../utils/pdfService");
            return generateAutoTableFromExportData(getProductsExportData());
          }}
        />
    );
  }

      {/* SINGLE PRODUCT / EKSTRE WHATSAPP MODAL */}
      {whatsAppProduct && (
        <UniversalWhatsAppModal
          isOpen={!!whatsAppProduct}
          onClose={() => setWhatsAppProduct(null)}
          title={`WhatsApp ile Stok Bilgisi Paylaş (${whatsAppProduct.name})`}
          documentTypeLabel="Ürün & Stok Bilgi Kartı"
          recipientName="Sayın İlgili"
          recipientPhone=""
          defaultMessage={formatProductWhatsAppMessage(whatsAppProduct, companySettings)}
          documentFileName={`Stok_Ekstresi_${(whatsAppProduct.code || "Stok").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`}
          companySettings={companySettings}
          onGeneratePdf={async () => {
            const el = document.getElementById("printable-stock-ekstre");
            if (el) {
              const { exportElementToPDFWithPrintStyling } = await import("../utils/pdfService");
              const safeCode = (whatsAppProduct.code || "Stok").replace(/[^a-zA-Z0-9_-]/g, "_");
              return exportElementToPDFWithPrintStyling(
                "printable-stock-ekstre",
                `Stok_Ekstresi_${safeCode}.pdf`,
                { orientation: "p", margin: 6, scale: 1.6 }
              );
            }
            const { generateAutoTableFromExportData } = await import("../utils/pdfService");
            const expData: ExportData = {
              filename: `Urun_${whatsAppProduct.code || "Bilgi"}`,
              title: `Ürün ve Fiyat Bilgi Kartı: ${whatsAppProduct.name}`,
              subtitle: `Stok Kodu: ${whatsAppProduct.code} | Barkod: ${whatsAppProduct.barcode || "-"} | Mevcut Stok: ${whatsAppProduct.stockQuantity} ${whatsAppProduct.unit}`,
              headers: ["Ürün Adı", "Stok Kodu", "KDV %", "Alış Fiyatı", "Satış Fiyatı", "Mevcut Stok"],
              rows: [
                [
                  whatsAppProduct.name,
                  whatsAppProduct.code || "-",
                  `%${whatsAppProduct.vatRate ?? 20}`,
                  formatCurrency(whatsAppProduct.buyPrice),
                  formatCurrency(whatsAppProduct.sellPrice),
                  `${whatsAppProduct.stockQuantity} ${whatsAppProduct.unit}`,
                ],
              ],
            };
            return generateAutoTableFromExportData(expData);
          }}
        />
    );
  }


  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP TITLE & ACTION HEADER WITH EDITORIAL BACKGROUND */}
      <ModuleEntranceHeader
        badge="Envanter & Lojistik"
        badgeIcon={<Package className="w-2.5 h-2.5 text-[#0f6bae]" />}
        title="Stok ve Depo Yönetimi"
        description="Depo bazlı stok takibi, depolar arası sevk transferi, kritik seviye takibi ve resmi envanter ekstresi."
        actions={
          <>
            <button
              type="button"
              onClick={() => handleOpenTransferModal()}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-50 shrink-0"
                  style={{ borderColor: theme.cardBorder, color: theme.pageText }}
                >
                  <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                  <span>Depo Transferi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-50 shrink-0 bg-white"
                  style={{ borderColor: theme.cardBorder, color: theme.pageText }}
                  title="Excel veya CSV dosyasından stok ve ürünleri toplu içe aktar"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>İçe Aktar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-2xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Yeni Stok Kartı</span>
                </button>
              </>
            }
          />

          {/* 2. TOP 4 KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Toplam Stok Kalemi */}
            <div
              className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400">Toplam Stok Kalemi</span>
                  <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: theme.pageText }}>
                    {products.length}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <img src={ASSET_ICONS.ciro} alt="" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {activeWarehouses.length} Depo Aktif
                </span>
                <span className="text-slate-400 text-[11px]">Kayıtlı SKU</span>
              </div>
            </div>

            {/* Card 2: Toplam Envanter Değeri */}
            <div
              className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400">Toplam Envanter Değeri</span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600">
                    ₺{totalConsolidatedValue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <img src={ASSET_ICONS.nakit} alt="" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-500">Maliyet Değerlemesi</span>
                <span className="text-slate-400 text-[11px]">• Alış bazlı</span>
              </div>
            </div>

            {/* Card 3: Kritik Seviyedeki Stoklar */}
            <div
              className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400">Kritik Stok Uyarısı</span>
                  <div className={`text-2xl font-bold font-mono tracking-tight ${criticalStockCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                    {criticalStockCount}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                  <img src={ASSET_ICONS.vadesiGecenAlacak} alt="" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${criticalStockCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {criticalStockCount > 0 ? "İkmal Gerekiyor" : "Stoklar Yeterli"}
                </span>
                <span className="text-slate-400 text-[11px]">Kritik limit altı</span>
              </div>
            </div>

            {/* Card 4: Toplam Fiili Stok Miktarı */}
            <div
              className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400">Toplam Fiili Miktar</span>
                  <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: theme.pageText }}>
                    {totalConsolidatedQty.toLocaleString("tr-TR")}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <img src={ASSET_ICONS.toplamBorc} alt="" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Konsolide
                </span>
                <span className="text-slate-400 text-[11px]">Tüm depolar toplamı</span>
              </div>
            </div>
          </div>

          {/* 3. DEPO BAZLI STOK SÜZGEÇİ */}
          <div
            className="rounded-2xl p-3 sm:p-4 border shadow-2xs"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Depo Bazlı Stok Görünümü
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {activeWarehouses.length} Depo Tanımlı
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card: Tüm Depolar */}
              <button
                type="button"
                onClick={() => setSelectedWarehouseId("all")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedWarehouseId === "all"
                    ? "border-purple-500 bg-purple-50/50 shadow-2xs ring-1 ring-purple-500/20"
                    : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Tüm Depolar (Konsolide)</span>
                  <Boxes className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  ₺{totalConsolidatedValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
                  <span>{products.length} Kalem Ürün</span>
                  <span>{totalConsolidatedQty} Miktar</span>
                </div>
              </button>

              {/* Individual Warehouses */}
              {activeWarehouses.map((wh) => {
                const isSelected = selectedWarehouseId === wh.id;
                const analytics = getWhAnalytics(wh.id);
                return (
                  <button
                    key={wh.id}
                    type="button"
                    onClick={() => setSelectedWarehouseId(wh.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-purple-500 bg-purple-50/50 shadow-2xs ring-1 ring-purple-500/20"
                        : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[170px]" title={wh.name}>
                        {wh.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {wh.code}
                      </span>
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                      ₺{analytics.totalValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
                      <span>{analytics.totalItems} Kalem</span>
                      <span>{analytics.totalQty} Miktar</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. FILTER & ACTION TOOLBAR */}
          <div
            className="rounded-2xl p-3 sm:p-4 border shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex flex-1 items-center gap-2">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ürün adı, barkod, seri no veya stok kodu ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Kritik Stoklar Toggle Filter Pill */}
              <button
                type="button"
                onClick={() => setShowOnlyCritical(!showOnlyCritical)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  showOnlyCritical
                    ? "bg-rose-50 border-rose-300 text-rose-700 shadow-2xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Kritik Stoklar ({criticalStockCount})</span>
              </button>
            </div>

            {/* Right tools */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hidden sm:inline-block">
                {selectedWarehouseId === "all" ? "Tüm Depolar" : selectedWhObj?.name}:{" "}
                <strong className="text-slate-800">{filteredProducts.length}</strong> ürün
              </span>
              <button
                type="button"
                onClick={() => setShowColFilters((prev) => !prev)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showColFilters
                    ? "bg-purple-50 border-purple-200 text-purple-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                }`}
                title="Sütun bazlı arama ve filtreleme alanlarını göster/gizle"
              >
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Sütun Filtreleri</span>
                {activeColFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeColFilterCount}
                  </span>
                )}
              </button>
              <ColumnManagementDropdown
                columns={productColumns}
                columnVisibility={productColVisibility}
                onToggleColumn={toggleProductCol}
                onSetAllColumns={setAllProductCols}
                onResetToDefaults={resetProductCols}
                hiddenCount={hiddenProductColCount}
              />
              <ExportButtons getExportData={getProductsExportData} size="sm" />
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Excel veya CSV dosyasından stok ve ürünleri toplu içe aktar"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>İçe Aktar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCatalogWhatsAppOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Fiyat Listesi ve Ürün Kataloğunu WhatsApp ile Paylaş"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Fiyat Kataloğu Paylaş</span>
              </button>
            </div>
          </div>

          <BulkActionBar
            selectedCount={selection.selectedCount}
            totalCount={filteredProducts.length}
            itemLabel="ürün"
            onClearSelection={selection.clearSelection}
            onSelectAll={() => selection.selectAll(filteredProducts.map((p) => p.id))}
            onDelete={handleBulkDelete}
            deleteLabel="Seçilen Ürünleri Sil"
            onExportExcel={handleBulkExportExcel}
            onExportPdf={handleBulkExportPdf}
          />

          {/* 5. DATA TABLE */}
          <div
            className="rounded-2xl border shadow-2xs overflow-hidden"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="w-10 py-3 px-3 text-center">
                      <TableCheckbox
                        checked={displayedProductIds.length > 0 && selection.isAllSelected(displayedProductIds)}
                        indeterminate={selection.isIndeterminate(displayedProductIds)}
                        onChange={() => selection.toggleSelectAll(displayedProductIds)}
                        title="Tümünü Seç / Seçimi Kaldır"
                      />
                    </th>
                    {isProductColVisible("code") && <th className="py-3 px-4">Stok Kodu & Barkod</th>}
                    {isProductColVisible("name") && <th className="py-3 px-4">Ürün / Hizmet Adı</th>}
                    {isProductColVisible("warehouse") && <th className="py-3 px-4">Bulunduğu Depo</th>}
                    {isProductColVisible("stockType") && <th className="py-3 px-4">Stok Cinsi</th>}
                    {isProductColVisible("price") && <th className="py-3 px-4 text-right">Alış / Satış Fiyatı</th>}
                    {isProductColVisible("profitMargin") && <th className="py-3 px-4 text-right">Ort. Kar & Marj</th>}
                    {isProductColVisible("stock") && (
                      <th className="py-3 px-4 text-center">
                        {selectedWarehouseId === "all" ? "Toplam Stok" : "Depo Stoğu"}
                      </th>
                    )}
                    {isProductColVisible("actions") && <th className="py-3 px-4 text-right">İşlemler</th>}
                  </tr>
                  {/* Sütun Bazlı Filtreleme Satırı */}
                  {showColFilters && (
                    <tr
                      className="border-b bg-slate-50/40 dark:bg-slate-800/40 transition-colors"
                      style={{ borderColor: theme.cardBorder }}
                    >
                      <th className="w-10 py-2 px-3 text-center"></th>
                      {isProductColVisible("code") && (
                        <th className="py-2 px-3 font-normal">
                          <TableColumnFilterInput
                            value={colFilters.code}
                            onChange={(val) => setColFilters((prev) => ({ ...prev, code: val }))}
                            placeholder="Kod / Barkod / Seri..."
                          />
                        </th>
                      )}
                      {isProductColVisible("name") && (
                        <th className="py-2 px-3 font-normal">
                          <TableColumnFilterInput
                            value={colFilters.name}
                            onChange={(val) => setColFilters((prev) => ({ ...prev, name: val }))}
                            placeholder="Ürün adı ara..."
                          />
                        </th>
                      )}
                      {isProductColVisible("warehouse") && (
                        <th className="py-2 px-3 font-normal">
                          <TableColumnFilterInput
                            value={colFilters.warehouse}
                            onChange={(val) => setColFilters((prev) => ({ ...prev, warehouse: val }))}
                            placeholder="Depo / Kategori..."
                          />
                        </th>
                      )}
                      {isProductColVisible("stockType") && (
                        <th className="py-2 px-3 font-normal w-28">
                          <TableColumnFilterInput
                            value={colFilters.stockType}
                            onChange={(val) => setColFilters((prev) => ({ ...prev, stockType: val }))}
                            placeholder="Cins / Birim..."
                          />
                        </th>
                      )}
                      {isProductColVisible("price") && (
                        <th className="py-2 px-3 font-normal w-28">
                          <TableColumnFilterInput
                            value={colFilters.price}
                            onChange={(val) => setColFilters((prev) => ({ ...prev, price: val }))}
                            placeholder="Fiyat..."
                          />
                        </th>
                      )}
                      {isProductColVisible("profitMargin") && (
                        <th className="py-2 px-3 font-normal w-24">
                          {/* Kar & Marj spacer */}
                        </th>
                      )}
                      {isProductColVisible("stock") && (
                        <th className="py-2 px-3 font-normal w-24">
                          <TableColumnFilterInput
                            value={colFilters.stock}
                            onChange={(val) => setColFilters((prev) => ({ ...prev, stock: val }))}
                            placeholder="Miktar..."
                          />
                        </th>
                      )}
                      {isProductColVisible("actions") && (
                        <th className="py-2 px-2 font-normal text-right">
                          {activeColFilterCount > 0 ? (
                            <button
                              type="button"
                              onClick={clearAllColFilters}
                              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Tüm sütun filtrelerini temizle"
                            >
                              <X className="w-3 h-3" />
                              <span>Temizle</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Filtrele</span>
                          )}
                        </th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedProducts.map((p) => {
                    const stockInWh = getProductStockInWarehouse(p, selectedWarehouseId, activeWarehouses);
                    const isCritical = p.minStockAlert !== undefined ? stockInWh <= p.minStockAlert : stockInWh <= 5;
                    const analytics = analyticsMap.get(p.id) || getProductAnalytics(p, invoices);
                    const isExpanded = expandedProductIds.has(p.id);
                    const isRowSelected = selection.isSelected(p.id);

                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          className={`transition-colors group cursor-pointer ${
                            isRowSelected
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40"
                              : isExpanded
                              ? "bg-[var(--color-periwinkle-wash)] shadow-2xs row-clicked-highlight"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="w-10 py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <TableCheckbox
                              checked={isRowSelected}
                              onChange={() => selection.toggleSelect(p.id)}
                              title="Ürünü Seç"
                            />
                          </td>
                          {/* Code & Barcode with Clickable Chevron */}
                          {isProductColVisible("code") && (
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleProductExpand(p.id);
                                  }}
                                  aria-expanded={isExpanded}
                                  className={`p-1.5 -ml-1 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                    isExpanded
                                      ? "bg-purple-100 text-purple-700 shadow-2xs ring-1 ring-purple-300"
                                      : "text-slate-400 hover:text-purple-600 hover:bg-slate-100"
                                  }`}
                                  title={isExpanded ? "Detayları gizle" : "Detayları aç (Sayfadan ayrılmadan incele)"}
                                >
                                  <ChevronRight
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                      isExpanded ? "rotate-90 text-purple-700" : "text-slate-400"
                                    }`}
                                  />
                                </button>
                                <div>
                                  <div className="font-mono font-bold text-slate-900">{p.code}</div>
                                  {p.barcode ? (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                      <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{p.barcode}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Barkodsuz</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Name & IMEI / Serial No */}
                          {isProductColVisible("name") && (
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEkstreProduct(p);
                                  setEkstreTab("all");
                                  setEkstreSearch("");
                                  setEkstreWarehouseId(selectedWarehouseId || "all");
                                }}
                                className="font-bold text-slate-900 hover:text-purple-600 hover:underline text-left cursor-pointer transition-colors block"
                                title="Stok Ekstresi ve Hareket Detay Sayfasını Aç"
                              >
                                {p.name}
                              </button>
                              {p.imeiOrSerialNo ? (
                                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono font-semibold">
                                  <Cpu className="w-3 h-3 text-indigo-500" />
                                  <span>Seri/IMEI: {p.imeiOrSerialNo}</span>
                                </div>
                              ) : null}
                            </td>
                          )}

                          {/* Warehouse Breakdown / Badge */}
                          {isProductColVisible("warehouse") && (
                            <td className="py-3.5 px-4">
                              {selectedWarehouseId !== "all" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <WarehouseIcon className="w-3 h-3 text-amber-600" />
                                  {selectedWhObj?.name}
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                    <WarehouseIcon className="w-3 h-3 text-purple-600" />
                                    {p.warehouseName || activeWarehouses[0]?.name}
                                  </span>
                                  <div className="flex flex-wrap gap-1 text-[9px] font-mono text-slate-500">
                                    {activeWarehouses.map((w) => {
                                      const q = getProductStockInWarehouse(p, w.id, activeWarehouses);
                                      return (
                                        <span key={w.id} className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                          {w.code.replace("DEP-", "D")}: <strong className="text-slate-800">{q}</strong>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                          )}

                          {/* Stock Type */}
                          {isProductColVisible("stockType") && (
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${getStockTypeBadgeClass(
                                  p.stockType
                                )}`}
                              >
                                {p.stockType || "Ticari Mal"}
                              </span>
                            </td>
                          )}

                          {/* Prices */}
                          {isProductColVisible("price") && (
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums font-tabular-num-md">
                              <div className="text-slate-400 text-[11px] font-mono tabular-nums font-tabular-num-md">
                                Alış: <span className="font-semibold text-slate-600 font-mono tabular-nums font-tabular-num-md">₺{p.buyPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="text-slate-900 font-bold text-xs mt-0.5 font-mono tabular-nums font-tabular-num-md">
                                Satış: ₺{p.sellPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </div>
                            </td>
                          )}

                          {/* Profit & Margin */}
                          {isProductColVisible("profitMargin") && (
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums font-tabular-num-md">
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1 font-mono tabular-nums font-tabular-num-md font-bold text-emerald-600 text-xs">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  <span>+₺{analytics.unitProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold font-mono tabular-nums font-tabular-num-md text-[10px]">
                                  %{analytics.marginPercent.toFixed(1)} Marj
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Quantity */}
                          {isProductColVisible("stock") && (
                            <td className="py-3.5 px-4 text-center font-mono tabular-nums font-tabular-num-md">
                              <span
                                className={`inline-block font-mono tabular-nums font-tabular-num-md font-bold px-2.5 py-1 rounded-lg text-xs border ${
                                  isCritical
                                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                                    : "bg-slate-50 border-slate-200 text-slate-800"
                                }`}
                              >
                                {stockInWh} {p.unit}
                              </span>
                            </td>
                          )}

                          {/* Actions Column */}
                          {isProductColVisible("actions") && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Master-Detail Toggle Button */}
                                <button
                                  onClick={() => toggleProductExpand(p.id)}
                                  title={isExpanded ? "Detayları Gizle" : "Hızlı İncele (Master-Detail)"}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isExpanded
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180 text-purple-600" : "text-slate-600"
                                    }`}
                                  />
                                </button>

                                {/* Ekstre Button */}
                                <button
                                  onClick={() => {
                                    setSelectedEkstreProduct(p);
                                    setEkstreTab("all");
                                    setEkstreSearch("");
                                    setEkstreWarehouseId(selectedWarehouseId || "all");
                                  }}
                                  title="Ürün Ekstresi & Depo Detayı"
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>Ekstre</span>
                                </button>

                                {/* WhatsApp Share Button */}
                                <button
                                  onClick={() => setWhatsAppProduct(p)}
                                  title="Ürün Bilgisini WhatsApp ile Paylaş"
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>

                                {/* Transfer Button */}
                                <button
                                  onClick={() => handleOpenTransferModal(p.id)}
                                  title="Depolar Arası Transfer Et"
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => handleOpenAddModal(p)}
                                  title="Stok Kartını Düzenle"
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => {
                                    if (confirm(`'${p.name}' stok kartını silmek istediğinize emin misiniz?`)) {
                                      onDeleteProduct(p.id);
                                    }
                                  }}
                                  title="Stok Kartını Sil"
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Hidden Master-Detail View Section for Product */}
                        {isExpanded && (
                          <tr className="expanded-detail-row bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                            <td colSpan={visibleProductColCount} className="p-0">
                              <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-[#eaedff]/40 to-white border-l-4 border-l-[#005289] space-y-4">
                                {/* Header strip */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                                      STOK KARTI DETAYI
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      Stok Kodu:{" "}
                                      <span className="font-mono font-bold text-slate-900">
                                        {p.code}
                                      </span>
                                    </span>
                                    {p.category && (
                                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                        Kategori: {p.category}
                                      </span>
                                    )}
                                    {p.vatRate !== undefined && (
                                      <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full font-mono tabular-nums">
                                        KDV: %{p.vatRate}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedEkstreProduct(p);
                                        setEkstreTab("all");
                                        setEkstreSearch("");
                                        setEkstreWarehouseId(selectedWarehouseId || "all");
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Detaylı Ekstre Sayfası</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenTransferModal(p.id)}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                      <span>Depo Transferi</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddModal(p)}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Düzenle</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Warehouse Stock Distribution Cards */}
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <WarehouseIcon className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Depo Dağılımı ve Stok Seviyeleri</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {activeWarehouses.map((wh) => {
                                      const whStock = getProductStockInWarehouse(p, wh.id, activeWarehouses);
                                      const whValue = whStock * p.buyPrice;
                                      return (
                                        <div key={wh.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <span className="font-bold text-slate-900 text-xs">{wh.name}</span>
                                              <span className="block text-[10px] text-slate-400 font-mono">{wh.code}</span>
                                            </div>
                                            <span className="font-mono tabular-nums font-bold text-sm text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
                                              {whStock} {p.unit}
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between font-mono tabular-nums">
                                            <span>Maliyet Değeri:</span>
                                            <span className="font-semibold text-slate-700">₺{whValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Financial & Cost Summary */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                                  <div>
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                      Birim Alış Maliyeti
                                    </span>
                                    <span className="font-mono tabular-nums font-bold text-slate-800 text-sm mt-0.5 block">
                                      ₺{p.buyPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                      Birim Satış Fiyatı
                                    </span>
                                    <span className="font-mono tabular-nums font-bold text-slate-900 text-sm mt-0.5 block">
                                      ₺{p.sellPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                      Birim Kar & Marj
                                    </span>
                                    <span className="font-mono tabular-nums font-bold text-emerald-600 text-sm mt-0.5 block">
                                      +₺{analytics.unitProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (%{analytics.marginPercent.toFixed(1)})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                      Toplam Stok Envanter Değeri
                                    </span>
                                    <span className="font-mono tabular-nums font-bold text-purple-700 text-sm mt-0.5 block">
                                      ₺{(p.stock * p.buyPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>

                                {p.description && (
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                      Ürün Açıklaması & Notlar
                                    </span>
                                    <p className="text-slate-700 font-medium mt-1 leading-relaxed">{p.description}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={visibleProductColCount} className="text-center py-12 text-slate-500">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-extrabold text-slate-700 text-sm">Aramanıza veya Filtreye Uygun Ürün Bulunamadı</p>
                        <p className="text-xs text-slate-400 mt-1">Farklı bir depo seçebilir veya arama kelimesini değiştirebilirsiniz.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredProducts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 15, 25, 50, 100]}
              itemLabel="ürün / stok"
              className="border-t border-slate-100"
            />
          </div>

      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        mode="products"
        existingProducts={products}
        onImportProducts={handleImportProducts}
      />
    </div>
  );
};

export default Products;
