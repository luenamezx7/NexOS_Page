# EZWAY — Guia mestre de implementação e auditoria do site

## Direção vigente — leitura enxuta

O responsável pediu simplificação da apresentação pública de gestão. Esta revisão prevalece sobre a quantidade de blocos e detalhes prevista abaixo: o conteúdo detalhado do guia é referência interna, não obrigação de mostrar tudo simultaneamente.

- Preservar o título antigo do hero com typing e resumir o apoio.
- Mostrar apenas três benefícios de gestão na abertura.
- Concentrar a demonstração em um único MacBook, com três entradas: Comercial, Clientes e Financeiro, usando telas reais protegidas.
- Manter Retentativas e acesso às telas adicionais em “Mais sobre a gestão”.
- Não reintroduzir a comparação como uma seção extensa e independente.
- Apresentar três soluções complementares inicialmente; manter o catálogo completo em “Ver todas as soluções”.
- Mostrar exemplos por segmento apenas quando o visitante expandir essa opção.
- Evitar repetir as mesmas funções no hero, na demonstração, em comparações e em listas sucessivas.

## 1. Prompt de abertura e regras de trabalho

Você é o agente responsável por auditar e atualizar o site comercial da EZWAY. Trabalhe no repositório fonte do site e siga este documento como orientação comercial, editorial, visual e operacional. A entrega pretendida é uma jornada que apresenta primeiro a organização do negócio e depois atendimento, presença digital e soluções complementares. A conversão principal é iniciar um diagnóstico pelo WhatsApp.

- [ ] Leia as instruções locais, incluindo `AGENTS.md`, e identifique a arquitetura antes de editar.
- [ ] Preserve componentes, estilos e comportamentos que sustentam a identidade: menu flutuante, destaque rosa, alternância entre superfícies escuras e claras, demonstrações em dispositivos e apresentação visual dos produtos.
- [ ] Implemente em etapas pequenas e verificáveis. Registre evidências antes de avançar; não marque uma etapa como concluída com dependências impeditivas abertas.
- [ ] Use o próprio site em funcionamento como referência visual principal e registre URL, viewport e capturas anteriores às alterações. O arquivo **EZway - Performance e Escala -PDF.pdf** é uma exportação do site e foi dispensado pelo responsável; não é uma dependência desta execução. Use o código para compreender o comportamento real.
- [ ] Não reproduza como espaços vazios os estados intermediários de animação capturados no PDF. Inspecione a página em funcionamento para identificar o conteúdo e o estado final.
- [ ] Reaproveite assets, componentes e bibliotecas existentes antes de adicionar dependências.
- [ ] Trabalhe exclusivamente com informações confirmadas sobre as soluções. Registre dúvidas como pendências, sem completar lacunas por inferência.
- [ ] Mantenha domínio e caminhos atuais. Preserve destinos públicos e âncoras existentes; ao reorganizar seções, mantenha a compatibilidade dos links.
- [ ] Restrinja o conteúdo comercial à apresentação das soluções, benefícios e funcionamento, sem preços, valores, descontos, parcelas ou outras informações monetárias.
- [ ] Não altere o CRM nem conecte seus dados automaticamente ao site. Não execute migrações nem publique mudanças como parte deste guia.
- [ ] Prepare uma versão de revisão local e um relatório de alterações, evidências e pendências.

Este guia é autossuficiente e não depende da conversa que o originou. Suas tarefas estão inicialmente abertas: instrução, descrição comercial ou checklist não constituem evidência de execução.

### Contexto técnico inicial, sujeito à conferência

Na preparação deste documento, a aplicação foi localizada em `nexos/`, com Next.js App Router, React, TypeScript, Tailwind e CSS Modules. O manifesto declara GSAP, `@gsap/react`, Lenis e Motion. A composição principal está em `src/app/home-client.tsx`; há configurações comerciais, helpers de contato, componentes de dispositivos, seções de produtos e testes existentes. Confira versões efetivamente instaladas no lockfile e no ambiente antes de implementar.

A documentação local apresenta EasyChat como produto em desenvolvimento, mas há textos que descrevem suas capacidades sem a mesma ressalva. Também documenta uma política de animações completas mesmo com preferência de movimento reduzido. Audite essas divergências: este trabalho exige disponibilidade coerente e apresentação simplificada com movimento reduzido.

O responsável esclareceu que **EZway - Performance e Escala -PDF.pdf** é o próprio site exportado e dispensou sua utilização. A referência passa a ser o site acessível visualmente, com capturas antes/depois. O CRM atual foi indicado em `http://localhost:3001`; inspecione somente em leitura e com sessão autorizada, sem copiar dados reais para o site. A rodada de 15/11/2026 verificou interfaces de gestão e seu registro no catálogo do CRM; fontes, limites da inspeção e aceites estão em `nexos/docs/site-catalogo-conversao/RELATORIO-2026-11-15.md`. Revalide as evidências quando aplicar este guia em outra revisão.

## 2. Contexto da marca, público e comunicação

A EZWAY atende pequenos e médios negócios, empreendedores e prestadores de serviços que precisam organizar a operação, atender melhor e apresentar seu trabalho com clareza.

A comunicação deve partir de quatro necessidades:

- **Organizar:** acompanhar oportunidades, clientes e a rotina financeira.
- **Atender:** dar continuidade às conversas e reduzir tarefas repetitivas.
- **Apresentar:** mostrar serviços, trabalhos e formas de contato.
- **Conectar:** facilitar o caminho entre o interesse do cliente e o próximo passo.

