'use client';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
}

export default function FileUpload({ onFilesChange }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesChange(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFilesChange(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  return (
    <div className="bg-gray-200 dark:bg-gray-200 rounded-lg shadow-lg p-6 border-4 border-orange dark:border-orange">
      <h2 className="text-3xl font-semibold text-orange dark:text-orange mb-4">
        Upload Files
      </h2>
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
