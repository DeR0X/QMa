import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  LayoutDashboard, 
  FileText, 
  Settings,
  GraduationCap,
  X,
  Award,
  History as HistoryIcon,
  Star,
  Key,
  Shield,
  Search,
  Briefcase
} from 'lucide-react';
import { RootState } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { hasPermission } from '../../store/slices/authSlice';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import Logo from '../shared/Logo';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'trainings' },
  { name: 'Schulungen', href: '/schulungen', icon: GraduationCap, permission: 'trainings' },
  { name: 'Schulungshistorie', href: '/training-history', icon: HistoryIcon, permission: 'trainings' },
  { name: 'Qualifikationen', href: '/qualifikationen', icon: Award, permission: 'qualifications' },
  { name: 'Qualifikationsübersicht', href: '/qualifikationsuebersicht', icon: Search, permission: 'qualifications_or_supervisor' },
  { name: 'Zusatzfunktionen', href: '/zusatzfunktionen', icon: Star, permission: 'qualifications' },
  { name: 'Mitarbeiter', href: '/mitarbeiter', icon: Users, permission: 'employees' },
  { name: 'Dokumente', href: '/dokumente', icon: FileText, permission: 'documents' },
  { name: 'Verwaltung', href: '/verwaltung', icon: Shield, permission: 'admin' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { employee } = useSelector((state: RootState) => state.auth);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Subscribe to password modal state changes
  useEffect(() => {
    const handlePasswordModalChange = (event: CustomEvent) => {
      setShowPasswordModal(event.detail);
    };

    window.addEventListener('passwordModalChange' as any, handlePasswordModalChange);
    return () => {
      window.removeEventListener('passwordModalChange' as any, handlePasswordModalChange);
    };
  }, []);

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter(item => 
    hasPermission(employee, item.permission)
  );

  return (
    <>
      <div
        onClick={() => dispatch(toggleSidebar())}
        className={cn(
          'fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      />

      <div
        className={cn(
          'fixed inset-y-0 z-40 flex w-72 flex-col bg-white dark:bg-[#121212] lg:z-50',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-300 ease-in-out lg:transition-none',
          showPasswordModal && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <Logo size="md" />
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-gray-100 dark:bg-[#181818] text-primary'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#181818]'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}