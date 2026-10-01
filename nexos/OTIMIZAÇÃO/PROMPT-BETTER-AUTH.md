# Prompt — implementar Better Auth e refatorar o login

Copie o texto abaixo para um agente com acesso ao repositório. O prompt exige que ele descubra a arquitetura real antes de alterar o projeto.

---

Atue como engenheiro de software especializado em autenticação, segurança de aplicações web e experiência do usuário. Analise meu projeto, integre o Better Auth ao login e refatore as partes necessárias para obter fluxos consistentes, controle de acesso confiável e uma experiência simples para os usuários.

Faça a implementação no código e valide o resultado. Não encerre o trabalho apenas com um diagnóstico ou com sugestões. Preserve o design e as regras de negócio existentes sempre que forem compatíveis com a solução. Toda refatoração deve resolver um problema concreto: vulnerabilidade, duplicação, inconsistência de sessão, dificuldade de manutenção ou falha de experiência.

## 1. Descubra o sistema existente antes de implementar

Leia as instruções do repositório, o `package.json`, o lockfile, as configurações do framework, o schema do banco e as migrations. Localize formulários, handlers, providers, hooks, middleware/proxy, callbacks OAuth, recuperação de senha e todas as rotas que acessam dados privados.

Identifique, com evidências no código:

- Framework, versões, gerenciador de pacotes e runtime, incluindo diferenças entre Node.js e Edge.
- Provedor atual de autenticação e fonte de verdade dos usuários, credenciais e sessões.
- Banco, ORM, tabelas de perfil, relacionamentos, tipos dos IDs e regras de acesso.
- Fluxos disponíveis: cadastro, login, logout, verificação de e-mail, recuperação, login social e autenticação multifator.
- Dependências de identidade em APIs, dashboards, uploads, Storage, Realtime e serviços externos, quando existirem.
- Domínios, ambientes e proxies efetivamente usados. Se houver Cloudflare/Vercel, confira a configuração real da cadeia de proxies.

Apresente um diagnóstico breve, relacionando problema, arquivo, impacto e correção proposta. Diferencie fatos encontrados de hipóteses. Não presuma Next.js, Supabase, Prisma ou Drizzle apenas porque são comuns.

Consulte a documentação oficial da versão escolhida do Better Auth, do framework e dos adapters. Confira advisories de segurança e compatibilidade. Use versões estáveis compatíveis, registre as versões adotadas e atualize o lockfile. Não copie APIs antigas nem instale automaticamente versões sem avaliar mudanças relevantes.

## 2. Defina uma arquitetura consistente

Separe três responsabilidades:

- **Autenticação:** comprovar quem é o usuário.
- **Sessão:** manter e validar essa identidade entre requisições.
- **Autorização:** decidir quais recursos e ações essa identidade pode acessar.

Integrar Better Auth resolve parte da autenticação e da sessão; as permissões específicas da aplicação continuam precisando de implementação e testes.

Centralize a configuração do Better Auth no servidor. Separe o cliente de autenticação utilizado pela interface e crie uma camada compartilhada para validar sessões e permissões. Mantenha módulos com banco e segredos fora do bundle do navegador; use a proteção equivalente a `server-only` quando o framework oferecer esse recurso.

Escolha o adapter compatível com o banco e o ORM já utilizados. Evite acrescentar outro ORM sem necessidade. Para esta aplicação com usuários existentes, prefira sessões persistidas em banco ou armazenamento compartilhado, com revogação verificável; qualquer escolha de sessões stateless precisa explicar como expiração e revogação serão tratadas.

Depois da migração, deve existir uma autoridade claramente definida para cada identidade e sessão. Qualquer coexistência temporária entre provedores precisa ter finalidade, regras de roteamento e condição de encerramento documentadas.

Se o projeto for **Next.js com App Router**, adapte os elementos oficiais ao projeto:

- Instância de servidor, por exemplo em `src/lib/auth.ts`.
- Cliente React com `createAuthClient` de `better-auth/react`, por exemplo em `src/lib/auth-client.ts`.
- Handler em `app/api/auth/[...all]/route.ts`, usando `toNextJsHandler` de `better-auth/next-js`.
- Se Server Actions executarem operações que definem cookies, use `nextCookies()` conforme a versão, como último plugin.
- Escolha `middleware.ts` ou `proxy.ts` e o runtime conforme a versão real do Next.js.

Middleware/proxy pode ajudar nos redirecionamentos, mas a mera presença de um cookie não comprova autenticação. Valide sessão e autorização nas operações protegidas, inclusive quando forem acessadas diretamente, sem passar pela interface.

