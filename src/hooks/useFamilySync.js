import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { db, appId } from '../firebase';

export const useFamilySync = (currentUserId, userEmail, userName) => {
    const [incomingRequests, setIncomingRequests] = useState([]);

    // 1. Listen for INCOMING requests (where I am the target)
    useEffect(() => {
        if (!currentUserId) return;

        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'budget_requests'),
            where('targetBudgetId', '==', currentUserId),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                const reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setIncomingRequests(reqs);
            },
            (error) => {
                console.error('Error listening to budget_requests:', error);
            }
        );

        return () => unsubscribe();
    }, [currentUserId]);

    // 2. Listen for MY OUTGOING request status
    useEffect(() => {
        if (!currentUserId) return;

        const myRequestRef = doc(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'budget_requests',
            currentUserId
        );

        const unsubscribe = onSnapshot(myRequestRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();

                if (data.status === 'approved') {
                    try {
                        await updateDoc(
                            doc(
                                db,
                                'artifacts',
                                appId,
                                'users',
                                currentUserId,
                                'metadata',
                                'profile'
                            ),
                            {
                                activeBudgetId: data.targetBudgetId,
                                isPendingApproval: false,
                            }
                        );
                        await deleteDoc(myRequestRef);
                        toast.success('Ваш запит прийнято! Бюджет підключено.');
                    } catch (error) {
                        console.error('Auto-switch error:', error);
                        toast.error('Помилка перемикання бюджету.');
                    }
                }

                if (data.status === 'rejected') {
                    await updateDoc(
                        doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'),
                        {
                            isPendingApproval: false,
                            activeBudgetId: currentUserId,
                        }
                    );
                    await deleteDoc(myRequestRef);
                    toast.error('Запит на приєднання відхилено.');
                }
            }
        });

        return () => unsubscribe();
    }, [currentUserId]);

    // Actions

    const sendJoinRequest = async (targetBudgetId) => {
        if (targetBudgetId === currentUserId) throw new Error('cannot_join_self');

        // Create request
        await setDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId),
            {
                requesterUid: currentUserId,
                targetBudgetId: targetBudgetId,
                status: 'pending',
                timestamp: serverTimestamp(),
                name: userName || 'Unknown',
                email: userEmail,
            }
        );

        // Update local profile status
        await updateDoc(
            doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'),
            {
                isPendingApproval: true,
                activeBudgetId: targetBudgetId,
            }
        );
    };

    const cancelSentRequest = async () => {
        await deleteDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId)
        );
        await updateDoc(
            doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'),
            {
                isPendingApproval: false,
                activeBudgetId: currentUserId,
            }
        );
    };

    const approveRequest = async (req) => {
        // Add user to authorizedUsers in the Budget document
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budgets', currentUserId), {
            authorizedUsers: arrayUnion(req.requesterUid),
        });

        // Update request status so the requester's listener triggers the switch
        await updateDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', req.requesterUid),
            {
                status: 'approved',
            }
        );
    };

    const declineRequest = async (reqId) => {
        const uidToReject = typeof reqId === 'object' ? reqId.requesterUid : reqId;

        await updateDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', uidToReject),
            {
                status: 'rejected',
            }
        );
    };

    const disconnectUser = async (currentActiveBudgetId) => {
        // FIXED: Ensure we have a valid string ID, not an Event object or null
        if (!currentActiveBudgetId || typeof currentActiveBudgetId !== 'string') {
            console.error('disconnectUser: Invalid budget ID', currentActiveBudgetId);
            // Fallback: if user tries to disconnect without ID, assume they want to leave their current active budget
            // But we cannot safely assume that without context. Better to return error.
            return;
        }

        if (currentActiveBudgetId === currentUserId) return;

        try {
            // 1. Remove self from the remote budget's authorizedUsers
            await updateDoc(
                doc(db, 'artifacts', appId, 'public', 'data', 'budgets', currentActiveBudgetId),
                {
                    authorizedUsers: arrayRemove(currentUserId),
                }
            );

            // 2. Reset local profile to point to own budget
            await updateDoc(
                doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'),
                {
                    activeBudgetId: currentUserId,
                }
            );

            toast.success('Ви успішно відключилися від бюджету');
        } catch (error) {
            console.error('Error disconnecting:', error);
            toast.error('Помилка відключення');
        }
    };

    return {
        incomingRequests,
        sendJoinRequest,
        cancelSentRequest,
        approveRequest,
        declineRequest,
        disconnectUser,
    };
};
