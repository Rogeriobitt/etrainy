import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { selectExercisesForDay } from "@/lib/exerciseSelector";

const DIVISION_MAP: Record<number, { division: string; description: string; workouts: { name: string; muscles: string }[] }> = {
  2: {
    division: "A/B",
    description: "Divisão sugerida: Treino A/B (superior/inferior).",
    workouts: [
      { name: "Treino A", muscles: "Peito + Costas + Ombros" },
      { name: "Treino B", muscles: "Pernas + Bíceps + Tríceps" },
    ],
  },
  3: {
    division: "ABC",
    description: "Divisão sugerida: ABC (push/pull/legs).",
    workouts: [
      { name: "Treino A", muscles: "Peito + Tríceps + Ombros" },
      { name: "Treino B", muscles: "Costas + Bíceps" },
      { name: "Treino C", muscles: "Pernas + Abdômen" },
    ],
  },
  4: {
    division: "ABCD",
    description: "Divisão sugerida: ABCD (superior A, inferior A, superior B, inferior B).",
    workouts: [
      { name: "Treino A", muscles: "Peito + Tríceps" },
      { name: "Treino B", muscles: "Pernas (quadríceps + glúteos)" },
      { name: "Treino C", muscles: "Costas + Bíceps" },
      { name: "Treino D", muscles: "Pernas (posterior) + Ombros" },
    ],
  },
  5: {
    division: "ABCDE",
    description: "Divisão sugerida: ABCDE (um grupo principal por dia).",
    workouts: [
      { name: "Treino A", muscles: "Peito" },
      { name: "Treino B", muscles: "Costas" },
      { name: "Treino C", muscles: "Pernas" },
      { name: "Treino D", muscles: "Ombros + Trapézio" },
      { name: "Treino E", muscles: "Bíceps + Tríceps" },
    ],
  },
  6: {
    division: "ABCDEF",
    description: "Divisão sugerida: ABCDEF (push/pull/legs × 2).",
    workouts: [
      { name: "Treino A", muscles: "Peito + Tríceps" },
      { name: "Treino B", muscles: "Costas + Bíceps" },
      { name: "Treino C", muscles: "Pernas + Abdômen" },
      { name: "Treino D", muscles: "Peito + Ombros" },
      { name: "Treino E", muscles: "Costas + Trapézio" },
      { name: "Treino F", muscles: "Pernas + Glúteos" },
    ],
  },
};

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

