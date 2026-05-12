import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { selectExercisesForDay } from "@/lib/exerciseSelector";
import { computeExpiresAt, VALIDITY_OPTIONS } from "@/lib/workoutValidity";

const DIVISION_MAP: Record<number, { division: string; description: string; workouts: { name: string; muscles: string }[] }> = {
  2: { division: "A/B", description: "Divisão sugerida: A/B (superior/inferior).", workouts: [{ name: "Treino A", muscles: "Peito + Costas + Ombros" }, { name: "Treino B", muscles: "Pernas + Bíceps + Tríceps" }] },
  3: { division: "ABC", description: "Divisão sugerida: ABC (push/pull/legs).", workouts: [{ name: "Treino A", muscles: "Peito + Tríceps + Ombros" }, { name: "Treino B", muscles: "Costas + Bíceps" }, { name: "Treino C", muscles: "Pernas + Abdômen" }] },
  4: { division: "ABCD", description: "Divisão sugerida: ABCD.", workouts: [{ name: "Treino A", muscles: "Peito + Tríceps" }, { name: "Treino B", muscles: "Pernas (quadríceps + glúteos)" }, { name: "Treino C", muscles: "Costas + Bíceps" }, { name: "Treino D", muscles: "Pernas (posterior) + Ombros" }] },
  5: { division: "ABCDE", description: "Divisão sugerida: ABCDE.", workouts: [{ name: "Treino A", muscles: "Peito" }, { name: "Treino B", muscles: "Costas" }, { name: "Treino C", muscles: "Pernas" }, { name: "Treino D", muscles: "Ombros + Trapézio" }, { name: "Treino E", muscles: "Bíceps + Tríceps" }] },
  6: { division: "ABCDEF", description: "Divisão sugerida: ABCDEF (push/pull/legs × 2).", workouts: [{ name: "Treino A", muscles: "Peito + Tríceps" }, { name: "Treino B", muscles: "Costas + Bíceps" }, { name: "Treino C", muscles: "Pernas + Abdômen" }, { name: "Treino D", muscles: "Peito + Ombros" }, { name: "Treino E", muscles: "Costas + Trapézio" }, { name: "Treino F", muscles: "Pernas + Glúteos" }] },
};

const OBJECTIVES: Record<string, string> = { hypertrophy: "Hipertrofia", weight_loss: "Emagrecimento", strength: "Força", conditioning: "Condicionamento / Saúde geral" };
const LEVELS: Record<string, string> = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" };
const LOCATIONS: Record<string, string> = { gym: "Academia", home_weights: "Em casa com pesos livres", home_bodyweight: "Em casa sem equipamentos" };

