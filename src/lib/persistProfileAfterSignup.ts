import { supabase } from "@/integrations/supabase/client";

type ProfileUpdates = Record<string, unknown>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const persistProfileAfterSignup = async (userId: string, updates: ProfileUpdates) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existingProfile?.id) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (updateError) throw updateError;
      return;
    }

    await wait(250 * (attempt + 1));
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: userId,
    ...updates,
  });

  if (insertError) throw insertError;
};