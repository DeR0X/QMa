import { useState } from 'react';
import { X, CheckCircle, Clock, AlertCircle, Users, Calendar, Building2, Award } from 'lucide-react';
import { departments, jobTitles, trainings, bookings, qualifications, employeeQualifications } from '../../data/mockData';
import { formatDate } from '../../lib/utils';
import EmployeeDetails from '../employees/EmployeeDetails';

const ITEMS_PER_PAGE = 10;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  employees: Array<any>;
  type: 'all' | 'completed' | 'pending' | 'expiring';
}

export default function StatisticsModal({ isOpen, onClose, title, employees, type }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const totalItems = employees.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedEmployees = employees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            Abgeschlossen
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-4 h-4 mr-1" />
            Ausstehend
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Ablaufend
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Mobile-first: Standardmäßig klein, ab sm: breiter */}
      <div className="bg-white dark:bg-[#121212] rounded-lg w-full max-w-md sm:max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6">
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
                          Position
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          Details
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#141616]">
                      {paginatedEmployees.map((employee) => (
                        <tr 
                          key={employee.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          <td className="whitespace-nowrap py-2 pl-4 pr-3 sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary text-white flex items-center justify-center">
                                <span className="text-xs sm:text-sm font-medium">
                                  {employee.fullName.split(' ').map((n: string) => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-2">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                  {employee.fullName}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  {employee.staffNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                            {departments.find(d => d.id === employee.departmentID)?.department || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                            {jobTitles.find(jt => jt.id === employee.jobTitleID)?.jobTitle || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {type === 'expiring' && employee.expiringQualifications?.map((qual: any) => (
                              <div key={qual.id}>
                                {qual.name} – Läuft ab am {new Date(qual.expirationDate).toLocaleDateString()}
                              </div>
                            ))}
                            {type === 'completed' && (
                              <div>{employee.completedTrainings} abgeschlossene Schulungen</div>
                            )}
                            {type === 'pending' && (
                              <div>{employee.pendingTrainings} ausstehende Schulungen</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                            {getStatusBadge(type)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {!selectedEmployee && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                Zeige{' '}
                <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                {' '}-{' '}
                <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span>
                {' '}von{' '}
                <span className="font-medium">{totalItems}</span> Ergebnissen
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* Employee Details Modal */}
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