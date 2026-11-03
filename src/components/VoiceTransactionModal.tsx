import React, { useState, useEffect, useRef } from 'react';
import { Category, Account, Transaction } from '../types';
import { Mic, MicOff, Check, X, Sparkles, AlertCircle, Volume2, ArrowRight } from 'lucide-react';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (txData: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    accountId: string;
    description: string;
    date: string;
  }) => void;
  categories: Category[];
  accounts: Account[];
  currentProfileId: string;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
  categories,
  accounts,
  currentProfileId,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parsed results
  const [parsedType, setParsedType] = useState<'income' | 'expense'>('expense');
  const [parsedAmount, setParsedAmount] = useState<number>(0);
  const [parsedCategory, setParsedCategory] = useState<Category | null>(null);
  const [parsedDescription, setParsedDescription] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Smart Speech Parser (Hindi & English natural language)
  const parseSpeech = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase().trim();

    // 1. Detect type: Income vs Expense
    let type: 'income' | 'expense' = 'expense';
    const incomeKeywords = [
      'income', 'salary', 'credit', 'credited', 'aaye', 'aaya', 'kamai',
      'aamad', 'bachat', 'mil gaya', 'mila', 'jama', 'profit', 'munafa',
      'tankhwah', 'vetan', 'bonus', 'cashback', 'interest'
    ];
    if (incomeKeywords.some((kw) => lower.includes(kw))) {
      type = 'income';
    }

    // 2. Extract numbers (digits or Hindi/English words)
    let amount = 0;
    // Clean commas e.g. "45,000" -> "45000"
    const cleanedText = lower.replace(/,/g, '');
    const digitMatch = cleanedText.match(/(\d+(\.\d+)?)/);
    if (digitMatch) {
      amount = parseFloat(digitMatch[1]);
    } else {
      // Compound Hindi words: "dedh sau" (150), "dhai sau" (250), "panch sau" (500)
      if (lower.includes('dedh sau') || lower.includes('dedhsau')) amount = 150;
      else if (lower.includes('dhai sau') || lower.includes('dhaisau')) amount = 250;
      else if (lower.includes('panch sau') || lower.includes('paanch sau')) amount = 500;
      else if (lower.includes('do sau')) amount = 200;
      else if (lower.includes('teen sau')) amount = 300;
      else if (lower.includes('char sau')) amount = 400;
      else if (lower.includes('sau') || lower.includes('hundred')) amount = 100;
      else if (lower.includes('pachas') || lower.includes('fifty')) amount = 50;
      else if (lower.includes('bees') || lower.includes('twenty')) amount = 20;
      else if (lower.includes('das') || lower.includes('ten')) amount = 10;
      else if (lower.includes('hazar') || lower.includes('thousand')) amount = 1000;
    }

    // 3. Match Category
    let matchedCat: Category | null = null;
    const catByLower = categories.filter((c) => c.type === type);

    // Direct name match
    for (const c of catByLower) {
      const cName = c.name.toLowerCase();
      if (lower.includes(cName)) {
        matchedCat = c;
        break;
      }
    }

    // Domain heuristic keyword matching
    if (!matchedCat) {
      if (lower.includes('petrol') || lower.includes('diesel') || lower.includes('fuel')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('petrol') || c.name.toLowerCase().includes('fuel')) || null;
      } else if (lower.includes('milk') || lower.includes('doodh') || lower.includes('dairy') || lower.includes('paneer') || lower.includes('curd')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('milk')) || null;
      } else if (lower.includes('sabji') || lower.includes('sabzi') || lower.includes('vegetable') || lower.includes('aloo') || lower.includes('pyaj') || lower.includes('tamatar')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('vegetable')) || null;
      } else if (lower.includes('fruit') || lower.includes('phal') || lower.includes('apple') || lower.includes('kela') || lower.includes('banana')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('fruit')) || null;
      } else if (lower.includes('coffee') || lower.includes('chai') || lower.includes('tea') || lower.includes('cafe')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('coffee') || c.name.toLowerCase().includes('food')) || null;
      } else if (lower.includes('bill') || lower.includes('bijli') || lower.includes('electricity') || lower.includes('water') || lower.includes('pani')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('bill')) || null;
      } else if (lower.includes('salary') || lower.includes('tankhwah') || lower.includes('vetan')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('salary')) || null;
      } else if (lower.includes('medicine') || lower.includes('dawa') || lower.includes('dawai') || lower.includes('doctor')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('medicine') || c.name.toLowerCase().includes('doctor')) || null;
      } else if (lower.includes('recharge') || lower.includes('mobile') || lower.includes('wifi') || lower.includes('cable')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('recharge') || c.name.toLowerCase().includes('cable')) || null;
      } else if (lower.includes('rent') || lower.includes('kiraya') || lower.includes('home loan') || lower.includes('emi')) {
        matchedCat = categories.find((c) => c.name.toLowerCase().includes('rent') || c.name.toLowerCase().includes('loan') || c.name.toLowerCase().includes('emi')) || null;
      }
    }

    if (!matchedCat) {
      matchedCat = catByLower[0] || categories[0] || null;
    }

    // 4. Clean description
    let cleanDesc = text
      .replace(/(\d+(\.\d+)?)/g, '')
      .replace(/rupees|rupee|rs|inr|rupya|rupaye|kharcha|expense|income|credit|debit|ka|ki|ke|liye|me|se|spent|paid/gi, '')
      .trim();
    if (!cleanDesc) {
      cleanDesc = matchedCat ? matchedCat.name : (type === 'income' ? 'Income' : 'Expense');
    }

    setParsedType(type);
    setParsedAmount(amount);
    setParsedCategory(matchedCat);
    setParsedDescription(cleanDesc);
  };

  const startListening = async () => {
    setErrorMsg(null);

    // Explicitly prompt microphone permission if available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('Microphone permission request:', permErr);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('Microphone/Speech Recognition not supported by this browser. Type voice command below or tap presets.');
      return;
    }

    try {
      // Stop previous instance if running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        parseSpeech(transcriptText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was blocked. Please grant microphone permission in browser settings.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('No speech detected. Please tap mic and speak clearly.');
        } else {
          setErrorMsg(`Voice status: ${event.error}. You can also type text or pick presets below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setErrorMsg('Could not initialize microphone. Please type command or use presets below.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  const handleUseSample = (sample: string) => {
    setTranscript(sample);
    parseSpeech(sample);
  };

  const handleManualTextChange = (val: string) => {
    setTranscript(val);
    parseSpeech(val);
  };

  const handleConfirmSave = () => {
    if (parsedAmount <= 0) {
      setErrorMsg('Please specify a valid amount greater than 0.');
      return;
    }

    const defaultAccount = accounts[0]?.id || 'cash';
    const defaultCat = parsedCategory?.id || (categories.find((c) => c.type === parsedType)?.id || categories[0]?.id);

    onSaveTransaction({
      type: parsedType,
      amount: parsedAmount,
      categoryId: defaultCat,
      accountId: defaultAccount,
      description: parsedDescription || (parsedType === 'income' ? 'Income' : 'Expense'),
      date: new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  // Reset when opening - DO NOT call startListening() automatically to prevent browser permission blocks!
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setParsedAmount(0);
      setParsedDescription('');
      setErrorMsg(null);
      setIsListening(false);
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Voice Entry (बोलकर जोड़ें)</h3>
              <p className="text-[10px] text-slate-400">Speak transaction e.g., "500 Petrol" or "Salary 45000"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-center flex flex-col items-center">
          {/* Language selector toggle */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setVoiceLang('hi-IN');
                if (isListening) stopListening();
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                voiceLang === 'hi-IN'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => {
                setVoiceLang('en-IN');
                if (isListening) stopListening();
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                voiceLang === 'en-IN'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              English
            </button>
          </div>

          {/* Big Mic Button with Pulsing Wave Animation */}
          <div className="relative py-2 flex flex-col items-center">
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-rose-500/25 animate-ping scale-150" />
                <span className="absolute inset-0 rounded-full bg-rose-500/15 animate-pulse scale-125" />
              </>
            )}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all relative z-10 active:scale-95 ${
                isListening
                  ? 'bg-rose-500 shadow-rose-500/40 ring-4 ring-rose-400/40 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isListening ? '🎙️ Listening... speak now (सुन रहे हैं, बोलें)' : 'Tap microphone to start speaking'}
          </p>

          {/* Spoken Text / Live Input Box */}
          <div className="w-full text-left space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Spoken Text / Live Transcript
            </label>
            <div className="relative">
              <input
                type="text"
                value={transcript}
                onChange={(e) => handleManualTextChange(e.target.value)}
                placeholder='उदा. "500 Petrol", "Salary 50000", "Milk 60", "Chai 20"...'
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Voice Preset Chips */}
          <div className="w-full text-left space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Test Examples (क्लिक करके टेस्ट करें)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                '500 Petrol',
                '60 Milk',
                '150 Sabji',
                'Salary 45000',
                '20 Chai',
                '1200 Bijli Bill',
                'Doctor 350',
                'Office Pashupati 2500',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleUseSample(sample)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Error notice if any */}
          {errorMsg && (
            <div className="w-full p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Live Transaction Card */}
          {parsedAmount > 0 && (
            <div className="w-full bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-3 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Recognized Transaction
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    parsedType === 'income'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                  }`}
                >
                  {parsedType === 'income' ? 'Income (Credit)' : 'Expense (Debit)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {parsedDescription}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Category: {parsedCategory?.name || 'General'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={parsedAmount <= 0}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              parsedAmount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Add Transaction (जोड़ें)
          </button>
        </div>
      </div>
    </div>
  );
};
