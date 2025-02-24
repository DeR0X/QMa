import { useState, useEffect } from 'react';
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
  const filters: EmployeeFilters = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sortBy,
    sortOrder,
    search: searchTerm,
    role: activeFilter === 'employees' ? 'employee' : 
          activeFilter === 'supervisors' ? 'supervisor' : undefined,
    isActive: activeFilter === 'active' ? true :
              activeFilter === 'inactive' ? false : undefined,
    department: currentEmployee?.role === 'supervisor' ? currentEmployee.DepartmentID?.toString() : undefined,
  };

  const { 
    data: employeesData, 
    isLoading, 
    error,
    isFetching 
  } = useEmployees(filters);

  const updateEmployee = useUpdateEmployee();

  // Debounce search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

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
              onFilterChange={(value) => {
                setActiveFilter(value as FilterType);
                setCurrentPage(1);
              }}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(field, order) => {
                setSortBy(field);
                setSortOrder(order);
              }}
            />
            <div className="flex gap-2">
              {isHRAdmin && (
                <>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Upload className="h-5 w-5 mr-2" />
                    Import
                  </button>
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
                  filters,
                  currentPage,
                  totalItems: employeesData?.pagination.total,
                  totalPages: employeesData?.pagination.totalPages,
                  employeeCount: employeesData?.data.length,
                  isFetching,
                  error,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        <div className="overflow-x-auto">
          {employeesData?.data && employeesData.data.length > 0 ? (
            <EmployeeList
              employees={employeesData.data}
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
          totalPages={employeesData?.pagination.totalPages || 1}
          totalItems={employeesData?.pagination.total || 0}
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