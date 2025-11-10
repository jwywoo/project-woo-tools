import { RenamedFile } from './types';

export function renameFiles(files: File[], pattern: string): RenamedFile[] {
  if (!pattern) {
    return files.map(file => ({
      original: file.name,
      renamed: file.name,
    }));
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return files.map((file, index) => {
    const nameParts = file.name.split('.');
    const extension = nameParts.length > 1 ? nameParts.pop() : '';
    const nameWithoutExt = nameParts.join('.');

    let renamed = pattern;

    // Replace {name} with original filename (without extension)
    renamed = renamed.replace(/\{name\}/g, nameWithoutExt);

    // Replace {ext} with file extension
    renamed = renamed.replace(/\{ext\}/g, extension || '');

    // Replace {index} with file number (1-based)
    renamed = renamed.replace(/\{index\}/g, String(index + 1));

    // Replace {index:N} with padded file number (e.g., {index:3} -> 001, 002, 003)
    renamed = renamed.replace(/\{index:(\d+)\}/g, (_, digits) => {
      return String(index + 1).padStart(parseInt(digits), '0');
    });

    // Replace {date} with current date
    renamed = renamed.replace(/\{date\}/g, today);

    return {
      original: file.name,
      renamed,
    };
  });
}

export async function downloadRenamedFiles(files: File[], renamedFiles: RenamedFile[]) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const newName = renamedFiles[i]?.renamed || file.name;

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Small delay between downloads to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
