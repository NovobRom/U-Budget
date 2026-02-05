import { describe, it, expect, vi, beforeEach } from 'vitest';
import { budgetService } from '../../../services/budget.service';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';

// --- MOCKS ---

vi.mock('../../../firebase', () => ({
    db: {},
    appId: 'test-app-id'
}));

const { mockDocRef } = vi.hoisted(() => {
    return {
        mockDocRef: { id: 'mock-doc-id', path: 'mock/path' }
    };
});

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => mockDocRef),
    updateDoc: vi.fn(),
    arrayRemove: vi.fn((...args) => ({ type: 'arrayRemove', elements: args })),
    DocumentReference: class { },
}));

describe('BudgetService', () => {
    const budgetId = 'budget-123';
    const userId = 'user-abc';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('removeUser', () => {
        it('should remove user from authorizedUsers array', async () => {
            await budgetService.removeUser(budgetId, userId);

            expect(doc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
                authorizedUsers: expect.objectContaining({ type: 'arrayRemove', elements: [userId] })
            });
        });

        it('should throw if args are missing', async () => {
            await expect(budgetService.removeUser('', userId)).rejects.toThrow('Missing args');
            await expect(budgetService.removeUser(budgetId, '')).rejects.toThrow('Missing args');
        });
    });

    describe('leaveBudget', () => {
        it('should call removeUser with self id', async () => {
            // Spy on removeUser to verify delegation
            const removeUserSpy = vi.spyOn(budgetService, 'removeUser');

            await budgetService.leaveBudget(budgetId, userId);

            expect(removeUserSpy).toHaveBeenCalledWith(budgetId, userId);
        });
    });
});
