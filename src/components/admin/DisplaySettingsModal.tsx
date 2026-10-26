import React, { useState } from 'react';
import { X, Check, Monitor } from 'lucide-react';
import { DisplaySettings, OutletId } from '../../types/index.ts';

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: OutletId;
  currentSettings: DisplaySettings;
  currentPin: string;
  onSave: (settings: Partial<DisplaySettings>, pin?: string) => Promise<void>;
}

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  outletId,
  currentSettings,
  currentPin,
  onSave,
}) => {
  const [headingText, setHeadingText] = useState(currentSettings.headingText || 'TOP SPENDER');
  const [goldAccentColor, setGoldAccentColor] = useState(currentSettings.goldAccentColor || '#D1B983');
  const [textColor, setTextColor] = useState(currentSettings.textColor || '#FFFFFF');
  const [fontScale, setFontScale] = useState(currentSettings.fontScale || 1.0);
  const [rowSpacing, setRowSpacing] = useState(currentSettings.rowSpacing || 18);
  const [rowBackgroundOpacity, setRowBackgroundOpacity] = useState(
    currentSettings.rowBackgroundOpacity ?? 0.6
  );
  const [backgroundMode, setBackgroundMode] = useState<'transparent' | 'black'>(
    currentSettings.backgroundMode || 'transparent'
  );
  const [outputWidth, setOutputWidth] = useState(currentSettings.outputWidth || 1920);
  const [outputHeight, setOutputHeight] = useState(currentSettings.outputHeight || 1080);
  const [safeMargin, setSafeMargin] = useState(currentSettings.safeMargin || 48);
  const [overlayAlignment, setOverlayAlignment] = useState<'left' | 'center' | 'right'>(
    currentSettings.overlayAlignment || 'center'
  );
  const [pin, setPin] = useState(currentPin || '8888');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePresetResolution = (w: number, h: number) => {
    setOutputWidth(w);
    setOutputHeight(h);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(
        {
          headingText: headingText.trim() || 'TOP SPENDER',
          goldAccentColor,
          textColor,
          fontScale,
          rowSpacing,
          rowBackgroundOpacity,
          backgroundMode,
          outputWidth: Math.max(800, outputWidth),
          outputHeight: Math.max(600, outputHeight),
          safeMargin,
          overlayAlignment,
        },
        pin.trim() ? pin.trim() : undefined
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#131318] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-outfit font-extrabold text-white">
                LED Display Settings
              </h2>
              <p className="text-xs text-zinc-400">Scoped to {outletId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Heading Text */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
              Heading Text
            </label>
            <input
              type="text"
              value={headingText}
              onChange={(e) => setHeadingText(e.target.value)}
              className="w-full bg-[#1A1A22] border border-zinc-700/80 focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none"
            />
          </div>

          {/* Background Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
              LED Background Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBackgroundMode('transparent')}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  backgroundMode === 'transparent'
                    ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                    : 'bg-[#1A1A22] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Transparent (Default)
              </button>
              <button
                type="button"
                onClick={() => setBackgroundMode('black')}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  backgroundMode === 'black'
                    ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                    : 'bg-[#1A1A22] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Solid Black Fallback
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Transparent provides pure alpha `rgba(0,0,0,0)` for video wall compositors.
            </p>
          </div>

          {/* Canvas Resolution Presets & Custom */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1B983] mb-1">
              Output Resolution (16:9 Landscape)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => handlePresetResolution(2560, 1440)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  outputWidth === 2560 && outputHeight === 1440
                    ? 'bg-[#D1B983]/20 border-[#D1B983] text-[#D1B983] font-bold'
                    : 'bg-[#1A1A22] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Standard (2560×1440 QHD)
              </button>
              <button
                type="button"
                onClick={() => handlePresetResolution(1920, 1080)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  outputWidth === 1920 && outputHeight === 1080
                    ? 'bg-[#D1B983]/20 border-[#D1B983] text-[#D1B983] font-bold'
                    : 'bg-[#1A1A22] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Full HD (1920×1080)
              </button>
              <button
                type="button"
                onClick={() => handlePresetResolution(3840, 2160)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  outputWidth === 3840 && outputHeight === 2160
                    ? 'bg-[#D1B983]/20 border-[#D1B983] text-[#D1B983] font-bold'
                    : 'bg-[#1A1A22] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                4K UHD (3840×2160)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Width (px)</span>
                <input
                  type="number"
                  value={outputWidth}
                  onChange={(e) => setOutputWidth(parseInt(e.target.value, 10) || 1920)}
                  className="w-full bg-[#1A1A22] border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-tabular text-white"
                />
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Height (px)</span>
                <input
                  type="number"
                  value={outputHeight}
                  onChange={(e) => setOutputHeight(parseInt(e.target.value, 10) || 1080)}
                  className="w-full bg-[#1A1A22] border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-tabular text-white"
                />
              </div>
            </div>
          </div>

          {/* Row Opacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Row Background Opacity
              </label>
              <span className="font-tabular text-xs text-amber-400 font-bold">
                {Math.round(rowBackgroundOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.05"
              value={rowBackgroundOpacity}
              onChange={(e) => setRowBackgroundOpacity(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* Row Spacing Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Row Vertical Spacing
              </label>
              <span className="font-tabular text-xs text-amber-400 font-bold">
                {rowSpacing}px
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="36"
              step="2"
              value={rowSpacing}
              onChange={(e) => setRowSpacing(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* Overlay Alignment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
              Overlay Alignment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setOverlayAlignment(align)}
                  className={`py-2 rounded-lg border text-xs capitalize font-semibold transition-all ${
                    overlayAlignment === align
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-[#1A1A22] border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Color Tokens & 4-Digit PIN */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Gold Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={goldAccentColor}
                  onChange={(e) => setGoldAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-300">{goldAccentColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                4-Digit Venue PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="8888"
                className="w-full bg-[#1A1A22] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-sm font-mono text-white text-center tracking-widest"
              />
            </div>
          </div>

          {/* Footer Save */}
          <div className="pt-3 border-t border-zinc-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 text-black font-extrabold text-xs hover:bg-amber-300 active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
