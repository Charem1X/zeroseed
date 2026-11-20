import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck, Cpu, Binary, EyeOff, CheckCircle2 } from 'lucide-react';
import { useI18n } from './translations';

interface SecurityModalProps {
  open: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ open, onClose }) => {
  const { t } = useI18n();
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
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto max-w-3xl w-[calc(100%-2rem)] rounded-2xl shadow-2xl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t.modals.security.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.modals.security.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.modals.close}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 4 Simple Security Pillar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Cpu className="w-4 h-4" />
                {t.modals.security.arch1Title}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">
                {t.modals.security.arch1Desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-400">
                <Binary className="w-4 h-4" />
                {t.modals.security.arch2Title}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">
                {t.modals.security.arch2Desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400">
                <CheckCircle2 className="w-4 h-4" />
                {t.modals.security.arch3Title}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">
                {t.modals.security.arch3Desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <EyeOff className="w-4 h-4" />
                {t.modals.security.arch4Title}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">
                {t.modals.security.arch4Desc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {t.modals.security.zeroPersistenceTitle}
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-200/80 mt-0.5 leading-relaxed">
              {t.modals.security.zeroPersistenceDesc}
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-emerald-600 text-white hover:opacity-90 transition-opacity"
          >
            {t.modals.close}
          </button>
        </div>
      </div>
    </dialog>
  );
};
