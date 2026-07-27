'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Locale, TranslationKey, getStaticPhraseMap } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  intlLocale: string;
  translateText: (text: string) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number | string | null | undefined, currency?: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('locale') as Locale) : null;
    if (stored && ['en', 'ar', 'sv'].includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  }, [locale]);

  // Translate legacy literal copy as well as catalogue-backed copy. This keeps
  // older screens language-consistent while they are gradually migrated to t().
  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;
    const phrases = getStaticPhraseMap(locale);
    // Form controls still need their visible option labels translated. Inputs
    // and textareas have no text-node content, while their placeholders are
    // handled below through the attribute pass.
    const ignored = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'PRE', 'CODE']);
    let applying = false;

    const replaceKnownPhrases = (value: string) => {
      let result = value;
      const keys = Array.from(phrases.keys())
        .filter((key) => key.trim().length > 1)
        .sort((a, b) => b.length - a.length);
      for (const key of keys) {
        const replacement = phrases.get(key);
        if (!replacement || replacement === key) continue;
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use boundaries for latin phrases so "All" cannot corrupt "Small"
        // or "AI" cannot be replaced inside an identifier. Arabic phrases
        // keep their exact substring behavior because word-boundaries do not
        // work reliably for Arabic text.
        const latinPhrase = /^[\u0000-\u007f]+$/.test(key);
        const pattern = latinPhrase
          ? `(?<![A-Za-z])${escaped}(?![A-Za-z])`
          : escaped;
        result = result.replace(new RegExp(pattern, 'g'), replacement);
      }
      return result;
    };

    const translate = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) nodes.push(node as Text);
      for (const textNode of nodes) {
        const parent = textNode.parentElement;
        if (!parent || ignored.has(parent.tagName) && parent.tagName !== 'OPTION') continue;
        const raw = textNode.nodeValue || '';
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const translated = replaceKnownPhrases(raw);
        if (translated !== raw) textNode.nodeValue = translated;
      }
      const elements = root instanceof Element
        ? [root, ...Array.from(root.querySelectorAll('*'))]
        : root instanceof Document
          ? Array.from(root.querySelectorAll('*'))
          : [];
      for (const element of elements) {
        for (const attr of ['placeholder', 'title', 'aria-label']) {
          const value = element.getAttribute(attr);
          const translated = value ? replaceKnownPhrases(value) : value;
          if (translated && translated !== value) element.setAttribute(attr, translated);
        }
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (applying) return;
      applying = true;
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target.parentNode) translate(mutation.target.parentNode);
        mutation.addedNodes.forEach((added) => translate(added));
      }
      applying = false;
    });
    applying = true;
    translate(document.body);
    applying = false;
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
    return () => observer.disconnect();
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  const t = (key: TranslationKey): string => {
    return (translations[locale] as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
  };

  const intlLocale = locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US';
  const translateText = (text: string) => {
    const map = getStaticPhraseMap(locale);
    return map.get(text) || text;
  };
  const formatDate = (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intlLocale, options).format(new Date(value));
  const formatTime = (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit', ...options }).format(new Date(value));
  const formatCurrency = (value: number | string | null | undefined, currency = 'SAR') =>
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, intlLocale, translateText, formatDate, formatTime, formatCurrency, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
