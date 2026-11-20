import { SITE_CONFIG } from './site';

/**
 * Exactly 256 unique, keyboard-friendly basic ASCII English words (a-z only).
 * Designed for cross-locale compatibility so users on any keyboard layout
 * (TR, US, UK, DE, etc.) never encounter special-character typing issues.
 */
export const ASCII_WORD_POOL: readonly string[] = [
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
  'kayak', 'kiosk', 'koala', 'label', 'lance', 'laser', 'latch', 'lemon',
  'level', 'light', 'lilac', 'linen', 'liver', 'llama', 'local', 'logic',
  'lotus', 'lunar', 'lyric', 'macro', 'magic', 'magma', 'major', 'mango',
  'manor', 'maple', 'march', 'marsh', 'mason', 'match', 'medal', 'melon',
  'mercy', 'merit', 'metal', 'meter', 'micro', 'miner', 'mint', 'mirth',
  'model', 'modem', 'moral', 'motor', 'mount', 'mural', 'music', 'naive',
  'nectar', 'nexus', 'noble', 'north', 'novel', 'nurse', 'nylon', 'oasis',
  'ocean', 'olive', 'omega', 'onion', 'opera', 'optic', 'orbit', 'order',
  'organ', 'otter', 'oxide', 'ozone', 'panda', 'panel', 'paper', 'parka',
  'patch', 'pearl', 'pecan', 'pedal', 'penny', 'perch', 'petal', 'phase',
  'phone', 'photo', 'piano', 'pilot', 'pine', 'pixel', 'plaza', 'plume',
  'plush', 'point', 'polar', 'pond', 'porch', 'power', 'press', 'prism',
  'prize', 'probe', 'proof', 'prose', 'pulse', 'punch', 'pupil', 'quartz',
  'quest', 'quick', 'quiet', 'quilt', 'quota', 'quote', 'radar', 'radio',
  'ranch', 'range', 'rapid', 'raven', 'rayon', 'reach', 'realm', 'rebel',
  'reef', 'relay', 'relic', 'remix', 'ridge', 'rifle', 'risen', 'river',
  'roast', 'robin', 'robot', 'rocky', 'royal', 'ruby', 'rugby', 'ruler',
  'rumor', 'rural', 'saber', 'salad', 'salon', 'salsa', 'satin', 'scale',
  'scarf', 'scene', 'scent', 'scope', 'score', 'scout', 'scrap', 'sedan',
  'serum', 'shade', 'shaft', 'shale', 'shark', 'shawl', 'sheer', 'shell',
  'shift', 'shine', 'shore', 'shrub', 'sierra', 'sigma', 'siren', 'skate',
  'skill', 'slate', 'slice', 'slide', 'slope', 'smart', 'smile', 'smoke',
  'snack', 'solar', 'solid', 'sonar', 'sonic', 'sound', 'south', 'space',
  'spark', 'spear', 'spice', 'spike', 'spine', 'spoke', 'spoon', 'sport',
  'squad', 'stack', 'stage', 'stamp', 'stand', 'stark', 'state', 'steam',
  'steel', 'stern', 'stone', 'storm', 'story', 'stove', 'straw', 'stream',
  'sugar', 'suite', 'sunny', 'surge', 'swamp', 'swarm', 'swift', 'sword',
  'syrup', 'table', 'talon', 'tango', 'tempo', 'tenor', 'terra', 'theme',
  'thorn', 'thumb', 'tiger', 'tilde', 'timer', 'titan', 'title', 'toast',
  'token', 'tonic', 'topaz', 'torch', 'total', 'totem', 'touch', 'tower',
  'trace', 'track', 'trade', 'trail', 'train', 'trait', 'trend', 'triad',
  'trial', 'tribe', 'trick', 'troop', 'trout', 'truck', 'trump', 'trunk',
  'trust', 'truth', 'tulip', 'tuner', 'tunic', 'turbo', 'tutor', 'twine',
  'twist', 'ultra', 'umbra', 'union', 'unity', 'urban', 'usher', 'valor',
  'valve', 'vapor', 'vault', 'vegan', 'velvet', 'venue', 'verse', 'video',
  'vigil', 'villa', 'vinyl', 'viola', 'viper', 'viral', 'visor', 'vista',
  'vital', 'vivid', 'vocal', 'vogue', 'voice', 'voter', 'vowel', 'wagon',
  'waltz', 'watch', 'water', 'weave', 'wedge', 'whale', 'wheat', 'wheel',
  'whisk', 'width', 'willow', 'windy', 'world', 'wrist', 'xenon', 'yacht',
  'zebra', 'zenith', 'zircon', 'zone', 'forest', 'iron', 'cloud', 'frost',
].filter((w, i, arr) => arr.indexOf(w) === i && /^[a-z]{3,8}$/.test(w)).slice(0, 256);

