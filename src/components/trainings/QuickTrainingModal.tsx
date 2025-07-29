import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Award, Edit2, Building2, Globe, Search, AlertCircle, BookOpen, Timer, Users, Calendar, MapPin, Info, FileText, CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
import apiClient from '../../services/apiClient';

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

export default function QuickTrainingModal({ onClose, onAdd, userDepartment, editingTraining }: Props) {
  const queryClient = useQueryClient();
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
    // This ensures supervisors can only assign their own team members to trainings
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

  // Get departments that have employees (for filter dropdown)
  const departmentsWithEmployees = useMemo(() => {
    if (!employeesData?.data || !departmentsData) return [];
    
    const employeeDepartments = new Set(
      employeesData.data
        .filter(emp => emp.isActive)
        .map(emp => emp.DepartmentID?.toString())
        .filter(Boolean)
    );
    
    return departmentsData.filter(dept => 
      employeeDepartments.has(dept.ID.toString())
    );
  }, [employeesData?.data, departmentsData]);

  // Find the qualification for the editing training
  const initialQualification = editingTraining && qualificationsData
    ? qualificationsData.find(q => q.ID?.toString() === editingTraining.qualificationID) || null
    : null;

  // Set initial qualification when editing
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(initialQualification);

  // Use React Query hooks instead of direct API calls
  const { data: allQualificationTrainers = [] } = useAllQualificationTrainers();
  const { data: qualificationSpecificTrainers = [] } = useQualificationTrainersByQualificationId(selectedQualification?.ID);

  // Use useMemo instead of useEffect to avoid infinite loops
  const qualificationsWithTrainers = useMemo(() => {
    if (allQualificationTrainers.length > 0) {
      // Create a set of qualification IDs that have trainers
      return new Set<string>(
        allQualificationTrainers
          .map((trainer: any) => trainer.QualificationID?.toString())
          .filter((id: string | undefined): id is string => id !== undefined)
      );
    }
    return new Set<string>();
  }, [allQualificationTrainers]);

  // Create a stable dependency for selectedQualification ID
  const selectedQualificationId = useMemo(() => 
    selectedQualification?.ID?.toString(), 
    [selectedQualification?.ID]
  );

  // Create a stable dependency for allQualificationTrainers
  const allQualificationTrainersStable = useMemo(() => 
    allQualificationTrainers, 
    [allQualificationTrainers]
  );

  // Create a stable dependency for employeesData
  const employeesDataStable = useMemo(() => 
    employeesData, 
    [employeesData?.data]
  );

  // Create a stable dependency for editingTraining
  const editingTrainingStable = useMemo(() => 
    editingTraining, 
    [editingTraining?.ID]
  );

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
    if (
      editingTraining &&
      initialQualification &&
      selectedQualification?.ID !== initialQualification.ID
    ) {
      handleQualificationSelect(initialQualification);
    }
  }, [editingTraining, initialQualification, userDepartment, selectedQualification?.ID]);

  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);

  // Get available positions for selected department
  const selectedDepartmentData = departmentsData?.find(d => d.ID.toString() === selectedDepartment);
  const availablePositions = selectedDepartmentData?.positions || [];

  // Add new state for temporary documents
  const [pendingDocuments, setPendingDocuments] = useState<File[]>([]);

  // Add new state for tracking upload status
  const [showUploader, setShowUploader] = useState(false);

  // Add state for the created training ID
  const [createdTraining, setCreatedTraining] = useState<Training | null>(null);

  // Add new state for employee qualifications
  const [employeeQualifications, setEmployeeQualifications] = useState<Array<{
    EmployeeID: number;
    QualificationID: number;
    qualifiedFrom: string;
    isQualifiedUntil: string;
  }>>([]);

  // Add loading state for employee qualifications
  const [isLoadingEmployeeQualifications, setIsLoadingEmployeeQualifications] = useState(false);

  // Employee qualifications are now fetched on-demand when needed

  // Helper function to check if a qualification has eligible employees
  const hasEligibleEmployeesForQualification = (qualification: Qualification) => {
    if (!qualification.ID || isLoadingEmployeeQualifications) return false;
    
    let filtered = filteredEmployees;
    
    // Filter by job title or additional skill if required
    if (qualification.Herkunft === 'Job' && qualification.JobTitleID) {
      filtered = filtered.filter(emp => 
        emp.JobTitleID?.toString() === qualification.JobTitleID?.toString()
      );
    } else if (qualification.Herkunft === 'Zusatz' && qualification.AdditionalSkillID) {
      if (!allEmployeeSkills) return false;
      
      filtered = filtered.filter(emp => {
        const hasRequiredSkill = Array.isArray(allEmployeeSkills) && allEmployeeSkills.some((skill: any) => {
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
        const hasRequiredSkill = Array.isArray(allEmployeeSkills) && allEmployeeSkills.some((skill: any) => {
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

      case 3: // Employee Assignment
        if (formData.assignedEmployees.length === 0 && !formData.isForAllEmployees) {
          newErrors.assignedEmployees = 'Bitte weisen Sie mindestens einen Mitarbeiter zu oder aktivieren Sie die Massenzuweisung';
        }
        break;

      case 4: // Document Upload
        if (!showUploader) {
          newErrors.documents = 'Bitte laden Sie zuerst ein Dokument hoch';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add function to create training
  const createTraining = async () => {
    try {
      // Validate trainer selection
      if (!formData.trainer) {
        throw new Error('Bitte wählen Sie einen Trainer aus');
      }

      const qualificationTrainerId = trainerQualificationIds[formData.trainer];
      if (!qualificationTrainerId) {
        throw new Error('Kein gültiger Trainer für diese Qualifikation ausgewählt');
      }

      // Prepare the list of employees to assign with correct priority
      let employeesToAssign: string[] = [];

      // Priority order: Manual selection > Mass assignment (respects department filter)
      if (formData.assignedEmployees.length > 0) {
        // 1. Manual selection has highest priority
        employeesToAssign = formData.assignedEmployees;
      } else if (formData.isForAllEmployees) {
        // 2. Mass assignment (respects department filter)
        employeesToAssign = qualificationFilteredEmployees.map(emp => emp.ID.toString());
      } else {
        // 3. No assignment (empty list)
        employeesToAssign = [];
      }

      // Remove duplicates from employee assignments
      const uniqueEmployeesToAssign = [...new Set(employeesToAssign)];

      // Create the training first
      const trainingData = {
        Name: formData.title,
        Description: formData.description,
        qualificationID: parseInt(formData.qualificationIds[0]),
        qualification_TrainerID: qualificationTrainerId,
        trainingDate: new Date().toISOString(),
        completed: false,
        isForEntireDepartment: formData.isForAllEmployees, // Use mass assignment flag
        department: formData.department,
        assignedEmployees: uniqueEmployeesToAssign,
      };

      const result = editingTraining 
        ? await apiClient.put(`/trainings/${editingTraining.ID}`, trainingData) as any
        : await apiClient.post('/trainings', trainingData) as any;

      let createdTrainingData;

      if (result.ID) {
        // If the backend returns the training object with ID
        createdTrainingData = result;
      } else {
        // Current case: backend returns only success message, fetch latest training
        const allTrainings = await apiClient.get('/trainings') as any[];
        
        // When editing, we should use the existing training ID
        if (editingTraining) {
          createdTrainingData = {
            ID: editingTraining.ID,
            Name: editingTraining.Name,
            Description: editingTraining.Description,
            completed: editingTraining.completed,
            qualificationID: editingTraining.qualificationID?.toString(),
            qualification_TrainerID: editingTraining.qualification_TrainerID?.toString(),
            trainingDate: editingTraining.trainingDate,
            isMandatory: editingTraining.isMandatory || false
          };
        } else {
          // For new trainings, find the most recently created training
          const incompleteTrainings = allTrainings.filter((training: any) => 
            training.completed === false || training.completed === 0 || !training.completed
          );

          let potentialTrainings = incompleteTrainings.filter((training: any) => {
            const titleMatch = training.Name === formData.title;
            const trainerMatch = training.Qualification_TrainerID === qualificationTrainerId || 
                                training.qualification_TrainerID === qualificationTrainerId;
            
            return titleMatch && trainerMatch;
          });
          
          if (potentialTrainings.length === 0) {
            potentialTrainings = incompleteTrainings.filter((training: any) => 
              training.Name === formData.title
            );
          }
          
          const latestTraining = potentialTrainings
            .sort((a: any, b: any) => {
              const dateA = new Date(a.TrainingDate || a.trainingDate || a.createdAt || 0);
              const dateB = new Date(b.TrainingDate || b.trainingDate || b.createdAt || 0);
              return dateB.getTime() - dateA.getTime();
            })[0];

          if (!latestTraining) {
            throw new Error('Erstellte Schulung konnte nicht gefunden werden');
          }

          createdTrainingData = {
            ID: latestTraining.ID,
            Name: latestTraining.Name,
            Description: latestTraining.Description,
            completed: latestTraining.completed,
            qualificationID: latestTraining.QualificationID?.toString(),
            qualification_TrainerID: latestTraining.Qualification_TrainerID?.toString(),
            trainingDate: latestTraining.TrainingDate,
            isMandatory: latestTraining.isMandatory || false
          };
        }
      }

      // Store the created training
      setCreatedTraining(createdTrainingData as Training);
      return createdTrainingData as Training;
      
    } catch (error) {
      console.error('Error creating training:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen der Schulung');
      throw error;
    }
  };

  const handleShowUploader = async () => {
    try {
      if (!createdTraining) {
        console.log('Creating training before showing uploader...');
        await createTraining();
      }
      setShowUploader(true);
    } catch (error) {
      console.error('Error creating training:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen der Schulung');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeStep === 4) {
      if (!showUploader) {
        // Create training first, then show uploader
        await handleShowUploader();
        return;
      }
      return;
    }

    if (!isStepComplete(activeStep)) {
      return;
    }
    setActiveStep(activeStep + 1);
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

  // This function is called AFTER documents are uploaded and training is completed by TrainingDocumentUploader
  const handleDocumentUpload = async (documents: TrainingDocument[]) => {
    try {
      let trainingToUse = createdTraining;
      
      // If no training exists yet, create it first
      if (!trainingToUse) {
        console.log('No training found, creating training first...');
        trainingToUse = await createTraining();
      }

      if (!trainingToUse) {
        throw new Error('Kein Training gefunden - das sollte nicht passieren');
      }

      console.log('Documents uploaded and training completed via TrainingDocumentUploader');
      console.log('Using training ID:', trainingToUse.ID);
      
      // Training completion is now handled by TrainingDocumentUploader via onTrainingComplete
      // So we just need to close the modal and notify parent
      
      // Close modal and notify parent
      onAdd(trainingToUse);
      onClose();
    } catch (error) {
      console.error('Error in handleDocumentUpload:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Abschließen');
      // Close uploader on error but keep modal open
      setShowUploader(false);
    }
  };

  // Add function to get the latest training ID
  const getLatestTrainingId = async () => {
    try {
      const trainings = await apiClient.get('/trainings') as any[];
      if (trainings.length > 0) {
        // Sort by ID in descending order to get the latest
        const sortedTrainings = trainings.sort((a: any, b: any) => b.ID - a.ID);
        const latestTrainingId = sortedTrainings[0].ID;
        console.log('Latest training ID:', latestTrainingId);
        return latestTrainingId;
      }
    } catch (error) {
      console.error('Error fetching latest training ID:', error);
    }
    return null;
  };

  // Same training completion logic as in Trainings.tsx
  const handleTrainingCompleteLogic = async (trainingId: number, completionDate?: string) => {
    try {
      console.log('handleTrainingCompleteLogic called with:', { trainingId, completionDate });
      
      let actualTrainingId;
      
      if (editingTraining) {
        // When editing, use the existing training ID
        actualTrainingId = editingTraining.ID;
        console.log('Using existing training ID for editing:', actualTrainingId);
      } else {
        // For new trainings, get the latest training ID
        const latestTrainingId = await getLatestTrainingId();
        if (!latestTrainingId) {
          throw new Error('Konnte die neueste Training-ID nicht abrufen');
        }
        actualTrainingId = latestTrainingId;
        console.log('Using latest training ID for new training:', actualTrainingId);
      }
      
      // Update training status to completed with the specified completion date
      const currentDate = completionDate || new Date().toISOString().split('T')[0];
      await apiClient.put(`/trainings/${actualTrainingId}`, {
        completed: true,
        completedDate: currentDate,
        trainingDate: currentDate // Update the training date to the completion date
      });

      console.log('Training marked as completed successfully');

      console.log('Training marked as completed successfully');

      // Try to update participant qualifications
      let updatedCount = 0;
      
      // Find the training to get its qualification - use the correct training
      const training = editingTraining || createdTraining;
      if (training && training.qualificationID) {
        try {
          // Get training participants
          const allAssignments = await apiClient.get('/trainings-employee') as any[];
          console.log('All assignments:', allAssignments);
          console.log('TrainingID:', actualTrainingId);
          const trainingParticipants = allAssignments.filter(
            (assignment: any) => assignment.TrainingID === actualTrainingId
          );

          console.log('Training participants found:', trainingParticipants.length);

          // Get qualification details to calculate validity
          const qualification = qualificationsData?.find(q => q.ID?.toString() === training.qualificationID);
          if (qualification) {
            console.log('Found qualification:', qualification.Name);

            // Calculate qualification validity dates
            const qualifiedFromDate = completionDate || new Date().toISOString().split('T')[0];
            const qualifiedFrom = new Date(qualifiedFromDate);
            const isQualifiedUntil = new Date(qualifiedFrom);
            isQualifiedUntil.setMonth(isQualifiedUntil.getMonth() + (qualification.ValidityInMonth || 12));
            const isQualifiedUntilString = isQualifiedUntil.toISOString().split('T')[0];

            console.log('Qualification validity:', {
              qualifiedFrom: qualifiedFromDate,
              isQualifiedUntil: isQualifiedUntilString,
              validityInMonth: qualification.ValidityInMonth
            });

            // Update qualifications for each participant
            for (const participant of trainingParticipants) {
              try {
                try {
                  await apiClient.put(`/employee-qualifications/${participant.EmployeeID}/${training.qualificationID}`, {
                    qualifiedFrom: qualifiedFromDate,
                    isQualifiedUntil: isQualifiedUntilString
                  });
                  updatedCount++;
                  console.log(`Updated qualification for employee ${participant.EmployeeID}`);
                } catch (updateError) {
                  console.log(`Failed to update qualification for employee ${participant.EmployeeID}:`, updateError);
                }
              } catch (error) {
                console.error(`Error updating qualification for employee ${participant.EmployeeID}:`, error);
              }
            }
          } else {
            console.log('Qualification not found for training');
          }
        } catch (error) {
          console.error('Error updating participant qualifications:', error);
        }
      } else {
        console.log('Training not found or no qualification associated');
      }

      // Refresh trainings and qualifications data
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });

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
      throw error; // Re-throw to be handled by caller
    }
  };

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
    const steps = [1, 2, 3, 4]; // Qualification, Basic Info, Employee Assignment, Documents
    const stepLabels = [
      'Qualifikation',
      'Grundinfo',
      'Mitarbeiter',
      'Dokumente & Datum'
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

            {filteredQualifications.length === 0 ? (
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
                  qualificationFilteredEmployees
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
                    })
                )}
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-[#121212] text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingTraining ? 'Schulung bearbeiten' : 'Neue Schulung dokumentieren'}
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
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }} className="space-y-6">
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
                        {!searchTerm && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                            Qualifikationen werden nur angezeigt, wenn sie einen Trainer haben und Mitarbeiter zugewiesen werden können.
                          </p>
                        )}
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
                          const isClickable = hasTrainer;
                          
                          return (
                            <div
                              key={qual.ID}
                              className={`p-4 rounded-lg border transition-colors ${
                                isClickable ? 'cursor-pointer hover:border-primary/50' : 'cursor-not-allowed opacity-75'
                              } ${
                                selectedQualification?.ID === qual.ID
                                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                  : 'border-gray-200 dark:border-gray-700'
                              } ${!hasTrainer ? 'border-yellow-200 dark:border-yellow-900/50' : ''}`}
                              onClick={() => isClickable && handleQualificationSelect(qual)}
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
                                          {qual.AdditionalSkillName}
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
                                    disabled={!isClickable}
                                    className={`mt-1 rounded-full border-gray-300 text-primary focus:ring-primary ${
                                      !isClickable ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  />
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  <p>Gültigkeitsdauer: {qual.ValidityInMonth >= 999 ? 'Läuft nie ab' : `${qual.ValidityInMonth} Monate`}</p>
                                  {qual.Herkunft === 'Zusatz' && qual.AdditionalSkillName && (
                                    <div className="mt-2">
                                      <p className="font-medium">Zusatzfunktion:</p>
                                      <p className="text-sm">{qual.AdditionalSkillName}</p>
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

                {/* Step 3: Employee Assignment */}
                {activeStep === 3 && renderEmployeeAssignment()}

                {/* Step 4: Document Upload */}
                {activeStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Schulungsdokumente
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {!showUploader && (
                        <>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Klicken Sie auf das Feld unten oder auf "Dokumente auswählen", um die Schulungsdokumente hochzuladen. Das Hochladen schließt die Schulung automatisch ab.
                          </p>
                          <div 
                            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900/50 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            onClick={() => {
                              if (activeStep === 4) {
                                handleShowUploader();
                              }
                            }}
                          >
                            <div className="text-center">
                              <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Schulung dokumentieren
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                                Klicken Sie hier, um die Dokumente auszuwählen, die die abgeschlossene Schulung belegen. Die Schulung wird automatisch als abgeschlossen markiert.
                              </p>
                              <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Dokumente auswählen
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {showUploader && (editingTraining || createdTraining) && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <TrainingDocumentUploader
                            training={editingTraining || createdTraining!}
                            onClose={() => setShowUploader(false)}
                            onUpload={handleDocumentUpload}
                            onTrainingComplete={handleTrainingCompleteLogic}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  if (showUploader) {
                    setShowUploader(false);
                  } else if (activeStep > 1) {
                    setActiveStep(activeStep - 1);
                  } else {
                    onClose();
                  }
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {showUploader ? "Zurück" : activeStep > 1 ? "Zurück" : "Abbrechen"}
              </button>

              <button
                type="submit"
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700"
              >
                {activeStep < 4 ? "Weiter" : 
                  showUploader ? "Abbrechen" :
                  "Dokumente auswählen"}
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
        />
      )}
    </div>
  );
}