import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Dumbbell, Home, BarChart3, ArrowRight, Loader2, ClipboardList } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useEffect } from "react";
import { useQuery as useRQQuery } from "@tanstack/react-query";

const ActivePlanCheck = ({ hasPersonal }: { hasPersonal: boolean }) => {
  const { user } = useAuth();
  const { data: plan, isLoading } = useRQQuery({
    queryKey: ["active-plan-check", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_plans")
        .select("id, status")
        .eq("user_id", user!.id)
        .in("status", ["ativa", "aguardando_revisao_personal"])
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (isLoading || plan) return null;

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-6 mb-8 text-center">
      <ClipboardList className="w-10 h-10 text-primary mx-auto mb-3" />
      <h2 className="font-heading text-lg tracking-wide mb-1">
        {hasPersonal ? "Aguarde seu personal preparar sua série" : "Você ainda não tem um Personal vinculado"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {hasPersonal
          ? "Seu Personal Trainer está montando seu treino. Assim que estiver pronto, ele aparecerá aqui."
          : "Para receber sua série de treinos, peça o link de convite ao seu Personal Trainer e cadastre-se por ele."}
      </p>
    </div>
  );
};

const cards = [
  {
    title: "Minha Série de Musculação",
    text: "Veja seus treinos A, B, C… aprovados pelo seu personal e marque o que já foi concluído.",
    button: "Ver Série",
    path: "/treinos/minha-serie",
    icon: Dumbbell,
  },
  {
    title: "Treinar sem Academia",
    text: "Vai viajar ou treinar em casa? Adapte sua série atual para peso do corpo ou pesos livres.",
    button: "Adaptar Treino",
    path: "/treinos/adaptar",
    icon: Home,
  },
  {
    title: "Histórico e Evolução",
    text: "Veja quantos treinos concluiu e acompanhe sua evolução ao longo do tempo.",
    button: "Ver Histórico",
    path: "/treinos/historico",
    icon: BarChart3,
  },
];

const StudentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, personal_trainer_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";
  const hasPersonal = !!profile?.personal_trainer_id;

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
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl md:text-4xl font-heading tracking-wider">
            Olá, <span className="text-gradient">{firstName}</span>
          </h1>
          <NotificationBell />
        </div>
        <p className="text-muted-foreground mb-10 max-w-xl">
          Aqui você acompanha sua série de treinos preparada pelo seu Personal Trainer.
        </p>

        {/* Empty state when no active plan */}
        <ActivePlanCheck hasPersonal={hasPersonal} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.path}
                className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-heading tracking-wide">{card.title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">{card.text}</p>
                </div>
                <button
                  onClick={() => navigate(card.path)}
                  className="gradient-accent px-5 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity self-start"
                >
                  {card.button} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
