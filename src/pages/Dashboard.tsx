import { useSelector } from 'react-redux';
import { 
  GraduationCap, 
  Calendar, 
  AlertTriangle, 
  BookOpen,
  Award,
  X,
  CheckCircle,
  CalendarCheck
} from 'lucide-react';
import { RootState } from '../store';
import { trainings, bookings, qualifications } from '../data/mockData';
import { formatDate, calculateExpirationDate, isExpiringSoon } from '../lib/utils';
import { useState, useEffect } from 'react';
import type { Qualification } from '../types';
import { sendQualificationExpiryNotification } from '../lib/notifications';

export default function Dashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);

  useEffect(() => {
    if (user) {
      // Check for expiring qualifications and send notifications
      const userQuals = qualifications.filter(qual => user.qualifications.includes(qual.id));
      userQuals.forEach(qual => {
        const lastTraining = bookings
          .filter(b => b.userId === user.id && b.status === 'abgeschlossen')
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

        if (lastTraining?.completedAt) {
          const expirationDate = calculateExpirationDate(lastTraining.completedAt, qual.validityPeriod);
          if (isExpiringSoon(expirationDate)) {
            const daysUntilExpiry = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            sendQualificationExpiryNotification(user, qual.name, daysUntilExpiry);
          }
        }
      });
    }
  }, [user]);

  if (!user) return null;

  const userBookings = bookings.filter(booking => booking.userId === user.id);
  const userTrainings = trainings.filter(training => user.trainings.includes(training.id));
  const userQualifications = qualifications.filter(qual => user.qualifications.includes(qual.id));

  // Calculate expiring qualifications (2 months warning)
  const expiringQualifications = userQualifications.filter(qual => {
    const lastTraining = userBookings
      .filter(b => b.status === 'abgeschlossen' && trainings.find(t => t.id === b.trainingId)?.id)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    if (!lastTraining?.completedAt) return false;

    const expirationDate = calculateExpirationDate(lastTraining.completedAt, qual.validityPeriod);
    return isExpiringSoon(expirationDate);
  });

  const pendingBookings = userBookings.filter(b => b.status === 'ausstehend');
  const upcomingTrainings = userBookings.filter(b => {
    const session = trainings
      .find(t => t.id === b.trainingId)
      ?.sessions.find(s => s.id === b.sessionId);
    return session && new Date(session.date) > new Date() && b.status === 'genehmigt';
  });

  const stats = [
    { 
      name: 'Abgeschlossen Schulungen', 
      value: userBookings.filter(b => b.status === 'abgeschlossen').length,
      icon: CheckCircle 
    },
    { 
      name: 'Genehmigte Schulungen', 
      value: userBookings.filter(b => b.status === 'genehmigt').length,
      icon: CalendarCheck 
    },
    { 
      name: 'Verfügbare Schulungen', 
      value: trainings.length - userTrainings.length,
      icon: BookOpen 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Willkommen zurück, {user.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ihre Schulungsübersicht und bevorstehende Sitzungen
          </p>
        </div>
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>

      {expiringQualifications.length > 0 && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Aufmerksamkeit erforderlich
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Die folgenden Qualifikationen laufen bald ab:</p>
                <ul className="list-disc list-inside mt-1">
                  {expiringQualifications.map(qual => (
                    <li key={qual.id}>{qual.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] p-6 shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Bevorstehende Schulungen
            </h2>
            <div className="mt-6 flow-root">
              {upcomingTrainings.length > 0 ? (
                <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingTrainings.map((booking) => {
                    const training = trainings.find(t => t.id === booking.trainingId);
                    const session = training?.sessions.find(s => s.id === booking.sessionId);
                    if (!training || !session) return null;

                    return (
                      <li key={booking.id} className="py-5">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {training.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(session.date)} at {session.location}
                            </p>
                          </div>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Bestätigt
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Keine bevorstehenden Schulungen geplant
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Ihre Qualifikationen
            </h2>
            <div className="mt-6 space-y-4">
              {userQualifications.map((qual) => {
                const lastTraining = userBookings
                  .filter(b => b.status === 'abgeschlossen' && trainings
                    .find(t => t.id === b.trainingId)?.id)
                  .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

                const expirationDate = lastTraining?.completedAt
                  ? calculateExpirationDate(lastTraining.completedAt, qual.validityPeriod)
                  : null;

                return (
                  <div key={qual.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary"
                        onClick={() => setSelectedQual(qual)}
                      >
                        {qual.name}
                      </h3>
                      {expirationDate && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Gültig bis {formatDate(expirationDate)}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expirationDate && expirationDate > new Date()
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {expirationDate && expirationDate > new Date() ? 'Aktiv' : 'Abgelaufen'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedQual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full m-4 relative">
            <button
              onClick={() => setSelectedQual(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedQual.name}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300">
              {selectedQual.description}
            </p>
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Gültigkeitsdauer: {selectedQual.validityPeriod} Monate</p>
              <p className="mt-2">Erforderliche Schulungen:</p>
              <ul className="list-disc list-inside mt-1">
                {selectedQual.requiredTrainings.map(trainingId => {
                  const training = trainings.find(t => t.id === trainingId);
                  return training && (
                    <li key={trainingId}>{training.title}</li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}