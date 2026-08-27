import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompanySettings, Contact, Invoice } from "../types";
import { InvoiceLivePreview } from "./InvoiceLivePreview";
import {
  fetchMysoftInvoiceDraftPreview,
  type MysoftInvoiceDraftPreviewResult,
} from "../services/mysoftEDocumentService";
import { Eye, FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";

type PreviewTab = "live" | "mysoft";

export interface InvoiceCreatePreviewPanelProps {
  invoice: Partial<Invoice>;
  companySettings: CompanySettings;
  contact?: Contact;
  /** When false, Mysoft tab is hidden. */
  mysoftEnabled: boolean;
  eDocumentLabel?: string;
  buildMysoftPayload: () => Record<string, unknown> | null;
}

export const InvoiceCreatePreviewPanel: React.FC<InvoiceCreatePreviewPanelProps> = ({
  invoice,
  companySettings,
  contact,
  mysoftEnabled,
  eDocumentLabel = "e-Fatura",
  buildMysoftPayload,
}) => {
  const [tab, setTab] = useState<PreviewTab>("live");
  const [mysoftLoading, setMysoftLoading] = useState(false);
  const [mysoftError, setMysoftError] = useState<string | null>(null);
  const [mysoftPreview, setMysoftPreview] = useState<MysoftInvoiceDraftPreviewResult | null>(
    null,
  );
  const revokeRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearMysoftPreview = useCallback(() => {
    revokeRef.current?.();
    revokeRef.current = null;
    setMysoftPreview(null);
  }, []);

  const loadMysoftPreview = useCallback(
    async (format: "html" | "pdf" = "html") => {
      const payload = buildMysoftPayload();
      if (!payload) {
        setMysoftError("Mysoft önizleme için müşteri ve en az bir kalem gerekli.");
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setMysoftLoading(true);
      setMysoftError(null);
      try {
        clearMysoftPreview();
        const result = await fetchMysoftInvoiceDraftPreview(payload, format, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          result.revoke();
          return;
        }
        revokeRef.current = result.revoke;
        setMysoftPreview(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMysoftError(
          error instanceof Error ? error.message : "Mysoft taslak önizlemesi alınamadı.",
        );
      } finally {
        if (!controller.signal.aborted) setMysoftLoading(false);
      }
    },
    [buildMysoftPayload, clearMysoftPreview],
  );

  useEffect(() => {
    if (!mysoftEnabled) {
      if (tab === "mysoft") setTab("live");
      return;
    }
    if (tab !== "mysoft") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadMysoftPreview("html");
    }, 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tab, mysoftEnabled, invoice, loadMysoftPreview]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      clearMysoftPreview();
    },
    [clearMysoftPreview],
  );

  const liveLabel = useMemo(
    () => (invoice.docKind === "receipt" ? "Fiş önizleme" : "Fatura önizleme"),
    [invoice.docKind],
  );

  return (
    <div className="flex flex-col h-full min-h-[420px] xl:min-h-0 xl:max-h-[calc(94vh-6rem)] border border-slate-200 rounded-xl bg-slate-50/80 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-extrabold text-slate-800">Önizleme</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setTab("live")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              tab === "live"
                ? "bg-white text-purple-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Canlı
          </button>
          {mysoftEnabled && (
            <button
              type="button"
              onClick={() => setTab("mysoft")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                tab === "mysoft"
                  ? "bg-white text-purple-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Mysoft
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === "live" ? (
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <InvoiceLivePreview
              invoice={invoice}
              companySettings={companySettings}
              contact={contact}
              eDocumentLabel={eDocumentLabel}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 p-2 gap-2">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <p className="text-[10px] text-slate-600 leading-snug">
                Portal dizaynınızla resmi taslak ({eDocumentLabel}). GİB&apos;e gönderilmez.
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={mysoftLoading}
                  onClick={() => void loadMysoftPreview("html")}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  HTML
                </button>
                <button
                  type="button"
                  disabled={mysoftLoading}
                  onClick={() => void loadMysoftPreview("pdf")}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  PDF
                </button>
                <button
                  type="button"
                  disabled={mysoftLoading}
                  onClick={() => void loadMysoftPreview(mysoftPreview?.kind === "pdf" ? "pdf" : "html")}
                  className="p-1 rounded-lg text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer disabled:opacity-50"
                  title="Yenile"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${mysoftLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 rounded-lg border border-slate-200 bg-white overflow-hidden relative">
              {mysoftLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-[1px]">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-600">
                    Mysoft taslak hazırlanıyor…
                  </span>
                </div>
              )}
              {mysoftError && !mysoftLoading && (
                <div className="p-4 text-[11px] text-rose-700 font-medium">{mysoftError}</div>
              )}
              {!mysoftError && mysoftPreview && (
                <iframe
                  title="Mysoft fatura taslak önizleme"
                  src={mysoftPreview.objectUrl}
                  className="w-full h-full min-h-[360px] border-0 bg-white"
                />
              )}
              {!mysoftError && !mysoftPreview && !mysoftLoading && (
                <div className="p-6 text-center text-[11px] text-slate-500">
                  {liveLabel} verileri Mysoft&apos;a gönderilerek portal şablonu yüklenir.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
