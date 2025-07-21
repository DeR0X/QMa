import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Award, Edit2, Building2, Globe, Search, AlertCircle, BookOpen, Timer, Users, Calendar, MapPin, Info, FileText, CheckCircle } from 'lucide-react';
import { useQualifications } from '../../hooks/useQualifications';
import { useDepartments } from '../../hooks/useDepartments';
import { useQualificationTrainers, useAllQualificationTrainers, useQualificationTrainersByQualificationId } from '../../hooks/useQualificationTrainers';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useGetAllEmployeeSkills } from '../../hooks/useEmployeeSkills';
import type { Training, TrainingDocument } from '../../types';
import type { Qualification } from '../../services/qualificationsApi';
import { toast } from 'sonner';
import { useJobTitles } from '../../hooks/useJobTitles';
import { useEmployees } from '../../hooks/useEmployees';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
// Removed useAssignEmployeeTraining import as employee assignment is now handled in the POST request
import TrainingDocumentUploader from './TrainingDocumentUploader';
import { baseApi } from '../../services/apiClient';

interface Props {
  onClose: () => void;
  onAdd: (training: Omit<Training, 'id'>) => void;
  userDepartment?: string;
  editingTraining?: Training;
}

interface Session {
  id: string;
  date: string;
  trainer?: string;
}

