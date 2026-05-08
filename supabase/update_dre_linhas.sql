-- ============================================================
-- TABELA: CONFIGURAÇÃO DO DRE (dre_linhas)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dre_linhas (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem           integer NOT NULL,
  nome            text NOT NULL,
  plano_conta_id  uuid REFERENCES public.plano_contas(id),
  codigo_conta    text, -- Opcional, para facilitar a visualização sem JOIN
  tipo_calculo    text DEFAULT 'soma', -- 'soma', 'subtrai', 'informativa'
  is_custom       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.dre_linhas ENABLE ROW LEVEL SECURITY;

-- Policy permissiva
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dre_linhas' AND policyname='allow_all_dre_linhas') THEN
    CREATE POLICY "allow_all_dre_linhas" ON public.dre_linhas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
