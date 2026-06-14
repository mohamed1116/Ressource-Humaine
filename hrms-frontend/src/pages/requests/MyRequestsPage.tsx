import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyRequests } from '../../api/requests.api';
import { downloadDocument, submitSignedDocument } from '../../api/certificates.api';
import { getMyProfile } from '../../api/employees.api';

const typeCfg: Record<string, { label: string; cls: string }> = {
  CERTIFICATE: { label: 'Attestation',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  FREE:        { label: 'Demande libre', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  LEAVE:       { label: 'Conge',         cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  MISSION:     { label: 'Mission',       cls: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const statusCfg: Record<string, { label: string; cls: string }> = {
  PENDING:           { label: 'En attente',        cls: 'text-amber-600 bg-amber-50' },
  PENDING_SIGNATURE: { label: 'Signature requise', cls: 'text-orange-600 bg-orange-50' },
  APPROVED:          { label: 'Approuvee',         cls: 'text-green-600 bg-green-50' },
  DEPT_APPROVED:     { label: 'Approuvee (Dept)',  cls: 'text-blue-600 bg-blue-50' },
  REJECTED:          { label: 'Rejetee',           cls: 'text-red-600 bg-red-50' },
  GENERATED:         { label: 'Generee',           cls: 'text-green-600 bg-green-50' },
  CANCELLED:         { label: 'Annulee',           cls: 'text-gray-500 bg-gray-50' },
};

export default function MyRequestsPage() {
  const [requests, setRequests]         = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('');
  const [signingRequest, setSigningRequest] = useState<Record<string, unknown> | null>(null);
  const [sigFile, setSigFile]           = useState<File | null>(null);
  const [sigUploading, setSigUploading] = useState(false);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [mySignatureUrl, setMySignatureUrl] = useState<string | null>(null);
  const [sigMode, setSigMode]           = useState<'draw' | 'upload'>('draw');
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isDrawing  = useRef(false);
  const fileRef    = useRef<HTMLInputElement>(null);

  /* ── fetch ── */
  const fetchRequests = (params: Record<string, string> = {}) => {
    getMyRequests(params)
      .then(r => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter) params.type = filter;
    fetchRequests(params);
  }, [filter]);

  useEffect(() => {
    getMyProfile()
      .then(r => { if (r.data?.signature) setMySignatureUrl(r.data.signature); })
      .catch(() => {});
  }, []);

  /* ── canvas drawing ── */
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); }
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.lineWidth = 2; ctx.strokeStyle = '#1a1a1a'; ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke(); }
  };
  const stopDraw  = () => { isDrawing.current = false; };
  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  const canvasToFile = (): Promise<File> => new Promise(resolve => {
    canvasRef.current?.toBlob(blob => {
      if (blob) resolve(new File([blob], 'signature.png', { type: 'image/png' }));
    });
  });

  /* ── open signing modal ── */
  const openSigningModal = async (r: Record<string, unknown>) => {
    setSigningRequest(r);
    setSigMode('draw');
    setSigFile(null);
    try {
      const res = await downloadDocument(r.id as string);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
    } catch { setPreviewUrl(null); }
  };

  const closeSigningModal = () => {
    setSigningRequest(null);
    setSigFile(null);
    clearCanvas();
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  /* ── submit signed ── */
  const handleSubmitSigned = async () => {
    if (!signingRequest) return;
    let file = sigFile;
    // Both draw and upload modes send as signature_image so backend embeds it in the PDF
    if (sigMode === 'draw') {
      file = await canvasToFile();
    }
    if (!file) { alert('Veuillez dessiner ou importer votre signature.'); return; }
    setSigUploading(true);
    try {
      await submitSignedDocument(signingRequest.id as string, file, true);
      closeSigningModal();
      fetchRequests();
      alert('Document signé et renvoyé à l\'administration avec succès.');
    } catch { alert("Erreur lors de l'envoi."); }
    finally { setSigUploading(false); }
  };

  /* ── download ── */
  const handleDownload = async (id: string) => {
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `document_${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Document non encore genere.'); }
  };

  /* ══════════════════════════════════════════════════════ render */
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mes demandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toutes vos demandes en un seul endroit</p>
        </div>
        <Link to="/requests/new" className="px-4 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]">
          + Nouvelle demande
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ v: '', l: 'Tout' }, { v: 'CERTIFICATE', l: 'Attestations' }, { v: 'FREE', l: 'Demandes libres' }, { v: 'LEAVE', l: 'Conges' }, { v: 'MISSION', l: 'Missions' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Aucune demande trouvee.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Objet</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const t = typeCfg[r.type as string] || typeCfg.CERTIFICATE;
                const s = statusCfg[r.status as string] || statusCfg.PENDING;
                return (
                  <tr key={r.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${t.cls}`}>{t.label}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{r.title as string}</td>
                    <td className="px-5 py-3 text-gray-500">{(r.created_at as string)?.slice(0, 10)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.type === 'CERTIFICATE' && r.status === 'PENDING_SIGNATURE' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDownload(r.id as string)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded hover:bg-blue-50">
                            Télécharger PDF
                          </button>
                          <button onClick={() => openSigningModal(r)}
                            className="px-3 py-1 text-xs font-medium text-white bg-orange-500 border border-orange-500 rounded hover:bg-orange-600 animate-pulse flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Signature requise
                          </button>
                        </div>
                      ) : r.type === 'CERTIFICATE' && (r.status === 'APPROVED' || r.status === 'GENERATED') ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDownload(r.id as string)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded hover:bg-blue-50">
                            Télécharger PDF
                          </button>
                          <button onClick={() => openSigningModal(r)}
                            className="px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Signer
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ Full-screen signing modal ══ */}
      {signingRequest && (
        <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">

          {/* Top bar */}
          <div className="bg-[#0f172a] text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Signature du document</p>
                <p className="text-xs text-slate-400 mt-0.5">{signingRequest.title as string}</p>
              </div>
            </div>
            <button onClick={closeSigningModal} className="text-slate-400 hover:text-white text-2xl leading-none px-2">×</button>
          </div>

          <div className="flex flex-1 overflow-hidden">

            {/* Left: PDF preview */}
            <div className="flex-1 flex flex-col bg-gray-200">
              <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">Aperçu du document</p>
                <button onClick={() => handleDownload(signingRequest.id as string)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  ⬇️ Télécharger PDF
                </button>
              </div>
              {previewUrl ? (
                <iframe src={previewUrl} className="flex-1 w-full border-0" title="Document" />
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                  Chargement du document...
                </div>
              )}
            </div>

            {/* Right: Signature panel */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Votre signature</h3>
                <p className="text-xs text-gray-400 mt-0.5">Dessinez ou importez votre signature</p>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Mode tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setSigMode('draw')}
                    className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${sigMode === 'draw' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                    ✏️ Dessiner
                  </button>
                  <button onClick={() => setSigMode('upload')}
                    className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${sigMode === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                    📎 Importer
                  </button>
                </div>

                {sigMode === 'draw' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Signez dans le cadre ci-dessous :</p>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <canvas
                        ref={canvasRef} width={272} height={140}
                        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                        className="w-full cursor-crosshair rounded-lg"
                        style={{ touchAction: 'none' }}
                      />
                      <p className="absolute bottom-2 right-2 text-[10px] text-gray-300 pointer-events-none">Signez ici</p>
                    </div>
                    <button onClick={clearCanvas} className="text-xs text-gray-400 hover:text-gray-600 underline">Effacer</button>
                    {mySignatureUrl && (
                      <div className="border border-gray-100 rounded-lg p-2 bg-gray-50">
                        <p className="text-[10px] text-gray-400 mb-1">Votre signature enregistrée :</p>
                        <img src={mySignatureUrl} alt="signature" className="max-h-10 object-contain" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySignatureUrl && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-2">Signature enregistrée dans votre profil :</p>
                        <img src={mySignatureUrl} alt="Ma signature" className="max-h-14 object-contain" />
                        <button
                          onClick={async () => {
                            const res = await fetch(mySignatureUrl);
                            const blob = await res.blob();
                            setSigFile(new File([blob], 'signature.png', { type: blob.type }));
                          }}
                          className="mt-2 w-full py-1.5 text-xs font-medium text-[#0f172a] border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          Utiliser cette signature
                        </button>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ou importez un fichier :</p>
                      <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg"
                        onChange={e => setSigFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
                      {sigFile && <p className="text-xs text-green-600 mt-1">✅ {sigFile.name}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={handleSubmitSigned}
                  disabled={sigUploading || (sigMode === 'upload' && !sigFile)}
                  className="w-full py-2.5 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {sigUploading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Envoi...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg> Signer et envoyer à l'admin</>
                  )}
                </button>
                <button onClick={closeSigningModal} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
