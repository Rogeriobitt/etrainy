## Valor gerado para `CRON_SECRET`

Use este valor aleatório (64 caracteres, base64-url, gerado agora):

```
trainylab_cron_K9mP3xQ7vN2wR8tY5jL4hF6gD1sB0aZ_X9cV2bN8mQ4pR7tY3jL6
```

### Onde colar

1. **No formulário de Secrets** (que está aberto): cole exatamente esse valor no campo `CRON_SECRET` e salve.
2. **Eu uso esse mesmo valor** para reagendar o cron diário (`pg_cron`) enviando o header `x-cron-secret`.

### O que farei depois que você confirmar que salvou

- `cron.unschedule('check-workout-expiry-daily')` no pg_cron.
- Reagendar o mesmo job às 09:00 UTC, agora com o header `x-cron-secret: <valor acima>` no `net.http_post`.
- Testar a edge function com o header certo (deve retornar 200) e sem o header (deve retornar 401) para confirmar que a proteção está ativa.

Confirma que salvou o secret e posso seguir?