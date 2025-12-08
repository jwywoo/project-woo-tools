'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

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

    if (draggedIndex !== null && dragOverIndex !== null && fileObjects && onReorder) {
      const newFiles = [...fileObjects];

      // Get all selected indices in order
      const selected = Array.from(selectedIndices).sort((a, b) => a - b);

      if (selected.length > 1) {
        // Multi-select drag: move all selected items together

        // Check if we're trying to drop within the selected range - if so, do nothing
        if (selected.includes(dragOverIndex)) {
          setDraggedIndex(null);
          setDragOverIndex(null);
          return;
        }

        const selectedFiles = selected.map(i => newFiles[i]);

        // Calculate new insert position BEFORE removing items
        // If dropping after the selection, we need to account for removed items
        let insertPos = dragOverIndex;

        // Count how many selected items are before the drop position
        const numSelectedBefore = selected.filter(i => i < dragOverIndex).length;

        // Adjust insert position based on whether we're dropping before or after
        if (dragOverIndex > selected[selected.length - 1]) {
          // Dropping after all selected items - adjust for removed items
          insertPos = dragOverIndex - numSelectedBefore + 1;
        } else if (dragOverIndex < selected[0]) {
          // Dropping before all selected items - no adjustment needed
          insertPos = dragOverIndex;
        } else {
          // This shouldn't happen due to the check above, but handle it anyway
          insertPos = dragOverIndex;
        }

        // Remove selected items (in reverse to maintain indices)
        for (let i = selected.length - 1; i >= 0; i--) {
          newFiles.splice(selected[i], 1);
        }

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
        if (draggedIndex !== dragOverIndex) {
          const [draggedFile] = newFiles.splice(draggedIndex, 1);
          newFiles.splice(dragOverIndex, 0, draggedFile);
          onReorder(newFiles);
          setSelectedIndices(new Set([dragOverIndex]));
        }
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

  const canDrag = variant === 'original' && !!onReorder;

  return (
    <>
      <div className="bg-white border-3 border-black p-4 rounded-2xl card-3d flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-black">
              {title}
            </h2>
            {variant === 'original' && selectedIndices.size > 0 && (
              <span className="text-xs font-medium text-white bg-pink px-2 py-0.5 rounded-full">
                {selectedIndices.size} selected
              </span>
            )}
          </div>
          {variant === 'original' && files.length > 0 && (
            <div className="flex items-center gap-2">
              {onReset && (
                <button
                  onClick={onReset}
                  className="px-3 py-1.5 bg-pink/10 hover:bg-pink hover:text-white text-pink font-medium text-xs rounded-lg transition-colors"
                  title="Clear all files"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-purple/10 hover:bg-purple hover:text-white text-purple font-medium text-xs rounded-lg transition-colors"
                title="Expand view"
              >
                Expand
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto bg-cream/50 rounded-xl border-2 border-black/10" style={{ height: '350px' }}>
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-black/50 text-sm">{emptyMessage}</span>
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {files.map((file, index) => {
                const isDragging = selectedIndices.has(index) && draggedIndex !== null;
                const isDragOver = dragOverIndex === index && draggedIndex !== index;
                const showTopIndicator = isDragOver && draggedIndex !== null && draggedIndex > index;
                const showBottomIndicator = isDragOver && draggedIndex !== null && draggedIndex < index;
                const isSelected = selectedIndices.has(index);
                const previewUrl = getPreviewUrl(index);

                return (
                  <div key={index} className="relative">
                    {showTopIndicator && (
                      <div className="absolute -top-1 left-2 right-2 h-0.5 bg-mint rounded-full z-10"></div>
                    )}
                    <div
                      draggable={canDrag}
                      onClick={(e) => handleSelect(index, e)}
                      onDragStart={(e) => handleDragStart(index, e)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragLeave={handleDragLeave}
                      className={`bg-white border-2 border-black/10 p-2.5 rounded-lg flex items-center gap-3 transition-all ${
                        canDrag ? 'cursor-move hover:border-mint hover:shadow-sm' : ''
                      } ${isDragging ? 'opacity-50 scale-98' : ''} ${
                        isSelected ? 'bg-yellow/30 border-pink' : ''
                      }`}
                    >
                      <span className="text-xs font-medium text-black/40 w-6">{index + 1}</span>
                      <span className="text-sm flex-1 truncate text-black">{file}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt={file}
                            className="w-8 h-8 object-cover rounded border border-black/10"
                          />
                        )}
                        {variant === 'original' && onRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(index);
                            }}
                            className="w-6 h-6 bg-pink/10 hover:bg-pink text-pink hover:text-white rounded-md text-xs flex items-center justify-center transition-colors"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    {showBottomIndicator && (
                      <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-mint rounded-full z-10"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Cute 3D Style */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white max-w-[95vw] w-full max-h-[95vh] flex flex-col rounded-2xl border-3 border-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/10">
              <h3 className="text-xl md:text-2xl font-bold text-black">{title}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 bg-pink/10 hover:bg-pink text-pink hover:text-white rounded-lg text-lg flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Card Grid */}
            <div className="flex-1 overflow-y-auto p-5 bg-cream/30">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {files.map((file, index) => {
                  const isDraggingCard = selectedIndices.has(index) && draggedIndex !== null;
                  const isDragOverCard = dragOverIndex === index && draggedIndex !== index;
                  const showLeftIndicator = isDragOverCard && draggedIndex !== null && draggedIndex > index;
                  const showRightIndicator = isDragOverCard && draggedIndex !== null && draggedIndex < index;
                  const isSelectedCard = selectedIndices.has(index);

                  return (
                    <div key={index} className="relative">
                      {showLeftIndicator && (
                        <div className="absolute -left-1.5 top-0 bottom-0 w-1 bg-mint rounded-full z-10"></div>
                      )}
                      <div
                        draggable={!!onReorder}
                        onClick={(e) => handleSelect(index, e)}
                        onDragStart={(e) => handleDragStart(index, e)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragLeave={handleDragLeave}
                        className={`bg-white border-2 border-black/10 p-2 rounded-xl flex flex-col items-center gap-2 transition-all relative hover:shadow-md ${
                          onReorder ? 'cursor-move' : ''
                        } ${isDraggingCard ? 'opacity-50 scale-95' : ''} ${
                          isSelectedCard ? 'bg-yellow/30 border-pink' : ''
                        }`}
                      >
                        {onRemove && (
                          <button
                            onClick={() => onRemove(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-pink/10 hover:bg-pink text-pink hover:text-white rounded-md text-xs flex items-center justify-center transition-colors z-20"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        )}
                        {getPreviewUrl(index) ? (
                          <img
                            src={getPreviewUrl(index)!}
                            alt={file}
                            className="w-full h-24 object-cover rounded-lg pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-24 bg-cream rounded-lg flex items-center justify-center">
                            <span className="text-2xl text-black/20 font-bold">FILE</span>
                          </div>
                        )}
                        <p className="text-xs text-center text-black/70 break-all w-full truncate">{file}</p>
                      </div>
                      {showRightIndicator && (
                        <div className="absolute -right-1.5 top-0 bottom-0 w-1 bg-mint rounded-full z-10"></div>
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