const WorkoutAssistant = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = choice, 1-4 = steps
  const [intent, setIntent] = useState<"create" | "update" | null>(null);

  // Editable fields
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [location, setLocation] = useState("");
  const [gymName, setGymName] = useState("");
  const [injury, setInjury] = useState("");
  const [hasInjury, setHasInjury] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["assistant-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Populate from profile
  useEffect(() => {
    if (profile) {
      setObjective(profile.goal || "hypertrophy");
      setLevel(profile.experience_level || "beginner");
      setDaysPerWeek(parseInt(profile.training_days || "3"));
      setLocation(profile.training_location || "gym");
      setHasInjury(!!profile.has_injury);
      setInjury(profile.injury_description || "");
    }
  }, [profile]);

  const divisionInfo = DIVISION_MAP[daysPerWeek] || DIVISION_MAP[3];

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      // 1. Create workout plan
      const { data: plan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: user.id,
          objective,
          level,
          days_per_week: daysPerWeek,
          division: divisionInfo.division,
          training_location: location,
          status: profile?.personal_trainer_id ? "aguardando_revisao_personal" : "ativa",
          personal_trainer_id: profile?.personal_trainer_id || null,
        })
        .select()
        .single();

      if (planError) throw planError;

      // 2. Create workout days with exercises
      for (let i = 0; i < divisionInfo.workouts.length; i++) {
        const w = divisionInfo.workouts[i];
        const { data: day, error: dayError } = await supabase
          .from("workout_days")
          .insert({
            workout_plan_id: plan.id,
            name: w.name,
            muscle_groups: w.muscles,
            sort_order: i,
          })
          .select()
          .single();

        if (dayError) throw dayError;

        const exercises = await selectExercisesForDay(w.muscles, level, location, objective);
        const exerciseRows = exercises.map((ex, j) => ({
          workout_day_id: day.id,
          exercise_name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes,
          sort_order: j,
        }));

        const { error: exError } = await supabase
          .from("workout_exercises")
          .insert(exerciseRows);

        if (exError) throw exError;
      }

      navigate("/treinos/minha-serie");
    } catch (err) {
      console.error("Error generating workout:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-2xl">
        <button onClick={() => navigate("/dashboard/aluno")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </button>

        <h1 className="text-3xl font-heading tracking-wider mb-2 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary" />
          <span className="text-gradient">Assistente de Treino</span>
        </h1>

        {/* Profile summary */}
        <div className="bg-card border border-border rounded-xl p-4 mb-8 grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{OBJECTIVES[objective] || objective}</span></div>
          <div><span className="text-muted-foreground">Nível:</span> <span className="font-medium">{LEVELS[level] || level}</span></div>
          <div><span className="text-muted-foreground">Dias/semana:</span> <span className="font-medium">{daysPerWeek}x</span></div>
          <div><span className="text-muted-foreground">Local:</span> <span className="font-medium">{LOCATIONS[location] || location}</span></div>
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="w-full h-1.5 bg-secondary rounded-full mb-8">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 0: Intent choice */}
          {step === 0 && (
            <motion.div key="step0" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">O que você quer fazer agora?</p>
              <div className="space-y-4">
                <button onClick={() => { setIntent("create"); setStep(1); }} className="w-full bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-colors">
                  <p className="font-semibold mb-1">Criar minha primeira série completa</p>
                  <p className="text-sm text-muted-foreground">A assistente vai montar uma série personalizada do zero.</p>
                </button>
                <button onClick={() => { setIntent("update"); setStep(1); }} className="w-full bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-colors">
                  <p className="font-semibold mb-1">Atualizar/evoluir minha série atual</p>
                  <p className="text-sm text-muted-foreground">Ajuste sua série atual com base em novos objetivos ou evolução.</p>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Confirm info */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Passo 1 — Confirme suas informações</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Objetivo principal</label>
                  <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="hypertrophy">Hipertrofia</option>
                    <option value="weight_loss">Emagrecimento</option>
                    <option value="strength">Força</option>
                    <option value="conditioning">Condicionamento / Saúde geral</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nível de experiência</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="beginner">Iniciante</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Local de treino</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="gym">Academia</option>
                    <option value="home_weights">Em casa com pesos livres</option>
                    <option value="home_bodyweight">Em casa sem equipamentos</option>
                  </select>
                </div>
                {location === "gym" && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Nome da academia (opcional)</label>
                    <input value={gymName} onChange={(e) => setGymName(e.target.value)} placeholder="Ex: SmartFit Centro" className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-8">
                <button onClick={() => setStep(2)} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Division preference */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Passo 2 — Divisão de treino</p>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Quantos dias por semana quer treinar musculação?</label>
                <div className="flex gap-3 mt-2">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button key={d} onClick={() => setDaysPerWeek(d)} className={`w-12 h-12 rounded-lg font-bold text-lg transition-colors ${daysPerWeek === d ? "gradient-accent text-primary-foreground" : "bg-secondary border border-border text-foreground hover:border-primary/40"}`}>
                      {d}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 mt-6">
                <p className="text-sm font-medium mb-3">{divisionInfo.description}</p>
                <div className="space-y-2">
                  {divisionInfo.workouts.map((w) => (
                    <div key={w.name} className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-primary min-w-[80px]">{w.name}</span>
                      <span className="text-muted-foreground">{w.muscles}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
                </button>
                <button onClick={() => setStep(3)} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Restrictions */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Passo 3 — Restrições e pontos de atenção</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Você tem alguma dor, lesão ou restrição que devemos considerar?</label>
                  <div className="flex gap-4">
                    <button onClick={() => setHasInjury(false)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${!hasInjury ? "gradient-accent text-primary-foreground" : "bg-secondary border border-border text-foreground"}`}>Não</button>
                    <button onClick={() => setHasInjury(true)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${hasInjury ? "gradient-accent text-primary-foreground" : "bg-secondary border border-border text-foreground"}`}>Sim</button>
                  </div>
                </div>
                {hasInjury && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Descreva suas restrições</label>
                    <textarea value={injury} onChange={(e) => setInjury(e.target.value)} rows={3} placeholder="Ex: Dor no joelho esquerdo, restrição no ombro direito…" className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
                </button>
                <button onClick={() => setStep(4)} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generate */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Passo 4 — Sua série personalizada</p>
              <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <p className="text-sm text-muted-foreground mb-4">Com base nas suas informações, a assistente vai criar a seguinte divisão:</p>
                <div className="space-y-3">
                  {divisionInfo.workouts.map((w) => (
                    <div key={w.name} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.muscles}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8">
                <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  A partir dessas informações, a assistente de IA vai sugerir exercícios adequados ao seu nível e objetivo.
                  {profile?.personal_trainer_id && " Seu personal poderá revisar e ajustar essa série."}
                </p>
              </div>

              <div className="flex justify-between">
                <button onClick={() => navigate("/dashboard/aluno")} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors border border-border">
                  Cancelar
                </button>
                <button onClick={handleGenerate} disabled={generating} className="gradient-accent px-8 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando…</> : <><Sparkles className="w-4 h-4" /> Gerar Série</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkoutAssistant;
