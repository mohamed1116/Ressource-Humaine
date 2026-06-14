import api from './axiosInstance';

// ── TYPES & INTERFACES FOR STRUCTURAL SAFETY ──
export interface PromotionRulePayload {
  id?: string;
  name: string;
  employee_type: 'PROFESSOR' | 'STAFF';
  condition_type: string;
  min_years: number;
  description?: string;
}

export interface GenerateTablePayload {
  table_type: 'ECHELON' | 'GRADE_TITLE' | 'TITULARISATION' | string;
  year: number;
  cadre_filter: string;
}

export interface ProfileQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  employee_type?: string;
  cadre?: string;
}

export const promotionsApi = {
  // ── Rules Management (ADMIN_HR only) ──
  getRules: (params?: object) => 
    api.get('/promotions/rules/', { params }),
    
  createRule: (data: PromotionRulePayload) => 
    api.post('/promotions/rules/', data),
    
  updateRule: (id: string, data: Partial<PromotionRulePayload>) => 
    api.patch(`/promotions/rules/${id}/`, data),
    
  deleteRule: (id: string) => 
    api.delete(`/promotions/rules/${id}/`),

  // ── Employee Profiles & Eligibility ──
  getProfiles: (params?: ProfileQueryParams) => 
    api.get('/promotions/profiles/', { params }),
    
  getEligible: (type: string, cadre?: string) =>
    api.get('/promotions/profiles/eligible/', { params: { type, cadre } }),
    
  getMyProfile: () => 
    api.get('/promotions/profiles/my-profile/'),
    
  getMyHistory: () => 
    api.get('/promotions/profiles/my-history/'),
    
  updateProfile: (id: string, data: object) => 
    api.patch(`/promotions/profiles/${id}/`, data),

  // ── Official Promotion Tables ──
  getTables: (params?: object) => 
    api.get('/promotions/tables/', { params }),
    
  getTable: (id: string) => 
    api.get(`/promotions/tables/${id}/`),
    
  generateTable: (data: GenerateTablePayload) => 
    api.post('/promotions/tables/generate/', data),
    
  updateRows: (id: string, rows: Record<string, unknown>[]) => 
    api.patch(`/promotions/tables/${id}/update-rows/`, { rows }),
    
  validateTable: (id: string) => 
    api.post(`/promotions/tables/${id}/validate/`),
    
  // 🚨 تم إصلاح الدالة هنا لترسل طلب POST المتوافق مع الباك إند الجديد وتفادي خطأ التحميل
  downloadPdf: async (id: string) => {
    const response = await api.post(
      '/promotions/documents/generate/', 
      { table_instance_id: id, doc_type: 'TABLEAU' },
      { responseType: 'blob' } // إجبار الـ Axios على قراءة الملف كـ Binary Blob لمنع الكراش
    );
    return response.data;
  },
  
  getPreviewHtml: (id: string) => 
    api.get(`/promotions/tables/${id}/preview/`, { responseType: 'text' }),
    
  getPdfUrl: (id: string) => 
    `/api/v1/promotions/tables/${id}/pdf/`,
    
  getPreviewUrl: (id: string) => 
    `/api/v1/promotions/tables/${id}/preview/`,

  // ── Global History ──
  getHistory: (params?: object) => 
    api.get('/promotions/history/', { params }),
};