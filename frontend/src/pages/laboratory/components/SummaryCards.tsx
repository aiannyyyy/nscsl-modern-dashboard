import React from 'react';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useCurrentMonthSummary } from '../../../hooks/LaboratoryHooks';

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const SummaryCards: React.FC = () => {
  // Use React Query hook
  const { data: response, isLoading, error } = useCurrentMonthSummary();

  // Extract data with fallback
  const data = response?.data || {
    received: 0,
    screened: 0,
    unsat: 0,
  };

  const stats = [
    { 
      title: 'Total Received', 
      value: data.received, 
      icon: FileText, 
      divider: true 
    },
    { 
      title: 'Total Screened', 
      value: data.screened, 
      icon: CheckCircle, 
      divider: true 
    },
    { 
      title: 'Unsatisfactory', 
      value: data.unsat, 
      icon: AlertCircle, 
      divider: false,
      isWarning: true 
    }
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

        {/* Top row: title */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h4 className="text-lg font-bold text-white">
              Laboratory Summary
            </h4>
            <p className="text-xs text-blue-200 mt-0.5">
              {isLoading ? 'Loading...' : error ? 'Error loading data' : 'Current month statistics'}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex items-stretch px-6 pb-5">
          <div className="flex flex-1 items-center">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              const isWarning = stat.isWarning;

              return (
                <React.Fragment key={i}>
                  <div className={`flex-1 flex items-center gap-3 ${i > 0 ? 'pl-5' : ''} ${i < stats.length - 1 ? 'pr-5' : ''}`}>
                    {/* Icon circle */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isWarning ? 'bg-red-500/25' : 'bg-white/15'}`}
                    >
                      <Icon size={18} className={isWarning ? 'text-red-300' : 'text-white'} strokeWidth={2} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className="text-xs text-blue-200 truncate">{stat.title}</p>
                      <p className={`text-xl font-bold leading-tight ${isWarning ? 'text-red-300' : 'text-white'}`}>
                        {isLoading ? '—' : error ? '—' : stat.value.toLocaleString()}
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

        {/* Error message (if any) */}
        {error && (
          <div className="relative z-10 px-6 pb-4">
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2">
              <p className="text-xs text-red-200">
                {error instanceof Error ? error.message : 'Failed to load summary data'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};