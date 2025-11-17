'use client';

interface PatternInputProps {
  pattern: string;
  startNumber: string;
  gap: number;
  onPatternChange: (pattern: string) => void;
  onStartNumberChange: (startNumber: string) => void;
  onGapChange: (gap: number) => void;
  onPreview: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}

export default function PatternInput({
  pattern,
  startNumber,
  gap,
  onPatternChange,
  onStartNumberChange,
  onGapChange,
  onPreview,
  onConfirm,
  disabled = false,
}: PatternInputProps) {
  return (
    <div className="bg-orange dark:bg-summer-blue rounded-lg shadow-lg p-6 border-4 border-orange dark:border-orange">
      <h2 className="text-3xl font-semibold text-white dark:text-orange mb-4">
        Pattern Settings
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white dark:text-white mb-2">
            Naming Pattern
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => onPatternChange(e.target.value)}
            placeholder="e.g., photo_{index}.{ext}"
            className="w-full px-4 py-2 border border-white dark:border-orange rounded-lg focus:ring-2 focus:ring-white dark:focus:ring-orange focus:border-transparent bg-white/20 dark:bg-orange/20 text-white dark:text-white placeholder-white/60 dark:placeholder-white/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white dark:text-white mb-2">
              Start Number
            </label>
            <input
              type="text"
              value={startNumber}
              onChange={(e) => onStartNumberChange(e.target.value)}
              placeholder="e.g., 0000 or 01"
              className="w-full px-4 py-2 border border-white dark:border-orange rounded-lg focus:ring-2 focus:ring-white dark:focus:ring-orange focus:border-transparent bg-white/20 dark:bg-orange/20 text-white dark:text-white placeholder-white/60 dark:placeholder-white/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white dark:text-white mb-2">
              Gap
            </label>
            <input
              type="number"
              value={gap}
              onChange={(e) => onGapChange(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-4 py-2 border border-white dark:border-orange rounded-lg focus:ring-2 focus:ring-white dark:focus:ring-orange focus:border-transparent bg-white/20 dark:bg-orange/20 text-white dark:text-white placeholder-white/60 dark:placeholder-white/60"
            />
          </div>
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

        <div className="bg-white/20 dark:bg-white/20 rounded-lg p-4">
          <p className="text-sm font-medium text-white dark:text-white mb-2">Quick Guide:</p>
          <ul className="text-xs text-white dark:text-white space-y-1">
            <li><code className="bg-white/30 dark:bg-white/30 px-1 rounded">{'{name}'}</code> - Original filename (without extension)</li>
            <li><code className="bg-white/30 dark:bg-white/30 px-1 rounded">{'{index}'}</code> - Number with padding from Start Number</li>
            <li><code className="bg-white/30 dark:bg-white/30 px-1 rounded">{'{date}'}</code> - Current date (YYYY-MM-DD)</li>
          </ul>
          <div className="mt-2 pt-2 border-t border-white/40 dark:border-white/40">
            <p className="text-xs text-white dark:text-white">
              <strong>Example:</strong> photo_{'{index}'} + Start 0000 → photo_0000, photo_0001...
            </p>
            <p className="text-xs text-white dark:text-white mt-1">
              <strong>Gap:</strong> Gap 2 + Start 00 → 00, 02, 04, 06...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
