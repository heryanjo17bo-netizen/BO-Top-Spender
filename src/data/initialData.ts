import { OutletId, OutletMeta, OutletState } from '../types/index.ts';

export const OUTLETS_LIST: OutletMeta[] = [
  {
    id: 'BOSCBD',
    name: 'Black Owl SCBD',
    shortCode: 'SCBD',
    location: 'District 8, SCBD Jakarta',
    defaultResolution: { width: 2560, height: 1440 },
  },
  {
    id: 'BOPIK',
    name: 'Black Owl PIK',
    shortCode: 'PIK',
    location: 'Golf Island PIK, Jakarta',
    defaultResolution: { width: 2560, height: 1440 },
  },
  {
    id: 'BOKG',
    name: 'Black Owl Kelapa Gading',
    shortCode: 'KG',
    location: 'Kelapa Gading, Jakarta',
    defaultResolution: { width: 2560, height: 1440 },
  },
  {
    id: 'BOGS',
    name: 'Black Owl Gading Serpong',
    shortCode: 'GS',
    location: 'Gading Serpong, Tangerang',
    defaultResolution: { width: 2560, height: 1440 },
  },
  {
    id: 'BOSBY',
    name: 'Black Owl Surabaya',
    shortCode: 'SBY',
    location: 'Kertajaya Indah, Surabaya',
    defaultResolution: { width: 2560, height: 1440 },
  },
  {
    id: 'BOMDN',
    name: 'Black Owl Medan',
    shortCode: 'MDN',
    location: 'Capital Building, Medan',
    defaultResolution: { width: 2560, height: 1440 },
  },
];

