## Problema
O nome do aluno não aparece na lista "Meus Alunos" do personal, mesmo o aluno tendo se cadastrado pelo link de convite.

## Causa
O fluxo já salva `profiles.full_name = invitation.student_name` no cadastro novo, mas:
1. **Alunos antigos** (cadastrados antes da correção do fluxo) ficaram com `full_name = NULL` no `profiles`, então a lista mostra apenas "Aluno".
2. Em casos onde o trigger `handle_new_user` rodou antes da sessão estar pronta, o `UPDATE` em `profiles` pode ter sido bloqueado pela RLS e o nome não foi gravado — mas o convite (`student_invitations.student_name`) e o e-mail do aluno (`profiles.email` ou `auth.users.email`) **sempre** existem.

## Solução (sem novo cadastro)

### 1. Backfill dos alunos já vinculados
Atualizar `profiles.full_name` para todos os alunos vinculados a um personal cujo `full_name` está vazio, copiando o `student_name` do convite usado correspondente (match por `personal_trainer_id` + e-mail).

```sql
UPDATE public.profiles p
SET full_name = si.student_name
FROM public.student_invitations si
WHERE p.full_name IS NULL
  AND p.personal_trainer_id IS NOT NULL
  AND p.personal_trainer_id = si.personal_trainer_id
  AND lower(p.email) = lower(si.student_email);
```

### 2. Reforçar a exibição na lista "Meus Alunos"
Em `src/pages/PersonalStudents.tsx`, quando o `profiles.full_name` estiver vazio, fazer fallback buscando o `student_name` do `student_invitations` (mesma `personal_trainer_id` + `student_email = profiles.email`) e exibir esse nome.

Isso garante que mesmo se o `UPDATE` do perfil falhar em algum cadastro futuro, o personal sempre verá o nome que ele mesmo digitou ao convidar.

### 3. Garantir gravação do nome em novos cadastros
Em `StudentInviteSignup.tsx`, o `persistProfileAfterSignup` já tenta o `UPDATE` várias vezes. Adicionar verificação extra de que `full_name` foi persistido (igual ao que já é feito para `personal_trainer_id`) para falhar de forma visível em vez de silenciosa.

## Resultado
- Alunos já cadastrados aparecem com nome imediatamente.
- Novos alunos sempre aparecem com nome (via gravação ou fallback no convite).
- Nenhum aluno precisa refazer cadastro.