# تحديث: نظام الإشعارات الجماعية

## ✨ ما الجديد؟

تم إضافة **صفحة الإشعارات الجماعية** للـ Super Admin لإرسال إعلانات رسمية لجميع المستخدمين أو لأدوار محددة.

---

## 📦 الملفات المضافة

### Frontend:
```
✅ hrms-frontend/src/pages/superadmin/BroadcastNotificationPage.tsx
   - صفحة جديدة لإرسال الإشعارات الجماعية
   - واجهة سهلة الاستخدام مع معاينة مباشرة
   - دعم إرسال لجميع المستخدمين أو لأدوار محددة
```

### Router:
```
✅ hrms-frontend/src/router/index.tsx
   - إضافة route جديد: /broadcast
   - محمي بـ ProtectedRoute (Super Admin فقط)
```

### Sidebar:
```
✅ hrms-frontend/src/components/layout/Sidebar.tsx
   - إضافة أيقونة الجرس (bell)
   - إضافة رابط "Notifications globales" للـ Super Admin
```

### Documentation:
```
✅ MESSAGING_SYSTEM_GUIDE.md
   - دليل شامل لنظام المحادثات والإشعارات
   - شرح الفرق بين النظامين
   - أمثلة على الاستخدام

✅ MESSAGING_QUICK_GUIDE.md
   - دليل سريع للمستخدمين
   - أسئلة شائعة
   - مرجع سريع

✅ BROADCAST_NOTIFICATION_UPDATE.md
   - هذا الملف
```

---

## 🎯 الميزات

### 1. إرسال لجميع المستخدمين
- إشعار واحد يصل لكل المستخدمين النشطين
- مثالي للإعلانات العامة

### 2. إرسال لأدوار محددة
- اختيار أدوار معينة:
  - Admin RH
  - Chef de département
  - Professeur
  - Personnel
  - Étudiant
- يمكن اختيار عدة أدوار في نفس الوقت

### 3. معاينة مباشرة
- رؤية كيف سيظهر الإشعار قبل الإرسال
- تصميم مشابه لشكل الإشعارات الفعلية

### 4. حدود النص
- العنوان: حتى 100 حرف
- الرسالة: حتى 500 حرف
- عداد أحرف مباشر

### 5. رسائل واضحة
- رسالة نجاح مع عدد المستلمين
- رسائل خطأ واضحة
- إمكانية إعادة المحاولة

---

## 🚀 كيفية الاستخدام

### الوصول إلى الصفحة:
1. سجل الدخول كـ **Super Admin**
2. من القائمة الجانبية، اضغط على **Notifications globales**

### إرسال إشعار:
1. **اختر المستلمين**:
   - **Tous les utilisateurs**: لجميع المستخدمين
   - **Rôles spécifiques**: لأدوار محددة

2. **إذا اخترت "Rôles spécifiques"**:
   - حدد الأدوار المطلوبة من القائمة
   - يمكن اختيار عدة أدوار

3. **اكتب الإشعار**:
   - العنوان (مطلوب، حتى 100 حرف)
   - الرسالة (مطلوبة، حتى 500 حرف)

4. **راجع المعاينة**:
   - تظهر تلقائياً أسفل النموذج
   - تأكد من صحة المعلومات

5. **اضغط "Envoyer la notification"**:
   - سيتم إرسال الإشعار فوراً
   - ستظهر رسالة نجاح مع عدد المستلمين

---

## 🔧 التفاصيل التقنية

### API Endpoint:
```
POST /api/v1/superadmin/broadcast-notification/

Headers:
  Authorization: Bearer <token>

Body:
{
  "title": "عنوان الإشعار",
  "message": "نص الإشعار",
  "target": "ALL" | "ROLE",
  "roles": ["ADMIN_HR", "PROFESSOR"],  // إذا كان target=ROLE
  "notification_type": "SYSTEM_ANNOUNCEMENT"
}

Response (Success):
{
  "detail": "Notification sent to 25 users.",
  "count": 25
}

Response (Error):
{
  "detail": "Title and message are required."
}
```

### Permissions:
```python
permission_classes = [IsSuperAdmin]
```
- فقط المستخدمين بدور `SUPER_ADMIN` يمكنهم الوصول

### Frontend State:
```typescript
const [target, setTarget] = useState<'ALL' | 'ROLE'>('ALL');
const [title, setTitle] = useState('');
const [message, setMessage] = useState('');
const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
const [sending, setSending] = useState(false);
```

---

## 📊 الإحصائيات

