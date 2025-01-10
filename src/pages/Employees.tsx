import { useState, useEffect } from 'react';
import { Search, Plus, Download, Upload, Filter, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import { Employee } from '../types';
import EmployeeDetails from '../components/employees/EmployeeDetails';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { toast } from 'sonner';
import { trainings, bookings, employee } from '../data/mockData';


const mockQualificationHistory = [
  {
    id: '1',
    employeeId: '1',
    qualificationId: '1',
    qualificationName: 'IT Security',
    type: 'granted',
    date: '2023-12-15',
    approvedBy: 'Jane Smith',
  },
  {
    id: '2',
    employeeId: '1',
    qualificationId: '2',
    qualificationName: 'Project Management',
    type: 'expired',
    date: '2024-01-20',
    approvedBy: 'Jane Smith',
  },
];

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>(employee);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  // Filter employees based on supervisor
  const filteredEmployees = employees.filter((employee) =>
    (user?.role === 'supervisor' ? true : employee.id === user?.id) &&
    (employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApproveTraining = (trainingId: string) => {
    toast.success('Schulung genehmigt');
  };

  const handleRejectTraining = (trainingId: string) => {
    toast.error('Schulung abgelehnt');
  };

  const handleToggleLock = (employeeId: string) => {
    setEmployees(employees.map(emp => 
      emp.id === employeeId 
        ? { ...emp, isLocked: !emp.isLocked }
        : emp
    ));
    toast.success(`Mitarbeiter wurde ${
      employees.find(e => e.id === employeeId)?.isLocked 
        ? 'entsperrt' 
        : 'gesperrt'
    }`);

  };

  const handleCompleteTraining = (employeeId: string, trainingId: string) => {
    toast.success('Schulungsabschluss wurde erfolgreich eingetragen');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {user?.role === 'supervisor' ? 'Mitarbeiterverwaltung' : 'Mein Profil'}
        </h1>
        {user?.role === 'supervisor' && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90">
            <Plus className="h-5 w-5 mr-2" />
            Mitarbeiter hinzufügen
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
            {user?.role === 'supervisor' && (
              <div className="flex gap-2">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <Upload className="h-5 w-5 mr-2" />
                  Import
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
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
                {user?.role === 'supervisor' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
                      employee.isLocked
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {employee.isLocked ? 'Gesperrt' : 'Aktiv'}
                    </span>
                  </td>
                  {user?.role === 'supervisor' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleToggleLock(employee.id)}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        {employee.isLocked ? (
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
    </div>
  );
}