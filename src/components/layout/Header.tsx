import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, Key, LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../theme-provider';
import { RootState } from '../../store';
import { getInitials } from '../../lib/utils';
import NotificationCenter from '../notifications/NotificationCenter';
import ChangePasswordModal from '../auth/ChangePasswordModal';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { employee } = useSelector((state: RootState) => state.auth);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handlePasswordModalChange = (show: boolean) => {
    setShowPasswordModal(show);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
        onClick={() => dispatch(toggleSidebar())}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Q-Matrix text in center */}
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Q-Matrix
          </h1>
        </div>
        
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
          
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex items-center gap-x-4 text-sm focus:outline-none"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="h-8 w-8 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center"> 
                <span className="text-sm font-medium dark:text-gray-900">
                  {employee?.FullName ? getInitials(employee.FullName) : '??'}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  {employee?.FullName}
                </span>
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-[#181818] shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handlePasswordModalChange(true);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Key className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-300" />
                    Passwort ändern
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-300" />
                    Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => handlePasswordModalChange(false)}
        onSuccess={() => {
          console.log('Passwort erfolgreich geändert!');
          handlePasswordModalChange(false);
        }}
        staffNumber={employee?.StaffNumber}
      />
    </header>
  );
}