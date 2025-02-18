import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { logout, refreshSession } from '../../store/slices/authSlice';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const { isAuthenticated, sessionExpiry } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Memoize the resetTimer function
  const resetTimer = useCallback(() => {
    dispatch(refreshSession());
  }, [dispatch]);

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