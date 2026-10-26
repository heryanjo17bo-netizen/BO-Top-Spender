import React from 'react';
import { X, Info, Layers, CheckCircle2 } from 'lucide-react';

interface TransparencyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransparencyNoticeModal: React.FC<TransparencyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#131318] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold text-base sm:text-lg text-white">
                LED Transparency & Alpha Compositing
              </h3>
              <p className="text-xs text-zinc-400">Venue Engineer Integration Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200/90">
              The LED overlay page defaults to true <strong className="text-amber-300">rgba(0,0,0,0)</strong> transparency across the DOM root, body, and canvas wrapper.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              How to overlay on venue stage visuals:
            </h4>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#1A1A22] border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">OBS Studio / vMix Browser Source</strong>
                  <span className="text-zinc-400">
                    Add as a Browser Source URL. Check <em>"Apply shutdown when not active"</em> and leave default transparency enabled.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#1A1A22] border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Resolume Arena / ProPresenter</strong>
                  <span className="text-zinc-400">
                    Use NDI Screen Capture or HTML5 web layer plugin with straight Alpha channel routing.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#1A1A22] border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Direct Hardware Processor (Novastar / Brompton)</strong>
                  <span className="text-zinc-400">
                    Standard OS desktop windows do not transmit hardware alpha via HDMI/DisplayPort. If playing via raw secondary monitor, use the <em>"Solid Black Fallback"</em> in settings or a hardware keyer (Luma keying black).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
