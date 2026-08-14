import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my profile",
  description:
    "Return the signed-in user's TrainyLab profile: name, goal, level, biometrics, and whether they are a student with a personal trainer or a trainer themselves.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "full_name, email, sex, birth_date, height, weight, goal, experience_level, training_days, training_location, has_injury, injury_description, has_personal, personal_trainer_id"
      )
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const { data: trainer } = await supabase
      .from("personal_trainers")
      .select("id, full_name, personal_code")
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();

    const payload = { profile, is_personal_trainer: !!trainer, trainer_profile: trainer ?? null };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
