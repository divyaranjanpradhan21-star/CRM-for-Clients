import React, { useState, useEffect } from 'react';
import {
  Megaphone, Search, Download, TrendingUp, TrendingDown, Eye,
  Plus, Edit2, Pause, Play, XCircle, CheckCircle2, Users,
  DollarSign, BarChart2, Mail, MessageSquare, Smartphone, Star,
  Calendar, ArrowUpRight, Filter, Clock
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type CampaignChannel = 'Email' | 'SMS' | 'WhatsApp' | 'Push Notification' | 'Social Media' | 'All Channels';
type CampaignStatus = 'Active' | 'Scheduled' | 'Paused' | 'Completed' | 'Draft';
type CampaignType = 'Promotional' | 'Loyalty' | 'Seasonal' | 'Win-Back' | 'Birthday' | 'Announcement';

interface Campaign {
  id: string;
  title: string;
  description: string;
  channel: CampaignChannel;
  type: CampaignType;
  status: CampaignStatus;
  targetSegment: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  reach: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roiMultiplier: number;
  createdBy: string;
  createdAt: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_CAMPAIGNS: Campaign[] = [
  { id: 'c1', title: 'Weekend Feast Bonanza', description: 'Get 20% off on all orders above ₹500 this weekend. Valid Sat-Sun only.', channel: 'All Channels', type: 'Promotional', status: 'Active', targetSegment: 'All Customers', startDate: '2024-11-23', endDate: '2024-11-24', budget: 15000, spent: 10200, reach: 12450, opens: 5890, clicks: 1430, conversions: 285, revenue: 142500, roiMultiplier: 9.5, createdBy: 'Admin', createdAt: '2024-11-20T10:00:00Z' },
  { id: 'c2', title: 'Birthday Treat Offer', description: 'Special birthday meal combo with complimentary dessert for loyalty members.', channel: 'Email', type: 'Birthday', status: 'Active', targetSegment: 'Birthday This Month', startDate: '2024-11-01', endDate: '2024-11-30', budget: 5000, spent: 3200, reach: 342, opens: 298, clicks: 189, conversions: 76, revenue: 38000, roiMultiplier: 7.6, createdBy: 'Admin', createdAt: '2024-10-28T09:00:00Z' },
  { id: 'c3', title: 'Diwali Celebration Menu', description: 'Exclusive festive thali with traditional sweets — limited seats!', channel: 'WhatsApp', type: 'Seasonal', status: 'Completed', targetSegment: 'Premium Tier', startDate: '2024-10-28', endDate: '2024-11-05', budget: 20000, spent: 19800, reach: 8900, opens: 7200, clicks: 2340, conversions: 580, revenue: 290000, roiMultiplier: 14.6, createdBy: 'Manager', createdAt: '2024-10-15T11:00:00Z' },
  { id: 'c4', title: 'Win-Back Inactive Diners', description: 'Miss us? Come back and get 15% off your next visit with code MISSED15.', channel: 'SMS', type: 'Win-Back', status: 'Active', targetSegment: 'Inactive >60 Days', startDate: '2024-11-18', endDate: '2024-11-30', budget: 8000, spent: 5100, reach: 2340, opens: 1890, clicks: 420, conversions: 98, revenue: 49000, roiMultiplier: 6.1, createdBy: 'Admin', createdAt: '2024-11-15T14:00:00Z' },
  { id: 'c5', title: 'Loyalty Double Points Week', description: 'Earn 2x loyalty points on all dine-in orders this week only!', channel: 'Push Notification', type: 'Loyalty', status: 'Scheduled', targetSegment: 'Loyalty Members', startDate: '2024-12-02', endDate: '2024-12-08', budget: 3000, spent: 0, reach: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0, roiMultiplier: 0, createdBy: 'Admin', createdAt: '2024-11-22T16:00:00Z' },
  { id: 'c6', title: 'New Menu Launch Alert', description: 'Discover 12 new dishes from our updated winter menu — book your table now!', channel: 'Social Media', type: 'Announcement', status: 'Active', targetSegment: 'All Customers', startDate: '2024-11-20', endDate: '2024-12-15', budget: 12000, spent: 7800, reach: 25600, opens: 12400, clicks: 3200, conversions: 420, revenue: 210000, roiMultiplier: 17.5, createdBy: 'Manager', createdAt: '2024-11-18T10:00:00Z' },
  { id: 'c7', title: 'Happy Hours Promo', description: '50% off on beverages between 3–6 PM on weekdays. Limited daily.', channel: 'Email', type: 'Promotional', status: 'Draft', targetSegment: 'Office Area Customers', startDate: '2024-12-05', endDate: '2024-12-20', budget: 6000, spent: 0, reach: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0, roiMultiplier: 0, createdBy: 'Admin', createdAt: '2024-11-24T09:00:00Z' },
  { id: 'c8', title: 'VIP Pre-launch Dinner', description: 'Exclusive invitation for top 50 loyalty members — private dining event.', channel: 'WhatsApp', type: 'Loyalty', status: 'Paused', targetSegment: 'VIP Tier', startDate: '2024-11-25', endDate: '2024-11-25', budget: 10000, spent: 2500, reach: 50, opens: 48, clicks: 42, conversions: 32, revenue: 48000, roiMultiplier: 4.8, createdBy: 'Admin', createdAt: '2024-11-21T12:00:00Z' },
];

const STORAGE_KEY = 'crm_campaigns_v1';
function loadCampaigns(): Campaign[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CAMPAIGNS));
  return SEED_CAMPAIGNS;
}
function saveCampaigns(campaigns: Campaign[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns)); }

