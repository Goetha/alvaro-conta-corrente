-- ============================================================
-- SISTEMA FINANCEIRO TRANSPORTADORA — SUPABASE SCHEMA + SEED
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ─── TABELAS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.plano_contas (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo      text NOT NULL,
  nome        text NOT NULL,
  tipo        text NOT NULL CHECK (tipo IN ('receita','despesa')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parceiros (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        text NOT NULL,
  tipo        text DEFAULT 'cliente' CHECK (tipo IN ('cliente','fornecedor','ambos')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.veiculos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  placa       text NOT NULL,
  descricao   text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bancos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        text NOT NULL,
  agencia     text,
  conta       text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lancamentos (
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

-- ─── RLS (desabilitar para uso interno / habilitar conforme necessário) ───

ALTER TABLE public.plano_contas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bancos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos   ENABLE ROW LEVEL SECURITY;

-- Policies permissivas (ajuste para produção com auth.uid())
CREATE POLICY "allow_all_plano_contas"  ON public.plano_contas  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_parceiros"     ON public.parceiros      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_veiculos"      ON public.veiculos       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bancos"        ON public.bancos         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lancamentos"   ON public.lancamentos    FOR ALL USING (true) WITH CHECK (true);

-- ─── SEED: PLANO DE CONTAS ────────────────────────────────────

INSERT INTO public.plano_contas (codigo, nome, tipo) VALUES
-- Receitas
('1',  'FRETE FR',         'receita'),
('2',  'FRETES',           'receita'),
('3',  'RECURSOS ALVARO',  'receita'),
('4',  'RECURSOS CLODO',   'receita'),
('5',  'VENDA DE BENS',    'receita'),
('92', 'RESTITUIÇÃO',      'receita'),
('93', 'DEVOLUÇÃO',        'receita'),
-- Despesas
('51', '13º SALÁRIO',         'despesa'),
('52', 'ARLA',                'despesa'),
('53', 'CONSÓRCIO BB',        'despesa'),
('54', 'CONSÓRCIO MAGNA',     'despesa'),
('55', 'DIESEL CAVALO',       'despesa'),
('56', 'DIESEL EQ. FRIO',     'despesa'),
('57', 'FGTS',                'despesa'),
('58', 'FCO SCANIA',          'despesa'),
('59', 'INSS',                'despesa'),
('60', 'MANUTENÇÃO CAVALO',   'despesa'),
('61', 'PARCELA MAGNA',       'despesa'),
('62', 'PARCELA METEOR',      'despesa'),
('63', 'PARCELA VOLVO',       'despesa'),
('64', 'PARCELA CARRETA',     'despesa'),
('65', 'MANUTENÇÃO EQ. FRIO', 'despesa'),
('66', 'MANUTENÇÃO CARRETA',  'despesa'),
('67', 'OUTROS',              'despesa'),
('68', 'PNEUS CAVALO',        'despesa'),
('69', 'PEDÁGIO',             'despesa'),
('70', 'PNEUS CARRETA',       'despesa'),
('71', 'RESCISÃO',            'despesa'),
('72', 'SALÁRIO',             'despesa'),
('73', 'SEGURO FROTA',        'despesa'),
('74', 'RASTREAMENTO',        'despesa'),
('75', 'TAXA ADMIN',          'despesa'),
('76', 'IR',                  'despesa'),
('77', 'FÉRIAS',              'despesa'),
('78', 'SENSOR FADIGA',       'despesa'),
('79', 'VALE ALIMENTAÇÃO',    'despesa'),
('80', 'CONTABILIDADE',       'despesa'),
('81', 'MULTAS',              'despesa'),
('82', 'COMBUSTÍVEL FRIO',    'despesa'),
('83', 'ACESSÓRIOS',          'despesa'),
('84', 'LAVAGEM',             'despesa'),
('85', 'LICENCIAMENTO',       'despesa'),
('86', 'COMUNICAÇÃO',         'despesa'),
('87', 'VIAGEM',              'despesa'),
('88', 'HONORÁRIOS',          'despesa'),
('89', 'ENERGIA',             'despesa'),
('90', 'PNEUS RECAPE',        'despesa'),
('91', 'TRANSFERÊNCIA',       'despesa');

-- ─── SEED: VEÍCULOS ───────────────────────────────────────────

INSERT INTO public.veiculos (placa, descricao) VALUES
('RCA4F95', 'Cavalo Scania'),
('RBX2I25', 'Cavalo Scania'),
('QIG4E73', 'Equipamento de Frio / Carreta'),
('QIX0H26', 'Carreta Frigorífica'),
('TFV6B79', 'Cavalo Meteor'),
('TFX8B84', 'Cavalo Volvo'),
('TGB4J95', 'Cavalo'),
('TGG1C03', 'Cavalo Volvo');

-- ─── SEED: BANCOS ─────────────────────────────────────────────

INSERT INTO public.bancos (nome, agencia, conta) VALUES
('CONTA CORRENTE', '8615-1', '1195-9'),
('CAIXA', NULL, NULL);

-- ─── SEED: PARCEIROS ──────────────────────────────────────────

INSERT INTO public.parceiros (nome, tipo) VALUES
('MAGNABOSCO CATANDUVAS', 'fornecedor'),
('G10 TRANSPORTES',       'cliente'),
('BRF',                   'cliente'),
('REFRIGEBE',             'fornecedor');

-- ─── SEED: LANÇAMENTOS ────────────────────────────────────────
-- Mix: receitas de frete, despesas variadas, alguns sem código, alguns não conciliados

INSERT INTO public.lancamentos (data, comp, numero, parceiro, historico, placa, km, qtdade, codigo, conta, receita, despesa, conciliado, tipo) VALUES

-- Receitas de frete
('2025-01-05', '2025-01', 'NF-001', 'G10 TRANSPORTES',  'Frete Curitiba x São Paulo',  'RCA4F95', 1850, 1, '2',  'CONTA CORRENTE', 8500.00,    0, true,  'receita'),
('2025-01-10', '2025-01', 'NF-002', 'BRF',              'Frete frigorífico BRF Videira','QIG4E73', 620,  1, '1',  'CONTA CORRENTE', 6200.00,    0, true,  'receita'),
('2025-02-03', '2025-02', 'NF-003', 'G10 TRANSPORTES',  'Frete São Paulo x Florianópolis','TFX8B84',1100,1, '2',  'CONTA CORRENTE', 9100.00,    0, true,  'receita'),
('2025-02-15', '2025-02', 'NF-004', 'BRF',              'Frete frigorífico BRF Chapecó','QIX0H26', 480,  1, '1',  'CONTA CORRENTE', 5400.00,    0, false, 'receita'),
('2025-03-08', '2025-03', 'NF-005', 'G10 TRANSPORTES',  'Frete especial G10',          'TFV6B79', 920,  1, '2',  'CONTA CORRENTE', 7800.00,    0, true,  'receita'),
('2025-03-20', '2025-03', 'NF-006', 'BRF',              'Frete BRF Carambeí',          'RBX2I25', 740,  1, '1',  'CONTA CORRENTE', 6600.00,    0, true,  'receita'),

-- Receita sem código (gera divergência)
('2025-04-02', '2025-04', 'NF-007', 'G10 TRANSPORTES',  'Frete abril G10',             'RCA4F95', 1200, 1, NULL, 'CONTA CORRENTE', 8200.00,    0, false, 'receita'),

-- Despesas — Diesel
('2025-01-08', '2025-01', 'CF-001', 'MAGNABOSCO CATANDUVAS', 'Diesel cavalo RCA4F95 — jan','RCA4F95',NULL,350,'55','CONTA CORRENTE', 0, 2450.00, true,  'despesa'),
('2025-01-08', '2025-01', 'CF-002', NULL,                    'Diesel cavalo RBX2I25 — jan','RBX2I25',NULL,300,'55','CONTA CORRENTE', 0, 2100.00, true,  'despesa'),
('2025-02-06', '2025-02', 'CF-003', 'MAGNABOSCO CATANDUVAS', 'Diesel cavalo TFV6B79 — fev','TFV6B79',NULL,320,'55','CONTA CORRENTE', 0, 2240.00, true,  'despesa'),
('2025-02-06', '2025-02', 'CF-004', 'MAGNABOSCO CATANDUVAS', 'Diesel eq. frio — fev',     'QIG4E73',NULL,200,'56','CONTA CORRENTE', 0, 1400.00, true,  'despesa'),
('2025-03-07', '2025-03', 'CF-005', 'MAGNABOSCO CATANDUVAS', 'Diesel TFX8B84 — mar',      'TFX8B84',NULL,340,'55','CONTA CORRENTE', 0, 2380.00, true,  'despesa'),

-- Despesas — Salário
('2025-01-31', '2025-01', 'FL-001', NULL, 'Salário motoristas jan/2025', NULL, NULL, NULL, '72', 'CONTA CORRENTE', 0, 7200.00, true,  'despesa'),
('2025-02-28', '2025-02', 'FL-002', NULL, 'Salário motoristas fev/2025', NULL, NULL, NULL, '72', 'CONTA CORRENTE', 0, 7200.00, true,  'despesa'),
('2025-03-31', '2025-03', 'FL-003', NULL, 'Salário motoristas mar/2025', NULL, NULL, NULL, '72', 'CONTA CORRENTE', 0, 7200.00, false, 'despesa'),

-- Despesas — Pedágio
('2025-01-12', '2025-01', 'PG-001', NULL, 'Pedágio SP-PR jan', 'RCA4F95', NULL, NULL, '69', 'CONTA CORRENTE', 0, 480.00, true,  'despesa'),
('2025-02-18', '2025-02', 'PG-002', NULL, 'Pedágio PR-SC fev', 'TFX8B84', NULL, NULL, '69', 'CONTA CORRENTE', 0, 360.00, true,  'despesa'),

-- Despesas — Manutenção
('2025-01-22', '2025-01', 'MN-001', 'REFRIGEBE', 'Manutenção preventiva RCA4F95','RCA4F95', NULL, NULL, '60', 'CONTA CORRENTE', 0, 1850.00, true,  'despesa'),
('2025-03-14', '2025-03', 'MN-002', 'REFRIGEBE', 'Reparo eq. frio QIG4E73',     'QIG4E73', NULL, NULL, '65', 'CONTA CORRENTE', 0, 2200.00, false, 'despesa'),

-- Despesa sem código (gera divergência)
('2025-04-10', '2025-04', NULL, NULL, 'Despesa diversa sem classificar', NULL, NULL, NULL, NULL, 'CAIXA', 0, 850.00, false, 'despesa'),

-- Despesa sem conta bancária (gera divergência)
('2025-04-15', '2025-04', 'RB-001', NULL, 'Rastreamento veículos abr/2025', NULL, NULL, NULL, '74', NULL, 0, 680.00, false, 'despesa'),

-- Recursos sócios
('2025-01-02', '2025-01', 'RC-001', NULL, 'Recursos Alvaro — jan', NULL, NULL, NULL, '3', 'CONTA CORRENTE', 5000.00, 0, true, 'receita'),
('2025-02-01', '2025-02', 'RC-002', NULL, 'Recursos Clodo — fev',  NULL, NULL, NULL, '4', 'CONTA CORRENTE', 5000.00, 0, true, 'receita');
