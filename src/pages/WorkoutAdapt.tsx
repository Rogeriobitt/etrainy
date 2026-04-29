import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Luggage,
  Dumbbell,
  PersonStanding,
  Building2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type TrainingMode = "bodyweight" | "freeweights" | "limited";

const MODE_LABELS: Record<TrainingMode, string> = {
  bodyweight: "Peso corporal (sem equipamentos)",
  freeweights: "Pesos livres (halteres, elásticos, etc.)",
  limited: "Ambiente limitado (hotel, espaço pequeno)",
};

const MODE_ICONS: Record<TrainingMode, typeof PersonStanding> = {
  bodyweight: PersonStanding,
  freeweights: Dumbbell,
  limited: Building2,
};

const DURATION_OPTIONS = [
  { value: "single", label: "1 treino apenas" },
  { value: "1week", label: "1 semana" },
  { value: "2weeks", label: "2 semanas ou mais" },
];

const EQUIPMENT_OPTIONS = [
  "Halteres",
  "Elásticos de resistência",
  "Barra fixa / argolas",
  "Bola suíça",
  "Step",
  "Nenhum equipamento",
];

interface WorkoutPlan {
  id: string;
  objective: string;
  division: string;
  days_per_week: number;
  status: string;
}

interface WorkoutDay {
  id: string;
  name: string;
  muscle_groups: string;
  sort_order: number;
}

interface WorkoutExercise {
  id: string;
  exercise_name: string;
  sets: string;
  reps: string;
  notes: string | null;
  workout_day_id: string;
  sort_order: number;
}

interface Equivalent {
  original_exercise: string;
  bodyweight_equivalent: string;
  freeweight_equivalent: string;
  limited_space_equivalent: string | null;
}

interface AdaptedExercise {
  original: string;
  adapted: string;
  sets: string;
  reps: string;
  dayId: string;
  sortOrder: number;
  excluded: boolean;
  customOverride: string;
}

