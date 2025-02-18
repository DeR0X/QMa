import { useState } from 'react';
import { X, Plus, Award, Edit2, Building2, Globe, Search, AlertCircle, BookOpen, Timer, Users, Calendar, MapPin, Info } from 'lucide-react';
import { itDepartments, manufacturingDepartments } from '../../data/departments';
import { qualifications } from '../../data/mockData';
import type { Training } from '../../types';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onAdd: (training: Omit<Training, 'id'>) => void;
  userDepartment?: string;
}

const allDepartments = [...itDepartments, ...manufacturingDepartments];

interface Session {
  id: string;
  date: string;
  location: string;
  availableSpots: number;
  trainer?: string;
}

export default function AddTrainingModal({ onClose, onAdd, userDepartment }: Props) {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    validityPeriod: 12,
    isMandatory: false,
    trainer: '',
    maxParticipants: 10,
    targetPositions: [] as string[],
    isForEntireDepartment: false,
    sessions: [{ // Initialize with one session
      id: Date.now().toString(),
      date: '',
      location: '',
      availableSpots: 10,
      trainer: ''
    }] as Session[],
    qualificationIds: [] as string[],
    department: userDepartment || '',
  });

  const [selectedDepartment, setSelectedDepartment] = useState(userDepartment || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availablePositions = allDepartments.find(d => d.name === selectedDepartment)?.positions || [];

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setFormData(prev => ({
      ...prev,
      department: dept,
      targetPositions: [],
      isForEntireDepartment: false,
    }));
  };

  const isStepComplete = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Basic Information
        if (!formData.title.trim()) {
          newErrors.title = 'Titel ist erforderlich';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Beschreibung ist erforderlich';
        }
        if (!formData.duration.trim()) {
          newErrors.duration = 'Dauer ist erforderlich';
        }
        break;

      case 2: // Target Group
        if (!formData.department) {
          newErrors.department = 'Abteilung ist erforderlich';
        }
        if (!formData.isForEntireDepartment && formData.targetPositions.length === 0) {
          newErrors.targetPositions = 'Mindestens eine Position muss ausgewählt werden';
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

      case 4: // Qualifications
        // Optional step, no validation required
        break;

      case 5: // Summary
        // No additional validation needed for summary
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepComplete(activeStep)) {
      return;
    }

    if (activeStep <= 4) {
      setActiveStep(activeStep + 1);
      return;
    }

    const newTraining: Omit<Training, "id"> = {
      title: formData.title,
      description: formData.description,
      duration: formData.duration,
      isMandatory: formData.isMandatory,
      isForEntireDepartment: formData.isForEntireDepartment,
      qualificationIds: formData.qualificationIds,
      qualificationID: formData.qualificationIds[0] || '',
      qualification_TrainerID: formData.trainer,
      department: formData.department,
      trainingDate: formData.sessions[0].date,
      completed: false,
    };

    onAdd(newTraining);
    onClose();
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

  const filteredQualifications = qualifications.filter(qual => {
    const matchesSearch = searchTerm === '' || 
      qual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qual.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Neue Schulung erstellen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Steps */}
          <div className="relative">
            <div className="absolute top-4 w-full h-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="relative flex justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => isStepComplete(step - 1) && setActiveStep(step)}
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
              <span className="text-xs text-gray-500 dark:text-gray-400">Zielgruppe</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Termine</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Qualifikationen</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Übersicht</span>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {activeStep === 1 && (
            <div className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dauer *
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="z.B. 2 Stunden"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration}</p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Pflichtschulung
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Target Group */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Abteilung *
                </label>
                <select
                  required
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={!!userDepartment}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                >
                  <option value="">Abteilung auswählen</option>
                  {allDepartments.map((dept) => (
                    <option key={dept.name} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
                )}
              </div>

              {selectedDepartment && (
                <>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isForEntireDepartment}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          isForEntireDepartment: e.target.checked,
                          targetPositions: [],
                        }))}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Für die gesamte Abteilung verfügbar
                      </span>
                    </label>
                  </div>

                  {!formData.isForEntireDepartment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Positionen *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availablePositions.map((position) => (
                          <div
                            key={position}
                            className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                              formData.targetPositions.includes(position)
                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                            onClick={() => {
                              const newPositions = formData.targetPositions.includes(position)
                                ? formData.targetPositions.filter(p => p !== position)
                                : [...formData.targetPositions, position];
                              setFormData({ ...formData, targetPositions: newPositions });
                            }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                checked={formData.targetPositions.includes(position)}
                                onChange={() => {}} // Handled by parent div click
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                                {position}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {errors.targetPositions && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.targetPositions}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Trainer
                        </label>
                        <input
                          type="text"
                          value={session.trainer || formData.trainer}
                          onChange={(e) => updateSession(session.id, { trainer: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                          placeholder="Name des Trainers"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Qualifications */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Qualifikationen
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredQualifications.map((qual) => (
                  <div
                    key={qual.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      formData.qualificationIds.includes(qual.id)
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.qualificationIds.includes(qual.id)}
                        onChange={() => {
                          const newQualIds = formData.qualificationIds.includes(qual.id)
                            ? formData.qualificationIds.filter(id => id !== qual.id)
                            : [...formData.qualificationIds, qual.id];
                          setFormData({ ...formData, qualificationIds: newQualIds });
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
            </div>
          )}

          {/* Step 5: Summary */}
          {activeStep === 5 && (
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
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Timer className="h-4 w-4 mr-2" />
                      Dauer: {formData.duration}
                    </div>
                  </div>
                </div>

                {/* Target Group Card */}
                <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <Users className="h-5 w-5 text-gray-400 mr-2" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Zielgruppe
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Building2 className="h-4 w-4 mr-2" />
                      Abteilung: {formData.department}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formData.isForEntireDepartment 
                          ? 'Verfügbar für die gesamte Abteilung'
                          : 'Ausgewählte Positionen:'
                        }
                      </p>
                      {!formData.isForEntireDepartment && formData.targetPositions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.targetPositions.map(position => (
                            <span
                              key={position}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            >
                              {position}
                            </span>
                          ))}
                        </div>
                      )}
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
                          {session.trainer && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              {session.trainer}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#181818] rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <Users className="h-5 w-5 text-gray-400 mr-2" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Qualifikationen ({formData.qualificationIds.length})
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {formData.qualificationIds.map(qualId => {
                      const qual = qualifications.find(q => q.id === qualId);
                      return qual ? (
                        <p key={qualId} className="text-sm text-gray-900 dark:text-white">
                          • {qual.name}
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

         {/* Navigation Buttons */}
         <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => activeStep > 1 ? setActiveStep(activeStep - 1) : onClose()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {activeStep > 1 ? "Zurück" : "Abbrechen"}
            </button>

            {activeStep < 5 && (
              <button
                type="button"
                onClick={() => isStepComplete(activeStep) && setActiveStep(activeStep + 1)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
              >
                Weiter
              </button>
            )}

            {activeStep === 5 && (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
              >
                Schulung erstellen
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}