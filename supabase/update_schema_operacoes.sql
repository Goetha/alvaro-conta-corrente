-- ============================================================
-- ATUALIZAÇÃO: ADICIONAR OPERAÇÕES E VINCULAR AOS VEÍCULOS
-- ============================================================

-- 1. Criar tabela de operações
CREATE TABLE IF NOT EXISTS public.operacoes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 2. Adicionar operacao_id na tabela de veiculos
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='veiculos' AND column_name='operacao_id') THEN
    ALTER TABLE public.veiculos ADD COLUMN operacao_id uuid REFERENCES public.operacoes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Habilitar RLS para operacoes
ALTER TABLE public.operacoes ENABLE ROW LEVEL SECURITY;

-- 4. Criar policy para operacoes
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='operacoes' AND policyname='allow_all_operacoes') THEN
    CREATE POLICY "allow_all_operacoes" ON public.operacoes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
