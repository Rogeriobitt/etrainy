
Inserir os 20 exercícios de Pernas e Glúteos em `public.exercises` via tool de inserção de dados.

## Verificação prévia
Antes do INSERT, rodar:
```sql
SELECT name FROM exercises WHERE name IN ( ...os 20 nomes... );
```
Se retornar nomes já existentes, te aviso quais e pulo essas linhas (a tabela não tem UNIQUE em `name`, então sem checagem dá pra duplicar).

## Operação
Um único `INSERT INTO public.exercises (name, muscle_group, equipment_type, suggested_level, short_description) VALUES (...)` com as 20 linhas exatamente como você forneceu.

## Sem mudanças
- Sem migration (é dado, não estrutura)
- Sem alteração de código
- `id`, `created_at` gerados automaticamente; `notes` fica NULL

## Resultado esperado
20 novos exercícios disponíveis no autocomplete do `ExerciseEditor` e nas sugestões da IA, filtráveis por `muscle_group` contendo "Glúteos", "Pernas", "Posterior", "Adutores", "Panturrilha".
