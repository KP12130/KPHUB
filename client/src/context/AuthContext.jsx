import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from "../firebase";
import axios from 'axios';
import { API_BASE } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
    const loginWithGithub = () => signInWithPopup(auth, githubProvider);
    const logout = () => signOut(auth);

    // Function to manually update local state after profile changes
    const updateUser = (data) => {
        setCurrentUser(prev => ({ ...prev, ...data }));
    };

    const refreshDebounceRef = React.useRef(null);

    const refreshUser = async (uid) => {
        // Debounce: prevent multiple concurrent refreshes for the same user
        if (refreshDebounceRef.current) return;
        refreshDebounceRef.current = uid;
        try {
            const res = await axios.get(`${API_BASE}/api/users/${uid}`);
            setCurrentUser(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            console.error('refreshUser failed', err);
        } finally {
            setTimeout(() => { refreshDebounceRef.current = null; }, 3000); // 3s cooldown
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch latest data from Firestore to get custom photoURL
                try {
                    const res = await axios.get(`${API_BASE}/api/users/${user.uid}`);
                    const firestoreData = res.data;

                    // Sanitize avatar URL if it's pointing to localhost in production
                    if (firestoreData.photoURL && firestoreData.photoURL.includes('localhost:5000') && !import.meta.env.DEV) {
                        const path = firestoreData.photoURL.split('localhost:5000')[1];
                        firestoreData.photoURL = `${API_BASE}${path}`;
                    }

                    // Merge Firebase Auth user with Firestore data
                    setCurrentUser({ ...user, ...firestoreData });
                } catch (err) {
                    console.error("Failed to sync with Firestore:", err);
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // 2. AUTO-SYNC RESTRICTIONS
    // Automatically refresh user data when a mute/restriction expires
    useEffect(() => {
        if (!currentUser?.restrictions?.mutedUntil) return;

        const expiry = new Date(currentUser.restrictions.mutedUntil).getTime();
        const now = Date.now();
        const delay = expiry - now;

        if (delay > 0) {
            console.log(`[SYNC] Mute expires in ${Math.ceil(delay / 60000)}m. Scheduling auto-refresh.`);
            const timer = setTimeout(() => {
                console.log('[SYNC] Mute period elapsed. Revoking restrictions...');
                refreshUser(currentUser.uid);
                // Also trigger a small reload or state update if needed, 
                // but refreshUser should update currentUser and fix the UI.
            }, delay + 1000); // Add 1s buffer

            return () => clearTimeout(timer);
        } else if (currentUser.restrictions.muted) {
            // If expiry is in the past but we still have 'muted' flag locally, sync once
            refreshUser(currentUser.uid);
        }
    }, [currentUser?.restrictions?.mutedUntil, currentUser?.restrictions?.muted]);

    const value = {
        currentUser,
        loginWithGoogle,
        loginWithGithub,
        logout,
        updateUser,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
