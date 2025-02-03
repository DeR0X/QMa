import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Upload, 
  X, 
  Link, 
  Tag, 
  Plus, 
  Globe,
  Building2,
  Users,
  Lock,
  AlertCircle,
  FileText,
  Calendar,
  Languages,
  Clock,
  History,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { RootState } from '../../store';
import type { DocumentUploadFormData } from '../../types';
import { itDepartments, manufacturingDepartments } from '../../data/departments';

const DOCUMENT_TYPES = [
  'Richtlinie',
  'Verfahrensanweisung',
  'Formular',
  'Vorlage',
  'Bericht',
  'Schulungsmaterial',
  'Vertrag',
  'Handbuch',
  'Leitfaden',
  'Zertifizierung',
];

const DOCUMENT_CATEGORIES = [
  'Personal',
  'Finanzen',
  'Betrieb',
  'IT',
  'Recht',
  'Qualität',
  'Sicherheit',
  'Schulung',
  'Compliance',
  'Allgemein',
];

const DOCUMENT_CLASSIFICATIONS = [
  { value: 'employee', label: 'Mitarbeiterdokumente' },
  { value: 'training', label: 'Schulungsmaterialien' },
  { value: 'policy', label: 'Richtlinien' },
  { value: 'procedure', label: 'Verfahrensanweisungen' },
];

const VISIBILITY_LEVELS = [
  { value: 'public', label: 'Öffentlich (Alle Mitarbeiter)', icon: Globe },
  { value: 'department', label: 'Nur Abteilung', icon: Building2 },
  { value: 'role', label: 'Rollenbasiert', icon: Users },
  { value: 'private', label: 'Privat (Ausgewählte Benutzer)', icon: Lock },
];

const LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'Englisch' },
];

const ROLES = [
    { value: 'employee', label: 'Mitarbeiter' },
    { value: 'supervisor', label: 'Vorgesetzter' },
    { value: 'hr', label: 'HR' },
  ];
  
  const PERMISSIONS = [
    { value: 'view', label: 'Ansehen', description: 'Kann das Dokument öffnen und lesen' },
    { value: 'download', label: 'Herunterladen', description: 'Kann das Dokument herunterladen' },
    { value: 'edit', label: 'Bearbeiten', description: 'Kann das Dokument bearbeiten' },
    { value: 'delete', label: 'Löschen', description: 'Kann das Dokument löschen' },
    { value: 'share', label: 'Teilen', description: 'Kann das Dokument mit anderen teilen' },
    { value: 'print', label: 'Drucken', description: 'Kann das Dokument drucken' },
  ];

interface Props {
  onClose: () => void;
  onUpload: (data: DocumentUploadFormData) => void;
}

