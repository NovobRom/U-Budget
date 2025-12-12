import { 
    collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db, appId } from '../firebase';

/**
 * AssetService
 * Handles CRUD operations for Assets in Firestore.
 */
class AssetService {
    /**
     * Helper to get assets collection reference
     */
    getCollectionRef(budgetId) {
        return collection(db, 'artifacts', appId, 'users', budgetId, 'assets');
    }

    /**
     * Add a new asset
     * @param {string} budgetId 
     * @param {object} data 
     */
    async addAsset(budgetId, data) {
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
     * Update an existing asset
     * @param {string} budgetId 
     * @param {string} id 
     * @param {object} data 
     */
    async updateAsset(budgetId, id, data) {
        if (!budgetId || !id) throw new Error('Missing budgetId or asset ID');

        const docRef = doc(this.getCollectionRef(budgetId), id);
        const payload = {
            ...data,
            updatedAt: serverTimestamp()
        };

        await updateDoc(docRef, payload);
        return { id, ...payload };
    }

    /**
     * Delete an asset
     * @param {string} budgetId 
     * @param {string} id 
     */
    async deleteAsset(budgetId, id) {
        if (!budgetId || !id) throw new Error('Missing budgetId or asset ID');
        const docRef = doc(this.getCollectionRef(budgetId), id);
        await deleteDoc(docRef);
    }
}

export const assetsService = new AssetService();