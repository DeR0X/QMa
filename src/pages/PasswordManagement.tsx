import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Key, Copy, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { RootState } from '../store';
import { useEmployees } from '../hooks/useEmployees';
import EmployeeFilter from '../components/employees/EmployeeFilters';
import Pagination from '../components/employees/Pagination';
import type { Employee } from '../types';
import { hasPermission } from '../store/slices/authSlice';
import apiClient from '../services/apiClient';

const ITEMS_PER_PAGE = 15;

export default function PasswordManagement() {
  const { employee: currentUser } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    isActive: true,
    sortBy: 'SurName',
    sortOrder: 'asc' as 'asc' | 'desc',
    groupBy: 'none' as 'department' | 'supervisor' | 'none'
  });
  
  // Check admin access via API call instead of localStorage
  const checkAdminAccess = async () => {
    if (!currentUser) {
      setHasAdminAccess(false);
      setIsCheckingAccess(false);
      return;
    }

    try {
      setIsCheckingAccess(true);
      const accessRights = await apiClient.get(`/employee-access-rights/${currentUser.ID}`) as any[];
      const hasAdmin = Array.isArray(accessRights) && accessRights.some((right: any) => right.AccessRightID === 3);
      setHasAdminAccess(hasAdmin);
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
  }, [currentUser?.ID]); // Only depend on the user ID

  const isAdmin = hasAdminAccess === true;

  const { data: employeesData, isLoading } = useEmployees({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchTerm
  });

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

  const filteredEmployees = employeesData?.data || [];
  const totalItems = employeesData?.pagination?.total || 0;
  const totalPages = employeesData?.pagination?.totalPages || 1;

  // Remove client-side pagination since it's handled by the API
  const paginatedEmployees = filteredEmployees;

  const generatePassword = () => {
    const length = 15; // Mindestens 15 Zeichen
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Stelle sicher, dass mindestens ein Zeichen aus jeder Kategorie enthalten ist
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length)); // Kleinbuchstabe
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length)); // Großbuchstabe
    password += numbers.charAt(Math.floor(Math.random() * numbers.length)); // Zahl
    password += symbols.charAt(Math.floor(Math.random() * symbols.length)); // Sonderzeichen
    
    // Fülle den Rest mit zufälligen Zeichen aus allen Kategorien
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mische das Passwort
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(password);
    setCopied(false);
  };

  const handleSetPassword = async () => {
    if (!selectedEmployee || !generatedPassword) return;

    // Validiere das Passwort vor dem Senden
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Passwort-Verwaltung
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Verwalten Sie Mitarbeiter-Passwörter
          </p>
        </div>
        <Key className="h-8 w-8 text-primary" />
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <EmployeeFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
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
                        {emp.StaffNumber}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {emp.eMail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Keine Mitarbeiter gefunden
            </p>
          )}

          {selectedEmployee && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-[#181818] rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Passwort für {selectedEmployee.FullName}
              </h3>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    readOnly
                    value={generatedPassword}
                    className="block w-full pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#121212] text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={generatePassword}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {/* Passwort-Komplexität Anzeige */}
              {generatedPassword && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Passwort-Komplexität
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const validation = validatePassword(generatedPassword);
                      return (
                        <>
                          <div className={`flex items-center text-sm ${validation.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <Check className={`h-4 w-4 mr-2 ${validation.hasMinLength ? 'text-green-500' : 'text-red-500'}`} />
                            Mindestens 15 Zeichen ({generatedPassword.length}/15)
                          </div>
                          <div className={`flex items-center text-sm ${validation.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <Check className={`h-4 w-4 mr-2 ${validation.hasLowercase ? 'text-green-500' : 'text-red-500'}`} />
                            Kleinbuchstaben (a-z)
                          </div>
                          <div className={`flex items-center text-sm ${validation.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <Check className={`h-4 w-4 mr-2 ${validation.hasUppercase ? 'text-green-500' : 'text-red-500'}`} />
                            Großbuchstaben (A-Z)
                          </div>
                          <div className={`flex items-center text-sm ${validation.hasNumbers ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <Check className={`h-4 w-4 mr-2 ${validation.hasNumbers ? 'text-green-500' : 'text-red-500'}`} />
                            Zahlen (0-9)
                          </div>
                          <div className={`flex items-center text-sm ${validation.hasSymbols ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <Check className={`h-4 w-4 mr-2 ${validation.hasSymbols ? 'text-green-500' : 'text-red-500'}`} />
                            Sonderzeichen (!@#$%^&*)
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSetPassword}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700 transition-all duration-200 hover:shadow-md"
                >
                  Passwort setzen
                </button>
              </div>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}