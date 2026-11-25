import { saveCustomer, generateCustomerId, CustomerProfile, loadCustomersFromStorage } from './customerManagementApi';
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

export type LeadType = 'Individual' | 'Corporate' | 'Event';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
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

export interface LeadFollowUp {
  id: string;
  leadId: string;
  leadName: string;
  scheduledAt: string; // ISO string or YYYY-MM-DD
  notes: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'REVIEW';
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  completedAt?: string;
}

export interface LeadRecord {
  id: string; // e.g. "LEAD-40192"
  name: string;
  phone: string;
  email: string;
  company: string;
  address?: string;
  leadType: LeadType;
  source: LeadSource;
  sourceDetails?: string;
  priority: LeadPriority;
  status: LeadStatus;

  // Services & Financials
  interestedServices?: string[];
  expectedBudget?: number;
  estimatedValue: number; // In currency
  guestCount?: number;
  eventType?: 'Corporate Banquet' | 'Private Dining' | 'Birthday Celebration' | 'Wedding Reception' | 'Cocktail Party' | 'Catering Order';
  preferredDate?: string;

  // Assignment & Sales Rep
  assignedStaffId?: string;
  assignedStaffName: string;

  // Follow-up
  nextFollowUpDate?: string; // YYYY-MM-DD or ISO
  followUpNotes?: string;

  // Closure & Conversion
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

export interface SalespersonMetric {
  staffId?: string;
  staffName: string;
  totalAssigned: number;
  converted: number;
  lost: number;
  winRate: number;
  totalValue: number;
}

export interface LeadConversionMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  proposalSentLeads: number;
  negotiationLeads: number;
  convertedCount: number;
  lostCount: number;
  activeLeads: number;
  followUpsDue: number;
  upcomingFollowUps: number;
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
  salespersonPerformance: SalespersonMetric[];
  averageDaysToConvert: number;
}

// ─── LOCAL STORAGE KEYS ───────────────────────────────────────────────────────
const STORAGE_LEADS_KEY = 'crm_restaurant_leads';
const STORAGE_FOLLOWUPS_KEY = 'crm_restaurant_lead_followups';

