-- ============================================================
-- Migration: 20241117_user_management.sql
-- User Management System for Super Admin
-- Covers: platform admins, account status, permissions,
--         login history, and cross-org user views.
-- ============================================================

-- ── 1. Account status enum ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deactivated', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. User roles enum (extend if exists) ─────────────────────
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
EXCEPTION WHEN undefined_object THEN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','PLATFORM_ADMIN','RESTAURANT_ADMIN','STAFF','CUSTOMER');
END $$;

-- ── 3. Extend user_profiles table ────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS permissions    text[]         NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phone          text,
  ADD COLUMN IF NOT EXISTS avatar_url     text,
  ADD COLUMN IF NOT EXISTS created_by     text,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz    DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login_at  timestamptz;

-- ── 4. Admin permissions table ────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission    text NOT NULL,
  granted_by    uuid REFERENCES user_profiles(id),
  granted_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_user ON admin_permissions(user_id);

-- ── 5. Login history table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  email         text NOT NULL,
  ip_address    text,
  user_agent    text,
  status        text NOT NULL CHECK (status IN ('success','failed','mfa_required','locked','admin_password_reset')),
  location      text,
  device_type   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user    ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC);

-- ── 6. Platform users cross-org view ─────────────────────────
CREATE OR REPLACE VIEW platform_users_view AS
SELECT
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.account_status,
  up.organization_id,
  o.name            AS organization_name,
  up.permissions,
  up.created_at,
  up.last_login_at,
  up.created_by,
  up.phone,
  up.avatar_url
FROM user_profiles up
LEFT JOIN organizations o ON o.id = up.organization_id;

-- ── 7. RLS Policies ───────────────────────────────────────────

-- Enable RLS on new tables
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history     ENABLE ROW LEVEL SECURITY;

-- Super Admin can see ALL admin_permissions
CREATE POLICY IF NOT EXISTS "super_admin_all_permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'SUPER_ADMIN'
    )
  );

-- Users can see their own permissions
CREATE POLICY IF NOT EXISTS "user_own_permissions"
  ON admin_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super Admin can see ALL login history
CREATE POLICY IF NOT EXISTS "super_admin_all_login_history"
  ON login_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN')
    )
  );

-- Users can see their own login history
CREATE POLICY IF NOT EXISTS "user_own_login_history"
  ON login_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super Admin can read the cross-org user view
CREATE POLICY IF NOT EXISTS "super_admin_view_all_users"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Super admin or platform admin sees all
    EXISTS (
      SELECT 1 FROM user_profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN')
    )
    OR
    -- Restaurant admin sees only their org
    EXISTS (
      SELECT 1 FROM user_profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.role = 'RESTAURANT_ADMIN'
        AND viewer.organization_id = user_profiles.organization_id
    )
    OR
    -- Users can always see themselves
    id = auth.uid()
  );

-- Super Admin can update any user profile
CREATE POLICY IF NOT EXISTS "super_admin_update_users"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN')
    )
  );

-- Super Admin can insert new users
CREATE POLICY IF NOT EXISTS "super_admin_insert_users"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN')
    )
  );

-- ── 8. Helper function: auto-update updated_at ────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 9. Helper function: record login event ────────────────────
CREATE OR REPLACE FUNCTION record_login_event(
  p_user_id   uuid,
  p_email     text,
  p_ip        text,
  p_agent     text,
  p_status    text,
  p_location  text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO login_history(user_id, email, ip_address, user_agent, status, location, device_type)
  VALUES (p_user_id, p_email, p_ip, p_agent, p_status, p_location, p_agent);

  -- Update last_login_at on success
  IF p_status = 'success' THEN
    UPDATE user_profiles SET last_login_at = now() WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE admin_permissions IS 'Granular permission assignments for platform and restaurant administrators';
COMMENT ON TABLE login_history IS 'Audit log of all authentication events across the platform';
COMMENT ON VIEW platform_users_view IS 'Cross-organization user view accessible to Super Admin and Platform Admins';
