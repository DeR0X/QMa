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
  const { data: departmentsData } = useDepartments();
  const { data: jobTitlesData } = useJobTitles();
  const { data: qualificationsData } = useQualifications();
  const { data: allEmployeeQualifications } = useEmployeeQualifications();

  const itemsPerPage = 10;

  // Filter employees based on their qualification status
  const filteredEmployees = employees.filter((employee) => {
    const employeeQuals = allEmployeeQualifications?.[employee.ID] || [];
    console.log(allEmployeeQualifications);
    switch (type) {
      case "completed":
        // Show employees with active qualifications
        return employeeQuals.some((qual: any) => {
          const expiryDate = new Date(qual.toQualifyUntil);
          return expiryDate > new Date();
        });
  
      case "expiring":
        // Show employees with qualifications expiring in the next 2 months
        return employeeQuals.some((qual: any) => {
          const expiryDate = new Date(qual.toQualifyUntil);
          const twoMonthsFromNow = new Date();

          twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
          return expiryDate <= twoMonthsFromNow && expiryDate > new Date();
        });

  
      case "pending":
        // Show employees with expired qualifications
        return employeeQuals.some((qual: any) => {
          const expiryDate = new Date(qual.toQualifyUntil);
          return expiryDate <= new Date();

        });
  
      default:
        return true;
    }
  });
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

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
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto min-h-0 p-4 sm:p-6">
          {paginatedEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keine Mitarbeiter gefunden
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
                          Qualifikationen
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#141616]">
                      {paginatedEmployees.map((employee) => {
                        if (!employee) return null;

                        const department = departmentsData?.find(
                          (d) => d.Department === employee.Department,
                        );

                        const employeeQuals = allEmployeeQualifications?.[employee.ID] || [];
                        const initials = employee.FullName
                          ? employee.FullName.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                          : "??";

                        // Get qualification status for display
                        const qualStatus = employeeQuals.map((qual: any) => {
                          const expiryDate = new Date(qual.ToQualifyUntil);
                          const now = new Date();
                          const twoMonthsFromNow = new Date();
                          twoMonthsFromNow.setMonth(now.getMonth() + 2);

                          if (expiryDate <= now) {
                            return {
                              status: "expired",
                              icon: AlertCircle,
                              text: "Abgelaufen",
                              class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                            };
                          } else if (expiryDate <= twoMonthsFromNow) {
                            return {
                              status: "expiring",
                              icon: Clock,
                              text: "Läuft bald ab",
                              class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                            };
                          } else {
                            return {
                              status: "active",
                              icon: CheckCircle,
                              text: "Aktiv",
                              class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            };
                          }
                        });

                        return (
                          <tr
                            key={employee.ID}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
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
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              <div className="space-y-1">
                                {employeeQuals.map((qual: any, index: number) => {
                                  const qualification = qualificationsData?.find(
                                    (q) => q.ID === parseInt(qual.QualificationID)
                                  );
                                  return (
                                    <div key={index} className="flex items-center">
                                      <Award className="h-4 w-4 mr-1 text-primary" />
                                      <span>{qualification?.Name || 'Unbekannte Qualifikation'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="space-y-1">
                                {qualStatus.map((status : any, index : any) => {
                                  const StatusIcon = status.icon;
                                  return (
                                    <span
                                      key={index}
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}
                                    >
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {status.text}
                                    </span>
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
                  disabled={currentPage === totalPages}
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