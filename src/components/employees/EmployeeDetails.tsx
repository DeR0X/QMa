import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Calendar, Mail, Phone, MapPin, Award, FileText,
  Download, Star, TrendingUp, DollarSign, BookOpen,
  Award as CertificateIcon, Target, Plus, X
} from 'lucide-react';
import { RootState } from '../../store';
import { hasHRPermissions } from '../../store/slices/authSlice';
import type { User, Qualification } from '../../types';
import { qualifications } from '../../data/mockData';
import { toast } from 'sonner';

interface Props {
  employee: User;
  onClose: () => void;
  onUpdate: (data: Partial<User>) => void;
  approvals: Array<{ trainingId: string; date: string; status: string }>;
  trainings: Array<{ id: string; title: string }>;
  handleApproveTraining: (trainingId: string) => void;
  handleRejectTraining: (trainingId: string) => void;
}

interface EmployeeQualification {
  id: string;
  employeeId: string;
  qualificationId: string;
  qualifiedFrom: string;
  toQualifyUntil: string;
  isQualifiedUntil: string;
}

export default function EmployeeDetails({ employee, onClose, onUpdate, approvals, trainings, handleApproveTraining, handleRejectTraining }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'qualifications' | 'documents' | 'approvals'>('info');
  const [showAddQualModal, setShowAddQualModal] = useState(false);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentUser);

  const tabs = [
    { id: 'info', label: 'Information' },
    { id: 'qualifications', label: 'Qualifikationen' },
    { id: 'documents', label: 'Documents' },
    ...(isHRAdmin ? [
      { id: 'approvals', label: 'Approvals' }
    ] : []),
  ].filter(Boolean) as Array<{ id: 'info' | 'qualifications' | 'documents' | 'approvals'; label: string }>;

  const handleAddQualification = (qualificationData: Omit<EmployeeQualification, 'id'>) => {
    // In a real app, this would make an API call
    toast.success('Qualifikation erfolgreich hinzugefügt');
    setShowAddQualModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#121212] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white dark:bg-[#121212] text-gray-400 hover:text-gray-500 dark:text-white dark:hover:text-gray-300 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-xl">
                  {employee.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {employee.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {employee.position} • {employee.department}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-6">
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {employee.email && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {employee.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )}

                {activeTab === 'qualifications' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Qualifikationen
                      </h4>
                      {isHRAdmin && (
                        <button
                          onClick={() => setShowAddQualModal(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a]"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Qualifikation hinzufügen
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {employee.qualifications.map(qualId => {
                        const qual = qualifications.find(q => q.id === qualId);
                        return qual && (
                          <div
                            key={qual.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#181818] rounded-lg"
                          >
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                {qual.name}
                              </h5>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {qual.description}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Aktiv
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium">Dokumente</h4>
                    {/* Add document details here */}
                  </div>
                )}

                {activeTab === 'approvals' && employee.role === 'supervisor' && (
                  <div className="space-y-4">
                    {approvals.map((approval) => {
                      const training = trainings.find(t => t.id === approval.trainingId);
                      return (
                        <div
                          key={approval.trainingId}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {training?.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Beantragt am {new Date(approval.date).toLocaleDateString()}
                            </p>
                          </div>
                          {approval.status === 'ausstehend' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveTraining(approval.trainingId)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                Genehmigen
                              </button>
                              <button
                                onClick={() => handleRejectTraining(approval.trainingId)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                              >
                                Ablehnen
                              </button>
                            </div>
                          )}
                          {approval.status !== 'ausstehend' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              approval.status === 'genehmigt'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {approval.status === 'genehmigt' ? 'Genehmigt' : 'Abgelehnt'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Qualification Modal */}
      {showAddQualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Qualifikation hinzufügen
              </h2>
              <button
                onClick={() => setShowAddQualModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddQualification({
                employeeId: employee.id,
                qualificationId: formData.get('qualificationId') as string,
                qualifiedFrom: formData.get('qualifiedFrom') as string,
                toQualifyUntil: formData.get('toQualifyUntil') as string,
                isQualifiedUntil: formData.get('isQualifiedUntil') as string,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Qualifikation
                  </label>
                  <select
                    name="qualificationId"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                  >
                    <option value="">Qualifikation auswählen</option>
                    {qualifications
                      .filter(qual => !employee.qualifications.includes(qual.id))
                      .map(qual => (
                        <option key={qual.id} value={qual.id}>
                          {qual.name}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Qualifiziert seit
                  </label>
                  <input
                    type="date"
                    name="qualifiedFrom"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Zu qualifizieren bis
                  </label>
                  <input
                    type="date"
                    name="toQualifyUntil"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Qualifiziert bis
                  </label>
                  <input
                    type="date"
                    name="isQualifiedUntil"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddQualModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700a dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
      )}
    </div>
  );
}