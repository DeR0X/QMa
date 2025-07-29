import { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, Download, Plus, AlertCircle, Calendar, ArrowRight, ArrowLeft, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useSaveDocument, useLinkEmployeeDocument, useDocumentPreview } from '../../hooks/useDocuments';
import type { Employee } from '../../types';
import type { RootState } from '../../store';
import CategorySelector from '../trainings/CategorySelector';
import { API_BASE_URL } from '../../config/api';
import apiClient from '../../services/apiClient';

interface Props {
  employee: Employee;
  onClose: () => void;
  onUpload: (documents: EmployeeDocument[]) => void;
}

interface EmployeeDocument {
  id: string;
  employeeId: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  fileUrl: string;
  description: string;
  categoryId?: number;
}

interface UploadFile {
  id: string;
  file: File;
    description: string;
  uploading: boolean;
  categoryId?: number;
}

interface UploadStep {
  step: 'upload' | 'categorize' | 'complete';
  uploadedDocuments?: EmployeeDocument[];
}

export default function EmployeeDocumentUploader({ employee, onClose, onUpload }: Props) {
  const { employee: currentUser } = useSelector((state: RootState) => state.auth);
  const saveDocumentMutation = useSaveDocument();
  const linkEmployeeDocumentMutation = useLinkEmployeeDocument();
  const documentPreviewMutation = useDocumentPreview();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>({ step: 'upload' });
  const [pendingDocuments, setPendingDocuments] = useState<EmployeeDocument[]>([]);
  const [currentTagInputs, setCurrentTagInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Prevent background scrolling when modal is open
  useBodyScrollLock(true);

    const generateFileName = (originalName: string, isTraining: boolean = false) => {
    // Get current date in YYYYMMDD format
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
      (today.getMonth() + 1).toString().padStart(2, '0') + 
      today.getDate().toString().padStart(2, '0');
    
    // Get the base name (employee name or "Mitarbeiter")
    const baseName = isTraining ? 'Training' : employee.FullName;
    
    // Remove special characters and replace spaces with hyphens
    const cleanName = baseName
      .replace(/[äöüß]/g, (match) => {
        const replacements: { [key: string]: string } = {
          'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss'
        };
        return replacements[match] || match;
      })
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove all special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Create the final filename
    const prefix = isTraining ? 'Schulung' : 'Mitarbeiter';
    const finalName = `${prefix}-${dateString}-${cleanName}.pdf`;
    
    return finalName;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Datei "${file.name}" ist zu groß. Maximum: 10MB`);
        return;
      }

      // Check file type - only PDF files allowed
      const allowedTypes = [
        'application/pdf'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`Nur PDF-Dateien sind erlaubt. Datei "${file.name}" ist kein PDF.`);
        return;
      }

      // Generate new filename
      const newFileName = generateFileName(file.name, false);
      
      // Create a new File object with the new name
      const renamedFile = new File([file], newFileName, {
        type: file.type,
        lastModified: file.lastModified,
      });

      const uploadFile: UploadFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file: renamedFile,
        description: '',
        uploading: false,
      };

      setUploadFiles(prev => [...prev, uploadFile]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFileDescription = (fileId: string, description: string) => {
    setUploadFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, description } : file
      )
    );
  };
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Datei aus');
      return;
    }

    if (!currentUser) {
      toast.error('Benutzerinformationen nicht verfügbar');
      return;
    }

    setIsUploading(true);

    try {
      const uploadedDocuments: EmployeeDocument[] = [];
      
      for (const uploadFile of uploadFiles) {
        // Mark file as uploading
        setUploadFiles(prev => 
          prev.map(file => 
            file.id === uploadFile.id ? { ...file, uploading: true } : file
          )
        );

        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('file', uploadFile.file);
          formData.append('FileName', uploadFile.file.name);
          formData.append('Description', uploadFile.description || '');
          formData.append('UploadedBy', currentUser.ID.toString());
          formData.append('CategoryID', '2'); // Fixed category ID for employee documents
          formData.append('employeeId', employee.ID.toString());

          // Upload file to server
          const uploadResponse = await fetch(`${apiClient.getBaseUrl()}/documents`, {
        method: 'POST',
        body: formData,
      });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }

          const uploadResult = await uploadResponse.json();

          const document: EmployeeDocument = {
            id: uploadResult.documentID?.toString() || uploadFile.id,
            employeeId: employee.ID.toString(),
            fileName: uploadFile.file.name,
            fileType: uploadFile.file.type,
            uploadedBy: currentUser.FullName,
            uploadedAt: new Date().toISOString(),
            fileUrl: uploadResult.filePath || `/uploads${uploadFile.file.name}`,
            description: uploadFile.description,
            categoryId: 2,
          };

          uploadedDocuments.push(document);

          // Link document to employee
          try {
            await linkEmployeeDocumentMutation.mutateAsync({
              EmployeeID: employee.ID.toString(),
              DocumentID: parseInt(document.id)
            });
          } catch (linkError) {
            console.warn('Document might already be linked to employee:', linkError);
          }
        } catch (error) {
          console.error('Error uploading document:', error);
          toast.error(`Fehler beim Hochladen von ${uploadFile.file.name}`);
          continue;
        }
      }

      if (uploadedDocuments.length > 0) {
        // Call the onUpload callback with uploaded documents
        onUpload(uploadedDocuments);
        
        // Move to complete step
        setCurrentStep({ step: 'complete', uploadedDocuments });
        
        // Clear upload files
        setUploadFiles([]);

        toast.success(`${uploadedDocuments.length} Dokument(e) erfolgreich hochgeladen.`);
      } else {
        toast.error('Keine Dokumente konnten hochgeladen werden.');
      }
    } catch (error) {
      console.error('Error in upload process:', error);
      toast.error('Fehler beim Hochladen der Dokumente');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep({ step: 'upload' });
    setPendingDocuments([]);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      const previewUrl = await documentPreviewMutation.mutateAsync(parseInt(documentId));
      setPreviewUrl(previewUrl);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error getting document preview:', error);
      toast.error('Fehler beim Laden der Dokumentenvorschau');
    }
  };

  const downloadDocument = async (doc: EmployeeDocument) => {
    try {
      // Öffne den Download in einem neuen Tab
      window.open(`${apiClient.getBaseUrl()}/document-download/${doc.id}`, '_blank');
      toast.success(`Download von "${doc.fileName}" gestartet`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(`Fehler beim Herunterladen von ${doc.fileName}`);
    }
  };

  const testPreview = async () => {
    try {
      // Test mit einer Dokumenten-ID (hier 1 als Beispiel)
      const previewUrl = await documentPreviewMutation.mutateAsync(1);
      setPreviewUrl(previewUrl);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error testing preview:', error);
      toast.error('Fehler beim Testen der Dokumentenvorschau');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#121212] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
          <button
              type="button"
              className="rounded-md bg-white dark:bg-[#121212] text-gray-400 hover:text-gray-500 dark:text-white dark:hover:text-gray-300 focus:outline-none"
            onClick={onClose}
          >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              {/* Header with Step Indicator */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dokumente für {employee.FullName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {currentStep.step === 'upload' && 'Wählen Sie Dokumente aus'}
                  {currentStep.step === 'complete' && 'Dokumente erfolgreich hochgeladen'}
                </p>
                
                {/* Step Indicator */}
                <div className="mt-4 flex items-center space-x-4">
                  <div className={`flex items-center space-x-2 ${currentStep.step === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep.step === 'upload' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Auswahl</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <div className={`flex items-center space-x-2 ${
                    currentStep.step === 'complete' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep.step === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Upload</span>
                  </div>
                </div>
            </div>

              {/* Step Content */}
              {currentStep.step === 'upload' && (
                <div className="space-y-6">
                  {/* File Selection */}
                  <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              PDF-Dateien auswählen
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Nur PDF-Dateien erlaubt. Max. 10MB pro Datei.
            </p>
                  </div>

                  {/* Selected Files */}
                  {uploadFiles.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {uploadFiles.map(uploadFile => (
                    <div
                          key={uploadFile.id}
                          className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <div className="text-2xl">
                            {getFileIcon(uploadFile.file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {uploadFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(uploadFile.file.size)}
                            </p>
                      </div>
                      <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

                  {uploadFiles.length > 0 && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setUploadFiles([])}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#181818] border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                      >
                        Hochladen
                      </button>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Hinweise zu Mitarbeiterdokumenten
                        </h5>
                        <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside space-y-1">
                          <li>Dokumente werden dem Mitarbeiter zugeordnet und in der Online Personalakte gespeichert</li>
                          <li>Verwenden Sie aussagekräftige Dateinamen und Beschreibungen</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categorization Step */}
              {currentStep.step === 'categorize' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-md font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Dokumente werden hochgeladen
                    </h4>                    
                  </div>

                  <div className="space-y-6">
                    {pendingDocuments.map((document, index) => (
                      <div key={document.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="text-2xl">
                            {getFileIcon(document.fileType)}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                              {document.fileName}
                            </h5>
                            {document.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {document.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Step */}
              {currentStep.step === 'complete' && (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20">
                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Dokumente erfolgreich hochgeladen!
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {pendingDocuments.length} Dokument(e) wurden hochgeladen und in der Datenbank gespeichert und mit {employee.FullName} verknüpft.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#121212] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white dark:bg-[#121212] text-gray-400 hover:text-gray-500 dark:text-white dark:hover:text-gray-300 focus:outline-none"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setPreviewUrl(null);
                  }}
                >
                  <span className="sr-only">Schließen</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="mt-3 sm:mt-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Dokumentenvorschau
                </h3>
                <div className="mt-2">
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh] border border-gray-200 dark:border-gray-700 rounded-lg"
                    title="Dokumentenvorschau"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify the document list to include preview button */}
      {currentStep.step === 'complete' && pendingDocuments.length > 0 && (
        <div className="mt-4 space-y-4">
          {pendingDocuments.map((document) => (
            <div key={document.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getFileIcon(document.fileType)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {document.fileName}
                  </p>
                  {document.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {document.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreviewDocument(document.id)}
                  className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  title="Vorschau"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => downloadDocument(document)}
                  className="p-2 text-gray-400 hover:text-green-500 dark:hover:text-green-400"
                  title="Herunterladen"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Button - nur für Entwicklungszwecke */}
      <button
        onClick={testPreview}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Preview (ID: 1)
      </button>
    </div>
  );
}