import React, { useState, useEffect } from 'react';
import type { Ticket } from './types';
import { useJobOrder } from '../../../hooks/ITHooks/useJobOrderHooks';

// ─── Attachment Viewer Modal ──────────────────────────────────────────────────

function AttachmentViewerModal({
  url, filename, onClose,
}: { url: string; filename: string; onClose: () => void }) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf   = ext === 'pdf';

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'modalFadeIn 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">{isImage ? '🖼️' : isPdf ? '📄' : '📎'}</span>
            <span className="font-semibold text-white text-xs truncate">{filename}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={url} download={filename} className="px-2.5 py-1.5 bg-white/20 text-white rounded-lg text-[10px] font-semibold hover:bg-white/30 transition-colors flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
            <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4 min-h-[400px]">
          {isImage ? (
            <img src={url} alt={filename} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
          ) : isPdf ? (
            <iframe src={url} className="w-full h-[70vh] rounded-lg border-0" title={filename} />
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-3">📎</div>
              <p className="text-slate-500 text-xs mb-3">Preview not available for this file type</p>
              <a href={url} download={filename} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reject Reason Modal ──────────────────────────────────────────────────────

function RejectReasonModal({
  workOrderNo, onConfirm, onCancel, isLoading,
}: {
  workOrderNo: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10200] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" style={{ animation: 'modalFadeIn 0.2s ease-out' }}>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Reject Job Order</h3>
        <p className="text-xs text-slate-500 mb-4">
          Rejecting <span className="font-mono font-bold text-slate-700">{workOrderNo}</span>. Please provide a reason.
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={3}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={isLoading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending_approval: 'bg-amber-100 text-amber-700 border-amber-200',
  approved:         'bg-blue-100 text-blue-700 border-blue-200',
  queued:           'bg-indigo-100 text-indigo-700 border-indigo-200',
  assigned:         'bg-purple-100 text-purple-700 border-purple-200',
  in_progress:      'bg-sky-100 text-sky-700 border-sky-200',
  on_hold:          'bg-orange-100 text-orange-700 border-orange-200',
  resolved:         'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed:           'bg-slate-100 text-slate-600 border-slate-200',
  cancelled:        'bg-red-100 text-red-600 border-red-200',
  rejected:         'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-amber-100 text-amber-700',
  medium:   'bg-blue-100 text-blue-700',
  low:      'bg-slate-100 text-slate-600',
};

const PRIORITY_ICONS: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

function getProgress(status: string): number {
  const map: Record<string, number> = {
    pending_approval: 10, approved: 20, queued: 30, assigned: 45,
    in_progress: 65, on_hold: 45, resolved: 90, closed: 100, cancelled: 0, rejected: 0,
  };
  return map[status] ?? 10;
}

function getProgressColor(status: string): string {
  const map: Record<string, string> = {
    pending_approval: 'bg-amber-400',  approved:    'bg-blue-400',
    queued:           'bg-indigo-500', assigned:    'bg-purple-500',
    in_progress:      'bg-sky-500',    on_hold:     'bg-orange-400',
    resolved:         'bg-emerald-500', closed:     'bg-slate-400',
    cancelled:        'bg-red-400',    rejected:    'bg-red-500',
  };
  return map[status] ?? 'bg-slate-400';
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return '🖼️';
  if (ext === 'pdf')                                          return '📄';
  if (['doc','docx'].includes(ext))                          return '📝';
  if (['xls','xlsx'].includes(ext))                          return '📊';
  if (['zip','rar','7z'].includes(ext))                      return '🗜️';
  return '📎';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normaliseAttachments(raw: any[]): { id: number; filename: string; url: string; file_size?: number }[] {
  return raw.map((a) => ({
    id:        a.id,
    filename:  a.original_filename ?? a.file_name ?? a.filename ?? 'file',
    url:       a.file_url ?? a.url ?? '',
    file_size: a.file_size ?? a.size ?? undefined,
  }));
}

const sectionLabel = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  // ── Optional: pass these in from FloatingApprovalTracker to enable approver mode ──
  onApprove?:   (id: number) => void;
  onReject?:    (id: number, reason: string) => void;
  isApproving?: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TicketDetailModal({
  ticket,
  onClose,
  onApprove,
  onReject,
  isApproving = false,
}: TicketDetailModalProps) {
  const [viewingAttachment, setViewingAttachment] = useState<{ url: string; filename: string } | null>(null);
  const [showRejectModal,   setShowRejectModal]   = useState(false);

  // Approver mode: only active when handlers are passed AND ticket is still pending
  const isApproverView = !!(onApprove || onReject) && ticket.status === 'pending_approval';

  const { data: detailData, isLoading: isLoadingDetail } = useJobOrder(ticket.rawId, {
    enabled: !!ticket.rawId,
  });

  const detail      = detailData?.data;
  const attachments = detail?.attachments
    ? normaliseAttachments(Array.isArray(detail.attachments) ? detail.attachments : [])
    : normaliseAttachments((ticket as any).attachments ?? []);

  const department      = (detail as any)?.department       ?? (ticket as any).department ?? ticket.requester.department;
  const tags            = (detail as any)?.tags             ?? (ticket as any).tags;
  const actionTaken     = (detail as any)?.action_taken     ?? (ticket as any).action_taken;
  const resolutionNotes = (detail as any)?.resolution_notes ?? (ticket as any).resolution_notes;
  const rejectionReason = (detail as any)?.rejection_reason ?? (ticket as any).rejection_reason;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !viewingAttachment && !showRejectModal) onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, viewingAttachment, showRejectModal]);

  const progress      = getProgress(ticket.status);
  const progressColor = getProgressColor(ticket.status);

  const timeline = [
    { icon: '📝', label: 'Submitted',   done: true,                                                                                      active: ticket.status === 'pending_approval' },
    { icon: '✔️',  label: 'Approved',    done: ['approved','queued','assigned','in_progress','resolved','closed'].includes(ticket.status), active: ticket.status === 'approved'         },
    { icon: '🔢', label: 'Queued',      done: ['queued','assigned','in_progress','resolved','closed'].includes(ticket.status),            active: ticket.status === 'queued'           },
    { icon: '👤', label: 'Assigned',    done: ['assigned','in_progress','resolved','closed'].includes(ticket.status),                    active: ticket.status === 'assigned'         },
    { icon: '🔧', label: 'In Progress', done: ['in_progress','resolved','closed'].includes(ticket.status),                               active: ticket.status === 'in_progress'      },
    { icon: '✅', label: 'Resolved',    done: ['resolved','closed'].includes(ticket.status),                                             active: ticket.status === 'resolved'         },
    { icon: '🎉', label: 'Closed',      done: ticket.status === 'closed',                                                                active: ticket.status === 'closed', isLast: true },
  ];

  const handleApproveClick = () => {
    onApprove?.(ticket.rawId);
    onClose();
  };

  const handleRejectConfirm = (reason: string) => {
    onReject?.(ticket.rawId, reason);
    setShowRejectModal(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10050] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal shell */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh', animation: 'ticketModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Header — amber for approver, blue for everyone else ── */}
          <div className={`px-5 py-4 flex-shrink-0 bg-gradient-to-r ${isApproverView ? 'from-amber-500 to-amber-600' : 'from-blue-600 to-indigo-600'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-mono font-bold text-white/70 bg-white/15 px-2 py-0.5 rounded-md">
                    {ticket.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${PRIORITY_COLORS[ticket.priority] ?? 'bg-slate-100 text-slate-600'}`}>
                    {PRIORITY_ICONS[ticket.priority]} {ticket.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${STATUS_COLORS[ticket.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 bg-white/15 text-white/80 rounded-full text-[9px] font-semibold border border-white/20">
                    {ticket.category}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white leading-snug">{ticket.title}</h2>
                {isApproverView && (
                  <p className="text-[10px] text-white/60 mt-0.5">Review this request then approve or reject below</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-white/60 font-semibold uppercase tracking-widest">Progress</span>
                <span className="text-[9px] font-bold text-white">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-700 ease-out rounded-full`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingDetail && (
              <div className="px-5 pt-4 pb-2 flex items-center gap-2 text-xs text-blue-500 bg-blue-50 border-b border-blue-100">
                <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading full details &amp; attachments...
              </div>
            )}

            <div className="p-5 space-y-4">

              {/* Description */}
              <div>
                <span className={sectionLabel}>Description</span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-3 border border-slate-100 min-h-[40px]">
                  {ticket.description || <span className="text-slate-300 italic">No description provided.</span>}
                </p>
              </div>

              {/* Requester + Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <span className={sectionLabel}>Requested By</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                      {ticket.requester.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{ticket.requester.name}</p>
                      {(department || ticket.requester.department) && (
                        <p className="text-[10px] text-slate-500 truncate">{department ?? ticket.requester.department}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <span className={sectionLabel}>Assigned To</span>
                  {ticket.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {ticket.assignee.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{ticket.assignee.name}</p>
                        <p className="text-[10px] text-slate-500">IT Officer</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-base flex-shrink-0">👤</div>
                      <p className="text-xs text-slate-400 italic">Unassigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted + Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <span className={sectionLabel}>Submitted</span>
                  <p className="text-xs font-semibold text-slate-700">
                    {ticket.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {ticket.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <span className={sectionLabel}>Category</span>
                  <p className="text-xs font-semibold text-slate-700">{ticket.category}</p>
                  {tags && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {String(tags).split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-semibold">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Attachments ── */}
              {isLoadingDetail ? (
                <div>
                  <span className={sectionLabel}>Attachments</span>
                  <div className="space-y-1.5">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-10 bg-blue-50 border border-blue-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : attachments.length > 0 ? (
                <div>
                  <span className={sectionLabel}>Attachments ({attachments.length})</span>
                  <div className="space-y-1.5">
                    {attachments.map((att) => {
                      const ext        = att.filename.split('.').pop()?.toLowerCase() ?? '';
                      const canPreview = ['png','jpg','jpeg','gif','webp','svg','pdf'].includes(ext);
                      return (
                        <div
                          key={att.id}
                          className="flex items-center gap-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100/60 transition-colors"
                        >
                          <span className="text-base flex-shrink-0">{getFileIcon(att.filename)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-700 truncate">{att.filename}</p>
                            {att.file_size && (
                              <p className="text-[9px] text-slate-400">{formatFileSize(att.file_size)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {canPreview && (
                              <button
                                onClick={() => setViewingAttachment({ url: att.url, filename: att.filename })}
                                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                            )}
                            <a
                              href={att.url}
                              download={att.filename}
                              className="px-2.5 py-1 bg-white border border-blue-200 text-slate-600 rounded-lg text-[10px] font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !isLoadingDetail && (
                <div>
                  <span className={sectionLabel}>Attachments</span>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-300 text-base">📎</span>
                    <p className="text-[11px] text-slate-400 italic">No attachments</p>
                  </div>
                </div>
              )}

              {/* Timeline — hidden in approver view to keep it focused */}
              {!isApproverView && (
                <div>
                  <span className={sectionLabel}>Timeline</span>
                  <div>
                    {timeline.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 26 }}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all z-10 relative ${
                            step.done
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm'
                              : step.active
                              ? 'bg-blue-50 text-blue-500 ring-2 ring-blue-300'
                              : 'bg-slate-100 text-slate-300'
                          }`}>
                            {step.icon}
                          </div>
                          {!step.isLast && (
                            <div className={`w-px my-0.5 ${step.done ? 'bg-blue-300' : 'bg-slate-200'}`} style={{ height: 16 }} />
                          )}
                        </div>
                        <div className="pb-2 pt-0.5">
                          <p className={`text-[11px] font-semibold ${step.done ? 'text-slate-700' : step.active ? 'text-blue-600' : 'text-slate-300'}`}>
                            {step.label}
                          </p>
                          {step.active && (
                            <p className="text-[9px] text-blue-400 animate-pulse">In progress...</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution details — non-approver only */}
              {!isApproverView && (actionTaken || resolutionNotes) && (
                <div>
                  <span className={sectionLabel}>Resolution Details</span>
                  <div className="space-y-2">
                    {actionTaken && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Action Taken</p>
                        <p className="text-xs text-emerald-800 leading-relaxed">{actionTaken}</p>
                      </div>
                    )}
                    {resolutionNotes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">Resolution Notes</p>
                        <p className="text-xs text-blue-800 leading-relaxed">{resolutionNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {ticket.status === 'rejected' && rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                  <p className="text-xs text-red-800 leading-relaxed">{rejectionReason}</p>
                </div>
              )}

            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2 flex-shrink-0">
            <p className="text-[10px] text-slate-400 flex-shrink-0">
              Submitted {ticket.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>

            {isApproverView ? (
              /* ── Approve / Reject buttons for approver ── */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isApproving}
                  className="px-4 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
                <button
                  onClick={handleApproveClick}
                  disabled={isApproving}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {isApproving ? (
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:shadow-md hover:shadow-blue-500/30 transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attachment viewer */}
      {viewingAttachment && (
        <AttachmentViewerModal
          url={viewingAttachment.url}
          filename={viewingAttachment.filename}
          onClose={() => setViewingAttachment(null)}
        />
      )}

      {/* Reject reason modal */}
      {showRejectModal && (
        <RejectReasonModal
          workOrderNo={ticket.id}
          onConfirm={handleRejectConfirm}
          onCancel={() => setShowRejectModal(false)}
          isLoading={isApproving}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticketModalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </>
  );
}