import { supabase } from "@/integrations/supabase/client";

// Maps location keys to equipment types that are available
const LOCATION_EQUIPMENT_MAP: Record<string, string[]> = {
  gym: ["Máquina", "Barra", "Halteres", "Peso corporal", "Elástico"],
  home_weights: ["Halteres", "Elástico", "Peso corporal"],
  home_bodyweight: ["Peso corporal"],
};

// Maps level keys to allowed suggested_level values (inclusive downward)
const LEVEL_PRIORITY: Record<string, string[]> = {
  beginner: ["Iniciante"],
  intermediate: ["Iniciante", "Intermediário"],
  advanced: ["Iniciante", "Intermediário", "Avançado"],
};

// Parse muscle string like "Peito + Tríceps" into muscle group search terms
function parseMuscleGroups(muscleString: string): string[] {
  const groups: string[] = [];
  const parts = muscleString.split("+").map((s) => s.trim().toLowerCase());

  const MAPPING: Record<string, string[]> = {
    peito: ["Peito"],
    costas: ["Costas (puxada)", "Costas (remada)"],
    ombros: ["Ombros"],
    "trapézio": ["Ombros"],
    bíceps: ["Bíceps"],
    "tríceps": ["Tríceps"],
    pernas: ["Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilha"],
    "abdômen": ["Abdômen"],
    "glúteos": ["Glúteos"],
    "quadríceps": ["Quadríceps"],
    "pernas (quadríceps + glúteos)": ["Quadríceps", "Glúteos"],
    "pernas (posterior)": ["Posterior de coxa", "Panturrilha"],
    panturrilha: ["Panturrilha"],
    lombar: ["Lombar"],
  };

  for (const part of parts) {
    const key = Object.keys(MAPPING).find((k) => part.includes(k));
    if (key) {
      groups.push(...MAPPING[key]);
    }
  }

  return [...new Set(groups)];
}

export interface SelectedExercise {
  name: string;
  sets: string;
  reps: string;
  notes: string | null;
}

// Determine sets/reps based on objective
function getSetsReps(objective: string, level: string): { sets: string; reps: string } {
  switch (objective) {
    case "strength":
      return { sets: level === "beginner" ? "3" : "4", reps: "4-6" };
    case "hypertrophy":
      return { sets: level === "beginner" ? "3" : "4", reps: "8-12" };
    case "weight_loss":
      return { sets: "3", reps: "12-15" };
    case "conditioning":
      return { sets: "3", reps: "12-15" };
    default:
      return { sets: "3", reps: "10-12" };
  }
}

/**
 * Select exercises from the database for a given muscle group string.
 * Returns 3-4 exercises per muscle group, filtered by level and location.
 */
export async function selectExercisesForDay(
  muscleString: string,
  level: string,
  location: string,
  objective: string,
  maxPerGroup: number = 3
): Promise<SelectedExercise[]> {
  const muscleGroups = parseMuscleGroups(muscleString);
  const allowedEquipment = LOCATION_EQUIPMENT_MAP[location] || LOCATION_EQUIPMENT_MAP.gym;
  const allowedLevels = LEVEL_PRIORITY[level] || LEVEL_PRIORITY.beginner;

  const result: SelectedExercise[] = [];

  // Adjust exercises per group based on how many groups we have
  const exercisesPerGroup = muscleGroups.length <= 2 ? maxPerGroup : Math.min(maxPerGroup, 3);

  for (const group of muscleGroups) {
    const { data: exercises } = await supabase
      .from("exercises")
      .select("name, short_description, notes, suggested_level, equipment_type")
      .eq("muscle_group", group)
      .in("equipment_type", allowedEquipment)
      .in("suggested_level", allowedLevels)
      .limit(20);

    if (!exercises || exercises.length === 0) continue;

    // Sort: prefer matching level first, then vary equipment
    const sorted = [...exercises].sort((a, b) => {
      // Exact level match gets priority
      const aMatch = a.suggested_level === (allowedLevels[allowedLevels.length - 1] || "Iniciante") ? 0 : 1;
      const bMatch = b.suggested_level === (allowedLevels[allowedLevels.length - 1] || "Iniciante") ? 0 : 1;
      return aMatch - bMatch;
    });

    // Pick up to exercisesPerGroup, trying to diversify equipment
    const picked: typeof exercises = [];
    const usedEquipment = new Set<string>();

    for (const ex of sorted) {
      if (picked.length >= exercisesPerGroup) break;
      if (!usedEquipment.has(ex.equipment_type) || picked.length < exercisesPerGroup) {
        picked.push(ex);
        usedEquipment.add(ex.equipment_type);
      }
    }

    const { sets, reps } = getSetsReps(objective, level);

    for (const ex of picked) {
      result.push({
        name: ex.name,
        sets,
        reps,
        notes: ex.notes || null,
      });
    }
  }

  return result;
}
