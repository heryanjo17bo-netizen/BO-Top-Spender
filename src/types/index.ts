export type OutletId = 'BOPIK' | 'BOKG' | 'BOGS' | 'BOSCBD' | 'BOSBY' | 'BOMDN';

export interface OutletMeta {
  id: OutletId;
  name: string;
  shortCode: string;
  location: string;
  defaultResolution: {
    width: number;
    height: number;
  };
}

export interface Participant {
  id: string; // Permanent unique ID (e.g. 'p_1729837492_abc')
  name: string; // Guest name
  table: string; // Table number or label (e.g. 'TABLE 08', 'VIP 02')
  spending: number; // Whole integer in actual Indonesian Rupiah
  createdAt: number; // Created timestamp (ms)
  tieBreakOrder: number; // Stable tie-break order (monotonically increasing counter or timestamp)
}

export interface RankedParticipant extends Participant {
  rank: number; // 1-indexed rank calculated from spending & tieBreakOrder
}

export interface DisplaySettings {
  headingText: string;
  goldAccentColor: string;
  textColor: string;
  fontScale: number; // Multiplier, 0.75 - 1.5
  rowSpacing: number; // px, 8 - 32
  rowBackgroundOpacity: number; // 0.0 - 0.95
  backgroundMode: 'transparent' | 'black';
  outputWidth: number; // e.g. 8704 for SCBD
  outputHeight: number; // e.g. 2305 for SCBD
  safeMargin: number; // px
  overlayAlignment: 'left' | 'center' | 'right';
}

export interface OutletState {
  id: OutletId;
  name: string;
  participants: Participant[];
  settings: DisplaySettings;
  pin: string; // 4-digit venue PIN, default '8888'
  lastUpdated: number;
  version: number;
}

export interface PromotionEvent {
  participantId: string;
  previousRank: number;
  newRank: number;
  timestamp: number;
}
