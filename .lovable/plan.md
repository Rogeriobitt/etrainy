# Limpeza total: contas e dados de professores/alunos

Reset completo do sistema para começar do zero, preservando admins e o conteúdo de catálogo.

## O que será apagado

Migration SQL única que executa `DELETE` na ordem correta (das tabelas-folha para as raízes), preservando apenas usuários com role `admin`:

1. `workout_exercises`
2. `workout_days`
3. `workout_plans`
4. `progress_entries`
5. `bioimpedance_uploads` + arquivos do bucket `bioimpedance` (via `storage.objects`)
6. `student_invitations`
7. `notifications`
8. `personal_trainers`
9. `profiles` (exceto admins)
10. `user_roles` (exceto role `admin`)
11. `auth.users` (exceto admins) — remove os logins definitivamente

Reset da sequência: `ALTER SEQUENCE personal_code_seq RESTART WITH 1` para que o próximo professor cadastrado receba `PT-1`.

## O que será preservado

- Contas com role `admin` (login, perfil e role mantidos)
- Catálogo `exercises` e `exercise_equivalents`
- `video_classes` e buckets `class-videos`, `class-thumbnails`, `avatars`
- Estrutura do banco, RLS, funções e triggers

## Detalhes técnicos

A migration usa um CTE para identificar admins e excluir todo o resto:

```sql
WITH admins AS (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
)
DELETE FROM public.workout_exercises;
DELETE FROM public.workout_days;
DELETE FROM public.workout_plans;
DELETE FROM public.progress_entries;
DELETE FROM public.bioimpedance_uploads;
DELETE FROM storage.objects WHERE bucket_id = 'bioimpedance';
DELETE FROM public.student_invitations;
DELETE FROM public.notifications;
DELETE FROM public.personal_trainers;
DELETE FROM public.profiles
  WHERE user_id NOT IN (SELECT user_id FROM admins);
DELETE FROM public.user_roles WHERE role <> 'admin';
DELETE FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM admins);
ALTER SEQUENCE public.personal_code_seq RESTART WITH 1;
```

## Verificação pós-execução

Consulta de confirmação:
```sql
SELECT
  (SELECT count(*) FROM auth.users)            AS usuarios,
  (SELECT count(*) FROM public.profiles)        AS perfis,
  (SELECT count(*) FROM public.personal_trainers) AS professores,
  (SELECT count(*) FROM public.workout_plans)  AS planos;
```
Esperado: apenas a contagem de admins em `usuarios` e `perfis`; zero nas demais.

## Aviso

Ação **irreversível**. Após aprovar, todos os professores e alunos atuais perdem acesso e seus dados (treinos, progresso, bioimpedância, convites, notificações) são apagados permanentemente.
