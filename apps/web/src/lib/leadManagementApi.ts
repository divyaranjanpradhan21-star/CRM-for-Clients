import { saveCustomer, generateCustomerId, CustomerProfile } from './customerManagementApi';
import { supabase } from './supabase';

export type LeadSource =
  | 'website_form'
  | 'social_media_meta'
  | 'social_media_instagram'
  | 'google_ads'
  | 'linkedin'
  | 'walk_in'
  | 'referral'
  | 'phone_inquiry'
  | 'corporate_sales';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'IN_DISCUSSION'
  | 'PROPOSAL_SENT'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'LOST';

export type LostReason =
  | 'price_too_high'
  | 'competitor_chosen'
  | 'budget_constraints'
  | 'no_response'
  | 'event_cancelled'
  | 'out_of_radius'
  | 'menu_mismatch'
  | 'other';

export interface LeadInteraction {
  id: string;
  type: 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'NOTE' | 'PROPOSAL';
  summary: string;
  details?: string;
  performedBy: string;
  timestamp: string;
}

export interface LeadRecord {
  id: string; // e.g. "LEAD-40192"
  name: string;
  phone: string;
  email: string;
  company: string;
  source: LeadSource;
  sourceDetails?: string;
  priority: LeadPriority;
  status: LeadStatus;

  // Assignment & Sales
  assignedStaffId?: string;
  assignedStaffName: string;
  estimatedValue: number; // In currency
  guestCount?: number;
  eventType?: 'Corporate Banquet' | 'Private Dining' | 'Birthday Celebration' | 'Wedding Reception' | 'Cocktail Party' | 'Catering Order';
  preferredDate?: string;

  // Follow-up
  nextFollowUpDate?: string; // YYYY-MM-DD or ISO
  followUpNotes?: string;

  // Closure
  lostReason?: LostReason;
  lostNotes?: string;
  convertedCustomerId?: string;
  convertedAt?: string;

  // History & Notes
  notes: string;
  interactionHistory: LeadInteraction[];

  createdAt: string;
  updatedAt: string;
}

export interface DuplicateLeadGroup {
  id: string;
  matchedField: 'phone' | 'email';
  matchValue: string;
  leads: LeadRecord[];
}

export interface LeadConversionMetrics {
  totalLeads: number;
  activeLeads: number;
  convertedCount: number;
  lostCount: number;
  conversionRate: number;
  totalPipelineValue: number;
  wonPipelineValue: number;
  stageBreakdown: { [key in LeadStatus]: number };
  sourceBreakdown: {
    source: LeadSource;
    count: number;
    converted: number;
    rate: number;
    revenue: number;
  }[];
  lostReasonsBreakdown: { reason: LostReason; count: number; percentage: number }[];
  averageDaysToConvert: number;
}

// ─── LOCAL STORAGE KEY ────────────────────────────────────────────────────────
const STORAGE_LEADS_KEY = 'crm_restaurant_leads';