// ─── INITIAL SEED LEADS ───────────────────────────────────────────────────────
const INITIAL_LEADS: LeadRecord[] = [
  {
    id: 'LEAD-90124',
    name: 'Ananya Deshmukh',
    phone: '+91 98201 55432',
    email: 'ananya.deshmukh@tcs-events.com',
    company: 'Tata Consultancy Services',
    address: 'Bandra Kurla Complex, Mumbai',
    leadType: 'Corporate',
    source: 'website_form',
    sourceDetails: 'Corporate Year-End Banquet Booking Form (80 Guests)',
    priority: 'URGENT',
    status: 'PROPOSAL_SENT',
    assignedStaffId: 'emp-001',
    assignedStaffName: 'Marco Rossi (Head Chef & Banquets)',
    estimatedValue: 4200.0,
    expectedBudget: 4500.0,
    interestedServices: ['Private Mezzanine Hall', '4-Course Banquet', 'AV Projector Setup'],
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
    address: 'Lower Parel, Mumbai',
    leadType: 'Corporate',
    source: 'social_media_meta',
    sourceDetails: 'Meta Lead Form: Premium Weekend Brunch & Private Dining Ad',
    priority: 'HIGH',
    status: 'NEGOTIATION',
    assignedStaffId: 'emp-002',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    estimatedValue: 1850.0,
    expectedBudget: 2000.0,
    interestedServices: ['Terrace Garden Alcove', 'Leadership Dinner', 'Wine Pairings'],
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
    name: 'Dr. Siddharth Mehta',
    phone: '+91 98330 11994',
    email: 'dr.mehta@cardio-specialists.org',
    company: 'Mumbai Cardiology Association',
    address: 'Worli Seaface, Mumbai',
    leadType: 'Event',
    source: 'referral',
    sourceDetails: 'Referral from VIP Patron Alexander Wright',
    priority: 'HIGH',
    status: 'QUALIFIED',
    assignedStaffId: 'emp-001',
    assignedStaffName: 'Marco Rossi (Head Chef & Banquets)',
    estimatedValue: 3100.0,
    expectedBudget: 3500.0,
    interestedServices: ['Private Dining Hall', 'Custom Heart-Healthy Menu', 'Champagne Welcome'],
    guestCount: 50,
    eventType: 'Private Dining',
    preferredDate: '2026-12-05',
    nextFollowUpDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    followUpNotes: 'Prepare heart-healthy olive oil and wild caught seafood custom tasting menu proposal.',
    notes: 'Annual Medical Society celebratory dinner. High aesthetic expectations.',
    interactionHistory: [
      {
        id: 'int-6',
        type: 'NOTE',
        summary: 'Referred by Alexander Wright',
        details: 'VIP referral notes: loves Tuscan grilled sea bass and vintage Barolo.',
        performedBy: 'Floor Concierge',
        timestamp: '2026-11-18T16:00:00.000Z',
      },
    ],
    createdAt: '2026-11-18T16:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-90127',
    name: 'Natasha Poonawalla',
    phone: '+91 98199 44321',
    email: 'natasha.p@poonawalla-holding.com',
    company: 'Poonawalla Estates',
    address: 'South Mumbai',
    leadType: 'Individual',
    source: 'phone_inquiry',
    sourceDetails: 'Direct VIP Concierge Phone Call',
    priority: 'URGENT',
    status: 'CONTACTED',
    assignedStaffId: 'emp-002',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    estimatedValue: 2400.0,
    expectedBudget: 3000.0,
    interestedServices: ['Candlelight Dinner', 'Vintage Champagne', 'Acoustic Violinist'],
    guestCount: 16,
    eventType: 'Birthday Celebration',
    preferredDate: '2026-12-02',
    nextFollowUpDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Overdue!
    followUpNotes: 'Follow up on floral centerpieces and acoustic violinist confirmation.',
    notes: 'Private birthday celebration. Requested live acoustic violinist arrangement.',
    interactionHistory: [
      {
        id: 'int-7',
        type: 'CALL',
        summary: 'Incoming Call to Concierge',
        details: 'Discussed date availability and minimum spend requirements for the Cellar Room.',
        performedBy: 'Priya Sharma',
        timestamp: '2026-11-19T11:30:00.000Z',
      },
    ],
    createdAt: '2026-11-19T11:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-90128',
    name: 'Kavita Singhania',
    phone: '+91 98204 88120',
    email: 'kavita.singhania@apex-ventures.in',
    company: 'Apex Ventures Capital',
    address: 'Nariman Point, Mumbai',
    leadType: 'Corporate',
    source: 'website_form',
    sourceDetails: 'Inquiry via Website Contact Page',
    priority: 'MEDIUM',
    status: 'NEW',
    assignedStaffId: 'emp-002',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    estimatedValue: 1200.0,
    expectedBudget: 1500.0,
    interestedServices: ['Buffet Lunch', 'Private Boardroom Table'],
    guestCount: 22,
    eventType: 'Corporate Banquet',
    preferredDate: '2026-12-10',
    nextFollowUpDate: new Date().toISOString().split('T')[0], // Due Today
    followUpNotes: 'Schedule discovery call regarding quarterly board meeting buffet requirements.',
    notes: 'Looking for a quiet semi-private room with high-speed WiFi and lunch buffet.',
    interactionHistory: [
      {
        id: 'int-8',
        type: 'NOTE',
        summary: 'Inbound Web Submission Received',
        details: 'Submitted request for 22 guests on Dec 10th.',
        performedBy: 'Web Gateway',
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
    address: 'Vashi, Navi Mumbai',
    leadType: 'Corporate',
    source: 'phone_inquiry',
    sourceDetails: 'Inbound Phone Call to Front Desk',
    priority: 'MEDIUM',
    status: 'LOST',
    assignedStaffId: 'emp-001',
    assignedStaffName: 'Marco Rossi (Head Chef & Banquets)',
    estimatedValue: 3500.0,
    expectedBudget: 2000.0,
    interestedServices: ['Buffet with Alcohol'],
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
    address: 'Indiranagar, Bangalore',
    leadType: 'Corporate',
    source: 'linkedin',
    sourceDetails: 'LinkedIn Inbound Message to Restaurant Owner',
    priority: 'HIGH',
    status: 'CONVERTED',
    assignedStaffId: 'emp-001',
    assignedStaffName: 'Marco Rossi (Head Chef & Banquets)',
    estimatedValue: 2800.0,
    expectedBudget: 3000.0,
    interestedServices: ['Accelerator Demo Day Dinner', 'Buffet & Drinks'],
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

export async function fetchLeads(): Promise<LeadRecord[]> {
  const leads = loadLeadsFromStorage();
  
  // Non-blocking sync to Supabase if table exists
  Promise.resolve(supabase.from('leads').select('id').limit(1)).catch(() => {});

  return leads;
}

export function generateLeadId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `LEAD-${num}`;
}

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
      address: leadData.address?.trim() || '',
      leadType: leadData.leadType || 'Individual',
      source: leadData.source || 'website_form',
      sourceDetails: leadData.sourceDetails?.trim() || 'Inbound Direct Inquiry',
      priority: leadData.priority || 'MEDIUM',
      status: leadData.status || 'NEW',
      assignedStaffId: leadData.assignedStaffId || 'emp-002',
      assignedStaffName: leadData.assignedStaffName || 'Priya Sharma (Floor Manager)',
      estimatedValue: Number(leadData.estimatedValue) || 500,
      expectedBudget: Number(leadData.expectedBudget) || Number(leadData.estimatedValue) || 500,
      interestedServices: leadData.interestedServices || ['Table Dining'],
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
    details: `Sales representative ownership updated.`,
    performedBy: 'System Administrator',
    timestamp: new Date().toISOString(),
  });

  saveLeadsToStorage(leads);
  return { success: true };
}

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
    summary: `Pipeline Stage: ${previousStatus} -> ${status}`,
    details: status === 'LOST' ? `Lost Reason: ${options?.lostReason || 'other'} - ${options?.lostNotes || ''}` : `Stage advanced in sales pipeline.`,
    performedBy: lead.assignedStaffName || 'Staff Admin',
    timestamp: new Date().toISOString(),
  });

  saveLeadsToStorage(leads);
  return { success: true, lead };
}

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

  if (lead.status === 'NEW' && ['CALL', 'EMAIL', 'WHATSAPP'].includes(interaction.type)) {
    lead.status = 'CONTACTED';
  }

  saveLeadsToStorage(leads);
  return { success: true };
}