Use linguagem simples, concreta e próxima da rotina desse público. Relacione cada benefício a uma função ou entrega identificável: por exemplo, “acompanhar os próximos retornos” deve estar ligado ao agendamento de acompanhamentos, quando verificado. Evite jargões, superlativos sem prova e promessas de crescimento ou resultados garantidos. O título de abertura é uma direção de marca, não uma garantia de desempenho.

## 3. Catálogo consolidado e fontes de verdade

### Regra de validação

Mantenha separados três tipos de registro:

1. **Funcionalidade verificada no software/CRM:** identificar tela, fluxo, regra e evidência. Isso comprova o comportamento observado, não sua disponibilidade comercial ou integração com outro produto.
2. **Oferta registrada no catálogo comercial:** identificar fonte, responsável pela confirmação, escopo e disponibilidade. Um card publicado não comprova todas as capacidades técnicas sugeridas pelo texto.
3. **Funcionalidade prevista ou conceitual:** identificar como desenvolvimento, prévia ou pendência. Não apresentar como entrega disponível.

Para cada afirmação, registre fonte localizável, data da verificação, situação e limite observado. Use situações como **confirmado**, **em desenvolvimento**, **pendente de validação** e **não aplicável**, distinguindo capacidade técnica de disponibilidade comercial. Havendo contradição, registre-a e obtenha confirmação da equipe responsável antes de ampliar ou substituir a promessa pública.

O catálogo abaixo reúne o direcionamento deste briefing. Ele não comprova, por si, implementação ou disponibilidade. Nos itens sem evidência, preserve a comunicação atual até validação e prossiga apenas nas tarefas independentes. Nenhuma combinação abaixo implica integração automática, inclusão conjunta ou contratação obrigatória.

### 3.1 Controle & Gestão

- **Necessidade:** organizar o acompanhamento comercial, clientes, vendas e rotina financeira.
- **Público:** pequenos e médios negócios, prestadores e equipes com oportunidades e retornos a acompanhar.
- **Entregas a verificar:** leads, contatos, clientes, pipeline, Retentativas, histórico, acompanhamentos, catálogo, vendas e gestão financeira. Estes itens foram informados no briefing; só devem constar como capacidades verificadas após inspeção dos respectivos fluxos.
- **Limites:** não inferir emissão fiscal, integração bancária, conciliação, contabilidade, cobrança automática ou sincronização com outras soluções a partir de “gestão financeira”. Não confundir retentativas de notificações técnicas com a área comercial de Retentativas.
- **Exemplo ilustrativo:** registrar uma oportunidade, agendar retorno, consultar o histórico, registrar uma venda e acompanhar a informação financeira que o sistema efetivamente disponibilizar.
- **Relações:** pode compor uma jornada com presença digital e atendimento; confirmar separadamente qualquer transferência de dados.
- **Disponibilidade:** na inspeção autenticada de 15/11/2026 foram observadas interfaces de Prospecções, Pipeline com Retentativas, histórico, agendamento, Clientes, vendas, catálogo e visão financeira; Controle & Gestão também está registrado no catálogo do CRM. A inspeção foi somente de leitura, sem executar gravações. Confirme o escopo e a disponibilidade para cada cliente; esse registro não comprova integrações automáticas.

### 3.2 Chatbot de atendimento

- **Necessidade:** automatizar partes definidas do atendimento e reduzir perguntas repetitivas.
- **Público:** negócios com dúvidas recorrentes e fluxos de atendimento delimitáveis.
- **Entregas:** descrever atendimento automatizado somente no escopo confirmado. Canais, integrações, ações e encaminhamento humano precisam de validação individual.
- **Limites:** não prometer atendimento em todos os canais, resolução integral, disponibilidade contínua, pagamentos, agendamentos ou atualização do CRM sem confirmação.
- **Exemplo ilustrativo:** responder perguntas frequentes e indicar o próximo contato, se esse fluxo for confirmado.
- **Relações:** complementar organização e presença digital; não presumir compartilhamento de histórico.
- **Disponibilidade:** pendente de confirmação de oferta, canal e demonstração.

### 3.3 EasyChat

- **Necessidade:** apoiar a rotina administrativa com um assistente de IA.
- **Público:** empreendedores, escritórios e operações com tarefas administrativas recorrentes.
- **Entregas:** apresentar como projeto de assistente administrativo com IA. Textos e prévias existentes sobre documentos, notas fiscais, arquivos, lembretes ou WhatsApp devem ser classificados como previstos até validação funcional e comercial.
- **Limites:** uma conversa ilustrativa não comprova geração, envio, emissão, armazenamento ou integração efetiva. Não prometer automação autônoma ou eliminar revisão humana de documentos.
- **Exemplo ilustrativo:** prévia de solicitação e revisão de um documento, identificada como conceitual e sem sugerir serviço disponível.
- **Relações:** possível evolução da organização administrativa; não inferir integração com Controle & Gestão ou chatbot.
- **Disponibilidade:** **em desenvolvimento**, conforme documentação local; preservar essa indicação até confirmação explícita de disponibilidade.

### 3.4 Sites vitrine e institucionais

- **Necessidade:** apresentar a empresa, seus serviços e formas de contato.
- **Público:** negócios que precisam de uma presença digital clara.
- **Entregas:** apresentação institucional, serviços e contato; há registro dessa frente na configuração comercial, sujeito à conferência do escopo vigente.
- **Limites:** não incluir automaticamente loja, área restrita, agendamento, integrações, manutenção ou produção contínua de conteúdo.
- **Exemplo ilustrativo:** empresa de serviços com apresentação, áreas de atuação e caminho para conversar.
- **Relações:** pode receber acessos de biolinks, NFC e QR Code; formulários e integrações exigem escopo confirmado.
- **Disponibilidade:** oferta registrada no site; confirmar condições atuais antes de publicar detalhes novos.

