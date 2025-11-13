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

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
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
      const renamed = renameFiles(files, pattern, { startNumber, gap });
      setRenamedFiles(renamed);
      setShowPreview(true);
    }
  };

  const handleConfirm = async () => {
    if (files.length > 0 && renamedFiles.length > 0) {
      await downloadRenamedFiles(files, renamedFiles);
    }
  };

  const originalFileNames = files.map(f => f.name);
  const renamedFileNames = renamedFiles.map(f => f.renamed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            File Renamer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload files and rename them with custom patterns
          </p>
        </div>

        {/* Top Section - Upload and Pattern Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUpload onFilesChange={handleFilesChange} />
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

        {/* Bottom Section - Before and After Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileList
            title="Original Files"
            files={originalFileNames}
            emptyMessage="No files uploaded yet"
            variant="original"
          />
          <FileList
            title="Preview (Renamed)"
            files={showPreview ? renamedFileNames : []}
            emptyMessage="Click Preview button to see renamed files"
            variant="renamed"
          />
        </div>
      </div>
    </div>
  );
}
