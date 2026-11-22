import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from './translations';

interface FooterProps {
  fingerprint?: string;
}

export const Footer: React.FC<FooterProps> = ({ fingerprint }) => {
  const { t } = useI18n();

  return (
    <footer className="mt-8 border-t border-slate-200/70 dark:border-slate-800/70 py-5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {t.footer.summary}
        </span>

        {fingerprint && (
          <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
            {t.telemetry.fingerprintLabel}: <strong className="text-emerald-600 dark:text-emerald-400">{fingerprint}</strong>
          </span>
        )}
      </div>
    </footer>
  );
};
