import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, Info, RefreshCw, Pencil, Plus, Save, X } from "lucide-react";
import { evolveWorkoutPlan } from "@/lib/workoutEvolution";
import { toast } from "@/hooks/use-toast";
import { ExerciseEditor, type EditableExercise } from "@/components/ExerciseEditor";
import { getValidityInfo } from "@/lib/workoutValidity";
import { useExerciseImages, lookupExerciseImage } from "@/hooks/useExerciseImages";
import { Dumbbell } from "lucide-react";

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

const tempId = () => `tmp_${Math.random().toString(36).slice(2, 10)}`;

const MyWorkout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showDivision, setShowDivision] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const { data: exerciseImages } = useExerciseImages();

  // Edit mode state (personal trainer only)
  const [isPersonal, setIsPersonal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedExercises, setEditedExercises] = useState<Record<string, EditableExercise[]>>({});

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

  // Determine if current user is the personal trainer linked to this plan's owner
  useEffect(() => {
    const checkPersonal = async () => {
      if (!user || !plan?.personal_trainer_id) {
        setIsPersonal(false);
        return;
      }
      const { data } = await supabase
        .from("personal_trainers")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", plan.personal_trainer_id)
        .maybeSingle();
      setIsPersonal(!!data);
    };
    checkPersonal();
  }, [user, plan?.personal_trainer_id]);

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

  // Initialize editable state when entering edit mode
  const enterEditMode = () => {
    if (!days) return;
    const seed: Record<string, EditableExercise[]> = {};
    days.forEach((d) => {
      seed[d.id] = d.exercises.map((e) => ({
        id: e.id,
        exercise_name: e.exercise_name,
        sets: e.sets,
        reps: e.reps,
        notes: e.notes || "",
        image_url: e.image_url || "",
        sort_order: e.sort_order,
      }));
    });
    setEditedExercises(seed);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedExercises({});
  };

  const updateExercise = (dayId: string, exerciseId: string, field: string, value: string) => {
    setEditedExercises((prev) => ({
      ...prev,
      [dayId]: (prev[dayId] || []).map((ex) =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setEditedExercises((prev) => ({
      ...prev,
      [dayId]: (prev[dayId] || []).map((ex) =>
        ex.id === exerciseId ? { ...ex, deleted: true } : ex
      ),
    }));
  };

  const addExercise = (dayId: string) => {
    setEditedExercises((prev) => {
      const list = prev[dayId] || [];
      const maxOrder = list.reduce((m, e) => Math.max(m, e.sort_order), -1);
      return {
        ...prev,
        [dayId]: [
          ...list,
          {
            id: tempId(),
            exercise_name: "",
            sets: "3",
            reps: "10-12",
            notes: "",
            image_url: "",
            sort_order: maxOrder + 1,
            isNew: true,
          },
        ],
      };
    });
  };

  const saveChanges = async () => {
    if (!days) return;
    setSaving(true);
    try {
      for (const dayId of Object.keys(editedExercises)) {
        const list = editedExercises[dayId];
        const original = days.find((d) => d.id === dayId)?.exercises || [];

        // Deletes
        const toDelete = list.filter((e) => e.deleted && !e.isNew).map((e) => e.id);
        if (toDelete.length > 0) {
          const { error } = await supabase.from("workout_exercises").delete().in("id", toDelete);
          if (error) throw error;
        }

        // Inserts
        const toInsert = list
          .filter((e) => e.isNew && !e.deleted && e.exercise_name.trim())
          .map((e) => ({
            workout_day_id: dayId,
            exercise_name: e.exercise_name.trim(),
            sets: e.sets || "3",
            reps: e.reps || "10-12",
            notes: e.notes || null,
            image_url: e.image_url || null,
            sort_order: e.sort_order,
          }));
        if (toInsert.length > 0) {
          const { error } = await supabase.from("workout_exercises").insert(toInsert);
          if (error) throw error;
        }

        // Updates (existing, not deleted, with changes)
        const toUpdate = list.filter((e) => !e.isNew && !e.deleted);
        for (const e of toUpdate) {
          const orig = original.find((o) => o.id === e.id);
          if (!orig) continue;
          const changed =
            orig.exercise_name !== e.exercise_name ||
            orig.sets !== e.sets ||
            orig.reps !== e.reps ||
            (orig.notes || "") !== e.notes ||
            (orig.image_url || "") !== e.image_url;
          if (!changed) continue;
          const { error } = await supabase
            .from("workout_exercises")
            .update({
              exercise_name: e.exercise_name.trim(),
              sets: e.sets,
              reps: e.reps,
              notes: e.notes || null,
              image_url: e.image_url || null,
            })
            .eq("id", e.id);
          if (error) throw error;
        }
      }

      toast({ title: "Alterações salvas!", description: "A série foi atualizada." });
      setEditMode(false);
      setEditedExercises({});
      queryClient.invalidateQueries({ queryKey: ["my-workout-days"] });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const loading = authLoading || planLoading || daysLoading;
  const statusInfo = plan ? STATUS_LABELS[plan.status] || { label: plan.status, color: "text-muted-foreground" } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentDay = days?.[activeTab];
  const currentEditList = editMode && currentDay
    ? (editedExercises[currentDay.id] || []).filter((e) => !e.deleted)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1 className="text-3xl font-heading tracking-wider mb-2">Minha Série de Musculação</h1>

        {!plan ? (
          <div className="bg-card border border-primary/20 rounded-xl p-8 text-center mt-8">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="font-heading text-lg tracking-wide mb-1">Sua série ainda não está pronta</h2>
            <p className="text-sm text-muted-foreground">
              Seu Personal Trainer está montando sua série de treinos. Assim que estiver pronta, ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Plan summary */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm items-center">
              <span><span className="text-muted-foreground">Objetivo:</span> {OBJECTIVES[plan.objective] || plan.objective}</span>
              <span><span className="text-muted-foreground">Divisão:</span> {plan.division}</span>
              <span><span className="text-muted-foreground">Dias:</span> {plan.days_per_week}x/semana</span>
              {statusInfo && <span className={`font-medium ${statusInfo.color}`}>● {statusInfo.label}</span>}
              {(() => {
                const info = getValidityInfo((plan as any).expires_at);
                return info ? (
                  <span className={`font-medium ${info.color}`}>● {info.label}</span>
                ) : null;
              })()}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button onClick={() => setShowDivision(!showDivision)} className="px-4 py-2 rounded-lg text-sm border border-border bg-secondary hover:border-primary/40 transition-colors flex items-center gap-2">
                <Info className="w-4 h-4" /> {showDivision ? "Fechar resumo" : "Ver resumo da divisão"}
              </button>

              {!editMode && !isPersonal && (
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
                    } catch (err) {
                      toast({ title: "Algo deu errado", description: "Não foi possível evoluir a série. Tente novamente em alguns instantes.", variant: "destructive" });
                    } finally {
                      setEvolving(false);
                    }
                  }}
                  disabled={evolving}
                  className="px-4 py-2 rounded-lg text-sm border border-border bg-secondary hover:border-primary/40 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {evolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {evolving ? "Evoluindo..." : "Pedir atualização da série"}
                </button>
              )}

              {/* Edit toggle (personal trainer only) */}
              {isPersonal && !editMode && (
                <button
                  onClick={enterEditMode}
                  className="px-4 py-2 rounded-lg text-sm gradient-accent text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Pencil className="w-4 h-4" /> Editar série
                </button>
              )}
              {isPersonal && editMode && (
                <>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm gradient-accent text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Salvando..." : "Salvar alterações"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm border border-border bg-secondary hover:border-destructive/40 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </>
              )}
            </div>

            {/* Division summary */}
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
            {days && days.length > 0 && currentDay && (
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
                      <p className="font-heading text-lg tracking-wide">{currentDay.name}</p>
                      <p className="text-xs text-muted-foreground">{currentDay.muscle_groups}</p>
                    </div>
                  </div>

                  {editMode ? (
                    <>
                      <div className="divide-y divide-border">
                        {currentEditList.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-center text-muted-foreground">Nenhum exercício. Adicione um abaixo.</p>
                        ) : (
                          currentEditList.map((ex) => (
                            <ExerciseEditor
                              key={ex.id}
                              exercise={ex}
                              exerciseId={ex.id}
                              dayId={currentDay.id}
                              onUpdate={updateExercise}
                              onRemove={removeExercise}
                            />
                          ))
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-border">
                        <button
                          onClick={() => addExercise(currentDay.id)}
                          className="w-full py-2 rounded-lg border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Adicionar exercício
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="divide-y divide-border">
                      {currentDay.exercises.map((ex) => (
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
                  )}
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
