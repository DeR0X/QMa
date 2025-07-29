import { useState, useMemo } from 'react';
import { Search, FileText, X, Upload, Plus, Download, Calendar, Users, Building2, Tag, Trash2, GraduationCap } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '../store';
import { useAllDocuments, useAllUnifiedDocuments, useDocumentInfo } from '../hooks/useDocuments';
import { useDocumentCategories } from '../hooks/useDocumentCategories';
import { useEmployees } from '../hooks/useEmployees';
import apiClient from '../services/apiClient';

export default function Documents() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const { data: allDocuments, isLoading: isLoadingDocuments } = useAllUnifiedDocuments();
  const { data: documentCategories, isLoading: isLoadingCategories } = useDocumentCategories();
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees( {limit: 1000});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentTag, setSelectedDocumentTag] = useState<string>('');
  const [documentSortBy, setDocumentSortBy] = useState<'name' | 'date'>('date');
  const [documentSortOrder, setDocumentSortOrder] = useState<'asc' | 'desc'>('desc');
  const [documentViewMode, setDocumentViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const { data: selectedDocumentInfo } = useDocumentInfo(selectedDocument?.DocumentID || 0);

  // Helper function to get employee name by ID
  const getEmployeeNameById = (uploadedById: string | number) => {
    if (!employees?.data || !uploadedById) return uploadedById;
    
    // Check if uploadedById is a number or numeric string
    const id = typeof uploadedById === 'string' ? parseInt(uploadedById) : uploadedById;
    if (isNaN(id)) return uploadedById;
    
    const employee = employees.data.find((emp: any) => emp.ID === id);
    console.log(employees );
    return employee ? employee.FullName : uploadedById;
  };

  // Get filtered and sorted documents
  const getFilteredAndSortedDocuments = () => {
    if (!allDocuments) return [];

    let filtered = allDocuments.filter(doc => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        doc.FileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.Description && doc.Description.toLowerCase().includes(searchTerm.toLowerCase()))

      // Tag filter
      const matchesTag = selectedDocumentTag === '' || 
        (doc.Tags && doc.Tags.split(';').map(tag => tag.trim()).includes(selectedDocumentTag));

      return matchesSearch && matchesTag;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (documentSortBy) {
        case 'name':
          comparison = a.FileName.localeCompare(b.FileName);
          break;
        case 'date':
          comparison = new Date(a.UploadedAt).getTime() - new Date(b.UploadedAt).getTime();
          break;
      }

      return documentSortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  // Get all unique tags for filter options
  const getDocumentFilterOptions = () => {
    if (!allDocuments) return { tags: [] };

    const tags = new Set<string>();

    allDocuments.forEach(doc => {
      if (doc.Tags) {
        doc.Tags.split(';').forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag) tags.add(trimmedTag);
        });
      }
    });

    return {
      tags: Array.from(tags).sort()
    };
  };

  // Helper functions for UI
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return '📄';
    if (['doc', 'docx'].includes(extension || '')) return '📝';
    if (['xls', 'xlsx'].includes(extension || '')) return '📊';
    if (['ppt', 'pptx'].includes(extension || '')) return '📽️';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return '🖼️';
    return '📎';
  };

  const formatUploadDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const isPDFDocument = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const handleDocumentPreview = (document: any) => {
    setSelectedDocument(document);
    setShowDocumentPreview(true);
  };

  if (isLoadingDocuments || isLoadingCategories || isLoadingEmployees) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Dokumente werden geladen...
        </p>
      </div>
    );
  }

  const filteredDocuments = getFilteredAndSortedDocuments();
  const filterOptions = getDocumentFilterOptions();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dokumente
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Durchsuchen Sie alle Dokumente in der Q-Matrix
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Filter und Suche
            </h5>
            
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Dokumente durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              {/* Tag Filter */}
              <div className="w-full lg:w-56">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tag
                </label>
                <select
                  value={selectedDocumentTag}
                  onChange={(e) => setSelectedDocumentTag(e.target.value)}
                  className="block w-full py-2 px-3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#121212] dark:text-white transition-colors"
                >
                  <option value="">Alle Tags</option>
                  {filterOptions.tags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Sort and View Options */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Sort Options */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Sortieren:
                  </label>
                  <select
                    value={documentSortBy}
                    onChange={(e) => setDocumentSortBy(e.target.value as 'name' | 'date')}
                    className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white py-2 px-3"
                  >
                    <option value="date">Nach Datum</option>
                    <option value="name">Nach Name</option>
                  </select>
                  <button
                    onClick={() => setDocumentSortOrder(documentSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
                    title={`Sortierung: ${documentSortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}`}
                  >
                    {documentSortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* Results Summary */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {filteredDocuments.length} von {allDocuments?.length || 0} Dokumenten
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Reset Filter Button */}
                {(searchTerm || selectedDocumentTag) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDocumentTag('');
                    }}
                    className="text-sm text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Filter zurücksetzen
                  </button>
                )}

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setDocumentViewMode('grid')}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 ${
                      documentViewMode === 'grid'
                        ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                        : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setDocumentViewMode('list')}
                    className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 ${
                      documentViewMode === 'list'
                        ? 'bg-primary text-white dark:bg-gray-800 dark:text-gray-200'
                        : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                    }`}
                  >
                    Liste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Display */}
        <div className="p-6">
          {filteredDocuments.length > 0 ? (
            documentViewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredDocuments.map(document => (
                                    <div key={`${document.DocumentType}-${document.DocumentID}`} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">
                        {getFileIcon(document.FileName)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isPDFDocument(document.FileName) && (
                          <button
                            onClick={() => handleDocumentPreview(document)}
                            className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Vorschau"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`${apiClient.getBaseUrl()}/document-download/${document.DocumentID}`, '_blank')}
                          className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Herunterladen"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-relaxed">
                      {document.FileName}
                    </h4>

                    <div className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-2" />
                        <span>{formatUploadDate(document.UploadedAt)}</span>
                      </div>
                                              <div className="flex items-center">
                          <Users className="h-3 w-3 mr-2" />
                          <span>Hochgeladen von: {getEmployeeNameById(document.UploadedBy)}</span>
                        </div>
                        {document.DocumentType === 'employee' && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-2" />
                            <span>Für: {document.FullName}</span>
                          </div>
                        )}
                        {document.DocumentType === 'training' && document.TrainingName && (
                          <div className="flex items-center">
                            <GraduationCap className="h-3 w-3 mr-2" />
                            <span>Schulung: {document.TrainingName}</span>
                          </div>
                        )}
                    </div>

                    {document.Description && (
                      <div className="mt-4 bg-gray-50 dark:bg-[#181818] rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          <span className="font-medium">Beschreibung:</span> {document.Description}
                        </p>
                      </div>
                    )}

                    {document.Tags && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {document.Tags.split(';').map((tag: string) => tag.trim()).filter((tag: string) => tag).slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {document.Tags.split(';').length > 3 && (
                          <span className="text-xs text-gray-400 px-2 py-1">
                            +{document.Tags.split(';').length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                      {filteredDocuments.map(document => (
                                      <div key={`${document.DocumentType}-${document.DocumentID}`} className="p-6 hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="text-3xl">
                            {getFileIcon(document.FileName)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {document.FileName}
                            </h4>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-6">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatUploadDate(document.UploadedAt)}
                              </span>
                                                                              <span className="flex items-center">
                                                  <Users className="h-3 w-3 mr-1" />
                                                  {getEmployeeNameById(document.UploadedBy)}
                                                </span>
                                                {document.DocumentType === 'employee' && (
                                                  <span className="flex items-center">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {document.FullName}
                                                  </span>
                                                )}
                                                {document.DocumentType === 'training' && document.TrainingName && (
                                                  <span className="flex items-center">
                                                    <GraduationCap className="h-3 w-3 mr-1" />
                                                    Schulung: {document.TrainingName}
                                                  </span>
                                                )}
                            </div>
                            
                            {document.Description && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-2">
                                <span className="font-medium">Beschreibung:</span> {document.Description}
                              </p>
                            )}

                            {document.Tags && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {document.Tags.split(';').map((tag: string) => tag.trim()).filter((tag: string) => tag).slice(0, 5).map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-6">
                          {isPDFDocument(document.FileName) && (
                            <button
                              onClick={() => handleDocumentPreview(document)}
                              className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Vorschau"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          <button 
                            onClick={() => window.open(`${apiClient.getBaseUrl()}/document-download/${document.DocumentID}`, '_blank')}
                            className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Herunterladen"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* No Results */
            <div className="text-center py-16">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Keine Dokumente gefunden
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showDocumentPreview && selectedDocument && (
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-[#121212] rounded-lg w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {selectedDocumentInfo?.FileName || selectedDocument.FileName}
                </h2>
                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatUploadDate(selectedDocumentInfo?.UploadedAt || selectedDocument.UploadedAt)}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {getEmployeeNameById(selectedDocumentInfo?.UploadedBy || selectedDocument.UploadedBy)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={`${apiClient.getBaseUrl()}/document-download/${selectedDocument.DocumentID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Dokument herunterladen"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Herunterladen
                </a>
                <button
                  onClick={() => setShowDocumentPreview(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Description */}
            {(selectedDocumentInfo?.Description || selectedDocument.Description) && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-[#181818] border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Beschreibung:</strong> {selectedDocumentInfo?.Description || selectedDocument.Description}
                </p>
              </div>
            )}

            {/* Tags */}
            {(selectedDocumentInfo?.Tags || selectedDocument.Tags) && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-[#181818] border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Tags:</span>
                  {(selectedDocumentInfo?.Tags || selectedDocument.Tags).split(';').map((tag: string) => tag.trim()).filter((tag: string) => tag).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Content */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-900">
              {isPDFDocument(selectedDocument.FileName) ? (
                <iframe
                  src={`${apiClient.getBaseUrl()}/document-view/${selectedDocument.DocumentID}?`}
                  className="w-full h-full border-0"
                  title={selectedDocument.FileName}
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {getFileIcon(selectedDocument.FileName)}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Vorschau nicht verfügbar
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Für diesen Dateityp ist keine Vorschau verfügbar.
                    </p>
                    <a
                      href={`${apiClient.getBaseUrl()}/document-download/${selectedDocument.DocumentID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white dark:bg-blue-600 dark:text-white rounded-lg hover:bg-primary/90 dark:hover:bg-blue-500 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Dokument herunterladen
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}