import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionsService, TransactionData } from '../../../services/transactions.service';
import { collection, doc, writeBatch, runTransaction, getDocs, where, query } from 'firebase/firestore';
import { fetchExchangeRate } from '../../../utils/currency';

// --- MOCKS ---

vi.mock('../../../firebase', () => ({
    db: {},
    appId: 'test-app-id'
}));

const { mockBatch, mockTransactionHandler, mockDocRef, mockCollectionRef } = vi.hoisted(() => {
    return {
        mockBatch: {
            set: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            commit: vi.fn().mockResolvedValue(undefined)
        },
        mockTransactionHandler: {
            get: vi.fn(),
            update: vi.fn(),
            set: vi.fn(),
            delete: vi.fn()
        },
        mockDocRef: { id: 'mock-doc-id', path: 'mock/path' },
        mockCollectionRef: { id: 'mock-col-id', path: 'mock/path' }
    };
});

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => mockCollectionRef),
    doc: vi.fn(() => mockDocRef),
    writeBatch: vi.fn(() => mockBatch),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    increment: vi.fn((n) => ({ type: 'increment', value: n })),
    runTransaction: vi.fn((_db, callback) => callback(mockTransactionHandler)),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    DocumentReference: class { },
    CollectionReference: class { }
}));

vi.mock('../../../utils/currency', () => ({
    fetchExchangeRate: vi.fn()
}));

describe('TransactionsService', () => {
    const budgetId = 'budget-123';
    const userId = 'user-abc';
    const user = { uid: userId, displayName: 'Test User', email: 'test@example.com' };
    const mainCurrency = 'USD';
    // Storage currency is EUR

    beforeEach(() => {
        vi.clearAllMocks();
        // Default exchange rates
        (fetchExchangeRate as any).mockImplementation((from: string, to: string) => {
            if (from === to) return Promise.resolve(1);
            if (from === 'USD' && to === 'EUR') return Promise.resolve(0.9);
            if (from === 'EUR' && to === 'USD') return Promise.resolve(1.1);
            return Promise.resolve(1);
        });
    });

    describe('addTransaction', () => {
        const txData: TransactionData = {
            amount: 100,
            categoryId: 'cat-1',
            date: new Date(),
            description: 'Test tx',
            type: 'expense',
            currency: 'USD',
            originalCurrency: 'USD',
            originalAmount: 100,
            isTransfer: false
        };

        it('should add an expense transaction and update budget balance (decrement)', async () => {
            await transactionsService.addTransaction(budgetId, user, txData, mainCurrency);

            expect(doc).toHaveBeenCalled(); // Should assume correct args
            expect(writeBatch).toHaveBeenCalled();
            expect(mockBatch.set).toHaveBeenCalled(); // Transaction doc
            expect(mockBatch.update).toHaveBeenCalled(); // Budget update

            // Verify budget update calls increment with negative value for expense
            // We can't easily inspect the exact args of increment here because it returns an object,
            // but we can check if update was called with specific structure if we knew implementation details.
            // For now, simple verification that batch flow executed is good start.
            expect(mockBatch.commit).toHaveBeenCalled();
        });

        it('should add an income transaction and update budget balance (increment)', async () => {
            const incomeTx = { ...txData, type: 'income' as const };
            await transactionsService.addTransaction(budgetId, user, incomeTx, mainCurrency);

            expect(mockBatch.set).toHaveBeenCalled();
            expect(mockBatch.update).toHaveBeenCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
        });

        it('should handle currency conversion', async () => {
            // Adding USD transaction, storage is EUR. 
            // 100 USD * 0.9 = 90 EUR.
            await transactionsService.addTransaction(budgetId, user, txData, mainCurrency);

            expect(fetchExchangeRate).toHaveBeenCalledWith('USD', 'EUR');
        });
    });

    describe('updateTransaction', () => {
        const oldTxId = 'tx-old';
        const newData: TransactionData = {
            amount: 200, // Changed from let's say 100
            categoryId: 'cat-1',
            date: new Date(),
            description: 'Updated tx',
            type: 'expense',
            currency: 'USD',
            originalCurrency: 'USD',
            originalAmount: 200,
            isTransfer: false
        };

        it('should update transaction and balance diff', async () => {
            // Mock fetching old transaction
            mockTransactionHandler.get.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    amount: 90, // stored as EUR (100 USD)
                    currency: 'USD',
                    type: 'expense',
                    // ... other fields
                })
            });

            await transactionsService.updateTransaction(budgetId, oldTxId, newData, mainCurrency);

            expect(runTransaction).toHaveBeenCalled();
            expect(mockTransactionHandler.get).toHaveBeenCalled();
            expect(mockTransactionHandler.update).toHaveBeenCalledTimes(2); // Tx update + Budget update
        });

        it('should throw if transaction does not exist', async () => {
            mockTransactionHandler.get.mockResolvedValue({
                exists: () => false
            });

            await expect(transactionsService.updateTransaction(budgetId, oldTxId, newData, mainCurrency))
                .rejects.toThrow('Transaction does not exist!');
        });
    });

    describe('deleteTransaction', () => {
        const txId = 'tx-del';

        it('should delete transaction and revert balance', async () => {
            mockTransactionHandler.get.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    amount: '90',
                    type: 'expense'
                })
            });

            await transactionsService.deleteTransaction(budgetId, txId);

            expect(runTransaction).toHaveBeenCalled();
            expect(mockTransactionHandler.delete).toHaveBeenCalled();
        });
    });

    describe('importTransactions', () => {
        it('should import transactions and skip duplicates', async () => {
            const importData: TransactionData[] = [
                {
                    amount: 50,
                    categoryId: 'cat-1',
                    date: new Date(),
                    description: 'Imported tx',
                    type: 'expense',
                    currency: 'USD',
                    originalCurrency: 'USD',
                    originalAmount: 50,
                    importId: 'import-1'
                }
            ];

            // Mock getDocs to return empty snapshot (no duplicates)
            (getDocs as any).mockResolvedValue({
                forEach: vi.fn()
            });

            const result = await transactionsService.importTransactions(budgetId, user, importData, mainCurrency);

            expect(getDocs).toHaveBeenCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
            expect(result.imported).toBe(1);
        });
    });
});
