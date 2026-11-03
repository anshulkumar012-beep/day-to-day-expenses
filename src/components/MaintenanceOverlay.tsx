import React from 'react';
import { AlertTriangle, Clock, RefreshCw, ShieldCheck, Mail } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../services/cloudStorage';

interface MaintenanceOverlayProps {
  message: string;
  onRefresh: () => void;
  lang: 'en' | 'hi';
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  message,
  onRefresh,
  lang,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-8 h-8 stroke-[2.2] animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {lang === 'hi' ? 'रखरखाव जारी (Maintenance)' : 'Scheduled Maintenance'}
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'hi' ? 'प्लेटफ़ॉर्म अपग्रेड जारी है' : 'Under Scheduled Maintenance'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {message || 'We are currently performing scheduled maintenance to upgrade system reliability and security. Please check back shortly.'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{lang === 'hi' ? 'आपका डेटा 100% सुरक्षित है' : 'Your data is 100% safe & protected'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
            {lang === 'hi'
              ? 'अपग्रेड के दौरान नया डेटा दर्ज करना अस्थायी रूप से प्रतिबंधित है।'
              : 'Data modifications are temporarily restricted while server updates complete.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{lang === 'hi' ? 'स्थिति पुनः जांचें (Check Status)' : 'Check System Status'}</span>
          </button>

          <a
            href={`mailto:${SUPER_ADMIN_EMAIL}?subject=Maintenance Inquiry - Day to Day Expenses`}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 pt-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Administrator ({SUPER_ADMIN_EMAIL})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
