import { Zip, ZipPassThrough } from 'fflate';
import { SITE_CONFIG } from './site';

export interface RelativeFileEntry {
  file: File;
  /** Relative path inside the transfer or folder (e.g. "project/src/index.ts") */
  relativePath: string;
}

/**
 * Sanitizes an archive entry path to prevent Zip Slip (path traversal),
 * drive-letter injection, control chars, and Unicode BiDi filename spoofing.
 */
export function sanitizeArchivePath(rawPath: string): string {
  if (typeof rawPath !== 'string') return 'file.bin';

  let cleaned = rawPath
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

// Minimal WebKit FileSystemEntry typings for recursive folder drag-and-drop
interface WebKitFileEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file?: (success: (file: File) => void, error?: (err: DOMException) => void) => void;
  createReader?: () => WebKitDirectoryReader;
}

interface WebKitDirectoryReader {
  readEntries: (
    success: (entries: WebKitFileEntry[]) => void,
    error?: (err: DOMException) => void
  ) => void;
}

/**
 * Recursively scans dragged DataTransferItemList using `webkitGetAsEntry()`
 * to collect all nested files along with their relative directory structure.
 */
export async function extractDroppedEntries(
  dataTransfer: DataTransfer
): Promise<{ entries: RelativeFileEntry[]; hasDirectory: boolean; rootFolderName: string | null }> {
  const results: RelativeFileEntry[] = [];
  let hasDirectory = false;
  let rootFolderName: string | null = null;

  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const webkitEntries: WebKitFileEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = (
          item as unknown as { webkitGetAsEntry?: () => WebKitFileEntry | null }
        ).webkitGetAsEntry?.();
        if (entry) {
          webkitEntries.push(entry);
          if (entry.isDirectory) {
            hasDirectory = true;
            if (!rootFolderName) {
              rootFolderName = entry.name;
            }
          }
        }
      }
    }

    if (webkitEntries.length > 0) {
      for (const entry of webkitEntries) {
        if (results.length >= SITE_CONFIG.maxArchiveEntries) break;
        await traverseEntry(entry, '', results, 0);
      }
      return { entries: results, hasDirectory, rootFolderName };
    }
  }

  // Standard FileList fallback
  const files = dataTransfer.files;
  for (let i = 0; i < files.length; i++) {
    if (results.length >= SITE_CONFIG.maxArchiveEntries) break;
    const f = files[i];
    const rel = sanitizeArchivePath(f.webkitRelativePath || f.name);
    if (f.webkitRelativePath && f.webkitRelativePath.includes('/')) {
      hasDirectory = true;
      if (!rootFolderName) {
        rootFolderName = sanitizeArchivePath(f.webkitRelativePath.split('/')[0]);
      }
    }
    results.push({ file: f, relativePath: rel });
  }

  return { entries: results, hasDirectory, rootFolderName };
}

async function traverseEntry(
  entry: WebKitFileEntry,
  parentPath: string,
  results: RelativeFileEntry[],
  depth: number
): Promise<void> {
  if (depth > SITE_CONFIG.maxArchiveDepth || results.length >= SITE_CONFIG.maxArchiveEntries) {
    return;
  }

  const currentPath = sanitizeArchivePath(
    parentPath ? `${parentPath}/${entry.name}` : entry.name
  );

  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((resolve, reject) => {
      entry.file!((f) => resolve(f), (err) => reject(err));
    });
    results.push({
      file,
      relativePath: currentPath,
    });
  } else if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    const childEntries = await readAllDirectoryEntries(reader);
    for (const child of childEntries) {
      if (results.length >= SITE_CONFIG.maxArchiveEntries) break;
      await traverseEntry(child, currentPath, results, depth + 1);
    }
  }
}

async function readAllDirectoryEntries(
  reader: WebKitDirectoryReader
): Promise<WebKitFileEntry[]> {
  const allEntries: WebKitFileEntry[] = [];
  while (true) {
    const batch = await new Promise<WebKitFileEntry[]>((resolve, reject) => {
      reader.readEntries(
        (entries) => resolve(entries),
        (err) => reject(err)
      );
    });
    if (batch.length === 0) break;
    allEntries.push(...batch);
  }
  return allEntries;
}

/**
 * Converts a list of `File` objects (e.g. from `<input type="file" webkitdirectory>`)
 * into `RelativeFileEntry[]`.
 */
