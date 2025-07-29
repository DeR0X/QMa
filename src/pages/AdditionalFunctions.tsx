import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  AlertCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { RootState } from '../store';
import { setAccessRights } from '../store/slices/authSlice';
import { toast } from 'sonner';
import { 
  useAdditionalFunctions, 
  useCreateAdditionalFunction,
  useUpdateAdditionalFunction,
  useDeleteAdditionalFunction
} from '../hooks/useAdditionalFunctions';
import { useQualifications } from '../hooks/useQualifications';
import type { AdditionalSkill } from '../services/additionalFunctionsApi';
import apiClient from '../services/apiClient';

export default function AdditionalFunctions() {
  const dispatch = useDispatch();
  const { employee } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<AdditionalSkill | null>(null);
  const [editingFunction, setEditingFunction] = useState<AdditionalSkill | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'withQualifications' | 'withoutQualifications'>('all');
  const [hasHRAccess, setHasHRAccess] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const { data: additionalFunctions, isLoading, error } = useAdditionalFunctions();
  const { data: qualifications } = useQualifications();
  const createMutation = useCreateAdditionalFunction();
  const updateMutation = useUpdateAdditionalFunction();
  const deleteMutation = useDeleteAdditionalFunction();

  // Check HR/Admin access via API call and update Redux/LocalStorage
  const checkHRAccess = async () => {
    if (!employee) {
      setHasHRAccess(false);
      setIsCheckingAccess(false);
      return;
    }

    try {
      setIsCheckingAccess(true);
      const accessRights = await apiClient.get(`/employee-access-rights/${employee.ID}`);
      if (accessRights) {
        // Update Redux and LocalStorage with latest rights
        const rightNames = Array.isArray(accessRights) ? accessRights.map((right: any) => right.Name.toLowerCase()) : [];
        dispatch(setAccessRights(rightNames));
        // Only allow HR or Admin
        const hasHR = rightNames.includes('hr');
        const hasAdmin = rightNames.includes('admin');
        setHasHRAccess(hasHR || hasAdmin);
      } else {
        setHasHRAccess(false);
      }
    } catch (error) {
      console.error('Error checking HR access:', error);
      setHasHRAccess(false);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  // Check access when component mounts
  useEffect(() => {
    checkHRAccess();
  }, [employee?.ID]); // Only depend on the user ID

  const isHR = hasHRAccess === true;
  // Supervisor darf NICHT auf die Seite
  // (Wir prüfen nur auf HR oder Admin)

  // Berechne die Anzahl der verknüpften Qualifikationen für jede Zusatzfunktion
  const getLinkedQualificationsCount = (functionId: number) => {
    return qualifications?.filter(qual => 
      qual.AdditionalSkillID === functionId && qual.Herkunft === "Zusatz"
    ).length || 0;
  };

  // Hole die verknüpften Qualifikationen für eine Zusatzfunktion
  const getLinkedQualifications = (functionId: number) => {
    return qualifications?.filter(qual => 
      qual.AdditionalSkillID === functionId && qual.Herkunft === "Zusatz"
    ) || [];
  };

  if (isCheckingAccess) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Berechtigung wird geprüft...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Bitte warten Sie einen Moment.
          </p>
        </div>
      </div>
    );
  }

  if (!isHR) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Zugriff verweigert
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Sie haben keine HR- oder Admin-Berechtigung, diese Seite aufzurufen.
          </p>
          <button
            onClick={checkHRAccess}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut prüfen
          </button>
        </div>
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

  const filteredFunctions = additionalFunctions?.filter(func => {
    const matchesSearch = func.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.Description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const linkedCount = getLinkedQualificationsCount(func.ID || 0);
    
    if (filterType === 'withQualifications') {
      return matchesSearch && linkedCount > 0;
    } else if (filterType === 'withoutQualifications') {
      return matchesSearch && linkedCount === 0;
    }
    
    return matchesSearch;
  }) || [];

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
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Neue Zusatzfunktion
          </button>
          <Star className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Suchbereich und Filter */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Zusatzfunktionen durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 ${
              filterType === 'all'
                ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilterType('withQualifications')}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 ${
              filterType === 'withQualifications'
                ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            Mit Qualifikationen
          </button>
          <button
            onClick={() => setFilterType('withoutQualifications')}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 ${
              filterType === 'withoutQualifications'
                ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            Ohne Qualifikationen
          </button>
        </div>
      </div>

      {/* Zusatzfunktionen Liste */}
      <div className="space-y-4">
        {filteredFunctions.map((func) => {
          const linkedCount = getLinkedQualificationsCount(func.ID || 0);
          const linkedQualifications = getLinkedQualifications(func.ID || 0);
          const isDeletable = linkedCount === 0;
          
          return (
            <div
              key={func.ID}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 group"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {func.Name}
                    </h3>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      linkedCount > 0 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                    }`}>
                      <Award className="h-3 w-3 mr-1" />
                      {linkedCount} {linkedCount === 1 ? 'Qualifikation' : 'Qualifikationen'}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {func.Description}
                  </p>
                  
                  {/* Zeige verknüpfte Qualifikationen an */}
                  {linkedCount > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Verknüpfte Qualifikationen:
                        </span>
                      </div>
                      <div className="space-y-1">
                        {linkedQualifications.map((qual) => (
                          <div key={qual.ID} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {qual.Name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingFunction(func)}
                    className="text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  {isDeletable ? (
                    <button
                      onClick={() => setShowDeleteConfirm(func.ID || null)}
                      className="text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors duration-200"
                      title="Zusatzfunktion löschen"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="text-gray-300 dark:text-gray-600 cursor-not-allowed transition-colors duration-200"
                      title="Zusatzfunktion kann nicht gelöscht werden, da sie Qualifikationen zugeordnet ist"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredFunctions.length === 0 && (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {searchTerm || filterType !== 'all' 
                ? "Keine Zusatzfunktionen gefunden" 
                : "Keine Zusatzfunktionen vorhanden"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all'
                ? "Versuchen Sie es mit anderen Suchkriterien oder Filtern."
                : "Beginnen Sie damit, eine neue Zusatzfunktion zu erstellen."}
            </p>
          </div>
        )}
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#2a2a2a] dark:border-gray-700"
            >
              {initialData ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}