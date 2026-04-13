import { useState, useRef, useEffect } from "react";
import { Trash2, Dumbbell, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface ExerciseEditorProps {
  exercise: EditableExercise;
  exerciseId: string;
  dayId: string;
  onUpdate: (dayId: string, exerciseId: string, field: string, value: string) => void;
  onRemove: (dayId: string, exerciseId: string) => void;
}

const ExerciseEditor = ({ exercise, exerciseId, dayId, onUpdate, onRemove }: ExerciseEditorProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; short_description: string | null }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchExercises = async (query: string) => {
    setSearchQuery(query);
    onUpdate(dayId, exerciseId, "exercise_name", query);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const { data } = await supabase
      .from("exercises")
      .select("name, short_description")
      .ilike("name", `%${query}%`)
      .limit(8);
    setSuggestions(data || []);
    setShowSuggestions(true);
  };

  const selectSuggestion = (name: string) => {
    onUpdate(dayId, exerciseId, "exercise_name", name);
    setSearchQuery(name);
    setShowSuggestions(false);
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
          {exercise.image_url ? (
            <img src={exercise.image_url} alt={exercise.exercise_name} className="w-full h-full object-cover" />
          ) : (
            <Dumbbell className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-2">
          {/* Exercise name with autocomplete */}
          <div className="relative" ref={wrapperRef}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={exercise.exercise_name}
                onChange={(e) => searchExercises(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Buscar ou digitar exercício"
                className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex flex-col"
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.short_description && (
                      <span className="text-xs text-muted-foreground">{s.short_description}</span>
                    )}
                  </button>
                ))}
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
