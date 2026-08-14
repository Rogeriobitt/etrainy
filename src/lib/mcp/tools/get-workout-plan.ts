import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_workout_plan",
  title: "Get workout plan",
  description:
    "Return a full workout plan with its training days and exercises (sets, reps, notes). Defaults to the signed-in user's active plan; a personal trainer can pass a student's user id, or any accessible plan id.",
  inputSchema: {
    student_user_id: z
      .string()
      .uuid()
      .optional()
      .describe("User id of a student. Trainers only; omit to read your own plan."),
    plan_id: z.string().uuid().optional().describe("Specific workout plan id."),
    status: z
      .string()
      .optional()
      .describe("Filter by plan status, e.g. 'ativa' or 'aguardando_revisao_personal'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ student_user_id, plan_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("workout_plans")
      .select(
        "id, user_id, status, objective, division, level, days_per_week, training_location, validity_months, expires_at, created_at, updated_at, workout_days(id, name, muscle_groups, sort_order, workout_exercises(id, exercise_name, sets, reps, notes, image_url, sort_order))"
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (plan_id) query = query.eq("id", plan_id);
    else query = query.eq("user_id", student_user_id ?? ctx.getUserId()!);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "No workout plan found (or you don't have access to it)." }],
        isError: true,
      };
    }

    const plan = {
      ...data,
      workout_days: [...(data.workout_days ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((day) => ({
          ...day,
          workout_exercises: [...(day.workout_exercises ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order
          ),
        })),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(plan, null, 2) }],
      structuredContent: { plan },
    };
  },
});
