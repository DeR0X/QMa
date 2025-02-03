import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Plus, Users, Mail, Phone, CheckCircle, XCircle, GraduationCap, X } from 'lucide-react';
import { itDepartments, manufacturingDepartments } from '../data/departments';
import { RootState } from '../store';
import { users } from '../data/mockData';
import type { User } from '../types';
import { hasHRPermissions } from '../store/slices/authSlice';

export default function Departments() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  const isHR = hasHRPermissions(currentUser);
  const isSupervisor = currentUser?.role === 'supervisor';

  // Combine all departments
  const allDepartments = [...itDepartments, ...manufacturingDepartments];

  // Filter departments based on user role and search term
  const filteredDepartments = allDepartments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (isHR) {
      return matchesSearch; // HR can see all departments
    } else if (isSupervisor) {
      return dept.name === currentUser?.department && matchesSearch;
    }
    return false;
  });

  // Get employees for selected department
  const departmentEmployees = selectedDepartment
    ? users.filter(user => user.department === selectedDepartment)
    : [];

  // Get employee count for each department
  const getDepartmentEmployeeCount = (departmentName: string) => {
    return users.filter(user => user.department === departmentName).length;
  };

  // Only allow access if user is a supervisor or HR
  if (!isHR && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Abteilungen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isHR ? 'Übersicht aller Abteilungen' : 'Ihre Abteilung'}
          </p>
        </div>
        <Building2 className="h-8 w-8 text-primary" />
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Abteilungen durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-[#181818] dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.name}
              onClick={() => setSelectedDepartment(dept.name)}
              className="bg-white dark:bg-[#181818] shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {dept.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getDepartmentEmployeeCount(dept.name)} Mitarbeiter
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Positionen:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dept.positions.slice(0, 3).map((position) => (
                    <span
                      key={position}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      {position}
                    </span>
                  ))}
                  {dept.positions.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      +{dept.positions.length - 3} weitere
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedDepartment} - Mitarbeiterübersicht
              </h2>
              <button
                onClick={() => setSelectedDepartment(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {departmentEmployees.length > 0 ? (
              <div className="space-y-6">
                {departmentEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center">
                          <span className="text-lg font-medium">
                            {employee.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {employee.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.position}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {employee.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Kontaktinformationen
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm flex items-center text-gray-500 dark:text-gray-400">
                            <Mail className="h-4 w-4 mr-2" />
                            {employee.email}
                          </p>
                          <p className="text-sm flex items-center text-gray-500 dark:text-gray-400">
                            <Users className="h-4 w-4 mr-2" />
                            Personalnummer: {employee.personalNumber}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Qualifikationen & Schulungen
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            {employee.qualifications.length} Qualifikationen
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {employee.trainings.map((trainingId) => (
                              <span
                                key={trainingId}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                Training #{trainingId}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Keine Mitarbeiter in dieser Abteilung gefunden.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}