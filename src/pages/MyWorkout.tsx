import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, Info, RefreshCw, AlertTriangle } from "lucide-react";
import { evolveWorkoutPlan } from "@/lib/workoutEvolution";
import { toast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ativa: { label: "Ativa", color: "text-green-400" },
  aguardando_revisao_personal: { label: "Aguardando revisão do personal", color: "text-yellow-400" },
  rascunho: { label: "Rascunho", color: "text-muted-foreground" },
};

const OBJECTIVES: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  weight_loss: "Emagrecimento",
  strength: "Força",
  conditioning: "Condicionamento / Saúde geral",
};

const MyWorkout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showDivision, setShowDivision] = useState(false);
  const [evolving, setEvolving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  // Fetch latest active plan
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["my-workout-plan", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch workout days with exercises
  const { data: days, isLoading: daysLoading } = useQuery({
    queryKey: ["my-workout-days", plan?.id],
    queryFn: async () => {
      const { data: daysData, error: daysError } = await supabase
        .from("workout_days")
        .select("*")
        .eq("workout_plan_id", plan!.id)
        .order("sort_order");
      if (daysError) throw daysError;

      // Fetch exercises for all days
      const dayIds = daysData.map((d) => d.id);
      const { data: exercises, error: exError } = await supabase
        .from("workout_exercises")
        .select("*")
        .in("workout_day_id", dayIds)
        .order("sort_order");
      if (exError) throw exError;

      return daysData.map((d) => ({
        ...d,
        exercises: exercises.filter((e) => e.workout_day_id === d.id),
      }));
    },
    enabled: !!plan?.id,
  });

  const loading = authLoading || planLoading || daysLoading;
  const statusInfo = plan ? STATUS_LABELS[plan.status] || { label: plan.status, color: "text-muted-foreground" } : null;

  if (loading) {
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
        <button onClick={() => navigate("/dashboard/aluno")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </button>

        <h1 className="text-3xl font-heading tracking-wider mb-2">Minha Série de Musculação</h1>

        {!plan ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center mt-8">
            <p className="text-muted-foreground mb-6">Você ainda não tem uma série criada. Use a Assistente de IA para gerar sua primeira série.</p>
            <button onClick={() => navigate("/assistente/treino")} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Sparkles className="w-4 h-4" /> Usar Assistente de IA
            </button>
          </div>
        ) : (
          <>
            {/* Plan summary */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm items-center">
              <span><span className="text-muted-foreground">Objetivo:</span> {OBJECTIVES[plan.objective] || plan.objective}</span>
              <span><span className="text-muted-foreground">Divisão:</span> {plan.division}</span>
              <span><span className="text-muted-foreground">Dias:</span> {plan.days_per_week}x/semana</span>
              {statusInfo && <span className={`font-medium ${statusInfo.color}`}>● {statusInfo.label}</span>}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button onClick={() => setShowDivision(!showDivision)} className="px-4 py-2 rounded-lg text-sm border border-border bg-secondary hover:border-primary/40 transition-colors flex items-center gap-2">
                <Info className="w-4 h-4" /> {showDivision ? "Fechar resumo" : "Ver resumo da divisão"}
              </button>
              <button
                onClick={async () => {
                  if (!plan || !user) return;
                  setEvolving(true);
                  try {
                    const result = await evolveWorkoutPlan(user.id, plan.id);
                    if (result.success) {
                      toast({ title: "Série evoluída!", description: result.message });
                      queryClient.invalidateQueries({ queryKey: ["my-workout-plan"] });
                      queryClient.invalidateQueries({ queryKey: ["my-workout-days"] });
                      setActiveTab(0);
                      setChecked({});
                    } else {
                      toast({ title: "Atenção", description: result.message, variant: "destructive" });
                    }
                  } catch {
                    toast({ title: "Erro", description: "Não foi possível evoluir a série.", variant: "destructive" });
                  } finally {
                    setEvolving(false);
                  }
                }}
                disabled={evolving}
                className="px-4 py-2 rounded-lg text-sm border border-border bg-secondary hover:border-primary/40 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {evolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {evolving ? "Evoluindo..." : "Pedir atualização da série"}
              </button>

            {/* Division modal/summary */}
            {showDivision && days && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium mb-3">Resumo da divisão:</p>
                <div className="space-y-1">
                  {days.map((d) => (
                    <div key={d.id} className="flex gap-3 text-sm">
                      <span className="font-semibold text-primary min-w-[80px]">{d.name}</span>
                      <span className="text-muted-foreground">{d.muscle_groups}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            {days && days.length > 0 && (
              <>
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                  {days.map((d, i) => (
                    <button key={d.id} onClick={() => setActiveTab(i)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === i ? "gradient-accent text-primary-foreground" : "bg-secondary border border-border text-foreground hover:border-primary/40"}`}>
                      {d.name}
                    </button>
                  ))}
                </div>

                {/* Exercise list */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="font-heading text-lg tracking-wide">{days[activeTab].name}</p>
                      <p className="text-xs text-muted-foreground">{days[activeTab].muscle_groups}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {days[activeTab].exercises.map((ex) => (
                      <div key={ex.id} className="px-4 py-3 flex items-center gap-3">
                        <button
                          onClick={() => setChecked((prev) => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${checked[ex.id] ? "bg-primary border-primary" : "border-border hover:border-primary/50"}`}
                        >
                          {checked[ex.id] && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${checked[ex.id] ? "line-through text-muted-foreground" : ""}`}>{ex.exercise_name}</p>
                          {ex.notes && <p className="text-xs text-muted-foreground mt-0.5">{ex.notes}</p>}
                        </div>
                        <span className="text-sm text-primary font-semibold whitespace-nowrap">{ex.sets} × {ex.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyWorkout;
