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
  ChevronRight
} from 'lucide-react';
import { RootState } from '../store';
import { formatDate } from '../lib/utils';
import { hasHRPermissions } from '../store/slices/authSlice';
import { toast } from 'sonner';
import DocumentViewer from '../components/documents/DocumentViewer';
import DocumentUploader from '../components/documents/DocumentUploader';
import { useEmployees } from '../hooks/useEmployees';
import { useTrainings } from '../hooks/useTrainings';
import { useBookings } from '../hooks/useBookings';

const ITEMS_PER_PAGE = 10;

// Generate years array from 2020 to current year
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

export default function TrainingHistory() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const isHR = hasHRPermissions(employee);

  const { data: employeesData } = useEmployees();
  const { data: trainingsData } = useTrainings();
  const { data: bookingsData } = useBookings();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const employees = employeesData?.data || [];
  const trainings = trainingsData || [];
  const bookings = bookingsData || [];

  const filteredHistory = useMemo(() => {
    return bookings.filter(booking => {
      const training = trainings.find(t => t.id === booking.trainingId);
      const bookingYear = new Date(booking.createdAt).getFullYear();

      return (
        bookingYear === selectedYear &&
        (searchTerm === '' ||
          training?.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [bookings, trainings, selectedYear, searchTerm]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Schulungshistorie
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Überblick über alle absolvierten Schulungen
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
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Schulungen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-[#121212] text-gray-900 dark:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schulung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Datum
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
              {paginatedHistory.map((booking) => {
                const training = trainings.find(t => t.id === booking.trainingId);
                return (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {training?.title || 'Unbekannte Schulung'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(new Date(booking.completedAt))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {booking.certificateUrl ? (
                        <button
                          onClick={() => setSelectedDocument(booking.certificateUrl)}
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
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
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
                  {Math.min(
                    (currentPage - 1) * ITEMS_PER_PAGE + 1,
                    filteredHistory.length
                  )}
                </span>{' '}
                bis{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)}
                </span>{' '}
                von{' '}
                <span className="font-medium">{filteredHistory.length}</span>{' '}
                Ergebnissen
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
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
      </div>

      {selectedDocument && (
        <DocumentViewer
          documentUrl={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {showUploadModal && (
        <DocumentUploader
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