import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a map of exercise name (lowercased, trimmed) -> image_url
 * from the central exercises catalog. Used to render thumbnails in
 * both student and personal workout views.
 */
export function useExerciseImages() {
  return useQuery({
    queryKey: ["exercise-image-map"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("name, image_url")
        .not("image_url", "is", null);
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach((e: any) => {
        if (e.image_url) map.set(e.name.toLowerCase().trim(), e.image_url);
      });
      return map;
    },
  });
}

export function lookupExerciseImage(
  map: Map<string, string> | undefined,
  name: string,
  override?: string | null
): string | null {
  if (override) return override;
  if (!map) return null;
  return map.get(name.toLowerCase().trim()) || null;
}
