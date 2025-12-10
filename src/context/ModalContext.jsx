import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [activeModal, setActiveModal] = useState(null);
    const [modalProps, setModalProps] = useState({});

    const openModal = useCallback((modalName, props = {}) => {
        setModalProps(props);
        setActiveModal(modalName);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalProps({});
    }, []);

    return (
        <ModalContext.Provider value={{ activeModal, modalProps, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};