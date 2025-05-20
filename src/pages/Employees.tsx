import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Users, Unlock, Lock } from 'lucide-react';
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
  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);

  // Build filters for API request
  const filters: EmployeeFilters = useMemo(() => {
    return {
      limit: 1000, // Load more records initially
      sortBy,
      sortOrder,
      department: currentEmployee?.role === 'supervisor' ? currentEmployee.DepartmentID?.toString() : undefined,
      search: searchTerm
    };
  }, [sortBy, sortOrder, currentEmployee, searchTerm]);

  const { 
    data: employeesData, 
    isLoading, 
    error,
    isFetching 
  } = useEmployees(filters);

  // Client-side filtering
  const filteredEmployees = useMemo(() => {
    if (!employeesData?.data) return [];
    
    let filtered = employeesData.data;

    // If user is a supervisor, only show their direct reports and supervisors under them
    if (currentEmployee?.role === 'supervisor') {
      const getAllSubordinates = (supervisorId: string): string[] => {
        const directReports = filtered.filter(emp => emp.SupervisorID?.toString() === supervisorId);
        const subordinateIds = directReports.map(emp => emp.ID.toString());
        
        const supervisorSubordinates = directReports
          .filter(emp => emp.role === 'supervisor')
          .flatMap(supervisor => getAllSubordinates(supervisor.ID.toString()));
        
        return [...subordinateIds, ...supervisorSubordinates];
      };

      const subordinateIds = getAllSubordinates(currentEmployee.ID.toString());
      filtered = filtered.filter(emp => 
        emp.ID.toString() === currentEmployee.ID.toString() || 
        subordinateIds.includes(emp.ID.toString())
      );
    }

    // Apply role and status filters
    return filtered.filter(employee => {
      const matchesRole = activeFilter === 'all' ||
        (activeFilter === 'employees' && employee.role === 'employee') ||
        (activeFilter === 'supervisors' && employee.role === 'supervisor');

      const matchesStatus = activeFilter === 'all' ||
        (activeFilter === 'active' && employee.isActive) ||
        (activeFilter === 'inactive' && !employee.isActive);

      return matchesRole && matchesStatus;
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof Employee];
      const bValue = b[sortBy as keyof Employee];
      
      if (aValue === null || bValue === null) return 0;
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [employeesData?.data, activeFilter, sortBy, sortOrder, currentEmployee]);

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
      await updateEmployee.mutateAsync({ id, data });
      toast.success('Mitarbeiter erfolgreich aktualisiert');
    } catch (error) {
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, employeeId: string) => {
    e.stopPropagation();
    try {
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
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredEmployees.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#181818]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Personal-Nr.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Abteilung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  {(isHRAdmin || currentEmployee?.role === 'supervisor') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aktionen
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
                {paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.ID}
                    onClick={() => setSelectedEmployee(employee)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {employee.FullName.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.FullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.eMail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.StaffNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.Department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.JobTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        !employee.isActive
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {!employee.isActive ? 'Gesperrt' : 'Aktiv'}
                      </span>
                    </td>
                    {(isHRAdmin || currentEmployee?.role === 'supervisor') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={(e) => handleToggleActive(e, employee.ID.toString())}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          {!employee.isActive ? (
                            <Unlock className="h-5 w-5" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