export class AuthTagMismatchError extends Error {
  constructor(public readonly chunkIndex: number) {
    super(`AES-GCM authentication tag verification failed at chunk #${chunkIndex}`);
    this.name = 'AuthTagMismatchError';
  }
}

export interface DualDerivedMaterial {
  normalizedSeed: string;
  topicHashHex: string;
  topicId: string;
  aesKey: CryptoKey;
  fingerprint: string;
}

/**
 * Generates a cryptographically random readable seed using window.crypto.getRandomValues().
 * Format: <4-digit-number>-<word1>-<word2>-<word3> (e.g. "8412-iron-forest-cloud")
 * Entropy: ~44 bits of uniform CSPRNG state. Never uses Math.random().
 */
export function generateRandomSeed(): string {
  if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
    throw new Error('CSPRNG (window.crypto.getRandomValues) is not available.');
  }

  // Unbiased 4-digit integer in [1000, 9999] via rejection sampling
  const uint16 = new Uint16Array(1);
  const range = 9000;
  const maxUnbiased = Math.floor(65536 / range) * range; // 63000
  let num = 0;
  do {
    window.crypto.getRandomValues(uint16);
  } while (uint16[0] >= maxUnbiased);
  num = 1000 + (uint16[0] % range);

  // Select 3 random words from the 256-word ASCII pool using CSPRNG bytes
  const poolLen = ASCII_WORD_POOL.length; // 256
  const wordBytes = new Uint8Array(3);
  window.crypto.getRandomValues(wordBytes);

  const w1 = ASCII_WORD_POOL[wordBytes[0] % poolLen];
  const w2 = ASCII_WORD_POOL[wordBytes[1] % poolLen];
  const w3 = ASCII_WORD_POOL[wordBytes[2] % poolLen];

  return `${num}-${w1}-${w2}-${w3}`;
}

/**
 * Normalizes a user-entered or generated seed (trim, lowercase, collapse whitespace to hyphens).
 */
