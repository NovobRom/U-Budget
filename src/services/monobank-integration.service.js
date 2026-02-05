import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

import { db, appId } from '../firebase';

/**
 * Monobank Integration Service
 * Stores Monobank token and accounts in Firestore for cross-device sync
 *
 * Path: /artifacts/{appId}/users/{userId}/integrations/monobank
 */

const getIntegrationDocRef = (userId) => {
    return doc(db, 'artifacts', appId, 'users', userId, 'integrations', 'monobank');
};

/**
 * Get Monobank configuration from Firestore
 */
export const getMonobankConfig = async (userId) => {
    if (!userId) return null;

    try {
        const docRef = getIntegrationDocRef(userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('[MonobankIntegration] Error reading config:', error);
        return null;
    }
};

/**
 * Save Monobank configuration to Firestore
 */
export const saveMonobankConfig = async (userId, config) => {
    if (!userId) throw new Error('User ID required');

    try {
        const docRef = getIntegrationDocRef(userId);
        await setDoc(
            docRef,
            {
                token: config.token || '',
                accounts: config.accounts || [],
                lastSyncTime: config.lastSyncTime || 0,
                updatedAt: Date.now(),
            },
            { merge: true }
        );

        return true;
    } catch (error) {
        console.error('[MonobankIntegration] Error saving config:', error);
        throw error;
    }
};

/**
 * Delete Monobank configuration from Firestore
 */
export const deleteMonobankConfig = async (userId) => {
    if (!userId) return;

    try {
        const docRef = getIntegrationDocRef(userId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('[MonobankIntegration] Error deleting config:', error);
        throw error;
    }
};
