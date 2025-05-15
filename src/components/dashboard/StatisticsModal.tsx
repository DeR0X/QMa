import React from 'react';
import { useState } from "react";
import {
  X,
  Award,
  History as HistoryIcon,
  UserCheck,
  Building2,
  AlertTriangle,
  Briefcase,
  Calendar,
  Timer,
  Users as UsersIcon,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react";
import { formatDate } from "../../lib/utils";
import EmployeeDetails from "../employees/EmployeeDetails";
import { useEmployeeQualifications } from "../../hooks/useEmployeeQualifications";
import { useDepartments } from "../../hooks/useDepartments";
import { useJobTitles } from "../../hooks/useJobTitles";
import { useQualifications } from "../../hooks/useQualifications";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  employees: Array<any>;
  type: "all" | "completed" | "pending" | "expiring";
}

// Modal für abgelaufene Qualifikation
function ExpiredQualificationModal({ qualification, employee, onClose }: { qualification: any, employee: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Qualifikationsdetails</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{qualification?.Name || 'Unbekannte Qualifikation'}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gültig bis: {formatDate(qualification.toQualifyUntil)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-900 dark:text-white">Mitarbeiter: {employee?.FullName || employee?.fullName || employee?.Name || employee?.name || employee?.EmployeeID}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personalnummer: {employee?.StaffNumber || employee?.staffNumber || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatisticsModal({  
  isOpen,
  onClose,
  title,
  employees = [],
  type,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const { data: departmentsData } = useDepartments();
  const { data: jobTitlesData } = useJobTitles();
  const { data: qualificationsData } = useQualifications();
  const { data: allEmployeeQualifications } = useEmployeeQualifications();
  const itemsPerPage = 10;
  const [selectedExpiredQual, setSelectedExpiredQual] = useState<any | null>(null);
  const [selectedExpiredEmployee, setSelectedExpiredEmployee] = useState<any | null>(null);
  // Filter employees based on their qualification status and selected filters
  const filteredEmployees = employees.filter((employee) => {
    // Get qualifications for this employee
    const employeeQuals = Array.isArray(allEmployeeQualifications)
      ? allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID)
      : [];

    // Department filter
    if (selectedDepartment !== 'all' && employee.Department !== selectedDepartment) {
      return false;
    }

    // For pending (expired) qualifications, only show employees with expired qualifications
    switch (type) {
      case "pending":
        // Show only employees with expired qualifications
        return employeeQuals.some((qual: any) => {
          const expiryDate = new Date(qual.ToQualifyUntil);
          return expiryDate <= new Date();
        });
      case "expiring":
        return employeeQuals.some((qual: any) => {
          const expiryDate = new Date(qual.ToQualifyUntil);
          const now = new Date();
          const twoMonthsFromNow = new Date();
          twoMonthsFromNow.setMonth(now.getMonth() + 2);
          return expiryDate <= twoMonthsFromNow && expiryDate > now;
        });
      case "completed":
        return employeeQuals.some((qual: any) => {
          const expiryDate = new Date(qual.ToQualifyUntil);
          return expiryDate > new Date();
        });
      default:
        return true;
    }
  });

  if (!isOpen) return null;

  // Section: Abgelaufene Qualifikationen (alle)
  const now = new Date();
  let expiredQualifications: any[] = [];
  if (type === 'pending' && Array.isArray(allEmployeeQualifications)) {
    expiredQualifications = allEmployeeQualifications.filter((qual: any) => {
      const expiryDate = new Date(qual.toQualifyUntil);
      return expiryDate <= now;
    });
  }

  let expiringQualifications: any[] = [];
  if (type === 'expiring' && Array.isArray(allEmployeeQualifications)) {
    expiringQualifications = allEmployeeQualifications.filter((qual: any) => {
      const expiryDate = new Date(qual.toQualifyUntil);
      return expiryDate >= now;
    });
  }


  // Hilfsfunktion, um Mitarbeiter zu einer Qualifikation zu finden
  const findEmployeeByQual = (qual: any) => {
    return employees.find((emp: any) => emp.ID == qual.EmployeeID);
  };

  const renderContent = () => {
    if (type === 'all') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.ID}
              className="bg-white dark:bg-[#181818] p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelectedEmployee(employee)}
            >
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {employee.FullName.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{employee.FullName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{employee.Department}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{employee.StaffNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // For qualification-related views (completed, pending, expiring)
    return (
      <div className="space-y-4">
        {/* Zeige alle abgelaufenen Qualifikationen, wenn type === 'pending' */}
        {type === 'pending' && expiredQualifications.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Alle abgelaufenen Qualifikationen</h3>
            <ul className="space-y-2">
              {expiredQualifications.map((qual: any) => {
                const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                const employee = findEmployeeByQual(qual);
                return (
                  <li key={qual.ID} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/10 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer"
                    onClick={() => {
                      setSelectedExpiredQual(qualification || qual);
                      setSelectedExpiredEmployee(employee);
                    }}
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{qualification?.Name || 'Unbekannte Qualifikation'}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Mitarbeiter: {employee?.FullName || employee?.EmployeeID})</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Personalnummer: {employee?.StaffNumber || '-'}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Gültig bis: {formatDate(qual.ToQualifyUntil || qual.toQualifyUntil)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {type === 'expiring' && expiringQualifications.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Alle ablaufende Qualifikationen</h3>
            <ul className="space-y-2">
              {expiringQualifications.map((qual: any) => {
                const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                const employee = findEmployeeByQual(qual);
                return (
                  <li key={qual.ID} className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-600/10 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer"
                    onClick={() => {
                      setSelectedExpiredQual(qualification || qual);
                      setSelectedExpiredEmployee(employee);
                    }}
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{qualification?.Name || 'Unbekannte Qualifikation'}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Mitarbeiter: {employee?.FullName || employee?.EmployeeID})</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Personalnummer: {employee?.StaffNumber || '-'}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Gültig bis: {formatDate(qual.ToQualifyUntil || qual.toQualifyUntil)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {filteredEmployees.map((employee) => {
          const employeeQuals = Array.isArray(allEmployeeQualifications)
            ? allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID)
            : [];

          const relevantQuals = employeeQuals.filter((qual: any) => {
            const expiryDate = new Date(qual.ToQualifyUntil || qual.toQualifyUntil);
            const now = new Date();
            const twoMonthsFromNow = new Date();
            twoMonthsFromNow.setMonth(now.getMonth() + 2);

            switch (type) {
              case "pending":
                return expiryDate <= now;
              case "expiring":
                return expiryDate > now && expiryDate <= twoMonthsFromNow;
              case "completed":
                return expiryDate > twoMonthsFromNow;
              default:
                return true;
            }
          });

          if (relevantQuals.length === 0) return null;

          return (
            <div key={employee.ID} className="bg-white dark:bg-[#181818] p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {employee.FullName.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{employee.FullName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{employee.Department}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(employee)}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Details
                </button>
              </div>

              <div className="space-y-2">
                {relevantQuals.map((qual: any) => {
                  const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                  const expiryDate = new Date(qual.ToQualifyUntil || qual.toQualifyUntil);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  let statusClass = '';
                  let statusText = '';

                  statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                  statusText = `Läuft in ${daysUntilExpiry} Tagen ab`;

                  return (
                    <div key={qual.ID} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {qualification?.Name || 'Unbekannte Qualifikation'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Gültig bis: {formatDate(qual.ToQualifyUntil)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 text-sm"
            >
              <option value="all">Alle Abteilungen</option>
              {departmentsData?.map((dept) => (
                <option key={dept.ID} value={dept.Department}>
                  {dept.Department}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {(type === "pending" && expiredQualifications.length > 0) ||
           (type === "expiring" && expiringQualifications.length > 0) ? (
            renderContent()
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {type === "pending" 
                  ? "Keine abgelaufenen Qualifikationen gefunden"
                  : type === "expiring"
                  ? "Keine ablaufenden Qualifikationen in den nächsten 2 Monaten gefunden"
                  : type === "completed"
                  ? "Keine aktiven Qualifikationen gefunden"
                  : "Keine Mitarbeiter gefunden"}
              </p>
            </div>
          ) : (
            <>
              {type === "expiring" && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ablaufende Qualifikationen (nächste 2 Monate)</h3>
                  {filteredEmployees.map((employee) => {
                    const employeeQuals = Array.isArray(allEmployeeQualifications)
                      ? allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID)
                      : [];

                    const relevantQuals = employeeQuals.filter((qual: any) => {
                      const expiryDate = new Date(qual.ToQualifyUntil || qual.toQualifyUntil);
                      const now = new Date();
                      const twoMonthsFromNow = new Date();
                      twoMonthsFromNow.setMonth(now.getMonth() + 2);
                      return expiryDate > now && expiryDate <= twoMonthsFromNow;
                    });

                    if (relevantQuals.length === 0) return null;

                    return (
                      <div key={employee.ID} className="bg-white dark:bg-[#181818] p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {employee.FullName.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{employee.FullName}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{employee.Department}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(employee);
                            }}
                            className="text-sm text-primary hover:text-primary/80"
                          >
                            Details
                          </button>
                        </div>

                        <div className="space-y-2">
                          {relevantQuals.map((qual: any) => {
                            const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                            const expiryDate = new Date(qual.ToQualifyUntil || qual.toQualifyUntil);
                            const now = new Date();
                            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            let statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                            let statusText = `Läuft in ${daysUntilExpiry} Tagen ab`;

                            return (
                              <div
                                key={qual.ID}
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] cursor-pointer"
                                onClick={() => {
                                  setSelectedExpiredQual(qualification || qual);
                                  setSelectedExpiredEmployee(employee);
                                }}
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {qualification?.Name || 'Unbekannte Qualifikation'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Gültig bis: {formatDate(qual.ToQualifyUntil || qual.toQualifyUntil)}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                                  {statusText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {renderContent()}
            </>
          )}
        </div>
      </div>

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
      {selectedExpiredQual && (
        <ExpiredQualificationModal
          qualification={selectedExpiredQual}
          employee={selectedExpiredEmployee}
          onClose={() => {
            setSelectedExpiredQual(null);
            setSelectedExpiredEmployee(null);
          }}
        />
      )}
    </div>
  );
}