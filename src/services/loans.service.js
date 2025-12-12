import { 
    collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db, appId } from '../firebase';

/**
 * LoanService
 * Handles CRUD operations for Loans/Credits in Firestore.
 */
class LoanService {
    /**
     * Helper to get loans collection reference
     */
    getCollectionRef(budgetId) {
        return collection(db, 'artifacts', appId, 'users', budgetId, 'loans');
    }

    /**
     * Add a new loan
     * @param {string} budgetId 
     * @param {object} data 
     */
    async addLoan(budgetId, data) {
        if (!budgetId) throw new Error('Missing budgetId');

        const payload = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(this.getCollectionRef(budgetId), payload);
        return { id: docRef.id, ...payload };
    }

    /**
     * Update an existing loan (also used for payments update)
     * @param {string} budgetId 
     * @param {string} id 
     * @param {object} data 
     */
    async updateLoan(budgetId, id, data) {
        if (!budgetId || !id) throw new Error('Missing budgetId or loan ID');

        const docRef = doc(this.getCollectionRef(budgetId), id);
        const payload = {
            ...data,
            updatedAt: serverTimestamp()
        };

        await updateDoc(docRef, payload);
        return { id, ...payload };
    }

    /**
     * Delete a loan
     * @param {string} budgetId 
     * @param {string} id 
     */
    async deleteLoan(budgetId, id) {
        if (!budgetId || !id) throw new Error('Missing budgetId or loan ID');
        const docRef = doc(this.getCollectionRef(budgetId), id);
        await deleteDoc(docRef);
    }
}

export const loansService = new LoanService();