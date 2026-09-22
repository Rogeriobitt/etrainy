# Pacote técnico seguro do TrainyLab

## Objetivo
Reunir, em formato copiável, a estrutura e os principais arquivos do projeto para análise externa, sem expor dados secretos.

## Entrega
1. Mostrar uma árvore de pastas reduzida, destacando aplicação, páginas, componentes, integrações, funções e migrações.
2. Incluir o conteúdo do `package.json` e dos arquivos centrais de configuração e rotas.
3. Incluir os arquivos relevantes de autenticação e controle de acesso.
4. Incluir as páginas e componentes responsáveis pelos fluxos de aluno, professor e administrador.
5. Resumir os modelos/tabelas, funções do banco e regras de autorização a partir dos tipos e migrações; incluir os trechos essenciais quando o arquivo completo for muito extenso.
6. Incluir as funções de IA e a integração MCP, explicando brevemente a finalidade de cada arquivo.
7. Dividir o material em blocos numerados para evitar uma resposta única excessivamente longa e facilitar copiar cada parte.

## Proteção de informações
- Não incluir `.env`, credenciais, chaves, tokens, sessões ou valores secretos.
- Ocultar identificadores e URLs internos que possam revelar detalhes do ambiente.
- Não incluir dependências instaladas, arquivos compilados, imagens ou arquivos gerados automaticamente sem relevância para a análise.
- Antes de apresentar cada bloco, revisar o conteúdo para remover qualquer valor sensível que apareça dentro do código.

## Escopo técnico
A seleção abrangerá `package.json`, configurações do Vite/TypeScript/Tailwind, `src/App.tsx`, contexto de autenticação, proteção de rotas, páginas e componentes de negócio, tipos do banco, migrações e políticas, funções hospedadas, lógica do assistente de treino e servidor MCP.
