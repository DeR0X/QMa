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

  // Filter employees based on their qualification status and selected filters
  const filteredEmployees = employees.filter((employee) => {
    // Get qualifications for this employee
    const employeeQuals = Array.isArray(allEmployeeQualifications)
      ? allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID)
      : [];

    for (let i = 0; i < allEmployeeQualifications.length; i++) {
      for (let q = 0; q < qualificationsData.length; q++) {
        if(allEmployeeQualifications[i].QualificationID === qualificationsData[q].ID){
          
        }
      }

    }
    
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
  }).sort((a, b) => {
    // Sort by most recently expired qualifications first
    const aQuals = allEmployeeQualifications?.filter((qual: any) => 
      qual.EmployeeID === a.ID.toString()
    ) || [];
    const bQuals = allEmployeeQualifications?.filter((qual: any) => 
      qual.EmployeeID === b.ID.toString()
    ) || [];
    
    const aExpiredDates = aQuals
      .map((qual: any) => new Date(qual.ToQualifyUntil))
      .filter((date:any)  => date <= new Date())
      .sort((d1:any, d2:any) => d2.getTime() - d1.getTime());
    
    const bExpiredDates = bQuals
      .map((qual: any) => new Date(qual.ToQualifyUntil))
      .filter((date:any)  => date <= new Date())
      .sort((d1:any, d2:any) => d2.getTime() - d1.getTime());
    
    // Compare the most recent expired date
    if (aExpiredDates.length && bExpiredDates.length) {
      return bExpiredDates[0].getTime() - aExpiredDates[0].getTime();
    }
    
    // If one has expired qualifications and the other doesn't
    if (aExpiredDates.length) return -1;
    if (bExpiredDates.length) return 1;
    
    // If neither has expired qualifications, sort by name
    return a.FullName.localeCompare(b.FullName);
  });


  const totalItems = allEmployeeQualifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedEmployees = allEmployeeQualifications.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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

        <div className="flex-1 overflow-auto min-h-0 p-4 sm:p-6">
        {paginatedEmployees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {type === "pending" 
                ? "Keine Mitarbeiter mit abgelaufenen Qualifikationen gefunden"
                : "Keine Mitarbeiter gefunden"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-[#181818]">
                      <tr>
                        <th className="py-2 pl-4 pr-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                          Mitarbeiter
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          Abteilung
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          Qualifikationen & Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#141616]">
                        {paginatedEmployees.map((employee : any) => {
                        if (!employee) return null;

                        const department = departmentsData?.find(
                          (d) => d.Department === employee.Department,
                        );

                        const employeeQuals = Array.isArray(allEmployeeQualifications)
                          ? allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID)
                          : [];

                        const initials = employee.FullName
                          ? employee.FullName.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                          : "??";

                          const displayQuals = type === "pending"
                  ? employeeQuals.filter((qual: any) => {
                      const expiryDate = new Date(qual.toQualifyUntil);
                      return expiryDate <= new Date();
                    })
                  : employeeQuals;

                  return (
                    <tr
                      key={employee.ID}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                        type === "pending" ? "bg-red-50 dark:bg-red-900/10" : ""
                      }`}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                            <td className="whitespace-nowrap py-2 pl-4 pr-3 sm:pl-6">
                              <div className="flex items-center">
                                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary text-white flex items-center justify-center">
                                  <span className="text-xs sm:text-sm font-medium">
                                    {initials}
                                  </span>
                                </div>
                                <div className="ml-2">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                    {employee.FullName}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    {employee.StaffNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                              {department?.Department || "-"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="space-y-2">
                              {displayQuals.map((qual: any, index: number) => {
                          const qualification = qualificationsData?.find(
                            (q) => q.ID === parseInt(qual.QualificationID)
                          );
                                  
                                  const expiryDate = new Date(qual.ToQualifyUntil);
                                  const now = new Date();
                                  const daysExpired = Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));

                                  return (
                                    <div key={index} className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <Award className="h-4 w-4 mr-1 text-primary" />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                          {qualification?.Name || 'Unbekannte Qualifikation'}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {type === "pending" 
                                            ? `Abgelaufen seit ${daysExpired} Tagen`
                                            : `Gültig bis: ${formatDate(qual.ToQualifyUntil)}`}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Abgelaufen
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {!selectedEmployee && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                Zeige{" "}
                <span className="font-medium">
                  {startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-medium">
                  {endIndex}
                </span>{" "}
                von <span className="font-medium">{totalItems}</span>{" "}
                Ergebnissen
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zurück
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                </button>
              </div>
            </div>
          </div>
        )}
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
    </div>
  );
}
