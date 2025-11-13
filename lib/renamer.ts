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

export async function downloadRenamedFiles(files: File[], renamedFiles: RenamedFile[]) {
  const zip = new JSZip();

  // Add all renamed files to the zip
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const newName = renamedFiles[i]?.renamed || file.name;
    zip.file(newName, file);
  }

  // Generate the zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Download the zip file
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'renamed-files.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
