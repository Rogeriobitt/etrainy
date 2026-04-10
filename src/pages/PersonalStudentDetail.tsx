import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Loader2, Save, CheckCircle2, Plus, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { notifyAlunoSerieAprovada, notifyAlunoSerieEditada } from "@/lib/notifications";
import { ExerciseEditor, type EditableExercise } from "@/components/ExerciseEditor";

const OBJECTIVES: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  weight_loss: "Emagrecimento",
  strength: "Força",
  conditioning: "Condicionamento / Saúde geral",
};
const LEVELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};
const LOCATIONS: Record<string, string> = {
  gym: "Academia",
  home_weights: "Em casa com pesos livres",
  home_bodyweight: "Em casa sem equipamentos",
};

interface EditableExercise {
  id: string;
  exercise_name: string;
  sets: string;
  reps: string;
  notes: string;
  sort_order: number;
  isNew?: boolean;
  deleted?: boolean;
}

const PersonalStudentDetail = () => {
  const { user, loading: authLoading } = useAuth();
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [editedExercises, setEditedExercises] = useState<Record<string, EditableExercise[]>>({});
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", studentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["student-plan", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", studentId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: days, isLoading: daysLoading } = useQuery({
    queryKey: ["student-days", plan?.id],
    queryFn: async () => {
      const { data: daysData, error } = await supabase
        .from("workout_days")
        .select("*")
        .eq("workout_plan_id", plan!.id)
        .order("sort_order");
      if (error) throw error;

      const dayIds = daysData.map((d) => d.id);
      const { data: exercises } = await supabase
        .from("workout_exercises")
        .select("*")
        .in("workout_day_id", dayIds)
        .order("sort_order");

      return daysData.map((d) => ({
        ...d,
        exercises: (exercises || []).filter((e) => e.workout_day_id === d.id),
      }));
    },
    enabled: !!plan?.id,
  });

  // Initialize editable exercises when days load
  useEffect(() => {
    if (days && Object.keys(editedExercises).length === 0) {
      const initial: Record<string, EditableExercise[]> = {};
      days.forEach((d) => {
        initial[d.id] = d.exercises.map((e) => ({
          id: e.id,
          exercise_name: e.exercise_name,
          sets: e.sets,
          reps: e.reps,
          notes: e.notes || "",
          sort_order: e.sort_order,
        }));
      });
      setEditedExercises(initial);
    }
  }, [days]);

  const updateExercise = (dayId: string, index: number, field: string, value: string) => {
    setEditedExercises((prev) => {
      const copy = { ...prev };
      copy[dayId] = [...(copy[dayId] || [])];
      copy[dayId][index] = { ...copy[dayId][index], [field]: value };
      return copy;
    });
  };

  const removeExercise = (dayId: string, index: number) => {
    setEditedExercises((prev) => {
      const copy = { ...prev };
      const list = [...(copy[dayId] || [])];
      if (list[index].isNew) {
        list.splice(index, 1);
      } else {
        list[index] = { ...list[index], deleted: true };
      }
      copy[dayId] = list;
      return copy;
    });
  };

  const addExercise = (dayId: string) => {
    setEditedExercises((prev) => {
      const copy = { ...prev };
      const list = [...(copy[dayId] || [])];
      list.push({
        id: crypto.randomUUID(),
        exercise_name: "",
        sets: "3",
        reps: "10-12",
        notes: "",
        sort_order: list.length,
        isNew: true,
      });
      copy[dayId] = list;
      return copy;
    });
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      for (const dayId of Object.keys(editedExercises)) {
        const exercises = editedExercises[dayId];
        for (const ex of exercises) {
          if (ex.deleted && !ex.isNew) {
            await supabase.from("workout_exercises").delete().eq("id", ex.id);
          } else if (ex.isNew && !ex.deleted && ex.exercise_name.trim()) {
            await supabase.from("workout_exercises").insert({
              workout_day_id: dayId,
              exercise_name: ex.exercise_name,
              sets: ex.sets,
              reps: ex.reps,
              notes: ex.notes || null,
              sort_order: ex.sort_order,
            });
          } else if (!ex.isNew && !ex.deleted) {
            await supabase.from("workout_exercises").update({
              exercise_name: ex.exercise_name,
              sets: ex.sets,
              reps: ex.reps,
              notes: ex.notes || null,
            }).eq("id", ex.id);
          }
        }
      }
      toast({ title: "Alterações salvas com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["student-days"] });
      setEditedExercises({});

      // Notify student
      if (studentId) {
        const { data: pt } = await supabase
          .from("personal_trainers")
          .select("full_name")
          .eq("user_id", user!.id)
          .maybeSingle();
        await notifyAlunoSerieEditada(studentId, pt?.full_name || "Personal");
      }
    } catch {
      toast({ title: "Algo deu errado", description: "Não foi possível salvar as alterações. Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!plan) return;
    setApproving(true);
    try {
      await handleSave();
      await supabase.from("workout_plans").update({ status: "ativa" }).eq("id", plan.id);
      toast({ title: "Série aprovada e enviada para o aluno!" });
      queryClient.invalidateQueries({ queryKey: ["student-plan"] });

      // Notify student
      if (studentId) {
        const { data: pt } = await supabase
          .from("personal_trainers")
          .select("full_name")
          .eq("user_id", user!.id)
          .maybeSingle();
        await notifyAlunoSerieAprovada(studentId, pt?.full_name || "Personal");
      }
    } catch {
      toast({ title: "Algo deu errado", description: "Não foi possível aprovar a série. Tente novamente.", variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  const loading = authLoading || studentLoading || planLoading || daysLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentDayId = days?.[activeTab]?.id;
  const currentExercises = currentDayId ? (editedExercises[currentDayId] || []).filter((e) => !e.deleted) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-3xl">
        <button onClick={() => navigate("/personal/alunos")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar para Alunos
        </button>

        {/* Student info */}
        {student && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
              {student.avatar_url ? (
                <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <p className="col-span-2 font-heading text-xl tracking-wide mb-2">Dados do aluno — {student.full_name || "Aluno"}</p>
              <span><span className="text-muted-foreground">Objetivo:</span> {OBJECTIVES[student.goal || ""] || student.goal || "—"}</span>
              <span><span className="text-muted-foreground">Nível:</span> {LEVELS[student.experience_level || ""] || "—"}</span>
              <span><span className="text-muted-foreground">Dias/semana:</span> {student.training_days || "—"}x</span>
              <span><span className="text-muted-foreground">Local:</span> {LOCATIONS[student.training_location || ""] || "—"}</span>
              {student.has_injury && student.injury_description && (
                <span className="col-span-2 text-yellow-400 text-xs mt-1">⚠ Restrição: {student.injury_description}</span>
              )}
            </div>
          </div>
        )}

        {!plan ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Este aluno ainda não tem uma série criada.</p>
            <button
              onClick={() => navigate(`/assistente/treino/personal?aluno=${studentId}`)}
              className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" /> Criar Série com IA
            </button>
          </div>
        ) : (
          <>
            {/* Plan info */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm items-center">
              <span><span className="text-muted-foreground">Divisão:</span> {plan.division}</span>
              <span><span className="text-muted-foreground">Dias:</span> {plan.days_per_week}x</span>
              <span className={`font-medium ${plan.status === "ativa" ? "text-green-400" : "text-yellow-400"}`}>
                ● {plan.status === "ativa" ? "Aprovada" : "Aguardando revisão"}
              </span>
            </div>

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

                <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-heading text-lg tracking-wide">Ajustes do treino — {days[activeTab].name}</p>
                    <p className="text-xs text-muted-foreground">{days[activeTab].muscle_groups}</p>
                  </div>

                  <div className="divide-y divide-border">
                    {currentExercises.map((ex, idx) => (
                      <div key={ex.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={ex.exercise_name}
                            onChange={(e) => updateExercise(currentDayId!, idx, "exercise_name", e.target.value)}
                            placeholder="Nome do exercício"
                            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                          <input
                            value={ex.sets}
                            onChange={(e) => updateExercise(currentDayId!, idx, "sets", e.target.value)}
                            className="w-14 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Séries"
                          />
                          <span className="text-muted-foreground text-sm">×</span>
                          <input
                            value={ex.reps}
                            onChange={(e) => updateExercise(currentDayId!, idx, "reps", e.target.value)}
                            className="w-20 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Reps"
                          />
                          <button onClick={() => removeExercise(currentDayId!, idx)} className="text-destructive hover:text-destructive/80 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          value={ex.notes}
                          onChange={(e) => updateExercise(currentDayId!, idx, "notes", e.target.value)}
                          placeholder="Observação do personal (opcional)"
                          className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => currentDayId && addExercise(currentDayId)}
                    className="w-full px-4 py-3 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 border-t border-border"
                  >
                    <Plus className="w-4 h-4" /> Adicionar exercício
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border bg-secondary hover:border-primary/40 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar alterações
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="gradient-accent px-5 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Aprovar série e enviar para o aluno
                  </button>
                  <button
                    onClick={() => navigate(`/assistente/treino/personal?aluno=${studentId}`)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border bg-secondary hover:border-primary/40 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Criar nova série com IA
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PersonalStudentDetail;
