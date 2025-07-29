import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Shield, 
  Key, 
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Save,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Eye,
  EyeOff,
  Lock,
  X,
  Briefcase,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';
import { RootState } from '../store';
import { useEmployees } from '../hooks/useEmployees';
import { toast } from 'sonner';

import apiClient from '../services/apiClient';
import EmployeeFilter from '../components/employees/EmployeeFilters';
import Pagination from '../components/employees/Pagination';
import type { Employee, JobTitle } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';



// Component to display current access rights for an employee
function AccessRightsDisplay({ employeeId }: { employeeId: number }) {
  const { data: accessRights, isLoading } = useQuery({
    queryKey: ['employeeAccessRights', employeeId],
    queryFn: async () => {
      try {
        return await apiClient.get(`/employee-access-rights/${employeeId}`);
      } catch (error) {
        return [];
      }
    },
    staleTime: 5000, // Cache for only 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
  });

  if (isLoading) {
    return <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>;
  }

  if (!accessRights || !Array.isArray(accessRights) || accessRights.length === 0) {
    return null;
  }

  const accessRight = accessRights[0];
  
  if (accessRight.AccessRightID === 3) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
        Admin
      </span>
    );
  }
  
  if (accessRight.AccessRightID === 2) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        HR
      </span>
    );
  }

  return null;
}

const ITEMS_PER_PAGE = 15;

