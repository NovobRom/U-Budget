import { useState, useEffect } from 'react';
import { fetchExchangeRate } from '../utils/currency';

export const useTransactionForm = (isOpen, editingTransaction, currencyCode, onSave, onClose) => {
    const [amount, setAmount] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState(currencyCode || 'EUR');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [isCalculating, setIsCalculating] = useState(false);
    const [exchangeRateError, setExchangeRateError] = useState(null);

    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingTransaction) {
                const transOriginalCurrency = editingTransaction.originalCurrency || currencyCode || 'EUR';
                const transOriginalAmount = Math.abs(editingTransaction.originalAmount || editingTransaction.amount);

                setAmount(transOriginalAmount.toString());
                setSelectedCurrency(transOriginalCurrency);
                setCategory(editingTransaction.category);
                setDescription(editingTransaction.description);
                setType(editingTransaction.type);
                setDate(editingTransaction.date);
                setIsRecurring(editingTransaction.isRecurring || false);
            } else {
                setAmount('');
                setSelectedCurrency(currencyCode || 'EUR');
                setExchangeRate(1);
                setExchangeRateError(null);
                setCategory('');
                setDescription('');
                setType('expense');
                setDate(new Date().toISOString().split('T')[0]);
                setIsRecurring(false);
            }
        }
    }, [isOpen, editingTransaction, currencyCode]);

    // Effect for rate recalculation
    useEffect(() => {
        let isMounted = true;

        const getRate = async () => {
            if (selectedCurrency === currencyCode) {
                if (isMounted) {
                    setExchangeRate(1);
                    setExchangeRateError(null);
                }
                return;
            }

            if (!amount) return;

            if (isMounted) setIsCalculating(true);
            try {
                const rate = await fetchExchangeRate(selectedCurrency, currencyCode);
                if (isMounted) {
                    setExchangeRate(rate);
                    setExchangeRateError(null);
                }
            } catch (e) {
                console.error(e);
                if (isMounted) {
                    setExchangeRateError(e.message);
                }
            } finally {
                if (isMounted) setIsCalculating(false);
            }
        };

        const timer = setTimeout(() => {
            if (isOpen) getRate();
        }, 500);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [amount, selectedCurrency, currencyCode, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const positiveAmount = Math.abs(parseFloat(amount));
        const finalAmountInMainCurrency = positiveAmount * exchangeRate;

        onSave({
            amount: finalAmountInMainCurrency,
            originalAmount: positiveAmount,
            originalCurrency: selectedCurrency,
            exchangeRate: exchangeRate,
            category: category || 'other',
            description,
            type,
            date,
            isRecurring
        });
        onClose();
    };

    return {
        amount, setAmount,
        selectedCurrency, setSelectedCurrency,
        exchangeRate, isCalculating, exchangeRateError,
        category, setCategory,
        description, setDescription,
        type, setType,
        date, setDate,
        isRecurring, setIsRecurring,
        handleSubmit
    };
};
