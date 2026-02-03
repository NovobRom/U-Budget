import Papa from 'papaparse';
import { detectCategory } from '../services/categoryRules.service';

/**
 * Revolut CSV Parser
 * Parses Revolut bank statement CSV files and transforms them into transaction objects.
 * 
 * Expected CSV columns:
 * - Type, Completed Date, Description, Amount, Currency, State
 */

// Required columns for valid Revolut CSV
const REQUIRED_COLUMNS = ['Completed Date', 'Description', 'Amount', 'Currency', 'State'];

/**
 * Generate a unique fingerprint for deduplication
 * @param {string} dateString - Completed Date from CSV
 * @param {number} amount - Absolute amount value
 * @param {string} description - Transaction description
 * @returns {string} Fingerprint ID
 */
const generateFingerprint = (dateString, amount, description) => {
    const cleanDescription = description.trim().toLowerCase().replace(/\s+/g, '_');
    return `revolut_${dateString}_${Math.abs(amount).toFixed(2)}_${cleanDescription}`;
};

/**
 * Parse date from Revolut CSV format
 * Format: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD"
 * @param {string} dateString 
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
const parseRevolutDate = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0];

    // Handle "YYYY-MM-DD HH:mm:ss" format
    const datePart = dateString.split(' ')[0];

    // Validate format
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
    }

    // Fallback: try to parse as Date
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
};

/**
 * Validate that CSV has required Revolut columns
 * @param {string[]} headers - Array of column headers
 * @returns {{ valid: boolean, missing: string[] }}
 */
const validateStructure = (headers) => {
    const headerSet = new Set(headers.map(h => h?.trim()));
    const missing = REQUIRED_COLUMNS.filter(col => !headerSet.has(col));

    return {
        valid: missing.length === 0,
        missing
    };
};

/**
 * Parse Revolut CSV file and return normalized transactions
 * @param {File} file - The CSV file object
 * @param {Array} categoryRules - Optional array of { keyword, categoryId } for auto-categorization
 * @returns {Promise<{ success: boolean, transactions?: object[], error?: string }>}
 */
export const parseRevolutCSV = (file, categoryRules = []) => {
    return new Promise((resolve) => {
        // Validate file extension
        if (!file.name.toLowerCase().endsWith('.csv')) {
            resolve({
                success: false,
                error: 'INVALID_FORMAT'
            });
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: (results) => {
                // Validate CSV structure
                if (!results.meta?.fields) {
                    resolve({
                        success: false,
                        error: 'UNKNOWN_STRUCTURE'
                    });
                    return;
                }

                const validation = validateStructure(results.meta.fields);
                if (!validation.valid) {
                    console.warn('[RevolutParser] Missing columns:', validation.missing);
                    resolve({
                        success: false,
                        error: 'UNKNOWN_STRUCTURE'
                    });
                    return;
                }

                // Filter and transform transactions
                const transactions = results.data
                    .filter(row => {
                        // Only import COMPLETED transactions
                        const state = row['State']?.trim().toUpperCase();
                        return state === 'COMPLETED';
                    })
                    .map(row => {
                        const amount = parseFloat(row['Amount']) || 0;
                        const absAmount = Math.abs(amount);
                        const type = amount < 0 ? 'expense' : 'income';
                        const currency = row['Currency']?.trim().toUpperCase() || 'EUR';
                        const description = row['Description']?.trim() || '';
                        const dateString = row['Completed Date'] || '';
                        const date = parseRevolutDate(dateString);

                        // Include Type column in comment if available
                        const txType = row['Type']?.trim() || '';
                        const comment = txType ? `[${txType}] ${description}` : description;

                        return {
                            date,
                            originalAmount: absAmount,
                            originalCurrency: currency,
                            type,
                            category: detectCategory(description, categoryRules) || 'other',
                            comment,
                            importId: generateFingerprint(dateString, absAmount, description),
                            // Keep original data for reference
                            _raw: {
                                completedDate: dateString,
                                originalDescription: description,
                                txType
                            }
                        };
                    })
                    .filter(tx => tx.originalAmount > 0); // Remove zero-amount transactions

                resolve({
                    success: true,
                    transactions,
                    stats: {
                        total: results.data.length,
                        imported: transactions.length,
                        filtered: results.data.length - transactions.length
                    }
                });
            },
            error: (error) => {
                console.error('[RevolutParser] Parse error:', error);
                resolve({
                    success: false,
                    error: 'PARSE_ERROR'
                });
            }
        });
    });
};

/**
 * Validate file before parsing (quick check)
 * @param {File} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateFile = (file) => {
    if (!file) {
        return { valid: false, error: 'NO_FILE' };
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
        return { valid: false, error: 'INVALID_FORMAT' };
    }

    // Max 5MB for safety
    if (file.size > 5 * 1024 * 1024) {
        return { valid: false, error: 'FILE_TOO_LARGE' };
    }

    return { valid: true };
};
