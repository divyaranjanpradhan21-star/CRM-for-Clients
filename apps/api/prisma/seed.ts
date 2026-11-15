/**
 * Seed script. Idempotent: safe to run repeatedly.
 *  - ALWAYS creates: permission catalogue, platform Super Admin role + user.
 *  - DEMO ONLY (skipped when SEED_DEMO=false): a "Demo Company" org with default roles,
 *    lead statuses/sources/categories and a default pipeline. Contains no fake leads/clients.
 */
import process from 'node:process';
import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaClient, PermissionAction, PermissionScope, Permission } from '@prisma/client';
import { MODULES, ACTIONS } from '@crm/shared';

const prisma = new PrismaClient();
type A = PermissionAction;
const ALL: A[] = [...ACTIONS] as A[];
const CRUD: A[] = ['VIEW', 'CREATE', 'EDIT', 'DELETE'];
const VCE: A[] = ['VIEW', 'CREATE', 'EDIT'];
const V: A[] = ['VIEW'];
const VX: A[] = ['VIEW', 'EXPORT'];

type Grant = [module: string, actions: A[], scope: PermissionScope];

const ROLES: { key: string; name: string; description: string; grants: Grant[] }[] = [
  {
    key: 'admin', name: 'Admin', description: 'Full access within the organization',
    grants: (MODULES as readonly string[]).map((m): Grant =>
      m === 'audit' ? [m, VX, 'ORG'] : [m, ALL, 'ORG']),
  },
  {
    key: 'sales_manager', name: 'Sales Manager', description: 'Manages team leads, deals and follow-ups',
    grants: [
      ['leads', ALL, 'TEAM'], ['followups', [...CRUD, 'ASSIGN'], 'TEAM'], ['tasks', [...CRUD, 'ASSIGN'], 'TEAM'],
      ['clients', [...VCE, 'EXPORT'], 'TEAM'], ['deals', [...CRUD, 'ASSIGN', 'APPROVE'], 'TEAM'],
      ['products', V, 'ORG'], ['quotations', [...VCE, 'APPROVE'], 'TEAM'], ['invoices', V, 'TEAM'], ['payments', V, 'TEAM'],
      ['campaigns', V, 'ORG'], ['tickets', V, 'TEAM'], ['communications', VCE, 'TEAM'],
      ['documents', ['VIEW', 'CREATE', 'DELETE'], 'TEAM'], ['reports', VX, 'TEAM'],
      ['employees', V, 'TEAM'], ['notifications', V, 'OWN'],
    ],
  },
  {
    key: 'sales_executive', name: 'Sales Executive', description: 'Works assigned leads and clients',
    grants: [
      ['leads', VCE, 'OWN'], ['followups', VCE, 'OWN'], ['tasks', VCE, 'OWN'], ['clients', VCE, 'OWN'],
      ['deals', VCE, 'OWN'], ['products', V, 'ORG'], ['quotations', VCE, 'OWN'], ['invoices', V, 'OWN'],
      ['communications', VCE, 'OWN'], ['documents', ['VIEW', 'CREATE'], 'OWN'], ['reports', V, 'OWN'],
      ['notifications', V, 'OWN'],
    ],
  },
  {
    key: 'marketing_manager', name: 'Marketing Manager', description: 'Runs campaigns and marketing leads',
    grants: [
      ['campaigns', ALL, 'ORG'], ['leads', [...VCE, 'EXPORT', 'IMPORT'], 'ORG'], ['products', VCE, 'ORG'],
      ['clients', V, 'ORG'], ['followups', VCE, 'OWN'], ['tasks', VCE, 'OWN'], ['communications', VCE, 'OWN'],
      ['documents', ['VIEW', 'CREATE'], 'OWN'], ['reports', VX, 'ORG'], ['notifications', V, 'OWN'],
    ],
  },
  {
    key: 'support_executive', name: 'Support Executive', description: 'Handles assigned support tickets',
    grants: [
      ['tickets', VCE, 'OWN'], ['clients', ['VIEW', 'EDIT'], 'OWN'], ['leads', V, 'OWN'],
      ['followups', VCE, 'OWN'], ['tasks', VCE, 'OWN'], ['communications', ['VIEW', 'CREATE'], 'OWN'],
      ['documents', ['VIEW', 'CREATE'], 'OWN'], ['reports', V, 'OWN'], ['notifications', V, 'OWN'],
    ],
  },
  {
    key: 'accountant', name: 'Accountant', description: 'Manages quotations, invoices and payments',
    grants: [
      ['quotations', ALL, 'ORG'], ['invoices', ALL, 'ORG'], ['payments', ALL, 'ORG'],
      ['products', VCE, 'ORG'], ['clients', V, 'ORG'], ['deals', V, 'ORG'],
      ['documents', ['VIEW', 'CREATE'], 'ORG'], ['reports', VX, 'ORG'], ['notifications', V, 'OWN'],
    ],
  },
  {
    key: 'viewer', name: 'Viewer', description: 'Read-only access',
    grants: (['leads', 'clients', 'deals', 'products', 'quotations', 'invoices', 'campaigns', 'tickets', 'reports', 'followups', 'tasks'] as string[])
      .map((m): Grant => [m, V, 'ORG']),
  },
];

