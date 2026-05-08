-- ============================================================
-- CRIAÇÃO DA TABELA CAIXA (FLUXO INDEPENDENTE)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.caixa (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data        date NOT NULL,
  comp        text,
  numero      text,
  parceiro    text,
  historico   text,
  placa       text,
  km          numeric,
  qtdade      numeric,
  codigo      text,
  conta       text,
  receita     numeric DEFAULT 0,
  despesa     numeric DEFAULT 0,
  saldo       numeric DEFAULT 0,
  conciliado  boolean DEFAULT false,
  tipo        text DEFAULT 'despesa' CHECK (tipo IN ('receita','despesa','transferencia')),
  created_at  timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;

-- Criar Policy
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='caixa' AND policyname='allow_all_caixa') THEN
    CREATE POLICY "allow_all_caixa" ON public.caixa FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
