'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import PatternInput from '@/components/PatternInput';
import FileList from '@/components/FileList';
import { renameFiles, downloadRenamedFiles } from '@/lib/renamer';
import { RenamedFile } from '@/lib/types';

export default function MainPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pattern, setPattern] = useState<string>('');
  const [startNumber, setStartNumber] = useState<string>('1');
  const [gap, setGap] = useState<number>(1);
  const [renamedFiles, setRenamedFiles] = useState<RenamedFile[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{ show: boolean; message: string; percent: number }>({
    show: false,
    message: '',
    percent: 0
  });
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleFilesChange = (newFiles: File[]) => {
    // Add new files to existing files instead of replacing
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setShowPreview(false);
    setRenamedFiles([]);
  };

  const handleReorder = (newOrder: File[]) => {
    setFiles(newOrder);
    setShowPreview(false);
    setRenamedFiles([]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setShowPreview(false);
    setRenamedFiles([]);
  };

  const handleResetFiles = () => {
    setFiles([]);
    setShowPreview(false);
    setRenamedFiles([]);
  };

  const handlePatternChange = (newPattern: string) => {
    setPattern(newPattern);
    setShowPreview(false);
  };

  const handleStartNumberChange = (newStartNumber: string) => {
    setStartNumber(newStartNumber);
    setShowPreview(false);
  };

  const handleGapChange = (newGap: number) => {
    setGap(newGap);
    setShowPreview(false);
  };

  const handlePreview = () => {
    if (files.length > 0) {
      const renamed = renameFiles(files, pattern, { startNumber, gap, keepExtension: true });
      setRenamedFiles(renamed);
      setShowPreview(true);
    }
  };

  const handleConfirm = async () => {
    if (files.length > 0 && renamedFiles.length > 0) {
      const controller = new AbortController();
      setAbortController(controller);
      setDownloadProgress({ show: true, message: 'Starting...', percent: 0 });
      try {
        await downloadRenamedFiles(files, renamedFiles, (message, percent) => {
          setDownloadProgress({ show: true, message, percent });
        }, controller.signal);
        // Hide progress after a short delay
        setTimeout(() => {
          setDownloadProgress({ show: false, message: '', percent: 0 });
          setAbortController(null);
        }, 2000);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Download cancelled by user');
        }
        setDownloadProgress({ show: false, message: '', percent: 0 });
        setAbortController(null);
      }
    }
  };

  const handleCancelDownload = () => {
    if (abortController) {
      abortController.abort();
      setDownloadProgress({ show: false, message: '', percent: 0 });
      setAbortController(null);
    }
  };

  const originalFileNames = files.map(f => f.name);
  const renamedFileNames = renamedFiles.map(f => f.renamed);

  return (
    <div className="min-h-screen bg-white dark:bg-navy p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            WooTool: File Rename
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload files and rename them with custom patterns
          </p>
        </div>

        {/* Progress Bar */}
        {downloadProgress.show && (
          <div className="mb-6 bg-gray-200 dark:bg-gray-200 rounded-lg shadow-lg p-6 border-4 border-orange dark:border-orange">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 mr-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {downloadProgress.message}
                  </span>
                  <span className="text-sm font-medium text-orange dark:text-orange">
                    {downloadProgress.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-white rounded-full h-4 border border-gray-300">
                  <div
                    className="bg-orange h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress.percent}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={handleCancelDownload}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Upload and Pattern Settings */}
          <div className="space-y-6">
            <FileUpload onFilesChange={handleFilesChange} currentFileCount={files.length} />
            <PatternInput
              pattern={pattern}
              startNumber={startNumber}
              gap={gap}
              onPatternChange={handlePatternChange}
              onStartNumberChange={handleStartNumberChange}
              onGapChange={handleGapChange}
              onPreview={handlePreview}
              onConfirm={handleConfirm}
              disabled={files.length === 0}
            />
          </div>

          {/* Right Column - Before and After Preview */}
          <div className="flex flex-col gap-6">
            <div className="h-[430px]">
              <FileList
                title="Original Files"
                files={originalFileNames}
                fileObjects={files}
                emptyMessage="No files uploaded yet"
                variant="original"
                onReorder={handleReorder}
                onRemove={handleRemoveFile}
                onReset={handleResetFiles}
              />
            </div>
            <div className="h-[430px]">
              <FileList
                title="Preview (Renamed)"
                files={showPreview ? renamedFileNames : []}
                fileObjects={showPreview ? files : []}
                emptyMessage="Click Preview button to see renamed files"
                variant="renamed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
