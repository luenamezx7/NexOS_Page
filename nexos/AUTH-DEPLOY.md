# Autenticação em produção

## Domínio e sessão

- Vercel: `nexoslab.online` serve Production; não configure redirecionamento do apex para `www`. O app já redireciona `www` para o apex preservando caminho e query.
- `SITE_URL` e `NEXT_PUBLIC_SITE_URL`: `https://nexoslab.online`.
- `SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_URL`: mesmo projeto; as chaves publishable e secret devem pertencer a ele.
- `DASHBOARD_ADMIN_USER_IDS`: UUIDs dos administradores separados por vírgula. Admin exige allowlist e MFA; clientes também completam MFA antes da compra.

## GitHub e Google

O callback dos provedores é o **Supabase**, não o domínio da aplicação:

`https://lgfttyeezviecfqbbmqk.supabase.co/auth/v1/callback`

- GitHub Settings → Developer settings → OAuth Apps: Authorization callback URL acima. O Client ID desse app deve ser o configurado no provider GitHub do Supabase.
- Google Cloud → OAuth client (Web application): Authorized redirect URI acima. Configure a tela de consentimento e os usuários de teste quando o app estiver em Testing. Client ID/Secret devem coincidir com o provider Google no Supabase.
- Supabase Authentication → URL Configuration: Site URL `https://nexoslab.online`; Redirect URLs devem aceitar `/auth/callback` **com os parâmetros `entry` e `next`**. Cadastre `https://nexoslab.online/auth/callback` e `https://nexoslab.online/auth/callback?**` (curinga apenas na query, mantendo domínio/path fixos).
- Templates de confirmação/recovery: use `{{ .ConfirmationURL }}`. Para login digitando código, o template também deve exibir `{{ .Token }}`.

O app inicia OAuth com PKCE, troca o código no servidor e passa pela entrada correspondente para validar e-mail/MFA/allowlist antes de retomar o destino interno. Código/verificador devem permanecer no mesmo navegador. Configurações dos provedores precisam ser validadas nos painéis externos: uma URL de autorização gerada com sucesso não comprova login concluído.

## Turnstile e contato

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`: mesmo widget Cloudflare, hostname permitido `nexoslab.online`.
- O frontend consulta a chave pública e a exigência no runtime em `/api/security/config`; o segredo nunca é retornado. Configuração ausente falha fechada com mensagem de indisponibilidade.
- A sessão e o anti-bot são controles distintos: contato e geração de cobrança ainda exigem captcha quando habilitado. Tokens são descartados após cada tentativa e renovados antes de reenviar.
- `NOTION_TOKEN` e `NOTION_DATABASE_ID`: integração com acesso ao database do contato.
- Asaas exige suas credenciais e `CHECKOUT_STATUS_SECRET`; preços e autorização continuam validados no servidor. Pix permanece indisponível enquanto a integração não for liberada.

## Verificação

`npm run typecheck`, `npm run test:security`, `npm run build`, `npm run test:browser`.

`npm run test:auth:live` cria usuários temporários no Supabase configurado, testa confirmação, MFA, allowlist, cookies e logout, e remove as contas ao final. Não cria cobranças nem mensagens de contato.

Após publicar: verificar o retorno de Google e GitHub no navegador, incluindo recusa de consentimento; abrir uma compra deslogado e confirmar que produto/quantidade retornam depois do login/MFA; testar captcha expirado e reenvio do contato. Testes automatizados com provedores simulados não substituem o consentimento real nos dois provedores.
