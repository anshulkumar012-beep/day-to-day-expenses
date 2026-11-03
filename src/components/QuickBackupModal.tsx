import React, { useState } from 'react';
import { X, Download, Upload, Lock, Database, Check, ShieldCheck } from 'lucide-react';
import { StorageService } from '../services/storage';
import { encryptData, decryptData } from '../utils/security';

interface QuickBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const QuickBackupModal: React.FC<QuickBackupModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  const [backupPassword, setBackupPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [restorePreview, setRestorePreview] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const snapshot = StorageService.exportDatabaseSnapshot();
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DayToDay_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Backup downloaded successfully (JSON)!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDownloadEncrypted = async () => {
    if (!backupPassword.trim()) {
      setErrorMsg('Please enter an encryption password.');
      return;
    }
    setErrorMsg('');
    const snapshot = StorageService.exportDatabaseSnapshot();
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const encrypted = await encryptData(jsonStr, backupPassword);
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DayToDay_Encrypted_${new Date().toISOString().split('T')[0]}.d2d`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Encrypted backup (.d2d) saved!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        let snapshotData: any;

        if (file.name.endsWith('.d2d')) {
          const pass = prompt('Enter the decryption password for this backup:');
          if (!pass) return;
          const decrypted = await decryptData(text, pass);
          snapshotData = JSON.parse(decrypted);
        } else {
          snapshotData = JSON.parse(text);
        }

        if (!snapshotData || !Array.isArray(snapshotData.transactions)) {
          setErrorMsg('Invalid backup file structure.');
          return;
        }

        setRestorePreview(snapshotData);
      } catch (err: any) {
        setErrorMsg('Failed to read or decrypt backup file: ' + (err.message || 'Error'));
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRestore = () => {
    if (!restorePreview) return;
    const result = StorageService.restoreDatabaseSnapshot(restorePreview);
    if (result.success) {
      setRestorePreview(null);
      onRefreshData();
      setSuccessMsg(`Restored ${result.count} transactions successfully!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } else {
      setErrorMsg(result.message || 'Restore failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Backup & Restore Data</h3>
              <p className="text-[10px] text-slate-400">Offline, local-first backup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Backup Actions */}
        <div className="space-y-3 pt-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Create Backup File</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Download your complete transaction history, categories, accounts, and profiles.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="flex-1 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90"
              >
                Download JSON
              </button>
            </div>
          </div>

          {/* Encrypted option */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>AES-256 Encrypted Backup (.d2d)</span>
            </div>
            <input
              type="password"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Enter backup password"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
            <button
              type="button"
              onClick={handleDownloadEncrypted}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
            >
              Generate Password-Protected Backup
            </button>
          </div>

          {/* Restore Section */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Restore from Backup</span>
            </div>
            <input
              type="file"
              accept=".json,.d2d"
              onChange={handleFileSelect}
              className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
            />
            {restorePreview && (
              <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  Ready to Restore {restorePreview.transactions?.length || 0} transactions!
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApplyRestore}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                  >
                    Confirm & Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestorePreview(null)}
                    className="px-2.5 py-1.5 text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
