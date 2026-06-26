import { createContext, useContext, useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db, isDemoMode } from '../config/firebase'

const AuthContext = createContext(null)

// Demo user for testing without Firebase
const DEMO_USER = {
  uid: 'demo-user-001',
  displayName: 'Krishna Sharma',
  email: 'krishna@demo.com',
  photoURL: null,
}

const DEMO_PROFILE = {
  displayName: 'Krishna Sharma',
  email: 'krishna@demo.com',
  photoURL: null,
  level: 1,
  xp: 0,
  streakDays: 0,
  tasksCompleted: 0,
  createdAt: new Date(),
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, auto-login with demo user
      console.log('🧪 Running in DEMO MODE (no Firebase config detected)')
      setUser(DEMO_USER)
      setUserProfile({ ...DEMO_PROFILE })
      setLoading(false)
      return
    }

    // Real Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Fetch or create user profile in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          setUserProfile(snap.data())
        } else {
          const newProfile = {
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            level: 1,
            xp: 0,
            streakDays: 0,
            tasksCompleted: 0,
            createdAt: serverTimestamp(),
          }
          await setDoc(userRef, newProfile)
          setUserProfile(newProfile)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    if (isDemoMode) {
      setUser(DEMO_USER)
      setUserProfile({ ...DEMO_PROFILE })
      return
    }
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }

  const logout = async () => {
    if (isDemoMode) {
      setUser(null)
      setUserProfile(null)
      return
    }
    await signOut(auth)
  }

  const updateProfile = async (updates) => {
    if (isDemoMode) {
      setUserProfile(prev => ({ ...prev, ...updates }))
      return
    }
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    await setDoc(userRef, updates, { merge: true })
    setUserProfile(prev => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading,
      loginWithGoogle, logout, updateProfile,
      isDemoMode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
