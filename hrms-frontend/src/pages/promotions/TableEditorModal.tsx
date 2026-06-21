import { useState, useRef } from 'react';
import { promotionsApi } from '../../api/promotions.api';

type Row = Record<string, string | number>;
type R   = Record<string, unknown>;

interface Props { table: R; onClose: () => void; }

const INSTITUTION = 'الكلية متعددة التخصصات تارودانت';

const TABLE_TITLES: Record<string, string> = {
  ECHELON:        'جدول اقتراح الترقية في الرتبة برسم سنة',
  GRADE_TITLE:    'جدول اقتراح التسمية في إطار أستاذ محاضر مؤهل برسم سنة',
  TITULARISATION: 'جدول اقتراح الترسيم في إطار أستاذ محاضر برسم سنة',
  GRADE_ADMIN:    'جدول الترقية في الدرجة برسم سنة',
};

export default function TableEditorModal({ table, onClose }: Props) {
  const tableType = table.table_type as string;
  const year      = table.year as number;
  const isGrade      = tableType === 'GRADE_TITLE';
  const isGradeAdmin = tableType === 'GRADE_ADMIN';

  const [rows, setRows] = useState<Row[]>(() =>
    ((table.employees_data as Record<string, unknown>[]) || []).map(emp => {
      let fullName = String(emp.full_name || emp.employee_name || emp.nom_complet || '');
      if (!fullName) fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      if (!fullName && emp.user && typeof emp.user === 'object') {
        const u = emp.user as Record<string, unknown>;
        fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      }
      return {
        institution:         String(emp.institution || INSTITUTION),
        full_name:           fullName || '—',
        ppr:                 String(emp.ppr || ''),
        // ECHELON / GRADE_TITLE fields
        old_echelon:         String(emp.old_echelon ?? emp.echelon_actuel ?? ''),
        old_indice:          String(emp.old_indice  ?? emp.rah_actuel    ?? ''),
        seniority_date:      String(emp.seniority_date ?? emp.date_anciennete ?? ''),
        new_echelon:         String(emp.new_echelon ?? emp.echelon_propose ?? ''),
        new_indice:          String(emp.new_indice  ?? emp.rah_propose   ?? ''),
        effective_date:      String(emp.effective_date ?? emp.date_effet_propose ?? ''),
        old_grade_code:      String(emp.old_grade_code || ''),
        new_grade_code:      String(emp.new_grade_code || ''),
        // GRADE_ADMIN fields
        current_cadre_grade: String(emp.current_cadre_grade || ''),
        appointment_date:    String(emp.appointment_date || ''),
        total_seniority:     String(emp.total_seniority || ''),
        promotion_method:    String(emp.promotion_method || ''),
        new_grade:           String(emp.new_grade || ''),
      } as Row;
    })
  );

  const [editCell, setEditCell] = useState<{ r: number; k: string } | null>(null);
  const [editVal,  setEditVal]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (ri: number, key: string, val: string | number) => {
    setEditCell({ r: ri, k: key });
    setEditVal(String(val ?? ''));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const commitEdit = () => {
    if (!editCell) return;
    setRows(prev => prev.map((row, i) => i === editCell.r ? { ...row, [editCell.k]: editVal } : row));
    setEditCell(null);
    setSaved(false);
  };

  const addRow = () => {
    const empty: Row = isGradeAdmin
      ? { institution: INSTITUTION, full_name: '', ppr: '', current_cadre_grade: '', appointment_date: '', total_seniority: '', promotion_method: '', new_grade: '', effective_date: '' }
      : { institution: INSTITUTION, full_name: '', ppr: '', old_echelon: '', old_indice: '', seniority_date: '', new_echelon: '', new_indice: '', effective_date: '', old_grade_code: '', new_grade_code: '' };
    setRows(prev => [...prev, empty]);
    setSaved(false);
  };

  const deleteRow = (ri: number) => { setRows(prev => prev.filter((_, i) => i !== ri)); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try { await promotionsApi.updateRows(table.id as string, rows); setSaved(true); }
    catch { alert('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  };

  const handlePdf = async () => {
    if (!saved) await handleSave();
    setPdfLoading(true);
    try {
      const blobData = await promotionsApi.downloadPdf(table.id as string);
      const blob = new Blob([blobData], { type: 'application/pdf' });
      const href = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `promotion_${tableType}_${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
    } catch { alert('Erreur lors du téléchargement du PDF.'); }
    finally { setPdfLoading(false); }
  };

  const title = `${TABLE_TITLES[tableType] || tableType} ${year}`;
  const colSpanEmpty = isGradeAdmin ? 9 : isGrade ? 11 : 9;

  const cellProps = { editCell, editVal, inputRef, onStart: startEdit, onCommit: commitEdit, onChange: setEditVal };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-base" dir="rtl">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{rows.length} ligne{rows.length !== 1 ? 's' : ''} · Double-clic pour modifier · Clic droit pour supprimer</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving ? <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" /> : null}
              {saved ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
            <button onClick={handlePdf} disabled={pdfLoading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exporter PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white shadow-lg rounded-lg mx-auto max-w-6xl p-8" dir="rtl">

            <div className="flex justify-center mb-6 pb-4 border-b-2 border-indigo-800">
              <img src="/assets/fpt-logo.png" alt="FPT" className="h-20 w-auto object-contain" />
            </div>

            <div className="border-2 border-gray-800 text-center py-3 px-6 mx-auto w-3/4 mb-4">
              <p className="font-bold text-base">{title}</p>
            </div>

            {table.cadre_filter ? (
              <p className="text-right text-sm font-bold mb-3 text-red-700">الإطار: {table.cadre_filter as string}</p>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs" style={{ direction: 'rtl' }}>
                <thead>
                  {isGradeAdmin ? (
                    <tr className="bg-blue-50">
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">المؤسسة</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">الاسم الكامل</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">رقم التأجير</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">الإطار الحالي والدرجة</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">تاريخ التعيين في الدرجة الحالية</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">الأقدمية الإجمالية</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">طريقة الترقية المقترحة</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">الدرجة الجديدة المقترحة</th>
                      <th className="border border-gray-800 px-2 py-2 text-center font-bold">تاريخ مفعول الدرجة الجديدة</th>
                    </tr>
                  ) : (
                    <>
                      <tr className="bg-blue-50">
                        <th className="border border-gray-800 px-2 py-2 text-center font-bold" rowSpan={2}>المؤسسة</th>
                        <th className="border border-gray-800 px-2 py-2 text-center font-bold" rowSpan={2}>الاسم الكامل</th>
                        <th className="border border-gray-800 px-2 py-2 text-center font-bold" rowSpan={2}>رقم التأجير</th>
                        <th className="border border-gray-800 px-2 py-2 text-center font-bold bg-orange-50" colSpan={isGrade ? 4 : 3}>الوضعية القديمة</th>
                        <th className="border border-gray-800 px-2 py-2 text-center font-bold bg-green-50" colSpan={isGrade ? 4 : 3}>الوضعية المقترحة</th>
                      </tr>
                      <tr className="bg-gray-50 text-xs">
                        {isGrade && <th className="border border-gray-800 px-2 py-1.5 text-center bg-orange-50">الدرجة</th>}
                        <th className="border border-gray-800 px-2 py-1.5 text-center bg-orange-50">الرتبة</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-center bg-orange-50">ر.ا.ح</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-center bg-orange-50">الأقدمية في الرتبة</th>
                        {isGrade && <th className="border border-gray-800 px-2 py-1.5 text-center bg-green-50">الدرجة</th>}
                        <th className="border border-gray-800 px-2 py-1.5 text-center bg-green-50">الرتبة</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-center bg-green-50">ر.ا.ح</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-center bg-green-50">تاريخ مفعولها</th>
                      </tr>
                    </>
                  )}
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-yellow-50 transition-colors"
                      onContextMenu={e => { e.preventDefault(); if (confirm('Supprimer cette ligne ?')) deleteRow(ri); }}>

                      <EC ri={ri} col="institution" row={row} {...cellProps}
                        className="font-bold text-right px-2 py-2"
                        display={ri === 0 ? String(row.institution || INSTITUTION) : ''} />
                      <EC ri={ri} col="full_name" row={row} {...cellProps} className="text-right px-2 py-2 font-medium" />
                      <EC ri={ri} col="ppr" row={row} {...cellProps} className="text-center px-2 py-2 font-mono" />

                      {isGradeAdmin ? (
                        <>
                          <EC ri={ri} col="current_cadre_grade" row={row} {...cellProps} className="text-center px-2 py-2" />
                          <EC ri={ri} col="appointment_date"    row={row} {...cellProps} className="text-center px-2 py-2" />
                          <EC ri={ri} col="total_seniority"     row={row} {...cellProps} className="text-center px-2 py-2" />
                          <EC ri={ri} col="promotion_method"    row={row} {...cellProps} className="text-center px-2 py-2" />
                          <EC ri={ri} col="new_grade"           row={row} {...cellProps} className="text-center px-2 py-2 font-semibold text-green-800" />
                          <EC ri={ri} col="effective_date"      row={row} {...cellProps} className="text-center px-2 py-2 bg-green-50/30" />
                        </>
                      ) : (
                        <>
                          {isGrade && <EC ri={ri} col="old_grade_code" row={row} {...cellProps} className="text-center px-2 py-2 bg-orange-50/30" />}
                          <EC ri={ri} col="old_echelon"    row={row} {...cellProps} className="text-center px-2 py-2 bg-orange-50/30" />
                          <EC ri={ri} col="old_indice"     row={row} {...cellProps} className="text-center px-2 py-2 bg-orange-50/30" />
                          <EC ri={ri} col="seniority_date" row={row} {...cellProps} className="text-center px-2 py-2 bg-orange-50/30" />
                          {isGrade && <EC ri={ri} col="new_grade_code" row={row} {...cellProps} className="text-center px-2 py-2 bg-green-50/30" />}
                          <EC ri={ri} col="new_echelon"    row={row} {...cellProps} className="text-center px-2 py-2 bg-green-50/30 font-semibold text-green-800" />
                          <EC ri={ri} col="new_indice"     row={row} {...cellProps} className="text-center px-2 py-2 bg-green-50/30 font-semibold text-green-800" />
                          <EC ri={ri} col="effective_date" row={row} {...cellProps} className="text-center px-2 py-2 bg-green-50/30" />
                        </>
                      )}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={colSpanEmpty} className="border border-gray-300 px-4 py-6 text-center text-gray-400 text-sm">
                        Aucune ligne. Cliquez sur "Ajouter une ligne" ci-dessous.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter une ligne
            </button>

            <div className="flex justify-between mt-12 pt-4">
              <div className="text-center w-2/5">
                <p className="font-bold text-sm border-b border-gray-800 pb-1 mb-12">توقيع رئيس المؤسسة</p>
                <p className="text-xs text-gray-400">الاسم والتوقيع والختم</p>
              </div>
              <div className="text-center w-2/5">
                <p className="font-bold text-sm border-b border-gray-800 pb-1 mb-12">توقيع رئيس الجامعة</p>
                <p className="text-xs text-gray-400">الاسم والتوقيع والختم</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-400">Double-clic sur une cellule pour la modifier · Clic droit pour supprimer</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{rows.length} employé{rows.length !== 1 ? 's' : ''}</span>
            {!saved && rows.length > 0 && <span className="text-xs text-amber-600 font-medium">Modifications non sauvegardées</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Editable Cell */
interface CellProps {
  ri: number; col: string; row: Row;
  editCell: { r: number; k: string } | null;
  editVal: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onStart: (ri: number, key: string, val: string | number) => void;
  onCommit: () => void;
  onChange: (v: string) => void;
  className?: string;
  display?: string;
}

function EC({ ri, col, row, editCell, editVal, inputRef, onStart, onCommit, onChange, className = '', display }: CellProps) {
  const isEditing = editCell?.r === ri && editCell?.k === col;
  const value = display !== undefined ? display : String(row[col] ?? '');
  return (
    <td className={`border border-gray-300 ${className} ${isEditing ? 'p-0' : 'cursor-pointer hover:bg-yellow-100'}`}
      onDoubleClick={() => !isEditing && onStart(ri, col, row[col] ?? '')}>
      {isEditing ? (
        <input ref={inputRef} value={editVal} onChange={e => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') onCommit(); }}
          className="w-full h-full px-2 py-1.5 text-xs border-2 border-indigo-400 outline-none bg-indigo-50 rounded"
          style={{ minWidth: '60px' }} />
      ) : (
        <span className={value ? '' : 'text-gray-300 italic text-xs'}>{value || '—'}</span>
      )}
    </td>
  );
}
