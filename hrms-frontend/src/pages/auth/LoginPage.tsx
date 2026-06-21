// Login page - handles user authentication with email and password
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'SUPER_ADMIN' ? '/superadmin' : '/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Panneau gauche ── */}
      <div style={{
        width: '460px', flexShrink: 0,
        background: '#0f172a',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 44px',
      }}>
        {/* Logo + nom */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
            <div style={{
              width: 44, height: 44, background: '#fff', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, color: '#0f172a', letterSpacing: '-0.5px',
              flexShrink: 0,
            }}>FPT</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff' }}>SGRH</p>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Systeme de Gestion RH</p>
            </div>
          </div>

          <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            Systeme de Gestion des<br />Ressources Humaines
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
            Plateforme de gestion administrative pour la
            Faculte Polydisciplinaire de Taroudant.
            Demandes d'attestations, gestion du personnel
            et suivi administratif.
          </p>
        </div>

        {/* Pied de page gauche */}
        <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
          Universite Ibn Zohr · Faculte Polydisciplinaire de Taroudant
        </p>
      </div>

      {/* ── Panneau droit ── */}
      <div style={{
        flex: 1, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
            Connexion
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: 14, color: '#64748b' }}>
            Entrez vos identifiants pour acceder au systeme.
          </p>

          {error && (
            <div style={{
              marginBottom: 20, padding: '10px 14px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, fontSize: 13, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@fpt.ac.ma"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 14px', fontSize: 14,
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  background: '#f1f5f9', outline: 'none',
                  color: '#0f172a',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#0f172a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 14px', fontSize: 14,
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  background: '#f1f5f9', outline: 'none',
                  color: '#0f172a',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#0f172a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Mot de passe oublié */}
            <div style={{ textAlign: 'right', marginBottom: 28 }}>
              <a href="/forgot-password" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>
                Mot de passe oublie ?
              </a>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#475569' : '#0f172a',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Pied de page droit */}
          <p style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            Universite Ibn Zohr · FPT Taroudant
          </p>
        </div>
      </div>
    </div>
  );
}
