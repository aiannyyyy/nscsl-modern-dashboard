import React, { useState } from 'react';
import type { Ticket } from './types';
import { useAuth } from '../../../context/AuthContext';

interface FloatingJobOrderTrackerProps {
  activeTickets: Ticket[];
  onViewAll: () => void;
  onCreateNew: () => void;
}

export function FloatingJobOrderTracker({
  activeTickets,
  onViewAll,
  onCreateNew,
}: FloatingJobOrderTrackerProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ FIX: Only show tickets belonging to the current user
  const myTickets = activeTickets.filter(
    (t) => t.requester?.id === String(user?.id ?? user?.user_id ?? '')
  );

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(
    myTickets.length > 0 ? myTickets[0] : null
  );

  // Keep selectedTicket in sync when myTickets changes
  React.useEffect(() => {
    if (myTickets.length > 0) {
      setSelectedTicket((prev) =>
        prev ? myTickets.find((t) => t.id === prev.id) ?? myTickets[0] : myTickets[0]
      );
    } else {
      setSelectedTicket(null);
    }
  }, [myTickets.length]);

  const hasActiveTickets = myTickets.length > 0;
  const currentTicket = selectedTicket ?? myTickets[0] ?? null;

  // ─── Status helpers ───────────────────────────────────────────────
  const getProgress = (ticket: Ticket): number => {
    const map: Record<string, number> = {
      pending_approval: 10,
      approved: 20,
      queued: 30,
      assigned: 45,
      in_progress: 65,
      on_hold: 45,
      resolved: 90,
      closed: 100,
      cancelled: 0,
      rejected: 0,
    };
    return map[ticket.status] ?? 10;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; textColor: string; icon: string }> = {
      pending_approval: { label: 'Awaiting Approval', color: 'bg-amber-400',   textColor: 'text-amber-600',  icon: '⏳' },
      approved:         { label: 'Approved',           color: 'bg-blue-400',    textColor: 'text-blue-600',   icon: '✔️' },
      queued:           { label: 'In Queue',            color: 'bg-indigo-400',  textColor: 'text-indigo-600', icon: '🔢' },
      assigned:         { label: 'Assigned',            color: 'bg-purple-500',  textColor: 'text-purple-600', icon: '👤' },
      in_progress:      { label: 'Being Fixed',         color: 'bg-blue-600',    textColor: 'text-blue-600',   icon: '🔧' },
      on_hold:          { label: 'On Hold',             color: 'bg-orange-500',  textColor: 'text-orange-600', icon: '⏸️' },
      resolved:         { label: 'Almost Done',         color: 'bg-emerald-500', textColor: 'text-emerald-600',icon: '✅' },
      closed:           { label: 'Completed',           color: 'bg-slate-400',   textColor: 'text-slate-600',  icon: '🎉' },
      cancelled:        { label: 'Cancelled',           color: 'bg-red-400',     textColor: 'text-red-600',    icon: '❌' },
      rejected:         { label: 'Rejected',            color: 'bg-red-500',     textColor: 'text-red-600',    icon: '🚫' },
    };
    return configs[status] ?? configs.pending_approval;
  };

  const statusConfig  = currentTicket ? getStatusConfig(currentTicket.status) : null;
  const progress      = currentTicket ? getProgress(currentTicket) : 0;

  return (
    <>
      {/* ── Collapsed Pill ── */}
      {!isExpanded && (
        <div
          className="fixed bottom-6 right-6 z-[9998] animate-slideUp cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all w-80">
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="p-4">
              {hasActiveTickets && currentTicket && statusConfig ? (
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-md">
                    {statusConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{currentTicket.id}</span>
                      <span className={`text-[10px] font-bold ${statusConfig.textColor}`}>{statusConfig.label}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{currentTicket.title}</h4>
                    {currentTicket.assignee && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Assigned to {currentTicket.assignee.name}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-md">
                    🎫
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm">Job Order Tracker</h4>
                    <p className="text-xs text-slate-400">No active tickets</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}

              {/* Footer row */}
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                {hasActiveTickets ? (
                  <>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {progress}% Complete
                    </span>
                    {myTickets.length > 1 && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
                        {myTickets.length} active
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCreateNew(); }}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    + Create new ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded Panel ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-end p-6 pointer-events-none">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-[400px] max-h-[85vh] overflow-hidden pointer-events-auto"
            style={{ animation: 'slideUpExpand 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">My Job Orders</h3>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {myTickets.length} active {myTickets.length === 1 ? 'ticket' : 'tickets'}
                  </p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onCreateNew}
                  className="flex-1 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Ticket
                </button>
                <button
                  onClick={onViewAll}
                  className="flex-1 py-2 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors"
                >
                  View All
                </button>
              </div>
            </div>

            {/* Ticket List */}
            <div className="overflow-y-auto max-h-[calc(85vh-160px)]">
              {myTickets.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 bg-blue-50 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">🎫</div>
                  <h4 className="font-semibold text-slate-900 mb-1">No Active Tickets</h4>
                  <p className="text-xs text-slate-500 mb-4">You don't have any open job orders</p>
                  <button
                    onClick={onCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create New Ticket
                  </button>
                </div>
              ) : (
                myTickets.map((ticket) => {
                  const tStatus   = getStatusConfig(ticket.status);
                  const tProgress = getProgress(ticket);
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 border-b border-slate-100 cursor-pointer transition-all ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                          {tStatus.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400">{ticket.id}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ticket.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              ticket.priority === 'high'     ? 'bg-amber-100 text-amber-700' :
                              ticket.priority === 'medium'   ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{ticket.title}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{ticket.description}</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className={`font-bold ${tStatus.textColor}`}>{tStatus.label}</span>
                          <span className="text-slate-400">{tProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${tStatus.color} transition-all duration-500`}
                            style={{ width: `${tProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Assignee */}
                      {ticket.assignee && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: 8 }}>
                            {ticket.assignee.avatar || ticket.assignee.name.charAt(0)}
                          </div>
                          <span>{ticket.assignee.name}</span>
                        </div>
                      )}

                      {/* Timeline (expanded for selected) */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <TimelineStep icon="⏳" label="Submitted"       completed={true}                                                                active={ticket.status === 'pending_approval'} />
                          <TimelineStep icon="✔️" label="Approved"         completed={['approved','queued','assigned','in_progress','resolved','closed'].includes(ticket.status)} active={ticket.status === 'approved'} />
                          <TimelineStep icon="🔧" label="Being Fixed"      completed={['in_progress','resolved','closed'].includes(ticket.status)}        active={ticket.status === 'in_progress'} />
                          <TimelineStep icon="✅" label="Resolved"         completed={['resolved','closed'].includes(ticket.status)}                      active={ticket.status === 'resolved'} />
                          <TimelineStep icon="🎉" label="Completed"        completed={ticket.status === 'closed'}                                         active={ticket.status === 'closed'} isLast />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpExpand {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}} />
    </>
  );
}

// ─── Timeline Step ────────────────────────────────────────────────────────────
interface TimelineStepProps {
  icon: string;
  label: string;
  completed: boolean;
  active: boolean;
  isLast?: boolean;
}

function TimelineStep({ icon, label, completed, active, isLast }: TimelineStepProps) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
          completed
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm scale-105'
            : active
            ? 'bg-blue-50 text-blue-500 ring-2 ring-blue-200'
            : 'bg-slate-100 text-slate-300'
        }`}>
          {icon}
        </div>
        {!isLast && (
          <div className={`w-px h-5 mt-0.5 ${completed ? 'bg-blue-400' : 'bg-slate-200'}`} />
        )}
      </div>
      <div className="pt-1">
        <p className={`text-xs font-semibold ${
          completed ? 'text-slate-800' : active ? 'text-blue-600' : 'text-slate-300'
        }`}>
          {label}
        </p>
        {active && <p className="text-[10px] text-blue-500 animate-pulse">In progress...</p>}
      </div>
    </div>
  );
}