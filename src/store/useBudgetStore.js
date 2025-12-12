import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { transactionsService } from '../services/transactions.service';

/**
 * useBudgetStore
 * Global state management for budget data using Zustand.
 * Integrating Service Layer for async operations.
 */
export const useBudgetStore = create((set, get) => ({
    // State
    isTransactionLoading: false,
    error: null,

    // Actions
    addTransaction: async (budgetId, user, data, mainCurrency, t) => {
        set({ isTransactionLoading: true, error: null });
        try {
            await transactionsService.addTransaction(budgetId, user, data, mainCurrency);
            toast.success(t?.success_save || 'Saved successfully');
        } catch (error) {
            console.error(error);
            set({ error: error.message });
            toast.error(t?.error_save || 'Error saving transaction');
            throw error; // Re-throw to allow component to close modal
        } finally {
            set({ isTransactionLoading: false });
        }
    },

    updateTransaction: async (budgetId, id, data, mainCurrency, t) => {
        set({ isTransactionLoading: true });
        try {
            await transactionsService.updateTransaction(budgetId, id, data, mainCurrency);
            toast.success(t?.success_save || 'Saved successfully');
        } catch (error) {
            set({ error: error.message });
            toast.error(t?.error_save || 'Error updating');
            throw error;
        } finally {
            set({ isTransactionLoading: false });
        }
    },

    deleteTransaction: async (budgetId, id, t) => {
        // Optimistic update logic can be added here later
        try {
            await transactionsService.deleteTransaction(budgetId, id);
            toast.success(t?.success_delete || 'Deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error('Error deleting transaction');
        }
    }
}));