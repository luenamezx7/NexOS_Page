# Revisão de movimento, superfícies e composição

Data: 17/11/2026. Estado: alterações no checkout local compartilhado, sem publicação.

## Objetivo

Manter as coreografias da página em dispositivos fracos, integrar o GradientWave no MacBook, consolidar preto OLED e limpar a apresentação comercial. O pedido mais recente define movimento completo, inclusive sob a preferência de redução informada pelo sistema. O avatar permanece estático, conforme orientação específica anterior.

## Achados e correções

| Área | Achado | Correção |
| --- | --- | --- |
| Abertura | O contador acumulava no máximo 64 ms por frame. Em baixa taxa de frames, 1,85 s de animação podiam durar muito mais tempo e atrasar as cenas dependentes da abertura. | Usar tempo real, atualizar somente o nó do contador e limitar a espera da saída. O wordmark não é renderizado novamente a cada incremento. |
| Política de movimento | JS e CSS consultavam preferências em vários pontos. O snapshot inicial do hook também começava reduzido antes de hidratar. | Política central de movimento completo, hook compatível e pipeline CSS que ativa regras de movimento preservando breakpoints e cores forçadas. A API nativa do navegador não é alterada. |
| Filtros de página | Várias camadas de backdrop-filter eram compostas sobre a página inteira, inclusive sobre texto e dispositivos. | Removida a sobreposição global da home. A navegação continua com as mesmas cenas e movimentos; superfícies pretas usam fundo opaco. |
| Gestão em janelas menores | Capítulos automáticos existiam apenas na condição de pin de desktop grande. | Capítulos por scroll também no fluxo normal, sem impor o layout fixo em telas sem espaço. |
| Fundo do MacBook | O código fornecido media a janela, não liberava todo recurso e sobrescrevia objetos de uniform com valores simples. A paleta padrão tinha seis cores e um seletor de quatro posições. | Renderer tipado, medidas do container, até oito cores, atualização de uniforms sem recriar o contexto, observadores/listeners/RAF e buffers/programa com limpeza local. |
| GPU indisponível | WebGL pode não existir ou perder o contexto em computadores limitados. | Gradiente CSS com movimento quando o contexto estiver indisponível; recuperação do renderer após restauração do contexto. A seção continua utilizável. |
| Continuidade NFC | Máscara inferior e superfícies separadas produziam uma passagem clara antes do atendimento. | Placas, “Um gesto” e “Mudou de cardápio” dentro do mesmo painel OLED, sem máscara ou faixa entre os trechos. Espaçamento e alinhamento vertical aproximados. |

Não foi encontrado código que use hardwareConcurrency, deviceMemory ou saveData para desativar coreografias. Esses dados só eram lidos no diagnóstico opcional. Não é possível afirmar que um desses mecanismos causava o caso físico relatado.

## Integração GradientWave

- Estrutura existente: Next.js/React, TypeScript, Tailwind e shadcn. Alias UI: `@/components/ui`, diretório `src/components/ui`; CSS global em `src/app/globals.css`, estilos locais em CSS Modules. Nenhuma biblioteca nova instalada.
- Componente em `src/components/ui/gradient-wave.tsx`; renderer e shaders carregados sob demanda, com arquivo de uso separado. A API conserva cores, reprodução, ruído, deformação e sombreamento.
- Fundo absoluto dentro do viewport sticky existente. Não cria linha flex, altura de seção, pin, título, wrapper de scroll ou controles adicionais.
- Paleta da integração: branco #f8f8fa, rosa suave #ffe2f1, lavanda #d1c5f1 e rosa #ffaad8. Véu claro mantém contraste do texto e do dispositivo.
- Resolução limitada a 900 mil pixels em ponteiro fino e 450 mil em toque; desenho em até 30/24 fps. Isso controla o custo do fundo e mantém a progressão do movimento. Não desativa os demais movimentos por capacidade do aparelho.
- Fora da área visível e com aba oculta, o renderer pausa. Ao retornar, a linha do tempo continua sem salto de tempo acumulado.

## Conteúdo e OLED

- Cards de “Além da gestão” sem Saiba mais, expansores ou conteúdo adicional escondido. Artigos continuam acessíveis por foco e o capítulo acompanha a navegação por teclado.
- Rótulos públicos e nomes acessíveis revisados: retirar exemplo, ilustrativo, demonstrativo e equivalentes; manter descrições diretas das soluções e ações. Traduções novas em inglês/espanhol.
- Operações exploráveis da gestão continuam locais: o aviso informa que nada é enviado ao CRM e o rodapé informa ausência de conexão com dados reais. Não há gravação em dados de clientes.
- Tokens de fundos escuros, superfícies, cabeçalho e card preto normalizados para #000000. Bordas continuam diferenciando controles e painéis. Card preto sem reflexo claro sobre a superfície.

## Verificação e limites

- Build de produção, TypeScript, ESLint dos arquivos alterados, verificação de whitespace e cinco testes unitários aprovados.
- Perfis de Chrome com CPU 8× e 6× limitada, um núcleo e 1 GB informados, WebGL indisponível e preferência nativa de redução ligada: abertura conclui, digitação e vídeo avançam, cards empilham e fundo CSS continua animando. São perfis emulados; não representam medição em uma máquina física de 1 GB.
- As condições do teste não permitem prometer 60 fps ou estabilidade universal em toda versão de navegador, GPU, memória ou rede. A política garante ausência de um bloqueio intencional por perfil de hardware; resultados de execução são limitados aos cenários medidos.
- A versão publicada não foi alterada nesta rodada. A investigação física do equipamento citado exige abrir a versão corrigida e, se necessário, coletar o diagnóstico `?motionDebug=1`.
