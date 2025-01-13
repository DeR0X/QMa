import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Calendar, Mail, Phone, MapPin, Award, FileText,
  Download, Star, TrendingUp, DollarSign, BookOpen,
  Award as CertificateIcon, Target
} from 'lucide-react';
import { RootState } from '../../store';
import { hasHRPermissions } from '../../store/slices/authSlice';
import type { User, PerformanceReview, Certification } from '../../types';

interface Props {
  employee: User;
  onClose: () => void;
  onUpdate: (data: Partial<User>) => void;
  approvals: Array<{ trainingId: string; date: string; status: string }>;
  trainings: Array<{ id: string; title: string }>;
  handleApproveTraining: (trainingId: string) => void;
  handleRejectTraining: (trainingId: string) => void;
}

export default function EmployeeDetails({ employee, onClose, onUpdate, approvals, trainings, handleApproveTraining, handleRejectTraining }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'performance' | 'compensation' | 'development' | 'documents' | 'approvals'>('info');
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentUser);

  const tabs = [
    { id: 'info', label: 'Information' },
    { id: 'performance', label: 'Performance' },
    { id: 'documents', label: 'Documents' },
    ...(isHRAdmin ? [
      { id: 'compensation', label: 'Vergütung' },
      { id: 'development', label: 'Entwicklung' }
    ] : []),
    employee.role === 'supervisor' && { id: 'approvals', label: 'Genehmigungen' },
  ].filter(Boolean) as Array<{ id: 'info' | 'performance' | 'compensation' | 'development' | 'documents' | 'approvals'; label: string }>;

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
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {employee.email}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        Beigetreten {new Date(employee.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Fähigkeiten
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {employee.skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Overall Rating
                      </h4>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                          {employee.performance.rating}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          Last reviewed on {new Date(employee.performance.lastReview).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'compensation' && isHRAdmin && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vergütungsdetails</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Gehaltsstufe</label>
                        <input
                          type="text"
                          value={employee.compensation?.salaryGrade || ''}
                          onChange={(e) => onUpdate({
                            compensation: {
                              ...employee.compensation,
                              salaryGrade: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'development' && isHRAdmin && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Karriereentwicklung</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Entwicklungspfad</label>
                        <input
                          type="text"
                          value={employee.careerDevelopment?.currentPath || ''}
                          onChange={(e) => onUpdate({
                            careerDevelopment: {
                              ...employee.careerDevelopment,
                              currentPath: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300"
                        />
                      </div>
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
    </div>
  );
}
