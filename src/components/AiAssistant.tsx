import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Check, ArrowRight, CornerDownLeft, Loader2 } from "lucide-react";
import { Contact, Invoice, Account, Transaction } from "../types";

interface AiAssistantProps {
  contacts: Contact[];
  invoices: Invoice[];
  accounts: Account[];
  transactions: Transaction[];
  products?: any[];
  quotes?: any[];
  orders?: any[];
  waybills?: any[];
  cheques?: any[];
  promissoryNotes?: any[];
  employees?: any[];
  onAddInvoice: (inv: Invoice) => void;
  onAddTransaction: (tx: Transaction) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  contacts,
  invoices,
  accounts,
  transactions,
  onAddInvoice,
  onAddTransaction,
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_1",
      sender: "ai",
      text: `Merhaba! Ben **Muavin AI Akıllı Finans Asistanınız**. 
Bana doğal dilde sorular sorabilir veya doğrudan komut verebilirsiniz:

• *"Bu ayki kar-zarar ve KDV durumum nedir?"*
• *"Ahmet Yılmaz'a 12.000 TL + KDV yazılım faturası kes"*
• *"Garanti bankasından 3.500 TL internet ve elektrik gideri kaydet"*`,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userText = inputPrompt;
    setInputPrompt("");

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const contextData = {
        toplamCariSayisi: contacts.length,
        toplamNakit: accounts.reduce((s, a) => s + a.balance, 0),
        vadesiGecenFaturaSayisi: invoices.filter((i) => i.status === "overdue").length,
        sonKasaIslemSayisi: transactions.length,
      };

      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          contextData,
        }),
      });

      const data = await response.json();

      let replyText = data.result;
      if (!response.ok || !replyText) {
        replyText = data.error || "Yapay zeka servisleri şu anda yoğunluk yaşıyor. Lütfen birkaç saniye sonra tekrar deneyiniz.";
      }

      const aiMsg: ChatMessage = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "ai",
          text: "Üzgünüm, yanıt oluşturulurken bir bağlantı hatası meydana geldi.",
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#5a2ed1] via-[#8252f6] to-[#5a2ed1] rounded-2xl p-6 text-white shadow-xl border border-[#9b72f8] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#EF7D2C]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">AI Muavin Asistanı</h2>
            <p className="text-xs text-purple-100 mt-0.5">
              Doğal dilde finansal analizler, otomatik fatura taslağı ve akıllı muhasebe yanıtları.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-[#18191c] rounded-2xl border border-[#26282d] shadow-xs flex flex-col h-[520px]">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === "user"
                    ? "bg-[#26282d] text-slate-200 border border-[#32353c]"
                    : "bg-[#8252F6] text-[#EF7D2C] shadow-sm border border-[#703EE5]"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#8252F6] text-white font-medium border border-[#703EE5]"
                    : "bg-[#141517] text-slate-100 font-normal border border-[#26282d]"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[10px] mt-1.5 text-right opacity-60 font-mono ${
                    m.sender === "user" ? "text-white" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#EF7D2C] font-semibold p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI Muavin yanıt hazırlıyor...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-[#26282d] bg-[#141517] rounded-b-2xl flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Sorunuzu sorun veya komut verin (ör: Bu ayki en büyük masrafımız nedir?)..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 bg-[#18191c] border border-[#26282d] rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#8252F6]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="bg-[#8252F6] hover:bg-[#703EE5] disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md border border-[#703EE5]"
          >
            <span>Gönder</span>
            <Send className="w-3.5 h-3.5 text-[#EF7D2C]" />
          </button>
        </form>
      </div>
    </div>
  );
};
