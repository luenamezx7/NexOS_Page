# Checkout NexOS

## Fluxo

- `/checkout?product=placa&quantity=3`: página dedicada, com dados/revisão e pagamento na mesma URL.
- `/checkout`: escolha de produto quando não há uma seleção válida.
- Links antigos `/?checkout=placa&quantity=3` redirecionam para a página dedicada.
- O login recebe a URL do checkout como `callbackUrl`, preservando produto e quantidade.
- `/sucesso?externalReference=...` verifica o pagamento no servidor antes de confirmar.

O checkout utiliza a autenticação já exigida pelo backend. O visitante pode ver o resumo e ajustar a quantidade antes de entrar; a cobrança permanece vinculada ao usuário autenticado.

## Responsabilidades

- `CheckoutClient.tsx`: apresentação, dados em memória, revisão, resumo responsivo e métodos de pagamento.
- `useCheckoutPayment.ts`: geração explícita, retomada da tentativa e consulta de status.
- `POST /api/checkout`: validação, preço pelo catálogo, reserva idempotente, pedido e integração Asaas.
- `POST /api/checkout/order`: leitura de tentativa/pedido com filtro obrigatório de proprietário. Usa as tabelas existentes, sem novas migrações.
- `POST /api/checkout/status`: verificação confiável com token assinado; a confirmação não depende de parâmetros da URL.
- Webhook existente: processamento idempotente dos eventos de pagamento e atualização do pedido.

Cartão, boleto e Pix disponível na configuração são concluídos no ambiente do Asaas. A aplicação não coleta números de cartão ou CVV. O Pix só aparece habilitado quando `ASAAS_PIX_ENABLED` permite seu uso.

## Retomada e proteção contra duplicidade

A chave UUID da tentativa é registrada antes do POST. Ao atualizar a página, o cliente consulta o servidor para retomar a cobrança, em vez de emitir outra. Erros de rede ou respostas de conciliação bloqueiam novas cobranças até a consulta do pedido. Duplo clique é bloqueado por estado e trava em memória.

A resposta de retomada usa o valor registrado no pedido e renova a credencial de status apenas para o proprietário autenticado. Referências conhecidas não autorizam a leitura de pedidos de outra conta.

## Dados e privacidade

Nome, e-mail e CPF/CNPJ permanecem em memória no formulário até serem enviados para a emissão da cobrança. Não são armazenados em `localStorage`/`sessionStorage` nem incluídos na URL. O navegador guarda somente a chave opaca da tentativa e as credenciais técnicas de acompanhamento, compatíveis com o retorno existente.

CPF/CNPJ é utilizado pela integração atual para identificar a cobrança. Endereço e telefone não são solicitados quando não há funcionalidade que justifique essa coleta. Personalização/entrega da placa e continuidade do serviço são alinhadas com a equipe; esta implementação não cria assinaturas automáticas nem calcula frete.

O aviso do formulário informa o uso dos dados e o processamento pelo Asaas, com acesso a privacidade, termos e reembolso. Não há consentimento genérico para LGPD nem adesão automática a marketing.

## Verificação

```bash
npm run test:checkout
npm run test:security
npm run build
npx playwright test tests/browser/checkout.spec.ts
```

Os testes de navegador interceptam a integração de pagamento com respostas simuladas. Uma cobrança real depende da configuração e das regras do ambiente Asaas utilizado.
