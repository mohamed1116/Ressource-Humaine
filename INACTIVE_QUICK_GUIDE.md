# 🔒 دليل سريع: كيف تجعل حساب Inactive

## 🎯 الطريقة الأسهل (من User Management)

### الخطوات:
```
1. سجل دخول بحساب Super Admin
2. اذهب إلى "Gestion des utilisateurs"
3. ابحث عن المستخدم
4. اضغط "View" → "Edit User"
5. أزل علامة ✓ من "Account Active"
6. اضغط "Save Changes"
```

### النتيجة:
```
✅ الحساب أصبح Inactive
❌ المستخدم لا يستطيع تسجيل الدخول
📊 يظهر في الإحصائيات كـ Inactive
```

---

## 🖥️ الطريقة السريعة (من Terminal)

### استخدام السكريبت الجاهز:

```bash
# عرض جميع الحسابات غير النشطة
python toggle_user_status.py list

# تعطيل حساب
python toggle_user_status.py deactivate user@example.com

# تفعيل حساب
python toggle_user_status.py activate user@example.com

# تبديل الحالة (Active ↔ Inactive)
python toggle_user_status.py toggle user@example.com

# عرض جميع المستخدمين
python toggle_user_status.py all
```

---

## 📊 ماذا يحدث؟

### عند التعطيل:
```
❌ لا يستطيع تسجيل الدخول
📊 يظهر كـ Inactive في الإحصائيات
💾 البيانات محفوظة (لا تُحذف)
🔄 يمكن إعادة تفعيله لاحقاً
```

### عند محاولة تسجيل الدخول:
```
رسالة الخطأ: "Account is disabled"
```

---

## 🔄 إعادة التفعيل

### من User Management:
```
1. افتح المستخدم
2. Edit User
3. فعّل "Account Active" ✓
4. Save Changes
```

### من Terminal:
```bash
python toggle_user_status.py activate user@example.com
```

---

## ⚠️ مهم جداً

### ✅ استخدم Inactive بدلاً من Delete:
```
Inactive:
  ✅ البيانات محفوظة
  ✅ يمكن إعادة التفعيل
  ✅ السجلات موجودة

Delete:
  ❌ البيانات تُحذف نهائياً
  ❌ لا يمكن الاسترجاع
  ❌ السجلات تُحذف
```

---

## 🧪 الاختبار

### 1. عطّل حساب:
```bash
python toggle_user_status.py deactivate test@example.com
```

### 2. حاول تسجيل الدخول:
```
❌ يجب أن تظهر: "Account is disabled"
```

### 3. تحقق من الإحصائيات:
```
User Management:
  Total Users: 41
  Active: 40
  Inactive: 1 ✅
```

---

## 📞 الدعم

### الملفات المساعدة:
- **INACTIVE_ACCOUNTS_GUIDE.md** - دليل شامل
- **toggle_user_status.py** - سكريبت جاهز

### الأوامر المتاحة:
```bash
python toggle_user_status.py help
```

---

**الخلاصة**: استخدم Inactive بدلاً من Delete دائماً! 🎯
