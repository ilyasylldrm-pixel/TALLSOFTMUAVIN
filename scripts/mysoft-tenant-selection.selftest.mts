import assert from "node:assert/strict";
import { selectMysoftTenantIdentifier } from "../src/utils/mysoftTenantSelection.ts";

const settings = { tenantIdentifierNumber: "37756832708" };

assert.equal(
  selectMysoftTenantIdentifier({ taxNumber: "12345678901" }, settings),
  "12345678901",
);
assert.equal(
  selectMysoftTenantIdentifier(
    { tenantIdentifierNumber: "invalid", taxNumber: "12345678901" },
    settings,
  ),
  "12345678901",
);
assert.equal(selectMysoftTenantIdentifier({ taxNumber: "" }, settings), undefined);
assert.equal(selectMysoftTenantIdentifier(undefined, settings), "37756832708");

console.log("Mysoft tenant selection OK");
