import assert from "node:assert/strict";
import express from "express";
import { createTgoMealRouter } from "../src/services/tgoMeal.ts";
import { mapTgoPackage } from "../src/services/tgoMealClient.ts";

const seen: URL[] = [];
const example = {
  id: "a".repeat(64),
  orderId: "1000000017209",
  orderNumber: "123",
  totalPrice: 145,
  packageCreationDate: Date.now(),
  packageStatus: "Created",
  lines: [{ productId: 1, name: "Yemek", unitSellingPrice: 145, items: [{ lineItemId: 1 }] }],
};
const fakeFetch: typeof fetch = async (input, init) => {
  const url = new URL(String(input));
  seen.push(url);
  const headers = init?.headers as Record<string, string>;
  assert.match(headers["User-Agent"], /^1234 - /);
  assert.equal(headers["x-executor-user"], "operator@example.com");
  if (url.pathname.endsWith("/packages/invoiced")) {
    const body = JSON.parse(String(init?.body || "{}"));
    assert.equal(typeof body.packageId, "string");
    assert.ok(body.packageId.length > 0);
    assert.ok(Number.isFinite(body.actualDate));
    return Response.json({ message: "Package status updated successfully to invoiced." });
  }
  if (url.pathname.includes("/supplier-invoice-links/4/")) {
    const body = JSON.parse(String(init?.body || "{}"));
    assert.ok(String(body.invoiceLink).startsWith("https://"));
    return Response.json({ message: "Fatura başarıyla gönderildi." }, { status: 201 });
  }
  return Response.json({ content: url.searchParams.get("page") === "0" ? [example] : [], totalPages: 2 });
};

const app = express();
app.use(express.json());
app.use("/api/marketplace/tgo-meal", createTgoMealRouter(fakeFetch));
const server = app.listen(0);
try {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test sunucusu açılamadı");
  const endpoint = `http://127.0.0.1:${address.port}/api/marketplace/tgo-meal/packages`;
  const body = { supplierId: "1234", apiKey: "key", apiSecret: "secret", executorEmail: "operator@example.com" };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.packages.length, 1);
  assert.equal(seen.length, 2);
  assert.equal(seen[0].searchParams.get("size"), "50");
  const mapped = mapTgoPackage(data.packages[0], { supplierId: "1234", commissionRate: 20 } as any);
  assert.equal(mapped.id, `tgo_1234_${example.id}`);
  assert.equal(mapped.tgoPackageId, example.id);
  assert.equal(mapped.tgoOrderId, example.orderId);
  assert.equal(mapped.items[0].quantity, 1);
  assert.equal(mapped.grossTotal, 145);
  assert.equal(mapped.commissionAmount, 0);
  const invalid = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, supplierId: "bad" }),
  });
  assert.equal(invalid.status, 400);

  // Fatura bildirimi: Invoiced + fatura linki
  const notifyEndpoint = `http://127.0.0.1:${address.port}/api/marketplace/tgo-meal/notify-invoiced`;
  seen.length = 0;
  const notified = await fetch(notifyEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      packageId: example.id,
      orderId: example.orderId,
      invoiceLink: "https://fatura.ornek.com/123.pdf",
    }),
  });
  assert.equal(notified.status, 200);
  const notifyData = await notified.json();
  assert.equal(notifyData.statusNotified, true);
  assert.equal(notifyData.linkSent, true);
  assert.equal(seen.length, 2);
  assert.ok(seen[0].pathname.endsWith("/integrator/order/meal/suppliers/1234/packages/invoiced"));
  assert.equal(seen[1].pathname, "/integrator/invoice/meal/suppliers/1234/supplier-invoice-links/4/" + example.orderId);

  // packageId olmadan bildirim → 400
  const missingPackage = await fetch(notifyEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(missingPackage.status, 400);

  // Link varsa orderId zorunlu → 400
  const missingOrder = await fetch(notifyEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, packageId: example.id, invoiceLink: "https://fatura.ornek.com/123.pdf" }),
  });
  assert.equal(missingOrder.status, 400);
  console.log("TGO yemek sipariş testi geçti.");
} finally {
  server.close();
}
