# Conectar o TrainyLab ao GitHub

## Passo a passo
1. No projeto TrainyLab aberto no Lovable, clique no botão **+** ao lado da caixa de mensagem.
2. Selecione **GitHub** e depois **Conectar projeto**.
3. Autorize o aplicativo Lovable no GitHub, caso essa autorização seja solicitada.
4. Escolha a conta ou organização do GitHub que deverá guardar o projeto.
5. Na tela de conexão, selecione o repositório privado já criado, se ele aparecer como opção.
6. Se o Lovable oferecer apenas **Criar repositório**, não prossiga nessa tela: a sincronização padrão cria um novo repositório e não importa um repositório existente.
7. Confirme a conexão e aguarde a primeira sincronização.
8. Abra o repositório no GitHub e confirme que a árvore do TrainyLab apareceu, incluindo `src`, `supabase`, `package.json` e os arquivos de configuração.

## Cuidados
- Não envie `.env`, senhas, tokens ou chaves manualmente.
- Não copie a URL do repositório para o campo **URL para o repositório de origem** sem confirmar que essa tela pertence ao fluxo de conexão do Lovable.
- Se o repositório vazio já criado não puder ser selecionado, crie um novo repositório privado diretamente pelo fluxo do Lovable e exclua o vazio depois.

## Resultado esperado
O código do TrainyLab ficará sincronizado em duas vias: mudanças feitas no Lovable irão ao GitHub, e mudanças enviadas ao GitHub voltarão ao Lovable.
