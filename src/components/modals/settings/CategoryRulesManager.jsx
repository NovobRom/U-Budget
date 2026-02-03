import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import { getCategoryRules, saveCategoryRules, getDefaultRules } from '../../../services/categoryRules.service';

/**
 * CategoryRulesManager
 * UI for managing keyword-to-category rules for auto-categorization during import.
 */
export default function CategoryRulesManager({
    budgetId,
    categories = [],
    getCategoryName,
    t = {}
}) {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newKeyword, setNewKeyword] = useState('');
    const [newCategoryId, setNewCategoryId] = useState('');

    // Translations
    const labels = {
        title: t.category_rules_title || 'Category Rules',
        hint: t.category_rules_hint || 'Auto-assign categories during CSV import',
        addRule: t.add_rule || 'Add Rule',
        keyword: t.keyword || 'Keyword',
        placeholder: t.rule_placeholder || 'e.g. maxima, bolt...',
        category: t.category || 'Category',
        resetDefaults: t.reset_defaults || 'Reset to Defaults',
        saved: t.success_save || 'Saved',
    };

    // Load rules on mount
    useEffect(() => {
        if (!budgetId) return;

        const loadRules = async () => {
            setIsLoading(true);
            try {
                const fetchedRules = await getCategoryRules(budgetId);
                setRules(fetchedRules);
            } catch (error) {
                console.error('[CategoryRules] Load error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRules();
    }, [budgetId]);

    // Save rules
    const saveRules = async (newRules) => {
        if (!budgetId) return;

        setIsSaving(true);
        try {
            await saveCategoryRules(budgetId, newRules);
            setRules(newRules);
        } catch (error) {
            console.error('[CategoryRules] Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Add new rule
    const handleAddRule = () => {
        if (!newKeyword.trim() || !newCategoryId) return;

        const newRule = {
            keyword: newKeyword.trim().toLowerCase(),
            categoryId: newCategoryId
        };

        // Check for duplicates
        const exists = rules.some(r => r.keyword === newRule.keyword);
        if (exists) return;

        const newRules = [...rules, newRule];
        saveRules(newRules);
        setNewKeyword('');
        setNewCategoryId('');
    };

    // Delete rule
    const handleDeleteRule = (index) => {
        const newRules = rules.filter((_, i) => i !== index);
        saveRules(newRules);
    };

    // Reset to defaults
    const handleResetDefaults = () => {
        const defaults = getDefaultRules();
        saveRules(defaults);
    };

    // Get expense categories for dropdown
    const expenseCategories = categories.filter(c => c.type === 'expense' || !c.type);

    if (isLoading) {
        return (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">{labels.title}...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag size={18} className="text-emerald-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white">{labels.title}</h3>
                    {isSaving && <Loader2 size={14} className="animate-spin text-blue-500" />}
                </div>
                <span className="text-xs text-slate-400">{rules.length} rules</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{labels.hint}</p>

            {/* Rules List */}
            {rules.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {rules.map((rule, index) => {
                        const cat = categories.find(c => c.id === rule.categoryId);
                        const catName = cat ? (getCategoryName ? getCategoryName(cat) : cat.name) : rule.categoryId;

                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <code className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono truncate">
                                        {rule.keyword}
                                    </code>
                                    <span className="text-slate-400">→</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cat?.color || 'bg-slate-300'} ${cat?.textColor || 'text-slate-700'}`}>
                                        {catName}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteRule(index)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add New Rule */}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        {labels.keyword}
                    </label>
                    <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder={labels.placeholder}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        {labels.category}
                    </label>
                    <select
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer dark:text-white"
                    >
                        <option value="">...</option>
                        {expenseCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {getCategoryName ? getCategoryName(cat) : cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleAddRule}
                    disabled={!newKeyword.trim() || !newCategoryId}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Reset Button */}
            <button
                onClick={handleResetDefaults}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
                ↻ {labels.resetDefaults}
            </button>
        </div>
    );
}
