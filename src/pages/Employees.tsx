import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Download, Upload, Bug } from 'lucide-react';
import type { Employee, EmployeeFilters } from '../types';
import EmployeeDetails from '../components/employees/EmployeeDetails';
import AddUserModal from '../components/employees/AddUserModal';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeFilter from '../components/employees/EmployeeFilters';
import Pagination from '../components/employees/Pagination';
import { RootState, AppDispatch } from '../store';
import { toast } from 'sonner';
import { useEmployees, useUpdateEmployee } from '../hooks/useEmployees';
import { toggleUserActive, hasHRPermissions } from '../store/slices/authSlice';

type FilterType = 'all' | 'employees' | 'supervisors' | 'active' | 'inactive';

const ITEMS_PER_PAGE = 10;

// Debug function
const debugLog = (message: string, data?: any) => {
  console.log(`[Employees] ${message}`, data || '');
};

export default function Employees() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('SurName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDebug, setShowDebug] = useState(false);
  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);

  // Build filters for API request
  const filters: EmployeeFilters = useMemo(() => {
    return {
      limit: 1000, // Load more records initially
      sortBy,
      sortOrder,
      department: currentEmployee?.role === 'supervisor' ? currentEmployee.DepartmentID?.toString() : undefined,
    };
  }, [sortBy, sortOrder, currentEmployee]);

  const { 
    data: employeesData, 
    isLoading, 
    error,
    isFetching 
  } = useEmployees(filters);

  // Client-side filtering
  const filteredEmployees = useMemo(() => {
    if (!employeesData?.data) return [];
    
    return employeesData.data.filter(employee => {
      // Search term filtering
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        employee.FirstName?.toLowerCase().includes(searchLower) ||
        employee.SurName?.toLowerCase().includes(searchLower) ||
        employee.FullName?.toLowerCase().includes(searchLower) ||
        employee.eMail?.toLowerCase().includes(searchLower) ||
        employee.Department?.toLowerCase().includes(searchLower) ||
        employee.StaffNumber?.toString().includes(searchLower);

      // Role filtering
      const matchesRole = activeFilter === 'all' ||
        (activeFilter === 'employees' && employee.role === 'employee') ||
        (activeFilter === 'supervisors' && employee.role === 'supervisor');

      // Active status filtering
      const matchesStatus = activeFilter === 'all' ||
        (activeFilter === 'active' && employee.isActive) ||
        (activeFilter === 'inactive' && !employee.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof Employee];
      const bValue = b[sortBy as keyof Employee];
      
      if (aValue === null || bValue === null) return 0;
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [employeesData?.data, searchTerm, activeFilter, sortBy, sortOrder]);

  // Pagination calculation
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  const updateEmployee = useUpdateEmployee();

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleUpdateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      debugLog('Updating employee', { id, data });
      await updateEmployee.mutateAsync({ id, data });
      toast.success('Mitarbeiter erfolgreich aktualisiert');
    } catch (error) {
      debugLog('Error updating employee', error);
      toast.error('Fehler beim Aktualisieren des Mitarbeiters');
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, employeeId: string) => {
    e.stopPropagation();
    try {
      debugLog('Toggling employee active status', employeeId);
      const employee = employeesData?.data.find((emp: Employee) => emp.ID.toString() === employeeId);
      if (employee) {
        const newActiveStatus = !employee.isActive;
        await handleUpdateEmployee(employeeId, { isActive: newActiveStatus });
        dispatch(toggleUserActive(employeeId, newActiveStatus));
        toast.success(`Mitarbeiter wurde ${newActiveStatus ? 'entsperrt' : 'gesperrt'}`);
      }
    } catch (error) {
      toast.error('Fehler beim Ändern des Aktivitätsstatus');
    }
  };

  if (!isHRAdmin && currentEmployee?.role !== 'supervisor') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">Laden...</p>
      </div>
    );
  }

  if (error) {
    debugLog('Error loading employees', error);
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-red-500">Fehler beim Laden der Mitarbeiter</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <EmployeeFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              activeFilter={activeFilter}
            />
            <div className="flex gap-2">
              {isHRAdmin && (
                <>
                  {/* <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Upload className="h-5 w-5 mr-2" />
                    Import
                  </button> */}
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Download className="h-5 w-5 mr-2" />
                    Export
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Bug className="h-5 w-5 mr-2" />
                Debug
              </button>
            </div>
          </div>
        </div>

        {showDebug && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-white dark:bg-gray-900 p-2 rounded">
              {JSON.stringify(
                {
                  totalEmployees: employeesData?.data.length,
                  filteredCount: filteredEmployees.length,
                  paginatedCount: paginatedEmployees.length,
                  currentPage,
                  totalPages,
                  searchTerm,
                  activeFilter,
                  sortBy,
                  sortOrder,
                  isFetching,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        <div className="overflow-x-auto">
          {paginatedEmployees.length > 0 ? (
            <EmployeeList
              employees={paginatedEmployees}
              onSelectEmployee={setSelectedEmployee}
              onToggleActive={handleToggleActive}
              isHRAdmin={isHRAdmin}
              currentEmployee={currentEmployee}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Keine Mitarbeiter gefunden</p>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEmployees.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={(data) => handleUpdateEmployee(selectedEmployee.ID.toString(), data)}
          approvals={[]}
          trainings={[]}
          handleApproveTraining={() => {}}
          handleRejectTraining={() => {}}
        />
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdd={(data) => {
            setShowAddModal(false);
            toast.success('Mitarbeiter erfolgreich hinzugefügt');
          }}
        />
      )}
    </div>
  );
}