import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Star, 
  Search, 
  Plus, 
  X, 
  Award,
  Clock,
  Info,
  Users,
  Building2,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { RootState } from '../store';
import { hasHRPermissions } from '../store/slices/authSlice';
import { toast } from 'sonner';
import { 
  useAdditionalFunctions, 
  useCreateAdditionalFunction,
  useUpdateAdditionalFunction,
  useDeleteAdditionalFunction
} from '../hooks/useAdditionalFunctions';
import type { AdditionalSkill } from '../services/additionalFunctionsApi';

export default function AdditionalFunctions() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<AdditionalSkill | null>(null);
  const [editingFunction, setEditingFunction] = useState<AdditionalSkill | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const { data: additionalFunctions, isLoading, error } = useAdditionalFunctions();
  const createMutation = useCreateAdditionalFunction();
  const updateMutation = useUpdateAdditionalFunction();
  const deleteMutation = useDeleteAdditionalFunction();

  const isHR = hasHRPermissions(employee);
  const isSupervisor = employee?.role === 'supervisor';

  if (!isHR && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-4">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">Laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-red-500">Fehler beim Laden der Zusatzfunktionen</p>
      </div>
    );
  }

  const filteredFunctions = additionalFunctions?.filter(func =>
    func.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.Description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddFunction = async (data: Omit<AdditionalSkill, 'ID'>) => {
    try {
      await createMutation.mutateAsync(data);
      setShowAddModal(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleEditFunction = async (data: AdditionalSkill) => {
    if (!data.ID) return;
    
    try {
      console.log('Editing function:', data); // Debug log
      await updateMutation.mutateAsync({
        id: data.ID,
        data: {
          Name: data.Name,
          Description: data.Description
        }
      });
      setEditingFunction(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleDeleteFunction = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setShowDeleteConfirm(null);
      toast.success('Zusatzfunktion erfolgreich gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen der Zusatzfunktion');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Zusatzfunktionen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Verwalten Sie Zusatzfunktionen und deren Qualifikationsanforderungen
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Neue Zusatzfunktion
          </button>
          <Star className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Suchbereich */}
      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Zusatzfunktionen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Liste der Zusatzfunktionen */}
        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
          {filteredFunctions.map((func) => (
            <div
              key={func.ID}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {func.Name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {func.Description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingFunction(func)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => func.ID && setShowDeleteConfirm(func.ID)}
                      className="text-red-400 hover:text-red-500 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredFunctions.length === 0 && (
            <div className="text-center py-12">
              <Star className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Keine Zusatzfunktionen gefunden
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Beginnen Sie damit, eine neue Zusatzfunktion zu erstellen.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal für neue Zusatzfunktion */}
      {showAddModal && (
        <AdditionalFunctionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddFunction}
        />
      )}

      {/* Modal für Bearbeitung */}
      {editingFunction && (
        <AdditionalFunctionModal
          onClose={() => setEditingFunction(null)}
          onSubmit={handleEditFunction}
          initialData={editingFunction}
        />
      )}

      {/* Lösch-Bestätigungsdialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Zusatzfunktion löschen
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Sind Sie sicher, dass Sie diese Zusatzfunktion löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDeleteFunction(showDeleteConfirm)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
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

interface AddModalProps {
  onClose: () => void;
  onSubmit: (data: AdditionalSkill) => void;
  initialData?: AdditionalSkill;
}

function AdditionalFunctionModal({ onClose, onSubmit, initialData }: AddModalProps) {
  const [formData, setFormData] = useState({
    ID: initialData?.ID,
    Name: initialData?.Name || '',
    Description: initialData?.Description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Name || !formData.Description) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    console.log('Submitting form data:', formData); // Debug log
    onSubmit(formData as AdditionalSkill);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Zusatzfunktion bearbeiten' : 'Neue Zusatzfunktion erstellen'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              placeholder="z.B. Ersthelfer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Beschreibung *
            </label>
            <textarea
              required
              rows={4}
              value={formData.Description}
              onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              placeholder="Detaillierte Beschreibung der Zusatzfunktion..."
            />
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
              {initialData ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}