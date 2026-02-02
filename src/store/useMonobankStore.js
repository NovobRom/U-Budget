import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMonobankStore = create(
    persist(
        (set, get) => ({
            token: '',
            accounts: [],
            lastSyncTime: 0,

            setToken: (token) => set({ token }),
            setAccounts: (accounts) => set({ accounts }),
            setLastSyncTime: (time) => set({ lastSyncTime: time }),

            clearStore: () => set({ token: '', accounts: [], lastSyncTime: 0 }),
        }),
        {
            name: 'monobank-storage', // name of the item in the storage (must be unique)
        }
    )
);
