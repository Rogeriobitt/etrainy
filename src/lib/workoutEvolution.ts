import { supabase } from "@/integrations/supabase/client";
import { notifyPersonalSerieEvoluida } from "@/lib/notifications";

// Compound exercises that should NOT be swapped
const PILLAR_EXERCISES = [
  "supino reto", "supino inclinado", "agachamento livre", "agachamento no smith",
  "leg press", "levantamento terra", "remada curvada", "remada cavaleiro",
  "puxada alta", "desenvolvimento com barra", "desenvolvimento com halteres",
  "barra fixa", "stiff", "terra sumô"
];

function isPillar(name: string): boolean {
  return PILLAR_EXERCISES.some(p => name.toLowerCase().includes(p));
}

interface ProgressionResult {
  sets: string;
  reps: string;
}

function applyProgression(
  currentSets: string,
  currentReps: string,
  level: string,
  objective: string,
  isCompound: boolean
): ProgressionResult {
  if (objective !== "hypertrophy") {
    return { sets: currentSets, reps: currentReps };
  }

  const setsNum = parseInt(currentSets) || 3;

  switch (level) {
    case "beginner": {
      // 3x8-10 → 3x10-12
      if (currentReps.includes("8") && currentReps.includes("10")) {
        return { sets: "3", reps: "10-12" };
      }
      if (currentReps.includes("10") && currentReps.includes("12")) {
        return { sets: "3", reps: "12-15" };
      }
      // Generic bump
      return { sets: "3", reps: "10-12" };
    }
    case "intermediate": {
      if (isCompound && setsNum < 4) {
        return { sets: "4", reps: currentReps || "8-12" };
      }
      return { sets: String(setsNum), reps: currentReps || "8-12" };
    }
    case "advanced": {
      const newSets = isCompound ? "4" : String(setsNum);
      // Vary reps for some compound exercises
      if (isCompound && Math.random() > 0.5) {
        return { sets: newSets, reps: "6-8" };
      }
      return { sets: newSets, reps: "8-12" };
    }
    default:
      return { sets: currentSets, reps: currentReps };
  }
}

/**
 * Try to find an alternative exercise for the same muscle group / equipment / level.
 */
async function findAlternativeExercise(
  currentName: string,
  muscleGroup: string,
  equipmentTypes: string[],
  level: string,
  usedNames: Set<string>
): Promise<string | null> {
  const levelMap: Record<string, string[]> = {
    beginner: ["Iniciante"],
    intermediate: ["Iniciante", "Intermediário"],
    advanced: ["Iniciante", "Intermediário", "Avançado"],
  };
  const allowedLevels = levelMap[level] || levelMap.beginner;

  // Try to find muscle group from current exercise
  const { data: exercises } = await supabase
    .from("exercises")
    .select("name, muscle_group, equipment_type")
    .eq("muscle_group", muscleGroup)
    .in("equipment_type", equipmentTypes)
    .in("suggested_level", allowedLevels)
    .limit(20);

  if (!exercises || exercises.length === 0) return null;

  const candidates = exercises.filter(
    e => e.name.toLowerCase() !== currentName.toLowerCase() && !usedNames.has(e.name)
  );

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].name;
}

// Map training_location to equipment types
const LOCATION_EQUIPMENT: Record<string, string[]> = {
  gym: ["Máquina", "Barra", "Halteres", "Peso corporal", "Elástico"],
  home_weights: ["Halteres", "Elástico", "Peso corporal"],
  home_bodyweight: ["Peso corporal"],
};

/**
 * Main evolution function.
 * Returns { success, message, newPlanId? }
 */
