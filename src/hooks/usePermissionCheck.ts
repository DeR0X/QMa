import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { logout, setAccessRights } from '../store/slices/authSlice';
import { accessRightsApi } from '../services/accessRightsApi';
import { hasPermission } from '../store/slices/authSlice';

export function usePermissionCheck() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employee, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const lastPermissionCheck = useRef<number>(0);
  const permissionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Function to check current permissions
  const checkPermissions = async () => {
    if (!employee || !isAuthenticated) return;

    try {
      const currentTime = Date.now();
      // Only check every 30 seconds to avoid too many API calls
      if (currentTime - lastPermissionCheck.current < 30000) return;
      
      lastPermissionCheck.current = currentTime;

      const currentAccessRights = await accessRightsApi.getEmployeeAccessRights(employee.ID.toString());
      
      // Check if permissions have changed
      const currentRights = currentAccessRights.map(right => right.toLowerCase());
      const hasAdmin = currentRights.includes('admin');
      const hasHR = currentRights.includes('hr');
      
      // Determine current role based on access rights
      let currentRole = 'employee';
      if (hasAdmin) currentRole = 'admin';
      else if (hasHR) currentRole = 'hr';

      // Check if permissions have changed significantly
      const hasPermissionChanged = 
        (hasAdmin && employee.AccessRight !== 'admin') ||
        (hasHR && !hasAdmin && employee.AccessRight !== 'hr') ||
        (!hasHR && !hasAdmin && employee.AccessRight !== 'employee');

      if (hasPermissionChanged) {
        console.log('Permissions changed, updating session...');
        
        // Update access rights in store
        dispatch(setAccessRights(currentAccessRights));
        
        // Show notification to user
        const event = new CustomEvent('permissionChanged', {
          detail: {
            message: 'Ihre Berechtigungen haben sich geändert. Die Anwendung wird aktualisiert.',
            type: 'info'
          }
        });
        window.dispatchEvent(event);
        
        // Force a page refresh to ensure all components update with new permissions
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      
      // If we can't check permissions, it might mean the session is invalid
      // Only logout if we get a 401 or 403 error
      if (error instanceof Error && error.message.includes('401')) {
        dispatch(logout());
        navigate('/login');
      }
    }
  };

  // Start permission checking when component mounts
  useEffect(() => {
    if (isAuthenticated && employee) {
      // Check permissions immediately
      checkPermissions();
      
      // Set up interval for regular permission checks
      permissionCheckInterval.current = setInterval(checkPermissions, 30000); // Check every 30 seconds
      
      // Also check when user becomes active (focus on window)
      const handleFocus = () => {
        checkPermissions();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        if (permissionCheckInterval.current) {
          clearInterval(permissionCheckInterval.current);
        }
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [isAuthenticated, employee]);

  // Function to manually check permissions (can be called from components)
  const manualPermissionCheck = () => {
    lastPermissionCheck.current = 0; // Reset timer to force immediate check
    checkPermissions();
  };

  return {
    manualPermissionCheck,
    checkPermissions
  };
}

// Hook for components that need to check specific permissions
export function usePermissionGuard(requiredPermission: string) {
  const { employee, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && employee) {
      if (!hasPermission(employee, requiredPermission)) {
        // User doesn't have required permission, redirect to dashboard
        navigate('/', { replace: true });
        
        // Show notification
        const event = new CustomEvent('permissionDenied', {
          detail: {
            message: 'Sie haben keine Berechtigung für diese Seite.',
            type: 'error'
          }
        });
        window.dispatchEvent(event);
      }
    }
  }, [isAuthenticated, employee, requiredPermission, navigate]);

  return hasPermission(employee, requiredPermission);
} 