### 3.5 Portfólios

- **Necessidade:** apresentar trabalhos e projetos de forma organizada.
- **Público:** profissionais e empresas cujo trabalho pode ser demonstrado visualmente.
- **Entregas:** apresentação de projetos, trabalhos e contato, conforme escopo validado; frente citada na configuração comercial.
- **Limites:** não presumir painel de edição, acervo ilimitado, produção de imagens ou atualização contínua.
- **Exemplo ilustrativo:** profissional apresentando projetos por tipo de serviço.
- **Relações:** acesso por site, biolink, NFC ou QR Code; destinos não implicam sincronização.
- **Disponibilidade:** oferta registrada; confirmar escopo e demonstrações publicáveis.

### 3.6 Landing pages

- **Necessidade:** apresentar uma oferta ou objetivo específico com um próximo passo claro.
- **Público:** negócios com uma campanha, serviço ou ação definida.
- **Entregas:** página focada em um objetivo, apresentação e CTA; frente registrada na configuração comercial.
- **Limites:** não garantir conversão nem incluir automaticamente mídia paga, testes de campanha, CRM ou automação.
- **Exemplo ilustrativo:** página de um serviço com explicação e convite para contato.
- **Relações:** pode ser destino de campanhas, biolinks e placas; confirmar captação e encaminhamento de dados separadamente.
- **Disponibilidade:** oferta registrada; validar escopo vigente.

### 3.7 Cardápios digitais

- **Necessidade:** permitir consulta organizada de itens e informações.
- **Público:** negócios de alimentação e estabelecimentos com itens a apresentar.
- **Entregas:** apresentação organizada do cardápio, conforme escopo confirmado; frente registrada na configuração comercial.
- **Limites:** não pressupor pedidos, entrega, pagamento, estoque, atualização pelo cliente ou integração com cozinha. Nesta atualização, demonstrações e textos públicos não devem exibir informações monetárias.
- **Exemplo ilustrativo:** visitante acessa categorias e descrições por QR Code.
- **Relações:** destino possível de placa NFC, QR Code, site ou biolink.
- **Disponibilidade:** oferta registrada; confirmar recursos e demonstrações atuais.

### 3.8 Biolinks

- **Necessidade:** concentrar os principais destinos digitais.
- **Público:** profissionais e negócios com vários canais e links relevantes.
- **Entregas:** página de destinos prioritários, conforme validação comercial.
- **Limites:** não presumir analytics, painel próprio, integrações ou edição autônoma.
- **Exemplo ilustrativo:** reunir site, portfólio e contato em uma página.
- **Relações:** pode ser destino de NFC e QR Code e encaminhar para outras presenças digitais.
- **Disponibilidade:** incluído neste catálogo por direcionamento do briefing; confirmar oferta e escopo.

### 3.9 Placas NFC com QR Code

- **Necessidade:** facilitar acesso ao destino digital escolhido.
- **Público:** negócios com atendimento presencial, balcões ou pontos de contato físicos.
- **Entregas:** placa com acesso por aproximação NFC compatível ou leitura de QR Code; oferta registrada no projeto.
- **Limites:** aproximação depende do dispositivo e de suas configurações; o destino digital pode exigir conexão. Confirmar personalização, alteração do destino, produção, entrega e instalação. Não prometer edição remota irrestrita ou captura automática de dados.
- **Exemplo ilustrativo:** pessoa acessa um cardápio ou contato a partir da placa.
- **Relações:** direcionamento para site, portfólio, cardápio, biolink ou outro destino confirmado, sem implicar integração entre sistemas.
- **Disponibilidade:** oferta registrada; validar variantes, condições e destinos suportados.

### 3.10 Conteúdo audiovisual com IA

- **Necessidade:** apoiar a apresentação visual de uma empresa, serviço ou proposta.
- **Público:** negócios que precisam comunicar uma ideia em formato audiovisual.
- **Entregas:** registrar a frente indicada no material de referência. Validar escopo, formatos, demonstrações e disponibilidade antes de ampliar sua divulgação.
- **Limites:** não deduzir oferta comercial a partir de um vídeo ou asset existente. Não prometer formatos, direitos de uso, revisões, prazo ou realismo sem confirmação.
- **Exemplo ilustrativo:** peça de apresentação de um serviço, apenas como hipótese de aplicação até validação.
- **Relações:** pode compor páginas e portfólios conforme escopo; não é item automaticamente incluído nessas entregas.
- **Disponibilidade:** pendente de validação do material e da equipe responsável.

### 3.11 Suporte e acompanhamento

- **Necessidade:** orientar o cliente durante a implementação e no acompanhamento acordado.
- **Público:** clientes das soluções, conforme condições de cada entrega.
- **Entregas:** explicar a participação da equipe no diagnóstico, definição e implementação; confirmar o acompanhamento efetivamente oferecido.
- **Limites:** publicar canais, horários, prazos de resposta, manutenção, treinamento, revisões e duração somente após confirmação. Não sugerir suporte ilimitado ou inclusão universal.
- **Exemplo ilustrativo:** equipe acompanha a revisão de uma entrega e orienta seu uso, se previsto no escopo validado.
- **Relações:** vinculado às condições de cada solução, sem presumir um serviço idêntico para todas.
- **Disponibilidade:** participação e condições específicas pendentes de validação.

