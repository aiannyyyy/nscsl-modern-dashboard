import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ConditionalButtonProps {
  action: 'create' | 'update' | 'delete';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showDisabled?: boolean; // If true, show button as disabled instead of hiding
}

/**
 * Button that shows/hides or enables/disables based on user permissions
 * - Admin & Super User: Can do everything
 * - Regular User: Can only create (update/delete buttons hidden or disabled)
 * 
 * Usage:
 * <ConditionalButton action="update" onClick={handleUpdate}>Edit</ConditionalButton>
 * <ConditionalButton action="delete" onClick={handleDelete} showDisabled>Delete</ConditionalButton>
 */
const ConditionalButton: React.FC<ConditionalButtonProps> = ({
  action,
  onClick,
  children,
  className = '',
  disabled = false,
  showDisabled = false,
}) => {
  const { hasPermission } = useAuth();
  const hasAccess = hasPermission(action);

  // If no access and showDisabled is false, hide the button completely
  if (!hasAccess && !showDisabled) {
    return null;
  }

  // If no access and showDisabled is true, show button as disabled
  const isDisabled = !hasAccess || disabled;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={className}
      title={!hasAccess ? 'You do not have permission for this action' : ''}
    >
      {children}
    </button>
  );
};

export default ConditionalButton;