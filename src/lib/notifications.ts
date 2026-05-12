import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || null,
    read: false,
  });
  if (error) console.error("Error creating notification:", error);
}

export async function notifyPersonalSerieGerada(
  personalUserId: string,
  alunoName: string,
  alunoUserId: string
) {
  await createNotification({
    userId: personalUserId,
    type: "serie_gerada_aluno",
    title: "Novo plano de treino criado pela assistente",
    message: `O aluno ${alunoName} gerou uma nova série com a assistente de IA. Revise e ajuste se necessário.`,
    link: `/personal/alunos/${alunoUserId}`,
  });
}

export async function notifyPersonalSerieEvoluida(
  personalUserId: string,
  alunoName: string,
  alunoUserId: string
) {
  await createNotification({
    userId: personalUserId,
    type: "serie_evoluida_aluno",
    title: "Série do aluno atualizada",
    message: `O aluno ${alunoName} pediu evolução da série. Uma nova versão foi criada e está aguardando sua revisão.`,
    link: `/personal/alunos/${alunoUserId}`,
  });
}

export async function notifyAlunoSerieAprovada(
  alunoUserId: string,
  personalName: string
) {
  await createNotification({
    userId: alunoUserId,
    type: "serie_aprovada_personal",
    title: "Seu personal aprovou sua série",
    message: `Seu personal ${personalName} revisou e aprovou sua série de treino. Já pode treinar com essa versão.`,
    link: "/treinos/minha-serie",
  });
}

export async function notifyAlunoSerieEditada(
  alunoUserId: string,
  personalName: string
) {
  await createNotification({
    userId: alunoUserId,
    type: "serie_editada_personal",
    title: "Seu personal fez ajustes no seu treino",
    message: `Seu personal ${personalName} ajustou alguns exercícios ou observações na sua série.`,
    link: "/treinos/minha-serie",
  });
}

export async function notifySeriePrestesAVencerAluno(
  alunoUserId: string,
  diasRestantes: number
) {
  await createNotification({
    userId: alunoUserId,
    type: "serie_prestes_a_vencer",
    title: "Sua série está prestes a vencer",
    message: `Sua série de treino vence em ${diasRestantes} dia(s). Em breve seu personal vai criar uma nova série para você.`,
    link: "/treinos/minha-serie",
  });
}

export async function notifySeriePrestesAVencerPersonal(
  personalUserId: string,
  alunoName: string,
  alunoUserId: string,
  diasRestantes: number
) {
  await createNotification({
    userId: personalUserId,
    type: "serie_prestes_a_vencer_aluno",
    title: "Série de aluno prestes a vencer",
    message: `A série do aluno ${alunoName} vence em ${diasRestantes} dia(s). Hora de planejar a próxima.`,
    link: `/personal/alunos/${alunoUserId}`,
  });
}

export async function notifySerieVencidaAluno(alunoUserId: string) {
  await createNotification({
    userId: alunoUserId,
    type: "serie_vencida",
    title: "Sua série venceu",
    message: "Sua série de treino chegou ao fim. Aguarde seu personal criar uma nova série atualizada.",
    link: "/treinos/minha-serie",
  });
}

export async function notifySerieVencidaPersonal(
  personalUserId: string,
  alunoName: string,
  alunoUserId: string
) {
  await createNotification({
    userId: personalUserId,
    type: "serie_vencida_aluno",
    title: "Série de aluno venceu",
    message: `A série do aluno ${alunoName} venceu hoje. Crie uma nova série para manter a evolução.`,
    link: `/personal/alunos/${alunoUserId}`,
  });
}
