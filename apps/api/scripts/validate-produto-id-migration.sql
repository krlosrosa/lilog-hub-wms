-- Pré-validação para migration 0050: produto_id como PK
-- Executar antes de aplicar a migration em staging/produção.

-- 1. produto_id duplicado ou nulo em produtos
SELECT produto_id, COUNT(*) AS qtd
FROM master_data.produtos
GROUP BY produto_id
HAVING COUNT(*) > 1 OR produto_id IS NULL OR btrim(produto_id) = '';

-- 2. Órfãos por tabela filha (produto_id UUID sem match em produtos.id)
SELECT 'expedicao.remessa_itens' AS tabela, COUNT(*) AS orfaos
FROM expedicao.remessa_itens ri
WHERE ri.produto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = ri.produto_id)
UNION ALL
SELECT 'devolucao.devolucao_itens', COUNT(*)
FROM devolucao.devolucao_itens di
WHERE di.produto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = di.produto_id)
UNION ALL
SELECT 'estoque.produto_enderecos', COUNT(*)
FROM estoque.produto_enderecos pe
WHERE NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = pe.produto_id)
UNION ALL
SELECT 'armazenagem.itens_armazenagem', COUNT(*)
FROM armazenagem.itens_armazenagem ia
WHERE ia.produto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = ia.produto_id)
UNION ALL
SELECT 'estoque.saldos', COUNT(*)
FROM estoque.saldos s
WHERE NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = s.produto_id)
UNION ALL
SELECT 'estoque.movimentacoes_estoque', COUNT(*)
FROM estoque.movimentacoes_estoque m
WHERE NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = m.produto_id)
UNION ALL
SELECT 'estoque.contagens', COUNT(*)
FROM estoque.contagens c
WHERE c.produto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = c.produto_id)
UNION ALL
SELECT 'recebimento.itens_pre_recebimento', COUNT(*)
FROM recebimento.itens_pre_recebimento ipr
WHERE NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = ipr.produto_id)
UNION ALL
SELECT 'recebimento.itens_recebimento', COUNT(*)
FROM recebimento.itens_recebimento ir
WHERE NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = ir.produto_id)
UNION ALL
SELECT 'recebimento.divergencias_recebimento', COUNT(*)
FROM recebimento.divergencias_recebimento dr
WHERE dr.produto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = dr.produto_id)
UNION ALL
SELECT 'recebimento.recebimento_avarias', COUNT(*)
FROM recebimento.recebimento_avarias ra
WHERE ra.produto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM master_data.produtos p WHERE p.id = ra.produto_id);
