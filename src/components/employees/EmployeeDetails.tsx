import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Users,
  Mail,
  Phone,
  Award,
  FileText,
  Download,
  Star,
  TrendingUp,
  DollarSign,
  BookOpen,
  Award as CertificateIcon,
  Target,
  Plus,
  X,
  Clock,
  AlertCircle,
  GraduationCap,
  CheckCircle,
  Users as UsersIcon,
  Calendar,
  Timer,
  BookOpen as BookOpenIcon,
  Tag,
  Building2,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { RootState } from "../../store";
import { hasPermission } from "../../store/slices/authSlice";
import type { Employee, Qualification, Training } from "../../types";
import { toast } from "sonner";
import { formatDate, getLatestQualifications } from "../../lib/utils";
import { useJobTitles } from "../../hooks/useJobTitles";
import { useDepartments } from "../../hooks/useDepartments";
import {
  useQualifications,
  useAddEmployeeQualification,
} from "../../hooks/useQualifications";
import { useEmployeeQualifications } from "../../hooks/useEmployeeQualifications";
import {
  useAddEmployeeSkill,
  useDeleteEmployeeSkill,
} from "../../hooks/useEmployeeSkills";
import { useGetEmployeeSkills } from "../../hooks/useEmployeeSkills";
import { useTrainings } from "../../hooks/useTrainings";
import { useQualificationTrainers } from '../../hooks/useQualificationTrainers';
import type { Qualification as QualificationApi } from "../../services/qualificationsApi";

interface Props {
  employee: Employee;
  onClose: () => void;
  onUpdate: (data: Partial<Employee>) => void;
  approvals: Array<{ trainingId: string; date: string; status: string }>;
  trainings: Training[];
  handleApproveTraining: (trainingId: string) => void;
  handleRejectTraining: (trainingId: string) => void;
}

type QualificationWithRequiredID = QualificationApi & { ID: number };

