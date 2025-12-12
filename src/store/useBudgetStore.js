import { create } from 'zustand';
import { toast } from 'react-hot-toast';

// Services
import { transactionsService } from '../services/transactions.service';
import { assetsService } from '../services/assets.service';
import { loansService } from '../services/loans.service';
import { categoriesService } from '../services/categories.service';
import { budgetService } from '../services/budget.service';

/**
 * useBudgetStore
 * Global state management for budget data.
 * Centralizes all WRITE operations via Service Layer.
 */
export const useBudgetStore = create((set, get) => ({
    // --- STATE ---
    isTransactionLoading: false,
    isAssetLoading: false,
    isLoanLoading: false,
    isSettingsLoading: false, // General loading state for settings/categories
    error: null,

    // --- TRANSACTIONS ACTIONS ---
    addTransaction: async (budgetId, user, data, mainCurrency, t) => {
        set({ isTransactionLoading: true, error: null });
        try {
            await transactionsService.addTransaction(budgetId, user, data, mainCurrency);
            toast.success(t?.success_save || 'Saved successfully');
        } catch (error) {
            console.error(error);
            set({ error: error.message });
            toast.error(t?.error_save || 'Error saving transaction');
            throw error;
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
        try {
            await transactionsService.deleteTransaction(budgetId, id);
            toast.success(t?.success_delete || 'Deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error('Error deleting transaction');
        }
    },

    // --- ASSETS ACTIONS ---
    addAsset: async (budgetId, data, currency, t) => {
        set({ isAssetLoading: true });
        try {
            const payload = { ...data, currency: data.currency || currency };
            await assetsService.addAsset(budgetId, payload);
            toast.success(t?.success_save || 'Asset saved');
        } catch (error) {
            console.error(error);
            toast.error(t?.error_save || 'Error saving asset');
            throw error;
        } finally {
            set({ isAssetLoading: false });
        }
    },

    updateAsset: async (budgetId, id, data, currency, t) => {
        set({ isAssetLoading: true });
        try {
            const payload = { ...data, currency: data.currency || currency };
            await assetsService.updateAsset(budgetId, id, payload);
            toast.success(t?.success_save || 'Asset updated');
        } catch (error) {
            console.error(error);
            toast.error(t?.error_save || 'Error updating asset');
            throw error;
        } finally {
            set({ isAssetLoading: false });
        }
    },

    deleteAsset: async (budgetId, id, t) => {
        try {
            await assetsService.deleteAsset(budgetId, id);
            toast.success(t?.success_delete || 'Asset deleted');
        } catch (error) {
            console.error(error);
            toast.error('Error deleting asset');
        }
    },

    // --- LOANS ACTIONS ---
    addLoan: async (budgetId, data, t) => {
        set({ isLoanLoading: true });
        try {
            await loansService.addLoan(budgetId, data);
            toast.success(t?.success_save || 'Loan saved');
        } catch (error) {
            console.error(error);
            toast.error(t?.error_save || 'Error saving loan');
            throw error;
        } finally {
            set({ isLoanLoading: false });
        }
    },

    updateLoan: async (budgetId, id, data, t) => {
        set({ isLoanLoading: true });
        try {
            await loansService.updateLoan(budgetId, id, data);
            toast.success(t?.success_save || 'Loan updated');
        } catch (error) {
            console.error(error);
            toast.error(t?.error_save || 'Error updating loan');
            throw error;
        } finally {
            set({ isLoanLoading: false });
        }
    },

    deleteLoan: async (budgetId, id, t) => {
        try {
            await loansService.deleteLoan(budgetId, id);
            toast.success(t?.success_delete || 'Loan deleted');
        } catch (error) {
            console.error(error);
            toast.error('Error deleting loan');
        }
    },

    payLoan: async (budgetId, loan, amount, t) => {
        set({ isLoanLoading: true });
        try {
            const numAmount = parseFloat(amount);
            if (numAmount <= 0) return;
            const newBalance = loan.currentBalance - numAmount;
            await loansService.updateLoan(budgetId, loan.id, { currentBalance: newBalance });
            toast.success(t?.payment_recorded || 'Payment recorded');
        } catch (error) {
            console.error(error);
            toast.error('Payment failed');
            throw error;
        } finally {
            set({ isLoanLoading: false });
        }
    },

    // --- CATEGORIES & SETTINGS ACTIONS ---
    
    addCategory: async (budgetId, data, t) => {
        set({ isSettingsLoading: true });
        try {
            await categoriesService.addCategory(budgetId, data);
            toast.success(t?.success_save || 'Category added');
        } catch (error) {
            console.error(error);
            toast.error(t?.error_save || 'Error adding category');
            throw error;
        } finally {
            set({ isSettingsLoading: false });
        }
    },

    deleteCategory: async (budgetId, categoryId, t) => {
        set({ isSettingsLoading: true });
        try {
            await categoriesService.deleteCategory(budgetId, categoryId);
            toast.success(t?.success_delete || 'Category deleted');
        } catch (error) {
            console.error(error);
            toast.error('Error deleting category');
        } finally {
            set({ isSettingsLoading: false });
        }
    },

    saveCategoryLimit: async (budgetId, categoryId, amount, t) => {
        // We might not want a global loading spinner for this small action,
        // but let's keep it consistent for now.
        set({ isSettingsLoading: true });
        try {
            await categoriesService.saveLimit(budgetId, categoryId, amount);
            toast.success(t?.success_save || 'Limit saved');
        } catch (error) {
            console.error(error);
            toast.error(t?.error_save || 'Error saving limit');
        } finally {
            set({ isSettingsLoading: false });
        }
    },

    removeUserFromBudget: async (budgetId, userId, t) => {
        set({ isSettingsLoading: true });
        try {
            await budgetService.removeUser(budgetId, userId);
            toast.success('User removed');
        } catch (error) {
            console.error(error);
            toast.error('Error removing user');
        } finally {
            set({ isSettingsLoading: false });
        }
    },

    leaveBudget: async (budgetId, userId, t) => {
        set({ isSettingsLoading: true });
        try {
            await budgetService.leaveBudget(budgetId, userId);
            toast.success('Left budget');
            // Navigation/Reload might be handled by the component monitoring `activeBudgetId`
        } catch (error) {
            console.error(error);
            toast.error('Error leaving budget');
        } finally {
            set({ isSettingsLoading: false });
        }
    }
}));