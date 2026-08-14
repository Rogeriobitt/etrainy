import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_exercises",
  title: "Search exercise catalog",
  description:
    "Search TrainyLab's exercise catalog by name, muscle group, equipment or level. Useful to pick exercises when planning or adapting a workout.",
  inputSchema: {
    query: z.string().trim().optional().describe("Text to match against the exercise name."),
    muscle_group: z.string().trim().optional().describe("Muscle group filter, e.g. 'peito'."),
    equipment_type: z.string().trim().optional().describe("Equipment filter, e.g. 'academia' or 'casa'."),
    level: z.string().trim().optional().describe("Suggested level filter, e.g. 'iniciante'."),
    limit: z.number().int().min(1).max(100).optional().describe("Max results (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, muscle_group, equipment_type, level, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("exercises")
      .select("id, name, muscle_group, equipment_type, suggested_level, short_description, image_url")
      .order("name")
      .limit(limit ?? 25);
    if (query) q = q.ilike("name", `%${query}%`);
    if (muscle_group) q = q.ilike("muscle_group", muscle_group);
    if (equipment_type) q = q.ilike("equipment_type", equipment_type);
    if (level) q = q.ilike("suggested_level", level);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const payload = { count: data?.length ?? 0, items: data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
