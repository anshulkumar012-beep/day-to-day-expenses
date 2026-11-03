import React, { useState } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';

interface PWAInstallBannerProps {
  isInstalled: boolean;
  onOpenInstallModal: () => void;
  lang?: 'en' | 'hi';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  isInstalled,
  onOpenInstallModal,
  lang = 'en',
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Suppress banner when running as an installed PWA / standalone WebAPK
  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto my-2 px-3 sm:px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black tracking-tight flex items-center gap-1.5 truncate">
            <span>{lang === 'hi' ? 'फोन में ऐप इंस्टॉल करें' : 'Install on Android / Phone'}</span>
            <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
              PWA
            </span>
          </div>
          <div className="text-[11px] text-emerald-100 truncate">
            {lang === 'hi'
              ? 'बिना किसी Parse Error के होम स्क्रीन पर चलाएं'
              : 'Add to home screen for fast 100% offline access'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={onOpenInstallModal}
          className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{lang === 'hi' ? 'इंस्टॉल' : 'Install'}</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/20 text-emerald-100 hover:text-white transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
