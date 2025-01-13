import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Plus, Download, Upload, Filter, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import { User } from '../types';
import EmployeeDetails from '../components/employees/EmployeeDetails';
import AddUserModal from '../components/employees/AddUserModal';
import { RootState, AppDispatch } from '../store';
import { toast } from 'sonner';
import { trainings, bookings, users } from '../data/mockData';
import { toggleUserActive } from '../store/slices/authSlice';
import { logAction } from '../lib/audit';
import { hasHRPermissions } from '../store/slices/authSlice';

export default function Employees() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<User[]>(users);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(user);

  // Filter employees based on role and supervisor
  const filteredEmployees = employees.filter((employee) => {
    const hasAccess = 
      isHRAdmin || // HR kann alle sehen
      (user?.role === 'supervisor' && employee.supervisorId === user.id) // Vorgesetzte sehen ihre Mitarbeiter
      //employee.id === user?.id; // Jeder sieht sich selbst

    return hasAccess && (
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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

  const handleUpdateEmployee = (employeeId: string, data: Partial<User>) => {
    if (!user) return;

    const canEdit = isHRAdmin || 
      (user.role === 'supervisor' && employees.find(e => e.id === employeeId)?.supervisorId === user.id);

    if (!canEdit) {
      toast.error('Keine Berechtigung zum Bearbeiten dieses Mitarbeiters');
      return;
    }

    setEmployees(employees.map(emp => 
      emp.id === employeeId 
        ? { ...emp, ...data }
        : emp
    ));

    logAction(employeeId, 'update_user', 'Mitarbeiterdaten aktualisiert', user.id, 'user');
    toast.success('Mitarbeiterdaten erfolgreich aktualisiert');
  };

  const handleToggleActive = (employeeId: string) => {
    if (!user || (!isHRAdmin && user.role !== 'supervisor')) {
      toast.error('Keine Berechtigung zum Sperren/Entsperren von Mitarbeitern');
      return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const newActiveStatus = !employee.isActive;
      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? { ...emp, isActive: newActiveStatus }
          : emp
      ));
      dispatch(toggleUserActive(employeeId, newActiveStatus));
      logAction(employeeId, newActiveStatus ? 'activate_user' : 'deactivate_user', 
        `Mitarbeiter ${newActiveStatus ? 'entsperrt' : 'gesperrt'}`, user.id, 'user');
      toast.success(`Mitarbeiter wurde ${newActiveStatus ? 'entsperrt' : 'gesperrt'}`);
    }
  };

  const handleApproveTraining = (trainingId: string) => {
    // Assuming `userId` can be derived from context or state
    const userId = selectedEmployee?.id; // Example: getting userId from selectedEmployee
    if (!userId) {
      console.error("User ID is not available");
      return;
    }
    console.log(`Approving training ${trainingId} for user ${userId}`);
    // Implement the actual logic here
  };

  const handleRejectTraining = (trainingId: string) => {
    // Assuming `userId` can be derived from context or state
    const userId = selectedEmployee?.id; // Example: getting userId from selectedEmployee
    if (!userId) {
      console.error("User ID is not available");
      return;
    }
    console.log(`Approving training ${trainingId} for user ${userId}`);
    // Implement the actual logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {isHRAdmin ? 'Mitarbeiterverwaltung' : 
           user?.role === 'supervisor' ? 'Meine Mitarbeiter' : 
           'Mein Profil'}
        </h1>
        {(isHRAdmin || user?.role === 'supervisor') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 dark:bg-[#181818]"
          >
            <Plus className="h-5 w-5 mr-2" />
            Mitarbeiter hinzufügen
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 dark:bg-[#181818]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mitarbeiter suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            {(isHRAdmin || user?.role === 'supervisor') && (
              <div className="flex gap-2">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter
                </button>
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
            )}
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
              {filteredEmployees.map((employee) => (
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
          approvals={bookings
            .filter(b => b.userId === selectedEmployee.id && b.status === 'ausstehend')
            .map(b => ({
              trainingId: b.trainingId,
              date: b.createdAt,
              status: b.status
            }))}
          trainings={trainings}
          handleApproveTraining={handleApproveTraining}
          handleRejectTraining={handleRejectTraining}
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