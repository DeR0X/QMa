import { useState, useEffect } from 'react';
import { X, Plus, Award, Edit2, Globe, Search, AlertCircle, BookOpen, Timer, Users, Calendar, MapPin } from 'lucide-react';
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
  const [selectedDepartment, setSelectedDepartment] = useState(userDepartment || '');
  const [searchTerm, setSearchTerm] = useState('');
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

  const handlePositionChange = (position: string) => {
    setFormData(prev => ({
      ...prev,
      targetPositions: prev.targetPositions.includes(position)
        ? prev.targetPositions.filter(p => p !== position)
        : [...prev.targetPositions, position],
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'Dauer ist erforderlich';
    }

    if (!formData.department) {
      newErrors.department = 'Abteilung ist erforderlich';
    }

    if (!formData.isForEntireDepartment && formData.targetPositions.length === 0) {
      newErrors.targetPositions = 'Mindestens eine Position muss ausgewählt werden';
    }

    if (formData.sessions.length === 0) {
      newErrors.sessions = 'Mindestens ein Termin ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
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

  const handleQualificationToggle = (qualId: string) => {
    setFormData(prev => ({
      ...prev,
      qualificationIds: prev.qualificationIds.includes(qualId)
        ? prev.qualificationIds.filter(id => id !== qualId)
        : [...prev.qualificationIds, qualId],
    }));
  };

  // Add initial session on mount


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm
                  ${errors.title ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                  dark:bg-[#181818] dark:text-white`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dauer *
              </label>
              <input
                type="text"
                placeholder="z.B. 2 Stunden"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm
                  ${errors.duration ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                  dark:bg-[#181818] dark:text-white`}
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Beschreibung *
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm
                  ${errors.description ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                  dark:bg-[#181818] dark:text-white`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gültigkeitsdauer (Monate)
              </label>
              <input
                type="number"
                min="1"
                value={formData.validityPeriod}
                onChange={(e) => setFormData({ ...formData, validityPeriod: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maximale Teilnehmer
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trainer
              </label>
              <input
                type="text"
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Abteilung *
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={!!userDepartment}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm
                  ${errors.department ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                  dark:bg-[#181818] dark:text-white`}
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
          </div>

          {/* Department and Position Selection */}
          {selectedDepartment && (
            <div className="space-y-4">
              <label className="flex items-center">
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
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Für die gesamte Abteilung verfügbar
                </span>
              </label>

              {!formData.isForEntireDepartment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Positionen *
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {availablePositions.map((position) => (
                      <label key={position} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.targetPositions.includes(position)}
                          onChange={() => handlePositionChange(position)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {position}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.targetPositions && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.targetPositions}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Training Sessions */}
          <div className="space-y-4">
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

            {errors.sessions && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.sessions}</p>
            )}

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
                        value={session.date}
                        onChange={(e) => updateSession(session.id, { date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ort *
                      </label>
                      <input
                        type="text"
                        value={session.location}
                        onChange={(e) => updateSession(session.id, { location: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white sm:text-sm"
                      />
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
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white sm:text-sm"
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
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualifications */}
          <div className="space-y-4">
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
                      onChange={() => handleQualificationToggle(qual.id)}
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

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
            >
              Schulung erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}