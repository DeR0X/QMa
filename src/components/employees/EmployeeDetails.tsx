import { useState } from 'react';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  FileText,
  Download,
  Star,
  TrendingUp
} from 'lucide-react';
import type { Employee } from '../../types';

interface Props {
  employee: Employee;
  onClose: () => void;
}

export default function EmployeeDetails({ employee, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'performance' | 'documents'>('info');

  const tabs = [
    { id: 'info', label: 'Information' },
    { id: 'performance', label: 'Performance' },
    { id: 'documents', label: 'Documents' },
  ] as const;

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
                  {employee.name.split(' ').map((n) => n[0]).join('')}
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
                        Fähigkeite
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {employee.skills.map((skill) => (
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

                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    {employee.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                            {doc.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {doc.type.toUpperCase()}
                          </span>
                        </div>
                        <button className="text-primary hover:text-primary/90">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
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