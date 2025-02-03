import { useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import type { TrainingDocument } from '../../types';

interface DocumentViewerProps {
  document: TrainingDocument;
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);

  const handleDownload = () => {
    // In a real app, this would trigger a download from your backend
    window.open(document.fileUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 w-full max-w-5xl h-[90vh] m-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {document.fileName}
            </h2>
            {document.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {document.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleDownload}
              className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"
              title="Herunterladen"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-100 dark:bg-[#181818] rounded-lg overflow-hidden">
          {document.fileType === 'application/pdf' ? (
            <iframe
              src={document.fileUrl}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              title={document.fileName}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Vorschau nicht verfügbar
                </p>
                <button
                  onClick={handleDownload}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Herunterladen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}