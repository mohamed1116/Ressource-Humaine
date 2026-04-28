import { useEffect, useState } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications.api';

export default function NotificationListPage() {
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    getNotifications()
      .then(res => setNotifications(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    fetchNotifications();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button onClick={handleMarkAllRead} className="text-sm text-blue-600 hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            No notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id as string}
              className={`bg-white rounded-lg border p-4 flex items-start justify-between ${
                !n.is_read ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div>
                <p className={`text-sm ${n.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                  {n.title as string}
                </p>
                <p className="text-xs text-gray-500 mt-1">{n.message as string}</p>
                <p className="text-xs text-gray-400 mt-2">{(n.created_at as string)?.slice(0, 16).replace('T', ' ')}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id as string)}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap ml-4"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
