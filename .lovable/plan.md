# Remover acesso à IA de criação de série na conta do aluno

A IA de geração de treino deve ser exclusiva do professor. O aluno hoje pode criar série sozinho via `/assistente/treino`, e a UI dele tem múltiplos pontos de entrada para essa funcionalidade. O plano abaixo retira tudo isso do aluno e mantém o assistente apenas para o personal.

## Diagnóstico

A IA do aluno está acessível em três lugares (todos navegam para `/assistente/treino` → `WorkoutAssistant.tsx`):

1. `src/pages/StudentDashboard.tsx`
   - Card "Criar ou Atualizar com IA" no grid principal
   - Componente `ActivePlanCheck` que mostra um banner "Criar série com IA" quando o aluno não tem plano
2. `src/pages/MyWorkout.tsx`
   - Estado vazio "Você ainda não tem uma série ativa" com botão "Criar série com IA"
3. `src/pages/WorkoutAdapt.tsx` (linha ~333)
   - Botão "Criar série com a Assistente" no fluxo de adaptação de treino

A versão do professor (`/assistente/treino/personal` → `PersonalAssistant.tsx`) é separada e continua disponível normalmente no `PersonalDashboard` e no `PersonalStudentDetail`.

## Mudanças

### 1. Bloquear a rota do aluno

`src/pages/WorkoutAssistant.tsx`: trocar a tela por uma mensagem clara informando que a criação de série é feita pelo personal trainer, com CTA "Voltar ao Dashboard". Mantém o arquivo (rota continua existindo) mas remove o fluxo de geração de IA. Isso protege contra acesso direto via URL.

Alternativa mais agressiva: remover a rota `/assistente/treino` do `App.tsx`. Vou aplicar a versão "tela bloqueada" porque é mais amigável caso o aluno tenha o link salvo.

### 2. Limpar entradas no Dashboard do aluno

`src/pages/StudentDashboard.tsx`:
- Remover o card "Criar ou Atualizar com IA" do array `cards`
- Remover o componente `ActivePlanCheck` (e seu uso) — o aluno sem plano passa a ver uma mensagem "Aguarde seu personal preparar sua série" no lugar
- Adicionar um aviso simples quando o aluno não tem `personal_trainer_id`: instruí-lo a procurar um personal e usar o link de convite

### 3. Limpar entradas em "Minha Série"

`src/pages/MyWorkout.tsx` (linhas 268-276): substituir o estado vazio com botão "Criar série com IA" por uma mensagem neutra: "Seu personal ainda não criou sua série. Aguarde a aprovação." (sem CTA para IA).

### 4. Limpar fluxo de adaptação

`src/pages/WorkoutAdapt.tsx`: remover o botão "Criar série com a Assistente" (linha ~333) do estado vazio. Substituir por mensagem orientando o aluno a falar com o personal.

### 5. Não mexer no professor

- `PersonalDashboard.tsx`, `PersonalStudentDetail.tsx`, `PersonalAssistant.tsx` ficam como estão.
- A rota `/assistente/treino/personal` continua ativa.
- Edge functions de IA (se existirem) não precisam ser tocadas — apenas a UI do aluno deixa de invocá-las. O `PersonalAssistant` continua usando.

## O que NÃO muda

- Estrutura de tabelas, RLS e edge functions: nenhum DDL.
- Capacidade do aluno de visualizar sua série, marcar treinos concluídos, registrar progresso e bioimpedância.
- Fluxo de evolução automática dos 21 dias e a tela de adaptar treinos para casa (apenas o atalho "criar série" é removido — adaptação em si continua disponível quando há série ativa).

## Resumo dos arquivos editados

- `src/pages/WorkoutAssistant.tsx` — substituir conteúdo por tela de bloqueio
- `src/pages/StudentDashboard.tsx` — remover card de IA e `ActivePlanCheck`
- `src/pages/MyWorkout.tsx` — remover botão "Criar série com IA" do estado vazio
- `src/pages/WorkoutAdapt.tsx` — remover botão "Criar série com a Assistente" do estado vazio

Atualizar também a memória `mem://features/workout-assistant` para registrar que o assistente de IA é exclusivo do personal.
