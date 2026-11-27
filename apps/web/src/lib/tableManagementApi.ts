import { supabase } from './supabase';
import { RESTAURANT_TABLES } from './reservationManagementApi';

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type TableStatus = 'Available' | 'Reserved' | 'Occupied' | 'Cleaning' | 'Unavailable';
export type TableSection = 'Main Dining Hall' | 'Window Terrace' | 'Outdoor Garden' | 'Mezzanine VIP' | 'Wine Cellar' | 'Private Dining' | 'Rooftop';
export type TableShape = 'Rectangle' | 'Round' | 'Square' | 'Oval';

export interface TableRecord {
  id: string;
  tableNumber: string;
  capacity: number;
  section: TableSection;
  shape: TableShape;
  status: TableStatus;
  currentReservationId?: string;
  currentOrderId?: string;
  currentGuestName?: string;
  occupiedSince?: string;
  cleaningRequestedAt?: string;
  combinedWith?: string[];   // IDs of other tables combined
  isCombined?: boolean;
  floorPlanX: number;        // position % (0-100)
  floorPlanY: number;        // position % (0-100)
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableActivityLog {
  id: string;
  tableId: string;
  tableNumber: string;
  action: string;
  fromStatus?: TableStatus;
  toStatus?: TableStatus;
  performer: string;
  details: string;
  timestamp: string;
  relatedOrderId?: string;
  relatedReservationId?: string;
}

export interface TableTransferRecord {
  id: string;
  fromTableId: string;
  toTableId: string;
  guestName: string;
  orderId?: string;
  transferredAt: string;
  performer: string;
  reason?: string;
}

export interface TableManagementMetrics {
  total: number;
  available: number;
  reserved: number;
  occupied: number;
  cleaning: number;
  unavailable: number;
  occupancyRate: number;
  avgTurnoverMinutes: number;
  totalCapacity: number;
  seatedGuests: number;
}

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
const STORAGE_TABLES_KEY = 'crm_table_management_v1';
const STORAGE_TABLE_LOGS_KEY = 'crm_table_activity_logs_v1';
const STORAGE_TABLE_TRANSFERS_KEY = 'crm_table_transfers_v1';

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_TABLES: TableRecord[] = [
  { id: 'tbl-1',  tableNumber: 'T-01', capacity: 2,  section: 'Window Terrace',   shape: 'Round',     status: 'Reserved',   currentGuestName: 'Alexander Wright', floorPlanX: 10, floorPlanY: 15, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-2',  tableNumber: 'T-02', capacity: 2,  section: 'Window Terrace',   shape: 'Round',     status: 'Available',  floorPlanX: 22, floorPlanY: 15, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-3',  tableNumber: 'T-03', capacity: 4,  section: 'Main Dining Hall', shape: 'Rectangle', status: 'Occupied',   currentGuestName: 'Priya Mehta', occupiedSince: new Date(Date.now() - 45 * 60000).toISOString(), floorPlanX: 40, floorPlanY: 20, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-4',  tableNumber: 'T-04', capacity: 4,  section: 'Main Dining Hall', shape: 'Rectangle', status: 'Available',  floorPlanX: 55, floorPlanY: 20, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-5',  tableNumber: 'T-05', capacity: 6,  section: 'Main Dining Hall', shape: 'Rectangle', status: 'Occupied',   currentGuestName: 'Rohit Kumar', occupiedSince: new Date(Date.now() - 30 * 60000).toISOString(), floorPlanX: 40, floorPlanY: 40, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-6',  tableNumber: 'T-06', capacity: 6,  section: 'Outdoor Garden',   shape: 'Rectangle', status: 'Available',  floorPlanX: 70, floorPlanY: 40, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-7',  tableNumber: 'T-07', capacity: 8,  section: 'Outdoor Garden',   shape: 'Rectangle', status: 'Cleaning',   cleaningRequestedAt: new Date(Date.now() - 10 * 60000).toISOString(), floorPlanX: 70, floorPlanY: 60, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-8',  tableNumber: 'T-08', capacity: 10, section: 'Mezzanine VIP',    shape: 'Oval',      status: 'Available',  floorPlanX: 25, floorPlanY: 65, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-9',  tableNumber: 'T-09', capacity: 14, section: 'Wine Cellar',      shape: 'Rectangle', status: 'Reserved',   currentGuestName: 'Corporate Dinner', floorPlanX: 55, floorPlanY: 65, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-10', tableNumber: 'T-10', capacity: 4,  section: 'Private Dining',   shape: 'Square',    status: 'Unavailable', notes: 'Under renovation', floorPlanX: 10, floorPlanY: 65, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-11', tableNumber: 'T-11', capacity: 2,  section: 'Rooftop',          shape: 'Round',     status: 'Available',  floorPlanX: 85, floorPlanY: 15, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tbl-12', tableNumber: 'T-12', capacity: 4,  section: 'Rooftop',          shape: 'Rectangle', status: 'Occupied',   currentGuestName: 'Anjali Singh', occupiedSince: new Date(Date.now() - 60 * 60000).toISOString(), floorPlanX: 85, floorPlanY: 35, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const SEED_LOGS: TableActivityLog[] = [
  { id: 'log-1', tableId: 'tbl-3', tableNumber: 'T-03', action: 'Table Occupied', fromStatus: 'Available', toStatus: 'Occupied', performer: 'Arun Nair', details: 'Guest Priya Mehta seated — party of 3', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'log-2', tableId: 'tbl-7', tableNumber: 'T-07', action: 'Cleaning Requested', fromStatus: 'Occupied', toStatus: 'Cleaning', performer: 'System', details: 'Order completed — table sent for cleaning', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 'log-3', tableId: 'tbl-1', tableNumber: 'T-01', action: 'Reservation Assigned', fromStatus: 'Available', toStatus: 'Reserved', performer: 'Meena Pillai', details: 'Reservation RES-80211 assigned — Alexander Wright, 2 guests, 20:00', timestamp: new Date(Date.now() - 3600000).toISOString() },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function loadTables(): TableRecord[] {
  try { const r = localStorage.getItem(STORAGE_TABLES_KEY); if (r) return JSON.parse(r); } catch {}
  localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(SEED_TABLES));
  return SEED_TABLES;
}

export function saveTables(tables: TableRecord[]): void {
  localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(tables));
  // Non-blocking Supabase sync
  supabase.from('restaurant_tables').upsert(tables.map(t => ({ ...t, updated_at: t.updatedAt }))).then(() => {});
}

export function loadTableLogs(): TableActivityLog[] {
  try { const r = localStorage.getItem(STORAGE_TABLE_LOGS_KEY); if (r) return JSON.parse(r); } catch {}
  localStorage.setItem(STORAGE_TABLE_LOGS_KEY, JSON.stringify(SEED_LOGS));
  return SEED_LOGS;
}

export function saveTableLog(log: TableActivityLog): void {
  const logs = loadTableLogs();
  logs.unshift(log);
  localStorage.setItem(STORAGE_TABLE_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
}

export function loadTableTransfers(): TableTransferRecord[] {
  try { const r = localStorage.getItem(STORAGE_TABLE_TRANSFERS_KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}

// ─── TABLE OPERATIONS ─────────────────────────────────────────────────────────

export function getTableMetrics(): TableManagementMetrics {
  const tables = loadTables().filter(t => t.isActive);
  const occupied = tables.filter(t => t.status === 'Occupied');
  const seatedGuests = occupied.reduce((s, t) => s + t.capacity, 0);
  return {
    total: tables.length,
    available: tables.filter(t => t.status === 'Available').length,
    reserved: tables.filter(t => t.status === 'Reserved').length,
    occupied: occupied.length,
    cleaning: tables.filter(t => t.status === 'Cleaning').length,
    unavailable: tables.filter(t => t.status === 'Unavailable').length,
    occupancyRate: tables.length > 0 ? Math.round((occupied.length / tables.length) * 100) : 0,
    avgTurnoverMinutes: 65,
    totalCapacity: tables.reduce((s, t) => s + t.capacity, 0),
    seatedGuests,
  };
}

export function updateTableStatus(
  tableId: string,
  status: TableStatus,
  performer: string,
  options?: {
    guestName?: string;
    reservationId?: string;
    orderId?: string;
    reason?: string;
  }
): TableRecord {
  const tables = loadTables();
  const idx = tables.findIndex(t => t.id === tableId);
  if (idx === -1) throw new Error('Table not found');

  const prev = tables[idx];
  const now = new Date().toISOString();

  const updated: TableRecord = {
    ...prev,
    status,
    updatedAt: now,
    currentGuestName: status === 'Occupied' || status === 'Reserved' ? (options?.guestName ?? prev.currentGuestName) : undefined,
    occupiedSince: status === 'Occupied' ? now : undefined,
    cleaningRequestedAt: status === 'Cleaning' ? now : undefined,
    currentReservationId: options?.reservationId ?? (status === 'Available' ? undefined : prev.currentReservationId),
    currentOrderId: options?.orderId ?? (status === 'Available' ? undefined : prev.currentOrderId),
  };

  tables[idx] = updated;
  saveTables(tables);

  saveTableLog({
    id: `log-${Date.now()}`,
    tableId,
    tableNumber: prev.tableNumber,
    action: `Status → ${status}`,
    fromStatus: prev.status,
    toStatus: status,
    performer,
    details: options?.reason || options?.guestName ? `${options?.guestName || ''}${options?.reason ? ' — ' + options.reason : ''}` : `Updated to ${status}`,
    timestamp: now,
    relatedOrderId: options?.orderId,
    relatedReservationId: options?.reservationId,
  });

  return updated;
}

export function createTable(data: Omit<TableRecord, 'id' | 'createdAt' | 'updatedAt'>): TableRecord {
  const tables = loadTables();
  if (tables.some(t => t.tableNumber === data.tableNumber && t.isActive)) {
    throw new Error(`Table number ${data.tableNumber} already exists`);
  }
  const newTable: TableRecord = {
    ...data,
    id: `tbl-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tables.push(newTable);
  saveTables(tables);
  saveTableLog({ id: `log-${Date.now()}`, tableId: newTable.id, tableNumber: newTable.tableNumber, action: 'Table Created', toStatus: newTable.status, performer: 'Admin', details: `${newTable.section} · ${newTable.capacity} seats · ${newTable.shape}`, timestamp: new Date().toISOString() });
  return newTable;
}

export function editTable(tableId: string, data: Partial<TableRecord>): TableRecord {
  const tables = loadTables();
  const idx = tables.findIndex(t => t.id === tableId);
  if (idx === -1) throw new Error('Table not found');
  const updated = { ...tables[idx], ...data, updatedAt: new Date().toISOString() };
  tables[idx] = updated;
  saveTables(tables);
  return updated;
}

export function deleteTable(tableId: string): void {
  const tables = loadTables();
  const idx = tables.findIndex(t => t.id === tableId);
  if (idx === -1) throw new Error('Table not found');
  if (tables[idx].status === 'Occupied') throw new Error('Cannot delete an occupied table');
  tables[idx] = { ...tables[idx], isActive: false, updatedAt: new Date().toISOString() };
  saveTables(tables);
  saveTableLog({ id: `log-${Date.now()}`, tableId, tableNumber: tables[idx].tableNumber, action: 'Table Deactivated', performer: 'Admin', details: 'Table removed from floor plan', timestamp: new Date().toISOString() });
}

export function transferGuests(fromTableId: string, toTableId: string, performer: string, reason?: string): void {
  const tables = loadTables();
  const from = tables.find(t => t.id === fromTableId);
  const to = tables.find(t => t.id === toTableId);
  if (!from) throw new Error('Source table not found');
  if (!to) throw new Error('Destination table not found');
  if (to.status !== 'Available') throw new Error('Destination table must be Available');

  const guestName = from.currentGuestName || 'Unknown Guest';
  updateTableStatus(toTableId, 'Occupied', performer, { guestName, orderId: from.currentOrderId });
  updateTableStatus(fromTableId, 'Cleaning', performer, { reason: `Guests transferred to ${to.tableNumber}` });

  const transfers = loadTableTransfers();
  transfers.unshift({ id: `tfr-${Date.now()}`, fromTableId, toTableId, guestName, orderId: from.currentOrderId, transferredAt: new Date().toISOString(), performer, reason });
  localStorage.setItem(STORAGE_TABLE_TRANSFERS_KEY, JSON.stringify(transfers.slice(0, 200)));

  saveTableLog({ id: `log-${Date.now()}`, tableId: fromTableId, tableNumber: from.tableNumber, action: 'Guest Transfer', performer, details: `Guests transferred from ${from.tableNumber} → ${to.tableNumber}${reason ? ' (' + reason + ')' : ''}`, timestamp: new Date().toISOString() });
}

export function combineTables(primaryId: string, secondaryIds: string[], performer: string): void {
  const tables = loadTables();
  const primary = tables.find(t => t.id === primaryId);
  if (!primary) throw new Error('Primary table not found');

  const secondaries = secondaryIds.map(id => {
    const t = tables.find(t => t.id === id);
    if (!t) throw new Error(`Table ${id} not found`);
    if (t.status !== 'Available') throw new Error(`Table ${t.tableNumber} is not available`);
    return t;
  });

  const combined = secondaryIds;
  editTable(primaryId, { combinedWith: combined, isCombined: true });
  secondaryIds.forEach(id => editTable(id, { status: 'Unavailable', notes: `Combined with ${primary.tableNumber}` }));

  saveTableLog({ id: `log-${Date.now()}`, tableId: primaryId, tableNumber: primary.tableNumber, action: 'Tables Combined', performer, details: `Combined with ${secondaries.map(t => t.tableNumber).join(', ')}`, timestamp: new Date().toISOString() });
}

export function splitTable(primaryId: string, performer: string): void {
  const tables = loadTables();
  const primary = tables.find(t => t.id === primaryId);
  if (!primary || !primary.isCombined) throw new Error('Table is not combined');

  (primary.combinedWith || []).forEach(id => editTable(id, { status: 'Available', notes: undefined }));
  editTable(primaryId, { combinedWith: undefined, isCombined: false });

  saveTableLog({ id: `log-${Date.now()}`, tableId: primaryId, tableNumber: primary.tableNumber, action: 'Table Split', performer, details: 'Combined table split back to individual tables', timestamp: new Date().toISOString() });
}

export function releaseTable(tableId: string, performer: string): void {
  updateTableStatus(tableId, 'Cleaning', performer, { reason: 'Checkout complete — sent for cleaning' });
}

export function markTableClean(tableId: string, performer: string): void {
  updateTableStatus(tableId, 'Available', performer, { reason: 'Cleaning complete — table available' });
}

export function getTableUtilizationReport(dateRange: 'today' | 'week' | 'month'): {
  section: TableSection; totalTables: number; avgOccupancyRate: number; avgTurnover: number;
}[] {
  const tables = loadTables().filter(t => t.isActive);
  const sections = Array.from(new Set(tables.map(t => t.section))) as TableSection[];
  return sections.map(section => {
    const sectionTables = tables.filter(t => t.section === section);
    const occupied = sectionTables.filter(t => t.status === 'Occupied').length;
    return {
      section,
      totalTables: sectionTables.length,
      avgOccupancyRate: sectionTables.length > 0 ? Math.round((occupied / sectionTables.length) * 100) : 0,
      avgTurnover: 60 + Math.round(Math.random() * 30),
    };
  });
}
