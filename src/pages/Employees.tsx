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
  
  // New filter states
  const [staffNumberFilter, setStaffNumberFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departmentIdFilter, setDepartmentIdFilter] = useState('');

  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);

  const filters: EmployeeFilters = useMemo(() => {
    return {
      limit: 1000,
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

  const filteredEmployees = useMemo(() => {
    if (!employeesData?.data) return [];
    
    return employeesData.data.filter(employee => {
      // Search term filtering
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        employee.FirstName?.toLowerCase().includes(searchLower) ||
        employee.SurName?.toLowerCase().includes(searchLower) ||
        employee.FullName?.toLowerCase().includes(searchLower) ||
        employee.eMail?.toLowerCase().includes(searchLower);

      // Additional filters
      const matchesStaffNumber = !staffNumberFilter || 
        employee.StaffNumber?.toString().includes(staffNumberFilter);
      
      const matchesDepartment = !departmentFilter || 
        employee.Department?.toLowerCase().includes(departmentFilter.toLowerCase());
      
      const matchesDepartmentId = !departmentIdFilter || 
        employee.DepartmentID?.toString().includes(departmentIdFilter);

      // Role filtering
      const matchesRole = activeFilter === 'all' ||
        (activeFilter === 'employees' && employee.role === 'employee') ||
        (activeFilter === 'supervisors' && employee.role === 'supervisor');

      // Active status filtering
      const matchesStatus = activeFilter === 'all' ||
        (activeFilter === 'active' && employee.isActive) ||
        (activeFilter === 'inactive' && !employee.isActive);

      return matchesSearch && matchesRole && matchesStatus && 
             matchesStaffNumber && matchesDepartment && matchesDepartmentId;
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof Employee];
      const bValue = b[sortBy as keyof Employee];
      
      if (aValue === null || bValue === null) return 0;
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [employeesData?.data, searchTerm, activeFilter, sortBy, sortOrder, 
      staffNumberFilter, departmentFilter, departmentIdFilter]);

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
      toast.error('Fehler beim Aktualisieren des Mitarbeiters');
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
          <div className="flex flex-col gap-4">
            <EmployeeFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              activeFilter={activeFilter}
            />
            
            {/* Additional Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Personal-Nr.
                </label>
                <input
                  type="text"
                  value={staffNumberFilter}
                  onChange={(e) => setStaffNumberFilter(e.target.value)}
                  placeholder="Nach Personal-Nr. filtern..."
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Abteilung
                </label>
                <input
                  type="text"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  placeholder="Nach Abteilung filtern..."
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Abteilungs-ID
                </label>
                <input
                  type="text"
                  value={departmentIdFilter}
                  onChange={(e) => setDepartmentIdFilter(e.target.value)}
                  placeholder="Nach Abteilungs-ID filtern..."
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

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