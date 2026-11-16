/**
 * Organizations API — Supabase queries for Super Admin
 * All data stored in Supabase. No hardcoded values.
 */
import { supabase } from './supabase';

// ─────────────────────────── Types ───────────────────────────

export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type SubscriptionPlan = 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'STARTER' | 'GROWTH' | 'PRO';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  gst_number: string | null;
  logo_url: string | null;
  registration_number: string | null;
  status: OrgStatus;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at: string | null;
  branch_count: number;
  user_count: number;
  customer_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrgBranch {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface OrgActivity {
  id: string;
  organization_id: string;
  actor_email: string;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  gst_number: string;
  registration_number: string;
  subscription_plan: SubscriptionPlan;
  logo_url: string;
}

// ─────────────────────────── Helpers ───────────────────────────

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─────────────────────────── Organizations CRUD ───────────────────────────

/** Fetch all organizations (super admin view) */
export async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Organization[];
}

/** Fetch single organization */
export async function fetchOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Organization;
}

/** Create a new organization */
export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert([{
      name: input.name,
      slug: slugify(input.name),
      owner_name: input.owner_name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country || 'IN',
      gst_number: input.gst_number,
      registration_number: input.registration_number,
      subscription_plan: input.subscription_plan,
      logo_url: input.logo_url,
      status: 'ACTIVE',
      is_active: true,
      branch_count: 0,
      user_count: 0,
      customer_count: 0,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Organization;
}

/** Update organization details */
export async function updateOrganization(id: string, updates: Partial<CreateOrganizationInput>): Promise<Organization> {
  const payload: Record<string, unknown> = { ...updates };
  if (updates.name) payload.slug = slugify(updates.name);

  const { data, error } = await supabase
    .from('organizations')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Organization;
}

/** Change organization status: ACTIVE | SUSPENDED | DEACTIVATED */
export async function setOrganizationStatus(id: string, status: OrgStatus, actorEmail: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({
      status,
      is_active: status === 'ACTIVE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;

  // Log activity
  await logOrgActivity(id, actorEmail, `Organization status changed to ${status}`, null);
}

/** Soft-delete an organization */
export async function deleteOrganization(id: string, actorEmail: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id);

  if (error) throw error;
  await logOrgActivity(id, actorEmail, 'Organization deleted (soft)', null);
}

/** Assign subscription plan */
export async function assignSubscriptionPlan(
  id: string,
  plan: SubscriptionPlan,
  expiresAt: string | null,
  actorEmail: string
): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_plan: plan,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
  await logOrgActivity(id, actorEmail, `Subscription plan changed to ${plan}`, null);
}

// ─────────────────────────── Branches ───────────────────────────

/** Fetch branches for an organization */
export async function fetchBranches(organizationId: string): Promise<OrgBranch[]> {
  const { data, error } = await supabase
    .from('org_branches')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as OrgBranch[];
}

/** Create a branch under an organization */
export async function createBranch(branch: Omit<OrgBranch, 'id' | 'created_at'>): Promise<OrgBranch> {
  const { data, error } = await supabase
    .from('org_branches')
    .insert([{ ...branch, is_active: true }])
    .select()
    .single();

  if (error) throw error;

  // Update branch count
  await supabase.rpc('increment_org_branch_count', { org_id: branch.organization_id });

  return data as OrgBranch;
}

/** Toggle branch active status */
export async function setBranchActive(branchId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('org_branches')
    .update({ is_active: isActive })
    .eq('id', branchId);

  if (error) throw error;
}

// ─────────────────────────── Users under org ───────────────────────────

/** Fetch users belonging to an organization */
export async function fetchOrgUsers(organizationId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, is_active, last_login_at, created_at, roles(name)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Fetch customers belonging to an organization (by org_id on customers table) */
export async function fetchOrgCustomers(organizationId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, created_at, is_active')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─────────────────────────── Activity Log ───────────────────────────

/** Log an org-wise activity entry */
export async function logOrgActivity(
  organizationId: string,
  actorEmail: string,
  action: string,
  details: string | null
): Promise<void> {
  await supabase.from('org_activity_log').insert([{
    organization_id: organizationId,
    actor_email: actorEmail,
    action,
    details,
    created_at: new Date().toISOString(),
  }]);
}

/** Fetch activity log for an organization */
export async function fetchOrgActivity(organizationId: string): Promise<OrgActivity[]> {
  const { data, error } = await supabase
    .from('org_activity_log')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as OrgActivity[];
}
