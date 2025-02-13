import { X } from 'lucide-react';
import { trainings } from '../../data/mockData';
import type { Qualification } from '../../types';

interface Props {
  qualification: Qualification;
  onClose: () => void;
}

export default function QualificationDetails({ qualification, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 w-full max-w-md sm:max-w-lg md:max-w-xl m-4 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {qualification.name}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {qualification.description}
        </p>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Gültigkeitsdauer: {qualification.validityInMonth} Monate</p>
          <p className="mt-2">Erforderliche Schulungen:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {qualification.requiredTrainings.map(trainingId => {
              const training = trainings.find(t => t.id === trainingId);
              return training ? (
                <li key={trainingId} className="text-xs sm:text-sm">
                  {training.title}
                </li>
              ) : null;
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
