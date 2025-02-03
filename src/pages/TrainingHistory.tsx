import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Search, FileText, Download, Calendar, CheckCircle, Upload, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { RootState } from '../store';
import { users, bookings, trainings, trainingDocuments } from '../data/mockData';
import { formatDate } from '../lib/utils';
import { hasHRPermissions } from '../store/slices/authSlice';
import { toast } from 'sonner';
import DocumentViewer from '../components/documents/DocumentViewer';
import DocumentUploader from '../components/documents/DocumentUploader';
import type { TrainingDocument } from '../types';

const ITEMS_PER_PAGE = 10;

export default function TrainingHistory() {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState<string | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');
  const [selectedDocument, setSelectedDocument] = useState<TrainingDocument | null>(null);

  const isHR = hasHRPermissions(currentUser);

  const departments = useMemo(() => {
    return Array.from(new Set(users.map(user => user.department)));
  }, []);

  const years = useMemo(() => {
    return Array.from(new Set(bookings
      .filter(b => b.completedAt)
      .map(b => new Date(b.completedAt!).getFullYear())
    )).sort((a, b) => b - a);
  }, []);

  const completedTrainings = useMemo(() => {
    const filtered = bookings
      .filter(booking => {
        const matchesUser = selectedEmployee === 'all' || booking.userId === selectedEmployee;
        const matchesStatus = booking.status === 'abgeschlossen';
        const user = users.find(u => u.id === booking.userId);
        const matchesDepartment = selectedDepartment === 'all' || user?.department === selectedDepartment;
        const matchesYear = selectedYear === 'all' || 
          (booking.completedAt && new Date(booking.completedAt).getFullYear().toString() === selectedYear);
        
        return matchesUser && matchesStatus && matchesDepartment && matchesYear;
      })
      .map(booking => {
        const training = trainings.find(t => t.id === booking.trainingId);
        const user = users.find(u => u.id === booking.userId);
        return {
          ...booking,
          training,
          user,
        };
      })
      .filter(item => 
        item.training?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return filtered;
  }, [selectedEmployee, selectedDepartment, selectedYear, searchTerm]);

  const totalPages = Math.ceil(completedTrainings.length / ITEMS_PER_PAGE);
  const paginatedTrainings = completedTrainings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFileUpload = (trainingId: string, file: File, description: string) => {
    const newDocument: TrainingDocument = {
      id: Date.now().toString(),
      trainingId,
      fileName: file.name,
      fileType: file.type,
      uploadedBy: currentUser?.id || '',
      uploadedAt: new Date().toISOString(),
      fileUrl: URL.createObjectURL(file),
      description,
    };

    toast.success(`Dokument "${file.name}" erfolgreich hochgeladen`);
    setShowUploadModal(false);
    setSelectedTraining(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Schulungshistorie
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Übersicht aller abgeschlossenen Schulungen
          </p>
        </div>
        <FileText className="h-8 w-8 text-primary" />
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] max-w-[400px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suche..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {isHR && (
              <>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-40 pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-[#181818] dark:text-white"
                >
                  <option value="all">Alle Abteilungen</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={selectedEmployee}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-40 pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-[#181818] dark:text-white"
                >
                  <option value="all">Alle Mitarbeiter</option>
                  {users
                    .filter(user => selectedDepartment === 'all' || user.department === selectedDepartment)
                    .map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </>
            )}

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-32 pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-[#181818] dark:text-white"
            >
              <option value="all">Alle Jahre</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={completedTrainings.length === 0 ? '' : 'overflow-x-auto'}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schulung
                </th>
                {isHR && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Abschlussdatum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dokumente
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
              {paginatedTrainings.length === 0 ? (
                <tr>
                  <td colSpan={isHR ? 5 : 4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Keine Einträge gefunden
                  </td>
                </tr>
              ) : (
                paginatedTrainings.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.training?.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.training?.trainer}
                      </div>
                    </td>
                    {isHR && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {item.user?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.user?.department}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(item.completedAt!)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Abgeschlossen
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {trainingDocuments
                          .filter(doc => doc.trainingId === item.trainingId)
                          .map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => setSelectedDocument(doc)}
                              className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"
                              title={doc.fileName}
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          ))}
                        {isHR && (
                          <button
                            onClick={() => {
                              setSelectedTraining(item.trainingId);
                              setShowUploadModal(true);
                            }}
                            className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Upload className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || completedTrainings.length === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || completedTrainings.length === 0}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {completedTrainings.length > 0 ? (
                  <>
                    Zeige{' '}
                    <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, completedTrainings.length)}
                    </span>
                    {' '}von{' '}
                    <span className="font-medium">{completedTrainings.length}</span>
                    {' '}Ergebnissen
                  </>
                ) : 'Keine Ergebnisse'}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || completedTrainings.length === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181818] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => {
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return [
                        <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181818] text-sm font-medium text-gray-700 dark:text-gray-300">
                          ...
                        </span>,
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-primary text-white'
                              : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                          }`}
                        >
                          {page}
                        </button>
                      ];
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-primary text-white'
                            : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || completedTrainings.length === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181818] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {showUploadModal && selectedTraining && (
        <DocumentUploader
          trainingId={selectedTraining}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedTraining(null);
          }}
          onUpload={(file, description) => handleFileUpload(selectedTraining, file, description)}
        />
      )}
    </div>
  );
}