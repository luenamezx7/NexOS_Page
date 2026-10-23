# Revisão de páginas e navegação

## Padrão visual

- Cores da home preservadas: creme no modo claro, preto no modo escuro e a paleta roxa da marca.
- Grainient compartilhado nas páginas internas, com menor intensidade para leitura.
- Cabeçalho interno unificado: logo, navegação, retorno ao site e alternância de tema.
- Containers, títulos, espaçamentos, painéis, rodapés e estados de erro com estilos compartilhados.
- Botões principais mantêm o contorno roxo e o preenchimento no hover/foco.
- Documentos legais mantêm o texto e passam a indicar o documento ativo com os mesmos tokens do projeto.
- Conta, segurança e dashboard usam o mesmo cabeçalho e ritmo visual; regras de sessão e autorização permanecem nos servidores das respectivas rotas.

## Problemas confirmados e correções

1. **Hero → próxima seção desalinhado:** antes da correção, o link “Explore a NexOS” terminava com a seção a 56 px do topo, apesar da margem de 100 px. A translação de 44 px da seção inteira alterava o alvo durante a viagem. Removida a revelação que escondia/deslocava toda a seção; o cálculo de posição usa coordenadas de layout.
2. **Dois caminhos para âncoras:** links normais usavam o tratamento automático do Lenis, enquanto o header usava outro controlador. Todos os links de seção agora usam o mesmo controlador e respeitam a altura real do header.
3. **Histórico inconsistente:** o header deslocava a página sem atualizar o hash. As ações agora atualizam a URL, e o retorno pelo histórico realinha a seção.
4. **Navegação interrompida:** correções de uma navegação antiga podiam disputar com um novo destino. A navegação anterior é cancelada ao escolher outro destino ou ao retomar o scroll manual.
5. **Retorno à aba:** o controlador era destruído e recriado ao voltar à aba. Agora ele é preservado, inclusive durante um bloqueio de scroll por modal.
6. **Seção ativa:** o indicador escolhia a primeira entrada do observer, sem considerar as demais seções ainda visíveis. Agora ele seleciona a região que ocupa o centro da tela.
7. **Cookies sobre controles:** um teste confirmou o aviso cobrindo a ação de criar conta. A altura real do banner agora reserva espaço no fim da página e no scroll-padding; áreas vazias ao redor do painel não interceptam cliques.
8. **Primeiro frame do background:** o fallback é pintado antes do canvas carregar, evitando um fundo sem o roxo durante a abertura/troca de rota.
9. **Pacote de deploy:** o ignore excluía arquivos de marca importados no build. Foram adicionadas exceções específicas para a fonte do wordmark e as duas ilustrações usadas pelo código.
10. **Primeiro scroll em `/#hero`:** a restauração inicial do hash podia aguardar as fontes e voltar ao topo depois do primeiro gesto nativo, especialmente no celular. Como o navegador já posiciona o hero no topo, essa restauração inicial foi dispensada; a navegação por cliques e pelo histórico continua atendida pelo controlador.

## Rotas revisadas

- Home e suas âncoras.
- `/placa-nfc`, `/criacao-de-sites`, `/landing-pages`, `/cardapio-digital`.
- `/privacidade`, `/termos`, `/cookies`, `/lgpd`, `/reembolso`.
- `/portal/acesso`, `/portal/redefinir`, `/admin-dashboard-su/secure-entry`.
- `/conta`, `/portal/seguranca`, `/dashboard`: componentes visuais atualizados; redirecionamentos de visitantes sem sessão verificados.
- Página 404.
- `/checkout`, `/sucesso` e `/cancelado` preservam sua função de redirecionar ao atendimento comercial.

## Validação

```bash
npm run build
npm run typecheck
npm run lint
npm run test:security
npx playwright test tests/browser/page-consistency.spec.ts tests/browser/scroll-navigation.spec.ts tests/browser/login.spec.ts tests/browser/auth-regressions.spec.ts tests/browser/commercial.spec.ts --reporter=line
```

A suíte cobre os dois temas, layouts de 390 e 1366 px, histórico, âncoras entre páginas, cliques rápidos, interrupção por roda do mouse, saída da apresentação, formulários e redirecionamentos de autenticação. Os testes de autenticação no navegador usam endpoints simulados para operações de cadastro/recuperação e não criam contas de produção.

### Resultado — 23/10/2026

- Build de produção e TypeScript aprovados.
- Lint sem erros, com 29 avisos em arquivos preexistentes fora desta correção.
- 14 testes de segurança aprovados.
- 31 testes de navegador aprovados nas cinco suítes acima: 7 de navegação e 24 de consistência de páginas, login, regressões de autenticação e fluxo comercial.
- As duas falhas anteriores de scroll manual foram revalidadas em 390 e 1366 px sobre um build atualizado.
