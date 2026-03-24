import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Loader2, ClipboardCheck, Calendar } from "lucide-react";
import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PersonalPending = () => {
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

  const { data: pending, isLoading } = useQuery({
    queryKey: ["pending-series", personal?.id],
    queryFn: async () => {
      const { data: plans, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("personal_trainer_id", personal!.id)
        .eq("status", "aguardando_revisao_personal")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      if (!plans || plans.length === 0) return [];

      const userIds = plans.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      profiles?.forEach((p) => { profileMap[p.user_id] = p; });

      return plans.map((p) => ({
        ...p,
        studentName: profileMap[p.user_id]?.full_name || "Aluno",
      }));
    },
    enabled: !!personal?.id,
  });

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
          Séries <span className="text-gradient">Pendentes</span>
        </h1>

        {!pending || pending.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma série pendente de revisão no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{p.studentName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(p.updated_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Gerada pela IA</p>
                </div>
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  Pendente
                </span>
                <button
                  onClick={() => navigate(`/personal/alunos/${p.user_id}`)}
                  className="gradient-accent px-4 py-2 rounded-lg font-semibold text-primary-foreground text-xs hover:opacity-90 transition-opacity"
                >
                  Revisar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalPending;
