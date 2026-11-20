import React, { useEffect, useRef } from 'react';
import { X, KeyRound, Radio, Lock, HardDrive, ShieldAlert } from 'lucide-react';
import { useI18n } from './translations';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ open, onClose }) => {
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

  const steps = [
    {
      icon: KeyRound,
      title: t.modals.howItWorks.step1Title,
      desc: t.modals.howItWorks.step1Desc,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Radio,
      title: t.modals.howItWorks.step2Title,
      desc: t.modals.howItWorks.step2Desc,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: Lock,
      title: t.modals.howItWorks.step3Title,
      desc: t.modals.howItWorks.step3Desc,
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    },
    {
      icon: HardDrive,
      title: t.modals.howItWorks.step4Title,
      desc: t.modals.howItWorks.step4Desc,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto max-w-2xl w-[calc(100%-2rem)] rounded-2xl shadow-2xl open:animate-in open:fade-in open:zoom-in-95"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t.modals.howItWorks.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.modals.howItWorks.subtitle}
            </p>
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

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-3.5">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3.5"
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 ${step.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {t.modals.howItWorks.noteTitle}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-200/80 mt-0.5 leading-relaxed">
                {t.modals.howItWorks.noteDesc}
              </p>
            </div>
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
