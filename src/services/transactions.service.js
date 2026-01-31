import { 
    collection, doc, writeBatch, serverTimestamp, increment, runTransaction 
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { fetchExchangeRate } from '../utils/currency';

/**
 * TransactionService
 * Handles all direct interactions with Firestore regarding transactions.
 * Decoupled from React state and hooks.
 */
class TransactionService {
    constructor() {
        this.storageCurrency = 'EUR';
    }

    /**
     * Helper to get transaction collection reference
     */
    getTxColRef(budgetId) {
        return collection(db, 'artifacts', appId, 'users', budgetId, 'transactions');
    }

    /**
     * Helper to get budget document reference
     */
    getBudgetDocRef(budgetId) {
        return doc(db, 'artifacts', appId, 'public', 'data', 'budgets', budgetId);
    }

    /**
     * Add a new transaction
     * @param {string} budgetId - The active budget ID
     * @param {object} user - The current user object (uid, displayName)
     * @param {object} data - Transaction form data
     * @param {string} mainCurrency - The user's main display currency
     */
    async addTransaction(budgetId, user, data, mainCurrency = 'EUR') {
        if (!budgetId || !user) throw new Error('Missing budgetId or user');

        const batch = writeBatch(db);
        const newTxRef = doc(this.getTxColRef(budgetId));
        
        const inputCurrency = data.originalCurrency || mainCurrency;
        let rateToStorage = 1;

        // Calculate rate if input currency differs from storage currency (EUR)
        if (inputCurrency !== this.storageCurrency) {
            try {
                rateToStorage = await fetchExchangeRate(inputCurrency, this.storageCurrency);
            } catch (error) {
                console.error("Failed to fetch rate:", error);
                throw new Error(`Currency conversion failed: ${error.message}`);
            }
        }

        const absOriginal = Math.abs(data.originalAmount);
        const amountInStorage = absOriginal * rateToStorage;

        const payload = { 
            ...data, 
            originalAmount: absOriginal,
            amount: amountInStorage, 
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0], 
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp() 
        };

        batch.set(newTxRef, payload);

        // Update budget balance
        const adjustment = payload.type === 'income' ? amountInStorage : -amountInStorage;
        batch.update(this.getBudgetDocRef(budgetId), { currentBalance: increment(adjustment) });

        await batch.commit();
        return { id: newTxRef.id, ...payload };
    }

    /**
     * Update an existing transaction
     */
    async updateTransaction(budgetId, id, newData, mainCurrency = 'EUR') {
        if (!budgetId) throw new Error('Missing budgetId');

        const txRef = doc(this.getTxColRef(budgetId), id);
        const budgetRef = this.getBudgetDocRef(budgetId);

        await runTransaction(db, async (transaction) => {
            const txDoc = await transaction.get(txRef);
            if (!txDoc.exists()) throw new Error("Transaction does not exist!");
            
            const oldData = txDoc.data();
            const oldStorageAmount = Math.abs(parseFloat(oldData.amount));
            const oldImpact = oldData.type === 'income' ? oldStorageAmount : -oldStorageAmount;

            const inputCurrency = newData.originalCurrency || mainCurrency;
            let newRateToStorage = 1;

            if (inputCurrency !== this.storageCurrency) {
                try {
                    newRateToStorage = await fetchExchangeRate(inputCurrency, this.storageCurrency);
                } catch (error) {
                    console.error("Failed to fetch rate:", error);
                    throw new Error(`Currency conversion failed: ${error.message}`);
                }
            }
            
            const absNewOriginal = Math.abs(newData.originalAmount);
            const newStorageAmount = absNewOriginal * newRateToStorage;
            const newImpact = newData.type === 'income' ? newStorageAmount : -newStorageAmount;

            const diff = newImpact - oldImpact;

            transaction.update(txRef, { 
                ...newData, 
                originalAmount: absNewOriginal,
                amount: newStorageAmount, 
                updatedAt: serverTimestamp() 
            });
            
            // Optimize write: only update balance if significant change
            if (Math.abs(diff) > 0.0001) {
                transaction.update(budgetRef, { currentBalance: increment(diff) });
            }
        });
    }

    /**
     * Delete a transaction
     */
    async deleteTransaction(budgetId, id) {
        if (!budgetId) throw new Error('Missing budgetId');

        const txRef = doc(this.getTxColRef(budgetId), id);
        const budgetRef = this.getBudgetDocRef(budgetId);

        await runTransaction(db, async (transaction) => {
            const txDoc = await transaction.get(txRef);
            if (!txDoc.exists()) throw new Error("Transaction not found");
            
            const oldData = txDoc.data();
            const oldStorageAmount = Math.abs(parseFloat(oldData.amount));
            const adjustment = oldData.type === 'income' ? -oldStorageAmount : oldStorageAmount;

            transaction.delete(txRef);
            transaction.update(budgetRef, { currentBalance: increment(adjustment) });
        });
    }
}

export const transactionsService = new TransactionService();