export function filesToRelativeEntries(fileList: FileList | File[]): {
  entries: RelativeFileEntry[];
  hasDirectory: boolean;
  rootFolderName: string | null;
} {
  const entries: RelativeFileEntry[] = [];
  let hasDirectory = false;
  let rootFolderName: string | null = null;

  const arr = Array.from(fileList);
  for (const file of arr) {
    if (entries.length >= SITE_CONFIG.maxArchiveEntries) break;
    const rawRel = file.webkitRelativePath && file.webkitRelativePath.length > 0
      ? file.webkitRelativePath
      : file.name;
    const rel = sanitizeArchivePath(rawRel);
    if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
      hasDirectory = true;
      if (!rootFolderName) {
        rootFolderName = sanitizeArchivePath(file.webkitRelativePath.split('/')[0]);
      }
    }
    entries.push({ file, relativePath: rel });
  }

  return { entries, hasDirectory, rootFolderName };
}

/**
 * Streams a list of `RelativeFileEntry` items through `fflate`'s streaming `Zip` class,
 * slicing the resulting ZIP stream into exact 64 KB (`SITE_CONFIG.chunkSize`) chunks
 * and invoking `onChunk(chunkIndex, chunkBytes)` with backpressure pacing.
 *
 * Uses `ZipPassThrough` (store / fast streaming mode) so multi-GB folders stream at
 * wire speed without holding the archive in memory.
 */
export async function streamEntriesAsZipChunks(
  entries: RelativeFileEntry[],
  onChunk: (chunkIndex: number, chunkData: Uint8Array) => Promise<void>,
  shouldAbort: () => boolean
): Promise<{ totalChunks: number; totalBytesEmitted: number }> {
  const chunkSize = SITE_CONFIG.chunkSize;
  let chunkIndex = 0;
  let totalBytesEmitted = 0;

  // Rolling buffer to accumulate exact 64 KB slices from fflate output
  let pendingBuffer = new Uint8Array(chunkSize);
  let pendingOffset = 0;

  // Queue of promises for sequential async chunk encryption & DataChannel dispatch
  let pendingDispatchChain = Promise.resolve();
  let streamError: unknown = null;

  const enqueueChunk = (slice: Uint8Array) => {
    const currentIndex = chunkIndex++;
    totalBytesEmitted += slice.byteLength;
    pendingDispatchChain = pendingDispatchChain.then(async () => {
      if (shouldAbort()) return;
      await onChunk(currentIndex, slice);
    });
  };

  const zip = new Zip((err, data, _final) => {
    if (err) {
      streamError = err;
      return;
    }

    let offset = 0;
    while (offset < data.byteLength) {
      const spaceLeft = chunkSize - pendingOffset;
      const bytesToCopy = Math.min(spaceLeft, data.byteLength - offset);
      pendingBuffer.set(data.subarray(offset, offset + bytesToCopy), pendingOffset);
      pendingOffset += bytesToCopy;
      offset += bytesToCopy;

      if (pendingOffset === chunkSize) {
        const fullChunk = pendingBuffer;
        pendingBuffer = new Uint8Array(chunkSize);
        pendingOffset = 0;
        enqueueChunk(fullChunk);
      }
    }
  });

  // Stream each file into the Zip instance in 64 KB slices, awaiting backpressure at each step
  for (const item of entries) {
    if (shouldAbort()) break;
    if (streamError) throw streamError;

    const cleanPath = sanitizeArchivePath(item.relativePath);
    const zipItem = new ZipPassThrough(cleanPath);
    if (item.file.lastModified) {
      zipItem.mtime = new Date(item.file.lastModified);
    }
    zip.add(zipItem);

    const fileSize = item.file.size;
    let fileOffset = 0;

    if (fileSize === 0) {
      zipItem.push(new Uint8Array(0), true);
      await pendingDispatchChain;
      continue;
    }

    while (fileOffset < fileSize) {
      if (shouldAbort()) break;
      if (streamError) throw streamError;

      const nextEnd = Math.min(fileOffset + chunkSize, fileSize);
      const blobSlice = item.file.slice(fileOffset, nextEnd);
      const buf = await blobSlice.arrayBuffer();
      const isLastSlice = nextEnd >= fileSize;

      zipItem.push(new Uint8Array(buf), isLastSlice);
      fileOffset = nextEnd;

      // Wait for any full 64 KB encrypted chunks produced by this push to respect WebRTC backpressure
      await pendingDispatchChain;
    }
  }

  if (!shouldAbort() && !streamError) {
    zip.end();
    if (pendingOffset > 0) {
      enqueueChunk(pendingBuffer.subarray(0, pendingOffset));
      pendingOffset = 0;
    }
    await pendingDispatchChain;
  }

  if (streamError) {
    throw streamError;
  }

  return {
    totalChunks: chunkIndex,
    totalBytesEmitted,
  };
}
