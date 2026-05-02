import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/components/client';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  plan?: string;
  [key: string]: any;
}

export const ADMIN_EMAILS = ['bankoleebenezer111@gmail.com', 'omakaoe@gmail.com'];

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAdmin: false,
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
            // Show error so we know if it's a permission issue
            import('sonner').then(({ toast }) => toast.error("Error fetching profile: " + error.message));
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

  const signOutUser = async () => {
    await signOut(auth);
  };

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  const value = { user, userProfile, isAdmin, loading, signOut: signOutUser };


  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};