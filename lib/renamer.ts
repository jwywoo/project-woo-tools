import { RenamedFile } from './types';
import JSZip from 'jszip';

export interface RenameOptions {
  startNumber: string;
  gap: number;
  keepExtension: boolean;
}

export function renameFiles(
  files: File[],
  pattern: string,
  options: RenameOptions = { startNumber: '1', gap: 1, keepExtension: true }
): RenamedFile[] {
  if (!pattern) {
    return files.map(file => ({
      original: file.name,
      renamed: file.name,
    }));
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Parse start number and determine padding
  const startNum = parseInt(options.startNumber) || 0;
  const padding = options.startNumber.length;
  const gap = options.gap || 1;

  return files.map((file, index) => {
    const nameParts = file.name.split('.');
    const extension = nameParts.length > 1 ? nameParts.pop() : '';
    const nameWithoutExt = nameParts.join('.');

    let renamed = pattern;

    // Calculate current index number
    const currentNumber = startNum + (index * gap);

    // Replace {name} with original filename (without extension)
    renamed = renamed.replace(/\{name\}/g, nameWithoutExt);

    // Replace {index} with file number (custom start + gap)
    renamed = renamed.replace(/\{index\}/g, String(currentNumber).padStart(padding, '0'));

    // Replace {index:N} with padded file number (e.g., {index:3} -> 001, 002, 003)
    renamed = renamed.replace(/\{index:(\d+)\}/g, (_, digits) => {
      return String(currentNumber).padStart(parseInt(digits), '0');
    });

    // Replace {date} with current date
    renamed = renamed.replace(/\{date\}/g, today);

    // Add extension if keepExtension is true
    if (options.keepExtension && extension) {
      renamed = `${renamed}.${extension}`;
    }

    return {
      original: file.name,
      renamed,
    };
  });
}

// Sanitize filename for cross-platform compatibility
function sanitizeFilename(filename: string): string {
  // Remove or replace characters that are invalid on Windows: < > : " / \ | ? *
  // Also remove control characters (0-31)
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '_')  // Don't allow filenames starting with dots on Windows
    .trim();
}

// Helper function to create a single ZIP from a batch of files
async function createZipBatch(
  files: File[],
  renamedFiles: RenamedFile[],
  batchNumber: number,
  totalBatches: number,
  onProgress?: (message: string, percent: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const zip = new JSZip();

  console.log(`Creating batch ${batchNumber}/${totalBatches} with ${files.length} files...`);

  const batchLabel = totalBatches > 1 ? `Batch ${batchNumber}/${totalBatches}: ` : '';

  // Add files to zip - read each file as ArrayBuffer first to catch permission errors early
  for (let i = 0; i < files.length; i++) {
    // Check if operation was cancelled
    if (signal?.aborted) {
      throw new DOMException('Operation cancelled by user', 'AbortError');
    }

    const file = files[i];
    const newName = renamedFiles[i]?.renamed || file.name;
    const safeName = sanitizeFilename(newName);

    try {
      // Read file immediately to detect permission issues
      const arrayBuffer = await file.arrayBuffer();
      zip.file(safeName, arrayBuffer);

      // Report progress for file reading (0-50% of total progress)
      const readingPercent = ((i + 1) / files.length) * 50;
      onProgress?.(`${batchLabel}Reading files (${i + 1}/${files.length})`, readingPercent);

      if ((i + 1) % 10 === 0) {
        console.log(`  Read ${i + 1}/${files.length} files...`);
      }
    } catch (error) {
      console.error(`Failed to read file: ${file.name}`, error);
      throw new Error(`Cannot read file "${file.name}". The file may have been moved, deleted, or is no longer accessible.`);
    }
  }

  console.log(`All files read, generating ZIP...`);
  onProgress?.(`${batchLabel}Generating ZIP file...`, 50);

  // Generate ZIP with no compression for speed and reliability
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE', // No compression - fastest and most reliable
    streamFiles: false // Disable streaming since we already have arrayBuffers
  }, (metadata) => {
    // Report progress for ZIP generation (50-100% of total progress)
    const zipPercent = 50 + (metadata.percent / 2);
    onProgress?.(`${batchLabel}Generating ZIP (${metadata.percent.toFixed(0)}%)`, zipPercent);

    if (metadata.percent % 20 < 1) {
      console.log(`Batch ${batchNumber}: ${metadata.percent.toFixed(0)}%`);
    }
  });

  console.log(`Batch ${batchNumber} complete: ${(blob.size / (1024 * 1024)).toFixed(2)}MB`);
  onProgress?.(`${batchLabel}Complete!`, 100);
  return blob;
}

