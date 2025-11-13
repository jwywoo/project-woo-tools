'use client';

import { useState, useEffect } from 'react';

interface FileListProps {
  title: string;
  files: string[];
  fileObjects?: File[];
  emptyMessage: string;
  variant?: 'original' | 'renamed';
  onReorder?: (newOrder: File[]) => void;
}

export default function FileList({ title, files, fileObjects, emptyMessage, variant = 'original', onReorder }: FileListProps) {
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (fileObjects && fileObjects.length > 0) {
      const urls = fileObjects.map(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isImage = ext && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext);

        if (isImage) {
          return URL.createObjectURL(file);
        }
        return null;
      });

      setPreviewUrls(urls);

      // Cleanup URLs when component unmounts
      return () => {
        urls.forEach(url => {
          if (url) URL.revokeObjectURL(url);
        });
      };
    } else {
      setPreviewUrls([]);
    }
  }, [fileObjects]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex && fileObjects && onReorder) {
      const newFiles = [...fileObjects];
      const [draggedFile] = newFiles.splice(draggedIndex, 1);
      newFiles.splice(dragOverIndex, 0, draggedFile);
      onReorder(newFiles);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const itemClass = variant === 'renamed'
    ? 'bg-green-100 dark:bg-green-900 p-2 rounded text-green-800 dark:text-green-200'
    : 'bg-gray-100 dark:bg-gray-700 p-2 rounded';

  const canDrag = variant === 'original' && !!onReorder;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="flex-1 overflow-y-auto min-h-0">
        {files.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center">
            <span className="text-gray-600 dark:text-gray-300 text-sm">{emptyMessage}</span>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {files.map((file, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;
              const showTopIndicator = isDragOver && draggedIndex !== null && draggedIndex > index;
              const showBottomIndicator = isDragOver && draggedIndex !== null && draggedIndex < index;

              return (
                <div key={index} className="relative">
                  {showTopIndicator && (
                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10">
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                  <div
                    draggable={canDrag}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                    className={`${itemClass} flex items-center gap-3 transition-all ${
                      canDrag ? 'cursor-move' : ''
                    } ${isDragging ? 'opacity-50 scale-95' : ''}`}
                  >
                    <span className="text-sm font-mono flex-1">{file}</span>
                    {previewUrls[index] && (
                      <img
                        src={previewUrls[index]!}
                        alt={file}
                        className="w-10 h-10 object-cover rounded border border-gray-300 dark:border-gray-600"
                      />
                    )}
                  </div>
                  {showBottomIndicator && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-10">
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
