/**
 * Leave Request Form
 * Allows any user to submit a leave request.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaveTypes, createLeaveRequest } from '../../api/leaves.api';

export default function LeaveRequestPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<Record<string, unknown>[]>([]);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getLeaveTypes().then(r => setTypes(r.data.results || r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createLeaveRequest({ leave_type: leaveType, start_date: startDate, end_date: endDate, reason });
      setSuccess(true);
      setTimeout(() => navigate('/leaves'), 2000);
    } catch { alert('Erreur lors de la soumission.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Demande soumise</h2>
        <p className="text-sm text-gray-500 mt-2">Votre demande de conge sera examinee.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Demande de conge</h1>
      <p className="text-sm text-gray-500 mb-6">Remplissez le formulaire pour soumettre votre demande.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type de conge</label>
          <select value={leaveType} onChange={e => setLeaveType(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none">
            <option value="">-- Selectionner --</option>
            {types.map(t => <option key={t.id as string} value={t.id as string}>{t.name as string}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date debut</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Motif</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none" placeholder="Raison de la demande..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
          <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
            {loading ? 'Envoi...' : 'Soumettre'}
          </button>
        </div>
      </form>
    </div>
  );
}
