import { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  Award,
  Info,
  Target,
  SlidersHorizontal,
  Calendar,
  X
} from 'lucide-react';
import StatisticsModal from './StatisticsModal';
import { useEmployees } from '../../hooks/useEmployees';
import { useEmployeeQualifications } from '../../hooks/useEmployeeQualifications';
import { useJobTitles } from '../../hooks/useJobTitles';
import { useDepartments } from '../../hooks/useDepartments';
import { useQualifications } from '../../hooks/useQualifications';
import { hasHRPermissions } from '../../store/slices/authSlice';
import type { EmployeeFilters } from '../../types';
import EmployeeDetails from '../employees/EmployeeDetails';
import { toast } from 'sonner';
import type { RootState } from '../../store';
import { getLatestQualifications } from '../../lib/utils';

interface Props {
  departmentFilter?: string;
}

interface QualificationDetailsModalProps {
  employeeId: string;
  qualificationId: string;
  onClose: () => void;
  onRenew?: () => void;
}

const QualificationDetailsModal = ({ employeeId, qualificationId, onClose, onRenew }: QualificationDetailsModalProps) => {
  const { data: qualificationsData } = useQualifications();
  const { data: employeeQualificationsData } = useEmployeeQualifications(employeeId);
  const { data: employeesData } = useEmployees();

  const qualification = qualificationsData?.find(q => q.ID?.toString() === qualificationId);
  const employeeQualification = employeeQualificationsData?.find((eq: any) => eq.QualificationID === qualificationId);
  const employee = employeesData?.data.find(e => e.ID.toString() === employeeId);

  if (!qualification || !employeeQualification || !employee) return null;

  // Prioritize isQualifiedUntil if it exists, otherwise fall back to ToQualifyUntil
  const expiryDate = employeeQualification.isQualifiedUntil 
    ? new Date(employeeQualification.isQualifiedUntil)
    : new Date(employeeQualification.ToQualifyUntil);
  const isExpired = expiryDate <= new Date();

  const handleRenew = async () => {
    try {
      // Here you would implement the actual renewal logic
      // For now, we'll just show a success message
      toast.success('Qualifikation erfolgreich erneuert');
      onRenew?.();
      onClose();
    } catch (error) {
      toast.error('Fehler beim Erneuern der Qualifikation');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-lg w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Qualifikationsdetails
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {qualification.Name}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {qualification.Description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Mitarbeiter
              </p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {employee.FullName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Personal-Nr.
              </p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {employee.StaffNumber}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Qualifiziert seit
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {new Date(employeeQualification.QualifiedFrom).toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Gültig bis
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {qualification.ValidityInMonth === 999 ? 'Läuft nie ab' : expiryDate.toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status
              </p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isExpired
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {isExpired ? 'Abgelaufen' : 'Aktiv'}
              </span>
            </div>
          </div>

          {isExpired && (
            <button
              onClick={handleRenew}
              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700"
            >
              Qualifikation erneuern
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ITEMS_PER_PAGE = 1000;

export default function TrainingStatistics({ departmentFilter }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedQualification, setSelectedQualification] = useState<{ employeeId: string; qualificationId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: departmentsData, isLoading: isDepartmentsLoading, error: departmentsError } = useDepartments();
  const { data: allEmployeeQualifications } = useEmployeeQualifications();
  const { data: jobTitlesData } = useJobTitles();
  const { data: qualificationsData } = useQualifications();

  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);
  const isSupervisor = currentEmployee?.role === 'supervisor';

  const [filters, setFilters] = useState({
    hideEmptyDepartments: false,
    hasTrainers: false,
    minEmployees: 0,
    minCompletionRate: 0,
    sortBy: 'name' as 'name' | 'employeeCount' | 'completionRate' | 'trainersCount'
  });

  const [apiFilters] = useState<EmployeeFilters>({
    department: departmentFilter,
    page: 1,
    limit: 1000
  });

  const { 
    data: employeesData, 
    isLoading: isEmployeesLoading, 
    error: employeesError 
  } = useEmployees(apiFilters);

  // Filter employees based on supervisor role
  const filteredEmployees = useMemo(() => {
    if (!employeesData?.data || !currentEmployee) return [];
    
    // Use a Set to track unique employee IDs
    const uniqueEmployeeIds = new Set<number>();
    let filtered: typeof employeesData.data = [];

    if (isHRAdmin) {
      filtered = employeesData.data;
    } else if (currentEmployee.isSupervisor === 1) {
      // Show employees where the current user is their supervisor (using StaffNumber), plus the supervisor themselves
      filtered = employeesData.data.filter(emp => 
        emp.SupervisorID?.toString() === currentEmployee.StaffNumber?.toString() ||
        emp.ID.toString() === currentEmployee.ID.toString()
      );
    } else {
      // Regular employees only see themselves
      filtered = employeesData.data.filter(emp => 
        emp.ID.toString() === currentEmployee.ID.toString()
      );
    }

    // Ensure each employee appears only once
    return filtered.filter(emp => {
      if (uniqueEmployeeIds.has(emp.ID)) {
        return false;
      }
      uniqueEmployeeIds.add(emp.ID);
      return true;
    });
  }, [employeesData?.data, isHRAdmin, currentEmployee]);

  // Calculate qualification statistics based on filtered employees
  const qualificationStats = (() => {
    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    // Process all qualifications and count them by their status
    (Array.isArray(allEmployeeQualifications) ? allEmployeeQualifications : [])
      .filter(qual => filteredEmployees.some(emp => emp.ID === qual.EmployeeID))
      .forEach((qual: any) => {
        // Get qualification details to check if it never expires
        const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
        
        // If qualification never expires (999 months), always count as active
        if (qualification?.ValidityInMonth === 999) {
          activeCount++;
          return;
        }
        
        // Prioritize isQualifiedUntil if it exists, otherwise fall back to toQualifyUntil
        const expiryDate = qual.isQualifiedUntil 
          ? new Date(qual.isQualifiedUntil)
          : qual.toQualifyUntil 
            ? new Date(qual.toQualifyUntil)
            : null;
            
        if (!expiryDate) return;
        
        const now = new Date();
        const sixtyDaysFromNow = new Date(now);
        sixtyDaysFromNow.setDate(now.getDate() + 60);

        // Für abgelaufene Qualifikationen: Nur die, die nach 2 Wochen Grace Period abgelaufen sind
        const twoWeeksAfterExpiry = new Date(expiryDate);
        twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
        
        if (twoWeeksAfterExpiry <= now) {
          expiredCount++;
        } else if (expiryDate <= sixtyDaysFromNow) {
          expiringCount++;
        } else {
          activeCount++;
        }
      });

    return {
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount
    };
  })();

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

  const handleQualificationClick = (e: React.MouseEvent, employeeId: string, qualificationId: string) => {
    e.stopPropagation();
    if (isHRAdmin) {
      setSelectedQualification({ employeeId, qualificationId });
    }
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

  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / ITEMS_PER_PAGE);
  const processedQualIds = new Set<string>();

  const statCards = [
    { 
      type: 'all',
      name: currentEmployee?.isSupervisor === 1 ? 'Mein Team' : 'Gesamtmitarbeiter', 
      value: totalEmployees, 
      icon: Users,
      color: 'text-blue-500'
    },
    { 
      type: 'completed',
      name: 'Aktive Qualifikationen', 
      value: qualificationStats.active,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      type: 'expiring',
      name: 'In 2 Monaten ablaufende Qualifikationen',
      value: qualificationStats.expiring,
      icon: Clock,
      color: 'text-yellow-500'
    },
    {
      type: 'pending',
      name: 'Abgelaufene Qualifikationen',
      value: qualificationStats.expired,
      icon: AlertCircle,
      color: 'text-red-500'
    }
  ];

  // Enhanced search function
  const filterEmployees = (employees: any[]) => {
    if (!searchTerm) {
      // Auch ohne Suchbegriff doppelte Einträge entfernen
      const uniqueEmployees = new Map();
      return employees.filter(emp => {
        const key = `${emp.ID}-${emp.StaffNumber}`;
        if (uniqueEmployees.has(key)) {
          return false;
        }
        uniqueEmployees.set(key, emp);
        return true;
      });
    }
    
    const searchLower = searchTerm.toLowerCase();
    const uniqueEmployees = new Map();
    
    return employees.filter(emp => {
      const key = `${emp.ID}-${emp.StaffNumber}`;
      if (uniqueEmployees.has(key)) {
        return false;
      }
      
      const matchesName = emp.FullName?.toLowerCase().includes(searchLower);
      const matchesStaffNumber = emp.StaffNumber?.toString().toLowerCase().includes(searchLower);
      const matchesDepartment = emp.Department?.toLowerCase().includes(searchLower);
      
      if (matchesName || matchesStaffNumber || matchesDepartment) {
        uniqueEmployees.set(key, emp);
        return true;
      }
      return false;
    });
  };

  // Find department by search criteria
  const findRelevantDepartments = () => {
    let relevantDepartments = departmentsData;

    // For supervisors, only show their own department
    if (!isHRAdmin && currentEmployee?.isSupervisor === 1) {
      // Get the supervisor's department from their employee data
      const supervisorDepartment = currentEmployee.Department;
      if (supervisorDepartment) {
        relevantDepartments = departmentsData?.filter(dept => 
          dept.Department.toString() === supervisorDepartment.toString()
        );
      }
    }

    if (!searchTerm) return relevantDepartments;

    const searchLower = searchTerm.toLowerCase();
    const matchingEmployees = filterEmployees(filteredEmployees);
    const relevantDepartmentIds = new Set(matchingEmployees.map(emp => emp.DepartmentID?.toString()));

    const departmentMatches = relevantDepartments?.filter(dept => 
      dept.Department.toLowerCase().includes(searchLower)
    );
    departmentMatches?.forEach(dept => relevantDepartmentIds.add(dept.ID.toString()));

    return relevantDepartments?.filter(dept => relevantDepartmentIds.has(dept.ID.toString()));
  };

  // Prepare department statistics with filtered employees
  const departmentStats = findRelevantDepartments()?.map(dept => {
    const uniqueEmployeeIds = new Set<number>();
    const deptEmployees = filterEmployees(
      filteredEmployees.filter(emp => {
        if (emp.DepartmentID?.toString() !== dept.ID.toString()) return false;
        if (uniqueEmployeeIds.has(emp.ID)) return false;
        uniqueEmployeeIds.add(emp.ID);
        return true;
      })
    );
    
    // Count employees with different qualification statuses
    const activeEmployees = new Set<number>();
    const expiringEmployees = new Set<number>();
    const expiredEmployees = new Set<number>();
    let totalActiveQuals = 0;
    let totalExpiringQuals = 0;
    let totalExpiredQuals = 0;

    deptEmployees.forEach(employee => {
      const employeeQuals = (Array.isArray(allEmployeeQualifications) ? allEmployeeQualifications : [])
        .filter(q => q.EmployeeID === employee.ID);
      let hasActive = false;
      let activeAmount = 0;
      let hasExpiring = false;
      let expiringAmount = 0;
      let hasExpired = false;
      let expiredAmount = 0;

      employeeQuals.forEach(qual => {
        // Get qualification details to check if it never expires
        const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
        
        // If qualification never expires (999 months), always count as active
        if (qualification?.ValidityInMonth === 999) {
          hasActive = true;
          activeAmount++;
          return;
        }
        
        // Prioritize isQualifiedUntil if it exists, otherwise fall back to toQualifyUntil
        const expiryDate = qual.isQualifiedUntil 
          ? new Date(qual.isQualifiedUntil)
          : qual.toQualifyUntil 
            ? new Date(qual.toQualifyUntil)
            : null;
            
        if (!expiryDate) return;
        
        const now = new Date();
        const sixtyDaysFromNow = new Date(now);
        sixtyDaysFromNow.setDate(now.getDate() + 60);
        
        // Für abgelaufene Qualifikationen: Nur die, die nach 2 Wochen Grace Period abgelaufen sind
        const twoWeeksAfterExpiry = new Date(expiryDate);
        twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
        
        if (twoWeeksAfterExpiry <= now) {
          hasExpired = true;
          expiredAmount++;
        } else if (expiryDate <= sixtyDaysFromNow) {
          hasExpiring = true;
          expiringAmount++;
        } else {
          hasActive = true;
          activeAmount++;
        }
      });

      if (hasActive) activeEmployees.add(employee.ID);
      if (hasExpiring) expiringEmployees.add(employee.ID);
      if (hasExpired) expiredEmployees.add(employee.ID);
    
      totalActiveQuals += activeAmount;
      totalExpiringQuals += expiringAmount;
      totalExpiredQuals += expiredAmount;
    });
    return {
      ...dept,
      employeeCount: deptEmployees.length,
      completedTrainings: activeEmployees.size,
      pendingTrainings: expiringEmployees.size,
      expiredQualifications: expiredEmployees.size,
      activeQualificationCount: totalActiveQuals,
      expiringQualificationCount: totalExpiringQuals,
      expiredQualificationCount: totalExpiredQuals,
      completionRate: deptEmployees.length ? 
        Math.round((totalActiveQuals / (totalExpiredQuals + totalExpiringQuals + totalActiveQuals)) * 100) : 0,
      positions: [...new Set(deptEmployees.map(emp => emp.JobTitle).filter(Boolean))]
    };

  }).filter(Boolean) || [];

  // Filter and sort departments
  const filteredDepartments = departmentStats
    .filter((dept): dept is NonNullable<typeof dept> => dept !== null)
    .filter(dept => {
      const meetsFilters = (
        (!filters.hideEmptyDepartments || dept.employeeCount > 0) &&
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
        >
          {showDetails ? 'Qualifikationsansicht anzeigen' : 'Abteilungsansicht anzeigen'}
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
                  className="bg-gray-50 dark:bg-[#121212] p-4 rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-all duration-200"
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
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
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
                            {dept.activeQualificationCount}
                          </span>
                          <span className="text-xs text-gray-500">Aktiv</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-yellow-500 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {dept.expiringQualificationCount}
                          </span>
                          <span className="text-xs text-gray-500">Ablaufend</span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-red-500 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {dept.expiredQualificationCount}
                          </span>
                          <span className="text-xs text-gray-500">Abgelaufen</span>
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
                      </div>

                      {/* Employee Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Mitarbeiter</th>
                
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Position</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Aktiv</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Ablaufend</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Abgelaufen</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filterEmployees(
                              employeesData?.data
                                .filter(e => e.DepartmentID?.toString() === dept.ID.toString())
                                .filter(report => report) || []
                            ).map((employee, index) => {
                              const quals = getLatestQualifications(
                                (Array.isArray(allEmployeeQualifications) ? allEmployeeQualifications : [])
                                  .filter(q => q.EmployeeID === employee.ID)
                              );
                              const qualStats = quals.reduce((stats: any, qual: any) => {
                                // Get qualification details to check if it never expires
                                const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                                
                                // If qualification never expires (999 months), always count as active
                                if (qualification?.ValidityInMonth === 999) {
                                  stats.active++;
                                  return stats;
                                }
                                
                                // Prioritize isQualifiedUntil if it exists, otherwise fall back to toQualifyUntil
                                const expiryDate = qual.isQualifiedUntil 
                                  ? new Date(qual.isQualifiedUntil)
                                  : qual.toQualifyUntil 
                                    ? new Date(qual.toQualifyUntil)
                                    : null;
                                    
                                if (!expiryDate) return stats;
                                
                                const now = new Date();
                                const sixtyDaysFromNow = new Date(now);
                                sixtyDaysFromNow.setDate(now.getDate() + 60); // Exactly 60 days from now
                            
                                // Für abgelaufene Qualifikationen: Nur die, die nach 2 Wochen Grace Period abgelaufen sind
                                const twoWeeksAfterExpiry = new Date(expiryDate);
                                twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
                                
                                if (twoWeeksAfterExpiry <= now) {
                                  stats.expired++;
                                } else if (expiryDate <= sixtyDaysFromNow) {
                                  stats.expiring++;
                                } else {
                                  stats.active++;
                                }
                                return stats;
                              }, { active: 0, expiring: 0, expired: 0 });

                              return (
                                <tr
                                  key={`report-${employee.ID}-${index}`}
                                  onClick={() => setSelectedEmployee(employee)}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer pl-8"
                                >
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="h-10 w-10 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                                        <span className="text-sm font-medium dark:text-gray-900">
                                          {typeof employee.FullName === 'string'
                                            ? employee.FullName.split(' ').map((n : any) => n[0]).join('')
                                            : ''}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                          {employee.FullName}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                          {employee.StaffNumber}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {employee.JobTitle || '-'}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      {qualStats.active}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      {qualStats.expiring}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      {qualStats.expired}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
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
              ? 'Aktive Qualifikationen'
              : selectedStat === 'pending'
              ? 'Abgelaufene Qualifikationen'
              : 'Ablaufende Qualifikationen'
          }
          employees={filteredEmployees}
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

      {selectedQualification && (
        <QualificationDetailsModal
          employeeId={selectedQualification.employeeId}
          qualificationId={selectedQualification.qualificationId}
          onClose={() => setSelectedQualification(null)}
          onRenew={() => {
            // Refresh the data after renewal
            // This will be implemented when the actual renewal endpoint is available
          }}
        />
      )}
    </div>
  );
}