const PersonalAssistant = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedStudent = searchParams.get("aluno");

  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudent || "");
  const [step, setStep] = useState(preselectedStudent ? 1 : 0);
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [location, setLocation] = useState("");
  const [hasInjury, setHasInjury] = useState(false);
  const [injury, setInjury] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: personal } = useQuery({
    queryKey: ["personal-trainer", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("personal_trainers").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: students } = useQuery({
    queryKey: ["personal-students-list", personal?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").eq("personal_trainer_id", personal!.id);
      return data || [];
    },
    enabled: !!personal?.id,
  });

  const { data: studentProfile } = useQuery({
    queryKey: ["student-profile-assistant", selectedStudentId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", selectedStudentId).maybeSingle();
      return data;
    },
    enabled: !!selectedStudentId,
  });

  useEffect(() => {
    if (studentProfile) {
      setObjective(studentProfile.goal || "hypertrophy");
      setLevel(studentProfile.experience_level || "beginner");
      setDaysPerWeek(parseInt(studentProfile.training_days || "3"));
      setLocation(studentProfile.training_location || "gym");
      setHasInjury(!!studentProfile.has_injury);
      setInjury(studentProfile.injury_description || "");
    }
  }, [studentProfile]);

  const divisionInfo = DIVISION_MAP[daysPerWeek] || DIVISION_MAP[3];

  const handleGenerate = async () => {
    if (!personal?.id || !selectedStudentId) return;
    setGenerating(true);
    try {
      const { data: plan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: selectedStudentId,
          objective,
          level,
          days_per_week: daysPerWeek,
          division: divisionInfo.division,
          training_location: location,
          status: "aguardando_revisao_personal",
          personal_trainer_id: personal.id,
        })
        .select()
        .single();
      if (planError) throw planError;

      for (let i = 0; i < divisionInfo.workouts.length; i++) {
        const w = divisionInfo.workouts[i];
        const { data: day, error: dayError } = await supabase
          .from("workout_days")
          .insert({ workout_plan_id: plan.id, name: w.name, muscle_groups: w.muscles, sort_order: i })
          .select()
          .single();
        if (dayError) throw dayError;

        const exercises = await selectExercisesForDay(w.muscles, level, location, objective);
        await supabase.from("workout_exercises").insert(
          exercises.map((ex, j) => ({ workout_day_id: day.id, exercise_name: ex.name, sets: ex.sets, reps: ex.reps, notes: ex.notes, sort_order: j }))
        );
      }

      navigate(`/personal/alunos/${selectedStudentId}`);
    } catch (err) {
      console.error("Error generating workout:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const pageVariants = { enter: { opacity: 0, x: 40 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-2xl">
        <button onClick={() => navigate("/dashboard/personal")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </button>

        <h1 className="text-3xl font-heading tracking-wider mb-2 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary" />
          <span className="text-gradient">Criar Série para Aluno</span>
        </h1>

        {step > 0 && (
          <div className="w-full h-1.5 bg-secondary rounded-full mb-8 mt-4">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 0: Select student */}
          {step === 0 && (
            <motion.div key="step0" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Selecione o aluno</p>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-6"
              >
                <option value="">Escolha um aluno...</option>
                {students?.map((s) => (
                  <option key={s.user_id} value={s.user_id}>{s.full_name || "Aluno sem nome"}</option>
                ))}
              </select>
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  disabled={!selectedStudentId}
                  className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Confirm info */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-2">Passo 1 — Dados do aluno</p>
              {studentProfile && <p className="text-sm text-muted-foreground mb-6">Aluno: <span className="font-medium text-foreground">{studentProfile.full_name}</span></p>}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Objetivo</label>
                  <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="hypertrophy">Hipertrofia</option><option value="weight_loss">Emagrecimento</option><option value="strength">Força</option><option value="conditioning">Condicionamento</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nível</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Local de treino</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="gym">Academia</option><option value="home_weights">Em casa com pesos livres</option><option value="home_bodyweight">Em casa sem equipamentos</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(preselectedStudent ? 0 : 0)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar</button>
                <button onClick={() => setStep(2)} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">Continuar <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Division */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Passo 2 — Divisão de treino</p>
              <div className="flex gap-3 mt-2">
                {[2, 3, 4, 5, 6].map((d) => (
                  <button key={d} onClick={() => setDaysPerWeek(d)} className={`w-12 h-12 rounded-lg font-bold text-lg transition-colors ${daysPerWeek === d ? "gradient-accent text-primary-foreground" : "bg-secondary border border-border text-foreground hover:border-primary/40"}`}>{d}x</button>
                ))}
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
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar</button>
                <button onClick={() => setStep(3)} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">Continuar <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Restrictions */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Passo 3 — Restrições do aluno</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">O aluno tem alguma dor, lesão ou restrição?</label>
                  <div className="flex gap-4">
                    <button onClick={() => setHasInjury(false)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${!hasInjury ? "gradient-accent text-primary-foreground" : "bg-secondary border border-border"}`}>Não</button>
                    <button onClick={() => setHasInjury(true)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${hasInjury ? "gradient-accent text-primary-foreground" : "bg-secondary border border-border"}`}>Sim</button>
                  </div>
                </div>
                {hasInjury && (
                  <textarea value={injury} onChange={(e) => setInjury(e.target.value)} rows={3} placeholder="Descreva as restrições…" className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
                )}
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar</button>
                <button onClick={() => setStep(4)} className="gradient-accent px-6 py-2.5 rounded-lg font-semibold text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">Continuar <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generate */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <p className="text-lg font-heading tracking-wide mb-6">Passo 4 — Gerar série</p>
              <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <p className="text-sm text-muted-foreground mb-4">Série que será criada para o aluno:</p>
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
                <p className="text-sm text-muted-foreground">A série será criada com status "Aguardando revisão". Você poderá editar os exercícios antes de aprovar e enviar para o aluno.</p>
              </div>
              <div className="flex justify-between">
                <button onClick={() => navigate("/dashboard/personal")} className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors border border-border">Cancelar</button>
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

export default PersonalAssistant;
