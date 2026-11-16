# EZWAY — Implementação do catálogo e jornada de diagnóstico

Data: 15/11/2026. Rodada local de implementação, sem publicação.

## Referências e fontes

- O responsável dispensou o PDF por ser uma exportação do próprio site. A referência visual desta rodada é a página original do repositório, executada localmente, e suas capturas antes/depois.
- Aplicação: `nexos/`, Next.js App Router, React, TypeScript, Tailwind/CSS Modules. Instruções de `AGENTS.md` lidas e guia local de lazy loading do Next.js consultado.
- Fontes comerciais existentes: configuração do site, rotas de serviços, README e seções já publicadas. A documentação comercial antiga contém referências desatualizadas; não foi tratada como comprovação isolada.
- CRM indicado pelo responsável: `http://localhost:3001`. Após autenticação do responsável no navegador do Orca, foi feita inspeção somente de leitura de dashboard, Prospecções, Pipeline, ficha de empresa, Clientes, ficha de cliente e catálogo de produtos e serviços.
- Capacidades observadas: pipeline com Retentativas; ação de mover para Retentativas; histórico; controle de agendamento; dados de clientes; área de vendas; catálogo; visão financeira com receitas, custos e situações de lançamentos. Controle & Gestão consta como produto no catálogo do CRM.
- Não foram executadas gravações, mudanças de etapa, agendamentos, vendas, importações ou alterações no CRM. A existência de controles na interface não equivale a um teste de ponta a ponta dessas gravações. Condições comerciais continuam sujeitas a diagnóstico.
- Nenhum nome, contato, valor ou dado real do CRM foi transferido para os componentes ou capturas do site. A versão inicial usava “Empresa exemplo”; a revisão solicitada pelo responsável substituiu essa composição por capturas reais com dados sensíveis ocultados. O site não acessa APIs do CRM.

## Mapa anterior e decisões

A composição inicial partia de hero e demonstração de placas, seguia para destinos digitais em notebook, vídeo, troca de destino da placa, EasyChat, processo de entrega, suporte, evidências, apresentação institucional, FAQ e convite final.

Mantidos: menu flutuante, tipografia e destaques rosa, fundos e superfícies existentes, notebook, telefone, placas, rolagem, fluxo de conta, rotas e contato comercial.

Adaptados: abertura, navegação principal, ordem das seções, FAQ, mensagens de diagnóstico, processo digital, metadados e imagem social, disponibilidade de EasyChat e política de movimento reduzido.

Acrescentados: demonstração ilustrativa de gestão, comparação, ecossistema com catálogo expansível e cinco exemplos de segmentos. A arte de cardápio que mostrava valores foi substituída por uma composição em HTML/CSS, com foto existente, itens e descrições sem informações monetárias.

## Alterações entregues

- Abertura: “Mais clareza para gerir. Mais organização para crescer.”; CTA principal para diagnóstico no WhatsApp e CTA secundário para o ecossistema. Texto e links são legíveis sem animação.
- Controle & Gestão: demonstração em notebook com cinco etapas selecionáveis — oportunidade, acompanhamento, cliente, venda e visão financeira. Na revisão atual, o notebook exibe capturas reais do CRM, identificadas como telas com dados sensíveis ocultados e sem conexão de dados com o site. Retentativas explicadas separadamente.
- Comparação: cinco pares sustentados pelas funções observadas e ofertas existentes. O sexto par sobre automação fica pendente do escopo do chatbot.
- Catálogo: fonte central com 11 registros e os campos de necessidade, público, benefícios, entregas, limites, relações, disponibilidade, fonte, asset e CTA contextual. Oito registros são apresentados; chatbot, biolinks e audiovisual permanecem pendentes internamente. A divulgação audiovisual que já existia foi preservada, sem ampliar suas promessas.
- Navegação de soluções utiliza os registros públicos da fonte central. Caminhos antigos e âncoras existentes foram preservados.
- Cinco cenários ilustrativos: serviços, pequenos comércios, alimentação, escritórios e empresas em expansão, sem apresentá-los como casos reais.
- Quatro aparições do símbolo oficial da EZWAY usado no menu (`/logo-ghost.svg`): abertura, comparação, visão do ecossistema e convite final. Asset reutilizado, dimensões reservadas e imagens decorativas com texto alternativo vazio.
- Processo digital: diagnóstico, definição da solução, implementação e acompanhamento. Processo físico continua separado. Nenhum prazo ou condição específica de suporte foi acrescentado.
- EasyChat: estado de desenvolvimento preservado na apresentação, catálogo e FAQ; conversa identificada como prévia conceitual de funcionalidades previstas.
- Conteúdo novo integrado à alternância existente entre português, inglês e espanhol. Fotografias e arte ilustrativa original de portfólio preservadas.
- Contato: mesmo número configurado, mensagens por intenção e atributos de seção/solução nos CTAs novos. Nenhuma mensagem é enviada automaticamente e nenhum novo provedor de analytics foi adicionado.
- Movimento: removida a transformação de CSS que descartava `prefers-reduced-motion`; o hook acompanha a preferência real. Lenis, vídeo automático, abertura e jornadas GSAP são simplificados com redução ativa. Limpeza das propriedades dos slides permite alternar a preferência durante a visita.