export async function scheduleLeadFollowUp(
  leadId: string,
  followUpDate: string,
  followUpNotes?: string,
  type: LeadFollowUp['type'] = 'CALL'
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
    summary: `Follow-up Scheduled: ${followUpDate}`,
    details: followUpNotes || `${type} scheduled with patron.`,
    performedBy: lead.assignedStaffName || 'Staff Admin',
    timestamp: new Date().toISOString(),
  });

  saveLeadsToStorage(leads);
  return { success: true };
}

export async function convertLeadToCustomer(
  leadId: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const leads = loadLeadsFromStorage();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    // Check if customer already exists by phone or email
    const existingCustomers = loadCustomersFromStorage();
    const matched = existingCustomers.find(
      (c) =>
        (lead.phone && c.mobile && c.mobile.replace(/\D/g, '') === lead.phone.replace(/\D/g, '')) ||
        (lead.email && c.email && c.email.toLowerCase() === lead.email.toLowerCase())
    );

    let customerIdToLink = matched ? matched.id : generateCustomerId();

    if (!matched) {
      const newCustomer: Partial<CustomerProfile> = {
        id: customerIdToLink,
        fullName: lead.name,
        email: lead.email,
        mobile: lead.phone,
        address: {
          street: lead.address || (lead.company ? `c/o ${lead.company}` : ''),
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
        category: 'NEW',
        loyaltyTier: 'Bronze',
        loyaltyPoints: 100,
        status: 'Active',
        totalSpend: lead.estimatedValue || 0,
        totalOrders: 1,
        totalVisits: 1,
        registeredSource: 'Manual Admin',
        favoriteBranch: 'Downtown Flagship #01',
        customerNotes: `Converted from Sales Lead (${lead.id} - ${lead.company || 'Private Event'}). Lead Type: ${lead.leadType}. Services: ${(lead.interestedServices || []).join(', ')}.`,
      };

      const saveRes = await saveCustomer(newCustomer);
      if (!saveRes.success) {
        return { success: false, error: saveRes.error || 'Failed to create customer record' };
      }
    }

    // Update lead record
    lead.status = 'CONVERTED';
    lead.convertedCustomerId = customerIdToLink;
    lead.convertedAt = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();

    lead.interactionHistory.unshift({
      id: `int-${Date.now()}`,
      type: 'NOTE',
      summary: `Lead Converted to Customer (${customerIdToLink})`,
      details: `Customer record ${matched ? 'linked to existing' : 'newly registered'} profile #${customerIdToLink}. Booking value: $${lead.estimatedValue}.`,
      performedBy: 'Sales CRM Gateway',
      timestamp: new Date().toISOString(),
    });

    saveLeadsToStorage(leads);
    return { success: true, customerId: customerIdToLink };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Conversion failed' };
  }
}

