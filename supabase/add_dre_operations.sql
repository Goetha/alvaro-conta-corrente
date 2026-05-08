ALTER TABLE dre_linhas
ADD COLUMN id_referencia_1 uuid REFERENCES dre_linhas(id),
ADD COLUMN id_referencia_2 uuid REFERENCES dre_linhas(id),
ADD COLUMN operacao_aritmetica text;
