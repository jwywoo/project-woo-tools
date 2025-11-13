'use client';

import { useState, useEffect } from 'react';

interface FileListProps {
  title: string;
  files: string[];
  fileObjects?: File[];
  emptyMessage: string;
  variant?: 'original' | 'renamed';
}

export default function FileList({ title, files, fileObjects, emptyMessage, variant = 'original' }: FileListProps) {
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

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

  const itemClass = variant === 'renamed'
    ? 'bg-green-100 dark:bg-green-900 p-2 rounded text-green-800 dark:text-green-200'
    : 'bg-gray-100 dark:bg-gray-700 p-2 rounded';

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
            {files.map((file, index) => (
              <div key={index} className={`${itemClass} flex items-center gap-3`}>
                <span className="text-sm font-mono flex-1">{file}</span>
                {previewUrls[index] && (
                  <img
                    src={previewUrls[index]!}
                    alt={file}
                    className="w-10 h-10 object-cover rounded border border-gray-300 dark:border-gray-600"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
