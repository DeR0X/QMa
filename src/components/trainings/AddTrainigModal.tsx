import { useState } from 'react';
import { X, Plus, Award } from 'lucide-react';
import { itDepartments, manufacturingDepartments } from '../../data/departments';
import type { Training, TrainingSession, Qualification } from '../../types';

interface Props {
  onClose: () => void;
  onAdd: (training: Omit<Training, 'id'>) => void;
  userDepartment?: string;
}

interface QualificationForm {
  name: string;
  description: string;
  validityPeriod: number;
}

const allDepartments = [...itDepartments, ...manufacturingDepartments];

export default function AddTrainingModal({ onClose, onAdd, userDepartment }: Props) {
  const [selectedDepartment, setSelectedDepartment] = useState(userDepartment || '');
  const [showQualificationForm, setShowQualificationForm] = useState(false);
  const [qualificationForm, setQualificationForm] = useState<QualificationForm>({
    name: '',
    description: '',
    validityPeriod: 12
  });
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
    sessions: [{
      id: Date.now().toString(),
      date: '',
      location: '',
      availableSpots: 10
    }] as TrainingSession[],
    qualificationIds: [] as string[]
  });

  const availablePositions = allDepartments.find(d => d.name === selectedDepartment)?.positions || [];

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setFormData(prev => ({ ...prev, targetPositions: [] }));
  };

  const handlePositionChange = (position: string) => {
    setFormData(prev => {
      const positions = prev.targetPositions.includes(position)
        ? prev.targetPositions.filter(p => p !== position)
        : [...prev.targetPositions, position];
      return { ...prev, targetPositions: positions };
    });
  };

  const handleAddQualification = () => {
    if (!qualificationForm.name || !qualificationForm.description) return;

    const qualificationId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      qualificationIds: [...prev.qualificationIds, qualificationId]
    }));

    setQualificationForm({ name: '', description: '', validityPeriod: 12 });
    setShowQualificationForm(false);
  };

  const removeQualification = (id: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualificationIds.filter(q => q !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      department: selectedDepartment,
    } as Omit<Training, 'id'>);
    onClose();
  };

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, {
        id: Date.now().toString(),
        date: '',
        location: '',
        availableSpots: formData.maxParticipants
      }]
    }));
  };

  const removeSession = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Neue Schulung erstellen
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Titel
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trainer
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Abteilung
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={!!userDepartment}
              >
                <option value="">Abteilung auswählen</option>
                {allDepartments.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.isForEntireDepartment}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isForEntireDepartment: e.target.checked,
                    targetPositions: e.target.checked ? [] : prev.targetPositions
                  }))}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Für die gesamte Abteilung verfügbar
                </span>
              </label>

              {!formData.isForEntireDepartment && selectedDepartment && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Positionen (mindestens eine auswählen)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePositions.map((position) => (
                      <label key={position} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={formData.targetPositions.includes(position)}
                          onChange={() => handlePositionChange(position)}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {position}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dauer
              </label>
              <input
                type="text"
                required
                placeholder="z.B. 2 Stunden"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gültigkeitsdauer (Monate)
              </label>
              <input
                type="number"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.validityPeriod}
                onChange={(e) => setFormData({ ...formData, validityPeriod: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maximale Teilnehmer
              </label>
              <input
                type="number"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Beschreibung
              </label>
              <textarea
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.isMandatory}
                  onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Pflichtschulung
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Qualifikationen
              </h3>
              <button
                type="button"
                onClick={() => setShowQualificationForm(true)}
                className="text-sm text-primary hover:text-primary/80 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Qualifikation hinzufügen
              </button>
            </div>

            {showQualificationForm && (
              <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name der Qualifikation
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                    value={qualificationForm.name}
                    onChange={(e) => setQualificationForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Beschreibung
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                    value={qualificationForm.description}
                    onChange={(e) => setQualificationForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gültigkeitsdauer (Monate)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                    value={qualificationForm.validityPeriod}
                    onChange={(e) => setQualificationForm(prev => ({ ...prev, validityPeriod: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowQualificationForm(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQualification}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            )}

            {formData.qualificationIds.length > 0 && (
              <div className="space-y-2">
                {formData.qualificationIds.map((qualId) => (
                  <div
                    key={qualId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#181818] rounded-lg"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Qualification #{qualId}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQualification(qualId)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Termine</h3>
              <button
                type="button"
                onClick={addSession}
                className="text-sm text-primary hover:text-primary/80"
              >
                Termin hinzufügen
              </button>
            </div>

            {formData.sessions.map((session, index) => (
              <div key={session.id} className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-b pb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Datum & Zeit
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                    value={session.date}
                    onChange={(e) => {
                      const newSessions = [...formData.sessions];
                      newSessions[index] = { ...session, date: e.target.value };
                      setFormData({ ...formData, sessions: newSessions });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ort
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                    value={session.location}
                    onChange={(e) => {
                      const newSessions = [...formData.sessions];
                      newSessions[index] = { ...session, location: e.target.value };
                      setFormData({ ...formData, sessions: newSessions });
                    }}
                  />
                </div>

                <div className="flex items-end">
                  {formData.sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSession(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Termin entfernen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
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

