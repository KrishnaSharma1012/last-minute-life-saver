import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../config/firebase'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Fetch or create user profile in Firestore
        try {
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            setUserProfile(userSnap.data())
          } else {
            // First time sign in — create profile
            const newProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              xp: 0,
              level: 1,
              streakDays: 0,
              tasksCompleted: 0,
              badges: [],
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
            }
            await setDoc(userRef, newProfile)
            setUserProfile(newProfile)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Fallback profile for demo mode
          setUserProfile({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            xp: 0,
            level: 1,
            streakDays: 0,
            tasksCompleted: 0,
            badges: [],
          })
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      throw error
    }
  }

  // Sign Out
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign Out Error:', error)
      throw error
    }
  }

  // Update user profile (for gamification, etc.)
  const updateProfile = async (updates) => {
    if (!user) return
    try {
      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, { ...updates, lastActive: serverTimestamp() }, { merge: true })
      setUserProfile(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
