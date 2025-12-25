import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, AuthResponse } from "../utils/authAPI";

interface User {
  id: string;
  email: string;
  email_confirmed: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SESSION: "@vkutk_session",
  USER: "@vkutk_user",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const [storedSession, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SESSION),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (storedSession && storedUser) {
        const parsedSession: Session = JSON.parse(storedSession);
        const parsedUser: User = JSON.parse(storedUser);

        // Check if session is expired
        const now = Math.floor(Date.now() / 1000);
        if (parsedSession.expires_at > now) {
          setSession(parsedSession);
          setUser(parsedUser);
        } else {
          // Session expired, clear storage
          await clearStorage();
        }
      }
    } catch (error) {
      console.error("Error loading stored session:", error);
      await clearStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async (authData: AuthResponse) => {
    if (authData.session && authData.user) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify(authData.session)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(authData.user)
      );
      setSession(authData.session);
      setUser(authData.user);
    }
  };

  const clearStorage = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.SESSION, STORAGE_KEYS.USER]);
    setSession(null);
    setUser(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.signIn(email, password);

      if (!response.success) {
        throw new Error(response.message || "Đăng nhập thất bại");
      }

      await saveSession(response);
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const response = await authAPI.signUp(email, password, metadata);

      if (!response.success) {
        throw new Error(response.message || "Đăng ký thất bại");
      }

      // If signup returns a session, save it (auto login)
      if (response.session) {
        await saveSession(response);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (session?.access_token) {
        await authAPI.signOut(session.access_token);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      await clearStorage();
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user && !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
