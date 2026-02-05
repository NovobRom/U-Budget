import { renderHook, act, waitFor } from '@testing-library/react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification,
    signOut,
} from 'firebase/auth';
import { onSnapshot, setDoc } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuth } from '../../../hooks/useAuth';

vi.mock('../../../firebase', () => ({
    auth: { currentUser: null },
    db: {},
    appId: 'test-app-id',
}));

const { mockDocRef } = vi.hoisted(() => ({
    mockDocRef: { id: 'mock-doc-id' },
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => mockDocRef),
    setDoc: vi.fn(),
    onSnapshot: vi.fn(),
    DocumentReference: class { },
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    updateProfile: vi.fn(),
    GoogleAuthProvider: class {
        setCustomParameters() { }
    },
    signInWithPopup: vi.fn(),
    sendEmailVerification: vi.fn(),
}));

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with loading state and subscribe to auth', () => {
        vi.mocked(onAuthStateChanged).mockImplementation(
            () => vi.fn() as unknown as () => void
        );

        const { result } = renderHook(() => useAuth());

        expect(result.current.loading).toBe(true);
        expect(onAuthStateChanged).toHaveBeenCalled();
    });

    it('should update user and profile on auth state change', async () => {
        let authCallback: (user: unknown) => void = () => { };
        vi.mocked(onAuthStateChanged).mockImplementation(
            (_auth: unknown, cb: unknown) => {
                authCallback = cb as (user: unknown) => void;
                return vi.fn() as unknown as () => void;
            }
        );

        let profileCallback: (snap: unknown) => void = () => { };
        vi.mocked(onSnapshot).mockImplementation((_ref: unknown, cb: unknown) => {
            profileCallback = cb as (snap: unknown) => void;
            return vi.fn() as unknown as () => void;
        });

        const { result } = renderHook(() => useAuth());

        const mockUser = { uid: 'user-1', email: 'test@test.com' };

        act(() => {
            authCallback(mockUser);
        });

        expect(result.current.user).toEqual(mockUser);
        expect(onSnapshot).toHaveBeenCalled();

        // Simulate profile load
        const mockProfileSnap = {
            exists: () => true,
            data: () => ({
                activeBudgetId: 'budget-1',
                isPendingApproval: false,
            }),
        };

        act(() => {
            profileCallback(mockProfileSnap);
        });

        await waitFor(() => {
            expect(result.current.activeBudgetId).toBe('budget-1');
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle registration flow', async () => {
        // Setup initial auth subscription to just do nothing so hook renders
        vi.mocked(onAuthStateChanged).mockImplementation(
            () => vi.fn() as unknown as () => void
        );

        const { result } = renderHook(() => useAuth());

        const mockUser = { uid: 'new-user', email: 'new@test.com' };
        vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
            user: mockUser,
        } as any);
        vi.mocked(updateProfile).mockResolvedValue(undefined as any);
        vi.mocked(setDoc).mockResolvedValue(undefined as any); // Profile creation

        await act(async () => {
            await result.current.register('new@test.com', 'password', 'New User');
        });

        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            'new@test.com',
            'password'
        );
        expect(updateProfile).toHaveBeenCalledWith(mockUser, {
            displayName: 'New User',
        });
        expect(setDoc).toHaveBeenCalled(); // Profile creation
        expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('should handle logout', async () => {
        vi.mocked(onAuthStateChanged).mockImplementation(
            () => vi.fn() as unknown as () => void
        );
        const { result } = renderHook(() => useAuth());

        await act(async () => {
            await result.current.logout();
        });

        expect(signOut).toHaveBeenCalled();
    });
});
