import React, { useState, useEffect } from 'react';
import {
  useJobOrders,
  useMyActiveJobOrders,
  useJobOrderStats,
  useApproveJobOrder,
  useRejectJobOrder,
  useAssignJobOrder,
  useStartJobOrder,
  useResolveJobOrder,
  useCloseJobOrder,
} from '../../hooks/ITHooks/useJobOrderHooks';
import { mapJobOrderToTicket } from '../../utils/jobOrderMappers';
import type { JobOrderFilters } from '../../services/ITServices/itJobOrderService';
import { CreateTicketModal } from './components/CreateTicketModal';
import { FloatingJobOrderTracker } from './components/FloatingJobOrderTracker';
import { TicketDetailModal } from './components/TicketDetailModal';
import { useAuth } from '../../context/AuthContext';
import { getPermissions } from './components/permissions';
import type { Ticket } from './components/types';

// ─── IT Officers ─────────────────────────────────────────────────────────────

const IT_OFFICERS: { id: number; name: string }[] = [
  { id: 2, name: 'John Adrian Ticatic' },
  { id: 6, name: 'Alvin Deyto' },
];

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

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  { const m = Math.floor(diff / 60);   return `${m}m ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h}h ago`; }
  const d = Math.floor(diff / 86400);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function RelativeTime({ date }: { date: Date }) {
  const [label, setLabel] = useState(() => timeAgo(date));
  useEffect(() => {
    const id = setInterval(() => setLabel(timeAgo(date)), 60_000);
    return () => clearInterval(id);
  }, [date]);
  const fullDate = date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <span title={fullDate} className="flex items-center gap-1 cursor-default">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const icons: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${PRIORITY_COLORS[priority] ?? 'bg-slate-100 text-slate-600'}`}>
      {icons[priority]} {priority}
    </span>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function RejectModal({ workOrderNo, onConfirm, onCancel, isLoading }: {
  workOrderNo: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" style={{ animation: 'modalFadeIn 0.2s ease-out' }}>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Reject Job Order</h3>
        <p className="text-sm text-slate-500 mb-4">
          Rejecting <span className="font-mono font-bold text-slate-700">{workOrderNo}</span>. Please provide a reason.
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isLoading} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={isLoading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes modalFadeIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}} />
    </div>
  );
}

function AssignTechModal({ workOrderNo, onConfirm, onCancel, isLoading }: {
  workOrderNo: string;
  onConfirm: (techId: number) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [selectedTech, setSelectedTech] = useState<number>(IT_OFFICERS[0].id);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" style={{ animation: 'modalFadeIn 0.2s ease-out' }}>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Assign IT Officer</h3>
        <p className="text-sm text-slate-500 mb-4">
          Assigning <span className="font-mono font-bold text-slate-700">{workOrderNo}</span> to an IT Officer.
        </p>
        <select
          value={selectedTech}
          onChange={(e) => setSelectedTech(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        >
          {IT_OFFICERS.map((tech) => (
            <option key={tech.id} value={tech.id}>{tech.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isLoading} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => selectedTech && onConfirm(selectedTech)}
            disabled={isLoading || !selectedTech}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes modalFadeIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}} />
    </div>
  );
}

function ResolveModal({ workOrderNo, onConfirm, onCancel, isLoading }: {
  workOrderNo: string;
  onConfirm: (data: { action_taken: string; resolution_notes?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [actionTaken, setActionTaken] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ animation: 'modalFadeIn 0.2s ease-out' }}>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Resolve Job Order</h3>
        <p className="text-sm text-slate-500 mb-4">
          Resolving <span className="font-mono font-bold text-slate-700">{workOrderNo}</span>. Please provide details.
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Taken <span className="text-red-500">*</span></label>
            <textarea
              autoFocus
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Describe what was done to resolve the issue..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Resolution Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Additional notes, recommendations, or follow-up needed..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isLoading} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => actionTaken.trim() && onConfirm({ action_taken: actionTaken.trim(), resolution_notes: resolutionNotes.trim() || undefined })}
            disabled={isLoading || !actionTaken.trim()}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resolving...' : 'Mark as Resolved'}
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes modalFadeIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, status, icon, color, count, isLoading, isActive, onClick }: {
  label: string; status: string; icon: string; color: string;
  count: number; isLoading: boolean; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-xl p-3 text-left transition-all hover:shadow-sm ${color} ${isActive ? 'ring-2 ring-blue-400 ring-offset-1 shadow-sm' : ''}`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <div className="flex items-end gap-1.5">
        {isLoading ? (
          <div className="h-7 w-8 bg-slate-200 animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{count}</div>
        )}
      </div>
      <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ITJobOrderOverview() {
  const { user } = useAuth();
  const perms = getPermissions(user?.position);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket,  setSelectedTicket]  = useState<Ticket | null>(null);
  const [rejectTarget,    setRejectTarget]    = useState<{ id: number; workOrderNo: string } | null>(null);
  const [assignTarget,    setAssignTarget]    = useState<{ id: number; workOrderNo: string } | null>(null);
  const [resolveTarget,   setResolveTarget]   = useState<{ id: number; workOrderNo: string } | null>(null);

  const [filters, setFilters] = useState<JobOrderFilters>({
    page: 1, limit: 20, sort_by: 'created_at', sort_order: 'DESC',
    ...(perms.isTroubleshooter ? { status: 'assigned' } : {}),
    ...(perms.isApprover ? { status: 'pending_approval', department: perms.approvableDept ?? undefined } : {}),
  });

  const queryFilters: JobOrderFilters = perms.isTroubleshooter
    ? filters
    : perms.isApprover
    ? { ...filters, department: perms.approvableDept ?? undefined }
    : { ...filters, requester_id: String(user?.user_id ?? user?.id) };

  const { data, isLoading, error, refetch } = useJobOrders(queryFilters);
  const { data: myActiveData } = useMyActiveJobOrders();

  // ── Stats: fetch all statuses individually to get accurate counts ──
  // We fetch each status count via the stats endpoint. If your backend
  // returns { queued, assigned, in_progress, resolved, closed } from
  // /job-orders/stats, those counts reflect DB reality regardless of
  // what filter the list is currently on.
  const { data: statsData, isLoading: isLoadingStats } = useJobOrderStats({
    enabled: perms.isTroubleshooter,
    refetchInterval: 30_000,
  });

  // ── Derived assigned count ──
  // The stats API may lag or miscalculate if the backend groups by
  // status differently. We also count from the current full-list query
  // when filtered to 'assigned' as a local cross-check.
  const stats = statsData?.data;

  const myActiveTickets: Ticket[] = React.useMemo(() => {
    if (!myActiveData?.data) return [];
    return myActiveData.data.map(mapJobOrderToTicket);
  }, [myActiveData]);

  const tickets: Ticket[] = React.useMemo(() => {
    if (!data?.data) return [];
    return data.data.map(mapJobOrderToTicket);
  }, [data]);

  const approveMutation  = useApproveJobOrder();
  const rejectMutation   = useRejectJobOrder();
  const assignMutation   = useAssignJobOrder();
  const startMutation    = useStartJobOrder();
  const resolveMutation  = useResolveJobOrder();
  const closeMutation    = useCloseJobOrder();

  const handleApprove = (id: number) => approveMutation.mutate(id);

  const handleRejectConfirm = (reason: string) => {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { id: rejectTarget.id, reason },
      { onSuccess: () => setRejectTarget(null) }
    );
  };

  const handleAssignConfirm = (techId: number) => {
    if (!assignTarget) return;
    assignMutation.mutate(
      { id: assignTarget.id, techId },
      { onSuccess: () => setAssignTarget(null) }
    );
  };

  const handleStart = (id: number) => startMutation.mutate(id);

  const handleResolveConfirm = (resolveData: { action_taken: string; resolution_notes?: string }) => {
    if (!resolveTarget) return;
    resolveMutation.mutate(
      { id: resolveTarget.id, data: resolveData },
      { onSuccess: () => setResolveTarget(null) }
    );
  };

  const handleClose = (id: number) => closeMutation.mutate(id);

  const isMutating =
    approveMutation.isPending || rejectMutation.isPending ||
    assignMutation.isPending  || startMutation.isPending  ||
    resolveMutation.isPending || closeMutation.isPending;

  // ── Loading / Error states ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600 mb-4" />
          <p className="text-slate-600 font-medium">Loading job orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Job Orders</h2>
          <p className="text-slate-600 mb-6">{error.message}</p>
          <button onClick={() => refetch()} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Header config per role ──
  const headerConfig = {
    troubleshooter: { icon: '🛠️', title: 'IT Job Order Management',               badge: 'Troubleshooter',    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    approver:       { icon: '✅', title: `${perms.approvableDept} Dept Approvals`, badge: `${user?.position}`, badgeColor: 'bg-amber-100 text-amber-700 border-amber-200'   },
    requester:      { icon: '🎫', title: 'My Job Orders',                          badge: null,                badgeColor: '' },
  }[perms.role];

  // ✅ Update statCards to just use stats directly
  const statCards = [
    { label: 'Queued',      status: 'queued',      icon: '🔢', color: 'border-indigo-200 bg-indigo-50',   count: stats?.queued      ?? 0 },
    { label: 'Assigned',    status: 'assigned',    icon: '👤', color: 'border-purple-200 bg-purple-50',   count: stats?.assigned     ?? 0 },
    { label: 'In Progress', status: 'in_progress', icon: '🔧', color: 'border-sky-200 bg-sky-50',         count: stats?.in_progress  ?? 0 },
    { label: 'Resolved',    status: 'resolved',    icon: '✅', color: 'border-emerald-200 bg-emerald-50', count: stats?.resolved     ?? 0 },
    { label: 'Closed',      status: 'closed',      icon: '🎉', color: 'border-slate-200 bg-slate-50',     count: stats?.closed       ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">

        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{headerConfig.icon} {headerConfig.title}</h1>
              {headerConfig.badge && (
                <span className={`px-2.5 py-0.5 border rounded-full text-xs font-bold ${headerConfig.badgeColor}`}>
                  {headerConfig.badge}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">
              {perms.isTroubleshooter
                ? `${data?.pagination?.total ?? 0} job orders matching current filter`
                : perms.isApprover
                ? `${data?.pagination?.total ?? 0} pending approval in ${perms.approvableDept}`
                : `${data?.pagination?.total ?? 0} of your submitted job orders`}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-600/25 transition-all flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Job Order
          </button>
        </div>

        {/* ── Troubleshooter stat cards ── */}
        {perms.isTroubleshooter && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {statCards.map(({ label, status, icon, color, count }) => (
              <StatCard
                key={status}
                label={label}
                status={status}
                icon={icon}
                color={color}
                count={count}
                isLoading={isLoadingStats}
                isActive={filters.status === status}
                onClick={() => setFilters((f) => ({ ...f, status, page: 1 }))}
              />
            ))}
          </div>
        )}

        {/* ── Approver banner ── */}
        {perms.isApprover && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                Showing pending approvals for <strong>{perms.approvableDept}</strong> department
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                As <strong>{user?.position}</strong>, approve or reject tickets from the floating tracker on the bottom right.
              </p>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5">
          <div className={`grid gap-3 ${perms.isTroubleshooter ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
            {!perms.isApprover && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {perms.isRequester && <option value="pending_approval">Pending Approval</option>}
                  <option value="approved">Approved</option>
                  <option value="queued">Queued</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  {perms.isRequester && <option value="rejected">Rejected</option>}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined, page: 1 }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
            {perms.isTroubleshooter && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
                <input
                  type="text"
                  placeholder="e.g., Program, Follow Up"
                  value={filters.department || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value || undefined, page: 1 }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Search</label>
              <input
                type="text"
                placeholder="Title, description, order no..."
                value={filters.search || ''}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined, page: 1 }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  page: 1, limit: 20, sort_by: 'created_at', sort_order: 'DESC',
                  ...(perms.isTroubleshooter ? { status: 'assigned' } : {}),
                  ...(perms.isApprover ? { status: 'pending_approval', department: perms.approvableDept ?? undefined } : {}),
                })}
                className="w-full px-3 py-2 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ── Ticket list ── */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-14 text-center">
            <div className="text-6xl mb-4">{perms.isApprover ? '✅' : '📋'}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {perms.isApprover ? 'No Pending Approvals' : 'No Job Orders Found'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              {perms.isApprover
                ? `All ${perms.approvableDept} department tickets are up to date.`
                : filters.status || filters.priority || filters.search || filters.department
                ? 'No job orders match your current filters.'
                : perms.isTroubleshooter
                ? 'No job orders in this status.'
                : "You haven't submitted any job orders yet."}
            </p>
            {!perms.isApprover && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                Create First Job Order
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  perms={perms}
                  onCardClick={(t) => setSelectedTicket(t)}
                  onApprove={handleApprove}
                  onReject={(id, workOrderNo) => setRejectTarget({ id, workOrderNo })}
                  onAssign={(id, workOrderNo) => setAssignTarget({ id, workOrderNo })}
                  onStart={handleStart}
                  onResolve={(id, workOrderNo) => setResolveTarget({ id, workOrderNo })}
                  onClose={handleClose}
                  isLoading={isMutating}
                />
              ))}
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                  disabled={filters.page === 1}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <div className="px-5 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-blue-700">
                  {filters.page} / {data.pagination.pages}
                </div>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.min(data.pagination.pages, (f.page || 1) + 1) }))}
                  disabled={filters.page === data.pagination.pages}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating tracker — requesters only ── */}
      {perms.isRequester && (
        <FloatingJobOrderTracker
          activeTickets={myActiveTickets}
          onViewAll={() => setFilters({ 
            page: 1, limit: 20, sort_by: 'created_at', sort_order: 'DESC'
            // ✅ No status filter = shows ALL including rejected
          })}
          onCreateNew={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* ── Modals ── */}
      <CreateTicketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Ticket detail modal — opened by clicking any card */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {rejectTarget && (
        <RejectModal
          workOrderNo={rejectTarget.workOrderNo}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          isLoading={rejectMutation.isPending}
        />
      )}

      {assignTarget && (
        <AssignTechModal
          workOrderNo={assignTarget.workOrderNo}
          onConfirm={handleAssignConfirm}
          onCancel={() => setAssignTarget(null)}
          isLoading={assignMutation.isPending}
        />
      )}

      {resolveTarget && (
        <ResolveModal
          workOrderNo={resolveTarget.workOrderNo}
          onConfirm={handleResolveConfirm}
          onCancel={() => setResolveTarget(null)}
          isLoading={resolveMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  perms,
  onCardClick,
  onApprove,
  onReject,
  onAssign,
  onStart,
  onResolve,
  onClose,
  isLoading,
}: {
  ticket: Ticket;
  perms: ReturnType<typeof getPermissions>;
  onCardClick: (ticket: Ticket) => void;
  onApprove: (id: number) => void;
  onReject:  (id: number, workOrderNo: string) => void;
  onAssign:  (id: number, workOrderNo: string) => void;
  onStart:   (id: number) => void;
  onResolve: (id: number, workOrderNo: string) => void;
  onClose:   (id: number) => void;
  isLoading: boolean;
}) {
  const numericId = ticket.rawId;

  const canApprove = perms.isTroubleshooter && ticket.status === 'pending_approval';
  const canAssign  = perms.isTroubleshooter && ticket.status === 'queued';
  const canStart   = perms.isTroubleshooter && ticket.status === 'assigned';
  const canResolve = perms.isTroubleshooter && ticket.status === 'in_progress';
  const canClose   = perms.isTroubleshooter && ticket.status === 'resolved';

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
      onClick={() => onCardClick(ticket)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-lg">{ticket.id}</span>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-xs font-semibold">{ticket.category}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
            {ticket.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{ticket.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {(perms.isTroubleshooter || perms.isApprover) && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                  {ticket.requester.avatar}
                </div>
                <span>
                  <span className="text-slate-400">From </span>
                  <span className="font-semibold text-slate-700">{ticket.requester.name}</span>
                </span>
              </div>
            )}

            {ticket.assignee && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                  {ticket.assignee.avatar}
                </div>
                <span>
                  <span className="text-slate-400">Tech: </span>
                  <span className="font-semibold text-slate-700">{ticket.assignee.name}</span>
                </span>
              </div>
            )}

            <RelativeTime date={ticket.createdAt} />

            {/* ── Action buttons — stop propagation so card click doesn't fire ── */}
            {canApprove && (
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove(numericId); }}
                  disabled={isLoading}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  ✔ Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReject(numericId, ticket.id); }}
                  disabled={isLoading}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  ✘ Reject
                </button>
              </div>
            )}
            {canAssign && (
              <button
                onClick={(e) => { e.stopPropagation(); onAssign(numericId, ticket.id); }}
                disabled={isLoading}
                className="ml-auto px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                👤 Assign IT Officer
              </button>
            )}
            {canStart && (
              <button
                onClick={(e) => { e.stopPropagation(); onStart(numericId); }}
                disabled={isLoading}
                className="ml-auto px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                🚀 Start Work
              </button>
            )}
            {canResolve && (
              <button
                onClick={(e) => { e.stopPropagation(); onResolve(numericId, ticket.id); }}
                disabled={isLoading}
                className="ml-auto px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                ✅ Mark Resolved
              </button>
            )}
            {canClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(numericId); }}
                disabled={isLoading}
                className="ml-auto px-3 py-1 bg-slate-600 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                🎉 Close Ticket
              </button>
            )}
          </div>
        </div>

        <svg
          className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}