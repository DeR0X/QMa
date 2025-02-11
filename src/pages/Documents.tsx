import { useState } from 'react';
import { Calendar, Filter, Search, FileText, Users, GraduationCap, X, Upload, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { trainings } from '../data/mockData';
import { toast } from 'sonner';
import EnhancedDocumentUploader from '../components/documents/EnhancedDocumentUploader';
import DocumentViewer from '../components/documents/DocumentViewer';
import type { DocumentUploadFormData, TrainingDocument } from '../types';

// Beispiel-Dokumente mit PDF URLs
const employeeDocuments = [
  { 
    id: '1', 
    title: 'Arbeitsvertrag Vorlage', 
    category: 'Verträge', 
    date: '2024-03-15', 
    department: 'Personal',
    pdfUrl: 'https://example.com/docs/arbeitsvertrag.pdf'
  },
  { 
    id: '2', 
    title: 'Urlaubsantrag Formular', 
    category: 'Formulare', 
    date: '2024-03-14', 
    department: 'Personal',
    pdfUrl: 'https://example.com/docs/urlaubsantrag.pdf'
  },
  { 
    id: '3', 
    title: 'Gehaltsabrechnung Template', 
    category: 'Finanzen', 
    date: '2024-03-13', 
    department: 'Finanzen',
    pdfUrl: 'https://example.com/docs/gehaltsabrechnung.pdf'
  },
];

const trainingDocuments = [
  { 
    id: '1', 
    title: 'Sicherheitsunterweisung 2024', 
    category: 'Sicherheit', 
    date: '2024-03-15', 
    trainer: 'Max Mustermann',
    pdfUrl: 'https://example.com/docs/sicherheit.pdf'
  },
  { 
    id: '2', 
    title: 'IT-Grundlagen Handbuch', 
    category: 'IT', 
    date: '2024-03-14', 
    trainer: 'John Doe',
    pdfUrl: 'https://example.com/docs/it-grundlagen.pdf'
  },
  { 
    id: '3', 
    title: 'Qualitätsmanagement Richtlinien', 
    category: 'QM', 
    date: '2024-03-13', 
    trainer: 'Anna Schmidt',
    pdfUrl: 'https://example.com/docs/qm.pdf'
  },
];

interface Document {
  id: string;
  title: string;
  category: string;
  date: string;
  department?: string;
  trainer?: string;
  pdfUrl: string;
}

export default function Documents() {
  const [activeTab, setActiveTab] = useState<'employee' | 'training'>('employee');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter Funktionen
  const filteredEmployeeDocuments = employeeDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredTrainingDocuments = trainingDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.trainer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(new Set([
    ...employeeDocuments.map(doc => doc.category),
    ...trainingDocuments.map(doc => doc.category)
  ]));

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const handleUpload = (data: DocumentUploadFormData) => {
    console.log('Uploading document:', data);
    toast.success('Dokument erfolgreich hochgeladen');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dokumente
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Durchsuchen Sie Mitarbeiter- und Schulungsdokumente
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a]"
          >
            <Upload className="h-5 w-5 mr-2" />
            Dokument hochladen
          </button>
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('employee')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === 'employee'
              ? 'bg-primary text-white dark:bg-[#181818]'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          <Users className="h-5 w-5 mr-2" />
          Mitarbeiterdokumente
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === 'training'
              ? 'bg-primary text-white dark:bg-[#181818]'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          <GraduationCap className="h-5 w-5 mr-2" />
          Schulungsdokumente
        </button>
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Dokumente durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-[#181818] dark:text-white"
              >
                <option value="">Alle Kategorien</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dokumentenname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {activeTab === 'employee' ? 'Abteilung' : 'Trainer'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
              {(activeTab === 'employee' ? filteredEmployeeDocuments : filteredTrainingDocuments).map((doc) => (
                <tr 
                  key={doc.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {doc.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {doc.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {('department' in doc) ? doc.department : doc.trainer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(doc.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 w-full max-w-5xl h-[80vh] m-4 relative">
            <button
              onClick={() => setSelectedDocument(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedDocument.title}
            </h2>
            
            <div className="h-[calc(100%-6rem)] w-full">
              <iframe
                src={selectedDocument.pdfUrl}
                className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
                title={selectedDocument.title}
              />
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <EnhancedDocumentUploader
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}