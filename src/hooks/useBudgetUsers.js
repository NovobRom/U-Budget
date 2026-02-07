import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

import { db, appId } from '../firebase';

/**
 * useBudgetUsers Hook
 * Handles user management operations for budgets
 *
 * @param {string} activeBudgetId - Current budget ID
 * @param {object|null} user - Current user object
 * @param {function} getBudgetDocRef - Function to get budget document reference
 *
 * @returns {object} { removeUser, leaveBudget, switchBudget }
 */
export const useBudgetUsers = (activeBudgetId, user, getBudgetDocRef) => {
    /**
     * Remove a user from the budget's authorized users
     * @param {string|object} u - User ID (string) or User object with uid
     */
    const removeUser = async (u) => {
        if (!activeBudgetId) return;

        // Extract UID safely - handle both string and object
        let uidToRemove = null;
        if (typeof u === 'string') {
            uidToRemove = u;
        } else if (u && typeof u === 'object' && u.uid) {
            uidToRemove = u.uid;
        }

        if (!uidToRemove) {
            console.error('removeUser: Invalid user argument', u);
            toast.error('Error: Invalid user ID');
            return;
        }

        try {
            await updateDoc(getBudgetDocRef(), {
                authorizedUsers: arrayRemove(uidToRemove),
            });
            toast.success('User removed successfully');
        } catch (e) {
            console.error('Error removing user:', e);
            toast.error('Error removing user');
        }
    };

    /**
     * Leave the current budget and switch to own budget
     */
    const leaveBudget = async () => {
        if (!activeBudgetId || !user) return;

        try {
            // Remove self from authorized users
            await updateDoc(getBudgetDocRef(), {
                authorizedUsers: arrayRemove(user.uid),
            });

            // Switch to own budget
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), {
                activeBudgetId: user.uid,
            });

            toast.success('You have left the budget');
        } catch (e) {
            console.error('Error leaving budget:', e);
            toast.error('Error leaving budget');
        }
    };

    /**
     * Switch to a different budget
     * @param {string} id - Budget ID to switch to
     */
    const switchBudget = async (id) => {
        if (!user) return;

        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), {
                activeBudgetId: id,
                isPendingApproval: false,
            });

            // Reload page to refresh all data
            window.location.reload();
        } catch (e) {
            console.error('Error switching budget:', e);
            toast.error('Error switching budget');
        }
    };

    return {
        removeUser,
        leaveBudget,
        switchBudget,
    };
};
