import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  PieChart, 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search,
  ChevronDown, 
  ChevronRight,
  Info,
  Calendar,
  Award,
  Target,
  AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';
import { employees, jobTitles, bookings } from '../../data/mockData';
import StatisticsModal from './StatisticsModal';
import EmployeeDetails from '../employees/EmployeeDetails';
import { useEmployees } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import type { EmployeeFilters } from '../../types';

interface Props {
  departmentFilter?: string;
}

interface DepartmentFilters {
  hideEmptyDepartments: boolean;
  minEmployees: number;
  minCompletionRate: number;
  hasTrainers: boolean;
  sortBy: 'name' | 'employeeCount' | 'completionRate' | 'trainersCount';
}

export default function TrainingStatistics({ departmentFilter = 'all' }: Props) {
  const [selectedStat, setSelectedStat] = useState<'all' | 'completed' | 'pending' | 'expiring' | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DepartmentFilters>({
    hideEmptyDepartments: false,
    minEmployees: 0,
    minCompletionRate: 0,
    hasTrainers: false,
    sortBy: 'name'
  });

  // Reset expanded departments when toggling details view
  useEffect(() => {
    if (!showDetails) {
      setExpandedDepartments([]);
    }
  }, [showDetails]);

  // Only fetch departments when showing details
  const { 
    data: departments = [], 
    isLoading: isDepartmentsLoading,
    error: departmentsError,
  } = useDepartments();

  // Fetch employees data
  const apiFilters: EmployeeFilters = {
    page: 1,
    limit: 500,
    sortBy: 'SurName',
    sortOrder: 'asc',
    department: departmentFilter !== 'all' ? departmentFilter : undefined,
  };

  const { 
    data: employeesData, 
    isLoading: isEmployeesLoading, 
    error: employeesError 
  } = useEmployees(apiFilters);

  if (isEmployeesLoading) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 dark:text-gray-400">Lade Mitarbeiter...</p>
        </div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-red-500">Fehler beim Laden der Mitarbeiter</p>
          <p className="text-sm text-red-400">{employeesError.toString()}</p>
        </div>
      </div>
    );
  }

  // Calculate statistics based on database employees
  const stats = {
    totalEmployees: employeesData?.data.length || 0,
    completedTrainings: 0,
    pendingTrainings: 0,
    expiringQualifications: 0,
  };

  const employeesWithStats = (employeesData?.data || employees).map(employee => {
    const completedTrainings = bookings.filter(
      b => b.userId === employee.ID.toString() && b.status === 'abgeschlossen'
    ).length;
    
    const pendingTrainings = bookings.filter(
      b => b.userId === employee.ID.toString() && b.status === 'ausstehend'
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

  // Get department statistics with additional details
  const getDepartmentStats = (dept: any) => {
    // Add debug logging
/*     console.log('Department:', dept);
    console.log('Department ID:', dept.ID); */
    
    const departmentEmployees = employeesWithStats.filter(e => {
      // Handle both string and number comparisons
      return e.DepartmentID === dept.ID || 
             e.DepartmentID?.toString() === dept.ID?.toString();
    });
    
    /* console.log('Found employees for department:', departmentEmployees.length); */
    
    const trainersCount = departmentEmployees.filter(emp => emp.isTrainer).length;
    
    return {
      ...dept,
      name: dept.Department || dept.department, // Handle both property names
      employeeCount: departmentEmployees.length,
      completedTrainings: departmentEmployees.reduce((sum, emp) => sum + emp.completedTrainings, 0),
      pendingTrainings: departmentEmployees.reduce((sum, emp) => sum + emp.pendingTrainings, 0),
      expiringQualifications: departmentEmployees.reduce(
        (sum, emp) => sum + emp.expiringQualifications.length, 
        0
      ),
      positions: dept.positions || [],
      trainersCount,
      completionRate: departmentEmployees.length > 0 
        ? Math.round((departmentEmployees.reduce((sum, emp) => sum + emp.completedTrainings, 0) / 
          (departmentEmployees.reduce((sum, emp) => sum + emp.completedTrainings + emp.pendingTrainings, 0) || 1)) * 100)
        : 0
    };
  };

  // Filter and sort departments
  const filteredDepartments = departments
    .map(getDepartmentStats)
    .filter(dept => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        dept.DepartmentID_Atoss?.toLowerCase().includes(searchLower) ||
        dept.name.toLowerCase().includes(searchLower) ||
        employeesWithStats.some(emp => 
          emp.DepartmentID?.toString() === dept.ID.toString() &&
          (emp.FullName?.toLowerCase().includes(searchLower) ||
           emp.StaffNumber?.toString().includes(searchLower)) // Add staff number search
        );

      const passesEmptyFilter = !filters.hideEmptyDepartments || dept.employeeCount > 0;
      const passesMinEmployees = dept.employeeCount >= filters.minEmployees;
      const passesCompletionRate = dept.completionRate >= filters.minCompletionRate;
      const passesTrainerFilter = !filters.hasTrainers || dept.trainersCount > 0;

      return matchesSearch && 
             passesEmptyFilter && 
             passesMinEmployees && 
             passesCompletionRate && 
             passesTrainerFilter;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'employeeCount':
          return b.employeeCount - a.employeeCount;
        case 'completionRate':
          return b.completionRate - a.completionRate;
        case 'trainersCount':
          return b.trainersCount - a.trainersCount;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleToggleDetails = () => {
    setShowDetails(prev => !prev);
    setSelectedEmployee(null);
    setSelectedStat(null);
  };

  const handleToggleDepartment = (deptName: string) => {
    setExpandedDepartments(prev => 
      prev.includes(deptName)
        ? prev.filter(id => id !== deptName)
        : [...prev, deptName]
    );
  };

  return (
    <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          Schulungsstatistik
        </h3>
        <button
          type="button"
          onClick={handleToggleDetails}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
        >
          {showDetails ? 'Übersicht anzeigen' : 'Details anzeigen'}
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        {/* Stat Cards */}
        {!showDetails && (
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
        )}

        {/* Detailed view */}
        {showDetails && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Suche nach Atoss-ID, Personalnummer, Abteilung oder Mitarbeiter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filter
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.hideEmptyDepartments}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          hideEmptyDepartments: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Leere Abteilungen ausblenden
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.hasTrainers}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          hasTrainers: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Nur Abteilungen mit Trainern
                      </span>
                    </label>

                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Min. Mitarbeiter
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={filters.minEmployees}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          minEmployees: parseInt(e.target.value) || 0
                        }))}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#121212] dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Min. Abschlussrate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.minCompletionRate}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          minCompletionRate: parseInt(e.target.value) || 0
                        }))}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#121212] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Sortierung
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        sortBy: e.target.value as typeof filters.sortBy
                      }))}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#121212] dark:text-white"
                    >
                      <option value="name">Nach Name</option>
                      <option value="employeeCount">Nach Mitarbeiteranzahl</option>
                      <option value="completionRate">Nach Abschlussrate</option>
                      <option value="trainersCount">Nach Traineranzahl</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {isDepartmentsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Lade Abteilungen...</p>
              </div>
            ) : departmentsError ? (
              <div className="text-center py-8">
                <p className="text-red-500">Fehler beim Laden der Abteilungen</p>
                <p className="text-sm text-red-400">{departmentsError.toString()}</p>
              </div>
            ) : (
              filteredDepartments.map(dept => (
                <div key={`${dept.ID}-${dept.name}`} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 dark:bg-[#121212] p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => handleToggleDepartment(dept.name)}
                  >
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {dept.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {dept.DepartmentID_Atoss}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="hidden sm:grid sm:grid-cols-4 gap-4">
                        <div className="text-center">
                          <span className="text-sm text-green-500 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {dept.completedTrainings}
                          </span>
                          <span className="text-xs text-gray-500">Abgeschlossen</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-yellow-500 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {dept.pendingTrainings}
                          </span>
                          <span className="text-xs text-gray-500">Ausstehend</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-red-500 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {dept.expiringQualifications}
                          </span>
                          <span className="text-xs text-gray-500">Ablaufend</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-blue-500 flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {dept.completionRate}%
                          </span>
                          <span className="text-xs text-gray-500">Abschlussrate</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {dept.employeeCount} Mitarbeiter
                        </span>
                        {expandedDepartments.includes(dept.name) ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedDepartments.includes(dept.name) && (
                    <div className="p-4">
                      {/* Department Details */}
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                            <Award className="h-4 w-4 mr-2" />
                            Positionen ({dept.positions.length})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {dept.positions.map((position, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {position}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                            <Info className="h-4 w-4 mr-2" />
                            Statistiken
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Trainer: {dept.trainersCount}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Abschlussrate: {dept.completionRate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aktive Schulungen: {dept.pendingTrainings}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Abgeschlossen: {dept.completedTrainings}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Employee Table */}
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
                              .filter(e => e.DepartmentID?.toString() === dept.ID.toString())
                              .filter(report => report)
                              .map((report, index) => (
                                <tr
                                  key={`report-${report.ID}-${index}`}
                                  onClick={() => setSelectedEmployee(report)}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer pl-8"
                                >
                                  <td className="px-4 py-2 whitespace-nowrap">
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
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {jobTitles.find(jt => jt.id === report.JobTitleID?.toString())?.jobTitle || '-'}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      {report.completedTrainings}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      {report.pendingTrainings}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      {report.expiringQualifications.length}
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
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedStat !== null && (
        <StatisticsModal
          isOpen={true}
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
          type={selectedStat}
        />
      )}

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