const WorkoutAdapt = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [mode, setMode] = useState<TrainingMode>("bodyweight");
  const [duration, setDuration] = useState("1week");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [adaptedExercises, setAdaptedExercises] = useState<AdaptedExercise[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  // Fetch user's active workout plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["adapt-plans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("id, objective, division, days_per_week, status")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WorkoutPlan[];
    },
    enabled: !!user,
  });

  // Auto-select first plan
  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Fetch days + exercises for selected plan
  const { data: days } = useQuery({
    queryKey: ["adapt-days", selectedPlanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_days")
        .select("*")
        .eq("workout_plan_id", selectedPlanId)
        .order("sort_order");
      if (error) throw error;
      return data as WorkoutDay[];
    },
    enabled: !!selectedPlanId,
  });

  const { data: exercises } = useQuery({
    queryKey: ["adapt-exercises", days?.map((d) => d.id).join(",")],
    queryFn: async () => {
      if (!days || days.length === 0) return [];
      const dayIds = days.map((d) => d.id);
      const { data, error } = await supabase
        .from("workout_exercises")
        .select("*")
        .in("workout_day_id", dayIds)
        .order("sort_order");
      if (error) throw error;
      return data as WorkoutExercise[];
    },
    enabled: !!days && days.length > 0,
  });

  // Fetch equivalents table
  const { data: equivalents } = useQuery({
    queryKey: ["exercise-equivalents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_equivalents")
        .select("*");
      if (error) throw error;
      return data as Equivalent[];
    },
  });

  // Build adapted exercises when moving to step 4
  const buildAdaptations = () => {
    if (!exercises || !equivalents) return;

    const eqMap = new Map<string, Equivalent>();
    equivalents.forEach((eq) => eqMap.set(eq.original_exercise.toLowerCase(), eq));

    const adapted: AdaptedExercise[] = exercises.map((ex) => {
      const eq = eqMap.get(ex.exercise_name.toLowerCase());
      let adaptedName = ex.exercise_name; // fallback to original

      if (eq) {
        if (mode === "bodyweight") adaptedName = eq.bodyweight_equivalent;
        else if (mode === "freeweights") adaptedName = eq.freeweight_equivalent;
        else adaptedName = eq.limited_space_equivalent || eq.bodyweight_equivalent;
      }

      return {
        original: ex.exercise_name,
        adapted: adaptedName,
        sets: ex.sets,
        reps: ex.reps,
        dayId: ex.workout_day_id,
        sortOrder: ex.sort_order,
        excluded: false,
        customOverride: "",
      };
    });

    setAdaptedExercises(adapted);
  };

  const handleSave = async () => {
    if (!user || !days) return;
    setSaving(true);

    try {
      const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
      if (!selectedPlan) throw new Error("Plan not found");

      // Create adapted workout plan
      const { data: newPlan, error: planErr } = await supabase
        .from("workout_plans")
        .insert({
          user_id: user.id,
          objective: selectedPlan.objective,
          level: "adapted",
          days_per_week: selectedPlan.days_per_week,
          division: selectedPlan.division + " (adaptado)",
          training_location: mode === "bodyweight" ? "home_bodyweight" : mode === "freeweights" ? "home_weights" : "limited",
          status: "ativa",
          personal_trainer_id: null,
        })
        .select()
        .single();

      if (planErr) throw planErr;

      // Create days
      for (const day of days) {
        const { data: newDay, error: dayErr } = await supabase
          .from("workout_days")
          .insert({
            workout_plan_id: newPlan.id,
            name: day.name,
            muscle_groups: day.muscle_groups,
            sort_order: day.sort_order,
          })
          .select()
          .single();

        if (dayErr) throw dayErr;

        // Create adapted exercises for this day
        const dayExercises = adaptedExercises
          .filter((ex) => ex.dayId === day.id && !ex.excluded)
          .map((ex, i) => ({
            workout_day_id: newDay.id,
            exercise_name: ex.customOverride || ex.adapted,
            sets: ex.sets,
            reps: ex.reps,
            sort_order: i,
            notes: `Adaptado de: ${ex.original}`,
          }));

        if (dayExercises.length > 0) {
          const { error: exErr } = await supabase
            .from("workout_exercises")
            .insert(dayExercises);
          if (exErr) throw exErr;
        }
      }

      navigate("/treinos/minha-serie");
    } catch (err) {
      console.error("Error saving adapted workout:", err);
    } finally {
      setSaving(false);
    }
  };

  const showEquipmentStep = mode === "freeweights" || mode === "limited";
  const totalSteps = showEquipmentStep ? 5 : 4;
  const effectiveStep = !showEquipmentStep && step > 2 ? step + 1 : step;

  const goNext = () => {
    if (step === 2 && !showEquipmentStep) {
      // Skip equipment step, go to adaptation (logically step 4)
      buildAdaptations();
      setStep(3);
    } else if ((showEquipmentStep && step === 3) || (!showEquipmentStep && step === 3)) {
      if (showEquipmentStep && step === 3) {
        buildAdaptations();
        setStep(4);
      } else {
        setStep(step + 1);
      }
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (!showEquipmentStep && step === 3) {
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  // Determine which step renders adaptation and confirmation
  const isAdaptationStep = showEquipmentStep ? step === 4 : step === 3;
  const isConfirmStep = showEquipmentStep ? step === 5 : step === 4;

  const progressPercent = showEquipmentStep
    ? (step / 5) * 100
    : step <= 2
    ? (step / 4) * 100
    : ((step + 1) / 5) * 100;

  if (authLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12 max-w-2xl text-center">
          <Luggage className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-heading tracking-wider mb-3">Sem série para adaptar</h1>
          <p className="text-muted-foreground mb-6">
            Você ainda não tem uma série ativa. Fale com seu Personal Trainer para que ele monte sua próxima série.
          </p>
          <button
            onClick={() => navigate("/aluno/dashboard")}
            className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pageVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const getDayName = (dayId: string) => days?.find((d) => d.id === dayId)?.name || "";

  // Group adapted exercises by day
  const groupedByDay = adaptedExercises.reduce<Record<string, AdaptedExercise[]>>((acc, ex) => {
    if (!acc[ex.dayId]) acc[ex.dayId] = [];
    acc[ex.dayId].push(ex);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-2xl">
        <button
          onClick={() => navigate("/dashboard/aluno")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </button>

        <h1 className="text-3xl font-heading tracking-wider mb-2 flex items-center gap-3">
          <Luggage className="w-7 h-7 text-primary" />
          <span className="text-gradient">Adaptar Treino</span>
        </h1>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-secondary rounded-full mb-8">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 — Context */}
          {step === 1 && (
            <motion.div key="s1" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-2">Adapte seu treino para treinar fora da academia</p>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione sua série atual que será adaptada e informe onde você vai treinar.
              </p>

              {plans.length > 1 && (
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-1 block">Série a adaptar</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.division} — {p.objective} ({p.days_per_week}x/semana)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-3">Onde você vai treinar?</p>
              <div className="space-y-3">
                {(Object.keys(MODE_LABELS) as TrainingMode[]).map((m) => {
                  const Icon = MODE_ICONS[m];
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`w-full flex items-center gap-4 bg-card border rounded-xl p-4 text-left transition-colors ${
                        mode === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mode === m ? "bg-primary/20" : "bg-secondary"}`}>
                        <Icon className={`w-5 h-5 ${mode === m ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-sm font-medium">{MODE_LABELS[m]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end mt-8">
                <button onClick={() => setStep(2)} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Duration */}
          {step === 2 && (
            <motion.div key="s2" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Por quanto tempo você ficará sem academia?</p>
              <div className="space-y-3">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={`w-full bg-card border rounded-xl p-4 text-left transition-colors ${
                      duration === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
                </button>
                <button onClick={goNext} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 (conditional) — Equipment */}
          {step === 3 && showEquipmentStep && (
            <motion.div key="s3" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Quais equipamentos você tem disponíveis?</p>
              <div className="space-y-3">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <label
                    key={eq}
                    className={`flex items-center gap-3 bg-card border rounded-xl p-4 cursor-pointer transition-colors ${
                      equipment.includes(eq) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Checkbox
                      checked={equipment.includes(eq)}
                      onCheckedChange={(checked) => {
                        if (eq === "Nenhum equipamento") {
                          setEquipment(checked ? ["Nenhum equipamento"] : []);
                        } else {
                          setEquipment((prev) =>
                            checked
                              ? [...prev.filter((e) => e !== "Nenhum equipamento"), eq]
                              : prev.filter((e) => e !== eq)
                          );
                        }
                      }}
                    />
                    <span className="text-sm">{eq}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
                </button>
                <button
                  onClick={() => { buildAdaptations(); setStep(4); }}
                  className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ADAPTATION STEP — side by side comparison */}
          {isAdaptationStep && (
            <motion.div key="s4" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-2">Adaptação automática</p>
              <p className="text-sm text-muted-foreground mb-6">
                Cada exercício da sua série foi substituído por um equivalente para {MODE_LABELS[mode].toLowerCase()}.
              </p>

              {Object.entries(groupedByDay).map(([dayId, exs]) => (
                <div key={dayId} className="mb-6">
                  <h3 className="text-sm font-heading tracking-wide text-primary mb-3">{getDayName(dayId)}</h3>
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_1fr_40px] gap-2 px-4 py-2 bg-secondary/50 text-xs text-muted-foreground font-medium">
                      <span>Original</span>
                      <span>Adaptado</span>
                      <span></span>
                    </div>
                    {exs.map((ex, i) => {
                      const idx = adaptedExercises.indexOf(ex);
                      return (
                        <div
                          key={i}
                          className={`grid grid-cols-[1fr_1fr_40px] gap-2 px-4 py-3 border-t border-border items-center ${
                            ex.excluded ? "opacity-40" : ""
                          }`}
                        >
                          <span className="text-sm line-through text-muted-foreground">{ex.original}</span>
                          <div>
                            {ex.excluded ? (
                              <span className="text-sm text-muted-foreground italic">Removido</span>
                            ) : ex.customOverride ? (
                              <input
                                value={ex.customOverride}
                                onChange={(e) => {
                                  const copy = [...adaptedExercises];
                                  copy[idx] = { ...copy[idx], customOverride: e.target.value };
                                  setAdaptedExercises(copy);
                                }}
                                className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                              />
                            ) : (
                              <button
                                onClick={() => {
                                  const copy = [...adaptedExercises];
                                  copy[idx] = { ...copy[idx], customOverride: ex.adapted };
                                  setAdaptedExercises(copy);
                                }}
                                className="text-sm text-foreground hover:text-primary transition-colors text-left"
                                title="Clique para editar"
                              >
                                {ex.adapted}
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const copy = [...adaptedExercises];
                              copy[idx] = { ...copy[idx], excluded: !copy[idx].excluded, customOverride: "" };
                              setAdaptedExercises(copy);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title={ex.excluded ? "Restaurar exercício" : "Remover exercício"}
                          >
                            {ex.excluded ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-8">
                <button onClick={goBack} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
                </button>
                <button
                  onClick={() => setStep(step + 1)}
                  className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* CONFIRMATION STEP */}
          {isConfirmStep && (
            <motion.div key="s5" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center">
                <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
                <p className="text-lg font-heading tracking-wide mb-3">Tudo pronto para salvar</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                  Esta série adaptada ficará salva como uma versão temporária. Seu personal será notificado para revisar.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 mb-8">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Modo:</span> <span className="font-medium">{MODE_LABELS[mode]}</span></div>
                  <div><span className="text-muted-foreground">Duração:</span> <span className="font-medium">{DURATION_OPTIONS.find((o) => o.value === duration)?.label}</span></div>
                  <div>
                    <span className="text-muted-foreground">Exercícios adaptados:</span>{" "}
                    <span className="font-medium">{adaptedExercises.filter((e) => !e.excluded).length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Removidos:</span>{" "}
                    <span className="font-medium">{adaptedExercises.filter((e) => e.excluded).length}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => navigate("/dashboard/aluno")}
                  className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Salvar Treino Adaptado
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkoutAdapt;
