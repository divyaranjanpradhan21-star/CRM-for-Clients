export type UserRole = 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  organizationId?: string;
  organizationName?: string;
  branchName?: string;
  mfaEnabled?: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  timestamp: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null; // timestamp in ms
}

const STORAGE_KEYS = {
  AUTH_USER: 'cafes_corner_auth_user',
  AUTH_TOKEN: 'cafes_corner_auth_token',
  LOGIN_HISTORY: 'cafes_corner_login_history',
  LOCKOUT_PREFIX: 'cafes_corner_lockout_',
  MFA_PENDING: 'cafes_corner_mfa_pending',
  PASSWORD_RESET_CODES: 'cafes_corner_reset_codes',
};

// Default seed accounts for Cafe's Corner CRM
export const DEFAULT_USERS: Record<string, { role: UserRole; fullName: string; org: string; branch: string; passwordHash: string }> = {
  'superadmin@example.com': {
    role: 'SUPER_ADMIN',
    fullName: 'Alex Mercer (Platform Owner)',
    org: "Cafe's Corner Platform",
    branch: 'Global Command',
    passwordHash: 'ChangeMe#12345',
  },
  'admin@democompany.com': {
    role: 'RESTAURANT_ADMIN',
    fullName: 'George Daniel (General Manager)',
    org: "Cafe's Corner Bistro",
    branch: 'Main Branch #01',
    passwordHash: 'AdminPass#123',
  },
  'staff@democompany.com': {
    role: 'STAFF',
    fullName: 'Renata Osei (Floor Hostess)',
    org: "Cafe's Corner Bistro",
    branch: 'Floor Terminal #01',
    passwordHash: 'StaffPass#123',
  },
};

// Determine role based on email patterns or known users
export function determineRoleFromEmail(email: string): UserRole {
  const lower = email.toLowerCase().trim();
  if (DEFAULT_USERS[lower]) {
    return DEFAULT_USERS[lower].role;
  }
  if (lower.includes('superadmin') || lower.includes('super_admin') || lower.includes('owner')) {
    return 'SUPER_ADMIN';
  }
  if (lower.includes('staff') || lower.includes('waiter') || lower.includes('barista') || lower.includes('cashier')) {
    return 'STAFF';
  }
  return 'RESTAURANT_ADMIN';
}

// Lockout helper: 5 failed attempts = 5 min lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

export function getLockoutState(email: string): LockoutState {
  const raw = localStorage.getItem(STORAGE_KEYS.LOCKOUT_PREFIX + email.toLowerCase().trim());
  if (!raw) return { failedAttempts: 0, lockedUntil: null };
  try {
    const parsed: LockoutState = JSON.parse(raw);
    if (parsed.lockedUntil && Date.now() > parsed.lockedUntil) {
      // Lockout expired
      clearLockout(email);
      return { failedAttempts: 0, lockedUntil: null };
    }
    return parsed;
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
}

export function recordFailedAttempt(email: string): { isLocked: boolean; remainingMs?: number; attemptsLeft: number } {
  const normEmail = email.toLowerCase().trim();
  const current = getLockoutState(normEmail);
  const newAttempts = current.failedAttempts + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(
      STORAGE_KEYS.LOCKOUT_PREFIX + normEmail,
      JSON.stringify({ failedAttempts: newAttempts, lockedUntil })
    );
    return { isLocked: true, remainingMs: LOCKOUT_DURATION_MS, attemptsLeft: 0 };
  } else {
    localStorage.setItem(
      STORAGE_KEYS.LOCKOUT_PREFIX + normEmail,
      JSON.stringify({ failedAttempts: newAttempts, lockedUntil: null })
    );
    return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - newAttempts };
  }
}

export function clearLockout(email: string): void {
  localStorage.removeItem(STORAGE_KEYS.LOCKOUT_PREFIX + email.toLowerCase().trim());
}

// Audit & Login History Log
export function recordLoginHistory(attempt: Omit<LoginAttempt, 'id' | 'timestamp'>): void {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEYS.LOGIN_HISTORY);
    const existing: LoginAttempt[] = existingRaw ? JSON.parse(existingRaw) : [];
    const newEntry: LoginAttempt = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...attempt,
    };
    // Keep last 50 entries
    const updated = [newEntry, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to log login history', err);
  }
}

export function getLoginHistory(filterEmail?: string): LoginAttempt[] {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEYS.LOGIN_HISTORY);
    if (!existingRaw) return [];
    const logs: LoginAttempt[] = JSON.parse(existingRaw);
    if (filterEmail) {
      return logs.filter((l) => l.email.toLowerCase() === filterEmail.toLowerCase());
    }
    return logs;
  } catch {
    return [];
  }
}

// Session state handling
export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentSession(user: AuthUser, token?: string): void {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  localStorage.setItem('portal_role', user.role);
  localStorage.setItem('user_email', user.email);
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }
}

export function clearCurrentSession(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem('portal_role');
  localStorage.removeItem('user_email');
  localStorage.removeItem(STORAGE_KEYS.MFA_PENDING);
}

// Password Reset Code Verification Store (Email Verification simulation / Supabase integration)
interface ResetCodeEntry {
  code: string;
  expiresAt: number;
}

export function generateVerificationCode(email: string): string {
  const norm = email.toLowerCase().trim();
  // 6 digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins validity

  const raw = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESET_CODES);
  const codes: Record<string, ResetCodeEntry> = raw ? JSON.parse(raw) : {};
  codes[norm] = { code, expiresAt };
  localStorage.setItem(STORAGE_KEYS.PASSWORD_RESET_CODES, JSON.stringify(codes));

  return code;
}

export function verifyResetCode(email: string, code: string): boolean {
  const norm = email.toLowerCase().trim();
  const raw = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESET_CODES);
  if (!raw) return false;
  try {
    const codes: Record<string, ResetCodeEntry> = JSON.parse(raw);
    const entry = codes[norm];
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) return false;
    return entry.code.trim() === code.trim();
  } catch {
    return false;
  }
}

export function updateUserPassword(email: string, newPassword: string): boolean {
  const norm = email.toLowerCase().trim();
  // Update in local default store if present
  if (DEFAULT_USERS[norm]) {
    DEFAULT_USERS[norm].passwordHash = newPassword;
  }
  // Store custom password overrides in localStorage
  const overridesRaw = localStorage.getItem('cafes_corner_passwords') || '{}';
  const overrides = JSON.parse(overridesRaw);
  overrides[norm] = newPassword;
  localStorage.setItem('cafes_corner_passwords', JSON.stringify(overrides));

  // Invalidate reset code
  const rawCodes = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESET_CODES);
  if (rawCodes) {
    const codes = JSON.parse(rawCodes);
    delete codes[norm];
    localStorage.setItem(STORAGE_KEYS.PASSWORD_RESET_CODES, JSON.stringify(codes));
  }
  return true;
}

export function verifyPassword(email: string, candidate: string): boolean {
  const norm = email.toLowerCase().trim();
  const overridesRaw = localStorage.getItem('cafes_corner_passwords');
  if (overridesRaw) {
    try {
      const overrides = JSON.parse(overridesRaw);
      if (overrides[norm]) {
        return overrides[norm] === candidate;
      }
    } catch {
      // fallback
    }
  }

  if (DEFAULT_USERS[norm]) {
    return DEFAULT_USERS[norm].passwordHash === candidate;
  }

  // Any non-empty password of length >= 6 for newly registered users
  return candidate.length >= 6;
}
