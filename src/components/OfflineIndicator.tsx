import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWA';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-xl border-2 border-[#1E1B18] bg-[#FFFDF8] px-3 py-1.5 text-xs font-bold text-[#1E1B18] cartoon-shadow-sm"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#D97706]" />
      <span>Modo offline · Jogo salvo localmente</span>
    </div>
  );
};
