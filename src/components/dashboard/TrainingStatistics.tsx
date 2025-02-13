import { useState } from 'react';
import { PieChart, Building2, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { employees, departments, jobTitles, bookings } from '../../data/mockData';
import StatisticsModal from './StatisticsModal';
import EmployeeDetails from '../employees/EmployeeDetails';

interface Props {
  departmentFilter?: string;
}

export default function TrainingStatistics({ departmentFilter = 'all' }: Props) {
  const [selectedStat, setSelectedStat] = useState<'all' | 'completed' | 'pending' | 'expiring' | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  // Filter employees based on department filter
  const allUsers = employees.filter(u => 
    departmentFilter === 'all' || u.departmentID === departmentFilter
  );

  // Calculate statistics
  const stats = {
    totalEmployees: allUsers.length,
    completedTrainings: 0,
    pendingTrainings: 0,
    expiringQualifications: 0,
  };

  const employeesWithStats = allUsers.map(employee => {
    const completedTrainings = bookings.filter(
      b => b.userId === employee.id && b.status === 'abgeschlossen'
    ).length;
    
    const pendingTrainings = bookings.filter(
      b => b.userId === employee.id && b.status === 'ausstehend'
    ).length;

    const expiringQuals: any[] = []; // This would be calculated based on qualification expiry dates

    stats.completedTrainings += completedTrainings;
    stats.pendingTrainings += pendingTrainings;
    stats.expiringQualifications += expiringQuals.length;

    return {
      ...employee,
      completedTrainings,
      pendingTrainings,
      expiringQualifications: expiringQuals,
    };
  });

  const getFilteredEmployees = () => {
    switch (selectedStat) {
      case 'all':
        return employeesWithStats;
      case 'completed':
        return employeesWithStats.filter(e => e.completedTrainings > 0);
      case 'pending':
        return employeesWithStats.filter(e => e.pendingTrainings > 0);
      case 'expiring':
        return employeesWithStats.filter(e => e.expiringQualifications.length > 0);
      default:
        return [];
    }
  };

  const statCards = [
    { 
      name: 'Mitarbeiter', 
      value: stats.totalEmployees,
      icon: Users,
      type: 'all' as const,
      color: 'text-gray-400',
    },
    { 
      name: 'Abgeschlossen', 
      value: stats.completedTrainings,
      icon: CheckCircle,
      type: 'completed' as const,
      color: 'text-green-500',
    },
    { 
      name: 'Ausstehend', 
      value: stats.pendingTrainings,
      icon: Clock,
      type: 'pending' as const,
      color: 'text-yellow-500',
    },
    { 
      name: 'Ablaufend', 
      value: stats.expiringQualifications,
      icon: AlertTriangle,
      type: 'expiring' as const,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          Schulungsstatistik
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
        >
          {showDetails ? 'Übersicht anzeigen' : 'Details anzeigen'}
        </button>
      </div>

      {/* Stat Cards */}
      {!showDetails ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                onClick={() => setSelectedStat(stat.type)}
                className="bg-gray-50 dark:bg-[#121212] p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <Icon className={`h-5 w-5 mr-2 ${stat.color}`} />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </span>
                </div>
                <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        // Detailed view
        <div className="space-y-6">
          {departments.map(dept => (
            <div key={dept.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 dark:bg-[#121212] p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedDepartments(prev => 
                  prev.includes(dept.id) 
                    ? prev.filter(id => id !== dept.id)
                    : [...prev, dept.id]
                )}
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {dept.department}
                  </h4>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {employeesWithStats.filter(e => e.departmentID === dept.id).length} Mitarbeiter
                </span>
              </div>
              {expandedDepartments.includes(dept.id) && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Mitarbeiter</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Position</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Abgeschlossen</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Ausstehend</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Ablaufend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {employeesWithStats
                          .filter(e => e.departmentID === dept.id)
                          .map(employee => (
                            <tr 
                              key={employee.id}
                              onClick={() => setSelectedEmployee(employee)}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{employee.fullName}</td>
                              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {jobTitles.find(jt => jt.id === employee.jobTitleID)?.jobTitle}
                              </td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  {employee.completedTrainings}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  {employee.pendingTrainings}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  {employee.expiringQualifications.length}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <StatisticsModal
        isOpen={selectedStat !== null}
        onClose={() => setSelectedStat(null)}
        title={
          selectedStat === 'all'
            ? 'Alle Mitarbeiter'
            : selectedStat === 'completed'
            ? 'Abgeschlossene Schulungen'
            : selectedStat === 'pending'
            ? 'Ausstehende Schulungen'
            : 'Ablaufende Qualifikationen'
        }
        employees={getFilteredEmployees()}
        type={selectedStat || 'all'}
      />

      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={() => {}}
          approvals={[]}
          trainings={[]}
          handleApproveTraining={() => {}}
          handleRejectTraining={() => {}}
        />
      )}
    </div>
  );
}