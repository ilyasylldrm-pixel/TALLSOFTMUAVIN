import React, { useState, useRef, useEffect, useCallback } from "react";
import { PuantajCode } from "../types";
import { PUANTAJ_CODE_CONFIG } from "../utils/puantajUtils";
import {
  ChevronUp,
  ChevronDown,
  Check,
  MousePointer,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface PuantajCategoryItem {
  code: PuantajCode;
  groupKey: "N" | "RT" | "YI_UI" | "DI" | "M_R";
  groupTitle: string;
  label: string;
  badgeLabel: string;
  shortDesc: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
}

export const PUANTAJ_SCROLL_GROUPS: {
  key: "N" | "RT" | "YI_UI" | "DI" | "M_R";
  title: string;
  badge: string;
  badgeColor: string;
  items: PuantajCategoryItem[];
}[] = [
  {
    key: "N",
    title: "Normal Çalışma (N)",
    badge: "N / HT",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    items: [
      {
        code: "N",
        groupKey: "N",
        groupTitle: "Normal Çalışma (N)",
        label: "Normal Çalışma",
        badgeLabel: "N",
        shortDesc: "Tam gün standart fiili çalışma (Standart Mesai)",
        badgeBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
        badgeText: "text-emerald-900",
        accentBorder: "border-emerald-300",
      },
      {
        code: "HT",
        groupKey: "N",
        groupTitle: "Normal Çalışma (N)",
        label: "Hafta Tatili",
        badgeLabel: "HT",
        shortDesc: "Cumartesi / Pazar kanuni dinlenme günü",
        badgeBg: "bg-purple-600 hover:bg-purple-700 text-white",
        badgeText: "text-purple-900",
        accentBorder: "border-purple-300",
      },
    ],
  },
  {
    key: "RT",
    title: "Resmi Tatil (RT)",
    badge: "RT",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
    items: [
      {
        code: "RT",
        groupKey: "RT",
        groupTitle: "Resmi Tatil (RT)",
        label: "Resmi Tatil / Bayram",
        badgeLabel: "RT",
        shortDesc: "Milli ve dini bayramlar (4857 S.K. Md. 47)",
        badgeBg: "bg-red-600 hover:bg-red-700 text-white",
        badgeText: "text-red-900",
        accentBorder: "border-red-300",
      },
    ],
  },
  {
    key: "YI_UI",
    title: "Ücretli İzin (Yİ+Üİ)",
    badge: "Yİ / Üİ",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    items: [
      {
        code: "Yİ",
        groupKey: "YI_UI",
        groupTitle: "Ücretli İzin (Yİ+Üİ)",
        label: "Yıllık Ücretli İzin",
        badgeLabel: "Yİ",
        shortDesc: "Kıdeme bağlı kanuni yıllık ücretli izin",
        badgeBg: "bg-teal-600 hover:bg-teal-700 text-white",
        badgeText: "text-teal-900",
        accentBorder: "border-teal-300",
      },
      {
        code: "Üİ",
        groupKey: "YI_UI",
        groupTitle: "Ücretli İzin (Yİ+Üİ)",
        label: "Ücretli Mazeret İzni",
        badgeLabel: "Üİ",
        shortDesc: "Evlilik, vefat, refakat, idari ücretli izin",
        badgeBg: "bg-blue-600 hover:bg-blue-700 text-white",
        badgeText: "text-blue-900",
        accentBorder: "border-blue-300",
      },
    ],
  },
  {
    key: "DI",
    title: "Doğum İzni (Dİ)",
    badge: "Dİ",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
    items: [
      {
        code: "Dİ",
        groupKey: "DI",
        groupTitle: "Doğum İzni (Dİ)",
        label: "Doğum & Babalık İzni",
        badgeLabel: "Dİ",
        shortDesc: "4857 S.K. Erkek Babalık (5 Gün) & Kadın Analık İzni",
        badgeBg: "bg-sky-600 hover:bg-sky-700 text-white",
        badgeText: "text-sky-900",
        accentBorder: "border-sky-300",
      },
    ],
  },
  {
    key: "M_R",
    title: "Eksik Gün (M+R)",
    badge: "M / R",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    items: [
      {
        code: "M",
        groupKey: "M_R",
        groupTitle: "Eksik Gün (M+R)",
        label: "Ücretsiz İzin / Mazeretsiz",
        badgeLabel: "M",
        shortDesc: "Maaş ve SGK kesintisi (Eksik gün bildirimi)",
        badgeBg: "bg-rose-600 hover:bg-rose-700 text-white",
        badgeText: "text-rose-900",
        accentBorder: "border-rose-300",
      },
      {
        code: "R",
        groupKey: "M_R",
        groupTitle: "Eksik Gün (M+R)",
        label: "Sıhhi İzin (Rapor)",
        badgeLabel: "R",
        shortDesc: "Sağlık kurulu/hekim istirahat raporu",
        badgeBg: "bg-amber-600 hover:bg-amber-700 text-white",
        badgeText: "text-amber-900",
        accentBorder: "border-amber-300",
      },
    ],
  },
];

// Tekerlek ve hızlı sıralı geçiş için sıralı kod listesi
export const PUANTAJ_CODE_SEQUENCE: PuantajCode[] = [
  "N",   // 1. Normal Çalışma (N)
  "HT",  // 1. Hafta Tatili
  "RT",  // 2. Resmi Tatil (RT)
  "Yİ",  // 3. Ücretli İzin (Yİ)
  "Üİ",  // 3. Ücretli İzin (Üİ)
  "Dİ",  // 4. Doğum İzni (Dİ)
  "M",   // 5. Eksik Gün (M - Ücretsiz İzin)
  "R",   // 5. Eksik Gün (R - Rapor)
];

interface PuantajScrollPickerProps {
  dayNum: number;
  dayName: string;
  code: PuantajCode;
  onChange: (newCode: PuantajCode) => void;
  isWeekend?: boolean;
  holidayName?: string | null;
  monthName?: string;
  badgeSize?: "sm" | "md";
  placement?: "top" | "bottom" | "auto";
}

export const PuantajScrollPicker: React.FC<PuantajScrollPickerProps> = ({
  dayNum,
  dayName,
  code,
  onChange,
  isWeekend = false,
  holidayName,
  monthName = "",
  badgeSize = "md",
  placement = "auto",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollListRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const cfg = PUANTAJ_CODE_CONFIG[code] || PUANTAJ_CODE_CONFIG["N"];

  // Dizi içindeki sırası
  const currentIndex = PUANTAJ_CODE_SEQUENCE.indexOf(code);

  // Bir sonraki koda geç (aşağıdan yukarı / ileri)
  const stepNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % PUANTAJ_CODE_SEQUENCE.length;
    onChange(PUANTAJ_CODE_SEQUENCE[nextIdx]);
  }, [currentIndex, onChange]);

  // Bir önceki koda geç (yukarıdan aşağı / geri)
  const stepPrev = useCallback(() => {
    const prevIdx =
      (currentIndex - 1 + PUANTAJ_CODE_SEQUENCE.length) % PUANTAJ_CODE_SEQUENCE.length;
    onChange(PUANTAJ_CODE_SEQUENCE[prevIdx]);
  }, [currentIndex, onChange]);

  // Fare tekerleğiyle (wheel scroll) aşağıdan yukarı / yukarıdan aşağı kaydırarak hızlı seçim
  useEffect(() => {
    const el = badgeRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Sayfanın veya modalın kaymasını engelle
      e.preventDefault();
      e.stopPropagation();

      if (e.deltaY < 0) {
        // Tekerlek yukarı kaydırıldı (aşağıdan yukarı hareket) -> sonraki kod
        stepNext();
      } else if (e.deltaY > 0) {
        // Tekerlek aşağı kaydırıldı -> önceki kod
        stepPrev();
      }
    };

    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNative);
    };
  }, [stepNext, stepPrev]);

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Menü açıldığında aktif öğeye otomatik odaklan/kaydır
  useEffect(() => {
    if (isOpen && scrollListRef.current) {
      const activeEl = scrollListRef.current.querySelector<HTMLElement>(`[data-code="${code}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [isOpen, code]);

  // Konumlandırma:
  // Dikey: 2. satır veya dayNum > 15 ise yukarı doğru aç (bottom-full), 1. satır ise aşağı doğru (top-full)
  const isUpward = placement === "top" || (placement === "auto" && dayNum > 15);

  // Yatay: Sol veya sağ kenarlara göre hizala
  const isRightAligned = (dayNum % 16 >= 11 && dayNum % 16 <= 15) || (dayNum >= 26);
  const isLeftAligned = (dayNum % 16 >= 1 && dayNum % 16 <= 4) || (dayNum <= 4);

  return (
    <div ref={containerRef} className="relative w-full flex items-center justify-center">
      {/* KOD ROZETİ & DİKEY SCROLL TEKERLEĞİ */}
      <div
        ref={badgeRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group/badge relative w-full ${
          badgeSize === "sm" ? "h-6 sm:h-7 text-xs" : "h-7 sm:h-8 text-xs sm:text-[13px]"
        } rounded-lg font-black flex items-center justify-between px-1 shadow-2xs cursor-pointer select-none transition-all active:scale-95 hover:ring-2 hover:ring-purple-400 hover:shadow-sm ${cfg.badgeClass}`}
        title={`${dayNum} ${monthName} (${dayName}) - ${cfg.label}.\n• Tıklayarak aşağıdan yukarı kaydırılabilir menüyü açın\n• Fare tekerleğiyle (scroll) anında değiştirin`}
      >
        {/* Sol mini ok (Önceki kod) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            stepPrev();
          }}
          className="opacity-0 group-hover/badge:opacity-90 hover:opacity-100 p-0.5 hover:bg-black/20 rounded transition-opacity cursor-pointer"
          title="Önceki puantaj durumu (Yukarı)"
        >
          <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
        </button>

        {/* Merkez Kod */}
        <span className="font-black tracking-wider flex-1 text-center">{code}</span>

        {/* Sağ mini ok (Sonraki kod) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            stepNext();
          }}
          className="opacity-0 group-hover/badge:opacity-90 hover:opacity-100 p-0.5 hover:bg-black/20 rounded transition-opacity cursor-pointer"
          title="Sonraki puantaj durumu (Aşağı)"
        >
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
        </button>
      </div>

      {/* AŞAĞIDAN YUKARI KAYDIRILABİLİR (SCROLLABLE) SEÇİM MENÜSÜ */}
      {isOpen && (
        <div
          className={`absolute ${
            isUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${
            isRightAligned
              ? "right-0"
              : isLeftAligned
              ? "left-0"
              : "left-1/2 -translate-x-1/2"
          } w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-purple-300 z-50 p-2.5 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                {dayNum}
              </div>
              <div>
                <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  {dayNum} {monthName} ({dayName})
                  {holidayName && (
                    <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold truncate max-w-[100px]">
                      {holidayName}
                    </span>
                  )}
                </h5>
                <p className="text-[9.5px] text-slate-500 font-medium">
                  Aşağıdan yukarı kaydırarak seçim yapın
                </p>
              </div>
            </div>

            <span className="text-[9px] bg-purple-50 text-purple-700 font-extrabold px-1.5 py-0.5 rounded border border-purple-200">
              Scroll Picker
            </span>
          </div>

          {/* HIZLI TEKERLEK ŞERİDİ (Yukarı / Aşağı Adımlama) */}
          <div className="flex items-center justify-between bg-purple-50/70 p-1.5 rounded-xl border border-purple-200 mb-2">
            <button
              type="button"
              onClick={stepPrev}
              className="px-2 py-1 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg text-[10px] font-bold text-purple-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronUp className="w-3 h-3 text-purple-600" />
              <span>Önceki Durum</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-600">Seçili:</span>
              <span className={`px-2 py-0.5 rounded-md font-black text-[11px] ${cfg.badgeClass}`}>
                {code} - {cfg.label.split(" ")[0]}
              </span>
            </div>

            <button
              type="button"
              onClick={stepNext}
              className="px-2 py-1 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg text-[10px] font-bold text-purple-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
            >
              <span>Sonraki Durum</span>
              <ChevronDown className="w-3 h-3 text-purple-600" />
            </button>
          </div>

          {/* SCROLLABLE CONTAINER (Aşağıdan yukarı kaydırılabilir liste) */}
          <div
            ref={scrollListRef}
            className="overflow-y-auto max-h-60 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent scroll-smooth"
          >
            {PUANTAJ_SCROLL_GROUPS.map((group) => {
              const hasActiveCode = group.items.some((item) => item.code === code);

              return (
                <div
                  key={group.key}
                  className={`rounded-xl border p-1.5 transition-all ${
                    hasActiveCode
                      ? "border-purple-300 bg-purple-50/50 shadow-2xs"
                      : "border-slate-200/80 bg-slate-50/40"
                  }`}
                >
                  {/* Grup Başlığı */}
                  <div className="flex items-center justify-between px-1 pb-1 mb-1 border-b border-black/5">
                    <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                      {group.title}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${group.badgeColor}`}
                    >
                      {group.badge}
                    </span>
                  </div>

                  {/* Gruptaki Seçenekler */}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isSelected = item.code === code;

                      return (
                        <button
                          key={item.code}
                          type="button"
                          data-code={item.code}
                          onClick={() => {
                            onChange(item.code);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white shadow-xs border border-purple-500 ring-2 ring-purple-400/20"
                              : "hover:bg-white hover:shadow-2xs border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-md font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs ${item.badgeBg}`}
                            >
                              {item.code}
                            </span>
                            <div className="min-w-0">
                              <div className="text-[11px] font-black text-slate-800 truncate">
                                {item.label}
                              </div>
                              <div className="text-[9px] text-slate-500 font-medium truncate">
                                {item.shortDesc}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <span className="text-[9px] font-extrabold text-slate-400 opacity-0 group-hover:opacity-100">
                              Seç
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Hint */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-medium px-1">
            <span className="flex items-center gap-1">
              <MousePointer className="w-3 h-3 text-purple-600" />
              Fare tekerleğiyle hızlıca kaydırabilirsiniz
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-purple-700 font-black hover:text-purple-900 cursor-pointer text-[10px]"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
