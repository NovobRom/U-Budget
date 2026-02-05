import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBudgetData } from '../../../hooks/useBudgetData';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

// --- MOCKS ---

vi.mock('../../../firebase', () => ({
    db: {},
    appId: 'test-app-id'
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        error: vi.fn()
    }
}));

const { mockDocRef } = vi.hoisted(() => ({
    mockDocRef: { id: 'mock-doc-id' }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => mockDocRef),
    onSnapshot: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    DocumentReference: class { }
}));

describe('useBudgetData', () => {
    const activeBudgetId = 'budget-123';
    const user = { uid: 'user-abc' };
    const t = { access_lost: 'Access lost' };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should subscribe to budget document on mount', () => {
        (onSnapshot as any).mockImplementation(() => vi.fn());

        const { result } = renderHook(() => useBudgetData(activeBudgetId, false, user, t));

        expect(doc).toHaveBeenCalled();
        expect(onSnapshot).toHaveBeenCalled();
        expect(result.current.loading).toBe(true);
    });

    it('should update state when snapshot received', async () => {
        let snapshotCallback: (snap: any) => void = () => { };

        (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
            snapshotCallback = callback;
            return vi.fn();
        });

        const { result } = renderHook(() => useBudgetData(activeBudgetId, false, user, t));

        const mockData = {
            currentBalance: 100,
            authorizedUsers: ['user-abc'],
            ownerId: 'user-abc',
            categories: [],
            limits: {},
            baseCurrency: 'USD'
        };

        const mockSnap = {
            exists: () => true,
            data: () => mockData
        };

        act(() => {
            snapshotCallback(mockSnap);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.budgetData.currentBalance).toBe(100);
            expect(result.current.budgetData.ownerId).toBe('user-abc');
        });
    });

    it('should create budget if it does not exist and user is owner', async () => {
        let snapshotCallback: (snap: any) => void = () => { };
        (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
            snapshotCallback = callback;
            return vi.fn();
        });

        // Use user.uid as activeBudgetId to simulate personal budget
        renderHook(() => useBudgetData(user.uid, false, user, t));

        const mockSnap = {
            exists: () => false
        };

        await act(async () => {
            await snapshotCallback(mockSnap);
        });

        expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
            ownerId: user.uid,
            currentBalance: 0
        }));
    });

    it('should redirect if user access is revoked', async () => {
        let snapshotCallback: (snap: any) => void = () => { };
        (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
            snapshotCallback = callback;
            return vi.fn();
        });

        renderHook(() => useBudgetData(activeBudgetId, false, user, t));

        const mockData = {
            ownerId: 'other-owner',
            authorizedUsers: ['other-user'] // Current user not authorized
        };

        const mockSnap = {
            exists: () => true,
            data: () => mockData
        };

        await act(async () => {
            await snapshotCallback(mockSnap);
        });

        expect(updateDoc).toHaveBeenCalled(); // Redirect update
    });
});
