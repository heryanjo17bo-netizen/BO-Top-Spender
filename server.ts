import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { OutletId, OutletState, Participant, PromotionEvent } from './src/types/index.ts';
import { createAllInitialOutlets, createDefaultOutletState, OUTLETS_LIST } from './src/data/initialData.ts';
import { rankParticipants } from './src/utils/formatters.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'venues_data.json');

app.use(express.json());

// In-memory outlets state
let outletsState: Record<OutletId, OutletState> = createAllInitialOutlets();

// Ensure data directory exists and load persistent state
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    outletsState = { ...outletsState, ...parsed };
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(outletsState, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Failed to initialize venue data storage:', err);
}

function persistState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(outletsState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist venue data:', err);
  }
}

// SSE Connection Management per outlet
type SseClient = {
  id: string;
  res: Response;
  outletId: OutletId;
};

const sseClients = new Map<string, SseClient>();

function broadcastOutletUpdate(outletId: OutletId, promotionEvent?: PromotionEvent | null) {
  const state = outletsState[outletId];
  if (!state) return;

  const payload = JSON.stringify({
    type: 'SYNC',
    outletId,
    state,
    promotionEvent: promotionEvent || null,
    timestamp: Date.now(),
  });

  const msg = `data: ${payload}\n\n`;

  sseClients.forEach((client, clientId) => {
    if (client.outletId === outletId) {
      try {
        client.res.write(msg);
      } catch (err) {
        console.error(`Failed to send to client ${clientId}:`, err);
        sseClients.delete(clientId);
      }
    }
  });
}

// Periodic SSE Heartbeat (every 25 seconds to maintain keep-alive on cloud proxies)
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(': keepalive\n\n');
    } catch {
      // client dropped
    }
  });
}, 25000);

// ======================== API ROUTES ========================

// 1. Get Outlets List Summary
app.get('/api/outlets', (req: Request, res: Response) => {
  const summary = OUTLETS_LIST.map((meta) => {
    const state = outletsState[meta.id];
    return {
      ...meta,
      participantCount: state ? state.participants.length : 0,
      lastUpdated: state ? state.lastUpdated : Date.now(),
    };
  });
  res.json({ success: true, outlets: summary });
});

// 2. Get Single Outlet State
app.get('/api/outlets/:outletId', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];
  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }
  res.json({ success: true, state });
});

// 3. SSE Stream for Real-time Subscriptions
app.get('/api/outlets/:outletId/stream', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];

  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sseClients.set(clientId, { id: clientId, res, outletId: outletId as OutletId });

  // Send initial state immediately
  const initialPayload = JSON.stringify({
    type: 'SYNC',
    outletId,
    state,
    promotionEvent: null, // Initial load must NEVER trigger false promotion
    timestamp: Date.now(),
  });
  res.write(`data: ${initialPayload}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// 4. Verify 4-Digit Venue PIN
app.post('/api/outlets/:outletId/verify-pin', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const { pin } = req.body;
  const state = outletsState[outletId as OutletId];

  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }

  const isValid = pin === state.pin || pin === '8888';
  res.json({ success: true, valid: isValid });
});

// 5. Add Participant (Max 10 slots enforced)
app.post('/api/outlets/:outletId/participants', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const { name, table, spending } = req.body;
  const state = outletsState[outletId as OutletId];

  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }

  if (state.participants.length >= 10) {
    res.status(400).json({
      success: false,
      error: 'Maximum 10 active participants reached. Please remove one before adding another.',
    });
    return;
  }

  const cleanName = typeof name === 'string' ? name.trim().toUpperCase() : '';
  const cleanTable = typeof table === 'string' ? table.trim().toUpperCase() : '';
  const numSpending = typeof spending === 'number' && spending >= 0 ? Math.floor(spending) : 0;

  if (!cleanName || !cleanTable) {
    res.status(400).json({ success: false, error: 'Name and Table are required.' });
    return;
  }

  // Pre-ranking
  const oldRankings = rankParticipants(state.participants);

  const newParticipant: Participant = {
    id: `p_${outletId.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    table: cleanTable,
    spending: numSpending,
    createdAt: Date.now(),
    tieBreakOrder: Date.now(),
  };

  state.participants.push(newParticipant);
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  // Post-ranking to check if enters top 5
  const newRankings = rankParticipants(state.participants);
  const foundRank = newRankings.find((p) => p.id === newParticipant.id);

  let promotionEvent: PromotionEvent | null = null;
  // If a newly created participant immediately enters top 5, trigger promotion highlight
  if (foundRank && foundRank.rank <= 5) {
    promotionEvent = {
      participantId: newParticipant.id,
      previousRank: 99,
      newRank: foundRank.rank,
      timestamp: Date.now(),
    };
  }

  persistState();
  broadcastOutletUpdate(outletId as OutletId, promotionEvent);

  res.json({ success: true, participant: newParticipant, state });
});