const STATUS_CONFIG: Record<CampaignStatus, { color: string; bg: string }> = {
  'Active':    { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  'Scheduled': { color: 'text-blue-800',    bg: 'bg-blue-100' },
  'Paused':    { color: 'text-amber-800',   bg: 'bg-amber-100' },
  'Completed': { color: 'text-gray-600',    bg: 'bg-gray-100' },
  'Draft':     { color: 'text-purple-800',  bg: 'bg-purple-100' },
};

const CHANNEL_ICON: Record<CampaignChannel, React.ElementType> = {
  'Email': Mail,
  'SMS': MessageSquare,
  'WhatsApp': Smartphone,
  'Push Notification': Megaphone,
  'Social Media': Star,
  'All Channels': Megaphone,
};

const TYPE_COLOR: Record<CampaignType, string> = {
  'Promotional': 'bg-[#79415A]/10 text-[#79415A]',
  'Loyalty': 'bg-indigo-100 text-indigo-800',
  'Seasonal': 'bg-teal-100 text-teal-800',
  'Win-Back': 'bg-amber-100 text-amber-800',
  'Birthday': 'bg-rose-100 text-rose-800',
  'Announcement': 'bg-blue-100 text-blue-800',
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface MarketingCampaignsViewProps { orgId?: string; }

export const MarketingCampaignsView: React.FC<MarketingCampaignsViewProps> = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'ALL'>('ALL');
  const [view, setView] = useState<'campaigns' | 'analytics'>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', channel: 'Email' as CampaignChannel, type: 'Promotional' as CampaignType, description: '', targetSegment: '', startDate: '', endDate: '', budget: '' });

  useEffect(() => { setCampaigns(loadCampaigns()); }, []);

  const toggleStatus = (id: string, from: CampaignStatus) => {
    const next: Partial<Record<CampaignStatus, CampaignStatus>> = { Active: 'Paused', Paused: 'Active', Scheduled: 'Active', Draft: 'Active' };
    const nextStatus = next[from];
    if (!nextStatus) return;
    setCampaigns(prev => { const u = prev.map(c => c.id === id ? { ...c, status: nextStatus } : c); saveCampaigns(u); return u; });
    if (selectedCampaign?.id === id) setSelectedCampaign(prev => prev ? { ...prev, status: nextStatus } : null);
  };

  const createCampaign = () => {
    if (!newCampaign.title || !newCampaign.startDate || !newCampaign.endDate) return;
    const campaign: Campaign = {
      id: `c${Date.now()}`, title: newCampaign.title, description: newCampaign.description,
      channel: newCampaign.channel, type: newCampaign.type, status: 'Draft',
      targetSegment: newCampaign.targetSegment || 'All Customers',
      startDate: newCampaign.startDate, endDate: newCampaign.endDate,
      budget: parseFloat(newCampaign.budget) || 0, spent: 0,
      reach: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0, roiMultiplier: 0,
      createdBy: 'Admin', createdAt: new Date().toISOString(),
    };
    setCampaigns(prev => { const u = [campaign, ...prev]; saveCampaigns(u); return u; });
    setShowCreateModal(false);
    setNewCampaign({ title: '', channel: 'Email', type: 'Promotional', description: '', targetSegment: '', startDate: '', endDate: '', budget: '' });
  };

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.targetSegment.toLowerCase().includes(q)) &&
      (statusFilter === 'ALL' || c.status === statusFilter) &&
      (channelFilter === 'ALL' || c.channel === channelFilter) &&
      (typeFilter === 'ALL' || c.type === typeFilter);
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
  const totalReach = campaigns.filter(c => c.status !== 'Draft').reduce((s, c) => s + c.reach, 0);
  const totalRevenue = campaigns.filter(c => c.status !== 'Draft').reduce((s, c) => s + c.revenue, 0);
  const totalConversions = campaigns.filter(c => c.status !== 'Draft').reduce((s, c) => s + c.conversions, 0);
  const avgROI = campaigns.filter(c => c.roiMultiplier > 0).length > 0
    ? (campaigns.filter(c => c.roiMultiplier > 0).reduce((s, c) => s + c.roiMultiplier, 0) / campaigns.filter(c => c.roiMultiplier > 0).length).toFixed(1)
    : '0';

  const exportCSV = () => {
    const rows = [
      ['Title', 'Channel', 'Type', 'Status', 'Reach', 'Opens', 'Clicks', 'Conversions', 'Revenue', 'ROI', 'Start', 'End'],
      ...filtered.map(c => [c.title, c.channel, c.type, c.status, c.reach, c.opens, c.clicks, c.conversions, c.revenue, `${c.roiMultiplier}x`, c.startDate, c.endDate])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Channel performance
  const channelPerf = (['Email', 'SMS', 'WhatsApp', 'Push Notification', 'Social Media', 'All Channels'] as CampaignChannel[]).map(ch => {
    const chs = campaigns.filter(c => c.channel === ch && c.status !== 'Draft');
    return {
      channel: ch,
      count: chs.length,
      reach: chs.reduce((s, c) => s + c.reach, 0),
      conversions: chs.reduce((s, c) => s + c.conversions, 0),
      revenue: chs.reduce((s, c) => s + c.revenue, 0),
    };
  }).filter(c => c.count > 0).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1F313D]">Marketing Campaigns</h1>
          <p className="text-sm text-[#7A7268] mt-0.5">Create, manage and track all marketing campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition">
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Campaigns', value: campaigns.length.toString(), icon: Megaphone, color: 'text-[#1F313D]', bg: 'bg-[#1F313D]/10' },
          { label: 'Active Now', value: activeCampaigns.toString(), icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
          { label: 'Total Reach', value: `${(totalReach / 1000).toFixed(1)}K`, icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-100' },
          { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: 'text-[#79415A]', bg: 'bg-[#79415A]/10' },
          { label: 'Avg ROI', value: `${avgROI}x`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E5DDD2] shadow-xs">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-lg font-black text-[#1F313D]">{k.value}</div>
              <div className="text-[11px] text-[#7A7268]">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {(['campaigns', 'analytics'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${view === v ? 'bg-[#79415A] text-white' : 'bg-[#EFE9DF] text-[#5C5549] hover:bg-[#E5DDD2]'}`}>
            {v === 'campaigns' ? '📋 All Campaigns' : '📊 Channel Analytics'}
          </button>
        ))}
      </div>

      {view === 'analytics' ? (
        <div className="space-y-6">
          {/* Channel Performance */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Channel Performance</h3>
            <div className="space-y-4">
              {channelPerf.map(cp => {
                const maxRev = Math.max(...channelPerf.map(x => x.revenue));
                const pct = maxRev > 0 ? Math.round((cp.revenue / maxRev) * 100) : 0;
                const ChIcon = CHANNEL_ICON[cp.channel];
                return (
                  <div key={cp.channel}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <ChIcon className="w-4 h-4 text-[#79415A]" />
                        <span className="text-xs font-bold text-[#1F313D]">{cp.channel}</span>
                        <span className="text-[10px] text-[#7A7268]">({cp.count} campaigns)</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-[#7A7268]">
                        <span>{cp.reach.toLocaleString()} reach</span>
                        <span>{cp.conversions} conversions</span>
                        <span className="font-black text-[#1F313D]">₹{cp.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#EAE4D9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#79415A] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaign Type Performance */}
          <div className="bg-[#FAF7F2] rounded-[24px] p-6 border border-[#E5DDD2]">
            <h3 className="font-serif font-bold text-base text-[#1F313D] mb-4">Campaign Type ROI</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(['Promotional', 'Loyalty', 'Seasonal', 'Win-Back', 'Birthday', 'Announcement'] as CampaignType[]).map(type => {
                const typeCampaigns = campaigns.filter(c => c.type === type && c.roiMultiplier > 0);
                const avgROIType = typeCampaigns.length > 0 ? (typeCampaigns.reduce((s, c) => s + c.roiMultiplier, 0) / typeCampaigns.length).toFixed(1) : '—';
                return (
                  <div key={type} className="p-3 bg-[#EFE9DF] rounded-xl">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[type]}`}>{type}</span>
                    <div className="text-lg font-black text-[#1F313D] mt-1">{avgROIType}{avgROIType !== '—' ? 'x' : ''}</div>
                    <div className="text-[10px] text-[#7A7268]">Avg ROI · {typeCampaigns.length} runs</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7268]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Statuses</option>
                {(['Active', 'Scheduled', 'Paused', 'Completed', 'Draft'] as CampaignStatus[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={channelFilter} onChange={e => setChannelFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Channels</option>
                {(['Email', 'SMS', 'WhatsApp', 'Push Notification', 'Social Media', 'All Channels'] as CampaignChannel[]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-xs font-semibold text-[#1F313D] focus:outline-none">
                <option value="ALL">All Types</option>
                {(['Promotional', 'Loyalty', 'Seasonal', 'Win-Back', 'Birthday', 'Announcement'] as CampaignType[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Campaign Cards */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-[#E5DDD2]">
                  <Megaphone className="w-10 h-10 text-[#DDD5C7] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#5C5549]">No campaigns found</p>
                </div>
              ) : filtered.map(camp => {
                const sc = STATUS_CONFIG[camp.status];
                const ChIcon = CHANNEL_ICON[camp.channel];
                const isSelected = selectedCampaign?.id === camp.id;
                const openRate = camp.reach > 0 ? Math.round((camp.opens / camp.reach) * 100) : 0;
                const convRate = camp.opens > 0 ? Math.round((camp.conversions / camp.opens) * 100) : 0;

                return (
                  <div key={camp.id}
                    onClick={() => setSelectedCampaign(isSelected ? null : camp)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-[#79415A] bg-white shadow-md' : 'border-[#DDD5C7] bg-[#FAF7F2] hover:bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <ChIcon className="w-4 h-4 text-[#79415A]" />
                          <h4 className="text-xs font-bold text-[#1F313D]">{camp.title}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{camp.status}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[camp.type]}`}>{camp.type}</span>
                        </div>
                        <p className="text-[11px] text-[#5C5549] line-clamp-1">{camp.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[#7A7268]">
                          <span><Users className="w-3 h-3 inline mr-0.5" />{camp.reach.toLocaleString()} reach</span>
                          <span>Open: {openRate}%</span>
                          <span>Conv: {convRate}%</span>
                          <span><Calendar className="w-3 h-3 inline mr-0.5" />{formatDate(camp.startDate)} – {formatDate(camp.endDate)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        {camp.revenue > 0 && (
                          <div>
                            <div className="text-sm font-black text-[#1F313D]">₹{camp.revenue.toLocaleString()}</div>
                            <div className="text-[10px] text-emerald-700 font-bold">{camp.roiMultiplier}x ROI</div>
                          </div>
                        )}
                        {(camp.status === 'Active' || camp.status === 'Paused' || camp.status === 'Scheduled' || camp.status === 'Draft') && (
                          <button onClick={e => { e.stopPropagation(); toggleStatus(camp.id, camp.status); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${camp.status === 'Active' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}>
                            {camp.status === 'Active' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaign Detail Panel */}
          {selectedCampaign && (
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-[#FAF7F2] rounded-[24px] border border-[#E5DDD2] p-5 sticky top-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-[#1F313D]">Campaign Detail</h3>
                  <button onClick={() => setSelectedCampaign(null)} className="text-[#7A7268] hover:text-[#1F313D] text-xs">✕</button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1F313D] mb-0.5">{selectedCampaign.title}</h4>
                  <p className="text-[11px] text-[#5C5549] leading-relaxed">{selectedCampaign.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[selectedCampaign.status].bg} ${STATUS_CONFIG[selectedCampaign.status].color}`}>{selectedCampaign.status}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLOR[selectedCampaign.type]}`}>{selectedCampaign.type}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Channel</span>
                    <span className="font-bold text-[#1F313D]">{selectedCampaign.channel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Target</span>
                    <span className="font-bold text-[#1F313D]">{selectedCampaign.targetSegment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Budget</span>
                    <span className="font-bold text-[#1F313D]">₹{selectedCampaign.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Spent</span>
                    <span className="font-bold text-[#1F313D]">₹{selectedCampaign.spent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7268]">Duration</span>
                    <span className="font-bold text-[#1F313D] text-[10px]">{formatDate(selectedCampaign.startDate)} – {formatDate(selectedCampaign.endDate)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-[#1F313D]">{selectedCampaign.reach.toLocaleString()}</div>
                    <div className="text-[10px] text-[#7A7268]">Reach</div>
                  </div>
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-[#1F313D]">{selectedCampaign.conversions}</div>
                    <div className="text-[10px] text-[#7A7268]">Conversions</div>
                  </div>
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-[#79415A]">₹{selectedCampaign.revenue.toLocaleString()}</div>
                    <div className="text-[10px] text-[#7A7268]">Revenue</div>
                  </div>
                  <div className="p-2.5 bg-[#EFE9DF] rounded-xl text-center">
                    <div className="text-sm font-black text-emerald-700">{selectedCampaign.roiMultiplier > 0 ? `${selectedCampaign.roiMultiplier}x` : '—'}</div>
                    <div className="text-[10px] text-[#7A7268]">ROI</div>
                  </div>
                </div>
                {(selectedCampaign.status !== 'Completed') && (
                  <button onClick={() => toggleStatus(selectedCampaign.id, selectedCampaign.status)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${selectedCampaign.status === 'Active' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}>
                    {selectedCampaign.status === 'Active' ? '⏸ Pause Campaign' : '▶ Activate Campaign'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-[28px] shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif font-bold text-lg text-[#1F313D]">Create New Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#7A7268] hover:text-[#1F313D]">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#5C5549] mb-1 block">Campaign Title *</label>
                <input value={newCampaign.title} onChange={e => setNewCampaign(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30"
                  placeholder="e.g. Weekend Special Offer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5C5549] mb-1 block">Channel</label>
                  <select value={newCampaign.channel} onChange={e => setNewCampaign(p => ({ ...p, channel: e.target.value as CampaignChannel }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none">
                    {(['Email', 'SMS', 'WhatsApp', 'Push Notification', 'Social Media', 'All Channels'] as CampaignChannel[]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5C5549] mb-1 block">Type</label>
                  <select value={newCampaign.type} onChange={e => setNewCampaign(p => ({ ...p, type: e.target.value as CampaignType }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none">
                    {(['Promotional', 'Loyalty', 'Seasonal', 'Win-Back', 'Birthday', 'Announcement'] as CampaignType[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#5C5549] mb-1 block">Description</label>
                <textarea value={newCampaign.description} onChange={e => setNewCampaign(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none focus:ring-2 focus:ring-[#79415A]/30 resize-none" rows={2}
                  placeholder="Campaign message or offer details…" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#5C5549] mb-1 block">Target Segment</label>
                <input value={newCampaign.targetSegment} onChange={e => setNewCampaign(p => ({ ...p, targetSegment: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none"
                  placeholder="e.g. VIP Members, All Customers…" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5C5549] mb-1 block">Start Date *</label>
                  <input type="date" value={newCampaign.startDate} onChange={e => setNewCampaign(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5C5549] mb-1 block">End Date *</label>
                  <input type="date" value={newCampaign.endDate} onChange={e => setNewCampaign(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5C5549] mb-1 block">Budget (₹)</label>
                  <input type="number" value={newCampaign.budget} onChange={e => setNewCampaign(p => ({ ...p, budget: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF7F2] text-xs focus:outline-none"
                    placeholder="5000" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD2] text-xs font-bold text-[#1F313D] transition">Cancel</button>
              <button onClick={createCampaign}
                className="flex-1 py-2.5 rounded-xl bg-[#79415A] hover:bg-[#68334b] text-white text-xs font-bold transition">
                Create Draft Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
