import { Search, SlidersHorizontal, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDepartments } from '../../hooks/useDepartments';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange?: (filters: {
    department?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
  filters?: {
    department: string;
    isActive: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  showFilters?: boolean;
  onToggleFilters?: (show: boolean) => void;
  isSupervisor?: boolean;
  supervisorDepartment?: string;
  availableDepartments?: Array<{ ID: number; Department: string }>;
}

export default function EmployeeFilters({
  searchTerm,
  onSearchChange,
  onFilterChange,
  filters: externalFilters,
  showFilters: externalShowFilters,
  onToggleFilters,
  isSupervisor = false,
  supervisorDepartment,
  availableDepartments
}: Props) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showFilters, setShowFilters] = useState(false);

  // Use external showFilters if provided, otherwise use local state
  const currentShowFilters = externalShowFilters !== undefined ? externalShowFilters : showFilters;
  const [filters, setFilters] = useState({
    department: '',
    isActive: true,
    sortBy: 'SurName',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  // Use external filters if provided, otherwise use local state
  const currentFilters = externalFilters || filters;

  // Sync local search term with prop
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);



  const { data: allDepartments } = useDepartments();

  // Use available departments if provided, otherwise use all departments
  const departments = availableDepartments || allDepartments;

  useEffect(() => {
    if (isSupervisor && supervisorDepartment && departments) {
      const dept = departments.find(d => d.Department === supervisorDepartment);
      if (dept && filters.department !== dept.ID.toString()) {
        handleFilterChange('department', dept.ID.toString());
      }
    }
  }, [isSupervisor, supervisorDepartment, departments]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        onSearchChange(localSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchTerm, onSearchChange, searchTerm]);

  const handleFilterChange = (key: keyof typeof currentFilters, value: any) => {
    if (externalFilters) {
      // If external filters are provided, call the parent's onFilterChange
      onFilterChange?.({ [key]: value });
    } else {
      // Otherwise, update local state
      setFilters(prev => {
        const newFilters = { ...prev, [key]: value };
        return newFilters;
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Suche nach Name, Personalnummer, Email, Abteilung oder Position..."
              value={localSearchTerm}
              autoFocus
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <button
          onClick={() => {
            if (onToggleFilters) {
              onToggleFilters(!currentShowFilters);
            } else {
              setShowFilters(!showFilters);
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          Filter
          {currentShowFilters ? (
            <ChevronDown className="h-4 w-4 ml-2" />
          ) : (
            <ChevronRight className="h-4 w-4 ml-2" />
          )}
        </button>
      </div>

      {currentShowFilters && (
        <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Abteilung
              </label>
              <select
                value={currentFilters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#121212] dark:text-white"
              >
                <option value="">Alle Abteilungen</option>
                {departments?.map((dept) => (
                  <option key={dept.ID} value={dept.ID.toString()}>
                    {dept.Department}
                  </option>
                ))}
              </select>
              {isSupervisor && availableDepartments && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Nur Abteilungen Ihrer Mitarbeiter
                </p>
              )}
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={currentFilters.isActive ? 'active' : 'inactive'}
                onChange={(e) => handleFilterChange('isActive', e.target.value === 'active')}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#121212] dark:text-white"
              >
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sortierung
              </label>
              <select
                value={`${currentFilters.sortBy}-${currentFilters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#121212] dark:text-white"
              >
                <option value="SurName-asc">Name (A-Z)</option>
                <option value="SurName-desc">Name (Z-A)</option>
                <option value="StaffNumber-asc">Personalnummer (aufsteigend)</option>
                <option value="StaffNumber-desc">Personalnummer (absteigend)</option>
                <option value="Department-asc">Abteilung (A-Z)</option>
                <option value="Department-desc">Abteilung (Z-A)</option>
              </select>
            </div>
          </div>


        </div>
      )}
    </div>
  );
}
