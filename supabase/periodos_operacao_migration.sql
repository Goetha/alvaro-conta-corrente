-- =============================================
-- MIGRAÇÃO: Módulo Histórico de Operações de Frota
-- Execute este script no editor SQL do Supabase
-- =============================================

-- 1. Adicionar campo data_primeiro_frete na tabela veiculos
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS data_primeiro_frete DATE;

-- 2. Criar tabela periodos_operacao
CREATE TABLE IF NOT EXISTS periodos_operacao (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cavalo_id   UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  carreta_id  UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  operacao_id UUID REFERENCES operacoes(id) ON DELETE SET NULL,
  data_inicio DATE NOT NULL,
  data_fim    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE periodos_operacao ENABLE ROW LEVEL SECURITY;

-- 4. Política permissiva (mesma adotada nas outras tabelas do projeto)
DROP POLICY IF EXISTS "Allow all for authenticated" ON periodos_operacao;
CREATE POLICY "Allow all for authenticated" ON periodos_operacao
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Índice para performance: buscar período ativo de um cavalo rapidamente
CREATE INDEX IF NOT EXISTS idx_periodos_cavalo_ativo
  ON periodos_operacao (cavalo_id, data_fim)
  WHERE data_fim IS NULL;
