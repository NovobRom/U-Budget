import { useState, useEffect } from 'react';
import { 
    collection, query, where, onSnapshot, 
    doc, updateDoc, deleteDoc, setDoc, getDoc, 
    arrayUnion, serverTimestamp 
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast'; // Додали для повідомлень

export const useFamilySync = (currentUserId, userEmail, userName) => {
    const [incomingRequests, setIncomingRequests] = useState([]);

    // 1. Слухаємо ВХІДНІ запити (хто хоче до нас) - Тільки активні (pending)
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

    // 2. 🔥 НОВЕ: Слухаємо МІЙ ВИХІДНИЙ запит (чи прийняли мене?)
    useEffect(() => {
        if (!currentUserId) return;
        
        // Слухаємо документ запиту, де ID документа == мій ID
        const myRequestRef = doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId);
        
        const unsubscribe = onSnapshot(myRequestRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                
                // СЦЕНАРІЙ А: Мене прийняли
                if (data.status === 'approved') {
                    // Я сам оновлюю свій профіль (бо я маю на це права)
                    await updateDoc(doc(db, 'artifacts', appId, 'users', currentUserId, 'metadata', 'profile'), { 
                        activeBudgetId: data.targetBudgetId, 
                        isPendingApproval: false 
                    });
                    
                    // Видаляємо запит, бо справу зроблено
                    await deleteDoc(myRequestRef);
                    toast.success("Ваш запит прийнято! Бюджет підключено.");
                }
                
                // СЦЕНАРІЙ Б: Мене відхилили
                if (data.status === 'rejected') {
                    // Я сам знімаю з себе статус "очікування"
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

    const sendJoinRequest = async (targetBudgetId) => {
        if (targetBudgetId === currentUserId) throw new Error("cannot_join_self");

        const targetBudgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'budgets', targetBudgetId);
        const targetSnap = await getDoc(targetBudgetRef);

        if (!targetSnap.exists()) throw new Error("budget_not_found");

        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', currentUserId), { 
            requesterUid: currentUserId, 
            targetBudgetId: targetBudgetId, 
            status: 'pending', 
            timestamp: serverTimestamp(), 
            name: userName || userEmail, 
            email: userEmail 
        });
        
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

    // 🔥 ВИПРАВЛЕНО: Ми не міняємо чужий профіль. Ми міняємо статус запиту.
    const approveRequest = async (req) => {
        // 1. Додаємо юзера до списку "своїх" у бюджеті
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budgets', currentUserId), { 
            authorizedUsers: arrayUnion({ uid: req.requesterUid, name: req.name, email: req.email }) 
        });
        
        // 2. Ставимо печатку "approved". Юзер (req.requesterUid) побачить це через useEffect і оновить свій профіль сам.
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', req.requesterUid), {
            status: 'approved'
        });
    };

    // 🔥 ВИПРАВЛЕНО: Просто ставимо статус rejected
    const declineRequest = async (req) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget_requests', req.requesterUid), {
            status: 'rejected'
        });
    };

    const disconnectUser = async (userToKick) => {
         // Тут поки залишаємо пустим або реалізуємо видалення з authorizedUsers
         // Для коректного видалення треба буде отримати поточний список і відфільтрувати його,
         // але це вимагає читання документа бюджету. 
         // Поки що це не критично для процесу "Приєднання".
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