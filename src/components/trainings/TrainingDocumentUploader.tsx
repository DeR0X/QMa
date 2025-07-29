import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, Trash2, Download, Plus, AlertCircle, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useSaveDocument, useLinkTrainingDocument } from '../../hooks/useDocuments';
import { usePopularTags } from '../../hooks/useDocuments';
import type { Training, TrainingDocument } from '../../types';
import type { RootState } from '../../store';
import apiClient from '../../services/apiClient';

interface Props {
  training: Training;
  onClose: () => void;
  onUpload: (documents: TrainingDocument[]) => void;
  onTrainingComplete?: (trainingId: number, completionDate?: string) => void;
}

interface UploadFile {
  id: string;
  file: File;
  description: string;
  uploading: boolean;
  categoryId?: number;
  tags: string;
}

interface UploadStep {
  step: 'upload' | 'complete';
  uploadedDocuments?: TrainingDocument[];
}

export default function TrainingDocumentUploader({ training, onClose, onUpload, onTrainingComplete }: Props) {
  const { employee } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const saveDocumentMutation = useSaveDocument();
  const linkTrainingDocumentMutation = useLinkTrainingDocument();
  const { popularTags, isLoading: isLoadingTags } = usePopularTags();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<TrainingDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [completionDate, setCompletionDate] = useState<string>(() => {
    // Default to today's date
    return new Date().toISOString().split('T')[0];
  });
  const [currentStep, setCurrentStep] = useState<UploadStep>({ step: 'upload' });
  const [pendingDocuments, setPendingDocuments] = useState<TrainingDocument[]>([]);
  const [currentTagInputs, setCurrentTagInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent background scrolling when modal is open
  useBodyScrollLock(true);

  // Get today's date for max date validation
  const today = new Date().toISOString().split('T')[0];

  const generateFileName = (originalName: string, isTraining: boolean = true) => {
    // Get current date in YYYYMMDD format
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
      (today.getMonth() + 1).toString().padStart(2, '0') + 
      today.getDate().toString().padStart(2, '0');
    
    // Get the base name (training name or "Mitarbeiter")
    const baseName = isTraining ? training.Name : 'Mitarbeiter';
    
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
      const newFileName = generateFileName(file.name, true);
      
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
        tags: ''
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

  const updateFileTags = (fileId: string, tags: string) => {
    setUploadFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, tags } : file
      )
    );
  };

  const addPopularTag = (tag: string, fileId: string) => {
    const file = uploadFiles.find(f => f.id === fileId);
    if (!file) return;
    
    const existingTags = file.tags.trim();
    const newTagsValue = existingTags 
      ? `${existingTags};${tag}` 
      : tag;
    updateFileTags(fileId, newTagsValue);
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Datei aus');
      return;
    }

    // Validate completion date
    if (!completionDate) {
      toast.error('Bitte geben Sie ein Abschlussdatum an');
      return;
    }

    const selectedDate = new Date(completionDate);
    const todayDate = new Date();
    todayDate.setHours(23, 59, 59, 999); // Set to end of today

    if (selectedDate > todayDate) {
      toast.error('Das Abschlussdatum kann nicht in der Zukunft liegen');
      return;
    }

    setIsUploading(true);

    try {
      const uploadedDocuments: TrainingDocument[] = [];

      for (const uploadFile of uploadFiles) {
        // Mark file as uploading
        setUploadFiles(prev => 
          prev.map(file => 
            file.id === uploadFile.id ? { ...file, uploading: true } : file
          )
        );

        try {
          // Create FormData for file upload (same as EmployeeDocumentUploader)
          const formData = new FormData();
          formData.append('file', uploadFile.file);
          formData.append('FileName', uploadFile.file.name);
          formData.append('Description', uploadFile.description || '');
          formData.append('UploadedBy', employee?.ID?.toString() || '1');
          formData.append('CategoryID', '1'); // Category ID 1 for training documents
          formData.append('Tags', uploadFile.tags || '');

          // Upload file to server (same as EmployeeDocumentUploader)
          const uploadResponse = await fetch(`${apiClient.getBaseUrl()}/documents`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }

          const uploadResult = await uploadResponse.json();

          const document: TrainingDocument = {
            id: uploadResult.documentID?.toString() || uploadFile.id,
            trainingId: training.ID.toString(),
            fileName: uploadFile.file.name,
            fileType: uploadFile.file.type,
            uploadedBy: employee?.FullName || 'Current User',
            uploadedAt: new Date().toISOString(),
            fileUrl: uploadResult.filePath || `/${uploadFile.file.name}`,
            description: uploadFile.description,
            categoryId: 1, // Always use category ID 1
            tags: uploadFile.tags
          };

          uploadedDocuments.push(document);
        } catch (error) {
          console.error('Error uploading document:', error);
          toast.error(`Fehler beim Hochladen von ${uploadFile.file.name}`);
          continue;
        }
      }

      if (uploadedDocuments.length === 0) {
        toast.error('Keine Dokumente konnten hochgeladen werden.');
        return;
      }

      // Store uploaded documents
      setPendingDocuments(uploadedDocuments);
      
      // Move directly to complete step
      setCurrentStep({ step: 'complete', uploadedDocuments });
      
      // Clear upload files
      setUploadFiles([]);

      // Link uploaded documents to training
      if (!employee) {
        toast.error('Benutzerinformationen nicht verfügbar');
        return;
      }

      setIsSavingToDatabase(true);

      try {
        // Documents are already saved to database during upload
        // Now we just need to link them to the training
        for (const document of uploadedDocuments) {
          if (document.id && !isNaN(parseInt(document.id))) {
            console.log('Linking document to training:', {
              TrainingID: training.ID,
              DocumentID: parseInt(document.id)
            });
            await linkTrainingDocumentMutation.mutateAsync({
              TrainingID: training.ID,
              DocumentID: parseInt(document.id)
            });
          }
        }

        // Note: Training documents are linked to the training, not to individual employees
        // The linkEmployeeDocument call has been removed as it was incorrectly linking documents
        // to the current user instead of training participants

        // Call the onUpload callback with documents
        onUpload(uploadedDocuments);

        // Update existing documents
        setExistingDocuments(prev => [...prev, ...uploadedDocuments]);

        // Mark training as completed when documents are uploaded
        try {
          console.log('Attempting to mark training as completed:', {
            trainingId: training.ID,
            completionDate,
            hasOnTrainingCompleteCallback: !!onTrainingComplete,
            uploadedDocumentsCount: uploadedDocuments.length
          });

          if (onTrainingComplete && uploadedDocuments.length > 0) {
            await onTrainingComplete(training.ID, completionDate);
            console.log('Training completion callback executed successfully');
          } else if (!onTrainingComplete) {
            // If no callback provided, try to update training directly
            console.log('No completion callback provided, updating training directly');
            await apiClient.put(`/trainings/${training.ID}`, {
              completed: true,
              completedDate: completionDate || new Date().toISOString().split('T')[0]
            });
            console.log('Training marked as completed directly via API');
          }
        } catch (completionError) {
          console.error('Error marking training as completed:', completionError);
          // Don't fail the entire upload process, but show a warning
          toast.warning('Dokumente wurden erfolgreich hochgeladen, aber die Schulung konnte nicht automatisch als abgeschlossen markiert werden. Bitte markieren Sie sie manuell als abgeschlossen.');
        }

        const formattedDate = new Date(completionDate).toLocaleDateString('de-DE');
        toast.success(`${uploadedDocuments.length} Dokument(e) erfolgreich hochgeladen und gespeichert - Schulung als abgeschlossen markiert (${formattedDate})`);
        
        // Force cache invalidation to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
        queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
        
      } catch (error) {
        console.error('Error saving documents to database:', error);
        toast.error('Fehler beim Speichern der Dokumente in die Datenbank');
      } finally {
        setIsSavingToDatabase(false);
      }

    } catch (error) {
      toast.error('Fehler beim Hochladen der Dokumente');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      return;
    }

    try {
      setExistingDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Dokument erfolgreich gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen des Dokuments');
    }
  };

  const downloadDocument = (document: TrainingDocument) => {
    // In real app, handle actual download
    toast.info(`Download von "${document.fileName}" gestartet`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <span className="sr-only">Schließen</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              {/* Header with Step Indicator */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dokumente für "{training.Name}"
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {currentStep.step === 'upload' && 'Laden Sie Dokumente hoch und geben Sie das Abschlussdatum an'}
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
                    <span className="text-sm font-medium">Upload</span>
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
                    <span className="text-sm font-medium">Abgeschlossen</span>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              {currentStep.step === 'upload' && (
                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Neue Dokumente hinzufügen
                    </h4>

                    {/* Completion Date Input */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                          Abschlussdatum der Schulung *
                        </h5>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="completion-date" className="block text-sm text-blue-800 dark:text-blue-300">
                          Wann wurde die Schulung abgeschlossen?
                        </label>
                        <input
                          id="completion-date"
                          type="date"
                          value={completionDate}
                          onChange={(e) => setCompletionDate(e.target.value)}
                          max={today}
                          className={`block w-full sm:w-64 rounded-md shadow-sm focus:ring-blue-500 dark:bg-[#121212] dark:text-white text-sm ${
                            completionDate && new Date(completionDate) > new Date(today)
                              ? 'border-red-300 dark:border-red-600 focus:border-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                          }`}
                          required
                        />
                        {completionDate && new Date(completionDate) > new Date(today) && (
                          <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Das Datum liegt in der Zukunft und ist nicht gültig.
                          </p>
                        )}
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          Das Abschlussdatum kann nicht in der Zukunft liegen.
                        </p>
                      </div>
                    </div>

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
                              <div className="mt-2 space-y-2">
                                <input
                                  type="text"
                                  placeholder="Beschreibung (optional)"
                                  value={uploadFile.description}
                                  onChange={(e) => updateFileDescription(uploadFile.id, e.target.value)}
                                  className="block w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                                <input
                                  type="text"
                                  placeholder="Tags (Enter drücken)"
                                  value={currentTagInputs[uploadFile.id] || ''}
                                  onChange={(e) => setCurrentTagInputs(prev => ({
                                    ...prev,
                                    [uploadFile.id]: e.target.value
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const currentValue = (currentTagInputs[uploadFile.id] || '').trim();
                                      if (currentValue) {
                                        // Add semicolon separator if there's already content
                                        const existingTags = uploadFile.tags.trim();
                                        const newTagsValue = existingTags 
                                          ? `${existingTags};${currentValue}` 
                                          : currentValue;
                                        updateFileTags(uploadFile.id, newTagsValue);
                                        // Clear the current input
                                        setCurrentTagInputs(prev => ({
                                          ...prev,
                                          [uploadFile.id]: ''
                                        }));
                                      }
                                    }
                                  }}
                                  className="block w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                                {/* Display entered tags */}
                                {uploadFile.tags && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Eingegebene Tags:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {uploadFile.tags.split(';').map((tag, tagIndex) => {
                                        const trimmedTag = tag.trim();
                                        if (!trimmedTag) return null;
                                        return (
                                          <span
                                            key={tagIndex}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                          >
                                            {trimmedTag}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const tags = uploadFile.tags.split(';');
                                                tags.splice(tagIndex, 1);
                                                updateFileTags(uploadFile.id, tags.join(';'));
                                              }}
                                              className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Popular Tags Section */}
                                {!isLoadingTags && popularTags.length > 0 && (
                                  <div className="mt-3 p-3 bg-gray-50 dark:bg-[#181818] rounded-lg border">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                      Häufig verwendete Tags (klicken zum Hinzufügen):
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {popularTags.slice(0, 10).map(({ tag, count }) => {
                                        const existingTags = uploadFile.tags.split(';').map(t => t.trim());
                                        const isAlreadyAdded = existingTags.includes(tag);
                                        
                                        return (
                                          <button
                                            key={tag}
                                            type="button"
                                            disabled={isAlreadyAdded}
                                            onClick={() => addPopularTag(tag, uploadFile.id)}
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                              isAlreadyAdded
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer'
                                            }`}
                                            title={isAlreadyAdded ? 'Tag bereits hinzugefügt' : `${count}x verwendet - klicken zum Hinzufügen`}
                                          >
                                            {tag}
                                            <span className="ml-1 text-xs opacity-60">
                                              ({count})
                                            </span>
                                            {isAlreadyAdded && (
                                              <span className="ml-1">✓</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {popularTags.length > 10 && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        und {popularTags.length - 10} weitere...
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {isLoadingTags && (
                                  <div className="mt-3 p-3 bg-gray-50 dark:bg-[#181818] rounded-lg border">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Häufig verwendete Tags werden geladen...
                                    </p>
                                  </div>
                                )}
                              </div>
                              {uploadFile.uploading && (
                                <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                  Wird hochgeladen...
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeFile(uploadFile.id)}
                              disabled={uploadFile.uploading}
                              className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Entfernen"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
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
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Wird hochgeladen...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadFiles.length} Datei(en) hochladen
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Hinweise zu Schulungsdokumenten
                        </h5>
                        <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside space-y-1">
                          <li>Nach dem Upload können Sie Kategorien für bessere Organisation zuweisen</li>
                          <li>Das Abschlussdatum wird automatisch in der Schulungshistorie gespeichert</li>
                          <li>Dokumente sind für alle Teilnehmer der Schulung sichtbar</li>
                          <li>Verwenden Sie aussagekräftige Dateinamen und Beschreibungen</li>
                          <li>Tags helfen bei der Suche und Organisation - trennen Sie sie mit ';'</li>
                        </ul>
                      </div>
                    </div>
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
                    {pendingDocuments.length} Dokument(e) wurden hochgeladen, in der Datenbank gespeichert und mit der Schulung sowie dem Mitarbeiter verknüpft.
                    Die Schulung wurde als abgeschlossen markiert.
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
    </div>
  );
}