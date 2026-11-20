import { SITE_CONFIG } from './site';
import { encryptJsonPayload, decryptJsonPayload } from './seedCrypto';

export type SignalMessageType = 'PEER_HELLO' | 'SDP_OFFER' | 'SDP_ANSWER' | 'ICE_CANDIDATE';

export interface EncryptedSignalEnvelope {
  v: 1;
  senderId: string;
  /** Base64 AES-GCM-256 encrypted JSON of DecryptedSignalPayload */
  p: string;
}

export interface DecryptedSignalPayload {
  type: SignalMessageType;
  role: 'sender' | 'receiver';
  sessionId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  timestamp: number;
}

export interface BrokerStatusInfo {
  brokerName: string;
  brokerUrl: string;
  brokerIndex: number;
  connected: boolean;
  locked: boolean;
  failoverCount: number;
}

interface BlindSignalingOptions {
  topicId: string;
  aesKey: CryptoKey;
  onSignal: (payload: DecryptedSignalPayload, senderId: string) => void;
  onStatusChange: (status: BrokerStatusInfo) => void;
  onAllBrokersFailed: () => void;
}

/**
 * Encodes an MQTT Variable Byte Integer (Remaining Length).
 */
function encodeRemainingLength(length: number): number[] {
  const bytes: number[] = [];
  let x = length;
  do {
    let encodedByte = x % 128;
    x = Math.floor(x / 128);
    if (x > 0) {
      encodedByte = encodedByte | 0x80;
    }
    bytes.push(encodedByte);
  } while (x > 0);
  return bytes;
}

/**
 * Decodes an MQTT Variable Byte Integer starting at `startIndex`.
 */
function decodeRemainingLength(
  data: Uint8Array,
  startIndex: number
): { value: number; bytesUsed: number } | null {
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

  return { value, bytesUsed: idx - startIndex };
}

function encodeMqttUtf8(str: string): Uint8Array {
  const utf8 = new TextEncoder().encode(str);
  const out = new Uint8Array(2 + utf8.byteLength);
  out[0] = (utf8.byteLength >> 8) & 0xff;
  out[1] = utf8.byteLength & 0xff;
  out.set(utf8, 2);
  return out;
}

function buildMqttConnectPacket(clientId: string, keepAliveSec = 30): Uint8Array {
  const protoName = encodeMqttUtf8('MQTT');
  const clientIdBytes = encodeMqttUtf8(clientId);
  // Variable header: protoName (6) + protoLevel(1=0x04) + flags(1=0x02 clean session) + keepAlive(2)
  const varHeaderLen = protoName.byteLength + 4;
  const remainingLen = varHeaderLen + clientIdBytes.byteLength;
  const remBytes = encodeRemainingLength(remainingLen);

  const packet = new Uint8Array(1 + remBytes.length + remainingLen);
  let offset = 0;
  packet[offset++] = 0x10; // CONNECT
  for (const b of remBytes) packet[offset++] = b;
  packet.set(protoName, offset);
  offset += protoName.byteLength;
  packet[offset++] = 0x04; // MQTT v3.1.1
  packet[offset++] = 0x02; // Clean Session
  packet[offset++] = (keepAliveSec >> 8) & 0xff;
  packet[offset++] = keepAliveSec & 0xff;
  packet.set(clientIdBytes, offset);
  return packet;
}

function buildMqttSubscribePacket(packetId: number, topic: string): Uint8Array {
  const topicBytes = encodeMqttUtf8(topic);
  const remainingLen = 2 + topicBytes.byteLength + 1;
  const remBytes = encodeRemainingLength(remainingLen);

  const packet = new Uint8Array(1 + remBytes.length + remainingLen);
  let offset = 0;
  packet[offset++] = 0x82; // SUBSCRIBE (QoS 1 required by spec for SUBSCRIBE header)
  for (const b of remBytes) packet[offset++] = b;
  packet[offset++] = (packetId >> 8) & 0xff;
  packet[offset++] = packetId & 0xff;
  packet.set(topicBytes, offset);
  offset += topicBytes.byteLength;
  packet[offset] = 0x00; // Requested QoS 0
  return packet;
}

