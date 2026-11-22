# ZeroSeed.io — Sunucusuz, Uçtan Uca Şifreli P2P Dosya & Klasör Transferi

**ZeroSeed.io**, hesap açmadan, hiçbir bulut sunucusuna dosya yüklemeden ve cihazda hiçbir iz (çerez, log, geçmiş) bırakmadan yalnızca tek kullanımlık bir **bağlantı kodu (Seed)** paylaşarak tarayıcılar arası doğrudan (**Peer-to-Peer**) büyük dosya, klasör ve metin aktarımı sağlayan web uygulamasıdır.

> **Sıfır Kurulumla Çalışır:** Kök dizindeki `index.html`, `styles.css` ve `app.bundle.js` dosyaları hiçbir derleme aracı veya arka uç sunucusu gerektirmeden doğrudan tarayıcıda ve **GitHub Pages** üzerinde çalışır.

---

## Öne Çıkan Özellikler

- **%100 Tarayıcıdan Tarayıcıya (WebRTC):** Dosyalar hiçbir sunucuya yüklenmez; cihazlar doğrudan `RTCDataChannel` üzerinden haberleşir.
- **Sınırsız Boyut & Doğrudan Diske Yazma:** Destekleyen tarayıcılarda **File System Access API** (`FileSystemWritableFileStream`) ile çoklu GB boyutundaki dosyalar RAM şişmeden doğrudan seçilen klasöre yazılır (desteklemeyen tarayıcılarda güvenli `Blob` indirme yedeği devreye girer).
- **Klasör Sürükle-Bırak & Anlık ZIP Akışı:** Sayfanın herhangi bir yerine sürüklenen klasörler veya çoklu dosyalar belleği doldurmadan anlık olarak ZIP akışına dönüştürülür, şifrelenir ve gönderilir.
- **Koptuğu Yerden Devam Etme (Resume / ACK):** Alıcı her 16 parçada bir onay (ACK) gönderir. Bağlantı anlık koptuğunda sekmeler açıkken aynı kodla yeniden bağlanılarak tekil dosyalar kaldığı parçadan devam eder.
- **Otomatik Çoklu Dil (TR / EN) & Karanlık/Aydınlık Tema:** `navigator.language` değerine göre Türkçe veya İngilizce otomatik başlar; dil ve tema tercihi gizlilik gereği yalnızca geçici bellekte tutulur.
- **QR Kod & Şifreli Hızlı Pano:** Tek kullanımlık bağlantı kodu mobil cihazlar için anlık QR kod olarak üretilir; bağlı cihazlar arasında uçtan uca şifreli metin/bağlantı paylaşımı yapılabilir.

---

## Güvenlik Mimarisi

ZeroSeed.io, yalnızca tarayıcının donanım hızlandırmalı yerleşik **Web Crypto API (`window.crypto.subtle`)** arayüzünü kullanır:

- **Zorunlu CSPRNG Rastgele Seed:** Kullanıcıların tahmin edilebilir zayıf kodlar seçmesini engellemek için gönderici tarafında yalnızca `window.crypto.getRandomValues()` ile 256 kelimelik evrensel ASCII havuzdan kod üretilir (örn. `8412-iron-forest-cloud`).
- **İkili Türetme + HKDF Anahtar Ayrımı:**
  - **Kör Sinyalizasyon Kanalı:** `SHA-256(seed)` özetinin ilk 128 biti (`p2p-io/v1/<32_hex>`) kullanılır; sinyal sunucusu gerçek kodu asla göremez.
  - **İzole Şifreleme Anahtarları:** `PBKDF2-HMAC-SHA256` (`150.000` iterasyon) ana sırrı **HKDF-SHA-256** ile iki ayrı dışa aktarılamaz (`extractable: false`) 256-bit `AES-GCM` anahtarına bölünür: sinyalizasyon için `signalKey`, veri/kontrol aktarımı için `transferKey`.
- **Parça Bazlı AES-GCM-256 & AAD Bütünlüğü:** Her 64 KB parça `[4B Big-Endian chunkIndex + 12B IV + Şifreli Veri + 16B GCM Auth Tag]` formatında gönderilir. `fileId` ve `chunkIndex` GCM AAD olarak doğrulanır; oturum başına 8 byte CSPRNG önek + 4 byte sayaç ile IV çakışması engellenir. Doğrulama hatasında veya sıra dışı parça algılandığında aktarım anında durdurulur.
- **Yedekli Kör Sinyalizasyon & Oda Kilitleme (Anti-Hijack):** HiveMQ, EMQX ve Mosquitto WSS MQTT v3.1.1 sunucuları arasında 3 saniyelik otomatik geçiş yapılır. Tüm WebRTC SDP/ICE mesajları şifreli, nonce tekrar korumalı ve 60 saniye zaman pencereli olarak iletilir. İlk alıcıyla `DataChannel` açıldığı saniye sinyal sunucusuyla bağlantı kesilerek oda dışarıya kilitlenir.
- **İstemci & Tarayıcı Sertleştirmesi:**
  - Dosya adlarında yol geçişi (`../`), Windows cihaz adları ve Unicode BiDi/RLO (`U+202E`) sahteciliğine karşı temizleme (`sanitizeFileName`).
  - ZIP akışında Zip Slip koruması (`sanitizeArchivePath`), klasör derinliği (`32`) ve dosya sayısı (`10.000`) sınırları.
  - Same-Origin Blob XSS'i önlemek için zorunlu `application/octet-stream` MIME tipi, RAM yedek modunda `512 MB` üst sınırı ve alıcıda boyut taşması koruması.
  - Katı `Content-Security-Policy` (CSP), `no-referrer` politikası ve sekme kapanışında (`pagehide`) tüm `blob:` URL'leri ile geçici belleğin temizlenmesi.
  - **Sıfır Kalıcı Veri:** `localStorage`, `sessionStorage`, `IndexedDB`, çerez veya URL `#hash` kesinlikle kullanılmaz.