export function detectDuplicateLeads(leads: LeadRecord[]): DuplicateLeadGroup[] {
  const groups: DuplicateLeadGroup[] = [];
  const phoneMap = new Map<string, LeadRecord[]>();
  const emailMap = new Map<string, LeadRecord[]>();

  leads.forEach((lead) => {
    const normPhone = lead.phone.replace(/[^0-9]/g, '');
    if (normPhone && normPhone.length >= 7) {
      const existing = phoneMap.get(normPhone) || [];
      existing.push(lead);
      phoneMap.set(normPhone, existing);
    }

    const normEmail = lead.email.toLowerCase().trim();
    if (normEmail && normEmail.includes('@')) {
      const existing = emailMap.get(normEmail) || [];
      existing.push(lead);
      emailMap.set(normEmail, existing);
    }
  });

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

    primary.notes = `${primary.notes}\n[Merged from ${secondary.id}]: ${secondary.notes}`.trim();
    primary.interactionHistory = [
      ...primary.interactionHistory,
      ...secondary.interactionHistory,
      {
        id: `int-${Date.now()}`,
        type: 'NOTE' as const,
        summary: `Merged Duplicate Lead ${secondary.id}`,
        details: `Combined timeline, guest count (${secondary.guestCount || 0}), and contact history.`,
        performedBy: 'Staff Admin',
        timestamp: new Date().toISOString(),
      },
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (secondary.estimatedValue > primary.estimatedValue) {
      primary.estimatedValue = secondary.estimatedValue;
    }

    const filteredLeads = leads.filter((l) => l.id !== secondaryLeadId);
    saveLeadsToStorage(filteredLeads);

    return { success: true, mergedLead: primary };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to merge leads' };
  }
}

