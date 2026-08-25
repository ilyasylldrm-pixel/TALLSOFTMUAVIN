import { Router, Request, Response } from "express";
import {
  MysoftApiError,
  MysoftConfigurationError,
  MysoftEdocumentClient,
  MysoftListRequest,
  MYSOFT_DOCUMENT_OPERATIONS,
  canonicalMysoftDocumentFamily,
  getMysoftConfig,
} from "./mysoftEdocument.ts";
import { normalizeMysoftTenantIdentifier } from "./mysoftTenant.ts";

class InvalidMysoftRequestError extends Error {
  readonly code = "INVALID_REQUEST";
  constructor(message: string) {
    super(message);
    this.name = "InvalidMysoftRequestError";
  }
}

/**
 * Express proxy routes for the Mysoft e-document API.
 *
 * Routes intentionally expose only the invoice operations needed by the
 * E-Belgeler screen; the Mysoft OAuth credentials stay on this server. The
 * route handlers do not log request bodies because UBL/XML payloads can hold
 * personal and financial data.
 */
export function createMysoftRouter(client = new MysoftEdocumentClient(getMysoftConfig())): Router {
  const router = Router();

  const handleError = (error: unknown, res: Response): void => {
    if (error instanceof MysoftConfigurationError) {
      res.status(503).json({
        error: error.message,
        code: error.code,
        configured: false,
        mockMode: client.config.mockMode,
      });
      return;
    }
    if (error instanceof InvalidMysoftRequestError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }
    if (error instanceof MysoftApiError) {
      // Do not leak OAuth responses or secrets; details are intentionally
      // omitted from the public error shape.
      res.status(error.status >= 400 && error.status < 600 ? error.status : 502).json({
        error: error.message,
        code: error.code,
      });
      return;
    }
    console.error("Mysoft e-document request failed:", error instanceof Error ? error.message : error);
    res.status(502).json({ error: "Mysoft e-document service unavailable", code: "MYSOFT_UNAVAILABLE" });
  };

  const run = (handler: (req: Request) => Promise<unknown>) => async (req: Request, res: Response) => {
    try {
      const result = await handler(req);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  };

  const runBinary = (handler: (req: Request) => Promise<unknown>) => async (req: Request, res: Response) => {
    try {
      const result = await handler(req);
      if (
        result &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        "bytes" in result &&
        (result as { bytes?: unknown }).bytes instanceof Uint8Array
      ) {
        const binary = result as { bytes: Uint8Array; contentType?: string };
        res.setHeader("Content-Type", binary.contentType || "application/octet-stream");
        res.send(Buffer.from(binary.bytes));
        return;
      }
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  };

  const textParam = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  };

  const queryText = (req: Request, name: string): string | undefined => textParam(req.query[name]);

  const idFrom = (req: Request): string | undefined => textParam(req.params.invoiceETTN);

  const requireEttn = (req: Request, res: Response): string | undefined => {
    const value = idFrom(req);
    if (!value) {
      res.status(400).json({ error: "invoiceETTN is required", code: "INVALID_REQUEST" });
      return undefined;
    }
    return value;
  };

  const ettnOrThrow = (req: Request): string => {
    const value = idFrom(req);
    if (!value) throw new InvalidMysoftRequestError("invoiceETTN is required");
    return value;
  };

  // Mysoft expects an ISO calendar date (not a locale-formatted date).  Do
  // both a shape and calendar check so values such as 2026-02-31 never reach
  // the upstream API and produce an opaque validation error there.
  const isIsoDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  };

  // Keep page sizes bounded.  A tenant can still page through all records by
  // using afterValue; this guard simply prevents an accidental unbounded
  // request from consuming the proxy's memory or timing out.
  const MAX_LIST_LIMIT = 1_000;

  const listBody = (req: Request, source?: unknown): MysoftListRequest => {
    // Keep the request model aligned with Mysoft's documented schema. Unknown
    // keys are ignored so callers cannot accidentally pass arbitrary data.
    const input = ((source !== undefined ? source : req.body) && typeof (source !== undefined ? source : req.body) === "object"
      ? source !== undefined
        ? source
        : req.body
      : {}) as Record<string, unknown>;
    // Use a string-keyed intermediate object.  Indexing a union of optional
    // property types on MysoftListRequest directly makes TypeScript infer
    // `never` for assignments (number vs string fields), even though the
    // runtime validation below keeps each field type-safe.
    const result: Record<string, unknown> = {};
    const numericFields = [
      "afterValue",
      "limit",
      "cessionStatus",
      "profile",
      "portalInvoiceStatus",
      "archiveStatus",
      "pageSize",
      "pageNumber",
    ] as const;
    const textFields = [
      "tenantIdentifierNumber",
      "startDate",
      "endDate",
      "pkAlias",
      "ettn",
      "docNo",
      "vknTckn",
      "accountName",
      "eDocumentType",
    ];
    numericFields.forEach((key) => {
      const value = input[key];
      const parsed =
        typeof value === "number" && Number.isFinite(value)
          ? value
          : typeof value === "string" && value.trim() && Number.isFinite(Number(value))
            ? Number(value)
            : undefined;
      if (parsed === undefined) return;
      if (key === "limit") {
        // Zero/negative page sizes are not meaningful to the API.  Clamp
        // rather than reject so old clients that sent a large value remain
        // usable while still receiving a bounded page.
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
    // JSON POST callers send a boolean, while the browser-facing GET
    // compatibility route receives query values as strings.  Preserve both
    // forms so `isUseDocDate=true` is not silently dropped before reaching
    // Mysoft.
    if (typeof input.isUseDocDate === "boolean") {
      result.isUseDocDate = input.isUseDocDate;
    } else if (typeof input.isUseDocDate === "string") {
      const normalized = input.isUseDocDate.trim().toLowerCase();
      if (["true", "1", "yes"].includes(normalized)) result.isUseDocDate = true;
      else if (["false", "0", "no"].includes(normalized)) result.isUseDocDate = false;
    }
    const startDate = typeof result.startDate === "string" ? result.startDate : undefined;
    const endDate = typeof result.endDate === "string" ? result.endDate : undefined;
    if (startDate && endDate && startDate > endDate) {
      throw new InvalidMysoftRequestError("startDate must be on or before endDate");
    }
    return result as MysoftListRequest;
  };

  const tenantFrom = (req: Request): string | undefined =>
    normalizeMysoftTenantIdentifier(
      queryText(req, "tenantIdentifierNumber") ||
        textParam((req.body as Record<string, unknown> | undefined)?.tenantIdentifierNumber),
    );

  const familyFrom = (req: Request) =>
    canonicalMysoftDocumentFamily(
      queryText(req, "family") ||
        queryText(req, "documentFamily") ||
        textParam((req.body as Record<string, unknown> | undefined)?.family),
    );

  const isOutgoingDirection = (req: Request): boolean => {
    const direction = (queryText(req, "direction") || "incoming").toLowerCase();
    return direction === "outgoing" || direction === "outbox";
  };

  // Generic, but allowlisted, surface for all supported Mysoft document
  // families.  The operation key is looked up in a static map; it is never
  // appended to a URL.  This makes it possible to add a new documented
  // operation without exposing an arbitrary upstream path/SSRF primitive.
  const runDocumentOperation = (req: Request) => {
    const operation = textParam(req.params.operation)?.toLowerCase();
    if (!operation || !Object.prototype.hasOwnProperty.call(MYSOFT_DOCUMENT_OPERATIONS, operation)) {
      throw new InvalidMysoftRequestError("unsupported Mysoft document operation");
    }
    const rawQuery = req.query as Record<string, unknown>;
    const query: Record<string, string | number | boolean | null | undefined> = {};
    Object.keys(rawQuery).forEach((key) => {
      if (key === "tenantIdentifierNumber") return;
      const value = rawQuery[key];
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") query[key] = value;
    });
    return client.requestDocumentOperation(operation, {
      query,
      body: req.body,
      tenantIdentifierNumber: tenantFrom(req),
    });
  };

  const documentOperationRoute = (req: Request, res: Response) => {
    // PDF/XML download operations can return the client's binary envelope;
    // keep those bytes intact instead of serializing a Uint8Array as JSON.
    const operation = textParam(req.params.operation)?.toLowerCase() || "";
    // Keep the naming convention explicit in the allowlist, but recognise
    // the more descriptive format suffixes used by the complete v8 map too.
    // `...envelope-model` is intentionally excluded: that operation returns a
    // JSON model, whereas `...envelope-xml`/`...xml-envelope` are ZIP files.
    const isBinaryOperation =
      operation.endsWith(".download") ||
      operation.endsWith(".pdf") ||
      operation.endsWith(".html") ||
      operation.endsWith(".xml") ||
      operation.endsWith(".envelope-xml") ||
      operation.endsWith(".xml-envelope") ||
      operation.includes(".pdf-batch");
    const handler = isBinaryOperation
      ? runBinary(runDocumentOperation)
      : run(runDocumentOperation);
    return handler(req, res);
  };

  // This endpoint is safe to expose to a settings screen: it contains no
  // credential values, only whether server-side configuration is present.
  router.get("/status", async (_req, res) => {
    try {
      const identity = await client.getTokenIdentity();
      res.json({ provider: "mysoft", ...client.status, ...(identity ? { identity } : {}) });
    } catch {
      res.json({ provider: "mysoft", ...client.status });
    }
  });

  router.get("/operations/:operation", documentOperationRoute);
  router.post("/operations/:operation", documentOperationRoute);

  // Accountant tenant directory.  These endpoints expose only the firms
  // linked to the server-side OAuth client; credentials and access tokens are
  // never returned to the browser.  `getTenant` is cursor based, so the UI can
  // request another page with afterValue when an account has many taxpayers.
  router.get(
    "/tenants",
    run((req) => {
      const parseNonNegativeInt = (value: unknown): number | undefined => {
        if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.trunc(value));
        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
          return Math.max(0, Math.trunc(Number(value)));
        }
        return undefined;
      };
      const afterValue = parseNonNegativeInt(req.query.afterValue);
      const rawLimit = parseNonNegativeInt(req.query.limit);
      const limit = rawLimit === undefined ? undefined : Math.max(1, Math.min(MAX_LIST_LIMIT, rawLimit));
      return client.listTenants({ afterValue, limit });
    }),
  );
  router.get(
    "/tenants/:identifierNumber",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      return client.getTenantWithIdentifier(identifierNumber);
    }),
  );
  router.get(
    "/tenants/:identifierNumber/info",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      return client.getTenantInfo(identifierNumber);
    }),
  );
  /** Portal defaults: approved XSLT name + document-number prefix for e-fatura/e-arşiv. */
  router.get(
    "/tenants/:identifierNumber/invoice-design",
    run((req) => {
      const identifierNumber = textParam(req.params.identifierNumber);
      if (!identifierNumber) throw new InvalidMysoftRequestError("identifierNumber is required");
      const eDocumentType =
        queryText(req, "eDocumentType") || queryText(req, "type") || "EFATURA";
      const isInternetSales = queryText(req, "isInternetSales") === "true";
      return client.resolveInvoiceDesignDefaults({
        vknTckn: identifierNumber,
        eDocumentType,
        isInternetSales,
      });
    }),
  );

  // Browser-facing compatibility surface.  The UI intentionally talks to a
  // single /e-documents resource while the server-side routes below retain a
  // direction-specific form for integrations and explicit API consumers.
  router.get(
    "/e-documents",
    run((req) => {
      const filters = listBody(req, req.query);
      const tenantIdentifierNumber = tenantFrom(req) || filters.tenantIdentifierNumber;
      const family = familyFrom(req);
      if (family === "despatch") {
        return isOutgoingDirection(req)
          ? client.listDespatchOutgoing({ ...filters, tenantIdentifierNumber })
          : queryText(req, "paging") === "true" ||
              filters.pageNumber !== undefined ||
              filters.pageSize !== undefined
            ? client.listDespatchIncomingPaging({ ...filters, tenantIdentifierNumber })
            : client.listDespatchIncoming({ ...filters, tenantIdentifierNumber });
      }
      return isOutgoingDirection(req)
        ? client.listOutgoing({ ...filters, tenantIdentifierNumber })
        : queryText(req, "paging") === "true" ||
            filters.pageNumber !== undefined ||
            filters.pageSize !== undefined
          ? client.listIncomingPaging({ ...filters, tenantIdentifierNumber })
          : client.listIncoming({ ...filters, tenantIdentifierNumber });
    }),
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
          return format === "xml"
            ? client.getDespatchOutgoingXml(invoiceETTN, tenantIdentifierNumber)
            : client.getDespatchOutgoingPdf(invoiceETTN, tenantIdentifierNumber);
        }
        return format === "xml"
          ? client.getDespatchIncomingXml(invoiceETTN, tenantIdentifierNumber)
          : client.getDespatchIncomingPdf(invoiceETTN, tenantIdentifierNumber);
      }
      if (direction === "outgoing" || direction === "outbox") {
        return format === "xml"
          ? client.getOutgoingXml(invoiceETTN, tenantIdentifierNumber)
          : client.getOutgoingPdf(invoiceETTN, tenantIdentifierNumber);
      }
      // If direction is omitted, try the inbox first and then the outbox.  A
      // caller can avoid the second request by passing direction=outgoing.
      try {
        return format === "xml"
          ? await client.getIncomingXml(invoiceETTN, tenantIdentifierNumber)
          : await client.getIncomingPdf(invoiceETTN, tenantIdentifierNumber);
      } catch (error) {
        if (!(error instanceof MysoftApiError) || error.status < 400 || error.status >= 500) throw error;
        return format === "xml"
          ? client.getOutgoingXml(invoiceETTN, tenantIdentifierNumber)
          : client.getOutgoingPdf(invoiceETTN, tenantIdentifierNumber);
      }
    }),
  );
  router.get(
    "/e-documents/:invoiceETTN/status",
    run(async (req) => {
      const invoiceETTN = ettnOrThrow(req);
      const direction = (queryText(req, "direction") || "incoming").toLowerCase();
      const tenantIdentifierNumber = tenantFrom(req);
      if (familyFrom(req) === "despatch") {
        return direction === "outgoing" || direction === "outbox"
          ? client.getDespatchOutgoingStatus(invoiceETTN, tenantIdentifierNumber)
          : client.getDespatchIncomingStatus(invoiceETTN, tenantIdentifierNumber);
      }
      if (direction === "outgoing" || direction === "outbox") {
        return client.getOutgoingStatus(invoiceETTN, tenantIdentifierNumber);
      }
      // Keep the generic browser-facing route useful for callers that only
      // have an ETTN.  An inbox miss is the same 4xx-shaped response used by
      // the model/download compatibility routes, so safely try outbox next.
      try {
        return await client.getIncomingStatus(invoiceETTN, tenantIdentifierNumber);
      } catch (error) {
        if (!(error instanceof MysoftApiError) || error.status < 400 || error.status >= 500) throw error;
        return client.getOutgoingStatus(invoiceETTN, tenantIdentifierNumber);
      }
    }),
  );
  router.get(
    "/e-documents/:invoiceETTN",
    run(async (req) => {
      const invoiceETTN = ettnOrThrow(req);
      const direction = (queryText(req, "direction") || "incoming").toLowerCase();
      const tenantIdentifierNumber = tenantFrom(req);
      if (familyFrom(req) === "despatch") {
        return direction === "outgoing" || direction === "outbox"
          ? client.getDespatchOutgoingStatus(invoiceETTN, tenantIdentifierNumber)
          : client.getDespatchIncomingModel(invoiceETTN, tenantIdentifierNumber);
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
    }),
  );
  router.post(
    "/e-documents/:invoiceETTN/accept",
    run((req) => {
      if (familyFrom(req) === "despatch") {
        throw new InvalidMysoftRequestError("e-İrsaliye için fatura kabul işlemi yok");
      }
      return client.acceptIncoming(ettnOrThrow(req), tenantFrom(req));
    }),
  );
  router.post(
    "/e-documents/:invoiceETTN/acknowledge",
    run((req) =>
      familyFrom(req) === "despatch"
        ? client.acknowledgeDespatchIncoming(ettnOrThrow(req), tenantFrom(req))
        : client.acknowledgeIncoming(ettnOrThrow(req), tenantFrom(req)),
    ),
  );
  router.post(
    "/e-documents/:invoiceETTN/deny",
    run((req) => {
      if (familyFrom(req) === "despatch") {
        throw new InvalidMysoftRequestError("e-İrsaliye için fatura ret işlemi yok");
      }
      const reason = textParam((req.body as Record<string, unknown> | undefined)?.rejectReason);
      if (!reason) throw new InvalidMysoftRequestError("rejectReason is required");
      return client.rejectIncoming(ettnOrThrow(req), reason, tenantFrom(req));
    }),
  );
  router.post(
    "/e-documents/:invoiceETTN/cancel",
    run((req) => {
      const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
      const options = {
        cancelDate: textParam(body.cancelDate),
        cancelType: textParam(body.cancelType),
        cancelNote: textParam(body.cancelNote),
        tenantIdentifierNumber: tenantFrom(req),
      };
      return client.cancelOutgoing(ettnOrThrow(req), options);
    }),
  );
  router.post(
    "/e-documents/:invoiceETTN/send-draft",
    run((req) => {
      const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
      const ettn = textParam(body.ettn) || ettnOrThrow(req);
      const payload: Record<string, unknown> = { ettn };
      ["prefix", "numeratorSetCode", "connectorGuid", "tenantIdentifierNumber"].forEach((key) => {
        const value = textParam(body[key]);
        if (value) payload[key] = value;
      });
      return client.sendOutgoingDraft(payload);
    }),
  );
  router.post(
    "/e-documents/outgoing",
    run((req) => client.createOutgoing(req.body)),
  );
  router.post(
    "/e-documents/outgoing/ubl",
    run((req) => client.createOutgoingWithUblXml(req.body)),
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
  router.post("/outgoing/ubl", run((req) => client.createOutgoingWithUblXml(req.body)));

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

/** Build a router on demand after environment loading (for example after
 * `dotenv.config()` in server.ts).  Keeping construction lazy prevents a
 * module import from freezing an empty process.env into the client. */
export function getMysoftRouter(): Router {
  return createMysoftRouter();
}