Referências: [integração Next.js](https://better-auth.com/docs/integrations/next), [instalação](https://better-auth.com/docs/installation) e [banco/adapters](https://better-auth.com/docs/concepts/database).

## 3. Planeje a migração de usuários e dados

Mapeie usuários, perfis, contas OAuth, papéis, organizações e registros relacionados. Preserve IDs quando possível; se precisarem mudar, mantenha um mapeamento explícito e verifique todas as foreign keys — vínculos que impedem registros de apontarem para usuários inexistentes.

Verifique colisões de e-mail, normalização, usuários duplicados e evidências de verificação. Não una contas nem marque e-mails como verificados apenas por coincidirem. Preserve a vinculação dos provedores pela identidade estável de cada provedor.

Investigue o algoritmo e o formato dos hashes de senha existentes. Um hash não permite recuperar a senha original e, por isso, não pode ser convertido diretamente para outro algoritmo. Escolha uma estratégia demonstravelmente compatível: importação suportada, verificador transitório com atualização no próximo login, se suportado, ou recuperação de senha para os usuários afetados. Explique o impacto e evite exigir reset de todos sem necessidade.

Não reutilize tokens de sessão antigos como se fossem sessões Better Auth. Defina como os usuários serão convidados a autenticar novamente durante a transição.

Gere o schema necessário para usuários, sessões, contas e verificações, incluindo tabelas de plugins e rate limiting quando aplicáveis. Revise o SQL antes de aplicá-lo. Use migrations versionadas e respeite a ferramenta do ORM. Na documentação consultada, a CLI usa o pacote `auth`; confirme a CLI compatível antes de executar. O comando `migrate` do Better Auth é específico do adapter integrado Kysely; Prisma e Drizzle exigem o fluxo de migrations do respectivo ORM.

Prepare importações repetíveis sem duplicação, validação de contagens e vínculos, ensaio em ambiente isolado e plano de rollback. O rollback precisa tratar contas e alterações de senha criadas depois da transição; reverter apenas o código pode deixar usuários sem acesso. Prepare mudanças de produção para revisão, com backup verificável e indicação de ações irreversíveis.

Referência: [CLI e migrations](https://better-auth.com/docs/concepts/cli).

## 4. Se houver Supabase, resolva a fronteira de identidade

Determine se o Supabase fornece apenas PostgreSQL ou também Auth, Data API, Storage e Realtime. Inspecione políticas que dependem de `auth.uid()`, JWTs e referências a `auth.users`.

**Uma sessão Better Auth não se transforma automaticamente em uma sessão Supabase.** Defina e valide a arquitetura de acesso: backend que verifica a sessão Better Auth antes de consultar recursos, ou integração de autenticação externa comprovadamente suportada pela configuração atual. Não presuma que gerar um JWT com qualquer plugin basta para autenticar nas APIs do Supabase.

Se houver backend intermediário, confira as permissões da conexão: conexões privilegiadas e `service_role` podem contornar RLS. Nesse caso, implemente autorização e filtros de propriedade no servidor. Prefira privilégios mínimos e não use credenciais administrativas como solução genérica para erros de acesso.

Mantenha as tabelas de credenciais e sessões em schema não exposto quando viável. Em tabelas expostas, revise grants e RLS — regras que restringem quais linhas cada identidade pode acessar. Preserve o isolamento entre usuários e organizações. Nunca exponha `service_role`, segredo JWT ou senha do banco no frontend, nem altere tabelas internas gerenciadas do Supabase como substituto de uma migração suportada.

Verifique separadamente os caminhos de Data API, Storage e Realtime que o projeto utilizar. Uma consulta funcionando pelo backend não prova que os demais serviços reconhecem a identidade corretamente.

Referências: [autenticação externa no Supabase](https://supabase.com/docs/guides/auth/third-party/overview) e [RLS e privilégios](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 5. Implemente controles de segurança explícitos

### Segredos, cookies e origens

Configure `BETTER_AUTH_SECRET` com alta entropia e pelo menos 32 caracteres, por mecanismo seguro. Não coloque valores reais em código, logs ou exemplos. Documente nomes de variáveis em `.env.example`, sem segredos, e valide configurações obrigatórias ao iniciar. Segredos nunca devem usar prefixos públicos como `NEXT_PUBLIC_`.

Defina a URL canônica e `trustedOrigins` por ambiente. Use origens explícitas; previews precisam de uma regra restrita aos deployments autorizados. Preserve as verificações de CSRF e de origem. CSRF é uma tentativa de induzir o navegador autenticado a executar ações em nome do usuário. Não desative essas verificações para esconder um problema de configuração.

Para cookies de sessão, confira `HttpOnly`, `Secure` em HTTPS e `SameSite` adequado ao fluxo. Mantenha o escopo do domínio restrito; compartilhamento entre subdomínios precisa de necessidade real. Teste OAuth antes de endurecer atributos de cookies de forma indiscriminada. Se frontend e API forem separados, valide CORS com origens específicas, credenciais e comportamento dos navegadores; nunca combine credenciais com origem `*`.

Referências: [segurança](https://better-auth.com/docs/reference/security) e [cookies](https://better-auth.com/docs/concepts/cookies).

### Sessões e permissões

Defina duração, renovação e necessidade de autenticação recente conforme a sensibilidade das operações. Logout deve revogar a sessão no armazenamento, além de atualizar a interface. Recuperação de senha, bloqueio e mudanças relevantes de acesso devem seguir uma política explícita de revogação.

Avalie `session.cookieCache`: ele pode manter uma sessão aparentemente válida até o cache expirar, mesmo depois da revogação no servidor. Para operações sensíveis, consulte a fonte persistida, usando a opção equivalente a `disableCookieCache: true`, quando compatível. Consulte permissões e bloqueios atuais; não use um papel antigo de cache como autoridade.

Exemplo de referência, somente para Next.js compatível, adaptando imports e tratamento de erros ao projeto:

```ts
import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getVerifiedSession() {
  return auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
}
```

Cada operação protegida deve rejeitar sessão ausente ou inválida e, em seguida, verificar a permissão sobre o recurso solicitado. Em APIs, use `401` para ausência de autenticação e a resposta de negação apropriada para falta de permissão. Redirecionamentos pertencem ao fluxo de páginas; não devem transformar uma API em uma resposta HTML inesperada.

Valide usuário, papel, organização e propriedade dos dados no servidor. IDs recebidos do cliente são entradas, não prova de autorização. Impeça **IDOR/BOLA**: acesso a dados de outra pessoa por alteração de identificadores na URL ou no payload. Campos como `role`, `ownerId` e `tenantId` não podem elevar privilégios por edição do formulário ou do request.

Evite cache compartilhado de respostas privadas e cache global de sessões. Otimizações precisam preservar isolamento e revogação.

Referências: [sessões e cache](https://better-auth.com/docs/concepts/session-management) e [autorização OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

### Abuso, senhas e callbacks

Configure **rate limiting**, que limita a frequência de requisições, para login, cadastro, recuperação, reenvio de e-mails e MFA. Em ambientes serverless ou com múltiplas instâncias, use armazenamento compartilhado apropriado e consumo atômico dos limites. Aplique proteção por IP e, onde necessário, identidade, evitando bloqueio abusivo de contas por terceiros.

**Chamadas diretas a `auth.api` não passam pelo rate limiter HTTP do Better Auth.** Se uma Server Action ou endpoint próprio chamar essas APIs, proteja essa entrada antes da chamada. Confirme também as defesas de CSRF e origem aplicáveis aos wrappers próprios.

Confie em headers de IP apenas quando o proxy os definir ou sanitizar e o origin não aceitar acesso direto que permita falsificá-los. Não presuma que `cf-connecting-ip` é confiável apenas pelo nome. Trate respostas `429` com orientação clara de espera, conforme o contrato real da API.

Mantenha hashing robusto suportado pelo Better Auth; o padrão documentado é `scrypt`. Não implemente criptografia própria. Valide a política de senhas no servidor, permita gerenciadores de senhas e colagem, e não altere a senha com `trim`, normalização ou truncamento silencioso.

Para OAuth/OIDC existentes, preserve os mecanismos oficiais de `state`, PKCE e `nonce`, conforme o provedor. `state` vincula a resposta ao fluxo iniciado; PKCE protege o código de autorização contra interceptação; `nonce` vincula o ID token à requisição no OIDC. Use callbacks exatos e escopos mínimos. A vinculação entre contas exige regras contra tomada de conta, não apenas igualdade de e-mail.

Valide `callbackURL`, `returnTo` e parâmetros equivalentes contra destinos permitidos para impedir **open redirect**, o envio do usuário a um destino controlado por terceiros. Inclua URLs absolutas externas, caminhos `//`, encoding e entradas malformadas nos testes.

Referências: [rate limiting](https://better-auth.com/docs/concepts/rate-limit), [OAuth](https://better-auth.com/docs/concepts/oauth) e [autenticação OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## 6. Complete os fluxos de autenticação

Implemente cadastro, login, logout, verificação de e-mail, reenvio com intervalo, recuperação e alteração de senha. Use os mecanismos de token da biblioteca, com validade e uso único, validando expiração e reutilização.

Configure envio real de e-mails pelo serviço existente ou por uma integração adequada. Use fila durável ou mecanismo de execução em segundo plano suportado pelo runtime; uma promessa abandonada pode ser interrompida no serverless. Trate falhas e retries sem registrar tokens ou URLs sensíveis. Se faltar uma credencial, documente exatamente o bloqueio e conclua as partes independentes; não simule envio bem-sucedido.

Exija verificação de e-mail conforme a política escolhida e implemente os callbacks necessários antes de ativar a exigência. Confira separadamente as regras de verificação de provedores sociais. Na recuperação, avalie `revokeSessionsOnPasswordReset: true` e teste a invalidação real das sessões.

Evite **enumeração de contas**, isto é, descobrir quem está cadastrado pelas respostas. Revise cadastro, login, recuperação e reenvio: uma mensagem genérica no frontend não basta se status ou payloads da API continuarem distinguindo os casos.

Se já houver MFA, preserve-o. Para contas privilegiadas, avalie MFA por TOTP ou passkeys com plugins oficiais, incluindo recuperação e reautenticação para alterações. Não conceda acesso protegido enquanto o segundo fator estiver pendente. Funcionalidades adicionais só devem ser ativadas com fluxo completo e necessidade demonstrada.

Referências: [e-mail e senha](https://better-auth.com/docs/authentication/email-password) e [2FA](https://better-auth.com/docs/plugins/2fa).

## 7. Refatore a experiência dos usuários

Preserve a identidade visual e ajuste o comportamento dos formulários:

- Estados claros de carregamento, sucesso e erro, com prevenção de submissões duplicadas.
- Validação útil no cliente e obrigatória no servidor; mensagens em português, sem stack traces ou detalhes internos.
- Labels, foco visível, navegação por teclado e associação acessível dos erros aos campos.
- `autocomplete` apropriado para e-mail, senha atual, nova senha e códigos; permitir colagem e preenchimento por gerenciadores.
- Mostrar/ocultar senha com controle acessível, sem perder o foco ou apagar o campo.
- Retorno à página pretendida após autenticação, usando destino validado.
- Sessão atualizada após login/logout, limpeza do estado privado e sincronização entre abas quando aplicável.
- Tratamento da expiração durante o uso, evitando loops de redirecionamento e exposição de dados antigos.
- Feedback real para verificação e recuperação, com reenvio controlado e opção de corrigir o e-mail.

Não exiba o dashboard privado enquanto a autenticação ainda estiver indefinida. Remova providers, hooks e listeners antigos somente depois de substituir seus consumidores. A refatoração precisa evitar tanto sessão desatualizada quanto múltiplas consultas desnecessárias.

## 8. Valide com testes de comportamento e segurança

Use a infraestrutura de testes existente; acrescente testes necessários para os riscos desta mudança. Execute lint, typecheck, build e testes compatíveis com o projeto. Não invente resultados nem declare validação que não executou.

Verifique pelo menos:

1. Cadastro e login válidos, credenciais inválidas, e-mail duplicado e e-mail não verificado.
2. Sessão após reload, logout, expiração e uso do token anterior após revogação, inclusive com cache.
3. Acesso direto a rotas e ações privadas sem sessão, com cookie forjado, sessão expirada ou usuário bloqueado.
4. Dois usuários tentando ler ou alterar dados um do outro, e isolamento entre organizações, se existirem.
5. Usuário comum tentando elevar seu papel ou executar operações administrativas.
6. Recuperação e verificação com token válido, inválido, expirado e já usado; falha no envio de e-mail.
7. Rate limiting nos handlers HTTP e wrappers de `auth.api`, incluindo concorrência e armazenamento compartilhado.
8. Origem não autorizada, CSRF, redirects externos e callbacks OAuth manipulados, quando aplicáveis.
9. MFA pendente sem acesso protegido, se houver MFA; cancelamento e erro do provedor social.
10. Cookies e experiência em desktop/mobile e nos navegadores relevantes, com atenção a Safari e cenários entre domínios.
11. Migração de usuários existentes, preservação dos dados e rollback; caminhos Supabase realmente utilizados.

Registre os comandos executados e os resultados. Diferencie testes automatizados, verificação manual e pontos bloqueados por serviços externos. Para testes de abuso, use ambiente isolado e contas de teste.

## 9. Entregue uma implementação revisável

Ao terminar, apresente:

- O que estava causando os problemas e o comportamento obtido após as mudanças.
- Arquitetura final, arquivos alterados e justificativa das refatorações relevantes.
- Configuração necessária por ambiente, sem valores secretos.
- Migrations, estratégia para usuários existentes e procedimento de rollback.
- Evidências dos testes, limitações reais e pendências específicas.
- Instruções curtas de operação: revogar sessões, investigar falhas de login e acompanhar erros de autenticação sem coletar credenciais ou tokens.

Critério de conclusão: os fluxos funcionam de ponta a ponta, a sessão é validada no servidor, as permissões resistem ao acesso direto e à troca de IDs, os usuários existentes mantêm seus vínculos e a interface comunica os estados corretamente. Demonstre isso com verificações executadas. Não confunda build aprovado com autenticação e autorização validadas.

---

Referências consultadas para elaborar o prompt em 30/09/2026. O agente deve conferir a documentação e a versão efetivamente utilizadas no momento da implementação.
