import React, { useState, useEffect, useMemo } from 'react';
import { Account, AppSettings, Category, Profile, SupportedCurrency, Transaction, TransactionType } from '../types';
import { translations, formatCurrency } from '../utils/i18n';
import { CategoryIcon } from './CategoryIcon';
import { QuickAddCalculatorDrawer } from './QuickAddCalculatorDrawer';
import { StorageService } from '../services/storage';
import {
  X,
  ArrowRightLeft,
  Trash2,
  Copy,
  Calculator,
  Plus,
  Sparkles,
  Check,
  ChevronDown,
  ArrowRight,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAddCategory?: (cat: Category) => void;
  initialTransaction?: Transaction | null;
  initialType?: TransactionType;
  initialDate?: string;
  profiles: Profile[];
  categories: Category[];
  accounts: Account[];
  currentProfileId: string;
  currency: SupportedCurrency;
  lang: 'en' | 'hi';
  settings?: AppSettings;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onAddCategory,
  initialTransaction,
  initialType = 'expense',
  initialDate,
  profiles,
  categories,
  accounts,
  currentProfileId,
  currency,
  lang,
  settings,
}) => {
  const t = translations[lang];

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>(defaultTime);
  const [profileId, setProfileId] = useState<string>(currentProfileId === 'all' ? 'home' : currentProfileId);
  const [categoryId, setCategoryId] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // Calculator modal state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  // Quick Add Category Inline State
  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('ShoppingCart');
  const [newCatColor, setNewCatColor] = useState<string>('#10b981');

  // Auto-category suggestion feedback banner
  const [autoSuggestedBadge, setAutoSuggestedBadge] = useState<string | null>(null);

  // Category search / filter text
  const [categorySearchText, setCategorySearchText] = useState<string>('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Focus ref for Description input
  const descInputRef = React.useRef<HTMLInputElement>(null);

  // Available icons & colors for quick category creation
  const quickIcons = [
    'ShoppingCart', 'Milk', 'Carrot', 'Apple', 'Utensils', 'Pizza', 'Fuel', 'Receipt',
    'Coffee', 'Bike', 'Scissors', 'TrendingUp', 'Dog', 'Flame', 'Shirt', 'Sparkles',
    'Smartphone', 'PiggyBank', 'Gift', 'IceCream', 'Pill', 'Flower2', 'Plane',
    'Dumbbell', 'Baby', 'Landmark', 'BookOpen', 'Tv', 'Hotel', 'UserCheck',
    'ShoppingBag', 'Gamepad2', 'PenTool', 'Train', 'Home', 'CreditCard', 'PartyPopper',
    'Car', 'CalendarClock', 'Banknote', 'Milestone', 'ShieldCheck', 'Stethoscope',
    'Film', 'Wrench', 'Zap', 'Droplets', 'Building', 'Wifi', 'Wallet', 'HelpCircle'
  ];

  const quickColors = [
    '#10b981', '#06b6d4', '#84cc16', '#f97316', '#ef4444',
    '#eab308', '#38bdf8', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'
  ];

  // Sync state when editing or opening
  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount.toString());
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || defaultTime);
      setProfileId(initialTransaction.profileId);
      setCategoryId(initialTransaction.categoryId);
      setSubCategory(initialTransaction.subCategory || '');
      setAccountId(initialTransaction.accountId);
      setToAccountId(initialTransaction.toAccountId || '');
      setDescription(initialTransaction.description);
      setNotes(initialTransaction.notes || '');
      setReferenceNo(initialTransaction.referenceNo || '');
      setReceiptImage(initialTransaction.receiptImage || '');
      setAutoSuggestedBadge(null);
    } else {
      const targetType = initialType || 'expense';
      setType(targetType);
      setAmount('');
      // Auto-select current date when opening to add transaction ("+ ke icon open hote he current date auto select ho jaye")
      const localNow = new Date();
      const localYear = localNow.getFullYear();
      const localMonth = String(localNow.getMonth() + 1).padStart(2, '0');
      const localDay = String(localNow.getDate()).padStart(2, '0');
      const todayLocalDate = `${localYear}-${localMonth}-${localDay}`;
      setDate(todayLocalDate);
      setTime(`${String(localNow.getHours()).padStart(2, '0')}:${String(localNow.getMinutes()).padStart(2, '0')}`);
      setProfileId(currentProfileId === 'all' ? 'home' : currentProfileId);
      setSubCategory('');
      setDescription('');
      setNotes('');
      setReferenceNo('');
      setReceiptImage('');
      setAutoSuggestedBadge(null);
      setCategorySearchText('');

      // Auto-select first matching category and account
      const firstCat = categories.find((c) => c.type === (targetType === 'income' ? 'income' : 'expense') && !c.isArchived);
      setCategoryId(firstCat ? firstCat.id : categories[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
    }
    setErrorMsg('');
    setShowConfirmDelete(false);
    setIsQuickAddCategoryOpen(false);
    setIsCategoryDropdownOpen(false);

    // Auto-focus description input
    if (isOpen) {
      const timer = setTimeout(() => {
        descInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [initialTransaction, isOpen, initialType]);

  // Adjust category when transaction type toggles
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'transfer') {
      const matchCat = categories.find((c) => c.type === newType && !c.isArchived);
      if (matchCat) {
        setCategoryId(matchCat.id);
        setSubCategory('');
      }
    }
  };

  // Smart Description Auto-Category detection:
  // "category ko auto karo descripton se wo auto set ho jaye"
  const handleDescriptionChange = (text: string) => {
    setDescription(text);

    if (type !== 'transfer' && text.trim().length >= 1) {
      const lower = text.trim().toLowerCase();

      // 1. Direct match with category name
      const exactCat = categories.find(
        (c) => !c.isArchived && (c.name.toLowerCase() === lower || lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower))
      );
      if (exactCat) {
        setCategoryId(exactCat.id);
        if (exactCat.type !== type) setType(exactCat.type);
        setAutoSuggestedBadge(exactCat.name);
        return;
      }

      // 2. Direct match with subcategory
      const subCatMatch = categories.find((c) =>
        !c.isArchived && c.subcategories?.some((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()))
      );
      if (subCatMatch) {
        setCategoryId(subCatMatch.id);
        if (subCatMatch.type !== type) setType(subCatMatch.type);
        setAutoSuggestedBadge(subCatMatch.name);
        return;
      }

      // 3. StorageService dictionary & learning engine
      const suggestedCatId = StorageService.suggestCategoryForDescription(text);
      if (suggestedCatId) {
        const found = categories.find((c) => c.id === suggestedCatId && !c.isArchived);
        if (found) {
          setCategoryId(found.id);
          if (found.type !== type) {
            setType(found.type);
          }
          setAutoSuggestedBadge(found.name);
          return;
        }
      }
    }
    setAutoSuggestedBadge(null);
  };

  const processImageFile = (file: File) => {
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // High-speed Canvas compressor: downscales large phone screenshots to 1200px max
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setReceiptImage(compressedDataUrl);

          // Extract digits from screenshot filename if amount is not yet set
          if (!amount || amount === '0') {
            const nameMatch = file.name.match(/(\d{2,6}(\.\d{1,2})?)/);
            if (nameMatch && parseFloat(nameMatch[1]) > 5) {
              setAmount(nameMatch[1]);
            }
          }
        } else {
          setReceiptImage(e.target?.result as string);
        }
      };
      img.onerror = () => {
        setErrorMsg('Failed to process screenshot. Please select an image format.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Quick Add Category Handler
  const handleCreateQuickCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = (newCatName || categorySearchText).trim();
    if (!cleanName) return;

    const newCategory: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: cleanName,
      type: type === 'income' ? 'income' : 'expense',
      icon: newCatIcon,
      color: newCatColor,
      isArchived: false,
      subcategories: [],
      isSystem: false,
    };

    StorageService.saveCategory(newCategory);
    onAddCategory?.(newCategory);
    setCategoryId(newCategory.id);
    setIsQuickAddCategoryOpen(false);
    setIsCategoryDropdownOpen(false);
    setNewCatName('');
    setCategorySearchText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (type !== 'transfer' && !categoryId) {
      setErrorMsg('Please select a category.');
      return;
    }

    if (!accountId) {
      setErrorMsg('Please select an account.');
      return;
    }

    if (type === 'transfer' && accountId === toAccountId) {
      setErrorMsg('Source and Destination accounts cannot be the same.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please provide a short description.');
      return;
    }

    onSave({
      id: initialTransaction?.id,
      type,
      amount: parsedAmount,
      currency,
      date,
      time,
      profileId,
      categoryId: type === 'transfer' ? 'transfer_internal' : categoryId,
      subCategory: subCategory.trim() || undefined,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      description: description.trim(),
      notes: notes.trim() || undefined,
      referenceNo: referenceNo.trim() || undefined,
      receiptImage: receiptImage || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  const currentTypeCategories = categories.filter(
    (c) => c.type === (type === 'income' ? 'income' : 'expense') && !c.isArchived
  );

  const filteredCategories = currentTypeCategories.filter((c) =>
    categorySearchText ? c.name.toLowerCase().includes(categorySearchText.toLowerCase()) : true
  );

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {initialTransaction
                  ? t.editTransaction
                  : type === 'income'
                  ? t.quickAddIncome
                  : type === 'transfer'
                  ? t.transferFunds
                  : t.quickAddExpense}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {profiles.find((p) => p.id === profileId)?.name || profileId}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800">
                {errorMsg}
              </div>
            )}

            {/* Type Segmented Buttons matching Screenshot_20261030_215327.jpg */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 text-xs font-extrabold rounded-xl transition-all ${
                  type === 'expense'
                    ? 'bg-[#f43f5e] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-bold'
                }`}
              >
                {t.expense}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2.5 text-xs font-extrabold rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-bold'
                }`}
              >
                {t.income}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`py-2.5 text-xs font-extrabold rounded-xl transition-all ${
                  type === 'transfer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-bold'
                }`}
              >
                {t.transfer}
              </button>
            </div>

            {/* 1st ROW: DESCRIPTION (Standardized h-[52px]) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {t.description} *
                </label>
                {autoSuggestedBadge && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-selected: {autoSuggestedBadge}</span>
                  </span>
                )}
              </div>

              <div className="h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 flex items-center gap-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  ref={descInputRef}
                  type="text"
                  required
                  value={description}
                  autoComplete={settings?.disableAutoSuggestions ? 'off' : 'on'}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="e.g. Morning milk, Petrol fuel, NEA electricity bill..."
                  className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>

              {!settings?.disableAutoSuggestions && (
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Tip: Description likhte hi category apne aap auto-set ho jayegi!
                </p>
              )}
            </div>

            {/* 2nd ROW: AMOUNT (Standardized h-[52px], without Next button) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                {t.amount} ({currency}) *
              </label>

              <div
                onClick={() => setIsCalculatorOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsCalculatorOpen(true);
                  }
                }}
                className="h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center justify-between gap-2.5 select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                    {currency === 'NPR' ? 'रु' : currency === 'INR' ? '₹' : '$'}
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {amount ? amount : <span className="text-slate-400 font-normal">0.00</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd ROW: CATEGORY (Standardized h-[52px], with Grid layout when open) */}
            {type !== 'transfer' && (
              <div className="relative space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t.category}
                </label>

                {/* Category Selection Bar with Logo & Input (h-[52px]) */}
                <div
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  role="button"
                  tabIndex={0}
                  className="h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center justify-between gap-2.5 select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: selectedCategoryObj?.color
                          ? `${selectedCategoryObj.color}25`
                          : '#06b6d425',
                      }}
                    >
                      <CategoryIcon
                        name={selectedCategoryObj?.icon || 'Milk'}
                        className="w-4 h-4"
                        color={selectedCategoryObj?.color || '#06b6d4'}
                      />
                    </div>

                    <div className="min-w-0 truncate">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedCategoryObj?.name || 'Select Category'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Tap to choose category
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Dropdown Menu in GRID format */}
                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={categorySearchText}
                        onChange={(e) => setCategorySearchText(e.target.value)}
                        placeholder="Search or enter category name..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewCatName(categorySearchText.trim());
                          setIsQuickAddCategoryOpen(true);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 whitespace-nowrap text-[11px] shadow-xs cursor-pointer"
                        title="Add New Category"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add</span>
                      </button>
                    </div>

                    {/* CATEGORY GRID */}
                    <div className="max-h-56 overflow-y-auto p-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredCategories.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setCategoryId(cat.id);
                            setSubCategory('');
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all border ${
                            categoryId === cat.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold shadow-2xs'
                              : 'border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${cat.color}25` }}
                          >
                            <CategoryIcon name={cat.icon} className="w-4 h-4" color={cat.color} />
                          </div>
                          <span className="truncate flex-1 text-xs text-slate-900 dark:text-white">
                            {cat.name}
                          </span>
                          {categoryId === cat.id && <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setNewCatName(categorySearchText.trim());
                          setIsQuickAddCategoryOpen(true);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="col-span-2 sm:col-span-3 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {categorySearchText.trim()
                            ? `Create "${categorySearchText.trim()}" category`
                            : '+ Create Custom Category'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4th: PAYMENT ACCOUNT (Category k baad payment ke line) */}
            {type === 'transfer' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.sourceAccount}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.destinationAccount}
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.paymentAccount}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 5th: PROFILE AUR DATE EK HE LINE MEIN ("us k baad ek he line m profile aur date ko add karo") */}
            <div className="grid grid-cols-2 gap-3">
              {/* Profile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.profile}
                </label>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.date}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-[52px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>


            {/* Notes Textarea */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t.notes}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional remarks..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Confirm Delete Section */}
            {showConfirmDelete && initialTransaction && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-300 dark:border-rose-800 space-y-2">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Are you sure you want to permanently delete this transaction?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete?.(initialTransaction.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {initialTransaction && onDelete && !showConfirmDelete && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Delete Transaction"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                {initialTransaction && onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicate(initialTransaction.id);
                      onClose();
                    }}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Duplicate Transaction"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>{initialTransaction ? t.editTransaction : t.saveTransaction}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive In-App Calculator Drawer matching Screenshot_20261031_012809_c064ba33.jpg */}
      <QuickAddCalculatorDrawer
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApplyAmountOnly={(calculatedVal) => {
          setAmount(calculatedVal);
          setIsCalculatorOpen(false);
          // Auto-advance to Category selection
          setTimeout(() => {
            setIsCategoryDropdownOpen(true);
          }, 150);
        }}
        categories={categories}
        accounts={accounts}
        currentProfileId={profileId}
        currency={currency}
        initialType={type === 'income' ? 'income' : 'expense'}
        initialAmount={amount}
        initialDescription={description}
        initialCategoryId={categoryId}
      />

      {/* Quick Add Category Inline Dialog */}
      {isQuickAddCategoryOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                + Quick {t.addCategory} ({type === 'income' ? t.income : t.expense})
              </h3>
              <button
                onClick={() => setIsQuickAddCategoryOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Snacks, Gym, Freelance..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Choose Logo / Icon
                </label>
                <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {quickIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewCatIcon(ic)}
                      className={`p-2 rounded-xl transition-all ${
                        newCatIcon === ic
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Badges */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Color Badge
                </label>
                <div className="flex gap-2 flex-wrap">
                  {quickColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        newCatColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {newCatColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddCategoryOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateQuickCategory()}
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-xs"
                >
                  Create & Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
