import { toast } from 'react-hot-toast';
import { create } from 'zustand';

// Services
import { assetsService, AssetData } from '../services/assets.service';
// These services are still JS, so they will be treated as any (or implicit types if allowJs allows inference)
import { budgetService } from '../services/budget.service';
import { categoriesService } from '../services/categories.service';
import { loansService } from '../services/loans.service';
import { transactionsService, TransactionData } from '../services/transactions.service';

interface BudgetStoreState {
    isTransactionLoading: boolean;
    isAssetLoading: boolean;
    isLoanLoading: boolean;
    isSettingsLoading: boolean;
    error: string | null;

    // Transactions
    addTransaction: (
        budgetId: string,
        user: any,
        data: TransactionData,
        mainCurrency: string,
        t?: any
    ) => Promise<void>;
    updateTransaction: (
        budgetId: string,
        id: string,
        data: TransactionData,
        mainCurrency: string,
        t?: any
    ) => Promise<void>;
    deleteTransaction: (budgetId: string, id: string, t?: any) => Promise<void>;

    // Assets
    addAsset: (budgetId: string, data: AssetData, currency?: string, t?: any) => Promise<void>;
    updateAsset: (
        budgetId: string,
        id: string,
        data: Partial<AssetData>,
        currency?: string,
        t?: any
    ) => Promise<void>;
    deleteAsset: (budgetId: string, id: string, t?: any) => Promise<void>;

    // Loans (Using 'any' for data until loansService is migrated)
    addLoan: (budgetId: string, data: any, t?: any) => Promise<void>;
    updateLoan: (budgetId: string, id: string, data: any, t?: any) => Promise<void>;
    deleteLoan: (budgetId: string, id: string, t?: any) => Promise<void>;
    payLoan: (budgetId: string, loan: any, amount: string, t?: any) => Promise<void>;

    // Categories & Settings
    addCategory: (budgetId: string, data: any, t?: any) => Promise<void>;
    deleteCategory: (budgetId: string, categoryId: string, t?: any) => Promise<void>;
    saveCategoryLimit: (
        budgetId: string,
        categoryId: string,
        amount: number,
        t?: any
    ) => Promise<void>;
    removeUserFromBudget: (budgetId: string, userId: string, t?: any) => Promise<void>;
    leaveBudget: (budgetId: string, userId: string, t?: any) => Promise<void>;
}

/**
 * useBudgetStore
 * Global state management for budget data.
 * Centralizes all WRITE operations via Service Layer.
 */
export const useBudgetStore = create<BudgetStoreState>((set) => ({
    // --- STATE ---
    isTransactionLoading: false,
    isAssetLoading: false,
    isLoanLoading: false,
    isSettingsLoading: false,
    error: null,

    // --- TRANSACTIONS ACTIONS ---
    addTransaction: async (budgetId, user, data, mainCurrency, t) => {
        set({ isTransactionLoading: true, error: null });
        try {
            await transactionsService.addTransaction(budgetId, user, data, mainCurrency);
            toast.success(t?.success_save || 'Saved successfully');
        } catch (error: any) {
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
        } catch (error: any) {
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
            const payload = { ...data, currency: data.currency || currency! };
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

    removeUserFromBudget: async (budgetId, userId, _t) => {
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

    leaveBudget: async (budgetId, userId, _t) => {
        set({ isSettingsLoading: true });
        try {
            await budgetService.leaveBudget(budgetId, userId);
            toast.success('Left budget');
        } catch (error) {
            console.error(error);
            toast.error('Error leaving budget');
        } finally {
            set({ isSettingsLoading: false });
        }
    },
}));
