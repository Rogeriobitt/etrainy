import { useState, useRef, useEffect } from "react";
import { Trash2, Dumbbell, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExerciseImages, lookupExerciseImage } from "@/hooks/useExerciseImages";

interface EditableExercise {
  id: string;
  exercise_name: string;
  sets: string;
  reps: string;
  notes: string;
  image_url: string;
  sort_order: number;
  isNew?: boolean;
  deleted?: boolean;
}

interface ExerciseSuggestion {
  name: string;
  muscle_group: string;
  equipment_type: string;
  suggested_level: string;
  short_description: string | null;
}

interface ExerciseEditorProps {
  exercise: EditableExercise;
  exerciseId: string;
  dayId: string;
  onUpdate: (dayId: string, exerciseId: string, field: string, value: string) => void;
  onRemove: (dayId: string, exerciseId: string) => void;
}

const ALL_GROUPS = "__all__";

const ExerciseEditor = ({ exercise, exerciseId, dayId, onUpdate, onRemove }: ExerciseEditorProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL_GROUPS);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: exerciseImages } = useExerciseImages();
  const displayImage = lookupExerciseImage(exerciseImages, exercise.exercise_name, exercise.image_url);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load distinct muscle groups once for the filter dropdown
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("exercises")
        .select("muscle_group")
        .order("muscle_group", { ascending: true });
      if (data) {
        const unique = Array.from(new Set(data.map((d: any) => d.muscle_group).filter(Boolean)));
        setMuscleGroups(unique);
      }
    })();
  }, []);

  const runSearch = async (query: string, group: string) => {
    // Allow browsing by group alone (no name typed)
    if (query.length < 2 && group === ALL_GROUPS) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let q = supabase
      .from("exercises")
      .select("name, muscle_group, equipment_type, suggested_level, short_description")
      .order("name", { ascending: true })
      .limit(12);
    if (query.length >= 2) q = q.ilike("name", `%${query}%`);
    if (group !== ALL_GROUPS) q = q.eq("muscle_group", group);
    const { data } = await q;
    setSuggestions((data as ExerciseSuggestion[]) || []);
    setShowSuggestions(true);
  };

  const onNameChange = (value: string) => {
    onUpdate(dayId, exerciseId, "exercise_name", value);
    runSearch(value, selectedGroup);
  };

  const onGroupChange = (value: string) => {
    setSelectedGroup(value);
    runSearch(exercise.exercise_name, value);
  };

  const selectSuggestion = (name: string) => {
    onUpdate(dayId, exerciseId, "exercise_name", name);
    setShowSuggestions(false);
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
          {displayImage ? (
            <img src={displayImage} alt={exercise.exercise_name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Dumbbell className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-2">
          {/* Filter + Search row */}
          <div className="relative" ref={wrapperRef}>
            <div className="flex items-center gap-2">
              <select
                value={selectedGroup}
                onChange={(e) => onGroupChange(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none max-w-[40%]"
                title="Filtrar por grupo muscular"
              >
                <option value={ALL_GROUPS}>Todos os grupos</option>
                {muscleGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={exercise.exercise_name}
                  onChange={(e) => onNameChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                    else if (selectedGroup !== ALL_GROUPS) runSearch(exercise.exercise_name, selectedGroup);
                  }}
                  placeholder="Buscar ou digitar exercício"
                  className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex flex-col gap-0.5 border-b border-border/40 last:border-b-0"
                  >
                    <span className="font-medium">{s.name}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        {s.muscle_group}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {s.equipment_type}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {s.suggested_level}
                      </span>
                    </div>
                    {s.short_description && (
                      <span className="text-xs text-muted-foreground mt-1 leading-snug">
                        {s.short_description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && suggestions.length === 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs text-muted-foreground">
                Nenhum exercício encontrado no catálogo. Você pode digitar um nome livre.
              </div>
            )}
          </div>

          {/* Sets × Reps row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">Séries</label>
              <input
                value={exercise.sets}
                onChange={(e) => onUpdate(dayId, exerciseId, "sets", e.target.value)}
                className="w-14 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <span className="text-muted-foreground text-sm">×</span>
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">Reps</label>
              <input
                value={exercise.reps}
                onChange={(e) => onUpdate(dayId, exerciseId, "reps", e.target.value)}
                className="w-20 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button onClick={() => onRemove(dayId, exerciseId)} className="ml-auto text-destructive hover:text-destructive/80 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Notes */}
          <input
            value={exercise.notes}
            onChange={(e) => onUpdate(dayId, exerciseId, "notes", e.target.value)}
            placeholder="Observação do personal (opcional)"
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export { ExerciseEditor };
export type { EditableExercise };
