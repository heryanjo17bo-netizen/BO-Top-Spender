import React, { useEffect, useState } from 'react';
import {
  Plus,
  Play,
  RotateCcw,
  ExternalLink,
  Users,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { OutletId, OutletState, RankedParticipant } from '../../types/index.ts';
import {
  addParticipant,
  deleteParticipant,
  demoRank1ToRank4,
  demoRank4ToRank1,
  demoRank7ToRank2,
  demoRapidUpdate,
  demoSpendingOnly,
  fetchOutletState,
  resetOutlet,
  simulateRankChange,
  subscribeToOutlet,
  updateDisplaySettings,
  updateParticipant,
} from '../../services/api.ts';
import { rankParticipants } from '../../utils/formatters.ts';
import { OUTLETS_LIST } from '../../data/initialData.ts';
import { AdminHeader } from './AdminHeader.tsx';
import { ParticipantCard } from './ParticipantCard.tsx';
import { ParticipantModal } from './ParticipantModal.tsx';
import { PinModal } from './PinModal.tsx';
import { DisplaySettingsModal } from './DisplaySettingsModal.tsx';
import { TransparencyNoticeModal } from './TransparencyNoticeModal.tsx';
import { ResetConfirmModal } from './ResetConfirmModal.tsx';
import { DeleteConfirmModal } from './DeleteConfirmModal.tsx';

interface AdminViewProps {
  initialOutletId?: OutletId;
}

export const AdminView: React.FC<AdminViewProps> = ({ initialOutletId = 'BOSCBD' }) => {
  const [selectedOutletId, setSelectedOutletId] = useState<OutletId>(initialOutletId);
  const [outletState, setOutletState] = useState<OutletState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [hasPinVerified, setHasPinVerified] = useState<boolean>(false);

  // Modals state
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState<RankedParticipant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<RankedParticipant | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinSuccessCallback, setPinSuccessCallback] = useState<(() => void) | null>(null);

  // Live Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Preview checkerboard toggle in admin
  const [showCheckerboardPreview, setShowCheckerboardPreview] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Subscribe to real-time updates for selected outlet
  useEffect(() => {
    let isMounted = true;

    // Fetch initial state once
    fetchOutletState(selectedOutletId)
      .then((data) => {
        if (isMounted) setOutletState(data);
      })
      .catch((err) => {
        console.error('Failed to fetch outlet state:', err);
      });

    // Real-time SSE subscription
    const unsubscribe = subscribeToOutlet(
      selectedOutletId,
      ({ state }) => {
        if (!isMounted) return;
        setOutletState(state);
      },
      (status) => {
        if (isMounted) setConnectionStatus(status);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedOutletId]);

  // Action helpers requiring PIN protection
  const executeWithPinProtection = (action: () => void) => {
    if (hasPinVerified) {
      action();
    } else {
      setPinSuccessCallback(() => () => {
        setHasPinVerified(true);
        action();
      });
      setIsPinModalOpen(true);
    }
  };

  // Handle participant Save (Add or Edit)
  const handleSaveParticipant = async (payload: { name: string; table: string; spending: number }) => {
    if (!outletState) return;

    if (participantToEdit) {
      // Edit existing
      await updateParticipant(selectedOutletId, participantToEdit.id, payload);
      showToast(`Updated ${payload.name} (${payload.table})`);
    } else {
      // Add new
      if (outletState.participants.length >= 10) {
        throw new Error('Maximum 10 slots reached. Please delete an existing participant first.');
      }
      await addParticipant(selectedOutletId, payload);
      showToast(`Added ${payload.name} to rankings`);
    }
  };

  // Handle participant Delete
  const handleConfirmDelete = async () => {
    if (!participantToDelete) return;
    await deleteParticipant(selectedOutletId, participantToDelete.id);
    showToast(`Removed ${participantToDelete.name} from rankings`, 'info');
    setParticipantToDelete(null);
  };

  // Handle Reset
  const handleConfirmReset = async (mode: 'default' | 'empty') => {
    await resetOutlet(selectedOutletId, mode);
    showToast(
      mode === 'empty' ? 'Leaderboard cleared to 0 participants' : 'Leaderboard reset to default VIP seeds',
      'info'
    );
  };

  // Handle Simulation
  const handleSimulate = async () => {
    try {
      const res = await simulateRankChange(selectedOutletId);
      showToast(`Simulated: ${res.name} promoted to Rank #${res.newRank}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Simulation failed', 'error');
    }
  };

  const handleTestRank4To1 = async () => {
    try {
      const res = await demoRank4ToRank1(selectedOutletId);
      showToast(res.message || 'Rank 4 naik ke Rank 1!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTestRank1To4 = async () => {
    try {
      const res = await demoRank1ToRank4(selectedOutletId);
      showToast(res.message || 'Rank 1 dikoreksi turun ke Rank 4!', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTestRank7To2 = async () => {
    try {
      const res = await demoRank7ToRank2(selectedOutletId);
      showToast(res.message || 'Rank 7 masuk ke Rank 2 (Rank 5 keluar)!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTestSpendingOnly = async () => {
    try {
      const res = await demoSpendingOnly(selectedOutletId);
      showToast(res.message || 'Spending bertambah (rank tetap)!', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTestRapidUpdate = async () => {
    try {
      const res = await demoRapidUpdate(selectedOutletId);
      showToast('Rapid update: 2 update dikirim dalam jeda 500ms!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Open LED display route in a clean window
  const handleOpenLedDisplay = () => {
    const url = `/display/${selectedOutletId}`;
    window.open(url, '_blank');
  };

  const currentOutletMeta = OUTLETS_LIST.find((o) => o.id === selectedOutletId) || OUTLETS_LIST[0];
  const participants = outletState ? outletState.participants : [];
  const ranked = rankParticipants(participants);
  const isSlotsFull = participants.length >= 10;

  return (
    <div className="min-h-screen bg-[#0A0A0D] text-white flex flex-col font-sans selection:bg-amber-500/30">
      {/* Admin Header */}
      <AdminHeader
        selectedOutletId={selectedOutletId}
        onSelectOutlet={(id) => setSelectedOutletId(id)}
        connectionStatus={connectionStatus}
        onOpenSettings={() => executeWithPinProtection(() => setIsSettingsOpen(true))}
        onOpenHelp={() => setIsHelpOpen(true)}
        hasPinVerified={hasPinVerified}
        onPromptPin={() => {
          setPinSuccessCallback(() => () => setHasPinVerified(true));
          setIsPinModalOpen(true);
        }}
      />

      {/* Main Admin Scrollable Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slideUp ${
              toastMessage.type === 'error'
                ? 'bg-red-950 border-red-500 text-red-200'
                : toastMessage.type === 'info'
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                : 'bg-[#18181F] border-amber-500/60 text-amber-300'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Venue Status & LED Action Banner */}
        <section className="bg-[#121217] border border-[#D1B983]/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-outfit font-black text-xl sm:text-2xl text-white tracking-wide">
                  {currentOutletMeta.name}
                </span>
                <span className="font-mono text-xs font-bold text-[#D1B983] bg-[#D1B983]/15 px-2 py-0.5 rounded border border-[#D1B983]/30">
                  {currentOutletMeta.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {currentOutletMeta.location} · Canvas: {outletState?.settings.outputWidth || currentOutletMeta.defaultResolution.width} × {outletState?.settings.outputHeight || currentOutletMeta.defaultResolution.height}px
              </p>
            </div>

            {/* Launch LED Display Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleOpenLedDisplay}
                className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-[#D1B983] text-black font-extrabold text-xs sm:text-sm hover:bg-[#EADCB9] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D1B983]/20"
              >
                <ExternalLink className="w-4 h-4" />
                Open LED Display
              </button>
            </div>
          </div>

          {/* Quick Slot Occupancy Bar */}
          <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D1B983]" />
              <span className="text-zinc-300 font-medium">Active Participants:</span>
              <span className="font-tabular font-bold text-white">
                {participants.length} / 10 slots
              </span>
              {isSlotsFull && (
                <span className="text-[11px] font-semibold text-[#D1B983] bg-[#D1B983]/15 px-2 py-0.5 rounded border border-[#D1B983]/30">
                  Slots Full
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Broadcast: Ranks 1–5 Live on Stage LED</span>
            </div>
          </div>
        </section>

        {/* Slot Full Notice */}
        {isSlotsFull && (
          <div className="p-3.5 rounded-xl bg-[#1A1813] border border-[#D1B983]/40 flex items-center gap-3 text-xs text-[#EADCB9]">
            <AlertCircle className="w-4 h-4 text-[#D1B983] shrink-0" />
            <span>
              All 10 participant slots are occupied. To add a new VIP, remove an existing participant first.
            </span>
          </div>
        )}

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setParticipantToEdit(null);
                setIsParticipantModalOpen(true);
              }}
              disabled={isSlotsFull}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                isSlotsFull
                  ? 'bg-zinc-800/60 text-zinc-500 cursor-not-allowed border border-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-md shadow-white/5'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Participant
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset Leaderboard trigger */}
            <button
              onClick={() => executeWithPinProtection(() => setIsResetOpen(true))}
              className="py-2 px-3 rounded-lg bg-[#141419] border border-zinc-800 text-zinc-400 hover:text-red-300 hover:border-red-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset List
            </button>
          </div>
        </div>

        {/* Dedicated LED Ranking Animation Test Suite */}
        <section className="bg-[#121217] border border-[#D1B983]/30 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-[#D1B983] fill-[#D1B983]" />
              <h3 className="font-outfit font-extrabold text-sm uppercase tracking-wider text-white">
                LED Ranking Animation Test Suite
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              1.8s simultaneous smooth motion tests
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Test 1: Rank 4 -> Rank 1 */}
            <button
              onClick={handleTestRank4To1}
              className="p-3 rounded-xl bg-[#1A1A22] border border-[#D1B983]/30 hover:border-[#D1B983] hover:bg-[#D1B983]/10 text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-[#D1B983]">
                  1. Rank 4 → Rank 1
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#D1B983]" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Rank 4 naik ke #1, Ranks 1–3 bergeser turun serentak.
              </p>
            </button>

            {/* Test 2: Rank 1 -> Rank 4 */}
            <button
              onClick={handleTestRank1To4}
              className="p-3 rounded-xl bg-[#1A1A22] border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/40 text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-zinc-200">
                  2. Rank 1 → Rank 4
                </span>
                <ArrowDownRight className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Koreksi nominal: #1 turun ke #4, Ranks 2–4 bergeser naik.
              </p>
            </button>

            {/* Test 3: Rank 7 -> Rank 2 */}
            <button
              onClick={handleTestRank7To2}
              className="p-3 rounded-xl bg-[#1A1A22] border border-[#D1B983]/30 hover:border-[#D1B983] hover:bg-[#D1B983]/10 text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-[#D1B983]">
                  3. Rank 7 → Rank 2
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#D1B983]" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Rank 7 masuk dari bawah ke #2, Rank 5 terdorong keluar.
              </p>
            </button>

            {/* Test 4: Spending naik posisi tetap */}
            <button
              onClick={handleTestSpendingOnly}
              className="p-3 rounded-xl bg-[#1A1A22] border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/40 text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-zinc-200">
                  4. Spending Naik (Posisi Tetap)
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Count-up nominal saja tanpa pergeseran baris.
              </p>
            </button>

            {/* Test 5: Rapid Update */}
            <button
              onClick={handleTestRapidUpdate}
              className="p-3 rounded-xl bg-[#1A1A22] border border-[#D1B983]/40 hover:border-[#D1B983] hover:bg-[#D1B983]/10 text-left transition-all active:scale-95 group sm:col-span-2 lg:col-span-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-[#D1B983] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#D1B983] fill-[#D1B983]" />
                  5. Rapid Update (&lt; 1 Detik)
                </span>
                <span className="text-[10px] uppercase font-bold text-[#D1B983] bg-[#D1B983]/20 px-2 py-0.5 rounded">
                  Stress Test
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Mengirim 2 perubahan ranking dalam jeda 500ms untuk memvalidasi retargeting visual tanpa jump cut.
              </p>
            </button>
          </div>
        </section>

        {/* Participant List */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Rankings ({participants.length} Active)</span>
            <span>Sorted by Total Spending (IDR)</span>
          </div>

          {ranked.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#121217] border border-dashed border-zinc-800 text-center">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-400">No active participants</p>
              <p className="text-xs text-zinc-500 mt-1">
                Click "Add Participant" above or reset to default seeds.
              </p>
            </div>
          ) : (
            ranked.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onEdit={(p) => {
                  setParticipantToEdit(p);
                  setIsParticipantModalOpen(true);
                }}
                onDelete={(p) => {
                  executeWithPinProtection(() => setParticipantToDelete(p));
                }}
              />
            ))
          )}
        </section>

        {/* Live Top 5 Visual Preview Accordion (16:9 Landscape) */}
        <section className="mt-8 pt-6 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#D1B983]" />
              <h3 className="font-outfit font-extrabold text-sm uppercase tracking-wider text-white">
                Live LED Top 5 Screen Preview (16:9 Landscape)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-zinc-400 cursor-pointer flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showCheckerboardPreview}
                  onChange={(e) => setShowCheckerboardPreview(e.target.checked)}
                  className="rounded accent-[#D1B983]"
                />
                Show Alpha Checkerboard
              </label>
            </div>
          </div>

          {/* Admin Miniature Display Preview Box (16:9 Aspect Ratio) */}
          <div
            className={`w-full aspect-video max-w-3xl mx-auto rounded-2xl border border-[#D1B983]/30 p-4 sm:p-6 overflow-hidden flex flex-col justify-center transition-colors relative ${
              showCheckerboardPreview
                ? 'bg-[linear-gradient(45deg,#18181f_25%,transparent_25%),linear-gradient(-45deg,#18181f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181f_75%),linear-gradient(-45deg,transparent_75%,#18181f_75%)] bg-[size:20px_20px] bg-[#0f0f14]'
                : outletState?.settings.backgroundMode === 'black'
                ? 'bg-black'
                : 'bg-[#0E0E12]'
            }`}
          >
            <div className="absolute top-3 right-3 text-[10px] font-mono font-bold text-[#D1B983] bg-black/50 px-2 py-0.5 rounded border border-[#D1B983]/30">
              2560 × 1440 (16:9)
            </div>

            <div className="w-full max-w-xl mx-auto space-y-2">
              <div className="text-center mb-2">
                <span className="font-cinzel text-[10px] font-bold tracking-[0.3em] text-[#D1B983] block">
                  BLACK OWL
                </span>
                <span className="font-outfit font-black text-lg sm:text-xl text-[#EADCB9] uppercase tracking-wider">
                  {outletState?.settings.headingText || 'TOP SPENDER'}
                </span>
              </div>

              {ranked.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[45px_1fr_90px_90px] items-center px-3.5 py-2 rounded-lg border border-[#D1B983]/30 text-xs"
                  style={{
                    backgroundColor: `rgba(12, 12, 15, ${outletState?.settings.rowBackgroundOpacity ?? 0.6})`,
                  }}
                >
                  <span className="font-tabular font-black text-[#D1B983]">
                    {p.rank.toString().padStart(2, '0')}
                  </span>
                  <span className="font-bold text-white uppercase truncate pr-2">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {p.table}
                  </span>
                  <span className="text-right font-tabular font-black text-[#D1B983]">
                    {(p.spending / 1000000).toFixed(p.spending % 1000000 === 0 ? 0 : 1)}K
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Modals & Dialogs */}
      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => {
          setIsParticipantModalOpen(false);
          setParticipantToEdit(null);
        }}
        onSave={handleSaveParticipant}
        participantToEdit={participantToEdit}
        slotCount={participants.length}
      />

      <DeleteConfirmModal
        isOpen={!!participantToDelete}
        participant={participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <ResetConfirmModal
        isOpen={isResetOpen}
        outletId={selectedOutletId}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleConfirmReset}
      />

      {outletState && (
        <DisplaySettingsModal
          isOpen={isSettingsOpen}
          outletId={selectedOutletId}
          currentSettings={outletState.settings}
          currentPin={outletState.pin}
          onClose={() => setIsSettingsOpen(false)}
          onSave={async (settings, pin) => {
            await updateDisplaySettings(selectedOutletId, settings, pin);
            showToast('Display settings saved');
          }}
        />
      )}

      <PinModal
        isOpen={isPinModalOpen}
        outletId={selectedOutletId}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (pinSuccessCallback) {
            pinSuccessCallback();
            setPinSuccessCallback(null);
          }
        }}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinSuccessCallback(null);
        }}
      />

      <TransparencyNoticeModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
