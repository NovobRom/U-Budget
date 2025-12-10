import React, { Suspense, lazy } from 'react';
import { useModal } from '../../context/ModalContext';
import { CURRENCIES } from '../../constants';

// Lazy loaded modals
const TransactionForm = lazy(() => import('../TransactionForm'));
const LoanModal = lazy(() => import('./LoanModal'));
const LoanPaymentModal = lazy(() => import('./LoanPaymentModal'));
const AssetModal = lazy(() => import('./AssetModal'));
const CategoryModal = lazy(() => import('./CategoryModal'));
const LinkModal = lazy(() => import('./LinkModal'));
const SettingsModal = lazy(() => import('./SettingsModal'));
const InfoModal = lazy(() => import('./InfoModal'));
const RecurringModal = lazy(() => import('./RecurringModal'));

export default function ModalManager() {
    const { activeModal, modalProps, closeModal } = useModal();

    if (!activeModal) return null;

    const renderModal = () => {
        switch (activeModal) {
            case 'transaction':
                return <TransactionForm {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'loan':
                return <LoanModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'loanPayment':
                // Special handling for currency symbol if not passed directly, mostly handled by props from App
                return <LoanPaymentModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'asset':
                return <AssetModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'category':
                return <CategoryModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'link':
                return <LinkModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'settings':
                return <SettingsModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'info':
                return <InfoModal {...modalProps} isOpen={true} onClose={closeModal} type={modalProps.type} />;
            case 'recurring':
                return <RecurringModal {...modalProps} isOpen={true} onClose={closeModal} />;
            default:
                return null;
        }
    };

    return (
        <Suspense fallback={null}>
            {renderModal()}
        </Suspense>
    );
}