## Situação das etapas do guia

- **1 — Concluída para esta rodada:** arquitetura, composição anterior e capturas disponíveis. PDF dispensado pelo responsável.
- **2 — Parcial:** funções de gestão e ofertas existentes verificadas; escopo comercial de três frentes e condições detalhadas de suporte continuam pendentes.
- **3 — Concluída para os blocos novos:** fonte central de 11 soluções, catálogo e menu consumindo seus registros. Configurações legadas de páginas específicas continuam existentes.
- **4 — Parcial:** jornada passa a começar por gestão, comparação e ecossistema. Seção dedicada ao chatbot depende de validação.
- **5 — Concluída:** abertura e CTAs de diagnóstico implementados e testados.
- **6 — Concluída no escopo demonstrativo:** representação de capacidades observadas com dados fictícios, sem testar gravações reais nem estabelecer integração.
- **7 — Parcial:** cinco pares implementados; automação depende da confirmação do chatbot.
- **8 — Parcial:** oito apresentações públicas; três registros internos aguardam validação para novos cards públicos.
- **9 — Concluída:** cinco exemplos explicitamente ilustrativos.
- **10 — Concluída:** quatro usos do avatar existente, sem novas dependências.
- **11 — Parcial:** jornada digital adaptada e explicação física preservada; condições específicas de acompanhamento não foram inventadas.
- **12 — Concluída para os CTAs alterados:** destino e contexto testados, sem envio real. Atributos de origem disponíveis; não há nova coleta de dados.
- **13 — Parcial:** preferência de movimento, desmontagem dos efeitos alterados e navegação verificadas. Não representa auditoria exaustiva de todas as animações legadas do repositório.
- **14 — Parcial:** cinco larguras do guia e cenários adicionais automatizados; falta comparação quantitativa de desempenho anterior/posterior e verificação em aparelhos físicos.
- **15 — Parcial:** conteúdo desta rodada revisado e restrições aplicadas; ofertas pendentes impedem considerar o catálogo comercial integralmente validado.
- **16 — Versão de revisão local preparada:** checks e limitações abaixo; publicação não realizada.

## Verificações

- Instalação reproduzível com `npm ci --no-audit --no-fund`; dependências do produto não foram acrescentadas e o lockfile não foi alterado.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem erros; 30 avisos em componentes legados não alterados nesta rodada.
- `npm run test:unit`: cinco testes aprovados, incluindo preservação de condições de movimento no pipeline CSS real.
- `npm run build`: aprovado. Aviso de fallback da fonte Google Sans; sem erro de compilação.
- Jornada nova: sete cenários aprovados em desenvolvimento, cobrindo 360, 390, 768, 1024 e 1440 px, CTA e âncora, demonstração, comparação, exemplos, movimento reduzido e ausência de JavaScript.
- Idiomas: cinco cenários aprovados em desenvolvimento, incluindo persistência, conteúdo novo, cores, enquadramento e barra de progresso.
- Diagnóstico em movimento reduzido: um cenário aprovado, confirmando política efetiva reduzida, vídeo pausado e rolagem nativa.
- Verificação textual da home local: nenhum valor monetário, pergunta de preço, parcelamento ou desconto encontrado. Assets de demonstração também foram inspecionados visualmente.
- A suíte completa do repositório não foi executada. Há suítes históricas que pressupõem hero com placas/palavra digitada ou política de animação completa sob `reduce`; não devem ser usadas como prova de aceite da nova direção sem atualização de seus pressupostos.

