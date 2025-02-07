import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Filter, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, GraduationCap, Plus } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { employees, trainings, bookings } from '../data/mockData';
import { Training } from '../types';
import { formatDate, formatDuration } from '../lib/utils';
import { toast } from 'sonner';
import AddTrainingModal from '../components/trainings/AddTrainigModal';
import { hasHRPermissions } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/notificationSlice';

export default function Trainings() {
  const dispatch = useDispatch<AppDispatch>();
  const { employee } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showMandatoryOnly, setShowMandatoryOnly] = useState(false);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  if (!employee) return null;

  const isHR = hasHRPermissions(employee);
  const isSupervisor = employee.role === 'supervisor';
  const canCreateTraining = isHR || isSupervisor;

  const userBookings = bookings.filter(booking => booking.userId === employee.id);

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMandatory = showMandatoryOnly ? training.isMandatory : true;
    
    return matchesSearch && matchesMandatory;
  });

  const handleBookSession = async (training: Training, sessionId: string) => {
    const existingBooking = userBookings.find(
      b => b.trainingId === training.id && ['ausstehend', 'genehmigt'].includes(b.status)
    );

    if (existingBooking) {
      toast.error('Sie haben bereits eine Buchung für diese Schulung');
      return;
    }

    // In a real app, this would make an API call
    toast.success('Schulungssitzung erfolgreich gebucht! Warten auf Genehmigung.');

    // Notify supervisor/HR about the booking
    const supervisor = employees.find(e => e.id === employee.supervisorID);
    if (supervisor) {
      dispatch(addNotification({
        userId: supervisor.id,
        type: 'info',
        title: 'Neue Schulungsbuchung',
        message: `${employee.fullName} hat sich für die Schulung "${training.title}" angemeldet und wartet auf Genehmigung.`,
      }));
    }
  };

  const handleAddTraining = (newTraining: Omit<Training, 'id'> & { targetAudience?: string[] }) => {
    // In a real app, this would make an API call
    toast.success('Schulung erfolgreich erstellt');

    // Send notifications to relevant employees
    const affectedEmployees = employees.filter(emp => 
      newTraining.targetAudience?.includes(emp.departmentID) ||
      newTraining.isMandatory
    );

    affectedEmployees.forEach(employee => {
      dispatch(addNotification({
        userId: employee.id,
        type: 'info',
        title: 'Neue Schulung verfügbar',
        message: `Eine neue Schulung "${newTraining.title}" ist für Sie verfügbar. Schauen Sie sich die Details an und buchen Sie bei Interesse einen Termin.`,
      }));
    });

    setShowAddModal(false);
  };

  const getBookingStatus = (training: Training) => {
    const booking = userBookings.find(b => b.trainingId === training.id);
    if (!booking) return null;

    const statusColors = {
      ausstehend: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      genehmigt: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      abgelehnt: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      abgeschlossen: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    };

    const statusIcons = {
      ausstehend: AlertCircle,
      genehmigt: CheckCircle,
      abgelehnt: XCircle,
      abgeschlossen: CheckCircle,
    };

    const StatusIcon = statusIcons[booking.status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
        <StatusIcon className="w-4 h-4 mr-1" />
        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
      </span>
    );
  };

  // Mock training sessions
  const getTrainingSessions = (training: Training) => {
    const sessions = [
      {
        id: '1',
        date: '2024-04-15T09:00:00',
        location: 'Schulungsraum A',
        availableSpots: 10,
        trainer: 'Max Mustermann'
      },
      {
        id: '2',
        date: '2024-04-22T14:00:00',
        location: 'Schulungsraum B',
        availableSpots: 8,
        trainer: 'Anna Schmidt'
      },
      {
        id: '3',
        date: '2024-05-05T10:00:00',
        location: 'Online',
        availableSpots: 15,
        trainer: 'Thomas Weber'
      }
    ];

    return sessions;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Verfügbare Schulungen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Durchsuchen und buchen Sie Schulungen für Ihre berufliche Entwicklung
          </p>
        </div>
        <div className="flex items-center gap-4">
          {canCreateTraining && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neue Schulung
            </button>
          )}
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Schulungen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showMandatoryOnly}
                  onChange={(e) => setShowMandatoryOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Nur Pflichtschulungen</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6">
          {filteredTrainings.map((training) => (
            <div
              key={training.id}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {training.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {training.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {training.isMandatory && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        Pflichtschulung
                      </span>
                    )}
                    {getBookingStatus(training)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Dauer: {training.duration}
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Verfügbare Termine
                  </h4>
                  <div className="space-y-4">
                    {getTrainingSessions(training).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#181818] rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(session.date).toLocaleDateString('de-DE', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <MapPin className="h-4 w-4 mr-1" />
                              {session.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {session.trainer}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {session.availableSpots} Plätze verfügbar
                            </p>
                          </div>
                          <button
                            onClick={() => handleBookSession(training, session.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
                            disabled={!session.availableSpots}
                          >
                            Buchen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AddTrainingModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTraining}
          userDepartment={isSupervisor ? employee.departmentID : undefined}
        />
      )}
    </div>
  );
}