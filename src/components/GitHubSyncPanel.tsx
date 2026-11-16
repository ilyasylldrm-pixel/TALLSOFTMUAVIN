import React, { useState, useEffect, useRef } from "react";
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
  ShieldCheck,
  Sliders,
  Check,
  Code2,
  Trash2,
  X,
} from "lucide-react";
import { safeGetStorageItem, safeSetStorageItem } from "../utils/storage";
import { APP_BUILD_VERSION, resolveCentralUrl } from "../config/env";

export type GitHubTokenErrorCode =
  | "MISSING_TOKEN"
  | "INVALID_TOKEN"
  | "REPO_NOT_FOUND"
  | "TOKEN_READ_ONLY"
  | "NETWORK_ERROR";

export interface GitHubStatusData {
  initialized: boolean;
  branch: string;
  repoUrl: string;
  owner: string;
  repo: string;
  hasToken: boolean;
  maskedToken?: string;
  tokenCanPush?: boolean;
  tokenErrorCode?: GitHubTokenErrorCode;
  tokenPermissionWarning?: string;
  isClean: boolean;
  uncommittedCount: number;
  uncommittedFiles: string[];
  aheadCount?: number;
  behindCount?: number;
  lastCommit?: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: string;
  };
  remoteCommit?: {
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

function isLegacyExpiredToken(token: string): boolean {
  const clean = token.trim();
  return clean.startsWith("ghp_Y2c") && clean.endsWith("IzYx");
}

export const GitHubSyncPanel: React.FC<GitHubSyncPanelProps> = ({
  isModal = false,
  onSuccessNotification,
}) => {
  const [status, setStatus] = useState<GitHubStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [commitMessage, setCommitMessage] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [repoUrlInput, setRepoUrlInput] = useState("");
  const tokenInputRef = useRef<HTMLInputElement | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
    details?: string;
    workflowUrl?: string;
  } | null>(null);

  const getCleanSavedLocalToken = (): string => {
    const raw = (safeGetStorageItem("muavin_github_pat") || "").trim();
    if (!raw) return "";
    if (isLegacyExpiredToken(raw)) {
      safeSetStorageItem("muavin_github_pat", "");
      return "";
    }
    return raw;
  };

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch(resolveCentralUrl("/api/github/status"), {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const savedLocalToken = getCleanSavedLocalToken();
          const savedLocalRepo = (safeGetStorageItem("muavin_github_repo_url") || "").trim();

          if (!data.hasToken && savedLocalToken) {
            try {
              const cfgRes = await fetch(resolveCentralUrl("/api/github/config"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: savedLocalToken,
                  repoUrl: savedLocalRepo || data.repoUrl,
                }),
              });
              if (cfgRes.ok) {
                const refreshed = await fetch(resolveCentralUrl("/api/github/status"), {
                  cache: "no-store",
                });
                if (refreshed.ok) {
                  const refreshedData = await refreshed.json();
                  if (refreshedData.success) {
                    setStatus(refreshedData);
                    if (refreshedData.repoUrl) setRepoUrlInput(refreshedData.repoUrl);
                    if (!refreshedData.hasToken || refreshedData.tokenCanPush === false) {
                      setShowConfig(true);
                    }
                    return;
                  }
                }
              }
            } catch {
              // ignore restore hiccup
            }
          }

          setStatus(data);
          if (data.repoUrl) setRepoUrlInput(data.repoUrl);
          if (!data.hasToken || data.tokenCanPush === false) {
            setShowConfig(true);
          }
        }
      }
    } catch (err: any) {
      console.error("GitHub status fetch error:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    setCommitMessage(
      `feat: Merkezi veri mimarisi, cache-busting sürüm kontrolü, sabit bağımlılıklar ve göreceli yol yapısı (${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })})`
    );
  }, []);

  useEffect(() => {
    if (isModal && showConfig && (!status?.hasToken || status?.tokenCanPush === false)) {
      const timer = setTimeout(() => {
        tokenInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isModal, showConfig, status?.hasToken, status?.tokenCanPush]);

  const handlePull = async () => {
    setIsPulling(true);
    setFeedback(null);
    const effectiveToken = tokenInput.trim() || getCleanSavedLocalToken() || undefined;
    if (tokenInput.trim()) {
      safeSetStorageItem("muavin_github_pat", tokenInput.trim());
    }
    if (repoUrlInput.trim()) {
      safeSetStorageItem("muavin_github_repo_url", repoUrlInput.trim());
    }

    try {
      const res = await fetch(resolveCentralUrl("/api/github/pull"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: effectiveToken,
          repoUrl: repoUrlInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message:
            data.message ||
            "GitHub main dalındaki en güncel değişiklikler alındı ve çalışma alanıyla birleştirildi.",
          details: data.commitSha
            ? `Uzak Commit SHA: ${data.commitSha.substring(0, 7)} · Dal: main`
            : undefined,
        });
        if (onSuccessNotification) {
          onSuccessNotification("GitHub main dalındaki değişiklikler alındı ve birleştirildi.");
        }
        await fetchStatus();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "GitHub'dan değişiklikler alınırken bir hata oluştu.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Ağ hatası: Sunucuya ulaşılamadı.",
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setFeedback(null);
    const enteredToken = tokenInput.trim();
    const effectiveToken = enteredToken || getCleanSavedLocalToken() || undefined;

    if (enteredToken && !isLegacyExpiredToken(enteredToken)) {
      safeSetStorageItem("muavin_github_pat", enteredToken);
    }
    if (repoUrlInput.trim()) {
      safeSetStorageItem("muavin_github_repo_url", repoUrlInput.trim());
    }

    try {
      const res = await fetch(resolveCentralUrl("/api/github/publish"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitMessage: commitMessage.trim() || undefined,
          token: effectiveToken,
          repoUrl: repoUrlInput.trim() || undefined,
          pullFirst: true,
          rebuild: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (enteredToken) {
          setTokenInput("");
        }
        setFeedback({
          type: "success",
          message:
            data.message ||
            "GitHub main dalı birleştirildi, gönderildi ve GitHub Actions iş akışı tetiklendi.",
          details: data.commitSha
            ? `Commit SHA: ${data.commitSha.substring(0, 7)} · Dal: main · Actions: ${
                data.actionsTriggered !== false ? "Tetiklendi" : "Kontrol Edin"
              }`
            : undefined,
          workflowUrl: data.workflowRunUrl || data.actionsUrl || status?.actionsUrl,
        });
        if (onSuccessNotification) {
          onSuccessNotification(
            "Değişiklikler birleştirilerek GitHub main dalına gönderildi ve Actions tetiklendi."
          );
        }
        await fetchStatus();
      } else {
        setShowConfig(true);
        setFeedback({
          type: "error",
          message: data.error || data.message || "GitHub main dalına gönderim tamamlanamadı.",
          details:
            data.code === "TOKEN_READ_ONLY"
              ? "Token üzerinde 'Contents: Read and write' ve 'Actions / Workflows: Read and write' (veya klasik token için 'repo' + 'workflow') izinleri açık olmalıdır."
              : data.code === "INVALID_TOKEN" || data.code === "MISSING_TOKEN"
              ? "Lütfen aşağıdaki alana geçerli bir GitHub Personal Access Token (PAT) girip tekrar deneyin."
              : undefined,
        });
        await fetchStatus();
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
    const enteredToken = tokenInput.trim();
    const effectiveToken = enteredToken || getCleanSavedLocalToken() || undefined;

    try {
      const res = await fetch(resolveCentralUrl("/api/github/test-connection"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: effectiveToken,
          repoUrl: repoUrlInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (enteredToken && !isLegacyExpiredToken(enteredToken)) {
          safeSetStorageItem("muavin_github_pat", enteredToken);
          await fetch(resolveCentralUrl("/api/github/config"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: enteredToken,
              repoUrl: repoUrlInput.trim() || undefined,
            }),
          });
          setTokenInput("");
          await fetchStatus();
        }
        setFeedback({
          type: "success",
          message: `${data.message} (${data.repoName} · ${data.isPrivate ? "Özel Depo" : "Herkese Açık"})`,
        });
      } else {
        setFeedback({
          type: data.code === "TOKEN_READ_ONLY" ? "info" : "error",
          message: data.error || "Bağlantı doğrulanamadı. Token veya depo izinlerini kontrol edin.",
          details:
            data.code === "TOKEN_READ_ONLY"
              ? "GitHub > Settings > Developer settings > Personal access tokens ekranından 'Contents: Read and write' ve 'Workflows: Read and write' izinlerini açın."
              : undefined,
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
    setFeedback(null);
    const enteredToken = tokenInput.trim();
    if (enteredToken && !isLegacyExpiredToken(enteredToken)) {
      safeSetStorageItem("muavin_github_pat", enteredToken);
    }
    if (repoUrlInput.trim()) {
      safeSetStorageItem("muavin_github_repo_url", repoUrlInput.trim());
    }

    try {
      const res = await fetch(resolveCentralUrl("/api/github/config"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: enteredToken || getCleanSavedLocalToken() || undefined,
          repoUrl: repoUrlInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: "GitHub yapılandırması kaydedildi ve doğrulandı.",
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

  const handleClearToken = async () => {
    setIsSavingConfig(true);
    setFeedback(null);
    safeSetStorageItem("muavin_github_pat", "");
    setTokenInput("");
    try {
      await fetch(resolveCentralUrl("/api/github/config"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearToken: true }),
      });
      await fetchStatus();
      setShowConfig(true);
    } catch {
      // ignore clear error
    } finally {
      setIsSavingConfig(false);
    }
  };

  const needsTokenAttention =
    !tokenInput.trim() && (!status?.hasToken || status?.tokenCanPush === false);

  return (
    <div className="space-y-5">
      {!isModal && (
        <div className="rounded-xl p-6 bg-slate-900 text-white border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Önce Al & Birleştir</span>
                  <span aria-hidden="true">·</span>
                  <span>GitHub main Push</span>
                  <span aria-hidden="true">·</span>
                  <span>GitHub Actions</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  GitHub Birleştirmeli Gönderim ve Yayın Merkezi
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Önce GitHub <span className="font-mono text-emerald-400">main</span> dalındaki değişiklikleri alır, mevcut geliştirmelerinizle kayıpsız birleştirir ve GitHub Actions iş akışını tetikler.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? "animate-spin" : ""}`} />
              <span>Durumu Yenile</span>
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-opacity ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
              : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold">{feedback.message}</div>
            {feedback.details && (
              <div className="font-mono tabular-nums text-[11px] opacity-85 mt-1">{feedback.details}</div>
            )}
            {feedback.workflowUrl && (
              <div className="mt-2">
                <a
                  href={feedback.workflowUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline whitespace-nowrap"
                >
                  <span>GitHub Actions İş Akışını Görüntüle</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer shrink-0"
            aria-label="Bildirimi kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Hedef GitHub Deposu</span>
          </div>
          <div className="mt-2">
            <div className="font-bold text-xs truncate text-slate-900 dark:text-slate-100" title={status?.repo}>
              {status ? `${status.owner}/${status.repo}` : "Yükleniyor..."}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums mt-0.5">
              <GitBranch className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{status?.branch || "main"}</span>
              <span aria-hidden="true">·</span>
              <span>v{APP_BUILD_VERSION}</span>
            </div>
          </div>
          {status?.repoWebUrl && (
            <a
              href={status.repoWebUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Depoyu Aç</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Yayın ve CI/CD Kapsamı</span>
          </div>
          <div className="mt-2">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              GitHub main + Actions
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Önce uzak dal alınır · Üzerine birleştirilir
            </div>
          </div>
          {status?.actionsUrl && (
            <a
              href={status.actionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>GitHub Actions Ekranı</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Taahhüt ve Dal Durumu</span>
          </div>
          <div className="mt-2">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              {status?.behindCount
                ? `${status.behindCount} uzak commit birleştirilecek`
                : "Birleştirmeye ve göndermeye hazır"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums truncate">
              {status?.remoteCommit ? `origin/main: ${status.remoteCommit.shortSha}` : "origin/main okunuyor..."}
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
            {status?.lastSyncedAt
              ? `Son işlem: ${new Date(status.lastSyncedAt).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Henüz bu oturumda gönderilmedi"}
          </div>
        </div>
      </div>

      {status?.remoteCommit && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs">
          <div className="p-2 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            <GitCommit className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Uzak main: {status.remoteCommit.shortSha}
              </span>
              <span aria-hidden="true">·</span>
              <span>{status.remoteCommit.author}</span>
              {status.remoteCommit.date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(status.remoteCommit.date).toLocaleDateString("tr-TR")}</span>
                </>
              )}
            </div>
            <div className="font-medium text-slate-900 dark:text-slate-100 mt-1 truncate">
              {status.remoteCommit.message}
            </div>
          </div>
        </div>
      )}

      {/* Token & Repository Configuration Box (Auto-expands when token is missing, expired, or read-only) */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">GitHub Personal Access Token (PAT) ve Depo Yapılandırması</span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 whitespace-nowrap shrink-0 ml-2">
            {showConfig ? "Gizle" : "Göster / Düzenle"}
          </span>
        </button>

        {showConfig && (
          <div className="p-4 space-y-3.5 border-t border-slate-200 dark:border-slate-800 text-xs">
            {needsTokenAttention && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold">
                      {!status?.hasToken
                        ? "GitHub Gönderimi İçin Personal Access Token (PAT) Girin"
                        : status?.tokenErrorCode === "INVALID_TOKEN"
                        ? `Kayıtlı Token (${status?.maskedToken}) Geçersiz veya Süresi Dolmuş (HTTP 401)`
                        : status?.tokenErrorCode === "TOKEN_READ_ONLY"
                        ? `Kayıtlı Token (${status?.maskedToken}) Salt Okunur — Yazma İzni Kapalı (HTTP 403)`
                        : "GitHub Token Doğrulaması Gerekiyor"}
                    </div>
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      {status?.tokenPermissionWarning ||
                        "GitHub main dalına gönderim ve Actions tetikleme için 'repo' + 'workflow' (veya Fine-Grained için 'Contents: Read and write' + 'Workflows: Read and write') yetkili anahtarınızı aşağıya girin."}
                    </div>
                  </div>
                </div>
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>GitHub Token Oluştur</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                {status?.hasToken && status?.maskedToken && (
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    Kayıtlı: {status.maskedToken}
                  </span>
                )}
              </div>
              <input
                ref={tokenInputRef}
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={
                  status?.hasToken
                    ? "Yeni GitHub Personal Access Token (ghp_... veya github_pat_...) girin"
                    : "ghp_xxxxxxxxxxxxxxxxxxxx veya github_pat_xxxxxxxxxxxxxxxxxxxx"
                }
                autoComplete="off"
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Anahtarınızı girdikten sonra doğrudan aşağıdaki gönderim düğmesine basabilir veya önce bağlantıyı doğrulayabilirsiniz. Anahtar asla git geçmişine dahil edilmez.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Depo Adresi (Repository URL)
              </label>
              <input
                type="text"
                value={repoUrlInput}
                onChange={(e) => setRepoUrlInput(e.target.value)}
                placeholder="https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || isSavingConfig}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>Bağlantıyı Doğrula</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSavingConfig || isTesting}
                className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Anahtarı Kaydet</span>
              </button>

              {status?.hasToken && (
                <button
                  type="button"
                  onClick={handleClearToken}
                  disabled={isSavingConfig || isTesting}
                  className="px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kayıtlı Anahtarı Temizle</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Action Block: Merge + Push to main + Trigger Actions */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Taahhüt (Commit) Açıklaması
          </label>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Yayınlama açıklaması girin..."
            disabled={isPublishing || isPulling}
            className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Önce uzak <span className="font-mono">main</span> dalındaki değişiklikler alınıp mevcut çalışma alanıyla birleştirilir, ardından yalnızca GitHub <span className="font-mono">main</span> dalına gönderilir ve Actions tetiklenir.
          </p>
        </div>

        {(status?.hasToken && status?.tokenCanPush) || tokenInput.trim() ? (
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              {tokenInput.trim()
                ? "Yeni erişim anahtarı girildi · Gönderimle birlikte kaydedilecek ve doğrulanacak"
                : `GitHub main yazma ve Actions tetikleme yetkisi hazır (${status?.maskedToken})`}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || isPulling || isLoadingStatus}
            className="sm:col-span-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
                <span>Uzak main Alınıyor · Derleniyor ve Gönderiliyor...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-white shrink-0" />
                <span>Al, Birleştir ve GitHub'a Gönder (main + Actions)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePull}
            disabled={isPulling || isPublishing || isLoadingStatus}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {isPulling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                <span>Alınıyor...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sadece GitHub'dan Al</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Download className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              Temiz Proje Arşivi (ZIP)
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Kaynak kodların güncel yedeğini bilgisayarınıza indirmek için.
            </p>
          </div>
        </div>
        <a
          href="./muavin-project.zip"
          download="muavin-project.zip"
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <span>İndir</span>
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
