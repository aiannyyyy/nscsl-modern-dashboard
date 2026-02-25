import React, { useState } from 'react';
import type { Ticket } from './types';
import { useAuth } from '../../../context/AuthContext';
import { TicketDetailModal } from './TicketDetailModal';
import { CreateTicketModal } from './CreateTicketModal';

interface FloatingApproverTrackerProps {
  activeTickets: Ticket[];
  pendingApprovals: Ticket[];
  onViewAll: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  isApproving: boolean;
}

type TabType = 'my_orders' | 'approvals';

export function FloatingApproverTracker({
  activeTickets = [],
  pendingApprovals = [],
  onViewAll,
  onApprove,
  onReject,
  isApproving,
}: FloatingApproverTrackerProps) {
  const { user } = useAuth();
  const [isExpanded,        setIsExpanded]        = useState(false);
  const [activeTab,         setActiveTab]         = useState<TabType>('approvals');
  const [rejectTarget,      setRejectTarget]      = useState<{ id: number; workOrderNo: string } | null>(null);
  const [rejectReason,      setRejectReason]      = useState('');
  const [detailTicket,      setDetailTicket]      = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket,    setSelectedTicket]    = useState<Ticket | null>(null);

  const myTickets = activeTickets.filter(
    (t) => t.requester?.id === String(user?.id ?? user?.user_id ?? '')
  );

  React.useEffect(() => {
    if (myTickets.length > 0) {
      setSelectedTicket((prev) =>
        prev ? myTickets.find((t) => t.id === prev.id) ?? myTickets[0] : myTickets[0]
      );
    } else {
      setSelectedTicket(null);
    }
  }, [myTickets.length]);

  const pendingCount  = pendingApprovals.length;
  const urgentCount   = pendingApprovals.filter(t => t.priority === 'critical' || t.priority === 'high').length;
  const myOrdersCount = myTickets.length;

  const handleRejectSubmit = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    onReject(rejectTarget.id, rejectReason.trim());
    setRejectTarget(null);
    setRejectReason('');
  };

  const getProgress = (ticket: Ticket): number => {
    const map: Record<string, number> = {
      pending_approval: 10, approved: 20, queued: 30, assigned: 45,
      in_progress: 65, on_hold: 45, resolved: 90, closed: 100,
      cancelled: 0, rejected: 0,
    };
    return map[ticket.status] ?? 10;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; textColor: string; icon: string }> = {
      pending_approval: { label: 'Awaiting Approval', color: 'bg-amber-400',   textColor: 'text-amber-600',   icon: '⏳' },
      approved:         { label: 'Approved',           color: 'bg-blue-400',    textColor: 'text-blue-600',    icon: '✔️' },
      queued:           { label: 'In Queue',            color: 'bg-indigo-400',  textColor: 'text-indigo-600',  icon: '🔢' },
      assigned:         { label: 'Assigned',            color: 'bg-purple-500',  textColor: 'text-purple-600',  icon: '👤' },
      in_progress:      { label: 'Being Fixed',         color: 'bg-blue-600',    textColor: 'text-blue-600',    icon: '🔧' },
      on_hold:          { label: 'On Hold',             color: 'bg-orange-500',  textColor: 'text-orange-600',  icon: '⏸️' },
      resolved:         { label: 'Almost Done',         color: 'bg-emerald-500', textColor: 'text-emerald-600', icon: '✅' },
      closed:           { label: 'Completed',           color: 'bg-slate-400',   textColor: 'text-slate-600',   icon: '🎉' },
      cancelled:        { label: 'Cancelled',           color: 'bg-red-400',     textColor: 'text-red-600',     icon: '❌' },
      rejected:         { label: 'Rejected',            color: 'bg-red-500',     textColor: 'text-red-600',     icon: '🚫' },
    };
    return configs[status] ?? configs.pending_approval;
  };

  const currentTicket = selectedTicket ?? myTickets[0] ?? null;
  const statusConfig  = currentTicket ? getStatusConfig(currentTicket.status) : null;
  const progress      = currentTicket ? getProgress(currentTicket) : 0;

  // ── Collapsed pill ────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <div
        className="fixed bottom-6 left-6 z-[9998] animate-slideUp cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 overflow-hidden hover:shadow-xl transition-all w-80">
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative text-lg">
                {pendingCount > 0 ? '📋' : '🎫'}
                {urgentCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                    {urgentCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-sm">Approver Dashboard</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {pendingCount > 0 ? (
                    <span className="text-xs text-blue-600 font-semibold">
                      {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-semibold">All caught up!</span>
                  )}
                  {myOrdersCount > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-blue-500 font-semibold">{myOrdersCount} my order{myOrdersCount > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>

              <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Footer row */}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              {myOrdersCount > 0 ? (
                <>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {progress}% Complete
                  </span>
                  {myOrdersCount > 1 && (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
                      {myOrdersCount} active
                    </span>
                  )}
                </>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsCreateModalOpen(true); }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  + Create new order
                </button>
              )}
            </div>
          </div>
        </div>

        <CreateTicketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes slideUpExpand { from { opacity:0; transform:translateY(30px) scale(0.96); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes modalFadeIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
          .animate-slideUp { animation: slideUp 0.3s ease-out; }
        `}} />
      </div>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-[9998] flex items-end justify-start p-6 pointer-events-none">
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-[460px] max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col"
          style={{ animation: 'slideUpExpand 0.3s ease-out' }}
        >
          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">Approver Dashboard</h3>
                <p className="text-blue-100 text-xs mt-0.5">{user?.position}</p>
              </div>
              <button onClick={() => setIsExpanded(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-3">
              <button onClick={onViewAll}
                className="flex-1 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
                View Dashboard
              </button>
              <button onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 py-2 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Work Order
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-blue-800/40 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('approvals')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'approvals' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white'
                }`}
              >
                Pending Approvals
                {pendingCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'approvals' ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('my_orders')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'my_orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white'
                }`}
              >
                My Orders
                {myOrdersCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'my_orders' ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'
                  }`}>
                    {myOrdersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Tab content ── */}
          <div className="overflow-y-auto flex-1">

            {/* ── Pending Approvals tab ── */}
            {activeTab === 'approvals' && (
              <>
                {pendingCount === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">✅</div>
                    <h4 className="font-semibold text-slate-900 mb-1 text-sm">All Caught Up!</h4>
                    <p className="text-xs text-slate-500">No pending approvals at the moment</p>
                  </div>
                ) : (
                  pendingApprovals.map((ticket) => {
                    const isUrgent = ticket.priority === 'critical' || ticket.priority === 'high';
                    return (
                      <div key={ticket.id} className={`p-4 border-b border-slate-100 ${isUrgent ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {ticket.requester.avatar || ticket.requester.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-slate-400">{ticket.id}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                ticket.priority === 'critical' ? 'bg-red-100 text-red-700 animate-pulse' :
                                ticket.priority === 'high'     ? 'bg-amber-100 text-amber-700' :
                                ticket.priority === 'medium'   ? 'bg-blue-100 text-blue-700' :
                                                                 'bg-slate-100 text-slate-600'
                              }`}>
                                {ticket.priority === 'critical' ? '🔴' : ticket.priority === 'high' ? '🟠' : ticket.priority === 'medium' ? '🟡' : '🟢'} {ticket.priority}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-900 text-xs line-clamp-1">{ticket.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{ticket.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Requested by</p>
                            <p className="text-xs font-semibold text-slate-900">{ticket.requester.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">Submitted</p>
                            <p className="text-xs font-semibold text-slate-700">
                              {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <button onClick={() => setDetailTicket(ticket)}
                            className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Details
                          </button>
                          <button onClick={() => onApprove(ticket.rawId)} disabled={isApproving}
                            className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button onClick={() => setRejectTarget({ id: ticket.rawId, workOrderNo: ticket.id })} disabled={isApproving}
                            className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* ── My Orders tab ── */}
            {activeTab === 'my_orders' && (
              <>
                {myTickets.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">🎫</div>
                    <h4 className="font-semibold text-slate-900 mb-1 text-sm">No Active Orders</h4>
                    <p className="text-xs text-slate-500 mb-4">You haven't submitted any job orders</p>
                    <button onClick={() => setIsCreateModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                      Create Work Order
                    </button>
                  </div>
                ) : (
                  myTickets.map((ticket) => {
                    const tStatus    = getStatusConfig(ticket.status);
                    const tProgress  = getProgress(ticket);
                    const isSelected = selectedTicket?.id === ticket.id;

                    return (
                      <div key={ticket.id}
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
                              }`}>{ticket.priority}</span>
                            </div>
                            <h4 className="font-semibold text-slate-900 text-xs line-clamp-1">{ticket.title}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{ticket.description}</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className={`font-bold ${tStatus.textColor}`}>{tStatus.label}</span>
                            <span className="text-slate-400">{tProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${tStatus.color} transition-all duration-500`} style={{ width: `${tProgress}%` }} />
                          </div>
                        </div>

                        {ticket.assignee && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: 8 }}>
                              {ticket.assignee.avatar || ticket.assignee.name.charAt(0)}
                            </div>
                            <span>{ticket.assignee.name}</span>
                          </div>
                        )}

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            <TimelineStep icon="⏳" label="Submitted"   completed={true}                                                                active={ticket.status === 'pending_approval'} />
                            <TimelineStep icon="🔧" label="Being Fixed" completed={['in_progress','resolved','closed'].includes(ticket.status)}        active={ticket.status === 'in_progress'} />
                            <TimelineStep icon="✅" label="Resolved"    completed={['resolved','closed'].includes(ticket.status)}                      active={ticket.status === 'resolved'} />
                            <TimelineStep icon="🎉" label="Completed"   completed={ticket.status === 'closed'}                                         active={ticket.status === 'closed'} isLast />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Reject modal ── */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" style={{ animation: 'modalFadeIn 0.2s ease-out' }}>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reject Job Order</h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting <span className="font-mono font-bold text-slate-700">{rejectTarget.workOrderNo}</span>. Please provide a reason.
            </p>
            <textarea autoFocus value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..." rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} disabled={isApproving}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleRejectSubmit} disabled={isApproving || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {isApproving ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail modal ── */}
      {detailTicket && (
        <TicketDetailModal ticket={detailTicket} onClose={() => setDetailTicket(null)} />
      )}

      {/* ── Create modal ── */}
      <CreateTicketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUpExpand { from { opacity:0; transform:translateY(30px) scale(0.96); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes modalFadeIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}} />
    </>
  );
}

// ─── Timeline Step ─────────────────────────────────────────────────────────────
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

export { FloatingApproverTracker as FloatingApprovalTracker };