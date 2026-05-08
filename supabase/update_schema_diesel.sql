-- ============================================================
-- TABELA: CONTAS A PAGAR DIESEL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contas_pagar_diesel (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data_emissao    date NOT NULL,
  data_pagamento  date,
  data_vencimento date,
  documento       text,
  fornecedor      text,
  observacao      text,
  placa           text,
  km              numeric,
  quantidade      numeric,
  valor_a_pagar   numeric DEFAULT 0,
  valor_unitario  numeric DEFAULT 0,
  valor_pago      numeric DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contas_pagar_diesel ENABLE ROW LEVEL SECURITY;

-- Policy permissiva
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contas_pagar_diesel' AND policyname='allow_all_diesel') THEN
    CREATE POLICY "allow_all_diesel" ON public.contas_pagar_diesel FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
