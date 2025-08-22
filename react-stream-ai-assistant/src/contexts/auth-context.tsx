import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, supabaseEnabled, AuthUser } from "@/lib/supabase";

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithProvider: (provider: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithProvider: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🚀 === AuthProvider INIT === 🚀");
    console.log("🔧 supabaseEnabled:", supabaseEnabled);
    console.log("🏗️ supabase client exists:", !!supabase);
    console.log("📝 Environment check:", {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY_length: import.meta.env.VITE_SUPABASE_ANON_KEY
        ?.length,
    });

    if (!supabaseEnabled) {
      console.error("❌ Supabase not enabled - setting auth to null");
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    // Get initial session with timeout and error handling
    console.log("🔍 Starting session retrieval...");
    const getSessionWithTimeout = async () => {
      try {
        console.log("📋 Calling supabase.auth.getSession()...");

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("Session retrieval timeout after 10 seconds")),
            10000
          )
        );

        // Race the session call against the timeout
        const result = (await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise,
        ])) as { data: { session: Session | null }; error: any };

        console.log("📊 Session result:", {
          hasData: !!result.data,
          hasSession: !!result.data?.session,
          hasUser: !!result.data?.session?.user,
          userId: result.data?.session?.user?.id,
          userEmail: result.data?.session?.user?.email,
          error: result.error,
        });

        const {
          data: { session },
          error,
        } = result;

        if (error) {
          console.error("❌ Session retrieval error:", error);
          throw error;
        }

        console.log("✅ Session retrieved successfully");
        setSession(session);

        if (session?.user) {
          console.log("👤 Processing authenticated user:", {
            id: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata,
          });

          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || "",
            avatar_url:
              session.user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/9.x/avataaars/svg?seed=${session.user.email}`,
          });
        } else {
          console.log("❌ No session user found");
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Session retrieval failed:", error);
        setSession(null);
        setUser(null);
      } finally {
        console.log("🏁 Setting loading to false");
        setLoading(false);
      }
    };

    getSessionWithTimeout();

    // Listen for auth changes
    console.log("👂 Setting up auth state change listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state change:", {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      });

      setSession(session);

      if (session?.user) {
        console.log("👤 Auth state change - setting user:", {
          id: session.user.id,
          email: session.user.email,
        });

        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || "",
          avatar_url:
            session.user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/9.x/avataaars/svg?seed=${session.user.email}`,
        });
      } else {
        console.log("❌ Auth state change - clearing user");
        setUser(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log("signUp called with:", { email, fullName, supabaseEnabled });
    if (!supabaseEnabled)
      return {
        error:
          "Authentication is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
      };

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || "",
            avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`,
          },
        },
      });

      console.log("Supabase signUp result:", { error });
      return { error: error?.message || null };
    } catch (err) {
      console.error("SignUp error:", err);
      return { error: "An unexpected error occurred during sign up." };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("signIn called with:", { email, supabaseEnabled });
    if (!supabaseEnabled)
      return {
        error:
          "Authentication is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
      };

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Supabase signIn result:", { error });
      return { error: error?.message || null };
    } catch (err) {
      console.error("SignIn error:", err);
      return { error: "An unexpected error occurred during sign in." };
    }
  };

  const signOut = async () => {
    if (!supabaseEnabled) return;
    await supabase.auth.signOut();
  };

  const signInWithProvider = async (provider: string) => {
    if (!supabaseEnabled) return { error: "Authentication is not configured." };

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin + "/chat",
        },
      });

      return { error: error?.message || null };
    } catch (err) {
      console.error("OAuth signIn error:", err);
      return { error: "An unexpected error occurred during OAuth sign in." };
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabaseEnabled)
      return {
        error:
          "Authentication is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
      };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error: error?.message || null };
    } catch (err) {
      console.error("Reset password error:", err);
      return { error: "An unexpected error occurred during password reset." };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
