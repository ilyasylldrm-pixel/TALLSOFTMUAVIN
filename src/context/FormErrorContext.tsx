import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";

export interface FormErrorInfo {
  id: string;
  message: string;
  title?: string;
  fieldName?: string;
  timestamp: number;
}

interface FormErrorContextType {
  errors: FormErrorInfo[];
  triggerError: (message: string, title?: string, fieldName?: string) => void;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
}

const FormErrorContext = createContext<FormErrorContextType | undefined>(undefined);

// Helper function that dispatches a custom event so any non-React code can trigger the notification
export function triggerFormErrorNotification(message: string, title?: string, fieldName?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("muavin:form-error", {
        detail: { message, title, fieldName },
      })
    );
  }
}

export const FormErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<FormErrorInfo[]>([]);

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((err) => err.id !== id));
  }, []);

  const triggerError = useCallback((message: string, title?: string, fieldName?: string) => {
    const id = "err_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    const newError: FormErrorInfo = {
      id,
      message,
      title: title || "Form Doğrulama Uyarısı",
      fieldName,
      timestamp: Date.now(),
    };

    setErrors((prev) => {
      // Avoid identical duplicates within 1 second
      const isDuplicate = prev.some(
        (e) => e.message === message && Date.now() - e.timestamp < 1200
      );
      if (isDuplicate) return prev;
      return [...prev.slice(-4), newError]; // Keep max 5 visible toasts
    });

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      removeError(id);
    }, 5000);
  }, [removeError]);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Listen to custom event muavin:form-error
  useEffect(() => {
    const handleCustomError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.message) {
        triggerError(detail.message, detail.title, detail.fieldName);
      }
    };

    window.addEventListener("muavin:form-error", handleCustomError);
    return () => {
      window.removeEventListener("muavin:form-error", handleCustomError);
    };
  }, [triggerError]);

  // Global HTML5 invalid form control interceptor
  useEffect(() => {
    const handleInvalid = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (!target) return;

      // Prevent standard browser tooltip popup
      e.preventDefault();

      let fieldLabel = target.name || target.id || "";
      // Try to find an associated label
      if (target.id) {
        const labelElem = document.querySelector(`label[for="${target.id}"]`);
        if (labelElem && labelElem.textContent) {
          fieldLabel = String(labelElem.textContent || "").trim().replace(/\*$/, "").trim();
        }
      }
      if (!fieldLabel && target.parentElement) {
        const labelElem = target.parentElement.querySelector("label");
        if (labelElem && labelElem.textContent) {
          fieldLabel = String(labelElem.textContent || "").trim().replace(/\*$/, "").trim();
        }
      }

      let validationMessage = target.validationMessage;
      if (target.validity.valueMissing) {
        validationMessage = fieldLabel
          ? `"${fieldLabel}" alanı zorunludur. Lütfen doldurunuz.`
          : "Lütfen bu zorunlu alanı doldurunuz.";
      } else if (target.validity.typeMismatch) {
        if (target.type === "email") {
          validationMessage = "Lütfen geçerli bir e-posta adresi giriniz.";
        } else if (target.type === "url") {
          validationMessage = "Lütfen geçerli bir web adresi (URL) giriniz.";
        }
      } else if (target.validity.rangeUnderflow || target.validity.rangeOverflow) {
        const inputEl = target as HTMLInputElement;
        const rangeText = inputEl.min && inputEl.max ? ` (${inputEl.min} - ${inputEl.max})` : "";
        validationMessage = `Değer izin verilen sınırlar dışında${rangeText}.`;
      }

      triggerError(validationMessage, "Form Doğrulama Hatası", fieldLabel || undefined);

      // Focus the field with visual ring
      try {
        target.focus();
        target.classList.add("ring-2", "ring-[#b91c1c]", "border-[#b91c1c]");
        setTimeout(() => {
          target.classList.remove("ring-2", "ring-[#b91c1c]");
        }, 3000);
      } catch {
        // ignore
      }
    };

    document.addEventListener("invalid", handleInvalid, true);
    return () => {
      document.removeEventListener("invalid", handleInvalid, true);
    };
  }, [triggerError]);

  return (
    <FormErrorContext.Provider value={{ errors, triggerError, removeError, clearAllErrors }}>
      {children}

      {/* HAZE FINANCIAL PASTEL CRIMSON (error-crimson) POP-UP NOTIFICATIONS */}
      {errors.length > 0 && (
        <div
          id="haze-form-error-toast-container"
          className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-none"
          aria-live="assertive"
        >
          {errors.map((err) => (
            <div
              key={err.id}
              id={`error-toast-${err.id}`}
              className="haze-form-error-toast pointer-events-auto rounded-2xl shadow-xl border border-[#fecdd3] p-4 flex items-start gap-3 backdrop-blur-md transition-all select-none"
              style={{
                backgroundColor: "rgba(255, 226, 229, 0.95)", // Pastel error-crimson container
                color: "#7f1d1d", // Deep crimson text for high contrast
                boxShadow: "0 12px 28px -6px rgba(185, 28, 28, 0.22), 0 4px 10px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div className="shrink-0 w-8 h-8 rounded-xl bg-[#fee2e2] border border-[#fca5a5] flex items-center justify-center text-[#b91c1c]">
                <AlertCircle className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#991b1b]">
                    {err.title || "Form Doğrulama Hatası"}
                  </h4>
                  {err.fieldName && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fecdd3] text-[#881337]">
                      {err.fieldName}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 text-[#7f1d1d] font-semibold leading-relaxed break-words">
                  {err.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeError(err.id)}
                className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[#991b1b] hover:text-[#7f1d1d] hover:bg-[#b91c1c]/10 transition-colors cursor-pointer"
                title="Bildirimi Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </FormErrorContext.Provider>
  );
};

export function useFormError() {
  const context = useContext(FormErrorContext);
  if (!context) {
    throw new Error("useFormError must be used within a FormErrorProvider");
  }
  return context;
}
