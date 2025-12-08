import React from 'react';
import { X } from 'lucide-react';

const ModalWrapper = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    className = "",
    showCloseButton = true 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto custom-scrollbar ${className}`}>
                <div className="flex justify-between items-center mb-6">
                    {title && <h3 className="font-bold text-xl text-slate-900 dark:text-white">{title}</h3>}
                    {showCloseButton && (
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
};

export default ModalWrapper;