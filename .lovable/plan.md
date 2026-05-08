## Verificação geral do fluxo: Personal → Convite → Aluno → Dashboard

Fiz uma auditoria das três etapas e encontrei **um bug que explica o "Convite inválido"** e algumas melhorias no fluxo. Abaixo o que precisa ser corrigido.

---

### 1. Cadastro do Personal/Professor (`/cadastro/personal`)

**Status:** funcionando.
- Cria conta no auth, gera `personal_code` (ex.: `PT-10001`) via `nextval_personal_code()`, insere em `personal_trainers`, atualiza `profiles.full_name` e redireciona para `/dashboard/personal`.
- Único ponto a melhorar: o trigger `handle_new_user` cria `profiles` com `role = 'user'` mesmo para personals. Não bloqueia nada hoje (nós distinguimos pelo registro em `personal_trainers`), mas vale documentar.

---

### 2. Convite do Personal para o Aluno — **AQUI está o bug**

Existem **dois caminhos** de convite e os dois têm problemas:

**A) Convite individual (`AddStudentModal` → `/convite/:token`)** — é o que dá "**Link inválido**".

A página `StudentInviteSignup.tsx` faz:
```ts
.from("student_invitations")
.select("*, personal_trainers(full_name, id)")
.eq("token", token)
.eq("status", "pending")
```

Dois problemas combinados:
1. A tabela `student_invitations` **não tem foreign key** declarada para `personal_trainers`, então o embed `personal_trainers(...)` falha no PostgREST (relationship not found) e a consulta retorna erro → o código cai em `setInvalid(true)`.
2. Mesmo se a FK existisse, a página é acessada por usuário **anônimo** (ainda sem login), e a RLS de `personal_trainers` só permite SELECT para `authenticated` — o nome do professor não apareceria.

**Correções:**
- Criar a FK `student_invitations.personal_trainer_id → personal_trainers(id)` (com índice).
- Remover o embed: buscar primeiro o convite pelo token, depois — se precisar do nome — buscar via uma view/RPC pública segura. Mais simples: armazenar `personal_name` direto em `student_invitations` no momento da criação (já temos `personalName` no `AddStudentModal`), evitando consulta cruzada antes do login.
- Ajustar `StudentInviteSignup.tsx` para usar essa coluna nova em vez do embed.

**B) Link genérico do dashboard (`/cadastro/aluno?ref={personal.id}`)** — funciona, mas:
- Em `StudentSignup.tsx` ele consulta `personal_trainers` por `id` ainda como anônimo — pelo mesmo motivo de RLS, o nome do professor não aparece (cai em `refInvalid`).
- Solução: criar uma RPC `get_personal_public_info(id)` SECURITY DEFINER que retorna apenas `{ id, full_name, personal_code }`, ou uma view pública que exponha só esses 3 campos. Usar isso tanto no `?ref=` quanto na busca por `personal_code`.

---

### 3. Vinculação aluno ↔ personal e visibilidade no dashboard

**Status:** o mecanismo está correto, mas depende do passo 2 funcionar.

- Após a correção, `StudentInviteSignup` grava `profiles.personal_trainer_id = invitation.personal_trainer_id` e `has_personal = true` via `persistProfileAfterSignup` (que já tem retry + verificação).
- A RLS "Personals can view student profiles" filtra `profiles` por `personal_trainer_id IN (SELECT id FROM personal_trainers WHERE user_id = auth.uid())` — correto.
- O `PersonalDashboard` e `PersonalStudents` já listam por esse mesmo critério.

Verificações extras a fazer após a correção:
- Marcar o convite como `used` (já é feito).
- Garantir que o aluno apareça em `/personal/alunos` imediatamente (basta invalidar a query `student-count` / `personal-students` — não é crítico pois a próxima visita já busca atualizado).

---

### Detalhes técnicos das mudanças

**Migração SQL:**
```sql
-- 1. Coluna para guardar o nome do personal no momento do convite
ALTER TABLE public.student_invitations
  ADD COLUMN personal_name text;

-- 2. Foreign key + índice
ALTER TABLE public.student_invitations
  ADD CONSTRAINT student_invitations_personal_trainer_id_fkey
  FOREIGN KEY (personal_trainer_id) REFERENCES public.personal_trainers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_student_invitations_personal_trainer_id
  ON public.student_invitations(personal_trainer_id);

-- 3. RPC pública para buscar info mínima do personal (usada por aluno anônimo)
CREATE OR REPLACE FUNCTION public.get_personal_public_info(_personal_id uuid)
RETURNS TABLE(id uuid, full_name text, personal_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, full_name, personal_code
  FROM public.personal_trainers
  WHERE id = _personal_id
$$;

CREATE OR REPLACE FUNCTION public.get_personal_by_code(_code text)
RETURNS TABLE(id uuid, full_name text, personal_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, full_name, personal_code
  FROM public.personal_trainers
  WHERE personal_code = _code
$$;
```

**Arquivos a editar:**
- `src/components/AddStudentModal.tsx` — passar `personal_name: personalName` no insert do convite.
- `src/pages/StudentInviteSignup.tsx` — remover embed `personal_trainers(...)`; usar `invitation.personal_name` direto.
- `src/pages/StudentSignup.tsx` — substituir o `select` direto em `personal_trainers` pelas RPCs `get_personal_public_info` e `get_personal_by_code`.

Posso prosseguir com essas correções?