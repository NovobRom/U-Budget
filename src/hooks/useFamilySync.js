import { useState, useEffect } from 'react';
import { 
    collection, query, where, onSnapshot, 
    doc, updateDoc, deleteDoc, setDoc, getDoc, 
    arrayUnion, serverTimestamp 
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';

export const useFamilySync = (currentUserId, userEmail, userName) => {
    const [incomingRequests, setIncomingRequests] = useState([]);

    // 1. Слухаємо ВХІДНІ запити (хто хоче до нас)
    useEffect(() => {
        if (!currentUserId) return;
        
        // Логування для дебагу
        console.log("Listening for requests to budget:", currentUserId);

        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'budget_requests'), 
            where("targetBudgetId", "==", currentUserId),
            where("status", "==", "pending") 
        );
        
        const unsubscribe = onSnapshot(q, (snap) => { 
            const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log("Incoming requests updated:", reqs);
            setIncomingRequests(reqs); 
        }, (error) => {
            console.error("Error listening to budget_requests:", error);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    // 2. Слухаємо МІЙ ВИХІДНИЙ запит (чи прийняли мене?)
    useEffect(() => {
        if (!currentUserId) return;
        
        const myRequestRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId);
        
        const unsubscribe = onSnapshot(myRequestRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                console.log("My request status update:", data);
                
                // СЦЕНАРІЙ А: Мене прийняли (Approved)
                if (data.status === 'approved') {
                    try {
                        await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
                            activeBudgetId: data.targetBudgetId, 
                            isPendingApproval: false 
                        });
                        
                        await deleteDoc(myRequestRef);
                        toast.success("Ваш запит прийнято! Бюджет підключено.");
                        
                        // window.location.reload() ВИДАЛЕНО
                        // Тепер useAuth.js через onSnapshot побачить зміну activeBudgetId 
                        // і автоматично оновить інтерфейс.
                        
                    } catch (error) {
                        console.error("Auto-switch error:", error);
                        toast.error("Помилка перемикання бюджету.");
                    }
                }
                
                // СЦЕНАРІЙ Б: Мене відхилили (Rejected)
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

        const targetBudgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'budgets', targetBudgetId);
        const targetSnap = await getDoc(targetBudgetRef);

        if (!targetSnap.exists()) {
            console.error("Budget not found:", targetBudgetId);
            throw new Error("budget_not_found");
        }

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