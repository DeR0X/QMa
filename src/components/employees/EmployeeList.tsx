import { useState } from 'react';
import { Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import type { Employee } from '../../types';
import { departments, jobTitles, employees as allEmployees } from '../../data/mockData';

interface Props {
  employees: Employee[];
  onSelectEmployee: (employee: Employee) => void;
  onToggleActive: (e: React.MouseEvent, employeeId: string) => void;
  isHRAdmin: boolean;
  currentEmployee: Employee | null;
}

export default function EmployeeList({ 
  employees, 
  onSelectEmployee, 
  onToggleActive,
  isHRAdmin,
  currentEmployee
}: Props) {
  const [expandedSupervisors, setExpandedSupervisors] = useState<string[]>([]);

  const toggleSupervisor = (e: React.MouseEvent, supervisorId: string) => {
    e.stopPropagation();
    setExpandedSupervisors(prev => 
      prev.includes(supervisorId)
        ? prev.filter(id => id !== supervisorId)
        : [...prev, supervisorId]
    );
  };

  const getJobTitle = (jobTitleId: string) => {
    const jobTitle = jobTitles.find(jt => jt.id === jobTitleId);
    return jobTitle ? jobTitle.jobTitle : jobTitleId;
  };

  // Filter supervisors and their direct reports
  const supervisors = employees.filter(emp => emp.role === 'supervisor');
  const getDirectReports = (supervisorId: string) => 
    allEmployees.filter(emp => emp.supervisorID === supervisorId);

  const renderEmployeeRow = (employee: Employee, isSupervisor: boolean = false) => (
    <tr
      key={employee.id}
      onClick={() => onSelectEmployee(employee)}
      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {isSupervisor && (
            <button 
              className="mr-2"
              onClick={(e) => toggleSupervisor(e, employee.id)}
            >
              {expandedSupervisors.includes(employee.id) ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}
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
            onClick={(e) => onToggleActive(e, employee.id)}
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

  return (
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
        {supervisors.map(supervisor => (
          <>
            {renderEmployeeRow(supervisor, true)}
            {expandedSupervisors.includes(supervisor.id) && 
              getDirectReports(supervisor.id).map(employee => 
                renderEmployeeRow(employee)
              )
            }
          </>
        ))}
        {/* Zeige Mitarbeiter ohne Vorgesetzte oder wenn nach Mitarbeitern gefiltert wird */}
        {employees
          .filter(emp => emp.role === 'employee' && (!emp.supervisorID || !supervisors.some(s => s.id === emp.supervisorID)))
          .map(employee => renderEmployeeRow(employee))}
      </tbody>
    </table>
  );
}