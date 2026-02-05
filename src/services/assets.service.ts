import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    CollectionReference,
} from 'firebase/firestore';

import { db, appId } from '../firebase';
import { Asset } from '../types';

export type AssetData = Omit<Asset, 'id'>;

/**
 * AssetService
 * Handles CRUD operations for Assets in Firestore.
 */
class AssetService {
    /**
     * Helper to get assets collection reference
     */
    private getCollectionRef(budgetId: string): CollectionReference {
        return collection(db, 'artifacts', appId, 'public', 'data', 'budgets', budgetId, 'assets');
    }

    /**
     * Add a new asset
     */
    async addAsset(budgetId: string, data: AssetData) {
        if (!budgetId) throw new Error('Missing budgetId');

        const payload = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(this.getCollectionRef(budgetId), payload);
        return { id: docRef.id, ...payload };
    }

    /**
     * Update an existing asset
     */
    async updateAsset(budgetId: string, id: string, data: Partial<AssetData>) {
        if (!budgetId || !id) throw new Error('Missing budgetId or asset ID');

        const docRef = doc(this.getCollectionRef(budgetId), id);
        const payload = {
            ...data,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(docRef, payload);
        return { id, ...payload };
    }

    /**
     * Delete an asset
     */
    async deleteAsset(budgetId: string, id: string) {
        if (!budgetId || !id) throw new Error('Missing budgetId or asset ID');
        const docRef = doc(this.getCollectionRef(budgetId), id);
        await deleteDoc(docRef);
    }
}

export const assetsService = new AssetService();
