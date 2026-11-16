-- ============================================================
-- Cafe's Corner CRM: Subscription & Billing Management Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. Subscription Plans Master Table ──
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                   TEXT UNIQUE NOT NULL, -- 'FREE', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE'
  name                  TEXT NOT NULL,
  description           TEXT,
  price_monthly         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_quarterly       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_branches          INT NOT NULL DEFAULT 1,
  max_users             INT NOT NULL DEFAULT 2,
  max_orders_per_month  INT NOT NULL DEFAULT 300,
  max_customers         INT NOT NULL DEFAULT 500,
  features              JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans if table is empty
INSERT INTO subscription_plans (key, name, description, price_monthly, price_quarterly, price_yearly, max_branches, max_users, max_orders_per_month, max_customers, features)
VALUES
  ('FREE', 'Free Tier', 'Ideal for solo pop-up cafes and newly launched counters', 0, 0, 0, 1, 2, 200, 300, '["1 Branch", "2 Staff Users", "Basic POS", "Standard Email Support"]'::jsonb),
  ('BASIC', 'Basic Plan', 'Designed for single-location neighborhood cafes with moderate traffic', 29, 79, 290, 1, 5, 800, 1500, '["1 Branch", "5 Staff Users", "Table Floor Terminal", "Customer Loyalty Points", "Export Reports"]'::jsonb),
  ('STANDARD', 'Standard Growth', 'Best suited for growing cafes and bistros with multiple shifts', 69, 189, 690, 3, 15, 2500, 5000, '["Up to 3 Branches", "15 Staff Accounts", "Full Kitchen Display System", "Automated SMS / Email Promos", "Daily P&L Analytics"]'::jsonb),
  ('PREMIUM', 'Premium Scale', 'For busy high-volume coffee houses with kitchen display & loyalty engines', 129, 349, 1290, 6, 40, 8000, 20000, '["Up to 6 Branches", "40 Staff Accounts", "Multi-Floor Live Sync", "VIP Member CRM Tiering", "Custom Branding & Receipts", "Priority 24/7 SLA"]'::jsonb),
  ('ENTERPRISE', 'Enterprise Global', 'Complete solution for franchise roasters, chains & multi-city groups', 299, 799, 2990, 999, 999, 999999, 999999, '["Unlimited Branches", "Unlimited Staff", "Dedicated Account Manager", "Custom ERP / Accounting Webhooks", "Zero-Latency Realtime Fleet Sync", "Custom Domain & SSO"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 2. Organization Subscriptions Table ──
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_key              TEXT NOT NULL DEFAULT 'FREE',
  billing_interval      TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly')),
  amount                NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'RENEWAL_DUE', 'EXPIRED', 'CANCELLED')),
  is_trial              BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days            INT DEFAULT 14,
  start_date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date           TIMESTAMPTZ NOT NULL,
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_subs_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_status ON organization_subscriptions(status);

-- ── 3. Subscription Payments & Invoices History Table ──
CREATE TABLE IF NOT EXISTS subscription_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id       UUID REFERENCES organization_subscriptions(id) ON DELETE SET NULL,
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name     TEXT NOT NULL,
  plan_key              TEXT NOT NULL,
  billing_interval      TEXT NOT NULL DEFAULT 'monthly',
  amount                NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method        TEXT NOT NULL DEFAULT 'CARD' CHECK (payment_method IN ('CARD', 'UPI', 'BANK_TRANSFER', 'CASH', 'ONLINE')),
  transaction_reference TEXT,
  status                TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PENDING', 'FAILED', 'REFUNDED')),
  paid_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invoice_number        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_payments_org ON subscription_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_paid_at ON subscription_payments(paid_at DESC);

-- ── 4. Extend organizations table ──
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS subscription_interval TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS subscription_start_at TIMESTAMPTZ DEFAULT NOW();

-- ── 5. Row Level Security ──
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_read_plans" ON subscription_plans;
DROP POLICY IF EXISTS "super_admin_manage_plans" ON subscription_plans;
DROP POLICY IF EXISTS "super_admin_all_subs" ON organization_subscriptions;
DROP POLICY IF EXISTS "org_user_own_subs" ON organization_subscriptions;
DROP POLICY IF EXISTS "super_admin_all_payments" ON subscription_payments;
DROP POLICY IF EXISTS "org_user_own_payments" ON subscription_payments;

CREATE POLICY "anyone_can_read_plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "super_admin_manage_plans" ON subscription_plans FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "super_admin_all_subs" ON organization_subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
CREATE POLICY "org_user_own_subs" ON organization_subscriptions FOR SELECT USING (organization_id::TEXT = auth.jwt() ->> 'organizationId');

CREATE POLICY "super_admin_all_payments" ON subscription_payments FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
CREATE POLICY "org_user_own_payments" ON subscription_payments FOR SELECT USING (organization_id::TEXT = auth.jwt() ->> 'organizationId');