export async function evolveWorkoutPlan(
  userId: string,
  currentPlanId: string
): Promise<{ success: boolean; message: string; newPlanId?: string }> {
  // 1. Fetch current plan
  const { data: plan, error: planErr } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("id", currentPlanId)
    .single();

  if (planErr || !plan) return { success: false, message: "Série não encontrada." };

  // 2. Check 21-day rule
  const lastUpdate = new Date(plan.updated_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 21) {
    const remaining = 21 - diffDays;
    return {
      success: false,
      message: `Ainda é cedo para atualizar sua série. Use este treino por pelo menos 3 semanas antes de evoluir. Faltam ${remaining} dia(s).`,
    };
  }

  // 3. Fetch days and exercises
  const { data: days } = await supabase
    .from("workout_days")
    .select("*")
    .eq("workout_plan_id", currentPlanId)
    .order("sort_order");

  if (!days || days.length === 0) return { success: false, message: "Série sem treinos cadastrados." };

  const dayIds = days.map(d => d.id);
  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("*")
    .in("workout_day_id", dayIds)
    .order("sort_order");

  if (!exercises) return { success: false, message: "Erro ao buscar exercícios." };

  // 4. Check if student has a personal trainer
  const { data: profile } = await supabase
    .from("profiles")
    .select("personal_trainer_id, training_location")
    .eq("user_id", userId)
    .maybeSingle();

  const hasPersonal = !!profile?.personal_trainer_id;
  const newStatus = hasPersonal ? "aguardando_revisao_personal" : "ativa";
  const equipmentTypes = LOCATION_EQUIPMENT[profile?.training_location || "gym"] || LOCATION_EQUIPMENT.gym;

  // 5. Mark old plan as historical
  await supabase
    .from("workout_plans")
    .update({ status: "historico" })
    .eq("id", currentPlanId);

  // 6. Create new plan
  const { data: newPlan, error: newPlanErr } = await supabase
    .from("workout_plans")
    .insert({
      user_id: userId,
      objective: plan.objective,
      level: plan.level,
      division: plan.division,
      days_per_week: plan.days_per_week,
      training_location: plan.training_location,
      personal_trainer_id: plan.personal_trainer_id,
      status: newStatus,
    })
    .select()
    .single();

  if (newPlanErr || !newPlan) return { success: false, message: "Erro ao criar nova série." };

  // 7. Create new days and exercises with progression
  for (const day of days) {
    const { data: newDay } = await supabase
      .from("workout_days")
      .insert({
        workout_plan_id: newPlan.id,
        name: day.name,
        muscle_groups: day.muscle_groups,
        sort_order: day.sort_order,
      })
      .select()
      .single();

    if (!newDay) continue;

    const dayExercises = exercises.filter(e => e.workout_day_id === day.id);
    const usedNames = new Set<string>();

    // Determine muscle group for this day (first group for swap lookups)
    const muscleGroups = day.muscle_groups.split("+").map((s: string) => s.trim());
    // Simple mapping for lookup
    const MUSCLE_MAP: Record<string, string> = {
      peito: "Peito", costas: "Costas (puxada)", ombros: "Ombros",
      bíceps: "Bíceps", tríceps: "Tríceps", pernas: "Quadríceps",
      abdômen: "Abdômen", glúteos: "Glúteos", panturrilha: "Panturrilha",
      lombar: "Lombar",
    };

    for (let i = 0; i < dayExercises.length; i++) {
      const ex = dayExercises[i];
      const isCompound = isPillar(ex.exercise_name);
      const { sets, reps } = applyProgression(ex.sets, ex.reps, plan.level, plan.objective, isCompound);

      let finalName = ex.exercise_name;

      // Optional swap for non-pillar exercises (swap ~30% of accessories)
      if (!isCompound && Math.random() < 0.3) {
        // Try to find the muscle group for this exercise
        const mgKey = muscleGroups.find((g: string) => {
          const lower = g.toLowerCase();
          return Object.keys(MUSCLE_MAP).some(k => lower.includes(k));
        });
        const mappedGroup = mgKey
          ? MUSCLE_MAP[Object.keys(MUSCLE_MAP).find(k => mgKey.toLowerCase().includes(k)) || ""] || ""
          : "";

        if (mappedGroup) {
          const alt = await findAlternativeExercise(ex.exercise_name, mappedGroup, equipmentTypes, plan.level, usedNames);
          if (alt) finalName = alt;
        }
      }

      usedNames.add(finalName);

      await supabase
        .from("workout_exercises")
        .insert({
          workout_day_id: newDay.id,
          exercise_name: finalName,
          sets,
          reps,
          notes: ex.notes,
          sort_order: ex.sort_order,
        });
    }
  }

  // Notify personal if linked
  if (hasPersonal && profile?.personal_trainer_id) {
    const { data: pt } = await supabase
      .from("personal_trainers")
      .select("user_id")
      .eq("id", profile.personal_trainer_id)
      .maybeSingle();
    const { data: alunoProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (pt?.user_id) {
      await notifyPersonalSerieEvoluida(
        pt.user_id,
        alunoProfile?.full_name || "Aluno",
        userId
      );
    }
  }

  return {
    success: true,
    message: hasPersonal
      ? "Sua série foi atualizada! Seu personal poderá revisar e ajustar se achar necessário."
      : "Sua série foi atualizada com sucesso!",
    newPlanId: newPlan.id,
  };
}
