ALTER TABLE cnc.nao_conformidades RENAME COLUMN acao_imediata TO observacao;
ALTER TABLE cnc.nao_conformidades DROP COLUMN acao_corretiva;
