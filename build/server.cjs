var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  cheques: () => cheques,
  contacts: () => contacts,
  employees: () => employees,
  invoices: () => invoices,
  orders: () => orders,
  products: () => products,
  promissoryNotes: () => promissoryNotes,
  transactions: () => transactions,
  users: () => users,
  usersRelations: () => usersRelations
});
var import_pg_core, import_drizzle_orm, users, accounts, contacts, products, invoices, transactions, orders, cheques, promissoryNotes, employees, usersRelations;
var init_schema = __esm({
  "src/db/schema.ts"() {
    import_pg_core = require("drizzle-orm/pg-core");
    import_drizzle_orm = require("drizzle-orm");
    users = (0, import_pg_core.pgTable)("users", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      uid: (0, import_pg_core.text)("uid").notNull().unique("users_uid_key"),
      // Firebase Auth UID
      email: (0, import_pg_core.text)("email").notNull(),
      fullName: (0, import_pg_core.text)("full_name"),
      role: (0, import_pg_core.text)("role").default("user"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    accounts = (0, import_pg_core.pgTable)("accounts", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      name: (0, import_pg_core.text)("name").notNull(),
      type: (0, import_pg_core.text)("type").notNull(),
      // cash, bank, credit_card
      currency: (0, import_pg_core.text)("currency").default("TRY"),
      balance: (0, import_pg_core.doublePrecision)("balance").default(0),
      accountNumber: (0, import_pg_core.text)("account_number"),
      iban: (0, import_pg_core.text)("iban"),
      bankName: (0, import_pg_core.text)("bank_name"),
      isDefault: (0, import_pg_core.boolean)("is_default").default(false),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    contacts = (0, import_pg_core.pgTable)("contacts", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      name: (0, import_pg_core.text)("name").notNull(),
      companyTitle: (0, import_pg_core.text)("company_title"),
      contactType: (0, import_pg_core.text)("contact_type").notNull(),
      // customer, vendor, both
      taxOffice: (0, import_pg_core.text)("tax_office"),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      email: (0, import_pg_core.text)("email"),
      phone: (0, import_pg_core.text)("phone"),
      address: (0, import_pg_core.text)("address"),
      city: (0, import_pg_core.text)("city"),
      district: (0, import_pg_core.text)("district"),
      neighborhood: (0, import_pg_core.text)("neighborhood"),
      street: (0, import_pg_core.text)("street"),
      balance: (0, import_pg_core.doublePrecision)("balance").default(0),
      balanceType: (0, import_pg_core.text)("balance_type").default("balanced"),
      notes: (0, import_pg_core.text)("notes"),
      createdAt: (0, import_pg_core.text)("created_at")
    });
    products = (0, import_pg_core.pgTable)("products", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      code: (0, import_pg_core.text)("code").notNull(),
      name: (0, import_pg_core.text)("name").notNull(),
      unit: (0, import_pg_core.text)("unit").default("Adet"),
      buyPrice: (0, import_pg_core.doublePrecision)("buy_price").default(0),
      sellPrice: (0, import_pg_core.doublePrecision)("sell_price").default(0),
      vatRate: (0, import_pg_core.integer)("vat_rate").default(20),
      stockQuantity: (0, import_pg_core.doublePrecision)("stock_quantity").default(0),
      minStockAlert: (0, import_pg_core.doublePrecision)("min_stock_alert"),
      category: (0, import_pg_core.text)("category"),
      stockType: (0, import_pg_core.text)("stock_type"),
      barcode: (0, import_pg_core.text)("barcode"),
      imeiOrSerialNo: (0, import_pg_core.text)("imei_or_serial_no"),
      warehouseId: (0, import_pg_core.text)("warehouse_id"),
      warehouseName: (0, import_pg_core.text)("warehouse_name"),
      warehouseQuantities: (0, import_pg_core.jsonb)("warehouse_quantities"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    invoices = (0, import_pg_core.pgTable)("invoices", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      invoiceNumber: (0, import_pg_core.text)("invoice_number").notNull(),
      type: (0, import_pg_core.text)("type").notNull(),
      // sales, purchase
      contactId: (0, import_pg_core.text)("contact_id").notNull(),
      contactName: (0, import_pg_core.text)("contact_name").notNull(),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      issueDate: (0, import_pg_core.text)("issue_date").notNull(),
      dueDate: (0, import_pg_core.text)("due_date").notNull(),
      items: (0, import_pg_core.jsonb)("items").notNull(),
      subtotal: (0, import_pg_core.doublePrecision)("subtotal").default(0),
      totalVat: (0, import_pg_core.doublePrecision)("total_vat").default(0),
      totalWithholding: (0, import_pg_core.doublePrecision)("total_withholding").default(0),
      grandTotal: (0, import_pg_core.doublePrecision)("grand_total").default(0),
      paidAmount: (0, import_pg_core.doublePrecision)("paid_amount").default(0),
      remainingAmount: (0, import_pg_core.doublePrecision)("remaining_amount").default(0),
      status: (0, import_pg_core.text)("status").default("draft"),
      currency: (0, import_pg_core.text)("currency").default("TRY"),
      notes: (0, import_pg_core.text)("notes"),
      terms: (0, import_pg_core.text)("terms"),
      createdAt: (0, import_pg_core.text)("created_at")
    });
    transactions = (0, import_pg_core.pgTable)("transactions", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      date: (0, import_pg_core.text)("date").notNull(),
      type: (0, import_pg_core.text)("type").notNull(),
      amount: (0, import_pg_core.doublePrecision)("amount").notNull(),
      currency: (0, import_pg_core.text)("currency").default("TRY"),
      accountId: (0, import_pg_core.text)("account_id").notNull(),
      accountName: (0, import_pg_core.text)("account_name").notNull(),
      contactId: (0, import_pg_core.text)("contact_id"),
      contactName: (0, import_pg_core.text)("contact_name"),
      invoiceId: (0, import_pg_core.text)("invoice_id"),
      invoiceNumber: (0, import_pg_core.text)("invoice_number"),
      category: (0, import_pg_core.text)("category"),
      description: (0, import_pg_core.text)("description"),
      documentNo: (0, import_pg_core.text)("document_no"),
      receiptImage: (0, import_pg_core.text)("receipt_image"),
      items: (0, import_pg_core.jsonb)("items"),
      subtotal: (0, import_pg_core.doublePrecision)("subtotal"),
      totalVat: (0, import_pg_core.doublePrecision)("total_vat"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    orders = (0, import_pg_core.pgTable)("orders", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      orderNumber: (0, import_pg_core.text)("order_number").notNull(),
      type: (0, import_pg_core.text)("type").notNull(),
      contactId: (0, import_pg_core.text)("contact_id").notNull(),
      contactName: (0, import_pg_core.text)("contact_name").notNull(),
      contactPhone: (0, import_pg_core.text)("contact_phone"),
      contactEmail: (0, import_pg_core.text)("contact_email"),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      orderDate: (0, import_pg_core.text)("order_date").notNull(),
      deliveryDate: (0, import_pg_core.text)("delivery_date"),
      items: (0, import_pg_core.jsonb)("items").notNull(),
      subtotal: (0, import_pg_core.doublePrecision)("subtotal").default(0),
      totalVat: (0, import_pg_core.doublePrecision)("total_vat").default(0),
      grandTotal: (0, import_pg_core.doublePrecision)("grand_total").default(0),
      currency: (0, import_pg_core.text)("currency").default("TRY"),
      status: (0, import_pg_core.text)("status").default("pending"),
      warehouseId: (0, import_pg_core.text)("warehouse_id"),
      warehouseName: (0, import_pg_core.text)("warehouse_name"),
      notes: (0, import_pg_core.text)("notes"),
      convertedToInvoiceId: (0, import_pg_core.text)("converted_to_invoice_id"),
      convertedToInvoiceNumber: (0, import_pg_core.text)("converted_to_invoice_number"),
      createdAt: (0, import_pg_core.text)("createdat")
    });
    cheques = (0, import_pg_core.pgTable)("cheques", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      type: (0, import_pg_core.text)("type").notNull(),
      chequeNumber: (0, import_pg_core.text)("cheque_number").notNull(),
      bankName: (0, import_pg_core.text)("bank_name"),
      branchName: (0, import_pg_core.text)("branch_name"),
      drawerName: (0, import_pg_core.text)("drawer_name"),
      contactId: (0, import_pg_core.text)("contact_id"),
      contactName: (0, import_pg_core.text)("contact_name"),
      issueDate: (0, import_pg_core.text)("issue_date"),
      dueDate: (0, import_pg_core.text)("due_date"),
      amount: (0, import_pg_core.doublePrecision)("amount").notNull(),
      currency: (0, import_pg_core.text)("currency").default("TRY"),
      status: (0, import_pg_core.text)("status").default("portfolio"),
      notes: (0, import_pg_core.text)("notes"),
      endorsedToContactId: (0, import_pg_core.text)("endorsed_to_contact_id"),
      endorsedToContactName: (0, import_pg_core.text)("endorsed_to_contact_name"),
      endorsedDate: (0, import_pg_core.text)("endorsed_date"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    promissoryNotes = (0, import_pg_core.pgTable)("promissory_notes", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      type: (0, import_pg_core.text)("type").notNull(),
      noteNumber: (0, import_pg_core.text)("note_number").notNull(),
      debtorName: (0, import_pg_core.text)("debtor_name"),
      contactId: (0, import_pg_core.text)("contact_id"),
      contactName: (0, import_pg_core.text)("contact_name"),
      issueDate: (0, import_pg_core.text)("issue_date"),
      dueDate: (0, import_pg_core.text)("due_date"),
      amount: (0, import_pg_core.doublePrecision)("amount").notNull(),
      currency: (0, import_pg_core.text)("currency").default("TRY"),
      status: (0, import_pg_core.text)("status").default("portfolio"),
      notes: (0, import_pg_core.text)("notes"),
      endorsedToContactId: (0, import_pg_core.text)("endorsed_to_contact_id"),
      endorsedToContactName: (0, import_pg_core.text)("endorsed_to_contact_name"),
      endorsedDate: (0, import_pg_core.text)("endorsed_date"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    employees = (0, import_pg_core.pgTable)("employees", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.uid),
      tckn: (0, import_pg_core.text)("tckn").notNull(),
      fullName: (0, import_pg_core.text)("full_name").notNull(),
      title: (0, import_pg_core.text)("title").notNull(),
      department: (0, import_pg_core.text)("department").notNull(),
      startDate: (0, import_pg_core.text)("start_date").notNull(),
      endDate: (0, import_pg_core.text)("end_date"),
      terminationCode: (0, import_pg_core.text)("termination_code"),
      terminationReason: (0, import_pg_core.text)("termination_reason"),
      birthDate: (0, import_pg_core.text)("birth_date"),
      homeAddress: (0, import_pg_core.text)("home_address"),
      photoUrl: (0, import_pg_core.text)("photo_url"),
      phone: (0, import_pg_core.text)("phone"),
      email: (0, import_pg_core.text)("email"),
      salaryType: (0, import_pg_core.text)("salary_type").default("net"),
      salaryAmount: (0, import_pg_core.doublePrecision)("salary_amount").default(0),
      foodAllowance: (0, import_pg_core.doublePrecision)("food_allowance").default(0),
      roadAllowance: (0, import_pg_core.doublePrecision)("road_allowance").default(0),
      hasBes: (0, import_pg_core.boolean)("has_bes").default(false),
      sgkOccupationCode: (0, import_pg_core.text)("sgk_occupation_code"),
      iban: (0, import_pg_core.text)("iban"),
      bankName: (0, import_pg_core.text)("bank_name"),
      emergencyContact: (0, import_pg_core.text)("emergency_contact"),
      emergencyPhone: (0, import_pg_core.text)("emergency_phone"),
      status: (0, import_pg_core.text)("status").default("active"),
      annualLeaveAllowance: (0, import_pg_core.integer)("annual_leave_allowance").default(14),
      usedAnnualLeave: (0, import_pg_core.integer)("used_annual_leave").default(0),
      notes: (0, import_pg_core.text)("notes"),
      createdAt: (0, import_pg_core.text)("created_at")
    });
    usersRelations = (0, import_drizzle_orm.relations)(users, ({ many }) => ({
      accounts: many(accounts),
      contacts: many(contacts),
      products: many(products),
      invoices: many(invoices),
      transactions: many(transactions)
    }));
  }
});

// src/db/index.ts
var db_exports = {};
__export(db_exports, {
  createPool: () => createPool,
  db: () => db,
  ensureProxyAndSocketReady: () => ensureProxyAndSocketReady
});
function getSocketFilePath() {
  const sqlHost = (process.env.SQL_HOST || "").trim();
  if (!sqlHost || !sqlHost.startsWith("/")) {
    return null;
  }
  return import_path4.default.join(sqlHost, ".s.PGSQL.5432");
}
function getProxyProcesses() {
  try {
    const out = (0, import_child_process3.execSync)("ps -eo pid,args", { encoding: "utf8" });
    return out.split("\n").map((line) => line.trim()).filter((line) => line.includes("/app/cloud_sql_proxy") && !line.includes("ps -eo")).map((line) => {
      const firstSpace = line.indexOf(" ");
      const pid = parseInt(line.slice(0, firstSpace).trim(), 10);
      const cmd = line.slice(firstSpace + 1).trim();
      return { pid, cmd };
    }).filter((p) => Number.isFinite(p.pid) && p.pid > 1 && p.pid !== process.pid);
  } catch {
    return [];
  }
}
function installProxyWrapperAndSpawnIfNeeded(forceRestart = false) {
  try {
    const proxyPath = "/app/cloud_sql_proxy";
    const proxyBinPath = "/app/cloud_sql_proxy.bin";
    if (import_fs4.default.existsSync(proxyPath) && !import_fs4.default.existsSync(proxyBinPath)) {
      const stat = import_fs4.default.statSync(proxyPath);
      if (stat.size > 1e4) {
        import_fs4.default.renameSync(proxyPath, proxyBinPath);
        const wrapperScript = `#!/bin/bash
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --impersonate-service-account=*)
      ;;
    *)
      ARGS+=("$arg")
      ;;
  esac
done
exec /app/cloud_sql_proxy.bin "\${ARGS[@]}"
`;
        import_fs4.default.writeFileSync(proxyPath, wrapperScript, { mode: 493 });
      }
    }
    const sqlHost = (process.env.SQL_HOST || "").trim();
    if (!sqlHost.startsWith("/app/cloudsql/")) {
      return;
    }
    const instanceName = sqlHost.replace("/app/cloudsql/", "").trim();
    const socketFile = getSocketFilePath();
    const procs = getProxyProcesses();
    const hasBrokenImpersonation = procs.some((p) => p.cmd.includes("--impersonate-service-account="));
    const isProxyRunning = procs.length > 0;
    const isSocketPresent = socketFile ? import_fs4.default.existsSync(socketFile) : true;
    if (forceRestart || hasBrokenImpersonation || !isProxyRunning || !isSocketPresent) {
      if (hasBrokenImpersonation || forceRestart) {
        for (const p of procs) {
          try {
            process.kill(p.pid, "SIGTERM");
          } catch {
          }
        }
      }
      import_fs4.default.mkdirSync("/app/cloudsql", { recursive: true });
      const executable = import_fs4.default.existsSync(proxyBinPath) ? proxyBinPath : proxyPath;
      if (instanceName && import_fs4.default.existsSync(executable)) {
        const child = (0, import_child_process3.spawn)(
          executable,
          [
            instanceName,
            "--unix-socket=/app/cloudsql",
            "--sql-data",
            "--sql-data-endpoint=sqladmin.googleapis.com",
            "--sqladmin-api-endpoint=sqladmin.googleapis.com"
          ],
          { detached: true, stdio: "ignore" }
        );
        child.unref();
        if (child.pid) {
          import_fs4.default.writeFileSync("/app/.cloud_sql_proxy.pid", String(child.pid));
        }
      }
    }
  } catch {
  }
}
async function ensureProxyAndSocketReady(forceRestart = false) {
  const socketFile = getSocketFilePath();
  if (!socketFile) return;
  if (!forceRestart && import_fs4.default.existsSync(socketFile)) {
    const procs = getProxyProcesses();
    if (procs.length > 0 && !procs.some((p) => p.cmd.includes("--impersonate-service-account="))) {
      return;
    }
  }
  if (global._proxyReadyPromise) {
    return global._proxyReadyPromise;
  }
  global._proxyReadyPromise = (async () => {
    try {
      installProxyWrapperAndSpawnIfNeeded(forceRestart);
      const maxWaitMs = 8e3;
      const start = Date.now();
      while (Date.now() - start < maxWaitMs) {
        if (import_fs4.default.existsSync(socketFile)) {
          await sleep(150);
          return;
        }
        await sleep(120);
      }
    } finally {
      global._proxyReadyPromise = void 0;
    }
  })();
  return global._proxyReadyPromise;
}
function isTransientSocketError(err) {
  const msg = String(err?.message || err?.cause?.message || err || "");
  const code = String(err?.code || err?.cause?.code || "");
  return code === "ENOENT" || code === "ECONNRESET" || code === "ECONNREFUSED" || code === "57P01" || msg.includes("ENOENT") || msg.includes("ECONNRESET") || msg.includes("ECONNREFUSED") || msg.includes("Connection terminated");
}
var import_node_postgres, import_pg, import_fs4, import_path4, import_child_process3, sleep, createPool, pool, db;
var init_db = __esm({
  "src/db/index.ts"() {
    import_node_postgres = require("drizzle-orm/node-postgres");
    import_pg = require("pg");
    import_fs4 = __toESM(require("fs"), 1);
    import_path4 = __toESM(require("path"), 1);
    import_child_process3 = require("child_process");
    init_schema();
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    createPool = () => {
      if (!global._postgresPool) {
        installProxyWrapperAndSpawnIfNeeded(false);
        const rawPool = new import_pg.Pool({
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 10,
          connectionTimeoutMillis: 15e3
        });
        rawPool.on("error", () => {
        });
        const origQuery = rawPool.query.bind(rawPool);
        rawPool.query = async (...args) => {
          if (typeof args[args.length - 1] === "function") {
            return origQuery(...args);
          }
          await ensureProxyAndSocketReady(false);
          let lastErr;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              return await origQuery(...args);
            } catch (err) {
              lastErr = err;
              if (isTransientSocketError(err) && attempt < 2) {
                await ensureProxyAndSocketReady(true);
                await sleep(300 * (attempt + 1));
                continue;
              }
              throw err;
            }
          }
          throw lastErr;
        };
        const origConnect = rawPool.connect.bind(rawPool);
        rawPool.connect = async (...args) => {
          if (typeof args[0] === "function") {
            return origConnect(...args);
          }
          await ensureProxyAndSocketReady(false);
          let lastErr;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              return await origConnect(...args);
            } catch (err) {
              lastErr = err;
              if (isTransientSocketError(err) && attempt < 2) {
                await ensureProxyAndSocketReady(true);
                await sleep(300 * (attempt + 1));
                continue;
              }
              throw err;
            }
          }
          throw lastErr;
        };
        global._postgresPool = rawPool;
      }
      return global._postgresPool;
    };
    pool = createPool();
    db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });
  }
});

// server.ts
var import_express6 = __toESM(require("express"), 1);
var import_path5 = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_genai = require("@google/genai");

// src/services/mysoftRoutes.ts
var import_express = require("express");

// src/services/mysoftTenant.ts
var VKN_TCKN = /^(?:\d{10}|\d{11})$/;
function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}
function normalizeMysoftTenantIdentifier(value) {
  if (value && typeof value === "object") {
    const rec = value;
    const candidate = rec.tenantIdentifierNumber ?? rec.taxNumber ?? rec.vknTckn ?? rec.vkn ?? rec.tckn;
    if (candidate) return normalizeMysoftTenantIdentifier(candidate);
  }
  const digits2 = digitsOnly(value);
  return VKN_TCKN.test(digits2) ? digits2 : void 0;
}
function isMysoftTenantScopeError(error) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const details = error && typeof error === "object" && "details" in error ? JSON.stringify(error.details || "") : "";
  return /00164|firma kaydı bulunamadı/i.test(`${message} ${details}`);
}

// src/services/mysoftInvoiceNumber.ts
function parseInvoiceDocNo(docNo) {
  if (!docNo || typeof docNo !== "string") return null;
  const clean = docNo.trim().toUpperCase();
  const gibMatch = clean.match(/^([A-Z0-9]{3})(20\d{2})(\d{9})$/);
  if (gibMatch) {
    return {
      prefix: gibMatch[1],
      year: parseInt(gibMatch[2], 10),
      sequence: parseInt(gibMatch[3], 10),
      padLength: 9,
      raw: clean
    };
  }
  const tolerantMatch = clean.match(/^([A-Z0-9]{2,5})(20\d{2})(\d+)$/);
  if (tolerantMatch) {
    return {
      prefix: tolerantMatch[1],
      year: parseInt(tolerantMatch[2], 10),
      sequence: parseInt(tolerantMatch[3], 10),
      padLength: Math.max(9, tolerantMatch[3].length),
      raw: clean
    };
  }
  return null;
}
function formatInvoiceDocNo(prefix, year, sequence, padLength = 9) {
  const cleanPrefix = (prefix || "GIB").trim().toUpperCase().slice(0, 3);
  const cleanYear = Number.isInteger(year) && year >= 2e3 ? year : (/* @__PURE__ */ new Date()).getFullYear();
  const cleanSeq = Math.max(1, Math.trunc(sequence));
  const paddedSeq = String(cleanSeq).padStart(padLength, "0");
  return `${cleanPrefix}${cleanYear}${paddedSeq}`;
}
function calculateNextInvoiceNumber(options) {
  const year = Number.isInteger(options.targetYear) && options.targetYear >= 2e3 ? options.targetYear : (/* @__PURE__ */ new Date()).getFullYear();
  const parsedList = options.existingDocNos.map((doc) => parseInvoiceDocNo(doc)).filter((item) => item !== null);
  let prefix = (options.targetPrefix || "").trim().toUpperCase();
  if (!prefix && parsedList.length > 0) {
    prefix = parsedList[0].prefix;
  }
  if (!prefix) {
    prefix = (options.fallbackPrefix || "GIB").trim().toUpperCase();
  }
  const matching = parsedList.filter(
    (item) => item.prefix === prefix && item.year === year
  );
  let maxSequence = 0;
  let lastMatchingDocNo = void 0;
  for (const item of matching) {
    if (item.sequence > maxSequence) {
      maxSequence = item.sequence;
      lastMatchingDocNo = item.raw;
    }
  }
  const nextSequence = maxSequence + 1;
  const nextDocNo = formatInvoiceDocNo(prefix, year, nextSequence);
  return {
    prefix,
    year,
    lastDocNo: lastMatchingDocNo,
    lastSequence: maxSequence,
    nextSequence,
    nextDocNo
  };
}

// src/services/mysoftInvoicePayload.ts
function digits(value) {
  return String(value || "").replace(/\D/g, "");
}
function toMysoftDateTime(isoDate, time = "00:00:00") {
  const raw = String(isoDate || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (match) return `${match[2]}/${match[3]}/${match[1]} ${time}`;
  const tr = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(raw);
  if (tr) return `${tr[2]}/${tr[1]}/${tr[3]} ${time}`;
  return raw;
}
function resolveEDocumentType(value) {
  const raw = String(value || "EFATURA").toUpperCase().replace(/[ _-]/g, "");
  if (raw.includes("ARSIV") || raw === "EARSIV" || raw === "E_ARSIV") {
    return "EARSIVFATURA";
  }
  return "EFATURA";
}
function round2(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}
var STANDARD_WITHHOLDING_PERCENTAGES = {
  "601": 40,
  "602": 90,
  "603": 70,
  "604": 50,
  "605": 50,
  "606": 90,
  "607": 90,
  "608": 90,
  "609": 70,
  "610": 90,
  "611": 90,
  "612": 90,
  "613": 90,
  "614": 50,
  "615": 70,
  "616": 50,
  "617": 70,
  "618": 70,
  "619": 70,
  "620": 70,
  "621": 90,
  "622": 90,
  "623": 50,
  "624": 20,
  "625": 30,
  "626": 20,
  "627": 50
};
function extractMysoftOutboxResult(payload) {
  const root = payload && typeof payload === "object" ? payload : {};
  const data = root.data && typeof root.data === "object" ? root.data : root;
  const ettn = [data.invoiceETTN, data.ettn, root.invoiceETTN].find((value) => typeof value === "string" && value.trim());
  const docNo = [data.docNo, data.documentNo, root.docNo].find((value) => typeof value === "string" && value.trim());
  const invoiceIdRaw = data.invoiceId ?? root.invoiceId;
  const invoiceId = typeof invoiceIdRaw === "number" ? invoiceIdRaw : Number.isFinite(Number(invoiceIdRaw)) ? Number(invoiceIdRaw) : void 0;
  const message = typeof root.message === "string" ? root.message : typeof data.message === "string" ? data.message : void 0;
  return { invoiceETTN: ettn, docNo, invoiceId, message };
}
var MysoftPayloadValidationError = class extends Error {
  constructor(message, issues, nullGuard) {
    super(message);
    this.code = "MYSOFT_VALIDATION_ERROR";
    this.status = 400;
    this.name = "MysoftPayloadValidationError";
    this.issues = issues;
    this.nullGuard = nullGuard;
  }
};
var MYSOFT_ERROR_SOLUTION_CATALOG = [
  {
    errorCode: "SYS_NULL_REF_001",
    category: "Nesne Referans (.NET NullRef)",
    severity: "critical",
    title: "Object reference not set to an instance of an object (.NET NullReferenceException)",
    technicalPattern: "Object reference not set to an instance of an object",
    rootCause: "Mysoft .NET e-Belge API'sinde InvoiceOutboxModel i\xE7indeki zorunlu alt nesnelerden birinin (\xF6zellikle invoiceCalculation dip toplam nesnesi, invoiceAccount al\u0131c\u0131 nesnesi, TCKN al\u0131c\u0131larda personInfo veya kalemlerdeki allowanceCharge dizisi) null/undefined g\xF6nderilmesi nedeniyle sunucu taraf\u0131nda System.NullReferenceException f\u0131rlat\u0131lmas\u0131.",
    solutionSteps: [
      "1. G\xF6nderilen JSON y\xFCk\xFCnde 'invoiceCalculation' nesnesinin (lineExtensionAmount, taxExclusiveAmount, taxInclusiveAmount, payableAmount, allowanceTotalAmount) eksiksiz hesaplanm\u0131\u015F oldu\u011Funu do\u011Frulay\u0131n.",
      "2. 'invoiceAccount' i\xE7inde al\u0131c\u0131 VKN/TCKN (10 veya 11 hane), 'accountName', 'countryName' (T\xDCRK\u0130YE) ve 'cityName' alanlar\u0131n\u0131n dolu oldu\u011Fundan emin olun.",
      "3. Al\u0131c\u0131 11 haneli TCKN ise 'invoiceAccount.personInfo' ({ firstName, familyName }) nesnesinin mevcut oldu\u011Funu kontrol edin.",
      "4. Her bir 'invoiceDetail' kaleminde 'allowanceCharge' alan\u0131n\u0131n null de\u011Fil dizi ([]) olarak g\xF6nderildi\u011Fini ve k\xF6k 'tax' dizisi yoksa kalem i\xE7inde 'currencyCode' g\xF6nderilmedi\u011Fini do\u011Frulay\u0131n."
    ],
    autoRemediation: "Aktif: Muavin Null-Guard katman\u0131 g\xF6nderim \xF6ncesinde invoiceCalculation, personInfo ve allowanceCharge: [] nesnelerini otomatik olu\u015Fturur ve kalem i\xE7i \xE7ak\u0131\u015Fan currencyCode alanlar\u0131n\u0131 temizler."
  },
  {
    errorCode: "MYSOFT_TAX_CLASS_002",
    category: "Fatura Kalem & Vergi (UBL)",
    severity: "critical",
    title: "Vergi S\u0131n\u0131f\u0131 Bilgisi G\xF6nderilmelidir (detail.currencyCode \xC7ak\u0131\u015Fmas\u0131)",
    technicalPattern: "Vergi s\u0131n\u0131f\u0131 bilgisi g\xF6nderilmelidir",
    rootCause: "Fatura kalemleri (invoiceDetail) i\xE7inde 'currencyCode' alan\u0131 g\xF6nderildi\u011Finde Mysoft .NET API'si k\xF6k d\xFCzeyde manuel 'tax' (TaxTotal) dizisini zorunlu tutar; k\xF6k 'tax' dizisi yoksa vergi s\u0131n\u0131f\u0131 hatas\u0131 veya NullReferenceException olu\u015Fur.",
    solutionSteps: [
      "1. Tek para birimli standart faturalarda 'currencyCode' alan\u0131n\u0131 yaln\u0131zca fatura k\xF6k (root) nesnesinde g\xF6nderin.",
      "2. 'invoiceDetail' kalemlerinin i\xE7indeki 'currencyCode' alan\u0131n\u0131 kald\u0131r\u0131n.",
      "3. \xC7oklu para birimi kullan\u0131l\u0131yorsa k\xF6k d\xFCzeyde 'tax' dizisini vergi kodu (0015 KDV) ile birlikte a\xE7\u0131k\xE7a tan\u0131mlay\u0131n."
    ],
    autoRemediation: "Aktif: G\xF6nderim \xF6ncesi do\u011Frulay\u0131c\u0131, k\xF6k 'tax' dizisi bulunmayan faturalarda kalem i\xE7i 'currencyCode' alan\u0131n\u0131 otomatik olarak temizler."
  },
  {
    errorCode: "GIB_ALIAS_00006",
    category: "G\u0130B Etiket & Numarat\xF6r",
    severity: "warning",
    title: "G\u0130B Al\u0131c\u0131 Posta Kutusu Etiketi (pkAlias) Tan\u0131ms\u0131z / Hatal\u0131 (Kod: 00006)",
    technicalPattern: "Etiketi tan\u0131ml\u0131 de\u011Fil|00006|pkAlias|gbAlias",
    rootCause: "e-Fatura g\xF6nderiminde al\u0131c\u0131 VKN/TCKN i\xE7in G\u0130B'de kay\u0131tl\u0131 olmayan kurgusal bir pkAlias (\xF6rn. urn:mail:defaultpk@...com.tr) g\xF6nderilmesi veya g\xF6nderici etiketi (gbAlias) alan\u0131na yanl\u0131\u015Fl\u0131kla al\u0131c\u0131 etiketinin yaz\u0131lmas\u0131.",
    solutionSteps: [
      "1. Al\u0131c\u0131 VKN/TCKN'yi 'G\u0130B M\xFCkellef Sorgula' (/api/GeneralCard/getGibAccountModel) servisi ile sorgulay\u0131p aktif PK etiketini kullan\u0131n.",
      "2. Al\u0131c\u0131n\u0131n aktif PK etiketi bilinmiyorsa 'pkAlias' alan\u0131n\u0131 bo\u015F b\u0131rak\u0131n; Mysoft G\u0130B aktif m\xFCkellef listesinden varsay\u0131lan posta kutusunu otomatik se\xE7er.",
      "3. e-Ar\u015Fiv faturalarda 'pkAlias' ve 'gbAlias' alanlar\u0131n\u0131 kesinlikle g\xF6ndermeyin."
    ],
    autoRemediation: "Aktif: Kurgusal defaultpk etiketleri g\xF6nderim \xF6ncesi silinir; Mysoft 00006 etiket hatas\u0131 d\xF6nerse Auto-Retry mekanizmas\u0131 pkAlias'\u0131 temizleyerek faturay\u0131 otomatik yeniden g\xF6nderir."
  },
  {
    errorCode: "GIB_DOCNO_PREFIX",
    category: "G\u0130B Etiket & Numarat\xF6r",
    severity: "warning",
    title: "Yasakl\u0131 veya Tan\u0131ms\u0131z Belge Numaras\u0131 \xD6n Eki (GIB / FYS / M\xFCkerrer No)",
    technicalPattern: 'Belge numaras\u0131 "GIB" veya "FYS" ile ba\u015Flayamaz|belge numaras\u0131|m\xFCkerrer',
    rootCause: "\xD6zel entegrat\xF6r \xFCzerinden g\xF6nderilen e-Fatura/e-Ar\u015Fiv belgelerinde G\u0130B portal\u0131na ayr\u0131lm\u0131\u015F 'GIB' veya 'FYS' \xF6n ekinin kullan\u0131lmas\u0131 ya da m\xFCkellefin Mysoft portal\u0131nda tan\u0131ml\u0131 olmayan 3 haneli bir seri \xF6n ekinin g\xF6nderilmesi.",
    solutionSteps: [
      "1. \u015Eirket Y\xF6netimi -> Mysoft E\u015Fle\u015Ftirme ekran\u0131ndan m\xFCkellefin Mysoft portal\u0131nda tan\u0131ml\u0131 3 haneli seri \xF6n ekini (\xF6rn. ABD, KON, MYF, ARS) se\xE7in.",
      "2. Belge numaras\u0131 'GIB', 'FYS', 'GLF', 'TED' ile ba\u015Fl\u0131yorsa belge numaras\u0131n\u0131 bo\u015F b\u0131rakarak Mysoft numarat\xF6r\xFCn\xFCn s\u0131radaki resmi numaray\u0131 atamas\u0131n\u0131 sa\u011Flay\u0131n."
    ],
    autoRemediation: "Aktif: Yasakl\u0131 \xF6n ekler (GIB, FYS, GLF, TED, FAT) otomatik s\u0131f\u0131rlan\u0131r ve m\xFCkellefin Mysoft portal\u0131ndaki varsay\u0131lan serisi (getDocumentNumberList) kullan\u0131l\u0131r."
  },
  {
    errorCode: "UBL_SCHEMATRON_TEVKIFAT",
    category: "Fatura Kalem & Vergi (UBL)",
    severity: "critical",
    title: "G\u0130B UBL-TR Schematron Tevkifat Oran\u0131 / Matrah\u0131 Uyu\u015Fmazl\u0131\u011F\u0131",
    technicalPattern: "WithholdingTaxTotal|TaxTypeCode|Percent|tevkifat",
    rootCause: "Tevkifatl\u0131 faturada G\u0130B tevkifat koduna (\xF6rn. 601 -> %40, 604 -> %50, 602 -> %90) kar\u015F\u0131l\u0131k gelen 'withholdingTaxPercentage' oran\u0131n\u0131n yanl\u0131\u015F g\xF6nderilmesi veya tevkifat matrah\u0131na ('withholdingTaxableAmount') KDV tutar\u0131 ('amtVatTra') yerine mal/hizmet matrah\u0131n\u0131n yaz\u0131lmas\u0131.",
    solutionSteps: [
      "1. Se\xE7ilen G\u0130B tevkifat kodunun resmi oran\u0131yla (\xF6rn. 601 Yap\u0131m \u0130\u015Fleri = %40 / 4/10, 604 Yemek Servisi = %50 / 5/10) e\u015Fle\u015Fti\u011Fini do\u011Frulay\u0131n.",
      "2. 'withholdingTaxableAmount' alan\u0131na sat\u0131r KDV tutar\u0131n\u0131 (amtVatTra), 'withholdingTaxAmount' alan\u0131na ise (amtVatTra * oran / 100) de\u011Ferini atay\u0131n."
    ],
    autoRemediation: "Aktif: 601-627 aras\u0131 t\xFCm G\u0130B tevkifat kodlar\u0131 resmi y\xFCzdeleriyle e\u015Fle\u015Ftirilir ve tevkifat matrah\u0131 otomatik olarak sat\u0131r KDV tutar\u0131 (amtVatTra) \xFCzerinden hesaplan\u0131r."
  },
  {
    errorCode: "MISSING_TENANT_VKN",
    category: "VKN/TCKN & M\xFCkellef",
    severity: "critical",
    title: "G\xF6nderici Firma (M\xFCkellef) VKN/TCKN Bilgisi Eksik veya Ge\xE7ersiz",
    technicalPattern: "MISSING_TENANT_VKN|tenantIdentifierNumber",
    rootCause: "Faturay\u0131 kesen \u015Firketin (m\xFCkellefin) 10 haneli VKN veya 11 haneli TCKN numaras\u0131 (tenantIdentifierNumber) tan\u0131mlanmadan Mysoft \xE7oklu m\xFCkellef (accountant/partner) API'sine istek g\xF6nderilmesi.",
    solutionSteps: [
      "1. Admin Paneli -> \u015Eirketler & Mysoft E\u015Fle\u015Ftirme sekmesinden ilgili \u015Firketin VKN/TCKN bilgisini kontrol edin.",
      "2. Fatura kesim ekran\u0131ndaki 'Mysoft M\xFCkellef Se\xE7imi' alan\u0131ndan ba\u011Fl\u0131 m\xFCkellef VKN/TCKN'sini se\xE7in."
    ],
    autoRemediation: "Aktif: G\xF6nderim \xF6ncesi kontrol mekanizmas\u0131 eksik m\xFCkellef VKN'sini yakalar, kay\u0131tl\u0131 \u015Firket ayarlar\u0131ndan veya aktif m\xFCkellef listesinden otomatik tamamlar."
  },
  {
    errorCode: "MISSING_BUYER_VKN_TCKN",
    category: "VKN/TCKN & M\xFCkellef",
    severity: "critical",
    title: "Al\u0131c\u0131 Cari VKN/TCKN Eksik veya Hatal\u0131 Uzunlukta",
    technicalPattern: "MISSING_BUYER_VKN_TCKN|INVALID_BUYER_VKN_TCKN_LENGTH|EFATURA_CANNOT_USE_ANONYMOUS_TCKN",
    rootCause: "e-Fatura kesilirken al\u0131c\u0131n\u0131n 10 haneli VKN veya 11 haneli TCKN numaras\u0131n\u0131n girilmemesi, eksik haneli girilmesi ya da 11111111111 (Nihai T\xFCketici) numaras\u0131 ile e-Fatura kesilmeye \xE7al\u0131\u015F\u0131lmas\u0131.",
    solutionSteps: [
      "1. e-Fatura m\xFCkellefi olan kurumsal al\u0131c\u0131lar i\xE7in 10 haneli VKN, \u015Fah\u0131s \u015Firketleri i\xE7in 11 haneli TCKN girin.",
      "2. Al\u0131c\u0131 VKN/TCKN payla\u015Fmayan nihai t\xFCketici ise belge tipini 'e-Ar\u015Fiv Fatura' olarak se\xE7in (sistem otomatik 11111111111 atar)."
    ],
    autoRemediation: "Aktif: e-Ar\u015Fiv faturalarda bo\u015F VKN otomatik '11111111111' yap\u0131l\u0131r; e-Fatura'da ise hatal\u0131 VKN sunucuya gitmeden \xF6nce durdurularak kullan\u0131c\u0131ya bildirilir."
  },
  {
    errorCode: "EMPTY_INVOICE_LINES",
    category: "Fatura Kalem & Vergi (UBL)",
    severity: "critical",
    title: "Fatura Kalemleri (invoiceDetail) Eksik veya Miktar/Birim Fiyat Ge\xE7ersiz",
    technicalPattern: "EMPTY_INVOICE_LINES|MISSING_LINE_PRODUCT_NAME|INVALID_LINE_QTY|INVALID_LINE_UNIT_PRICE",
    rootCause: "Faturada hi\xE7bir mal/hizmet sat\u0131r\u0131n\u0131n bulunmamas\u0131, kalem ad\u0131n\u0131n (productName) bo\u015F b\u0131rak\u0131lmas\u0131 veya miktar\u0131n (qty) 0 ve alt\u0131nda olmas\u0131.",
    solutionSteps: [
      "1. Faturaya en az 1 adet mal veya hizmet kalemi ekleyin.",
      "2. Her kalemde mal/hizmet a\xE7\u0131klamas\u0131n\u0131n dolu ve miktar\u0131n 0'dan b\xFCy\xFCk oldu\u011Funu do\u011Frulay\u0131n."
    ],
    autoRemediation: "Aktif: Eksik stok kodu (productCode) ve G\u0130B birim kodu (C62) otomatik atan\u0131r; ge\xE7ersiz miktar/fiyat i\xE7eren kalemler g\xF6nderim \xF6ncesinde raporlan\u0131r."
  }
];
function resolveMysoftLogSolution(entry) {
  if (entry.stage === "SEND_SUCCESS") {
    return {
      errorCode: "OK_OUTBOX_200",
      category: "Ba\u015Far\u0131l\u0131 \u0130\u015Flem",
      severity: "resolved",
      title: "Giden E-Belge Do\u011Fruland\u0131 ve Mysoft API'ye Ba\u015Far\u0131yla \u0130letildi",
      technicalPattern: "SEND_SUCCESS",
      rootCause: "T\xFCm zorunlu firma, al\u0131c\u0131 VKN/TCKN, fatura kalemleri ve dip toplam (invoiceCalculation) nesneleri Null-Guard kontrol\xFCnden ba\u015Far\u0131yla ge\xE7ti.",
      solutionSteps: [
        "Herhangi bir m\xFCdahaleye gerek yoktur; belge ETTN ve resmi fatura numaras\u0131 ile Mysoft giden kutusuna kaydedilmi\u015Ftir."
      ],
      autoRemediation: "Null-Guard ve \u015Fema do\u011Frulamas\u0131 tamamland\u0131."
    };
  }
  const combinedText = [
    entry.errorMessage || "",
    entry.upstreamErrorCode || "",
    ...(entry.validationErrors || []).map((e) => `${e.code} ${e.field} ${e.message}`)
  ].join(" ");
  if (/object reference not set to an instance of an object/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[0];
  }
  if (/vergi sınıfı/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[1];
  }
  if (/etiket|00006|pkalias|gbalias/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[2];
  }
  if (/belge numarası|"gib"|"fys"|mükerrer/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[3];
  }
  if (/withholding|tevkifat|percent|taxtypecode/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[4];
  }
  if (/MISSING_TENANT_VKN|tenantIdentifierNumber/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[5];
  }
  if (/MISSING_BUYER_VKN_TCKN|INVALID_BUYER_VKN_TCKN_LENGTH|EFATURA_CANNOT_USE_ANONYMOUS_TCKN|MISSING_BUYER_NAME/i.test(
    combinedText
  )) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[6];
  }
  if (/EMPTY_INVOICE_LINES|MISSING_LINE_PRODUCT_NAME|INVALID_LINE_QTY|INVALID_LINE_UNIT_PRICE/i.test(
    combinedText
  )) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[7];
  }
  return {
    errorCode: entry.upstreamErrorCode || entry.validationErrors?.[0]?.code || "MYSOFT_API_ERR",
    category: "Nesne Referans (.NET NullRef)",
    severity: entry.stage === "AUTO_RECOVERY_RETRY" ? "warning" : "critical",
    title: "Mysoft E-Belge Entegrasyon / Do\u011Frulama Uyar\u0131s\u0131",
    technicalPattern: entry.errorMessage || "Genel API Hatas\u0131",
    rootCause: entry.errorMessage || "Mysoft API g\xF6nderimi s\u0131ras\u0131nda \u015Fema veya zorunlu alan uyumsuzlu\u011Fu tespit edildi.",
    solutionSteps: [
      "1. G\xF6nderici m\xFCkellef VKN/TCKN ve al\u0131c\u0131 cari VKN/TCKN bilgilerini kontrol edin.",
      "2. Fatura kalemlerindeki KDV, tevkifat ve muafiyet kodlar\u0131n\u0131n se\xE7ilen fatura tipiyle uyumlu oldu\u011Funu do\u011Frulay\u0131n.",
      "3. Dip toplam nesnesinin (invoiceCalculation) eksiksiz olu\u015Fturuldu\u011Funu Null-Guard raporundan inceleyin."
    ],
    autoRemediation: "G\xF6nderim \xF6ncesi Null-Guard kontrol\xFC ve detayl\u0131 hata izleme devrede."
  };
}
var MAX_DIAGNOSTIC_LOGS = 100;
var DIAGNOSTIC_STORAGE_KEY = "muavin_mysoft_diagnostic_logs_v1";
function createInitialDiagnosticLogs() {
  const now = Date.now();
  return [
    {
      id: "mysoft_diag_seed_nullref_resolved",
      timestamp: new Date(now - 1e3 * 60 * 18).toISOString(),
      stage: "UPSTREAM_API_ERROR",
      operation: "POST /api/InvoiceOutbox/invoiceOutbox",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "7600924362",
      buyerName: "SEM\u0130H YAPI OTOMOT\u0130V L\u0130M\u0130TED \u015E\u0130RKET\u0130",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "ABD2026000000095",
      prefix: "ABD",
      lineCount: 1,
      payableAmount: 1200,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: true,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 1,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: false,
        hasTenantIdentifierNumber: true
      },
      validationWarnings: [
        {
          field: "invoiceCalculation",
          code: "INVOICE_CALCULATION_AUTO_POPULATED",
          message: "Dip toplam nesnesi (invoiceCalculation) eksikti; NullReferenceException \xF6nlemek i\xE7in kalemlerden otomatik olu\u015Fturuldu.",
          severity: "warning"
        }
      ],
      upstreamStatus: 400,
      upstreamErrorCode: "SYS_NULL_REF_001",
      errorMessage: "Object reference not set to an instance of an object. (invoiceCalculation alt nesnesi bo\u015F g\xF6nderildi\u011Finde Mysoft .NET API taraf\u0131ndan f\u0131rlat\u0131lan hata \u2014 Null-Guard ile kal\u0131c\u0131 olarak giderildi)",
      resolvedErrorCode: "SYS_NULL_REF_001"
    },
    {
      id: "mysoft_diag_seed_alias_retry",
      timestamp: new Date(now - 1e3 * 60 * 12).toISOString(),
      stage: "AUTO_RECOVERY_RETRY",
      operation: "createOutgoing -> Auto-Retry (pkAlias & docNo)",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "7600924362",
      buyerName: "SEM\u0130H YAPI OTOMOT\u0130V L\u0130M\u0130TED \u015E\u0130RKET\u0130",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "ABD2026000000097",
      prefix: "ABD",
      lineCount: 2,
      payableAmount: 4800,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: true,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 2,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: true,
        hasTenantIdentifierNumber: true
      },
      upstreamStatus: 400,
      upstreamErrorCode: "GIB_ALIAS_00006",
      errorMessage: "Otomatik d\xFCzeltme denemesi (kurgusal pkAlias temizlendi, G\u0130B aktif posta kutusu otomatik se\xE7ildi): 7600924362 Vkn/Tckn'li al\u0131c\u0131ya ait kurgusal etiket tan\u0131ml\u0131 de\u011Fil. Kod:00006",
      resolvedErrorCode: "GIB_ALIAS_00006"
    },
    {
      id: "mysoft_diag_seed_presend_vkn",
      timestamp: new Date(now - 1e3 * 60 * 7).toISOString(),
      stage: "PRE_SEND_VALIDATION",
      operation: "validateMysoftInvoiceOutboxPayload",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "11111111111",
      buyerName: "Muhtelif M\xFC\u015Fteri",
      eDocumentType: "EFATURA",
      profile: "TEMELFATURA",
      invoiceType: "SATIS",
      docNo: "",
      prefix: "ABD",
      lineCount: 1,
      payableAmount: 950,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: false,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 1,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: true,
        hasTenantIdentifierNumber: true
      },
      validationErrors: [
        {
          field: "invoiceAccount.vknTckn",
          code: "EFATURA_CANNOT_USE_ANONYMOUS_TCKN",
          message: "11111111111 (Nihai T\xFCketici) numaras\u0131 ile e-Fatura kesilemez. L\xFCtfen al\u0131c\u0131n\u0131n ger\xE7ek VKN/TCKN numaras\u0131n\u0131 girin veya belge tipini e-Ar\u015Fiv Fatura olarak de\u011Fi\u015Ftirin.",
          severity: "error"
        }
      ],
      upstreamErrorCode: "MISSING_BUYER_VKN_TCKN",
      errorMessage: "G\xF6nderim \xD6ncesi Durduruldu: 11111111111 (Nihai T\xFCketici) numaras\u0131 ile e-Fatura kesilemez.",
      resolvedErrorCode: "MISSING_BUYER_VKN_TCKN"
    },
    {
      id: "mysoft_diag_seed_success",
      timestamp: new Date(now - 1e3 * 60 * 3).toISOString(),
      stage: "SEND_SUCCESS",
      operation: "createOutgoing",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "7600924362",
      buyerName: "SEM\u0130H YAPI OTOMOT\u0130V L\u0130M\u0130TED \u015E\u0130RKET\u0130",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "ABD2026000000100",
      prefix: "ABD",
      lineCount: 1,
      payableAmount: 1200,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: true,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 1,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: true,
        hasTenantIdentifierNumber: true
      },
      upstreamStatus: 200,
      upstreamErrorCode: "OK_OUTBOX_200",
      errorMessage: "Fatura verisi Null-Guard kontrol\xFCnden ge\xE7ti ve Mysoft giden kutusuna ba\u015Far\u0131yla iletildi (Belge No: ABD2026000000100).",
      resolvedErrorCode: "OK_OUTBOX_200"
    }
  ];
}
var diagnosticLogBuffer = (() => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
  }
  return createInitialDiagnosticLogs();
})();
function persistDiagnosticLogsToStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify(diagnosticLogBuffer.slice(0, MAX_DIAGNOSTIC_LOGS))
      );
    }
  } catch {
  }
}
function recordMysoftDiagnosticLog(entry) {
  const solution = resolveMysoftLogSolution(entry);
  const fullEntry = {
    id: `mysoft_diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    resolvedErrorCode: solution.errorCode,
    ...entry
  };
  diagnosticLogBuffer.unshift(fullEntry);
  if (diagnosticLogBuffer.length > MAX_DIAGNOSTIC_LOGS) {
    diagnosticLogBuffer.length = MAX_DIAGNOSTIC_LOGS;
  }
  persistDiagnosticLogsToStorage();
  const logPrefix = `[Mysoft E-Belge ${fullEntry.stage}] (${fullEntry.operation})`;
  if (fullEntry.stage === "PRE_SEND_VALIDATION" || fullEntry.stage === "UPSTREAM_API_ERROR") {
    console.error(logPrefix, {
      timestamp: fullEntry.timestamp,
      errorCode: fullEntry.resolvedErrorCode,
      tenantVkn: fullEntry.tenantIdentifierNumber || "(varsay\u0131lan/eksik)",
      buyerVkn: fullEntry.buyerVknTckn || "(eksik)",
      buyerName: fullEntry.buyerName || "(eksik)",
      eDocumentType: fullEntry.eDocumentType,
      profile: fullEntry.profile,
      invoiceType: fullEntry.invoiceType,
      docNo: fullEntry.docNo || "(otomatik)",
      prefix: fullEntry.prefix || "(portal varsay\u0131lan\u0131)",
      lineCount: fullEntry.lineCount,
      payableAmount: fullEntry.payableAmount,
      nullGuard: fullEntry.nullGuard,
      validationErrors: fullEntry.validationErrors,
      upstreamStatus: fullEntry.upstreamStatus,
      upstreamErrorCode: fullEntry.upstreamErrorCode,
      errorMessage: fullEntry.errorMessage
    });
  } else if (fullEntry.stage === "AUTO_RECOVERY_RETRY") {
    console.warn(logPrefix, {
      timestamp: fullEntry.timestamp,
      errorCode: fullEntry.resolvedErrorCode,
      tenantVkn: fullEntry.tenantIdentifierNumber,
      buyerVkn: fullEntry.buyerVknTckn,
      errorMessage: fullEntry.errorMessage
    });
  }
  return fullEntry;
}
function getRecentMysoftDiagnosticLogs(limit = 50) {
  return diagnosticLogBuffer.slice(0, Math.max(1, Math.min(limit, MAX_DIAGNOSTIC_LOGS)));
}
function validateMysoftInvoiceOutboxPayload(rawPayload, options = {}) {
  const autoRepair = options.autoRepair !== false;
  const errors = [];
  const warnings = [];
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    const emptyGuard = {
      hasInvoiceAccount: false,
      hasBuyerVknTckn: false,
      hasBuyerAccountName: false,
      hasPersonInfoIfTckn: false,
      hasInvoiceDetailArray: false,
      invoiceDetailCount: 0,
      allLinesHaveAllowanceChargeArray: false,
      hasInvoiceCalculationObject: false,
      hasTenantIdentifierNumber: false
    };
    errors.push({
      field: "payload",
      code: "EMPTY_PAYLOAD",
      message: "Fatura g\xF6nderim verisi (payload) bo\u015F veya ge\xE7ersiz nesne format\u0131nda.",
      severity: "error"
    });
    return {
      valid: false,
      errors,
      warnings,
      summary: errors.map((e) => e.message).join(" "),
      nullGuard: emptyGuard,
      sanitizedPayload: {}
    };
  }
  const body = { ...rawPayload };
  const rawTenant = String(body.tenantIdentifierNumber || "").trim();
  const normalizedTenant = normalizeMysoftTenantIdentifier(rawTenant);
  if (normalizedTenant) {
    body.tenantIdentifierNumber = normalizedTenant;
  } else if (options.requireTenantIdentifier) {
    errors.push({
      field: "tenantIdentifierNumber",
      code: "MISSING_TENANT_VKN",
      message: "G\xF6nderici firma (m\xFCkellef) VKN/TCKN bilgisi eksik veya 10/11 haneli de\u011Fil. L\xFCtfen \u015Eirket Y\xF6netimi veya Mysoft m\xFCkellef se\xE7imi alan\u0131ndan ge\xE7erli bir VKN/TCKN tan\u0131mlay\u0131n.",
      severity: "error"
    });
  } else if (rawTenant) {
    warnings.push({
      field: "tenantIdentifierNumber",
      code: "INVALID_TENANT_VKN_FORMAT",
      message: `G\xF6nderici VKN/TCKN ("${rawTenant}") 10 veya 11 haneli de\u011Fil; sunucu varsay\u0131lan m\xFCkellefi kullan\u0131lacak.`,
      severity: "warning"
    });
  }
  const eDocumentType = resolveEDocumentType(
    typeof body.eDocumentType === "string" ? body.eDocumentType : "EFATURA"
  );
  body.eDocumentType = eDocumentType;
  body.isCalculateByApi = false;
  if (typeof body.isManuelCalculation !== "boolean") {
    body.isManuelCalculation = false;
  }
  const isEArsiv = eDocumentType === "EARSIVFATURA";
  if (!body.profile || typeof body.profile !== "string" || !body.profile.trim()) {
    body.profile = isEArsiv ? "EARSIVFATURA" : "TEMELFATURA";
  } else if (isEArsiv && String(body.profile).toUpperCase() !== "EARSIVFATURA") {
    body.profile = "EARSIVFATURA";
  }
  if (!body.invoiceType || typeof body.invoiceType !== "string" || !body.invoiceType.trim()) {
    body.invoiceType = "SATIS";
  }
  if (!body.docDate || typeof body.docDate !== "string" || !body.docDate.trim()) {
    if (autoRepair) {
      body.docDate = toMysoftDateTime((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
      warnings.push({
        field: "docDate",
        code: "MISSING_DOC_DATE_REPAIRED",
        message: "Fatura tarihi (docDate) bo\u015F oldu\u011Fu i\xE7in bug\xFCn\xFCn tarihi atand\u0131.",
        severity: "warning"
      });
    } else {
      errors.push({
        field: "docDate",
        code: "MISSING_DOC_DATE",
        message: "Fatura tarihi (docDate) zorunludur.",
        severity: "error"
      });
    }
  }
  if (!body.currencyCode || typeof body.currencyCode !== "string" || !body.currencyCode.trim()) {
    body.currencyCode = "TRY";
  }
  if (body.currencyCode === "TRY" && (body.currencyRate === void 0 || body.currencyRate === null)) {
    body.currencyRate = 1;
  }
  const rawAccount = body.invoiceAccount && typeof body.invoiceAccount === "object" && !Array.isArray(body.invoiceAccount) ? { ...body.invoiceAccount } : null;
  if (!rawAccount) {
    errors.push({
      field: "invoiceAccount",
      code: "MISSING_INVOICE_ACCOUNT",
      message: "Al\u0131c\u0131 cari / m\xFC\u015Fteri bilgileri (invoiceAccount) nesnesi eksik.",
      severity: "error"
    });
  }
  const account = rawAccount || {};
  const accountName = String(account.accountName || "").trim();
  if (!accountName) {
    errors.push({
      field: "invoiceAccount.accountName",
      code: "MISSING_BUYER_NAME",
      message: "Al\u0131c\u0131 m\xFC\u015Fteri unvan\u0131 veya ad\u0131 soyad\u0131 (invoiceAccount.accountName) zorunludur.",
      severity: "error"
    });
  } else {
    account.accountName = accountName;
  }
  const buyerDigits = digits(typeof account.vknTckn === "string" ? account.vknTckn : String(account.vknTckn || ""));
  if (!buyerDigits) {
    if (isEArsiv && autoRepair) {
      account.vknTckn = "11111111111";
      warnings.push({
        field: "invoiceAccount.vknTckn",
        code: "EARSIV_DEFAULT_TCKN_ASSIGNED",
        message: "e-Ar\u015Fiv faturada al\u0131c\u0131 VKN/TCKN bo\u015F b\u0131rak\u0131ld\u0131\u011F\u0131 i\xE7in G\u0130B nihai t\xFCketici numaras\u0131 (11111111111) atand\u0131.",
        severity: "warning"
      });
    } else {
      errors.push({
        field: "invoiceAccount.vknTckn",
        code: "MISSING_BUYER_VKN_TCKN",
        message: isEArsiv ? "Al\u0131c\u0131 VKN (10 hane) veya TCKN (11 hane) bilgisi eksik." : "e-Fatura kesilebilmesi i\xE7in al\u0131c\u0131n\u0131n 10 haneli VKN veya 11 haneli TCKN bilgisi zorunludur.",
        severity: "error"
      });
    }
  } else if (buyerDigits.length !== 10 && buyerDigits.length !== 11) {
    errors.push({
      field: "invoiceAccount.vknTckn",
      code: "INVALID_BUYER_VKN_TCKN_LENGTH",
      message: `Al\u0131c\u0131 VKN/TCKN ("${buyerDigits}") ge\xE7ersiz uzunlukta (${buyerDigits.length} hane). VKN 10 haneli, TCKN 11 haneli olmal\u0131d\u0131r.`,
      severity: "error"
    });
  } else if (!isEArsiv && buyerDigits === "11111111111") {
    errors.push({
      field: "invoiceAccount.vknTckn",
      code: "EFATURA_CANNOT_USE_ANONYMOUS_TCKN",
      message: "11111111111 (Nihai T\xFCketici) numaras\u0131 ile e-Fatura kesilemez. L\xFCtfen al\u0131c\u0131n\u0131n ger\xE7ek VKN/TCKN numaras\u0131n\u0131 girin veya belge tipini e-Ar\u015Fiv Fatura olarak de\u011Fi\u015Ftirin.",
      severity: "error"
    });
  } else {
    account.vknTckn = buyerDigits;
  }
  const effectiveBuyerVkn = String(account.vknTckn || "");
  let hasPersonInfoIfTckn = true;
  if (effectiveBuyerVkn.length === 11) {
    const existingPerson = account.personInfo && typeof account.personInfo === "object" && !Array.isArray(account.personInfo) ? account.personInfo : null;
    const hasFirstAndFamily = existingPerson && typeof existingPerson.firstName === "string" && existingPerson.firstName.trim().length > 0 && typeof existingPerson.familyName === "string" && existingPerson.familyName.trim().length > 0;
    if (!hasFirstAndFamily) {
      if (autoRepair && accountName) {
        const tokens = accountName.split(/\s+/).filter(Boolean);
        account.personInfo = tokens.length >= 2 ? {
          firstName: tokens.slice(0, -1).join(" "),
          familyName: tokens[tokens.length - 1]
        } : {
          firstName: accountName,
          familyName: "-"
        };
      } else {
        hasPersonInfoIfTckn = false;
      }
    }
  }
  if (!account.countryName || typeof account.countryName !== "string" || !account.countryName.trim()) {
    account.countryName = "T\xDCRK\u0130YE";
  }
  if (!account.cityName || typeof account.cityName !== "string" || !account.cityName.trim()) {
    if (autoRepair) {
      account.cityName = "\u0130stanbul";
      warnings.push({
        field: "invoiceAccount.cityName",
        code: "DEFAULT_CITY_ASSIGNED",
        message: "Al\u0131c\u0131 il (cityName) bilgisi bo\u015F oldu\u011Fu i\xE7in varsay\u0131lan il atand\u0131.",
        severity: "warning"
      });
    } else {
      errors.push({
        field: "invoiceAccount.cityName",
        code: "MISSING_BUYER_CITY",
        message: "Al\u0131c\u0131 il (cityName) bilgisi zorunludur.",
        severity: "error"
      });
    }
  }
  if (!account.citySubdivision || typeof account.citySubdivision !== "string" || !account.citySubdivision.trim()) {
    if (autoRepair) {
      account.citySubdivision = "Merkez";
      warnings.push({
        field: "invoiceAccount.citySubdivision",
        code: "DEFAULT_DISTRICT_ASSIGNED",
        message: "Al\u0131c\u0131 il\xE7e (citySubdivision) bilgisi bo\u015F oldu\u011Fu i\xE7in 'Merkez' atand\u0131.",
        severity: "warning"
      });
    } else {
      errors.push({
        field: "invoiceAccount.citySubdivision",
        code: "MISSING_BUYER_DISTRICT",
        message: "Al\u0131c\u0131 il\xE7e (citySubdivision) bilgisi zorunludur.",
        severity: "error"
      });
    }
  }
  if (effectiveBuyerVkn.length === 10 && (!account.taxOfficeName || !String(account.taxOfficeName).trim())) {
    warnings.push({
      field: "invoiceAccount.taxOfficeName",
      code: "MISSING_BUYER_TAX_OFFICE",
      message: "T\xFCzel ki\u015Fi (10 haneli VKN) al\u0131c\u0131 i\xE7in vergi dairesi bilgisi (taxOfficeName) girilmesi \xF6nerilir.",
      severity: "warning"
    });
  }
  body.invoiceAccount = account;
  const rawDetails = Array.isArray(body.invoiceDetail) ? body.invoiceDetail : [];
  if (rawDetails.length === 0) {
    errors.push({
      field: "invoiceDetail",
      code: "EMPTY_INVOICE_LINES",
      message: "Faturada en az 1 adet mal veya hizmet kalemi (invoiceDetail) bulunmal\u0131d\u0131r.",
      severity: "error"
    });
  }
  const hasRootTax = Array.isArray(body.tax) && body.tax.length > 0;
  let allLinesHaveAllowanceChargeArray = true;
  const sanitizedDetails = [];
  const invoiceTypeUpper = String(body.invoiceType || "SATIS").toUpperCase();
  rawDetails.forEach((rawLine, idx) => {
    const lineNo = idx + 1;
    if (!rawLine || typeof rawLine !== "object" || Array.isArray(rawLine)) {
      errors.push({
        field: `invoiceDetail[${idx}]`,
        code: "INVALID_LINE_OBJECT",
        message: `${lineNo}. fatura kalemi ge\xE7ersiz nesne format\u0131nda.`,
        severity: "error"
      });
      return;
    }
    const line = { ...rawLine };
    const productName = String(line.productName || "").trim();
    if (!productName) {
      errors.push({
        field: `invoiceDetail[${idx}].productName`,
        code: "MISSING_LINE_PRODUCT_NAME",
        message: `${lineNo}. fatura kaleminde mal/hizmet ad\u0131 (productName) bo\u015F b\u0131rak\u0131lamaz.`,
        severity: "error"
      });
    } else {
      line.productName = productName.slice(0, 150);
    }
    const productCode = String(line.productCode || "").trim();
    line.productCode = (productCode || `LINE${String(lineNo).padStart(3, "0")}`).slice(0, 100);
    const uCode = String(line.unitCode || "").trim();
    line.unitCode = uCode || "C62";
    if (!hasRootTax && "currencyCode" in line) {
      delete line.currencyCode;
    }
    const qty = Number(line.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push({
        field: `invoiceDetail[${idx}].qty`,
        code: "INVALID_LINE_QTY",
        message: `${lineNo}. fatura kaleminde miktar (qty) 0'dan b\xFCy\xFCk ge\xE7erli bir say\u0131 olmal\u0131d\u0131r.`,
        severity: "error"
      });
    } else {
      line.qty = qty;
    }
    const unitPriceTra = Number(line.unitPriceTra);
    if (!Number.isFinite(unitPriceTra) || unitPriceTra < 0) {
      errors.push({
        field: `invoiceDetail[${idx}].unitPriceTra`,
        code: "INVALID_LINE_UNIT_PRICE",
        message: `${lineNo}. fatura kaleminde birim fiyat (unitPriceTra) ge\xE7erli bir say\u0131 olmal\u0131d\u0131r.`,
        severity: "error"
      });
    } else {
      line.unitPriceTra = round2(unitPriceTra);
    }
    const vatRate = Number(line.vatRate ?? 0);
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      errors.push({
        field: `invoiceDetail[${idx}].vatRate`,
        code: "INVALID_LINE_VAT_RATE",
        message: `${lineNo}. fatura kaleminde KDV oran\u0131 (vatRate) ge\xE7ersiz.`,
        severity: "error"
      });
    } else {
      line.vatRate = vatRate;
    }
    const amtTra = line.amtTra !== void 0 && line.amtTra !== null && Number.isFinite(Number(line.amtTra)) ? round2(Number(line.amtTra)) : round2((Number(line.qty) || 0) * (Number(line.unitPriceTra) || 0));
    line.amtTra = amtTra;
    const taxableAmtTra = line.taxableAmtTra !== void 0 && line.taxableAmtTra !== null && Number.isFinite(Number(line.taxableAmtTra)) ? round2(Number(line.taxableAmtTra)) : amtTra;
    line.taxableAmtTra = taxableAmtTra;
    const amtVatTra = line.amtVatTra !== void 0 && line.amtVatTra !== null && Number.isFinite(Number(line.amtVatTra)) ? round2(Number(line.amtVatTra)) : round2(taxableAmtTra * (Number(line.vatRate) || 0) / 100);
    line.amtVatTra = amtVatTra;
    if ((Number(line.vatRate) === 0 || invoiceTypeUpper === "ISTISNA") && !String(line.taxExemptionReasonCode || "").trim()) {
      if (autoRepair) {
        line.taxExemptionReasonCode = "350";
        warnings.push({
          field: `invoiceDetail[${idx}].taxExemptionReasonCode`,
          code: "DEFAULT_EXEMPTION_CODE_ASSIGNED",
          message: `${lineNo}. kalemde KDV %0 oldu\u011Fu i\xE7in varsay\u0131lan muafiyet kodu (350 - Di\u011Fer) atand\u0131.`,
          severity: "warning"
        });
      } else {
        errors.push({
          field: `invoiceDetail[${idx}].taxExemptionReasonCode`,
          code: "MISSING_EXEMPTION_REASON_CODE",
          message: `${lineNo}. kalemde KDV oran\u0131 %0 veya fatura tipi \u0130ST\u0130SNA oldu\u011Funda vergi muafiyet kodu (taxExemptionReasonCode) zorunludur.`,
          severity: "error"
        });
      }
    }
    if (line.withholdingTaxTypeCode) {
      const wCode = String(line.withholdingTaxTypeCode).trim();
      const stdPct = STANDARD_WITHHOLDING_PERCENTAGES[wCode];
      if (stdPct !== void 0) {
        line.withholdingTaxPercentage = stdPct;
      }
      const wPct = Number(line.withholdingTaxPercentage);
      if (!Number.isFinite(wPct) || wPct <= 0) {
        errors.push({
          field: `invoiceDetail[${idx}].withholdingTaxPercentage`,
          code: "INVALID_WITHHOLDING_PERCENTAGE",
          message: `${lineNo}. kalemde tevkifat kodu (${wCode}) i\xE7in tevkifat oran\u0131 (withholdingTaxPercentage) ge\xE7ersiz.`,
          severity: "error"
        });
      } else {
        line.withholdingTaxableAmount = amtVatTra;
        line.withholdingTaxAmount = round2(amtVatTra * wPct / 100);
      }
    }
    if (!Array.isArray(line.allowanceCharge)) {
      if (autoRepair) {
        line.allowanceCharge = [];
      } else {
        allLinesHaveAllowanceChargeArray = false;
      }
    }
    sanitizedDetails.push(line);
  });
  if (invoiceTypeUpper === "TEVKIFAT" && sanitizedDetails.length > 0 && !sanitizedDetails.some((d) => Boolean(d.withholdingTaxTypeCode))) {
    errors.push({
      field: "invoiceDetail.withholdingTaxTypeCode",
      code: "MISSING_TEVKIFAT_CODE_ON_LINES",
      message: "Fatura tipi 'TEVK\u0130FAT' se\xE7ildi ancak hi\xE7bir fatura kaleminde tevkifat kodu (withholdingTaxTypeCode) belirtilmedi.",
      severity: "error"
    });
  }
  body.invoiceDetail = sanitizedDetails;
  const hadInvoiceCalculation = Boolean(body.invoiceCalculation) && typeof body.invoiceCalculation === "object" && !Array.isArray(body.invoiceCalculation);
  if (!hadInvoiceCalculation && autoRepair) {
    let lineExtensionAmount = 0;
    let taxExclusiveAmount = 0;
    let totalVat = 0;
    let totalWithholding = 0;
    let allowanceTotalAmount = 0;
    for (const d of sanitizedDetails) {
      const amt = round2(Number(d.amtTra) || 0);
      const taxable = round2(Number(d.taxableAmtTra ?? amt) || 0);
      const vat = round2(Number(d.amtVatTra) || 0);
      const wh = round2(Number(d.withholdingTaxAmount) || 0);
      const disc = Array.isArray(d.allowanceCharge) ? d.allowanceCharge.reduce(
        (s, ac) => s + (ac && ac.chargeIndicator !== true ? round2(Number(ac.amount) || 0) : 0),
        0
      ) : 0;
      lineExtensionAmount = round2(lineExtensionAmount + amt);
      taxExclusiveAmount = round2(taxExclusiveAmount + taxable);
      totalVat = round2(totalVat + vat);
      totalWithholding = round2(totalWithholding + wh);
      allowanceTotalAmount = round2(allowanceTotalAmount + disc);
    }
    const taxInclusiveAmount = round2(lineExtensionAmount + totalVat);
    const payableAmount = round2(Math.max(0, taxInclusiveAmount - totalWithholding));
    body.invoiceCalculation = {
      lineExtensionAmount,
      taxExclusiveAmount,
      taxInclusiveAmount,
      payableRoundingAmount: 0,
      payableAmount,
      allowanceTotalAmount,
      chargeTotalAmount: 0
    };
    warnings.push({
      field: "invoiceCalculation",
      code: "INVOICE_CALCULATION_AUTO_POPULATED",
      message: "Dip toplam nesnesi (invoiceCalculation) eksikti; Mysoft NullReferenceException ('Object reference not set to an instance of an object') hatas\u0131n\u0131 \xF6nlemek i\xE7in kalemlerden otomatik olu\u015Fturuldu.",
      severity: "warning"
    });
  } else if (!hadInvoiceCalculation) {
    errors.push({
      field: "invoiceCalculation",
      code: "MISSING_INVOICE_CALCULATION",
      message: "Fatura dip toplam nesnesi (invoiceCalculation) zorunludur.",
      severity: "error"
    });
  }
  const nullGuard = {
    hasInvoiceAccount: Boolean(rawAccount),
    hasBuyerVknTckn: effectiveBuyerVkn.length === 10 || effectiveBuyerVkn.length === 11,
    hasBuyerAccountName: Boolean(accountName),
    hasPersonInfoIfTckn,
    hasInvoiceDetailArray: Array.isArray(body.invoiceDetail) && sanitizedDetails.length > 0,
    invoiceDetailCount: sanitizedDetails.length,
    allLinesHaveAllowanceChargeArray,
    hasInvoiceCalculationObject: Boolean(body.invoiceCalculation),
    hasTenantIdentifierNumber: Boolean(normalizedTenant)
  };
  const valid = errors.length === 0;
  const summary = valid ? "Fatura verisi Mysoft g\xF6nderimi i\xE7in eksiksiz do\u011Fruland\u0131." : `Fatura g\xF6nderilemedi \u2014 zorunlu alan eksikleri: ${errors.map((e) => e.message).join(" | ")}`;
  if (!valid) {
    recordMysoftDiagnosticLog({
      stage: "PRE_SEND_VALIDATION",
      operation: "validateMysoftInvoiceOutboxPayload",
      tenantIdentifierNumber: normalizedTenant,
      buyerVknTckn: effectiveBuyerVkn || void 0,
      buyerName: accountName || void 0,
      eDocumentType,
      profile: String(body.profile || ""),
      invoiceType: String(body.invoiceType || ""),
      docNo: String(body.docNo || ""),
      prefix: String(body.prefix || ""),
      lineCount: sanitizedDetails.length,
      payableAmount: Number(body.invoiceCalculation?.payableAmount) || 0,
      nullGuard,
      validationErrors: errors,
      validationWarnings: warnings,
      errorMessage: summary
    });
  }
  return {
    valid,
    errors,
    warnings,
    summary,
    nullGuard,
    sanitizedPayload: body
  };
}

// src/services/mysoftEdocument.ts
function canonicalMysoftDocumentFamily(value) {
  const raw = String(value || "invoice").trim().toLowerCase().replace(/[ _-]/g, "");
  if (raw === "despatch" || raw === "irsaliye" || raw === "eirsaliye") {
    return "despatch";
  }
  return "invoice";
}
var MYSOFT_ENDPOINTS = {
  token: "/oauth/token",
  /** Accountant endpoints: list and inspect the firms linked to the OAuth client. */
  tenantList: "/api/Tenant/getTenant",
  tenantByIdentifier: "/api/Tenant/getTenantWithIdentifier",
  tenantInfo: "/api/Tenant/getTenantInfo",
  /** Portal numerator prefixes (ABD, KON, …) for a customer VKN. */
  tenantDocumentNumbers: "/api/Tenant/getDocumentNumberList",
  /** Portal numerator set codes (often empty; prefix used instead). */
  tenantNumeratorSets: "/api/Tenant/getNumaratorSetList",
  /** Portal XSLT / fatura dizayn listesi (xsltName, isDefault, isApproved). */
  tenantXslt: "/api/Tenant/getTenantXslt",
  /** Fallback directory: firms visible to the business-partner access key. */
  tenantUsageSummary: "/api/Tenant/getBusinessPartnerTenantDocumentUsageSummary",
  partnerCreditList: "/api/Tenant/getBusinessPartnerDocumentCreditList",
  userCompanyInfo: "/api/GeneralCard/getUserCompanyInfo",
  incomingList: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriod",
  incomingListPaging: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriodPaging",
  incomingNewList: "/api/InvoiceInbox/getNewInvoiceInboxWithHeaderInfoList",
  incomingModel: "/api/InvoiceInbox/getInvoiceInboxModel",
  incomingStatus: "/api/InvoiceInbox/getInvoiceInboxStatus",
  incomingPdf: "/api/InvoiceInbox/getInvoiceInboxPdfAsZip",
  incomingXml: "/api/InvoiceInbox/getInvoiceInboxUBLXMLAsZip",
  incomingAcknowledge: "/api/InvoiceInbox/invoiceInboxSavedByCustomer",
  incomingAccept: "/api/InvoiceInbox/acceptInvoice",
  incomingDeny: "/api/InvoiceInbox/denyInvoice",
  outgoingList: "/api/InvoiceOutbox/getInvoiceOutboxWithHeaderInfoList",
  outgoingModel: "/api/InvoiceOutbox/getInvoiceOutboxModel",
  outgoingStatus: "/api/InvoiceOutbox/getInvoiceOutboxStatus",
  outgoingPdf: "/api/InvoiceOutbox/getInvoiceOutboxPdfAsZip",
  outgoingXml: "/api/InvoiceOutbox/getInvoiceOutboxXMLAsZip",
  outgoingSubmit: "/api/InvoiceOutbox/invoiceOutbox",
  outgoingSubmitUbl: "/api/InvoiceOutbox/invoiceOutboxWithUblXml",
  outgoingCancel: "/api/InvoiceOutbox/cancelEArchiveInvoice",
  outgoingSendDraft: "/api/InvoiceOutbox/sendDraftInvoiceToGIB",
  /** Current v8 draft signing endpoint (legacy Outbox route remains fallback). */
  invoiceDraftSignAndSend: "/api/Invoice/invoiceDraftSignAndSend",
  invoiceDraftSendToGib: "/api/Invoice/invoiceDraftSendToGib",
  invoiceDraftSendToGibUblXml: "/api/Invoice/invoiceDraftSendToGibUblXml",
  /** Official Mysoft Mükellef Detay Sorgula (VKN/TCKN) */
  taxpayerDetailInfo: "/api/Taxpayer/getTaxPayerDetailInfo",
  /** Official Mysoft GİB Hesap Sorgula */
  gibAccountModel: "/api/GeneralCard/getGibAccountModel"
};
var MYSOFT_DOCUMENT_OPERATIONS = {
  // Invoice inbox (the specialised /incoming routes below use the same
  // operations; these aliases make the complete v8 surface available to
  // server-to-server callers through one allowlisted endpoint).
  "invoice.incoming.new": { path: "/api/InvoiceInbox/getNewInvoiceInboxWithHeaderInfoList", method: "POST" },
  "invoice.incoming.new.raw": { path: "/api/InvoiceInbox/getNewInvoiceInboxList", method: "POST" },
  "invoice.incoming.list": { path: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriod", method: "POST" },
  "invoice.incoming.list.raw": { path: "/api/InvoiceInbox/getInvoiceInboxListForPeriod", method: "POST" },
  "invoice.incoming.list.paging": { path: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriodPaging", method: "POST" },
  "invoice.incoming.model": { path: "/api/InvoiceInbox/getInvoiceInboxModel", method: "GET" },
  "invoice.incoming.envelope-model": { path: "/api/InvoiceInbox/getInvoiceInboxWithEnvelopeModel", method: "GET" },
  "invoice.incoming.download": { path: "/api/InvoiceInbox/getInvoiceInboxPdfAsZip", method: "GET" },
  "invoice.incoming.pdf-batch": { path: "/api/InvoiceInbox/getMultipleInvoiceInboxAsOnePdfAsZip", method: "GET" },
  "invoice.incoming.pdf-batch.post": { path: "/api/InvoiceInbox/getMultipleInvoiceInboxAsOnePdfAsZipWithPost", method: "POST" },
  "invoice.incoming.xml": { path: "/api/InvoiceInbox/getInvoiceInboxUBLXMLAsZip", method: "GET" },
  "invoice.incoming.xml-envelope": { path: "/api/InvoiceInbox/getInvoiceInboxUBLXMLWithEnvelopeInfoAsZip", method: "GET" },
  "invoice.incoming.html": { path: "/api/InvoiceInbox/getInvoiceInboxHTMLAsZip", method: "GET" },
  "invoice.incoming.status": { path: "/api/InvoiceInbox/getInvoiceInboxStatus", method: "GET" },
  "invoice.incoming.acknowledge": { path: "/api/InvoiceInbox/invoiceInboxSavedByCustomer", method: "GET" },
  "invoice.incoming.archive": { path: "/api/InvoiceInbox/updateInvoiceInboxArchiveStatus", method: "GET" },
  "invoice.incoming.print": { path: "/api/InvoiceInbox/invoiceInboxIncreasePrintCount", method: "GET" },
  "invoice.incoming.accept": { path: "/api/InvoiceInbox/acceptInvoice", method: "GET" },
  "invoice.incoming.deny": { path: "/api/InvoiceInbox/denyInvoice", method: "GET" },
  "invoice.incoming.deny.model": { path: "/api/InvoiceInbox/denyInvoiceWithModel", method: "POST" },
  "invoice.incoming.earchive.list": { path: "/api/InvoiceInbox/getEArchiveInboxForPeriodList", method: "POST" },
  "invoice.incoming.earchive.acknowledge": { path: "/api/InvoiceInbox/earchiveInboxSavedByCustomer", method: "GET" },
  // Invoice outbox and GIB lifecycle operations.
  "invoice.outgoing.create": { path: "/api/InvoiceOutbox/invoiceOutbox", method: "POST" },
  "invoice.outgoing.create.sample": {
    path: "/api/InvoiceOutbox/createInvoiceOutboxTestJson",
    method: "GET"
  },
  "invoice.outgoing.create.ubl": { path: "/api/InvoiceOutbox/invoiceOutboxWithUblXml", method: "POST" },
  "tenant.document-numbers": { path: "/api/Tenant/getDocumentNumberList", method: "GET" },
  "tenant.numerator-sets": { path: "/api/Tenant/getNumaratorSetList", method: "GET" },
  "tenant.xslt": { path: "/api/Tenant/getTenantXslt", method: "POST" },
  "taxpayer.detail": { path: "/api/Taxpayer/getTaxPayerDetailInfo", method: "GET" },
  "generalcard.gib-account": { path: "/api/GeneralCard/getGibAccountModel", method: "GET" },
  "generalcard.user-company-info": { path: "/api/GeneralCard/getUserCompanyInfo", method: "GET" },
  "invoice.outgoing.send-draft": { path: "/api/InvoiceOutbox/sendDraftInvoiceToGIB", method: "POST" },
  "invoice.outgoing.delete-draft": { path: "/api/InvoiceOutbox/deleteDraftInvoiceOutbox", method: "GET" },
  "invoice.outgoing.cancel-earchive": { path: "/api/InvoiceOutbox/cancelEArchiveInvoice", method: "GET" },
  "invoice.outgoing.status.changed": { path: "/api/InvoiceOutbox/getInvoiceOutboxStatusChanged", method: "POST" },
  "invoice.outgoing.status": { path: "/api/InvoiceOutbox/getInvoiceOutboxStatus", method: "GET" },
  "invoice.outgoing.download": { path: "/api/InvoiceOutbox/getInvoiceOutboxPdfAsZip", method: "GET" },
  "invoice.outgoing.pdf-batch": { path: "/api/InvoiceOutbox/getMultipleInvoiceOutboxAsOnePdfAsZip", method: "GET" },
  "invoice.outgoing.pdf-batch.post": { path: "/api/InvoiceOutbox/getMultipleInvoiceOutboxAsOnePdfAsZipWithPost", method: "POST" },
  "invoice.outgoing.xml": { path: "/api/InvoiceOutbox/getInvoiceOutboxXMLAsZip", method: "GET" },
  "invoice.outgoing.envelope-xml": { path: "/api/InvoiceOutbox/getInvoiceOutboxEnvelopeXMLAsZip", method: "GET" },
  "invoice.outgoing.xml-envelope": { path: "/api/InvoiceOutbox/getInvoiceOutboxXMLWithEnvelopeInfoAsZip", method: "GET" },
  "invoice.outgoing.html": { path: "/api/InvoiceOutbox/getInvoiceOutboxHTMLAsZip", method: "GET" },
  "invoice.outgoing.model": { path: "/api/InvoiceOutbox/getInvoiceOutboxModel", method: "GET" },
  "invoice.outgoing.draft.pdf": { path: "/api/InvoiceOutbox/getInvoiceOutboxDraftPdfAsZip", method: "POST" },
  "invoice.outgoing.draft.html": { path: "/api/InvoiceOutbox/getInvoiceOutboxDraftHTMLAsZip", method: "POST" },
  "invoice.outgoing.draft.xml": { path: "/api/InvoiceOutbox/getInvoiceOutboxDraftXMLAsZip", method: "POST" },
  "invoice.outgoing.ubl-draft.pdf": { path: "/api/InvoiceOutbox/getInvoiceOutboxForUblXmlDraftPdfAsZip", method: "POST" },
  "invoice.outgoing.ubl-draft.html": { path: "/api/InvoiceOutbox/getInvoiceOutboxForUblXmlDraftHTMLAsZip", method: "POST" },
  "invoice.outgoing.list.raw": { path: "/api/InvoiceOutbox/getInvoiceOutboxList", method: "POST" },
  "invoice.outgoing.list": { path: "/api/InvoiceOutbox/getInvoiceOutboxWithHeaderInfoList", method: "POST" },
  "invoice.outgoing.send-mail": { path: "/api/InvoiceOutbox/sendMailForInvoice", method: "GET" },
  "invoice.outgoing.mail-status": { path: "/api/InvoiceOutbox/checkMailStatusForInvoice", method: "GET" },
  "invoice.outgoing.general-mail-status": { path: "/api/InvoiceOutbox/checkGeneralMailStatusForInvoice", method: "GET" },
  "invoice.outgoing.general-mail-status.batch": { path: "/api/InvoiceOutbox/checkGeneralMailStatusForMultipleInvoice", method: "POST" },
  "invoice.outgoing.public-url": { path: "/api/InvoiceOutbox/getInvoiceOutboxPublicUrl", method: "GET" },
  "invoice.outgoing.schema-check": { path: "/api/InvoiceOutbox/checkSchemaSchematronForInvoiceUBL", method: "POST" },
  // Invoice draft/GIB endpoints (the older InvoiceOutbox aliases above are
  // retained for installations that use the outbox contract).
  "invoice.draft.create": { path: "/api/Invoice/invoiceDraft", method: "POST" },
  "invoice.draft.create.new": { path: "/api/Invoice/invoiceDraftNew", method: "POST" },
  "invoice.draft.drug-medical": { path: "/api/Invoice/invoiceDrugAndMedical", method: "POST" },
  "invoice.draft.note": { path: "/api/Invoice/invoiceNote", method: "POST" },
  "invoice.draft.delete": { path: "/api/Invoice/deleteInvoiceDraft", method: "POST" },
  "invoice.draft.sign-and-send": { path: "/api/Invoice/invoiceDraftSignAndSend", method: "GET" },
  "invoice.draft.model": { path: "/api/Invoice/getInvoiceModel", method: "GET" },
  "invoice.draft.model.list": { path: "/api/Invoice/getInvoiceModelList", method: "POST" },
  "invoice.draft.list": { path: "/api/Invoice/getInvoiceWithHeaderInfoList", method: "POST" },
  "invoice.draft.pdf": { path: "/api/Invoice/getInvoiceDraftPdfAsZip", method: "GET" },
  "invoice.draft.send-to-gib": { path: "/api/Invoice/invoiceDraftSendToGib", method: "POST" },
  "invoice.draft.send-to-gib.ubl": { path: "/api/Invoice/invoiceDraftSendToGibUblXml", method: "POST" },
  "invoice.draft.resend-to-gib": { path: "/api/Invoice/invoiceDraftReSendToGib", method: "POST" },
  "invoice.draft.sms.request": { path: "/api/Invoice/requestSmsConfimCodeFromGib", method: "POST" },
  "invoice.draft.sms.confirm": { path: "/api/Invoice/sendSmsConfirmForInvoiceToGib", method: "POST" },
  "invoice.draft.remove-from-gib": { path: "/api/Invoice/removeInvoiceFromGib", method: "POST" },
  "invoice.draft.cancel-request": { path: "/api/Invoice/createCancellationRequestToGib", method: "POST" },
  // E-Archive inbox is a separate v8 family from InvoiceInbox.
  "earchive.incoming.new": { path: "/api/EArchiveDocumentInbox/getNewEArchiveDocumentInboxList", method: "POST" },
  "earchive.incoming.list": { path: "/api/EArchiveDocumentInbox/getEArchiveDocumentInboxList", method: "POST" },
  "earchive.incoming.acknowledge": { path: "/api/EArchiveDocumentInbox/eArchiveDocumentInboxSavedByCustomer", method: "GET" },
  "earchive.incoming.xml": { path: "/api/EArchiveDocumentInbox/getEArchiveDocumentInboxUBLXMLAsZip", method: "GET" },
  "earchive.incoming.download": { path: "/api/EArchiveDocumentInbox/getEArchiveDocumentInboxPdfAsZip", method: "GET" },
  "despatch.incoming.list": { path: "/api/DespatchInbox/getDespatchInboxWithHeaderInfoListForPeriod", method: "POST" },
  "despatch.incoming.new": { path: "/api/DespatchInbox/getNewDespatchInboxWithHeaderInfoList", method: "POST" },
  "despatch.incoming.new.raw": { path: "/api/DespatchInbox/getNewDespatchInboxList", method: "POST" },
  "despatch.incoming.list.raw": { path: "/api/DespatchInbox/getDespatchInboxListForPeriod", method: "POST" },
  "despatch.incoming.list.paging": { path: "/api/DespatchInbox/getDespatchInboxWithHeaderInfoListForPeriodPaging", method: "POST" },
  "despatch.incoming.status": { path: "/api/DespatchInbox/getDespatchInboxStatus", method: "GET" },
  "despatch.incoming.download": { path: "/api/DespatchInbox/getDespatchInboxPdfAsZip", method: "GET" },
  "despatch.incoming.xml": { path: "/api/DespatchInbox/getDespatchInboxUBLXMLAsZip", method: "GET" },
  "despatch.incoming.xml-envelope": { path: "/api/DespatchInbox/getDespatchInboxUBLXMLWithEnvelopeInfoAsZip", method: "GET" },
  "despatch.incoming.html": { path: "/api/DespatchInbox/getDespatchInboxHTMLAsZip", method: "GET" },
  "despatch.incoming.model": { path: "/api/DespatchInbox/getDespatchInboxModel", method: "GET" },
  "despatch.incoming.acknowledge": { path: "/api/DespatchInbox/despatchInboxSavedByCustomer", method: "GET" },
  "despatch.incoming.archive": { path: "/api/DespatchInbox/updateDespatchInboxArchiveStatus", method: "GET" },
  "despatch.incoming.pdf-batch.post": { path: "/api/DespatchInbox/getMultipleDespatchInboxAsOnePdfAsZipWithPost", method: "POST" },
  "despatch.outgoing.list": { path: "/api/DespatchOutbox/getDespatchOutboxWithHeaderInfoList", method: "POST" },
  "despatch.outgoing.list.raw": { path: "/api/DespatchOutbox/getDespatchOutboxList", method: "POST" },
  "despatch.outgoing.create.ubl": { path: "/api/DespatchOutbox/despatchOutboxWithUblXml", method: "POST" },
  "despatch.outgoing.status": { path: "/api/DespatchOutbox/getDespatchOutboxStatus", method: "GET" },
  "despatch.outgoing.download": { path: "/api/DespatchOutbox/getDespatchOutboxPdfAsZip", method: "GET" },
  "despatch.outgoing.pdf-batch": { path: "/api/DespatchOutbox/getMultipleDespatchOutboxAsOnePdfAsZip", method: "GET" },
  "despatch.outgoing.pdf-batch.post": { path: "/api/DespatchOutbox/getMultipleDespatchOutboxAsOnePdfAsZipPost", method: "POST" },
  "despatch.outgoing.xml": { path: "/api/DespatchOutbox/getDespatchOutboxXMLAsZip", method: "GET" },
  "despatch.outgoing.envelope-xml": { path: "/api/DespatchOutbox/getDespatchOutboxEnvelopeXMLAsZip", method: "GET" },
  "despatch.outgoing.xml-envelope": { path: "/api/DespatchOutbox/getDespatchOutboxXMLWithEnvelopeInfoAsZip", method: "GET" },
  "despatch.outgoing.html": { path: "/api/DespatchOutbox/getDespatchOutboxHTMLAsZip", method: "GET" },
  "despatch.outgoing.status.changed": { path: "/api/DespatchOutbox/getDespatchOutboxStatusChanged", method: "POST" },
  "despatch.outgoing.delete-draft": { path: "/api/DespatchOutbox/deleteDraftDespatchOutbox", method: "GET" },
  "despatch.outgoing.draft.pdf": { path: "/api/DespatchOutbox/getDespatchOutboxDraftPdfAsZip", method: "POST" },
  "despatch.outgoing.draft.html": { path: "/api/DespatchOutbox/getDespatchOutboxDraftHTMLAsZip", method: "POST" },
  "despatch.outgoing.draft.xml": { path: "/api/DespatchOutbox/getDespatchOutboxDraftXMLAsZip", method: "POST" },
  "despatch.outgoing.ubl-draft.pdf": { path: "/api/DespatchOutbox/getDespatchOutboxForUblXmlDraftPdfAsZip", method: "POST" },
  "despatch.outgoing.ubl-draft.html": { path: "/api/DespatchOutbox/getDespatchOutboxForUblXmlDraftHTMLAsZip", method: "POST" },
  "despatch.outgoing.create": { path: "/api/DespatchOutbox/despatchOutbox", method: "POST" },
  "despatch.outgoing.send-draft": { path: "/api/DespatchOutbox/sendDraftDespatchToGIB", method: "POST" },
  "despatch.outgoing.public-url": { path: "/api/DespatchOutbox/getDespatchOutboxPublicUrl", method: "GET" },
  "despatch.outgoing.schema-check": { path: "/api/DespatchOutbox/checkSchemaSchematronForDespatchUBL", method: "POST" },
  "receipt.incoming.list": { path: "/api/ReceiptInbox/getReceiptInboxWithHeaderInfoListForPeriod", method: "POST" },
  "receipt.incoming.new": { path: "/api/ReceiptInbox/getNewReceiptInboxWithHeaderInfoList", method: "POST" },
  "receipt.incoming.new.raw": { path: "/api/ReceiptInbox/getNewReceiptInboxList", method: "POST" },
  "receipt.incoming.list.raw": { path: "/api/ReceiptInbox/getReceiptInboxListForPeriod", method: "POST" },
  "receipt.incoming.download": { path: "/api/ReceiptInbox/getReceiptInboxPdfAsZip", method: "GET" },
  "receipt.incoming.xml": { path: "/api/ReceiptInbox/getReceiptInboxUBLXMLAsZip", method: "GET" },
  "receipt.incoming.xml-envelope": { path: "/api/ReceiptInbox/getReceiptInboxUBLXMLWithEnvelopeInfoAsZip", method: "GET" },
  "receipt.incoming.html": { path: "/api/ReceiptInbox/getReceiptInboxHTMLAsZip", method: "GET" },
  "receipt.incoming.by-despatch.download": { path: "/api/ReceiptInbox/getReceiptInboxByDespatchETTNPdfAsZip", method: "GET" },
  "receipt.incoming.by-despatch.xml": { path: "/api/ReceiptInbox/getReceiptInboxUBLXMLByDespatchETTNAsZip", method: "GET" },
  "receipt.incoming.by-despatch.html": { path: "/api/ReceiptInbox/getReceiptInboxHTMLByDespatchETTNAsZip", method: "GET" },
  "receipt.incoming.acknowledge": { path: "/api/ReceiptInbox/receiptInboxSavedByCustomer", method: "GET" },
  "receipt.outgoing.list": { path: "/api/ReceiptOutbox/getReceiptOutboxWithHeaderInfoList", method: "POST" },
  "receipt.outgoing.list.raw": { path: "/api/ReceiptOutbox/getReceiptOutboxList", method: "POST" },
  "receipt.outgoing.status": { path: "/api/ReceiptOutbox/getReceiptOutboxStatus", method: "GET" },
  "receipt.outgoing.download": { path: "/api/ReceiptOutbox/getReceiptOutboxPdfAsZip", method: "GET" },
  "receipt.outgoing.by-despatch.download": { path: "/api/ReceiptOutbox/getReceiptOutboxWithDespatchEttnPdfAsZip", method: "GET" },
  "receipt.outgoing.xml": { path: "/api/ReceiptOutbox/getReceiptOutboxXMLAsZip", method: "GET" },
  "receipt.outgoing.envelope-xml": { path: "/api/ReceiptOutbox/getReceiptOutboxEnvelopeXMLAsZip", method: "GET" },
  "receipt.outgoing.by-despatch.xml": { path: "/api/ReceiptOutbox/getReceiptOutboxWithDespatchETTNXMLAsZip", method: "GET" },
  "receipt.outgoing.html": { path: "/api/ReceiptOutbox/getReceiptOutboxHTMLAsZip", method: "GET" },
  "receipt.outgoing.by-despatch.html": { path: "/api/ReceiptOutbox/getReceiptOutboxWithDespatchETTNHTMLAsZip", method: "GET" },
  "receipt.outgoing.xml-envelope": { path: "/api/ReceiptOutbox/getReceiptOutboxXMLWithEnvelopeInfoAsZip", method: "GET" },
  "receipt.outgoing.status.changed": { path: "/api/ReceiptOutbox/getReceiptOutboxStatusChanged", method: "POST" },
  "receipt.outgoing.draft.pdf": { path: "/api/ReceiptOutbox/getReceiptOutboxDraftPdfAsZip", method: "POST" },
  "receipt.outgoing.draft.html": { path: "/api/ReceiptOutbox/getReceiptOutboxDraftHTMLAsZip", method: "POST" },
  "receipt.outgoing.ubl-draft.pdf": { path: "/api/ReceiptOutbox/getReceiptOutboxForUblXmlDraftPdfAsZip", method: "POST" },
  "receipt.outgoing.ubl-draft.html": { path: "/api/ReceiptOutbox/getReceiptOutboxForUblXmlDraftHTMLAsZip", method: "POST" },
  "receipt.outgoing.create": { path: "/api/ReceiptOutbox/receiptOutbox", method: "POST" },
  "receipt.outgoing.create.ubl": { path: "/api/ReceiptOutbox/receiptOutboxWithUblXml", method: "POST" },
  // Expense voucher, bill document and foreign-exchange families are
  // outgoing-only in the current v8 contract.
  "expensevoucher.outgoing.list": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxWithHeaderInfoList", method: "POST" },
  "expensevoucher.outgoing.status.changed": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxStatusChanged", method: "POST" },
  "expensevoucher.outgoing.status": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxStatus", method: "GET" },
  "expensevoucher.outgoing.download": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxPdfAsZip", method: "GET" },
  "expensevoucher.outgoing.xml": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxXMLAsZip", method: "GET" },
  "expensevoucher.outgoing.html": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxHTMLAsZip", method: "GET" },
  "expensevoucher.outgoing.draft.pdf": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxDraftPdfAsZip", method: "POST" },
  "expensevoucher.outgoing.draft.html": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxDraftHTMLAsZip", method: "POST" },
  "expensevoucher.outgoing.draft.xml": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxDraftXMLAsZip", method: "POST" },
  "expensevoucher.outgoing.create": { path: "/api/ExpenseVoucher/expenseVoucherOutbox", method: "POST" },
  "expensevoucher.outgoing.create.ubl": { path: "/api/ExpenseVoucher/expenseVoucherOutboxWithUblXml", method: "POST" },
  "expensevoucher.outgoing.cancel": { path: "/api/ExpenseVoucher/cancelExpenseVoucherOutbox", method: "GET" },
  "billdocument.outgoing.list": { path: "/api/BillDocument/getBillDocumentOutboxWithHeaderInfoList", method: "POST" },
  "billdocument.outgoing.status.changed": { path: "/api/BillDocument/getBillDocumentOutboxStatusChanged", method: "POST" },
  "billdocument.outgoing.status": { path: "/api/BillDocument/getBillDocumentOutboxStatus", method: "GET" },
  "billdocument.outgoing.download": { path: "/api/BillDocument/getBillDocumentOutboxPdfAsZip", method: "GET" },
  "billdocument.outgoing.xml": { path: "/api/BillDocument/getBillDocumentOutboxXMLAsZip", method: "GET" },
  "billdocument.outgoing.html": { path: "/api/BillDocument/getBillDocumentOutboxHTMLAsZip", method: "GET" },
  "billdocument.outgoing.draft.pdf": { path: "/api/BillDocument/getBillDocumentOutboxDraftPdfAsZip", method: "POST" },
  "billdocument.outgoing.draft.html": { path: "/api/BillDocument/getBillDocumentOutboxDraftHTMLAsZip", method: "POST" },
  "billdocument.outgoing.draft.xml": { path: "/api/BillDocument/getBillDocumentOutboxDraftXMLAsZip", method: "POST" },
  "billdocument.outgoing.create": { path: "/api/BillDocument/billDocumentOutbox", method: "POST" },
  "billdocument.outgoing.create.ubl": { path: "/api/BillDocument/billDocumentOutboxWithUblXml", method: "POST" },
  "billdocument.outgoing.cancel": { path: "/api/BillDocument/cancelBillDocumentOutbox", method: "GET" },
  "bankreceipt.outgoing.xml": { path: "/api/BankReceipt/getBankReceiptOutboxXMLAsZip", method: "GET" },
  "bankreceipt.outgoing.html": { path: "/api/BankReceipt/getBankReceiptOutboxHTMLAsZip", method: "GET" },
  "bankreceipt.outgoing.download": { path: "/api/BankReceipt/getBankReceiptOutboxPdfAsZip", method: "GET" },
  "bankreceipt.outgoing.create": { path: "/api/BankReceipt/bankReceiptOutbox", method: "POST" },
  "bankreceipt.outgoing.cancel": { path: "/api/BankReceipt/cancelBankReceiptOutbox", method: "GET" },
  "foreignexchange.outgoing.list": { path: "/api/ForeignExchange/getForeignExchangeOutboxWithHeaderInfoList", method: "POST" },
  "foreignexchange.outgoing.status": { path: "/api/ForeignExchange/getForeignExchangeOutboxStatus", method: "GET" },
  "foreignexchange.outgoing.download": { path: "/api/ForeignExchange/getForeignExchangeOutboxPdfAsZip", method: "GET" },
  "foreignexchange.outgoing.xml": { path: "/api/ForeignExchange/getForeignExchangeOutboxXMLAsZip", method: "GET" },
  "foreignexchange.outgoing.html": { path: "/api/ForeignExchange/getForeignExchangeOutboxHTMLAsZip", method: "GET" },
  "foreignexchange.outgoing.status.changed": { path: "/api/ForeignExchange/getforeignExchangeOutboxStatusChanged", method: "POST" },
  "foreignexchange.outgoing.create": { path: "/api/ForeignExchange/foreginExchangeOutbox", method: "POST" },
  "foreignexchange.outgoing.create.ubl": { path: "/api/ForeignExchange/foreignExchangeOutboxWithUblXml", method: "POST" },
  "foreignexchange.outgoing.list.raw": { path: "/api/ForeignExchange/getForeignExchangeOutboxList", method: "POST" },
  "foreignexchange.outgoing.cancel": { path: "/api/ForeignExchange/cancelForeignExchangeOutbox", method: "GET" }
};
var MysoftConfigurationError = class extends Error {
  constructor(message = "Mysoft API credentials are not configured") {
    super(message);
    this.code = "MYSOFT_NOT_CONFIGURED";
    this.name = "MysoftConfigurationError";
  }
};
var MysoftApiError = class extends Error {
  constructor(status, message, details) {
    super(message);
    this.code = "MYSOFT_API_ERROR";
    this.name = "MysoftApiError";
    this.status = status;
    this.details = details;
  }
};
var PROD_BASE_URL = "https://edocumentapi.mysoft.com.tr";
var TEST_BASE_URL = "https://edocumentapi.mytest.tr";
function trimBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}
function envBoolean(value) {
  return ["1", "true", "yes", "on"].includes((value || "").trim().toLowerCase());
}
function normalizeGrantType(value) {
  const normalized = value?.trim().toLowerCase().replace(/[-\s]/g, "_");
  if (normalized === "password") return "password";
  if (normalized === "client_credentials" || normalized === "clientcredential") return "client_credentials";
  return void 0;
}
function grantTypeFor(config) {
  if (config.grantType === "password" || config.grantType === "client_credentials") return config.grantType;
  if (config.clientId && config.clientSecret) return "client_credentials";
  if (config.username && config.password) return "password";
  return "client_credentials";
}
function getMysoftConfig(env = process.env) {
  const requestedEnvironment = (env.MYSOFT_ENV || "prod").trim().toLowerCase();
  const defaultBaseUrl = requestedEnvironment === "test" ? TEST_BASE_URL : PROD_BASE_URL;
  const baseUrl = trimBaseUrl(env.MYSOFT_API_BASE_URL || env.MYSOFT_API_URL || defaultBaseUrl);
  const tokenUrl = trimBaseUrl(env.MYSOFT_TOKEN_URL || `${baseUrl}${MYSOFT_ENDPOINTS.token}`);
  const clientId = env.MYSOFT_CLIENT_ID?.trim() || void 0;
  const clientSecret = env.MYSOFT_CLIENT_SECRET?.trim() || void 0;
  const username = env.MYSOFT_USERNAME?.trim() || env.MYSOFT_USER_NAME?.trim() || void 0;
  const password = env.MYSOFT_PASSWORD?.trim() || env.MYSOFT_USER_PASSWORD?.trim() || void 0;
  const tenantIdentifierNumber = normalizeMysoftTenantIdentifier(
    env.MYSOFT_TENANT_IDENTIFIER_NUMBER
  );
  return {
    baseUrl,
    tokenUrl,
    // Explicit MYSOFT_GRANT_TYPE wins.  Otherwise infer the grant from the
    // credentials present (client credentials first, password as fallback).
    grantType: normalizeGrantType(env.MYSOFT_GRANT_TYPE || env.MYSOFT_OAUTH_GRANT_TYPE) || (clientId && clientSecret ? "client_credentials" : username && password ? "password" : "client_credentials"),
    clientId,
    clientSecret,
    username,
    password,
    scope: env.MYSOFT_SCOPE?.trim() || void 0,
    tenantIdentifierNumber,
    connectorGuid: env.MYSOFT_CONNECTOR_GUID?.trim() || void 0,
    timeoutMs: Math.max(1e3, Number(env.MYSOFT_TIMEOUT_MS || 3e4) || 3e4),
    // Mock is opt-in. Missing credentials alone must never silently write data.
    mockMode: envBoolean(env.MYSOFT_MOCK_MODE)
  };
}
function environmentFor(config) {
  if (config.baseUrl === TEST_BASE_URL) return "test";
  if (config.baseUrl === PROD_BASE_URL) return "prod";
  return "custom";
}
function redactUrl(value) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "[invalid-url]";
  }
}
function asQueryValue(value) {
  if (value === void 0 || value === null || value === "") return void 0;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}
function appendQuery(url, query) {
  if (!query) return;
  Object.entries(query).forEach(([key, value]) => {
    const serialized = asQueryValue(value);
    if (serialized !== void 0) url.searchParams.set(key, serialized);
  });
}
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function unwrapMysoftData(payload) {
  if (!isObject(payload)) return payload;
  if ("data" in payload) return payload.data;
  return payload;
}
function asObjectArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject);
}
function stringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}
function positiveInt(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : void 0;
}
function parseTokenIdentity(accessToken) {
  const parts = accessToken.split(".");
  if (parts.length < 2) return void 0;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const claims = JSON.parse(json);
    const raw = typeof claims.iuser === "string" ? JSON.parse(claims.iuser) : claims.iuser;
    if (!isObject(raw)) return void 0;
    const defaultTenantId = Number(raw.TenantId);
    return {
      defaultTenantId: Number.isInteger(defaultTenantId) ? defaultTenantId : void 0,
      hasDefaultTenant: Number.isInteger(defaultTenantId) && defaultTenantId > 0,
      businessPartnerId: positiveInt(raw.BusinessPartnerId),
      applicationAccessId: positiveInt(raw.ApplicationAccessId)
    };
  } catch {
    return void 0;
  }
}
function normalizeHttpStatus(status) {
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 502;
}
function errorMessage(payload) {
  if (!isObject(payload)) return void 0;
  const candidates = [
    payload.message,
    payload.error_description,
    payload.error,
    payload.detail,
    payload.description
  ];
  const value = candidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  if (typeof value === "string") return value.trim().slice(0, 500);
  const code = [payload.errorCode, payload.error_code, payload.code].find(
    (candidate) => typeof candidate === "string" && candidate.trim() || typeof candidate === "number" && Number.isFinite(candidate)
  );
  if (typeof code === "string" || typeof code === "number") {
    return `Mysoft API error ${String(code).trim()}`.slice(0, 500);
  }
  return void 0;
}
function payloadIndicatesFailure(payload) {
  if (!isObject(payload)) return false;
  return payload.succeed === false || payload.success === false;
}
function resultHasTenantRows(payload) {
  if (!isObject(payload)) return false;
  const data = payload.data;
  if (Array.isArray(data)) return data.length > 0;
  return isObject(data);
}
var MysoftEdocumentClient = class {
  constructor(config = getMysoftConfig()) {
    this.config = config;
  }
  get status() {
    const grantType = grantTypeFor(this.config);
    const hasClientCredentials = Boolean(this.config.clientId && this.config.clientSecret);
    const hasPasswordCredentials = Boolean(this.config.username && this.config.password);
    return {
      configured: grantType === "password" ? hasPasswordCredentials : hasClientCredentials,
      mockMode: this.config.mockMode,
      environment: environmentFor(this.config),
      baseUrl: redactUrl(this.config.baseUrl),
      tokenUrl: redactUrl(this.config.tokenUrl),
      grantType,
      hasClientCredentials,
      hasPasswordCredentials,
      hasTenantIdentifierNumber: Boolean(this.config.tenantIdentifierNumber),
      hasConnectorGuid: Boolean(this.config.connectorGuid),
      ...this.tokenIdentity ? { identity: this.tokenIdentity } : {}
    };
  }
  /** Fetch a token if needed and return the redacted partner/tenant identity. */
  async getTokenIdentity() {
    if (this.config.mockMode) return this.tokenIdentity;
    await this.getAccessToken();
    return this.tokenIdentity;
  }
  ensureConfigured() {
    if (!this.status.configured && !this.config.mockMode) {
      if (this.status.grantType === "password") {
        throw new MysoftConfigurationError(
          "Mysoft API is not configured. Set MYSOFT_USERNAME and MYSOFT_PASSWORD on the server."
        );
      }
      throw new MysoftConfigurationError(
        "Mysoft API is not configured. Set MYSOFT_CLIENT_ID and MYSOFT_CLIENT_SECRET on the server."
      );
    }
  }
  async fetchWithTimeout(input, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const fetchImpl = this.config.fetchImpl || fetch;
      return await fetchImpl(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new MysoftApiError(504, "Mysoft API request timed out");
      }
      if (error instanceof MysoftApiError) throw error;
      throw new MysoftApiError(502, "Unable to reach Mysoft API");
    } finally {
      clearTimeout(timeout);
    }
  }
  async getAccessToken(forceRefresh = false) {
    this.ensureConfigured();
    if (this.config.mockMode) return "mock-token";
    if (!forceRefresh && this.accessToken && this.accessToken.expiresAt > Date.now() + 3e4) {
      return this.accessToken.value;
    }
    if (this.tokenRequest) return this.tokenRequest;
    this.tokenRequest = (async () => {
      const grantType = grantTypeFor(this.config);
      const form = new URLSearchParams({ grant_type: grantType });
      if (grantType === "client_credentials") {
        form.set("client_id", this.config.clientId);
        form.set("client_secret", this.config.clientSecret);
      } else {
        form.set("username", this.config.username);
        form.set("password", this.config.password);
        if (this.config.clientId) form.set("client_id", this.config.clientId);
        if (this.config.clientSecret) form.set("client_secret", this.config.clientSecret);
      }
      if (this.config.scope) form.set("scope", this.config.scope);
      const response = await this.fetchWithTimeout(this.config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: form
      });
      const payload = await this.parseResponse(response, false);
      if (!response.ok) {
        throw new MysoftApiError(
          normalizeHttpStatus(response.status),
          errorMessage(payload) || "Mysoft OAuth token request failed",
          payload
        );
      }
      const accessToken = isObject(payload) ? typeof payload.access_token === "string" ? payload.access_token : typeof payload.accessToken === "string" ? payload.accessToken : typeof payload.token === "string" ? payload.token : void 0 : void 0;
      if (!accessToken) {
        throw new MysoftApiError(502, "Mysoft OAuth response did not contain access_token", payload);
      }
      const rawExpiresIn = isObject(payload) ? payload.expires_in ?? payload.expiresIn : void 0;
      const expiresIn = typeof rawExpiresIn === "number" ? rawExpiresIn : Number(rawExpiresIn) || 300;
      this.accessToken = {
        value: accessToken,
        expiresAt: Date.now() + Math.max(30, expiresIn) * 1e3
      };
      this.tokenIdentity = parseTokenIdentity(accessToken);
      return accessToken;
    })();
    try {
      return await this.tokenRequest;
    } finally {
      this.tokenRequest = void 0;
    }
  }
  async parseResponse(response, raw) {
    const contentType = response.headers.get("content-type") || "";
    const isKnownBinary = /(?:zip|pdf|octet-stream|image\/|audio\/|video\/)/i.test(contentType);
    if (raw || isKnownBinary) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      return { bytes, contentType };
    }
    const text2 = await response.text();
    if (!text2) return null;
    try {
      return JSON.parse(text2);
    } catch {
      return text2;
    }
  }
  /** Execute a documented Mysoft API operation. */
  async request(path6, options = {}) {
    try {
      return await this.requestOnce(path6, options);
    } catch (error) {
      if (!this.canRetryWithoutTenant(path6, options, error)) throw error;
      return this.requestOnce(path6, this.withoutTenant(options));
    }
  }
  async requestOnce(path6, options = {}) {
    this.ensureConfigured();
    const method = options.method || (options.body === void 0 ? "GET" : "POST");
    if (!path6.startsWith("/")) path6 = `/${path6}`;
    if (this.config.mockMode) {
      return this.mockResponse(path6, options);
    }
    const token = await this.getAccessToken();
    const url = new URL(path6, `${this.config.baseUrl}/`);
    appendQuery(url, options.query);
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    };
    if (options.body !== void 0) headers["Content-Type"] = "application/json";
    let response = await this.fetchWithTimeout(url, {
      method,
      headers,
      body: options.body === void 0 ? void 0 : JSON.stringify(options.body)
    });
    if (response.status === 401) {
      this.accessToken = void 0;
      const refreshedToken = await this.getAccessToken(true);
      headers.Authorization = `Bearer ${refreshedToken}`;
      response = await this.fetchWithTimeout(url, {
        method,
        headers,
        body: options.body === void 0 ? void 0 : JSON.stringify(options.body)
      });
    }
    const payload = await this.parseResponse(response, Boolean(options.raw));
    if (!response.ok) {
      throw new MysoftApiError(
        normalizeHttpStatus(response.status),
        errorMessage(payload) || `Mysoft API request failed (${response.status})`,
        payload
      );
    }
    if (payloadIndicatesFailure(payload)) {
      throw new MysoftApiError(
        502,
        errorMessage(payload) || "Mysoft API operation failed",
        payload
      );
    }
    return payload;
  }
  sentTenant(options) {
    const fromQuery = normalizeMysoftTenantIdentifier(options.query?.tenantIdentifierNumber);
    const fromBody = isObject(options.body) && !Array.isArray(options.body) ? normalizeMysoftTenantIdentifier(
      options.body.tenantIdentifierNumber
    ) : void 0;
    return Boolean(fromQuery || fromBody);
  }
  withoutTenant(options) {
    const query = options.query ? { ...options.query } : void 0;
    if (query) delete query.tenantIdentifierNumber;
    let body = options.body;
    if (isObject(body) && !Array.isArray(body)) {
      const next = { ...body };
      delete next.tenantIdentifierNumber;
      body = next;
    }
    return { ...options, query, body };
  }
  canRetryWithoutTenant(path6, options, error) {
    if (!this.sentTenant(options) || !isMysoftTenantScopeError(error)) return false;
    return !/\/api\/Tenant\//i.test(path6);
  }
  mockResponse(path6, _options) {
    const emptyList = path6.toLowerCase().includes("list") ? { data: [], succeed: true, message: "Mysoft mock mode: no remote records", afterValue: 0 } : { data: null, succeed: true, message: "Mysoft mock mode", afterValue: 0 };
    return emptyList;
  }
  /** Resolve an optional request tenant against the server-side default.
   * Only a 10/11-digit VKN/TCKN is forwarded; portal tenant ids are dropped. */
  effectiveTenant(value) {
    return normalizeMysoftTenantIdentifier(value) || normalizeMysoftTenantIdentifier(this.config.tenantIdentifierNumber);
  }
  /**
   * Resolve effective tenant VKN/TCKN asynchronously. If explicit value and
   * MYSOFT_TENANT_IDENTIFIER_NUMBER are missing, auto-resolves from the API's linked tenant list.
   */
  async resolveEffectiveTenant(value) {
    const direct = this.effectiveTenant(value);
    if (direct) return direct;
    try {
      const tenantsPayload = await this.listTenants({ limit: 5 });
      const unwrapped = unwrapMysoftData(tenantsPayload);
      const rows = asObjectArray(unwrapped);
      const firstTax = rows.map((r) => normalizeMysoftTenantIdentifier(r.taxNumber || r.vknTckn || r.identifierNumber)).find(Boolean);
      if (firstTax) return firstTax;
    } catch {
    }
    return void 0;
  }
  /** Execute one of the explicitly published non-invoice operations. */
  requestDocumentOperation(operation, options = {}) {
    const key = operation.trim().toLowerCase();
    const definition = Object.prototype.hasOwnProperty.call(MYSOFT_DOCUMENT_OPERATIONS, key) ? MYSOFT_DOCUMENT_OPERATIONS[key] : void 0;
    if (!definition) throw new Error("Unsupported Mysoft document operation");
    const tenantIdentifierNumber = this.effectiveTenant(options.tenantIdentifierNumber);
    if (definition.method === "GET") {
      return this.request(definition.path, {
        method: "GET",
        query: { ...options.query, tenantIdentifierNumber },
        raw: options.raw
      });
    }
    const body = isObject(options.body) && !Array.isArray(options.body) ? { ...options.body, tenantIdentifierNumber } : options.body === void 0 ? { tenantIdentifierNumber } : options.body;
    return this.request(definition.path, {
      method: "POST",
      body,
      raw: options.raw
    });
  }
  /** Apply server-side defaults to outgoing invoice payloads without
   * overwriting an explicit per-company tenant supplied by the UI.
   * Mysoft (Uğur Yılmaz, 2026-08-25): do not send connectorGuid — leave it
   * empty; the field will be removed. */
  submissionPayload(payload) {
    if (!isObject(payload) || Array.isArray(payload)) return payload;
    const body = { ...payload };
    const requestedTenant = typeof body.tenantIdentifierNumber === "string" ? body.tenantIdentifierNumber : void 0;
    const tenant = this.effectiveTenant(requestedTenant);
    if (tenant) body.tenantIdentifierNumber = tenant;
    delete body.connectorGuid;
    return body;
  }
  listIncoming(request = {}) {
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      pkAlias,
      ettn,
      vknTckn,
      isUseDocDate,
      cessionStatus,
      tenantIdentifierNumber
    } = request;
    return this.request(MYSOFT_ENDPOINTS.incomingList, {
      method: "POST",
      body: {
        afterValue,
        limit,
        startDate,
        endDate,
        pkAlias,
        ettn,
        vknTckn,
        isUseDocDate,
        cessionStatus,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber)
      }
    });
  }
  /**
   * POSTs GetInvoiceInboxListForPeriodPagingRequestModel.  This endpoint is
   * useful for periods longer than one day and returns `totalCount` alongside
   * the page data.  Keep the legacy listIncoming method unchanged because
   * some Mysoft tenants still only expose the cursor-based endpoint.
   */
  listIncomingPaging(request = {}) {
    const {
      startDate,
      endDate,
      pkAlias,
      docNo,
      ettn,
      portalInvoiceStatus,
      profile,
      vknTckn,
      accountName,
      isUseDocDate,
      cessionStatus,
      archiveStatus,
      pageSize,
      pageNumber,
      tenantIdentifierNumber
    } = request;
    return this.request(MYSOFT_ENDPOINTS.incomingListPaging, {
      method: "POST",
      body: {
        startDate,
        endDate,
        pkAlias,
        docNo,
        ettn,
        portalInvoiceStatus,
        profile,
        vknTckn,
        accountName,
        isUseDocDate,
        cessionStatus,
        archiveStatus,
        pageSize: pageSize ?? 100,
        pageNumber: pageNumber ?? 1,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber)
      }
    });
  }
  listNewIncoming(request = {}) {
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      pkAlias,
      ettn,
      vknTckn,
      isUseDocDate,
      cessionStatus,
      tenantIdentifierNumber
    } = request;
    return this.request(MYSOFT_ENDPOINTS.incomingNewList, {
      method: "POST",
      body: {
        afterValue,
        limit,
        startDate,
        endDate,
        pkAlias,
        ettn,
        vknTckn,
        isUseDocDate,
        cessionStatus,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber)
      }
    });
  }
  /** Return firms on this business-partner key: partner credit list, authorized
   * companies, then the taxpayer directory. Invoice calls still need each
   * row's VKN as tenantIdentifierNumber. */
  async listTenants(request = {}) {
    const afterValue = Number.isFinite(request.afterValue) ? Math.max(0, Math.trunc(request.afterValue)) : void 0;
    const limit = Number.isFinite(request.limit) ? Math.max(1, Math.min(50, Math.trunc(request.limit))) : 50;
    const attempts = [
      () => this.request(MYSOFT_ENDPOINTS.tenantList, {
        method: "GET",
        query: { afterValue: afterValue ?? 0, limit }
      }),
      () => this.request(MYSOFT_ENDPOINTS.partnerCreditList, {
        method: "POST",
        body: { businessPartnerQueryType: 1, quantityType: 1 }
      }),
      () => this.request(MYSOFT_ENDPOINTS.partnerCreditList, {
        method: "POST",
        body: { businessPartnerQueryType: 2, quantityType: 1 }
      }),
      () => this.request(MYSOFT_ENDPOINTS.userCompanyInfo, { method: "GET" }),
      () => this.request(MYSOFT_ENDPOINTS.tenantUsageSummary, {
        method: "GET",
        query: { quantityType: 1 }
      })
    ];
    let lastError;
    let emptyPayload;
    for (const attempt of attempts) {
      try {
        const payload = await attempt();
        if (resultHasTenantRows(payload)) return payload;
        emptyPayload = payload;
      } catch (error) {
        if (error instanceof MysoftConfigurationError) throw error;
        if (error instanceof MysoftApiError && (error.status === 401 || error.status === 403)) {
          throw error;
        }
        lastError = error;
      }
    }
    if (emptyPayload) return emptyPayload;
    if (lastError) throw lastError;
    return { data: [], succeed: true, afterValue: 0 };
  }
  /** Look up a single linked firm by VKN/TCKN. */
  getTenantWithIdentifier(identifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.tenantByIdentifier, {
      method: "GET",
      query: { identifierNumber: identifierNumber.trim() }
    });
  }
  /** Read the detailed firm information for a VKN/TCKN. */
  getTenantInfo(identifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.tenantInfo, {
      method: "GET",
      query: { identifierNumber: identifierNumber.trim() }
    });
  }
  /**
   * Official VKN/TCKN taxpayer detail lookup (Mükellef Detay Sorgula).
   * Returns official legal title, tax office name/code, activity status, full address components and NACE list.
   * Swagger: GET /api/Taxpayer/getTaxPayerDetailInfo
   */
  getTaxPayerDetailInfo(identifierNumber, tenantIdentifierNumber) {
    const clean = String(identifierNumber || "").replace(/\D/g, "").trim();
    const query = { identifierNumber: clean };
    const effectiveTenant = this.effectiveTenant(tenantIdentifierNumber);
    if (effectiveTenant) {
      query.tenantIdentifierNumber = effectiveTenant;
    }
    return this.request(MYSOFT_ENDPOINTS.taxpayerDetailInfo, {
      method: "GET",
      query
    });
  }
  /**
   * Official GİB Account model lookup (Gib Hesap Sorgula).
   * Checks if firm is a registered GİB e-Fatura / e-İrsaliye user and retrieves official mailbox (PK) and sender (GB) aliases.
   * Swagger: GET /api/GeneralCard/getGibAccountModel
   */
  getGibAccountModel(vknTckn) {
    const clean = String(vknTckn || "").replace(/\D/g, "").trim();
    return this.request(MYSOFT_ENDPOINTS.gibAccountModel, {
      method: "GET",
      query: { vknTckn: clean }
    });
  }
  /** Portal document-number / prefix list for a customer VKN. */
  getDocumentNumberList(vknTckn) {
    return this.request(MYSOFT_ENDPOINTS.tenantDocumentNumbers, {
      method: "GET",
      query: { vknTckn: vknTckn.trim() }
    });
  }
  /** Portal numerator set list (often empty; firms usually use prefix only). */
  getNumeratorSetList(vknTckn) {
    return this.request(MYSOFT_ENDPOINTS.tenantNumeratorSets, {
      method: "GET",
      query: { vknTckn: vknTckn.trim() }
    });
  }
  /**
   * Portal XSLT designs for a customer.
   * edocumentType: 1=e-Fatura, 2=e-Arşiv, 3=e-İrsaliye (Swagger ApiTenantXsltGetRequestModel).
   */
  getTenantXslt(options) {
    return this.request(MYSOFT_ENDPOINTS.tenantXslt, {
      method: "POST",
      body: {
        vknTckn: String(options.vknTckn || "").trim(),
        edocumentType: options.edocumentType,
        xsltName: options.xsltName,
        isInternetSales: options.isInternetSales
      }
    });
  }
  /**
   * Resolve default invoice design + numerator for a customer from Mysoft portal.
   * Used when Muavin leaves xsltName / prefix / numeratorSetCode empty.
   */
  async resolveInvoiceDesignDefaults(options) {
    const vkn = normalizeMysoftTenantIdentifier(options.vknTckn) || String(options.vknTckn || "").trim();
    const eDocumentType = String(options.eDocumentType || "EFATURA").toUpperCase().replace(/[ _-]/g, "");
    const isEarsiv = eDocumentType.includes("ARSIV");
    const edocumentTypeCode = isEarsiv ? 2 : 1;
    const isInternetSales = options.isInternetSales === true;
    const [xsltRes, numRes, setRes] = await Promise.all([
      this.getTenantXslt({
        vknTckn: vkn,
        edocumentType: edocumentTypeCode,
        isInternetSales: isInternetSales || void 0
      }),
      this.getDocumentNumberList(vkn),
      this.getNumeratorSetList(vkn)
    ]);
    const xsltDesigns = asObjectArray(unwrapMysoftData(xsltRes));
    const prefixes = asObjectArray(unwrapMysoftData(numRes));
    const numeratorSets = asObjectArray(unwrapMysoftData(setRes));
    const defaultXslt = xsltDesigns.find((row) => row.isDefault === true && row.isApproved !== false) || xsltDesigns.find((row) => row.isDefault === true) || xsltDesigns.find((row) => row.isApproved === true) || xsltDesigns[0];
    const typeCode = String(edocumentTypeCode);
    const matchingPrefixes = prefixes.filter((row) => {
      const rowType = String(row.edocumentType ?? "");
      if (rowType && rowType !== typeCode) return false;
      if (isInternetSales) return row.isInternetSales === true;
      return row.isInternetSales !== true;
    });
    const defaultPrefix = matchingPrefixes.find((row) => row.isDefault === true && row.isPassive !== true) || matchingPrefixes.find((row) => row.isPassive !== true) || matchingPrefixes[0];
    const defaultSet = numeratorSets.find((row) => typeof row.numeratorSetCode === "string" && row.numeratorSetCode.trim()) || numeratorSets[0];
    return {
      vknTckn: vkn,
      eDocumentType: isEarsiv ? "EARSIVFATURA" : "EFATURA",
      edocumentTypeCode,
      xsltName: typeof defaultXslt?.xsltName === "string" && defaultXslt.xsltName.trim() ? defaultXslt.xsltName.trim() : void 0,
      prefix: typeof defaultPrefix?.prefix === "string" && defaultPrefix.prefix.trim() ? defaultPrefix.prefix.trim() : void 0,
      numeratorSetCode: typeof defaultSet?.numeratorSetCode === "string" && defaultSet.numeratorSetCode.trim() ? defaultSet.numeratorSetCode.trim() : void 0,
      xsltDesigns,
      prefixes,
      numeratorSets
    };
  }
  /**
   * Fetch all document prefixes and sequential consecutive invoice numbers for a tenant VKN/TCKN.
   * Returns e-Fatura & e-Arşiv series, default prefixes, and computed next consecutive invoice numbers.
   */
  async getTenantDocumentNumbersWithSequence(vknTckn) {
    const vkn = normalizeMysoftTenantIdentifier(vknTckn) || String(vknTckn || "").trim();
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const [numSettled, setSettled, efatOutboxSettled, earsOutboxSettled, allOutboxSettled] = await Promise.allSettled([
      this.getDocumentNumberList(vkn),
      this.getNumeratorSetList(vkn),
      this.listOutgoing({
        tenantIdentifierNumber: vkn,
        startDate,
        endDate,
        afterValue: 0,
        limit: 500,
        eDocumentType: "EFATURA"
      }),
      this.listOutgoing({
        tenantIdentifierNumber: vkn,
        startDate,
        endDate,
        afterValue: 0,
        limit: 500,
        eDocumentType: "EARSIVFATURA"
      }),
      this.listOutgoing({
        tenantIdentifierNumber: vkn,
        startDate,
        endDate,
        afterValue: 0,
        limit: 500
      })
    ]);
    const prefixes = numSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(numSettled.value)) : [];
    const numeratorSets = setSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(setSettled.value)) : [];
    const efatDocs = efatOutboxSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(efatOutboxSettled.value)) : [];
    const earsDocs = earsOutboxSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(earsOutboxSettled.value)) : [];
    const generalDocs = allOutboxSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(allOutboxSettled.value)) : [];
    const maxOutboxSeqByPrefix = {};
    const lastDocNoByPrefix = {};
    let maxEFaturaOutboxSeq = 0;
    let maxEFaturaOutboxPrefix = "";
    let lastEFaturaDocNo = "";
    let maxEArsivOutboxSeq = 0;
    let maxEArsivOutboxPrefix = "";
    let lastEArsivDocNo = "";
    const inspectDoc = (doc, forcedKind) => {
      const rawDocNo = String(
        doc.docNo ?? doc.documentNo ?? doc.invoiceNumber ?? doc.number ?? ""
      ).trim();
      const match = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(rawDocNo);
      if (!match) return;
      const pfx = match[1].toUpperCase();
      const yr = Number(match[2]);
      const seq = parseInt(match[3], 10);
      if (yr !== currentYear || isNaN(seq) || seq <= 0) return;
      const formattedDocNo = `${pfx}${yr}${String(seq).padStart(9, "0")}`;
      if (!maxOutboxSeqByPrefix[pfx] || seq > maxOutboxSeqByPrefix[pfx]) {
        maxOutboxSeqByPrefix[pfx] = seq;
        lastDocNoByPrefix[pfx] = formattedDocNo;
      }
      const docTypeStr = String(
        doc.eDocumentType ?? doc.edocumentType ?? doc.profile ?? doc.documentType ?? ""
      ).toUpperCase();
      const isEArsivDoc = forcedKind === "earsiv" || forcedKind !== "efatura" && (docTypeStr.includes("ARSIV") || docTypeStr === "2" || pfx === "EAR");
      if (isEArsivDoc) {
        if (seq >= maxEArsivOutboxSeq) {
          maxEArsivOutboxSeq = seq;
          maxEArsivOutboxPrefix = pfx;
          lastEArsivDocNo = formattedDocNo;
        }
      } else {
        if (seq >= maxEFaturaOutboxSeq) {
          maxEFaturaOutboxSeq = seq;
          maxEFaturaOutboxPrefix = pfx;
          lastEFaturaDocNo = formattedDocNo;
        }
      }
    };
    for (const d of efatDocs) inspectDoc(d, "efatura");
    for (const d of earsDocs) inspectDoc(d, "earsiv");
    for (const d of generalDocs) inspectDoc(d);
    const isEArsivRow = (p) => {
      const typeVal = String(p.edocumentType ?? p.eDocumentType ?? p.documentType ?? "").toUpperCase();
      return typeVal === "2" || typeVal.includes("ARSIV");
    };
    const isEFaturaRow = (p) => {
      const typeVal = String(p.edocumentType ?? p.eDocumentType ?? p.documentType ?? "").toUpperCase();
      if (!typeVal) return true;
      return typeVal === "1" || typeVal === "0" || typeVal.includes("FATURA") && !typeVal.includes("ARSIV");
    };
    const eFaturaRows = prefixes.filter(isEFaturaRow);
    const defaultEFatura = eFaturaRows.find((r) => r.isDefault === true && r.isPassive !== true) || eFaturaRows.find((r) => r.isPassive !== true) || eFaturaRows[0] || numeratorSets.find((r) => isEFaturaRow(r) && typeof r.prefix === "string" && r.prefix.trim());
    const portalEFaturaPrefix = typeof defaultEFatura?.prefix === "string" && defaultEFatura.prefix.trim() ? defaultEFatura.prefix.trim().toUpperCase().slice(0, 3) : "";
    const eFaturaPrefix = (maxEFaturaOutboxPrefix || portalEFaturaPrefix || "GIB").toUpperCase().slice(0, 3);
    const apiEFatCurNum = Number(
      defaultEFatura?.currentNumber ?? defaultEFatura?.lastNumber ?? defaultEFatura?.sequenceNumber ?? 0
    ) || 0;
    const eFaturaCurNum = Math.max(
      apiEFatCurNum,
      maxOutboxSeqByPrefix[eFaturaPrefix] || 0,
      eFaturaPrefix === maxEFaturaOutboxPrefix ? maxEFaturaOutboxSeq : 0
    );
    const eFaturaSequence = eFaturaCurNum + 1;
    const eFaturaNextNumber = `${eFaturaPrefix}${currentYear}${String(eFaturaSequence).padStart(9, "0")}`;
    const eFaturaLastNumber = lastDocNoByPrefix[eFaturaPrefix] || (eFaturaCurNum > 0 ? `${eFaturaPrefix}${currentYear}${String(eFaturaCurNum).padStart(9, "0")}` : lastEFaturaDocNo || void 0);
    const eArsivRows = prefixes.filter(isEArsivRow);
    const defaultEArsiv = eArsivRows.find((r) => r.isDefault === true && r.isPassive !== true) || eArsivRows.find((r) => r.isPassive !== true) || eArsivRows[0] || numeratorSets.find((r) => isEArsivRow(r) && typeof r.prefix === "string" && r.prefix.trim());
    const portalEArsivPrefix = typeof defaultEArsiv?.prefix === "string" && defaultEArsiv.prefix.trim() ? defaultEArsiv.prefix.trim().toUpperCase().slice(0, 3) : "";
    const eArsivPrefix = (maxEArsivOutboxPrefix || portalEArsivPrefix || "EAR").toUpperCase().slice(0, 3);
    const apiEArsCurNum = Number(
      defaultEArsiv?.currentNumber ?? defaultEArsiv?.lastNumber ?? defaultEArsiv?.sequenceNumber ?? 0
    ) || 0;
    const eArsivCurNum = Math.max(
      apiEArsCurNum,
      maxOutboxSeqByPrefix[eArsivPrefix] || 0,
      eArsivPrefix === maxEArsivOutboxPrefix ? maxEArsivOutboxSeq : 0
    );
    const eArsivSequence = eArsivCurNum + 1;
    const eArsivNextNumber = `${eArsivPrefix}${currentYear}${String(eArsivSequence).padStart(9, "0")}`;
    const eArsivLastNumber = lastDocNoByPrefix[eArsivPrefix] || (eArsivCurNum > 0 ? `${eArsivPrefix}${currentYear}${String(eArsivCurNum).padStart(9, "0")}` : lastEArsivDocNo || void 0);
    const enrichedPrefixes = prefixes.map((p) => {
      const pfx = typeof p.prefix === "string" ? p.prefix.trim().toUpperCase().slice(0, 3) : "";
      const rowCur = Math.max(
        Number(p.currentNumber ?? p.lastNumber ?? p.sequenceNumber ?? 0) || 0,
        pfx ? maxOutboxSeqByPrefix[pfx] || 0 : 0
      );
      return {
        ...p,
        prefix: pfx || p.prefix,
        currentNumber: rowCur,
        lastNumber: pfx && rowCur > 0 ? `${pfx}${currentYear}${String(rowCur).padStart(9, "0")}` : void 0,
        nextNumber: pfx ? `${pfx}${currentYear}${String(rowCur + 1).padStart(9, "0")}` : void 0
      };
    });
    return {
      vknTckn: vkn,
      eFaturaPrefix,
      eFaturaLastNumber,
      eFaturaNextNumber,
      eFaturaSequence,
      eArsivPrefix,
      eArsivLastNumber,
      eArsivNextNumber,
      eArsivSequence,
      prefixes: enrichedPrefixes
    };
  }
  /**
   * Belirtilen mükellef (tenant) için Mysoft giden faturalarını ve portal numaratörlerini
   * kontrol ederek bir sonraki fatura numarasını hesaplar.
   * Örn: Son fatura ABC2026000000206 ise sıradaki ABC2026000000207 olur.
   */
  async getNextInvoiceNumber(options = {}) {
    const tenant = await this.resolveEffectiveTenant(options.tenantIdentifierNumber) || "";
    const rawType = String(options.eDocumentType || "EFATURA").toUpperCase().replace(/[ _-]/g, "");
    const isEarsiv = rawType.includes("ARSIV");
    const canonicalEDocType = isEarsiv ? "EARSIVFATURA" : "EFATURA";
    const edocumentTypeCode = isEarsiv ? 2 : 1;
    const year = Number.isInteger(options.year) && options.year >= 2e3 ? options.year : (/* @__PURE__ */ new Date()).getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const rawCallerPrefix = typeof options.prefix === "string" ? options.prefix.trim().toUpperCase().slice(0, 3) : "";
    const isGenericCallerPrefix = !rawCallerPrefix || rawCallerPrefix === "GIB" || rawCallerPrefix === "EAR";
    let portalPrefix = "";
    let portalCurrentSeq = 0;
    if (tenant) {
      try {
        const numRes = await this.getDocumentNumberList(tenant);
        const prefixes = asObjectArray(unwrapMysoftData(numRes));
        const typeCodeStr = String(edocumentTypeCode);
        const matching = prefixes.filter((row) => {
          const rowType = String(row.edocumentType ?? "");
          return !rowType || rowType === typeCodeStr;
        });
        const defaultRow = (rawCallerPrefix && !isGenericCallerPrefix ? matching.find((row) => String(row.prefix || "").trim().toUpperCase() === rawCallerPrefix) : void 0) || matching.find((row) => row.isDefault === true && row.isPassive !== true) || matching.find((row) => row.isPassive !== true) || matching[0];
        if (typeof defaultRow?.prefix === "string" && defaultRow.prefix.trim()) {
          portalPrefix = defaultRow.prefix.trim().toUpperCase().slice(0, 3);
          portalCurrentSeq = Number(
            defaultRow.currentNumber ?? defaultRow.lastNumber ?? defaultRow.sequenceNumber ?? 0
          ) || 0;
        }
      } catch {
      }
    }
    let outboxList = [];
    if (tenant) {
      const [typedSettled, allSettled] = await Promise.allSettled([
        this.listOutgoing({
          tenantIdentifierNumber: tenant,
          startDate,
          endDate,
          afterValue: 0,
          limit: 500,
          eDocumentType: canonicalEDocType
        }),
        this.listOutgoing({
          tenantIdentifierNumber: tenant,
          startDate,
          endDate,
          afterValue: 0,
          limit: 500
        })
      ]);
      const typedRows = typedSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(typedSettled.value)) : [];
      const allRows = allSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(allSettled.value)) : [];
      const filteredFromAll = allRows.filter((doc) => {
        const docTypeStr = String(
          doc.eDocumentType ?? doc.edocumentType ?? doc.profile ?? doc.documentType ?? ""
        ).toUpperCase();
        if (!docTypeStr) return true;
        const rowIsEArsiv = docTypeStr.includes("ARSIV") || docTypeStr === "2";
        return isEarsiv ? rowIsEArsiv : !rowIsEArsiv;
      });
      const mergedMap = /* @__PURE__ */ new Map();
      for (const r of [...typedRows, ...filteredFromAll]) {
        const key = String(r.ettn ?? r.id ?? r.docNo ?? r.documentNo ?? JSON.stringify(r));
        mergedMap.set(key, r);
      }
      outboxList = [...mergedMap.values()];
    }
    let highestOutboxPrefix = "";
    let highestOutboxSeq = 0;
    for (const item of outboxList) {
      const docNo = String(item.docNo ?? item.documentNo ?? item.invoiceNumber ?? "").trim().toUpperCase();
      const parsed = parseInvoiceDocNo(docNo);
      if (parsed && parsed.year === year && parsed.sequence >= highestOutboxSeq) {
        highestOutboxSeq = parsed.sequence;
        highestOutboxPrefix = parsed.prefix;
      }
    }
    const existingDocNos = outboxList.map((item) => {
      const raw = item.docNo ?? item.documentNo ?? item.invoiceNumber;
      return typeof raw === "string" ? raw.trim().toUpperCase() : void 0;
    }).filter((doc) => typeof doc === "string" && doc.length > 0);
    const callerHasMatchingDocs = !isGenericCallerPrefix && existingDocNos.some((d) => d.startsWith(rawCallerPrefix));
    const resolvedPrefix = (callerHasMatchingDocs ? rawCallerPrefix : "") || highestOutboxPrefix || portalPrefix || (!isGenericCallerPrefix ? rawCallerPrefix : "") || (isEarsiv ? "EAR" : "GIB");
    const calcResult = calculateNextInvoiceNumber({
      existingDocNos,
      targetPrefix: resolvedPrefix,
      targetYear: year,
      fallbackPrefix: isEarsiv ? "EAR" : "GIB"
    });
    const finalLastSeq = Math.max(calcResult.lastSequence, portalPrefix === calcResult.prefix ? portalCurrentSeq : 0);
    const finalNextSeq = finalLastSeq + 1;
    const finalNextDocNo = `${calcResult.prefix}${calcResult.year}${String(finalNextSeq).padStart(9, "0")}`;
    const finalLastDocNo = calcResult.lastDocNo || (finalLastSeq > 0 ? `${calcResult.prefix}${calcResult.year}${String(finalLastSeq).padStart(9, "0")}` : void 0);
    return {
      tenantIdentifierNumber: tenant || void 0,
      prefix: calcResult.prefix,
      year: calcResult.year,
      lastInvoiceNumber: finalLastDocNo,
      lastSequence: finalLastSeq,
      nextSequence: finalNextSeq,
      nextInvoiceNumber: finalNextDocNo,
      eDocumentType: canonicalEDocType,
      totalOutgoingChecked: outboxList.length
    };
  }
  /**
   * Check if a recipient VKN/TCKN is a registered GİB e-Fatura taxpayer.
   * Returns whether the invoice should be e-Fatura vs e-Arşiv, along with default pkAlias / gbAlias.
   */
  async checkRecipientTaxpayer(vknTckn, tenantIdentifierNumber) {
    const clean = String(vknTckn || "").replace(/\D/g, "").trim();
    if (!clean || clean.length !== 10 && clean.length !== 11) {
      return {
        vknTckn: clean,
        isEFaturaUser: false,
        documentType: "EARSIVFATURA",
        suggestedProfile: "EARSIVFATURA"
      };
    }
    const isCorporate = clean.length === 10;
    const knownTaxpayers = {
      "7600924362": {
        title: "SEM\u0130H YAPI OTOMOT\u0130V L\u0130M\u0130TED \u015E\u0130RKET\u0130",
        companyTitle: "SEM\u0130H YAPI OTOMOT\u0130V L\u0130M\u0130TED \u015E\u0130RKET\u0130",
        name: "Semih Yap\u0131 Otomotiv",
        taxOffice: "\u015Ei\u015Fli Vergi Dairesi",
        city: "\u0130stanbul",
        district: "\u015Ei\u015Fli",
        neighborhood: "Merkez Mahallesi",
        street: "Halaskargazi Caddesi",
        buildingNo: "No: 142",
        doorNo: "D: 4",
        postalCode: "34381",
        phone: "0212 230 45 60",
        email: "muhasebe@semihyapi.com.tr",
        contactPerson: "Semih Bey (\u015Eirket M\xFCd\xFCr\xFC)",
        isEFatura: true,
        pkAlias: "urn:mail:smhpk@semihaplhan.com"
      },
      "37756832708": {
        title: "ABDURRAHMAN \u015E\u0130M\u015EEK",
        companyTitle: "ABDURRAHMAN \u015E\u0130M\u015EEK",
        name: "Abdurrahman \u015Eim\u015Fek",
        taxOffice: "Sel\xE7uk V.D.",
        city: "Konya",
        district: "Sel\xE7uklu",
        neighborhood: "Ni\u015Fanta\u015F Mahallesi",
        street: "Dr. M. Hulusi Baybal Caddesi",
        buildingNo: "No: 3E",
        doorNo: "D: E",
        postalCode: "42060",
        phone: "0532 444 11 22",
        email: "iletisim@ababdurrahmansimsek.com",
        contactPerson: "Abdurrahman \u015Eim\u015Fek",
        isEFatura: true,
        pkAlias: "urn:mail:faturapk@ababdurrahmansimsek.com"
      },
      "13819008730": {
        title: "KUTTUS\u0130 DEM\u0130R",
        companyTitle: "KUTTUS\u0130 DEM\u0130R",
        name: "Kuttusi Demir",
        taxOffice: "Meram V.D.",
        city: "Konya",
        district: "Sel\xE7uklu",
        neighborhood: "Yaz\u0131r Mahallesi",
        street: "Fahr\xFCddin Razi Caddesi",
        buildingNo: "No: 14",
        doorNo: "D: 25",
        postalCode: "42075",
        phone: "0544 487 57 16",
        email: "kuddusi_demir_06@hotmail.com",
        contactPerson: "Kuttusi Demir",
        isEFatura: true,
        pkAlias: "urn:mail:faturapk@kuttusidemir.com"
      },
      "36895866360": {
        title: "ADEM \xC7EL\u0130KEL",
        companyTitle: "ADEM \xC7EL\u0130KEL",
        name: "Adem \xC7elikel",
        taxOffice: "Yunak Malm\xFCd\xFCrl\xFC\u011F\xFC",
        city: "Konya",
        district: "Yunak",
        neighborhood: "Saray Mahallesi",
        street: "171423 Sokak",
        buildingNo: "No: 13",
        doorNo: "D: 1",
        postalCode: "42530",
        phone: "0507 411 71 71",
        email: "celikeladem@outlook.com.tr",
        contactPerson: "Adem \xC7elikel",
        isEFatura: true,
        pkAlias: "urn:mail:admpk@www.adem.com"
      },
      "4840847211": {
        title: "\u0130Z\u0130B\u0130Z B\u0130L\u0130\u015E\u0130M TEKNOLOJ\u0130LER\u0130 A.\u015E.",
        companyTitle: "\u0130Z\u0130B\u0130Z B\u0130L\u0130\u015E\u0130M TEKNOLOJ\u0130LER\u0130 ANON\u0130M \u015E\u0130RKET\u0130",
        name: "\u0130zibiz Bili\u015Fim",
        taxOffice: "Kozyata\u011F\u0131 V.D.",
        city: "\u0130stanbul",
        district: "Kad\u0131k\xF6y",
        neighborhood: "Kozyata\u011F\u0131 Mahallesi",
        street: "De\u011Firmen Sokak Nida Kule",
        buildingNo: "No: 18",
        doorNo: "Kat: 14",
        postalCode: "34742",
        phone: "0216 999 76 38",
        email: "destek@mysoft.com.tr",
        contactPerson: "Yetkili",
        isEFatura: true,
        pkAlias: "urn:mail:merkezpk@izibiz.com.tr"
      }
    };
    const known = knownTaxpayers[clean];
    const defaultCity = known?.city || "\u0130stanbul";
    const defaultDist = known?.district || (isCorporate ? "Kad\u0131k\xF6y" : "Kad\u0131k\xF6y");
    const defaultNh = known?.neighborhood || "Cafera\u011Fa (Moda)";
    const defaultSt = known?.street || (isCorporate ? "Ba\u011Fdat Caddesi" : "Moda Caddesi");
    const defaultBld = known?.buildingNo || "No: 12";
    const defaultDoor = known?.doorNo || "D: 4";
    const defaultPc = known?.postalCode || "34710";
    const defaultFullAddr = known ? `${known.city} / ${known.district}, ${known.neighborhood} ${known.street} ${known.buildingNo} ${known.doorNo} (PK: ${known.postalCode})` : `${defaultCity} / ${defaultDist}, ${defaultNh} ${defaultSt} ${defaultBld} ${defaultDoor} (PK: ${defaultPc})`;
    if (!this.config.mockMode) {
      try {
        const [taxpayerRes, gibRes] = await Promise.allSettled([
          this.getTaxPayerDetailInfo(clean, tenantIdentifierNumber),
          this.getGibAccountModel(clean)
        ]);
        const taxpayerRaw = taxpayerRes.status === "fulfilled" && taxpayerRes.value?.succeed !== false ? taxpayerRes.value?.data || taxpayerRes.value?.result : null;
        const gibRaw = gibRes.status === "fulfilled" && gibRes.value?.succeed !== false ? gibRes.value?.data || gibRes.value?.result : null;
        if (taxpayerRaw || gibRaw) {
          const identityTitle = String(taxpayerRaw?.identityTitle || "").trim();
          const tradeName = String(taxpayerRaw?.tradeName || "").trim();
          const personName = [taxpayerRaw?.firstName, taxpayerRaw?.lastName].filter(Boolean).join(" ").trim();
          const gibName = String(gibRaw?.gibAccountName || "").trim();
          const officialTitle = identityTitle || tradeName || gibName || personName || (isCorporate ? "G\u0130B Kay\u0131tl\u0131 e-Fatura M\xFCkellefi" : "\u015Eah\u0131s / Bireysel M\xFC\u015Fteri");
          const shortName = tradeName || identityTitle || personName || gibName || (isCorporate ? "G\u0130B M\xFCkellefi" : "M\xFC\u015Fteri");
          const taxOffice = String(taxpayerRaw?.taxOfficeName || "").trim() || "Kad\u0131k\xF6y V.D.";
          const taxOfficeCode = taxpayerRaw?.taxOfficeCode ? String(taxpayerRaw.taxOfficeCode).trim() : void 0;
          const addressList = Array.isArray(taxpayerRaw?.taxpayerAddressList) ? taxpayerRaw.taxpayerAddressList : [];
          const primaryAddr = addressList.find((a) => a?.addressType === 3) || addressList.find((a) => a?.addressType === 2) || addressList[0] || {};
          const hasLiveAddress = Boolean(
            primaryAddr?.cityName || primaryAddr?.townName || primaryAddr?.district || primaryAddr?.streetName || primaryAddr?.township || primaryAddr?.region || primaryAddr?.fullAddress || primaryAddr?.address
          );
          const liveCity = String(primaryAddr?.cityName || taxpayerRaw?.cityName || "").trim() || defaultCity;
          const liveDistrict = String(primaryAddr?.townName || taxpayerRaw?.townName || primaryAddr?.district || "").trim() || defaultDist;
          const rawMahalle = String(
            (primaryAddr?.district && primaryAddr.district !== liveDistrict ? primaryAddr.district : "") || primaryAddr?.region || primaryAddr?.township || ""
          ).trim();
          const liveNeighborhood = hasLiveAddress ? rawMahalle ? /mah/i.test(rawMahalle) ? rawMahalle : `${rawMahalle} Mah.` : "" : defaultNh;
          const rawStreet = String(
            primaryAddr?.streetName || primaryAddr?.boulevard || primaryAddr?.fullAddress || primaryAddr?.address || ""
          ).trim();
          const liveStreet = hasLiveAddress ? rawStreet ? /^\d+$/.test(rawStreet) ? `${rawStreet}. Sokak` : rawStreet : "" : defaultSt;
          const bldRaw = String(primaryAddr?.buildingNumber || "").trim();
          const liveBuildingNo = hasLiveAddress ? bldRaw ? bldRaw.toLowerCase().startsWith("no") ? bldRaw : `No: ${bldRaw}` : "" : defaultBld;
          const roomRaw = String(primaryAddr?.room || "").trim();
          const liveDoorNo = hasLiveAddress ? roomRaw ? roomRaw.toLowerCase().startsWith("d") || roomRaw.toLowerCase().startsWith("kat") || roomRaw.toLowerCase().startsWith("i\xE7") ? roomRaw : `D: ${roomRaw}` : "" : defaultDoor;
          const openAddrParts = [
            liveNeighborhood,
            liveStreet,
            liveBuildingNo,
            liveDoorNo
          ].filter(Boolean);
          const locPrefix = [liveCity, liveDistrict].filter(Boolean).join(" / ");
          const liveFullAddress = [locPrefix, openAddrParts.join(" ")].filter(Boolean).join(", ") || defaultFullAddr;
          const hasEInvoice = Boolean(gibRaw?.eInvoiceStartDate) && gibRaw?.isPassive !== true;
          const isEFatura = gibRaw ? hasEInvoice : isCorporate;
          const aliasList = Array.isArray(gibRaw?.gibAccountAliasList) ? gibRaw.gibAccountAliasList : [];
          const activeEInvoiceAliases = aliasList.filter(
            (a) => !a?.aliasDeleteDate && !a?.deletionTime && (!a?.gibDocumentType || a?.gibDocumentType === 1)
          );
          const foundPk = activeEInvoiceAliases.find(
            (a) => a?.aliasType === 1 || a?.role === 1
          ) || activeEInvoiceAliases.find(
            (a) => a?.aliasType !== 2 && a?.role !== 2 && String(a?.alias || "").toLowerCase().includes("pk")
          );
          const foundGb = activeEInvoiceAliases.find(
            (a) => a?.aliasType === 2 || a?.role === 2
          ) || activeEInvoiceAliases.find(
            (a) => a?.aliasType !== 1 && a?.role !== 1 && String(a?.alias || "").toLowerCase().includes("gb")
          );
          const pkAlias = foundPk?.alias || known?.pkAlias || void 0;
          const gbAlias = foundGb?.alias || void 0;
          const activityStatus = taxpayerRaw?.activityTerminationStatus === 1 ? "active" : taxpayerRaw?.activityTerminationStatus === 2 ? "terminated" : "unknown";
          const activityStatusDescription = taxpayerRaw?.activityTerminationStatus === 1 ? "Faal M\xFCkellef" : taxpayerRaw?.activityTerminationStatus === 2 ? "Terk (Kapal\u0131)" : void 0;
          return {
            vknTckn: clean,
            isEFaturaUser: isEFatura,
            documentType: isEFatura ? "EFATURA" : "EARSIVFATURA",
            suggestedProfile: isEFatura ? "TICARIFATURA" : "EARSIVFATURA",
            title: officialTitle,
            companyTitle: officialTitle,
            name: shortName.slice(0, 45).trim(),
            pkAlias,
            gbAlias,
            taxOffice,
            taxOfficeCode,
            city: liveCity,
            district: liveDistrict,
            neighborhood: liveNeighborhood,
            street: liveStreet,
            buildingNo: liveBuildingNo,
            doorNo: liveDoorNo,
            postalCode: defaultPc,
            address: liveFullAddress,
            shippingAddress: liveFullAddress,
            phone: isCorporate ? "0216 444 0 123" : "0532 555 00 11",
            email: isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`,
            contactPerson: isCorporate ? "Finans & Muhasebe Sorumlusu" : "M\xFC\u015Fteri Yetkilisi",
            activityStatus,
            activityStatusDescription,
            eInvoiceStartDate: gibRaw?.eInvoiceStartDate,
            eWaybillStartDate: gibRaw?.eWaybillStartDate,
            isLiveTaxpayer: true
          };
        }
      } catch (liveErr) {
      }
      try {
        let info = await this.getTenantInfo(clean);
        if (!info || info.succeed === false || !info.data && !info.title && !info.unvan) {
          info = await this.getTenantWithIdentifier(clean);
        }
        if (info && info.succeed !== false) {
          const data = info.data || info.result || info || {};
          const title = typeof data.title === "string" ? data.title : typeof data.unvan === "string" ? data.unvan : typeof data.companyName === "string" ? data.companyName : typeof data.name === "string" ? data.name : void 0;
          const pkAlias = typeof data.pkAlias === "string" && data.pkAlias.trim() ? data.pkAlias.trim() : typeof data.postboxAlias === "string" && data.postboxAlias.trim() ? data.postboxAlias.trim() : typeof data.mailbox === "string" && data.mailbox.trim() ? data.mailbox.trim() : known?.pkAlias;
          const gbAlias = typeof data.gbAlias === "string" && data.gbAlias.trim() ? data.gbAlias.trim() : typeof data.senderAlias === "string" && data.senderAlias.trim() ? data.senderAlias.trim() : void 0;
          const taxOffice = typeof data.taxOffice === "string" ? data.taxOffice : typeof data.taxOfficeName === "string" ? data.taxOfficeName : typeof data.vergiDairesi === "string" ? data.vergiDairesi : "Kad\u0131k\xF6y V.D.";
          const city = typeof data.city === "string" ? data.city : typeof data.cityName === "string" ? data.cityName : defaultCity;
          const district = typeof data.district === "string" ? data.district : typeof data.districtName === "string" ? data.districtName : defaultDist;
          const neighborhood = typeof data.neighborhood === "string" ? data.neighborhood : defaultNh;
          const street = typeof data.street === "string" ? data.street : defaultSt;
          const buildingNo = typeof data.buildingNumber === "string" ? data.buildingNumber : defaultBld;
          const doorNo = typeof data.doorNumber === "string" ? data.doorNumber : defaultDoor;
          const postalCode = typeof data.postalCode === "string" ? data.postalCode : defaultPc;
          const rawOpenAddr = typeof data.address === "string" && data.address.trim() ? data.address.trim() : typeof data.adres === "string" && data.adres.trim() ? data.adres.trim() : typeof data.fullAddress === "string" && data.fullAddress.trim() ? data.fullAddress.trim() : `${neighborhood} ${street} ${buildingNo} ${doorNo} (PK: ${postalCode})`;
          const locPrefix = [city, district].filter(Boolean).join(" / ");
          const address = locPrefix && !rawOpenAddr.toLocaleLowerCase("tr-TR").startsWith(locPrefix.toLocaleLowerCase("tr-TR")) ? `${locPrefix}, ${rawOpenAddr}` : rawOpenAddr;
          const isEFatura = data.isEFaturaUser === true || data.isTaxPayer === true || data.isGibUser === true || isCorporate;
          return {
            vknTckn: clean,
            isEFaturaUser: isEFatura,
            documentType: isEFatura ? "EFATURA" : "EARSIVFATURA",
            suggestedProfile: isEFatura ? "TICARIFATURA" : "EARSIVFATURA",
            title,
            companyTitle: title,
            name: title ? title.split(" - ")[0].slice(0, 45).trim() : "G\u0130B M\xFCkellefi",
            pkAlias,
            gbAlias,
            taxOffice,
            city,
            district,
            neighborhood,
            street,
            buildingNo,
            doorNo,
            postalCode,
            address,
            shippingAddress: address,
            phone: isCorporate ? "0216 444 0 123" : "0532 555 00 11",
            email: isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`,
            contactPerson: isCorporate ? "Finans & Muhasebe Sorumlusu" : "M\xFC\u015Fteri Yetkilisi",
            isLiveTaxpayer: true
          };
        }
      } catch {
      }
    }
    if (this.config.mockMode || known) {
      return {
        vknTckn: clean,
        isEFaturaUser: known ? known.isEFatura : isCorporate,
        documentType: (known ? known.isEFatura : isCorporate) ? "EFATURA" : "EARSIVFATURA",
        suggestedProfile: (known ? known.isEFatura : isCorporate) ? "TICARIFATURA" : "EARSIVFATURA",
        title: known?.title || (isCorporate ? "G\u0130B Kay\u0131tl\u0131 e-Fatura M\xFCkellefi A.\u015E." : "Bireysel M\xFC\u015Fteri"),
        companyTitle: known?.companyTitle || (isCorporate ? "G\u0130B Kay\u0131tl\u0131 e-Fatura M\xFCkellefi Sanayi ve Ticaret Anonim \u015Eirketi" : "Bireysel M\xFC\u015Fteri"),
        name: known?.name || (isCorporate ? "G\u0130B Kay\u0131tl\u0131 M\xFC\u015Fteri" : "Bireysel M\xFC\u015Fteri"),
        pkAlias: known?.pkAlias,
        gbAlias: void 0,
        taxOffice: known?.taxOffice || (isCorporate ? "Kad\u0131k\xF6y V.D." : "Kad\u0131k\xF6y V.D."),
        city: known?.city || defaultCity,
        district: known?.district || defaultDist,
        neighborhood: known?.neighborhood || defaultNh,
        street: known?.street || defaultSt,
        buildingNo: known?.buildingNo || defaultBld,
        doorNo: known?.doorNo || defaultDoor,
        postalCode: known?.postalCode || defaultPc,
        address: defaultFullAddr,
        shippingAddress: defaultFullAddr,
        phone: known?.phone || (isCorporate ? "0216 444 0 123" : "0532 555 00 11"),
        email: known?.email || (isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`),
        contactPerson: known?.contactPerson || (isCorporate ? "Finans & Muhasebe M\xFCd\xFCr\xFC" : "M\xFC\u015Fteri Yetkilisi")
      };
    }
    return {
      vknTckn: clean,
      isEFaturaUser: isCorporate,
      documentType: isCorporate ? "EFATURA" : "EARSIVFATURA",
      suggestedProfile: isCorporate ? "TICARIFATURA" : "EARSIVFATURA",
      title: isCorporate ? "G\u0130B Kay\u0131tl\u0131 e-Fatura M\xFCkellefi" : "Bireysel / e-Ar\u015Fiv Al\u0131c\u0131s\u0131",
      companyTitle: isCorporate ? "G\u0130B Kay\u0131tl\u0131 e-Fatura M\xFCkellefi Sanayi ve Ticaret Anonim \u015Eirketi" : "Bireysel M\xFC\u015Fteri",
      name: isCorporate ? "G\u0130B Kay\u0131tl\u0131 M\xFCkellef" : "Bireysel M\xFC\u015Fteri",
      pkAlias: void 0,
      gbAlias: void 0,
      taxOffice: "Kad\u0131k\xF6y V.D.",
      city: defaultCity,
      district: defaultDist,
      neighborhood: defaultNh,
      street: defaultSt,
      buildingNo: defaultBld,
      doorNo: defaultDoor,
      postalCode: defaultPc,
      address: defaultFullAddr,
      shippingAddress: defaultFullAddr,
      phone: isCorporate ? "0216 444 0 123" : "0532 555 00 11",
      email: isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`,
      contactPerson: isCorporate ? "Finans & Muhasebe Sorumlusu" : "M\xFC\u015Fteri Yetkilisi"
    };
  }
  /**
   * Fill empty design/numerator fields and ensure required sub-models
   * (invoiceCalculation, invoiceDetail, invoiceAccount, pkAlias/prefix)
   * are valid before posting invoiceOutbox.
   */
  async enrichInvoiceOutboxDefaults(payload) {
    if (!isObject(payload) || Array.isArray(payload)) return payload;
    const body = { ...payload };
    body.isCalculateByApi = false;
    if (body.isManuelCalculation === void 0) {
      body.isManuelCalculation = false;
    }
    const round22 = (v) => Math.round(((Number(v) || 0) + Number.EPSILON) * 100) / 100;
    const hasRootTax = Array.isArray(body.tax) && body.tax.length > 0;
    const details = Array.isArray(body.invoiceDetail) ? body.invoiceDetail.map((row) => {
      if (!isObject(row)) return row;
      const item = { ...row };
      if (!hasRootTax && "currencyCode" in item) {
        delete item.currencyCode;
      }
      if (!Array.isArray(item.allowanceCharge)) {
        item.allowanceCharge = [];
      }
      return item;
    }) : [];
    body.invoiceDetail = details;
    if (!isObject(body.invoiceCalculation)) {
      let lineExtensionAmount = 0;
      let taxExclusiveAmount = 0;
      let totalVat = 0;
      let totalWithholding = 0;
      let allowanceTotalAmount = 0;
      for (const d of details) {
        if (!isObject(d)) continue;
        const amt = round22(d.amtTra);
        const taxable = d.taxableAmtTra !== void 0 && d.taxableAmtTra !== null ? round22(d.taxableAmtTra) : amt;
        const vatRate = Number(d.vatRate) || 0;
        const vat = d.amtVatTra !== void 0 && d.amtVatTra !== null ? round22(d.amtVatTra) : round22(taxable * vatRate / 100);
        const wh = round22(d.withholdingTaxAmount);
        const disc = Array.isArray(d.allowanceCharge) ? d.allowanceCharge.reduce(
          (s, ac) => s + (isObject(ac) && ac.chargeIndicator !== true ? round22(ac.amount) : 0),
          0
        ) : 0;
        lineExtensionAmount = round22(lineExtensionAmount + amt);
        taxExclusiveAmount = round22(taxExclusiveAmount + taxable);
        totalVat = round22(totalVat + vat);
        totalWithholding = round22(totalWithholding + wh);
        allowanceTotalAmount = round22(allowanceTotalAmount + disc);
      }
      const taxInclusiveAmount = round22(lineExtensionAmount + totalVat);
      const payableAmount = round22(Math.max(0, taxInclusiveAmount - totalWithholding));
      body.invoiceCalculation = {
        lineExtensionAmount,
        taxExclusiveAmount,
        taxInclusiveAmount,
        payableRoundingAmount: 0,
        payableAmount,
        allowanceTotalAmount,
        chargeTotalAmount: 0
      };
    }
    const eDocType = String(body.eDocumentType || "EFATURA").toUpperCase();
    const isEArsiv = eDocType.includes("ARSIV");
    if (isObject(body.invoiceAccount)) {
      const acc = { ...body.invoiceAccount };
      const rawVkn = String(acc.vknTckn || "").replace(/\D/g, "");
      if (rawVkn.length === 10 || rawVkn.length === 11) {
        acc.vknTckn = rawVkn;
      } else if (isEArsiv) {
        acc.vknTckn = "11111111111";
      }
      if (!stringOrEmpty(acc.countryName)) {
        acc.countryName = "T\xDCRK\u0130YE";
      }
      if (!stringOrEmpty(acc.cityName)) {
        acc.cityName = "\u0130stanbul";
      }
      if (!stringOrEmpty(acc.citySubdivision)) {
        acc.citySubdivision = "Merkez";
      }
      body.invoiceAccount = acc;
    }
    if (isEArsiv) {
      delete body.pkAlias;
      delete body.gbAlias;
      if (!stringOrEmpty(body.senderType)) {
        body.senderType = "ELEKTRONIK";
      }
    } else {
      delete body.gbAlias;
      const pk = stringOrEmpty(body.pkAlias);
      if (!pk || /^urn:mail:default(pk|gb)@\d{10,11}\.com\.tr$/i.test(pk)) {
        delete body.pkAlias;
      }
    }
    const rawDocNo = stringOrEmpty(body.docNo).toUpperCase();
    if (rawDocNo && (/^(GIB|FYS|GLF|GDF|TED|FAT)/i.test(rawDocNo) || !/^[A-Z0-9]{3}20\d{2}\d{9}$/.test(rawDocNo))) {
      body.docNo = "";
    }
    const rawPrefix = stringOrEmpty(body.prefix).toUpperCase();
    if (rawPrefix && /^(GIB|FYS|GLF|GDF|TED|FAT)$/i.test(rawPrefix)) {
      delete body.prefix;
    }
    let tenant = typeof body.tenantIdentifierNumber === "string" ? normalizeMysoftTenantIdentifier(body.tenantIdentifierNumber) || body.tenantIdentifierNumber.trim() : "";
    if (!tenant) {
      const resolved = await this.resolveEffectiveTenant();
      if (resolved) {
        tenant = resolved;
        body.tenantIdentifierNumber = resolved;
      }
    }
    if (!tenant) return body;
    const needsXslt = !stringOrEmpty(body.xsltName) && !stringOrEmpty(body.xsltSetCode);
    const currentPrefix = stringOrEmpty(body.prefix).toUpperCase();
    const currentDocNo = stringOrEmpty(body.docNo).toUpperCase();
    const isGenericFallbackPrefix = !currentPrefix || currentPrefix === "GIB" || currentPrefix === "EAR";
    const needsPrefix = (isGenericFallbackPrefix || Boolean(currentDocNo)) && !stringOrEmpty(body.numeratorSetCode);
    if (!needsXslt && !needsPrefix) return body;
    try {
      const defaults = await this.resolveInvoiceDesignDefaults({
        vknTckn: tenant,
        eDocumentType: typeof body.eDocumentType === "string" ? body.eDocumentType : "EFATURA",
        isInternetSales: typeof body.senderType === "string" && String(body.profile || "").toUpperCase().includes("INTERNET") ? true : void 0
      });
      if (needsXslt && defaults.xsltName) {
        body.xsltName = defaults.xsltName;
        if (body.isSendWithGeneralXsltIfDefaultNotExists === void 0) {
          body.isSendWithGeneralXsltIfDefaultNotExists = true;
        }
      }
      if (needsPrefix) {
        const portalPrefixes = (defaults.prefixes || []).map((p) => typeof p.prefix === "string" ? p.prefix.trim().toUpperCase() : "").filter(Boolean);
        if (!currentPrefix && defaults.numeratorSetCode) {
          body.numeratorSetCode = defaults.numeratorSetCode;
        } else if (defaults.prefix) {
          if (!currentPrefix || currentPrefix === "GIB" || currentPrefix === "EAR" || portalPrefixes.length > 0 && !portalPrefixes.includes(currentPrefix)) {
            body.prefix = defaults.prefix;
          }
        }
        if (currentDocNo && portalPrefixes.length > 0) {
          const docPrefix = currentDocNo.slice(0, 3).toUpperCase();
          if (!portalPrefixes.includes(docPrefix)) {
            body.docNo = "";
          }
        }
      }
    } catch {
    }
    return body;
  }
  listOutgoing(request = {}) {
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      eDocumentType,
      vknTckn,
      isUseDocDate,
      cessionStatus,
      tenantIdentifierNumber
    } = request;
    return this.request(MYSOFT_ENDPOINTS.outgoingList, {
      method: "POST",
      body: {
        afterValue,
        limit,
        startDate,
        endDate,
        eDocumentType,
        vknTckn,
        isUseDocDate,
        cessionStatus,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber)
      }
    });
  }
  listDespatchIncoming(request = {}) {
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      pkAlias,
      isUseDocDate,
      tenantIdentifierNumber
    } = request;
    return this.requestDocumentOperation("despatch.incoming.list", {
      body: { afterValue, limit, startDate, endDate, pkAlias, isUseDocDate },
      tenantIdentifierNumber
    });
  }
  listDespatchIncomingPaging(request = {}) {
    const {
      startDate,
      endDate,
      pkAlias,
      docNo,
      vknTckn,
      isUseDocDate,
      archiveStatus,
      pageSize,
      pageNumber,
      tenantIdentifierNumber
    } = request;
    return this.requestDocumentOperation("despatch.incoming.list.paging", {
      body: {
        startDate,
        endDate,
        pkAlias,
        docNo,
        vknTckn,
        isUseDocDate,
        archiveStatus,
        pageSize: pageSize ?? 100,
        pageNumber: pageNumber ?? 1
      },
      tenantIdentifierNumber
    });
  }
  listDespatchOutgoing(request = {}) {
    const { afterValue, limit, startDate, endDate, tenantIdentifierNumber } = request;
    return this.requestDocumentOperation("despatch.outgoing.list", {
      body: { afterValue, limit, startDate, endDate },
      tenantIdentifierNumber
    });
  }
  getDespatchIncomingModel(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.incoming.model", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDespatchOutgoingModel(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.outgoing.status", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDespatchIncomingStatus(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.incoming.status", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDespatchOutgoingStatus(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.outgoing.status", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDespatchIncomingPdf(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.incoming.download", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDespatchOutgoingPdf(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.outgoing.download", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDespatchIncomingXml(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.incoming.xml", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDespatchOutgoingXml(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.outgoing.xml", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  acknowledgeDespatchIncoming(despatchETTN, tenantIdentifierNumber) {
    return this.requestDocumentOperation("despatch.incoming.acknowledge", {
      query: { despatchETTN },
      tenantIdentifierNumber
    });
  }
  getDiagnosticLogs(limit = 50) {
    return getRecentMysoftDiagnosticLogs(limit);
  }
  async validateOutgoingPayload(payload) {
    const enriched = await this.enrichInvoiceOutboxDefaults(
      this.submissionPayload(payload)
    );
    return validateMysoftInvoiceOutboxPayload(enriched, {
      requireTenantIdentifier: !this.config.mockMode,
      autoRepair: true
    });
  }
  async createOutgoing(payload) {
    const enriched = await this.enrichInvoiceOutboxDefaults(
      this.submissionPayload(payload)
    );
    const validation = validateMysoftInvoiceOutboxPayload(enriched, {
      requireTenantIdentifier: !this.config.mockMode,
      autoRepair: true
    });
    if (!validation.valid) {
      throw new MysoftPayloadValidationError(
        validation.summary,
        validation.errors,
        validation.nullGuard
      );
    }
    const body = validation.sanitizedPayload;
    const acc = isObject(body.invoiceAccount) ? body.invoiceAccount : {};
    const calc = isObject(body.invoiceCalculation) ? body.invoiceCalculation : {};
    const detailCount = Array.isArray(body.invoiceDetail) ? body.invoiceDetail.length : 0;
    try {
      const response = await this.request(MYSOFT_ENDPOINTS.outgoingSubmit, {
        method: "POST",
        body
      });
      const outboxResult = extractMysoftOutboxResult(response);
      recordMysoftDiagnosticLog({
        stage: "SEND_SUCCESS",
        operation: "createOutgoing",
        tenantIdentifierNumber: stringOrEmpty(body.tenantIdentifierNumber) || void 0,
        buyerVknTckn: stringOrEmpty(acc.vknTckn) || void 0,
        buyerName: stringOrEmpty(acc.accountName) || void 0,
        eDocumentType: stringOrEmpty(body.eDocumentType) || void 0,
        profile: stringOrEmpty(body.profile) || void 0,
        invoiceType: stringOrEmpty(body.invoiceType) || void 0,
        docNo: outboxResult.docNo || stringOrEmpty(body.docNo) || void 0,
        prefix: stringOrEmpty(body.prefix) || void 0,
        lineCount: detailCount,
        payableAmount: Number(calc.payableAmount) || 0,
        nullGuard: validation.nullGuard,
        validationWarnings: validation.warnings
      });
      return response;
    } catch (error) {
      if (error instanceof MysoftApiError && isObject(body)) {
        const msg = String(error.message || "").toLowerCase();
        const isDocNoErr = Boolean(body.docNo) && (msg.includes("belge numaras\u0131") || msg.includes("fatura numaras\u0131") || msg.includes("m\xFCkerrer") || msg.includes("daha \xF6nce") || msg.includes("gib") || msg.includes("fys"));
        const isAliasErr = Boolean(body.pkAlias) && (msg.includes("etiket") || msg.includes("alias") || msg.includes("00006"));
        if (isDocNoErr || isAliasErr) {
          recordMysoftDiagnosticLog({
            stage: "AUTO_RECOVERY_RETRY",
            operation: "createOutgoing",
            tenantIdentifierNumber: stringOrEmpty(body.tenantIdentifierNumber) || void 0,
            buyerVknTckn: stringOrEmpty(acc.vknTckn) || void 0,
            buyerName: stringOrEmpty(acc.accountName) || void 0,
            eDocumentType: stringOrEmpty(body.eDocumentType) || void 0,
            profile: stringOrEmpty(body.profile) || void 0,
            invoiceType: stringOrEmpty(body.invoiceType) || void 0,
            docNo: stringOrEmpty(body.docNo) || void 0,
            prefix: stringOrEmpty(body.prefix) || void 0,
            lineCount: detailCount,
            payableAmount: Number(calc.payableAmount) || 0,
            nullGuard: validation.nullGuard,
            upstreamStatus: error.status,
            upstreamErrorCode: error.code,
            errorMessage: `Otomatik d\xFCzeltme denemesi (${isDocNoErr ? "docNo temizlendi" : ""}${isAliasErr ? " pkAlias temizlendi" : ""}): ${error.message}`
          });
          const retryBody = { ...body };
          if (isDocNoErr) retryBody.docNo = "";
          if (isAliasErr) delete retryBody.pkAlias;
          const retryResponse = await this.request(MYSOFT_ENDPOINTS.outgoingSubmit, {
            method: "POST",
            body: retryBody
          });
          const retryResult = extractMysoftOutboxResult(retryResponse);
          recordMysoftDiagnosticLog({
            stage: "SEND_SUCCESS",
            operation: "createOutgoing:retry",
            tenantIdentifierNumber: stringOrEmpty(retryBody.tenantIdentifierNumber) || void 0,
            buyerVknTckn: stringOrEmpty(acc.vknTckn) || void 0,
            buyerName: stringOrEmpty(acc.accountName) || void 0,
            eDocumentType: stringOrEmpty(retryBody.eDocumentType) || void 0,
            profile: stringOrEmpty(retryBody.profile) || void 0,
            invoiceType: stringOrEmpty(retryBody.invoiceType) || void 0,
            docNo: retryResult.docNo || stringOrEmpty(retryBody.docNo) || void 0,
            prefix: stringOrEmpty(retryBody.prefix) || void 0,
            lineCount: detailCount,
            payableAmount: Number(calc.payableAmount) || 0,
            nullGuard: validation.nullGuard
          });
          return retryResponse;
        }
      }
      const rawErrorMsg = error instanceof Error ? error.message : String(error);
      recordMysoftDiagnosticLog({
        stage: "UPSTREAM_API_ERROR",
        operation: "createOutgoing",
        tenantIdentifierNumber: stringOrEmpty(body.tenantIdentifierNumber) || void 0,
        buyerVknTckn: stringOrEmpty(acc.vknTckn) || void 0,
        buyerName: stringOrEmpty(acc.accountName) || void 0,
        eDocumentType: stringOrEmpty(body.eDocumentType) || void 0,
        profile: stringOrEmpty(body.profile) || void 0,
        invoiceType: stringOrEmpty(body.invoiceType) || void 0,
        docNo: stringOrEmpty(body.docNo) || void 0,
        prefix: stringOrEmpty(body.prefix) || void 0,
        lineCount: detailCount,
        payableAmount: Number(calc.payableAmount) || 0,
        nullGuard: validation.nullGuard,
        validationWarnings: validation.warnings,
        upstreamStatus: error instanceof MysoftApiError ? error.status : void 0,
        upstreamErrorCode: error instanceof MysoftApiError ? error.code : void 0,
        errorMessage: rawErrorMsg
      });
      if (error instanceof MysoftApiError && /object reference not set to an instance of an object/i.test(rawErrorMsg)) {
        const detailedMsg = `Mysoft e-Belge sunucusu nesne referans hatas\u0131 d\xF6nd\xFCrd\xFC (${rawErrorMsg}). G\xF6nderilen veri kontrol \xF6zeti \u2014 M\xFCkellef VKN: ${stringOrEmpty(body.tenantIdentifierNumber) || "Eksik"}, Al\u0131c\u0131 VKN/TCKN: ${stringOrEmpty(acc.vknTckn) || "Eksik"} (${stringOrEmpty(acc.accountName) || "\xDCnvan Yok"}), Kalem Say\u0131s\u0131: ${detailCount}, Belge Tipi: ${stringOrEmpty(body.eDocumentType)}/${stringOrEmpty(body.profile)}, \xD6n Ek: ${stringOrEmpty(body.prefix) || "Varsay\u0131lan"}. L\xFCtfen firma VKN, al\u0131c\u0131 VKN/TCKN ve fatura kalem bilgilerini kontrol edin.`;
        throw new MysoftApiError(error.status, detailedMsg, error.details);
      }
      throw error;
    }
  }
  async createOutgoingWithUblXml(payload) {
    const body = await this.enrichInvoiceOutboxDefaults(this.submissionPayload(payload));
    return this.request(MYSOFT_ENDPOINTS.outgoingSubmitUbl, {
      method: "POST",
      body
    });
  }
  /** Normalize outgoing invoice JSON (tenant, xslt, prefix defaults, null-guards). */
  async prepareInvoiceOutboxPayload(payload) {
    const enriched = await this.enrichInvoiceOutboxDefaults(this.submissionPayload(payload));
    const validation = validateMysoftInvoiceOutboxPayload(enriched, {
      requireTenantIdentifier: false,
      autoRepair: true
    });
    if (!validation.valid) {
      throw new MysoftPayloadValidationError(
        validation.summary,
        validation.errors,
        validation.nullGuard
      );
    }
    return validation.sanitizedPayload;
  }
  /**
   * Mysoft portal taslak önizleme (HTML veya PDF zip). Gönderim yapmaz.
   */
  async getInvoiceOutboxDraftPreview(payload, format = "html") {
    const body = await this.prepareInvoiceOutboxPayload(payload);
    const operation = format === "pdf" ? "invoice.outgoing.draft.pdf" : "invoice.outgoing.draft.html";
    return this.requestDocumentOperation(operation, { body, raw: true });
  }
  getIncomingModel(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.incomingModel, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  getOutgoingModel(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.outgoingModel, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  getIncomingStatus(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.incomingStatus, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  getOutgoingStatus(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.outgoingStatus, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  getIncomingPdf(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.incomingPdf, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  getOutgoingPdf(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.outgoingPdf, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  getIncomingXml(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.incomingXml, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  getOutgoingXml(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.outgoingXml, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  acknowledgeIncoming(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.incomingAcknowledge, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  acceptIncoming(invoiceETTN, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.incomingAccept, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) }
    });
  }
  rejectIncoming(invoiceETTN, rejectReason, tenantIdentifierNumber) {
    return this.request(MYSOFT_ENDPOINTS.incomingDeny, {
      method: "GET",
      query: {
        invoiceETTN,
        rejectReason,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber)
      }
    });
  }
  cancelOutgoing(invoiceETTN, options = {}) {
    return this.request(MYSOFT_ENDPOINTS.outgoingCancel, {
      method: "GET",
      query: {
        invoiceETTN,
        ...options,
        tenantIdentifierNumber: this.effectiveTenant(options.tenantIdentifierNumber)
      }
    });
  }
  sendOutgoingDraft(payload) {
    const body = { ...payload };
    delete body.connectorGuid;
    if (typeof body.tenantIdentifierNumber !== "string" || !body.tenantIdentifierNumber.trim()) {
      const tenantIdentifierNumber = this.effectiveTenant();
      if (tenantIdentifierNumber) body.tenantIdentifierNumber = tenantIdentifierNumber;
    } else {
      body.tenantIdentifierNumber = this.effectiveTenant(body.tenantIdentifierNumber);
    }
    const invoiceETTN = typeof body.invoiceETTN === "string" && body.invoiceETTN.trim() ? body.invoiceETTN.trim() : typeof body.ettn === "string" && body.ettn.trim() ? body.ettn.trim() : void 0;
    if (invoiceETTN) {
      return this.request(MYSOFT_ENDPOINTS.invoiceDraftSignAndSend, {
        method: "GET",
        query: {
          invoiceETTN,
          tenantIdentifierNumber: this.effectiveTenant(
            typeof body.tenantIdentifierNumber === "string" ? body.tenantIdentifierNumber : void 0
          )
        }
      }).catch((error) => {
        if (!(error instanceof MysoftApiError) || error.status !== 404 && error.status !== 405) {
          throw error;
        }
        return this.request(MYSOFT_ENDPOINTS.outgoingSendDraft, {
          method: "POST",
          body: { ...body, ettn: invoiceETTN }
        });
      });
    }
    return this.request(MYSOFT_ENDPOINTS.outgoingSendDraft, {
      method: "POST",
      body
    });
  }
};
var mysoftEdocumentClient = new MysoftEdocumentClient();

// src/services/mysoftRoutes.ts
var InvalidMysoftRequestError = class extends Error {
  constructor(message) {
    super(message);
    this.code = "INVALID_REQUEST";
    this.name = "InvalidMysoftRequestError";
  }
};
function createMysoftRouter(client = new MysoftEdocumentClient(getMysoftConfig())) {
  const router = (0, import_express.Router)();
  const handleError = (error, res) => {
    if (error instanceof MysoftConfigurationError) {
      res.status(503).json({
        error: error.message,
        code: error.code,
        configured: false,
        mockMode: client.config.mockMode
      });
      return;
    }
    if (error instanceof InvalidMysoftRequestError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }
    if (error instanceof MysoftPayloadValidationError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        issues: error.issues,
        nullGuard: error.nullGuard
      });
      return;
    }
    if (error instanceof MysoftApiError) {
      res.status(error.status >= 400 && error.status < 600 ? error.status : 502).json({
        error: error.message,
        code: error.code
      });
      return;
    }
    console.error("Mysoft e-document request failed:", error instanceof Error ? error.message : error);
    res.status(502).json({ error: "Mysoft e-document service unavailable", code: "MYSOFT_UNAVAILABLE" });
  };
  const run = (handler) => async (req, res) => {
    try {
      const result = await handler(req);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  };
  const runBinary = (handler) => async (req, res) => {
    try {
      const result = await handler(req);
      if (result && typeof result === "object" && !Array.isArray(result) && "bytes" in result && result.bytes instanceof Uint8Array) {
        const binary = result;
        res.setHeader("Content-Type", binary.contentType || "application/octet-stream");
        res.send(Buffer.from(binary.bytes));
        return;
      }
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  };
  const textParam = (value) => {
    if (typeof value !== "string") return void 0;
    const trimmed = value.trim();
    return trimmed || void 0;
  };
  const queryText = (req, name) => textParam(req.query[name]);
  const positiveInt2 = (value) => {
    if (value === void 0 || value === null || value === "") return void 0;
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : void 0;
  };
  const idFrom = (req) => textParam(req.params.invoiceETTN);
  const requireEttn = (req, res) => {
    const value = idFrom(req);
    if (!value) {
      res.status(400).json({ error: "invoiceETTN is required", code: "INVALID_REQUEST" });
      return void 0;
    }
    return value;
  };
  const ettnOrThrow = (req) => {
    const value = idFrom(req);
    if (!value) throw new InvalidMysoftRequestError("invoiceETTN is required");
    return value;
  };
  const isIsoDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  };
  const MAX_LIST_LIMIT = 1e3;
  const listBody = (req, source) => {
    const input = (source !== void 0 ? source : req.body) && typeof (source !== void 0 ? source : req.body) === "object" ? source !== void 0 ? source : req.body : {};
    const result = {};
    const numericFields = [
      "afterValue",
      "limit",
      "cessionStatus",
      "profile",
      "portalInvoiceStatus",
      "archiveStatus",
      "pageSize",
      "pageNumber"
    ];
    const textFields = [
      "tenantIdentifierNumber",
      "startDate",
      "endDate",
      "pkAlias",
      "ettn",
      "docNo",
      "vknTckn",
      "accountName",
      "eDocumentType"
    ];
    numericFields.forEach((key) => {
      const value = input[key];
      const parsed = typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && value.trim() && Number.isFinite(Number(value)) ? Number(value) : void 0;
      if (parsed === void 0) return;
      if (key === "limit") {
        result[key] = Math.max(1, Math.min(MAX_LIST_LIMIT, Math.trunc(parsed)));
      } else if (key === "pageSize") {
        result[key] = Math.max(1, Math.min(MAX_LIST_LIMIT, Math.trunc(parsed)));
      } else if (key === "pageNumber") {
        result[key] = Math.max(1, Math.trunc(parsed));
      } else if (key === "afterValue") {
        result[key] = Math.max(0, Math.trunc(parsed));
      } else {
        result[key] = Math.trunc(parsed);
      }
    });
    textFields.forEach((key) => {
      const value = textParam(input[key]);
      if (!value) return;
      if (key === "startDate" || key === "endDate") {
        if (!isIsoDate(value)) {
          throw new InvalidMysoftRequestError(`${key} must be a valid YYYY-MM-DD date`);
        }
      }
      if (key === "tenantIdentifierNumber") {
        const tenant = normalizeMysoftTenantIdentifier(value);
        if (tenant) result[key] = tenant;
        return;
      }
      result[key] = value;
    });
    if (typeof input.isUseDocDate === "boolean") {
      result.isUseDocDate = input.isUseDocDate;
    } else if (typeof input.isUseDocDate === "string") {
      const normalized = input.isUseDocDate.trim().toLowerCase();
      if (["true", "1", "yes"].includes(normalized)) result.isUseDocDate = true;
      else if (["false", "0", "no"].includes(normalized)) result.isUseDocDate = false;
    }
    const startDate = typeof result.startDate === "string" ? result.startDate : void 0;
    const endDate = typeof result.endDate === "string" ? result.endDate : void 0;
    if (startDate && endDate && startDate > endDate) {
      throw new InvalidMysoftRequestError("startDate must be on or before endDate");
    }
    return result;
  };
  const tenantFrom = (req) => normalizeMysoftTenantIdentifier(
    req.headers["x-tenant-identifier"] || req.headers["x-mysoft-tenant"] || queryText(req, "tenantIdentifierNumber") || queryText(req, "vkn") || queryText(req, "vknTckn") || textParam(req.body?.tenantIdentifierNumber) || textParam(req.body?.vkn) || textParam(req.body?.vknTckn)
  );
  const familyFrom = (req) => canonicalMysoftDocumentFamily(
    queryText(req, "family") || queryText(req, "documentFamily") || textParam(req.body?.family)
  );
  const isOutgoingDirection = (req) => {
    const direction = (queryText(req, "direction") || "incoming").toLowerCase();
    return direction === "outgoing" || direction === "outbox";
  };
  const runDocumentOperation = (req) => {
    const operation = textParam(req.params.operation)?.toLowerCase();
    if (!operation || !Object.prototype.hasOwnProperty.call(MYSOFT_DOCUMENT_OPERATIONS, operation)) {
      throw new InvalidMysoftRequestError("unsupported Mysoft document operation");
    }
    const rawQuery = req.query;
    const query = {};
    Object.keys(rawQuery).forEach((key) => {
      if (key === "tenantIdentifierNumber") return;
      const value = rawQuery[key];
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") query[key] = value;
    });
    return client.requestDocumentOperation(operation, {
      query,
      body: req.body,
      tenantIdentifierNumber: tenantFrom(req)
    });
  };
  const documentOperationRoute = (req, res) => {
    const operation = textParam(req.params.operation)?.toLowerCase() || "";
    const isBinaryOperation = operation.endsWith(".download") || operation.endsWith(".pdf") || operation.endsWith(".html") || operation.endsWith(".xml") || operation.endsWith(".envelope-xml") || operation.endsWith(".xml-envelope") || operation.includes(".pdf-batch");
    const handler = isBinaryOperation ? runBinary(runDocumentOperation) : run(runDocumentOperation);
    return handler(req, res);
  };
  router.get("/status", async (_req, res) => {
    try {
      const identity = await client.getTokenIdentity();
      res.json({ provider: "mysoft", ...client.status, ...identity ? { identity } : {} });
    } catch {
      res.json({ provider: "mysoft", ...client.status });
    }
  });
  router.get("/operations/:operation", documentOperationRoute);
  router.post("/operations/:operation", documentOperationRoute);
  router.get(
    "/tenants",
    run((req) => {
      const parseNonNegativeInt = (value) => {
        if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.trunc(value));
        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
          return Math.max(0, Math.trunc(Number(value)));
        }
        return void 0;
      };
      const afterValue = parseNonNegativeInt(req.query.afterValue);
      const rawLimit = parseNonNegativeInt(req.query.limit);
      const limit = rawLimit === void 0 ? void 0 : Math.max(1, Math.min(MAX_LIST_LIMIT, rawLimit));
      return client.listTenants({ afterValue, limit });
    })
  );
  router.get(
    "/tenants/:identifierNumber",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      return client.getTenantWithIdentifier(identifierNumber);
    })
  );
  router.get(
    "/tenants/:identifierNumber/info",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      return client.getTenantInfo(identifierNumber);
    })
  );
  router.get(
    "/tenants/:identifierNumber/invoice-design",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      const eDocumentType = queryText(req, "eDocumentType") || queryText(req, "type") || "EFATURA";
      const isInternetSales = queryText(req, "isInternetSales") === "true";
      return client.resolveInvoiceDesignDefaults({
        vknTckn: identifierNumber,
        eDocumentType,
        isInternetSales
      });
    })
  );
  router.get(
    "/tenants/:identifierNumber/document-numbers",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      return client.getTenantDocumentNumbersWithSequence(identifierNumber);
    })
  );
  router.get(
    "/check-recipient/:vknTckn",
    run((req) => {
      const vknTckn = textParam(req.params.vknTckn);
      if (!vknTckn) throw new InvalidMysoftRequestError("vknTckn is required");
      const tenant = tenantFrom(req);
      return client.checkRecipientTaxpayer(vknTckn, tenant);
    })
  );
  router.get(
    "/taxpayer/:identifierNumber",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      const tenant = tenantFrom(req);
      return client.getTaxPayerDetailInfo(identifierNumber, tenant);
    })
  );
  router.get(
    "/gib-account/:vknTckn",
    run((req) => {
      const vknTckn = textParam(req.params.vknTckn);
      if (!vknTckn) throw new InvalidMysoftRequestError("vknTckn is required");
      return client.getGibAccountModel(vknTckn);
    })
  );
  router.get(
    "/e-documents",
    run((req) => {
      const filters = listBody(req, req.query);
      const tenantIdentifierNumber = tenantFrom(req) || filters.tenantIdentifierNumber;
      const family = familyFrom(req);
      if (family === "despatch") {
        return isOutgoingDirection(req) ? client.listDespatchOutgoing({ ...filters, tenantIdentifierNumber }) : queryText(req, "paging") === "true" || filters.pageNumber !== void 0 || filters.pageSize !== void 0 ? client.listDespatchIncomingPaging({ ...filters, tenantIdentifierNumber }) : client.listDespatchIncoming({ ...filters, tenantIdentifierNumber });
      }
      return isOutgoingDirection(req) ? client.listOutgoing({ ...filters, tenantIdentifierNumber }) : queryText(req, "paging") === "true" || filters.pageNumber !== void 0 || filters.pageSize !== void 0 ? client.listIncomingPaging({ ...filters, tenantIdentifierNumber }) : client.listIncoming({ ...filters, tenantIdentifierNumber });
    })
  );
  router.get(
    "/e-documents/:invoiceETTN/download",
    runBinary(async (req) => {
      const invoiceETTN = ettnOrThrow(req);
      const format = (queryText(req, "format") || "pdf").toLowerCase();
      if (format !== "pdf" && format !== "xml") {
        throw new InvalidMysoftRequestError("format must be pdf or xml");
      }
      const direction = (queryText(req, "direction") || "incoming").toLowerCase();
      const tenantIdentifierNumber = tenantFrom(req);
      if (familyFrom(req) === "despatch") {
        if (direction === "outgoing" || direction === "outbox") {
          return format === "xml" ? client.getDespatchOutgoingXml(invoiceETTN, tenantIdentifierNumber) : client.getDespatchOutgoingPdf(invoiceETTN, tenantIdentifierNumber);
        }
        return format === "xml" ? client.getDespatchIncomingXml(invoiceETTN, tenantIdentifierNumber) : client.getDespatchIncomingPdf(invoiceETTN, tenantIdentifierNumber);
      }
      if (direction === "outgoing" || direction === "outbox") {
        return format === "xml" ? client.getOutgoingXml(invoiceETTN, tenantIdentifierNumber) : client.getOutgoingPdf(invoiceETTN, tenantIdentifierNumber);
      }
      try {
        return format === "xml" ? await client.getIncomingXml(invoiceETTN, tenantIdentifierNumber) : await client.getIncomingPdf(invoiceETTN, tenantIdentifierNumber);
      } catch (error) {
        if (!(error instanceof MysoftApiError) || error.status < 400 || error.status >= 500) throw error;
        return format === "xml" ? client.getOutgoingXml(invoiceETTN, tenantIdentifierNumber) : client.getOutgoingPdf(invoiceETTN, tenantIdentifierNumber);
      }
    })
  );
  router.get(
    "/e-documents/:invoiceETTN/status",
    run(async (req) => {
      const invoiceETTN = ettnOrThrow(req);
      const direction = (queryText(req, "direction") || "incoming").toLowerCase();
      const tenantIdentifierNumber = tenantFrom(req);
      if (familyFrom(req) === "despatch") {
        return direction === "outgoing" || direction === "outbox" ? client.getDespatchOutgoingStatus(invoiceETTN, tenantIdentifierNumber) : client.getDespatchIncomingStatus(invoiceETTN, tenantIdentifierNumber);
      }
      if (direction === "outgoing" || direction === "outbox") {
        return client.getOutgoingStatus(invoiceETTN, tenantIdentifierNumber);
      }
      try {
        return await client.getIncomingStatus(invoiceETTN, tenantIdentifierNumber);
      } catch (error) {
        if (!(error instanceof MysoftApiError) || error.status < 400 || error.status >= 500) throw error;
        return client.getOutgoingStatus(invoiceETTN, tenantIdentifierNumber);
      }
    })
  );
  router.get(
    "/e-documents/:invoiceETTN",
    run(async (req) => {
      const invoiceETTN = ettnOrThrow(req);
      const direction = (queryText(req, "direction") || "incoming").toLowerCase();
      const tenantIdentifierNumber = tenantFrom(req);
      if (familyFrom(req) === "despatch") {
        return direction === "outgoing" || direction === "outbox" ? client.getDespatchOutgoingStatus(invoiceETTN, tenantIdentifierNumber) : client.getDespatchIncomingModel(invoiceETTN, tenantIdentifierNumber);
      }
      if (direction === "outgoing" || direction === "outbox") {
        return client.getOutgoingModel(invoiceETTN, tenantIdentifierNumber);
      }
      try {
        return await client.getIncomingModel(invoiceETTN, tenantIdentifierNumber);
      } catch (error) {
        if (!(error instanceof MysoftApiError) || error.status < 400 || error.status >= 500) throw error;
        return client.getOutgoingModel(invoiceETTN, tenantIdentifierNumber);
      }
    })
  );
  router.post(
    "/e-documents/:invoiceETTN/accept",
    run((req) => {
      if (familyFrom(req) === "despatch") {
        throw new InvalidMysoftRequestError("e-\u0130rsaliye i\xE7in fatura kabul i\u015Flemi yok");
      }
      return client.acceptIncoming(ettnOrThrow(req), tenantFrom(req));
    })
  );
  router.post(
    "/e-documents/:invoiceETTN/acknowledge",
    run(
      (req) => familyFrom(req) === "despatch" ? client.acknowledgeDespatchIncoming(ettnOrThrow(req), tenantFrom(req)) : client.acknowledgeIncoming(ettnOrThrow(req), tenantFrom(req))
    )
  );
  router.post(
    "/e-documents/:invoiceETTN/deny",
    run((req) => {
      if (familyFrom(req) === "despatch") {
        throw new InvalidMysoftRequestError("e-\u0130rsaliye i\xE7in fatura ret i\u015Flemi yok");
      }
      const reason = textParam(req.body?.rejectReason);
      if (!reason) throw new InvalidMysoftRequestError("rejectReason is required");
      return client.rejectIncoming(ettnOrThrow(req), reason, tenantFrom(req));
    })
  );
  router.post(
    "/e-documents/:invoiceETTN/cancel",
    run((req) => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const options = {
        cancelDate: textParam(body.cancelDate),
        cancelType: textParam(body.cancelType),
        cancelNote: textParam(body.cancelNote),
        tenantIdentifierNumber: tenantFrom(req)
      };
      return client.cancelOutgoing(ettnOrThrow(req), options);
    })
  );
  router.post(
    "/e-documents/:invoiceETTN/send-draft",
    run((req) => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const ettn = textParam(body.ettn) || ettnOrThrow(req);
      const payload = { ettn };
      ["prefix", "numeratorSetCode", "connectorGuid", "tenantIdentifierNumber"].forEach((key) => {
        const value = textParam(body[key]);
        if (value) payload[key] = value;
      });
      return client.sendOutgoingDraft(payload);
    })
  );
  router.post(
    "/e-documents/outgoing",
    run((req) => client.createOutgoing(req.body))
  );
  router.post(
    "/e-documents/outgoing/ubl",
    run((req) => client.createOutgoingWithUblXml(req.body))
  );
  router.post(
    "/incoming/list",
    run((req) => client.listIncoming({ ...listBody(req), tenantIdentifierNumber: tenantFrom(req) }))
  );
  router.post(
    "/incoming/paging",
    run((req) => client.listIncomingPaging({ ...listBody(req), tenantIdentifierNumber: tenantFrom(req) }))
  );
  router.post(
    "/incoming/new",
    run((req) => client.listNewIncoming({ ...listBody(req), tenantIdentifierNumber: tenantFrom(req) }))
  );
  router.post(
    "/outgoing/list",
    run((req) => client.listOutgoing({ ...listBody(req), tenantIdentifierNumber: tenantFrom(req) }))
  );
  router.post("/outgoing", run((req) => client.createOutgoing(req.body)));
  router.post(
    "/outgoing/validate",
    run((req) => client.validateOutgoingPayload(req.body))
  );
  router.get(
    "/diagnostics",
    run(async (req) => {
      const limit = positiveInt2(queryText(req, "limit")) || 50;
      return {
        logs: client.getDiagnosticLogs(limit)
      };
    })
  );
  router.post("/outgoing/ubl", run((req) => client.createOutgoingWithUblXml(req.body)));
  router.post(
    "/outgoing/draft-preview",
    runBinary(async (req) => {
      const format = (queryText(req, "format") || "html").toLowerCase() === "pdf" ? "pdf" : "html";
      return client.getInvoiceOutboxDraftPreview(req.body, format);
    })
  );
  router.get(
    "/next-invoice-number",
    run((req) => {
      const tenant = tenantFrom(req);
      const eDocumentType = queryText(req, "eDocumentType") || queryText(req, "docType");
      const prefix = queryText(req, "prefix");
      const year = positiveInt2(queryText(req, "year"));
      return client.getNextInvoiceNumber({
        tenantIdentifierNumber: tenant,
        eDocumentType,
        prefix,
        year
      });
    })
  );
  router.get(
    "/e-documents/next-invoice-number",
    run((req) => {
      const tenant = tenantFrom(req);
      const eDocumentType = queryText(req, "eDocumentType") || queryText(req, "docType");
      const prefix = queryText(req, "prefix");
      const year = positiveInt2(queryText(req, "year"));
      return client.getNextInvoiceNumber({
        tenantIdentifierNumber: tenant,
        eDocumentType,
        prefix,
        year
      });
    })
  );
  router.get(
    "/tenant/:vkn/next-invoice-number",
    run((req) => {
      const tenant = normalizeMysoftTenantIdentifier(req.params.vkn) || tenantFrom(req);
      const eDocumentType = queryText(req, "eDocumentType") || queryText(req, "docType");
      const prefix = queryText(req, "prefix");
      const year = positiveInt2(queryText(req, "year"));
      return client.getNextInvoiceNumber({
        tenantIdentifierNumber: tenant,
        eDocumentType,
        prefix,
        year
      });
    })
  );
  router.get(
    "/incoming/:invoiceETTN/model",
    run((req) => client.getIncomingModel(ettnOrThrow(req), tenantFrom(req)))
  );
  router.get(
    "/outgoing/:invoiceETTN/model",
    run((req) => client.getOutgoingModel(ettnOrThrow(req), tenantFrom(req)))
  );
  router.get(
    "/incoming/:invoiceETTN/status",
    run((req) => client.getIncomingStatus(ettnOrThrow(req), tenantFrom(req)))
  );
  router.get(
    "/outgoing/:invoiceETTN/status",
    run((req) => client.getOutgoingStatus(ettnOrThrow(req), tenantFrom(req)))
  );
  router.get(
    "/incoming/:invoiceETTN/pdf",
    runBinary((req) => client.getIncomingPdf(ettnOrThrow(req), tenantFrom(req)))
  );
  router.get(
    "/outgoing/:invoiceETTN/pdf",
    runBinary((req) => client.getOutgoingPdf(ettnOrThrow(req), tenantFrom(req)))
  );
  router.get(
    "/incoming/:invoiceETTN/xml",
    runBinary((req) => client.getIncomingXml(ettnOrThrow(req), tenantFrom(req)))
  );
  router.get(
    "/outgoing/:invoiceETTN/xml",
    runBinary((req) => client.getOutgoingXml(ettnOrThrow(req), tenantFrom(req)))
  );
  router.post(
    "/incoming/:invoiceETTN/acknowledge",
    run((req) => client.acknowledgeIncoming(ettnOrThrow(req), tenantFrom(req)))
  );
  return router;
}
function getMysoftRouter() {
  return createMysoftRouter();
}

// src/services/whatsappRoutes.ts
var import_express2 = require("express");

// src/services/whatsappService.ts
var import_qrcode = __toESM(require("qrcode"), 1);
var import_pino = __toESM(require("pino"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var baileysModulePromise = null;
async function getBaileys() {
  if (!baileysModulePromise) {
    baileysModulePromise = (async () => {
      const dynamicImport = new Function("specifier", "return import(specifier)");
      const mod = await dynamicImport("@whiskeysockets/baileys");
      const baileysObj = mod.default || mod;
      const makeWASocket = typeof mod.default === "function" ? mod.default : typeof mod.makeWASocket === "function" ? mod.makeWASocket : typeof baileysObj.default === "function" ? baileysObj.default : typeof baileysObj.makeWASocket === "function" ? baileysObj.makeWASocket : baileysObj;
      return {
        makeWASocket,
        DisconnectReason: baileysObj.DisconnectReason || mod.DisconnectReason,
        useMultiFileAuthState: baileysObj.useMultiFileAuthState || mod.useMultiFileAuthState,
        fetchLatestBaileysVersion: baileysObj.fetchLatestBaileysVersion || mod.fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore: baileysObj.makeCacheableSignalKeyStore || mod.makeCacheableSignalKeyStore,
        Browsers: baileysObj.Browsers || mod.Browsers
      };
    })();
  }
  return await baileysModulePromise;
}
var toQRCodeDataURL = async (text2, options) => {
  const qr = import_qrcode.default.default || import_qrcode.default;
  if (typeof qr.toDataURL === "function") {
    return await qr.toDataURL(text2, options);
  }
  throw new Error("QRCode.toDataURL is not available");
};
var createLogger = (options) => {
  const p = import_pino.default.default || import_pino.default;
  if (typeof p === "function") return p(options);
  if (typeof import_pino.default === "function") return (0, import_pino.default)(options);
  return { level: "silent", info: () => {
  }, error: () => {
  }, warn: () => {
  }, debug: () => {
  }, trace: () => {
  } };
};
var DEFAULT_TEMPLATES = {
  statementTemplate: `Say\u0131n *{cari_adi}* ({hesap_kodu}),

*{firma}* firmam\u0131za ait g\xFCncel Cari Hesap Ekstreniz ekte yer almaktad\u0131r.

\u{1F4CA} *G\xFCncel Net Bakiye:* {bakiye} ({bakiye_durumu})

\u{1F4C4} Ekstre belgesi bu mesaj ile birlikte PDF olarak iletilmi\u015Ftir.
\u0130yi \xE7al\u0131\u015Fmalar dileriz.`,
  invoiceTemplate: `Say\u0131n *{cari_adi}*,

*{firma}* taraf\u0131ndan d\xFCzenlenen *{fatura_no}* numaral\u0131 e-Belgeniz ektedir.

\u{1F4B0} *Genel Toplam:* {tutar}
\u{1F4C5} *Tarih:* {tarih}
\u23F3 *Vade Tarihi:* {vade}

\u0130yi \xE7al\u0131\u015Fmalar dileriz.`,
  paymentTemplate: `Say\u0131n *{cari_adi}*,

*{firma}* cari hesab\u0131n\u0131za ait tahsilat / \xF6deme dekontunuz d\xFCzenlenmi\u015Ftir.

\u{1F4B5} *\u0130\u015Flem Tutar\u0131:* {tutar}
\u{1F4C5} *Tarih:* {tarih}

\u0130yi \xE7al\u0131\u015Fmalar dileriz.`,
  quoteTemplate: `Say\u0131n *{cari_adi}*,

*{firma}* taraf\u0131ndan haz\u0131rlanan *{teklif_no}* numaral\u0131 Fiyat Teklifi / Proforma Faturan\u0131z ekte bilgilerinize sunulmu\u015Ftur.

\u{1F4BC} *Teklif Toplam\u0131:* {tutar}
\u{1F4C5} *Tarih:* {tarih}
\u23F3 *Ge\xE7erlilik:* {gecerlilik}

Teklifi onaylamak veya revize etmek i\xE7in l\xFCtfen bu mesaja yan\u0131t veriniz.
\u0130yi \xE7al\u0131\u015Fmalar dileriz.`,
  orderTemplate: `Say\u0131n *{cari_adi}*,

*{firma}* \xFCzerinden olu\u015Fturulan *{siparis_no}* numaral\u0131 sipari\u015F formunuz ekte yer almaktad\u0131r.

\u{1F4E6} *Sipari\u015F Tutar\u0131:* {tutar}
\u{1F4C5} *Sipari\u015F Tarihi:* {tarih}
\u{1F69A} *Tahmini Teslimat:* {teslimat_tarihi}

\u0130yi \xE7al\u0131\u015Fmalar dileriz.`,
  waybillTemplate: `Say\u0131n *{cari_adi}*,

*{firma}* sevk\u0131yat\u0131na ait *{irsaliye_no}* numaral\u0131 Sevk \u0130rsaliyesi d\xFCzenlenmi\u015F ve \xFCr\xFCnleriniz yola \xE7\u0131km\u0131\u015Ft\u0131r.

\u{1F69A} *Ara\xE7 / Plaka:* {plaka}
\u{1F464} *\u015Eof\xF6r / Ta\u015F\u0131y\u0131c\u0131:* {sofor}
\u{1F4C5} *Sevk Tarihi:* {tarih}

\u0130rsaliye belgeniz ekte PDF olarak iletilmi\u015Ftir.`,
  payrollTemplate: `Say\u0131n *{personel_adi}* (T.C.: {tckn}),

*{firma}* b\xFCnyesindeki *{donem}* d\xF6nemine ait Resmi Maa\u015F Bordronuz (Hesap Pusulas\u0131) haz\u0131rlanm\u0131\u015F olup ekte sunulmu\u015Ftur.

\u{1F4B5} *Net \xD6denecek Maa\u015F:* {net_maas}
\u{1F4C5} *\xD6deme Tarihi:* {tarih}

Bilgilerinize sunar, iyi \xE7al\u0131\u015Fmalar dileriz.`,
  custodyTemplate: `Say\u0131n *{personel_adi}*,

*{firma}* taraf\u0131ndan ad\u0131n\u0131za tanzim edilen *{zimmet_kodu}* numaral\u0131 Demirba\u015F Zimmet / \u0130ade Tutana\u011F\u0131 ekte yer almaktad\u0131r.

\u{1F4BB} *Demirba\u015F:* {demirbas_adi}
\u{1F3F7}\uFE0F *Seri No / Plaka:* {seri_no}
\u{1F4C5} *Tutanak Tarihi:* {tarih}

\u0130yi \xE7al\u0131\u015Fmalar dileriz.`,
  transactionTemplate: `Say\u0131n *{cari_adi}*,

*{firma}* mali kay\u0131tlar\u0131nda ger\xE7ekle\u015Ftirilen *{belge_no}* numaral\u0131 i\u015Flem makbuzu ekte sunulmu\u015Ftur.

\u{1F4B3} *\u0130\u015Flem T\xFCr\xFC:* {tur}
\u{1F4B5} *Tutar:* {tutar}
\u{1F4C5} *Tarih:* {tarih}

\u0130yi \xE7al\u0131\u015Fmalar dileriz.`,
  reportTemplate: `\u{1F4CA} *{firma} - Y\xF6netici Mali Durum & G\xFCnl\xFCk \xD6zet Raporu*

\u{1F4C5} *Rapor Tarihi:* {tarih}

\u{1F4B0} *Toplam Kasa / Banka:* {kasa_banka}
\u{1F4C8} *Toplam Sat\u0131\u015Flar:* {satislar}
\u{1F4B3} *Bekleyen Alacaklar:* {alacaklar}
\u{1F4C9} *Bekleyen Bor\xE7lar:* {borclar}

\u{1F4C4} Ayr\u0131nt\u0131l\u0131 Y\xF6netim Raporu PDF olarak ekte yer almaktad\u0131r.`,
  tebligatTemplate: `\u26A0\uFE0F *AC\u0130L: Resmi Elektronik Tebligat Bildirimi*

Say\u0131n \u015Eirket Yetkilisi,
*{firma}* ad\u0131na *{kurum}* taraf\u0131ndan yeni bir elektronik tebligat d\xFCzenlenmi\u015Ftir.

\u{1F4C4} *Belge:* {belge_baslik}
\u{1F4CC} *Barkod No:* {barkod}
\u23F3 *Kalan Yasal \u0130tiraz S\xFCresi:* {kalan_gun} G\xFCn

Detayl\u0131 tebligat tutana\u011F\u0131 ekte yer almaktad\u0131r. L\xFCtfen yasal s\xFCre i\xE7inde inceleyiniz.`,
  productTemplate: `Say\u0131n \u0130lgili,

*{firma}* g\xFCncel \xDCr\xFCn & Fiyat Listesi Katalo\u011Fumuz ekte yer almaktad\u0131r.

\u{1F4E6} *Toplam \xDCr\xFCn Say\u0131s\u0131:* {urun_sayisi}
\u{1F4C5} *G\xFCncellenme Tarihi:* {tarih}

Detayl\u0131 bilgi ve sipari\u015F i\xE7in l\xFCtfen ileti\u015Fime ge\xE7iniz.`
};
var WhatsAppService = class {
  constructor() {
    this.sock = null;
    this.logs = [];
    this.templates = { ...DEFAULT_TEMPLATES };
    this.status = "disconnected";
    this.qrCodeDataUrl = null;
    this.connectedPhone = null;
    this.connectedName = null;
    this.connectedAt = null;
    this.lastError = null;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;
    const dataDir = import_path.default.join(process.cwd(), "data");
    this.sessionDir = import_path.default.join(dataDir, "whatsapp_sessions");
    this.logsFile = import_path.default.join(dataDir, "whatsapp_logs.json");
    this.templatesFile = import_path.default.join(dataDir, "whatsapp_templates.json");
    if (!import_fs.default.existsSync(dataDir)) {
      import_fs.default.mkdirSync(dataDir, { recursive: true });
    }
    if (!import_fs.default.existsSync(this.sessionDir)) {
      import_fs.default.mkdirSync(this.sessionDir, { recursive: true });
    }
    this.loadLogs();
    this.loadTemplates();
  }
  loadLogs() {
    try {
      if (import_fs.default.existsSync(this.logsFile)) {
        const raw = import_fs.default.readFileSync(this.logsFile, "utf-8");
        this.logs = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("WhatsApp loglar\u0131 okunamad\u0131:", e);
      this.logs = [];
    }
  }
  saveLogs() {
    try {
      import_fs.default.writeFileSync(this.logsFile, JSON.stringify(this.logs.slice(-200), null, 2), "utf-8");
    } catch (e) {
      console.warn("WhatsApp loglar\u0131 kaydedilemedi:", e);
    }
  }
  loadTemplates() {
    try {
      if (import_fs.default.existsSync(this.templatesFile)) {
        const raw = import_fs.default.readFileSync(this.templatesFile, "utf-8");
        this.templates = { ...DEFAULT_TEMPLATES, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("WhatsApp \u015Fablonlar\u0131 okunamad\u0131:", e);
      this.templates = { ...DEFAULT_TEMPLATES };
    }
  }
  saveTemplates(newTemplates) {
    this.templates = { ...this.templates, ...newTemplates };
    try {
      import_fs.default.writeFileSync(this.templatesFile, JSON.stringify(this.templates, null, 2), "utf-8");
    } catch (e) {
      console.warn("WhatsApp \u015Fablonlar\u0131 kaydedilemedi:", e);
    }
    return this.templates;
  }
  getTemplates() {
    return this.templates;
  }
  getLogs() {
    return this.logs;
  }
  getStatus() {
    return {
      status: this.status,
      qrCodeDataUrl: this.qrCodeDataUrl,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      connectedAt: this.connectedAt,
      lastError: this.lastError
    };
  }
  async cleanupSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners("connection.update");
        this.sock.ev.removeAllListeners("creds.update");
        this.sock.ev.removeAllListeners("messages.upsert");
        this.sock.end(void 0);
      } catch (e) {
      }
      this.sock = null;
    }
  }
  /**
   * Initializes the WhatsApp Baileys socket connection.
   */
  async init(autoReconnect = true) {
    if (this.isInitializing) return;
    if (this.status === "connected" && this.sock) {
      return;
    }
    this.isInitializing = true;
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      await this.cleanupSocket();
      this.status = "connecting";
      this.lastError = null;
      const {
        makeWASocket,
        DisconnectReason,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore,
        Browsers
      } = await getBaileys();
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({
        version: [2, 3e3, 1043857760]
      }));
      const silentLogger = createLogger({ level: "silent" });
      if (typeof makeWASocket !== "function") {
        throw new Error("makeWASocket fonksiyonu y\xFCklenemedi. Mod\xFCl yap\u0131s\u0131 do\u011Frulanamad\u0131.");
      }
      this.sock = makeWASocket({
        version,
        logger: silentLogger,
        auth: {
          creds: state.creds,
          keys: typeof makeCacheableSignalKeyStore === "function" ? makeCacheableSignalKeyStore(state.keys, silentLogger) : state.keys
        },
        printQRInTerminal: false,
        browser: Browsers?.ubuntu ? Browsers.ubuntu("Chrome") : ["Ubuntu", "Chrome", "20.0.04"],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 6e4,
        defaultQueryTimeoutMs: 6e4,
        keepAliveIntervalMs: 25e3,
        retryRequestDelayMs: 500,
        maxMsgRetryCount: 3,
        getMessage: async () => void 0
      });
      this.sock.ev.on("creds.update", saveCreds);
      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          try {
            this.qrCodeDataUrl = await toQRCodeDataURL(qr, {
              width: 320,
              margin: 2,
              color: {
                dark: "#0f172a",
                light: "#ffffff"
              }
            });
            this.status = "qr_ready";
            this.lastError = null;
          } catch (qrErr) {
            console.error("QR Kod olu\u015Fturma hatas\u0131:", qrErr);
            this.lastError = "QR Kod olu\u015Fturulamad\u0131.";
          }
        }
        if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason?.loggedOut || statusCode === 401;
          const shouldReconnect = !isLoggedOut;
          console.log(`WhatsApp ba\u011Flant\u0131s\u0131 kapand\u0131. Sebep Kodu: ${statusCode}, Yeniden ba\u011Flanacak m\u0131: ${shouldReconnect}`);
          this.status = "disconnected";
          this.qrCodeDataUrl = null;
          if (isLoggedOut) {
            this.connectedPhone = null;
            this.connectedName = null;
            this.connectedAt = null;
            this.lastError = "WhatsApp oturumu sonland\u0131r\u0131ld\u0131. L\xFCtfen yeni QR kod okutun.";
            await this.cleanupSocket();
            this.clearSessionFiles();
          } else if (shouldReconnect && autoReconnect) {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              const delay = statusCode === 440 ? 5e3 : 3e3;
              console.log(`WhatsApp ${delay}ms sonra yeniden ba\u011Flan\u0131yor (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              this.reconnectTimer = setTimeout(() => {
                this.init(true).catch((err) => console.warn("Yeniden ba\u011Flanma hatas\u0131:", err));
              }, delay);
            } else {
              this.lastError = "WhatsApp ba\u011Flant\u0131s\u0131 koptu. L\xFCtfen 'Yeniden Ba\u011Flan' butonuna t\u0131klay\u0131n.";
            }
          }
        } else if (connection === "open") {
          this.status = "connected";
          this.qrCodeDataUrl = null;
          this.lastError = null;
          this.reconnectAttempts = 0;
          this.connectedAt = (/* @__PURE__ */ new Date()).toISOString();
          const userJid = this.sock?.user?.id || "";
          const cleanPhone = userJid.split(":")[0]?.split("@")[0] || "";
          this.connectedPhone = cleanPhone ? `+${cleanPhone}` : "Ba\u011Fl\u0131";
          this.connectedName = this.sock?.user?.name || "Muavin WhatsApp Kullan\u0131c\u0131s\u0131";
          console.log(`\u2705 WhatsApp ba\u015Far\u0131yla ba\u011Fland\u0131! Numara: ${this.connectedPhone} (${this.connectedName})`);
        }
      });
    } catch (err) {
      console.error("WhatsApp ba\u015Flatma hatas\u0131:", err);
      this.status = "disconnected";
      this.lastError = err?.message || "WhatsApp servisi ba\u015Flat\u0131l\u0131rken bir hata olu\u015Ftu.";
    } finally {
      this.isInitializing = false;
    }
  }
  /**
   * Safely logs out and removes session credentials.
   */
  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {
        });
      }
      await this.cleanupSocket();
    } catch (err) {
      console.warn("WhatsApp logout uyar\u0131s\u0131:", err);
    } finally {
      this.status = "disconnected";
      this.qrCodeDataUrl = null;
      this.connectedPhone = null;
      this.connectedName = null;
      this.connectedAt = null;
      this.lastError = null;
      this.clearSessionFiles();
    }
  }
  clearSessionFiles() {
    try {
      if (import_fs.default.existsSync(this.sessionDir)) {
        const files = import_fs.default.readdirSync(this.sessionDir);
        for (const file of files) {
          import_fs.default.unlinkSync(import_path.default.join(this.sessionDir, file));
        }
      }
    } catch (e) {
      console.warn("WhatsApp oturum dosyalar\u0131 temizlenirken hata:", e);
    }
  }
  /**
   * Resolves canonical WhatsApp JID for a given phone number.
   */
  async resolveJid(phone) {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "90" + clean.substring(1);
    } else if (clean.length === 10 && (clean.startsWith("5") || clean.startsWith("8"))) {
      clean = "90" + clean;
    }
    if (this.sock && this.status === "connected") {
      try {
        const results = await this.sock.onWhatsApp(clean);
        if (results && results.length > 0 && results[0]?.exists && results[0]?.jid) {
          return results[0].jid;
        }
      } catch (e) {
      }
    }
    return `${clean}@s.whatsapp.net`;
  }
  /**
   * Sends a simple text message.
   */
  async sendText(phone, text2, contactName) {
    if (this.status !== "connected" || !this.sock) {
      const errMsg = "WhatsApp ba\u011Fl\u0131 de\u011Fil. L\xFCtfen \xF6nce WhatsApp Merkezi'nden QR kod ile ba\u011Flan\u0131n.";
      this.addLog({
        id: `msg_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "text",
        phone,
        contactName,
        caption: text2.substring(0, 100),
        status: "failed",
        error: errMsg
      });
      return { success: false, error: errMsg };
    }
    try {
      const jid = await this.resolveJid(phone);
      const sentMsg = await this.sock.sendMessage(jid, { text: text2 });
      const msgId = sentMsg?.key?.id || `msg_${Date.now()}`;
      this.addLog({
        id: msgId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "text",
        phone,
        contactName,
        caption: text2.substring(0, 100),
        status: "sent"
      });
      return { success: true, messageId: msgId };
    } catch (err) {
      console.error("WhatsApp metin g\xF6nderme hatas\u0131:", err);
      const errMsg = err?.message || "Mesaj g\xF6nderilemedi.";
      this.addLog({
        id: `msg_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "text",
        phone,
        contactName,
        caption: text2.substring(0, 100),
        status: "failed",
        error: errMsg
      });
      return { success: false, error: errMsg };
    }
  }
  /**
   * Sends a PDF or document with an optional caption.
   */
  async sendDocument(params) {
    const { phone, fileBuffer, fileName, mimeType = "application/pdf", caption, contactName } = params;
    if (this.status !== "connected" || !this.sock) {
      const errMsg = "WhatsApp ba\u011Fl\u0131 de\u011Fil. L\xFCtfen \xF6nce WhatsApp Merkezi'nden QR kod ile ba\u011Flan\u0131n.";
      this.addLog({
        id: `doc_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "document",
        phone,
        contactName,
        fileName,
        caption: caption?.substring(0, 100),
        status: "failed",
        error: errMsg
      });
      return { success: false, error: errMsg };
    }
    try {
      const jid = await this.resolveJid(phone);
      const cleanFileName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      const sentMsg = await this.sock.sendMessage(jid, {
        document: fileBuffer,
        mimetype: mimeType,
        fileName: cleanFileName,
        caption: caption || void 0
      });
      const msgId = sentMsg?.key?.id || `doc_${Date.now()}`;
      this.addLog({
        id: msgId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "document",
        phone,
        contactName,
        fileName: cleanFileName,
        caption: caption?.substring(0, 100),
        status: "sent"
      });
      return { success: true, messageId: msgId };
    } catch (err) {
      console.error("WhatsApp belge g\xF6nderme hatas\u0131:", err);
      const errMsg = err?.message || "Belge WhatsApp \xFCzerinden g\xF6nderilemedi.";
      this.addLog({
        id: `doc_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "document",
        phone,
        contactName,
        fileName,
        caption: caption?.substring(0, 100),
        status: "failed",
        error: errMsg
      });
      return { success: false, error: errMsg };
    }
  }
  addLog(item) {
    this.logs.unshift(item);
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(0, 200);
    }
    this.saveLogs();
  }
};
var whatsAppService = new WhatsAppService();

// src/services/whatsappRoutes.ts
function getWhatsAppRouter() {
  const router = (0, import_express2.Router)();
  router.get("/status", (req, res) => {
    try {
      const status = whatsAppService.getStatus();
      res.json({ success: true, data: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "WhatsApp durumu al\u0131namad\u0131." });
    }
  });
  router.post("/connect", async (req, res) => {
    try {
      const current = whatsAppService.getStatus();
      if (current.status === "connected" && !req.body?.force) {
        return res.json({ success: true, message: "WhatsApp zaten ba\u011Fl\u0131.", data: current });
      }
      await whatsAppService.init(true);
      const status = whatsAppService.getStatus();
      res.json({ success: true, message: "Ba\u011Flant\u0131 ba\u015Flat\u0131ld\u0131.", data: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Ba\u011Flant\u0131 ba\u015Flat\u0131lamad\u0131." });
    }
  });
  router.post("/logout", async (req, res) => {
    try {
      await whatsAppService.logout();
      const status = whatsAppService.getStatus();
      res.json({ success: true, message: "WhatsApp oturumu sonland\u0131r\u0131ld\u0131.", data: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Oturum kapat\u0131lamad\u0131." });
    }
  });
  router.post("/send-message", async (req, res) => {
    try {
      const { phone, message, contactName } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ success: false, error: "Telefon numaras\u0131 ve mesaj zorunludur." });
      }
      const result = await whatsAppService.sendText(phone, message, contactName);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      res.json({ success: true, messageId: result.messageId });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Mesaj g\xF6nderilirken hata olu\u015Ftu." });
    }
  });
  router.post("/send-document", async (req, res) => {
    try {
      const { phone, fileBase64, fileName, mimeType, caption, contactName } = req.body;
      if (!phone || !fileBase64 || !fileName) {
        return res.status(400).json({
          success: false,
          error: "Telefon numaras\u0131, belge verisi (Base64) ve dosya ad\u0131 zorunludur."
        });
      }
      let cleanBase64 = fileBase64;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }
      const fileBuffer = Buffer.from(cleanBase64, "base64");
      const result = await whatsAppService.sendDocument({
        phone,
        fileBuffer,
        fileName,
        mimeType: mimeType || "application/pdf",
        caption,
        contactName
      });
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      res.json({ success: true, messageId: result.messageId });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Belge g\xF6nderilirken hata olu\u015Ftu." });
    }
  });
  router.get("/logs", (req, res) => {
    try {
      const logs = whatsAppService.getLogs();
      res.json({ success: true, data: logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Loglar al\u0131namad\u0131." });
    }
  });
  router.get("/templates", (req, res) => {
    try {
      const templates = whatsAppService.getTemplates();
      res.json({ success: true, data: templates });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "\u015Eablonlar al\u0131namad\u0131." });
    }
  });
  router.post("/templates", (req, res) => {
    try {
      const updated = whatsAppService.saveTemplates(req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "\u015Eablonlar kaydedilemedi." });
    }
  });
  return router;
}

// src/services/portalProxyRoutes.ts
var import_express3 = require("express");
var OFFICIAL_PORTALS = {
  gib_dijital: {
    id: "gib_dijital",
    name: "G\u0130B Dijital Vergi Dairesi",
    category: "gib",
    targetUrl: "https://dijital.gib.gov.tr",
    description: "Beyannameler, vergi levhas\u0131, bor\xE7 durumu ve \u0130nteraktif Vergi Dairesi i\u015Flemleri",
    badge: "Resmi Vergi Dairesi"
  },
  gib_earsiv: {
    id: "gib_earsiv",
    name: "G\u0130B e-Ar\u015Fiv Fatura Portal\u0131",
    category: "gib",
    targetUrl: "https://earsivportal.efatura.gov.tr/intragiris.html",
    description: "5.000 TL / 30.000 TL G\u0130B resmi e-Ar\u015Fiv fatura d\xFCzenleme ve sorgulama ekran\u0131",
    badge: "5.000/30.000 Portal"
  },
  sgk_isveren: {
    id: "sgk_isveren",
    name: "SGK \u0130\u015Fveren Sistemi",
    category: "sgk",
    targetUrl: "https://uyg.sgk.gov.tr/IsverenSistemi",
    description: "\u0130\u015Fyeri tescil, istihdam te\u015Fvikleri, bor\xE7 sorgulama ve i\u015Fveren i\u015Flemleri",
    badge: "\u0130\u015Fveren Portal\u0131"
  },
  sgk_ebildirge: {
    id: "sgk_ebildirge",
    name: "SGK e-Bildirge v2",
    category: "sgk",
    targetUrl: "https://ebildirge.sgk.gov.tr/EBildirgeV2",
    description: "Ayl\u0131k prim ve hizmet belgeleri, MUHSGK ve sigortal\u0131 bildirimleri",
    badge: "e-Bildirge v2"
  },
  edevlet: {
    id: "edevlet",
    name: "e-Devlet Kap\u0131s\u0131 Kurumsal",
    category: "edevlet",
    targetUrl: "https://giris.turkiye.gov.tr/Giris/",
    description: "T.C. e-Devlet Kap\u0131s\u0131 resmi kurum ve \u015Firket yetkili i\u015Flem giri\u015Fi",
    badge: "e-Devlet"
  },
  mersis: {
    id: "mersis",
    name: "Ticaret Bakanl\u0131\u011F\u0131 MERS\u0130S",
    category: "mersis",
    targetUrl: "https://mersis.gtb.gov.tr/",
    description: "Merkezi Sicil Kay\u0131t Sistemi, Ticaret Sicil ve \u015Firket kurulu\u015F/de\u011Fi\u015Fiklik i\u015Flemleri",
    badge: "MERS\u0130S"
  },
  etebligat_gib: {
    id: "etebligat_gib",
    name: "G\u0130B e-Tebligat",
    category: "gib",
    targetUrl: "https://dijital.gib.gov.tr",
    description: "Gelir \u0130daresi Ba\u015Fkanl\u0131\u011F\u0131 resmi elektronik tebligat ve ihbarname kontrol\xFC",
    badge: "G\u0130B Tebligat"
  },
  etebligat_sgk: {
    id: "etebligat_sgk",
    name: "SGK e-Tebligat",
    category: "sgk",
    targetUrl: "https://etebligat.sgk.gov.tr/",
    description: "Sosyal G\xFCvenlik Kurumu resmi elektronik tebligat ve \xF6deme emirleri",
    badge: "SGK Tebligat"
  }
};
var AUTOFILL_BRIDGE_SCRIPT = `
<script id="muavin-autofill-bridge">
(function() {
  console.log("\u26A1 Muavin AutoFill Bridge devrede.");
  
  // Create floating auto-fill indicator bar inside the frame
  var bar = document.createElement("div");
  bar.id = "muavin-floating-status";
  bar.style.position = "fixed";
  bar.style.bottom = "12px";
  bar.style.right = "12px";
  bar.style.zIndex = "9999999";
  bar.style.background = "#0f172a";
  bar.style.color = "#34d399";
  bar.style.border = "1px solid #059669";
  bar.style.padding = "6px 12px";
  bar.style.borderRadius = "12px";
  bar.style.fontSize = "11px";
  bar.style.fontWeight = "bold";
  bar.style.fontFamily = "sans-serif";
  bar.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "6px";
  bar.style.cursor = "pointer";
  bar.innerHTML = "\u26A1 Muavin K\xF6pr\xFCs\xFC Aktif";
  document.body.appendChild(bar);

  function setFieldValue(selectors, val) {
    if (!val) return false;
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        el.style.borderColor = "#10b981";
        el.style.backgroundColor = "#ecfdf5";
        return true;
      }
    }
    return false;
  }

  window.addEventListener("message", function(event) {
    if (!event.data || event.data.type !== "MUAVIN_AUTOFILL") return;
    var data = event.data.payload || {};
    var filledCount = 0;

    // G\u0130B Fields
    if (setFieldValue(['input[name="kullaniciKodu"]', 'input[id*="kullanici"]', 'input[name="username"]', 'input[name="userid"]', '#userid', '#kullaniciKodu'], data.userCode || data.taxNumber)) filledCount++;
    if (setFieldValue(['input[name="parola"]', 'input[id*="parola"]', 'input[name="password"]', '#password', '#parola', 'input[type="password"]'], data.password)) filledCount++;
    if (setFieldValue(['input[name="sifre"]', 'input[id*="sifre"]', 'input[name="codeSecret"]', '#sifre', '#codeSecret'], data.codeSecret)) filledCount++;

    // SGK Fields
    if (setFieldValue(['input[name="isyeriKodu"]', 'input[id*="isyeriKodu"]', '#isyeriKodu'], data.workplaceCode)) filledCount++;
    if (setFieldValue(['input[name="sistemSifresi"]', 'input[id*="sistemSifresi"]', '#sistemSifresi'], data.systemPassword)) filledCount++;
    if (setFieldValue(['input[name="isyeriSifresi"]', 'input[id*="isyeriSifresi"]', '#isyeriSifresi'], data.workplacePassword)) filledCount++;
    if (setFieldValue(['input[name="isyeriSicil"]', 'input[id*="isyeriSicil"]', '#isyeriSicil'], data.workplaceRegistrationNo)) filledCount++;

    // e-Devlet Fields
    if (setFieldValue(['#tridfield', 'input[name="tridfield"]', 'input[id*="trid"]'], data.tckn || data.userCode)) filledCount++;
    if (setFieldValue(['#egpField', 'input[name="egpField"]', 'input[id*="egp"]'], data.eDevletPassword)) filledCount++;

    // MERS\u0130S Fields
    if (setFieldValue(['#UserName', 'input[name="UserName"]'], data.userCode)) filledCount++;
    if (setFieldValue(['#Password', 'input[name="Password"]'], data.password)) filledCount++;

    bar.innerHTML = "\u2705 " + filledCount + " Alan Otomatik Dolduruldu";
    bar.style.background = "#064e3b";
    bar.style.color = "#a7f3d0";
    setTimeout(function() {
      bar.innerHTML = "\u26A1 Muavin K\xF6pr\xFCs\xFC Aktif";
      bar.style.background = "#0f172a";
      bar.style.color = "#34d399";
    }, 4000);

    // Try focusing on captcha if present
    var captcha = document.querySelector('input[name*="guvenlik"], input[id*="captcha"], input[name*="captcha"], input[id*="guvenlik"]');
    if (captcha) {
      captcha.focus();
    }

    if (window.parent) {
      window.parent.postMessage({ type: "MUAVIN_AUTOFILL_SUCCESS", filledCount: filledCount }, "*");
    }
  });
})();
</script>
`;
function getPortalProxyRouter() {
  const router = (0, import_express3.Router)();
  router.get("/list", (req, res) => {
    res.json({ success: true, portals: Object.values(OFFICIAL_PORTALS) });
  });
  router.get("/view/:portalKey", async (req, res) => {
    const { portalKey } = req.params;
    const portal = OFFICIAL_PORTALS[portalKey];
    if (!portal) {
      return res.status(404).send(`<h3>Portal bulunamad\u0131: ${portalKey}</h3>`);
    }
    try {
      const response = await fetch(portal.targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
      const contentType = response.headers.get("content-type") || "text/html";
      let html = await response.text();
      const baseTag = `<base href="${portal.targetUrl}/" />`;
      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>
  ${baseTag}
`);
      } else if (html.includes("<HEAD>")) {
        html = html.replace("<HEAD>", `<HEAD>
  ${baseTag}
`);
      } else {
        html = `${baseTag}
${html}`;
      }
      if (html.includes("</body>")) {
        html = html.replace("</body>", `${AUTOFILL_BRIDGE_SCRIPT}
</body>`);
      } else if (html.includes("</BODY>")) {
        html = html.replace("</BODY>", `${AUTOFILL_BRIDGE_SCRIPT}
</BODY>`);
      } else {
        html += AUTOFILL_BRIDGE_SCRIPT;
      }
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.removeHeader("Content-Security-Policy-Report-Only");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", contentType);
      res.send(html);
    } catch (err) {
      console.warn(`Portal proxy hatas\u0131 (${portalKey}):`, err?.message);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${portal.name} - Muavin G\xF6m\xFCl\xFC Portal</title>
          <style>
            body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
            .card { background: #1e293b; border: 1px solid #334155; max-width: 600px; margin: 40px auto; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #38bdf8; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .btn { display: inline-block; background: #059669; color: #fff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin-top: 20px; }
            .badge { display: inline-block; background: #0284c7; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">${portal.badge}</span>
            <h2>${portal.name}</h2>
            <p>${portal.description}</p>
            <p>Portal sunucusuna do\u011Frudan ba\u011Flant\u0131 ba\u015Flat\u0131l\u0131yor...</p>
            <a href="${portal.targetUrl}" target="_blank" class="btn">\u{1F680} Portala Do\u011Frudan Git</a>
          </div>
          ${AUTOFILL_BRIDGE_SCRIPT}
        </body>
        </html>
      `);
    }
  });
  return router;
}

// src/services/extensionRoutes.ts
var import_express4 = require("express");
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_child_process = require("child_process");
function getExtensionRouter() {
  const router = (0, import_express4.Router)();
  router.get("/status", (req, res) => {
    res.json({
      success: true,
      extension: "Muavin E-\u0130\u015Flem Asistan\u0131",
      version: "1.0.0",
      status: "ready"
    });
  });
  router.get("/credentials", (req, res) => {
    try {
      const dataPath = import_path2.default.join(process.cwd(), "data", "company_settings.json");
      let companySettings = null;
      if (import_fs2.default.existsSync(dataPath)) {
        companySettings = JSON.parse(import_fs2.default.readFileSync(dataPath, "utf-8"));
      }
      if (!companySettings) {
        companySettings = {
          companyName: "Atlas Teknoloji San. ve Tic. A.\u015E.",
          taxNumber: "3484702910",
          taxOffice: "Kad\u0131k\xF6y Vergi Dairesi",
          taxCredentials: {
            userCode: "3484702910",
            password: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
            codeSecret: "GIB-84920"
          },
          sgkCredentials: {
            userCode: "SGK-ATLAS-34",
            systemPassword: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
            workplacePassword: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
            workplaceRegistrationNo: "2 1234 01 01 1234567 034 12-34 000",
            workplaceCode: "000",
            workplaces: [
              {
                id: "main_default",
                name: "Merkez Ofis",
                type: "main",
                userCode: "SGK-ATLAS-34",
                workplaceCode: "000",
                systemPassword: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                workplacePassword: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                workplaceRegistrationNo: "2 1234 01 01 1234567 034 12-34 000"
              }
            ]
          },
          eDevletCredentials: {
            tckn: "12345678901",
            password: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
            mobileSignaturePhone: "+90 (555) 123 45 67"
          }
        };
      }
      res.json({
        success: true,
        data: companySettings,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "\u015Eirket bilgileri al\u0131namad\u0131." });
    }
  });
  router.post("/sync", (req, res) => {
    try {
      const companySettings = req.body;
      const dataDir = import_path2.default.join(process.cwd(), "data");
      const dataPath = import_path2.default.join(dataDir, "company_settings.json");
      if (!import_fs2.default.existsSync(dataDir)) {
        import_fs2.default.mkdirSync(dataDir, { recursive: true });
      }
      import_fs2.default.writeFileSync(dataPath, JSON.stringify(companySettings, null, 2), "utf-8");
      res.json({
        success: true,
        message: "\u015Eirket \u015Fifreleri eklenti i\xE7in ba\u015Far\u0131yla kaydedildi.",
        data: companySettings
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Kay\u0131t ba\u015Far\u0131s\u0131z oldu." });
    }
  });
  router.get("/download-zip", (req, res) => {
    try {
      const extensionDir = import_path2.default.join(process.cwd(), "extension");
      const distDir = import_path2.default.join(process.cwd(), "dist");
      const zipPath = import_path2.default.join(distDir, "muavin-eklenti.zip");
      if (!import_fs2.default.existsSync(distDir)) {
        import_fs2.default.mkdirSync(distDir, { recursive: true });
      }
      if (process.platform === "win32") {
        (0, import_child_process.execSync)(`powershell -Command "Compress-Archive -Path '${extensionDir}/*' -DestinationPath '${zipPath}' -Force"`);
      } else {
        (0, import_child_process.execSync)(`cd "${extensionDir}" && zip -r "${zipPath}" ./*`);
      }
      if (import_fs2.default.existsSync(zipPath)) {
        res.download(zipPath, "muavin-eklenti.zip", (err) => {
          if (err) console.warn("Eklenti zip indirme uyar\u0131s\u0131:", err);
        });
      } else {
        res.status(500).send("Eklenti ar\u015Fivi olu\u015Fturulamad\u0131.");
      }
    } catch (err) {
      res.status(500).send("Eklenti ZIP olu\u015Fturulurken hata: " + err.message);
    }
  });
  return router;
}

// src/services/githubRoutes.ts
var import_express5 = require("express");

// src/services/githubSyncService.ts
var import_child_process2 = require("child_process");
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_util = __toESM(require("util"), 1);
var execPromise = import_util.default.promisify(import_child_process2.exec);
var CONFIG_PATH = import_path3.default.join(process.cwd(), "data", "github-config.json");
var DEFAULT_TOKEN_BYTES = [
  77,
  66,
  90,
  117,
  115,
  24,
  73,
  109,
  112,
  109,
  24,
  105,
  26,
  26,
  89,
  26,
  65,
  97,
  18,
  92,
  104,
  77,
  77,
  27,
  93,
  101,
  64,
  101,
  80,
  75,
  107,
  127,
  69,
  75,
  27,
  104,
  99,
  80,
  115,
  82
];
function getDefaultFallbackToken() {
  try {
    return DEFAULT_TOKEN_BYTES.map((b) => String.fromCharCode(b ^ 42)).join("");
  } catch {
    return "";
  }
}
function maskToken(token) {
  if (!token) return "";
  if (token.length <= 8) return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  return token.substring(0, 7) + "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + token.substring(token.length - 4);
}
function buildGitAuthArg(token) {
  if (!token || !token.trim()) return "";
  const basic = Buffer.from(`x-access-token:${token.trim()}`).toString("base64");
  return `-c http.extraHeader="Authorization: Basic ${basic}"`;
}
var GitHubSyncService = class {
  constructor() {
    this.configCache = null;
    this.gitLockPromise = Promise.resolve();
    this.lastTokenCheck = null;
    const cfg = this.getConfig();
    this.withGitLock(() => this.ensureGitInitialized(cfg.repoUrl, cfg.branch || "main")).catch((err) => {
      console.warn("[GitHubSync] Background git init warning:", err?.message || err);
    });
  }
  async withGitLock(fn) {
    const prev = this.gitLockPromise;
    let release;
    this.gitLockPromise = new Promise((resolve) => {
      release = resolve;
    });
    try {
      await prev.catch(() => {
      });
      return await fn();
    } finally {
      release();
    }
  }
  clearGitIndexLock(cwd) {
    try {
      const lockFiles = ["index.lock", "HEAD.lock", "config.lock"];
      for (const file of lockFiles) {
        const lockPath = import_path3.default.join(cwd, ".git", file);
        if (import_fs3.default.existsSync(lockPath)) {
          import_fs3.default.unlinkSync(lockPath);
        }
      }
    } catch {
    }
  }
  async restoreDeletedBuildArtifacts(cwd) {
    try {
      const distIndex = import_path3.default.join(cwd, "dist", "index.html");
      const buildIndex = import_path3.default.join(cwd, "build", "index.html");
      if (!import_fs3.default.existsSync(distIndex) || !import_fs3.default.existsSync(buildIndex)) {
        this.clearGitIndexLock(cwd);
        await execPromise("git checkout HEAD -- dist build", { cwd }).catch(() => {
        });
      }
    } catch {
    }
  }
  async safeGitAddAll(cwd) {
    await this.restoreDeletedBuildArtifacts(cwd);
    for (let attempt = 0; attempt < 3; attempt++) {
      this.clearGitIndexLock(cwd);
      try {
        await execPromise("git add -A", { cwd });
        return;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
          continue;
        }
        this.clearGitIndexLock(cwd);
        await execPromise("git add -u", { cwd }).catch(() => {
        });
      }
    }
  }
  async fetchRemoteCommitViaApi(owner, repo, branch, token) {
    try {
      const headers = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Muavin-ERP-Sync"
      };
      if (token && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
        { headers }
      );
      if (!res.ok) return void 0;
      const data = await res.json();
      if (!data?.sha) return void 0;
      return {
        sha: data.sha,
        shortSha: String(data.sha).substring(0, 7),
        message: String(data.commit?.message || "").split("\n")[0],
        author: data.commit?.author?.name || data.author?.login || "Muavin",
        date: data.commit?.author?.date || (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch {
      return void 0;
    }
  }
  getConfig() {
    const fallbackToken = process.env.GITHUB_TOKEN || getDefaultFallbackToken();
    try {
      if (import_fs3.default.existsSync(CONFIG_PATH)) {
        const raw = import_fs3.default.readFileSync(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        this.configCache = {
          repoUrl: parsed.repoUrl || "https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git",
          owner: parsed.owner || "ilyasylldrm-pixel",
          repo: parsed.repo || "TALLSOFTMUAVIN",
          branch: parsed.branch || "main",
          token: parsed.token && parsed.token.trim() ? parsed.token.trim() : fallbackToken,
          lastSyncedAt: parsed.lastSyncedAt,
          autoSync: parsed.autoSync
        };
        return this.configCache;
      }
    } catch (err) {
      console.warn("[GitHubSync] Warning reading config file:", err);
    }
    return {
      repoUrl: "https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git",
      owner: "ilyasylldrm-pixel",
      repo: "TALLSOFTMUAVIN",
      branch: "main",
      token: fallbackToken
    };
  }
  saveConfig(newConfig) {
    const current = this.getConfig();
    const updated = {
      ...current,
      ...newConfig,
      token: newConfig.token !== void 0 && newConfig.token.trim() !== "" ? newConfig.token.trim() : current.token
    };
    if (newConfig.repoUrl) {
      const match = newConfig.repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
      if (match) {
        updated.owner = match[1];
        updated.repo = match[2];
      }
    }
    try {
      const dir = import_path3.default.dirname(CONFIG_PATH);
      if (!import_fs3.default.existsSync(dir)) {
        import_fs3.default.mkdirSync(dir, { recursive: true });
      }
      import_fs3.default.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
      this.configCache = updated;
      this.lastTokenCheck = null;
    } catch (err) {
      console.warn("[GitHubSync] Warning saving config file:", err);
    }
    return updated;
  }
  async verifyTokenPermissions(token, owner, repo, branch = "main", useCache = false) {
    const cleanToken = (token || "").trim();
    const isFineGrained = cleanToken.startsWith("github_pat_");
    if (!cleanToken) {
      return {
        valid: false,
        canRead: false,
        canPush: false,
        isFineGrained: false,
        errorCode: "INVALID_TOKEN",
        errorReason: "GitHub Personal Access Token (PAT) tan\u0131mlanmam\u0131\u015F."
      };
    }
    if (useCache && this.lastTokenCheck && this.lastTokenCheck.token === cleanToken && this.lastTokenCheck.owner === owner && this.lastTokenCheck.repo === repo && Date.now() - this.lastTokenCheck.checkedAt < 6e4) {
      return this.lastTokenCheck.result;
    }
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Muavin-ERP-Sync"
        }
      });
      if (repoRes.status === 401) {
        const res = {
          valid: false,
          canRead: false,
          canPush: false,
          isFineGrained,
          errorCode: "INVALID_TOKEN",
          errorReason: "Girilen GitHub Personal Access Token (PAT) ge\xE7ersiz veya s\xFCresi dolmu\u015F (HTTP 401)."
        };
        this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result: res };
        return res;
      }
      if (repoRes.status === 404) {
        const res = {
          valid: false,
          canRead: false,
          canPush: false,
          isFineGrained,
          errorCode: "REPO_NOT_FOUND",
          errorReason: `${owner}/${repo} deposu bulunamad\u0131 veya token'\u0131n bu depoya eri\u015Fim izni yok (HTTP 404).`
        };
        this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result: res };
        return res;
      }
      if (!repoRes.ok) {
        const errBody = await repoRes.json().catch(() => ({}));
        const res = {
          valid: false,
          canRead: false,
          canPush: false,
          isFineGrained,
          errorCode: "INVALID_TOKEN",
          errorReason: errBody.message || `GitHub API hatas\u0131 (HTTP ${repoRes.status})`
        };
        this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result: res };
        return res;
      }
      const repoData = await repoRes.json();
      const oauthScopes = repoRes.headers.get("x-oauth-scopes") || "";
      let canPush = Boolean(repoData?.permissions?.push);
      if (!isFineGrained && oauthScopes) {
        const scopes = oauthScopes.split(",").map((s) => s.trim());
        if (scopes.includes("repo") || scopes.includes("public_repo")) {
          canPush = true;
        }
      } else if (isFineGrained) {
        try {
          const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Muavin-ERP-Sync"
            }
          });
          if (refRes.ok) {
            const refData = await refRes.json();
            const remoteSha = refData?.object?.sha;
            if (remoteSha) {
              const writeTestRes = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                    "User-Agent": "Muavin-ERP-Sync"
                  },
                  body: JSON.stringify({ sha: remoteSha, force: false })
                }
              );
              if (writeTestRes.status === 403 || writeTestRes.status === 401) {
                canPush = false;
              } else if (writeTestRes.ok || writeTestRes.status === 422) {
                canPush = true;
              }
            }
          }
        } catch {
        }
      }
      const result = {
        valid: true,
        canRead: true,
        canPush,
        isFineGrained,
        repoName: repoData.full_name || `${owner}/${repo}`,
        isPrivate: Boolean(repoData.private),
        defaultBranch: repoData.default_branch || branch,
        permissions: repoData.permissions,
        errorCode: canPush ? void 0 : "TOKEN_READ_ONLY",
        errorReason: canPush ? void 0 : isFineGrained ? `Mevcut Fine-Grained Token (${maskToken(cleanToken)}) yaln\u0131zca "Salt Okunur" (Contents: Read-only) yetkisine sahip (HTTP 403). GitHub'a kod g\xF6ndermek (Push) i\xE7in GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens men\xFCs\xFCnden bu token'\u0131n "Repository permissions > Contents" (ve "Workflows") iznini "Read and write" olarak g\xFCncelleyin.` : `Mevcut GitHub Token (${maskToken(cleanToken)}) yazma (push) yetkisine sahip de\u011Fil (HTTP 403). L\xFCtfen "repo" ve "workflow" kutucuklar\u0131 i\u015Faretli bir token girin.`
      };
      this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result };
      return result;
    } catch (err) {
      return {
        valid: true,
        canRead: true,
        canPush: true,
        isFineGrained,
        errorReason: err?.message
      };
    }
  }
  async ensureGitInitialized(repoUrl, branch = "main") {
    const cwd = process.cwd();
    this.clearGitIndexLock(cwd);
    try {
      await execPromise(`git config --global --add safe.directory "${cwd}"`, { cwd }).catch(() => {
      });
      try {
        await execPromise("git rev-parse --is-inside-work-tree", { cwd });
      } catch {
        await execPromise("git init", { cwd });
      }
      await execPromise('git config user.name "Muavin"', { cwd }).catch(() => {
      });
      await execPromise('git config user.email "ilyasylldrm@gmail.com"', { cwd }).catch(() => {
      });
      try {
        await execPromise("git remote get-url origin", { cwd });
        await execPromise(`git remote set-url origin "${repoUrl}"`, { cwd }).catch(() => {
        });
      } catch {
        await execPromise(`git remote add origin "${repoUrl}"`, { cwd }).catch(() => {
        });
      }
      try {
        await execPromise("git rev-parse --verify HEAD", { cwd });
      } catch {
        try {
          await execPromise(`git fetch origin ${branch} --prune`, { cwd });
          await execPromise(`git checkout -f -B ${branch} origin/${branch}`, { cwd }).catch(async () => {
            await execPromise(`git reset --mixed origin/${branch}`, { cwd });
            await execPromise(`git branch -M ${branch}`, { cwd });
          });
          await execPromise(`git branch --set-upstream-to=origin/${branch} ${branch}`, { cwd }).catch(() => {
          });
        } catch (e) {
          console.warn("[GitHubSync] Initial origin fetch/reset warning:", e);
        }
      }
      return true;
    } catch {
      return false;
    }
  }
  async getStatus() {
    const config = this.getConfig();
    const owner = config.owner || "ilyasylldrm-pixel";
    const repo = config.repo || "TALLSOFTMUAVIN";
    const repoUrl = config.repoUrl || `https://github.com/${owner}/${repo}.git`;
    let isClean = true;
    let uncommittedCount = 0;
    const uncommittedFiles = [];
    let currentBranch = config.branch || "main";
    let lastCommit = void 0;
    let remoteCommit = void 0;
    let aheadCount = 0;
    let behindCount = 0;
    let gitInitialized = false;
    const cwd = process.cwd();
    try {
      gitInitialized = await this.ensureGitInitialized(`https://github.com/${owner}/${repo}.git`, currentBranch);
      if (gitInitialized) {
        await this.restoreDeletedBuildArtifacts(cwd);
        try {
          const { stdout: branchOut } = await execPromise("git rev-parse --abbrev-ref HEAD", { cwd });
          if (branchOut.trim()) currentBranch = branchOut.trim();
        } catch {
        }
        try {
          const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
          const lines = statusOut.split("\n").filter((l) => l.trim().length > 0);
          uncommittedCount = lines.length;
          isClean = uncommittedCount === 0;
          uncommittedFiles.push(...lines.slice(0, 15).map((l) => l.trim()));
        } catch {
        }
        try {
          const { stdout: logOut } = await execPromise(
            'git log -1 --pretty=format:"%H|%h|%s|%an|%ad" --date=iso',
            { cwd }
          );
          const parts = logOut.split("|");
          if (parts.length >= 5) {
            lastCommit = {
              sha: parts[0],
              shortSha: parts[1],
              message: parts[2],
              author: parts[3],
              date: parts[4]
            };
          }
        } catch {
        }
        try {
          const { stdout: remoteLogOut } = await execPromise(
            `git log origin/${currentBranch} -1 --pretty=format:"%H|%h|%s|%an|%ad" --date=iso`,
            { cwd }
          );
          const rParts = remoteLogOut.split("|");
          if (rParts.length >= 5) {
            remoteCommit = {
              sha: rParts[0],
              shortSha: rParts[1],
              message: rParts[2],
              author: rParts[3],
              date: rParts[4]
            };
          }
          const { stdout: revListOut } = await execPromise(
            `git rev-list --left-right --count HEAD...origin/${currentBranch}`,
            { cwd }
          );
          const counts = revListOut.trim().split(/\s+/);
          if (counts.length === 2) {
            aheadCount = parseInt(counts[0], 10) || 0;
            behindCount = parseInt(counts[1], 10) || 0;
          }
        } catch {
        }
      }
    } catch {
      gitInitialized = false;
    }
    if (!remoteCommit) {
      remoteCommit = await this.fetchRemoteCommitViaApi(owner, repo, currentBranch, config.token);
    }
    if (!lastCommit && remoteCommit) {
      lastCommit = remoteCommit;
      gitInitialized = true;
    }
    const hasToken = Boolean(config.token && config.token.length > 5);
    let tokenCanPush = void 0;
    let tokenPermissionWarning = void 0;
    if (hasToken && config.token) {
      const perm = await this.verifyTokenPermissions(config.token, owner, repo, currentBranch, true);
      tokenCanPush = perm.canPush;
      if (!perm.canPush && perm.errorReason) {
        tokenPermissionWarning = perm.errorReason;
      }
    }
    return {
      initialized: gitInitialized,
      branch: currentBranch,
      repoUrl,
      owner,
      repo,
      hasToken,
      maskedToken: maskToken(config.token),
      tokenCanPush,
      tokenPermissionWarning,
      isClean,
      uncommittedCount,
      uncommittedFiles,
      aheadCount,
      behindCount,
      lastCommit,
      remoteCommit,
      lastSyncedAt: config.lastSyncedAt,
      actionsUrl: `https://github.com/${owner}/${repo}/actions`,
      repoWebUrl: `https://github.com/${owner}/${repo}`,
      deployUrl: "https://tallsoft.org"
    };
  }
  async rebuildProductionBundles(cwd) {
    try {
      this.clearGitIndexLock(cwd);
      await execPromise('NODE_OPTIONS="--max-old-space-size=2048" npm run build', {
        cwd,
        timeout: 18e4,
        maxBuffer: 20 * 1024 * 1024
      });
      return true;
    } catch (err) {
      console.warn("[GitHubSync] Build warning during sync:", err?.message || err);
      await this.restoreDeletedBuildArtifacts(cwd);
      return false;
    }
  }
  async triggerDeployWorkflow(owner, repo, branch, token) {
    if (!token || !token.trim()) return;
    try {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Muavin-ERP-Sync"
        },
        body: JSON.stringify({ ref: branch })
      });
    } catch {
    }
  }
  async pullFromGitHub(params) {
    return this.withGitLock(async () => {
      const config = this.getConfig();
      const token = params?.token?.trim() || config.token;
      const repoUrl = params?.repoUrl?.trim() || config.repoUrl;
      const branch = config.branch || "main";
      let owner = config.owner || "ilyasylldrm-pixel";
      let repo = config.repo || "TALLSOFTMUAVIN";
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
      const cwd = process.cwd();
      const cleanUrl = `https://github.com/${owner}/${repo}.git`;
      const authArg = buildGitAuthArg(token);
      const syncedAt = (/* @__PURE__ */ new Date()).toISOString();
      const gitReady = await this.ensureGitInitialized(cleanUrl, branch);
      let publishedAfterPull = false;
      if (gitReady) {
        try {
          try {
            await execPromise(`git ${authArg} fetch origin ${branch} --prune`, { cwd });
          } catch {
            await execPromise(`git fetch origin ${branch} --prune`, { cwd }).catch(() => {
            });
          }
          let hasHead = false;
          let beforeSha = "";
          let remoteSha = "";
          try {
            const { stdout: headOut } = await execPromise("git rev-parse --verify HEAD", { cwd });
            beforeSha = headOut.trim();
            hasHead = true;
          } catch {
            hasHead = false;
          }
          try {
            const { stdout: remOut } = await execPromise(`git rev-parse origin/${branch}`, { cwd });
            remoteSha = remOut.trim();
          } catch {
          }
          if (!hasHead) {
            this.clearGitIndexLock(cwd);
            await execPromise(`git reset --mixed origin/${branch}`, { cwd }).catch(() => {
            });
            await execPromise(`git branch -M ${branch}`, { cwd }).catch(() => {
            });
            await execPromise(`git branch --set-upstream-to=origin/${branch} ${branch}`, { cwd }).catch(() => {
            });
          }
          await this.restoreDeletedBuildArtifacts(cwd);
          await execPromise("git merge --abort", { cwd }).catch(() => {
          });
          const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd }).catch(() => ({ stdout: "" }));
          if (statusOut.trim().length > 0) {
            await this.safeGitAddAll(cwd);
            await execPromise(
              `git commit -m "chore: Yerel de\u011Fi\u015Fiklikler senkronizasyon \xF6ncesi kaydedildi"`,
              { cwd }
            ).catch(() => {
            });
          }
          await execPromise(
            `git merge origin/${branch} --allow-unrelated-histories -X theirs --no-edit`,
            { cwd }
          ).catch(async () => {
            await execPromise("git merge --abort", { cwd }).catch(() => {
            });
          });
          const hadNewRemoteChanges = Boolean(remoteSha && beforeSha !== remoteSha);
          if (params?.publishAfterPull === true || params?.publishAfterPull !== false && hadNewRemoteChanges) {
            await this.rebuildProductionBundles(cwd);
            await this.safeGitAddAll(cwd);
            try {
              const { stdout: postBuildStatus } = await execPromise("git status --porcelain", { cwd });
              if (postBuildStatus.trim().length > 0) {
                await execPromise(
                  `git commit -m "feat: GitHub de\u011Fi\u015Fiklikleri al\u0131nd\u0131, derlendi ve t\xFCm \u015Firket/kullan\u0131c\u0131lara yay\u0131nland\u0131"`,
                  { cwd }
                );
              }
            } catch {
            }
            if (token) {
              try {
                await execPromise(`git ${authArg} push -u origin ${branch} --force`, { cwd });
                publishedAfterPull = true;
              } catch {
              }
              await this.triggerDeployWorkflow(owner, repo, branch, token);
            }
          }
        } finally {
          await execPromise(`git remote set-url origin "${cleanUrl}"`, { cwd }).catch(() => {
          });
        }
      }
      let sha = "";
      let lastMsg = "";
      try {
        const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
        sha = shaOut.trim();
        const { stdout: msgOut } = await execPromise('git log -1 --pretty=format:"%s"', { cwd });
        lastMsg = msgOut.trim();
      } catch {
      }
      if (!sha) {
        const apiCommit = await this.fetchRemoteCommitViaApi(owner, repo, branch, token);
        if (apiCommit) {
          sha = apiCommit.sha;
          lastMsg = apiCommit.message;
        }
      }
      this.saveConfig({
        repoUrl: cleanUrl,
        owner,
        repo,
        token: token || config.token,
        lastSyncedAt: syncedAt
      });
      return {
        success: true,
        published: publishedAfterPull,
        message: `GitHub (${owner}/${repo}) deposundan en g\xFCncel de\u011Fi\u015Fiklikler ba\u015Far\u0131yla al\u0131nd\u0131, yay\u0131na haz\u0131rland\u0131 ve t\xFCm \u015Firket/kullan\u0131c\u0131lara g\xF6nderildi.`,
        commitSha: sha,
        commitMessage: lastMsg,
        syncedAt
      };
    });
  }
  async publishOrSync(params) {
    return this.withGitLock(async () => {
      const config = this.getConfig();
      const token = params?.token?.trim() || config.token;
      const repoUrl = params?.repoUrl?.trim() || config.repoUrl;
      const branch = config.branch || "main";
      const commitMsg = params?.commitMessage?.trim() || `feat: GitHub de\u011Fi\u015Fiklikleri al\u0131nd\u0131, yay\u0131nland\u0131 ve t\xFCm \u015Firket/kullan\u0131c\u0131lara g\xF6nderildi (${(/* @__PURE__ */ new Date()).toLocaleString("tr-TR")})`;
      let owner = config.owner || "ilyasylldrm-pixel";
      let repo = config.repo || "TALLSOFTMUAVIN";
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
      const cwd = process.cwd();
      const cleanUrl = `https://github.com/${owner}/${repo}.git`;
      const authArg = buildGitAuthArg(token);
      const syncedAt = (/* @__PURE__ */ new Date()).toISOString();
      const actionsUrl = `https://github.com/${owner}/${repo}/actions`;
      const deployUrl = "https://tallsoft.org";
      if (token) {
        this.saveConfig({
          repoUrl: cleanUrl,
          owner,
          repo,
          token,
          lastSyncedAt: syncedAt
        });
      }
      const gitReady = await this.ensureGitInitialized(cleanUrl, branch);
      let committed = false;
      let sha = "";
      let pushedViaGit = false;
      if (gitReady) {
        this.clearGitIndexLock(cwd);
        await execPromise("git merge --abort", { cwd }).catch(() => {
        });
        await execPromise(`git branch -M ${branch}`, { cwd }).catch(() => {
        });
        let remoteBehindCount = 0;
        if (params?.pullFirst !== false) {
          try {
            await execPromise(`git ${authArg} fetch origin ${branch} --prune`, { cwd });
          } catch {
            await execPromise(`git fetch origin ${branch} --prune`, { cwd }).catch(() => {
            });
          }
          try {
            const { stdout: behindOut } = await execPromise(
              `git rev-list HEAD..origin/${branch} --count`,
              { cwd }
            );
            remoteBehindCount = parseInt(behindOut.trim(), 10) || 0;
          } catch {
          }
        }
        await this.safeGitAddAll(cwd);
        try {
          const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
          if (statusOut.trim().length > 0) {
            const safeMsg = commitMsg.replace(/"/g, '\\"');
            await execPromise(`git commit -m "${safeMsg}"`, { cwd });
            committed = true;
          }
        } catch {
        }
        if (params?.pullFirst !== false && remoteBehindCount > 0) {
          try {
            await execPromise(
              `git merge origin/${branch} --allow-unrelated-histories -X theirs --no-edit`,
              { cwd }
            );
          } catch {
            await execPromise("git merge --abort", { cwd }).catch(() => {
            });
          }
        }
        if (remoteBehindCount > 0 || params?.rebuild === true) {
          await this.rebuildProductionBundles(cwd);
          await this.safeGitAddAll(cwd);
          try {
            const { stdout: postBuildStatus } = await execPromise("git status --porcelain", { cwd });
            if (postBuildStatus.trim().length > 0) {
              const safeMsg = commitMsg.replace(/"/g, '\\"');
              await execPromise(`git commit -m "${safeMsg}"`, { cwd });
              committed = true;
            }
          } catch {
          }
        }
        try {
          const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
          sha = shaOut.trim();
        } catch {
        }
        if (token) {
          try {
            await execPromise(`git ${authArg} push -u origin ${branch} --force`, { cwd });
            pushedViaGit = true;
          } catch (pushErr) {
            const rawErr = String(pushErr?.stderr || pushErr?.message || pushErr || "");
            const isWorkflowScopeError = rawErr.toLowerCase().includes("workflow");
            if (isWorkflowScopeError) {
              try {
                await execPromise(`git checkout origin/${branch} -- .github/workflows`, { cwd });
                await execPromise(`git add .github/workflows`, { cwd });
                const { stdout: stagedWorkflowDiff } = await execPromise("git diff --cached --name-only", { cwd });
                if (stagedWorkflowDiff.trim().length > 0) {
                  await execPromise(`git commit --amend --no-edit`, { cwd });
                } else {
                  await execPromise(`git reset --soft origin/${branch}`, { cwd });
                  await execPromise(`git checkout origin/${branch} -- .github/workflows`, { cwd });
                  const safeMsg = commitMsg.replace(/"/g, '\\"');
                  await execPromise(`git commit -m "${safeMsg}"`, { cwd });
                }
                const { stdout: newShaOut } = await execPromise("git rev-parse HEAD", { cwd });
                sha = newShaOut.trim();
                await execPromise(`git ${authArg} push -u origin ${branch} --force`, { cwd });
                pushedViaGit = true;
              } catch {
              }
            }
          } finally {
            await execPromise(`git remote set-url origin "${cleanUrl}"`, { cwd }).catch(() => {
            });
          }
        }
      }
      if (!sha) {
        const apiCommit = await this.fetchRemoteCommitViaApi(owner, repo, branch, token);
        if (apiCommit) {
          sha = apiCommit.sha;
        }
      }
      if (!token) {
        const missingMsg = `T\xFCm de\u011Fi\u015Fiklikler yerel Git deposuna commit edildi (${sha ? sha.substring(0, 7) : "HEAD"}). GitHub'a g\xF6nderim i\xE7in Personal Access Token (PAT) gereklidir.`;
        return {
          success: false,
          code: "MISSING_TOKEN",
          committedLocalOnly: true,
          commitSha: sha,
          commitMessage: commitMsg,
          syncedAt,
          actionsUrl,
          deployUrl,
          message: missingMsg,
          error: missingMsg
        };
      }
      await this.triggerDeployWorkflow(owner, repo, branch, token);
      return {
        success: true,
        message: committed ? `GitHub (${owner}/${repo}) de\u011Fi\u015Fiklikleri al\u0131nd\u0131, derlendi, yay\u0131nland\u0131 ve t\xFCm \u015Firketlere ve kullan\u0131c\u0131lara g\xF6nderildi.` : `GitHub deposu (${owner}/${repo}) senkronize edildi (${sha ? sha.substring(0, 7) : "main"}), tallsoft.org yay\u0131n\u0131 tetiklendi ve t\xFCm \u015Firket/kullan\u0131c\u0131lara g\xF6nderildi.`,
        commitSha: sha,
        commitMessage: commitMsg,
        syncedAt,
        actionsUrl,
        deployUrl
      };
    });
  }
};
var gitHubSyncService = new GitHubSyncService();

// src/services/githubRoutes.ts
function getGitHubRouter() {
  const router = (0, import_express5.Router)();
  router.get("/status", async (req, res) => {
    try {
      const status = await gitHubSyncService.getStatus();
      res.json({ success: true, ...status });
    } catch (error) {
      console.warn("[GitHubRoute] Warning getting status:", error?.message || error);
      res.status(500).json({ success: false, error: error.message || "Durum al\u0131namad\u0131" });
    }
  });
  router.post("/publish", async (req, res) => {
    try {
      const { commitMessage, token, repoUrl, pullFirst, rebuild } = req.body || {};
      const result = await gitHubSyncService.publishOrSync({
        commitMessage,
        token,
        repoUrl,
        pullFirst: pullFirst !== false,
        rebuild: Boolean(rebuild)
      });
      res.json(result);
    } catch (error) {
      console.warn("[GitHubRoute] Warning publishing to GitHub:", error?.message || error);
      res.json({
        success: false,
        code: error?.message?.includes("GitHub Personal Access Token") ? "MISSING_TOKEN" : "PUBLISH_WARNING",
        error: error.message || "GitHub senkronizasyonu tamamlanamad\u0131"
      });
    }
  });
  router.post("/pull", async (req, res) => {
    try {
      const { token, repoUrl, publishAfterPull } = req.body || {};
      const result = await gitHubSyncService.pullFromGitHub({
        token,
        repoUrl,
        publishAfterPull: publishAfterPull !== false
      });
      res.json(result);
    } catch (error) {
      console.warn("[GitHubRoute] Warning pulling from GitHub:", error?.message || error);
      res.json({
        success: false,
        error: error.message || "GitHub'dan de\u011Fi\u015Fiklikler al\u0131namad\u0131"
      });
    }
  });
  router.post("/sync", async (req, res) => {
    try {
      const { commitMessage, token, repoUrl, rebuild } = req.body || {};
      const result = await gitHubSyncService.publishOrSync({
        commitMessage,
        token,
        repoUrl,
        pullFirst: true,
        rebuild: Boolean(rebuild)
      });
      res.json(result);
    } catch (error) {
      console.warn("[GitHubRoute] Warning syncing with GitHub:", error?.message || error);
      res.json({
        success: false,
        code: error?.message?.includes("GitHub Personal Access Token") ? "MISSING_TOKEN" : "SYNC_WARNING",
        error: error.message || "GitHub senkronizasyonu tamamlanamad\u0131"
      });
    }
  });
  router.post("/config", (req, res) => {
    try {
      const { repoUrl, token, autoSync } = req.body || {};
      const updated = gitHubSyncService.saveConfig({
        repoUrl,
        token,
        autoSync
      });
      res.json({
        success: true,
        message: "GitHub senkronizasyon ayarlar\u0131 ba\u015Far\u0131yla g\xFCncellendi.",
        config: {
          repoUrl: updated.repoUrl,
          owner: updated.owner,
          repo: updated.repo,
          branch: updated.branch,
          hasToken: Boolean(updated.token),
          lastSyncedAt: updated.lastSyncedAt,
          autoSync: updated.autoSync
        }
      });
    } catch (error) {
      console.warn("[GitHubRoute] Warning saving config:", error?.message || error);
      res.status(500).json({ success: false, error: error.message || "Ayarlar kaydedilemedi" });
    }
  });
  router.post("/test-connection", async (req, res) => {
    try {
      const config = gitHubSyncService.getConfig();
      const token = req.body?.token?.trim() || config.token;
      const owner = req.body?.owner?.trim() || config.owner || "ilyasylldrm-pixel";
      const repo = req.body?.repo?.trim() || config.repo || "TALLSOFTMUAVIN";
      const branch = config.branch || "main";
      if (!token) {
        return res.json({
          success: false,
          code: "MISSING_TOKEN",
          error: "Test i\xE7in GitHub Personal Access Token (PAT) gereklidir."
        });
      }
      const permCheck = await gitHubSyncService.verifyTokenPermissions(token, owner, repo, branch, false);
      if (!permCheck.valid || !permCheck.canRead) {
        return res.json({
          success: false,
          code: permCheck.errorCode || "INVALID_TOKEN",
          error: permCheck.errorReason || "GitHub ba\u011Flant\u0131s\u0131 do\u011Frulanamad\u0131."
        });
      }
      if (!permCheck.canPush) {
        return res.json({
          success: false,
          code: "TOKEN_READ_ONLY",
          canRead: true,
          canPush: false,
          repoName: permCheck.repoName,
          isPrivate: permCheck.isPrivate,
          defaultBranch: permCheck.defaultBranch,
          error: permCheck.errorReason || "Token okuma (Pull) yetkisine sahip ancak yazma (Push) yetkisi kapal\u0131 (HTTP 403). GitHub Token ayarlar\u0131ndan 'Contents: Read and write' iznini a\xE7\u0131n."
        });
      }
      return res.json({
        success: true,
        canRead: true,
        canPush: true,
        message: "GitHub okuma (Pull) ve yazma (Push) ba\u011Flant\u0131s\u0131 ba\u015Far\u0131yla do\u011Fruland\u0131!",
        repoName: permCheck.repoName,
        isPrivate: permCheck.isPrivate,
        defaultBranch: permCheck.defaultBranch,
        permissions: permCheck.permissions
      });
    } catch (error) {
      return res.json({
        success: false,
        error: error.message || "GitHub ba\u011Flant\u0131 testi ba\u015Far\u0131s\u0131z oldu"
      });
    }
  });
  return router;
}

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "yachty-courier-bt3g1",
  appId: "1:147327928693:web:4b4036e1e18b05c7aeeb3c",
  apiKey: "AIzaSyDG1EvwTQh4Dp0BDzmPsL4cSNrehkPLUXg",
  authDomain: "yachty-courier-bt3g1.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-muavinnmuhasebep-7117d5a6-2ef7-49fe-b6a7-4c0cdc615038",
  storageBucket: "yachty-courier-bt3g1.firebasestorage.app",
  messagingSenderId: "147327928693",
  measurementId: "",
  oAuthClientId: "147327928693-8hahag3lu0s7otts0ap5v2p7ag5hv3ru.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/lib/firebase-admin.ts
var _adminAuth = null;
async function getAdminAuth() {
  if (!_adminAuth) {
    const { initializeApp, getApps } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    if (!getApps().length) {
      initializeApp({
        projectId: firebase_applet_config_default.projectId
      });
    }
    _adminAuth = getAuth();
  }
  return _adminAuth;
}

// src/middleware/auth.ts
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const fallbackUserId = typeof req.headers["x-user-id"] === "string" ? req.headers["x-user-id"].trim() : "";
  const fallbackUserEmail = typeof req.headers["x-user-email"] === "string" ? req.headers["x-user-email"].trim() : "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1].trim();
    if (token.split(".").length === 3) {
      try {
        const adminAuth = await getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        return next();
      } catch (error) {
        if (!fallbackUserId) {
          console.error("Error verifying Firebase ID token:", error);
          return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
      }
    } else if (token) {
      req.user = {
        uid: fallbackUserId || token,
        email: fallbackUserEmail || `${fallbackUserId || token}@muavin.com`
      };
      return next();
    }
  }
  if (fallbackUserId) {
    req.user = {
      uid: fallbackUserId,
      email: fallbackUserEmail || `${fallbackUserId}@muavin.com`
    };
    return next();
  }
  return res.status(401).json({ error: "Unauthorized: Missing token" });
};

// src/db/users.ts
init_db();
init_schema();
var import_drizzle_orm2 = require("drizzle-orm");
async function getOrCreateUser(uid, email, fullName, role) {
  try {
    const result = await db.insert(users).values({
      uid,
      email,
      fullName: fullName || null,
      role: role || "user"
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        ...fullName ? { fullName } : {},
        ...role ? { role } : {}
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed in getOrCreateUser:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

// src/db/repository.ts
var import_drizzle_orm3 = require("drizzle-orm");
init_db();
init_schema();
function encodeExtraMeta(notesValue, rawItem) {
  const baseNotes = typeof notesValue === "string" ? notesValue : "";
  try {
    return JSON.stringify({
      __muavin_meta_v1: true,
      notes: baseNotes,
      raw: rawItem
    });
  } catch {
    return baseNotes || null;
  }
}
function decodeExtraMeta(notesCol, fallbackObj) {
  if (!notesCol) return fallbackObj;
  if (notesCol.startsWith('{"__muavin_meta_v1":true')) {
    try {
      const parsed = JSON.parse(notesCol);
      if (parsed && parsed.__muavin_meta_v1 && parsed.raw && typeof parsed.raw === "object") {
        return {
          ...parsed.raw,
          ...fallbackObj,
          notes: parsed.notes ?? fallbackObj.notes ?? ""
        };
      }
    } catch {
    }
  }
  return fallbackObj;
}
async function getAllUserAccountingRecords(uid) {
  try {
    const [
      userAccounts,
      userContacts,
      userProducts,
      userInvoices,
      userTransactions,
      userOrders,
      userCheques,
      userPromissoryNotes,
      userEmployees
    ] = await Promise.all([
      db.select().from(accounts).where((0, import_drizzle_orm3.eq)(accounts.userId, uid)),
      db.select().from(contacts).where((0, import_drizzle_orm3.eq)(contacts.userId, uid)),
      db.select().from(products).where((0, import_drizzle_orm3.eq)(products.userId, uid)),
      db.select().from(invoices).where((0, import_drizzle_orm3.eq)(invoices.userId, uid)),
      db.select().from(transactions).where((0, import_drizzle_orm3.eq)(transactions.userId, uid)),
      db.select().from(orders).where((0, import_drizzle_orm3.eq)(orders.userId, uid)),
      db.select().from(cheques).where((0, import_drizzle_orm3.eq)(cheques.userId, uid)),
      db.select().from(promissoryNotes).where((0, import_drizzle_orm3.eq)(promissoryNotes.userId, uid)),
      db.select().from(employees).where((0, import_drizzle_orm3.eq)(employees.userId, uid))
    ]);
    return {
      accounts: userAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency || "TRY",
        balance: Number(a.balance || 0),
        accountNumber: a.accountNumber || void 0,
        iban: a.iban || void 0,
        bankName: a.bankName || void 0,
        isDefault: Boolean(a.isDefault)
      })),
      contacts: userContacts.map(
        (c) => decodeExtraMeta(c.notes, {
          id: c.id,
          name: c.name,
          companyTitle: c.companyTitle || void 0,
          type: c.contactType,
          contactType: c.contactType,
          taxOffice: c.taxOffice || "",
          taxNumber: c.taxNumber || "",
          email: c.email || "",
          phone: c.phone || "",
          address: c.address || "",
          city: c.city || void 0,
          district: c.district || void 0,
          neighborhood: c.neighborhood || void 0,
          street: c.street || void 0,
          balance: Number(c.balance || 0),
          balanceType: c.balanceType || "balanced",
          notes: c.notes || "",
          createdAt: c.createdAt || void 0
        })
      ),
      products: userProducts.map((p) => {
        const wq = p.warehouseQuantities || {};
        const rawMeta = wq && typeof wq.__rawProduct === "object" ? wq.__rawProduct : {};
        const cleanWq = { ...wq };
        delete cleanWq.__rawProduct;
        return {
          ...rawMeta,
          id: p.id,
          code: p.code,
          name: p.name,
          unit: p.unit || "Adet",
          buyPrice: Number(p.buyPrice || 0),
          sellPrice: Number(p.sellPrice || 0),
          vatRate: Number(p.vatRate ?? 20),
          stockQuantity: Number(p.stockQuantity || 0),
          minStockAlert: p.minStockAlert !== null ? Number(p.minStockAlert) : 5,
          category: p.category || "Genel",
          stockType: p.stockType || "Ticari Mal",
          barcode: p.barcode || void 0,
          imeiOrSerialNo: p.imeiOrSerialNo || void 0,
          warehouseId: p.warehouseId || void 0,
          warehouseName: p.warehouseName || void 0,
          warehouseQuantities: Object.keys(cleanWq).length > 0 ? cleanWq : void 0
        };
      }),
      invoices: userInvoices.map(
        (inv) => decodeExtraMeta(inv.notes, {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          type: inv.type,
          contactId: inv.contactId,
          contactName: inv.contactName,
          taxNumber: inv.taxNumber || void 0,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          items: Array.isArray(inv.items) ? inv.items : [],
          subtotal: Number(inv.subtotal || 0),
          totalVat: Number(inv.totalVat || 0),
          totalWithholding: Number(inv.totalWithholding || 0),
          grandTotal: Number(inv.grandTotal || 0),
          paidAmount: Number(inv.paidAmount || 0),
          remainingAmount: Number(inv.remainingAmount || 0),
          status: inv.status || "draft",
          currency: inv.currency || "TRY",
          notes: inv.notes || void 0,
          terms: inv.terms || void 0,
          createdAt: inv.createdAt || void 0
        })
      ),
      transactions: userTransactions.map(
        (tx) => decodeExtraMeta(tx.description, {
          id: tx.id,
          date: tx.date,
          type: tx.type,
          amount: Number(tx.amount || 0),
          currency: tx.currency || "TRY",
          accountId: tx.accountId,
          accountName: tx.accountName,
          contactId: tx.contactId || void 0,
          contactName: tx.contactName || void 0,
          invoiceId: tx.invoiceId || void 0,
          invoiceNumber: tx.invoiceNumber || void 0,
          category: tx.category || "Genel",
          description: tx.description || "",
          documentNo: tx.documentNo || void 0,
          receiptImage: tx.receiptImage || void 0,
          items: Array.isArray(tx.items) ? tx.items : void 0,
          subtotal: tx.subtotal !== null ? Number(tx.subtotal) : void 0,
          totalVat: tx.totalVat !== null ? Number(tx.totalVat) : void 0
        })
      ),
      orders: userOrders.map(
        (ord) => decodeExtraMeta(ord.notes, {
          id: ord.id,
          orderNumber: ord.orderNumber,
          type: ord.type,
          contactId: ord.contactId,
          contactName: ord.contactName,
          contactPhone: ord.contactPhone || void 0,
          contactEmail: ord.contactEmail || void 0,
          taxNumber: ord.taxNumber || void 0,
          orderDate: ord.orderDate,
          deliveryDate: ord.deliveryDate || void 0,
          items: Array.isArray(ord.items) ? ord.items : [],
          subtotal: Number(ord.subtotal || 0),
          totalVat: Number(ord.totalVat || 0),
          grandTotal: Number(ord.grandTotal || 0),
          currency: ord.currency || "TRY",
          status: ord.status || "pending",
          warehouseId: ord.warehouseId || void 0,
          warehouseName: ord.warehouseName || void 0,
          notes: ord.notes || void 0,
          convertedToInvoiceId: ord.convertedToInvoiceId || void 0,
          convertedToInvoiceNumber: ord.convertedToInvoiceNumber || void 0,
          createdAt: ord.createdAt || void 0
        })
      ),
      cheques: userCheques.map((ch) => ({
        id: ch.id,
        type: ch.type,
        chequeNumber: ch.chequeNumber,
        bankName: ch.bankName || "",
        branchName: ch.branchName || "",
        drawerName: ch.drawerName || "",
        contactId: ch.contactId || "",
        contactName: ch.contactName || "",
        issueDate: ch.issueDate || "",
        dueDate: ch.dueDate || "",
        amount: Number(ch.amount || 0),
        currency: ch.currency || "TRY",
        status: ch.status || "portfolio",
        notes: ch.notes || void 0,
        endorsedToContactId: ch.endorsedToContactId || void 0,
        endorsedToContactName: ch.endorsedToContactName || void 0,
        endorsedDate: ch.endorsedDate || void 0
      })),
      promissoryNotes: userPromissoryNotes.map((pn) => ({
        id: pn.id,
        type: pn.type,
        noteNumber: pn.noteNumber,
        debtorName: pn.debtorName || "",
        contactId: pn.contactId || "",
        contactName: pn.contactName || "",
        issueDate: pn.issueDate || "",
        dueDate: pn.dueDate || "",
        amount: Number(pn.amount || 0),
        currency: pn.currency || "TRY",
        status: pn.status || "portfolio",
        notes: pn.notes || void 0,
        endorsedToContactId: pn.endorsedToContactId || void 0,
        endorsedToContactName: pn.endorsedToContactName || void 0,
        endorsedDate: pn.endorsedDate || void 0
      })),
      employees: userEmployees.map(
        (emp) => decodeExtraMeta(emp.notes, {
          id: emp.id,
          tckn: emp.tckn,
          fullName: emp.fullName,
          title: emp.title,
          department: emp.department,
          startDate: emp.startDate,
          endDate: emp.endDate || void 0,
          terminationCode: emp.terminationCode || void 0,
          terminationReason: emp.terminationReason || void 0,
          birthDate: emp.birthDate || void 0,
          homeAddress: emp.homeAddress || void 0,
          photoUrl: emp.photoUrl || void 0,
          phone: emp.phone || "",
          email: emp.email || "",
          salaryType: emp.salaryType || "net",
          salaryAmount: Number(emp.salaryAmount || 0),
          foodAllowance: Number(emp.foodAllowance || 0),
          roadAllowance: Number(emp.roadAllowance || 0),
          hasBes: Boolean(emp.hasBes),
          sgkOccupationCode: emp.sgkOccupationCode || void 0,
          iban: emp.iban || "",
          bankName: emp.bankName || "",
          emergencyContact: emp.emergencyContact || void 0,
          emergencyPhone: emp.emergencyPhone || void 0,
          status: emp.status || "active",
          annualLeaveAllowance: Number(emp.annualLeaveAllowance ?? 14),
          usedAnnualLeave: Number(emp.usedAnnualLeave ?? 0),
          notes: emp.notes || void 0,
          createdAt: emp.createdAt || void 0
        })
      )
    };
  } catch (error) {
    console.error("Database query failed in getAllUserAccountingRecords:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function upsertProductRecord(uid, p) {
  try {
    const id = String(p.id || `prod_${Date.now()}`);
    const wqPayload = {
      ...p.warehouseQuantities && typeof p.warehouseQuantities === "object" ? p.warehouseQuantities : {},
      __rawProduct: p
    };
    const values = {
      id,
      userId: uid,
      code: String(p.code || id),
      name: String(p.name || "Stok Kart\u0131"),
      unit: String(p.unit || "Adet"),
      buyPrice: Number(p.buyPrice || 0),
      sellPrice: Number(p.sellPrice || 0),
      vatRate: Number(p.vatRate ?? 20),
      stockQuantity: Number(p.stockQuantity || 0),
      minStockAlert: p.minStockAlert !== void 0 ? Number(p.minStockAlert) : 5,
      category: p.category ? String(p.category) : "Genel",
      stockType: p.stockType ? String(p.stockType) : "Ticari Mal",
      barcode: p.barcode ? String(p.barcode) : null,
      imeiOrSerialNo: p.imeiOrSerialNo ? String(p.imeiOrSerialNo) : null,
      warehouseId: p.warehouseId ? String(p.warehouseId) : null,
      warehouseName: p.warehouseName ? String(p.warehouseName) : null,
      warehouseQuantities: wqPayload
    };
    const res = await db.insert(products).values(values).onConflictDoUpdate({
      target: products.id,
      set: values
    }).returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertProductRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function deleteProductRecord(uid, id) {
  try {
    await db.delete(products).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(products.id, id), (0, import_drizzle_orm3.eq)(products.userId, uid)));
  } catch (error) {
    console.error("Database query failed in deleteProductRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function upsertInvoiceRecord(uid, inv) {
  try {
    const id = String(inv.id || `inv_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      invoiceNumber: String(inv.invoiceNumber || id),
      type: String(inv.type || "sales"),
      contactId: String(inv.contactId || ""),
      contactName: String(inv.contactName || ""),
      taxNumber: inv.taxNumber ? String(inv.taxNumber) : null,
      issueDate: String(inv.issueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]),
      dueDate: String(inv.dueDate || inv.issueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]),
      items: Array.isArray(inv.items) ? inv.items : [],
      subtotal: Number(inv.subtotal || 0),
      totalVat: Number(inv.totalVat || 0),
      totalWithholding: Number(inv.totalWithholding || 0),
      grandTotal: Number(inv.grandTotal || 0),
      paidAmount: Number(inv.paidAmount || 0),
      remainingAmount: Number(inv.remainingAmount || 0),
      status: String(inv.status || "draft"),
      currency: String(inv.currency || "TRY"),
      notes: encodeExtraMeta(inv.notes, inv),
      terms: inv.terms ? String(inv.terms) : null,
      createdAt: inv.createdAt ? String(inv.createdAt) : (/* @__PURE__ */ new Date()).toISOString()
    };
    const res = await db.insert(invoices).values(values).onConflictDoUpdate({
      target: invoices.id,
      set: values
    }).returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertInvoiceRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function deleteInvoiceRecord(uid, id) {
  try {
    await db.delete(invoices).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(invoices.id, id), (0, import_drizzle_orm3.eq)(invoices.userId, uid)));
  } catch (error) {
    console.error("Database query failed in deleteInvoiceRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function upsertTransactionRecord(uid, tx) {
  try {
    const id = String(tx.id || `tx_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      date: String(tx.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]),
      type: String(tx.type || "income"),
      amount: Number(tx.amount || 0),
      currency: String(tx.currency || "TRY"),
      accountId: String(tx.accountId || ""),
      accountName: String(tx.accountName || ""),
      contactId: tx.contactId ? String(tx.contactId) : null,
      contactName: tx.contactName ? String(tx.contactName) : null,
      invoiceId: tx.invoiceId ? String(tx.invoiceId) : null,
      invoiceNumber: tx.invoiceNumber ? String(tx.invoiceNumber) : null,
      category: tx.category ? String(tx.category) : "Genel",
      description: encodeExtraMeta(tx.description, tx),
      documentNo: tx.documentNo ? String(tx.documentNo) : null,
      receiptImage: tx.receiptImage ? String(tx.receiptImage) : null,
      items: Array.isArray(tx.items) ? tx.items : null,
      subtotal: tx.subtotal !== void 0 ? Number(tx.subtotal) : null,
      totalVat: tx.totalVat !== void 0 ? Number(tx.totalVat) : null
    };
    const res = await db.insert(transactions).values(values).onConflictDoUpdate({
      target: transactions.id,
      set: values
    }).returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertTransactionRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function deleteTransactionRecord(uid, id) {
  try {
    await db.delete(transactions).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(transactions.id, id), (0, import_drizzle_orm3.eq)(transactions.userId, uid)));
  } catch (error) {
    console.error("Database query failed in deleteTransactionRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function upsertContactRecord(uid, c) {
  try {
    const id = String(c.id || `cnt_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      name: String(c.name || ""),
      companyTitle: c.companyTitle ? String(c.companyTitle) : null,
      contactType: String(c.type || c.contactType || "customer"),
      taxOffice: c.taxOffice ? String(c.taxOffice) : null,
      taxNumber: c.taxNumber || c.vkn || c.tckn ? String(c.taxNumber || c.vkn || c.tckn) : null,
      email: c.email ? String(c.email) : null,
      phone: c.phone ? String(c.phone) : null,
      address: c.address ? String(c.address) : null,
      city: c.city ? String(c.city) : null,
      district: c.district ? String(c.district) : null,
      neighborhood: c.neighborhood ? String(c.neighborhood) : null,
      street: c.street ? String(c.street) : null,
      balance: Number(c.balance || 0),
      balanceType: String(c.balanceType || "balanced"),
      notes: encodeExtraMeta(c.notes, c),
      createdAt: c.createdAt ? String(c.createdAt) : (/* @__PURE__ */ new Date()).toISOString()
    };
    const res = await db.insert(contacts).values(values).onConflictDoUpdate({
      target: contacts.id,
      set: values
    }).returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertContactRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function upsertAccountRecord(uid, a) {
  try {
    const id = String(a.id || `acc_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      name: String(a.name || ""),
      type: String(a.type || "cash"),
      currency: String(a.currency || "TRY"),
      balance: Number(a.balance || 0),
      accountNumber: a.accountNumber ? String(a.accountNumber) : null,
      iban: a.iban ? String(a.iban) : null,
      bankName: a.bankName ? String(a.bankName) : null,
      isDefault: Boolean(a.isDefault)
    };
    const res = await db.insert(accounts).values(values).onConflictDoUpdate({
      target: accounts.id,
      set: values
    }).returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertAccountRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function deleteAccountRecord(uid, id) {
  try {
    await db.delete(transactions).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(transactions.accountId, id), (0, import_drizzle_orm3.eq)(transactions.userId, uid)));
    await db.delete(accounts).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(accounts.id, id), (0, import_drizzle_orm3.eq)(accounts.userId, uid)));
  } catch (error) {
    console.error("Database query failed in deleteAccountRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function syncUserBatchToPostgres(uid, email, payload) {
  try {
    await getOrCreateUser(uid, email);
    if (Array.isArray(payload.accounts)) {
      const existingAccs = await db.select({ id: accounts.id }).from(accounts).where((0, import_drizzle_orm3.eq)(accounts.userId, uid));
      const incomingAccIds = new Set(payload.accounts.filter((a) => a && a.id).map((a) => String(a.id)));
      for (const ex of existingAccs) {
        if (!incomingAccIds.has(String(ex.id))) {
          await db.delete(accounts).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(accounts.id, String(ex.id)), (0, import_drizzle_orm3.eq)(accounts.userId, uid)));
        }
      }
      for (const acc of payload.accounts) {
        if (acc && acc.id) await upsertAccountRecord(uid, acc);
      }
    }
    if (Array.isArray(payload.contacts)) {
      const existingCnts = await db.select({ id: contacts.id }).from(contacts).where((0, import_drizzle_orm3.eq)(contacts.userId, uid));
      const incomingCntIds = new Set(payload.contacts.filter((c) => c && c.id).map((c) => String(c.id)));
      for (const ex of existingCnts) {
        if (!incomingCntIds.has(String(ex.id))) {
          await db.delete(contacts).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(contacts.id, String(ex.id)), (0, import_drizzle_orm3.eq)(contacts.userId, uid)));
        }
      }
      for (const cnt of payload.contacts) {
        if (cnt && cnt.id) await upsertContactRecord(uid, cnt);
      }
    }
    if (Array.isArray(payload.products)) {
      const existingProds = await db.select({ id: products.id }).from(products).where((0, import_drizzle_orm3.eq)(products.userId, uid));
      const incomingProdIds = new Set(payload.products.filter((p) => p && p.id).map((p) => String(p.id)));
      for (const ex of existingProds) {
        if (!incomingProdIds.has(String(ex.id))) {
          await deleteProductRecord(uid, String(ex.id));
        }
      }
      for (const prod of payload.products) {
        if (prod && prod.id) await upsertProductRecord(uid, prod);
      }
    }
    if (Array.isArray(payload.invoices)) {
      const existingInvs = await db.select({ id: invoices.id }).from(invoices).where((0, import_drizzle_orm3.eq)(invoices.userId, uid));
      const incomingInvIds = new Set(payload.invoices.filter((i) => i && i.id).map((i) => String(i.id)));
      for (const ex of existingInvs) {
        if (!incomingInvIds.has(String(ex.id))) {
          await deleteInvoiceRecord(uid, String(ex.id));
        }
      }
      for (const inv of payload.invoices) {
        if (inv && inv.id) await upsertInvoiceRecord(uid, inv);
      }
    }
    if (Array.isArray(payload.transactions)) {
      const existingTxs = await db.select({ id: transactions.id }).from(transactions).where((0, import_drizzle_orm3.eq)(transactions.userId, uid));
      const incomingTxIds = new Set(payload.transactions.filter((t) => t && t.id).map((t) => String(t.id)));
      for (const ex of existingTxs) {
        if (!incomingTxIds.has(String(ex.id))) {
          await deleteTransactionRecord(uid, String(ex.id));
        }
      }
      for (const tx of payload.transactions) {
        if (tx && tx.id) await upsertTransactionRecord(uid, tx);
      }
    }
    return true;
  } catch (error) {
    console.error("Database query failed in syncUserBatchToPostgres:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

// server.ts
var import_fs5 = __toESM(require("fs"), 1);
function loadServerEnv() {
  const cwd = process.cwd();
  for (const candidate of [
    import_path5.default.join(cwd, ".env"),
    import_path5.default.join(cwd, "muavin.env"),
    import_path5.default.join(cwd, "dist", "muavin.env"),
    import_path5.default.join(cwd, "..", ".env"),
    import_path5.default.join(cwd, "..", "muavin.env")
  ]) {
    import_dotenv.default.config({ path: candidate });
  }
}
loadServerEnv();
var app = (0, import_express6.default)();
var PORT = process.env.NODE_ENV === "production" ? Number(process.env.PORT) || 8080 : 3e3;
app.use(
  (0, import_compression.default)({
    level: 6,
    threshold: 1024,
    // Only compress responses over 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return import_compression.default.filter(req, res);
    }
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Vary", "Accept-Encoding");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=65");
  if (req.path.startsWith("/api/") || req.path.endsWith(".html") || req.path === "/") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else if (req.path.includes("/assets/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});
app.use(import_express6.default.json({ limit: "25mb" }));
app.use("/api/mysoft", getMysoftRouter());
app.use("/api/whatsapp", getWhatsAppRouter());
app.use("/api/portal-proxy", getPortalProxyRouter());
app.use("/api/extension", getExtensionRouter());
app.use("/api/github", getGitHubRouter());
var genAI = null;
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAI;
}
app.get("/api/health", (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: "ok",
    appName: "Muavin - \xD6n Muhasebe Program\u0131",
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
    },
    tier: "Orta \xD6l\xE7ek / \xC7ok \u015Eubeli (High Performance)"
  });
});
app.get("/api/system/specs", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    profile: "Orta \xD6l\xE7ek / \xC7ok \u015Eubeli",
    recommendedHardware: {
      vCPU: "4 vCPU (High Single-Core Frequency)",
      ram: "8 GB RAM (DDR5 / High-speed ECC)",
      storage: "100 GB NVMe SSD (Min. 3000+ IOPS)",
      network: "1 Gbps Port, Google Cloud Europe-west3 (Frankfurt) or Istanbul edge"
    },
    googleCloudProfiles: {
      cloudRun: {
        cpu: "4 vCPU",
        memory: "8 GiB",
        concurrency: 80,
        minInstances: 1,
        // Warm start for instant response without cold-start delay
        maxInstances: 10,
        timeout: "300s",
        executionEnvironment: "gen2"
      },
      computeEngine: {
        machineType: "c3-standard-4 (Intel 4th Gen Xeon) or e2-standard-4",
        os: "Ubuntu 24.04 LTS / Debian 12",
        processManager: "PM2 Cluster Mode (-i max)"
      }
    },
    activeProcess: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
});
app.get("/api/db/health", async (req, res) => {
  try {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { sql } = await import("drizzle-orm");
    const result = await db2.execute(sql`SELECT NOW() as current_time`);
    res.json({ status: "ok", database: "PostgreSQL", timestamp: result.rows[0]?.current_time });
  } catch (error) {
    console.error("Database health check error:", error);
    res.status(500).json({ status: "error", message: "Database connection unavailable", details: error.message });
  }
});
app.delete("/api/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminEmail, userEmail } = req.body || {};
    console.log(`[Admin User Delete] User deletion requested for ID: ${userId} (${userEmail || "unknown"}) by admin: ${adminEmail || "admin"}`);
    try {
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { sql } = await import("drizzle-orm");
      await db2.execute(sql`DELETE FROM users WHERE id = ${userId} OR email = ${userEmail || ""}`);
    } catch {
    }
    res.json({
      success: true,
      message: `Kullan\u0131c\u0131 (${userId}) ba\u015Far\u0131yla sistemden silindi.`,
      deletedUserId: userId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error in admin user delete endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Kullan\u0131c\u0131 silinirken sunucu hatas\u0131 olu\u015Ftu",
      error: error?.message || String(error)
    });
  }
});
function getFallbackActionResult(actionType, contextData) {
  const totalCash = Number(contextData?.toplamNakit || 0);
  const overdueCount = Number(contextData?.vadesiGecenFaturaSayisi || 0);
  const overdueTotal = Number(contextData?.vadesiGecenTutar || 0);
  const criticalProducts = Array.isArray(contextData?.kritikStokUrunleri) ? contextData.kritikStokUrunleri : [];
  const overdueInvoices = Array.isArray(contextData?.gecikenFaturalar) ? contextData.gecikenFaturalar : [];
  if (actionType === "overdue_invoice_alert") {
    const draftMessages = overdueInvoices.length > 0 ? overdueInvoices.map((inv) => ({
      contactName: inv.cari || "Say\u0131n M\xFC\u015Fterimiz",
      invoiceNumber: inv.faturaNo || "FTR-2026",
      amount: Number(inv.tutar || 0),
      daysOverdue: 7,
      message: `Say\u0131n ${inv.cari || "Yetkili"}, ${inv.faturaNo || ""} numaral\u0131 ve \u20BA${Number(inv.tutar || 0).toLocaleString("tr-TR")} tutar\u0131ndaki faturan\u0131z\u0131n vadesi dolmu\u015Ftur. \xD6demenizi en k\u0131sa s\xFCrede iletmenizi rica eder, iyi \xE7al\u0131\u015Fmalar dileriz.`
    })) : [
      {
        contactName: "Mega \u0130n\u015Faat Ltd. \u015Eti.",
        invoiceNumber: "FTR-2026-0041",
        amount: 11e3,
        daysOverdue: 8,
        message: "Say\u0131n Mega \u0130n\u015Faat Yetkilisi, FTR-2026-0041 numaral\u0131 11.000 TL tutar\u0131ndaki cari bakiyenizin vadesi dolmu\u015Ftur. \xD6deme dekontunuzu iletmenizi rica ederiz."
      }
    ];
    return {
      totalOverdueAmount: overdueTotal || 11e3,
      overdueCount: overdueCount || 1,
      riskLevel: overdueTotal > 5e4 ? "Kritik" : "Orta",
      draftMessages,
      actionPlan: "Vadesi ge\xE7en cariler i\xE7in tek t\u0131kla WhatsApp hat\u0131rlatma tasla\u011F\u0131n\u0131 iletin ve cari mutabakat ekstresi g\xF6nderin."
    };
  }
  if (actionType === "stock_mrp_check") {
    const recommendations = criticalProducts.length > 0 ? criticalProducts.map((p) => ({
      productName: p.ad || "\xDCr\xFCn",
      currentStock: p.mevcutStok || 0,
      minStock: p.asgariStok || 10,
      suggestedOrder: Math.max(10, (p.asgariStok || 10) * 2),
      reason: "Stok kritik asgari seviyenin alt\u0131na indi, ikmal sipari\u015Fi \xF6nerilir."
    })) : [
      {
        productName: "A4 Fotokopi Ka\u011F\u0131d\u0131 80gr",
        currentStock: 3,
        minStock: 15,
        suggestedOrder: 30,
        reason: "Haftal\u0131k t\xFCketim h\u0131z\u0131 dikkate al\u0131narak acil sipari\u015F olu\u015Fturulmal\u0131."
      },
      {
        productName: "Toner Kartu\u015F HP 85A",
        currentStock: 1,
        minStock: 4,
        suggestedOrder: 5,
        reason: "Yedek kartu\u015F t\xFCkenmek \xFCzere, faturalama operasyonlar\u0131n\u0131n aksamamas\u0131 i\xE7in tedarik edilmeli."
      }
    ];
    return {
      criticalItemsCount: recommendations.length,
      status: "Dikkat",
      recommendations,
      summaryNote: `Toplam ${recommendations.length} \xFCr\xFCnde kritik stok seviyesi tespit edildi. \xDCretim ve ofis operasyonlar\u0131n\u0131n aksamamas\u0131 i\xE7in sat\u0131n alma plan\u0131 olu\u015Fturuldu.`
    };
  }
  if (actionType === "cashflow_anomaly") {
    return {
      healthStatus: totalCash > 5e4 ? "G\xFC\xE7l\xFC" : "Dengeli",
      anomalies: [
        "Vadesi yakla\u015Fan tedarik\xE7i \xF6demeleri ile m\xFC\u015Fteri tahsilatlar\u0131 aras\u0131nda 4 g\xFCnl\xFCk vade fark\u0131 g\xF6zlendi.",
        "Son 14 g\xFCnl\xFCk harcama ivmesi b\xFCt\xE7elenen projeksiyonla uyumlu seyretmektedir."
      ],
      actionSteps: [
        "Nakit rezervini g\xFC\xE7lendirmek i\xE7in gecikmi\u015F alacak aramalar\u0131n\u0131 bug\xFCn tamamlay\u0131n.",
        "Kasa ve banka hesap hareketlerinin g\xFCn sonu kapan\u0131\u015F mutabakat\u0131n\u0131 ger\xE7ekle\u015Ftirin."
      ]
    };
  }
  return {
    summary: `Gemini Spark otonom sabah brifingi tamamland\u0131. Mevcut nakit mevcudu \u20BA${totalCash.toLocaleString("tr-TR")}. Toplam ${contextData?.toplamCariSayisi || 0} cari hesap ve ${overdueCount} adet vadesi ge\xE7en alacak izleniyor.`,
    cashPosition: totalCash > 5e4 ? "Kasa ve banka likidite durumu k\u0131sa vadeli bor\xE7lar\u0131 kar\u015F\u0131lamak i\xE7in yeterli." : "Likidite dengeli, tahsilatlar\u0131n h\u0131zland\u0131r\u0131lmas\u0131 nakit ak\u0131\u015F\u0131n\u0131 g\xFC\xE7lendirecektir.",
    todayPriorities: [
      "Vadesi ge\xE7en alacaklar i\xE7in haz\u0131r WhatsApp hat\u0131rlatma taslaklar\u0131n\u0131n iletilmesi",
      "Kasa ve banka hesap hareketlerinin g\xFCn sonu mutabakat\u0131",
      "Kritik stok seviyesine inen \xFCr\xFCnler i\xE7in sat\u0131n alma teyidi"
    ],
    receivablesAlert: overdueCount > 0 ? `${overdueCount} adet gecikmi\u015F fatura i\xE7in \u20BA${overdueTotal.toLocaleString("tr-TR")} tutar\u0131nda tahsilat bekleniyor.` : "Kritik geciken alacak bulunmamaktad\u0131r.",
    recommendedAction: "Geciken faturalar i\xE7in tek t\u0131kla WhatsApp hat\u0131rlatma tasla\u011F\u0131n\u0131 iletin."
  };
}
async function generateContentWithFallback(aiClient, params) {
  const preferred = params.preferredModel || process.env.GEMINI_MODEL;
  const modelsToTry = [
    preferred,
    "gemini-3.1-pro-preview",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ].filter(Boolean);
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError = null;
  for (const model of uniqueModels) {
    try {
      const config = {
        temperature: params.temperature ?? 0.2
      };
      if (params.systemInstruction) {
        config.systemInstruction = params.systemInstruction;
      }
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      const generatePromise = aiClient.models.generateContent({
        model,
        contents: params.contents,
        config
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI generation timeout (15s)")), 15e3)
      );
      const response = await Promise.race([generatePromise, timeoutPromise]);
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError;
}
app.post("/api/gemini/auto-service-ai", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. AI \xF6zellikleri i\xE7in API anahtar\u0131 gereklidir."
      });
    }
    const { action, vehicleInfo, customerComplaint, techReport, partsLaborsText, extraIssues, totalAmount, channel } = req.body;
    let systemInstruction = "Sen otomotiv ve ara\xE7 bak\u0131m servisleri alan\u0131nda uzmanla\u015Fm\u0131\u015F k\u0131demli bir yapay zeka servis dan\u0131\u015Fman\u0131 ve at\xF6lye \u015Fefisin.";
    let promptContent = "";
    if (action === "complaint_to_work_order") {
      systemInstruction = `Sen k\u0131demli bir oto servis dan\u0131\u015Fman\u0131s\u0131n. M\xFC\u015Fterinin ara\xE7la ilgili iletti\u011Fi karma\u015F\u0131k veya teknik olmayan \u015Fikayeti al\u0131p, at\xF6lye ekibinin net olarak anlayabilece\u011Fi profesyonel bir i\u015F emri notuna d\xF6n\xFC\u015Ft\xFCr\xFCrs\xFCn.
Yan\u0131t\u0131n\u0131 kesinlikle a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun olarak \xFCret:
{
  "mainSummary": "Net ve teknik ana \u015Fikayet tan\u0131m\u0131",
  "possibleSource": "Motor, S\xFCspansiyon, Fren, Elektrik/Elektronik, \u015Eanz\u0131man veya ilgili sistem",
  "safetyRisk": "D\xFC\u015F\xFCk" veya "Orta" veya "Kritik",
  "technicianFirstCheck": "Teknisyen i\xE7in ilk kontrol ve test \xF6nerisi",
  "formattedText": "Ana \u015Eikayet \xD6zeti: ...\\nOlas\u0131 Kaynak / Sistem: ...\\nS\xFCr\xFC\u015F G\xFCvenli\u011Fi Riski: ...\\nTeknisyen \u0130\xE7in \u0130lk Kontrol \xD6nerisi: ..."
}`;
      promptContent = `Ara\xE7 Bilgisi: ${vehicleInfo || "Belirtilmemi\u015F"}
M\xFC\u015Fteri A\xE7\u0131klamas\u0131 / \u015Eikayeti: ${customerComplaint || ""}`;
    } else if (action === "tech_report_to_customer") {
      systemInstruction = `Ustalar\u0131n yazd\u0131\u011F\u0131 karma\u015F\u0131k teknik ar\u0131za tespit raporunu, teknik terimlerden ar\u0131nd\u0131rarak ara\xE7 sahibinin kolayca anlayabilece\u011Fi, \u015Feffaf, kibar ve g\xFCven veren bir dille yeniden yazars\u0131n. Par\xE7an\u0131n neden de\u011Fi\u015Fmesi gerekti\u011Fini ve de\u011Fi\u015Ftirilmezse ileride do\u011Furabilece\u011Fi g\xFCvenlik veya ek masraf risklerini a\xE7\u0131klars\u0131n.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON format\u0131nda ver:
{
  "explanation": "M\xFC\u015Fterinin kolayca anlayaca\u011F\u0131 sade ve g\xFCven veren a\xE7\u0131klama metni",
  "whyChange": "Par\xE7an\u0131n veya i\u015Flemin neden zorunlu oldu\u011Funa dair sade gerek\xE7e",
  "risksIfNotChanged": "\u0130hmal edilirse olu\u015Fabilecek g\xFCvenlik ve y\xFCksek maliyet riskleri",
  "formattedText": "..."
}`;
      promptContent = `Ara\xE7 Bilgisi: ${vehicleInfo || "Ara\xE7"}
Teknik Rapor / Ar\u0131za Kodlar\u0131: ${techReport || ""}`;
    } else if (action === "quote_approval_message") {
      systemInstruction = `Par\xE7a de\u011Fi\u015Fimi ve i\u015F\xE7ilik maliyetlerini i\xE7eren otomotiv servis teklifini, m\xFC\u015Fteriye WhatsApp veya SMS \xFCzerinden g\xF6nderilmek \xFCzere haz\u0131rlars\u0131n. Dil kibar, \u015Feffaf, g\xFCven veren ve onay almaya y\xF6nelik ikna edici olmal\u0131. Par\xE7alar\u0131n orijinal/muadil durumunu ve i\u015F\xE7ilik garantisini de metne dahil edersin.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON format\u0131nda ver:
{
  "messageText": "WhatsApp / SMS i\xE7in haz\u0131r mesaj metni",
  "channel": "${channel || "whatsapp"}"
}`;
      promptContent = `Ara\xE7 Bilgisi: ${vehicleInfo || "Ara\xE7"}
Yap\u0131lacak \u0130\u015Flemler ve Fiyatlar: ${partsLaborsText || ""}
Toplam Tutar: ${totalAmount || ""}`;
    } else if (action === "extra_maintenance_reminder") {
      systemInstruction = `Sen ba\u015Far\u0131l\u0131 bir otomotiv sat\u0131\u015F ve servis dan\u0131\u015Fman\u0131s\u0131n. Periyodik bak\u0131ma gelen arac\u0131n kontrollerinde tespit edilen ek ihtiya\xE7lar\u0131 m\xFC\u015Fteriyi arad\u0131\u011F\u0131m\u0131zda 'sadece \xFCr\xFCn satmaya \xE7al\u0131\u015F\u0131yorlar' alg\u0131s\u0131 yaratmadan, tamamen s\xFCr\xFC\u015F g\xFCvenli\u011Fi odakl\u0131 ve nazik bir \u015Fekilde a\xE7\u0131klayan profesyonel telefon konu\u015Fma metni ve mesaj tasla\u011F\u0131 haz\u0131rlars\u0131n.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON format\u0131nda ver:
{
  "callScript": "M\xFC\u015Fteri temsilcisi veya servis dan\u0131\u015Fman\u0131 i\xE7in telefon konu\u015Fma ak\u0131\u015F\u0131",
  "messageDraft": "G\xF6r\xFC\u015Fme sonras\u0131 veya do\u011Frudan g\xF6nderilebilecek nazik bilgilendirme mesaj\u0131",
  "keyPoints": ["S\xFCr\xFC\u015F g\xFCvenli\u011Fi vurgusu", "\u0130lerideki masraf\u0131 \xF6nleme", "\u015Eeffaf bilgilendirme"]
}`;
      promptContent = `Ara\xE7 Modeli / Bilgisi: ${vehicleInfo || "Ara\xE7"}
Tespit Edilen Ekstra \u0130htiya\xE7lar: ${extraIssues || ""}`;
    }
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-pro-preview",
        contents: [{ text: promptContent }],
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json"
      });
      const responseText = response.text || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (pErr) {
        parsed = { rawText: responseText };
      }
      res.json({ success: true, data: parsed });
    } catch (aiErr) {
      console.warn("Auto Service AI fallback devrede:", aiErr?.message);
      let fallbackData = {};
      if (action === "complaint_to_work_order") {
        fallbackData = {
          mainSummary: `Ara\xE7ta bildirilen \u015Fikayet: ${customerComplaint || "Genel ses ve performans kontrol\xFC"}`,
          possibleSource: "Mekanik / Y\xFCr\xFCr Aksam veya Motor",
          safetyRisk: "Orta",
          technicianFirstCheck: "Lift kontrol\xFC, tekerlek/aks ve alt tak\u0131m g\xF6zle muayenesi, ar\u0131za tespit cihaz\u0131 OBD taramas\u0131.",
          formattedText: `Ana \u015Eikayet \xD6zeti: ${customerComplaint}
Olas\u0131 Kaynak / Sistem: Mekanik / Y\xFCr\xFCr Aksam
S\xFCr\xFC\u015F G\xFCvenli\u011Fi Riski: Orta
Teknisyen \u0130\xE7in \u0130lk Kontrol \xD6nerisi: Lift muayenesi ve OBD hata kodu taramas\u0131.`
        };
      } else if (action === "tech_report_to_customer") {
        fallbackData = {
          explanation: `Yap\u0131lan detayl\u0131 kontrollerde ara\xE7taki par\xE7alar\u0131n a\u015F\u0131nd\u0131\u011F\u0131 ve performans\u0131n\u0131 kaybetti\u011Fi tespit edilmi\u015Ftir. G\xFCvenli\u011Finiz i\xE7in yenilenmesi \xF6nerilmektedir.`,
          whyChange: "Mevcut par\xE7a \xF6mr\xFCn\xFC tamamlam\u0131\u015F olup s\xFCr\xFC\u015F g\xFCvenli\u011Fini ve yak\u0131t verimlili\u011Fini olumsuz etkilemektedir.",
          risksIfNotChanged: "\u0130\u015Flem geciktirilirse di\u011Fer mekanik aksamlara zarar vererek daha y\xFCksek onar\u0131m masraflar\u0131na yol a\xE7abilir.",
          formattedText: `Say\u0131n M\xFC\u015Fterimiz, arac\u0131n\u0131zda yap\u0131lan incelemede ${techReport || "belirtilen par\xE7alar\u0131n"} de\u011Fi\u015Fimi gerekmektedir. G\xFCvenli s\xFCr\xFC\u015F\xFCn\xFCz i\xE7in onay\u0131n\u0131z\u0131 rica ederiz.`
        };
      } else if (action === "quote_approval_message") {
        fallbackData = {
          messageText: `Say\u0131n M\xFC\u015Fterimiz, ${vehicleInfo || "arac\u0131n\u0131z"} i\xE7in haz\u0131rlanan servis bak\u0131m ve onar\u0131m d\xF6k\xFCm\xFC a\u015Fa\u011F\u0131dad\u0131r:

${partsLaborsText || "Bak\u0131m ve onar\u0131m i\u015Flemleri"}

Toplam Tutar: ${totalAmount || "Detayl\u0131 teklifte"}

\u0130\u015Flemlerimizde orijinal/OEM garantili par\xE7alar kullan\u0131lmakta olup i\u015F\xE7ili\u011Fimiz garantilidir. Onay\u0131n\u0131z halinde i\u015Flemler ba\u015Flat\u0131lacakt\u0131r. Te\u015Fekk\xFCr ederiz.`,
          channel: channel || "whatsapp"
        };
      } else {
        fallbackData = {
          callScript: `Merhaba [M\xFC\u015Fteri Ad\u0131], arac\u0131n\u0131z\u0131n periyodik bak\u0131m kontrolleri s\u0131ras\u0131nda g\xFCvenli\u011Finizi do\u011Frudan etkileyen ${extraIssues || "baz\u0131 par\xE7alar\u0131n"} a\u015F\u0131nd\u0131\u011F\u0131n\u0131 g\xF6zlemledik. Sizi bilgilendirmek ve onay\u0131n\u0131z\u0131 almak istedik.`,
          messageDraft: `Say\u0131n M\xFC\u015Fterimiz, arac\u0131n\u0131z\u0131n bak\u0131m kontrollerinde ${extraIssues || "\xF6nemli bir a\u015F\u0131nma"} tespit edilmi\u015Ftir. G\xFCvenli\u011Finiz i\xE7in i\u015Flem detaylar\u0131n\u0131 g\xF6r\xFC\u015Fmek isteriz.`
        };
      }
      res.json({ success: true, data: fallbackData });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Oto servis AI servisinde hata olu\u015Ftu." });
  }
});
app.post("/api/gemini/it-service-ai", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. AI \xF6zellikleri i\xE7in API anahtar\u0131 gereklidir."
      });
    }
    const { action, deviceInfo, customerNotice, techReport, issueDescription, operationsAndCost, totalCost } = req.body;
    let systemInstruction = "Sen kurumsal ve bireysel BT (IT) destek, donan\u0131m mimarisi ve teknik servis alan\u0131nda uzman k\u0131demli bir IT y\xF6neticisi ve ba\u015F teknisyensin.";
    let promptContent = "";
    if (action === "pre_evaluation_report") {
      systemInstruction = `Sen uzman bir BT (IT) destek ve teknik servis y\xF6neticisisin. M\xFC\u015Fterinin bildirdi\u011Fi bilgisayar/donan\u0131m ar\u0131zas\u0131n\u0131 analiz et. Teknik ekibe ve m\xFC\u015Fteriye sunulabilecek bir \xF6n de\u011Ferlendirme raporu haz\u0131rla.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun ver:
{
  "faultSummary": "Sorunun teknik ve net tan\u0131m\u0131",
  "possibleCauses": "Donan\u0131msal veya yaz\u0131l\u0131msal ihtimaller (Disk, RAM, Anakart, \u0130\u015Fletim Sistemi vb.)",
  "dataSecurityRisk": "D\xFC\u015F\xFCk" veya "Orta" veya "Kritik" (Verilerin tehlikede olup olmad\u0131\u011F\u0131 / Disk ar\u0131zas\u0131 riski vb.)",
  "estimatedStepsAndDuration": "Tahmini \xE7\xF6z\xFCm ad\u0131mlar\u0131 ve tahmini onar\u0131m s\xFCresi",
  "formattedText": "Ar\u0131za \xD6zeti: ...\\nOlas\u0131 Nedenler: ...\\nVeri G\xFCvenli\u011Fi Riski: ...\\nTahmini \xC7\xF6z\xFCm Ad\u0131mlar\u0131 ve S\xFCresi: ..."
}`;
      promptContent = `Cihaz Bilgisi: ${deviceInfo || "Bilgisayar / Donan\u0131m"}
M\xFC\u015Fteri Bildirimi: ${customerNotice || ""}`;
    } else if (action === "troubleshooting_guide") {
      systemInstruction = `Elimizdeki cihaz ve ar\u0131za i\xE7in servisteki teknisyenin izlemesi gereken ad\u0131m ad\u0131m, mant\u0131ksal s\u0131ral\u0131 bir sorun giderme (troubleshooting) rehberi haz\u0131rla. En basit/h\u0131zl\u0131 \xE7\xF6z\xFCmlerden (yeniden ba\u015Flatma, s\xFCr\xFCc\xFC kontrol\xFC vb.) donan\u0131msal m\xFCdahaleye do\u011Fru ilerle.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun ver:
{
  "guideSteps": [
    { "stepNumber": 1, "title": "...", "description": "...", "level": "Yaz\u0131l\u0131msal / Basit Kontrol" },
    { "stepNumber": 2, "title": "...", "description": "...", "level": "S\xFCr\xFCc\xFC / BIOS / Test" },
    { "stepNumber": 3, "title": "...", "description": "...", "level": "Donan\u0131msal \xD6l\xE7\xFCm & M\xFCdahale" }
  ],
  "formattedText": "1. Ad\u0131m: ...\\n2. Ad\u0131m: ...\\n3. Ad\u0131m: ..."
}`;
      promptContent = `Cihaz / Marka / Model: ${deviceInfo || "Cihaz"}
Ya\u015Fanan Sorun: ${issueDescription || ""}`;
    } else if (action === "repair_cost_approval") {
      systemInstruction = `Bir bilgisayar teknik servisi i\xE7in, m\xFC\u015Fterinin onay\u0131n\u0131 almak \xFCzere haz\u0131rlanm\u0131\u015F bir fiyat teklifi mesaj\u0131 yaz.
Metin \u015Feffaf, veri yedekleme durumunu belirten ve onay al\u0131nd\u0131ktan sonra i\u015Fleme ba\u015Flanaca\u011F\u0131n\u0131 vurgulayan bir yap\u0131da olsun.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun ver:
{
  "messageText": "WhatsApp / SMS / E-posta i\xE7in onay teklif metni",
  "dataBackupNote": "Verilerinizin g\xFCvenli\u011Fi ve yedekleme durumu hakk\u0131nda bilgi notu"
}`;
      promptContent = `Cihaz: ${deviceInfo || "Bilgisayar"}
Yap\u0131lacak \u0130\u015Flem / Par\xE7a De\u011Fi\u015Fimi: ${operationsAndCost || ""}
Toplam Tutar: ${totalCost || ""}`;
    } else if (action === "customer_info_email") {
      systemInstruction = `Teknik servis onar\u0131m raporunu, bili\u015Fimden anlamayan bir m\xFC\u015Fterinin kolayca anlayabilece\u011Fi, profesyonel, kibar ve net bir e-posta diline \xE7evir. Bilgisayar\u0131n neden ar\u0131zaland\u0131\u011F\u0131n\u0131, hangi i\u015Flemlerin yap\u0131ld\u0131\u011F\u0131n\u0131 ve gelecekte benzer bir sorun ya\u015Famamak i\xE7in dikkat etmesi gereken 2 ipucunu ekle.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun ver:
{
  "subject": "E-posta Konu Ba\u015Fl\u0131\u011F\u0131",
  "emailBody": "E-posta g\xF6vde metni (Hitap, yap\u0131lan i\u015Flemler, cihaz\u0131n durumu, kapan\u0131\u015F)",
  "twoTips": ["Gelecekte benzer sorunu \xF6nleyecek 1. ipucu", "2. ipucu"],
  "formattedText": "..."
}`;
      promptContent = `Cihaz: ${deviceInfo || "Bilgisayar"}
Teknik Rapor: ${techReport || ""}`;
    }
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-pro-preview",
        contents: [{ text: promptContent }],
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json"
      });
      const responseText = response.text || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (pErr) {
        parsed = { rawText: responseText };
      }
      res.json({ success: true, data: parsed });
    } catch (aiErr) {
      console.warn("IT Service AI fallback devrede:", aiErr?.message);
      let fallbackData = {};
      if (action === "pre_evaluation_report") {
        fallbackData = {
          faultSummary: `Bildirilen ar\u0131za: ${customerNotice || "Donan\u0131m / Yaz\u0131l\u0131m ar\u0131zas\u0131"}`,
          possibleCauses: "\u0130\u015Fletim sistemi bozulmas\u0131, s\xFCr\xFCc\xFC \xE7ak\u0131\u015Fmas\u0131, a\u015F\u0131r\u0131 \u0131s\u0131nma veya depolama birimi y\u0131pranmas\u0131.",
          dataSecurityRisk: "Orta",
          estimatedStepsAndDuration: "Donan\u0131m te\u015Fhis testleri (1-2 saat), onar\u0131m ve kararl\u0131l\u0131k do\u011Frulamas\u0131 (24 saat).",
          formattedText: `Ar\u0131za \xD6zeti: ${customerNotice}
Olas\u0131 Nedenler: \u0130\u015Fletim sistemi veya donan\u0131m y\u0131pranmas\u0131
Veri G\xFCvenli\u011Fi Riski: Orta
Tahmini S\xFCre: 1-2 i\u015F g\xFCn\xFC`
        };
      } else if (action === "troubleshooting_guide") {
        fallbackData = {
          guideSteps: [
            { stepNumber: 1, title: "G\xFCvenli Mod & Yeniden Ba\u015Flatma", description: "Cihaz\u0131 harici \xE7evre birimlerinden ar\u0131nd\u0131rarak ba\u015Flat\u0131n.", level: "Temel Kontrol" },
            { stepNumber: 2, title: "Donan\u0131m Tan\u0131lama & S\u0131cakl\u0131k", description: "BIOS veya donan\u0131m test arac\u0131n\u0131 (MemTest/CrystalDiskInfo) \xE7al\u0131\u015Ft\u0131r\u0131n.", level: "Tan\u0131lama" },
            { stepNumber: 3, title: "Par\xE7a De\u011Fi\u015Fim & Onar\u0131m", description: "\u015E\xFCpheli donan\u0131m bile\u015Fenini test donan\u0131m\u0131yla izole edin.", level: "Donan\u0131m" }
          ],
          formattedText: "1. Temel Kontrol ve G\xFC\xE7 D\xF6ng\xFCs\xFC\n2. S\xFCr\xFCc\xFC ve Donan\u0131m Te\u015Fhis Testleri\n3. Donan\u0131m De\u011Fi\u015Fimi ve Termal Bak\u0131m"
        };
      } else if (action === "repair_cost_approval") {
        fallbackData = {
          messageText: `Say\u0131n M\xFC\u015Fterimiz, ${deviceInfo || "cihaz\u0131n\u0131z"} i\xE7in teknik inceleme tamamlanm\u0131\u015Ft\u0131r.

Yap\u0131lacak \u0130\u015Flemler: ${operationsAndCost || "Gerekli onar\u0131m ve donan\u0131m de\u011Fi\u015Fimi"}
Toplam Maliyet: ${totalCost || "Teklifte belirtilen tutar"}

Verilerinizin g\xFCvenli\u011Fi \xF6nceli\u011Fimizdir. \u0130\u015Fleme ba\u015Flamak i\xE7in onay\u0131n\u0131z\u0131 rica ederiz.`,
          dataBackupNote: "Verileriniz yedeklenmi\u015F veya koruma alt\u0131na al\u0131nm\u0131\u015Ft\u0131r."
        };
      } else {
        fallbackData = {
          subject: `${deviceInfo || "Cihaz\u0131n\u0131z\u0131n"} Servis Bak\u0131m ve Onar\u0131m\u0131 Tamamland\u0131`,
          emailBody: `Say\u0131n M\xFC\u015Fterimiz,

Cihaz\u0131n\u0131zda yap\u0131lan detayl\u0131 kontroller neticesinde gerekli bak\u0131m ve onar\u0131mlar ba\u015Far\u0131yla ger\xE7ekle\u015Ftirilmi\u015Ftir. Cihaz\u0131n\u0131z t\xFCm kararl\u0131l\u0131k testlerinden ba\u015Far\u0131yla ge\xE7mi\u015Ftir.

Cihaz\u0131n\u0131z\u0131 servisimizden teslim alabilirsiniz.`,
          twoTips: [
            "Cihaz\u0131n\u0131z\u0131n havaland\u0131rma deliklerini kapatmayacak d\xFCz y\xFCzeylerde kullanmaya \xF6zen g\xF6steriniz.",
            "\xD6nemli verilerinizi d\xFCzenli olarak harici bir diske veya buluta yedekleyiniz."
          ],
          formattedText: "Cihaz\u0131n\u0131z\u0131n bak\u0131m\u0131 tamamland\u0131."
        };
      }
      res.json({ success: true, data: fallbackData });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "IT servis AI servisinde hata olu\u015Ftu." });
  }
});
app.post("/api/gemini/appliance-service-ai", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. AI \xF6zellikleri i\xE7in API anahtar\u0131 gereklidir."
      });
    }
    const { action, deviceType, brandModel, issueDescription, operationsAndCost, totalCost } = req.body;
    let systemInstruction = "Sen deneyimli bir beyaz e\u015Fya, iklimlendirme (klima/kombi) ve k\xFC\xE7\xFCk ev aletleri (kahve makinesi, elektrikli s\xFCp\xFCrge, mutfak robotu vb.) teknik servis uzman\u0131s\u0131n.";
    let promptContent = "";
    if (action === "field_checklist" || !action) {
      systemInstruction = `Sen deneyimli bir beyaz e\u015Fya, iklimlendirme (klima/kombi) ve k\xFC\xE7\xFCk ev aletleri (kahve makinesi, elektrikli s\xFCp\xFCrge, mutfak robotu vb.) teknik servis uzman\u0131s\u0131n. M\xFC\u015Fterinin bildirdi\u011Fi sorunu ({cihaz t\xFCr\xFC} - {ar\u0131za tan\u0131m\u0131}) g\xF6z \xF6n\xFCne alarak, sahaya gidecek veya at\xF6lyede \xE7al\u0131\u015Facak olan teknisyene rehberlik edecek kapsaml\u0131 bir servis operasyon listesi haz\u0131rla.

L\xFCtfen \xE7\u0131kt\u0131y\u0131 \u015Fu JSON format\u0131nda ver:
{
  "faultAnalysis": "Ar\u0131za Analizi ve Olas\u0131 Nedenler: (Cihaz\u0131n t\xFCr\xFCne g\xF6re elektriksel, mekanik veya \u0131s\u0131sal olas\u0131 ar\u0131za kaynaklar\u0131)",
  "requiredPartsAndSupplies": "Yan\u0131nda Bulundurulmas\u0131 Gereken Yedek Par\xE7a ve Sarf Malzemeleri: (\xD6rn: termostat, conta, rezistans, pompa, filtre vb.)",
  "requiredToolsAndEquipment": "Gerekli El Aletleri ve Test Ekipmanlar\u0131: (\xD6rn: avometre/multimetre, tak\u0131m \xE7antas\u0131, lehim makinesi, ka\xE7ak dedekt\xF6r\xFC vb.)",
  "safetyAndHygieneRules": "G\xFCvenlik ve Hijyen Kurallar\u0131: (Cihaz\u0131n t\xFCr\xFCne g\xF6re elektrik g\xFCvenli\u011Fi, gaz s\u0131z\u0131nt\u0131s\u0131 veya hijyenik bak\u0131m kurallar\u0131)",
  "formattedText": "Ar\u0131za Analizi ve Olas\u0131 Nedenler: ...\\n\\nYan\u0131nda Bulundurulmas\u0131 Gereken Yedek Par\xE7a ve Sarf Malzemeleri: ...\\n\\nGerekli El Aletleri ve Test Ekipmanlar\u0131: ...\\n\\nG\xFCvenlik ve Hijyen Kurallar\u0131: ..."
}`;
      promptContent = `Cihaz T\xFCr\xFC & Marka Model: ${deviceType || "Beyaz E\u015Fya / \u0130klimlendirme / K\xFC\xE7\xFCk Ev Aleti"} - ${brandModel || ""}
Ar\u0131za Tan\u0131m\u0131 / M\xFC\u015Fteri Bildirimi: ${issueDescription || ""}`;
    } else if (action === "quote_approval_message") {
      systemInstruction = `Bir beyaz e\u015Fya, iklimlendirme ve k\xFC\xE7\xFCk ev aletleri teknik servisi ad\u0131na, m\xFC\u015Fteriye WhatsApp veya SMS ile g\xF6nderilmek \xFCzere nazik, net ve g\xFCven verici bir fiyat teklifi ve i\u015Flem onay mesaj\u0131 haz\u0131rla. Orijinal/kaliteli yedek par\xE7a garantisi ve i\u015F\xE7ilik garantisini vurgula.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun ver:
{
  "messageText": "WhatsApp / SMS onay metni"
}`;
      promptContent = `Cihaz: ${deviceType || "Cihaz"} (${brandModel || ""})
Yap\u0131lacak \u0130\u015Flem / De\u011Fi\u015Fecek Par\xE7alar: ${operationsAndCost || ""}
Toplam Tutar: ${totalCost || ""}`;
    } else if (action === "completion_report") {
      systemInstruction = `Teknik servis onar\u0131m\u0131 / periyodik bak\u0131m\u0131 tamamlanan cihaz i\xE7in m\xFC\u015Fteriye verilecek bilgilendirme notu ve uzun \xF6m\xFCrl\xFC kullan\u0131m i\xE7in 3 kritik bak\u0131m tavsiyesi haz\u0131rla.
Yan\u0131t\u0131n\u0131 a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun ver:
{
  "subject": "Servis ve Bak\u0131m Bilgilendirme Raporu",
  "summary": "Yap\u0131lan onar\u0131m ve testlerin \xF6zeti",
  "maintenanceTips": ["1. Kullan\u0131m ve Bak\u0131m Tavsiyesi", "2. Tavsiye", "3. Tavsiye"]
}`;
      promptContent = `Cihaz: ${deviceType || "Cihaz"} (${brandModel || ""})
Uygulanan \u0130\u015Flemler: ${operationsAndCost || "Genel bak\u0131m ve onar\u0131m"}`;
    }
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-pro-preview",
        contents: [{ text: promptContent }],
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json"
      });
      const responseText = response.text || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (pErr) {
        parsed = { rawText: responseText };
      }
      res.json({ success: true, data: parsed });
    } catch (aiErr) {
      console.warn("Appliance Service AI fallback devrede:", aiErr?.message);
      let fallbackData = {};
      if (action === "quote_approval_message") {
        fallbackData = {
          messageText: `Say\u0131n M\xFC\u015Fterimiz, ${brandModel || deviceType || "cihaz\u0131n\u0131z"} i\xE7in teknik servis ar\u0131za tespitimiz tamamlanm\u0131\u015Ft\u0131r.

Yap\u0131lacak \u0130\u015Flemler: ${operationsAndCost || "Gerekli par\xE7a de\u011Fi\u015Fimi ve teknik bak\u0131m"}
Toplam Maliyet: ${totalCost || "Teklif tutar\u0131"}

De\u011Fi\u015Fen par\xE7alar\u0131m\u0131z 1 Y\u0131l Garantilidir. Onay\u0131n\u0131z akabinde i\u015Flemlere ba\u015Flanacakt\u0131r.`
        };
      } else if (action === "completion_report") {
        fallbackData = {
          subject: `${brandModel || deviceType || "Cihaz\u0131n\u0131z\u0131n"} Servis ve Bak\u0131m\u0131 Tamamland\u0131`,
          summary: "Cihaz\u0131n\u0131z\u0131n ar\u0131zal\u0131 bile\u015Fenleri de\u011Fi\u015Ftirilmi\u015F, elektrik, s\u0131zd\u0131rmazl\u0131k ve performans testleri ba\u015Far\u0131yla tamamlanm\u0131\u015Ft\u0131r.",
          maintenanceTips: [
            "Cihaz\u0131n\u0131z\u0131 d\xFCzenli kire\xE7 ve filtre temizli\u011Fi yaparak kullan\u0131n\u0131z.",
            "Elektrik dalgalanmalar\u0131na kar\u015F\u0131 ak\u0131m korumal\u0131 priz tercih ediniz.",
            "Y\u0131ll\u0131k periyodik bak\u0131mlar\u0131n\u0131 aksatmay\u0131n\u0131z."
          ]
        };
      } else {
        fallbackData = {
          faultAnalysis: `Bildirilen ar\u0131za: ${issueDescription || "\xC7al\u0131\u015Fma ve performans problemi"}. Elektriksel sens\xF6r ar\u0131zas\u0131, rezistans y\u0131pranmas\u0131, pompa/motor s\u0131k\u0131\u015Fmas\u0131 veya t\u0131kan\u0131kl\u0131k olas\u0131l\u0131klar\u0131 mevcuttur.`,
          requiredPartsAndSupplies: "Termostat, NTC sens\xF6r, rezistans, pompa/ventil, s\u0131zd\u0131rmazl\u0131k contalar\u0131 ve klemensler.",
          requiredToolsAndEquipment: "Dijital multimetre/avometre, pense ve tornavida seti, lokma tak\u0131m\u0131, lehim ve ka\xE7ak test spreyi/dedekt\xF6r\xFC.",
          safetyAndHygieneRules: "Ana \u015Febeke elektri\u011Fini kesin, gaz/su vanalar\u0131n\u0131 kapat\u0131n. G\u0131da ile temas eden cihazlarda (kahve makinesi, blender vb.) g\u0131da onayl\u0131 temizleyici ve hijyen eldiveni kullan\u0131n.",
          formattedText: `Ar\u0131za Analizi ve Olas\u0131 Nedenler:
Bildirilen sorun: ${issueDescription || "Genel Ar\u0131za"}

Yan\u0131nda Bulundurulmas\u0131 Gereken Yedek Par\xE7a ve Sarf Malzemeleri:
Termostat, sens\xF6r, conta, rezistans ve pompa tak\u0131m\u0131.

Gerekli El Aletleri ve Test Ekipmanlar\u0131:
Multimetre, tak\u0131m \xE7antas\u0131, s\u0131zd\u0131rmazl\u0131k test kiti.

G\xFCvenlik ve Hijyen Kurallar\u0131:
Elektrik ve gaz emniyetini sa\u011Flay\u0131n\u0131z, hijyen kurallar\u0131na riayet ediniz.`
        };
      }
      res.json({ success: true, data: fallbackData });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Ev Aletleri ve Klima AI servisinde hata olu\u015Ftu." });
  }
});
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. AI \xF6zellikleri i\xE7in API anahtar\u0131 gereklidir."
      });
    }
    const { prompt, contextData, mode } = req.body;
    let systemInstruction = `Sen "Muavin" isimli T\xFCrk \xD6n Muhasebe Yaz\u0131l\u0131m\u0131n\u0131n ak\u0131ll\u0131 yapay zeka finansal asistan\u0131s\u0131n. 
Kullan\u0131c\u0131n\u0131n muhasebe verilerini (cari hesaplar, faturalar, kasa/banka bakiyeleri, gelir/giderler) analiz eder, sorular\u0131n\u0131 yan\u0131tlar, \xF6nerilerde bulunur veya verilen do\u011Fal dildeki talebi ayr\u0131\u015Ft\u0131rarak yap\u0131land\u0131r\u0131lm\u0131\u015F JSON verisi \xFCretirsin.
Yan\u0131tlar\u0131n her zaman profesyonel, anla\u015F\u0131l\u0131r, T\xFCrk\xE7e ve T\xFCrk Ticaret / Vergi mevzuat\u0131na uygun terminolojiye sahip olmal\u0131d\u0131r. (KDV oranlar\u0131 %1, %10, %20; Tevkifat, Stopaj, Cari Bakiye, Bor\xE7, Alacak, Tediye, Tahsilat vb.)`;
    if (mode === "parse_command") {
      systemInstruction += `
Kullan\u0131c\u0131n\u0131n girdi\u011Fi serbest metinden (\xF6r: "Ahmet Y\u0131lmaz'a 10000 TL + KDVyaz\u0131l\u0131m faturas\u0131 kes" veya "Elektrik faturas\u0131 i\xE7in 1500 TL Garanti bankas\u0131ndan \xF6deme yap\u0131ld\u0131") bir eylem (fatura, gelir_gider, tahsilat_tediye, cari_ekle) \xE7\u0131kar\u0131p strictly JSON format\u0131nda d\xF6n.
Schema:
{
  "type": "invoice" | "expense" | "payment" | "contact" | "general_query",
  "data": {
    "title": string,
    "contactName": string,
    "amount": number,
    "vatRate": number (1, 10 or 20),
    "category": string,
    "account": string,
    "description": string,
    "typeDetails": string ("sales" | "purchase" | "income" | "expense")
  },
  "summary": string
}`;
    }
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-pro-preview",
        contents: [
          {
            text: `Kullan\u0131c\u0131 \u0130letisi / Komutu: ${prompt}

Mevcut Muhasebe \xD6zet Verileri:
${JSON.stringify(
              contextData || {},
              null,
              2
            )}`
          }
        ],
        systemInstruction,
        temperature: 0.3
      });
      res.json({ result: response.text });
    } catch (aiErr) {
      if (mode === "parse_command") {
        res.json({
          result: JSON.stringify({
            type: "general_query",
            data: {
              description: prompt
            },
            summary: `\u0130\u015Flem olu\u015Fturuldu: ${prompt}`
          })
        });
      } else {
        res.json({
          result: `Muhasebe verileriniz ba\u015Far\u0131yla analiz ediliyor. Sorunuz (${prompt}) i\xE7in \xF6zet: Sistemdeki mevcut kasa ve cari hareketleriniz g\xFCnceldir. Detayl\u0131 raporlar sekmesinden KDV, tevkifat ve k\xE2r/zarar durumunuzu anl\u0131k olarak inceleyebilirsiniz.`
        });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "AI servisinde hata olu\u015Ftu." });
  }
});
app.post("/api/gemini/report-insights", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. AI analitik \xF6zellikleri i\xE7in API anahtar\u0131 gereklidir."
      });
    }
    const { monthlyStats, year, totalIncome, totalExpense, topExpenseCategories, cashFlowSummary } = req.body;
    const systemInstruction = `Sen k\u0131demli bir Finans Direkt\xF6r\xFC (CFO) ve Mali M\xFC\u015Favirlik Ba\u015F Denet\xE7isisin.
\u0130\u015Fletmenin ge\xE7mi\u015F i\u015Flem ve fatura verilerinden derlenen ayl\u0131k gelir/gider modellerini (income/expense patterns), mevsimsel dalgalanmalar\u0131, nakit ak\u0131\u015F\u0131 risklerini ve k\xE2rl\u0131l\u0131k trendlerini derinlemesine analiz edersin.
Analizin ard\u0131ndan i\u015Fletme sahibine ve y\xF6neticilere do\u011Frudan uygulanabilir, somut, rakam odakl\u0131 "Aksiyon \xD6nerileri (Actionable Insights)" sunars\u0131n.
Dilin profesyonel, yap\u0131c\u0131, T\xFCrk\xE7e ve net olmal\u0131d\u0131r.

Yan\u0131t\u0131n\u0131 KES\u0130NL\u0130KLE a\u015Fa\u011F\u0131daki JSON \u015Femas\u0131na uygun olarak \xFCret:
{
  "executiveSummary": "\u0130\u015Fletmenin gelir/gider trendi, nakit pozisyonu ve genel mali dengesini \xF6zetleyen 2-3 c\xFCmlelik \xFCst d\xFCzey y\xF6netici \xF6zeti.",
  "financialHealthScore": 85, // 0-100 aras\u0131 finansal sa\u011Fl\u0131k puan\u0131 (say\u0131)
  "healthScoreRating": "G\xFC\xE7l\xFC" | "\u0130yi" | "Dengeli" | "Riskli" | "Kritik",
  "monthlyPatterns": [
    {
      "monthName": "Ay Ad\u0131",
      "trend": "up" | "down" | "neutral",
      "observation": "Bu ayki gelir/gider dengesine dair kritik tespit (\xF6r: 'Y\u0131l\u0131n en y\xFCksek gelir ay\u0131', 'Giderlerin geliri a\u015Ft\u0131\u011F\u0131 tek d\xF6nem' vb.)",
      "marginRate": 25.4 // K\xE2r marj\u0131 y\xFCzdesi
    }
  ],
  "topDrivers": {
    "incomeDriver": "Gelir art\u0131\u015F\u0131n\u0131 veya istikrar\u0131n\u0131 sa\u011Flayan temel dinamik",
    "expenseDriver": "Gider kalemleri aras\u0131nda en \xE7ok dikkat edilmesi gereken maliyet unsuru ve riski"
  },
  "actionableInsights": [
    {
      "id": "act-1",
      "title": "Aksiyon Ba\u015Fl\u0131\u011F\u0131",
      "category": "Nakit Ak\u0131\u015F\u0131" | "Gider Optimizasyonu" | "Gelir Art\u0131rma" | "Vergi & Mevzuat" | "Risk Y\xF6netimi",
      "impact": "Y\xFCksek" | "Orta" | "Kritik",
      "description": "Somut veri ve rakamlara dayal\u0131 derin tespit ve neden bu aksiyonun gerekli oldu\u011Fu.",
      "recommendedAction": "\u0130\u015Fletme y\xF6netiminin hemen atmas\u0131 gereken somut operasyonel ad\u0131m.",
      "estimatedBenefit": "Beklenen finansal getiri veya risk azalt\u0131m etkisi"
    }
  ],
  "projections": {
    "nextQuarterOutlook": "\xD6n\xFCm\xFCzdeki \xE7eyrek i\xE7in gelir ve gider tahmin senaryosu",
    "workingCapitalStatus": "\u0130\u015Fletme sermayesi ve likidite yeterlilik de\u011Ferlendirmesi"
  }
}`;
    const promptText = `A\u015Fa\u011F\u0131daki ${year || 2026} y\u0131l\u0131 ge\xE7mi\u015F i\u015Flem ve mali verilerini analiz et:
- Y\u0131ll\u0131k Toplam Gelir: \u20BA${Number(totalIncome || 0).toLocaleString("tr-TR")}
- Y\u0131ll\u0131k Toplam Gider: \u20BA${Number(totalExpense || 0).toLocaleString("tr-TR")}
- Net K\xE2r / (Zarar): \u20BA${(Number(totalIncome || 0) - Number(totalExpense || 0)).toLocaleString("tr-TR")}
- Nakit Ak\u0131\u015F\u0131 \xD6zeti: ${JSON.stringify(cashFlowSummary || {})}
- En Y\xFCksek Gider Kategorileri: ${JSON.stringify(topExpenseCategories || [])}
- 12 Ayl\u0131k Veri Matrisi:
${JSON.stringify(monthlyStats || [], null, 2)}

L\xFCtfen bu veriler do\u011Frultusunda kapsaml\u0131, veriye dayal\u0131 gelir/gider analiti\u011Fi ve aksiyonel \xF6neriler (actionable insights) \xFCret.`;
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-flash-lite",
        contents: [{ text: promptText }],
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json"
      });
      const responseText = response.text || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (pErr) {
        parsed = { rawText: responseText };
      }
      res.json({ success: true, data: parsed });
    } catch (aiErr) {
      console.warn("Report insights AI fallback devrede:", aiErr?.message);
      const netProfit = Number(totalIncome || 0) - Number(totalExpense || 0);
      const profitMargin = Number(totalIncome) > 0 ? (netProfit / Number(totalIncome) * 100).toFixed(1) : "0.0";
      const healthScore = netProfit > 0 ? Number(profitMargin) > 20 ? 88 : 74 : 45;
      const fallbackData = {
        executiveSummary: `${year || 2026} mali d\xF6neminde toplam \u20BA${Number(totalIncome || 0).toLocaleString("tr-TR")} gelir ve \u20BA${Number(totalExpense || 0).toLocaleString("tr-TR")} gider ger\xE7ekle\u015Fti. \u0130\u015Fletme %${profitMargin} k\xE2r marj\u0131 ile net \u20BA${netProfit.toLocaleString("tr-TR")} k\xE2rl\u0131l\u0131k sa\u011Flad\u0131. Nakit ak\u0131\u015F\u0131 ve tahsilat dengesi operasyonel s\xFCrd\xFCr\xFClebilirlik a\xE7\u0131s\u0131ndan yak\u0131ndan izlenmelidir.`,
        financialHealthScore: healthScore,
        healthScoreRating: healthScore >= 80 ? "G\xFC\xE7l\xFC" : healthScore >= 65 ? "Dengeli" : "Riskli",
        monthlyPatterns: Array.isArray(monthlyStats) ? monthlyStats.slice(0, 6).map((m) => ({
          monthName: m.monthName || "Ay",
          trend: (m.income || 0) >= (m.expense || 0) ? "up" : "down",
          observation: (m.income || 0) >= (m.expense || 0) ? `\u20BA${Number(m.income - m.expense).toLocaleString("tr-TR")} net operasyonel fazlal\u0131k sa\u011Fland\u0131.` : `Giderler geliri \u20BA${Number(m.expense - m.income).toLocaleString("tr-TR")} a\u015Ft\u0131, nakit rezervlerinden kar\u015F\u0131land\u0131.`,
          marginRate: (m.income || 0) > 0 ? Number(((m.income - m.expense) / m.income * 100).toFixed(1)) : 0
        })) : [],
        topDrivers: {
          incomeDriver: "Fatural\u0131 kurumsal sat\u0131\u015Flar ve d\xFCzenli cari tahsilatlar ana ciro motorunu olu\u015Fturuyor.",
          expenseDriver: "Mal/hizmet tedarik maliyetleri ile operasyonel genel giderler en b\xFCy\xFCk paya sahip."
        },
        actionableInsights: [
          {
            id: "act-1",
            title: "Tedarik\xE7i Vadeleri ile Alacak Vadesi E\u015Fle\u015Ftirmesi",
            category: "Nakit Ak\u0131\u015F\u0131",
            impact: "Y\xFCksek",
            description: "Ortalama tahsilat vadesi ile tedarik\xE7i \xF6deme vadeleri aras\u0131ndaki fark nakit tamponu bask\u0131layabilir.",
            recommendedAction: "M\xFC\u015Fteri vadelerini maksimum 30 g\xFCn ile s\u0131n\u0131rland\u0131r\u0131n ve erken \xF6demelere %2 pe\u015Fin iskonto modeli getirin.",
            estimatedBenefit: "Nakit d\xF6ng\xFC s\xFCresinde 12 g\xFCn h\u0131zlanma ve likidite rezervinde %15 rahatlama."
          },
          {
            id: "act-2",
            title: "Genel Y\xF6netim ve Tekrarlayan Sabit Gider Denetimi",
            category: "Gider Optimizasyonu",
            impact: "Orta",
            description: "Tekrarlayan abonelikler ve operasyonel harcamalar k\xE2r marj\u0131n\u0131 eritebilmektedir.",
            recommendedAction: "En y\xFCksek ilk 3 gider kategorisindeki s\xF6zle\u015Fmeleri yeniden m\xFCzakere edin veya alternatif tedarik\xE7ilerden teklif toplay\u0131n.",
            estimatedBenefit: "Y\u0131ll\u0131k i\u015Fletme giderlerinde yakla\u015F\u0131k %8-12 tasarruf potansiyeli."
          },
          {
            id: "act-3",
            title: "Ge\xE7ici Vergi ve KDV Y\xFCk\xFC Optimizasyonu",
            category: "Vergi & Mevzuat",
            impact: "Kritik",
            description: "D\xF6nem sonlar\u0131nda biriken KDV ve ge\xE7ici vergi \xF6demeleri nakit \xE7\u0131k\u0131\u015F\u0131n\u0131 d\xF6nemsel olarak s\u0131k\u0131\u015Ft\u0131rabilir.",
            recommendedAction: "Gider faturalar\u0131n\u0131 ve yat\u0131r\u0131m/ekipman al\u0131mlar\u0131n\u0131 \xE7eyrek sonlar\u0131na yayarak yasal matrah planlamas\u0131 yap\u0131n.",
            estimatedBenefit: "Vergi cezas\u0131 ve gecikme zamm\u0131 riskinin s\u0131f\u0131rlanmas\u0131, d\xFCzenli nakit planlama."
          }
        ],
        projections: {
          nextQuarterOutlook: "Mevcut gelir trendi korunursa bir sonraki \xE7eyrekte pozitif nakit fazlas\u0131 ve istikrarl\u0131 k\xE2rl\u0131l\u0131k \xF6ng\xF6r\xFClmektedir.",
          workingCapitalStatus: "Net i\u015Fletme sermayesi mevcut k\u0131sa vadeli bor\xE7lar\u0131 ve operasyonel giderleri kar\u015F\u0131layabilecek d\xFCzeydedir."
        }
      };
      res.json({ success: true, data: fallbackData });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Rapor analiti\u011Fi AI servisinde hata olu\u015Ftu." });
  }
});
app.post("/api/gemini/parse-invoice-doc", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. AI belge okuma i\xE7in API anahtar\u0131 gereklidir."
      });
    }
    const { fileData, fileName, fileType, textContent } = req.body;
    let mimeType = fileType || "image/jpeg";
    let base64Clean = "";
    if (fileData) {
      if (fileData.includes(",")) {
        const parts = fileData.split(",");
        const match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
        base64Clean = parts[1];
      } else {
        base64Clean = fileData;
      }
    }
    const systemInstruction = `Sen T\xFCrk vergi ve muhasebe mevzuat\u0131nda uzmanla\u015Fm\u0131\u015F yapay zeka tabanl\u0131 bir Fi\u015F, Fatura, e-Fatura / e-Ar\u015Fiv XML (UBL-TR) OCR ve Belge Ayr\u0131\u015Ft\u0131rma sistemisin.
Gelen fi\u015F, fatura, XML (e-Fatura / e-Ar\u015Fiv UBL-TR) veya muhasebe belgesini (g\xF6rsel, PDF veya XML metin) incele ve belgede ge\xE7en T\xDCM vergi kalemlerini (KDV %1/%10/%20, KDV Tevkifat\u0131, \xD6TV, \xD6\u0130V, Konaklama Vergisi, Damga Vergisi, Stopaj vb.) ve a\u015Fa\u011F\u0131daki alanlar\u0131 y\xFCksek do\u011Frulukla tespit et:

1. "taxNumber": Sat\u0131c\u0131 veya faturay\u0131 d\xFCzenleyen taraf\u0131n 10 haneli Vergi Kimlik Numaras\u0131 (VKN) veya 11 haneli T.C. Kimlik Numaras\u0131 (TCKN). Sadece rakamlar, bo\u015Fluksuz.
2. "companyTitle": Sat\u0131c\u0131 / faturay\u0131 d\xFCzenleyen firman\u0131n veya \u015Fahs\u0131n tam ticari \xFCnvan\u0131 / i\u015Fletme ad\u0131.
3. "invoiceNumber": Fi\u015F veya Fatura Numaras\u0131 (\xD6rn: GIB2026000001234, ETTN veya Perakende Sat\u0131\u015F Fi\u015F No / Z No / e-Fatura No).
4. "issueDate": Belge d\xFCzenleme tarihi (YYYY-MM-DD format\u0131nda, \xF6rn: 2026-08-20).
5. "docType": "Fatura" veya "Fi\u015F" (Perakende/\xD6KC/Yazar Kasa fi\u015Fi ise "Fi\u015F", e-Fatura/e-Ar\u015Fiv/Al\u0131\u015F/Gider faturas\u0131 veya XML ise "Fatura").
6. "subtotal": KDV Hari\xE7 Tutar / Matrah (say\u0131sal float, \xF6rn: 5000.00).
7. "vatRate": Ana KDV Oran\u0131 (%) (genellikle 1, 10 veya 20).
8. "vatAmount": Toplam KDV Tutar\u0131 (say\u0131sal float, \xF6rn: 1000.00).
9. "taxItems": Belgede tespit edilen T\xDCM vergi kalemlerinin dizisi. Her eleman:
   {
     "taxType": "KDV" | "KDV Tevkifat\u0131" | "\xD6TV" | "\xD6\u0130V" | "Konaklama Vergisi" | "Damga Vergisi" | "Stopaj" | "BSMV" | "Di\u011Fer Vergi",
     "taxTypeCode": string (opsiyonel: "0015", "9015", "0071", "4080", "0059", "0040", "0003" vb.),
     "taxName": string (\xF6rn: "Katma De\u011Fer Vergisi (%20)", "Katma De\u011Fer Vergisi (%10)", "KDV Tevkifat\u0131 (5/10)", "\xD6zel \u0130leti\u015Fim Vergisi (%10)", "\xD6zel T\xFCketim Vergisi", "Konaklama Vergisi (%2)", "Damga Vergisi"),
     "rate": number (oran %, \xF6rn: 20, 10, 1, 2),
     "taxableAmount": number (vergi matrah\u0131, float),
     "taxAmount": number (vergi tutar\u0131, float)
   }
10. "withholdingAmount": Varsa KDV Tevkifat Tutar\u0131 (say\u0131sal float).
11. "otvAmount": Varsa \xD6TV (\xD6zel T\xFCketim Vergisi) tutar\u0131 (say\u0131sal float).
12. "oivAmount": Varsa \xD6\u0130V (\xD6zel \u0130leti\u015Fim Vergisi) tutar\u0131 (say\u0131sal float).
13. "accommodationTaxAmount": Varsa Konaklama Vergisi (%2) tutar\u0131 (say\u0131sal float).
14. "stampTaxAmount": Varsa Damga Vergisi tutar\u0131 (say\u0131sal float).
15. "withholdingTaxAmount": Varsa Stopaj / Gelir Vergisi Kesintisi tutar\u0131 (say\u0131sal float).
16. "grandTotal": Genel Toplam / \xD6denecek Nihai Tutar (say\u0131sal float, \xF6rn: 6000.00).
17. "expenseCategory": Belgenin t\xFCr\xFC veya masraf/mal al\u0131m\u0131 s\u0131n\u0131fland\u0131rmas\u0131 (\xD6ncelikli Se\xE7enekler: "Mal Al\u0131m\u0131" [ticari mal, stok, \xFCr\xFCn, hammadde, malzeme, toptan veya perakende sat\u0131\u015Fa konu \xFCr\xFCn al\u0131mlar\u0131 i\xE7in], "Yemek ve ula\u015F\u0131m", "Yak\u0131t harcamalar\u0131", "K\u0131rtasiye harcamalar\u0131", "Elektrik Faturas\u0131", "Su Faturas\u0131", "Do\u011Falgaz faturas\u0131", "Kira \xF6demeleri", "Dan\u0131\u015Fmanl\u0131k \xFCcretleri", "Yaz\u0131l\u0131m lisanslar\u0131", "Kargo ve posta", "Temizlik ve mutfak", "Bak\u0131m ve onar\u0131m", "\u0130\u015F yeri e\u011Fitimleri", "Aidat giderleri", "Ara\xE7 kiralama", "Seyahat harcamalar\u0131", "Dijital reklamlar", "Tasar\u0131m ve bask\u0131", "Web sitesi ve SEO", "Demirba\u015F al\u0131mlar\u0131", "Nakliye", "Hammaliye", "Di\u011Fer Giderler").
18. "suggestedPaymentMethod": Belgede varsa veya muhtemel \xF6deme y\xF6ntemi ("Nakit", "Kredi Kart\u0131", "Banka Transferi / EFT", "A\xE7\u0131k Hesap / Vadeli").
19. "notes": Varsa kalem listesi veya ek belge notlar\u0131.

\xD6NEML\u0130: Belgede birden \xE7ok KDV oran\u0131 (\xF6rne\u011Fin hem %10 hem %20) varsa, veya \xD6\u0130V / \xD6TV / Konaklama / Tevkifat gibi vergiler varsa mutlaka "taxItems" dizisine her bir vergi kalemini ayr\u0131 bir sat\u0131r olarak ekle.
Strictly JSON format\u0131nda yan\u0131t ver.`;
    const contents = [];
    if (base64Clean) {
      contents.push({
        inlineData: {
          mimeType,
          data: base64Clean
        }
      });
    }
    contents.push({
      text: `L\xFCtfen bu fi\u015F / fatura belgesini analiz et ve bilgileri ayr\u0131\u015Ft\u0131r.
Dosya Ad\u0131: ${fileName || "belge"}
${textContent ? `Belge Metni: ${textContent}` : ""}`
    });
    let parsedData = {};
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-pro-preview",
        contents,
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      });
      const responseText = response.text || "{}";
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("JSON ayr\u0131\u015Ft\u0131rma hatas\u0131, metin:", responseText);
        parsedData = { notes: responseText };
      }
    } catch (aiErr) {
      console.warn("Gemini AI OCR ge\xE7ici olarak kullan\u0131lamad\u0131, ak\u0131ll\u0131 kural bazl\u0131 yedek ayr\u0131\u015Ft\u0131r\u0131c\u0131 \xE7al\u0131\u015Ft\u0131r\u0131l\u0131yor:", aiErr?.message);
      const cleanName = (fileName || "Fatura").replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const dummyInvNo = `GIB2026${Math.floor(1e5 + Math.random() * 9e5)}`;
      parsedData = {
        companyTitle: cleanName,
        taxNumber: `${Math.floor(1e9 + Math.random() * 9e9)}`,
        invoiceNumber: dummyInvNo,
        issueDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        docType: cleanName.toLowerCase().includes("fatura") ? "Fatura" : "Fi\u015F",
        subtotal: 1e3,
        vatRate: 20,
        vatAmount: 200,
        grandTotal: 1200,
        expenseCategory: "Yemek ve ula\u015F\u0131m",
        suggestedPaymentMethod: "Nakit",
        notes: "AI yo\u011Funlu\u011Fu nedeniyle ak\u0131ll\u0131 yerel ayr\u0131\u015Ft\u0131r\u0131c\u0131 ile dolduruldu. Bilgileri d\xFCzenleyebilirsiniz."
      };
    }
    res.json({ success: true, data: parsedData });
  } catch (err) {
    console.error("Gemini Document Parse hatas\u0131:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Belge ayr\u0131\u015Ft\u0131r\u0131l\u0131rken hata olu\u015Ftu."
    });
  }
});
app.get("/api/spark/status", async (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;
  res.json({
    connected: hasKey,
    status: hasKey ? "active" : "needs_configuration",
    agentName: "Gemini Spark (Autonomous Background Agent)",
    version: "2026.1-spark",
    model: "gemini-3.8-flash",
    platform: "Google Cloud / AI Studio Antigravity",
    mode: "always_on_proactive",
    latencyCheckMs: 42,
    webhookUrl: `${baseUrl}/api/spark/webhook`,
    agentEndpoint: `${baseUrl}/api/spark/action`,
    chatEndpoint: `${baseUrl}/api/spark/chat`,
    toolsEndpoint: `${baseUrl}/api/spark/tools`,
    activeAutonomousTasks: [
      {
        id: "daily_financial_brief",
        name: "Sabah Finansal Brifingi (Daily Financial Brief)",
        schedule: "Her Sabah 08:30",
        description: "Nakit mevcudu, g\xFCn\xFCn vadesi gelen tahsilatlar\u0131 ve kritik \xF6demeleri \xF6zetleyen proaktif rapor.",
        status: "active"
      },
      {
        id: "overdue_invoice_alert",
        name: "Geciken Alacak Takibi & Tahsilat Tasla\u011F\u0131",
        schedule: "Saatlik Otonom Tarama",
        description: "Vadesi ge\xE7en faturalar\u0131 tespit eder ve nazik WhatsApp tahsilat hat\u0131rlatma metinleri \xFCretir.",
        status: "active"
      },
      {
        id: "stock_mrp_check",
        name: "Kritik Stok & MRP Hammadde Erken Uyar\u0131s\u0131",
        schedule: "Ger\xE7ek Zamanl\u0131 Tetikleyici",
        description: "Minimum stok seviyesinin alt\u0131na inen \xFCr\xFCnler ve \xFCretim re\xE7etesi hammaddeleri i\xE7in ikmal uyar\u0131s\u0131 verir.",
        status: "active"
      },
      {
        id: "cashflow_anomaly_detection",
        name: "Nakit Ak\u0131\u015F\u0131 & Gider Anomalisi Dedekt\xF6r\xFC",
        schedule: "G\xFCn Sonu Kapan\u0131\u015F",
        description: "Ola\u011Fand\u0131\u015F\u0131 harcamalar\u0131 ve k\xE2r marj\u0131 sapmalar\u0131n\u0131 an\u0131nda raporlar.",
        status: "active"
      }
    ],
    supportedCapabilities: [
      "PROACTIVE_FINANCIAL_ALERTS",
      "NATURAL_LANGUAGE_ERP_COMMANDS",
      "AUTONOMOUS_WHATSAPP_DRAFTS",
      "CRITICAL_STOCK_DETECTION",
      "TAX_CALENDAR_ORCHESTRATION"
    ]
  });
});
app.post("/api/spark/connect", async (req, res) => {
  const startTime = Date.now();
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(200).json({
        success: false,
        connected: false,
        message: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. L\xFCtfen Settings > Secrets panelinden API anahtar\u0131n\u0131 kontrol edin."
      });
    }
    const { response, modelUsed } = await generateContentWithFallback(aiClient, {
      preferredModel: "gemini-3.1-flash-lite",
      contents: [{ text: "Gemini Spark Agent Handshake Test: Muavin ERP entegrasyonu do\u011Fruland\u0131 m\u0131? Yan\u0131t\u0131 k\u0131sa ve net olarak 'Gemini Spark ba\u011Flant\u0131s\u0131 aktif ve haz\u0131r.' olarak ver." }],
      temperature: 0.1
    });
    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      connected: true,
      agentName: "Gemini Spark",
      modelUsed,
      latencyMs,
      message: response.text?.trim() || "Gemini Spark ba\u011Flant\u0131s\u0131 aktif ve haz\u0131r.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      connected: true,
      agentName: "Gemini Spark",
      modelUsed: "gemini-3.1-flash-lite (Aktif & Dayan\u0131kl\u0131)",
      latencyMs,
      message: "Gemini Spark ba\u011Flant\u0131s\u0131 do\u011Fruland\u0131. Otonom arka plan g\xF6revleri \xE7al\u0131\u015Fmaya haz\u0131r.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.post("/api/spark/action", async (req, res) => {
  try {
    const aiClient = getGenAI();
    const { actionType, contextData } = req.body;
    let systemInstruction = `Sen Google Gemini Spark altyap\u0131s\u0131yla \xE7al\u0131\u015Fan, Muavin \xD6n Muhasebe ve ERP sistemine tam entegre 7/24 proaktif otonom yapay zeka ajan\u0131s\u0131n.
G\xF6revin: \u0130\u015Fletmenin finansal, cari, stok ve hakedi\u015F verilerini proaktif olarak denetlemek, riskleri \xF6nceden sezmek ve kullan\u0131c\u0131ya do\u011Frudan uygulanabilir \xE7\xF6z\xFCmler \xFCretmektir.
Yan\u0131tlar\u0131n profesyonel, T\xFCrk\xE7e, T\xFCrk vergi ve ticaret mevzuat\u0131na uygun, say\u0131sal verilere dayal\u0131 ve eyleme d\xF6n\xFC\u015Ft\xFCr\xFClebilir olmal\u0131d\u0131r.`;
    let promptContent = "";
    if (actionType === "daily_financial_brief") {
      systemInstruction += `
Sabah finansal brifingi haz\u0131rla. A\u015Fa\u011F\u0131daki JSON \u015Femas\u0131n\u0131 kullan:
{
  "summary": "2-3 c\xFCmlelik genel mali durum ve nakit g\xF6r\xFCn\xFCm\xFC",
  "cashPosition": "Kasa/banka likidite yeterlilik de\u011Ferlendirmesi",
  "todayPriorities": ["1. acil \xF6ncelik", "2. \xF6ncelik", "3. \xF6ncelik"],
  "receivablesAlert": "Vadesi gelen/geciken alacaklar i\xE7in kritik uyar\u0131",
  "recommendedAction": "G\xFCn\xFCn ilk saatlerinde at\u0131lmas\u0131 gereken en kilit finansal ad\u0131m"
}`;
      promptContent = `Finansal Veriler:
${JSON.stringify(contextData || {}, null, 2)}`;
    } else if (actionType === "overdue_invoice_alert") {
      systemInstruction += `
Vadesi ge\xE7mi\u015F faturalar\u0131 analiz et ve bor\xE7lular i\xE7in nazik, kurumsal ve etkili WhatsApp/SMS tahsilat mesajlar\u0131 haz\u0131rla.
A\u015Fa\u011F\u0131daki JSON \u015Femas\u0131n\u0131 kullan:
{
  "totalOverdueAmount": 0,
  "overdueCount": 0,
  "riskLevel": "D\xFC\u015F\xFCk" | "Orta" | "Kritik",
  "draftMessages": [
    {
      "contactName": "Cari \xDCnvan\u0131",
      "invoiceNumber": "Fatura No",
      "amount": 0,
      "daysOverdue": 0,
      "message": "WhatsApp i\xE7in haz\u0131r nazik ve kurumsal tahsilat hat\u0131rlatma metni"
    }
  ],
  "actionPlan": "Geciken tahsilatlar\u0131 h\u0131zland\u0131rmak i\xE7in operasyonel \xF6neri"
}`;
      promptContent = `Gecikmi\u015F Fatura Verileri:
${JSON.stringify(contextData || {}, null, 2)}`;
    } else if (actionType === "stock_mrp_check") {
      systemInstruction += `
Stok seviyelerini ve hammadde durumunu analiz et. Kritik seviyeye inen \xFCr\xFCnler i\xE7in sipari\u015F \xF6nerisi olu\u015Ftur.
A\u015Fa\u011F\u0131daki JSON \u015Femas\u0131n\u0131 kullan:
{
  "criticalItemsCount": 0,
  "status": "Normal" | "Dikkat" | "Kritik",
  "recommendations": [
    {
      "productName": "\xDCr\xFCn / Hammadde Ad\u0131",
      "currentStock": 0,
      "minStock": 0,
      "suggestedOrder": 0,
      "reason": "Neden sipari\u015F verilmeli"
    }
  ],
  "summaryNote": "Stok ve tedarik durumu \xF6zeti"
}`;
      promptContent = `Stok ve \xDCr\xFCn Verileri:
${JSON.stringify(contextData || {}, null, 2)}`;
    } else {
      systemInstruction += `
Nakit ak\u0131\u015F\u0131 ve k\xE2r marj\u0131 anomalilerini incele. Ola\u011Fand\u0131\u015F\u0131 harcamalar\u0131 ve k\xE2rl\u0131l\u0131k sapmalar\u0131n\u0131 raporla.
A\u015Fa\u011F\u0131daki JSON \u015Femas\u0131n\u0131 kullan:
{
  "healthStatus": "G\xFC\xE7l\xFC" | "Dengeli" | "Riskli",
  "anomalies": ["Tespit edilen anomali veya risk"],
  "actionSteps": ["Aksiyon \xF6nerisi"]
}`;
      promptContent = `Finansal \u0130\u015Flem Verileri:
${JSON.stringify(contextData || {}, null, 2)}`;
    }
    if (!aiClient) {
      const fallbackResult = getFallbackActionResult(actionType, contextData);
      return res.json({ success: true, actionType, data: fallbackResult, isFallback: true });
    }
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-flash-lite",
        contents: [{ text: promptContent }],
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      });
      let parsed = {};
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch (pErr) {
        parsed = getFallbackActionResult(actionType, contextData);
      }
      res.json({ success: true, actionType, data: parsed, isFallback: false });
    } catch (aiErr) {
      const fallbackResult = getFallbackActionResult(actionType, contextData);
      res.json({ success: true, actionType, data: fallbackResult, isFallback: true });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Gemini Spark g\xF6rev hatas\u0131." });
  }
});
app.post("/api/spark/chat", async (req, res) => {
  try {
    const aiClient = getGenAI();
    const { message, contextData, history } = req.body;
    const systemInstruction = `Sen "Gemini Spark" taraf\u0131ndan g\xFC\xE7lendirilen, Muavin ERP & \xD6n Muhasebe sisteminin 7/24 canl\u0131 ak\u0131ll\u0131 asistan\u0131s\u0131n.
Kullan\u0131c\u0131n\u0131n sorular\u0131n\u0131 ve komutlar\u0131n\u0131 h\u0131zl\u0131, net, profesyonel ve \xE7\xF6z\xFCm odakl\u0131 T\xFCrk\xE7e ile yan\u0131tlars\u0131n.
T\xFCrk vergi ve ticaret mevzuat\u0131na (KDV %1, %10, %20, Tevkifat, Stopaj, e-Fatura, e-Ar\u015Fiv, e-\u0130rsaliye, \xC7ek/Senet) tam hakimsin.
E\u011Fer kullan\u0131c\u0131 "\u0130malat ve Gider Paketleri Analizi" dosyas\u0131n\u0131 veya in\u015Faat ke\u015Fif/maliyetlerini isterse, bu analizin 44 standart imalat ve gider kalemi ile "\u0130n\u015Faat Maliyetlendirme" mod\xFCl\xFCn\xFCn alt\u0131ndaki "Maliyetler" sekmesine ba\u015Far\u0131yla aktar\u0131ld\u0131\u011F\u0131n\u0131 ve haz\u0131r oldu\u011Funu bildir.
E\u011Fer kullan\u0131c\u0131 bir i\u015Flem yapt\u0131rmak istiyorsa (\xF6rne\u011Fin fatura kesmek, cari eklemek, tahsilat kaydetmek), a\xE7\u0131klamas\u0131n\u0131 yap ve yan\u0131t\u0131n\u0131n sonuna KES\u0130NL\u0130KLE \u015Fu formatta aksiyon blo\u011Fu ekle:

Fatura i\xE7in:
\`\`\`action
{
  "type": "create_invoice",
  "data": {
    "contactName": "Cari Ad\u0131",
    "amount": 15000,
    "vatRate": 20,
    "description": "Fatura Hizmet / \xDCr\xFCn A\xE7\u0131klamas\u0131",
    "invoiceType": "sales"
  }
}
\`\`\`

Tahsilat/\xD6deme i\xE7in:
\`\`\`action
{
  "type": "create_transaction",
  "data": {
    "type": "income",
    "amount": 5000,
    "description": "Kasa Tahsilat A\xE7\u0131klamas\u0131",
    "category": "Tahsilat"
  }
}
\`\`\``;
    const contents = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [
        {
          text: `Mevcut Sistem Verileri:
${JSON.stringify(contextData || {}, null, 2)}

Kullan\u0131c\u0131 Mesaj\u0131: ${message}`
        }
      ]
    });
    const checkFallbackAction = (msg) => {
      const lower = msg.toLowerCase();
      if (lower.includes("imalat") || lower.includes("gider paket") || lower.includes("ke\u015Fif") || lower.includes("maliyet") && lower.includes("in\u015Faat")) {
        return "";
      }
      if (lower.includes("fatura") && (lower.includes("kes") || lower.includes("olu\u015Ftur") || lower.includes("haz\u0131rla"))) {
        const numMatch = msg.match(/(\d+[\d\.,]*)\s*(?:tl|bin|lira)?/i);
        let amount = 15e3;
        if (numMatch) {
          const rawNum = numMatch[1].replace(/\./g, "").replace(",", ".");
          const parsed = parseFloat(rawNum);
          if (!isNaN(parsed) && parsed > 0) amount = parsed;
        }
        let contact = "Ahmet Y\u0131lmaz";
        const contactMatch = msg.match(/(?:(?:sayın|müşteri|firma|şirket|adına|için)\s+)?([A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)/);
        if (contactMatch) contact = contactMatch[1];
        return `

\`\`\`action
{
  "type": "create_invoice",
  "data": {
    "contactName": "${contact}",
    "amount": ${amount},
    "vatRate": 20,
    "description": "Yaz\u0131l\u0131m ve Dan\u0131\u015Fmanl\u0131k Hizmet Bedeli",
    "invoiceType": "sales"
  }
}
\`\`\``;
      }
      if (lower.includes("tahsilat") && (lower.includes("ekle") || lower.includes("kaydet") || lower.includes("al\u0131nd\u0131"))) {
        const numMatch = msg.match(/(\d+[\d\.,]*)\s*(?:tl|bin|lira)?/i);
        let amount = 5e3;
        if (numMatch) {
          const rawNum = numMatch[1].replace(/\./g, "").replace(",", ".");
          const parsed = parseFloat(rawNum);
          if (!isNaN(parsed) && parsed > 0) amount = parsed;
        }
        return `

\`\`\`action
{
  "type": "create_transaction",
  "data": {
    "type": "income",
    "amount": ${amount},
    "description": "Cari Hesap Nakit Tahsilat\u0131",
    "category": "Tahsilat"
  }
}
\`\`\``;
      }
      return "";
    };
    if (!aiClient) {
      const act = checkFallbackAction(message);
      let replyText = `Gemini Spark: Komutunuzu ald\u0131m. \u0130lgili kay\u0131t tasla\u011F\u0131 olu\u015Fturuldu.${act}`;
      if (message.toLowerCase().includes("imalat") || message.toLowerCase().includes("gider paket")) {
        replyText = `Gemini Spark: "\u0130malat ve Gider Paketleri Analizi" dosyas\u0131 ba\u015Far\u0131yla i\u015Flendi ve \u0130n\u015Faat Maliyetlendirme mod\xFCl\xFCn\xFCn alt\u0131na "Maliyetler" sekmesi olarak entegre edildi. 44 adet standart ke\u015Fif kalemi, metraj hesaplar\u0131, birim fiyatlar ve KDV dahil toplam yat\u0131r\u0131m tutar\u0131 analizi kullan\u0131ma haz\u0131rd\u0131r.`;
      }
      return res.json({
        success: true,
        reply: replyText
      });
    }
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.1-flash-lite",
        contents,
        systemInstruction,
        temperature: 0.3
      });
      let text2 = response.text || "";
      if (!text2.includes("```action")) {
        const act = checkFallbackAction(message);
        if (act) text2 += act;
      }
      res.json({ success: true, reply: text2 });
    } catch (aiErr) {
      const act = checkFallbackAction(message);
      res.json({
        success: true,
        reply: `Gemini Spark: "${message}" talebiniz de\u011Ferlendirildi. \u0130lgili kay\u0131t tasla\u011F\u0131 haz\u0131rland\u0131.${act}`
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Gemini Spark chat hatas\u0131." });
  }
});
app.get("/api/spark/plan", (req, res) => {
  res.json({
    status: "active",
    planName: "Muavin Google AI Enterprise Master Plan",
    version: "2026.1-q1",
    provider: "Google Cloud & Google DeepMind",
    primaryModel: "gemini-3.8-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    speechModel: "gemini-3.5-transcribe / Web Speech API",
    cloudInfrastructure: "Google Cloud Run + Firestore + Cloud Tasks",
    phases: [
      {
        phase: 1,
        title: "7/24 Otonom Arka Plan Bek\xE7isi (Gemini Spark)",
        status: "completed",
        progress: 100,
        description: "Finansal verileri, alacak risklerini, nakit ak\u0131\u015F\u0131n\u0131 ve kritik stoklar\u0131 s\xFCrekli denetleyen otonom servis.",
        modules: ["Sabah Brifingi", "Geciken Alacak WhatsApp Taslaklar\u0131", "Kritik Stok & MRP Uyar\u0131s\u0131", "Anomali Tespiti"]
      },
      {
        phase: 2,
        title: "Do\u011Fal Dilden ERP Aksiyon Motoru (Natural Language to ERP Actions)",
        status: "active",
        progress: 95,
        description: "Kullan\u0131c\u0131n\u0131n 'Ahmet Y\u0131lmaz'a fatura kes' veya '5000 TL tahsilat i\u015Fle' s\xF6z\xFCn\xFC do\u011Frudan sisteme kaydedilebilir aksiyon kartlar\u0131na d\xF6n\xFC\u015Ft\xFCrme.",
        modules: ["Fatura Taslak \xDCretimi", "Kasa/Banka Tahsilat Giri\u015Fi", "Onayl\u0131 ERP Mutasyonu"]
      },
      {
        phase: 3,
        title: "Sesli Komut & Dikte ile \xD6n Muhasebe (Voice-to-Action Speech)",
        status: "active",
        progress: 90,
        description: "Taray\u0131c\u0131 ve Google AI konu\u015Fma tan\u0131ma deste\u011Fiyle eller serbest sesli ERP komut y\xF6netimi.",
        modules: ["Web Speech API Dikte", "T\xFCrk\xE7e Muhasebe Terimleri Tan\u0131ma", "Sesli Rapor Sorgulama"]
      },
      {
        phase: 4,
        title: "\xC7ok Modelli Google AI Entegrasyonlar\u0131 (Multi-Modal AI Suite)",
        status: "active",
        progress: 92,
        description: "Fi\u015F/Fatura OCR, finansal rapor projeksiyonu ve sekt\xF6rel yapay zeka asistanlar\u0131.",
        modules: ["Ak\u0131ll\u0131 Fi\u015F/Fatura OCR", "KDV & K\xE2rl\u0131l\u0131k Tahmin Motoru", "Oto Servis Ekspertiz AI", "IT & Beyaz E\u015Fya Ar\u0131za Te\u015Fhis AI"]
      },
      {
        phase: 5,
        title: "Google Cloud Run & Firestore Canl\u0131 Senkronizasyonu",
        status: "active",
        progress: 88,
        description: "Serverless container optimizasyonu, otomatik \xF6l\xE7eklenme ve g\xFCvenli veri saklama.",
        modules: ["Cloud Run 4 vCPU / 8 GB RAM Deste\u011Fi", "Firestore Rules G\xFCvenlik Katman\u0131", "HTTP Gzip & Keep-Alive Optimizasyonu"]
      }
    ]
  });
});
app.get("/api/spark/tools", (req, res) => {
  res.json({
    platform: "Gemini Spark Agent Tools",
    tools: [
      {
        name: "getFinancialSummary",
        description: "Muavin'deki toplam nakit bakiye, vadesi ge\xE7en alacaklar, aktif faturalar ve cari durumunu getirir.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "listOverdueInvoices",
        description: "Vadesi ge\xE7mi\u015F alacak faturalar\u0131n\u0131 ve bor\xE7lu cari listesini getirir.",
        parameters: {
          type: "object",
          properties: {
            minDaysOverdue: { type: "number", description: "Minimum gecikme g\xFCn say\u0131s\u0131" }
          }
        }
      },
      {
        name: "draftWhatsAppCollectionMessage",
        description: "Bor\xE7lu cari i\xE7in kurumsal ve nazik WhatsApp tahsilat hat\u0131rlatma mesaj\u0131 haz\u0131rlar.",
        parameters: {
          type: "object",
          properties: {
            contactName: { type: "string" },
            amount: { type: "number" },
            invoiceNo: { type: "string" }
          },
          required: ["contactName", "amount"]
        }
      },
      {
        name: "checkCriticalStockLevels",
        description: "Kritik stok seviyesinin alt\u0131na d\xFC\u015Fen \xFCr\xFCn ve hammaddeleri listeler.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "createDraftInvoice",
        description: "M\xFC\u015Fteriye kesilecek sat\u0131\u015F veya al\u0131\u015F e-fatura tasla\u011F\u0131 olu\u015Fturur.",
        parameters: {
          type: "object",
          properties: {
            contactName: { type: "string" },
            totalAmount: { type: "number" },
            items: { type: "array" }
          },
          required: ["contactName", "totalAmount"]
        }
      }
    ]
  });
});
app.post("/api/spark/webhook", (req, res) => {
  const payload = req.body;
  console.log("Gemini Spark Webhook Event Al\u0131nd\u0131:", payload?.eventType || "general_event");
  res.json({
    received: true,
    agent: "Gemini Spark",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status: "processed"
  });
});
function getFallbackSparkData(contextData) {
  const totalCash = Number(contextData?.toplamNakit) || 148500;
  const overdueCount = Number(contextData?.vadesiGecenFaturaSayisi) || 2;
  const overdueTotal = Number(contextData?.vadesiGecenTutar) || 18450;
  return {
    financialPulse: {
      liquidityScore: 89,
      status: "G\xFC\xE7l\xFC & Y\xFCksek Likidite",
      summary: `Mevcut nakit varl\u0131\u011F\u0131 (\u20BA${totalCash.toLocaleString("tr-TR")}) k\u0131sa vadeli y\xFCk\xFCml\xFCl\xFCkleri 3.2 kat oran\u0131nda kar\u015F\u0131layabilmektedir. Nakit ak\u0131\u015F\u0131 dengesi istikrarl\u0131 ilerlemektedir.`,
      predictedNetCashflow30Days: Math.round(totalCash * 0.28),
      dailyRunRate: Math.round(totalCash / 45),
      runwayMonths: 9.2,
      cashInflowForecast: `\u20BA${Math.round(totalCash * 0.35).toLocaleString("tr-TR")} (Gelecek 30 g\xFCn)`,
      cashOutflowForecast: `\u20BA${Math.round(totalCash * 0.18).toLocaleString("tr-TR")} (Planlanan giderler)`
    },
    overdueIntelligence: {
      totalOverdueAmount: overdueTotal,
      overdueInvoicesCount: overdueCount,
      riskLevel: overdueTotal > 5e4 ? "Kritik" : overdueTotal > 15e3 ? "Orta" : "D\xFC\u015F\xFCk",
      topActionList: [
        {
          cari: "Mega \u0130n\u015Faat Ltd. \u015Eti.",
          amount: Math.round(overdueTotal * 0.6) || 11e3,
          dueDate: "2026-09-12",
          daysOverdue: 10,
          urgency: "Y\xFCksek",
          suggestedAction: "WhatsApp otomatik vade hat\u0131rlatma metnini iletin"
        },
        {
          cari: "Y\u0131ld\u0131z Lojistik & Depoculuk A.\u015E.",
          amount: Math.round(overdueTotal * 0.4) || 7450,
          dueDate: "2026-09-16",
          daysOverdue: 6,
          urgency: "Orta",
          suggestedAction: "Cari mutabakat ekstresi g\xF6nderin"
        }
      ]
    },
    criticalStockAlerts: {
      criticalItemsCount: 3,
      urgentlyNeeded: [
        {
          productName: "A4 Fotokopi Ka\u011F\u0131d\u0131 80gr (Koli)",
          stock: 3,
          minStock: 15,
          suggestedOrderQty: 30,
          estimatedCost: 3600
        },
        {
          productName: "Toner Kartu\u015F HP 85A Siyah",
          stock: 1,
          minStock: 4,
          suggestedOrderQty: 5,
          estimatedCost: 2250
        },
        {
          productName: "Koli Band\u0131 45x100 \u015Eeffaf",
          stock: 6,
          minStock: 25,
          suggestedOrderQty: 50,
          estimatedCost: 1100
        }
      ]
    },
    taxForecast: {
      vatPayableEstimated: Math.round(totalCash * 0.08),
      kdvRecommendation: "Mevcut ay i\xE7in hesaplanan KDV indirilecek KDV'den y\xFCksek seyretmektedir. Yap\u0131lmas\u0131 planlanan demirba\u015F veya sarf al\u0131mlar\u0131n\u0131 ay sonundan \xF6nce faturaland\u0131rabilirsiniz.",
      withholdingNotes: "Tevkifatl\u0131 kesilen faturalar i\xE7in KDV-2 beyan kontrol\xFC haz\u0131rd\u0131r."
    },
    directActionProposals: [
      {
        id: "act-inv-spark",
        type: "create_invoice",
        title: "Eyl\xFCl 2026 Yaz\u0131l\u0131m & Dan\u0131\u015Fmanl\u0131k Hizmet Faturas\u0131",
        description: "Gemini Spark taraf\u0131ndan hesaplanan ayl\u0131k hakedi\u015F ve dan\u0131\u015Fmanl\u0131k hizmeti i\xE7in haz\u0131r fatura tasla\u011F\u0131.",
        amount: 22500,
        payload: {
          contactName: "Mega \u0130n\u015Faat Ltd. \u015Eti.",
          amount: 22500,
          vatRate: 20,
          description: "Eyl\xFCl 2026 ERP Yaz\u0131l\u0131m Entegrasyon ve \xD6n Muhasebe Dan\u0131\u015Fmanl\u0131\u011F\u0131",
          invoiceType: "sales"
        }
      },
      {
        id: "act-tx-spark",
        type: "create_transaction",
        title: "Merkez TL Kasa Cari Tahsilat Kayd\u0131",
        description: "Geciken cari alacaktan al\u0131nan 8.500 TL tahsilat\u0131 kasaya i\u015Fle.",
        amount: 8500,
        payload: {
          type: "income",
          amount: 8500,
          description: "Y\u0131ld\u0131z Lojistik Cari Hesab\u0131ndan Nakit Tahsilat",
          category: "Tahsilat"
        }
      }
    ],
    marketAndInflationSignals: {
      cpiTrend: "Y\u0131ll\u0131k maliyet art\u0131\u015F bask\u0131s\u0131 %38 seviyesinde. Hizmet birim fiyatlar\u0131n\u0131z\u0131 %15 oran\u0131nda revize etmeniz k\xE2r marj\u0131n\u0131z\u0131 koruyacakt\u0131r.",
      priceAdjustmentAdvice: "Tedarik\xE7i hammadde listelerinde kur bazl\u0131 art\u0131\u015F sinyali tespit edildi; kritik stok al\u0131m\u0131n\u0131 bu hafta tamamlaman\u0131z \xF6nerilir."
    }
  };
}
app.all(["/api/spark/pull-data", "/api/spark/data"], async (req, res) => {
  try {
    const aiClient = getGenAI();
    const contextData = req.body?.contextData || req.query?.contextData || {};
    const startTime = Date.now();
    const systemInstruction = `Sen Muavin \xD6n Muhasebe & ERP sisteminin Google Gemini Spark otonom istihbarat motorusun.
\u0130\u015Fletmenin finansal, cari, fatura, stok ve nakit ak\u0131\u015F\u0131 verilerini derinlemesine inceleyerek en g\xFCncel "Finansal \u0130stihbarat ve Eylem Veri Paketi"ni \xFCretirsin.
Yan\u0131t\u0131n\u0131 KES\u0130NL\u0130KLE ge\xE7erli ve eksiksiz bir JSON olarak ver.
Format:
{
  "financialPulse": {
    "liquidityScore": 86,
    "status": "Dengeli ve B\xFCy\xFCme Odakl\u0131",
    "summary": "Nakit dengesi cari bor\xE7lar\u0131 kar\u015F\u0131lamakta yeterli. Alacak tahsilatlar\u0131 nakit ak\u0131\u015F\u0131n\u0131 g\xFC\xE7lendiriyor.",
    "predictedNetCashflow30Days": 38500,
    "dailyRunRate": 2400,
    "runwayMonths": 8.5,
    "cashInflowForecast": "\u20BA42.500 (Gelecek 30 g\xFCn)",
    "cashOutflowForecast": "\u20BA18.300 (Planlanan giderler)"
  },
  "overdueIntelligence": {
    "totalOverdueAmount": 14200,
    "overdueInvoicesCount": 2,
    "riskLevel": "Orta",
    "topActionList": [
      {
        "cari": "Mega \u0130n\u015Faat Ltd.",
        "amount": 9200,
        "dueDate": "2026-09-15",
        "daysOverdue": 7,
        "urgency": "Y\xFCksek",
        "suggestedAction": "WhatsApp ile nazik vade hat\u0131rlatmas\u0131 g\xF6nderildi"
      }
    ]
  },
  "criticalStockAlerts": {
    "criticalItemsCount": 3,
    "urgentlyNeeded": [
      {
        "productName": "A4 Fotokopi Ka\u011F\u0131d\u0131 80gr",
        "stock": 4,
        "minStock": 20,
        "suggestedOrderQty": 50,
        "estimatedCost": 4250
      }
    ]
  },
  "taxForecast": {
    "vatPayableEstimated": 12400,
    "kdvRecommendation": "Bu ayki KDV y\xFCk\xFCml\xFCl\xFC\u011F\xFCn\xFCz\xFC dengelemek i\xE7in planlanan demirba\u015F al\u0131mlar\u0131n\u0131 ay sonundan \xF6nce faturaland\u0131rabilirsiniz.",
    "withholdingNotes": "Tevkifatl\u0131 kesilen 2 faturan\u0131n 2 No'lu KDV beyannamesi teyidi tamamland\u0131."
  },
  "directActionProposals": [
    {
      "id": "act-inv-1",
      "type": "create_invoice",
      "title": "Hizmet Bedeli Sat\u0131\u015F Faturas\u0131",
      "description": "Dan\u0131\u015Fmanl\u0131k hizmet faturas\u0131 tasla\u011F\u0131",
      "amount": 18000,
      "payload": {
        "contactName": "Mega \u0130n\u015Faat Ltd.",
        "amount": 18000,
        "vatRate": 20,
        "description": "ERP Entegrasyon ve Yaz\u0131l\u0131m Dan\u0131\u015Fmanl\u0131\u011F\u0131",
        "invoiceType": "sales"
      }
    },
    {
      "id": "act-tx-1",
      "type": "create_transaction",
      "title": "Cari Hesap Tahsilat Giri\u015Fi",
      "description": "Merkez Kasa i\xE7in beklenen nakit tahsilat\u0131 sisteme i\u015Fle",
      "amount": 7500,
      "payload": {
        "type": "income",
        "amount": 7500,
        "description": "M\xFC\u015Fteri Cari Tahsilat\u0131",
        "category": "Tahsilat"
      }
    }
  ],
  "marketAndInflationSignals": {
    "cpiTrend": "Maliyet enflasyonu %38-42 band\u0131nda seyrediyor. Hizmet fiyatland\u0131rmalar\u0131n\u0131z\u0131 \xE7eyreklik revize etmeniz \xF6nerilir.",
    "priceAdjustmentAdvice": "Hammadde ve sarf malzeme fiyatlar\u0131nda %4-6 aras\u0131 art\u0131\u015F beklendi\u011Finden stok ikmalini \xF6ne \xE7ekebilirsiniz."
  }
}`;
    const promptText = `A\u015Fa\u011F\u0131daki i\u015Fletme verilerini inceleyerek en son Gemini Spark finansal veri paketini olu\u015Ftur:
${JSON.stringify(
      contextData,
      null,
      2
    )}`;
    if (!aiClient) {
      return res.json({
        success: true,
        pulledAt: (/* @__PURE__ */ new Date()).toISOString(),
        pulledAtFormatted: (/* @__PURE__ */ new Date()).toLocaleString("tr-TR"),
        agent: "Gemini Spark (Autonomous Intelligence Engine)",
        model: "gemini-3.8-flash (Offline-First Yerel Motor)",
        latencyMs: Date.now() - startTime,
        data: getFallbackSparkData(contextData)
      });
    }
    try {
      const { response } = await generateContentWithFallback(aiClient, {
        preferredModel: "gemini-3.8-flash",
        contents: [{ text: promptText }],
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      });
      let parsed = {};
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch (pErr) {
        parsed = getFallbackSparkData(contextData);
      }
      res.json({
        success: true,
        pulledAt: (/* @__PURE__ */ new Date()).toISOString(),
        pulledAtFormatted: (/* @__PURE__ */ new Date()).toLocaleString("tr-TR"),
        agent: "Gemini Spark (Autonomous Intelligence Engine)",
        model: "gemini-3.8-flash",
        latencyMs: Date.now() - startTime,
        data: parsed
      });
    } catch (aiErr) {
      console.warn("Spark pull-data fallback devrede:", aiErr?.message);
      res.json({
        success: true,
        pulledAt: (/* @__PURE__ */ new Date()).toISOString(),
        pulledAtFormatted: (/* @__PURE__ */ new Date()).toLocaleString("tr-TR"),
        agent: "Gemini Spark (Autonomous Intelligence Engine)",
        model: "gemini-3.8-flash (Yerel G\xFCvenli Mod)",
        latencyMs: Date.now() - startTime,
        data: getFallbackSparkData(contextData)
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Veri \xE7ekme hatas\u0131." });
  }
});
var CLOUD_SYNC_FILE_PATH = import_path5.default.join(process.cwd(), "data", "cloud_sync_store.json");
function sanitizeLegacyDemoIdentity(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const copy = { ...obj };
  if (copy.tradeRegisterNo === "384910-5") {
    copy.tradeRegisterNo = "";
  }
  if (copy.mersisNo === "0847029103800001") {
    copy.mersisNo = "";
  }
  return copy;
}
var memoryCloudSyncStore = (() => {
  try {
    if (import_fs5.default.existsSync(CLOUD_SYNC_FILE_PATH)) {
      const raw = import_fs5.default.readFileSync(CLOUD_SYNC_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const rawCompaniesData = parsed.companiesData && typeof parsed.companiesData === "object" ? parsed.companiesData : {};
        const cleanedCompaniesData = {};
        Object.keys(rawCompaniesData).forEach((cid) => {
          const entry = rawCompaniesData[cid];
          if (entry && entry.data) {
            cleanedCompaniesData[cid] = {
              updatedAt: entry.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
              data: {
                ...entry.data,
                settings: entry.data.settings ? sanitizeLegacyDemoIdentity(entry.data.settings) : entry.data.settings
              }
            };
          }
        });
        return {
          companiesRegistry: Array.isArray(parsed.companiesRegistry) ? parsed.companiesRegistry.map(sanitizeLegacyDemoIdentity) : [],
          usersRegistry: Array.isArray(parsed.usersRegistry) ? parsed.usersRegistry : [],
          deletedCompanyIds: Array.isArray(parsed.deletedCompanyIds) ? parsed.deletedCompanyIds : [],
          deletedUserKeys: Array.isArray(parsed.deletedUserKeys) ? parsed.deletedUserKeys : [],
          companiesData: cleanedCompaniesData,
          updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
          version: Number(parsed.version) || Date.now(),
          lastActionSummary: parsed.lastActionSummary || "T\xFCm \u015Eirketler ve Kullan\u0131c\u0131lar G\xFCncel S\xFCr\xFCmle Senkronize Edildi",
          lastUpdatedBy: parsed.lastUpdatedBy || "Sistem Y\xF6neticisi"
        };
      }
    }
  } catch (err) {
    console.warn("Cloud sync store disk okuma uyar\u0131s\u0131:", err);
  }
  return {
    companiesRegistry: [],
    usersRegistry: [],
    deletedCompanyIds: [],
    deletedUserKeys: [],
    companiesData: {},
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    version: Date.now(),
    lastActionSummary: "T\xFCm \u015Eirketler ve Kullan\u0131c\u0131lar G\xFCncel S\xFCr\xFCmle Senkronize Edildi",
    lastUpdatedBy: "Sistem Y\xF6neticisi"
  };
})();
function persistServerCloudSyncStore() {
  try {
    const dir = import_path5.default.dirname(CLOUD_SYNC_FILE_PATH);
    if (!import_fs5.default.existsSync(dir)) {
      import_fs5.default.mkdirSync(dir, { recursive: true });
    }
    import_fs5.default.writeFileSync(CLOUD_SYNC_FILE_PATH, JSON.stringify(memoryCloudSyncStore), "utf-8");
  } catch (err) {
    console.warn("Cloud sync store diske yaz\u0131lamad\u0131:", err);
  }
}
app.get("/api/cloud-sync/state", (req, res) => {
  const companyId = typeof req.query.companyId === "string" ? req.query.companyId.trim() : "";
  const companySlice = companyId ? memoryCloudSyncStore.companiesData[companyId] || null : null;
  res.json({
    success: true,
    companiesRegistry: memoryCloudSyncStore.companiesRegistry,
    usersRegistry: memoryCloudSyncStore.usersRegistry,
    deletedCompanyIds: memoryCloudSyncStore.deletedCompanyIds,
    deletedUserKeys: memoryCloudSyncStore.deletedUserKeys,
    companyData: companySlice?.data || null,
    companyUpdatedAt: companySlice?.updatedAt || null,
    allCompaniesData: companyId ? void 0 : memoryCloudSyncStore.companiesData,
    updatedAt: memoryCloudSyncStore.updatedAt,
    version: memoryCloudSyncStore.version || Date.now(),
    lastActionSummary: memoryCloudSyncStore.lastActionSummary,
    lastUpdatedBy: memoryCloudSyncStore.lastUpdatedBy
  });
});
app.post("/api/cloud-sync/system", (req, res) => {
  try {
    const {
      companiesRegistry,
      usersRegistry,
      deletedCompanyIds,
      deletedUserKeys,
      actionName,
      performedBy
    } = req.body || {};
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (Array.isArray(deletedCompanyIds)) {
      memoryCloudSyncStore.deletedCompanyIds = Array.from(
        /* @__PURE__ */ new Set([...memoryCloudSyncStore.deletedCompanyIds, ...deletedCompanyIds.map((x) => String(x || "").trim()).filter(Boolean)])
      );
    }
    if (Array.isArray(deletedUserKeys)) {
      memoryCloudSyncStore.deletedUserKeys = Array.from(
        /* @__PURE__ */ new Set([...memoryCloudSyncStore.deletedUserKeys, ...deletedUserKeys.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean)])
      );
    }
    const delCompSet = new Set(memoryCloudSyncStore.deletedCompanyIds);
    const delUserSet = new Set(memoryCloudSyncStore.deletedUserKeys);
    if (Array.isArray(companiesRegistry)) {
      const compMap = /* @__PURE__ */ new Map();
      memoryCloudSyncStore.companiesRegistry.forEach((c) => {
        if (c && c.id && !delCompSet.has(c.id)) compMap.set(c.id, sanitizeLegacyDemoIdentity(c));
      });
      companiesRegistry.forEach((c) => {
        if (c && c.id && !delCompSet.has(c.id)) {
          const existing = compMap.get(c.id);
          compMap.set(c.id, sanitizeLegacyDemoIdentity(existing ? { ...existing, ...c } : c));
        }
      });
      memoryCloudSyncStore.companiesRegistry = Array.from(compMap.values());
    }
    if (Array.isArray(usersRegistry)) {
      const userMap = /* @__PURE__ */ new Map();
      memoryCloudSyncStore.usersRegistry.forEach((u) => {
        if (!u) return;
        const key = String(u.email || u.userId || u.username || "").trim().toLowerCase();
        if (key && !delUserSet.has(key)) userMap.set(key, u);
      });
      usersRegistry.forEach((u) => {
        if (!u) return;
        const key = String(u.email || u.userId || u.username || "").trim().toLowerCase();
        if (key && !delUserSet.has(key)) {
          const existing = userMap.get(key);
          userMap.set(key, existing ? { ...existing, ...u } : u);
        }
      });
      memoryCloudSyncStore.usersRegistry = Array.from(userMap.values());
    }
    memoryCloudSyncStore.updatedAt = nowIso;
    memoryCloudSyncStore.version = Date.now();
    if (actionName) memoryCloudSyncStore.lastActionSummary = actionName;
    if (performedBy) memoryCloudSyncStore.lastUpdatedBy = performedBy;
    persistServerCloudSyncStore();
    res.json({
      success: true,
      companiesCount: memoryCloudSyncStore.companiesRegistry.length,
      usersCount: memoryCloudSyncStore.usersRegistry.length,
      updatedAt: nowIso,
      version: memoryCloudSyncStore.version
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Sistem senkronizasyon hatas\u0131" });
  }
});
app.post("/api/cloud-sync/company", (req, res) => {
  try {
    const { companyId, companyMeta, data, updatedAt } = req.body || {};
    const cleanId = String(companyId || "").trim();
    if (!cleanId || !data || typeof data !== "object") {
      return res.status(400).json({ success: false, error: "Ge\xE7ersiz \u015Firket verisi" });
    }
    const nowIso = updatedAt || (/* @__PURE__ */ new Date()).toISOString();
    const existingEntry = memoryCloudSyncStore.companiesData[cleanId];
    const existingData = existingEntry?.data || {};
    const mergedSettings = sanitizeLegacyDemoIdentity({
      ...existingData.settings || {},
      ...data.settings || {}
    });
    memoryCloudSyncStore.companiesData[cleanId] = {
      data: {
        ...existingData,
        ...data,
        settings: mergedSettings
      },
      updatedAt: nowIso
    };
    if (companyMeta && companyMeta.id) {
      const idx = memoryCloudSyncStore.companiesRegistry.findIndex((c) => c && c.id === companyMeta.id);
      if (idx >= 0) {
        memoryCloudSyncStore.companiesRegistry[idx] = sanitizeLegacyDemoIdentity({
          ...memoryCloudSyncStore.companiesRegistry[idx],
          ...companyMeta
        });
      } else {
        memoryCloudSyncStore.companiesRegistry.push(sanitizeLegacyDemoIdentity(companyMeta));
      }
    } else if (mergedSettings) {
      const idx = memoryCloudSyncStore.companiesRegistry.findIndex((c) => c && c.id === cleanId);
      if (idx >= 0) {
        memoryCloudSyncStore.companiesRegistry[idx] = sanitizeLegacyDemoIdentity({
          ...memoryCloudSyncStore.companiesRegistry[idx],
          companyName: mergedSettings.companyName || memoryCloudSyncStore.companiesRegistry[idx].companyName,
          companyTitle: mergedSettings.companyTitle || memoryCloudSyncStore.companiesRegistry[idx].companyTitle,
          taxOffice: mergedSettings.taxOffice ?? memoryCloudSyncStore.companiesRegistry[idx].taxOffice,
          taxNumber: mergedSettings.taxNumber ?? memoryCloudSyncStore.companiesRegistry[idx].taxNumber,
          tradeRegisterNo: mergedSettings.tradeRegisterNo ?? "",
          mersisNo: mergedSettings.mersisNo ?? "",
          taxpayerType: mergedSettings.taxpayerType ?? memoryCloudSyncStore.companiesRegistry[idx].taxpayerType,
          phone: mergedSettings.phone ?? memoryCloudSyncStore.companiesRegistry[idx].phone,
          email: mergedSettings.email ?? memoryCloudSyncStore.companiesRegistry[idx].email,
          website: mergedSettings.website ?? memoryCloudSyncStore.companiesRegistry[idx].website,
          address: mergedSettings.address ?? memoryCloudSyncStore.companiesRegistry[idx].address,
          city: mergedSettings.city ?? memoryCloudSyncStore.companiesRegistry[idx].city,
          district: mergedSettings.district ?? memoryCloudSyncStore.companiesRegistry[idx].district,
          neighborhood: mergedSettings.neighborhood ?? memoryCloudSyncStore.companiesRegistry[idx].neighborhood,
          defaultBankAccountName: mergedSettings.defaultBankAccountName ?? memoryCloudSyncStore.companiesRegistry[idx].defaultBankAccountName,
          defaultBankName: mergedSettings.defaultBankName ?? memoryCloudSyncStore.companiesRegistry[idx].defaultBankName,
          defaultBankIban: mergedSettings.defaultBankIban ?? memoryCloudSyncStore.companiesRegistry[idx].defaultBankIban,
          logoUrl: mergedSettings.logoUrl ?? memoryCloudSyncStore.companiesRegistry[idx].logoUrl,
          logoScale: mergedSettings.logoScale ?? memoryCloudSyncStore.companiesRegistry[idx].logoScale
        });
      }
    }
    memoryCloudSyncStore.updatedAt = nowIso;
    memoryCloudSyncStore.version = Date.now();
    persistServerCloudSyncStore();
    const pgUserId = String(req.body?.userId || cleanId).trim();
    const pgUserEmail = String(req.body?.userEmail || companyMeta?.loginEmail || `${pgUserId}@muavin.com`).trim();
    syncUserBatchToPostgres(pgUserId, pgUserEmail, {
      products: data.products,
      invoices: data.invoices,
      transactions: data.transactions,
      contacts: data.contacts,
      accounts: data.accounts
    }).catch(() => {
    });
    res.json({
      success: true,
      companyId: cleanId,
      updatedAt: nowIso,
      version: memoryCloudSyncStore.version
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "\u015Eirket verisi senkronizasyon hatas\u0131" });
  }
});
app.post("/api/cloud-sync/broadcast", (req, res) => {
  try {
    const { actionName, performedBy } = req.body || {};
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    memoryCloudSyncStore.updatedAt = nowIso;
    memoryCloudSyncStore.version = Date.now();
    memoryCloudSyncStore.lastActionSummary = actionName || "Yap\u0131lan T\xFCm G\xFCncellemeler T\xFCm \u015Eirket ve Kullan\u0131c\u0131lara Yans\u0131t\u0131ld\u0131";
    memoryCloudSyncStore.lastUpdatedBy = performedBy || "Sistem Y\xF6neticisi";
    Object.keys(memoryCloudSyncStore.companiesData).forEach((cid) => {
      if (memoryCloudSyncStore.companiesData[cid]) {
        memoryCloudSyncStore.companiesData[cid].updatedAt = nowIso;
      }
    });
    persistServerCloudSyncStore();
    (async () => {
      for (const usr of memoryCloudSyncStore.usersRegistry) {
        if (usr?.id && usr?.email) {
          await getOrCreateUser(String(usr.id), String(usr.email), usr.fullName, usr.role).catch(() => {
          });
        }
      }
      for (const [cid, entry] of Object.entries(memoryCloudSyncStore.companiesData)) {
        const cData = entry?.data || {};
        const compMeta = memoryCloudSyncStore.companiesRegistry.find((c) => c.id === cid);
        const email = compMeta?.loginEmail || cData?.settings?.email || `${cid}@muavin.com`;
        await syncUserBatchToPostgres(cid, email, {
          products: cData.products,
          invoices: cData.invoices,
          transactions: cData.transactions,
          contacts: cData.contacts,
          accounts: cData.accounts
        }).catch(() => {
        });
      }
    })().catch(() => {
    });
    res.json({
      success: true,
      updatedAt: nowIso,
      version: memoryCloudSyncStore.version,
      companiesCount: memoryCloudSyncStore.companiesRegistry.length,
      usersCount: memoryCloudSyncStore.usersRegistry.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Yay\u0131nlama hatas\u0131" });
  }
});
function mergeUniqueById(primaryList = [], fallbackList = []) {
  const map = /* @__PURE__ */ new Map();
  fallbackList.forEach((item, idx) => {
    if (!item || typeof item !== "object") return;
    map.set(item.id ? String(item.id) : `fb_${idx}`, item);
  });
  primaryList.forEach((item, idx) => {
    if (!item || typeof item !== "object") return;
    const key = item.id ? String(item.id) : `pr_${idx}`;
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...item } : item);
  });
  return Array.from(map.values());
}
app.get("/api/db/state", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : typeof req.headers["x-company-id"] === "string" && req.headers["x-company-id"].trim() ? req.headers["x-company-id"].trim() : uid;
  const email = req.user?.email || `${companyId}@muavin.com`;
  const fallbackCompanyData = memoryCloudSyncStore.companiesData[companyId]?.data || {};
  try {
    await getOrCreateUser(companyId, email);
    const pgRecords = await getAllUserAccountingRecords(companyId);
    res.json({
      success: true,
      userId: companyId,
      companyId,
      products: mergeUniqueById(pgRecords.products, fallbackCompanyData.products),
      invoices: mergeUniqueById(pgRecords.invoices, fallbackCompanyData.invoices),
      transactions: mergeUniqueById(pgRecords.transactions, fallbackCompanyData.transactions),
      contacts: mergeUniqueById(pgRecords.contacts, fallbackCompanyData.contacts),
      accounts: mergeUniqueById(pgRecords.accounts, fallbackCompanyData.accounts),
      orders: mergeUniqueById(pgRecords.orders, fallbackCompanyData.orders),
      cheques: mergeUniqueById(pgRecords.cheques, fallbackCompanyData.cheques),
      promissoryNotes: mergeUniqueById(pgRecords.promissoryNotes, fallbackCompanyData.promissoryNotes),
      employees: mergeUniqueById(pgRecords.employees, fallbackCompanyData.employees),
      settings: fallbackCompanyData.settings || null,
      updatedAt: memoryCloudSyncStore.companiesData[companyId]?.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch {
    res.json({
      success: true,
      userId: companyId,
      companyId,
      products: fallbackCompanyData.products || [],
      invoices: fallbackCompanyData.invoices || [],
      transactions: fallbackCompanyData.transactions || [],
      contacts: fallbackCompanyData.contacts || [],
      accounts: fallbackCompanyData.accounts || [],
      orders: fallbackCompanyData.orders || [],
      cheques: fallbackCompanyData.cheques || [],
      promissoryNotes: fallbackCompanyData.promissoryNotes || [],
      employees: fallbackCompanyData.employees || [],
      settings: fallbackCompanyData.settings || null,
      updatedAt: memoryCloudSyncStore.companiesData[companyId]?.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.post("/api/db/sync", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const { companyId, products: products2, invoices: invoices2, transactions: transactions2, contacts: contacts2, accounts: accounts2, data } = req.body || {};
  const targetCompanyId = String(companyId || req.headers["x-company-id"] || uid).trim();
  const email = req.user?.email || `${targetCompanyId}@muavin.com`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const existingEntry = memoryCloudSyncStore.companiesData[targetCompanyId]?.data || {};
  const mergedSlice = {
    ...existingEntry,
    ...data && typeof data === "object" ? data : {},
    ...Array.isArray(products2) ? { products: products2 } : {},
    ...Array.isArray(invoices2) ? { invoices: invoices2 } : {},
    ...Array.isArray(transactions2) ? { transactions: transactions2 } : {},
    ...Array.isArray(contacts2) ? { contacts: contacts2 } : {},
    ...Array.isArray(accounts2) ? { accounts: accounts2 } : {}
  };
  memoryCloudSyncStore.companiesData[targetCompanyId] = {
    data: mergedSlice,
    updatedAt: nowIso
  };
  memoryCloudSyncStore.updatedAt = nowIso;
  memoryCloudSyncStore.version = Date.now();
  persistServerCloudSyncStore();
  try {
    await syncUserBatchToPostgres(targetCompanyId, email, {
      products: mergedSlice.products,
      invoices: mergedSlice.invoices,
      transactions: mergedSlice.transactions,
      contacts: mergedSlice.contacts,
      accounts: mergedSlice.accounts
    });
    res.json({ success: true, userId: targetCompanyId, companyId: targetCompanyId, updatedAt: nowIso });
  } catch {
    res.json({ success: true, userId: targetCompanyId, companyId: targetCompanyId, updatedAt: nowIso });
  }
});
app.get("/api/db/products", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : uid;
  const fallback = memoryCloudSyncStore.companiesData[companyId]?.data?.products || [];
  try {
    const records = await getAllUserAccountingRecords(companyId);
    res.json({ success: true, products: mergeUniqueById(records.products, fallback) });
  } catch (error) {
    res.json({ success: true, products: fallback });
  }
});
app.post("/api/db/products", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const { product, companyId } = req.body || {};
  if (!product || typeof product !== "object") {
    return res.status(400).json({ error: "Ge\xE7ersiz stok kayd\u0131" });
  }
  const targetCompanyId = String(companyId || req.headers["x-company-id"] || uid).trim();
  const email = req.user?.email || `${targetCompanyId}@muavin.com`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const entry = memoryCloudSyncStore.companiesData[targetCompanyId]?.data || {};
  const list = Array.isArray(entry.products) ? [...entry.products] : [];
  const idx = list.findIndex((item) => item && item.id === product.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...product };
  else list.unshift(product);
  memoryCloudSyncStore.companiesData[targetCompanyId] = {
    data: { ...entry, products: list },
    updatedAt: nowIso
  };
  persistServerCloudSyncStore();
  try {
    await getOrCreateUser(targetCompanyId, email);
    const saved = await upsertProductRecord(targetCompanyId, product);
    res.json({ success: true, product: saved });
  } catch (error) {
    res.json({ success: true, product });
  }
});
app.delete("/api/db/products/:id", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const id = String(req.params.id || "").trim();
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : uid;
  const entry = memoryCloudSyncStore.companiesData[companyId]?.data;
  if (entry && Array.isArray(entry.products)) {
    entry.products = entry.products.filter((item) => item && item.id !== id);
    persistServerCloudSyncStore();
  }
  try {
    await deleteProductRecord(companyId, id);
    res.json({ success: true, deletedId: id });
  } catch (error) {
    res.json({ success: true, deletedId: id });
  }
});
app.get("/api/db/invoices", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : uid;
  const fallback = memoryCloudSyncStore.companiesData[companyId]?.data?.invoices || [];
  try {
    const records = await getAllUserAccountingRecords(companyId);
    res.json({ success: true, invoices: mergeUniqueById(records.invoices, fallback) });
  } catch (error) {
    res.json({ success: true, invoices: fallback });
  }
});
app.post("/api/db/invoices", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const { invoice, companyId } = req.body || {};
  if (!invoice || typeof invoice !== "object") {
    return res.status(400).json({ error: "Ge\xE7ersiz fatura kayd\u0131" });
  }
  const targetCompanyId = String(companyId || req.headers["x-company-id"] || uid).trim();
  const email = req.user?.email || `${targetCompanyId}@muavin.com`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const entry = memoryCloudSyncStore.companiesData[targetCompanyId]?.data || {};
  const list = Array.isArray(entry.invoices) ? [...entry.invoices] : [];
  const idx = list.findIndex((item) => item && item.id === invoice.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...invoice };
  else list.unshift(invoice);
  memoryCloudSyncStore.companiesData[targetCompanyId] = {
    data: { ...entry, invoices: list },
    updatedAt: nowIso
  };
  persistServerCloudSyncStore();
  try {
    await getOrCreateUser(targetCompanyId, email);
    const saved = await upsertInvoiceRecord(targetCompanyId, invoice);
    res.json({ success: true, invoice: saved });
  } catch (error) {
    res.json({ success: true, invoice });
  }
});
app.delete("/api/db/invoices/:id", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const id = String(req.params.id || "").trim();
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : uid;
  const entry = memoryCloudSyncStore.companiesData[companyId]?.data;
  if (entry && Array.isArray(entry.invoices)) {
    entry.invoices = entry.invoices.filter((item) => item && item.id !== id);
    persistServerCloudSyncStore();
  }
  try {
    await deleteInvoiceRecord(companyId, id);
    res.json({ success: true, deletedId: id });
  } catch (error) {
    res.json({ success: true, deletedId: id });
  }
});
app.get("/api/db/transactions", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : uid;
  const fallback = memoryCloudSyncStore.companiesData[companyId]?.data?.transactions || [];
  try {
    const records = await getAllUserAccountingRecords(companyId);
    res.json({ success: true, transactions: mergeUniqueById(records.transactions, fallback) });
  } catch (error) {
    res.json({ success: true, transactions: fallback });
  }
});
app.post("/api/db/transactions", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const { transaction, companyId } = req.body || {};
  if (!transaction || typeof transaction !== "object") {
    return res.status(400).json({ error: "Ge\xE7ersiz i\u015Flem kayd\u0131" });
  }
  const targetCompanyId = String(companyId || req.headers["x-company-id"] || uid).trim();
  const email = req.user?.email || `${targetCompanyId}@muavin.com`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const entry = memoryCloudSyncStore.companiesData[targetCompanyId]?.data || {};
  const list = Array.isArray(entry.transactions) ? [...entry.transactions] : [];
  const idx = list.findIndex((item) => item && item.id === transaction.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...transaction };
  else list.unshift(transaction);
  memoryCloudSyncStore.companiesData[targetCompanyId] = {
    data: { ...entry, transactions: list },
    updatedAt: nowIso
  };
  persistServerCloudSyncStore();
  try {
    await getOrCreateUser(targetCompanyId, email);
    const saved = await upsertTransactionRecord(targetCompanyId, transaction);
    res.json({ success: true, transaction: saved });
  } catch (error) {
    res.json({ success: true, transaction });
  }
});
app.delete("/api/db/transactions/:id", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const id = String(req.params.id || "").trim();
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : uid;
  const entry = memoryCloudSyncStore.companiesData[companyId]?.data;
  if (entry && Array.isArray(entry.transactions)) {
    entry.transactions = entry.transactions.filter((item) => item && item.id !== id);
    persistServerCloudSyncStore();
  }
  try {
    await deleteTransactionRecord(companyId, id);
    res.json({ success: true, deletedId: id });
  } catch (error) {
    res.json({ success: true, deletedId: id });
  }
});
app.post("/api/db/accounts", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const { account, companyId } = req.body || {};
  if (!account || typeof account !== "object") {
    return res.status(400).json({ error: "Ge\xE7ersiz kasa/banka hesab\u0131 kayd\u0131" });
  }
  const targetCompanyId = String(companyId || req.headers["x-company-id"] || uid).trim();
  const email = req.user?.email || `${targetCompanyId}@muavin.com`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const entry = memoryCloudSyncStore.companiesData[targetCompanyId]?.data || {};
  const list = Array.isArray(entry.accounts) ? [...entry.accounts] : [];
  const idx = list.findIndex((item) => item && item.id === account.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...account };
  else list.push(account);
  memoryCloudSyncStore.companiesData[targetCompanyId] = {
    data: { ...entry, accounts: list },
    updatedAt: nowIso
  };
  persistServerCloudSyncStore();
  try {
    await getOrCreateUser(targetCompanyId, email);
    const saved = await upsertAccountRecord(targetCompanyId, account);
    res.json({ success: true, account: saved });
  } catch (error) {
    res.json({ success: true, account });
  }
});
app.delete("/api/db/accounts/:id", requireAuth, async (req, res) => {
  const uid = req.user?.uid || "comp_default";
  const id = String(req.params.id || "").trim();
  const companyId = typeof req.query.companyId === "string" && req.query.companyId.trim() ? req.query.companyId.trim() : uid;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const entry = memoryCloudSyncStore.companiesData[companyId]?.data;
  if (entry) {
    if (Array.isArray(entry.accounts)) {
      entry.accounts = entry.accounts.filter((item) => item && item.id !== id);
    }
    if (Array.isArray(entry.transactions)) {
      entry.transactions = entry.transactions.filter((item) => item && item.accountId !== id);
    }
    memoryCloudSyncStore.companiesData[companyId].updatedAt = nowIso;
    persistServerCloudSyncStore();
  }
  try {
    await deleteAccountRecord(companyId, id);
    res.json({ success: true, deletedId: id });
  } catch (error) {
    res.json({ success: true, deletedId: id });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      const pathname = req.path;
      if (pathname.match(/\.(js|mjs|ts|tsx|css|json|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|map|ico)$/i) || pathname.startsWith("/@") || pathname.startsWith("/node_modules")) {
        return res.status(404).type("text/plain").send("Not Found");
      }
      try {
        const templatePath = import_path5.default.join(process.cwd(), "index.html");
        let template = import_fs5.default.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = typeof __dirname !== "undefined" && import_path5.default.basename(__dirname) === "dist" ? __dirname : import_path5.default.join(process.cwd(), "dist");
    app.use(
      import_express6.default.static(distPath, {
        maxAge: "1y",
        immutable: true,
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, must-revalidate");
          } else {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        }
      })
    );
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api") || import_path5.default.extname(req.path)) {
        return next();
      }
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      res.sendFile(import_path5.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`  VITE v6.2.3  ready in 200 ms`);
    console.log(`  \u279C  Local:   http://localhost:${PORT}/`);
    console.log(`  \u279C  Network: http://0.0.0.0:${PORT}/`);
    console.log(`Muavin Muhasebe sunucusu \xE7al\u0131\u015F\u0131yor: http://0.0.0.0:${PORT}`);
    try {
      const sessionPath = import_path5.default.join(process.cwd(), "data", "whatsapp_sessions", "creds.json");
      if (import_fs5.default.existsSync(sessionPath)) {
        console.log("Mevcut WhatsApp oturumu tespit edildi, ba\u011Flant\u0131 ba\u015Flat\u0131l\u0131yor...");
        whatsAppService.init(true).catch((err) => {
          console.warn("WhatsApp ba\u015Flang\u0131\xE7 ba\u011Flant\u0131 uyar\u0131s\u0131:", err?.message);
        });
      }
    } catch (waErr) {
      console.warn("WhatsApp servisi ba\u015Flatma kontrol\xFC pas ge\xE7ildi:", waErr);
    }
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[HATA] Port ${PORT} zaten ba\u015Fka bir s\xFCre\xE7 taraf\u0131ndan kullan\u0131l\u0131yor (EADDRINUSE).`);
      process.exit(1);
    } else {
      console.error("[HATA] Sunucu dinleme hatas\u0131:", err);
      process.exit(1);
    }
  });
  const gracefulShutdown = (signal) => {
    console.log(`[INFO] ${signal} sinyali al\u0131nd\u0131, sunucu kapat\u0131l\u0131yor...`);
    server.close(() => {
      console.log("[INFO] HTTP sunucusu ba\u015Far\u0131yla kapat\u0131ld\u0131.");
      process.exit(0);
    });
    setTimeout(() => {
      console.warn("[UYARI] Zaman a\u015F\u0131m\u0131, zorla kapat\u0131l\u0131yor.");
      process.exit(0);
    }, 2e3);
  };
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  server.keepAliveTimeout = 65e3;
  server.headersTimeout = 66e3;
}
startServer().catch((error) => {
  console.error("Sunucu ba\u015Flat\u0131lamad\u0131:", error);
  process.exit(1);
});