export default function EnhancedDocumentUploader({ onClose, onUpload }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [formData, setFormData] = useState<DocumentUploadFormData>({
    file: null,
    url: '',
    metadata: {
      title: '',
      type: '',
      category: '',
      department: user?.department || '',
      classification: 'employee',
      version: '1.0',
      owner: user?.name || '',
      tags: [],
      description: '',
      relatedDocuments: [],
      approvalStatus: 'pending',
      retentionPeriod: 24,
      language: 'de',
      accessControl: {
        visibility: 'department',
        allowedDepartments: [],
        allowedRoles: [],
        allowedUsers: [],
        permissions: {
          view: [],
          download: [],
          edit: [],
          delete: [],
          share: [],
          print: []
        } as unknown as DocumentUploadFormData['metadata']['accessControl']['permissions']
      },
    },
  });

  const [currentTag, setCurrentTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.file && !formData.url) {
      newErrors.file = 'Bitte laden Sie eine Datei hoch oder geben Sie eine URL an';
    }

    if (!formData.metadata.title) {
      newErrors.title = 'Titel ist erforderlich';
    }

    if (!formData.metadata.type) {
      newErrors.type = 'Dokumententyp ist erforderlich';
    }

    if (!formData.metadata.category) {
      newErrors.category = 'Kategorie ist erforderlich';
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

    onUpload(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setFormData(prev => ({ ...prev, file }));
    } else {
      toast.error('Bitte nur PDF-Dateien oder Bilder hochladen');
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag) {
      e.preventDefault();
      if (!formData.metadata.tags.includes(currentTag)) {
        setFormData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            tags: [...prev.metadata.tags, currentTag],
          },
        }));
      }
      setCurrentTag('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-4xl w-full mx-4 my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dokument hochladen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload-Methode Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className={`pb-2 px-4 ${
                activeTab === 'file'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('file')}
            >
              <Upload className="h-5 w-5 inline mr-2" />
              Datei hochladen
            </button>
            <button
              type="button"
              className={`pb-2 px-4 ${
                activeTab === 'url'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('url')}
            >
              <Link className="h-5 w-5 inline mr-2" />
              URL hochladen
            </button>
          </div>

          {/* Upload-Bereich */}
          {activeTab === 'file' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#181818]'
              } hover:bg-gray-100 dark:hover:bg-[#1a1a1a]`}
            >
              {formData.file ? (
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Entfernen
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Klicken</span> oder Datei hierher ziehen
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Nur PDF oder Bilddateien
                  </p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData(prev => ({ ...prev, file }));
                  }
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dokument URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                placeholder="https://"
              />
            </div>
          )}

          {/* Dokument Metadaten */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Titel *
              </label>
              <input
                type="text"
                required
                value={formData.metadata.title}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, title: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dokumententyp *
              </label>
              <select
                required
                value={formData.metadata.type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, type: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              >
                <option value="">Typ auswählen</option>
                {DOCUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategorie *
              </label>
              <select
                required
                value={formData.metadata.category}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, category: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              >
                <option value="">Kategorie auswählen</option>
                {DOCUMENT_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Abteilung
              </label>
              <select
                value={formData.metadata.department}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, department: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              >
                {[...itDepartments, ...manufacturingDepartments].map(dept => (
                  <option key={dept.name} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Klassifizierung
              </label>
              <select
                value={formData.metadata.classification}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { 
                    ...prev.metadata, 
                    classification: e.target.value as DocumentUploadFormData['metadata']['classification']
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              >
                {DOCUMENT_CLASSIFICATIONS.map(classification => (
                  <option key={classification.value} value={classification.value}>
                    {classification.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Version
              </label>
              <input
                type="text"
                value={formData.metadata.version}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, version: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ablaufdatum
              </label>
              <input
                type="date"
                value={formData.metadata.expirationDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, expirationDate: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Aufbewahrungsfrist (Monate)
              </label>
              <input
                type="number"
                min="1"
                value={formData.metadata.retentionPeriod}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, retentionPeriod: parseInt(e.target.value) }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sprache
              </label>
              <select
                value={formData.metadata.language}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, language: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Schlagworte
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {formData.metadata.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        tags: prev.metadata.tags.filter(t => t !== tag)
                      }
                    }))}
                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagAdd}
                placeholder="Schlagworte hinzufügen..."
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#181818] dark:text-white"
              />
            </div>
          </div>

          {/* Beschreibung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Beschreibung
            </label>
            <textarea
              rows={3}
              value={formData.metadata.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, description: e.target.value }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
            />
          </div>

          {/* Zugriffssteuerung */}
          <div className="space-y-4">
  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
    Zugriffssteuerung
  </h3>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Sichtbarkeit
      </label>
      <select
        value={formData.metadata.accessControl.visibility}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            accessControl: {
              ...prev.metadata.accessControl,
              visibility: e.target.value as DocumentUploadFormData['metadata']['accessControl']['visibility']
            }
          }
        }))}
        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
      >
        {VISIBILITY_LEVELS.map(level => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
    </div>

    {formData.metadata.accessControl.visibility === 'department' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Erlaubte Abteilungen
        </label>
        <select
          multiple
          value={formData.metadata.accessControl.allowedDepartments}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({
              ...prev,
              metadata: {
                ...prev.metadata,
                accessControl: {
                  ...prev.metadata.accessControl,
                  allowedDepartments: selected
                }
              }
            }));
          }}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
        >
          {[...itDepartments, ...manufacturingDepartments].map(dept => (
            <option key={dept.name} value={dept.name}>{dept.name}</option>
          ))}
        </select>
      </div>
    )}

    {formData.metadata.accessControl.visibility === 'role' && (
      <div className="sm:col-span-2 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Wählen Sie die Rollen und deren Berechtigungen aus
        </p>
        {ROLES.map(role => (
          <div key={role.value} className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {role.label}
              </h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.metadata.accessControl.allowedRoles.includes(role.value)}
                  onChange={(e) => {
                    setFormData(prev => {
                      const newAllowedRoles = e.target.checked
                        ? [...prev.metadata.accessControl.allowedRoles, role.value]
                        : prev.metadata.accessControl.allowedRoles.filter(r => r !== role.value);
                      
                      return {
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          accessControl: {
                            ...prev.metadata.accessControl,
                            allowedRoles: newAllowedRoles
                          }
                        }
                      };
                    });
                  }}
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                  Rolle aktivieren
                </span>
              </label>
            </div>
            
            {formData.metadata.accessControl.allowedRoles.includes(role.value) && (
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map(permission => (
                  <label key={permission.value} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={
                        (formData.metadata.accessControl.permissions as Record<string, string[]>)[permission.value]?.includes(role.value) || false
                      }
                      onChange={(e) => {
                        setFormData(prev => {
                          const permissions = prev.metadata.accessControl.permissions as Record<string, string[]>;
                          const currentPermissions = permissions[permission.value] || [];
                          const newPermissions = e.target.checked
                            ? [...currentPermissions, role.value]
                            : currentPermissions.filter(r => r !== role.value);

                          const updatedPermissions = {
                            ...permissions,
                            [permission.value]: newPermissions,
                          } as unknown as DocumentUploadFormData['metadata']['accessControl']['permissions'];

                          return {
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              accessControl: {
                                ...prev.metadata.accessControl,
                                permissions: updatedPermissions,
                              },
                            },
                          };
                        });
                      }}
                    />
                    <div className="ml-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {permission.label}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {permission.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
</div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
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
              Dokument hochladen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}