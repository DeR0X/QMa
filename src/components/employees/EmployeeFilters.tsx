import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

type FilterType = 'all' | 'employees' | 'supervisors' | 'active' | 'inactive';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterType;
  onFilterChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
}

const filterOptions = [
  { value: 'all', label: 'Alle' },
  { value: 'employees', label: 'Nur Mitarbeiter' },
  { value: 'supervisors', label: 'Nur Vorgesetzte' },
  { value: 'active', label: 'Aktive' },
  { value: 'inactive', label: 'Gesperrte' },
];

export default function EmployeeFilters({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  showFilters,
  onToggleFilters
}: Props) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        onSearchChange(localSearchTerm);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [localSearchTerm, onSearchChange, searchTerm]);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Suche nach Name, Email, Abteilung oder Position..."
            value={localSearchTerm}
            autoFocus
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={onToggleFilters}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          {filterOptions.find(f => f.value === activeFilter)?.label}
        </button>
        
        {showFilters && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onFilterChange(option.value);
                    onToggleFilters();
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeFilter === option.value
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}