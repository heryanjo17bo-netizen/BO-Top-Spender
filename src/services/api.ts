import { DisplaySettings, OutletId, OutletMeta, OutletState, Participant, PromotionEvent } from '../types/index.ts';

export interface OutletSummary extends OutletMeta {
  participantCount: number;
  lastUpdated: number;
}

export async function fetchOutlets(): Promise<OutletSummary[]> {
  const res = await fetch('/api/outlets');
  if (!res.ok) throw new Error('Failed to fetch outlets list');
  const data = await res.json();
  return data.outlets;
}

export async function fetchOutletState(outletId: OutletId): Promise<OutletState> {
  const res = await fetch(`/api/outlets/${outletId}`);
  if (!res.ok) throw new Error(`Failed to fetch state for ${outletId}`);
  const data = await res.json();
  return data.state;
}

export function subscribeToOutlet(
  outletId: OutletId,
  onUpdate: (payload: { state: OutletState; promotionEvent: PromotionEvent | null }) => void,
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected') => void
): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;
  let reconnectTimeout: any = null;
  let retryCount = 0;

  function connect() {
    if (isClosed) return;
    onStatusChange?.('connecting');

    try {
      eventSource = new EventSource(`/api/outlets/${outletId}/stream`);

      eventSource.onopen = () => {
        retryCount = 0;
        onStatusChange?.('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type === 'SYNC' && parsed.state) {
            onUpdate({
              state: parsed.state,
              promotionEvent: parsed.promotionEvent || null,
            });
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        onStatusChange?.('disconnected');
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        if (!isClosed) {
          const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000);
          retryCount++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    } catch {
      onStatusChange?.('disconnected');
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

export async function verifyVenuePin(outletId: OutletId, pin: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/outlets/${outletId}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    return !!data.valid;
  } catch {
    return false;
  }
}

export async function addParticipant(
  outletId: OutletId,
  payload: { name: string; table: string; spending: number }
): Promise<Participant> {
  const res = await fetch(`/api/outlets/${outletId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to add participant');
  }
  return data.participant;
}

export async function updateParticipant(
  outletId: OutletId,
  participantId: string,
  payload: { name?: string; table?: string; spending?: number }
): Promise<Participant> {
  const res = await fetch(`/api/outlets/${outletId}/participants/${participantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update participant');
  }
  return data.participant;
}

export async function deleteParticipant(outletId: OutletId, participantId: string): Promise<void> {
  const res = await fetch(`/api/outlets/${outletId}/participants/${participantId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete participant');
  }
}

export async function resetOutlet(outletId: OutletId, mode: 'empty' | 'default'): Promise<void> {
  const res = await fetch(`/api/outlets/${outletId}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reset outlet');
  }
}

export async function updateDisplaySettings(
  outletId: OutletId,
  settings: Partial<DisplaySettings>,
  pin?: string
): Promise<void> {
  const res = await fetch(`/api/outlets/${outletId}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings, pin }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update settings');
  }
}

export async function simulateRankChange(outletId: OutletId): Promise<any> {
  const res = await fetch(`/api/outlets/${outletId}/simulate-rank-change`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to simulate rank change');
  }
  return data.simulated;
}

export async function demoRank4ToRank1(outletId: OutletId): Promise<any> {
  const res = await fetch(`/api/outlets/${outletId}/demo/rank4-to-rank1`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed demo test 1');
  return data;
}

export async function demoRank1ToRank4(outletId: OutletId): Promise<any> {
  const res = await fetch(`/api/outlets/${outletId}/demo/rank1-to-rank4`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed demo test 2');
  return data;
}

export async function demoRank7ToRank2(outletId: OutletId): Promise<any> {
  const res = await fetch(`/api/outlets/${outletId}/demo/rank7-to-rank2`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed demo test 3');
  return data;
}

export async function demoSpendingOnly(outletId: OutletId): Promise<any> {
  const res = await fetch(`/api/outlets/${outletId}/demo/spending-only`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed demo test 4');
  return data;
}

export async function demoRapidUpdate(outletId: OutletId): Promise<any> {
  const res = await fetch(`/api/outlets/${outletId}/demo/rapid-update`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed demo test 5');
  return data;
}
