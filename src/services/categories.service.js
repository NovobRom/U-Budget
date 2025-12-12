import { 
    collection, doc, addDoc, deleteDoc, updateDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { db, appId } from '../firebase';

/**
 * CategoriesService
 * Handles management of Custom Categories and Budget Limits.
 */
class CategoriesService {
    /**
     * Helper: Get custom categories collection reference
     */
    getCategoriesColRef(budgetId) {
        return collection(db, 'artifacts', appId, 'users', budgetId, 'categories');
    }

    /**
     * Helper: Get main budget document reference (where limits are stored)
     */
    getBudgetDocRef(budgetId) {
        return doc(db, 'artifacts', appId, 'public', 'data', 'budgets', budgetId);
    }

    /**
     * Add a custom category
     * @param {string} budgetId 
     * @param {object} data - { name, type, color, icon, ... }
     */
    async addCategory(budgetId, data) {
        if (!budgetId) throw new Error('Missing budgetId');
        
        const payload = {
            ...data,
            isCustom: true,
            createdAt: serverTimestamp()
        };

        // Add to the subcollection
        const docRef = await addDoc(this.getCategoriesColRef(budgetId), payload);
        return { id: docRef.id, ...payload };
    }

    /**
     * Delete a custom category
     * @param {string} budgetId 
     * @param {string} categoryId 
     */
    async deleteCategory(budgetId, categoryId) {
        if (!budgetId || !categoryId) throw new Error('Missing args');
        
        // Construct reference to the specific category document
        const catRef = doc(this.getCategoriesColRef(budgetId), categoryId);
        await deleteDoc(catRef);
    }

    /**
     * Save or Update a spending limit for a category
     * @param {string} budgetId 
     * @param {string} categoryId 
     * @param {number} amount 
     */
    async saveLimit(budgetId, categoryId, amount) {
        if (!budgetId || !categoryId) throw new Error('Missing args');

        const budgetRef = this.getBudgetDocRef(budgetId);
        
        // Update the specific field in the 'limits' map using dot notation
        // e.g., "limits.groceries": 500
        await updateDoc(budgetRef, {
            [`limits.${categoryId}`]: parseFloat(amount)
        });
    }
}

export const categoriesService = new CategoriesService();