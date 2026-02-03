import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { parseRevolutCSV, validateFile } from '../../utils/revolutParser';
import { categorizeWithAI } from '../../services/geminiCategorizer.service';

/**
 * ImportModal - 3-step wizard for importing Revolut CSV transactions
 * Step 1: File upload (drag & drop)
 * Step 2: Preview & select transactions
 * Step 3: Import result
 */
export default function ImportModal({
    isOpen,
    onClose,
    onImport,
    categoryRules = [],
    categories = [],
    t = {}
}) {
    const [step, setStep] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [isCategorizingAI, setIsCategorizingAI] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const fileInputRef = useRef(null);

    // Translations with fallbacks
    const labels = {
        title: t.import_title || 'Import Transactions',
        dropHint: t.import_drop_hint || 'Drag & drop CSV file here or click to select',
        invalidFormat: t.import_invalid_format || 'Invalid file format. Please select a .csv file',
        unknownStructure: t.import_unknown_structure || 'Unknown file structure. Expected Revolut CSV format',
        parseError: t.import_parse_error || 'Error parsing file',
        fileTooLarge: t.import_file_too_large || 'File is too large (max 5MB)',
        previewTitle: t.import_preview_title || 'Preview',
        foundTransactions: t.import_found_transactions || 'transactions found',
        back: t.import_back || 'Back',
        confirm: t.import_confirm || 'Import',
        success: t.import_success || 'Successfully imported',
        skipped: t.import_skipped_duplicates || 'duplicates skipped',
        close: t.btn_cancel || 'Close',
        selectAll: t.import_select_all || 'Select All',
        date: t.date || 'Date',
        description: t.description || 'Description',
        amount: t.amount || 'Amount',
        type: t.type || 'Type',
        expense: t.expense || 'Expense',
        income: t.income || 'Income',
        aiLoading: t.ai_loading || 'AI is analyzing your expenses...',
        aiLoadingHint: t.ai_loading_hint || 'This may take a few seconds',
    };

    const resetState = useCallback(() => {
        setStep(1);
        setError(null);
        setTransactions([]);
        setSelectedIds(new Set());
        setIsImporting(false);
        setImportResult(null);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    // File handling
    const handleFile = useCallback(async (file) => {
        setError(null);

        const validation = validateFile(file);
        if (!validation.valid) {
            const errorMessages = {
                'INVALID_FORMAT': labels.invalidFormat,
                'FILE_TOO_LARGE': labels.fileTooLarge,
                'NO_FILE': labels.invalidFormat
            };
            setError(errorMessages[validation.error] || labels.parseError);
            return;
        }

        const result = await parseRevolutCSV(file, categoryRules);

        if (!result.success) {
            const errorMessages = {
                'INVALID_FORMAT': labels.invalidFormat,
                'UNKNOWN_STRUCTURE': labels.unknownStructure,
                'PARSE_ERROR': labels.parseError
            };
            setError(errorMessages[result.error] || labels.parseError);
            return;
        }

        if (result.transactions.length === 0) {
            setError(t.import_no_transactions || 'No valid transactions found in file');
            return;
        }

        // Apply AI categorization for transactions that still have 'other' category
        let categorizedTxs = result.transactions;
        const uncategorizedTxs = categorizedTxs.filter(tx => tx.category === 'other');

        if (uncategorizedTxs.length > 0 && categories.length > 0) {
            setIsCategorizingAI(true);
            try {
                console.log(`[Import] Running AI categorization for ${uncategorizedTxs.length} transactions...`);
                categorizedTxs = await categorizeWithAI(categorizedTxs, categories);
            } catch (err) {
                console.warn('[Import] AI categorization failed, using keyword rules only:', err);
            } finally {
                setIsCategorizingAI(false);
            }
        }

        setTransactions(categorizedTxs);
        setSelectedIds(new Set(categorizedTxs.map((_, i) => i)));
        setStep(2);
    }, [labels, t, categoryRules, categories]);

    // Drag & Drop handlers
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleFileInput = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    // Selection handlers
    const toggleSelection = useCallback((index) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedIds.size === transactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(transactions.map((_, i) => i)));
        }
    }, [selectedIds.size, transactions.length]);

    // Import handler
    const handleImport = useCallback(async () => {
        const selectedTransactions = transactions.filter((_, i) => selectedIds.has(i));

        if (selectedTransactions.length === 0) return;

        setIsImporting(true);

        try {
            const result = await onImport(selectedTransactions);
            setImportResult(result);
            setStep(3);
        } catch (err) {
            console.error('[ImportModal] Import error:', err);
            setError(err.message || labels.parseError);
        } finally {
            setIsImporting(false);
        }
    }, [transactions, selectedIds, onImport, labels.parseError]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            {/* AI Loading Overlay */}
            {isCategorizingAI && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] rounded-2xl">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <Sparkles className="w-16 h-16 text-purple-500 animate-pulse mx-auto mb-4" />
                        <h3 className="text-xl font-bold dark:text-white mb-2">
                            ✨ {labels.aiLoading}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            {labels.aiLoadingHint}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {labels.title}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                    border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                                    transition-all duration-200
                                    ${isDragging
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }
                                `}
                            >
                                <Upload
                                    size={48}
                                    className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}
                                />
                                <p className="text-slate-600 dark:text-slate-300 font-medium">
                                    {labels.dropHint}
                                </p>
                                <p className="text-sm text-slate-400 mt-2">
                                    Revolut CSV
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileInput}
                                className="hidden"
                            />

                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <FileText size={20} />
                                    <span className="font-medium">
                                        {selectedIds.size} / {transactions.length} {labels.foundTransactions}
                                    </span>
                                </div>
                                <button
                                    onClick={toggleAll}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {labels.selectAll}
                                </button>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="max-h-[400px] overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                            <tr>
                                                <th className="w-10 p-3"></th>
                                                <th className="text-left p-3 font-medium text-slate-600 dark:text-slate-300">
                                                    {labels.date}
                                                </th>
                                                <th className="text-left p-3 font-medium text-slate-600 dark:text-slate-300">
                                                    {labels.description}
                                                </th>
                                                <th className="text-right p-3 font-medium text-slate-600 dark:text-slate-300">
                                                    {labels.amount}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {transactions.map((tx, index) => (
                                                <tr
                                                    key={index}
                                                    onClick={() => toggleSelection(index)}
                                                    className={`
                                                        cursor-pointer transition-colors
                                                        ${selectedIds.has(index)
                                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                        }
                                                    `}
                                                >
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(index)}
                                                            onChange={() => { }}
                                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                                        {tx.date}
                                                    </td>
                                                    <td className="p-3 text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                                                        {tx.comment}
                                                    </td>
                                                    <td className={`p-3 text-right font-medium whitespace-nowrap ${tx.type === 'expense'
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-green-600 dark:text-green-400'
                                                        }`}>
                                                        {tx.type === 'expense' ? '-' : '+'}
                                                        {tx.originalAmount.toFixed(2)} {tx.originalCurrency}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Result */}
                    {step === 3 && importResult && (
                        <div className="text-center py-8">
                            <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {labels.success}
                            </h4>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                {importResult.imported} {t.transactions || 'transactions'}
                            </p>
                            {importResult.skipped > 0 && (
                                <p className="text-slate-500 dark:text-slate-400">
                                    {importResult.skipped} {labels.skipped}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                    {step === 2 && (
                        <>
                            <button
                                onClick={resetState}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                {labels.back}
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={selectedIds.size === 0 || isImporting}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                            >
                                {isImporting && <Loader2 size={16} className="animate-spin" />}
                                {labels.confirm} ({selectedIds.size})
                            </button>
                        </>
                    )}
                    {step === 3 && (
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                        >
                            {labels.close}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
