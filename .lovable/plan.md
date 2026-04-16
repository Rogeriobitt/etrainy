
O usuário (Rogério Bittencourt) hoje é aluno e quer virar Personal Trainer para testar o app pelo lado do professor.

Pelos dados já consultados anteriormente, o `user_id` do Rogério existe em `profiles` mas não tem registro em `personal_trainers`. Preciso criar esse vínculo.

## O que vou fazer

Converter a conta **Rogério Bittencourt** em Personal Trainer inserindo um registro na tabela `personal_trainers` com:

- `user_id`: o user_id atual do Rogério
- `personal_code`: gerado automaticamente via `nextval_personal_code()` (formato `PT-XXXXX`)
- `full_name`: "Rogério Bittencourt" (copiado do profile)
- demais campos opcionais (cref, city, state, phone) ficam nulos — você pode completar depois em /profile

## Como a mudança afeta o login

A tela `/auth` já redireciona automaticamente: se existe registro em `personal_trainers` para o `user_id` logado → vai para `/dashboard/personal`; senão → `/dashboard/aluno`.

Então, após criar o registro:
1. Você faz **logout** e **login novamente** com a mesma conta
2. Será redirecionado direto para `/dashboard/personal`
3. Terá acesso a todas as telas do professor: gestão de alunos, convites, edição de séries, etc.

## Importante

- Você **não perde** seu profile de aluno — os dados continuam lá. Apenas ganha o papel de personal em paralelo.
- Como hoje o redirect prioriza personal, sua conta passa a abrir como professor por padrão.
- Se quiser voltar a ver como aluno depois, posso (a) remover o registro de personal, ou (b) criar uma tela de alternância de papéis. Avise se quiser uma dessas opções no futuro.

## Passos técnicos

1. Rodar um `INSERT` em `personal_trainers` via ferramenta de inserção de dados, usando o `user_id` do Rogério já identificado e `nextval_personal_code()` para o código.
2. Confirmar com você que deu certo e te orientar a deslogar/logar.

Nenhuma mudança de código ou schema é necessária.
