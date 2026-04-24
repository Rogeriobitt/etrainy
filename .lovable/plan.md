
Vou conviver os dois fluxos: manter o convite individual por token (já existente) e adicionar um link genérico reutilizável que o professor pode divulgar publicamente.

## O que vou fazer (apenas frontend, sem mudanças no banco)

A coluna `personal_trainer_id` já existe em `profiles`, então **nenhuma migração SQL é necessária**. O vínculo já é permanente porque a coluna só é gravada no signup; nada no app sobrescreve depois.

### 1. Nova rota `/cadastro/aluno` (refatorar página existente `StudentSignup`)
- Hoje a página `/cadastro/aluno` já existe e é o cadastro completo de 5 passos. Vou adaptá-la para:
  - Ler o parâmetro `?ref=ID_DO_PROFESSOR` da URL (UUID do `personal_trainers.id`)
  - Validar via Supabase que esse ID existe (consulta em `personal_trainers`); se inválido, mostrar aviso mas deixar o cadastro seguir como aluno sem professor
  - Quando vier `ref`, mostrar no topo "Você foi convidado pelo professor [Nome]" e **pular o step 4** (que pergunta "tem personal? código?"), porque o vínculo já vem da URL
  - No `handleSubmit`, gravar `personal_trainer_id = ref` e `has_personal = true` no `profiles`
  - Redirecionar para `/dashboard/aluno` (já é o comportamento atual)

### 2. Dashboard do professor (`PersonalDashboard`)
- Adicionar uma seção **"Convidar alunos"** acima do botão "Adicionar aluno", contendo:
  - O link genérico montado: `${origin}/cadastro/aluno?ref=${personal.id}`
  - Botão **"Copiar link"** com feedback visual (ícone Check) — mesmo padrão do `handleCopy` que já existe
  - Texto curto explicando: "Compartilhe este link. Quem se cadastrar por ele será automaticamente vinculado a você."
- Manter o botão "Adicionar aluno" (token individual) como opção alternativa.

### 3. Lista de alunos (`PersonalStudents`)
- Já existe e já mostra nome/objetivo/nível. Vou **adicionar o e-mail** de cada aluno na linha (você pediu "nome e e-mail").
- Problema: `profiles` não tem `email` — o email mora em `auth.users`, que não é acessível pelo client. Solução: já que o aluno foi criado pelo nosso fluxo, o email está disponível no momento do signup; vou gravar o email num campo opcional do profile? **Não** — em vez disso, vou puxar o email do `auth.users` apenas para o próprio usuário não funciona aqui. A alternativa limpa é **adicionar a coluna `email` em `profiles`** e popular no signup.

### Migração SQL necessária (mínima)
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
```
Sem RLS nova (já existe a policy "Personals can view student profiles" que cobre o acesso).

## Resumo de arquivos alterados
- `src/pages/StudentSignup.tsx` — ler `?ref=`, validar professor, pular step 4 quando vier ref, gravar vínculo + email no submit
- `src/pages/PersonalDashboard.tsx` — adicionar seção "Convidar alunos" com link genérico + copiar
- `src/pages/PersonalStudents.tsx` — exibir email na lista
- Migração: adicionar coluna `email` em `profiles`
- `StudentInviteSignup.tsx` (fluxo do token) — também passa a gravar o email para consistência

Sem novas tabelas. Vínculo permanece imutável (nenhuma tela do aluno permite editar `personal_trainer_id`).
