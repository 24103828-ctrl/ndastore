import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language } from '../utils/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations['VN']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Initialize from localStorage or default to 'VN'
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved === 'VN' || saved === 'EN') ? saved : 'VN';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: keyof typeof translations['VN']) => {
        return translations[language][key] || key; // Fallback to key if not found
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
