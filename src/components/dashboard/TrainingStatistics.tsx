import { useState, useEffect } from 'react';
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
  AlertTriangle,
  Award,
  Info,
  Target,
  SlidersHorizontal
} from 'lucide-react';
import StatisticsModal from './StatisticsModal';
import { useEmployees } from '../../hooks/useEmployees';
import { useEmployeeQualifications } from '../../hooks/useEmployeeQualifications';
import { useJobTitles } from '../../hooks/useJobTitles';
import { useDepartments } from '../../hooks/useDepartments';
import type { EmployeeFilters } from '../../types';
import EmployeeDetails from '../employees/EmployeeDetails';

interface Props {
  departmentFilter?: string;
}

const ITEMS_PER_PAGE = 1000;

export default function TrainingStatistics({ departmentFilter }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    hideEmptyDepartments: false,
    hasTrainers: false,
    minEmployees: 0,
    minCompletionRate: 0,
    sortBy: 'name' as 'name' | 'employeeCount' | 'completionRate' | 'trainersCount'
  });

  const [apiFilters] = useState<EmployeeFilters>({
    department: departmentFilter,
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });

  const { 
    data: employeesData, 
    isLoading: isEmployeesLoading, 
    error: employeesError 
  } = useEmployees(apiFilters);

  const { data: departmentsData, isLoading: isDepartmentsLoading, error: departmentsError } = useDepartments();
  const { data: jobTitles = [] } = useJobTitles();
  const { data: allEmployeeQualifications = {} } = useEmployeeQualifications();

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleToggleDepartment = (departmentName: string) => {
    setExpandedDepartments(prev =>
      prev.includes(departmentName)
        ? prev.filter(d => d !== departmentName)
        : [...prev, departmentName]
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isEmployeesLoading || isDepartmentsLoading) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 dark:text-gray-400">Lade Daten...</p>
        </div>
      </div>
    );
  }

  if (employeesError || departmentsError) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-red-500">Fehler beim Laden der Daten</p>
          <p className="text-sm text-red-400">{(employeesError || departmentsError)?.toString()}</p>
        </div>
      </div>
    );
  }

  const totalEmployees = employeesData?.pagination.total || 0;
  const totalPages = employeesData?.pagination.totalPages || 1;

  const completedEmployees = employeesData?.data.filter(employee => {
    const qualifications = allEmployeeQualifications[employee.ID];
    return qualifications && qualifications.length > 0;
  }).length || 0;

  const expiringEmployees = employeesData?.data.filter(employee => {
    const qualifications = allEmployeeQualifications[employee.ID];
    return qualifications?.some((qual: any) => {
      const expiryDate = new Date(qual.ToQualifyUntil);
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
      return expiryDate <= twoMonthsFromNow && expiryDate > new Date();
    });
  }).length || 0;

  const pendingEmployees = totalEmployees - completedEmployees;

  const statCards = [
    { 
      type: 'all',
      name: 'Gesamtmitarbeiter', 
      value: totalEmployees, 
      icon: Users,
      color: 'text-blue-500'
    },
    {
      type: 'completed',
      name: 'Qualifiziert',
      value: completedEmployees,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      type: 'pending',
      name: 'Ausstehend',
      value: pendingEmployees,
      icon: Clock,
      color: 'text-yellow-500'
    },
    {
      type: 'expiring',
      name: 'Ablaufend',
      value: expiringEmployees,
      icon: AlertCircle,
      color: 'text-red-500'
    }
  ];

  // Enhanced search function
  const filterEmployees = (employees: any[]) => {
    if (!searchTerm) return employees;
    
    const searchLower = searchTerm.toLowerCase();
    return employees.filter(emp => {
      const matchesName = emp.FullName?.toLowerCase().includes(searchLower);
      const matchesStaffNumber = emp.StaffNumber?.toString().toLowerCase().includes(searchLower);
      const matchesDepartment = emp.Department?.toLowerCase().includes(searchLower);
      return matchesName || matchesStaffNumber || matchesDepartment;
    });
  };

  // Find department by search criteria
  const findRelevantDepartments = () => {
    if (!searchTerm) return departmentsData;

    const searchLower = searchTerm.toLowerCase();
    const matchingEmployees = filterEmployees(employeesData?.data || []);
    const relevantDepartmentIds = new Set(matchingEmployees.map(emp => emp.DepartmentID?.toString()));

    // If searching by department name, also include direct department matches
    const departmentMatches = departmentsData?.filter(dept => 
      dept.Department.toLowerCase().includes(searchLower)
    );
    departmentMatches?.forEach(dept => relevantDepartmentIds.add(dept.ID.toString()));

    return departmentsData?.filter(dept => relevantDepartmentIds.has(dept.ID.toString()));
  };

  // Prepare department statistics with filtered employees
  const departmentStats = findRelevantDepartments()?.map(dept => {
    const deptEmployees = filterEmployees(
      employeesData?.data.filter(emp => emp.DepartmentID?.toString() === dept.ID.toString()) || []
    );
    
    const completedCount = deptEmployees.filter(emp => {
      const quals = allEmployeeQualifications[emp.ID];
      return quals && quals.length > 0;
    }).length;
    
    return {
      ...dept,
      employeeCount: deptEmployees.length,
      completedTrainings: completedCount,
      pendingTrainings: deptEmployees.length - completedCount,
      completionRate: deptEmployees.length ? Math.round((completedCount / deptEmployees.length) * 100) : 0,
      trainersCount: deptEmployees.filter(emp => emp.isTrainer).length,
      positions: dept.positions || [],
      expiringQualifications: deptEmployees.filter(emp => {
        const quals = allEmployeeQualifications[emp.ID];
        return quals?.some((qual: any) => {
          const expiryDate = new Date(qual.ToQualifyUntil);
          const twoMonthsFromNow = new Date();
          twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
          return expiryDate <= twoMonthsFromNow && expiryDate > new Date();
        });
      }).length
    };
  }).filter(Boolean) || [];

  // Filter and sort departments
  const filteredDepartments = departmentStats
    .filter((dept): dept is NonNullable<typeof dept> => dept !== null)
    .filter(dept => {
      const meetsFilters = (
        (!filters.hideEmptyDepartments || dept.employeeCount > 0) &&
        (!filters.hasTrainers || dept.trainersCount > 0) &&
        dept.employeeCount >= filters.minEmployees &&
        dept.completionRate >= filters.minCompletionRate
      );
      return meetsFilters;
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
          return a.Department.localeCompare(b.Department);
      }
    });

  return (
    <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Suche nach Personal-Nr., Name, Email oder Abteilung..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
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
                <p className="text-sm text-red-400">{departmentsError}</p>
              </div>
            ) : (
              filteredDepartments.map(dept => (
                <div key={`${dept.ID}-${dept.Department}`} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 dark:bg-[#121212] p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => handleToggleDepartment(dept.Department)}
                  >
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {dept.Department}
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
                        {expandedDepartments.includes(dept.Department) ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedDepartments.includes(dept.Department) && (
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
                            {filterEmployees(
                              employeesData?.data
                                .filter(e => e.DepartmentID?.toString() === dept.ID.toString())
                                .filter(report => report) || []
                            ).map((report, index) => (
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
                                          ? report.FullName.split(' ').map((n : any) => n[0]).join('')
                                          : ''}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.FullName}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {report.StaffNumber}
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
                                    {report.expiringQualifications?.length || 0}
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
          employees={employeesData?.data || []}
          type={selectedStat as "all" | "completed" | "pending" | "expiring"}
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

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            Vorherige
          </button>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            Nächste
          </button>
        </div>
      </div>
    </div>
  );
}