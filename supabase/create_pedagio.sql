-- Cria a tabela contas_pagar_pedagio com a mesma estrutura de contas_pagar_manutencao
CREATE TABLE IF NOT EXISTS public.contas_pagar_pedagio (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    data date,
    comp text,
    documento text,
    parceiro text,
    historico text,
    placa text,
    km numeric,
    quantidade numeric,
    codigo text,
    conta text,
    valor numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativa RLS
ALTER TABLE public.contas_pagar_pedagio ENABLE ROW LEVEL SECURITY;

-- Cria política que permite tudo (ajuste conforme necessário)
CREATE POLICY "Permitir tudo para todos em contas_pagar_pedagio"
    ON public.contas_pagar_pedagio
    FOR ALL
    USING (true);
