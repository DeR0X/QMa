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
  Building2
} from 'lucide-react';
import { RootState } from '../store';
import { hasHRPermissions } from '../store/slices/authSlice';
import { toast } from 'sonner';
import { qualifications } from '../data/mockData';
import { itDepartments, manufacturingDepartments } from '../data/departments';

const allDepartments = [...itDepartments, ...manufacturingDepartments];

interface AdditionalFunction {
  id: string;
  name: string;
  description: string;
  validityPeriod: number;
  departments: string[];
  qualifications: string[];
  createdAt: string;
}

// Mock-Daten für Zusatzfunktionen
const mockAdditionalFunctions: AdditionalFunction[] = [
  {
    id: '1',
    name: 'Ersthelfer',
    description: 'Ausgebildeter Ersthelfer nach DGUV Vorschrift 1',
    validityPeriod: 24,
    departments: ['IT-Betrieb', 'Produktion'],
    qualifications: ['5'],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Brandschutzhelfer',
    description: 'Ausgebildeter Brandschutzhelfer gemäß ASR A2.2',
    validityPeriod: 36,
    departments: ['IT-Betrieb', 'Produktion', 'Qualitätsmanagement'],
    qualifications: ['6'],
    createdAt: '2024-02-01'
  },
  {
    id: '3',
    name: 'Sicherheitsbeauftragter',
    description: 'Sicherheitsbeauftragter nach § 22 SGB VII',
    validityPeriod: 24,
    departments: ['Produktion'],
    qualifications: ['5', '6', '7'],
    createdAt: '2024-02-15'
  }
];

export default function AdditionalFunctions() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<AdditionalFunction | null>(null);
  const [additionalFunctions, setAdditionalFunctions] = useState(mockAdditionalFunctions);

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

  const filteredFunctions = additionalFunctions.filter(func =>
    func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFunction = (newFunction: Omit<AdditionalFunction, 'id' | 'createdAt'>) => {
    const functionToAdd = {
      ...newFunction,
      id: (additionalFunctions.length + 1).toString(),
      createdAt: new Date().toISOString()
    };
    setAdditionalFunctions([...additionalFunctions, functionToAdd]);
    toast.success('Zusatzfunktion erfolgreich erstellt');
    setShowAddModal(false);
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
              key={func.id}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {func.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {func.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFunction(func)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center mb-2">
                      <Building2 className="h-4 w-4 mr-2" />
                      Verfügbar in Abteilungen:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {func.departments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center mb-2">
                      <Award className="h-4 w-4 mr-2" />
                      Erforderliche Qualifikationen:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {func.qualifications.map((qualId) => {
                        const qual = qualifications.find(q => q.id === qualId);
                        return qual ? (
                          <span
                            key={qualId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            {qual.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-2" />
                  Gültigkeitsdauer: {func.validityPeriod} Monate
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
        <AddAdditionalFunctionModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddFunction}
        />
      )}

      {/* Details Modal */}
      {selectedFunction && (
        <AdditionalFunctionDetails
          func={selectedFunction}
          onClose={() => setSelectedFunction(null)}
        />
      )}
    </div>
  );
}

interface AddModalProps {
  onClose: () => void;
  onAdd: (data: Omit<AdditionalFunction, 'id' | 'createdAt'>) => void;
}

function AddAdditionalFunctionModal({ onClose, onAdd }: AddModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    validityPeriod: 24,
    departments: [] as string[],
    qualifications: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Neue Zusatzfunktion erstellen
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Beschreibung *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
            />
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
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verfügbare Abteilungen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allDepartments.map((dept) => (
                <label
                  key={dept.name}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.departments.includes(dept.name)}
                    onChange={(e) => {
                      const newDepts = e.target.checked
                        ? [...formData.departments, dept.name]
                        : formData.departments.filter(d => d !== dept.name);
                      setFormData({ ...formData, departments: newDepts });
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{dept.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Erforderliche Qualifikationen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {qualifications.map((qual) => (
                <label
                  key={qual.id}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.qualifications.includes(qual.id)}
                    onChange={(e) => {
                      const newQuals = e.target.checked
                        ? [...formData.qualifications, qual.id]
                        : formData.qualifications.filter(q => q !== qual.id);
                      setFormData({ ...formData, qualifications: newQuals });
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {qual.name}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {qual.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
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
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DetailsModalProps {
  func: AdditionalFunction;
  onClose: () => void;
}

function AdditionalFunctionDetails({ func, onClose }: DetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-2xl w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {func.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Beschreibung
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {func.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Details
            </h3>
            <dl className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center">
                <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Gültigkeitsdauer:
                </dt>
                <dd className="ml-2 text-sm text-gray-900 dark:text-white">
                  {func.validityPeriod} Monate
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Erstellt am:
                </dt>
                <dd className="ml-2 text-sm text-gray-900 dark:text-white">
                  {new Date(func.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Verfügbare Abteilungen
            </h3>
            <div className="flex flex-wrap gap-2">
              {func.departments.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Erforderliche Qualifikationen
            </h3>
            <div className="space-y-2">
              {func.qualifications.map((qualId) => {
                const qual = qualifications.find(q => q.id === qualId);
                return qual ? (
                  <div
                    key={qualId}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {qual.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {qual.description}
                    </p>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}