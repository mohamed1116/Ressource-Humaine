# اختبار API - User Management

## الخطوات للتحقق من عمل الصفحة:

### 1. تأكد من تشغيل Backend
```bash
cd hrms-backend
python manage.py runserver
```

### 2. تأكد من تشغيل Frontend
```bash
cd hrms-frontend
npm run dev
```

### 3. تسجيل الدخول
- افتح المتصفح على: http://localhost:5173
- سجل دخول بحساب Super Admin

### 4. الوصول لصفحة إدارة المستخدمين
- اذهب إلى: User Management
- يجب أن ترى قائمة المستخدمين من قاعدة البيانات

## الأخطاء الشائعة وحلولها:

### 1. لا تظهر المستخدمين (Loading users...)
**السبب**: مشكلة في الاتصال بـ Backend
**الحل**:
- تأكد من أن Backend يعمل على http://localhost:8000
- افتح Console في المتصفح (F12) وتحقق من الأخطاء
- تأكد من أن Token موجود في localStorage

### 2. خطأ 401 Unauthorized
**السبب**: المستخدم غير مصرح له
**الحل**:
- تأكد من أن المستخدم لديه صلاحيات Super Admin
- سجل خروج ثم سجل دخول مرة أخرى

### 3. خطأ 403 Forbidden
**السبب**: المستخدم ليس Super Admin
**الحل**:
- استخدم حساب Super Admin فقط

### 4. خطأ CORS
**السبب**: مشكلة في إعدادات CORS في Backend
**الحل**:
- تأكد من أن Frontend URL مضاف في CORS_ALLOWED_ORIGINS في settings.py

## اختبار API يدوياً:

### 1. جلب المستخدمين
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:8000/api/v1/auth/users/
```

### 2. إنشاء مستخدم جديد
```bash
curl -X POST -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{
  "first_name": "Test",
  "last_name": "User",
  "email": "test@example.com",
  "username": "testuser",
  "password": "testpass123",
  "role": "STUDENT",
  "is_active": true
}' http://localhost:8000/api/v1/auth/users/create/
```

### 3. تحديث مستخدم
```bash
curl -X PATCH -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{
  "first_name": "Updated",
  "last_name": "Name"
}' http://localhost:8000/api/v1/auth/users/USER_ID/
```

### 4. حذف مستخدم
```bash
curl -X DELETE -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:8000/api/v1/auth/users/USER_ID/
```

### 5. إعادة تعيين كلمة المرور
```bash
curl -X POST -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{
  "new_password": "newpassword123"
}' http://localhost:8000/api/v1/auth/users/USER_ID/reset-password/
```

## التحقق من Console في المتصفح:

افتح Console (F12) وابحث عن:
- ✅ `GET http://localhost:8000/api/v1/auth/users/ 200 OK`
- ❌ `GET http://localhost:8000/api/v1/auth/users/ 401 Unauthorized`
- ❌ `GET http://localhost:8000/api/v1/auth/users/ 403 Forbidden`

## حسابات Super Admin للاختبار:

تحقق من قاعدة البيانات للحصول على حساب Super Admin:
```bash
cd hrms-backend
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); [print(f'{u.email} - {u.role}') for u in User.objects.filter(role='SUPER_ADMIN')]"
```

## ملاحظات:
- تأكد من أن المستخدم الحالي لديه صلاحيات SUPER_ADMIN
- تأكد من أن Backend يعمل بدون أخطاء
- تأكد من أن Frontend يتصل بـ Backend الصحيح (تحقق من .env)
