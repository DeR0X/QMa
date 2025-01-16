import { useState } from 'react';
import { X, Plus, Award, Edit2, Globe, Search } from 'lucide-react';
import { itDepartments, manufacturingDepartments } from '../../data/departments';
import { qualifications } from '../../data/mockData';
import type { Training, TrainingSession, Qualification } from '../../types';

interface Props {
  onClose: () => void;
  onAdd: (training: Omit<Training, 'id'>) => void;
  userDepartment?: string;
}

const allDepartments = [...itDepartments, ...manufacturingDepartments];

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
        : [...prev.qualificationIds, qualId]
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Qualifikationen suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredQualifications.map((qual) => (
                <div
                  key={qual.id}
                  className={`p-4 rounded-lg border ${
                    formData.qualificationIds.includes(qual.id)
                      ? 'border-primary bg-primary/5'
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
                        Gültigkeitsdauer: {qual.validityPeriod} Monate
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
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