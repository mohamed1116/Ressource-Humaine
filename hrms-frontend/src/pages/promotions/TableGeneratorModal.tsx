/**
 * TableGeneratorModal.tsx - Clean, Error-Safe & Production-Ready Version
 */
import React, { useState } from 'react';
import { promotionsApi } from '../../api/promotions.api';

interface TableGeneratorModalProps {
  onClose: () => void;
  onGenerated: () => void;
}

interface ApiErrorStructure {
  response?: {
    data?: {
      detail?: string;
      error?: string;
      message?: string;
    } | string; 
  };
}

export default function TableGeneratorModal({ onClose, onGenerated }: TableGeneratorModalProps) {
  const [tableType, setTableType]     = useState('ECHELON');
  const [year, setYear]               = useState('2026');
  const [cadreFilter, setCadreFilter] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // ═══════════════════════════════════════════════════════════════
  // معالجة آمنة ومضمونة 100% لإرسال البيانات وقراءة الأخطاء
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ تم إصلاح الكومونطير هنا ليصبح متوافقاً مع TypeScript
      await promotionsApi.generateTable({
        table_type: tableType,
        year: parseInt(year, 10),
        cadre_filter: cadreFilter,
      });

      // 1. إعلام المستخدم بالنجاح
      alert('Tableau officiel généré avec succès !');
      
      // 2. تحديث قائمة الجداول فـ الصفحة الرئيسية تلقائياً بلا Refresh
      if (typeof onGenerated === 'function') {
        onGenerated(); 
      }
      
      // 3. سد الـ Modal
      onClose();     
    } catch (err: unknown) {
      console.error('Generation Error Summary:', err);
      
      const apiErr = err as ApiErrorStructure;
      let targetMessage = "Une erreur est survenue lors de la génération.";

      if (apiErr.response && apiErr.response.data) {
        const responseData = apiErr.response.data;

        // إذا أرجع السيرفر كائناً (Object) نقوم بتفكيكه بأمان
        if (typeof responseData === 'object' && responseData !== null) {
          targetMessage = responseData.detail || responseData.error || responseData.message || targetMessage;
        } 
        else if (typeof responseData === 'string') {
          targetMessage = responseData;
        }
      } else if (err instanceof Error) {
        targetMessage = err.message;
      }
      
      setError(String(targetMessage)); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="p-6 bg-indigo-600 text-white relative">
          <h2 className="text-xl font-bold">Générer un tableau officiel</h2>
          <p className="text-indigo-100 text-xs mt-1">Faculté Polydisciplinaire de Taroudant</p>
          <button type="button" onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white font-bold text-lg">✕</button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* صندوق عرض الأخطاء المطور */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase">Type de promotion</label>
            <select
              value={tableType}
              onChange={(e) => setTableType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="ECHELON">Promotion en échelon (الترقية في الرتبة)</option>
              <option value="GRADE_TITLE">Nomination en grade (التسمية في إطار)</option>
              <option value="GRADE_ADMIN">Promotion de grade - Cadres admin/tech (الترقية في الدرجة)</option>
            </select>
          </div>

          {/* Year Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase">Année budgétaire</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              required
            />
          </div>

          {/* Cadre Filter Optional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase">Filtrer par cadre (Optionnel)</label>
            <select
              value={cadreFilter}
              onChange={(e) => setCadreFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="">Tous les cadres éligibles</option>
              <option value="Professeur Enseignant">Professeurs</option>
              <option value="Administrateur">Administrateurs</option>
              <option value="Technicien">Techniciens</option>
            </select>
            <p className="text-[11px] text-gray-400">Si aucun cadre n'est sélectionné, le tableau inclura tous les fonctionnaires éligibles.</p>
          </div>

          {/* Actions Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold border rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Génération...
                </>
              ) : (
                '✓ Générer le tableau'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}