### عند الإرسال الناجح:
```
✅ Notification envoyée à 25 utilisateurs
```
- يعرض عدد المستلمين الفعلي
- يؤكد نجاح العملية

### عند الفشل:
```
❌ Le titre et le message sont obligatoires
❌ Veuillez sélectionner au moins un rôle
❌ Erreur lors de l'envoi de la notification
```

---

## 🎨 التصميم

### الألوان:
- **Primary**: Blue (#3B82F6) - للأزرار والعناصر التفاعلية
- **Success**: Green (#10B981) - لرسائل النجاح
- **Error**: Red (#EF4444) - لرسائل الخطأ
- **Info**: Blue (#3B82F6) - للمعلومات

### الأيقونات:
- **Bell** (🔔): أيقونة الإشعارات في Sidebar
- **Send** (📤): زر الإرسال
- **Check** (✓): رسائل النجاح
- **X** (✗): رسائل الخطأ
- **Info** (ℹ): معلومات إضافية

---

## ⚠️ ملاحظات مهمة

### 1. لا يمكن إلغاء الإشعار
- بمجرد الضغط على "Envoyer"، يتم إرسال الإشعار فوراً
- لا يمكن إلغاؤه أو حذفه
- تأكد من المحتوى قبل الإرسال

### 2. المستخدمين النشطين فقط
- الإشعارات تُرسل فقط للمستخدمين بـ `is_active=True`
- المستخدمين المعطلين لن يستلموا الإشعار

### 3. الإشعارات ليست محادثات
- لا يمكن الرد على الإشعارات
- هي إعلانات أحادية الاتجاه
- للمحادثات، استخدم صفحة Messages

### 4. الخصوصية
- الإشعارات الجماعية منفصلة عن المحادثات الخاصة
- Super Admin لا يمكنه قراءة المحادثات الخاصة للمستخدمين

---

## 🔄 التحديثات المستقبلية (اختياري)

### 1. جدولة الإشعارات:
```python
# إرسال إشعار في وقت محدد
scheduled_at = "2024-01-15 10:00:00"
```

### 2. سجل الإشعارات:
```python
# عرض تاريخ الإشعارات المرسلة
class BroadcastLog(models.Model):
    sent_by = models.ForeignKey(User)
    title = models.CharField(max_length=100)
    recipient_count = models.IntegerField()
    sent_at = models.DateTimeField(auto_now_add=True)
```

### 3. إحصائيات القراءة:
```python
# تتبع من قرأ الإشعار
read_count = notification.reads.count()
unread_count = recipient_count - read_count
```

### 4. قوالب الإشعارات:
```python
# حفظ قوالب جاهزة للاستخدام المتكرر
class NotificationTemplate(models.Model):
    title = models.CharField(max_length=100)
    message = models.TextField()
    created_by = models.ForeignKey(User)
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا أرى "Notifications globales" في Sidebar
**الحل**: تأكد من أنك مسجل دخول كـ Super Admin (role=SUPER_ADMIN)

### المشكلة: "Accès refusé" عند فتح الصفحة
**الحل**: هذه الصفحة مخصصة للـ Super Admin فقط

### المشكلة: لا يمكن إرسال الإشعار
**الحلول**:
1. تأكد من ملء العنوان والرسالة
2. إذا اخترت "Rôles spécifiques"، تأكد من اختيار رول واحد على الأقل
3. تحقق من اتصالك بالإنترنت
4. افتح Console وابحث عن أخطاء API

### المشكلة: الإشعار لم يصل للمستخدمين
**الحلول**:
1. تأكد من أن المستخدمين نشطين (is_active=True)
2. تحقق من أن الأدوار المختارة صحيحة
3. راجع logs الـ Backend

---

## 📞 الدعم

للمزيد من المعلومات أو المساعدة:
- راجع: `MESSAGING_SYSTEM_GUIDE.md` (دليل شامل)
- راجع: `MESSAGING_QUICK_GUIDE.md` (دليل سريع)
- تواصل مع فريق التطوير

---

## ✅ الخلاصة

تم إضافة نظام إشعارات جماعية متكامل للـ Super Admin مع:
- ✅ واجهة سهلة الاستخدام
- ✅ إرسال لجميع المستخدمين أو لأدوار محددة
- ✅ معاينة مباشرة
- ✅ رسائل نجاح/خطأ واضحة
- ✅ حماية بـ permissions
- ✅ توثيق شامل

**الصفحة جاهزة للاستخدام الآن!** 🎉
