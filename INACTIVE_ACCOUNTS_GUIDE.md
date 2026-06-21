# 🔒 دليل تفعيل/تعطيل الحسابات (Active/Inactive)

## 🎯 الطرق المتاحة

### 1️⃣ من صفحة User Management (الطريقة الموصى بها)

#### الخطوات:
1. سجل دخول بحساب **Super Admin**
2. اذهب إلى **Gestion des utilisateurs**
3. ابحث عن المستخدم المطلوب
4. اضغط على زر **"View"** بجانب اسمه
5. اضغط على **"Edit User"**
6. قم بإلغاء تفعيل **"Account Active"** (checkbox)
7. اضغط **"Save Changes"**

#### النتيجة:
```
✅ الحساب أصبح Inactive
❌ المستخدم لا يستطيع تسجيل الدخول
📊 يظهر في الإحصائيات كـ Inactive
```

---

### 2️⃣ من Django Admin Panel

#### الخطوات:
1. اذهب إلى: http://localhost:8000/admin
2. سجل دخول بحساب Super Admin
3. اذهب إلى **Users**
4. ابحث عن المستخدم
5. افتح صفحة تعديله
6. قم بإلغاء تفعيل **"Active"** (checkbox)
7. احفظ التغييرات

---

### 3️⃣ من Backend (Django Shell)

#### الطريقة:
```bash
cd hrms-backend
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()

# البحث عن المستخدم بالبريد
user = User.objects.get(email='user@example.com')

# تعطيل الحساب
user.is_active = False
user.save()

print(f"✅ {user.email} is now Inactive")
```

#### أو بالـ ID:
```python
user = User.objects.get(id='USER_UUID_HERE')
user.is_active = False
user.save()
```

---

### 4️⃣ من API (باستخدام Postman أو curl)

#### Request:
```bash
PATCH http://localhost:8000/api/v1/auth/users/{USER_ID}/

Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json

Body:
{
  "is_active": false
}
```

#### مثال curl:
```bash
curl -X PATCH http://localhost:8000/api/v1/auth/users/USER_ID/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

---

## 📊 ماذا يحدث عند تعطيل الحساب؟

### ✅ ما يحدث:
```
❌ المستخدم لا يستطيع تسجيل الدخول
❌ يظهر رسالة "Account is disabled"
📊 يظهر في الإحصائيات كـ Inactive
🔴 يظهر بـ badge أحمر في User Management
💾 البيانات محفوظة (لا يتم حذفها)
```

### ❌ ما لا يحدث:
```
✅ البيانات لا تُحذف
✅ السجلات التاريخية محفوظة
✅ يمكن إعادة تفعيل الحساب لاحقاً
```

---

## 🔄 إعادة تفعيل الحساب

### من User Management:
1. افتح المستخدم
2. Edit User
3. فعّل **"Account Active"**
4. Save Changes

### من Django Shell:
```python
user = User.objects.get(email='user@example.com')
user.is_active = True
user.save()
print(f"✅ {user.email} is now Active")
```

---

## 📝 سكريبت جاهز لتعطيل/تفعيل الحسابات

### إنشاء السكريبت:
```python
# toggle_user_status.py
import os
import sys
import django

sys.path.insert(0, 'hrms-backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def toggle_user_status(email):
    """تبديل حالة المستخدم (Active/Inactive)"""
    try:
        user = User.objects.get(email=email)
        user.is_active = not user.is_active
        user.save()
        
        status = "Active" if user.is_active else "Inactive"
        print(f"✅ {user.email} is now {status}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"   Role: {user.role}")
        
    except User.DoesNotExist:
        print(f"❌ User with email '{email}' not found")

def deactivate_user(email):
    """تعطيل حساب مستخدم"""
    try:
        user = User.objects.get(email=email)
        user.is_active = False
        user.save()
        print(f"✅ {user.email} has been deactivated")
        
    except User.DoesNotExist:
        print(f"❌ User not found")

def activate_user(email):
    """تفعيل حساب مستخدم"""
    try:
        user = User.objects.get(email=email)
        user.is_active = True
        user.save()
        print(f"✅ {user.email} has been activated")
        
    except User.DoesNotExist:
        print(f"❌ User not found")

def list_inactive_users():
    """عرض جميع الحسابات غير النشطة"""
    inactive = User.objects.filter(is_active=False)
    print(f"\n📋 Inactive Users: {inactive.count()}")
    print("=" * 60)
    
    for user in inactive:
        print(f"   • {user.email} - {user.first_name} {user.last_name} ({user.role})")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python toggle_user_status.py toggle user@example.com")
        print("  python toggle_user_status.py deactivate user@example.com")
        print("  python toggle_user_status.py activate user@example.com")
        print("  python toggle_user_status.py list")
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "list":
        list_inactive_users()
    elif action == "toggle" and len(sys.argv) == 3:
        toggle_user_status(sys.argv[2])
    elif action == "deactivate" and len(sys.argv) == 3:
        deactivate_user(sys.argv[2])
    elif action == "activate" and len(sys.argv) == 3:
        activate_user(sys.argv[2])
    else:
        print("❌ Invalid command")
```

### الاستخدام:
```bash
# تبديل الحالة (Active ↔ Inactive)
python toggle_user_status.py toggle user@example.com

# تعطيل حساب
python toggle_user_status.py deactivate user@example.com

# تفعيل حساب
python toggle_user_status.py activate user@example.com

# عرض جميع الحسابات غير النشطة
python toggle_user_status.py list
```

---

## 🧪 الاختبار

### 1. تعطيل حساب:
```bash
# من User Management
1. افتح المستخدم
2. Edit User
3. أزل علامة ✓ من "Account Active"
4. Save Changes
```

### 2. محاولة تسجيل الدخول:
```
❌ يجب أن تظهر رسالة:
   "Account is disabled"
```

### 3. التحقق من الإحصائيات:
```
Dashboard → User Management
✅ Total Users: 41
✅ Active: 40
✅ Inactive: 1
```

---

## 🎯 حالات الاستخدام

### متى تعطل حساب؟
```
✅ موظف ترك العمل
✅ طالب تخرج
✅ حساب مؤقت انتهت صلاحيته
✅ حساب مشبوه يحتاج تحقيق
✅ إجازة طويلة (اختياري)
```

### متى تحذف حساب؟
```
❌ نادراً جداً!
⚠️ فقط إذا كنت متأكد 100%
⚠️ سيتم حذف جميع البيانات المرتبطة
✅ الأفضل: تعطيل الحساب بدلاً من الحذف
```

---

## 📊 الفرق بين Inactive و Delete

| العملية | Inactive | Delete |
|---------|----------|--------|
| **البيانات** | محفوظة ✅ | محذوفة ❌ |
| **السجلات** | موجودة ✅ | محذوفة ❌ |
| **الإحصائيات** | تظهر ✅ | لا تظهر ❌ |
| **إعادة التفعيل** | ممكن ✅ | مستحيل ❌ |
| **تسجيل الدخول** | ممنوع ❌ | مستحيل ❌ |

---

## 🔒 الأمان

### من يستطيع تعطيل الحسابات؟
```
✅ Super Admin فقط
❌ Admin/HR لا يستطيع
❌ المستخدم لا يستطيع تعطيل حسابه
```

### الحماية في الكود:
```typescript
// في UserManagementPage.tsx
const handleSaveUser = async (form: any) => {
  const updateData = {
    ...
    is_active: form.status === "active"  // ✅
  };
  await updateUser(form.id, updateData);
};
```

---

## 💡 نصائح

### ✅ افعل:
- استخدم Inactive بدلاً من Delete
- احتفظ بسجل للحسابات المعطلة
- وثق سبب التعطيل
- راجع الحسابات غير النشطة دورياً

### ❌ لا تفعل:
- لا تحذف الحسابات إلا للضرورة القصوى
- لا تعطل حسابات بدون سبب واضح
- لا تنسى إخبار المستخدم

---

## 📞 الدعم

إذا واجهت مشكلة:
1. تحقق من صلاحيات Super Admin
2. تحقق من Console (F12)
3. راجع Backend logs
4. استخدم Django Shell للتحقق

---

**الخلاصة**: استخدم **Inactive** بدلاً من **Delete** دائماً! 🎯
