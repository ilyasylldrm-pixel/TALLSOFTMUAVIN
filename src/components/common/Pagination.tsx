import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = "kayıt",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Sayfa numarası butonlarını üret (akıllı ellipsis ile)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-600 shadow-2xs select-none">
      {/* Sol: Toplam Bilgisi */}
      <div className="flex items-center gap-2 text-slate-500">
        <span>
          Toplam <strong className="text-slate-800 font-semibold">{totalItems.toLocaleString("tr-TR")}</strong> {itemLabel}tan{" "}
          <strong className="text-slate-800 font-semibold">{startItem} - {endItem}</strong> arası gösteriliyor
        </span>
      </div>

      {/* Sağ: Sayfa Boyutu & Navigasyon */}
      <div className="flex items-center gap-3">
        {/* Sayfa Boyutu Seçici */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="hidden md:inline">Sayfa Başına:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-purple-400 cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / sayfa
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sayfa Numaraları ve Oklar */}
        <div className="flex items-center gap-1">
          {/* İlk Sayfa */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors cursor-pointer"
            title="İlk Sayfa"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Önceki Sayfa */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors cursor-pointer"
            title="Önceki Sayfa"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Sayfa Numaraları */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={"dots-" + idx}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = Number(p);
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={"page-" + pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={"w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer " +
                    (isActive
                      ? "bg-[#351F62] text-white shadow-xs scale-105"
                      : "border border-slate-200 bg-white hover:bg-purple-50 hover:text-[#351F62] text-slate-700")}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Sonraki Sayfa */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors cursor-pointer"
            title="Sonraki Sayfa"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Son Sayfa */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors cursor-pointer"
            title="Son Sayfa"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
