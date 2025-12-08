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
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header - Cute 3D Style */}
        <div className="mb-8 border-3 border-black bg-white p-6 rounded-2xl card-3d">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black leading-none">
            File Renamer
          </h1>
          <div className="h-1.5 bg-gradient-to-r from-pink via-mint to-purple my-4 w-full rounded-full"></div>
          <p className="text-base md:text-lg text-black/70">
            Drag, drop, rename & download your files with ease
          </p>
        </div>

        {/* Progress Bar - Cute 3D Style */}
        {downloadProgress.show && (
          <div className="mb-6 bg-white border-3 border-black p-4 rounded-xl card-3d">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-black">
                    {downloadProgress.message}
                  </span>
                  <span className="text-lg font-bold text-pink">
                    {downloadProgress.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-cream h-4 rounded-full border-2 border-black overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-pink to-mint h-full rounded-full transition-all duration-100"
                    style={{ width: `${downloadProgress.percent}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={handleCancelDownload}
                className="px-5 py-2.5 bg-pink hover:bg-pink/80 text-white font-bold rounded-lg border-2 border-black btn-3d"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column - Upload and Pattern Settings */}
          <div className="space-y-5">
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
          <div className="flex flex-col gap-5">
            <div className="h-[430px]">
              <FileList
                title="Original Files"
                files={originalFileNames}
                fileObjects={files}
                emptyMessage="Drop some files here"
                variant="original"
                onReorder={handleReorder}
                onRemove={handleRemoveFile}
                onReset={handleResetFiles}
              />
            </div>
            <div className="h-[430px]">
              <FileList
                title="Renamed Preview"
                files={showPreview ? renamedFileNames : []}
                fileObjects={showPreview ? files : []}
                emptyMessage="Click Preview to see results"
                variant="renamed"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 text-center">
          <p className="text-sm text-black/50">
            Drag & drop to reorder files
          </p>
        </div>
      </div>
    </div>
  );
}
