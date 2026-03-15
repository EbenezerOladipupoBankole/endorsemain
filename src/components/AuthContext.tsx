import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/components/client';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  plan?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile({ plan: 'free' });
          }
        } catch (error: any) {
          if (error.code !== 'unavailable') {
            console.error("Error fetching user profile:", error);
          }
          setUserProfile({ plan: 'free' });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile?.branding) {
      const { primaryColor } = userProfile.branding;
      if (primaryColor) {
        // Convert hex to HSL for Tailwind variables if possible, 
        // or just set a --primary-custom variable.
        // For simplicity, we'll just set it directly as a hex if we use it in inline styles,
        // but it's better to update the CSS variable.
        document.documentElement.style.setProperty('--primary', primaryColor);
        // Also update ring and others if needed
        document.documentElement.style.setProperty('--ring', primaryColor);
      }
    } else {
      // Reset to default if no branding
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--ring');
    }
  }, [userProfile?.branding]);

  const signOutUser = async () => {
    await signOut(auth);
  };

  const value = { user, userProfile, loading, signOut: signOutUser };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};