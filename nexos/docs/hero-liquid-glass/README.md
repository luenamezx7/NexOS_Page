# Liquid Glass do hero

**Histórico: esta implementação foi removida após avaliação visual do usuário.** A dependência foi desinstalada e substituída por vidro transparente em CSS, sem filtros SVG, canvas ou blur. Veja `../hero-clear-glass/` para a implementação atual e suas capturas. As verificações abaixo registram somente a versão anterior.

Instalado `@samasante/liquid-glass@0.1.1`, com versão fixa no package.json/lockfile. Integração aplicada ao card atrás do avatar no `Hero.tsx`; a classe do card continua responsável por largura, altura, posição e máscara inferior.

## Escolha

Foram comparadas as fontes oficiais de três alternativas:

| Biblioteca | Avaliação para este projeto |
|---|---|
| [liquid-glass-react](https://github.com/rdev/liquid-glass-react) | Opção popular, React 19, sem dependências de runtime; versão npm 1.1.1 publicada em junho de 2025. Documenta limitações de deslocamento em Safari/Firefox. |
| [glassy-liquid](https://github.com/9und30/glassy-liquid) | Oferece um sistema amplo de Web Components e bindings; adicionaria uma abstração maior para este único card. |
| [@samasante/liquid-glass](https://github.com/samasante/liquid-glass) | Escolhida pela API React direta, ausência de dependências de runtime, óptica configurável e encaixe na geometria CSS existente. Versão npm 0.1.1, atualizada em junho de 2026; ainda uma API anterior a 1.0. |

“Melhor” aqui significa mais adequada a este card e à arquitetura do projeto, não uma garantia universal de superioridade. A documentação distingue refração do fundo vivo no Chrome/Edge de vidro fosco sem deslocamento em Safari/Firefox no modo usado. O modo de cópia/WebGL para refração em outros motores não foi ativado: ele exigiria copiar ou sincronizar o vídeo de fundo para um segundo renderer.

## Implementação

- `Glass` com filtros SVG de deslocamento, reflexo de borda e dispersão cromática moderada. Removidos os pseudo-elementos do glassmorphism anterior.
- Óptica estável fora do render: strength .08, frost 5px, saturação 1.3 e raio de 24px.
- Largura de 640px em telas maiores, a mesma dos cards coloridos; largura fluida no mobile.
- Topo em 26% da cena, deixando a cabeça acima do card; medidas do PNG preservadas.
- Máscara exclusivamente inferior e fade compartilhado preservados.
- CSP não alterada. O arquivo distribuído inspecionado não usa eval/new Function. Refração usa mapa local `data:image/png` e SVG, sem CDN adicional.

## Verificação

Chrome: 320, 390, 768, 1440 e 2560px. Filtro SVG de refração ativo em todas as larguras, mapa gerado, geometria preservada e nenhum overflow. Sem pageerror nem eventos de violação CSP observados na navegação local. Capturas e medidas em `results.json` e `chrome-*.png`.

Typecheck e ESLint do componente passaram. Build passou com o aviso já existente de métricas do fallback Google Sans. A auditoria npm de produção aponta quatro avisos moderados em shadcn/ts-morph/minimatch, sem entrada para a biblioteca adicionada; não foram feitas atualizações fora do escopo.

Nenhum deploy foi executado.
