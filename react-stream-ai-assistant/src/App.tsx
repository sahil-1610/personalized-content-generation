import { AuthenticatedApp } from "@/components/authenticated-app";
import { AuthForm } from "@/components/auth/auth-form";
import { LandingPage } from "@/components/landing-page";
import { OnboardingForm } from "@/components/onboarding-form";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { User } from "stream-chat";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import AboutPage from "@/components/about-page";

import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

function AppContent() {
  const { user: authUser, loading, signOut } = useAuth();
  const [streamUser, setStreamUser] = useState<User | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Convert Supabase user to Stream Chat user format
  useEffect(() => {
    console.log("Auth user changed:", authUser);
    if (authUser) {
      const streamChatUser = {
        id: authUser.id,
        name: authUser.full_name || authUser.email,
        email: authUser.email,
        image:
          authUser.avatar_url ||
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${authUser.email}`,
      } as any as User;
      setStreamUser(streamChatUser);

      // Check onboarding status
      (async () => {
        if (!supabaseEnabled) {
          setNeedsOnboarding(false);
          return;
        }
        try {
          const { data } = await supabase
            .from("onboardings")
            .select("id")
            .eq("user_id", authUser.id)
            .single();
          const missing = !data;
          setNeedsOnboarding(missing);

          // Only redirect to onboarding if user is not already there
          if (missing && location.pathname !== "/onboarding") {
            navigate("/onboarding");
          }
        } catch (err) {
          console.warn("Onboarding check failed", err);
          setNeedsOnboarding(false);
        }
      })();
    } else {
      setStreamUser(null);
      setNeedsOnboarding(null);
    }
  }, [authUser, location.pathname, navigate]);

  const handleLogout = async () => {
    await signOut();
    setStreamUser(null);
    setNeedsOnboarding(null);
    navigate("/");
  };

  // Show loading screen while checking authentication
  if (loading || (authUser && !streamUser)) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Authentication guard component
  const ProtectedRoute = ({
    children,
  }: {
    children: React.ReactNode | (() => React.ReactNode);
  }) => {
    if (!authUser || !streamUser) {
      return <Navigate to="/" replace />;
    }
    return <>{typeof children === "function" ? children() : children}</>;
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="h-screen bg-background">
        <Routes>
          {/* Landing/Auth Route */}
          <Route
            path="/"
            element={
              loading ? (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                  </div>
                </div>
              ) : authUser && streamUser ? (
                needsOnboarding === true ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <Navigate to="/chat" replace />
                )
              ) : (
                <LandingPage />
              )
            }
          />

          {/* Main Chat Route - Protected */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <AuthenticatedApp user={streamUser!} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Specific Channel Chat Route - Protected */}
          <Route
            path="/chat/:channelId"
            element={
              <ProtectedRoute>
                <AuthenticatedApp user={streamUser!} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Onboarding Route - Protected */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                {() => (
                  <OnboardingForm
                    user={{
                      id: authUser!.id,
                      email: authUser!.email,
                      full_name: authUser!.full_name,
                      avatar_url: authUser!.avatar_url,
                    }}
                    onComplete={() => {
                      setNeedsOnboarding(false);
                      navigate("/chat");
                    }}
                  />
                )}
              </ProtectedRoute>
            }
          />

          {/* About Page Route */}
          <Route path="/about" element={<AboutPage />} />
        </Routes>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
