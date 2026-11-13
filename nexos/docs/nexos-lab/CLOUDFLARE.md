# Cloudflare — proposta para revisão, sem ativação em produção

Nenhuma regra foi publicada. Falta confirmar hostname privado, zona, plano e permissão WAF.
A prévia chatgpt.site não pertence à zona de produção e não deve ser incluída na regra.

## Regra de Challenge Page

Substituir HOST_PRIVADO_CONFIRMADO apenas após a confirmação do proprietário:

```text
(http.host eq "HOST_PRIVADO_CONFIRMADO"
 and http.request.method in {"GET" "HEAD"}
 and any(http.request.headers["accept"][*] contains "text/html")
 and not starts_with(http.request.uri.path, "/api/")
 and not starts_with(http.request.uri.path, "/_next/")
 and not starts_with(http.request.uri.path, "/.well-known/")
 and not http.request.uri.path in {"/robots.txt" "/sitemap.xml"})
```

A regra inclui navegações diretas para páginas públicas e privadas, sem desafiar JSON,
callbacks de autenticação, cron ou assets. Não basear bypass em um header secreto enviado
pelo navegador. Confirmar com o monitoramento real se é preciso uma exceção adicional,
restrita a IP verificado e endpoint de health, sem abrir bypass genérico por user agent.

Ação recomendada: Managed Challenge. Ela pode aprovar automaticamente e não garante
interação visível. Se interação obrigatória for requisito, selecionar Interactive Challenge
somente após confirmar disponibilidade na conta/plano e testar o impacto em acessibilidade.
Challenge Pages e Turnstile são mecanismos diferentes: o widget no formulário não protege
a entrega inicial do HTML.

## Ordem e proteção da origem

1. Identificar a zona e o hostname privado proxied pela Cloudflare.
2. Configurar a regra no WAF > Custom rules, inicialmente desativada.
3. Revisar os eventos simulados antes de ativar no hostname privado autorizado.
4. Definir Challenge Passage (ex.: 30 minutos) e validar o cookie cf_clearance.
5. Inventariar aliases Vercel, domínio www, domínio raiz e URL da origem. Proteger o acesso
   direto na Vercel com mecanismo suportado pelo plano (Deployment Protection/origin gate).
   A presença de cf-connecting-ip enviada pelo cliente não é autenticação da origem.
6. A aplicação só confia no IP que a plataforma Vercel sobrescreve. Em outra hospedagem,
   implementar o adaptador de proxy confiável antes de liberar limites individuais.

## Testes obrigatórios no hostname privado

- Perfil limpo, sem clearance: HTML recebe desafio antes de qualquer HTML da aplicação.
- Completar desafio e retornar ao caminho e query originais.
- Recarregar com clearance válido: sem novo desafio dentro do período.
- Entrar, recuperar acesso, sair; verificar cookies e MFA sem loops.
- APIs devem continuar retornando JSON, nunca páginas de desafio.
- Verificar imagens/fontes/vídeos, og, robots, sitemap, cron e callbacks necessários.
- Tentar os aliases e origem direta: acesso não pode contornar a proteção.
- Testar teclado, Chrome, WebKit e dispositivo real.

## Reversão e produção

Desativar apenas a regra criada, limpar o perfil de teste e confirmar recuperação das rotas.
Guardar ID da regra, expressão anterior e evidências antes de qualquer publicação.
Replicar para o hostname de produção SOMENTE após aprovação explícita do proprietário.

Fontes: [WAF Challenge Pages](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/create-custom-rule/),
[tipos de desafio](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/),
[Challenge Passage](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/challenge-passage/).
