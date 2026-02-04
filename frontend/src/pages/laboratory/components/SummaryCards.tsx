import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Play } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface SummaryData {
  totalReceived: number;
  totalScreened: number;
  totalUnfitUnsat: number;
  overdue: number;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const SummaryCards: React.FC = () => {
  const [data, setData] = useState<SummaryData>({
    totalReceived: 0,
    totalScreened: 0,
    totalUnfitUnsat: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      setData({
        totalReceived: 1234,
        totalScreened: 1150,
        totalUnfitUnsat: 45,
        overdue: 12,
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runNeometrics = () => {
    console.log('Running Neometrics...');
    // TODO: Implement Neometrics functionality
  };

  const stats = [
    { title: 'Total Received',   value: data.totalReceived,   icon: FileText,      divider: true },
    { title: 'Total Screened',   value: data.totalScreened,   icon: CheckCircle,   divider: true },
    { title: 'Unfit & Unsat',    value: data.totalUnfitUnsat, icon: Clock,         divider: true }
  ];

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #3b82f6 100%)' }}
    >
      {/* Subtle decorative circles */}
      <div className="relative">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white opacity-5 pointer-events-none" />
        <div className="absolute -bottom-12 -left-16 w-56 h-56 rounded-full bg-white opacity-5 pointer-events-none" />
        <div className="absolute top-2 right-32 w-24 h-24 rounded-full bg-white opacity-[0.03] pointer-events-none" />

        {/* Top row: title + button */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h4 className="text-lg font-bold text-white">
              Summary of Total Samples
            </h4>
            <p className="text-xs text-blue-200 mt-0.5">Processed this month</p>
          </div>
          {/* Run Neometrics button 
          <button
            onClick={runNeometrics}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/15 hover:bg-white/25
              border border-white/20 hover:border-white/35
              text-white text-sm font-semibold
              transition-all duration-200 active:scale-95 backdrop-blur-sm"
          >
            <Play size={14} className="fill-white" />
            Run Neometrics
          </button>
          */}
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex items-stretch px-6 pb-5">
          <div className="flex flex-1 items-center">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              // Overdue gets a subtle warning tint
              const isOverdue = i === 3;

              return (
                <React.Fragment key={i}>
                  <div className={`flex-1 flex items-center gap-3 ${i > 0 ? 'pl-5' : ''} ${i < stats.length - 1 ? 'pr-5' : ''}`}>
                    {/* Icon circle */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isOverdue ? 'bg-red-500/25' : 'bg-white/15'}`}
                    >
                      <Icon size={18} className={isOverdue ? 'text-red-300' : 'text-white'} strokeWidth={2} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className="text-xs text-blue-200 truncate">{stat.title}</p>
                      <p className={`text-xl font-bold leading-tight ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                        {loading ? '—' : stat.value.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  {stat.divider && (
                    <div className="w-px self-stretch bg-white/15 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};