import { User } from 'firebase/auth';

import { TRANSLATIONS } from '../translations';
import { Asset, Category, Loan, Transaction } from '../types';

import { useAssets } from './useAssets';
import { useBudgetConversions } from './useBudgetConversions';
import { useBudgetData } from './useBudgetData';
import { useBudgetUsers } from './useBudgetUsers';
import { useCategories } from './useCategories';
import { useLoans } from './useLoans';
import { useTransactions } from './useTransactions';

/**
 * useBudget Hook - Main orchestrator for budget data
 */
export const useBudget = (
    activeBudgetId: string | null,
    isPendingApproval: boolean,
    user: User | null,
    lang: string,
    currency: string
) => {
    // @ts-expect-error - TRANSLATIONS is a JS object
    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    // --- CORE BUDGET DATA ---
    const { budgetData, loading, getBudgetDocRef } = useBudgetData(
        activeBudgetId,
        isPendingApproval,
        user,
        t
    );

    // --- CURRENCY CONVERSIONS ---
    // @ts-expect-error - useBudgetConversions is JS hook without types
    const { currentBalance, convertedLimits } = useBudgetConversions(budgetData, currency);

    // --- USER MANAGEMENT ---
    const { removeUser, leaveBudget, switchBudget } = useBudgetUsers(
        activeBudgetId as string,
        user,
        getBudgetDocRef
    ) as any;

    // --- SUB-HOOKS FOR SPECIFIC DATA ---
    const transactionLogic = useTransactions(
        activeBudgetId as string,
        user,
        t,
        currency,
        budgetData.baseCurrency
    ) as any;

    const assetLogic = useAssets(activeBudgetId as string, currency, t) as any;

    const loanLogic = useLoans(activeBudgetId as string, currency, t) as any;

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
