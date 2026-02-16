export type TicketStatus =
  | 'pending_approval'
  | 'approved'
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'resolved'
  | 'closed'
  | 'cancelled'
  | 'rejected';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  department?: string;
  role?: string;
}

export interface Ticket {
  id: string;       // work_order_no e.g. "JOR-2026-02-001" — display only
  rawId: number;    // ✅ real database numeric ID — use this for all API calls
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: User;
  requester: User;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  resolvedAt?: Date;
  tags?: string[];
  attachments?: Attachment[];
  comments?: Comment[];
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  isInternal?: boolean;
}