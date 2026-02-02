import { fetchExchangeRate } from '../utils/currency';
import { useBudgetStore } from '../store/useBudgetStore';
import { useModalStore } from '../store/useModalStore';
import { toast } from 'react-hot-toast';

export const useAppActions = (activeBudgetId, user, t, currency) => {
    const store = useBudgetStore();
    const closeModal = useModalStore((state) => state.closeModal);

    // Transactions
    const handleSaveTransaction = async (data, editingTx) => {
        try {
            if (editingTx) {
                await store.updateTransaction(activeBudgetId, editingTx.id, data, currency, t);
            } else {
                await store.addTransaction(activeBudgetId, user, data, currency, t);
            }
            closeModal();
        } catch (e) { console.error(e); }
    };

    const handleDeleteTransaction = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await store.deleteTransaction(activeBudgetId, id, t);
    };

    // Loans
    const handleSaveLoan = async (data, editingLoan) => {
        try {
            if (editingLoan) {
                await store.updateLoan(activeBudgetId, editingLoan.id, data, t);
            } else {
                await store.addLoan(activeBudgetId, data, t);
            }
            closeModal();
        } catch (e) { console.error(e); }
    };

    const handleDeleteLoan = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await store.deleteLoan(activeBudgetId, id, t);
    };

    const handleLoanPayment = async (amount, loan) => {
        try {
            await store.payLoan(activeBudgetId, loan, amount, t);
            closeModal();
        } catch (e) { console.error(e); }
    };

    // Assets
    const handleSaveAsset = async (data, editingAsset) => {
        try {
            if (editingAsset) {
                await store.updateAsset(activeBudgetId, editingAsset.id, data, currency, t);
            } else {
                await store.addAsset(activeBudgetId, data, currency, t);
            }
            closeModal();
        } catch (e) { console.error(e); }
    };

    const handleDeleteAsset = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await store.deleteAsset(activeBudgetId, id, t);
    };

    // Settings / Categories
    const handleAddCategory = async (data) => {
        await store.addCategory(activeBudgetId, data, t);
        closeModal();
    };

    const handleDeleteCategory = async (catId) => {
         await store.deleteCategory(activeBudgetId, catId, t);
    };

    const handleSaveLimit = async (catId, amount) => {
        await store.saveCategoryLimit(activeBudgetId, catId, amount, t);
    };

    const handleRemoveUser = async (uid) => {
        await store.removeUserFromBudget(activeBudgetId, uid, t);
    };

    const handleLeaveBudget = async () => {
        if (!confirm("Are you sure?")) return;
        await store.leaveBudget(activeBudgetId, user?.uid, t);
    };

    // Misc
    const handleFetchCryptoRate = async (coinId, setValCb) => {
        try {
            const rate = await fetchExchangeRate(coinId, currency, true);
            if (rate && rate !== 1) {
                setValCb(rate);
                toast.success(`Rate: ${rate} ${currency}`);
            } else { 
                toast.error("Could not fetch rate.");
            }
        } catch(e) { toast.error("Fetch failed"); }
    };

    const handleExport = (data, filename = 'export') => {
        const tableContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table>${data}</table></body></html>`;
        const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = `${filename}.xls`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    return {
        handleSaveTransaction, handleDeleteTransaction,
        handleSaveLoan, handleDeleteLoan, handleLoanPayment,
        handleSaveAsset, handleDeleteAsset,
        handleAddCategory, handleDeleteCategory, handleSaveLimit,
        handleRemoveUser, handleLeaveBudget,
        handleFetchCryptoRate, handleExport
    };
};
