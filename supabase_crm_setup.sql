-- ==============================================================================
-- CAFE'S CORNER CRM — MASTER SUPABASE DATABASE INITIALIZATION SCRIPT
-- ==============================================================================
-- Run this entire script in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/lqmpwasppujlujrhyrhn
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New query", paste this file's contents, and click "Run" (or Ctrl+Enter)
-- ==============================================================================

-- ── 1. Enable UUID extension ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Organizations Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  owner_name              TEXT,
  email                   TEXT,
  phone                   TEXT,
  address                 TEXT,
  city                    TEXT,
  state                   TEXT,
  country                 TEXT DEFAULT 'IN',
  gst_number              TEXT,
  registration_number     TEXT,
  subscription_plan       TEXT DEFAULT 'STARTER',
  logo_url                TEXT,
  status                  TEXT DEFAULT 'ACTIVE',
  is_active               BOOLEAN DEFAULT true,
  branch_count            INT DEFAULT 0,
  user_count              INT DEFAULT 0,
  customer_count          INT DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

-- ── 3. Branches Table (org_branches) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_branches (
  id                      TEXT PRIMARY KEY,
  organization_id         TEXT,
  code                    TEXT,
  name                    TEXT NOT NULL,
  address                 TEXT,
  city                    TEXT,
  state                   TEXT,
  phone                   TEXT,
  email                   TEXT,
  manager_name            TEXT,
  manager_email           TEXT,
  manager_phone           TEXT,
  seating_capacity        INT DEFAULT 50,
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 4. User & Employee Profiles Table (user_profiles) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                      TEXT PRIMARY KEY,
  full_name               TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT,
  role                    TEXT DEFAULT 'STAFF',
  branch_id               TEXT,
  branch_name             TEXT,
  department_id           TEXT,
  department_name         TEXT,
  status                  TEXT DEFAULT 'active',
  avatar_url              TEXT,
  organization_id         TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  last_login              TIMESTAMPTZ
);