## 4. Soluções de entrada e evolução por necessidade

- **Presença e acesso:** biolinks, placas NFC, cardápios, sites e portfólios. Landing pages atendem objetivos específicos de apresentação e contato.
- **Organização e relacionamento:** gestão comercial, clientes, vendas, acompanhamentos e atendimento, conforme capacidades confirmadas.
- **Automação e evolução:** EasyChat, mantendo o estado de desenvolvimento, e outros recursos avançados efetivamente confirmados.

O visitante pode começar por uma necessidade específica e evoluir conforme sua operação. Essas categorias orientam a compreensão, não criam pacotes comerciais. Nenhuma solução é obrigatória, automaticamente incluída ou integrada a outra. A prioridade editorial em gestão não impede uma entrada por presença digital ou acesso físico.

## 5. Guia operacional de implementação por etapas

### Etapa 1 — Auditoria do projeto fonte

**Objetivo:** conhecer o estado real e produzir a referência anterior às alterações.

**Dependências:** acesso ao código, instruções locais e ambiente de execução. Site em funcionamento disponível para capturas visuais; PDF dispensado pelo responsável.

**Tarefas**
- [ ] Identificar framework, rotas, componentes, estilos, assets e dependências, incluindo versões instaladas.
- [ ] Mapear GSAP, ScrollTrigger, Motion, Web Animations API, Lenis e outros mecanismos de animação ou rolagem.
- [ ] Inventariar seções, navegação, âncoras, CTAs, formulários e destinos de contato.
- [ ] Capturar a página atual em desktop e celular, anotando viewport e estado da animação.
- [ ] Registrar a referência visual do site e localizar assets do avatar; distinguir ausência de recurso de conteúdo oculto por animação.
- [ ] Registrar o que manter, adaptar, acrescentar ou consolidar, com justificativa ligada a este guia.

**Evidência:** mapa da página, inventário técnico, caminhos das referências e capturas anteriores às mudanças.

**Critério de aceite:** mapa e referências visuais disponíveis antes da primeira alteração; ausências explicitadas e nenhuma fidelidade visual alegada sem referência.

### Etapa 2 — Auditoria editorial e comercial

**Objetivo:** conhecer a origem e a situação de cada afirmação sobre as soluções.

**Dependências:** inventário da etapa 1, catálogo deste guia e acesso às fontes técnicas e comerciais disponíveis.

**Tarefas**
- [ ] Confrontar textos atuais com as 11 soluções do catálogo, incluindo FAQ, metadados e mensagens de contato.
- [ ] Identificar informações desatualizadas, funcionalidades previstas, promessas sem origem e contradições.
- [ ] Verificar capacidades do Controle & Gestão nos fluxos reais, sem modificar dados ou regras do CRM.
- [ ] Validar separadamente oferta comercial, disponibilidade, demonstrações e condições de suporte.
- [ ] Identificar imagens ilustrativas, prévias e exemplos que precisam de rótulo explícito.
- [ ] Registrar fonte, data, situação e pendência de cada afirmação; manter o texto atual nos pontos ainda dependentes de confirmação.

**Evidência:** registro de afirmações e fontes, divergências encontradas e pendências com responsável a confirmar.

**Critério de aceite:** cada afirmação possui origem e situação conhecidas, inclusive quando pendente; nenhuma pendência é convertida em promessa disponível.

### Etapa 3 — Estrutura centralizada de conteúdo

**Objetivo:** estabelecer uma fonte única para informações repetidas, conforme a arquitetura encontrada.

**Dependências:** etapas 1 e 2; regras locais de tipos, conteúdo e idiomas.

**Tarefas**
- [ ] Reaproveitar a organização existente de configuração ou conteúdo; evitar uma segunda fonte concorrente.
- [ ] Definir um contrato por solução com identificador, nome, categoria e estágio de evolução.
- [ ] Incluir necessidade, público, benefícios ligados às funcionalidades, entregas confirmadas e limitações.
- [ ] Incluir disponibilidade, fonte de validação, asset, texto alternativo, texto do CTA e contexto enviado ao WhatsApp.
- [ ] Distinguir estágio de evolução da necessidade e situação de disponibilidade do produto.
- [ ] Manter rastreabilidade técnica/comercial interna fora da interface pública; disponibilizar ao visitante somente a ressalva necessária à sua decisão.
- [ ] Alimentar navegação, cards e detalhes pela fonte central; revisar idiomas existentes para evitar contradições após alterações.

**Evidência:** contrato implementado, registros de conteúdo e exemplos de consumo pelos componentes.

**Critério de aceite:** navegação, cards e detalhes apresentam informações consistentes; nenhum dado pendente aparece como entrega confirmada.

### Etapa 4 — Nova hierarquia da página

**Objetivo:** conduzir a leitura da gestão para as soluções complementares.

**Dependências:** etapas 1 a 3 e mapeamento dos componentes reutilizáveis.

**Tarefas**
- [ ] Adotar a sequência editorial abaixo, reaproveitando e reposicionando seções existentes:
  1. Abertura com gestão como principal benefício.
  2. Demonstração do Controle & Gestão.
  3. Comparação “Sem EZWAY / Com EZWAY”.
  4. Visão do ecossistema e necessidades atendidas.
  5. Atendimento e chatbot.
  6. EasyChat e evolução da rotina administrativa.
  7. Presença digital e demonstrações em dispositivos.
  8. Placas NFC, QR Code e conexões com destinos digitais.
  9. Exemplos por tipo de negócio.
  10. Processo de diagnóstico, implementação e acompanhamento.
  11. Evidências e demonstrações disponíveis.
  12. Perguntas frequentes.
  13. Convite final para diagnóstico.
