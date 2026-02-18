/**
 * Position-based permissions for IT Job Order system
 * Single source of truth — update positions here only
 */

// ─── Position constants ───────────────────────────────────────────────────────
export const POSITIONS = {
  // IT troubleshooters — see all tickets, can assign/start/resolve
  COMPUTER_PROGRAMMER: 'Computer Programmer',
  MIS_OFFICER:         'Mis Officer',

  // Dept approvers — see only their dept's pending tickets, can approve/reject
  PROGRAM_MANAGER:   'Program Manager',    // PDO department
  FOLLOWUP_HEAD:     'Follow Up Head',     // Follow Up department
  LAB_MANAGER:       'Laboratory Manager', // Laboratory department
} as const;

// Dept approver → which department's tickets they can approve
export const APPROVER_DEPT_MAP: Record<string, string> = {
  [POSITIONS.PROGRAM_MANAGER]: 'Program',
  [POSITIONS.FOLLOWUP_HEAD]:   'Follow Up',
  [POSITIONS.LAB_MANAGER]:     'Laboratory',
};

// ─── Role helpers ───────────────────────────────────────────────────a──────────

export type UserRole = 'troubleshooter' | 'approver' | 'requester';

export interface PositionPermissions {
  role:             UserRole;
  isTroubleshooter: boolean;
  isApprover:       boolean;
  isRequester:      boolean;
  /** For approvers: which department they can approve */
  approvableDept:   string | null;
}

export function getPermissions(position?: string | null): PositionPermissions {
  const pos = position?.trim() ?? '';

  const isTroubleshooter =
    pos === POSITIONS.COMPUTER_PROGRAMMER || pos === POSITIONS.MIS_OFFICER;

  const approvableDept = APPROVER_DEPT_MAP[pos] ?? null;
  const isApprover = approvableDept !== null;

  const isRequester = !isTroubleshooter && !isApprover;

  const role: UserRole = isTroubleshooter
    ? 'troubleshooter'
    : isApprover
    ? 'approver'
    : 'requester';

  return { role, isTroubleshooter, isApprover, isRequester, approvableDept };
}