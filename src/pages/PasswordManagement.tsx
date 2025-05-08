import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Key, Copy, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { RootState } from '../store';
import { useEmployees } from '../hooks/useEmployees';
import type { Employee } from '../types';

export default function PasswordManagement() {
  const { employee: currentUser } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const { data: employeesData } = useEmployees();

  if (!currentUser?.role || !['admin', 'hr'].includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-4">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  const filteredEmployees = employeesData?.data.filter(emp => 
    emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.StaffNumber.toString().includes(searchTerm)
  ) || [];

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setCopied(false);
  };

  const handleSetPassword = async () => {
    if (!selectedEmployee || !generatedPassword) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v2/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.ID,
          password: generatedPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set password');
      }

      toast.success('Passwort erfolgreich gesetzt');
    } catch (error) {
      toast.error('Fehler beim Setzen des Passworts');
      console.error('Error setting password:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success('Passwort in die Zwischenablage kopiert');
  };

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Name oder Personalnummer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="p-6">
          {filteredEmployees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.ID}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    generatePassword();
                  }}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedEmployee?.ID === emp.ID
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {emp.FullName.split(' ').map(n => n[0]).join('')}
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
              
              <div className="flex items-center space-x-4 mb-6">
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

              <div className="flex justify-end">
                <button
                  onClick={handleSetPassword}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
                >
                  Passwort setzen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}