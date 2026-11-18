-- Srinoos PG Operating System - Complete PostgreSQL Supabase Schema
-- Project: fswlweejdyhrywvzhzvw

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  room TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'ACTIVE',
  score INT DEFAULT 85,
  risk TEXT DEFAULT 'LOW',
  rent_status TEXT DEFAULT 'PENDING',
  last_payment TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  floor TEXT,
  type TEXT DEFAULT 'Double Sharing',
  sharing INT DEFAULT 2,
  total_beds INT DEFAULT 2,
  occupied_beds INT DEFAULT 0,
  price NUMERIC DEFAULT 9500,
  amenities JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TEXT,
  type TEXT DEFAULT 'UTILITY',
  status TEXT DEFAULT 'CLEARED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  tenant_name TEXT,
  room TEXT,
  amount NUMERIC,
  due_date TEXT,
  status TEXT DEFAULT 'PENDING',
  payment_mode TEXT DEFAULT 'UPI',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  salary NUMERIC,
  shift TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Onboarding Apps Table
CREATE TABLE IF NOT EXISTS public.onboarding_apps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  aadhaar TEXT,
  room_preference TEXT,
  status TEXT DEFAULT 'PENDING',
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Plans & Pricing Table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security (RLS) Enablement
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access for authenticated & anon clients
CREATE POLICY "Allow public select tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Allow public select rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public select expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public select invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public select notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow public select staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow public insert onboarding_apps" ON public.onboarding_apps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select plans" ON public.plans FOR SELECT USING (true);

