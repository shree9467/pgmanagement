-- Non-destructive, backward-compatible migration for Free External PG Customer Discovery Engine
-- Safe to run multiple times (idempotent). NEVER runs DROP TABLE, TRUNCATE, DELETE, or RESET.

-- 1. Permanent External Discovery History (used strictly for cross-run deduplication & audit trail)
CREATE TABLE IF NOT EXISTS public.external_discovery_history (
  id TEXT PRIMARY KEY,
  dedup_hash TEXT NOT NULL,
  normalized_phone TEXT,
  normalized_email TEXT,
  external_lead_id TEXT,
  source_platform TEXT NOT NULL,
  source_url TEXT,
  cross_platform_refs JSONB DEFAULT '[]'::jsonb,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_dedup_hash ON public.external_discovery_history (dedup_hash);
CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_phone ON public.external_discovery_history (normalized_phone) WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';
CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_email ON public.external_discovery_history (normalized_email) WHERE normalized_email IS NOT NULL AND normalized_email <> '';
CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_ext_id ON public.external_discovery_history (external_lead_id) WHERE external_lead_id IS NOT NULL AND external_lead_id <> '';

-- 2. Discovery Runs State Table (tracks running, paused, stopped, completed, failed + per-source stats)
CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'stopped', 'completed', 'failed')),
  progress_percent INTEGER DEFAULT 0,
  city TEXT,
  locality TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  source_stats JSONB DEFAULT '[]'::jsonb,
  error_log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_status ON public.discovery_runs (status, started_at DESC);

-- 3. Non-destructive metadata column additions to public.leads (ONLY if public.leads exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS discovery_origin TEXT DEFAULT 'EXISTING_PROJECT';
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_platform TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_url TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS external_lead_id TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'NEW';
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS matched_building_id TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_owner_id TEXT;
  END IF;
END $$;
