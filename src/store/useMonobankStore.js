import { create } from 'zustand';
import { getMonobankConfig, saveMonobankConfig } from '../services/monobank-integration.service';

/**
 * Monobank Store with Firestore Sync
 * 
 * This store now syncs to Firestore instead of localStorage.
 * Token persists across devices when user logs in.
 */
export const useMonobankStore = create((set, get) => ({
    token: '',
    accounts: [],
    lastSyncTime: 0,
    isLoading: false,
    userId: null,

    hiddenAccountIds: [],

    // Initialize store from Firestore when user logs in
    initFromFirestore: async (userId) => {
        if (!userId) return;

        set({ isLoading: true, userId });

        try {
            const config = await getMonobankConfig(userId);
            if (config) {
                set({
                    token: config.token || '',
                    accounts: config.accounts || [],
                    hiddenAccountIds: config.hiddenAccountIds || [],
                    lastSyncTime: config.lastSyncTime || 0,
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('[MonobankStore] Init error:', error);
            set({ isLoading: false });
        }
    },

    // Set token and save to Firestore
    setToken: async (token) => {
        const { userId, accounts, lastSyncTime, hiddenAccountIds } = get();
        set({ token });

        if (userId) {
            try {
                await saveMonobankConfig(userId, { token, accounts, lastSyncTime, hiddenAccountIds });
            } catch (error) {
                console.error('[MonobankStore] Save token error:', error);
            }
        }
    },

    // Set accounts and save to Firestore
    setAccounts: async (accounts) => {
        const { userId, token, lastSyncTime, hiddenAccountIds } = get();
        set({ accounts });

        if (userId) {
            try {
                await saveMonobankConfig(userId, { token, accounts, lastSyncTime, hiddenAccountIds });
            } catch (error) {
                console.error('[MonobankStore] Save accounts error:', error);
            }
        }
    },

    // Toggle hidden account status
    toggleAccountVisibility: async (accountId) => {
        const { userId, token, accounts, lastSyncTime, hiddenAccountIds } = get();

        const newHiddenIds = hiddenAccountIds.includes(accountId)
            ? hiddenAccountIds.filter(id => id !== accountId)
            : [...hiddenAccountIds, accountId];

        set({ hiddenAccountIds: newHiddenIds });

        if (userId) {
            try {
                await saveMonobankConfig(userId, { token, accounts, lastSyncTime, hiddenAccountIds: newHiddenIds });
            } catch (error) {
                console.error('[MonobankStore] Save hidden accounts error:', error);
            }
        }
    },

    // Set last sync time and save to Firestore
    setLastSyncTime: async (time) => {
        const { userId, token, accounts } = get();
        set({ lastSyncTime: time });

        if (userId) {
            try {
                await saveMonobankConfig(userId, { token, accounts, lastSyncTime: time });
            } catch (error) {
                console.error('[MonobankStore] Save sync time error:', error);
            }
        }
    },

    // Clear store (on logout or disconnect)
    clearStore: () => set({
        token: '',
        accounts: [],
        lastSyncTime: 0,
        userId: null
    }),
}));
