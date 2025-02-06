import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Check } from 'lucide-react';
import { RootState } from '../../store';
import { markAsRead, clearNotifications } from '../../store/slices/notificationSlice';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const { employee } = useSelector((state: RootState) => state.auth);
  const notifications = useSelector((state: RootState) => 
    state.notifications.notifications.filter(n => n.userId === employee?.id)
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleClearAll = () => {
    if (employee) {
      dispatch(clearNotifications(employee.id));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-white dark:bg-[#121212] shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Benachrichtigungen
              </h3>
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Alle löschen
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Keine Benachrichtigungen
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-3 rounded-lg ${
                      notification.read
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notification.date).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}