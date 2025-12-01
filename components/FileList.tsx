'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface FileListProps {
  title: string;
  files: string[];
  fileObjects?: File[];
  emptyMessage: string;
  variant?: 'original' | 'renamed';
  onReorder?: (newOrder: File[]) => void;
  onRemove?: (index: number) => void;
  onReset?: () => void;
}

export default function FileList({ title, files, fileObjects, emptyMessage, variant = 'original', onReorder, onRemove, onReset }: FileListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scroller
  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  // Use ref to avoid re-creating the callback
  const previewUrlsRef = useRef<Map<number, string>>(new Map());

  // Lazy load preview URLs only when needed
  const getPreviewUrl = useCallback((index: number): string | null => {
    if (!fileObjects || !fileObjects[index]) return null;

    // Check if we already have a URL for this index
    const cached = previewUrlsRef.current.get(index);
    if (cached) return cached;

    const file = fileObjects[index];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ext && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext);

    if (isImage) {
      const url = URL.createObjectURL(file);
      previewUrlsRef.current.set(index, url);
      return url;
    }

    return null;
  }, [fileObjects]);

  // Reset preview URLs when files change
  useEffect(() => {
    // Revoke old URLs
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
  }, [fileObjects]);

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (dragOverFrameRef.current !== null) {
        cancelAnimationFrame(dragOverFrameRef.current);
      }
    };
  }, []);

  const handleSelect = (index: number, e: React.MouseEvent) => {
    if (!canDrag) return;

    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelected = new Set(selectedIndices);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
      setSelectedIndices(newSelected);
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click: toggle selection
      const newSelected = new Set(selectedIndices);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      setSelectedIndices(newSelected);
      setLastSelectedIndex(index);
    } else {
      // Regular click: select only this item
      setSelectedIndices(new Set([index]));
      setLastSelectedIndex(index);
    }
  };

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    // If dragging a selected item, drag all selected items
    if (selectedIndices.has(index)) {
      setDraggedIndex(index);
    } else {
      // If dragging a non-selected item, select only that item and drag it
      setSelectedIndices(new Set([index]));
      setDraggedIndex(index);
    }
  }, [selectedIndices]);

  // Use requestAnimationFrame for smoother drag over performance
  const dragOverFrameRef = useRef<number | null>(null);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index || dragOverIndex === index) return;

    // Use RAF to throttle updates and align with browser repaints
    if (dragOverFrameRef.current === null) {
      dragOverFrameRef.current = requestAnimationFrame(() => {
        setDragOverIndex(index);
        dragOverFrameRef.current = null;
      });
    }
  }, [draggedIndex, dragOverIndex]);

  const handleDragEnd = useCallback(() => {
    // Clear any pending RAF
    if (dragOverFrameRef.current !== null) {
      cancelAnimationFrame(dragOverFrameRef.current);
      dragOverFrameRef.current = null;
    }

    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex && fileObjects && onReorder) {
      const newFiles = [...fileObjects];

      // Get all selected indices in order
      const selected = Array.from(selectedIndices).sort((a, b) => a - b);

      if (selected.length > 1) {
        // Multi-select drag: move all selected items together
        const selectedFiles = selected.map(i => newFiles[i]);

        // Remove selected items (in reverse to maintain indices)
        selected.reverse().forEach(i => {
          newFiles.splice(i, 1);
        });

        // Calculate new insert position (accounting for removed items)
        let insertPos = dragOverIndex;
        selected.forEach(i => {
          if (i < dragOverIndex) insertPos--;
        });

        // Insert all selected files at the new position
        newFiles.splice(insertPos, 0, ...selectedFiles);

        onReorder(newFiles);

        // Update selection to new positions
        const newSelected = new Set<number>();
        for (let i = 0; i < selectedFiles.length; i++) {
          newSelected.add(insertPos + i);
        }
        setSelectedIndices(newSelected);
      } else {
        // Single item drag
        const [draggedFile] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(dragOverIndex, 0, draggedFile);
        onReorder(newFiles);
        setSelectedIndices(new Set([dragOverIndex]));
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, fileObjects, onReorder, selectedIndices]);

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
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold text-orange dark:text-orange">
              {title}
            </h2>
            {variant === 'original' && selectedIndices.size > 0 && (
              <span className="text-sm font-medium text-white bg-orange px-3 py-1 rounded-full">
                {selectedIndices.size} selected
              </span>
            )}
          </div>
          {variant === 'original' && files.length > 0 && (
            <div className="flex items-center gap-2">
              {onReset && (
                <button
                  onClick={onReset}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-100 rounded-lg transition-colors"
                  title="Clear all files"
                >
                  <svg className="w-5 h-5 text-red-600 dark:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-lg transition-colors"
                title="Expand view"
              >
                <svg className="w-5 h-5 text-orange dark:text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      <div
        ref={parentRef}
        className="flex-1 min-h-0 overflow-y-auto pr-2"
        style={{ height: '350px' }}
      >
        {files.length === 0 ? (
          <div className="bg-white dark:bg-white rounded-lg p-3 flex items-center border border-gray-200">
            <span className="text-gray-600 dark:text-gray-600 text-sm">{emptyMessage}</span>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const index = virtualRow.index;
              const file = files[index];
              const isDragging = selectedIndices.has(index) && draggedIndex !== null;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;
              const showTopIndicator = isDragOver && draggedIndex !== null && draggedIndex > index;
              const showBottomIndicator = isDragOver && draggedIndex !== null && draggedIndex < index;
              const isSelected = selectedIndices.has(index);
              const previewUrl = getPreviewUrl(index);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="relative h-full pb-2">
                    {showTopIndicator && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-orange dark:bg-orange z-10">
                        <div className="absolute -left-1 -top-1 w-2 h-2 bg-orange dark:bg-orange rounded-full"></div>
                        <div className="absolute -right-1 -top-1 w-2 h-2 bg-orange dark:bg-orange rounded-full"></div>
                      </div>
                    )}
                    <div
                      draggable={canDrag}
                      onClick={(e) => handleSelect(index, e)}
                      onDragStart={(e) => handleDragStart(index, e)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragLeave={handleDragLeave}
                      className={`${itemClass} flex items-center gap-3 transition-all h-full ${
                        canDrag ? 'cursor-move' : ''
                      } ${isDragging ? 'opacity-50 scale-95' : ''} ${
                        isSelected ? 'ring-2 ring-orange bg-orange/10' : ''
                      }`}
                    >
                      <span className="text-sm font-mono flex-1 truncate">{file}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt={file}
                            className="w-10 h-10 object-cover rounded border border-gray-300 dark:border-gray-300"
                          />
                        )}
                        {variant === 'original' && onRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(index);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-100 rounded transition-colors"
                            title="Remove file"
                          >
                            <svg className="w-4 h-4 text-red-600 dark:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {showBottomIndicator && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange z-10">
                        <div className="absolute -left-1 -top-1 w-2 h-2 bg-orange rounded-full"></div>
                        <div className="absolute -right-1 -top-1 w-2 h-2 bg-orange rounded-full"></div>
                      </div>
                    )}
                  </div>
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
                  const isDraggingCard = selectedIndices.has(index) && draggedIndex !== null;
                  const isDragOverCard = dragOverIndex === index && draggedIndex !== index;
                  const showLeftIndicator = isDragOverCard && draggedIndex !== null && draggedIndex > index;
                  const showRightIndicator = isDragOverCard && draggedIndex !== null && draggedIndex < index;
                  const isSelectedCard = selectedIndices.has(index);

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
                        onClick={(e) => handleSelect(index, e)}
                        onDragStart={(e) => handleDragStart(index, e)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragLeave={handleDragLeave}
                        className={`bg-white dark:bg-white rounded-lg p-4 flex flex-col items-center gap-3 transition-all border relative ${
                          onReorder ? 'cursor-move' : ''
                        } ${isDraggingCard ? 'opacity-50 scale-95' : 'hover:shadow-lg'} ${
                          isSelectedCard ? 'border-orange border-2 ring-2 ring-orange bg-orange/10' : 'border-gray-200'
                        }`}
                      >
                        {onRemove && (
                          <button
                            onClick={() => onRemove(index)}
                            className="absolute top-2 right-2 p-1 bg-white dark:bg-white hover:bg-red-100 dark:hover:bg-red-100 rounded-full transition-colors z-20 shadow-sm border border-gray-200"
                            title="Remove file"
                          >
                            <svg className="w-4 h-4 text-red-600 dark:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        {getPreviewUrl(index) ? (
                          <img
                            src={getPreviewUrl(index)!}
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
