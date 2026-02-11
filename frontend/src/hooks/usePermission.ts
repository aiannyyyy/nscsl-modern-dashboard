// src/hooks/usePermissions.ts
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Department } from '../context/AuthContext';

interface PermissionConfig {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canView: boolean;
  isReadOnly: boolean;
}

/**
 * Permission hook with support for multiple allowed departments
 * @param targetDepartment - The primary department (or array of departments) that can edit
 * @returns Permission configuration
 * 
 * Examples:
 * - usePermissions('program') → Only program users can edit
 * - usePermissions(['program', 'administrator']) → Program AND Administrator can edit
 */
export const usePermissions = (
  targetDepartment: Department | Department[]
): PermissionConfig => {
  const { user } = useAuth();
  
  const permissions = useMemo(() => {
    if (!user) {
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canView: true,
        isReadOnly: true,
      };
    }

    const userDept = user.department?.toLowerCase();
    
    // ✅ Convert targetDepartment to array for easier checking
    const allowedDepartments = Array.isArray(targetDepartment) 
      ? targetDepartment.map(d => d.toLowerCase())
      : [targetDepartment.toLowerCase()];
    
    console.log('🔍 Permission Check:', {
      userDept,
      allowedDepartments,
      isAllowed: allowedDepartments.includes(userDept)
    });
    
    // ✅ Check if user's department is in the allowed list
    const isAllowedDepartment = allowedDepartments.includes(userDept);
    
    if (isAllowedDepartment) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canView: true,
        isReadOnly: false,
      };
    }
    
    // ✅ Not in allowed departments - read only
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
      canView: true,
      isReadOnly: true,
    };
  }, [user, targetDepartment]);

  return permissions;
};