import type { JobOrder } from '../services/ITServices/itJobOrderService';
import type { Ticket, TicketStatus, TicketPriority } from '../pages/it-job-order/components/types';

/**
 * Map backend JobOrder status to frontend Ticket status
 */
export function mapJobOrderStatusToTicketStatus(status: string): TicketStatus {
  const validStatuses: TicketStatus[] = [
    'pending_approval', 'approved', 'queued', 'assigned',
    'in_progress', 'on_hold', 'resolved', 'closed', 'cancelled', 'rejected',
  ];
  return validStatuses.includes(status as TicketStatus)
    ? (status as TicketStatus)
    : 'pending_approval';
}

/**
 * Map backend priority to frontend priority
 */
export function mapJobOrderPriorityToTicketPriority(priority: string): TicketPriority {
  const priorityMap: Record<string, TicketPriority> = {
    critical: 'critical',
    high:     'high',
    medium:   'medium',
    low:      'low',
  };
  return priorityMap[priority] || 'medium';
}

/**
 * Convert JobOrder to Ticket for UI display.
 *
 * ✅ rawId  — real DB numeric id, used for approve/reject/assign API calls
 * ✅ attachments  — mapped so TicketDetailModal can render them
 * ✅ action_taken / resolution_notes — shown in Resolution Details section
 * ✅ rejection_reason — shown when status === 'rejected'
 * ✅ department — shown in meta grid of detail modal
 */
export function mapJobOrderToTicket(jobOrder: JobOrder): Ticket {
  // Normalise attachments — backend may return them nested under the job order
  const attachments = Array.isArray((jobOrder as any).attachments)
    ? (jobOrder as any).attachments.map((att: any) => ({
        id:          att.id,
        filename:    att.original_filename ?? att.filename ?? att.file_name ?? 'file',
        url:         att.file_url         ?? att.url      ?? '',
        file_size:   att.file_size        ?? att.size     ?? undefined,
        uploaded_at: att.created_at       ?? att.uploaded_at ?? undefined,
      }))
    : [];

  return {
    // ── Identity ──────────────────────────────────────────────────────────
    id:    jobOrder.work_order_no,   // display string e.g. JOR-2026-02-001
    rawId: jobOrder.id,              // real DB number — used in mutations

    // ── Core fields ───────────────────────────────────────────────────────
    title:       jobOrder.title,
    description: jobOrder.description,
    status:      mapJobOrderStatusToTicketStatus(jobOrder.status),
    priority:    mapJobOrderPriorityToTicketPriority(jobOrder.priority),
    category:    jobOrder.category || jobOrder.type || 'General',

    // ── People ────────────────────────────────────────────────────────────
    assignee: jobOrder.tech_id ? {
      id:     jobOrder.tech_id.toString(),
      name:   jobOrder.tech_name   || 'Unknown Tech',
      avatar: (jobOrder.tech_name  || 'TT').substring(0, 2).toUpperCase(),
    } : undefined,

    requester: {
      id:         jobOrder.requester_id.toString(),
      name:       jobOrder.requester_name || 'Unknown User',
      avatar:     (jobOrder.requester_name || 'UU').substring(0, 2).toUpperCase(),
      department: jobOrder.requester_dept,
    },

    // ── Dates ─────────────────────────────────────────────────────────────
    createdAt:  new Date(jobOrder.created_at),
    updatedAt:  new Date(jobOrder.updated_at),
    dueDate:    jobOrder.due_date    ? new Date(jobOrder.due_date)    : undefined,
    resolvedAt: jobOrder.resolved_at ? new Date(jobOrder.resolved_at) : undefined,

    // ── Tags ──────────────────────────────────────────────────────────────
    tags: jobOrder.tags
      ? jobOrder.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],

    // ── Extra fields used by TicketDetailModal ────────────────────────────
    // These are typed as `any` on Ticket via `(ticket as any).x` in the modal.
    // Mapping them here means the modal always has real data to display.
    attachments,
    department:        (jobOrder as any).department         ?? jobOrder.requester_dept ?? undefined,
    action_taken:      (jobOrder as any).action_taken       ?? undefined,
    resolution_notes:  (jobOrder as any).resolution_notes   ?? undefined,
    rejection_reason:  (jobOrder as any).rejection_reason   ?? undefined,
  } as Ticket & {
    attachments:       typeof attachments;
    department?:       string;
    action_taken?:     string;
    resolution_notes?: string;
    rejection_reason?: string;
  };
}

/**
 * Convert Ticket creation data to JobOrder creation payload
 */
export function mapTicketToJobOrderPayload(ticket: {
  title:        string;
  description:  string;
  priority:     TicketPriority;
  category:     string;
  tags?:        string[];
  department?:  string;
}) {
  return {
    title:       ticket.title,
    description: ticket.description,
    type:        ticket.category.toLowerCase(),
    category:    ticket.category,
    priority:    ticket.priority,
    department:  ticket.department || 'IT',
    tags:        ticket.tags?.join(','),
  };
}