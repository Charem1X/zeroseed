import { useState, useEffect, useRef, useCallback } from 'react';
import { SITE_CONFIG } from './site';
import {
  generateRandomSeed,
  generateRandomHex,
  createSessionIvPrefix,
  deriveDualKeys,
  isValidSeedFormat,
  normalizeSeed,
  encryptJsonPayload,
  decryptJsonPayload,
  encryptChunkPacket,
  decryptChunkPacket,
  AuthTagMismatchError,
  DualDerivedMaterial,
} from './seedCrypto';
import {
  BlindSignalingChannel,
  BrokerStatusInfo,
  DecryptedSignalPayload,
} from './signaling';
import {
  StreamFileWriter,
  WriteStorageMode,
  isFileSystemAccessSupported,
  sanitizeFileName,
} from './fileWriter';
import {
  RelativeFileEntry,
  filesToRelativeEntries,
  extractDroppedEntries,
  streamEntriesAsZipChunks,
} from './folderStream';

export type TransferRole = 'sender' | 'receiver';

export type ConnectionPhase =
  | 'idle'
  | 'connecting_broker'
  | 'waiting_peer'
  | 'handshaking'
  | 'connected'
  | 'transferring'
  | 'paused_backpressure'
  | 'completed'
  | 'error';

export type ErrorCode =
  | 'cryptoUnsupported'
  | 'brokerAllFailed'
  | 'authTagMismatch'
  | 'peerDisconnected'
  | 'receiverDisconnected'
  | 'senderDisconnected'
  | 'invalidSeed'
  | 'fileWriteError'
  | 'transferAborted'
  | null;

export interface TransferMetadataOffer {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isFolderArchive: boolean;
  itemCount: number;
  totalChunks: number;
  resumable: boolean;
  knownLastAckChunk: number;
}

type ControlFrame =
  | {
      type: 'FILE_OFFER';
      offer: TransferMetadataOffer;
    }
  | {
      type: 'FILE_ACCEPT';
      fileId: string;
      storageMode: WriteStorageMode;
      resumeFromChunk: number;
    }
  | {
      type: 'ACK';
      fileId: string;
      lastChunkIndex: number;
    }
  | {
      type: 'FILE_COMPLETE';
      fileId: string;
      totalChunks: number;
      totalBytes: number;
    }
  | {
      type: 'TRANSFER_ABORT';
      fileId: string;
      reason: string;
    }
  | {
      type: 'CLIPBOARD_TEXT';
      id: string;
      text: string;
      timestamp: number;
    }
  | {
      type: 'PEER_DISCONNECT';
      role: TransferRole;
    }
  | {
      type: 'HEARTBEAT_PING';
      ts: number;
    }
  | {
      type: 'HEARTBEAT_PONG';
      ts: number;
    };

export interface ClipboardItem {
  id: string;
  text: string;
  direction: 'sent' | 'received';
  timestamp: number;
}

export interface TelemetryState {
  phase: ConnectionPhase;
  writeMode: WriteStorageMode;
  progressPercent: number;
  bytesTransferred: number;
  totalBytes: number;
  speedMbps: number; // MB/s
  etaSeconds: number | null;
  currentChunk: number;
  totalChunks: number;
  lastAckedChunk: number;
  resumedFromChunk: number | null;
  roomLocked: boolean;
  topicHashHex: string;
  fingerprint: string;
  activeFileName: string | null;
  completedDownloadUrl: string | null;
}

