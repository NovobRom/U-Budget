import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore'; // Changed from getDoc to onSnapshot
import { db, appId } from '../firebase';

/**
 * Hook to fetch and hydrate team member profiles from Firestore based on UIDs.
 * Switches to real-time listeners (onSnapshot) to reflect profile changes (like name edits) immediately.
 * * @param {string[]} authorizedUsers - Array of UIDs who have access.
 * @param {string} ownerId - The UID of the budget owner.
 * @param {string} currentUserId - The UID of the currently logged-in user.
 * @returns {Object} - Contains { members, loading }.
 */
export const useTeamMembers = (authorizedUsers = [], ownerId, currentUserId) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If no owner, we can't really build the team list yet
        if (!ownerId) {
            setMembers([]);
            return;
        }

        setLoading(true);

        // 1. Combine owner and authorized users into a unique set to avoid duplicates
        // JSON.stringify dependency check is not needed here as Set handles uniqueness, 
        // but react might re-run if array reference changes.
        const allUids = Array.from(new Set([ownerId, ...(authorizedUsers || [])]));
        
        // 2. Store unsubscribers for cleanup
        const unsubscribes = [];
        
        // 3. Local map to hold latest data for each user to prevent flickering/race conditions
        // We initialize it empty, updates will fill it.
        const currentDataMap = {};

        // Helper function to rebuild the members array from the map
        const updateMembersState = () => {
            const validMembers = Object.values(currentDataMap).sort((a, b) => {
                // Sorting logic: Owner -> Current User -> Others
                if (a.isOwner) return -1;
                if (b.isOwner) return 1;
                if (a.isCurrentUser) return -1;
                if (b.isCurrentUser) return 1;
                return 0;
            });
            setMembers(validMembers);
            setLoading(false);
        };

        // 4. Create a listener for EACH user in the list
        allUids.forEach(uid => {
            try {
                // Path consistent with useAuth.js: artifacts/{appId}/users/{uid}/metadata/profile
                const userRef = doc(db, 'artifacts', appId, 'users', uid, 'metadata', 'profile');
                
                const unsub = onSnapshot(userRef, (snapshot) => {
                    const data = snapshot.exists() ? snapshot.data() : {};
                    
                    // Update the local map with the new real-time data
                    currentDataMap[uid] = {
                        uid,
                        displayName: data.displayName || 'Unknown User',
                        email: data.email || '',
                        photoURL: data.photoURL || null,
                        isOwner: uid === ownerId,
                        isCurrentUser: uid === currentUserId,
                        originalItem: uid // Keep reference for removal logic
                    };

                    // Trigger state update immediately on any change
                    updateMembersState();
                }, (error) => {
                    console.error(`Error listening to profile for ${uid}`, error);
                });

                unsubscribes.push(unsub);
            } catch (error) {
                console.error(`Failed to setup listener for ${uid}`, error);
            }
        });

        // 5. Cleanup function to unsubscribe all listeners when component unmounts or list changes
        return () => {
            unsubscribes.forEach(unsub => unsub());
        };

        // We depend on the content of the authorizedUsers array, ownerId, or currentUserId changing
    }, [JSON.stringify(authorizedUsers), ownerId, currentUserId]); 

    return { members, loading };
};