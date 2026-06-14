# تحديث عرض التاريخ والترتيب للوثائق المُعاد توليدها

## المشكلة السابقة

عند إعادة توليد وثيقة (Régénérer):
- ❌ التاريخ المعروض لا يتغير (يبقى تاريخ الطلب الأصلي)
- ❌ الوثيقة لا تنتقل إلى الأعلى في القائمة
- ❌ الموظف لا يعرف أن هناك نسخة جديدة

## الحل المطبق

### 1. Backend (Serializer)
**الملف**: `hrms-backend/apps/certificates/serializers.py`

أضفنا حقل جديد `last_generated_at`:
```python
def get_last_generated_at(self, obj):
    """Return the creation date of the most recent generated document."""
    latest_doc = obj.generated_documents.order_by('-created_at').first()
    return latest_doc.created_at if latest_doc else None
```

هذا الحقل يعيد:
- تاريخ آخر توليد للوثيقة (إذا تم إعادة التوليد)
- `None` إذا لم يتم توليد أي وثيقة بعد

### 2. Frontend - صفحة الموظف
**الملف**: `hrms-frontend/src/pages/certificates/MyCertificatesPage.tsx`

#### أ) الترتيب:
```typescript
const sorted = data.sort((a, b) => {
  const dateA = (a.last_generated_at || a.created_at) as string;
  const dateB = (b.last_generated_at || b.created_at) as string;
  return new Date(dateB).getTime() - new Date(dateA).getTime();
});
```
- يرتب حسب `last_generated_at` أولاً
- إذا لم يكن موجوداً، يستخدم `created_at`
- الأحدث في الأعلى

#### ب) عرض التاريخ:
```typescript
const displayDate = r.last_generated_at ? 
  (r.last_generated_at as string).slice(0, 10) : 
  (r.created_at as string)?.slice(0, 10);
```
- يعرض تاريخ آخر توليد إذا كان موجوداً
- وإلا يعرض تاريخ إنشاء الطلب

### 3. Frontend - صفحة HR
**الملف**: `hrms-frontend/src/pages/certificates/ManageCertificatesPage.tsx`

نفس التعديلات للترتيب وعرض التاريخ.

## النتيجة

### قبل التحديث:
```
Document                Date        Action
Attestation de Travail  2026-05-04  [Télécharger PDF]
Attestation de Travail  2026-05-04  [Télécharger PDF]  ← نفس التاريخ!
```

### بعد التحديث:
```
Document                Date        Action
Attestation de Travail  2026-05-05  [Télécharger PDF]  ← تاريخ جديد في الأعلى!
Attestation de Travail  2026-05-04  [Télécharger PDF]
```

## سيناريو الاستخدام

1. **الموظف يطلب وثيقة** (2026-05-04)
   - التاريخ المعروض: `2026-05-04`

2. **HR يوافق ويولد PDF** (2026-05-04)
   - التاريخ المعروض: `2026-05-04`
   - الوثيقة في الأعلى

3. **بعد أسبوع، HR يضغط "Régénérer"** (2026-05-11)
   - التاريخ المعروض يتحدث إلى: `2026-05-11` ✅
   - الوثيقة تنتقل إلى الأعلى ✅
   - الموظف يتلقى إشعار "Document régénéré" ✅

## الملفات المعدلة

1. ✅ `hrms-backend/apps/certificates/serializers.py`
   - إضافة حقل `last_generated_at`

2. ✅ `hrms-frontend/src/pages/certificates/MyCertificatesPage.tsx`
   - ترتيب حسب آخر توليد
   - عرض تاريخ آخر توليد

3. ✅ `hrms-frontend/src/pages/certificates/ManageCertificatesPage.tsx`
   - نفس التعديلات لصفحة HR

## اختبار

1. قدم طلب وثيقة جديد
2. وافق عليه من HR
3. لاحظ التاريخ المعروض
4. اضغط "Régénérer" بعد دقيقة
5. تحقق من:
   - ✅ التاريخ تحدث
   - ✅ الوثيقة في الأعلى
   - ✅ وصل إشعار للموظف
