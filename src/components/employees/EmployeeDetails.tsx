import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, Mail, Phone, MapPin, Award,
  FileText, Download, Star, TrendingUp,
  DollarSign, BookOpen, Award as CertificateIcon,
  Target, Plus, X, Clock, AlertCircle,
  GraduationCap, CheckCircle, Users as UsersIcon,
  Calendar, Timer, BookOpen as BookOpenIcon,
  Tag, Building2
} from 'lucide-react';
import { RootState } from '../../store';
import { hasHRPermissions } from '../../store/slices/authSlice';
import type { Employee, Qualification } from '../../types';
import { qualifications, employeeQualifications, trainings, departments, jobTitles } from '../../data/mockData';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';

interface Props {
  employee: Employee;
  onClose: () => void;
  onUpdate: (data: Partial<Employee>) => void;
  approvals: Array<{ trainingId: string; date: string; status: string }>;
  trainings: Array<{ id: string; title: string }>;
  handleApproveTraining: (trainingId: string) => void;
  handleRejectTraining: (trainingId: string) => void;
}

export default function EmployeeDetails({ 
  employee, 
  onClose, 
  onUpdate, 
  approvals, 
  trainings: employeeTrainings, 
  handleApproveTraining, 
  handleRejectTraining 
}: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'qualifications' | 'documents' | 'approvals' | 'trainer'>('info');
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>(employee.trainerFor || []);
  const [isTrainer, setIsTrainer] = useState(employee.isTrainer || false);
  const [localEmployee, setLocalEmployee] = useState(employee);
  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Keine Abteilung';
    const department = departments.find(d => d.id === departmentId.toString());
    return department ? department.department : departmentId.toString();
  };

  const getJobTitle = (jobTitleId: number | null) => {
    if (!jobTitleId) return 'Keine Position';
    const jobTitle = jobTitles.find(jt => jt.id === jobTitleId.toString());
    return jobTitle ? jobTitle.jobTitle : jobTitleId.toString();
  };

  // Get all qualifications from current and additional positions
  const getEmployeeQualifications = () => {
    const currentJobTitle = jobTitles.find(jt => jt.id === localEmployee.JobTitleID?.toString());
    const additionalQuals = localEmployee.additionalPositions?.flatMap(posId => {
      const jobTitle = jobTitles.find(jt => jt.id === posId);
      return jobTitle ? jobTitle.qualificationIDs : [];
    }) || [];
    
    return [...(currentJobTitle?.qualificationIDs || []), ...additionalQuals];
  };

  const tabs = [
    { id: 'info', label: 'Information' },
    { id: 'qualifications', label: 'Qualifikationen' },
    { id: 'documents', label: 'Documents' },
    ...(isHRAdmin ? [
      { id: 'approvals', label: 'Genehmigungen' },
      { id: 'trainer', label: 'Trainer-Status' }
    ] : []),
  ].filter(Boolean) as Array<{ id: 'info' | 'qualifications' | 'documents' | 'approvals' | 'trainer'; label: string }>;

  const handleUpdatePosition = (jobTitleId: string, isAdditional: boolean = false) => {
    let updatedEmployee;
    
    if (isAdditional) {
      // Add as additional position
      const additionalPositions = [...(localEmployee.additionalPositions || []), jobTitleId];
      updatedEmployee = {
        ...localEmployee,
        additionalPositions
      };
      toast.success('Zusätzliche Position erfolgreich hinzugefügt');
    } else {
      // Update main position
      updatedEmployee = {
        ...localEmployee,
        JobTitleID: parseInt(jobTitleId)
      };
      toast.success('Hauptposition erfolgreich aktualisiert');
    }
    
    setLocalEmployee(updatedEmployee);
    onUpdate(updatedEmployee);
    setShowPositionModal(false);
  };

  const handleRemoveAdditionalPosition = (jobTitleId: string) => {
    const additionalPositions = localEmployee.additionalPositions?.filter(id => id !== jobTitleId) || [];
    const updatedEmployee = {
      ...localEmployee,
      additionalPositions
    };
    setLocalEmployee(updatedEmployee);
    onUpdate(updatedEmployee);
    toast.success('Zusätzliche Position erfolgreich entfernt');
  };

  const employeeQualificationIds = getEmployeeQualifications();

  const getQualificationStatus = (qualId: string) => {
    const employeeQual = employeeQualifications.find(
      eq => eq.employeeID === localEmployee.ID.toString() && eq.qualificationID === qualId
    );

    if (!employeeQual) return 'inactive';

    const expiryDate = new Date(employeeQual.isQualifiedUntil || Date.now());
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

  const handleTrainerStatusChange = (checked: boolean) => {
    setIsTrainer(checked);
    if (!checked) {
      setSelectedTrainings([]);
    }
    const updatedEmployee = {
      ...localEmployee,
      isTrainer: checked,
      trainerFor: checked ? selectedTrainings : []
    };
    setLocalEmployee(updatedEmployee);
    onUpdate(updatedEmployee);
  };

  const handleTrainingSelection = (trainingId: string) => {
    const newSelectedTrainings = selectedTrainings.includes(trainingId)
      ? selectedTrainings.filter(id => id !== trainingId)
      : [...selectedTrainings, trainingId];
    
    setSelectedTrainings(newSelectedTrainings);
    const updatedEmployee = {
      ...localEmployee,
      trainerFor: newSelectedTrainings
    };
    setLocalEmployee(updatedEmployee);
    onUpdate(updatedEmployee);
  };

  // Get all qualifications
  const userQualifications = qualifications.filter(qual => 
    employeeQualificationIds.includes(qual.id)
  );

  // Get available job titles (excluding current and additional positions)
  const availableJobTitles = jobTitles.filter(jt => 
    jt.id !== localEmployee.JobTitleID?.toString() && 
    !localEmployee.additionalPositions?.includes(jt.id)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
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
                  {localEmployee.FullName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {localEmployee.FullName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getJobTitle(localEmployee.JobTitleID)} • {getDepartmentName(localEmployee.DepartmentID)}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <nav className="flex space-x-8">
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
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {localEmployee.eMail && (
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            {localEmployee.eMail}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          Personal-Nr.: {localEmployee.StaffNumber}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          Abteilung: {getDepartmentName(localEmployee.DepartmentID)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          Position: {getJobTitle(localEmployee.JobTitleID)}
                        </span>
                      </div>
                    </div>
                    {localEmployee.additionalPositions && localEmployee.additionalPositions.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Zusätzliche Positionen
                        </h4>
                        <div className="space-y-4">
                          {localEmployee.additionalPositions.map((posId) => (
                            <div key={posId} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Award className="h-5 w-5 text-gray-400" />
                                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                  {getJobTitle(parseInt(posId))}
                                </span>
                              </div>
                              {isHRAdmin && (
                                <button
                                  onClick={() => handleRemoveAdditionalPosition(posId)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'qualifications' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Qualifikationen
                      </h4>
                      {isHRAdmin && (
                        <button
                          onClick={() => setShowPositionModal(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a]"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Position hinzufügen
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {userQualifications.map(qual => {
                        const employeeQual = employeeQualifications.find(
                          eq => eq.employeeID === localEmployee.ID.toString() && eq.qualificationID === qual.id
                        );
                        const status = getQualificationStatus(qual.id);

                        return (
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
                                    Gültig bis: {employeeQual.isQualifiedUntil ? formatDate(employeeQual.isQualifiedUntil) : "Nicht verfügbar"}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
                                {getStatusText(status)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {userQualifications.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                          Keine Qualifikationen vorhanden
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium">Dokumente</h4>
                    {/* Add document details here */}
                  </div>
                )}

                {activeTab === 'approvals' && localEmployee.role === 'supervisor' && (
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

                {activeTab === 'trainer' && isHRAdmin && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Trainer-Verwaltung
                      </h4>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isTrainer}
                          onChange={(e) => handleTrainerStatusChange(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Als Trainer aktivieren
                        </span>
                      </label>
                    </div>

                    {isTrainer && (
                      <div className="space-y-6">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Schulungen, die dieser Trainer durchführen kann:
                        </h5>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {trainings.map(training => (
                            <div
                              key={training.id}
                              className={`p-4 rounded-lg border transition-all ${
                                selectedTrainings.includes(training.id)
                                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 pt-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedTrainings.includes(training.id)}
                                    onChange={() => handleTrainingSelection(training.id)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {training.title}
                                    </p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      training.isMandatory
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                    }`}>
                                      {training.isMandatory ? 'Pflicht' : 'Optional'}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {training.description}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                                      <Timer className="h-4 w-4 mr-1" />
                                      {training.duration}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Position Modal */}
      {showPositionModal && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-end justify-center md:items-center">
          <div className="w-full md:max-w-md mx-4 transform transition-transform duration-300 ease-in-out">
            <div className="bg-white dark:bg-[#121212] rounded-t-xl md:rounded-xl p-4 max-h-[85vh] overflow-y-auto 
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-gray-100
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Position hinzufügen
                  </h2>
                  <button
                    onClick={() => setShowPositionModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {availableJobTitles.map((jobTitle) => (
                  <div
                    key={jobTitle.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {jobTitle.jobTitle}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {jobTitle.description}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Erforderliche Qualifikationen: {jobTitle.qualificationIDs.length}
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleUpdatePosition(jobTitle.id)}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a]"
                        >
                          Als Hauptposition
                        </button>
                        <button
                          onClick={() => handleUpdatePosition(jobTitle.id, true)}
                          className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/10 dark:hover:bg-primary/5"
                        >
                          Als Zusatzposition
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {availableJobTitles.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Keine weiteren Positionen verfügbar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}