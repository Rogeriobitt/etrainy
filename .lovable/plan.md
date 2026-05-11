# Bloquear rotas de personal para alunos

## Situação atual
A interface do aluno **não expõe** acesso a IA — verificado em `StudentDashboard`, `MyWorkout`, `WorkoutAdapt`, `Profile`, `Navbar`. A rota antiga `/assistente/treino` já é placeholder bloqueado. Nenhuma chamada a Lovable AI existe no projeto hoje.

**Porém**, as rotas destinadas ao personal não validam o papel do usuário. Um aluno logado que digite manualmente `/assistente/treino/personal`, `/dashboard/personal`, `/personal/alunos` ou `/personal/pendencias` consegue carregar a tela.

## Solução
Criar um componente `PersonalRoute` que valida se o usuário logado tem registro em `personal_trainers`. Se não tiver, redireciona para `/dashboard/aluno`.

## Mudanças

**Novo: `src/components/PersonalRoute.tsx`**
- Wrapper que usa `useAuth` + consulta `personal_trainers` por `user_id`.
- Enquanto carrega: spinner.
- Se não houver registro: `<Navigate to="/dashboard/aluno" replace />`.
- Se houver: renderiza `children`.

**`src/App.tsx`**
- Envolver com `<PersonalRoute>` as rotas:
  - `/dashboard/personal`
  - `/assistente/treino/personal`
  - `/personal/alunos`
  - `/personal/alunos/:studentId`
  - `/personal/pendencias`

## Resultado
Aluno não consegue acessar nenhuma tela de personal — incluindo a "Criar Série com IA" — nem por URL direta. Personal continua funcionando normalmente.

## Não muda
- Nenhum banco/migração.
- StudentDashboard e fluxo do aluno seguem iguais.
- A tela `/assistente/treino` continua como placeholder informativo para o aluno.
