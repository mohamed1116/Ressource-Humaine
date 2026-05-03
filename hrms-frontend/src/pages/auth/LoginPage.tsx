/**
 * Login Page
 * Professional institutional login screen.
 * Dark navy + white. No gradients or flashy elements.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#0f172a] text-white flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
              <span className="text-[#0f172a] font-extrabold text-sm">FPT</span>
            </div>
            <div>
              <p className="text-sm font-semibold">SGRH</p>
              <p className="text-xs text-slate-400">Systeme de Gestion RH</p>
            </div>
          </div>
          <h1 className="text-2xl font-semibold leading-snug">
            Systeme de Gestion des<br />Ressources Humaines
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">
            Plateforme de gestion administrative pour la<br />
            Faculte Polydisciplinaire de Taroudant.<br />
            Demandes d'attestations, gestion du personnel<br />
            et suivi administratif.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Universite Ibn Zohr &middot; Faculte Polydisciplinaire de Taroudant
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-12 h-12 bg-[#0f172a] rounded mx-auto flex items-center justify-center mb-3">
              <span className="text-white font-extrabold text-sm">FPT</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">SGRH - Faculte Polydisciplinaire</p>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-1">Connexion</h2>
          <p className="text-sm text-gray-500 mb-6">Entrez vos identifiants pour acceder au systeme.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0f172a] focus:border-[#0f172a] outline-none bg-white"
                placeholder="nom@fpt.ac.ma"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0f172a] focus:border-[#0f172a] outline-none bg-white"
                placeholder="Votre mot de passe"
                required
              />
              <div className="text-right mt-1">
                <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">Mot de passe oublie ?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] transition-colors disabled:opacity-50"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Universite Ibn Zohr &middot; FPT Taroudant
          </p>
        </div>
      </div>
    </div>
  );
}
