import { useEffect, useState } from 'react';
import { getPayslips } from '../../api/salary.api';

export default function SalaryListPage() {
  const [payslips, setPayslips] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayslips()
      .then(res => setPayslips(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Salary & Payslips</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Employee</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Period</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Base</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Gross</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Tax</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Net</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payslips.map((p) => (
                <tr key={p.id as string} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{p.employee_name as string}</td>
                  <td className="px-6 py-4">{p.month as number}/{p.year as number}</td>
                  <td className="px-6 py-4">{Number(p.base_salary).toLocaleString()} DH</td>
                  <td className="px-6 py-4">{Number(p.gross_salary).toLocaleString()} DH</td>
                  <td className="px-6 py-4">{Number(p.tax_amount).toLocaleString()} DH</td>
                  <td className="px-6 py-4 font-bold">{Number(p.net_salary).toLocaleString()} DH</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      p.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {p.status as string}
                    </span>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No payslips found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