export default function AddTrainingModal({ onClose, onAdd, userDepartment, editingTraining }: Props) {
  const { data: qualificationsData } = useQualifications();
  const { data: departmentsData } = useDepartments();
  const { data: jobTitleData } = useJobTitles();
  const { data: employeesData } = useEmployees({ limit: 1000 });
  const { data: allEmployeeSkills } = useGetAllEmployeeSkills();
  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const [activeStep, setActiveStep] = useState(1);

  // Prevent background scrolling when modal is open
  useBodyScrollLock(true);
  // Removed qualificationsWithTrainers state as it's now handled by useMemo
  // Removed assignTraining hook as employee assignment is now handled in the POST request

  const [selectedDepartment, setSelectedDepartment] = useState(userDepartment || '');

  // Filter employees based on user role and remove duplicates
  const filteredEmployees = useMemo(() => {
    if (!employeesData?.data) return [];
    
    let filtered = employeesData.data;

    // If user is a supervisor, only show their direct reports and themselves
    if (currentEmployee?.isSupervisor === 1) {
      filtered = filtered.filter(emp => 
        emp.SupervisorID?.toString() === currentEmployee.StaffNumber?.toString() ||
        emp.ID.toString() === currentEmployee.ID.toString()
      );
    }

    // Apply department filter for HR/Admin
    if ((currentEmployee?.role === 'hr' || currentEmployee?.role === 'admin') && selectedDepartment) {
      filtered = filtered.filter(emp => 
        emp.DepartmentID?.toString() === selectedDepartment
      );
    }

    // Remove duplicates by creating a Map with unique IDs
    const uniqueEmployees = new Map();
    filtered.forEach(emp => {
      if (emp.isActive) {  // Only include active employees
        const key = `${emp.ID}-${emp.StaffNumber}`; // Create a unique key combining ID and StaffNumber
        if (!uniqueEmployees.has(key)) {
          uniqueEmployees.set(key, emp);
        }
      }
    });

    return Array.from(uniqueEmployees.values());
  }, [employeesData?.data, currentEmployee, selectedDepartment]);



  // Find the qualification for the editing training
  const initialQualification = editingTraining && qualificationsData
    ? qualificationsData.find(q => q.ID?.toString() === editingTraining.qualificationID) || null
    : null;

  // Set initial qualification when editing
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(initialQualification);



  // Use React Query hooks instead of direct API calls (after selectedQualification state)
  const { data: allQualificationTrainers = [] } = useAllQualificationTrainers();
  const { data: qualificationSpecificTrainers = [] } = useQualificationTrainersByQualificationId(selectedQualification?.ID);

  // Create stable dependencies
  const allQualificationTrainersStable = useMemo(() => 
    allQualificationTrainers, 
    [allQualificationTrainers]
  );

  const editingTrainingStable = useMemo(() => 
    editingTraining, 
    [editingTraining?.ID]
  );

  const employeesDataStable = useMemo(() => 
    employeesData, 
    [employeesData?.data]
  );

  const selectedQualificationId = useMemo(() => 
    selectedQualification?.ID?.toString(), 
    [selectedQualification?.ID]
  );

  // Use useMemo instead of useEffect to avoid infinite loops
  const qualificationsWithTrainers = useMemo(() => {
    if (allQualificationTrainersStable.length > 0) {
      // Create a set of qualification IDs that have trainers
      return new Set<string>(
        allQualificationTrainersStable
          .map((trainer: any) => trainer.QualificationID?.toString())
          .filter((id: string | undefined): id is string => id !== undefined)
      );
    }
    return new Set<string>();
  }, [allQualificationTrainersStable]);

  const [formData, setFormData] = useState({
    title: editingTraining?.Name || '',
    description: editingTraining?.Description || '',
    validityPeriod: initialQualification?.ValidityInMonth || 12,
    trainer: editingTraining?.qualification_TrainerID?.toString() || '',
    targetPositions: [] as string[],
    isForEntireDepartment: initialQualification?.Herkunft === 'Pflicht',
    sessions: editingTraining ? [{ 
      id: Date.now().toString(),
      date: editingTraining.trainingDate ? new Date(editingTraining.trainingDate).toISOString().split('T')[0] : '',
      trainer: editingTraining.qualification_TrainerID?.toString() || ''
    }] : [{ 
      id: Date.now().toString(),
      date: '',
      trainer: ''
    }] as Session[],
    qualificationIds: editingTraining ? [editingTraining.qualificationID?.toString() || ''] : [] as string[],
    department: userDepartment || '',
    assignedEmployees: [] as string[],
    completed: editingTraining?.completed || false,
    isForAllEmployees: false,
  });

  // Use useMemo for trainer processing to avoid infinite loops
  const trainerData = useMemo(() => {
    if (qualificationSpecificTrainers.length > 0) {
      // Create a mapping of employee IDs to qualification trainer IDs
      const trainerIdMap: Record<string, number> = {};
      qualificationSpecificTrainers.forEach((trainer: any) => {
        trainerIdMap[trainer.EmployeeID.toString()] = trainer.ID;
      });
      
      // Map trainer IDs to employee data
      const trainerEmployees = qualificationSpecificTrainers
        .map((trainer: any) => {
          const employee = employeesDataStable?.data.find(emp => emp.ID === trainer.EmployeeID);
          return employee ? {
            ID: employee.ID,
            FullName: employee.FullName,
            Department: employee.Department
          } : null;
        })
        .filter((emp): emp is { ID: number; FullName: string; Department: string; } => emp !== null);

      return {
        trainerIdMap,
        trainerEmployees,
        hasTrainers: true
      };
    } else if (selectedQualification?.ID) {
      return {
        trainerIdMap: {},
        trainerEmployees: [],
        hasTrainers: false
      };
    }
    return null;
  }, [qualificationSpecificTrainers, employeesDataStable, selectedQualification?.ID]);

  // Use useMemo for trainer states to avoid useEffect
  const { trainerQualificationIds, availableTrainers } = useMemo(() => {
    if (trainerData) {
      return {
        trainerQualificationIds: trainerData.trainerIdMap,
        availableTrainers: trainerData.trainerEmployees
      };
    }
    return {
      trainerQualificationIds: {},
      availableTrainers: []
    };
  }, [trainerData]);

  // Use useMemo for form data updates when editing
  const updatedFormData = useMemo(() => {
    if (trainerData?.hasTrainers && editingTrainingStable?.qualification_TrainerID) {
      const matchingTrainer = qualificationSpecificTrainers.find((trainer: any) => trainer.ID === editingTrainingStable.qualification_TrainerID);
      if (matchingTrainer) {
        const trainerEmployee = employeesDataStable?.data.find(emp => emp.ID === matchingTrainer.EmployeeID);
        if (trainerEmployee) {
          const trainerId = trainerEmployee.ID.toString();
          return {
            trainer: trainerId,
            sessions: formData.sessions.map((session, index) => 
              index === 0 ? { ...session, trainer: trainerId } : session
            )
          };
        }
      }
    }
    return null;
  }, [trainerData?.hasTrainers, editingTrainingStable?.qualification_TrainerID, qualificationSpecificTrainers, employeesDataStable, formData.sessions]);

  // Update form data when updatedFormData changes
  useEffect(() => {
    if (updatedFormData) {
      setFormData(prev => ({
        ...prev,
        ...updatedFormData
      }));
    }
  }, [updatedFormData]);

  // Handle initial qualification selection
  useEffect(() => {
    if (editingTraining && initialQualification) {
      // Set the selected qualification
      setSelectedQualification(initialQualification);
      
      // Update form data with the editing training's data
      setFormData(prev => ({
        ...prev,
        title: editingTraining.Name || '',
        description: editingTraining.Description || '',
        department: editingTraining.department || userDepartment || '',
        trainer: editingTraining.qualification_TrainerID?.toString() || '',
        sessions: [{
          id: Date.now().toString(),
          date: editingTraining.trainingDate ? new Date(editingTraining.trainingDate).toISOString().split('T')[0] : '',
          trainer: editingTraining.qualification_TrainerID?.toString() || ''
        }],
        qualificationIds: editingTraining.qualificationID ? [editingTraining.qualificationID.toString()] : []
      }));

      // Trigger qualification selection to load trainers
      handleQualificationSelect(initialQualification);
    }
  }, [editingTraining, initialQualification, userDepartment]);

  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);

  // Get available positions for selected department
  const selectedDepartmentData = departmentsData?.find(d => d.ID.toString() === selectedDepartment);
  const availablePositions = selectedDepartmentData?.positions || [];

  // Add new state for employee qualifications
  const [employeeQualifications, setEmployeeQualifications] = useState<Array<{
    EmployeeID: number;
    QualificationID: number;
    qualifiedFrom: string;
    isQualifiedUntil: string;
  }>>([]);

  // Helper function to check if a qualification has eligible employees
  const hasEligibleEmployeesForQualification = (qualification: Qualification) => {
    if (!qualification.ID) return false;
    
    let filtered = filteredEmployees;
    
    // Filter by job title or additional skill if required
    if (qualification.Herkunft === 'Job' && qualification.JobTitleID) {
      filtered = filtered.filter(emp => 
        emp.JobTitleID?.toString() === qualification.JobTitleID?.toString()
      );
    } else if (qualification.Herkunft === 'Zusatz' && qualification.AdditionalSkillID) {
      if (!allEmployeeSkills) return false;
      
      filtered = filtered.filter(emp => {
        const hasRequiredSkill = allEmployeeSkills.some((skill: any) => {
          const employeeMatch = skill.EmployeeID?.toString() === emp.ID.toString();
          const skillMatch = 
            skill.AdditionalSkillID?.toString() === qualification.AdditionalSkillID?.toString() ||
            skill.SkillID?.toString() === qualification.AdditionalSkillID?.toString();
          
          return employeeMatch && skillMatch;
        });
        
        return hasRequiredSkill;
      });
    }
    
    // Always return true if there are employees that match the qualification criteria
    return filtered.length > 0;
  };

  // Update getQualificationFilteredEmployees function
  const getQualificationFilteredEmployees = () => {
    if (!selectedQualification) return filteredEmployees;

    // First filter by job title or additional skill if required
    let filtered = filteredEmployees;
    
    if (selectedQualification.Herkunft === 'Job' && selectedQualification.JobTitleID) {
      filtered = filtered.filter(emp => 
        emp.JobTitleID?.toString() === selectedQualification.JobTitleID?.toString()
      );
    } else if (selectedQualification.Herkunft === 'Zusatz' && selectedQualification.AdditionalSkillID) {
      if (!allEmployeeSkills) return [];
      
      filtered = filtered.filter(emp => {
        const hasRequiredSkill = allEmployeeSkills.some((skill: any) => {
          const employeeMatch = skill.EmployeeID?.toString() === emp.ID.toString();
          const skillMatch = 
            skill.AdditionalSkillID?.toString() === selectedQualification.AdditionalSkillID?.toString() ||
            skill.SkillID?.toString() === selectedQualification.AdditionalSkillID?.toString();
          
          return employeeMatch && skillMatch;
        });
        
        return hasRequiredSkill;
      });
    }

    // Return all employees that match the qualification criteria, regardless of current qualification status
    return filtered;
  };

  const qualificationFilteredEmployees = getQualificationFilteredEmployees();

  // Get departments that have employees (for filter dropdown) - based on qualification-filtered employees
  const departmentsWithEmployees = useMemo(() => {
    if (!employeesData?.data || !departmentsData) return [];
    
    const employeeDepartments = new Set(
      qualificationFilteredEmployees
        .filter(emp => emp.isActive)
        .map(emp => emp.DepartmentID?.toString())
        .filter(Boolean)
    );
    
    return departmentsData.filter(dept => 
      employeeDepartments.has(dept.ID.toString())
    );
  }, [employeesData?.data, departmentsData, selectedQualification, qualificationFilteredEmployees]);

  // Update the employee assignment step to use filtered employees
  const renderEmployeeAssignment = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Mitarbeiter zuweisen
        </h3>
        {selectedQualification && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedQualification.Herkunft === 'Pflicht' ? 
              'Alle Mitarbeiter (Pflicht-Qualifikation)' :
                        selectedQualification.Herkunft === 'Job' ? 
            `Nur Mitarbeiter mit Position: ${selectedQualification.JobTitle}` :
              selectedQualification.Herkunft === 'Zusatz' ?
              `Nur Mitarbeiter mit Zusatzfunktion: ${selectedQualification.AdditionalSkillNames ? selectedQualification.AdditionalSkillNames.join(', ') : selectedQualification.AdditionalSkillName}` :
              'Alle verfügbaren Mitarbeiter'
            }
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Department Filter for HR/Admin */}
        {(currentEmployee?.role === 'hr' || currentEmployee?.role === 'admin') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Abteilung filtern
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
            >
              <option value="">Alle Abteilungen</option>
              {departmentsWithEmployees.map((dept) => (
                <option key={dept.ID} value={dept.ID.toString()}>
                  {dept.Department}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mass assignment options */}
        <div className="space-y-3">
          {/* Mass assignment option for HR/Admin and Supervisors */}
          {(currentEmployee?.role === 'hr' || currentEmployee?.role === 'admin' || currentEmployee?.isSupervisor === 1) && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isForAllEmployees"
                checked={formData.isForAllEmployees}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  isForAllEmployees: e.target.checked,
                  assignedEmployees: e.target.checked ? [] : prev.assignedEmployees
                }))}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isForAllEmployees" className="text-sm text-gray-700 dark:text-gray-300">
                {currentEmployee?.role === 'hr' || currentEmployee?.role === 'admin' 
                  ? `Für alle verfügbaren Mitarbeiter${selectedDepartment ? ` (${departmentsData?.find(d => d.ID.toString() === selectedDepartment)?.Department})` : ''}`
                  : 'Für alle Mitarbeiter meiner Abteilung'
                } (Massenzuweisung)
              </label>
            </div>
          )}
        </div>

        {!formData.isForAllEmployees ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Mitarbeiter suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full dark:bg-[#181818] dark:text-white"
              />
            </div>

            {qualificationFilteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {selectedQualification?.Herkunft === 'Zusatz' && !allEmployeeSkills
                    ? 'Lade Mitarbeiter-Zusatzfunktionen...'
                    : selectedQualification?.Herkunft === 'Job' 
                    ? `Keine Mitarbeiter mit dem Job "${selectedQualification.JobTitle}" gefunden`
                    : selectedQualification?.Herkunft === 'Zusatz'
                    ? `Keine Mitarbeiter mit der Zusatzfunktion "${selectedQualification.AdditionalSkillNames ? selectedQualification.AdditionalSkillNames.join(', ') : selectedQualification.AdditionalSkillName}" gefunden`
                    : 'Keine Mitarbeiter verfügbar'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                {qualificationFilteredEmployees
                  .filter(emp => 
                    emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.StaffNumber?.toString().includes(searchTerm) ||
                    emp.Department?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(emp => {
                    const uniqueKey = `${emp.ID}-${emp.StaffNumber}`;
                    return (
                      <div key={uniqueKey} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assignedEmployees.includes(emp.ID.toString())}
                            onChange={(e) => {
                              const employeeId = emp.ID.toString();
                              setFormData(prev => ({
                                ...prev,
                                assignedEmployees: e.target.checked
                                  ? [...prev.assignedEmployees, employeeId]
                                  : prev.assignedEmployees.filter(id => id !== employeeId)
                              }));
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {emp.FullName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {emp.Department} • {emp.StaffNumber}
                              {selectedQualification?.Herkunft === 'Job' && emp.JobTitle && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                  {emp.JobTitle}
                                </span>
                              )}
                            </p>
                          </div>
                        </label>
                      </div>
                    );
                  })}
              </div>
            )}
            {errors.assignedEmployees && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.assignedEmployees}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Massenzuweisung aktiviert
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {currentEmployee?.role === 'hr' || currentEmployee?.role === 'admin' 
                    ? `Alle verfügbaren Mitarbeiter${selectedDepartment ? ` aus der Abteilung "${departmentsData?.find(d => d.ID.toString() === selectedDepartment)?.Department}"` : ''} werden automatisch zugewiesen.`
                    : 'Alle Mitarbeiter Ihrer Abteilung werden automatisch zugewiesen.'
                  }
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  Anzahl betroffener Mitarbeiter: {qualificationFilteredEmployees.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Add useEffect to fetch employee qualifications
  useEffect(() => {
    const fetchEmployeeQualifications = async () => {
      if (!selectedQualification?.ID) return;
      
      try {
        const data = await baseApi.get<any[]>(`/employee-qualifications/qualification/${selectedQualification.ID}`);
        setEmployeeQualifications(data);
      } catch (error) {
        console.error('Error fetching employee qualifications:', error);
        toast.error('Fehler beim Laden der Mitarbeiter-Qualifikationen');
      }
    };

    fetchEmployeeQualifications();
  }, [selectedQualification?.ID]);

  // Filter qualifications to show all, but mark those without trainers as non-selectable
  const filteredQualifications = qualificationsData?.filter(qual => {
    const matchesSearch = searchTerm === '' || 
      qual.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qual.Description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    const aHasTrainer = qualificationsWithTrainers.has(a.ID?.toString() || '');
    const bHasTrainer = qualificationsWithTrainers.has(b.ID?.toString() || '');
    if (aHasTrainer === bHasTrainer) {
      return (a.Name || '').localeCompare(b.Name || '');
    }
    return aHasTrainer ? -1 : 1;
  }) || [];

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
    
    // Only update title and description if we're not editing an existing training
    if (!editingTraining) {
      // Generate title with prefix based on qualification type
      let titlePrefix = '';
      switch (qualification.Herkunft) {
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
      isForEntireDepartment: isMandatoryQual,
      department: isMandatoryQual ? 'all' : (userDepartment || ''),
      trainer: '', // Reset trainer when qualification changes for new training
    }));
    } else {
      // When editing, only update the qualification ID and preserve other fields
      setFormData(prev => ({
        ...prev,
        qualificationIds: [qualification.ID?.toString() || ''],
        // Don't reset the trainer when editing
      }));
    }
  };

  // Calculate the next step based on current step and mandatory status
  const getNextStep = (currentStep: number): number => {
    if (currentStep === 1) {
      // After qualification selection, go to basic info
      return 2;
    }
    return currentStep + 1;
  };

  // Calculate the previous step based on current step
  const getPreviousStep = (currentStep: number): number => {
    if (currentStep === 2) {
      // Go back to qualification selection
      return 1;
    }
    return currentStep - 1;
  };

  // Update step validation
  const isStepComplete = (step: number): boolean => {
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
        });
        break;

      case 4: // Employee Assignment
        if (formData.assignedEmployees.length === 0 && !formData.isForAllEmployees) {
          newErrors.assignedEmployees = 'Bitte weisen Sie mindestens einen Mitarbeiter zu oder aktivieren Sie die Massenzuweisung';
        }
        break;

      case 5: // Summary
        // No additional validation needed for summary
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeStep === 5 && !isStepComplete(activeStep)) {
      return;
    }

    if (activeStep < 5) {
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

      // Ensure we have a valid date before creating the training
      if (!formData.sessions[0].date) {
        throw new Error('Bitte wählen Sie ein gültiges Datum für die Schulung');
      }

      // Prepare employee assignment data

      // Prepare the list of employees to assign
      // Priority: 1. Manual selection, 2. Mass assignment (respects department filter)
      const employeesToAssign = formData.assignedEmployees.length > 0
        ? formData.assignedEmployees // Use manually selected employees (highest priority)
        : formData.isForAllEmployees
        ? qualificationFilteredEmployees.map(emp => emp.ID.toString()) // Use qualification-filtered employees (respects department filter)
        : []; // No employees selected

      // Remove duplicates from employee assignments
      const uniqueEmployeesToAssign = [...new Set(employeesToAssign)];

      const trainingData = {
        Name: formData.title,
        Description: formData.description,
        qualificationID: parseInt(formData.qualificationIds[0]),
        qualification_TrainerID: qualificationTrainerId,
        trainingDate: new Date(formData.sessions[0].date).toISOString(),
        completed: formData.completed,
        isForEntireDepartment: formData.isForAllEmployees, // Use mass assignment flag
        assignedEmployees: uniqueEmployeesToAssign, // Add the employee list to the POST request
      };

      const result = editingTraining 
        ? await baseApi.put(`/trainings/${editingTraining.ID}`, trainingData)
        : await baseApi.post('/trainings', trainingData);

      // Get the newly created training ID 
      let trainingId = null;
      if (!editingTraining) {
        try {
          // First try to get ID from result if it exists
          if ((result as any)?.data?.ID) {
            trainingId = (result as any).data.ID;
          } else if ((result as any)?.ID) {
            trainingId = (result as any).ID;
          } else {
            const allTrainingsResponse = await baseApi.get<any[]>('/trainings');
            const allTrainings = Array.isArray(allTrainingsResponse) ? allTrainingsResponse : (allTrainingsResponse as any)?.data || [];
            
            // Find the training that matches our submitted data
            const matchingTraining = allTrainings.find((training: any) => 
              training.Name === formData.title && 
              training.Description === formData.description &&
              training.qualificationID?.toString() === formData.qualificationIds[0]
            );
            
            if (matchingTraining) {
              trainingId = matchingTraining.ID;
            } else {
              // Fallback: get the latest training (highest ID)
              if (allTrainings && allTrainings.length > 0) {
                const latestTraining = allTrainings.reduce((latest: any, current: any) => {
                  return current.ID > latest.ID ? current : latest;
                });
                trainingId = latestTraining.ID;
              }
            }
          }
        } catch (error) {
          // Error fetching training ID - continue without ID
        }
      }

      // Log success message with employee assignment count
      if (!editingTraining && uniqueEmployeesToAssign.length > 0) {
        toast.success(`Schulung erfolgreich erstellt und ${uniqueEmployeesToAssign.length} Mitarbeiter(n) zugewiesen`);
      } else {
        toast.success(editingTraining ? 'Schulung erfolgreich aktualisiert' : 'Schulung erfolgreich erstellt');
      }

      onAdd(result as any);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern der Schulung');
    }
  };

  const addSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      date: '',
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

  const handleDocumentUpload = (documents: TrainingDocument[]) => {
    toast.success(`${documents.length} Dokument(e) erfolgreich hinzugefügt`);
    setShowDocumentUploader(false);
  };

  const handleTrainingComplete = async (trainingId: number) => {
    try {
      // Update training status to completed with current date
      const currentDate = new Date().toISOString().split('T')[0];
      await baseApi.put(`/trainings/${trainingId}`, {
        completed: true,
        completedDate: currentDate,
        trainingDate: currentDate // Update the training date to the completion date
      });

      // Update local form data
      setFormData(prev => ({
        ...prev,
        completed: true
      }));

      toast.success('Schulung als abgeschlossen markiert');
    } catch (error) {
      toast.error('Fehler beim Markieren der Schulung als abgeschlossen');
    }
  };

  // Zähle Qualifikationen ohne Trainer
  const qualificationsWithoutTrainer = qualificationsData?.filter(qual => 
    !qualificationsWithTrainers.has(qual.ID?.toString() || '')
  ).length || 0;

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
    const steps = [1, 2, 3, 4, 5]; // Qualification, Basic Info, Sessions, Employee Assignment, Summary
    const stepLabels = [
      'Qualifikation',
      'Grundinfo',
      'Datum',
      'Mitarbeiter',
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

  // Update the trainer selection in step 2
  const renderTrainerSelection = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Trainer *
      </label>
      <select
        value={formData.trainer}
        onChange={(e) => {
          const selectedTrainerId = e.target.value;
          setFormData(prev => ({
            ...prev,
            trainer: selectedTrainerId,
            sessions: prev.sessions.map((session, index) => 
              index === 0 ? { ...session, trainer: selectedTrainerId } : session
            )
          }));
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
  );



  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-[#121212] text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingTraining ? 'Schulung bearbeiten' : 'Neue Schulung planen'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
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

                    {filteredQualifications.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'Keine passenden Qualifikationen gefunden' : 'Keine Qualifikationen verfügbar'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {qualificationsWithoutTrainer > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4 mb-4">
                            <div className="flex">
                              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                              <div>
                                <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                  Qualifikationen ohne Trainer
                                </h5>
                                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                  Es gibt {qualificationsWithoutTrainer} Qualifikation{qualificationsWithoutTrainer !== 1 ? 'en' : ''}, die noch keinen Trainer zugewiesen haben. Diese werden in der Liste mit einem Warnsymbol markiert.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {filteredQualifications.map((qual) => {
                          const hasTrainer = qualificationsWithTrainers.has(qual.ID?.toString() || '');
                          return (
                            <div
                              key={qual.ID}
                              className={`p-4 rounded-lg border transition-colors ${
                                hasTrainer ? 'cursor-pointer hover:border-primary/50' : 'cursor-not-allowed opacity-75'
                              } ${
                                selectedQualification?.ID === qual.ID
                                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                  : 'border-gray-200 dark:border-gray-700'
                              } ${!hasTrainer ? 'border-yellow-200 dark:border-yellow-900/50' : ''}`}
                              onClick={() => hasTrainer && handleQualificationSelect(qual)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {qual.Name}
                                        {editingTraining && qual.ID === initialQualification?.ID && (
                                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                            (Aktuelle Qualifikation)
                                          </span>
                                        )}
                                      </p>
                                      {qual.Herkunft === 'Zusatz' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-red-900/50 dark:text-red-200">
                                          {qual.AdditionalSkillNames && qual.AdditionalSkillNames.length > 0 ? qual.AdditionalSkillNames.join(', ') : qual.AdditionalSkillName}
                                        </span>
                                      )}
                                      {qual.Herkunft === 'Pflicht' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                          Pflicht
                                        </span>
                                      )}
                                      {qual.Herkunft === 'Job' && qual.JobTitle && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                          {qual.JobTitle}
                                        </span>
                                      )}
                                      {!hasTrainer && (
                                        <div className="relative group">
                                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Kein Trainer zugewiesen - nicht auswählbar
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {qual.Description}
                                    </p>
                                  </div>
                                  <input
                                    type="radio"
                                    checked={selectedQualification?.ID === qual.ID}
                                    onChange={() => {}}
                                    disabled={!hasTrainer}
                                    className={`mt-1 rounded-full border-gray-300 text-primary focus:ring-primary ${
                                      !hasTrainer ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  />
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  <p>Gültigkeitsdauer: {qual.ValidityInMonth >= 999 ? 'Läuft nie ab' : `${qual.ValidityInMonth} Monate`}</p>
                                  {qual.Herkunft === 'Zusatz' && qual.AdditionalSkillNames && qual.AdditionalSkillNames.length > 0 && (
                                    <div className="mt-2">
                                      <p className="font-medium">Zusatzfunktion:</p>
                                      <p className="text-sm">{qual.AdditionalSkillNames.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

                      {/* Use the new trainer selection component */}
                      {renderTrainerSelection()}

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


                    </div>
                  </div>
                )}

                {/* Step 3: Sessions */}
                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Datum
                      </h3>
{/*                       <button
                        type="button"
                        onClick={addSession}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a]"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Datum hinzufügen
                      </button> */}
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

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Datum *
                              </label>
                              <input
                                type="date"
                                required
                                value={session.date ? session.date.split('T')[0] : ''}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  const selectedDate = new Date(e.target.value);
                                  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
                                  
                                  if (dayOfWeek === 0 || dayOfWeek === 6) {
                                    toast.error('Wochenenden (Samstag und Sonntag) können nicht ausgewählt werden');
                                    return;
                                  }
                                  
                                  updateSession(session.id, { date: e.target.value });
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                              />
                              {errors[`session_${index}_date`] && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                  {errors[`session_${index}_date`]}
                                </p>
                              )}
                            </div>

                            {renderSessionTrainerSelect(session, index)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New employee assignment step */}
                {activeStep === 4 && renderEmployeeAssignment()}

                {/* Step 5: Summary */}
                {activeStep === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Info className="h-5 w-5 mr-2" />
                        Übersicht der Schulung
                      </h3>
                      
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
                              </div>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {new Date(session.date).toLocaleDateString('de-DE')}
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

                      {/* Qualification Card */}
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
                                Gültigkeitsdauer: {selectedQualification.ValidityInMonth >= 999 ? 'Läuft nie ab' : `${selectedQualification.ValidityInMonth} Monate`}
                              </p>
                              {selectedQualification.Herkunft === 'Zusatz' && selectedQualification.AdditionalSkillNames && selectedQualification.AdditionalSkillNames.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Zusatzfunktion:
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedQualification.AdditionalSkillNames.join(', ')}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Assigned Employees Card */}
                      <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-400 mr-2" />
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Zugewiesene Mitarbeiter
                            </h4>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formData.isForAllEmployees
                              ? (currentEmployee?.role === 'hr' || currentEmployee?.role === 'admin' 
                                  ? `Die Schulung ist für alle verfügbaren Mitarbeiter${selectedDepartment ? ` aus der Abteilung "${departmentsData?.find(d => d.ID.toString() === selectedDepartment)?.Department}"` : ''} vorgesehen.`
                                  : 'Die Schulung ist für alle Mitarbeiter Ihrer Abteilung vorgesehen.'
                                )
                              : `${formData.assignedEmployees.length} ${formData.assignedEmployees.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}`
                            }
                          </span>
                        </div>
                        <div className="space-y-3">
                          {formData.isForAllEmployees ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {currentEmployee?.role === 'hr' || currentEmployee?.role === 'admin' 
                                ? `Die Schulung ist für alle verfügbaren Mitarbeiter${selectedDepartment ? ` aus der Abteilung "${departmentsData?.find(d => d.ID.toString() === selectedDepartment)?.Department}"` : ''} vorgesehen.`
                                : 'Die Schulung ist für alle Mitarbeiter Ihrer Abteilung vorgesehen.'
                              }
                              {selectedQualification?.Herkunft === 'Job' && (
                                <span className="block mt-1">
                                  Nur Mitarbeiter mit Position: {selectedQualification.JobTitle}
                                </span>
                              )}
                              {selectedQualification?.Herkunft === 'Zusatz' && (
                                <span className="block mt-1">
                                  Nur Mitarbeiter mit Zusatzfunktion: {selectedQualification.AdditionalSkillNames ? selectedQualification.AdditionalSkillNames.join(', ') : selectedQualification.AdditionalSkillName}
                                </span>
                              )}
                            </p>
                          ) : formData.assignedEmployees.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {filteredEmployees
                                .filter(emp => formData.assignedEmployees.includes(emp.ID.toString()))
                                .map(emp => {
                                  const uniqueKey = `${emp.ID}-${emp.StaffNumber}`;
                                  return (
                                    <div key={uniqueKey} className="p-2 bg-white dark:bg-[#121212] rounded-md border border-gray-200 dark:border-gray-700">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {emp.FullName}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {emp.Department} • {emp.StaffNumber}
                                      </p>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Keine Mitarbeiter zugewiesen
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Actions Section */}
                    {editingTraining && (
                      <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Schulungsverwaltung
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-6">
                          {/* Status Display */}
                          <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Schulungsstatus
                                </h5>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                formData.completed 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                              }`}>
                                {formData.completed ? 'Abgeschlossen' : 'Ausstehend'}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formData.completed 
                                  ? 'Die Schulung wurde durch das Hochladen von Dokumenten als abgeschlossen markiert.'
                                  : 'Die Schulung wird automatisch als abgeschlossen markiert, sobald Dokumente hochgeladen werden.'
                                }
                              </p>
                            </div>
                          </div>

                          {/* Documents Card */}
                          <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Schulungsdokumente
                                </h5>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Laden Sie Handbücher, Präsentationen und andere Schulungsunterlagen hoch. Die Schulung wird automatisch als abgeschlossen markiert.
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowDocumentUploader(true)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Dokumente verwalten
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700"
              >
                {activeStep < 5 ? "Weiter" : (editingTraining ? "Änderungen speichern" : "Schulung erstellen")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Uploader Modal */}
      {showDocumentUploader && editingTraining && (
        <TrainingDocumentUploader
          training={editingTraining}
          onClose={() => setShowDocumentUploader(false)}
          onUpload={handleDocumentUpload}
          onTrainingComplete={handleTrainingComplete}
        />
      )}
    </div>
  );
}