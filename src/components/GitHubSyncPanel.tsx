import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Globe,
  Download,
  Terminal,
  ShieldCheck,
  Sliders,
  Check,
  Code2,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export interface GitHubStatusData {
  initialized: boolean;
  branch: string;
  repoUrl: string;
  owner: string;
  repo: string;
  hasToken: boolean;
  maskedToken?: string;
  isClean: boolean;
  uncommittedCount: number;
  uncommittedFiles: string[];
  lastCommit?: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: string;
  };
  lastSyncedAt?: string;
  actionsUrl: string;
  repoWebUrl: string;
  deployUrl: string;
}

interface GitHubSyncPanelProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccessNotification?: (message: string) => void;
}

export const GitHubSyncPanel: React.FC<GitHubSyncPanelProps> = ({
  isModal = false,
  onClose,
  onSuccessNotification,
}) => {
  const { theme } = useTheme();

  const [status, setStatus] = useState<GitHubStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Form states
  const [commitMessage, setCommitMessage] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [repoUrlInput, setRepoUrlInput] = useState("");

  // Result notification
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
    details?: string;
  } | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/github/status");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStatus(data);
          if (data.repoUrl) setRepoUrlInput(data.repoUrl);
        }
      }
    } catch (err: any) {
      console.error("GitHub status fetch error:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    setCommitMessage(
      `Yayınlama & Senkronizasyon (${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })})`
    );
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/github/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitMessage: commitMessage.trim() || undefined,
          token: tokenInput.trim() || undefined,
          repoUrl: repoUrlInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: data.message || "Proje başarıyla GitHub'a aktarıldı ve yayınlama tetiklendi!",
          details: data.commitSha ? `Commit SHA: ${data.commitSha.substring(0, 7)} | Dal: main` : undefined,
        });
        if (onSuccessNotification) {
          onSuccessNotification("GitHub senkronizasyonu ve tallsoft.org yayınlaması başarıyla başlatıldı!");
        }
        await fetchStatus();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "GitHub senkronizasyonu sırasında bir hata oluştu.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Ağ hatası: Sunucuya ulaşılamadı.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/github/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `${data.message} (${data.repoName} - ${data.isPrivate ? "Özel / Private" : "Herkese Açık / Public"})`,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Bağlantı doğrulanamadı. Token veya repo izinlerini kontrol edin.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Bağlantı testi sırasında hata oluştu.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/github/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim() || undefined,
          repoUrl: repoUrlInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: "Ayarlar başarıyla kaydedildi.",
        });
        setTokenInput("");
        await fetchStatus();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Ayarlar kaydedilemedi.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Kayıt sırasında hata oluştu.",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner when in Settings page */}
      {!isModal && (
        <div
          className="relative overflow-hidden rounded-xl p-6 text-white shadow-2xs border"
          style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <UploadCloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                  Otomatik CI/CD Dağıtımı
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Yayınlama & GitHub Senkronizasyon Merkezi
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Tek tıkla tüm geliştirmelerinizi GitHub reponuza gönderin ve GitHub Actions üzerinden{" "}
                  <strong className="text-emerald-400">tallsoft.org</strong> canlı ortamında yayınlayın.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? "animate-spin" : ""}`} />
              <span>Durumu Yenile</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
              : "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-semibold">{feedback.message}</div>
            {feedback.details && (
              <div className="font-mono text-[11px] opacity-80 mt-1">{feedback.details}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Repo Info */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>GitHub Deposu</span>
          </div>
          <div className="mt-2.5">
            <div className="font-bold text-xs truncate text-slate-900 dark:text-slate-100" title={status?.repo}>
              {status ? `${status.owner}/${status.repo}` : "Yükleniyor..."}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              <GitBranch className="w-3 h-3" />
              <span>Dal: {status?.branch || "main"}</span>
            </div>
          </div>
          {status?.repoWebUrl && (
            <a
              href={status.repoWebUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Depoyu Aç</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Target Live Site */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>Canlı Yayın Hedefi</span>
          </div>
          <div className="mt-2.5">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              tallsoft.org
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              GitHub Actions & Otomatik FTP
            </div>
          </div>
          {status?.actionsUrl && (
            <a
              href={status.actionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>CI/CD İş Akışı</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Sync State */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Senkronizasyon Durumu</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status?.isClean ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                {status?.isClean
                  ? "Tüm Dosyalar Eşitlendi"
                  : `${status?.uncommittedCount || 0} Yerel Değişiklik`}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {status?.lastSyncedAt
                ? `Son: ${new Date(status.lastSyncedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
                : "Hazır"}
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 truncate">
            {status?.lastCommit ? `SHA: ${status.lastCommit.shortSha}` : ""}
          </div>
        </div>
      </div>

      {/* Last Commit Detail Box */}
      {status?.lastCommit && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex items-start gap-3 text-xs shadow-xs">
          <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
            <GitCommit className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-semibold">
                {status.lastCommit.shortSha}
              </span>
              <span className="text-slate-400 text-[11px]">
                {status.lastCommit.author} •{" "}
                {status.lastCommit.date ? new Date(status.lastCommit.date).toLocaleDateString("tr-TR") : ""}
              </span>
            </div>
            <div className="font-medium text-slate-100 mt-1 truncate">
              {status.lastCommit.message}
            </div>
          </div>
        </div>
      )}

      {/* Main Action Block: Publish / Sync */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-850 space-y-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Yayınlama / Commit Açıklaması:
          </label>
          <div className="relative">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Yayınlama açıklaması girin..."
              disabled={isPublishing}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Bu açıklama GitHub commit geçmişinde ve CI/CD dağıtım kayıtlarında görüntülenecektir.
          </p>
        </div>

        {/* Big Publish Button */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing || isLoadingStatus}
          className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {isPublishing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>GitHub'a Aktarılıyor ve Yayınlanıyor...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 text-white" />
              <span>Hemen GitHub'a Senkronize Et & Yayınla</span>
            </>
          )}
        </button>
      </div>

      {/* Advanced Config Collapsible */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Gelişmiş GitHub & Token Yapılandırması</span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
            {showConfig ? "Gizle" : "Göster / Düzenle"}
          </span>
        </button>

        {showConfig && (
          <div className="p-4 space-y-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                GitHub Repository URL:
              </label>
              <input
                type="text"
                value={repoUrlInput}
                onChange={(e) => setRepoUrlInput(e.target.value)}
                placeholder="https://github.com/kullanici/repo.git"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  GitHub Personal Access Token (PAT):
                </label>
                {status?.maskedToken && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    Kayıtlı: {status.maskedToken}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={status?.hasToken ? "Değiştirmek için yeni token girin..." : "ghp_xxxxxxxxxxxxxxxx"}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Token güvenli olarak sunucuda şifreli saklanır ve asla genel git geçmişine yazılmaz.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin" : ""}`} />
                <span>Bağlantıyı Test Et</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3 h-3" />
                <span>Ayarları Kaydet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clean ZIP Download Alternative */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4 text-slate-500" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Temiz Proje Arşivi (ZIP)
            </span>
            <p className="text-[11px] text-slate-500">
              Kodları yerel bilgisayarınıza indirmek isterseniz.
            </p>
          </div>
        </div>
        <a
          href="/muavin-project.zip"
          download="muavin-project.zip"
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1"
        >
          <span>İndir</span>
          <Download className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
