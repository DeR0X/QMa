import { Calendar, Filter } from 'lucide-react';
import { useSelector } from 'react-redux';
import { trainings } from '../data/mockData';

//

export default function Documents() { 

    return (
        <div className="space-y-6">

        
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              Mitarbeiter Dokumente
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hier finden Sie alle Dokumente, die für die Mitarbeiter relevant sind.
            </p>
            <div className="mt-6 flow-root">
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              Schulungs Dokumente
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hier finden Sie alle Dokumente, die für die Schulungen relevant sind.
            </p>
            <div className="mt-6 flow-root">
            </div>
          </div>
        </div>
      </div>
  

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Dokumente
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Hier finden Sie alle Dokumente, über die Sie Zugriff haben.
            </p>
          </div>
        </div>



        <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Suche nach Name, Abteilung oder Position..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Abteilung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
              <tr>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
        </div>
    )

}