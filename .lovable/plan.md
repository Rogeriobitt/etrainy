Vou corrigir o vínculo aluno-professor no cadastro por link de convite, mantendo o fluxo visual praticamente igual e sem recriar a estrutura principal do app.

## O que encontrei na varredura

- O professor gera dois tipos de link:
  - `/cadastro/aluno?ref=PERSONAL_TRAINER_ID` no dashboard do professor.
  - `/convite/:token` pelo modal “Adicionar aluno”.
- A lista do professor em `/personal/alunos` busca alunos por:
  ```ts
  supabase.from("profiles").select("*").eq("personal_trainer_id", personal.id)
  ```
- No banco atual, existem professores e alunos cadastrados, mas `profiles.personal_trainer_id` está vazio para todos os perfis. Por isso nenhum aluno aparece para o professor.
- A tabela `student_invitations` também está vazia no momento, então o cenário testado parece estar usando principalmente o link genérico `?ref=...`.
- A função utilitária atual tenta atualizar/inserir o perfil logo após o signup no cliente. Isso pode falhar em alguns casos por timing de autenticação/sessão ou RLS, deixando o perfil criado pelo gatilho do banco sem `personal_trainer_id`.

## Correção proposta

1. **Fortalecer a gravação do vínculo no cadastro**
   - Atualizar `src/lib/persistProfileAfterSignup.ts` para:
     - aguardar a sessão do usuário recém-criado estar disponível;
     - tentar `upsert`/update do perfil de forma mais confiável;
     - garantir que `personal_trainer_id`, `has_personal`, `email` e dados do aluno sejam persistidos;
     - lançar erro claro se o vínculo não for salvo.

2. **Corrigir o cadastro por link genérico `?ref=`**
   - Em `src/pages/StudentSignup.tsx`:
     - validar que `ref` aponta para um professor existente;
     - só finalizar cadastro vinculado se o `ref` for válido;
     - salvar `profiles.personal_trainer_id = refTrainerId`;
     - salvar `has_personal = true` e `email` do aluno.

3. **Corrigir o cadastro por convite individual `/convite/:token`**
   - Em `src/pages/StudentInviteSignup.tsx`:
     - usar diretamente o `personal_trainer_id` do convite como fonte principal;
     - persistir o vínculo no perfil do aluno antes de marcar o convite como usado;
     - só marcar o convite como usado depois que o perfil estiver realmente vinculado.

4. **Melhorar a listagem para mostrar e-mail corretamente**
   - Em `src/pages/PersonalStudents.tsx`:
     - manter a query principal por `profiles.personal_trainer_id`;
     - garantir que nome e e-mail gravados em `profiles` apareçam na lista.
   - Não vou mudar layout, apenas ajustar o necessário se houver algum tratamento que esconda dados.

5. **Verificação no banco e diagnóstico final**
   - Rodar queries de leitura para confirmar:
     - quantos perfis estão vinculados;
     - se a coluna `profiles.personal_trainer_id` recebeu o ID do professor;
     - se a query de `/personal/alunos` retorna os alunos esperados.

## Sem mudanças desnecessárias

- Não vou mudar o fluxo visual.
- Não vou criar FK nova em `workout_exercises` ou mexer em treinos.
- Não vou mudar a tela do professor além do mínimo necessário.
- O vínculo continuará sendo salvo em `profiles.personal_trainer_id`.

## Resumo técnico esperado ao final

Ao concluir, vou te informar:

- **Tabela/coluna do vínculo:** `profiles.personal_trainer_id`.
- **Problema encontrado:** o perfil do aluno estava sendo criado, mas o `personal_trainer_id` não estava sendo persistido de forma confiável após o cadastro.
- **Query final da listagem:**
  ```ts
  supabase
    .from("profiles")
    .select("*")
    .eq("personal_trainer_id", personal.id)
  ```

Também vou listar os componentes/arquivos alterados.