"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { DayOfWeek } from "@/data/types";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  dayNames,
  dictionaries,
  type Language,
} from "./dictionaries";

const STORAGE_KEY = "laferia.lang";

type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, params?: TranslateParams) => string;
  dayName: (day: DayOfWeek, length?: "long" | "short") => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value !== null && (LANGUAGES as readonly string[]).includes(value);
}

// A tiny external store backed by localStorage. useSyncExternalStore keeps the
// server and client renders consistent (server uses the default language) while
// reading the persisted choice on the client without a setState-in-effect.
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getStoredLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

function getServerLanguage(): Language {
  return DEFAULT_LANGUAGE;
}

function persistLanguage(lang: Language): void {
  window.localStorage.setItem(STORAGE_KEY, lang);
  for (const listener of listeners) listener();
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(
    subscribe,
    getStoredLanguage,
    getServerLanguage,
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    persistLanguage(next);
  }, []);

  const toggleLang = useCallback(() => {
    persistLanguage(lang === "es" ? "en" : "es");
  }, [lang]);

  const value = useMemo<I18nContextValue>(() => {
    const messages = dictionaries[lang];

    const t = (key: string, params?: TranslateParams) => {
      let text = messages[key] ?? key;
      if (params) {
        for (const [name, replacement] of Object.entries(params)) {
          text = text.replace(`{${name}}`, String(replacement));
        }
      }
      return text;
    };

    const dayName = (day: DayOfWeek, length: "long" | "short" = "long") =>
      dayNames[lang][day][length];

    return { lang, setLang, toggleLang, t, dayName };
  }, [lang, setLang, toggleLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
