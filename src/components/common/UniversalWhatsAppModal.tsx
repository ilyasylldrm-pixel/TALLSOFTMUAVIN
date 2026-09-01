import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Download,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Globe,
  Zap,
  FileText,
  User,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  QrCode,
} from "lucide-react";
import {
  fetchWhatsAppStatus,
  sendWhatsAppTextApi,
  sendWhatsAppDocumentApi,
  WhatsAppClientStatus,
} from "../../services/whatsappClient";
import { CompanySettings } from "../../types";

export interface QuickTemplateOption {
  id: string;
  label: string;
  templateText: string;
}

export interface UniversalWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentTypeLabel?: string;
  recipientName: string;
  recipientPhone: string;
  defaultMessage: string;
  documentFileName?: string;
  // Function to generate the PDF blob or Base64 on demand
  onGeneratePdf?: () => Promise<{
    blob?: Blob;
    fileBase64?: string;
    fileName: string;
    pdf?: any;
  } | null>;
  companySettings?: CompanySettings | null;
  quickTemplates?: QuickTemplateOption[];
  onSuccess?: () => void;
}

export const UniversalWhatsAppModal: React.FC<UniversalWhatsAppModalProps> = ({
  isOpen,
  onClose,
  title,
  documentTypeLabel = "Resmi Belge",
  recipientName,
  recipientPhone,
  defaultMessage,
  documentFileName = "belge.pdf",
  onGeneratePdf,
  companySettings,
  quickTemplates = [],
  onSuccess,
}) => {
  const [phone, setPhone] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [sendMode, setSendMode] = useState<"direct" | "web" | "native">("direct");
  const [waStatus, setWaStatus] = useState<WhatsAppClientStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    quickTemplates[0]?.id || null
  );

  // Initialize values when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setPhone(recipientPhone || "");
    setMessage(defaultMessage || "");
    setCopied(false);
    setStatusText("");

    setIsLoadingStatus(true);
    fetchWhatsAppStatus()
      .then((status) => {
        setWaStatus(status);
        if (status.status === "connected") {
          setSendMode("direct");
        } else {
          setSendMode("web");
        }
      })
      .catch(() => {
        setSendMode("web");
      })
      .finally(() => {
        setIsLoadingStatus(false);
      });
  }, [isOpen, recipientPhone, defaultMessage]);

  if (!isOpen) return null;

  // Normalize phone number for display & WhatsApp API
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  const handleSelectTemplate = (tpl: QuickTemplateOption) => {
    setActiveTemplateId(tpl.id);
    setMessage(tpl.templateText);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdfOnly = async () => {
    if (!onGeneratePdf) return;
    try {
      setIsSending(true);
      setStatusText("PDF belgesi oluşturuluyor...");
      const result = await onGeneratePdf();
      if (result) {
        if (result.pdf && typeof result.pdf.save === "function") {
          result.pdf.save(result.fileName || documentFileName);
        } else if (result.blob) {
          const url = URL.createObjectURL(result.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.fileName || documentFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setStatusText("✅ PDF başarıyla indirildi.");
      }
    } catch (err: any) {
      alert("PDF indirilemedi: " + (err?.message || "Bilinmeyen hata"));
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (!cleanPhone || cleanPhone.length < 10) {
      alert("Lütfen geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX veya 905XXXXXXXXX).");
      return;
    }

    if (!message.trim()) {
      alert("Lütfen gönderilecek mesaj metnini yazınız.");
      return;
    }

    setIsSending(true);

    try {
      // 1. DIRECT WHATSAPP API (Baileys)
      if (sendMode === "direct") {
        setStatusText("1/2: PDF ve mesaj hazırlanıyor...");

        let base64Doc: string | null = null;
        let actualFileName = documentFileName;

        if (onGeneratePdf) {
          try {
            const pdfRes = await onGeneratePdf();
            if (pdfRes) {
              actualFileName = pdfRes.fileName || documentFileName;
              if (pdfRes.fileBase64) {
                base64Doc = pdfRes.fileBase64;
              } else if (pdfRes.blob) {
                // Convert blob to base64
                base64Doc = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const resStr = reader.result as string;
                    const b64 = resStr.includes(",") ? resStr.split(",")[1] : resStr;
                    resolve(b64);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(pdfRes.blob!);
                });
              }
            }
          } catch (pdfErr) {
            console.warn("PDF oluşturma pas geçildi, sadece metin gönderiliyor:", pdfErr);
          }
        }

        setStatusText("2/2: WhatsApp hattınız üzerinden iletiliyor...");

        let sendResult;
        if (base64Doc) {
          sendResult = await sendWhatsAppDocumentApi({
            phone: cleanPhone,
            fileBase64: base64Doc,
            fileName: actualFileName,
            mimeType: "application/pdf",
            caption: message,
            contactName: recipientName,
          });
        } else {
          sendResult = await sendWhatsAppTextApi(cleanPhone, message, recipientName);
        }

        if (sendResult.success) {
          setStatusText("✅ Mesaj ve PDF başarıyla WhatsApp'tan iletildi!");
          if (onSuccess) onSuccess();
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setStatusText(`⚠️ Gönderim başarısız: ${sendResult.error || "Bilinmeyen hata"}`);
          alert(
            `WhatsApp doğrudan gönderim hatası:\n${sendResult.error || "Bilinmeyen hata"}\n\nDilerseniz 'WhatsApp Web' sekmesini seçerek gönderebilirsiniz.`
          );
        }
        return;
      }

      // 2. WHATSAPP WEB OR MOBILE LINK
      setStatusText("PDF belgesi indiriliyor ve WhatsApp açılıyor...");

      if (onGeneratePdf) {
        try {
          const pdfRes = await onGeneratePdf();
          if (pdfRes) {
            if (pdfRes.pdf && typeof pdfRes.pdf.save === "function") {
              pdfRes.pdf.save(pdfRes.fileName || documentFileName);
            } else if (pdfRes.blob) {
              const url = URL.createObjectURL(pdfRes.blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = pdfRes.fileName || documentFileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }
        } catch (pdfErr) {
          console.warn("PDF indirme pas geçildi:", pdfErr);
        }
      }

      navigator.clipboard.writeText(message);

      let targetWaUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      if (sendMode === "native") {
        targetWaUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      }

      window.open(targetWaUrl, "_blank", "noopener,noreferrer");

      setStatusText("✅ WhatsApp açıldı ve mesaj metni panoya kopyalandı!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("WhatsApp modal gönderme hatası:", err);
      setStatusText(`Hata: ${err?.message || "İşlem tamamlanamadı"}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black shadow-inner">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">{title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {documentTypeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {recipientName ? `Alıcı: ${recipientName}` : "Resmi belge ve mesaj iletimi"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800/90 hover:bg-rose-500/25 hover:text-rose-200 hover:border-rose-400/40 border border-slate-700 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 group"
            title="Pencereyi Kapat"
          >
            <X className="w-4 h-4 text-slate-400 group-hover:text-rose-300 transition-transform group-hover:rotate-90" />
            <span className="font-extrabold">Kapat</span>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* SEND MODE TABS */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSendMode("direct")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                sendMode === "direct"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                  : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Doğrudan API</span>
            </button>

            <button
              type="button"
              onClick={() => setSendMode("web")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                sendMode === "web"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>🌐 WhatsApp Web</span>
            </button>

            <button
              type="button"
              onClick={() => setSendMode("native")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                sendMode === "native"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>📱 Mobil / App</span>
            </button>
          </div>

          {/* CONNECTION STATUS ALERT (IF DIRECT API SELECTED) */}
          {sendMode === "direct" && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                waStatus?.status === "connected"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {waStatus?.status === "connected" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-extrabold">
                    {waStatus?.status === "connected"
                      ? `🟢 WhatsApp Hattınız Bağlı (${waStatus.connectedPhone || waStatus.connectedName || "Aktif"})`
                      : "⚠️ WhatsApp Hattı Henüz Bağlanmadı"}
                  </span>
                  <p className="text-[11px] opacity-85 mt-0.5">
                    {waStatus?.status === "connected"
                      ? "Mesaj ve PDF belgesi doğrudan şirket WhatsApp numaranızdan gönderilecektir."
                      : "Doğrudan gönderim için sol menüden 'WhatsApp İletişim Merkezi' sekmesinden QR okutunuz veya 'WhatsApp Web' sekmesini kullanınız."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RECIPIENT PHONE INPUT */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Alıcı Telefon Numarası:
              </span>
              {recipientName && (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {recipientName}
                </span>
              )}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX veya 905XXXXXXXXX"
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl p-3 font-mono text-xs font-bold text-slate-900 outline-none transition"
            />
          </div>

          {/* QUICK TEMPLATES (IF PROVIDED) */}
          {quickTemplates.length > 1 && (
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Hazır Mesaj Şablonu Seçin:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition cursor-pointer ${
                      activeTemplateId === tpl.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGE TEXTAREA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                WhatsApp Mesaj Metni:
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-slate-500 hover:text-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Kopyalandı
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    <Copy className="w-3 h-3" /> Metni Kopyala
                  </span>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-3 font-sans text-xs leading-relaxed text-slate-900 outline-none transition"
              placeholder="Mesaj metnini buraya yazınız..."
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>*kalın*, _italik_, ~üstü çizili~ WhatsApp formatı desteklenir.</span>
              <span>{message.length} karakter</span>
            </div>
          </div>

          {/* ATTACHED PDF FILE CARD */}
          {onGeneratePdf && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                  PDF
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">{documentFileName}</div>
                  <div className="text-[10px] text-slate-500">
                    {documentTypeLabel} • Resmi Çıktı & Doğrulama Barkodu
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdfOnly}
                disabled={isSending}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition"
              >
                <Download className="w-3 h-3 text-slate-600" />
                <span>PDF İndir</span>
              </button>
            </div>
          )}

          {/* STATUS FEEDBACK BAR */}
          {statusText && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-bold text-xs flex items-center gap-2 animate-fadeIn">
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{statusText}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gönderiliyor...</span>
              </>
            ) : sendMode === "direct" ? (
              <>
                <Zap className="w-4 h-4" />
                <span>⚡ WhatsApp ile Doğrudan Gönder</span>
              </>
            ) : sendMode === "web" ? (
              <>
                <Globe className="w-4 h-4" />
                <span>🌐 WhatsApp Web'de Aç & Gönder</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>📱 WhatsApp Uygulamasında Aç</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
