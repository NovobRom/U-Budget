import { TRANSLATIONS } from '../translations';

// Core budget hooks (split from original useBudget)
import { useBudgetData } from './useBudgetData';
import { useBudgetConversions } from './useBudgetConversions';
import { useBudgetUsers } from './useBudgetUsers';

// Sub-hooks for specific data domains
import { useTransactions } from './useTransactions';
import { useAssets } from './useAssets';
import { useLoans } from './useLoans';
import { useCategories } from './useCategories';

/**
 * useBudget Hook - Main orchestrator for budget data
 *
 * Combines multiple specialized hooks to provide complete budget functionality:
 * - useBudgetData: Firestore subscription and core budget data
 * - useBudgetConversions: Currency conversions for balance and limits
 * - useBudgetUsers: User management operations
 * - useTransactions: Transaction list and operations
 * - useAssets: Asset management
 * - useLoans: Loan tracking
 * - useCategories: Category and limit management
 *
 * @param {string} activeBudgetId - Current budget ID
 * @param {boolean} isPendingApproval - Whether user is pending approval
 * @param {object} user - Current user object
 * @param {string} lang - Language code ('ua', 'en')
 * @param {string} currency - Display currency (e.g., 'USD', 'EUR', 'UAH')
 *
 * @returns {object} Complete budget interface with data and actions
 */
export const useBudget = (activeBudgetId, isPendingApproval, user, lang, currency) => {
    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    // --- CORE BUDGET DATA ---
    // Firestore subscription, security checks, document creation
    const { budgetData, loading, getBudgetDocRef } = useBudgetData(
        activeBudgetId,
        isPendingApproval,
        user,
        t
    );

    // --- CURRENCY CONVERSIONS ---
    // Convert balance and limits from storage currency (EUR) to display currency
    const { currentBalance, convertedLimits } = useBudgetConversions(budgetData, currency);

    // --- USER MANAGEMENT ---
    // Actions for managing budget users
    const { removeUser, leaveBudget, switchBudget } = useBudgetUsers(
        activeBudgetId,
        user,
        getBudgetDocRef
    );

    // --- SUB-HOOKS FOR SPECIFIC DATA ---
    // NOTE: Write operations are delegated to useBudgetStore, not returned from these hooks
    const transactionLogic = useTransactions(
        activeBudgetId,
        user,
        t,
        currency,
        budgetData.baseCurrency
    );

    const assetLogic = useAssets(activeBudgetId, currency, t);

    const loanLogic = useLoans(activeBudgetId, currency, t);

    // Pass convertedLimits to useCategories so it returns display-ready values
    const categoryLogic = useCategories(
        activeBudgetId,
        { categories: budgetData.categories, limits: convertedLimits },
        t,
        currency
    );

    // --- AGGREGATE RETURN ---
    // Combine all data and actions into single interface
    return {
        // Core Data
        loading: loading || transactionLogic.loadingTx,
        currentBalance,
        allowedUsers: budgetData.allowedUsers,
        budgetOwnerId: budgetData.ownerId,

        // Sub-hook Data
        transactions: transactionLogic.transactions,
        hasMore: transactionLogic.hasMore,
        assets: assetLogic.assets,
        loans: loanLogic.loans,
        totalCreditDebt: loanLogic.totalCreditDebt,
        allCategories: categoryLogic.allCategories,
        categoryLimits: categoryLogic.categoryLimits,

        // Actions
        loadMore: transactionLogic.loadMore,

        addAsset: assetLogic.addAsset,
        updateAsset: assetLogic.updateAsset,
        deleteAsset: assetLogic.deleteAsset,

        addLoan: loanLogic.addLoan,
        updateLoan: loanLogic.updateLoan,
        deleteLoan: loanLogic.deleteLoan,

        addCategory: categoryLogic.addCategory,
        deleteCategory: categoryLogic.deleteCategory,
        saveLimit: categoryLogic.saveLimit,

        removeUser,
        leaveBudget,
        switchBudget
    };
};
