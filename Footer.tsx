import React from 'react';
import { Cpu, Shield, HardDrive, Radio, Lock, EyeOff } from 'lucide-react';
import { BrokerStatusInfo } from './signaling';
import { useI18n } from './translations';
import { SITE_CONFIG } from './site';

interface FooterProps {
  brokerStatus: BrokerStatusInfo;
}

export const Footer: React.FC<FooterProps> = ({ brokerStatus }) => {
  const { t } = useI18n();

  return (
    <footer className="mt-10 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#070a12]/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* 3 Compact Trust & Architecture Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/90">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                {t.cards.card1Title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.cards.card1Desc}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/90">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                {t.cards.card2Title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.cards.card2Desc}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/90">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
                <HardDrive className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                {t.cards.card3Title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.cards.card3Desc}
            </p>
          </div>
        </div>

        {/* Bottom Live Technical Status Bar */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* STUN Status Indicator */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t.footer.stunStatus}
            </span>

            {/* Active WSS Broker / Anti-Hijack Lock Indicator */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px]">
              {brokerStatus.locked ? (
                <>
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>{t.sender.roomLockedBadge}</span>
                </>
              ) : (
                <>
                  <Radio
                    className={`w-3 h-3 ${
                      brokerStatus.connected
                        ? 'text-emerald-500 animate-pulse'
                        : 'text-amber-500'
                    }`}
                  />
                  <span>
                    {t.footer.brokerStatus}{' '}
                    {brokerStatus.connected
                      ? t.footer.brokerConnected
                      : t.footer.brokerStandby}
                  </span>
                </>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <EyeOff className="w-3.5 h-3.5" />
              {t.footer.zeroCookieStatement}
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="font-mono text-slate-400">{SITE_CONFIG.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
