import React from 'react';
import { HelpCircle, ShieldCheck, Sun, Moon, Lock } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#090d16]/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-900 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
            <svg
              viewBox="0 0 64 64"
              fill="none"
              className="w-6 h-6"
              aria-hidden="true"
            >
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
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#090d16]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">
                {SITE_CONFIG.name}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {SITE_CONFIG.domain}
                </span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <Lock className="w-3 h-3" />
                E2EE
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
              {t.nav.zeroLogsBadge}
            </p>
          </div>
        </div>

        {/* Right Controls: How It Works, Security, TR | EN, Dark/Light */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">{t.nav.howItWorks}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSecurity}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">{t.nav.security}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* One-Click TR | EN Switcher (Zero Cookie / In-Memory State) */}
          <div
            role="group"
            aria-label={t.nav.langSwitchLabel}
            className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70"
          >
            <button
              type="button"
              onClick={() => toggleLanguage('tr')}
              className={`px-2 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
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
              className={`px-2 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                lang === 'en'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* Dark / Light Theme Toggle */}
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
