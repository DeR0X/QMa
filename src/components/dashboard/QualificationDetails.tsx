import { X } from 'lucide-react';
import type { Qualification } from '../../types';

interface Props {
  qualification: Qualification;
  onClose: () => void;
}

export default function QualificationDetails({ qualification, onClose }: Props) {
  const getQualificationTypeBadge = (type: string) => {
    const styles = {
      Pflicht: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      Job: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      Zusatz: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };

    const labels = {
      Pflicht: 'Pflichtqualifikation',
      Job: 'Positionsqualifikation',
      Zusatz: 'Zusatzfunktion'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const getExpiryText = () => {
    if (qualification.validityInMonth >= 999) {
      return "Diese Qualifikation läuft nie ab";
    }
    if (qualification.expireInDays) {
      return `Läuft in ${qualification.expireInDays} Tagen ab`;
    }
    return "Ablaufdatum nicht verfügbar";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 w-full max-w-md sm:max-w-lg md:max-w-xl m-4 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            {qualification.name}
          </h2>
          {qualification.herkunft && getQualificationTypeBadge(qualification.herkunft)}
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {qualification.description}
        </p>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <p>Gültigkeitsdauer: {qualification.validityInMonth >= 999 ? 'Läuft nie ab' : `${qualification.validityInMonth} Monate`}</p>
          <p>{getExpiryText()}</p>
          {qualification.isMandatory && (
            <p className="text-purple-600 dark:text-purple-400">Pflichtqualifikation</p>
          )}
        </div>
      </div>
    </div>
  );
}