import { useEffect, useState } from 'react';
import { getAttendanceRecords, checkIn, checkOut } from '../../api/attendance.api';
import { useAuth } from '../../context/AuthContext';

export default function DailyAttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getAttendanceRecords({ date: today })
      .then(res => setRecords(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  const handleCheckIn = async () => {
    try {
      await checkIn();
      window.location.reload();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      window.location.reload();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || 'Check-out failed');
    }
  };

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    ON_LEAVE: 'bg-blue-100 text-blue-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    HALF_DAY: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Attendance - {today}</h1>
        {['PROFESSOR', 'STAFF'].includes(user?.role || '') && (
          <div className="flex gap-2">
            <button onClick={handleCheckIn} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              Check In
            </button>
            <button onClick={handleCheckOut} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              Check Out
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Employee</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Department</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Check In</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Check Out</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Late (min)</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.id as string} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{r.employee_name as string}</td>
                  <td className="px-6 py-4">{r.department_name as string}</td>
                  <td className="px-6 py-4">{(r.check_in as string) || '-'}</td>
                  <td className="px-6 py-4">{(r.check_out as string) || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status as string] || ''}`}>
                      {r.status as string}
                    </span>
                  </td>
                  <td className="px-6 py-4">{r.is_late ? r.late_minutes as number : '-'}</td>
                  <td className="px-6 py-4">{r.work_hours as string}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No attendance records for today.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
