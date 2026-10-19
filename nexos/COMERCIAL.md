# Atendimento comercial

A aquisição de placas e a contratação do Desenvolvimento NexOS são concluídas pelo comercial no WhatsApp configurado em `src/config.ts`.

- `src/lib/commercial.ts` centraliza os links e a mensagem com a quantidade de placas.
- A seção da placa mantém a seleção de quantidade para enviar ao comercial. Não há preços, totais ou descontos publicados; valores, personalização, frete e condições são alinhados no atendimento.
- O catálogo de serviços digitais apresenta somente Desenvolvimento NexOS.
- Links antigos de `/checkout` encaminham para o comercial. As APIs e a interface de pagamento foram removidas.
- O formulário de contato saiu da landing. O quiz de dores será uma etapa futura.

## Fotos do mascote

Em `src/components/sections/MascotSolutions.tsx`, preencha `image` em cada entrada de `SOLUTIONS` com o caminho da foto em `public`, por exemplo `/mascote/atendimento.webp`. Atualize também o texto alternativo em `alt` para descrever a foto real. Enquanto as fotos não são adicionadas, a faixa exibe espaços reservados.