### Revisão com build de produção local

Uma primeira tentativa de teste com `next start` foi interrompida porque o ambiente local estava exigindo passagem pela Cloudflare e devolvia HTTP 403 antes de carregar a home. A configuração de desenvolvimento não tinha esse requisito. O código de proteção não foi alterado.

O servidor de revisão foi reiniciado em loopback com `SITE_CLOUDFLARE_REQUIRED=false` e `TURNSTILE_ENFORCED=false`, flags existentes usadas somente no processo local. Os testes devem ser executados novamente contra esse servidor; registrar os resultados finais abaixo. Isso não modifica configuração remota ou de produção.

Resultado de navegador com build de produção local e configuração corrigida: **26 cenários aprovados** (14 de refinamento, sete da jornada nova e cinco de idiomas). Após a revisão visual, títulos e subtítulos novos em superfícies claras receberam tinta escura local e leitura estática, isolando a paleta das seções em relação ao tema global; a repetição final dos sete cenários da jornada passou (48,2 s), incluindo verificação de contraste e opacidade dos títulos e subtítulos. O build final também passou.

## Capturas

Em `evidencias/`: `antes-mobile.png`, `antes-desktop.png`, `depois-mobile.png` e `depois-desktop.png`; `gestao-390.png` e `gestao-1440.png` mostram a seção após a correção de contraste. Capturas de seção podem incluir a sobreposição do menu flutuante e indicadores de foco do cenário de teste. As capturas iniciais incluem o aviso de cookies; nas posteriores ele foi recusado. São referências de composição, não comparação de velocidade.

As capturas do Orca podem ter dimensões de imagem diferentes do viewport emulado; geometria e ausência de overflow foram verificadas também por testes de navegador. Resultados e capturas adicionais dos testes ficam em `test-results/`.

## Prévia local

URL: `http://localhost:3100` (processo ligado a `127.0.0.1`). CRM de referência continua em `http://localhost:3001`, sem alterações.

Para reproduzir, após o build, executar no diretório `nexos/`:

```sh
SITE_URL=http://localhost:3100 NEXT_PUBLIC_SITE_URL=http://localhost:3100 SITE_CLOUDFLARE_REQUIRED=false TURNSTILE_ENFORCED=false npm run start -- --hostname 127.0.0.1 --port 3100
```

Com esse servidor local ativo:

```sh
PLAYWRIGHT_REUSE_SERVER=true PLAYWRIGHT_CHANNEL=chrome npm run test:browser -- tests/browser/management-journey.spec.ts tests/browser/lab-refinement.spec.ts tests/browser/language-switch.spec.ts
```

## Pendências e próximo passo

- Confirmar escopo, canais, ações e disponibilidade do chatbot antes de publicar card, seção ou o sexto par de comparação.
- Confirmar oferta de biolinks e escopo/disponibilidade/demonstrações de audiovisual com IA antes de ampliar divulgação.
- Confirmar condições de suporte e acompanhamento antes de publicar canais, horários ou prazos.
- Fazer revisão do responsável sobre composição e linguagem da prévia local.
- Medir desempenho comparável antes/depois e testar dispositivos físicos para concluir a auditoria dessa frente.
- Harmonizar as suítes históricas restantes conforme os comportamentos aprovados, preservando testes de acesso e segurança.

Publicação: não realizada. CRM, integrações e dados de clientes: não alterados.

## Correção de identidade visual

O responsável identificou que o lobo cartoon usado nas quatro aparições era incorreto. Os quatro usos foram substituídos pelo símbolo da marca já empregado no menu, com inversão de cor nos fundos escuros. O arquivo legado não foi removido. As capturas anteriores a esta correção são históricas e não representam o símbolo vigente.

## Revisão — telas reais no MacBook

Por solicitação do responsável, o conteúdo desenhado do notebook foi substituído por cinco capturas reais do CRM em `localhost:3001`: pipeline, formulário de agendamento de acompanhamento, lista de clientes, ficha com histórico de vendas e visão financeira. O chassi do MacBook e os cinco botões existentes foram preservados. Cada etapa troca a imagem correspondente, com texto alternativo e link para ampliar a captura.

