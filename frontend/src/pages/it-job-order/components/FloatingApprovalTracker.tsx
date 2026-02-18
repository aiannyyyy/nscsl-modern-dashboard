import React, { useState } from 'react';
import type { Ticket } from './types';
import { TicketDetailModal } from './TicketDetailModal';

interface FloatingApprovalTrackerProps {
  pendingApprovals: Ticket[];
  onViewAll: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  isApproving: boolean;
}

export function FloatingApprovalTracker({
  pendingApprovals,
  onViewAll,
  onApprove,
  onReject,
  isApproving,
}: FloatingApprovalTrackerProps) {
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: number; workOrderNo: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);

  const pendingCount = pendingApprovals.length;
  const urgentCount  = pendingApprovals.filter(
    (t) => t.priority === 'critical' || t.priority === 'high'
  ).length;

  const handleRejectSubmit = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    onReject(rejectTarget.id, rejectReason.trim());
    setRejectTarget(null);
    setRejectReason('');
  };

  return (
    <>
      {/* ── Collapsed pill — pending ── */}
      {!isExpanded && pendingCount > 0 && (
        <div
          className="fixed bottom-6 right-6 z-[9998] animate-slideUp cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden hover:shadow-xl transition-all w-80">
            <div className="h-1.5 bg-amber-400" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-md relative">
                  ✅
                  {urgentCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                      {urgentCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm mb-0.5">Pending Approvals</h4>
                  <p className="text-xs text-slate-500">
                    {pendingCount} {pendingCount === 1 ? 'ticket' : 'tickets'} waiting for review
                  </p>
                </div>
                <svg className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                {urgentCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-semibold">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {urgentCount} urgent
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onViewAll(); }}
                  className="ml-auto text-amber-600 hover:text-amber-700 font-semibold"
                >
                  View all →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapsed pill — all clear ── */}
      {!isExpanded && pendingCount === 0 && (
        <div
          className="fixed bottom-6 right-6 z-[9998] animate-slideUp cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all w-80">
            <div className="h-1.5 bg-emerald-400" />
            <div className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-md">
                ✅
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 text-sm">All Caught Up!</h4>
                <p className="text-xs text-slate-400">No pending approvals</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onViewAll(); }}
                className="text-xs text-emerald-600 font-semibold hover:text-emerald-700"
              >
                View all →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded panel ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-end p-6 pointer-events-none">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-amber-200 w-[450px] max-h-[85vh] overflow-hidden pointer-events-auto"
            style={{ animation: 'slideUpExpand 0.3s ease-out' }}
          >
            {/* Panel header */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold">Pending Approvals</h3>
                  <p className="text-amber-100 text-xs mt-0.5">
                    {pendingCount} {pendingCount === 1 ? 'ticket' : 'tickets'} awaiting review
                  </p>
                </div>
                <button onClick={() => setIsExpanded(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                onClick={onViewAll}
                className="w-full py-2 bg-white text-amber-600 rounded-lg text-xs font-semibold hover:bg-amber-50 transition-colors"
              >
                View Full Dashboard
              </button>
            </div>

            {/* Ticket list */}
            <div className="overflow-y-auto max-h-[calc(85vh-160px)]">
              {pendingCount === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 bg-amber-50 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">✅</div>
                  <h4 className="font-semibold text-slate-900 mb-1 text-sm">All Caught Up!</h4>
                  <p className="text-xs text-slate-500">No pending approvals at the moment</p>
                </div>
              ) : (
                pendingApprovals.map((ticket) => {
                  const numericId = ticket.rawId;
                  const isUrgent  = ticket.priority === 'critical' || ticket.priority === 'high';

                  return (
                    <div
                      key={ticket.id}
                      className={`p-4 border-b border-slate-100 transition-all ${
                        isUrgent ? 'bg-red-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Ticket meta */}
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
                              {ticket.priority === 'critical' ? '🔴' :
                               ticket.priority === 'high'     ? '🟠' :
                               ticket.priority === 'medium'   ? '🟡' : '🟢'} {ticket.priority}
                            </span>
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-semibold">
                              {ticket.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 text-xs line-clamp-1 mb-0.5">{ticket.title}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2">{ticket.description}</p>
                        </div>
                      </div>

                      {/* Requester info */}
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Requested by</p>
                          <p className="text-xs font-semibold text-slate-900">{ticket.requester.name}</p>
                          {ticket.requester.department && (
                            <p className="text-[10px] text-slate-500">{ticket.requester.department}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Submitted</p>
                          <p className="text-xs font-semibold text-slate-700">
                            {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex gap-1.5">
                        {/* View details — opens TicketDetailModal with full attachment support */}
                        <button
                          onClick={() => setDetailTicket(ticket)}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Details
                        </button>

                        <button
                          onClick={() => onApprove(numericId)}
                          disabled={isApproving}
                          className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget({ id: numericId, workOrderNo: ticket.id })}
                          disabled={isApproving}
                          className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
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
            </div>
          </div>
        </div>
      )}

      {/* ── Reject reason modal ── */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            style={{ animation: 'modalFadeIn 0.2s ease-out' }}
          >
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reject Job Order</h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting{' '}
              <span className="font-mono font-bold text-slate-700">{rejectTarget.workOrderNo}</span>.
              Please provide a reason.
            </p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                disabled={isApproving}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isApproving || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ticket detail modal — fetches full detail incl. attachments ── */}
      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
        />
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
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}} />
    </>
  );
}