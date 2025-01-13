import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Plus, Download, Upload, Filter, Lock, Unlock, ChevronDown, ChevronRight, X } from 'lucide-react';
import { User } from '../types';
import EmployeeDetails from '../components/employees/EmployeeDetails';
import AddUserModal from '../components/employees/AddUserModal';
import { RootState, AppDispatch } from '../store';
import { toast } from 'sonner';
import { trainings, bookings, users } from '../data/mockData';
import { toggleUserActive } from '../store/slices/authSlice';
import { logAction } from '../lib/audit';
import { hasHRPermissions } from '../store/slices/authSlice';

type FilterType = 'all' | 'employees' | 'supervisors' | 'active' | 'inactive';

export default function Employees() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<User[]>(users);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSupervisors, setExpandedSupervisors] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(user);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'employees', label: 'Nur Mitarbeiter' },
    { value: 'supervisors', label: 'Nur Vorgesetzte' },
    { value: 'active', label: 'Aktive' },
    { value: 'inactive', label: 'Gesperrte' },
  ];

  // Get accessible employees based on user role
  const getAccessibleEmployees = () => {
    if (!user) return [];
    
    if (isHRAdmin) {
      return employees.filter(emp => emp.id !== user.id); // HR sees everyone except themselves
    }
    
    if (user.role === 'supervisor') {
      // Supervisors only see their direct reports
      return employees.filter(emp => 
        emp.supervisorId === user.id && emp.id !== user.id
      );
    }
    
    return []; // Regular employees don't see anyone in the employee list
  };

  const filterEmployees = (employeesToFilter: User[]) => {
    return employeesToFilter.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase());

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

  const handleAddUser = (newUser: Omit<User, 'id' | 'isActive' | 'failedLoginAttempts'>) => {
    const user: User = {
      ...newUser,
      id: (employees.length + 1).toString(),
      isActive: true,
      failedLoginAttempts: 0,
    };
    setEmployees([...employees, user]);
    logAction(user.id, 'create_user', 'Neuer Mitarbeiter angelegt', user.id, 'user');
    toast.success('Mitarbeiter erfolgreich hinzugefügt');
  };

  const handleUpdateEmployee = (id: string, data: Partial<User>) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...data } : emp));
    toast.success('Mitarbeiter erfolgreich aktualisiert');
  };

  const handleToggleActive = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const newActiveStatus = !employee.isActive;
      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? { ...emp, isActive: newActiveStatus }
          : emp
      ));
      dispatch(toggleUserActive(employeeId, newActiveStatus));
      logAction(employeeId, 'toggle_user_active', `Mitarbeiter ${newActiveStatus ? 'aktiviert' : 'deaktiviert'}`, employeeId, 'user');
      toast.success(`Mitarbeiter wurde ${newActiveStatus ? 'entsperrt' : 'gesperrt'}`);
    }
  };

  const renderEmployeeRow = (employee: User) => (
    <tr
      key={employee.id}
      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
    >
      <td 
        className="px-6 py-4 whitespace-nowrap"
        onClick={() => setSelectedEmployee(employee)}
      >
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="text-sm font-medium">
              {employee.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {employee.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {employee.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {employee.department}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {employee.position}
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
      {(isHRAdmin || user?.role === 'supervisor') && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button
            onClick={() => handleToggleActive(employee.id)}
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
  );

  // Only allow access if user is a supervisor or HR
  if (!isHRAdmin && user?.role !== 'supervisor') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  const filteredEmployees = filterEmployees(getAccessibleEmployees());

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suche nach Name, Email, Abteilung oder Position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  {filterOptions.find(f => f.value === activeFilter)?.label}
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setActiveFilter(option.value);
                            setShowFilters(false);
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
              {isHRAdmin && (
                <>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Upload className="h-5 w-5 mr-2" />
                    Import
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Download className="h-5 w-5 mr-2" />
                    Export
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mitarbeiter
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
                {(isHRAdmin || user?.role === 'supervisor') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
              {filteredEmployees.map(employee => renderEmployeeRow(employee))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={(data) => handleUpdateEmployee(selectedEmployee.id, data)}
          approvals={bookings
            .filter(b => b.userId === selectedEmployee.id && b.status === 'ausstehend')
            .map(b => ({
              trainingId: b.trainingId,
              date: b.createdAt,
              status: b.status
            }))}
          trainings={trainings}
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