import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Loader2, User, Dumbbell } from "lucide-react";
import { useEffect } from "react";

const OBJECTIVES: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  weight_loss: "Emagrecimento",
  strength: "Força",
  conditioning: "Condicionamento",
};

const LEVELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const PersonalStudents = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: personal } = useQuery({
    queryKey: ["personal-trainer", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("personal_trainers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["personal-students", personal?.id],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("personal_trainer_id", personal!.id);
      if (error) throw error;

      // Get latest workout plan status for each student
      const userIds = profiles.map((p) => p.user_id);
      const { data: plans } = await supabase
        .from("workout_plans")
        .select("user_id, status, created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      const latestPlan: Record<string, string> = {};
      plans?.forEach((p) => {
        if (!latestPlan[p.user_id]) latestPlan[p.user_id] = p.status;
      });

      return profiles.map((p) => ({
        ...p,
        planStatus: latestPlan[p.user_id] || null,
      }));
    },
    enabled: !!personal?.id,
  });

  const getStatusBadge = (status: string | null) => {
    if (!status) return { label: "Sem série", cls: "bg-secondary text-muted-foreground" };
    if (status === "aguardando_revisao_personal") return { label: "Aguardando revisão", cls: "bg-yellow-500/20 text-yellow-400" };
    if (status === "ativa") return { label: "Aprovada", cls: "bg-green-500/20 text-green-400" };
    return { label: status, cls: "bg-secondary text-muted-foreground" };
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-3xl">
        <button onClick={() => navigate("/dashboard/personal")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </button>

        <h1 className="text-3xl font-heading tracking-wider mb-6">
          Meus <span className="text-gradient">Alunos</span>
        </h1>

        {!students || students.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-heading text-lg tracking-wide mb-1">Nenhum aluno vinculado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Compartilhe seu código de personal com seus alunos para que eles se vinculem a você no momento do cadastro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((s) => {
              const badge = getStatusBadge(s.planStatus);
              return (
                <div key={s.id} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.full_name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.full_name || "Aluno"}</p>
                    {s.email && (
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      {s.goal && <span>{OBJECTIVES[s.goal] || s.goal}</span>}
                      {s.experience_level && <span>{LEVELS[s.experience_level] || s.experience_level}</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => navigate(`/personal/alunos/${s.user_id}`)}
                    className="gradient-accent px-4 py-2 rounded-lg font-semibold text-primary-foreground text-xs hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Dumbbell className="w-3.5 h-3.5" /> Ver Perfil e Série
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalStudents;