function buildMqttUnsubscribePacket(packetId: number, topic: string): Uint8Array {
  const topicBytes = encodeMqttUtf8(topic);
  const remainingLen = 2 + topicBytes.byteLength;
  const remBytes = encodeRemainingLength(remainingLen);

  const packet = new Uint8Array(1 + remBytes.length + remainingLen);
  let offset = 0;
  packet[offset++] = 0xa2; // UNSUBSCRIBE
  for (const b of remBytes) packet[offset++] = b;
  packet[offset++] = (packetId >> 8) & 0xff;
  packet[offset++] = packetId & 0xff;
  packet.set(topicBytes, offset);
  return packet;
}

function buildMqttPublishPacket(topic: string, payloadStr: string): Uint8Array {
  const topicBytes = encodeMqttUtf8(topic);
  const payloadBytes = new TextEncoder().encode(payloadStr);
  const remainingLen = topicBytes.byteLength + payloadBytes.byteLength;
  const remBytes = encodeRemainingLength(remainingLen);

  const packet = new Uint8Array(1 + remBytes.length + remainingLen);
  let offset = 0;
  packet[offset++] = 0x30; // PUBLISH, QoS 0, Retain 0
  for (const b of remBytes) packet[offset++] = b;
  packet.set(topicBytes, offset);
  offset += topicBytes.byteLength;
  packet.set(payloadBytes, offset);
  return packet;
}

/**
 * Redundant Blind Signaling Manager over WSS MQTT with automatic 3-second failover,
 * AES-GCM-256 encrypted SDP/ICE payloads, and instant Room Locking (Anti-Hijack).
 * Uses zero Node.js polyfills so it runs natively in any browser over `wss://`.
 */
export class BlindSignalingChannel {
  private ws: WebSocket | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private readonly clientId: string;
  private currentBrokerIndex = 0;
  private failoverCount = 0;
  private isRoomLocked = false;
  private isDestroyed = false;
  private isMqttConnected = false;
  private failoverTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly opts: BlindSignalingOptions;

  constructor(opts: BlindSignalingOptions) {
    this.opts = opts;
    const rand = new Uint8Array(6);
    window.crypto.getRandomValues(rand);
    const hex = Array.from(rand, (b) => b.toString(16).padStart(2, '0')).join('');
    this.clientId = `zs_${hex}`;
  }

  public getSenderId(): string {
    return this.clientId;
  }

  public isLocked(): boolean {
    return this.isRoomLocked;
  }

  public connect(): void {
    if (this.isDestroyed || this.isRoomLocked) return;
    this.tryBroker(0);
  }

  private tryBroker(index: number): void {
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
        const connectPacket = buildMqttConnectPacket(`${this.clientId}_${index}`, 25);
        ws.send(connectPacket);
      };

