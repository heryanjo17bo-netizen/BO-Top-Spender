import React, { useEffect, useState } from 'react';
import { OutletId } from './types/index.ts';
import { AdminView } from './components/admin/AdminView.tsx';
import { LedDisplayView } from './components/display/LedDisplayView.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Parse path: /display/:outletId or /admin
  const displayMatch = currentPath.match(/^\/display\/([a-zA-Z0-9_-]+)/i);

  if (displayMatch && displayMatch[1]) {
    const rawOutlet = displayMatch[1].toUpperCase() as OutletId;
    const validOutlets: OutletId[] = ['BOPIK', 'BOKG', 'BOGS', 'BOSCBD', 'BOSBY', 'BOMDN'];
    const outletId = validOutlets.includes(rawOutlet) ? rawOutlet : 'BOSCBD';

    return <LedDisplayView outletId={outletId} />;
  }

  // Check if admin has query param for outlet or default
  const urlParams = new URLSearchParams(window.location.search);
  const outletParam = (urlParams.get('outlet') || 'BOSCBD').toUpperCase() as OutletId;

  // Default to Admin View
  return <AdminView initialOutletId={outletParam} />;
}
