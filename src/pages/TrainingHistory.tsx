import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Search,
  FileText,
  Download,
  Calendar,
  CheckCircle,
  Upload,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  Award,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';
import { RootState } from '../store';
import { formatDate } from '../lib/utils';
import { hasHRPermissions } from '../store/slices/authSlice';
import { toast } from 'sonner';
import DocumentViewer from '../components/documents/DocumentViewer';
import DocumentUploader from '../components/documents/DocumentUploader';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeQualifications } from '../hooks/useEmployeeQualifications';
import { useQualifications } from '../hooks/useQualifications';
import { useDepartments } from '../hooks/useDepartments';

const ITEMS_PER_PAGE = 10;

export default function TrainingHistory() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const isHR = hasHRPermissions(employee);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(
    employee?.ID.toString() || null
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: employeesData } = useEmployees();
  const { data: qualificationsData } = useQualifications();
  const { data: departmentsData } = useDepartments();
  const { data: employeeQualificationsData } = useEmployeeQualifications(selectedEmployee || '');

  const employees = employeesData?.data || [];
  const qualifications = qualificationsData || [];
  const departments = departmentsData || [];

  const filteredQualifications = useMemo(() => {
    if (!employeeQualificationsData) return [];

    return employeeQualificationsData.filter(qual => {
      const qualification = qualifications.find(q => q.ID?.toString() === qual.QualificationID);
      if (!qualification) return false;

      const matchesSearch = qualification.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qualification.Description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [employeeQualificationsData, qualifications, searchTerm]);

  const paginatedQualifications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQualifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQualifications, currentPage]);

  const totalPages = Math.ceil(filteredQualifications.length / ITEMS_PER_PAGE);

  const getQualificationStatus = (qualifiedUntil: string) => {
    const expiryDate = new Date(qualifiedUntil);
    const now = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(now.getMonth() + 2);

    if (expiryDate <= now) {
      return {
        label: 'Abgelaufen',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: AlertCircle
      };
    } else if (expiryDate <= twoMonthsFromNow) {
      return {
        label: 'Läuft bald ab',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Clock
      };
    } else {
      return {
        label: 'Aktiv',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle
      };
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Qualifikationshistorie
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Überblick über alle erworbenen Qualifikationen
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
          >
            <Upload className="h-5 w-5 mr-2" />
            Zertifikat hochladen
          </button>
          <Award className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {isHR && (
              <>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full sm:w-48 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                >
                  <option value="">Alle Abteilungen</option>
                  {departments.map((dept) => (
                    <option key={dept.ID} value={dept.ID.toString()}>
                      {dept.Department}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="block w-full sm:w-64 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                >
                  <option value="">Mitarbeiter auswählen</option>
                  {employees
                    .filter(emp => !selectedDepartment || emp.DepartmentID?.toString() === selectedDepartment)
                    .map((emp) => (
                      <option key={emp.ID} value={emp.ID.toString()}>
                        {emp.FullName} ({emp.StaffNumber})
                      </option>
                    ))}
                </select>
              </>
            )}

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Qualifikationen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qualifikation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gültig von
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gültig bis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zertifikat
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#121212] divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedQualifications.map((qual) => {
                const qualification = qualifications.find(q => q.ID?.toString() === qual.QualificationID);
                const status = getQualificationStatus(qual.toQualifyUntil);
                const StatusIcon = status.icon;

                return (
                  <tr key={qual.ID}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {qualification?.Name || 'Unbekannte Qualifikation'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {qualification?.Description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(qual.qualifiedFrom)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(qual.toQualifyUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {qual.certificateUrl ? (
                        <button
                          onClick={() => setSelectedDocument(qual.certificateUrl)}
                          className="text-primary hover:text-primary/90"
                        >
                          Anzeigen
                        </button>
                      ) : (
                        'Nicht verfügbar'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedQualifications.length === 0 && (
            <div className="text-center py-8">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Keine Qualifikationen gefunden
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Versuchen Sie die Suchkriterien anzupassen' : 'Es wurden noch keine Qualifikationen erworben'}
              </p>
            </div>
          )}
        </div>

        {filteredQualifications.length > ITEMS_PER_PAGE && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Vorherige
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Nächste
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Zeige{' '}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredQualifications.length)}
                  </span>{' '}
                  bis{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredQualifications.length)}
                  </span>{' '}
                  von{' '}
                  <span className="font-medium">{filteredQualifications.length}</span>{' '}
                  Ergebnissen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="sr-only">Vorherige</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="sr-only">Nächste</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedDocument && (
        <DocumentViewer
          document={{
            id: '1',
            fileName: 'Zertifikat',
            fileType: 'application/pdf',
            fileUrl: selectedDocument,
            uploadedBy: '',
            uploadedAt: '',
          }}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {showUploadModal && (
        <DocumentUploader
          trainingId="1"
          onClose={() => setShowUploadModal(false)}
          onUpload={(file) => {
            toast.success('Zertifikat erfolgreich hochgeladen');
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}