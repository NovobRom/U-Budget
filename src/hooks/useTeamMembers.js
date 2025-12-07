import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';

/**
 * Hook to fetch and hydrate team member profiles from Firestore based on UIDs.
 * * @param {string[]} authorizedUsers - Array of UIDs who have access.
 * @param {string} ownerId - The UID of the budget owner.
 * @param {string} currentUserId - The UID of the currently logged-in user.
 * @returns {Object} - Contains { members, loading }.
 */
export const useTeamMembers = (authorizedUsers = [], ownerId, currentUserId) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchMembers = async () => {
            // Avoid fetching if there is no owner (data not loaded yet, or resetting)
            if (!ownerId) {
                if (isMounted) setMembers([]); // Clear stale members
                return;
            }

            setLoading(true);
            try {
                // Combine owner and authorized users into a unique set to avoid duplicates
                const allUids = new Set([ownerId, ...(authorizedUsers || [])]);
                const uniqueUids = Array.from(allUids);

                const promises = uniqueUids.map(async (uid) => {
                    try {
                        // Path consistent with useAuth.js: artifacts/{appId}/users/{uid}/metadata/profile
                        const userRef = doc(db, 'artifacts', appId, 'users', uid, 'metadata', 'profile');
                        const snapshot = await getDoc(userRef);

                        if (snapshot.exists()) {
                            const data = snapshot.data();
                            return {
                                uid,
                                displayName: data.displayName || 'Unknown User',
                                email: data.email || '',
                                photoURL: data.photoURL || null,
                                isOwner: uid === ownerId,
                                isCurrentUser: uid === currentUserId,
                                originalItem: uid // Keep reference for removal logic
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error(`Failed to fetch profile for ${uid}`, error);
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                
                // Filter out failed fetches and sort: Owner first, then Current User, then others
                const validMembers = results.filter(m => m !== null).sort((a, b) => {
                    if (a.isOwner) return -1;
                    if (b.isOwner) return 1;
                    if (a.isCurrentUser) return -1;
                    if (b.isCurrentUser) return 1;
                    return 0;
                });

                if (isMounted) {
                    setMembers(validMembers);
                }
            } catch (error) {
                console.error("Error fetching team members:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMembers();

        return () => {
            isMounted = false;
        };
    }, [authorizedUsers, ownerId, currentUserId]);

    return { members, loading };
};