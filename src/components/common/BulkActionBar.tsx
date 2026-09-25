import React, { useState } from "react";
import {
  Trash2,
  FileSpreadsheet,
  FileText,
  X,
  CheckSquare,
  AlertTriangle,
  Download,
} from "lucide-react";

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  itemLabel?: string;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  customActions?: React.ReactNode;
  className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  itemLabel = "öğe",
  onClearSelection,
  onSelectAll,
  onDelete,
  deleteLabel = "Seçilenleri Sil",
  onExportExcel,
  onExportPdf,
  customActions,
  className = "",
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (selectedCount === 0) return null;

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete();
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Toplu silme hatası:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={`sticky top-2 z-30 mb-3 flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 rounded-xl bg-slate-900/95 text-white shadow-xl backdrop-blur-md border border-slate-700/80 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${className}`}
        role="region"
        aria-label="Toplu İşlem Çubuğu"
      >
        {/* Left: Selection Counter & Clear button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-600/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm">
            <CheckSquare className="w-4 h-4 text-indigo-200 shrink-0" />
            <span>
              <strong className="text-white font-black">{selectedCount}</strong> {itemLabel} seçildi
            </span>
          </div>

          {totalCount && totalCount > selectedCount && onSelectAll && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Tümünü seç ({totalCount})
            </button>
          )}

          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 px-2 py-1 rounded-md transition-colors cursor-pointer"
            title="Seçimi Temizle"
          >
            <X className="w-3.5 h-3.5" />
            <span>Vazgeç</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {customActions}

          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="Seçilen satırları Excel (.xlsx) olarak indir"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Seçilenleri Excel'e Aktar</span>
            </button>
          )}

          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="Seçilen satırları PDF olarak indir"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Seçilenleri PDF'e Aktar</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700/80 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 border border-rose-500/50"
              title={`${selectedCount} seçili kaydı sil`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteLabel} ({selectedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Toplu Silme Onayı
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Seçtiğiniz <strong className="text-rose-600 dark:text-rose-400 font-bold">{selectedCount}</strong> adet {itemLabel} kaydını silmek istediğinize emin misiniz?
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Bu işlem geri alınamaz ve seçilen kayıtlar kalıcı olarak silinecektir.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Siliniyor..." : `Evet, ${selectedCount} Kaydı Sil`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
