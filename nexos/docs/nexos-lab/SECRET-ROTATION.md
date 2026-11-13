# Rotação necessária — credencial encontrada no histórico

A varredura exata identificou a senha atual do banco em um blob histórico de
`nexos/EMAIL-SETUP.md` (objeto d0d23f61741c2376ba4cbab026a5689aa916f3bd).
O valor não foi impresso nem copiado para este relatório. Tratar como comprometido.
Nenhum valor atual foi encontrado na varredura dos arquivos src, public ou bundles
verificados; o histórico continua sendo uma exposição independente.

## Procedimento para aprovação e janela de manutenção

1. Confirmar o projeto Supabase e todos os consumidores de DATABASE_URL (Vercel,
   ambiente privado, desenvolvedores, jobs, integrações e pools).
2. Gerar e armazenar a nova senha diretamente no gerenciador de segredos; não
   colocá-la no chat, shell history, código ou arquivo rastreado.
3. Com o responsável presente, redefinir a senha no painel oficial Supabase e
   atualizar as connection strings nos ambientes correspondentes. A alteração da
   senha pode interromper conexões que reconectarem com a credencial anterior.
4. Fazer rollout coordenado e verificar conexão TLS, login, recuperação e cron.
5. Confirmar que a credencial antiga deixou de autenticar. Preservar sessões e IDs
   existentes; esta rotação não exige excluir usuários ou vínculos.
6. Depois da rotação, planejar a limpeza do histórico com backup, colaboração dos
   membros e atualização de clones. Reescrever histórico sozinho não revoga segredo.

Não executado: depende de aprovação para mudanças de produção e acesso aos ambientes.
Próxima ação: aprovar a janela e identificar quem pode redefinir a senha e atualizar Vercel.