export default function UserManagement() {
  const { employee: currentUser } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [searchTermPasswords, setSearchTermPasswords] = useState('');
  const [searchTermRights, setSearchTermRights] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'hr' | null>(null);
  const [activeTab, setActiveTab] = useState<'passwords' | 'rights' | 'jobtitles'>('passwords');
  const [showPassword, setShowPassword] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    isActive: true,
    sortBy: 'SurName',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Job title management states
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [showCreateJobTitleModal, setShowCreateJobTitleModal] = useState(false);
  const [showAssignJobTitleModal, setShowAssignJobTitleModal] = useState(false);
  const [showJobTitleDetailsModal, setShowJobTitleDetailsModal] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);
  const [selectedEmployeeForJobTitle, setSelectedEmployeeForJobTitle] = useState<Employee | null>(null);
  const [jobTitleSearchTerm, setJobTitleSearchTerm] = useState('');
  const [newJobTitle, setNewJobTitle] = useState({
    JobTitle: '',
    Description: ''
  });
  const [employeesWithJobTitle, setEmployeesWithJobTitle] = useState<Employee[]>([]);
  const [allEmployeesForModal, setAllEmployeesForModal] = useState<Employee[]>([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  
  // Check admin access via API call instead of localStorage
  const checkAdminAccess = useCallback(async () => {
    if (!currentUser) {
      setHasAdminAccess(false);
      setIsCheckingAccess(false);
      return;
    }

    try {
      setIsCheckingAccess(true);
      const accessRights = await apiClient.get(`/employee-access-rights/${currentUser.ID}`);
      const hasAdmin = Array.isArray(accessRights) && accessRights.some((right: any) => right.AccessRightID === 3);
      setHasAdminAccess(hasAdmin);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setHasAdminAccess(false);
    } finally {
      setIsCheckingAccess(false);
    }
  }, [currentUser]);

  // Check access when component mounts
  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  const isAdmin = hasAdminAccess === true;

  // Always fetch all employees, filter client-side for better performance
  const { data: employeesData, isLoading: isLoadingEmployees, refetch: refetchEmployees } = useEmployees({
    limit: 1000,
    department: filters.department,
    isActive: filters.isActive,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  });

  // Set up automatic refresh of employee data every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchEmployees();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [refetchEmployees]);

  useEffect(() => {
    if (selectedEmployee) {
      // Fetch current access rights from the database to ensure we have the latest data
      const fetchCurrentAccessRights = async () => {
        try {
          const accessRights = await apiClient.get(`/employee-access-rights/${selectedEmployee.ID}`);
          console.log('Current access rights from API:', accessRights);
          
          // Determine role from the actual database data
          let role: 'admin' | 'hr' | null = null;
          
          if (Array.isArray(accessRights) && accessRights.length > 0) {
            const accessRight = accessRights[0];
            if (accessRight.AccessRightID === 3) {
              role = 'admin';
            } else if (accessRight.AccessRightID === 2) {
              role = 'hr';
            }
          }
          
          setSelectedRole(role);
        } catch (error) {
          console.error('Error fetching current access rights:', error);
          // Fallback to local data
          const accessRightsID = (selectedEmployee as any).AccessRightsID;
          if (accessRightsID) {
            const accessRightId = accessRightsID.toString();
            if (accessRightId === '3') {
              setSelectedRole('admin');
            } else if (accessRightId === '2') {
              setSelectedRole('hr');
            } else {
              setSelectedRole(null);
            }
          } else {
            setSelectedRole(null);
          }
        }
      };
      
      fetchCurrentAccessRights();
    }
  }, [selectedEmployee]);

  // Load job titles
  const loadJobTitles = async () => {
    try {
      const data = await apiClient.get('/job-titles');
      setJobTitles(data as JobTitle[]);
    } catch (error) {
      console.error('Error loading job titles:', error);
      toast.error('Fehler beim Laden der Job-Titel');
    }
  };

  // Only refetch when search terms change, not on tab change
  useEffect(() => {
    if (activeTab === 'passwords' && searchTermPasswords) {
      refetchEmployees();
    } else if (activeTab === 'rights' && searchTermRights) {
      refetchEmployees();
    }
  }, [searchTermPasswords, searchTermRights, refetchEmployees]);

  // Load job titles on component mount and when switching to job titles tab
  useEffect(() => {
    if (activeTab === 'jobtitles') {
      loadJobTitles();
    }
  }, [activeTab]);

  // Reload employees with job title when employees data changes
  useEffect(() => {
    if (selectedJobTitle && employeesData?.data) {
      loadEmployeesWithJobTitle(selectedJobTitle);
    }
  }, [employeesData?.data, selectedJobTitle]);

  // Optimized client-side filtering for better performance
  const filteredEmployees = useMemo(() => {
    const currentSearchTerm = activeTab === 'passwords' ? searchTermPasswords : searchTermRights;
    const allEmployees = employeesData?.data || [];
    
    // Early return if no search term
    if (!currentSearchTerm.trim()) {
      return allEmployees.map(emp => 
        selectedEmployee && emp.ID === selectedEmployee.ID ? selectedEmployee : emp
      );
    }
    
    const searchLower = currentSearchTerm.toLowerCase();
    
    // Create a map for faster supervisor lookup
    const supervisorMap = new Map();
    allEmployees.forEach(emp => {
      if (emp.isSupervisor === 1) {
        supervisorMap.set(emp.ID, emp);
      }
    });
    
    return allEmployees
      .map(emp => selectedEmployee && emp.ID === selectedEmployee.ID ? selectedEmployee : emp)
      .filter(emp => {
        // Check if employee matches search
        const matchesSearch = 
          emp.FullName?.toLowerCase().includes(searchLower) ||
          emp.StaffNumber?.toString().toLowerCase().includes(searchLower) ||
          emp.Department?.toLowerCase().includes(searchLower) ||
          emp.eMail?.toLowerCase().includes(searchLower) ||
          emp.JobTitle?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
        
        // If the searched employee is a supervisor, don't show their subordinates
        if (emp.isSupervisor === 1) {
          return true; // Show the supervisor
        } else {
          // Check if they are subordinates of a supervisor that matches the search
          const supervisor = supervisorMap.get(emp.SupervisorID);
          if (supervisor) {
            const supervisorMatchesSearch = 
              supervisor.FullName?.toLowerCase().includes(searchLower) ||
              supervisor.StaffNumber?.toString().toLowerCase().includes(searchLower) ||
              supervisor.JobTitle?.toLowerCase().includes(searchLower);
            
            return !supervisorMatchesSearch; // Don't show subordinates of searched supervisors
          }
          return true;
        }
      });
  }, [employeesData?.data, searchTermPasswords, searchTermRights, activeTab, selectedEmployee]);

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Group employees by department for rights management
  const employeesByDepartment = useMemo(() => {
    return filteredEmployees.reduce((acc, emp) => {
      const dept = emp.Department || 'Keine Abteilung';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(emp);
      return acc;
    }, {} as Record<string, Employee[]>);
  }, [filteredEmployees]);

  // Filter job titles based on search
  const filteredJobTitles = useMemo(() => {
    const searchTerm = jobTitleSearchTerm || '';
    return jobTitles.filter(jobTitle =>
      jobTitle.JobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.Description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobTitles, jobTitleSearchTerm]);

  // Filter employees for modal based on search
  const filteredEmployeesForModal = useMemo(() => {
    const searchTerm = employeeSearchTerm || '';
    if (!searchTerm.trim()) {
      return allEmployeesForModal;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return allEmployeesForModal.filter(emp => 
      emp.FullName?.toLowerCase().includes(searchLower) ||
      emp.StaffNumber?.toString().toLowerCase().includes(searchLower) ||
      emp.Department?.toLowerCase().includes(searchLower) ||
      emp.eMail?.toLowerCase().includes(searchLower) ||
      emp.JobTitle?.toLowerCase().includes(searchLower)
    );
  }, [allEmployeesForModal, employeeSearchTerm]);

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-12 w-12 text-primary mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Berechtigung wird geprüft...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Bitte warten Sie einen Moment.
          </p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Zugriff verweigert
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Sie haben keine Administrator-Berechtigung, diese Seite aufzurufen.
          </p>
          <button
            onClick={checkAdminAccess}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Berechtigung erneut prüfen
          </button>
        </div>
      </div>
    );
  }

  const generatePassword = () => {
    const length = 15;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(password);
    setCopied(false);
  };

  const handleSetPassword = async () => {
    if (!selectedEmployee || !generatedPassword) return;

    const validation = validatePassword(generatedPassword);
    if (!validation.isValid) {
      toast.error('Das generierte Passwort erfüllt nicht alle Sicherheitsanforderungen');
      return;
    }

    try {
      await apiClient.post('/auth/set-password', {
        staffNumber: selectedEmployee.StaffNumber,
        password: generatedPassword,
      }, 'v2');

      toast.success('Passwort erfolgreich gesetzt');
    } catch (error) {
      toast.error('Fehler beim Setzen des Passworts');
      console.error('Error setting password:', error);
    }
  };

  const validatePassword = (password: string) => {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    const hasMinLength = password.length >= 15;
    
    return {
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
      hasMinLength,
      isValid: hasLowercase && hasUppercase && hasNumbers && hasSymbols && hasMinLength
    };
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success('Passwort in die Zwischenablage kopiert');
  };

  const handleSaveRights = async () => {
    if (!selectedEmployee) return;

    // Check if current user has admin permissions
    if (!isAdmin) {
      toast.error('Nur Administratoren können Zugriffsrechte vergeben');
      return;
    }

    try {
      setIsLoading(true);

      if (selectedRole === null) {
        // Get the current access right ID to delete
        const currentAccessRightId = (selectedEmployee as any).AccessRightsID || 
          (selectedEmployee.AccessRight === 'admin' ? 3 : 
           selectedEmployee.AccessRight === 'hr' ? 2 : null);
        
        if (currentAccessRightId) {
          await apiClient.delete(`/employee-access-rights/${selectedEmployee.ID}/${currentAccessRightId}`);
        }
      } else {
        await apiClient.put(`/employee-access-rights/${selectedEmployee.ID}`, {
          accessRight: selectedRole,
          accessRightId: selectedRole === 'admin' ? 3 : selectedRole === 'hr' ? 2 : null
        });
      }

      toast.success(selectedRole === null 
        ? 'Zugriffsrechte erfolgreich entfernt' 
        : 'Zugriffsrechte erfolgreich aktualisiert'
      );
      
      // Invalidate the access rights cache for this employee
      queryClient.invalidateQueries({ queryKey: ['employeeAccessRights', selectedEmployee.ID] });
      
      // Refresh the employees data to show updated access rights
      await refetchEmployees();
      
      // Update the selected employee with new access rights
      if (selectedEmployee) {
        const updatedEmployee = {
          ...selectedEmployee,
          AccessRightsID: selectedRole === 'admin' ? 3 : selectedRole === 'hr' ? 2 : null,
          AccessRight: selectedRole || ''
        } as Employee;
        setSelectedEmployee(updatedEmployee);
      }
    } catch (error) {
      toast.error(selectedRole === null 
        ? 'Fehler beim Entfernen der Zugriffsrechte' 
        : 'Fehler beim Speichern der Zugriffsrechte'
      );
      console.error('Error saving access rights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDepartment = (departmentName: string) => {
    setExpandedDepartments(prev =>
      prev.includes(departmentName)
        ? prev.filter(d => d !== departmentName)
        : [...prev, departmentName]
    );
  };

  const handleSearchChange = (value: string) => {
    if (activeTab === 'passwords') {
      setSearchTermPasswords(value);
    } else {
      setSearchTermRights(value);
    }
    setCurrentPage(1);
  };

  // Job title functions
  const handleCreateJobTitle = async () => {
    if (!newJobTitle.JobTitle.trim()) {
      toast.error('Job-Titel ist erforderlich');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/job-titles', {
        JobTitle: newJobTitle.JobTitle.trim(),
        Description: newJobTitle.Description.trim()
      });

      toast.success('Job-Titel erfolgreich erstellt');
      setNewJobTitle({ JobTitle: '', Description: '' });
      setShowCreateJobTitleModal(false);
      loadJobTitles();
    } catch (error) {
      console.error('Error creating job title:', error);
      toast.error('Fehler beim Erstellen des Job-Titels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignJobTitle = async () => {
    if (!selectedJobTitle || !selectedEmployeeForJobTitle) return;

    // Check if employee already has this job title
    const currentJobTitleID = selectedEmployeeForJobTitle.JobTitleID?.toString();
    const selectedJobTitleID = selectedJobTitle.ID.toString();
    
    if (currentJobTitleID === selectedJobTitleID) {
      toast.error('Der Mitarbeiter hat bereits diesen Job-Titel');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.put(`/employees/${selectedEmployeeForJobTitle.ID}`, {
        JobTitleID: selectedJobTitle.ID,
        JobTitle: selectedJobTitle.JobTitle
      });

      const action = currentJobTitleID ? 'aktualisiert' : 'zugewiesen';
      toast.success(`Job-Titel erfolgreich ${action}`);
      setShowAssignJobTitleModal(false);
      setSelectedJobTitle(null);
      setSelectedEmployeeForJobTitle(null);
      setEmployeeSearchTerm('');
      setJobTitleSearchTerm('');
      
      // Refresh all data
      await loadJobTitles();
      await refetchEmployees();
      
      // Update employees with job title if details modal is open
      if (showJobTitleDetailsModal && selectedJobTitle) {
        await loadEmployeesWithJobTitle(selectedJobTitle);
      }
    } catch (error) {
      console.error('Error assigning job title:', error);
      toast.error('Fehler beim Zuweisen des Job-Titels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignJobTitle = async (employeeId: number) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/employees/${employeeId}`, {
        JobTitleID: null,
        JobTitle: null
      });

      toast.success('Job-Titel erfolgreich entfernt');
      
      // Update local data immediately
      if (selectedJobTitle) {
        // Remove the employee from the local list
        setEmployeesWithJobTitle(prev => prev.filter(emp => emp.ID !== employeeId));
      }
      
      // Refresh all employee data
      await refetchEmployees();
      
      // Reload all employees for modal if modal is open
      if (showAssignJobTitleModal) {
        await loadAllEmployeesForModal();
      }
    } catch (error) {
      console.error('Error unassigning job title:', error);
      toast.error('Fehler beim Entfernen des Job-Titels');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeesWithJobTitle = async (jobTitle: JobTitle) => {
    try {
      // First refresh employee data to get the latest
      await refetchEmployees();
      
      // Use the updated employees data and filter by job title
      const allEmployees = employeesData?.data || [];
      const employeesWithThisJobTitle = allEmployees.filter(emp => 
        emp.JobTitleID?.toString() === jobTitle.ID.toString() ||
        emp.JobTitle === jobTitle.JobTitle
      );
      
      setEmployeesWithJobTitle(employeesWithThisJobTitle);
    } catch (error) {
      console.error('Error loading employees with job title:', error);
      toast.error('Fehler beim Laden der Mitarbeiter');
    }
  };

  const loadAllEmployeesForModal = async () => {
    try {
      // First refresh the main employee data
      await refetchEmployees();
      
      // Then load fresh data for the modal
      const data = await apiClient.get('/employees-view?limit=1000', 'v2') as any;
      setAllEmployeesForModal(data.data || data);
    } catch (error) {
      console.error('Error loading all employees for modal:', error);
      toast.error('Fehler beim Laden aller Mitarbeiter');
    }
  };

  const handleShowJobTitleDetails = (jobTitle: JobTitle) => {
    setSelectedJobTitle(jobTitle);
    loadEmployeesWithJobTitle(jobTitle);
    setShowJobTitleDetailsModal(true);
  };

  const handleOpenAssignModal = () => {
    setShowAssignJobTitleModal(true);
    loadAllEmployeesForModal();
  };

  const handleDeleteJobTitle = async (jobTitle: JobTitle) => {
    // First check if any employees have this job title
    try {
      setIsLoading(true);
      
      // Load employees with this job title
      await loadEmployeesWithJobTitle(jobTitle);
      
      if (employeesWithJobTitle.length > 0) {
        toast.error(`Der Job-Titel "${jobTitle.JobTitle}" kann nicht gelöscht werden, da er noch ${employeesWithJobTitle.length} Mitarbeiter(n) zugewiesen ist. Bitte entfernen Sie zuerst alle Zuweisungen.`);
        
        // Show the details modal to help the user manage assignments
        setSelectedJobTitle(jobTitle);
        setShowJobTitleDetailsModal(true);
        return;
      }
      
      // If no employees have this job title, proceed with deletion
      if (!confirm(`Möchten Sie den Job-Titel "${jobTitle.JobTitle}" wirklich löschen?`)) {
        return;
      }

      await apiClient.delete(`/job-titles/${jobTitle.ID}`);

      toast.success('Job-Titel erfolgreich gelöscht');
      loadJobTitles();
    } catch (error) {
      console.error('Error deleting job title:', error);
      toast.error('Fehler beim Löschen des Job-Titels');
    } finally {
      setIsLoading(false);
    }
  };



  const handleTabChange = (tab: 'passwords' | 'rights' | 'jobtitles') => {
    setActiveTab(tab);
    // Wenn wir zum Job-Titel-Tab wechseln, selectedEmployee zurücksetzen
    if (tab === 'jobtitles') {
      setSelectedEmployee(null);
    }
    // Wenn ein Mitarbeiter ausgewählt ist und wir zu Passwort-Verwaltung wechseln, Passwort generieren
    if (tab === 'passwords' && selectedEmployee && !generatedPassword) {
      generatePassword();
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Function to manually refresh all access rights
  const refreshAllAccessRights = () => {
    // Invalidate all employee access rights queries
    queryClient.invalidateQueries({ queryKey: ['employeeAccessRights'] });
    // Refresh employee data
    refetchEmployees();
    toast.success('Berechtigungen wurden aktualisiert');
  };

  if (isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">Laden...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-4 sm:p-6 ${selectedEmployee ? 'mr-96' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Verwaltung
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Verwalten Sie Passwörter, Benutzerrechte und Job-Titel
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <Key className="h-8 w-8 text-primary" />
          <Briefcase className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('passwords')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'passwords'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Key className="h-4 w-4 inline mr-2" />
            Passwort-Verwaltung
          </button>
          <button
            onClick={() => handleTabChange('rights')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rights'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Benutzerrechte
          </button>
          <button
            onClick={() => handleTabChange('jobtitles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'jobtitles'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Briefcase className="h-4 w-4 inline mr-2" />
            Job-Titel
          </button>
        </nav>
      </div>

      {activeTab === 'passwords' && (
        <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <EmployeeFilter
              searchTerm={searchTermPasswords}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              filters={filters}
              showFilters={showFilters}
              onToggleFilters={setShowFilters}
            />
          </div>

          <div className="p-6">
            {paginatedEmployees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedEmployees.map((emp) => (
                  <div
                    key={emp.ID}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      generatePassword();
                    }}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedEmployee?.ID === emp.ID
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center"> 
                          <span className="text-sm font-medium dark:text-gray-900">
                            {emp.FullName?.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {emp.FullName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {emp.StaffNumber} • {emp.Department}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Keine Mitarbeiter gefunden</p>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {activeTab === 'rights' && (
        <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <EmployeeFilter
                searchTerm={searchTermRights}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
                filters={filters}
                showFilters={showFilters}
                onToggleFilters={setShowFilters}
              />
              <button
                onClick={refreshAllAccessRights}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
                title="Berechtigungen aktualisieren"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              {Object.entries(employeesByDepartment).map(([dept, employees], index) => (
                <div key={dept}>
                  {index > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                  )}
                  <div
                    className="bg-gray-50 dark:bg-[#121212] p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    onClick={() => handleToggleDepartment(dept)}
                  >
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {dept} ({employees.length})
                      </h3>
                    </div>
                    {expandedDepartments.includes(dept) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedDepartments.includes(dept) && (
                    <div className="border-t dark:border-gray-700">
                      {employees.map((emp) => (
                        <div
                          key={emp.ID}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`p-4 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-[#2a2a2a] cursor-pointer transition-all duration-200 ${
                            selectedEmployee?.ID === emp.ID
                              ? 'bg-primary/5 dark:bg-primary/20'
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                              <span className="text-sm font-medium dark:text-gray-900">
                                {emp.FullName?.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {emp.FullName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {emp.StaffNumber}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* We'll fetch and display the actual access rights dynamically */}
                            <AccessRightsDisplay employeeId={emp.ID} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'jobtitles' && (
        <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suche nach Job-Titel oder Beschreibung..."
                    value={jobTitleSearchTerm}
                    onChange={(e) => setJobTitleSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCreateJobTitleModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Job-Titel erstellen
                </button>
                <button
                  onClick={handleOpenAssignModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Zuweisen
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Laden...</p>
              </div>
            ) : filteredJobTitles.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-[#181818]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Job-Titel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Beschreibung
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
                  {filteredJobTitles.map((jobTitle, index) => (
                    <tr key={jobTitle.ID} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {jobTitle.JobTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {jobTitle.Description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleShowJobTitleDetails(jobTitle)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Mitarbeiter anzeigen"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJobTitle(jobTitle);
                              handleOpenAssignModal();
                            }}
                            className="text-primary hover:text-primary/80"
                            title="Job-Titel zuweisen"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          {(() => {
                            const allEmployees = employeesData?.data || [];
                            const employeesWithThisJobTitle = allEmployees.filter(emp => 
                              emp.JobTitleID?.toString() === jobTitle.ID.toString() ||
                              emp.JobTitle === jobTitle.JobTitle
                            );
                            const canDelete = employeesWithThisJobTitle.length === 0;
                            
                            return (
                              <div className="relative group">
                                <button
                                  onClick={() => handleDeleteJobTitle(jobTitle)}
                                  className={`${
                                    canDelete 
                                      ? 'text-red-600 hover:text-red-800' 
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                  disabled={!canDelete}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                
                                {/* Custom Tooltip - positioned based on row index */}
                                <div className={`absolute right-0 px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 ${
                                  index === 0 
                                    ? 'top-full mt-2' // First row: show below
                                    : 'bottom-full mb-2' // Other rows: show above
                                }`}>
                                  {canDelete ? (
                                    "Job-Titel löschen"
                                  ) : (
                                    <div>
                                      <div className="font-medium mb-1">Job-Titel kann nicht gelöscht werden</div>
                                      <div className="text-gray-300">
                                        {employeesWithThisJobTitle.length} Mitarbeiter zugewiesen
                                      </div>
                                      <div className="text-gray-300 text-xs mt-1">
                                        Zuweisungen zuerst entfernen
                                      </div>
                                    </div>
                                  )}
                                  {/* Dynamic arrow based on position */}
                                  <div className={`absolute right-2 w-0 h-0 border-l-4 border-r-4 border-transparent ${
                                    index === 0 
                                      ? 'bottom-full border-b-4 border-b-gray-900 dark:border-b-gray-700' // First row: arrow pointing up
                                      : 'top-full border-t-4 border-t-gray-900 dark:border-t-gray-700' // Other rows: arrow pointing down
                                  }`}></div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Keine Job-Titel gefunden</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar for selected employee */}
      {selectedEmployee && activeTab !== 'jobtitles' && (
        <div className="fixed top-16 right-0 w-96 h-[calc(100vh-7.5rem)] bg-white dark:bg-[#121212] shadow-xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedEmployee.FullName}
              </h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Personalnummer</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.StaffNumber}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Abteilung</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployee.Department}</p>
              </div>

              {activeTab === 'passwords' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Passwort generieren</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={generatePassword}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
                      >
                        <RefreshCw className="h-4 w-4 inline mr-1" />
                        Generieren
                      </button>
                    </div>
                  </div>

                  {generatedPassword && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Generiertes Passwort
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={generatedPassword}
                            readOnly
                            className="block w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-8 flex items-center pr-2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={copyToClipboard}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">Passwort-Anforderungen:</h5>
                        {(() => {
                          const validation = validatePassword(generatedPassword);
                          return (
                            <div className="space-y-1">
                              <div className={`flex items-center text-xs ${validation.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                <Check className="h-3 w-3 mr-1" />
                                Mindestens 15 Zeichen
                              </div>
                              <div className={`flex items-center text-xs ${validation.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                <Check className="h-3 w-3 mr-1" />
                                Kleinbuchstaben
                              </div>
                              <div className={`flex items-center text-xs ${validation.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                <Check className="h-3 w-3 mr-1" />
                                Großbuchstaben
                              </div>
                              <div className={`flex items-center text-xs ${validation.hasNumbers ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                <Check className="h-3 w-3 mr-1" />
                                Zahlen
                              </div>
                              <div className={`flex items-center text-xs ${validation.hasSymbols ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                <Check className="h-3 w-3 mr-1" />
                                Sonderzeichen
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <button
                        onClick={handleSetPassword}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                      >
                        <Lock className="h-4 w-4 inline mr-1" />
                        Passwort setzen
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rights' && (
                <div className="space-y-4">
                  {!isAdmin ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Nur Administratoren können Benutzerrechte verwalten
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Benutzerrechte</h4>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="role"
                              value=""
                              checked={selectedRole === null}
                              onChange={() => setSelectedRole(null)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Keine speziellen Rechte</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="role"
                              value="hr"
                              checked={selectedRole === 'hr'}
                              onChange={() => setSelectedRole('hr')}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">HR-Berechtigung</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="role"
                              value="admin"
                              checked={selectedRole === 'admin'}
                              onChange={() => setSelectedRole('admin')}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Administrator</span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveRights}
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 inline mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 inline mr-1" />
                        )}
                        Rechte speichern
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Job Title Modal */}
      {showCreateJobTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Job-Titel erstellen
              </h3>
              <button
                onClick={() => setShowCreateJobTitleModal(false)}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job-Titel *
                </label>
                <input
                  type="text"
                  value={newJobTitle.JobTitle}
                  onChange={(e) => setNewJobTitle(prev => ({ ...prev, JobTitle: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="z.B. Softwareentwickler"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={newJobTitle.Description}
                  onChange={(e) => setNewJobTitle(prev => ({ ...prev, Description: e.target.value }))}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Beschreibung des Job-Titels..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateJobTitleModal(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateJobTitle}
                disabled={isLoading || !newJobTitle.JobTitle.trim()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Erstellen...' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Assign Job Title Modal */}
      {showAssignJobTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  Job-Titel zuweisen
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Wählen Sie einen Job-Titel und einen oder mehrere Mitarbeiter aus
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignJobTitleModal(false);
                  setSelectedJobTitle(null);
                  setSelectedEmployeeForJobTitle(null);
                  setEmployeeSearchTerm('');
                  setJobTitleSearchTerm('');
                }}
                className="inline-flex items-center p-2 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Title Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job-Titel auswählen
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Job-Titel suchen..."
                      value={jobTitleSearchTerm}
                      onChange={(e) => setJobTitleSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {filteredJobTitles.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredJobTitles.map((jobTitle) => (
                        <div
                          key={jobTitle.ID}
                          onClick={() => setSelectedJobTitle(jobTitle)}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedJobTitle?.ID === jobTitle.ID
                              ? 'bg-primary/10 border-l-4 border-primary'
                              : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {jobTitle.JobTitle}
                              </h4>
                              {jobTitle.Description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {jobTitle.Description}
                                </p>
                              )}
                            </div>
                            {selectedJobTitle?.ID === jobTitle.ID && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Keine Job-Titel gefunden
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mitarbeiter auswählen
                  </label>
                                     <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                     <input
                       type="text"
                       placeholder="Mitarbeiter suchen..."
                       value={employeeSearchTerm}
                       onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                       className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                     />
                   </div>
                 </div>
                 
                 <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                   {filteredEmployeesForModal.length > 0 ? (
                     <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredEmployeesForModal.map((employee) => {
                        const hasSelectedJobTitle = selectedJobTitle && 
                          employee.JobTitleID?.toString() === selectedJobTitle.ID.toString();
                          
                          return (
                            <div
                              key={employee.ID}
                              onClick={() => !hasSelectedJobTitle && setSelectedEmployeeForJobTitle(employee)}
                              className={`p-4 transition-colors ${
                                hasSelectedJobTitle
                                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
                                  : selectedEmployeeForJobTitle?.ID === employee.ID
                                  ? 'bg-primary/10 dark:bg-primary/10 border-l-4 border-primary cursor-pointer'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer'
                              }`}
                            >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                                <span className="text-sm font-medium dark:text-gray-900">
                                  {employee.FullName?.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {employee.FullName}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {employee.StaffNumber} • {employee.Department}
                                </p>
                                {employee.JobTitle && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Aktuell: {employee.JobTitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {selectedEmployeeForJobTitle?.ID === employee.ID && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                              {hasSelectedJobTitle && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Bereits zugewiesen
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Keine Mitarbeiter gefunden
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Items Summary */}
            {(selectedJobTitle || selectedEmployeeForJobTitle) && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Auswahl Zusammenfassung
                </h4>
                <div className="space-y-2">
                  {selectedJobTitle && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Job-Titel:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedJobTitle.JobTitle}
                      </span>
                    </div>
                  )}
                  {selectedEmployeeForJobTitle && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Mitarbeiter:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedEmployeeForJobTitle.FullName} ({selectedEmployeeForJobTitle.StaffNumber})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowAssignJobTitleModal(false);
                  setSelectedJobTitle(null);
                  setSelectedEmployeeForJobTitle(null);
                  setEmployeeSearchTerm('');
                  setJobTitleSearchTerm('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAssignJobTitle}
                disabled={isLoading || !selectedJobTitle || !selectedEmployeeForJobTitle}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Zuweisen...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {selectedEmployeeForJobTitle?.JobTitleID && selectedEmployeeForJobTitle.JobTitleID.toString() !== selectedJobTitle?.ID.toString() ? 'Job-Titel aktualisieren' : 'Job-Titel zuweisen'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Title Details Modal */}
      {showJobTitleDetailsModal && selectedJobTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Mitarbeiter mit Job-Titel: {selectedJobTitle.JobTitle}
              </h3>
              <button
                onClick={() => {
                  setShowJobTitleDetailsModal(false);
                  setSelectedJobTitle(null);
                  setEmployeesWithJobTitle([]);
                }}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedJobTitle.Description}
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Laden...</p>
              </div>
            ) : employeesWithJobTitle.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-[#181818]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mitarbeiter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Personalnummer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Abteilung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        E-Mail
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
                    {employeesWithJobTitle.map((employee) => (
                      <tr key={employee.ID} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center mr-3">
                              <span className="text-sm font-medium dark:text-gray-900">
                                {employee.FullName?.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.FullName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.StaffNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.Department}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.eMail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleUnassignJobTitle(employee.ID)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Job-Titel entfernen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Keine Mitarbeiter mit diesem Job-Titel gefunden
                </p>
                                  <button
                    onClick={() => {
                      setShowJobTitleDetailsModal(false);
                      handleOpenAssignModal();
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Job-Titel zuweisen
                  </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )};