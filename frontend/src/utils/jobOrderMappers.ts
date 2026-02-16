import type { JobOrder } from '../services/ITServices/itJobOrderService';
import type { Ticket, TicketStatus, TicketPriority } from '../pages/it-job-order/components/types';

/**
 * Map backend JobOrder status to frontend Ticket status
 * ✅ FIX: was collapsing all statuses to 'open' — now passes through correctly
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
 * Convert JobOrder to Ticket for UI display
 * ✅ FIX: rawId now stores the real database numeric ID for API calls
 */
export function mapJobOrderToTicket(jobOrder: JobOrder): Ticket {
  return {
    id:     jobOrder.work_order_no,   // display only (e.g. JOR-2026-02-001)
    rawId:  jobOrder.id,              // ✅ real DB id — use for approve/reject/assign etc.
    title:       jobOrder.title,
    description: jobOrder.description,
    status:   mapJobOrderStatusToTicketStatus(jobOrder.status),
    priority: mapJobOrderPriorityToTicketPriority(jobOrder.priority),
    assignee: jobOrder.tech_id ? {
      id:     jobOrder.tech_id.toString(),
      name:   jobOrder.tech_name || 'Unknown Tech',
      avatar: jobOrder.tech_name ? jobOrder.tech_name.substring(0, 2).toUpperCase() : 'TT',
    } : undefined,
    requester: {
      id:     jobOrder.requester_id.toString(),
      name:   jobOrder.requester_name || 'Unknown User',
      avatar: jobOrder.requester_name
        ? jobOrder.requester_name.substring(0, 2).toUpperCase()
        : 'UU',
      department: jobOrder.requester_dept,
    },
    category:   jobOrder.category || jobOrder.type || 'General',
    createdAt:  new Date(jobOrder.created_at),
    updatedAt:  new Date(jobOrder.updated_at),
    dueDate:    jobOrder.due_date    ? new Date(jobOrder.due_date)    : undefined,
    resolvedAt: jobOrder.resolved_at ? new Date(jobOrder.resolved_at) : undefined,
    tags:       jobOrder.tags ? jobOrder.tags.split(',').map((t) => t.trim()) : [],
  };
}

/**
 * Convert Ticket creation data to JobOrder creation payload
 */
export function mapTicketToJobOrderPayload(ticket: {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  tags?: string[];
  department?: string;
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