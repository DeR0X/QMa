import React from 'react';
import { useState } from 'react';
import { Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import type { Employee } from '../../types';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';

interface Props {
  onSelectEmployee: (employee: Employee) => void;
  onToggleActive: (e: React.MouseEvent, employeeId: string) => void;
  isHRAdmin: boolean;
  currentEmployee: Employee | null;
}

export default function EmployeeList({  
  onSelectEmployee, 
  onToggleActive,
  isHRAdmin,
  currentEmployee
}: Props) {
  const [expandedSupervisors, setExpandedSupervisors] = useState<string[]>([]);
  const { data: departments } = useDepartments();
  const { data: employeesData } = useEmployees({ limit: 1000 });

  const employees = employeesData?.data || [];

  const toggleSupervisor = (e: React.MouseEvent, supervisorId: string) => {
    e.stopPropagation();
    setExpandedSupervisors(prev => 
      prev.includes(supervisorId)
        ? prev.filter(id => id !== supervisorId)
        : [...prev, supervisorId]
    );
  };

  const getDepartmentName = (departmentId: string) => {
    if (!departments) return 'Laden...';
    const department = departments.find(d => d.ID.toString() === departmentId);
    return department ? department.Department : 'Unbekannte Abteilung';
  };

  // Get all subordinates for a supervisor (including nested supervisors)
  const getAllSubordinates = (supervisorStaffNumber: string, visited = new Set<string>(), level = 0): { employee: Employee, level: number }[] => {
    if (visited.has(supervisorStaffNumber)) {
      return [];
    }
    visited.add(supervisorStaffNumber);

    const directReports = employees.filter(emp => 
      emp.SupervisorID?.toString() === supervisorStaffNumber && 
      emp.StaffNumber !== supervisorStaffNumber &&
      emp.ID !== currentEmployee?.ID
    );

    let subordinates: { employee: Employee, level: number }[] = [];
    for (const employee of directReports) {
      subordinates.push({ employee, level });
      if (employee.role === 'supervisor') {
        const nested = getAllSubordinates(employee.StaffNumber.toString(), visited, level + 1);
        subordinates = [...subordinates, ... nested];
      }
    }

    return subordinates;
  };

  // Filter employees based on current user's role and supervisor status
  const filteredEmployees = (() => {
    if (isHRAdmin) {
      return employees.filter(emp => emp.ID !== currentEmployee?.ID);
    }

    if (currentEmployee?.role === 'supervisor') {
      return getAllSubordinates(currentEmployee.StaffNumber.toString()).map(item => item.employee);
    }

    return [];
  })();

  return (
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
            Abteilung (Atoss-ID)
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
        {getAllSubordinates(currentEmployee?.StaffNumber.toString() || '')
          .map(({ employee, level }) => {
            const department = departments?.find(d => d.ID.toString() === employee.DepartmentID?.toString());
            const isSupervisor = employee.role === 'supervisor';
            const isExpanded = expandedSupervisors.includes(employee.StaffNumber.toString());
            return (
              <React.Fragment key={employee.ID}>
                <tr
                  onClick={() => onSelectEmployee(employee)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
                      {isSupervisor && (
                        <button
                          onClick={(e) => toggleSupervisor(e, employee.StaffNumber.toString())}
                          className="mr-2"
                        >
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>
                      )}
                      <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {typeof employee.FullName === 'string'
                            ? employee.FullName.split(' ').map((n) => n[0]).join('')
                            : ''}
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
                    {department && (
                      <div className="text-xs text-gray-500">ID: {department.DepartmentID_Atoss}</div>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {employee.JobTitle || 'Keine Position'} 
                    </div>
                    {employee.JobTitleID && <div className="text-xs text-gray-500">ID: {employee.JobTitleID}</div>}
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
                  </td>
                  {(isHRAdmin || currentEmployee?.role === 'supervisor') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={(e) => onToggleActive(e, employee.ID.toString())}
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
              </React.Fragment>
            );
          })}
      </tbody>
    </table>
  );
}