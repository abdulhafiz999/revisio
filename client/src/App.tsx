import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { StudyProvider } from "@/context/StudyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { lazy, Suspense } from "react";

// Lazy-load all pages for code splitting (reduces initial bundle size)
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Practice = lazy(() => import("./pages/Practice"));
const CourseQuestions = lazy(() => import("./pages/CourseQuestions"));
const StudyNotes = lazy(() => import("./pages/StudyNotes"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SharedNoteView = lazy(() => import("./pages/SharedNoteView"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient: cache data for 10 minutes, only refetch on mount
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,        // 10 minutes — data considered fresh
      gcTime: 1000 * 60 * 30,           // 30 minutes — keep unused data in cache
      retry: 1,                          // Only retry once on failure
      refetchOnWindowFocus: false,       // Don't refetch just because user switched tabs
      refetchOnReconnect: true,          // Do refetch after losing connection
    },
  },
});

// Page-level loading spinner (shown while lazy chunks download)
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <StudyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <PWAInstallBanner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/shared/note/:noteId" element={<SharedNoteView />} />

                  {/* Protected routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
                  <Route path="/practice/:courseId" element={<ProtectedRoute><CourseQuestions /></ProtectedRoute>} />
                  <Route path="/notes" element={<ProtectedRoute><StudyNotes /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/recommendations" element={<Navigate to="/analytics" replace />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TooltipProvider>
          </StudyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
