import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { StudyProvider } from "@/context/StudyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Practice from "./pages/Practice";
import CourseQuestions from "./pages/CourseQuestions";
import StudyNotes from "./pages/StudyNotes";
import Recommendations from "./pages/Recommendations";
import SharedNoteView from "./pages/SharedNoteView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <StudyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
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
              <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </StudyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
