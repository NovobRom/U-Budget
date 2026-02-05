import { TRANSLATIONS } from '../translations';

// Core budget hooks
import { Asset, Loan, Transaction, Category } from '../types';

import { useAssets } from './useAssets';
import { useBudgetConversions } from './useBudgetConversions';
import { useBudgetData } from './useBudgetData';
import { useBudgetUsers } from './useBudgetUsers';

// Sub-hooks for specific data domains
import { useCategories } from './useCategories';
import { useLoans } from './useLoans';
import { useTransactions } from './useTransactions';

/**
 * useBudget Hook - Main orchestrator for budget data
 */
export const useBudget = (
    activeBudgetId: string | null,
    isPendingApproval: boolean,
    user: any | null,
    lang: string,
    currency: string
) => {
    // @ts-ignore - TRANSLATIONS is a JS object
    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    // --- CORE BUDGET DATA ---
    const { budgetData, loading, getBudgetDocRef } = useBudgetData(
        activeBudgetId,
        isPendingApproval,
        user,
        t
    );

    // --- CURRENCY CONVERSIONS ---
    // @ts-ignore
    const { currentBalance, convertedLimits } = useBudgetConversions(budgetData, currency);

    // --- USER MANAGEMENT ---
    // @ts-ignore
    const { removeUser, leaveBudget, switchBudget } = useBudgetUsers(
        activeBudgetId as string,
        user,
        getBudgetDocRef
    ) as any;

    // --- SUB-HOOKS FOR SPECIFIC DATA ---
    // @ts-ignore
    const transactionLogic = useTransactions(
        activeBudgetId as string,
        user,
        t,
        currency,
        budgetData.baseCurrency
    ) as any;

    // @ts-ignore
    const assetLogic = useAssets(activeBudgetId as string, currency, t) as any;

    // @ts-ignore
    const loanLogic = useLoans(activeBudgetId as string, currency, t) as any;

    // @ts-ignore
    const categoryLogic = useCategories(
        activeBudgetId as string,
        { categories: budgetData.categories, limits: convertedLimits },
        t,
        currency
    ) as any;

    // --- AGGREGATE RETURN ---
    return {
        // Core Data
        loading: loading || transactionLogic.loadingTx,
        currentBalance: currentBalance as number,
        allowedUsers: budgetData.allowedUsers,
        budgetOwnerId: budgetData.ownerId,

        // Sub-hook Data
        transactions: transactionLogic.transactions as Transaction[],
        hasMore: transactionLogic.hasMore as boolean,
        assets: assetLogic.assets as Asset[],
        loans: loanLogic.loans as Loan[],
        totalCreditDebt: loanLogic.totalCreditDebt as number,
        allCategories: categoryLogic.allCategories as Category[],
        categoryLimits: categoryLogic.categoryLimits as Record<string, number>,

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
        switchBudget,
    };
};
