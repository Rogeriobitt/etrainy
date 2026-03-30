import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentSignup from "./pages/StudentSignup";
import PersonalSignup from "./pages/PersonalSignup";
import AdminClasses from "./pages/AdminClasses";
import ClassPlayer from "./pages/ClassPlayer";
import Profile from "./pages/Profile";
import TreinosPreview from "./pages/TreinosPreview";
import StudentDashboard from "./pages/StudentDashboard";
import PersonalDashboard from "./pages/PersonalDashboard";
import WorkoutAssistant from "./pages/WorkoutAssistant";
import MyWorkout from "./pages/MyWorkout";
import PersonalStudents from "./pages/PersonalStudents";
import PersonalStudentDetail from "./pages/PersonalStudentDetail";
import PersonalPending from "./pages/PersonalPending";
import PersonalAssistant from "./pages/PersonalAssistant";
import WorkoutAdapt from "./pages/WorkoutAdapt";
import StudentInviteSignup from "./pages/StudentInviteSignup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cadastro/aluno" element={<StudentSignup />} />
            <Route path="/cadastro/personal" element={<PersonalSignup />} />
            <Route path="/admin/classes" element={<AdminClasses />} />
            <Route path="/class/:id" element={<ClassPlayer />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/treinos-preview" element={<TreinosPreview />} />
            <Route path="/dashboard/aluno" element={<StudentDashboard />} />
            <Route path="/dashboard/personal" element={<PersonalDashboard />} />
            <Route path="/treinos/minha-serie" element={<MyWorkout />} />
            <Route path="/assistente/treino" element={<WorkoutAssistant />} />
            <Route path="/assistente/treino/personal" element={<PersonalAssistant />} />
            <Route path="/personal/alunos" element={<PersonalStudents />} />
            <Route path="/personal/alunos/:studentId" element={<PersonalStudentDetail />} />
            <Route path="/personal/pendencias" element={<PersonalPending />} />
            <Route path="/treinos/adaptar" element={<WorkoutAdapt />} />
            <Route path="/convite/:token" element={<StudentInviteSignup />} />
            <Route path="/treinos/historico" element={<NotFound />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
