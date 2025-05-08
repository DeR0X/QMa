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
import type { Qualification } from "../services/qualificationsApi";

export default function Qualifications() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQual, setEditingQual] = useState<Qualification | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );

  const { data: qualifications, isLoading, error } = useQualifications();
  const { data: jobTitles, isLoading: isLoadingJobTitles } = useJobTitles();
  const { data: additionalFunctions, isLoading: isLoadingAdditionalFunctions } =
    useAdditionalFunctions();

  const createMutation = useCreateQualification();
  const updateMutation = useUpdateQualification();
  const deleteMutation = useDeleteQualification();

  const isHRAdmin = hasHRPermissions(employee);
  const isSupervisor = employee?.role === "supervisor";

  if (!isHRAdmin && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-4">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
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

  const filteredQualifications =
    qualifications?.filter(
      (qual) =>
        qual.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qual.Description.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const getAssignmentInfo = (qualification: Qualification) => {
    switch (qualification.Herkunft) {
      case "Pflicht":
        return {
          type: "mandatory",
          label: "Pflichtqualifikation",
          description: "Erforderlich für alle Mitarbeiter",
          icon: AlertCircle,
          style: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
        };
      case "Job":
        return {
          type: "jobTitle",
          label: "Positionsqualifikation",
          description: "An eine Position gebunden",
          icon: Briefcase,
          style:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
        };
      case "Zusatz":
        return {
          type: "additionalFunction",
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
      await updateMutation.mutateAsync({
        id: qualification.ID,
        data: qualification,
      });
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700 transition-colors duration-200"
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
          </div>
        </div>

        {/* Qualifications List */}
        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
          {filteredQualifications.map((qualification) => {
            const assignmentInfo = getAssignmentInfo(qualification);

            return (
              <div
                key={qualification.ID}
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
                            onClick={() =>
                              qualification.ID &&
                              setShowDeleteConfirm(qualification.ID)
                            }
                            className="text-red-400 hover:text-red-500 dark:hover:text-red-300">
                            <Trash2 className="h-5 w-5" />
                          </button>
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

                        {/* Description Badge */}
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          <Info className="h-4 w-4 mr-2" />
                          {assignmentInfo.description}
                        </div>

                        {/* Validity Period Badge */}
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          <Clock className="h-4 w-4 mr-2" />
                          Gültig für {qualification.ValidityInMonth} Monate
                        </div>
                        {qualification.Herkunft === "Job" && qualification.JobTitle && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Position: {qualification.JobTitle}
                          </div>
                        )}
                        {qualification.Herkunft === "Zusatz" && qualification.AdditionalSkillName && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                            <Star className="h-4 w-4 mr-2" />
                            Zusatzfunktion: {qualification.AdditionalSkillName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredQualifications.length === 0 && (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Keine Qualifikationen gefunden
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Beginnen Sie damit, eine neue Qualifikation zu erstellen.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingQual) && (
        <QualificationForm
          onSubmit={
            editingQual ? handleEditQualification : handleAddQualification
          }
          initialData={editingQual}
          onCancel={() => {
            setShowAddModal(false);
            setEditingQual(null);
          }}
          jobTitles={jobTitles || []}
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
    </div>
  );
}

interface QualificationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Qualification | null;
  jobTitles: Array<{ id: string; obTitle: string; description: string | null }>;
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
        ? "mandatory"
        : initialData?.Herkunft === "Job"
          ? "jobTitle"
          : initialData?.Herkunft === "Zusatz"
            ? "additionalFunction"
            : "jobTitle",
    JobTitleID: initialData?.JobTitleID ? initialData.JobTitleID[0] : "",
    AdditionalFunctionID: initialData?.AdditionalSkillID?.toString() || "",
  });

  // Pre-select values when editing
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        JobTitleID: initialData.JobTitleID ? initialData.JobTitleID[0] : "",
        AdditionalFunctionID: initialData.AdditionalSkillID?.toString() || "",
        AssignmentType:
          initialData.Herkunft === "Pflicht"
            ? "mandatory"
            : initialData.Herkunft === "Job"
              ? "jobTitle"
              : "additionalFunction",
      }));
    }
  }, [initialData]);

  const isStepComplete = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.Name.trim()) newErrors.name = "Name ist erforderlich";
        if (!formData.Description.trim())
          newErrors.description = "Beschreibung ist erforderlich";
        break;

      case 2:
        if (formData.ValidityInMonth <= 0) {
          newErrors.validityPeriod = "Gültigkeitsdauer muss größer als 0 sein";
        }
        break;

      case 3:
        switch (formData.AssignmentType) {
          case "jobTitle":
            if (!formData.JobTitleID) {
              newErrors.jobTitles = "Eine Position muss ausgewählt werden";
            }
            break;
          case "additionalFunction":
            if (!formData.AdditionalFunctionID) {
              newErrors.additionalFunction =
                "Eine Zusatzfunktion muss ausgewählt werden";
            }
            break;
          case "mandatory":
            break;
        }
        break;
    }

    return Object.keys(newErrors).length === 0;
  };

  const canProceed = isStepComplete(activeStep);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep === 3) {
      const submitData = {
        ...formData,
        // Convert single IDs to arrays for API compatibility
        JobTitleIDs:
          formData.AssignmentType === "jobTitle" && formData.JobTitleID
            ? [formData.JobTitleID]
            : [],
        AdditionalFunctionIDs:
          formData.AssignmentType === "additionalFunction" &&
          formData.AdditionalFunctionID
            ? [formData.AdditionalFunctionID]
            : [],
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gültigkeitsdauer (Monate)
              </label>
              <div className="mt-2 relative">
                <input
                  type="number"
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                  value={formData.ValidityInMonth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ValidityInMonth: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Die Qualifikation muss nach {formData.ValidityInMonth} Monaten
                  erneuert werden.
                </div>
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
                      AssignmentType: "jobTitle",
                      AdditionalFunctionID: "", // Clear other selection
                    })
                  }
                  className={`p-4 rounded-lg border ${
                    formData.AssignmentType === "jobTitle"
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700"
                  } text-left`}
                >
                  <Briefcase
                    className={`h-6 w-6 mb-2 ${
                      formData.AssignmentType === "jobTitle"
                        ? "text-primary"
                        : "text-gray-400"
                    }`}
                  />
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    Jobtitel
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
                      AssignmentType: "additionalFunction",
                      JobTitleID: "", // Clear other selection
                    })
                  }
                  className={`p-4 rounded-lg border ${
                    formData.AssignmentType === "additionalFunction"
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700"
                  } text-left`}
                >
                  <Star
                    className={`h-6 w-6 mb-2 ${
                      formData.AssignmentType === "additionalFunction"
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
                      AssignmentType: "mandatory",
                      JobTitleID: "", // Clear other selections
                      AdditionalFunctionID: "",
                    })
                  }
                  className={`p-4 rounded-lg border ${
                    formData.AssignmentType === "mandatory"
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700"
                  } text-left`}
                >
                  <AlertCircle
                    className={`h-6 w-6 mb-2 ${
                      formData.AssignmentType === "mandatory"
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

            {formData.AssignmentType === "jobTitle" && jobTitles && (
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Position auswählen
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jobTitles.map((jobTitle) => (
                    <label
                      key={jobTitle.id}
                      className={`p-4 rounded-lg border ${
                        formData.JobTitleID === jobTitle.id
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-gray-200 dark:border-gray-700"
                      } flex items-start space-x-3 cursor-pointer`}
                    >
                      <input
                        type="radio"
                        name="jobTitle"
                        value={jobTitle.id}
                        checked={formData.JobTitleID === jobTitle.id}
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

            {formData.AssignmentType === "additionalFunction" &&
              additionalFunctions && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                    {additionalFunctions.map(
                      (func) =>
                        func.ID && (
                          <label
                            key={func.ID}
                            className={`p-4 rounded-lg border ${
                              formData.AdditionalFunctionID ===
                              func.ID.toString()
                                ? "border-primary bg-primary/5 dark:bg-primary/10"
                                : "border-gray-200 dark:border-gray-700"
                            } flex items-start space-x-3 cursor-pointer`}
                          >
                            <input
                              type="radio"
                              name="additionalFunction"
                              value={func.ID.toString()}
                              checked={
                                formData.AdditionalFunctionID ===
                                func.ID.toString()
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  AdditionalFunctionID: e.target.value,
                                })
                              }
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

            {formData.AssignmentType === "mandatory" && (
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
                className="px-4 py-2 border bordertransparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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