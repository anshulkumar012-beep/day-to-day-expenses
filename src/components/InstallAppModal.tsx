import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  WifiOff,
  Maximize2,
  Zap,
  AlertTriangle,
  HelpCircle,
  FileCode2,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { generateStandaloneAppHtml } from '../utils/standaloneAppBundle';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any | null;
  onTriggerInstall: () => Promise<boolean>;
  isInstalled: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
  isInstalled,
}) => {
  const [installing, setInstalling] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'1tap' | 'download_file' | 'solution'>('1tap');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch {
      // fallback
    }
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const outcome = await onTriggerInstall();
      if (outcome) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDownloadPhoneAppFile = () => {
    try {
      const snapshot = StorageService.exportDatabaseSnapshot();
      const htmlContent = generateStandaloneAppHtml(snapshot);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DayToDayExpenses_Phone_App.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0d6e5a] text-white flex items-center justify-center shadow-md shadow-emerald-900/20">
              <Smartphone className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Phone App & Download</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  Zero Parse Error
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                फोन में इंस्टॉल करें या ऑफलाइन फाइल डाउनलोड करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-5 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('1tap')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === '1tap'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>1-Tap Install</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('download_file')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'download_file'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download Offline File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solution')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'solution'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Parse Error Guide</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {/* TAB 1: 1-Tap Install (WebAPK) */}
          {activeTab === '1tap' && (
            <div className="space-y-4">
              {/* Parse Error Notification Badge */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug">
                  <strong>"There was a problem while parsing the package" एरर क्यों आता है?</strong>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                    एंड्रॉयड फोन अनकंपाइल्ड ज़िप APK को सुरक्षा कारणों से ब्लॉक कर देता है। नीचे दिए गए <strong>1-Tap Install</strong> से Google Play Services आपके फोन में सुरक्षित असली WebAPK खुद इनस्टॉल कर देता है।
                  </p>
                </div>
              </div>

              {/* Already installed state */}
              {isInstalled ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-7 h-7 flex-shrink-0 text-emerald-600" />
                  <div>
                    <div className="font-extrabold text-sm">App Already Installed!</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      "Day to Day Expenses" आपके फोन के होम स्क्रीन और ऐप ड्रॉअर (App Drawer) में सफलतापूर्वक इंस्टॉल है।
                    </div>
                  </div>
                </div>
              ) : deferredPrompt ? (
                /* Native browser install prompt ready */
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-extrabold text-sm">
                      <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                      <span>Ready to Install on Phone</span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full uppercase">
                      Official WebAPK
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs">
                    नीचे बटन पर क्लिक करें। Google Chrome आपके फोन में बिना किसी एरर के ऐप को सीधे होम स्क्रीन व ऐप लिस्ट में जोड़ देगा:
                  </p>

                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="w-full py-3.5 bg-[#0d6e5a] hover:bg-[#0a5c4b] active:scale-98 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-900/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5 stroke-[2.5]" />
                    <span>{installing ? 'Installing App on Phone...' : '⚡ Install App on Phone Now'}</span>
                  </button>
                </div>
              ) : (
                /* Chrome Step-by-Step Guide when inside iframe or prompt pending */
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Chrome Browser से 2 सेकंड में इनस्टॉल करने का तरीका:</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                      {/* Step 1 */}
                      <div className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          1
                        </span>
                        <div>
                          <strong>Chrome ब्राउज़र में ऊपर दाईं ओर 3 डॉट्स (⋮) पर टैप करें:</strong>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            यदि आप इन-ऐप प्रीव्यू में हैं, तो पहले नीचे दिए गए बटन से लिंक कॉपी करके Chrome में खोलें।
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          2
                        </span>
                        <div>
                          <strong>"Install app" या "Add to Home screen" चुनें:</strong>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            (हिंदी में: "ऐप इंस्टॉल करें" या "होम स्क्रीन पर जोड़ें")
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          3
                        </span>
                        <div>
                          <strong>"Install" (या Add) पर टैप करें:</strong>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Google Play Services फोन में वास्तविक <strong>WebAPK</strong> बना देगा। कोई Parse Error नहीं आएगा!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Copy Link Action */}
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copiedUrl ? '✓ Link Copied! Chrome me paste karein' : 'Copy App URL to Open in Chrome'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <WifiOff className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">100% Offline</div>
                    <div className="text-[10px] text-slate-500">बिना इंटरनेट सभी एंट्रीज सुरक्षित रहेंगी</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <Maximize2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Full Screen</div>
                    <div className="text-[10px] text-slate-500">असली नेटिव ऐप जैसा अनुभव</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">No Parse Error</div>
                    <div className="text-[10px] text-slate-500">Google द्वारा हस्ताक्षरित WebAPK</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Auto Updates</div>
                    <div className="text-[10px] text-slate-500">नए फीचर्स अपने आप अपडेट होंगे</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Download Offline Phone App File (.html) */}
          {activeTab === 'download_file' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-xs">
                  <FileCode2 className="w-5 h-5 text-emerald-600" />
                  <span>Standalone Phone App File (डायरेक्ट फोन में चलाएं)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  इस फाइल को सीधे अपने फोन के स्टोरेज में डाउनलोड करें। फोन में डाउनलोड होने के बाद इस पर टैप करें और Chrome में खोलें — यह <strong>100% ऑफलाइन</strong> काम करेगी और इसमें <strong>कोई 'Parse Error' नहीं आएगा!</strong>
                </p>

                {downloadSuccess && (
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>फाइल डाउनलोड हो गई! अपने फोन के Downloads फोल्डर में चेक करें।</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDownloadPhoneAppFile}
                  className="w-full py-3.5 bg-[#0d6e5a] hover:bg-[#0a5c4b] active:scale-98 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Phone App File (DayToDayExpenses_Phone_App.html)</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  📱 फोन में उपयोग करने के आसान 3 स्टेप्स:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <li>ऊपर दिए गए हरे बटन पर क्लिक करके फाइल डाउनलोड करें।</li>
                  <li>फोन के <strong>'Files' या 'Downloads'</strong> फोल्डर में जाएं और <code>DayToDayExpenses_Phone_App.html</code> पर टैप करें।</li>
                  <li>Chrome में खोलकर ऊपर 3-डॉट्स (⋮) पर क्लिक करें और <strong>"Add to Home screen"</strong> दबाएं। ऐप का आइकन हमेशा के लिए आपके फोन पर आ जाएगा!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Detailed Explanation of Parse Error */}
          {activeTab === 'solution' && (
            <div className="space-y-3">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>"There was a problem while parsing the package" क्यों आता है?</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  Android OS का <strong>PackageInstaller</strong> किसी भी <code>.apk</code> फाइल को इनस्टॉल करने से पहले यह चेक करता है कि क्या वह Android SDK के <code>aapt2</code> कंपाइलर द्वारा बाइनरी रूप में कंपाइल और V2/V3 की से हस्ताक्षरित (Signed) है या नहीं।
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  ब्राउज़र से डाउनलोड की गई डायरेक्ट ज़िप फाइल में बाइनरी कंपाइलेशन न होने के कारण Android सुरक्षा तंत्र उसे अमान्य पैकेज मानकर <strong>Parse Error</strong> दिखा देता है।
                </p>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>गारंटीड समाधान (Solution):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>1-Tap Install (अनुशंसित):</strong> पहले टैब में दिए गए <strong>"1-Tap Install"</strong> या Chrome के 3-डॉट्स (⋮) &gt; "Install app" का उपयोग करें। इसमें आपका फोन खुद प्रमाणित WebAPK बनाता है।
                  </li>
                  <li>
                    <strong>Download Offline File:</strong> दूसरे टैब से <code>.html</code> ऐप फाइल डाउनलोड करें, जो बिना किसी एरर के फोन में ऑफलाइन चलती है।
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-medium">
            Version 1.0.0 • Day to Day Expenses
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

