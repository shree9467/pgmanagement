-- Non-destructive, backward-compatible migration for Independent External PG Lead Discovery
-- Safe to run multiple times (idempotent). NEVER truncates, drops, or overwrites existing data.

-- 1. Permanent External Discovery History (used for cross-run deduplication & audit trail)
CREATE TABLE IF NOT EXISTS public.external_discovery_history (
  id TEXT PRIMARY KEY,
  external_lead_id TEXT,
  source_platform TEXT NOT NULL,
  source_url TEXT,
  content_hash TEXT,
  normalized_phone TEXT,
  normalized_email TEXT,
  customer_name TEXT,
  city TEXT,
  preferred_locality TEXT,
  verification_status TEXT DEFAULT 'unverified_opportunity',
  duplicate_count INTEGER DEFAULT 0,
  source_references JSONB DEFAULT '[]'::jsonb,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_phone ON public.external_discovery_history (normalized_phone) WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';
CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_email ON public.external_discovery_history (normalized_email) WHERE normalized_email IS NOT NULL AND normalized_email <> '';
CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_ext_id ON public.external_discovery_history (external_lead_id) WHERE external_lead_id IS NOT NULL AND external_lead_id <> '';
CREATE INDEX IF NOT EXISTS idx_ext_disc_hist_hash ON public.external_discovery_history (content_hash) WHERE content_hash IS NOT NULL AND content_hash <> '';

-- 2. Discovery Runs State Table (tracks running, paused, stopped, completed, failed + per-source progress)
CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'stopped', 'completed', 'failed')),
  query_criteria JSONB DEFAULT '{}'::jsonb,
  total_enabled_sources INTEGER DEFAULT 8,
  completed_sources INTEGER DEFAULT 0,
  progress_pct INTEGER DEFAULT 0,
  new_prospects_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  source_reports JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
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
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS content_hash TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ;
  END IF;
END $$;
