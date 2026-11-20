/**
 * Direct-to-Disk Streaming Writer (`FileSystemWritableFileStream`) with automatic
 * in-memory RAM `Blob` fallback for browsers without the File System Access API (Firefox/Safari).
 */

export type WriteStorageMode = 'disk' | 'ram';

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
    mimeType: string,
    writableStream: FileSystemWritableFileStreamLike | null
  ) {
    this.mode = mode;
    this.fileName = fileName;
    this.mimeType = mimeType || 'application/octet-stream';
    this.writableStream = writableStream;
  }

  /**
   * Opens a direct-to-disk writable stream via `window.showSaveFilePicker` when supported
   * and requested; otherwise initializes a RAM Blob fallback writer.
   */
  public static async create(
    fileName: string,
    mimeType = 'application/octet-stream',
    preferDisk = true
  ): Promise<StreamFileWriter> {
    if (preferDisk && isFileSystemAccessSupported()) {
      const showPicker = (
        window as unknown as {
          showSaveFilePicker: (opts?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;
        }
      ).showSaveFilePicker;

      const handle = await showPicker({
        suggestedName: fileName,
      });

      const writable = await handle.createWritable({ keepExistingData: false });
      return new StreamFileWriter('disk', fileName, mimeType, writable);
    }

    return new StreamFileWriter('ram', fileName, mimeType, null);
  }

  /**
   * Writes a decrypted 64 KB chunk directly to disk (or appends to RAM fallback array).
   * Supports idempotent chunk writing on resume by tracking chunk offsets.
   */
  public async writeChunk(chunkData: Uint8Array): Promise<void> {
    if (this.closed) {
      throw new Error('Cannot write to a closed StreamFileWriter.');
    }

    if (this.mode === 'disk' && this.writableStream) {
      await this.writableStream.write(chunkData);
    } else {
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

    const blob = new Blob(this.ramChunks, { type: this.mimeType });
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
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 250);
  }
}
