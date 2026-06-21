/**
 * User Profile Page
 * Shows personal info and allows editing phone/password.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, ROLE_LABELS } from '../../hooks/usePermissions';
import { changePassword } from '../../api/auth.api';

export default function ProfilePage() {
  const { user } = useAuth();
  const p = usePermissions();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(''); setPwdErr('');
    if (newPwd.length < 8) { setPwdErr('Le mot de passe doit contenir au moins 8 caracteres.'); return; }
    try {
      await changePassword({ old_password: oldPwd, new_password: newPwd });
      setPwdMsg('Mot de passe modifie avec succes.');
      setOldPwd(''); setNewPwd('');
    } catch { setPwdErr('Ancien mot de passe incorrect.'); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Mon profil</h1>

      {/* Personal info (read-only) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Informations personnelles</h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="Prenom" value={user?.first_name || ''} />
          <Field label="Nom" value={user?.last_name || ''} />
          <Field label="Email" value={user?.email || ''} />
          <Field label="Role" value={ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role || ''} />
          <Field label="Telephone" value={user?.phone || 'Non renseigne'} />
          <Field label="Identifiant" value={user?.username || ''} />
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Changer le mot de passe</h3>
        </div>
        <form onSubmit={handleChangePwd} className="p-6 space-y-4">
          {pwdMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded">{pwdMsg}</p>}
          {pwdErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{pwdErr}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ancien mot de passe</label>
            <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 border border-gray-100">{value}</p>
    </div>
  );
}
