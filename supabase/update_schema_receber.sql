-- ============================================================
-- TABELA: CONTAS A RECEBER
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contas_receber (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data              date NOT NULL,
  doc_magna         text,
  doc_riolog        text,
  pagador           text,
  cliente           text,
  placa             text,
  origem            text,
  destino           text,
  peso              numeric,
  data_vencimento   date,
  icms              numeric DEFAULT 0,
  seguro            numeric DEFAULT 0,
  valor_a_receber   numeric DEFAULT 0, -- S/ ICMS
  valor_recebido    numeric DEFAULT 0,
  ajustes           numeric DEFAULT 0, -- +/- Desconto/Acréscimo
  data_recebimento  date,
  created_at        timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- Policy permissiva
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contas_receber' AND policyname='allow_all_receber') THEN
    CREATE POLICY "allow_all_receber" ON public.contas_receber FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
