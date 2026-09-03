import React, { useState, useEffect } from "react";
import {
  Mail,
  X,
  FileText,
  Download,
  Copy,
  Check,
  Share2,
  AlertCircle,
  Building2,
  Paperclip,
  Send,
  Sparkles,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { Contact } from "../types";

export interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultEmail?: string;
  defaultRecipientName?: string;
  defaultSubject?: string;
  defaultBody?: string;
  filename?: string;
  getPdfBlob?: () => Promise<{ blob: Blob; fileName: string; pdf?: any } | null>;
  contacts?: Contact[];
  documentSummary?: { label: string; value: string }[];
  companyName?: string;
}

export const EmailExportModal: React.FC<EmailExportModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultEmail = "",
  defaultRecipientName = "",
  defaultSubject = "",
  defaultBody = "",
  filename = "belge.pdf",
  getPdfBlob,
  contacts = [],
  documentSummary = [],
  companyName = "Ön Muhasebe Yönetim Sistemi",
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [recipientName, setRecipientName] = useState(defaultRecipientName);
  const [subject, setSubject] = useState(defaultSubject);
  const [messageBody, setMessageBody] = useState(defaultBody);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "info" | "warning"; text: string } | null>(null);

  // Sync initial state when modal opens or defaults change
  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(defaultEmail || "");
      setRecipientName(defaultRecipientName || "");
      
      const comp = companyName || "Firma";
      const targetName = defaultRecipientName ? `(${defaultRecipientName})` : "";
      const initialSubj = defaultSubject || `${title} - ${comp} ${targetName}`.trim();
      setSubject(initialSubj);

      if (defaultBody) {
        setMessageBody(defaultBody);
      } else {
        const summaryText = documentSummary.length > 0
          ? "\n\n📊 ÖZET BİLGİLER:\n" + documentSummary.map(s => `• ${s.label}: ${s.value}`).join("\n")
          : "";

        const generatedBody = `Sayın ${defaultRecipientName || "Yetkili"},\n\n${comp} firmamıza ait "${title}" belgesi tanzim edilmiş olup, ekte PDF formatında ("${filename}") bilgilerinize sunulmuştur.${summaryText}\n\nİşbu evrakı incelemenizi rica eder, mutabakat ve sorularınız için bizimle iletişime geçebileceğinizi bildiririz.\n\nİyi çalışmalar dileriz.\n${comp} • Mali İşler & Muhasebe Birimi`;
        setMessageBody(generatedBody);
      }

      setStatusMessage(null);
      setCopiedText(false);
    }
  }, [isOpen, defaultEmail, defaultRecipientName, defaultSubject, defaultBody, filename, title, companyName, documentSummary]);

  if (!isOpen) return null;

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleSelectContact = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setRecipientName(contact.name);
      if (contact.email) {
        setRecipientEmail(contact.email);
      }
      const comp = companyName || "Firma";
      setSubject(`${title} - ${comp} (${contact.name})`);
    }
  };

  const handleDownloadPDFOnly = async () => {
    if (!getPdfBlob) {
      alert("PDF oluşturma işlevi bulunamadı.");
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage({ type: "info", text: "PDF belgesi hazırlanıyor ve indiriliyor..." });
      const res = await getPdfBlob();
      if (res) {
        if (res.pdf && typeof res.pdf.save === "function") {
          res.pdf.save(res.fileName || filename);
        } else {
          const url = URL.createObjectURL(res.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = res.fileName || filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setStatusMessage({ type: "success", text: `✅ PDF belgesi ("${res.fileName || filename}") başarıyla cihazınıza indirildi.` });
      }
    } catch (err) {
      console.error("PDF indirme hatası:", err);
      setStatusMessage({ type: "warning", text: "PDF oluşturulurken bir hata oluştu." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMailto = async () => {
    if (!recipientEmail.trim() || !isValidEmail(recipientEmail)) {
      alert("Lütfen geçerli bir alıcı e-posta adresi giriniz.");
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage({ type: "info", text: "PDF belgesi hazırlanıyor ve E-Posta istemcisi açılıyor..." });

      let downloadedFileName = filename;

      // 1. Generate & download PDF to user's computer so they can attach it easily
      if (getPdfBlob) {
        const res = await getPdfBlob();
        if (res) {
          downloadedFileName = res.fileName || filename;
          if (res.pdf && typeof res.pdf.save === "function") {
            res.pdf.save(downloadedFileName);
          } else {
            const url = URL.createObjectURL(res.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadedFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
      }

      // 2. Format mailto link
      const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(messageBody)}`;

      // 3. Trigger mail client
      window.location.href = mailtoUrl;

      setStatusMessage({
        type: "success",
        text: `✅ E-Posta istemciniz (Outlook/Gmail/Thunderbird) başlatıldı ve PDF belgesi ("${downloadedFileName}") indirildi. Açılan e-postaya indirilen PDF dosyasını ekleyerek gönderebilirsiniz.`,
      });
    } catch (err) {
      console.error("E-Posta gönderme hatası:", err);
      setStatusMessage({ type: "warning", text: "E-Posta istemcisi başlatılırken bir hata oluştu." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNativeShare = async () => {
    if (!recipientEmail.trim() || !isValidEmail(recipientEmail)) {
      alert("Lütfen geçerli bir alıcı e-posta adresi giriniz.");
      return;
    }

    if (!getPdfBlob) {
      handleSendMailto();
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage({ type: "info", text: "PDF belgesi hazırlanıyor..." });

      const res = await getPdfBlob();
      if (!res) {
        alert("PDF oluşturulamadı.");
        setIsProcessing(false);
        return;
      }

      const pdfFile = new File([res.blob], res.fileName || filename, { type: "application/pdf" });

      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: subject,
            text: messageBody,
            files: [pdfFile],
          });
          setStatusMessage({ type: "success", text: "✅ Belge sistem paylaşım menüsü üzerinden başarıyla iletildi." });
          setIsProcessing(false);
          return;
        } catch (shareErr: any) {
          if (shareErr.name !== "AbortError") {
            console.warn("Native Share hatası, Mailto bağlantısına geçiliyor:", shareErr);
          }
        }
      }

      // Fallback if not supported or cancelled
      handleSendMailto();
    } catch (err) {
      console.error("Paylaşım hatası:", err);
      handleSendMailto();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyClipboard = () => {
    const fullText = `Kime: ${recipientEmail}\nKonu: ${subject}\n\n${messageBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <DetailPageLayout
      title="E-Posta ile Belge Gönder"
      subtitle={`${title} • PDF Eki ile Resmi Gönderim`}
      breadcrumbs={[
        { label: "Belgeler", onClick: onClose },
        { label: "E-Posta Gönder", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-xl">
          E-POSTA PAYLAŞIMI
        </span>
      }
      headerIcon={<Mail className="w-5 h-5 text-indigo-600" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSendMailto}
            disabled={isProcessing || !recipientEmail || !isValidEmail(recipientEmail)}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{isProcessing ? "Hazırlanıyor..." : "E-Posta İstemcisinde Aç"}</span>
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-3xl shadow-sm border border-indigo-200/80 max-w-2xl mx-auto overflow-hidden">

        {/* 2. Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Quick Contact Selector if contacts list provided */}
          {contacts.length > 0 && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Kayıtlı Cari Hesap Seçin (Otomatik Doldur)
              </label>
              <select
                onChange={(e) => handleSelectContact(e.target.value)}
                defaultValue=""
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="" disabled>
                  Cari Seçerek E-Posta Adresini Getirin...
                </option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyTitle ? `(${c.companyTitle})` : ""} - {c.email || "E-Posta Tanımsız"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipient Email & Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold">
                  Alıcı E-Posta Adresi <span className="text-rose-500">*</span>
                </label>
                {recipientEmail && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isValidEmail(recipientEmail)
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isValidEmail(recipientEmail) ? "✓ Geçerli Adres" : "Geçersiz Format"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  className={`w-full font-medium border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 ${
                    recipientEmail && !isValidEmail(recipientEmail)
                      ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/40"
                      : "border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  }`}
                />
              </div>
              {!recipientEmail && (
                <p className="text-[10px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  Cari hesabın kayıtlı e-posta adresi bulunamadı, lütfen e-posta girin.
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Alıcı Ünvanı / Cari Adı
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Örn: ABC Ticaret A.Ş."
                className="w-full font-medium border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              E-Posta Konu Başlığı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="E-Posta Konusu"
              className="w-full font-semibold border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Attachment Box Banner */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-950 text-xs truncate">
                    {filename.endsWith(".pdf") ? filename : `${filename}.pdf`}
                  </span>
                  <span className="bg-indigo-200/80 text-indigo-900 font-extrabold text-[10px] px-1.5 py-0.2 rounded">
                    PDF Eki
                  </span>
                </div>
                <p className="text-[10px] text-indigo-700">
                  {title} belgesi Türkçe karakter ve A4 formatı ile hazırlandı.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDFOnly}
              disabled={isProcessing}
              className="bg-white hover:bg-slate-100 text-indigo-900 border border-indigo-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              title="PDF Dosyasını Bilgisayara İndir"
            >
              <Download className="w-3.5 h-3.5 text-indigo-700" />
              <span>PDF İndir</span>
            </button>
          </div>

          {/* Message Body Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-bold">
                E-Posta Mesaj Metni (Taslak)
              </label>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Metin Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Metni Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full font-mono text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : statusMessage.type === "warning"
                  ? "bg-rose-50 border-rose-300 text-rose-900"
                  : "bg-blue-50 border-blue-300 text-blue-900"
              }`}
            >
              {statusMessage.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === "warning" ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
              )}
              <p className="font-medium leading-normal">{statusMessage.text}</p>
            </div>
          )}
        </div>

        {/* 3. Modal Bottom Action Bar */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 shrink-0 flex flex-wrap items-center justify-between gap-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            İptal
          </button>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isProcessing || !recipientEmail || !isValidEmail(recipientEmail)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 shadow-2xs"
                title="Sistem Paylaşım Menüsü / Doğrudan Dosya Eki ile Paylaş"
              >
                <Share2 className="w-4 h-4 text-purple-700" />
                <span>Sistemle Paylaş</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSendMailto}
              disabled={isProcessing || !recipientEmail || !isValidEmail(recipientEmail)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isProcessing ? "Hazırlanıyor..." : "E-Posta İstemcisi ile Gönder"}</span>
            </button>
          </div>
        </div>
      </div>
    </DetailPageLayout>
  );
};
