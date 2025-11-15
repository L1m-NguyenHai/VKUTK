import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
  token_type?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://127.0.0.1:8000";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = localStorage.getItem("vku_session");
        if (storedSession) {
          const parsedSession: Session = JSON.parse(storedSession);

          // Check if token is expired
          if (
            parsedSession.expires_at &&
            parsedSession.expires_at < Date.now() / 1000
          ) {
            // Try to refresh
            await refreshSessionInternal(parsedSession.refresh_token);
          } else {
            // Get user info
            const response = await fetch(
              `${API_BASE_URL}/api/auth/user?access_token=${parsedSession.access_token}`
            );
            if (response.ok) {
              const data = await response.json();
              setUser(data.user);
              setSession(parsedSession);
            } else {
              // Session invalid, clear it
              localStorage.removeItem("vku_session");
            }
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        localStorage.removeItem("vku_session");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const refreshSessionInternal = async (refreshToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setUser(data.user);
        localStorage.setItem("vku_session", JSON.stringify(data.session));
      } else {
        throw new Error("Failed to refresh session");
      }
    } catch (error) {
      console.error("Refresh session error:", error);
      localStorage.removeItem("vku_session");
      setSession(null);
      setUser(null);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Sign in failed");
      }

      const data = await response.json();
      setUser(data.user);
      setSession(data.session);
      localStorage.setItem("vku_session", JSON.stringify(data.session));
    } catch (error) {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, metadata }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Sign up failed");
      }

      const data = await response.json();

      // If session is returned (auto sign in after signup)
      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        localStorage.setItem("vku_session", JSON.stringify(data.session));
      }
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (session?.access_token) {
        await fetch(
          `${API_BASE_URL}/api/auth/signout?access_token=${session.access_token}`,
          {
            method: "POST",
          }
        );
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setSession(null);
      localStorage.removeItem("vku_session");
    }
  };

  const refreshSession = async () => {
    if (!session?.refresh_token) {
      throw new Error("No refresh token available");
    }
    await refreshSessionInternal(session.refresh_token);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
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
