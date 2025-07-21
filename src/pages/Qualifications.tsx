import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Plus,
  Search,
  Award,
  X,
  Edit2,
  Clock,
  AlertCircle,
  Info,
  Building2,
  Briefcase,
  Star,
  Users,
  Trash2,
  Link,
  AlertTriangle,
  Lock,
  Eye,
} from "lucide-react";
import { RootState } from "../store";
import { hasHRPermissions } from "../store/slices/authSlice";
import { toast } from "sonner";
import {
  useQualifications,
  useCreateQualification,
  useUpdateQualification,
  useDeleteQualification,
} from "../hooks/useQualifications";
import { useJobTitles } from "../hooks/useJobTitles";
import { useAdditionalFunctions } from "../hooks/useAdditionalFunctions";
import { useEmployeeQualifications } from "../hooks/useEmployeeQualifications";
import { useTrainings } from "../hooks/useTrainings";
import { useEmployees } from "../hooks/useEmployees";
import type { Qualification } from "../services/qualificationsApi";
import EmployeeDetails from "../components/employees/EmployeeDetails";
import { useQueryClient } from "@tanstack/react-query";

export default function Qualifications() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQual, setEditingQual] = useState<Qualification | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [selectedFilters, setSelectedFilters] = useState<Array<'Pflicht' | 'Job' | 'Zusatz'>>([]);
  const [showAssignedEmployees, setShowAssignedEmployees] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const { data: qualifications, isLoading, error } = useQualifications();
  const { data: jobTitles, isLoading: isLoadingJobTitles } = useJobTitles();
  const { data: additionalFunctions, isLoading: isLoadingAdditionalFunctions } =
    useAdditionalFunctions();
  const { data: allEmployeeQualifications } = useEmployeeQualifications();
  const { data: allTrainings } = useTrainings();
  const { data: employeesData } = useEmployees({ limit: 1000 });

  const createMutation = useCreateQualification();
  const updateMutation = useUpdateQualification();
  const deleteMutation = useDeleteQualification();
  const queryClient = useQueryClient();

  const isHRAdmin = hasHRPermissions(employee);
  const isSupervisor = employee?.role === "supervisor";

  // Function to get employees assigned to a qualification
  const getAssignedEmployees = (qualificationId: number) => {
    if (!allEmployeeQualifications || !Array.isArray(allEmployeeQualifications) || !employeesData?.data) {
      return [];
    }
    
    const assignedEmployeeIds = allEmployeeQualifications
      .filter((eq: any) => 
        eq && 
        eq.QualificationID && 
        eq.EmployeeID && 
        eq.QualificationID.toString() === qualificationId.toString()
      )
      .map((eq: any) => eq.EmployeeID.toString());
    
    return employeesData.data.filter((emp: any) => 
      assignedEmployeeIds.includes(emp.ID.toString())
    );
  };

  // Function to check if a qualification is assigned to any employee
  const isQualificationAssigned = (qualificationId: number) => {
    if (!allEmployeeQualifications || !Array.isArray(allEmployeeQualifications)) {
      return false;
    }
    
    // Filter out any invalid entries and check for actual assignments
    const validAssignments = allEmployeeQualifications.filter((eq: any) => 
      eq && 
      eq.QualificationID && 
      eq.EmployeeID && 
      eq.QualificationID.toString() === qualificationId.toString()
    );
    
    return validAssignments.length > 0;
  };

  // Function to check if a qualification is used in any training
  const isQualificationUsedInTraining = (qualificationId: number) => {
    if (!allTrainings || !Array.isArray(allTrainings)) {
      return false;
    }
    
    return allTrainings.some((training: any) => 
      training.qualificationID?.toString() === qualificationId.toString()
    );
  };

  // Function to check if a qualification can be deleted
  const canDeleteQualification = (qualification: Qualification) => {
    // Pflichtqualifikationen können nie gelöscht werden
    if (qualification.Herkunft === "Pflicht" || qualification.IsMandatory) {
      return false;
    }
    
    // Nur Zusatzqualifikationen die Mitarbeitern zugewiesen sind können nicht gelöscht werden
    if (qualification.Herkunft === "Zusatz" && isQualificationAssigned(qualification.ID!)) {
      return false;
    }
    
    // Qualifikationen die in Trainings verwendet werden können nicht gelöscht werden
    if (isQualificationUsedInTraining(qualification.ID!)) {
      return false;
    }
    
    return true;
  };

  // Function to get deletion reason
  const getDeletionReason = (qualification: Qualification) => {
    if (qualification.Herkunft === "Pflicht" || qualification.IsMandatory) {
      return "Pflichtqualifikationen können nicht gelöscht werden";
    }
    
    if (qualification.Herkunft === "Zusatz" && isQualificationAssigned(qualification.ID!)) {
      return "Diese Zusatzqualifikation ist Mitarbeitern zugewiesen und kann nicht gelöscht werden";
    }
    
    if (isQualificationUsedInTraining(qualification.ID!)) {
      return "Diese Qualifikation wird in Trainings verwendet und kann nicht gelöscht werden";
    }
    
    return "";
  };

  if (!isHRAdmin && !isSupervisor) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Zugriff verweigert
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Sie haben keine Berechtigung, diese Seite aufzurufen.
          </p>
        </div>
      </div>
    );
  }

  


  if (isLoading || isLoadingJobTitles || isLoadingAdditionalFunctions) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">Laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-red-500">
          Fehler beim Laden der Qualifikationen
        </p>
      </div>
    );
  }

  const filteredQualifications = qualifications?.filter(qual => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = qual.Name.toLowerCase().includes(searchTermLower) ||
                         qual.Description.toLowerCase().includes(searchTermLower);
    
    // Wenn keine Filter ausgewählt sind, zeige alle an
    if (selectedFilters.length === 0) {
      return matchesSearch;
    }
    
    // Filtere nach ausgewählten Typen
    return matchesSearch && selectedFilters.includes(qual.Herkunft);
  }) || [];

  // Dedupliziere Qualifikationen basierend auf ID
  const uniqueQualifications = filteredQualifications.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.ID === current.ID);
    if (existingIndex === -1) {
      acc.push(current);
    } else {
      // Wenn eine Duplikat gefunden wird, behalte die neueste (basierend auf Name/Description)
    }
    return acc;
  }, [] as typeof filteredQualifications);

  const getAssignmentInfo = (qualification: Qualification) => {
    switch (qualification.Herkunft) {
      case "Pflicht":
        return {
          type: "Pflicht",
          label: "Pflichtqualifikation",
          description: "Erforderlich für alle Mitarbeiter",
          icon: AlertCircle,
          style: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
        };
      case "Job":
        return {
          type: "Job",
          label: "Positionsqualifikation",
          description: "An eine Position gebunden",
          icon: Briefcase,
          style:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
        };
      case "Zusatz":
        return {
          type: "Zusatz",
          label: "Zusatzqualifikation",
          description: "Zusätzliche Qualifikation",
          icon: Star,
          style:
            "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
        };
      default:
        return {
          type: "unassigned",
          label: "Nicht zugewiesen",
          description: "Keine spezifische Zuweisung",
          icon: AlertCircle,
          style:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
        };
    }
  };

  const handleAddQualification = async (
    qualification: Omit<Qualification, "ID">,
  ) => {
    try {
      await createMutation.mutateAsync(qualification);
      setShowAddModal(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleEditQualification = async (qualification: Qualification) => {
    if (!qualification.ID) return;

    try {
      // Für Zusatzqualifikationen: Stelle sicher, dass nur die geänderten Zusatzfunktionen gesendet werden
      if (qualification.Herkunft === "Zusatz") {
        // Processing Zusatz qualification update
      }
      
      await updateMutation.mutateAsync({
        id: qualification.ID,
        data: qualification,
      });
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['qualifications'] });
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
      queryClient.invalidateQueries({ queryKey: ['employeeSkills'] });
      
      setEditingQual(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleDeleteQualification = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Qualifikationen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Verwalten Sie Qualifikationen und deren Anforderungen
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
          >
            <Plus className="h-5 w-5 mr-2" />
            Neue Qualifikation
          </button>
          <Award className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>

      {/* Search Area */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Qualifikationen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Filter Options */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedFilters(prev => 
                    prev.includes('Pflicht') 
                      ? prev.filter(f => f !== 'Pflicht')
                      : [...prev, 'Pflicht']
                  );
                }}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
                  ${selectedFilters.includes('Pflicht')
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <AlertCircle className="h-4 w-4 mr-1.5" />
                Pflichtqualifikationen
              </button>

              <button
                onClick={() => {
                  setSelectedFilters(prev => 
                    prev.includes('Job') 
                      ? prev.filter(f => f !== 'Job')
                      : [...prev, 'Job']
                  );
                }}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
                  ${selectedFilters.includes('Job')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <Briefcase className="h-4 w-4 mr-1.5" />
                Positionsqualifikationen
              </button>

              <button
                onClick={() => {
                  setSelectedFilters(prev => 
                    prev.includes('Zusatz') 
                      ? prev.filter(f => f !== 'Zusatz')
                      : [...prev, 'Zusatz']
                  );
                }}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
                  ${selectedFilters.includes('Zusatz')
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                    : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <Star className="h-4 w-4 mr-1.5" />
                Zusatzfunktionen
              </button>

              {selectedFilters.length > 0 && (
                <button
                  onClick={() => setSelectedFilters([])}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Qualifications List */}
        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
          {uniqueQualifications.map((qualification, index) => {
            const assignmentInfo = getAssignmentInfo(qualification);

            return (
              <div
                key={`${qualification.ID}-${index}`}
                className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words group-hover:text-primary transition-colors duration-200">
                          {qualification.Name}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingQual(qualification)}
                            className="text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (canDeleteQualification(qualification) && qualification.ID) {
                                setShowDeleteConfirm(qualification.ID);
                              }
                            }}
                            disabled={!canDeleteQualification(qualification)}
                            title={canDeleteQualification(qualification) ? "Qualifikation löschen" : getDeletionReason(qualification)}
                            className={`transition-colors duration-200 ${
                              canDeleteQualification(qualification)
                                ? "text-red-400 hover:text-red-500 dark:hover:text-red-300 cursor-pointer"
                                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                          {qualification.Herkunft === "Zusatz" && isQualificationAssigned(qualification.ID!) && (
                            <button
                              onClick={() => setShowAssignedEmployees(qualification.ID!)}
                              title="Zugewiesene Mitarbeiter anzeigen"
                              className="text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 break-words">
                        {qualification.Description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-4">
                        {/* Type Badge */}
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${assignmentInfo.style}`}
                        >
                          <assignmentInfo.icon className="h-4 w-4 mr-2" />
                          {assignmentInfo.label}
                        </div>

                        {/* Validity Period Badge */}
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          <Clock className="h-4 w-4 mr-2" />
                          {qualification.ValidityInMonth >= 999 ? 'Läuft nie ab' :
                           qualification.ValidityInMonth === 12 ? 'Jährlich' : 
                           qualification.ValidityInMonth === 24 ? 'Zweijährlich' :
                           qualification.ValidityInMonth === 36 ? 'Dreijährlich' :
                           `${qualification.ValidityInMonth} Monate`}
                        </div>

                        {/* Mandatory Badge */}
                        {qualification.IsMandatory && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Pflichtqualifikation
                          </div>
                        )}

                        {/* Job Title Badge */}
                        {qualification.Herkunft === "Job" && qualification.JobTitle && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                            <Briefcase className="h-4 w-4 mr-2" />
                            {qualification.JobTitle}
                          </div>
                        )}

                        {/* Additional Function Badges */}
                        {qualification.Herkunft === "Zusatz" && qualification.AdditionalSkillNames && qualification.AdditionalSkillNames.length > 0 && (
                          qualification.AdditionalSkillNames.map((skillName, index) => (
                            <div key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                              <Star className="h-4 w-4 mr-2" />
                              {skillName}
                            </div>
                          ))
                        )}

                        {/* Required Qualifications Badge */}
                        {qualification.RequiredQualifications && qualification.RequiredQualifications.length > 0 && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            <Link className="h-4 w-4 mr-2" />
                            {qualification.RequiredQualifications.length} Voraussetzung{qualification.RequiredQualifications.length !== 1 ? 'en' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {uniqueQualifications.length === 0 && (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {searchTerm ? "Keine Qualifikationen gefunden" : "Keine Qualifikationen vorhanden"}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? "Versuchen Sie es mit einem anderen Suchbegriff."
                  : "Beginnen Sie damit, eine neue Qualifikation zu erstellen."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <QualificationForm
          onSubmit={handleAddQualification}
          onCancel={() => setShowAddModal(false)}
          jobTitles={jobTitles?.map(jt => ({
            ID: jt.ID?.toString() || '',
            JobTitle: jt.JobTitle || '',
            description: jt.Description || null
          })) || []}
          additionalFunctions={additionalFunctions || []}
        />
      )}

      {editingQual && (
        <EditQualificationModal
          qualification={editingQual}
          onSubmit={handleEditQualification}
          onCancel={() => setEditingQual(null)}
          jobTitles={jobTitles?.map(jt => ({
            ID: jt.ID?.toString() || '',
            JobTitle: jt.JobTitle || '',
            description: jt.Description || null
          })) || []}
          additionalFunctions={additionalFunctions || []}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Qualifikation löschen
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sind Sie sicher, dass Sie diese Qualifikation löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDeleteQualification(showDeleteConfirm)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Employees Modal */}
      {showAssignedEmployees && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Zugewiesene Mitarbeiter
              </h3>
              <button
                onClick={() => setShowAssignedEmployees(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {(() => {
              const qualification = qualifications?.find(q => q.ID === showAssignedEmployees);
              const assignedEmployees = getAssignedEmployees(showAssignedEmployees);
              
              return (
                <div>
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      {qualification?.Name}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Diese Zusatzqualifikation ist {assignedEmployees.length} Mitarbeiter{assignedEmployees.length !== 1 ? 'n' : ''} zugewiesen und kann daher nicht gelöscht werden.
                    </p>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto">
                    {assignedEmployees.length > 0 ? (
                      <div className="space-y-3">
                        {assignedEmployees.map((emp: any) => (
                          <div
                            key={emp.ID}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                            onClick={() => setSelectedEmployee(emp)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {emp.FullName || `${emp.FirstName} ${emp.LastName}`}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {emp.StaffNumber || emp.ID} • {emp.Department || 'Keine Abteilung'}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {emp.JobTitle || 'Keine Position'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Keine Mitarbeiter zugewiesen
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowAssignedEmployees(null)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={(data) => {
            // Update employee data if needed
            // Invalidate queries to refresh the assigned employees list
            if (showAssignedEmployees) {
              // Invalidate and refetch relevant queries
              queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
              queryClient.invalidateQueries({ queryKey: ['employeeSkills'] });
              queryClient.invalidateQueries({ queryKey: ['employees'] });
              queryClient.invalidateQueries({ queryKey: ['qualifications'] });
            }
          }}
          approvals={[]}
          trainings={[]}
          handleApproveTraining={() => {}}
          handleRejectTraining={() => {}}
        />
      )}
    </div>
  );
}

interface QualificationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Qualification | null;
  jobTitles: Array<{ ID: string; JobTitle: string; description: string | null }>;
  additionalFunctions: Array<{ ID?: number; Name: string; Description: string }>;
}

function QualificationForm({
  onSubmit,
  onCancel,
  initialData,
  jobTitles,
  additionalFunctions,
}: QualificationFormProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    Name: initialData?.Name || "",
    Description: initialData?.Description || "",
    ValidityInMonth: initialData?.ValidityInMonth || 12,
    RequiredQualifications: initialData?.RequiredQualifications || [],
    IsMandatory: initialData?.IsMandatory || false,
    AssignmentType:
      initialData?.Herkunft === "Pflicht"
        ? "Pflicht"
        : initialData?.Herkunft === "Job"
          ? "Job" : "Zusatz",
    JobTitleID: initialData?.JobTitleID ? initialData.JobTitleID[0] : "",
    AdditionalFunctionIDs: initialData?.AdditionalSkillID ? [initialData.AdditionalSkillID.toString()] : [],
  });

  // Separate state for input value to handle the number input properly
  const [inputValue, setInputValue] = useState(
    initialData?.ValidityInMonth === 999 ? "" : (initialData?.ValidityInMonth || 12).toString()
  );

  // Pre-select values when editing
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        JobTitleID: initialData.JobTitleID ? initialData.JobTitleID[0] : "",
        AdditionalFunctionID: initialData.AdditionalSkillID?.toString() || "",
        AssignmentType:
          initialData.Herkunft === "Pflicht"
            ? "Pflicht"
            : initialData.Herkunft === "Job"
              ? "Job"
              : "Zusatz",
      }));
      setInputValue(initialData.ValidityInMonth === 999 ? "" : initialData.ValidityInMonth.toString());
    }
  }, [initialData]);

  // Handle checkbox change
  const handleNeverExpiresChange = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, ValidityInMonth: 999 }));
      setInputValue("");
    } else {
      const newValue = parseInt(inputValue) || 12;
      setFormData(prev => ({ ...prev, ValidityInMonth: newValue }));
      setInputValue(newValue.toString());
    }
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setFormData(prev => ({ ...prev, ValidityInMonth: numValue }));
    }
  };

  const isStepComplete = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.Name.trim()) newErrors.name = "Name ist erforderlich";
        if (!formData.Description.trim())
          newErrors.description = "Beschreibung ist erforderlich";
        break;

      case 2:
        if (formData.ValidityInMonth === 999) {
          // "Läuft nie ab" ist gültig
          break;
        }
        if (!inputValue.trim()) {
          newErrors.validityPeriod = "Gültigkeitsdauer ist erforderlich";
        } else if (formData.ValidityInMonth <= 0) {
          newErrors.validityPeriod = "Gültigkeitsdauer muss größer als 0 sein";
        }
        break;

      case 3:
        switch (formData.AssignmentType) {
          case "Job":
            if (!formData.JobTitleID) {
              newErrors.jobTitles = "Eine Position muss ausgewählt werden";
            }
            break;
          case "Zusatz":
            if (formData.AdditionalFunctionIDs.length === 0) {
              newErrors.additionalFunction =
                "Mindestens eine Zusatzfunktion muss ausgewählt werden";
            }
            break;
          case "Pflicht":
            break;
        }
        break;
    }

    return Object.keys(newErrors).length === 0;
  };

  const canProceed = isStepComplete(activeStep);

  // Check if all required fields are filled for final submission
  const canSubmit = () => {
    // Check basic required fields
    if (!formData.Name.trim()) return false;
    if (!formData.Description.trim()) return false;
    
    // Check validity period
    if (formData.ValidityInMonth === 999) {
      // "Läuft nie ab" is valid
    } else if (!inputValue.trim() || formData.ValidityInMonth <= 0) {
      return false;
    }
    
    // Check assignment type requirements
    switch (formData.AssignmentType) {
      case "Job":
        if (!formData.JobTitleID) return false;
        break;
      case "Zusatz":
        if (formData.AdditionalFunctionIDs.length === 0) return false;
        break;
      case "Pflicht":
        break;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep === 3) {
      // Final validation before submission
      if (!canSubmit()) {
        toast.error("Bitte füllen Sie alle erforderlichen Felder aus");
        return;
      }
      
      const submitData = {
        ...formData,
        // Set IsMandatory based on AssignmentType
        IsMandatory: formData.AssignmentType === "Pflicht",
        // Convert single IDs to arrays for API compatibility
        JobTitleIDs:
          formData.AssignmentType === "Job" && formData.JobTitleID
            ? [formData.JobTitleID]
            : [],
        AdditionalFunctionIDs:
          formData.AssignmentType === "Zusatz"
            ? formData.AdditionalFunctionIDs
            : [],
        // Set Herkunft based on AssignmentType
        Herkunft: formData.AssignmentType as 'Pflicht' | 'Job' | 'Zusatz'
      };
      onSubmit(submitData);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name der Qualifikation *
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.Name}
                onChange={(e) =>
                  setFormData({ ...formData, Name: e.target.value })
                }
                placeholder="z.B. IT-Sicherheitszertifizierung"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Beschreibung *
              </label>
              <textarea
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.Description}
                onChange={(e) =>
                  setFormData({ ...formData, Description: e.target.value })
                }
                placeholder="Detaillierte Beschreibung der Qualifikation und ihrer Anforderungen..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="validity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gültigkeitsdauer
              </label>
              <div className="mt-2 flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    id="validity"
                    min="1"
                    disabled={formData.ValidityInMonth === 999}
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#1a1a1a] dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                    placeholder="z.B. 12"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ValidityInMonth === 999}
                      onChange={(e) => handleNeverExpiresChange(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Läuft nie ab
                    </span>
                  </label>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {formData.ValidityInMonth === 999 
                  ? "Diese Qualifikation läuft nie ab und muss nicht erneuert werden."
                  : `Die Qualifikation muss nach ${formData.ValidityInMonth} Monaten erneuert werden.`
                }
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Empfohlene Gültigkeitsdauer
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  • Sicherheitsschulungen: 12 Monate
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  • Technische Zertifizierungen: 24 Monate
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  • Grundlegende Qualifikationen: 36 Monate
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  • Dauerhafte Qualifikationen: Läuft nie ab
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Qualifikationszuweisung
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      AssignmentType: "Job",
                      AdditionalFunctionIDs: [], // Clear other selection
                    })
                  }
                  className={`p-4 rounded-lg border ${
                    formData.AssignmentType === "Job"
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700"
                  } text-left`}
                >
                  <Briefcase
                    className={`h-6 w-6 mb-2 ${
                      formData.AssignmentType === "Job"
                        ? "text-primary"
                        : "text-gray-400"
                    }`}
                  />
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    Position
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    An eine Position binden
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      AssignmentType: "Zusatz",
                      JobTitleID: "", // Clear other selection
                    })
                  }
                  className={`p-4 rounded-lg border ${
                    formData.AssignmentType === "Zusatz"
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700"
                  } text-left`}
                >
                  <Star
                    className={`h-6 w-6 mb-2 ${
                      formData.AssignmentType === "Zusatz"
                        ? "text-primary"
                        : "text-gray-400"
                    }`}
                  />
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    Zusatzfunktion
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Als zusätzliche Qualifikation definieren
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      AssignmentType: "Pflicht",
                      JobTitleID: "", // Clear other selections
                      AdditionalFunctionIDs: [],
                    })
                  }
                  className={`p-4 rounded-lg border ${
                    formData.AssignmentType === "Pflicht"
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700"
                  } text-left`}
                >
                  <AlertCircle
                    className={`h-6 w-6 mb-2 ${
                      formData.AssignmentType === "Pflicht"
                        ? "text-primary"
                        : "text-gray-400"
                    }`}
                  />
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    Pflichtqualifikation
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Für alle Mitarbeiter verpflichtend
                  </p>
                </button>
              </div>
            </div>

            {formData.AssignmentType === "Job" && jobTitles && (
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Position auswählen
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jobTitles.map((jobTitle) => (
                    <label
                      key={jobTitle.ID}
                      className={`p-4 rounded-lg border ${
                        formData.JobTitleID === jobTitle.ID
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-gray-200 dark:border-gray-700"
                      } flex items-start space-x-3 cursor-pointer`}
                    >
                      <input
                        type="radio"
                        name="Job"
                        value={jobTitle.ID}
                        checked={formData.JobTitleID === jobTitle.ID}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            JobTitleID: e.target.value,
                          })
                        }
                        className="mt-1 rounded-full border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {jobTitle.JobTitle}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.AssignmentType === "Zusatz" &&
              additionalFunctions && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                    {additionalFunctions.map(
                      (func) =>
                        func.ID && (
                          <label
                            key={func.ID}
                            className={`p-4 rounded-lg border ${
                              formData.AdditionalFunctionIDs.includes(
                                func.ID?.toString() || ""
                              )
                                ? "border-primary bg-primary/5 dark:bg-primary/10"
                                : "border-gray-200 dark:border-gray-700"
                            } flex items-start space-x-3 cursor-pointer`}
                          >
                            <input
                              type="checkbox"
                              value={func.ID?.toString() || ""}
                              checked={
                                formData.AdditionalFunctionIDs.includes(
                                  func.ID?.toString() || ""
                                )
                              }
                              onChange={(e) => {
                                const funcId = func.ID?.toString();
                                if (funcId) {
                                  setFormData({
                                    ...formData,
                                    AdditionalFunctionIDs: e.target.checked
                                      ? [...formData.AdditionalFunctionIDs, funcId]
                                      : formData.AdditionalFunctionIDs.filter(id => id !== funcId),
                                  });
                                }
                              }}
                              className="rounded-full border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {func.Name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {func.Description}
                              </p>
                            </div>
                          </label>
                        ),
                    )}
                  </div>
                </div>
              )}

            {formData.AssignmentType === "Pflicht" && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Pflichtqualifikation
                    </h5>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Diese Qualifikation wird für alle Mitarbeiter
                      verpflichtend sein. Stellen Sie sicher, dass dies wirklich
                      erforderlich ist.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData
              ? "Qualifikation bearbeiten"
              : "Neue Qualifikation erstellen"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div
          className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-neutral-700
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
        "
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Progress Steps */}
            <div className="relative">
              <div className="absolute top-4 w-full h-0.5 bg-gray-200 dark:bg-gray-700" />
              <div className="relative flex justify-between">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      if (isStepComplete(step - 1)) {
                        setActiveStep(step);
                      }
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center relative bg-white dark:bg-[#121212] border-2 transitioncolors ${
                      activeStep >= step
                        ? "border-primary text-primary"
                        : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <span className="text-sm font-medium">{step}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Grundinfo
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Gültigkeit
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Zuweisung
                </span>
              </div>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() =>
                  activeStep > 1 ? setActiveStep(activeStep - 1) : onCancel()
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {activeStep > 1 ? "Zurück" : "Abbrechen"}
              </button>

              <button
                type="submit"
                disabled={!canProceed}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeStep < 3
                  ? "Weiter"
                  : initialData
                    ? "Aktualisieren"
                    : "Erstellen"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Neues EditQualificationModal für das Bearbeiten
function EditQualificationModal({
  qualification,
  onSubmit,
  onCancel,
  jobTitles,
  additionalFunctions,
}: {
  qualification: Qualification;
  onSubmit: (data: Qualification) => void;
  onCancel: () => void;
  jobTitles: Array<{ ID: string; JobTitle: string; description: string | null }>;
  additionalFunctions: Array<{ ID?: number; Name: string; Description: string }>;
}) {
  const [formData, setFormData] = useState(() => {
    // Finde die IDs basierend auf den Namen, falls AdditionalSkillIDs nicht verfügbar sind
    let additionalSkillIDs: string[] = [];
    
    if (qualification.AdditionalSkillIDs && qualification.AdditionalSkillIDs.length > 0) {
      // Verwende die IDs direkt, falls verfügbar
      additionalSkillIDs = qualification.AdditionalSkillIDs.map(id => id.toString());
    } else if (qualification.AdditionalSkillNames && qualification.AdditionalSkillNames.length > 0 && additionalFunctions.length > 0) {
      // Finde die IDs basierend auf den Namen
      additionalSkillIDs = additionalFunctions
        .filter(func => func.ID && qualification.AdditionalSkillNames?.includes(func.Name))
        .map(func => func.ID!.toString());
    }
    
    return {
      ID: qualification.ID,
      Name: qualification.Name,
      Description: qualification.Description,
      ValidityInMonth: qualification.ValidityInMonth,
      // Behalte die ursprünglichen Werte für AssignmentType und andere Felder
      AssignmentType: qualification.Herkunft,
      IsMandatory: qualification.IsMandatory,
      JobTitleID: qualification.JobTitleID ? qualification.JobTitleID[0] : "",
      AdditionalSkillIDs: additionalSkillIDs
    };
  });

  // Separate state for input value to handle the number input properly
  const [inputValue, setInputValue] = useState(
    qualification.ValidityInMonth === 999 ? "" : qualification.ValidityInMonth.toString()
  );

  // Handle checkbox change
  const handleNeverExpiresChange = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, ValidityInMonth: 999 }));
      setInputValue("");
    } else {
      const newValue = parseInt(inputValue) || 12;
      setFormData(prev => ({ ...prev, ValidityInMonth: newValue }));
      setInputValue(newValue.toString());
    }
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setFormData(prev => ({ ...prev, ValidityInMonth: numValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation before submission
    if (!formData.Name.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    
    if (!formData.Description.trim()) {
      toast.error("Beschreibung ist erforderlich");
      return;
    }
    
    // Check validity period
    if (formData.ValidityInMonth === 999) {
      // "Läuft nie ab" is valid
    } else if (!inputValue.trim() || formData.ValidityInMonth <= 0) {
      toast.error("Gültigkeitsdauer ist erforderlich und muss größer als 0 sein");
      return;
    }
    
    // Validate job title for job qualifications
    if (qualification.Herkunft === "Job" && !formData.JobTitleID) {
      toast.error("Eine Position muss ausgewählt werden");
      return;
    }
    
    // Validate additional function for additional qualifications
    if (qualification.Herkunft === "Zusatz" && formData.AdditionalSkillIDs.length === 0) {
      toast.error("Mindestens eine Zusatzfunktion muss ausgewählt werden");
      return;
    }
    
    // Entferne doppelte IDs aus AdditionalFunctionIDs
    const uniqueAdditionalFunctionIDs = qualification.Herkunft === "Zusatz" 
      ? [...new Set(formData.AdditionalSkillIDs)]
      : [];
    
    const updatedQualification = {
      ...qualification, // Behalte alle ursprünglichen Werte
      ...formData, // Überschreibe nur die bearbeiteten Felder
      Herkunft: qualification.Herkunft, // Behalte den ursprünglichen AssignmentType
      // Convert single IDs to arrays for API compatibility
      JobTitleID: qualification.Herkunft === "Job" && formData.JobTitleID ? formData.JobTitleID : undefined,
      AdditionalFunctionIDs: uniqueAdditionalFunctionIDs
    };
    
    onSubmit(updatedQualification);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Qualifikation bearbeiten
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.Name}
              onChange={(e) => setFormData(prev => ({ ...prev, Name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#1a1a1a] dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Beschreibung
            </label>
            <textarea
              id="description"
              value={formData.Description}
              onChange={(e) => setFormData(prev => ({ ...prev, Description: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#1a1a1a] dark:text-white"
            />
          </div>

          {/* Validity Period */}
          <div>
            <label htmlFor="validity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Gültigkeitsdauer
            </label>
            <div className="mt-2 flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  id="validity"
                  min="1"
                  disabled={formData.ValidityInMonth === 999}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#1a1a1a] dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="z.B. 12"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ValidityInMonth === 999}
                    onChange={(e) => handleNeverExpiresChange(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Läuft nie ab
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {formData.ValidityInMonth === 999 
                ? "Diese Qualifikation läuft nie ab und muss nicht erneuert werden."
                : `Die Qualifikation muss nach ${formData.ValidityInMonth} Monaten erneuert werden.`
              }
            </div>
          </div>

          {/* Job Title Selection for Job Qualifications */}
          {qualification.Herkunft === "Job" && (
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Position
              </label>
              <select
                id="jobTitle"
                value={formData.JobTitleID}
                onChange={(e) => setFormData(prev => ({ ...prev, JobTitleID: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#1a1a1a] dark:text-white"
                required
              >
                <option value="">Position auswählen</option>
                {jobTitles.map((jobTitle) => (
                  <option key={jobTitle.ID} value={jobTitle.ID}>
                    {jobTitle.JobTitle}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Additional Function Selection for Additional Qualifications */}
          {qualification.Herkunft === "Zusatz" && (
            <div>
              <label htmlFor="additionalFunction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Zusatzfunktion
              </label>
              <div className="space-y-2">
                {additionalFunctions.map((func) => (
                  <label
                    key={func.ID}
                    className={`p-3 rounded-lg border ${
                      formData.AdditionalSkillIDs.includes(func.ID?.toString() || "")
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-gray-200 dark:border-gray-700"
                    } flex items-start space-x-3 cursor-pointer`}
                  >
                    <input
                      type="checkbox"
                      value={func.ID?.toString() || ""}
                      checked={formData.AdditionalSkillIDs.includes(func.ID?.toString() || "")}
                      onChange={(e) => {
                        const funcId = func.ID?.toString();
                        if (funcId) {
                          setFormData(prev => ({
                            ...prev,
                            AdditionalSkillIDs: e.target.checked
                              ? [...prev.AdditionalSkillIDs, funcId]
                              : prev.AdditionalSkillIDs.filter(id => id !== funcId),
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {func.Name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {func.Description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Qualification Type Info */}
          <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {qualification.Herkunft === "Job" && <Briefcase className="h-5 w-5 text-blue-500 mr-2" />}
              {qualification.Herkunft === "Zusatz" && <Star className="h-5 w-5 text-purple-500 mr-2" />}
              {qualification.Herkunft === "Pflicht" && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {qualification.Herkunft === "Job" && "Positionsqualifikation"}
                  {qualification.Herkunft === "Zusatz" && "Zusatzqualifikation"}
                  {qualification.Herkunft === "Pflicht" && "Pflichtqualifikation"}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {qualification.Herkunft === "Job" && "Diese Qualifikation ist an eine Position gebunden"}
                  {qualification.Herkunft === "Zusatz" && "Diese Qualifikation ist eine zusätzliche Funktion"}
                  {qualification.Herkunft === "Pflicht" && "Diese Qualifikation ist für alle Mitarbeiter verpflichtend"}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={
                !formData.Name.trim() || 
                !formData.Description.trim() || 
                (formData.ValidityInMonth !== 999 && (!inputValue.trim() || formData.ValidityInMonth <= 0)) ||
                (qualification.Herkunft === "Job" && !formData.JobTitleID) ||
                (qualification.Herkunft === "Zusatz" && formData.AdditionalSkillIDs.length === 0)
              }
                              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}