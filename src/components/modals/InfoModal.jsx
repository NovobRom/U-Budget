import React from 'react';
import ModalWrapper from '../ui/ModalWrapper';
import Button from '../ui/Button';

export default function InfoModal({ type, onClose, t }) {
    if (!type) return null;

    const title = t[`${type}_title`] || (type === 'install' ? t.install_app : '');
    const text = t[`${type}_text`];

    return (
        <ModalWrapper isOpen={!!type} onClose={onClose} title={title}>
            {type === 'install' ? (
                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-4 mb-6">
                    <div>
                        <h4 className="font-bold mb-1 text-slate-900 dark:text-white">{t.install_ios}</h4>
                        <p>{t.install_ios_step1}</p>
                        <p>{t.install_ios_step2}</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-1 text-slate-900 dark:text-white">{t.install_android}</h4>
                        <p>{t.install_and_step1}</p>
                        <p>{t.install_and_step2}</p>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-6">
                    {text}
                </div>
            )}
            
            <Button onClick={onClose}>
                Close
            </Button>
        </ModalWrapper>
    );
}