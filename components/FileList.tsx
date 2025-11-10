'use client';

interface FileListProps {
  title: string;
  files: string[];
  emptyMessage: string;
  variant?: 'original' | 'renamed';
}

export default function FileList({ title, files, emptyMessage, variant = 'original' }: FileListProps) {
  const itemClass = variant === 'renamed'
    ? 'bg-green-100 dark:bg-green-900 p-2 rounded text-green-800 dark:text-green-200'
    : 'bg-gray-100 dark:bg-gray-700 p-2 rounded';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center">
            <span className="text-gray-600 dark:text-gray-300 text-sm">{emptyMessage}</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className={itemClass}>
                <span className="text-sm font-mono">{file}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
