import { X } from 'lucide-react';
import { trainings } from '../../data/mockData';
import type { Qualification } from '../../types';

interface Props {
  qualification: Qualification;
  onClose: () => void;
}

export default function QualificationDetails({ qualification, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {qualification.name}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300">
          {qualification.description}
        </p>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Gültigkeitsdauer: {qualification.validityInMonth} Monate</p>
          <p className="mt-2">Erforderliche Schulungen:</p>
          <ul className="list-disc list-inside mt-1">
            {qualification.requiredTrainings.map(trainingId => {
              const training = trainings.find(t => t.id === trainingId);
              return training && (
                <li key={trainingId}>{training.title}</li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}