import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'tr' | 'en';

export interface Translations {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    howItWorks: string;
    security: string;
    zeroLogsBadge: string;
    themeToggleDark: string;
    themeToggleLight: string;
    langSwitchLabel: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    tabSend: string;
    tabReceive: string;
    dropOverlayTitle: string;
    dropOverlaySubtitle: string;
  };
  sender: {
    seedLabel: string;
    seedHint: string;
    copySeed: string;
    copiedSeed: string;
    regenerateSeed: string;
    showQr: string;
    hideQr: string;
    qrModalTitle: string;
    qrModalHint: string;
    selectFilesTitle: string;
    selectFilesSubtitle: string;
    browseFilesBtn: string;
    browseFolderBtn: string;
    queueTitle: string;
    clearQueue: string;
    emptyQueueHint: string;
    startTransferBtn: string;
    waitingForPeer: string;
    roomLockedBadge: string;
    folderBadge: string;
    zipStreamReady: string;
    filesSelected: string;
  };
  receiver: {
    seedInputLabel: string;
    seedInputPlaceholder: string;
    seedFormatHint: string;
    connectBtn: string;
    disconnectBtn: string;
    connectingBroker: string;
    waitingSenderOffer: string;
    connectedReady: string;
    incomingOfferTitle: string;
    acceptSaveDiskBtn: string;
    acceptRamFallbackBtn: string;
    autoStreamNotice: string;
    invalidSeedWarning: string;
  };
  telemetry: {
    panelTitle: string;
    statusLabel: string;
    securityBadgeValue: string;
    writeModeLabel: string;
    writeModeDisk: string;
    writeModeRam: string;
    progressLabel: string;
    speedLabel: string;
    etaLabel: string;
    chunksAckedLabel: string;
    topicHashLabel: string;
    fingerprintLabel: string;
    resumedFromChunk: string;
    pauseNoticeBackpressure: string;
    cancelTransfer: string;
    downloadAgain: string;
    transferComplete: string;
    authTagError: string;
  };
  clipboard: {
    title: string;
    subtitle: string;
    placeholder: string;
    sendBtn: string;
    copyBtn: string;
    copiedBtn: string;
    clearBtn: string;
    emptyState: string;
    sentTag: string;
    receivedTag: string;
    encryptedBadge: string;
  };
  status: {
    idle: string;
    connecting_broker: string;
    waiting_peer: string;
    handshaking: string;
    connected: string;
    transferring: string;
    paused_backpressure: string;
    completed: string;
    error: string;
  };
  errors: {
    cryptoUnsupported: string;
    brokerAllFailed: string;
    authTagMismatch: string;
    peerDisconnected: string;
    invalidSeed: string;
    fileWriteError: string;
    transferAborted: string;
  };
  cards: {
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
    card3Title: string;
    card3Desc: string;
  };
  footer: {
    stunStatus: string;
    brokerStatus: string;
    brokerConnected: string;
    brokerStandby: string;
    brokerFailover: string;
    zeroCookieStatement: string;
    cryptoSpec: string;
  };
  modals: {
    close: string;
    howItWorks: {
      title: string;
      subtitle: string;
      step1Title: string;
      step1Desc: string;
      step2Title: string;
      step2Desc: string;
      step3Title: string;
      step3Desc: string;
      step4Title: string;
      step4Desc: string;
      noteTitle: string;
      noteDesc: string;
    };
    security: {
      title: string;
      subtitle: string;
      arch1Title: string;
      arch1Desc: string;
      arch2Title: string;
      arch2Desc: string;
      arch3Title: string;
      arch3Desc: string;
      arch4Title: string;
      arch4Desc: string;
      packetHeaderTitle: string;
      zeroPersistenceTitle: string;
      zeroPersistenceDesc: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  tr: {
    meta: {
      title: 'ZeroSeed.io — Doğrudan, Şifreli ve Bulutsuz Dosya Paylaşımı',
      description:
        'Dosyalarınızı hiçbir sunucuya yüklemeden, tek kullanımlık bağlantı koduyla doğrudan cihazdan cihaza gönderin.',
    },
    nav: {
      howItWorks: 'Nasıl Çalışır?',
      security: 'Güvenlik',
      zeroLogsBadge: 'Bulutsuz & Kayıtsız Aktarım',
      themeToggleDark: 'Karanlık Görünüm',
      themeToggleLight: 'Aydınlık Görünüm',
      langSwitchLabel: 'Dil Seçimi',
    },
    hero: {
      badge: 'BULUTSUZ • UÇTAN UCA ŞİFRELİ • SINIRSIZ BOYUT',
      title: 'Dosyalarınızı Doğrudan Cihazdan Cihaza Gönderin',
      subtitle:
        'Hesap açmadan ve dosyalarınızı hiçbir yere yüklemeden, yalnızca ekrandaki bağlantı kodunu paylaşarak istediğiniz boyutta dosya veya klasör aktarın.',
      tabSend: 'Dosya Gönder',
      tabReceive: 'Dosya Al',
      dropOverlayTitle: 'Dosya veya Klasörleri Buraya Bırakın',
      dropOverlaySubtitle: 'Bıraktığınız dosyalar gönderim listesine hemen eklenir',
    },
    sender: {
      seedLabel: 'Tek Kullanımlık Bağlantı Kodunuz',
      seedHint:
        'Bu kodu dosyayı alacak kişiyle paylaşın veya QR kodu telefon kamerasıyla okutun.',
      copySeed: 'Kodu Kopyala',
      copiedSeed: 'Kopyalandı!',
      regenerateSeed: 'Yeni Kod',
      showQr: 'QR Kod',
      hideQr: 'QR Gizle',
      qrModalTitle: 'Telefon veya Tabletten Bağlanın',
      qrModalHint: 'Diğer cihazda "Dosya Al" sekmesini açıp bu kodu yazın.',
      selectFilesTitle: 'Gönderilecek Dosya veya Klasörleri Seçin',
      selectFilesSubtitle: 'Boyut sınırı yoktur • Klasörler tek paket halinde gönderilir',
      browseFilesBtn: 'Dosya Seç',
      browseFolderBtn: 'Klasör Seç',
      queueTitle: 'Gönderilecek Öğeler',
      clearQueue: 'Listeyi Temizle',
      emptyQueueHint: 'Henüz dosya seçilmedi. Yukarıdaki butonları kullanabilir veya dosyaları sayfaya sürükleyebilirsiniz.',
      startTransferBtn: 'Gönderimi Başlat',
      waitingForPeer: 'Alıcının kodu girmesi bekleniyor...',
      roomLockedBadge: 'Cihazlar Bağlandı',
      folderBadge: 'Klasör Paketi',
      zipStreamReady: 'Klasör Paketi Hazır',
      filesSelected: 'dosya seçildi',
    },
    receiver: {
      seedInputLabel: 'Göndericinin Bağlantı Kodunu Girin',
      seedInputPlaceholder: 'Örn: 8412-iron-forest-cloud',
      seedFormatHint: 'Gönderici ekranda görünen 4 rakam ve 3 kelimelik kodu buraya yazın.',
      connectBtn: 'Bağlan',
      disconnectBtn: 'Bağlantıyı Kes',
      connectingBroker: 'Bağlantı hazırlanıyor...',
      waitingSenderOffer: 'Gönderici cihaz aranıyor, lütfen bekleyin...',
      connectedReady: 'Bağlantı kuruldu! Göndericinin aktarımı başlatması bekleniyor.',
      incomingOfferTitle: 'Gelen Dosya Var',
      acceptSaveDiskBtn: 'Kayıt Yerini Seç ve İndir',
      acceptRamFallbackBtn: 'Kabul Et ve İndir',
      autoStreamNotice:
        'Büyük dosyalar bilgisayarınızın belleğini doldurmadan doğrudan seçtiğiniz klasöre kaydedilir.',
      invalidSeedWarning: 'Lütfen kodu eksiksiz girin (örn: 8412-iron-forest-cloud).',
    },
    telemetry: {
      panelTitle: 'Aktarım Durumu',
      statusLabel: 'Bağlantı Durumu',
      securityBadgeValue: 'Uçtan Uca Şifreli',
      writeModeLabel: 'Kayıt Yöntemi',
      writeModeDisk: 'Doğrudan Klasöre',
      writeModeRam: 'Standart İndirme',
      progressLabel: 'Aktarım İlerlemesi',
      speedLabel: 'Hız',
      etaLabel: 'Kalan Süre',
      chunksAckedLabel: 'Tamamlanan Parça',
      topicHashLabel: 'Bağlantı Kanalı',
      fingerprintLabel: 'Güvenlik Kodu',
      resumedFromChunk: 'Bağlantı yenilendi — Kaldığı yerden devam ediyor (#',
      pauseNoticeBackpressure: 'İnternet hızına göre akış dengeleniyor...',
      cancelTransfer: 'Aktarımı İptal Et',
      downloadAgain: 'Dosyayı Kaydet',
      transferComplete: 'Aktarım Başarıyla Tamamlandı!',
      authTagError: 'Güvenlik doğrulaması başarısız olduğu için aktarım durduruldu.',
    },
    clipboard: {
      title: 'Hızlı Metin & Not Paylaşımı',
      subtitle: 'Bağlı cihaza anında şifreli metin, bağlantı veya not gönderin',
      placeholder: 'Karşı cihaza göndermek istediğiniz metni veya bağlantıyı buraya yazın...',
      sendBtn: 'Gönder',
      copyBtn: 'Kopyala',
      copiedBtn: 'Kopyalandı',
      clearBtn: 'Temizle',
      emptyState: 'Henüz paylaşılan bir metin yok.',
      sentTag: 'Gönderildi',
      receivedTag: 'Gelen',
      encryptedBadge: 'Şifreli',
    },
    status: {
      idle: 'Hazır',
      connecting_broker: 'Hazırlanıyor...',
      waiting_peer: 'Karşı Cihaz Bekleniyor',
      handshaking: 'Cihazlar Eşleşiyor...',
      connected: 'Cihazlar Bağlandı',
      transferring: 'Dosya Aktarılıyor...',
      paused_backpressure: 'Hız Dengeleniyor...',
      completed: 'Aktarım Tamamlandı',
      error: 'Bağlantı Kesildi',
    },
    errors: {
      cryptoUnsupported: 'Tarayıcınız güvenli şifreleme özelliğini desteklemiyor.',
      brokerAllFailed: 'Bağlantı servisine ulaşılamadı. Lütfen internet bağlantınızı kontrol edin.',
      authTagMismatch: 'Dosya bütünlüğü doğrulanamadı, güvenliğinizi korumak için aktarım durduruldu.',
      peerDisconnected: 'Karşı cihazla bağlantı koptu. Aynı kodla tekrar bağlanarak kaldığınız yerden devam edebilirsiniz.',
      invalidSeed: 'Lütfen 4 rakam ve 3 kelimeden oluşan bağlantı kodunu eksiksiz yazın (örn: 8412-iron-forest-cloud).',
      fileWriteError: 'Dosya kaydetme işlemi iptal edildi.',
      transferAborted: 'Aktarım durduruldu.',
    },
    cards: {
      card1Title: 'Buluta Yükleme Yok',
      card1Desc:
        'Dosyalarınız hiçbir sunucuya yüklenmez veya depolanmaz. Doğrudan sizin tarayıcınızdan karşı tarafın tarayıcısına aktarılır.',
      card2Title: 'Tamamen Gizli ve Şifreli',
      card2Desc:
        'Aktarımı yalnızca ekrandaki kodu paylaştığınız kişi alabilir. İki cihaz birbirine bağlandığı anda bağlantı dışarıya kilitlenir.',
      card3Title: 'Sınırsız Boyut & Klasör Desteği',
      card3Desc:
        'Çok büyük videoları veya yüzlerce dosyalık klasörleri beklemeye gerek kalmadan, tek seferde kolayca gönderebilirsiniz.',
    },
    footer: {
      stunStatus: 'Doğrudan Aktarım: Hazır',
      brokerStatus: 'Eşleşme Servisi:',
      brokerConnected: 'Aktif',
      brokerStandby: 'Bağlanıyor...',
      brokerFailover: 'Yeniden Deneniyor',
      zeroCookieStatement: 'Çerez Yok • Hesap Yok • Geçmiş Kaydedilmez',
      cryptoSpec: 'Uçtan Uca Şifreli Doğrudan Bağlantı',
    },
    modals: {
      close: 'Kapat',
      howItWorks: {
        title: 'Nasıl Çalışır?',
        subtitle: '4 kolay adımda doğrudan ve güvenli dosya paylaşımı',
        step1Title: '1. Bağlantı Kodunu Paylaşın',
        step1Desc:
          'Sayfa açıldığında size özel rastgele bir bağlantı kodu oluşturulur. Bu kodu dosyayı göndereceğiniz kişiyle paylaşın.',
        step2Title: '2. Alıcı Kodu Girsin',
        step2Desc:
          'Alıcı kendi cihazında "Dosya Al" sekmesini açıp bu kodu yazar. İki cihaz saniyeler içinde birbirini bulur ve eşleşir.',
        step3Title: '3. Oda Otomatik Kilitlenir',
        step3Desc:
          'Cihazlarınız eşleştiği anda bağlantı kilitlenir; böylece üçüncü bir kişinin araya girmesi engellenir.',
        step4Title: '4. Dosyalar Doğrudan Aktarılır',
        step4Desc:
          'Seçtiğiniz dosya veya klasörler buluta yüklenmeden doğrudan alıcının cihazına indirilir. Bağlantı koparsa kaldığı yerden devam eder.',
        noteTitle: 'İpucu: Sayfayı Kapatmayın',
        noteDesc:
          'Dosyalar bulut sunucusu yerine doğrudan sizin cihazınızdan gönderildiği için aktarım bitene kadar her iki tarafın da sayfayı açık tutması gerekir.',
      },
      security: {
        title: 'Güvenliğiniz Nasıl Korunur?',
        subtitle: 'Teknik karmaşa olmadan bilmeniz gereken güvenlik ilkelerimiz',
        arch1Title: 'Otomatik Güvenli Kodlar',
        arch1Desc:
          'Tahmin edilebilir basit şifreler yerine her oturumda bilgisayarınız tarafından rastgele oluşturulan güvenli bir kod kullanılır.',
        arch2Title: 'Uçtan Uca Şifreleme (AES-256)',
        arch2Desc:
          'Gönderdiğiniz her dosya parçası ve metin mesajı cihazınızdan çıkmadan önce şifrelenir; yalnızca kodu verdiğiniz alıcı cihaz tarafından çözülebilir.',
        arch3Title: 'Koptuğu Yerden Devam Etme',
        arch3Desc:
          'Büyük bir dosya gönderirken internetiniz anlık kesilirse baştan başlamanıza gerek kalmaz; aynı kodla tekrar bağlandığınızda kaldığı yerden devam eder.',
        arch4Title: 'Hiçbir İz Bırakmaz',
        arch4Desc:
          'Bu sitede çerez (cookie), kullanıcı takibi veya dosya geçmişi tutulmaz. Sekmeyi kapattığınız anda tüm geçici bilgiler silinir.',
        packetHeaderTitle: 'Arka Planda Çalışan Koruma Katmanları',
        zeroPersistenceTitle: 'Sıfır Kayıt Garantisi',
        zeroPersistenceDesc:
          'Dosyalarınız hiçbir zaman bir sunucu diskine kaydedilmez; yalnızca iki tarayıcı arasında anlık ve şifreli olarak akar.',
      },
    },
  },
  en: {
    meta: {
      title: 'ZeroSeed.io — Direct, Encrypted & Cloud-Free File Sharing',
      description:
        'Send files and folders of any size directly between devices using a one-time code — no cloud uploads, no accounts.',
    },
    nav: {
      howItWorks: 'How It Works',
      security: 'Security',
      zeroLogsBadge: 'No Cloud • No Logs',
      themeToggleDark: 'Dark Theme',
      themeToggleLight: 'Light Theme',
      langSwitchLabel: 'Language Selection',
    },
    hero: {
      badge: 'NO CLOUD • END-TO-END ENCRYPTED • NO SIZE LIMITS',
      title: 'Send Files Directly Between Devices',
      subtitle:
        'Share files and folders of any size directly from your browser using a one-time connection code — no accounts, no cloud uploads, no waiting.',
      tabSend: 'Send Files',
      tabReceive: 'Receive Files',
      dropOverlayTitle: 'Drop Files or Folders Here',
      dropOverlaySubtitle: 'Your items will be added to the transfer list right away',
    },
    sender: {
      seedLabel: 'Your One-Time Connection Code',
      seedHint:
        'Share this code with the recipient or let them scan the QR code with their phone.',
      copySeed: 'Copy Code',
      copiedSeed: 'Copied!',
      regenerateSeed: 'New Code',
      showQr: 'QR Code',
      hideQr: 'Hide QR',
      qrModalTitle: 'Connect from Phone or Tablet',
      qrModalHint: 'Open the "Receive Files" tab on the other device and enter this code.',
      selectFilesTitle: 'Choose Files or Folders to Send',
      selectFilesSubtitle: 'No size limits • Folders are automatically bundled into a single download',
      browseFilesBtn: 'Select Files',
      browseFolderBtn: 'Select Folder',
      queueTitle: 'Selected Items',
      clearQueue: 'Clear List',
      emptyQueueHint: 'No files selected yet. Use the buttons above or drag and drop files anywhere on the page.',
      startTransferBtn: 'Start Sending',
      waitingForPeer: 'Waiting for recipient to enter the code...',
      roomLockedBadge: 'Devices Connected',
      folderBadge: 'Folder Bundle',
      zipStreamReady: 'Folder Package Ready',
      filesSelected: 'files selected',
    },
    receiver: {
      seedInputLabel: 'Enter Sender Connection Code',
      seedInputPlaceholder: 'e.g. 8412-iron-forest-cloud',
      seedFormatHint: 'Type the 4-digit and 3-word code shown on the sender screen.',
      connectBtn: 'Connect',
      disconnectBtn: 'Disconnect',
      connectingBroker: 'Preparing connection...',
      waitingSenderOffer: 'Looking for sender device, please wait...',
      connectedReady: 'Connected! Waiting for the sender to start the transfer.',
      incomingOfferTitle: 'Incoming File',
      acceptSaveDiskBtn: 'Choose Save Location & Download',
      acceptRamFallbackBtn: 'Accept & Download',
      autoStreamNotice:
        'Large files are saved directly to your chosen folder without filling up your device memory.',
      invalidSeedWarning: 'Please enter the complete connection code (e.g. 8412-iron-forest-cloud).',
    },
    telemetry: {
      panelTitle: 'Transfer Status',
      statusLabel: 'Connection Status',
      securityBadgeValue: 'End-to-End Encrypted',
      writeModeLabel: 'Save Method',
      writeModeDisk: 'Direct to Folder',
      writeModeRam: 'Standard Download',
      progressLabel: 'Transfer Progress',
      speedLabel: 'Speed',
      etaLabel: 'Time Left',
      chunksAckedLabel: 'Completed Parts',
      topicHashLabel: 'Channel',
      fingerprintLabel: 'Security Code',
      resumedFromChunk: 'Reconnected — Resuming from where it left off (#',
      pauseNoticeBackpressure: 'Adjusting to network speed...',
      cancelTransfer: 'Cancel Transfer',
      downloadAgain: 'Save File',
      transferComplete: 'Transfer Completed Successfully!',
      authTagError: 'Transfer stopped because security verification failed.',
    },
    clipboard: {
      title: 'Quick Text & Note Sharing',
      subtitle: 'Instantly send encrypted text, links, or notes to the connected device',
      placeholder: 'Type or paste a message or link to send to the other device...',
      sendBtn: 'Send',
      copyBtn: 'Copy',
      copiedBtn: 'Copied',
      clearBtn: 'Clear',
      emptyState: 'No messages shared yet.',
      sentTag: 'Sent',
      receivedTag: 'Received',
      encryptedBadge: 'Encrypted',
    },
    status: {
      idle: 'Ready',
      connecting_broker: 'Preparing...',
      waiting_peer: 'Waiting for Device',
      handshaking: 'Pairing Devices...',
      connected: 'Devices Connected',
      transferring: 'Transferring File...',
      paused_backpressure: 'Adjusting Speed...',
      completed: 'Completed',
      error: 'Disconnected',
    },
    errors: {
      cryptoUnsupported: 'Your browser does not support secure encryption.',
      brokerAllFailed: 'Could not reach the pairing service. Please check your internet connection.',
      authTagMismatch: 'File verification failed; the transfer was stopped to protect your security.',
      peerDisconnected: 'Connection lost. Reconnect with the same code to resume where you left off.',
      invalidSeed: 'Please enter the complete 4-digit and 3-word code (e.g. 8412-iron-forest-cloud).',
      fileWriteError: 'File save was cancelled.',
      transferAborted: 'Transfer cancelled.',
    },
    cards: {
      card1Title: 'No Cloud Uploads',
      card1Desc:
        'Your files are never uploaded to or stored on any server. They go straight from your browser to the recipient.',
      card2Title: 'Private & Encrypted',
      card2Desc:
        'Only the person with your one-time connection code can receive your files. Once connected, the session locks automatically.',
      card3Title: 'Unlimited Size & Folders',
      card3Desc:
        'Send huge videos or entire folders in one go without waiting for slow cloud uploads.',
    },
    footer: {
      stunStatus: 'Direct Transfer: Ready',
      brokerStatus: 'Pairing Service:',
      brokerConnected: 'Online',
      brokerStandby: 'Connecting...',
      brokerFailover: 'Reconnecting',
      zeroCookieStatement: 'No Cookies • No Accounts • No History Stored',
      cryptoSpec: 'End-to-End Encrypted Direct Transfer',
    },
    modals: {
      close: 'Close',
      howItWorks: {
        title: 'How It Works',
        subtitle: 'Direct and private file sharing in 4 simple steps',
        step1Title: '1. Share Your Connection Code',
        step1Desc:
          'When you open the page, a unique random code is created for you. Share this code with the person you want to send files to.',
        step2Title: '2. Recipient Enters the Code',
        step2Desc:
          'The recipient opens the "Receive Files" tab on their device and enters the code. Both devices pair within seconds.',
        step3Title: '3. Session Locks Automatically',
        step3Desc:
          'As soon as your devices connect, the room locks so no one else can join the transfer.',
        step4Title: '4. Files Transfer Directly',
        step4Desc:
          'Your files or folders stream straight to the recipient without touching the cloud. If the connection drops, it resumes where it left off.',
        noteTitle: 'Tip: Keep the Tab Open',
        noteDesc:
          'Because files are sent directly from your device without a cloud server, both sides should keep this page open until the transfer finishes.',
      },
      security: {
        title: 'How Your Privacy Is Protected',
        subtitle: 'Simple, transparent protection without the technical jargon',
        arch1Title: 'Automatic Secure One-Time Codes',
        arch1Desc:
          'Instead of weak passwords that strangers could guess, the app automatically creates a strong random code for every session.',
        arch2Title: 'End-to-End Encryption (AES-256)',
        arch2Desc:
          'Every piece of your file and every text message is locked before it leaves your device and can only be unlocked by the recipient.',
        arch3Title: 'Seamless Resume on Drops',
        arch3Desc:
          'If your Wi-Fi hiccups during a large file transfer, you do not have to start over — reconnecting with the same code continues right where it stopped.',
        arch4Title: 'Leaves Zero Trace',
        arch4Desc:
          'We never use cookies, analytics, or history logs. As soon as you close the tab, everything is wiped from memory.',
        packetHeaderTitle: 'Built-In Protection Layers',
        zeroPersistenceTitle: 'Zero Storage Guarantee',
        zeroPersistenceDesc:
          'Your files never sit on a company server — they flow directly and privately between your browsers.',
      },
    },
  },
};

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function detectInitialLanguage(): Language {
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
  }
  return 'en';
}

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => detectInitialLanguage());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.title = translations[lang].meta.title;
    }
  }, [lang]);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
  };

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t: translations[lang] } },
    children
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
