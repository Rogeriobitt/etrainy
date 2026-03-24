import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Users, Sparkles, ClipboardCheck, Loader2, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";

const PersonalDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  const { data: personal, isLoading: personalLoading } = useQuery({
    queryKey: ["personal-trainer", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_trainers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: studentCount } = useQuery({
    queryKey: ["student-count", personal?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("personal_trainer_id", personal!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!personal?.id,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-count", personal?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("workout_plans")
        .select("id", { count: "exact", head: true })
        .eq("personal_trainer_id", personal!.id)
        .eq("status", "aguardando_revisao_personal");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!personal?.id,
  });

  const handleCopy = () => {
    if (personal?.personal_code) {
      navigator.clipboard.writeText(personal.personal_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || personalLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = personal?.full_name?.split(" ")[0] || "Personal";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <h1 className="text-3xl md:text-4xl font-heading tracking-wider mb-1">
          Olá, <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="text-muted-foreground mb-4">
          Gerencie seus alunos, crie séries com a assistente de IA e revise os treinos pendentes.
        </p>

        {personal?.personal_code && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 bg-secondary border border-border rounded-lg px-4 py-2 text-sm mb-10 hover:border-primary/40 transition-colors"
          >
            <span className="text-muted-foreground">Seu código:</span>
            <span className="font-semibold text-primary">{personal.personal_code}</span>
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 - Meus Alunos */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              {typeof studentCount === "number" && (
                <span className="gradient-accent text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                  {studentCount}
                </span>
              )}
            </div>
            <h2 className="text-lg font-heading tracking-wide mb-2">Meus Alunos</h2>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              Veja todos os alunos vinculados ao seu código e acesse o perfil de cada um.
            </p>
            <button
              onClick={() => navigate("/personal/alunos")}
              className="gradient-accent px-5 py-2 rounded-lg font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity w-full"
            >
              Ver Alunos
            </button>
          </div>

          {/* Card 2 - Criar Série com IA */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-heading tracking-wide mb-2">Criar Série com IA</h2>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              Escolha um aluno e deixe a assistente sugerir uma série completa para você revisar e aprovar.
            </p>
            <button
              onClick={() => navigate("/assistente/treino/personal")}
              className="gradient-accent px-5 py-2 rounded-lg font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity w-full"
            >
              Criar Série
            </button>
          </div>

          {/* Card 3 - Séries Pendentes */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              {typeof pendingCount === "number" && pendingCount > 0 && (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
            <h2 className="text-lg font-heading tracking-wide mb-2">Séries Pendentes</h2>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              Revise e aprove as séries criadas pela assistente de IA ou solicitadas pelos seus alunos.
            </p>
            <button
              onClick={() => navigate("/personal/pendencias")}
              className="gradient-accent px-5 py-2 rounded-lg font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity w-full"
            >
              Ver Pendências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;