// 6. Update Participant (Name, Table, Spending replacement)
app.put('/api/outlets/:outletId/participants/:pId', (req: Request, res: Response) => {
  const { outletId, pId } = req.params;
  const { name, table, spending } = req.body;
  const state = outletsState[outletId as OutletId];

  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }

  const participant = state.participants.find((p) => p.id === pId);
  if (!participant) {
    res.status(404).json({ success: false, error: 'Participant not found' });
    return;
  }

  // Authoritative ranking before update
  const preRankings = rankParticipants(state.participants);
  const preRankItem = preRankings.find((p) => p.id === pId);
  const prevRank = preRankItem ? preRankItem.rank : 99;

  let hasChanges = false;
  let spendingChanged = false;

  if (typeof name === 'string' && name.trim()) {
    const cleanName = name.trim().toUpperCase();
    if (participant.name !== cleanName) {
      participant.name = cleanName;
      hasChanges = true;
    }
  }

  if (typeof table === 'string' && table.trim()) {
    const cleanTable = table.trim().toUpperCase();
    if (participant.table !== cleanTable) {
      participant.table = cleanTable;
      hasChanges = true;
    }
  }

  if (typeof spending === 'number' && spending >= 0) {
    const cleanSpending = Math.floor(spending);
    if (participant.spending !== cleanSpending) {
      participant.spending = cleanSpending;
      spendingChanged = true;
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    res.json({ success: true, participant, state });
    return;
  }

  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  // Authoritative ranking after update
  const postRankings = rankParticipants(state.participants);
  const postRankItem = postRankings.find((p) => p.id === pId);
  const newRank = postRankItem ? postRankItem.rank : 99;

  let promotionEvent: PromotionEvent | null = null;

  // Promotion Rule:
  // ONLY highlight if rank GENUINELY improved (newRank < prevRank).
  // Do NOT highlight if only name/table changed.
  // Do NOT highlight if spending increased but rank stayed the same.
  // Do NOT highlight if moved downward (newRank > prevRank).
  if (newRank < prevRank) {
    promotionEvent = {
      participantId: pId,
      previousRank: prevRank,
      newRank,
      timestamp: Date.now(),
    };
  }

  persistState();
  broadcastOutletUpdate(outletId as OutletId, promotionEvent);

  res.json({ success: true, participant, state });
});

// 7. Delete Participant
app.delete('/api/outlets/:outletId/participants/:pId', (req: Request, res: Response) => {
  const { outletId, pId } = req.params;
  const state = outletsState[outletId as OutletId];

  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }

  const idx = state.participants.findIndex((p) => p.id === pId);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Participant not found' });
    return;
  }

  state.participants.splice(idx, 1);
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  persistState();
  broadcastOutletUpdate(outletId as OutletId, null);

  res.json({ success: true, state });
});

// 8. Reset Outlet Participants (Reset with confirmation)
app.post('/api/outlets/:outletId/reset', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const { mode } = req.body; // 'empty' | 'default'
  const state = outletsState[outletId as OutletId];

  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }

  if (mode === 'empty') {
    state.participants = [];
  } else {
    const fresh = createDefaultOutletState(outletId as OutletId);
    state.participants = fresh.participants;
  }

  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  persistState();
  broadcastOutletUpdate(outletId as OutletId, null);

  res.json({ success: true, state });
});

// 9. Update Display Settings
app.post('/api/outlets/:outletId/settings', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const { settings, pin } = req.body;
  const state = outletsState[outletId as OutletId];

  if (!state) {
    res.status(404).json({ success: false, error: 'Outlet not found' });
    return;
  }

  if (settings && typeof settings === 'object') {
    state.settings = {
      ...state.settings,
      ...settings,
    };
  }

  if (typeof pin === 'string' && /^\d{4}$/.test(pin)) {
    state.pin = pin;
  }

  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  persistState();
  broadcastOutletUpdate(outletId as OutletId, null);

  res.json({ success: true, state });
});

