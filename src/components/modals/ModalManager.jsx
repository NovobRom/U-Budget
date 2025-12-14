import React, { Suspense, lazy } from 'react';
import { useModalStore } from '../../store/useModalStore';

// Helper function to handle chunk load errors (version mismatch)
// If a lazy load fails, it usually means a new version was deployed.
// We force a page reload to get the latest assets.
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Lazy load failed, reloading page:', error);
      // Check if the error is related to missing chunks/modules
      if (error.message.includes('Failed to fetch dynamically imported module') || 
          error.message.includes('Importing a module script failed')) {
        window.location.reload();
      }
      throw error;
    }
  });

// Lazy loaded modals with retry logic
const TransactionForm = lazyWithRetry(() => import('../TransactionForm'));
const LoanModal = lazyWithRetry(() => import('./LoanModal'));
const LoanPaymentModal = lazyWithRetry(() => import('./LoanPaymentModal'));
const AssetModal = lazyWithRetry(() => import('./AssetModal'));
const CategoryModal = lazyWithRetry(() => import('./CategoryModal'));
const LinkModal = lazyWithRetry(() => import('./LinkModal'));
const SettingsModal = lazyWithRetry(() => import('./SettingsModal'));
const InfoModal = lazyWithRetry(() => import('./InfoModal'));
const RecurringModal = lazyWithRetry(() => import('./RecurringModal'));

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