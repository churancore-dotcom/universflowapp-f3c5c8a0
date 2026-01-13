import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import SplashScreen from "./components/SplashScreen";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) setShowSplash(false);
  }, [isLoading, user]);

  return (
    <AnimatePresence mode="wait">
      {showSplash && !user ? (
        <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
      ) : (
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/auth" replace />} />
          <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <Auth />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PlayerProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </PlayerProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
