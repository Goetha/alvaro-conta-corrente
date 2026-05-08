CREATE TABLE dre_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  valor decimal(15,2) DEFAULT 0,
  variante text DEFAULT 'info', -- 'info', 'success', 'danger', 'warning'
  icone text DEFAULT 'Activity',
  ordem integer DEFAULT 0,
  operacao_caixa text DEFAULT 'nenhum', -- 'nenhum', 'soma', 'subtrai'
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE dre_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para usuários autenticados" ON dre_kpis FOR ALL USING (true);
