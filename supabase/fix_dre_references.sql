-- Alterar colunas de referência para aceitar tanto UUIDs quanto códigos virtuais
ALTER TABLE dre_linhas DROP COLUMN id_referencia_1;
ALTER TABLE dre_linhas DROP COLUMN id_referencia_2;
ALTER TABLE dre_linhas ADD COLUMN id_referencia_1 text;
ALTER TABLE dre_linhas ADD COLUMN id_referencia_2 text;
