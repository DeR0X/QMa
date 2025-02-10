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

  // Only allow access if user is a supervisor or HR
  if (!isHRAdmin && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
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
      prev.map(q => q.id === qualification.id ? qualification : q)
    );
    toast.success('Qualifikation erfolgreich aktualisiert');
    setEditingQual(null);
  };

  const filteredQualifications = localQualifications.filter(qual =>
    qual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qual.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Qualifikationen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Verwalten Sie Qualifikationen und deren Anforderungen
          </p>
        </div>
        <div className="flex items-center gap-4">
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

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
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
        </div>

        <div className="grid grid-cols-1 gap-6 p-6">
          {filteredQualifications.map((qualification) => (
            <div
              key={qualification.id}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {qualification.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {qualification.description}
                  </p>
                </div>
                <button
                  onClick={() => setEditingQual(qualification)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <span className="font-medium">Gültigkeitsdauer:</span>{' '}
                  {qualification.validityInMonth} Monate
                </div>
                <div>
                  <span className="font-medium">Erforderliche Schulungen:</span>
                  <ul className="mt-1 list-disc list-inside">
                    {qualification.requiredTrainings.map((trainingId) => (
                      <li key={trainingId}>Training #{trainingId}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(showAddModal || editingQual) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4">
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
    requiredTrainings: initialData?.requiredTrainings || [],
    department: '',
    positions: [] as string[],
    isFreeQualification: false,
  });

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const availablePositions = allDepartments.find(d => d.name === selectedDepartment)?.positions || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialData?.id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
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
        <label className="flex items-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={formData.isFreeQualification}
            onChange={(e) => setFormData({ ...formData, isFreeQualification: e.target.checked })}
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Freie Qualifikation (für alle Mitarbeiter verfügbar)
          </span>
        </label>
      </div>

      {!formData.isFreeQualification && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Abteilung
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setFormData(prev => ({ ...prev, positions: [] }));
              }}
            >
              <option value="">Abteilung auswählen</option>
              {allDepartments.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {selectedDepartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Positionen
              </label>
              <div className="mt-2 space-y-2">
                {availablePositions.map((position) => (
                  <label key={position} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.positions.includes(position)}
                      onChange={(e) => {
                        const newPositions = e.target.checked
                          ? [...formData.positions, position]
                          : formData.positions.filter(p => p !== position);
                        setFormData({ ...formData, positions: newPositions });
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {position}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
        >
          {initialData ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
}