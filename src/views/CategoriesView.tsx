import React, { useState } from 'react';
import { AppSettings, Category, Transaction } from '../types';
import { translations } from '../utils/i18n';
import { CategoryIcon } from '../components/CategoryIcon';
import { Plus, Archive, ArchiveRestore, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  settings: AppSettings;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => { success: boolean; message?: string };
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  settings,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const t = translations[settings.language];
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('ShoppingCart');
  const [subcategoriesStr, setSubcategoriesStr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  const availableIcons = [
    'ShoppingCart', 'Coffee', 'Apple', 'Utensils', 'Fuel', 'Zap', 'Droplets',
    'Wifi', 'Building', 'Wrench', 'Bus', 'HeartPulse', 'GraduationCap', 'ShoppingBag',
    'Tv', 'FileText', 'Users', 'Wallet', 'TrendingUp', 'BarChart2', 'Percent', 'Gift', 'HelpCircle'
  ];

  const availableColors = [
    '#10b981', '#06b6d4', '#84cc16', '#f97316', '#ef4444',
    '#eab308', '#38bdf8', '#6366f1', '#8b5cf6', '#ec4899',
    '#f43f5e', '#14b8a6', '#d946ef', '#f59e0b', '#64748b'
  ];

  const handleOpenModal = (cat?: Category) => {
    setErrorMsg('');
    setDeleteWarning(null);
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setColor(cat.color);
      setIcon(cat.icon);
      setSubcategoriesStr(cat.subcategories.join(', '));
    } else {
      setEditingCategory(null);
      setName('');
      setColor(activeTab === 'expense' ? '#ef4444' : '#10b981');
      setIcon(activeTab === 'expense' ? 'ShoppingCart' : 'Wallet');
      setSubcategoriesStr('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    const subcategories = subcategoriesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updatedCat: Category = {
      id: editingCategory ? editingCategory.id : `cat_${Date.now()}`,
      name: name.trim(),
      type: editingCategory ? editingCategory.type : activeTab,
      icon,
      color,
      isArchived: editingCategory ? editingCategory.isArchived : false,
      subcategories,
      isSystem: editingCategory ? editingCategory.isSystem : false,
    };

    onSaveCategory(updatedCat);
    setIsModalOpen(false);
  };

  const handleToggleArchive = (cat: Category) => {
    onSaveCategory({
      ...cat,
      isArchived: !cat.isArchived,
    });
  };

  const handleDelete = (cat: Category) => {
    const result = onDeleteCategory(cat.id);
    if (!result.success) {
      setDeleteWarning(result.message || 'Cannot delete category.');
    } else {
      setIsModalOpen(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <div className="space-y-5 pb-20">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.categoriesTitle}</h2>
          <p className="text-xs text-slate-400">Manage expense and income tags</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCategory}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'expense'
              ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t.expenseCategories} ({categories.filter((c) => c.type === 'expense').length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'income'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t.incomeCategories} ({categories.filter((c) => c.type === 'income').length})
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredCategories.map((cat) => {
          const usageCount = transactions.filter((t) => t.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl border transition-all ${
                cat.isArchived
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}25` }}
                  >
                    <CategoryIcon name={cat.icon} className="w-5 h-5" color={cat.color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      {cat.isArchived && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 font-normal">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {usageCount} transaction{usageCount === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleArchive(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={cat.isArchived ? 'Restore Category' : 'Archive Category'}
                  >
                    {cat.isArchived ? (
                      <ArchiveRestore className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenModal(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={t.editCategory}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCategory ? t.editCategory : t.addCategory}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                  {errorMsg}
                </div>
              )}

              {deleteWarning && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{deleteWarning}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.categoryName} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vegetables, Internet, Fuel"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Subcategories comma separated */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Subcategories (comma separated)
                </label>
                <input
                  type="text"
                  value={subcategoriesStr}
                  onChange={(e) => setSubcategoriesStr(e.target.value)}
                  placeholder="e.g. Milk, Curd, Butter, Paneer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Icon selector */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Select Icon
                </label>
                <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-xl transition-all ${
                        icon === ic
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color badges */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Color Badge
                </label>
                <div className="flex gap-2 flex-wrap">
                  {availableColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {editingCategory ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingCategory)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="Delete Category"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
