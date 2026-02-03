import { useState, useEffect } from 'react';
import { fetchExchangeRate } from '../utils/currency';

const STORAGE_CURRENCY = 'EUR';

/**
 * useBudgetConversions Hook
 * Handles currency conversions for budget balance and category limits
 *
 * @param {object} budgetData - Raw budget data from Firestore
 *   - currentBalance: Balance in STORAGE_CURRENCY (EUR)
 *   - limits: Category limits in STORAGE_CURRENCY (EUR)
 * @param {string} displayCurrency - Target currency for display (e.g., 'USD', 'UAH')
 *
 * @returns {object} { currentBalance, convertedLimits }
 *   - currentBalance: Balance converted to displayCurrency
 *   - convertedLimits: Limits object converted to displayCurrency
 */
export const useBudgetConversions = (budgetData, displayCurrency) => {
    const [currentBalance, setCurrentBalance] = useState(0);
    const [convertedLimits, setConvertedLimits] = useState({});

    useEffect(() => {
        let isMounted = true;

        const convertGlobals = async () => {
            let rate = 1;

            // Fetch exchange rate if currencies differ
            if (STORAGE_CURRENCY !== displayCurrency) {
                try {
                    rate = await fetchExchangeRate(STORAGE_CURRENCY, displayCurrency);
                } catch (e) {
                    console.error('Failed to fetch exchange rate:', e);
                    // Keep rate = 1 as fallback for display
                }
            }

            if (isMounted) {
                // Convert balance and round to 2 decimals
                setCurrentBalance(Math.round(budgetData.currentBalance * rate * 100) / 100);

                // Convert limits and round to 2 decimals
                const newLimits = {};
                Object.keys(budgetData.limits).forEach(catId => {
                    newLimits[catId] = Math.round(budgetData.limits[catId] * rate * 100) / 100;
                });
                setConvertedLimits(newLimits);
            }
        };

        convertGlobals();

        return () => {
            isMounted = false;
        };
    }, [budgetData.currentBalance, budgetData.limits, displayCurrency]);

    return {
        currentBalance,
        convertedLimits
    };
};
