CREATE TABLE custo_capital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_aporte date NOT NULL,
  historico text NOT NULL,
  valor_aporte decimal(12,2) DEFAULT 0,
  periodo_aporte text, -- Ex: 'MENSAL', 'ANUAL', ou período específico
  custo_capital decimal(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE custo_capital ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para usuários autenticados" ON custo_capital FOR ALL USING (true);
