'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, useTransition } from 'react';
import { locales } from '@/i18n';

const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
] as const;

interface LanguageSwitcherProps {
    variant?: 'default' | 'minimal' | 'dropdown';
    className?: string;
}

export function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchLocale = (newLocale: string) => {
        setIsOpen(false);

        // Usar startTransition para navegación no bloqueante
        startTransition(() => {
            // El pathname de usePathname() de @/lib/navigation ya viene SIN el locale
            // Solo necesitamos usar router.replace con el nuevo locale
            // scroll: false evita que salte al inicio de la página
            router.replace(pathname, { locale: newLocale as typeof locales[number], scroll: false });
        });
    };

    const currentLanguage = languages.find(l => l.code === locale) || languages[0];

    // Variant: Minimal (just flags)
    if (variant === 'minimal') {
        return (
            <div className={`flex items-center gap-1 ${className}`}>
                {languages.map((lang) => (
                    <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => switchLocale(lang.code)}
                        className={`text-lg transition-all ${locale === lang.code
                            ? 'opacity-100 scale-110'
                            : 'opacity-50 hover:opacity-80'
                            }`}
                        aria-label={`Switch to ${lang.name}`}
                        aria-current={locale === lang.code ? 'true' : undefined}
                    >
                        {lang.flag}
                    </motion.button>
                ))}
            </div>
        );
    }

    // Variant: Dropdown
    if (variant === 'dropdown') {
        return (
            <div ref={dropdownRef} className={`relative ${className}`}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium transition-all"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <Globe className="w-4 h-4" />
                    <span>{currentLanguage.flag}</span>
                    <span className="hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                        role="listbox"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => switchLocale(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${locale === lang.code
                                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                role="option"
                                aria-selected={locale === lang.code}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.name}</span>
                                {locale === lang.code && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="ml-auto text-emerald-500"
                                    >
                                        ✓
                                    </motion.span>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>
        );
    }

    // Default variant: Toggle buttons
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <Globe className="w-4 h-4 text-white/70" />
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full p-0.5 border border-white/20">
                {languages.map((lang) => (
                    <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => switchLocale(lang.code)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${locale === lang.code
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        aria-label={`Switch to ${lang.name}`}
                        aria-current={locale === lang.code ? 'true' : undefined}
                    >
                        <span className="mr-1">{lang.flag}</span>
                        {lang.code.toUpperCase()}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

export default LanguageSwitcher;
