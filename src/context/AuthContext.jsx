import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync user state with Firestore
  const syncUserToFirestore = async (firebaseUser, isOnline = true, customName = null) => {
    if (!firebaseUser || !firebaseUser.email) return;
    try {
      const emailKey = firebaseUser.email.toLowerCase();
      const userRef = doc(db, 'users', emailKey);
      const userSnap = await getDoc(userRef);

      const name = customName || firebaseUser.displayName || firebaseUser.email.split('@')[0];

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: emailKey,
          displayName: name,
          online: isOnline,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          online: isOnline,
          lastSeen: serverTimestamp(),
          displayName: name,
        });
      }
    } catch (err) {
      console.warn("Firestore user sync ogohlantirish (offline yoki ruxsat):", err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserToFirestore(currentUser, true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, displayName) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const createdUser = userCredential.user;
      
      const cleanName = displayName.trim() || email.split('@')[0];
      await updateProfile(createdUser, {
        displayName: cleanName,
      });

      await syncUserToFirestore(createdUser, true, cleanName);
      setUser({ ...createdUser, displayName: cleanName });
      return createdUser;
    } catch (err) {
      let message = "Ro'yxatdan o'tishda xatolik yuz berdi.";
      if (err.code === 'auth/email-already-in-use') {
        message = "Bu email manzili bilan allaqachon ro'yxatdan o'tilgan.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Email manzili formati noto'g'ri.";
      } else if (err.code === 'auth/weak-password') {
        message = "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncUserToFirestore(userCredential.user, true);
      return userCredential.user;
    } catch (err) {
      let message = "Tizimga kirishda xatolik yuz berdi.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "Email yoki parol noto'g'ri kiritildi.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Email formati noto'g'ri.";
      } else if (err.code === 'auth/too-many-requests') {
        message = "Ko'p marotaba xato urinishlar qilindi. Birozdan so'ng qayta urinib ko'ring.";
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    if (user) {
      try {
        await syncUserToFirestore(user, false);
      } catch (e) {
        console.warn("Logout sync warning:", e);
      }
    }
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    authError,
    setAuthError,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
