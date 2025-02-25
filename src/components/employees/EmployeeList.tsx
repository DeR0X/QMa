import React from 'react';
import { useState, useEffect } from 'react';
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

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department ? department.department : 'Unbekannte Abteilung';
  };

  const getJobTitle = (jobTitleId: string) => {
    const jobTitle = jobTitles.find(jt => jt.id === jobTitleId);
    return jobTitle ? jobTitle.jobTitle : 'Keine Position';
  };

  // Filter supervisors and their direct reports
  const supervisors = employees.filter(emp => emp.role === 'supervisor');
  const getDirectReports = (supervisorId: string) => 
    allEmployees.filter(emp => emp.SupervisorID?.toString() === supervisorId);

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
      {employees
      .filter(employee => employee)
      .map((employee) => {
        return (
          <React.Fragment key={employee.ID}>
            <tr
              onClick={() => onSelectEmployee(employee)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {employee.role === 'supervisor' && (
                    <button 
                      className="mr-2"
                      onClick={(e) => toggleSupervisor(e, employee.ID.toString())}
                    >
                      {expandedSupervisors.includes(employee.ID.toString()) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
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
                  {getDepartmentName(employee.DepartmentID?.toString() || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getJobTitle(employee.JobTitleID?.toString() || '')}
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
              {employee.role === 'supervisor' && 
               expandedSupervisors.includes(employee.ID.toString()) && 
               getDirectReports(employee.ID.toString())
               .filter(report => report)
                .map((report, index) => (
                   <tr
                     key={`report-${report.ID}-${index}`}
                     onClick={() => onSelectEmployee(report)}
                     className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer pl-8"
                   >
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                         <span className="text-sm font-medium">
                           {typeof report.FullName === 'string'
                             ? report.FullName.split(' ').map((n) => n[0]).join('')
                             : ''}
                         </span>
                         </div>
                         <div className="ml-4">
                           <div className="text-sm font-medium text-gray-900 dark:text-white">
                             {report.FullName}
                           </div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                       {getDepartmentName(report.DepartmentID?.toString() || '')}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                       {getJobTitle(report.JobTitleID?.toString() || '')}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         !report.isActive
                           ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                           : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                       }`}>
                         {!report.isActive ? 'Gesperrt' : 'Aktiv'}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         report.isTrainer
                           ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                           : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                       }`}>
                         {report.isTrainer ? 'Trainer' : 'Kein Trainer'}
                       </span>
                     </td>
                     {(isHRAdmin || currentEmployee?.role === 'supervisor') && (
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <button
                           onClick={(e) => onToggleActive(e, report.ID.toString())}
                           className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                         >
                           {!report.isActive ? (
                             <Unlock className="h-5 w-5" />
                           ) : (
                             <Lock className="h-5 w-5" />
                           )}
                         </button>
                       </td>
                     )}
                   </tr>
                 ))}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}