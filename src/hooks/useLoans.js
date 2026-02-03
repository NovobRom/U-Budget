import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';
import { fetchExchangeRate } from '../utils/currency';

export const useLoans = (activeBudgetId, currency, t) => {
    const [loans, setLoans] = useState([]);
    const [totalCreditDebt, setTotalCreditDebt] = useState(0);

    const getLoansColRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'loans');

    useEffect(() => {
        if (!activeBudgetId) return;
        const unsubscribe = onSnapshot(getLoansColRef(), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLoans(items);
        });
        return () => unsubscribe();
    }, [activeBudgetId]);

    useEffect(() => {
        let isMounted = true;
        const calcDebt = async () => {
            let total = 0;
            for (const loan of loans) {
                if (loan.currentBalance <= 0) continue;
                let amount = parseFloat(loan.currentBalance || 0);
                const loanCurr = loan.currency || 'UAH';

                if (loanCurr === currency) {
                    total += amount;
                } else {
                    try {
                        const rate = await fetchExchangeRate(loanCurr, currency);
                        total += amount * rate;
                    } catch (e) {
                        console.error("Rate fetch error in useLoans", e);
                        // Fallback: add as is (better than 0, but inaccurate)
                        total += amount;
                    }
                }
            }
            if (isMounted) setTotalCreditDebt(total);
        };

        calcDebt();
        return () => { isMounted = false; };
    }, [loans, currency]);

    const addLoan = async (data) => {
        if (!activeBudgetId) return;
        await addDoc(getLoansColRef(), {
            ...data,
            createdAt: serverTimestamp()
        });
    };

    const updateLoan = async (id, data) => {
        if (!activeBudgetId) return;
        await updateDoc(doc(getLoansColRef(), id), data);
    };

    const deleteLoan = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await deleteDoc(doc(getLoansColRef(), id));
        toast.success(t.success_delete || 'Deleted');
    };

    return {
        loans,
        totalCreditDebt,
        addLoan,
        updateLoan,
        deleteLoan
    };
};