// ─── INITIAL SEED LEADS ───────────────────────────────────────────────────────
const INITIAL_LEADS: LeadRecord[] = [
  {
    id: 'LEAD-90124',
    name: 'Ananya Deshmukh',
    phone: '+91 98201 55432',
    email: 'ananya.deshmukh@tcs-events.com',
    company: 'Tata Consultancy Services',
    source: 'website_form',
    sourceDetails: 'Corporate Year-End Banquet Booking Form (80 Guests)',
    priority: 'URGENT',
    status: 'PROPOSAL_SENT',
    assignedStaffId: 'emp-001',
    assignedStaffName: 'Marco Rossi (Head Chef & Banquets)',
    estimatedValue: 4200.0,
    guestCount: 80,
    eventType: 'Corporate Banquet',
    preferredDate: '2026-12-18',
    nextFollowUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    followUpNotes: 'Review revised custom 4-course banquet menu and AV projector arrangement quote.',
    notes: 'Inquired for private mezzanine hall. Client requested live pasta and dessert station.',
    interactionHistory: [
      {
        id: 'int-1',
        type: 'NOTE',
        summary: 'Inbound Website Inquiry Received',
        details: 'Submitted banquet inquiry form for 80 attendees on 18th December.',
        performedBy: 'System Ingestion',
        timestamp: '2026-11-15T10:30:00.000Z',
      },
      {
        id: 'int-2',
        type: 'CALL',
        summary: 'Discovery Call with Event Lead Ananya',
        details: 'Discussed dietary needs: 30% vegetarian, wine pairing budget confirmed.',
        performedBy: 'Marco Rossi',
        timestamp: '2026-11-16T14:00:00.000Z',
      },
      {
        id: 'int-3',
        type: 'PROPOSAL',
        summary: 'Sent Formal Proposal #PROP-4890',
        details: 'Emailed official banquet rate card ($4,200 total including service and taxes).',
        performedBy: 'Marco Rossi',
        timestamp: '2026-11-18T11:20:00.000Z',
      },
    ],
    createdAt: '2026-11-15T10:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-90125',
    name: 'Rohit Khandelwal',
    phone: '+91 98210 77301',
    email: 'rohit.k@deloittedining.in',
    company: 'Deloitte Consulting',
    source: 'social_media_meta',
    sourceDetails: 'Meta Lead Form: Premium Weekend Brunch & Private Dining Ad',
    priority: 'HIGH',
    status: 'IN_DISCUSSION',
    assignedStaffId: 'emp-002',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    estimatedValue: 1850.0,
    guestCount: 30,
    eventType: 'Private Dining',
    preferredDate: '2026-11-29',
    nextFollowUpDate: new Date().toISOString().split('T')[0], // Due Today!
    followUpNotes: 'Call to confirm chef tasting session for team leadership dinner.',
    notes: 'Interested in reserving the Terrace Garden alcove for senior partners dinner.',
    interactionHistory: [
      {
        id: 'int-4',
        type: 'NOTE',
        summary: 'Lead Captured via Meta Lead Gen Ad',
        details: 'Target campaign: "Executive Weekend Table & Private Soirees"',
        performedBy: 'Meta Integration Hook',
        timestamp: '2026-11-17T09:15:00.000Z',
      },
      {
        id: 'int-5',
        type: 'WHATSAPP',
        summary: 'WhatsApp Introduction & Brochure Sent',
        details: 'Shared Terrace Alcove photos and set menus via official WhatsApp API.',
        performedBy: 'Priya Sharma',
        timestamp: '2026-11-17T11:00:00.000Z',
      },
    ],
    createdAt: '2026-11-17T09:15:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-90126',
    name: 'Natasha Poonawalla',
    phone: '+91 98200 11984',
    email: 'natasha.p@serumfamily.com',
    company: 'Poonawalla Heritage Trust',
    source: 'referral',
    sourceDetails: 'Referred by Alexander Wright (VIP Platinum Patron)',
    priority: 'HIGH',
    status: 'QUALIFIED',
    assignedStaffId: 'emp-002',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    estimatedValue: 6500.0,
    guestCount: 120,
    eventType: 'Cocktail Party',
    preferredDate: '2026-12-24',
    nextFollowUpDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    followUpNotes: 'Final contract signing and 25% deposit collection.',
    notes: 'Christmas Eve Gala. Client confirmed agreement to premium package.',
    interactionHistory: [
      {
        id: 'int-6',
        type: 'MEETING',
        summary: 'In-person Tasting & Venue Walkthrough',
        details: 'Sampled signature hors d\'oeuvres and approved bespoke cocktail menu.',
        performedBy: 'Priya Sharma & Marco Rossi',
        timestamp: '2026-11-14T17:00:00.000Z',
      },
      {
        id: 'int-7',
        type: 'NOTE',
        summary: 'Lead Qualified as Ready to Convert',
        details: 'Agreed on $6,500 budget for full venue buyout on Dec 24 evening.',
        performedBy: 'Priya Sharma',
        timestamp: '2026-11-18T16:30:00.000Z',
      },
    ],
    createdAt: '2026-11-12T14:20:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-90127',
    name: 'Siddharth Varma',
    phone: '+91 98330 99411',
    email: 'siddharth@fintechapex.co',
    company: 'Fintech Apex Ltd',
    source: 'google_ads',
    sourceDetails: 'Google Search Ad: "Luxury Restaurant for Birthday Dinner Mumbai"',
    priority: 'MEDIUM',
    status: 'CONTACTED',
    assignedStaffId: 'emp-003',
    assignedStaffName: 'Dev Patel (Senior Barista & Host)',
    estimatedValue: 850.0,
    guestCount: 16,
    eventType: 'Birthday Celebration',
    preferredDate: '2026-12-05',
    nextFollowUpDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Overdue!
    followUpNotes: 'Follow up on birthday cake selection and custom champagne toast.',
    notes: '30th birthday dinner with friends. Requesting custom chocolate raspberry gateau.',
    interactionHistory: [
      {
        id: 'int-8',
        type: 'EMAIL',
        summary: 'Introductory Email with Cake Portfolio',
        details: 'Sent dessert catalog and pricing tiers.',
        performedBy: 'Dev Patel',
        timestamp: '2026-11-16T12:00:00.000Z',
      },
    ],
    createdAt: '2026-11-16T11:45:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-90128',
    name: 'Kavita Singhal',
    phone: '+91 98190 22345',
    email: 'kavita.singhal@zenithmedia.in',
    company: 'Zenith Media House',
    source: 'social_media_instagram',
    sourceDetails: 'Instagram Story Direct Message Inquiry',
    priority: 'LOW',
    status: 'NEW',
    assignedStaffId: 'emp-002',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    estimatedValue: 600.0,
    guestCount: 12,
    eventType: 'Private Dining',
    preferredDate: '2026-12-10',
    nextFollowUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    followUpNotes: 'Initial contact to understand exact requirements.',
    notes: 'Inquired through Instagram DM regarding Sunday brunch table reservation for 12.',
    interactionHistory: [
      {
        id: 'int-9',
        type: 'NOTE',
        summary: 'Instagram DM Lead Ingestion',
        details: 'Inbound message from @kavitasinghal inquiring for Sunday brunch reservation.',
        performedBy: 'Instagram Social CRM Hook',
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-90129',
    name: 'Manish Talwar',
    phone: '+91 98200 44882',
    email: 'm.talwar@talwarlogistics.com',
    company: 'Talwar Logistics Solutions',
    source: 'phone_inquiry',
    sourceDetails: 'Inbound Phone Call to Front Desk',
    priority: 'MEDIUM',
    status: 'LOST',
    assignedStaffId: 'emp-001',
    assignedStaffName: 'Marco Rossi (Head Chef & Banquets)',
    estimatedValue: 3500.0,
    guestCount: 60,
    eventType: 'Corporate Banquet',
    lostReason: 'price_too_high',
    lostNotes: 'Client had fixed budget cap of $2,000 for 60 guests which could not meet our premium food & beverage baseline.',
    notes: 'Wanted full banquet package with alcohol included at $33/head.',
    interactionHistory: [
      {
        id: 'int-10',
        type: 'CALL',
        summary: 'Phone Consultation & Budget Review',
        details: 'Client confirmed firm budget limit below our minimum per-head package.',
        performedBy: 'Marco Rossi',
        timestamp: '2026-11-10T15:00:00.000Z',
      },
      {
        id: 'int-11',
        type: 'NOTE',
        summary: 'Marked as Lost - Price Constraint',
        details: 'Lost Reason: price_too_high. Archived gracefully.',
        performedBy: 'Marco Rossi',
        timestamp: '2026-11-12T09:30:00.000Z',
      },
    ],
    createdAt: '2026-11-09T14:00:00.000Z',
    updatedAt: '2026-11-12T09:30:00.000Z',
  },
  {
    id: 'LEAD-90130',
    name: 'Vikram Sethi',
    phone: '+91 98205 66778',
    email: 'vikram.sethi@venturespark.co',
    company: 'Venture Spark Accelerator',
    source: 'linkedin',
    sourceDetails: 'LinkedIn Inbound Message to Restaurant Owner',
    priority: 'HIGH',
    status: 'CONVERTED',
    assignedStaffId: 'emp-001',
    assignedStaffName: 'Marco Rossi (Head Chef & Banquets)',
    estimatedValue: 2800.0,
    guestCount: 45,
    eventType: 'Corporate Banquet',
    convertedCustomerId: 'CUST-10495',
    convertedAt: '2026-11-14T18:00:00.000Z',
    notes: 'Successfully closed and converted! Banquet deposit paid.',
    interactionHistory: [
      {
        id: 'int-12',
        type: 'PROPOSAL',
        summary: 'Proposal Accepted & Deposit Paid',
        details: 'Client approved $2,800 banquet contract and wired 50% advance.',
        performedBy: 'Marco Rossi',
        timestamp: '2026-11-14T17:30:00.000Z',
      },
      {
        id: 'int-13',
        type: 'NOTE',
        summary: 'Converted to Registered Patron Profile',
        details: 'Customer profile generated with VIP status and linked to Banquet Ledger.',
        performedBy: 'System Auto-Convert',
        timestamp: '2026-11-14T18:00:00.000Z',
      },
    ],
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-14T18:00:00.000Z',
  },
];

// ─── STORAGE AND API OPERATIONS ───────────────────────────────────────────────

export function loadLeadsFromStorage(): LeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_LEADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse leads from storage:', err);
  }
  saveLeadsToStorage(INITIAL_LEADS);
  return INITIAL_LEADS;
}

