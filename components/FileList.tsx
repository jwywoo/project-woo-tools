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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
    if (draggedIndex === index || dragOverIndex === index) return;
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

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the draggable area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const itemClass = variant === 'renamed'
    ? 'bg-white dark:bg-white p-2 rounded text-gray-900 dark:text-gray-900 border border-gray-300'
    : 'bg-white dark:bg-white p-2 rounded text-gray-900 dark:text-gray-900 border border-gray-200';

  const canDrag = variant === 'original' && !!onReorder;

  return (
    <>
      <div className="bg-gray-200 dark:bg-gray-200 rounded-lg shadow-lg p-6 flex flex-col h-full border-4 border-orange dark:border-orange">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-semibold text-orange dark:text-orange">
            {title}
          </h2>
          {variant === 'original' && files.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-lg transition-colors"
              title="Expand view"
            >
              <svg className="w-5 h-5 text-orange dark:text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {files.length === 0 ? (
          <div className="bg-white dark:bg-white rounded-lg p-3 flex items-center border border-gray-200">
            <span className="text-gray-600 dark:text-gray-600 text-sm">{emptyMessage}</span>
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
                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-orange dark:bg-orange z-10">
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-orange dark:bg-orange rounded-full"></div>
                      <div className="absolute -right-1 -top-1 w-2 h-2 bg-orange dark:bg-orange rounded-full"></div>
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
                        className="w-10 h-10 object-cover rounded border border-gray-300 dark:border-gray-300"
                      />
                    )}
                  </div>
                  {showBottomIndicator && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange z-10">
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-orange rounded-full"></div>
                      <div className="absolute -right-1 -top-1 w-2 h-2 bg-orange rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-gray-200 dark:bg-gray-200 rounded-lg shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col border-4 border-orange dark:border-orange" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-200">
              <h3 className="text-3xl font-semibold text-orange dark:text-orange">{title}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-orange dark:text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Card Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {files.map((file, index) => {
                  const isDraggingCard = draggedIndex === index;
                  const isDragOverCard = dragOverIndex === index && draggedIndex !== index;
                  const showLeftIndicator = isDragOverCard && draggedIndex !== null && draggedIndex > index;
                  const showRightIndicator = isDragOverCard && draggedIndex !== null && draggedIndex < index;

                  return (
                    <div key={index} className="relative">
                      {showLeftIndicator && (
                        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-orange z-10 rounded-full">
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange rounded-full"></div>
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange rounded-full"></div>
                        </div>
                      )}
                      <div
                        draggable={!!onReorder}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragLeave={handleDragLeave}
                        className={`bg-white dark:bg-white rounded-lg p-4 flex flex-col items-center gap-3 transition-all border border-gray-200 ${
                          onReorder ? 'cursor-move' : ''
                        } ${isDraggingCard ? 'opacity-50 scale-95' : 'hover:shadow-lg'}`}
                      >
                        {previewUrls[index] ? (
                          <img
                            src={previewUrls[index]!}
                            alt={file}
                            className="w-full h-32 object-cover rounded border border-gray-300 dark:border-gray-600 pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 dark:bg-gray-200 rounded flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <p className="text-sm text-center text-gray-900 dark:text-gray-900 font-mono break-all w-full">{file}</p>
                      </div>
                      {showRightIndicator && (
                        <div className="absolute -right-2 top-0 bottom-0 w-1 bg-orange z-10 rounded-full">
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange rounded-full"></div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
