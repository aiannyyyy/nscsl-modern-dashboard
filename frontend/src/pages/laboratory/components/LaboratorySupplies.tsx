import React, { useEffect, useState } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import {
  getLabSupplies,
  type LabSupply,
} from '../../../services/LaboratoryServices/labSuppliesService';

// ─────────────────────────────────────────────
// Status UI Config (presentation only)
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  normal: {
    border: 'border-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    badgeActive:
      'bg-emerald-200 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400',
    bar: 'bg-emerald-400',
    label: 'In Stock',
    icon: CheckCircle2,
  },
  warning: {
    border: 'border-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    badgeActive:
      'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400',
    bar: 'bg-amber-400',
    label: 'Low Stock',
    icon: AlertTriangle,
  },
  critical: {
    border: 'border-red-400',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    badgeActive:
      'bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 ring-2 ring-red-400',
    bar: 'bg-red-400',
    label: 'Critical',
    icon: AlertCircle,
  },
  'out-of-stock': {  // 👈 ADD THIS for out-of-stock status
    border: 'border-gray-400',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
    badgeActive:
      'bg-gray-200 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 ring-2 ring-gray-400',
    bar: 'bg-gray-400',
    label: 'Out of Stock',
    icon: AlertCircle,
  },
} as const;

// purely visual cap for progress bar
const MAX_STOCK = 300;

// ─────────────────────────────────────────────
// Helper: Normalize status from backend
// ─────────────────────────────────────────────
const normalizeStatus = (status: any): 'normal' | 'warning' | 'critical' | 'out-of-stock' => {
  if (!status) return 'normal';
  
  const normalized = String(status).toLowerCase().trim();
  
  // Handle backend status values
  if (normalized === 'out-of-stock') return 'out-of-stock';
  if (normalized === 'critical') return 'critical';
  if (normalized === 'warning') return 'warning';
  if (normalized === 'normal') return 'normal';
  
  // Default fallback
  return 'normal';
};

// ─────────────────────────────────────────────
// Supply Card
// ─────────────────────────────────────────────
const SupplyCard: React.FC<{ supply: LabSupply; index: number }> = ({
  supply,
  index,
}) => {
  const normalizedStatus = normalizeStatus(supply.status);
  const cfg = STATUS_CONFIG[normalizedStatus];
  
  const stockPercent = Math.min((supply.stock / MAX_STOCK) * 100, 100);
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 ${cfg.border}
        bg-white dark:bg-gray-800/60
        border border-gray-100 dark:border-gray-700/50
        hover:shadow-md transition-all duration-200`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Icon size={18} className={cfg.text} />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {supply.description}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        <div className="mt-1.5 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${cfg.bar}`}
            style={{ width: `${stockPercent}%` }}
          />
        </div>

        <div className="mt-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Code: <span className="font-medium text-gray-600 dark:text-gray-300">{supply.itemCode}</span>
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${cfg.text}`}>{supply.stock}</p>
        <p className="text-xs text-gray-400">{supply.unit}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Filter Pill
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
      className={`text-xs font-semibold px-2.5 py-1 rounded-full
        transition-all hover:scale-105
        ${active ? cfg.badgeActive : cfg.badge}`}
    >
      {count} {cfg.label}
    </button>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const LaboratorySupplies: React.FC = () => {
  const [supplies, setSupplies] = useState<LabSupply[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] =
    useState<'normal' | 'warning' | 'critical' | 'out-of-stock' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    setLoading(true);
    try {
      const res = await getLabSupplies();
      
      console.log('📊 Lab supplies loaded:', res.data.length);
      console.log('📊 Sample data:', res.data.slice(0, 3));
      
      setSupplies(res.data);
    } catch (err) {
      console.error('❌ Failed to load lab supplies', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = supplies.filter((s) => {
    const normalizedStatus = normalizeStatus(s.status);
    const matchesStatus = activeFilter ? normalizedStatus === activeFilter : true;
    
    const matchesSearch =
      !searchTerm ||
      s.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Count by normalized status
  const countBy = (status: 'normal' | 'warning' | 'critical' | 'out-of-stock') =>
    supplies.filter((s) => normalizeStatus(s.status) === status).length;

  return (
    <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between px-5 py-3 border-b bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
          <Package size={18} className="text-blue-500" />
          Laboratory Supplies
        </h3>

        {activeFilter && (
          <button
            onClick={() => setActiveFilter(null)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 pt-3 pb-2 space-y-2.5">
        <div className="flex gap-2 flex-wrap">
          <FilterPill
            count={countBy('normal')}
            status="normal"
            active={activeFilter === 'normal'}
            onClick={() =>
              setActiveFilter(activeFilter === 'normal' ? null : 'normal')
            }
          />
          <FilterPill
            count={countBy('out-of-stock')}
            status="out-of-stock"
            active={activeFilter === 'out-of-stock'}
            onClick={() =>
              setActiveFilter(activeFilter === 'out-of-stock' ? null : 'out-of-stock')
            }
          />
          <FilterPill
            count={countBy('warning')}
            status="warning"
            active={activeFilter === 'warning'}
            onClick={() =>
              setActiveFilter(activeFilter === 'warning' ? null : 'warning')
            }
          />
          <FilterPill
            count={countBy('critical')}
            status="critical"
            active={activeFilter === 'critical'}
            onClick={() =>
              setActiveFilter(activeFilter === 'critical' ? null : 'critical')
            }
          />
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search item or code…"
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

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2" style={{ maxHeight: '320px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading supplies...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-gray-400 dark:text-gray-500">No supplies found</p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <SupplyCard 
              key={`${s.itemCode}-${i}`} 
              supply={s} 
              index={i} 
            />
          ))
        )}
      </div>
    </div>
  );
};