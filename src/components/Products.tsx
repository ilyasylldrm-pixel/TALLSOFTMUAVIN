import React, { useState, useMemo, useDeferredValue } from "react";
import { Product, Invoice, Contact, Warehouse, CostProject, Employee, Transaction, CompanySettings } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency, formatDate, exportElementToPDF } from "../utils/exportUtils";
import { formatProductWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import { ProductCostsView } from "./ProductCostsView";
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
} from "lucide-react";

interface ProductsProps {
  products: Product[];
  invoices?: Invoice[];
  contacts?: Contact[];
  warehouses?: Warehouse[];
  costProjects?: CostProject[];
  employees?: Employee[];
  transactions?: Transaction[];
  companySettings?: CompanySettings;
  globalSearchTerm?: string;
  activeSubTab?: "list" | "costs";
  onSelectSubTab?: (subTab: "list" | "costs") => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCostProject?: (project: CostProject) => void;
  onUpdateCostProject?: (project: CostProject) => void;
  onDeleteCostProject?: (id: string) => void;
}

export interface ProductMovement {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  type: "purchase" | "sales";
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
  costProjects = [],
  employees = [],
  transactions = [],
  companySettings,
  globalSearchTerm = "",
  activeSubTab,
  onSelectSubTab,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCostProject,
  onUpdateCostProject,
  onDeleteCostProject,
}) => {
  const activeWarehouses = warehouses && warehouses.length > 0 ? warehouses : defaultWarehouses;

  const [internalTab, setInternalTab] = useState<"list" | "costs">("list");
  const activeTab = activeSubTab || internalTab;

  const handleTabChange = (tab: "list" | "costs") => {
    setInternalTab(tab);
    if (onSelectSubTab) {
      onSelectSubTab(tab);
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

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Selected product for Ekstre Modal
  const [selectedEkstreProduct, setSelectedEkstreProduct] = useState<Product | null>(null);
  const [whatsAppProduct, setWhatsAppProduct] = useState<Product | null>(null);
  const [isCatalogWhatsAppOpen, setIsCatalogWhatsAppOpen] = useState<boolean>(false);
  const [ekstreTab, setEkstreTab] = useState<"all" | "purchase" | "sales">("all");
  const [ekstreSearch, setEkstreSearch] = useState("");
  const [ekstreWarehouseId, setEkstreWarehouseId] = useState<string>("all");

  // PDF Export Handler for Ekstre
  const handleExportEkstrePDF = async () => {
    if (!selectedEkstreProduct) return;
    const element = document.getElementById("printable-stock-ekstre");
    if (!element) {
      alert("Yazdırılacak stok ekstre belgesi bulunamadı.");
      return;
    }
    try {
      setIsPdfGenerating(true);
      const safeCode = (selectedEkstreProduct.code || "Stok").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `Stok_Ekstresi_${safeCode}_${new Date().toISOString().split("T")[0]}.pdf`;
      await exportElementToPDF("printable-stock-ekstre", fileName, { orientation: "p", margin: 8, scale: 2 });
    } catch (err) {
      console.error("Stok Ekstresi PDF oluşturulurken hata:", err);
      alert("PDF belgesi oluşturulurken bir hata oluştu.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Precompute analytics map for all products once
  const analyticsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getProductAnalytics>>();
    products.forEach((p) => {
      map.set(p.id, getProductAnalytics(p, invoices));
    });
    return map;
  }, [products, invoices]);

  // Calculations for Maliyetler module
  const costProductsData = useMemo(() => {
    return products.map((p) => {
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
      const q = (globalSearchTerm || costSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

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
      alert("Çıkış deposu ile hedef depo aynı olamaz.");
      return;
    }

    const targetProd = products.find((p) => p.id === transferProductId);
    if (!targetProd) return;

    const sourceQty = getProductStockInWarehouse(targetProd, transferFromWhId, activeWarehouses);
    if (transferQuantity <= 0) {
      alert("Lütfen geçerli bir transfer miktarı girin.");
      return;
    }
    if (transferQuantity > sourceQty) {
      alert(`Transfer miktarı çıkış deposundaki stoktan (${sourceQty} ${targetProd.unit}) fazla olamaz.`);
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
    if (!name.trim()) return;

    const selectedWh = activeWarehouses.find((w) => w.id === primaryWarehouseId);
    const isImeiApplicable = stockType === "Ticari Mal" || enableImei || name.trim().length > 0;

    if (editingProduct) {
      const updatedProd: Product = {
        ...editingProduct,
        code: code || editingProduct.code,
        name: name.trim(),
        unit,
        buyPrice,
        sellPrice,
        vatRate,
        stockQuantity,
        category,
        stockType,
        barcode: barcode.trim() || undefined,
        imeiOrSerialNo: isImeiApplicable && imeiOrSerialNo.trim() ? imeiOrSerialNo.trim() : undefined,
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
        name: name.trim(),
        unit,
        buyPrice,
        sellPrice,
        vatRate,
        stockQuantity,
        category,
        stockType,
        barcode: barcode.trim() || undefined,
        imeiOrSerialNo: isImeiApplicable && imeiOrSerialNo.trim() ? imeiOrSerialNo.trim() : undefined,
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

  // Filter products by search and selected warehouse
  const deferredSearch = useDeferredValue(search);
  const deferredGlobalSearch = useDeferredValue(globalSearchTerm);
  const activeSearchQuery = (deferredGlobalSearch || deferredSearch).toLowerCase().trim();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !activeSearchQuery ||
        p.name.toLowerCase().includes(activeSearchQuery) ||
        p.code.toLowerCase().includes(activeSearchQuery) ||
        (p.barcode && p.barcode.toLowerCase().includes(activeSearchQuery)) ||
        (p.imeiOrSerialNo && p.imeiOrSerialNo.toLowerCase().includes(activeSearchQuery)) ||
        (p.stockType && p.stockType.toLowerCase().includes(activeSearchQuery));

      if (!matchesSearch) return false;

      if (selectedWarehouseId === "all") return true;

      const stockInWh = getProductStockInWarehouse(p, selectedWarehouseId, activeWarehouses);
      return stockInWh >= 0;
    });
  }, [products, activeSearchQuery, selectedWarehouseId, activeWarehouses]);

  const displayedProducts = filteredProducts.slice(0, displayLimit);

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
  const getProductsExportData = (): ExportData => {
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
    const rows = filteredProducts.map((p) => [
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
      subtitle: selectedWarehouseId === "all" ? "Tüm Depolar Genel Toplamı" : `${selectedWhObj?.name || "Seçili Depo"} Stok Durumu`,
      headers,
      rows,
    };
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

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {activeTab === "costs" ? (
        <ProductCostsView
          products={products}
          invoices={invoices}
          contacts={contacts}
          costProjects={costProjects}
          employees={employees}
          transactions={transactions}
          globalSearchTerm={globalSearchTerm}
          analyticsMap={analyticsMap}
          onAddCostProject={onAddCostProject}
          onUpdateCostProject={onUpdateCostProject}
          onDeleteCostProject={onDeleteCostProject}
        />
      ) : (
        <>
          {/* Header (Lila Bal Peteği & Geometrik Desen) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        <div className="relative z-10">
          <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-800" />
            <span>Stok ve Depo Yönetimi</span>
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            Depo bazlı stok takibi, depolar arası stok transferi, ürün hareket ekstresi ve alış/satış analizi.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenTransferModal()}
            className="bg-purple-900/10 hover:bg-purple-900/20 text-purple-950 border border-purple-300/60 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <ArrowRightLeft className="w-4 h-4 text-purple-700" />
            <span>Depo Transferi</span>
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-purple-800 font-bold" />
            <span>Yeni Ürün / Stok Kartı</span>
          </button>
        </div>
      </div>

      {/* WAREHOUSE FILTER WIDGET GRID (Matching Reference Design) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50/60 via-fuchsia-50/30 to-slate-50/80 rounded-3xl border border-purple-200/60 p-4 sm:p-5 space-y-4 shadow-2xs">
        {/* Honeycomb grid overlay pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Top Header Label */}
        <div className="relative z-10 flex items-center justify-between border-b border-purple-200/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <WarehouseIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-purple-950">
              DEPO BAZLI STOK SÜZGEÇİ & YÖNETİMİ
            </span>
          </div>
          <span className="text-[11px] font-extrabold text-purple-900 bg-purple-100/80 border border-purple-200 px-2.5 py-0.5 rounded-full">
            {activeWarehouses.length} Depo Aktif
          </span>
        </div>

        {/* Grid of Cards styled exactly like the photo */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* CARD 1: TÜM DEPOLAR (KONSOLİDE) - Amber/Orange Theme */}
          {(() => {
            const isSelected = selectedWarehouseId === "all";
            return (
              <div
                onClick={() => setSelectedWarehouseId("all")}
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "bg-gradient-to-br from-amber-50 via-amber-50/95 to-orange-50/90 border-2 border-amber-400 ring-2 ring-amber-400/30 shadow-md shadow-amber-500/10 -translate-y-0.5"
                    : "bg-gradient-to-br from-amber-50/50 via-white/80 to-amber-50/30 border border-amber-200/80 hover:border-amber-300 hover:shadow-xs"
                }`}
              >
                {/* Top Row: Title & Icon Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-black tracking-wide uppercase text-amber-950 leading-tight">
                    TÜM DEPOLAR<br />
                    <span className="text-[10px] text-amber-800/80 font-bold">(KONSOLİDE)</span>
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>

                {/* Middle Row: Main Metric Value */}
                <div className="my-2.5">
                  <div className="text-xl font-black font-mono tracking-tight text-slate-900 group-hover:text-amber-950">
                    ₺{totalConsolidatedValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Bottom Row: Pill badge + info text */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="bg-amber-200/90 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-extrabold text-[11px] font-mono">
                    {products.length} Kalem
                  </span>
                  <span className="text-amber-900/80 font-semibold text-[11px]">
                    {totalConsolidatedQty} miktar
                  </span>
                </div>
              </div>
            );
          })()}

          {/* CARDS FOR EACH WAREHOUSE */}
          {activeWarehouses.map((wh, idx) => {
            const isSelected = selectedWarehouseId === wh.id;
            const analytics = getWhAnalytics(wh.id);

            // Color Themes Array matching photo (Blue, Purple, Pink/Fuchsia, Emerald)
            const themes = [
              {
                selected: "bg-gradient-to-br from-blue-50 via-blue-50/95 to-sky-50/90 border-2 border-blue-400 ring-2 ring-blue-400/30 shadow-md shadow-blue-500/10 -translate-y-0.5",
                unselected: "bg-gradient-to-br from-blue-50/40 via-white/80 to-sky-50/30 border border-blue-200/80 hover:border-blue-300 hover:shadow-xs",
                iconBg: "bg-blue-100/90 border border-blue-200 text-blue-700",
                titleColor: "text-blue-950",
                badgeBg: "bg-blue-200/90 text-blue-900 border border-blue-300",
                subText: "text-blue-900/80",
                icon: Building2,
              },
              {
                selected: "bg-gradient-to-br from-indigo-50 via-indigo-50/95 to-purple-50/90 border-2 border-indigo-400 ring-2 ring-indigo-400/30 shadow-md shadow-indigo-500/10 -translate-y-0.5",
                unselected: "bg-gradient-to-br from-indigo-50/40 via-white/80 to-purple-50/30 border border-indigo-200/80 hover:border-indigo-300 hover:shadow-xs",
                iconBg: "bg-indigo-100/90 border border-indigo-200 text-indigo-700",
                titleColor: "text-indigo-950",
                badgeBg: "bg-indigo-200/90 text-indigo-900 border border-indigo-300",
                subText: "text-indigo-900/80",
                icon: WarehouseIcon,
              },
              {
                selected: "bg-gradient-to-br from-fuchsia-50 via-fuchsia-50/95 to-pink-50/90 border-2 border-fuchsia-400 ring-2 ring-fuchsia-400/30 shadow-md shadow-fuchsia-500/10 -translate-y-0.5",
                unselected: "bg-gradient-to-br from-fuchsia-50/40 via-white/80 to-pink-50/30 border border-fuchsia-200/80 hover:border-fuchsia-300 hover:shadow-xs",
                iconBg: "bg-fuchsia-100/90 border border-fuchsia-200 text-fuchsia-700",
                titleColor: "text-fuchsia-950",
                badgeBg: "bg-fuchsia-200/90 text-fuchsia-900 border border-fuchsia-300",
                subText: "text-fuchsia-900/80",
                icon: Boxes,
              },
              {
                selected: "bg-gradient-to-br from-emerald-50 via-emerald-50/95 to-teal-50/90 border-2 border-emerald-400 ring-2 ring-emerald-400/30 shadow-md shadow-emerald-500/10 -translate-y-0.5",
                unselected: "bg-gradient-to-br from-emerald-50/40 via-white/80 to-teal-50/30 border border-emerald-200/80 hover:border-emerald-300 hover:shadow-xs",
                iconBg: "bg-emerald-100/90 border border-emerald-200 text-emerald-700",
                titleColor: "text-emerald-950",
                badgeBg: "bg-emerald-200/90 text-emerald-900 border border-emerald-300",
                subText: "text-emerald-900/80",
                icon: MapPin,
              },
            ];

            const theme = themes[idx % themes.length];
            const IconComponent = theme.icon;

            return (
              <div
                key={wh.id}
                onClick={() => setSelectedWarehouseId(wh.id)}
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected ? theme.selected : theme.unselected
                }`}
              >
                {/* Top Row: Warehouse Name & Icon Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[11px] font-black tracking-wide uppercase leading-tight ${theme.titleColor}`}>
                    {wh.name}
                  </span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${theme.iconBg}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                {/* Middle Row: Valuation / Quantity */}
                <div className="my-2.5">
                  <div className="text-xl font-black font-mono tracking-tight text-slate-900">
                    ₺{analytics.totalValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Bottom Row: Pill badge + status */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] font-mono ${theme.badgeBg}`}>
                    {analytics.totalItems} Kalem
                  </span>
                  <span className={`font-semibold text-[11px] ${theme.subText}`}>
                    {analytics.totalQty} {wh.code}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED WAREHOUSE SUMMARY CARD (IF SPECIFIC WAREHOUSE SELECTED) */}
      {selectedWarehouseId !== "all" && selectedWhObj && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50/60 rounded-2xl border border-amber-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-amber-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-amber-950">{selectedWhObj.name}</h3>
                  <span className="bg-amber-200/80 text-amber-900 border border-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                    {selectedWhObj.code}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                    Aktif Depo
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-amber-900/80 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    {selectedWhObj.address.fullAddress || `${selectedWhObj.address.district} / ${selectedWhObj.address.city}`}
                  </span>
                  {selectedWhObj.managerName && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5 text-amber-700" />
                      Sorumlu: {selectedWhObj.managerName} ({selectedWhObj.phone})
                    </span>
                  )}
                  {selectedWhObj.capacityM2 && (
                    <span className="font-mono text-[11px] bg-amber-100/80 px-2 py-0.5 rounded">
                      Kapasite: {selectedWhObj.capacityM2} m²
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenTransferModal(undefined, selectedWhObj.id)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bu Depodan Stok Çıkışı / Transfer</span>
            </button>
          </div>

          {/* Metrics for selected warehouse */}
          {(() => {
            const stats = getWhAnalytics(selectedWhObj.id);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70">
                  <div className="text-[11px] text-amber-900 font-semibold">Kayıtlı Çeşit (SKU Sayısı)</div>
                  <div className="text-base font-black text-amber-950 font-mono mt-0.5">{stats.totalItems} Kalem Ürün</div>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70">
                  <div className="text-[11px] text-amber-900 font-semibold">Depodaki Toplam Stok Adedi</div>
                  <div className="text-base font-black text-amber-950 font-mono mt-0.5">{stats.totalQty.toLocaleString("tr-TR")} Miktar</div>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70">
                  <div className="text-[11px] text-amber-900 font-semibold">Depo Stok Parasal Değeri (Maliyet)</div>
                  <div className="text-base font-black text-emerald-700 font-mono mt-0.5">₺{stats.totalValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ürün adı, barkod, IMEI veya stok koda göre ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-purple-900/80 font-semibold bg-purple-50/60 px-3 py-1.5 rounded-xl border border-purple-200/50">
              {selectedWarehouseId === "all" ? "Tüm Depolar" : selectedWhObj?.name}:{" "}
              <span className="font-bold text-purple-950">{filteredProducts.length}</span> ürün listeleniyor
            </span>
            <ExportButtons getExportData={getProductsExportData} size="sm" />
            <button
              type="button"
              onClick={() => setIsCatalogWhatsAppOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Fiyat Listesi ve Ürün Kataloğunu WhatsApp ile Paylaş"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200" />
              <span>Fiyat Listesini Paylaş</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[800px]">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-3">Stok Kodu & Barkod</th>
                <th className="pb-2 px-3">Ürün / Hizmet Adı & Seri No</th>
                <th className="pb-2 px-3">Bulunduğu Depo</th>
                <th className="pb-2 px-3">Stok Cinsi</th>
                <th className="pb-2 px-3 text-right">Alış / Satış Fiyatı</th>
                <th className="pb-2 px-3 text-right">Ort. Kar & Marj (%)</th>
                <th className="pb-2 px-3 text-center">
                  {selectedWarehouseId === "all" ? "Toplam Stok" : "Depo Stoğu"}
                </th>
                <th className="pb-2 px-3 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((p) => {
                const stockInWh = getProductStockInWarehouse(p, selectedWarehouseId, activeWarehouses);
                const isCritical = p.minStockAlert && stockInWh <= p.minStockAlert;
                const analytics = analyticsMap.get(p.id) || getProductAnalytics(p, invoices);

                return (
                  <tr
                    key={p.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    {/* Code & Barcode */}
                    <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-purple-950">{p.code}</div>
                      {p.barcode ? (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-purple-700/70 font-mono mt-0.5">
                          <Barcode className="w-3 h-3 text-slate-400 group-hover:text-purple-500 shrink-0" />
                          <span>{p.barcode}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Barkodsuz</span>
                      )}
                    </td>

                    {/* Name & IMEI / Serial No */}
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-950">{p.name}</div>
                      {p.imeiOrSerialNo ? (
                        <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono font-semibold">
                          <Cpu className="w-3 h-3 text-indigo-500" />
                          <span>Seri/IMEI: {p.imeiOrSerialNo}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Warehouse Breakdown / Badge */}
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
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

                    {/* Stock Type */}
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${getStockTypeBadgeClass(
                          p.stockType
                        )}`}
                      >
                        {p.stockType || "Ticari Mal"}
                      </span>
                    </td>

                    {/* Prices */}
                    <td className="py-3 px-3 text-right font-mono border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="text-slate-500 text-[11px] group-hover:text-purple-800/80">
                        Alış: <span className="font-semibold text-slate-700 group-hover:text-slate-900">₺{p.buyPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-indigo-600 font-bold text-xs">
                        Satış: ₺{p.sellPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Profit & Margin */}
                    <td className="py-3 px-3 text-right border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 font-mono font-bold text-emerald-600 text-xs">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+₺{analytics.unitProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold font-mono">
                            %{analytics.marginPercent.toFixed(1)} Marj
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span
                        className={`font-black font-mono px-2.5 py-1 rounded-lg text-xs border ${
                          isCritical
                            ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                            : "bg-slate-100 border-slate-200 text-slate-800"
                        }`}
                      >
                        {stockInWh} {p.unit}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                        {/* Ekstre Button */}
                        <button
                          onClick={() => {
                            setSelectedEkstreProduct(p);
                            setEkstreTab("all");
                            setEkstreSearch("");
                            setEkstreWarehouseId(selectedWarehouseId || "all");
                          }}
                          title="Ürün Ekstresi & Depo Detayı"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Ekstre</span>
                        </button>

                        {/* WhatsApp Share Button */}
                        <button
                          onClick={() => setWhatsAppProduct(p)}
                          title="Ürün Bilgisini WhatsApp ile Paylaş"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Transfer Button */}
                        <button
                          onClick={() => handleOpenTransferModal(p.id)}
                          title="Depolar Arası Transfer Et"
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Transfer</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenAddModal(p)}
                          title="Stok Kartını Düzenle"
                          className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span>Düzenle</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm(`'${p.name}' stok kartını silmek istediğinize emin misiniz?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          title="Stok Kartını Sil"
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 bg-white rounded-xl">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-extrabold text-slate-700 text-sm">Aramanıza veya Seçili Depoya Uygun Ürün Bulunamadı</p>
                    <p className="text-xs text-slate-400 mt-1">Farklı bir depo seçebilir veya arama kelimesini değiştirebilirsiniz.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredProducts.length > displayLimit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              Daha Fazla Göster ({displayLimit} / {filteredProducts.length})
            </button>
          </div>
        )}
      </div>
        </>
      )}

      {/* WAREHOUSE STOCK TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-purple-200 max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Depolar Arası Stok Transferi</h3>
                  <p className="text-[11px] text-slate-500">
                    Seçili stoğu depolar arasında sevk edin ve depo bakiyelerini güncelleyin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
        </div>
      )}

      {/* PRODUCT EKSTRE & DEPO DAĞILIM MODAL */}
      {selectedEkstreProduct && ekstreAnalytics && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-300/80 max-w-5xl w-full max-h-[95vh] flex flex-col my-auto overflow-hidden animate-scaleUp">
            {/* 1. Modal Top Bar - Dark Corporate & Actions (no-print) */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 no-print">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-extrabold shrink-0 shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                      Resmi Stok Hareket Ekstresi & Depo Raporu
                    </h3>
                    <span className="bg-purple-800/90 text-purple-200 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-purple-600/60">
                      {selectedEkstreProduct.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    {selectedEkstreProduct.name} • Toplam Stok: {selectedEkstreProduct.stockQuantity} {selectedEkstreProduct.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setWhatsAppProduct(selectedEkstreProduct)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Stok Ekstresini WhatsApp ile Paylaş"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200" />
                  <span>WhatsApp ile Paylaş</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Yazdır"
                >
                  <Printer className="w-4 h-4 text-slate-200" />
                  <span className="hidden sm:inline">Yazdır</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEkstreProduct(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">
                                {isPurchase ? "+" : "-"}{m.quantity} {m.unit}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-700">
                                ₺{m.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                ₺{m.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black text-purple-950 bg-purple-100/50">
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
                  onClick={() => setSelectedEkstreProduct(null)}
                  className="px-5 py-2 font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STOK KART EKLE / DÜZENLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-purple-200 max-w-xl w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingProduct ? "Stok Kartını Düzenle" : "Yeni Stok / Hizmet Kartı"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Stok cinsi, depo seçimi, barkod ve IMEI/Seri No bilgileri ile ürün tanımlayın.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
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
              {(stockType === "Ticari Mal" || name.trim().length > 0 || enableImei) && (
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
                  onClick={() => setIsModalOpen(false)}
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
        </div>
      )}

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
      )}

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
      )}
    </div>
  );
};
