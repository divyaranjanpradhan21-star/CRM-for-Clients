-- ============================================================
-- Cafe's Corner CRM: Organization Management Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Extend organizations table with extra fields ──
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS owner_name         TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS status              TEXT NOT NULL DEFAULT 'ACTIVE'
                                               CHECK (status IN ('ACTIVE','SUSPENDED','DEACTIVATED')),
  ADD COLUMN IF NOT EXISTS subscription_plan   TEXT NOT NULL DEFAULT 'STARTER'
                                               CHECK (subscription_plan IN ('STARTER','GROWTH','PRO','ENTERPRISE')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS branch_count        INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_count          INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_count      INT  NOT NULL DEFAULT 0;

-- ── Organization Branches ──
CREATE TABLE IF NOT EXISTS org_branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  phone           TEXT,
  manager_name    TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_branches_org ON org_branches(organization_id);

-- ── Organization Activity Log ──
CREATE TABLE IF NOT EXISTS org_activity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_email     TEXT NOT NULL,
  action          TEXT NOT NULL,
  details         TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_activity_org ON org_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_activity_time ON org_activity_log(created_at DESC);

-- ── RPC: increment branch count ──
CREATE OR REPLACE FUNCTION increment_org_branch_count(org_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE organizations SET branch_count = branch_count + 1 WHERE id = org_id;
$$;

-- ── RLS: Super Admins can read/write all orgs; org users see only their own ──
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_branches   ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to re-run)
DROP POLICY IF EXISTS "super_admin_all_orgs"        ON organizations;
DROP POLICY IF EXISTS "org_user_own_org"             ON organizations;
DROP POLICY IF EXISTS "super_admin_all_branches"     ON org_branches;
DROP POLICY IF EXISTS "org_user_own_branches"        ON org_branches;
DROP POLICY IF EXISTS "super_admin_all_activity"     ON org_activity_log;
DROP POLICY IF EXISTS "org_user_own_activity"        ON org_activity_log;

-- organizations: super admin sees all
CREATE POLICY "super_admin_all_orgs"
  ON organizations FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- organizations: regular org users see only their row
CREATE POLICY "org_user_own_org"
  ON organizations FOR SELECT
  USING (id::TEXT = auth.jwt() ->> 'organizationId');

-- branches: super admin sees all
CREATE POLICY "super_admin_all_branches"
  ON org_branches FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- branches: org user sees own org's branches
CREATE POLICY "org_user_own_branches"
  ON org_branches FOR SELECT
  USING (organization_id::TEXT = auth.jwt() ->> 'organizationId');

-- activity: super admin sees all
CREATE POLICY "super_admin_all_activity"
  ON org_activity_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- activity: org user sees own org's logs
CREATE POLICY "org_user_own_activity"
  ON org_activity_log FOR SELECT
  USING (organization_id::TEXT = auth.jwt() ->> 'organizationId');
