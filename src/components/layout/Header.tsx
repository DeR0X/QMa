import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../theme-provider';
import { RootState } from '../../store';
import { getInitials } from '../../lib/utils';
import NotificationCenter from '../notifications/NotificationCenter';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { employee } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
        onClick={() => dispatch(toggleSidebar())}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            onClick={toggleTheme}
          >
            <span className="sr-only">Toggle theme</span>
            {theme === 'dark' ? (
              <Sun className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Moon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>


          <NotificationCenter />
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-x-4 text-sm focus:outline-none text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
              onClick={handleLogout}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center"> 
                  <span className="text-sm font-medium">
                    {employee?.fullName ? getInitials(employee.fullName) : '??'}
                  </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="text-sm font-semibold leading-6 text-gray-900 dark:text-white"
                  aria-hidden="true"
                >
                  {employee?.fullName}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}