import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Send,
  Download,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Upload,
  FolderUp,
  FileArchive,
  FileText,
  Lock,
  ShieldCheck,
  HardDrive,
  Activity,
  AlertTriangle,
  Play,
  XCircle,
  MessageSquareLock,
  Trash2,
  Radio,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from './translations';
import { usePeerTransfer } from './usePeerTransfer';
import { isFileSystemAccessSupported, sanitizeFileName } from './fileWriter';
import { SITE_CONFIG } from './site';

type PeerTransferHookReturn = ReturnType<typeof usePeerTransfer>;

interface TransferWorkspaceProps {
  transfer: PeerTransferHookReturn;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  return `${val.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '--:--';
  const s = Math.ceil(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m ${secs}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const TransferWorkspace: React.FC<TransferWorkspaceProps> = ({ transfer }) => {
  const { t } = useI18n();
  const {
    role,
    switchRole,
    senderSeed,
    regenerateSenderSeed,
    receiverSeedInput,
    setReceiverSeedInput,
    connectReceiver,
    reconnectCurrentSeed,
    fullDisconnect,
    queuedEntries,
    hasDirectoryInQueue,
    rootFolderName,
    addFilesToQueue,
    handleDataTransferDrop,
    clearQueue,
    startSendingQueue,
    incomingOffer,
    acceptIncomingOffer,
    cancelActiveTransfer,
    telemetry,
    errorCode,
    setErrorCode,
    clipboardItems,
    sendClipboardText,
    clearClipboardHistory,
  } = transfer;

  const [seedCopied, setSeedCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [clipboardDraft, setClipboardDraft] = useState('');
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef<number>(0);

  // Full-screen Drag & Drop listener
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        dragDepthRef.current += 1;
        setIsDraggingWindow(true);
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDraggingWindow(false);
      }
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingWindow(false);
      if (e.dataTransfer) {
        await handleDataTransferDrop(e.dataTransfer);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleDataTransferDrop]);

  const handleCopySeed = async () => {
    try {
      await navigator.clipboard.writeText(senderSeed);
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleCopyClipboardItem = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedClipId(id);
      setTimeout(() => setCopiedClipId(null), 1600);
    } catch {
      // ignore
    }
  };

  const handleSendClipboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipboardDraft.trim()) return;
    await sendClipboardText(clipboardDraft);
    setClipboardDraft('');
  };

  const totalQueueBytes = queuedEntries.reduce((acc, item) => acc + item.file.size, 0);
  const isTunnelOpen =
    telemetry.phase === 'connected' ||
    telemetry.phase === 'transferring' ||
    telemetry.phase === 'paused_backpressure' ||
    telemetry.phase === 'completed';

  const isStreaming =
    telemetry.phase === 'transferring' || telemetry.phase === 'paused_backpressure';

  const diskSupported = isFileSystemAccessSupported();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
      {/* Full-Screen Drag & Drop Overlay */}
      {isDraggingWindow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-lg w-full p-10 rounded-3xl border-2 border-dashed border-emerald-400 bg-slate-900/90 text-center space-y-4 shadow-2xl shadow-emerald-500/20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white">{t.hero.dropOverlayTitle}</h2>
            <p className="text-sm text-slate-300">{t.hero.dropOverlaySubtitle}</p>
          </div>
        </div>
      )}

      {/* Compact Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-semibold tracking-wide mb-2.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t.hero.badge}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.hero.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
          {t.hero.subtitle}
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorCode && (
        <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{t.errors[errorCode]}</span>
          </div>
          <div className="flex items-center gap-2">
            {errorCode === 'peerDisconnected' && (
              <button
                type="button"
                onClick={reconnectCurrentSeed}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={() => setErrorCode(null)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              {t.modals.close}
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Interactive Transfer Card (Send / Receive Tabs) */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => switchRole('sender')}
              disabled={isStreaming}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                role === 'sender'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              } disabled:opacity-50`}
            >
              <Send className="w-4 h-4" />
              {t.hero.tabSend}
            </button>

            <button
              type="button"
              onClick={() => switchRole('receiver')}
              disabled={isStreaming}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                role === 'receiver'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              } disabled:opacity-50`}
            >
              <Download className="w-4 h-4" />
              {t.hero.tabReceive}
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {role === 'sender' ? (
              <>
                {/* SENDER: Read-Only Cryptographic Seed Box (No custom input allowed) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      {t.sender.seedLabel}
                    </span>

                    {telemetry.roomLocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Lock className="w-3 h-3" />
                        {t.sender.roomLockedBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        {t.sender.waitingForPeer}
                      </span>
                    )}
                  </div>

                  {/* Read-only Seed Display + Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div
                      aria-readonly="true"
                      className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 font-mono text-base sm:text-lg font-bold tracking-wider text-slate-900 dark:text-emerald-400 select-all flex items-center justify-between"
                    >
                      <span>{senderSeed}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopySeed}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                      >
                        {seedCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            {t.sender.copiedSeed}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            {t.sender.copySeed}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={regenerateSenderSeed}
                        disabled={isStreaming}
                        title={t.sender.regenerateSeed}
                        aria-label={t.sender.regenerateSeed}
                        className="p-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQr((prev) => !prev)}
                        title={showQr ? t.sender.hideQr : t.sender.showQr}
                        aria-label={showQr ? t.sender.hideQr : t.sender.showQr}
                        className={`p-3 rounded-xl border transition-colors ${
                          showQr
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                            : 'bg-slate-200/80 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-slate-700'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.sender.seedHint}
                  </p>

                  {/* Collapsible QR Code Panel */}
                  {showQr && (
                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                        <QRCodeSVG value={senderSeed} size={116} level="M" />
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.sender.qrModalTitle}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t.sender.qrModalHint}
                        </p>
                        <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                          {senderSeed}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* File & Folder Drop Zone */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-950/40 transition-colors text-center space-y-3">
                  <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t.sender.selectFilesTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.sender.selectFilesSubtitle}
                    </p>
                  </div>

                  {/* Hidden File & Directory Inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        addFilesToQueue(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        addFilesToQueue(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isStreaming}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white transition-colors disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      {t.sender.browseFilesBtn}
                    </button>

                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      disabled={isStreaming}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200/90 dark:bg-slate-800/70 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50"
                    >
                      <FolderUp className="w-3.5 h-3.5 text-sky-400" />
                      {t.sender.browseFolderBtn}
                    </button>
                  </div>
                </div>

                {/* Queued Files / Folder Summary & Start Button */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t.sender.queueTitle}
                      </h4>
                      {queuedEntries.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {queuedEntries.length} {t.sender.filesSelected} ({formatBytes(totalQueueBytes)})
                        </span>
                      )}
                    </div>

                    {queuedEntries.length > 0 && !isStreaming && (
                      <button
                        type="button"
                        onClick={clearQueue}
                        className="text-xs text-rose-500 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t.sender.clearQueue}
                      </button>
                    )}
                  </div>

                  {queuedEntries.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 text-center">
                      {t.sender.emptyQueueHint}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(hasDirectoryInQueue || queuedEntries.length > 1) && (
                        <div className="px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between text-xs text-sky-700 dark:text-sky-300">
                          <span className="inline-flex items-center gap-1.5 font-semibold">
                            <FileArchive className="w-4 h-4 text-sky-500" />
                            {t.sender.zipStreamReady}:{' '}
                            <strong className="font-mono">
                              {rootFolderName ? `${rootFolderName}.zip` : 'ZeroSeed-Archive.zip'}
                            </strong>
                          </span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-500/20">
                            ZIP
                          </span>
                        </div>
                      )}

                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {queuedEntries.slice(0, 25).map((item, idx) => (
                          <div
                            key={`${item.relativePath}-${idx}`}
                            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-mono truncate text-slate-700 dark:text-slate-300">
                              {item.relativePath}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 shrink-0">
                              {formatBytes(item.file.size)}
                            </span>
                          </div>
                        ))}
                        {queuedEntries.length > 25 && (
                          <div className="text-center text-[11px] text-slate-400 py-1 font-mono">
                            + {queuedEntries.length - 25} more files in stream...
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={startSendingQueue}
                        disabled={!isTunnelOpen || isStreaming || queuedEntries.length === 0}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white shadow-lg shadow-emerald-600/20 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                      >
                        <Play className="w-4 h-4" />
                        {t.sender.startTransferBtn}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* RECEIVER TAB */
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 space-y-3">
                  <label
                    htmlFor="receiver-seed-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    {t.receiver.seedInputLabel}
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      id="receiver-seed-input"
                      type="text"
                      value={receiverSeedInput}
                      onChange={(e) => setReceiverSeedInput(e.target.value)}
                      placeholder={t.receiver.seedInputPlaceholder}
                      disabled={isStreaming}
                      maxLength={64}
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:outline-none font-mono text-base text-slate-900 dark:text-white"
                    />

                    {!isTunnelOpen ? (
                      <button
                        type="button"
                        onClick={() => connectReceiver()}
                        className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        {t.receiver.connectBtn}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={fullDisconnect}
                        className="px-4 py-3 rounded-xl font-semibold text-xs bg-rose-600/15 hover:bg-rose-600/25 text-rose-500 border border-rose-500/30 transition-colors"
                      >
                        {t.receiver.disconnectBtn}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.receiver.seedFormatHint}
                  </p>
                </div>

                {/* Incoming Encrypted Offer Card */}
                {incomingOffer && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-4 animate-in fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500">
                          {incomingOffer.isFolderArchive ? (
                            <FileArchive className="w-6 h-6" />
                          ) : (
                            <FileText className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {t.receiver.incomingOfferTitle}
                          </div>
                          <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white break-all">
                            {incomingOffer.fileName}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                            {formatBytes(incomingOffer.fileSize)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      {diskSupported ? (
                        <>
                          <button
                            type="button"
                            onClick={() => acceptIncomingOffer(true)}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
                          >
                            <HardDrive className="w-4 h-4" />
                            {t.receiver.acceptSaveDiskBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => acceptIncomingOffer(false)}
                            className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            {t.receiver.acceptRamFallbackBtn}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acceptIncomingOffer(false)}
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {t.receiver.acceptRamFallbackBtn}
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {t.receiver.autoStreamNotice}
                    </p>
                  </div>
                )}

                {/* Receiver Connection Status Hint */}
                {!incomingOffer && (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                    <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {telemetry.phase === 'connecting_broker' && t.receiver.connectingBroker}
                      {telemetry.phase === 'waiting_peer' && t.receiver.waitingSenderOffer}
                      {telemetry.phase === 'connected' && t.receiver.connectedReady}
                      {telemetry.phase === 'idle' && t.receiver.seedFormatHint}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Column (5 cols): Live Cryptographic Telemetry & Instant Encrypted Clipboard */}
        <section className="lg:col-span-5 space-y-5">
          {/* Telemetry Card */}
          <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {t.telemetry.panelTitle}
                </h2>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                {t.telemetry.securityBadgeValue}
              </span>
            </div>

            {/* Status & Write Mode Row */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.telemetry.statusLabel}
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isTunnelOpen
                        ? 'bg-emerald-500'
                        : telemetry.phase === 'error'
                        ? 'bg-rose-500'
                        : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  <span className="truncate">{t.status[telemetry.phase]}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.telemetry.writeModeLabel}
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">
                    {telemetry.writeMode === 'disk'
                      ? t.telemetry.writeModeDisk
                      : t.telemetry.writeModeRam}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Code */}
            {telemetry.fingerprint && (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {t.telemetry.fingerprintLabel}:
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {telemetry.fingerprint}
                </span>
              </div>
            )}

            {/* Resume Banner */}
            {telemetry.resumedFromChunk !== null && (
              <div className="px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs font-mono text-sky-600 dark:text-sky-300">
                {t.telemetry.resumedFromChunk}
                {telemetry.resumedFromChunk} (
                {formatBytes(telemetry.resumedFromChunk * SITE_CONFIG.chunkSize)})
              </div>
            )}

            {/* Backpressure Pacing Notice */}
            {telemetry.phase === 'paused_backpressure' && (
              <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-600 dark:text-amber-300">
                {t.telemetry.pauseNoticeBackpressure}
              </div>
            )}

            {/* Progress Bar & Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                  {telemetry.activeFileName || t.telemetry.progressLabel}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {telemetry.progressPercent.toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-150"
                  style={{ width: `${Math.min(100, telemetry.progressPercent)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-400">{t.telemetry.speedLabel}</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {telemetry.speedMbps.toFixed(2)} MB/s
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-400">{t.telemetry.etaLabel}</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {formatDuration(telemetry.etaSeconds)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-400">{t.telemetry.chunksAckedLabel}</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {telemetry.lastAckedChunk >= 0 ? telemetry.lastAckedChunk + 1 : 0} /{' '}
                    {telemetry.totalChunks}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Stream Abort or Completed Actions */}
            {isStreaming && (
              <button
                type="button"
                onClick={cancelActiveTransfer}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/25 flex items-center justify-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {t.telemetry.cancelTransfer}
              </button>
            )}

            {telemetry.phase === 'completed' && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                <span>{t.telemetry.transferComplete}</span>
                {telemetry.completedDownloadUrl &&
                  telemetry.completedDownloadUrl.startsWith('blob:') &&
                  telemetry.activeFileName && (
                    <a
                      href={telemetry.completedDownloadUrl}
                      download={sanitizeFileName(telemetry.activeFileName)}
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                    >
                      {t.telemetry.downloadAgain}
                    </a>
                  )}
              </div>
            )}
          </div>

          {/* Encrypted Instant Clipboard Box */}
          <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquareLock className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {t.clipboard.title}
                </h3>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {t.clipboard.encryptedBadge}
              </span>
            </div>

            <form onSubmit={handleSendClipboard} className="space-y-2">
              <textarea
                rows={2}
                value={clipboardDraft}
                onChange={(e) => setClipboardDraft(e.target.value)}
                placeholder={t.clipboard.placeholder}
                disabled={!isTunnelOpen}
                maxLength={SITE_CONFIG.maxClipboardChars}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:outline-none text-xs font-mono text-slate-900 dark:text-slate-100 resize-none disabled:opacity-50"
              />
              <div className="flex justify-end gap-2">
                {clipboardItems.length > 0 && (
                  <button
                    type="button"
                    onClick={clearClipboardHistory}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    {t.clipboard.clearBtn}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isTunnelOpen || !clipboardDraft.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors"
                >
                  {t.clipboard.sendBtn}
                </button>
              </div>
            </form>

            {clipboardItems.length === 0 ? (
              <div className="text-[11px] text-slate-400 text-center py-2">
                {t.clipboard.emptyState}
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {clipboardItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={
                          item.direction === 'sent'
                            ? 'text-emerald-500 font-bold'
                            : 'text-sky-400 font-bold'
                        }
                      >
                        {item.direction === 'sent' ? t.clipboard.sentTag : t.clipboard.receivedTag}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyClipboardItem(item.id, item.text)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        {copiedClipId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            {t.clipboard.copiedBtn}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            {t.clipboard.copyBtn}
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all">
                      {item.text}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
