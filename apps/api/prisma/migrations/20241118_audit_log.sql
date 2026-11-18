-- Migration: 20241118_audit_log.sql
-- Creates audit_logs table for the Super Admin Audit & Activity Monitoring module

CREATE TABLE IF NOT EXISTS audit_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       text NOT NULL,
  category         text NOT NULL,
  severity         text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  actor_email      text NOT NULL,
  actor_role       text,
  target_email     text,
  organization_id  uuid REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name text,
  action           text NOT NULL,
  details          jsonb,
  ip_address       text,
  user_agent       text,
  status           text NOT NULL CHECK (status IN ('success', 'failed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type    ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity      ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization  ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email   ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status        ON audit_logs(status);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin can read all logs
CREATE POLICY audit_logs_super_admin_read ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'SUPER_ADMIN'
    )
  );

-- Platform Admins can read logs for their organization only
CREATE POLICY audit_logs_platform_admin_read ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'PLATFORM_ADMIN'
        AND (
          audit_logs.organization_id = user_profiles.organization_id
          OR audit_logs.organization_id IS NULL
        )
    )
  );

-- System/service role can insert audit events
CREATE POLICY audit_logs_system_insert ON audit_logs
  FOR INSERT
  WITH CHECK (true);
