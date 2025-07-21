import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Employee, EmployeeFilters } from '../types';
import EmployeeDetails from '../components/employees/EmployeeDetails';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeFilter from '../components/employees/EmployeeFilters';
import Pagination from '../components/employees/Pagination';
import { RootState } from '../store';
import { toast } from 'sonner';
import { useEmployees, useUpdateEmployee } from '../hooks/useEmployees';
import { hasHRPermissions } from '../store/slices/authSlice';

const ITEMS_PER_PAGE = 10;

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    department: '',
    isActive: true,
    sortBy: 'SurName',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);
  const isSupervisor = currentEmployee?.isSupervisor === 1 && !isHRAdmin;

  // Build filters for API request
  const apiFilters: EmployeeFilters = useMemo(() => ({
    limit: 1000,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    search: searchTerm,
    department: filters.department,
    isActive: filters.isActive
  }), [filters, searchTerm]);

  const { 
    data: employeesData, 
    isLoading, 
    error,
    isFetching 
  } = useEmployees(apiFilters);

  // Get available departments based on permissions
  const availableDepartments = useMemo(() => {
    if (!employeesData?.data) return [];
    
    const deptSet = new Map<number, string>();
    
    // If user is HR admin, show all departments from all employees
    if (isHRAdmin) {
      employeesData.data.forEach(emp => {
        if (emp.DepartmentID && emp.Department) {
          deptSet.set(emp.DepartmentID, emp.Department);
        }
      });
    } else if (isSupervisor) {
      // If user is supervisor, only show departments of their employees
      const supervisorEmployees = employeesData.data.filter(emp => 
        emp.SupervisorID?.toString() === currentEmployee?.StaffNumber?.toString() ||
        emp.ID.toString() === currentEmployee?.ID.toString()
      );
      
      supervisorEmployees.forEach(emp => {
        if (emp.DepartmentID && emp.Department) {
          deptSet.set(emp.DepartmentID, emp.Department);
        }
      });
    }
    
    return Array.from(deptSet.entries()).map(([ID, Department]) => ({ ID, Department }));
  }, [employeesData?.data, isHRAdmin, isSupervisor, currentEmployee]);

  // Client-side filtering and grouping
  const { filteredEmployees, groupedEmployees } = useMemo(() => {
    if (!employeesData?.data) return { filteredEmployees: [], groupedEmployees: {} };
    
    let filtered = employeesData.data;

    // Remove duplicates by creating a Map with unique keys
    const uniqueEmployees = new Map();
    filtered.forEach(emp => {
      const key = `${emp.ID}-${emp.StaffNumber}`;
      if (!uniqueEmployees.has(key)) {
        uniqueEmployees.set(key, emp);
      }
    });
    filtered = Array.from(uniqueEmployees.values());

    // If user is a supervisor, show their direct reports and themselves
    if (isSupervisor) {
      filtered = filtered.filter(emp => 
        emp.SupervisorID?.toString() === currentEmployee?.StaffNumber?.toString() ||
        emp.ID.toString() === currentEmployee?.ID.toString()
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => {
        const fullName = emp.FullName?.toLowerCase() || '';
        const staffNumber = emp.StaffNumber?.toString().toLowerCase() || '';
        const email = emp.eMail?.toLowerCase() || '';
        const department = emp.Department?.toLowerCase() || '';
        const jobTitle = emp.JobTitle?.toLowerCase() || '';
        
        // Check if the employee matches the search term
        return fullName.includes(searchLower) || 
               staffNumber.includes(searchLower) || 
               email.includes(searchLower) || 
               department.includes(searchLower) ||
               jobTitle.includes(searchLower);
      });
    }

    // Filter by department
    if (filters.department) {
      filtered = filtered.filter(emp => 
        emp.DepartmentID?.toString() === filters.department
      );
    }



    // Filter by active status
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(emp => emp.isActive === filters.isActive);
    }

    // Sort employees
    filtered = filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Employee];
      const bValue = b[filters.sortBy as keyof Employee];
      
      if (aValue === null || bValue === null) return 0;
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return { filteredEmployees: filtered, groupedEmployees: { 'all': filtered } };
  }, [employeesData?.data, filters, searchTerm, currentEmployee, isHRAdmin]);

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

  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleUpdateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      await updateEmployee.mutateAsync({ id, data });
      toast.success('Mitarbeiter erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Aktualisieren des Mitarbeiters: ${errorMessage}`);
    }
  };

  if (!isHRAdmin && currentEmployee?.isSupervisor !== 1) {
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
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {isSupervisor ? 'Mein Team' : 'Mitarbeiter'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isSupervisor 
            ? 'Übersicht der Mitarbeiter in Ihrem Team'
            : 'Verwalten Sie alle Mitarbeiter und deren Informationen'
          }
        </p>
      </div>

      <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <EmployeeFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              filters={filters}
              showFilters={showFilters}
              onToggleFilters={setShowFilters}
              isSupervisor={isSupervisor}
              supervisorDepartment={currentEmployee?.Department}
              availableDepartments={availableDepartments}
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 group">
                {paginatedEmployees.map((employee) => (
                  <tr
                    key={`${employee.ID}-${employee.StaffNumber}`}
                    onClick={() => setSelectedEmployee(employee)}
                    className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                          <span className="text-sm font-medium dark:text-gray-900">
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
    </div>
  );
}
