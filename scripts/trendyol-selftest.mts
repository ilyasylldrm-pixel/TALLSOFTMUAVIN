/**
 * Trendyol entegrasyonu öz testi (ağ kullanmaz; Trendyol ve Mysoft sahte).
 * Çalıştırma:  npx tsx scripts/trendyol-selftest.mts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- 1) Eşleyici ----------
import { mapTrendyolPackageToInvoice, isValidTckn, deterministicEttn } from "../src/services/trendyol/trendyolInvoiceMapper.ts";

// 1) Bireysel, 2 satır, satıcı indirimi + Trendyol indirimi (bireyselde fatura tutarına dahil edilmez)
const individual: any = {
  shipmentPackageId: 3330111, orderNumber: "10870", commercial: false, currencyCode: "TRY",
  identityNumber: "11111111111", customerEmail: "pf+abc@trendyolmail.com",
  invoiceAddress: { fullName: "Ayşe Yılmaz", fullAddress: "Moda Cad. No:5 Kadıköy İstanbul", city: "İstanbul", district: "Kadıköy" },
  packageGrossAmount: 1349.8, packageSellerDiscount: 100, packageTyDiscount: 0, packageTotalPrice: 1249.8,
  lines: [
    { lineId: 1, quantity: 2, productName: "Kupa", productColor: "Mavi", stockCode: "KUP-01", lineUnitPrice: 249.9, lineGrossAmount: 499.8, lineSellerDiscount: 0, lineTyDiscount: 25, vatRate: 20 },
    { lineId: 2, quantity: 1, productName: "Tişört", productSize: "M", barcode: "869000", lineUnitPrice: 850, lineGrossAmount: 850, lineSellerDiscount: 100, lineTyDiscount: 0, vatRate: 10 },
  ],
};
const a = mapTrendyolPackageToInvoice(individual, { companyId: "c1", issueDate: "2026-11-09" });
if (process.env.VERBOSE) console.log(JSON.stringify({ issues: a.blockingIssues, warn: a.warnings, totals: a.totals, items: a.invoice.items, sub: a.invoice.subtotal, vat: a.invoice.totalVat, grand: a.invoice.grandTotal }, null, 1));
assert.deepEqual(a.blockingIssues, []);
assert.equal(a.invoice.grandTotal, 1249.8);
assert.equal(a.buyerVknTckn, "11111111111");
for (const it of a.invoice.items) {
  const gross = Math.round(it.unitPrice * it.quantity * 100) / 100;
  assert.equal(Math.round((gross - (it.discountAmount || 0)) * 100) / 100, it.totalWithoutVat, "brüt-iskonto=matrah");
  assert.equal(Math.round((it.totalWithoutVat + it.vatAmount) * 100) / 100, it.totalWithVat);
}

// 2) Tutmayan paket → bloklanmalı
const bad = { ...individual, packageTotalPrice: 999 };
const b = mapTrendyolPackageToInvoice(bad, { companyId: "c1" });
assert.ok(b.blockingIssues.some((x) => x.includes("tutmuyor")), "mismatch must block");

// 3) Kurumsal, Trendyol indirimi dahil
const corp: any = { ...individual, shipmentPackageId: 55, commercial: true, packageTotalPrice: 1224.8,
  invoiceAddress: { company: "ACME LTD ŞTİ", taxNumber: "1234567890", taxOffice: "Kadıköy", fullAddress: "x", city: "İstanbul", district: "Kadıköy" } };
const c = mapTrendyolPackageToInvoice(corp, { companyId: "c1" });
assert.deepEqual(c.blockingIssues, []);
assert.equal(c.buyerKind, "corporate"); assert.equal(c.invoice.grandTotal, 1224.8); assert.equal(c.contact.taxOffice, "Kadıköy");

// 4) TCKN algoritması ve deterministik ETTN
assert.equal(isValidTckn("10000000146"), true);
assert.equal(isValidTckn("12345678901"), false);
assert.equal(deterministicEttn("c1", "55"), deterministicEttn("c1", "55"));
assert.notEqual(deterministicEttn("c1", "55"), deterministicEttn("c1", "55", 1));
assert.match(deterministicEttn("c1", "55"), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

// 5) Mikro ihracat ve iptal
assert.ok(mapTrendyolPackageToInvoice({ ...individual, micro: true }, { companyId: "c1" }).blockingIssues.length > 0);
assert.ok(mapTrendyolPackageToInvoice({ ...individual, status: "Cancelled" }, { companyId: "c1" }).blockingIssues.length > 0);
console.log("MAPPER OK");

// ---------- 2) Faturalama motoru ----------
process.env.TRENDYOL_SECRET_KEY = "test-key-123";
process.env.TRENDYOL_STORE_PATH = path.join(os.tmpdir(), `trendyol-selftest-${Date.now()}.json`);
try { fs.unlinkSync(process.env.TRENDYOL_STORE_PATH); } catch {}
const { TrendyolStore } = await import(`../src/services/trendyol/trendyolStore.ts`);
const { TrendyolInvoicer } = await import(`../src/services/trendyol/trendyolInvoicer.ts`);
const { validateMysoftInvoiceOutboxPayload, MysoftPayloadValidationError } = await import(`../src/services/mysoftInvoicePayload.ts`);
const { MysoftApiError } = await import(`../src/services/mysoftEdocument.ts`);

// ---- Sahte Trendyol ----
const pkgs: Record<string, any> = {
  "1001": { shipmentPackageId: 1001, orderNumber: "A1", status: "Picking", commercial: false, currencyCode: "TRY", orderDate: Date.now(),
    identityNumber: "11111111111", invoiceAddress: { fullName: "Ayşe Yılmaz", fullAddress: "Moda Cad. 5", city: "İstanbul", district: "Kadıköy" },
    packageTotalPrice: 750, lines: [{ lineId: 9, quantity: 1, productName: "Tişört", stockCode: "TS1", lineUnitPrice: 850, lineGrossAmount: 850, lineSellerDiscount: 100, lineTyDiscount: 0, vatRate: 10 }] },
  "1002": { shipmentPackageId: 1002, orderNumber: "A2", status: "Shipped", commercial: true, currencyCode: "TRY", orderDate: Date.now(),
    invoiceAddress: { company: "ACME LTD", taxNumber: "1234567890", taxOffice: "Kadıköy", fullAddress: "x", city: "İstanbul", district: "Kadıköy" },
    packageTotalPrice: 120, lines: [{ lineId: 1, quantity: 1, productName: "Kalem", lineUnitPrice: 120, lineGrossAmount: 120, vatRate: 20 }] },
  "1003": { shipmentPackageId: 1003, orderNumber: "A3", status: "Delivered", commercial: false, currencyCode: "TRY", orderDate: Date.now(),
    invoiceLink: "https://x/inv.pdf", invoiceAddress: { fullName: "B" }, packageTotalPrice: 10, lines: [{ quantity: 1, lineGrossAmount: 10, vatRate: 20 }] },
};
let uploads: any[] = []; let failUpload = false;
(globalThis as any).fetch = async (url: any, init: any) => {
  const u = new URL(String(url));
  assert.ok(init.headers["User-Agent"].startsWith("555 - "), "User-Agent");
  assert.ok(init.headers.Authorization.startsWith("Basic "));
  if (u.pathname.endsWith("/v2/orders")) {
    const ids = u.searchParams.get("shipmentPackageIds");
    const content = ids ? [pkgs[ids]].filter(Boolean) : Object.values(pkgs);
    return new Response(JSON.stringify({ totalElements: content.length, totalPages: 1, page: 0, size: 200, content }), { status: 200 });
  }
  if (u.pathname.endsWith("/seller-invoice-file")) {
    if (failUpload) return new Response(JSON.stringify({ errors: [{ message: "geçici" }] }), { status: 500 });
    const f = init.body as FormData; uploads.push({ id: f.get("shipmentPackageId"), file: f.get("file") });
    return new Response("", { status: 201 });
  }
  throw new Error("beklenmeyen url " + u);
};

// ---- Sahte Mysoft ----
const issued = new Map<string, any>(); let createCalls = 0; let throwAfterCreate = false;
const pdf = Buffer.from("%PDF-1.4 test");
const mysoft: any = {
  config: { mockMode: false },
  async createOutgoing(payload: any) {
    createCalls++;
    const v = validateMysoftInvoiceOutboxPayload(payload, { requireTenantIdentifier: true, autoRepair: true });
    if (!v.valid) throw new MysoftPayloadValidationError(v.summary, v.errors, v.nullGuard);
    if (issued.has(payload.ettn)) throw new MysoftApiError(400, "ETTN daha önce kullanılmış");
    const docNo = (payload.eDocumentType === "EFATURA" ? "EFA" : "EAR") + "2026" + String(issued.size + 1).padStart(9, "0");
    issued.set(payload.ettn, { ...payload, docNo });
    if (throwAfterCreate) { throwAfterCreate = false; throw new Error("zaman aşımı"); }
    return { succeed: true, data: { invoiceETTN: payload.ettn, docNo } };
  },
  async getOutgoingModel(ettn: string) { const p = issued.get(ettn); if (!p) throw new MysoftApiError(404, "yok"); return { data: { ettn, docNo: p.docNo } }; },
  async getOutgoingPdf() { return { succeed: true, data: pdf.toString("base64") }; },
  async getGibAccountModel(vkn: string) { return vkn === "1234567890" ? { data: { eInvoiceStartDate: "2020-01-01", gibAccountAliasList: [{ alias: "urn:mail:defaultpk@acme.com", role: 1 }] } } : { data: null }; },
};

const store = new TrendyolStore();
await store.upsertConnection({ companyId: "c1", ownerUid: "u1", sellerId: "555", apiKey: "k", apiSecret: "s",
  secretKey: "company-c1-custom-trendyol-secret-key-48chars-0001",
  settings: { autoInvoice: true, startFrom: Date.now() - 86400000 },
  companySettingsSnapshot: { companyName: "Satıcı", companyTitle: "Satıcı Ltd", taxNumber: "9876543210", taxOffice: "Şişli", address: "a", city: "İstanbul", phone: "", email: "", website: "", currency: "TRY" } as any });
assert.equal(store.hasCustomSecretKey("c1"), true);
assert.equal(store.getMaskedSecretKey("c1"), "••••0001");
assert.equal(store.getCredentials(store.getConnection("c1")!).apiSecret, "s");
// Anahtar rotasyonu: apiKey ve apiSecret tekrar gönderilmese bile yeni TRENDYOL_SECRET_KEY ile yeniden şifrelenir
await store.upsertConnection({ companyId: "c1", ownerUid: "u1", sellerId: "555",
  secretKey: "company-c1-rotated-trendyol-secret-key-48chars-9999",
  settings: { autoInvoice: true } });
assert.equal(store.getMaskedSecretKey("c1"), "••••9999");
assert.equal(store.getCredentials(store.getConnection("c1")!).apiKey, "k");
assert.equal(store.getCredentials(store.getConnection("c1")!).apiSecret, "s");
assert.ok(!fs.readFileSync(process.env.TRENDYOL_STORE_PATH!, "utf8").includes('"s"'), "secret plaintext olmamalı");

const inv = new TrendyolInvoicer({ store, mysoft, resolveCompanySettings: () => null });

// 1) Otomatik tur
const r1 = await inv.syncConnection("c1");
console.log(r1.summary);
assert.equal(createCalls, 2);
assert.equal(uploads.length, 2);
const ear = [...issued.values()].find((p) => p.eDocumentType === "EARSIVFATURA");
const efa = [...issued.values()].find((p) => p.eDocumentType === "EFATURA");
assert.ok(ear && efa);
assert.equal(efa.pkAlias, "urn:mail:defaultpk@acme.com");
assert.equal(ear.invoiceCalculation.payableAmount, 750);
assert.equal(ear.invoiceAccount.vknTckn, "11111111111");
assert.ok(!JSON.stringify(ear.notes).includes("Ankara"), "sahte şube adresi olmamalı");
if (process.env.VERBOSE) console.log("EARSIV payload özet:", JSON.stringify({ notes: ear.notes, acc: ear.invoiceAccount, det: ear.invoiceDetail, calc: ear.invoiceCalculation, tenant: ear.tenantIdentifierNumber, orderNo: ear.orderNo, orderDate: ear.orderDate }, null, 1));
assert.equal(store.getEntry("c1", "1003"), null); // Trendyol.da faturası olan pakete hiç dokunulmaz

// 2) Tekrar tur → yeni kesim olmamalı
await inv.syncConnection("c1");
assert.equal(createCalls, 2, "çift kesim yok");

// 3) Yükleme hatası → invoiced kalır, sonra yalnızca iletim tekrarlanır
pkgs["1004"] = { ...pkgs["1001"], shipmentPackageId: 1004, orderNumber: "A4" };
failUpload = true;
const r3 = await inv.invoicePackage("c1", "1004");
assert.equal(r3.state, "invoiced"); assert.equal(createCalls, 3);
failUpload = false;
await inv.syncConnection("c1");
assert.equal(store.getEntry("c1", "1004")!.state, "delivered"); assert.equal(createCalls, 3);

// 4) Mysoft zaman aşımı ama fatura oluştu → aynı ETTN bulunur, çift kesim yok
pkgs["1005"] = { ...pkgs["1001"], shipmentPackageId: 1005, orderNumber: "A5" };
throwAfterCreate = true;
const r4 = await inv.invoicePackage("c1", "1005");
assert.equal(r4.state, "delivered"); assert.equal(createCalls, 4);

// 5) Mock modda gerçek kesim reddedilmeli
mysoft.config.mockMode = true;
pkgs["1006"] = { ...pkgs["1001"], shipmentPackageId: 1006, orderNumber: "A6" };
await assert.rejects(inv.invoicePackage("c1", "1006"), /mock/);
mysoft.config.mockMode = false;

// 6) Tutmayan paket → inceleme, kesim yok
pkgs["1007"] = { ...pkgs["1001"], shipmentPackageId: 1007, orderNumber: "A7", packageTotalPrice: 1 };
const r6 = await inv.invoicePackage("c1", "1007");
assert.equal(r6.state, "needs_review"); assert.equal(createCalls, 4);
console.log("INVOICER OK", r6.message);

try { fs.unlinkSync(process.env.TRENDYOL_STORE_PATH!); } catch {}
try { fs.unlinkSync(`${process.env.TRENDYOL_STORE_PATH!}.keys.json`); } catch {}
