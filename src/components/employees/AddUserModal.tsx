import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Employee, Role } from '../../types';
import { itDepartments, manufacturingDepartments } from '../../data/departments';

interface Props {
  onClose: () => void;
  onAdd: (user: Omit<Employee, 'id' | 'isActive' | 'failedLoginAttempts'>) => void;
}

// Combine all departments
const allDepartments = [...itDepartments, ...manufacturingDepartments];

export default function AddUserModal({ onClose, onAdd }: Props) {
  const [formData, setFormData] = useState({
    personalNumber: '',
    email: '',
    name: '',
    role: 'employee' as Role,
    department: '',
    position: '',
    startDate: '',
    skills: [] as string[],
    performance: {
      rating: 0,
      lastReview: '',
    },
    trainings: [] as string[],
    qualifications: [] as string[],
    requiredQualifications: [] as string[],
  });

  // State for available positions based on selected department
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);

  // Update available positions when department changes
  useEffect(() => {
    if (formData.department) {
      const selectedDept = allDepartments.find(dept => dept.name === formData.department);
      if (selectedDept) {
        setAvailablePositions(selectedDept.positions);
        // Reset position if current position is not in new department
        if (!selectedDept.positions.includes(formData.position)) {
          setFormData(prev => ({ ...prev, position: '' }));
        }
      }
    } else {
      setAvailablePositions([]);
    }
  }, [formData.department]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEmployee: Omit<Employee, "id" | "isActive" | "failedLoginAttempts"> = {
      eMail: formData.email,
      role: formData.role,
      staffNumber: formData.personalNumber,
      firstName: formData.name,
      surName: '',
      fullName: formData.name,
      departmentID: formData.department,
      jobTitleID: formData.position,
      supervisorID: '',
      qualificationIDs: formData.qualifications,
      passwordHash: ''
    };

    onAdd(newEmployee);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Neuen Mitarbeiter hinzufügen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Personal Nummer
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              value={formData.personalNumber}
              onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rolle
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <option value="employee">Mitarbeiter</option>
              <option value="supervisor">Vorgesetzter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Abteilung
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="">Abteilung auswählen</option>
              {allDepartments.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Position
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              disabled={!formData.department}
            >
              <option value="">Position auswählen</option>
              {availablePositions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

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
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}