export async function captureInboundLead(payload: {
  source: LeadSource;
  leadType?: LeadType;
  name: string;
  phone: string;
  email: string;
  company?: string;
  address?: string;
  sourceDetails: string;
  eventType?: LeadRecord['eventType'];
  guestCount?: number;
  expectedBudget?: number;
  estimatedValue?: number;
  interestedServices?: string[];
  notes?: string;
}): Promise<LeadRecord> {
  const newLead: Partial<LeadRecord> = {
    id: generateLeadId(),
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    company: payload.company || 'Inbound Web Guest',
    address: payload.address || '',
    leadType: payload.leadType || (payload.company ? 'Corporate' : 'Individual'),
    source: payload.source,
    sourceDetails: payload.sourceDetails,
    priority: payload.guestCount && payload.guestCount >= 50 ? 'URGENT' : 'HIGH',
    status: 'NEW',
    assignedStaffName: 'Priya Sharma (Floor Manager)',
    assignedStaffId: 'emp-002',
    estimatedValue: payload.estimatedValue || (payload.guestCount ? payload.guestCount * 45 : 1200),
    expectedBudget: payload.expectedBudget || payload.estimatedValue || 1200,
    interestedServices: payload.interestedServices || ['Event Banquet'],
    guestCount: payload.guestCount || 20,
    eventType: payload.eventType || 'Corporate Banquet',
    nextFollowUpDate: new Date().toISOString().split('T')[0], // Immediate due today
    followUpNotes: `Inbound ${payload.source.replace('_', ' ')} lead. Response recommended within 30m SLA.`,
    notes: payload.notes || `Inbound webhook lead submission from ${payload.sourceDetails}`,
    interactionHistory: [
      {
        id: `int-${Date.now()}`,
        type: 'NOTE' as const,
        summary: `Inbound Lead Ingested via ${payload.sourceDetails}`,
        details: `Auto-captured and routed to front-desk sales pipeline.`,
        performedBy: 'Lead Integration Gateway',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await saveLead(newLead);
  return res.lead!;
}

export function getLeadConversionMetrics(leads: LeadRecord[]): LeadConversionMetrics {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'NEW').length;
  const contactedLeads = leads.filter((l) => l.status === 'CONTACTED').length;
  const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length;
  const proposalSentLeads = leads.filter((l) => l.status === 'PROPOSAL_SENT').length;
  const negotiationLeads = leads.filter((l) => l.status === 'NEGOTIATION').length;
  const convertedLeads = leads.filter((l) => l.status === 'CONVERTED');
  const lostLeads = leads.filter((l) => l.status === 'LOST');
  const activeLeads = leads.filter((l) => !['CONVERTED', 'LOST'].includes(l.status)).length;

  const todayStr = new Date().toISOString().split('T')[0];
  let followUpsDue = 0;
  let upcomingFollowUps = 0;

  leads.forEach((l) => {
    if (!['CONVERTED', 'LOST'].includes(l.status) && l.nextFollowUpDate) {
      if (l.nextFollowUpDate <= todayStr) {
        followUpsDue++;
      } else {
        upcomingFollowUps++;
      }
    }
  });

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const wonPipelineValue = convertedLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const conversionRate = totalLeads > 0 ? Number(((convertedLeads.length / totalLeads) * 100).toFixed(1)) : 0;

  const stageBreakdown: { [key in LeadStatus]: number } = {
    NEW: newLeads,
    CONTACTED: contactedLeads,
    QUALIFIED: qualifiedLeads,
    PROPOSAL_SENT: proposalSentLeads,
    NEGOTIATION: negotiationLeads,
    CONVERTED: convertedLeads.length,
    LOST: lostLeads.length,
  };

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

  // Salesperson Leaderboard & Performance
  const staffMap = new Map<string, { staffName: string; totalAssigned: number; converted: number; lost: number; totalValue: number }>();
  leads.forEach((l) => {
    const key = l.assignedStaffName || 'Unassigned';
    const curr = staffMap.get(key) || { staffName: key, totalAssigned: 0, converted: 0, lost: 0, totalValue: 0 };
    curr.totalAssigned++;
    curr.totalValue += l.estimatedValue || 0;
    if (l.status === 'CONVERTED') curr.converted++;
    if (l.status === 'LOST') curr.lost++;
    staffMap.set(key, curr);
  });

  const salespersonPerformance: SalespersonMetric[] = Array.from(staffMap.values()).map((s) => ({
    staffName: s.staffName,
    totalAssigned: s.totalAssigned,
    converted: s.converted,
    lost: s.lost,
    winRate: s.totalAssigned > 0 ? Number(((s.converted / s.totalAssigned) * 100).toFixed(1)) : 0,
    totalValue: s.totalValue,
  })).sort((a, b) => b.converted - a.converted);

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
    newLeads,
    contactedLeads,
    qualifiedLeads,
    proposalSentLeads,
    negotiationLeads,
    convertedCount: convertedLeads.length,
    lostCount: lostLeads.length,
    activeLeads,
    followUpsDue,
    upcomingFollowUps,
    conversionRate,
    totalPipelineValue,
    wonPipelineValue,
    stageBreakdown,
    sourceBreakdown,
    lostReasonsBreakdown,
    salespersonPerformance,
    averageDaysToConvert,
  };
}

export function exportLeadsToCSV(leads: LeadRecord[]): void {
  const headers = [
    'Lead ID',
    'Full Name',
    'Company',
    'Lead Type',
    'Email',
    'Phone',
    'Source',
    'Status',
    'Priority',
    'Assigned Salesperson',
    'Estimated Value ($)',
    'Expected Budget ($)',
    'Guest Count',
    'Event Type',
    'Next Follow-Up Date',
    'Created Date',
  ];

  const rows = leads.map((l) => [
    l.id,
    `"${l.name.replace(/"/g, '""')}"`,
    `"${(l.company || '').replace(/"/g, '""')}"`,
    l.leadType,
    l.email,
    l.phone,
    l.source,
    l.status,
    l.priority,
    `"${l.assignedStaffName.replace(/"/g, '""')}"`,
    l.estimatedValue.toFixed(2),
    (l.expectedBudget || l.estimatedValue).toFixed(2),
    l.guestCount || '—',
    `"${l.eventType || ''}"`,
    l.nextFollowUpDate || '—',
    l.createdAt.split('T')[0],
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `restaurant_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
