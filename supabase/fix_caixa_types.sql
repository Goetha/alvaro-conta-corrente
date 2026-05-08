-- Alterar colunas km e qtdade para text para suportar dados do CSV
ALTER TABLE public.caixa ALTER COLUMN km TYPE text;
ALTER TABLE public.caixa ALTER COLUMN qtdade TYPE text;
