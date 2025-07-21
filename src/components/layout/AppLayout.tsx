import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { logout, refreshSession } from '../../store/slices/authSlice';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import Sidebar from './Sidebar';
import Header from './Header';
import { toast } from 'sonner';

export default function AppLayout() {
  const { isAuthenticated, sessionExpiry, employee } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Initialize permission checking with reduced frequency

  useEffect(() => {
    if (!isAuthenticated || !employee) {
      navigate('/login');
    }
  }, [isAuthenticated, employee, navigate]);

  // Memoize the resetTimer function
  const resetTimer = useCallback(() => {
    dispatch(refreshSession());
  }, [dispatch]);

  // Set up event listeners for permission changes
  useEffect(() => {
    const handlePermissionChanged = (event: CustomEvent) => {
      toast.info(event.detail.message);
    };

    const handlePermissionDenied = (event: CustomEvent) => {
      toast.error(event.detail.message);
    };

    window.addEventListener('permissionChanged', handlePermissionChanged as EventListener);
    window.addEventListener('permissionDenied', handlePermissionDenied as EventListener);

    return () => {
      window.removeEventListener('permissionChanged', handlePermissionChanged as EventListener);
      window.removeEventListener('permissionDenied', handlePermissionDenied as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let inactivityTimer: number;

    const startInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(() => {
        dispatch(logout());
        navigate('/login');
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Initial timer start
    startInactivityTimer();

    // Activity event handler
    const handleActivity = () => {
      resetTimer();
      startInactivityTimer();
    };

    // Monitor user activity
    const activities = ['mousemove', 'keypress', 'click', 'scroll'];
    activities.forEach(activity => {
      window.addEventListener(activity, handleActivity);
    });

    // Session expiry checker
    const checkSession = () => {
      if (sessionExpiry && Date.now() > sessionExpiry) {
        dispatch(logout());
        navigate('/login');
      }
    };

    const sessionCheckInterval = setInterval(checkSession, 60000); // Check every minute

    return () => {
      clearTimeout(inactivityTimer);
      clearInterval(sessionCheckInterval);
      activities.forEach(activity => {
        window.removeEventListener(activity, handleActivity);
      });
    };
  }, [isAuthenticated, sessionExpiry, dispatch, navigate, resetTimer]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}