import { useState, useEffect, useMemo } from "react";
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
  Trash2,
  Search,
  RefreshCw,
} from "lucide-react";
import { RootState } from "../../store";
import { hasPermission } from "../../store/slices/authSlice";
import { Employee, Training } from "../../types";
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
import { useAssignEmployeeTraining, useDeleteEmployeeTraining } from "../../hooks/useEmployeeTrainings";
import { useAdditionalFunctions } from "../../hooks/useAdditionalFunctions";
import type { AdditionalSkill } from "../../services/additionalFunctionsApi";
import EmployeeDocumentUploader from "../documents/EmployeeDocumentUploader";
import { useEmployeeDocuments } from '../../hooks/useDocuments';
import { useDocumentCategories } from '../../hooks/useDocumentCategories';
import { useDocumentDownload } from '../../hooks/useDocuments';
import { useDocumentInfo } from '../../hooks/useDocuments';
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { API_BASE_URL } from '../../config/api';
import apiClient from "../../services/apiClient";

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
    "info" | "qualifications" | "additional-skills" | "trainings" | "documents" | "approvals" | "trainer"
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
  const isHRAdmin = currentEmployee ? hasPermission(currentEmployee, 'hr') : false;
  const isSupervisor = currentEmployee?.isSupervisor === 1;
  const canManageEmployee = isHRAdmin || 
    (isSupervisor && (
      employee.SupervisorID?.toString() === currentEmployee?.StaffNumber?.toString() ||
      employee.ID.toString() === currentEmployee?.ID.toString()
    )) ||
    hasPermission(currentEmployee, 'admin');
  const canDeleteDocuments = isHRAdmin || hasPermission(currentEmployee, 'admin');
  const { data: jobTitlesData, isLoading: isLoadingJobTitles } = useJobTitles();
  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments();
  const { data: trainingsData, isLoading: isLoadingTrainings } = useTrainings();
  const { data: qualificationsData, isLoading: isLoadingQualifications } =
    useQualifications();
  const {
    data: employeeQualificationsData,
    isLoading: isLoadingEmployeeQualifications,
    refetch: refetchEmployeeQualifications,
  } = useEmployeeQualifications(employee.ID.toString());
  const addEmployeeQualification = useAddEmployeeQualification();
  const addEmployeeSkill = useAddEmployeeSkill();
  const deleteEmployeeSkill = useDeleteEmployeeSkill();
  const { data: employeeSkills, isLoading: isLoadingSkills, refetch: refetchEmployeeSkills } = useGetEmployeeSkills(employee.ID.toString());
  const { data: trainerQualifications, addTrainer, removeTrainer } = useQualificationTrainers(employee.ID.toString());
  const [selectedQualificationTrainers, setSelectedQualificationTrainers] = useState<string[]>([]);
  const [canBeTrainer, setCanBeTrainer] = useState(false);
  const [showAssignTrainingModal, setShowAssignTrainingModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  // Document filter and preview states
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [selectedDocumentTag, setSelectedDocumentTag] = useState<string>('');
  const [documentSortBy, setDocumentSortBy] = useState<'name' | 'date' >('date');
  const [documentSortOrder, setDocumentSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [documentViewMode, setDocumentViewMode] = useState<'grid' | 'list'>('grid');
  // Qualification filter states
  const [qualificationTypeFilter, setQualificationTypeFilter] = useState<'all' | 'pflicht' | 'position' | 'zusatz'>('all');
  const [qualificationStatusFilter, setQualificationStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'inactive'>('all');
  const assignTraining = useAssignEmployeeTraining();
  const deleteTraining = useDeleteEmployeeTraining();
  const { data: availableTrainings, isLoading: isLoadingAvailableTrainings } = useTrainings();
  const { data: assignedTrainings, isLoading: isLoadingAssignedTrainings } = useTrainings(employee.ID.toString());
  const { data: additionalSkills, isLoading: isLoadingAdditionalSkills } = useAdditionalFunctions();
  const { data: employeeDocuments, isLoading: isLoadingEmployeeDocuments, refetch: refetchEmployeeDocuments } = useEmployeeDocuments(employee.ID);
  const documentDownloadMutation = useDocumentDownload();
  const { data: selectedDocumentInfo } = useDocumentInfo(selectedDocument?.ID || 0);

  // Prevent background scrolling when modal is open
  useBodyScrollLock(true);

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
      
      // Update local state only, don't trigger server update automatically
      const updatedEmployee = {
        ...localEmployee,
        isTrainer: hasTrainerQualifications,
        trainerFor: hasTrainerQualifications ? selectedTrainings : [],
      };
      
      setLocalEmployee(updatedEmployee);
      // Removed automatic onUpdate call - only manual changes should trigger server updates
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
    const jobTitle = jobTitlesData.find(jt => jt.ID === jobTitleId);
    return jobTitle ? jobTitle.JobTitle : jobTitleId;
  };

  // Get all qualifications from current and additional positions
  const getEmployeeQualifications = () => {
    if (!employeeQualificationsData) return [];
    // Filter out qualifications that don't exist in qualificationsData
    return (employeeQualificationsData as any[])
      .filter((eq: any) => qualificationsData?.some(q => q.ID === eq.QualificationID))
      .map((eq: any) => eq.QualificationID);
  };

  const tabs = [
    { id: "info", label: "Information" },
    { id: "qualifications", label: "Qualifikationen" },
    { id: "additional-skills", label: "Zusatzfunktionen" },
    { id: "trainings", label: "Schulungen" },
    { id: "documents", label: "Dokumente" },
    ...(isHRAdmin ? [{ id: "trainer", label: "Trainer-Status" }] : []),
  ].filter(Boolean) as Array<{
    id: "info" | "qualifications" | "additional-skills" | "trainings" | "documents" | "approvals" | "trainer";
    label: string;
  }>;

  const availableAdditionalSkills = useMemo(() => {
    if (!additionalSkills || !employeeSkills || !qualificationsData) return [];
    
    return additionalSkills.filter(skill => 
      // Nur Zusatzfunktionen anzeigen, die noch nicht dem Mitarbeiter zugewiesen sind
      !employeeSkills.skills?.some((empSkill: any) => empSkill.AdditionalSkillID === skill.ID) &&
      // Nur Zusatzfunktionen anzeigen, die eine verknüpfte Qualifikation haben
      qualificationsData.some(qual => 
        qual.Herkunft === 'Zusatz' && 
        qual.AdditionalSkillID === skill.ID
      )
    );
  }, [additionalSkills, employeeSkills, qualificationsData]);

  const handleAddSkill = async (skillId: number) => {
    try {
      await addEmployeeSkill.mutateAsync({
        employeeId: employee.ID.toString(),
        skillId: skillId,
      });
      // Sofortige Aktualisierung der UI durch direkten refetch
      await refetchEmployeeSkills();
      setShowPositionModal(false);
      // Toast wird bereits im Hook angezeigt
    } catch (error) {
      // Error Toast wird bereits im Hook angezeigt
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await deleteEmployeeSkill.mutateAsync({
        employeeId: employee.ID.toString(),
        skillId: skillId,
      });
      // Sofortige Aktualisierung der UI durch direkten refetch
      await refetchEmployeeSkills();
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
        toast.error("Es können nur Zusatzfunktionen hinzugefügt werden");
        return;
      }

      // Für Qualifikationen mit ValidityInMonth = 999 (unendliche Gültigkeit)
      // setzen wir ein sehr weit in der Zukunft liegendes Datum
      let toQualifyUntil;
      if (qualification.ValidityInMonth === 999) {
        // Setze ein Datum weit in der Zukunft (z.B. 100 Jahre)
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
        toQualifyUntil = farFutureDate.toISOString();
      } else {
        // Normale Berechnung für Qualifikationen mit begrenzter Gültigkeit
        const expirationDate = new Date();
        expirationDate.setMonth(
          expirationDate.getMonth() + qualification.ValidityInMonth,
        );
        toQualifyUntil = expirationDate.toISOString();
      }

      await addEmployeeQualification.mutateAsync({
        employeeId: employee.ID.toString(),
        qualificationId: qualificationId,
        qualifiedFrom: today.toISOString(),
        toQualifyUntil: toQualifyUntil,
      });

      toast.success("Qualifikation erfolgreich hinzugefügt");
      setShowPositionModal(false);
    } catch (error) {
    }
  };

  const getQualificationStatus = (qualId: string) => {
    if (!employeeQualificationsData) return "inactive";

    const employeeQual = (employeeQualificationsData as any[]).find(
      (eq : any) => eq.QualificationID === qualId,
    );

    if (!employeeQual) return "inactive";
    
    // Finde die Qualifikation, um zu prüfen, ob sie nie abläuft (999 Monate)
    const qualification = qualificationsData?.find(q => q?.ID?.toString() === qualId.toString());
    
    // Wenn Qualifikation nie abläuft (999 Monate oder mehr), immer als "active" anzeigen
    if (qualification?.ValidityInMonth && qualification.ValidityInMonth >= 999) {
      return "active";
    }
    
    const expiryDate = employeeQual.isQualifiedUntil 
      ? new Date(employeeQual.isQualifiedUntil)
      : employeeQual.toQualifyUntil 
        ? new Date(employeeQual.toQualifyUntil)
        : null;
    
    if (!expiryDate || isNaN(expiryDate.getTime())) return "inactive";
    
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    if (expiryDate < today) return "expired";
    if (expiryDate <= twoMonthsFromNow) return "expiring";
    return "active";
  };

  const employeeQualifications = getLatestQualifications(
    ((employeeQualificationsData as any[]) || []).filter((qual: any) => 
      qualificationsData?.some(q => q.ID === qual.QualificationID)
    )
  );

  // Filter qualifications based on type and status
  const filteredQualifications = useMemo(() => {
    return employeeQualifications.filter((qual: any) => {
      if (!qual.QualificationID) return false;
      
      const qualification = qualificationsData?.find(q => q.ID?.toString() === qual.QualificationID?.toString());
      if (!qualification) return false;

      // Type filter
      if (qualificationTypeFilter !== 'all') {
        let qualificationType: 'pflicht' | 'position' | 'zusatz' = 'zusatz';
        if (qualification.Herkunft === 'Pflicht') {
          qualificationType = 'pflicht';
        } else if (qualification.JobTitle) {
          qualificationType = 'position';
        } else if (qualification.Herkunft === 'Zusatz') {
          qualificationType = 'zusatz';
        }
        
        if (qualificationType !== qualificationTypeFilter) {
          return false;
        }
      }

      // Status filter
      if (qualificationStatusFilter !== 'all') {
        const status = getQualificationStatus(qual.QualificationID);
        if (status !== qualificationStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [employeeQualifications, qualificationTypeFilter, qualificationStatusFilter, qualificationsData, employeeQualificationsData]);

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
    }
  };

  const handleTrainerStatusChange = async (checked: boolean) => {
    if (selectedQualificationTrainers.length > 0) {
      toast.error('Der Trainer-Status kann nicht geändert werden, solange Qualifikationen zugewiesen sind.');
      return;
    }
    
    try {
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
    } catch (error) {
      console.error('Error updating trainer status:', error);
      toast.error('Fehler beim Aktualisieren des Trainer-Status');
      // Revert the local state change
      setIsTrainer(!checked);
    }
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

  const handleDocumentUpload = async (uploadedDocuments: any[]) => {
    console.log('Uploaded documents:', uploadedDocuments);
    toast.success(`${uploadedDocuments.length} Dokument(e) erfolgreich hochgeladen`);
    setShowDocumentUploadModal(false);
    
    // Refetch documents to show the newly uploaded ones
    await refetchEmployeeDocuments();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return '📄';
    if (['doc', 'docx'].includes(extension || '')) return '📝';
    if (['xls', 'xlsx'].includes(extension || '')) return '📊';
    if (['ppt', 'pptx'].includes(extension || '')) return '📽️';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return '🖼️';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUploadDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Combine employee documents and training documents (filtered by employee)
  const getCombinedDocuments = () => {
    const employeeDocs = employeeDocuments || [];
    // Add document type to distinguish between employee and training documents
    const docsWithType = employeeDocs.map(doc => ({
      ...doc,
      DocumentID: doc.ID, // Map ID to DocumentID for consistency
      // Use EmployeeName if available, otherwise fall back to FullName
      FullName: (doc as any).EmployeeName || doc.FullName
    }));
    
    return docsWithType;
  };

  const getEmployeeAmountOfDocuments = () => {
    const employeeDocs = employeeDocuments || [];
    
    let filteredByEmployee = employeeDocs.filter(doc => doc.EmployeeID === employee.ID);
    return filteredByEmployee.length;
  };

  // Document filtering and sorting functions
  const getFilteredAndSortedDocuments = () => {
    const allDocuments = getCombinedDocuments();
    if (allDocuments.length === 0) return [];


    let filteredByEmployee = allDocuments.filter(doc => doc.EmployeeID === employee.ID);
    let filtered = filteredByEmployee.filter(doc => {
      // Search filter
      const matchesSearch = documentSearchTerm === '' || 
        doc.FileName.toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
        (doc.Description && doc.Description.toLowerCase().includes(documentSearchTerm.toLowerCase()));
      // Tag filter
      const matchesTag = selectedDocumentTag === ''

      return matchesSearch && matchesTag;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (documentSortBy) {
        case 'name':
          comparison = a.FileName.localeCompare(b.FileName);
          break;
        case 'date':
          comparison = new Date(a.UploadedAt).getTime() - new Date(b.UploadedAt).getTime();
          break;
      }

      return documentSortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  // Get all unique categories for filter options
  const getDocumentFilterOptions = () => {
    const allDocuments = getCombinedDocuments();
    if (allDocuments.length === 0) return { categories: [] };

    const categories = new Set<string>();

    return {
      categories: Array.from(categories).sort()
    };
  };

  // Handle document preview
  const handleDocumentPreview = (document: any) => {
    setSelectedDocument(document);
    setShowDocumentPreview(true);
  };

  // Check if document is PDF for preview capability
  const isPDFDocument = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  // Helper function to render document metadata
  const renderDocumentMetadata = (document: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {document.FileName}
        </p>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => window.open(document.FilePath, '_blank')}
            className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            title="Herunterladen"
          >
            <Download className="h-4 w-4" />
          </button>
          {canDeleteDocuments && (
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Löschen">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          Hochgeladen: {formatUploadDate(document.UploadedAt)}
        </div>
        <div className="flex items-center">
          <Users className="h-3 w-3 mr-1" />
          Von: {document.UploadedBy}
        </div>
      </div>

      {document.Description && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            <strong>Beschreibung:</strong> {document.Description}
          </p>
        </div>
      )}
    </div>
  );

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
            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
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
              {qualification.AdditionalSkillNames && qualification.AdditionalSkillNames.length > 0 && (
                qualification.AdditionalSkillNames.map((skillName, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                    {skillName}
                </span>
                ))
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
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#121212] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
                <div className="h-16 w-16 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                  <span className="text-lg font-medium dark:text-gray-900">
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
                            ? "border-primary text-primary dark:text-gray-200"
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
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {filteredQualifications.length} von {employeeQualifications.length} Qualifikationen
                      </div>
                    </div>

                    {/* Filter Options */}
                    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                    <div className="space-y-6">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Filter und Suche
                        </h5>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Qualification Type Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                              Qualifikationstyp
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setQualificationTypeFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                                  qualificationTypeFilter === 'all'
                                    ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200 border-primary shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                                }`}
                              >
                                Alle Typen
                              </button>
                              <button
                                onClick={() => setQualificationTypeFilter('pflicht')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                                  qualificationTypeFilter === 'pflicht'
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                                }`}
                              >
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Pflicht
                              </button>
                              <button
                                onClick={() => setQualificationTypeFilter('position')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                                  qualificationTypeFilter === 'position'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300'
                                }`}
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Position
                              </button>
                              <button
                                onClick={() => setQualificationTypeFilter('zusatz')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                                  qualificationTypeFilter === 'zusatz'
                                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300'
                                }`}
                              >
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                Zusatz
                              </button>
                            </div>
                          </div>

                          {/* Status Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                              Status
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setQualificationStatusFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                                  qualificationStatusFilter === 'all'
                                    ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200 border-primary shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                                }`}
                              >
                                Alle Status
                              </button>
                              <button
                                onClick={() => setQualificationStatusFilter('active')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                                  qualificationStatusFilter === 'active'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300'
                                }`}
                              >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Aktiv
                              </button>
                              <button
                                onClick={() => setQualificationStatusFilter('expiring')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                                  qualificationStatusFilter === 'expiring'
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-300'
                                }`}
                              >
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                Läuft bald ab
                              </button>
                              <button
                                onClick={() => setQualificationStatusFilter('expired')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                                  qualificationStatusFilter === 'expired'
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 shadow-md'
                                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                                }`}
                              >
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Abgelaufen
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Clear Filters */}
                        {(qualificationTypeFilter !== 'all' || qualificationStatusFilter !== 'all') && (
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => {
                                setQualificationTypeFilter('all');
                                setQualificationStatusFilter('all');
                              }}
                              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Filter zurücksetzen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {filteredQualifications.map((qual: any) => {
                        if (!qual.QualificationID) return null;
                        const status = getQualificationStatus(qual.QualificationID);
                        return (
                          <div
                            key={`qualification-${qual.QualificationID}`}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#181818] rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {getQualificationName(qual.QualificationID)}
                                </h5>
                                {/* Qualifikationstyp Tags */}
                                {qualificationsData?.find(q => q.ID?.toString() === qual.QualificationID?.toString())?.Herkunft === "Pflicht" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    Pflichtqualifikation
                                  </span>
                                )}
                                {qualificationsData?.find(q => q.ID?.toString() === qual.QualificationID?.toString())?.Herkunft === "Zusatz" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                    Zusatzfunktion
                                  </span>
                                )}
                                {qualificationsData?.find(q => q.ID?.toString() === qual.QualificationID?.toString())?.JobTitle && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                    Positionsqualifikation
                                  </span>
                                )}
                                {/* Karenztage Tag */}
                                {qual.toQualifyUntil && new Date(qual.toQualifyUntil) > new Date() && !qual.isQualifiedUntil && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                    Karenztage bis {formatDate(qual.toQualifyUntil)}
                                  </span>
                                )}
                                {/* Absolviert Tag */}
                                {qual.qualifiedFrom && getQualificationStatus(qual.QualificationID) !== "expired" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                    Absolviert am {formatDate(qual.qualifiedFrom)}
                                  </span>
                                )}
                                {/* Abgelaufen Tag */}
                                {getQualificationStatus(qual.QualificationID) === "expired" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    {(() => {
                                      const expiryDate = qual.isQualifiedUntil 
                                        ? new Date(qual.isQualifiedUntil)
                                        : qual.toQualifyUntil 
                                          ? new Date(qual.toQualifyUntil)
                                          : null;
                                      if (!expiryDate) return "Abgelaufen";
                                      
                                      const gracePeriodEnd = new Date(expiryDate);
                                      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14);
                                      const today = new Date();
                                      const daysSinceExpiry = Math.abs(Math.floor((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24)));
                                      const dayText = daysSinceExpiry === 1 ? 'Tag' : 'Tagen';
                                      return `Abgelaufen seit ${daysSinceExpiry} ${dayText} (inkl. 14 Tage Karenz)`;
                                    })()}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Gültig seit: {qual.qualifiedFrom ? formatDate(qual.qualifiedFrom) : "noch nicht abgeschlossen"}
                                </p>
                                {qual.toQualifyUntil && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Gültig bis: {(() => {
                                      const qualification = qualificationsData?.find(q => q.ID?.toString() === qual.QualificationID?.toString());
                                      return qualification?.ValidityInMonth && qualification.ValidityInMonth === 999 ? 'Läuft nie ab' : formatDate(qual.toQualifyUntil);
                                    })()}
                                  </p>
                                )}
                                {(() => {
                                  const qualification = qualificationsData?.find(q => q.ID?.toString() === qual.QualificationID?.toString());
                                  return qualification?.ValidityInMonth && qualification.ValidityInMonth < 999 && (qual.isQualifiedUntil || qual.toQualifyUntil) ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Weiterqualifizierung bis: {formatDate(new Date(new Date(qual.isQualifiedUntil || qual.toQualifyUntil).getTime() + (14 * 24 * 60 * 60 * 1000)))} (inkl. + 14 Tage)
                                    </p>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (() => {
                                  const status = getQualificationStatus(qual.QualificationID);
                                  switch (status) {
                                    case "active":
                                      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
                                    case "expiring":
                                      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
                                    case "expired":
                                      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
                                    case "inactive":
                                    default:
                                      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
                                  }
                                })()
                              }`}>
                                {(() => {
                                  const status = getQualificationStatus(qual.QualificationID);
                                  switch (status) {
                                    case "active":
                                      return 'Aktiv';
                                    case "expiring":
                                      return 'Auslaufend';
                                    case "expired":
                                      return 'Abgelaufen';
                                    case "inactive":
                                    default:
                                      return 'Erforderlich';
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredQualifications.length === 0 && (
                        <p key="no-qualifications" className="text-center text-gray-500 dark:text-gray-400">
                          {employeeQualifications.length === 0 
                            ? 'Keine Qualifikationen vorhanden'
                            : 'Keine Qualifikationen entsprechen den gewählten Filtern'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "additional-skills" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Zusatzfunktionen
                      </h4>
                      {canManageEmployee && (
                        <button
                          onClick={() => setShowPositionModal(true)}
                          className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 shadow-sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Zusatzfunktion hinzufügen
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Aktuelle Zusatzfunktionen */}
                      <div className="space-y-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                          Aktuelle Zusatzfunktionen
                        </h5>
                        {isLoadingSkills ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Lade Zusatzfunktionen...</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {employeeSkills?.skills?.map((skill: any) => (
                              <div
                                key={`employee-skill-${skill.ID}`}
                                className="p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {skill.Name}
                                      </h6>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                        <Star className="h-3 w-3 mr-1" />
                                        Zusatzfunktion
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {skill.Description}
                                    </p>
                                    {/* Verknüpfte Qualifikation anzeigen */}
                                    {(() => {
                                      const linkedQualification = qualificationsData?.find(qual => 
                                        qual.Herkunft === 'Zusatz' && qual.AdditionalSkillID === skill.ID
                                      );
                                      if (linkedQualification) {
                                        const employeeQual = employeeQualifications.find(eq => 
                                          eq.QualificationID.toString() === linkedQualification.ID?.toString()
                                        );
                                        return (
                                          <div className="mt-2 space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                              <Award className="h-3 w-3 mr-1" />
                                              Qualifikation: {linkedQualification.Name}
                                            </p>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="mt-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                              <AlertCircle className="h-3 w-3 mr-1" />
                                              Keine verknüpfte Qualifikation
                                            </p>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  {canManageEmployee && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Möchten Sie diese Zusatzfunktion wirklich entfernen?')) {
                                          handleDeleteSkill(skill.AdditionalSkillID || skill.ID);
                                        }
                                      }}
                                      className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                      title="Zusatzfunktion entfernen"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {(!employeeSkills?.skills || employeeSkills.skills.length === 0) && (
                              <div className="col-span-full">
                                <p className="text-center text-gray-500 dark:text-gray-400 italic p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                  Keine Zusatzfunktionen zugewiesen
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Verfügbare Zusatzfunktionen */}
                      {canManageEmployee && availableAdditionalSkills.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                            Verfügbare Zusatzfunktionen
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableAdditionalSkills.slice(0, 4).map((skill) => (
                              <div
                                key={`available-skill-${skill.ID}`}
                                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer transition-all duration-200 hover:shadow-md"
                                onClick={() => handleAddSkill(skill.ID!)}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {skill.Name}
                                  </h6>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Verfügbar
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {skill.Description}
                                </p>
                              </div>
                            ))}
                          </div>
                          {availableAdditionalSkills.length > 4 && (
                            <div className="text-center">
                              <button
                                onClick={() => setShowPositionModal(true)}
                                className="text-sm text-primary hover:text-primary/80 font-medium"
                              >
                                Alle verfügbaren Zusatzfunktionen anzeigen ({availableAdditionalSkills.length - 4} weitere)
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Statistiken */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h6 className="text-sm font-medium text-purple-900 dark:text-purple-300">
                              Zusatzfunktionen-Übersicht
                            </h6>
                            <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                              {employeeSkills?.skills?.length || 0} aktive Zusatzfunktionen • {availableAdditionalSkills.length} verfügbar
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-purple-700 dark:text-purple-400">
                            <div className="text-center">
                              <div className="font-medium">{employeeSkills?.skills?.length || 0}</div>
                              <div>Aktiv</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{availableAdditionalSkills.length}</div>
                              <div>Verfügbar</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "trainings" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Schulungen
                      </h4>
                      {/* {canManageEmployee && (
                        <button
                          onClick={() => setShowAssignTrainingModal(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a]"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Schulung zuweisen
                        </button>
                      )} */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Ausstehende Schulungen */}
                      <div className="space-y-4">
                        <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-2">
                          Ausstehende Schulungen
                        </h6>
                        <div className="space-y-3">
                          {isLoadingAssignedTrainings ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Lade Schulungen...</p>
                          ) : (
                            <>
                              {assignedTrainings?.filter(training => !training.completed).map(training => (
                            <div
                                  key={`pending-training-${training.ID}`}
                                  className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/50 bg-yellow-50/50 dark:bg-yellow-900/10 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2">
                                <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {training.Name}
                                </h6>
                                        {training.isMandatory && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                            Pflichtschulung
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {training.Description}
                                </p>
                                      {training.trainingDate && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                          <Calendar className="h-3 w-3 inline mr-1" />
                                          Termin: {new Date(training.trainingDate).toLocaleDateString()}
                                          {(() => {
                                            if (!training.trainingDate) return null;
                                            const today = new Date();
                                            const trainingDate = new Date(training.trainingDate);
                                            const diffTime = trainingDate.getTime() - today.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            
                                            if (diffDays < 0) {
                                              return <span className="ml-2 text-red-500 dark:text-red-400">(Überfällig)</span>;
                                            } else if (diffDays === 0) {
                                              return <span className="ml-2 text-yellow-500 dark:text-yellow-400">(Heute)</span>;
                                            } else if (diffDays === 1) {
                                              return <span className="ml-2 text-yellow-500 dark:text-yellow-400">(Morgen)</span>;
                                            } else if (diffDays <= 7) {
                                              return <span className="ml-2 text-yellow-500 dark:text-yellow-400">(in {diffDays} Tagen)</span>;
                                            } else {
                                              return <span className="ml-2 text-gray-500 dark:text-gray-400">(in {diffDays} Tagen)</span>;
                                            }
                                          })()}
                                        </p>
                                      )}
                                      <div className="mt-2 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                        Noch zu absolvieren
                                </div>
                                    </div>
                                    {canManageEmployee && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm('Möchten Sie diese Schulung wirklich entfernen?')) {
                                            deleteTraining.mutate({
                                              employeeId: employee.ID.toString(),
                                              trainingId: training.ID.toString()
                                            });
                                          }
                                        }}
                                        className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                        title="Schulung entfernen"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                              </div>
                            </div>
                          ))}
                              {!assignedTrainings?.some(training => !training.completed) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                  Keine ausstehenden Schulungen
                            </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Abgeschlossene Schulungen */}
                      <div className="space-y-4">
                        <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-2">
                          Abgeschlossene Schulungen
                        </h6>
                        <div className="space-y-3">
                          {isLoadingAssignedTrainings ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Lade Schulungen...</p>
                          ) : (
                            <>
                              {assignedTrainings?.filter(training => training.completed).map(training => (
                            <div
                              key={`completed-training-${training.ID}`}
                                  className="p-4 rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {training.Name}
                                </h6>
                                      {training.isMandatory && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                          Pflichtschulung
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {training.Description}
                                </p>
                                    {training.trainingDate && (
                                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        Absolviert am: {new Date(training.trainingDate).toLocaleDateString()}
                                      </p>
                                    )}
                                    <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                      Erfolgreich abgeschlossen
                                </div>
                              </div>
                            </div>
                          ))}
                              {!assignedTrainings?.some(training => training.completed) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                              Keine abgeschlossenen Schulungen
                            </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="space-y-8">
                    {/* Header mit Aktionen */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Dokumente
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Verwalten Sie alle Dokumente für {employee.FullName}
                        </p>
                      </div>
                      {canManageEmployee && (
                        <button
                          onClick={() => setShowDocumentUploadModal(true)}
                          className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-[#181818] dark:hover:bg-[#2a2a2a]  text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Neues Dokument
                        </button>
                      )}
                    </div>

                    {(isLoadingEmployeeDocuments) ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
                        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                          Dokumente werden geladen...
                        </p>
                      </div>
                    ) : getCombinedDocuments().length > 0 ? (
                      (() => {
                        const filteredDocuments = getFilteredAndSortedDocuments();
                        const filterOptions = getDocumentFilterOptions();

                        return (
                          <div className="space-y-8">
                            {/* Search and Filter Bar */}
                            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                          <div className="space-y-6">
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                  Filter und Suche
                                </h5>
                                
                                <div className="flex flex-col lg:flex-row gap-6">
                                  {/* Search */}
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Suche
                                    </label>
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Dokumente durchsuchen..."
                                        value={documentSearchTerm}
                                        onChange={(e) => setDocumentSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                      />
                                </div>
                              </div>
                              </div>
                              
                                {/* Sort and View Options */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Sort Options */}
                                    <div className="flex items-center gap-3">
                                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Sortieren:
                                      </label>
                                      <select
                                        value={documentSortBy}
                                        onChange={(e) => setDocumentSortBy(e.target.value as 'name' | 'date')}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white py-2 px-3"
                                      >
                                        <option value="date">Nach Datum</option>
                                        <option value="name">Nach Name</option>
                                      </select>
                                      <button
                                        onClick={() => setDocumentSortOrder(documentSortOrder === 'asc' ? 'desc' : 'asc')}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors"
                                        title={`Sortierung: ${documentSortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}`}
                                      >
                                        {documentSortOrder === 'asc' ? '↑' : '↓'}
                                      </button>
                                    </div>

                                    {/* Results Summary */}
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                      {filteredDocuments.length} von {getEmployeeAmountOfDocuments()} Dokumenten
                                    </span>
                                </div>
                              </div>
                              
                                  <div className="flex items-center gap-4">
                                    {/* Reset Filter Button */}
                                    {(documentSearchTerm || selectedDocumentTag) && (
                                      <button
                                        onClick={() => {
                                          setDocumentSearchTerm('');
                                          setSelectedDocumentTag('');
                                        }}
                                        className="text-sm text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                      >
                                        Filter zurücksetzen
                                      </button>
                                    )}

                                    {/* View Mode Toggle */}
                                    <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => setDocumentViewMode('grid')}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                                          documentViewMode === 'grid'
                                            ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                                            : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        Grid
                                      </button>
                                      <button
                                        onClick={() => setDocumentViewMode('list')}
                                        className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition-colors ${
                                          documentViewMode === 'list'
                                            ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                                            : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        Liste
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Document Display */}
                            {filteredDocuments.length > 0 ? (
                              documentViewMode === 'grid' ? (
                                /* Grid View */
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {filteredDocuments.map(document => (
                                    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="text-3xl">
                                          {getFileIcon(document.FileName)}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {isPDFDocument(document.FileName) && (
                                            <button
                                              onClick={() => handleDocumentPreview(document)}
                                              className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                              title="Vorschau"
                                            >
                                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                              </svg>
                                            </button>
                                          )}
                                          <button
                                            onClick={() => window.open(`${apiClient.getBaseUrl()}/document-download/${document.DocumentID}`, '_blank')}
                                            className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                            title="Herunterladen"
                                          >
                                            <Download className="h-4 w-4" />
                                          </button>
                                          {canDeleteDocuments && (
                                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Löschen">
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          )}
                                        </div>
                                        </div>

                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-relaxed">
                                        {document.FileName}
                                      </h4>

                                      <div className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                          <Calendar className="h-3 w-3 mr-2" />
                                          <span>{formatUploadDate(document.UploadedAt)} </span>
                                      </div>
                                                                <div className="flex items-center">
                                      <Users className="h-3 w-3 mr-2" />
                                      <span>{document.FullName}</span>
                                    </div>
                                  </div>

                                      {document.Description && (
                                        <div className="mt-4 bg-gray-50 dark:bg-[#181818] rounded-lg p-3">
                                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                            <span className="font-medium">Beschreibung:</span> {document.Description}
                                          </p>
                                        </div>
                                      )}

                                    </div>
                                  ))}
                                </div>
                              ) : (
                                /* List View */
                                <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredDocuments.map(document => (
                                      <div key={`${document.DocumentID}`} className="p-6 hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                                            <div className="text-3xl">
                                              {getFileIcon(document.FileName)}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {document.FileName}
                                              </h4>
                                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-6">
                                                <span className="flex items-center">
                                                  <Calendar className="h-3 w-3 mr-1" />
                                                  {formatUploadDate(document.UploadedAt)}
                                                </span>
                                                                                                <span className="flex items-center">
                                                  <Users className="h-3 w-3 mr-1" />
                                                  {document.UploadedBy}
                                                </span>

                                              </div>
                                              
                                              {document.Description && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-2">
                                                  <span className="font-medium">Beschreibung:</span> {document.Description}
                                                </p>
                                              )}

                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2 ml-6">
                                            {isPDFDocument(document.FileName) && (
                                              <button
                                                onClick={() => handleDocumentPreview(document)}
                                                className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                title="Vorschau"
                                              >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                              </button>
                                            )}
                                            <button 
                                              onClick={() => window.open(`${apiClient.getBaseUrl()}/document-download/${document.DocumentID}`, '_blank')}
                                              className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                              title="Herunterladen"
                                            >
                                              <Download className="h-4 w-4" />
                                            </button>
                                            {canDeleteDocuments && (
                                              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Löschen">
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            ) : (
                              /* No Results */
                              <div className="text-center py-16">
                                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  Keine Dokumente gefunden
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                  Versuchen Sie, Ihre Suchkriterien anzupassen.
                                </p>
                                <button
                                  onClick={() => {
                                    setDocumentSearchTerm('');
                                    setSelectedDocumentTag('');
                                  }}
                                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 dark:hover:bg-primary/5 transition-colors"
                                >
                                  Filter zurücksetzen
                                </button>
                            </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-20">
                        <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                          <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          Keine Dokumente vorhanden
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                          Für {employee.FullName} wurden noch keine Dokumente hochgeladen. Laden Sie das erste Dokument hoch, um zu beginnen.
                        </p>
                        {canManageEmployee && (
                          <button
                            onClick={() => setShowDocumentUploadModal(true)}
                            className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors shadow-sm"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Erstes Dokument hinzufügen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "approvals" &&
                  localEmployee.role === "supervisor" && (
                    <div className="space-y-4">
                      {approvals.map((approval) => {
                        const training = trainingsData?.find(
                          (t: Training) => t.ID.toString() === approval.trainingId.toString(),
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
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 dark:hover:bg-[#2a2a2a] '
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
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ">
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
            <div className="bg-white dark:bg-[#121212] rounded-t-xl md:rounded-xl p-4 max-h-[85vh] overflow-y-auto">
              <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Zusatzfunktion hinzufügen
                  </h2>
                  <button
                    onClick={() => setShowPositionModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {isLoadingAdditionalSkills ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Lade Zusatzfunktionen...</p>
                </div>
              ) : (
              <div className="space-y-4">
                  {availableAdditionalSkills.map((skill) => (
                  <div
                      key={skill.ID}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {skill.Name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                        <Star className="h-3 w-3 mr-1" />
                          Zusatzfunktion
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {skill.Description}
                    </p>
                      <button
                        onClick={() => handleAddSkill(skill.ID!)}
                        className="mt-4 w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/10 dark:hover:bg-primary/5"
                      >
                        Zusatzfunktion hinzufügen
                      </button>
                  </div>
                ))}

                  {availableAdditionalSkills.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Keine weiteren Zusatzfunktionen verfügbar
                  </p>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAssignTrainingModal && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-end justify-center md:items-center">
          <div className="w-full md:max-w-md mx-4 transform transition-transform duration-300 ease-in-out">
            <div className="bg-white dark:bg-[#121212] rounded-t-xl md:rounded-xl p-4 max-h-[85vh] overflow-y-auto">
              <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Schulung zuweisen
                  </h2>
                  <button
                    onClick={() => setShowAssignTrainingModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {isLoadingAvailableTrainings ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Lade verfügbare Schulungen...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableTrainings?.filter(training => 
                    !assignedTrainings?.some(at => at.ID === training.ID)
                  ).map(training => (
                    <div
                      key={training.ID}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {training.Name}
                        </h3>
                        {training.isMandatory && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            Pflichtschulung
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {training.Description}
                      </p>
                      {training.trainingDate && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Termin: {new Date(training.trainingDate).toLocaleDateString()}
                          {(() => {
                            if (!training.trainingDate) return null;
                            const today = new Date();
                            const trainingDate = new Date(training.trainingDate);
                            const diffTime = trainingDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays < 0) {
                              return <span className="ml-2 text-red-500 dark:text-red-400">(Überfällig)</span>;
                            } else if (diffDays === 0) {
                              return <span className="ml-2 text-yellow-500 dark:text-yellow-400">(Heute)</span>;
                            } else if (diffDays === 1) {
                              return <span className="ml-2 text-yellow-500 dark:text-yellow-400">(Morgen)</span>;
                            } else if (diffDays <= 7) {
                              return <span className="ml-2 text-yellow-500 dark:text-yellow-400">(in {diffDays} Tagen)</span>;
                            } else {
                              return <span className="ml-2 text-gray-500 dark:text-gray-400">(in {diffDays} Tagen)</span>;
                            }
                          })()}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          assignTraining.mutate({
                            employeeId: employee.ID.toString(),
                            trainingId: training.ID.toString()
                          });
                          setShowAssignTrainingModal(false);
                        }}
                        className="mt-4 w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/10 dark:hover:bg-primary/5"
                      >
                        Schulung zuweisen
                      </button>
                    </div>
                  ))}

                  {!availableTrainings?.some(training => 
                    !assignedTrainings?.some(at => at.ID === training.ID)
                  ) && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Keine weiteren Schulungen verfügbar
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUploadModal && (
        <EmployeeDocumentUploader
          employee={employee}
          onClose={() => setShowDocumentUploadModal(false)}
          onUpload={handleDocumentUpload}
        />
      )}

      {/* PDF Preview Modal */}
      {showDocumentPreview && selectedDocument && (
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-[#121212] rounded-lg w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {selectedDocumentInfo?.FileName || selectedDocument.FileName}
                </h2>
                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatUploadDate(selectedDocumentInfo?.UploadedAt || selectedDocument.UploadedAt)}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {selectedDocumentInfo?.UploadedBy || selectedDocument.UploadedBy}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={`${apiClient.getBaseUrl()}/document-download/${selectedDocument.ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Dokument herunterladen"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Herunterladen
                </a>
                <button
                  onClick={() => setShowDocumentPreview(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Description */}
            {(selectedDocumentInfo?.Description || selectedDocument.Description) && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-[#181818] border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Beschreibung:</strong> {selectedDocumentInfo?.Description || selectedDocument.Description}
                </p>
              </div>
            )}

            {/* PDF Content */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-900">
              {isPDFDocument(selectedDocument.FileName) ? (
                <iframe
                  src={`${apiClient.getBaseUrl()}/document-view/${selectedDocument.ID}?`}
                  className="w-full h-full border-0"
                  title={selectedDocument.FileName}
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {getFileIcon(selectedDocument.FileName)}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Vorschau nicht verfügbar
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Für diesen Dateityp ist keine Vorschau verfügbar.
                    </p>
                    <a
                      href={`${apiClient.getBaseUrl()}/document-download/${selectedDocument.ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
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
}