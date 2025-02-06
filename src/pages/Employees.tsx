import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Plus, Download, Upload, Filter, Lock, Unlock, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Employee } from '../types';
import EmployeeDetails from '../components/employees/EmployeeDetails';
import AddUserModal from '../components/employees/AddUserModal';
import { RootState, AppDispatch } from '../store';
import { toast } from 'sonner';
import { employees, departments, jobTitles } from '../data/mockData';
import { toggleUserActive } from '../store/slices/authSlice';
import { hasHRPermissions } from '../store/slices/authSlice';

type FilterType = 'all' | 'employees' | 'supervisors' | 'active' | 'inactive';

export default function Employees() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeesList, setEmployeesList] = useState<Employee[]>(employees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSupervisors, setExpandedSupervisors] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'employees', label: 'Nur Mitarbeiter' },
    { value: 'supervisors', label: 'Nur Vorgesetzte' },
    { value: 'active', label: 'Aktive' },
    { value: 'inactive', label: 'Gesperrte' },
  ];

  // Get supervisors and their direct reports
  const getSupervisorsWithEmployees = () => {
    if (!currentEmployee) return [];
    
    const supervisors = employeesList.filter(emp => emp.role === 'supervisor');
    return supervisors.map(supervisor => ({
      ...supervisor,
      directReports: employeesList.filter(emp => emp.supervisorID === supervisor.id)
    }));
  };

  const toggleSupervisor = (e: React.MouseEvent, supervisorId: string) => {
    e.stopPropagation();
    setExpandedSupervisors(prev => 
      prev.includes(supervisorId)
        ? prev.filter(id => id !== supervisorId)
        : [...prev, supervisorId]
    );
  };

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

  const getJobTitle = (jobTitleId: string) => {
    const jobTitle = jobTitles.find(jt => jt.id === jobTitleId);
    return jobTitle ? jobTitle.jobTitle : jobTitleId;
  };

  const renderEmployeeRow = (employee: Employee, isSubRow: boolean = false) => (
    <tr
      key={employee.id}
      className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
        isSubRow ? 'bg-gray-50 dark:bg-gray-800/50' : ''
      }`}
      onClick={() => setSelectedEmployee(employee)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {isSubRow && <div className="w-6" />}
          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="text-sm font-medium">
              {employee.fullName.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {employee.fullName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {employee.eMail}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {departments.find(d => d.id === employee.departmentID)?.department || employee.departmentID}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {getJobTitle(employee.jobTitleID)}
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
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          employee.isTrainer
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }`}>
          {employee.isTrainer ? 'Trainer' : 'Kein Trainer'}
        </span>
        {employee.isTrainer && employee.trainerFor && employee.trainerFor.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {employee.trainerFor.length} Schulung(en)
          </div>
        )}
      </td>
      {(isHRAdmin || currentEmployee?.role === 'supervisor') && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button
            onClick={(e) => handleToggleActive(e, employee.id)}
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

  if (!isHRAdmin && currentEmployee?.role !== 'supervisor') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  const supervisorsWithEmployees = getSupervisorsWithEmployees();

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trainer
                </th>
                {(isHRAdmin || currentEmployee?.role === 'supervisor') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
              {supervisorsWithEmployees.map(supervisor => (
                <>
                  <tr
                    key={supervisor.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedEmployee(supervisor)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button 
                          className="mr-2"
                          onClick={(e) => toggleSupervisor(e, supervisor.id)}
                        >
                          {expandedSupervisors.includes(supervisor.id) ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {supervisor.fullName.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {supervisor.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {supervisor.eMail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {departments.find(d => d.id === supervisor.departmentID)?.department || supervisor.departmentID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getJobTitle(supervisor.jobTitleID)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        !supervisor.isActive
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {!supervisor.isActive ? 'Gesperrt' : 'Aktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supervisor.isTrainer
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {supervisor.isTrainer ? 'Trainer' : 'Kein Trainer'}
                      </span>
                      {supervisor.isTrainer && supervisor.trainerFor && supervisor.trainerFor.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {supervisor.trainerFor.length} Schulung(en)
                        </div>
                      )}
                    </td>
                    {(isHRAdmin || currentEmployee?.role === 'supervisor') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={(e) => handleToggleActive(e, supervisor.id)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          {!supervisor.isActive ? (
                            <Unlock className="h-5 w-5" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                  {expandedSupervisors.includes(supervisor.id) && 
                    supervisor.directReports.map(employee => 
                      renderEmployeeRow(employee, true)
                    )}
                </>
              ))}
            </tbody>
          </table>
        </div>
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