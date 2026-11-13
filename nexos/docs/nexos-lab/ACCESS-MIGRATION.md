# Acesso restrito — preparação antes do deploy

## Comportamento local

Cadastro público e Google/GitHub estão desativados na interface, configuração Better Auth
e hooks do servidor. Rotas sociais diretas e callbacks antigos retornam 403.
Nenhum usuário, vínculo OAuth, perfil, permissão ou sessão existente foi apagado.
Recuperação por e-mail, link de acesso, senha, passkey já cadastrada, MFA e logout permanecem.

## Contas anteriores dependentes de OAuth

Antes de produção, inventariar agregados de usuários sem conta credential, e verificar se
seus e-mails foram confirmados. Usuários com e-mail verificado podem usar link de acesso
ou redefinição de senha no mesmo endereço; o token continua sendo enviado apenas ao
proprietário da caixa postal e é de uso único. Validar o fluxo completo em schema isolado,
incluindo MFA, preservando o mesmo user.id e seu perfil.

Contas sem e-mail verificado ou sem controle da caixa postal exigem verificação administrativa
individual. Nunca confirmar e-mail em lote, alterar ownership ou associar contas pelo nome.
Não remover o último método de acesso em produção antes de resolver esse grupo.

## Provisionamento

Foi preparada a alternativa administrativa local, sem rota pública:

```sh
node --use-system-ca --conditions=react-server --import tsx scripts/provision-member.mjs EMAIL NOME
```

O padrão é dry run. Somente acrescentar `--apply` quando o operador autorizado decidir
criar a conta e enviar sua verificação. O script usa acesso interno do servidor,
cria apenas papel user com senha aleatória nunca exibida e envia confirmação ao e-mail.
Depois de confirmar a caixa postal, o membro define a senha pela recuperação normal.
Nenhuma conta real foi criada nesta entrega. A variante de convites pode substituir
este fluxo quando o proprietário responder à preferência perguntada.

A isenção de MFA é exclusiva à chamada interna create-user sem Request/Headers, numa
instância criada pelo CLI com configuração explícita. getAuth() nunca ativa essa opção;
requisições HTTP continuam exigindo sessão e MFA. Esse isolamento foi testado em schema temporário.

Não alterar configuração dos provedores Supabase/Google/GitHub ou publicar enquanto
os grupos acima não estiverem validados e o proprietário não aprovar a produção.
