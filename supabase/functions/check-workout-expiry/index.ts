// Daily cron: checks workout plans nearing expiry or already expired
// and creates notifications for student + personal trainer.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const result = { warnings: 0, expired: 0 };

  try {
    // 1) Plans about to expire (next 7 days), warning not sent yet
    const { data: warningPlans, error: warnErr } = await supabase
      .from("workout_plans")
      .select("id, user_id, personal_trainer_id, expires_at")
      .eq("status", "ativa")
      .is("expiry_warning_sent_at", null)
      .gte("expires_at", now.toISOString())
      .lte("expires_at", in7days.toISOString());
    if (warnErr) throw warnErr;

    for (const p of warningPlans ?? []) {
      const daysLeft = Math.max(
        0,
        Math.ceil((new Date(p.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Aluno notification
      await supabase.from("notifications").insert({
        user_id: p.user_id,
        type: "serie_prestes_a_vencer",
        title: "Sua série está prestes a vencer",
        message: `Sua série de treino vence em ${daysLeft} dia(s). Em breve seu personal vai criar uma nova série para você.`,
        link: "/treinos/minha-serie",
        read: false,
      });

      // Personal notification
      if (p.personal_trainer_id) {
        const { data: pt } = await supabase
          .from("personal_trainers")
          .select("user_id")
          .eq("id", p.personal_trainer_id)
          .maybeSingle();
        const { data: aluno } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", p.user_id)
          .maybeSingle();

        if (pt?.user_id) {
          await supabase.from("notifications").insert({
            user_id: pt.user_id,
            type: "serie_prestes_a_vencer_aluno",
            title: "Série de aluno prestes a vencer",
            message: `A série do aluno ${aluno?.full_name || "—"} vence em ${daysLeft} dia(s). Hora de planejar a próxima.`,
            link: `/personal/alunos/${p.user_id}`,
            read: false,
          });
        }
      }

      await supabase
        .from("workout_plans")
        .update({ expiry_warning_sent_at: now.toISOString() })
        .eq("id", p.id);

      result.warnings++;
    }

    // 2) Plans already expired, expired_notified_at not set yet
    const { data: expiredPlans, error: expErr } = await supabase
      .from("workout_plans")
      .select("id, user_id, personal_trainer_id")
      .eq("status", "ativa")
      .is("expired_notified_at", null)
      .lte("expires_at", now.toISOString());
    if (expErr) throw expErr;

    for (const p of expiredPlans ?? []) {
      await supabase.from("notifications").insert({
        user_id: p.user_id,
        type: "serie_vencida",
        title: "Sua série venceu",
        message:
          "Sua série de treino chegou ao fim. Aguarde seu personal criar uma nova série atualizada.",
        link: "/treinos/minha-serie",
        read: false,
      });

      if (p.personal_trainer_id) {
        const { data: pt } = await supabase
          .from("personal_trainers")
          .select("user_id")
          .eq("id", p.personal_trainer_id)
          .maybeSingle();
        const { data: aluno } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", p.user_id)
          .maybeSingle();

        if (pt?.user_id) {
          await supabase.from("notifications").insert({
            user_id: pt.user_id,
            type: "serie_vencida_aluno",
            title: "Série de aluno venceu",
            message: `A série do aluno ${aluno?.full_name || "—"} venceu hoje. Crie uma nova série para manter a evolução.`,
            link: `/personal/alunos/${p.user_id}`,
            read: false,
          });
        }
      }

      await supabase
        .from("workout_plans")
        .update({ expired_notified_at: now.toISOString() })
        .eq("id", p.id);

      result.expired++;
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-workout-expiry error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
