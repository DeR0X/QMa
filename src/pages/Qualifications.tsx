import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, Award, X, Edit2 } from 'lucide-react';
import { RootState } from '../store';
import { qualifications } from '../data/mockData';
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
      {/* Header – mobile: gestapelt, ab sm: in einer Zeile */}
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Neue Qualifikation
          </button>
          <Award className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Suchbereich */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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

        {/* Liste der Qualifikationen */}
        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
          {filteredQualifications.map((qualification) => (
            <div
              key={qualification.id}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words">
                    {qualification.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
                    {qualification.description}
                  </p>
                </div>
                <button
                  onClick={() => setEditingQual(qualification)}
                  className="self-start text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>

              {/* Detailbereich: mobile zunächst 1 Spalte, ab sm 2 Spalten */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <span className="font-medium">Gültigkeitsdauer:</span>{' '}
                  {qualification.validityInMonth} Monate
                </div>
                <div>
                  <span className="font-medium">Erforderliche Schulungen:</span>
                  <ul className="mt-1 list-disc list-inside">
                    {qualification.requiredQualifications.map((trainingId) => (
                      <li key={trainingId}>Training #{trainingId}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal für Hinzufügen / Bearbeiten */}
      {(showAddModal || editingQual) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingQual ? 'Qualifikation bearbeiten' : 'Neue Qualifikation erstellen'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingQual(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

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
    department: '',
    positions: [] as string[],
    isFreeQualification: false,
  });

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>(
    initialData?.requiredQualifications || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStep, setActiveStep] = useState(1);

    const filteredQualifications = qualifications.filter(qual => {
      // Filtere die aktuelle Qualifikation aus (falls im Bearbeitungsmodus)
      if (initialData && qual.id === initialData.id) return false;
      
      // Filtere bereits ausgewählte Qualifikationen aus den Voraussetzungen
      if (selectedQualifications.includes(qual.id)) return false;
      
      return qual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             qual.description.toLowerCase().includes(searchTerm.toLowerCase());
    });

 const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    for (let step = 1; step <= 4; step++) {
      if (!isStepComplete(step)) {
        return;
      }
    }

    const qualificationData = {
      ...formData,
      validityInMonth: formData.validityPeriod,
      requiredQualifications: selectedQualifications,
    };

    onSubmit(qualificationData);
  };

  const isStepComplete = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Name ist erforderlich';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Beschreibung ist erforderlich';
        }
        break;

      case 2:
        if (formData.validityPeriod <= 0) {
          newErrors.validityPeriod = 'Gültigkeitsdauer muss größer als 0 sein';
        }
        break;

      case 3:
        if (!formData.isFreeQualification && formData.department && formData.positions.length === 0) {
          newErrors.positions = 'Mindestens eine Position muss ausgewählt werden';
        }
        break;
    }

    return Object.keys(newErrors).length === 0;
  };
  
  const canProceed = isStepComplete(activeStep);

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
              if (isStepComplete(step)) {
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


      {/* Step 1: Basic Information */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name der Qualifikation
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
              Beschreibung
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
      )}

      {/* Step 2: Validity Period */}
      {activeStep === 2 && (
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
      )}

      {/* Step 3: Assignment */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Erforderliche Qualifikationen
            </h4>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Qualifikationen suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-[#181818] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredQualifications.map((qual) => (
                <div
                  key={qual.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedQualifications.includes(qual.id)
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedQualifications.includes(qual.id)}
                      onChange={() => {
                        const newSelected = selectedQualifications.includes(qual.id)
                          ? selectedQualifications.filter(id => id !== qual.id)
                          : [...selectedQualifications, qual.id];
                        setSelectedQualifications(newSelected);
                        setFormData({ ...formData, requiredQualifications: newSelected });
                      }}
                      className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {qual.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {qual.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Gültigkeitsdauer: {qual.validityInMonth} Monate
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {selectedQualifications.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Ausgewählte Qualifikationen:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedQualifications.map(qualId => {
                    const qual = qualifications.find(q => q.id === qualId);
                    return qual && (
                      <span
                        key={qualId}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {qual.name}
                        <button
                          type="button"
                          onClick={() => {
                            const newSelected = selectedQualifications.filter(id => id !== qualId);
                            setSelectedQualifications(newSelected);
                            setFormData({ ...formData, requiredQualifications: newSelected });
                          }}
                          className="ml-1 hover:text-primary/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => activeStep > 1 ? setActiveStep(activeStep - 1) : onCancel()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {activeStep > 1 ? 'Zurück' : 'Abbrechen'}
        </button>
        
        {activeStep < 3 ? (
          <button
            type="button"
            onClick={() => canProceed && setActiveStep(activeStep + 1)}
            disabled={!canProceed}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Weiter
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canProceed}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? 'Aktualisieren' : 'Erstellen'}
          </button>
        )}
      </div>
    </form>
  );
}
