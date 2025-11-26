'use client';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  currentFileCount?: number;
}

const MAX_FILES = 5000;
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB per file
const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024; // 10GB total

export default function FileUpload({ onFilesChange, currentFileCount = 0 }: FileUploadProps) {
  const validateFiles = (files: File[]): { valid: File[]; error?: string } => {
    // Check file count
    if (currentFileCount + files.length > MAX_FILES) {
      return {
        valid: [],
        error: `Maximum ${MAX_FILES} files allowed. You can only add ${MAX_FILES - currentFileCount} more files.`
      };
    }

    // Check individual file sizes and total size
    let totalSize = 0;
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: [],
          error: `File "${file.name}" is too large. Maximum file size is 2GB.`
        };
      }
      totalSize += file.size;
      validFiles.push(file);
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        valid: [],
        error: `Total file size exceeds 10GB. Please select fewer or smaller files.`
      };
    }

    return { valid: validFiles };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const { valid, error } = validateFiles(files);

    if (error) {
      alert(error);
      e.target.value = ''; // Reset input
      return;
    }

    onFilesChange(valid);
    e.target.value = ''; // Reset input for next selection
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const { valid, error } = validateFiles(files);

    if (error) {
      alert(error);
      return;
    }

    onFilesChange(valid);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  return (
    <div className="bg-gray-200 dark:bg-gray-200 rounded-lg shadow-lg p-6 border-4 border-orange dark:border-orange">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-semibold text-orange dark:text-orange">
          Upload Files
        </h2>
        {currentFileCount > 0 && (
          <span className="text-sm text-gray-700 dark:text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-300">
            {currentFileCount} / {MAX_FILES} files
          </span>
        )}
      </div>
      <label
        htmlFor="file-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-3 border-dashed border-orange dark:border-orange rounded-lg p-12 text-center hover:border-orange/80 dark:hover:border-orange/80 transition-colors cursor-pointer block bg-white"
      >
        <div className="text-gray-900 dark:text-gray-900">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium">Click to upload or drag and drop</p>
          <p className="text-sm mt-2">Support for multiple files</p>
        </div>
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
}
