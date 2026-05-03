import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaveRequests, getLeaveBalances } from '../../api/leaves.api';

export default function MyLeavesPage() {
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);
  const [balances, setBalances] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLeaveRequests().then(res => setLeaves(res.data.results || res.data)),
      getLeaveBalances().then(res => setBalances(res.data.results || res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    DEPT_APPROVED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Leaves</h1>
        <Link to="/leaves/request" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + New Request
        </Link>
      </div>

      {/* Leave Balances */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {balances.map((b) => (
            <div key={b.id as string} className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">{b.leave_type_name as string}</p>
              <p className="text-2xl font-bold text-gray-900">{b.remaining_days as string}</p>
              <p className="text-xs text-gray-400">of {b.total_days as string} days</p>
            </div>
          ))}
        </div>
      )}

      {/* Leave Requests */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">From</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">To</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Days</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.map((leave) => (
                <tr key={leave.id as string} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{leave.leave_type_name as string}</td>
                  <td className="px-6 py-4">{leave.start_date as string}</td>
                  <td className="px-6 py-4">{leave.end_date as string}</td>
                  <td className="px-6 py-4">{leave.total_days as string}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[leave.status as string] || ''}`}>
                      {leave.status as string}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{(leave.created_at as string)?.slice(0, 10)}</td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No leave requests yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
