## Correções de segurança

Três problemas detectados pelo scanner. Sugestão de correção para cada um:

### 1. `accept_invitation` aceita tokens já usados (warn)
A função RPC não verifica se o convite ainda está `pending`, permitindo que um segundo usuário autenticado reutilize um link já consumido e se vincule ao mesmo personal.

**Correção:** migration que recria a função com filtro `AND status = 'pending'` no SELECT e `RAISE EXCEPTION` se não encontrar.

### 2. Edge function `check-workout-expiry` sem autenticação (warn)
A função usa a service role key (bypass de RLS) e está aberta a qualquer chamador externo que conheça a URL.

**Correção:**
- Adicionar verificação de header `x-cron-secret` no topo do handler.
- Criar secret `CRON_SECRET` no backend (vou solicitar via `add_secret` — você cola um valor aleatório forte).
- Atualizar o agendamento (pg_cron/pg_net) para enviar esse header. Se o cron foi criado por mim antes, recrio a chamada incluindo o header.

### 3. `video_classes` — qualquer usuário autenticado pode escrever (error)
As policies de INSERT/UPDATE/DELETE estão como `auth.uid() = created_by`, sem restrição de admin. Pelo modelo do app, só admin gerencia vídeos.

**Correção:** migration que substitui as policies de escrita por `has_role(auth.uid(), 'admin')`. SELECT continua liberado para autenticados.

---

### Plano de execução
1. Migration única com:
   - `CREATE OR REPLACE FUNCTION public.accept_invitation` com checagem de status.
   - `DROP POLICY` + `CREATE POLICY` para INSERT/UPDATE/DELETE de `video_classes` exigindo `has_role(..., 'admin')`.
2. Solicitar secret `CRON_SECRET`.
3. Editar `supabase/functions/check-workout-expiry/index.ts` para validar o header e fazer redeploy.
4. Atualizar a chamada do cron (se existir) para enviar `x-cron-secret`.

Posso seguir?