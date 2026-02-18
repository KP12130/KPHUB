import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from "../firebase";
import axios from 'axios';

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch latest data from Firestore to get custom photoURL
                try {
                    const res = await axios.get(`http://localhost:5000/api/users/${user.uid}`);
                    const firestoreData = res.data;
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

    const value = {
        currentUser,
        loginWithGoogle,
        loginWithGithub,
        logout,
        updateUser // Export this
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
