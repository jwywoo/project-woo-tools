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
    <div className="bg-white border-3 border-black p-5 rounded-2xl card-3d">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-black">
          Upload Files
        </h2>
        {currentFileCount > 0 && (
          <span className="text-sm font-medium text-white bg-mint px-3 py-1 rounded-full">
            {currentFileCount} files
          </span>
        )}
      </div>
      <label
        htmlFor="file-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-3 border-dashed border-black/30 p-8 md:p-10 text-center hover:border-mint hover:bg-mint/10 rounded-xl transition-all cursor-pointer block bg-cream/50"
      >
        <div className="text-black">
          <div className="text-4xl mb-3 text-mint font-bold">+</div>
          <p className="text-lg font-bold">Click or drop files here</p>
          <p className="text-sm text-black/60 mt-2">Up to {MAX_FILES} files • 2GB each</p>
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
