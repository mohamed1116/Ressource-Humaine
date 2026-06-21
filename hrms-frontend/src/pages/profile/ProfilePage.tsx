import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, ROLE_LABELS } from '../../hooks/usePermissions';
import { changePassword } from '../../api/auth.api';
import { getMyProfile, uploadSignature, deleteSignature } from '../../api/employees.api';
import api from '../../api/axiosInstance';

export default function ProfilePage() {
  const { user } = useAuth();
  usePermissions();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  /* signature state */
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [sigUploading, setSigUploading] = useState(false);
  const [sigMsg, setSigMsg] = useState('');
  const [sigErr, setSigErr] = useState('');
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEmployee = user?.role && !['SUPER_ADMIN', 'STUDENT'].includes(user.role);

  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [arSaving, setArSaving] = useState(false);
  const [arMsg, setArMsg] = useState('');
  const [arErr, setArErr] = useState('');

  useEffect(() => {
    if (user) {
      setFirstNameAr((user as any).first_name_ar || '');
      setLastNameAr((user as any).last_name_ar || '');
    }
  }, [user]);

  const handleSaveArabicNames = async (e: React.FormEvent) => {
    e.preventDefault();
    setArSaving(true); setArMsg(''); setArErr('');
    try {
      await api.patch('/auth/profile/', { first_name_ar: firstNameAr, last_name_ar: lastNameAr });
      setArMsg('Noms en arabe enregistrés avec succès.');
    } catch { setArErr('Erreur lors de la sauvegarde.'); }
    finally { setArSaving(false); }
  };

  useEffect(() => {
    if (!isEmployee) return;
    getMyProfile()
      .then(r => {
        const sig = r.data?.signature;
        if (sig) setSignatureUrl(sig);
      })
      .catch(() => {});
  }, [isEmployee]);

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(''); setPwdErr('');
    if (newPwd.length < 8) { setPwdErr('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    try {
      await changePassword({ old_password: oldPwd, new_password: newPwd });
      setPwdMsg('Mot de passe modifié avec succès.');
      setOldPwd(''); setNewPwd('');
    } catch { setPwdErr('Ancien mot de passe incorrect.'); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setSigErr('Format non supporté. Utilisez PNG, JPG ou WEBP.'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSigErr('Fichier trop volumineux (max 10 MB).'); return;
    }
    setSigErr('');
    const reader = new FileReader();
    reader.onload = ev => setSigPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setSigUploading(true); setSigMsg(''); setSigErr('');
    try {
      const res = await uploadSignature(file);
      setSignatureUrl(res.data.signature_url);
      setSigPreview(null);
      setSigMsg('Signature enregistrée avec succès.');
      if (fileRef.current) fileRef.current.value = '';
    } catch { setSigErr('Erreur lors de l\'enregistrement.'); }
    finally { setSigUploading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer votre signature ?')) return;
    try {
      await deleteSignature();
      setSignatureUrl(null);
      setSigPreview(null);
      setSigMsg('Signature supprimée.');
    } catch { setSigErr('Erreur lors de la suppression.'); }
  };

  const cancelPreview = () => {
    setSigPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Mon profil</h1>

      {/* Personal info */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Informations personnelles</h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="Prénom" value={user?.first_name || ''} />
          <Field label="Nom" value={user?.last_name || ''} />
          <Field label="Email" value={user?.email || ''} />
          <Field label="Rôle" value={ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role || ''} />
          <Field label="Téléphone" value={user?.phone || 'Non renseigné'} />
          <Field label="Identifiant" value={user?.username || ''} />
        </div>
      </div>

      {/* Arabic names */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">الاسم بالعربية</h3>
          <p className="text-xs text-gray-400 mt-0.5">يُستخدم في الوثائق الرسمية باللغة العربية</p>
        </div>
        <form onSubmit={handleSaveArabicNames} className="p-6">
          {arMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded mb-4">{arMsg}</p>}
          {arErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{arErr}</p>}
          <div className="grid grid-cols-2 gap-4" dir="rtl">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم الأول</label>
              <input
                value={firstNameAr}
                onChange={e => setFirstNameAr(e.target.value)}
                placeholder="مثال: محمد"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">اسم العائلة</label>
              <input
                value={lastNameAr}
                onChange={e => setLastNameAr(e.target.value)}
                placeholder="مثال: العلوي"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" disabled={arSaving} className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
              {arSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Signature — only for employees (not SUPER_ADMIN, not STUDENT) */}
      {isEmployee && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Ma signature</h3>
            <p className="text-xs text-gray-400 mt-0.5">Utilisée pour signer vos attestations et documents officiels. Elle apparaîtra automatiquement sur tous vos documents générés.</p>
          </div>
          <div className="p-6">
            {sigMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded mb-4">{sigMsg}</p>}
            {sigErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{sigErr}</p>}

            {/* Current signature */}
            {signatureUrl && !sigPreview && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Signature actuelle :</p>
                <div className="inline-block border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <img
                    src={signatureUrl}
                    alt="Ma signature"
                    className="max-h-24 max-w-xs object-contain"
                  />
                </div>
                <button
                  onClick={handleDelete}
                  className="ml-3 text-xs text-red-500 hover:text-red-700 underline"
                >
                  Supprimer
                </button>
              </div>
            )}

            {/* Preview before upload */}
            {sigPreview && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Aperçu :</p>
                <div className="inline-block border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
                  <img src={sigPreview} alt="Aperçu" className="max-h-24 max-w-xs object-contain" />
                </div>
              </div>
            )}

            {/* Upload zone */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => { setSigMsg(''); setSigErr(''); fileRef.current?.click(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {signatureUrl ? 'Changer la signature' : 'Importer ma signature'}
              </button>

              {sigPreview && (
                <>
                  <button
                    onClick={handleUpload}
                    disabled={sigUploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50 flex items-center gap-2"
                  >
                    {sigUploading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {sigUploading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button onClick={cancelPreview} className="text-xs text-gray-400 hover:text-gray-600">
                    Annuler
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Formats acceptés : PNG, JPG, WEBP · Max 10 MB · Fond blanc recommandé</p>
          </div>
        </div>
      )}

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
            <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
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
