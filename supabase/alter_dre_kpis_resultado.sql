-- Executar no SQL Editor do Supabase para adicionar a configuração do Resultado Líquido
ALTER TABLE dre_kpis ADD COLUMN IF NOT EXISTS operacao_resultado text DEFAULT 'nenhum';