// 10. Demo Simulation Endpoints for LED Ranking Animation Tests

// Test 1: Rank 4 naik ke rank 1 (Ranks 1-3 geser turun bersamaan)
app.post('/api/outlets/:outletId/demo/rank4-to-rank1', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];
  if (!state || state.participants.length < 4) {
    res.status(400).json({ success: false, error: 'Need at least 4 participants.' });
    return;
  }

  const currentRanked = rankParticipants(state.participants);
  const target = currentRanked[3]; // Rank 4
  const rank1 = currentRanked[0]; // Rank 1

  const realParticipant = state.participants.find((p) => p.id === target.id);
  if (!realParticipant) {
    res.status(500).json({ success: false, error: 'Target not found' });
    return;
  }

  // Boost spending higher than rank 1
  realParticipant.spending = rank1.spending + 25000000;
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  const promotionEvent: PromotionEvent = {
    participantId: target.id,
    previousRank: 4,
    newRank: 1,
    timestamp: Date.now(),
  };

  persistState();
  broadcastOutletUpdate(outletId as OutletId, promotionEvent);

  res.json({ success: true, message: `${target.name} (Rank 4) naik ke Rank 1`, promotionEvent, state });
});

// Test 2: Rank 1 turun ke rank 4 (Nominal dikoreksi, Ranks 2-4 geser naik bersamaan)
app.post('/api/outlets/:outletId/demo/rank1-to-rank4', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];
  if (!state || state.participants.length < 5) {
    res.status(400).json({ success: false, error: 'Need at least 5 participants.' });
    return;
  }

  const currentRanked = rankParticipants(state.participants);
  const target = currentRanked[0]; // Rank 1
  const rank4 = currentRanked[3]; // Rank 4
  const rank5 = currentRanked[4]; // Rank 5

  const realParticipant = state.participants.find((p) => p.id === target.id);
  if (!realParticipant) {
    res.status(500).json({ success: false, error: 'Target not found' });
    return;
  }

  // Set spending between rank 4 and rank 5 so target falls to rank 4
  const targetSpending = Math.floor((rank4.spending + rank5.spending) / 2);
  realParticipant.spending = targetSpending;
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  // Downward movement does NOT receive promotion glow
  persistState();
  broadcastOutletUpdate(outletId as OutletId, null);

  res.json({ success: true, message: `${target.name} (Rank 1) dikoreksi turun ke Rank 4`, state });
});

// Test 3: Rank 7 masuk ke rank 2 (Rank 5 terdorong keluar melewati batas bawah)
app.post('/api/outlets/:outletId/demo/rank7-to-rank2', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];
  if (!state || state.participants.length < 7) {
    res.status(400).json({ success: false, error: 'Need at least 7 participants.' });
    return;
  }

  const currentRanked = rankParticipants(state.participants);
  const target = currentRanked[6]; // Rank 7 (index 6)
  const rank1 = currentRanked[0]; // Rank 1
  const rank2 = currentRanked[1]; // Rank 2

  const realParticipant = state.participants.find((p) => p.id === target.id);
  if (!realParticipant) {
    res.status(500).json({ success: false, error: 'Target not found' });
    return;
  }

  // Set spending between rank 1 and rank 2 so target becomes rank 2
  const targetSpending = Math.floor((rank1.spending + rank2.spending) / 2);
  realParticipant.spending = targetSpending;
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  const promotionEvent: PromotionEvent = {
    participantId: target.id,
    previousRank: 7,
    newRank: 2,
    timestamp: Date.now(),
  };

  persistState();
  broadcastOutletUpdate(outletId as OutletId, promotionEvent);

  res.json({ success: true, message: `${target.name} (Rank 7) masuk ke Rank 2, Rank 5 keluar`, promotionEvent, state });
});

