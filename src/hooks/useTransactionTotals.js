import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId } from '../firebase';

/**
 * useTransactionTotals Hook
 * 
 * Loads all transactions and calculates totals client-side.
 * This ensures accurate totals regardless of pagination in the transaction list.
 * 
 * @param {string} activeBudgetId - Current budget ID
 * @param {string} timeFilter - Time filter ('all', 'this_month', 'last_month', etc.)
 * @param {string} customStartDate - Start date for custom range
 * @param {string} customEndDate - End date for custom range
 * 
 * @returns {object} { totalIncome, totalExpense, loading }
 */
export const useTransactionTotals = (
    activeBudgetId,
    timeFilter = 'all',
    customStartDate = '',
    customEndDate = ''
) => {
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeBudgetId) {
            setTotalIncome(0);
            setTotalExpense(0);
            return;
        }

        const fetchTotals = async () => {
            setLoading(true);
            try {
                const txCollection = collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions');

                // Fetch all transactions (no limit)
                const snapshot = await getDocs(txCollection);
                const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Build date filter function
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const isInRange = (dateStr) => {
                    if (timeFilter === 'all') return true;

                    const d = new Date(dateStr);

                    if (timeFilter === 'this_month') {
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }
                    if (timeFilter === 'last_month') {
                        const last = new Date(currentYear, currentMonth - 1, 1);
                        return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
                    }
                    if (timeFilter === 'this_year') {
                        return d.getFullYear() === currentYear;
                    }
                    if (timeFilter === 'custom') {
                        if (!customStartDate && !customEndDate) return true;
                        const txDate = new Date(dateStr);
                        txDate.setHours(0, 0, 0, 0);
                        const start = customStartDate ? new Date(customStartDate) : new Date('1970-01-01');
                        const end = customEndDate ? new Date(customEndDate) : new Date('9999-12-31');
                        start.setHours(0, 0, 0, 0);
                        end.setHours(0, 0, 0, 0);
                        return txDate >= start && txDate <= end;
                    }
                    return true;
                };

                // Calculate totals
                let income = 0;
                let expense = 0;

                transactions.forEach(t => {
                    if (!isInRange(t.date)) return;

                    // Use the stored amount directly (already in storage currency)
                    const amount = Math.abs(Number(t.amount) || 0);

                    if (t.type === 'income') {
                        income += amount;
                    } else if (t.type === 'expense') {
                        expense += amount;
                    }
                });

                // Round to 2 decimal places
                setTotalIncome(Math.round(income * 100) / 100);
                setTotalExpense(Math.round(expense * 100) / 100);
            } catch (error) {
                console.error('[useTransactionTotals] Error fetching totals:', error);
                setTotalIncome(0);
                setTotalExpense(0);
            } finally {
                setLoading(false);
            }
        };

        fetchTotals();
    }, [activeBudgetId, timeFilter, customStartDate, customEndDate]);

    return {
        totalIncome,
        totalExpense,
        loading
    };
};