- [ ] Representar audiovisual com IA e suporte no ecossistema e nos detalhes pertinentes, respeitando sua validação.
- [ ] Atualizar navegação e transições para a nova sequência, preservando destinos e identidade visual.
- [ ] Consolidar repetições e manter uma hierarquia coerente de títulos.
- [ ] Não preencher a seção de evidências com números, logos, depoimentos ou casos inventados; usar somente demonstrações verificadas e identificadas.

**Evidência:** mapa novo comparado ao inventário inicial e captura da sequência implementada.

**Critério de aceite:** o visitante entende primeiro como organizar o negócio e depois como combinar soluções; mudanças de posição mantêm a linguagem visual reconhecível.

### Etapa 5 — Primeira dobra

**Objetivo:** comunicar gestão de forma imediata e conduzir ao diagnóstico.

**Dependências:** hierarquia definida, capacidades de gestão validadas e assets inventariados.

**Tarefas**
- [ ] Preservar a revisão solicitada pelo responsável: título **“Seu negócio [conectado / impulsionado / otimizado] em uma aproximação”**, com o componente de typing existente e versões localizadas. Gestão continua prioritária no apoio e na demonstração. Com movimento reduzido, mostrar a primeira palavra completa.
- [ ] Escrever apoio relacionando acompanhamento comercial, clientes e rotina financeira, limitado às capacidades verificadas.
- [ ] Apresentar atendimento, presença digital e conexões como continuidade dessa organização.
- [ ] Usar CTA principal **“Conversar sobre meu negócio”**, abrindo o WhatsApp com contexto de diagnóstico.
- [ ] Usar CTA secundário **“Conhecer as soluções”**, levando à visão do ecossistema.
- [ ] Priorizar visual de gestão e usar o avatar como apresentação, sem cobrir mensagem ou botões.
- [ ] Garantir texto, CTAs e visual significativo antes da animação e em sua ausência.

**Evidência:** capturas da primeira dobra em desktop e celular, incluindo estado inicial e movimento reduzido.

**Critério de aceite:** gestão é compreensível antes das animações; os dois próximos passos estão visíveis e funcionam.

### Etapa 6 — Demonstração de gestão

**Objetivo:** tornar capacidades reais compreensíveis por meio de um fluxo demonstrativo.

**Dependências:** verificação funcional da etapa 2 e material demonstrativo autorizado, sem dados reais de clientes.

**Tarefas**
- [ ] Apresentar **Oportunidade → acompanhamento → cliente → venda → visão financeira**, conforme o comportamento real.
- [ ] Demonstrar reaproveitamento de oportunidades em **Retentativas**, após validar sua regra e fluxo.
- [ ] Reutilizar a linguagem de notebook existente quando compatível com a composição.
- [ ] Usar capturas reais da interface do CRM no mockup, conforme a orientação atual do responsável. Ocultar nomes, contatos, identificadores e valores antes de capturar, sem modificar registros. Identificar as telas como reais com dados sensíveis ocultados; exemplos adicionais com dados fictícios devem manter sua identificação.
- [ ] Não exibir valores monetários nas capturas; usar enquadramento ou composição demonstrativa fiel, sem inventar recursos para ocultar limitações.
- [ ] Diferenciar uma demonstração visual de um sistema operacional conectado ao site.
- [ ] Se faltar comprovação de um recurso, registrar a pendência e não produzir uma simulação que o apresente como disponível.

**Evidência:** roteiro da demonstração, origem de cada recurso e capturas com indicação de dados fictícios.

**Critério de aceite:** cada recurso demonstrado corresponde ao que existe no software; demonstração não expõe dados privados nem implica integração automática.

### Etapa 7 — Comparação “Sem EZWAY / Com EZWAY”

**Objetivo:** explicar a mudança por mecanismos concretos e situações equivalentes.

**Dependências:** capacidades e escopos correspondentes validados nas etapas 2 e 6.

**Tarefas**
- [ ] Implementar os pares abaixo, publicando cada mecanismo somente após confirmação:
  - Contatos espalhados → histórico organizado.
  - Retornos dependentes da memória → acompanhamentos agendados.
  - Recusas sem continuidade → oportunidades separadas para retentativa.
  - Vendas e recebimentos desconectados → visão organizada da operação.
  - Serviços apresentados em vários lugares → presença digital com caminhos claros.
  - Perguntas repetitivas → automação compatível com o atendimento definido.
- [ ] Exibir lado a lado no desktop e em sequência claramente identificada no celular, mantendo a correspondência de cada par.
- [ ] Esclarecer que os cenários dependem das soluções escolhidas e do escopo, sem sugerir inclusão de todo o ecossistema.
- [ ] Usar animação apenas para destacar a mudança; manter ambos os estados legíveis sem interação.
- [ ] Evitar estatísticas, garantias, depoimentos inventados e associação indevida entre registros financeiros e integração bancária.

**Evidência:** comparação por breakpoint e rastreabilidade dos mecanismos demonstrados; pares ainda pendentes registrados internamente.

**Critério de aceite:** contraste compreensível, correspondência entre problema e solução e nenhuma promessa superior ao escopo confirmado.

### Etapa 8 — Cards e detalhes do catálogo

**Objetivo:** diferenciar soluções e orientar quando cada uma faz sentido.

**Dependências:** fonte centralizada e inventário de componentes e assets.

