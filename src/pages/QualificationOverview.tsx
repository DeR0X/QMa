import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { hasPermission } from '../store/slices/authSlice';
import { useQualifications } from '../hooks/useQualifications';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeQualifications } from '../hooks/useEmployeeQualifications';
import { Search, Users, Award, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';
import EmployeeDetails from '../components/employees/EmployeeDetails';

interface EmployeeWithQualifications {
  employee: any;
  qualifications: Array<{
    qualificationId: string;
    qualificationName: string;
    qualifiedFrom: string;
    isQualifiedUntil: string;
    toQualifyUntil: string;
    status: 'active' | 'expiring' | 'expired' | 'inactive';
    validityDuration: number;
    qualificationType: 'pflicht' | 'position' | 'zusatz';
  }>;
}

export default function QualificationOverview() {
  const [selectedQualification, setSelectedQualification] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [qualificationTypeFilter, setQualificationTypeFilter] = useState<'all' | 'pflicht' | 'position' | 'zusatz'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = currentEmployee ? hasPermission(currentEmployee, 'hr') : false;
  const isSupervisor = currentEmployee?.isSupervisor === 1;
  const isAdmin = hasPermission(currentEmployee, 'admin');
  const canAccess = isHRAdmin || isSupervisor || isAdmin;

  // Fetch data
  const { data: qualifications, isLoading: isLoadingQualifications } = useQualifications();
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({ limit: 1000 });
  const { data: allEmployeeQualifications, isLoading: isLoadingEmployeeQualifications } = useEmployeeQualifications();

  // Filter employees based on permissions
  const filteredEmployees = useMemo(() => {
    if (!employeesData?.data) return [];
    
    let employees = employeesData.data;

    // If user is a supervisor (but not HR admin), show their direct reports and themselves
    if (isSupervisor && !isHRAdmin) {
      employees = employees.filter(emp => 
        emp.SupervisorID?.toString() === currentEmployee?.StaffNumber?.toString() ||
        emp.ID.toString() === currentEmployee?.ID.toString()
      );
    }

    return employees;
  }, [employeesData?.data, isSupervisor, isHRAdmin, currentEmployee]);

  // Combine employee data with their qualifications
  const employeesWithQualifications = useMemo((): EmployeeWithQualifications[] => {
    if (!filteredEmployees || !allEmployeeQualifications || !qualifications) return [];

    return filteredEmployees.map(employee => {
      const employeeQuals = (allEmployeeQualifications as any[] || []).filter((eq: any) => 
        eq.EmployeeID?.toString() === employee.ID?.toString()
      );

      const qualificationDetails = employeeQuals.map((eq: any) => {
        const qualification = (qualifications as any[] || []).find(q => q.ID?.toString() === eq.QualificationID?.toString());
        
        let status: 'active' | 'expiring' | 'expired' | 'inactive' = 'inactive';
        
        // Check if qualification has been completed (has isQualifiedUntil)
        if (eq.isQualifiedUntil) {
          const expiryDate = new Date(eq.isQualifiedUntil);
          const today = new Date();
          const twoMonthsFromNow = new Date();
          twoMonthsFromNow.setMonth(today.getMonth() + 2);
          
          // Add 14 days grace period after expiry
          const gracePeriodDate = new Date(expiryDate);
          gracePeriodDate.setDate(gracePeriodDate.getDate() + 14);

          if (gracePeriodDate < today) {
            status = 'expired';
          } else if (expiryDate < today) {
            status = 'expiring'; // Within 14-day grace period
          } else if (expiryDate <= twoMonthsFromNow) {
            status = 'expiring';
          } else {
            status = 'active';
          }
        } 
        // Check grace period (toQualifyUntil) if qualification hasn't been completed yet
        else if (eq.toQualifyUntil) {
          const gracePeriodDate = new Date(eq.toQualifyUntil);
          const today = new Date();
          const twoMonthsFromNow = new Date();
          twoMonthsFromNow.setMonth(today.getMonth() + 2);
          
          // Add 14 days grace period after toQualifyUntil
          const extendedGracePeriod = new Date(gracePeriodDate);
          extendedGracePeriod.setDate(extendedGracePeriod.getDate() + 14);

          if (extendedGracePeriod < today) {
            status = 'expired';
          } else if (gracePeriodDate < today) {
            status = 'expiring'; // Within 14-day grace period
          } else if (gracePeriodDate <= twoMonthsFromNow) {
            status = 'expiring';
          } else {
            status = 'active';
          }
        }

        // Determine qualification type
        let qualificationType: 'pflicht' | 'position' | 'zusatz' = 'zusatz';
        if (qualification?.Herkunft === 'Pflicht') {
          qualificationType = 'pflicht';
        } else if (qualification?.JobTitle) {
          qualificationType = 'position';
        } else if (qualification?.Herkunft === 'Zusatz') {
          qualificationType = 'zusatz';
        }

        return {
          qualificationId: eq.QualificationID?.toString() || '',
          qualificationName: qualification?.Name || 'Unbekannte Qualifikation',
          qualifiedFrom: eq.qualifiedFrom || '',
          isQualifiedUntil: eq.isQualifiedUntil || '',
          toQualifyUntil: eq.toQualifyUntil || '',
          status,
          validityDuration: qualification?.ValidityInMonth || 0,
          qualificationType
        };
      });

      return {
        employee,
        qualifications: qualificationDetails
      };
    });
  }, [filteredEmployees, allEmployeeQualifications, qualifications]);

  // Apply filters
  const finalFilteredEmployees = useMemo(() => {
    let filtered = employeesWithQualifications;

    // Filter by qualification type FIRST (this affects which qualifications are shown)
    if (qualificationTypeFilter !== 'all') {
      filtered = filtered.map(emp => ({
        ...emp,
        qualifications: emp.qualifications.filter(qual => qual.qualificationType === qualificationTypeFilter)
      })).filter(emp => emp.qualifications.length > 0);
    }

    // Filter by selected qualification
    if (selectedQualification) {
      filtered = filtered.filter(emp => 
        emp.qualifications.some(qual => qual.qualificationId === selectedQualification)
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.employee.FullName?.toLowerCase().includes(searchLower) ||
        emp.employee.StaffNumber?.toString().toLowerCase().includes(searchLower) ||
        emp.employee.Department?.toLowerCase().includes(searchLower) ||
        emp.qualifications.some(qual => 
          qual.qualificationName.toLowerCase().includes(searchLower)
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => 
        emp.qualifications.some(qual => qual.status === statusFilter)
      );
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(emp => 
        emp.employee.Department === departmentFilter
      );
    }

    return filtered;
  }, [employeesWithQualifications, selectedQualification, searchTerm, statusFilter, departmentFilter, qualificationTypeFilter]);

  // Get unique departments for filter based on permissions
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    
    // If user is HR admin or admin, show all departments from all employees
    if (isHRAdmin || isAdmin) {
      employeesData?.data?.forEach(emp => {
        if (emp.Department) deptSet.add(emp.Department);
      });
    } else {
      // If user is supervisor, only show departments of their employees
      filteredEmployees.forEach(emp => {
        if (emp.Department) deptSet.add(emp.Department);
      });
    }
    
    return Array.from(deptSet).sort();
  }, [filteredEmployees, employeesData?.data, isHRAdmin, isAdmin]);

  // Get available qualifications based on permissions
  const availableQualifications = useMemo(() => {
    if (!qualifications) return [];
    
    // If user is HR admin or admin, show all qualifications
    if (isHRAdmin || isAdmin) {
      return qualifications;
    }
    
    // If user is supervisor, only show qualifications that their employees have
    if (isSupervisor) {
      const supervisorEmployeeIds = filteredEmployees.map(emp => emp.ID?.toString()).filter((id): id is string => Boolean(id));
      const supervisorQualificationIds = new Set<string>();
      
      // Get all qualification IDs that the supervisor's employees have
      (allEmployeeQualifications as any[] || [])?.forEach((eq: any) => {
        const employeeId = eq.EmployeeID?.toString();
        const qualificationId = eq.QualificationID?.toString();
        if (employeeId && qualificationId && supervisorEmployeeIds.includes(employeeId)) {
          supervisorQualificationIds.add(qualificationId);
        }
      });
      
      // Return only qualifications that the supervisor's employees have
      return qualifications.filter(qual => {
        const qualId = qual.ID?.toString();
        return qualId && supervisorQualificationIds.has(qualId);
      });
    }
    
    return [];
  }, [qualifications, isHRAdmin, isAdmin, isSupervisor, filteredEmployees, allEmployeeQualifications]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expiring':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string, qualification: any) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'expiring':
        return 'Läuft bald ab';
      case 'expired':
        // Calculate days since expiry (including 14-day grace period)
        const expiryDate = qualification.isQualifiedUntil ? new Date(qualification.isQualifiedUntil) : new Date(qualification.toQualifyUntil);
        const gracePeriodEnd = new Date(expiryDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14);
        const today = new Date();
        const daysSinceExpiry = Math.floor((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
        const dayText = daysSinceExpiry === 1 ? 'Tag' : 'Tagen';
        return `Abgelaufen seit ${daysSinceExpiry} ${dayText} (inkl. 14 Tage Karenz)`;
      default:
        return 'Inaktiv';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
  };

  const handleEmployeeUpdate = async (data: any) => {
    // This function will be called when employee details are updated
    // We can add any specific logic here if needed
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  if (isLoadingQualifications || isLoadingEmployees || isLoadingEmployeeQualifications) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Qualifikationsübersicht
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Übersicht über alle Mitarbeiterqualifikationen
        </p>
      </div>

      {/* Employee Count */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Users className="h-4 w-4" />
        <span>{finalFilteredEmployees.length} Mitarbeiter</span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Qualification Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Qualifikation
            </label>
            <select
              value={selectedQualification}
              onChange={(e) => setSelectedQualification(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
            >
              <option value="">Alle Qualifikationen</option>
              {availableQualifications.map((qual) => (
                <option key={qual.ID} value={qual.ID?.toString()}>
                  {qual.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Alle Status
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusFilter === 'active'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Aktiv
              </button>
              <button
                onClick={() => setStatusFilter('expiring')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusFilter === 'expiring'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Läuft bald ab
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusFilter === 'expired'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Abgelaufen
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusFilter === 'inactive'
                    ? 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                Inaktiv
              </button>
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Abteilung
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
            >
              <option value="">Alle Abteilungen</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Qualification Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Qualifikationstyp
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setQualificationTypeFilter('all')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors ${
                  qualificationTypeFilter === 'all'
                    ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Alle Typen
              </button>
              <button
                onClick={() => setQualificationTypeFilter('pflicht')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  qualificationTypeFilter === 'pflicht'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Pflicht
              </button>
              <button
                onClick={() => setQualificationTypeFilter('position')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  qualificationTypeFilter === 'position'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Position
              </button>
              <button
                onClick={() => setQualificationTypeFilter('zusatz')}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  qualificationTypeFilter === 'zusatz'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Zusatz
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Mitarbeiter oder Qualifikation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedQualification || searchTerm || statusFilter !== 'all' || departmentFilter || qualificationTypeFilter !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSelectedQualification('');
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('');
                setQualificationTypeFilter('all');
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        {finalFilteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#181818]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Qualifikationen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gültig bis
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
                {finalFilteredEmployees.map((empWithQuals) => (
                  <tr key={empWithQuals.employee.ID} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] p-2 rounded-lg transition-colors"
                        onClick={() => handleEmployeeClick(empWithQuals.employee)}
                      >
                        <div className="h-10 w-10 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                          <span className="text-sm font-medium dark:text-gray-900">
                            {empWithQuals.employee.FullName.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {empWithQuals.employee.FullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {empWithQuals.employee.Department} • {empWithQuals.employee.StaffNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        {empWithQuals.qualifications.length > 0 ? (
                          empWithQuals.qualifications.map((qual, index) => (
                            <div key={index} className="flex items-center gap-2 min-h-[24px]">
                              <Award className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {qual.qualificationName}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="min-h-[24px] flex items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Keine Qualifikationen
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        {empWithQuals.qualifications.length > 0 ? (
                          empWithQuals.qualifications.map((qual, index) => (
                            <div key={index} className="flex items-center gap-2 min-h-[24px]">
                              {getStatusIcon(qual.status)}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(qual.status)}`}>
                                {getStatusText(qual.status, qual)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="min-h-[24px] flex items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        {empWithQuals.qualifications.length > 0 ? (
                          empWithQuals.qualifications.map((qual, index) => (
                            <div key={index} className="flex items-center gap-2 min-h-[24px]">
                              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {qual.validityDuration >= 999 ? 'Läuft nie ab' : (
                                  qual.isQualifiedUntil ? formatDate(qual.isQualifiedUntil) : 
                                  qual.toQualifyUntil ? formatDate(qual.toQualifyUntil) : 'Unbegrenzt'
                                )}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="min-h-[24px] flex items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Ergebnisse gefunden
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Versuchen Sie, Ihre Suchkriterien anzupassen.
            </p>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={handleEmployeeUpdate}
          approvals={[]}
          trainings={[]}
          handleApproveTraining={() => {}}
          handleRejectTraining={() => {}}
        />
      )}
    </div>
  );
} 