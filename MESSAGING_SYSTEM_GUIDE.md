# نظام المحادثات والإشعارات الجماعية

## 📋 نظرة عامة

يحتوي التطبيق على نظامين منفصلين للتواصل:

### 1. نظام المحادثات الخاصة (Messaging)
- **الموقع**: `/messaging`
- **الوصول**: SUPER_ADMIN, ADMIN_HR, DEPARTMENT_HEAD, PROFESSOR, STAFF
- **الغرض**: محادثات خاصة بين المستخدمين (1-to-1 أو مجموعات)

### 2. نظام الإشعارات الجماعية (Broadcast Notifications)
- **الموقع**: `/broadcast`
- **الوصول**: SUPER_ADMIN فقط
- **الغرض**: إرسال إشعارات رسمية لجميع المستخدمين أو لأدوار محددة

---

## 🔒 الخصوصية والأمان

### المحادثات الخاصة (Messaging)
✅ **محمية بالكامل**:
- كل مستخدم يرى فقط المحادثات التي هو مشارك فيها
- لا يمكن لأي شخص (حتى Super Admin) رؤية محادثات الآخرين إلا إذا كان مشاركاً فيها
- الرسائل المحذوفة تظهر كـ "Message supprimé" ولا يمكن استرجاعها

### الإشعارات الجماعية (Broadcast)
✅ **مخصصة للإعلانات الرسمية**:
- فقط Super Admin يمكنه إرسال إشعارات جماعية
- تظهر في قسم الإشعارات (Notifications) وليس في المحادثات
- لا يمكن الرد عليها - هي إعلانات أحادية الاتجاه

---

## 📱 نظام المحادثات الخاصة

### الوصول
```
الأدوار المسموح لها:
- SUPER_ADMIN
- ADMIN_HR
- DEPARTMENT_HEAD
- PROFESSOR
- STAFF

غير مسموح:
- STUDENT (لحماية خصوصية الطلاب)
```

### الميزات
1. **محادثات مباشرة (Direct)**:
   - محادثة خاصة بين شخصين فقط
   - تُنشأ تلقائياً عند اختيار مستخدم من القائمة

2. **محادثات جماعية (Group)** (قادمة):
   - محادثة بين عدة أشخاص
   - لها عنوان محدد

3. **البحث عن المستخدمين**:
   - بحث بالاسم، البريد الإلكتروني، أو اسم المستخدم
   - يظهر فقط المستخدمين النشطين (is_active=True)

4. **إدارة الرسائل**:
   - إرسال رسائل نصية
   - حذف الرسائل الخاصة بك (soft delete)
   - عرض حالة القراءة
   - عداد الرسائل غير المقروءة

### الكود الخلفي (Backend)

#### Models
```python
# apps/messaging/models.py

class Conversation:
    - id: UUID
    - conv_type: DIRECT | GROUP
    - title: عنوان المحادثة (للمجموعات)
    - participants: المشاركون (ManyToMany)
    - created_by: منشئ المحادثة

class Message:
    - id: UUID
    - conversation: المحادثة
    - sender: المرسل
    - body: نص الرسالة
    - attachment: مرفق (اختياري)
    - is_deleted: محذوف؟

class MessageRead:
    - message: الرسالة
    - user: المستخدم
    - read_at: وقت القراءة
```

#### API Endpoints
```
GET    /api/v1/messaging/conversations/          # قائمة المحادثات
POST   /api/v1/messaging/conversations/          # إنشاء محادثة جديدة
GET    /api/v1/messaging/conversations/<id>/     # تفاصيل محادثة

GET    /api/v1/messaging/conversations/<id>/messages/  # رسائل المحادثة
POST   /api/v1/messaging/conversations/<id>/messages/  # إرسال رسالة
DELETE /api/v1/messaging/messages/<id>/                # حذف رسالة

GET    /api/v1/messaging/unread/                 # عدد الرسائل غير المقروءة
GET    /api/v1/messaging/users/                  # قائمة المستخدمين
GET    /api/v1/messaging/users/search/?q=...     # البحث عن مستخدمين
POST   /api/v1/messaging/direct/                 # إنشاء/إيجاد محادثة مباشرة
```

### الكود الأمامي (Frontend)

#### الصفحة
```
hrms-frontend/src/pages/messaging/MessagingPage.tsx
```

#### الميزات
- واجهة مشابهة لـ WhatsApp/Messenger
- تحديث تلقائي كل 8 ثوانٍ للرسائل
- تحديث تلقائي كل 15 ثانية لقائمة المحادثات
- بحث فوري عن المستخدمين
- فلترة المحادثات
- عرض الوقت النسبي (منذ 5 دقائق، منذ ساعة، إلخ)
- عداد الرسائل غير المقروءة

---

## 📢 نظام الإشعارات الجماعية

### الوصول
```
الأدوار المسموح لها:
- SUPER_ADMIN فقط

الغرض:
- إرسال إعلانات رسمية
- إشعارات صيانة النظام
- تنبيهات مهمة لجميع المستخدمين
```

### الميزات
1. **إرسال لجميع المستخدمين**:
   - يصل الإشعار لكل المستخدمين النشطين

2. **إرسال لأدوار محددة**:
   - اختيار أدوار معينة (Admin HR, Professors, Staff, إلخ)
   - يمكن اختيار عدة أدوار

3. **معاينة الإشعار**:
   - رؤية كيف سيظهر الإشعار قبل الإرسال

4. **حدود النص**:
   - العنوان: 100 حرف
   - الرسالة: 500 حرف

### الكود الخلفي (Backend)

#### API Endpoint
```python
POST /api/v1/superadmin/broadcast-notification/

Body:
{
    "title": "عنوان الإشعار",
    "message": "نص الإشعار",
    "target": "ALL" | "ROLE" | "SPECIFIC",
    "roles": ["ADMIN_HR", "PROFESSOR"],  # إذا كان target=ROLE
    "user_ids": ["uuid1", "uuid2"],      # إذا كان target=SPECIFIC
    "notification_type": "SYSTEM_ANNOUNCEMENT"
}

Response:
{
    "detail": "Notification sent to 25 users.",
    "count": 25
}
```

#### الكود
```python
# apps/accounts/broadcast_views.py

class BroadcastNotificationView(APIView):
    permission_classes = [IsSuperAdmin]
    
    def post(self, request):
        # تحديد المستلمين بناءً على target
        # إرسال الإشعار لكل مستخدم
        # إرجاع عدد المستلمين
```

### الكود الأمامي (Frontend)

#### الصفحة
```
hrms-frontend/src/pages/superadmin/BroadcastNotificationPage.tsx
```

#### الميزات
- اختيار نوع المستلمين (الكل / أدوار محددة)
- اختيار متعدد للأدوار
- عداد الأحرف للعنوان والرسالة
- معاينة مباشرة للإشعار
- رسائل نجاح/خطأ واضحة
- زر إعادة تعيين

---

## 🎯 الفرق بين النظامين

| الميزة | المحادثات الخاصة | الإشعارات الجماعية |
|--------|------------------|---------------------|
| **الوصول** | SUPER_ADMIN, ADMIN_HR, DEPARTMENT_HEAD, PROFESSOR, STAFF | SUPER_ADMIN فقط |
| **الغرض** | تواصل شخصي بين الموظفين | إعلانات رسمية من الإدارة |
| **الاتجاه** | ثنائي الاتجاه (محادثة) | أحادي الاتجاه (إعلان) |
| **الخصوصية** | خاصة بالمشاركين فقط | عامة للمستلمين |
| **الرد** | يمكن الرد | لا يمكن الرد |
| **الموقع** | `/messaging` | `/broadcast` |
| **الظهور** | في صفحة المحادثات | في قسم الإشعارات |
| **الحذف** | يمكن حذف رسائلك | لا يمكن إلغاء الإشعار |

---

## 🚀 كيفية الاستخدام

### للمستخدمين العاديين (ADMIN_HR, PROFESSOR, STAFF, إلخ)

#### إرسال رسالة خاصة:
1. اذهب إلى **Messages** من القائمة الجانبية
2. اضغط على **Nouvelle conversation**
3. ابحث عن المستخدم الذي تريد مراسلته
4. اختر المستخدم من القائمة
5. اكتب رسالتك واضغط Enter أو زر الإرسال

#### قراءة الرسائل:
1. اذهب إلى **Messages**
2. اختر المحادثة من القائمة اليسرى
3. ستُعلّم الرسائل تلقائياً كمقروءة

#### حذف رسالة:
1. مرر الماوس فوق رسالتك
2. اضغط على أيقونة سلة المهملات
3. الرسالة ستتحول إلى "Message supprimé"

### للـ Super Admin

#### إرسال إشعار جماعي:
1. اذهب إلى **Notifications globales** من القائمة الجانبية
2. اختر المستلمين:
   - **Tous les utilisateurs**: لجميع المستخدمين النشطين
   - **Rôles spécifiques**: لأدوار محددة (اختر الأدوار)
3. اكتب العنوان (حتى 100 حرف)
4. اكتب الرسالة (حتى 500 حرف)
5. راجع المعاينة
6. اضغط **Envoyer la notification**

#### عرض الإشعارات المرسلة:
- الإشعارات تظهر في قسم **Notifications** لكل مستخدم
- لا يوجد سجل للإشعارات المرسلة حالياً (يمكن إضافته لاحقاً)

