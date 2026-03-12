import { useState, createContext, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(userRef);

                    let isAdmin = false;
                    if (docSnap.exists() && docSnap.data().isAdmin !== undefined) {
                        isAdmin = docSnap.data().isAdmin;
                    }

                    const newUserData = {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                        email: currentUser.email,
                        searchName: currentUser.displayName?.toLowerCase() || '',
                        isAdmin: isAdmin
                    };

                    await setDoc(userRef, newUserData, { merge: true });
                    setUserData(newUserData);
                } catch (err) {
                    console.error("Error saving user data on auth state change:", err);
                }
            } else {
                setUserData(null);
            }
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const currentUser = result.user;

            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userRef);

                let isAdmin = false;
                if (docSnap.exists() && docSnap.data().isAdmin !== undefined) {
                    isAdmin = docSnap.data().isAdmin;
                }

                await setDoc(userRef, {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    email: currentUser.email,
                    searchName: currentUser.displayName?.toLowerCase() || '',
                    isAdmin: isAdmin
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error signing in with Google: ", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error logging out: ", error);
        }
    };

    const value = {
        user,
        userData,
        signInWithGoogle,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
