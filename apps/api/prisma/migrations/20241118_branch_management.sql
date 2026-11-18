-- ============================================================
-- Cafe's Corner CRM: Branch Management & Outlet Data Isolation Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Ensure org_branches has all multi-outlet fields
CREATE TABLE IF NOT EXISTS org_branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL DEFAULT 'BR-01',
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT DEFAULT 'Mumbai',
  state           TEXT DEFAULT 'Maharashtra',
  pincode         TEXT DEFAULT '400001',
  phone           TEXT,
  email           TEXT,
  manager_name    TEXT,
  manager_email   TEXT,
  manager_phone   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  seating_capacity INT NOT NULL DEFAULT 80,
  operating_hours JSONB,
  holidays        JSONB,
  menu_overrides  JSONB,
  assigned_staff  JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add extra columns if org_branches already existed
ALTER TABLE org_branches
  ADD COLUMN IF NOT EXISTS code            TEXT NOT NULL DEFAULT 'BR-01',
  ADD COLUMN IF NOT EXISTS state           TEXT DEFAULT 'Maharashtra',
  ADD COLUMN IF NOT EXISTS pincode         TEXT DEFAULT '400001',
  ADD COLUMN IF NOT EXISTS email           TEXT,
  ADD COLUMN IF NOT EXISTS manager_email   TEXT,
  ADD COLUMN IF NOT EXISTS manager_phone   TEXT,
  ADD COLUMN IF NOT EXISTS seating_capacity INT NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS operating_hours JSONB,
  ADD COLUMN IF NOT EXISTS holidays        JSONB,
  ADD COLUMN IF NOT EXISTS menu_overrides  JSONB,
  ADD COLUMN IF NOT EXISTS assigned_staff  JSONB,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_branches_org      ON org_branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_branches_code     ON org_branches(code);
CREATE INDEX IF NOT EXISTS idx_org_branches_active   ON org_branches(is_active);

-- Enable RLS
ALTER TABLE org_branches ENABLE ROW LEVEL SECURITY;

-- Super Admin and Restaurant Admin can select and manage all branches
CREATE POLICY org_branches_admin_access ON org_branches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('SUPER_ADMIN', 'RESTAURANT_ADMIN')
    )
  );

-- Branch-restricted users can only select their authorized branch
CREATE POLICY org_branches_staff_read ON org_branches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND (
          user_profiles.role = 'STAFF'
          OR user_profiles.role = 'BRANCH_MANAGER'
        )
        AND user_profiles.branch = org_branches.name
    )
  );
