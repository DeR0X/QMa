import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Calendar, Mail, Phone, MapPin, Award, FileText,
  Download, Star, TrendingUp, DollarSign, BookOpen,
  Award as CertificateIcon, Target, Plus, X,
  Clock, AlertCircle
} from 'lucide-react';
import { RootState } from '../../store';
import { hasHRPermissions } from '../../store/slices/authSlice';
import type { User, Qualification } from '../../types';
import { qualifications, employeeQualifications } from '../../data/mockData';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';

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

  const handleAddQualification = (qualificationId: string) => {
    const updatedQualifications = [...employee.qualifications, qualificationId];
    onUpdate({ qualifications: updatedQualifications });
    setShowAddQualModal(false);
  };

  const handleRemoveQualification = (qualificationId: string) => {
    const updatedQualifications = employee.qualifications.filter(id => id !== qualificationId);
    onUpdate({ qualifications: updatedQualifications });
  };

  const availableQualifications = qualifications.filter(
    qual => !employee.qualifications.includes(qual.id)
  );

  const getQualificationStatus = (qualId: string) => {
    const employeeQual = employeeQualifications.find(
      eq => eq.employeeId === employee.id && eq.qualificationId === qualId
    );

    if (!employeeQual) return 'inactive';

    const expiryDate = new Date(employeeQual.isQualifiedUntil);
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    if (expiryDate < today) return 'expired';
    if (expiryDate <= twoMonthsFromNow) return 'expiring';
    return 'active';
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'expiring':
        return 'Läuft bald ab';
      case 'expired':
        return 'Abgelaufen';
      default:
        return 'Inaktiv';
    }
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
                        const employeeQual = employeeQualifications.find(
                          eq => eq.employeeId === employee.id && eq.qualificationId === qualId
                        );
                        const status = getQualificationStatus(qualId);

                        return qual && (
                          <div
                            key={qual.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#181818] rounded-lg"
                          >
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                {qual.name}
                              </h5>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {qual.description}
                              </p>
                              {employeeQual && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Qualifiziert seit: {formatDate(employeeQual.qualifiedFrom)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Gültig bis: {formatDate(employeeQual.isQualifiedUntil)}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
                                {getStatusText(status)}
                              </span>
                              {isHRAdmin && (
                                <button
                                  onClick={() => handleRemoveQualification(qual.id)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              )}
                            </div>
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

            <div className="space-y-4">
              {availableQualifications.map(qual => (
                <div
                  key={qual.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleAddQualification(qual.id)}
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {qual.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {qual.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Gültigkeitsdauer: {qual.validityPeriod} Monate
                  </p>
                </div>
              ))}

              {availableQualifications.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Keine weiteren Qualifikationen verfügbar
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}