**Tarefas**
- [ ] Padronizar cada apresentação com: para quem serve, necessidade, entrega, exemplo, relação com outras soluções e próximo passo.
- [ ] Representar todas as 11 soluções, usando disponibilidade e ressalvas coerentes; itens pendentes não devem receber novas promessas públicas.
- [ ] Para itens ainda não divulgáveis, manter o registro completo no catálogo interno e explicitar a pendência no relatório, sem inventar uma oferta para completar a página.
- [ ] Reaproveitar cards, dispositivos, imagens e componentes existentes; consolidar duplicações.
- [ ] Explicar relações como combinação possível ou destino de acesso; usar “integração” apenas quando comprovada.
- [ ] Manter estados de desenvolvimento claros no card, detalhe, demonstração e CTA correspondente.

**Evidência:** inventário das apresentações e capturas de cards e detalhes, com pendências de publicação identificadas.

**Critério de aceite:** soluções diferenciáveis, catálogo integralmente rastreado e nenhuma ampliação de divulgação sem validação.

### Etapa 9 — Exemplos por segmento

**Objetivo:** traduzir soluções em situações próximas do público.

**Dependências:** catálogo validado e apresentação clara dos limites das combinações.

**Tarefas**
- [ ] Identificar a seção e seus cenários como **“Exemplos ilustrativos”**, sem nomes, logos ou resultados que sugiram clientes reais.
- [ ] Prestadores de serviços: apresentar trabalhos e acompanhar interessados; exemplo com portfólio ou site e gestão, conforme disponibilidade.
- [ ] Pequenos comércios: facilitar contato e organizar retornos; exemplo com biolink ou placa e acompanhamento comercial confirmado.
- [ ] Negócios de alimentação: facilitar consulta de itens; exemplo com cardápio e NFC ou QR Code, sem presumir pedidos ou pagamentos.
- [ ] Escritórios e operações administrativas: organizar clientes e tarefas; incluir EasyChat apenas como possibilidade em desenvolvimento.
- [ ] Empresas em expansão: apresentar serviços e organizar oportunidades; exemplo com site ou landing page e gestão validada.
- [ ] Associar cada exemplo a uma necessidade principal e esclarecer que combinações não pressupõem integração nem contratação conjunta.

**Evidência:** cinco cenários publicados com identificação ilustrativa e correspondência ao catálogo.

**Critério de aceite:** exemplos explicam aplicações coerentes sem parecer casos reais nem antecipar disponibilidade.

### Etapa 10 — Uso do avatar

**Objetivo:** usar o avatar como guia narrativo da jornada.

**Dependências:** inventário do modelo fornecido, variações, formatos, dimensões e tecnologia existente.

**Tarefas**
- [ ] Inspecionar os assets antes de definir a integração; se ausentes, registrar a pendência sem substituir a identidade por um personagem novo.
- [ ] Planejar quatro aparições: apresentar a proposta na abertura; orientar a comparação; conectar evolução entre necessidades e soluções; convidar para o diagnóstico final.
- [ ] Reutilizar asset e tecnologia disponíveis, priorizando posição, escala e composição antes de criar novas variações.
- [ ] Reservar dimensões e espaço para evitar mudanças inesperadas de layout.
- [ ] Definir texto alternativo quando informativo e tratamento decorativo quando repetir a mensagem textual.
- [ ] Verificar sobreposição, foco, áreas de toque e comportamento estático com movimento reduzido.

**Evidência:** inventário e capturas das quatro aparições, com sua função narrativa registrada.

**Critério de aceite:** o avatar acompanha a narrativa sem cobrir conteúdo ou controles; compreensão independe de movimento.

### Etapa 11 — Processo e acompanhamento

**Objetivo:** explicar como o trabalho começa e será conduzido.

**Dependências:** confirmação do processo comercial, entregas e condições de acompanhamento.

**Tarefas**
- [ ] Adaptar a jornada para **Diagnóstico → definição da solução → implementação → acompanhamento**.
- [ ] No diagnóstico, explicar a conversa para entender rotina, necessidade e objetivo.
- [ ] Na definição, explicar o alinhamento de solução, escopo e disponibilidade.
- [ ] Na implementação, explicar a preparação da entrega e os pontos de revisão confirmados com o cliente.
- [ ] No acompanhamento, descrever somente a participação efetivamente oferecida pela equipe.
- [ ] Preservar explicação específica de personalização, produção e entrega física das placas quando aplicável e confirmada.
- [ ] Não publicar prazos, canais, revisões, manutenção ou suporte contínuo sem fonte validada.

**Evidência:** jornada revisada e referências de confirmação do processo e das condições publicadas.

**Critério de aceite:** o visitante entende os próximos passos e o que acompanha em cada etapa, sem condições presumidas.

### Etapa 12 — CTAs e contato

**Objetivo:** abrir uma conversa com intenção e contexto preservados.

**Dependências:** configuração comercial vigente, helpers e instrumentação existentes inventariados.

**Tarefas**
- [ ] Reutilizar o contato comercial confirmado na configuração do projeto; não espalhar números fixos por componentes.
- [ ] Gerar links de WhatsApp pelo helper existente ou adaptação mínima equivalente, com mensagem codificada corretamente.
- [ ] Diferenciar mensagens por solução e manter uma mensagem geral para quem ainda não sabe o que escolher.
- [ ] Usar como direção de mensagem geral: “Olá! Vim pelo site da EZWAY e gostaria de conversar sobre meu negócio para entender qual solução faz sentido.”
- [ ] Para uma solução confirmada, indicar interesse pelo nome; para EasyChat, indicar interesse em conhecer o projeto em desenvolvimento, sem solicitar ativação imediata.
- [ ] Inserir CTAs após os principais blocos de entendimento e no encerramento, mantendo o diagnóstico como conversão principal.
- [ ] Abrir a conversa sem enviar mensagens automaticamente; o envio é uma ação do visitante.
- [ ] Reaproveitar instrumentação para identificar seção e solução de origem; não inventar eventos ou provedores desnecessários nem incluir dados privados no rastreamento.
- [ ] Testar destino, texto, acentuação, navegação por teclado e comportamento no celular; não enviar mensagem real durante a verificação.

