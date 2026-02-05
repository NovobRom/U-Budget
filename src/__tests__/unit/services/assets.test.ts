import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assetsService, AssetData } from '../../../services/assets.service';
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

describe('AssetsService', () => {
    const budgetId = 'budget-123';
    const assetId = 'asset-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addAsset', () => {
        const assetData: AssetData = {
            name: 'Test Asset',
            value: 1000,
            currency: 'USD',
            type: 'bank'
        };

        it('should add asset using addDoc', async () => {
            const result = await assetsService.addAsset(budgetId, assetData);

            expect(collection).toHaveBeenCalled();
            expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
                ...assetData,
                createdAt: 'mock-timestamp',
                updatedAt: 'mock-timestamp'
            }));
            expect(result).toEqual({ id: 'mock-doc-id', ...assetData, createdAt: 'mock-timestamp', updatedAt: 'mock-timestamp' });
        });

        it('should throw if budgetId missing', async () => {
            await expect(assetsService.addAsset('', assetData)).rejects.toThrow('Missing budgetId');
        });
    });

    describe('updateAsset', () => {
        const updateData: Partial<AssetData> = {
            value: 1200
        };

        it('should update asset using updateDoc', async () => {
            await assetsService.updateAsset(budgetId, assetId, updateData);

            expect(doc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
                ...updateData,
                updatedAt: 'mock-timestamp'
            }));
        });

        it('should throw if args missing', async () => {
            await expect(assetsService.updateAsset('', assetId, updateData)).rejects.toThrow('Missing budgetId');
        });
    });

    describe('deleteAsset', () => {
        it('should delete asset using deleteDoc', async () => {
            await assetsService.deleteAsset(budgetId, assetId);

            expect(doc).toHaveBeenCalled();
            expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
        });
    });
});
