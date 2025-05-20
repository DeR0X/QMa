import { useState, useEffect } from 'react';
import { X, Plus, Award, Edit2, Building2, Globe, Search, AlertCircle, BookOpen, Timer, Users, Calendar, MapPin, Info } from 'lucide-react';
import { useQualifications } from '../../hooks/useQualifications';
import { useDepartments } from '../../hooks/useDepartments';
import { useQualificationTrainers } from '../../hooks/useQualificationTrainers';
import type { Training } from '../../types';
import type { Qualification } from '../../services/qualificationsApi';
import { toast } from 'sonner';
import { useJobTitles } from '../../hooks/useJobTitles';
import { useEmployees } from '../../hooks/useEmployees';

interface Props {
  onClose: () => void;
  onAdd: (training: Omit<Training, 'id'>) => void;
  userDepartment?: string;
  editingTraining?: Training;
}

interface Session {
  id: string;
  date: string;
  location: string;
  availableSpots: number;
  trainer?: string;
}

export default function AddTrainingModal({ onClose, onAdd, userDepartment, editingTraining }: Props) {
  const { data: qualificationsData } = useQualifications();
  const { data: departmentsData } = useDepartments();
  const { data: jobTitleData } = useJobTitles();
  const { data: employeesData } = useEmployees({ limit: 1000 });
  const [activeStep, setActiveStep] = useState(1);

  // Find the qualification for the editing training
  const initialQualification = editingTraining && qualificationsData
    ? qualificationsData.find(q => q.ID === editingTraining.QualificationID) || null
    : null;

  // Set initial qualification when editing
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(initialQualification);

  // Effect to set initial qualification when editing
  useEffect(() => {
    if (editingTraining && initialQualification) {
      handleQualificationSelect(initialQualification);
    }
  }, [editingTraining, initialQualification]);

  const [formData, setFormData] = useState({
    title: editingTraining?.Name || '',
    description: editingTraining?.Description || '',
    validityPeriod: initialQualification?.ValidityInMonth || 12,
    isMandatory: initialQualification?.Herkunft === 'Pflicht',
    trainer: editingTraining?.Qualification_TrainerID?.toString() || '',
    maxParticipants: 10,
    targetPositions: [] as string[],
    isForEntireDepartment: initialQualification?.Herkunft === 'Pflicht',
    sessions: editingTraining ? [{ 
      id: Date.now().toString(),
      date: new Date(editingTraining.TrainingDate).toISOString().slice(0, 16),
      location: '',
      availableSpots: 10,
      trainer: editingTraining.Qualification_TrainerID?.toString() || ''
    }] : [{ 
      id: Date.now().toString(),
      date: '',
      location: '',
      availableSpots: 10,
      trainer: ''
    }] as Session[],
    qualificationIds: editingTraining ? [editingTraining.QualificationID.toString()] : [] as string[],
    department: userDepartment || '',
  });

  // State for available trainers
  const [availableTrainers, setAvailableTrainers] = useState<Array<{
    ID: number;
    FullName: string;
    Department: string;
  }>>([]);

  const [selectedDepartment, setSelectedDepartment] = useState(userDepartment || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available positions for selected department
  const selectedDepartmentData = departmentsData?.find(d => d.ID.toString() === selectedDepartment);
  const availablePositions = selectedDepartmentData?.positions || [];

  // Add new state for trainer qualification IDs
  const [trainerQualificationIds, setTrainerQualificationIds] = useState<Record<string, number>>({});

  // Fetch trainers when qualification changes
  useEffect(() => {
    if (selectedQualification?.ID) {
      // Get all trainers for this qualification
      const fetchTrainers = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/qualification-trainers/qualification/${selectedQualification.ID}`);
          const trainers = await response.json();
          
          // Create a mapping of employee IDs to qualification trainer IDs
          const trainerIdMap: Record<string, number> = {};
          trainers.forEach((trainer: any) => {
            trainerIdMap[trainer.EmployeeID.toString()] = trainer.ID;
          });
          setTrainerQualificationIds(trainerIdMap);
          
          // Map trainer IDs to employee data
          const trainerEmployees = trainers
            .map((trainer: any) => {
              const employee = employeesData?.data.find(emp => emp.ID === trainer.EmployeeID);
              return employee ? {
                ID: employee.ID,
                FullName: employee.FullName,
                Department: employee.Department
              } : null;
            })
            .filter(Boolean);

          setAvailableTrainers(trainerEmployees);
        } catch (error) {
          console.error('Error fetching trainers:', error);
          toast.error('Fehler beim Laden der Trainer');
        }
      };

      fetchTrainers();
    } else {
      setAvailableTrainers([]);
      setTrainerQualificationIds({});
    }
  }, [selectedQualification?.ID, employeesData]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setFormData(prev => ({
      ...prev,
      department: dept,
      targetPositions: [],
      isForEntireDepartment: false,
    }));
  };

  // Update form data when qualification is selected
  const handleQualificationSelect = (qualification: Qualification) => {
    setSelectedQualification(qualification);
    const isMandatoryQual = qualification.Herkunft === 'Pflicht';
    console.log(qualification);
    // Generate title with prefix based on qualification type
    let titlePrefix = '';
    switch (qualification.AssignmentType) {
      case 'Pflicht':
        titlePrefix = '[Pflicht] ';
        break;
      case 'Job':
        titlePrefix = '[Position] ';
        break;
      case 'Zusatz':
        titlePrefix = '[Zusatz] ';
        break;
    }

    setFormData(prev => ({
      ...prev,
      qualificationIds: [qualification.ID?.toString() || ''],
      title: `${titlePrefix}${qualification.Name}`,
      description: qualification.Description,
      validityPeriod: qualification.ValidityInMonth || 12,
      isMandatory: isMandatoryQual,
      isForEntireDepartment: isMandatoryQual,
      department: isMandatoryQual ? 'all' : (userDepartment || ''),
    }));
  };

  // Calculate the next step based on current step and mandatory status
  const getNextStep = (currentStep: number) => {
    if (currentStep === 1) {
      // After qualification selection, go to basic info
      return 2;
    }
    return currentStep + 1;
  };

  // Calculate the previous step based on current step
  const getPreviousStep = (currentStep: number) => {
    if (currentStep === 2) {
      // Go back to qualification selection
      return 1;
    }
    return currentStep - 1;
  };

  // Update step validation
  const isStepComplete = (step: number) => {
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 1: // Qualification Selection
        if (formData.qualificationIds.length === 0) {
          newErrors.qualification = 'Bitte wählen Sie eine Qualifikation aus';
        }
        break;

      case 2: // Basic Information
        if (!formData.title.trim()) {
          newErrors.title = 'Titel ist erforderlich';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Beschreibung ist erforderlich';
        }
        if (!formData.trainer) {
          newErrors.trainer = 'Bitte wählen Sie einen Trainer aus';
        }
        break;

      case 3: // Sessions
        if (formData.sessions.length === 0) {
          newErrors.sessions = 'Mindestens ein Termin ist erforderlich';
        }
        formData.sessions.forEach((session, index) => {
          if (!session.date) {
            newErrors[`session_${index}_date`] = 'Datum ist erforderlich';
          }
          if (!session.location) {
            newErrors[`session_${index}_location`] = 'Ort ist erforderlich';
          }
        });
        break;

      case 4: // Summary
        // No additional validation needed for summary
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeStep === 4 && !isStepComplete(activeStep)) {
      return;
    }

    if (activeStep < 4) {
      if (!isStepComplete(activeStep)) {
        return;
      }
      setActiveStep(getNextStep(activeStep));
      return;
    }

    try {
      if (!formData.trainer) {
        throw new Error('Bitte wählen Sie einen Trainer aus');
      }

      const qualificationTrainerId = trainerQualificationIds[formData.trainer];
      if (!qualificationTrainerId) {
        throw new Error('Kein gültiger Trainer für diese Qualifikation ausgewählt');
      }

      const trainingData = {
        Name: formData.title,
        Description: formData.description,
        QualificationID: parseInt(formData.qualificationIds[0]),
        Qualification_TrainerID: qualificationTrainerId,
        TrainingDate: new Date(formData.sessions[0].date).toISOString(),
        completed: editingTraining?.completed || 0
      };

      const url = editingTraining 
        ? `http://localhost:5000/api/trainings/${editingTraining.ID}`
        : 'http://localhost:5000/api/trainings';
      
      const method = editingTraining ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData),
      });

      if (!response.ok) {
        throw new Error(editingTraining ? 'Fehler beim Aktualisieren der Schulung' : 'Fehler beim Erstellen der Schulung');
      }

      const result = await response.json();
      onAdd(result);
      toast.success(editingTraining ? 'Schulung erfolgreich aktualisiert' : 'Schulung erfolgreich erstellt');
      onClose();
    } catch (error) {
      console.error('Error saving training:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern der Schulung');
    }
  };

  const addSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      date: '',
      location: '',
      availableSpots: formData.maxParticipants,
      trainer: formData.trainer,
    };

    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
    }));
  };

  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      ),
    }));
  };

  const removeSession = (sessionId: string) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.filter(session => session.id !== sessionId),
    }));
  };

  const filteredQualifications = qualificationsData?.filter(qual => {
    const matchesSearch = searchTerm === '' || 
      qual.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qual.Description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const renderSessionTrainerSelect = (session: Session, index: number) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Trainer
      </label>
      <select
        value={session.trainer || formData.trainer}
        onChange={(e) => {
          const selectedTrainerId = e.target.value;
          // Update both the session trainer and the main formData trainer
          updateSession(session.id, { trainer: selectedTrainerId });
          // Always update formData.trainer when a trainer is selected
          setFormData(prev => ({ ...prev, trainer: selectedTrainerId }));
        }}
        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
      >
        <option value="">Bitte wählen...</option>
        {availableTrainers.map((trainer) => (
          <option key={trainer.ID} value={trainer.ID.toString()}>
            {trainer.FullName} ({trainer.Department})
          </option>
        ))}
      </select>
    </div>
  );

  // Update the progress steps display
  const renderProgressSteps = () => {
    const steps = [1, 2, 3, 4]; // Qualification, Basic Info, Sessions, Summary
    const stepLabels = [
      'Qualifikation',
      'Grundinfo',
      'Termine',
      'Übersicht'
    ];

    return (
      <div className="relative">
        <div className="absolute top-4 w-full h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                const targetStep = step;
                const canNavigate = steps
                  .filter(s => s < targetStep)
                  .every(s => isStepComplete(s));
                if (canNavigate) {
                  setActiveStep(targetStep);
                }
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center relative bg-white dark:bg-[#121212] border-2 transition-colors ${
                activeStep >= step
                  ? 'border-primary text-primary'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-sm font-medium">{step}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <span key={step} className="text-xs text-gray-500 dark:text-gray-400">
              {stepLabels[step - 1]}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const getTrainerName = (trainerId: string) => {
    if (!trainerId) return 'Nicht zugewiesen';
    const trainer = availableTrainers.find(t => t.ID.toString() === trainerId);
    return trainer ? `${trainer.FullName} (${trainer.Department})` : 'Unbekannter Trainer';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingTraining ? 'Schulung bearbeiten' : 'Neue Schulung erstellen'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderProgressSteps()}

            {/* Step 1: Qualification Selection */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Qualifikation auswählen
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Qualifikationen suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-[#181818] dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredQualifications.map((qual) => (
                    <div
                      key={qual.ID}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedQualification?.ID === qual.ID
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                      onClick={() => handleQualificationSelect(qual)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {qual.Name}
                              {editingTraining && qual.ID === initialQualification?.ID && (
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                  (Aktuelle Qualifikation)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {qual.Description}
                            </p>
                          </div>
                          <input
                            type="radio"
                            checked={selectedQualification?.ID === qual.ID}
                            onChange={() => {}}
                            className="mt-1 rounded-full border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>Gültigkeitsdauer: {qual.ValidityInMonth} Monate</p>
                          {qual.AssignmentType === 'Zusatz' && qual.AdditionalSkillName && (
                            <div className="mt-2">
                              <p className="font-medium">Zusatzfunktion:</p>
                              <p className="text-sm">{qual.AdditionalSkillName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.qualification && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.qualification}</p>
                )}
              </div>
            )}

            {/* Step 2: Basic Information */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Grundinformationen festlegen
                  </h3>

                  {/* Add trainer selection at the top of step 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Trainer *
                    </label>
                    <select
                      value={formData.trainer}
                      onChange={(e) => {
                        const selectedTrainerId = e.target.value;
                        setFormData(prev => ({ ...prev, trainer: selectedTrainerId }));
                        // Also update the first session's trainer if it exists
                        if (formData.sessions.length > 0) {
                          updateSession(formData.sessions[0].id, { trainer: selectedTrainerId });
                        }
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                    >
                      <option value="">Bitte wählen...</option>
                      {availableTrainers.map((trainer) => (
                        <option key={trainer.ID} value={trainer.ID.toString()}>
                          {trainer.FullName} ({trainer.Department})
                        </option>
                      ))}
                    </select>
                    {!formData.trainer && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">Bitte wählen Sie einen Trainer aus</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Titel *
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="z.B. IT-Sicherheitsschulung"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Beschreibung *
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detaillierte Beschreibung der Schulung..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className={`flex items-center space-x-2 ${
                      selectedQualification?.AssignmentType === 'Pflicht' || selectedQualification?.IsMandatory
                        ? 'opacity-75 cursor-not-allowed'
                        : ''
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.isMandatory}
                        onChange={(e) => {
                          // Only allow changes if not a mandatory qualification
                          if (!(selectedQualification?.AssignmentType === 'Pflicht' || selectedQualification?.IsMandatory)) {
                            setFormData({ ...formData, isMandatory: e.target.checked });
                          }
                        }}
                        disabled={selectedQualification?.AssignmentType === 'Pflicht' || selectedQualification?.IsMandatory}
                        className={`rounded border-gray-300 text-primary focus:ring-primary ${
                          selectedQualification?.AssignmentType === 'Pflicht' || selectedQualification?.IsMandatory
                            ? 'cursor-not-allowed opacity-75'
                            : ''
                        }`}
                      />
                      <span className={`text-sm ${
                        selectedQualification?.AssignmentType === 'Pflicht' || selectedQualification?.IsMandatory
                          ? 'text-gray-500 dark:text-gray-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        Pflichtschulung
                        {(selectedQualification?.AssignmentType === 'Pflicht' || selectedQualification?.IsMandatory) && (
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            (automatisch für Pflichtqualifikationen)
                          </span>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Sessions */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Termine
                  </h3>
                  <button
                    type="button"
                    onClick={addSession}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Termin hinzufügen
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Termin {index + 1}
                        </h4>
                        {formData.sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSession(session.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Datum & Zeit *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={session.date}
                            onChange={(e) => updateSession(session.id, { date: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                          />
                          {errors[`session_${index}_date`] && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {errors[`session_${index}_date`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ort *
                          </label>
                          <input
                            type="text"
                            required
                            value={session.location}
                            onChange={(e) => updateSession(session.id, { location: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                            placeholder="z.B. Schulungsraum A"
                          />
                          {errors[`session_${index}_location`] && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {errors[`session_${index}_location`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Verfügbare Plätze
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={session.availableSpots}
                            onChange={(e) => updateSession(session.id, { availableSpots: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                          />
                        </div>

                        {renderSessionTrainerSelect(session, index)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Übersicht der Schulung
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.isMandatory 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {formData.isMandatory ? 'Pflichtschulung' : 'Optionale Schulung'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information Card */}
                  <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Grundinformationen
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formData.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formData.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Training Sessions Card */}
                  <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Termine
                        </h4>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.sessions.length} {formData.sessions.length === 1 ? 'Termin' : 'Termine'}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {formData.sessions.map((session, index) => (
                        <div
                          key={session.id}
                          className="p-3 bg-white dark:bg-[#121212] rounded-md border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Termin {index + 1}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {session.availableSpots} Plätze
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(session.date).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {session.location}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              {getTrainerName(session.trainer || formData.trainer)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <Award className="h-5 w-5 text-gray-400 mr-2" />
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Qualifikation
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {selectedQualification && (
                        <>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedQualification.Name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedQualification.Description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gültigkeitsdauer: {selectedQualification.ValidityInMonth} Monate
                          </p>
                          {selectedQualification.AssignmentType === 'Zusatz' && selectedQualification.AdditionalSkillName && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Zusatzfunktion:
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedQualification.AdditionalSkillName}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Navigation Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                if (activeStep > 1) {
                  setActiveStep(getPreviousStep(activeStep));
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {activeStep > 1 ? "Zurück" : "Abbrechen"}
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
            >
              {activeStep < 4 ? "Weiter" : (editingTraining ? "Änderungen speichern" : "Schulung erstellen")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}