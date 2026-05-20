## Imagem dos exercícios na série do aluno

### Como vai funcionar
- O admin cadastra **uma imagem por exercício** no catálogo (página `/admin/...`).
- Sempre que esse exercício aparecer em qualquer série (do aluno ou montada pelo personal), a imagem aparece automaticamente ao lado do nome, séries e reps.
- Aluno e personal veem a mesma imagem — sem retrabalho por aluno.

### Mudanças

**1. Banco de dados**
- Adicionar coluna `image_url` (text, nullable) na tabela `exercises`.
- Criar bucket público `exercise-images` no Lovable Cloud Storage com policies:
  - Leitura pública (qualquer um vê a imagem).
  - Upload/Update/Delete apenas para admins (`has_role(auth.uid(),'admin')`).

**2. Painel admin de exercícios**
- Tela de gestão do catálogo de exercícios (criar se ainda não existir, ou estender a existente) com:
  - Listagem dos exercícios + thumbnail.
  - Botão "Enviar imagem" em cada linha → upload do arquivo para `exercise-images/{exercise_id}.{ext}` → salva URL pública em `exercises.image_url`.
  - Botão "Remover imagem".
- Aceita JPG/PNG/WEBP/GIF até ~5 MB.

**3. Exibição na série**
- **Aluno (`MyWorkout.tsx`)**: ao listar exercícios do dia, fazer um lookup por nome em `exercises` (ou trazer via join) e renderizar a thumbnail (64×64, arredondada) à esquerda do nome. Fallback: ícone de halteres atual.
- **Personal (`PersonalStudentDetail.tsx` + `ExerciseEditor.tsx`)**: mesma thumbnail no lugar do ícone Dumbbell já existente (o componente já tem o slot pronto, só falta dado).
- A busca de exercícios no editor (`ExerciseEditor`) já retorna do catálogo — basta incluir `image_url` no select e usar quando o personal selecionar um item da lista.

**4. Compatibilidade**
- Exercícios da série que não baterem por nome no catálogo continuam com o ícone genérico (sem quebra).
- Não precisa migrar dados antigos.

### Fora do escopo
- Vídeos demonstrativos.
- Upload de imagem por exercício individual da série (personalizado por aluno).
- Geração automática por IA.

### Aprovação
Aprove para eu rodar a migração e implementar as telas.