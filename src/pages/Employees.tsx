import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Download, Upload } from 'lucide-react';
import type { Employee } from '../types';
import EmployeeDetails from '../components/employees/EmployeeDetails';
import AddUserModal from '../components/employees/AddUserModal';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeFilters from '../components/employees/EmployeeFilters';
import Pagination from '../components/employees/Pagination';
import { RootState, AppDispatch } from '../store';
import { toast } from 'sonner';
import { employees } from '../data/mockData';
import { toggleUserActive } from '../store/slices/authSlice';
import { hasHRPermissions } from '../store/slices/authSlice';

type FilterType = 'all' | 'employees' | 'supervisors' | 'active' | 'inactive';

const ITEMS_PER_PAGE = 10;

export default function Employees() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeesList, setEmployeesList] = useState<Employee[]>(employees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);

  const filterEmployees = (employeesToFilter: Employee[]) => {
    return employeesToFilter.filter(emp => {
      const matchesSearch = 
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.eMail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.departmentID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jobTitleID.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = 
        activeFilter === 'all' ? true :
        activeFilter === 'employees' ? emp.role === 'employee' :
        activeFilter === 'supervisors' ? emp.role === 'supervisor' :
        activeFilter === 'active' ? emp.isActive :
        activeFilter === 'inactive' ? !emp.isActive :
        true;

      return matchesSearch && matchesFilter;
    });
  };

  const filteredEmployees = filterEmployees(employeesList);
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddUser = (newEmployee: Omit<Employee, 'id' | 'isActive'>) => {
    const employee: Employee = {
      ...newEmployee,
      id: (employeesList.length + 1).toString(),
      isActive: true,
    };
    setEmployeesList([...employeesList, employee]);
    toast.success('Mitarbeiter erfolgreich hinzugefügt');
  };

  const handleUpdateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployeesList(employeesList.map(emp => emp.id === id ? { ...emp, ...data } : emp));
    toast.success('Mitarbeiter erfolgreich aktualisiert');
  };

  const handleToggleActive = (e: React.MouseEvent, employeeId: string) => {
    e.stopPropagation();
    const employee = employeesList.find(emp => emp.id === employeeId);
    if (employee) {
      const newActiveStatus = !employee.isActive;
      setEmployeesList(employeesList.map(emp => 
        emp.id === employeeId 
          ? { ...emp, isActive: newActiveStatus }
          : emp
      ));
      dispatch(toggleUserActive(employeeId, newActiveStatus));
      toast.success(`Mitarbeiter wurde ${newActiveStatus ? 'entsperrt' : 'gesperrt'}`);
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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <EmployeeFilters
              searchTerm={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              activeFilter={activeFilter}
              onFilterChange={(value) => {
                setActiveFilter(value as FilterType);
                setCurrentPage(1);
              }}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
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
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <EmployeeList
            employees={paginatedEmployees}
            onSelectEmployee={setSelectedEmployee}
            onToggleActive={handleToggleActive}
            isHRAdmin={isHRAdmin}
            currentEmployee={currentEmployee}
          />
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={(data) => handleUpdateEmployee(selectedEmployee.id, data)}
          approvals={[]}
          trainings={[]}
          handleApproveTraining={() => {}}
          handleRejectTraining={() => {}}
        />
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddUser}
        />
      )}
    </div>
  );
}