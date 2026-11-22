/**
 * Direct-to-Disk Streaming Writer (`FileSystemWritableFileStream`) with automatic
 * in-memory RAM `Blob` fallback for browsers without the File System Access API (Firefox/Safari).
 */

import { SITE_CONFIG } from './site';

export type WriteStorageMode = 'disk' | 'ram';

/**
 * Sanitizes an untrusted filename received from a peer:
 * - Strips path prefixes (/ and \)
 * - Strips ASCII control chars and Unicode BiDi/RLO spoofing codepoints
 * - Replaces Windows-forbidden characters and strips leading dots
 * - Neutralizes Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 * - Caps length at 180 chars while preserving file extension
 */
export function sanitizeFileName(rawName: string): string {
  if (typeof rawName !== 'string') return 'download.bin';

  // Extract basename across POSIX and Windows separators
  let base = rawName.split(/[/\\]/).pop() ?? '';

  // Remove ASCII control characters and Unicode BiDi override characters (e.g. U+202E RLO)
  base = base
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/^\.+/, '')
    .trim();

  if (!base) {
    return 'download.bin';
  }

  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(base)) {
    base = `file_${base}`;
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

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

interface FileSystemFileHandleLike {
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStreamLike>;
}

interface FileSystemWritableFileStreamLike {
  write(data: Uint8Array | ArrayBuffer | Blob | { type: 'write'; position?: number; data: Uint8Array }): Promise<void>;
  seek(position: number): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

export class StreamFileWriter {
  public readonly mode: WriteStorageMode;
  public readonly fileName: string;
  public readonly mimeType: string;

  private writableStream: FileSystemWritableFileStreamLike | null = null;
  private ramChunks: Uint8Array[] = [];
  private bytesWritten = 0;
  private closed = false;

  private constructor(
    mode: WriteStorageMode,
    fileName: string,
    writableStream: FileSystemWritableFileStreamLike | null
  ) {
    this.mode = mode;
    this.fileName = sanitizeFileName(fileName);
    // Force neutral binary MIME type so Same-Origin Blob XSS via text/html or image/svg+xml is impossible
    this.mimeType = 'application/octet-stream';
    this.writableStream = writableStream;
  }

  /**
   * Opens a direct-to-disk writable stream via `window.showSaveFilePicker` when supported
   * and requested; otherwise initializes a RAM Blob fallback writer.
   */
  public static async create(
    fileName: string,
    _mimeType = 'application/octet-stream',
    preferDisk = true
  ): Promise<StreamFileWriter> {
    const safeName = sanitizeFileName(fileName);

    if (preferDisk && isFileSystemAccessSupported()) {
      const showPicker = (
        window as unknown as {
          showSaveFilePicker: (opts?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;
        }
      ).showSaveFilePicker;

      const handle = await showPicker({
        suggestedName: safeName,
      });

      const writable = await handle.createWritable({ keepExistingData: false });
      return new StreamFileWriter('disk', safeName, writable);
    }

    return new StreamFileWriter('ram', safeName, null);
  }

  /**
   * Writes a decrypted 64 KB chunk directly to disk (or appends to RAM fallback array).
   * Enforces RAM cap (`SITE_CONFIG.maxRamFileBytes`) to prevent browser OOM DoS.
   */
  public async writeChunk(chunkData: Uint8Array): Promise<void> {
    if (this.closed) {
      throw new Error('Cannot write to a closed StreamFileWriter.');
    }

    if (this.mode === 'disk' && this.writableStream) {
      await this.writableStream.write(chunkData);
    } else {
      if (this.bytesWritten + chunkData.byteLength > SITE_CONFIG.maxRamFileBytes) {
        throw new Error('RAM_LIMIT_EXCEEDED');
      }
      // Copy into an isolated Uint8Array for RAM Blob assembly
      const copy = new Uint8Array(chunkData.byteLength);
      copy.set(chunkData);
      this.ramChunks.push(copy);
    }

    this.bytesWritten += chunkData.byteLength;
  }

  public getBytesWritten(): number {
    return this.bytesWritten;
  }

  /**
   * Finalizes the stream.
   * - In `disk` mode: flushes and closes the `FileSystemWritableFileStream`.
   * - In `ram` mode: constructs a `Blob`, triggers browser download, and returns an object URL.
   */
  public async finalize(): Promise<string | null> {
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
    this.triggerBrowserDownload(url, this.fileName);
    return url;
  }

  /**
   * Aborts the file stream immediately (e.g. on AES-GCM Auth Tag mismatch or user cancel).
   */
  public async abort(): Promise<void> {
    if (this.closed) return;
    this.closed = true;

    if (this.mode === 'disk' && this.writableStream) {
      try {
        await this.writableStream.abort();
      } catch {
        // ignore abort errors
      }
      this.writableStream = null;
    }
    this.ramChunks = [];
  }

  public triggerBrowserDownload(url: string, fileName: string): void {
    if (typeof url !== 'string' || !url.startsWith('blob:')) {
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFileName(fileName);
    a.rel = 'noopener noreferrer';
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 250);
  }
}
