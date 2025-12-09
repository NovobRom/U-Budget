import { useState, useEffect } from 'react';
import { 
    collection, query, where, onSnapshot, 
    doc, updateDoc, deleteDoc, setDoc, 
    arrayUnion, serverTimestamp 
} from 'firebase/firestore'; // [FIX] Прибрав getDoc з імпортів, бо він більше не потрібен тут
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';

export const useFamilySync = (currentUserId, userEmail, userName) => {
    const [incomingRequests, setIncomingRequests] = useState([]);

    // 1. Слухаємо ВХІДНІ запити
    useEffect(() => {
        if (!currentUserId) return;
        
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'budget_requests'), 
            where("targetBudgetId", "==", currentUserId),
            where("status", "==", "pending") 
        );
        
        const unsubscribe = onSnapshot(q, (snap) => { 
            const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setIncomingRequests(reqs); 
        }, (error) => {
            console.error("Error listening to budget_requests:", error);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    // 2. Слухаємо МІЙ ВИХІДНИЙ запит
    useEffect(() => {
        if (!currentUserId) return;
        
        const myRequestRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId);
        
        const unsubscribe = onSnapshot(myRequestRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                
                if (data.status === 'approved') {
                    try {
                        await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
                            activeBudgetId: data.targetBudgetId, 
                            isPendingApproval: false 
                        });
                        await deleteDoc(myRequestRef);
                        toast.success("Ваш запит прийнято! Бюджет підключено.");
                    } catch (error) {
                        console.error("Auto-switch error:", error);
                        toast.error("Помилка перемикання бюджету.");
                    }
                }
                
                if (data.status === 'rejected') {
                    await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
                        isPendingApproval: false,
                        activeBudgetId: currentUserId 
                    });
                    await deleteDoc(myRequestRef);
                    toast.error("Запит на приєднання відхилено.");
                }
            }
        });

        return () => unsubscribe();
    }, [currentUserId]);

    // Дії (Actions)

    const sendJoinRequest = async (targetBudgetId) => {
        console.log(`Sending join request from ${currentUserId} to ${targetBudgetId}`);
        
        if (targetBudgetId === currentUserId) throw new Error("cannot_join_self");

        // [SECURE FIX]
        // Ми видалили перевірку targetSnap = await getDoc(targetBudgetRef).
        // Це дозволяє відправити запит "наосліп". Якщо ID невірний, запит просто висітиме,
        // але це краще, ніж відкривати читання бюджетів для всіх.

        // Створюємо запит
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId), { 
            requesterUid: currentUserId, 
            targetBudgetId: targetBudgetId, 
            status: 'pending', 
            timestamp: serverTimestamp(), 
            name: userName || 'Unknown', 
            email: userEmail 
        });
        
        // Ставимо собі статус "Очікування"
        await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
            isPendingApproval: true, 
            activeBudgetId: targetBudgetId 
        });
    };

    const cancelSentRequest = async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId));
        await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
            isPendingApproval: false, 
            activeBudgetId: currentUserId 
        });
    };

    const approveRequest = async (req) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budgets', currentUserId), { 
            authorizedUsers: arrayUnion(req.requesterUid) 
        });
        
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', req.requesterUid), {
            status: 'approved'
        });
    };

    const declineRequest = async (reqId) => {
        const uidToReject = typeof reqId === 'object' ? reqId.requesterUid : reqId;
        
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', uidToReject), {
            status: 'rejected'
        });
    };

    const disconnectUser = async () => {
         // Placeholder
    };

    return { 
        incomingRequests, 
        sendJoinRequest, 
        cancelSentRequest,
        approveRequest, 
        declineRequest,
        disconnectUser
    };
};