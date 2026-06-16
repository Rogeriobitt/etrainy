## Liberar criação de série do ADM para ele mesmo

Hoje a tela "Criar Série" (`PersonalAssistant`) só lista alunos vinculados ao personal. Como o ADM não tem alunos, ele não consegue avançar. Vou liberar um modo "criar para mim mesmo" exclusivo para ADM.

### Mudanças

1. **`src/pages/PersonalAssistant.tsx`**
   - Detectar se o usuário é admin (`isAdmin` do `AuthContext`).
   - Se for admin, adicionar uma opção fixa no topo do select do Passo 0: **"Eu mesmo (Admin)"** com `value = user.id`.
   - Quando o admin selecionar a si mesmo:
     - Carregar o próprio `profiles` em vez do perfil do aluno.
     - No insert do `workout_plans`, gravar `user_id = user.id` e **omitir** `personal_trainer_id` (deixar `null`) com `status = 'ativa'` direto (admin não precisa de aprovação dele mesmo).
   - Toast e redirect: ir para `/treinos/minha-serie` em vez de `/personal/alunos/:id`.

2. **RLS — permitir admin inserir plano para si**
   - As políticas atuais de `workout_plans` para INSERT exigem `user_id = auth.uid()` (já existe) ou `personal_trainer_id ∈ personals do usuário`. A política "Users can insert their own workout plans" já cobre o caso `user_id = auth.uid()` quando `personal_trainer_id` é null. Validar isso e, se necessário, adicionar política explícita:
     ```
     CREATE POLICY "Admins can insert own plans"
       ON public.workout_plans FOR INSERT TO authenticated
       WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));
     ```
   - Mesmo princípio para `workout_days` e `workout_exercises` — as policies "Users can insert their own…" já permitem inserção quando o plan pertence a `auth.uid()`, então não precisa mexer.

3. **Acesso à rota**
   - Liberar `/assistente/treino/personal` também para admins (hoje `PersonalRoute` só deixa passar quem está em `personal_trainers`).
   - Atualizar `PersonalRoute` para aceitar admin OU personal trainer.

### Resultado

- Admin entra em "Criar Série", escolhe "Eu mesmo (Admin)", segue os 4 passos e a série fica salva no próprio perfil dele, já como `ativa`, visível em `/treinos/minha-serie`.
- Personals continuam funcionando exatamente como antes.
- Alunos comuns sem alteração.

### Detalhes técnicos

- Sem mudança de schema; só uma policy extra de garantia em `workout_plans`.
- Mudança restrita a 2 arquivos frontend (`PersonalAssistant.tsx`, `PersonalRoute.tsx`) + 1 migration mínima.
