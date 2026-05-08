ALTER TABLE dre_kpis ADD COLUMN IF NOT EXISTS formula jsonb DEFAULT '{}'::jsonb;
