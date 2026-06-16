## Plano

1. **Confirmar os registros envolvidos**
   - Identificar a conta antiga da Mariana com email digitado errado.
   - Identificar a conta nova/correta criada via convite.
   - Confirmar quais séries pertencem à conta antiga e seus status atuais.

2. **Migrar as séries para a conta nova**
   - Atualizar os `workout_plans` da conta antiga para apontarem para o `user_id` da conta nova.
   - Manter todos os dias e exercícios já cadastrados, porque eles estão ligados aos planos e acompanham a migração automaticamente.
   - Preservar os status atuais: a série ativa continua ativa; a série aguardando revisão continua aguardando aprovação do professor.

3. **Garantir vínculo correto com o professor Daniel**
   - Confirmar que o perfil novo da Mariana continua com `personal_trainer_id` do Daniel e `has_personal = true`.
   - Ajustar os planos migrados para manterem o `personal_trainer_id` do Daniel, se necessário.

4. **Arquivar a conta antiga sem apagar histórico**
   - Deixar a conta antiga sem vínculo ativo com o professor para evitar confusão na lista de alunos.
   - Não apagar dados, para preservar rastreabilidade caso precise consultar depois.

5. **Verificar o resultado**
   - Conferir se a conta nova da Mariana passa a ter as séries.
   - Confirmar se existe pelo menos uma série com status `ativa`, pois só essas aparecem para a aluna.
   - Informar se Daniel ainda precisa aprovar a série mais recente que está em revisão.

## Detalhes técnicos

- A alteração será feita diretamente nos dados existentes do backend, não no código da aplicação.
- Não será recriada nenhuma série.
- Não será apagado nenhum treino, dia ou exercício.
- Se a série nova continuar com status `aguardando_revisao_personal`, ela não aparecerá para a aluna até Daniel aprovar pelo app.