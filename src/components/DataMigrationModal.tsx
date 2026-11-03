import React, { useState } from 'react';
import { Cloud, CheckCircle, ShieldCheck, X, ArrowRight, Loader2, Database } from 'lucide-react';

interface DataMigrationModalProps {
  isOpen: boolean;
  userEmail?: string;
  localTransactionCount: number;
  onConfirm: () => Promise<void>;
  onDismiss?: () => void;
  onClose?: () => void;
  lang: 'en' | 'hi';
}

export const DataMigrationModal: React.FC<DataMigrationModalProps> = ({
  isOpen,
  userEmail = '',
  localTransactionCount,
  onConfirm,
  onDismiss,
  onClose,
  lang,
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    if (onClose) onClose();
    else if (onDismiss) onDismiss();
  };

  if (!isOpen) return null;

  const handleMigrate = async () => {
    setIsMigrating(true);
    setErrorMsg('');
    try {
      await onConfirm();
    } catch (e: any) {
      setErrorMsg(e.message || 'Migration failed. Please try again.');
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 text-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'hi' ? 'क्लाउड डेटा सिंक (Cloud Sync)' : 'Sync Local Data to Cloud'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isMigrating}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Content */}
        <div className="space-y-3 text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {lang === 'hi' ? 'स्थानीय लेन-देन (Local Transactions):' : 'Local transactions found:'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
              {localTransactionCount} items
            </span>
          </div>

          <p className="leading-relaxed text-[11px]">
            {lang === 'hi'
              ? 'क्या आप इस फोन/ब्राउज़र में मौजूद अपने लेन-देन को अपने सुरक्षित Google खाते में अपलोड करके सिंक करना चाहते हैं? इससे आप किसी भी फोन या कंप्यूटर पर अपना डेटा देख सकेंगे।'
              : 'Would you like to securely import and sync your offline local transactions into your private Google account? This allows instant multi-device access across your phone and desktop.'}
          </p>

          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{lang === 'hi' ? 'केवल आपके खाते में सुरक्षित (Private to your UID)' : 'Strictly isolated to your private account'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{lang === 'hi' ? 'डुप्लीकेट एंट्री रोकी जाएगी (No duplicates)' : 'Smart deduplication prevents repeated records'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{lang === 'hi' ? 'लोकल डेटा सुरक्षित रहेगा (No data loss)' : 'Local backup remains safe on this device'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isMigrating}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {lang === 'hi' ? 'केवल लोकल रखें' : 'Keep Local Only'}
          </button>
          <button
            type="button"
            onClick={handleMigrate}
            disabled={isMigrating}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'hi' ? 'सिंक हो रहा है...' : 'Syncing...'}</span>
              </>
            ) : (
              <>
                <span>{lang === 'hi' ? 'खाते में सिंक करें' : 'Sync to My Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