-- ── 5. Restaurant Global Settings Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id                      TEXT PRIMARY KEY,
  organization_id         TEXT,
  config_data             JSONB NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 6. Roles Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  description             TEXT,
  color                   TEXT DEFAULT '#79415A',
  is_system               BOOLEAN DEFAULT false,
  employee_count          INT DEFAULT 0,
  organization_id         TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 7. Role Permissions Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id                 TEXT NOT NULL,
  module                  TEXT NOT NULL,
  can_create              BOOLEAN DEFAULT false,
  can_read                BOOLEAN DEFAULT true,
  can_update              BOOLEAN DEFAULT false,
  can_delete              BOOLEAN DEFAULT false,
  can_approve             BOOLEAN DEFAULT false,
  can_export              BOOLEAN DEFAULT false,
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 8. Departments Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  description             TEXT,
  organization_id         TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 9. Audit Logs Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type              TEXT,
  actor_name              TEXT,
  actor_email             TEXT,
  target_type             TEXT,
  target_name             TEXT,
  module                  TEXT,
  action                  TEXT,
  description             TEXT,
  old_value               TEXT,
  new_value               TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 10. Login History Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.login_history (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                 TEXT,
  user_name               TEXT,
  email                   TEXT,
  ip_address              TEXT,
  success                 BOOLEAN DEFAULT true,
  device                  TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 11. User Module Access Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_module_access (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  module                  TEXT NOT NULL,
  has_access              BOOLEAN DEFAULT true,
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 12. Centralized Customers Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id                      TEXT PRIMARY KEY,
  full_name               TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  category                TEXT DEFAULT 'NEW',
  loyalty_tier            TEXT DEFAULT 'Bronze',
  loyalty_points          INT DEFAULT 0,
  total_spend             NUMERIC DEFAULT 0,
  total_visits            INT DEFAULT 0,
  date_of_birth           TEXT,
  anniversary_date        TEXT,
  dietary_preferences     TEXT[],
  allergies               TEXT[],
  special_instructions    TEXT,
  status                  TEXT DEFAULT 'ACTIVE',
  consent_marketing       BOOLEAN DEFAULT true,
  consent_sms             BOOLEAN DEFAULT true,
  consent_email           BOOLEAN DEFAULT true,
  address_street          TEXT,
  address_city            TEXT,
  address_state           TEXT,
  address_postal_code     TEXT,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 13. Dynamic Customer Segments Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  description             TEXT,
  category                TEXT DEFAULT 'custom',
  rules                   JSONB DEFAULT '{}'::jsonb,
  member_count            INT DEFAULT 0,
  total_spend             NUMERIC DEFAULT 0,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── 14. Inbound Sales & Banquet Leads Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  phone                   TEXT,
  email                   TEXT,
  company                 TEXT,
  source                  TEXT DEFAULT 'website_form',
  priority                TEXT DEFAULT 'MEDIUM',
  status                  TEXT DEFAULT 'NEW',
  assigned_staff_name     TEXT,
  estimated_value         NUMERIC DEFAULT 0,
  next_follow_up_date     TEXT,
  lost_reason             TEXT,
  converted_customer_id   TEXT,
  notes                   TEXT,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- PERMISSIVE ROW-LEVEL SECURITY (RLS) FOR DEVELOPMENT & DEMO ACCESS
-- Allows your web app's anon publishable key to read and write without 401 errors
-- ==============================================================================

ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access DISABLE ROW LEVEL SECURITY;

-- If you prefer keeping RLS enabled later, grant full access to 'anon' role:
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_organizations" ON public.organizations;
CREATE POLICY "anon_full_access_organizations" ON public.organizations FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.org_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_org_branches" ON public.org_branches;
CREATE POLICY "anon_full_access_org_branches" ON public.org_branches FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_user_profiles" ON public.user_profiles;
CREATE POLICY "anon_full_access_user_profiles" ON public.user_profiles FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_restaurant_settings" ON public.restaurant_settings;
CREATE POLICY "anon_full_access_restaurant_settings" ON public.restaurant_settings FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_roles" ON public.roles;
CREATE POLICY "anon_full_access_roles" ON public.roles FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_role_permissions" ON public.role_permissions;
CREATE POLICY "anon_full_access_role_permissions" ON public.role_permissions FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_departments" ON public.departments;
CREATE POLICY "anon_full_access_departments" ON public.departments FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_audit_logs" ON public.audit_logs;
CREATE POLICY "anon_full_access_audit_logs" ON public.audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_login_history" ON public.login_history;
CREATE POLICY "anon_full_access_login_history" ON public.login_history FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_user_module_access" ON public.user_module_access;
CREATE POLICY "anon_full_access_user_module_access" ON public.user_module_access FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_customers" ON public.customers;
CREATE POLICY "anon_full_access_customers" ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_customer_segments" ON public.customer_segments;
CREATE POLICY "anon_full_access_customer_segments" ON public.customer_segments FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_leads" ON public.leads;
CREATE POLICY "anon_full_access_leads" ON public.leads FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA (Populates default records in your Supabase Tables)
-- ==============================================================================

-- Seed Sample Organization
INSERT INTO public.organizations (id, name, slug, owner_name, email, phone, city, status, subscription_plan, branch_count)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Cafe''s Corner Bistro Group',
  'cafes-corner-bistro-group',
  'George Daniel',
  'admin@democompany.com',
  '+91 22 2490 8820',
  'Mumbai',
  'ACTIVE',
  'PRO',
  4
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Branches
INSERT INTO public.org_branches (id, organization_id, code, name, address, city, phone, manager_name, seating_capacity, is_active)
VALUES
  ('br-downtown', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'DF-01', 'Downtown Flagship #01', '42 Heritage Boulevard, Central Commercial Square', 'Mumbai', '+91 22 2490 8820', 'George Daniel', 95, true),
  ('br-uptown', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'UE-02', 'Uptown Express Outlet', '14 Skyview Atrium, Bandra West', 'Mumbai', '+91 22 2640 1120', 'Priya Mehta', 60, true),
  ('br-airport', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'AT-03', 'Airport Transit Hub', 'Terminal 2 Departures Mezzanine', 'Mumbai', '+91 22 2830 5500', 'Amitabh Roy', 45, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Departments
INSERT INTO public.departments (id, name, description)
VALUES
  ('kitchen', 'Kitchen & Culinary', 'Chefs, line cooks, and kitchen prep crew'),
  ('floor', 'Floor & Service', 'Table servers, floor captains, and guest hosts'),
  ('bar', 'Beverage & Bar', 'Mixologists, baristas, and cellar staff'),
  ('cashier', 'Billing & Front Desk', 'POS cashiers and reception desk')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Staff
INSERT INTO public.user_profiles (id, full_name, email, phone, role, branch_id, branch_name, department_id, department_name, status)
VALUES
  ('emp-001', 'Marco Rossi', 'marco.rossi@cafescorner.com', '+91 98200 11223', 'Head Chef', 'br-downtown', 'Downtown Flagship #01', 'kitchen', 'Kitchen & Culinary', 'active'),
  ('emp-002', 'Priya Sharma', 'priya.sharma@cafescorner.com', '+91 98200 44556', 'Floor Manager', 'br-downtown', 'Downtown Flagship #01', 'floor', 'Floor & Service', 'active'),
  ('emp-003', 'Dev Patel', 'dev.patel@cafescorner.com', '+91 98200 77889', 'Senior Barista', 'br-downtown', 'Downtown Flagship #01', 'bar', 'Beverage & Bar', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Customers
INSERT INTO public.customers (id, full_name, email, phone, category, loyalty_tier, loyalty_points, total_spend, total_visits, date_of_birth, anniversary_date, status)
VALUES
  ('CUST-882190', 'Alexander Wright', 'alex.wright@venturecap.com', '+91 98201 12345', 'VIP', 'Platinum', 4850, 14250, 28, '1984-06-14', '2016-11-20', 'ACTIVE'),
  ('CUST-441209', 'Sophia Chen-Kapoor', 'sophia.chen@kapoordesign.studio', '+91 98210 99882', 'VIP', 'Gold', 2420, 8940, 19, '1991-03-22', '2019-10-12', 'ACTIVE'),
  ('CUST-109283', 'Rajesh Mehra', 'rajesh.mehra@fintechhorizon.in', '+91 98199 44321', 'REGULAR', 'Silver', 860, 3120, 11, '1979-11-05', '2008-02-14', 'ACTIVE'),
  ('CUST-774019', 'Elena Rostova', 'elena.rostova@globalart.org', '+91 98700 33211', 'NEW', 'Bronze', 120, 480, 2, '1995-09-08', NULL, 'ACTIVE'),
  ('CUST-990312', 'Vikramaditya Singhania', 'v.singhania@indusgroup.com', '+91 98200 88776', 'VIP', 'Platinum', 6200, 22400, 41, '1972-04-18', '2000-12-08', 'ACTIVE'),
  ('CUST-331049', 'Aarav Nair', 'aarav.nair@metalogic.ai', '+91 98330 65432', 'INACTIVE', 'Bronze', 150, 620, 3, '1998-01-30', NULL, 'INACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Leads
INSERT INTO public.leads (id, name, phone, email, company, source, priority, status, assigned_staff_name, estimated_value, next_follow_up_date)
VALUES
  ('LEAD-90124', 'Ananya Deshmukh', '+91 98201 55432', 'ananya.deshmukh@tcs-events.com', 'Tata Consultancy Services', 'website_form', 'URGENT', 'PROPOSAL_SENT', 'Marco Rossi (Head Chef & Banquets)', 4200, '2026-11-20'),
  ('LEAD-90125', 'Rohit Khandelwal', '+91 98210 77301', 'rohit.k@deloittedining.in', 'Deloitte Consulting', 'social_media_meta', 'HIGH', 'IN_DISCUSSION', 'Priya Sharma (Floor Manager)', 1850, '2026-11-19'),
  ('LEAD-90126', 'Natasha Poonawalla', '+91 98200 11984', 'natasha.p@serumfamily.com', 'Poonawalla Heritage Trust', 'referral', 'HIGH', 'QUALIFIED', 'Priya Sharma (Floor Manager)', 6500, '2026-11-21')
ON CONFLICT (id) DO NOTHING;
