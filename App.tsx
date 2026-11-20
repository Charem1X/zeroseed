import React, { useState, useEffect } from 'react';
import { I18nProvider } from './translations';
import { usePeerTransfer } from './usePeerTransfer';
import { Navbar } from './Navbar';
import { TransferWorkspace } from './TransferWorkspace';
import { HowItWorksModal } from './HowItWorksModal';
import { SecurityModal } from './SecurityModal';
import { Footer } from './Footer';

const ZeroSeedAppContent: React.FC = () => {
  // Volatile in-memory theme state (never persisted to localStorage or cookies)
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false);
  const [securityOpen, setSecurityOpen] = useState<boolean>(false);

  const transfer = usePeerTransfer();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <div>
        <Navbar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          onOpenHowItWorks={() => setHowItWorksOpen(true)}
          onOpenSecurity={() => setSecurityOpen(true)}
        />
        <TransferWorkspace transfer={transfer} />
      </div>

      <Footer brokerStatus={transfer.brokerStatus} />

      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
      <SecurityModal
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <ZeroSeedAppContent />
    </I18nProvider>
  );
};

export default App;
