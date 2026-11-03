import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  lang?: 'en' | 'hi';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang = 'en' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/95 dark:bg-amber-700/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/30 animate-in slide-in-from-bottom-2 duration-200">
      <WifiOff className="w-4 h-4 text-amber-200 flex-shrink-0 animate-pulse" />
      <span>
        {lang === 'hi'
          ? 'ऑफ़लाइन मोड — स्थानीय डेटा सुरक्षित रूप से उपलब्ध है'
          : 'Offline Mode — Local data is safely available'}
      </span>
    </div>
  );
};
