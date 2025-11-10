'use client';

interface PatternInputProps {
  pattern: string;
  onPatternChange: (pattern: string) => void;
  onPreview: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}

export default function PatternInput({
  pattern,
  onPatternChange,
  onPreview,
  onConfirm,
  disabled = false,
}: PatternInputProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Pattern Settings
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Naming Pattern
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => onPatternChange(e.target.value)}
            placeholder="e.g., photo_{index:3}.{ext}"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPreview}
            disabled={disabled}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Preview
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Confirm & Download
          </button>
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
  );
}
