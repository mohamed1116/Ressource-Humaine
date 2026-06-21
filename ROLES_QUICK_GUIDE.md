# 🔐 الفرق الأساسي بين Super Admin و Admin/HR

## 🎯 باختصار

### Super Admin (مدير النظام) 👑
```
✅ إدارة المستخدمين (إضافة/حذف/تعديل الأدوار)
✅ Activity Logs (سجلات النشاط)
✅ Broadcast Notifications (إشعارات جماعية)
✅ System Settings (إعدادات النظام)
✅ User Activity Dashboard
+ كل صلاحيات Admin/HR
```

### Admin/HR (مدير الموارد البشرية) 👔
```
✅ إدارة الموظفين
✅ الحضور والغياب
✅ الإجازات
✅ الرواتب
✅ التقييمات
✅ الشهادات
❌ لا يمكنه إدارة المستخدمين
❌ لا يمكنه الوصول لإعدادات النظام
```

---

## 📊 الصفحات الخاصة

### خاص بـ Super Admin فقط:
1. **User Management** - إدارة المستخدمين والأدوار
2. **Activity Logs** - سجلات نشاط المستخدمين
3. **Broadcast Notifications** - إشعارات جماعية
4. **System Settings** - إعدادات النظام
5. **Super Admin Dashboard** - إحصائيات النظام

### خاص بـ Admin/HR فقط:
1. **HR Dashboard** - إحصائيات الموارد البشرية
2. **Employee Management** - إدارة الموظفين
3. **Attendance** - الحضور والغياب
4. **Leaves** - الإجازات
5. **Payroll** - الرواتب

---

## 🎨 Sidebar المقترح

### Super Admin:
```
🏠 Dashboard
👥 User Management ⭐
📊 Activity Logs ⭐
📢 Broadcast ⭐
⚙️ Settings ⭐
━━━━━━━━━━━━━━
👔 Employees
📅 Attendance
🏖️ Leaves
💰 Payroll
```

### Admin/HR:
```
🏠 Dashboard
👔 Employees
📅 Attendance
🏖️ Leaves
💰 Payroll
📊 Evaluations
📜 Certificates
```

---

## 🔒 الفرق الرئيسي

| الوظيفة | Super Admin | Admin/HR |
|---------|-------------|----------|
| إدارة المستخدمين | ✅ | ❌ |
| حذف المستخدمين | ✅ | ❌ |
| تغيير الأدوار | ✅ | ❌ |
| Activity Logs | ✅ | ❌ |
| إعدادات النظام | ✅ | ❌ |
| إشعارات جماعية | ✅ | ❌ |
| إدارة الموظفين | ✅ | ✅ |
| الحضور والغياب | ✅ | ✅ |
| الإجازات | ✅ | ✅ |
| الرواتب | ✅ | ✅ |

---

## 💡 التطبيق

### إخفاء صفحات حسب الدور:
```typescript
{user.role === 'SUPER_ADMIN' && (
  <MenuItem to="/users">User Management</MenuItem>
)}

{user.role === 'ADMIN_HR' && (
  <MenuItem to="/employees">Employees</MenuItem>
)}
```

---

**الخلاصة**: Super Admin يدير النظام، Admin/HR يدير الموظفين! 🎯
