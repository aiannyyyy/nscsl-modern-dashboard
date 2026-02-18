import React, { useState } from 'react';
import { FloatingJobOrderTracker } from '../pages/it-job-order/components/FloatingJobOrderTracker';
import { FloatingApprovalTracker } from '../pages/it-job-order/components/FloatingApprovalTracker';
import { CreateTicketModal } from '../pages/it-job-order/components/CreateTicketModal';
import type { Ticket } from '../pages/it-job-order/components/types';
import { useNavigate } from 'react-router-dom';
import {
  useMyActiveJobOrders,
  useJobOrders,
  useApproveJobOrder,
  useRejectJobOrder,
} from '../hooks/ITHooks/useJobOrderHooks';
import { mapJobOrderToTicket } from '../utils/jobOrderMappers';
import { useAuth } from '../context/AuthContext';
import { getPermissions } from '../pages/it-job-order/components/permissions';
import type { JobOrderFilters } from '../services/ITServices/itJobOrderService';

export function GlobalJobOrderManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const perms = getPermissions(user?.position);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ── Requesters: their active tickets ──
  const { data: activeJobOrdersData, isLoading: isLoadingActive } = useMyActiveJobOrders();

  // ── Approvers: pending approvals for their dept ──
  const approverFilters: JobOrderFilters = {
    status: 'pending_approval',
    department: perms.approvableDept ?? undefined,
    page: 1,
    limit: 50,
  };
  const { data: approvalData, isLoading: isLoadingApprovals } = useJobOrders(
    approverFilters,
    { enabled: perms.isApprover }
  );

  const approveMutation = useApproveJobOrder();
  const rejectMutation  = useRejectJobOrder();


  const activeTickets: Ticket[] = React.useMemo(() => {
    if (!activeJobOrdersData?.data) return [];
    return activeJobOrdersData.data.map(mapJobOrderToTicket);
  }, [activeJobOrdersData]);

  const pendingApprovals: Ticket[] = React.useMemo(() => {
    if (!approvalData?.data) return [];
    return approvalData.data.map(mapJobOrderToTicket);
  }, [approvalData]);

  // ── Only block render for the data that role actually needs ──
  if (perms.isRequester && isLoadingActive) return null;
  if (perms.isApprover && isLoadingApprovals) return null;

  return (
    <>
      {perms.isRequester && (
        <FloatingJobOrderTracker
          activeTickets={activeTickets}
          onViewAll={() => navigate('/dashboard/it-job-order')}
          onCreateNew={() => setIsCreateModalOpen(true)}
        />
      )}

      {perms.isApprover && (
        <FloatingApprovalTracker
          pendingApprovals={pendingApprovals}
          onViewAll={() => navigate('/dashboard/it-job-order')}
          onApprove={(id) => approveMutation.mutate(id)}
          onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
          isApproving={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}