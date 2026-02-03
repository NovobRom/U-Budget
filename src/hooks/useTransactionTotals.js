import { useState, useEffect } from 'react';
import { collection, query, where, getAggregateFromServer, sum } from 'firebase/firestore';
import { db, appId } from '../firebase';

/**
 * useTransactionTotals Hook
 * 
 * Uses Firestore server-side aggregation to calculate total income and expenses
 * without loading all transaction documents. Much more efficient than client-side sum.
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

                // Build date filter
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                let startDate = null;
                let endDate = null;

                if (timeFilter === 'this_month') {
                    startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
                    endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
                } else if (timeFilter === 'last_month') {
                    startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
                    endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
                } else if (timeFilter === 'this_year') {
                    startDate = new Date(currentYear, 0, 1).toISOString().split('T')[0];
                    endDate = new Date(currentYear, 11, 31).toISOString().split('T')[0];
                } else if (timeFilter === 'custom') {
                    startDate = customStartDate || null;
                    endDate = customEndDate || null;
                }

                // Query for income
                let incomeQuery = query(txCollection, where('type', '==', 'income'));
                if (startDate) incomeQuery = query(incomeQuery, where('date', '>=', startDate));
                if (endDate) incomeQuery = query(incomeQuery, where('date', '<=', endDate));

                // Query for expenses
                let expenseQuery = query(txCollection, where('type', '==', 'expense'));
                if (startDate) expenseQuery = query(expenseQuery, where('date', '>=', startDate));
                if (endDate) expenseQuery = query(expenseQuery, where('date', '<=', endDate));

                // Execute aggregations in parallel
                const [incomeSnapshot, expenseSnapshot] = await Promise.all([
                    getAggregateFromServer(incomeQuery, { total: sum('amount') }),
                    getAggregateFromServer(expenseQuery, { total: sum('amount') })
                ]);

                setTotalIncome(incomeSnapshot.data().total || 0);
                setTotalExpense(expenseSnapshot.data().total || 0);
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
