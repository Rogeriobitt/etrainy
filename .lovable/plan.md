

# Upload e Gerenciamento de Aulas em Video

## O que sera construido

Uma area administrativa no app onde voce pode fazer upload de videos das aulas, preencher informacoes como titulo, duracao e categoria, e os alunos verao as aulas automaticamente na pagina principal.

## Funcionalidades

1. **Armazenamento de videos** - Os arquivos de video serao armazenados no backend do projeto
2. **Cadastro de aulas** - Formulario para preencher titulo, duracao, calorias, categoria e thumbnail
3. **Pagina de administracao** - Area exclusiva para voce gerenciar as aulas (adicionar, editar, remover)
4. **Player de video** - Pagina para o aluno assistir a aula
5. **Listagem dinamica** - A secao "Aulas em Video" passara a mostrar as aulas cadastradas no banco de dados

## Detalhes Tecnicos

### 1. Banco de dados - Nova tabela `video_classes`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Identificador |
| title | text | Nome da aula |
| description | text | Descricao da aula |
| duration | text | Duracao (ex: "30 min") |
| calories | text | Calorias (ex: "150 kcal") |
| tag | text | Categoria (Cardio, Forca, etc.) |
| video_url | text | URL do video no storage |
| thumbnail_url | text | URL da thumbnail |
| created_by | uuid | ID do usuario que criou |
| created_at | timestamptz | Data de criacao |

Politicas RLS:
- Qualquer usuario autenticado pode visualizar as aulas
- Somente o criador pode inserir, editar e deletar

### 2. Storage - Dois buckets

- **`class-videos`** - Para os arquivos de video (publico para leitura)
- **`class-thumbnails`** - Para as imagens de capa (publico para leitura)

### 3. Novos componentes e paginas

- **`/admin/classes`** - Pagina de administracao com listagem e formulario de upload
- **`/class/:id`** - Pagina do player de video para o aluno assistir
- Atualizacao do `VideoClasses.tsx` para buscar dados do banco
- Atualizacao do `Navbar.tsx` com link para area admin (visivel apenas para usuarios logados)

### 4. Fluxo do upload

```text
+------------------+     +------------------+     +------------------+
| Preencher form   | --> | Upload video +   | --> | Salvar metadados |
| (titulo, tag...) |     | thumbnail        |     | no banco         |
+------------------+     +------------------+     +------------------+
```

### 5. Limitacoes importantes

- O backend tem limite de **50MB por arquivo** no storage. Videos muito longos ou em alta resolucao podem precisar ser comprimidos antes do upload
- Recomendado usar formato **MP4** para compatibilidade com todos os navegadores