export default function EmployeeDetails({
  employee,
  onClose,
  onUpdate,
  approvals,
  trainings: employeeTrainings,
  handleApproveTraining,
  handleRejectTraining,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "info" | "qualifications" | "trainings" | "documents" | "approvals" | "trainer"
  >("info");
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>(
    employee.trainerFor || [],
  );
  const [isTrainer, setIsTrainer] = useState(employee.isTrainer || false);
  const [localEmployee, setLocalEmployee] = useState(employee);
  const { employee: currentEmployee } = useSelector(
    (state: RootState) => state.auth,
  );
  const isHRAdmin = hasPermission(currentEmployee, 'hr');
  const { data: jobTitlesData, isLoading: isLoadingJobTitles } = useJobTitles();
  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments();
  const { data: trainingsData, isLoading: isLoadingTrainings } = useTrainings();
  const { data: qualificationsData, isLoading: isLoadingQualifications } =
    useQualifications();
  const {
    data: employeeQualificationsData,
    isLoading: isLoadingEmployeeQualifications,
  } = useEmployeeQualifications(employee.ID.toString());
  const addEmployeeQualification = useAddEmployeeQualification();
  const addEmployeeSkill = useAddEmployeeSkill();
  const deleteEmployeeSkill = useDeleteEmployeeSkill();
  const { data: employeeSkills, isLoading: isLoadingSkills } = useGetEmployeeSkills(employee.ID.toString());
  const { data: trainerQualifications, addTrainer, removeTrainer } = useQualificationTrainers(employee.ID.toString());
  const [selectedQualificationTrainers, setSelectedQualificationTrainers] = useState<string[]>([]);
  const [canBeTrainer, setCanBeTrainer] = useState(false);

  // Update selectedQualificationTrainers and canBeTrainer when trainerQualifications changes
  useEffect(() => {
    if (!trainerQualifications) {
      return;
    }

    if (Array.isArray(trainerQualifications)) {
      // Extract qualification IDs from the API response
      const qualificationIds = trainerQualifications.map(tq => {
        return tq.QualificationID.toString(); // Convert to string for consistent comparison
      });
      
      setSelectedQualificationTrainers(qualificationIds);
      
      // Set trainer status based on whether there are any qualifications
      const hasTrainerQualifications = qualificationIds.length > 0;
      // Only update isTrainer if there are qualifications
      if (hasTrainerQualifications) {
        setIsTrainer(true);
      }
      // canBeTrainer is now true when there are NO qualifications
      setCanBeTrainer(!hasTrainerQualifications);
      
      // Only update employee data if trainer status has actually changed
      // and it's different from the current state
      if (hasTrainerQualifications !== localEmployee.isTrainer && 
          hasTrainerQualifications !== isTrainer) {
        const updatedEmployee = {
          ...localEmployee,
          isTrainer: hasTrainerQualifications,
          trainerFor: hasTrainerQualifications ? selectedTrainings : [],
        };
        
        setLocalEmployee(updatedEmployee);
        // Only call onUpdate if we're actually changing the trainer status
        if (hasTrainerQualifications !== localEmployee.isTrainer) {
          onUpdate(updatedEmployee);
        }
      }
    } else {
      setSelectedQualificationTrainers([]);
      setIsTrainer(false);
      setCanBeTrainer(true); // Enable toggle when no qualifications
    }
  }, [trainerQualifications]); // Remove dependencies that cause unnecessary updates

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "Keine Abteilung";
    const department = departmentsData?.find(
      (d) => d.ID === departmentId,
    );
    return department ? department.Department : departmentId.toString();
  };

  const getJobTitle = (jobTitleId: string) => {
    if (!jobTitlesData) return 'Laden...';
    const jobTitle = jobTitlesData.find(jt => jt.id === jobTitleId);
    return jobTitle ? jobTitle.jobTitle : jobTitleId;
  };

  // Get all qualifications from current and additional positions
  const getEmployeeQualifications = () => {
    if (!employeeQualificationsData) return [];
    return employeeQualificationsData.map((eq : any) => eq.QualificationID);
  };

  const tabs = [
    { id: "info", label: "Information" },
    { id: "qualifications", label: "Qualifikationen" },
    { id: "trainings", label: "Schulungen" },
    { id: "documents", label: "Dokumente" },
    ...(isHRAdmin ? [{ id: "trainer", label: "Trainer-Status" }] : []),
  ].filter(Boolean) as Array<{
    id: "info" | "qualifications" | "trainings" | "documents" | "approvals" | "trainer";
    label: string;
  }>;

  const handleAddSkill = async (skillId: number) => {
    try {
      await addEmployeeSkill.mutateAsync({
        employeeId: employee.ID.toString(),
        skillId: skillId,
      });
      setShowPositionModal(false);
    } catch (error) {
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await deleteEmployeeSkill.mutateAsync({
        employeeId: employee.ID.toString(),
        skillId: skillId,
      });
    } catch (error) {
    }
  };

  const handleAddQualification = async (qualificationId: string) => {
    try {
      const today = new Date();
      const qualification = qualificationsData?.find(
        (q) => q.ID === parseInt(qualificationId),
      );

      if (!qualification) {
        throw new Error("Qualifikation nicht gefunden");
      }

      // Only allow adding additional qualifications
      if (qualification.IsMandatory || qualification.JobTitleID?.length) {
        toast.error("Es können nur Zusatzqualifikationen hinzugefügt werden");
        return;
      }

      const expirationDate = new Date();
      expirationDate.setMonth(
        expirationDate.getMonth() + qualification.ValidityInMonth,
      );

      await addEmployeeQualification.mutateAsync({
        employeeId: employee.ID.toString(),
        qualificationId: qualificationId,
        qualifiedFrom: today.toISOString(),
        toQualifyUntil: expirationDate.toISOString(),
      });

      toast.success("Qualifikation erfolgreich hinzugefügt");
      setShowPositionModal(false);
    } catch (error) {
    }
  };

  const employeeQualifications = getLatestQualifications(employeeQualificationsData || []);

  const getQualificationStatus = (qualId: string) => {
    if (!employeeQualificationsData) return "inactive";

    const employeeQual = employeeQualificationsData.find(
      (eq : any) => eq.QualificationID === qualId,
    );

    if (!employeeQual) return "inactive";

    if (!employeeQual.isQualifiedUntil) return "inactive";
    const expiryDate = new Date(employeeQual.isQualifiedUntil);
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    if (expiryDate < today) return "expired";
    if (expiryDate <= twoMonthsFromNow) return "expiring";
    return "active";
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "expiring":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "expiring":
        return "Läuft bald ab";
      case "expired":
        return "Abgelaufen";
      case "inactive":
        return "Noch nicht vergeben";
      default:
        return "Inaktiv";
    }
  };

  const handleTrainerStatusChange = (checked: boolean) => {
    if (selectedQualificationTrainers.length > 0) {
      toast.error('Der Trainer-Status kann nicht geändert werden, solange Qualifikationen zugewiesen sind.');
      return;
    }
    
    setIsTrainer(checked);
    const updatedEmployee = {
      ...localEmployee,
      isTrainer: checked,
      trainerFor: checked ? selectedTrainings : [],
    };
    
    // Use setTimeout to break the update cycle
    setTimeout(() => {
      setLocalEmployee(updatedEmployee);
      onUpdate(updatedEmployee);
    }, 0);
  };

  const handleTrainingSelection = (trainingId: string) => {
    const newSelectedTrainings = selectedTrainings.includes(trainingId)
      ? selectedTrainings.filter((id) => id !== trainingId)
      : [...selectedTrainings, trainingId];

    setSelectedTrainings(newSelectedTrainings);
    const updatedEmployee = {
      ...localEmployee,
      trainerFor: newSelectedTrainings,
    };
    setLocalEmployee(updatedEmployee);
    onUpdate(updatedEmployee);
  };

  const userQualifications = employeeQualificationsData || [];

  const getQualificationName = (qualId: string) => {
    if (!qualificationsData) return "Unbekannte Qualifikation";
    const qualification = qualificationsData.find(q => q.ID?.toString() === qualId.toString());
    return qualification ? qualification.Name : "Unbekannte Qualifikation";
  };

  const availableQualifications =
    qualificationsData?.filter(
      (qual) =>
        qual.ID &&
        !employeeQualifications.some((eq:any) => eq.QualificationID === String(qual.ID)) &&
        (qual.Herkunft === "Zusatz" || qual.AdditionalSkillID), // Show Zusatz qualifications and those with AdditionalSkillID
    ) || [];

  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const handleQualificationTrainerChange = async (qualificationId: string) => {
    try {
      const isAdding = !selectedQualificationTrainers.includes(qualificationId);
      
      if (isAdding) {
        await addTrainer.mutateAsync({
          employeeId: employee.ID.toString(),
          qualificationId
        });
        setSelectedQualificationTrainers(prev => [...prev, qualificationId]);
        toast.success('Trainer-Status für Qualifikation hinzugefügt');
      } else {
        await removeTrainer.mutateAsync({
          employeeId: employee.ID.toString(),
          qualificationId
        });
        setSelectedQualificationTrainers(prev => prev.filter(id => id !== qualificationId));
        toast.success('Trainer-Status für Qualifikation entfernt');
      }
    } catch (error) {
    }
  };

  const hasValidID = (qualification: QualificationApi): qualification is QualificationWithRequiredID => {
    return typeof qualification.ID === 'number';
  };

  const renderQualificationCard = (qualification: QualificationApi) => {
    if (typeof qualification.ID !== 'number') return null;
    
    const qualificationId = qualification.ID.toString();
    const isSelected = selectedQualificationTrainers.includes(qualificationId);
    
    return (
      <div
        key={`qualification-${qualificationId}`}
        onClick={() => handleQualificationTrainerChange(qualificationId)}
        className={`p-4 rounded-lg border transition-all cursor-pointer
          ${isSelected
            ? "border-primary bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20"
            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h6 className="text-sm font-medium text-gray-900 dark:text-white">
              {qualification.Name}
            </h6>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {qualification.Description}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {qualification.IsMandatory && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                  Pflichtqualifikation
                </span>
              )}
              {qualification.JobTitle && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  {qualification.JobTitle}
                </span>
              )}
              {qualification.AdditionalSkillName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                  {qualification.AdditionalSkillName}
                </span>
              )}
              {qualification.AssignmentType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  {qualification.AssignmentType}
                </span>
              )}
            </div>
          </div>
          <div className="ml-4 flex items-center">
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center
              ${isSelected 
                ? 'border-primary bg-primary text-white' 
                : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {isSelected && (
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Als Trainer
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingQualifications || isLoadingEmployeeQualifications || isLoadingSkills) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#121212] rounded-lg p-6">
          <p className="text-gray-500 dark:text-gray-400">
            Lade Daten...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#121212] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white dark:bg-[#121212] text-gray-400 hover:text-gray-500 dark:text-white dark:hover:text-gray-300 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {getInitials(localEmployee.FullName)}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {localEmployee.FullName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isLoadingJobTitles
                      ? "Laden..."
                      : getJobTitle(
                          localEmployee.JobTitle?.toString() || "",
                        )}{" "}
                    • {localEmployee.Department}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                        ${
                          activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="mt-6">
                {activeTab === "info" && (
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {localEmployee.eMail && (
                        <div key="email" className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            {localEmployee.eMail}
                          </span>
                        </div>
                      )}
                      <div key="staff-number" className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          Personal-Nr.: {localEmployee.StaffNumber}
                        </span>
                      </div>
                      <div key="department" className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          Abteilung: {localEmployee.Department}
                        </span>
                      </div>
                      <div key="position" className="flex items-center">
                        <Award className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          Position:{" "}
                          {isLoadingJobTitles
                            ? "Laden..."
                            : getJobTitle(
                                localEmployee.JobTitle?.toString() || "",
                              )}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "qualifications" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Qualifikationen
                      </h4>
                      {isHRAdmin && (
                        <button
                          key="add-qualification-button"
                          onClick={() => setShowPositionModal(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a]"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Zusatzqualifikation hinzufügen
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {employeeQualifications.map((qual: any) => {
                        if (!qual.QualificationID) return null;
                        const status = getQualificationStatus(qual.QualificationID);
                        return (
                          <div
                            key={`qualification-${qual.QualificationID}`}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#181818] rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {getQualificationName(qual.QualificationID)}
                                </h5>
                              </div>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Qualifiziert seit: {qual.qualifiedFrom ? formatDate(qual.qualifiedFrom) : "noch nicht vergeben"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Gültig bis: {qual.toQualifyUntil ? formatDate(qual.toQualifyUntil) : "noch nicht vergeben"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(status)}`}
                            >
                              {getStatusText(status)}
                            </span>
                          </div>
                        );
                      })}

                      {employeeQualifications.length === 0 && (
                        <p key="no-qualifications" className="text-center text-gray-500 dark:text-gray-400">
                          Keine Qualifikationen vorhanden
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "trainings" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Schulungen
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Aktive Schulungen */}
                      <div className="space-y-3">
                        <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Aktive Schulungen
                        </h6>
                        <div className="space-y-2">
                          {employeeTrainings?.filter(training => !training.completed).map(training => (
                            <div
                              key={`active-training-${training.ID}`}
                              className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                            >
                              <div>
                                <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {training.Name}
                                </h6>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {training.Description}
                                </p>
                                <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  In Bearbeitung
                                </div>
                              </div>
                            </div>
                          ))}
                          {!employeeTrainings?.some(training => !training.completed) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Keine aktiven Schulungen
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Abgeschlossene Schulungen */}
                      <div className="space-y-3">
                        <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Abgeschlossene Schulungen
                        </h6>
                        <div className="space-y-2">
                          {employeeTrainings?.filter(training => training.completed).map(training => (
                            <div
                              key={`completed-training-${training.ID}`}
                              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                            >
                              <div>
                                <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {training.Name}
                                </h6>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {training.Description}
                                </p>
                                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Abgeschlossen
                                </div>
                              </div>
                            </div>
                          ))}
                          {!employeeTrainings?.some(training => training.completed) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Keine abgeschlossenen Schulungen
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium">Dokumente</h4>
                    {/* Add document details here */}
                  </div>
                )}

                {activeTab === "approvals" &&
                  localEmployee.role === "supervisor" && (
                    <div className="space-y-4">
                      {approvals.map((approval) => {
                        const training = trainingsData?.find(
                          (t: Training) => t.ID.toString() === approval.trainingId,
                        );
                        return (
                          <div
                            key={approval.trainingId}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {training?.Name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Beantragt am{" "}
                                {new Date(approval.date).toLocaleDateString()}
                              </p>
                            </div>
                            {approval.status === "ausstehend" && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleApproveTraining(approval.trainingId)
                                  }
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                  Genehmigen
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectTraining(approval.trainingId)
                                  }
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                  Ablehnen
                                </button>
                              </div>
                            )}
                            {approval.status !== "ausstehend" && (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  approval.status === "genehmigt"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {approval.status === "genehmigt"
                                  ? "Genehmigt"
                                  : "Abgelehnt"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {activeTab === "trainer" && isHRAdmin && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Trainer-Verwaltung
                      </h4>
                      <div 
                        key="trainer-status-toggle"
                        onClick={() => !selectedQualificationTrainers.length && handleTrainerStatusChange(!isTrainer)}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer
                          ${selectedQualificationTrainers.length > 0 
                            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isTrainer}
                          onChange={(e) => handleTrainerStatusChange(e.target.checked)}
                          disabled={selectedQualificationTrainers.length > 0}
                          className={`rounded border-gray-300 text-primary focus:ring-primary h-5 w-5
                            ${selectedQualificationTrainers.length > 0 ? 'cursor-not-allowed' : ''}`}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Als Trainer aktivieren
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedQualificationTrainers.length > 0 
                              ? 'Trainer-Status kann nicht geändert werden, solange Qualifikationen zugewiesen sind'
                              : 'Klicken Sie hier, um den Trainer-Status zu aktivieren/deaktivieren'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isTrainer && (
                      <div className="space-y-8">
                        {/* Qualifikationen Sektion */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Qualifikationen als Trainer
                            </h5>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedQualificationTrainers.length} von {qualificationsData?.length || 0} Qualifikationen
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Aktive Qualifikationen */}
                            <div className="space-y-3">
                              <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Aktive Qualifikationen
                              </h6>
                              <div className="space-y-2">
                                {qualificationsData?.filter(qual => 
                                  selectedQualificationTrainers.includes(qual.ID?.toString() || '')
                                ).map(qualification => (
                                  <div
                                    key={`active-qual-${qualification.ID}`}
                                    className="p-3 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                          {qualification.Name}
                                        </h6>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {qualification.Description}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleQualificationTrainerChange(qualification.ID?.toString() || '')}
                                        className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {selectedQualificationTrainers.length === 0 && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Keine aktiven Qualifikationen
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Verfügbare Qualifikationen */}
                            <div className="space-y-3">
                              <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Verfügbare Qualifikationen
                              </h6>
                              <div className="space-y-2">
                                {qualificationsData?.filter(qual => 
                                  !selectedQualificationTrainers.includes(qual.ID?.toString() || '')
                                ).map(qualification => (
                                  <div
                                    key={`available-qual-${qualification.ID}`}
                                    onClick={() => handleQualificationTrainerChange(qualification.ID?.toString() || '')}
                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-colors"
                                  >
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {qualification.Name}
                                      </h6>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {qualification.Description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {qualificationsData?.length === selectedQualificationTrainers.length && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Keine weiteren Qualifikationen verfügbar
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schulungen Sektion */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Durchgeführte Schulungen
                            </h5>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Aktive Schulungen */}
                            <div className="space-y-3">
                              <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Aktive Schulungen
                              </h6>
                              <div className="space-y-2">
                                {trainingsData?.filter(training => 
                                  selectedTrainings.includes(training.ID.toString()) && !training.completed
                                ).map(training => (
                                  <div
                                    key={`active-training-${training.ID}`}
                                    className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                                  >
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {training.Name}
                                      </h6>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {training.Description}
                                      </p>
                                      <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
                                        <Clock className="h-3 w-3 mr-1" />
                                        In Bearbeitung
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {!trainingsData?.some(training => 
                                  selectedTrainings.includes(training.ID.toString()) && !training.completed
                                ) && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Keine aktiven Schulungen
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Abgeschlossene Schulungen */}
                            <div className="space-y-3">
                              <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Abgeschlossene Schulungen
                              </h6>
                              <div className="space-y-2">
                                {trainingsData?.filter(training => 
                                  selectedTrainings.includes(training.ID.toString()) && training.completed
                                ).map(training => (
                                  <div
                                    key={`completed-training-${training.ID}`}
                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                                  >
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {training.Name}
                                      </h6>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {training.Description}
                                      </p>
                                      <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Abgeschlossen
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {!trainingsData?.some(training => 
                                  selectedTrainings.includes(training.ID.toString()) && training.completed
                                ) && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Keine abgeschlossenen Schulungen
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal für neue Zusatzfunktion */}
      {showPositionModal && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-end justify-center md:items-center">
          <div className="w-full md:max-w-md mx-4 transform transition-transform duration-300 ease-in-out">
            <div
              className="bg-white dark:bg-[#121212] rounded-t-xl md:rounded-xl p-4 max-h-[85vh] overflow-y-auto 
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-gray-100
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
            >
              <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Zusatzqualifikation hinzufügen
                  </h2>
                  <button
                    onClick={() => setShowPositionModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {availableQualifications.map((qual) => (
                  <div
                    key={qual.ID}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {qual.Name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                        <Star className="h-3 w-3 mr-1" />
                        Zusatzqualifikation
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {qual.Description}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        Gültigkeitsdauer: {qual.ValidityInMonth} Monate
                      </div>
                      <button
                        onClick={() => handleAddSkill(qual.ID!)}
                        className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/10 dark:hover:bg-primary/5"
                      >
                        Zusatzqualifikation hinzufügen
                      </button>
                    </div>
                  </div>
                ))}

                {availableQualifications.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Keine weiteren Zusatzqualifikationen verfügbar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}