      ws.onmessage = async (event) => {
        if (this.isDestroyed || this.isRoomLocked) return;
        const raw =
          event.data instanceof ArrayBuffer
            ? new Uint8Array(event.data)
            : event.data instanceof Blob
            ? new Uint8Array(await event.data.arrayBuffer())
            : null;
        if (!raw || raw.byteLength < 2) return;

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
            // CONNACK
            const returnCode = body[1] ?? 0xff;
            if (returnCode === 0x00) {
              ws.send(buildMqttSubscribePacket(1, this.opts.topicId));
            } else {
              this.triggerFailover(index, settled);
              return;
            }
          } else if (packetType === 0x90) {
            // SUBACK
            settled = true;
            this.isMqttConnected = true;
            this.clearTimer();
            this.startKeepAlive(ws);
            this.emitStatus(true);
          } else if (packetType === 0x30) {
            // PUBLISH
            if (body.byteLength < 2) continue;
            const topicLen = (body[0] << 8) | body[1];
            if (body.byteLength < 2 + topicLen) continue;
            const topicStr = new TextDecoder().decode(body.subarray(2, 2 + topicLen));
            const qos = (headerByte >> 1) & 0x03;
            const payloadStart = 2 + topicLen + (qos > 0 ? 2 : 0);
            if (topicStr !== this.opts.topicId || payloadStart > body.byteLength) continue;

            const payloadBytes = body.subarray(payloadStart);
            await this.handleRawTopicPayload(payloadBytes);
          }
        }
      };

      ws.onerror = () => {
        if (this.isDestroyed || this.isRoomLocked) return;
        this.triggerFailover(index, settled);
      };

      ws.onclose = () => {
        if (this.isDestroyed || this.isRoomLocked) return;
        this.triggerFailover(index, settled);
      };
    } catch {
      this.triggerFailover(index, settled);
    }
  }

  private triggerFailover(index: number, wasSettled: boolean): void {
    if (this.isDestroyed || this.isRoomLocked) return;
    this.clearTimer();
    this.cleanupSocketOnly();
    this.failoverCount += 1;
    if (!wasSettled) {
      this.tryBroker(index + 1);
    } else {
      const nextIdx = (index + 1) % SITE_CONFIG.mqttBrokers.length;
      this.tryBroker(nextIdx);
    }
  }

  private async handleRawTopicPayload(payloadBytes: Uint8Array): Promise<void> {
    try {
      const text = new TextDecoder().decode(payloadBytes);
      const envelope = JSON.parse(text) as EncryptedSignalEnvelope;

      if (!envelope || envelope.v !== 1 || envelope.senderId === this.clientId || !envelope.p) {
        return;
      }

      const decrypted = await decryptJsonPayload<DecryptedSignalPayload>(
        this.opts.aesKey,
        envelope.p
      );
      this.opts.onSignal(decrypted, envelope.senderId);
    } catch {
      // Silently ignore unauthenticated noise on the blind topic
    }
  }

  public async publishEncrypted(payload: Omit<DecryptedSignalPayload, 'timestamp'>): Promise<void> {
    if (
      this.isDestroyed ||
      this.isRoomLocked ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN ||
      !this.isMqttConnected
    ) {
      return;
    }

    const fullPayload: DecryptedSignalPayload = {
      ...payload,
      timestamp: Date.now(),
    };

    const encryptedBase64 = await encryptJsonPayload(this.opts.aesKey, fullPayload);
    const envelope: EncryptedSignalEnvelope = {
      v: 1,
      senderId: this.clientId,
      p: encryptedBase64,
    };

    const packet = buildMqttPublishPacket(this.opts.topicId, JSON.stringify(envelope));
    this.ws.send(packet);
  }

  /**
   * Anti-Hijack Room Locking:
   * Immediately unsubscribes from the blind MQTT topic and closes the WSS connection
   * the instant the first WebRTC DataChannel opens.
   */
  public lockRoomAndDisconnect(): void {
    if (this.isRoomLocked) return;
    this.isRoomLocked = true;
    this.clearTimer();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(buildMqttUnsubscribePacket(2, this.opts.topicId));
        this.ws.send(new Uint8Array([0xe0, 0x00])); // MQTT DISCONNECT
      } catch {
        // ignore
      }
    }

    this.cleanupSocketOnly();
    this.emitStatus(false);
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.clearTimer();
    this.cleanupSocketOnly();
  }

  private startKeepAlive(ws: WebSocket): void {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(new Uint8Array([0xc0, 0x00])); // MQTT PINGREQ
      }
    }, 20_000);
  }

  private cleanupSocketOnly(): void {
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
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  private clearTimer(): void {
    if (this.failoverTimer) {
      clearTimeout(this.failoverTimer);
      this.failoverTimer = null;
    }
  }

  private emitStatus(connected: boolean): void {
    const broker =
      SITE_CONFIG.mqttBrokers[this.currentBrokerIndex] ?? SITE_CONFIG.mqttBrokers[0];
    this.opts.onStatusChange({
      brokerName: broker.name,
      brokerUrl: broker.url,
      brokerIndex: this.currentBrokerIndex,
      connected,
      locked: this.isRoomLocked,
      failoverCount: this.failoverCount,
    });
  }
}
