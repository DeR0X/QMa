import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Search, Filter, Calendar, Clock, MapPin, CheckCircle, XCircle, 
  AlertCircle, GraduationCap, Plus, Award, Info, X, User, Edit2, Trash2
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import type { Training, QualificationTrainer } from '../types';
import { formatDate, formatDuration } from '../lib/utils';
import { toast } from 'sonner';
import AddTrainingModal from '../components/trainings/AddTrainigModal';
import { hasHRPermissions } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { useEmployees } from '../hooks/useEmployees';
import { useTrainings } from '../hooks/useTrainings';
import { useQualifications } from '../hooks/useQualifications';
import { useQualificationViews, type QualificationView } from '../hooks/useQualificationView';
import { useQualificationTrainersByIds } from '../hooks/useQualificationTrainers';

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

export default function Trainings() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { employee } = useSelector((state: RootState) => state.auth);
  const { data: employeesData } = useEmployees({ limit: 1000 });
  const employees = Array.isArray(employeesData?.data) ? employeesData.data : [];
  const { data: trainings = [] } = useTrainings();
  const { data: qualifications = [] } = useQualifications();

  // Fetch all qualification views at once
  const qualificationIds = trainings.map(t => t.QualificationID);
  const { data: qualificationViews = {} } = useQualificationViews(qualificationIds);

  // Fetch all qualification trainers at once
  const qualificationTrainerIds = trainings.map(t => t.Qualification_TrainerID);
  const { data: qualificationTrainers = {} } = useQualificationTrainersByIds(qualificationTrainerIds);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showMandatoryOnly, setShowMandatoryOnly] = useState(false);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState<string | null>(null);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  if (!employee) return null;

  const isHR = hasHRPermissions(employee);
  const isSupervisor = employee.role === 'supervisor';
  const canCreateTraining = isHR || isSupervisor;

  const filteredTrainings = trainings.filter(training => {
    if (!training) return false;
    
    const title = training.Name?.toLowerCase() || '';
    const description = training.Description?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    const qualificationView = qualificationViews[training.QualificationID];
    const isMandatory = qualificationView?.Herkunft === 'Pflicht';
    
    const matchesSearch = title.includes(searchLower) || 
                         description.includes(searchLower);
    const matchesQualification = !selectedQualification || 
                               training.QualificationID.toString() === selectedQualification;
    const matchesMandatory = !showMandatoryOnly || isMandatory;
    
    return matchesSearch && matchesQualification && matchesMandatory;
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

  const getTrainingSessions = (training: Training) => {
    if (!training) return [];
    return [{
      id: training.ID,
      date: new Date(training.TrainingDate),
      status: training.completed ? 'abgeschlossen' as StatusType : 'ausstehend' as StatusType
    }];
  };

  const handleAddTraining = async (newTraining: Omit<Training, 'ID'> & { targetAudience?: string[] }) => {
    try {
      if (!Array.isArray(employees)) {
        console.error('Employees is not an array');
        return;
      }

      const qualificationView = qualificationViews[newTraining.QualificationID];
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

      // Invalidate and refetch trainings
      await queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Schulung erfolgreich erstellt');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error in handleAddTraining:', error);
      toast.error('Fehler beim Erstellen der Schulung');
    }
  };

  const deleteTrainingMutation = useMutation({
    mutationFn: async (trainingId: number) => {
      const response = await fetch(`http://localhost:5000/api/trainings/${trainingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Fehler beim Löschen des Trainings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Training erfolgreich gelöscht');
    },
    onError: (error) => {
      console.error('Fehler beim Löschen des Trainings:', error);
      toast.error('Fehler beim Löschen des Trainings');
    }
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async (updatedTraining: Training) => {
      const response = await fetch(`http://localhost:5000/api/trainings/${updatedTraining.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTraining),
      });
      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Trainings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
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
    updateTrainingMutation.mutate(updatedTraining);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header – mobile-first: standardmäßig gestapelt, ab sm: in einer Zeile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Verfügbare Schulungen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Durchsuchen und buchen Sie Schulungen für Ihre berufliche Entwicklung
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {canCreateTraining && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neue Schulung
            </button>
          )}
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Such- und Filterbereich */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
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
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showMandatoryOnly}
                  onChange={(e) => setShowMandatoryOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Nur Pflichtschulungen</span>
              </label>
            </div>
          </div>
        </div>

        {/* Trainingsliste */}
        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
          {filteredTrainings.map(training => {
            const qualificationView = qualificationViews[training.QualificationID];
            const isMandatory = qualificationView?.Herkunft === 'Pflicht';
            const trainer = qualificationTrainers[training.Qualification_TrainerID];
            const trainerEmployee = trainer ? employees.find(e => e.ID === trainer.EmployeeID) : null;
            
            return (
              <div key={training.ID} className="bg-white rounded-lg shadow-md p-6 mb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{training.Name}</h3>
                        {isMandatory && (
                          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                            Pflicht
                          </span>
                        )}
                        {!isMandatory && qualificationView?.Herkunft && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            qualificationView.Herkunft === 'Job' 
                              ? 'text-blue-600 bg-blue-100'
                              : 'text-green-600 bg-green-100'
                          }`}>
                            {qualificationView.Herkunft === 'Job' ? 'Job' : 'Zusatz'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{training.Description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
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
                    </div>
                  </div>

                  {canCreateTraining && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditTraining(training)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTraining(training.ID)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {getTrainingSessions(training).map(session => {
                    const status = session.status as StatusType;
                    const StatusIcon = getStatusIcon(status);
                    return (
                      <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-5 h-5 ${getStatusColor(status)}`} />
                          <span>{session.date.toLocaleDateString()}</span>
                        </div>
                        <span className={`text-sm ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
          userDepartment={isSupervisor ? employee.DepartmentID?.toString() : undefined}
        />
      )}

      {/* Edit Training Modal - only show when editing an existing training */}
      {editingTraining && (
        <AddTrainingModal
          onClose={() => setEditingTraining(null)}
          onAdd={handleUpdateTraining}
          userDepartment={isSupervisor ? employee.DepartmentID?.toString() : undefined}
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
                        Gültigkeitsdauer: {qualification.ValidityInMonth} Monate
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
    </div>
  );
}