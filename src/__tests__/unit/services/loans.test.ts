import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loansService } from '../../../services/loans.service';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';

// --- MOCKS ---

vi.mock('../../../firebase', () => ({
    db: {},
    appId: 'test-app-id'
}));

const { mockDocRef, mockCollectionRef } = vi.hoisted(() => {
    return {
        mockDocRef: { id: 'mock-doc-id', path: 'mock/path' },
        mockCollectionRef: { id: 'mock-col-id', path: 'mock/path' }
    };
});

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => mockCollectionRef),
    doc: vi.fn(() => mockDocRef),
    addDoc: vi.fn().mockResolvedValue(mockDocRef),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    CollectionReference: class { },
}));

describe('LoansService', () => {
    const budgetId = 'budget-123';
    const loanId = 'loan-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addLoan', () => {
        const loanData = {
            name: 'Test Loan',
            amount: 1000,
            currency: 'USD',
            type: 'debt' as const,
            paidAmount: 0
        };

        it('should add loan using addDoc', async () => {
            const result = await loansService.addLoan(budgetId, loanData);

            expect(collection).toHaveBeenCalled();
            expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
                ...loanData,
                createdAt: 'mock-timestamp',
                updatedAt: 'mock-timestamp'
            }));
            expect(result).toEqual({ id: 'mock-doc-id', ...loanData, createdAt: 'mock-timestamp', updatedAt: 'mock-timestamp' });
        });

        it('should throw if budgetId missing', async () => {
            await expect(loansService.addLoan('', loanData)).rejects.toThrow('Missing budgetId');
        });
    });

    describe('updateLoan', () => {
        const updateData = {
            paidAmount: 100
        };

        it('should update loan using updateDoc', async () => {
            await loansService.updateLoan(budgetId, loanId, updateData);

            expect(doc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
                ...updateData,
                updatedAt: 'mock-timestamp'
            }));
        });

        it('should throw if args missing', async () => {
            await expect(loansService.updateLoan('', loanId, updateData)).rejects.toThrow('Missing budgetId');
        });
    });

    describe('deleteLoan', () => {
        it('should delete loan using deleteDoc', async () => {
            await loansService.deleteLoan(budgetId, loanId);

            expect(doc).toHaveBeenCalled();
            expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
        });
    });
});
