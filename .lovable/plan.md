## Melhorias no upload de vídeo-aulas (painel ADM)

Implementar as 3 melhorias propostas e reorganizar o painel de cadastro de aulas.

### 1. Aumentar limite de upload
- Atualizar bucket `class-videos` para aceitar arquivos de até **2 GB** (`file_size_limit = 2147483648`) e restringir mime types para `video/mp4`, `video/webm`, `video/quicktime`.
- Substituir o `supabase.storage.upload` simples por **upload com progresso** (usando `XMLHttpRequest` via endpoint `storage/v1/object/...` com header de auth) para mostrar uma barra `<Progress>` durante o envio do vídeo.

### 2. Validação de formato e proporção
- No `onChange` do input de vídeo:
  - Rejeitar arquivos cujo `type` não comece com `video/` ou que não sejam `mp4/webm/mov`.
  - Carregar metadata via `<video>` oculto para ler `videoWidth/videoHeight` e validar proporção **16:9** (com tolerância ±2%). Se estiver fora, mostrar aviso (não bloquear, só alertar) recomendando reenviar em 16:9.
  - Exibir tamanho do arquivo em MB e duração detectada.
- Mesma checagem para thumbnail: aceitar só `image/jpeg`, `image/png`, `image/webp`, alertar se não for 16:9 e bloquear se > 1 MB.

### 3. Thumbnail automática
- Adicionar botão **"Gerar thumbnail do vídeo"** (habilitado depois que o vídeo é selecionado).
- Ao clicar: criar `<video>` em memória, navegar até `currentTime = duration * 0.1` (ou 2s), desenhar o frame em um `<canvas>` 1280×720 e exportar como `image/jpeg` qualidade 0.85.
- O blob resultante vira o `thumbnailFile` (substitui o upload manual, mas o manual continua disponível).
- Mostrar preview da thumbnail gerada antes de enviar.

### 4. Ajustes no painel ADM (`src/pages/AdminClasses.tsx`)
- Atualizar texto do label do vídeo: "Vídeo (MP4/WebM/MOV, máx. 2GB, 16:9)".
- Mostrar **barra de progresso** durante upload do vídeo (e estado "Processando..." enquanto insere o registro).
- Mostrar **preview** do vídeo e da thumbnail (manual ou gerada) antes do envio.
- Reorganizar o form em duas colunas mais claras: metadados à esquerda, mídia (vídeo + thumbnail + preview + ações) à direita.
- Adicionar dica curta de boas práticas (1080p, ~5 Mbps, 30 fps) abaixo do campo de vídeo.

### Detalhes técnicos
- Bucket: `supabase--storage_update_bucket` em `class-videos` com novo `file_size_limit` e `allowed_mime_types`.
- Upload com progresso: `fetch` não expõe progress; usar `XMLHttpRequest` POST para `${SUPABASE_URL}/storage/v1/object/class-videos/${path}` com headers `Authorization: Bearer <access_token>` e `x-upsert: false`. Depois chamar `getPublicUrl` normalmente.
- Captura de frame: usa `HTMLVideoElement` + `<canvas>` (sem dependências novas). `crossOrigin` não é necessário pois o vídeo ainda está local (`URL.createObjectURL`).
- Sem mudanças de schema, só ajuste de bucket + frontend.

### Arquivos
- `src/pages/AdminClasses.tsx` (refactor do formulário, validações, progresso, gerador de thumb)
- Bucket `class-videos` (config via tool)
