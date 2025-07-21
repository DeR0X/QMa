import React, { useState, useMemo } from 'react';
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
  Users,
  UserCheck,
  UserX,
  User,
  GraduationCap
} from 'lucide-react';
import { RootState } from '../store';
import { formatDate } from '../lib/utils';
import { hasHRPermissions } from '../store/slices/authSlice';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/api';

import DocumentUploader from '../components/documents/DocumentUploader';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeQualifications } from '../hooks/useEmployeeQualifications';
import { useQualifications } from '../hooks/useQualifications';
import { useDepartments } from '../hooks/useDepartments';
import { useCompletedTrainings, type CompletedTraining } from '../hooks/useCompletedTrainings';
import { useTrainings } from '../hooks/useTrainings';
import { useQualificationViews } from '../hooks/useQualificationView';
import { useQualificationTrainersByIds } from '../hooks/useQualificationTrainers';
import { useQuery } from '@tanstack/react-query';
import { baseApi } from '../services/apiClient';
import { useTrainingParticipants } from '../hooks/useTrainingParticipants';
import { useTrainingDocuments } from '../hooks/useTrainingDocuments';

const ITEMS_PER_PAGE = 10;

interface TrainingDetailsModalProps {
  training: any;
  onClose: () => void;
  qualificationViews: any;
  qualificationTrainers: any;
  employees: any[];
  qualifications: any[];
}

