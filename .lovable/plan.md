# Unificar o convite de aluno

## Problema
O dashboard do professor mostra **dois caminhos** de convite (modal "Adicionar aluno" + card "Convidar alunos" com link genérico). O link genérico (`/cadastro/aluno?ref=<id>`) está dando "Link de convite inválido" — provavelmente porque foi copiado antes da migração da RPC pública ou aponta para um id de personal que não existe mais. Além disso, o fluxo genérico de 5 etapas é confuso para um aluno que já foi convidado por nome.

## Solução
Manter apenas o **convite individual** (`/convite/<token>`), que já vem com nome e e-mail pré-preenchidos e é validado por token único.

## Mudanças

**`src/pages/PersonalDashboard.tsx`**
- Remover o card "CONVIDAR ALUNOS" (link genérico) e toda a lógica de `inviteLink` / `handleCopyLink` / `linkCopied`.
- Deixar só o botão "Adicionar aluno" como ponto de entrada para criar convites.

**`src/pages/StudentSignup.tsx`**
- Remover o suporte a `?ref=` (validação via RPC, banner de "convidado por", banner de "link inválido", lógica de pular etapa 4).
- Página continua funcionando para cadastros **espontâneos** sem vínculo a professor (entrada via página inicial / EntryModal).

**`src/App.tsx`**
- Sem mudança de rotas — `/cadastro/aluno` segue existindo para cadastro espontâneo, `/convite/:token` para convidados.

## Resultado
- Professor tem **um único** botão para convidar.
- Aluno convidado vai sempre para `/convite/<token>` → fluxo curto com dados pré-preenchidos e vínculo automático ao professor.
- Erro "Link inválido" deixa de existir nesse cenário porque não há mais o link genérico.

## Não muda
- Banco de dados (nenhuma migração).
- Cadastro espontâneo de aluno via página inicial.
- Fluxo `/convite/:token` (já funciona após a migração anterior).
