import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, Award, X, Edit2, Clock, AlertCircle, Info, Building2, Briefcase, Star, Users } from 'lucide-react';
import { RootState } from '../store';
import { qualifications, jobTitles } from '../data/mockData';
import { hasHRPermissions } from '../store/slices/authSlice';
import { toast } from 'sonner';
import type { Qualification } from '../types';
import { itDepartments, manufacturingDepartments } from '../data/departments';

const allDepartments = [...itDepartments, ...manufacturingDepartments];

export default function Qualifications() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQual, setEditingQual] = useState<Qualification | null>(null);
  const [localQualifications, setLocalQualifications] = useState(qualifications);

  const isHRAdmin = hasHRPermissions(employee);
  const isSupervisor = employee?.role === 'supervisor';

  // Nur für Supervisoren oder HR freigeben
  if (!isHRAdmin && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-4">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);

  const handleAddQualification = (qualification: Omit<Qualification, 'id'>) => {
    const newQual = {
      ...qualification,
      id: Date.now().toString(),
    };
    setLocalQualifications([...localQualifications, newQual]);
    toast.success('Qualifikation erfolgreich erstellt');
    setShowAddModal(false);
  };

  const handleEditQualification = (qualification: Qualification) => {
    setLocalQualifications(prev =>
      prev.map(q => (q.id === qualification.id ? qualification : q))
    );
    toast.success('Qualifikation erfolgreich aktualisiert');
    setEditingQual(null);
  };

  const filteredQualifications = localQualifications.filter(qual =>
    qual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qual.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Suchbereich */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Qualifikationen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Liste der Qualifikationen */}
        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
          {filteredQualifications.map((qualification) => (
            <div
              key={qualification.id}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 group"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words group-hover:text-primary transition-colors duration-200">
                        {qualification.name}
                      </h3>
                      <button
                        onClick={() => setEditingQual(qualification)}
                        className="ml-4 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 break-words">
                      {qualification.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gültigkeitsdauer */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span>Gültigkeitsdauer: {qualification.validityInMonth} Monate</span>
                  </div>

                  {/* Pflichtqualifikation Status */}
                  <div className="flex items-center">
                    {qualification.isMandatory && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Pflichtqualifikation
                      </span>
                    )}
                  </div>

                  {/* Trainer */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    <span>Trainer: {qualification.requiredQualifications.length}</span>
                  </div>
                </div>

                {/* Erforderliche Schulungen */}
                {qualification.requiredQualifications.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center mb-2">
                      <Info className="h-4 w-4 mr-2 text-primary" />
                      Erforderliche Schulungen:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {qualification.requiredQualifications.map((trainingId) => (
                        <span
                          key={trainingId}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          Training #{trainingId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zielgruppe */}
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center mb-2">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    Zielgruppe:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {jobTitles
                      .filter(job => job.qualificationIDs.includes(qualification.id))
                      .map(job => (
                        <span
                          key={job.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        >
                          {job.jobTitle}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredQualifications.length === 0 && (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Keine Qualifikationen gefunden</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Beginnen Sie damit, eine neue Qualifikation zu erstellen.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal für Hinzufügen / Bearbeiten */}
      {(showAddModal || editingQual) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingQual ? 'Qualifikation bearbeiten' : 'Neue Qualifikation erstellen'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingQual(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-gray-100
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
            ">
              <QualificationForm
                onSubmit={editingQual ? handleEditQualification : handleAddQualification}
                initialData={editingQual}
                onCancel={() => {
                  setShowAddModal(false);
                  setEditingQual(null);
                }}
              />
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
}

function QualificationForm({ onSubmit, onCancel, initialData }: QualificationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    validityPeriod: initialData?.validityInMonth || 12,
    requiredQualifications: initialData?.requiredQualifications || [],
    isMandatory: initialData?.isMandatory || false,
    assignmentType: 'jobTitle',
    selectedJobTitles: [] as string[],
    selectedDepartment: '',
    selectedAdditionalSkills: [] as string[]
  });

  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);

  const [selectedQualifications, setSelectedQualifications] = useState<string[]>(
    initialData?.requiredQualifications || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);

  const filteredQualifications = qualifications.filter(qual => {
    if (initialData && qual.id === initialData.id) return false;
    if (selectedQualifications.includes(qual.id)) return false;
    
    return qual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           qual.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isStepComplete(activeStep)) {
      return;
    }

    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
      return;
    }

    const qualificationData = {
      ...formData,
      validityInMonth: formData.validityPeriod,
      requiredQualifications: selectedQualifications,
      isMandatory: formData.assignmentType === 'mandatory',
    };

    onSubmit(qualificationData);
  };

  const isStepComplete = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name ist erforderlich';
        if (!formData.description.trim()) newErrors.description = 'Beschreibung ist erforderlich';
        break;

      case 2:
        if (formData.validityPeriod <= 0) {
          newErrors.validityPeriod = 'Gültigkeitsdauer muss größer als 0 sein';
        }
        break;

      case 3:
        switch (formData.assignmentType) {
          case 'jobTitle':
            if (formData.selectedJobTitles.length === 0) {
              newErrors.jobTitles = 'Mindestens eine Position muss ausgewählt werden';
            }
            break;
          case 'additionalFunction':
            if (!formData.selectedAdditionalSkills) {
              newErrors.additionalFunction = 'Es muss eine Zusatzfunktion ausgewählt werden';
            }
            break;
          case 'mandatory':
            // No additional validation needed for mandatory qualifications
            break;
        }
        break;
    }

    return Object.keys(newErrors).length === 0;
  };
  
  const canProceed = isStepComplete(activeStep);

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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  value={formData.validityPeriod}
                  onChange={(e) =>
                    setFormData({ ...formData, validityPeriod: parseInt(e.target.value) })
                  }
                />
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Die Qualifikation muss nach {formData.validityPeriod} Monaten erneuert werden.
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
                  onClick={() => setFormData({ ...formData, assignmentType: 'jobTitle' })}
                  className={`p-4 rounded-lg border ${
                    formData.assignmentType === 'jobTitle'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700'
                  } text-left`}
                >
                  <Briefcase className={`h-6 w-6 mb-2 ${
                    formData.assignmentType === 'jobTitle' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h5 className="font-medium text-gray-900 dark:text-white">Jobtitel</h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    An bestimmte Positionen binden
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, assignmentType: 'additionalFunction' })}
                  className={`p-4 rounded-lg border ${
                    formData.assignmentType === 'additionalFunction'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700'
                  } text-left`}
                >
                  <Star className={`h-6 w-6 mb-2 ${
                    formData.assignmentType === 'additionalFunction' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h5 className="font-medium text-gray-900 dark:text-white">Zusatzfunktion</h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Als zusätzliche Qualifikation definieren
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, assignmentType: 'mandatory' })}
                  className={`p-4 rounded-lg border ${
                    formData.assignmentType === 'mandatory'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700'
                  } text-left`}
                >
                  <AlertCircle className={`h-6 w-6 mb-2 ${
                    formData.assignmentType === 'mandatory' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h5 className="font-medium text-gray-900 dark:text-white">Pflichtqualifikation</h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Für alle Mitarbeiter verpflichtend
                  </p>
                </button>
              </div>
            </div>

            {/* Assignment Type Specific Content */}
            {formData.assignmentType === 'jobTitle' && (
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Positionen auswählen
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jobTitles.map(jobTitle => (
                    <label
                      key={jobTitle.id}
                      className={`p-4 rounded-lg border ${
                        formData.selectedJobTitles.includes(jobTitle.id)
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700'
                      } flex items-start space-x-3 cursor-pointer`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedJobTitles.includes(jobTitle.id)}
                        onChange={(e) => {
                          const newSelected = e.target.checked
                            ? [...formData.selectedJobTitles, jobTitle.id]
                            : formData.selectedJobTitles.filter(id => id !== jobTitle.id);
                          setFormData({ ...formData, selectedJobTitles: newSelected });
                        }}
                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{jobTitle.jobTitle}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{jobTitle.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.assignmentType === 'additionalFunction' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Zusatzfunktion auswählen
                  </label>
                  {jobTitles.map(jobTitle => (
                    <label
                      key={jobTitle.id}
                      className={`p-4 rounded-lg border ${
                        formData.selectedJobTitles.includes(jobTitle.id)
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700'
                      } flex items-start space-x-3 cursor-pointer`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedJobTitle === jobTitle.id}
                        onChange={() => setSelectedJobTitle(jobTitle.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{jobTitle.jobTitle}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{jobTitle.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.assignmentType === 'mandatory' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Pflichtqualifikation
                    </h5>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Diese Qualifikation wird für alle Mitarbeiter verpflichtend sein. Stellen Sie sicher,
                      dass dies wirklich erforderlich ist.
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
          <span className="text-xs text-gray-500 dark:text-gray-400">Grundinfo</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Gültigkeit</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Zuweisung</span>
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => activeStep > 1 ? setActiveStep(activeStep - 1) : onCancel()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {activeStep > 1 ? 'Zurück' : 'Abbrechen'}
        </button>
        
        <button
          type="submit"
          disabled={!canProceed}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activeStep < 3 ? 'Weiter' : (initialData ? 'Aktualisieren' : 'Erstellen')}
        </button>
      </div>
    </form>
  );
}