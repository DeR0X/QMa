import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Shield, 
  Building2, 
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react';
import { RootState } from '../store';
import { useEmployees } from '../hooks/useEmployees';
import { toast } from 'sonner';
import { hasPermission } from '../store/slices/authSlice';
import apiClient from '../services/apiClient';

interface AccessRight {
  id: number;
  name: 'admin' | 'hr';
  description: string;
}

interface EmployeeAccessRight {
  ID: number;
  EmployeeID: number;
  AccessRightID: number;
  Name: string;
}

export default function AdminView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'hr' | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const { data: employeesData } = useEmployees({limit: 1000});

  // Check admin access via API call instead of localStorage
  const checkAdminAccess = async () => {
    if (!currentEmployee) {
      setHasAdminAccess(false);
      setIsCheckingAccess(false);
      return;
    }

    try {
      setIsCheckingAccess(true);
      const accessRights = await apiClient.get(`/employee-access-rights/${currentEmployee.ID}`) as any[];
      
      if (Array.isArray(accessRights)) {
        const hasAdmin = accessRights.some((right: any) => right.AccessRightID === 3);
        setHasAdminAccess(hasAdmin);
      } else {
        setHasAdminAccess(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setHasAdminAccess(false);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  // Check access when component mounts
  useEffect(() => {
    checkAdminAccess();
  }, [currentEmployee?.ID]); // Only depend on the user ID

  const isAdmin = hasAdminAccess === true;

  useEffect(() => {
    if (selectedEmployee) {
      // Set role directly from employee's AccessRightsID
      const role = selectedEmployee.AccessRightsID === 3 
        ? 'admin' 
        : selectedEmployee.AccessRightsID === 2 
          ? 'hr' 
          : null;
      setSelectedRole(role);
    }
  }, [selectedEmployee]);

  const handleSaveRights = async () => {
    if (!selectedEmployee) return;

    try {
      setIsLoading(true);

      if (selectedRole === null) {
        // If setting to no special role, delete the existing access right
        await apiClient.delete(`/employee-access-rights/${selectedEmployee.ID}/${selectedEmployee.AccessRightsID}`);
      } else {
        // Update or create access right
        await apiClient.put(`/employee-access-rights/${selectedEmployee.ID}`, {
          accessRight: selectedRole,
          accessRightId: selectedRole === 'admin' ? 3 : selectedRole === 'hr' ? 2 : null
        });
      }

      // Update local employee data
      if (employeesData?.data) {
        const updatedEmployees = employeesData.data.map(emp => 
          emp.ID === selectedEmployee.ID 
            ? { ...emp, AccessRightsID: selectedRole === 'admin' ? 3 : selectedRole === 'hr' ? 2 : null }
            : emp
        );
        // Update the employees data in the store
        // This would typically be done through a Redux action
      }

      toast.success(selectedRole === null 
        ? 'Zugriffsrechte erfolgreich entfernt' 
        : 'Zugriffsrechte erfolgreich aktualisiert'
      );
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

  // Filter employees based on search term and deduplicate by ID
  const filteredEmployees = employeesData?.data
    .filter(emp => {
      const searchLower = searchTerm.toLowerCase();
      return (
        emp.FullName?.toLowerCase().includes(searchLower) ||
        emp.StaffNumber?.toString().toLowerCase().includes(searchLower) ||
        emp.Department?.toLowerCase().includes(searchLower)
      );
    })
    // Deduplicate employees by ID, keeping the first occurrence
    .filter((emp, index, self) => 
      index === self.findIndex(e => e.ID === emp.ID)
    )
    .slice(0, 1000) || [];

  // Group employees by department
  const employeesByDepartment = filteredEmployees.reduce((acc, emp) => {
    const dept = emp.Department || 'Keine Abteilung';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, any[]>);

  if (isCheckingAccess) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
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

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Zugriff verweigert
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Sie haben keine Administrator-Berechtigung, diese Seite aufzurufen.
          </p>
          <button
            onClick={checkAdminAccess}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut prüfen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Shield className="h-6 w-6 mr-2" />
          Benutzerrechteverwaltung
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Mitarbeiter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            {Object.entries(employeesByDepartment).map(([dept, employees]) => (
              <div key={dept}>
                <div
                  className="bg-gray-50 dark:bg-[#121212] p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => handleToggleDepartment(dept)}
                >
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {dept}
                    </h3>
                  </div>
                  {expandedDepartments.includes(dept) ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {expandedDepartments.includes(dept) && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.map(emp => (
                      <div
                        key={emp.ID}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedEmployee?.ID === emp.ID ? 'bg-gray-50 dark:bg-gray-800' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {emp.FullName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {emp.StaffNumber}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {emp.AccessRight === 'admin' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                Admin
                              </span>
                            )}
                            {emp.AccessRight === 'hr' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                HR
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rights Management */}
        <div className="space-y-4">
          {selectedEmployee ? (
            <>
              <div className="bg-gray-50 dark:bg-[#121212] p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Zugriffsrechte für {selectedEmployee.FullName}
                </h3>

                <div className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rolle auswählen
                    </h4>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={selectedRole === 'admin'}
                            onChange={() => setSelectedRole('admin')}
                            className="rounded-full border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Administrator
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Vollzugriff auf alle Funktionen
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={selectedRole === 'hr'}
                            onChange={() => setSelectedRole('hr')}
                            className="rounded-full border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              HR
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Zugriff auf HR-spezifische Funktionen
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={selectedRole === null}
                            onChange={() => setSelectedRole(null)}
                            className="rounded-full border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Keine spezielle Rolle
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Standard-Mitarbeiterzugriff
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      onClick={() => {
                        const role = selectedEmployee.AccessRightsID === 3 
                          ? 'admin' 
                          : selectedEmployee.AccessRightsID === 2 
                            ? 'hr' 
                            : null;
                        setSelectedRole(role);
                      }}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Zurücksetzen
                    </button>
                    <button
                      onClick={handleSaveRights}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-[#121212] rounded-lg p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Wählen Sie einen Mitarbeiter aus, um dessen Rechte zu verwalten
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}