import { supabase } from "@/integrations/supabase/client";

type ProfileUpdates = Record<string, unknown>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Persists profile data after signup. Robust against:
 * - The handle_new_user trigger creating the row asynchronously
 * - The auth session not being ready yet (RLS would silently drop UPDATE)
 * - Transient errors
 *
 * Verifies the write actually landed by re-selecting the row.
 */
export const persistProfileAfterSignup = async (
  userId: string,
  updates: ProfileUpdates
) => {
  // 1. Wait for an authenticated session matching this user.
  // RLS on profiles requires auth.uid() = user_id, so without a session the UPDATE silently affects 0 rows.
  for (let i = 0; i < 10; i += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.id === userId) break;
    await wait(200);
  }

  // 2. Try update first (the handle_new_user trigger usually created the row already).
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing, error: selectError } = await supabase
      .from("profiles")
      .select("id, personal_trainer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) {
      lastError = selectError;
    } else if (existing?.id) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (!updateError) {
        const criticalFields = ["personal_trainer_id", "full_name"].filter(
          (f) => f in updates && (updates as any)[f]
        );
        if (criticalFields.length > 0) {
          const { data: verify } = await supabase
            .from("profiles")
            .select(criticalFields.join(", "))
            .eq("user_id", userId)
            .maybeSingle();
          const ok = criticalFields.every(
            (f) => (verify as any)?.[f] === (updates as any)[f]
          );
          if (ok) return;
          lastError = new Error("Campos críticos não persistidos (RLS ou sessão).");
        } else {
          return;
        }
      } else {
        lastError = updateError;
      }
    } else {
      // Row not yet created by trigger — try to insert it ourselves.
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: userId, ...updates });
      if (!insertError) return;
      lastError = insertError;
    }

    await wait(300 * (attempt + 1));
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao salvar perfil após cadastro.");
};
