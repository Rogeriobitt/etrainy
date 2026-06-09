# Correção: série da IA não aparece para o aluno + edição completa pelo personal

## Diagnóstico

Após investigar o código e os dados:

**1. Por que o aluno não está vendo a série criada pela IA**

Quando o personal gera uma série pela IA, ela é criada com status `aguardando_revisao_personal` (linha 98 de `PersonalAssistant.tsx`). Isso é proposital: a série precisa ser revisada e aprovada pelo personal antes de ir para o aluno. Só vira `ativa` quando o personal clica em **"Aprovar série e enviar para o aluno"** dentro da tela do aluno (`PersonalStudentDetail.tsx`).

Confirmado no banco: o aluno em questão tem 2 séries — uma `ativa` (antiga) e uma `aguardando_revisao_personal` (nova, criada pela IA). O personal ainda não aprovou a nova.

**Bug real:** A tela "Minha Série" (`MyWorkout.tsx`) busca a série mais recente sem filtrar pelo status. Resultado: a série nova "aguardando revisão" sobrepõe a antiga "ativa", e o aluno vê uma série que ainda não foi liberada — ou vê um treino travado. O comportamento correto é o aluno continuar vendo a série ativa antiga até o personal aprovar a nova.

**2. Edição da série pelo personal**

A edição completa já existe na tela `PersonalStudentDetail.tsx` (`/personal/alunos/:studentId`), via componente `ExerciseEditor`:
- Trocar exercício (busca no catálogo + filtro por grupo muscular, ou digitar nome livre)
- Editar séries e repetições
- Adicionar exercício novo
- Remover exercício (botão lixeira)
- Adicionar observações
- Salvar alterações ou aprovar e enviar ao aluno

Após gerar a série com IA, o sistema já redireciona o personal direto para essa tela. O que pode estar faltando é deixar mais claro que ele **precisa aprovar** antes do aluno ver.

## Mudanças propostas

### 1. `src/pages/MyWorkout.tsx` — filtrar por status `ativa`
Trocar a query que busca o último plano para exigir `status = 'ativa'`. Assim, séries pendentes de revisão não substituem a série ativa atual do aluno.

```ts
.eq("user_id", user!.id)
.eq("status", "ativa")
.order("created_at", { ascending: false })
.limit(1)
```

Efeito: aluno continua vendo a série atual aprovada até o personal aprovar a nova. Se nunca teve série aprovada, vê o estado vazio (já existente).

### 2. `src/pages/PersonalStudentDetail.tsx` — banner de aviso quando há série pendente
Quando `plan.status === "aguardando_revisao_personal"`, exibir um banner amarelo no topo da tela:

> ⚠ Esta série ainda **não foi enviada ao aluno**. Revise os exercícios e clique em **"Aprovar série e enviar para o aluno"** quando estiver pronta.

Isso evita a confusão atual em que o personal acha que já enviou.

### 3. (Opcional, recomendado) Toast de confirmação após gerar com IA
Em `PersonalAssistant.tsx`, após o `navigate(...)`, mostrar um toast: *"Série criada! Revise os exercícios e clique em Aprovar para enviar ao aluno."*

## O que não muda

- A capacidade de editar (trocar exercício, mudar séries/reps, apagar, adicionar) já existe e continua funcionando exatamente como está em `ExerciseEditor` + `PersonalStudentDetail`.
- Validade da série, notificações e fluxo de aprovação permanecem iguais.
- Nenhuma mudança de banco de dados é necessária.

## Detalhes técnicos

- Arquivos editados: `src/pages/MyWorkout.tsx`, `src/pages/PersonalStudentDetail.tsx`, `src/pages/PersonalAssistant.tsx`.
- Sem migrations.
- Sem mudança em RLS (já permite o aluno ver suas próprias séries).
