import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Plus, Users, Mail, Phone, CheckCircle, XCircle, GraduationCap, X } from 'lucide-react';
import { RootState } from '../store';
import { useEmployees } from '../hooks/useEmployees';
import { useJobTitles } from '../hooks/useJobTitles';
import { useDepartments } from '../hooks/useDepartments';
import type { Employee } from '../types';
import { hasHRPermissions } from '../store/slices/authSlice';

export default function Departments() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { employee: currentUser } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideEmptyDepartments, setHideEmptyDepartments] = useState(false);

  const isHR = hasHRPermissions(currentUser);
  const isSupervisor = currentUser?.role === 'supervisor';

  const { data: employees } = useEmployees();
  const { data: jobTitles } = useJobTitles();
  const { data: departments } = useDepartments();

  const getJobTitle = (jobTitleID: string) => {
    if (!jobTitles) return 'Laden...';
    const jobTitle = jobTitles.find(jt => jt.id === jobTitleID);
    return jobTitle ? jobTitle.jobTitle : jobTitleID;
  };

  const getEmployeeQualifications = (employee: Employee) => {
    if (!jobTitles) return [];
    const jobTitle = jobTitles.find(jt => jt.id === employee.JobTitleID?.toString());
    return jobTitle ? jobTitle.qualificationIDs : [];
  };

  // Filtere Abteilungen anhand der Suchanfrage und Benutzerrolle
  const filteredDepartments = departments ? departments.filter(dept => {
    const matchesSearch = dept.Department.toLowerCase().includes(searchTerm.toLowerCase());
    const employeeCount = employees!.data.filter((user : any) => user.Departmentid?.toString() === dept.ID).length;
    const passesEmptyFilter = !hideEmptyDepartments || employeeCount > 0;
    
    if (isHR) {
      return matchesSearch && passesEmptyFilter;
    } else if (isSupervisor) {
      return dept.ID.toString() === currentUser?.DepartmentID?.toString() && matchesSearch && passesEmptyFilter;
    }
    return false;
  }) : [];

  // Hole Mitarbeiter der ausgewählten Abteilung
  const departmentEmployees = selectedDepartment
    ? employees!.data.filter((user : any) => user.Departmentid?.toString() === selectedDepartment)
    : [];

  // Ermittel die Mitarbeiterzahl für eine Abteilung
  const getDepartmentEmployeeCount = (departmentid: string) => {
    return employees!.data.filter((user : any) => user.Departmentid?.toString() === departmentid).length;
  };

  // Zugriff nur erlauben, wenn der Benutzer HR oder Supervisor ist
  if (!isHR && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-4">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header: Basis (mobile) gestapelt, ab sm in einer Zeile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Suchfeld und Abteilungsübersicht */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Abteilungen durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-[#181818] dark:text-white"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={hideEmptyDepartments}
                onChange={(e) => setHideEmptyDepartments(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Leere Abteilungen ausblenden</span>
            </label>
          </div>
        </div>

        {/* Grid: mobile 1 Spalte, ab md 2 Spalten, ab lg 3 Spalten */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => {
            const employeeCount = getDepartmentEmployeeCount(dept.ID.toString());
            return (
              <div
                key={dept.ID}
                onClick={() => setSelectedDepartment(dept.ID.toString())}
                className="bg-white dark:bg-[#181818] shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {dept.Department}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {employeeCount} Mitarbeiter
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      id: {dept.DepartmentID_Atoss}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Positionen:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dept.positions!.slice(0, 5).map((position) => (
                      <span
                        key={position}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      >
                        {position}
                      </span>
                    ))}
                    {dept.positions!.length > 5 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary">
                        +{dept.positions!.length - 5} weitere
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDepartments.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Keine Abteilungen gefunden
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {hideEmptyDepartments 
                  ? 'Versuchen Sie den Filter für leere Abteilungen zu deaktivieren'
                  : 'Versuchen Sie die Suchkriterien anzupassen'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal für die Mitarbeiterübersicht der ausgewählten Abteilung */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {departments!.find(d => d.ID.toString() === selectedDepartment)?.Department} – Mitarbeiterübersicht
              </h2>
              <button
                onClick={() => setSelectedDepartment(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-4 sm:mt-0"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {departmentEmployees.length > 0 ? (
              <div className="space-y-6">
                {departmentEmployees.map((employee) => (
                  <div
                    key={employee.ID}
                    className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center">
                          <span className="text-lg font-medium">
                            {employee.FullName.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-0 mt-2 sm:ml-4 sm:mt-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words">
                            {employee.FullName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                            {getJobTitle(employee.JobTitleID?.toString() || '')}
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
                          <p className="text-sm flex items-center text-gray-500 dark:text-gray-400 break-words">
                            <Mail className="h-4 w-4 mr-2" />
                            {employee.eMail}
                          </p>
                          <p className="text-sm flex items-center text-gray-500 dark:text-gray-400 break-words">
                            <Users className="h-4 w-4 mr-2" />
                            Personalnummer: {employee.StaffNumber}
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
                            {getEmployeeQualifications(employee).length} Qualifikationen
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