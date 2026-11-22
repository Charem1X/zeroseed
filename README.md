# ZeroSeed.io — Serverless, End-to-End Encrypted P2P File & Folder Transfer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**ZeroSeed.io** is a browser-to-browser (**Peer-to-Peer**) web application for transferring large files, entire folders, and instant text snippets directly between devices using a one-time cryptographic **Seed**—with no accounts, no cloud uploads, no cookies, and zero server-side storage.

> **Zero-Setup Ready:** The root `index.html`, `styles.css`, and `app.bundle.js` files run directly in any modern browser or on **GitHub Pages** with no build step or backend server required.

---

## Key Features

- **100% Browser-to-Browser (WebRTC):** Files never touch an intermediate storage server; payloads stream directly over `RTCDataChannel`.
- **No Size Limits & Direct-to-Disk Streaming:** Uses the **File System Access API** (`FileSystemWritableFileStream`) on supported browsers to write multi-gigabyte transfers straight to disk with minimal RAM usage, with an automatic safe `Blob` download fallback for Firefox/Safari.
- **Folder Drag-and-Drop & Real-Time ZIP Streaming:** Drop files or nested folders anywhere on the page to stream them on the fly as an encrypted ZIP archive without buffering the full archive in memory.
- **Chunk ACK & Mid-File Resume:** The receiver emits an acknowledgment (`ACK`) every 16 chunks. If a connection drops momentarily while tabs remain open, reconnecting with the same Seed seamlessly resumes single-file transfers from the last confirmed chunk.
- **Automatic Bilingual UI (EN / TR) & Theme Toggle:** Automatically detects `navigator.language` (Turkish or English) and supports Dark/Light modes—kept strictly in volatile React/JS memory with zero cookies or storage writes.
- **QR Code Pairing & Encrypted Instant Clipboard:** Generates an offline SVG QR code for quick mobile pairing and includes an end-to-end encrypted text/snippet sharing box once connected.

---

## Security Architecture

ZeroSeed.io relies strictly on the browser's hardware-accelerated native **Web Crypto API (`window.crypto.subtle`)**:

- **Mandatory CSPRNG Random Seeds:** Custom user-typed seeds are disabled on the sender side to eliminate weak/guessable passwords. Every session generates a readable ASCII seed via `window.crypto.getRandomValues()` from a 256-word keyboard-safe English pool (e.g., `8412-iron-forest-cloud`).
- **Dual Derivation + HKDF Key Separation:**
  - **Blind Signaling Channel:** Derived from the first 128 bits of `SHA-256(seed)` (`p2p-io/v1/<32_hex>`). Public signaling brokers never see the actual seed.
  - **Isolated Non-Extractable Keys:** Master secret bits derived via `PBKDF2-HMAC-SHA256` (`150,000` iterations) are split with **HKDF-SHA-256** into two separate non-extractable (`extractable: false`) 256-bit `AES-GCM` keys: `signalKey` for signaling and `transferKey` for DataChannel control and file chunks.
- **Chunk-Level AES-GCM-256 & Authenticated Headers (AAD):** Every 64 KB chunk is framed as `[4B Big-Endian chunkIndex + 12B IV + Ciphertext + 16B GCM Auth Tag]`. Both `fileId` and `chunkIndex` are cryptographically bound via GCM `additionalData` (AAD), and an 8-byte CSPRNG session prefix combined with the 4-byte `chunkIndex` guarantees collision-free IVs across up to 2³² chunks. Any Auth Tag failure, out-of-order chunk, or byte-size mismatch aborts the transfer immediately.
- **Redundant Blind Signaling & Room Locking (Anti-Hijack):** Automatically fails over across HiveMQ, EMQX, and Mosquitto public WSS MQTT v3.1.1 brokers (3-second timeout, capped retry attempts). All WebRTC SDP/ICE messages are encrypted, bound to `topicId` + `senderId` via AAD, protected against replays via 12-byte CSPRNG nonces and a 60-second freshness window, and checked for valid DTLS `sha-256` fingerprints. The instant the first `RTCDataChannel` opens, both peers unsubscribe and disconnect from MQTT, locking the room.
- **Client & Browser Hardening:**
  - Filename sanitization (`sanitizeFileName`) against path traversal (`../`), Windows reserved device names (`CON`, `NUL`, etc.), control characters, and Unicode BiDi/RLO (`U+202E`) spoofing.
  - Archive Zip Slip protection (`sanitizeArchivePath`) with directory recursion depth (`32`) and entry count (`10,000`) caps.
  - Forced `application/octet-stream` Blob MIME type to prevent Same-Origin Blob XSS, a `512 MB` safety cap in RAM fallback mode, and strict received-byte upper bounds.
  - Strict `Content-Security-Policy` (CSP), `no-referrer` policy, and automatic `pagehide` cleanup that revokes `blob:` URLs and clears volatile session data.
  - **Strict Zero Persistence:** Never writes to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or URL `#hash`.

