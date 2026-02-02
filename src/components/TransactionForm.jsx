
import React from 'react';
import { useTransactionForm } from '../hooks/useTransactionForm';
import CategoryGrid from './forms/transaction/CategoryGrid';
import AmountInput from './forms/transaction/AmountInput';

export default function TransactionForm(props) {
    console.log(useTransactionForm, CategoryGrid, AmountInput);
    if (!props.isOpen) return null;
    return <div className="fixed inset-0 bg-white z-50">Dummy TF with AmountInput</div>;
}
