import React, { useEffect, useRef } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { useI18n } from './translations';

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ open, onAccept }) => {
  const { lang, setLang, t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="disclaimer-modal-title"
      aria-describedby="disclaimer-modal-body"
      {...({ closedby: 'none' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      onCancel={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.preventDefault();
      }}
      onClose={() => {
        if (open && dialogRef.current && !dialogRef.current.open) {
          dialogRef.current.showModal();
        }
      }}
      className="backdrop:bg-slate-950/80 backdrop:backdrop-blur-md bg-transparent p-0 m-auto max-w-lg w-[calc(100%-2rem)] rounded-2xl shadow-2xl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2
              id="disclaimer-modal-title"
              className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white"
            >
              {t.modals.disclaimer.title}
            </h2>
          </div>

          <div
            role="group"
            aria-label={t.nav.langSwitchLabel}
            className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 shrink-0"
          >
            <button
              type="button"
              onClick={() => setLang('tr')}
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
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all ${
                lang === 'en'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="p-6">
          <p
            id="disclaimer-modal-body"
            className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
          >
            {t.modals.disclaimer.body}
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onAccept}
            autoFocus
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/15 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>{t.modals.disclaimer.acceptBtn}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
