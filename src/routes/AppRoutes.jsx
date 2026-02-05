import React, { Suspense, lazy } from 'react';
import { toast } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppShell from '../components/AppShell';
import Layout from '../components/Layout';
import { CURRENCIES } from '../constants';
import { getCategoryRules } from '../services/categoryRules.service';
import { transactionsService } from '../services/transactions.service';
import { useModalStore } from '../store/useModalStore';

// Lazy loaded views
const BudgetView = lazy(() => import('../components/views/BudgetView'));
const AssetsView = lazy(() => import('../components/views/AssetsView'));
const CreditsView = lazy(() => import('../components/views/CreditsView'));

export default function AppRoutes({
    user,
    t,
    lang,
    currency,
    formatMoney,
    budgetData, // unpacked from useBudget
    actions, // unpacked from useAppActions
    familySync, // unpacked from useFamilySync
    activeBudgetId,
    budgetOwnerId,
    hydratedMembers,
}) {
    const openModal = useModalStore((state) => state.openModal);
    const closeModal = useModalStore((state) => state.closeModal);

    // Destructure Budget Data
    const {
        transactions,
        loans,
        assets,
        allCategories,
        categoryLimits,
        totalCreditDebt,
        currentBalance,
        loadMore,
        hasMore,
        switchBudget,
        recalculateBalance,
    } = budgetData;

    // Destructure Actions
    const {
        handleSaveTransaction,
        handleDeleteTransaction,
        handleSaveLoan,
        handleDeleteLoan,
        handleLoanPayment,
        handleSaveAsset,
        handleDeleteAsset,
        handleAddCategory,
        handleDeleteCategory,
        handleSaveLimit,
        handleRemoveUser,
        handleLeaveBudget,
        handleFetchCryptoRate,
        handleExport,
    } = actions;

    // Destructure Family Sync
    const { incomingRequests, sendJoinRequest, cancelSentRequest, approveRequest, declineRequest } =
        familySync;

    // Helpers
    const getCategoryStyles = (categoryId) => {
        const cat = allCategories.find((c) => c.id === categoryId);
        return {
            name: cat?.isCustom
                ? cat.name
                : t[cat?.id] ||
                  t[categoryId?.toLowerCase()?.replace(/ & /g, '_')?.replace(/ /g, '_')] ||
                  cat?.name ||
                  categoryId,
            icon: cat?.icon,
            color: cat?.color || 'bg-slate-100',
            textColor: cat?.textColor || 'text-slate-600',
        };
    };
    const getCategoryName = (cat) =>
        cat.isCustom ? cat.name : t[cat.id] || t[cat.id.toLowerCase()] || cat.name;

    const handleCancelRequest = async () => {
        try {
            await cancelSentRequest();
            toast.success('Request cancelled');
        } catch (e) {
            toast.error('Error cancelling request');
        }
    };

    // Modal Openers
    const openTransactionModal = (tx = null) => {
        openModal('transaction', {
            editingTransaction: tx,
            onSave: (data) => handleSaveTransaction(data, tx),
            onDelete: handleDeleteTransaction,
            categories: allCategories,
            currencyCode: currency,
            t,
            getCategoryName,
            onAddCategory: () =>
                openModal('category', {
                    onSave: handleAddCategory,
                    t,
                }),
        });
    };

    const openLoanModal = (loan = null) => {
        openModal('loan', {
            editingLoan: loan,
            onSave: (data) => handleSaveLoan(data, loan),
            t,
        });
    };

    const openAssetModal = (asset = null) => {
        openModal('asset', {
            editingAsset: asset,
            onSave: (data) => handleSaveAsset(data, asset),
            onFetchRate: handleFetchCryptoRate,
            isFetchingRate: false,
            t,
            currency,
        });
    };

    const openSettings = () => {
        openModal('settings', {
            incomingRequests,
            approveRequest,
            declineRequest,
            categories: allCategories,
            limits: categoryLimits,
            onSaveLimit: handleSaveLimit,
            onDeleteCategory: handleDeleteCategory,
            onLogout: actions.logout, // Note: logout is not in actions yet, need to pass it or accessible via auth
            t,
            getCategoryName,
            allowedUsers: hydratedMembers,
            removeUser: handleRemoveUser,
            leaveBudget: handleLeaveBudget,
            switchBudget,
            currentUserId: user?.uid,
            isOwner: user?.uid === budgetOwnerId,
            activeBudgetId,
            user,
        });
    };

    return (
        <Routes>
            <Route
                element={
                    <Layout
                        user={user}
                        t={t}
                        isPendingApproval={budgetData.isPendingApproval} // Passed from budgetData? No, passed from prop to App.jsx then here?
                        incomingRequestsCount={incomingRequests.length}
                        onOpenSettings={openSettings}
                        onCancelRequest={handleCancelRequest}
                        onOpenInfo={(type) => openModal('info', { type, t })}
                    />
                }
            >
                <Route
                    index
                    element={
                        <Suspense fallback={<AppShell />}>
                            <BudgetView
                                activeBudgetId={activeBudgetId}
                                transactions={transactions}
                                categories={allCategories}
                                limits={categoryLimits}
                                currency={currency}
                                formatMoney={formatMoney}
                                t={t}
                                lang={lang}
                                onOpenSettings={openSettings}
                                onOpenInvite={() =>
                                    openModal('link', {
                                        userUid: user.uid,
                                        onJoinRequest: async (targetId) => {
                                            try {
                                                await sendJoinRequest(targetId);
                                                closeModal();
                                                toast.success('Request sent!');
                                            } catch (e) {
                                                toast.error(t[e.message] || 'Error');
                                            }
                                        },
                                        t,
                                    })
                                }
                                onOpenJoin={() =>
                                    openModal('link', {
                                        userUid: user.uid,
                                        onJoinRequest: async (targetId) => {
                                            try {
                                                await sendJoinRequest(targetId);
                                                closeModal();
                                                toast.success('Request sent!');
                                            } catch (e) {
                                                toast.error(t[e.message] || 'Error');
                                            }
                                        },
                                        t,
                                    })
                                }
                                onOpenRecurring={() =>
                                    openModal('recurring', {
                                        transactions,
                                        onAdd: async (tx) => {
                                            actions.handleSaveTransaction(tx, null);
                                        }, // Use action
                                        formatMoney,
                                        currency,
                                        t,
                                    })
                                }
                                onOpenImport={async () => {
                                    // Load category rules before opening modal
                                    const rules = await getCategoryRules(activeBudgetId);
                                    openModal('import', {
                                        t,
                                        categoryRules: rules,
                                        categories: allCategories, // Pass categories for AI categorization
                                        onImport: async (parsedTxs) => {
                                            try {
                                                const result =
                                                    await transactionsService.importTransactions(
                                                        activeBudgetId,
                                                        user,
                                                        parsedTxs,
                                                        currency
                                                    );
                                                if (result.imported > 0) {
                                                    toast.success(
                                                        `${t.import_success || 'Imported'}: ${result.imported}`
                                                    );
                                                }
                                                return result;
                                            } catch (err) {
                                                console.error('[Import] Error:', err);
                                                toast.error(t.error_save || 'Import failed');
                                                throw err;
                                            }
                                        },
                                    });
                                }}
                                onAddTransaction={() => openTransactionModal(null)}
                                onEditTransaction={(tx) => openTransactionModal(tx)}
                                onDeleteTransaction={handleDeleteTransaction}
                                onExport={(data) => {
                                    const html = `<thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Type</th><th>Amount</th><th>User</th></tr></thead><tbody>${data.map((tr) => `<tr><td>${tr.date}</td><td>${getCategoryStyles(tr.category).name}</td><td>${tr.description}</td><td>${tr.type}</td><td>${Number(tr.amount).toFixed(2)}</td><td>${tr.userName || ''}</td></tr>`).join('')}</tbody>`;
                                    handleExport(html, 'transactions');
                                }}
                                getCategoryStyles={getCategoryStyles}
                                getCategoryName={getCategoryName}
                                currentBalance={currentBalance}
                                loadMore={loadMore}
                                hasMore={hasMore}
                                recalculateBalance={recalculateBalance}
                                onSaveTransaction={handleSaveTransaction}
                            />
                        </Suspense>
                    }
                />
                <Route
                    path="assets"
                    element={
                        <Suspense fallback={<AppShell />}>
                            <AssetsView
                                assets={assets}
                                currency={currency}
                                formatMoney={formatMoney}
                                t={t}
                                onAddAsset={() => openAssetModal(null)}
                                onEditAsset={(a) => openAssetModal(a)}
                                onDeleteAsset={handleDeleteAsset}
                                onExport={() => {
                                    const html = `<thead><tr><th>Name</th><th>Type</th><th>Amount</th><th>Value Per Unit</th><th>Currency</th><th>Total</th></tr></thead><tbody>${assets.map((a) => `<tr><td>${a.name}</td><td>${a.type}</td><td>${a.amount}</td><td>${a.valuePerUnit}</td><td>${a.currency}</td><td>${a.amount * a.valuePerUnit}</td></tr>`).join('')}</tbody>`;
                                    handleExport(html, 'assets');
                                }}
                            />
                        </Suspense>
                    }
                />
                <Route
                    path="credits"
                    element={
                        <Suspense fallback={<AppShell />}>
                            <CreditsView
                                loans={loans}
                                totalCreditDebt={totalCreditDebt}
                                currency={currency}
                                formatMoney={formatMoney}
                                t={t}
                                onAddLoan={() => openLoanModal(null)}
                                onEditLoan={(l) => openLoanModal(l)}
                                onDeleteLoan={handleDeleteLoan}
                                onPayLoan={(l) =>
                                    openModal('loanPayment', {
                                        loan: l,
                                        onPayment: handleLoanPayment,
                                        currencySymbol: CURRENCIES[l.currency]?.symbol || '$',
                                        t,
                                    })
                                }
                                onExport={() => {
                                    const html = `<thead><tr><th>Name</th><th>Total Debt</th><th>Current Balance</th><th>Interest</th><th>Currency</th></tr></thead><tbody>${loans.map((l) => `<tr><td>${l.name}</td><td>${l.totalAmount}</td><td>${l.currentBalance}</td><td>${l.interestRate}</td><td>${l.currency}</td></tr>`).join('')}</tbody>`;
                                    handleExport(html, 'loans');
                                }}
                            />
                        </Suspense>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
