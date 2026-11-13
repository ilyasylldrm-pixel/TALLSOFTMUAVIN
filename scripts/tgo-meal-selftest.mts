import assert from "node:assert/strict";
import express from "express";
import { createTgoMealRouter } from "../src/services/tgoMeal.ts";
import { mapTgoPackage } from "../src/services/tgoMealClient.ts";

const seen: URL[] = [];
const example = {
  id: "a".repeat(64),
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
  assert.equal(mapped.items[0].quantity, 1);
  assert.equal(mapped.grossTotal, 145);
  assert.equal(mapped.commissionAmount, 0);
  const invalid = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, supplierId: "bad" }),
  });
  assert.equal(invalid.status, 400);
  console.log("TGO yemek sipariş testi geçti.");
} finally {
  server.close();
}
