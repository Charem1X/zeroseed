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
  HardDrive,
  AlertTriangle,
  Play,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from './translations';
import { usePeerTransfer } from './usePeerTransfer';
import { isFileSystemAccessSupported, sanitizeFileName } from './fileWriter';
import { SITE_CONFIG } from './site';

type PeerTransferHookReturn = ReturnType<typeof usePeerTransfer>;

interface TransferWorkspaceProps {
  transfer: PeerTransferHookReturn;
  blocked?: boolean;
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

export const TransferWorkspace: React.FC<TransferWorkspaceProps> = ({
  transfer,
  blocked = false,
}) => {
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
    disconnectGracefully,
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
  const [notesOpen, setNotesOpen] = useState(false);
  const [clipboardDraft, setClipboardDraft] = useState('');
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef<number>(0);
  const prevClipCountRef = useRef<number>(0);

  // Auto-expand note drawer when a new incoming message arrives
  useEffect(() => {
    if (clipboardItems.length > prevClipCountRef.current && clipboardItems[0]?.direction === 'received') {
      setNotesOpen(true);
    }
    prevClipCountRef.current = clipboardItems.length;
  }, [clipboardItems]);

  // Full-screen Drag & Drop listener
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (blocked) return;
      if (e.dataTransfer?.types?.includes('Files')) {
        dragDepthRef.current += 1;
        setIsDraggingWindow(true);
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (blocked) return;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (blocked) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDraggingWindow(false);
      }
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (blocked) return;
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
  }, [blocked, handleDataTransferDrop]);

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

  const showProgressStrip = isStreaming || telemetry.phase === 'completed';
  const diskSupported = isFileSystemAccessSupported();

  const canRetryConnection =
    errorCode === 'receiverDisconnected' ||
    errorCode === 'senderDisconnected' ||
    errorCode === 'peerDisconnected';

  const statusDotClass = isTunnelOpen
    ? 'bg-emerald-500'
    : telemetry.phase === 'error'
    ? 'bg-rose-500'
    : telemetry.phase === 'idle'
    ? 'bg-slate-400'
    : 'bg-amber-500 animate-pulse';

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4">
      {/* Full-Screen Drag & Drop Overlay */}
      {isDraggingWindow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-2xl border-2 border-dashed border-emerald-400 bg-slate-900/90 text-center space-y-3 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-7 h-7 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-white">{t.hero.dropOverlayTitle}</h2>
            <p className="text-xs text-slate-300">{t.hero.dropOverlaySubtitle}</p>
          </div>
        </div>
      )}

      {/* Calm Compact Hero */}
      <div className="text-center max-w-xl mx-auto mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.hero.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {t.hero.subtitle}
        </p>
      </div>

      {/* Centered Single-Column Workspace Card */}
      <section className="max-w-xl mx-auto bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        {/* Card Top Bar: Segmented Tabs + Single Live Status Pill */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              onClick={() => void switchRole('sender')}
              disabled={isStreaming}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'sender'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              } disabled:opacity-50`}
            >
              <Send className="w-3.5 h-3.5 text-emerald-500" />
              {t.hero.tabSend}
            </button>

            <button
              type="button"
              onClick={() => void switchRole('receiver')}
              disabled={isStreaming}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'receiver'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              } disabled:opacity-50`}
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              {t.hero.tabReceive}
            </button>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200">
            <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
            <span>{t.status[telemetry.phase]}</span>
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Disconnect / Error Notification Banner */}
          {errorCode && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-rose-700 dark:text-rose-300">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs font-medium leading-relaxed">{t.errors[errorCode]}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canRetryConnection && (
                  <button
                    type="button"
                    onClick={() => void reconnectCurrentSeed()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {role === 'sender' ? t.sender.waitAgainBtn : t.receiver.reconnectBtn}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorCode(null)}
                  className="text-xs px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                >
                  {t.modals.close}
                </button>
              </div>
            </div>
          )}

          {role === 'sender' ? (
            <>
              {/* SENDER: Compact Connection Code Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t.sender.seedLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    aria-readonly="true"
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 select-all truncate"
                  >
                    {senderSeed}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySeed}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
                  >
                    {seedCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{seedCopied ? t.sender.copiedSeed : t.sender.copySeed}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void regenerateSenderSeed()}
                    disabled={isStreaming}
                    title={t.sender.regenerateSeed}
                    aria-label={t.sender.regenerateSeed}
                    className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQr((prev) => !prev)}
                    title={showQr ? t.sender.hideQr : t.sender.showQr}
                    aria-label={showQr ? t.sender.hideQr : t.sender.showQr}
                    className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                      showQr
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                        : 'bg-slate-200/80 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.sender.seedHint}
                </p>

                {showQr && (
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shrink-0">
                      <QRCodeSVG value={senderSeed} size={104} level="M" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.sender.qrModalTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.sender.qrModalHint}
                      </p>
                      <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {senderSeed}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Clean Dropzone */}
              <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-950/40 transition-colors text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
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

                <div className="flex flex-wrap items-center justify-center gap-2">
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200/80 dark:bg-slate-800/70 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <FolderUp className="w-3.5 h-3.5 text-sky-500" />
                    {t.sender.browseFolderBtn}
                  </button>
                </div>
              </div>

              {/* Progressive Disclosure: File Queue (Only shown when items exist) */}
              {queuedEntries.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {t.sender.queueTitle} ·{' '}
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {queuedEntries.length} {t.sender.filesSelected} ({formatBytes(totalQueueBytes)})
                      </span>
                    </span>
                    {!isStreaming && (
                      <button
                        type="button"
                        onClick={clearQueue}
                        className="text-rose-500 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t.sender.clearQueue}
                      </button>
                    )}
                  </div>

                  {(hasDirectoryInQueue || queuedEntries.length > 1) && (
                    <div className="px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between text-xs text-sky-700 dark:text-sky-300">
                      <span className="inline-flex items-center gap-1.5 font-medium truncate">
                        <FileArchive className="w-4 h-4 text-sky-500 shrink-0" />
                        {t.sender.zipStreamReady}:{' '}
                        <strong className="font-mono">
                          {rootFolderName ? `${rootFolderName}.zip` : 'ZeroSeed-Archive.zip'}
                        </strong>
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 shrink-0">
                        ZIP
                      </span>
                    </div>
                  )}

                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {queuedEntries.slice(0, 20).map((item, idx) => (
                      <div
                        key={`${item.relativePath}-${idx}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-mono truncate text-slate-700 dark:text-slate-300">
                          {item.relativePath}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {formatBytes(item.file.size)}
                        </span>
                      </div>
                    ))}
                    {queuedEntries.length > 20 && (
                      <div className="text-center text-[11px] text-slate-400 py-1 font-mono">
                        + {queuedEntries.length - 20} more
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={startSendingQueue}
                    disabled={!isTunnelOpen || isStreaming}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white shadow-md shadow-emerald-600/15 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    {t.sender.startTransferBtn}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* RECEIVER TAB */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <label
                  htmlFor="receiver-seed-input"
                  className="block text-xs font-semibold text-slate-500 dark:text-slate-400"
                >
                  {t.receiver.seedInputLabel}
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="receiver-seed-input"
                    type="text"
                    value={receiverSeedInput}
                    onChange={(e) => setReceiverSeedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isTunnelOpen) {
                        e.preventDefault();
                        void connectReceiver();
                      }
                    }}
                    placeholder={t.receiver.seedInputPlaceholder}
                    disabled={isStreaming || isTunnelOpen}
                    maxLength={64}
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:outline-none font-mono text-sm sm:text-base text-slate-900 dark:text-white disabled:opacity-60"
                  />

                  {!isTunnelOpen ? (
                    <button
                      type="button"
                      onClick={() => void connectReceiver()}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-sky-600 hover:bg-sky-500 text-white transition-colors shrink-0"
                    >
                      {t.receiver.connectBtn}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void disconnectGracefully()}
                      className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-rose-600/15 hover:bg-rose-600/25 text-rose-500 border border-rose-500/30 transition-colors shrink-0"
                    >
                      {t.receiver.disconnectBtn}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {telemetry.phase === 'connecting_broker'
                    ? t.receiver.connectingBroker
                    : telemetry.phase === 'waiting_peer'
                    ? t.receiver.waitingSenderOffer
                    : telemetry.phase === 'connected'
                    ? t.receiver.connectedReady
                    : t.receiver.seedFormatHint}
                </p>
              </div>

              {/* Incoming File Offer */}
              {incomingOffer && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-500 shrink-0">
                      {incomingOffer.isFolderArchive ? (
                        <FileArchive className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                        {t.receiver.incomingOfferTitle}
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
                        {incomingOffer.fileName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatBytes(incomingOffer.fileSize)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {diskSupported ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void acceptIncomingOffer(true)}
                          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <HardDrive className="w-4 h-4" />
                          {t.receiver.acceptSaveDiskBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => void acceptIncomingOffer(false)}
                          className="py-2.5 px-3.5 rounded-xl font-semibold text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          {t.receiver.acceptRamFallbackBtn}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void acceptIncomingOffer(false)}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        {t.receiver.acceptRamFallbackBtn}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progressive Disclosure: Transfer Progress Strip (Only while transferring or completed) */}
          {showProgressStrip && (
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
              {telemetry.resumedFromChunk !== null && (
                <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-[11px] font-mono text-sky-600 dark:text-sky-300">
                  {t.telemetry.resumedFromChunk}
                  {telemetry.resumedFromChunk})
                </div>
              )}

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {telemetry.activeFileName || t.telemetry.progressLabel}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {telemetry.progressPercent.toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-150"
                  style={{ width: `${Math.min(100, telemetry.progressPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>
                  {formatBytes(telemetry.bytesTransferred)} / {formatBytes(telemetry.totalBytes)}
                  {isStreaming &&
                    ` · ${telemetry.speedMbps.toFixed(2)} MB/s · ${formatDuration(telemetry.etaSeconds)}`}
                </span>
                <span>
                  {telemetry.writeMode === 'disk'
                    ? t.telemetry.writeModeDisk
                    : t.telemetry.writeModeRam}
                </span>
              </div>

              {isStreaming && (
                <button
                  type="button"
                  onClick={() => void cancelActiveTransfer()}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/25 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {t.telemetry.cancelTransfer}
                </button>
              )}

              {telemetry.phase === 'completed' && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
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
          )}

          {/* Progressive Disclosure: Encrypted Note / Link Drawer (Only visible when connected) */}
          {isTunnelOpen && (
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNotesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-1 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-500" />
                  {t.clipboard.toggleLabel}
                  {clipboardItems.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-600 dark:text-sky-400">
                      {clipboardItems.length}
                    </span>
                  )}
                </span>
                {notesOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {notesOpen && (
                <div className="mt-3 space-y-2.5">
                  <form onSubmit={handleSendClipboard} className="space-y-2">
                    <textarea
                      rows={2}
                      value={clipboardDraft}
                      onChange={(e) => setClipboardDraft(e.target.value)}
                      placeholder={t.clipboard.placeholder}
                      maxLength={SITE_CONFIG.maxClipboardChars}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:outline-none text-xs font-mono text-slate-900 dark:text-slate-100 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      {clipboardItems.length > 0 && (
                        <button
                          type="button"
                          onClick={clearClipboardHistory}
                          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-500 transition-colors"
                        >
                          {t.clipboard.clearBtn}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!clipboardDraft.trim()}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white transition-colors"
                      >
                        {t.clipboard.sendBtn}
                      </button>
                    </div>
                  </form>

                  {clipboardItems.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
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
                              {item.direction === 'sent'
                                ? t.clipboard.sentTag
                                : t.clipboard.receivedTag}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleCopyClipboardItem(item.id, item.text)}
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
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
