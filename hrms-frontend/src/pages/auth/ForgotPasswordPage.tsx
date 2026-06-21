/**
 * Forgot Password Page
 * User enters email to receive a password reset link.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch { /* always show success to prevent email enumeration */ }
    finally { setLoading(false); setSent(true); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#0f172a] rounded-lg mx-auto flex items-center justify-center mb-3">
            <span className="text-white font-extrabold text-sm">FPT</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Mot de passe oublie</h2>
          <p className="text-sm text-gray-500 mt-1">Entrez votre email pour recevoir un lien de reinitialisation.</p>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700">Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.</p>
            <Link to="/login" className="inline-block mt-3 text-sm text-blue-600 hover:underline">Retour a la connexion</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Adresse email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0f172a]" placeholder="nom@fpt.ac.ma" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50">
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            <p className="text-center text-xs text-gray-400">
              <Link to="/login" className="text-blue-600 hover:underline">Retour a la connexion</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
