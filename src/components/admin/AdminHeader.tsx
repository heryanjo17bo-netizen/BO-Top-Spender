import React from 'react';
import { ExternalLink, Settings, HelpCircle, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { OutletId } from '../../types/index.ts';
import { OUTLETS_LIST } from '../../data/initialData.ts';

interface AdminHeaderProps {
  selectedOutletId: OutletId;
  onSelectOutlet: (id: OutletId) => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  hasPinVerified: boolean;
  onPromptPin: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  selectedOutletId,
  onSelectOutlet,
  connectionStatus,
  onOpenSettings,
  onOpenHelp,
  hasPinVerified,
  onPromptPin,
}) => {
  const currentOutlet = OUTLETS_LIST.find((o) => o.id === selectedOutletId) || OUTLETS_LIST[0];

  return (
    <header className="sticky top-0 z-30 bg-[#0B0B0E]/95 backdrop-blur-md border-b border-[#D1B983]/20 px-4 py-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Wordmark & Location */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xs font-bold tracking-[0.25em] text-[#D1B983]">
                BLACK OWL
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D1B983]/15 text-[#D1B983] font-semibold border border-[#D1B983]/30">
                FOH
              </span>
            </div>
            <span className="text-sm sm:text-base font-outfit font-bold text-white tracking-wide">
              TOP SPENDER
            </span>
          </div>
        </div>

        {/* Outlet Switcher dropdown */}
        <div className="flex-1 max-w-[200px] sm:max-w-[240px]">
          <label htmlFor="outlet-select" className="sr-only">
            Select Outlet
          </label>
          <select
            id="outlet-select"
            value={selectedOutletId}
            onChange={(e) => onSelectOutlet(e.target.value as OutletId)}
            className="w-full bg-[#16161C] border border-[#D1B983]/35 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D1B983] cursor-pointer appearance-none text-ellipsis"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D1B983'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.6rem center',
              backgroundSize: '1rem',
              paddingRight: '2rem',
            }}
          >
            {OUTLETS_LIST.map((outlet) => (
              <option key={outlet.id} value={outlet.id} className="bg-[#16161C] text-white">
                {outlet.id} — {outlet.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Connection status indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${
              connectionStatus === 'connected'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                : connectionStatus === 'connecting'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                : 'bg-red-950/40 text-red-300 border-red-500/30'
            }`}
            title={`Real-time sync: ${connectionStatus}`}
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline capitalize">{connectionStatus}</span>
          </div>

          {/* Quick PIN lock status button */}
          <button
            onClick={onPromptPin}
            className={`p-2 rounded-lg border transition-colors ${
              hasPinVerified
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                : 'bg-[#16161C] text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title={hasPinVerified ? 'Venue PIN Authorized' : 'Verify Venue PIN'}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-[#16161C] border border-zinc-800 text-zinc-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            title="Display Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Venue Alpha Help Guide */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg bg-[#16161C] border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="LED Transparency & Compositing Info"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