Capturas realizadas no navegador do Orca em 1200 × 750, com zoom de apresentação de 85%. Dados foram ocultados apenas no DOM local, antes da captura: nomes, contatos, identificadores, valores, margens e informações pessoais do usuário. Não foram enviados formulários nem realizadas gravações no CRM. A página do CRM foi recarregada após o processo, desfazendo a ocultação local.

Os arquivos públicos são somente imagens já revisadas, sem cookies, credenciais ou conexão com o CRM. Não são uma reconstrução de interface. As legendas anteriores de composição ilustrativa foram substituídas pela identificação de telas reais com dados protegidos. Capturas antigas no relatório permanecem como histórico da versão anterior.

Validação desta revisão: build aprovado e sete cenários da jornada aprovados (48,3 s), incluindo as cinco larguras previstas, troca das capturas, carregamento de imagem, movimento reduzido e ausência de JavaScript. Enquadramento inspecionado nas capturas `evidencias/gestao-real-390.png` e `evidencias/gestao-real-1440.png`.

## Revisão — título original com typing

A pedido do responsável, o título do hero voltou a “Seu negócio [conectado / impulsionado / otimizado] em uma aproximação”, usando o componente TextType e suas variações existentes em inglês e espanhol. A descrição sobre gestão, o diagnóstico, os CTAs e o restante da página foram preservados. Movimento reduzido mantém a primeira palavra completa, sem typing. As referências anteriores ao novo título de gestão neste relatório descrevem a versão anterior a essa decisão.

Validação do retorno do título: build aprovado; oito cenários de navegador aprovados, incluindo typing ativo, cinco larguras, três idiomas, movimento reduzido e leitura sem JavaScript. Referência visual: `evidencias/hero-typing-restaurado.png`.

## Revisão — gestão mais enxuta

A pedido do responsável, a apresentação deixou de repetir a gestão em vários blocos extensos. A versão atual tem três benefícios no card do hero, apoio curto e uma demonstração com três entradas: Comercial, Clientes e Financeiro. O título original com typing foi preservado.

A seção independente de comparação foi retirada da composição da home. O destino `#comparacao` foi preservado no controle “Mais sobre a gestão”, que contém uma explicação curta de Retentativas e acesso às capturas adicionais de acompanhamentos e vendas. As cinco capturas reais continuam disponíveis, sem alterar dados do CRM.

O ecossistema apresenta inicialmente site, cardápio e placa. Os demais registros públicos permanecem acessíveis em “Ver todas as soluções”; funcionalidades ainda não confirmadas continuam fora dessa divulgação. A sequência de quatro necessidades foi retirada da apresentação pública para evitar repetição. Os cinco exemplos por segmento passaram a ficar em uma área expansível.

Identidade, contato, rotas, indicação de desenvolvimento do EasyChat e comportamento de movimento reduzido foram preservados. O detalhamento anterior deste relatório é histórico; a direção de leitura enxuta prevalece sobre a composição inicialmente descrita.

Validação da revisão enxuta: tipos e build aprovados; oito cenários de navegador aprovados (56,0 s), cobrindo cinco larguras, typing preservado, três idiomas, três abas de gestão, catálogo e exemplos expansíveis, movimento reduzido e leitura sem JavaScript. Capturas: `evidencias/gestao-enxuta-390.png` e `evidencias/gestao-enxuta-1440.png`.

## Revisão — opção de login visível

O cabeçalho substituía o acesso por um ícone de tentar novamente quando a consulta de sessão falhava. A prévia local não possui DATABASE_URL nem BETTER_AUTH_SECRET configurados; foi verificada apenas a presença das variáveis, sem expor valores. O login de cliente já existe em `/portal/acesso`.

O link “Entrar” agora permanece disponível durante carregamento e erro, preservando o estado real de erro e o controle de tentar novamente. No celular, fica no menu expandido. Estados autenticados e autorização no servidor não foram modificados. Essa correção torna o acesso visível; não configura banco, credenciais ou autenticação local.

Build aprovado e três cenários aprovados: acesso sob falha de sessão em desktop e celular, navegação até o formulário e preservação das restrições de cadastro público e opções sociais.

A pedido do responsável, removido o símbolo isolado acima de “Vamos entender seu próximo passo?”. Build aprovado e prévia local atualizada.
