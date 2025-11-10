'use client';

export default function MainPage() {
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
          {/* Upload Component */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📁 Upload Files
            </h2>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium">Click to upload or drag and drop</p>
                <p className="text-sm mt-2">Support for multiple files</p>
              </div>
            </div>
          </div>

          {/* Pattern Settings Component */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ⚙️ Pattern Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Naming Pattern
                </label>
                <input
                  type="text"
                  placeholder="e.g., photo_{index:3}.{ext}"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Guide:</p>
                <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  <li><code className="bg-white dark:bg-gray-600 px-1 rounded">{'{name}'}</code> - Original name</li>
                  <li><code className="bg-white dark:bg-gray-600 px-1 rounded">{'{ext}'}</code> - File extension</li>
                  <li><code className="bg-white dark:bg-gray-600 px-1 rounded">{'{index}'}</code> - Number (1, 2, 3...)</li>
                  <li><code className="bg-white dark:bg-gray-600 px-1 rounded">{'{date}'}</code> - Current date</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Before and After Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Files (Before) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Original Files
            </h2>
            <div className="space-y-2">
              {/* Example items - will be replaced with actual uploaded files */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center">
                <span className="text-gray-600 dark:text-gray-300 text-sm">No files uploaded yet</span>
              </div>
              {/* Mock preview */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                <p className="italic">Example preview:</p>
                <div className="mt-2 space-y-1">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">IMG_1234.jpg</div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">IMG_1235.jpg</div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">IMG_1236.jpg</div>
                </div>
              </div>
            </div>
          </div>

          {/* Renamed Files (After) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">✨</span>
              Preview (Renamed)
            </h2>
            <div className="space-y-2">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center">
                <span className="text-gray-600 dark:text-gray-300 text-sm">Upload files and set pattern to preview</span>
              </div>
              {/* Mock preview */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                <p className="italic">Example preview:</p>
                <div className="mt-2 space-y-1">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-green-800 dark:text-green-200">photo_001.jpg</div>
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-green-800 dark:text-green-200">photo_002.jpg</div>
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-green-800 dark:text-green-200">photo_003.jpg</div>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              Download All Renamed Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
