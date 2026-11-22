/**
 * ZeroSeed.io — Production Browser Bundle (Compiled from src/*)
 * Includes:
 * - src/config/site.ts (SITE_CONFIG)
 * - src/i18n/translations.ts (TR / EN dictionaries, navigator.language auto-detect, zero-cookie state)
 * - src/utils/seedCrypto.ts (CSPRNG 44-bit ASCII Seed, SHA-256 128-bit Blind Topic, PBKDF2 150k AES-GCM-256)
 * - src/utils/signaling.ts (WSS MQTT v3.1.1 3-broker 3s failover, Encrypted SDP/ICE, Anti-Hijack Room Lock)
 * - src/utils/fileWriter.ts (FileSystemWritableFileStream Direct-to-Disk + RAM Blob fallback)
 * - src/utils/folderStream.ts (webkitGetAsEntry recursive folder scanner + streaming ZIP archive generator)
 * - src/hooks/usePeerTransfer.ts & UI Components (Navbar, TransferWorkspace, HowItWorksModal, SecurityModal, Footer)
 */
(function () {
  'use strict';

  // ============================================================================
  // 1. SITE_CONFIG (src/config/site.ts)
  // ============================================================================
  const SITE_CONFIG = {
    name: 'ZeroSeed',
    domain: '.io',
    fullName: 'ZeroSeed.io',
    version: 'v1.4.0-e2ee',
    protocolNamespace: 'p2p-io/v1',
    keyDerivationDomain: 'p2p-e2ee-key-v1',
    pbkdf2Iterations: 150000,
    chunkSize: 65536, // 64 KB
    ackIntervalChunks: 16,
    maxBufferedAmount: 4 * 1024 * 1024,
    lowBufferedThreshold: 1 * 1024 * 1024,
    brokerTimeoutMs: 3000,
    maxSignalBytes: 65536,
    signalFreshnessMs: 60000,
    maxSeenSignalNonces: 512,
    maxBrokerFailoverAttempts: 6,
    maxPendingIceCandidates: 64,
    maxSdpLength: 32768,
    maxIceCandidateLength: 2048,
    maxRamFileBytes: 512 * 1024 * 1024,
    maxClipboardChars: 65536,
    maxClipboardItems: 50,
    maxArchiveDepth: 32,
    maxArchiveEntries: 10000,
    stunServers: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ],
    mqttBrokers: [
      { name: 'HiveMQ Public WSS', url: 'wss://broker.hivemq.com:8884/mqtt' },
      { name: 'EMQX Public WSS', url: 'wss://broker.emqx.io:8084/mqtt' },
      { name: 'Mosquitto Public WSS', url: 'wss://test.mosquitto.org:8081/mqtt' },
    ],
  };

  // ============================================================================
  // 2. TRANSLATIONS (src/i18n/translations.ts — Simplified, User-Friendly)
  // ============================================================================
  const TRANSLATIONS = {
    tr: {
      meta: {
        title: 'ZeroSeed.io — Doğrudan, Şifreli ve Bulutsuz Dosya Paylaşımı',
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
        resumedFromChunk: 'Bağlantı yenilendi — Kaldığı yerden devam ediyor: #',
        pauseNoticeBackpressure: 'İnternet hızına göre akış dengeleniyor...',
        cancelTransfer: 'Aktarımı İptal Et',
        downloadAgain: 'Dosyayı Kaydet',
        transferComplete: 'Aktarım Başarıyla Tamamlandı!',
      },
      clipboard: {
        title: 'Hızlı Metin & Not Paylaşımı',
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
        zeroCookieStatement: 'Çerez Yok • Hesap Yok • Geçmiş Kaydedilmez',
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
        resumedFromChunk: 'Reconnected — Resuming from where it left off: #',
        pauseNoticeBackpressure: 'Adjusting to network speed...',
        cancelTransfer: 'Cancel Transfer',
        downloadAgain: 'Save File',
        transferComplete: 'Transfer Completed Successfully!',
      },
      clipboard: {
        title: 'Quick Text & Note Sharing',
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
        zeroCookieStatement: 'No Cookies • No Accounts • No History Stored',
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

  function detectInitialLanguage() {
    if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
      return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
    }
    return 'en';
  }

  // ============================================================================
  // 3. SEED CRYPTO & DUAL DERIVATION (src/utils/seedCrypto.ts)
  // ============================================================================
  const ASCII_WORD_POOL = [
    'acid', 'acorn', 'actor', 'adept', 'agate', 'agent', 'alarm', 'album',
    'alert', 'alibi', 'alloy', 'alpha', 'amber', 'amend', 'anchor', 'angel',
    'ankle', 'anvil', 'apple', 'april', 'apron', 'arena', 'argon', 'armor',
    'arrow', 'ascot', 'aspen', 'atlas', 'attic', 'audio', 'audit', 'avail',
    'avenue', 'avid', 'axiom', 'azure', 'badge', 'baker', 'balm', 'banjo',
    'barge', 'baron', 'basil', 'basin', 'batch', 'bison', 'blade', 'blank',
    'blast', 'blaze', 'blend', 'bliss', 'block', 'bloom', 'board', 'acacia',
    'bonus', 'booth', 'boron', 'boxer', 'brain', 'brake', 'brand', 'brass',
    'brave', 'bread', 'brick', 'bride', 'brief', 'brisk', 'brook', 'brush',
    'cabin', 'cable', 'cactus', 'cadet', 'camel', 'canal', 'candy', 'canoe',
    'canon', 'cargo', 'carol', 'carve', 'cedar', 'chain', 'chair', 'chalk',
    'charm', 'chart', 'chase', 'chess', 'chief', 'chili', 'chime', 'china',
    'cider', 'civic', 'claim', 'clamp', 'cliff', 'cloak', 'clock', 'cloud',
    'clove', 'coach', 'coast', 'cobra', 'cocoa', 'comet', 'coral', 'acrid',
    'craft', 'crane', 'crate', 'creek', 'crest', 'crisp', 'crown', 'crush',
    'cubic', 'curve', 'cycle', 'dairy', 'daisy', 'dance', 'datum', 'dawn',
    'delta', 'demon', 'denim', 'depot', 'depth', 'derby', 'digit', 'diner',
    'disco', 'diver', 'donor', 'dowry', 'draft', 'drain', 'drama', 'dream',
    'dress', 'drift', 'drill', 'drive', 'drone', 'druid', 'dusk', 'eagle',
    'earth', 'ebony', 'echo', 'edict', 'elder', 'elect', 'elite', 'ember',
    'envoy', 'epoch', 'equal', 'equip', 'ethos', 'event', 'exact', 'fable',
    'facet', 'faith', 'feast', 'fiber', 'field', 'fifth', 'film', 'final',
    'flame', 'flask', 'fleet', 'flint', 'float', 'flock', 'flora', 'flute',
    'focus', 'forge', 'forum', 'found', 'frame', 'fresh', 'front', 'frost',
    'fruit', 'fudge', 'gamma', 'gauge', 'gavel', 'giant', 'glade', 'glass',
    'gleam', 'glide', 'globe', 'glory', 'glove', 'grace', 'grade', 'grain',
    'grand', 'grant', 'grape', 'graph', 'grasp', 'grass', 'gravel', 'green',
    'grief', 'grill', 'grove', 'guard', 'guest', 'guide', 'guild', 'habit',
    'haven', 'hazel', 'heart', 'heavy', 'hedge', 'helix', 'heron', 'hoist',
    'honey', 'honor', 'horse', 'hotel', 'hound', 'house', 'human', 'humor',
    'husky', 'ideal', 'igloo', 'image', 'index', 'inlet', 'input', 'iron',
    'ivory', 'jade', 'jewel', 'joint', 'jolly', 'judge', 'juice', 'karma',
  ];

  function generateRandomSeed() {
    const uint16 = new Uint16Array(1);
    const range = 9000;
    const maxUnbiased = Math.floor(65536 / range) * range;
    do {
      window.crypto.getRandomValues(uint16);
    } while (uint16[0] >= maxUnbiased);
    const num = 1000 + (uint16[0] % range);

    const wordBytes = new Uint8Array(3);
    window.crypto.getRandomValues(wordBytes);
    const len = ASCII_WORD_POOL.length;
    return (
      num +
      '-' +
      ASCII_WORD_POOL[wordBytes[0] % len] +
      '-' +
      ASCII_WORD_POOL[wordBytes[1] % len] +
      '-' +
      ASCII_WORD_POOL[wordBytes[2] % len]
    );
  }

  function normalizeSeed(seed) {
    return String(seed || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  function isValidSeedFormat(seed) {
    if (typeof seed !== 'string' || seed.length > 64) return false;
    return /^\d{4}-[a-z]{2,12}-[a-z]{2,12}-[a-z]{2,12}$/.test(normalizeSeed(seed));
  }

  function bufferToHex(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  function generateRandomHex(byteLength) {
    const bytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(bytes);
    return bufferToHex(bytes);
  }

  function createSessionIvPrefix() {
    const prefix = new Uint8Array(8);
    window.crypto.getRandomValues(prefix);
    return prefix;
  }

  function uint8ToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToUint8(base64) {
    let binary;
    try {
      binary = atob(base64);
    } catch (_e) {
      throw new Error('Invalid base64 payload');
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function deriveDualKeys(rawSeed) {
    const normalizedSeed = normalizeSeed(rawSeed);
    const encoder = new TextEncoder();
    const seedBytes = encoder.encode(normalizedSeed);

    const sha256Digest = await window.crypto.subtle.digest('SHA-256', seedBytes);
    const first128Bits = new Uint8Array(sha256Digest, 0, 16);
    const topicHashHex = bufferToHex(first128Bits);
    const topicId = SITE_CONFIG.protocolNamespace + '/' + topicHashHex;

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      seedBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const domainSalt = encoder.encode(SITE_CONFIG.keyDerivationDomain);
    const masterBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: domainSalt,
        iterations: SITE_CONFIG.pbkdf2Iterations,
        hash: 'SHA-256',
      },
      baseKey,
      256
    );

    const hkdfKey = await window.crypto.subtle.importKey(
      'raw',
      masterBits,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    const signalKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: first128Bits,
        info: encoder.encode('zeroseed-signal-v1'),
      },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const transferKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: first128Bits,
        info: encoder.encode('zeroseed-transfer-v1'),
      },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const fpDigest = await window.crypto.subtle.digest(
      'SHA-256',
      encoder.encode(normalizedSeed + '::p2p-visual-fp-v1')
    );
    const fpHex = bufferToHex(new Uint8Array(fpDigest, 0, 4)).toUpperCase();
    const fingerprint = fpHex.slice(0, 4) + '-' + fpHex.slice(4, 8);

    return {
      normalizedSeed: normalizedSeed,
      topicHashHex: topicHashHex,
      topicId: topicId,
      signalKey: signalKey,
      transferKey: transferKey,
      aesKey: transferKey,
      fingerprint: fingerprint,
    };
  }

  async function encryptJsonPayload(key, payload, aadContext) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(payload));
    const additionalData = encoder.encode(aadContext);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv, additionalData: additionalData, tagLength: 128 },
      key,
      encoded
    );
    const cipherBytes = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(12 + cipherBytes.byteLength);
    combined.set(iv, 0);
    combined.set(cipherBytes, 12);
    return uint8ToBase64(combined);
  }

  async function decryptJsonPayload(key, base64Packet, aadContext) {
    if (typeof base64Packet !== 'string' || base64Packet.length > 131072) {
      throw new Error('Encrypted payload exceeds maximum size');
    }
    const combined = base64ToUint8(base64Packet);
    if (combined.byteLength < 28) throw new Error('Malformed encrypted packet');
    const iv = combined.subarray(0, 12);
    const ciphertextWithTag = combined.subarray(12);
    const additionalData = new TextEncoder().encode(aadContext);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv, additionalData: additionalData, tagLength: 128 },
      key,
      ciphertextWithTag
    );
    return JSON.parse(new TextDecoder().decode(decryptedBuffer));
  }

  async function encryptChunkPacket(key, chunkIndex, plainChunk, fileId, sessionIvPrefix) {
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex > 0xffffffff) {
      throw new Error('Invalid chunk index');
    }
    if (plainChunk.byteLength > SITE_CONFIG.chunkSize) {
      throw new Error('Chunk exceeds maximum allowed size');
    }
    const prefix =
      sessionIvPrefix && sessionIvPrefix.byteLength === 8
        ? sessionIvPrefix
        : createSessionIvPrefix();
    const iv = new Uint8Array(12);
    iv.set(prefix, 0);
    new DataView(iv.buffer).setUint32(8, chunkIndex, false);
    const additionalData = new TextEncoder().encode('zs-chunk-v1:' + fileId + ':' + chunkIndex);

    const ciphertextWithTag = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv, additionalData: additionalData, tagLength: 128 },
      key,
      plainChunk
    );
    const packet = new ArrayBuffer(4 + 12 + ciphertextWithTag.byteLength);
    const view = new DataView(packet);
    const packetBytes = new Uint8Array(packet);
    view.setUint32(0, chunkIndex, false); // 4-byte Big-Endian chunkIndex
    packetBytes.set(iv, 4); // 12-byte IV
    packetBytes.set(new Uint8Array(ciphertextWithTag), 16); // Ciphertext + 16-byte GCM Auth Tag
    return packet;
  }

  const MAX_CHUNK_PACKET_BYTES = 4 + 12 + SITE_CONFIG.chunkSize + 16;

  async function decryptChunkPacket(key, packet, fileId) {
    if (packet.byteLength < 32 || packet.byteLength > MAX_CHUNK_PACKET_BYTES) {
      const err = new Error('AuthTagMismatch');
      err.isAuthTagError = true;
      throw err;
    }
    const view = new DataView(packet);
    const chunkIndex = view.getUint32(0, false);
    const iv = new Uint8Array(packet, 4, 12);
    const ciphertextWithTag = new Uint8Array(packet, 16);
    const additionalData = new TextEncoder().encode('zs-chunk-v1:' + fileId + ':' + chunkIndex);
    try {
      const plainBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv, additionalData: additionalData, tagLength: 128 },
        key,
        ciphertextWithTag
      );
      return { chunkIndex: chunkIndex, data: new Uint8Array(plainBuffer) };
    } catch (_e) {
      const err = new Error('AuthTagMismatch at chunk ' + chunkIndex);
      err.isAuthTagError = true;
      throw err;
    }
  }

  // ============================================================================
  // 4. BLIND SIGNALING OVER WSS MQTT (src/utils/signaling.ts)
  // ============================================================================
  function encodeRemainingLength(length) {
    const bytes = [];
    let x = length;
    do {
      let encodedByte = x % 128;
      x = Math.floor(x / 128);
      if (x > 0) encodedByte = encodedByte | 0x80;
      bytes.push(encodedByte);
    } while (x > 0);
    return bytes;
  }

  function decodeRemainingLength(data, startIndex) {
    let multiplier = 1;
    let value = 0;
    let idx = startIndex;
    let encodedByte = 0;
    do {
      if (idx >= data.byteLength) return null;
      encodedByte = data[idx++];
      value += (encodedByte & 127) * multiplier;
      if (multiplier > 128 * 128 * 128) return null;
      multiplier *= 128;
    } while ((encodedByte & 128) !== 0);
    return { value: value, bytesUsed: idx - startIndex };
  }

  function encodeMqttUtf8(str) {
    const utf8 = new TextEncoder().encode(str);
    const out = new Uint8Array(2 + utf8.byteLength);
    out[0] = (utf8.byteLength >> 8) & 0xff;
    out[1] = utf8.byteLength & 0xff;
    out.set(utf8, 2);
    return out;
  }

  function buildMqttConnectPacket(clientId, keepAliveSec) {
    const protoName = encodeMqttUtf8('MQTT');
    const clientIdBytes = encodeMqttUtf8(clientId);
    const remainingLen = protoName.byteLength + 4 + clientIdBytes.byteLength;
    const remBytes = encodeRemainingLength(remainingLen);
    const packet = new Uint8Array(1 + remBytes.length + remainingLen);
    let offset = 0;
    packet[offset++] = 0x10;
    for (let i = 0; i < remBytes.length; i++) packet[offset++] = remBytes[i];
    packet.set(protoName, offset);
    offset += protoName.byteLength;
    packet[offset++] = 0x04;
    packet[offset++] = 0x02;
    packet[offset++] = (keepAliveSec >> 8) & 0xff;
    packet[offset++] = keepAliveSec & 0xff;
    packet.set(clientIdBytes, offset);
    return packet;
  }

  function buildMqttSubscribePacket(packetId, topic) {
    const topicBytes = encodeMqttUtf8(topic);
    const remainingLen = 2 + topicBytes.byteLength + 1;
    const remBytes = encodeRemainingLength(remainingLen);
    const packet = new Uint8Array(1 + remBytes.length + remainingLen);
    let offset = 0;
    packet[offset++] = 0x82;
    for (let i = 0; i < remBytes.length; i++) packet[offset++] = remBytes[i];
    packet[offset++] = (packetId >> 8) & 0xff;
    packet[offset++] = packetId & 0xff;
    packet.set(topicBytes, offset);
    offset += topicBytes.byteLength;
    packet[offset] = 0x00;
    return packet;
  }

  function buildMqttUnsubscribePacket(packetId, topic) {
    const topicBytes = encodeMqttUtf8(topic);
    const remainingLen = 2 + topicBytes.byteLength;
    const remBytes = encodeRemainingLength(remainingLen);
    const packet = new Uint8Array(1 + remBytes.length + remainingLen);
    let offset = 0;
    packet[offset++] = 0xa2;
    for (let i = 0; i < remBytes.length; i++) packet[offset++] = remBytes[i];
    packet[offset++] = (packetId >> 8) & 0xff;
    packet[offset++] = packetId & 0xff;
    packet.set(topicBytes, offset);
    return packet;
  }

  function buildMqttPublishPacket(topic, payloadStr) {
    const topicBytes = encodeMqttUtf8(topic);
    const payloadBytes = new TextEncoder().encode(payloadStr);
    const remainingLen = topicBytes.byteLength + payloadBytes.byteLength;
    const remBytes = encodeRemainingLength(remainingLen);
    const packet = new Uint8Array(1 + remBytes.length + remainingLen);
    let offset = 0;
    packet[offset++] = 0x30;
    for (let i = 0; i < remBytes.length; i++) packet[offset++] = remBytes[i];
    packet.set(topicBytes, offset);
    offset += topicBytes.byteLength;
    packet.set(payloadBytes, offset);
    return packet;
  }

  class BlindSignalingChannel {
    constructor(opts) {
      this.opts = opts;
      this.ws = null;
      this.keepAliveInterval = null;
      this.currentBrokerIndex = 0;
      this.failoverCount = 0;
      this.isRoomLocked = false;
      this.isDestroyed = false;
      this.isMqttConnected = false;
      this.failoverTimer = null;
      this.seenNonces = new Set();
      this.clientId = 'zs_' + generateRandomHex(8);
    }

    getSenderId() {
      return this.clientId;
    }

    isLocked() {
      return this.isRoomLocked;
    }

    connect() {
      if (this.isDestroyed || this.isRoomLocked) return;
      this.tryBroker(0);
    }

    tryBroker(index) {
      if (this.isDestroyed || this.isRoomLocked) return;
      const brokers = SITE_CONFIG.mqttBrokers;
      if (index >= brokers.length) {
        this.opts.onAllBrokersFailed();
        return;
      }

      this.currentBrokerIndex = index;
      const broker = brokers[index];
      this.cleanupSocketOnly();
      this.emitStatus(false);

      let settled = false;
      this.failoverTimer = setTimeout(() => {
        if (!settled && !this.isDestroyed && !this.isRoomLocked) {
          settled = true;
          this.failoverCount += 1;
          this.tryBroker(index + 1);
        }
      }, SITE_CONFIG.brokerTimeoutMs);

      try {
        const ws = new WebSocket(broker.url, 'mqtt');
        ws.binaryType = 'arraybuffer';
        this.ws = ws;

        ws.onopen = () => {
          if (this.isDestroyed || this.isRoomLocked) {
            ws.close();
            return;
          }
          ws.send(buildMqttConnectPacket(this.clientId + '_' + index, 25));
        };

        ws.onmessage = async (event) => {
          if (this.isDestroyed || this.isRoomLocked) return;
          const raw =
            event.data instanceof ArrayBuffer
              ? new Uint8Array(event.data)
              : event.data instanceof Blob
              ? new Uint8Array(await event.data.arrayBuffer())
              : null;
          if (!raw || raw.byteLength < 2 || raw.byteLength > SITE_CONFIG.maxSignalBytes * 2) return;

          let offset = 0;
          while (offset < raw.byteLength) {
            const headerByte = raw[offset];
            const packetType = headerByte & 0xf0;
            const remInfo = decodeRemainingLength(raw, offset + 1);
            if (!remInfo) break;

            const bodyStart = offset + 1 + remInfo.bytesUsed;
            const bodyEnd = bodyStart + remInfo.value;
            if (bodyEnd > raw.byteLength) break;

            const body = raw.subarray(bodyStart, bodyEnd);
            offset = bodyEnd;

            if (packetType === 0x20) {
              if (body[1] === 0x00) {
                ws.send(buildMqttSubscribePacket(1, this.opts.topicId));
              } else {
                this.triggerFailover(index, settled);
                return;
              }
            } else if (packetType === 0x90) {
              settled = true;
              this.isMqttConnected = true;
              this.clearTimer();
              this.startKeepAlive(ws);
              this.emitStatus(true);
            } else if (packetType === 0x30) {
              if (body.byteLength < 2) continue;
              const topicLen = (body[0] << 8) | body[1];
              if (body.byteLength < 2 + topicLen) continue;
              const topicStr = new TextDecoder().decode(body.subarray(2, 2 + topicLen));
              const qos = (headerByte >> 1) & 0x03;
              const payloadStart = 2 + topicLen + (qos > 0 ? 2 : 0);
              if (topicStr !== this.opts.topicId || payloadStart > body.byteLength) continue;
              const payloadBytes = body.subarray(payloadStart);
              if (payloadBytes.byteLength > SITE_CONFIG.maxSignalBytes) continue;
              await this.handleRawTopicPayload(payloadBytes);
            }
          }
        };

        ws.onerror = () => {
          if (!this.isDestroyed && !this.isRoomLocked) this.triggerFailover(index, settled);
        };
        ws.onclose = () => {
          if (!this.isDestroyed && !this.isRoomLocked) this.triggerFailover(index, settled);
        };
      } catch (_e) {
        this.triggerFailover(index, settled);
      }
    }

    triggerFailover(index, wasSettled) {
      if (this.isDestroyed || this.isRoomLocked) return;
      this.clearTimer();
      this.cleanupSocketOnly();
      this.failoverCount += 1;
      if (this.failoverCount >= SITE_CONFIG.maxBrokerFailoverAttempts) {
        this.isDestroyed = true;
        this.opts.onAllBrokersFailed();
        return;
      }
      if (!wasSettled) {
        this.tryBroker(index + 1);
      } else {
        this.tryBroker((index + 1) % SITE_CONFIG.mqttBrokers.length);
      }
    }

    async handleRawTopicPayload(payloadBytes) {
      try {
        const text = new TextDecoder().decode(payloadBytes);
        const envelope = JSON.parse(text);
        if (
          !envelope ||
          envelope.v !== 1 ||
          typeof envelope.senderId !== 'string' ||
          !/^zs_[0-9a-f]{16}$/.test(envelope.senderId) ||
          envelope.senderId === this.clientId ||
          typeof envelope.p !== 'string' ||
          envelope.p.length > 96000
        ) {
          return;
        }
        const aadContext = 'zs-signal-v1:' + this.opts.topicId + ':' + envelope.senderId;
        const decrypted = await decryptJsonPayload(this.opts.aesKey, envelope.p, aadContext);
        if (
          !decrypted ||
          decrypted.sessionId !== envelope.senderId ||
          typeof decrypted.timestamp !== 'number' ||
          !Number.isFinite(decrypted.timestamp) ||
          Math.abs(Date.now() - decrypted.timestamp) > SITE_CONFIG.signalFreshnessMs ||
          typeof decrypted.nonce !== 'string' ||
          !/^[0-9a-f]{24}$/.test(decrypted.nonce) ||
          this.seenNonces.has(decrypted.nonce)
        ) {
          return;
        }
        if (this.seenNonces.size >= SITE_CONFIG.maxSeenSignalNonces) {
          const oldest = this.seenNonces.values().next().value;
          if (oldest !== undefined) this.seenNonces.delete(oldest);
        }
        this.seenNonces.add(decrypted.nonce);
        this.opts.onSignal(decrypted, envelope.senderId);
      } catch (_e) {
        // Ignore unauthenticated or replayed noise
      }
    }

    async publishEncrypted(payload) {
      if (
        this.isDestroyed ||
        this.isRoomLocked ||
        !this.ws ||
        this.ws.readyState !== WebSocket.OPEN ||
        !this.isMqttConnected
      ) {
        return;
      }
      const fullPayload = Object.assign({}, payload, {
        nonce: generateRandomHex(12),
        timestamp: Date.now(),
      });
      const aadContext = 'zs-signal-v1:' + this.opts.topicId + ':' + this.clientId;
      const encryptedBase64 = await encryptJsonPayload(this.opts.aesKey, fullPayload, aadContext);
      const envelope = { v: 1, senderId: this.clientId, p: encryptedBase64 };
      this.ws.send(buildMqttPublishPacket(this.opts.topicId, JSON.stringify(envelope)));
    }

    lockRoomAndDisconnect() {
      if (this.isRoomLocked) return;
      this.isRoomLocked = true;
      this.clearTimer();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(buildMqttUnsubscribePacket(2, this.opts.topicId));
          this.ws.send(new Uint8Array([0xe0, 0x00]));
        } catch (_e) {}
      }
      this.cleanupSocketOnly();
      this.emitStatus(false);
    }

    destroy() {
      this.isDestroyed = true;
      this.clearTimer();
      this.cleanupSocketOnly();
    }

    startKeepAlive(ws) {
      if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(new Uint8Array([0xc0, 0x00]));
        }
      }, 20000);
    }

    cleanupSocketOnly() {
      this.isMqttConnected = false;
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }
      if (this.ws) {
        try {
          this.ws.onopen = null;
          this.ws.onmessage = null;
          this.ws.onerror = null;
          this.ws.onclose = null;
          this.ws.close();
        } catch (_e) {}
        this.ws = null;
      }
    }

    clearTimer() {
      if (this.failoverTimer) {
        clearTimeout(this.failoverTimer);
        this.failoverTimer = null;
      }
    }

    emitStatus(connected) {
      const broker =
        SITE_CONFIG.mqttBrokers[this.currentBrokerIndex] || SITE_CONFIG.mqttBrokers[0];
      this.opts.onStatusChange({
        brokerName: broker.name,
        brokerUrl: broker.url,
        brokerIndex: this.currentBrokerIndex,
        connected: connected,
        locked: this.isRoomLocked,
        failoverCount: this.failoverCount,
      });
    }
  }

  // ============================================================================
  // 5. DIRECT-TO-DISK FILE WRITER & STREAMING ZIP (fileWriter.ts & folderStream.ts)
  // ============================================================================
  function isFileSystemAccessSupported() {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  }

  function sanitizeFileName(rawName) {
    if (typeof rawName !== 'string') return 'download.bin';
    let base = rawName.split(/[/\\]/).pop() || '';
    base = base
      .replace(/[\x00-\x1f\x7f]/g, '')
      .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g, '')
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/^\.+/, '')
      .trim();
    if (!base) return 'download.bin';
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(base)) {
      base = 'file_' + base;
    }
    if (base.length > 180) {
      const dotIdx = base.lastIndexOf('.');
      if (dotIdx > 0 && base.length - dotIdx <= 16) {
        const ext = base.slice(dotIdx);
        base = base.slice(0, 180 - ext.length) + ext;
      } else {
        base = base.slice(0, 180);
      }
    }
    return base || 'download.bin';
  }

  function sanitizeArchivePath(rawPath) {
    if (typeof rawPath !== 'string') return 'file.bin';
    const cleaned = rawPath
      .replace(/\\/g, '/')
      .replace(/^[a-zA-Z]:/, '')
      .replace(/[\x00-\x1f\x7f]/g, '')
      .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g, '');
    const safeSegments = cleaned
      .split('/')
      .map((seg) => seg.replace(/[<>:"|?*]/g, '_').trim())
      .filter((seg) => seg.length > 0 && seg !== '.' && seg !== '..')
      .map((seg) => (seg.length > 150 ? seg.slice(0, 150) : seg));
    return safeSegments.length > 0 ? safeSegments.join('/') : 'file.bin';
  }

  class StreamFileWriter {
    constructor(mode, fileName, _mimeType, writableStream) {
      this.mode = mode;
      this.fileName = sanitizeFileName(fileName);
      this.mimeType = 'application/octet-stream';
      this.writableStream = writableStream;
      this.ramChunks = [];
      this.bytesWritten = 0;
      this.closed = false;
    }

    static async create(fileName, _mimeType, preferDisk) {
      const safeName = sanitizeFileName(fileName);
      if (preferDisk && isFileSystemAccessSupported()) {
        const handle = await window.showSaveFilePicker({ suggestedName: safeName });
        const writable = await handle.createWritable({ keepExistingData: false });
        return new StreamFileWriter('disk', safeName, 'application/octet-stream', writable);
      }
      return new StreamFileWriter('ram', safeName, 'application/octet-stream', null);
    }

    async writeChunk(chunkData) {
      if (this.closed) throw new Error('Writer closed');
      if (this.mode === 'disk' && this.writableStream) {
        await this.writableStream.write(chunkData);
      } else {
        if (this.bytesWritten + chunkData.byteLength > SITE_CONFIG.maxRamFileBytes) {
          throw new Error('RAM_LIMIT_EXCEEDED');
        }
        const copy = new Uint8Array(chunkData.byteLength);
        copy.set(chunkData);
        this.ramChunks.push(copy);
      }
      this.bytesWritten += chunkData.byteLength;
    }

    async finalize() {
      if (this.closed) return null;
      this.closed = true;
      if (this.mode === 'disk' && this.writableStream) {
        await this.writableStream.close();
        this.writableStream = null;
        return null;
      }
      const blob = new Blob(this.ramChunks, { type: 'application/octet-stream' });
      this.ramChunks = [];
      const url = URL.createObjectURL(blob);
      if (typeof url === 'string' && url.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName;
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 250);
      }
      return url;
    }

    async abort() {
      if (this.closed) return;
      this.closed = true;
      if (this.mode === 'disk' && this.writableStream) {
        try {
          await this.writableStream.abort();
        } catch (_e) {}
        this.writableStream = null;
      }
      this.ramChunks = [];
    }
  }

  // Recursive folder entry scanner + On-The-Fly Streaming PKZIP Generator
  const CRC32_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function updateCrc32(crc, bytes) {
    let c = (crc ^ 0xffffffff) >>> 0;
    for (let i = 0; i < bytes.byteLength; i++) {
      c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  async function extractDroppedEntries(dataTransfer) {
    const results = [];
    let hasDirectory = false;
    let rootFolderName = null;

    const items = dataTransfer.items;
    if (items && items.length > 0) {
      const webkitEntries = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && typeof item.webkitGetAsEntry === 'function') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            webkitEntries.push(entry);
            if (entry.isDirectory) {
              hasDirectory = true;
              if (!rootFolderName) rootFolderName = entry.name;
            }
          }
        }
      }
      if (webkitEntries.length > 0) {
        for (let i = 0; i < webkitEntries.length; i++) {
          if (results.length >= SITE_CONFIG.maxArchiveEntries) break;
          await traverseWebKitEntry(webkitEntries[i], '', results, 0);
        }
        return { entries: results, hasDirectory: hasDirectory, rootFolderName: rootFolderName };
      }
    }

    const files = dataTransfer.files || [];
    for (let i = 0; i < files.length; i++) {
      if (results.length >= SITE_CONFIG.maxArchiveEntries) break;
      const f = files[i];
      const rel = sanitizeArchivePath(f.webkitRelativePath || f.name);
      if (f.webkitRelativePath && f.webkitRelativePath.indexOf('/') !== -1) {
        hasDirectory = true;
        if (!rootFolderName) rootFolderName = sanitizeArchivePath(f.webkitRelativePath.split('/')[0]);
      }
      results.push({ file: f, relativePath: rel });
    }
    return { entries: results, hasDirectory: hasDirectory, rootFolderName: rootFolderName };
  }

  async function traverseWebKitEntry(entry, parentPath, results, depth) {
    if (depth > SITE_CONFIG.maxArchiveDepth || results.length >= SITE_CONFIG.maxArchiveEntries) {
      return;
    }
    const currentPath = sanitizeArchivePath(parentPath ? parentPath + '/' + entry.name : entry.name);
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      results.push({ file: file, relativePath: currentPath });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      while (true) {
        const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        if (!batch || batch.length === 0) break;
        for (let i = 0; i < batch.length; i++) {
          if (results.length >= SITE_CONFIG.maxArchiveEntries) break;
          await traverseWebKitEntry(batch[i], currentPath, results, depth + 1);
        }
      }
    }
  }

  function filesToRelativeEntries(fileList) {
    const entries = [];
    let hasDirectory = false;
    let rootFolderName = null;
    for (let i = 0; i < fileList.length; i++) {
      if (entries.length >= SITE_CONFIG.maxArchiveEntries) break;
      const f = fileList[i];
      const rawRel = f.webkitRelativePath && f.webkitRelativePath.length > 0 ? f.webkitRelativePath : f.name;
      const rel = sanitizeArchivePath(rawRel);
      if (f.webkitRelativePath && f.webkitRelativePath.indexOf('/') !== -1) {
        hasDirectory = true;
        if (!rootFolderName) rootFolderName = sanitizeArchivePath(f.webkitRelativePath.split('/')[0]);
      }
      entries.push({ file: f, relativePath: rel });
    }
    return { entries: entries, hasDirectory: hasDirectory, rootFolderName: rootFolderName };
  }

  async function streamEntriesAsZipChunks(entries, onChunk, shouldAbort) {
    const chunkSize = SITE_CONFIG.chunkSize;
    let chunkIndex = 0;
    let totalBytesEmitted = 0;
    let pendingBuffer = new Uint8Array(chunkSize);
    let pendingOffset = 0;
    let archiveOffset = 0;
    const centralDirRecords = [];

    async function pushBytesToStream(data) {
      let offset = 0;
      while (offset < data.byteLength) {
        if (shouldAbort()) return;
        const spaceLeft = chunkSize - pendingOffset;
        const toCopy = Math.min(spaceLeft, data.byteLength - offset);
        pendingBuffer.set(data.subarray(offset, offset + toCopy), pendingOffset);
        pendingOffset += toCopy;
        offset += toCopy;

        if (pendingOffset === chunkSize) {
          const fullChunk = pendingBuffer;
          pendingBuffer = new Uint8Array(chunkSize);
          pendingOffset = 0;
          const idx = chunkIndex++;
          totalBytesEmitted += fullChunk.byteLength;
          await onChunk(idx, fullChunk);
        }
      }
    }

    const encoder = new TextEncoder();

    for (let i = 0; i < entries.length; i++) {
      if (shouldAbort()) break;
      const item = entries[i];
      const cleanPath = sanitizeArchivePath(item.relativePath);
      const nameBytes = encoder.encode(cleanPath);
      const fileSize = item.file.size >>> 0;
      const localHeaderOffset = archiveOffset >>> 0;

      // Local file header (30 bytes + filename, flags=0x0808 UTF-8 + streaming data descriptor)
      const lfh = new Uint8Array(30 + nameBytes.byteLength);
      const lfhView = new DataView(lfh.buffer);
      lfhView.setUint32(0, 0x04034b50, true);
      lfhView.setUint16(4, 20, true);
      lfhView.setUint16(6, 0x0808, true); // Bit 3 (data descriptor) + Bit 11 (UTF-8)
      lfhView.setUint16(8, 0, true); // Store method
      lfhView.setUint16(10, 0, true);
      lfhView.setUint16(12, 0x2100, true);
      lfhView.setUint32(14, 0, true); // CRC-32 in data descriptor
      lfhView.setUint32(18, 0, true);
      lfhView.setUint32(22, 0, true);
      lfhView.setUint16(26, nameBytes.byteLength, true);
      lfhView.setUint16(28, 0, true);
      lfh.set(nameBytes, 30);

      await pushBytesToStream(lfh);
      archiveOffset += lfh.byteLength;

      let crc = 0;
      let fileOffset = 0;
      while (fileOffset < item.file.size) {
        if (shouldAbort()) break;
        const nextEnd = Math.min(fileOffset + chunkSize, item.file.size);
        const buf = await item.file.slice(fileOffset, nextEnd).arrayBuffer();
        const bytes = new Uint8Array(buf);
        crc = updateCrc32(crc, bytes);
        await pushBytesToStream(bytes);
        archiveOffset += bytes.byteLength;
        fileOffset = nextEnd;
      }

      // 16-byte Data Descriptor
      const dd = new Uint8Array(16);
      const ddView = new DataView(dd.buffer);
      ddView.setUint32(0, 0x08074b50, true);
      ddView.setUint32(4, crc >>> 0, true);
      ddView.setUint32(8, fileSize, true);
      ddView.setUint32(12, fileSize, true);
      await pushBytesToStream(dd);
      archiveOffset += dd.byteLength;

      // Central Directory Header (46 bytes + filename)
      const cdh = new Uint8Array(46 + nameBytes.byteLength);
      const cdhView = new DataView(cdh.buffer);
      cdhView.setUint32(0, 0x02014b50, true);
      cdhView.setUint16(4, 20, true);
      cdhView.setUint16(6, 20, true);
      cdhView.setUint16(8, 0x0808, true);
      cdhView.setUint16(10, 0, true);
      cdhView.setUint16(12, 0, true);
      cdhView.setUint16(14, 0x2100, true);
      cdhView.setUint32(16, crc >>> 0, true);
      cdhView.setUint32(20, fileSize, true);
      cdhView.setUint32(24, fileSize, true);
      cdhView.setUint16(28, nameBytes.byteLength, true);
      cdhView.setUint16(30, 0, true);
      cdhView.setUint16(32, 0, true);
      cdhView.setUint16(34, 0, true);
      cdhView.setUint16(36, 0, true);
      cdhView.setUint32(38, 0, true);
      cdhView.setUint32(42, localHeaderOffset, true);
      cdh.set(nameBytes, 46);
      centralDirRecords.push(cdh);
    }

    if (!shouldAbort()) {
      const cdStartOffset = archiveOffset >>> 0;
      let cdByteSize = 0;
      for (let i = 0; i < centralDirRecords.length; i++) {
        await pushBytesToStream(centralDirRecords[i]);
        cdByteSize += centralDirRecords[i].byteLength;
        archiveOffset += centralDirRecords[i].byteLength;
      }

      const eocd = new Uint8Array(22);
      const eocdView = new DataView(eocd.buffer);
      eocdView.setUint32(0, 0x06054b50, true);
      eocdView.setUint16(4, 0, true);
      eocdView.setUint16(6, 0, true);
      eocdView.setUint16(8, centralDirRecords.length, true);
      eocdView.setUint16(10, centralDirRecords.length, true);
      eocdView.setUint32(12, cdByteSize >>> 0, true);
      eocdView.setUint32(16, cdStartOffset, true);
      eocdView.setUint16(20, 0, true);
      await pushBytesToStream(eocd);

      if (pendingOffset > 0) {
        const tail = pendingBuffer.subarray(0, pendingOffset);
        const idx = chunkIndex++;
        totalBytesEmitted += tail.byteLength;
        pendingOffset = 0;
        await onChunk(idx, tail);
      }
    }

    return { totalChunks: chunkIndex, totalBytesEmitted: totalBytesEmitted };
  }

  // ============================================================================
  // 6. ISO/IEC 18004 QR CODE SVG GENERATOR (Version 2, ECC-L, 25x25 Matrix)
  // ============================================================================
  function renderSeedQrSvg(text, size) {
    const bytes = new TextEncoder().encode(String(text || ''));
    if (bytes.length > 32) return '';
    // Version 2-L: 25x25 modules, 34 data codewords, 10 EC codewords
    const dataCw = new Uint8Array(34);
    const bits = [];
    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }
    pushBits(0x4, 4); // Byte mode
    pushBits(bytes.length, 8);
    for (let i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
    pushBits(0, Math.min(4, 34 * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);
    for (let i = 0; i < bits.length / 8 && i < 34; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
      dataCw[i] = b;
    }
    const padBytes = [0xec, 0x11];
    for (let i = Math.floor(bits.length / 8); i < 34; i++) {
      dataCw[i] = padBytes[(i - Math.floor(bits.length / 8)) % 2];
    }

    // GF(256) Reed-Solomon 10 EC codewords
    const exp = new Uint8Array(512);
    const log = new Uint8Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      exp[i] = x;
      log[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
    const gen = [1, 216, 194, 159, 111, 199, 94, 95, 113, 157, 193];
    const ec = new Uint8Array(10);
    for (let i = 0; i < 34; i++) {
      const factor = dataCw[i] ^ ec[0];
      for (let j = 0; j < 9; j++) ec[j] = ec[j + 1];
      ec[9] = 0;
      if (factor !== 0) {
        for (let j = 0; j < 10; j++) {
          ec[j] ^= exp[log[gen[j + 1]] + log[factor]];
        }
      }
    }

    const allCw = new Uint8Array(44);
    allCw.set(dataCw, 0);
    allCw.set(ec, 34);

    const N = 25;
    const matrix = Array.from({ length: N }, () => new Int8Array(N).fill(-1));
    function placeFinder(r, c) {
      for (let dy = -1; dy <= 7; dy++) {
        for (let dx = -1; dx <= 7; dx++) {
          const y = r + dy, x0 = c + dx;
          if (y < 0 || y >= N || x0 < 0 || x0 >= N) continue;
          const inOuter = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
          const onBorder = dy === 0 || dy === 6 || dx === 0 || dx === 6;
          const inCenter = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
          matrix[y][x0] = inOuter && (onBorder || inCenter) ? 1 : 0;
        }
      }
    }
    placeFinder(0, 0);
    placeFinder(0, N - 7);
    placeFinder(N - 7, 0);

    // Alignment pattern at (18, 18)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        matrix[18 + dy][18 + dx] =
          Math.abs(dy) === 2 || Math.abs(dx) === 2 || (dy === 0 && dx === 0) ? 1 : 0;
      }
    }
    for (let i = 8; i < N - 8; i++) {
      if (matrix[6][i] === -1) matrix[6][i] = i % 2 === 0 ? 1 : 0;
      if (matrix[i][6] === -1) matrix[i][6] = i % 2 === 0 ? 1 : 0;
    }
    matrix[N - 8][8] = 1;
    // Reserve format areas
    for (let i = 0; i < 9; i++) {
      if (matrix[8][i] === -1) matrix[8][i] = 0;
      if (matrix[i][8] === -1) matrix[i][8] = 0;
    }
    for (let i = 0; i < 8; i++) {
      if (matrix[8][N - 1 - i] === -1) matrix[8][N - 1 - i] = 0;
      if (matrix[N - 1 - i][8] === -1) matrix[N - 1 - i][8] = 0;
    }

    const isFunc = matrix.map((row) => row.map((v) => v !== -1));
    let bitIdx = 0;
    let upward = true;
    for (let col = N - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let step = 0; step < N; step++) {
        const row = upward ? N - 1 - step : step;
        for (let cOff = 0; cOff < 2; cOff++) {
          const c = col - cOff;
          if (!isFunc[row][c]) {
            let bit = 0;
            if (bitIdx < allCw.length * 8) {
              bit = (allCw[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            if ((row + c) % 2 === 0) bit ^= 1; // Mask 0
            matrix[row][c] = bit;
          }
        }
      }
      upward = !upward;
    }

    // Format bits for ECC-L (01) + Mask 0 (000) -> 0x77c4
    const fmt = 0x77c4;
    const f1 = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
    ];
    const f2 = [
      [N - 1, 8], [N - 2, 8], [N - 3, 8], [N - 4, 8], [N - 5, 8], [N - 6, 8], [N - 7, 8],
      [8, N - 8], [8, N - 7], [8, N - 6], [8, N - 5], [8, N - 4], [8, N - 3], [8, N - 2], [8, N - 1],
    ];
    for (let i = 0; i < 15; i++) {
      const b = (fmt >> i) & 1;
      matrix[f1[i][0]][f1[i][1]] = b;
      matrix[f2[i][0]][f2[i][1]] = b;
    }

    let pathD = '';
    for (let y = 0; y < N; y++) {
      for (let x0 = 0; x0 < N; x0++) {
        if (matrix[y][x0] === 1) {
          pathD += 'M' + (x0 + 2) + ',' + (y + 2) + 'h1v1h-1z';
        }
      }
    }
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" width="' +
      size +
      '" height="' +
      size +
      '" shape-rendering="crispEdges"><rect width="29" height="29" fill="#ffffff"/><path d="' +
      pathD +
      '" fill="#090d16"/></svg>'
    );
  }

  // ============================================================================
  // 7. APPLICATION STATE & REACTIVE CONTROLLER
  // ============================================================================
  const state = {
    lang: detectInitialLanguage(),
    darkMode: true,
    howItWorksOpen: false,
    securityOpen: false,
    role: 'sender',
    senderSeed: generateRandomSeed(),
    receiverSeedInput: '',
    seedCopied: false,
    showQr: false,
    isDraggingWindow: false,
    queuedEntries: [],
    hasDirectoryInQueue: false,
    rootFolderName: null,
    incomingOffer: null,
    clipboardItems: [],
    clipboardDraft: '',
    copiedClipId: null,
    errorCode: null,
    brokerStatus: {
      brokerName: SITE_CONFIG.mqttBrokers[0].name,
      brokerUrl: SITE_CONFIG.mqttBrokers[0].url,
      brokerIndex: 0,
      connected: false,
      locked: false,
      failoverCount: 0,
    },
    telemetry: {
      phase: 'idle',
      writeMode: isFileSystemAccessSupported() ? 'disk' : 'ram',
      progressPercent: 0,
      bytesTransferred: 0,
      totalBytes: 0,
      speedMbps: 0,
      etaSeconds: null,
      currentChunk: 0,
      totalChunks: 0,
      lastAckedChunk: -1,
      resumedFromChunk: null,
      roomLocked: false,
      topicHashHex: '',
      fingerprint: '',
      activeFileName: null,
      completedDownloadUrl: null,
    },
  };

  let derivedMaterial = null;
  let signalingChannel = null;
  let peerConn = null;
  let dataChannel = null;
  let remotePeerId = null;
  let pendingIceCandidates = [];
  const senderAckMap = new Map();
  let receiverActiveState = null;
  let abortTransferFlag = false;
  let pendingSenderOfferId = null;
  let activeBlobUrl = null;
  let acceptResolver = null;
  const speedTracker = { lastTimestamp: 0, lastBytes: 0, smoothedSpeed: 0 };

  function revokeActiveBlobUrl() {
    if (activeBlobUrl) {
      try {
        URL.revokeObjectURL(activeBlobUrl);
      } catch (_e) {}
      activeBlobUrl = null;
    }
  }

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const val = bytes / Math.pow(1024, idx);
    return val.toFixed(idx === 0 ? 0 : 2) + ' ' + units[idx];
  }

  function formatDuration(seconds) {
    if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '--:--';
    const s = Math.ceil(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }

  function cleanupPeerConnectionOnly() {
    if (dataChannel) {
      try {
        dataChannel.onopen = null;
        dataChannel.onclose = null;
        dataChannel.onerror = null;
        dataChannel.onmessage = null;
        dataChannel.close();
      } catch (_e) {}
      dataChannel = null;
    }
    if (peerConn) {
      try {
        peerConn.onicecandidate = null;
        peerConn.ondatachannel = null;
        peerConn.onconnectionstatechange = null;
        peerConn.close();
      } catch (_e) {}
      peerConn = null;
    }
    remotePeerId = null;
    pendingIceCandidates = [];
  }

  function fullDisconnect() {
    abortTransferFlag = true;
    pendingSenderOfferId = null;
    if (acceptResolver) {
      const r = acceptResolver;
      acceptResolver = null;
      r({ storageMode: 'ram', resumeFromChunk: 0 });
    }
    cleanupPeerConnectionOnly();
    if (signalingChannel) {
      signalingChannel.destroy();
      signalingChannel = null;
    }
    revokeActiveBlobUrl();
    state.brokerStatus.connected = false;
    state.brokerStatus.locked = false;
  }

  async function sendControlFrame(frame) {
    if (!dataChannel || dataChannel.readyState !== 'open' || !derivedMaterial) return;
    const aadContext = 'zs-ctrl-v1:' + derivedMaterial.topicId;
    const encryptedStr = await encryptJsonPayload(derivedMaterial.transferKey, frame, aadContext);
    dataChannel.send(encryptedStr);
  }

  async function handleIncomingBinaryChunk(packetBuffer) {
    if (!derivedMaterial || !receiverActiveState) return;
    const rx = receiverActiveState;
    try {
      const res = await decryptChunkPacket(derivedMaterial.transferKey, packetBuffer, rx.fileId);
      const chunkIndex = res.chunkIndex;
      const data = res.data;

      if (chunkIndex <= rx.lastChunkIndex) return;

      if (chunkIndex !== rx.expectedNextChunk || rx.bytesWritten + data.byteLength > rx.maxAllowedBytes) {
        const err = new Error('Chunk sequence or byte limit violation');
        err.isAuthTagError = true;
        throw err;
      }

      await rx.writer.writeChunk(data);
      rx.lastChunkIndex = chunkIndex;
      rx.expectedNextChunk = chunkIndex + 1;
      rx.bytesWritten += data.byteLength;

      const now = performance.now();
      if (speedTracker.lastTimestamp === 0) {
        speedTracker.lastTimestamp = now;
        speedTracker.lastBytes = rx.bytesWritten;
      } else {
        const dt = (now - speedTracker.lastTimestamp) / 1000;
        if (dt >= 0.25) {
          const dBytes = rx.bytesWritten - speedTracker.lastBytes;
          const instantMbps = dBytes / (1024 * 1024) / dt;
          speedTracker.smoothedSpeed =
            speedTracker.smoothedSpeed === 0
              ? instantMbps
              : speedTracker.smoothedSpeed * 0.7 + instantMbps * 0.3;
          speedTracker.lastTimestamp = now;
          speedTracker.lastBytes = rx.bytesWritten;
        }
      }

      const effectiveTotal = Math.max(rx.totalBytes, rx.bytesWritten);
      state.telemetry.phase = 'transferring';
      state.telemetry.progressPercent =
        effectiveTotal > 0 ? Math.min(99.9, (rx.bytesWritten / effectiveTotal) * 100) : 0;
      state.telemetry.bytesTransferred = rx.bytesWritten;
      state.telemetry.totalBytes = effectiveTotal;
      state.telemetry.speedMbps = speedTracker.smoothedSpeed;
      const remainingBytes = Math.max(0, effectiveTotal - rx.bytesWritten);
      state.telemetry.etaSeconds =
        speedTracker.smoothedSpeed > 0.01
          ? remainingBytes / (1024 * 1024) / speedTracker.smoothedSpeed
          : null;
      state.telemetry.currentChunk = chunkIndex + 1;
      state.telemetry.totalChunks = Math.max(state.telemetry.totalChunks, chunkIndex + 1);

      if ((chunkIndex + 1) % SITE_CONFIG.ackIntervalChunks === 0) {
        state.telemetry.lastAckedChunk = chunkIndex;
        await sendControlFrame({
          type: 'ACK',
          fileId: rx.fileId,
          lastChunkIndex: chunkIndex,
        });
      }
      renderTelemetryOnly();
    } catch (err) {
      state.errorCode = err && err.isAuthTagError ? 'authTagMismatch' : 'fileWriteError';
      state.telemetry.phase = 'error';
      await rx.writer.abort();
      receiverActiveState = null;
      await sendControlFrame({
        type: 'TRANSFER_ABORT',
        fileId: rx.fileId,
        reason: 'AUTH_TAG_MISMATCH',
      });
      renderApp();
    }
  }

  async function handleIncomingControlFrame(encryptedText) {
    if (!derivedMaterial) return;
    let frame;
    try {
      const aadContext = 'zs-ctrl-v1:' + derivedMaterial.topicId;
      frame = await decryptJsonPayload(derivedMaterial.transferKey, encryptedText, aadContext);
    } catch (_e) {
      state.errorCode = 'authTagMismatch';
      state.telemetry.phase = 'error';
      renderApp();
      return;
    }

    if (!frame || typeof frame !== 'object' || typeof frame.type !== 'string') return;

    if (frame.type === 'FILE_OFFER') {
      const o = frame.offer;
      if (
        !o ||
        typeof o !== 'object' ||
        typeof o.fileId !== 'string' ||
        o.fileId.length === 0 ||
        o.fileId.length > 256 ||
        typeof o.fileName !== 'string' ||
        typeof o.fileSize !== 'number' ||
        !Number.isFinite(o.fileSize) ||
        o.fileSize < 0 ||
        typeof o.totalChunks !== 'number' ||
        !Number.isInteger(o.totalChunks) ||
        o.totalChunks < 0 ||
        typeof o.itemCount !== 'number' ||
        !Number.isInteger(o.itemCount) ||
        o.itemCount < 1 ||
        o.itemCount > SITE_CONFIG.maxArchiveEntries
      ) {
        return;
      }

      const offer = {
        fileId: o.fileId,
        fileName: sanitizeFileName(o.fileName),
        fileSize: o.fileSize,
        mimeType: 'application/octet-stream',
        isFolderArchive: Boolean(o.isFolderArchive),
        itemCount: o.itemCount,
        totalChunks: o.totalChunks,
        resumable: Boolean(o.resumable),
        knownLastAckChunk: Number.isInteger(o.knownLastAckChunk) ? o.knownLastAckChunk : -1,
      };

      if (
        receiverActiveState &&
        receiverActiveState.disconnectedForResume &&
        receiverActiveState.fileId === offer.fileId &&
        offer.resumable &&
        offer.fileSize === receiverActiveState.totalBytes &&
        offer.totalChunks === receiverActiveState.totalChunks &&
        receiverActiveState.lastChunkIndex >= 0
      ) {
        receiverActiveState.disconnectedForResume = false;
        const resumeFrom = receiverActiveState.lastChunkIndex + 1;
        state.telemetry.phase = 'transferring';
        state.telemetry.resumedFromChunk = resumeFrom;
        state.telemetry.activeFileName = offer.fileName;
        renderApp();
        await sendControlFrame({
          type: 'FILE_ACCEPT',
          fileId: offer.fileId,
          storageMode: receiverActiveState.writer.mode,
          resumeFromChunk: resumeFrom,
        });
        return;
      }
      state.incomingOffer = offer;
      state.telemetry.activeFileName = offer.fileName;
      state.telemetry.totalBytes = offer.fileSize;
      state.telemetry.totalChunks = offer.totalChunks;
      state.telemetry.progressPercent = 0;
      state.telemetry.bytesTransferred = 0;
      state.telemetry.completedDownloadUrl = null;
      renderApp();
    } else if (frame.type === 'FILE_ACCEPT') {
      if (
        typeof frame.fileId !== 'string' ||
        frame.fileId !== pendingSenderOfferId ||
        (frame.storageMode !== 'disk' && frame.storageMode !== 'ram') ||
        typeof frame.resumeFromChunk !== 'number' ||
        !Number.isInteger(frame.resumeFromChunk) ||
        frame.resumeFromChunk < 0
      ) {
        return;
      }
      if (acceptResolver) {
        const r = acceptResolver;
        acceptResolver = null;
        r({ storageMode: frame.storageMode, resumeFromChunk: frame.resumeFromChunk });
      }
    } else if (frame.type === 'ACK') {
      if (
        typeof frame.fileId !== 'string' ||
        frame.fileId.length > 256 ||
        typeof frame.lastChunkIndex !== 'number' ||
        !Number.isInteger(frame.lastChunkIndex) ||
        frame.lastChunkIndex < -1
      ) {
        return;
      }
      senderAckMap.set(frame.fileId, frame.lastChunkIndex);
      state.telemetry.lastAckedChunk = frame.lastChunkIndex;
      renderTelemetryOnly();
    } else if (frame.type === 'FILE_COMPLETE') {
      if (
        typeof frame.fileId !== 'string' ||
        typeof frame.totalChunks !== 'number' ||
        !Number.isInteger(frame.totalChunks) ||
        frame.totalChunks < 0 ||
        typeof frame.totalBytes !== 'number' ||
        !Number.isInteger(frame.totalBytes) ||
        frame.totalBytes < 0
      ) {
        return;
      }
      if (receiverActiveState && receiverActiveState.fileId === frame.fileId) {
        const rx = receiverActiveState;
        const countValid =
          rx.expectedNextChunk === frame.totalChunks &&
          rx.bytesWritten === frame.totalBytes &&
          (rx.isFolderArchive || frame.totalBytes === rx.totalBytes);
        if (!countValid) {
          await rx.writer.abort();
          receiverActiveState = null;
          state.errorCode = 'authTagMismatch';
          state.telemetry.phase = 'error';
          renderApp();
          return;
        }
        await sendControlFrame({
          type: 'ACK',
          fileId: rx.fileId,
          lastChunkIndex: rx.lastChunkIndex,
        });
        revokeActiveBlobUrl();
        const downloadUrl = await rx.writer.finalize();
        activeBlobUrl = downloadUrl;
        receiverActiveState = null;
        state.incomingOffer = null;
        state.telemetry.phase = 'completed';
        state.telemetry.progressPercent = 100;
        state.telemetry.bytesTransferred = frame.totalBytes;
        state.telemetry.totalBytes = frame.totalBytes;
        state.telemetry.currentChunk = frame.totalChunks;
        state.telemetry.totalChunks = frame.totalChunks;
        state.telemetry.lastAckedChunk = Math.max(0, frame.totalChunks - 1);
        state.telemetry.etaSeconds = 0;
        state.telemetry.completedDownloadUrl = downloadUrl;
        renderApp();
      }
    } else if (frame.type === 'TRANSFER_ABORT') {
      abortTransferFlag = true;
      pendingSenderOfferId = null;
      if (acceptResolver) {
        const r = acceptResolver;
        acceptResolver = null;
        r({ storageMode: 'ram', resumeFromChunk: 0 });
      }
      if (receiverActiveState) {
        await receiverActiveState.writer.abort();
        receiverActiveState = null;
      }
      state.errorCode = frame.reason === 'AUTH_TAG_MISMATCH' ? 'authTagMismatch' : 'transferAborted';
      state.telemetry.phase = 'error';
      renderApp();
    } else if (frame.type === 'CLIPBOARD_TEXT') {
      if (typeof frame.text !== 'string' || frame.text.length === 0) return;
      const boundedText = frame.text.slice(0, SITE_CONFIG.maxClipboardChars);
      const localId = 'cb_' + generateRandomHex(6);
      const safeTs =
        typeof frame.timestamp === 'number' && Number.isFinite(frame.timestamp)
          ? frame.timestamp
          : Date.now();
      state.clipboardItems.unshift({
        id: localId,
        text: boundedText,
        direction: 'received',
        timestamp: safeTs,
      });
      if (state.clipboardItems.length > SITE_CONFIG.maxClipboardItems) {
        state.clipboardItems.length = SITE_CONFIG.maxClipboardItems;
      }
      renderApp();
    }
  }

  function bindDataChannel(dc) {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = SITE_CONFIG.lowBufferedThreshold;
    dataChannel = dc;

    dc.onopen = () => {
      if (signalingChannel) signalingChannel.lockRoomAndDisconnect();
      state.errorCode = null;
      state.telemetry.phase = 'connected';
      state.telemetry.roomLocked = true;
      renderApp();
    };

    dc.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        await handleIncomingControlFrame(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        await handleIncomingBinaryChunk(event.data);
      } else if (event.data instanceof Blob) {
        await handleIncomingBinaryChunk(await event.data.arrayBuffer());
      }
    };

    dc.onclose = () => {
      if (receiverActiveState) receiverActiveState.disconnectedForResume = true;
      if (state.telemetry.phase !== 'completed') {
        state.errorCode = 'peerDisconnected';
        state.telemetry.phase = 'error';
        state.telemetry.roomLocked = false;
        renderApp();
      }
    };
  }

  function ensurePeerConnection(activeRole) {
    if (peerConn) return peerConn;
    const pc = new RTCPeerConnection({
      iceServers: SITE_CONFIG.stunServers.map((urls) => ({ urls: urls })),
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannel && !signalingChannel.isLocked()) {
        signalingChannel.publishEncrypted({
          type: 'ICE_CANDIDATE',
          role: activeRole,
          sessionId: signalingChannel.getSenderId(),
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if ((st === 'disconnected' || st === 'failed') && state.telemetry.phase !== 'completed') {
        if (receiverActiveState) receiverActiveState.disconnectedForResume = true;
        state.errorCode = 'peerDisconnected';
        state.telemetry.phase = 'error';
        state.telemetry.roomLocked = false;
        renderApp();
      }
    };

    if (activeRole === 'sender') {
      bindDataChannel(pc.createDataChannel('zeroseed-e2ee-v1', { ordered: true }));
    } else {
      pc.ondatachannel = (event) => bindDataChannel(event.channel);
    }

    peerConn = pc;
    return pc;
  }

  async function startSessionWithSeed(rawSeed, activeRole) {
    if (!window.crypto || !window.crypto.subtle) {
      state.errorCode = 'cryptoUnsupported';
      state.telemetry.phase = 'error';
      renderApp();
      return;
    }

    fullDisconnect();
    abortTransferFlag = false;
    state.errorCode = null;
    state.telemetry.phase = 'connecting_broker';
    renderApp();

    try {
      derivedMaterial = await deriveDualKeys(rawSeed);
      state.telemetry.topicHashHex = derivedMaterial.topicHashHex;
      state.telemetry.fingerprint = derivedMaterial.fingerprint;
      state.telemetry.roomLocked = false;
      renderApp();

      const sig = new BlindSignalingChannel({
        topicId: derivedMaterial.topicId,
        aesKey: derivedMaterial.signalKey,
        onStatusChange: (status) => {
          state.brokerStatus = status;
          if (status.connected && !status.locked) {
            if (
              state.telemetry.phase === 'connecting_broker' ||
              state.telemetry.phase === 'idle' ||
              state.telemetry.phase === 'error'
            ) {
              state.telemetry.phase = 'waiting_peer';
            }
            sig.publishEncrypted({
              type: 'PEER_HELLO',
              role: activeRole,
              sessionId: sig.getSenderId(),
            });
          }
          renderApp();
        },
        onAllBrokersFailed: () => {
          state.errorCode = 'brokerAllFailed';
          state.telemetry.phase = 'error';
          renderApp();
        },
        onSignal: async (payload, senderId) => {
          if (sig.isLocked()) return;
          if (activeRole === 'sender' && payload.role !== 'receiver') return;
          if (activeRole === 'receiver' && payload.role !== 'sender') return;
          if (remotePeerId && remotePeerId !== senderId) return;

          if (activeRole === 'sender') {
            if (payload.type === 'PEER_HELLO') {
              if (peerConn && peerConn.connectionState !== 'failed') return;
              remotePeerId = senderId;
              state.telemetry.phase = 'handshaking';
              renderApp();
              cleanupPeerConnectionOnly();
              remotePeerId = senderId;
              const pc = ensurePeerConnection('sender');
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await sig.publishEncrypted({
                type: 'SDP_OFFER',
                role: 'sender',
                sessionId: sig.getSenderId(),
                sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
              });
            } else if (payload.type === 'SDP_ANSWER' && payload.sdp) {
              const sdp = payload.sdp;
              if (
                sdp.type !== 'answer' ||
                typeof sdp.sdp !== 'string' ||
                sdp.sdp.length > SITE_CONFIG.maxSdpLength ||
                !/a=fingerprint:sha-256 /i.test(sdp.sdp)
              ) {
                return;
              }
              if (peerConn && peerConn.signalingState === 'have-local-offer') {
                await peerConn.setRemoteDescription(new RTCSessionDescription(sdp));
                for (let i = 0; i < pendingIceCandidates.length; i++) {
                  try {
                    await peerConn.addIceCandidate(new RTCIceCandidate(pendingIceCandidates[i]));
                  } catch (_e) {}
                }
                pendingIceCandidates = [];
              }
            } else if (payload.type === 'ICE_CANDIDATE' && payload.candidate) {
              const cand = payload.candidate;
              if (
                typeof cand.candidate !== 'string' ||
                cand.candidate.length > SITE_CONFIG.maxIceCandidateLength
              ) {
                return;
              }
              if (peerConn && peerConn.remoteDescription) {
                try {
                  await peerConn.addIceCandidate(new RTCIceCandidate(cand));
                } catch (_e) {}
              } else if (pendingIceCandidates.length < SITE_CONFIG.maxPendingIceCandidates) {
                pendingIceCandidates.push(cand);
              }
            }
          } else {
            if (payload.type === 'PEER_HELLO') {
              await sig.publishEncrypted({
                type: 'PEER_HELLO',
                role: 'receiver',
                sessionId: sig.getSenderId(),
              });
            } else if (payload.type === 'SDP_OFFER' && payload.sdp) {
              const sdp = payload.sdp;
              if (
                sdp.type !== 'offer' ||
                typeof sdp.sdp !== 'string' ||
                sdp.sdp.length > SITE_CONFIG.maxSdpLength ||
                !/a=fingerprint:sha-256 /i.test(sdp.sdp)
              ) {
                return;
              }
              if (peerConn && peerConn.connectionState !== 'failed') return;
              remotePeerId = senderId;
              state.telemetry.phase = 'handshaking';
              renderApp();
              cleanupPeerConnectionOnly();
              remotePeerId = senderId;
              const pc = ensurePeerConnection('receiver');
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              for (let i = 0; i < pendingIceCandidates.length; i++) {
                try {
                  await peerConn.addIceCandidate(new RTCIceCandidate(pendingIceCandidates[i]));
                } catch (_e) {}
              }
              pendingIceCandidates = [];
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sig.publishEncrypted({
                type: 'SDP_ANSWER',
                role: 'receiver',
                sessionId: sig.getSenderId(),
                sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
              });
            } else if (payload.type === 'ICE_CANDIDATE' && payload.candidate) {
              const cand = payload.candidate;
              if (
                typeof cand.candidate !== 'string' ||
                cand.candidate.length > SITE_CONFIG.maxIceCandidateLength
              ) {
                return;
              }
              if (peerConn && peerConn.remoteDescription) {
                try {
                  await peerConn.addIceCandidate(new RTCIceCandidate(cand));
                } catch (_e) {}
              } else if (pendingIceCandidates.length < SITE_CONFIG.maxPendingIceCandidates) {
                pendingIceCandidates.push(cand);
              }
            }
          }
        },
      });

      signalingChannel = sig;
      sig.connect();
    } catch (_e) {
      state.errorCode = 'cryptoUnsupported';
      state.telemetry.phase = 'error';
      renderApp();
    }
  }

  async function waitForBackpressureDrain(dc) {
    if (dc.bufferedAmount < SITE_CONFIG.maxBufferedAmount) return;
    state.telemetry.phase = 'paused_backpressure';
    renderTelemetryOnly();

    await new Promise((resolve) => {
      let resolved = false;
      function done() {
        if (resolved) return;
        resolved = true;
        dc.removeEventListener('bufferedamountlow', onLow);
        clearInterval(pollTimer);
        resolve();
      }
      function onLow() {
        if (dc.bufferedAmount <= SITE_CONFIG.lowBufferedThreshold) done();
      }
      dc.addEventListener('bufferedamountlow', onLow);
      const pollTimer = setInterval(() => {
        if (
          dc.readyState !== 'open' ||
          abortTransferFlag ||
          dc.bufferedAmount <= SITE_CONFIG.lowBufferedThreshold
        ) {
          done();
        }
      }, 35);
    });

    if (state.telemetry.phase === 'paused_backpressure') {
      state.telemetry.phase = 'transferring';
      renderTelemetryOnly();
    }
  }

  async function startSendingQueue() {
    if (
      !dataChannel ||
      dataChannel.readyState !== 'open' ||
      !derivedMaterial ||
      state.queuedEntries.length === 0
    ) {
      return;
    }

    abortTransferFlag = false;
    state.errorCode = null;

    const isMultiOrFolder = state.hasDirectoryInQueue || state.queuedEntries.length > 1;
    const singleEntry = !isMultiOrFolder ? state.queuedEntries[0] : null;
    const totalRawBytes = state.queuedEntries.reduce((acc, it) => acc + it.file.size, 0);
    const archiveName = state.rootFolderName
      ? state.rootFolderName + '.zip'
      : 'ZeroSeed-Archive-' + String(Date.now()).slice(-5) + '.zip';

    const fileName = singleEntry ? singleEntry.file.name : archiveName;
    const mimeType = singleEntry
      ? singleEntry.file.type || 'application/octet-stream'
      : 'application/zip';

    const fileId = singleEntry
      ? 'single::' +
        singleEntry.file.name +
        '::' +
        singleEntry.file.size +
        '::' +
        singleEntry.file.lastModified
      : 'zip::' + archiveName + '::' + totalRawBytes;

    const totalChunksEstimate =
      singleEntry && totalRawBytes === 0
        ? 0
        : Math.max(1, Math.ceil(totalRawBytes / SITE_CONFIG.chunkSize));
    const knownLastAck = singleEntry ? (senderAckMap.get(fileId) ?? -1) : -1;

    const offer = {
      fileId: fileId,
      fileName: sanitizeFileName(fileName),
      fileSize: totalRawBytes,
      mimeType: mimeType,
      isFolderArchive: isMultiOrFolder,
      itemCount: state.queuedEntries.length,
      totalChunks: totalChunksEstimate,
      resumable: !isMultiOrFolder,
      knownLastAckChunk: knownLastAck,
    };

    pendingSenderOfferId = fileId;

    const acceptPromise = new Promise((resolve) => {
      acceptResolver = resolve;
    });

    await sendControlFrame({ type: 'FILE_OFFER', offer: offer });
    const decision = await acceptPromise;
    pendingSenderOfferId = null;
    if (abortTransferFlag) return;

    const totalSingleChunks = singleEntry ? Math.ceil(singleEntry.file.size / SITE_CONFIG.chunkSize) : 0;
    const startChunkIndex =
      singleEntry &&
      Number.isInteger(decision.resumeFromChunk) &&
      decision.resumeFromChunk > 0 &&
      decision.resumeFromChunk <= totalSingleChunks
        ? decision.resumeFromChunk
        : 0;

    const sessionIvPrefix = createSessionIvPrefix();

    speedTracker.lastTimestamp = performance.now();
    speedTracker.lastBytes = startChunkIndex * SITE_CONFIG.chunkSize;
    speedTracker.smoothedSpeed = 0;

    state.telemetry.phase = 'transferring';
    state.telemetry.writeMode = decision.storageMode;
    state.telemetry.activeFileName = fileName;
    state.telemetry.totalBytes = totalRawBytes;
    state.telemetry.totalChunks = totalChunksEstimate;
    state.telemetry.currentChunk = startChunkIndex;
    state.telemetry.lastAckedChunk = startChunkIndex - 1;
    state.telemetry.resumedFromChunk = startChunkIndex > 0 ? startChunkIndex : null;
    state.telemetry.completedDownloadUrl = null;
    renderApp();

    try {
      if (singleEntry) {
        const file = singleEntry.file;
        const chunkSize = SITE_CONFIG.chunkSize;
        const totalChunks = Math.ceil(file.size / chunkSize);
        let bytesSent = startChunkIndex * chunkSize;
        const resumedBlob = startChunkIndex > 0 ? file.slice(startChunkIndex * chunkSize) : file;
        const remainingChunks = Math.ceil(resumedBlob.size / chunkSize);

        for (let relIdx = 0; relIdx < remainingChunks; relIdx++) {
          if (abortTransferFlag || dataChannel.readyState !== 'open') return;
          const currentChunkIndex = startChunkIndex + relIdx;
          const sliceStart = relIdx * chunkSize;
          const sliceEnd = Math.min(sliceStart + chunkSize, resumedBlob.size);
          const buf = await resumedBlob.slice(sliceStart, sliceEnd).arrayBuffer();
          const plainBytes = new Uint8Array(buf);

          await waitForBackpressureDrain(dataChannel);
          if (abortTransferFlag || dataChannel.readyState !== 'open') return;

          const encryptedPacket = await encryptChunkPacket(
            derivedMaterial.transferKey,
            currentChunkIndex,
            plainBytes,
            fileId,
            sessionIvPrefix
          );
          dataChannel.send(encryptedPacket);

          bytesSent += plainBytes.byteLength;
          const now = performance.now();
          const dt = (now - speedTracker.lastTimestamp) / 1000;
          if (dt >= 0.25) {
            const dBytes = bytesSent - speedTracker.lastBytes;
            const instantMbps = dBytes / (1024 * 1024) / dt;
            speedTracker.smoothedSpeed =
              speedTracker.smoothedSpeed === 0
                ? instantMbps
                : speedTracker.smoothedSpeed * 0.7 + instantMbps * 0.3;
            speedTracker.lastTimestamp = now;
            speedTracker.lastBytes = bytesSent;
          }

          state.telemetry.progressPercent =
            file.size > 0 ? Math.min(99.9, (bytesSent / file.size) * 100) : 100;
          state.telemetry.bytesTransferred = bytesSent;
          state.telemetry.currentChunk = currentChunkIndex + 1;
          state.telemetry.totalChunks = totalChunks;
          state.telemetry.speedMbps = speedTracker.smoothedSpeed;
          const rem = Math.max(0, file.size - bytesSent);
          state.telemetry.etaSeconds =
            speedTracker.smoothedSpeed > 0.01
              ? rem / (1024 * 1024) / speedTracker.smoothedSpeed
              : null;
          renderTelemetryOnly();
        }

        if (!abortTransferFlag && dataChannel.readyState === 'open') {
          await sendControlFrame({
            type: 'FILE_COMPLETE',
            fileId: fileId,
            totalChunks: totalChunks,
            totalBytes: file.size,
          });
          state.telemetry.phase = 'completed';
          state.telemetry.progressPercent = 100;
          state.telemetry.bytesTransferred = file.size;
          state.telemetry.currentChunk = totalChunks;
          state.telemetry.etaSeconds = 0;
          renderApp();
        }
      } else {
        let bytesEmitted = 0;
        const zipResult = await streamEntriesAsZipChunks(
          state.queuedEntries,
          async (chunkIndex, chunkBytes) => {
            if (abortTransferFlag || dataChannel.readyState !== 'open') return;
            await waitForBackpressureDrain(dataChannel);
            if (abortTransferFlag || dataChannel.readyState !== 'open') return;

            const encryptedPacket = await encryptChunkPacket(
              derivedMaterial.transferKey,
              chunkIndex,
              chunkBytes,
              fileId,
              sessionIvPrefix
            );
            dataChannel.send(encryptedPacket);

            bytesEmitted += chunkBytes.byteLength;
            const now = performance.now();
            const dt = (now - speedTracker.lastTimestamp) / 1000;
            if (dt >= 0.25) {
              const dBytes = bytesEmitted - speedTracker.lastBytes;
              const instantMbps = dBytes / (1024 * 1024) / dt;
              speedTracker.smoothedSpeed =
                speedTracker.smoothedSpeed === 0
                  ? instantMbps
                  : speedTracker.smoothedSpeed * 0.7 + instantMbps * 0.3;
              speedTracker.lastTimestamp = now;
              speedTracker.lastBytes = bytesEmitted;
            }

            const denom = Math.max(totalRawBytes, bytesEmitted);
            state.telemetry.progressPercent =
              denom > 0 ? Math.min(99.5, (bytesEmitted / denom) * 100) : 0;
            state.telemetry.bytesTransferred = bytesEmitted;
            state.telemetry.totalBytes = denom;
            state.telemetry.currentChunk = chunkIndex + 1;
            state.telemetry.totalChunks = Math.max(state.telemetry.totalChunks, chunkIndex + 1);
            state.telemetry.speedMbps = speedTracker.smoothedSpeed;
            const rem = Math.max(0, denom - bytesEmitted);
            state.telemetry.etaSeconds =
              speedTracker.smoothedSpeed > 0.01
                ? rem / (1024 * 1024) / speedTracker.smoothedSpeed
                : null;
            renderTelemetryOnly();
          },
          () => abortTransferFlag || !dataChannel || dataChannel.readyState !== 'open'
        );

        if (!abortTransferFlag && dataChannel.readyState === 'open') {
          await sendControlFrame({
            type: 'FILE_COMPLETE',
            fileId: fileId,
            totalChunks: zipResult.totalChunks,
            totalBytes: zipResult.totalBytesEmitted,
          });
          state.telemetry.phase = 'completed';
          state.telemetry.progressPercent = 100;
          state.telemetry.bytesTransferred = zipResult.totalBytesEmitted;
          state.telemetry.totalBytes = zipResult.totalBytesEmitted;
          state.telemetry.currentChunk = zipResult.totalChunks;
          state.telemetry.totalChunks = zipResult.totalChunks;
          state.telemetry.etaSeconds = 0;
          renderApp();
        }
      }
    } catch (_e) {
      if (!abortTransferFlag) {
        state.errorCode = 'transferAborted';
        state.telemetry.phase = 'error';
        renderApp();
      }
    }
  }

  // ============================================================================
  // 8. UI RENDERING (Navbar, TransferWorkspace, Modals, Footer)
  // ============================================================================
  function renderTelemetryOnly() {
    const panel = document.getElementById('zs-telemetry-panel');
    if (panel) {
      panel.innerHTML = buildTelemetryCardInnerHtml();
      bindTelemetryEvents();
    }
  }

  function buildTelemetryCardInnerHtml() {
    const t = TRANSLATIONS[state.lang];
    const tm = state.telemetry;
    const isTunnelOpen =
      tm.phase === 'connected' ||
      tm.phase === 'transferring' ||
      tm.phase === 'paused_backpressure' ||
      tm.phase === 'completed';
    const isStreaming = tm.phase === 'transferring' || tm.phase === 'paused_backpressure';
    const dotColor = isTunnelOpen
      ? '#10b981'
      : tm.phase === 'error'
      ? '#f43f5e'
      : '#f59e0b';

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;border-bottom:1px solid rgba(148,163,184,0.2);padding-bottom:0.75rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="color:#10b981;font-weight:700;">●</span>
          <h2 style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0;">${escapeHtml(t.telemetry.panelTitle)}</h2>
        </div>
        <span class="font-mono" style="font-size:0.68rem;font-weight:600;padding:0.2rem 0.6rem;border-radius:9999px;background:rgba(16,185,129,0.12);color:#34d399;border:1px solid rgba(16,185,129,0.3);">
          ${escapeHtml(t.telemetry.securityBadgeValue)}
        </span>
      </div>

      <div class="zs-grid-2" style="margin-top:0.85rem;">
        <div class="zs-subcard" style="padding:0.75rem;">
          <div style="font-size:0.68rem;color:#94a3b8;">${escapeHtml(t.telemetry.statusLabel)}</div>
          <div style="font-size:0.8rem;font-weight:700;margin-top:0.2rem;display:flex;align-items:center;gap:0.4rem;">
            <span style="width:0.5rem;height:0.5rem;border-radius:9999px;background:${dotColor};display:inline-block;"></span>
            <span>${escapeHtml(t.status[tm.phase] || tm.phase)}</span>
          </div>
        </div>
        <div class="zs-subcard" style="padding:0.75rem;">
          <div style="font-size:0.68rem;color:#94a3b8;">${escapeHtml(t.telemetry.writeModeLabel)}</div>
          <div style="font-size:0.8rem;font-weight:700;margin-top:0.2rem;color:#38bdf8;">
            ${escapeHtml(tm.writeMode === 'disk' ? t.telemetry.writeModeDisk : t.telemetry.writeModeRam)}
          </div>
        </div>
      </div>

      ${
        tm.fingerprint
          ? `<div class="zs-subcard" style="margin-top:0.75rem;padding:0.6rem 0.85rem;font-size:0.75rem;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#94a3b8;">${escapeHtml(t.telemetry.fingerprintLabel)}:</span>
              <span class="font-mono" style="color:#34d399;font-weight:700;">${escapeHtml(tm.fingerprint)}</span>
            </div>`
          : ''
      }

      ${
        tm.resumedFromChunk !== null
          ? `<div class="font-mono" style="margin-top:0.75rem;padding:0.55rem 0.75rem;border-radius:0.65rem;background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.3);font-size:0.72rem;color:#38bdf8;">
              ${escapeHtml(t.telemetry.resumedFromChunk)}${tm.resumedFromChunk} (${formatBytes(tm.resumedFromChunk * SITE_CONFIG.chunkSize)})
            </div>`
          : ''
      }

      ${
        tm.phase === 'paused_backpressure'
          ? `<div class="font-mono" style="margin-top:0.75rem;padding:0.55rem 0.75rem;border-radius:0.65rem;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);font-size:0.72rem;color:#fbbf24;">
              ${escapeHtml(t.telemetry.pauseNoticeBackpressure)}
            </div>`
          : ''
      }

      <div style="margin-top:0.85rem;">
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:0.35rem;">
          <span style="font-weight:600;">${escapeHtml(tm.activeFileName || t.telemetry.progressLabel)} (${formatBytes(tm.bytesTransferred)} / ${formatBytes(tm.totalBytes)})</span>
          <span class="font-mono" style="font-weight:700;color:#10b981;">${tm.progressPercent.toFixed(1)}%</span>
        </div>
        <div class="zs-progress-track">
          <div class="zs-progress-bar" style="width:${Math.min(100, tm.progressPercent)}%;"></div>
        </div>

        <div class="zs-grid-3 font-mono" style="margin-top:0.65rem;text-align:center;">
          <div class="zs-subcard" style="padding:0.5rem;">
            <div style="font-size:0.65rem;color:#94a3b8;">${escapeHtml(t.telemetry.speedLabel)}</div>
            <div style="font-size:0.78rem;font-weight:700;margin-top:0.15rem;">${tm.speedMbps.toFixed(2)} MB/s</div>
          </div>
          <div class="zs-subcard" style="padding:0.5rem;">
            <div style="font-size:0.65rem;color:#94a3b8;">${escapeHtml(t.telemetry.etaLabel)}</div>
            <div style="font-size:0.78rem;font-weight:700;margin-top:0.15rem;">${formatDuration(tm.etaSeconds)}</div>
          </div>
          <div class="zs-subcard" style="padding:0.5rem;">
            <div style="font-size:0.65rem;color:#94a3b8;">${escapeHtml(t.telemetry.chunksAckedLabel)}</div>
            <div style="font-size:0.78rem;font-weight:700;color:#10b981;margin-top:0.15rem;">${tm.lastAckedChunk >= 0 ? tm.lastAckedChunk + 1 : 0} / ${tm.totalChunks}</div>
          </div>
        </div>
      </div>

      ${
        isStreaming
          ? `<button type="button" id="zs-btn-abort-transfer" style="margin-top:0.75rem;width:100%;padding:0.6rem;border-radius:0.75rem;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);color:#f43f5e;font-size:0.78rem;font-weight:700;">
              ${escapeHtml(t.telemetry.cancelTransfer)}
            </button>`
          : ''
      }

      ${
        tm.phase === 'completed'
          ? `<div style="margin-top:0.75rem;padding:0.75rem;border-radius:0.75rem;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);display:flex;align-items:center;justify-content:space-between;gap:0.5rem;font-size:0.78rem;color:#34d399;font-weight:700;">
              <span>✓ ${escapeHtml(t.telemetry.transferComplete)}</span>
              ${
                tm.completedDownloadUrl &&
                String(tm.completedDownloadUrl).startsWith('blob:') &&
                tm.activeFileName
                  ? `<a href="${escapeHtml(tm.completedDownloadUrl)}" download="${escapeHtml(sanitizeFileName(tm.activeFileName))}" rel="noopener noreferrer" class="zs-btn-primary" style="padding:0.35rem 0.75rem;font-size:0.72rem;text-decoration:none;">${escapeHtml(t.telemetry.downloadAgain)}</a>`
                  : ''
              }
            </div>`
          : ''
      }
    `;
  }

  function bindTelemetryEvents() {
    const abortBtn = document.getElementById('zs-btn-abort-transfer');
    if (abortBtn) {
      abortBtn.onclick = async () => {
        abortTransferFlag = true;
        if (receiverActiveState) {
          await receiverActiveState.writer.abort();
          receiverActiveState = null;
        }
        await sendControlFrame({
          type: 'TRANSFER_ABORT',
          fileId: 'active',
          reason: 'USER_ABORT',
        });
        state.errorCode = 'transferAborted';
        state.telemetry.phase = 'connected';
        renderApp();
      };
    }
  }

  function renderApp() {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    document.documentElement.lang = state.lang;
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const t = TRANSLATIONS[state.lang];
    document.title = t.meta.title;

    const tm = state.telemetry;
    const isTunnelOpen =
      tm.phase === 'connected' ||
      tm.phase === 'transferring' ||
      tm.phase === 'paused_backpressure' ||
      tm.phase === 'completed';
    const isStreaming = tm.phase === 'transferring' || tm.phase === 'paused_backpressure';
    const totalQueueBytes = state.queuedEntries.reduce((acc, it) => acc + it.file.size, 0);
    const diskSupported = isFileSystemAccessSupported();

    rootEl.innerHTML = `
      <div class="zs-shell">
        <div>
          <!-- Navbar -->
          <header class="zs-navbar">
            <div class="zs-container zs-navbar-inner">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <div style="width:2.5rem;height:2.5rem;border-radius:0.75rem;background:#0f172a;border:1px solid rgba(16,185,129,0.35);display:flex;align-items:center;justify-content:center;">
                  <svg viewBox="0 0 64 64" fill="none" style="width:1.5rem;height:1.5rem;">
                    <path d="M32 8L52 19.5V44.5L32 56L12 44.5V19.5L32 8Z" stroke="#10B981" stroke-width="4.5" stroke-linejoin="round"/>
                    <path d="M22 26L42 38M42 26L22 38" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round"/>
                    <circle cx="32" cy="32" r="5.5" fill="#10B981"/>
                  </svg>
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:0.4rem;">
                    <span style="font-weight:800;font-size:1.125rem;letter-spacing:-0.02em;">
                      ${SITE_CONFIG.name}<span style="color:#10b981;">${SITE_CONFIG.domain}</span>
                    </span>
                    <span class="font-mono" style="font-size:0.68rem;padding:0.1rem 0.5rem;border-radius:9999px;background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.25);">
                      🔒 E2EE
                    </span>
                  </div>
                  <div style="font-size:0.68rem;color:#94a3b8;">${escapeHtml(t.nav.zeroLogsBadge)}</div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:0.5rem;">
                <button type="button" id="zs-btn-how" class="zs-btn-ghost" style="padding:0.45rem 0.75rem;font-size:0.8rem;font-weight:600;">
                  ❓ ${escapeHtml(t.nav.howItWorks)}
                </button>
                <button type="button" id="zs-btn-sec" class="zs-btn-ghost" style="padding:0.45rem 0.75rem;font-size:0.8rem;font-weight:600;">
                  🛡️ ${escapeHtml(t.nav.security)}
                </button>

                <!-- TR | EN Switcher -->
                <div role="group" aria-label="${escapeHtml(t.nav.langSwitchLabel)}" style="display:inline-flex;padding:0.15rem;border-radius:0.5rem;background:rgba(148,163,184,0.15);border:1px solid rgba(148,163,184,0.25);">
                  <button type="button" id="zs-lang-tr" class="font-mono" style="padding:0.25rem 0.55rem;border-radius:0.375rem;font-size:0.75rem;font-weight:700;background:${state.lang === 'tr' ? '#10b981' : 'transparent'};color:${state.lang === 'tr' ? '#ffffff' : 'inherit'};">TR</button>
                  <button type="button" id="zs-lang-en" class="font-mono" style="padding:0.25rem 0.55rem;border-radius:0.375rem;font-size:0.75rem;font-weight:700;background:${state.lang === 'en' ? '#10b981' : 'transparent'};color:${state.lang === 'en' ? '#ffffff' : 'inherit'};">EN</button>
                </div>

                <!-- Dark/Light Theme Toggle -->
                <button type="button" id="zs-btn-theme" class="zs-btn-ghost" style="padding:0.45rem 0.65rem;border:1px solid rgba(148,163,184,0.25);border-radius:0.5rem;" title="${escapeHtml(state.darkMode ? t.nav.themeToggleLight : t.nav.themeToggleDark)}">
                  ${state.darkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </header>

          <!-- Main Hero Workspace -->
          <main class="zs-container" style="padding-top:1.5rem;padding-bottom:1rem;">
            ${
              state.isDraggingWindow
                ? `<div class="zs-modal-overlay">
                    <div class="zs-card" style="padding:2.5rem;text-align:center;max-width:32rem;border:2px dashed #10b981;">
                      <div style="font-size:2.5rem;margin-bottom:0.75rem;">📂</div>
                      <h2 style="font-size:1.4rem;font-weight:800;margin:0 0 0.5rem 0;">${escapeHtml(t.hero.dropOverlayTitle)}</h2>
                      <p style="font-size:0.875rem;color:#94a3b8;margin:0;">${escapeHtml(t.hero.dropOverlaySubtitle)}</p>
                    </div>
                  </div>`
                : ''
            }

            <div style="text-align:center;max-width:46rem;margin:0 auto 1.5rem auto;">
              <div class="font-mono" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.25rem 0.85rem;border-radius:9999px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.28);color:#10b981;font-size:0.68rem;font-weight:700;margin-bottom:0.6rem;">
                🛡️ ${escapeHtml(t.hero.badge)}
              </div>
              <h1 style="font-size:1.75rem;font-weight:800;letter-spacing:-0.025em;margin:0;">${escapeHtml(t.hero.title)}</h1>
              <p style="font-size:0.875rem;color:#94a3b8;margin:0.45rem 0 0 0;">${escapeHtml(t.hero.subtitle)}</p>
            </div>

            ${
              state.errorCode
                ? `<div style="margin-bottom:1.25rem;padding:0.85rem 1.1rem;border-radius:0.85rem;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.35);color:#fb7185;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;font-size:0.85rem;">
                    <span>⚠️ ${escapeHtml(t.errors[state.errorCode] || state.errorCode)}</span>
                    <div style="display:flex;gap:0.5rem;">
                      ${
                        state.errorCode === 'peerDisconnected'
                          ? `<button type="button" id="zs-btn-reconnect" class="zs-btn-primary" style="padding:0.3rem 0.75rem;font-size:0.75rem;background:#e11d48;">↻ Resume</button>`
                          : ''
                      }
                      <button type="button" id="zs-btn-dismiss-err" style="background:transparent;color:inherit;text-decoration:underline;font-size:0.75rem;">${escapeHtml(t.modals.close)}</button>
                    </div>
                  </div>`
                : ''
            }

            <div class="zs-main-grid">
              <!-- Left Column: Interactive Transfer Card -->
              <section class="zs-card" style="overflow:hidden;">
                <!-- Tabs -->
                <div class="zs-grid-2" style="padding:0.4rem;background:rgba(2,6,23,0.45);border-bottom:1px solid rgba(148,163,184,0.15);">
                  <button type="button" id="zs-tab-send" ${isStreaming ? 'disabled' : ''} style="padding:0.65rem 1rem;border-radius:0.75rem;font-size:0.85rem;font-weight:700;background:${state.role === 'sender' ? 'rgba(16,185,129,0.16)' : 'transparent'};color:${state.role === 'sender' ? '#34d399' : '#94a3b8'};border:${state.role === 'sender' ? '1px solid rgba(16,185,129,0.35)' : '1px solid transparent'};">
                    📤 ${escapeHtml(t.hero.tabSend)}
                  </button>
                  <button type="button" id="zs-tab-receive" ${isStreaming ? 'disabled' : ''} style="padding:0.65rem 1rem;border-radius:0.75rem;font-size:0.85rem;font-weight:700;background:${state.role === 'receiver' ? 'rgba(14,165,233,0.16)' : 'transparent'};color:${state.role === 'receiver' ? '#38bdf8' : '#94a3b8'};border:${state.role === 'receiver' ? '1px solid rgba(14,165,233,0.35)' : '1px solid transparent'};">
                    📥 ${escapeHtml(t.hero.tabReceive)}
                  </button>
                </div>

                <div style="padding:1.35rem;">
                  ${
                    state.role === 'sender'
                      ? `
                        <!-- SENDER VIEW -->
                        <div class="zs-subcard" style="padding:1rem;">
                          <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.65rem;">
                            <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;">
                              🔑 ${escapeHtml(t.sender.seedLabel)}
                            </span>
                            ${
                              tm.roomLocked
                                ? `<span class="font-mono" style="font-size:0.68rem;font-weight:700;padding:0.15rem 0.55rem;border-radius:9999px;background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);">🔒 ${escapeHtml(t.sender.roomLockedBadge)}</span>`
                                : `<span class="font-mono zs-pulse" style="font-size:0.68rem;color:#fbbf24;">📡 ${escapeHtml(t.sender.waitingForPeer)}</span>`
                            }
                          </div>

                          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;">
                            <div aria-readonly="true" class="font-mono" style="flex:1;min-width:14rem;padding:0.75rem 1rem;border-radius:0.75rem;background:rgba(15,23,42,0.9);border:1px solid rgba(16,185,129,0.4);color:#34d399;font-size:1.05rem;font-weight:700;display:flex;align-items:center;justify-content:space-between;user-select:all;">
                              <span>${escapeHtml(state.senderSeed)}</span>
                            </div>

                            <button type="button" id="zs-btn-copy-seed" class="zs-btn-primary" style="padding:0.75rem 1rem;font-size:0.8rem;">
                              ${state.seedCopied ? '✓ ' + escapeHtml(t.sender.copiedSeed) : '📋 ' + escapeHtml(t.sender.copySeed)}
                            </button>

                            <button type="button" id="zs-btn-regen-seed" ${isStreaming ? 'disabled' : ''} class="zs-btn-ghost" style="padding:0.75rem 0.85rem;border:1px solid rgba(148,163,184,0.25);border-radius:0.75rem;font-size:0.8rem;" title="${escapeHtml(t.sender.regenerateSeed)}">
                              🔄 ${escapeHtml(t.sender.regenerateSeed)}
                            </button>

                            <button type="button" id="zs-btn-toggle-qr" class="zs-btn-ghost" style="padding:0.75rem 0.85rem;border:1px solid ${state.showQr ? '#10b981' : 'rgba(148,163,184,0.25)'};border-radius:0.75rem;font-size:0.8rem;">
                              📱 ${escapeHtml(state.showQr ? t.sender.hideQr : t.sender.showQr)}
                            </button>
                          </div>

                          <p style="font-size:0.7rem;color:#94a3b8;margin:0.55rem 0 0 0;">${escapeHtml(t.sender.seedHint)}</p>

                          ${
                            state.showQr
                              ? `<div style="margin-top:0.85rem;padding-top:0.85rem;border-top:1px solid rgba(148,163,184,0.2);display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                                  <div style="padding:0.5rem;background:#ffffff;border-radius:0.75rem;display:inline-flex;">
                                    ${renderSeedQrSvg(state.senderSeed, 112)}
                                  </div>
                                  <div style="flex:1;min-width:12rem;">
                                    <div style="font-size:0.8rem;font-weight:700;">${escapeHtml(t.sender.qrModalTitle)}</div>
                                    <p style="font-size:0.72rem;color:#94a3b8;margin:0.25rem 0;">${escapeHtml(t.sender.qrModalHint)}</p>
                                    <div class="font-mono" style="font-size:0.78rem;color:#10b981;font-weight:700;">${escapeHtml(state.senderSeed)}</div>
                                  </div>
                                </div>`
                              : ''
                          }
                        </div>

                        <!-- Dropzone -->
                        <div class="zs-dropzone" style="margin-top:1rem;">
                          <div style="font-size:1.6rem;margin-bottom:0.35rem;">📦</div>
                          <div style="font-size:0.9rem;font-weight:700;">${escapeHtml(t.sender.selectFilesTitle)}</div>
                          <div style="font-size:0.75rem;color:#94a3b8;margin-top:0.2rem;">${escapeHtml(t.sender.selectFilesSubtitle)}</div>

                          <input type="file" id="zs-input-files" multiple style="display:none;" />
                          <input type="file" id="zs-input-folder" webkitdirectory directory multiple style="display:none;" />

                          <div style="display:flex;justify-content:center;gap:0.65rem;margin-top:0.85rem;flex-wrap:wrap;">
                            <button type="button" id="zs-btn-browse-files" ${isStreaming ? 'disabled' : ''} class="zs-btn-primary" style="padding:0.55rem 1rem;font-size:0.78rem;">
                              📄 ${escapeHtml(t.sender.browseFilesBtn)}
                            </button>
                            <button type="button" id="zs-btn-browse-folder" ${isStreaming ? 'disabled' : ''} class="zs-btn-sky" style="padding:0.55rem 1rem;font-size:0.78rem;">
                              📁 ${escapeHtml(t.sender.browseFolderBtn)}
                            </button>
                          </div>
                        </div>

                        <!-- Queue Section -->
                        <div style="margin-top:1rem;">
                          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
                            <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#94a3b8;">
                              ${escapeHtml(t.sender.queueTitle)}
                              ${
                                state.queuedEntries.length > 0
                                  ? `<span class="font-mono" style="margin-left:0.4rem;color:#10b981;">(${state.queuedEntries.length} ${escapeHtml(t.sender.filesSelected)} • ${formatBytes(totalQueueBytes)})</span>`
                                  : ''
                              }
                            </span>
                            ${
                              state.queuedEntries.length > 0 && !isStreaming
                                ? `<button type="button" id="zs-btn-clear-queue" style="background:transparent;color:#fb7185;font-size:0.75rem;font-weight:600;">🗑️ ${escapeHtml(t.sender.clearQueue)}</button>`
                                : ''
                            }
                          </div>

                          ${
                            state.queuedEntries.length === 0
                              ? `<div class="zs-subcard" style="padding:0.85rem;text-align:center;font-size:0.75rem;color:#94a3b8;">
                                  ${escapeHtml(t.sender.emptyQueueHint)}
                                </div>`
                              : `
                                ${
                                  state.hasDirectoryInQueue || state.queuedEntries.length > 1
                                    ? `<div style="margin-bottom:0.5rem;padding:0.55rem 0.85rem;border-radius:0.65rem;background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.3);font-size:0.75rem;color:#38bdf8;display:flex;justify-content:space-between;">
                                        <span>🗜️ ${escapeHtml(t.sender.zipStreamReady)}: <strong>${escapeHtml(state.rootFolderName ? state.rootFolderName + '.zip' : 'ZeroSeed-Archive.zip')}</strong></span>
                                        <span class="font-mono">ZIP Stream</span>
                                      </div>`
                                    : ''
                                }
                                <div style="max-height:8.5rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.35rem;margin-bottom:0.75rem;">
                                  ${state.queuedEntries
                                    .slice(0, 20)
                                    .map(
                                      (it) => `
                                    <div class="zs-subcard font-mono" style="padding:0.45rem 0.75rem;font-size:0.72rem;display:flex;justify-content:space-between;gap:0.5rem;">
                                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(it.relativePath)}</span>
                                      <span style="color:#94a3b8;flex-shrink:0;">${formatBytes(it.file.size)}</span>
                                    </div>`
                                    )
                                    .join('')}
                                </div>
                                <button type="button" id="zs-btn-start-send" ${!isTunnelOpen || isStreaming ? 'disabled' : ''} class="zs-btn-primary" style="width:100%;padding:0.8rem;font-size:0.88rem;">
                                  🚀 ${escapeHtml(t.sender.startTransferBtn)}
                                </button>
                              `
                          }
                        </div>
                      `
                      : `
                        <!-- RECEIVER VIEW -->
                        <div class="zs-subcard" style="padding:1rem;">
                          <label for="zs-receiver-seed" style="display:block;font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:0.5rem;">
                            ${escapeHtml(t.receiver.seedInputLabel)}
                          </label>
                          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <input id="zs-receiver-seed" type="text" value="${escapeHtml(state.receiverSeedInput)}" placeholder="${escapeHtml(t.receiver.seedInputPlaceholder)}" maxlength="64" class="zs-input font-mono" style="flex:1;min-width:14rem;" autocomplete="off" spellcheck="false" />
                            ${
                              !isTunnelOpen
                                ? `<button type="button" id="zs-btn-connect-rx" class="zs-btn-sky" style="padding:0.75rem 1.25rem;font-size:0.85rem;">⚡ ${escapeHtml(t.receiver.connectBtn)}</button>`
                                : `<button type="button" id="zs-btn-disconnect-rx" style="padding:0.75rem 1rem;border-radius:0.75rem;background:rgba(244,63,94,0.15);color:#fb7185;border:1px solid rgba(244,63,94,0.3);font-size:0.8rem;font-weight:700;">${escapeHtml(t.receiver.disconnectBtn)}</button>`
                            }
                          </div>
                          <p style="font-size:0.72rem;color:#94a3b8;margin:0.5rem 0 0 0;">${escapeHtml(t.receiver.seedFormatHint)}</p>
                        </div>

                        ${
                          state.incomingOffer
                            ? `<div style="margin-top:1rem;padding:1.15rem;border-radius:1rem;background:rgba(16,185,129,0.1);border:2px solid rgba(16,185,129,0.4);">
                                <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:#10b981;">${escapeHtml(t.receiver.incomingOfferTitle)}</div>
                                <div class="font-mono" style="font-size:1rem;font-weight:800;margin-top:0.25rem;word-break:break-all;">${escapeHtml(state.incomingOffer.fileName)}</div>
                                <div class="font-mono" style="font-size:0.75rem;color:#94a3b8;margin-top:0.2rem;">
                                  ${formatBytes(state.incomingOffer.fileSize)}
                                </div>
                                <div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.9rem;">
                                  ${
                                    diskSupported
                                      ? `<button type="button" id="zs-btn-accept-disk" class="zs-btn-primary" style="flex:1;padding:0.75rem 1rem;font-size:0.82rem;">💾 ${escapeHtml(t.receiver.acceptSaveDiskBtn)}</button>
                                         <button type="button" id="zs-btn-accept-ram" class="zs-btn-ghost" style="padding:0.75rem 1rem;border:1px solid rgba(148,163,184,0.3);border-radius:0.75rem;font-size:0.78rem;font-weight:600;">${escapeHtml(t.receiver.acceptRamFallbackBtn)}</button>`
                                      : `<button type="button" id="zs-btn-accept-ram" class="zs-btn-primary" style="width:100%;padding:0.75rem 1rem;font-size:0.85rem;">📥 ${escapeHtml(t.receiver.acceptRamFallbackBtn)}</button>`
                                  }
                                </div>
                                <p style="font-size:0.7rem;color:#94a3b8;margin:0.6rem 0 0 0;">${escapeHtml(t.receiver.autoStreamNotice)}</p>
                              </div>`
                            : `<div class="zs-subcard font-mono" style="margin-top:1rem;padding:1.25rem;text-align:center;font-size:0.78rem;color:#94a3b8;">
                                ${
                                  tm.phase === 'connecting_broker'
                                    ? escapeHtml(t.receiver.connectingBroker)
                                    : tm.phase === 'waiting_peer'
                                    ? escapeHtml(t.receiver.waitingSenderOffer)
                                    : tm.phase === 'connected'
                                    ? escapeHtml(t.receiver.connectedReady)
                                    : escapeHtml(t.receiver.seedFormatHint)
                                }
                              </div>`
                        }
                      `
                  }
                </div>
              </section>

              <!-- Right Column: Live Cryptographic Telemetry & Encrypted Instant Clipboard -->
              <section style="display:flex;flex-direction:column;gap:1.25rem;">
                <div id="zs-telemetry-panel" class="zs-card" style="padding:1.25rem;">
                  ${buildTelemetryCardInnerHtml()}
                </div>

                <!-- Encrypted Instant Clipboard -->
                <div class="zs-card" style="padding:1.25rem;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.65rem;">
                    <h3 style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0;">
                      💬 ${escapeHtml(t.clipboard.title)}
                    </h3>
                    <span class="font-mono" style="font-size:0.65rem;padding:0.15rem 0.45rem;border-radius:0.35rem;background:rgba(14,165,233,0.12);color:#38bdf8;border:1px solid rgba(14,165,233,0.25);">
                      ${escapeHtml(t.clipboard.encryptedBadge)}
                    </span>
                  </div>

                  <textarea id="zs-clipboard-input" rows="2" placeholder="${escapeHtml(t.clipboard.placeholder)}" ${!isTunnelOpen ? 'disabled' : ''} maxlength="${SITE_CONFIG.maxClipboardChars}" class="zs-input font-mono" style="font-size:0.78rem;resize:none;">${escapeHtml(state.clipboardDraft)}</textarea>

                  <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;">
                    ${
                      state.clipboardItems.length > 0
                        ? `<button type="button" id="zs-btn-clear-clip" class="zs-btn-ghost" style="padding:0.4rem 0.75rem;font-size:0.75rem;color:#fb7185;">${escapeHtml(t.clipboard.clearBtn)}</button>`
                        : ''
                    }
                    <button type="button" id="zs-btn-send-clip" ${!isTunnelOpen ? 'disabled' : ''} class="zs-btn-sky" style="padding:0.45rem 0.95rem;font-size:0.78rem;">
                      🔒 ${escapeHtml(t.clipboard.sendBtn)}
                    </button>
                  </div>

                  <div style="margin-top:0.75rem;max-height:9rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.45rem;">
                    ${
                      state.clipboardItems.length === 0
                        ? `<div style="text-align:center;font-size:0.72rem;color:#64748b;padding:0.4rem;">${escapeHtml(t.clipboard.emptyState)}</div>`
                        : state.clipboardItems
                            .map(
                              (item) => `
                          <div class="zs-subcard" style="padding:0.6rem 0.75rem;font-size:0.75rem;">
                            <div class="font-mono" style="display:flex;justify-content:space-between;font-size:0.65rem;margin-bottom:0.25rem;">
                              <span style="font-weight:700;color:${item.direction === 'sent' ? '#10b981' : '#38bdf8'};">${escapeHtml(item.direction === 'sent' ? t.clipboard.sentTag : t.clipboard.receivedTag)}</span>
                              <button type="button" data-copy-clip="${escapeHtml(item.id)}" style="background:transparent;color:#94a3b8;font-size:0.65rem;">
                                ${state.copiedClipId === item.id ? '✓ ' + escapeHtml(t.clipboard.copiedBtn) : '📋 ' + escapeHtml(t.clipboard.copyBtn)}
                              </button>
                            </div>
                            <pre class="font-mono" style="margin:0;white-space:pre-wrap;word-break:break-all;font-size:0.75rem;">${escapeHtml(item.text)}</pre>
                          </div>`
                            )
                            .join('')
                    }
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>

        <!-- Footer & 3 Info Cards -->
        <footer style="margin-top:2rem;border-top:1px solid rgba(148,163,184,0.18);padding:1.75rem 0;">
          <div class="zs-container">
            <div class="zs-cards-grid">
              <div class="zs-subcard" style="padding:1rem;">
                <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:#38bdf8;margin-bottom:0.35rem;">⚡ ${escapeHtml(t.cards.card1Title)}</div>
                <p style="font-size:0.75rem;color:#94a3b8;margin:0;line-height:1.5;">${escapeHtml(t.cards.card1Desc)}</p>
              </div>
              <div class="zs-subcard" style="padding:1rem;">
                <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:#10b981;margin-bottom:0.35rem;">🛡️ ${escapeHtml(t.cards.card2Title)}</div>
                <p style="font-size:0.75rem;color:#94a3b8;margin:0;line-height:1.5;">${escapeHtml(t.cards.card2Desc)}</p>
              </div>
              <div class="zs-subcard" style="padding:1rem;">
                <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:#a78bfa;margin-bottom:0.35rem;">💾 ${escapeHtml(t.cards.card3Title)}</div>
                <p style="font-size:0.75rem;color:#94a3b8;margin:0;line-height:1.5;">${escapeHtml(t.cards.card3Desc)}</p>
              </div>
            </div>

            <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid rgba(148,163,184,0.12);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;font-size:0.72rem;color:#94a3b8;">
              <div class="font-mono" style="display:flex;flex-wrap:wrap;gap:0.6rem;">
                <span style="padding:0.2rem 0.65rem;border-radius:9999px;background:rgba(148,163,184,0.12);">🟢 ${escapeHtml(t.footer.stunStatus)}</span>
                <span style="padding:0.2rem 0.65rem;border-radius:9999px;background:rgba(148,163,184,0.12);">
                  ${
                    state.brokerStatus.locked
                      ? '🔒 ' + escapeHtml(t.sender.roomLockedBadge)
                      : (state.brokerStatus.connected ? '🟢 ' : '🟡 ') +
                        escapeHtml(t.footer.brokerStatus) +
                        ' ' +
                        escapeHtml(state.brokerStatus.connected ? t.footer.brokerConnected : t.footer.brokerStandby)
                  }
                </span>
              </div>
              <div style="color:#10b981;font-weight:600;">
                🚫 ${escapeHtml(t.footer.zeroCookieStatement)}
              </div>
            </div>
          </div>
        </footer>

        <!-- How It Works Modal -->
        ${
          state.howItWorksOpen
            ? `<div class="zs-modal-overlay" id="zs-modal-how-backdrop">
                <div class="zs-card zs-modal-box">
                  <div style="padding:1rem 1.35rem;border-bottom:1px solid rgba(148,163,184,0.2);display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <h2 style="font-size:1.1rem;font-weight:800;margin:0;">${escapeHtml(t.modals.howItWorks.title)}</h2>
                      <p style="font-size:0.75rem;color:#94a3b8;margin:0.15rem 0 0 0;">${escapeHtml(t.modals.howItWorks.subtitle)}</p>
                    </div>
                    <button type="button" id="zs-close-how" class="zs-btn-ghost" style="padding:0.35rem 0.6rem;font-size:1rem;">✕</button>
                  </div>
                  <div style="padding:1.25rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.75rem;">
                    <div class="zs-subcard" style="padding:0.9rem;">
                      <div style="font-size:0.85rem;font-weight:700;color:#10b981;">${escapeHtml(t.modals.howItWorks.step1Title)}</div>
                      <p style="font-size:0.76rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.howItWorks.step1Desc)}</p>
                    </div>
                    <div class="zs-subcard" style="padding:0.9rem;">
                      <div style="font-size:0.85rem;font-weight:700;color:#38bdf8;">${escapeHtml(t.modals.howItWorks.step2Title)}</div>
                      <p style="font-size:0.76rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.howItWorks.step2Desc)}</p>
                    </div>
                    <div class="zs-subcard" style="padding:0.9rem;">
                      <div style="font-size:0.85rem;font-weight:700;color:#a78bfa;">${escapeHtml(t.modals.howItWorks.step3Title)}</div>
                      <p style="font-size:0.76rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.howItWorks.step3Desc)}</p>
                    </div>
                    <div class="zs-subcard" style="padding:0.9rem;">
                      <div style="font-size:0.85rem;font-weight:700;color:#fbbf24;">${escapeHtml(t.modals.howItWorks.step4Title)}</div>
                      <p style="font-size:0.76rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.howItWorks.step4Desc)}</p>
                    </div>
                    <div style="padding:0.85rem;border-radius:0.75rem;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);">
                      <div style="font-size:0.78rem;font-weight:700;color:#fbbf24;">💡 ${escapeHtml(t.modals.howItWorks.noteTitle)}</div>
                      <p style="font-size:0.74rem;color:#cbd5e1;margin:0.25rem 0 0 0;">${escapeHtml(t.modals.howItWorks.noteDesc)}</p>
                    </div>
                  </div>
                </div>
              </div>`
            : ''
        }

        <!-- Security Architecture Modal -->
        ${
          state.securityOpen
            ? `<div class="zs-modal-overlay" id="zs-modal-sec-backdrop">
                <div class="zs-card zs-modal-box">
                  <div style="padding:1rem 1.35rem;border-bottom:1px solid rgba(148,163,184,0.2);display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <h2 style="font-size:1.1rem;font-weight:800;margin:0;">🛡️ ${escapeHtml(t.modals.security.title)}</h2>
                      <p style="font-size:0.75rem;color:#94a3b8;margin:0.15rem 0 0 0;">${escapeHtml(t.modals.security.subtitle)}</p>
                    </div>
                    <button type="button" id="zs-close-sec" class="zs-btn-ghost" style="padding:0.35rem 0.6rem;font-size:1rem;">✕</button>
                  </div>
                  <div style="padding:1.25rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.9rem;">
                    <div class="zs-grid-2">
                      <div class="zs-subcard" style="padding:0.85rem;">
                        <div style="font-size:0.8rem;font-weight:700;color:#10b981;">${escapeHtml(t.modals.security.arch1Title)}</div>
                        <p style="font-size:0.74rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.security.arch1Desc)}</p>
                      </div>
                      <div class="zs-subcard" style="padding:0.85rem;">
                        <div style="font-size:0.8rem;font-weight:700;color:#38bdf8;">${escapeHtml(t.modals.security.arch2Title)}</div>
                        <p style="font-size:0.74rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.security.arch2Desc)}</p>
                      </div>
                      <div class="zs-subcard" style="padding:0.85rem;">
                        <div style="font-size:0.8rem;font-weight:700;color:#a78bfa;">${escapeHtml(t.modals.security.arch3Title)}</div>
                        <p style="font-size:0.74rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.security.arch3Desc)}</p>
                      </div>
                      <div class="zs-subcard" style="padding:0.85rem;">
                        <div style="font-size:0.8rem;font-weight:700;color:#fbbf24;">${escapeHtml(t.modals.security.arch4Title)}</div>
                        <p style="font-size:0.74rem;color:#94a3b8;margin:0.3rem 0 0 0;">${escapeHtml(t.modals.security.arch4Desc)}</p>
                      </div>
                    </div>
                    <div style="padding:0.85rem;border-radius:0.75rem;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.28);">
                      <div style="font-size:0.78rem;font-weight:700;color:#34d399;">✓ ${escapeHtml(t.modals.security.zeroPersistenceTitle)}</div>
                      <p style="font-size:0.74rem;color:#cbd5e1;margin:0.25rem 0 0 0;">${escapeHtml(t.modals.security.zeroPersistenceDesc)}</p>
                    </div>
                  </div>
                </div>
              </div>`
            : ''
        }
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.onclick = fn;
    };

    on('zs-lang-tr', () => {
      state.lang = 'tr';
      renderApp();
    });
    on('zs-lang-en', () => {
      state.lang = 'en';
      renderApp();
    });
    on('zs-btn-theme', () => {
      state.darkMode = !state.darkMode;
      renderApp();
    });
    on('zs-btn-how', () => {
      state.howItWorksOpen = true;
      renderApp();
    });
    on('zs-close-how', () => {
      state.howItWorksOpen = false;
      renderApp();
    });
    on('zs-modal-how-backdrop', (e) => {
      if (e.target && e.target.id === 'zs-modal-how-backdrop') {
        state.howItWorksOpen = false;
        renderApp();
      }
    });
    on('zs-btn-sec', () => {
      state.securityOpen = true;
      renderApp();
    });
    on('zs-close-sec', () => {
      state.securityOpen = false;
      renderApp();
    });
    on('zs-modal-sec-backdrop', (e) => {
      if (e.target && e.target.id === 'zs-modal-sec-backdrop') {
        state.securityOpen = false;
        renderApp();
      }
    });

    on('zs-btn-dismiss-err', () => {
      state.errorCode = null;
      renderApp();
    });
    on('zs-btn-reconnect', () => {
      if (state.role === 'sender') {
        startSessionWithSeed(state.senderSeed, 'sender');
      } else if (state.receiverSeedInput) {
        startSessionWithSeed(state.receiverSeedInput, 'receiver');
      }
    });

    on('zs-tab-send', () => {
      if (state.role !== 'sender') {
        state.role = 'sender';
        state.errorCode = null;
        state.incomingOffer = null;
        state.clipboardItems = [];
        revokeActiveBlobUrl();
        if (receiverActiveState) {
          receiverActiveState.writer.abort();
          receiverActiveState = null;
        }
        senderAckMap.clear();
        startSessionWithSeed(state.senderSeed, 'sender');
      }
    });

    on('zs-tab-receive', () => {
      if (state.role !== 'receiver') {
        state.role = 'receiver';
        state.errorCode = null;
        state.incomingOffer = null;
        state.clipboardItems = [];
        revokeActiveBlobUrl();
        if (receiverActiveState) {
          receiverActiveState.writer.abort();
          receiverActiveState = null;
        }
        senderAckMap.clear();
        fullDisconnect();
        state.telemetry.phase = 'idle';
        state.telemetry.topicHashHex = '';
        state.telemetry.fingerprint = '';
        state.telemetry.roomLocked = false;
        renderApp();
      }
    });

    on('zs-btn-copy-seed', async () => {
      try {
        await navigator.clipboard.writeText(state.senderSeed);
        state.seedCopied = true;
        renderApp();
        setTimeout(() => {
          state.seedCopied = false;
          renderApp();
        }, 1600);
      } catch (_e) {}
    });

    on('zs-btn-regen-seed', () => {
      state.senderSeed = generateRandomSeed();
      senderAckMap.clear();
      state.clipboardItems = [];
      revokeActiveBlobUrl();
      if (receiverActiveState) {
        receiverActiveState.writer.abort();
        receiverActiveState = null;
      }
      startSessionWithSeed(state.senderSeed, 'sender');
    });

    on('zs-btn-toggle-qr', () => {
      state.showQr = !state.showQr;
      renderApp();
    });

    const fileInput = document.getElementById('zs-input-files');
    const folderInput = document.getElementById('zs-input-folder');
    on('zs-btn-browse-files', () => fileInput && fileInput.click());
    on('zs-btn-browse-folder', () => folderInput && folderInput.click());

    if (fileInput) {
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const parsed = filesToRelativeEntries(e.target.files);
          state.queuedEntries = state.queuedEntries.concat(parsed.entries);
          if (parsed.hasDirectory) state.hasDirectoryInQueue = true;
          if (parsed.rootFolderName && !state.rootFolderName) {
            state.rootFolderName = parsed.rootFolderName;
          }
          renderApp();
        }
      };
    }

    if (folderInput) {
      folderInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const parsed = filesToRelativeEntries(e.target.files);
          state.queuedEntries = state.queuedEntries.concat(parsed.entries);
          state.hasDirectoryInQueue = true;
          if (parsed.rootFolderName && !state.rootFolderName) {
            state.rootFolderName = parsed.rootFolderName;
          }
          renderApp();
        }
      };
    }

    on('zs-btn-clear-queue', () => {
      state.queuedEntries = [];
      state.hasDirectoryInQueue = false;
      state.rootFolderName = null;
      renderApp();
    });

    on('zs-btn-start-send', () => {
      startSendingQueue();
    });

    const rxInput = document.getElementById('zs-receiver-seed');
    if (rxInput) {
      rxInput.oninput = (e) => {
        state.receiverSeedInput = e.target.value;
      };
      rxInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const btn = document.getElementById('zs-btn-connect-rx');
          if (btn) btn.click();
        }
      };
    }

    on('zs-btn-connect-rx', () => {
      const norm = normalizeSeed(state.receiverSeedInput);
      if (!isValidSeedFormat(norm)) {
        state.errorCode = 'invalidSeed';
        renderApp();
        return;
      }
      state.receiverSeedInput = norm;
      startSessionWithSeed(norm, 'receiver');
    });

    on('zs-btn-disconnect-rx', () => {
      fullDisconnect();
      state.telemetry.phase = 'idle';
      renderApp();
    });

    on('zs-btn-accept-disk', () => acceptOffer(true));
    on('zs-btn-accept-ram', () => acceptOffer(false));

    const clipInput = document.getElementById('zs-clipboard-input');
    if (clipInput) {
      clipInput.oninput = (e) => {
        state.clipboardDraft = e.target.value;
      };
    }

    on('zs-btn-send-clip', async () => {
      const trimmed = state.clipboardDraft.trim().slice(0, SITE_CONFIG.maxClipboardChars);
      if (!trimmed) return;
      const id = 'cb_' + generateRandomHex(6);
      const ts = Date.now();
      await sendControlFrame({
        type: 'CLIPBOARD_TEXT',
        id: id,
        text: trimmed,
        timestamp: ts,
      });
      state.clipboardItems.unshift({
        id: id,
        text: trimmed,
        direction: 'sent',
        timestamp: ts,
      });
      if (state.clipboardItems.length > SITE_CONFIG.maxClipboardItems) {
        state.clipboardItems.length = SITE_CONFIG.maxClipboardItems;
      }
      state.clipboardDraft = '';
      renderApp();
    });

    on('zs-btn-clear-clip', () => {
      state.clipboardItems = [];
      renderApp();
    });

    const copyButtons = document.querySelectorAll('[data-copy-clip]');
    copyButtons.forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-copy-clip');
        const found = state.clipboardItems.find((it) => it.id === id);
        if (found) {
          try {
            await navigator.clipboard.writeText(found.text);
            state.copiedClipId = id;
            renderApp();
            setTimeout(() => {
              state.copiedClipId = null;
              renderApp();
            }, 1500);
          } catch (_e) {}
        }
      };
    });

    bindTelemetryEvents();
  }

  async function acceptOffer(preferDisk) {
    const offer = state.incomingOffer;
    if (!offer) return;
    try {
      revokeActiveBlobUrl();
      const writer = await StreamFileWriter.create(
        offer.fileName,
        'application/octet-stream',
        preferDisk
      );
      speedTracker.lastTimestamp = performance.now();
      speedTracker.lastBytes = 0;
      speedTracker.smoothedSpeed = 0;

      const maxAllowedBytes = offer.isFolderArchive
        ? offer.fileSize + offer.itemCount * 1024 + 1024 * 1024
        : offer.fileSize;

      receiverActiveState = {
        fileId: offer.fileId,
        writer: writer,
        lastChunkIndex: -1,
        expectedNextChunk: 0,
        bytesWritten: 0,
        totalBytes: offer.fileSize,
        maxAllowedBytes: maxAllowedBytes,
        totalChunks: offer.totalChunks,
        fileName: offer.fileName,
        isFolderArchive: offer.isFolderArchive,
        disconnectedForResume: false,
      };

      state.incomingOffer = null;
      state.telemetry.phase = 'transferring';
      state.telemetry.writeMode = writer.mode;
      state.telemetry.activeFileName = offer.fileName;
      state.telemetry.totalBytes = offer.fileSize;
      state.telemetry.totalChunks = offer.totalChunks;
      state.telemetry.currentChunk = 0;
      state.telemetry.lastAckedChunk = -1;
      state.telemetry.resumedFromChunk = null;
      state.telemetry.completedDownloadUrl = null;
      renderApp();

      await sendControlFrame({
        type: 'FILE_ACCEPT',
        fileId: offer.fileId,
        storageMode: writer.mode,
        resumeFromChunk: 0,
      });
    } catch (_e) {
      state.errorCode = 'fileWriteError';
      renderApp();
    }
  }

  // Global Full-Screen Drag & Drop Listeners
  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      dragDepth += 1;
      if (!state.isDraggingWindow) {
        state.isDraggingWindow = true;
        renderApp();
      }
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0 && state.isDraggingWindow) {
      state.isDraggingWindow = false;
      renderApp();
    }
  });

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragDepth = 0;
    state.isDraggingWindow = false;
    if (e.dataTransfer) {
      const extracted = await extractDroppedEntries(e.dataTransfer);
      if (extracted.entries.length > 0) {
        if (state.role !== 'sender') {
          state.role = 'sender';
          startSessionWithSeed(state.senderSeed, 'sender');
        }
        state.queuedEntries = state.queuedEntries.concat(extracted.entries);
        if (extracted.hasDirectory) state.hasDirectoryInQueue = true;
        if (extracted.rootFolderName && !state.rootFolderName) {
          state.rootFolderName = extracted.rootFolderName;
        }
      }
    }
    renderApp();
  });

  window.addEventListener('pagehide', () => {
    fullDisconnect();
    if (receiverActiveState) {
      receiverActiveState.writer.abort();
      receiverActiveState = null;
    }
    senderAckMap.clear();
    state.clipboardItems = [];
  });

  // Boot application immediately on DOM ready
  function boot() {
    renderApp();
    startSessionWithSeed(state.senderSeed, 'sender');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
