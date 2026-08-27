import React, { useState, useEffect, lazy, Suspense } from "react";
import { Sidebar, NavItem } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { AuthModal, UserProfile, BRAND_LOGOS } from "./components/AuthModal";

// Lazy-loaded heavy tab modules for fast initial page load and automatic code splitting
const Contacts = lazy(() => import("./components/Contacts").then((m) => ({ default: m.Contacts })));
const Invoices = lazy(() => import("./components/Invoices").then((m) => ({ default: m.Invoices })));
const Quotes = lazy(() => import("./components/Quotes").then((m) => ({ default: m.Quotes })));
const Orders = lazy(() => import("./components/Orders").then((m) => ({ default: m.Orders })));
const Waybills = lazy(() => import("./components/Waybills").then((m) => ({ default: m.Waybills })));
const Accounts = lazy(() => import("./components/Accounts").then((m) => ({ default: m.Accounts })));
const Transactions = lazy(() => import("./components/Transactions").then((m) => ({ default: m.Transactions })));
const Products = lazy(() => import("./components/Products").then((m) => ({ default: m.Products })));
const Reports = lazy(() => import("./components/Reports").then((m) => ({ default: m.Reports })));
const AiAssistant = lazy(() => import("./components/AiAssistant").then((m) => ({ default: m.AiAssistant })));
const Settings = lazy(() => import("./components/Settings").then((m) => ({ default: m.Settings })));
const CompanyManagement = lazy(() => import("./components/CompanyManagement").then((m) => ({ default: m.CompanyManagement })));
const EServices = lazy(() => import("./components/EServices").then((m) => ({ default: m.EServices })));
const EDocuments = lazy(() => import("./components/EDocuments"));
const HRManagement = lazy(() => import("./components/HRManagement").then((m) => ({ default: m.HRManagement })));
const FileManager = lazy(() => import("./components/FileManager").then((m) => ({ default: m.FileManager })));
const AdminDashboard = lazy(() => import("./components/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const ProductionModule = lazy(() => import("./components/Production/ProductionModule").then((m) => ({ default: m.ProductionModule })));
const AutoServiceModule = lazy(() => import("./components/AutoService/AutoServiceModule").then((m) => ({ default: m.AutoServiceModule })));
const ITServiceModule = lazy(() => import("./components/ITService/ITServiceModule").then((m) => ({ default: m.ITServiceModule })));
const ApplianceServiceModule = lazy(() => import("./components/ApplianceService/ApplianceServiceModule").then((m) => ({ default: m.ApplianceServiceModule })));

import {
  getStoredData,
  saveStoredData,
  resetToDemoData,
  exportBackupJSON,
  importBackupJSON,
} from "./utils/storage";
import { readStoredMysoftTenantVkn } from "./utils/mysoftTenantStorage";

import {
  Contact,
  Invoice,
  Account,
  Transaction,
  Product,
  Quote,
  Order,
  Waybill,
  CompanySettings,
  Cheque,
  ChequeStatus,
  PromissoryNote,
  PromissoryNoteStatus,
  Branch,
  Warehouse,
  Employee,
  LeaveRequest,
  AdvanceRequest,
  LegalDeduction,
  CostProject,
  AssetCustody,
  MysoftEDocument,
  getContactAccountCode,
  BillOfMaterials,
  Routing,
  Workstation,
  WorkOrder,
  SubcontractOrder,
  MrpRecommendation,
  AutoServiceRecord,
  ItServiceRecord,
  ApplianceServiceRecord,
} from "./types";

import { Plus, FileText, Users, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";

import { FinanceSubModule } from "./components/Accounts";

const TabLoadingSkeleton = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-7 bg-slate-200 rounded-lg w-48"></div>
      <div className="h-9 bg-slate-200 rounded-xl w-32"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
    </div>
    <div className="h-80 bg-slate-200 rounded-2xl border border-slate-200"></div>
  </div>
);

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>("dashboard");
  const [financeSubTab, setFinanceSubTab] = useState<FinanceSubModule>("kasa");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Storage State
  const [data, setData] = useState(() => getStoredData());

  // Quick Action Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [initialContactIdForInvoice, setInitialContactIdForInvoice] = useState<string | null>(null);

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem("muavin_active_user") || sessionStorage.getItem("muavin_active_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(() => currentUser === null);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Auto switch admin to admin tab on login
  useEffect(() => {
    const userEmail = currentUser?.email?.toLowerCase().trim() || "";
    const isSysAdmin =
      currentUser?.id === "nuT309AyQxQKddnAp1ZJjlSgBXt2" ||
      currentUser?.id === "usr_admin_001" ||
      currentUser?.role?.includes("Admin") ||
      userEmail === "ilyasyildirim@outlook.com.tr" ||
      userEmail === "ilyasylldrm@gmail.com" ||
      userEmail.includes("admin");

    if (currentUser && isSysAdmin) {
      setCurrentTab("admin");
    }
  }, [currentUser]);

  const handleOpenAuthModal = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("muavin_active_user");
    sessionStorage.removeItem("muavin_active_user");
    setCurrentUser(null);
    setAuthModalMode("login");
    setAuthModalOpen(true);
  };

  // Sync state changes with localStorage per slice
  useEffect(() => { saveStoredData("SETTINGS", data.settings); }, [data.settings]);
  useEffect(() => { saveStoredData("CONTACTS", data.contacts); }, [data.contacts]);
  useEffect(() => { saveStoredData("ACCOUNTS", data.accounts); }, [data.accounts]);
  useEffect(() => { saveStoredData("INVOICES", data.invoices); }, [data.invoices]);
  useEffect(() => { saveStoredData("TRANSACTIONS", data.transactions); }, [data.transactions]);
  useEffect(() => { saveStoredData("PRODUCTS", data.products); }, [data.products]);
  useEffect(() => { saveStoredData("QUOTES", data.quotes); }, [data.quotes]);
  useEffect(() => { if (data.orders) saveStoredData("ORDERS", data.orders); }, [data.orders]);
  useEffect(() => { if (data.waybills) saveStoredData("WAYBILLS", data.waybills); }, [data.waybills]);
  useEffect(() => { if (data.cheques) saveStoredData("CHEQUES", data.cheques); }, [data.cheques]);
  useEffect(() => { if (data.promissoryNotes) saveStoredData("PROMISSORY_NOTES", data.promissoryNotes); }, [data.promissoryNotes]);
  useEffect(() => { if (data.branches) saveStoredData("BRANCHES", data.branches); }, [data.branches]);
  useEffect(() => { if (data.warehouses) saveStoredData("WAREHOUSES", data.warehouses); }, [data.warehouses]);
  useEffect(() => { if (data.employees) saveStoredData("EMPLOYEES", data.employees); }, [data.employees]);
  useEffect(() => { if (data.leaveRequests) saveStoredData("LEAVE_REQUESTS", data.leaveRequests); }, [data.leaveRequests]);
  useEffect(() => { if (data.advanceRequests) saveStoredData("ADVANCE_REQUESTS", data.advanceRequests); }, [data.advanceRequests]);
  useEffect(() => { if (data.legalDeductions) saveStoredData("LEGAL_DEDUCTIONS", data.legalDeductions); }, [data.legalDeductions]);
  useEffect(() => { if (data.costProjects) saveStoredData("COST_PROJECTS", data.costProjects); }, [data.costProjects]);
  useEffect(() => { if (data.assetCustodies) saveStoredData("ASSET_CUSTODIES", data.assetCustodies); }, [data.assetCustodies]);
  useEffect(() => { if (data.boms) saveStoredData("BOMS", data.boms); }, [data.boms]);
  useEffect(() => { if (data.routings) saveStoredData("ROUTINGS", data.routings); }, [data.routings]);
  useEffect(() => { if (data.workstations) saveStoredData("WORKSTATIONS", data.workstations); }, [data.workstations]);
  useEffect(() => { if (data.workOrders) saveStoredData("WORK_ORDERS", data.workOrders); }, [data.workOrders]);
  useEffect(() => { if (data.subcontractOrders) saveStoredData("SUBCONTRACT_ORDERS", data.subcontractOrders); }, [data.subcontractOrders]);
  useEffect(() => { if (data.autoServices) saveStoredData("AUTO_SERVICES", data.autoServices); }, [data.autoServices]);
  useEffect(() => { if (data.itServices) saveStoredData("IT_SERVICES", data.itServices); }, [data.itServices]);
  useEffect(() => { if (data.applianceServices) saveStoredData("APPLIANCE_SERVICES", data.applianceServices); }, [data.applianceServices]);

  // Auto & IT & Appliance Service Handlers
  const handleUpdateAutoServices = (services: AutoServiceRecord[]) => {
    setData((prev) => ({ ...prev, autoServices: services }));
  };

  const handleUpdateItServices = (services: ItServiceRecord[]) => {
    setData((prev) => ({ ...prev, itServices: services }));
  };

  const handleUpdateApplianceServices = (services: ApplianceServiceRecord[]) => {
    setData((prev) => ({ ...prev, applianceServices: services }));
  };

  // Production Module Handlers
  const handleSaveBom = (bom: BillOfMaterials) => {
    setData((prev) => {
      const exists = (prev.boms || []).some((b) => b.id === bom.id);
      const updatedBoms = exists
        ? (prev.boms || []).map((b) => (b.id === bom.id ? bom : b))
        : [bom, ...(prev.boms || [])];
      return { ...prev, boms: updatedBoms };
    });
  };

  const handleDeleteBom = (bomId: string) => {
    setData((prev) => ({
      ...prev,
      boms: (prev.boms || []).filter((b) => b.id !== bomId),
    }));
  };

  const handleSaveRouting = (routing: Routing) => {
    setData((prev) => {
      const exists = (prev.routings || []).some((r) => r.id === routing.id);
      const updated = exists
        ? (prev.routings || []).map((r) => (r.id === routing.id ? routing : r))
        : [routing, ...(prev.routings || [])];
      return { ...prev, routings: updated };
    });
  };

  const handleDeleteRouting = (routingId: string) => {
    setData((prev) => ({
      ...prev,
      routings: (prev.routings || []).filter((r) => r.id !== routingId),
    }));
  };

  const handleSaveWorkstation = (ws: Workstation) => {
    setData((prev) => {
      const exists = (prev.workstations || []).some((w) => w.id === ws.id);
      const updated = exists
        ? (prev.workstations || []).map((w) => (w.id === ws.id ? ws : w))
        : [ws, ...(prev.workstations || [])];
      return { ...prev, workstations: updated };
    });
  };

  const handleDeleteWorkstation = (wsId: string) => {
    setData((prev) => ({
      ...prev,
      workstations: (prev.workstations || []).filter((w) => w.id !== wsId),
    }));
  };

  const handleSaveWorkOrder = (wo: WorkOrder) => {
    setData((prev) => {
      const exists = (prev.workOrders || []).some((w) => w.id === wo.id);
      const updated = exists
        ? (prev.workOrders || []).map((w) => (w.id === wo.id ? wo : w))
        : [wo, ...(prev.workOrders || [])];
      return { ...prev, workOrders: updated };
    });
  };

  const handleDeleteWorkOrder = (woId: string) => {
    setData((prev) => ({
      ...prev,
      workOrders: (prev.workOrders || []).filter((w) => w.id !== woId),
    }));
  };

  const handleSaveSubcontractOrder = (sub: SubcontractOrder) => {
    setData((prev) => {
      const exists = (prev.subcontractOrders || []).some((s) => s.id === sub.id);
      const updated = exists
        ? (prev.subcontractOrders || []).map((s) => (s.id === sub.id ? sub : s))
        : [sub, ...(prev.subcontractOrders || [])];
      return { ...prev, subcontractOrders: updated };
    });
  };

  const handleReceiveSubcontract = (orderId: string, receivedQty: number, scrapQty: number) => {
    setData((prev) => {
      const updatedSubs = (prev.subcontractOrders || []).map((s) => {
        if (s.id === orderId) {
          const totalRec = (s.receivedQuantity || 0) + receivedQty;
          const totalScrap = (s.scrapQuantity || 0) + scrapQty;
          const isDone = totalRec + totalScrap >= s.quantity;
          return {
            ...s,
            receivedQuantity: totalRec,
            scrapQuantity: totalScrap,
            status: isDone ? ("completed" as const) : ("partially_received" as const),
            actualReturnDate: new Date().toISOString().split("T")[0],
          };
        }
        return s;
      });
      return { ...prev, subcontractOrders: updatedSubs };
    });
  };

  const handleIssueMaterials = (woId: string) => {
    setData((prev) => {
      const targetWo = (prev.workOrders || []).find((w) => w.id === woId);
      if (!targetWo || targetWo.isMaterialIssued) return prev;

      // Deduct materials from inventory products
      const updatedProducts = prev.products.map((p) => {
        const mat = targetWo.allocatedMaterials?.find((m) => m.productId === p.id);
        if (mat) {
          const newStock = Math.max(0, (p.stock || 0) - mat.plannedQuantity);
          return { ...p, stock: newStock };
        }
        return p;
      });

      const updatedWo: WorkOrder = {
        ...targetWo,
        isMaterialIssued: true,
        status: targetWo.status === "planned" ? "in_progress" : targetWo.status,
        allocatedMaterials: targetWo.allocatedMaterials?.map((m) => ({
          ...m,
          consumedQuantity: m.plannedQuantity,
        })),
      };

      return {
        ...prev,
        products: updatedProducts,
        workOrders: (prev.workOrders || []).map((w) => (w.id === woId ? updatedWo : w)),
      };
    });
  };

  const handleReceiveFinishedGoods = (woId: string) => {
    setData((prev) => {
      const targetWo = (prev.workOrders || []).find((w) => w.id === woId);
      if (!targetWo || targetWo.isFinishedGoodReceived) return prev;

      const qtyToAdd = targetWo.producedQuantity > 0 ? targetWo.producedQuantity : targetWo.plannedQuantity;

      // Add finished good to inventory products
      const updatedProducts = prev.products.map((p) => {
        if (p.id === targetWo.productId) {
          return { ...p, stock: (p.stock || 0) + qtyToAdd };
        }
        return p;
      });

      const updatedWo: WorkOrder = {
        ...targetWo,
        isFinishedGoodReceived: true,
        status: "completed",
        producedQuantity: qtyToAdd,
      };

      return {
        ...prev,
        products: updatedProducts,
        workOrders: (prev.workOrders || []).map((w) => (w.id === woId ? updatedWo : w)),
      };
    });
  };

  const handleCreateWorkOrderFromMrp = (rec: MrpRecommendation) => {
    const year = new Date().getFullYear();
    const orderNumber = `WO-${year}-${String((data.workOrders || []).length + 101).padStart(5, "0")}`;
    const matchingBom = data.boms?.find((b) => b.id === rec.bomId || b.productId === rec.productId);

    const newWo: WorkOrder = {
      id: "wo_" + Date.now(),
      orderNumber,
      originType: "sales_order",
      productId: rec.productId,
      productCode: rec.productCode,
      productName: rec.productName,
      bomId: matchingBom?.id || "",
      bomCode: matchingBom?.bomCode || "",
      routingId: matchingBom?.routingId || data.routings?.[0]?.id || "",
      lotNumber: `LOT${year % 100}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
        (data.workOrders || []).length + 1
      ).padStart(3, "0")}`,
      plannedQuantity: rec.suggestedQuantity,
      producedQuantity: 0,
      scrappedQuantity: 0,
      unit: rec.unit,
      sourceWarehouseId: data.warehouses?.[0]?.id || "wh_1",
      sourceWarehouseName: data.warehouses?.[0]?.name || "Ana Depo",
      targetWarehouseId: data.warehouses?.[0]?.id || "wh_1",
      targetWarehouseName: data.warehouses?.[0]?.name || "Ana Depo",
      status: "planned",
      priority: "high",
      plannedStartDate: new Date().toISOString().split("T")[0],
      plannedDueDate: rec.suggestedDate,
      isMaterialIssued: false,
      isFinishedGoodReceived: false,
      createdAt: new Date().toISOString().split("T")[0],
      notes: `MRP II Motoru tarafından otomatik önerildi: ${rec.reason}`,
      operations: [],
      allocatedMaterials: matchingBom
        ? matchingBom.items.map((item, idx) => {
            const qty = item.quantityPerUnit * (1 + (item.wasteRate || 0)) * rec.suggestedQuantity;
            return {
              id: `wom_${Date.now()}_${idx}`,
              productId: item.productId,
              productCode: item.productCode,
              productName: item.productName,
              type: item.type,
              plannedQuantity: qty,
              allocatedQuantity: qty,
              consumedQuantity: 0,
              unit: item.unit,
              unitCost: item.unitCost,
              totalCost: qty * item.unitCost,
            };
          })
        : [],
    };

    handleSaveWorkOrder(newWo);
  };

  const handleCreatePurchaseOrderFromMrp = (rec: MrpRecommendation) => {
    const rawProd = data.products.find((p) => p.id === rec.productId);
    const unitPrice = rawProd?.purchasePrice || 100;
    const totalWithoutVat = rec.suggestedQuantity * unitPrice;
    const vatRate = 20;
    const vatAmount = (totalWithoutVat * vatRate) / 100;
    const grandTotal = totalWithoutVat + vatAmount;

    const newOrder: Order = {
      id: "ord_mrp_" + Date.now(),
      orderNumber: `SIP-AL-${new Date().getFullYear()}-${String((data.orders || []).length + 1).padStart(5, "0")}`,
      type: "purchase",
      contactId: data.contacts.find((c) => c.type === "supplier")?.id || data.contacts[0]?.id || "cont_1",
      contactName: data.contacts.find((c) => c.type === "supplier")?.name || "Hammadde Tedarikçisi",
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: rec.suggestedDate,
      items: [
        {
          id: "item_mrp_1",
          productId: rec.productId,
          productCode: rec.productCode,
          description: `${rec.productName} (MRP II Otomatik Tedarik)`,
          quantity: rec.suggestedQuantity,
          unit: rec.unit,
          unitPrice,
          vatRate,
          discountRate: 0,
          totalWithoutVat,
          vatAmount,
          totalWithVat: grandTotal,
        },
      ],
      subtotal: totalWithoutVat,
      totalVat: vatAmount,
      grandTotal,
      currency: "₺",
      status: "pending",
      notes: `MRP II Planlama Motoru Önerisi: ${rec.reason}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setData((prev) => ({
      ...prev,
      orders: [newOrder, ...(prev.orders || [])],
    }));
  };

  // Handlers for Cost Projects
  const handleAddCostProject = (newProject: CostProject) => {
    setData((prev) => ({
      ...prev,
      costProjects: [newProject, ...(prev.costProjects || [])],
    }));
  };

  const handleUpdateCostProject = (updatedProject: CostProject) => {
    setData((prev) => ({
      ...prev,
      costProjects: (prev.costProjects || []).map((p) => (p.id === updatedProject.id ? updatedProject : p)),
    }));
  };

  const handleDeleteCostProject = (projectId: string) => {
    setData((prev) => ({
      ...prev,
      costProjects: (prev.costProjects || []).filter((p) => p.id !== projectId),
    }));
  };

  // Handlers for Waybills (İrsaliyeler)
  const handleAddWaybill = (newWaybill: Waybill) => {
    setData((prev) => ({
      ...prev,
      waybills: [newWaybill, ...(prev.waybills || [])],
    }));
  };

  const handleUpdateWaybill = (updatedWaybill: Waybill) => {
    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).map((w) => (w.id === updatedWaybill.id ? updatedWaybill : w)),
    }));
  };

  const handleDeleteWaybill = (waybillId: string) => {
    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).filter((w) => w.id !== waybillId),
    }));
  };

  const handleConvertWaybillToInvoice = (waybill: Waybill) => {
    const prefix = waybill.type === "dispatch" ? "FAT-SEVK-" : "FAT-AL-";
    const nextSeq = String((data.invoices || []).length + 1).padStart(6, "0");

    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: `${prefix}${nextSeq}`,
      type: waybill.type === "dispatch" ? "sales" : "purchase",
      contactId: waybill.contactId,
      contactName: waybill.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: waybill.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate || 0,
        totalWithoutVat: item.totalWithoutVat,
        vatAmount: item.vatAmount,
        totalWithVat: item.totalWithVat,
      })),
      subtotal: waybill.subtotal,
      totalVat: waybill.totalVat,
      grandTotal: waybill.grandTotal,
      currency: waybill.currency || "₺",
      paidAmount: 0,
      remainingAmount: waybill.grandTotal,
      status: "sent",
      notes: `İrsaliye No: ${waybill.waybillNumber} faturalandırıldı. (Plaka: ${waybill.vehiclePlate || "-"}, Sürücü: ${waybill.driverName || "-"})`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedWaybill: Waybill = {
      ...waybill,
      status: "invoiced",
      invoicedInvoiceId: newInvoice.id,
      invoicedInvoiceNumber: newInvoice.invoiceNumber,
    };

    setData((prev) => {
      const updatedWaybills = (prev.waybills || []).map((w) => (w.id === waybill.id ? updatedWaybill : w));
      const updatedInvoices = [newInvoice, ...prev.invoices];

      const updatedProducts = prev.products.map((p) => {
        const item = waybill.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const qty = item.quantity;
        const newStock = waybill.type === "dispatch" ? p.stockQuantity - qty : p.stockQuantity + qty;
        return { ...p, stockQuantity: newStock < 0 ? 0 : newStock };
      });

      const updatedContacts = prev.contacts.map((c) => {
        if (c.id !== waybill.contactId) return c;
        const currentBal = c.balance || 0;
        const change = waybill.type === "dispatch" ? waybill.grandTotal : -waybill.grandTotal;
        const newBal = currentBal + change;
        return {
          ...c,
          balance: newBal,
          balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        waybills: updatedWaybills,
        products: updatedProducts,
        contacts: updatedContacts,
      };
    });
  };

  // Handlers for Orders
  const handleAddOrder = (newOrder: Order) => {
    setData((prev) => ({
      ...prev,
      orders: [newOrder, ...(prev.orders || [])],
    }));
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    }));
  };

  const handleDeleteOrder = (orderId: string) => {
    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).filter((o) => o.id !== orderId),
    }));
  };

  const handleConvertOrderToInvoice = (order: Order) => {
    // 1. Create a new Invoice from Order
    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber:
        order.type === "sales"
          ? "FAT-SAT-" + Date.now().toString().slice(-6)
          : "FAT-AL-" + Date.now().toString().slice(-6),
      type: order.type === "sales" ? "sales" : "purchase",
      contactId: order.contactId,
      contactName: order.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: order.deliveryDate || new Date().toISOString().split("T")[0],
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate || 0,
        totalWithoutVat: item.totalWithoutVat,
        vatAmount: item.vatAmount,
        totalWithVat: item.totalWithVat,
      })),
      subtotal: order.subtotal,
      totalVat: order.totalVat,
      grandTotal: order.grandTotal,
      currency: order.currency || "₺",
      paidAmount: 0,
      remainingAmount: order.grandTotal,
      status: "sent",
      notes: `Sipariş No: ${order.orderNumber} faturaya dönüştürüldü. ${order.notes || ""}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // 2. Update Order status to 'converted'
    const updatedOrder: Order = {
      ...order,
      status: "converted",
    };

    // 3. Update products stock and contacts balance
    setData((prev) => {
      const updatedInvoices = [newInvoice, ...prev.invoices];
      const updatedOrders = (prev.orders || []).map((o) => (o.id === order.id ? updatedOrder : o));

      const updatedProducts = prev.products.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const qty = item.quantity;
        const newStock = order.type === "sales" ? p.stockQuantity - qty : p.stockQuantity + qty;
        return { ...p, stockQuantity: newStock < 0 ? 0 : newStock };
      });

      const updatedContacts = prev.contacts.map((c) => {
        if (c.id !== order.contactId) return c;
        const currentBal = c.balance || 0;
        const change = order.type === "sales" ? order.grandTotal : -order.grandTotal;
        return { ...c, balance: currentBal + change };
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        orders: updatedOrders,
        products: updatedProducts,
        contacts: updatedContacts,
      };
    });
  };

  // Handlers for Branches
  const handleAddBranch = (branch: Branch) => {
    setData((prev) => ({
      ...prev,
      branches: [branch, ...(prev.branches || [])],
    }));
  };

  const handleUpdateBranch = (branch: Branch) => {
    setData((prev) => ({
      ...prev,
      branches: (prev.branches || []).map((b) => (b.id === branch.id ? branch : b)),
    }));
  };

  const handleDeleteBranch = (id: string) => {
    setData((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((b) => b.id !== id),
    }));
  };

  // Handlers for Warehouses
  const handleAddWarehouse = (wh: Warehouse) => {
    setData((prev) => ({
      ...prev,
      warehouses: [wh, ...(prev.warehouses || [])],
    }));
  };

  const handleUpdateWarehouse = (wh: Warehouse) => {
    setData((prev) => ({
      ...prev,
      warehouses: (prev.warehouses || []).map((w) => (w.id === wh.id ? wh : w)),
    }));
  };

  const handleDeleteWarehouse = (id: string) => {
    setData((prev) => ({
      ...prev,
      warehouses: (prev.warehouses || []).filter((w) => w.id !== id),
    }));
  };

  // Handlers for Accounts & Finance Entities
  const handleUpdateAccount = (account: Account) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === account.id ? account : a)),
    }));
  };

  const handleDeleteAccount = (id: string) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  };

  const handleUpdateTransaction = (tx: Transaction) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === tx.id ? tx : t)),
    }));
  };

  const handleUpdateCheque = (cheque: Cheque) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).map((c) => (c.id === cheque.id ? cheque : c)),
    }));
  };

  const handleUpdatePromissoryNote = (note: PromissoryNote) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).map((n) => (n.id === note.id ? note : n)),
    }));
  };

  // Handlers
  const handleAddContact = (contact: Contact) => {
    setData((prev) => ({
      ...prev,
      contacts: [contact, ...prev.contacts],
    }));
  };

  const handleUpdateContact = (contact: Contact) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === contact.id ? contact : c)),
    }));
  };

  const handleDeleteContact = (id: string) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  };

  const handleAddInvoice = (invoice: Invoice) => {
    setData((prev) => {
      // Update contact balance
      const updatedContacts = prev.contacts.map((c) => {
        if (c.id === invoice.contactId) {
          const delta = invoice.type === "sales" ? invoice.grandTotal : -invoice.grandTotal;
          const newBal = c.balance + delta;
          return {
            ...c,
            balance: newBal,
            balanceType: newBal > 0 ? "receivable" : newBal < 0 ? "payable" : "balanced",
          };
        }
        return c;
      });

      return {
        ...prev,
        invoices: [invoice, ...prev.invoices],
        contacts: updatedContacts as Contact[],
      };
    });
  };

  const handleImportMysoftInvoice = (document: MysoftEDocument) => {
    const isIncoming =
      document.canonicalDirection === "incoming" ||
      document.direction === "inbox" ||
      document.direction === "incoming";
    const taxNumber =
      document.taxNumber ||
      (isIncoming ? document.senderTaxNumber : document.receiverTaxNumber) ||
      "";
    const contactName =
      document.accountName ||
      (isIncoming ? document.senderName : document.receiverName) ||
      "Mysoft e-Belge";
    const invoiceNumber =
      document.documentNo ||
      document.number ||
      document.documentNumber ||
      document.ettn ||
      `MS-${Date.now()}`;
    const issueDate = (document.issueDate || document.date || new Date().toISOString()).slice(0, 10);
    const dueDate = (document.dueDate || issueDate).slice(0, 10);
    const grandTotal = Number(document.grandTotal ?? document.amount) || 0;
    const subtotal = Number(document.subtotal) || grandTotal;
    const vatTotal = Number(document.vatTotal) || 0;
    const eDocumentType =
      document.documentType === "e_arsiv" ||
      document.documentType === "e_fatura" ||
      document.documentType === "paper"
        ? document.documentType
        : "e_fatura";

    setData((prev) => {
      if (document.ettn && prev.invoices.some((invoice) => invoice.eDocumentEttn === document.ettn)) {
        return prev;
      }

      let contacts = prev.contacts;
      let contact =
        (taxNumber ? contacts.find((item) => item.taxNumber === taxNumber) : undefined) ||
        contacts.find((item) => item.name === contactName);

      if (!contact) {
        const contactType = isIncoming ? "vendor" : "customer";
        contact = {
          id: "ct_mysoft_" + Date.now(),
          name: contactName,
          contactType,
          taxNumber: taxNumber || undefined,
          balance: 0,
          balanceType: "balanced",
          createdAt: new Date().toISOString(),
          accountCode: getContactAccountCode({ contactType, taxNumber }),
        };
        contacts = [contact, ...contacts];
      }

      const invoice: Invoice = {
        id: "inv_mysoft_" + Date.now(),
        invoiceNumber,
        type: isIncoming ? "purchase" : "sales",
        contactId: contact.id,
        contactName: contact.name,
        taxNumber: contact.taxNumber,
        issueDate,
        dueDate,
        items: [
          {
            id: "it_mysoft_" + Date.now(),
            description: `${String(document.documentType || "e-Belge")} ${invoiceNumber}`,
            quantity: 1,
            unit: "Adet",
            unitPrice: subtotal,
            vatRate: subtotal > 0 ? Math.round((vatTotal / subtotal) * 100) : 0,
            totalWithoutVat: subtotal,
            vatAmount: vatTotal,
            totalWithVat: grandTotal,
          },
        ],
        subtotal,
        totalVat: vatTotal,
        grandTotal,
        paidAmount: 0,
        remainingAmount: grandTotal,
        status: "sent",
        currency: document.currency === "₺" ? "TRY" : document.currency || "TRY",
        notes: document.ettn ? `Mysoft ETTN: ${document.ettn}` : undefined,
        createdAt: new Date().toISOString(),
        eDocumentType,
        eDocumentEttn: document.ettn,
      };

      const delta = invoice.type === "sales" ? invoice.grandTotal : -invoice.grandTotal;
      const updatedContacts = contacts.map((item) => {
        if (item.id !== contact.id) return item;
        const newBal = item.balance + delta;
        return {
          ...item,
          balance: newBal,
          balanceType: newBal > 0 ? "receivable" : newBal < 0 ? "payable" : "balanced",
        } as Contact;
      });

      return {
        ...prev,
        contacts: updatedContacts,
        invoices: [invoice, ...prev.invoices],
      };
    });
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setData((prev) => {
      const oldInvoice = prev.invoices.find((i) => i.id === updatedInvoice.id);
      let updatedContacts = prev.contacts;

      if (oldInvoice) {
        const oldDelta = oldInvoice.type === "sales" ? oldInvoice.grandTotal : -oldInvoice.grandTotal;
        const newDelta = updatedInvoice.type === "sales" ? updatedInvoice.grandTotal : -updatedInvoice.grandTotal;

        if (oldInvoice.contactId === updatedInvoice.contactId) {
          const diff = newDelta - oldDelta;
          if (diff !== 0) {
            updatedContacts = prev.contacts.map((c) => {
              if (c.id === updatedInvoice.contactId) {
                const newBal = c.balance + diff;
                return {
                  ...c,
                  balance: newBal,
                  balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
                };
              }
              return c;
            });
          }
        } else {
          updatedContacts = prev.contacts.map((c) => {
            if (c.id === oldInvoice.contactId) {
              const newBal = c.balance - oldDelta;
              return {
                ...c,
                balance: newBal,
                balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
              };
            }
            if (c.id === updatedInvoice.contactId) {
              const newBal = c.balance + newDelta;
              return {
                ...c,
                balance: newBal,
                balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
              };
            }
            return c;
          });
        }
      }

      return {
        ...prev,
        invoices: prev.invoices.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)),
        contacts: updatedContacts as Contact[],
      };
    });
  };

  const handleDeleteInvoice = (id: string) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
    }));
  };

  const handleAddTransaction = (tx: Transaction) => {
    setData((prev) => {
      // Update account balance
      const updatedAccounts = prev.accounts.map((a) => {
        if (a.id === tx.accountId) {
          const isInc = tx.type === "income" || tx.type === "collection";
          return {
            ...a,
            balance: isInc ? a.balance + tx.amount : a.balance - tx.amount,
          };
        }
        return a;
      });

      // If contact linked, update contact balance
      let updatedContacts = prev.contacts;
      if (tx.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === tx.contactId) {
            const isInc = tx.type === "income" || tx.type === "collection";
            // Collection reduces receivable balance
            const delta = isInc ? -tx.amount : tx.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }

      return {
        ...prev,
        transactions: [tx, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleAddTransactionFromInvoice = (
    invoice: Invoice,
    accountId: string,
    paidAmount: number
  ) => {
    const isSales = invoice.type === "sales";
    const acc = data.accounts.find((a) => a.id === accountId);

    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      type: isSales ? "collection" : "payment",
      amount: paidAmount,
      currency: "TRY",
      accountId,
      accountName: acc?.name || "Kasa/Banka",
      contactId: invoice.contactId,
      contactName: invoice.contactName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      category: isSales ? "Fatura Tahsilatı" : "Fatura Ödemesi",
      description: `${invoice.invoiceNumber} nolu fatura ${isSales ? "tahsilatı" : "ödemesi"}`,
    };

    // Update invoice status & remaining
    const newPaid = invoice.paidAmount + paidAmount;
    const newRemaining = invoice.grandTotal - newPaid;
    const newStatus = newRemaining <= 0 ? "paid" : "partial";

    const updatedInvoice: Invoice = {
      ...invoice,
      paidAmount: newPaid,
      remainingAmount: Math.max(0, newRemaining),
      status: newStatus as any,
    };

    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i)),
    }));

    handleAddTransaction(newTx);
  };

  const handleCollectAllInvoices = (targetAccountId?: string) => {
    setData((prev) => {
      const defaultAcc = prev.accounts.find((a) => a.id === targetAccountId) || prev.accounts[0];
      const accountId = defaultAcc?.id || "acc_1";
      const accountName = defaultAcc?.name || "Merkez TL Kasası";

      const newTransactions: Transaction[] = [];
      let updatedAccounts = [...prev.accounts];
      let updatedContacts = [...prev.contacts];

      const nowStr = new Date().toISOString().split("T")[0];
      let collectCount = 0;

      const updatedInvoices = prev.invoices.map((inv) => {
        if (inv.status !== "cancelled" && inv.remainingAmount > 0) {
          collectCount++;
          const remainingToPay = inv.remainingAmount;
          const isSales = inv.type === "sales";

          const tx: Transaction = {
            id: `tx_all_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            date: nowStr,
            type: isSales ? "collection" : "payment",
            amount: remainingToPay,
            currency: inv.currency || "TRY",
            accountId,
            accountName,
            contactId: inv.contactId,
            contactName: inv.contactName,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            category: isSales ? "Fatura Tahsilatı" : "Fatura Ödemesi",
            description: `${inv.invoiceNumber} nolu fatura ${isSales ? "toplu tahsilatı" : "toplu ödemesi"}`,
          };
          newTransactions.push(tx);

          // Update Account Balance
          updatedAccounts = updatedAccounts.map((a) => {
            if (a.id === accountId) {
              const delta = isSales ? remainingToPay : -remainingToPay;
              return { ...a, balance: a.balance + delta };
            }
            return a;
          });

          // Update Contact Balance
          if (inv.contactId) {
            updatedContacts = updatedContacts.map((c) => {
              if (c.id === inv.contactId) {
                const delta = isSales ? -remainingToPay : remainingToPay;
                const newBal = c.balance + delta;
                return {
                  ...c,
                  balance: newBal,
                  balanceType:
                    newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
                };
              }
              return c;
            });
          }

          return {
            ...inv,
            paidAmount: inv.grandTotal,
            remainingAmount: 0,
            status: "paid" as const,
          };
        }
        return inv;
      });

      if (collectCount === 0) return prev;

      return {
        ...prev,
        invoices: updatedInvoices,
        transactions: [...newTransactions, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  // Auto collect all invoices on mount if any are uncollected
  useEffect(() => {
    const uncollectedCount = data.invoices.filter((i) => i.status !== "cancelled" && i.remainingAmount > 0).length;
    if (uncollectedCount > 0) {
      handleCollectAllInvoices();
    }
  }, []);

  const handleTransferBetweenAccounts = (
    fromId: string,
    toId: string,
    amount: number,
    desc: string
  ) => {
    const fromAcc = data.accounts.find((a) => a.id === fromId);
    const fromContact = data.contacts.find((c) => c.id === fromId);

    const toAcc = data.accounts.find((a) => a.id === toId);
    const toContact = data.contacts.find((c) => c.id === toId);

    if ((!fromAcc && !fromContact) || (!toAcc && !toContact)) return;

    const fromName = fromAcc?.name || fromContact?.name || "Borçlu Hesap";
    const toName = toAcc?.name || toContact?.name || "Alacaklı Hesap";

    const defaultAccId = data.accounts[0]?.id || "";

    const txOut: Transaction = {
      id: "tx_out_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      amount,
      currency: "TRY",
      accountId: fromAcc ? fromAcc.id : defaultAccId,
      accountName: fromAcc ? fromAcc.name : (fromContact ? `Cari Virman (${fromContact.name})` : "Virman Hesabı"),
      contactId: fromContact ? fromContact.id : undefined,
      contactName: fromContact ? fromContact.name : undefined,
      category: "Virman / Transfer",
      description: `Virman (Borçlu): ${fromName} -> ${toName} (${desc || "Virman Transferi"})`,
    };

    const txIn: Transaction = {
      id: "tx_in_" + (Date.now() + 1),
      date: new Date().toISOString().split("T")[0],
      type: "income",
      amount,
      currency: "TRY",
      accountId: toAcc ? toAcc.id : defaultAccId,
      accountName: toAcc ? toAcc.name : (toContact ? `Cari Virman (${toContact.name})` : "Virman Hesabı"),
      contactId: toContact ? toContact.id : undefined,
      contactName: toContact ? toContact.name : undefined,
      category: "Virman / Transfer",
      description: `Virman (Alacaklı): ${toName} <- ${fromName} (${desc || "Virman Transferi"})`,
    };

    handleAddTransaction(txOut);
    handleAddTransaction(txIn);
  };

  const handleAddCheque = (cheque: Cheque) => {
    setData((prev) => {
      let updatedContacts = prev.contacts;
      if (cheque.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === cheque.contactId) {
            const delta = cheque.type === "received" ? -cheque.amount : cheque.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }
      return {
        ...prev,
        cheques: [cheque, ...(prev.cheques || [])],
        contacts: updatedContacts,
      };
    });
  };

  const handleUpdateChequeStatus = (id: string, status: ChequeStatus) => {
    setData((prev) => {
      const cheque = (prev.cheques || []).find((c) => c.id === id);
      const updatedCheques = (prev.cheques || []).map((c) => (c.id === id ? { ...c, status } : c));

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;

      if (cheque && (status === "collected" || status === "paid")) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = cheque.type === "received";
          const newTx: Transaction = {
            id: "tx_chq_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: cheque.amount,
            currency: cheque.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: cheque.contactId,
            contactName: cheque.contactName,
            category: isIncome ? "Çek Tahsilatı" : "Çek Ödemesi",
            description: `${cheque.bankName || "Banka"} (${cheque.chequeNumber || "Çek"}) ${isIncome ? "Çek Tahsilatı" : "Çek Ödemesi"}`,
          };
          updatedAccounts = prev.accounts.map((acc) =>
            acc.id === defaultAcc.id
              ? { ...acc, balance: isIncome ? acc.balance + cheque.amount : acc.balance - cheque.amount }
              : acc
          );
          updatedTransactions = [newTx, ...prev.transactions];
        }
      }

      return {
        ...prev,
        cheques: updatedCheques,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleEndorseCheque = (
    chequeId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).map((c) =>
        c.id === chequeId
          ? {
              ...c,
              status: "endorsed",
              endorsedToContactId: targetContactId,
              endorsedToContactName: targetContactName,
              endorsedDate: endorseDate,
            }
          : c
      ),
    }));
  };

  const handleDeleteCheque = (id: string) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).filter((c) => c.id !== id),
    }));
  };

  const handleAddPromissoryNote = (note: PromissoryNote) => {
    setData((prev) => {
      let updatedContacts = prev.contacts;
      if (note.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === note.contactId) {
            const delta = note.type === "received" ? -note.amount : note.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }
      return {
        ...prev,
        promissoryNotes: [note, ...(prev.promissoryNotes || [])],
        contacts: updatedContacts,
      };
    });
  };

  const handleUpdateNoteStatus = (id: string, status: PromissoryNoteStatus) => {
    setData((prev) => {
      const note = (prev.promissoryNotes || []).find((n) => n.id === id);
      const updatedNotes = (prev.promissoryNotes || []).map((n) => (n.id === id ? { ...n, status } : n));

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;

      if (note && (status === "collected" || status === "paid")) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = note.type === "received";
          const newTx: Transaction = {
            id: "tx_note_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: note.amount,
            currency: note.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: note.contactId,
            contactName: note.contactName,
            category: isIncome ? "Senet Tahsilatı" : "Senet Ödemesi",
            description: `Senet No: ${note.noteNumber || "Senet"} ${isIncome ? "Senet Tahsilatı" : "Senet Ödemesi"}`,
          };
          updatedAccounts = prev.accounts.map((acc) =>
            acc.id === defaultAcc.id
              ? { ...acc, balance: isIncome ? acc.balance + note.amount : acc.balance - note.amount }
              : acc
          );
          updatedTransactions = [newTx, ...prev.transactions];
        }
      }

      return {
        ...prev,
        promissoryNotes: updatedNotes,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleEndorsePromissoryNote = (
    noteId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).map((n) =>
        n.id === noteId
          ? {
              ...n,
              status: "endorsed",
              endorsedToContactId: targetContactId,
              endorsedToContactName: targetContactName,
              endorsedDate: endorseDate,
            }
          : n
      ),
    }));
  };

  const handleDeletePromissoryNote = (id: string) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).filter((n) => n.id !== id),
    }));
  };

  const handleAddProduct = (product: Product) => {
    setData((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
  };

  const handleUpdateProduct = (product: Product) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === product.id ? product : p)),
    }));
  };

  const handleDeleteProduct = (id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const handleAddQuote = (quote: Quote) => {
    setData((prev) => ({
      ...prev,
      quotes: [quote, ...prev.quotes],
    }));
  };

  const handleConvertQuoteToInvoice = (quote: Quote) => {
    const prefix = "MUV2026";
    const nextSeq = String(data.invoices.length + 1).padStart(7, "0");

    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: `${prefix}${nextSeq}`,
      type: "sales",
      contactId: quote.contactId,
      contactName: quote.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: quote.items,
      subtotal: quote.items.reduce((s, i) => s + i.totalWithoutVat, 0),
      totalVat: quote.items.reduce((s, i) => s + i.vatAmount, 0),
      grandTotal: quote.grandTotal,
      paidAmount: 0,
      remainingAmount: quote.grandTotal,
      status: "sent",
      currency: "TRY",
      notes: quote.notes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    handleAddInvoice(newInvoice);

    // Update quote status
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, status: "converted" as const } : q
      ),
    }));
  };

  const handleConvertQuoteToOrder = (quote: Quote) => {
    const prefix = "SIP2026";
    const nextSeq = String((data.orders || []).length + 1).padStart(6, "0");
    const contact = data.contacts.find((c) => c.id === quote.contactId);

    const newOrder: Order = {
      id: "ord_" + Date.now(),
      orderNumber: `${prefix}${nextSeq}`,
      type: "sales",
      contactId: quote.contactId,
      contactName: quote.contactName,
      contactPhone: contact?.phone,
      contactEmail: contact?.email,
      taxNumber: contact?.taxNumber,
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: quote.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: quote.items.map((item) => {
        const prod = data.products.find((p) => p.id === item.productId);
        return {
          id: item.id || "item_" + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productCode: prod?.code,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discountRate: 0,
          totalWithoutVat: item.totalWithoutVat,
          vatAmount: item.vatAmount,
          totalWithVat: item.totalWithVat,
        };
      }),
      subtotal: quote.items.reduce((s, i) => s + i.totalWithoutVat, 0),
      totalVat: quote.items.reduce((s, i) => s + i.vatAmount, 0),
      grandTotal: quote.grandTotal,
      currency: quote.currency || "TRY",
      status: "approved",
      notes: `Proforma (Belge No: ${quote.quoteNumber}) siparişe dönüştürüldü. ${quote.notes || ""}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    handleAddOrder(newOrder);

    // Update quote status to converted
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, status: "converted" as const } : q
      ),
    }));
  };

  const handleDeleteQuote = (id: string) => {
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== id),
    }));
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    setData((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleResetDemoData = () => {
    resetToDemoData();
    setData(getStoredData());
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Muavin_Yedek_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleImportBackup = (jsonStr: string) => {
    const ok = importBackupJSON(jsonStr);
    if (ok) {
      setData(getStoredData());
    }
    return ok;
  };

  // HR Handlers
  const handleAddEmployee = (emp: Employee) => {
    setData((p) => {
      const next = { ...p, employees: [emp, ...(p.employees || [])] };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setData((p) => {
      const next = {
        ...p,
        employees: (p.employees || []).map((e) => (e.id === emp.id ? emp : e)),
      };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleDeleteEmployee = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        employees: (p.employees || []).filter((e) => e.id !== id),
      };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleAddLeaveRequest = (req: LeaveRequest) => {
    setData((p) => {
      const next = { ...p, leaveRequests: [req, ...(p.leaveRequests || [])] };
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests);
      return next;
    });
  };

  const handleUpdateLeaveStatus = (id: string, status: "approved" | "rejected") => {
    setData((p) => {
      const next = {
        ...p,
        leaveRequests: (p.leaveRequests || []).map((r) =>
          r.id === id ? { ...r, status } : r
        ),
      };
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests);
      return next;
    });
  };

  const handleAddAdvanceRequest = (req: AdvanceRequest) => {
    setData((p) => {
      const next = { ...p, advanceRequests: [req, ...(p.advanceRequests || [])] };
      saveStoredData("ADVANCE_REQUESTS", next.advanceRequests);
      return next;
    });
  };

  const handleUpdateAdvanceStatus = (id: string, status: "paid" | "approved" | "rejected") => {
    setData((p) => {
      const targetReq = (p.advanceRequests || []).find((r) => r.id === id);
      const updatedAdvanceRequests = (p.advanceRequests || []).map((r) =>
        r.id === id ? { ...r, status } : r
      );
      saveStoredData("ADVANCE_REQUESTS", updatedAdvanceRequests);

      let updatedAccounts = p.accounts;
      let updatedTransactions = p.transactions;

      if (status === "paid" && targetReq && targetReq.status !== "paid") {
        const defaultAcc = p.accounts[0];
        if (defaultAcc) {
          const emp = (p.employees || []).find((e) => e.id === targetReq.employeeId);
          const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Personel";
          const newTx: Transaction = {
            id: "tx_adv_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: "expense",
            amount: targetReq.amount,
            currency: "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            category: "Personel / Avans",
            description: `Personel Avans Ödemesi: ${empName} (${targetReq.reason || "Avans Ödemesi"})`,
          };
          updatedAccounts = p.accounts.map((acc) =>
            acc.id === defaultAcc.id ? { ...acc, balance: acc.balance - targetReq.amount } : acc
          );
          updatedTransactions = [newTx, ...p.transactions];
        }
      }

      return {
        ...p,
        advanceRequests: updatedAdvanceRequests,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleAddLegalDeduction = (deduction: LegalDeduction) => {
    setData((p) => {
      const next = { ...p, legalDeductions: [deduction, ...(p.legalDeductions || [])] };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  const handleUpdateLegalDeduction = (deduction: LegalDeduction) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).map((d) => (d.id === deduction.id ? deduction : d)),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  const handleDeleteLegalDeduction = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).filter((d) => d.id !== id),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  // Handlers for Asset Custody (Zimmet & Demirbaş)
  const handleAddAsset = (asset: AssetCustody) => {
    setData((p) => {
      const next = { ...p, assetCustodies: [asset, ...(p.assetCustodies || [])] };
      saveStoredData("ASSET_CUSTODIES", next.assetCustodies);
      return next;
    });
  };

  const handleUpdateAsset = (asset: AssetCustody) => {
    setData((p) => {
      const next = {
        ...p,
        assetCustodies: (p.assetCustodies || []).map((a) => (a.id === asset.id ? asset : a)),
      };
      saveStoredData("ASSET_CUSTODIES", next.assetCustodies);
      return next;
    });
  };

  const handleDeleteAsset = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        assetCustodies: (p.assetCustodies || []).filter((a) => a.id !== id),
      };
      saveStoredData("ASSET_CUSTODIES", next.assetCustodies);
      return next;
    });
  };

  const getPageTitle = (tab: NavItem) => {
    switch (tab) {
      case "dashboard":
        return "Ana Sayfa";
      case "contacts":
        return "Cari Hesaplar";
      case "invoices":
        return "E-Belgeler";
      case "invoices_sales":
        return "Gelir Faturası";
      case "invoices_purchase":
        return "Gider Faturası";
      case "e_documents_incoming":
        return "Gelen e-Faturalar";
      case "e_documents_outgoing":
        return "Giden e-Faturalar";
      case "quotes":
        return "Proforma Faturalar";
      case "quotes_and_slips":
        return "Gelir & Gider Fişleri";
      case "orders":
        return "Siparişler & Sipariş Oluştur";
      case "orders_module":
        return "Sipariş & Proforma";
      case "waybills":
        return "İrsaliye Oluştur (Yerel)";
      case "waybills_dispatch":
        return "Giden e-İrsaliyeler";
      case "waybills_receipt":
        return "Gelen e-İrsaliyeler";
      case "accounts":
        return "Finans Yönetimi";
      case "transactions":
        return "Gelir & Giderler";
      case "income_slips":
        return "Gelir Fişi";
      case "expenses":
        return "Gider Fişi";
      case "products":
      case "products_list":
        return "Stoklar & Depolar";
      case "products_costs":
        return "Maliyetler & Kar Analizi";
      case "production_subcontract":
        return "Fason Üretim Takibi";
      case "auto_service":
        return "Oto Servis & Araç Bakım";
      case "it_service":
        return "Bilişim & BT Teknik Servis";
      case "appliance_service":
        return "Ev Aletleri ve Klima Servisi";
      case "hr":
        return "İnsan Kaynakları";
      case "reports":
        return "Vergilendirme";
      case "ai":
        return "AI Muavin Asistanı";
      case "company":
      case "company_profile":
        return "Firma Profili & Adres";
      case "company_branches":
        return "Firma Şubeleri";
      case "company_warehouses":
        return "Firma Depoları";
      case "company_e_services":
      case "e_services":
        return "E-İşlemler (GİB, SGK, E-Devlet)";
      case "settings":
        return "Sistem Ayarları";
      case "admin":
        return "Admin Yönetici Paneli";
      default:
        return "Ana Sayfa";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeFinanceSubTab={financeSubTab}
        onSelectFinanceSubTab={setFinanceSubTab}
        settings={data.settings}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          title={getPageTitle(currentTab)}
          subtitle="Muavin Ön Muhasebe & Finansal Takip Programı"
          accounts={data.accounts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenAiModal={() => setCurrentTab("ai")}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main className="flex-1 pb-12 bg-slate-100">
          <Suspense fallback={<TabLoadingSkeleton />}>
            {currentTab === "dashboard" && (
            <Dashboard
              contacts={data.contacts}
              invoices={data.invoices}
              accounts={data.accounts}
              transactions={data.transactions}
              settings={data.settings}
              globalSearchTerm={searchTerm}
              onSelectTab={setCurrentTab}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onOpenAiModal={() => setCurrentTab("ai")}
            />
          )}

          {currentTab === "contacts" && (
            <Contacts
              currentUser={currentUser}
              contacts={data.contacts}
              invoices={data.invoices}
              transactions={data.transactions}
              accounts={data.accounts}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onAddTransaction={handleAddTransaction}
              onAddCheque={handleAddCheque}
              onAddPromissoryNote={handleAddPromissoryNote}
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onOpenNewInvoiceForContact={(cid) => {
                setInitialContactIdForInvoice(cid);
                setCurrentTab("invoices");
              }}
              onOpenPaymentModal={() => setCurrentTab("transactions")}
            />
          )}

          {(currentTab === "invoices" ||
            currentTab === "invoices_sales" ||
            currentTab === "invoices_purchase") && (
            <Invoices
              invoices={data.invoices}
              contacts={data.contacts}
              products={data.products}
              accounts={data.accounts}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              forcedType={
                currentTab === "invoices_sales"
                  ? "sales"
                  : currentTab === "invoices_purchase"
                  ? "purchase"
                  : undefined
              }
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onAddTransactionFromInvoice={handleAddTransactionFromInvoice}
              onCollectAllInvoices={handleCollectAllInvoices}
              initialContactIdForNewInvoice={initialContactIdForInvoice}
              onSelectTab={setCurrentTab}
            />
          )}

          {(currentTab === "e_documents_incoming" || currentTab === "e_documents_outgoing") && (
            <EDocuments
              family="invoice"
              direction={currentTab === "e_documents_outgoing" ? "outgoing" : "incoming"}
              companySettings={data.settings}
              tenantIdentifierNumber={
                data.settings.tenantIdentifierNumber || readStoredMysoftTenantVkn()
              }
              globalSearchTerm={searchTerm}
              onImportInvoice={handleImportMysoftInvoice}
            />
          )}

          {currentTab === "quotes" && (
            <Quotes
              quotes={data.quotes}
              contacts={data.contacts}
              products={data.products}
              companySettings={data.companySettings}
              globalSearchTerm={searchTerm}
              onAddQuote={handleAddQuote}
              onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
              onConvertQuoteToOrder={handleConvertQuoteToOrder}
              onDeleteQuote={handleDeleteQuote}
            />
          )}

          {currentTab === "accounts" && (
            <Accounts
              accounts={data.accounts}
              transactions={data.transactions}
              contacts={data.contacts}
              cheques={data.cheques || []}
              promissoryNotes={data.promissoryNotes || []}
              companySettings={data.companySettings || data.settings}
              activeFinanceSubTab={financeSubTab}
              globalSearchTerm={searchTerm}
              onSelectFinanceSubTab={setFinanceSubTab}
              onAddAccount={(acc) =>
                setData((p) => ({ ...p, accounts: [...p.accounts, acc] }))
              }
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddCheque={handleAddCheque}
              onUpdateCheque={handleUpdateCheque}
              onUpdateChequeStatus={handleUpdateChequeStatus}
              onDeleteCheque={handleDeleteCheque}
              onEndorseCheque={handleEndorseCheque}
              onAddPromissoryNote={handleAddPromissoryNote}
              onUpdatePromissoryNote={handleUpdatePromissoryNote}
              onUpdateNoteStatus={handleUpdateNoteStatus}
              onEndorsePromissoryNote={handleEndorsePromissoryNote}
              onDeletePromissoryNote={handleDeletePromissoryNote}
            />
          )}

          {(currentTab === "transactions" ||
            currentTab === "income_slips" ||
            currentTab === "expenses") && (
            <Transactions
              transactions={data.transactions}
              accounts={data.accounts}
              contacts={data.contacts}
              products={data.products || []}
              globalSearchTerm={searchTerm}
              forcedType={
                currentTab === "income_slips"
                  ? "income"
                  : currentTab === "expenses"
                  ? "expense"
                  : undefined
              }
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {(currentTab === "products" || currentTab === "products_list" || currentTab === "products_costs") && (
            <Products
              products={data.products}
              invoices={data.invoices}
              contacts={data.contacts}
              warehouses={data.warehouses || []}
              costProjects={data.costProjects || []}
              employees={data.employees || []}
              transactions={data.transactions || []}
              companySettings={data.companySettings || data.settings}
              globalSearchTerm={searchTerm}
              activeSubTab={currentTab === "products_costs" ? "costs" : "list"}
              onSelectSubTab={(sub) => setCurrentTab(sub === "costs" ? "products_costs" : "products_list")}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCostProject={handleAddCostProject}
              onUpdateCostProject={handleUpdateCostProject}
              onDeleteCostProject={handleDeleteCostProject}
            />
          )}

          {currentTab === "orders" && (
            <Orders
              orders={data.orders || []}
              contacts={data.contacts}
              products={data.products}
              warehouses={data.warehouses || []}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onConvertOrderToInvoice={handleConvertOrderToInvoice}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {[
            "production",
            "production_boms",
            "production_routings",
            "production_workstations",
            "production_work_orders",
            "production_subcontract",
          ].includes(currentTab) && (
            <ProductionModule
              boms={data.boms || []}
              routings={data.routings || []}
              workstations={data.workstations || []}
              workOrders={data.workOrders || []}
              subcontractOrders={data.subcontractOrders || []}
              products={data.products || []}
              warehouses={data.warehouses || []}
              branches={data.branches || []}
              contacts={data.contacts || []}
              orders={data.orders || []}
              initialSubTab={
                currentTab === "production_boms"
                  ? "boms"
                  : currentTab === "production_routings"
                  ? "routings"
                  : currentTab === "production_workstations"
                  ? "workstations"
                  : currentTab === "production_work_orders"
                  ? "work_orders"
                  : currentTab === "production_subcontract"
                  ? "subcontract"
                  : "overview"
              }
              onSaveBom={handleSaveBom}
              onDeleteBom={handleDeleteBom}
              onSaveRouting={handleSaveRouting}
              onDeleteRouting={handleDeleteRouting}
              onSaveWorkstation={handleSaveWorkstation}
              onDeleteWorkstation={handleDeleteWorkstation}
              onSaveWorkOrder={handleSaveWorkOrder}
              onDeleteWorkOrder={handleDeleteWorkOrder}
              onSaveSubcontractOrder={handleSaveSubcontractOrder}
              onReceiveSubcontract={handleReceiveSubcontract}
              onIssueMaterials={handleIssueMaterials}
              onReceiveFinishedGoods={handleReceiveFinishedGoods}
              onCreateWorkOrderFromMrp={handleCreateWorkOrderFromMrp}
              onCreatePurchaseOrderFromMrp={handleCreatePurchaseOrderFromMrp}
            />
          )}

          {(currentTab === "waybills_dispatch" || currentTab === "waybills_receipt") && (
            <EDocuments
              family="despatch"
              direction={currentTab === "waybills_dispatch" ? "outgoing" : "incoming"}
              companySettings={data.settings}
              tenantIdentifierNumber={
                data.settings.tenantIdentifierNumber || readStoredMysoftTenantVkn()
              }
              globalSearchTerm={searchTerm}
            />
          )}

          {currentTab === "auto_service" && (
            <AutoServiceModule
              autoServices={data.autoServices || []}
              onUpdateAutoServices={handleUpdateAutoServices}
              contacts={data.contacts}
            />
          )}

          {currentTab === "it_service" && (
            <ITServiceModule
              itServices={data.itServices || []}
              onUpdateItServices={handleUpdateItServices}
              contacts={data.contacts}
            />
          )}

          {currentTab === "appliance_service" && (
            <ApplianceServiceModule
              applianceServices={data.applianceServices || []}
              onUpdateApplianceServices={handleUpdateApplianceServices}
              contacts={data.contacts}
            />
          )}

          {currentTab === "waybills" && (
            <Waybills
              waybills={data.waybills || []}
              contacts={data.contacts}
              products={data.products}
              warehouses={data.warehouses || []}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddWaybill={handleAddWaybill}
              onUpdateWaybill={handleUpdateWaybill}
              onConvertWaybillToInvoice={handleConvertWaybillToInvoice}
              onDeleteWaybill={handleDeleteWaybill}
            />
          )}

          {currentTab === "hr" && (
            <HRManagement
              employees={data.employees || []}
              leaveRequests={data.leaveRequests || []}
              advanceRequests={data.advanceRequests || []}
              legalDeductions={data.legalDeductions || []}
              assetCustodies={data.assetCustodies || []}
              companySettings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              costProjects={data.costProjects || []}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddLeaveRequest={handleAddLeaveRequest}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onAddAdvanceRequest={handleAddAdvanceRequest}
              onUpdateAdvanceStatus={handleUpdateAdvanceStatus}
              onAddLegalDeduction={handleAddLegalDeduction}
              onUpdateLegalDeduction={handleUpdateLegalDeduction}
              onDeleteLegalDeduction={handleDeleteLegalDeduction}
              onAddAsset={handleAddAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {currentTab === "files" && currentUser && (
            <FileManager currentUser={currentUser} />
          )}

          {currentTab === "admin" && currentUser && (
            <AdminDashboard currentUser={currentUser} />
          )}

          {currentTab === "reports" && (
            <Reports
              contacts={data.contacts}
              invoices={data.invoices}
              transactions={data.transactions}
              companySettings={data.settings}
              products={data.products}
              quotes={data.quotes}
              orders={data.orders}
              waybills={data.waybills}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              employees={data.employees}
            />
          )}

          {currentTab === "ai" && (
            <AiAssistant
              contacts={data.contacts}
              invoices={data.invoices}
              accounts={data.accounts}
              transactions={data.transactions}
              products={data.products}
              quotes={data.quotes}
              orders={data.orders}
              waybills={data.waybills}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              employees={data.employees}
              onAddInvoice={handleAddInvoice}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {["company", "company_profile", "company_branches", "company_warehouses"].includes(currentTab) && (
            <CompanyManagement
              settings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              onSaveSettings={handleSaveSettings}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
              onDeleteBranch={handleDeleteBranch}
              onAddWarehouse={handleAddWarehouse}
              onUpdateWarehouse={handleUpdateWarehouse}
              onDeleteWarehouse={handleDeleteWarehouse}
              activeSubTab={
                currentTab === "company_branches"
                  ? "branches"
                  : currentTab === "company_warehouses"
                  ? "warehouses"
                  : "profile"
              }
              onSelectSubTab={(tab) => {
                if (tab === "branches") setCurrentTab("company_branches");
                else if (tab === "warehouses") setCurrentTab("company_warehouses");
                else setCurrentTab("company_profile");
              }}
            />
          )}

          {currentTab === "e_services" && (
            <EServices
              settings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {currentTab === "settings" && (
            <Settings
              settings={data.settings}
              onSaveSettings={handleSaveSettings}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDemoData={handleResetDemoData}
            />
          )}
          </Suspense>
        </main>
      </div>

      {/* QUICK ADD ACTION MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Hızlı İşlem Seçin
              </h3>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("invoices");
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 hover:border-indigo-500/50 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Yeni Fatura Kes / Kaydet
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Satış veya Alış e-Faturası hazırlayın
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("contacts");
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 hover:border-blue-500/50 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Yeni Cari Kart Ekle
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Müşteri veya Tedarikçi tanımı yapın
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("transactions");
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500/50 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Hızlı Gelir / Gider Kaydı
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Kira, Maaş, Fiş veya Fatura dışı ödemeler
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth & Registration Modal with 6 Brand Logo Gallery */}
      <AuthModal
        isOpen={authModalOpen || currentUser === null}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
        }}
        initialMode={authModalMode}
        canClose={!!currentUser}
      />
    </div>
  );
}
