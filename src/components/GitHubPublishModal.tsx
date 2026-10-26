import React from "react";
import { X, UploadCloud } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { GitHubSyncPanel } from "./GitHubSyncPanel";

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotification?: (message: string) => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotification,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        style={{ color: theme.textPrimary }}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white relative overflow-hidden"
          style={{ backgroundColor: "#0f172a" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Yayınlama & GitHub Senkronizasyon Merkezi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Canlı CI/CD
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Proje değişikliklerini GitHub'a aktarın ve tallsoft.org dağıtımını tetikleyin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <GitHubSyncPanel
            isModal={true}
            onClose={onClose}
            onSuccessNotification={onSuccessNotification}
          />
        </div>
      </div>
    </div>
  );
};
