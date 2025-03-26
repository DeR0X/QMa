import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
}

export default function EmployeeFilters({
  searchTerm,
  onSearchChange,
  showFilters = false,
  onToggleFilters,
  activeFilter = '',
  onFilterChange,
}: Props) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        onSearchChange(localSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchTerm, onSearchChange, searchTerm]);

  return (
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
      {showFilters && onToggleFilters && onFilterChange && (
        <div className="relative">
          <button
            type="button"
            onClick={onToggleFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {activeFilter || 'Filter wählen'}
          </button>
        </div>
      )}
    </div>
  );
}
