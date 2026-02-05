import { create } from 'zustand';

/**
 * Global Modal Store
 * Managed via Zustand to avoid Context Providers and allow access from non-component files.
 */
export const useModalStore = create((set) => ({
    activeModal: null,
    modalProps: {},

    /**
     * Open a specific modal by key
     * @param {string} modalName - Key matching the ModalManager switch case
     * @param {object} props - Props to pass to the modal component
     */
    openModal: (modalName, props = {}) =>
        set({
            activeModal: modalName,
            modalProps: props,
        }),

    /**
     * Close the currently active modal
     */
    closeModal: () =>
        set({
            activeModal: null,
            modalProps: {},
        }),
}));
