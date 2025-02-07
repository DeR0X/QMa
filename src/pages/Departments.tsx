import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Plus, Users, Mail, Phone, CheckCircle, XCircle, GraduationCap, X } from 'lucide-react';
import { RootState } from '../store';
import { employees, departments } from '../data/mockData';
import type { Employee } from '../types';
import { hasHRPermissions } from '../store/slices/authSlice';

export default function Departments() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { employee: currentUser } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  const isHR = hasHRPermissions(currentUser);
  const isSupervisor = currentUser?.role === 'supervisor';

  // Filter departments based on user role and search term
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.department.toLowerCase().includes(searchTerm.toLowerCase());
    if (isHR) {
      return matchesSearch; // HR can see all departments
    } else if (isSupervisor) {
      return dept.id === currentUser?.departmentID && matchesSearch;
    }
    return false;
  });

  // Get employees for selected department
  const departmentEmployees = selectedDepartment
    ? employees.filter(user => user.departmentID === selectedDepartment)
    : [];

  // Get employee count for each department
  const getDepartmentEmployeeCount = (departmentId: string) => {
    return employees.filter(user => user.departmentID === departmentId).length;
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
              key={dept.id}
              onClick={() => setSelectedDepartment(dept.id)}
              className="bg-white dark:bg-[#181818] shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {dept.department}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getDepartmentEmployeeCount(dept.id)} Mitarbeiter
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ID: {dept.departmentID_Atoss}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Positionen:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dept.positions.slice(0, 5).map((position) => (
                    <span
                      key={position}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      {position}
                    </span>
                  ))}
                  {dept.positions.length > 5 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary">
                      +{dept.positions.length - 5} weitere
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
                {departments.find(d => d.id === selectedDepartment)?.department} - Mitarbeiterübersicht
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
                            {employee.fullName.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {employee.fullName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.jobTitleID}
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
                            {employee.eMail}
                          </p>
                          <p className="text-sm flex items-center text-gray-500 dark:text-gray-400">
                            <Users className="h-4 w-4 mr-2" />
                            Personalnummer: {employee.staffNumber}
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
                            {employee.jobTitleID.qualificationIds.length} Qualifikationen
                          </div>
                          {employee.isTrainer && (
                            <div className="flex items-center text-sm text-blue-500 dark:text-blue-400">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Trainer für {employee.trainerFor?.length || 0} Schulung(en)
                            </div>
                          )}
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