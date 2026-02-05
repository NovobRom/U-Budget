import React, { Suspense } from 'react';

import { useModalStore } from '../../store/useModalStore';

// Static imports to fix build failure
import AssetModal from './AssetModal';
import CategoryModal from './CategoryModal';
import ImportModal from './ImportModal';
import InfoModal from './InfoModal';
import LinkModal from './LinkModal';
import LoanModal from './LoanModal';
import LoanPaymentModal from './LoanPaymentModal';
import RecurringModal from './RecurringModal';
import SettingsModal from './SettingsModal';
import TransactionModal from './TransactionModal';

export default function ModalManager() {
    const activeModal = useModalStore((state) => state.activeModal);
    const modalProps = useModalStore((state) => state.modalProps);
    const closeModal = useModalStore((state) => state.closeModal);

    if (!activeModal) return null;

    const renderModal = () => {
        switch (activeModal) {
            case 'transaction':
                return <TransactionModal {...modalProps} isOpen={true} onClose={closeModal} />;
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
                return (
                    <InfoModal
                        {...modalProps}
                        isOpen={true}
                        onClose={closeModal}
                        type={modalProps.type}
                    />
                );
            case 'recurring':
                return <RecurringModal {...modalProps} isOpen={true} onClose={closeModal} />;
            case 'import':
                return <ImportModal {...modalProps} isOpen={true} onClose={closeModal} />;
            default:
                return null;
        }
    };

    return (
        <Suspense
            fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" />
            }
        >
            {renderModal()}
        </Suspense>
    );
}