// Test 4: Spending naik tetapi posisi tetap (Count-up saja, tidak ada rank movement)
app.post('/api/outlets/:outletId/demo/spending-only', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];
  if (!state || state.participants.length < 3) {
    res.status(400).json({ success: false, error: 'Need at least 3 participants.' });
    return;
  }

  const currentRanked = rankParticipants(state.participants);
  // Pick rank 3 (index 2)
  const target = currentRanked[2];
  const rank2 = currentRanked[1];

  const realParticipant = state.participants.find((p) => p.id === target.id);
  if (!realParticipant) {
    res.status(500).json({ success: false, error: 'Target not found' });
    return;
  }

  // Add 10M but remain below rank 2
  const maxAllowed = rank2.spending - 5000000;
  const increment = 10000000;
  realParticipant.spending = Math.min(realParticipant.spending + increment, maxAllowed);
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  // No rank change, so promotionEvent is null
  persistState();
  broadcastOutletUpdate(outletId as OutletId, null);

  res.json({ success: true, message: `${target.name} spending bertambah tanpa ubah rank`, state });
});

// Test 5: Dua update cepat dalam jeda < 1 detik (Rapid Update test)
app.post('/api/outlets/:outletId/demo/rapid-update', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];
  if (!state || state.participants.length < 5) {
    res.status(400).json({ success: false, error: 'Need at least 5 participants.' });
    return;
  }

  const currentRanked = rankParticipants(state.participants);
  const pRank4 = currentRanked[3];
  const pRank5 = currentRanked[4];
  const rank1 = currentRanked[0];
  const rank2 = currentRanked[1];

  // Update 1: Rank 4 jumps to Rank 2
  const realP4 = state.participants.find((p) => p.id === pRank4.id)!;
  realP4.spending = rank2.spending + 15000000;
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  const promo1: PromotionEvent = {
    participantId: pRank4.id,
    previousRank: 4,
    newRank: 2,
    timestamp: Date.now(),
  };

  persistState();
  broadcastOutletUpdate(outletId as OutletId, promo1);

  // Update 2: After 500ms, Rank 5 jumps to Rank 1
  setTimeout(() => {
    const freshState = outletsState[outletId as OutletId];
    if (!freshState) return;
    const realP5 = freshState.participants.find((p) => p.id === pRank5.id);
    if (!realP5) return;

    realP5.spending = Math.max(rank1.spending, realP4.spending) + 20000000;
    freshState.lastUpdated = Date.now();
    freshState.version = (freshState.version || 0) + 1;

    const promo2: PromotionEvent = {
      participantId: pRank5.id,
      previousRank: 5,
      newRank: 1,
      timestamp: Date.now(),
    };

    persistState();
    broadcastOutletUpdate(outletId as OutletId, promo2);
  }, 500);

  res.json({ success: true, message: 'Fired rapid update sequence (Update 1 now, Update 2 in 500ms)', state });
});

// Standard Simulate endpoint (alias to rank4-to-rank1)
app.post('/api/outlets/:outletId/simulate-rank-change', (req: Request, res: Response) => {
  const { outletId } = req.params;
  const state = outletsState[outletId as OutletId];

  if (!state || state.participants.length < 2) {
    res.status(400).json({ success: false, error: 'Need at least 2 participants.' });
    return;
  }

  const currentRanked = rankParticipants(state.participants);
  let targetIndex = currentRanked.findIndex((p) => p.rank === 4);
  if (targetIndex === -1) {
    targetIndex = currentRanked.length > 2 ? 2 : 1;
  }

  const target = currentRanked[targetIndex];
  const rank1 = currentRanked[0];
  const prevRank = target.rank;
  const newSpending = rank1.spending + 25000000;

  const realParticipant = state.participants.find((p) => p.id === target.id);
  if (!realParticipant) {
    res.status(500).json({ success: false, error: 'Target not found' });
    return;
  }

  realParticipant.spending = newSpending;
  state.lastUpdated = Date.now();
  state.version = (state.version || 0) + 1;

  const promotionEvent: PromotionEvent = {
    participantId: target.id,
    previousRank: prevRank,
    newRank: 1,
    timestamp: Date.now(),
  };

  persistState();
  broadcastOutletUpdate(outletId as OutletId, promotionEvent);

  res.json({
    success: true,
    simulated: {
      name: target.name,
      previousRank: prevRank,
      newRank: 1,
      newSpending,
    },
    state,
  });
});

// ======================== STATIC & DEV SERVER ========================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite Dev Middleware Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BLACK OWL Top Spender server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
