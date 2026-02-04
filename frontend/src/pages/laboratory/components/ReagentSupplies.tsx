import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, AlertTriangle, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Reagent {
  lotNumber: string;
  name: string;
  stock: number;
  unit: string;
  expiryDate: string;
  status: 'normal' | 'warning' | 'critical';
}

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  normal:   { border: 'border-emerald-400',  text: 'text-emerald-600 dark:text-emerald-400',  badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',  badgeActive: 'bg-emerald-200 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400 dark:ring-emerald-600',  bar: 'bg-emerald-400',  label: 'In Stock' },
  warning:  { border: 'border-amber-400',    text: 'text-amber-600 dark:text-amber-400',      badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',      badgeActive: 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400 dark:ring-amber-600',      bar: 'bg-amber-400',    label: 'Low Stock' },
  critical: { border: 'border-red-400',      text: 'text-red-600 dark:text-red-400',          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',          badgeActive: 'bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 ring-2 ring-red-400 dark:ring-red-600',          bar: 'bg-red-400',      label: 'Critical' },
} as const;

const MAX_STOCK = 100;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysUntilExpiry = (iso: string): number => {
  const now = new Date();
  const exp = new Date(iso);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getExpiryColor = (days: number) => {
  if (days <= 0)  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (days <= 30) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
};

const getExpiryLabel = (days: number) => {
  if (days <= 0)  return 'Expired';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 30) return `Expires in ${days}d`;
  return `Exp. ${formatDate(new Date(Date.now() + days * 86400000).toISOString())}`;
};

// ─────────────────────────────────────────────
// Reagent Card
// ─────────────────────────────────────────────
const ReagentCard: React.FC<{ reagent: Reagent; index: number }> = ({ reagent, index }) => {
  const cfg = STATUS_CONFIG[reagent.status];
  const stockPercent = Math.min((reagent.stock / MAX_STOCK) * 100, 100);
  const days = daysUntilExpiry(reagent.expiryDate);

  const StatusIcon = reagent.status === 'normal' ? CheckCircle2
                   : reagent.status === 'warning' ? AlertTriangle
                   : AlertCircle;

  return (
    <div
      className={`relative flex gap-3 px-4 py-3 rounded-xl border-l-4 ${cfg.border}
        bg-white dark:bg-gray-800/60
        border border-gray-100 dark:border-gray-700/50
        hover:shadow-md dark:hover:shadow-gray-900/30
        transition-all duration-200 hover:-translate-y-0.5 cursor-default`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <StatusIcon size={18} className={`${cfg.text} shrink-0 mt-0.5`} strokeWidth={2} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{reagent.name}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        <div className="mt-1.5 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${cfg.bar} transition-all duration-500`}
            style={{ width: `${stockPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Lot: <span className="font-medium text-gray-600 dark:text-gray-300">{reagent.lotNumber}</span>
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getExpiryColor(days)}`}>
            <Clock size={10} />
            {getExpiryLabel(days)}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0 flex flex-col items-end justify-start">
        <p className={`text-sm font-bold ${cfg.text}`}>{reagent.stock}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{reagent.unit}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Clickable Filter Pill
// ─────────────────────────────────────────────
const FilterPill: React.FC<{
  count: number;
  status: keyof typeof STATUS_CONFIG;
  active: boolean;
  onClick: () => void;
}> = ({ count, status, active, onClick }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
        transition-all duration-200 cursor-pointer
        hover:scale-105 active:scale-95
        ${active ? cfg.badgeActive : cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bar}`}></span>
      {count} {cfg.label}
    </button>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const ReagentSupplies: React.FC = () => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'normal' | 'warning' | 'critical' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReagents();
  }, []);

  const fetchReagents = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      const today = new Date();
      const daysFrom = (n: number) => new Date(today.getTime() + n * 86400000).toISOString().split('T')[0];

      const mock: Reagent[] = [
        { lotNumber: 'R-2024-1101', name: 'Thyroxine (T4) Kit',             stock: 40, unit: 'tests', expiryDate: daysFrom(90),  status: 'normal' },
        { lotNumber: 'R-2024-1102', name: 'TSH Immunoassay Kit',            stock: 12, unit: 'tests', expiryDate: daysFrom(45),  status: 'warning' },
        { lotNumber: 'R-2024-1103', name: 'Phenylalanine Fluorometric Kit', stock: 3,  unit: 'kit',   expiryDate: daysFrom(18),  status: 'critical' },
        { lotNumber: 'R-2024-1104', name: 'Congenital Adrenal Hyperplasia', stock: 25, unit: 'tests', expiryDate: daysFrom(120), status: 'normal' },
        { lotNumber: 'R-2024-1105', name: 'Galactosemia GALT Assay',        stock: 8,  unit: 'tests', expiryDate: daysFrom(22),  status: 'warning' },
        { lotNumber: 'R-2024-1106', name: 'Biotinidase Deficiency Kit',     stock: 2,  unit: 'kit',   expiryDate: daysFrom(-5),  status: 'critical' },
        { lotNumber: 'R-2024-1107', name: 'Maple Syrup Urine Disease Kit',  stock: 15, unit: 'tests', expiryDate: daysFrom(60),  status: 'normal' },
        { lotNumber: 'R-2024-1108', name: 'Homocystinuria HPLC Reagent',    stock: 6,  unit: 'mL',    expiryDate: daysFrom(10),  status: 'warning' },
      ];

      setReagents(mock);
    } catch (error) {
      console.error('Error fetching reagents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combined: status pill + search
  const filtered = reagents.filter((r) => {
    const matchesStatus = activeFilter ? r.status === activeFilter : true;
    const matchesSearch = searchTerm.trim() === ''
      ? true
      : r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lotNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const normalCount   = reagents.filter((r) => r.status === 'normal').length;
  const warningCount  = reagents.filter((r) => r.status === 'warning').length;
  const criticalCount = reagents.filter((r) => r.status === 'critical').length;
  const expiryAlerts  = reagents.filter((r) => daysUntilExpiry(r.expiryDate) <= 30).length;

  const handleFilterClick = (status: 'normal' | 'warning' | 'critical') => {
    setActiveFilter((prev) => (prev === status ? null : status));
  };

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b
        bg-gray-50 dark:bg-gray-800
        border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FlaskConical size={18} className="text-blue-500" />
          Reagent Supplies
        </h3>

        <div className="flex items-center gap-3">
          {/* Expiry alert badge */}
          {expiryAlerts > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <Clock size={11} />
              {expiryAlerts} expiring soon
            </span>
          )}

          {/* Clear filter */}
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Filter pills + Search */}
      <div className="px-4 pt-3 pb-2 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <FilterPill count={normalCount}   status="normal"   active={activeFilter === 'normal'}   onClick={() => handleFilterClick('normal')} />
          <FilterPill count={warningCount}  status="warning"  active={activeFilter === 'warning'}  onClick={() => handleFilterClick('warning')} />
          <FilterPill count={criticalCount} status="critical" active={activeFilter === 'critical'} onClick={() => handleFilterClick('critical')} />
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reagent or lot…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border
              border-gray-200 dark:border-gray-700
              bg-gray-50 dark:bg-gray-800
              text-gray-800 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors"
          />
        </div>
      </div>

      {/* Reagent Cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2" style={{ maxHeight: '320px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading reagents...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-gray-400 dark:text-gray-500">No reagents found</p>
          </div>
        ) : (
          filtered.map((reagent, i) => <ReagentCard key={reagent.lotNumber} reagent={reagent} index={i} />)
        )}
      </div>
    </div>
  );
};