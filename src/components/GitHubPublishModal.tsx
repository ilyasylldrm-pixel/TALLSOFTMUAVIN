import React from "react";
import { X, UploadCloud } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 flex items-center justify-between bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>GitHub main Dalı</span>
                <span aria-hidden="true">·</span>
                <span>GitHub Actions Dağıtımı</span>
              </div>
              <h2 className="text-base font-bold tracking-tight text-white truncate">
                GitHub Birleştirmeli Gönderim ve Yayın Merkezi
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
