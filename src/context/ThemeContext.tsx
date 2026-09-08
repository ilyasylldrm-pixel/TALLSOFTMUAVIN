import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ThemeConfig {
  id: string;
  name: string;
  // Sidebar
  sidebarBg: string;
  sidebarText: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
  sidebarBorder: string;
  // Header / Navbar
  headerBg: string;
  headerText: string;
  headerBorder: string;
  // Main Page & Cards
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  // Primary / Brand Accent
  primaryColor: string;
  primaryHover: string;
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: "modern-purple",
    name: "Referans Modern (Lila & Beyaz)",
    sidebarBg: "#0f172a",
    sidebarText: "#94a3b8",
    sidebarActiveBg: "#8252f6",
    sidebarActiveText: "#ffffff",
    sidebarBorder: "#1e293b",
    headerBg: "#ffffff",
    headerText: "#0f172a",
    headerBorder: "#f1f5f9",
    pageBg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#f1f5f9",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    primaryColor: "#8252f6",
    primaryHover: "#703ee5",
  },
  {
    id: "classic-corporate",
    name: "Klasik Kurumsal (Lacivert)",
    sidebarBg: "#172554",
    sidebarText: "#93c5fd",
    sidebarActiveBg: "#2563eb",
    sidebarActiveText: "#ffffff",
    sidebarBorder: "#1e3a8a",
    headerBg: "#ffffff",
    headerText: "#0f172a",
    headerBorder: "#e2e8f0",
    pageBg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    primaryColor: "#2563eb",
    primaryHover: "#1d4ed8",
  },
  {
    id: "minimal-light",
    name: "Minimal Açık (Full Light)",
    sidebarBg: "#ffffff",
    sidebarText: "#475569",
    sidebarActiveBg: "#f1f5f9",
    sidebarActiveText: "#0f172a",
    sidebarBorder: "#e2e8f0",
    headerBg: "#ffffff",
    headerText: "#0f172a",
    headerBorder: "#e2e8f0",
    pageBg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    primaryColor: "#7c3aed",
    primaryHover: "#6d28d9",
  },
  {
    id: "dark-mode",
    name: "Karanlık Gece (Dark OLED)",
    sidebarBg: "#090d16",
    sidebarText: "#94a3b8",
    sidebarActiveBg: "#8252f6",
    sidebarActiveText: "#ffffff",
    sidebarBorder: "#1e293b",
    headerBg: "#0f172a",
    headerText: "#f8fafc",
    headerBorder: "#1e293b",
    pageBg: "#090d16",
    cardBg: "#0f172a",
    cardBorder: "#1e293b",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    primaryColor: "#a855f7",
    primaryHover: "#9333ea",
  },
  {
    id: "emerald-business",
    name: "Zümrüt Finans (Yeşil)",
    sidebarBg: "#064e3b",
    sidebarText: "#a7f3d0",
    sidebarActiveBg: "#059669",
    sidebarActiveText: "#ffffff",
    sidebarBorder: "#065f46",
    headerBg: "#ffffff",
    headerText: "#0f172a",
    headerBorder: "#e2e8f0",
    pageBg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    primaryColor: "#059669",
    primaryHover: "#047857",
  },
];

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (newTheme: Partial<ThemeConfig>) => void;
  setPreset: (presetId: string) => void;
  resetTheme: () => void;
  presets: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "tallsoft_theme_config";

export function applyThemeToDocument(theme: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.style.setProperty("--theme-sidebar-bg", theme.sidebarBg);
  root.style.setProperty("--theme-sidebar-text", theme.sidebarText);
  root.style.setProperty("--theme-sidebar-active-bg", theme.sidebarActiveBg);
  root.style.setProperty("--theme-sidebar-active-text", theme.sidebarActiveText);
  root.style.setProperty("--theme-sidebar-border", theme.sidebarBorder);

  root.style.setProperty("--theme-header-bg", theme.headerBg);
  root.style.setProperty("--theme-header-text", theme.headerText);
  root.style.setProperty("--theme-header-border", theme.headerBorder);

  root.style.setProperty("--theme-page-bg", theme.pageBg);
  root.style.setProperty("--theme-card-bg", theme.cardBg);
  root.style.setProperty("--theme-card-border", theme.cardBorder);
  root.style.setProperty("--theme-text-primary", theme.textPrimary);
  root.style.setProperty("--theme-text-secondary", theme.textSecondary);

  root.style.setProperty("--theme-primary", theme.primaryColor);
  root.style.setProperty("--theme-primary-hover", theme.primaryHover);

  if (theme.id === "dark-mode") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.sidebarBg) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("Tema yüklenemedi:", err);
      }
    }
    return THEME_PRESETS[0];
  });

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = (updates: Partial<ThemeConfig>) => {
    setThemeState((prev) => ({
      ...prev,
      ...updates,
      id: "custom",
      name: "Özel Tema",
    }));
  };

  const setPreset = (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setThemeState(found);
    }
  };

  const resetTheme = () => {
    setThemeState(THEME_PRESETS[0]);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        setPreset,
        resetTheme,
        presets: THEME_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