export function usePeerTransfer(enabled = true) {
  const [role, setRoleState] = useState<TransferRole>('sender');
  const [senderSeed, setSenderSeed] = useState<string>(() => generateRandomSeed());
  const [receiverSeedInput, setReceiverSeedInput] = useState<string>('');
  const [queuedEntries, setQueuedEntries] = useState<RelativeFileEntry[]>([]);
  const [hasDirectoryInQueue, setHasDirectoryInQueue] = useState<boolean>(false);
  const [rootFolderName, setRootFolderName] = useState<string | null>(null);

  const [incomingOffer, setIncomingOffer] = useState<TransferMetadataOffer | null>(null);
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [errorCode, setErrorCode] = useState<ErrorCode>(null);

  const [brokerStatus, setBrokerStatus] = useState<BrokerStatusInfo>({
    brokerName: SITE_CONFIG.mqttBrokers[0].name,
    brokerUrl: SITE_CONFIG.mqttBrokers[0].url,
    brokerIndex: 0,
    connected: false,
    locked: false,
    failoverCount: 0,
  });

  const [telemetry, setTelemetry] = useState<TelemetryState>({
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
  });

  // Volatile refs for active WebRTC, Signaling, Crypto, and Resume state
  const derivedRef = useRef<DualDerivedMaterial | null>(null);
  const signalingRef = useRef<BlindSignalingChannel | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Resume state kept strictly in volatile memory (never localStorage/sessionStorage)
  const senderAckMapRef = useRef<Map<string, number>>(new Map());
  const receiverStateRef = useRef<{
    fileId: string;
    writer: StreamFileWriter;
    lastChunkIndex: number;
    expectedNextChunk: number;
    bytesWritten: number;
    totalBytes: number;
    maxAllowedBytes: number;
    totalChunks: number;
    fileName: string;
    isFolderArchive: boolean;
    disconnectedForResume: boolean;
    startTime: number;
  } | null>(null);

  const abortTransferFlagRef = useRef<boolean>(false);
  const pendingSenderOfferIdRef = useRef<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const acceptResolverRef = useRef<
    ((decision: { storageMode: WriteStorageMode; resumeFromChunk: number }) => void) | null
  >(null);

  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPeerActivityRef = useRef<number>(0);
  const disconnectHandledRef = useRef<boolean>(false);
  const roleRef = useRef<TransferRole>(role);
  roleRef.current = role;

  const revokeActiveBlobUrl = useCallback(() => {
    if (activeBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      } catch {
        // ignore
      }
      activeBlobUrlRef.current = null;
    }
  }, []);

  const speedTrackerRef = useRef<{
    lastTimestamp: number;
    lastBytes: number;
    smoothedSpeed: number;
  }>({
    lastTimestamp: 0,
    lastBytes: 0,
    smoothedSpeed: 0,
  });

  const updatePhase = useCallback((phase: ConnectionPhase) => {
    setTelemetry((prev) => ({ ...prev, phase }));
  }, []);

  const cleanupPeerConnectionOnly = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.onopen = null;
        dataChannelRef.current.onclose = null;
        dataChannelRef.current.onerror = null;
        dataChannelRef.current.onmessage = null;
        dataChannelRef.current.close();
      } catch {
        // ignore
      }
      dataChannelRef.current = null;
    }

    if (peerConnRef.current) {
      try {
        peerConnRef.current.onicecandidate = null;
        peerConnRef.current.ondatachannel = null;
        peerConnRef.current.onconnectionstatechange = null;
        peerConnRef.current.oniceconnectionstatechange = null;
        peerConnRef.current.close();
      } catch {
        // ignore
      }
      peerConnRef.current = null;
    }

    remotePeerIdRef.current = null;
    pendingIceCandidatesRef.current = [];
  }, []);

  const fullDisconnect = useCallback(() => {
    abortTransferFlagRef.current = true;
    pendingSenderOfferIdRef.current = null;
    if (acceptResolverRef.current) {
      acceptResolverRef.current({ storageMode: 'ram', resumeFromChunk: 0 });
      acceptResolverRef.current = null;
    }
    cleanupPeerConnectionOnly();
    if (signalingRef.current) {
      signalingRef.current.destroy();
      signalingRef.current = null;
    }
    revokeActiveBlobUrl();
    setBrokerStatus((prev) => ({ ...prev, connected: false, locked: false }));
  }, [cleanupPeerConnectionOnly, revokeActiveBlobUrl]);

  /**
   * Sends an AES-GCM-256 encrypted JSON control message over the open RTCDataChannel
   * using the HKDF-separated `transferKey` and domain-separated control AAD.
   */
  const sendControlFrame = useCallback(async (frame: ControlFrame) => {
    const dc = dataChannelRef.current;
    const derived = derivedRef.current;
    if (!dc || dc.readyState !== 'open' || !derived) return;

    const aadContext = `zs-ctrl-v1:${derived.topicId}`;
    const encryptedStr = await encryptJsonPayload(derived.transferKey, frame, aadContext);
    dc.send(encryptedStr);
  }, []);

  /**
   * Handles remote peer disconnection immediately (even after transfer completion),
   * notifies the local user explicitly, and unlocks UI for recovery.
   */
  const handleRemoteDisconnect = useCallback(
    (peerRole?: TransferRole) => {
      if (disconnectHandledRef.current) return;
      disconnectHandledRef.current = true;

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      abortTransferFlagRef.current = true;
      pendingSenderOfferIdRef.current = null;
      if (acceptResolverRef.current) {
        acceptResolverRef.current({ storageMode: 'ram', resumeFromChunk: 0 });
        acceptResolverRef.current = null;
      }

      if (receiverStateRef.current) {
        receiverStateRef.current.disconnectedForResume = true;
      }

      cleanupPeerConnectionOnly();
      setIncomingOffer(null);

      setErrorCode(
        roleRef.current === 'sender'
          ? 'receiverDisconnected'
          : peerRole === 'sender'
          ? 'senderDisconnected'
          : 'peerDisconnected'
      );

      setTelemetry((prev) => ({
        ...prev,
        phase: 'error',
        roomLocked: false,
      }));
    },
    [cleanupPeerConnectionOnly]
  );

  /**
   * Notifies the remote peer over the encrypted DataChannel before tearing down locally.
   */
  const notifyPeerAndDisconnect = useCallback(
    async (waitFlush = true) => {
      disconnectHandledRef.current = true;
      const dc = dataChannelRef.current;
      if (dc && dc.readyState === 'open') {
        try {
          await sendControlFrame({
            type: 'PEER_DISCONNECT',
            role: roleRef.current,
          });
          if (waitFlush) {
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        } catch {
          // ignore
        }
      }
      fullDisconnect();
    },
    [fullDisconnect, sendControlFrame]
  );

  /**
   * Handles incoming binary 64 KB chunk frames on the Receiver side.
   * Enforces sequential chunk indices, fileId-bound GCM AAD, and byte caps.
   */
  const handleIncomingBinaryChunk = useCallback(
    async (packetBuffer: ArrayBuffer) => {
      const derived = derivedRef.current;
      const rx = receiverStateRef.current;
      if (!derived || !rx) return;

      try {
        const { chunkIndex, data } = await decryptChunkPacket(
          derived.transferKey,
          packetBuffer,
          rx.fileId
        );

        // Ignore duplicate chunks if already written during resume
        if (chunkIndex <= rx.lastChunkIndex) {
          return;
        }

        // Block chunk-skipping or out-of-order injection
        if (chunkIndex !== rx.expectedNextChunk) {
          throw new AuthTagMismatchError(chunkIndex);
        }

        // Block file-size overrun / disk-fill attack
        if (rx.bytesWritten + data.byteLength > rx.maxAllowedBytes) {
          throw new AuthTagMismatchError(chunkIndex);
        }

        await rx.writer.writeChunk(data);
        rx.lastChunkIndex = chunkIndex;
        rx.expectedNextChunk = chunkIndex + 1;
        rx.bytesWritten += data.byteLength;

        const now = performance.now();
        const tracker = speedTrackerRef.current;
        if (tracker.lastTimestamp === 0) {
          tracker.lastTimestamp = now;
          tracker.lastBytes = rx.bytesWritten;
        } else {
          const dt = (now - tracker.lastTimestamp) / 1000;
          if (dt >= 0.25) {
            const dBytes = rx.bytesWritten - tracker.lastBytes;
            const instantMbps = dBytes / (1024 * 1024) / dt;
            tracker.smoothedSpeed =
              tracker.smoothedSpeed === 0
                ? instantMbps
                : tracker.smoothedSpeed * 0.7 + instantMbps * 0.3;
            tracker.lastTimestamp = now;
            tracker.lastBytes = rx.bytesWritten;
          }
        }

        const effectiveTotal = Math.max(rx.totalBytes, rx.bytesWritten);
        const progressPercent =
          effectiveTotal > 0 ? Math.min(99.9, (rx.bytesWritten / effectiveTotal) * 100) : 0;
        const remainingBytes = Math.max(0, effectiveTotal - rx.bytesWritten);
        const etaSeconds =
          tracker.smoothedSpeed > 0.01
            ? remainingBytes / (1024 * 1024) / tracker.smoothedSpeed
            : null;

        // Every 16 chunks, emit an ACK frame to the sender for Resume tracking
        const shouldAck = (chunkIndex + 1) % SITE_CONFIG.ackIntervalChunks === 0;
        if (shouldAck) {
          await sendControlFrame({
            type: 'ACK',
            fileId: rx.fileId,
            lastChunkIndex: chunkIndex,
          });
        }

        setTelemetry((prev) => ({
          ...prev,
          phase: 'transferring',
          progressPercent,
          bytesTransferred: rx.bytesWritten,
          totalBytes: effectiveTotal,
          speedMbps: tracker.smoothedSpeed,
          etaSeconds,
          currentChunk: chunkIndex + 1,
          totalChunks: Math.max(prev.totalChunks, chunkIndex + 1),
          lastAckedChunk: shouldAck ? chunkIndex : prev.lastAckedChunk,
        }));
      } catch (err) {
        if (err instanceof AuthTagMismatchError) {
          // Immediately abort transfer on GCM Auth Tag verification or sequence failure
          setErrorCode('authTagMismatch');
          updatePhase('error');
          await rx.writer.abort();
          receiverStateRef.current = null;
          await sendControlFrame({
            type: 'TRANSFER_ABORT',
            fileId: rx.fileId,
            reason: 'AUTH_TAG_MISMATCH',
          });
        } else {
          setErrorCode('fileWriteError');
          updatePhase('error');
          await rx.writer.abort();
          receiverStateRef.current = null;
        }
      }
    },
    [sendControlFrame, updatePhase]
  );

  /**
   * Handles incoming AES-GCM encrypted JSON control frames on the RTCDataChannel
   * with strict schema validation and integrity checks.
   */
  const handleIncomingControlFrame = useCallback(
    async (encryptedText: string) => {
      const derived = derivedRef.current;
      if (!derived) return;

      let frame: ControlFrame;
      try {
        const aadContext = `zs-ctrl-v1:${derived.topicId}`;
        frame = await decryptJsonPayload<ControlFrame>(
          derived.transferKey,
          encryptedText,
          aadContext
        );
      } catch {
        setErrorCode('authTagMismatch');
        updatePhase('error');
        return;
      }

      if (!frame || typeof frame !== 'object' || typeof frame.type !== 'string') {
        return;
      }

      switch (frame.type) {
        case 'FILE_OFFER': {
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

          const safeOffer: TransferMetadataOffer = {
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

          const existingRx = receiverStateRef.current;

          // Only auto-resume if the prior session genuinely disconnected mid-transfer for the same file
          if (
            existingRx &&
            existingRx.disconnectedForResume &&
            existingRx.fileId === safeOffer.fileId &&
            safeOffer.resumable &&
            safeOffer.fileSize === existingRx.totalBytes &&
            safeOffer.totalChunks === existingRx.totalChunks &&
            existingRx.lastChunkIndex >= 0
          ) {
            existingRx.disconnectedForResume = false;
            const resumeFrom = existingRx.lastChunkIndex + 1;
            setTelemetry((prev) => ({
              ...prev,
              phase: 'transferring',
              resumedFromChunk: resumeFrom,
              activeFileName: safeOffer.fileName,
            }));
            await sendControlFrame({
              type: 'FILE_ACCEPT',
              fileId: safeOffer.fileId,
              storageMode: existingRx.writer.mode,
              resumeFromChunk: resumeFrom,
            });
            return;
          }

          setIncomingOffer(safeOffer);
          setTelemetry((prev) => ({
            ...prev,
            activeFileName: safeOffer.fileName,
            totalBytes: safeOffer.fileSize,
            totalChunks: safeOffer.totalChunks,
            progressPercent: 0,
            bytesTransferred: 0,
            completedDownloadUrl: null,
          }));
          break;
        }

        case 'FILE_ACCEPT': {
          if (
            typeof frame.fileId !== 'string' ||
            frame.fileId !== pendingSenderOfferIdRef.current ||
            (frame.storageMode !== 'disk' && frame.storageMode !== 'ram') ||
            typeof frame.resumeFromChunk !== 'number' ||
            !Number.isInteger(frame.resumeFromChunk) ||
            frame.resumeFromChunk < 0
          ) {
            return;
          }
          if (acceptResolverRef.current) {
            acceptResolverRef.current({
              storageMode: frame.storageMode,
              resumeFromChunk: frame.resumeFromChunk,
            });
            acceptResolverRef.current = null;
          }
          break;
        }

        case 'ACK': {
          if (
            typeof frame.fileId !== 'string' ||
            frame.fileId.length > 256 ||
            typeof frame.lastChunkIndex !== 'number' ||
            !Number.isInteger(frame.lastChunkIndex) ||
            frame.lastChunkIndex < -1
          ) {
            return;
          }
          senderAckMapRef.current.set(frame.fileId, frame.lastChunkIndex);
          setTelemetry((prev) => ({
            ...prev,
            lastAckedChunk: frame.lastChunkIndex,
          }));
          break;
        }

        case 'FILE_COMPLETE': {
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

          const rx = receiverStateRef.current;
          if (rx && rx.fileId === frame.fileId) {
            // Integrity check: ensure all expected chunks and exact byte count were written
            const countValid =
              rx.expectedNextChunk === frame.totalChunks &&
              rx.bytesWritten === frame.totalBytes &&
              (rx.isFolderArchive || frame.totalBytes === rx.totalBytes);

            if (!countValid) {
              await rx.writer.abort();
              receiverStateRef.current = null;
              setErrorCode('authTagMismatch');
              updatePhase('error');
              return;
            }

            // Send final ACK
            await sendControlFrame({
              type: 'ACK',
              fileId: rx.fileId,
              lastChunkIndex: rx.lastChunkIndex,
            });
            revokeActiveBlobUrl();
            const downloadUrl = await rx.writer.finalize();
            activeBlobUrlRef.current = downloadUrl;
            receiverStateRef.current = null;
            setIncomingOffer(null);
            setTelemetry((prev) => ({
              ...prev,
              phase: 'completed',
              progressPercent: 100,
              bytesTransferred: frame.totalBytes,
              totalBytes: frame.totalBytes,
              currentChunk: frame.totalChunks,
              totalChunks: frame.totalChunks,
              lastAckedChunk: Math.max(0, frame.totalChunks - 1),
              etaSeconds: 0,
              completedDownloadUrl: downloadUrl,
            }));
          }
          break;
        }

        case 'TRANSFER_ABORT': {
          abortTransferFlagRef.current = true;
          pendingSenderOfferIdRef.current = null;
          if (acceptResolverRef.current) {
            acceptResolverRef.current({ storageMode: 'ram', resumeFromChunk: 0 });
            acceptResolverRef.current = null;
          }
          if (receiverStateRef.current) {
            await receiverStateRef.current.writer.abort();
            receiverStateRef.current = null;
          }
          setErrorCode(
            frame.reason === 'AUTH_TAG_MISMATCH' ? 'authTagMismatch' : 'transferAborted'
          );
          updatePhase('error');
          break;
        }

        case 'CLIPBOARD_TEXT': {
          if (typeof frame.text !== 'string' || frame.text.length === 0) {
            return;
          }
          const boundedText = frame.text.slice(0, SITE_CONFIG.maxClipboardChars);
          const localId = `cb_${generateRandomHex(6)}`;
          const safeTs =
            typeof frame.timestamp === 'number' && Number.isFinite(frame.timestamp)
              ? frame.timestamp
              : Date.now();
          setClipboardItems((prev) =>
            [
              {
                id: localId,
                text: boundedText,
                direction: 'received' as const,
                timestamp: safeTs,
              },
              ...prev,
            ].slice(0, SITE_CONFIG.maxClipboardItems)
          );
          break;
        }

        case 'PEER_DISCONNECT': {
          if (frame.role === 'sender' || frame.role === 'receiver') {
            handleRemoteDisconnect(frame.role);
          }
          break;
        }

        case 'HEARTBEAT_PING': {
          void sendControlFrame({
            type: 'HEARTBEAT_PONG',
            ts: Date.now(),
          });
          break;
        }

        case 'HEARTBEAT_PONG': {
          // Activity timestamp already refreshed on dc.onmessage
          break;
        }
      }
    },
    [handleRemoteDisconnect, revokeActiveBlobUrl, sendControlFrame, updatePhase]
  );

  /**
   * Attaches event handlers to an `RTCDataChannel` and enforces Anti-Hijack Room Locking on `open`.
   */
  const bindDataChannel = useCallback(
    (dc: RTCDataChannel) => {
      dc.binaryType = 'arraybuffer';
      dc.bufferedAmountLowThreshold = SITE_CONFIG.lowBufferedThreshold;
      dataChannelRef.current = dc;

      dc.onopen = () => {
        // Anti-Hijack Room Locking: immediately unsubscribe & disconnect from MQTT broker!
        signalingRef.current?.lockRoomAndDisconnect();
        disconnectHandledRef.current = false;
        lastPeerActivityRef.current = Date.now();
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (dc.readyState !== 'open') return;
          if (Date.now() - lastPeerActivityRef.current > 8500) {
            handleRemoteDisconnect();
            return;
          }
          void sendControlFrame({ type: 'HEARTBEAT_PING', ts: Date.now() });
        }, 3000);

        setErrorCode(null);
        setTelemetry((prev) => ({
          ...prev,
          phase: 'connected',
          roomLocked: true,
        }));
      };

      dc.onmessage = async (event) => {
        lastPeerActivityRef.current = Date.now();
        if (typeof event.data === 'string') {
          await handleIncomingControlFrame(event.data);
        } else if (event.data instanceof ArrayBuffer) {
          await handleIncomingBinaryChunk(event.data);
        } else if (event.data instanceof Blob) {
          const buf = await event.data.arrayBuffer();
          await handleIncomingBinaryChunk(buf);
        }
      };

      dc.onclose = () => {
        handleRemoteDisconnect();
      };

      dc.onerror = () => {
        // Handled alongside close / connectionstatechange
      };
    },
    [handleIncomingBinaryChunk, handleIncomingControlFrame, handleRemoteDisconnect, sendControlFrame]
  );

  /**
   * Creates the `RTCPeerConnection` configured with Google STUN servers and encrypted ICE signaling.
   */
  const ensurePeerConnection = useCallback(
    (activeRole: TransferRole): RTCPeerConnection => {
      if (peerConnRef.current) {
        return peerConnRef.current;
      }

      const pc = new RTCPeerConnection({
        iceServers: SITE_CONFIG.stunServers.map((urls) => ({ urls })),
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && signalingRef.current && !signalingRef.current.isLocked()) {
          void signalingRef.current.publishEncrypted({
            type: 'ICE_CANDIDATE',
            role: activeRole,
            sessionId: signalingRef.current.getSenderId(),
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          handleRemoteDisconnect();
        }
      };

      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        if (iceState === 'disconnected' || iceState === 'failed' || iceState === 'closed') {
          handleRemoteDisconnect();
        }
      };

      if (activeRole === 'sender') {
        const dc = pc.createDataChannel('zeroseed-e2ee-v1', {
          ordered: true,
        });
        bindDataChannel(dc);
      } else {
        pc.ondatachannel = (event) => {
          bindDataChannel(event.channel);
        };
      }

      peerConnRef.current = pc;
      return pc;
    },
    [bindDataChannel, handleRemoteDisconnect]
  );

  /**
   * Starts a BlindSignalingChannel for the given seed and role.
   */
  const startSessionWithSeed = useCallback(
    async (rawSeed: string, activeRole: TransferRole) => {
      if (typeof window === 'undefined' || !window.crypto?.subtle) {
        setErrorCode('cryptoUnsupported');
        updatePhase('error');
        return;
      }

      disconnectHandledRef.current = false;
      fullDisconnect();
      abortTransferFlagRef.current = false;
      setErrorCode(null);
      updatePhase('connecting_broker');

      try {
        const derived = await deriveDualKeys(rawSeed);
        derivedRef.current = derived;

        setTelemetry((prev) => ({
          ...prev,
          phase: 'connecting_broker',
          topicHashHex: derived.topicHashHex,
          fingerprint: derived.fingerprint,
          roomLocked: false,
        }));

        const signaling = new BlindSignalingChannel({
          topicId: derived.topicId,
          aesKey: derived.signalKey,
          onStatusChange: (status) => {
            setBrokerStatus(status);
            if (status.connected && !status.locked) {
              setTelemetry((prev) => {
                if (
                  prev.phase === 'connecting_broker' ||
                  prev.phase === 'idle' ||
                  prev.phase === 'error'
                ) {
                  return { ...prev, phase: 'waiting_peer' };
                }
                return prev;
              });

              // Announce presence over the encrypted blind topic
              void signaling.publishEncrypted({
                type: 'PEER_HELLO',
                role: activeRole,
                sessionId: signaling.getSenderId(),
              });
            }
          },
          onAllBrokersFailed: () => {
            setErrorCode('brokerAllFailed');
            updatePhase('error');
          },
          onSignal: async (payload: DecryptedSignalPayload, senderId: string) => {
            if (signaling.isLocked()) return;

            // Enforce role separation so a spoofed/reflected role payload is ignored
            if (activeRole === 'sender' && payload.role !== 'receiver') return;
            if (activeRole === 'receiver' && payload.role !== 'sender') return;

            // Lock onto the first peer that responds in the room
            if (remotePeerIdRef.current && remotePeerIdRef.current !== senderId) {
              return;
            }

            if (activeRole === 'sender') {
              if (payload.type === 'PEER_HELLO') {
                // Prevent duplicate/replayed PEER_HELLO from tearing down an active handshake
                if (
                  peerConnRef.current &&
                  peerConnRef.current.connectionState !== 'failed'
                ) {
                  return;
                }
                remotePeerIdRef.current = senderId;
                updatePhase('handshaking');
                cleanupPeerConnectionOnly();
                remotePeerIdRef.current = senderId;

                const pc = ensurePeerConnection('sender');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                await signaling.publishEncrypted({
                  type: 'SDP_OFFER',
                  role: 'sender',
                  sessionId: signaling.getSenderId(),
                  sdp: pc.localDescription
                    ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
                    : offer,
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
                const pc = peerConnRef.current;
                if (pc && pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                  for (const cand of pendingIceCandidatesRef.current) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(cand));
                    } catch {
                      // ignore
                    }
                  }
                  pendingIceCandidatesRef.current = [];
                }
              } else if (payload.type === 'ICE_CANDIDATE' && payload.candidate) {
                const cand = payload.candidate;
                if (
                  typeof cand.candidate !== 'string' ||
                  cand.candidate.length > SITE_CONFIG.maxIceCandidateLength
                ) {
                  return;
                }
                const pc = peerConnRef.current;
                if (pc && pc.remoteDescription) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch {
                    // ignore
                  }
                } else if (pendingIceCandidatesRef.current.length < SITE_CONFIG.maxPendingIceCandidates) {
                  pendingIceCandidatesRef.current.push(cand);
                }
              }
            } else {
              // Receiver role
              if (payload.type === 'PEER_HELLO') {
                // Reply with PEER_HELLO so the sender initiates the SDP_OFFER
                await signaling.publishEncrypted({
                  type: 'PEER_HELLO',
                  role: 'receiver',
                  sessionId: signaling.getSenderId(),
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
                // Ignore duplicate SDP_OFFER while handshake/connection is active
                if (
                  peerConnRef.current &&
                  peerConnRef.current.connectionState !== 'failed'
                ) {
                  return;
                }
                remotePeerIdRef.current = senderId;
                updatePhase('handshaking');
                cleanupPeerConnectionOnly();
                remotePeerIdRef.current = senderId;

                const pc = ensurePeerConnection('receiver');
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));

                for (const cand of pendingIceCandidatesRef.current) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch {
                    // ignore
                  }
                }
                pendingIceCandidatesRef.current = [];

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await signaling.publishEncrypted({
                  type: 'SDP_ANSWER',
                  role: 'receiver',
                  sessionId: signaling.getSenderId(),
                  sdp: pc.localDescription
                    ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
                    : answer,
                });
              } else if (payload.type === 'ICE_CANDIDATE' && payload.candidate) {
                const cand = payload.candidate;
                if (
                  typeof cand.candidate !== 'string' ||
                  cand.candidate.length > SITE_CONFIG.maxIceCandidateLength
                ) {
                  return;
                }
                const pc = peerConnRef.current;
                if (pc && pc.remoteDescription) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch {
                    // ignore
                  }
                } else if (pendingIceCandidatesRef.current.length < SITE_CONFIG.maxPendingIceCandidates) {
                  pendingIceCandidatesRef.current.push(cand);
                }
              }
            }
          },
        });

        signalingRef.current = signaling;
        signaling.connect();
      } catch {
        setErrorCode('cryptoUnsupported');
        updatePhase('error');
      }
    },
    [cleanupPeerConnectionOnly, ensurePeerConnection, fullDisconnect, updatePhase]
  );

  // Initialize sender session automatically on mount or when role/seed changes (only after disclaimer accepted)
  useEffect(() => {
    if (!enabled) return;
    if (role === 'sender') {
      void startSessionWithSeed(senderSeed, 'sender');
    } else {
      fullDisconnect();
      setTelemetry((prev) => ({
        ...prev,
        phase: 'idle',
        topicHashHex: '',
        fingerprint: '',
        roomLocked: false,
      }));
    }
    return () => {
      fullDisconnect();
    };
  }, [enabled, role, senderSeed, startSessionWithSeed, fullDisconnect]);

  // Zero-trace cleanup + peer disconnect notice on pagehide / beforeunload
  useEffect(() => {
    const handleUnload = () => {
      void notifyPeerAndDisconnect(false);
      if (receiverStateRef.current) {
        void receiverStateRef.current.writer.abort();
        receiverStateRef.current = null;
      }
      senderAckMapRef.current.clear();
      setClipboardItems([]);
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [notifyPeerAndDisconnect]);

  /**
   * Disconnects gracefully after notifying the remote peer.
   */
  const disconnectGracefully = useCallback(async () => {
    await notifyPeerAndDisconnect(true);
    setErrorCode(null);
    setIncomingOffer(null);
    setTelemetry((prev) => ({
      ...prev,
      phase: 'idle',
      roomLocked: false,
    }));
  }, [notifyPeerAndDisconnect]);

  /**
   * Switches between Sender and Receiver tabs, notifies peer if connected, and clears volatile state.
   */
  const switchRole = useCallback(
    async (nextRole: TransferRole) => {
      if (dataChannelRef.current?.readyState === 'open') {
        await notifyPeerAndDisconnect(true);
      }
      setErrorCode(null);
      setIncomingOffer(null);
      setClipboardItems([]);
      revokeActiveBlobUrl();
      if (receiverStateRef.current) {
        void receiverStateRef.current.writer.abort();
        receiverStateRef.current = null;
      }
      senderAckMapRef.current.clear();
      setRoleState(nextRole);
    },
    [notifyPeerAndDisconnect, revokeActiveBlobUrl]
  );

  /**
   * Generates a fresh CSPRNG Seed for the Sender (notifying peer first if connected) and reconnects.
   */
  const regenerateSenderSeed = useCallback(async () => {
    if (dataChannelRef.current?.readyState === 'open') {
      await notifyPeerAndDisconnect(true);
    }
    const fresh = generateRandomSeed();
    senderAckMapRef.current.clear();
    setClipboardItems([]);
    revokeActiveBlobUrl();
    if (receiverStateRef.current) {
      void receiverStateRef.current.writer.abort();
      receiverStateRef.current = null;
    }
    setSenderSeed(fresh);
  }, [notifyPeerAndDisconnect, revokeActiveBlobUrl]);

  /**
   * Connects the Receiver using the entered Seed code (also supports reconnecting to resume).
   */
  const connectReceiver = useCallback(
    async (customSeed?: string) => {
      const targetSeed = normalizeSeed(customSeed ?? receiverSeedInput);
      if (!isValidSeedFormat(targetSeed)) {
        setErrorCode('invalidSeed');
        return;
      }
      setReceiverSeedInput(targetSeed);
      await startSessionWithSeed(targetSeed, 'receiver');
    },
    [receiverSeedInput, startSessionWithSeed]
  );

  /**
   * Reconnects the Sender on the existing Seed (e.g. if connection dropped mid-transfer)
   * so the transfer can resume from `lastChunkIndex + 1`.
   */
  const reconnectCurrentSeed = useCallback(async () => {
    if (role === 'sender') {
      await startSessionWithSeed(senderSeed, 'sender');
    } else if (receiverSeedInput) {
      await startSessionWithSeed(receiverSeedInput, 'receiver');
    }
  }, [role, senderSeed, receiverSeedInput, startSessionWithSeed]);

  /**
   * Backpressure helper: pauses the sender chunk loop when `dc.bufferedAmount` exceeds high-water mark.
   */
  const waitForBackpressureDrain = useCallback(async (dc: RTCDataChannel) => {
    if (dc.bufferedAmount < SITE_CONFIG.maxBufferedAmount) {
      return;
    }

    setTelemetry((prev) =>
      prev.phase === 'transferring' ? { ...prev, phase: 'paused_backpressure' } : prev
    );

    await new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        dc.removeEventListener('bufferedamountlow', onLow);
        clearInterval(pollTimer);
        resolve();
      };

      const onLow = () => {
        if (dc.bufferedAmount <= SITE_CONFIG.lowBufferedThreshold) {
          done();
        }
      };

      dc.addEventListener('bufferedamountlow', onLow);
      const pollTimer = setInterval(() => {
        if (
          dc.readyState !== 'open' ||
          abortTransferFlagRef.current ||
          dc.bufferedAmount <= SITE_CONFIG.lowBufferedThreshold
        ) {
          done();
        }
      }, 35);
    });

    setTelemetry((prev) =>
      prev.phase === 'paused_backpressure' ? { ...prev, phase: 'transferring' } : prev
    );
  }, []);

  /**
   * Starts encrypting and streaming the queued file(s) or folder over the open WebRTC DataChannel.
   */
  const startSendingQueue = useCallback(async () => {
    const dc = dataChannelRef.current;
    const derived = derivedRef.current;
    if (!dc || dc.readyState !== 'open' || !derived || queuedEntries.length === 0) {
      return;
    }

    abortTransferFlagRef.current = false;
    setErrorCode(null);

    const isMultiOrFolder = hasDirectoryInQueue || queuedEntries.length > 1;
    const SingleEntry = !isMultiOrFolder ? queuedEntries[0] : null;

    const totalRawBytes = queuedEntries.reduce((acc, item) => acc + item.file.size, 0);
    const archiveName = rootFolderName
      ? `${rootFolderName}.zip`
      : `ZeroSeed-Archive-${Date.now().toString().slice(-5)}.zip`;

    const fileName = SingleEntry ? SingleEntry.file.name : archiveName;
    const mimeType = SingleEntry
      ? SingleEntry.file.type || 'application/octet-stream'
      : 'application/zip';

    // Deterministic fileId for single-file transfers so Resume across reconnects matches automatically
    const fileId = SingleEntry
      ? `single::${SingleEntry.file.name}::${SingleEntry.file.size}::${SingleEntry.file.lastModified}`
      : `zip::${archiveName}::${totalRawBytes}`;

    const totalChunksEstimate =
      SingleEntry && totalRawBytes === 0
        ? 0
        : Math.max(1, Math.ceil(totalRawBytes / SITE_CONFIG.chunkSize));
    const knownLastAck = SingleEntry ? (senderAckMapRef.current.get(fileId) ?? -1) : -1;

    const offer: TransferMetadataOffer = {
      fileId,
      fileName: sanitizeFileName(fileName),
      fileSize: totalRawBytes,
      mimeType,
      isFolderArchive: isMultiOrFolder,
      itemCount: queuedEntries.length,
      totalChunks: totalChunksEstimate,
      resumable: !isMultiOrFolder,
      knownLastAckChunk: knownLastAck,
    };

    pendingSenderOfferIdRef.current = fileId;

    const acceptPromise = new Promise<{
      storageMode: WriteStorageMode;
      resumeFromChunk: number;
    }>((resolve) => {
      acceptResolverRef.current = resolve;
    });

    await sendControlFrame({
      type: 'FILE_OFFER',
      offer,
    });

    // Wait for Receiver to accept (and pick disk location if applicable)
    const decision = await acceptPromise;
    pendingSenderOfferIdRef.current = null;
    if (abortTransferFlagRef.current) return;

    const totalSingleChunks = SingleEntry ? Math.ceil(SingleEntry.file.size / SITE_CONFIG.chunkSize) : 0;
    const startChunkIndex =
      SingleEntry &&
      Number.isInteger(decision.resumeFromChunk) &&
      decision.resumeFromChunk > 0 &&
      decision.resumeFromChunk <= totalSingleChunks
        ? decision.resumeFromChunk
        : 0;

    // Generate collision-free 8-byte session IV prefix for this transfer
    const sessionIvPrefix = createSessionIvPrefix();

    speedTrackerRef.current = {
      lastTimestamp: performance.now(),
      lastBytes: startChunkIndex * SITE_CONFIG.chunkSize,
      smoothedSpeed: 0,
    };

    setTelemetry((prev) => ({
      ...prev,
      phase: 'transferring',
      writeMode: decision.storageMode,
      activeFileName: fileName,
      totalBytes: totalRawBytes,
      totalChunks: totalChunksEstimate,
      currentChunk: startChunkIndex,
      lastAckedChunk: startChunkIndex - 1,
      resumedFromChunk: startChunkIndex > 0 ? startChunkIndex : null,
      completedDownloadUrl: null,
    }));

    try {
      if (SingleEntry) {
        // Single-file streaming with seamless mid-file Resume via file.slice((lastChunkIndex + 1) * 65536)
        const file = SingleEntry.file;
        const chunkSize = SITE_CONFIG.chunkSize;
        const totalChunks = Math.ceil(file.size / chunkSize);
        let bytesSent = startChunkIndex * chunkSize;

        // If resuming from a specific chunk index, slice from `(lastChunkIndex + 1) * 65536`
        const resumedFileBlob =
          startChunkIndex > 0 ? file.slice(startChunkIndex * chunkSize) : file;

        const remainingChunks = Math.ceil(resumedFileBlob.size / chunkSize);

        for (let relIdx = 0; relIdx < remainingChunks; relIdx++) {
          if (abortTransferFlagRef.current || dc.readyState !== 'open') {
            return;
          }

          const currentChunkIndex = startChunkIndex + relIdx;
          const sliceStart = relIdx * chunkSize;
          const sliceEnd = Math.min(sliceStart + chunkSize, resumedFileBlob.size);
          const sliceBuffer = await resumedFileBlob.slice(sliceStart, sliceEnd).arrayBuffer();
          const plainBytes = new Uint8Array(sliceBuffer);

          await waitForBackpressureDrain(dc);
          if (abortTransferFlagRef.current || dc.readyState !== 'open') return;

          const encryptedPacket = await encryptChunkPacket(
            derived.transferKey,
            currentChunkIndex,
            plainBytes,
            fileId,
            sessionIvPrefix
          );
          dc.send(encryptedPacket);

          bytesSent += plainBytes.byteLength;
          const now = performance.now();
          const tracker = speedTrackerRef.current;
          const dt = (now - tracker.lastTimestamp) / 1000;
          if (dt >= 0.25) {
            const dBytes = bytesSent - tracker.lastBytes;
            const instantMbps = dBytes / (1024 * 1024) / dt;
            tracker.smoothedSpeed =
              tracker.smoothedSpeed === 0
                ? instantMbps
                : tracker.smoothedSpeed * 0.7 + instantMbps * 0.3;
            tracker.lastTimestamp = now;
            tracker.lastBytes = bytesSent;
          }

          const progressPercent =
            file.size > 0 ? Math.min(99.9, (bytesSent / file.size) * 100) : 100;
          const remainingBytes = Math.max(0, file.size - bytesSent);
          const etaSeconds =
            tracker.smoothedSpeed > 0.01
              ? remainingBytes / (1024 * 1024) / tracker.smoothedSpeed
              : null;

          setTelemetry((prev) => ({
            ...prev,
            progressPercent,
            bytesTransferred: bytesSent,
            currentChunk: currentChunkIndex + 1,
            totalChunks,
            speedMbps: tracker.smoothedSpeed,
            etaSeconds,
          }));
        }

        if (!abortTransferFlagRef.current && dc.readyState === 'open') {
          await sendControlFrame({
            type: 'FILE_COMPLETE',
            fileId,
            totalChunks,
            totalBytes: file.size,
          });
          setTelemetry((prev) => ({
            ...prev,
            phase: 'completed',
            progressPercent: 100,
            bytesTransferred: file.size,
            currentChunk: totalChunks,
            totalChunks,
            etaSeconds: 0,
          }));
        }
      } else {
        // Real-time streaming ZIP via fflate for folders or multi-file bundles
        let bytesEmitted = 0;

        const { totalChunks, totalBytesEmitted } = await streamEntriesAsZipChunks(
          queuedEntries,
          async (chunkIndex, chunkBytes) => {
            if (abortTransferFlagRef.current || dc.readyState !== 'open') return;

            await waitForBackpressureDrain(dc);
            if (abortTransferFlagRef.current || dc.readyState !== 'open') return;

            const encryptedPacket = await encryptChunkPacket(
              derived.transferKey,
              chunkIndex,
              chunkBytes,
              fileId,
              sessionIvPrefix
            );
            dc.send(encryptedPacket);

            bytesEmitted += chunkBytes.byteLength;
            const now = performance.now();
            const tracker = speedTrackerRef.current;
            const dt = (now - tracker.lastTimestamp) / 1000;
            if (dt >= 0.25) {
              const dBytes = bytesEmitted - tracker.lastBytes;
              const instantMbps = dBytes / (1024 * 1024) / dt;
              tracker.smoothedSpeed =
                tracker.smoothedSpeed === 0
                  ? instantMbps
                  : tracker.smoothedSpeed * 0.7 + instantMbps * 0.3;
              tracker.lastTimestamp = now;
              tracker.lastBytes = bytesEmitted;
            }

            const denom = Math.max(totalRawBytes, bytesEmitted);
            const progressPercent =
              denom > 0 ? Math.min(99.5, (bytesEmitted / denom) * 100) : 0;
            const remainingBytes = Math.max(0, denom - bytesEmitted);
            const etaSeconds =
              tracker.smoothedSpeed > 0.01
                ? remainingBytes / (1024 * 1024) / tracker.smoothedSpeed
                : null;

            setTelemetry((prev) => ({
              ...prev,
              progressPercent,
              bytesTransferred: bytesEmitted,
              totalBytes: denom,
              currentChunk: chunkIndex + 1,
              totalChunks: Math.max(prev.totalChunks, chunkIndex + 1),
              speedMbps: tracker.smoothedSpeed,
              etaSeconds,
            }));
          },
          () => abortTransferFlagRef.current || dc.readyState !== 'open'
        );

        if (!abortTransferFlagRef.current && dc.readyState === 'open') {
          await sendControlFrame({
            type: 'FILE_COMPLETE',
            fileId,
            totalChunks,
            totalBytes: totalBytesEmitted,
          });
          setTelemetry((prev) => ({
            ...prev,
            phase: 'completed',
            progressPercent: 100,
            bytesTransferred: totalBytesEmitted,
            totalBytes: totalBytesEmitted,
            currentChunk: totalChunks,
            totalChunks,
            etaSeconds: 0,
          }));
        }
      }
    } catch {
      if (!abortTransferFlagRef.current) {
        setErrorCode('transferAborted');
        updatePhase('error');
      }
    }
  }, [
    hasDirectoryInQueue,
    queuedEntries,
    rootFolderName,
    sendControlFrame,
    updatePhase,
    waitForBackpressureDrain,
  ]);

  /**
   * Called on the Receiver when the user clicks "Accept & Save Directly to Disk" (or RAM fallback).
   */
  const acceptIncomingOffer = useCallback(
    async (preferDisk: boolean) => {
      if (!incomingOffer) return;

      try {
        revokeActiveBlobUrl();
        const writer = await StreamFileWriter.create(
          incomingOffer.fileName,
          'application/octet-stream',
          preferDisk
        );

        speedTrackerRef.current = {
          lastTimestamp: performance.now(),
          lastBytes: 0,
          smoothedSpeed: 0,
        };

        const maxAllowedBytes = incomingOffer.isFolderArchive
          ? incomingOffer.fileSize + incomingOffer.itemCount * 1024 + 1024 * 1024
          : incomingOffer.fileSize;

        receiverStateRef.current = {
          fileId: incomingOffer.fileId,
          writer,
          lastChunkIndex: -1,
          expectedNextChunk: 0,
          bytesWritten: 0,
          totalBytes: incomingOffer.fileSize,
          maxAllowedBytes,
          totalChunks: incomingOffer.totalChunks,
          fileName: incomingOffer.fileName,
          isFolderArchive: incomingOffer.isFolderArchive,
          disconnectedForResume: false,
          startTime: performance.now(),
        };

        const chosenMode = writer.mode;
        setIncomingOffer(null);
        setTelemetry((prev) => ({
          ...prev,
          phase: 'transferring',
          writeMode: chosenMode,
          activeFileName: incomingOffer.fileName,
          totalBytes: incomingOffer.fileSize,
          totalChunks: incomingOffer.totalChunks,
          currentChunk: 0,
          lastAckedChunk: -1,
          resumedFromChunk: null,
          completedDownloadUrl: null,
        }));

        await sendControlFrame({
          type: 'FILE_ACCEPT',
          fileId: incomingOffer.fileId,
          storageMode: chosenMode,
          resumeFromChunk: 0,
        });
      } catch {
        setErrorCode('fileWriteError');
      }
    },
    [incomingOffer, revokeActiveBlobUrl, sendControlFrame]
  );

  /**
   * Cancels an active transfer on either side.
   */
  const cancelActiveTransfer = useCallback(async () => {
    abortTransferFlagRef.current = true;
    const rx = receiverStateRef.current;
    if (rx) {
      await rx.writer.abort();
      receiverStateRef.current = null;
    }
    await sendControlFrame({
      type: 'TRANSFER_ABORT',
      fileId: rx?.fileId ?? 'active',
      reason: 'USER_ABORT',
    });
    setErrorCode('transferAborted');
    updatePhase('connected');
  }, [sendControlFrame, updatePhase]);

  /**
   * Adds selected FileList (files or folder input) to the sender queue.
   */
  const addFilesToQueue = useCallback((fileList: FileList | File[]) => {
    const { entries, hasDirectory, rootFolderName: folder } = filesToRelativeEntries(fileList);
    if (entries.length === 0) return;

    setQueuedEntries((prev) => [...prev, ...entries]);
    if (hasDirectory) setHasDirectoryInQueue(true);
    if (folder) setRootFolderName((prev) => prev ?? folder);
  }, []);

  /**
   * Handles full-window Drag & Drop of files and directories (`webkitGetAsEntry`).
   */
  const handleDataTransferDrop = useCallback(
    async (dataTransfer: DataTransfer) => {
      const { entries, hasDirectory, rootFolderName: folder } =
        await extractDroppedEntries(dataTransfer);
      if (entries.length === 0) return;

      if (role !== 'sender') {
        setRoleState('sender');
      }
      setQueuedEntries((prev) => [...prev, ...entries]);
      if (hasDirectory) setHasDirectoryInQueue(true);
      if (folder) setRootFolderName((prev) => prev ?? folder);
    },
    [role]
  );

  const clearQueue = useCallback(() => {
    setQueuedEntries([]);
    setHasDirectoryInQueue(false);
    setRootFolderName(null);
  }, []);

  /**
   * Sends an AES-GCM-256 encrypted text/code snippet over the P2P DataChannel.
   */
  const sendClipboardText = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, SITE_CONFIG.maxClipboardChars);
      if (!trimmed) return;

      const id = `cb_${generateRandomHex(6)}`;
      const timestamp = Date.now();

      await sendControlFrame({
        type: 'CLIPBOARD_TEXT',
        id,
        text: trimmed,
        timestamp,
      });

      setClipboardItems((prev) =>
        [
          {
            id,
            text: trimmed,
            direction: 'sent' as const,
            timestamp,
          },
          ...prev,
        ].slice(0, SITE_CONFIG.maxClipboardItems)
      );
    },
    [sendControlFrame]
  );

  const clearClipboardHistory = useCallback(() => {
    setClipboardItems([]);
  }, []);

  return {
    role,
    switchRole,
    senderSeed,
    regenerateSenderSeed,
    receiverSeedInput,
    setReceiverSeedInput,
    connectReceiver,
    reconnectCurrentSeed,
    disconnectGracefully,
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
    brokerStatus,
    errorCode,
    setErrorCode,
    clipboardItems,
    sendClipboardText,
    clearClipboardHistory,
  };
}
