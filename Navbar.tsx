import React from 'react';
import { HelpCircle, ShieldCheck, Sun, Moon } from 'lucide-react';
import { SITE_CONFIG } from './site';
import { useI18n, Language } from './translations';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHowItWorks: () => void;
  onOpenSecurity: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenHowItWorks,
  onOpenSecurity,
}) => {
  const { lang, setLang, t } = useI18n();

  const toggleLanguage = (target: Language) => {
    setLang(target);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/75 bg-white/85 dark:bg-[#090d16]/85 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-15 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30">
            <svg viewBox="0 0 64 64" fill="none" className="w-5 h-5" aria-hidden="true">
              <path
                d="M32 8L52 19.5V44.5L32 56L12 44.5V19.5L32 8Z"
                stroke="#10B981"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <path
                d="M22 26L42 38M42 26L22 38"
                stroke="#38BDF8"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="32" cy="32" r="5.5" fill="#10B981" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-base sm:text-lg text-slate-900 dark:text-white">
            {SITE_CONFIG.name}
            <span className="text-emerald-600 dark:text-emerald-400">{SITE_CONFIG.domain}</span>
          </span>
        </div>

        {/* Right Controls: How It Works, Security, TR | EN, Dark/Light */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">{t.nav.howItWorks}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSecurity}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">{t.nav.security}</span>
          </button>

          <div
            role="group"
            aria-label={t.nav.langSwitchLabel}
            className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70"
          >
            <button
              type="button"
              onClick={() => toggleLanguage('tr')}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all ${
                lang === 'tr'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => toggleLanguage('en')}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all ${
                lang === 'en'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? t.nav.themeToggleLight : t.nav.themeToggleDark}
            aria-label={darkMode ? t.nav.themeToggleLight : t.nav.themeToggleDark}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/70 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
