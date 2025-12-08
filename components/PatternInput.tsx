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
    <div className="bg-white border-3 border-black p-5 rounded-2xl card-3d">
      <h2 className="text-xl md:text-2xl font-bold text-black mb-4">
        Pattern Settings
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black/70 mb-2">
            Naming Pattern
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => onPatternChange(e.target.value)}
            placeholder="photo_{index}"
            className="w-full px-4 py-3 border-2 border-black/20 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30 bg-white text-black rounded-lg transition-all placeholder-black/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-black/70 mb-2">
              Start Number
            </label>
            <input
              type="text"
              value={startNumber}
              onChange={(e) => onStartNumberChange(e.target.value)}
              placeholder="0001"
              className="w-full px-4 py-3 border-2 border-black/20 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30 bg-white text-black rounded-lg transition-all placeholder-black/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 mb-2">
              Gap
            </label>
            <input
              type="number"
              value={gap}
              onChange={(e) => onGapChange(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-4 py-3 border-2 border-black/20 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30 bg-white text-black rounded-lg transition-all"
            />
          </div>
        </div>

        {/* Action Buttons - Cute 3D Style */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onPreview}
            disabled={disabled}
            className="flex-1 bg-purple text-white font-bold py-3.5 px-6 rounded-xl border-2 border-black btn-3d disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            Preview
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-1 bg-mint text-white font-bold py-3.5 px-6 rounded-xl border-2 border-black btn-3d disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            Download
          </button>
        </div>

        {/* Guide - Cute Style */}
        <div className="bg-peach/30 border-2 border-black/10 p-4 rounded-xl">
          <p className="text-sm font-medium text-black/80 mb-2">Quick Guide</p>
          <div className="text-sm text-black/70 space-y-1">
            <p><code className="bg-white px-1.5 py-0.5 rounded text-pink font-mono text-xs">{'{name}'}</code> Original filename</p>
            <p><code className="bg-white px-1.5 py-0.5 rounded text-pink font-mono text-xs">{'{index}'}</code> Number (with padding)</p>
            <p><code className="bg-white px-1.5 py-0.5 rounded text-pink font-mono text-xs">{'{date}'}</code> Today&apos;s date</p>
          </div>
          <div className="mt-3 pt-3 border-t border-black/10">
            <p className="text-xs text-black/60">
              <span className="font-medium">Example:</span> photo_{'{index}'} + 0000 → photo_0000, photo_0001...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