const LEAD_STATUSES = [
  ['New', '#3b82f6'], ['Contacted', '#6366f1'], ['Interested', '#8b5cf6'], ['Qualified', '#0ea5e9'],
  ['Proposal Sent', '#f59e0b'], ['Negotiation', '#f97316'], ['Won', '#22c55e'], ['Lost', '#ef4444'],
] as const;
const LEAD_SOURCES = ['Website', 'Facebook', 'Instagram', 'Google Ads', 'LinkedIn', 'WhatsApp', 'Referral',
  'Cold Calling', 'Email Campaign', 'Walk-in', 'Other'];
const STAGES: [string, number, boolean, boolean][] = [
  ['New Opportunity', 10, false, false], ['Qualification', 20, false, false], ['Requirement Analysis', 40, false, false],
  ['Proposal', 60, false, false], ['Negotiation', 80, false, false], ['Won', 100, true, false], ['Lost', 0, false, true],
];

async function seedPermissions() {
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      await prisma.permission.upsert({
        where: { module_action: { module, action: action as A } },
        update: {}, create: { module, action: action as A },
      });
    }
  }
}

async function seedSuperAdmin() {
  let role = await prisma.role.findFirst({ where: { organizationId: null, key: 'super_admin' } });
  if (!role) role = await prisma.role.create({
    data: { key: 'super_admin', name: 'Super Admin', description: 'Platform-wide access', isSystem: true },
  });
  const perms = await prisma.permission.findMany();
  await prisma.rolePermission.createMany({
    data: perms.map((p: Permission) => ({ roleId: role!.id, permissionId: p.id, scope: 'ALL' as const })),
    skipDuplicates: true,
  });
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'superadmin@example.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error('Set SEED_ADMIN_PASSWORD (min 12 chars) in .env');
  await prisma.user.upsert({
    where: { email }, update: {},
    create: {
      email, firstName: 'Super', lastName: 'Admin', roleId: role.id,
      passwordHash: await argon2.hash(password), emailVerifiedAt: new Date(),
    },
  });
  console.log(`Super admin ready: ${email}`);
}

async function seedDemoOrg() {
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' }, update: {},
    create: { name: 'Demo Company', slug: 'demo', currency: 'INR', timezone: 'Asia/Kolkata' },
  });
  const oid = org.id;

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: oid, key: r.key } },
      update: {}, create: { organizationId: oid, key: r.key, name: r.name, description: r.description, isSystem: true },
    });
    for (const [module, actions, scope] of r.grants) {
      const perms = await prisma.permission.findMany({ where: { module, action: { in: actions } } });
      await prisma.rolePermission.createMany({
        data: perms.map((p: Permission) => ({ roleId: role.id, permissionId: p.id, scope })),
        skipDuplicates: true,
      });
    }
  }

  for (const [i, [name, color]] of LEAD_STATUSES.entries()) {
    await prisma.leadStatus.upsert({
      where: { organizationId_name: { organizationId: oid, name } }, update: {},
      create: { organizationId: oid, name, color, position: i, isWon: name === 'Won', isLost: name === 'Lost' },
    });
  }
  for (const [i, name] of LEAD_SOURCES.entries()) {
    await prisma.leadSource.upsert({
      where: { organizationId_name: { organizationId: oid, name } }, update: {},
      create: { organizationId: oid, name, position: i },
    });
  }
  for (const name of ['Hot', 'Warm', 'Cold']) {
    await prisma.leadCategory.upsert({
      where: { organizationId_name: { organizationId: oid, name } }, update: {}, create: { organizationId: oid, name },
    });
  }

  const pipeline = await prisma.pipeline.upsert({
    where: { organizationId_name: { organizationId: oid, name: 'Sales Pipeline' } }, update: {},
    create: { organizationId: oid, name: 'Sales Pipeline', isDefault: true },
  });
  for (const [i, [name, probability, isWon, isLost]] of STAGES.entries()) {
    await prisma.pipelineStage.upsert({
      where: { pipelineId_name: { pipelineId: pipeline.id, name } }, update: {},
      create: { pipelineId: pipeline.id, name, position: i, probability, isWon, isLost },
    });
  }
  console.log('Demo organization seeded (slug: demo)');
}

async function main() {
  await seedPermissions();
  await seedSuperAdmin();
  if (process.env.SEED_DEMO !== 'false') await seedDemoOrg();
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