---

## 🔧 التخصيص والتطوير

### إضافة ميزات جديدة للمحادثات:

#### 1. إضافة المرفقات:
```python
# في MessageSerializer
attachment = serializers.FileField(required=False)

# في Frontend
<input type="file" onChange={handleFileUpload} />
```

#### 2. إضافة محادثات جماعية:
```python
# في ConversationSerializer
def create(self, validated_data):
    participants = validated_data.pop('participants')
    conv = Conversation.objects.create(
        conv_type='GROUP',
        title=validated_data.get('title'),
        created_by=self.context['request'].user
    )
    conv.participants.set(participants)
    return conv
```

#### 3. إضافة الإشعارات الفورية (Real-time):
```python
# استخدام Django Channels + WebSockets
# أو استخدام Firebase Cloud Messaging
```

### إضافة ميزات للإشعارات الجماعية:

#### 1. جدولة الإشعارات:
```python
# استخدام Celery
from celery import shared_task

@shared_task
def send_scheduled_notification(notification_id):
    # إرسال الإشعار في الوقت المحدد
    pass
```

#### 2. سجل الإشعارات المرسلة:
```python
class BroadcastLog(models.Model):
    sent_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    message = models.TextField()
    target = models.CharField(max_length=20)
    recipient_count = models.IntegerField()
    sent_at = models.DateTimeField(auto_now_add=True)
```

#### 3. إحصائيات القراءة:
```python
# تتبع من قرأ الإشعار ومن لم يقرأه
class NotificationRead(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
```

---

## 📊 الإحصائيات

### المحادثات:
```python
# عدد المحادثات النشطة
active_conversations = Conversation.objects.filter(
    participants=user,
    messages__isnull=False
).distinct().count()

# عدد الرسائل غير المقروءة
unread_count = Message.objects.filter(
    conversation__participants=user,
    is_deleted=False
).exclude(sender=user).exclude(
    reads__user=user
).count()
```

### الإشعارات:
```python
# عدد الإشعارات المرسلة اليوم
today_broadcasts = BroadcastLog.objects.filter(
    sent_at__date=timezone.now().date()
).count()

# متوسط عدد المستلمين
avg_recipients = BroadcastLog.objects.aggregate(
    Avg('recipient_count')
)['recipient_count__avg']
```

---

## ⚠️ ملاحظات مهمة

### الأمان:
1. **لا تشارك معلومات حساسة** في المحادثات
2. **الرسائل المحذوفة** لا يمكن استرجاعها
3. **Super Admin** لا يمكنه قراءة محادثاتك الخاصة إلا إذا كان مشاركاً فيها

### الأداء:
1. المحادثات تُحدّث كل 8 ثوانٍ (يمكن تعديلها)
2. البحث عن المستخدمين يستخدم debounce (350ms)
3. الرسائل القديمة لا تُحذف تلقائياً (يمكن إضافة cleanup job)

### الخصوصية:
1. **الطلاب (STUDENT)** لا يمكنهم الوصول للمحادثات
2. **المستخدمين غير النشطين** (is_active=False) لا يظهرون في البحث
3. **الإشعارات الجماعية** تُرسل فقط للمستخدمين النشطين

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا تظهر المحادثات
**الحل**:
1. تأكد من أن دورك مسموح له بالوصول
2. تحقق من أن لديك محادثات فعلية
3. افتح Console في المتصفح وابحث عن أخطاء API

### المشكلة: لا يمكن إرسال رسالة
**الحل**:
1. تأكد من أنك مشارك في المحادثة
2. تحقق من اتصالك بالإنترنت
3. تأكد من أن الرسالة ليست فارغة

### المشكلة: الإشعار الجماعي لم يُرسل
**الحل**:
1. تأكد من أنك Super Admin
2. تحقق من ملء العنوان والرسالة
3. إذا اخترت "Rôles spécifiques"، تأكد من اختيار رول واحد على الأقل
4. افتح Network tab وتحقق من response الـ API

---

## 📝 الخلاصة

- **المحادثات الخاصة**: للتواصل الشخصي بين الموظفين، محمية بالكامل
- **الإشعارات الجماعية**: للإعلانات الرسمية من Super Admin فقط
- **الخصوصية مضمونة**: لا يمكن لأحد التجسس على محادثات الآخرين
- **سهلة الاستخدام**: واجهة بسيطة وواضحة

---

## 📞 الدعم

إذا واجهت أي مشكلة أو لديك اقتراح:
1. تواصل مع فريق الدعم التقني
2. أو أرسل بريد إلكتروني إلى: support@fpt.ac.ma
