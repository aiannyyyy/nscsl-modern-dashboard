import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Supply {
  itemCode: string;
  description: string;
  stock: number;
  unit: string;
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

const MAX_STOCK = 300;

// ─────────────────────────────────────────────
// Supply Card
// ─────────────────────────────────────────────
const SupplyCard: React.FC<{ supply: Supply; index: number }> = ({ supply, index }) => {
  const cfg = STATUS_CONFIG[supply.status];
  const stockPercent = Math.min((supply.stock / MAX_STOCK) * 100, 100);

  const StatusIcon = supply.status === 'normal' ? CheckCircle2
                   : supply.status === 'warning' ? AlertTriangle
                   : AlertCircle;

  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 ${cfg.border}
        bg-white dark:bg-gray-800/60
        border border-gray-100 dark:border-gray-700/50
        hover:shadow-md dark:hover:shadow-gray-900/30
        transition-all duration-200 hover:-translate-y-0.5 cursor-default`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <StatusIcon size={18} className={cfg.text} strokeWidth={2} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{supply.description}</p>
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
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${cfg.text}`}>{supply.stock}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{supply.unit}</p>
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
export const LaboratorySupplies: React.FC = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'normal' | 'warning' | 'critical' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      const mockSupplies: Supply[] = [
        { itemCode: 'LAB-001', description: 'Filter Paper',              stock: 150, unit: 'pcs',  status: 'normal' },
        { itemCode: 'LAB-002', description: 'Blood Collection Card',     stock: 45,  unit: 'pcs',  status: 'warning' },
        { itemCode: 'LAB-003', description: 'Pipette Tips 10µL',         stock: 8,   unit: 'box',  status: 'critical' },
        { itemCode: 'LAB-004', description: 'Gloves (Medium)',           stock: 200, unit: 'pcs',  status: 'normal' },
        { itemCode: 'LAB-005', description: 'Test Tubes',                stock: 30,  unit: 'pcs',  status: 'warning' },
        { itemCode: 'LAB-006', description: 'Centrifuge Tubes',          stock: 5,   unit: 'pack', status: 'critical' },
        { itemCode: 'LAB-007', description: 'Alcohol Swabs',             stock: 300, unit: 'pcs',  status: 'normal' },
        { itemCode: 'LAB-008', description: 'Lancets',                   stock: 50,  unit: 'box',  status: 'warning' },
      ];

      setSupplies(mockSupplies);
    } catch (error) {
      console.error('Error fetching supplies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combined: status pill + search text
  const filtered = supplies.filter((s) => {
    const matchesStatus = activeFilter ? s.status === activeFilter : true;
    const matchesSearch = searchTerm.trim() === ''
      ? true
      : s.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const normalCount   = supplies.filter((s) => s.status === 'normal').length;
  const warningCount  = supplies.filter((s) => s.status === 'warning').length;
  const criticalCount = supplies.filter((s) => s.status === 'critical').length;

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
            placeholder="Search item or code…"
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

      {/* Supply Cards */}
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
          filtered.map((supply, i) => <SupplyCard key={supply.itemCode} supply={supply} index={i} />)
        )}
      </div>
    </div>
  );
};