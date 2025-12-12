import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { transactionsService } from '../services/transactions.service';
import { assetsService } from '../services/assets.service';
import { loansService } from '../services/loans.service';

/**
 * useBudgetStore
 * Global state management for budget data.
 * Aggregates logic for Transactions, Assets, and Loans.
 */
export const useBudgetStore = create((set, get) => ({
    // --- STATE ---
    isTransactionLoading: false,
    isAssetLoading: false,
    isLoanLoading: false,
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
            // Ensure currency is attached if not present
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
            
            // Logic: we just update the loan balance. 
            // If a transaction needs to be created, it should be done separately or here.
            // For now, mirroring previous logic: just update loan.
            await loansService.updateLoan(budgetId, loan.id, { currentBalance: newBalance });
            
            toast.success(t?.payment_recorded || 'Payment recorded');
        } catch (error) {
            console.error(error);
            toast.error('Payment failed');
            throw error;
        } finally {
            set({ isLoanLoading: false });
        }
    }
}));