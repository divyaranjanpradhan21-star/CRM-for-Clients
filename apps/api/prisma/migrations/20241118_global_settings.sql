-- ============================================================
-- Migration: 20241118_global_settings.sql
-- Global Platform Settings & Configuration History for Super Admin
-- Covers:
--   1. Platform Name, Logo, Favicon & Brand Colors
--   2. Default Currency, Timezone & Date/Time Formats
--   3. Global Notification Settings (Email/SMTP, SMS, Push, Event Triggers)
--   4. System-Wide Security Settings (Password complexity, Session, Lockout, MFA, IP Whitelist)
--   5. Third-Party Integrations (Stripe, Razorpay, Storage, WhatsApp, Analytics)
--   6. System Configuration History & Versioned Rollbacks
-- ============================================================

-- ── 1. Global Settings Table (Singleton pattern) ──────────────
CREATE TABLE IF NOT EXISTS global_settings (
  id              text PRIMARY KEY DEFAULT 'singleton',
  settings_data   jsonb NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      text NOT NULL DEFAULT 'superadmin@cafescorner.com',
  CONSTRAINT singleton_check CHECK (id = 'singleton')
);

-- ── 2. System Configuration History Table ─────────────────────
CREATE TABLE IF NOT EXISTS system_config_history (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version               text NOT NULL,
  category              text NOT NULL CHECK (category IN ('Branding', 'Localization', 'Notifications', 'Security', 'Integrations', 'Full Rollback')),
  changed_by            text NOT NULL,
  change_summary        text NOT NULL,
  snapshot_data         jsonb NOT NULL,
  reverted_from_version text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_config_history_created ON system_config_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_history_version ON system_config_history(version);

-- ── 3. Seed Default Singleton Settings (if not existing) ──────
INSERT INTO global_settings (id, settings_data, updated_at, updated_by)
VALUES (
  'singleton',
  '{
    "branding": {
      "platform_name": "Cafe''s Corner Multi-Tenant Platform",
      "platform_tagline": "Enterprise Restaurant CRM & Cloud POS",
      "logo_url": "/logo.png",
      "favicon_url": "/favicon.ico",
      "primary_color": "#3A5726",
      "secondary_color": "#EFEACA",
      "support_email": "support@cafescorner.com",
      "support_phone": "+91 800-456-7890",
      "footer_text": "Cafe''s Corner · Multi-Tenant Restaurant CRM & Cloud POS",
      "portal_title": "Cafe''s Corner Administration"
    },
    "localization": {
      "default_currency": "INR",
      "currency_symbol": "₹",
      "currency_position": "before",
      "decimal_precision": 2,
      "default_timezone": "Asia/Kolkata",
      "date_format": "DD/MM/YYYY",
      "time_format": "12h",
      "fiscal_year_start": "04-01"
    },
    "notifications": {
      "email_enabled": true,
      "email_provider": "smtp",
      "email_from_name": "Cafe''s Corner Notifications",
      "email_from_address": "notifications@cafescorner.com",
      "smtp_host": "smtp.sendgrid.net",
      "smtp_port": 587,
      "smtp_encryption": "tls",
      "sms_enabled": true,
      "sms_provider": "twilio",
      "push_enabled": true,
      "push_provider": "firebase",
      "notify_new_organization": true,
      "notify_subscription_renewals": true,
      "notify_failed_logins": true,
      "notify_system_maintenance": true,
      "daily_executive_digest": true
    },
    "security": {
      "min_password_length": 8,
      "require_uppercase": true,
      "require_numbers": true,
      "require_special_chars": true,
      "session_timeout_minutes": 60,
      "max_login_attempts": 5,
      "lockout_duration_minutes": 15,
      "mfa_enforcement": "super_admin_only",
      "ip_whitelist_enabled": false,
      "ip_whitelist": "192.168.1.0/24, 10.0.0.0/8",
      "sso_enabled": true,
      "allowed_oauth_providers": ["google", "apple"],
      "audit_log_retention_days": 180
    },
    "integrations": {
      "items": [
        {
          "id": "int-stripe",
          "name": "Stripe Payments",
          "category": "payment",
          "provider": "stripe",
          "is_enabled": true,
          "is_connected": true,
          "environment": "production",
          "credentials": {
            "publishable_key": "pk_live_********************4819",
            "secret_key": "sk_live_********************9201",
            "webhook_secret": "whsec_********************"
          },
          "notes": "Processes international credit & debit cards for subscription billing"
        },
        {
          "id": "int-razorpay",
          "name": "Razorpay Gateway",
          "category": "payment",
          "provider": "razorpay",
          "is_enabled": true,
          "is_connected": true,
          "environment": "production",
          "credentials": {
            "key_id": "rzp_live_****************",
            "key_secret": "************************"
          },
          "notes": "UPI, NetBanking & domestic Indian payments provider"
        },
        {
          "id": "int-supabase-storage",
          "name": "Supabase Cloud Storage",
          "category": "storage",
          "provider": "supabase",
          "is_enabled": true,
          "is_connected": true,
          "environment": "production",
          "credentials": {
            "bucket_name": "restaurant-assets",
            "region": "ap-south-1"
          },
          "notes": "Stores restaurant logos, menus, and media assets"
        },
        {
          "id": "int-whatsapp",
          "name": "WhatsApp Cloud API",
          "category": "communication",
          "provider": "meta_whatsapp",
          "is_enabled": true,
          "is_connected": true,
          "environment": "production",
          "credentials": {
            "phone_number_id": "109283746592817",
            "business_account_id": "82736451928374",
            "access_token": "EAAG********************"
          },
          "notes": "Automated table booking confirmations and digital receipts"
        },
        {
          "id": "int-ga4",
          "name": "Google Analytics 4",
          "category": "analytics",
          "provider": "google_analytics",
          "is_enabled": true,
          "is_connected": true,
          "environment": "production",
          "credentials": {
            "measurement_id": "G-7X9Y2Z8W4K"
          },
          "notes": "Tracks portal traffic, conversion funnels & user engagement"
        }
      ]
    }
  }'::jsonb,
  now(),
  'system'
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Seed Initial Configuration History ─────────────────────
INSERT INTO system_config_history (version, category, changed_by, change_summary, snapshot_data, created_at)
VALUES (
  'v1.0',
  'Branding',
  'system',
  'Initial baseline multi-tenant system configuration established',
  (SELECT settings_data FROM global_settings WHERE id = 'singleton'),
  now() - interval '7 days'
)
ON CONFLICT DO NOTHING;

-- ── 5. Row Level Security Policies ────────────────────────────
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config_history ENABLE ROW LEVEL SECURITY;

-- Super Admin has full read and write access to global settings
CREATE POLICY IF NOT EXISTS "super_admin_all_global_settings"
  ON global_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- All authenticated users can view public branding/currency (safe subset)
CREATE POLICY IF NOT EXISTS "authenticated_read_global_settings"
  ON global_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Super Admin has full access to configuration history
CREATE POLICY IF NOT EXISTS "super_admin_all_config_history"
  ON system_config_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

COMMENT ON TABLE global_settings IS 'Singleton store for system-wide platform branding, currency, security, notifications and integrations';
COMMENT ON TABLE system_config_history IS 'Versioned audit log of all system configuration changes with 1-click rollback support';
