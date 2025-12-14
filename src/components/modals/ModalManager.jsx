import React, { Suspense, lazy } from 'react';
import { useModalStore } from '../../store/useModalStore';

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
    // Select state slices to minimize re-renders
    const activeModal = useModalStore((state) => state.activeModal);
    const modalProps = useModalStore((state) => state.modalProps);
    const closeModal = useModalStore((state) => state.closeModal);

    if (!activeModal) return null;

    const renderModal = () => {
        switch (activeModal) {
            case 'transaction':
                return <TransactionForm {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'loan':
                return <LoanModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'loanPayment':
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
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" />}>
            {renderModal()}
        </Suspense>
    );
}