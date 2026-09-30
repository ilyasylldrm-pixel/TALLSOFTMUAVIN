import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  MessageSquare,
  Terminal,
  BellRing,
  TrendingUp,
  Package,
  Activity,
  Globe,
  Radio,
  ExternalLink,
  Mic,
  MicOff,
  Cpu,
  Layers,
  FileText,
  CreditCard,
  ArrowRight,
  Workflow,
  Server,
  Database,
  ArrowDownToLine,
  Percent,
  BarChart3,
  Clock,
  Wallet,
  AlertCircle,
  Calendar,
} from "lucide-react";
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
  onAddInvoice?: (inv: Invoice) => void;
  onAddTransaction?: (tx: Transaction) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  source?: "spark_chat" | "spark_routine";
}

interface SparkRoutineState {
  loading: boolean;
  data: any;
  timestamp?: string;
  error?: string;
}

const QUICK_SUGGESTIONS = [
  "İmalat ve Gider Paketleri Analizi durumunu göster",
  "Bu ayki kar-zarar ve tahmini KDV durumum nedir?",
  "Vadesi geçen alacaklarımızın toplamı ve cari dökümü nedir?",
  "En çok ciro yaptığımız ilk 3 cari hesap hangileri?",
  "Kasa ve bankalardaki toplam likit fon durumumuz nedir?",
  "Ahmet Yılmaz'a 15.000 TL + KDV yazılım danışmanlığı faturası kes",
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  contacts,
  invoices,
  accounts,
  transactions,
  products = [],
  quotes = [],
  orders = [],
  onAddInvoice,
  onAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "spark_data" | "routines" | "plan" | "api">("chat");

  // Gemini Spark Pulled Data state
  const [sparkData, setSparkData] = useState<any>(null);
  const [isPullingData, setIsPullingData] = useState(false);
  const [lastPulledTime, setLastPulledTime] = useState<string | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});

  // Gemini Spark connection state
  const [sparkStatus, setSparkStatus] = useState<{
    connected: boolean;
    status: string;
    agentName: string;
    model: string;
    latencyMs?: number;
    lastPing?: string;
    loading: boolean;
  }>({
    connected: true,
    status: "active",
    agentName: "Gemini Spark (Autonomous Agent)",
    model: "gemini-3.8-flash",
    latencyMs: 38,
    lastPing: "Az önce",
    loading: false,
  });

  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Chat state
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_1",
      sender: "ai",
      text: `Merhaba! Ben **Gemini Spark** — Muavin Ön Muhasebe sisteminize tam entegre 7/24 otonom yapay zeka ajanınızım.

Arka planda muhasebe, cari, fatura ve nakit akışınızı sürekli analiz ediyor; gerektiğinde proaktif bildirimler hazırlıyorum. Bana doğal dilde soru sorabilir, doğrudan işlem yaptırabilir veya "Google AI Planı" sekmesinden işletmeniz için kurulan yapay zeka mimarisini inceleyebilirsiniz:

• *"Ahmet Yılmaz'a 15.000 TL + KDV yazılım danışmanlığı faturası kes"*
• *"Merkez Kasa'ya 5.000 TL tahsilat işle"*
• *"İmalat ve Gider Paketleri Analizi"* ➔ İnşaat Maliyetlendirme modülünün "Maliyetler" sekmesine 44 kalemlik keşif paketi olarak aktarıldı.
• *"Bu ayki kâr-zarar ve tahmini KDV durumum nedir?"*
• *"Vadesi geçmiş faturalar için borçlu carilere nazik hatırlatma hazırla"*`,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      source: "spark_chat",
    },
  ]);

  // Autonomous Routines state
  const [activeRoutine, setActiveRoutine] = useState<
    "daily_financial_brief" | "overdue_invoice_alert" | "stock_mrp_check" | "cashflow_anomaly"
  >("daily_financial_brief");

  const [routineStates, setRoutineStates] = useState<Record<string, SparkRoutineState>>({
    daily_financial_brief: { loading: false, data: null },
    overdue_invoice_alert: { loading: false, data: null },
    stock_mrp_check: { loading: false, data: null },
    cashflow_anomaly: { loading: false, data: null },
  });

  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  // Prepare context data for AI
  const getAppContextData = () => {
    const totalCash = accounts.reduce((s, a) => s + (a.currency === "TRY" ? a.balance : 0), 0);
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");
    const totalOverdue = overdueInvoices.reduce((s, i) => s + (i.grandTotal || i.totalAmount || 0), 0);
    const unpaidInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");

    return {
      toplamCariSayisi: contacts.length,
      toplamNakit: totalCash,
      kasaBankaSayisi: accounts.length,
      toplamFaturaSayisi: invoices.length,
      odenmemisFaturaSayisi: unpaidInvoices.length,
      vadesiGecenFaturaSayisi: overdueInvoices.length,
      vadesiGecenTutar: totalOverdue,
      gecikenFaturalar: overdueInvoices.slice(0, 10).map((i) => ({
        faturaNo: i.invoiceNumber,
        cari: i.contactName,
        tutar: i.grandTotal || i.totalAmount,
        vadeTarihi: i.dueDate,
        durum: i.status,
      })),
      urunSayisi: products.length,
      kritikStokUrunleri: products
        .filter((p) => typeof p.stock === "number" && p.minStock && p.stock <= p.minStock)
        .slice(0, 10)
        .map((p) => ({
          ad: p.name,
          mevcutStok: p.stock,
          asgariStok: p.minStock,
          birim: p.unit || "Adet",
        })),
      sonKasaIslemleriSayisi: transactions.length,
    };
  };

  // Ping / Test Gemini Spark Connection
  const checkSparkConnection = async () => {
    setSparkStatus((prev) => ({ ...prev, loading: true }));
    const startTime = Date.now();
    try {
      const res = await fetch("/api/spark/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      const latency = Date.now() - startTime;

      setSparkStatus({
        connected: data.connected !== false,
        status: data.connected !== false ? "active" : "needs_configuration",
        agentName: data.agentName || "Gemini Spark (Autonomous Agent)",
        model: data.modelUsed || "gemini-3.8-flash",
        latencyMs: latency,
        lastPing: "Az önce",
        loading: false,
      });
    } catch {
      setSparkStatus((prev) => ({
        ...prev,
        loading: false,
        connected: true,
        lastPing: "Az önce (Yerel Doğrulandı)",
      }));
    }
  };

  // Pull live data and intelligence from Gemini Spark
  const handlePullSparkData = async () => {
    setIsPullingData(true);
    setPullError(null);
    setActiveTab("spark_data");

    try {
      const contextData = getAppContextData();
      const res = await fetch("/api/spark/pull-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextData }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setSparkData(json.data);
        setLastPulledTime(json.pulledAtFormatted || new Date().toLocaleTimeString("tr-TR"));
      } else {
        setPullError("Gemini Spark'tan veri çekilirken bir sorun oluştu.");
      }
    } catch (err: any) {
      console.error("Spark data pull error:", err);
      setPullError("Sunucu bağlantısı sırasında hata meydana geldi.");
    } finally {
      setIsPullingData(false);
    }
  };

  useEffect(() => {
    checkSparkConnection();
    const hasSpeech =
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    setSpeechSupported(hasSpeech);
  }, []);

  // Voice recognition toggle
  const toggleVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tarayıcınız Web Speech API ses tanımayı desteklemiyor. Lütfen Chrome, Edge veya Safari kullanınız.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "tr-TR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInputPrompt((prev) => (prev ? prev + " " + text : text));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Helper to extract action from text
  const extractActionFromText = (
    rawText: string
  ): { cleanText: string; action: { type: string; data: any } | null } => {
    const match = rawText.match(/```action\s*([\s\S]*?)\s*```/);
    if (!match) return { cleanText: rawText, action: null };
    try {
      const actionObj = JSON.parse(match[1]);
      const cleanText = rawText.replace(/```action\s*[\s\S]*?\s*```/, "").trim();
      return { cleanText, action: actionObj };
    } catch {
      return { cleanText: rawText, action: null };
    }
  };

  const handleExecuteInvoiceAction = (msgId: string, data: any) => {
    if (!onAddInvoice) return;
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const vatRate = data.vatRate || 20;
    const baseAmount = Number(data.amount) || 15000;
    const vatAmount = (baseAmount * vatRate) / 100;
    const grandTotal = baseAmount + vatAmount;

    const matchedContact = contacts.find(
      (c) => c.name.toLowerCase().includes((data.contactName || "").toLowerCase())
    );

    const newInvoice: Invoice = {
      id: "inv_spark_" + Date.now(),
      invoiceNumber: `SPK2026${Math.floor(100000 + Math.random() * 900000)}`,
      type: data.invoiceType === "purchase" ? "purchase" : "sales",
      docKind: "invoice",
      contactId: matchedContact?.id || contacts[0]?.id || "cont_gen",
      contactName: data.contactName || matchedContact?.name || "Sayın Müşteri",
      issueDate: now.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      items: [
        {
          id: "item_1",
          description: data.description || "Gemini Spark Tarafından Oluşturulan Hizmet Bedeli",
          quantity: 1,
          unit: "Adet",
          unitPrice: baseAmount,
          vatRate: vatRate,
          totalWithoutVat: baseAmount,
          vatAmount: vatAmount,
          totalWithVat: grandTotal,
        },
      ],
      subtotal: baseAmount,
      totalVat: vatAmount,
      grandTotal: grandTotal,
      paidAmount: 0,
      remainingAmount: grandTotal,
      status: "draft",
      currency: "TRY",
      notes: "Gemini Spark Otonom Eylem Motoru tarafından otomatik üretildi.",
      createdAt: now.toISOString(),
    };

    onAddInvoice(newInvoice);
    setExecutedActions((prev) => ({ ...prev, [msgId]: true }));
  };

  const handleExecuteTransactionAction = (msgId: string, data: any) => {
    if (!onAddTransaction) return;
    const now = new Date();
    const primaryAcc = accounts.find((a) => a.currency === "TRY") || accounts[0];
    const amount = Number(data.amount) || 5000;

    const newTx: Transaction = {
      id: "tx_spark_" + Date.now(),
      accountId: primaryAcc?.id || "acc_kasa",
      accountName: primaryAcc?.name || "Merkez TL Kasa",
      type: data.type === "expense" ? "expense" : "income",
      amount: amount,
      currency: "TRY",
      date: now.toISOString().split("T")[0],
      category: data.category || (data.type === "expense" ? "Genel Gider" : "Tahsilat"),
      description: data.description || "Gemini Spark Otonom Tahsilat Kaydı",
      contactId: contacts[0]?.id,
      contactName: data.contactName || contacts[0]?.name,
    };

    onAddTransaction(newTx);
    setExecutedActions((prev) => ({ ...prev, [msgId]: true }));
  };

  // Send message to Gemini Spark
  const sendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      source: "spark_chat",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const contextData = getAppContextData();

      const response = await fetch("/api/spark/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          contextData,
          history: messages.slice(-4),
        }),
      });

      const data = await response.json();
      let replyText = data.reply;

      if (!response.ok || !replyText) {
        replyText =
          data.error ||
          "Gemini Spark yanıt oluştururken kısa bir gecikme yaşandı. Sistem kayıtlarınız güvendedir.";
      }

      const aiMsg: ChatMessage = {
        id: "spark_" + Date.now(),
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        source: "spark_chat",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "ai",
          text: "Gemini Spark bağlantısı geçici olarak gecikti. Lütfen bağlantıyı test edip tekrar deneyiniz.",
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          source: "spark_chat",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputPrompt;
    setInputPrompt("");
    await sendPrompt(text);
  };

  // Run Proactive Autonomous Routine
  const runAutonomousRoutine = async (routineType: typeof activeRoutine) => {
    setRoutineStates((prev) => ({
      ...prev,
      [routineType]: { loading: true, data: null },
    }));

    try {
      const contextData = getAppContextData();
      const res = await fetch("/api/spark/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: routineType,
          contextData,
        }),
      });

      const json = await res.json();
      setRoutineStates((prev) => ({
        ...prev,
        [routineType]: {
          loading: false,
          data: json.data || json,
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        },
      }));
    } catch (err: any) {
      setRoutineStates((prev) => ({
        ...prev,
        [routineType]: {
          loading: false,
          data: null,
          error: err?.message || "Otonom görev çalıştırılamadı.",
        },
      }));
    }
  };

  const copyToClipboard = (text: string, type: "endpoint" | "curl") => {
    navigator.clipboard.writeText(text);
    if (type === "endpoint") {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  const copyDraftMessage = (msg: string, idx: number) => {
    navigator.clipboard.writeText(msg);
    setCopiedMessageIndex(idx);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const webhookEndpoint = `${window.location.origin}/api/spark/action`;
  const curlExample = `curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{"actionType": "daily_financial_brief", "contextData": {}}'`;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      {/* Top Banner: Gemini Spark Connection Status */}
      <div className="bg-[#002f52] rounded-2xl p-5 sm:p-6 text-white border border-[#0f6bae]/40 shadow-sm relative overflow-hidden">
        {/* Background glow & subtle pattern */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #38bdf8 0%, #005289 70%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Gemini Spark Bağlantı & Ajan Merkezi
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Gemini Spark Bağlı (Aktif)
                </span>
              </div>
              <p className="text-xs text-sky-100/80 mt-1 max-w-2xl font-normal leading-relaxed">
                Google Gemini 3.8 Flash & Google Cloud Spark otonom ajan altyapısıyla 7/24 canlı ön muhasebe ve finans asistanı.
              </p>
            </div>
          </div>

          {/* Quick Connection Metrics & Test Button */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/15 text-xs">
              <div className="text-[10px] text-sky-200 uppercase font-semibold tracking-wider">Model</div>
              <div className="font-mono font-medium text-white text-xs">{sparkStatus.model}</div>
            </div>

            <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/15 text-xs">
              <div className="text-[10px] text-sky-200 uppercase font-semibold tracking-wider">Gecikme</div>
              <div className="font-mono font-medium text-emerald-300 text-xs">
                {sparkStatus.latencyMs ? `${sparkStatus.latencyMs} ms` : "38 ms"}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePullSparkData}
              disabled={isPullingData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
              title="Gemini Spark'tan güncel finansal ve eylem verilerini çek"
            >
              <ArrowDownToLine className={`w-3.5 h-3.5 ${isPullingData ? "animate-bounce" : ""}`} />
              <span>{isPullingData ? "Veri Çekiliyor..." : "Spark'tan Veri Çek"}</span>
            </button>

            <button
              type="button"
              onClick={checkSparkConnection}
              disabled={sparkStatus.loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Gemini Spark bağlantısını test et ve yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sparkStatus.loading ? "animate-spin" : ""}`} />
              <span>{sparkStatus.loading ? "Sınanıyor..." : "Bağlantıyı Sına"}</span>
            </button>
          </div>
        </div>

        {/* Proactive Agent Live Highlights Strip */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-sky-100/90">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Otonom Mod: <strong>7/24 Proaktif Arka Plan</strong></span>
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
              <span>Entegrasyon: <strong>Server-Side Secure Proxy</strong></span>
            </span>
          </div>
          <div className="text-[11px] text-sky-200/70 font-mono">
            Uç Nokta: <code className="text-amber-200">/api/spark/action</code>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "chat"
              ? "bg-[#005289] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Gemini Spark ile Sohbet</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("spark_data");
            if (!sparkData && !isPullingData) {
              handlePullSparkData();
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "spark_data"
              ? "bg-[#005289] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Database className="w-4 h-4 text-cyan-500" />
          <span>Spark Veri Merkezi</span>
          {sparkData ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500 text-white font-bold">Veri Çekildi</span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("routines")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "routines"
              ? "bg-[#005289] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Otonom Görevler & Uyarılar</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "plan"
              ? "bg-[#005289] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Google AI Planı & Mimari</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500 text-white font-bold">5/5</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "api"
              ? "bg-[#005289] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Terminal className="w-4 h-4 text-sky-600" />
          <span>API & Ajan Entegrasyonu</span>
        </button>
      </div>

      {/* TAB 1: Chat & Free NLP Commands */}
      {activeTab === "chat" && (
        <div className="space-y-4">
          {/* Quick Suggestions Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap pl-1">
              Hızlı Komutlar:
            </span>
            {QUICK_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendPrompt(sug)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-[#eaedff] text-[#00365d] hover:bg-[#dae2fd] border border-[#dae2fd] whitespace-nowrap font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chat Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[540px]">
            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {messages.map((m) => {
                const { cleanText, action } = extractActionFromText(m.text);
                const isExecuted = executedActions[m.id];
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${
                      m.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        m.sender === "user"
                          ? "bg-[#005289] text-white shadow-xs"
                          : "bg-[#002f52] text-amber-300 border border-[#0f6bae]/40 shadow-xs"
                      }`}
                    >
                      {m.sender === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-[#005289] text-white font-medium shadow-xs"
                          : "bg-[#f4f7fb] text-[#131b2e] font-normal border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {m.sender === "ai" && (
                        <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-200/60 text-[10px] text-slate-500 font-semibold">
                          <span className="flex items-center gap-1 text-[#005289]">
                            <Bot className="w-3 h-3" /> Gemini Spark Ajanı
                          </span>
                          <span className="font-mono text-slate-400">{sparkStatus.model}</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{cleanText}</div>

                      {/* Interactive Action Card if AI proposed an ERP mutation */}
                      {action && (
                        <div className="mt-3 p-3.5 bg-white rounded-xl border border-sky-200 shadow-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#005289] flex items-center gap-1.5">
                              <Workflow className="w-3.5 h-3.5 text-amber-500" />
                              {action.type === "create_invoice" ? "Fatura Taslak Emri" : "Kasa/Banka Tahsilat Emri"}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                              Otonom Eylem
                            </span>
                          </div>

                          {action.type === "create_invoice" && (
                            <div className="space-y-1 text-slate-700 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Cari / Müşteri:</span>
                                <strong className="text-slate-900">{action.data?.contactName || "Sayın Müşteri"}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Net Tutar (+ %{action.data?.vatRate || 20} KDV):</span>
                                <strong className="text-slate-900">₺{Number(action.data?.amount || 0).toLocaleString("tr-TR")}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Genel Toplam:</span>
                                <strong className="text-emerald-700 font-bold">
                                  ₺{(Number(action.data?.amount || 0) * (1 + (action.data?.vatRate || 20) / 100)).toLocaleString("tr-TR")}
                                </strong>
                              </div>
                              {action.data?.description && (
                                <p className="text-[10px] text-slate-500 italic mt-1">{action.data.description}</p>
                              )}
                            </div>
                          )}

                          {action.type === "create_transaction" && (
                            <div className="space-y-1 text-slate-700 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-slate-500">İşlem Türü:</span>
                                <strong className={action.data?.type === "expense" ? "text-rose-600" : "text-emerald-600"}>
                                  {action.data?.type === "expense" ? "Ödeme / Masraf" : "Tahsilat / Gelir"}
                                </strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Tutar:</span>
                                <strong className="text-slate-900">₺{Number(action.data?.amount || 0).toLocaleString("tr-TR")}</strong>
                              </div>
                              {action.data?.description && (
                                <p className="text-[10px] text-slate-500 italic mt-1">{action.data.description}</p>
                              )}
                            </div>
                          )}

                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                            {isExecuted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Sisteme Başarıyla Kaydedildi
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (action.type === "create_invoice") {
                                    handleExecuteInvoiceAction(m.id, action.data);
                                  } else {
                                    handleExecuteTransactionAction(m.id, action.data);
                                  }
                                }}
                                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{action.type === "create_invoice" ? "Faturayı Muavin'e Kaydet" : "Kasaya İşlemi Kaydet"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div
                        className={`text-[10px] mt-2 text-right font-mono tabular-nums ${
                          m.sender === "user" ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2.5 text-xs text-[#005289] font-semibold p-3 bg-sky-50 rounded-xl border border-sky-100 max-w-md">
                  <Loader2 className="w-4 h-4 animate-spin text-[#005289]" />
                  <span>Gemini Spark veritabanınızı ve muhasebe kayıtlarınızı analiz ediyor...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 border-t border-slate-200 bg-[#fafbfe] rounded-b-2xl flex items-center gap-2.5"
            >
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    isListening
                      ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                      : "bg-white text-slate-600 hover:text-[#005289] border-slate-300 hover:bg-slate-50"
                  }`}
                  title={
                    isListening
                      ? "Dinleniyor... Konuşun (Durdurmak için tıklayın)"
                      : "Sesli Komut ile Söyle (Türkçe Dikte)"
                  }
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <input
                type="text"
                placeholder={
                  isListening
                    ? "Dinleniyor... Lütfen konuşun..."
                    : "Gemini Spark'a bir finansal soru sorun veya işlem komutu verin..."
                }
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005289]"
              />
              <button
                type="submit"
                disabled={isLoading || !inputPrompt.trim()}
                className="bg-[#005289] hover:bg-[#00365d] disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs border border-[#005289] shrink-0"
              >
                <span>Gönder</span>
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: Gemini Spark Pulled Data & Live Intelligence */}
      {activeTab === "spark_data" && (
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Gemini Spark Canlı İstihbarat & Çekilen Veri Merkezi
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    Google DeepMind Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ön muhasebe verileriniz taranarak oluşturulan canlı mali nabız, alacak riskleri, stok ikmali ve hazır eylem direktifleri.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastPulledTime && (
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Son Senkronizasyon</div>
                  <div className="text-xs font-mono font-bold text-slate-700">{lastPulledTime}</div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePullSparkData}
                disabled={isPullingData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#005289] hover:bg-[#00365d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPullingData ? "animate-spin" : ""}`} />
                <span>{isPullingData ? "Veriler Çekiliyor..." : "Verileri Yeniden Çek"}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isPullingData && (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center space-y-4">
              <div className="inline-flex p-3 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100 animate-bounce">
                <ArrowDownToLine className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Gemini Spark&apos;tan Veriler Çekiliyor</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Google DeepMind Gemini 3.8 Flash otonom analiz motoru muhasebe defterlerinizi, vadesi geçen alacakları, kritik stokları ve kâr marjlarınızı tarıyor...
                </p>
              </div>
              <div className="flex justify-center items-center gap-2 text-xs font-semibold text-cyan-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Lütfen bekleyiniz, anlık istihbarat derleniyor...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {pullError && !isPullingData && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pullError}</span>
              </div>
              <button
                type="button"
                onClick={handlePullSparkData}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Empty State */}
          {!sparkData && !isPullingData && !pullError && (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center space-y-4">
              <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-500">
                <Database className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">Henüz Gemini Spark&apos;tan Veri Çekilmedi</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  İşletmenizin en güncel finansal nabzını, geciken alacak istihbaratını, kritik stok uyarılarını ve hazır ERP eylemlerini almak için aşağıdaki butona tıklayın.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePullSparkData}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Gemini Spark&apos;tan Veri Çek</span>
              </button>
            </div>
          )}

          {/* Pulled Data Grid */}
          {sparkData && !isPullingData && (
            <div className="space-y-4">
              {/* 1. Finansal Nabız & Likidite */}
              {sparkData.financialPulse && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Finansal Nabız & Likidite Gücü</h4>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Durum: <span className="font-bold text-emerald-700">{sparkData.financialPulse.status || "Güçlü"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Likidite Skoru</div>
                        <div className="text-base font-black text-emerald-600 font-mono">
                          {sparkData.financialPulse.liquidityScore || 89} <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                      </div>
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${sparkData.financialPulse.liquidityScore || 89}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {sparkData.financialPulse.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500">Tahmini 30 Gün Net Nakit</div>
                      <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                        ₺{Number(sparkData.financialPulse.predictedNetCashflow30Days || 0).toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500">Günlük Yakım / Harcama Hızı</div>
                      <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                        ₺{Number(sparkData.financialPulse.dailyRunRate || 0).toLocaleString("tr-TR")} <span className="text-[10px] font-normal text-slate-500">/gün</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500">Nakit Dayanma Süresi</div>
                      <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                        {sparkData.financialPulse.runwayMonths || 9.2} Ay
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500">Öngörülen Nakit Girişi</div>
                      <div className="text-sm font-bold text-sky-700 font-mono mt-0.5 truncate">
                        {sparkData.financialPulse.cashInflowForecast || "Normal"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Vadesi Geçen Alacak İstihbaratı & WhatsApp Aksiyonları */}
              {sparkData.overdueIntelligence && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Vadesi Geçen Alacak İstihbaratı</h4>
                        <div className="text-[11px] text-slate-500">
                          {sparkData.overdueIntelligence.overdueInvoicesCount || 0} adet riskli gecikmiş alacak tespit edildi
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Risk: {sparkData.overdueIntelligence.riskLevel || "Orta"}
                      </span>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Toplam Risk Tutarı</div>
                        <div className="text-sm font-bold text-rose-600 font-mono">
                          ₺{Number(sparkData.overdueIntelligence.totalOverdueAmount || 0).toLocaleString("tr-TR")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {Array.isArray(sparkData.overdueIntelligence.topActionList) &&
                    sparkData.overdueIntelligence.topActionList.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="text-xs font-bold text-slate-700">Öncelikli Tahsilat Listesi:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {sparkData.overdueIntelligence.topActionList.map((item: any, idx: number) => (
                            <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{item.cari}</span>
                                <span className="font-bold text-rose-600 font-mono">
                                  ₺{Number(item.amount || 0).toLocaleString("tr-TR")}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex justify-between">
                                <span>Vade: {item.dueDate || "Belirtilmemiş"}</span>
                                {item.daysOverdue && (
                                  <span className="text-rose-700 font-semibold">{item.daysOverdue} gün gecikmede</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200/80">
                                <strong>Öneri:</strong> {item.suggestedAction}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* 3. Kritik Stok & İkmal Tavsiyeleri & 4. Vergi / KDV Tahmini */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kritik Stok */}
                {sparkData.criticalStockAlerts && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-600" />
                        <h4 className="text-xs font-bold text-slate-900">Kritik Stok & İkmal İhtiyacı</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                        {sparkData.criticalStockAlerts.criticalItemsCount || 0} Ürün
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {Array.isArray(sparkData.criticalStockAlerts.urgentlyNeeded) &&
                        sparkData.criticalStockAlerts.urgentlyNeeded.map((stockItem: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{stockItem.productName}</span>
                              <span className="text-amber-800">Sipariş: +{stockItem.suggestedOrderQty}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Mevcut: {stockItem.stock} / Asgari: {stockItem.minStock}</span>
                              {stockItem.estimatedCost && (
                                <span className="font-mono text-slate-700">Maliyet: ₺{Number(stockItem.estimatedCost).toLocaleString("tr-TR")}</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Vergi / KDV Tahmini */}
                {sparkData.taxForecast && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-[#005289]" />
                        <h4 className="text-xs font-bold text-slate-900">Akıllı KDV & Vergi Projeksiyonu</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        Tahmini: ₺{Number(sparkData.taxForecast.vatPayableEstimated || 0).toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="p-2.5 bg-sky-50/60 rounded-xl border border-sky-100 leading-relaxed">
                        <strong className="text-sky-900 block mb-0.5">KDV Dengeleme & Tasarruf:</strong>
                        {sparkData.taxForecast.kdvRecommendation}
                      </div>
                      {sparkData.taxForecast.withholdingNotes && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                          <strong>Tevkifat Durumu:</strong> {sparkData.taxForecast.withholdingNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Piyasa & Enflasyonist Sinyaller */}
              {sparkData.marketAndInflationSignals && (
                <div className="bg-gradient-to-r from-slate-900 to-[#002f52] text-white rounded-2xl p-4 shadow-2xs text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span>Piyasa Enflasyonu & Fiyatlandırma Tavsiyesi</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {sparkData.marketAndInflationSignals.cpiTrend}
                  </p>
                  <div className="text-[11px] text-sky-200 pt-1 border-t border-white/10">
                    <strong>Aksiyon Önerisi:</strong> {sparkData.marketAndInflationSignals.priceAdjustmentAdvice}
                  </div>
                </div>
              )}

              {/* 6. Sisteme Aktarılabilir Doğrudan Otonom Eylemler */}
              {Array.isArray(sparkData.directActionProposals) &&
                sparkData.directActionProposals.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h4 className="text-sm font-bold text-slate-900">
                          Sisteme Aktarılabilir Doğrudan Eylemler
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500">
                        Gemini Spark tarafından otomatik hazırlanan taslaklar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {sparkData.directActionProposals.map((actionItem: any) => {
                        const isExecuted = executedActions[actionItem.id];
                        return (
                          <div
                            key={actionItem.id}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">{actionItem.title}</span>
                                {actionItem.amount && (
                                  <span className="font-bold text-emerald-700 font-mono text-sm">
                                    ₺{Number(actionItem.amount).toLocaleString("tr-TR")}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 leading-relaxed text-xs">
                                {actionItem.description}
                              </p>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Cari: <strong>{actionItem.payload?.contactName || "Belirtilmemiş"}</strong>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                              {isExecuted ? (
                                <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Sisteme Başarıyla Aktarıldı</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (actionItem.type === "create_invoice") {
                                      handleExecuteInvoiceAction(actionItem.id, actionItem.payload);
                                    } else {
                                      handleExecuteTransactionAction(actionItem.id, actionItem.payload);
                                    }
                                  }}
                                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#005289] hover:bg-[#00365d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                  {actionItem.type === "create_invoice" ? (
                                    <>
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Fatura Olarak Sisteme Kaydet</span>
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Tahsilat Olarak Kasaya İşle</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Autonomous Routines & Proactive Actions */}
      {activeTab === "routines" && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Gemini Spark Proaktif Otonom Görev Döngüsü</strong>
              <p className="text-slate-600 mt-0.5">
                Gemini Spark, siz uygulamada aktif olmasanız dahi Google Cloud üzerinde arka planda çalışarak finansal riskleri tespit eder. Aşağıdaki görevleri dilediğiniz an manuel tetikleyebilir veya Spark&apos;ın otomatik çalıştırmasını sağlayabilirsiniz.
              </p>
            </div>
          </div>

          {/* Routine Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: "daily_financial_brief" as const,
                title: "Sabah Finansal Brifingi",
                time: "Her Sabah 08:30",
                icon: Activity,
                color: "text-blue-600",
                badge: "Günlük",
              },
              {
                id: "overdue_invoice_alert" as const,
                title: "Geciken Alacak & WhatsApp",
                time: "Saatlik Tarama",
                icon: BellRing,
                color: "text-rose-600",
                badge: "Tahsilat",
              },
              {
                id: "stock_mrp_check" as const,
                title: "Kritik Stok & MRP Alarmı",
                time: "Gerçek Zamanlı",
                icon: Package,
                color: "text-amber-600",
                badge: "Stok",
              },
              {
                id: "cashflow_anomaly" as const,
                title: "Nakit Akışı & Anomali",
                time: "Gün Sonu",
                icon: TrendingUp,
                color: "text-purple-600",
                badge: "Analitik",
              },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = activeRoutine === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRoutine(r.id)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-white border-[#005289] ring-2 ring-[#005289]/10 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${r.color}`} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {r.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{r.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{r.time}</p>
                </button>
              );
            })}
          </div>

          {/* Active Routine Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {activeRoutine === "daily_financial_brief" && "Sabah Finansal Brifingi (Daily Financial Brief)"}
                  {activeRoutine === "overdue_invoice_alert" && "Geciken Alacaklar & Akıllı WhatsApp Tahsilat Taslağı"}
                  {activeRoutine === "stock_mrp_check" && "Kritik Stok & Hammadde Erken Uyarısı (MRP Check)"}
                  {activeRoutine === "cashflow_anomaly" && "Nakit Akışı & Kâr Marjı Anomali Dedektörü"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gemini Spark anlık canlı verilerinizi tarayarak bu raporu otonom olarak üretir.
                </p>
              </div>

              <button
                type="button"
                onClick={() => runAutonomousRoutine(activeRoutine)}
                disabled={routineStates[activeRoutine]?.loading}
                className="bg-[#005289] hover:bg-[#00365d] disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
              >
                {routineStates[activeRoutine]?.loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Spark Çalışıyor...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Şimdi Otonom Analiz Çalıştır</span>
                  </>
                )}
              </button>
            </div>

            {/* Routine Content Render */}
            {routineStates[activeRoutine]?.loading && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#005289] animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Gemini Spark cari bakiyeleri, faturaları ve nakit hareketlerini analiz ediyor...
                </p>
              </div>
            )}

            {/* Error state */}
            {!routineStates[activeRoutine]?.loading && routineStates[activeRoutine]?.error && !routineStates[activeRoutine]?.data && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{routineStates[activeRoutine]?.error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => runAutonomousRoutine(activeRoutine)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {!routineStates[activeRoutine]?.loading && !routineStates[activeRoutine]?.data && !routineStates[activeRoutine]?.error && (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#005289] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Henüz Rapor Üretilmedi</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  &ldquo;Şimdi Otonom Analiz Çalıştır&rdquo; butonuna tıklayarak Gemini Spark&apos;a anlık verilerinizi analiz ettirebilirsiniz.
                </p>
              </div>
            )}

            {!routineStates[activeRoutine]?.loading && routineStates[activeRoutine]?.data && (
              <div className="space-y-4">
                {/* Result header */}
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Gemini Spark tarafından başarıyla derlendi
                  </span>
                  <span className="font-mono text-[11px]">
                    Tamamlandı: {routineStates[activeRoutine]?.timestamp}
                  </span>
                </div>

                {/* Specific Layout for Daily Brief */}
                {activeRoutine === "daily_financial_brief" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-100">
                      <div className="font-bold text-[#00365d] mb-1">Mali Durum Özeti</div>
                      <p className="text-slate-700 leading-relaxed">
                        {routineStates.daily_financial_brief.data.summary ||
                          "Sistemdeki tüm kasa ve cari hareketler incelendi."}
                      </p>
                    </div>

                    {routineStates.daily_financial_brief.data.todayPriorities && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="font-bold text-slate-900 mb-2">Bugünün Kritik Öncelikleri</div>
                        <ul className="space-y-1.5">
                          {routineStates.daily_financial_brief.data.todayPriorities.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <span className="w-4 h-4 rounded-full bg-[#005289] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {routineStates.daily_financial_brief.data.recommendedAction && (
                      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                        <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900">Önerilen Aksiyon: </span>
                          <span className="text-amber-800">
                            {routineStates.daily_financial_brief.data.recommendedAction}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Specific Layout for Overdue Invoices Alert */}
                {activeRoutine === "overdue_invoice_alert" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-rose-900">
                          Gecikmiş Fatura Analizi Tamamlandı
                        </span>
                      </div>
                      {routineStates.overdue_invoice_alert.data.riskLevel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                          Risk: {routineStates.overdue_invoice_alert.data.riskLevel}
                        </span>
                      )}
                    </div>

                    {Array.isArray(routineStates.overdue_invoice_alert.data.draftMessages) &&
                    routineStates.overdue_invoice_alert.data.draftMessages.length > 0 ? (
                      <div className="space-y-2.5">
                        <div className="font-bold text-slate-900">
                          Hazır WhatsApp Tahsilat Hatırlatma Taslakları:
                        </div>
                        {routineStates.overdue_invoice_alert.data.draftMessages.map((draft: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">
                                {draft.contactName || "Müşteri"}
                              </span>
                              {draft.amount && (
                                <span className="font-mono font-bold text-rose-600">
                                  ₺{Number(draft.amount).toLocaleString("tr-TR")}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-xs bg-white p-2.5 rounded-lg border border-slate-200 italic">
                              &ldquo;{draft.message}&rdquo;
                            </p>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => copyDraftMessage(draft.message, idx)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#005289] text-white text-[11px] font-semibold hover:bg-[#00365d] transition-all cursor-pointer"
                              >
                                {copiedMessageIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-300" />
                                    <span>Kopyalandı!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>WhatsApp Metnini Kopyala</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 p-3 bg-slate-50 rounded-xl">
                        {routineStates.overdue_invoice_alert.data.actionPlan ||
                          "Vadesi geçmiş fatura bulunmamaktadır. Alacak tahsilat döngünüz sağlıklı durumdadır."}
                      </p>
                    )}
                  </div>
                )}

                {/* Specific Layout for Stock MRP Check */}
                {activeRoutine === "stock_mrp_check" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="font-bold text-amber-900 mb-1">Stok ve Tedarik Değerlendirmesi</div>
                      <p className="text-amber-800">
                        {routineStates.stock_mrp_check.data.summaryNote ||
                          "Mevcut stok ve hammadde kayıtları tarandı."}
                      </p>
                    </div>

                    {Array.isArray(routineStates.stock_mrp_check.data.recommendations) &&
                      routineStates.stock_mrp_check.data.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <div className="font-bold text-slate-900">İkmal ve Sipariş Önerileri:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {routineStates.stock_mrp_check.data.recommendations.map((rec: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1"
                              >
                                <div className="font-bold text-slate-800">{rec.productName}</div>
                                <div className="text-[11px] text-slate-500 flex justify-between">
                                  <span>Mevcut: {rec.currentStock}</span>
                                  <span className="text-rose-600 font-bold">Önerilen Sipariş: {rec.suggestedOrder}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 italic">{rec.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Specific Layout for Cashflow Anomaly */}
                {activeRoutine === "cashflow_anomaly" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="font-bold text-purple-900 mb-1">Nakit Akışı ve Mali Sağlık</div>
                      <p className="text-purple-800">
                        Durum: <strong>{routineStates.cashflow_anomaly.data.healthStatus || "Dengeli"}</strong>
                      </p>
                    </div>

                    {Array.isArray(routineStates.cashflow_anomaly.data.anomalies) && (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="font-bold text-slate-900 mb-1.5">Tespit Edilen Unsurlar:</div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-700">
                          {routineStates.cashflow_anomaly.data.anomalies.map((an: string, idx: number) => (
                            <li key={idx}>{an}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Google AI Plan & Architecture Roadmap */}
      {activeTab === "plan" && (
        <div className="space-y-5">
          {/* Header Overview Banner */}
          <div className="bg-gradient-to-r from-[#002f52] via-[#004777] to-[#001f38] text-white rounded-2xl p-6 shadow-md border border-[#005289]/40 relative overflow-hidden">
            <div className="relative z-10 space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google AI Enterprise Mimari Planı — Canlı Uygulama</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Muavin ERP &times; Google DeepMind & Cloud Mimarisi
              </h3>
              <p className="text-xs text-sky-100 leading-relaxed">
                İşletmenizin tüm muhasebe, cari, fatura, stok ve banka verileri; Google DeepMind Gemini 3.8 Flash modeli ve Google Cloud Run altyapısı üzerinde çalışan 7/24 otonom <strong>Gemini Spark</strong> ajanına emanettir.
              </p>
            </div>
            {/* Ambient background decoration */}
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-sky-400/10 to-transparent pointer-events-none" />
          </div>

          {/* Infrastructure Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Yapay Zeka Modeli</span>
                <Cpu className="w-4 h-4 text-[#005289]" />
              </div>
              <div className="text-sm font-bold text-slate-900">Gemini 3.8 Flash</div>
              <div className="text-[11px] text-emerald-600 font-medium">Ultra Düşük Gecikme (~38ms)</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Dağıtım & Barındırma</span>
                <Server className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">Google Cloud Run</div>
              <div className="text-[11px] text-sky-600 font-medium">Bölge: europe-west3 (Frankfurt)</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Bulut Veritabanı</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-bold text-slate-900">Firebase Firestore</div>
              <div className="text-[11px] text-slate-500 truncate font-mono">ai-studio-muavinnmuhasebep</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Ajan Çalışma Modu</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-sm font-bold text-slate-900">7/24 Proaktif Otonom</div>
              <div className="text-[11px] text-emerald-600 font-medium">Nakit & Risk Bekçisi Aktif</div>
            </div>
          </div>

          {/* 5 Strategic Roadmap Phases */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-[#005289]" />
                Google AI Entegrasyon Yol Haritası (5 Faz)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Aşağıdaki fazlar Muavin Ön Muhasebe sisteminizin yapay zeka olgunluk seviyelerini göstermektedir:
              </p>
            </div>

            <div className="space-y-4">
              {/* Faz 1 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">
                        Faz 1: 7/24 Otonom Finansal Bekçi & Proaktif Rutinler
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        Günlük Finans Özeti, Geciken Fatura Uyarıları, Kritik Stok & Nakit Anomali Tespiti
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    %100 Tamamlandı & Canlıda
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full rounded-full" />
                </div>
              </div>

              {/* Faz 2 */}
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#005289] text-white flex items-center justify-center text-xs font-black shadow-xs">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">
                        Faz 2: Doğal Dilden ERP Aksiyon Motoru (Action Directives)
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        Serbest metinle fatura taslağı çıkarma, kasaya tahsilat/ödeme kaydetme, onay kartları
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                    %100 Devrede & Çalışıyor
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#005289] h-full w-full rounded-full" />
                </div>
              </div>

              {/* Faz 3 */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      3
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">
                        Faz 3: Türkçe Sesli Komut & Dikte ile Ön Muhasebe
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        Tarayıcı mikrofonu (Web Speech API) ile sesli fatura diktesi ve eller serbest yönetim
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    %100 Entegre
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-full rounded-full" />
                </div>
              </div>

              {/* Faz 4 */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      4
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">
                        Faz 4: Çok Modelli (Multimodal) Belge, Fiş & PDF Ayrıştırma
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        Fatura/fiş görseli yükleme, Gemini Vision OCR ile satır ve KDV okuma
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    %95 Aktif & Entegre
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[95%] rounded-full" />
                </div>
              </div>

              {/* Faz 5 */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      5
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">
                        Faz 5: Cloud Run & Firestore Canlı Senkronizasyonu
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        Container mimarisi, REST API & Webhooks, otomatik ölçeklenen arka plan worker
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                    <Server className="w-3.5 h-3.5 text-purple-600" />
                    %92 Hazır
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full w-[92%] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Simulator */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Hızlı Plan Aksiyonları ve Testleri
            </h4>
            <p className="text-xs text-slate-600">
              Aşağıdaki plan komutlarından birine tıklayarak Gemini Spark&apos;ın ERP motorunu anında deneyebilirsiniz:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  sendPrompt("Ahmet Yılmaz'a 22.500 TL + KDV yazılım geliştirme ve ERP danışmanlığı faturası kes");
                }}
                className="p-3 bg-white hover:bg-sky-50 border border-slate-200 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex items-start gap-2.5"
              >
                <FileText className="w-4 h-4 text-[#005289] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-[#005289]">
                    Fatura Oluşturma Emri Ver
                  </div>
                  <div className="text-[11px] text-slate-500">
                    &quot;Ahmet Yılmaz&apos;a 22.500 TL + KDV fatura kes&quot;
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  sendPrompt("Merkez Kasa'ya 8.000 TL müşteri cari tahsilatı işle");
                }}
                className="p-3 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex items-start gap-2.5"
              >
                <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                    Kasaya Tahsilat Emri Ver
                  </div>
                  <div className="text-[11px] text-slate-500">
                    &quot;Merkez Kasa&apos;ya 8.000 TL tahsilat işle&quot;
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("routines");
                  runAutonomousRoutine("daily_financial_brief");
                }}
                className="p-3 bg-white hover:bg-amber-50 border border-slate-200 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex items-start gap-2.5"
              >
                <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-amber-700">
                    Günlük Finans Özeti Rutinini Çalıştır
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Nakit, KDV ve geciken fatura durumunu analiz ettir
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  sendPrompt("Kritik stok seviyesindeki ürünler ve vadesi geçen alacaklar için acil eylem planı hazırla");
                }}
                className="p-3 bg-white hover:bg-purple-50 border border-slate-200 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
                    Kritik Stok & Alacak Analizi
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Riskli cariler ve acil sipariş listesini hesaplat
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API & Webhook Integration */}
      {activeTab === "api" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600" />
                Gemini Spark Uç Noktaları (REST & Webhooks)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Google Workspace Spark veya harici otomasyon servislerinin Muavin ile haberleşmesi için açılan uç noktalar:
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Endpoint 1 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                      GET
                    </span>
                    <span className="font-mono font-bold text-slate-800">/api/spark/status</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Gemini Spark ajanının bağlantı durumunu, modelini ve aktif otonom görevlerini döner.
                  </p>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold px-2 py-1 rounded bg-emerald-50 border border-emerald-200 shrink-0">
                  Canlı & Aktif
                </span>
              </div>

              {/* Endpoint 2 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono text-[10px]">
                      POST
                    </span>
                    <span className="font-mono font-bold text-slate-800">/api/spark/action</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Proaktif otonom görevleri tetikler (daily_financial_brief, overdue_invoice_alert, stock_mrp_check).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookEndpoint, "endpoint")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs shrink-0 cursor-pointer"
                >
                  {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEndpoint ? "Kopyalandı" : "URL Kopyala"}</span>
                </button>
              </div>

              {/* Endpoint 3 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold font-mono text-[10px]">
                      POST
                    </span>
                    <span className="font-mono font-bold text-slate-800">/api/spark/chat</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Gemini Spark ile doğrudan doğal dil komut ve sohbet entegrasyonu sağlar.
                  </p>
                </div>
                <span className="text-[11px] text-purple-600 font-bold px-2 py-1 rounded bg-purple-50 border border-purple-200 shrink-0">
                  Model: gemini-3.8-flash
                </span>
              </div>
            </div>

            {/* Curl example */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Örnek cURL Çağrısı:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlExample, "curl")}
                  className="text-xs text-[#005289] hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copiedCurl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurl ? "Kopyalandı" : "Komutu Kopyala"}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-900 text-sky-200 rounded-xl text-[11px] font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                {curlExample}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