const TrainingDetailsModal = ({ 
  training, 
  onClose, 
  qualificationViews, 
  qualificationTrainers, 
  employees, 
  qualifications 
}: TrainingDetailsModalProps) => {
  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const { data: trainingParticipantsData } = useTrainingParticipants(training.ID);
  const { data: documentsData } = useTrainingDocuments(training.ID);
  
  const participantCount = trainingParticipantsData?.length || 0;
  const documentCount = documentsData?.length || 0;
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  // Get qualification information
  const qualificationView = training.qualificationID ? qualificationViews[parseInt(training.qualificationID)] : undefined;
  const qualification = qualifications.find(q => q.ID?.toString() === training.qualificationID);
  
  // Get trainer information
  const trainer = training.qualification_TrainerID ? qualificationTrainers[parseInt(training.qualification_TrainerID)] : undefined;
  const trainerEmployee = trainer ? employees.find(e => e.ID === trainer.EmployeeID) : null;

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50 w-screen h-screen">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Schulungsdetails
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {training.Name}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {training.Description}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Teilnehmer
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {participantCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Dokumente
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {documentCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Training Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Trainer
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {trainerEmployee ? trainerEmployee.FullName : 'Kein Trainer zugewiesen'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Abgeschlossen am
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {training.trainingDate ? formatDate(training.trainingDate) : 'Unbekannt'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Qualifikation
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {qualification?.Name || qualificationView?.Name || 'Keine Qualifikation zugewiesen'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <p className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Abgeschlossen
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Participants List */}
          {participantCount > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Teilnehmer ({participantCount})
              </h4>
              <div className="bg-gray-50 dark:bg-[#181818] rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {trainingParticipantsData?.map((participant: any) => (
                  <div key={participant.EmployeeID} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-white dark:bg-gray-600 dark:text-white flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {participant.FirstName?.[0]}{participant.SurName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {participant.FirstName} {participant.SurName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Personalnummer: {participant.StaffNumber || participant.EmployeeID}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Teilgenommen
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents List */}
          {documentCount > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Dokumente ({documentCount})
              </h4>
              <div className="bg-gray-50 dark:bg-[#181818] rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {documentsData?.map((document: any) => (
                  <div key={document.DocumentID} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <button
                            onClick={() => {
                              // Transform API data to match DocumentViewer expectations
                              const transformedDocument = {
                                id: document.DocumentID?.toString() || '',
                                trainingId: training.ID?.toString() || '',
                                fileName: document.FileName || '',
                                fileType: document.FileName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
                                uploadedBy: document.UploadedBy || '',
                                uploadedAt: document.UploadedAt || '',
                                fileUrl: document.FilePath || '',
                                description: document.Description || '',
                                categoryId: document.CategoryID,
                                tags: document.Tags || ''
                              };
                              setSelectedDocument(transformedDocument);
                            }}
                            className="text-left hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors w-full"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary">
                              {document.FileName}
                            </p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              {document.Description && (
                                <p>{document.Description}</p>
                              )}
                              {document.CategoryName && (
                                <p>Kategorie: {document.CategoryName}</p>
                              )}
                              <p>Hochgeladen von: {document.UploadedBy}</p>
                            </div>
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                        {formatDate(document.UploadedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-[#121212] rounded-lg w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {selectedDocument.fileName}
                </h2>
                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(selectedDocument.uploadedAt)}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {selectedDocument.uploadedBy}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={`${API_BASE_URL}/document-download/${selectedDocument.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Dokument herunterladen"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Herunterladen
                </a>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Description */}
            {selectedDocument.description && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-[#181818] border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Beschreibung:</strong> {selectedDocument.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {selectedDocument.tags && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-[#181818] border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Tags:</span>
                  {selectedDocument.tags.split(';').map((tag: string) => tag.trim()).filter((tag: string) => tag).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Content */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-900">
              {selectedDocument.fileName?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`${API_BASE_URL}/document-view/${selectedDocument.id}?`}
                  className="w-full h-full border-0"
                  title={selectedDocument.fileName}
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Vorschau nicht verfügbar
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Für diesen Dateityp ist keine Vorschau verfügbar.
                    </p>
                    <a
                      href={`${API_BASE_URL}/document-download/${selectedDocument.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white dark:bg-blue-600 dark:text-white rounded-lg hover:bg-primary/90 dark:hover:bg-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Dokument herunterladen
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TrainingHistory() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const isHR = hasHRPermissions(employee);
  const isSupervisor = employee?.isSupervisor === 1;
  const canViewOtherEmployees = isHR || isSupervisor;
  
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(
    employee?.ID.toString() || null
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOnlyOwnTrainings, setShowOnlyOwnTrainings] = useState(!canViewOtherEmployees);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);

  const { data: employeesData } = useEmployees( {limit: 1000});
  const { data: qualificationsData } = useQualifications();
  const { data: departmentsData } = useDepartments();
  
  // Get all trainings directly from /api/trainings
  const { data: allTrainings, isLoading: isLoadingTrainings, error: trainingsError } = useTrainings();
  
  // Get training-employee assignments
  const { data: trainingEmployeeAssignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['training-employee-assignments'],
    queryFn: async () => {
      return await baseApi.get<any[]>('/trainings-employee');
    }
  });
  
  // Get completed trainings from useCompletedTrainings for comparison
  const { data: completedTrainingsFromHook } = useCompletedTrainings();
  
  // Filter completed trainings from direct API call and enrich with employee data
  const completedTrainings = useMemo(() => {
    if (!allTrainings || !trainingEmployeeAssignments || !employeesData?.data) return [];
    
    
    // Filter only completed trainings
    const completed = allTrainings.filter(training => training.completed === true);

    
    // Enrich with employee information from assignments
    const enrichedTrainings = [];
    
    for (const training of completed) {
      // Find all employees assigned to this training
      const assignments = trainingEmployeeAssignments.filter(
        (assignment: any) => assignment.TrainingID === training.ID
      );
      
             // Create one entry per employee assignment
       for (const assignment of assignments) {
         const employee = employeesData.data.find(emp => emp.ID === assignment.EmployeeID);
        enrichedTrainings.push({
          ...training,
          employeeId: assignment.EmployeeID.toString(),
          employeeName: employee ? employee.FullName : 'Unbekannter Mitarbeiter',
          employeeDepartment: employee ? employee.DepartmentID : null,
          completedDate: training.trainingDate,
          assignmentId: assignment.ID
        });
      }
    }
    
    return enrichedTrainings;
  }, [allTrainings, trainingEmployeeAssignments, employeesData?.data]);

  const employees = employeesData?.data || [];
  const qualifications = qualificationsData || [];
  const departments = departmentsData || [];

  // Get qualification views for all trainings - memoized to prevent unnecessary re-renders
  const qualificationIds = useMemo(() => 
    completedTrainings
    ?.map(t => t.qualificationID)
    .filter((id): id is string => id !== undefined)
      .map(id => parseInt(id)) || [],
    [completedTrainings]
  );
  const { data: qualificationViews = {} } = useQualificationViews(qualificationIds);

  // Get qualification trainers for all trainings - memoized to prevent unnecessary re-renders
  const qualificationTrainerIds = useMemo(() =>
    completedTrainings
    ?.map(t => t.qualification_TrainerID)
    .filter((id): id is string => id !== undefined)
      .map(id => parseInt(id)) || [],
    [completedTrainings]
  );
  const { data: qualificationTrainers = {} } = useQualificationTrainersByIds(qualificationTrainerIds);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    let filtered = employees;

    // If supervisor (but not HR), only show their direct reports and themselves
    if (isSupervisor && !isHR) {
      filtered = filtered.filter(emp => 
        emp.SupervisorID?.toString() === employee?.StaffNumber?.toString() ||
        emp.ID.toString() === employee?.ID.toString()
      );
    }

    // Filter by department if selected
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.DepartmentID?.toString() === selectedDepartment);
    }

    // Filter by active status if user can view other employees
    if (canViewOtherEmployees && showActiveOnly) {
      filtered = filtered.filter(emp => Number(emp.isActive) === 1);
    }

    return filtered;
  }, [employees, selectedDepartment, canViewOtherEmployees, showActiveOnly, isSupervisor, isHR, employee]);

  const filteredTrainings = useMemo(() => {
    if (!completedTrainings) return [];



    return completedTrainings.filter((training: any) => {
      // If supervisor (but not HR), only show trainings for their direct reports and themselves
      if (isSupervisor && !isHR) {
        const trainingEmployee = employees.find(emp => emp.ID.toString() === training.employeeId);
        if (!trainingEmployee) return false;
        
        const isOwnTraining = training.employeeId === employee?.ID.toString();
        const isDirectReport = trainingEmployee.SupervisorID?.toString() === employee?.StaffNumber?.toString();
        
        if (!isOwnTraining && !isDirectReport) {
          return false;
        }
      }

      // Filter by own trainings if showOnlyOwnTrainings is enabled
      if (showOnlyOwnTrainings && training.employeeId !== employee?.ID.toString()) {
        return false;
      }

      // Filter by selected employee if specific employee is selected
      if (selectedEmployee && training.employeeId !== selectedEmployee) {
        return false;
      }

      // Filter by department
      if (selectedDepartment) {
        const trainingEmployee = employees.find(emp => emp.ID.toString() === training.employeeId);
        if (!trainingEmployee || trainingEmployee.DepartmentID?.toString() !== selectedDepartment) {
          return false;
        }
      }

      // Filter by search term
      const matchesSearch = training.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [completedTrainings, showOnlyOwnTrainings, selectedEmployee, selectedDepartment, searchTerm, employees, isSupervisor, isHR, employee]);

  const paginatedTrainings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTrainings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTrainings, currentPage]);

  const totalPages = Math.ceil(filteredTrainings.length / ITEMS_PER_PAGE);

  // Check if user has permission to access training history
  if (!isHR && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Keine Berechtigung
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sie haben keine Berechtigung, die Schulungshistorie einzusehen.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoadingTrainings) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Lade Schulungshistorie...
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bitte warten Sie einen Moment.
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (trainingsError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Fehler beim Laden
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Die Schulungshistorie konnte nicht geladen werden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Schulungshistorie 
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Überblick über alle erfolgten Schulungen
            {filteredTrainings.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                {filteredTrainings.length} abgeschlossen
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Award className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {canViewOtherEmployees && (
              <>
                {isHR && (
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
                )}

                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  disabled={showOnlyOwnTrainings}
                  className={`block w-full sm:w-64 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white ${
                    showOnlyOwnTrainings ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">
                    {isSupervisor && !isHR ? 'Mitarbeiter auswählen (Ihre Mitarbeiter)' : 'Mitarbeiter auswählen'}
                  </option>
                  {filteredEmployees.map((emp) => (
                    <option key={emp.ID} value={emp.ID.toString()}>
                      {emp.FullName} ({emp.StaffNumber})
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showOnlyOwnTrainings}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShowOnlyOwnTrainings(checked);
                        // Wenn "Nur eigene Schulungen" aktiviert wird, setze die Mitarbeiterauswahl auf den aktuellen Benutzer
                        if (checked) {
                          setSelectedEmployee(employee?.ID.toString() || null);
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {isSupervisor && !isHR ? 'Nur eigene Schulungen anzeigen' : 'Nur eigene Schulungen anzeigen'}
                    </span>
                  </label>

                  {isHR && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showActiveOnly}
                        onChange={(e) => setShowActiveOnly(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Nur aktive Mitarbeiter
                      </span>
                    </label>
                  )}
                </div>
              </>
            )}

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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schulung
                </th>
                {!showOnlyOwnTrainings && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qualifikation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trainer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Abgeschlossen am
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#121212] divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTrainings.map((training: any) => {
              
                // Get qualification information
                const qualificationView = training.qualificationID ? qualificationViews[parseInt(training.qualificationID)] : undefined;
                const qualification = qualifications.find(q => q.ID?.toString() === training.qualificationID);
                
                // Get trainer information
                const trainer = training.qualification_TrainerID ? qualificationTrainers[parseInt(training.qualification_TrainerID)] : undefined;
                const trainerEmployee = trainer ? employees.find(e => e.ID === trainer.EmployeeID) : null;
                
                return (
                  <tr 
                    key={`${training.ID}-${training.employeeId}-${training.assignmentId}`} 
                    className="hover:bg-gray-50 dark:hover:bg-[#181818] cursor-pointer"
                    onClick={() => setSelectedTraining(training)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {training.Name || 'Unbekannt'}
                          </div>
                          {qualificationView?.Herkunft && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              qualificationView.Herkunft === 'Pflicht' 
                                ? 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                                : qualificationView.Herkunft === 'Job'
                                ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400'
                            }`}>
                              {qualificationView.Herkunft === 'Job' ? 'Position' : qualificationView.Herkunft}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {training.Description || 'Keine Beschreibung'}
                        </div>
                      </div>
                    </td>
                    {!showOnlyOwnTrainings && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {training.employeeName || 'Unbekannt'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {qualification?.Name || qualificationView?.Name || 'Unbekannte Qualifikation'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {trainerEmployee ? trainerEmployee.FullName : 'Kein Trainer zugewiesen'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {training.trainingDate ? formatDate(training.trainingDate) : 'Unbekannt'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Abgeschlossen
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedTrainings.length === 0 && (
            <div className="text-center py-8">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Keine abgeschlossenen Schulungen gefunden
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Versuchen Sie die Suchkriterien anzupassen' : 'Es wurden noch keine Schulungen abgeschlossen'}
              </p>
            </div>
          )}
        </div>

        {filteredTrainings.length > ITEMS_PER_PAGE && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vorherige
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nächste
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Zeige{' '}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTrainings.length)}
                  </span>{' '}
                  bis{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTrainings.length)}
                  </span>{' '}
                  von{' '}
                  <span className="font-medium">{filteredTrainings.length}</span>{' '}
                  Ergebnissen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181818] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Vorherige</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    const shouldShow = 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 1;
                    
                    if (!shouldShow) {
                      // Show ellipsis if there's a gap
                      if (page === 2 && currentPage > 3) {
                        return (
                          <span key={`ellipsis-start`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181818] text-sm font-medium text-gray-700 dark:text-gray-300">
                            ...
                          </span>
                        );
                      }
                      if (page === totalPages - 1 && currentPage < totalPages - 2) {
                        return (
                          <span key={`ellipsis-end`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181818] text-sm font-medium text-gray-700 dark:text-gray-300">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-primary text-white dark:bg-gray-800 dark:text-gray-200 hover:bg-primary/90 dark:hover:bg-gray-700'
                            : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181818] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Training Details Modal */}
      {selectedTraining && (
        <TrainingDetailsModal
          training={selectedTraining}
          onClose={() => setSelectedTraining(null)}
          qualificationViews={qualificationViews}
          qualificationTrainers={qualificationTrainers}
          employees={employees}
          qualifications={qualifications}
        />
      )}
    </div>
  );
}