export function createDefaultOutletState(id: OutletId): OutletState {
  const meta = OUTLETS_LIST.find((o) => o.id === id) || OUTLETS_LIST[0];

  // Tailored seed participants per outlet so each venue feels genuine
  const seedParticipants: Record<OutletId, Array<{ name: string; table: string; spending: number }>> = {
    BOSCBD: [
      { name: 'ALEXANDER', table: 'TABLE 08', spending: 230000000 },
      { name: 'JESSICA W.', table: 'VIP 02', spending: 175000000 },
      { name: 'MICHAEL TAN', table: 'VVIP 01', spending: 142500000 },
      { name: 'CHRISTOPHER', table: 'TABLE 12', spending: 118000000 },
      { name: 'EDWARD S.', table: 'SOFA 04', spending: 95000000 },
      { name: 'PATRICK CHEN', table: 'VIP 05', spending: 82000000 },
      { name: 'HENDRA K.', table: 'TABLE 15', spending: 65000000 },
      { name: 'RICHARD H.', table: 'SOFA 02', spending: 48000000 },
      { name: 'KEVIN WIJAYA', table: 'TABLE 03', spending: 35000000 },
      { name: 'STEPHANIE', table: 'TABLE 06', spending: 22000000 },
    ],
    BOPIK: [
      { name: 'WILLIAM S.', table: 'VVIP 01', spending: 185000000 },
      { name: 'ANDREW L.', table: 'VIP 03', spending: 150000000 },
      { name: 'CATHY ONG', table: 'TABLE 09', spending: 120500000 },
      { name: 'DANIEL K.', table: 'SOFA 01', spending: 98000000 },
      { name: 'RAYMOND T.', table: 'TABLE 14', spending: 76000000 },
      { name: 'FELIX S.', table: 'TABLE 05', spending: 55000000 },
      { name: 'BRYAN H.', table: 'SOFA 07', spending: 42000000 },
      { name: 'VANESSA M.', table: 'TABLE 18', spending: 31000000 },
      { name: 'TOMMY P.', table: 'TABLE 02', spending: 24000000 },
      { name: 'JONATHAN', table: 'TABLE 11', spending: 15000000 },
    ],
    BOKG: [
      { name: 'STEVEN W.', table: 'VIP 01', spending: 160000000 },
      { name: 'JEFFREY K.', table: 'TABLE 07', spending: 135000000 },
      { name: 'MICHELLE G.', table: 'VVIP 02', spending: 110000000 },
      { name: 'ANTHONY C.', table: 'SOFA 03', spending: 88000000 },
      { name: 'BRANDON T.', table: 'TABLE 10', spending: 69000000 },
      { name: 'CINDY L.', table: 'TABLE 04', spending: 52000000 },
      { name: 'CALVIN R.', table: 'SOFA 05', spending: 38000000 },
      { name: 'MELISSA K.', table: 'TABLE 16', spending: 29000000 },
      { name: 'HERMAN S.', table: 'TABLE 08', spending: 19500000 },
      { name: 'NICHOLAS', table: 'TABLE 01', spending: 12000000 },
    ],
    BOGS: [
      { name: 'ALVIN T.', table: 'VVIP 01', spending: 145000000 },
      { name: 'SAMUEL P.', table: 'VIP 02', spending: 122000000 },
      { name: 'PATRICIA', table: 'TABLE 05', spending: 95500000 },
      { name: 'DAVID W.', table: 'SOFA 02', spending: 81000000 },
      { name: 'DARREN H.', table: 'TABLE 11', spending: 63000000 },
      { name: 'KENNETH S.', table: 'TABLE 08', spending: 49000000 },
      { name: 'TIFFANY L.', table: 'SOFA 06', spending: 36000000 },
      { name: 'LEONARD K.', table: 'TABLE 19', spending: 27000000 },
      { name: 'JOSHUA C.', table: 'TABLE 03', spending: 18000000 },
      { name: 'CLARISSA', table: 'TABLE 12', spending: 11500000 },
    ],
    BOSBY: [
      { name: 'HARTONO W.', table: 'VIP 01', spending: 210000000 },
      { name: 'SURYA K.', table: 'VVIP 02', spending: 165000000 },
      { name: 'GABRIEL N.', table: 'TABLE 06', spending: 130000000 },
      { name: 'MELVIN T.', table: 'SOFA 01', spending: 105000000 },
      { name: 'IVAN S.', table: 'TABLE 15', spending: 84000000 },
      { name: 'RONALD W.', table: 'TABLE 09', spending: 61000000 },
      { name: 'DENISE L.', table: 'SOFA 04', spending: 45000000 },
      { name: 'OSCAR T.', table: 'TABLE 21', spending: 33000000 },
      { name: 'VERONICA', table: 'TABLE 04', spending: 21000000 },
      { name: 'JULIUS P.', table: 'TABLE 10', spending: 14000000 },
    ],
    BOMDN: [
      { name: 'CHANDRA S.', table: 'VVIP 01', spending: 195000000 },
      { name: 'BENNY H.', table: 'VIP 03', spending: 155000000 },
      { name: 'EDWIN T.', table: 'TABLE 08', spending: 115000000 },
      { name: 'RUDY K.', table: 'SOFA 02', spending: 92000000 },
      { name: 'ARTHUR L.', table: 'TABLE 14', spending: 72000000 },
      { name: 'SEBASTIAN', table: 'TABLE 07', spending: 51000000 },
      { name: 'NATALIE', table: 'SOFA 05', spending: 39000000 },
      { name: 'GILBERT W.', table: 'TABLE 17', spending: 28000000 },
      { name: 'ALICIA K.', table: 'TABLE 02', spending: 19000000 },
      { name: 'VICTOR S.', table: 'TABLE 11', spending: 13000000 },
    ],
  };

  const seed = seedParticipants[id] || seedParticipants.BOSCBD;
  const baseTime = Date.now() - 3600000;

  const participants = seed.map((item, idx) => ({
    id: `p_${id.toLowerCase()}_${idx + 1}`,
    name: item.name,
    table: item.table,
    spending: item.spending,
    createdAt: baseTime + idx * 10000,
    tieBreakOrder: idx + 1,
  }));

  return {
    id,
    name: meta.name,
    participants,
    settings: {
      headingText: 'TOP SPENDER',
      goldAccentColor: '#D1B983',
      textColor: '#FFFFFF',
      fontScale: 1.0,
      rowSpacing: 25,
      rowBackgroundOpacity: 0.6,
      backgroundMode: 'transparent',
      outputWidth: 2560,
      outputHeight: 1440,
      safeMargin: 60,
      overlayAlignment: 'center',
    },
    pin: '8888',
    lastUpdated: Date.now(),
    version: 1,
  };
}

export function createAllInitialOutlets(): Record<OutletId, OutletState> {
  const outlets: Partial<Record<OutletId, OutletState>> = {};
  for (const meta of OUTLETS_LIST) {
    outlets[meta.id] = createDefaultOutletState(meta.id);
  }
  return outlets as Record<OutletId, OutletState>;
}