---

## Hızlı Kullanım ve Yayınlama

### 1. Doğrudan Tarayıcıda Açma (Kurulumsuz)
Depoyu indirin ve `index.html` dosyasına çift tıklayarak modern bir tarayıcıda açın.

### 2. GitHub Pages ile Yayınlama
Yalnızca şu 3 dosya (veya kök dizindeki tüm dosyalar) tek başına çalışmak için yeterlidir:
- `index.html`
- `styles.css`
- `app.bundle.js`

GitHub deponuzda **Settings → Pages → Source: Deploy from a branch (`main` / `root`)** seçeneğini etkinleştirdiğinizde uygulama doğrudan HTTPS üzerinden yayına girer.

### 3. Geliştirici Ortamı (Vite + React + TypeScript)
İsterseniz kaynak TypeScript/React dosyalarını yerel olarak derleyebilirsiniz:

```bash
npm install
npm run dev
```

Üretim derlemesi için:

```bash
npm run build
```

---

## Proje Dosya Yapısı (Düz / Klasörsüz)

Tüm dosyalar kolay paylaşım ve yükleme için kök dizinde yer alır:

| Dosya | Açıklama |
| :--- | :--- |
| `index.html` | Uygulama giriş noktası, SEO meta etiketleri, SVG favicon ve CSP başlıkları |
| `app.bundle.js` | Sıfır bağımlılıklı, doğrudan tarayıcıda çalışan tam üretim paketi |
| `styles.css` | Derlenmiş karanlık/aydınlık tema stilleri |
| `site.ts` | Marka adı, STUN/WSS broker listesi ve güvenlik sınır sabitleri |
| `translations.ts` | Sıfır çerezli Türkçe / İngilizce (`TR` / `EN`) dil sözlüğü ve React Context |
| `seedCrypto.ts` | CSPRNG Seed üretici, SHA-256 + PBKDF2 + HKDF anahtar türetme ve AES-GCM-256 paketleme |
| `signaling.ts` | Saf WebSocket MQTT v3.1.1 istemcisi, 3 broker failover, replay koruması ve oda kilitleme |
| `fileWriter.ts` | File System Access API doğrudan disk yazıcı, RAM Blob yedeği ve dosya adı temizleyici |
| `folderStream.ts` | Özyinelemeli klasör tarayıcı, Zip Slip koruması ve anlık ZIP akışı |
| `usePeerTransfer.ts` | WebRTC yaşam döngüsü, ACK/Resume, backpressure ve şifreli pano yönetimi |
| `App.tsx`, `Navbar.tsx`, `TransferWorkspace.tsx`, `HowItWorksModal.tsx`, `SecurityModal.tsx`, `Footer.tsx` | React + Tailwind CSS arayüz bileşenleri |

---

## Nasıl Kullanılır?

1. **Gönderici:** Sayfayı açın (**Dosya Gönder** sekmesi hazırdır). Ekranda oluşan tek kullanımlık bağlantı kodunu kopyalayın veya QR kodu alıcıya gösterin.
2. **Alıcı:** Diğer cihazda **Dosya Al** sekmesine geçin, bağlantı kodunu girin ve **Bağlan** butonuna tıklayın.
3. **Aktarım:** Cihazlar eşleşip oda kilitlendikten sonra gönderici dosya veya klasör seçerek aktarımı başlatır; alıcı kayıt konumunu seçerek indirmeyi başlatır.

> **Not:** Dosyalar bulut sunucusu olmadan doğrudan cihazlar arasında aktarıldığı için transfer tamamlanana kadar her iki cihazda da tarayıcı sekmesinin açık kalması gerekir.

---

## Teknoloji Yığını

- **Arayüz:** React 18, TypeScript, Tailwind CSS, Vite
- **Kriptografi:** Yerleşik Web Crypto API (`SHA-256`, `PBKDF2`, `HKDF`, `AES-GCM-256`, `CSPRNG`)
- **P2P & Ağ:** WebRTC (`RTCPeerConnection`, `RTCDataChannel`), Native WebSocket MQTT v3.1.1 (`wss://`)
- **Dosya & Sıkıştırma:** File System Access API, `fflate` / akış tabanlı PKZIP
