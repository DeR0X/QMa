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
  const getAllSubordinates = (supervisorId: string, visited = new Set<string>()): Employee[] => {
    if (visited.has(supervisorId)) {
      return [];
    }
    visited.add(supervisorId);

    const directReports = employees.filter(emp => 
      emp.SupervisorID?.toString() === supervisorId && 
      emp.ID.toString() !== supervisorId
    );

    let allSubordinates = [...directReports];

    // Recursively get subordinates of supervisors
    directReports.forEach(employee => {
      if (employee.role === 'supervisor') {
        const nestedSubordinates = getAllSubordinates(employee.ID.toString(), visited);
        allSubordinates = [...allSubordinates, ...nestedSubordinates];
      }
    });

    return allSubordinates;
  };

  // Filter employees based on current user's role
  const filteredEmployees = (() => {
    if (!currentEmployee) return [];

    if (isHRAdmin) {
      // HR and Admin can see all employees except themselves
      return employees.filter(emp => emp.ID !== currentEmployee.ID);
    }

    if (currentEmployee.role === 'supervisor') {
      // Get all subordinates (direct and indirect)
      const subordinates = getAllSubordinates(currentEmployee.ID.toString());
      // Include the supervisor themselves in the list
      return [currentEmployee, ...subordinates];
    }

    return [];
  })();

  // Group employees by their direct supervisor
  const employeesByManager = filteredEmployees.reduce((acc, employee) => {
    const supervisorId = employee.SupervisorID?.toString() || 'none';
    if (!acc[supervisorId]) {
      acc[supervisorId] = [];
    }
    acc[supervisorId].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);

  // Render an employee row with proper indentation
  const renderEmployeeRow = (employee: Employee, level: number = 0) => (
    <tr
      key={employee.ID}
      onClick={() => onSelectEmployee(employee)}
      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center" style={{ marginLeft: `${level * 20}px` }}>
          {employee.role === 'supervisor' && (
            <button
              onClick={(e) => toggleSupervisor(e, employee.ID.toString())}
              className="mr-2"
            >
              {expandedSupervisors.includes(employee.ID.toString()) ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </button>
          )}
          <div className="h-10 w-10 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
            <span className="text-sm font-medium dark:text-gray-900">
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
  );

  // Recursively render employee hierarchy
  const renderEmployeeHierarchy = (employee: Employee, level: number = 0) => {
    const rows = [renderEmployeeRow(employee, level)];
    
    if (employee.role === 'supervisor' && expandedSupervisors.includes(employee.ID.toString())) {
      const subordinates = employeesByManager[employee.ID.toString()] || [];
      subordinates.forEach(subordinate => {
        rows.push(...renderEmployeeHierarchy(subordinate, level + 1));
      });
    }
    
    return rows;
  };

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
        {filteredEmployees.map(employee => {
          // Only render top-level employees (those without supervisors or whose supervisor isn't in the filtered list)
          if (!employee.SupervisorID || !filteredEmployees.some(e => e.ID === employee.SupervisorID)) {
            return renderEmployeeHierarchy(employee);
          }
          return null;
        })}
      </tbody>
    </table>
  );
}
