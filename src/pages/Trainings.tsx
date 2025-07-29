import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { 
  Search, Calendar, Clock, CheckCircle, XCircle, 
  AlertCircle, GraduationCap, Plus, Award, Info, X, User, Edit2, Trash2, Building2, FileText, ChevronDown, ChevronUp, Users,
  Zap
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import type { Training } from '../types';
import { formatDate, formatDuration } from '../lib/utils';
import { toast } from 'sonner';
import AddTrainingModal from '../components/trainings/AddTrainigModal';
import TrainingDocumentUploader from '../components/trainings/TrainingDocumentUploader';
import { hasHRPermissions, hasPermission } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { useEmployees } from '../hooks/useEmployees';
import { useTrainings } from '../hooks/useTrainings';
import { useQualifications } from '../hooks/useQualifications';
import { useQualificationViews } from '../hooks/useQualificationView';
import { useQualificationTrainersByIds } from '../hooks/useQualificationTrainers';
import apiClient from '../services/apiClient';
import QuickTrainingModal from '../components/trainings/QuickTrainingModal';

// Define the Employee type
interface Employee {
  ID: number;
  FullName: string;
  DepartmentID?: number;
  role?: string;
  SupervisorID?: number;
  AccessRight?: string;
  AccessRightID?: number;
}

interface Participant {
  id: number;
  name: string;
  trainingName: string;
  trainingDescription: string;
}

export default function Trainings() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { employee } = useSelector((state: RootState) => state.auth);
  const { data: employeesData } = useEmployees({ limit: 1000 });
  const employees = Array.isArray(employeesData?.data) ? employeesData.data : [];
  const { data: trainings = [] } = useTrainings();
  const { data: qualifications = [] } = useQualifications();
  const { data: trainingParticipantsData = [] } = useQuery({
    queryKey: ['trainingParticipants'],
    queryFn: async () => {
      return await apiClient.get('/trainings-employee') as any[];
    }
  });

  if (!employee) return null;
  
  const isHR = hasHRPermissions(employee);
  const isAdmin = hasPermission(employee, 'admin');
  const isSupervisor = employee.isSupervisor === 1;
  const canCreateTraining = isHR || isSupervisor;
  const canRemoveParticipants = isHR || isAdmin; // Only HR and Admin can remove participants



  // Fetch all qualification views at once - memoized to prevent unnecessary re-renders
  const qualificationIds = useMemo(() => 
    trainings
      .map(t => t.qualificationID)
      .filter((id): id is string => id !== undefined)
      .map(id => parseInt(id)),
    [trainings]
  );
  const { data: qualificationViews = {} } = useQualificationViews(qualificationIds);

  // Fetch all qualification trainers at once - memoized to prevent unnecessary re-renders
  const qualificationTrainerIds = useMemo(() =>
    trainings
      .map(t => t.qualification_TrainerID)
      .filter((id): id is string => id !== undefined)
      .map(id => parseInt(id)),
    [trainings]
  );
  const { data: qualificationTrainers = {} } = useQualificationTrainersByIds(qualificationTrainerIds);

  const [searchTerm, setSearchTerm] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [showAllParticipantsModal, setShowAllParticipantsModal] = useState(false);

  const [selectedQualification, setSelectedQualification] = useState<string | null>(null);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [selectedTrainingForDocs, setSelectedTrainingForDocs] = useState<Training | null>(null);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [expandedTrainingId, setExpandedTrainingId] = useState<number | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedTrainingForParticipants, setSelectedTrainingForParticipants] = useState<Training | null>(null);


  const showAllParticipants = () => {
    setShowAllParticipantsModal(true);
  }

  const handleShowParticipantsModal = (training: Training, participants: Participant[]) => {
  setSelectedTrainingForParticipants(training);
  setSelectedParticipants(participants);
  setShowParticipantsModal(true);
};

  const closeAllParticipants = () => {
    setShowAllParticipantsModal(false);
  }
  // Filter employees based on supervisor role
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    if (isHR) {
      return employees;
    }

    if (employee.isSupervisor === 1) {
      // Show employees where the current user is their supervisor (using StaffNumber), plus the supervisor themselves
      const supervisedEmployees = employees.filter(emp => 
        emp.SupervisorID?.toString() === employee.StaffNumber?.toString()
      );
      
      // Add the supervisor themselves if not already in the list
      const supervisorInList = supervisedEmployees.some(emp => emp.ID.toString() === employee.ID.toString());
      if (!supervisorInList) {
        const supervisorData = employees.find(emp => emp.ID.toString() === employee.ID.toString());
        if (supervisorData) {
          supervisedEmployees.push(supervisorData);
        }
      }
      
      return supervisedEmployees;
    }

    // Regular employees only see themselves
    return employees.filter(emp => 
      emp.ID.toString() === employee?.ID.toString()
    );
  }, [employees, isHR, employee]);

  // Update the filtered trainings to include supervisor's team and regular employee access
  const filteredTrainings = trainings.filter(training => {
    if (!training) return false;
    
    // Filter out completed trainings
    if (training.completed) return false;
    
    const title = training.Name?.toLowerCase() || '';
    const description = training.Description?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    const qualificationView = training.qualificationID ? qualificationViews[parseInt(training.qualificationID)] : undefined;
    const isMandatory = qualificationView?.Herkunft === 'Pflicht';
    
    // Check if training is overdue (date is today or in the past AND not completed)
    const isOverdue = training.trainingDate && !training.completed && 
                     new Date(training.trainingDate) <= new Date();
    
    const matchesSearch = title.includes(searchLower) || 
                         description.includes(searchLower);
    const matchesQualification = !selectedQualification || 
                               training.qualificationID?.toString() === selectedQualification;
    const matchesOverdue = !showOverdueOnly || isOverdue;
    
    // Base filtering for search and qualification criteria
    const baseMatch = matchesSearch && matchesQualification && matchesOverdue;
    
    // HR can see all trainings
    if (isHR) {
      return baseMatch;
    }
    
    // If user is a supervisor, show trainings for their team
    if (employee.isSupervisor === 1) {
      const isForTeamDepartment = !training.department || 
                                 training.department === employee.Department ||
                                 filteredEmployees.some(emp => emp.Department === training.department);
      return baseMatch && isForTeamDepartment;
    }
    
    // Regular employees can see:
    // 1. Mandatory trainings (Pflicht)
    // 2. Trainings targeted to their department
    // 3. All other trainings (for general visibility)
    const isForEmployeeDepartment = !training.department || 
                                   training.department === employee.Department;
    
    // Show training if it's mandatory, for their department, or if no specific department targeting (general training)
    const isRelevantToEmployee = isMandatory || isForEmployeeDepartment;
    
    return baseMatch && isRelevantToEmployee;
  });

  type StatusType = 'ausstehend' | 'genehmigt' | 'abgelehnt' | 'abgeschlossen';

  const getStatusIcon = (status: StatusType) => {
    const icons: Record<StatusType, typeof Calendar> = {
      ausstehend: Calendar,
      genehmigt: CheckCircle,
      abgelehnt: X,
      abgeschlossen: Award
    };
    return icons[status] || Info;
  };

  const getStatusColor = (status: StatusType) => {
    const colors: Record<StatusType, string> = {
      ausstehend: 'text-yellow-500',
      genehmigt: 'text-green-500',
      abgelehnt: 'text-red-500',
      abgeschlossen: 'text-blue-500'
    };
    return colors[status] || 'text-gray-500';
  };

  // Helper function to get the correct date for a training
  const getTrainingDate = (training: Training) => {
    if (training.completed && training.completedDate) {
      return training.completedDate;
    }
    return training.trainingDate;
  };

  const getTrainingSessions = (training: Training) => {
    if (!training) return [];
    return [{
      id: training.ID,
      date: new Date(getTrainingDate(training) || ''),
      status: training.completed ? 'abgeschlossen' as StatusType : 'ausstehend' as StatusType,
      isAssigned: training.isAssigned || false
    }];
  };

  const handleAddTraining = async (newTraining: Omit<Training, 'ID'> & { targetAudience?: string[] }) => {
    try {
      if (!Array.isArray(employees)) {
        console.error('Employees is not an array');
        return;
      }

      const qualificationView = newTraining.qualificationID ? qualificationViews[parseInt(newTraining.qualificationID)] : undefined;
      const isMandatory = qualificationView?.Herkunft === 'Pflicht';

      // Notify affected employees
      const affectedEmployees = employees.filter(emp => {
        if (!emp || !emp.DepartmentID) return false;
        const matchesDepartment = newTraining.targetAudience && 
          newTraining.targetAudience.includes(emp.DepartmentID.toString());
        return matchesDepartment || isMandatory;
      });

      affectedEmployees.forEach(employee => {
        if (employee && employee.ID) {
          dispatch(addNotification({
            userId: employee.ID.toString(),
            type: 'info',
            title: 'Neue Schulung verfügbar',
            message: `Eine neue Schulung "${newTraining.Name}" ist für Sie verfügbar. ${
              isMandatory ? 'Dies ist eine Pflichtschulung.' : 'Schauen Sie sich die Details an.'
            }`,
          }));
        }
      });

      // Notify HR about new training creation
      if (!isHR) {
        const hrEmployees = (employees as Employee[]).filter(e => e && e.AccessRight === 'hr');
        hrEmployees.forEach(hrEmployee => {
          if (hrEmployee && hrEmployee.ID) {
            dispatch(addNotification({
              userId: hrEmployee.ID.toString(),
              type: 'info',
              title: 'Neue Schulung erstellt',
              message: `${employee.FullName} hat eine neue Schulung "${newTraining.Name}" erstellt.`,
            }));
          }
        });
      }

      // Save current scroll position before cache invalidation
      const scrollPosition = window.scrollY;
      
      // Invalidate and refetch trainings and training participants
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trainings'] }),
        queryClient.invalidateQueries({ queryKey: ['trainingParticipants'] })
      ]);
      
      // Restore scroll position after a short delay to allow for re-render
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
      
      toast.success('Schulung erfolgreich erstellt');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error in handleAddTraining:', error);
      toast.error('Fehler beim Erstellen der Schulung');
    }
  };

  const deleteTrainingMutation = useMutation({
    mutationFn: async (trainingId: number) => {
      return await apiClient.delete(`/trainings/${trainingId}`);
    },
    onSuccess: () => {
      // Save current scroll position before cache invalidation
      const scrollPosition = window.scrollY;
      
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      
      // Restore scroll position after a short delay to allow for re-render
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
      
      toast.success('Training erfolgreich gelöscht');
    },
    onError: (error) => {
      console.error('Fehler beim Löschen des Trainings:', error);
      toast.error('Fehler beim Löschen des Trainings');
    }
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async (updatedTraining: Training) => {
      return await apiClient.put(`/trainings/${updatedTraining.ID}`, updatedTraining);
    },
    onSuccess: () => {
      // Save current scroll position before cache invalidation
      const scrollPosition = window.scrollY;
      
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      
      // Restore scroll position after a short delay to allow for re-render
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
      
      toast.success('Training erfolgreich aktualisiert');
      setEditingTraining(null);
      setShowAddModal(false);
    },
    onError: (error) => {
      console.error('Fehler beim Aktualisieren des Trainings:', error);
      toast.error('Fehler beim Aktualisieren des Trainings');
    }
  });

  const handleDeleteTraining = async (trainingId: number) => {
    if (!window.confirm('Möchten Sie diese Schulung wirklich löschen?')) return;
    deleteTrainingMutation.mutate(trainingId);
  };

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
  };

  const handleUpdateTraining = async (updatedTraining: Training) => {
    const trainingData: Training = {
      ID: updatedTraining.ID,
      Name: updatedTraining.Name,
      Description: updatedTraining.Description,
      qualificationID: updatedTraining.qualificationID,
      qualification_TrainerID: updatedTraining.qualification_TrainerID,
      trainingDate: updatedTraining.trainingDate,
      completed: updatedTraining.completed,
      department: updatedTraining.department,
      isMandatory: updatedTraining.isMandatory,
      qualificationIds: updatedTraining.qualificationIds,
      isAssigned: updatedTraining.isAssigned
    };
    updateTrainingMutation.mutate(trainingData);
  };

  const handleDocumentUpload = async (documents: any[]) => {
    try {
      // Handle document upload logic here
      // You can add your document upload implementation
    } catch (error) {
      toast.error('Fehler beim Hochladen der Dokumente');
    }
  };

  const handleTrainingComplete = async (trainingId: number, completionDate?: string) => {
    try {
      // Update training status to completed with the specified completion date
      const currentDate = completionDate || new Date().toISOString().split('T')[0];
      await apiClient.put(`/trainings/${trainingId}`, {
        completed: true,
        completedDate: currentDate,
        trainingDate: currentDate // Update the training date to the completion date
      });

      // Try to update participant qualifications
      let updatedCount = 0;
      
      // Find the training to get its qualification
      const training = trainings.find(t => t.ID === trainingId);
      if (training && training.qualificationID) {
        try {
          // Get training participants
          const allAssignments = await apiClient.get('/trainings-employee') as any[];
          const trainingParticipants = allAssignments.filter(
            (assignment: any) => assignment.TrainingID === trainingId
          );


          // Get qualification details to calculate validity
          const qualification = qualifications.find(q => q.ID?.toString() === training.qualificationID);
          if (qualification) {

            // Calculate qualification validity dates
            const qualifiedFromDate = completionDate || new Date().toISOString().split('T')[0];
            const qualifiedFrom = new Date(qualifiedFromDate);
            const isQualifiedUntil = new Date(qualifiedFrom);
            
            // Check if qualification never expires (999 months)
            if (qualification.ValidityInMonth === 999) {
              // Set to a very far future date (e.g., 100 years from now)
              isQualifiedUntil.setFullYear(isQualifiedUntil.getFullYear() + 100);
            } else {
              isQualifiedUntil.setMonth(isQualifiedUntil.getMonth() + (qualification.ValidityInMonth || 12));
            }
            
            const isQualifiedUntilString = isQualifiedUntil.toISOString();
            console.log("isQualifiedUntilString: " + isQualifiedUntilString);


            // Update qualifications for each participant
            for (const participant of trainingParticipants) {
              try {
                await apiClient.put('/employee-qualifications', {
                  employeeId: participant.EmployeeID.toString(),
                  qualificationId: qualification.ID,
                  qualifiedFrom: new Date().toISOString(),
                  toQualifyUntil: new Date(Date.now() + qualification.ValidityInMonth * 30 * 24 * 60 * 60 * 1000).toISOString(),
                  isQualifiedUntil: isQualifiedUntilString
                });
              } catch (error) {
                toast.error(`Fehler beim Aktualisieren der Qualifikation für Mitarbeiter ${participant.EmployeeID}`);
              }
            }
          } else {
            toast.error('Training nicht gefunden oder keine Qualifikation zugeordnet');
          }
        } catch (error) {
          console.error('Error updating participant qualifications:', error);
        }
      } else {
        console.log('Training not found or no qualification associated');
      }

      // Save current scroll position before cache invalidation
      const scrollPosition = window.scrollY;
      
      // Refresh trainings and qualifications data
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
      
      // Restore scroll position after a short delay to allow for re-render
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
      
      const formattedDate = completionDate 
        ? new Date(completionDate).toLocaleDateString('de-DE')
        : 'heute';
      
      if (updatedCount > 0) {
        toast.success(`Schulung als abgeschlossen markiert (${formattedDate}) und Qualifikationen von ${updatedCount} Teilnehmer(n) aktualisiert`);
      } else {
        toast.success(`Schulung als abgeschlossen markiert (${formattedDate})`);
      }
    } catch (error) {
      console.error('Error updating training status:', error);
      toast.error('Fehler beim Markieren der Schulung als abgeschlossen');
    }
  };

  const handleManageDocuments = (training: Training) => {
    setSelectedTrainingForDocs(training);
    setShowDocumentUploader(true);
  };

  // Calculate overdue trainings count
  const overdueTrainingsCount = trainings.filter(training => 
    training.trainingDate && !training.completed && 
    new Date(training.trainingDate) <= new Date() && new Date().toISOString().split('T')[0] === training.trainingDate
  ).length;

  // Add function to get participant count for a training
  const getParticipantCount = (trainingId: number) => {
    return trainingParticipantsData.filter(
      (participant: any) => participant.TrainingID === trainingId
    ).length;
  };

  // Update the getParticipantDetails function with proper typing
  const getParticipantDetails = (trainingId: number): Participant[] => {
    return trainingParticipantsData
      .filter((participant: any) => participant.TrainingID === trainingId)
      .map((participant: any): Participant => ({
        id: participant.EmployeeID,
        name: `${participant.FirstName} ${participant.SurName}`,
        trainingName: participant.TrainingName,
        trainingDescription: participant.TrainingDescription
      }));
  };

  const handleToggleParticipants = (trainingId: number) => {
    setExpandedTrainingId(expandedTrainingId === trainingId ? null : trainingId);
  };

  const removeParticipantMutation = useMutation({
    mutationFn: async ({ employeeId, trainingId }: { employeeId: number; trainingId: number }) => {
      return await apiClient.delete(`/trainings-employee/${employeeId}/${trainingId}`);
    },
    onSuccess: async (_, { trainingId }) => {
      // Invalidate queries to get updated data
      await queryClient.invalidateQueries({ queryKey: ['trainingParticipants'] });
      
      // Check if this was the last participant
      const remainingParticipants = getParticipantCount(trainingId);
      
      if (remainingParticipants <= 1) { // <= 1 because we just removed one
        // This was the last participant, delete the entire training
        try {
          await apiClient.delete(`/trainings/${trainingId}`);
          await queryClient.invalidateQueries({ queryKey: ['trainings'] });
          toast.success('Letzter Teilnehmer entfernt - Schulung wurde automatisch gelöscht');
        } catch (error) {
          console.error('Fehler beim Löschen der Schulung:', error);
          toast.error('Teilnehmer entfernt, aber Fehler beim Löschen der Schulung');
        }
      } else {
        toast.success('Teilnehmer erfolgreich entfernt');
      }
    },
    onError: (error) => {
      console.error('Fehler beim Entfernen des Teilnehmers:', error);
      toast.error('Fehler beim Entfernen des Teilnehmers');
    }
  });

  const handleRemoveParticipant = async (employeeId: number, trainingId: number, employeeName: string) => {
    // Only HR and Admin users can remove participants
    if (!canRemoveParticipants) {
      toast.error('Nur HR-Mitarbeiter und Administratoren können Teilnehmer entfernen');
      console.log('Permission check failed:', { 
        isSupervisor, 
        isHR, 
        isAdmin, 
        employeeRole: employee.role,
        employeeAccessRight: employee.AccessRight,
        employeeIsSupervisor: employee.isSupervisor,
        canRemoveParticipants
      });
      return;
    }

    if (!window.confirm(`Möchten Sie ${employeeName} wirklich aus dieser Schulung entfernen?`)) {
      return;
    }
    removeParticipantMutation.mutate({ employeeId, trainingId });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Verfügbare Schulungen
          </h1>
          <div className="mt-1 flex items-center space-x-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Durchsuchen Sie Schulungen für Ihre berufliche Entwicklung
            </p>
            {overdueTrainingsCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                {overdueTrainingsCount} überfällig
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {canCreateTraining && (
            <>
              <button
                onClick={() => setShowQuickModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
              >
                <Zap className="h-5 w-5 mr-2" />
                Schulung dokumentieren
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 dark:hover:bg-[#2a2a2a]"
              >
                <Plus className="h-5 w-5 mr-2" />
                Schulung planen
              </button>
            </>
          )}
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Such- und Filterbereich */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Schulungen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

          </div>
        </div>

        {/* Trainingsliste */}
        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
          {filteredTrainings.map(training => {
            if (!training) return null;
            
            const qualificationView = training.qualificationID ? qualificationViews[parseInt(training.qualificationID)] : undefined;
            const isMandatory = qualificationView?.Herkunft === 'Pflicht';
            const trainer = training.qualification_TrainerID ? qualificationTrainers[parseInt(training.qualification_TrainerID)] : undefined;
            const trainerEmployee = trainer ? employees.find(e => e.ID === trainer.EmployeeID) : null;
            const sessions = getTrainingSessions(training);
            const hasAssignedEmployees = sessions.some(session => session.isAssigned);
            const participantCount = getParticipantCount(training.ID);
            const participants = getParticipantDetails(training.ID);
            
            // Check if training is overdue
            let currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 1);
            const isOverdue = training.trainingDate && !training.completed && 
                             new Date(training.trainingDate) <= currentDate && currentDate.toISOString().split('T')[0] === training.trainingDate;
            
            const isExpanded = expandedTrainingId === training.ID;
            
            return (
              <div 
                key={training.ID} 
                className={`bg-white dark:bg-[#121212] rounded-lg transition-all duration-200 p-6 mb-4 border ${
                  isOverdue 
                    ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' 
                    : 'border-gray-200 dark:border-gray-700/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{training.Name}</h3>
                        {isMandatory && (
                          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-full">
                            Pflicht
                          </span>
                        )}
                        {!isMandatory && qualificationView?.Herkunft && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            qualificationView.Herkunft === 'Job' 
                              ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'text-purple-600 bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
                          }`}>
                            {qualificationView.Herkunft === 'Job' ? 'Position' : 'Zusatz'}
                          </span>
                        )}
                        {hasAssignedEmployees && (
                          <span className="px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
                            Zugewiesen
                          </span>
                        )}
                        {isOverdue && (
                          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-full flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Überfällig
                          </span>
                        )}
                        {(isHR || isAdmin || isSupervisor) && (
                          <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-full flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {participantCount} Teilnehmer
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{training.Description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <span>
                          Trainer: {trainerEmployee ? trainerEmployee.FullName : 'Nicht zugewiesen'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-gray-400" />
                        <span>
                          Qualifikation: {qualificationView?.Name || 'Unbekannt'}
                        </span>
                      </div>
                      {training.department && (
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-gray-400" />
                          <span>
                            Abteilung: {training.department}
                          </span>
                        </div>
                      )}
                      {(isHR || isAdmin || isSupervisor) && (
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <span>
                            Teilnehmer: {participantCount} {participantCount === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {canCreateTraining && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleManageDocuments(training)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
                        title="Dokumente verwalten - Schulung wird automatisch als abgeschlossen markiert"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditTraining(training)}
                        className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
                        title="Schulung bearbeiten"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTraining(training.ID)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
                        title="Schulung löschen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {sessions.map(session => {
                    const status = session.status as StatusType;
                    const StatusIcon = getStatusIcon(status);
                    return (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#181818] rounded-lg">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`w-5 h-5 ${getStatusColor(status)}`} />
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.date.toLocaleDateString()}
                            </span>
                            {session.isAssigned && (
                              <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                                (Zugewiesen)
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                          {status === 'ausstehend' ? 'Ausstehend' : 
                           status === 'abgeschlossen' ? 'Abgeschlossen' : status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Replace the existing participants section with collapsible version */}
                {(isHR || isAdmin || isSupervisor) && participants.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggleParticipants(training.ID)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                      >
                        <Users className="h-4 w-4" />
                        <span>Teilnehmende Mitarbeiter ({participants.length})</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleShowParticipantsModal(training, participants)}
                        className="text-sm text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80"
                      >
                        Alle anzeigen
                      </button>
                    </div>
                    
                    {/* Collapsible participants list */}
                    {isExpanded && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {participants.slice(0, 6).map((participant) => (
                          <div 
                            key={participant.id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md group"
                          >
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {participant.name}
                              </span>
                            </div>
                            {/* Only show remove button for HR or Admin users */}
                            {canRemoveParticipants && (
                              <button
                                onClick={() => handleRemoveParticipant(
                                  participant.id, 
                                  training.ID,
                                  participant.name
                                )}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Teilnehmer entfernen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {participants.length > 6 && (
                        <button
                          onClick={() => handleShowParticipantsModal(training, participants)}
                          className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          title="Alle Teilnehmer anzeigen"
                        >
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            +{participants.length - 6} weitere
                          </span>
                        </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Training Modal - only show when adding a new training */}
      {showAddModal && !editingTraining && (
        <AddTrainingModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTraining}
          userDepartment={employee.isSupervisor === 1 ? employee.DepartmentID?.toString() : undefined}
        />
      )}


      {showAllParticipantsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Alle Teilnehmer</h2>
            <ul className="space-y-2">
              {selectedParticipants.map((participant) => (
              <li key={participant.id} className="text-gray-700 dark:text-gray-200">
                {participant.name}
              </li>
              ))}
            </ul>
            <div className="mt-6 text-right">
              <button
                onClick={closeAllParticipants}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Training Modal - only show when editing an existing training */}
      {editingTraining && (
        <AddTrainingModal
          onClose={() => setEditingTraining(null)}
          onAdd={handleUpdateTraining}
          userDepartment={employee.isSupervisor === 1 ? employee.DepartmentID?.toString() : undefined}
          editingTraining={editingTraining}
        />
      )}

      {/* Qualifikations-Details Modal */}
      {selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Qualifikationsdetails
              </h3>
              <button
                onClick={() => setSelectedQualification(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {(() => {
              const qualification = qualifications.find(q => q.ID?.toString() === selectedQualification);
              if (!qualification) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {qualification.Name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {qualification.Description}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      Details:
                    </h5>
                    <ul className="mt-2 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Gültigkeitsdauer: {qualification.ValidityInMonth >= 999 ? 'Läuft nie ab' : `${qualification.ValidityInMonth} Monate`}
                      </li>
                      <li className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {qualification.IsMandatory ? 'Pflichtqualifikation' : 'Optionale Qualifikation'}
                      </li>
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Document Uploader Modal */}
      {showDocumentUploader && selectedTrainingForDocs && (
        <TrainingDocumentUploader
          training={selectedTrainingForDocs}
          onClose={() => {
            setShowDocumentUploader(false);
            setSelectedTrainingForDocs(null);
          }}
          onUpload={handleDocumentUpload}
          onTrainingComplete={handleTrainingComplete}
        />
      )}

      {/* Quick Training Modal */}
      {showQuickModal && (
        <QuickTrainingModal
          onClose={() => setShowQuickModal(false)}
          onAdd={handleAddTraining}
          userDepartment={employee.isSupervisor === 1 ? employee.DepartmentID?.toString() : undefined}
        />
      )}

      {/* Participants Modal */}
      {showParticipantsModal && selectedTrainingForParticipants && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Teilnehmende Mitarbeiter
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTrainingForParticipants.Name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowParticipantsModal(false);
                  setSelectedTrainingForParticipants(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getParticipantDetails(selectedTrainingForParticipants.ID).map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md group"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {participant.name}
                      </span>
                    </div>
                    {/* Only show remove button for HR or Admin users */}
                    {canRemoveParticipants && (
                      <button
                        onClick={() => handleRemoveParticipant(
                          participant.id, 
                          selectedTrainingForParticipants.ID,
                          participant.name
                        )}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Teilnehmer entfernen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gesamt: {getParticipantDetails(selectedTrainingForParticipants.ID).length} Teilnehmer
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {canRemoveParticipants ? 'Hover über einen Teilnehmer zum Entfernen' : 'Nur HR und Administratoren können Teilnehmer entfernen'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}