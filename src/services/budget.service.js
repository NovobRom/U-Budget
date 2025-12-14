import { 
    doc, updateDoc, arrayRemove 
} from 'firebase/firestore';
import { db, appId } from '../firebase';

/**
 * BudgetService
 * Handles Budget-level administrative operations (Team management, etc).
 */
class BudgetService {
    /**
     * Helper: Get main budget document reference
     */
    getBudgetDocRef(budgetId) {
        return doc(db, 'artifacts', appId, 'public', 'data', 'budgets', budgetId);
    }

    /**
     * Remove a user from the budget
     * @param {string} budgetId 
     * @param {string} userIdToRemove 
     */
    async removeUser(budgetId, userIdToRemove) {
        if (!budgetId || !userIdToRemove) throw new Error('Missing args');

        const budgetRef = this.getBudgetDocRef(budgetId);
        
        // Atomically remove the UID from the authorizedUsers array
        // FIXED: Changed 'allowedUsers' to 'authorizedUsers' to match firestore.rules
        await updateDoc(budgetRef, {
            authorizedUsers: arrayRemove(userIdToRemove)
        });
    }

    /**
     * Leave the current budget (remove self)
     * @param {string} budgetId 
     * @param {string} currentUserId 
     */
    async leaveBudget(budgetId, currentUserId) {
        // Leaving is essentially removing oneself
        await this.removeUser(budgetId, currentUserId);
    }
}

export const budgetService = new BudgetService();