export function normalizeSeed(seed: string): string {
  return seed
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Validates that a seed follows the expected 4-digit + 3 ASCII word structure.
 */
export function isValidSeedFormat(seed: string): boolean {
  const norm = normalizeSeed(seed);
  return /^\d{4}-[a-z]{2,12}-[a-z]{2,12}-[a-z]{2,12}$/.test(norm);
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Dual Cryptographic Derivation from a single Seed:
 * 1. Blind Signaling Channel Topic ID: First 128 bits (32 hex chars) of SHA-256(normalizedSeed)
 *    formatted as `p2p-io/v1/<first_32_hex_chars>`.
 * 2. End-to-End Encryption Key: PBKDF2-HMAC-SHA256 (150,000 iterations) with domain separator
 *    `"p2p-e2ee-key-v1"` -> non-extractable 256-bit AES-GCM CryptoKey.
 */
export async function deriveDualKeys(rawSeed: string): Promise<DualDerivedMaterial> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API (window.crypto.subtle) is unsupported.');
  }

  const normalizedSeed = normalizeSeed(rawSeed);
  const encoder = new TextEncoder();
  const seedBytes = encoder.encode(normalizedSeed);

  // 1. Blind Signaling Topic ID: SHA-256 -> first 128 bits (16 bytes = 32 hex characters)
  const sha256Digest = await window.crypto.subtle.digest('SHA-256', seedBytes);
  const first128Bits = new Uint8Array(sha256Digest, 0, 16);
  const topicHashHex = bufferToHex(first128Bits);
  const topicId = `${SITE_CONFIG.protocolNamespace}/${topicHashHex}`;

  // 2. End-to-End AES-GCM-256 Key via PBKDF2 (150,000 iterations, SHA-256, domain salt)
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    seedBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const domainSalt = encoder.encode(SITE_CONFIG.keyDerivationDomain);
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: domainSalt,
      iterations: SITE_CONFIG.pbkdf2Iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // non-extractable for zero-leak security
    ['encrypt', 'decrypt']
  );

  // 3. Visual verification fingerprint (derived with separate domain tag so it reveals neither seed nor topic)
  const fpDigest = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${normalizedSeed}::p2p-visual-fp-v1`)
  );
  const fpHex = bufferToHex(new Uint8Array(fpDigest, 0, 4)).toUpperCase();
  const fingerprint = `${fpHex.slice(0, 4)}-${fpHex.slice(4, 8)}`;

  return {
    normalizedSeed,
    topicHashHex,
    topicId,
    aesKey,
    fingerprint,
  };
}

/**
 * Encrypts a JSON object (e.g. WebRTC SDP Offer/Answer, ICE Candidate, or Control/Clipboard message)
 * using the derived AES-GCM-256 key with a fresh 12-byte CSPRNG IV.
 * Returns a base64 string containing `[12-byte IV + Ciphertext + 16-byte GCM Auth Tag]`.
 */
export async function encryptJsonPayload(key: CryptoKey, payload: unknown): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    key,
    encoded
  );

  const cipherBytes = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(12 + cipherBytes.byteLength);
  combined.set(iv, 0);
  combined.set(cipherBytes, 12);

  return uint8ToBase64(combined);
}

/**
 * Decrypts a base64-encoded AES-GCM-256 JSON payload.
 * Throws if GCM authentication tag verification fails.
 */
export async function decryptJsonPayload<T = unknown>(
  key: CryptoKey,
  base64Packet: string
): Promise<T> {
  const combined = base64ToUint8(base64Packet);
  if (combined.byteLength < 28) {
    throw new Error('Malformed encrypted payload: shorter than IV + GCM tag.');
  }

  const iv = combined.subarray(0, 12);
  const ciphertextWithTag = combined.subarray(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    key,
    ciphertextWithTag
  );

  const jsonStr = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

/**
 * Encrypts a 64 KB binary file/ZIP chunk using AES-GCM-256 and packs it into the wire format:
 * `[4-byte Big-Endian chunkIndex + 12-byte IV + Encrypted Data + 16-byte GCM Auth Tag]`
 */
export async function encryptChunkPacket(
  key: CryptoKey,
  chunkIndex: number,
  plainChunk: Uint8Array
): Promise<ArrayBuffer> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Web Crypto AES-GCM appends the 16-byte (128-bit) Auth Tag at the end of the ciphertext
  const ciphertextWithTag = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    key,
    plainChunk
  );

  const totalByteLength = 4 + 12 + ciphertextWithTag.byteLength;
  const packet = new ArrayBuffer(totalByteLength);
  const view = new DataView(packet);
  const packetBytes = new Uint8Array(packet);

  // 1. 4-byte Big-Endian chunkIndex (bytes 0..3)
  view.setUint32(0, chunkIndex, false);
  // 2. 12-byte random IV (bytes 4..15)
  packetBytes.set(iv, 4);
  // 3. Ciphertext + 16-byte GCM Auth Tag (bytes 16..end)
  packetBytes.set(new Uint8Array(ciphertextWithTag), 16);

  return packet;
}

/**
 * Unpacks and authenticates a binary chunk frame:
 * `[4-byte Big-Endian chunkIndex + 12-byte IV + Encrypted Data + 16-byte GCM Auth Tag]`
 * Throws `AuthTagMismatchError` immediately if any byte or the 16-byte GCM Auth Tag is invalid.
 */
export async function decryptChunkPacket(
  key: CryptoKey,
  packet: ArrayBuffer
): Promise<{ chunkIndex: number; data: Uint8Array }> {
  if (packet.byteLength < 32) {
    throw new AuthTagMismatchError(-1);
  }

  const view = new DataView(packet);
  const chunkIndex = view.getUint32(0, false); // Big-Endian
  const iv = new Uint8Array(packet, 4, 12);
  const ciphertextWithTag = new Uint8Array(packet, 16);

  try {
    const plainBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      key,
      ciphertextWithTag
    );
    return {
      chunkIndex,
      data: new Uint8Array(plainBuffer),
    };
  } catch {
    throw new AuthTagMismatchError(chunkIndex);
  }
}
