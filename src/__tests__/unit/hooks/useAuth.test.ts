import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../../hooks/useAuth';
import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// --- MOCKS ---

vi.mock('../../../firebase', () => ({
    auth: { currentUser: null },
    db: {},
    appId: 'test-app-id'
}));

const { mockDocRef } = vi.hoisted(() => ({
    mockDocRef: { id: 'mock-doc-id' }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => mockDocRef),
    setDoc: vi.fn(),
    onSnapshot: vi.fn(),
    DocumentReference: class { }
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    updateProfile: vi.fn(),
    GoogleAuthProvider: class { setCustomParameters() { } },
    signInWithPopup: vi.fn(),
    sendEmailVerification: vi.fn(),
}));

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with loading state and subscribe to auth', () => {
        (onAuthStateChanged as any).mockImplementation(() => vi.fn());

        const { result } = renderHook(() => useAuth());

        expect(result.current.loading).toBe(true);
        expect(onAuthStateChanged).toHaveBeenCalled();
    });

    it('should update user and profile on auth state change', async () => {
        let authCallback: (user: any) => void = () => { };
        (onAuthStateChanged as any).mockImplementation((_auth: any, cb: any) => {
            authCallback = cb;
            return vi.fn();
        });

        let profileCallback: (snap: any) => void = () => { };
        (onSnapshot as any).mockImplementation((_ref: any, cb: any) => {
            profileCallback = cb;
            return vi.fn();
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
            data: () => ({ activeBudgetId: 'budget-1', isPendingApproval: false })
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
        (onAuthStateChanged as any).mockImplementation(() => vi.fn());

        const { result } = renderHook(() => useAuth());

        const mockUser = { uid: 'new-user', email: 'new@test.com' };
        (createUserWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });
        (updateProfile as any).mockResolvedValue(undefined);
        (setDoc as any).mockResolvedValue(undefined); // Profile creation

        await act(async () => {
            await result.current.register('new@test.com', 'password', 'New User');
        });

        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'new@test.com', 'password');
        expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'New User' });
        expect(setDoc).toHaveBeenCalled(); // Profile creation
        expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('should handle logout', async () => {
        (onAuthStateChanged as any).mockImplementation(() => vi.fn());
        const { result } = renderHook(() => useAuth());

        await act(async () => {
            await result.current.logout();
        });

        expect(signOut).toHaveBeenCalled();
    });
});