**Evidência:** inventário dos CTAs, destinos e mensagens resolvidas, com registros da instrumentação existente quando disponível.

**Critério de aceite:** todos os caminhos de contato abrem o destino correto e preservam o contexto, sem envio automático.

### Etapa 13 — GSAP, ScrollTrigger e rolagem

**Objetivo:** manter leitura, foco e navegação estáveis durante a animação.

**Dependências:** inventário técnico, sequência de seções e conhecimento da versão instalada. Consultar documentação oficial compatível: [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [gsap.matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/) e [ScrollTrigger.refresh](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh%28%29/).

**Tarefas**
- [ ] Inventariar timelines, triggers, pins e propriedades controladas antes de acrescentar novos efeitos.
- [ ] Isolar animações por seção e limpar timelines, triggers, listeners e efeitos ao desmontar ou mudar de condição, seguindo os padrões da integração instalada.
- [ ] Adaptar comportamento por breakpoint e preferência de movimento; usar `gsap.matchMedia` conforme a versão instalada e sua documentação.
- [ ] Recalcular posições após alterações relevantes de layout e carregamento de assets com o mecanismo documentado de refresh, evitando chamadas contínuas desnecessárias.
- [ ] Preservar leitura, foco visível, ordem de navegação e acesso aos controles em trechos fixados.
- [ ] Evitar dois sistemas controlando simultaneamente a mesma propriedade ou a rolagem; conferir a coordenação com Lenis ou equivalente existente.
- [ ] Simplificar composição e movimento no celular e com movimento reduzido, incluindo remoção de fixações que prejudiquem leitura.
- [ ] Garantir conteúdo essencial visível se animação ou carregamento de JavaScript falhar; evitar estados iniciais permanentemente ocultos.
- [ ] Testar ida e volta da rolagem, redimensionamento, mudança de preferência, navegação de retorno e acesso direto por âncora.
- [ ] Não reconstruir espaços vazios do PDF como se fossem seções de conteúdo.

**Evidência:** inventário de controle de animações e registros dos cenários, incluindo movimento reduzido e falha de animação.

**Critério de aceite:** leitura e navegação estáveis em todos os modos previstos, sem conteúdo preso, invisível ou inacessível.

### Etapa 14 — Responsividade, acessibilidade e desempenho

**Objetivo:** preservar conteúdo essencial acessível, legível e funcional em diferentes dispositivos.

**Dependências:** composição e animações implementadas; capturas e referência de desempenho anteriores.

**Tarefas**
- [ ] Verificar larguras de **360, 390, 768, 1024 e 1440 pixels**, com viewport e ambiente registrados.
- [ ] Conferir quebras de texto, contrastes, foco, teclado, áreas de toque, rótulos, textos alternativos e hierarquia de títulos.
- [ ] Verificar menu flutuante, CTAs e âncoras sem sobreposição de conteúdo ou foco.
- [ ] Eliminar rolagem horizontal involuntária, recortes de texto e controles fora da tela.
- [ ] Dimensionar imagens, vídeos e avatar por dispositivo, reservando proporções e usando alternativas leves onde necessário.
- [ ] Carregar recursos pesados próximos ao uso; preservar prioridade do conteúdo essencial da primeira dobra.
- [ ] Comparar comportamento e desempenho com a versão inicial usando o mesmo ambiente; registrar regressões, causas e limites da medição.
- [ ] Verificar movimento reduzido e ausência de dependência de hover para informações essenciais.

**Evidência:** capturas nas cinco larguras, registro de navegação por teclado e comparação de desempenho nas mesmas condições.

**Critério de aceite:** conteúdo essencial legível, acessível e funcional no celular, sem regressões de desempenho relevantes sem resolução ou registro explícito.

### Etapa 15 — Auditoria editorial final

**Objetivo:** eliminar contradições e promessas sem sustentação na versão de revisão.

**Dependências:** conteúdo consolidado e implementação das seções disponíveis; registro atualizado de fontes e pendências.

**Tarefas**
- [ ] Revisar navegação, títulos, catálogo, demonstrações, FAQ, metadados e mensagens de contato, incluindo idiomas existentes afetados.
- [ ] Confirmar gestão como prioridade e representação de todo o catálogo, distinguindo publicação validada de pendência interna.
- [ ] Conferir disponibilidade coerente de soluções avançadas e indicação de desenvolvimento do EasyChat.
- [ ] Verificar função narrativa de cada aparição do avatar.
- [ ] Conferir correspondência entre problemas e mecanismos na comparação.
- [ ] Confirmar identificação de exemplos ilustrativos, dados fictícios e prévias conceituais.
- [ ] Remover informações monetárias do conteúdo desta atualização, inclusive de assets demonstrativos e metadados afetados.
- [ ] Eliminar garantias, provas inventadas e sugestões de integrações ou inclusões não confirmadas.
- [ ] Se uma nova evidência invalidar uma premissa, corrigir o conteúdo dependente e repetir apenas as verificações afetadas.

**Evidência:** checklist editorial preenchido e registro de afirmações conciliado com a versão de revisão.

**Critério de aceite:** nenhuma contradição entre seções ou promessa sem sustentação; pendências não são apresentadas como capacidades disponíveis.

### Etapa 16 — Verificação e entrega

**Objetivo:** entregar uma versão revisável acompanhada de evidências e limitações claras.

**Dependências:** etapas aplicáveis verificadas e pendências classificadas; ambiente local de revisão disponível.

**Tarefas**
- [ ] Identificar e executar checks existentes pertinentes às mudanças: tipos, lint, testes locais e regressões de navegador; validar build.
- [ ] No projeto inicialmente inspecionado, conferir scripts `typecheck`, `lint`, `test:unit`, `build` e `test:browser`; selecionar cenários existentes afetados antes de criar novos testes.
- [ ] Não executar testes de produção, integrações com serviços reais ou scripts de migração apenas para validar conteúdo e layout.
- [ ] Conferir console e erros de carregamento e percorrer a página em desktop e celular.
- [ ] Testar CTAs sem envio real, âncoras, menus, demonstrações, movimento reduzido e estados de falha de animação.
- [ ] Comparar capturas anteriores e posteriores, identificando viewport, seção e estado.
- [ ] Registrar alterações, comandos, resultados, evidências, pendências e bloqueios. Diferenciar falha introduzida de falha preexistente.
- [ ] Preparar versão de revisão local antes de qualquer publicação; não fazer deploy como parte desta execução.
- [ ] Marcar uma etapa como concluída somente quando seu aceite estiver demonstrado; registrar conclusão parcial ou bloqueio quando faltar evidência.

**Evidência:** relatório final, resultados dos checks, capturas comparativas e localização da versão de revisão.

**Critério de aceite:** cada etapa concluída tem evidência; pendências e impactos estão explícitos; versão revisável preparada sem publicação.

## 6. Limites e tratamento de pendências

Este documento prepara instruções para o site. Sua criação não altera o CRM, não conecta dados ao site e não publica mudanças. A execução futura também deve respeitar esses limites, salvo autorização específica posterior.

Registre capacidades e disponibilidade não confirmadas como pendências, preservando a comunicação atual até validação. Uma pendência deve indicar informação necessária, fonte ou responsável a consultar, tarefa dependente e efeito sobre o aceite. Continue tarefas independentes, mas não substitua evidência ausente por uma demonstração inventada.

Pendências iniciais a conferir:

- [ ] Capturar o próprio site como referência visual; o PDF exportado foi dispensado pelo responsável.
- [ ] Revalidar os fluxos de Controle & Gestão observados na rodada de 15/11/2026 e confirmar escopo e disponibilidade para o cliente, sem presumir integrações.
- [ ] Confirmar oferta, canais, integrações e ações específicas do chatbot.
- [ ] Conciliar textos de EasyChat mantendo a indicação de desenvolvimento até confirmação.
- [ ] Validar biolinks, audiovisual com IA, respectivas demonstrações e condições específicas de suporte.
- [ ] Inventariar avatar e variações, sem presumir formatos ou assets fornecidos.
- [ ] Conciliar a política existente de animações com a apresentação simplificada para movimento reduzido.

## 7. Prompt curto para iniciar a auditoria

> Trabalhe no repositório fonte do site EZWAY. Leia as instruções locais e o arquivo EZWAY-GUIA-MESTRE-SITE-CATALOGO-CONVERSAO.md. Comece pelas etapas 1 e 2, sem editar o site: identifique arquitetura, seções, animações, contato comercial e fontes das afirmações; use o próprio site como referência visual (PDF dispensado); capture desktop e celular. Entregue mapa atual, inventário do que manter/adaptar/acrescentar/consolidar e registro de capacidades, disponibilidade e pendências. Não altere CRM, não integre dados e não publique. Avance para implementação apenas após cumprir os aceites necessários, mantendo relatório por etapa.

## 8. Modelo de relatório para próximas execuções

Copie o modelo a cada execução. Utilize caminhos ou links verificáveis; não registre credenciais nem dados privados.

```markdown
# Relatório de execução — EZWAY

Data e responsável:
Repositório e revisão/commit de referência:
Objetivo desta execução:
Ambiente, dispositivos/viewports e preferências de movimento:
URL do site de referência e localização das capturas:
Localização da versão de revisão, quando disponível:

## Etapas trabalhadas

### Etapa [número] — [nome]
Situação: não iniciada | em andamento | concluída | bloqueada
Objetivo:
Dependências e situação:

- [ ] Tarefa executada e verificada [descrever; marcar somente com evidência]
- [ ] Critério de aceite demonstrado [descrever]

Alterações realizadas ou decisão de preservar:
Fontes consultadas e data de validação:
Capacidades técnicas verificadas:
Disponibilidade comercial confirmada ou pendente:
Evidências [capturas, caminhos, links e condições de reprodução]:
Comandos/checks executados e resultados:
Falhas preexistentes, novas falhas e limitações:
Conclusão do aceite e justificativa:

## Pendências

### [Identificador e assunto]
Informação ou evidência necessária:
Fonte/responsável a consultar:
Capacidade ou disponibilidade envolvida:
Tarefas dependentes e impacto no aceite:
Comunicação atual preservada:
Próxima ação:

## Encerramento da execução

Etapas concluídas com evidência:
Etapas parciais ou bloqueadas:
Comparação antes/depois e regressões encontradas:
Próximo passo e dependências:
Situação de revisão:
Publicação: não realizada
CRM e integrações de dados: não alterados
```
