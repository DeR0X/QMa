//Usagen

/* import SearchInput, { useSearch } from '../shared/SearchInput';

// Inside your component:
const { searchTerm, setSearchTerm, filteredItems, setFilteredItems } = useSearch(items);

// In the JSX:
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Suche nach Name, Personalnummer, Email..."
  searchFields={['name', 'personalNumber', 'email']}
  items={items}
  onFilteredItemsChange={setFilteredItems}
/>

// Use filteredItems instead of items in your rendering logic
{filteredItems.map(item => (
  // Render your items
))} */


import { Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface SearchInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (items: T[], searchTerm: string) => T[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  debounceMs?: number;
  searchFields?: (keyof T)[];
  items?: T[];
  onFilteredItemsChange?: (filteredItems: T[]) => void;
}

export default function SearchInput<T extends Record<string, any>>({ 
  value, 
  onChange,
  onSearch,
  placeholder = "Suchen...",
  className = "",
  autoFocus = false,
  debounceMs = 300,
  searchFields,
  items = [],
  onFilteredItemsChange
}: SearchInputProps<T>) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(value);

  // Default search implementation if none provided
  const defaultSearch = useCallback((items: T[], searchTerm: string): T[] => {
    if (!searchTerm.trim() || !searchFields) return items;
    
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      searchFields.some(field => {
        const fieldValue = item[field];
        if (fieldValue == null) return false;
        return String(fieldValue).toLowerCase().includes(searchLower);
      })
    );
  }, [searchFields]);

  // Handle search term changes with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, debounceMs]);

  // Perform search when debounced term changes
  useEffect(() => {
    if (items.length && onFilteredItemsChange) {
      const searchFn = onSearch || defaultSearch;
      const filteredItems = searchFn(items, debouncedSearchTerm);
      onFilteredItemsChange(filteredItems);
    }
  }, [debouncedSearchTerm, items, onSearch, defaultSearch, onFilteredItemsChange]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${className}`}
      />
    </div>
  );
}

// Helper hook for search state management
export function useSearch<T>(initialItems: T[] = []) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(initialItems);

  useEffect(() => {
    setFilteredItems(initialItems);
  }, [initialItems]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    setFilteredItems
  };
}