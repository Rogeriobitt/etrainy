import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_students",
  title: "List my students",
  description:
    "For a signed-in personal trainer: list the students linked to them, with name, email, goal, level and their current workout plan status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: trainer, error: trainerError } = await supabase
      .from("personal_trainers")
      .select("id")
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (trainerError) return { content: [{ type: "text", text: trainerError.message }], isError: true };
    if (!trainer) {
      return {
        content: [{ type: "text", text: "This account is not a personal trainer, so it has no students." }],
        isError: true,
      };
    }

    const { data: students, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, goal, experience_level, training_location, created_at")
      .eq("personal_trainer_id", trainer.id)
      .order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const ids = (students ?? []).map((s) => s.user_id);
    const plans = ids.length
      ? (
          await supabase
            .from("workout_plans")
            .select("user_id, id, status, division, expires_at, created_at")
            .in("user_id", ids)
            .order("created_at", { ascending: false })
        ).data ?? []
      : [];

    const items = (students ?? []).map((s) => ({
      ...s,
      latest_plan: plans.find((p) => p.user_id === s.user_id) ?? null,
    }));
    const payload = { count: items.length, items };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