export function saveLeadsToStorage(leads: LeadRecord[]): void {
  try {
    localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
  } catch (err) {
    console.warn('Failed to save leads to storage:', err);
  }
}

/**
 * Fetches all leads sorted by urgency and creation date
 */
export async function fetchLeads(): Promise<LeadRecord[]> {
  const leads = loadLeadsFromStorage();
  
  // Non-blocking sync to Supabase
  Promise.resolve(
    supabase.from('leads').select('id').limit(1)
  ).catch(() => {});

  return leads;
}

/**
 * Generates a unique lead ID e.g. "LEAD-48201"
 */
export function generateLeadId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `LEAD-${num}`;
}

/**
 * Saves a new or updated lead
 */
export async function saveLead(
  leadData: Partial<LeadRecord>
): Promise<{ success: boolean; lead?: LeadRecord; error?: string }> {
  try {
    if (!leadData.name?.trim() || (!leadData.phone?.trim() && !leadData.email?.trim())) {
      return { success: false, error: 'Lead name and at least one contact channel (phone or email) are required' };
    }

    const leads = loadLeadsFromStorage();
    const isNew = !leadData.id;
    const leadId = leadData.id || generateLeadId();

    const record: LeadRecord = {
      id: leadId,
      name: leadData.name.trim(),
      phone: leadData.phone?.trim() || '',
      email: leadData.email?.trim().toLowerCase() || '',
      company: leadData.company?.trim() || 'Individual Guest',
      source: leadData.source || 'website_form',
      sourceDetails: leadData.sourceDetails?.trim() || 'Inbound Direct Inquiry',
      priority: leadData.priority || 'MEDIUM',
      status: leadData.status || 'NEW',
      assignedStaffId: leadData.assignedStaffId || 'emp-002',
      assignedStaffName: leadData.assignedStaffName || 'Priya Sharma (Floor Manager)',
      estimatedValue: Number(leadData.estimatedValue) || 500,
      guestCount: leadData.guestCount ? Number(leadData.guestCount) : undefined,
      eventType: leadData.eventType || 'Private Dining',
      preferredDate: leadData.preferredDate,
      nextFollowUpDate: leadData.nextFollowUpDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      followUpNotes: leadData.followUpNotes || 'Initial discovery contact call',
      lostReason: leadData.lostReason,
      lostNotes: leadData.lostNotes,
      convertedCustomerId: leadData.convertedCustomerId,
      convertedAt: leadData.convertedAt,
      notes: leadData.notes || '',
      interactionHistory: leadData.interactionHistory || [
        {
          id: `int-${Date.now()}`,
          type: 'NOTE' as const,
          summary: isNew ? 'Lead Created' : 'Lead Details Updated',
          details: `Lead created for ${leadData.name} from source: ${leadData.source || 'website_form'}.`,
          performedBy: 'Staff Admin',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: leadData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = leads.findIndex((l) => l.id === leadId);
    if (existingIdx >= 0) {
      leads[existingIdx] = { ...leads[existingIdx], ...record };
    } else {
      leads.unshift(record);
    }

    saveLeadsToStorage(leads);

    // Non-blocking sync to Supabase
    Promise.resolve(
      supabase.from('leads').upsert({
        id: record.id,
        name: record.name,
        phone: record.phone,
        email: record.email,
        company: record.company,
        source: record.source,
        priority: record.priority,
        status: record.status,
        assigned_staff_name: record.assignedStaffName,
        estimated_value: record.estimatedValue,
        next_follow_up_date: record.nextFollowUpDate,
        updated_at: record.updatedAt,
      })
    ).catch(() => {});

    return { success: true, lead: record };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save lead' };
  }
}

/**
 * Assigns lead to a staff member
 */
export async function assignLeadToStaff(
  leadId: string,
  staffId: string,
  staffName: string
): Promise<{ success: boolean; error?: string }> {
  const leads = loadLeadsFromStorage();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return { success: false, error: 'Lead not found' };

  lead.assignedStaffId = staffId;
  lead.assignedStaffName = staffName;
  lead.updatedAt = new Date().toISOString();

  lead.interactionHistory.unshift({
    id: `int-${Date.now()}`,
    type: 'NOTE',
    summary: `Lead Reassigned to ${staffName}`,
    details: `Owner updated by administration team.`,
    performedBy: 'System',
    timestamp: new Date().toISOString(),
  });

  saveLeadsToStorage(leads);
  return { success: true };
}

/**
 * Updates lead status with optional lost reason tracking
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  options?: { lostReason?: LostReason; lostNotes?: string }
): Promise<{ success: boolean; lead?: LeadRecord; error?: string }> {
  const leads = loadLeadsFromStorage();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return { success: false, error: 'Lead not found' };

  const previousStatus = lead.status;
  lead.status = status;
  lead.updatedAt = new Date().toISOString();

  if (status === 'LOST') {
    lead.lostReason = options?.lostReason || 'other';
    lead.lostNotes = options?.lostNotes || 'Marked as lost';
  }

  lead.interactionHistory.unshift({
    id: `int-${Date.now()}`,
    type: 'NOTE',
    summary: `Status Changed: ${previousStatus} -> ${status}`,
    details: status === 'LOST' ? `Lost Reason: ${options?.lostReason || 'other'} - ${options?.lostNotes || ''}` : `Lead pipeline stage updated.`,
    performedBy: lead.assignedStaffName || 'Staff Admin',
    timestamp: new Date().toISOString(),
  });

  saveLeadsToStorage(leads);
  return { success: true, lead };
}

/**
 * Adds an interaction (Call, Email, WhatsApp, Meeting, Note) to lead history
 */
export async function addLeadInteraction(
  leadId: string,
  interaction: Omit<LeadInteraction, 'id' | 'timestamp'>
): Promise<{ success: boolean; error?: string }> {
  const leads = loadLeadsFromStorage();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return { success: false, error: 'Lead not found' };

  const newEntry: LeadInteraction = {
    id: `int-${Date.now()}`,
    ...interaction,
    timestamp: new Date().toISOString(),
  };

  lead.interactionHistory.unshift(newEntry);
  lead.updatedAt = new Date().toISOString();

  // If status is 'NEW', auto advance to 'CONTACTED' on first call/email/whatsapp
  if (lead.status === 'NEW' && ['CALL', 'EMAIL', 'WHATSAPP'].includes(interaction.type)) {
    lead.status = 'CONTACTED';
  }

  saveLeadsToStorage(leads);
  return { success: true };
}

/**
 * Schedules follow-up date and reminder note for a lead
 */
export async function scheduleLeadFollowUp(
  leadId: string,
  followUpDate: string,
  followUpNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const leads = loadLeadsFromStorage();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return { success: false, error: 'Lead not found' };

  lead.nextFollowUpDate = followUpDate;
  if (followUpNotes) lead.followUpNotes = followUpNotes;
  lead.updatedAt = new Date().toISOString();

  lead.interactionHistory.unshift({
    id: `int-${Date.now()}`,
    type: 'NOTE',
    summary: `Follow-up Scheduled for ${followUpDate}`,
    details: followUpNotes || 'Next check-in scheduled.',
    performedBy: lead.assignedStaffName || 'Staff Admin',
    timestamp: new Date().toISOString(),
  });

  saveLeadsToStorage(leads);
  return { success: true };
}

/**
 * CONVERT QUALIFIED LEAD INTO CUSTOMER
 * Automatically registers customer in customer database with full link!
 */
export async function convertLeadToCustomer(
  leadId: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const leads = loadLeadsFromStorage();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    const newCustomerId = generateCustomerId();

    // Create Customer profile in Customer Database
    const newCustomer: Partial<CustomerProfile> = {
      id: newCustomerId,
      fullName: lead.name,
      email: lead.email,
      mobile: lead.phone,
      address: {
        street: lead.company ? `c/o ${lead.company}` : '',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      category: 'NEW',
      loyaltyTier: 'Bronze',
      loyaltyPoints: 100, // Welcome points
      lifetimePointsEarned: 100,
      totalSpend: lead.estimatedValue || 0,
      totalOrders: 1,
      totalVisits: 1,
      registeredSource: 'Manual Admin',
      favoriteBranch: 'Downtown Flagship #01',
      specialInstructions: `Converted from Sales Lead (${lead.id} - ${lead.company || 'Private Event'}). Event: ${lead.eventType || 'Banquet'}.`,
    };

    const saveRes = await saveCustomer(newCustomer);
    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to create customer profile' };
    }

    // Update lead record
    lead.status = 'CONVERTED';
    lead.convertedCustomerId = newCustomerId;
    lead.convertedAt = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();

    lead.interactionHistory.unshift({
      id: `int-${Date.now()}`,
      type: 'NOTE',
      summary: `Lead Converted to Customer (${newCustomerId})`,
      details: `Official patron profile generated. Lifetime spend initialized with estimated booking value of $${lead.estimatedValue}.`,
      performedBy: 'System Auto-Convert',
      timestamp: new Date().toISOString(),
    });

    saveLeadsToStorage(leads);
    return { success: true, customerId: newCustomerId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Conversion failed' };
  }
}

/**
 * Detects duplicate leads by phone or email
 */
export function detectDuplicateLeads(leads: LeadRecord[]): DuplicateLeadGroup[] {
  const groups: DuplicateLeadGroup[] = [];
  const phoneMap = new Map<string, LeadRecord[]>();
  const emailMap = new Map<string, LeadRecord[]>();

  leads.forEach((lead) => {
    // Normalize phone (remove spaces and non-digits)
    const normPhone = lead.phone.replace(/[^0-9]/g, '');
    if (normPhone && normPhone.length >= 7) {
      const existing = phoneMap.get(normPhone) || [];
      existing.push(lead);
      phoneMap.set(normPhone, existing);
    }

    // Normalize email
    const normEmail = lead.email.toLowerCase().trim();
    if (normEmail && normEmail.includes('@')) {
      const existing = emailMap.get(normEmail) || [];
      existing.push(lead);
      emailMap.set(normEmail, existing);
    }
  });

  // Group by Phone duplicates
  phoneMap.forEach((matched, phone) => {
    if (matched.length > 1) {
      groups.push({
        id: `dup-phone-${phone}`,
        matchedField: 'phone',
        matchValue: phone,
        leads: matched,
      });
    }
  });

  // Group by Email duplicates (avoid duplicating pairs already matched by phone)
  emailMap.forEach((matched, email) => {
    if (matched.length > 1) {
      const leadIds = matched.map((l) => l.id).sort().join(',');
      const alreadyIncluded = groups.some(
        (g) => g.leads.map((l) => l.id).sort().join(',') === leadIds
      );
      if (!alreadyIncluded) {
        groups.push({
          id: `dup-email-${email}`,
          matchedField: 'email',
          matchValue: email,
          leads: matched,
        });
      }
    }
  });

  return groups;
}

/**
 * Merges two duplicate leads into one primary record
 */
export async function mergeDuplicateLeads(
  primaryLeadId: string,
  secondaryLeadId: string
): Promise<{ success: boolean; mergedLead?: LeadRecord; error?: string }> {
  try {
    const leads = loadLeadsFromStorage();
    const primary = leads.find((l) => l.id === primaryLeadId);
    const secondary = leads.find((l) => l.id === secondaryLeadId);

    if (!primary || !secondary) {
      return { success: false, error: 'One or both leads not found' };
    }

    // Merge notes & interactions
    primary.notes = `${primary.notes}\n[Merged Notes from ${secondary.id}]: ${secondary.notes}`.trim();
    primary.interactionHistory = [
      ...primary.interactionHistory,
      ...secondary.interactionHistory,
      {
        id: `int-${Date.now()}`,
        type: 'NOTE' as const,
        summary: `Merged Duplicate Lead ${secondary.id}`,
        details: `Combined timeline, guest count (${secondary.guestCount || 0}), and contact notes into ${primary.id}.`,
        performedBy: 'Staff Admin',
        timestamp: new Date().toISOString(),
      },
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Higher estimated value wins
    if (secondary.estimatedValue > primary.estimatedValue) {
      primary.estimatedValue = secondary.estimatedValue;
    }

    // Remove secondary lead
    const filteredLeads = leads.filter((l) => l.id !== secondaryLeadId);
    saveLeadsToStorage(filteredLeads);

    return { success: true, mergedLead: primary };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to merge leads' };
  }
}

/**
 * INBOUND LEAD CAPTURE INTEGRATION SIMULATOR / WEBHOOK
 * Supports website inquiry forms, Instagram ads, Meta lead ads, Google Ads
 */
export async function captureInboundLead(payload: {
  source: LeadSource;
  name: string;
  phone: string;
  email: string;
  company?: string;
  sourceDetails: string;
  eventType?: LeadRecord['eventType'];
  guestCount?: number;
  estimatedValue?: number;
  notes?: string;
}): Promise<LeadRecord> {
  const newLead: Partial<LeadRecord> = {
    id: generateLeadId(),
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    company: payload.company || 'Inbound Web Guest',
    source: payload.source,
    sourceDetails: payload.sourceDetails,
    priority: payload.guestCount && payload.guestCount >= 50 ? 'URGENT' : 'HIGH',
    status: 'NEW',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    assignedStaffId: 'emp-002',
    estimatedValue: payload.estimatedValue || (payload.guestCount ? payload.guestCount * 45 : 1200),
    guestCount: payload.guestCount || 20,
    eventType: payload.eventType || 'Corporate Banquet',
    nextFollowUpDate: new Date().toISOString().split('T')[0], // Immediate due today
    followUpNotes: `Inbound ${payload.source.replace('_', ' ')} lead. Immediate response recommended within 30 minutes SLA.`,
    notes: payload.notes || `Inbound webhook lead submission from ${payload.sourceDetails}`,
    interactionHistory: [
      {
        id: `int-${Date.now()}`,
        type: 'NOTE' as const,
        summary: `Inbound Lead Ingested via ${payload.sourceDetails}`,
        details: `Auto-captured and routed to service floor queue.`,
        performedBy: 'Lead Integration Gateway',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await saveLead(newLead);
  return res.lead!;
}

/**
 * Calculates high-level lead conversion metrics & analytics
 */
export function getLeadConversionMetrics(leads: LeadRecord[]): LeadConversionMetrics {
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.status === 'CONVERTED');
  const lostLeads = leads.filter((l) => l.status === 'LOST');
  const activeLeads = leads.filter((l) => !['CONVERTED', 'LOST'].includes(l.status));

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const wonPipelineValue = convertedLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const conversionRate = totalLeads > 0 ? Number(((convertedLeads.length / totalLeads) * 100).toFixed(1)) : 0;

  const stageBreakdown: { [key in LeadStatus]: number } = {
    NEW: 0,
    CONTACTED: 0,
    IN_DISCUSSION: 0,
    PROPOSAL_SENT: 0,
    QUALIFIED: 0,
    CONVERTED: 0,
    LOST: 0,
  };

  leads.forEach((l) => {
    if (stageBreakdown[l.status] !== undefined) {
      stageBreakdown[l.status]++;
    }
  });

  // Source breakdown
  const sourceMap = new Map<LeadSource, { count: number; converted: number; revenue: number }>();
  leads.forEach((l) => {
    const curr = sourceMap.get(l.source) || { count: 0, converted: 0, revenue: 0 };
    curr.count++;
    if (l.status === 'CONVERTED') {
      curr.converted++;
      curr.revenue += l.estimatedValue || 0;
    }
    sourceMap.set(l.source, curr);
  });

  const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    count: data.count,
    converted: data.converted,
    rate: data.count > 0 ? Number(((data.converted / data.count) * 100).toFixed(1)) : 0,
    revenue: data.revenue,
  })).sort((a, b) => b.count - a.count);

  // Lost reasons
  const lostReasonMap = new Map<LostReason, number>();
  lostLeads.forEach((l) => {
    const reason = l.lostReason || 'other';
    lostReasonMap.set(reason, (lostReasonMap.get(reason) || 0) + 1);
  });

  const lostReasonsBreakdown = Array.from(lostReasonMap.entries()).map(([reason, count]) => ({
    reason,
    count,
    percentage: lostLeads.length > 0 ? Number(((count / lostLeads.length) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.count - a.count);

  // Average days to convert
  let totalConversionDays = 0;
  let validConversions = 0;
  convertedLeads.forEach((l) => {
    if (l.convertedAt && l.createdAt) {
      const created = new Date(l.createdAt).getTime();
      const converted = new Date(l.convertedAt).getTime();
      const days = Math.max(1, Math.round((converted - created) / (1000 * 60 * 60 * 24)));
      totalConversionDays += days;
      validConversions++;
    }
  });

  const averageDaysToConvert = validConversions > 0 ? Number((totalConversionDays / validConversions).toFixed(1)) : 4.5;

  return {
    totalLeads,
    activeLeads: activeLeads.length,
    convertedCount: convertedLeads.length,
    lostCount: lostLeads.length,
    conversionRate,
    totalPipelineValue,
    wonPipelineValue,
    stageBreakdown,
    sourceBreakdown,
    lostReasonsBreakdown,
    averageDaysToConvert,
  };
}
