import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { db, appId } from '../firebase';

/**
 * Category Rules Service
 * Manages user-defined keyword-to-category rules for auto-categorization during import.
 *
 * Storage: /artifacts/{appId}/users/{budgetId}/settings/categoryRules
 */

const getRulesDocRef = (budgetId) => {
    return doc(db, 'artifacts', appId, 'users', budgetId, 'settings', 'categoryRules');
};

/**
 * Default rules to seed new users
 */
const DEFAULT_RULES = [
    // Food & Groceries
    { keyword: 'maxima', categoryId: 'food' },
    { keyword: 'iki', categoryId: 'food' },
    { keyword: 'lidl', categoryId: 'food' },
    { keyword: 'rimi', categoryId: 'food' },
    { keyword: 'norfa', categoryId: 'food' },
    { keyword: 'auchan', categoryId: 'food' },
    { keyword: 'silpo', categoryId: 'food' },
    { keyword: 'atb', categoryId: 'food' },
    { keyword: 'novus', categoryId: 'food' },
    { keyword: 'metro', categoryId: 'food' },

    // Cafe & Restaurants
    { keyword: 'wolt', categoryId: 'cafe' },
    { keyword: 'glovo', categoryId: 'cafe' },
    { keyword: 'bolt food', categoryId: 'cafe' },
    { keyword: 'mcdonald', categoryId: 'cafe' },
    { keyword: 'starbucks', categoryId: 'cafe' },
    { keyword: 'kfc', categoryId: 'cafe' },
    { keyword: 'subway', categoryId: 'cafe' },

    // Transport
    { keyword: 'bolt', categoryId: 'transport' },
    { keyword: 'uber', categoryId: 'transport' },
    { keyword: 'taxi', categoryId: 'transport' },
    { keyword: 'shell', categoryId: 'transport' },
    { keyword: 'okko', categoryId: 'transport' },
    { keyword: 'wog', categoryId: 'transport' },
    { keyword: 'parking', categoryId: 'transport' },

    // Entertainment
    { keyword: 'netflix', categoryId: 'entertainment' },
    { keyword: 'spotify', categoryId: 'entertainment' },
    { keyword: 'steam', categoryId: 'entertainment' },
    { keyword: 'playstation', categoryId: 'entertainment' },
    { keyword: 'cinema', categoryId: 'entertainment' },
    { keyword: 'apple.com/bill', categoryId: 'entertainment' },

    // Shopping
    { keyword: 'amazon', categoryId: 'shopping' },
    { keyword: 'aliexpress', categoryId: 'shopping' },
    { keyword: 'rozetka', categoryId: 'shopping' },
    { keyword: 'zara', categoryId: 'shopping' },
    { keyword: 'ikea', categoryId: 'shopping' },

    // Communication
    { keyword: 'vodafone', categoryId: 'communication' },
    { keyword: 'kyivstar', categoryId: 'communication' },
    { keyword: 'lifecell', categoryId: 'communication' },

    // Health
    { keyword: 'pharmacy', categoryId: 'health' },
    { keyword: 'apteka', categoryId: 'health' },
    { keyword: 'clinic', categoryId: 'health' },
];

/**
 * Get category rules for a budget
 * Returns default rules if none exist
 */
export const getCategoryRules = async (budgetId) => {
    if (!budgetId) return DEFAULT_RULES;

    try {
        const docRef = getRulesDocRef(budgetId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().rules || [];
        }

        // Return defaults if no rules saved yet
        return DEFAULT_RULES;
    } catch (error) {
        console.error('[CategoryRules] Error fetching rules:', error);
        return DEFAULT_RULES;
    }
};

/**
 * Save category rules for a budget
 */
export const saveCategoryRules = async (budgetId, rules) => {
    if (!budgetId) throw new Error('Budget ID required');

    try {
        const docRef = getRulesDocRef(budgetId);
        await setDoc(docRef, {
            rules: rules || [],
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('[CategoryRules] Error saving rules:', error);
        throw error;
    }
};

/**
 * Detect category from description using rules
 * @param {string} description - Transaction description
 * @param {Array} rules - Array of { keyword, categoryId } objects
 * @returns {string|null} - Category ID or null if no match
 */
export const detectCategory = (description, rules = []) => {
    if (!description || !rules.length) return null;

    const lowerDesc = description.toLowerCase();

    for (const rule of rules) {
        if (!rule.keyword) continue;

        const keyword = rule.keyword.toLowerCase().trim();
        if (lowerDesc.includes(keyword)) {
            return rule.categoryId;
        }
    }

    return null;
};

/**
 * Get default rules (can be used to reset)
 */
export const getDefaultRules = () => [...DEFAULT_RULES];