// Helper function to download a blob
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Cleanup after download
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function downloadRenamedFiles(
  files: File[],
  renamedFiles: RenamedFile[],
  onProgress?: (message: string, percent: number) => void,
  signal?: AbortSignal
) {
  try {
    // Check if already cancelled
    if (signal?.aborted) {
      throw new DOMException('Operation cancelled by user', 'AbortError');
    }

    onProgress?.('Preparing download...', 0);

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);

    console.log(`Starting download: ${files.length} files, ${totalSizeGB}GB total`);

    // Log warning for very large batches
    const RECOMMENDED_MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB recommended max
    if (totalSize > RECOMMENDED_MAX_SIZE) {
      console.warn(`Large file batch: ${totalSizeGB}GB. This may take a long time and consume significant memory.`);
    }

    // Determine batch strategy based on total size
    const BATCH_THRESHOLD = 2 * 1024 * 1024 * 1024; // 2GB threshold for batching
    const shouldBatch = totalSize > BATCH_THRESHOLD;

    if (!shouldBatch) {
      // Process as single ZIP for files under 2GB
      console.log('Processing as single ZIP (under 2GB)');
      const blob = await createZipBatch(files, renamedFiles, 1, 1, onProgress, signal);
      downloadBlob(blob, 'renamed-files.zip');
      console.log('Download complete!');
      onProgress?.('Download complete!', 100);
      return;
    }

    // For files over 2GB, split into batches
    console.log('Processing as multiple batches (over 2GB)');
    const MAX_BATCH_SIZE = 1 * 1024 * 1024 * 1024; // 1GB per batch
    const MAX_FILES_PER_BATCH = 500; // Max files per batch

    let batches: { files: File[], renamed: RenamedFile[] }[] = [];
    let currentBatch: { files: File[], renamed: RenamedFile[] } = { files: [], renamed: [] };
    let currentBatchSize = 0;

    // Split files into batches
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const renamed = renamedFiles[i];

      // Check if we need to start a new batch
      if (
        currentBatch.files.length >= MAX_FILES_PER_BATCH ||
        (currentBatchSize + file.size > MAX_BATCH_SIZE && currentBatch.files.length > 0)
      ) {
        batches.push(currentBatch);
        currentBatch = { files: [], renamed: [] };
        currentBatchSize = 0;
      }

      currentBatch.files.push(file);
      currentBatch.renamed.push(renamed);
      currentBatchSize += file.size;
    }

    // Add the last batch if it has files
    if (currentBatch.files.length > 0) {
      batches.push(currentBatch);
    }

    console.log(`Split into ${batches.length} batch(es)`);

    // If single batch, use simple filename
    if (batches.length === 1) {
      const blob = await createZipBatch(batches[0].files, batches[0].renamed, 1, 1, onProgress, signal);
      downloadBlob(blob, 'renamed-files.zip');
      console.log('Download complete!');
      onProgress?.('Download complete!', 100);
    } else {
      // Multiple batches - download them one by one with delays
      for (let i = 0; i < batches.length; i++) {
        // Check if operation was cancelled
        if (signal?.aborted) {
          throw new DOMException('Operation cancelled by user', 'AbortError');
        }

        const batch = batches[i];
        const blob = await createZipBatch(batch.files, batch.renamed, i + 1, batches.length, onProgress, signal);

        // Download with a delay between batches
        const filename = `renamed-files-part${i + 1}-of-${batches.length}.zip`;
        downloadBlob(blob, filename);

        console.log(`Downloaded: ${filename}`);

        // Wait 2 seconds between downloads to avoid browser blocking
        if (i < batches.length - 1) {
          onProgress?.(`Preparing next batch (${i + 2}/${batches.length})...`, 0);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('All downloads complete!');
      onProgress?.('All downloads complete!', 100);
    }

  } catch (error) {
    console.error('Download error:', error);

    // Log specific error messages to console
    if (error instanceof Error) {
      if (error.message.includes('memory') || error.message.includes('allocation') || error.message.includes('out of memory')) {
        console.error('Out of memory error. Try closing other tabs and reload the page, then try again with fewer files.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.error('Network error during ZIP creation. Please check your connection and try again.');
      } else if (error.name !== 'AbortError') {
        console.error(`Failed to create ZIP file: ${error.message}`);
      }
    }

    throw error;
  }
}