---

## Quick Start & Deployment

### 1. Run Directly in Browser (No Build Needed)
Download the repository and double-click `index.html` to open it in any modern browser.

### 2. Deploy to GitHub Pages
Only these 3 files (or all root files) are needed for static hosting:
- `index.html`
- `styles.css`
- `app.bundle.js`

Enable **Settings → Pages → Source: Deploy from a branch (`main` / `root`)** in your GitHub repository to host it live over HTTPS.

### 3. Local Development (Vite + React + TypeScript)
To build or develop using the TypeScript/React source files:

```bash
npm install
npm run dev
```

For a production Vite build:

```bash
npm run build
```

---

## Project Structure (Flat / Folder-Free)

All files live directly in the repository root for effortless uploading and static deployment:

| File | Purpose |
| :--- | :--- |
| `index.html` | Entry document, SEO metadata, inline SVG favicon, CSP & `no-referrer` headers |
| `app.bundle.js` | Zero-dependency, self-contained production browser bundle |
| `styles.css` | Precompiled dark/light theme stylesheet |
| `site.ts` | Branding config, STUN/WSS broker list, and security limit constants |
| `translations.ts` | Zero-cookie English / Turkish (`EN` / `TR`) dictionary and React Context |
| `seedCrypto.ts` | CSPRNG seed generator, SHA-256 + PBKDF2 + HKDF derivation, and AES-GCM-256 framing |
| `signaling.ts` | Native browser WebSocket MQTT v3.1.1 client, 3-broker failover, replay protection, and room lock |
| `fileWriter.ts` | Direct-to-disk File System Access API writer, capped RAM Blob fallback, and filename sanitizer |
| `folderStream.ts` | Recursive folder scanner, Zip Slip sanitizer, and streaming ZIP generator |
| `usePeerTransfer.ts` | WebRTC lifecycle, chunk ACK/Resume, backpressure flow control, and encrypted clipboard |
| `App.tsx`, `Navbar.tsx`, `TransferWorkspace.tsx`, `HowItWorksModal.tsx`, `SecurityModal.tsx`, `Footer.tsx` | React + Tailwind CSS UI components |

---

## How to Use

1. **Sender:** Open the page (**Send Files** tab is active by default). Copy the generated one-time connection code or display its QR code.
2. **Receiver:** Switch to the **Receive Files** tab on the other device, enter the connection code, and click **Connect**.
3. **Transfer:** Once paired and locked, select or drag-and-drop files/folders on the sender side and start the transfer; the receiver chooses a save location to stream directly to disk.

> **Note:** Because transfers flow directly between devices without a cloud server, both tabs must stay open until the transfer completes.

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Cryptography:** Native Web Crypto API (`SHA-256`, `PBKDF2`, `HKDF`, `AES-GCM-256`, `CSPRNG`)
- **P2P & Signaling:** WebRTC (`RTCPeerConnection`, `RTCDataChannel`), Native WebSocket MQTT v3.1.1 (`wss://`)
- **Streaming & Archiving:** File System Access API, `fflate` / streaming PKZIP

---

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
