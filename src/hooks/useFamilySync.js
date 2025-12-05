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
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'budget_requests'), 
            where("targetBudgetId", "==", currentUserId),
            where("status", "==", "pending") 
        );
        return onSnapshot(q, (snap) => { 
            setIncomingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        });
    }, [currentUserId]);

    // 2. Слухаємо МІЙ ВИХІДНИЙ запит (чи прийняли мене?)
    useEffect(() => {
        if (!currentUserId) return;
        
        // Слухаємо документ запиту, де ID документа == мій UID
        const myRequestRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId);
        
        const unsubscribe = onSnapshot(myRequestRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                
                // СЦЕНАРІЙ А: Мене прийняли (Approved)
                if (data.status === 'approved') {
                    try {
                        // 1. Оновлюємо свій профіль: підключаємося до бюджету
                        await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
                            activeBudgetId: data.targetBudgetId, 
                            isPendingApproval: false 
                        });
                        
                        // 2. Видаляємо запит (прибирання за собою)
                        await deleteDoc(myRequestRef);
                        
                        toast.success("Ваш запит прийнято! Бюджет підключено.");
                        
                        // 3. Форсуємо перезавантаження, щоб підтягнути нові дані
                        window.location.reload();
                    } catch (error) {
                        console.error("Auto-switch error:", error);
                        toast.error("Помилка перемикання бюджету. Спробуйте ще раз.");
                    }
                }
                
                // СЦЕНАРІЙ Б: Мене відхилили (Rejected)
                if (data.status === 'rejected') {
                    await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
                        isPendingApproval: false,
                        activeBudgetId: currentUserId // Повертаємося до свого бюджету
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
        if (targetBudgetId === currentUserId) throw new Error("cannot_join_self");

        const targetBudgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'budgets', targetBudgetId);
        const targetSnap = await getDoc(targetBudgetRef);

        if (!targetSnap.exists()) throw new Error("budget_not_found");

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
        // 1. Додаємо UID партнера в authorizedUsers (тільки ID, ім'я підтягнеться саме)
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budgets', currentUserId), { 
            authorizedUsers: arrayUnion(req.requesterUid) 
        });
        
        // 2. Ставимо статус 'approved' у запиті
        // Це тригерне слухача (useEffect №2) у Партнера, і його додаток зробить решту
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', req.requesterUid), {
            status: 'approved'
        });
    };

    const declineRequest = async (reqId) => {
        // Приймаємо ID або об'єкт
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