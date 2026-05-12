# Validade da série de treino

Sim, é totalmente possível. Plano abaixo.

## O que muda para o usuário

- Toda série criada (pela IA ou manual pelo personal) passa a ter uma **data de validade**.
- Padrão: **30 dias** a partir da criação/aprovação.
- Na hora de criar/aprovar a série, o personal escolhe entre **1 mês**, **2 meses** ou **3 meses** (1 mês selecionado por padrão).
- Avisos automáticos:
  - **7 dias antes** de vencer: notifica aluno e personal ("Série prestes a vencer, hora de renovar").
  - **No vencimento**: notifica aluno e personal ("Série vencida, criar nova série").
- Na tela do aluno (Minha Série) e na tela do personal (detalhe do aluno), exibir badge com **"Vence em X dias"** ou **"Vencida"**.

## Mudanças técnicas

### Banco
- `workout_plans`: adicionar colunas
  - `validity_months` int (1, 2 ou 3 — default 1)
  - `expires_at` timestamptz (calculada na criação/aprovação)
  - `expiry_warning_sent_at` timestamptz (para não duplicar notificação de aviso)
  - `expired_notified_at` timestamptz (para não duplicar notificação de vencimento)
- Índice em `expires_at` para o cron.

### Cron diário (edge function + pg_cron)
- Nova edge function `check-workout-expiry`:
  - Busca planos `status = 'ativa'`, `expires_at` entre hoje e hoje+7 dias e `expiry_warning_sent_at IS NULL` → cria 2 notificações (aluno + personal) e marca timestamp.
  - Busca planos `status = 'ativa'`, `expires_at <= now()` e `expired_notified_at IS NULL` → cria 2 notificações de vencimento e marca timestamp.
- Agendamento via `pg_cron` rodando 1x ao dia.

### Frontend
- **PersonalStudentDetail.tsx** e **WorkoutAssistant/PersonalAssistant**: ao aprovar/criar a série, seletor (1/2/3 meses) e gravar `validity_months` + calcular `expires_at`.
- **MyWorkout.tsx** (aluno) e **PersonalStudentDetail.tsx** (personal): badge "Vence em X dias" / "Vencida hoje" / "Vencida há X dias".
- **lib/notifications.ts**: helpers `notifySeriePrestesAVencer` e `notifySerieVencida` (aluno e personal).

## Fora de escopo
- Renovação automática da série (continua manual: o personal cria nova série quando vencer).
- Bloquear o aluno de treinar com série vencida (apenas aviso visual).

Confirma assim que quiser que eu implemente.
