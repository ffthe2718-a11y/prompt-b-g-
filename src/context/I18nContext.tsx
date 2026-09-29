import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "hi";

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  "hero.title": {
    en: "Top Salon & Hair Services.",
    hi: "बेस्ट सैलून और हेयर सर्विसेज।"
  },
  "hero.subtitle": {
    en: "Best Hair, Beard & Beauty Salons in Mumbai",
    hi: "मुंबई में बेहतरीन हेयर, बियर्ड और ब्यूटी सैलून"
  },
  "nav.home": {
    en: "Home",
    hi: "होम"
  },
  "nav.services": {
    en: "Services",
    hi: "सेवाएं"
  },
  "nav.gallery": {
    en: "Photos & Styles",
    hi: "फोटो और स्टाइल्स"
  },
  "nav.book": {
    en: "Book Appointment",
    hi: "अपॉइंटमेंट बुक करें"
  },
  "partner.title": {
    en: "Register Your Salon",
    hi: "अपना सैलून जोड़ें"
  },
  "admin.dashboard": {
    en: "Admin Dashboard",
    hi: "एडमिन डैशबोर्ड"
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("app_lang");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("app_lang", language);
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
