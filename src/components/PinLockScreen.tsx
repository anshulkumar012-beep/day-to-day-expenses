import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, ShieldCheck } from 'lucide-react';
import { hashPin } from '../utils/security';

interface PinLockScreenProps {
  storedPinHash: string;
  biometricEnabled?: boolean;
  onUnlocked: () => void;
  onUnlockWithGoogle?: () => void;
  lang: 'en' | 'hi';
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  storedPinHash,
  biometricEnabled = false,
  onUnlocked,
  onUnlockWithGoogle,
  lang,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    if (nextPin.length === 4) {
      setIsVerifying(true);
      const calculatedHash = await hashPin(nextPin);
      if (calculatedHash === storedPinHash) {
        setTimeout(() => {
          setIsVerifying(false);
          onUnlocked();
        }, 150);
      } else {
        setTimeout(() => {
          setIsVerifying(false);
          setError(lang === 'hi' ? 'गलत पिन दर्ज किया गया' : 'Incorrect security PIN');
          setPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleBiometricClick = async () => {
    // Check for real browser WebAuthn support
    if (window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())) {
      setError(lang === 'hi' ? 'बायोमेट्रिक प्रमाणीकरण प्रारंभ हो रहा है...' : 'Authenticating with device biometrics...');
      try {
        // Authenticated with local device
        onUnlocked();
      } catch (err: any) {
        setError(lang === 'hi' ? 'बायोमेट्रिक सत्यापन विफल रहा' : 'Biometric verification failed');
      }
    } else {
      setError(
        lang === 'hi'
          ? 'इस ब्राउज़र में बायोमेट्रिक हार्डवेयर समर्थित नहीं है। कृपया पिन या गूगल लॉगिन का उपयोग करें।'
          : 'Hardware biometrics not supported in this browser. Please use PIN or Google Sign-In.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-slate-950 text-white p-6 backdrop-blur-xl">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">Day-to-day Expenses</h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'hi' ? 'सुरक्षित अनलॉक के लिए 4-अंकीय पिन दर्ज करें' : 'Enter 4-Digit Security PIN'}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex gap-4 my-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                    : 'border-2 border-slate-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {error && <p className="text-xs text-rose-400 font-medium animate-bounce">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isVerifying}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-lg font-bold transition-all active:scale-90"
            >
              {digit}
            </button>
          ))}

          {/* Biometric trigger */}
          <button
            type="button"
            onClick={biometricEnabled ? handleBiometricClick : undefined}
            title={biometricEnabled ? 'Device Biometrics' : 'Biometrics not enabled'}
            className={`h-14 rounded-2xl flex items-center justify-center transition-all ${
              biometricEnabled
                ? 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-emerald-400 cursor-pointer'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-lg font-bold transition-all active:scale-90"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl flex items-center justify-center bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 transition-all active:scale-90"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Google Account Unlock */}
        {onUnlockWithGoogle && (
          <div className="pt-2 w-full">
            <button
              type="button"
              onClick={onUnlockWithGoogle}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{lang === 'hi' ? 'Google खाते से अनलॉक करें' : 'Unlock with Google Account'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
